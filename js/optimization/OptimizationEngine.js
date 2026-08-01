/**
 * ========================================
 * OPTIMIZATION_ENGINE.JS - Motor de Optimización
 * ========================================
 * Sistema central que integra todas las optimizaciones:
 * - Object Pooling para enemigos, proyectiles y partículas
 * - QuadTree para colisiones eficientes
 * - Frustum Culling para renderizado
 * - Eliminación automática de objetos fuera de rango
 * - Reutilización de memoria
 * - Optimización del loop principal
 * 
 * Diseñado para soportar cientos de entidades manteniendo 60 FPS.
 */

class OptimizationEngine {
    /**
     * Crea el motor de optimización
     * @param {Object} config - Configuración del sistema
     */
    constructor(config = {}) {
        // Configuración
        this.config = {
            // Límites de entidades
            maxEnemies: config.maxEnemies || 500,
            maxProjectiles: config.maxProjectiles || 1000,
            maxParticles: config.maxParticles || 2000,
            maxTowers: config.maxTowers || 50,
            
            // Umbrales de rendimiento
            fpsTarget: config.fpsTarget || 60,
            entityUpdateBatchSize: config.entityUpdateBatchSize || 100,
            
            // Auto-eliminación
            autoRemoveOffscreen: config.autoRemoveOffscreen !== false,
            offscreenRemoveDelay: config.offscreenRemoveDelay || 5000,
            
            // QuadTree
            quadTreeMaxObjects: config.quadTreeMaxObjects || 10,
            quadTreeMaxLevels: config.quadTreeMaxLevels || 5,
            
            // Pool sizes
            enemyPoolSize: config.enemyPoolSize || 100,
            projectilePoolSize: config.projectilePoolSize || 200,
            particlePoolSize: config.particlePoolSize || 500,
            
            // Debug
            debugMode: config.debugMode || false
        };
        
        // Referencias a sistemas (se inicializan después)
        this.enemyManager = null;
        this.projectileManager = null;
        this.particleSystem = null;
        this.towerManager = null;
        
        // QuadTree para colisiones espaciales
        this.spatialIndex = null;
        
        // Frustum culling bounds
        this.frustumBounds = {
            x: 0,
            y: 0,
            width: 800,
            height: 600
        };
        
        // Objetos marcados para eliminación
        this.pendingRemovals = {
            enemies: new Set(),
            projectiles: new Set(),
            particles: new Set()
        };
        
        // Estadísticas de rendimiento
        this.performanceStats = {
            frameTime: 0,
            updateTime: 0,
            renderTime: 0,
            collisionTime: 0,
            entityCount: 0,
            activeCollisions: 0,
            culledEntities: 0,
            pooledObjects: 0
        };
        
        // Temporizadores
        this.lastFrameTime = 0;
        this.frameHistory = [];
        this.frameHistorySize = 60;
        
        // Estado
        this.isInitialized = false;
        this.performanceMode = false;
    }
    
    /**
     * Inicializa el motor de optimización
     * @param {Object} systems - Referencias a los sistemas del juego
     */
    initialize(systems) {
        if (this.isInitialized) {
            console.warn('OptimizationEngine already initialized');
            return;
        }
        
        // Guardar referencias
        this.enemyManager = systems.enemyManager || null;
        this.projectileManager = systems.projectileManager || null;
        this.particleSystem = systems.particleSystem || null;
        this.towerManager = systems.towerManager || null;
        
        // Inicializar QuadTree
        this.initializeSpatialIndex();
        
        // Configurar frustum bounds iniciales
        if (systems.engine) {
            this.frustumBounds.width = systems.engine.width || 800;
            this.frustumBounds.height = systems.engine.height || 600;
        }
        
        this.isInitialized = true;
        console.log('OptimizationEngine initialized');
    }
    
    /**
     * Inicializa el índice espacial (QuadTree)
     */
    initializeSpatialIndex() {
        if (typeof QuadTree !== 'undefined') {
            this.spatialIndex = new QuadTree(
                {
                    x: 0,
                    y: 0,
                    width: this.frustumBounds.width * 2,
                    height: this.frustumBounds.height * 2
                },
                this.config.quadTreeMaxObjects,
                this.config.quadTreeMaxLevels
            );
        }
    }
    
    /**
     * Actualiza el índice espacial con las entidades actuales
     */
    updateSpatialIndex() {
        if (!this.spatialIndex) return;
        
        // Limpiar índice anterior
        this.spatialIndex.clear();
        
        // Insertar enemigos
        if (this.enemyManager && this.enemyManager.enemies) {
            for (const enemy of this.enemyManager.enemies) {
                if (enemy.active && !enemy.isDead) {
                    this.spatialIndex.insert({
                        x: enemy.x,
                        y: enemy.y,
                        width: enemy.width,
                        height: enemy.height,
                        entity: enemy,
                        type: 'enemy'
                    });
                }
            }
        }
        
        // Insertar torres
        if (this.towerManager && this.towerManager.towers) {
            for (const tower of this.towerManager.towers) {
                if (tower.active) {
                    this.spatialIndex.insert({
                        x: tower.x,
                        y: tower.y,
                        width: tower.width,
                        height: tower.height,
                        entity: tower,
                        type: 'tower'
                    });
                }
            }
        }
    }
    
    /**
     * Consulta entidades en un área usando QuadTree
     * @param {Object} area - Área de consulta {x, y, width, height}
     * @param {string} [typeFilter] - Filtrar por tipo ('enemy', 'tower')
     * @returns {Array<Object>} Entidades encontradas
     */
    querySpatial(area, typeFilter = null) {
        if (!this.spatialIndex) return [];
        
        const results = this.spatialIndex.query(area);
        
        if (typeFilter) {
            return results.filter(r => r.type === typeFilter).map(r => r.entity);
        }
        
        return results.map(r => r.entity);
    }
    
    /**
     * Obtiene enemigos en un radio usando QuadTree
     * @param {number} x - Centro X
     * @param {number} y - Centro Y
     * @param {number} radius - Radio
     * @returns {Array<Object>} Enemigos en rango
     */
    getEnemiesInRadius(x, y, radius) {
        const area = {
            x: x - radius,
            y: y - radius,
            width: radius * 2,
            height: radius * 2
        };
        
        return this.querySpatial(area, 'enemy');
    }
    
    /**
     * Aplica frustum culling a una entidad
     * @param {Object} entity - Entidad a verificar
     * @param {Object} [bounds] - Límites del frustum (opcional)
     * @returns {boolean} True si está dentro del frustum
     */
    isInFrustum(entity, bounds = null) {
        const fb = bounds || this.frustumBounds;
        const margin = 100; // Margen extra para evitar pop-in
        
        return entity.x + entity.width > fb.x - margin &&
               entity.x < fb.x + fb.width + margin &&
               entity.y + entity.height > fb.y - margin &&
               entity.y < fb.y + fb.height + margin;
    }
    
    /**
     * Marca una entidad para eliminación diferida
     * @param {Object} entity - Entidad a eliminar
     * @param {string} type - Tipo de entidad ('enemy', 'projectile', 'particle')
     * @param {number} [delay=0] - Delay en ms antes de eliminar
     */
    markForRemoval(entity, type, delay = 0) {
        if (!this.pendingRemovals[type]) return;
        
        if (delay > 0) {
            setTimeout(() => {
                this.pendingRemovals[type].add(entity);
            }, delay);
        } else {
            this.pendingRemovals[type].add(entity);
        }
    }
    
    /**
     * Procesa las eliminaciones pendientes
     */
    processRemovals() {
        // Eliminar enemigos
        if (this.enemyManager) {
            for (const enemy of this.pendingRemovals.enemies) {
                if (enemy.isDead || enemy.isRemoving) {
                    // Ya está marcado, el EnemyManager lo manejará
                }
            }
            this.pendingRemovals.enemies.clear();
        }
        
        // Eliminar proyectiles
        if (this.projectileManager && this.projectileManager回收Projectile) {
            const active = this.projectileManager.activeProjectiles;
            for (let i = active.length - 1; i >= 0; i--) {
                if (this.pendingRemovals.projectiles.has(active[i])) {
                    this.projectileManager回收Projectile(i);
                }
            }
            this.pendingRemovals.projectiles.clear();
        }
        
        // Eliminar partículas
        if (this.particleSystem) {
            // Las partículas se manejan automáticamente
            this.pendingRemovals.particles.clear();
        }
    }
    
    /**
     * Actualiza las estadísticas de rendimiento
     * @param {number} deltaTime - Delta time del frame
     */
    updatePerformanceStats(deltaTime) {
        this.performanceStats.frameTime = deltaTime * 1000;
        
        // Mantener historial de frames
        this.frameHistory.push(deltaTime * 1000);
        if (this.frameHistory.length > this.frameHistorySize) {
            this.frameHistory.shift();
        }
        
        // Calcular promedio móvil
        const avgFrameTime = this.frameHistory.reduce((a, b) => a + b, 0) / this.frameHistory.length;
        this.performanceStats.avgFrameTime = avgFrameTime;
        this.performanceStats.fps = 1000 / avgFrameTime;
        
        // Contar entidades activas
        this.performanceStats.entityCount = 0;
        this.performanceStats.pooledObjects = 0;
        
        if (this.enemyManager) {
            this.performanceStats.entityCount += this.enemyManager.enemies.length;
            this.performanceStats.pooledObjects += (this.enemyManager.pool?.length || 0);
        }
        
        if (this.projectileManager) {
            this.performanceStats.entityCount += this.projectileManager.activeProjectiles.length;
            this.performanceStats.pooledObjects += (this.projectileManager.projectilePool?.length || 0);
        }
        
        if (this.particleSystem) {
            this.performanceStats.entityCount += (this.particleSystem.particles?.length || 0);
        }
        
        // Detectar modo performance
        this.performanceMode = avgFrameTime > (1000 / this.config.fpsTarget);
    }
    
    /**
     * Optimiza la actualización de entidades usando batching
     * @param {Array} entities - Lista de entidades
     * @param {Function} updateFn - Función de actualización
     * @param {number} dt - Delta time
     * @returns {number} Entidades actualizadas
     */
    updateBatched(entities, updateFn, dt) {
        const batchSize = this.performanceMode ? 
            this.config.entityUpdateBatchSize : 
            entities.length;
        
        let updated = 0;
        for (let i = 0; i < entities.length && updated < batchSize; i++) {
            const entity = entities[i];
            if (entity.active) {
                updateFn(entity, dt);
                updated++;
            }
        }
        
        return updated;
    }
    
    /**
     * Renderiza información de debugging
     * @param {CanvasRenderingContext2D} ctx - Contexto del canvas
     */
    renderDebug(ctx) {
        if (!this.config.debugMode) return;
        
        const x = 10;
        const y = 20;
        const lineHeight = 18;
        
        ctx.fillStyle = 'rgba(0, 0, 0, 0.7)';
        ctx.fillRect(x - 5, y - 15, 220, 140);
        
        ctx.fillStyle = '#00ff00';
        ctx.font = '12px monospace';
        ctx.textAlign = 'left';
        
        ctx.fillText(`FPS: ${this.performanceStats.fps?.toFixed(1) || 'N/A'}`, x, y);
        ctx.fillText(`Frame: ${this.performanceStats.frameTime?.toFixed(2) || 'N/A'}ms`, x, y + lineHeight);
        ctx.fillText(`Entities: ${this.performanceStats.entityCount}`, x, y + lineHeight * 2);
        ctx.fillText(`Pooled: ${this.performanceStats.pooledObjects}`, x, y + lineHeight * 3);
        ctx.fillText(`Perf Mode: ${this.performanceMode ? 'ON' : 'OFF'}`, x, y + lineHeight * 4);
        
        // Renderizar QuadTree
        if (this.spatialIndex && this.config.debugMode === true) {
            this.spatialIndex.render(ctx, 'rgba(0, 255, 0, 0.3)');
        }
        
        // Renderizar frustum bounds
        ctx.strokeStyle = 'rgba(255, 0, 0, 0.5)';
        ctx.lineWidth = 2;
        ctx.strokeRect(
            this.frustumBounds.x,
            this.frustumBounds.y,
            this.frustumBounds.width,
            this.frustumBounds.height
        );
    }
    
    /**
     * Actualiza los límites del frustum
     * @param {Object} bounds - Nuevos límites {x, y, width, height}
     */
    updateFrustumBounds(bounds) {
        this.frustumBounds = { ...bounds };
        
        // Recrear QuadTree con nuevos límites
        if (this.spatialIndex) {
            this.spatialIndex.bounds = {
                x: bounds.x - 100,
                y: bounds.y - 100,
                width: bounds.width + 200,
                height: bounds.height + 200
            };
        }
    }
    
    /**
     * Obtiene estadísticas completas del sistema
     * @returns {Object} Estadísticas
     */
    getStats() {
        const stats = {
            performance: { ...this.performanceStats },
            spatialIndex: this.spatialIndex?.getStats() || null,
            config: { ...this.config }
        };
        
        // Agregar stats de managers
        if (this.enemyManager?.getStats) {
            stats.enemyManager = this.enemyManager.getStats();
        }
        
        if (this.projectileManager?.getStats) {
            stats.projectileManager = this.projectileManager.getStats();
        }
        
        return stats;
    }
    
    /**
     * Habilita o deshabilita el modo debug
     * @param {boolean} enabled - True para habilitar
     */
    setDebugMode(enabled) {
        this.config.debugMode = enabled;
    }
    
    /**
     * Limpia todos los pools y reinicia el sistema
     */
    clear() {
        if (this.spatialIndex) {
            this.spatialIndex.clear();
        }
        
        for (const key in this.pendingRemovals) {
            this.pendingRemovals[key].clear();
        }
        
        this.frameHistory = [];
        this.performanceStats = {
            frameTime: 0,
            updateTime: 0,
            renderTime: 0,
            collisionTime: 0,
            entityCount: 0,
            activeCollisions: 0,
            culledEntities: 0,
            pooledObjects: 0
        };
    }
}

// Exportar
if (typeof module !== 'undefined' && module.exports) {
    module.exports = OptimizationEngine;
}
