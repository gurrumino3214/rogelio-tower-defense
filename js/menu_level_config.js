/**
 * ==========================================
 * CONFIGURACIÓN DE NIVELES - 50 NIVELES
 * ==========================================
 */

// Configuración base para los 50 niveles
function getLevelConfig(level) {
    // Generar semilla única para el mapa basado en el nivel
    const mapSeed = level * 12345;
    
    // Determinar tipo de dificultad según rango de niveles
    let difficultyType, startMoney, enemyHealthMult, enemySpeedMult, bossEveryWave;
    
    if (level >= 41) {
        // Nivel 41-50: EXTREME - Boss en cada ronda, más vida y velocidad
        difficultyType = 'extreme';
        startMoney = 150;
        enemyHealthMult = 2.0;
        enemySpeedMult = 1.5;
        bossEveryWave = true;
    } else if (level >= 31) {
        // Nivel 31-40: HARD - Enemigos 50% más rápidos y con más vida
        difficultyType = 'hard';
        startMoney = 120;
        enemyHealthMult = 1.8;
        enemySpeedMult = 1.5;
        bossEveryWave = false;
    } else if (level >= 21) {
        // Nivel 21-30: MEDIUM - Enemigos con más vida
        difficultyType = 'medium';
        startMoney = 100;
        enemyHealthMult = 1.5;
        enemySpeedMult = 1.0;
        bossEveryWave = false;
    } else if (level >= 11) {
        // Nivel 11-20: EASY - Mitad de dinero generado
        difficultyType = 'easy';
        startMoney = 50; // Mitad del dinero inicial normal
        enemyHealthMult = 1.0;
        enemySpeedMult = 1.0;
        bossEveryWave = false;
    } else {
        // Nivel 1-10: NORMAL
        difficultyType = 'normal';
        startMoney = 100;
        enemyHealthMult = 1.0;
        enemySpeedMult = 1.0;
        bossEveryWave = false;
    }
    
    return {
        level: level,
        mapSeed: mapSeed,
        difficultyType: difficultyType,
        startMoney: startMoney,
        enemyHealthMult: enemyHealthMult,
        enemySpeedMult: enemySpeedMult,
        bossEveryWave: bossEveryWave,
        // Duración estimada: 1-3 minutos por nivel
        estimatedDuration: 60 + (level % 3) * 60 // 60s, 120s, o 180s
    };
}

// Hacer disponible globalmente
window.getLevelConfig = getLevelConfig;
