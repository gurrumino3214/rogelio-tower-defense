/**
 * ========================================
 * TOWERS.JS - Sistema de Torres
 * ========================================
 * Maneja todos los tipos de torres:
 * - Torre básica
 * - Torre de hielo
 * - Torre de daño área
 * - Torre rápida
 */

const Towers = {
    // Tipos de torres
    types: {
        BASIC: 'basic',
        ICE: 'ice',
        SPLASH: 'splash',
        RAPID: 'rapid'
    },
    
    // Configuración por tipo
    configs: {
        basic: {
            damage: 20,
            range: 150,
            fireRate: 1, // disparos por segundo
            cost: 50,
            color: '#2e5a3a',
            width: 40,
            height: 40
        },
        ice: {
            damage: 10,
            range: 120,
            fireRate: 0.8,
            cost: 75,
            color: '#2e4a8b',
            width: 36,
            height: 36,
            slowEffect: true
        },
        splash: {
            damage: 30,
            range: 100,
            fireRate: 0.5,
            cost: 100,
            color: '#8b2e2e',
            width: 44,
            height: 44,
            splashRadius: 60
        },
        rapid: {
            damage: 8,
            range: 130,
            fireRate: 3,
            cost: 80,
            color: '#8b6b2e',
            width: 32,
            height: 32
        }
    },
    
    /**
     * Crea una nueva torre
     * @param {string} type - Tipo de torre
     * @param {number} x - Posición X
     * @param {number} y - Posición Y
     * @returns {TowerInstance}
     */
    create: function(type, x, y) {
        const config = this.configs[type] || this.configs.basic;
        return new TowerInstance(x, y, config, type);
    }
};

/**
 * Instancia de torre
 */
class TowerInstance extends Engine.Entity {
    constructor(x, y, config, type) {
        super(x, y, config.width, config.height, Engine.layers.ENTITIES);
        
        this.damage = config.damage;
        this.range = config.range;
        this.fireRate = config.fireRate;
        this.color = config.color;
        this.type = type;
        
        // Estado de disparo
        this.cooldown = 0;
        this.target = null;
        this.rotation = 0;
    }
    
    /**
     * Actualiza la torre
     * @param {number} deltaTime 
     */
    update(deltaTime) {
        // Reducir cooldown
        if (this.cooldown > 0) {
            this.cooldown -= deltaTime;
        }
        
        // Buscar objetivo
        this.target = this.findTarget();
        
        // Rotar hacia el objetivo
        if (this.target) {
            const dx = this.target.x - this.x;
            const dy = this.target.y - this.y;
            this.rotation = Math.atan2(dy, dx);
            
            // Disparar si está listo
            if (this.cooldown <= 0) {
                this.shoot();
                this.cooldown = 1 / this.fireRate;
            }
        }
    }
    
    /**
     * Renderiza la torre
     * @param {CanvasRenderingContext2D} ctx 
     */
    render(ctx) {
        ctx.save();
        ctx.translate(this.x, this.y);
        
        // Base de la torre
        ctx.fillStyle = '#1a1a20';
        ctx.fillRect(-this.width/2, -this.height/2, this.width, this.height);
        
        // Cuerpo rotatorio
        ctx.rotate(this.rotation);
        ctx.fillStyle = this.color;
        ctx.fillRect(-this.width/3, -this.height/3, this.width/1.5, this.height/1.5);
        
        // Cañón
        ctx.fillStyle = '#2a2a30';
        ctx.fillRect(0, -4, this.width/2, 8);
        
        ctx.restore();
        
        // Rango (solo cuando se selecciona)
        // this.renderRange(ctx);
    }
    
    /**
     * Busca un enemigo en rango
     * @returns {EnemyInstance|null}
     */
    findTarget() {
        const enemies = Engine.getEntitiesByType(EnemyInstance);
        
        for (const enemy of enemies) {
            if (!enemy.active) continue;
            
            const dx = enemy.x - this.x;
            const dy = enemy.y - this.y;
            const distance = Math.sqrt(dx * dx + dy * dy);
            
            if (distance <= this.range) {
                return enemy;
            }
        }
        
        return null;
    }
    
    /**
     * Dispara al objetivo
     */
    shoot() {
        if (!this.target) return;
        
        // Crear proyectil
        if (typeof Bullets !== 'undefined') {
            Bullets.createBullet(this.type, this.x, this.y, this.target, this.damage);
        }
    }
    
    /**
     * Renderiza el rango de la torre
     * @param {CanvasRenderingContext2D} ctx 
     */
    renderRange(ctx) {
        ctx.strokeStyle = 'rgba(255, 255, 255, 0.2)';
        ctx.lineWidth = 1;
        ctx.beginPath();
        ctx.arc(this.x, this.y, this.range, 0, Math.PI * 2);
        ctx.stroke();
    }
}
