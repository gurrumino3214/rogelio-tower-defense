/**
 * ========================================
 * UIPanel.js - Panel de UI
 * ========================================
 * Panel decorativo con estética pixel art
 * para contener otros elementos de UI
 */

class UIPanel extends UIComponent {
    constructor(x, y, width, height, title = '') {
        super(x, y, width, height);
        this.title = title;
        this.colors = {
            bg: '#1a1a20',
            border: '#2a2a30',
            borderAccent: '#8b6b2e',
            text: '#d0d0d5',
            shadow: '#0a0a0c'
        };
        this.padding = 10;
        this.contentOffset = 30; // Espacio para el título
    }

    drawComponent(ctx) {
        const x = this.x;
        const y = this.y;
        const w = this.width;
        const h = this.height;
        
        // Dibujar sombra
        ctx.fillStyle = this.colors.shadow;
        ctx.fillRect(x + 4, y + 4, w, h);
        
        // Dibujar borde exterior
        ctx.fillStyle = this.colors.borderAccent;
        ctx.fillRect(x, y, w, 4); // Borde superior
        ctx.fillRect(x, y + h - 4, w, 4); // Borde inferior
        ctx.fillRect(x, y, 4, h); // Borde izquierdo
        ctx.fillRect(x + w - 4, y, 4, h); // Borde derecho
        
        // Dibujar esquinas decorativas
        ctx.fillStyle = '#a08b4e';
        ctx.fillRect(x, y, 4, 4);
        ctx.fillRect(x + w - 4, y, 4, 4);
        ctx.fillRect(x, y + h - 4, 4, 4);
        ctx.fillRect(x + w - 4, y + h - 4, 4, 4);
        
        // Dibujar fondo
        ctx.fillStyle = this.colors.bg;
        ctx.fillRect(x + 4, y + 4, w - 8, h - 8);
        
        // Dibujar línea decorativa interior
        ctx.strokeStyle = '#252530';
        ctx.lineWidth = 1;
        ctx.strokeRect(x + 6, y + 6, w - 12, h - 12);
        
        // Dibujar título si existe
        if (this.title) {
            ctx.fillStyle = this.colors.text;
            ctx.font = 'bold 12px "Courier New", monospace';
            ctx.textAlign = 'left';
            ctx.textBaseline = 'top';
            
            // Sombra del título
            ctx.fillStyle = 'rgba(0, 0, 0, 0.5)';
            ctx.fillText(this.title, x + 12 + 1, y + 8 + 1);
            
            // Título principal
            ctx.fillStyle = this.colors.borderAccent;
            ctx.fillText(this.title, x + 12, y + 8);
            
            // Línea separadora
            ctx.fillStyle = this.colors.borderAccent;
            ctx.fillRect(x + 10, y + 22, w - 20, 1);
        }
    }

    /**
     * Obtiene el área de contenido (dentro del padding)
     * @returns {Object} - Rectángulo del área de contenido
     */
    getContentArea() {
        return {
            x: this.x + this.padding,
            y: this.y + this.contentOffset,
            width: this.width - this.padding * 2,
            height: this.height - this.contentOffset - this.padding
        };
    }

    setTitle(title) {
        this.title = title;
    }
}

// Exportar
if (typeof module !== 'undefined' && module.exports) {
    module.exports = UIPanel;
}
