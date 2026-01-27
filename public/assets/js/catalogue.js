export async function loadCatalogue() {
    const response = await fetch('/catalogue.php', { cache: 'no-store' });

    if (!response.ok) {
        throw new Error(`Catalogue indisponible (HTTP ${response.status}).`);
    }

    const data = await response.json();

    if (!data || !Array.isArray(data.modes)) {
        throw new Error('Catalogue invalide : modes manquants.');
    }

    let total = 0;
    for (const mode of data.modes) {
        if (typeof mode.id !== 'string' || mode.id.trim() === '') {
            throw new Error('Catalogue invalide : mode.id manquant.');
        }
        if (typeof mode.label !== 'string' || mode.label.trim() === '') {
            throw new Error(`Catalogue invalide : mode.label manquant pour ${mode.id}.`);
        }
        if (!Array.isArray(mode.sounds)) {
            throw new Error(`Catalogue invalide : mode.sounds manquant pour ${mode.id}.`);
        }

        for (const sound of mode.sounds) {
            if (typeof sound.id !== 'string' || sound.id.trim() === '') {
                throw new Error(`Catalogue invalide : sound.id manquant pour ${mode.id}.`);
            }
            if (typeof sound.label !== 'string' || sound.label.trim() === '') {
                throw new Error(`Catalogue invalide : sound.label manquant pour ${sound.id}.`);
            }
            if (typeof sound.file !== 'string' || sound.file.trim() === '') {
                throw new Error(`Catalogue invalide : sound.file manquant pour ${sound.id}.`);
            }
        }

        total += mode.sounds.length;
    }

    if (total !== 48) {
        throw new Error(`Catalogue invalide : ${total} sons trouvés (48 attendus).`);
    }

    return { catalogue: data, total };
}
