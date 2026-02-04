# Loto Sonore V2

Loto Sonore V2 est une **adaptation web pédagogique** du jeu physique *Loto Sonore* (éditeur Nathan), destinée principalement à un **usage avec des enfants**, dans des contextes de **psychomotricité, d’enseignement ou d’accompagnement**.

L’application permet de jouer à partir de **sons (animaux, bruits familiers)**, avec des **planches par couleur**, et une **revendication de victoire sonore**.

---

## Public visé

- Psychomotriciennes / psychomotriciens  
- Enseignants  
- Adultes accompagnants  
- Développeurs souhaitant comprendre ou maintenir le projet

👉 Pour l’usage terrain, se référer au **guide utilisateur** (voir plus bas).

---

## État du projet

- Application **fonctionnelle et utilisable**
- Tests manuels validés
- Code volontairement simple, sans framework
- Décisions de pilotage documentées
- Stabilisation préventive reportée (choix assumé)

---

## Guide utilisateur (non technique)

📘 **Guide utilisateur** :  
`docs/guide-utilisateur.md`

Ce document explique :
- comment lancer une partie,
- comment jouer avec des enfants,
- le rôle du bouton “Découvrir” (réservé pour une découverte guider par l'adulte),
- des conseils d’animation et de dépannage.

---

## Architecture technique (pour développeurs)

- Socle **PHP web simple**, sans framework
- HTML / CSS / JavaScript vanilla
- Compatible hébergement mutualisé (ex. Gandi)
- Webroot : dossier `public/`

### Principe “audio hors webroot”

Les fichiers audio sont stockés hors webroot :

```
storage/audio/
```
Ils ne sont **pas accessibles directement par URL**.  
Un endpoint PHP (`public/audio.php`) est prévu pour gérer l’accès de manière contrôlée.

---

## Démarrage en local

### Prérequis
- PHP 8+ installé en local

### Lancement
```bash
php -S localhost:8000 -t public
```

Puis ouvrir :
`http://localhost:8000`

---

## Structure du dépôt

```
.
├── data/                   # données applicatives (hors webroot)
├── docs/                   # documentation projet et utilisateur
│   ├── asset/              # images du jeu d'origine
├── public/                 # webroot
│   ├── assets/
│   │   ├── css/
│   │   └── img/
│   │   └── js/
│   │   └── sfx/
│   ├── audio.php           # endpoint audio (contrôlé)
│   └── index.php           # application
└── storage/
    └── audio/              # sons hors webroot
        ├── animaux/
        └── bruits/
```

---

## Déploiement (haut niveau)

1. Uploader le contenu du dépôt sur le serveur.
2. Configurer le webroot sur le dossier `public/`.
3. Vérifier que `storage/` et `data/` restent hors webroot.
4. Tester l’URL publique.
5. Vérifier que l’accès direct aux sons n’est pas possible.

---

## Documentation complémentaire

* 📘 Guide utilisateur : `docs/guide-utilisateur.md`
* 📄 Décisions projet : `docs/decisions.md`
* 🧪 Tests manuels : `docs/` (fichiers par phase)
* 📜 Règles du jeu : `docs/regles-du-jeu.md`

---

## Licence & crédits

* Développement : **Philippe Crest**
* Licence : **MIT**
* Dépôt : [https://github.com/Philippe-Crest/loto-sonore-v2](https://github.com/Philippe-Crest/loto-sonore-v2)
