/**
 * ========================================
 * PauseScreen.js - Pantalla de Pausa
 * ========================================
 */

class PauseScreen extends UIScreen {
    constructor(canvasWidth, canvasHeight) {
        super('pause');
        
        this.canvasWidth = canvasWidth;
        this.canvasHeight = canvasHeight;
        
        const centerX = (canvasWidth - 200) / 2;
        
        // Título
        this.titleLabel = new UILabel(
            0, 150, 'PAUSA',
            {
                width: canvasWidth,
                fontSize: 48,
                align: 'center',
                color: '#d0d0d5',
                uppercase: true,
                letterSpacing: 8,
                bold: true
            }
        );
        
        // Botones
        this.buttons = {
            resume: new UIButton(centerX, 250, 200, 45, 'CONTINUAR', () => this.onResume()),
            options: new UIButton(centerX, 310, 200, 45, 'OPCIONES', () => this.onOptions()),
            quit: new UIButton(centerX, 370, 200, 45, 'SALIR AL MENÚ', () => this.onQuit())
        };
    }

    update(deltaTime) {
        super.update(deltaTime);
        Object.values(this.buttons).forEach(btn => btn.update(deltaTime));
        this.titleLabel.update(deltaTime);
    }

    render(ctx) {
        if (!this.visible) return;
        
        // Fondo semi-transparente oscuro
        ctx.fillStyle = 'rgba(10, 10, 12, 0.85)';
        ctx.fillRect(0, 0, this.canvasWidth, this.canvasHeight);
        
        // Renderizar elementos
        this.titleLabel.render(ctx);
        Object.values(this.buttons).forEach(btn => btn.render(ctx));
    }

    handleMouseMove(mx, my) {
        Object.values(this.buttons).forEach(btn => btn.handleHover(mx, my));
    }

    handleClick(mx, my) {
        Object.values(this.buttons).forEach(btn => btn.handleClick(mx, my));
    }

    onResume() {
        if (typeof Game !== 'undefined' && Game.togglePause) {
            Game.togglePause();
        }
    }

    onOptions() {
        // Abrir opciones en pausa
        console.log('Opciones desde pausa');
    }

    onQuit() {
        if (typeof Game !== 'undefined' && Game.quitToMenu) {
            Game.quitToMenu();
        }
    }
}

// Exportar
if (typeof module !== 'undefined' && module.exports) {
    module.exports = PauseScreen;
}
