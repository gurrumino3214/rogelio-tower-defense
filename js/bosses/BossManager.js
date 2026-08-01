/**
 * BossManager.js - Gestor de bosses
 * Maneja spawneo, actualización y eventos de bosses
 * 
 * @module bosses/BossManager
 */

import { EventEmitter } from '../utils/EventEmitter.js';
import { Boss } from './Boss.js';
import { BossRegistry } from './BossTypes.js';

/**
 * Gestiona todos los bosses activos en el juego
 */
class BossManager extends EventEmitter {
    /**
     * @param {Object} options - Opciones de configuración
     */
    constructor(options = {}) {
        super();
        
        this.bosses = new Map();
        this.activeBoss = null; // Boss principal actual
        this.bossQueue = []; // Cola de bosses pendientes
        
        // Configuración
        this.config = {
            maxConcurrentBosses: options.maxConcurrentBosses || 1,
            enableCinematics: options.enableCinematics !== false,
            debugMode: options.debugMode || false
        };
        
        // Estado del sistema
        this.isBossActive = false;
        this.bossSpawned = false;
        this.lastBossDefeated = null;
        
        // Estadísticas
        this.stats = {
            totalBossesSpawned: 0,
            totalBossesDefeated: 0,
            totalTimeInBossFight: 0,
            bossFightStartTime: 0
        };
        
        console.log('[BossManager] Inicializado');
    }
    
    /**
     * Registrar un boss para aparecer más tarde
     * @param {string} bossId - ID del boss
     * @param {Object} spawnData - Datos de aparición
     */
    queueBoss(bossId, spawnData = {}) {
        if (!BossRegistry.exists(bossId)) {
            console.warn(`[BossManager] Boss no registrado: ${bossId}`);
            return false;
        }
        
        this.bossQueue.push({
            bossId,
            spawnData,
            queuedAt: Date.now()
        });
        
        console.log(`[BossManager] Boss en cola: ${bossId}`);
        return true;
    }
    
    /**
     * Spawnear un boss inmediatamente
     * @param {string} bossId - ID del boss
     * @param {number} x - Posición X
     * @param {number} y - Posición Y
     * @param {Object} options - Opciones adicionales
     * @returns {Boss|null} Instancia del boss o null
     */
    spawnBoss(bossId, x, y, options = {}) {
        if (!BossRegistry.exists(bossId)) {
            console.error(`[BossManager] Boss no existe: ${bossId}`);
            return null;
        }
        
        // Verificar límite de bosses concurrentes
        if (this.bosses.size >= this.config.maxConcurrentBosses) {
            console.warn('[BossManager] Límite de bosses concurrentes alcanzado');
            return null;
        }
        
        try {
            // Crear instancia del boss
            const boss = new Boss(bossId, x, y);
            
            // Configurar event listeners
            this.setupBossListeners(boss);
            
            // Añadir al mapa
            this.bosses.set(bossId, boss);
            
            // Actualizar estado
            if (!this.activeBoss) {
                this.activeBoss = boss;
            }
            this.isBossActive = true;
            this.bossSpawned = true;
            
            // Actualizar estadísticas
            this.stats.totalBossesSpawned++;
            this.stats.bossFightStartTime = Date.now();
            
            // Spawnear
            boss.spawn();
            
            console.log(`[BossManager] Boss spawned: ${boss.name}`);
            
            this.emit('bossSpawn', {
                boss,
                bossId,
                position: { x, y }
            });
            
            return boss;
            
        } catch (error) {
            console.error(`[BossManager] Error spawning boss:`, error);
            return null;
        }
    }
    
    /**
     * Configurar listeners para un boss
     * @param {Boss} boss - Instancia del boss
     */
    setupBossListeners(boss) {
        // Daño recibido
        boss.on('damageTaken', (data) => {
            this.emit('bossDamage', {
                boss,
                ...data
            });
            
            // Actualizar UI de vida
            this.emit('healthUpdate', {
                current: data.remaining,
                max: boss.stats.maxHealth,
                percent: data.percent
            });
        });
        
        // Muerte del boss
        boss.on('death', () => {
            this.onBossDeath(boss);
        });
        
        // Cambio de fase
        boss.stateMachine.on('phaseTransitionComplete', (data) => {
            this.emit('phaseChange', {
                boss,
                phase: data.phase,
                phaseIndex: data.phaseIndex
            });
        });
        
        // Invocación de enemigos
        boss.on('spawnEnemies', (data) => {
            this.emit('bossSpawnMinions', data);
        });
        
        // Eventos generales
        boss.on('event', (data) => {
            this.emit('bossEvent', {
                boss,
                ...data
            });
        });
        
        // Sonidos
        boss.on('playSound', (data) => {
            this.emit('playBossSound', data);
        });
        
        // Screen shake
        boss.on('screenShake', (data) => {
            this.emit('screenShake', data);
        });
    }
    
    /**
     * Callback cuando un boss muere
     * @param {Boss} boss - Boss que murió
     */
    onBossDeath(boss) {
        console.log(`[BossManager] Boss defeated: ${boss.name}`);
        
        // Actualizar estadísticas
        this.stats.totalBossesDefeated++;
        this.stats.totalTimeInBossFight += Date.now() - this.stats.bossFightStartTime;
        this.lastBossDefeated = boss.getInfo();
        
        // Emitir evento
        this.emit('bossDefeated', {
            boss,
            bossInfo: boss.getInfo(),
            stats: this.getStats()
        });
        
        // Limpiar boss
        this.removeBoss(boss.id);
        
        // Verificar si hay más bosses en cola
        if (this.bossQueue.length > 0) {
            const next = this.bossQueue.shift();
            setTimeout(() => {
                this.spawnBoss(next.bossId, next.spawnData.x || 400, next.spawnData.y || 300);
            }, 3000); // Esperar 3 segundos antes del siguiente boss
        } else {
            // No hay más bosses
            this.isBossActive = false;
            this.emit('bossWaveComplete', {});
        }
    }
    
    /**
     * Eliminar un boss del gestor
     * @param {string} bossId - ID del boss
     */
    removeBoss(bossId) {
        const boss = this.bosses.get(bossId);
        
        if (boss) {
            // Remover listeners
            boss.removeAllListeners();
            
            // Remover del mapa
            this.bosses.delete(bossId);
            
            // Limpiar activeBoss si era este
            if (this.activeBoss === boss) {
                this.activeBoss = null;
                
                // Buscar nuevo activeBoss
                for (const b of this.bosses.values()) {
                    if (b.isAlive) {
                        this.activeBoss = b;
                        break;
                    }
                }
            }
            
            // Si no quedan bosses vivos
            if (this.bosses.size === 0) {
                this.isBossActive = false;
            }
            
            console.log(`[BossManager] Boss removed: ${bossId}`);
        }
    }
    
    /**
     * Actualizar todos los bosses
     * @param {number} deltaTime - Tiempo en ms
     */
    update(deltaTime) {
        // Actualizar bosses activos
        for (const boss of this.bosses.values()) {
            if (boss.isAlive || boss.stateMachine.isInState('dying')) {
                boss.update(deltaTime);
            }
        }
        
        // Limpiar bosses muertos completamente
        for (const [id, boss] of this.bosses) {
            if (!boss.isAlive && boss.stateMachine.isInState('dead')) {
                // Boss completó animación de muerte
                // Se mantiene para loot/cinemática pero no se actualiza
            }
        }
    }
    
    /**
     * Obtener boss por ID
     * @param {string} bossId - ID del boss
     * @returns {Boss|null}
     */
    getBoss(bossId) {
        return this.bosses.get(bossId) || null;
    }
    
    /**
     * Obtener boss activo principal
     * @returns {Boss|null}
     */
    getActiveBoss() {
        return this.activeBoss;
    }
    
    /**
     * Verificar si hay boss activo
     * @returns {boolean}
     */
    hasActiveBoss() {
        return this.isBossActive && this.activeBoss !== null;
    }
    
    /**
     * Obtener todos los bosses
     * @returns {Boss[]}
     */
    getAllBosses() {
        return Array.from(this.bosses.values());
    }
    
    /**
     * Obtener bosses vivos
     * @returns {Boss[]}
     */
    getLivingBosses() {
        return this.getAllBosses().filter(b => b.isAlive);
    }
    
    /**
     * Obtener estadísticas del sistema
     * @returns {Object}
     */
    getStats() {
        return {
            ...this.stats,
            activeBossCount: this.bosses.size,
            livingBossCount: this.getLivingBosses().length,
            queuedBossCount: this.bossQueue.length
        };
    }
    
    /**
     * Forzar cambio de fase en boss activo
     * @param {number} phaseIndex - Índice de fase
     */
    forcePhaseChange(phaseIndex) {
        if (!this.activeBoss) return;
        
        this.activeBoss.stateMachine.beginPhaseTransition(phaseIndex);
        
        console.log(`[BossManager] Forced phase change to ${phaseIndex}`);
    }
    
    /**
     * Aplicar daño a todos los bosses
     * @param {number} amount - Cantidad de daño
     * @param {Object} options - Opciones
     */
    damageAllBosses(amount, options = {}) {
        let totalDamage = 0;
        
        for (const boss of this.getLivingBosses()) {
            if (boss.takeDamage(amount, options)) {
                totalDamage += amount;
            }
        }
        
        return totalDamage;
    }
    
    /**
     * Stunear todos los bosses
     * @param {number} duration - Duración en ms
     */
    stunAllBosses(duration) {
        for (const boss of this.getLivingBosses()) {
            boss.applyStun(duration);
        }
        
        console.log(`[BossManager] All bosses stunned for ${duration}ms`);
    }
    
    /**
     * Resetear gestor para nueva partida
     */
    reset() {
        // Eliminar todos los bosses
        for (const bossId of this.bosses.keys()) {
            this.removeBoss(bossId);
        }
        
        // Limpiar cola
        this.bossQueue = [];
        
        // Resetear estado
        this.isBossActive = false;
        this.bossSpawned = false;
        this.activeBoss = null;
        this.lastBossDefeated = null;
        
        // Mantener estadísticas acumuladas
        
        console.log('[BossManager] Reset complete');
    }
    
    /**
     * Serializar estado completo
     * @returns {Object}
     */
    serialize() {
        const bossesData = {};
        
        for (const [id, boss] of this.bosses) {
            bossesData[id] = boss.serialize();
        }
        
        return {
            bosses: bossesData,
            activeBossId: this.activeBoss?.id || null,
            queue: [...this.bossQueue],
            isBossActive: this.isBossActive,
            stats: this.stats
        };
    }
    
    /**
     * Cargar estado desde serialización
     * @param {Object} data - Datos serializados
     */
    deserialize(data) {
        this.reset();
        
        // Restaurar bosses
        for (const [id, bossData] of Object.entries(data.bosses || {})) {
            const boss = new Boss(id, bossData.position?.x || 0, bossData.position?.y || 0);
            boss.deserialize(bossData);
            this.setupBossListeners(boss);
            this.bosses.set(id, boss);
        }
        
        // Restaurar activeBoss
        if (data.activeBossId && this.bosses.has(data.activeBossId)) {
            this.activeBoss = this.bosses.get(data.activeBossId);
        }
        
        // Restaurar cola
        this.bossQueue = data.queue || [];
        
        // Restaurar estado
        this.isBossActive = data.isBossActive || false;
        this.stats = { ...this.stats, ...data.stats };
    }
    
    /**
     * Habilitar modo debug
     * @param {boolean} enabled
     */
    setDebugMode(enabled) {
        this.config.debugMode = enabled;
        
        for (const boss of this.bosses.values()) {
            boss.stateMachine.setDebugMode(enabled);
        }
    }
}

// Singleton instance
let instance = null;

/**
 * Obtener instancia singleton del BossManager
 * @param {Object} options - Opciones
 * @returns {BossManager}
 */
function getBossManager(options = {}) {
    if (!instance) {
        instance = new BossManager(options);
    }
    return instance;
}

export { BossManager, getBossManager };
