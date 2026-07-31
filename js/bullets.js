/**
 * ========================================
 * BULLETS.JS - Sistema de Proyectiles
 * ========================================
 * Maneja todos los tipos de proyectiles:
 * - Proyectil básico
 * - Proyectil de hielo
 * - Proyectil explosivo
 */

const Bullets = {
    /**
     * Crea un nuevo proyectil
     * @param {string} type - Tipo de proyectil
     * @param {number} x - Posición X inicial
     * @param {number} y - Posición Y inicial
     * @param {EnemyInstance} target - Enemigo objetivo
     * @param {number} damage - Daño del proyectil
     */
    createBullet: function(type, x, y, target, damage) {
        const bullet = new BulletInstance(x, y, type, target, damage);
        Engine.addEntity(bullet);
    }
};

/**
 * Instancia de proyectil
 */
class BulletInstance extends Engine.Entity {
    constructor(x, y, type, target, damage) {
        super(x, y, 8, 8, Engine.layers.EFFECTS);
        
        this.type = type;
        this.target = target;
        this.damage = damage;
        this.speed = 300; // píxeles por segundo
        
        // Calcular dirección inicial
        if (target && target.active) {
            const dx = target.x - x;
            const dy = target.y - y;
            const distance = Math.sqrt(dx * dx + dy * dy);
            this.vx = (dx / distance) * this.speed;
            this.vy = (dy / distance) * this.speed;
        } else {
            this.vx = 0;
            this.vy = 0;
        }
        
        // Propiedades por tipo
        this.color = this.getColorByType();
        this.slowEffect = (type === 'ice');
        this.splashDamage = (type === 'splash');
    }
    
    /**
     * Obtiene el color según el tipo
     * @returns {string}
     */
    getColorByType() {
        switch(this.type) {
            case 'ice': return '#2e4a8b';
            case 'splash': return '#8b2e2e';
            case 'rapid': return '#8b6b2e';
            default: return '#2e5a3a';
        }
    }
    
    /**
     * Actualiza el proyectil
     * @param {number} deltaTime 
     */
    update(deltaTime) {
        // Mover proyectil
        this.x += this.vx * deltaTime;
        this.y += this.vy * deltaTime;
        
        // Verificar si llegó al objetivo o salió de pantalla
        if (this.isOutOfBounds() || this.hitTarget()) {
            this.active = false;
        }
    }
    
    /**
     * Verifica si el proyectil está fuera de la pantalla
     * @returns {boolean}
     */
    isOutOfBounds() {
        return this.x < -50 || this.x > 850 || this.y < -50 || this.y > 650;
    }
    
    /**
     * Verifica si impactó al objetivo
     * @returns {boolean}
     */
    hitTarget() {
        if (!this.target || !this.target.active) return false;
        
        const dx = this.x - this.target.x;
        const dy = this.y - this.target.y;
        const distance = Math.sqrt(dx * dx + dy * dy);
        
        if (distance < this.target.width/2 + this.width/2) {
            this.onHit();
            return true;
        }
        
        return false;
    }
    
    /**
     * Called when bullet hits target
     */
    onHit() {
        if (this.target && this.target.active) {
            this.target.takeDamage(this.damage);
            
            // Aplicar efectos especiales
            if (this.slowEffect) {
                this.target.slow();
            }
            
            // Daño en área
            if (this.splashDamage) {
                this.applySplashDamage();
            }
        }
    }
    
    /**
     * Aplica daño en área
     */
    applySplashDamage() {
        const enemies = Engine.getEntitiesByType(EnemyInstance);
        const splashRadius = 60;
        
        for (const enemy of enemies) {
            if (!enemy.active) continue;
            
            const dx = this.x - enemy.x;
            const dy = this.y - enemy.y;
            const distance = Math.sqrt(dx * dx + dy * dy);
            
            if (distance < splashRadius) {
                enemy.takeDamage(this.damage * 0.5); // 50% daño en área
            }
        }
    }
    
    /**
     * Renderiza el proyectil
     * @param {CanvasRenderingContext2D} ctx 
     */
    render(ctx) {
        ctx.save();
        ctx.translate(this.x, this.y);
        
        // Dibujar proyectil
        ctx.fillStyle = this.color;
        ctx.fillRect(-this.width/2, -this.height/2, this.width, this.height);
        
        // Brillo exterior
        ctx.strokeStyle = '#d0d0d5';
        ctx.lineWidth = 1;
        ctx.strokeRect(-this.width/2, -this.height/2, this.width, this.height);
        
        ctx.restore();
    }
}
