/**
 * ==========================================
 * CONFIGURACIÓN DE NIVELES - 50 NIVELES
 * ==========================================
 * Cada nivel tiene su propio mapa, camino, dificultad y configuración.
 */

// Generador de caminos procedurales basado en semilla
function generatePathForLevel(level) {
    // Usar una semilla única para cada nivel
    const seed = level * 12345;
    
    // Función pseudo-aleatoria determinista basada en la semilla
    let random = seed;
    function nextRandom() {
        random = (random * 9301 + 49297) % 233280;
        return random / 233280;
    }
    
    // Dimensiones del mundo
    const ww = worldWidth;
    const wh = worldHeight;
    
    // Diferentes patrones de camino según el nivel
    const pattern = level % 10;
    
    switch(pattern) {
        case 0: // Ruta en S suave
            return [
                {x: 0, y: wh * 0.3},
                {x: ww * 0.2, y: wh * 0.3},
                {x: ww * 0.2, y: wh * 0.6},
                {x: ww * 0.5, y: wh * 0.6},
                {x: ww * 0.5, y: wh * 0.3},
                {x: ww * 0.8, y: wh * 0.3},
                {x: ww * 0.8, y: wh * 0.7},
                {x: ww, y: wh * 0.7}
            ];
        
        case 1: // Zigzag
            return [
                {x: 0, y: wh * 0.2},
                {x: ww * 0.15, y: wh * 0.5},
                {x: ww * 0.3, y: wh * 0.2},
                {x: ww * 0.45, y: wh * 0.5},
                {x: ww * 0.6, y: wh * 0.2},
                {x: ww * 0.75, y: wh * 0.5},
                {x: ww * 0.9, y: wh * 0.2},
                {x: ww, y: wh * 0.5}
            ];
        
        case 2: // Ruta en U
            return [
                {x: 0, y: wh * 0.25},
                {x: ww * 0.3, y: wh * 0.25},
                {x: ww * 0.3, y: wh * 0.75},
                {x: ww * 0.7, y: wh * 0.75},
                {x: ww * 0.7, y: wh * 0.25},
                {x: ww * 0.85, y: wh * 0.25},
                {x: ww * 0.85, y: wh * 0.6},
                {x: ww, y: wh * 0.6}
            ];
        
        case 3: // Ruta larga con curvas
            return [
                {x: 0, y: wh * 0.5},
                {x: ww * 0.1, y: wh * 0.3},
                {x: ww * 0.2, y: wh * 0.7},
                {x: ww * 0.3, y: wh * 0.4},
                {x: ww * 0.4, y: wh * 0.6},
                {x: ww * 0.5, y: wh * 0.3},
                {x: ww * 0.7, y: wh * 0.5},
                {x: ww, y: wh * 0.7}
            ];
        
        case 4: // Ruta en espiral parcial
            return [
                {x: 0, y: wh * 0.4},
                {x: ww * 0.25, y: wh * 0.4},
                {x: ww * 0.25, y: wh * 0.6},
                {x: ww * 0.5, y: wh * 0.6},
                {x: ww * 0.5, y: wh * 0.3},
                {x: ww * 0.75, y: wh * 0.3},
                {x: ww * 0.75, y: wh * 0.7},
                {x: ww, y: wh * 0.7}
            ];
        
        case 5: // Ruta con bifurcación simulada (camino más largo)
            return [
                {x: 0, y: wh * 0.35},
                {x: ww * 0.2, y: wh * 0.35},
                {x: ww * 0.2, y: wh * 0.5},
                {x: ww * 0.4, y: wh * 0.5},
                {x: ww * 0.4, y: wh * 0.2},
                {x: ww * 0.6, y: wh * 0.2},
                {x: ww * 0.6, y: wh * 0.65},
                {x: ww, y: wh * 0.65}
            ];
        
        case 6: // Ruta diagonal con paradas
            return [
                {x: 0, y: wh * 0.2},
                {x: ww * 0.15, y: wh * 0.35},
                {x: ww * 0.15, y: wh * 0.5},
                {x: ww * 0.35, y: wh * 0.5},
                {x: ww * 0.35, y: wh * 0.65},
                {x: ww * 0.65, y: wh * 0.65},
                {x: ww * 0.65, y: wh * 0.8},
                {x: ww, y: wh * 0.8}
            ];
        
        case 7: // Ruta en forma de M
            return [
                {x: 0, y: wh * 0.7},
                {x: ww * 0.15, y: wh * 0.3},
                {x: ww * 0.3, y: wh * 0.5},
                {x: ww * 0.45, y: wh * 0.2},
                {x: ww * 0.55, y: wh * 0.5},
                {x: ww * 0.7, y: wh * 0.3},
                {x: ww * 0.85, y: wh * 0.6},
                {x: ww, y: wh * 0.4}
            ];
        
        case 8: // Ruta serpenteante
            return [
                {x: 0, y: wh * 0.45},
                {x: ww * 0.12, y: wh * 0.25},
                {x: ww * 0.25, y: wh * 0.55},
                {x: ww * 0.38, y: wh * 0.35},
                {x: ww * 0.5, y: wh * 0.65},
                {x: ww * 0.63, y: wh * 0.4},
                {x: ww * 0.75, y: wh * 0.6},
                {x: ww, y: wh * 0.5}
            ];
        
        case 9: // Ruta clásica con giros
        default:
            return [
                {x: 0, y: wh * 0.17},
                {x: ww * 0.25, y: wh * 0.17},
                {x: ww * 0.25, y: wh * 0.67},
                {x: ww * 0.625, y: wh * 0.67},
                {x: ww * 0.625, y: wh * 0.33},
                {x: ww * 0.875, y: wh * 0.33},
                {x: ww * 0.875, y: wh * 0.83},
                {x: ww, y: wh * 0.83}
            ];
    }
}

// Configuración base para los 50 niveles
function getLevelConfig(level) {
    // Generar semilla única para el mapa basado en el nivel
    const mapSeed = level * 12345;
    
    // Cantidad total de enemigos a derrotar en este nivel (NO por wave, es el TOTAL del nivel)
    // Escalado progresivo para mayor duración en niveles altos
    let enemyCount;
    if (level <= 10) {
        enemyCount = 10 + (level - 1) * 5; // 10-55 enemigos (~1 min)
    } else if (level <= 20) {
        enemyCount = 55 + (level - 10) * 8; // 63-135 enemigos (~2 min)
    } else if (level <= 30) {
        enemyCount = 135 + (level - 20) * 10; // 145-235 enemigos (~3 min)
    } else if (level <= 40) {
        enemyCount = 235 + (level - 30) * 12; // 247-355 enemigos (~4 min)
    } else {
        enemyCount = 355 + (level - 40) * 15; // 370-505 enemigos (~5 min)
    }
    
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
    
    // Generar path específico para este nivel
    const path = generatePathForLevel(level);
    
    return {
        level: level,
        mapSeed: mapSeed,
        difficultyType: difficultyType,
        startMoney: startMoney,
        enemyHealthMult: enemyHealthMult,
        enemySpeedMult: enemySpeedMult,
        bossEveryWave: bossEveryWave,
        enemyCount: enemyCount,  // CANTIDAD TOTAL DE ENEMIGOS A DERROTAR EN ESTE NIVEL
        path: path,  // CAMINO ÚNICO PARA ESTE NIVEL
        spawnPoint: path[0],  // Punto de aparición
        basePoint: path[path.length - 1],  // Punto base
        // Duración estimada: aumenta progresivamente
        estimatedDuration: Math.min(60 + Math.floor((level - 1) / 10) * 60, 300) // 60s a 300s
    };
}

// Hacer disponible globalmente
window.getLevelConfig = getLevelConfig;
window.generatePathForLevel = generatePathForLevel;
