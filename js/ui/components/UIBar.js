/**
 * ========================================
 * UIBar.js - Barra de Progreso/Vida
 * ========================================
 * Barra con estética pixel art para vida, oro, etc.
 */

class UIBar extends UIComponent {
    constructor(x, y, width, height, maxValue = 100, type = 'health') {
        super(x, y, width, height);
        this.maxValue = maxValue;
        this.currentValue = maxValue;
        this.type = type; // 'health', 'gold', 'experience', 'wave'
        
        this.colors = {
            health: {
                bg: '#0a0a0c',
                fill: '#8b2e2e',
                fillHigh: '#a83838',
                border: '#2a2a30'
            },
            gold: {
                bg: '#0a0a0c',
                fill: '#8b6b2e',
                fillHigh: '#a08b4e',
                border: '#2a2a30'
            },
            experience: {
                bg: '#0a0a0c',
                fill: '#4a2e6b',
                fillHigh: '#6b3e8b',
                border: '#2a2a30'
            },
            wave: {
                bg: '#0a0a0c',
                fill: '#2e4a8b',
                fillHigh: '#3e6bab',
                border: '#2a2a30'
            }
        };
        
        this.animationValue = maxValue;
        this.animateChange = false;
    }

    update(deltaTime) {
        super.update(deltaTime);
        
        // Animación suave del valor
        if (this.animateChange) {
            this.animationValue += (this.currentValue - this.animationValue) * 0.1;
            
            if (Math.abs(this.animationValue - this.currentValue) < 0.5) {
                this.animationValue = this.currentValue;
                this.animateChange = false;
            }
        } else {
            this.animationValue = this.currentValue;
        }
    }

    drawComponent(ctx) {
        const x = this.x;
        const y = this.y;
        const w = this.width;
        const h = this.height;
        
        const colorSet = this.colors[this.type] || this.colors.health;
        
        // Dibujar fondo
        ctx.fillStyle = colorSet.bg;
        ctx.fillRect(x, y, w, h);
        
        // Dibujar borde
        ctx.fillStyle = colorSet.border;
        ctx.fillRect(x, y, w, 2); // Superior
        ctx.fillRect(x, y + h - 2, w, 2); // Inferior
        ctx.fillRect(x, y, 2, h); // Izquierdo
        ctx.fillRect(x + w - 2, y, 2, h); // Derecho
        
        // Calcular ancho del fill
        const fillPercent = Math.max(0, Math.min(1, this.animationValue / this.maxValue));
        const fillWidth = Math.floor((w - 4) * fillPercent);
        
        // Dibujar fill con gradiente
        const gradient = ctx.createLinearGradient(x + 2, y, x + w - 2, y);
        gradient.addColorStop(0, colorSet.fill);
        gradient.addColorStop(0.5, colorSet.fillHigh);
        gradient.addColorStop(1, colorSet.fill);
        
        ctx.fillStyle = gradient;
        ctx.fillRect(x + 2, y + 2, fillWidth, h - 4);
        
        // Efecto de brillo en el fill
        ctx.fillStyle = 'rgba(255, 255, 255, 0.1)';
        ctx.fillRect(x + 2, y + 2, fillWidth, Math.floor(h / 3));
        
        // Patrón de segmentos para estilo pixel art
        ctx.fillStyle = 'rgba(0, 0, 0, 0.2)';
        const segmentWidth = 8;
        for (let i = 0; i < fillWidth; i += segmentWidth) {
            if (i + segmentWidth <= fillWidth) {
                ctx.fillRect(x + 2 + i, y + 2, 1, h - 4);
            }
        }
        
        // Mostrar valor numérico si es pequeño
        if (w < 100) {
            ctx.fillStyle = '#d0d0d5';
            ctx.font = '10px "Courier New", monospace';
            ctx.textAlign = 'center';
            ctx.textBaseline = 'middle';
            ctx.fillText(Math.floor(this.animationValue), x + w / 2, y + h / 2);
        }
    }

    setValue(value, animate = true) {
        this.currentValue = Math.max(0, Math.min(this.maxValue, value));
        this.animateChange = animate;
    }

    getValue() {
        return this.animationValue;
    }

    setMaxValue(max) {
        this.maxValue = max;
    }

    addValue(amount) {
        this.setValue(this.currentValue + amount);
    }

    removeValue(amount) {
        this.setValue(this.currentValue - amount);
    }

    setType(type) {
        this.type = type;
    }
}

// Exportar
if (typeof module !== 'undefined' && module.exports) {
    module.exports = UIBar;
}
