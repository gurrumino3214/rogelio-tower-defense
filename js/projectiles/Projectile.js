/**
 * Projectile.js - Clase base de proyectil
 * 
 * Maneja trayectoria, impacto, daño y efectos de proyectiles.
 * Optimizado para cientos de proyectiles simultáneos.
 * 
 * @module Projectile
 */

class Projectile {
    /**
     * Crea un nuevo proyectil
     * @param {Object} config - Configuración del proyectil
     * @param {number} config.x - Posición X inicial
     * @param {number} config.y - Posición Y inicial
     * @param {number} config.targetX - Posición X objetivo (para cálculo inicial de dirección)
     * @param {number} config.targetY - Posición Y objetivo
     * @param {string} config.typeId - ID del tipo de proyectil (de ProjectileTypes)
     * @param {Object} config.source - Entidad que dispara (torre, enemigo, etc.)
     * @param {Object} [config.target] - Objetivo actual (enemy) para homing
     */
    constructor(config) {
        // Posición
        this.x = config.x || 0;
        this.y = config.y || 0;

        // Referencias
        this.typeId = config.typeId || 'bullet_basic';
        this.type = null; // Se asigna desde ProjectileTypes
        this.source = config.source || null;
        this.target = config.target || null;

        // Estado
        this.active = true;
        this.age = 0; // Frames transcurridos

        // Propiedades de movimiento
        this.vx = 0;
        this.vy = 0;
        this.speed = 5;
        this.angle = 0;

        // Propiedades de combate
        this.damage = 10;
        this.hitEnemies = new Set(); // Enemigos ya impactados (para piercing)
        this.pierceCount = 0;
        this.maxPierceCount = 1;

        // Propiedades de área
        this.areaDamage = false;
        this.areaRadius = 0;
        this.areaDamageDealt = false;

        // Lifetime
        this.lifetime = -1; // -1 = infinito hasta impacto

        // Efectos
        this.homing = false;
        this.homingStrength = 0.1;
        this.gravity = 0;
        this.acceleration = 0;
        this.rotation = 0;
        this.scale = 1;

        // Visuales
        this.color = { r: 255, g: 255, b: 255, a: 1 };
        this.radius = 3;
        this.trailType = 'none';
        this.trailParticles = [];

        // Callbacks
        this.onHitCallback = null;
        this.updateCallback = null;

        // Inicializar desde tipo si existe
        this.loadFromType();

        // Calcular dirección inicial si hay target
        if (config.targetX !== undefined && config.targetY !== undefined) {
            this.setDirection(config.targetX, config.targetY);
        }
    }

    /**
     * Carga configuración desde ProjectileTypes
     */
    loadFromType() {
        if (!this.typeId || typeof ProjectileTypes === 'undefined') return;

        const type = ProjectileTypes.get(this.typeId);
        if (!type) return;

        this.type = type;
        this.speed = type.speed;
        this.damage = type.damage;
        this.lifetime = type.lifetime;
        this.radius = type.radius;
        this.piercing = type.piercing;
        this.maxPierceCount = type.pierceCount;
        this.pierceCount = type.pierceCount;
        this.areaDamage = type.areaDamage;
        this.areaRadius = type.areaRadius;
        this.trailType = type.trailType;
        this.color = { ...type.color };
        this.onHitCallback = type.onHit;
        this.updateCallback = type.update;
        this.homing = type.homing;
        this.homingStrength = type.homingStrength;
        this.gravity = type.gravity;
        this.acceleration = type.acceleration;
        this.rotation = type.rotation ? this.angle : 0;
        this.scale = type.scale;
    }

    /**
     * Establece la dirección del proyectil hacia un punto
     * @param {number} targetX - X objetivo
     * @param {number} targetY - Y objetivo
     */
    setDirection(targetX, targetY) {
        const dx = targetX - this.x;
        const dy = targetY - this.y;
        this.angle = Math.atan2(dy, dx);
        this.vx = Math.cos(this.angle) * this.speed;
        this.vy = Math.sin(this.angle) * this.speed;

        if (this.type && this.type.rotation) {
            this.rotation = this.angle;
        }
    }

    /**
     * Actualiza el estado del proyectil
     * @param {Array} enemies - Lista de enemigos para colisiones
     * @returns {boolean} True si el proyectil sigue activo
     */
    update(enemies = []) {
        if (!this.active) return false;

        this.age++;

        // Verificar lifetime
        if (this.lifetime > 0 && this.age >= this.lifetime) {
            this.deactivate();
            return false;
        }

        // Aplicar aceleración
        if (this.acceleration !== 0) {
            this.speed = Math.min(this.speed * 1.02, this.speed * 3);
            const currentSpeed = Math.sqrt(this.vx * this.vx + this.vy * this.vy);
            if (currentSpeed > 0) {
                this.vx = (this.vx / currentSpeed) * this.speed;
                this.vy = (this.vy / currentSpeed) * this.speed;
            }
        }

        // Homing guidance (seguir objetivo)
        if (this.homing && this.target && this.target.active) {
            this.applyHoming();
        } else if (this.homing && enemies.length > 0) {
            // Buscar objetivo cercano si no hay target asignado
            this.findNearestTarget(enemies);
        }

        // Aplicar gravedad
        this.vy += this.gravity;

        // Mover
        this.x += this.vx;
        this.y += this.vy;

        // Actualizar rotación si corresponde
        if (this.type && this.type.rotation) {
            this.rotation = Math.atan2(this.vy, this.vx);
        }

        // Generar estela
        if (this.trailType !== 'none') {
            this.generateTrail();
        }

        // Callback personalizado
        if (this.updateCallback && typeof this.updateCallback === 'function') {
            this.updateCallback(this, enemies);
        }

        // Verificar colisiones
        this.checkCollisions(enemies);

        return this.active;
    }

    /**
     * Aplica guía homing hacia el objetivo
     */
    applyHoming() {
        if (!this.target || !this.target.active) return;

        const dx = this.target.x - this.x;
        const dy = this.target.y - this.y;
        const targetAngle = Math.atan2(dy, dx);

        // Interpolar ángulo actual hacia el objetivo
        let angleDiff = targetAngle - this.angle;

        // Normalizar a [-PI, PI]
        while (angleDiff > Math.PI) angleDiff -= Math.PI * 2;
        while (angleDiff < -Math.PI) angleDiff += Math.PI * 2;

        this.angle += angleDiff * this.homingStrength;

        // Actualizar velocidad
        this.vx = Math.cos(this.angle) * this.speed;
        this.vy = Math.sin(this.angle) * this.speed;
    }

    /**
     * Encuentra el objetivo más cercano para homing
     */
    findNearestTarget(enemies) {
        let nearest = null;
        let minDist = Infinity;

        for (const enemy of enemies) {
            if (!enemy.active) continue;

            const dx = enemy.x - this.x;
            const dy = enemy.y - this.y;
            const dist = dx * dx + dy * dy; // Distancia al cuadrado es suficiente

            if (dist < minDist) {
                minDist = dist;
                nearest = enemy;
            }
        }

        if (nearest && minDist < 400 * 400) { // Solo si está dentro de 400px
            this.target = nearest;
        }
    }

    /**
     * Genera partículas de estela
     */
    generateTrail() {
        // Limitar número de partículas de estela
        if (this.trailParticles.length > 5) {
            this.trailParticles.shift();
        }

        this.trailParticles.push({
            x: this.x,
            y: this.y,
            age: 0,
            maxAge: 10
        });
    }

    /**
     * Verifica colisiones con enemigos
     */
    checkCollisions(enemies) {
        if (!this.active) return;

        for (const enemy of enemies) {
            if (!enemy.active) continue;

            // Verificar si ya impactó a este enemigo (para piercing)
            if (this.hitEnemies.has(enemy.id)) {
                continue;
            }

            // Colisión circular
            const dx = enemy.x - this.x;
            const dy = enemy.y - this.y;
            const distance = Math.sqrt(dx * dx + dy * dy);
            const collisionRadius = this.radius + (enemy.radius || enemy.size / 2);

            if (distance <= collisionRadius) {
                this.onHit(enemy);
                
                // Si no es perforante, desactivar
                if (!this.piercing) {
                    break;
                }
            }
        }
    }

    /**
     * Maneja el impacto con un enemigo
     * @param {Object} enemy - Enemigo impactado
     */
    onHit(enemy) {
        if (!this.active) return;

        // Marcar como impactado
        this.hitEnemies.add(enemy.id);

        // Reducir contador de perforación
        if (this.piercing) {
            this.pierceCount--;
            if (this.pierceCount <= 0) {
                this.active = false;
            }
        } else {
            this.active = false;
        }

        // Aplicar daño
        if (enemy.takeDamage) {
            enemy.takeDamage(this.damage, this.source);
        }

        // Callback personalizado del tipo
        if (this.onHitCallback && typeof this.onHitCallback === 'function') {
            this.onHitCallback(this, enemy);
        }

        // Daño en área
        if (this.areaDamage && !this.areaDamageDealt) {
            this.dealAreaDamage(enemy);
            this.areaDamageDealt = true;
        }

        // Generar partículas de impacto
        this.spawnImpactParticles(enemy);
    }

    /**
     * Aplica daño en área alrededor del punto de impacto
     * @param {Object} centerEnemy - Enemigo centro del impacto
     */
    dealAreaDamage(centerEnemy) {
        if (!centerEnemy || !centerEnemy.gameState || !centerEnemy.gameState.enemies) return;

        const enemies = centerEnemy.gameState.enemies;

        for (const enemy of enemies) {
            if (!enemy.active || enemy.id === centerEnemy.id) continue;

            const dx = enemy.x - this.x;
            const dy = enemy.y - this.y;
            const distance = Math.sqrt(dx * dx + dy * dy);

            if (distance <= this.areaRadius) {
                // Daño disminuye con la distancia
                const damageMultiplier = 1 - (distance / this.areaRadius);
                const areaDamage = Math.floor(this.damage * damageMultiplier * 0.8);

                if (enemy.takeDamage) {
                    enemy.takeDamage(areaDamage, this.source);
                }

                // Empuje hacia atrás
                if (enemy.applyKnockback) {
                    const knockbackForce = 5 * damageMultiplier;
                    const angle = Math.atan2(dy, dx);
                    enemy.applyKnockback(
                        Math.cos(angle) * knockbackForce,
                        Math.sin(angle) * knockbackForce
                    );
                }
            }
        }

        // Generar partículas de explosión
        this.spawnExplosionParticles();
    }

    /**
     * Genera partículas de impacto
     */
    spawnImpactParticles(enemy) {
        if (typeof ParticleSystem === 'undefined') return;

        const count = 5 + Math.floor(Math.random() * 5);
        
        for (let i = 0; i < count; i++) {
            const angle = Math.random() * Math.PI * 2;
            const speed = 2 + Math.random() * 4;
            
            ParticleSystem.spawn({
                x: this.x,
                y: this.y,
                vx: Math.cos(angle) * speed,
                vy: Math.sin(angle) * speed,
                life: 20 + Math.random() * 20,
                color: { ...this.color },
                size: 2 + Math.random() * 3,
                type: 'spark',
                gravity: 0.1
            });
        }
    }

    /**
     * Genera partículas de explosión (para daño en área)
     */
    spawnExplosionParticles() {
        if (typeof ParticleSystem === 'undefined') return;

        const count = 20 + Math.floor(Math.random() * 20);
        
        for (let i = 0; i < count; i++) {
            const angle = Math.random() * Math.PI * 2;
            const speed = 1 + Math.random() * 6;
            
            ParticleSystem.spawn({
                x: this.x,
                y: this.y,
                vx: Math.cos(angle) * speed,
                vy: Math.sin(angle) * speed,
                life: 30 + Math.random() * 30,
                color: { r: 255, g: 100 + Math.random() * 100, b: 0, a: 1 },
                size: 3 + Math.random() * 5,
                type: 'glow',
                gravity: 0.05
            });
        }
    }

    /**
     * Desactiva el proyectil
     */
    deactivate() {
        this.active = false;
    }

    /**
     * Renderiza el proyectil
     * @param {CanvasRenderingContext2D} ctx - Contexto del canvas
     */
    render(ctx) {
        if (!this.active) return;

        ctx.save();
        ctx.translate(this.x, this.y);

        // Renderizar estela
        this.renderTrail(ctx);

        // Rotar si corresponde
        if (this.type && this.type.rotation) {
            ctx.rotate(this.rotation);
        }

        // Escalar
        if (this.scale !== 1) {
            ctx.scale(this.scale, this.scale);
        }

        // Renderizar según categoría
        switch (this.type ? this.type.category : 'bullet') {
            case 'arrow':
                this.renderArrow(ctx);
                break;
            case 'magic':
                this.renderMagic(ctx);
                break;
            case 'laser':
                this.renderLaser(ctx);
                break;
            case 'explosion':
                this.renderExplosion(ctx);
                break;
            default:
                this.renderBullet(ctx);
        }

        ctx.restore();
    }

    /**
     * Renderiza estela del proyectil
     */
    renderTrail(ctx) {
        for (let i = this.trailParticles.length - 1; i >= 0; i--) {
            const particle = this.trailParticles[i];
            particle.age++;

            const alpha = 1 - (particle.age / particle.maxAge);
            
            if (particle.age >= particle.maxAge) {
                this.trailParticles.splice(i, 1);
                continue;
            }

            ctx.fillStyle = `rgba(${this.color.r}, ${this.color.g}, ${this.color.b}, ${alpha * 0.5})`;
            ctx.beginPath();
            ctx.arc(particle.x, particle.y, this.radius * (1 - particle.age / particle.maxAge), 0, Math.PI * 2);
            ctx.fill();
        }
    }

    /**
     * Renderiza como bala
     */
    renderBullet(ctx) {
        ctx.fillStyle = `rgba(${this.color.r}, ${this.color.g}, ${this.color.b}, ${this.color.a})`;
        ctx.beginPath();
        ctx.arc(0, 0, this.radius, 0, Math.PI * 2);
        ctx.fill();

        // Brillo
        ctx.fillStyle = `rgba(${this.color.r}, ${this.color.g}, ${this.color.b}, 0.5)`;
        ctx.beginPath();
        ctx.arc(0, 0, this.radius * 1.5, 0, Math.PI * 2);
        ctx.fill();
    }

    /**
     * Renderiza como flecha
     */
    renderArrow(ctx) {
        const length = this.radius * 4;
        const width = this.radius;

        ctx.fillStyle = `rgba(${this.color.r}, ${this.color.g}, ${this.color.b}, ${this.color.a})`;
        
        // Cuerpo de la flecha
        ctx.beginPath();
        ctx.moveTo(length / 2, 0);
        ctx.lineTo(-length / 2, width / 2);
        ctx.lineTo(-length / 2, -width / 2);
        ctx.closePath();
        ctx.fill();

        // Punta
        ctx.fillStyle = '#888';
        ctx.beginPath();
        ctx.moveTo(length / 2, 0);
        ctx.lineTo(length / 4, width / 3);
        ctx.lineTo(length / 4, -width / 3);
        ctx.closePath();
        ctx.fill();
    }

    /**
     * Renderiza como magia
     */
    renderMagic(ctx) {
        // Orbe brillante
        const gradient = ctx.createRadialGradient(0, 0, 0, 0, 0, this.radius * 2);
        gradient.addColorStop(0, `rgba(${this.color.r}, ${this.color.g}, ${this.color.b}, 1)`);
        gradient.addColorStop(0.5, `rgba(${this.color.r}, ${this.color.g}, ${this.color.b}, 0.5)`);
        gradient.addColorStop(1, `rgba(${this.color.r}, ${this.color.g}, ${this.color.b}, 0)`);

        ctx.fillStyle = gradient;
        ctx.beginPath();
        ctx.arc(0, 0, this.radius * 2, 0, Math.PI * 2);
        ctx.fill();

        // Núcleo
        ctx.fillStyle = '#fff';
        ctx.beginPath();
        ctx.arc(0, 0, this.radius * 0.5, 0, Math.PI * 2);
        ctx.fill();
    }

    /**
     * Renderiza como láser
     */
    renderLaser(ctx) {
        const length = this.speed * 2;
        
        ctx.strokeStyle = `rgba(${this.color.r}, ${this.color.g}, ${this.color.b}, ${this.color.a})`;
        ctx.lineWidth = this.radius;
        ctx.lineCap = 'round';
        
        ctx.beginPath();
        ctx.moveTo(-length / 2, 0);
        ctx.lineTo(length / 2, 0);
        ctx.stroke();

        // Brillo exterior
        ctx.strokeStyle = `rgba(${this.color.r}, ${this.color.g}, ${this.color.b}, 0.3)`;
        ctx.lineWidth = this.radius * 3;
        ctx.stroke();
    }

    /**
     * Renderiza como explosión
     */
    renderExplosion(ctx) {
        const progress = this.age / (this.lifetime || 1);
        const currentRadius = this.radius + (this.areaRadius * progress * 0.3);

        // Explosión exterior
        const gradient = ctx.createRadialGradient(0, 0, 0, 0, 0, currentRadius);
        gradient.addColorStop(0, `rgba(${this.color.r}, ${this.color.g}, ${this.color.b}, 1)`);
        gradient.addColorStop(0.4, `rgba(${this.color.r + 50}, ${this.color.g}, ${this.color.b}, 0.8)`);
        gradient.addColorStop(1, `rgba(${this.color.r}, ${this.color.g}, ${this.color.b}, 0)`);

        ctx.fillStyle = gradient;
        ctx.beginPath();
        ctx.arc(0, 0, currentRadius, 0, Math.PI * 2);
        ctx.fill();

        // Núcleo blanco
        ctx.fillStyle = `rgba(255, 255, 200, ${1 - progress})`;
        ctx.beginPath();
        ctx.arc(0, 0, currentRadius * 0.3, 0, Math.PI * 2);
        ctx.fill();
    }

    /**
     * Obtiene información del proyectil para debug
     * @returns {Object} Información del proyectil
     */
    getDebugInfo() {
        return {
            typeId: this.typeId,
            active: this.active,
            position: { x: this.x, y: this.y },
            velocity: { vx: this.vx, vy: this.vy },
            damage: this.damage,
            pierceRemaining: this.pierceCount,
            age: this.age,
            lifetime: this.lifetime
        };
    }
}

// Exportar
if (typeof module !== 'undefined' && module.exports) {
    module.exports = Projectile;
}
