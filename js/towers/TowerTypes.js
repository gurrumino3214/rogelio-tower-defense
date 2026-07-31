/**
 * ========================================
 * TOWER_TYPES.JS - Registro de Tipos de Torres
 * ========================================
 * Sistema modular para registrar y gestionar múltiples tipos de torres.
 * Diseñado para soportar decenas de tipos de torres en el futuro.
 * 
 * Cada tipo de torre define:
 * - Stats base (daño, rango, fireRate, costo)
 * - Tipo de daño (físico, mágico, fuego, hielo, etc.)
 * - Efectos especiales (slow, splash, stun, etc.)
 * - Configuración visual (color, sprite, animaciones)
 * - Curva de mejora (cómo escalan los stats al mejorar)
 */

const TowerTypes = {
    /** @type {Map<string, Object>} Registro de todos los tipos de torres */
    registry: new Map(),

    /**
     * Registra un nuevo tipo de torre en el sistema
     * @param {string} id - Identificador único del tipo de torre
     * @param {Object} config - Configuración completa de la torre
     * @param {string} config.name - Nombre visible de la torre
     * @param {string} config.description - Descripción para tooltips
     * @param {number} config.cost - Costo base de construcción
     * @param {number} config.sellMultiplier - Multiplicador de venta (ej: 0.5 = 50% del costo)
     * @param {number} config.damage - Daño base por disparo
     * @param {number} config.range - Alcance máximo en píxeles
     * @param {number} config.fireRate - Disparos por segundo
     * @param {string} config.damageType - Tipo de daño: 'physical', 'magic', 'fire', 'ice', 'lightning'
     * @param {string} config.targetPriority - Prioridad por defecto: 'first', 'last', 'strongest', 'weakest', 'closest'
     * @param {Object} [config.special] - Configuración de efectos especiales
     * @param {number} [config.special.slowEffect] - Porcentaje de ralentización (0-1)
     * @param {number} [config.special.splashRadius] - Radio de daño en área
     * @param {number} [config.special.stunDuration] - Duración de aturdimiento en segundos
     * @param {number} [config.special.chainCount] - Número de enemigos en cadena (rayo)
     * @param {Object} [config.visual] - Configuración visual
     * @param {string} [config.visual.color] - Color principal
     * @param {string} [config.visual.secondaryColor] - Color secundario
     * @param {number} [config.visual.width] - Ancho del sprite
     * @param {number} [config.visual.height] - Alto del sprite
     * @param {string} [config.visual.sprite] - Ruta al sprite sheet (opcional)
     * @param {Object} [config.upgradeCurve] - Curva de mejora
     * @param {number} [config.upgradeCurve.damageMultiplier] - Multiplicador de daño por nivel
     * @param {number} [config.upgradeCurve.rangeMultiplier] - Multiplicador de rango por nivel
     * @param {number} [config.upgradeCurve.fireRateMultiplier] - Multiplicador de fireRate por nivel
     * @param {number} [config.upgradeCurve.costMultiplier] - Multiplicador de costo de mejora
     * @returns {boolean} True si se registró correctamente
     */
    register: function(id, config) {
        if (this.registry.has(id)) {
            console.warn(`Tower type "${id}" already registered. Overwriting.`);
        }
        
        // Validar configuración mínima requerida
        const required = ['name', 'cost', 'damage', 'range', 'fireRate'];
        for (const field of required) {
            if (!(field in config)) {
                console.error(`Missing required field "${field}" for tower type "${id}"`);
                return false;
            }
        }

        // Valores por defecto
        const defaultConfig = {
            sellMultiplier: 0.5,
            damageType: 'physical',
            targetPriority: 'closest',
            special: {},
            visual: {
                color: '#888888',
                secondaryColor: '#444444',
                width: 40,
                height: 40
            },
            upgradeCurve: {
                damageMultiplier: 1.2,
                rangeMultiplier: 1.1,
                fireRateMultiplier: 1.1,
                costMultiplier: 1.5
            }
        };

        // Fusionar con valores por defecto
        const mergedConfig = this.deepMerge(defaultConfig, config);
        mergedConfig.id = id;
        
        this.registry.set(id, mergedConfig);
        console.log(`Registered tower type: ${id} - ${config.name}`);
        return true;
    },

    /**
     * Obtiene la configuración de un tipo de torre
     * @param {string} id - Identificador del tipo de torre
     * @returns {Object|null} Configuración o null si no existe
     */
    get: function(id) {
        return this.registry.get(id) || null;
    },

    /**
     * Verifica si un tipo de torre está registrado
     * @param {string} id - Identificador del tipo de torre
     * @returns {boolean}
     */
    has: function(id) {
        return this.registry.has(id);
    },

    /**
     * Obtiene todos los IDs de torres registradas
     * @returns {string[]} Array de IDs
     */
    getAllIds: function() {
        return Array.from(this.registry.keys());
    },

    /**
     * Obtiene todas las configuraciones de torres
     * @returns {Object[]} Array de configuraciones
     */
    getAll: function() {
        return Array.from(this.registry.values());
    },

    /**
     * Filtra torres por tipo de daño
     * @param {string} damageType - Tipo de daño a filtrar
     * @returns {Object[]} Torres que coinciden
     */
    filterByDamageType: function(damageType) {
        return this.getAll().filter(t => t.damageType === damageType);
    },

    /**
     * Calcula el costo de mejora para una torre
     * @param {string} towerId - Tipo de torre
     * @param {number} currentLevel - Nivel actual
     * @returns {number} Costo de mejora al siguiente nivel
     */
    getUpgradeCost: function(towerId, currentLevel) {
        const config = this.get(towerId);
        if (!config) return 0;
        
        const baseCost = config.cost;
        const multiplier = config.upgradeCurve.costMultiplier;
        return Math.floor(baseCost * Math.pow(multiplier, currentLevel));
    },

    /**
     * Calcula stats mejorados para una torre
     * @param {string} towerId - Tipo de torre
     * @param {number} level - Nivel de mejora
     * @returns {Object} Stats mejorados
     */
    getUpgradedStats: function(towerId, level) {
        const config = this.get(towerId);
        if (!config) return null;

        const curve = config.upgradeCurve;
        const levelFactor = Math.pow(1, level); // Para futuras fórmulas complejas

        return {
            damage: Math.floor(config.damage * Math.pow(curve.damageMultiplier, level)),
            range: Math.floor(config.range * Math.pow(curve.rangeMultiplier, level)),
            fireRate: config.fireRate * Math.pow(curve.fireRateMultiplier, level),
            maxLevel: config.maxLevel || 5
        };
    },

    /**
     * Fusiona dos objetos profundamente
     * @param {Object} target - Objeto destino
     * @param {Object} source - Objeto fuente
     * @returns {Object} Objeto fusionado
     */
    deepMerge: function(target, source) {
        const output = Object.assign({}, target);
        
        for (const key in source) {
            if (source.hasOwnProperty(key)) {
                if (typeof source[key] === 'object' && source[key] !== null) {
                    output[key] = this.deepMerge(target[key] || {}, source[key]);
                } else {
                    output[key] = source[key];
                }
            }
        }
        return output;
    },

    /**
     * Inicializa los tipos de torre por defecto
     */
    initDefaults: function() {
        // Torre Básica - Balanceada
        this.register('basic', {
            name: 'Torre Básica',
            description: 'Torre estándar equilibrada. Buena para empezar.',
            cost: 50,
            damage: 20,
            range: 150,
            fireRate: 1.0,
            damageType: 'physical',
            targetPriority: 'closest',
            visual: {
                color: '#2e7d32',
                secondaryColor: '#1b5e20',
                width: 40,
                height: 40
            },
            maxLevel: 5
        });

        // Torre de Hielo - Ralentiza enemigos
        this.register('ice', {
            name: 'Torre de Hielo',
            description: 'Ralentiza a los enemigos, permitiendo que otras torres los alcancen.',
            cost: 80,
            damage: 10,
            range: 120,
            fireRate: 0.8,
            damageType: 'ice',
            targetPriority: 'first',
            special: {
                slowEffect: 0.5,
                slowDuration: 2
            },
            visual: {
                color: '#0288d1',
                secondaryColor: '#01579b',
                width: 36,
                height: 36
            },
            maxLevel: 5
        });

        // Torre Explosiva - Daño en área
        this.register('splash', {
            name: 'Torre Explosiva',
            description: 'Inflige daño a múltiples enemigos cercanos al impacto.',
            cost: 120,
            damage: 35,
            range: 100,
            fireRate: 0.5,
            damageType: 'fire',
            targetPriority: 'strongest',
            special: {
                splashRadius: 80
            },
            visual: {
                color: '#c62828',
                secondaryColor: '#8e0000',
                width: 44,
                height: 44
            },
            maxLevel: 5
        });

        // Torre Rápida - Alta cadencia de tiro
        this.register('rapid', {
            name: 'Torre Rápida',
            description: 'Dispara muy rápido pero con poco daño individual.',
            cost: 90,
            damage: 8,
            range: 130,
            fireRate: 4.0,
            damageType: 'physical',
            targetPriority: 'closest',
            visual: {
                color: '#f9a825',
                secondaryColor: '#f57f17',
                width: 32,
                height: 32
            },
            maxLevel: 5
        });

        // Torre de Rayo - Cadena de daño
        this.register('lightning', {
            name: 'Torre de Rayo',
            description: 'El rayo salta entre múltiples enemigos cercanos.',
            cost: 150,
            damage: 25,
            range: 140,
            fireRate: 0.7,
            damageType: 'lightning',
            targetPriority: 'closest',
            special: {
                chainCount: 3,
                chainRange: 100
            },
            visual: {
                color: '#7b1fa2',
                secondaryColor: '#4a148c',
                width: 38,
                height: 38
            },
            maxLevel: 5
        });

        // Torre Sniper - Largo alcance, alto daño
        this.register('sniper', {
            name: 'Torre Sniper',
            description: 'Alto daño y largo alcance, pero lenta.',
            cost: 200,
            damage: 100,
            range: 300,
            fireRate: 0.3,
            damageType: 'physical',
            targetPriority: 'strongest',
            visual: {
                color: '#5d4037',
                secondaryColor: '#3e2723',
                width: 36,
                height: 48
            },
            maxLevel: 5
        });

        // Torre Mágica - Daño mágico puro
        this.register('magic', {
            name: 'Torre Mágica',
            description: 'Daño mágico que ignora parte de la defensa enemiga.',
            cost: 130,
            damage: 40,
            range: 120,
            fireRate: 0.6,
            damageType: 'magic',
            targetPriority: 'weakest',
            special: {
                armorPenetration: 0.5
            },
            visual: {
                color: '#ab47bc',
                secondaryColor: '#7b1fa2',
                width: 40,
                height: 40
            },
            maxLevel: 5
        });

        console.log(`Initialized ${this.registry.size} default tower types`);
    }
};

// Exportar para uso en otros módulos
if (typeof module !== 'undefined' && module.exports) {
    module.exports = TowerTypes;
}
