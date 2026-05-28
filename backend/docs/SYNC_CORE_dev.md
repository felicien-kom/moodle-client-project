# Spécification Technique & Design — SYNC_CORE

Ce document synthétise les comportements attendus du front-end et du back-end pour implémenter la clé de voûte de notre client Moodle : **Le moteur de synchronisation hybride bidirectionnel et déconnecté**.

---

## 1. Objectifs de la Feature
Permettre à l'étudiant de travailler en toute autonomie sans réseau (consulter ses cours, lire des PDF déjà téléchargés, rédiger des devoirs compliqués) puis d'unifier à la demande ou de manière totalement automatique ses données avec le serveur Moodle distant dès qu'un canal réseau est rétabli.

---

## 2. Spécification des Flujos Globaux

### A. Déclenchement de la Synchronisation Hybride (Les Deux)
1. **Déclenchement Manuel (Bouton UI)** : L'élève peut cliquer à tout moment sur le bouton « Synchroniser mes cours » situé dans la topbar.
2. **Déclenchement Automatique (Reconnexion Réseau)** : Le frontend se branche sur l'API de connectivité du navigateur :
   ```typescript
   window.addEventListener('online', () => {
     // Notification discrète Toast : "Connexion rétablie. Synchronisation automatique..."
     triggerBackgroundSync();
   });
   ```

### B. Gestion des Conflits d'Édition (L'Interface de Résolution)
Si le backend renvoie un statut de synchronisation `CONFLICT` pour un devoir (par exemple : ébauche locale modifiée hors-ligne mais note ou texte édité indépendamment sur l'administration Moodle) :
* **Interdiction de l'écrasement aveugle**.
* L'interface affiche l'écran de résolution de conflit :
  * Présente la version d'ébauche locale rédigée par l'élève avec sa date de modification.
  * Présente la version présente en ligne sur le serveur académique.
  * Offre 2 choix d'actions clairs :
    1. *"Conserver mes modifications locales et écraser le serveur Moodle tại prochain envoi"*.
    2. *"Abandonner mon brouillon local et écraser ma base par les données du serveur"*.

---

## 3. Validations de formulaires et contraintes locales (Interdit de quota)
- **Aucune restriction de stockage cumulé** : Aucun quota n'est imposé sur l'ordinateur de l'élève.
- **Taille de fichiers devoirs** : Avant tout téléversement, le frontend valide que chaque fichier individuel respecte la contrainte retournée dans les métadonnées de l'assignment : `file.size <= assignment.maxFileSize` et que `files.length <= assignment.maxFiles`.

---

## 4. Checklist de Recette de l'Intégrateur
- [ ] Le bandeau `sync-status.tsx` s'anime correctement (flèches tournantes) en cas d'émission de l'événement SSE `progress`.
- [ ] La perte du réseau est interceptée proprement sans faire crasher l'interface (affichage immédiat du mode "Hors-Ligne").
- [ ] L'étudiant peut ouvrir directement un document PDF localisé sur son disque sans appel HTTP si sa clé `localPath` n'est pas nulle.
- [ ] Seuls les rôles `TEACHER` et `ADMIN` ont accès à l'interface locale d'évaluation des devoirs des élèves.
