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

const sfxChoice = new Audio('/assets/sfx/choix.mp3');
const sfxWin = new Audio('/assets/sfx/victoire.mp3');
const sfxLose = new Audio('/assets/sfx/defaite.mp3');

function playSfx(audio) {
    try {
        audio.pause();
        audio.currentTime = 0;
        audio.play();
    } catch (_) {
        // fail silent
    }
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
    let drawHistory = [];
    let drawHistorySet = new Set();
    let centralPressTimer = null;
    let centralPressStart = 0;
    let currentCategory = '';
    let currentDifficulty = '';
    let currentScreen = 'home';
    let loseSfxPlayed = false;

    const screenHome = document.querySelector('#screen-home');
    const screenGame = document.querySelector('#screen-game');
    const screenRules = document.querySelector('#screen-rules');
    const screenControl = document.querySelector('#screen-control');

    const homeCategorySelect = document.querySelector('#home-category');
    const homeDifficultySelect = document.querySelector('#home-difficulty');
    const homePlayButton = document.querySelector('#home-play');
    const homeMessageEl = document.querySelector('[data-home-message]');
    const homeToggleButtons = Array.from(document.querySelectorAll('[data-player-toggle]'));

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
    const controlColorButtons = Array.from(document.querySelectorAll('[data-player-color]'));

    const gameCentralButton = document.querySelector('[data-game-central]');
    const gameClaimButtons = Array.from(document.querySelectorAll('[data-claim-color]'));
    const navButtons = Array.from(document.querySelectorAll('[data-nav]'));

    if (!screenHome || !screenGame || !screenRules || !screenControl) {
        return;
    }
    if (!startButton || !nextButton || !pauseButton || !resetButton || !categorySelect || !difficultySelect) {
        return;
    }
    if (!homeCategorySelect || !homeDifficultySelect || !homePlayButton || !homeMessageEl) {
        return;
    }

    const screens = {
        home: screenHome,
        game: screenGame,
        rules: screenRules,
        control: screenControl,
    };

    function showScreen(target, { push = true } = {}) {
        if (!screens[target]) {
            return;
        }
        currentScreen = target;
        Object.entries(screens).forEach(([key, el]) => {
            el.classList.toggle('is-active', key === target);
        });
        if (push) {
            window.history.pushState({ screen: target }, '', `#${target}`);
        }
    }

    function setInitialStatuses() {
        setGameStatus('Jeu : en attente.', 'loading');
        setDebugStatus('Debug : en attente.', 'loading');
    }

    function setHomeMessage(message, state) {
        if (!homeMessageEl) {
            return;
        }
        homeMessageEl.textContent = message;
        homeMessageEl.classList.remove('is-error', 'is-success');
        if (state) {
            homeMessageEl.classList.add(state === 'error' ? 'is-error' : 'is-success');
        }
    }

    function syncHomeToControl() {
        if (homeCategorySelect.value) {
            categorySelect.value = homeCategorySelect.value;
        }
        if (homeDifficultySelect.value) {
            difficultySelect.value = homeDifficultySelect.value;
        }
    }

    function syncControlToHome() {
        const controlCategory = categorySelect.value === 'all' ? '' : categorySelect.value;
        homeCategorySelect.value = controlCategory;
        homeDifficultySelect.value = difficultySelect.value === 'manual' ? '' : (difficultySelect.value ?? '');
    }

    function getSelectedCategory() {
        if (currentScreen === 'control') {
            return categorySelect.value === 'all' ? '' : categorySelect.value;
        }
        return homeCategorySelect.value;
    }

    function getSelectedDifficulty() {
        if (currentScreen === 'control') {
            return difficultySelect.value || '';
        }
        return homeDifficultySelect.value || '';
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
        homeToggleButtons.forEach((button) => {
            const color = button.getAttribute('data-player-toggle');
            const isActive = color ? players.includes(color) : false;
            button.classList.toggle('is-active', isActive);
            button.setAttribute('aria-pressed', isActive ? 'true' : 'false');
        });
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

    function resetRuntimeState() {
        drawHistory = [];
        drawHistorySet = new Set();
        winner = null;
        loseSfxPlayed = false;
        updatePlayersUI();
    }

    function resetHomeUI() {
        homeCategorySelect.value = '';
        homeDifficultySelect.value = '';
        setHomeMessage('Choisissez une catégorie, une difficulté et 2 joueurs.', null);
        syncHomeToControl();
        updatePlayersUI();
    }

    function evaluateHomeReady() {
        const category = getSelectedCategory();
        const difficulty = getSelectedDifficulty();
        if (!category) {
            return { ok: false, message: 'Choisissez une catégorie.', state: 'error' };
        }
        if (!difficulty) {
            return { ok: false, message: 'Choisissez une difficulté.', state: 'error' };
        }
        if (players.length < 2) {
            return { ok: false, message: 'Sélectionnez au moins 2 joueurs.', state: 'error' };
        }
        return { ok: true, message: 'Prêt à jouer.', state: 'success' };
    }

    function canStart() {
        const category = getSelectedCategory();
        const difficulty = getSelectedDifficulty();
        if (!planchesValid || !planches) {
            setGameStatus('Démarrage impossible : planches invalides.', 'error');
            setDebugStatus('Planches invalides : corriger le fichier pour démarrer.', 'error');
            return false;
        }
        if (!category) {
            setGameStatus('Choisissez une catégorie (pas "Tous").', 'error');
            return false;
        }
        if (!planches[category]) {
            setGameStatus('Démarrage impossible : planche catégorie absente.', 'error');
            setDebugStatus(`Planches manquantes pour la catégorie ${category}.`, 'error');
            return false;
        }
        if (!difficulty) {
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
        drawHistory.push(sound.id);
        drawHistorySet.add(sound.id);
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
        if (!loseSfxPlayed) {
            playSfx(sfxLose);
            loseSfxPlayed = true;
        }
    }

    function startGame() {
        if (!canStart()) {
            return false;
        }

        setInitialStatuses();
        const category = getSelectedCategory();
        const difficulty = getSelectedDifficulty();
        currentCategory = category;
        currentDifficulty = difficulty;
        categorySelect.value = category;
        difficultySelect.value = difficulty;

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
            return false;
        }

        const filteredMode = catalogue.modes.find((modeEntry) => modeEntry.id === category);
        if (!filteredMode) {
            setGameStatus('Démarrage impossible : catégorie absente du catalogue.', 'error');
            setDebugStatus(`Catalogue incomplet pour la catégorie ${category}.`, 'error');
            return false;
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
        return true;
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
        resetHomeUI();
    }

    function addPlayer(color) {
        if (players.includes(color)) {
            return false;
        }
        if (players.length >= 4) {
            setDebugStatus('Maximum 4 joueurs inscrits.', 'error');
            return false;
        }
        players.push(color);
        updatePlayersUI();
        playSfx(sfxChoice);
        return true;
    }

    function removePlayer(color) {
        const index = players.indexOf(color);
        if (index === -1) {
            return false;
        }
        players.splice(index, 1);
        updatePlayersUI();
        playSfx(sfxChoice);
        return true;
    }

    function togglePlayer(color) {
        if (engine.getState() !== 'idle') {
            return;
        }
        if (players.includes(color)) {
            removePlayer(color);
        } else {
            addPlayer(color);
        }
    }

    function claimVictory(color) {
        if (engine.getState() !== 'running' && engine.getState() !== 'paused') {
            return;
        }
        if (!players.includes(color)) {
            setDebugStatus(`Joueur non inscrit : ${color}.`, 'error');
            return;
        }
        const category = currentCategory || getSelectedCategory();
        const planche = planches?.[category]?.[color];
        if (!planche || planche.length === 0) {
            setDebugStatus(`Planche introuvable pour ${category}/${color}.`, 'error');
            return;
        }
        const hasAll = planche.every((soundId) => drawHistorySet.has(soundId));
        if (hasAll) {
            winner = color;
            updatePlayersUI();
            setGameStatus(`Victoire : ${color}.`, 'success');
            setDebugStatus(`Gagnant validé : ${color}.`, 'success');
            playSfx(sfxWin);
            engine.finish();
            setControls(engine.getState());
        } else {
            setGameStatus(`Revendication incorrecte : ${color}.`, 'error');
            setDebugStatus(`Revendication incorrecte : ${color}.`, 'error');
            playSfx(sfxLose);
        }
    }

    function handleControlColorPress(color) {
        const state = getLogicalState();
        if (state === 'PRET') {
            addPlayer(color);
            return;
        }
        if (state === 'EN_COURS' || state === 'EN_PAUSE') {
            claimVictory(color);
        }
    }

    function handleCentralShortPress() {
        const state = engine.getState();
        if (state === 'idle') {
            const started = startGame();
            if (started) {
                showScreen('game');
            }
            return;
        }
        if (state === 'running' || state === 'paused') {
            togglePause();
        }
    }

    function goHomeReset() {
        resetGame();
        showScreen('home');
    }

    function handleCentralLongPress() {
        goHomeReset();
    }

    function handleCentralPointerDown(event) {
        event.preventDefault();
        centralPressStart = Date.now();
        centralPressTimer = window.setTimeout(() => {
            centralPressTimer = null;
            handleCentralLongPress();
        }, 5000);
    }

    function handleCentralPointerUp(event) {
        if (!centralPressStart) {
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
        centralPressStart = 0;
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
        centralPressStart = 0;
    }

    function isGameInProgress() {
        const state = engine.getState();
        return state === 'running' || state === 'paused';
    }

    function onBeforeUnload(event) {
        if (!isGameInProgress()) {
            return;
        }
        event.preventDefault();
        event.returnValue = 'La partie sera interrompue et perdue.';
        return event.returnValue;
    }

    function onPopState() {
        if (!isGameInProgress()) {
            return;
        }
        const confirmed = window.confirm('La partie sera interrompue et perdue.');
        if (confirmed) {
            goHomeReset();
            window.history.replaceState({ screen: 'home' }, '', '#home');
        } else {
            window.history.pushState({ screen: currentScreen }, '', `#${currentScreen}`);
        }
    }

    function bindNavigationGuards() {
        window.history.replaceState({ screen: 'home' }, '', '#home');
        window.addEventListener('beforeunload', onBeforeUnload);
        window.addEventListener('popstate', onPopState);
    }

    function bindNavigation() {
        navButtons.forEach((button) => {
            button.addEventListener('click', () => {
                const target = button.getAttribute('data-nav');
                if (target === 'home') {
                    goHomeReset();
                    return;
                }
                if (target === 'rules') {
                    showScreen('rules');
                    return;
                }
                if (target === 'control') {
                    showScreen('control');
                }
            });
        });
    }

    function updateHomeFeedback() {
        const result = evaluateHomeReady();
        setHomeMessage(result.message, result.state);
    }

    homeCategorySelect.addEventListener('change', () => {
        syncHomeToControl();
        updateHomeFeedback();
    });

    homeDifficultySelect.addEventListener('change', () => {
        syncHomeToControl();
        updateHomeFeedback();
    });

    homeToggleButtons.forEach((button) => {
        button.addEventListener('click', () => {
            const color = button.getAttribute('data-player-toggle');
            if (!color || !colors.includes(color)) {
                return;
            }
            togglePlayer(color);
            updateHomeFeedback();
        });
    });

    homePlayButton.addEventListener('click', () => {
        const result = evaluateHomeReady();
        setHomeMessage(result.message, result.state);
        if (!result.ok) {
            return;
        }
        const started = startGame();
        if (started) {
            showScreen('game');
        }
    });

    categorySelect.addEventListener('change', () => {
        syncControlToHome();
        updateHomeFeedback();
    });

    difficultySelect.addEventListener('change', () => {
        syncControlToHome();
        updateHomeFeedback();
    });

    startButton.addEventListener('click', () => {
        const started = startGame();
        if (started) {
            showScreen('game');
        }
    });
    nextButton.addEventListener('click', drawNextManual);
    pauseButton.addEventListener('click', togglePause);
    resetButton.addEventListener('click', resetGame);

    controlColorButtons.forEach((button) => {
        button.addEventListener('click', () => {
            const color = button.getAttribute('data-player-color');
            if (color && colors.includes(color)) {
                handleControlColorPress(color);
                updateHomeFeedback();
            }
        });
    });

    gameClaimButtons.forEach((button) => {
        button.addEventListener('click', () => {
            const color = button.getAttribute('data-claim-color');
            if (color && colors.includes(color)) {
                claimVictory(color);
            }
        });
    });

    if (gameCentralButton) {
        gameCentralButton.addEventListener('pointerdown', handleCentralPointerDown);
        gameCentralButton.addEventListener('pointerup', handleCentralPointerUp);
        gameCentralButton.addEventListener('pointercancel', handleCentralPointerUp);
        gameCentralButton.addEventListener('pointerleave', handleCentralPointerUp);
    }

    document.addEventListener('keydown', onCentralKeyDown);
    document.addEventListener('keyup', onCentralKeyUp);

    bindNavigation();
    bindNavigationGuards();
    resetHomeUI();
    setInitialStatuses();
    startButton.disabled = false;
    updatePlayersUI();
    setControls(engine.getState());
    updateMeta();
    showScreen('home', { push: false });
}
