/**
 * UIManager.js - Gestor Principal de UI
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
        
        // Mouse
        this.mouseX = 0;
        this.mouseY = 0;
        
        this.initializeScreens();
        this.setupEvents();
    }

    initializeScreens() {
        this.screens.mainMenu = new MainMenuScreen(this.canvasWidth, this.canvasHeight);
        this.hudScreen = new HUDScreen(this.canvasWidth, this.canvasHeight);
        this.hudScreen.hide();
        this.setActiveScreen('mainMenu');
    }

    setActiveScreen(screenName) {
        Object.values(this.screens).forEach(screen => {
            if (screen && screen !== this.hudScreen) screen.hide();
        });
        if (this.hudScreen) this.hudScreen.hide();
        
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
        if (this.hudScreen) this.hudScreen.hide();
    }

    update(deltaTime) {
        if (this.activeScreen && this.screens[this.activeScreen]) {
            this.screens[this.activeScreen].update(deltaTime);
        }
        if (this.hudScreen && this.hudScreen.visible) {
            this.hudScreen.update(deltaTime);
        }
    }

    render() {
        if (this.activeScreen && this.screens[this.activeScreen]) {
            this.screens[this.activeScreen].render(this.ctx);
        }
        if (this.hudScreen && this.hudScreen.visible) {
            this.hudScreen.render(this.ctx);
        }
    }

    setupEvents() {
        this.canvas.addEventListener('mousemove', (e) => {
            const rect = this.canvas.getBoundingClientRect();
            const scaleX = this.canvas.width / rect.width;
            const scaleY = this.canvas.height / rect.height;
            this.mouseX = (e.clientX - rect.left) * scaleX;
            this.mouseY = (e.clientY - rect.top) * scaleY;
            
            if (this.activeScreen && this.screens[this.activeScreen]) {
                this.screens[this.activeScreen].handleMouseMove(this.mouseX, this.mouseY);
            }
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
            
            if (this.activeScreen && this.screens[this.activeScreen]) {
                this.screens[this.activeScreen].handleClick(clickX, clickY);
            }
            if (this.hudScreen && this.hudScreen.visible) {
                this.hudScreen.handleClick(clickX, clickY);
            }
        });
    }

    // Métodos de utilidad
    updateLives(lives) { if (this.hudScreen) this.hudScreen.setLives(lives); }
    updateGold(gold) { if (this.hudScreen) this.hudScreen.setGold(gold); }
    updateWave(wave) { if (this.hudScreen) this.hudScreen.setWave(wave); }
    updateScore(score) { if (this.hudScreen) this.hudScreen.setScore(score); }
    updateFPS(fps) { if (this.hudScreen) this.hudScreen.setFPS(fps); }
}
