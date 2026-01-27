# Loto Sonore V2

Socle projet “web PHP” sans framework. HTML/CSS/JS simples, compatible hébergement Gandi avec webroot `public/`.

## Démarrage local

Prérequis : PHP 8+ installé en local.

```bash
php -S localhost:8000 -t public
```

Puis ouvrir `http://localhost:8000`.

## Structure du dépôt

```
.
├── data/                   # données applicatives (hors webroot)
├── docs/                   # documentation
├── public/                 # webroot
│   ├── assets/
│   │   ├── css/
│   │   └── js/
│   ├── audio.php           # endpoint placeholder (HTTP 501)
│   └── index.php           # page d'accueil
└── storage/
    └── audio/              # sons hors webroot
        ├── animaux/
        └── bruits/
```

## Principe “audio hors webroot”

Les fichiers audio restent dans `storage/audio/` (et non dans `public/`).
L’accès se fera plus tard via `public/audio.php` pour éviter les URL directes.

## Déploiement SFTP (haut niveau)

1. Uploader le contenu du dépôt sur le serveur.
2. Configurer le webroot de l’hébergement sur le dossier `public/`.
3. Vérifier que `storage/` et `data/` restent en dehors du webroot.
4. Tester l’URL publique et l’endpoint `audio.php` (doit renvoyer 501).

## Documentation

- Règles : `docs/regles-du-jeu.md`
- Checklist de tests : `docs/checklist-tests.md`
