# Phase 2.1 — Tests manuels (audio.php)

## Pré-requis

- Lancer le serveur local :
  ```bash
  php -S localhost:8000 -t public
  ```

## Tests principaux

- [ ] `GET /audio.php?id=a01` retourne un MP3 lisible (statut 200).
- [ ] `GET /audio.php?id=a01` avec `Range: bytes=0-1023` retourne 206 et un extrait.
- [ ] `GET /audio.php?id=a01` avec `Range: bytes=0-` retourne 206.
- [ ] `GET /audio.php?id=a01` avec `Range: bytes=-1024` retourne 206.
- [ ] `GET /audio.php` sans `id` retourne 400 JSON.
- [ ] `GET /audio.php?id=inconnu` retourne 404 JSON.
- [ ] `GET /audio.php?id=a01` avec `Range` invalide retourne 416 JSON.

## Vérifications sécurité

- [ ] Impossible d’accéder à un fichier hors `storage/audio/`.
