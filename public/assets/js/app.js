import { loadCatalogue } from './catalogue.js';

const statusEl = document.querySelector('[data-catalogue-status]');

function setStatus(message) {
    if (statusEl) {
        statusEl.textContent = message;
    }
}

(async () => {
    try {
        console.log('app ready');
        const catalogue = await loadCatalogue();
        const total = catalogue.modes.reduce((sum, mode) => sum + mode.sounds.length, 0);
        console.log(`catalogue loaded: ${total}`);
        setStatus(`Catalogue : ${total} sons chargés`);
    } catch (error) {
        const message = error instanceof Error ? error.message : 'Erreur inconnue.';
        console.error(error);
        setStatus(`Erreur catalogue : ${message}`);
    }
})();
