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

    <script src="/assets/js/app.js" defer></script>
</body>
</html>
