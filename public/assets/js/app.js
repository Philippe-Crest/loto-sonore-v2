import { loadCatalogue } from './catalogue.js';

const statusEl = document.querySelector('[data-catalogue-status]');
const statusClasses = ['status--loading', 'status--success', 'status--error'];

function setStatus(message, state) {
    if (statusEl) {
        statusEl.classList.remove(...statusClasses);
        if (state) {
            statusEl.classList.add(`status--${state}`);
        }
        statusEl.textContent = message;
    }
}

(async () => {
    try {
        console.log('app ready');
        const { total } = await loadCatalogue();
        console.log(`catalogue loaded: ${total}`);
        setStatus(`Catalogue : ${total} sons chargés`, 'success');
    } catch (error) {
        const message = error instanceof Error ? error.message : 'Erreur inconnue.';
        console.error(error);
        setStatus(`Erreur catalogue : ${message}`, 'error');
    }
})();
