/**
 * ========================================
 * GAME.JS - Punto de Entrada Principal
 * ========================================
 * Controla el estado global del juego:
 * - Inicialización de sistemas
 * - Gestión de estados (menú, jugando, pausa)
 * - Coordinación de módulos
 */

const Game = {
    // Estado actual del juego
    state: 'INIT', // INIT, MENU, PLAYING, PAUSED, GAMEOVER
    
    // Configuración del juego
    config: {
        startLives: 20,
        startGold: 100
    },
    
    // Estado del juego actual
    lives: 20,
    gold: 100,
    wave: 1,
    score: 0,
    
    // Referencias a sistemas
    currentWave: null,
    
    /**
     * Inicializa todos los sistemas del juego
     */
    init: function() {
        console.log('Initializing Tower Defense...');
        
        // Resetear estado
        this.lives = this.config.startLives;
        this.gold = this.config.startGold;
        this.wave = 1;
        this.score = 0;
        
        // Inicializar UI
        if (typeof UI !== 'undefined') {
            UI.init();
            UI.updateStats(this.lives, this.gold, this.wave, this.score);
        }
        
        // Cambiar a estado menú
        this.changeState('MENU');
        
        console.log('Tower Defense initialized');
    },
    
    /**
     * Cambia el estado del juego
     * @param {string} newState 
     */
    changeState: function(newState) {
        const oldState = this.state;
        this.state = newState;
        
        console.log(`State changed: ${oldState} -> ${newState}`);
        
        // Manejar transiciones de estado
        switch(newState) {
            case 'MENU':
                this.onMenuEnter();
                break;
            case 'PLAYING':
                this.onPlayEnter();
                break;
            case 'PAUSED':
                this.onPauseEnter();
                break;
            case 'GAMEOVER':
                this.onGameOverEnter();
                break;
        }
    },
    
    /**
     * Called when entering menu state
     */
    onMenuEnter: function() {
        Engine.pause();
        if (typeof UI !== 'undefined') {
            UI.showMenu();
        }
    },
    
    /**
     * Called when entering play state
     */
    onPlayEnter: function() {
        Engine.resume();
        if (typeof UI !== 'undefined') {
            UI.hideMenu();
        }
    },
    
    /**
     * Called when entering paused state
     */
    onPauseEnter: function() {
        Engine.pause();
        if (typeof UI !== 'undefined') {
            UI.showPauseMenu();
        }
    },
    
    /**
     * Called when entering game over state
     */
    onGameOverEnter: function() {
        Engine.pause();
        if (typeof UI !== 'undefined') {
            UI.showGameOver(this.score);
        }
    },
    
    /**
     * Inicia una nueva partida
     */
    startGame: function() {
        console.log('Starting new game...');
        
        // Resetear variables
        this.lives = this.config.startLives;
        this.gold = this.config.startGold;
        this.wave = 1;
        this.score = 0;
        
        // Limpiar entidades existentes
        Engine.entities = [];
        Engine.entitiesToAdd = [];
        Engine.entitiesToRemove = [];
        
        // Actualizar UI
        if (typeof UI !== 'undefined') {
            UI.updateStats(this.lives, this.gold, this.wave, this.score);
        }
        
        // Iniciar primera ola
        this.startWave();
        
        // Cambiar a estado jugando
        this.changeState('PLAYING');
    },
    
    /**
     * Inicia la siguiente ola de enemigos
     */
    startWave: function() {
        console.log(`Starting wave ${this.wave}`);
        
        if (typeof Waves !== 'undefined') {
            this.currentWave = Waves.createWave(this.wave);
        }
        
        if (typeof UI !== 'undefined') {
            UI.showWaveStart(this.wave);
        }
    },
    
    /**
     * Called when a wave is completed
     */
    completeWave: function() {
        console.log(`Wave ${this.wave} completed!`);
        
        this.wave++;
        
        if (typeof UI !== 'undefined') {
            UI.updateStats(this.lives, this.gold, this.wave, this.score);
        }
        
        // Iniciar siguiente ola después de un delay
        setTimeout(() => {
            if (this.state === 'PLAYING') {
                this.startWave();
            }
        }, 3000);
    },
    
    /**
     * Añade oro al jugador
     * @param {number} amount 
     */
    addGold: function(amount) {
        this.gold += amount;
        if (typeof UI !== 'undefined') {
            UI.updateStats(this.lives, this.gold, this.wave, this.score);
        }
    },
    
    /**
     * Gasta oro del jugador
     * @param {number} amount 
     * @returns {boolean} - True si se pudo gastar
     */
    spendGold: function(amount) {
        if (this.gold >= amount) {
            this.gold -= amount;
            if (typeof UI !== 'undefined') {
                UI.updateStats(this.lives, this.gold, this.wave, this.score);
            }
            return true;
        }
        return false;
    },
    
    /**
     * Resta una vida al jugador
     * @param {number} amount 
     */
    loseLife: function(amount = 1) {
        this.lives -= amount;
        
        if (typeof UI !== 'undefined') {
            UI.updateStats(this.lives, this.gold, this.wave, this.score);
            UI.showDamageIndicator();
        }
        
        // Verificar game over
        if (this.lives <= 0) {
            this.changeState('GAMEOVER');
        }
    },
    
    /**
     * Añade puntos al jugador
     * @param {number} amount 
     */
    addScore: function(amount) {
        this.score += amount;
        if (typeof UI !== 'undefined') {
            UI.updateStats(this.lives, this.gold, this.wave, this.score);
        }
    },
    
    /**
     * Alterna pausa
     */
    togglePause: function() {
        if (this.state === 'PLAYING') {
            this.changeState('PAUSED');
        } else if (this.state === 'PAUSED') {
            this.changeState('PLAYING');
        }
    }
};

/**
 * ========================================
 * INICIALIZACIÓN AUTOMÁTICA
 * ========================================
 */
window.onload = function() {
    // Inicializar el engine
    if (typeof Engine !== 'undefined') {
        Engine.init();
        Engine.start();
        console.log('Engine started');
    }
    
    // Inicializar UI
    if (typeof UI !== 'undefined') {
        UI.init();
    }
    
    // Inicializar juego y mostrar menú
    if (typeof Game !== 'undefined') {
        Game.init();
    }
    
    console.log('Dark Pixel Art Tower Defense - Ready');
};
