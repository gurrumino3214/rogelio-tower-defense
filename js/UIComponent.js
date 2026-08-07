/**
 * UIComponent.js - Componente Base de UI
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
        this.targetScale = 1;
        this.currentScale = 1;
    }

    update(deltaTime) {
        if (!this.visible) return;
        this.currentScale += (this.targetScale - this.currentScale) * 0.2;
    }

    render(ctx) {
        if (!this.visible) return;
        ctx.save();
        ctx.translate(this.x + this.width / 2, this.y + this.height / 2);
        ctx.scale(this.currentScale, this.currentScale);
        ctx.translate(-(this.x + this.width / 2), -(this.y + this.height / 2));
        this.drawComponent(ctx);
        ctx.restore();
    }

    drawComponent(ctx) {}

    isPointInside(mx, my) {
        return mx >= this.x && mx <= this.x + this.width &&
               my >= this.y && my <= this.y + this.height;
    }

    handleClick(mx, my) {
        if (!this.visible || !this.enabled) return false;
        if (this.isPointInside(mx, my)) {
            this.onPress();
            return true;
        }
        return false;
    }

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
        } else if (!this.hovered && wasHovered) {
            this.targetScale = 1;
        }
    }

    onPress() {}
    show() { this.visible = true; }
    hide() { this.visible = false; }
}
