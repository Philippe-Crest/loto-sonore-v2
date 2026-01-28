# Phase 2.2 — Tests manuels (player audio)

## Pré-requis

- Lancer le serveur local :
  ```bash
  php -S localhost:8000 -t public
  ```

## Tests principaux

- [ ] Le catalogue s’affiche comme avant (statut “Catalogue : 48 sons chargés”).
- [ ] Sélectionner un son puis cliquer “Lire le son” → le son se joue.
- [ ] Mettre en pause puis reprendre → OK.
- [ ] Changer de son pendant la lecture → l’ancien s’arrête, le nouveau démarre après clic.
- [ ] Le chargement audio passe par `audio.php?id=...` (vérifiable via DevTools réseau).

## Tests erreurs

- [ ] Forcer un `id` invalide (devtools) → message “Impossible de lire le son sélectionné.”
- [ ] Aucune URL MP3 directe visible dans le DOM ou le JS.
