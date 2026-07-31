/**
 * Ejemplo de Configuración Personalizada de Oleadas
 * 
 * Copia este archivo y modifícalo para personalizar tu juego.
 * No edits waveConfig.js directamente, usa este como plantilla.
 * 
 * @module config/waveConfig.example
 */

import { waveConfig as baseConfig } from './waveConfig.js';

// Crear una copia modificable de la configuración base
export const customWaveConfig = {
    // === TIEMPOS BÁSICOS ===
    
    /** Tiempo entre oleadas (segundos) */
    pauseBetweenWaves: 10,        // Más tiempo para estrategia
    
    /** Delay antes de la primera oleada */
    initialDelay: 5,              // Tiempo para prepararse
    
    /** Intervalos de spawn dentro de una oleada */
    minSpawnInterval: 0.3,        // Spawn más rápido
    maxSpawnInterval: 1.5,
    
    // === DIFICULTAD ===
    
    /** Factor de escalado (1.0 = normal, >1.0 = más difícil) */
    difficultyScalingFactor: 1.3, // Aumenta 30% por oleada
    
    /** Máximo de oleadas (0 = infinito) */
    maxWaves: 20,                 // Juego con fin definido
    
    // === OLEADAS PERSONALIZADAS ===
    
    waves: [
        // Oleada 1: Tutorial
        {
            waveNumber: 1,
            enemyCount: 3,
            spawnInterval: { min: 2.0, max: 3.0 },
            types: ['basic']
        },
        // Oleada 2: Introducción
        {
            waveNumber: 2,
            enemyCount: 5,
            spawnInterval: { min: 1.5, max: 2.5 },
            types: ['basic']
        },
        // Oleada 3: Primer desafío
        {
            waveNumber: 3,
            enemyCount: 8,
            spawnInterval: { min: 1.0, max: 2.0 },
            types: ['basic', 'fast']
        },
        // Oleada 4: Mezcla
        {
            waveNumber: 4,
            enemyCount: 10,
            spawnInterval: { min: 0.8, max: 1.5 },
            types: ['basic', 'fast']
        },
        // Oleada 5: Boss wave (tanques)
        {
            waveNumber: 5,
            enemyCount: 6,
            spawnInterval: { min: 1.5, max: 2.5 },
            types: ['tank', 'basic']
        },
        // Oleada 6-10: Progresión
        {
            waveNumber: 6,
            enemyCount: 15,
            spawnInterval: { min: 0.6, max: 1.2 },
            types: ['basic', 'fast', 'tank']
        },
        {
            waveNumber: 7,
            enemyCount: 18,
            spawnInterval: { min: 0.5, max: 1.0 },
            types: ['basic', 'fast', 'tank']
        },
        {
            waveNumber: 8,
            enemyCount: 20,
            spawnInterval: { min: 0.5, max: 0.9 },
            types: ['basic', 'fast', 'tank']
        },
        {
            waveNumber: 9,
            enemyCount: 22,
            spawnInterval: { min: 0.4, max: 0.8 },
            types: ['basic', 'fast', 'tank']
        },
        {
            waveNumber: 10,
            enemyCount: 25,
            spawnInterval: { min: 0.3, max: 0.7 },
            types: ['basic', 'fast', 'tank', 'elite']
        }
    ],
    
    // === CONFIGURACIÓN PARA OLEADAS NO DEFINIDAS ===
    
    defaultWave: {
        enemyCount: 15,
        spawnInterval: { min: 0.4, max: 0.8 },
        types: ['basic', 'fast', 'tank']
    },
    
    enemiesPerWaveIncrement: 3,   // +3 enemigos por oleada extra
    spawnIntervalReduction: 0.03  // -0.03s de intervalo por oleada
};

// Función personalizada que usa la configuración custom
export function getCustomWaveConfig(waveNumber) {
    const specificWave = customWaveConfig.waves.find(w => w.waveNumber === waveNumber);
    
    if (specificWave) {
        return { ...specificWave };
    }

    const wavesAfterDefined = waveNumber - customWaveConfig.waves.length;
    const baseEnemyCount = customWaveConfig.defaultWave.enemyCount + 
                          (wavesAfterDefined * customWaveConfig.enemiesPerWaveIncrement);
    
    const minInterval = Math.max(
        0.2,
        customWaveConfig.defaultWave.spawnInterval.min - 
        (wavesAfterDefined * customWaveConfig.spawnIntervalReduction)
    );
    
    const maxInterval = Math.max(
        0.3,
        customWaveConfig.defaultWave.spawnInterval.max - 
        (wavesAfterDefined * customWaveConfig.spawnIntervalReduction)
    );

    return {
        waveNumber,
        enemyCount: Math.floor(
            baseEnemyCount * Math.pow(
                customWaveConfig.difficultyScalingFactor, 
                Math.max(0, wavesAfterDefined)
            )
        ),
        spawnInterval: { min: minInterval, max: maxInterval },
        types: [...customWaveConfig.defaultWave.types]
    };
}

// Exportar todo para facilitar el uso
export const waveConfig = customWaveConfig;
export const hasMoreWaves = (currentWave) => {
    if (customWaveConfig.maxWaves === 0) return true;
    return currentWave < customWaveConfig.maxWaves;
};
