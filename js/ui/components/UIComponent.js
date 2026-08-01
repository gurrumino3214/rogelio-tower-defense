/**
 * ========================================
 * UIComponent.js - Componente Base de UI
 * ========================================
 * Clase base para todos los componentes de interfaz
 * con renderizado en Canvas 2D y estética pixel art
 */

class UIComponent {
    constructor(x, y, width, height) {
        this.x = x;
        this.y = y;
        this.width = width;
        this.height = height;
        this.visible = true;
        this.enabled = true;
        this.hovered = false;
        this.pressed = false;
        this.animationTime = 0;
        this.targetScale = 1;
        this.currentScale = 1;
    }

    /**
     * Actualiza el componente
     * @param {number} deltaTime - Tiempo desde el último frame
     */
    update(deltaTime) {
        if (!this.visible) return;
        
        this.animationTime += deltaTime;
        
        // Animación suave de escala
        this.currentScale += (this.targetScale - this.currentScale) * 0.2;
    }

    /**
     * Renderiza el componente
     * @param {CanvasRenderingContext2D} ctx - Contexto del canvas
     */
    render(ctx) {
        if (!this.visible) return;
        
        ctx.save();
        ctx.translate(this.x + this.width / 2, this.y + this.height / 2);
        ctx.scale(this.currentScale, this.currentScale);
        ctx.translate(-(this.x + this.width / 2), -(this.y + this.height / 2));
        
        this.drawComponent(ctx);
        
        ctx.restore();
    }

    /**
     * Método abstracto para dibujar el componente
     * @param {CanvasRenderingContext2D} ctx
     */
    drawComponent(ctx) {
        // Implementar en subclases
    }

    /**
     * Verifica si el punto está dentro del componente
     * @param {number} mx - Posición X del mouse
     * @param {number} my - Posición Y del mouse
     * @returns {boolean}
     */
    isPointInside(mx, my) {
        return mx >= this.x && mx <= this.x + this.width &&
               my >= this.y && my <= this.y + this.height;
    }

    /**
     * Maneja evento de click
     * @param {number} mx - Posición X del mouse
     * @param {number} my - Posición Y del mouse
     * @returns {boolean} - Si el click fue manejado
     */
    handleClick(mx, my) {
        if (!this.visible || !this.enabled) return false;
        
        if (this.isPointInside(mx, my)) {
            this.onPress();
            return true;
        }
        return false;
    }

    /**
     * Maneja evento de hover
     * @param {number} mx - Posición X del mouse
     * @param {number} my - Posición Y del mouse
     */
    handleHover(mx, my) {
        if (!this.visible || !this.enabled) {
            this.hovered = false;
            this.targetScale = 1;
            return;
        }
        
        const wasHovered = this.hovered;
        this.hovered = this.isPointInside(mx, my);
        
        if (this.hovered && !wasHovered) {
            this.targetScale = 1.05;
            this.onHoverEnter();
        } else if (!this.hovered && wasHovered) {
            this.targetScale = 1;
            this.onHoverExit();
        }
    }

    /**
     * Evento cuando se presiona el componente
     */
    onPress() {
        // Implementar en subclases
    }

    /**
     * Evento cuando entra el hover
     */
    onHoverEnter() {
        // Implementar en subclases
    }

    /**
     * Evento cuando sale el hover
     */
    onHoverExit() {
        // Implementar en subclases
    }

    /**
     * Muestra el componente
     */
    show() {
        this.visible = true;
    }

    /**
     * Oculta el componente
     */
    hide() {
        this.visible = false;
    }

    /**
     * Habilita el componente
     */
    enable() {
        this.enabled = true;
    }

    /**
     * Deshabilita el componente
     */
    disable() {
        this.enabled = false;
    }
}

// Exportar para uso modular
if (typeof module !== 'undefined' && module.exports) {
    module.exports = UIComponent;
}
