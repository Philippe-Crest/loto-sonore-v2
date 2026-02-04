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
    }
}

function playSfxAndWait(audio) {
    return new Promise((resolve) => {
        let onEnded;
        try {
            audio.pause();
            audio.currentTime = 0;
            onEnded = () => {
                audio.removeEventListener('ended', onEnded);
                resolve();
            };
            audio.addEventListener('ended', onEnded, { once: true });
            const result = audio.play();
            if (result && typeof result.catch === 'function') {
                result.catch(() => {
                    audio.removeEventListener('ended', onEnded);
                    resolve();
                });
            }
        } catch (_) {
            if (onEnded) {
                audio.removeEventListener('ended', onEnded);
            }
            resolve();
        }
    });
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
        isMainAudioPlaying,
        waitForMainAudioToEnd,
        waitForMainAudioToPause,
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
    let activePointerId = null;
    const lastActionAt = new Map();
    const EJ_THROTTLE_MS = 250;
    const CENTRAL_RESET_HOLD_MS = 3000;

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
        categorySelect.value = homeCategorySelect.value || '';
        difficultySelect.value = homeDifficultySelect.value || '';
    }

    function syncControlToHome() {
        homeCategorySelect.value = categorySelect.value || '';
        homeDifficultySelect.value = difficultySelect.value === 'manual' ? '' : (difficultySelect.value || '');
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
        screenGame.classList.toggle('is-paused', state === 'paused');
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
            setGameStatus('Choisissez une catégorie.', 'error');
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

    async function finishWithoutWinner() {
        if (winner) {
            return;
        }
        setGameStatus('Tous les sons ont été tirés. Personne n’a gagné.', 'success');
        setDebugStatus('Partie terminée sans gagnant.', 'success');
        if (loseSfxPlayed) {
            return;
        }
        loseSfxPlayed = true;
        if (waitForMainAudioToEnd) {
            await waitForMainAudioToEnd();
        }
        if (winner) {
            return;
        }
        await playSfxAndWait(sfxLose);
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
                void finishWithoutWinner();
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
            void finishWithoutWinner();
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

    async function playExclusiveSfx(sfxAudio) {
        const wasMainPlaying = isMainAudioPlaying?.() === true;
        const wasEngineRunning = engine.getState() === 'running';

        if (wasEngineRunning) {
            engine.pause();
            setControls(engine.getState());
        }

        if (wasMainPlaying) {
            pauseAudio?.();
            await waitForMainAudioToPause?.();
        }

        await playSfxAndWait(sfxAudio);

        if (!isGameInProgress()) {
            return;
        }

        if (wasEngineRunning) {
            engine.resume();
            setControls(engine.getState());
        }

        if (wasMainPlaying) {
            await resumeAudio?.();
        }
    }

    async function claimVictory(color) {
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
            engine.finish();
            setControls(engine.getState());
            await playExclusiveSfx(sfxWin);
        } else {
            setGameStatus(`Revendication incorrecte : ${color}.`, 'error');
            setDebugStatus(`Revendication incorrecte : ${color}.`, 'error');
            await playExclusiveSfx(sfxLose);
        }
    }

    function handleControlColorPress(color) {
        const state = getLogicalState();
        if (state === 'PRET') {
            addPlayer(color);
            return;
        }
        if (state === 'EN_COURS' || state === 'EN_PAUSE') {
            void claimVictory(color);
        }
    }

    function handleCentralShortPress() {
        if (shouldThrottle('central')) {
            return;
        }
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

    function canProcessPointer(event) {
        if (event.pointerId === undefined || event.pointerId === null) {
            return activePointerId === null;
        }
        if (activePointerId !== null) {
            return false;
        }
        activePointerId = event.pointerId;
        return true;
    }

    function releasePointer(event) {
        if (activePointerId === null) {
            return;
        }
        if (event.pointerId === undefined || event.pointerId === null || event.pointerId === activePointerId) {
            activePointerId = null;
        }
    }

    function shouldThrottle(actionKey) {
        const now = Date.now();
        const last = lastActionAt.get(actionKey) ?? 0;
        if (now - last < EJ_THROTTLE_MS) {
            return true;
        }
        lastActionAt.set(actionKey, now);
        return false;
    }

    function setPressedState(button, pressed) {
        if (!button) {
            return;
        }
        button.classList.toggle('is-pressed', pressed);
    }

    function setCentralHoldState(pressed) {
        if (!gameCentralButton) {
            return;
        }
        gameCentralButton.classList.toggle('is-hold', pressed);
    }

    function goHomeReset() {
        resetGame();
        showScreen('home');
    }

    function handleCentralLongPress() {
        setCentralHoldState(false);
        activePointerId = null;
        goHomeReset();
    }

    function handleCentralPointerDown(event) {
        if (!canProcessPointer(event)) {
            return;
        }
        event.preventDefault();
        lastActionAt.set('ej-touch', Date.now());
        setPressedState(gameCentralButton, true);
        setCentralHoldState(true);
        centralPressStart = Date.now();
        centralPressTimer = window.setTimeout(() => {
            centralPressTimer = null;
            handleCentralLongPress();
        }, CENTRAL_RESET_HOLD_MS);
    }

    function handleCentralPointerUp(event) {
        if (!centralPressStart) {
            releasePointer(event);
            return;
        }
        event.preventDefault();
        const duration = Date.now() - centralPressStart;
        if (centralPressTimer) {
            window.clearTimeout(centralPressTimer);
            centralPressTimer = null;
            if (duration < CENTRAL_RESET_HOLD_MS) {
                handleCentralShortPress();
            }
        }
        centralPressStart = 0;
        setCentralHoldState(false);
        setPressedState(gameCentralButton, false);
        releasePointer(event);
    }

    function handleCentralPointerCancel(event) {
        if (!centralPressStart) {
            releasePointer(event);
            return;
        }
        event.preventDefault();
        if (centralPressTimer) {
            window.clearTimeout(centralPressTimer);
            centralPressTimer = null;
        }
        centralPressStart = 0;
        setCentralHoldState(false);
        setPressedState(gameCentralButton, false);
        releasePointer(event);
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
        }, CENTRAL_RESET_HOLD_MS);
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
            if (duration < CENTRAL_RESET_HOLD_MS) {
                handleCentralShortPress();
            }
        }
        centralPressStart = 0;
    }

    function onControlKeyDown(event) {
        if (currentScreen !== 'control') {
            return;
        }
        if (event.code !== 'Space' && event.key !== ' ') {
            return;
        }
        const target = event.target;
        if (!target || !(target instanceof HTMLElement)) {
            return;
        }
        const tag = target.tagName;
        if (['INPUT', 'SELECT', 'TEXTAREA'].includes(tag)) {
            return;
        }
        if (tag !== 'BUTTON' && target.getAttribute('role') !== 'button') {
            return;
        }
        event.preventDefault();
        target.click();
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
        if (!started) {
            return;
        }
        if (currentScreen !== 'control') {
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
        button.addEventListener('pointerdown', (event) => {
            if (!canProcessPointer(event)) {
                return;
            }
            event.preventDefault();
            lastActionAt.set('ej-touch', Date.now());
            setPressedState(button, true);
        });
        const endPress = (event) => {
            setPressedState(button, false);
            releasePointer(event);
        };
        button.addEventListener('pointerup', (event) => {
            endPress(event);
            const color = button.getAttribute('data-claim-color');
            if (color && colors.includes(color)) {
                if (shouldThrottle(`claim-${color}`)) {
                    return;
                }
                void claimVictory(color);
            }
        });
        button.addEventListener('pointercancel', endPress);
        button.addEventListener('pointerleave', endPress);
    });

    if (gameCentralButton) {
        gameCentralButton.addEventListener('pointerdown', handleCentralPointerDown);
        gameCentralButton.addEventListener('pointerup', handleCentralPointerUp);
        gameCentralButton.addEventListener('pointercancel', handleCentralPointerCancel);
        gameCentralButton.addEventListener('pointerleave', handleCentralPointerCancel);
    }

    screenControl.addEventListener('keydown', onControlKeyDown);
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
