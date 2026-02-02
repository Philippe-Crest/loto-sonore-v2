# Phase 4.1 — Tests manuels (perception immédiate & robustesse tactile)

## Pré-requis

- Lancer le serveur local :
  ```bash
  php -S localhost:8000 -t public
  ```
- Navigateur recommandé : Chrome / Firefox / Safari (mobile ou responsive).

---

## EJ — Feedback tactile immédiat (5 boutons)

- [ ] Coin rouge : appui → feedback visuel immédiat, relâchement → retour normal.
- [ ] Coin bleu : appui → feedback visuel immédiat, relâchement → retour normal.
- [ ] Coin vert : appui → feedback visuel immédiat, relâchement → retour normal.
- [ ] Coin jaune : appui → feedback visuel immédiat, relâchement → retour normal.
- [ ] Bouton central : appui → feedback visuel immédiat, relâchement → retour normal.

## EJ — Pause / reprise visible (sans texte)

- [ ] En pause : état visuel distinct perceptible sur EJ.
- [ ] En reprise : retour visuel net à l’état normal.

## EJ — Reset long (progression visuelle)

- [ ] Appui long central (~5s) : progression visuelle continue visible.
- [ ] Relâchement avant 5s : progression annulée, retour visuel normal.
- [ ] Seuil atteint : reset déclenché comme attendu.

## EJ — Robustesse tactile

- [ ] Double tap rapide sur un même bouton : une seule action prise en compte.
- [ ] Multi-touch (2 doigts) : un seul bouton pris en compte, pas d’effet de bord.

## EA + EC — Zoom navigateur

- [ ] Zoom 125% : tous les contrôles essentiels visibles et accessibles.
- [ ] Zoom 150% : tous les contrôles essentiels visibles et accessibles.
- [ ] Zoom 200% : tous les contrôles essentiels visibles et accessibles.

## EA + EC — Tabulation clavier

- [ ] EA : l’ordre de tabulation suit le flux logique des champs et actions.
- [ ] EA : aucun piège au clavier.
- [ ] EC : l’ordre de tabulation suit le flux logique des champs et actions.
- [ ] EC : aucun piège au clavier.

## EC — Navigation clavier (barre d’espace)

- [ ] Tabuler jusqu’au bouton Démarrer, appuyer sur Espace → action déclenchée une seule fois.
- [ ] Tabuler jusqu’au bouton Tirage suivant, appuyer sur Espace → action déclenchée une seule fois.
- [ ] Tabuler jusqu’au bouton Pause, appuyer sur Espace → action déclenchée une seule fois.
- [ ] Tabuler jusqu’au bouton Réinitialiser, appuyer sur Espace → action déclenchée une seule fois.
