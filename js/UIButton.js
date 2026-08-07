/**
 * UIButton.js - Botón de UI
 */
class UIButton extends UIComponent {
    constructor(x, y, width, height, text, onClick) {
        super(x, y, width, height);
        this.text = text;
        this.onClick = onClick;
        this.pressedTime = 0;
    }

    update(deltaTime) {
        super.update(deltaTime);
        if (this.pressed) {
            this.pressedTime += deltaTime;
            if (this.pressedTime > 150) {
                this.pressed = false;
                this.pressedTime = 0;
            }
        }
    }

    drawComponent(ctx) {
        const x = this.x, y = this.y, w = this.width, h = this.height;
        let bgColor = '#1a1a20';
        let offsetX = 0, offsetY = 0;

        if (this.pressed) {
            bgColor = '#15151a';
            offsetX = 2;
            offsetY = 2;
        } else if (this.hovered) {
            bgColor = '#2a2a30';
        }

        // Sombra
        ctx.fillStyle = '#0a0a0c';
        ctx.fillRect(x + 4 + offsetX, y + 4 + offsetY, w, h);
        // Borde
        ctx.fillStyle = '#8b6b2e';
        ctx.fillRect(x + offsetX, y + offsetY, w, h);
        // Fondo
        ctx.fillStyle = bgColor;
        ctx.fillRect(x + 2 + offsetX, y + 2 + offsetY, w - 4, h - 4);
        // Texto
        ctx.fillStyle = '#d0d0d5';
        ctx.font = '14px "Courier New", monospace';
        ctx.textAlign = 'center';
        ctx.textBaseline = 'middle';
        ctx.fillText(this.text, x + w / 2 + offsetX, y + h / 2 + offsetY);
    }

    onPress() {
        this.pressed = true;
        if (this.onClick) this.onClick();
    }

    setText(text) { this.text = text; }
}
