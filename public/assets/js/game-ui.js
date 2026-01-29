import { createGameEngine } from './game-engine.js';

const difficultyMap = {
    manual: { mode: 'manual', intervalMs: 0 },
    'auto-slow': { mode: 'auto', intervalMs: 12000 },
    'auto-normal': { mode: 'auto', intervalMs: 8000 },
    'auto-fast': { mode: 'auto', intervalMs: 5000 },
};

export function initGameUI(options) {
    const {
        catalogue,
        setAudioSource,
        playAudio,
        pauseAudio,
        resumeAudio,
        resetAudio,
        setGameStatus,
        soundSelect,
    } = options;

    const engine = createGameEngine();

    const startButton = document.querySelector('#game-start');
    const nextButton = document.querySelector('#game-next');
    const pauseButton = document.querySelector('#game-pause');
    const resetButton = document.querySelector('#game-reset');
    const categorySelect = document.querySelector('#game-category');
    const difficultySelect = document.querySelector('#game-difficulty');
    const remainingEl = document.querySelector('#game-remaining');
    const totalEl = document.querySelector('#game-total');
    const lastEl = document.querySelector('#game-last');

    if (!startButton || !nextButton || !pauseButton || !resetButton || !categorySelect || !difficultySelect) {
        return;
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

    function setControls(state) {
        const isRunning = state === 'running';
        const isPaused = state === 'paused';
        const isFinished = state === 'finished';
        const isManual = engine.getMode() === 'manual';

        startButton.disabled = isRunning || isPaused;
        nextButton.disabled = !isManual || !isRunning || isFinished || engine.getRemainingCount() === 0;
        pauseButton.disabled = engine.getMode() !== 'auto' || (state !== 'running' && state !== 'paused') || isFinished;
        resetButton.disabled = state === 'idle';
        pauseButton.textContent = state === 'paused' ? 'Reprendre' : 'Pause';
    }

    function handleDraw(sound, sourceMode) {
        if (!sound) {
            setGameStatus('Tous les sons ont été tirés.', 'success');
            updateMeta();
            setControls(engine.getState());
            return;
        }

        if (soundSelect) {
            soundSelect.value = sound.id;
        }
        setAudioSource(sound.id);
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

    function startGame() {
        const category = categorySelect.value;
        const difficulty = difficultySelect.value;
        const config = difficultyMap[difficulty] ?? difficultyMap.manual;

        engine.start({
            catalogue,
            category,
            mode: config.mode,
            intervalMs: config.intervalMs,
            onDraw: handleDraw,
            onFinish: () => {
                setGameStatus('Tous les sons ont été tirés.', 'success');
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
        if (!drawn) {
            setGameStatus('Tous les sons ont été tirés.', 'success');
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
        updateMeta();
        if (lastEl) {
            lastEl.textContent = '—';
        }
        setGameStatus('Jeu réinitialisé.', 'success');
        setControls(engine.getState());
    }

    startButton.addEventListener('click', startGame);
    nextButton.addEventListener('click', drawNextManual);
    pauseButton.addEventListener('click', togglePause);
    resetButton.addEventListener('click', resetGame);

    startButton.disabled = false;
    setControls(engine.getState());
    updateMeta();
}
