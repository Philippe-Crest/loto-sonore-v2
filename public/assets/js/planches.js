function normalizeKey(value) {
    return String(value)
        .toLowerCase()
        .normalize('NFD')
        .replace(/[\u0300-\u036f]/g, '')
        .replace(/[^a-z0-9]+/g, '-')
        .replace(/^-+|-+$/g, '');
}

function buildSoundKeyMap(catalogue) {
    const map = new Map();
    const modes = Array.isArray(catalogue?.modes) ? catalogue.modes : [];

    for (const modeEntry of modes) {
        for (const sound of modeEntry?.sounds ?? []) {
            if (!sound?.id) {
                continue;
            }
            const soundId = sound.id;
            const labelKey = normalizeKey(sound.label ?? '');
            const fileBase = String(sound.file ?? '')
                .split('/')
                .pop()
                .replace(/\.mp3$/i, '');
            const fileHyphen = fileBase.replace(/_/g, '-');
            const fileUnderscore = fileBase.replace(/-/g, '_');

            const keys = [
                soundId,
                labelKey,
                fileBase,
                fileHyphen,
                fileUnderscore,
                normalizeKey(fileBase),
            ];

            for (const key of keys) {
                if (key && !map.has(key)) {
                    map.set(key, soundId);
                }
            }
        }
    }

    return map;
}

function validatePlanches(planches, catalogue) {
    const errors = [];
    const resolved = {};
    const soundKeyMap = buildSoundKeyMap(catalogue);
    const catalogueCategories = new Set((catalogue?.modes ?? []).map((mode) => mode.id));

    if (!planches || typeof planches !== 'object') {
        return { valid: false, errors: ['Planches invalides (structure).'], resolved: null };
    }

    for (const [category, colors] of Object.entries(planches)) {
        if (!catalogueCategories.has(category)) {
            errors.push(`Catégorie inconnue dans les planches : ${category}.`);
            continue;
        }
        if (!colors || typeof colors !== 'object') {
            errors.push(`Planches invalides pour la catégorie ${category}.`);
            continue;
        }

        resolved[category] = {};

        for (const [color, sounds] of Object.entries(colors)) {
            if (!Array.isArray(sounds)) {
                errors.push(`Planches invalides pour ${category}/${color} (liste attendue).`);
                continue;
            }
            if (sounds.length !== 6) {
                errors.push(`Planches ${category}/${color} : 6 sons attendus (${sounds.length} trouvé).`);
            }

            const unique = new Set(sounds);
            if (unique.size !== sounds.length) {
                errors.push(`Planches ${category}/${color} : duplication détectée.`);
            }

            const resolvedIds = [];
            for (const soundId of sounds) {
                const resolvedId = soundKeyMap.get(soundId);
                if (!resolvedId) {
                    errors.push(`Planches ${category}/${color} : son introuvable (${soundId}).`);
                } else {
                    resolvedIds.push(resolvedId);
                }
            }
            resolved[category][color] = resolvedIds;
        }
    }

    return { valid: errors.length === 0, errors, resolved };
}

export async function loadPlanches(catalogue) {
    const response = await fetch('/planches.php', { cache: 'no-store' });

    if (!response.ok) {
        throw new Error(`Planches indisponibles (HTTP ${response.status}).`);
    }

    const data = await response.json();
    const validation = validatePlanches(data, catalogue);
    if (!validation.valid) {
        return { planches: data, resolved: validation.resolved, errors: validation.errors, valid: false };
    }

    return { planches: data, resolved: validation.resolved, errors: [], valid: true };
}
