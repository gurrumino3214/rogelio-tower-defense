/**
 * ========================================
 * OBJECT_POOL.JS - Sistema de Object Pooling Genérico
 * ========================================
 * Sistema de pooling reutilizable para cualquier tipo de entidad.
 * Optimiza memoria y reduce garbage collection.
 * 
 * Características:
 * - Pool genérico para cualquier tipo de objeto
 * - Expansión dinámica del pool
 * - Estadísticas de uso
 * - Limpieza automática de referencias
 */

class ObjectPool {
    /**
     * Crea un Object Pool
     * @param {Function} createFn - Función para crear nuevos objetos
     * @param {Function} resetFn - Función para resetear objetos al devolverlos
     * @param {number} [initialSize=50] - Tamaño inicial del pool
     * @param {number} [maxSize=500] - Tamaño máximo del pool
     */
    constructor(createFn, resetFn, initialSize = 50, maxSize = 500) {
        this.createFn = createFn;
        this.resetFn = resetFn;
        this.initialSize = initialSize;
        this.maxSize = maxSize;
        
        // Pool de objetos disponibles
        this.available = [];
        
        // Objetos en uso
        this.inUse = new Set();
        
        // Estadísticas
        this.stats = {
            created: 0,
            reused: 0,
            active: 0,
            peakActive: 0,
            totalAllocations: 0
        };
        
        // Inicializar pool
        this.initialize();
    }
    
    /**
     * Inicializa el pool con objetos pre-creados
     */
    initialize() {
        for (let i = 0; i < this.initialSize; i++) {
            const obj = this.createFn();
            obj._poolId = `pool_${Date.now()}_${i}`;
            obj._inPool = true;
            this.available.push(obj);
            this.stats.created++;
        }
    }
    
    /**
     * Obtiene un objeto del pool o crea uno nuevo
     * @param {...any} args - Argumentos para pasar al método acquire
     * @returns {Object|null} Objeto del pool o null si se alcanzó el límite
     */
    get(...args) {
        let obj = null;
        
        // Intentar obtener del pool
        if (this.available.length > 0) {
            obj = this.available.pop();
            this.stats.reused++;
        } else if (this.stats.created < this.maxSize) {
            // Crear nuevo si hay espacio
            obj = this.createFn();
            obj._poolId = `pool_${Date.now()}_${this.stats.created}`;
            this.stats.created++;
        } else {
            // Límite alcanzado
            return null;
        }
        
        // Marcar como en uso
        obj._inPool = false;
        this.inUse.add(obj);
        this.stats.active = this.inUse.size;
        this.stats.peakActive = Math.max(this.stats.peakActive, this.stats.active);
        this.stats.totalAllocations++;
        
        // Llamar a acquire si existe
        if (obj.acquire && typeof obj.acquire === 'function') {
            obj.acquire(...args);
        }
        
        return obj;
    }
    
    /**
     * Devuelve un objeto al pool
     * @param {Object} obj - Objeto a devolver
     * @returns {boolean} True si se devolvió correctamente
     */
    release(obj) {
        if (!obj || obj._inPool) return false;
        
        // Remover de en uso
        this.inUse.delete(obj);
        
        // Resetear objeto
        if (this.resetFn) {
            this.resetFn(obj);
        } else if (obj.reset && typeof obj.reset === 'function') {
            obj.reset();
        }
        
        // Marcar como disponible
        obj._inPool = true;
        
        // Devolver al pool si no está lleno
        if (this.available.length < this.maxSize) {
            this.available.push(obj);
        }
        
        this.stats.active = this.inUse.size;
        return true;
    }
    
    /**
     * Libera todos los objetos en uso
     */
    releaseAll() {
        for (const obj of this.inUse) {
            this.release(obj);
        }
    }
    
    /**
     * Obtiene un objeto por ID
     * @param {string} id - ID del objeto
     * @returns {Object|null} Objeto encontrado o null
     */
    getById(id) {
        for (const obj of this.inUse) {
            if (obj._poolId === id) {
                return obj;
            }
        }
        return null;
    }
    
    /**
     * Obtiene todos los objetos activos
     * @returns {Array<Object>} Array de objetos activos
     */
    getAllActive() {
        return Array.from(this.inUse);
    }
    
    /**
     * Obtiene estadísticas del pool
     * @returns {Object} Estadísticas
     */
    getStats() {
        return {
            ...this.stats,
            availableCount: this.available.length,
            utilization: ((this.stats.active / this.maxSize) * 100).toFixed(2) + '%'
        };
    }
    
    /**
     * Resetea las estadísticas
     */
    resetStats() {
        this.stats = {
            created: this.stats.created,
            reused: 0,
            active: 0,
            peakActive: 0,
            totalAllocations: 0
        };
    }
    
    /**
     * Expande el pool agregando más objetos disponibles
     * @param {number} count - Cantidad de objetos a agregar
     */
    expand(count) {
        const actualCount = Math.min(count, this.maxSize - this.stats.created);
        
        for (let i = 0; i < actualCount; i++) {
            const obj = this.createFn();
            obj._poolId = `pool_${Date.now()}_exp_${i}`;
            obj._inPool = true;
            this.available.push(obj);
            this.stats.created++;
        }
        
        return actualCount;
    }
    
    /**
     * Reduce el pool eliminando objetos disponibles
     * @param {number} count - Cantidad de objetos a eliminar
     * @returns {number} Cantidad real eliminada
     */
    shrink(count) {
        const actualCount = Math.min(count, this.available.length);
        this.available.splice(this.available.length - actualCount, actualCount);
        return actualCount;
    }
    
    /**
     * Limpia completamente el pool
     * @param {boolean} keepInitial - Mantener el tamaño inicial
     */
    clear(keepInitial = true) {
        this.releaseAll();
        
        if (!keepInitial) {
            this.available = [];
        } else if (this.available.length > this.initialSize) {
            this.available.splice(this.initialSize);
        }
    }
}

// Exportar
if (typeof module !== 'undefined' && module.exports) {
    module.exports = ObjectPool;
}
