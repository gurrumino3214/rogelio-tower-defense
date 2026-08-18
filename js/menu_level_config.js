/**
 * ==========================================
 * CONFIGURACIÓN DE NIVELES - 50 NIVELES
 * ==========================================
 * Cada nivel tiene su propio mapa, camino, dificultad y configuración.
 */

// Generador de caminos procedurales basado en semilla
// NOTA: worldWidth y worldHeight se pasan como parámetros para evitar problemas de orden de carga
function generatePathForLevel(level, ww, wh) {
    // Valores por defecto si no se proporcionan
    ww = ww || 2048;
    wh = wh || 1536;
    
    // Usar una semilla única para cada nivel
    const seed = level * 12345;
    
    // Función pseudo-aleatoria determinista basada en la semilla
    let random = seed;
    function nextRandom() {
        random = (random * 9301 + 49297) % 233280;
        return random / 233280;
    }
    
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
    
    // Generar path específico para este nivel (pasar dimensiones por defecto)
    const path = generatePathForLevel(level, 2048, 1536);
    
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

// ==========================================
// VALIDACIÓN DE LOS 50 NIVELES
// ==========================================
function validateAllLevels() {
    console.log('[VALIDATION] Validando los 50 niveles...');
    let errors = [];
    let warnings = [];
    
    for (let level = 1; level <= 50; level++) {
        try {
            const config = getLevelConfig(level);
            
            // Verificar propiedades requeridas
            if (!config.level) errors.push(`Nivel ${level}: falta 'level'`);
            if (!config.path || config.path.length === 0) errors.push(`Nivel ${level}: falta 'path' o está vacío`);
            if (!config.spawnPoint) errors.push(`Nivel ${level}: falta 'spawnPoint'`);
            if (!config.basePoint) errors.push(`Nivel ${level}: falta 'basePoint'`);
            if (!config.enemyCount || config.enemyCount <= 0) errors.push(`Nivel ${level}: enemyCount inválido`);
            if (!config.difficultyType) errors.push(`Nivel ${level}: falta 'difficultyType'`);
            if (config.startMoney === undefined) errors.push(`Nivel ${level}: falta 'startMoney'`);
            
            // Verificar que el path tenga al menos 2 waypoints
            if (config.path && config.path.length < 2) {
                errors.push(`Nivel ${level}: path debe tener al menos 2 waypoints`);
            }
            
            // Verificar que cada waypoint tenga x e y
            if (config.path) {
                for (let i = 0; i < config.path.length; i++) {
                    if (config.path[i].x === undefined || config.path[i].y === undefined) {
                        errors.push(`Nivel ${level}: waypoint ${i} no tiene coordenadas x,y`);
                    }
                }
            }
            
            // Verificar que los paths sean diferentes entre niveles consecutivos
            if (level > 1) {
                const prevConfig = getLevelConfig(level - 1);
                if (JSON.stringify(config.path) === JSON.stringify(prevConfig.path)) {
                    warnings.push(`Nivel ${level}: tiene el mismo path que el nivel ${level - 1}`);
                }
            }
            
            console.log(`[VALIDATION] Nivel ${level}: OK - ${config.enemyCount} enemigos, path con ${config.path.length} waypoints`);
            
        } catch (e) {
            errors.push(`Nivel ${level}: Error al obtener configuración - ${e.message}`);
        }
    }
    
    if (errors.length > 0) {
        console.error('[VALIDATION] ERRORES ENCONTRADOS:');
        errors.forEach(err => console.error('  - ' + err));
    }
    
    if (warnings.length > 0) {
        console.warn('[VALIDATION] ADVERTENCIAS:');
        warnings.forEach(warn => console.warn('  - ' + warn));
    }
    
    if (errors.length === 0 && warnings.length === 0) {
        console.log('[VALIDATION] Todos los niveles son válidos!');
    }
    
    return { errors, warnings, valid: errors.length === 0 };
}

// Hacer validateAllLevels disponible globalmente
window.validateAllLevels = validateAllLevels;
