/**
 * ========================================
 * UIScreen.js - Clase Base para Pantallas
 * ========================================
 */

class UIScreen extends UIComponent {
    constructor(id) {
        super(0, 0, 800, 600);
        this.id = id;
        this.transitionAlpha = 0;
        this.isTransitioning = false;
        this.transitionDirection = 1; // 1 = in, -1 = out
    }

    /**
     * Muestra la pantalla con transición
     */
    show() {
        this.visible = true;
        this.isTransitioning = true;
        this.transitionDirection = 1;
        this.transitionAlpha = 0;
    }

    /**
     * Oculta la pantalla con transición
     */
    hide() {
        this.isTransitioning = true;
        this.transitionDirection = -1;
    }

    update(deltaTime) {
        if (this.isTransitioning) {
            this.transitionAlpha += this.transitionDirection * deltaTime * 0.005;
            
            if (this.transitionAlpha >= 1) {
                this.transitionAlpha = 1;
                this.isTransitioning = false;
            } else if (this.transitionAlpha <= 0) {
                this.transitionAlpha = 0;
                this.isTransitioning = false;
                this.visible = false;
            }
        }
    }

    render(ctx) {
        // Implementar en subclases
    }

    handleMouseMove(mx, my) {
        // Implementar en subclases
    }

    handleClick(mx, my) {
        return false;
    }
}

// Exportar
if (typeof module !== 'undefined' && module.exports) {
    module.exports = UIScreen;
}
