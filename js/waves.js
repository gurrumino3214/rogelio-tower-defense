/**
 * ========================================
 * WAVES.JS - Sistema de Olas de Enemigos
 * ========================================
 * Maneja la generación y progresión de olas:
 * - Configuración de cada ola
 * - Spawning de enemigos
 * - Progresión de dificultad
 */

const Waves = {
    // Configuración de olas
    waveConfigs: [
        // Ola 1
        {
            enemies: [
                { type: 'basic', count: 5, interval: 2 }
            ]
        },
        // Ola 2
        {
            enemies: [
                { type: 'basic', count: 8, interval: 1.8 }
            ]
        },
        // Ola 3
        {
            enemies: [
                { type: 'basic', count: 6, interval: 1.5 },
                { type: 'fast', count: 4, interval: 1.2 }
            ]
        },
        // Ola 4
        {
            enemies: [
                { type: 'basic', count: 5, interval: 1.5 },
                { type: 'tank', count: 3, interval: 3 }
            ]
        },
        // Ola 5
        {
            enemies: [
                { type: 'fast', count: 10, interval: 1 },
                { type: 'basic', count: 5, interval: 1.5 }
            ]
        }
    ],
    
    // Estado actual de la ola
    currentWave: null,
    enemyIndex: 0,
    enemyCount: 0,
    spawnTimer: 0,
    activeEnemies: [],
    
    /**
     * Crea una nueva ola
     * @param {number} waveNumber - Número de ola (1-based)
     * @returns {WaveInstance}
     */
    createWave: function(waveNumber) {
        // Obtener configuración (usar última si no existe)
        const configIndex = Math.min(waveNumber - 1, this.waveConfigs.length - 1);
        const config = this.waveConfigs[configIndex];
        
        this.currentWave = new WaveInstance(config, waveNumber);
        return this.currentWave;
    },
    
    /**
     * Obtiene información de una ola
     * @param {number} waveNumber 
     * @returns {Object}
     */
    getWaveInfo: function(waveNumber) {
        const configIndex = Math.min(waveNumber - 1, this.waveConfigs.length - 1);
        const config = this.waveConfigs[configIndex];
        
        let totalEnemies = 0;
        for (const group of config.enemies) {
            totalEnemies += group.count;
        }
        
        return {
            number: waveNumber,
            totalEnemies: totalEnemies,
            isBossWave: (waveNumber % 5 === 0)
        };
    }
};

/**
 * Instancia de ola
 */
class WaveInstance {
    constructor(config, waveNumber) {
        this.config = config;
        this.waveNumber = waveNumber;
        this.active = true;
        this.completed = false;
        
        // Preparar lista de enemigos a spawnear
        this.spawnQueue = [];
        for (const group of config.enemies) {
            for (let i = 0; i < group.count; i++) {
                this.spawnQueue.push({
                    type: group.type,
                    interval: group.interval,
                    delay: i * group.interval
                });
            }
        }
        
        // Ordenar por delay
        this.spawnQueue.sort((a, b) => a.delay - b.delay);
        
        this.spawnTimer = 0;
        this.enemiesSpawned = 0;
    }
    
    /**
     * Actualiza la ola
     * @param {number} deltaTime 
     */
    update(deltaTime) {
        if (!this.active || this.completed) return;
        
        this.spawnTimer += deltaTime;
        
        // Verificar si hay enemigos para spawnear
        if (this.enemiesSpawned < this.spawnQueue.length) {
            const nextEnemy = this.spawnQueue[this.enemiesSpawned];
            
            if (this.spawnTimer >= nextEnemy.delay) {
                this.spawnEnemy(nextEnemy.type);
                this.enemiesSpawned++;
            }
        } else {
            // Verificar si todos los enemigos murieron
            this.checkCompletion();
        }
    }
    
    /**
     * Spawnea un enemigo
     * @param {string} type 
     */
    spawnEnemy(type) {
        // Obtener camino del mapa (placeholder)
        const path = this.getMapPath();
        
        if (path && path.length > 0) {
            const enemy = Enemy.create(type, path);
            Engine.addEntity(enemy);
        }
    }
    
    /**
     * Obtiene el camino del mapa
     * @returns {Array}
     */
    getMapPath() {
        // Placeholder - implementar según el mapa
        return [
            { x: 0, y: 300 },
            { x: 200, y: 300 },
            { x: 200, y: 150 },
            { x: 400, y: 150 },
            { x: 400, y: 450 },
            { x: 600, y: 450 },
            { x: 600, y: 300 },
            { x: 800, y: 300 }
        ];
    }
    
    /**
     * Verifica si la ola está completa
     */
    checkCompletion() {
        const enemies = Engine.getEntitiesByType(EnemyInstance);
        const activeEnemies = enemies.filter(e => e.active);
        
        if (activeEnemies.length === 0) {
            this.complete();
        }
    }
    
    /**
     * Called when wave is completed
     */
    complete() {
        this.completed = true;
        this.active = false;
        
        console.log(`Wave ${this.waveNumber} completed!`);
        
        // Notificar al juego
        if (typeof Game !== 'undefined') {
            Game.completeWave();
        }
    }
}
