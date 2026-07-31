/**
 * @fileoverview Sistema de Enemigos - Gestión optimizada para cientos de instancias
 * @module enemies/Enemy
 */

import { EnemyConfig } from '../../config/enemyConfig.js';

/**
 * Estados posibles del enemigo
 * @enum {number}
 */
export const EnemyState = {
    IDLE: 0,
    MOVING: 1,
    ATTACKING: 2,
    STUNNED: 3,
    SLOWED: 4,
    BURNING: 5,
    FROZEN: 6,
    DYING: 7,
    DEAD: 8
};

/**
 * Clase Enemy - Representa un enemigo individual
 * Optimizado para rendimiento con cientos de instancias simultáneas
 */
export class Enemy {
    /**
     * Crea una instancia de Enemy
     * @param {Object} config - Configuración del tipo de enemigo
     * @param {string} config.type - Tipo de enemigo (ej: 'basic', 'fast', 'tank')
     * @param {number} config.maxHealth - Vida máxima base
     * @param {number} config.speed - Velocidad base
     * @param {number} config.defense - Defensa base (reduce daño)
     * @param {number} config.damage - Daño que inflige al jugador
     * @param {number} config.reward - Recompensa al morir
     * @param {number} config.width - Ancho en píxeles
     * @param {number} config.height - Alto en píxeles
     * @param {Object} [config.animations] - Sprites de animación
     * @param {number} waveNumber - Número de oleada actual (para escalado)
     */
    constructor(config, waveNumber = 1) {
        // Identificador único
        this.id = Enemy.generateId();
        
        // Configuración base
        this.type = config.type || 'basic';
        this.baseMaxHealth = config.maxHealth || 100;
        this.baseSpeed = config.speed || 50;
        this.baseDefense = config.defense || 0;
        this.baseDamage = config.damage || 10;
        this.baseReward = config.reward || 10;
        
        // Dimensiones
        this.width = config.width || 32;
        this.height = config.height || 32;
        
        // Animaciones
        this.animations = config.animations || {};
        this.currentAnimation = 'idle';
        this.animationFrame = 0;
        this.animationTimer = 0;
        this.animationSpeed = config.animationSpeed || 0.1;
        
        // Estado actual
        this.state = EnemyState.IDLE;
        this.previousState = EnemyState.IDLE;
        
        // Posición y movimiento
        this.x = 0;
        this.y = 0;
        this.path = []; // Array de puntos {x, y}
        this.currentWaypoint = 0;
        this.progress = 0; // Progreso entre waypoints (0-1)
        
        // Stats calculados (con escalado de oleada)
        this.applyWaveScaling(waveNumber);
        
        // Estado de combate
        this.isDead = false;
        this.isRemoving = false;
        
        // Efectos y modificadores
        this.effects = new Map(); // Efectos activos: key -> {type, value, duration, timer}
        this.stunTimer = 0;
        this.slowFactor = 1;
        this.burnTimer = 0;
        this.burnDamage = 0;
        this.freezeTimer = 0;
        
        // Combate
        this.attackTimer = 0;
        this.attackCooldown = config.attackCooldown || 1;
        this.attackRange = config.attackRange || 30;
        this.target = null; // Objetivo actual (torre o jugador)
        
        // Renderizado
        this.visible = true;
        this.alpha = 1;
        this.flashTimer = 0;
        this.flashColor = null;
        
        // Barra de vida
        this.showHealthBar = true;
        this.healthBarWidth = this.width + 8;
        this.healthBarHeight = 4;
        this.healthBarOffsetY = -8;
        
        // Pool de objetos (optimización)
        this._poolNext = null;
        this._poolPrev = null;
        this._inPool = false;
    }
    
    /**
     * Genera un ID único para el enemigo
     * @returns {string} ID único
     */
    static generateId() {
        return `enemy_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;
    }
    
    /**
     * Aplica el escalado de dificultad según la oleada
     * @param {number} waveNumber - Número de oleada
     */
    applyWaveScaling(waveNumber) {
        const scaling = EnemyConfig.waveScaling;
        const multiplier = Math.pow(scaling.factor, waveNumber - 1);
        
        this.maxHealth = Math.floor(this.baseMaxHealth * multiplier);
        this.speed = this.baseSpeed * (1 + (waveNumber - 1) * scaling.speedBonus);
        this.defense = this.baseDefense * multiplier;
        this.damage = Math.floor(this.baseDamage * multiplier);
        this.reward = Math.floor(this.baseReward * (1 + (waveNumber - 1) * scaling.rewardBonus));
        
        // Clamp values
        this.speed = Math.min(this.speed, scaling.maxSpeedMultiplier * this.baseSpeed);
        this.maxHealth = Math.min(this.maxHealth, scaling.maxHealthCap);
    }
    
    /**
     * Inicializa el enemigo con posición y camino
     * @param {number} startX - Posición X inicial
     * @param {number} startY - Posición Y inicial
     * @param {Array<{x: number, y: number}>} path - Camino a seguir
     */
    spawn(startX, startY, path) {
        this.x = startX;
        this.y = startY;
        this.path = [...path];
        this.currentWaypoint = 0;
        this.progress = 0;
        this.state = EnemyState.MOVING;
        this.isDead = false;
        this.isRemoving = false;
        this.currentHealth = this.maxHealth;
        this.alpha = 1;
        this.visible = true;
        this.effects.clear();
        this.resetEffects();
    }
    
    /**
     * Resetea los efectos aplicados
     */
    resetEffects() {
        this.stunTimer = 0;
        this.slowFactor = 1;
        this.burnTimer = 0;
        this.burnDamage = 0;
        this.freezeTimer = 0;
        this.effects.clear();
    }
    
    /**
     * Actualiza el estado del enemigo
     * @param {number} deltaTime - Tiempo delta en segundos
     */
    update(deltaTime) {
        if (this.isDead || this.isRemoving) return;
        
        // Actualizar temporizadores de efectos
        this.updateEffects(deltaTime);
        
        // Verificar estado de aturdimiento
        if (this.state === EnemyState.STUNNED) {
            this.stunTimer -= deltaTime;
            if (this.stunTimer <= 0) {
                this.state = this.previousState || EnemyState.MOVING;
            }
            return; // No se mueve mientras está aturdido
        }
        
        // Actualizar animación
        this.updateAnimation(deltaTime);
        
        // Movimiento
        if (this.state === EnemyState.MOVING) {
            this.move(deltaTime);
        } else if (this.state === EnemyState.ATTACKING) {
            this.attackTimer -= deltaTime;
            if (this.attackTimer <= 0) {
                this.state = EnemyState.MOVING;
            }
        }
        
        // Actualizar flash
        if (this.flashTimer > 0) {
            this.flashTimer -= deltaTime;
        }
        
        // Verificar muerte
        if (this.currentHealth <= 0 && !this.isDead) {
            this.die();
        }
    }
    
    /**
     * Actualiza los efectos activos
     * @param {number} deltaTime - Tiempo delta en segundos
     */
    updateEffects(deltaTime) {
        // Quemadura
        if (this.burnTimer > 0) {
            this.burnTimer -= deltaTime;
            if (this.burnTimer > 0) {
                this.currentHealth -= this.burnDamage * deltaTime;
            } else {
                this.burnTimer = 0;
                this.burnDamage = 0;
                this.effects.delete('burn');
            }
        }
        
        // Congelamiento
        if (this.freezeTimer > 0) {
            this.freezeTimer -= deltaTime;
            if (this.freezeTimer <= 0) {
                this.freezeTimer = 0;
                this.slowFactor = 1;
                this.effects.delete('freeze');
            }
        }
        
        // Otros efectos genéricos
        for (const [key, effect] of this.effects) {
            if (effect.timer !== undefined) {
                effect.timer -= deltaTime;
                if (effect.timer <= 0) {
                    this.removeEffect(key);
                }
            }
        }
    }
    
    /**
     * Mueve al enemigo siguiendo el camino
     * @param {number} deltaTime - Tiempo delta en segundos
     */
    move(deltaTime) {
        if (this.path.length === 0 || this.currentWaypoint >= this.path.length) {
            return; // Camino completado
        }
        
        const target = this.path[this.currentWaypoint];
        const dx = target.x - this.x;
        const dy = target.y - this.y;
        const distance = Math.sqrt(dx * dx + dy * dy);
        
        // Calcular velocidad con modificadores
        let currentSpeed = this.speed * this.slowFactor;
        
        // Aplicar slow por congelamiento
        if (this.state === EnemyState.FROZEN) {
            currentSpeed *= EnemyConfig.statusEffects.freeze.speedMultiplier;
        }
        
        // Mover si hay distancia suficiente
        if (distance > 1) {
            const moveDistance = currentSpeed * deltaTime;
            
            if (moveDistance >= distance) {
                // Llegó al waypoint
                this.x = target.x;
                this.y = target.y;
                this.currentWaypoint++;
                this.progress = 0;
                
                // Verificar si completó el camino
                if (this.currentWaypoint >= this.path.length) {
                    this.onPathComplete();
                }
            } else {
                // Mover hacia el waypoint
                this.x += (dx / distance) * moveDistance;
                this.y += (dy / distance) * moveDistance;
                this.progress = moveDistance / distance;
            }
        } else {
            // Ya está en el waypoint, avanzar al siguiente
            this.currentWaypoint++;
            this.progress = 0;
            
            if (this.currentWaypoint >= this.path.length) {
                this.onPathComplete();
            }
        }
    }
    
    /**
     * Callback cuando completa el camino
     */
    onPathComplete() {
        // Por defecto, el enemigo llega al final (daña al jugador)
        this.state = EnemyState.DYING;
        this.isRemoving = true;
        
        if (this.onReachEndCallback) {
            this.onReachEndCallback(this);
        }
    }
    
    /**
     * Actualiza la animación actual
     * @param {number} deltaTime - Tiempo delta en segundos
     */
    updateAnimation(deltaTime) {
        const anim = this.animations[this.currentAnimation];
        if (!anim || !anim.frames || anim.frames.length === 0) return;
        
        this.animationTimer += deltaTime;
        
        if (this.animationTimer >= this.animationSpeed) {
            this.animationTimer = 0;
            this.animationFrame = (this.animationFrame + 1) % anim.frames.length;
        }
    }
    
    /**
     * Inflige daño al enemigo
     * @param {number} damage - Daño base
     * @param {Object} [options] - Opciones adicionales
     * @param {string} [options.damageType] - Tipo de daño
     * @param {boolean} [options.ignoreDefense] - Ignorar defensa
     * @param {number} [options.critChance] - Probabilidad de crítico
     * @param {number} [options.critMultiplier] - Multiplicador de crítico
     * @returns {number} Daño real infligido
     */
    takeDamage(damage, options = {}) {
        if (this.isDead) return 0;
        
        // Calcular crítico
        let finalDamage = damage;
        if (options.critChance && Math.random() < options.critChance) {
            finalDamage *= options.critMultiplier || 2;
        }
        
        // Aplicar defensa
        if (!options.ignoreDefense && this.defense > 0) {
            const defenseReduction = EnemyConfig.defenseFormula(this.defense);
            finalDamage = Math.max(1, finalDamage * (1 - defenseReduction));
        }
        
        // Aplicar al vida
        const oldHealth = this.currentHealth;
        this.currentHealth = Math.max(0, this.currentHealth - finalDamage);
        const actualDamage = oldHealth - this.currentHealth;
        
        // Flash visual
        this.flashTimer = 0.1;
        this.flashColor = options.damageType === 'critical' ? '#ff0' : '#fff';
        
        // Verificar muerte
        if (this.currentHealth <= 0) {
            this.die(options.source);
        }
        
        return Math.floor(actualDamage);
    }
    
    /**
     * Aplica un efecto al enemigo
     * @param {string} type - Tipo de efecto ('stun', 'slow', 'burn', 'freeze')
     * @param {Object} params - Parámetros del efecto
     * @param {number} params.duration - Duración en segundos
     * @param {number} [params.value] - Valor del efecto (ej: factor de slow)
     * @param {number} [params.damagePerSecond] - Daño por segundo (burn)
     */
    applyEffect(type, params) {
        const effectConfig = EnemyConfig.statusEffects[type];
        if (!effectConfig) return;
        
        switch (type) {
            case 'stun':
                this.previousState = this.state;
                this.state = EnemyState.STUNNED;
                this.stunTimer = params.duration;
                break;
                
            case 'slow':
                this.slowFactor = Math.max(
                    effectConfig.minSlowFactor,
                    params.value || effectConfig.defaultSlowFactor
                );
                this.effects.set('slow', {
                    type: 'slow',
                    value: this.slowFactor,
                    duration: params.duration,
                    timer: params.duration
                });
                break;
                
            case 'burn':
                this.burnTimer = params.duration;
                this.burnDamage = params.damagePerSecond || effectConfig.defaultDamage;
                this.effects.set('burn', {
                    type: 'burn',
                    duration: params.duration,
                    timer: params.duration,
                    damage: this.burnDamage
                });
                break;
                
            case 'freeze':
                this.freezeTimer = params.duration;
                this.state = EnemyState.FROZEN;
                this.slowFactor = effectConfig.speedMultiplier;
                this.effects.set('freeze', {
                    type: 'freeze',
                    duration: params.duration,
                    timer: params.duration
                });
                break;
        }
    }
    
    /**
     * Remueve un efecto específico
     * @param {string} key - Clave del efecto
     */
    removeEffect(key) {
        const effect = this.effects.get(key);
        if (!effect) return;
        
        switch (effect.type) {
            case 'slow':
                this.slowFactor = 1;
                break;
            case 'freeze':
                this.state = EnemyState.MOVING;
                this.slowFactor = 1;
                break;
        }
        
        this.effects.delete(key);
    }
    
    /**
     * Marca al enemigo como muerto
     * @param {Object} [killer] - Entidad que lo mató
     */
    die(killer) {
        if (this.isDead) return;
        
        this.isDead = true;
        this.state = EnemyState.DEAD;
        this.currentHealth = 0;
        
        // Trigger callback de muerte
        if (this.onDeathCallback) {
            this.onDeathCallback(this, killer);
        }
    }
    
    /**
     * Obtiene la recompensa por matar este enemigo
     * @returns {number} Recompensa en oro/puntos
     */
    getReward() {
        return this.reward;
    }
    
    /**
     * Obtiene el porcentaje de vida actual
     * @returns {number} Porcentaje (0-1)
     */
    getHealthPercent() {
        return this.currentHealth / this.maxHealth;
    }
    
    /**
     * Verifica si el enemigo está en pantalla
     * @param {number} cameraX - Posición X de la cámara
     * @param {number} cameraY - Posición Y de la cámara
     * @param {number} screenWidth - Ancho de pantalla
     * @param {number} screenHeight - Alto de pantalla
     * @returns {boolean} True si es visible
     */
    isVisible(cameraX, cameraY, screenWidth, screenHeight) {
        return this.visible &&
               this.x + this.width > cameraX &&
               this.x < cameraX + screenWidth &&
               this.y + this.height > cameraY &&
               this.y < cameraY + screenHeight;
    }
    
    /**
     * Obtiene el frame de animación actual
     * @returns {HTMLImageElement|Object|null} Frame actual
     */
    getCurrentFrame() {
        const anim = this.animations[this.currentAnimation];
        if (!anim || !anim.frames || anim.frames.length === 0) {
            return null;
        }
        return anim.frames[this.animationFrame] || null;
    }
    
    /**
     * Cambia la animación actual
     * @param {string} animationName - Nombre de la animación
     */
    setAnimation(animationName) {
        if (this.animations[animationName] && this.currentAnimation !== animationName) {
            this.currentAnimation = animationName;
            this.animationFrame = 0;
            this.animationTimer = 0;
        }
    }
    
    /**
     * Serializa el enemigo a objeto plano (para guardado/debug)
     * @returns {Object} Datos serializados
     */
    toJSON() {
        return {
            id: this.id,
            type: this.type,
            x: this.x,
            y: this.y,
            state: this.state,
            currentHealth: this.currentHealth,
            maxHealth: this.maxHealth,
            isDead: this.isDead,
            currentWaypoint: this.currentWaypoint,
            effects: Array.from(this.effects.entries())
        };
    }
    
    /**
     * Resetea el enemigo para reutilización en object pool
     */
    resetForPool() {
        this.isDead = true;
        this.isRemoving = true;
        this.visible = false;
        this._inPool = true;
        this.effects.clear();
        this.resetEffects();
        this.path = [];
        this.target = null;
    }
    
    /**
     * Prepara el enemigo para salir del pool
     */
    activateFromPool() {
        this._inPool = false;
        this.visible = true;
        this.alpha = 1;
        this.isDead = false;
        this.isRemoving = false;
    }
}

// Propiedades estáticas para configuración global
Enemy.config = EnemyConfig;
Enemy.State = EnemyState;

export default Enemy;
