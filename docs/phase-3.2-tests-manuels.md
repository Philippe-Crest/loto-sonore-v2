# Phase 3.2 — Tests manuels (joueurs, états, victoire)

## Pré-requis

- Lancer le serveur local :
  ```bash
  php -S localhost:8000 -t public
  ```
- Navigateur conseillé : Chrome ou Firefox.
- Ouvrir DevTools (onglets Réseau + Console).

## Chargement et validation des planches

- [ ] Le statut "Catalogue : 48 sons chargés" s’affiche.
- [ ] La zone debug indique "Planches : chargées et valides."
- [ ] Si `data/planches.json` contient une erreur (son inconnu, duplication, < 6 sons), la zone debug affiche un message explicite et le démarrage est bloqué.

## Inscription des joueurs

- [ ] En état prêt, cliquer sur un bouton couleur ajoute le joueur (liste visible).
- [ ] Les doublons sont ignorés.
- [ ] Le 5e joueur est refusé (message debug).

## Pré-conditions de démarrage

- [ ] Catégorie = "Tous" → démarrage refusé avec message clair.
- [ ] Difficulté non sélectionnée → démarrage refusé.
- [ ] Moins de 2 joueurs inscrits → démarrage refusé.
- [ ] Catégorie spécifique + difficulté + ≥2 joueurs → démarrage OK.

## États et contrôles

- [ ] Démarrage → état en cours, tirage actif selon la difficulté.
- [ ] Pause → tirages stoppés + audio stoppé.
- [ ] Reprendre → tirages reprennent au bon rythme.
- [ ] Reset → retour à l’état prêt, joueurs/ historique/gagnant vidés.

## Revendication de victoire

- [ ] Pendant une partie, un joueur inscrit appuie sur sa couleur :
  - [ ] Si tous les sons de sa planche ont été joués → victoire validée, partie terminée.
  - [ ] Sinon → revendication refusée, la partie continue.

## Fin sans gagnant

- [ ] Épuiser le deck sans victoire → état terminé et message "personne n’a gagné" + debug explicite.

## Non-régressions majeures

- [ ] Tirage sans répétition conserve le comportement précédent.
- [ ] Lecture audio via `audio.php?id=...` uniquement.
