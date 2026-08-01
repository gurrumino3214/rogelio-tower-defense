/**
 * BossAbilitySystem.js - Sistema de habilidades para bosses
 * Maneja cooldowns, ejecución de habilidades y efectos
 * 
 * @module bosses/BossAbilitySystem
 */

import { EventEmitter } from '../utils/EventEmitter.js';

/**
 * Gestiona una habilidad individual con su estado y cooldowns
 */
class BossAbility {
    /**
     * @param {Object} config - Configuración de la habilidad
     * @param {string} abilityId - ID único de la habilidad
     */
    constructor(config, abilityId) {
        this.id = abilityId;
        this.config = config;
        this.name = config.name || abilityId;
        this.description = config.description || '';
        
        // Timing
        this.cooldown = config.cooldown || 5000;
        this.castTime = config.castTime || 1000;
        this.manaCost = config.manaCost || 0;
        
        // Estado
        this.currentCooldown = 0;
        this.isCasting = false;
        this.castStartTime = 0;
        this.isOnCooldown = false;
        
        // Efecto
        this.effect = config.effect || {};
        
        // Callbacks
        this.onCastStart = null;
        this.onCastComplete = null;
        this.onCooldownReady = null;
    }
    
    /**
     * Iniciar el lanzamiento de la habilidad
     * @returns {boolean} True si pudo iniciar
     */
    startCast() {
        if (this.isOnCooldown || this.isCasting) {
            return false;
        }
        
        this.isCasting = true;
        this.castStartTime = Date.now();
        
        if (this.onCastStart) {
            this.onCastStart(this);
        }
        
        return true;
    }
    
    /**
     * Verificar si el lanzamiento ha completado
     * @returns {boolean} True si completó
     */
    checkCastComplete() {
        if (!this.isCasting) return false;
        
        const elapsed = Date.now() - this.castStartTime;
        if (elapsed >= this.castTime) {
            this.isCasting = false;
            this.triggerCooldown();
            
            if (this.onCastComplete) {
                this.onCastComplete(this);
            }
            
            return true;
        }
        
        return false;
    }
    
    /**
     * Activar cooldown
     */
    triggerCooldown() {
        this.isOnCooldown = true;
        this.currentCooldown = this.cooldown;
    }
    
    /**
     * Actualizar cooldown
     * @param {number} deltaTime - Tiempo en ms desde último frame
     * @returns {boolean} True si el cooldown está listo
     */
    update(deltaTime) {
        // Actualizar casting
        if (this.isCasting) {
            this.checkCastComplete();
        }
        
        // Actualizar cooldown
        if (this.isOnCooldown) {
            this.currentCooldown -= deltaTime;
            
            if (this.currentCooldown <= 0) {
                this.currentCooldown = 0;
                this.isOnCooldown = false;
                
                if (this.onCooldownReady) {
                    this.onCooldownReady(this);
                }
                
                return true; // Cooldown ready
            }
        }
        
        return false;
    }
    
    /**
     * Obtener progreso del cooldown (0-1)
     * @returns {number}
     */
    getCooldownProgress() {
        if (!this.isOnCooldown) return 1;
        return 1 - (this.currentCooldown / this.cooldown);
    }
    
    /**
     * Obtener progreso del cast (0-1)
     * @returns {number}
     */
    getCastProgress() {
        if (!this.isCasting) return 0;
        const elapsed = Date.now() - this.castStartTime;
        return Math.min(1, elapsed / this.castTime);
    }
    
    /**
     * Resetear estado de la habilidad
     */
    reset() {
        this.isCasting = false;
        this.isOnCooldown = false;
        this.currentCooldown = 0;
        this.castStartTime = 0;
    }
    
    /**
     * Serializar estado para guardado
     * @returns {Object}
     */
    serialize() {
        return {
            id: this.id,
            isOnCooldown: this.isOnCooldown,
            currentCooldown: this.currentCooldown,
            isCasting: this.isCasting
        };
    }
    
    /**
     * Cargar estado desde guardado
     * @param {Object} data - Datos serializados
     */
    deserialize(data) {
        this.isOnCooldown = data.isOnCooldown || false;
        this.currentCooldown = data.currentCooldown || 0;
        this.isCasting = data.isCasting || false;
    }
}

/**
 * Sistema de habilidades para bosses
 * Maneja múltiples habilidades, cooldowns y ejecución
 */
class BossAbilitySystem extends EventEmitter {
    /**
     * @param {Object} abilitiesConfig - Configuración de habilidades
     * @param {Boss} boss - Instancia del boss propietario
     */
    constructor(abilitiesConfig, boss) {
        super();
        
        this.boss = boss;
        this.abilities = new Map();
        this.activeAbility = null;
        this.abilityQueue = [];
        
        // Configurar habilidades
        if (abilitiesConfig) {
            this.initializeAbilities(abilitiesConfig);
        }
        
        // Estadísticas
        this.stats = {
            totalCasts: 0,
            castsByAbility: new Map(),
            lastCastTime: 0
        };
    }
    
    /**
     * Inicializar habilidades desde configuración
     * @param {Object} config - Objeto de configuraciones
     */
    initializeAbilities(config) {
        for (const [abilityId, abilityConfig] of Object.entries(config)) {
            const ability = new BossAbility(abilityConfig, abilityId);
            
            // Configurar callbacks
            ability.onCastStart = (a) => this.onAbilityCastStart(a);
            ability.onCastComplete = (a) => this.onAbilityCastComplete(a);
            ability.onCooldownReady = (a) => this.onCooldownReady(a);
            
            this.abilities.set(abilityId, ability);
        }
        
        console.log(`[BossAbilitySystem] ${this.abilities.size} habilidades inicializadas`);
    }
    
    /**
     * Callback cuando inicia un lanzamiento
     * @param {BossAbility} ability - Habilidad que se lanza
     */
    onAbilityCastStart(ability) {
        this.activeAbility = ability;
        this.stats.totalCasts++;
        
        const count = this.stats.castsByAbility.get(ability.id) || 0;
        this.stats.castsByAbility.set(ability.id, count + 1);
        this.stats.lastCastTime = Date.now();
        
        this.emit('castStart', {
            ability: ability,
            boss: this.boss
        });
    }
    
    /**
     * Callback cuando completa un lanzamiento
     * @param {BossAbility} ability - Habilidad completada
     */
    onAbilityCastComplete(ability) {
        this.executeAbilityEffect(ability);
        this.activeAbility = null;
        
        this.emit('castComplete', {
            ability: ability,
            boss: this.boss,
            effect: ability.effect
        });
    }
    
    /**
     * Callback cuando un cooldown está listo
     * @param {BossAbility} ability - Habilidad disponible
     */
    onCooldownReady(ability) {
        this.emit('cooldownReady', {
            ability: ability,
            boss: this.boss
        });
    }
    
    /**
     * Ejecutar el efecto de una habilidad
     * @param {BossAbility} ability - Habilidad a ejecutar
     */
    executeAbilityEffect(ability) {
        const effect = ability.effect;
        
        this.emit('executeEffect', {
            ability: ability,
            effect: effect,
            boss: this.boss
        });
        
        // El sistema externo maneja la ejecución real del efecto
        // Este sistema solo notifica qué efecto debe ejecutarse
    }
    
    /**
     * Intentar lanzar una habilidad por ID
     * @param {string} abilityId - ID de la habilidad
     * @returns {boolean} True si pudo iniciar el cast
     */
    tryCast(abilityId) {
        const ability = this.abilities.get(abilityId);
        
        if (!ability) {
            console.warn(`[BossAbilitySystem] Habilidad no encontrada: ${abilityId}`);
            return false;
        }
        
        // Verificar si ya hay algo casteándose
        if (this.activeAbility !== null) {
            this.abilityQueue.push(abilityId);
            return false;
        }
        
        return ability.startCast();
    }
    
    /**
     * Lanzar habilidad aleatoria disponible
     * @param {string[]} allowedIds - IDs permitidas (opcional)
     * @returns {string|null} ID de la habilidad lanzada o null
     */
    castRandom(allowedIds = null) {
        const available = this.getAvailableAbilities(allowedIds);
        
        if (available.length === 0) {
            return null;
        }
        
        const randomId = available[Math.floor(Math.random() * available.length)];
        this.tryCast(randomId);
        
        return randomId;
    }
    
    /**
     * Obtener habilidades disponibles (sin cooldown)
     * @param {string[]} allowedIds - Filtrar por IDs (opcional)
     * @returns {string[]} IDs de habilidades disponibles
     */
    getAvailableAbilities(allowedIds = null) {
        const available = [];
        
        for (const [id, ability] of this.abilities) {
            if (!ability.isOnCooldown && !ability.isCasting) {
                if (!allowedIds || allowedIds.includes(id)) {
                    available.push(id);
                }
            }
        }
        
        return available;
    }
    
    /**
     * Obtener todas las habilidades en cooldown
     * @returns {string[]} IDs en cooldown
     */
    getAbilitiesOnCooldown() {
        const onCooldown = [];
        
        for (const [id, ability] of this.abilities) {
            if (ability.isOnCooldown) {
                onCooldown.push(id);
            }
        }
        
        return onCooldown;
    }
    
    /**
     * Actualizar sistema de habilidades
     * @param {number} deltaTime - Tiempo en ms
     */
    update(deltaTime) {
        // Actualizar todas las habilidades
        for (const ability of this.abilities.values()) {
            ability.update(deltaTime);
        }
        
        // Procesar cola de habilidades
        if (this.activeAbility === null && this.abilityQueue.length > 0) {
            const nextId = this.abilityQueue.shift();
            this.tryCast(nextId);
        }
    }
    
    /**
     * Obtener habilidad por ID
     * @param {string} abilityId - ID de la habilidad
     * @returns {BossAbility|null}
     */
    getAbility(abilityId) {
        return this.abilities.get(abilityId) || null;
    }
    
    /**
     * Obtener todas las habilidades
     * @returns {Map<string, BossAbility>}
     */
    getAllAbilities() {
        return this.abilities;
    }
    
    /**
     * Resetear todas las habilidades
     */
    resetAll() {
        for (const ability of this.abilities.values()) {
            ability.reset();
        }
        
        this.activeAbility = null;
        this.abilityQueue = [];
    }
    
    /**
     * Forzar cooldown en una habilidad
     * @param {string} abilityId - ID de la habilidad
     * @param {number} duration - Duración en ms
     */
    forceCooldown(abilityId, duration) {
        const ability = this.abilities.get(abilityId);
        
        if (ability) {
            ability.triggerCooldown();
            ability.currentCooldown = duration;
        }
    }
    
    /**
     * Cancelar cast actual
     */
    cancelCurrentCast() {
        if (this.activeAbility) {
            this.activeAbility.isCasting = false;
            this.activeAbility = null;
            
            this.emit('castCancelled', {
                boss: this.boss
            });
        }
    }
    
    /**
     * Obtener estadísticas del sistema
     * @returns {Object}
     */
    getStats() {
        return {
            ...this.stats,
            totalAbilities: this.abilities.size,
            availableCount: this.getAvailableAbilities().length,
            queueLength: this.abilityQueue.length
        };
    }
    
    /**
     * Serializar estado completo
     * @returns {Object}
     */
    serialize() {
        const abilitiesData = {};
        
        for (const [id, ability] of this.abilities) {
            abilitiesData[id] = ability.serialize();
        }
        
        return {
            abilities: abilitiesData,
            activeAbility: this.activeAbility?.id || null,
            queue: [...this.abilityQueue],
            stats: this.stats
        };
    }
    
    /**
     * Cargar estado completo
     * @param {Object} data - Datos serializados
     */
    deserialize(data) {
        this.resetAll();
        
        if (data.abilities) {
            for (const [id, abilityData] of Object.entries(data.abilities)) {
                const ability = this.abilities.get(id);
                if (ability) {
                    ability.deserialize(abilityData);
                }
            }
        }
        
        this.abilityQueue = data.queue || [];
        
        if (data.activeAbility) {
            const ability = this.abilities.get(data.activeAbility);
            if (ability && ability.isCasting) {
                this.activeAbility = ability;
            }
        }
    }
}

export { BossAbility, BossAbilitySystem };
