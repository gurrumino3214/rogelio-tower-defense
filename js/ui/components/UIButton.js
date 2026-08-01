/**
 * ========================================
 * UIButton.js - Botón de UI
 * ========================================
 * Botón con estética pixel art oscura
 * y animaciones suaves
 */

class UIButton extends UIComponent {
    constructor(x, y, width, height, text, onClick) {
        super(x, y, width, height);
        this.text = text;
        this.onClick = onClick;
        this.colors = {
            bg: '#1a1a20',
            bgHover: '#2a2a30',
            border: '#8b6b2e',
            text: '#d0d0d5',
            shadow: '#0a0a0c'
        };
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
        const x = this.x;
        const y = this.y;
        const w = this.width;
        const h = this.height;
        
        // Determinar color de fondo
        let bgColor = this.colors.bg;
        let offsetX = 0;
        let offsetY = 0;
        
        if (this.pressed) {
            bgColor = '#15151a';
            offsetX = 2;
            offsetY = 2;
        } else if (this.hovered) {
            bgColor = this.colors.bgHover;
        }
        
        // Dibujar sombra
        ctx.fillStyle = this.colors.shadow;
        ctx.fillRect(x + 4 + offsetX, y + 4 + offsetY, w, h);
        
        // Dibujar borde
        ctx.fillStyle = this.colors.border;
        ctx.fillRect(x + offsetX, y + offsetY, w, h);
        
        // Dibujar fondo
        ctx.fillStyle = bgColor;
        ctx.fillRect(x + 2 + offsetX, y + 2 + offsetY, w - 4, h - 4);
        
        // Dibujar texto centrado
        ctx.fillStyle = this.colors.text;
        ctx.font = '14px "Courier New", monospace';
        ctx.textAlign = 'center';
        ctx.textBaseline = 'middle';
        
        const textX = x + w / 2 + offsetX;
        const textY = y + h / 2 + offsetY;
        
        // Efecto de sombra en el texto
        ctx.fillStyle = 'rgba(0, 0, 0, 0.5)';
        ctx.fillText(this.text, textX + 1, textY + 1);
        
        // Texto principal
        ctx.fillStyle = this.colors.text;
        ctx.fillText(this.text, textX, textY);
        
        // Borde interior decorativo
        if (this.hovered && !this.pressed) {
            ctx.strokeStyle = '#a08b4e';
            ctx.lineWidth = 1;
            ctx.strokeRect(x + 4 + offsetX, y + 4 + offsetY, w - 8, h - 8);
        }
    }

    onPress() {
        this.pressed = true;
        if (this.onClick) {
            this.onClick();
        }
    }

    onHoverEnter() {
        // Sonido opcional de hover
    }

    onHoverExit() {
        // Limpiar estado
    }

    setText(text) {
        this.text = text;
    }

    setEnabled(enabled) {
        this.enabled = enabled;
        if (!enabled) {
            this.colors.text = '#505055';
            this.colors.border = '#404045';
        } else {
            this.colors.text = '#d0d0d5';
            this.colors.border = '#8b6b2e';
        }
    }
}

// Exportar
if (typeof module !== 'undefined' && module.exports) {
    module.exports = UIButton;
}
