/**
 * ========================================
 * BOSS.JS - Sistema de Bosses
 * ========================================
 * Maneja los enemigos jefe:
 * - Boss de cada 5 olas
 * - Habilidades especiales
 * - Fases de combate
 */

const Boss = {
    // Configuración de bosses
    bossConfigs: [
        // Boss 1 (Ola 5)
        {
            health: 500,
            damage: 3,
            speed: 30,
            reward: 100,
            width: 80,
            height: 80,
            color: '#6b2e4a',
            abilities: ['summon', 'slam']
        },
        // Boss 2 (Ola 10)
        {
            health: 1000,
            damage: 5,
            speed: 35,
            reward: 200,
            width: 90,
            height: 90,
            color: '#4a2e6b',
            abilities: ['summon', 'slam', 'poison']
        }
    ],
    
    /**
     * Crea un boss para una ola específica
     * @param {number} waveNumber 
     * @param {Array} path 
     * @returns {BossInstance}
     */
    createBoss: function(waveNumber, path) {
        const bossIndex = Math.floor(waveNumber / 5) - 1;
        const configIndex = Math.min(bossIndex, this.bossConfigs.length - 1);
        const config = this.bossConfigs[configIndex];
        
        return new BossInstance(path[0].x, path[0].y, config, path);
    }
};

/**
 * Instancia de boss
 */
class BossInstance extends EnemyInstance {
    constructor(x, y, config, path) {
        super(x, y, config, path);
        
        this.abilities = config.abilities;
        this.phase = 1;
        this.abilityCooldown = 0;
        this.maxPhase = 3;
    }
    
    /**
     * Actualiza el boss
     * @param {number} deltaTime 
     */
    update(deltaTime) {
        super.update(deltaTime);
        
        if (!this.active) return;
        
        // Reducir cooldown de habilidades
        if (this.abilityCooldown > 0) {
            this.abilityCooldown -= deltaTime;
        }
        
        // Verificar cambio de fase
        this.checkPhaseChange();
        
        // Usar habilidad si está disponible
        if (this.abilityCooldown <= 0) {
            this.useAbility();
        }
    }
    
    /**
     * Renderiza el boss
     * @param {CanvasRenderingContext2D} ctx 
     */
    render(ctx) {
        ctx.save();
        ctx.translate(this.x, this.y);
        ctx.rotate(this.rotation);
        
        // Cuerpo del boss (más detallado)
        ctx.fillStyle = this.color;
        ctx.fillRect(-this.width/2, -this.height/2, this.width, this.height);
        
        // Borde brillante
        ctx.strokeStyle = '#d0d0d5';
        ctx.lineWidth = 3;
        ctx.strokeRect(-this.width/2, -this.height/2, this.width, this.height);
        
        // Ojos rojos brillantes
        ctx.fillStyle = '#8b2e2e';
        ctx.fillRect(10, -20, 15, 15);
        ctx.fillRect(10, 5, 15, 15);
        
        // Corona/espinas
        ctx.fillStyle = '#4a2e6b';
        ctx.beginPath();
        ctx.moveTo(-this.width/2, -this.height/2);
        ctx.lineTo(-this.width/2 + 10, -this.height/2 - 15);
        ctx.lineTo(-this.width/2 + 20, -this.height/2);
        ctx.lineTo(-this.width/2 + 30, -this.height/2 - 15);
        ctx.lineTo(-this.width/2 + 40, -this.height/2);
        ctx.fill();
        
        ctx.restore();
        
        // Barra de vida más grande
        this.renderBossHealthBar(ctx);
    }
    
    /**
     * Renderiza la barra de vida del boss
     * @param {CanvasRenderingContext2D} ctx 
     */
    renderBossHealthBar(ctx) {
        const barWidth = 200;
        const barHeight = 8;
        const healthPercent = this.health / this.maxHealth;
        
        // Fondo
        ctx.fillStyle = '#0a0a0c';
        ctx.fillRect(this.x - barWidth/2, this.y - this.height/2 - 15, barWidth, barHeight);
        
        // Vida actual con gradiente
        const gradient = ctx.createLinearGradient(
            this.x - barWidth/2, 0,
            this.x + barWidth/2, 0
        );
        gradient.addColorStop(0, '#8b2e2e');
        gradient.addColorStop(0.5, '#a83838');
        gradient.addColorStop(1, '#8b2e2e');
        
        ctx.fillStyle = gradient;
        ctx.fillRect(this.x - barWidth/2, this.y - this.height/2 - 15, barWidth * healthPercent, barHeight);
        
        // Borde dorado
        ctx.strokeStyle = '#8b6b2e';
        ctx.lineWidth = 2;
        ctx.strokeRect(this.x - barWidth/2, this.y - this.height/2 - 15, barWidth, barHeight);
        
        // Indicador de fase
        ctx.fillStyle = '#d0d0d5';
        ctx.font = '12px "Courier New"';
        ctx.fillText(`FASE ${this.phase}`, this.x - 20, this.y - this.height/2 - 20);
    }
    
    /**
     * Verifica el cambio de fase
     */
    checkPhaseChange() {
        const healthPercent = this.health / this.maxHealth;
        
        if (healthPercent < 0.33 && this.phase === 2) {
            this.phase = 3;
            this.onPhaseChange();
        } else if (healthPercent < 0.66 && this.phase === 1) {
            this.phase = 2;
            this.onPhaseChange();
        }
    }
    
    /**
     * Called when phase changes
     */
    onPhaseChange() {
        console.log(`Boss entered phase ${this.phase}`);
        // Aumentar velocidad en fases posteriores
        this.speed *= 1.2;
    }
    
    /**
     * Usa una habilidad aleatoria
     */
    useAbility() {
        if (this.abilities.length === 0) return;
        
        const ability = this.abilities[Math.floor(Math.random() * this.abilities.length)];
        
        switch(ability) {
            case 'summon':
                this.summonMinions();
                break;
            case 'slam':
                this.slamAttack();
                break;
            case 'poison':
                this.poisonAttack();
                break;
        }
        
        this.abilityCooldown = 10; // 10 segundos entre habilidades
    }
    
    /**
     * Invoca secuaces
     */
    summonMinions() {
        console.log('Boss summons minions!');
        // Implementar spawn de enemigos menores
    }
    
    /**
     * Ataque de golpe
     */
    slamAttack() {
        console.log('Boss performs slam attack!');
        // Daño área alrededor del boss
    }
    
    /**
     * Ataque de veneno
     */
    poisonAttack() {
        console.log('Boss uses poison attack!');
        // Aplicar veneno a torres cercanas
    }
}
