# GUIDE DE TEST — Multi-DB & Multi-Profils

---

## Comment fonctionne la configuration — à lire en premier

### Le `.env` : configuré une seule fois, jamais retouché pour les migrations

Le `.env` contient uniquement la configuration de ton application :
- `MOODLE_URL`, `MOODLE_SERVICE` → ton serveur Moodle
- `DATABASE_DIR` → dossier où sont stockées les bases SQLite
- `JWT_SECRET`, `CLIENT_PORT`, `CORS_ORIGIN` → config du serveur

**`DATABASE_URL` n'existe pas dans ce projet.** C'était la variable historique de Prisma 1-6.
Prisma 7 utilise l'adapter libsql configuré dans `prisma.config.js`. Tu n'as rien à changer dans le `.env` pour les commandes migrate/generate.

### Variables temporaires CLI (`PRISMA_TARGET`, `USER_MIGRATION_DB_URL`)

Ces variables ne vont **jamais** dans le `.env`. Elles sont injectées temporairement par `cross-env` uniquement pour la durée d'une commande CLI. Dès que la commande se termine, elles disparaissent.

```
cross-env PRISMA_TARGET=user npx prisma generate
    ↑
    Injecte PRISMA_TARGET=user juste pour cette commande
    Ton .env n'est pas touché
```

`prisma.config.js` lit `PRISMA_TARGET` pour savoir quel schéma cibler :
- Pas de `PRISMA_TARGET` (ou `master`) → schéma `prisma/master/schema.prisma`, base `data/master.db`
- `PRISMA_TARGET=user` → schéma `prisma/user/schema.prisma`, base définie par `USER_MIGRATION_DB_URL`

### Bases SQLite créées automatiquement

libsql crée automatiquement un fichier `.db` s'il n'existe pas encore. Tu ne crées jamais les fichiers `.db` à la main. Tu passes juste un chemin.

---

## Prérequis

- Node.js 22+
- Serveur Moodle accessible avec Web Services activés (`moodle_mobile_app`)
- `.env` créé et rempli (une seule fois)

---

## ÉTAPE 0 — Setup initial

```bash
cd moodle-client

# Installer les dépendances (inclut cross-env pour la compatibilité Windows/Mac/Linux)
npm install

# Créer le .env (une seule fois — ne plus y toucher pour les migrations)
cp .env.example .env
```

Remplir dans `.env` :
```env
NODE_ENV=development
CLIENT_PORT=5001
DATABASE_DIR=./data
MOODLE_URL=http://localhost/moodle        ← adapter à ton instance
MOODLE_SERVICE=moodle_mobile_app
JWT_SECRET=une_longue_chaine_aleatoire
JWT_EXPIRES_IN=7d
CORS_ORIGIN=http://localhost:3000,http://localhost:5173
```

---

## ÉTAPE 1 — Générer les deux clients Prisma

```bash
npm run db:generate
```

Ce que fait cette commande :
1. `prisma generate` → lit `prisma/master/schema.prisma` → génère `prisma/master/generated/`
2. `cross-env PRISMA_TARGET=user prisma generate` → lit `prisma/user/schema.prisma` → génère `prisma/user/generated/`

**Vérifier :**
```bash
ls prisma/master/generated/    # doit contenir index.js
ls prisma/user/generated/      # doit contenir index.js
```

---

## ÉTAPE 2 — Créer la base master et ses tables

```bash
npm run db:migrate:master
# Prisma demande un nom de migration → taper : init  puis Entrée
```

Ce que fait cette commande :
- `prisma.config.js` voit `PRISMA_TARGET` absent → cible le schéma master
- libsql crée `data/master.db` s'il n'existe pas
- Prisma crée le dossier `prisma/master/migrations/` avec le SQL
- Prisma applique ce SQL sur `data/master.db`

**Vérifier :**
```bash
ls data/master.db
ls prisma/master/migrations/
```

---

## ÉTAPE 3 — Créer les fichiers de migration user

```bash
npm run db:migrate:user
# Prisma demande un nom de migration → taper : init  puis Entrée
```

Ce que fait cette commande :
- `cross-env PRISMA_TARGET=user` → `prisma.config.js` cible le schéma user
- libsql crée `data/_migration_template.db` (base temporaire pour le CLI)
- Prisma crée le dossier `prisma/user/migrations/` avec le SQL du schéma user
- Prisma applique ce SQL sur `_migration_template.db`

**Vérifier :**
```bash
ls prisma/user/migrations/     # doit contenir un dossier avec migration.sql
```

Nettoyer la base temporaire (elle ne sert qu'au CLI, pas à l'application) :
```bash
rm -f data/_migration_template.db
```

**Ce dossier `prisma/user/migrations/` est crucial.** C'est lui que `migrateUserDb()` utilise dans `createProfile` pour initialiser chaque nouvelle base utilisateur.

---

## ÉTAPE 4 — Vérifier la migration user en isolation

Cette étape simule exactement ce que `createProfile` fait côté serveur quand tu crées un nouveau profil.

**Explication complète de ce qui va se passer :**

1. Tu fournis un chemin vers un fichier `.db` qui n'existe pas encore
2. libsql crée automatiquement ce fichier vide
3. Prisma lit `prisma/user/migrations/` et exécute le SQL sur ce fichier
4. Le fichier contient maintenant toutes les tables du schéma user

**Comment Prisma sait quelle base cibler ?** Parce que `USER_MIGRATION_DB_URL` est la seule information de connexion que `prisma.config.js` reçoit quand `PRISMA_TARGET=user`. Il ne peut pas cibler autre chose.

### Mac / Linux :
```bash
USER_MIGRATION_DB_URL="file:./data/test_alice.db" \
PRISMA_TARGET=user \
  npx prisma migrate deploy
```

### Windows PowerShell :
```powershell
$env:USER_MIGRATION_DB_URL="file:./data/test_alice.db"
$env:PRISMA_TARGET="user"
npx prisma migrate deploy
```

### Windows CMD :
```cmd
set USER_MIGRATION_DB_URL=file:./data/test_alice.db && set PRISMA_TARGET=user && npx prisma migrate deploy
```

**Vérifier :**
```bash
ls data/test_alice.db    # le fichier a été créé automatiquement par libsql
```

**Vérifier les tables créées (optionnel) :**
```bash
USER_MIGRATION_DB_URL="file:./data/test_alice.db" \
PRISMA_TARGET=user \
  npx prisma studio
# Ouvre l'interface graphique — toutes les tables doivent apparaître : LocalUser, Course, Quiz, etc.
```

Nettoyer après le test :
```bash
rm -f data/test_alice.db
```

**Résultat attendu :** aucune erreur, toutes les tables créées. Si cette étape réussit, `createProfile` fonctionnera.

---

## ÉTAPE 5 — Lancer le serveur

```bash
npm run dev
```

**Résultat attendu :**
```
🎓 Moodle Client
   Local:   http://localhost:5001
   ENV      : development
   MOODLE   : http://localhost/moodle
   SERVICE  : moodle_mobile_app
   DATA DIR : ./data
```

---

## ÉTAPE 6 — Créer le premier profil (Alice)

```bash
curl -s -X POST http://localhost:5001/api/auth/profile \
  -H "Content-Type: application/json" \
  -d '{
    "email": "alice@universite.fr",
    "username": "alice",
    "serverPassword": "MotDePasseMoodle",
    "clientPassword": "LocalAlice123!"
  }' | jq .
```

**Ce qui se passe côté serveur :**
1. Validation credentials Moodle → token obtenu
2. `core_webservice_get_site_info` → userid, fullname
3. Création entrée dans `data/master.db`
4. `migrateUserDb("file:./data/alice_universite_fr.db")` :
   - libsql crée `data/alice_universite_fr.db`
   - Prisma applique `prisma/user/migrations/` sur cette base
   - Toutes les tables user sont créées
5. `LocalUser` créé dans `data/alice_universite_fr.db`
6. JWT local retourné

**Vérifier :**
```bash
ls data/
# master.db   alice_universite_fr.db
```

---

## ÉTAPE 7 — Créer un second profil (Bob)

```bash
curl -s -X POST http://localhost:5001/api/auth/profile \
  -H "Content-Type: application/json" \
  -d '{
    "email": "bob@universite.fr",
    "username": "bob",
    "serverPassword": "MotDePasseBob",
    "clientPassword": "LocalBob456!"
  }' | jq .
```

```bash
ls data/
# master.db   alice_universite_fr.db   bob_universite_fr.db
```

Les trois bases sont indépendantes. Alice et Bob ne partagent aucune donnée.

---

## ÉTAPE 8 — Vérifier le registre des profils

```bash
curl -s http://localhost:5001/api/auth/profiles | jq .
```

---

## ÉTAPE 9 — Vérifier l'isolation entre profils

```bash
TOKEN_ALICE=$(curl -s -X POST http://localhost:5001/api/auth/login \
  -H "Content-Type: application/json" \
  -d '{"username":"alice","clientPassword":"LocalAlice123!"}' | jq -r '.token')

TOKEN_BOB=$(curl -s -X POST http://localhost:5001/api/auth/login \
  -H "Content-Type: application/json" \
  -d '{"username":"bob","clientPassword":"LocalBob456!"}' | jq -r '.token')

curl -s -H "Authorization: Bearer $TOKEN_ALICE" http://localhost:5001/api/auth/me | jq .user.email
# "alice@universite.fr"

curl -s -H "Authorization: Bearer $TOKEN_BOB" http://localhost:5001/api/auth/me | jq .user.email
# "bob@universite.fr"
```

---

## ÉTAPE 10 — Tester la protection contre les syncs simultanées

```bash
# Lancer une sync
SYNC_ID=$(curl -s -X POST \
  -H "Authorization: Bearer $TOKEN_ALICE" \
  http://localhost:5001/api/sync/start | jq -r '.syncId')

# Tenter d'en lancer une seconde → doit retourner HTTP 409
curl -s -X POST \
  -H "Authorization: Bearer $TOKEN_ALICE" \
  http://localhost:5001/api/sync/start | jq .
# { "error": "A sync is already running...", "syncId": "..." }

# Suivre la progression
curl -N -H "Authorization: Bearer $TOKEN_ALICE" \
  "http://localhost:5001/api/sync/$SYNC_ID/progress"
```

---

## ÉTAPE 11 — Script terminal

```bash
node scripts/sync.js --list
node scripts/sync.js alice@universite.fr
node scripts/sync.js bob@universite.fr
```

---

## Déploiement en production — résumé des commandes

```bash
# Une seule fois au déploiement initial :
npm install
npm run db:generate          # génère les deux clients Prisma
npm run db:migrate:master    # crée data/master.db
npm run db:migrate:user      # crée prisma/user/migrations/
rm -f data/_migration_template.db  # nettoyer la base temporaire CLI
npm start

# Les bases user (alice.db, bob.db...) sont créées automatiquement par createProfile.
# Zéro intervention manuelle pour chaque nouvel utilisateur.
```

Si tu modifies le schéma user plus tard :
```bash
npm run db:migrate:user      # crée la nouvelle migration SQL
npm run db:generate:user     # régénère le client Prisma
# Les nouvelles bases user créées après ce point bénéficient automatiquement des nouvelles tables.
# Les bases existantes doivent être migrées séparément (à gérer avec un script de migration).
```

---

## Erreurs fréquentes

| Erreur | Cause | Solution |
|--------|-------|----------|
| `P1012: url is no longer supported` | `url=` dans le schéma | Retirer `url` du `datasource db {}` dans les deux schémas |
| `Cannot find module '.../generated/index.js'` | generate pas lancé | `npm run db:generate` |
| `Table 'LocalUser' does not exist` | migrations user absentes | Vérifier `prisma/user/migrations/` puis relancer l'étape 3 |
| `Failed to migrate user database` | migrate deploy échoue | Tester l'étape 4 en isolation pour diagnostiquer |
| `cross-env: command not found` | package pas installé | `npm install` |
| `Invalid login` depuis Moodle | mauvais credentials | Vérifier username/password sur Moodle directement |