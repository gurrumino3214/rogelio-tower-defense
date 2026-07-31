/**
 * @fileoverview Configuración de Enemigos - Definición de tipos y balance
 * @module config/enemyConfig
 */

/**
 * Configuración global del sistema de enemigos
 */
export const EnemyConfig = {
    /**
     * Tipos de enemigos disponibles
     * Cada tipo define stats base y comportamiento
     */
    enemyTypes: {
        basic: {
            type: 'basic',
            maxHealth: 100,
            speed: 60,
            defense: 0,
            damage: 10,
            reward: 10,
            width: 32,
            height: 32,
            attackCooldown: 1.0,
            attackRange: 30,
            animationSpeed: 0.15,
            animations: {
                idle: { frames: [], loop: true },
                walk: { frames: [], loop: true },
                attack: { frames: [], loop: false },
                death: { frames: [], loop: false }
            }
        },
        
        fast: {
            type: 'fast',
            maxHealth: 60,
            speed: 100,
            defense: 0,
            damage: 8,
            reward: 15,
            width: 28,
            height: 28,
            attackCooldown: 0.5,
            attackRange: 25,
            animationSpeed: 0.1,
            animations: {
                idle: { frames: [], loop: true },
                walk: { frames: [], loop: true },
                attack: { frames: [], loop: false },
                death: { frames: [], loop: false }
            }
        },
        
        tank: {
            type: 'tank',
            maxHealth: 250,
            speed: 35,
            defense: 5,
            damage: 20,
            reward: 25,
            width: 40,
            height: 40,
            attackCooldown: 2.0,
            attackRange: 35,
            animationSpeed: 0.2,
            animations: {
                idle: { frames: [], loop: true },
                walk: { frames: [], loop: true },
                attack: { frames: [], loop: false },
                death: { frames: [], loop: false }
            }
        },
        
        ranged: {
            type: 'ranged',
            maxHealth: 80,
            speed: 50,
            defense: 0,
            damage: 15,
            reward: 20,
            width: 30,
            height: 30,
            attackCooldown: 1.5,
            attackRange: 150,
            animationSpeed: 0.15,
            animations: {
                idle: { frames: [], loop: true },
                walk: { frames: [], loop: true },
                attack: { frames: [], loop: false },
                death: { frames: [], loop: false }
            }
        },
        
        healer: {
            type: 'healer',
            maxHealth: 90,
            speed: 45,
            defense: 0,
            damage: 5,
            reward: 30,
            width: 32,
            height: 32,
            attackCooldown: 3.0,
            attackRange: 100,
            healAmount: 25,
            healRange: 80,
            animationSpeed: 0.18,
            animations: {
                idle: { frames: [], loop: true },
                walk: { frames: [], loop: true },
                attack: { frames: [], loop: false },
                heal: { frames: [], loop: false },
                death: { frames: [], loop: false }
            }
        }
    },
    
    /**
     * Escalado de dificultad por oleada
     */
    waveScaling: {
        factor: 1.2,           // Multiplicador de stats por oleada
        speedBonus: 0.02,      // Bonus de velocidad por oleada (2%)
        rewardBonus: 0.05,     // Bonus de recompensa por oleada (5%)
        maxSpeedMultiplier: 2, // Velocidad máxima (2x base)
        maxHealthCap: 10000    // Tope máximo de vida
    },
    
    /**
     * Fórmula de cálculo de defensa
     * @param {number} defense - Valor de defensa
     * @returns {number} Porcentaje de reducción (0-1)
     */
    defenseFormula: function(defense) {
        // Fórmula: reducción = defense / (defense + 100)
        // 50 defensa = 33% reducción, 100 defensa = 50% reducción
        return defense / (defense + 100);
    },
    
    /**
     * Configuración de efectos de estado
     */
    statusEffects: {
        stun: {
            name: 'Stun',
            description: 'Inmoviliza al enemigo',
            canMove: false,
            canAttack: false,
            defaultDuration: 1.5
        },
        slow: {
            name: 'Slow',
            description: 'Reduce la velocidad de movimiento',
            defaultSlowFactor: 0.5,
            minSlowFactor: 0.2,
            defaultDuration: 2.0
        },
        burn: {
            name: 'Burn',
            description: 'Daño continuo por tiempo',
            defaultDamage: 10,
            defaultDuration: 3.0,
            tickRate: 0.5
        },
        freeze: {
            name: 'Freeze',
            description: 'Congela y reduce velocidad drásticamente',
            speedMultiplier: 0.3,
            defaultDuration: 1.5
        },
        poison: {
            name: 'Poison',
            description: 'Daño continuo que escala con el tiempo',
            baseDamage: 5,
            damageIncreasePerTick: 2,
            defaultDuration: 4.0,
            tickRate: 1.0
        }
    },
    
    /**
     * Configuración del Object Pool para optimización
     */
    poolConfig: {
        initialSize: 50,       // Enemigos iniciales en pool
        maxSize: 500,          // Máximo de enemigos en memoria
        growthStep: 25,        // Cuántos crear cuando se agota
        cleanupInterval: 5.0   // Segundos entre limpiezas automáticas
    },
    
    /**
     * Límites de rendimiento
     */
    performanceLimits: {
        maxActiveEnemies: 200,      // Máximo enemigos activos simultáneos
        updateBatchSize: 50,        // Enemigos a actualizar por frame (si hay lag)
        cullingMargin: 100,         // Píxeles extra fuera de pantalla para renderizar
        lodDistance: 800            // Distancia para reducir detalle (LOD)
    },
    
    /**
     * Configuración de recompensas
     */
    rewardConfig: {
        baseGold: 10,
        killStreakBonus: 0.1,       // 10% extra por cada 10 kills seguidas
        headshotMultiplier: 1.5,    // Multiplicador para críticos
        assistPercentage: 0.25      // % de recompensa para asistencias
    },
    
    /**
     * Configuración de comportamiento
     */
    behaviorConfig: {
        aggregationRadius: 50,      // Radio para agrupar enemigos visualmente
        separationDistance: 20,     // Distancia mínima entre enemigos
        pathfindingUpdateRate: 0.1, // Segundos entre actualizaciones de path
        attackPriority: ['tower', 'player', 'other'] // Prioridad de ataque
    }
};

/**
 * Obtiene la configuración de un tipo de enemigo
 * @param {string} type - Tipo de enemigo
 * @returns {Object|null} Configuración o null si no existe
 */
export function getEnemyType(type) {
    return EnemyConfig.enemyTypes[type] || null;
}

/**
 * Crea una copia profunda de la configuración de un enemigo
 * @param {string} type - Tipo de enemigo
 * @param {number} [waveNumber=1] - Número de oleada para escalado
 * @returns {Object|null} Configuración escalada o null
 */
export function createEnemyConfig(type, waveNumber = 1) {
    const baseConfig = getEnemyType(type);
    if (!baseConfig) return null;
    
    const config = JSON.parse(JSON.stringify(baseConfig));
    const scaling = EnemyConfig.waveScaling;
    const multiplier = Math.pow(scaling.factor, waveNumber - 1);
    
    config.maxHealth = Math.floor(config.maxHealth * multiplier);
    config.speed = config.speed * (1 + (waveNumber - 1) * scaling.speedBonus);
    config.defense = config.defense * multiplier;
    config.damage = Math.floor(config.damage * multiplier);
    config.reward = Math.floor(config.reward * (1 + (waveNumber - 1) * scaling.rewardBonus));
    
    // Clamp values
    config.speed = Math.min(config.speed, scaling.maxSpeedMultiplier * baseConfig.speed);
    config.maxHealth = Math.min(config.maxHealth, scaling.maxHealthCap);
    
    return config;
}

/**
 * Obtiene todos los tipos de enemigos disponibles
 * @returns {Array<string>} Array de nombres de tipos
 */
export function getAllEnemyTypes() {
    return Object.keys(EnemyConfig.enemyTypes);
}

/**
 * Valida la configuración de un enemigo custom
 * @param {Object} config - Configuración a validar
 * @returns {Object} Resultado de validación {valid, errors}
 */
export function validateEnemyConfig(config) {
    const errors = [];
    
    if (!config.type || typeof config.type !== 'string') {
        errors.push('type es requerido y debe ser string');
    }
    
    if (config.maxHealth !== undefined && (typeof config.maxHealth !== 'number' || config.maxHealth <= 0)) {
        errors.push('maxHealth debe ser un número positivo');
    }
    
    if (config.speed !== undefined && (typeof config.speed !== 'number' || config.speed <= 0)) {
        errors.push('speed debe ser un número positivo');
    }
    
    if (config.defense !== undefined && (typeof config.defense !== 'number' || config.defense < 0)) {
        errors.push('defense debe ser un número no negativo');
    }
    
    if (config.damage !== undefined && (typeof config.damage !== 'number' || config.damage < 0)) {
        errors.push('damage debe ser un número no negativo');
    }
    
    if (config.reward !== undefined && (typeof config.reward !== 'number' || config.reward < 0)) {
        errors.push('reward debe ser un número no negativo');
    }
    
    return {
        valid: errors.length === 0,
        errors
    };
}

export default EnemyConfig;
