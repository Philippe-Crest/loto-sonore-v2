# Checklist tests — Phase 0

## Serveur local

- [ ] `php -S localhost:8000 -t public` démarre sans erreur.
- [ ] La page d’accueil s’affiche correctement.

## Frontend

- [ ] La console navigateur affiche `app ready`.
- [ ] Aucune erreur JS.
- [ ] Mise en page lisible sur mobile (largeur < 640px).

## Phase 1

- [ ] `GET /catalogue.php` renvoie 200 + JSON.
- [ ] L’UI affiche “Catalogue : 48 sons chargés”.
- [ ] Console : `catalogue loaded: 48`.
