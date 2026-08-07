/**
 * UIScreen.js - Clase Base para Pantallas
 */
class UIScreen extends UIComponent {
    constructor(id) {
        super(0, 0, 800, 600);
        this.id = id;
        this.transitionAlpha = 0;
        this.isTransitioning = false;
    }

    show() {
        this.visible = true;
        this.isTransitioning = true;
        this.transitionAlpha = 0;
    }

    hide() {
        this.isTransitioning = true;
    }

    update(deltaTime) {
        if (this.isTransitioning) {
            this.transitionAlpha += deltaTime * 0.005;
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

    render(ctx) {}
    handleMouseMove(mx, my) {}
    handleClick(mx, my) { return false; }
}
