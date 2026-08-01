/**
 * BossTypes.js - Registro de configuraciones de Bosses
 * Sistema modular para soportar múltiples bosses con diferentes comportamientos
 * 
 * @module bosses/BossTypes
 */

/**
 * Configuración base para "El Lápiz Maldito"
 * Define estadísticas, fases y habilidades del boss final
 */
const CursedPencilConfig = {
    // Identificación
    id: 'cursed_pencil',
    name: 'El Lápiz Maldito',
    title: 'La Criatura del Dibujo Oscuro',
    
    // Dimensiones (en tiles)
    width: 4,
    height: 5,
    
    // Estadísticas base
    baseStats: {
        maxHealth: 5000,
        movementSpeed: 30,      // pixels por segundo
        damageMultiplier: 1.0
    },
    
    // Fases del boss
    phases: [
        {
            id: 1,
            name: 'Despertar',
            healthThreshold: 1.0,      // 100% - 66%
            duration: null,            // Basado en vida
            
            modifiers: {
                speedMultiplier: 0.6,   // Lento
                damageMultiplier: 0.8,
                spawnRate: 8000,        // ms entre spawns
                abilityCooldown: 5000
            },
            
            abilities: ['summon_basic', 'slam'],
            
            behavior: {
                patrolRange: 100,
                idleTime: [2000, 4000],
                aggressionLevel: 0.3
            }
        },
        {
            id: 2,
            name: 'Furia Creciente',
            healthThreshold: 0.66,      // 66% - 33%
            duration: null,
            
            modifiers: {
                speedMultiplier: 1.0,   // Velocidad normal
                damageMultiplier: 1.2,
                spawnRate: 5000,
                abilityCooldown: 3500
            },
            
            abilities: ['summon_advanced', 'slam', 'area_attack', 'charge'],
            
            behavior: {
                patrolRange: 150,
                idleTime: [1000, 2500],
                aggressionLevel: 0.6
            }
        },
        {
            id: 3,
            name: 'Modo Furia Total',
            healthThreshold: 0.33,      // 33% - 0%
            duration: null,
            
            modifiers: {
                speedMultiplier: 1.5,   // Muy rápido
                damageMultiplier: 1.8,
                spawnRate: 3000,
                abilityCooldown: 2000
            },
            
            abilities: ['summon_wave', 'slam', 'area_attack', 'charge', 'devastate', 'ink_storm'],
            
            behavior: {
                patrolRange: 200,
                idleTime: [500, 1500],
                aggressionLevel: 1.0
            }
        }
    ],
    
    // Habilidades disponibles
    abilities: {
        summon_basic: {
            id: 'summon_basic',
            name: 'Invocar Esbirros',
            description: 'Invoca enemigos básicos del dibujo',
            cooldown: 8000,
            castTime: 1500,
            manaCost: 0,
            
            effect: {
                type: 'spawn',
                enemyTypes: ['sketch_minion', 'doodle_walker'],
                count: [2, 4],
                spawnRadius: 150,
                positions: 'around_boss'
            }
        },
        
        summon_advanced: {
            id: 'summon_advanced',
            name: 'Invocar Guardián',
            description: 'Invoca enemigos élite',
            cooldown: 12000,
            castTime: 2000,
            manaCost: 0,
            
            effect: {
                type: 'spawn',
                enemyTypes: ['ink_warrior', 'sketch_archer'],
                count: [1, 2],
                spawnRadius: 120,
                positions: 'around_boss'
            }
        },
        
        summon_wave: {
            id: 'summon_wave',
            name: 'Oleada Oscura',
            description: 'Invoca una oleada completa de enemigos',
            cooldown: 15000,
            castTime: 2500,
            manaCost: 0,
            
            effect: {
                type: 'spawn_wave',
                enemyTypes: ['sketch_minion', 'doodle_walker', 'ink_warrior'],
                count: [6, 10],
                spawnRadius: 200,
                positions: 'spread',
                waveDelay: 500
            }
        },
        
        slam: {
            id: 'slam',
            name: 'Golpe Aplastante',
            description: 'Golpea el suelo causando daño en área cercana',
            cooldown: 6000,
            castTime: 800,
            manaCost: 0,
            
            effect: {
                type: 'area_damage',
                damage: 40,
                radius: 120,
                knockback: 50,
                stunDuration: 500,
                animation: 'slam_ground'
            }
        },
        
        area_attack: {
            id: 'area_attack',
            name: 'Explosión de Tinta',
            description: 'Libera tinta maldita en un área grande',
            cooldown: 10000,
            castTime: 1200,
            manaCost: 0,
            
            effect: {
                type: 'area_damage',
                damage: 60,
                radius: 200,
                damageOverTime: 15,
                dotDuration: 3000,
                slowPercent: 0.4,
                slowDuration: 2000,
                animation: 'ink_explosion'
            }
        },
        
        charge: {
            id: 'charge',
            name: 'Carga Brutal',
            description: 'Se lanza hacia adelante aplastando todo',
            cooldown: 8000,
            castTime: 1000,
            manaCost: 0,
            
            effect: {
                type: 'charge',
                damage: 50,
                distance: 300,
                speed: 400,
                knockback: 100,
                collisionDamage: true,
                animation: 'charge_forward'
            }
        },
        
        devastate: {
            id: 'devastate',
            name: 'Devastación Total',
            description: 'Ataque masivo que cubre gran parte del campo',
            cooldown: 20000,
            castTime: 3000,
            manaCost: 0,
            
            effect: {
                type: 'mega_area',
                damage: 100,
                radius: 350,
                knockback: 150,
                stunDuration: 1500,
                screenShake: 20,
                animation: 'devastation'
            }
        },
        
        ink_storm: {
            id: 'ink_storm',
            name: 'Tormenta de Tinta',
            description: 'Crea zonas de tinta dañinas en el campo',
            cooldown: 18000,
            castTime: 1500,
            manaCost: 0,
            
            effect: {
                type: 'ground_effect',
                damage: 25,
                zones: 5,
                zoneRadius: 80,
                zoneDuration: 8000,
                damageTick: 500,
                animation: 'ink_puddles'
            }
        },
        
        // NUEVAS HABILIDADES - Ejemplos de cómo agregar más
        
        roar_fury: {
            id: 'roar_fury',
            name: 'Rugido de Furia',
            description: 'Aumenta el daño de todos los aliados cercanos y reduce el daño enemigo',
            cooldown: 25000,
            castTime: 1000,
            manaCost: 0,
            
            effect: {
                type: 'roar',
                buffType: 'damage_boost',
                buffValue: 1.5,
                buffDuration: 8000,
                debuffType: 'fear',
                debuffValue: 0.7,
                debuffDuration: 4000,
                radius: 300,
                animation: 'roar_fury',
                sound: 'boss_roar'
            }
        },
        
        projectile_barrage: {
            id: 'projectile_barrage',
            name: 'Lluvia de Proyectiles',
            description: 'Dispara múltiples proyectiles malditos en abanico',
            cooldown: 12000,
            castTime: 800,
            manaCost: 0,
            
            effect: {
                type: 'projectile',
                projectileType: 'cursed_ink',
                damage: 25,
                speed: 350,
                count: 8,
                spreadAngle: 60,
                homing: false,
                animation: 'shoot_projectiles'
            }
        },
        
        curse_weakness: {
            id: 'curse_weakness',
            name: 'Maldición de Debilidad',
            description: 'Reduce el daño de todas las torres cercanas',
            cooldown: 20000,
            castTime: 1200,
            manaCost: 0,
            
            effect: {
                type: 'curse',
                curseType: 'weakness',
                curseValue: 0.5,
                curseDuration: 12000,
                radius: 400,
                affectAll: true,
                animation: 'curse_cast'
            }
        },
        
        invulnerability_shield: {
            id: 'invulnerability_shield',
            name: 'Escudo de Oscuridad',
            description: 'Se vuelve invulnerable temporalmente',
            cooldown: 35000,
            castTime: 500,
            manaCost: 0,
            
            effect: {
                type: 'invulnerability',
                duration: 4000,
                immunityType: 'all',
                visualEffect: 'dark_shield',
                soundEffect: 'shield_activate'
            }
        }
    },
    
    // Animaciones
    animations: {
        idle: { frames: 4, fps: 8, loop: true },
        walk: { frames: 6, fps: 10, loop: true },
        attack_slam: { frames: 8, fps: 15, loop: false },
        attack_charge: { frames: 6, fps: 18, loop: false },
        attack_area: { frames: 10, fps: 12, loop: false },
        summon: { frames: 8, fps: 10, loop: false },
        hit: { frames: 3, fps: 12, loop: false },
        death: { frames: 12, fps: 8, loop: false },
        phase_transition: { frames: 10, fps: 15, loop: false }
    },
    
    // Sonidos (referencias)
    sounds: {
        appear: 'boss_pencil_appear',
        phase_change: 'boss_phase_transform',
        attack_slam: 'boss_heavy_hit',
        attack_charge: 'boss_charge_whoosh',
        attack_area: 'boss_magic_blast',
        summon: 'boss_summon_spell',
        hit: 'boss_pain',
        death: 'boss_death_cry',
        laugh: 'boss_evil_laugh'
    },
    
    // Eventos especiales
    events: {
        onSpawn: ['cinematic_appear', 'screen_darken', 'music_boss_start'],
        onPhaseChange: ['screen_flash', 'health_bar_pulse', 'announcement'],
        onAbilityCast: ['telegraph_warning', 'audio_cue'],
        onDeath: ['explosion', 'loot_spawn', 'victory_sequence']
    }
};

/**
 * Plantilla base para futuros bosses
 * Copiar y modificar para crear nuevos bosses
 */
const BossTemplate = {
    id: 'new_boss_id',
    name: 'Nombre del Boss',
    title: 'Título épico',
    
    dimensions: {
        width: 3,
        height: 3
    },
    
    baseStats: {
        maxHealth: 1000,
        movementSpeed: 50,
        damageMultiplier: 1.0
    },
    
    phases: [
        {
            id: 1,
            name: 'Fase inicial',
            healthThreshold: 1.0,
            modifiers: {},
            abilities: [],
            behavior: {}
        }
    ],
    
    abilities: {
        // Definir habilidades aquí
    },
    
    animations: {},
    sounds: {},
    events: {}
};

/**
 * Registro global de bosses
 * Permite añadir nuevos bosses fácilmente
 */
const BossRegistry = {
    _bosses: new Map(),
    
    /**
     * Registrar un nuevo boss
     * @param {Object} config - Configuración del boss
     */
    register(config) {
        this._bosses.set(config.id, config);
        console.log(`[BossRegistry] Boss registrado: ${config.name}`);
    },
    
    /**
     * Obtener configuración de un boss
     * @param {string} bossId - ID del boss
     * @returns {Object|null} Configuración o null
     */
    get(bossId) {
        return this._bosses.get(bossId) || null;
    },
    
    /**
     * Verificar si un boss existe
     * @param {string} bossId - ID del boss
     * @returns {boolean}
     */
    exists(bossId) {
        return this._bosses.has(bossId);
    },
    
    /**
     * Obtener todos los IDs de bosses registrados
     * @returns {string[]}
     */
    getAllIds() {
        return Array.from(this._bosses.keys());
    },
    
    /**
     * Obtener número de bosses registrados
     * @returns {number}
     */
    getCount() {
        return this._bosses.size;
    }
};

// Registrar El Lápiz Maldito
BossRegistry.register(CursedPencilConfig);

export { CursedPencilConfig, BossTemplate, BossRegistry };
