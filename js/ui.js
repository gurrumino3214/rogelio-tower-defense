/**
 * UI.js - Sistema de Interfaz de Usuario
 */
const UI = {
    manager: null,
    initialized: false,

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

    showMenu() {
        if (!this.initialized) this.init();
        if (this.manager) {
            this.manager.setActiveScreen('mainMenu');
            this.manager.hideHUD();
        }
    },

    hideMenu() {
        if (this.manager) this.manager.hideHUD();
    },

    showHUD() {
        if (this.manager) this.manager.showHUD();
    },

    hideHUD() {
        if (this.manager) this.manager.hideHUD();
    },

    updateStats(lives, gold, wave, score) {
        if (!this.manager) return;
        this.manager.updateLives(lives);
        this.manager.updateGold(gold);
        this.manager.updateWave(wave);
        this.manager.updateScore(score);
    },

    render(deltaTime) {
        if (this.manager) {
            this.manager.update(deltaTime);
            this.manager.render();
        }
    }
};
