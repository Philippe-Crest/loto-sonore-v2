# Phase 3.1 — Tests manuels (moteur de jeu)

Ce plan de tests valide l’absence de régression (catalogue + player) et le fonctionnement du moteur de jeu en modes manuel et automatique. Il vérifie aussi la non-exposition des MP3 et la gestion des cas limites côté UI.

## Pré-requis

- Lancer le serveur local :
  ```bash
  php -S localhost:8000 -t public
  ```
- Navigateur conseillé : Chrome ou Firefox.
- Ouvrir DevTools (onglets Réseau + Éléments).

## Tests de non-régression (Catalogue + Player)

- [ ] Le statut affiche “Catalogue : 48 sons chargés” et aucune erreur console.
- [ ] Sélectionner un son puis cliquer “Lire le son” → lecture OK.
- [ ] Pause / reprise via le lecteur audio natif → OK.
- [ ] Changer de son → l’ancienne lecture s’arrête / la nouvelle source est prête.
- [ ] Réseau : requêtes audio passent par `audio.php?id=...` (aucun MP3 direct).

## Tests principaux — Jeu (manuel)

- [ ] Au chargement : “Jeu : en attente.” visible.
- [ ] Démarrer avec **Catégorie = Tous** et **Difficulté = Manuel** :
  - [ ] “Restants / Total” cohérents (> 0).
  - [ ] Bouton “Tirage suivant” activable.
  - [ ] Un clic “Tirage suivant” :
    - [ ] Met à jour “Dernier tirage”.
    - [ ] Sélectionne le bon son dans `#sound-select`.
    - [ ] Met à jour la source audio (sans MP3 direct).
    - [ ] La lecture du son se lance automatiquement (si autorisée).
    - [ ] Note : l’interface Phase 2 reste indépendante.
- [ ] Effectuer une séquence d’environ 10 tirages → **aucune répétition**.
- [ ] Fin de partie (épuiser la pioche) :
  - [ ] Message “Tous les sons ont été tirés.”
  - [ ] Bouton “Tirage suivant” devient inutile / désactivé.
- [ ] Réinitialiser :
  - [ ] Dernier tirage repasse à “—”.
  - [ ] Compteurs à 0.
  - [ ] Statut “Jeu réinitialisé.”

## Tests principaux — Jeu (automatique)

- [ ] Démarrer en **Automatique lent** :
  - [ ] Premier tirage automatique.
  - [ ] Rythme ~12s entre tirages.
- [ ] Démarrer en **Automatique normal** :
  - [ ] Rythme ~8s entre tirages.
- [ ] Démarrer en **Automatique rapide** :
  - [ ] Rythme ~5s entre tirages.
- [ ] Le rythme concerne les tirages tant qu’il reste des sons (le dernier son peut se terminer naturellement).
- [ ] Lecture automatique :
  - [ ] Si autorisée → son démarre.
  - [ ] Si bloquée → message “Lecture automatique bloquée. Lancez la lecture via le lecteur audio.”
- [ ] Pause / Reprendre :
  - [ ] Pause stoppe les tirages.
  - [ ] Reprendre relance au bon rythme.
  - [ ] Reprendre relance les tirages ET reprend la lecture si elle avait été mise en pause.
- [ ] Réinitialiser en auto :
  - [ ] Stoppe les tirages.
  - [ ] Remet l’état.

## Tests de filtre catégorie

- [ ] Catégorie = Animaux → total attendu 24.
- [ ] Catégorie = Bruits familiers → total attendu 24.
- [ ] Catégorie = Tous → total attendu 48.
- [ ] Les tirages correspondent bien à la catégorie choisie (labels cohérents).

## Tests erreurs / sécurité (obligatoire)

- [ ] Aucune URL MP3 directe visible :
  - [ ] DevTools > Elements : pas d’URL `storage/audio/...`.
  - [ ] DevTools > Network : aucune requête MP3 directe, uniquement `audio.php?id=...`.
- [ ] Forcer un `id` invalide (DevTools sur `#sound-select`) puis “Lire le son” :
  - [ ] Message “Impossible de lire le son sélectionné.” (player) ou message jeu approprié.
- [ ] Simuler un échec de `catalogue.php` (DevTools) :
  - [ ] “Jeu indisponible : catalogue non chargé.”

## Notes / anomalies

- [ ] Navigateur + OS :
- [ ] Étapes de reproduction :
- [ ] Résultat attendu / obtenu :
