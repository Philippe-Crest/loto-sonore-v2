<?php

declare(strict_types=1);

header('X-Robots-Tag: noindex, nofollow');

?>
<!DOCTYPE html>
<html lang="fr">

<head>
    <meta charset="utf-8">
    <meta name="viewport" content="width=device-width, initial-scale=1">
    <meta name="robots" content="noindex, nofollow">
    <title>Loto Sonore</title>
    <link rel="stylesheet" href="/assets/css/app.css">
    <link rel="icon" type="image/png" href="/favicon.png">
    <link rel="apple-touch-icon" sizes="76x76" href="/apple-touch-icon-76x76.png">
    <link rel="apple-touch-icon" sizes="120x120" href="/apple-touch-icon-120x120.png">
    <link rel="apple-touch-icon" sizes="152x152" href="/apple-touch-icon-152x152.png">
    <link rel="apple-touch-icon" sizes="180x180" href="/apple-touch-icon-180x180.png">
</head>

<body>
    <main class="app">
        <section id="screen-home" class="screen screen--home is-active">
            <header class="home__header">
                <div class="home__top">
                    <button class="btn btn--ghost btn--small btn--control" type="button" data-nav="control">Découvrir</button>
                </div>
                <div class="home__title-row">
                    <h1 class="home__title">Loto Sonore</h1>
                    <button class="btn btn--ghost btn--small" type="button" data-nav="rules">Règles</button>
                </div>
                <p class="home__lead">Préparez la partie et lancez le jeu.</p>
            </header>

            <div class="home__body">
                <div class="field">
                    <label for="home-category">Découvrir</label>
                    <select id="home-category" name="home-category">
                        <option value="">Choisir une catégorie</option>
                        <option value="animaux">Animaux</option>
                        <option value="bruits_familiers">Bruits familiers</option>
                    </select>
                </div>

                <div class="field">
                    <label for="home-difficulty">Difficulté</label>
                    <select id="home-difficulty" name="home-difficulty">
                        <option value="">Choisir une difficulté</option>
                        <option value="auto-slow">Automatique lent</option>
                        <option value="auto-normal">Automatique normal</option>
                        <option value="auto-fast">Automatique rapide</option>
                    </select>
                </div>

                <div class="home__players">
                    <p class="home__label">Joueurs (2 à 4)</p>
                    <div class="home__player-grid" role="group" aria-label="Sélection des joueurs">
                        <button class="player-toggle player-toggle--rouge" type="button" data-player-toggle="rouge" aria-pressed="false">
                            <span class="sr-only">Joueur rouge</span>
                        </button>
                        <button class="player-toggle player-toggle--bleu" type="button" data-player-toggle="bleu" aria-pressed="false">
                            <span class="sr-only">Joueur bleu</span>
                        </button>
                        <button class="player-toggle player-toggle--vert" type="button" data-player-toggle="vert" aria-pressed="false">
                            <span class="sr-only">Joueur vert</span>
                        </button>
                        <button class="player-toggle player-toggle--jaune" type="button" data-player-toggle="jaune" aria-pressed="false">
                            <span class="sr-only">Joueur jaune</span>
                        </button>
                    </div>
                </div>

                <button class="btn home__play" type="button" id="home-play">Jouer</button>
                <p class="home__message" data-home-message>Choisissez une catégorie, une difficulté et 2 joueurs.</p>
            </div>
        </section>

        <section id="screen-game" class="screen screen--game">
            <button class="game-pad game-pad--corner game-pad--rouge" type="button" data-claim-color="rouge" aria-label="Bouton rouge"></button>
            <button class="game-pad game-pad--corner game-pad--bleu" type="button" data-claim-color="bleu" aria-label="Bouton bleu"></button>
            <button class="game-pad game-pad--corner game-pad--vert" type="button" data-claim-color="vert" aria-label="Bouton vert"></button>
            <button class="game-pad game-pad--corner game-pad--jaune" type="button" data-claim-color="jaune" aria-label="Bouton jaune"></button>
            <button class="game-pad game-pad--center" type="button" data-game-central aria-label="Bouton central"></button>
        </section>

        <section id="screen-rules" class="screen screen--rules">
            <div class="rules">
                <button class="btn btn--ghost btn--small" type="button" data-nav="home">Retour</button>
                <h2>Loto Sonore</h2>
                <p>Le loto sonore se joue de 2 à 4 joueurs. <br /> Choisissez une catégorie (animaux ou bruits familiers) et une vitesse (lent, normal, rapide), puis les enfants s'inscrivent en touchant une couleur.</p>
                <p>Cliquez sur jouer pour commencer la partie.</p>
                <p>Les sons sont tirés au hasard, sans répétition. <br /> L'enfant ferment sur sa planche le volet du son qu'il a reconnu.</p>
                <p>Quand un enfant pense que tous les sons de sa planche ont été joués, il touche sa couleur sur l'écran pour obtenir la victoire. <br />Le son de la victoire ou défait retenti selon qu'il ait raison ou tord et la partie continue pour tous les participant.es.</p>
                <p>Quand tous les sons sont joués sans qu'un enfant ait réclamé la victoire, la partie s'arrête et le son de la défaite retenti.</p>
                <p>Le bouton central orange permet de mettre le jeu en pause et un appui prolongé (4s) sur ce bouton arrête le jeu et revient à la page d'accueil du jeu.</p>
                <p>Développeur : Philippe Crest.</p>
                <p>Sons utilisés : domaine public / libre de droit.</p>
                <p>Adaptation web du boîtier du jeu <em>Loto Sonore</em> de l’éditeur Nathan, afin d’avoir des sons de meilleure qualité.</p>
                <img class="rules__image" src="/assets/img/loto-sonore.jpg" alt="Boîte du jeu Loto Sonore">
                <p class="rules__meta">Licence MIT — GitHub : <a href="https://github.com/Philippe-Crest/loto-sonore-v2" rel="noopener noreferrer">https://github.com/Philippe-Crest/loto-sonore-v2</a></p>
            </div>
        </section>

        <section id="screen-control" class="screen screen--control">
            <div class="control">
                <div class="control__header">
                    <h2>Découvrir</h2>
                    <button class="btn btn--ghost btn--small" type="button" data-nav="home">Retour au jeu</button>
                </div>

                <section class="card">
                    <header class="card__header">
                        <h1>Loto sonore</h1>
                    </header>

                    <div class="card__body">
                        <div class="field">
                            <label for="mode-select">Mode de jeu</label>
                            <select id="mode-select" name="mode">
                                <option value="animaux">Animaux</option>
                                <option value="bruits_familiers">Bruits familiers</option>
                            </select>
                        </div>

                        <div class="field">
                            <label for="sound-select">Son</label>
                            <select id="sound-select" name="sound">
                                <option value="">Chargement des sons…</option>
                            </select>
                        </div>

                        <div class="player">
                            <button class="btn" type="button" id="play-sound">
                                Lire le son
                            </button>
                            <audio id="audio-player" preload="none"></audio>
                        </div>

                        <section class="game">
                            <h2 class="game__title">Jeu</h2>

                            <div class="game__controls">
                                <div class="field">
                                    <label for="game-category">Catégorie</label>
                                    <select id="game-category" name="game-category">
                                        <option value="" selected>Choisir une catégorie</option>
                                        <option value="animaux">Animaux</option>
                                        <option value="bruits_familiers">Bruits familiers</option>
                                    </select>
                                </div>

                                <div class="field">
                                    <label for="game-difficulty">Difficulté</label>
                                    <select id="game-difficulty" name="game-difficulty">
                                        <option value="" selected>Choisir une difficulté</option>
                                        <option value="manual">Manuel</option>
                                        <option value="auto-slow">Automatique lent</option>
                                        <option value="auto-normal">Automatique normal</option>
                                        <option value="auto-fast">Automatique rapide</option>
                                    </select>
                                </div>

                                <div class="game__buttons">
                                    <button class="btn" type="button" id="game-start" disabled>Démarrer</button>
                                    <button class="btn" type="button" id="game-next" disabled>Tirage suivant</button>
                                    <button class="btn" type="button" id="game-pause" disabled>Pause</button>
                                    <button class="btn" type="button" id="game-reset" disabled>Réinitialiser</button>
                                </div>
                            </div>

                            <div class="game__players">
                                <p><strong>Joueurs inscrits :</strong> <span data-players-list>—</span></p>
                                <p><strong>Gagnant :</strong> <span data-game-winner>—</span></p>
                            </div>

                            <div class="game__colors">
                                <button class="btn btn--ghost" type="button" data-player-color="rouge">Rouge</button>
                                <button class="btn btn--ghost" type="button" data-player-color="bleu">Bleu</button>
                                <button class="btn btn--ghost" type="button" data-player-color="vert">Vert</button>
                                <button class="btn btn--ghost" type="button" data-player-color="jaune">Jaune</button>
                            </div>

                            <p class="status status--loading" data-game-status aria-live="polite" role="status">
                                Jeu : en attente.
                            </p>

                            <p class="status status--loading" data-debug-status aria-live="polite" role="status">
                                Debug : en attente.
                            </p>

                            <div class="game__meta">
                                <p><strong>Restants :</strong> <span id="game-remaining">0</span> / <span id="game-total">0</span></p>
                                <p><strong>Dernier tirage :</strong> <span id="game-last">—</span></p>
                            </div>
                        </section>

                        <p class="status status--loading" data-catalogue-status aria-live="polite" role="status">
                            Catalogue : chargement…
                        </p>
                    </div>

                    <footer class="card__footer">
                        <p>Audio hors webroot · Endpoint réservé : <code>/audio.php</code></p>
                    </footer>
                </section>
            </div>
        </section>
    </main>

    <script type="module" src="/assets/js/app.js"></script>
</body>

</html>