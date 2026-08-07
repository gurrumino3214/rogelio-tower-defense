/**
 * HUDScreen.js - Pantalla HUD en Juego
 */
class HUDScreen extends UIScreen {
    constructor(canvasWidth, canvasHeight) {
        super('hud');
        this.canvasWidth = canvasWidth;
        this.canvasHeight = canvasHeight;
        this.lives = 20;
        this.gold = 100;
        this.wave = 1;
        this.score = 0;
        this.fps = 60;

        // Etiquetas de estadísticas
        this.labels = {
            lives: new UILabel(20, 20, 'VIDAS: 20', { fontSize: 14, color: '#d0d0d5' }),
            gold: new UILabel(20, 45, 'ORO: 100', { fontSize: 14, color: '#8b6b2e' }),
            wave: new UILabel(20, 70, 'OLEADA: 1', { fontSize: 14, color: '#2e4a8b' }),
            score: new UILabel(20, 95, 'PUNTOS: 0', { fontSize: 14, color: '#d0d0d5' }),
            fps: new UILabel(720, 20, 'FPS: 60', { fontSize: 12, color: '#2e8b2e' })
        };

        // Botón de pausa
        this.pauseButton = new UIButton(700, 50, 80, 30, 'PAUSA', () => this.onPauseClick());
    }

    update(deltaTime) {
        super.update(deltaTime);
        Object.values(this.labels).forEach(label => label.update(deltaTime));
        this.pauseButton.update(deltaTime);
    }

    render(ctx) {
        if (!this.visible) return;
        
        // Renderizar etiquetas
        Object.values(this.labels).forEach(label => label.render(ctx));
        this.pauseButton.render(ctx);
    }

    handleMouseMove(mx, my) {
        this.pauseButton.handleHover(mx, my);
    }

    handleClick(mx, my) {
        this.pauseButton.handleClick(mx, my);
    }

    setLives(lives) {
        this.lives = lives;
        this.labels.lives.setText('VIDAS: ' + lives);
    }

    setGold(gold) {
        this.gold = gold;
        this.labels.gold.setText('ORO: ' + gold);
    }

    setWave(wave) {
        this.wave = wave;
        this.labels.wave.setText('OLEADA: ' + wave);
    }

    setScore(score) {
        this.score = score;
        this.labels.score.setText('PUNTOS: ' + score);
    }

    setFPS(fps) {
        this.fps = fps;
        this.labels.fps.setText('FPS: ' + fps);
    }

    onPauseClick() {
        if (typeof Game !== 'undefined' && Game.togglePause) {
            Game.togglePause();
        }
    }
}
