# Phase 3.3 — Tests manuels (4 écrans + tactile)

## Pré-requis

- Lancer le serveur local :
  ```bash
  php -S localhost:8000 -t public
  ```
- Navigateur conseillé : Chrome ou Firefox (mode mobile recommandé).

## Navigation écrans

- [ ] Au chargement : écran EA visible, aucun autre écran affiché.
- [ ] EA → Règles : bouton "Règles" affiche ER.
- [ ] ER → EA : bouton retour revient à EA et reset complet.
- [ ] EA → Contrôle : bouton "Contrôle" affiche EC.
- [ ] EC → EA : bouton "Retour au jeu" revient à EA et reset complet.

## Sélection joueurs (EA)

- [ ] Boutons joueurs en grille 2x2, état visuel actif/inactif.
- [ ] Sélectionner 2 joueurs min pour activer la préparation.
- [ ] Désélectionner un joueur retire sa sélection visuelle.

## Préconditions Jouer (EA)

- [ ] Catégorie manquante → message bloquant sous "Jouer".
- [ ] Difficulté manquante → message bloquant.
- [ ] < 2 joueurs → message bloquant.
- [ ] Tout OK → message "Prêt à jouer".

## Démarrage et écran EJ

- [ ] Bouton "Jouer" démarre la partie et affiche EJ.
- [ ] EJ : aucun texte visible, uniquement boutons (coins + central).

## Boutons jeu (EJ)

- [ ] Appui court central → pause/reprise.
- [ ] Appui long central (~5s) → reset complet + retour EA.
- [ ] Appui sur un bouton couleur → revendication de victoire.

## Contrôle (EC)

- [ ] Interface debug visible, fonctionnalité inchangée.
- [ ] Statuts/debug restent visibles uniquement en EC.
- [ ] Catégorie : pas de “Tous”, placeholder “Choisir une catégorie” par défaut.
- [ ] Difficulté : placeholder “Choisir une difficulté” par défaut + option “Manuel” disponible.
- [ ] En EC, cliquer “Démarrer” démarre le jeu sans quitter EC.
- [ ] En EC + Manuel : “Tirage suivant” devient utilisable.
- [ ] En EC + Auto : “Pause” devient utilisable.

## Navigation navigateur

- [ ] Rechargement / fermeture → avertissement "La partie sera interrompue et perdue."
- [ ] Bouton retour navigateur → avertissement, annulation possible sans perdre l’état.

## Sons système

- [ ] Sélection joueur EA → `choix.mp3`
- [ ] Désélection joueur EA → `choix.mp3`
- [ ] Ajout/retrait joueur via EC → `choix.mp3`
- [ ] Victoire validée → `victoire.mp3`
- [ ] Revendication incorrecte → `defaite.mp3`
- [ ] Fin sans gagnant → `defaite.mp3`

## Audio SFX (exclusif + fin de deck)

- [ ] En EJ, lancer un son long, appuyer sur une couleur → son principal en pause, SFX joué, reprise au même endroit.
- [ ] En EJ, un appui couleur ne chevauche jamais le son principal : pause confirmée puis reprise au même timestamp.
- [ ] Revendication incorrecte → même comportement (pause → SFX défaite → reprise).
- [ ] Épuiser le deck sans gagnant → `defaite.mp3` joue après la fin du tout dernier son.
- [ ] Revendication “sur le fil” possible avant la fin du dernier son (SFX défaite ne se déclenche qu’après).
- [ ] En auto rapide, pendant le SFX, aucun tirage suivant ne se déclenche.
- [ ] Après la fin du SFX, le jeu reprend au bon rythme (tirage suivant après reprise moteur).
