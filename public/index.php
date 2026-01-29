<?php
declare(strict_types=1);

?><!DOCTYPE html>
<html lang="fr">
<head>
    <meta charset="utf-8">
    <meta name="viewport" content="width=device-width, initial-scale=1">
    <title>Loto Sonore V2</title>
    <link rel="stylesheet" href="/assets/css/app.css">
</head>
<body>
    <main class="page">
        <section class="card">
            <header class="card__header">
                <p class="eyebrow">Phase 0 · Socle projet</p>
                <h1>Loto Sonore V2</h1>
                <p class="lead">
                    Interface minimale prête. Le jeu arrivera dans les prochaines phases.
                </p>
            </header>

            <div class="card__body">
                <div class="placeholder">
                    <p>Zone de jeu (placeholder)</p>
                </div>

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
                    <audio id="audio-player" controls preload="none"></audio>
                </div>

                <section class="game">
                    <h2 class="game__title">Jeu</h2>

                    <div class="game__controls">
                        <div class="field">
                            <label for="game-category">Catégorie</label>
                            <select id="game-category" name="game-category">
                                <option value="all">Tous</option>
                                <option value="animaux">Animaux</option>
                                <option value="bruits_familiers">Bruits familiers</option>
                            </select>
                        </div>

                        <div class="field">
                            <label for="game-difficulty">Difficulté</label>
                            <select id="game-difficulty" name="game-difficulty">
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

                <div class="actions">
                    <button class="btn" type="button" disabled>Jouer</button>
                    <button class="btn btn--ghost" type="button" disabled>Règles</button>
                </div>
            </div>

            <footer class="card__footer">
                <p>Audio hors webroot · Endpoint réservé : <code>/audio.php</code></p>
            </footer>
        </section>
    </main>

    <script type="module" src="/assets/js/app.js"></script>
</body>
</html>
