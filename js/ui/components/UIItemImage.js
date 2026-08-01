/**
 * ========================================
 * UIItemImage.js - Item con Imagen/Icono
 * ========================================
 * Componente para mostrar items con icono,
 * nombre, descripción y precio (para tiendas)
 */

class UIItemImage extends UIComponent {
    constructor(x, y, width, height, itemData, onClick) {
        super(x, y, width, height);
        this.itemData = itemData || {
            id: '',
            name: 'Item',
            description: '',
            price: 0,
            icon: null,
            color: '#8b6b2e'
        };
        this.onClick = onClick;
        this.showPrice = true;
        this.showDescription = false;
        this.locked = false;
    }

    drawComponent(ctx) {
        const x = this.x;
        const y = this.y;
        const w = this.width;
        const h = this.height;
        
        // Color de fondo según estado
        let bgColor = '#1a1a20';
        if (this.hovered && !this.locked) {
            bgColor = '#252530';
        }
        if (this.locked) {
            bgColor = '#121216';
        }
        
        // Dibujar fondo
        ctx.fillStyle = bgColor;
        ctx.fillRect(x, y, w, h);
        
        // Borde
        ctx.fillStyle = this.locked ? '#404045' : '#8b6b2e';
        ctx.fillRect(x, y, w, 2); // Superior
        ctx.fillRect(x, y + h - 2, w, 2); // Inferior
        ctx.fillRect(x, y, 2, h); // Izquierdo
        ctx.fillRect(x + w - 2, y, 2, h); // Derecho
        
        // Área del icono (cuadrado en la parte superior)
        const iconSize = Math.min(w, h) - 40;
        const iconX = x + (w - iconSize) / 2;
        const iconY = y + 8;
        
        // Fondo del icono
        ctx.fillStyle = '#0a0a0c';
        ctx.fillRect(iconX, iconY, iconSize, iconSize);
        
        // Dibujar icono (placeholder o imagen)
        if (this.itemData.icon) {
            ctx.drawImage(this.itemData.icon, iconX, iconY, iconSize, iconSize);
        } else {
            // Icono placeholder
            ctx.fillStyle = this.itemData.color || '#8b6b2e';
            const padding = iconSize * 0.2;
            ctx.fillRect(iconX + padding, iconY + padding, iconSize - padding * 2, iconSize - padding * 2);
            
            // Brillo
            ctx.fillStyle = 'rgba(255, 255, 255, 0.2)';
            ctx.fillRect(iconX + padding, iconY + padding, iconSize - padding * 2, padding);
        }
        
        // Nombre del item
        ctx.fillStyle = this.locked ? '#505055' : '#d0d0d5';
        ctx.font = 'bold 11px "Courier New", monospace';
        ctx.textAlign = 'center';
        ctx.textBaseline = 'top';
        ctx.fillText(this.itemData.name, x + w / 2, y + iconY + iconSize + 4);
        
        // Precio
        if (this.showPrice && this.itemData.price > 0) {
            ctx.fillStyle = '#8b6b2e';
            ctx.font = '10px "Courier New", monospace';
            ctx.fillText(`${this.itemData.price} ORO`, x + w / 2, y + iconY + iconSize + 17);
        }
        
        // Indicador de bloqueado
        if (this.locked) {
            ctx.fillStyle = 'rgba(0, 0, 0, 0.7)';
            ctx.fillRect(x, y, w, h);
            
            ctx.fillStyle = '#8b2e2e';
            ctx.font = 'bold 16px "Courier New", monospace';
            ctx.fillText('🔒', x + w / 2, y + h / 2 - 8);
        }
        
        // Borde hover
        if (this.hovered && !this.locked) {
            ctx.strokeStyle = '#a08b4e';
            ctx.lineWidth = 1;
            ctx.strokeRect(x + 2, y + 2, w - 4, h - 4);
        }
    }

    onPress() {
        if (!this.locked && this.onClick) {
            this.onClick(this.itemData);
        }
    }

    setItemData(itemData) {
        this.itemData = itemData;
    }

    setLocked(locked) {
        this.locked = locked;
    }

    setShowPrice(show) {
        this.showPrice = show;
    }
}

// Exportar
if (typeof module !== 'undefined' && module.exports) {
    module.exports = UIItemImage;
}
