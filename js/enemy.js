/**
 * ========================================
 * ENEMY.JS - Sistema de Enemigos
 * ========================================
 * Maneja todos los tipos de enemigos:
 * - Enemigos básicos
 * - Enemigos rápidos
 * - Enemigos tanque
 * - Bosses
 */

const Enemy = {
    // Tipos de enemigos
    types: {
        BASIC: 'basic',
        FAST: 'fast',
        TANK: 'tank',
        BOSS: 'boss'
    },
    
    // Configuración por tipo
    configs: {
        basic: {
            speed: 60,
            health: 100,
            damage: 1,
            reward: 10,
            width: 32,
            height: 32,
            color: '#8b2e2e'
        },
        fast: {
            speed: 100,
            health: 60,
            damage: 1,
            reward: 15,
            width: 28,
            height: 28,
            color: '#8b6b2e'
        },
        tank: {
            speed: 40,
            health: 200,
            damage: 2,
            reward: 25,
            width: 40,
            height: 40,
            color: '#4a2e6b'
        }
    },
    
    /**
     * Crea un nuevo enemigo
     * @param {string} type - Tipo de enemigo
     * @param {Array} path - Camino a seguir
     * @returns {EnemyInstance}
     */
    create: function(type, path) {
        const config = this.configs[type] || this.configs.basic;
        
        return new EnemyInstance(path[0].x, path[0].y, config, path);
    }
};

/**
 * Instancia de enemigo
 */
class EnemyInstance extends Engine.Entity {
    constructor(x, y, config, path) {
        super(x, y, config.width, config.height, Engine.layers.ENTITIES);
        
        // Propiedades del enemigo
        this.speed = config.speed;
        this.maxHealth = config.health;
        this.health = config.health;
        this.damage = config.damage;
        this.reward = config.reward;
        this.color = config.color;
        
        // Camino y movimiento
        this.path = path;
        this.currentWaypoint = 1;
        this.progress = 0;
        
        // Estado
        this.frozen = false;
        this.poisoned = false;
        this.slowed = false;
        
        // Animación
        this.animFrame = 0;
        this.animTimer = 0;
    }
    
    /**
     * Actualiza el enemigo
     * @param {number} deltaTime 
     */
    update(deltaTime) {
        if (this.health <= 0) {
            this.active = false;
            return;
        }
        
        // Calcular velocidad con modificadores
        let speed = this.speed;
        if (this.frozen) speed *= 0.5;
        if (this.slowed) speed *= 0.7;
        
        // Mover hacia el siguiente waypoint
        if (this.currentWaypoint < this.path.length) {
            const target = this.path[this.currentWaypoint];
            const dx = target.x - this.x;
            const dy = target.y - this.y;
            const distance = Math.sqrt(dx * dx + dy * dy);
            
            if (distance < 5) {
                // Llegó al waypoint
                this.currentWaypoint++;
                
                // Verificar si llegó al final
                if (this.currentWaypoint >= this.path.length) {
                    this.reachEnd();
                }
            } else {
                // Mover hacia el waypoint
                this.x += (dx / distance) * speed * deltaTime;
                this.y += (dy / distance) * speed * deltaTime;
                
                // Rotar hacia la dirección de movimiento
                this.rotation = Math.atan2(dy, dx);
            }
        }
        
        // Actualizar animación
        this.animTimer += deltaTime;
        if (this.animTimer > 0.1) {
            this.animTimer = 0;
            this.animFrame = (this.animFrame + 1) % 4;
        }
        
        // Actualizar efectos de estado
        if (this.poisoned) {
            this.takeDamage(10 * deltaTime); // Daño por segundo
        }
    }
    
    /**
     * Renderiza el enemigo
     * @param {CanvasRenderingContext2D} ctx 
     */
    render(ctx) {
        ctx.save();
        ctx.translate(this.x, this.y);
        ctx.rotate(this.rotation);
        
        // Cuerpo del enemigo (pixel art style)
        ctx.fillStyle = this.color;
        ctx.fillRect(-this.width/2, -this.height/2, this.width, this.height);
        
        // Borde oscuro
        ctx.strokeStyle = '#0a0a0c';
        ctx.lineWidth = 2;
        ctx.strokeRect(-this.width/2, -this.height/2, this.width, this.height);
        
        // Ojos brillantes
        ctx.fillStyle = '#d0d0d5';
        ctx.fillRect(2, -8, 6, 6);
        ctx.fillRect(2, 2, 6, 6);
        
        ctx.restore();
        
        // Barra de vida
        this.renderHealthBar(ctx);
    }
    
    /**
     * Renderiza la barra de vida
     * @param {CanvasRenderingContext2D} ctx 
     */
    renderHealthBar(ctx) {
        const barWidth = this.width;
        const barHeight = 4;
        const healthPercent = this.health / this.maxHealth;
        
        // Fondo
        ctx.fillStyle = '#0a0a0c';
        ctx.fillRect(this.x - barWidth/2, this.y - this.height/2 - 8, barWidth, barHeight);
        
        // Vida actual
        ctx.fillStyle = healthPercent > 0.5 ? '#2e5a3a' : healthPercent > 0.25 ? '#8b6b2e' : '#8b2e2e';
        ctx.fillRect(this.x - barWidth/2, this.y - this.height/2 - 8, barWidth * healthPercent, barHeight);
        
        // Borde
        ctx.strokeStyle = '#1a1a1f';
        ctx.lineWidth = 1;
        ctx.strokeRect(this.x - barWidth/2, this.y - this.height/2 - 8, barWidth, barHeight);
    }
    
    /**
     * Aplica daño al enemigo
     * @param {number} amount 
     */
    takeDamage(amount) {
        this.health -= amount;
        
        if (this.health <= 0) {
            this.die();
        }
    }
    
    /**
     * Called when enemy dies
     */
    die() {
        this.active = false;
        
        // Añadir recompensa
        if (typeof Game !== 'undefined') {
            Game.addGold(this.reward);
            Game.addScore(this.reward * 10);
        }
        
        // Crear efecto de muerte (placeholder)
        this.createDeathEffect();
    }
    
    /**
     * Called when enemy reaches the end
     */
    reachEnd() {
        this.active = false;
        
        // Restar vida al jugador
        if (typeof Game !== 'undefined') {
            Game.loseLife(this.damage);
        }
    }
    
    /**
     * Crea efecto de muerte
     */
    createDeathEffect() {
        // Placeholder para sistema de partículas
        console.log('Enemy died at', this.x, this.y);
    }
    
    /**
     * Aplica efecto de congelación
     */
    freeze() {
        this.frozen = true;
        setTimeout(() => { this.frozen = false; }, 1000);
    }
    
    /**
     * Aplica efecto de veneno
     */
    poison() {
        this.poisoned = true;
        setTimeout(() => { this.poisoned = false; }, 3000);
    }
    
    /**
     * Aplica efecto de lentitud
     */
    slow() {
        this.slowed = true;
        setTimeout(() => { this.slowed = false; }, 2000);
    }
}
