/**
 * ========================================
 * UI.JS - Sistema de Interfaz de Usuario
 * ========================================
 * Punto de entrada principal para el sistema de UI
 * 
 * Estructura modular:
 * - components/: Componentes base (Button, Panel, Bar, Label, Item)
 * - screens/: Pantallas completas (MainMenu, HUD, Pause)
 * - systems/: Sistemas gestores (UIManager)
 */

// Objeto UI global para compatibilidad con el resto del código
const UI = {
    manager: null,
    initialized: false,
    
    /**
     * Inicializa el sistema de UI
     */
    init() {
        if (this.initialized) return;
        
        const canvas = document.getElementById('gameCanvas');
        if (!canvas) {
            console.error('Game canvas not found');
            return;
        }
        
        this.manager = new UIManager(canvas, 800, 600);
        this.initialized = true;
        console.log('UI System initialized');
    },
    
    /**
     * Muestra el menú principal
     */
    showMenu() {
        if (!this.initialized) this.init();
        if (this.manager) {
            this.manager.setActiveScreen('mainMenu');
            this.manager.hideHUD();
        }
    },
    
    /**
     * Oculta el menú principal
     */
    hideMenu() {
        if (this.manager) {
            this.manager.hideHUD();
        }
    },
    
    /**
     * Muestra el HUD durante el juego
     */
    showHUD() {
        if (this.manager) {
            this.manager.showHUD();
        }
    },
    
    /**
     * Oculta el HUD
     */
    hideHUD() {
        if (this.manager) {
            this.manager.hideHUD();
        }
    },
    
    /**
     * Muestra el menú de pausa
     */
    showPauseMenu() {
        if (this.manager) {
            this.manager.showPause();
        }
    },
    
    /**
     * Oculta el menú de pausa
     */
    hidePauseMenu() {
        if (this.manager) {
            this.manager.hidePause();
        }
    },
    
    /**
     * Muestra pantalla de game over
     * @param {number} score - Puntuación final
     */
    showGameOver(score) {
        if (this.manager && this.manager.hudScreen) {
            // Mostrar mensaje de game over en el HUD
            this.manager.hudScreen.showGameOver(score);
        }
    },
    
    /**
     * Actualiza las estadísticas del juego
     * @param {number} lives - Vidas restantes
     * @param {number} gold - Oro disponible
     * @param {number} wave - Ola actual
     * @param {number} score - Puntuación
     */
    updateStats(lives, gold, wave, score) {
        if (!this.manager) return;
        this.manager.updateLives(lives);
        this.manager.updateGold(gold);
        this.manager.updateWave(wave);
        this.manager.updateScore(score);
    },
    
    /**
     * Muestra indicador de daño
     */
    showDamageIndicator() {
        if (this.manager && this.manager.hudScreen) {
            this.manager.hudScreen.showDamageFlash();
        }
    },
    
    /**
     * Muestra inicio de ola
     * @param {number} wave - Número de ola
     */
    showWaveStart(wave) {
        if (this.manager && this.manager.hudScreen) {
            this.manager.hudScreen.showWaveNotification(wave);
        }
    },
    
    /**
     * Muestra información de torre
     * @param {Object} tower - Datos de la torre
     */
    showTowerInfo(tower) {
        if (this.manager && this.manager.hudScreen) {
            this.manager.hudScreen.showTowerDetails(tower);
        }
    },
    
    /**
     * Oculta información de torre
     */
    hideTowerInfo() {
        if (this.manager && this.manager.hudScreen) {
            this.manager.hudScreen.hideTowerDetails();
        }
    },
    
    /**
     * Muestra preview de colocación de torre
     * @param {Object} towerType - Tipo de torre
     */
    showPlacementPreview(towerType) {
        if (this.manager && this.manager.hudScreen) {
            this.manager.hudScreen.showPlacementPreview(towerType);
        }
    },
    
    /**
     * Oculta preview de colocación
     */
    hidePlacementPreview() {
        if (this.manager && this.manager.hudScreen) {
            this.manager.hudScreen.hidePlacementPreview();
        }
    },
    
    /**
     * Actualiza FPS mostrados
     * @param {number} fps - Frames por segundo
     */
    updateFPS(fps) {
        if (this.manager) {
            this.manager.updateFPS(fps);
        }
    },
    
    /**
     * Muestra notificación
     * @param {string} text - Texto de notificación
     * @param {string} color - Color
     * @param {number} duration - Duración en ms
     */
    showNotification(text, color = '#ffffff', duration = 2000) {
        if (this.manager) {
            this.manager.showNotification(text, color, duration);
        }
    },
    
    /**
     * Alterna panel de construcción
     */
    toggleBuildPanel() {
        if (this.manager) {
            this.manager.toggleBuildPanel();
        }
    },
    
    /**
     * Establece torre seleccionada
     * @param {Object} tower - Torre seleccionada
     */
    setSelectedTower(tower) {
        if (this.manager) {
            this.manager.setSelectedTower(tower);
        }
    },
    
    /**
     * Renderiza la UI
     * @param {number} deltaTime - Tiempo delta
     */
    render(deltaTime) {
        if (this.manager) {
            this.manager.update(deltaTime);
            this.manager.render();
        }
    }
};

// Cargar componentes base primero
// (Se asume que los scripts se cargan en orden en index.html)

// Estilos CSS dinámicos para efectos UI globales
const uiStyles = `
<style>
/* Animaciones de transición */
@keyframes fadeIn {
    from { opacity: 0; }
    to { opacity: 1; }
}

@keyframes fadeOut {
    from { opacity: 1; }
    to { opacity: 0; }
}

@keyframes slideIn {
    from { transform: translateY(-20px); opacity: 0; }
    to { transform: translateY(0); opacity: 1; }
}

@keyframes pulse {
    0%, 100% { opacity: 1; }
    50% { opacity: 0.7; }
}

.ui-fade-in {
    animation: fadeIn 0.3s ease;
}

.ui-fade-out {
    animation: fadeOut 0.3s ease;
}

.ui-slide-in {
    animation: slideIn 0.3s ease;
}

.ui-pulse {
    animation: pulse 2s infinite;
}
</style>
`;

// Insertar estilos cuando el DOM esté listo
if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', () => {
        document.head.insertAdjacentHTML('beforeend', uiStyles);
    });
} else {
    document.head.insertAdjacentHTML('beforeend', uiStyles);
}

