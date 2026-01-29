function shuffle(array) {
    for (let i = array.length - 1; i > 0; i -= 1) {
        const j = Math.floor(Math.random() * (i + 1));
        [array[i], array[j]] = [array[j], array[i]];
    }
    return array;
}

export function createGameEngine() {
    let state = 'idle';
    let mode = 'manual';
    let timerId = null;
    let deck = [];
    let total = 0;
    let lastDraw = null;
    let intervalMs = 0;
    let onDraw = null;
    let onFinish = null;

    function clearTimer() {
        if (timerId !== null) {
            clearInterval(timerId);
            timerId = null;
        }
    }

    function buildDeck(catalogue, category) {
        const sounds = [];
        const modes = Array.isArray(catalogue?.modes) ? catalogue.modes : [];

        for (const modeEntry of modes) {
            if (!Array.isArray(modeEntry.sounds)) {
                continue;
            }
            if (category !== 'all' && modeEntry.id !== category) {
                continue;
            }
            for (const sound of modeEntry.sounds) {
                if (sound?.id && sound?.label) {
                    sounds.push({ id: sound.id, label: sound.label });
                }
            }
        }

        return shuffle(sounds);
    }

    function drawNextInternal() {
        if (state !== 'running') {
            return null;
        }
        if (deck.length === 0) {
            state = 'finished';
            clearTimer();
            if (typeof onFinish === 'function') {
                onFinish();
            }
            return null;
        }
        lastDraw = deck.shift();
        if (deck.length === 0) {
            state = 'finished';
            clearTimer();
            if (typeof onFinish === 'function') {
                onFinish();
            }
        }
        return lastDraw;
    }

    function scheduleAutoDraw() {
        clearTimer();
        timerId = setInterval(() => {
            if (state !== 'running') {
                return;
            }
            const drawn = drawNextInternal();
            if (drawn && typeof onDraw === 'function') {
                onDraw(drawn, mode);
            }
        }, intervalMs);
    }

    function start(config) {
        const { catalogue, category, mode: nextMode, intervalMs: nextInterval, onDraw: drawCb, onFinish: finishCb } = config;
        reset();
        deck = buildDeck(catalogue, category);
        total = deck.length;
        lastDraw = null;
        mode = nextMode;
        intervalMs = nextInterval;
        if (mode === 'auto' && (!Number.isFinite(intervalMs) || intervalMs <= 0)) {
            mode = 'manual';
            intervalMs = 0;
        }
        onDraw = drawCb ?? null;
        onFinish = finishCb ?? null;

        if (total === 0) {
            state = 'finished';
            if (typeof onFinish === 'function') {
                onFinish();
            }
            return;
        }

        state = 'running';

        if (mode === 'auto') {
            const first = drawNextInternal();
            if (first && typeof onDraw === 'function') {
                onDraw(first, mode);
            }
            if (state === 'running') {
                scheduleAutoDraw();
            }
        }
    }

    function drawNext() {
        const drawn = drawNextInternal();
        if (drawn && typeof onDraw === 'function') {
            onDraw(drawn, mode);
        }
        return drawn;
    }

    function pause() {
        if (mode !== 'auto' || state !== 'running') {
            return;
        }
        state = 'paused';
        clearTimer();
    }

    function resume() {
        if (mode !== 'auto' || state !== 'paused') {
            return;
        }
        state = 'running';
        scheduleAutoDraw();
    }

    function reset() {
        clearTimer();
        state = 'idle';
        mode = 'manual';
        deck = [];
        total = 0;
        lastDraw = null;
        intervalMs = 0;
        onDraw = null;
        onFinish = null;
    }

    function finish() {
        if (state === 'finished') {
            return;
        }
        clearTimer();
        state = 'finished';
        if (typeof onFinish === 'function') {
            onFinish();
        }
    }

    function getState() {
        return state;
    }

    function getMode() {
        return mode;
    }

    function getRemainingCount() {
        return deck.length;
    }

    function getTotalCount() {
        return total;
    }

    function getLastDraw() {
        return lastDraw;
    }

    return {
        start,
        drawNext,
        pause,
        resume,
        reset,
        finish,
        getState,
        getMode,
        getRemainingCount,
        getTotalCount,
        getLastDraw,
    };
}
