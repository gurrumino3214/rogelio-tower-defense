/**
 * ProjectileManager.js - Gestor de proyectiles
 * 
 * Sistema optimizado para manejar cientos de proyectiles simultáneos.
 * Usa object pooling para evitar garbage collection.
 * 
 * @module ProjectileManager
 */

class ProjectileManager {
    /**
     * Crea el gestor de proyectiles
     * @param {Object} options - Opciones de configuración
     * @param {number} options.poolSize - Tamaño inicial del pool de proyectiles
     * @param {number} options.maxProjectiles - Máximo número de proyectiles activos
     */
    constructor(options = {}) {
        this.poolSize = options.poolSize || 200;
        this.maxProjectiles = options.maxProjectiles || 500;
        
        // Pool de proyectiles reutilizables
        this.projectilePool = [];
        
        // Proyectiles activos
        this.activeProjectiles = [];
        
        // Estadísticas
        this.stats = {
            spawned: 0,
            active: 0,
            pooled: 0,
            hits: 0,
            maxActive: 0
        };

        // Inicializar pool
        this.initializePool();
    }

    /**
     * Inicializa el pool de proyectiles
     */
    initializePool() {
        for (let i = 0; i < this.poolSize; i++) {
            this.projectilePool.push(this.createEmptyProjectile());
        }
        this.stats.pooled = this.projectilePool.length;
    }

    /**
     * Crea un objeto de proyectil vacío para el pool
     * @returns {Object} Objeto de proyectil vacío
     */
    createEmptyProjectile() {
        return {
            x: 0,
            y: 0,
            vx: 0,
            vy: 0,
            typeId: '',
            type: null,
            source: null,
            target: null,
            active: false,
            age: 0,
            speed: 0,
            angle: 0,
            damage: 0,
            hitEnemies: new Set(),
            pierceCount: 0,
            maxPierceCount: 1,
            areaDamage: false,
            areaRadius: 0,
            areaDamageDealt: false,
            lifetime: -1,
            homing: false,
            homingStrength: 0.1,
            gravity: 0,
            acceleration: 0,
            rotation: 0,
            scale: 1,
            color: { r: 255, g: 255, b: 255, a: 1 },
            radius: 3,
            trailType: 'none',
            trailParticles: [],
            onHitCallback: null,
            updateCallback: null,

            // Métodos asignados dinámicamente
            loadFromType: null,
            setDirection: null,
            update: null,
            applyHoming: null,
            findNearestTarget: null,
            generateTrail: null,
            checkCollisions: null,
            onHit: null,
            dealAreaDamage: null,
            spawnImpactParticles: null,
            spawnExplosionParticles: null,
            deactivate: null,
            render: null,
            renderTrail: null,
            renderBullet: null,
            renderArrow: null,
            renderMagic: null,
            renderLaser: null,
            renderExplosion: null,
            getDebugInfo: null
        };
    }

    /**
     * Dispara un nuevo proyectil
     * @param {Object} config - Configuración del disparo
     * @param {number} config.x - Posición X de origen
     * @param {number} config.y - Posición Y de origen
     * @param {number} config.targetX - Posición X objetivo
     * @param {number} config.targetY - Posición Y objetivo
     * @param {string} config.typeId - Tipo de proyectil
     * @param {Object} [config.source] - Entidad que dispara
     * @param {Object} [config.target] - Objetivo para homing
     * @param {number} [config.damageMultiplier] - Multiplicador de daño
     * @returns {Object|null} El proyectil creado o null si no hay espacio
     */
    shoot(config) {
        // Verificar límite máximo
        if (this.activeProjectiles.length >= this.maxProjectiles) {
            console.warn('[ProjectileManager] Max projectiles reached');
            return null;
        }

        let projectile;

        // Obtener del pool o crear nuevo
        if (this.projectilePool.length > 0) {
            projectile = this.projectilePool.pop();
        } else {
            projectile = this.createEmptyProjectile();
        }

        // Configurar proyectil
        this.setupProjectile(projectile, config);

        // Añadir a activos
        this.activeProjectiles.push(projectile);
        
        // Actualizar estadísticas
        this.stats.spawned++;
        this.stats.active = this.activeProjectiles.length;
        this.stats.maxActive = Math.max(this.stats.maxActive, this.stats.active);

        return projectile;
    }

    /**
     * Configura un proyectil con los parámetros dados
     * @param {Object} projectile - Proyectil a configurar
     * @param {Object} config - Configuración
     */
    setupProjectile(projectile, config) {
        // Resetear propiedades básicas
        projectile.x = config.x || 0;
        projectile.y = config.y || 0;
        projectile.typeId = config.typeId || 'bullet_basic';
        projectile.source = config.source || null;
        projectile.target = config.target || null;
        projectile.active = true;
        projectile.age = 0;
        projectile.hitEnemies.clear();
        projectile.areaDamageDealt = false;
        projectile.trailParticles = [];

        // Cargar tipo
        if (typeof ProjectileTypes !== 'undefined') {
            const type = ProjectileTypes.get(projectile.typeId);
            if (type) {
                projectile.type = type;
                projectile.speed = type.speed;
                projectile.damage = config.damageMultiplier 
                    ? type.damage * config.damageMultiplier 
                    : type.damage;
                projectile.lifetime = type.lifetime;
                projectile.radius = type.radius;
                projectile.piercing = type.piercing;
                projectile.maxPierceCount = type.pierceCount;
                projectile.pierceCount = type.pierceCount;
                projectile.areaDamage = type.areaDamage;
                projectile.areaRadius = type.areaRadius;
                projectile.trailType = type.trailType;
                projectile.color = { ...type.color };
                projectile.onHitCallback = type.onHit;
                projectile.updateCallback = type.update;
                projectile.homing = type.homing;
                projectile.homingStrength = type.homingStrength;
                projectile.gravity = type.gravity;
                projectile.acceleration = type.acceleration;
                projectile.rotation = type.rotation ? 0 : 0;
                projectile.scale = type.scale;
            }
        }

        // Calcular dirección
        if (config.targetX !== undefined && config.targetY !== undefined) {
            const dx = config.targetX - projectile.x;
            const dy = config.targetY - projectile.y;
            projectile.angle = Math.atan2(dy, dx);
            projectile.vx = Math.cos(projectile.angle) * projectile.speed;
            projectile.vy = Math.sin(projectile.angle) * projectile.speed;

            if (projectile.type && projectile.type.rotation) {
                projectile.rotation = projectile.angle;
            }
        }

        // Asignar métodos si no existen
        if (!projectile.loadFromType) {
            this.assignMethods(projectile);
        }
    }

    /**
     * Asigna métodos al proyectil desde la clase Projectile
     */
    assignMethods(projectile) {
        if (typeof Projectile !== 'undefined') {
            const proto = Projectile.prototype;
            
            projectile.setDirection = proto.setDirection.bind(projectile);
            projectile.update = proto.update.bind(projectile);
            projectile.applyHoming = proto.applyHoming.bind(projectile);
            projectile.findNearestTarget = proto.findNearestTarget.bind(projectile);
            projectile.generateTrail = proto.generateTrail.bind(projectile);
            projectile.checkCollisions = proto.checkCollisions.bind(projectile);
            projectile.onHit = proto.onHit.bind(projectile);
            projectile.dealAreaDamage = proto.dealAreaDamage.bind(projectile);
            projectile.spawnImpactParticles = proto.spawnImpactParticles.bind(projectile);
            projectile.spawnExplosionParticles = proto.spawnExplosionParticles.bind(projectile);
            projectile.deactivate = proto.deactivate.bind(projectile);
            projectile.render = proto.render.bind(projectile);
            projectile.renderTrail = proto.renderTrail.bind(projectile);
            projectile.renderBullet = proto.renderBullet.bind(projectile);
            projectile.renderArrow = proto.renderArrow.bind(projectile);
            projectile.renderMagic = proto.renderMagic.bind(projectile);
            projectile.renderLaser = proto.renderLaser.bind(projectile);
            projectile.renderExplosion = proto.renderExplosion.bind(projectile);
            projectile.getDebugInfo = proto.getDebugInfo.bind(projectile);
        }
    }

    /**
     * Actualiza todos los proyectiles activos
     * @param {Array} enemies - Lista de enemigos para colisiones
     * @returns {number} Número de proyectiles aún activos
     */
    update(enemies = []) {
        for (let i = this.activeProjectiles.length - 1; i >= 0; i--) {
            const projectile = this.activeProjectiles[i];

            if (!projectile.active) {
                this回收Projectile(i);
                continue;
            }

            // Actualizar
            const stillActive = projectile.update(enemies);

            if (!stillActive) {
                this回收Projectile(i);
            }
        }

        this.stats.active = this.activeProjectiles.length;
        return this.activeProjectiles.length;
    }

    /**
     * Recicla un proyectil al pool
     * @param {number} index - Índice en activeProjectiles
     */
    回收Projectile(index) {
        const projectile = this.activeProjectiles[index];
        
        // Limpiar referencias pesadas
        projectile.hitEnemies.clear();
        projectile.trailParticles = [];
        projectile.target = null;
        projectile.source = null;
        projectile.active = false;

        // Devolver al pool
        this.activeProjectiles.splice(index, 1);
        this.projectilePool.push(projectile);
        this.stats.pooled = this.projectilePool.length;
    }

    /**
     * Renderiza todos los proyectiles activos
     * @param {CanvasRenderingContext2D} ctx - Contexto del canvas
     */
    render(ctx) {
        for (const projectile of this.activeProjectiles) {
            if (projectile.active) {
                projectile.render(ctx);
            }
        }
    }

    /**
     * Obtiene proyectiles por tipo
     * @param {string} typeId - ID del tipo a filtrar
     * @returns {Array} Proyectiles del tipo especificado
     */
    getByType(typeId) {
        return this.activeProjectiles.filter(p => p.typeId === typeId);
    }

    /**
     * Obtiene proyectiles por fuente
     * @param {Object} source - Entidad fuente
     * @returns {Array} Proyectiles de esa fuente
     */
    getBySource(source) {
        return this.activeProjectiles.filter(p => p.source === source);
    }

    /**
     * Elimina todos los proyectiles de una fuente
     * @param {Object} source - Entidad fuente a eliminar
     */
    removeAllFromSource(source) {
        for (let i = this.activeProjectiles.length - 1; i >= 0; i--) {
            if (this.activeProjectiles[i].source === source) {
                this.activeProjectiles[i].active = false;
                this回收Projectile(i);
            }
        }
    }

    /**
     * Limpia todos los proyectiles activos
     */
    clearAll() {
        while (this.activeProjectiles.length > 0) {
            const projectile = this.activeProjectiles.pop();
            projectile.active = false;
            projectile.hitEnemies.clear();
            projectile.trailParticles = [];
            this.projectilePool.push(projectile);
        }
        this.stats.active = 0;
        this.stats.pooled = this.projectilePool.length;
    }

    /**
     * Obtiene estadísticas del gestor
     * @returns {Object} Estadísticas
     */
    getStats() {
        return {
            ...this.stats,
            poolUtilization: (this.stats.active / this.maxProjectiles * 100).toFixed(2) + '%'
        };
    }

    /**
     * Ajusta el tamaño del pool
     * @param {number} newSize - Nuevo tamaño del pool
     */
    resizePool(newSize) {
        const diff = newSize - this.projectilePool.length;

        if (diff > 0) {
            // Añadir más
            for (let i = 0; i < diff; i++) {
                this.projectilePool.push(this.createEmptyProjectile());
            }
        } else if (diff < 0) {
            // Reducir (solo si están en el pool)
            this.projectilePool.splice(newSize);
        }

        this.poolSize = newSize;
    }
}

// Exportar
if (typeof module !== 'undefined' && module.exports) {
    module.exports = ProjectileManager;
}
