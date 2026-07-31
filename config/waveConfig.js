/**
 * Configuración de Oleadas (Waves Configuration)
 * 
 * Archivo centralizado para configurar todo el sistema de oleadas.
 * Permite ajustar dificultad, cantidad de enemigos, intervalos y tiempos.
 * 
 * @module config/waveConfig
 */

export const waveConfig = {
    /**
     * Tiempo de espera entre oleadas (en segundos)
     */
    pauseBetweenWaves: 5,

    /**
     * Tiempo inicial antes de la primera oleada (en segundos)
     */
    initialDelay: 3,

    /**
     * Duración mínima entre spawns dentro de una oleada (en segundos)
     */
    minSpawnInterval: 0.5,

    /**
     * Duración máxima entre spawns dentro de una oleada (en segundos)
     */
    maxSpawnInterval: 2.0,

    /**
     * Factor de escalado de dificultad por oleada
     * Se multiplica por el número de oleada para aumentar la dificultad
     */
    difficultyScalingFactor: 1.2,

    /**
     * Número máximo de oleadas (0 = infinito)
     */
    maxWaves: 0,

    /**
     * Configuración base de enemigos por oleada
     * Cada oleada puede tener su propia configuración
     */
    waves: [
        {
            waveNumber: 1,
            enemyCount: 5,
            spawnInterval: { min: 1.0, max: 2.0 },
            types: ['basic']
        },
        {
            waveNumber: 2,
            enemyCount: 8,
            spawnInterval: { min: 0.8, max: 1.5 },
            types: ['basic']
        },
        {
            waveNumber: 3,
            enemyCount: 10,
            spawnInterval: { min: 0.7, max: 1.2 },
            types: ['basic', 'fast']
        },
        {
            waveNumber: 4,
            enemyCount: 12,
            spawnInterval: { min: 0.6, max: 1.0 },
            types: ['basic', 'fast']
        },
        {
            waveNumber: 5,
            enemyCount: 15,
            spawnInterval: { min: 0.5, max: 0.9 },
            types: ['basic', 'fast', 'tank']
        }
    ],

    /**
     * Configuración por defecto para oleadas no definidas explícitamente
     * Se usa cuando el número de oleada excede las definidas en el array waves
     */
    defaultWave: {
        enemyCount: 10,
        spawnInterval: { min: 0.5, max: 1.0 },
        types: ['basic']
    },

    /**
     * Incremento de enemigos por oleada después de las configuradas
     * Se suma a enemyCount de defaultWave por cada oleada adicional
     */
    enemiesPerWaveIncrement: 2,

    /**
     * Reducción del intervalo de spawn por oleada (mínimo 0.2s)
     * Se resta a los intervalos de defaultWave por cada oleada adicional
     */
    spawnIntervalReduction: 0.05
};

/**
 * Obtiene la configuración específica para una oleada
 * 
 * @param {number} waveNumber - Número de la oleada (1-based)
 * @returns {Object} Configuración de la oleada
 */
export function getWaveConfig(waveNumber) {
    // Buscar configuración específica para esta oleada
    const specificWave = waveConfig.waves.find(w => w.waveNumber === waveNumber);
    
    if (specificWave) {
        return { ...specificWave };
    }

    // Usar configuración por defecto con escalado
    const wavesAfterDefined = waveNumber - waveConfig.waves.length;
    const baseEnemyCount = waveConfig.defaultWave.enemyCount + (wavesAfterDefined * waveConfig.enemiesPerWaveIncrement);
    
    const minInterval = Math.max(
        0.2,
        waveConfig.defaultWave.spawnInterval.min - (wavesAfterDefined * waveConfig.spawnIntervalReduction)
    );
    
    const maxInterval = Math.max(
        0.3,
        waveConfig.defaultWave.spawnInterval.max - (wavesAfterDefined * waveConfig.spawnIntervalReduction)
    );

    return {
        waveNumber,
        enemyCount: Math.floor(baseEnemyCount * Math.pow(waveConfig.difficultyScalingFactor, Math.max(0, wavesAfterDefined))),
        spawnInterval: { min: minInterval, max: maxInterval },
        types: [...waveConfig.defaultWave.types]
    };
}

/**
 * Verifica si hay más oleadas disponibles
 * 
 * @param {number} currentWave - Número de la oleada actual
 * @returns {boolean} True si hay más oleadas
 */
export function hasMoreWaves(currentWave) {
    if (waveConfig.maxWaves === 0) {
        return true; // Infinitas oleadas
    }
    return currentWave < waveConfig.maxWaves;
}
