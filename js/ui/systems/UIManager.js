/**
 * ========================================
 * UIManager.js - Gestor Principal de UI
 * ========================================
 * Coordina todas las pantallas y componentes de UI
 * con el sistema de juego
 */

class UIManager {
    constructor(canvas, canvasWidth = 800, canvasHeight = 600) {
        this.canvas = canvas;
        this.ctx = canvas.getContext('2d');
        this.canvasWidth = canvasWidth;
        this.canvasHeight = canvasHeight;
        
        // Pantallas
        this.screens = {};
        this.activeScreen = null;
        this.hudScreen = null;
        
        // Estado del mouse
        this.mouseX = 0;
        this.mouseY = 0;
        
        // Cursor personalizado
        this.cursorType = 'default';
        
        // Inicializar pantallas
        this.initializeScreens();
        
        // Configurar eventos
        this.setupEvents();
    }

    initializeScreens() {
        // Crear pantalla de menú principal
        this.screens.mainMenu = new MainMenuScreen(this.canvasWidth, this.canvasHeight);
        
        // Crear HUD (se activa durante el juego)
        this.hudScreen = new HUDScreen(this.canvasWidth, this.canvasHeight);
        this.hudScreen.hide();
        
        // Crear pantalla de pausa
        this.screens.pause = new PauseScreen(this.canvasWidth, this.canvasHeight);
        this.screens.pause.hide();
        
        // Activar menú principal por defecto
        this.setActiveScreen('mainMenu');
    }

    setActiveScreen(screenName) {
        // Ocultar todas las pantallas
        Object.values(this.screens).forEach(screen => {
            if (screen && screen !== this.hudScreen) {
                screen.hide();
            }
        });
        
        if (this.hudScreen) {
            this.hudScreen.hide();
        }
        
        // Mostrar pantalla activa
        if (this.screens[screenName]) {
            this.activeScreen = screenName;
            this.screens[screenName].show();
        }
    }

    showHUD() {
        if (this.hudScreen) {
            this.hudScreen.show();
            this.hudScreen.visible = true;
        }
    }

    hideHUD() {
        if (this.hudScreen) {
            this.hudScreen.hide();
        }
    }

    showPause() {
        if (this.screens.pause) {
            this.screens.pause.show();
        }
    }

    hidePause() {
        if (this.screens.pause) {
            this.screens.pause.hide();
        }
    }

    update(deltaTime) {
        // Actualizar pantalla activa
        if (this.activeScreen && this.screens[this.activeScreen]) {
            this.screens[this.activeScreen].update(deltaTime);
        }
        
        // Actualizar HUD si está visible
        if (this.hudScreen && this.hudScreen.visible) {
            this.hudScreen.update(deltaTime);
        }
    }

    render() {
        // Renderizar pantalla activa
        if (this.activeScreen && this.screens[this.activeScreen]) {
            this.screens[this.activeScreen].render(this.ctx);
        }
        
        // Renderizar HUD encima
        if (this.hudScreen && this.hudScreen.visible) {
            this.hudScreen.render(this.ctx);
        }
        
        // Renderizar cursor personalizado
        this.renderCursor();
    }

    renderCursor() {
        // Cursor personalizado pixel art
        const size = 20;
        this.ctx.fillStyle = '#d0d0d5';
        
        if (this.cursorType === 'pointer') {
            // Cursor de mano
            this.ctx.beginPath();
            this.ctx.moveTo(this.mouseX, this.mouseY);
            this.ctx.lineTo(this.mouseX + 8, this.mouseY + 14);
            this.ctx.lineTo(this.mouseX + 12, this.mouseY + 12);
            this.ctx.lineTo(this.mouseX + 10, this.mouseY + 6);
            this.ctx.lineTo(this.mouseX + 16, this.mouseY + 4);
            this.ctx.lineTo(this.mouseX + 14, this.mouseY);
            this.ctx.closePath();
            this.ctx.fill();
        } else {
            // Cursor normal
            this.ctx.fillRect(this.mouseX, this.mouseY, 2, 16);
            this.ctx.fillRect(this.mouseX + 2, this.mouseY + 14, 10, 2);
            this.ctx.fillRect(this.mouseX + 4, this.mouseY + 16, 2, 4);
            this.ctx.fillRect(this.mouseX + 2, this.mouseY + 2, 8, 2);
        }
    }

    setupEvents() {
        this.canvas.addEventListener('mousemove', (e) => {
            const rect = this.canvas.getBoundingClientRect();
            const scaleX = this.canvas.width / rect.width;
            const scaleY = this.canvas.height / rect.height;
            
            this.mouseX = (e.clientX - rect.left) * scaleX;
            this.mouseY = (e.clientY - rect.top) * scaleY;
            
            // Enviar evento a la pantalla activa
            if (this.activeScreen && this.screens[this.activeScreen]) {
                this.screens[this.activeScreen].handleMouseMove(this.mouseX, this.mouseY);
            }
            
            // Enviar evento al HUD
            if (this.hudScreen && this.hudScreen.visible) {
                this.hudScreen.handleMouseMove(this.mouseX, this.mouseY);
            }
        });

        this.canvas.addEventListener('click', (e) => {
            const rect = this.canvas.getBoundingClientRect();
            const scaleX = this.canvas.width / rect.width;
            const scaleY = this.canvas.height / rect.height;
            
            const clickX = (e.clientX - rect.left) * scaleX;
            const clickY = (e.clientY - rect.top) * scaleY;
            
            // Enviar click a la pantalla activa
            if (this.activeScreen && this.screens[this.activeScreen]) {
                this.screens[this.activeScreen].handleClick(clickX, clickY);
            }
            
            // Enviar click al HUD
            if (this.hudScreen && this.hudScreen.visible) {
                this.hudScreen.handleClick(clickX, clickY);
            }
        });
    }

    // Métodos de utilidad para actualizar el HUD
    updateLives(lives) {
        if (this.hudScreen) {
            this.hudScreen.setLives(lives);
        }
    }

    updateGold(gold) {
        if (this.hudScreen) {
            this.hudScreen.setGold(gold);
        }
    }

    addGold(amount) {
        if (this.hudScreen) {
            this.hudScreen.addGold(amount);
        }
    }

    updateWave(wave) {
        if (this.hudScreen) {
            this.hudScreen.setWave(wave);
        }
    }

    updateScore(score) {
        if (this.hudScreen) {
            this.hudScreen.setScore(score);
        }
    }

    addScore(points) {
        if (this.hudScreen) {
            this.hudScreen.addScore(points);
        }
    }

    updateFPS(fps) {
        if (this.hudScreen) {
            this.hudScreen.setFPS(fps);
        }
    }

    showNotification(text, color, duration) {
        if (this.hudScreen) {
            this.hudScreen.addNotification(text, color, duration);
        }
    }

    toggleBuildPanel() {
        if (this.hudScreen) {
            this.hudScreen.toggleBuildPanel();
        }
    }

    setSelectedTower(tower) {
        if (this.hudScreen) {
            this.hudScreen.setSelectedTower(tower);
        }
    }

    setCursorType(type) {
        this.cursorType = type;
    }
}

// Exportar
if (typeof module !== 'undefined' && module.exports) {
    module.exports = UIManager;
}
