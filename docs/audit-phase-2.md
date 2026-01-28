# Audit de préparation Phase 2 — Lecture audio

Date : 28/01/2026

## 1) Résumé exécutif

- **Constats clés** : le catalogue JSON est centralisé dans `data/catalogue.json`, exposé via `public/catalogue.php`, validé côté JS (structure + total 48). Les MP3 sont stockés hors webroot dans `storage/audio/`.
- **Points bloquants** : aucun mécanisme de streaming ni lecture audio n’existe. L’endpoint `audio.php` est un placeholder (501). Aucun mécanisme de routage/rewriting n’est présent.
- **Décisions à prendre** : stratégie d’URL d’accès audio (id vs chemin), gestion de `Range`, politique de cache, et stratégie de sécurité (whitelist stricte des fichiers).

## 2) Constats détaillés

### A. Structure du projet et endpoints

1. **Emplacement des endpoints PHP** : dans `public/`.
2. **Endpoints existants et rôle** :
   - `public/index.php` : page d’accueil/UI (chargement catalogue + statut).
   - `public/catalogue.php` : expose le catalogue JSON (`data/catalogue.json`).
   - `public/audio.php` : placeholder 501 (pas de streaming).
3. **Webroot** : `public/` (documenté dans README et utilisé par `php -S ... -t public`). `storage/audio/` est en dehors du webroot.
4. **Routage / réécriture** : aucun fichier `.htaccess` ou configuration serveur détecté. Pas de front-controller.

### B. Catalogue sons (source de vérité)

1. **Fichier source** : `data/catalogue.json`.
2. **Structure d’une entrée** (exemple raccourci) :
   - Racine : `{ "version": 1, "modes": [...] }`
   - Mode : `{ "id": "animaux", "label": "Animaux", "sounds": [...] }`
   - Son : `{ "id": "a01", "label": "Abeille", "file": "animaux/abeille.mp3" }`
3. **Champs requis** :
   - `id` (string) : présent et stable, ex. `a01`, `b12`.
   - `label` : présent (nom affiché).
   - Catégorie : via `modes[].id` (`animaux`, `bruits_familiers`).
   - Résolution fichier : champ `file` (chemin relatif à `storage/audio/`).
4. **Validations existantes (Phase 1.1)** :
   - JS : `public/assets/js/catalogue.js` vérifie présence de `modes`, `mode.id`, `mode.label`, `mode.sounds`, puis `sound.id`, `sound.label`, `sound.file`, et le total `48`.
   - PHP : `public/catalogue.php` vérifie fichier, lecture, JSON valide, encodage JSON.

### C. Cohérence catalogue ↔ fichiers MP3

**Scan du dossier** `storage/audio/` :
- Total MP3 : 48
- Conventions de nommage : minuscules, underscores, pas d’accents, pas d’espaces.

**Correspondance** catalogue ↔ fichiers :
- Entrées catalogue : 48
- MP3 présents : 48
- Manquants : 0
- Orphelins : 0

**Tableau récapitulatif**

| Élément | Total | Détails |
| --- | ---: | --- |
| Entrées catalogue | 48 | `data/catalogue.json` |
| MP3 présents | 48 | `storage/audio/` |
| Manquants | 0 | Aucun |
| Orphelins | 0 | Aucun |

### D. Préparation “audio.php” (faisabilité technique)

1. **Endpoint audio existant** : `public/audio.php` (placeholder, 501).
2. **Pratiques PHP actuelles** :
   - `public/catalogue.php` : `Content-Type: application/json; charset=utf-8`, `Cache-Control: no-store`, erreurs HTTP 500 + JSON d’erreur.
   - `public/audio.php` : `Content-Type: text/plain; charset=utf-8`, code 501.
3. **Contraintes serveur/config** : aucune configuration ou directive trouvée dans le dépôt (pas de `.htaccess`). Aucune mention explicite d’output buffering ou compression.
4. **Recommandations techniques (basées sur constats)** :
   - Prévoir `Range` pour compatibilité lecteurs audio (seek, streaming) si utilisation de `<audio>`.
   - Lire par chunks pour éviter la charge mémoire (pas de lecture complète en mémoire).
   - Stratégie d’erreur : `400` si paramètres invalides, `404` si fichier absent, `416` pour range invalide.
   - Cache : `no-store` en dev, `private` ou `max-age` court en prod si nécessaire.

### E. Front / UI (préparation player)

1. **Localisation UI** : `public/index.php` (structure), `public/assets/css/app.css` (styles), `public/assets/js/app.js` (chargement catalogue + statut).
2. **Sélection d’un son** :
   - Pas de sélection de son ni d’`<audio>` actuellement.
   - Le front manipule `mode.id` via le `<select>` (valeurs `animaux`, `bruits_familiers`).
3. **Intégration possible d’un player minimal** :
   - Zone logique : sous le statut catalogue dans `public/index.php` ou dans `.card__body`.
   - Chargement via JS modulaires (`type="module"`).
4. **Messages d’erreur UI** :
   - `public/assets/js/app.js` met à jour un bloc statut avec classes `status--loading/success/error`.

## 3) Risques identifiés

- **Sécurité** : exposition potentielle de chemins si l’endpoint audio accepte un chemin arbitraire (risque de traversal). Nécessité d’une whitelist sur `catalogue.json`.
- **Compatibilité navigateur** : sans `Range`, certains navigateurs/lecteurs peuvent mal gérer le streaming ou le seek.
- **Performance** : lecture complète du fichier en mémoire si streaming naïf. Risque sur gros fichiers.
- **Cache** : cache public trop agressif peut révéler des URLs ou servir des fichiers obsolètes.

## 4) Décisions MOA à verrouiller

- **Clé d’accès audio** : via `sound.id` ou via `file` ?
- **Gestion du streaming** : support `Range` obligatoire ?
- **Politique d’erreur** : formats d’erreur JSON et codes HTTP attendus.
- **Politique de cache** : `no-store` systématique ou cache privé ?
- **Gestion des futurs sons UI** (victoire/défaite/choix) : intégrés au catalogue ou séparés.

## 5) Annexes

### Preuves et méthode de vérification

Commandes utilisées pour vérifier les constats (exemples reproductibles) :

- `find storage/audio -type f -name "*.mp3" | wc -l`
- `python3 - <<'PY'` (comparaison catalogue ↔ MP3, manquants/orphelins)
- `find . -name ".htaccess"`
- `ls public/` ou `find public -maxdepth 1 -name "*.php"`
- `sed -n '1,120p' public/audio.php` (vérification du 501 placeholder)

### Chemins importants

- `data/catalogue.json`
- `public/catalogue.php`
- `public/audio.php`
- `public/assets/js/catalogue.js`
- `public/assets/js/app.js`
- `storage/audio/`

### Extrait de structure (raccourci)

```json
{
  "version": 1,
  "modes": [
    {
      "id": "animaux",
      "label": "Animaux",
      "sounds": [
        { "id": "a01", "label": "Abeille", "file": "animaux/abeille.mp3" }
      ]
    }
  ]
}
```
