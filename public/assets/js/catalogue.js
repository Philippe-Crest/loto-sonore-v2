export async function loadCatalogue() {
    const response = await fetch('/catalogue.php', { cache: 'no-store' });

    if (!response.ok) {
        throw new Error(`Catalogue indisponible (HTTP ${response.status}).`);
    }

    const data = await response.json();

    if (!data || !Array.isArray(data.modes)) {
        throw new Error('Catalogue invalide : modes manquants.');
    }

    const total = data.modes.reduce((sum, mode) => {
        if (!Array.isArray(mode.sounds)) {
            throw new Error('Catalogue invalide : sounds manquants.');
        }
        return sum + mode.sounds.length;
    }, 0);

    if (total !== 48) {
        throw new Error(`Catalogue invalide : ${total} sons trouvés.`);
    }

    return data;
}
