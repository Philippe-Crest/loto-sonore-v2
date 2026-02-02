# QA — EC/EA placeholders & démarrage EC sans bascule EJ (révisé)
Date : 02/02/2026

## A — Placeholders EC : Catégorie / Difficulté

**Attendu**
- EC : pas d’option “Tous”.
- EC : placeholder Catégorie `value=""` sélectionné par défaut.
- EC : placeholder Difficulté `value=""` sélectionné par défaut.
- EC : option “Manuel” disponible.

**Constaté**
- `#game-category` contient un placeholder `value=""` sélectionné, et uniquement `animaux` / `bruits_familiers`.
- `#game-difficulty` contient un placeholder `value=""` sélectionné, puis “Manuel” et les modes auto.

**Preuve (commande + extrait)**
- Commande : `nl -ba public/index.php | sed -n '120,220p'`

Extrait (public/index.php:135–151) :
```
135     <label for="game-category">Catégorie</label>
136     <select id="game-category" name="game-category">
137         <option value="" selected>Choisir une catégorie</option>
138         <option value="animaux">Animaux</option>
139         <option value="bruits_familiers">Bruits familiers</option>
140     </select>
...
144     <label for="game-difficulty">Difficulté</label>
145     <select id="game-difficulty" name="game-difficulty">
146         <option value="" selected>Choisir une difficulté</option>
147         <option value="manual">Manuel</option>
148         <option value="auto-slow">Automatique lent</option>
149         <option value="auto-normal">Automatique normal</option>
150         <option value="auto-fast">Automatique rapide</option>
151     </select>
```

**Verdict : OK**

---

## B — Logique JS : valeurs retournées en EC

**Attendu**
- EC : `getSelectedCategory()` renvoie `''` si placeholder sélectionné.
- EC : `getSelectedDifficulty()` renvoie `''` si placeholder sélectionné.

**Constaté**
- En mode EC (`currentScreen === 'control'`), `getSelectedCategory()` renvoie `categorySelect.value` et ne force aucune valeur par défaut.
- En mode EC, `getSelectedDifficulty()` renvoie `difficultySelect.value || ''`.

**Preuve (commande + extrait)**
- Commande : `nl -ba public/assets/js/game-ui.js | sed -n '120,220p'`

Extrait (public/assets/js/game-ui.js:144–155) :
```
144 function getSelectedCategory() {
145     if (currentScreen === 'control') {
146         return categorySelect.value === 'all' ? '' : categorySelect.value;
147     }
148     return homeCategorySelect.value;
149 }
151 function getSelectedDifficulty() {
152     if (currentScreen === 'control') {
153         return difficultySelect.value || '';
154     }
155     return homeDifficultySelect.value || '';
156 }
```

**Verdict : OK**

---

## C — Blocage du démarrage si placeholders (EC)

**Attendu**
- `canStart()` refuse si `category === ''` ou `difficulty === ''`.
- Refus si planches invalides/absentes.
- Refus si < 2 joueurs.

**Constaté**
- `canStart()` bloque si `!category`, `!difficulty`, `!planchesValid || !planches`, ou `players.length < 2`.

**Preuve (commande + extrait)**
- Commande : `nl -ba public/assets/js/game-ui.js | sed -n '220,360p'`

Extrait (public/assets/js/game-ui.js:233–258) :
```
233 function canStart() {
234     const category = getSelectedCategory();
235     const difficulty = getSelectedDifficulty();
236     if (!planchesValid || !planches) {
237         setGameStatus('Démarrage impossible : planches invalides.', 'error');
238         setDebugStatus('Planches invalides : corriger le fichier pour démarrer.', 'error');
239         return false;
240     }
241     if (!category) {
242         setGameStatus('Choisissez une catégorie (pas "Tous").', 'error');
243         return false;
244     }
245     if (!planches[category]) {
246         setGameStatus('Démarrage impossible : planche catégorie absente.', 'error');
247         setDebugStatus(`Planches manquantes pour la catégorie ${category}.`, 'error');
248         return false;
249     }
250     if (!difficulty) {
251         setGameStatus('Choisissez une difficulté.', 'error');
252         return false;
253     }
254     if (players.length < 2) {
255         setGameStatus('Au moins 2 joueurs doivent être inscrits.', 'error');
256         return false;
257     }
258     return true;
259 }
```

**Verdict : OK**

---

## D — Démarrer en EC sans bascule EJ

**Attendu**
- Le click sur `#game-start` appelle `startGame()`.
- Si `currentScreen === 'control'`, pas d’appel à `showScreen('game')`.
- `startGame()` lance `engine.start(...)` puis `setControls(...)`.

**Constaté**
- Le handler `#game-start` ne bascule vers EJ que si `currentScreen !== 'control'`.
- `startGame()` appelle `engine.start(...)` et `setControls(...)`.

**Preuve (commande + extrait)**
- Commande : `nl -ba public/assets/js/game-ui.js | sed -n '640,740p'`

Extrait handler (public/assets/js/game-ui.js:673–681) :
```
673 startButton.addEventListener('click', () => {
674     const started = startGame();
675     if (!started) {
676         return;
677     }
678     if (currentScreen !== 'control') {
679         showScreen('game');
680     }
681 });
```

- Commande : `nl -ba public/assets/js/game-ui.js | sed -n '220,360p'`

Extrait `startGame()` (public/assets/js/game-ui.js:298–357, 366–368) :
```
298 function startGame() {
299     if (!canStart()) {
300         return false;
301     }
...
348     engine.start({
349         catalogue: filteredCatalogue,
350         category,
351         mode: config.mode,
352         intervalMs: config.intervalMs,
353         onDraw: handleDraw,
354         onFinish: () => {
355             finishWithoutWinner();
356             setControls(engine.getState());
357         },
358     });
...
366     updateMeta();
367     setControls(engine.getState());
368     return true;
```

**Verdict : OK**

---

## E — Activation “Tirage suivant” / “Pause” en EC

**Attendu**
- Si mode `manual` et `running` → “Tirage suivant” activable.
- Si mode auto et `running/paused` → “Pause” activable.

**Constaté**
- `setControls()` active `nextButton` si `isManual && isRunning`.
- `pauseButton` activable si `engine.getMode() === 'auto'` et état `running/paused`.

**Preuve (commande + extrait)**
- Commande : `nl -ba public/assets/js/game-ui.js | sed -n '120,220p'`

Extrait (public/assets/js/game-ui.js:189–199) :
```
189 function setControls(state) {
190     const isRunning = state === 'running';
191     const isPaused = state === 'paused';
192     const isFinished = state === 'finished';
193     const isManual = engine.getMode() === 'manual';
194
195     startButton.disabled = state !== 'idle';
196     nextButton.disabled = !isManual || !isRunning || isFinished || engine.getRemainingCount() === 0;
197     pauseButton.disabled = engine.getMode() !== 'auto' || (state !== 'running' && state !== 'paused') || isFinished;
198     resetButton.disabled = false;
199     pauseButton.textContent = state === 'paused' ? 'Reprendre' : 'Pause';
200 }
```

**Verdict : OK**

---

## F — Contrôle complémentaire 1 : inscription joueurs en EC

**Attendu**
- EC : boutons couleur ajoutent des joueurs en état idle.
- Démarrage bloqué si < 2 joueurs.

**Constaté**
- `handleControlColorPress()` ajoute en état `PRET`.
- `canStart()` bloque si `players.length < 2`.

**Preuve (commande + extrait)**
- Commande : `nl -ba public/assets/js/game-ui.js | sed -n '360,520p'`

Extrait ajout joueurs (public/assets/js/game-ui.js:479–486) :
```
479 function handleControlColorPress(color) {
480     const state = getLogicalState();
481     if (state === 'PRET') {
482         addPlayer(color);
483         return;
484     }
485     if (state === 'EN_COURS' || state === 'EN_PAUSE') {
486         claimVictory(color);
487     }
488 }
```

- Commande : `nl -ba public/assets/js/game-ui.js | sed -n '220,360p'`

Extrait blocage < 2 joueurs (public/assets/js/game-ui.js:254–256) :
```
254 if (players.length < 2) {
255     setGameStatus('Au moins 2 joueurs doivent être inscrits.', 'error');
256     return false;
257 }
```

**Verdict : OK**

---

## G — Contrôle complémentaire 2 : EC → EA reset complet

**Attendu**
- “Retour au jeu” depuis EC revient à EA.
- EA remis à vide (catégorie/difficulté).
- Joueurs remis à vide (ou comportement explicite).

**Constaté**
- Navigation “home” appelle `goHomeReset()`.
- `goHomeReset()` appelle `resetGame()` puis `showScreen('home')`.
- `resetGame()` vide `players`, appelle `resetHomeUI()`.
- `resetHomeUI()` remet `homeCategorySelect`/`homeDifficultySelect` à `''`.

**Preuve (commande + extrait)**
- Commande : `nl -ba public/assets/js/game-ui.js | sed -n '360,520p'`

Extrait reset (public/assets/js/game-ui.js:396–411) :
```
396 function resetGame() {
397     engine.reset();
398     resetAudio();
399     resetRuntimeState();
400     players.length = 0;
401     updatePlayersUI();
402     setInitialStatuses();
403     setGameStatus('Jeu réinitialisé.', 'success');
404     setDebugStatus('Debug : en attente.', 'loading');
405     updateMeta();
406     if (lastEl) {
407         lastEl.textContent = '—';
408     }
409     setControls(engine.getState());
410     resetHomeUI();
411 }
```

- Commande : `nl -ba public/assets/js/game-ui.js | sed -n '120,220p'`

Extrait reset EA (public/assets/js/game-ui.js:210–215) :
```
210 function resetHomeUI() {
211     homeCategorySelect.value = '';
212     homeDifficultySelect.value = '';
213     setHomeMessage('Choisissez une catégorie, une difficulté et 2 joueurs.', null);
214     syncHomeToControl();
215     updatePlayersUI();
216 }
```

- Commande : `nl -ba public/assets/js/game-ui.js | sed -n '360,520p'`

Extrait navigation home (public/assets/js/game-ui.js:504–507) :
```
504 function goHomeReset() {
505     resetGame();
506     showScreen('home');
507 }
```

**Verdict : OK**

---

## H — Contrôle complémentaire 3 : arrivée directe via hash

**Attendu**
- Au chargement : écran EA forcé, hash ignoré. Aligné avec la règle projet : arrivée systématique sur EA

**Constaté**
- `showScreen('home', { push: false })` est appelé en fin d’init.
- Aucun traitement du hash initial : l’écran home est forcé.

**Preuve (commande + extrait)**
- Commande : `nl -ba public/assets/js/game-ui.js | sed -n '640,740p'`

Extrait (public/assets/js/game-ui.js:715–723) :
```
715 bindNavigation();
716 bindNavigationGuards();
717 resetHomeUI();
718 setInitialStatuses();
719 startButton.disabled = false;
720 updatePlayersUI();
721 setControls(engine.getState());
722 updateMeta();
723 showScreen('home', { push: false });
```

**Verdict : OK**

---

# Conclusion

**Verdict global : OK sans action.**

Risques résiduels (faibles) :
- `getSelectedCategory()` conserve un test `categorySelect.value === 'all'` en EC. Comme l’option “Tous” a été supprimée du HTML EC, ce test n’a pas d’effet pratique et ne contourne pas les placeholders.
- La logique EC dépend de `currentScreen === 'control'`. Si l’écran était modifié sans passer par `showScreen()`, la sélection pourrait être lue côté EA. Aucun appel de ce type n’a été trouvé dans les extraits analysés.
