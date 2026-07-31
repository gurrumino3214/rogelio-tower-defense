/**
 * ========================================
 * UI.JS - Sistema de Interfaz de Usuario
 * ========================================
 * Maneja toda la interfaz del juego:
 * - HUD principal
 * - Menús
 * - Notificaciones
 * - Barras de progreso
 */

const UI = {
    // Elementos DOM
    elements: {},
    
    /**
     * Inicializa la interfaz
     */
    init: function() {
        this.createUIElements();
    },
    
    /**
     * Crea los elementos HTML de la UI
     */
    createUIElements: function() {
        const container = document.getElementById('ui-overlay');
        if (!container) return;
        
        container.innerHTML = `
            <!-- HUD Principal -->
            <div id="hud" class="game-ui">
                <div class="ui-panel">
                    <div class="stat-row">
                        <span class="ui-text">VIDAS:</span>
                        <span id="lives-display" class="ui-value">20</span>
                    </div>
                    <div class="stat-row">
                        <span class="ui-text">ORO:</span>
                        <span id="gold-display" class="ui-value">100</span>
                    </div>
                    <div class="stat-row">
                        <span class="ui-text">OLA:</span>
                        <span id="wave-display" class="ui-value">1</span>
                    </div>
                    <div class="stat-row">
                        <span class="ui-text">PUNTOS:</span>
                        <span id="score-display" class="ui-value">0</span>
                    </div>
                </div>
                
                <!-- Barra de vida del jugador -->
                <div class="health-bar">
                    <div id="player-health-fill" class="health-fill" style="width: 100%"></div>
                </div>
            </div>
            
            <!-- Menú Principal -->
            <div id="menu-screen" class="screen active">
                <h1 class="game-title">TOWER DEFENSE</h1>
                <p class="subtitle">Dark Pixel Art Edition</p>
                <button id="start-btn" class="ui-button">INICIAR JUEGO</button>
            </div>
            
            <!-- Menú de Pausa -->
            <div id="pause-screen" class="screen hidden">
                <h2 class="screen-title">PAUSA</h2>
                <button id="resume-btn" class="ui-button">CONTINUAR</button>
                <button id="quit-btn" class="ui-button">SALIR</button>
            </div>
            
            <!-- Game Over -->
            <div id="gameover-screen" class="screen hidden">
                <h2 class="screen-title game-over">GAME OVER</h2>
                <p class="final-score">Puntuación Final: <span id="final-score">0</span></p>
                <button id="restart-btn" class="ui-button">REINTENTAR</button>
            </div>
            
            <!-- Notificación de ola -->
            <div id="wave-notification" class="notification hidden">
                <span id="wave-text">OLA 1</span>
            </div>
            
            <!-- Efecto CRT opcional -->
            <div class="crt-overlay"></div>
        `;
        
        // Guardar referencias
        this.elements = {
            lives: document.getElementById('lives-display'),
            gold: document.getElementById('gold-display'),
            wave: document.getElementById('wave-display'),
            score: document.getElementById('score-display'),
            healthFill: document.getElementById('player-health-fill'),
            menuScreen: document.getElementById('menu-screen'),
            pauseScreen: document.getElementById('pause-screen'),
            gameoverScreen: document.getElementById('gameover-screen'),
            waveNotification: document.getElementById('wave-notification'),
            waveText: document.getElementById('wave-text'),
            finalScore: document.getElementById('final-score')
        };
        
        // Configurar eventos de botones
        this.setupButtonEvents();
    },
    
    /**
     * Configura los eventos de los botones
     */
    setupButtonEvents: function() {
        document.getElementById('start-btn')?.addEventListener('click', () => {
            Game.startGame();
        });
        
        document.getElementById('resume-btn')?.addEventListener('click', () => {
            Game.togglePause();
        });
        
        document.getElementById('quit-btn')?.addEventListener('click', () => {
            location.reload();
        });
        
        document.getElementById('restart-btn')?.addEventListener('click', () => {
            Game.startGame();
        });
        
        // Tecla ESC para pausar
        document.addEventListener('keydown', (e) => {
            if (e.key === 'Escape' && Game.state === 'PLAYING') {
                Game.togglePause();
            }
        });
    },
    
    /**
     * Actualiza las estadísticas del HUD
     * @param {number} lives 
     * @param {number} gold 
     * @param {number} wave 
     * @param {number} score 
     */
    updateStats: function(lives, gold, wave, score) {
        if (this.elements.lives) {
            this.elements.lives.textContent = lives;
        }
        if (this.elements.gold) {
            this.elements.gold.textContent = gold;
        }
        if (this.elements.wave) {
            this.elements.wave.textContent = wave;
        }
        if (this.elements.score) {
            this.elements.score.textContent = score;
        }
        
        // Actualizar barra de vida
        if (this.elements.healthFill) {
            const healthPercent = (lives / 20) * 100;
            this.elements.healthFill.style.width = healthPercent + '%';
        }
    },
    
    /**
     * Muestra el menú principal
     */
    showMenu: function() {
        this.hideAllScreens();
        if (this.elements.menuScreen) {
            this.elements.menuScreen.classList.remove('hidden');
            this.elements.menuScreen.classList.add('active');
        }
    },
    
    /**
     * Oculta el menú principal
     */
    hideMenu: function() {
        if (this.elements.menuScreen) {
            this.elements.menuScreen.classList.remove('active');
            this.elements.menuScreen.classList.add('hidden');
        }
    },
    
    /**
     * Muestra el menú de pausa
     */
    showPauseMenu: function() {
        this.hideAllScreens();
        if (this.elements.pauseScreen) {
            this.elements.pauseScreen.classList.remove('hidden');
            this.elements.pauseScreen.classList.add('active');
        }
    },
    
    /**
     * Muestra la pantalla de game over
     * @param {number} score 
     */
    showGameOver: function(score) {
        this.hideAllScreens();
        if (this.elements.gameoverScreen) {
            this.elements.gameoverScreen.classList.remove('hidden');
            this.elements.gameoverScreen.classList.add('active');
        }
        if (this.elements.finalScore) {
            this.elements.finalScore.textContent = score;
        }
    },
    
    /**
     * Muestra notificación de inicio de ola
     * @param {number} waveNumber 
     */
    showWaveStart: function(waveNumber) {
        if (this.elements.waveNotification && this.elements.waveText) {
            this.elements.waveText.textContent = `OLA ${waveNumber}`;
            this.elements.waveNotification.classList.remove('hidden');
            
            // Ocultar después de 3 segundos
            setTimeout(() => {
                this.elements.waveNotification.classList.add('hidden');
            }, 3000);
        }
    },
    
    /**
     * Muestra indicador de daño
     */
    showDamageIndicator: function() {
        const hud = document.getElementById('hud');
        if (hud) {
            hud.classList.add('pulse');
            setTimeout(() => {
                hud.classList.remove('pulse');
            }, 500);
        }
    },
    
    /**
     * Oculta todas las pantallas
     */
    hideAllScreens: function() {
        const screens = document.querySelectorAll('.screen');
        screens.forEach(screen => {
            screen.classList.remove('active');
            screen.classList.add('hidden');
        });
    }
};

// Estilos CSS dinámicos para la UI
const uiStyles = `
<style>
.screen {
    position: absolute;
    top: 0;
    left: 0;
    width: 100%;
    height: 100%;
    display: flex;
    flex-direction: column;
    justify-content: center;
    align-items: center;
    background-color: rgba(10, 10, 12, 0.9);
    z-index: 100;
}

.screen.hidden {
    display: none;
}

.game-title {
    font-size: 48px;
    color: #d0d0d5;
    text-shadow: 4px 4px 0 #0a0a0c, 6px 6px 0 #8b2e2e;
    letter-spacing: 8px;
    margin-bottom: 10px;
}

.subtitle {
    font-size: 18px;
    color: #808085;
    letter-spacing: 4px;
    margin-bottom: 40px;
}

.screen-title {
    font-size: 36px;
    color: #d0d0d5;
    text-shadow: 3px 3px 0 #0a0a0c;
    letter-spacing: 6px;
    margin-bottom: 30px;
}

.screen-title.game-over {
    color: #8b2e2e;
    text-shadow: 3px 3px 0 #0a0a0c, 5px 5px 0 #4a0a0a;
}

.ui-button {
    background-color: #1a1a20;
    border: 2px solid #8b6b2e;
    color: #d0d0d5;
    padding: 15px 40px;
    font-size: 18px;
    font-family: 'Courier New', monospace;
    cursor: pointer;
    margin: 10px;
    text-transform: uppercase;
    letter-spacing: 2px;
    box-shadow: 4px 4px 0 #0a0a0c;
    transition: all 0.1s;
}

.ui-button:hover {
    background-color: #2a2a30;
    transform: translate(-2px, -2px);
    box-shadow: 6px 6px 0 #0a0a0c;
}

.ui-button:active {
    transform: translate(2px, 2px);
    box-shadow: 2px 2px 0 #0a0a0c;
}

.stat-row {
    margin-bottom: 8px;
    font-size: 16px;
}

.notification {
    position: absolute;
    top: 100px;
    left: 50%;
    transform: translateX(-50%);
    background-color: rgba(26, 26, 32, 0.9);
    border: 2px solid #8b2e2e;
    padding: 20px 40px;
    color: #d0d0d5;
    font-size: 32px;
    text-transform: uppercase;
    letter-spacing: 4px;
    box-shadow: 4px 4px 0 #0a0a0c;
    z-index: 50;
}

.final-score {
    font-size: 24px;
    color: #8b6b2e;
    margin-bottom: 30px;
}
</style>
`;

// Insertar estilos cuando el DOM esté listo
document.head.insertAdjacentHTML('beforeend', uiStyles);
