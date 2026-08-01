/**
 * ========================================
 * UILabel.js - Etiqueta de Texto
 * ========================================
 * Texto con estética pixel art para mostrar
 * valores, títulos y descripciones
 */

class UILabel extends UIComponent {
    constructor(x, y, text = '', options = {}) {
        super(x, y, options.width || 200, options.height || 20);
        this.text = text;
        this.options = {
            fontSize: options.fontSize || 14,
            fontFamily: options.fontFamily || '"Courier New", monospace',
            color: options.color || '#d0d0d5',
            align: options.align || 'left',
            baseline: options.baseline || 'top',
            shadow: options.shadow !== false,
            shadowColor: options.shadowColor || 'rgba(0, 0, 0, 0.5)',
            shadowOffset: options.shadowOffset || 1,
            uppercase: options.uppercase || false,
            letterSpacing: options.letterSpacing || 0,
            bold: options.bold || false
        };
        this.animationTime = 0;
        this.pulseSpeed = options.pulseSpeed || 0;
    }

    update(deltaTime) {
        super.update(deltaTime);
        this.animationTime += deltaTime;
    }

    drawComponent(ctx) {
        let displayText = this.text;
        
        if (this.options.uppercase) {
            displayText = displayText.toUpperCase();
        }
        
        ctx.save();
        
        // Configurar fuente
        const fontWeight = this.options.bold ? 'bold ' : '';
        ctx.font = `${fontWeight}${this.options.fontSize}px ${this.options.fontFamily}`;
        ctx.textAlign = this.options.align;
        ctx.textBaseline = this.options.baseline;
        
        // Calcular posición según alineación
        let textX = this.x;
        let textY = this.y;
        
        if (this.options.align === 'center') {
            textX = this.x + this.width / 2;
        } else if (this.options.align === 'right') {
            textX = this.x + this.width;
        }
        
        if (this.options.baseline === 'middle') {
            textY = this.y + this.height / 2;
        } else if (this.options.baseline === 'bottom') {
            textY = this.y + this.height;
        }
        
        // Efecto de pulso opcional
        let alpha = 1;
        if (this.pulseSpeed > 0) {
            alpha = 0.7 + Math.sin(this.animationTime * this.pulseSpeed) * 0.3;
        }
        
        // Dibujar sombra
        if (this.options.shadow) {
            ctx.fillStyle = this.options.shadowColor;
            ctx.globalAlpha = alpha;
            
            if (this.options.letterSpacing > 0) {
                this.drawSpacedText(ctx, displayText, textX + this.options.shadowOffset, textY + this.options.shadowOffset);
            } else {
                ctx.fillText(displayText, textX + this.options.shadowOffset, textY + this.options.shadowOffset);
            }
        }
        
        // Dibujar texto principal
        ctx.fillStyle = this.options.color;
        ctx.globalAlpha = alpha;
        
        if (this.options.letterSpacing > 0) {
            this.drawSpacedText(ctx, displayText, textX, textY);
        } else {
            ctx.fillText(displayText, textX, textY);
        }
        
        ctx.restore();
    }

    /**
     * Dibuja texto con espaciado entre letras
     */
    drawSpacedText(ctx, text, x, y) {
        const letters = text.split('');
        let currentX = x;
        
        if (this.options.align === 'center') {
            const totalWidth = letters.reduce((sum, char) => {
                return sum + ctx.measureText(char).width + this.options.letterSpacing;
            }, 0) - this.options.letterSpacing;
            currentX = x - totalWidth / 2;
        } else if (this.options.align === 'right') {
            const totalWidth = letters.reduce((sum, char) => {
                return sum + ctx.measureText(char).width + this.options.letterSpacing;
            }, 0) - this.options.letterSpacing;
            currentX = x - totalWidth;
        }
        
        for (let i = 0; i < letters.length; i++) {
            ctx.fillText(letters[i], currentX, y);
            currentX += ctx.measureText(letters[i]).width + this.options.letterSpacing;
        }
    }

    setText(text) {
        this.text = text;
    }

    setColor(color) {
        this.options.color = color;
    }

    setFontSize(size) {
        this.options.fontSize = size;
    }

    pulse() {
        this.pulseSpeed = 0.005;
    }

    stopPulse() {
        this.pulseSpeed = 0;
    }
}

// Exportar
if (typeof module !== 'undefined' && module.exports) {
    module.exports = UILabel;
}
