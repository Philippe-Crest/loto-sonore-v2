import { createGameEngine } from './game-engine.js';

const difficultyMap = {
    manual: { mode: 'manual', intervalMs: 0 },
    'auto-slow': { mode: 'auto', intervalMs: 12000 },
    'auto-normal': { mode: 'auto', intervalMs: 8000 },
    'auto-fast': { mode: 'auto', intervalMs: 5000 },
};

const logicalStateMap = {
    idle: 'PRET',
    running: 'EN_COURS',
    paused: 'EN_PAUSE',
    finished: 'TERMINE',
};

const colors = ['rouge', 'bleu', 'vert', 'jaune'];

function playSignal(type) {
    const AudioContext = window.AudioContext || window.webkitAudioContext;
    if (!AudioContext) {
        return;
    }
    const ctx = new AudioContext();
    const now = ctx.currentTime;
    const sequence = type === 'win' ? [880, 1320] : [220];
    const duration = type === 'win' ? 0.18 : 0.4;

    sequence.forEach((freq, index) => {
        const osc = ctx.createOscillator();
        const gain = ctx.createGain();
        osc.type = 'sine';
        osc.frequency.value = freq;
        gain.gain.setValueAtTime(0.0001, now + index * 0.22);
        gain.gain.exponentialRampToValueAtTime(0.12, now + index * 0.22 + 0.02);
        gain.gain.exponentialRampToValueAtTime(0.0001, now + index * 0.22 + duration);
        osc.connect(gain);
        gain.connect(ctx.destination);
        osc.start(now + index * 0.22);
        osc.stop(now + index * 0.22 + duration);
    });

    window.setTimeout(() => {
        ctx.close().catch(() => undefined);
    }, 1200);
}

export function initGameUI(options) {
    const {
        catalogue,
        planches,
        planchesValid,
        setAudioSource,
        playAudio,
        pauseAudio,
        resumeAudio,
        resetAudio,
        setGameStatus,
        setDebugStatus,
        soundSelect,
    } = options;

    const engine = createGameEngine();
    const players = [];
    let winner = null;
    let history = [];
    let historySet = new Set();
    let centralPressTimer = null;
    let centralPressStart = 0;

    const startButton = document.querySelector('#game-start');
    const nextButton = document.querySelector('#game-next');
    const pauseButton = document.querySelector('#game-pause');
    const resetButton = document.querySelector('#game-reset');
    const categorySelect = document.querySelector('#game-category');
    const difficultySelect = document.querySelector('#game-difficulty');
    const remainingEl = document.querySelector('#game-remaining');
    const totalEl = document.querySelector('#game-total');
    const lastEl = document.querySelector('#game-last');
    const playersListEl = document.querySelector('[data-players-list]');
    const winnerEl = document.querySelector('[data-game-winner]');
    const colorButtons = Array.from(document.querySelectorAll('[data-player-color]'));

    if (!startButton || !nextButton || !pauseButton || !resetButton || !categorySelect || !difficultySelect) {
        return;
    }

    function getLogicalState() {
        return logicalStateMap[engine.getState()] ?? 'PRET';
    }

    function updateMeta() {
        if (remainingEl) {
            remainingEl.textContent = String(engine.getRemainingCount());
        }
        if (totalEl) {
            totalEl.textContent = String(engine.getTotalCount());
        }
        if (lastEl) {
            lastEl.textContent = engine.getLastDraw()?.label ?? '—';
        }
    }

    function updatePlayersUI() {
        if (playersListEl) {
            playersListEl.textContent = players.length ? players.join(', ') : '—';
        }
        if (winnerEl) {
            winnerEl.textContent = winner ?? '—';
        }
    }

    function setControls(state) {
        const isRunning = state === 'running';
        const isPaused = state === 'paused';
        const isFinished = state === 'finished';
        const isManual = engine.getMode() === 'manual';

        startButton.disabled = state !== 'idle';
        nextButton.disabled = !isManual || !isRunning || isFinished || engine.getRemainingCount() === 0;
        pauseButton.disabled = engine.getMode() !== 'auto' || (state !== 'running' && state !== 'paused') || isFinished;
        resetButton.disabled = false;
        pauseButton.textContent = state === 'paused' ? 'Reprendre' : 'Pause';
    }

    function setInitialStatuses() {
        setGameStatus('Jeu : en attente.', 'loading');
        setDebugStatus('Debug : en attente.', 'loading');
    }

    function resetRuntimeState() {
        history = [];
        historySet = new Set();
        winner = null;
        updatePlayersUI();
    }

    function canStart() {
        if (!planchesValid || !planches) {
            setGameStatus('Démarrage impossible : planches invalides.', 'error');
            setDebugStatus('Planches invalides : corriger le fichier pour démarrer.', 'error');
            return false;
        }
        if (categorySelect.value === 'all') {
            setGameStatus('Choisissez une catégorie (pas "Tous").', 'error');
            return false;
        }
        if (!planches[categorySelect.value]) {
            setGameStatus('Démarrage impossible : planche catégorie absente.', 'error');
            setDebugStatus(`Planches manquantes pour la catégorie ${categorySelect.value}.`, 'error');
            return false;
        }
        if (!difficultySelect.value) {
            setGameStatus('Choisissez une difficulté.', 'error');
            return false;
        }
        if (players.length < 2) {
            setGameStatus('Au moins 2 joueurs doivent être inscrits.', 'error');
            return false;
        }
        return true;
    }

    function handleDraw(sound, sourceMode) {
        if (!sound) {
            updateMeta();
            setControls(engine.getState());
            return;
        }

        if (soundSelect) {
            soundSelect.value = sound.id;
        }
        setAudioSource(sound.id);
        history.push(sound.id);
        historySet.add(sound.id);
        updateMeta();

        playAudio()
            .catch(() => {
                if (sourceMode === 'auto') {
                    setGameStatus('Lecture automatique bloquée. Lancez la lecture via le lecteur audio.', 'error');
                } else {
                    setGameStatus('Impossible de lire le son sélectionné.', 'error');
                }
            });
    }

    function finishWithoutWinner() {
        if (winner) {
            return;
        }
        setGameStatus('Tous les sons ont été tirés. Personne n’a gagné.', 'success');
        setDebugStatus('Partie terminée sans gagnant.', 'success');
    }

    function startGame() {
        if (!canStart()) {
            return;
        }

        setInitialStatuses();
        const category = categorySelect.value;
        const difficulty = difficultySelect.value;
        const config = difficultyMap[difficulty] ?? difficultyMap.manual;
        const selectedIds = new Set();
        const categoryPlanches = planches?.[category];

        for (const color of players) {
            const ids = categoryPlanches?.[color];
            if (Array.isArray(ids)) {
                ids.forEach((id) => selectedIds.add(id));
            }
        }

        if (selectedIds.size === 0) {
            setGameStatus('Démarrage impossible : aucun son pour les joueurs inscrits.', 'error');
            setDebugStatus('Deck joueurs vide : vérifier les planches sélectionnées.', 'error');
            return;
        }

        const filteredMode = catalogue.modes.find((modeEntry) => modeEntry.id === category);
        if (!filteredMode) {
            setGameStatus('Démarrage impossible : catégorie absente du catalogue.', 'error');
            setDebugStatus(`Catalogue incomplet pour la catégorie ${category}.`, 'error');
            return;
        }
        const filteredSounds = (filteredMode?.sounds ?? []).filter((sound) => selectedIds.has(sound.id));
        const filteredCatalogue = {
            ...catalogue,
            modes: [
                {
                    ...filteredMode,
                    sounds: filteredSounds,
                },
            ],
        };

        resetRuntimeState();
        setDebugStatus(`Deck joueurs : ${selectedIds.size} sons (couleurs : ${players.join(', ')})`, 'success');

        engine.start({
            catalogue: filteredCatalogue,
            category,
            mode: config.mode,
            intervalMs: config.intervalMs,
            onDraw: handleDraw,
            onFinish: () => {
                finishWithoutWinner();
                setControls(engine.getState());
            },
        });

        if (engine.getTotalCount() === 0) {
            setGameStatus('Aucun son disponible pour cette catégorie.', 'error');
        } else {
            setGameStatus('Jeu démarré.', 'success');
        }

        updateMeta();
        setControls(engine.getState());
    }

    function drawNextManual() {
        const drawn = engine.drawNext();
        if (!drawn && !winner) {
            finishWithoutWinner();
        }
        updateMeta();
        setControls(engine.getState());
    }

    function togglePause() {
        if (engine.getState() === 'paused') {
            engine.resume();
            resumeAudio()
                .catch(() => {
                    setGameStatus('Reprise audio bloquée. Lancez la lecture via le lecteur audio.', 'error');
                });
            setGameStatus('Jeu repris.', 'success');
        } else {
            engine.pause();
            pauseAudio();
            setGameStatus('Jeu en pause.', 'success');
        }
        setControls(engine.getState());
    }

    function resetGame() {
        engine.reset();
        resetAudio();
        resetRuntimeState();
        players.length = 0;
        updatePlayersUI();
        setInitialStatuses();
        setGameStatus('Jeu réinitialisé.', 'success');
        setDebugStatus('Debug : en attente.', 'loading');
        updateMeta();
        if (lastEl) {
            lastEl.textContent = '—';
        }
        setControls(engine.getState());
    }

    function registerPlayer(color) {
        if (players.includes(color)) {
            return;
        }
        if (players.length >= 4) {
            setDebugStatus('Maximum 4 joueurs inscrits.', 'error');
            return;
        }
        players.push(color);
        updatePlayersUI();
        setDebugStatus(`Joueur inscrit : ${color}.`, 'success');
    }

    function claimVictory(color) {
        if (engine.getState() !== 'running' && engine.getState() !== 'paused') {
            return;
        }
        if (!players.includes(color)) {
            setDebugStatus(`Joueur non inscrit : ${color}.`, 'error');
            return;
        }
        const category = categorySelect.value;
        const planche = planches?.[category]?.[color];
        if (!planche || planche.length === 0) {
            setDebugStatus(`Planche introuvable pour ${category}/${color}.`, 'error');
            return;
        }
        const hasAll = planche.every((soundId) => historySet.has(soundId));
        if (hasAll) {
            winner = color;
            updatePlayersUI();
            setGameStatus(`Victoire : ${color}.`, 'success');
            setDebugStatus(`Gagnant validé : ${color}.`, 'success');
            playSignal('win');
            engine.finish();
            setControls(engine.getState());
        } else {
            setGameStatus(`Revendication incorrecte : ${color}.`, 'error');
            setDebugStatus(`Revendication incorrecte : ${color}.`, 'error');
            playSignal('fail');
        }
    }

    function handleColorPress(color) {
        const state = getLogicalState();
        if (state === 'PRET') {
            registerPlayer(color);
            return;
        }
        if (state === 'EN_COURS' || state === 'EN_PAUSE') {
            claimVictory(color);
        }
    }

    function handleCentralShortPress() {
        const state = engine.getState();
        if (state === 'idle') {
            startGame();
            return;
        }
        if (state === 'running' || state === 'paused') {
            togglePause();
        }
    }

    function handleCentralLongPress() {
        resetGame();
    }

    function onCentralKeyDown(event) {
        if (event.repeat) {
            return;
        }
        const target = event.target;
        if (target && ['SELECT', 'INPUT', 'TEXTAREA'].includes(target.tagName)) {
            return;
        }
        if (event.code !== 'Space') {
            return;
        }
        event.preventDefault();
        centralPressStart = Date.now();
        centralPressTimer = window.setTimeout(() => {
            centralPressTimer = null;
            handleCentralLongPress();
        }, 5000);
    }

    function onCentralKeyUp(event) {
        if (event.code !== 'Space') {
            return;
        }
        event.preventDefault();
        const duration = Date.now() - centralPressStart;
        if (centralPressTimer) {
            window.clearTimeout(centralPressTimer);
            centralPressTimer = null;
            if (duration < 5000) {
                handleCentralShortPress();
            }
        }
    }

    startButton.addEventListener('click', startGame);
    nextButton.addEventListener('click', drawNextManual);
    pauseButton.addEventListener('click', togglePause);
    resetButton.addEventListener('click', resetGame);
    colorButtons.forEach((button) => {
        button.addEventListener('click', () => {
            const color = button.getAttribute('data-player-color');
            if (color && colors.includes(color)) {
                handleColorPress(color);
            }
        });
    });
    document.addEventListener('keydown', onCentralKeyDown);
    document.addEventListener('keyup', onCentralKeyUp);

    startButton.disabled = false;
    updatePlayersUI();
    setControls(engine.getState());
    updateMeta();
}
