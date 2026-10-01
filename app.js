/**
 * MetriKa - Sistema Central de Simulación v1.1
 */

const app = {
    // --- ESTADO GLOBAL ---
    state: {
        playerName: '',
        currentMode: '',
        lastPlayedMode: 'timeattack',
        score: 0,
        timeRemaining: 0,
        lives: 3,
        streak: 0,
        maxStreak: 0,
        questionCount: 0,
        correctAnswers: 0,
        timerId: null,
        currentQuestion: null,
        isPlaying: false,
        questionStartTime: 0,
        musicEnabled: true,
        bgType: 'stars', // 'particles', 'stars', 'waves'
        bgAnimationId: null
    },

    // --- CONFIGURACIÓN DE UNIDADES ---
    units: {
        time_short: ['semana', 'día', 'h.', 'min.', 's.'],
        time_long: ['milenio', 'siglo', 'década', 'lustro', 'año', 'semestre', 'trimestre']
    },
    factorsParamsMap: {
        time_short: [7, 24, 60, 60],
        time_long: [10, 10, 2, 5, 2, 2]
    },
    unitDetails: {
        'milenio': { s: 'milenio', p: 'milenios' },
        'siglo': { s: 'siglo', p: 'siglos' },
        'década': { s: 'década', p: 'décadas' },
        'lustro': { s: 'lustro', p: 'lustros' },
        'año': { s: 'año', p: 'años' },
        'semestre': { s: 'semestre', p: 'semestres' },
        'trimestre': { s: 'trimestre', p: 'trimestres' },
        'semana': { s: 'semana', p: 'semanas' },
        'día': { s: 'día', p: 'días' },
        'h.': { s: 'h.', p: 'h.' },
        'min.': { s: 'min.', p: 'min.' },
        's.': { s: 's.', p: 's.' }
    },

    getDisplayName(unitKey, value) {
        const details = this.unitDetails[unitKey];
        if (!details) return unitKey;
        return value === 1 ? details.s : details.p;
    },

    // --- SISTEMA DE AUDIO ---
    audioCtx: null,
    bgMusic: null,   // MusicaBucle (bucle.js): sin la pausa de Chrome al repetir

    initAudio() {
        if (!this.audioCtx) {
            this.audioCtx = new (window.AudioContext || window.webkitAudioContext)();
        }
        if (this.audioCtx.state === 'suspended') {
            this.audioCtx.resume();
        }
    },

    playMusic(track) {
        if (!this.state.musicEnabled) return;

        const tracks = {
            'menu': 'music/menu.mp3',
            'ending': 'music/ending.mp3',
            'timeattack': 'music/1.mp3',
            'sudden_death': 'music/2.mp3',
            'practice': 'music/3.mp3',
            'survival': 'music/4.mp3'
        };
        const src = tracks[track];
        if (!src) return;

        if (this.bgMusic && this.bgMusic.src.includes(src) && !this.bgMusic.paused) {
            this.bgMusic.volume = 0.3;
            return;
        }

        if (this.bgMusic) this.bgMusic.pause();
        this.bgMusic = new MusicaBucle(src, { preload: 'auto' });
        this.bgMusic.volume = 0.3;
        const playPromise = this.bgMusic.play();
        if (playPromise !== undefined) {
             playPromise.catch(e => console.warn('Autoplay bloqueado:', e));
        }
    },

    stopMusic() {
        if (this.bgMusic) this.bgMusic.pause();
    },

    playSound(type) {
        if (!this.audioCtx) return;
        const o = this.audioCtx.createOscillator();
        const g = this.audioCtx.createGain();
        o.connect(g);
        g.connect(this.audioCtx.destination);

        const now = this.audioCtx.currentTime;

        if (type === 'correct') {
            o.type = 'sine';
            o.frequency.setValueAtTime(600, now);
            o.frequency.exponentialRampToValueAtTime(1200, now + 0.1);
            g.gain.setValueAtTime(0.3, now);
            g.gain.exponentialRampToValueAtTime(0.01, now + 0.3);
            o.start(now);
            o.stop(now + 0.3);
        } else if (type === 'wrong') {
            o.type = 'sawtooth';
            o.frequency.setValueAtTime(300, now);
            o.frequency.exponentialRampToValueAtTime(100, now + 0.3);
            g.gain.setValueAtTime(0.3, now);
            g.gain.exponentialRampToValueAtTime(0.01, now + 0.3);
            o.start(now);
            o.stop(now + 0.3);
        } else if (type === 'click') {
            o.type = 'square';
            o.frequency.setValueAtTime(400, now);
            g.gain.setValueAtTime(0.1, now);
            g.gain.exponentialRampToValueAtTime(0.01, now + 0.1);
            o.start(now);
            o.stop(now + 0.1);
        }
    },

    // --- NAVEGACIÓN ---
    showScreen(screenId) {
        this.playSound('click');
        document.querySelectorAll('.screen').forEach(s => {
            s.classList.remove('active');
            setTimeout(() => { if (!s.classList.contains('active')) s.classList.add('hidden'); }, 400);
        });
        
        const target = document.getElementById(screenId);
        target.classList.remove('hidden');
        setTimeout(() => target.classList.add('active'), 50);

        if (screenId === 'screen-ranking') {
            const select = document.getElementById('ranking-mode-select');
            if (this.state.lastPlayedMode) select.value = this.state.lastPlayedMode;
            this.renderRanking(select.value);
        }

        if (screenId === 'screen-home' || screenId === 'screen-modes' || screenId === 'screen-options' || screenId === 'screen-timeattack-config') {
            this.playMusic('menu');
        } else if (screenId === 'screen-results' || screenId === 'screen-ranking') {
            this.playMusic('ending');
        }
    },

    // --- INICIALIZACIÓN ---
    init() {
        const nameInput = document.getElementById('player-name');
        const btnStart = document.getElementById('btn-start');
        
        nameInput.addEventListener('input', (e) => {
            this.state.playerName = e.target.value.trim();
            btnStart.disabled = this.state.playerName.length === 0;
        });

        nameInput.addEventListener('keypress', (e) => {
            if (e.key === 'Enter' && !btnStart.disabled) {
                nameInput.blur();
                this.initAudio();
                this.showScreen('screen-modes');
            }
        });

        btnStart.addEventListener('click', () => {
            this.initAudio();
            this.showScreen('screen-modes');
        });

        document.querySelectorAll('.mode-card').forEach(btn => {
            btn.addEventListener('click', (e) => {
                const mode = e.currentTarget.dataset.mode;
                if (mode === 'timeattack-pre') {
                    this.showScreen('screen-timeattack-config');
                } else {
                    this.startGame(mode);
                }
            });
        });

        document.getElementById('ranking-mode-select').addEventListener('change', (e) => {
            this.renderRanking(e.target.value);
        });
        
        // Listener Global para forzar inicio de música
        const triggerAutoplay = () => {
            this.initAudio();
            if(document.getElementById('screen-home').classList.contains('active')) {
                this.playMusic('menu');
            }
            document.removeEventListener('click', triggerAutoplay);
            document.removeEventListener('keydown', triggerAutoplay);
        };
        document.addEventListener('click', triggerAutoplay);
        document.addEventListener('keydown', triggerAutoplay);

        // Opciones
        document.getElementById('btn-toggle-music').addEventListener('click', (e) => {
            this.state.musicEnabled = !this.state.musicEnabled;
            const btn = e.currentTarget;
            if (this.state.musicEnabled) {
                btn.innerHTML = '🎵 Música: Activada';
                btn.style.color = 'var(--success)';
                btn.style.borderColor = 'var(--success)';
                this.playMusic('menu');
            } else {
                btn.innerHTML = '🔇 Música: Desactivada';
                btn.style.color = 'var(--text-muted)';
                btn.style.borderColor = 'var(--glass-border)';
                this.stopMusic();
            }
        });

        document.getElementById('bg-selector').addEventListener('change', (e) => {
            this.state.bgType = e.target.value;
        });

        const glassSlider = document.getElementById('glass-slider');
        if (glassSlider) {
            glassSlider.addEventListener('input', (e) => {
                const val = parseFloat(e.target.value);
                const actualBlur = val / 2; // Rango corto y conservador: max 20px (12 -> 6px)
                document.documentElement.style.setProperty('--glass-blur', `${actualBlur}px`);
                document.documentElement.style.setProperty('--glass-opacity', val / 600);
            });
        }

        this.initCanvasBackground();
    },

    // --- MOTOR DEL JUEGO ---
    startTimeAttack(durationSeconds) {
        this.state.timeAttackDuration = durationSeconds;
        this.startGame('timeattack');
    },

    startGame(mode) {
        this.state.currentMode = mode;
        this.state.score = 0;
        this.state.streak = 0;
        this.state.maxStreak = 0;
        this.state.questionCount = 0;
        this.state.correctAnswers = 0;
        this.state.isPlaying = true;
        this.state.lives = 3;
        
        document.getElementById('hud-score').innerText = '0';
        
        const hudLives = document.getElementById('hud-lives-container');
        const hudTimer = document.getElementById('hud-time-container');
        const hudScore = document.getElementById('hud-score-container');
        const hudTimeValue = document.getElementById('hud-time');

        hudTimeValue.classList.remove('danger');
        hudScore.classList.remove('centered');

        const modeDisplay = document.getElementById('current-mode-name');

        if (mode !== 'practice') {
            this.state.lastPlayedMode = mode;
        }

        if (mode === 'timeattack') {
            modeDisplay.innerText = 'CONTRARRELOJ';
            hudLives.classList.add('hidden');
            hudTimer.classList.remove('hidden');
            hudTimer.style.display = 'flex';
            this.state.timeRemaining = this.state.timeAttackDuration || 60;
            this.startTimer();
        } else if (mode === 'sudden_death') {
            modeDisplay.innerText = 'MUERTE SÚBITA';
            hudLives.classList.add('hidden');
            hudTimer.classList.add('hidden');
            hudTimer.style.display = 'none'; // Seguridad extra por si CSS falla
            hudScore.classList.add('centered');
        } else if (mode === 'practice') {
            modeDisplay.innerText = 'ENTRENAMIENTO';
            hudLives.classList.add('hidden');
            hudTimer.classList.remove('hidden');
            hudTimer.style.display = 'flex';
            this.state.timeRemaining = 0;
            this.startTimer(true);
        } else if (mode === 'survival') {
            modeDisplay.innerText = 'SUPERVIVENCIA';
            hudLives.classList.remove('hidden');
            hudTimer.classList.remove('hidden');
            hudTimer.style.display = 'flex';
            this.state.timeRemaining = 15;
            this.updateLivesDisplay();
            this.startTimer();
        }

        this.showScreen('screen-game');
        this.playMusic(mode);
        this.generateQuestion();
    },

    abortGame() {
        this.playSound('click');
        this.state.isPlaying = false;
        clearInterval(this.state.timerId);
        this.showScreen('screen-home');
    },

    toggleTable() {
        this.playSound('click');
        const modal = document.getElementById('inline-conversion-table');
        if (modal.classList.contains('table-hidden')) {
            modal.classList.remove('table-hidden');
            modal.classList.add('table-visible');
        } else {
            modal.classList.remove('table-visible');
            modal.classList.add('table-hidden');
        }
    },

    retryGame() {
        this.playSound('click');
        if (this.state.currentMode === 'timeattack') {
            this.startGame('timeattack'); 
        } else {
            this.startGame(this.state.currentMode);
        }
    },

    openChangeNameModal() {
        this.playSound('click');
        const modal = document.getElementById('modal-change-name');
        const input = document.getElementById('new-player-name');
        input.value = this.state.playerName;
        modal.classList.remove('hidden');
        input.focus();
    },

    confirmChangeName() {
        this.playSound('click');
        const input = document.getElementById('new-player-name');
        const val = input.value.trim();
        if (val.length > 0) {
            this.state.playerName = val;
            document.getElementById('player-name').value = val;
            document.getElementById('modal-change-name').classList.add('hidden');
        }
    },

    updateLivesDisplay() {
        document.getElementById('hud-lives').innerText = '❤️'.repeat(this.state.lives);
    },

    startTimer(ascending = false) {
        clearInterval(this.state.timerId);
        this.updateTimerDisplay();

        this.state.timerId = setInterval(() => {
            if (ascending) {
                this.state.timeRemaining++;
            } else {
                this.state.timeRemaining--;
            }
            this.updateTimerDisplay();

            const hudTime = document.getElementById('hud-time');
            if (!ascending && this.state.timeRemaining <= 10 && this.state.currentMode === 'timeattack') {
                hudTime.classList.add('danger');
            } else if (!ascending && this.state.timeRemaining <= 5 && this.state.currentMode === 'survival') {
                hudTime.classList.add('danger');
            } else {
                hudTime.classList.remove('danger');
            }

            if (!ascending && this.state.timeRemaining <= 0) {
                if (this.state.currentMode === 'survival') {
                    this.state.lives--;
                    this.updateLivesDisplay();
                    this.showFeedback(false);
                    if (this.state.lives <= 0) {
                        this.endGame();
                    } else {
                        this.state.timeRemaining = 15;
                        this.state.streak = 0;
                        this.generateQuestion();
                    }
                } else {
                    this.endGame();
                }
            }
        }, 1000);
    },

    updateTimerDisplay() {
        const mins = Math.floor(Math.max(0, this.state.timeRemaining) / 60);
        const secs = Math.max(0, this.state.timeRemaining) % 60;
        document.getElementById('hud-time').innerText = `${mins.toString().padStart(2, '0')}:${secs.toString().padStart(2, '0')}`;
    },

    endGame() {
        this.state.isPlaying = false;
        clearInterval(this.state.timerId);
        
        document.getElementById('res-score').innerText = this.state.score;
        const accuracy = this.state.questionCount > 0 
            ? Math.round((this.state.correctAnswers / this.state.questionCount) * 100) 
            : 0;
        document.getElementById('res-accuracy').innerText = `${accuracy}%`;
        document.getElementById('res-streak').innerText = this.state.maxStreak;

        const msgElement = document.getElementById('res-message');
        if (accuracy > 90) msgElement.innerText = "¡Mente Maestra!";
        else if (accuracy > 70) msgElement.innerText = "¡Excelente rendimiento!";
        else if (accuracy > 50) msgElement.innerText = "Buen intento. Puedes mejorar.";
        else msgElement.innerText = "Necesitas más entrenamiento en el simulador.";

        if (this.state.currentMode !== 'practice' && this.state.score > 0) {
            this.saveRanking();
        }

        setTimeout(() => this.showScreen('screen-results'), 1000);
    },

    // --- GENERADOR DE PREGUNTAS ---
    generateQuestion() {
        if (!this.state.isPlaying) return;

        this.state.questionCount++;
        this.state.questionStartTime = Date.now();
        
        if (this.state.currentMode === 'survival') {
            this.state.timeRemaining = Math.max(5, 15 - Math.floor(this.state.correctAnswers / 5));
        }

        const categories = Object.keys(this.units);
        const cat = categories[Math.floor(Math.random() * categories.length)];
        const unitList = this.units[cat];
        const factorsParams = this.factorsParamsMap[cat];

        let idx1 = Math.floor(Math.random() * unitList.length);
        let idx2 = Math.floor(Math.random() * unitList.length);
        
        // Regla especial: Unidades mayores (milenio a lustro) suelen ir a 'años'
        const isMajorUnit = (cat === 'time_long' && idx1 <= 3); // milenio, siglo, década, lustro
        if (isMajorUnit) {
            idx2 = 4; // año
        } else {
            while (idx1 === idx2 || Math.abs(idx1 - idx2) > 3) {
                idx1 = Math.floor(Math.random() * unitList.length);
                idx2 = Math.floor(Math.random() * unitList.length);
            }
        }

        const unitFrom = unitList[idx1];
        const unitTo = unitList[idx2];

        let baseValue = Math.floor(Math.random() * 15) + 2; 

        const startIdx = Math.min(idx1, idx2);
        const endIdx = Math.max(idx1, idx2);
        
        let correctValueNum = baseValue;
        let operationsText = "";
        
        const isMultiplying = idx1 < idx2;
        
        if (cat === 'time_short') {
            // Grupo corto: mostrar cada paso intermedio con su unidad
            if (isMultiplying) {
                let ops = [];
                for (let i = startIdx; i < endIdx; i++) {
                    correctValueNum *= factorsParams[i];
                    const jumpName = this.getDisplayName(unitList[i + 1], factorsParams[i]);
                    ops.push(`X ${factorsParams[i]} ${jumpName}`);
                }
                operationsText = ops.join(' ');
            } else {
                let total = 1;
                for (let i = startIdx; i < endIdx; i++) {
                    total *= factorsParams[i];
                    baseValue *= factorsParams[i];
                }
                correctValueNum = baseValue / total;
                let ops = [];
                for (let i = endIdx - 1; i >= startIdx; i--) {
                    const jumpName = this.getDisplayName(unitList[i + 1], factorsParams[i]);
                    ops.push(`: ${factorsParams[i]} ${jumpName}`);
                }
                operationsText = ops.join(' ');
            }
        } else {
            // Grupo largo: factor total directo, un único paso
            if (isMultiplying) {
                let totalFactor = 1;
                for (let i = startIdx; i < endIdx; i++) {
                    correctValueNum *= factorsParams[i];
                    totalFactor *= factorsParams[i];
                }
                const targetName = this.getDisplayName(unitTo, totalFactor);
                operationsText = `X ${totalFactor} ${targetName}`;
            } else {
                let totalFactor = 1;
                for (let i = startIdx; i < endIdx; i++) {
                    totalFactor *= factorsParams[i];
                    baseValue *= factorsParams[i];
                }
                correctValueNum = baseValue / totalFactor;
                const sourceName = this.getDisplayName(unitFrom, totalFactor);
                operationsText = `: ${totalFactor} ${sourceName}`;
            }
        }
        
        const formatNumber = (num) => {
            let str = Number(num.toPrecision(7).replace(/\.?0+$/, '')).toString();
            if (str.includes('e')) {
                str = Number(num).toFixed(20).replace(/\.?0+$/, '');
            }
            return str;
        };

        const correctValueStr = formatNumber(correctValueNum);
        const nameFrom = this.getDisplayName(unitFrom, baseValue);
        const nameTo = this.getDisplayName(unitTo, correctValueNum);
        const correctStr = `${operationsText} <br><span class="result-span">(Resultado: ${correctValueStr} ${nameTo})</span>`;

        this.state.currentQuestion = {
            baseValue,
            unitFrom,
            unitTo,
            correctValue: correctStr
        };

        document.getElementById('question-text').innerHTML = `¿Qué operaciones hay que hacer para convertir <span class="highlight">${baseValue} ${nameFrom}</span> en <span class="highlight">${this.unitDetails[unitTo].p}</span>?`;

        const options = this.generateOptions(baseValue, startIdx, endIdx, isMultiplying, correctStr, factorsParams, unitTo, unitList, cat);
        const optContainer = document.getElementById('options-container');
        optContainer.innerHTML = '';

        options.forEach(opt => {
            const btn = document.createElement('button');
            btn.className = 'option-btn';
            btn.innerHTML = opt;
            btn.onclick = () => this.handleAnswer(opt, btn);
            optContainer.appendChild(btn);
        });
    },

    generateOptions(baseValue, startIdx, endIdx, isMultiplying, correctStr, factorsParams, unitTo, unitList, cat) {
        const formatNumber = (num) => {
            let str = Number(num.toPrecision(7).replace(/\.?0+$/, '')).toString();
            if (str.includes('e')) {
                str = Number(num).toFixed(20).replace(/\.?0+$/, '');
            }
            return str;
        };
        
        const options = new Set();
        options.add(correctStr);

        const numSteps = endIdx - startIdx;
        let attempts = 0;
        
        while (options.size < 4 && attempts < 50) {
            attempts++;
            let wrongIsMultiplying = (Math.random() > 0.3) ? isMultiplying : !isMultiplying;
            
            let numStepsDistract = numSteps;
            if (numSteps === 1 && Math.random() > 0.8) {
                numStepsDistract = 2;
            } else if (numSteps >= 2 && Math.random() > 0.8) {
                numStepsDistract = numSteps - 1;
            }

            let wrongFactors = [];
            for(let i=0; i < numStepsDistract; i++) {
                const choices = factorsParams;
                wrongFactors.push(choices[Math.floor(Math.random()*choices.length)]);
            }
            
            let wrongResult = baseValue;
            let ops = [];
            if (cat === 'time_short') {
                // Distractores con pasos intermedios, pero con alguna unidad o factor cambiado
                if (wrongIsMultiplying) {
                    for (let i = 0; i < wrongFactors.length; i++) {
                        wrongResult *= wrongFactors[i];
                        // Elegir una unidad cercana pero posiblemente errónea
                        const unitIdx = Math.min(startIdx + i + 1, unitList.length - 1);
                        const randomOffset = Math.random() > 0.5 ? 1 : -1;
                        const altIdx = Math.max(0, Math.min(unitList.length - 1, unitIdx + randomOffset));
                        const jumpName = this.getDisplayName(unitList[altIdx === unitIdx ? unitIdx : altIdx], wrongFactors[i]);
                        ops.push(`X ${wrongFactors[i]} ${jumpName}`);
                    }
                } else {
                    for (let i = wrongFactors.length - 1; i >= 0; i--) {
                        wrongResult /= wrongFactors[i];
                        const unitIdx = Math.min(endIdx - i, unitList.length - 1);
                        const altIdx = Math.max(1, Math.min(unitList.length - 1, unitIdx + (Math.random() > 0.5 ? 1 : 0)));
                        const jumpName = this.getDisplayName(unitList[altIdx], wrongFactors[i]);
                        ops.push(`: ${wrongFactors[i]} ${jumpName}`);
                    }
                }
            } else {
                // Distractores time_long: un único factor acumulado
                let wrongFactor = 1;
                if (wrongIsMultiplying) {
                    wrongFactors.forEach(f => { wrongFactor *= f; wrongResult *= f; });
                    const randUnit = unitList[Math.floor(Math.random() * unitList.length)];
                    ops.push(`X ${wrongFactor} ${this.getDisplayName(randUnit, wrongFactor)}`);
                } else {
                    wrongFactors.forEach(f => { wrongFactor *= f; wrongResult /= f; });
                    const randUnit = unitList[Math.floor(Math.random() * (unitList.length - 1)) + 1];
                    ops.push(`: ${wrongFactor} ${this.getDisplayName(randUnit, wrongFactor)}`);
                }
            }

            let wrongResultStr = formatNumber(wrongResult);
            let wrongText = ops.join(' ').trim();
            const wrongNameTo = this.getDisplayName(unitTo, wrongResult);
            let wrongStr = `${wrongText} <br><span class="result-span">(Resultado: ${wrongResultStr} ${wrongNameTo})</span>`;
            
            if (!options.has(wrongStr)) {
                options.add(wrongStr);
            }
        }
        
        return Array.from(options).sort(() => Math.random() - 0.5);
    },

    handleAnswer(selected, btnElement) {
        if (!this.state.isPlaying) return;
        
        btnElement.blur(); // Quitar foco para táctiles
        document.querySelectorAll('.option-btn').forEach(b => b.style.pointerEvents = 'none');

        const isCorrect = selected === this.state.currentQuestion.correctValue;
        const timeElapsed = Date.now() - this.state.questionStartTime;

        if (isCorrect) {
            btnElement.classList.add('correct');
            this.showFeedback(true);
            this.state.correctAnswers++;
            this.state.streak++;
            if (this.state.streak > this.state.maxStreak) this.state.maxStreak = this.state.streak;
            
            // Puntuación Dinámica
            let basePoints = 10;
            let speedPoints = 0;
            
            if (this.state.currentMode !== 'practice') {
                if (timeElapsed < 1500) {
                    speedPoints = 20;
                    this.showSpeedPopup("¡Velocidad Luz!", "super");
                } else if (timeElapsed < 3000) {
                    speedPoints = 10;
                    this.showSpeedPopup("¡Qué rápido!", "high");
                }
            }
            
            let totalPoints = basePoints + speedPoints + (this.state.streak * 2); 
            this.state.score += totalPoints;
            this.animateScoreChange(totalPoints);

            setTimeout(() => this.generateQuestion(), 600);
        } else {
            btnElement.classList.add('wrong');
            document.querySelectorAll('.option-btn').forEach(b => {
                if (b.innerHTML === this.state.currentQuestion.correctValue) {
                    b.classList.add('correct');
                }
            });

            this.showFeedback(false);
            this.state.streak = 0;

            if (this.state.currentMode === 'sudden_death') {
                setTimeout(() => this.endGame(), 1000);
            } else if (this.state.currentMode === 'survival') {
               this.state.lives--;
               this.updateLivesDisplay();
               if(this.state.lives <= 0) {
                   setTimeout(() => this.endGame(), 1000);
               } else {
                   setTimeout(() => this.generateQuestion(), 1000);
               }
            } else {
               setTimeout(() => this.generateQuestion(), 1000);
            }
        }
        
        document.getElementById('hud-score').innerText = this.state.score;
    },

    showSpeedPopup(text, typeClass) {
        const board = document.querySelector('.game-board');
        const pop = document.createElement('div');
        pop.className = `speed-popup speed-text-${typeClass}`;
        pop.innerText = text;
        board.appendChild(pop);
        setTimeout(() => pop.remove(), 1200);
    },

    showFeedback(isCorrect) {
        this.playSound(isCorrect ? 'correct' : 'wrong');
        const overlay = document.getElementById('feedback-overlay');
        overlay.className = `feedback-fx ${isCorrect ? 'correct' : 'wrong'}`;
        
        if (!isCorrect) {
            const board = document.querySelector('.game-board');
            board.style.animation = 'wrongShake 0.4s ease';
            setTimeout(() => board.style.animation = '', 400);
        }
        setTimeout(() => { overlay.className = 'feedback-fx'; }, 300);
    },

    animateScoreChange(points) {
        const hudValue = document.getElementById('hud-score');
        const pop = document.createElement('div');
        pop.innerText = `+${points}`;
        pop.style.position = 'absolute';
        pop.style.color = 'var(--success)';
        pop.style.fontWeight = 'bold';
        pop.style.fontSize = '1.2rem';
        pop.style.pointerEvents = 'none';
        
        const rect = hudValue.getBoundingClientRect();
        pop.style.left = `${rect.left + rect.width}px`;
        pop.style.top = `${rect.top}px`;
        
        document.body.appendChild(pop);
        
        pop.animate([
            { transform: 'translateY(0)', opacity: 1 },
            { transform: 'translateY(-40px) scale(1.5)', opacity: 0 }
        ], { duration: 800, easing: 'ease-out' }).onfinish = () => pop.remove();
        
        hudValue.animate([
            { transform: 'scale(1)' },
            { transform: 'scale(1.3)' },
            { transform: 'scale(1)' }
        ], { duration: 300 });
    },

    // --- LEADERBOARD ---
    saveRanking() {
        const rankings = JSON.parse(localStorage.getItem('tiempo_rankings') || '{}');
        const key = this.state.currentMode === 'timeattack' 
            ? `timeattack_${this.state.timeAttackDuration}` 
            : this.state.currentMode;
            
        if (!rankings[key]) rankings[key] = [];
        
        rankings[key].push({
            name: this.state.playerName,
            score: this.state.score,
            date: new Date().toLocaleDateString()
        });

        rankings[key].sort((a, b) => b.score - a.score);
        rankings[key] = rankings[key].slice(0, 10);
        localStorage.setItem('tiempo_rankings', JSON.stringify(rankings));
    },

    renderRanking(mode) {
        // En timeattack mostramos por defecto el de 60s o se puede agrupar. Para simplificar mostramos timeattack_60 o el primero.
        if (mode === 'timeattack') mode = 'timeattack_60';
        
        const rankings = JSON.parse(localStorage.getItem('tiempo_rankings') || '{}');
        const data = rankings[mode] || [];
        const tbody = document.getElementById('ranking-body');
        
        tbody.innerHTML = '';
        if (data.length === 0) {
            tbody.innerHTML = '<tr><td colspan="4" class="text-center text-muted">Sin datos registrados aún.</td></tr>';
            return;
        }

        data.forEach((entry, idx) => {
            const tr = document.createElement('tr');
            tr.innerHTML = `
                <td>${idx + 1}</td>
                <td>${entry.name}</td>
                <td>${entry.score}</td>
                <td>${entry.date}</td>
            `;
            tbody.appendChild(tr);
        });
    },

    // --- MOTOR DE FONDOS ---
    initCanvasBackground() {
        const canvas = document.getElementById('bg-canvas');
        const ctx = canvas.getContext('2d');
        let width, height;

        const resize = () => {
            width = window.innerWidth;
            height = window.innerHeight;
            canvas.width = width;
            canvas.height = height;
        };

        window.addEventListener('resize', resize);
        resize();

        // Estado interno para las animaciones
        let sandParticles = [];
        let clocks = [];
        let warpTime = 0;

        // Generar particles (arena)
        for (let i = 0; i < 150; i++) {
            sandParticles.push({
                x: Math.random() * width,
                y: Math.random() * height,
                vx: (Math.random() - 0.5) * 0.2,
                vy: Math.random() * 2 + 1,
                size: Math.random() * 2 + 1
            });
        }
        
        // Generar relojes
        for (let i = 0; i < 15; i++) {
            clocks.push({
                x: Math.random() * width,
                y: Math.random() * height,
                radius: Math.random() * 40 + 20,
                speedMultiplier: (Math.random() - 0.5) * 2,
                offset: Math.random() * Math.PI * 2
            });
        }

        const renderSand = () => {
            ctx.fillStyle = 'rgba(255, 209, 102, 0.4)';
            for (let i = 0; i < sandParticles.length; i++) {
                let p = sandParticles[i];
                p.x += p.vx;
                p.y += p.vy;

                if (p.y > height) {
                    p.y = -10;
                    p.x = Math.random() * width;
                }

                ctx.beginPath();
                ctx.arc(p.x, p.y, p.size, 0, Math.PI * 2);
                ctx.fill();
            }
        };

        const renderClocks = () => {
            const now = Date.now() / 1000;
            ctx.strokeStyle = 'rgba(17, 138, 178, 0.3)';
            ctx.fillStyle = 'rgba(255, 255, 255, 0.1)';
            
            for(let i = 0; i < clocks.length; i++) {
                let c = clocks[i];
                ctx.beginPath();
                ctx.arc(c.x, c.y, c.radius, 0, Math.PI * 2);
                ctx.fill();
                ctx.lineWidth = 2;
                ctx.stroke();

                let angle = (now * c.speedMultiplier) + c.offset;
                ctx.beginPath();
                ctx.moveTo(c.x, c.y);
                ctx.lineTo(c.x + Math.cos(angle) * (c.radius * 0.8), c.y + Math.sin(angle) * (c.radius * 0.8));
                ctx.lineCap = 'round';
                ctx.lineWidth = 3;
                ctx.stroke();
            }
            
            for(let i=0; i < clocks.length; i++) {
                clocks[i].y -= 0.2;
                if(clocks[i].y + clocks[i].radius < 0) {
                   clocks[i].y = height + clocks[i].radius;
                   clocks[i].x = Math.random() * width;
                }
            }
        };

        const renderWarp = () => {
            warpTime += 0.05;
            const centerX = width / 2;
            const centerY = height / 2;
            const maxRadius = Math.max(width, height);
            
            ctx.lineWidth = 4;
            for (let i = 0; i < 10; i++) {
                let currentRadius = (maxRadius * (i / 10) + warpTime * 50) % maxRadius;
                let alpha = 1 - (currentRadius / maxRadius);
                
                ctx.beginPath();
                ctx.strokeStyle = `rgba(255, 209, 102, ${alpha * 0.5})`;
                ctx.arc(centerX, centerY, currentRadius, 0, Math.PI * 2);
                ctx.stroke();
            }
            
            for (let i=0; i< 12; i++) {
               let angle = (i * Math.PI * 2) / 12 + warpTime * 0.1;
               ctx.beginPath();
               ctx.strokeStyle = `rgba(17, 138, 178, 0.15)`;
               ctx.moveTo(centerX + Math.cos(angle)*50, centerY + Math.sin(angle)*50);
               ctx.lineTo(centerX + Math.cos(angle)*maxRadius, centerY + Math.sin(angle)*maxRadius);
               ctx.stroke();
            }
        };

        const loop = () => {
            ctx.clearRect(0, 0, width, height);
            
            if (this.state.bgType === 'particles') {
                renderSand();
            } else if (this.state.bgType === 'stars') {
                renderClocks();
            } else if (this.state.bgType === 'waves') {
                renderWarp();
            }
            
            this.state.bgAnimationId = requestAnimationFrame(loop);
        };
        loop();
    }
};

document.addEventListener('DOMContentLoaded', () => {
    app.init();
});
