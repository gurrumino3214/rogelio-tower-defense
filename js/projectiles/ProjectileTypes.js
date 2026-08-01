/**
 * ProjectileTypes.js - Registro de tipos de proyectiles
 * 
 * Sistema modular que soporta decenas de tipos de proyectiles.
 * Cada tipo define propiedades de trayectoria, daño, efectos y comportamiento.
 * 
 * @module ProjectileTypes
 */

const ProjectileTypes = {
    /**
     * Registro de todos los tipos de proyectiles disponibles
     * @type {Object}
     */
    types: {},

    /**
     * Registra un nuevo tipo de proyectil
     * @param {string} id - Identificador único del proyectil
     * @param {Object} config - Configuración del proyectil
     * @param {string} config.category - Categoría: 'bullet', 'arrow', 'magic', 'laser', 'explosion'
     * @param {number} config.speed - Velocidad del proyectil (pixels por frame)
     * @param {number} config.damage - Daño base
     * @param {number} config.lifetime - Duración máxima en frames (-1 para infinito hasta impacto)
     * @param {number} config.radius - Radio de colisión
     * @param {boolean} config.piercing - Si puede perforar enemigos
     * @param {number} config.pierceCount - Número máximo de enemigos a perforar
     * @param {boolean} config.areaDamage - Si causa daño en área
     * @param {number} config.areaRadius - Radio del daño en área
     * @param {string} config.trailType - Tipo de estela: 'none', 'simple', 'glow', 'spark'
     * @param {Object} config.color - Color del proyectil {r, g, b, a}
     * @param {Function} config.onHit - Callback personalizado al impactar
     * @param {Function} config.update - Función personalizada de actualización
     */
    register(id, config) {
        if (this.types[id]) {
            console.warn(`Projectile type '${id}' already registered. Overwriting.`);
        }
        this.types[id] = {
            id,
            category: config.category || 'bullet',
            speed: config.speed || 5,
            damage: config.damage || 10,
            lifetime: config.lifetime !== undefined ? config.lifetime : -1,
            radius: config.radius || 3,
            piercing: config.piercing || false,
            pierceCount: config.pierceCount || 1,
            areaDamage: config.areaDamage || false,
            areaRadius: config.areaRadius || 0,
            trailType: config.trailType || 'none',
            color: config.color || { r: 255, g: 255, b: 255, a: 1 },
            onHit: config.onHit || null,
            update: config.update || null,
            homing: config.homing || false,
            homingStrength: config.homingStrength || 0.1,
            gravity: config.gravity || 0,
            acceleration: config.acceleration || 0,
            rotation: config.rotation || 0,
            scale: config.scale || 1
        };
        return this.types[id];
    },

    /**
     * Obtiene la configuración de un tipo de proyectil
     * @param {string} id - Identificador del proyectil
     * @returns {Object|null} Configuración o null si no existe
     */
    get(id) {
        return this.types[id] || null;
    },

    /**
     * Verifica si un tipo de proyectil está registrado
     * @param {string} id - Identificador del proyectil
     * @returns {boolean} True si está registrado
     */
    exists(id) {
        return this.types.hasOwnProperty(id);
    },

    /**
     * Obtiene todos los IDs de proyectiles registrados
     * @returns {string[]} Array de IDs
     */
    getAllIds() {
        return Object.keys(this.types);
    },

    /**
     * Obtiene proyectiles por categoría
     * @param {string} category - Categoría a filtrar
     * @returns {Object[]} Array de configuraciones
     */
    getByCategory(category) {
        return Object.values(this.types).filter(p => p.category === category);
    },

    /**
     * Inicializa los tipos de proyectiles predefinidos
     */
    init() {
        // ==================== BALAS ====================
        
        // Bala básica de torre de disparo rápido
        this.register('bullet_basic', {
            category: 'bullet',
            speed: 8,
            damage: 15,
            lifetime: 120,
            radius: 3,
            piercing: false,
            color: { r: 255, g: 255, b: 0, a: 1 },
            trailType: 'simple'
        });

        // Bala perforante
        this.register('bullet_armor_piercing', {
            category: 'bullet',
            speed: 10,
            damage: 25,
            lifetime: 150,
            radius: 4,
            piercing: true,
            pierceCount: 3,
            color: { r: 200, g: 100, b: 50, a: 1 },
            trailType: 'spark'
        });

        // Bala rápida de ametralladora
        this.register('bullet_rapid', {
            category: 'bullet',
            speed: 12,
            damage: 8,
            lifetime: 90,
            radius: 2,
            piercing: false,
            color: { r: 255, g: 200, b: 0, a: 1 },
            trailType: 'simple'
        });

        // Bala explosiva
        this.register('bullet_explosive', {
            category: 'bullet',
            speed: 6,
            damage: 30,
            lifetime: 180,
            radius: 5,
            piercing: false,
            areaDamage: true,
            areaRadius: 60,
            color: { r: 255, g: 100, b: 0, a: 1 },
            trailType: 'glow'
        });

        // ==================== FLECHAS ====================
        
        // Flecha básica de arco
        this.register('arrow_basic', {
            category: 'arrow',
            speed: 9,
            damage: 20,
            lifetime: 150,
            radius: 2,
            piercing: false,
            color: { r: 150, g: 100, b: 50, a: 1 },
            trailType: 'simple',
            rotation: true,
            gravity: 0.02
        });

        // Flecha perforante larga
        this.register('arrow_longshot', {
            category: 'arrow',
            speed: 11,
            damage: 35,
            lifetime: 200,
            radius: 3,
            piercing: true,
            pierceCount: 2,
            color: { r: 100, g: 150, b: 50, a: 1 },
            trailType: 'spark',
            rotation: true,
            gravity: 0.01
        });

        // Flecha envenenada
        this.register('arrow_poison', {
            category: 'arrow',
            speed: 7,
            damage: 15,
            lifetime: 180,
            radius: 3,
            piercing: false,
            color: { r: 50, g: 200, b: 50, a: 1 },
            trailType: 'glow',
            rotation: true,
            onHit: (projectile, enemy) => {
                // Aplicar efecto de veneno (daño continuo)
                if (enemy.applyPoison) {
                    enemy.applyPoison(5, 60); // 5 daño por 60 frames
                }
            }
        });

        // Flecha de hielo (ralentiza)
        this.register('arrow_ice', {
            category: 'arrow',
            speed: 8,
            damage: 18,
            lifetime: 160,
            radius: 3,
            piercing: false,
            color: { r: 100, g: 200, b: 255, a: 1 },
            trailType: 'spark',
            rotation: true,
            onHit: (projectile, enemy) => {
                // Aplicar efecto de ralentización
                if (enemy.applySlow) {
                    enemy.applySlow(0.5, 90); // 50% velocidad por 90 frames
                }
            }
        });

        // ==================== MAGIA ====================
        
        // Proyectil mágico básico
        this.register('magic_bolt', {
            category: 'magic',
            speed: 7,
            damage: 25,
            lifetime: 140,
            radius: 4,
            piercing: false,
            color: { r: 150, g: 50, b: 255, a: 1 },
            trailType: 'glow',
            homing: true,
            homingStrength: 0.08
        });

        // Orbe mágico de fuego
        this.register('magic_fireball', {
            category: 'magic',
            speed: 5,
            damage: 40,
            lifetime: 200,
            radius: 6,
            piercing: false,
            areaDamage: true,
            areaRadius: 50,
            color: { r: 255, g: 100, b: 0, a: 1 },
            trailType: 'glow',
            acceleration: 0.02,
            onHit: (projectile, enemy) => {
                // Efecto de quemadura
                if (enemy.applyBurn) {
                    enemy.applyBurn(8, 45);
                }
            }
        });

        // Rayo de hielo
        this.register('magic_ice_shard', {
            category: 'magic',
            speed: 9,
            damage: 20,
            lifetime: 130,
            radius: 3,
            piercing: true,
            pierceCount: 4,
            color: { r: 100, g: 200, b: 255, a: 1 },
            trailType: 'spark',
            onHit: (projectile, enemy) => {
                if (enemy.applySlow) {
                    enemy.applySlow(0.4, 120);
                }
            }
        });

        // Orbe de vacío (homing fuerte)
        this.register('magic_void_orb', {
            category: 'magic',
            speed: 4,
            damage: 35,
            lifetime: 250,
            radius: 5,
            piercing: false,
            color: { r: 80, g: 20, b: 120, a: 1 },
            trailType: 'glow',
            homing: true,
            homingStrength: 0.15,
            scale: 1.2
        });

        // ==================== LÁSER ====================
        
        // Láser continuo (ray instantáneo)
        this.register('laser_beam', {
            category: 'laser',
            speed: 100, // Muy rápido, casi instantáneo
            damage: 5,
            lifetime: 5, // Dura muy poco
            radius: 2,
            piercing: true,
            pierceCount: 999, // Atraviesa todo
            color: { r: 255, g: 0, b: 0, a: 0.8 },
            trailType: 'glow'
        });

        // Láser de plasma
        this.register('laser_plasma', {
            category: 'laser',
            speed: 80,
            damage: 8,
            lifetime: 8,
            radius: 3,
            piercing: true,
            pierceCount: 999,
            color: { r: 0, g: 255, b: 255, a: 0.9 },
            trailType: 'glow',
            areaDamage: true,
            areaRadius: 15
        });

        // Láser térmico (daño continuo)
        this.register('laser_thermal', {
            category: 'laser',
            speed: 90,
            damage: 3,
            lifetime: 10,
            radius: 4,
            piercing: true,
            pierceCount: 999,
            color: { r: 255, g: 150, b: 0, a: 0.7 },
            trailType: 'glow',
            onHit: (projectile, enemy) => {
                // Daño acumulativo
                if (enemy.heatStacks !== undefined) {
                    enemy.heatStacks = (enemy.heatStacks || 0) + 1;
                }
            }
        });

        // ==================== EXPLOSIONES ====================
        
        // Explosión básica
        this.register('explosion_basic', {
            category: 'explosion',
            speed: 3,
            damage: 50,
            lifetime: 30,
            radius: 8,
            piercing: false,
            areaDamage: true,
            areaRadius: 80,
            color: { r: 255, g: 150, b: 50, a: 1 },
            trailType: 'glow'
        });

        // Explosión nuclear (área masiva)
        this.register('explosion_nuke', {
            category: 'explosion',
            speed: 2,
            damage: 100,
            lifetime: 45,
            radius: 12,
            piercing: false,
            areaDamage: true,
            areaRadius: 150,
            color: { r: 255, g: 200, b: 100, a: 1 },
            trailType: 'glow',
            onHit: (projectile, enemy) => {
                // Empuje hacia atrás
                if (enemy.applyKnockback) {
                    projectile.applyKnockbackToEnemy(enemy);
                }
            }
        });

        // Explosión de fragmentación
        this.register('explosion_cluster', {
            category: 'explosion',
            speed: 4,
            damage: 30,
            lifetime: 25,
            radius: 6,
            piercing: false,
            areaDamage: true,
            areaRadius: 60,
            color: { r: 200, g: 100, b: 50, a: 1 },
            trailType: 'spark'
        });

        // Explosión de hielo (congela)
        this.register('explosion_frost', {
            category: 'explosion',
            speed: 3,
            damage: 35,
            lifetime: 35,
            radius: 10,
            piercing: false,
            areaDamage: true,
            areaRadius: 100,
            color: { r: 150, g: 220, b: 255, a: 1 },
            trailType: 'glow',
            onHit: (projectile, enemy) => {
                if (enemy.applyFreeze) {
                    enemy.applyFreeze(30); // Congelar por 30 frames
                }
            }
        });

        console.log(`[ProjectileTypes] Initialized ${Object.keys(this.types).length} projectile types`);
    }
};

// Exportar para uso en otros módulos
if (typeof module !== 'undefined' && module.exports) {
    module.exports = ProjectileTypes;
}
