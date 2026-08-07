/**
 * MainMenuScreen.js - Pantalla de Menú Principal
 */
class MainMenuScreen extends UIScreen {
    constructor(canvasWidth, canvasHeight) {
        super('mainMenu');
        this.canvasWidth = canvasWidth;
        this.canvasHeight = canvasHeight;
        
        const centerX = (canvasWidth - 250) / 2;
        const menuY = 200;
        
        // Título
        this.titleLabel = new UILabel(0, 80, 'TOWER DEFENSE', {
            width: canvasWidth,
            fontSize: 48,
            align: 'center',
            color: '#d0d0d5',
            bold: true
        });
        
        this.subtitleLabel = new UILabel(0, 135, 'Dark Pixel Art Edition', {
            width: canvasWidth,
            fontSize: 16,
            align: 'center',
            color: '#808085'
        });
        
        // Botones
        this.buttons = {
            play: new UIButton(centerX, menuY, 250, 45, 'INICIAR JUEGO', () => this.onPlayClick()),
            credits: new UIButton(centerX, menuY + 60, 250, 45, 'CRÉDITOS', () => this.onCreditsClick())
        };
    }

    update(deltaTime) {
        super.update(deltaTime);
        Object.values(this.buttons).forEach(btn => btn.update(deltaTime));
        this.titleLabel.update(deltaTime);
        this.subtitleLabel.update(deltaTime);
    }

    render(ctx) {
        if (!this.visible) return;
        
        // Fondo
        ctx.fillStyle = 'rgba(10, 10, 12, 0.95)';
        ctx.fillRect(0, 0, this.canvasWidth, this.canvasHeight);
        
        // Renderizar elementos
        this.titleLabel.render(ctx);
        this.subtitleLabel.render(ctx);
        Object.values(this.buttons).forEach(btn => btn.render(ctx));
    }

    handleMouseMove(mx, my) {
        Object.values(this.buttons).forEach(btn => btn.handleHover(mx, my));
    }

    handleClick(mx, my) {
        Object.values(this.buttons).forEach(btn => btn.handleClick(mx, my));
    }

    onPlayClick() {
        if (typeof Game !== 'undefined' && Game.startGame) {
            Game.startGame();
        }
    }

    onCreditsClick() {
        console.log('Créditos - Tower Defense Game');
    }
}
