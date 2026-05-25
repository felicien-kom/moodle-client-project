# Documentation de la Fonctionnalité : Synchronisation Hors-Ligne des Devoirs (Assignments & Submissions)

## 1. L’objectif de la fonctionnalité

**À quoi elle sert :**  
Cette fonctionnalité permet aux apprenants évoluant dans des environnements avec connectivité instable ou absente (Offline-First) de récupérer les devoirs déposés par leurs enseignants sur l'instance Moodle, d'en prendre connaissance, d'y répondre (sous forme de texte ou de fichiers) de manière 100% hors-ligne, puis d'envoyer (Push) leur copie à Moodle une fois le réseau rétabli.

**Besoin métier couvert :**  
Garantir la continuité pédagogique asynchrone des évaluations. Un étudiant doit pouvoir rédiger son devoir, l'enregistrer en brouillon (`DRAFT`) ou le rendre (`SUBMITTED`), et voir la note corrigée par le professeur plus tard, tout cela via une base SQLite locale qui se synchronise intelligemment avec l'API Web Services de Moodle.

**Cas d'usage principaux :**
- Récupérer les nouveaux énoncés Moodle (PULL) 
- Rédiger et modifier un devoir sans internet (Local DB)
- Envoyer un rendu Moodle quand le réseau revient (PUSH)
- Récupérer la correction et la note (PULL)
- Gérer les conflits si l'étudiant a altéré son devoir à la fois sur le web Moodle et en local.

**Ce qu’elle ne doit PAS faire :**
- Écraser les notes données par le professeur : les notes sont en lecture seule côté étudiant.
- Télécharger les copies des autres étudiants.

---

## 2. L’état actuel du projet concernant cette fonctionnalité

**Ce qui existe déjà (Totalement implémenté et testé) :**
- **Architecture de bases isolées :** Une base SQLite par étudiant, instanciée à la volée.
- **Pull des Devoirs :** Récupération de l'énoncé du devoir (`mod_assign_get_assignments`).
- **Pull des Soumissions & Notes :** Double récupération stricte des textes de soumissions (`mod_assign_get_submissions`) ET des notes (`mod_assign_get_grades`).
- **Push des Soumissions locales :** Détection des devoirs finis hors-ligne (`server_id: null`) et envoi API avec `mod_assign_save_submission` suivi de `mod_assign_submit_for_grading`.
- **Résilience Réseau :** Backoff exponentiel implémenté dans `moodleApi.js` pour gérer les micro-coupures au moment de la synchronisation.

**Ce qui manque encore (À faire) :**
- **Gestion des Pièces Jointes :** Actuellement fonctionnel et testé intensivement pour l'option "Texte en ligne" (HTML), mais le PULL et le PUSH des fichiers (`filePlugin` attaché au devoir) restent potentiellement à finaliser ou vérifier dans Moodle.
- **L'intégration Frontend :** L'UI en Vue.js doit encore être branchée pour afficher et permettre de manipuler ces APIs (bien que la donnée SQLite soit parfaitement modélisée).

**Modules / Fichiers concernés :** 
- `backend/src/sync/pull/pullAssignments.js`
- `backend/src/sync/push/pushAssignments.js`
- `backend/prisma/user/schema.prisma`

---

## 3. L’architecture et le flux de fonctionnement

Le mécanisme de synchronisation s'inscrit dans un flux bidirectionnel asynchrone dirigé par le `Sync Engine` (`backend/src/sync/engine.js`). Le sens de synchronisation est **TOUJOURS Push EN PREMIER, puis Pull**.

1. **Déclenchement :** Demande de synchronisation via réseau (Script Manuel ou Frontend).
2. **Phase PUSH :**
   - L'algorithme lit la base SQLite pour trouver les `AssignmentSubmission` dont `sync_status = 'PENDING_PUSH'`.
   - **Nouveau devoir :** Si la ligne a un `server_id = null`, c'est du 100% hors-ligne non synchronisé. Un envoi direct est déclenché.
   - **Conflits (Modification offline d'un devoir déjà déposé) :** On vérifie la date de modification Moodle. Règle "Client Wins" appliquée en cas de litige local vs web, afin d'éviter les pertes de textes non validés par l'étudiant à cause d'une rustine serveur.
   - Mise à jour Moodle avec renvoi via Moodle Web Service, puis mise à jour du `server_id` local avec la réponse Moodle.
3. **Phase PULL :**
   - Récupération de la liste des cours inscrits depuis le registre SQLite local.
   - Demande API Moodle de l'ensemble des `Assignments` de ces cours.
   - Pour chaque `Assignment`, Moodle Fetch des `AssignmentsSubmissions` et `AssignmentsGrades`.
   - L'algorithme filtre drastiquement ces listes pour ne cibler que l'ID de l'utilisateur concerné.
   - Insertion/Update (`UPSERT` de Prisma Prisma) via un croisement `server_timemodified` pour assurer l'idempotence.
4. **Conclusion :** Le `cursor` (horodatage serveur du serveur Moodle) est mis à jour en local pour ne pas re-télécharger ces éléments à la prochaine boucle.

---

## 4. Les mécanismes techniques à comprendre avant de développer

- **Authentification et Requêtage Moodle (`moodleApi.js`) :** L'API Moodle renvoie un HTTP 200 constant, même lors d'une erreur. C'est l'examen du Body (ex: clé `exception` ou `errorcode`) qui détermine l'échec. Les requêtes sont encapsulées dans un format strict URL-encoded Bracket Notation.
- **Calcul du "Cursor" :** On ne fait confiance qu'au "Time" du Serveur Moodle renvoyé dans le Header HTTP `Date`. On ne dépend JAMAIS des horloges des tablettes/PC Offline des étudiants pour limiter les corruptions temporelles.
- **Cycle de Vie d'une Soumission (SubmissionState):**
  1. `DRAFT` : Brouillon, peut être modifié ad infinitum.
  2. `SUBMITTED` : Finalisé, en attente de correction par le prof (apporte l'appel API `mod_assign_submit_for_grading` en plus).
  3. `GRADED` : Corrigé par le professeur, est accompagné d'un `grade` et d'un `gradedAt`.
- **Règle de Timemodified combinée :** Dans Moodle, noter un devoir et soumettre un devoir sont deux actions distinctes. Le timestamp de modification local calculé est `Math.max(submission.timemodified, grade.timemodified)`.

---

## 5. Les fichiers importants à connaître

### `backend/src/sync/pull/pullAssignments.js`
- **Rôle :** Orchestre le téléchargement des énoncés de devoirs ainsi que des copies étudiantes avec leurs notes. 
- **Point de vigilance :** Ne surtout pas casser la logique de filtrage par `userid` (cf. Ligne croisant l'ID local Moodle) et le croisement des listes entre le tableau des Submissions et des Grades. 

### `backend/src/sync/push/pushAssignments.js`
- **Rôle :** Séparer les brouillons locaux en attente (`PENDING_PUSH`) et les injecter un par un dans le Moodle distant via Web Services API.
- **Ce qu’il faut modifier** (Pour de futures évolutions) : Si la feature Offline des "Fichiers" (PDFs, Images jointes) est greffée, ce script devra gérer l'upload multipart Moodle vers l'API des `draft_files` avant d'attacher le fichier via son `itemid` à la demande de `mod_assign_save_submission`.

### `backend/src/config/moodleApi.js`
- **Rôle :** Cœur du dialogue d'API. Tous les calls réseau transitent par ici.
- **Mécanisme à conserver :** Gère un Exponential Backoff (`sleep()`). Indispensable pour ne pas faire crasher l'app lors d'une coupure Wifi rurale lors du Push d'une grosse soumission.

### `backend/prisma/user/schema.prisma`
- **Rôle :** Modélisation de base de l'application cliente sur l'appareil. Table `AssignmentSubmission` (avec ses attributs nullables : texts, states, files).

---

## 6. Les cas particuliers et points de vigilance

### 1. Renvois exhaustifs "Fantômes" de l'API Moodle (🚨 CRITIQUE)
Lors d'un appel à `mod_assign_get_submissions`, par défaut, Moodle n'isole pas la réponse pour l'utilisateur qui fait l'appel. Si l'utilisateur est un admin ou un compte partiel sans restrictions agressives de droits, l'API renvoie les soumissions de *toute* la classe. Il est vital de filtrer le retour Array par `s.userid === user.moodleUserId`. Sans ce filtre local, des collisions de `server_id` causent un crash SQLite de contraintes d'unicité `Unique Constraint`. 

### 2. Le double cloisonnement Note / Remise
La note d'une copie étudiante est introuvable dans l'appel `mod_assign_get_submissions`. Il est obligatoire de demander la note de manière superposée via un appel explicite à `mod_assign_get_grades` puis de fusionner les attributs de cet étudiant avant l'_upsert_ Prisma. 

### 3. Effet de bord du réglage professeur Moodle
Pour que la soumission de devoir sous format "Editeur texte" fonctionne, le professeur doit absolument autoriser la case à cocher **"Texte en ligne" (Online text)** lors de la création du devoir sur Moodle (sinon l'API refuse de prendre le corps du texte silencieusement au point `.value`, le retournant systématiquement nul localement au `Pull`).

### 4. Différence de Curseurs lors d'évolutions de tests locaux
Lors de tests locaux (avec de fausses données saisies en base sans interface front ou via `node -e`), si les entités locales se retrouvent avec en décalage de temps d'horloge serveur par rapport au `SyncCursor`, le mécanisme de Push/Pull les ignorera. En cas de blocage en debug, il faut remettre le cursor à zéro pour forcer une revérification exhaustive.