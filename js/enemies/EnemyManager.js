/**
 * @fileoverview Gestor de Enemigos - Manejo optimizado de cientos de enemigos
 * @module enemies/EnemyManager
 */

import { Enemy, EnemyState } from './Enemy.js';
import { EnemyConfig, getEnemyType, createEnemyConfig } from '../../config/enemyConfig.js';

/**
 * Clase EnemyManager - Gestiona todos los enemigos del juego
 * Implementa Object Pool para optimización de rendimiento
 */
export class EnemyManager {
    /**
     * Crea una instancia de EnemyManager
     */
    constructor() {
        // Lista de enemigos activos
        this.enemies = [];
        
        // Object Pool para reutilización
        this.pool = [];
        this.poolSize = 0;
        
        // Enemigos marcados para eliminación
        this.toRemove = [];
        
        // Callbacks
        this.onEnemyDeathCallback = null;
        this.onEnemyReachEndCallback = null;
        this.onEnemySpawnCallback = null;
        
        // Estadísticas
        this.stats = {
            totalSpawned: 0,
            totalKilled: 0,
            totalReachedEnd: 0,
            activeCount: 0,
            peakActiveCount: 0
        };
        
        // Configuración de rendimiento
        this.performanceMode = false;
        this.updateBatchSize = EnemyConfig.performanceLimits.updateBatchSize;
        
        // Inicializar pool
        this.initializePool(EnemyConfig.poolConfig.initialSize);
    }
    
    /**
     * Inicializa el object pool con enemigos pre-creados
     * @param {number} initialSize - Cantidad inicial de enemigos en pool
     */
    initializePool(initialSize) {
        const config = getEnemyType('basic');
        
        for (let i = 0; i < initialSize; i++) {
            const enemy = new Enemy(config, 1);
            enemy.resetForPool();
            this.addToPool(enemy);
        }
        
        this.poolSize = initialSize;
    }
    
    /**
     * Añade un enemigo al pool
     * @param {Enemy} enemy - Enemigo a añadir
     */
    addToPool(enemy) {
        if (this.pool.length >= EnemyConfig.poolConfig.maxSize) {
            return; // Pool lleno
        }
        
        enemy._poolNext = this.pool[0] || null;
        if (this.pool[0]) {
            this.pool[0]._poolPrev = enemy;
        }
        this.pool[0] = enemy;
        enemy._inPool = true;
    }
    
    /**
     * Obtiene un enemigo del pool o crea uno nuevo
     * @param {string} type - Tipo de enemigo
     * @param {number} waveNumber - Número de oleada
     * @returns {Enemy|null} Enemigo o null si no se puede crear
     */
    getFromPool(type, waveNumber = 1) {
        let enemy = null;
        
        // Buscar en el pool un enemigo del tipo correcto o cualquier enemigo libre
        for (let i = 0; i < this.pool.length; i++) {
            const pooled = this.pool[i];
            if (pooled && pooled._inPool) {
                enemy = pooled;
                
                // Remover del pool
                if (enemy._poolPrev) {
                    enemy._poolPrev._poolNext = enemy._poolNext;
                } else {
                    this.pool[0] = enemy._poolNext;
                }
                
                if (enemy._poolNext) {
                    enemy._poolNext._poolPrev = enemy._poolPrev;
                }
                
                enemy._poolNext = null;
                enemy._poolPrev = null;
                break;
            }
        }
        
        // Si no hay en pool, crear nuevo (si no excedemos límite)
        if (!enemy) {
            if (this.poolSize >= EnemyConfig.poolConfig.maxSize) {
                return null; // Límite alcanzado
            }
            
            const config = getEnemyType(type) || getEnemyType('basic');
            enemy = new Enemy(config, waveNumber);
            this.poolSize++;
        } else {
            // Reconfigurar para el tipo solicitado
            const config = getEnemyType(type) || getEnemyType('basic');
            enemy.type = type;
            enemy.baseMaxHealth = config.maxHealth;
            enemy.baseSpeed = config.speed;
            enemy.baseDefense = config.defense;
            enemy.baseDamage = config.damage;
            enemy.baseReward = config.reward;
            enemy.width = config.width;
            enemy.height = config.height;
            enemy.animations = config.animations;
            enemy.applyWaveScaling(waveNumber);
        }
        
        enemy.activateFromPool();
        return enemy;
    }
    
    /**
     * Spawnea un enemigo en el mapa
     * @param {string} type - Tipo de enemigo
     * @param {number} x - Posición X inicial
     * @param {number} y - Posición Y inicial
     * @param {Array<{x: number, y: number}>} path - Camino a seguir
     * @param {number} [waveNumber=1] - Número de oleada
     * @returns {Enemy|null} Enemigo creado o null
     */
    spawnEnemy(type, x, y, path, waveNumber = 1) {
        // Verificar límite de enemigos activos
        const maxEnemies = EnemyConfig.performanceLimits.maxActiveEnemies;
        if (this.enemies.length >= maxEnemies) {
            console.warn('Límite de enemigos activos alcanzado:', maxEnemies);
            return null;
        }
        
        const enemy = this.getFromPool(type, waveNumber);
        if (!enemy) {
            return null;
        }
        
        // Configurar callbacks
        enemy.onDeathCallback = (e, killer) => this.onEnemyDeath(e, killer);
        enemy.onReachEndCallback = (e) => this.onEnemyReachEnd(e);
        
        // Spawnear
        enemy.spawn(x, y, path);
        
        // Añadir a lista activa
        this.enemies.push(enemy);
        
        // Actualizar estadísticas
        this.stats.totalSpawned++;
        this.stats.activeCount = this.enemies.length;
        this.stats.peakActiveCount = Math.max(this.stats.peakActiveCount, this.stats.activeCount);
        
        // Callback
        if (this.onEnemySpawnCallback) {
            this.onEnemySpawnCallback(enemy);
        }
        
        return enemy;
    }
    
    /**
     * Spawnea múltiples enemigos de una vez
     * @param {Array<Object>} enemies - Array de {type, x, y, path}
     * @param {number} [waveNumber=1] - Número de oleada
     * @returns {Array<Enemy>} Enemigos creados
     */
    spawnMultiple(enemies, waveNumber = 1) {
        const spawned = [];
        
        for (const enemyData of enemies) {
            const enemy = this.spawnEnemy(
                enemyData.type,
                enemyData.x,
                enemyData.y,
                enemyData.path || [],
                waveNumber
            );
            
            if (enemy) {
                spawned.push(enemy);
            }
        }
        
        return spawned;
    }
    
    /**
     * Actualiza todos los enemigos
     * @param {number} deltaTime - Tiempo delta en segundos
     */
    update(deltaTime) {
        // Actualizar enemigos en batches si está en performance mode
        const batchSize = this.performanceMode ? this.updateBatchSize : this.enemies.length;
        let updated = 0;
        
        for (let i = this.enemies.length - 1; i >= 0; i--) {
            const enemy = this.enemies[i];
            
            if (!enemy.isRemoving) {
                enemy.update(deltaTime);
                updated++;
                
                // Limitar actualizaciones por frame en performance mode
                if (this.performanceMode && updated >= batchSize) {
                    break;
                }
            }
        }
        
        // Eliminar enemigos muertos o que llegaron al final
        this.cleanupRemovedEnemies();
    }
    
    /**
     * Limpia los enemigos marcados para eliminación
     */
    cleanupRemovedEnemies() {
        for (let i = this.enemies.length - 1; i >= 0; i--) {
            const enemy = this.enemies[i];
            
            if (enemy.isRemoving) {
                // Devolver al pool
                enemy.resetForPool();
                this.addToPool(enemy);
                
                // Remover de lista activa
                this.enemies.splice(i, 1);
            }
        }
        
        this.stats.activeCount = this.enemies.length;
    }
    
    /**
     * Callback cuando un enemigo muere
     * @param {Enemy} enemy - Enemigo muerto
     * @param {Object} [killer] - Entidad que lo mató
     */
    onEnemyDeath(enemy, killer) {
        this.stats.totalKilled++;
        
        if (this.onEnemyDeathCallback) {
            this.onEnemyDeathCallback(enemy, killer);
        }
    }
    
    /**
     * Callback cuando un enemigo llega al final del camino
     * @param {Enemy} enemy - Enemigo que llegó
     */
    onEnemyReachEnd(enemy) {
        this.stats.totalReachedEnd++;
        
        if (this.onEnemyReachEndCallback) {
            this.onEnemyReachEndCallback(enemy);
        }
    }
    
    /**
     * Obtiene todos los enemigos activos
     * @returns {Array<Enemy>} Lista de enemigos
     */
    getAllEnemies() {
        return this.enemies;
    }
    
    /**
     * Obtiene enemigos dentro de un radio
     * @param {number} x - Centro X
     * @param {number} y - Centro Y
     * @param {number} radius - Radio de búsqueda
     * @returns {Array<Enemy>} Enemigos en rango
     */
    getEnemiesInRadius(x, y, radius) {
        const radiusSq = radius * radius;
        const result = [];
        
        for (const enemy of this.enemies) {
            if (enemy.isDead || enemy.isRemoving) continue;
            
            const dx = (enemy.x + enemy.width / 2) - x;
            const dy = (enemy.y + enemy.height / 2) - y;
            const distSq = dx * dx + dy * dy;
            
            if (distSq <= radiusSq) {
                result.push(enemy);
            }
        }
        
        return result;
    }
    
    /**
     * Obtiene enemigos en un rectángulo
     * @param {number} x - Esquina superior izquierda X
     * @param {number} y - Esquina superior izquierda Y
     * @param {number} width - Ancho del rectángulo
     * @param {number} height - Alto del rectángulo
     * @returns {Array<Enemy>} Enemigos en el área
     */
    getEnemiesInRect(x, y, width, height) {
        const result = [];
        
        for (const enemy of this.enemies) {
            if (enemy.isDead || enemy.isRemoving) continue;
            
            if (enemy.x < x + width &&
                enemy.x + enemy.width > x &&
                enemy.y < y + height &&
                enemy.y + enemy.height > y) {
                result.push(enemy);
            }
        }
        
        return result;
    }
    
    /**
     * Aplica daño en área
     * @param {number} x - Centro X
     * @param {number} y - Centro Y
     * @param {number} radius - Radio de efecto
     * @param {number} damage - Daño a infligir
     * @param {Object} [options] - Opciones de daño
     * @returns {number} Cantidad de enemigos afectados
     */
    applyAreaDamage(x, y, radius, damage, options = {}) {
        const enemies = this.getEnemiesInRadius(x, y, radius);
        let affected = 0;
        
        for (const enemy of enemies) {
            const dealtDamage = enemy.takeDamage(damage, options);
            if (dealtDamage > 0) {
                affected++;
            }
        }
        
        return affected;
    }
    
    /**
     * Aplica un efecto en área
     * @param {number} x - Centro X
     * @param {number} y - Centro Y
     * @param {number} radius - Radio de efecto
     * @param {string} effectType - Tipo de efecto
     * @param {Object} params - Parámetros del efecto
     * @returns {number} Cantidad de enemigos afectados
     */
    applyAreaEffect(x, y, radius, effectType, params) {
        const enemies = this.getEnemiesInRadius(x, y, radius);
        
        for (const enemy of enemies) {
            enemy.applyEffect(effectType, params);
        }
        
        return enemies.length;
    }
    
    /**
     * Obtiene el enemigo más cercano a un punto
     * @param {number} x - Punto X
     * @param {number} y - Punto Y
     * @returns {Enemy|null} Enemigo más cercano o null
     */
    getClosestEnemy(x, y) {
        let closest = null;
        let closestDistSq = Infinity;
        
        for (const enemy of this.enemies) {
            if (enemy.isDead || enemy.isRemoving) continue;
            
            const dx = (enemy.x + enemy.width / 2) - x;
            const dy = (enemy.y + enemy.height / 2) - y;
            const distSq = dx * dx + dy * dy;
            
            if (distSq < closestDistSq) {
                closestDistSq = distSq;
                closest = enemy;
            }
        }
        
        return closest;
    }
    
    /**
     * Obtiene el enemigo con más vida en un radio
     * @param {number} x - Centro X
     * @param {number} y - Centro Y
     * @param {number} radius - Radio
     * @returns {Enemy|null} Enemigo con más vida o null
     */
    getEnemyWithMostHealthInRadius(x, y, radius) {
        const enemies = this.getEnemiesInRadius(x, y, radius);
        
        if (enemies.length === 0) return null;
        
        return enemies.reduce((max, enemy) => 
            enemy.currentHealth > max.currentHealth ? enemy : max
        , enemies[0]);
    }
    
    /**
     * Habilita el modo performance (actualización por batches)
     * @param {boolean} enabled - True para habilitar
     */
    setPerformanceMode(enabled) {
        this.performanceMode = enabled;
    }
    
    /**
     * Establece el callback de muerte de enemigo
     * @param {Function} callback - Función a llamar
     */
    setOnEnemyDeathCallback(callback) {
        this.onEnemyDeathCallback = callback;
    }
    
    /**
     * Establece el callback de enemigo que llega al final
     * @param {Function} callback - Función a llamar
     */
    setOnEnemyReachEndCallback(callback) {
        this.onEnemyReachEndCallback = callback;
    }
    
    /**
     * Establece el callback de spawn de enemigo
     * @param {Function} callback - Función a llamar
     */
    setOnEnemySpawnCallback(callback) {
        this.onEnemySpawnCallback = callback;
    }
    
    /**
     * Obtiene las estadísticas del gestor
     * @returns {Object} Estadísticas
     */
    getStats() {
        return { ...this.stats };
    }
    
    /**
     * Resetea todas las estadísticas
     */
    resetStats() {
        this.stats = {
            totalSpawned: 0,
            totalKilled: 0,
            totalReachedEnd: 0,
            activeCount: 0,
            peakActiveCount: 0
        };
    }
    
    /**
     * Elimina todos los enemigos activos
     * @param {boolean} returnToPool - True para devolver al pool
     */
    clearAll(returnToPool = true) {
        for (const enemy of this.enemies) {
            if (returnToPool) {
                enemy.resetForPool();
                this.addToPool(enemy);
            }
        }
        
        this.enemies = [];
        this.stats.activeCount = 0;
    }
    
    /**
     * Renderiza la barra de vida de un enemigo (helper para canvas)
     * @param {CanvasRenderingContext2D} ctx - Contexto de canvas
     * @param {Enemy} enemy - Enemigo a renderizar
     */
    renderHealthBar(ctx, enemy) {
        if (!enemy.showHealthBar || enemy.isDead) return;
        
        const barX = enemy.x - 4;
        const barY = enemy.y + enemy.healthBarOffsetY;
        const barWidth = enemy.healthBarWidth;
        const barHeight = enemy.healthBarHeight;
        
        // Fondo (rojo)
        ctx.fillStyle = '#330000';
        ctx.fillRect(barX, barY, barWidth, barHeight);
        
        // Vida actual (verde a rojo según porcentaje)
        const healthPercent = enemy.getHealthPercent();
        const r = Math.floor(255 * (1 - healthPercent));
        const g = Math.floor(255 * healthPercent);
        ctx.fillStyle = `rgb(${r}, ${g}, 0)`;
        ctx.fillRect(barX + 1, barY + 1, (barWidth - 2) * healthPercent, barHeight - 2);
        
        // Borde
        ctx.strokeStyle = '#000';
        ctx.lineWidth = 1;
        ctx.strokeRect(barX, barY, barWidth, barHeight);
    }
}

export default EnemyManager;
