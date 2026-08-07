/**
 * UILabel.js - Etiqueta de Texto
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
            bold: options.bold || false
        };
    }

    drawComponent(ctx) {
        ctx.save();
        const fontWeight = this.options.bold ? 'bold ' : '';
        ctx.font = `${fontWeight}${this.options.fontSize}px ${this.options.fontFamily}`;
        ctx.textAlign = this.options.align;
        ctx.textBaseline = 'top';

        let textX = this.x;
        let textY = this.y;
        if (this.options.align === 'center') textX = this.x + this.width / 2;
        if (this.options.align === 'right') textX = this.x + this.width;

        // Sombra
        ctx.fillStyle = 'rgba(0, 0, 0, 0.5)';
        ctx.fillText(this.text, textX + 1, textY + 1);
        // Texto
        ctx.fillStyle = this.options.color;
        ctx.fillText(this.text, textX, textY);
        ctx.restore();
    }

    setText(text) { this.text = text; }
}
