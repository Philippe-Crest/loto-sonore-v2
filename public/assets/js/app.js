import { loadCatalogue } from './catalogue.js';
import { loadPlanches } from './planches.js';
import { initGameUI } from './game-ui.js';

const statusEl = document.querySelector('[data-catalogue-status]');
const statusClasses = ['status--loading', 'status--success', 'status--error'];
const gameStatusEl = document.querySelector('[data-game-status]');
const debugStatusEl = document.querySelector('[data-debug-status]');
const modeSelect = document.querySelector('#mode-select');
const soundSelect = document.querySelector('#sound-select');
const playButton = document.querySelector('#play-sound');
const audioPlayer = document.querySelector('#audio-player');

function updatePlayButtonLabel() {
    if (!playButton || !audioPlayer) {
        return;
    }
    playButton.textContent = audioPlayer.paused || audioPlayer.ended
        ? 'Lire le son'
        : 'Pause';
}

function setStatus(message, state) {
    if (statusEl) {
        statusEl.classList.remove(...statusClasses);
        if (state) {
            statusEl.classList.add(`status--${state}`);
        }
        statusEl.textContent = message;
    }
}

function setGameStatus(message, state) {
    if (gameStatusEl) {
        gameStatusEl.classList.remove(...statusClasses);
        if (state) {
            gameStatusEl.classList.add(`status--${state}`);
        }
        gameStatusEl.textContent = message;
    }
}

function setDebugStatus(message, state) {
    if (debugStatusEl) {
        debugStatusEl.classList.remove(...statusClasses);
        if (state) {
            debugStatusEl.classList.add(`status--${state}`);
        }
        debugStatusEl.textContent = message;
    }
}

function playAudio() {
    if (!audioPlayer) {
        return Promise.reject(new Error('Audio indisponible.'));
    }
    return audioPlayer.play();
}

function pauseAudio() {
    if (!audioPlayer) {
        return;
    }
    audioPlayer.pause();
}

function resumeAudio() {
    if (!audioPlayer) {
        return Promise.resolve();
    }
    if (audioPlayer.paused && audioPlayer.currentTime > 0) {
        return audioPlayer.play();
    }
    return Promise.resolve();
}

function isMainAudioPlaying() {
    return Boolean(
        audioPlayer
            && !audioPlayer.paused
            && !audioPlayer.ended
            && audioPlayer.currentTime > 0,
    );
}

function waitForMainAudioToEnd() {
    if (!audioPlayer || audioPlayer.ended || audioPlayer.paused) {
        return Promise.resolve();
    }
    return new Promise((resolve) => {
        const onEnded = () => {
            audioPlayer.removeEventListener('ended', onEnded);
            resolve();
        };
        audioPlayer.addEventListener('ended', onEnded, { once: true });
    });
}

function waitForMainAudioToPause() {
    if (!audioPlayer || audioPlayer.paused) {
        return Promise.resolve();
    }
    return new Promise((resolve) => {
        const onPause = () => {
            audioPlayer.removeEventListener('pause', onPause);
            resolve();
        };
        audioPlayer.addEventListener('pause', onPause, { once: true });
        window.setTimeout(() => {
            audioPlayer.removeEventListener('pause', onPause);
            resolve();
        }, 250);
    });
}

function resetAudio() {
    if (!audioPlayer) {
        return;
    }
    audioPlayer.pause();
    audioPlayer.removeAttribute('src');
    audioPlayer.load();
    updatePlayButtonLabel();
}

function buildAudioUrl(soundId) {
    const encoded = encodeURIComponent(soundId);
    return `/audio.php?id=${encoded}`;
}

function isCurrentSource(soundId) {
    if (!audioPlayer || !audioPlayer.src) {
        return false;
    }
    const expected = new URL(buildAudioUrl(soundId), window.location.href).href;
    return audioPlayer.src === expected;
}

function populateSounds(catalogue, modeId) {
    if (!soundSelect) {
        return;
    }
    const mode = catalogue.modes.find((item) => item.id === modeId);
    soundSelect.innerHTML = '';

    if (!mode || !Array.isArray(mode.sounds)) {
        const option = document.createElement('option');
        option.value = '';
        option.textContent = 'Aucun son disponible';
        soundSelect.appendChild(option);
        return;
    }

    const placeholder = document.createElement('option');
    placeholder.value = '';
    placeholder.textContent = 'Sélectionnez un son';
    soundSelect.appendChild(placeholder);

    for (const sound of mode.sounds) {
        const option = document.createElement('option');
        option.value = sound.id;
        option.textContent = sound.label;
        soundSelect.appendChild(option);
    }
}

function setAudioSource(soundId) {
    if (!audioPlayer) {
        return;
    }
    if (!soundId) {
        resetAudio();
        return;
    }
    audioPlayer.pause();
    audioPlayer.currentTime = 0;
    audioPlayer.src = buildAudioUrl(soundId);
    audioPlayer.load();
    updatePlayButtonLabel();
}

// Choix projet : conserver un console.error global en cas d’échec critique
// de chargement (diagnostic terrain).
// Aucun fallback silencieux n’est appliqué ici par conception.
(async () => {
    try {
        const { catalogue, total } = await loadCatalogue();
        setStatus(`Catalogue : ${total} sons chargés`, 'success');
        setDebugStatus('Debug : en attente.', 'loading');

        let planchesPayload = { valid: false, resolved: null, errors: [] };
        try {
            planchesPayload = await loadPlanches(catalogue);
            if (!planchesPayload.valid) {
                const message = planchesPayload.errors.join(' ');
                setDebugStatus(`Planches invalides : ${message}`, 'error');
            } else {
                setDebugStatus('Planches : chargées et valides.', 'success');
            }
        } catch (planchesError) {
            const message = planchesError instanceof Error ? planchesError.message : 'Erreur planches inconnue.';
            setDebugStatus(`Planches indisponibles : ${message}`, 'error');
        }

        if (modeSelect) {
            populateSounds(catalogue, modeSelect.value);
            modeSelect.addEventListener('change', () => {
                populateSounds(catalogue, modeSelect.value);
                resetAudio();
            });
        }

        if (soundSelect) {
            soundSelect.addEventListener('change', () => {
                setAudioSource(soundSelect.value);
            });
        }

        if (playButton && audioPlayer && soundSelect) {
            playButton.addEventListener('click', async () => {
                const selectedId = soundSelect.value;
                if (!selectedId) {
                    setStatus('Sélectionnez un son à lire.', 'error');
                    return;
                }
                if (!isCurrentSource(selectedId)) {
                    setAudioSource(selectedId);
                }
                try {
                    if (audioPlayer.paused || audioPlayer.ended) {
                        if (audioPlayer.ended) {
                            audioPlayer.currentTime = 0;
                        }
                        await audioPlayer.play();
                    } else {
                        audioPlayer.pause();
                    }
                } catch (playError) {
                    setStatus('Impossible de lire le son sélectionné.', 'error');
                }
                updatePlayButtonLabel();
            });
        }

        if (audioPlayer) {
            const errorHandler = () => {
                setStatus('Impossible de lire le son sélectionné.', 'error');
            };
            audioPlayer.addEventListener('error', errorHandler);
            audioPlayer.addEventListener('stalled', errorHandler);
            audioPlayer.addEventListener('play', updatePlayButtonLabel);
            audioPlayer.addEventListener('pause', updatePlayButtonLabel);
            audioPlayer.addEventListener('ended', updatePlayButtonLabel);
        }

        initGameUI({
            catalogue,
            planches: planchesPayload.resolved,
            planchesValid: planchesPayload.valid,
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
        });
    } catch (error) {
        const message = error instanceof Error ? error.message : 'Erreur inconnue.';
        console.error(error);
        setStatus('Erreur catalogue : catalogue indisponible ou invalide.', 'error');
        setGameStatus('Jeu indisponible : catalogue non chargé.', 'error');
    }
})();
