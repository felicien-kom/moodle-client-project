# GUIDE DE TEST — Cours, Enrollment & Pull

## Étape 1 — Migration du schéma user

Le schéma user a changé (ajout de CourseEnrollment, Resource, Grade, nouveaux champs).
Il faut créer une nouvelle migration et l'appliquer.

```bash
# Créer la migration (depuis la racine du projet)
npm run db:migrate:user
# Nom suggéré : add_courses_resources_grades

# Régénérer le client Prisma user
npm run db:generate:user
```

**Si tu as déjà une base user existante (alice.db, bob.db)** créée avant ce changement,
elle ne sera pas automatiquement migrée. Deux options :

Option A — Supprimer et recréer le profil (plus simple en dev) :
```bash
# Supprimer les anciennes bases
rm data/alice_universite_fr.db

# Recréer le profil via l'API — migrateUserDb() appliquera le nouveau schéma
POST /api/auth/profile  { email, username, serverPassword, clientPassword }
```

Option B — Appliquer la migration sur la base existante :
```bash
USER_MIGRATION_DB_URL="file:./data/alice_universite_fr.db" \
PRISMA_TARGET=user \
  npx prisma migrate deploy
```

---

## Étape 2 — Relancer le serveur

```bash
npm run dev
```

Vérifier la console :
```
🎓 Moodle Client
   Local:   http://localhost:5000
   MOODLE   : http://ton-moodle.fr
```

---

## Étape 3 — Login (récupérer le token JWT)

```bash
curl -s -X POST http://localhost:5000/api/auth/login \
  -H "Content-Type: application/json" \
  -d '{"username":"alice","clientPassword":"LocalAlice123!"}' | jq .

# Stocker le token
TOKEN="eyJ..."
```

---

## Étape 4 — Consulter le catalogue de cours (online)

Nécessite connexion Moodle. Retourne les cours disponibles sans rien stocker.

```bash
# Liste tous les cours
curl -s -H "Authorization: Bearer $TOKEN" \
  "http://localhost:5000/api/courses/catalogue" | jq .

# Recherche par mot-clé
curl -s -H "Authorization: Bearer $TOKEN" \
  "http://localhost:5000/api/courses/catalogue?search=mathematiques" | jq .

# Par page
curl -s -H "Authorization: Bearer $TOKEN" \
  "http://localhost:5000/api/courses/catalogue?page=0&perPage=10" | jq .
```

**Résultat attendu :**
```json
{
  "total": 42,
  "courses": [
    {
      "serverId": 5,
      "title": "Mathématiques — Semestre 1",
      "shortName": "MATH101",
      "summary": "Introduction aux mathématiques...",
      "categoryId": 2,
      "imageUrl": "https://moodle.../courseimage.jpg"
    }
  ]
}
```

Note le `serverId` — c'est lui qu'on utilise pour s'inscrire.

---

## Étape 5 — S'inscrire à un cours (online)

```bash
# Remplacer 5 par le serverId du cours qui t'intéresse
curl -s -X POST \
  -H "Authorization: Bearer $TOKEN" \
  "http://localhost:5000/api/courses/5/enroll" | jq .
```

**Résultat attendu :**
```json
{
  "enrollment": {
    "id": 1,
    "courseServerId": 5,
    "enrolledOnServer": true,
    "syncEnabled": true
  },
  "message": "Enrolled successfully. Run sync to download course content."
}
```

**Si déjà inscrit :**
```json
{ "error": "Already enrolled in this course" }   HTTP 409
```

**Si le cours n'accepte pas le self-enrollment :**
```json
{ "error": "..." }   HTTP 400
```

Dans ce cas, l'admin Moodle doit activer le self-enrollment sur ce cours,
OU l'inscription doit être faite directement sur le serveur Moodle
(la sync la détectera automatiquement au prochain pull).

---

## Étape 6 — Lancer la sync (pull du contenu du cours)

```bash
# Via API
curl -s -X POST \
  -H "Authorization: Bearer $TOKEN" \
  "http://localhost:5000/api/sync/start" | jq .

# Récupérer le syncId
SYNC_ID="uuid-..."

# Suivre la progression SSE
curl -N -H "Authorization: Bearer $TOKEN" \
  "http://localhost:5000/api/sync/$SYNC_ID/progress"
```

**Events SSE attendus :**
```
event: progress
data: {"step":"INIT","status":"checking_server"}

event: progress
data: {"step":"INIT","status":"ready","servertime":1700000000}

event: progress
data: {"step":"PHASE","phase":"PUSH"}

event: progress
data: {"step":"PUSH","entity":"profile","status":"done","pushed":0}

event: progress
data: {"step":"PHASE","phase":"PULL"}

event: progress
data: {"step":"PULL","entity":"profile","status":"start"}

event: progress
data: {"step":"PULL","entity":"courses","status":"start"}

event: progress
data: {"step":"PULL","entity":"course","id":5,"title":"Mathématiques — Semestre 1"}

event: progress
data: {"step":"PULL","entity":"courses","status":"done","pulled":1}

event: progress
data: {"step":"PULL","entity":"modules","status":"start"}

event: progress
data: {"step":"PULL","entity":"quizzes","status":"start"}

event: progress
data: {"step":"PULL","entity":"assignments","status":"start"}

event: progress
data: {"step":"PULL","entity":"grades","status":"start"}

event: done
data: {"pushed":0,"pulled":47,"conflicts":0,"newCursor":1700000000}
```

**Via terminal :**
```bash
node scripts/sync.js alice@universite.fr
```

---

## Étape 7 — Consulter les cours locaux (offline)

Après la sync, tout est disponible hors ligne.

```bash
# Liste des cours inscrits et synchronisés
curl -s -H "Authorization: Bearer $TOKEN" \
  "http://localhost:5000/api/courses" | jq .

# Détail d'un cours avec modules, quiz, devoirs, ressources
curl -s -H "Authorization: Bearer $TOKEN" \
  "http://localhost:5000/api/courses/1" | jq .

# Quiz du cours (id local = 1)
curl -s -H "Authorization: Bearer $TOKEN" \
  "http://localhost:5000/api/courses/1/quizzes" | jq .

# Devoirs
curl -s -H "Authorization: Bearer $TOKEN" \
  "http://localhost:5000/api/courses/1/assignments" | jq .

# Ressources (PDFs, URLs, pages)
curl -s -H "Authorization: Bearer $TOKEN" \
  "http://localhost:5000/api/courses/1/resources" | jq .

# Notes
curl -s -H "Authorization: Bearer $TOKEN" \
  "http://localhost:5000/api/courses/1/grades" | jq .
```

---

## Étape 8 — Vérifier que l'inscription serveur existante est détectée

Si l'utilisateur était déjà inscrit à des cours sur Moodle avant d'installer ce client,
la sync les détecte automatiquement.

```bash
# Lancer une sync sur un compte déjà actif sur Moodle
node scripts/sync.js alice@universite.fr

# Vérifier que les cours ont été importés
curl -s -H "Authorization: Bearer $TOKEN" \
  "http://localhost:5000/api/courses" | jq '.courses | length'
# → nombre de cours auxquels alice est inscrite sur Moodle
```

---

## Étape 9 — Désactiver la sync d'un cours

```bash
# Désinscrire localement (ne désactive que la sync, le contenu reste)
curl -s -X DELETE \
  -H "Authorization: Bearer $TOKEN" \
  "http://localhost:5000/api/courses/5/enroll" | jq .
```

Après ça, le cours n'apparaît plus dans `GET /api/courses`
et n'est plus synchronisé.

---

## Étape 10 — Deuxième sync (vérifier le curseur)

```bash
node scripts/sync.js alice@universite.fr
```

Si rien n'a changé sur le serveur depuis la première sync :
```
↓ Pulling courses... 0 pulled
↓ Pulling modules... 0 pulled
↓ Pulling quizzes... 0 pulled
```

Le curseur évite de re-télécharger ce qui n'a pas changé.

---

## Erreurs fréquentes

| Erreur | Cause | Solution |
|--------|-------|---------|
| `Table 'CourseEnrollment' does not exist` | Migration pas appliquée | `npm run db:migrate:user` + recréer profil |
| `Enrollment failed on server` | Self-enrollment désactivé sur ce cours | S'inscrire depuis le serveur Moodle, la sync détectera l'inscription |
| `core_course_search_courses: Access control exception` | Service Moodle pas configuré | Activer la fonction dans Administration Moodle > Web services |
| `gradereport_user_get_grade_items: Access control exception` | Droits insuffisants | Normal sur certaines instances — les grades seront `[]`, pas d'erreur bloquante |
| Modules pullés mais `resource.moodleUrl` vide | Cours sans fichiers | Normal — certains cours n'ont que du texte |

---

## Structure des données après une sync complète

```
data/
  alice_universite_fr.db
    ├── LocalUser (1 entrée)
    ├── SyncCursor (curseur mis à jour)
    ├── SyncLog (historique)
    ├── CourseEnrollment (1 par cours inscrit)
    ├── Course (1 par cours)
    ├── Module (N par cours)
    ├── Resource (fichiers/URLs des modules)
    ├── Quiz (N par cours)
    ├── QuizQuestion (N par quiz)
    ├── QuizAttempt (tentatives de l'utilisateur)
    ├── Assignment (N par cours)
    ├── AssignmentSubmission (soumissions de l'utilisateur)
    ├── Grade (notes par activité)
    └── Annotation (notes personnelles — jamais synced)
```
