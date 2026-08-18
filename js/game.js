// ==========================================
// ROGELIO TOWER DEFENSE - GAME.JS
// Versión Auditada y Reparada
// ==========================================

// ==========================================
// SISTEMA DE RESOLUCIÓN Y ESCALADO RESPONSIVE
// ==========================================
// Resolución interna base del juego (fixed internal resolution)
const INTERNAL_WIDTH = 1280;
const INTERNAL_HEIGHT = 720;
const INTERNAL_ASPECT_RATIO = INTERNAL_WIDTH / INTERNAL_HEIGHT;

// Variables de escalado
let displayWidth = 0;
let displayHeight = 0;
let scaleX = 1;
let scaleY = 1;
let scale = 1;
let offsetX = 0;
let offsetY = 0;

// Configuración del juego
let canvas, ctx;
// gameState se define en menu.js para compartir entre archivos
let lastTime = 0;
let gameSpeed = 1;
let gameStartTime = 0;
let timePlayedSession = 0; // Tiempo jugado en sesión actual (segundos)
let lastTimePlayedUpdate = 0;

// ==========================================
// SISTEMA DE ENEMIGOS POR NIVEL (SIN WAVES)
// ==========================================
const LevelEnemyManager = {
    totalEnemies: 0,        // Total de enemigos que debe tener el nivel
    enemiesSpawned: 0,      // Cantidad de enemigos ya generados
    enemiesDefeated: 0,     // Cantidad de enemigos derrotados
    spawnTimer: 0,
    spawnInterval: 2000,    // Intervalo entre spawns (ms) - se ajusta según nivel
    active: false,
    bossSpawned: false,
    bossDefeated: false,
    level: 1,
    
    startLevel: function(levelNum, enemyCount) {
        this.level = levelNum;
        this.totalEnemies = enemyCount;
        this.enemiesSpawned = 0;
        this.enemiesDefeated = 0;
        this.active = true;
        this.bossSpawned = false;
        this.bossDefeated = false;
        this.spawnTimer = 0;
        
        // Ajustar spawnInterval según la duración objetivo del nivel
        // Niveles 1-10: ~60s, niveles 11-20: ~120s, etc.
        let targetDuration;
        if (levelNum <= 10) targetDuration = 60;
        else if (levelNum <= 20) targetDuration = 120;
        else if (levelNum <= 30) targetDuration = 180;
        else if (levelNum <= 40) targetDuration = 240;
        else targetDuration = 300;
        
        // Calcular intervalo para distribuir los enemigos en la duración objetivo
        // Dejar un 10% de margen para el boss final
        const effectiveEnemies = Math.max(1, enemyCount - 1);
        this.spawnInterval = Math.max(500, (targetDuration * 1000 * 0.9) / effectiveEnemies);
        
        console.log('[LEVEL] Nivel ' + levelNum + ' iniciado. Enemigos totales: ' + this.totalEnemies + ', Spawn interval: ' + this.spawnInterval.toFixed(0) + 'ms');
    },
    
    update: function(deltaTime) {
        if (!this.active) return false;

        // Verificar si todos los enemigos fueron derrotados (CONDICIÓN DE VICTORIA)
        if (this.enemiesDefeated >= this.totalEnemies && this.enemiesSpawned >= this.totalEnemies) {
            this.active = false;
            this.completeLevel();
            return true;
        }

        // Spawnear enemigos hasta alcanzar el total
        if (this.enemiesSpawned < this.totalEnemies && !this.bossSpawned) {
            this.spawnTimer += deltaTime * gameSpeed;
            if (this.spawnTimer >= this.spawnInterval) {
                this.spawnTimer = 0;
                this.spawnNormalEnemy();
                this.enemiesSpawned++;
            }
        } else if (!this.bossSpawned && this.enemiesSpawned >= this.totalEnemies) {
            // Ya se generaron todos los enemigos normales
            this.bossSpawned = true;
        }

        return false;
    },
    
    spawnNormalEnemy: function() {
        let enemyType = getEnemyTypeForLevel(this.level, this.enemiesSpawned);
        createEnemy(enemyType);
    },
    
    completeLevel: function() {
        console.log('[LEVEL] Nivel ' + this.level + ' completado! Enemigos derrotados: ' + this.enemiesDefeated);
        
        // Guardar estadísticas
        const stats = JSON.parse(localStorage.getItem('rogelioTD_stats') || '{}');
        if (!stats.maxLevel || this.level > stats.maxLevel) {
            stats.maxLevel = this.level;
            localStorage.setItem('rogelioTD_stats', JSON.stringify(stats));
        }
        
        // Mostrar pantalla de victoria
        showVictoryScreen(this.level);
    },
    
    enemyDefeated: function() {
        this.enemiesDefeated++;
    },
    
    enemyEscaped: function() {
        // Los enemigos que escapan NO cuentan como derrotados
        // Solo restan vidas
    }
};

// Variables globales del juego
let player = {
    money: 100,
    lives: 10,
    currentLevel: 1,
    enemiesDefeated: 0
};

// Entidades
let towers = [];
let enemies = [];
let bullets = [];
let particles = []; // Declarar particles para evitar errores

// Torre seleccionada para mejorar
let selectedTower = null;

// Sistema de fusión de torres
let fusionAvailable = false;
let fusionTowers = []; // Las 5 torres que se pueden fusionar

// Sistema de selección de tipo de torre
let showTowerTypeMenu = false;
let pendingTowerPosition = null;

// Tipos de torres disponibles
let selectedTowerType = null; // Torre seleccionada actualmente para colocar
const TOWER_TYPES = [
    { 
        id: 'basic', 
        name: 'Torre Básica', 
        cost: 50, 
        damage: 25, 
        fireRate: 1000, 
        range: 150, 
        color: '#8B4513', // Café - se deja como está
        description: 'Daño moderado, velocidad media'
    },
    { 
        id: 'rapid', 
        name: 'Torre Rápida', 
        cost: 75, 
        damage: 15, 
        fireRate: 500, 
        range: 120, 
        color: '#2196F3', // Azul
        description: 'Bajo daño, alta velocidad'
    },
    { 
        id: 'sniper', 
        name: 'Torre Francotirador', 
        cost: 100, 
        damage: 100, 
        fireRate: 2000, 
        range: 300, 
        color: '#FFD700', // Amarillo
        description: 'Alto daño, lento, largo alcance'
    }
];

// Sistema de boss Rogelio
let bossRogelio = null;
let bossActive = false;
let bossHealthBarVisible = false;
let screenShakeIntensity = 0;
let roglioAppearedText = '';
let roglioAppearedAlpha = 0;

// Tamaño del mundo (más grande que el viewport)
let worldWidth = 2048;
let worldHeight = 1536;

// ==========================================
// SISTEMA DE CÁMARA
// ==========================================
let camera = {
    x: 0,
    y: 0,
    zoom: 1.0,  // Zoom a pantalla completa para que el mapa se vea completo
    width: 0,
    height: 0
};

function initCamera() {
    camera.width = canvas.width / camera.zoom;
    camera.height = canvas.height / camera.zoom;
    // Centrar cámara inicialmente para mostrar todo el mapa
    camera.x = (worldWidth - camera.width) / 2;
    camera.y = (worldHeight - camera.height) / 2;
}

// Convertir coordenadas del mundo a coordenadas de pantalla (ahora es directo porque scale=1, offsetX=0, offsetY=0)
function worldToScreen(worldX, worldY) {
    return {
        x: (worldX - camera.x),
        y: (worldY - camera.y)
    };
}

// Convertir coordenadas de pantalla a coordenadas del mundo (ahora es directo porque scale=1, offsetX=0, offsetY=0)
function screenToWorld(screenX, screenY) {
    return {
        x: screenX + camera.x,
        y: screenY + camera.y
    };
}

// Verificar si un objeto está dentro del viewport (frustum culling)
function isInViewport(x, y, width, height) {
    const padding = 100; // Margen extra para evitar parpadeo
    return x + width > camera.x - padding &&
           x < camera.x + camera.width + padding &&
           y + height > camera.y - padding &&
           y < camera.y + camera.height + padding;
}

// Decoraciones del mapa (posición fija en coordenadas del mundo)
let decorations = [];

function initDecorations(mapSeed) {
    decorations = [];
    const tileSize = 64;
    
    // Generar decoraciones con posiciones consistentes usando semilla
    const positions = [
        {type: 'tree', x: 200, y: 150}, {type: 'tree_alt', x: 250, y: 180},
        {type: 'bush', x: 400, y: 300}, {type: 'bush_alt', x: 450, y: 320},
        {type: 'rock', x: 600, y: 500}, {type: 'rock_alt', x: 650, y: 520},
        {type: 'flower', x: 800, y: 700}, {type: 'flower_alt', x: 850, y: 720},
        {type: 'tree', x: 1000, y: 200}, {type: 'tree_alt', x: 1100, y: 250},
        {type: 'bush', x: 1200, y: 400}, {type: 'bush_alt', x: 1300, y: 450},
        {type: 'rock', x: 1400, y: 600}, {type: 'rock_alt', x: 1500, y: 650},
        {type: 'flower', x: 1600, y: 800}, {type: 'flower_alt', x: 1700, y: 850},
        {type: 'tree', x: 300, y: 900}, {type: 'tree_alt', x: 400, y: 950},
        {type: 'bush', x: 500, y: 1000}, {type: 'bush_alt', x: 600, y: 1050},
        {type: 'rock', x: 700, y: 1100}, {type: 'rock_alt', x: 800, y: 1150},
        {type: 'flower', x: 900, y: 1200}, {type: 'flower_alt', x: 1000, y: 1250}
    ];
    
    for (let i = 0; i < positions.length; i++) {
        const pos = positions[i];
        decorations.push({
            type: pos.type,
            x: pos.x,
            y: pos.y,
            width: tileSize,
            height: tileSize,
            layer: Math.floor(pos.y / 100) // Para ordenamiento Z basado en Y
        });
    }
    
    // Ordenar decoraciones por capa y posición Y para efecto de profundidad
    decorations.sort((a, b) => (a.layer - b.layer) || (a.y - b.y));
}

// Camino (waypoints) - En coordenadas del mundo
let path = [];

function initPath(levelNum) {
    // El camino ahora usa coordenadas del mundo, no del canvas
    // Si se proporciona un nivel, usar el path generado para ese nivel
    if (levelNum && typeof generatePathForLevel === 'function') {
        // Pasar las dimensiones del mundo a generatePathForLevel
        path = generatePathForLevel(levelNum, worldWidth, worldHeight);
        console.log('[PATH] Path generado para nivel', levelNum, ':', path.length, 'waypoints');
    } else {
        // Path por defecto (nivel 1 clásico)
        path = [
            {x: 0, y: worldHeight * 0.17},
            {x: worldWidth * 0.25, y: worldHeight * 0.17},
            {x: worldWidth * 0.25, y: worldHeight * 0.67},
            {x: worldWidth * 0.625, y: worldHeight * 0.67},
            {x: worldWidth * 0.625, y: worldHeight * 0.33},
            {x: worldWidth * 0.875, y: worldHeight * 0.33},
            {x: worldWidth * 0.875, y: worldHeight * 0.83},
            {x: worldWidth, y: worldHeight * 0.83}
        ];
    }
}

// ==========================================
// INICIALIZACION
// ==========================================
// NOTA: La inicialización ahora se hace desde index.html
// para asegurar que el menú se cargue primero
function initGame() {
    canvas = document.getElementById('gameCanvas');
    ctx = canvas.getContext('2d');
    
    // Hacer canvas y ctx disponibles globalmente para story.js
    window.canvas = canvas;
    window.ctx = ctx;
    
    // Configurar Canvas para pixel art nítido
    ctx.imageSmoothingEnabled = false;
    ctx.mozImageSmoothingEnabled = false;
    ctx.webkitImageSmoothingEnabled = false;
    ctx.msImageSmoothingEnabled = false;
    
    // Ajustar canvas al tamaño de la ventana
    resizeCanvas();
    window.addEventListener('resize', resizeCanvas);
    
    // Event listeners
    canvas.addEventListener('click', handleClick);
    canvas.addEventListener('mousedown', handleMouseDown);
    
    // Inicializar cámara y decoraciones
    initCamera();
    initDecorations();
    
    console.log('[GAME] Sistema de juego inicializado!');
}

// Hacer initGame disponible globalmente para index.html
window.initGame = initGame;

// Hacer startGame disponible globalmente para menu.js
window.startGame = startGame;

/**
 * Sistema responsive de escalado con letterboxing/pillarboxing
 * Mantiene la relación de aspecto interna sin deformar
 */
function resizeCanvas() {
    // Obtener tamaño de ventana disponible
    displayWidth = window.innerWidth;
    displayHeight = window.innerHeight;
    
    // Establecer tamaño del canvas al tamaño de la ventana
    canvas.width = displayWidth;
    canvas.height = displayHeight;
    
    // Forzar escala 1:1 para pantalla completa sin letterboxing
    scale = 1;
    offsetX = 0;
    offsetY = 0;
    
    // Actualizar cámara con las nuevas dimensiones internas
    initPath();
    initCamera();
    
    console.log('[GAME] Canvas redimensionado:', displayWidth, 'x', displayHeight, 
                '| Scale:', scale.toFixed(2), '| Offset:', offsetX.toFixed(0), offsetY.toFixed(0));
}

// Hacer resizeCanvas disponible globalmente para menu.js
window.resizeCanvas = resizeCanvas;

// Hacer otras funciones disponibles globalmente para menu.js
window.initPath = initPath;
window.initDecorations = initDecorations;
window.initCamera = initCamera;
window.screenToWorld = screenToWorld;
window.screenToInternal = screenToInternal;
window.LevelEnemyManager = LevelEnemyManager;

// Hacer canvas y ctx disponibles globalmente para story.js
window.canvas = null;
window.ctx = null;

// Función auxiliar para convertir coordenadas de pantalla a coordenadas internas del juego (ahora es directo porque scale=1, offsetX=0, offsetY=0)
function screenToInternal(screenX, screenY) {
    return {
        x: screenX,
        y: screenY
    };
}

// Variable para rastrear estado del mouse
let mouseState = { x: 0, y: 0, down: false };

// Hacer mouseState disponible globalmente para story.js
window.mouseState = mouseState;

function handleMouseDown(e) {
    const rect = canvas.getBoundingClientRect();
    const screenX = e.clientX - rect.left;
    const screenY = e.clientY - rect.top;
    
    // Convertir a coordenadas internas
    const internalPos = screenToInternal(screenX, screenY);
    mouseState.x = internalPos.x;
    mouseState.y = internalPos.y;
    mouseState.down = true;
}

function startGame() {
    console.log('[GAME] Juego iniciado!');
    gameState = 'MENU';
    initCamera(); // Inicializar cámara al iniciar el juego
    initDecorations(); // Inicializar decoraciones
    requestAnimationFrame(gameLoop);
}
// ==========================================
// MANEJO DE CLICKS
// ==========================================
function handleClick(e) {
    const rect = canvas.getBoundingClientRect();
    const screenX = e.clientX - rect.left;
    const screenY = e.clientY - rect.top;

    // Convertir coordenadas de pantalla a coordenadas internas (considerando letterboxing/pillarboxing)
    const internalPos = screenToInternal(screenX, screenY);
    
    // Convertir coordenadas internas a coordenadas del mundo usando la cámara
    const worldPos = screenToWorld(internalPos.x, internalPos.y);
    const x = worldPos.x;
    const y = worldPos.y;

    if (gameState === 'MENU') {
        // El menú ahora maneja esto, no iniciar directamente
        return;
    } else if (storyScreenVisible) {
        // Manejar click en pantalla de historia
        handleStoryClick(screenX, screenY);
        return;
    } else if (gameState === 'PLAYING') {
        // Si estamos mostrando el menú de selección de tipo de torre
        if (showTowerTypeMenu && pendingTowerPosition) {
            // Verificar si se hizo click en una opción del menú de torres
            const menuX = pendingTowerPosition.x;
            const menuY = pendingTowerPosition.y;
            const optionHeight = 50;
            const menuWidth = 200;
            
            for (let i = 0; i < TOWER_TYPES.length; i++) {
                const optY = menuY + 25 + (i * optionHeight);
                if (screenX >= menuX && screenX <= menuX + menuWidth && screenY >= optY - 12 && screenY <= optY - 12 + optionHeight - 4) {
                    // Seleccionar tipo de torre
                    const towerType = TOWER_TYPES[i];
                    if (player.money >= towerType.cost) {
                        player.money -= towerType.cost;
                        towers.push({
                            x: pendingTowerPosition.worldX,
                            y: pendingTowerPosition.worldY,
                            range: towerType.range,
                            damage: towerType.damage,
                            fireRate: towerType.fireRate,
                            lastShot: 0,
                            level: 1,
                            color: towerType.color,
                            type: towerType.id
                        });

                        // Actualizar estadísticas
                        if (window.menuAPI) {
                            window.menuAPI.incrementStat('towersPlaced');
                        }

                        // Actualizar HUD
                        if (window.menuAPI) {
                            window.menuAPI.updateHUD();
                        }
                    }
                    showTowerTypeMenu = false;
                    pendingTowerPosition = null;
                    return;
                }
            }
            // Si hizo click fuera del menú, cancelar
            showTowerTypeMenu = false;
            pendingTowerPosition = null;
            return;
        }
        
        // Primero verificar si se hizo click en una torre existente para seleccionarla/mejorarla/fusionarla
        let clickedTower = null;
        for (let i = 0; i < towers.length; i++) {
            let tower = towers[i];
            let dx = x - tower.x;
            let dy = y - tower.y;
            let dist = Math.sqrt(dx * dx + dy * dy);
            if (dist < 30) { // Radio de click en la torre
                clickedTower = tower;
                selectedTower = tower;
                break;
            }
        }
        
        if (clickedTower) {
            // Verificar si hay fusión disponible y se hizo click en una torre de fusión
            if (fusionAvailable && fusionTowers.length === 5) {
                // Verificar si la torre clickeada es parte de las torres para fusionar
                const isFusionTower = fusionTowers.some(t => t === clickedTower);
                if (isFusionTower) {
                    // Ejecutar fusión
                    mergeTowers();
                    return;
                }
            }
            
            // Mostrar panel de mejora de torre
            showTowerUpgradePanel(clickedTower);
            return;
        }
        
        // Si no se hizo click en una torre, mostrar menú de selección de tipo de torre
        // Guardar posición para el menú
        const internalPos = screenToInternal(screenX, screenY);
        pendingTowerPosition = {
            x: screenX,
            y: screenY,
            worldX: x,
            worldY: y
        };
        showTowerTypeMenu = true;
    } else if (gameState === 'GAMEOVER') {
        // Reiniciar después de game over
        restartGameAfterGameOver();
    }
}

// ==========================================
// SPAWN DE ENEMIGOS (legacy - ahora usa waveManager)
// ==========================================
function spawnEnemy() {
    // Esta función es legacy, ahora se usa waveManager.spawnEnemy()
    console.warn('[GAME] spawnEnemy() legacy llamada - usar waveManager');
}

// Crear enemigo
function createEnemy(enemyType) {
    if (gameState !== 'PLAYING') return;
    
    enemies.push({
        x: path[0].x,
        y: path[0].y,
        waypointIndex: 0,
        speed: enemyType.speed,
        health: enemyType.health,
        maxHealth: enemyType.health,
        reward: enemyType.reward,
        color: enemyType.color,
        type: enemyType.name,
        damage: enemyType.damage || 1,
        
        // Propiedades para animaciones y efectos
        animationFrame: 0,
        lastAnimationUpdate: Date.now(),
        hitEffect: false,
        deathEffect: false,
        state: 'walk' // walk, attack, hit, death
    });
}

// ==========================================
// TIPOS DE ENEMIGOS SEGÚN NIVEL
// ==========================================
function getEnemyTypeForLevel(level, enemyIndex) {
    // Obtener configuración del nivel para aplicar multiplicadores de dificultad
    let healthMult = 1.0;
    let speedMult = 1.0;
    
    if (typeof getLevelConfig === 'function') {
        try {
            const config = getLevelConfig(level);
            healthMult = config.enemyHealthMult || 1.0;
            speedMult = config.enemySpeedMult || 1.0;
        } catch(e) {
            // Si no se puede obtener la config, usar valores por defecto
            if (level >= 41) { healthMult = 2.0; speedMult = 1.5; }
            else if (level >= 31) { healthMult = 1.8; speedMult = 1.5; }
            else if (level >= 21) { healthMult = 1.5; speedMult = 1.0; }
            else if (level >= 11) { healthMult = 1.0; speedMult = 1.0; }
        }
    } else {
        // Fallback si getLevelConfig no está disponible
        if (level >= 41) { healthMult = 2.0; speedMult = 1.5; }
        else if (level >= 31) { healthMult = 1.8; speedMult = 1.5; }
        else if (level >= 21) { healthMult = 1.5; speedMult = 1.0; }
        else if (level >= 11) { healthMult = 1.0; speedMult = 1.0; }
    }
    
    const types = [
        { name: 'goblin', health: Math.floor(100 * healthMult), speed: 2 * speedMult, reward: 10, color: '#8BC34A', damage: 1 },
        { name: 'bandit', health: Math.floor(150 * healthMult), speed: 2.5 * speedMult, reward: 15, color: '#FF5722', damage: 2 },
        { name: 'skeleton', health: Math.floor(200 * healthMult), speed: 1.8 * speedMult, reward: 20, color: '#EEEEEE', damage: 2 },
        { name: 'dark_knight', health: Math.floor(300 * healthMult), speed: 1.5 * speedMult, reward: 30, color: '#3F51B5', damage: 3 },
        { name: 'skeleton_lord', health: Math.floor(500 * healthMult), speed: 1.2 * speedMult, reward: 50, color: '#9C27B0', damage: 4 }
    ];
    
    // Seleccionar tipo basado en el nivel y progreso del nivel
    // Progresión más simple: cada 5 enemigos derrotados, aparece un tipo más fuerte
    let index = Math.min(Math.floor(enemyIndex / 5), types.length - 1);
    
    // En niveles altos (21+), permitir todos los tipos desde el inicio
    if (level >= 21) {
        index = Math.min(index + 1, types.length - 1);
    }
    
    return types[index];
}

// ==========================================
// SPAWN DEL BOSS ROGELIO
// ==========================================
function spawnBossRogelio(isFinal = false) {
    bossActive = true;
    
    // Si es la oleada final, Rogelio es más grande y más poderoso
    const bossSize = isFinal ? 192 : 128;
    const bossHealth = isFinal ? 15000 + (player.currentLevel * 1000) : 5000 + (player.currentLevel * 500);
    const bossReward = isFinal ? 2000 : 500;
    const bossDamage = isFinal ? 10 : 5;
    
    bossRogelio = {
        x: path[0].x - 100,
        y: path[0].y,
        waypointIndex: 0,
        speed: isFinal ? 0.6 : 0.8,
        health: bossHealth,
        maxHealth: bossHealth,
        reward: bossReward,
        color: '#F44336', // Rojo para Rogelio
        type: 'rogelio',
        damage: bossDamage,
        width: bossSize,
        height: bossSize,
        attackCooldown: 0,
        specialAttackCooldown: 0,
        state: 'walking', // walking, attacking, roaring
        animationFrame: 0,
        lastAnimationUpdate: 0,
        isFinalBoss: isFinal
    };
    
    // Efectos de aparición
    screenShakeIntensity = isFinal ? 40 : 20;
    bossHealthBarVisible = true;
    roglioAppearedText = isFinal ? '¡¡ROGELIO FINAL HA APARECIDO!!' : '¡¡ROGELIO HA APARECIDO!!';
    roglioAppearedAlpha = 1;
    
    console.log('[BOSS] ¡Rogelio ha aparecido!' + (isFinal ? ' (FINAL BOSS)' : ''));
}

// ==========================================
// SPAWN DE MINI BOSS RANDOM
// ==========================================
function spawnMiniBoss(wave) {
    bossActive = true;
    
    // Colores random para mini bosses
    const miniBossColors = [
        '#FF5722', // Naranja
        '#9C27B0', // Morado
        '#3F51B5', // Azul oscuro
        '#00BCD4', // Cyan
        '#FFEB3B', // Amarillo
        '#4CAF50', // Verde
        '#FF9800'  // Naranja claro
    ];
    
    // Seleccionar color basado en la oleada (determinista pero variado)
    const colorIndex = Math.floor(wave / 10) % miniBossColors.length;
    const bossColor = miniBossColors[colorIndex];
    
    // Mini boss es más pequeño que Rogelio final pero más grande que enemigos normales
    const bossSize = 96;
    const bossHealth = 3000 + (wave * 300);
    const bossReward = 300;
    const bossDamage = 4;
    
    bossRogelio = {
        x: path[0].x - 100,
        y: path[0].y,
        waypointIndex: 0,
        speed: 1.0,
        health: bossHealth,
        maxHealth: bossHealth,
        reward: bossReward,
        color: bossColor,
        type: 'miniboss',
        damage: bossDamage,
        width: bossSize,
        height: bossSize,
        attackCooldown: 0,
        specialAttackCooldown: 0,
        state: 'walking',
        animationFrame: 0,
        lastAnimationUpdate: 0,
        isFinalBoss: false
    };
    
    // Efectos de aparición
    screenShakeIntensity = 15;
    bossHealthBarVisible = true;
    roglioAppearedText = '¡¡MINI BOSS HA APARECIDO!!';
    roglioAppearedAlpha = 1;
    
    console.log('[MINIBOSS] ¡Mini boss de color ' + bossColor + ' ha aparecido!');
}

// ==========================================
// ACTUALIZACIÓN DEL JUEGO
// ==========================================
function update(deltaTime) {
    if (gameState !== 'PLAYING') return;
    
    // Actualizar LevelEnemyManager (sistema de enemigos por nivel sin waves)
    LevelEnemyManager.update(deltaTime);
    
    // Verificar fusión de torres disponible
    checkFusionAvailable();
    
    // Actualizar screen shake
    if (screenShakeIntensity > 0) {
        screenShakeIntensity *= 0.9;
        if (screenShakeIntensity < 1) screenShakeIntensity = 0;
    }
    
    // Actualizar texto de aparición de Rogelio
    if (roglioAppearedAlpha > 0) {
        roglioAppearedAlpha -= deltaTime / 2000;
        if (roglioAppearedAlpha < 0) roglioAppearedAlpha = 0;
    }
    
    // Actualizar Boss Rogelio
    if (bossRogelio && bossActive) {
        updateBossRogelio(deltaTime);
    }

    // Actualizar enemigos
    for (let i = enemies.length - 1; i >= 0; i--) {
        let enemy = enemies[i];
        
        // Mover enemigo hacia el siguiente waypoint
        let target = path[enemy.waypointIndex + 1];
        if (target) {
            let dx = target.x - enemy.x;
            let dy = target.y - enemy.y;
            let dist = Math.sqrt(dx * dx + dy * dy);
            
            if (dist < enemy.speed * gameSpeed) {
                enemy.waypointIndex++;
                if (enemy.waypointIndex >= path.length - 1) {
                    // Enemigo llegó al final
                    player.lives--;
                    
                    // Notificar al LevelEnemyManager que un enemigo escapó (NO cuenta como derrotado)
                    LevelEnemyManager.enemyEscaped();
                    
                    enemies.splice(i, 1);
                    
                    // Actualizar HUD
                    if (window.menuAPI) {
                        window.menuAPI.updateHUD();
                    }
                    
                    if (player.lives <= 0) {
                        gameState = 'GAMEOVER';
                        // Guardar derrota
                        if (window.menuAPI) {
                            window.menuAPI.incrementStat('defeats');
                        }
                    }
                    continue;
                }
            } else {
                enemy.x += (dx / dist) * enemy.speed * gameSpeed;
                enemy.y += (dy / dist) * enemy.speed * gameSpeed;
            }
        }
        
        // Verificar si las torres disparan
        for (let tower of towers) {
            let dx = enemy.x - tower.x;
            let dy = enemy.y - tower.y;
            let dist = Math.sqrt(dx * dx + dy * dy);
            
            if (dist <= tower.range) {
                let now = Date.now();
                if (now - tower.lastShot >= tower.fireRate) {
                    tower.lastShot = now;
                    bullets.push({
                        x: tower.x,
                        y: tower.y,
                        targetX: enemy.x,
                        targetY: enemy.y,
                        speed: 10,
                        damage: tower.damage,
                        color: '#FFFF00'
                    });
                }
            }
        }
    }
    
    // Actualizar balas
    for (let i = bullets.length - 1; i >= 0; i--) {
        let bullet = bullets[i];
        let dx = bullet.targetX - bullet.x;
        let dy = bullet.targetY - bullet.y;
        let dist = Math.sqrt(dx * dx + dy * dy);
        
        if (dist < bullet.speed) {
            // Impacto - verificar si es contra el boss
            if (bullet.isBossTarget && bossRogelio && bossActive) {
                let edx = bossRogelio.x - bullet.targetX;
                let edy = bossRogelio.y - bullet.targetY;
                let edist = Math.sqrt(edx * edx + edy * edy);
                
                if (edist < 60) {
                    bossRogelio.health -= bullet.damage;
                    
                    if (bossRogelio.health <= 0) {
                        // Boss derrotado
                        player.money += bossRogelio.reward;
                        
                        // Notificar al LevelEnemyManager
                        LevelEnemyManager.enemyDefeated();
                        
                        // Actualizar estadísticas
                        if (window.menuAPI) {
                            window.menuAPI.incrementStat('enemiesDefeated');
                        }
                        
                        bossActive = false;
                        bossRogelio = null;
                        bossHealthBarVisible = false;
                        roglioAppearedText = '';
                        roglioAppearedAlpha = 0;
                        
                        console.log('[BOSS] ¡Rogelio ha sido derrotado!');
                    } else {
                        // Efecto de golpe
                        screenShakeIntensity = 2;
                    }
                }
            } else {
                // Impacto contra enemigos normales
                for (let j = enemies.length - 1; j >= 0; j--) {
                    let enemy = enemies[j];
                    let edx = enemy.x - bullet.targetX;
                    let edy = enemy.y - bullet.targetY;
                    let edist = Math.sqrt(edx * edx + edy * edy);
                    
                    if (edist < 30) {
                        enemy.health -= bullet.damage;
                        
                        if (enemy.health <= 0) {
                            player.money += enemy.reward;
                            
                            // Actualizar estadísticas
                            if (window.menuAPI) {
                                window.menuAPI.incrementStat('enemiesDefeated');
                            }
                            
                            // Notificar al LevelEnemyManager que un enemigo fue derrotado
                            LevelEnemyManager.enemyDefeated();
                            
                            enemies.splice(j, 1);
                            
                            // Actualizar HUD
                            if (window.menuAPI) {
                                window.menuAPI.updateHUD();
                            }
                        } else {
                            // Marcar enemigo como golpeado para efecto visual
                            enemy.hitEffect = true;
                            setTimeout(() => { enemy.hitEffect = false; }, 100);
                        }
                        break;
                    }
                }
            }
            bullets.splice(i, 1);
        } else {
            bullet.x += (dx / dist) * bullet.speed;
            bullet.y += (dy / dist) * bullet.speed;
        }
    }
    
    // Actualizar tiempo jugado
    if (gameStartTime) {
        const elapsed = Math.floor((Date.now() - gameStartTime) / 1000);
        const stats = window.menuAPI ? 
            JSON.parse(localStorage.getItem('rogelioTD_stats') || '{}') : {};
        stats.timePlayed = (stats.timePlayed || 0) + deltaTime / 1000;
        if (window.menuAPI) {
            localStorage.setItem('rogelioTD_stats', JSON.stringify(stats));
        }
    }
}

// ==========================================
// ACTUALIZACIÓN DEL BOSS ROGELIO
// ==========================================
function updateBossRogelio(deltaTime) {
    if (!bossRogelio) return;
    
    const boss = bossRogelio;
    
    // Mover boss hacia el siguiente waypoint
    let target = path[boss.waypointIndex + 1];
    if (target) {
        let dx = target.x - boss.x;
        let dy = target.y - boss.y;
        let dist = Math.sqrt(dx * dx + dy * dy);
        
        if (dist < boss.speed * gameSpeed) {
            boss.waypointIndex++;
            if (boss.waypointIndex >= path.length - 1) {
                // Boss llegó al final - Game Over instantáneo
                player.lives = 0;
                gameState = 'GAMEOVER';
                bossActive = false;
                bossRogelio = null;
                bossHealthBarVisible = false;
                roglioAppearedText = '';
                roglioAppearedAlpha = 0;
                
                if (window.menuAPI) {
                    window.menuAPI.incrementStat('defeats');
                }
                return;
            }
        } else {
            boss.x += (dx / dist) * boss.speed * gameSpeed;
            boss.y += (dy / dist) * boss.speed * gameSpeed;
        }
    }
    
    // Actualizar animación
    boss.animationFrame++;
    if (boss.animationFrame > 7) boss.animationFrame = 0;
    
    // Actualizar cooldowns de ataque
    boss.attackCooldown -= deltaTime;
    boss.specialAttackCooldown -= deltaTime;
    
    // Ataque normal cada 2 segundos
    if (boss.attackCooldown <= 0) {
        boss.attackCooldown = 2000;
        boss.state = 'attacking';
        
        // Daño a torres cercanas
        for (let i = towers.length - 1; i >= 0; i--) {
            let tower = towers[i];
            let tdx = tower.x - boss.x;
            let tdy = tower.y - boss.y;
            let tdist = Math.sqrt(tdx * tdx + tdy * tdy);
            
            if (tdist < 100) {
                // Destruir torre
                towers.splice(i, 1);
                screenShakeIntensity = 5;
            }
        }
        
        setTimeout(() => { boss.state = 'walking'; }, 500);
    }
    
    // Ataque especial cada 8 segundos
    if (boss.specialAttackCooldown <= 0) {
        boss.specialAttackCooldown = 8000;
        boss.state = 'roaring';
        
        // Rugido - ralentiza torres cercanas temporalmente
        screenShakeIntensity = 10;
        
        setTimeout(() => { 
            boss.state = 'walking';
            console.log('[BOSS] Rogelio termina su rugido');
        }, 1000);
    }
    
    // Verificar si las torres disparan al boss
    for (let tower of towers) {
        let dx = boss.x - tower.x;
        let dy = boss.y - tower.y;
        let dist = Math.sqrt(dx * dx + dy * dy);
        
        if (dist <= tower.range) {
            let now = Date.now();
            if (now - tower.lastShot >= tower.fireRate) {
                tower.lastShot = now;
                bullets.push({
                    x: tower.x,
                    y: tower.y,
                    targetX: boss.x,
                    targetY: boss.y,
                    speed: 10,
                    damage: tower.damage,
                    color: '#FF0000',
                    isBossTarget: true
                });
            }
        }
    }
}

// ==========================================
// DIBUJADO
// ==========================================
function draw() {
    // 1. Limpiar canvas completo con color de fondo para letterboxing/pillarboxing
    ctx.fillStyle = '#0a0a0f';
    ctx.fillRect(0, 0, canvas.width, canvas.height);
    
    // 2. Aplicar transformaciones de cámara
    ctx.save();
    
    // Aplicar screen shake
    if (screenShakeIntensity > 0) {
        let shakeX = (Math.random() - 0.5) * screenShakeIntensity;
        let shakeY = (Math.random() - 0.5) * screenShakeIntensity;
        ctx.translate(shakeX, shakeY);
    }
    
    // Trasladar por la posición de la cámara (esto hace que todo se mueva con la cámara)
    ctx.translate(-camera.x, -camera.y);
    
    // 3. Dibujar fondo con tiles de terreno (usando sistema de mundo)
    drawTerrainBackground();
    
    // 4. Dibujar camino (coordenadas del mundo)
    ctx.strokeStyle = '#8B7355';  // Color tierra más claro para el borde
    ctx.lineWidth = 50;
    ctx.lineCap = 'round';
    ctx.lineJoin = 'round';
    ctx.beginPath();
    ctx.moveTo(path[0].x, path[0].y);
    for (let i = 1; i < path.length; i++) {
        ctx.lineTo(path[i].x, path[i].y);
    }
    ctx.stroke();
    
    // Camino principal color tierra
    ctx.strokeStyle = '#A0826D';  // Color tierra
    ctx.lineWidth = 36;
    ctx.stroke();
    
    // Línea central más clara
    ctx.strokeStyle = '#C4B59A';  // Arena clara
    ctx.lineWidth = 20;
    ctx.stroke();
    
    // 5. Dibujar decoraciones (árboles, rocas, arbustos, flores)
    drawDecorations();
    
    // 6. Dibujar agua (si existe en el tilemap)
    drawWater();
    
    // 7. Dibujar torres con sprites (coordenadas del mundo)
    for (let tower of towers) {
        // Rango (solo si está jugando)
        if (gameState === 'PLAYING') {
            ctx.strokeStyle = fusionAvailable && fusionTowers.includes(tower) 
                ? 'rgba(255, 215, 0, 0.8)' // Dorado para torres en fusión
                : 'rgba(255, 255, 255, 0.2)';
            ctx.lineWidth = fusionAvailable && fusionTowers.includes(tower) ? 3 : 1;
            ctx.beginPath();
            ctx.arc(tower.x, tower.y, tower.range, 0, Math.PI * 2);
            ctx.stroke();
        }
        
        // Torre con sprite
        drawTowerWithSprite(tower);
    }
    
    // 8. Dibujar enemigos con sprites (coordenadas del mundo)
    for (let enemy of enemies) {
        drawEnemyWithSprite(enemy);
    }
    
    // 9. Dibujar Boss Rogelio si está activo
    if (bossRogelio && bossActive) {
        drawBossRogelio();
    }
    
    // 10. Dibujar balas/proyectiles (coordenadas del mundo)
    for (let bullet of bullets) {
        ctx.fillStyle = bullet.color;
        ctx.beginPath();
        ctx.arc(bullet.x, bullet.y, 5, 0, Math.PI * 2);
        ctx.fill();
    }
    
    // Restaurar contexto (salir de transformaciones de cámara)
    ctx.restore();
    
    // 12. Dibujar UI/HUD (siempre en coordenadas de pantalla, no afectado por cámara)
    drawUI();
    
    // Dibujar texto de aparición de Rogelio (fuera del shake, en pantalla)
    if (roglioAppearedAlpha > 0 && roglioAppearedText) {
        ctx.save();
        ctx.globalAlpha = roglioAppearedAlpha;
        ctx.fillStyle = '#F44336';
        ctx.font = 'bold 36px Arial, sans-serif';
        ctx.textAlign = 'center';
        ctx.shadowColor = '#FF0000';
        ctx.shadowBlur = 20;
        ctx.fillText(roglioAppearedText, canvas.width / 2, canvas.height / 2);
        ctx.restore();
    }
}

// ==========================================
// DIBUJADO DE TERRENO DE FONDO
// ==========================================
function drawTerrainBackground() {
    // Dibujar TODO el mapa completo para evitar areas negras
    const tileSize = 64;
    const cols = Math.ceil(worldWidth / tileSize);
    const rows = Math.ceil(worldHeight / tileSize);
    
    // Dibujar todos los tiles del mapa completo con patrón de cesped alternado
    for (let row = 0; row < rows; row++) {
        for (let col = 0; col < cols; col++) {
            const x = col * tileSize;
            const y = row * tileSize;
            
            // Alternar entre dos tonos de verde para crear patrón de cesped
            if ((row + col) % 2 === 0) {
                ctx.fillStyle = '#4A7C4E'; // Verde más oscuro
            } else {
                ctx.fillStyle = '#5A8C5E'; // Verde más claro
            }
            ctx.fillRect(x, y, tileSize, tileSize);
        }
    }
}

// ==========================================
// DIBUJADO DE TORRES CON SPRITES
// ==========================================
function drawTowerWithSprite(tower) {
    // Usar el color del tipo de torre
    ctx.fillStyle = tower.color || '#8B4513';
    
    // Tamaño basado en el nivel de la torre
    const baseSize = 20;
    const sizeMultiplier = Math.pow(5, (tower.level - 1) / 2); // Crece con el nivel
    const size = baseSize * sizeMultiplier;
    
    // Sombra
    ctx.fillStyle = 'rgba(0,0,0,0.3)';
    ctx.fillRect(tower.x - size + 3, tower.y - size + 3, size * 2, size * 2);
    
    // Dibujar torre principal
    ctx.fillStyle = tower.color || '#8B4513';
    ctx.fillRect(tower.x - size, tower.y - size, size * 2, size * 2);
    
    // Borde dorado si está disponible para fusión
    if (fusionAvailable && fusionTowers.includes(tower)) {
        ctx.strokeStyle = '#FFD700';
        ctx.lineWidth = 3;
        ctx.strokeRect(tower.x - size - 3, tower.y - size - 3, size * 2 + 6, size * 2 + 6);
    }
    
    // Dibujar núcleo más claro
    ctx.fillStyle = lightenColor(tower.color || '#8B4513', 30);
    ctx.fillRect(tower.x - size/2, tower.y - size/2, size, size);
    
    // Mostrar nivel de la torre
    if (tower.level > 1) {
        ctx.fillStyle = '#FFFFFF';
        ctx.font = 'bold ' + (12 + tower.level * 2) + 'px Arial';
        ctx.textAlign = 'center';
        ctx.textBaseline = 'middle';
        ctx.fillText('Lv.' + tower.level, tower.x, tower.y);
    }
}

// Función auxiliar para aclarar colores
function lightenColor(color, percent) {
    const num = parseInt(color.replace('#', ''), 16);
    const amt = Math.round(2.55 * percent);
    const R = Math.min(255, (num >> 16) + amt);
    const G = Math.min(255, ((num >> 8) & 0x00FF) + amt);
    const B = Math.min(255, (num & 0x0000FF) + amt);
    return '#' + (0x1000000 + R * 0x10000 + G * 0x100 + B).toString(16).slice(1);
}

// ==========================================
// DIBUJADO DE ENEMIGOS CON SPRITES
// ==========================================
function drawEnemyWithSprite(enemy) {
    // Diseño simple: dibujar enemigo como círculo de color
    ctx.fillStyle = enemy.color;
    ctx.beginPath();
    ctx.arc(enemy.x, enemy.y, 15, 0, Math.PI * 2);
    ctx.fill();
    
    // Barra de vida (siempre visible)
    let healthPercent = enemy.health / enemy.maxHealth;
    ctx.fillStyle = '#333333';
    ctx.fillRect(enemy.x - 15, enemy.y - 25, 30, 5);
    ctx.fillStyle = healthPercent > 0.5 ? '#4CAF50' : healthPercent > 0.25 ? '#FFC107' : '#F44336';
    ctx.fillRect(enemy.x - 15, enemy.y - 25, 30 * healthPercent, 5);
}


// ==========================================
// DIBUJADO DEL BOSS ROGELIO
// ==========================================
function drawBossRogelio() {
    if (!bossRogelio) return;
    
    const boss = bossRogelio;
    
    // Usar el tamaño real del boss (width/2 como radio)
    const bossRadius = (boss.width || 128) / 2;
    
    // Diseño simple: dibujar boss como círculo con su color específico
    ctx.fillStyle = boss.color || '#F44336';
    ctx.beginPath();
    ctx.arc(boss.x, boss.y, bossRadius, 0, Math.PI * 2);
    ctx.fill();
    
    // Aura especial para el boss final Rogelio
    if (boss.isFinalBoss) {
        // Aura roja brillante más grande
        ctx.strokeStyle = 'rgba(244, 67, 54, 0.7)';
        ctx.lineWidth = 8;
        ctx.beginPath();
        ctx.arc(boss.x, boss.y, bossRadius + 15 + Math.sin(Date.now() / 200) * 8, 0, Math.PI * 2);
        ctx.stroke();
    } else if (boss.type === 'miniboss') {
        // Aura de mini boss
        ctx.strokeStyle = boss.color + '80'; // Semi-transparente
        ctx.lineWidth = 5;
        ctx.beginPath();
        ctx.arc(boss.x, boss.y, bossRadius + 10 + Math.sin(Date.now() / 200) * 5, 0, Math.PI * 2);
        ctx.stroke();
    }
    
    // Barra de vida del boss (si es visible)
    if (bossHealthBarVisible) {
        drawBossHealthBar(boss);
    }
}

// Fallback para dibujar boss sin sprites
function drawBossFallback(boss) {
    let shakeX = (Math.random() - 0.5) * screenShakeIntensity;
    let shakeY = (Math.random() - 0.5) * screenShakeIntensity;
    
    // Cuerpo principal
    ctx.fillStyle = '#F44336';
    ctx.beginPath();
    ctx.arc(boss.x + shakeX, boss.y + shakeY, 50, 0, Math.PI * 2);
    ctx.fill();
    
    // Aura roja brillante
    ctx.strokeStyle = 'rgba(244, 67, 54, 0.5)';
    ctx.lineWidth = 5;
    ctx.beginPath();
    ctx.arc(boss.x + shakeX, boss.y + shakeY, 60 + Math.sin(Date.now() / 200) * 5, 0, Math.PI * 2);
    ctx.stroke();
    
    // Ojos brillantes
    ctx.fillStyle = '#FFEB3B';
    ctx.beginPath();
    ctx.arc(boss.x - 15 + shakeX, boss.y - 10 + shakeY, 8, 0, Math.PI * 2);
    ctx.arc(boss.x + 15 + shakeX, boss.y - 10 + shakeY, 8, 0, Math.PI * 2);
    ctx.fill();
}

// Barra de vida del boss
function drawBossHealthBar(boss) {
    // Guardar estado actual del contexto
    ctx.save();
    // Resetear transformaciones para dibujar en coordenadas de pantalla (UI)
    ctx.setTransform(1, 0, 0, 1, 0, 0);
    
    const barWidth = 400;
    const barHeight = 20;
    const barX = (canvas.width - barWidth) / 2;
    const barY = 80;
    
    // Fondo oscuro
    ctx.fillStyle = 'rgba(0, 0, 0, 0.7)';
    ctx.fillRect(barX - 3, barY - 3, barWidth + 6, barHeight + 6);
    
    // Barra de vida fondo
    ctx.fillStyle = '#333333';
    ctx.fillRect(barX, barY, barWidth, barHeight);
    
    // Vida actual - usar color del boss si existe
    const healthPercent = boss.health / boss.maxHealth;
    ctx.fillStyle = boss.color || '#F44336';
    ctx.fillRect(barX, barY, barWidth * healthPercent, barHeight);
    
    // Texto del nombre del boss
    ctx.font = 'bold 16px Arial';
    ctx.fillStyle = '#FFFFFF';
    ctx.textAlign = 'center';
    const bossName = boss.isFinalBoss ? 'ROGELIO FINAL' : (boss.type === 'miniboss' ? 'MINI BOSS' : 'ROGELIO');
    ctx.fillText(bossName, canvas.width / 2, barY - 8);
    
    ctx.restore();
}

// ==========================================
function drawDecorations() {
    // Dibujar decoraciones con formas circulares y colores más naturales
    for (let deco of decorations) {
        // Solo dibujar si está en el viewport
        if (!isInViewport(deco.x, deco.y, deco.width, deco.height)) continue;
        
        const centerX = deco.x + deco.width / 2;
        const centerY = deco.y + deco.height / 2;
        const radius = deco.width / 2.5;
        
        // Dibujar según tipo con formas específicas
        if (deco.type.includes('rock')) {
            // Piedra: Polígono irregular gris con forma cuadrada/angulosa
            ctx.save();
            ctx.translate(centerX, centerY);
            ctx.rotate(deco.angle || 0);
            
            const size = radius * 1.8;
            const irregularity = 0.3;
            
            // Sombra
            ctx.fillStyle = 'rgba(0,0,0,0.3)';
            ctx.beginPath();
            ctx.moveTo(-size/2 + 3, -size/2 + 3);
            ctx.lineTo(size/2 + 3, -size/2 + 5 + Math.random() * irregularity * size);
            ctx.lineTo(size/2 + 5 + Math.random() * irregularity * size, size/2 + 3);
            ctx.lineTo(-size/2 + 5 + Math.random() * irregularity * size, size/2 + 5);
            ctx.closePath();
            ctx.fill();
            
            // Cuerpo principal de la piedra (forma cuadrada irregular)
            ctx.fillStyle = '#9E9E9E';
            ctx.strokeStyle = '#616161';
            ctx.lineWidth = 2;
            ctx.beginPath();
            ctx.moveTo(-size/2, -size/2);
            ctx.lineTo(size/2, -size/2 + Math.sin(deco.angle || 0) * irregularity * size);
            ctx.lineTo(size/2 + Math.cos(deco.angle || 0) * irregularity * size, size/2);
            ctx.lineTo(-size/2 + Math.sin(deco.angle || 0) * irregularity * size, size/2);
            ctx.closePath();
            ctx.fill();
            ctx.stroke();
            
            // Brillo/detalles
            ctx.fillStyle = 'rgba(255,255,255,0.4)';
            ctx.beginPath();
            ctx.arc(-size/4, -size/4, size/6, 0, Math.PI * 2);
            ctx.fill();
            
            ctx.restore();
        } else if (deco.type.includes('bush')) {
            // Arbusto: Grupo de círculos verdes redondos
            ctx.save();
            ctx.translate(centerX, centerY);
            
            const baseRadius = radius;
            const circles = [
                {x: 0, y: 0, r: baseRadius},
                {x: -baseRadius*0.6, y: baseRadius*0.4, r: baseRadius*0.7},
                {x: baseRadius*0.6, y: baseRadius*0.4, r: baseRadius*0.7},
                {x: 0, y: -baseRadius*0.5, r: baseRadius*0.6},
                {x: -baseRadius*0.3, y: -baseRadius*0.6, r: baseRadius*0.5}
            ];
            
            // Sombra del arbusto completo
            ctx.fillStyle = 'rgba(0,0,0,0.2)';
            ctx.beginPath();
            circles.forEach((c, i) => {
                const x = c.x + 2;
                const y = c.y + 2;
                if (i === 0) ctx.moveTo(x + c.r, y);
                ctx.arc(x, y, c.r, 0, Math.PI * 2);
            });
            ctx.fill();
            
            // Dibujar cada círculo del arbusto
            circles.forEach(c => {
                // Verde oscuro base
                ctx.fillStyle = '#2E7D32';
                ctx.beginPath();
                ctx.arc(c.x, c.y, c.r, 0, Math.PI * 2);
                ctx.fill();
                
                // Verde claro detalle (brillo)
                ctx.fillStyle = '#4CAF50';
                ctx.beginPath();
                ctx.arc(c.x - c.r*0.2, c.y - c.r*0.2, c.r*0.4, 0, Math.PI * 2);
                ctx.fill();
            });
            
            ctx.restore();
        } else {
            // Otros tipos (tree, flower) - mantener comportamiento circular original
            let color = '#888888';
            let darkColor = '#666666';
            if (deco.type.includes('tree')) {
                color = '#2E7D32';
                darkColor = '#1B5E20';
            } else if (deco.type.includes('flower')) {
                color = '#E91E63';
                darkColor = '#C2185B';
            }
            
            // Sombra
            ctx.fillStyle = 'rgba(0,0,0,0.2)';
            ctx.beginPath();
            ctx.arc(centerX + 3, centerY + 3, radius, 0, Math.PI * 2);
            ctx.fill();
            
            // Círculo principal
            ctx.fillStyle = color;
            ctx.beginPath();
            ctx.arc(centerX, centerY, radius, 0, Math.PI * 2);
            ctx.fill();
            
            // Detalle central más oscuro
            ctx.fillStyle = darkColor;
            ctx.beginPath();
            ctx.arc(centerX, centerY, radius * 0.6, 0, Math.PI * 2);
            ctx.fill();
        }
    }
}

// ==========================================
// DIBUJADO DE AGUA
// ==========================================
function drawWater() {
    // Dibujar agua con efecto de ondas simples
    const tileSize = 64;
    const waterPositions = [
        {x: 100, y: 100}, {x: 164, y: 100}, {x: 100, y: 164}, {x: 164, y: 164}
    ];
    
    const time = Date.now() * 0.001;
    
    for (let pos of waterPositions) {
        if (!isInViewport(pos.x, pos.y, tileSize, tileSize)) continue;
        
        // Base azul
        ctx.fillStyle = '#2196F3';
        ctx.fillRect(pos.x, pos.y, tileSize, tileSize);
        
        // Ondas animadas
        ctx.fillStyle = 'rgba(255,255,255,0.3)';
        for (let i = 0; i < 3; i++) {
            const waveY = pos.y + ((i + 1) * tileSize / 4) + Math.sin(time + i) * 3;
            ctx.fillRect(pos.x + 5, waveY, tileSize - 10, 2);
        }
    }
}

// ==========================================
// DIBUJADO DE PARTÍCULAS/EFEECTOS
// ==========================================
function drawParticles() {
    // Diseño simple: sin partículas
}

// ==========================================
// ACTUALIZAR EFECTOS Y PARTÍCULAS
// ==========================================
function updateEffects(deltaTime) {
    // Diseño simple: sin efectos avanzados
}

// ==========================================
// INTERFAZ DE USUARIO
// ==========================================
function drawUI() {
    if (gameState === 'MENU') {
        // El menú principal se maneja por menu.js
        // Esta sección ya no se usa porque el menú es HTML/CSS
    } else if (storyScreenVisible) {
        // Pantalla de introducción de historia
        drawStoryScreen();
    } else if (gameState === 'PLAYING') {
        // El HUD se maneja por menu.js
        // Solo actualizamos los valores
        if (window.menuAPI) {
            window.menuAPI.updateHUD();
        }
        
        // Dibujar menú de selección de tipo de torre si está activo
        if (showTowerTypeMenu && pendingTowerPosition) {
            const menuX = pendingTowerPosition.x;
            const menuY = pendingTowerPosition.y;
            const optionHeight = 50;
            const menuWidth = 200;
            
            // Fondo del menú
            ctx.fillStyle = 'rgba(0, 0, 0, 0.9)';
            ctx.fillRect(menuX, menuY, menuWidth, TOWER_TYPES.length * optionHeight);
            
            // Borde del menú
            ctx.strokeStyle = '#ffd700';
            ctx.lineWidth = 2;
            ctx.strokeRect(menuX, menuY, menuWidth, TOWER_TYPES.length * optionHeight);
            
            // Título
            ctx.fillStyle = '#ffd700';
            ctx.font = 'bold 14px Arial, sans-serif';
            ctx.textAlign = 'center';
            ctx.fillText('SELECCIONA TORRE', menuX + menuWidth / 2, menuY + 20);
            
            // Opciones de torres
            for (let i = 0; i < TOWER_TYPES.length; i++) {
                const tower = TOWER_TYPES[i];
                const optY = menuY + 25 + (i * optionHeight);
                
                // Fondo de la opción
                ctx.fillStyle = i % 2 === 0 ? 'rgba(255, 255, 255, 0.1)' : 'rgba(255, 255, 255, 0.05)';
                ctx.fillRect(menuX + 2, optY - 12, menuWidth - 4, optionHeight - 4);
                
                // Color indicador
                ctx.fillStyle = tower.color;
                ctx.fillRect(menuX + 8, optY - 8, 20, 20);
                
                // Nombre y costo
                ctx.fillStyle = player.money >= tower.cost ? '#ffffff' : '#666666';
                ctx.font = '12px Arial, sans-serif';
                ctx.textAlign = 'left';
                ctx.fillText(tower.name, menuX + 35, optY + 2);
                
                // Costo
                ctx.fillStyle = player.money >= tower.cost ? '#ffd700' : '#666666';
                ctx.font = 'bold 11px Arial, sans-serif';
                ctx.textAlign = 'right';
                ctx.fillText(tower.cost + ' 💰', menuX + menuWidth - 8, optY + 2);
            }
        }
        
        // Mostrar indicador de fusión disponible
        if (fusionAvailable && fusionTowers.length === 5) {
            ctx.fillStyle = 'rgba(255, 215, 0, 0.3)';
            ctx.fillRect(0, canvas.height - 60, canvas.width, 60);
            
            ctx.fillStyle = '#FFD700';
            ctx.font = 'bold 20px Arial, sans-serif';
            ctx.textAlign = 'center';
            ctx.fillText('¡FUSIÓN DISPONIBLE! Click en una torre dorada para combinar 5 torres en una más poderosa', canvas.width / 2, canvas.height - 25);
        }
    } else if (gameState === 'GAMEOVER') {
        // Pantalla de Game Over
        ctx.fillStyle = 'rgba(0, 0, 0, 0.8)';
        ctx.fillRect(0, 0, canvas.width, canvas.height);
        
        ctx.fillStyle = '#F44336';
        ctx.font = 'bold 48px Arial, sans-serif';
        ctx.textAlign = 'center';
        ctx.fillText('GAME OVER', canvas.width / 2, canvas.height / 2 - 30);
        
        ctx.fillStyle = '#FFFFFF';
        ctx.font = '24px Arial, sans-serif';
        ctx.fillText(`Nivel: ${player.currentLevel}`, canvas.width / 2, canvas.height / 2 + 20);
        
        ctx.font = '16px Arial, sans-serif';
        ctx.fillStyle = '#AAAAAA';
        ctx.fillText('Click para volver al menú', canvas.width / 2, canvas.height / 2 + 60);
    }
}

// ==========================================
// SISTEMA DE FUSIÓN DE TORRES
// ==========================================
// Verifica si hay 5 torres del mismo tipo y nivel para fusionar
function checkFusionAvailable() {
    fusionAvailable = false;
    fusionTowers = [];
    
    // Agrupar torres por tipo y nivel
    const towerGroups = {};
    
    for (let tower of towers) {
        const key = tower.type + '_lvl' + tower.level;
        if (!towerGroups[key]) {
            towerGroups[key] = [];
        }
        towerGroups[key].push(tower);
    }
    
    // Buscar grupos de 5 o más torres del mismo tipo y nivel
    for (const key in towerGroups) {
        if (towerGroups[key].length >= 5) {
            fusionAvailable = true;
            fusionTowers = towerGroups[key].slice(0, 5); // Tomar las primeras 5
            break;
        }
    }
}

// Fusionar 5 torres en una más poderosa
function mergeTowers() {
    if (!fusionAvailable || fusionTowers.length !== 5) return;
    
    // Obtener el tipo y nivel de las torres a fusionar
    const baseTower = fusionTowers[0];
    const towerType = TOWER_TYPES.find(t => t.id === baseTower.type);
    
    if (!towerType) return;
    
    // Calcular posición promedio de las torres
    let avgX = 0, avgY = 0;
    for (let tower of fusionTowers) {
        avgX += tower.x;
        avgY += tower.y;
    }
    avgX /= 5;
    avgY /= 5;
    
    // Remover las 5 torres originales
    for (let tower of fusionTowers) {
        const index = towers.indexOf(tower);
        if (index > -1) {
            towers.splice(index, 1);
        }
    }
    
    // Crear nueva torre fusionada (5 veces mejor que el nivel utilizado)
    const newLevel = baseTower.level + 1;
    const multiplier = 5; // 5 veces mejor
    
    towers.push({
        x: avgX,
        y: avgY,
        range: towerType.range * multiplier,
        damage: towerType.damage * multiplier,
        fireRate: towerType.fireRate / multiplier, // Más rápido
        lastShot: 0,
        level: newLevel,
        color: towerType.color,
        type: towerType.id
    });
    
    // Resetear estado de fusión
    fusionAvailable = false;
    fusionTowers = [];
    selectedTower = null;
    
    console.log('[FUSION] Torres fusionadas! Nueva torre nivel ' + newLevel);
}

// ==========================================
// PANTALLA DE VICTORIA
// ==========================================
let victoryLevel = 0;

function showVictoryScreen(level) {
    victoryLevel = level;
    
    // Verificar si es el nivel final (50)
    if (isFinalLevel(level)) {
        // Mostrar pantalla de campaña completada en lugar de victoria normal
        gameState = 'CAMPAIGN_COMPLETE';
    } else {
        gameState = 'VICTORY';
    }
    
    // Guardar victoria en estadísticas
    if (window.menuAPI) {
        window.menuAPI.incrementStat('victories');
    }
}

function drawVictoryScreen() {
    ctx.fillStyle = 'rgba(0, 0, 0, 0.85)';
    ctx.fillRect(0, 0, canvas.width, canvas.height);
    
    // Título
    ctx.fillStyle = '#4CAF50';
    ctx.font = 'bold 56px Arial, sans-serif';
    ctx.textAlign = 'center';
    ctx.fillText('¡FELICIDADES!', canvas.width / 2, canvas.height / 2 - 80);
    
    // Mensaje de nivel completado
    ctx.fillStyle = '#FFFFFF';
    ctx.font = 'bold 32px Arial, sans-serif';
    ctx.fillText('Has completado el Nivel ' + victoryLevel, canvas.width / 2, canvas.height / 2 - 20);
    
    // Botón VOLVER AL MENÚ
    const menuBtnX = canvas.width / 2 - 160;
    const menuBtnY = canvas.height / 2 + 40;
    const menuBtnWidth = 300;
    const menuBtnHeight = 50;
    
    ctx.fillStyle = '#607D8B';
    ctx.fillRect(menuBtnX, menuBtnY, menuBtnWidth, menuBtnHeight);
    ctx.strokeStyle = '#90A4AE';
    ctx.lineWidth = 3;
    ctx.strokeRect(menuBtnX, menuBtnY, menuBtnWidth, menuBtnHeight);
    
    ctx.fillStyle = '#FFFFFF';
    ctx.font = 'bold 18px Arial, sans-serif';
    ctx.textAlign = 'center';
    ctx.fillText('VOLVER AL MENÚ', canvas.width / 2, menuBtnY + 32);
    
    // Botón SIGUIENTE NIVEL (solo si no es el nivel 50)
    if (victoryLevel < 50) {
        const nextBtnX = canvas.width / 2 - 160;
        const nextBtnY = canvas.height / 2 + 110;
        const nextBtnWidth = 300;
        const nextBtnHeight = 50;
        
        ctx.fillStyle = '#4CAF50';
        ctx.fillRect(nextBtnX, nextBtnY, nextBtnWidth, nextBtnHeight);
        ctx.strokeStyle = '#81C784';
        ctx.lineWidth = 3;
        ctx.strokeRect(nextBtnX, nextBtnY, nextBtnWidth, nextBtnHeight);
        
        ctx.fillStyle = '#FFFFFF';
        ctx.font = 'bold 18px Arial, sans-serif';
        ctx.textAlign = 'center';
        ctx.fillText('SIGUIENTE NIVEL', canvas.width / 2, nextBtnY + 32);
    }
}

function handleVictoryClick(e) {
    const rect = canvas.getBoundingClientRect();
    const screenX = e.clientX - rect.left;
    const screenY = e.clientY - rect.top;
    
    const menuBtnX = canvas.width / 2 - 160;
    const menuBtnY = canvas.height / 2 + 40;
    const menuBtnWidth = 300;
    const menuBtnHeight = 50;
    
    const nextBtnX = canvas.width / 2 - 160;
    const nextBtnY = canvas.height / 2 + 110;
    const nextBtnWidth = 300;
    const nextBtnHeight = 50;
    
    // Click en VOLVER AL MENÚ
    if (screenX >= menuBtnX && screenX <= menuBtnX + menuBtnWidth &&
        screenY >= menuBtnY && screenY <= menuBtnY + menuBtnHeight) {
        if (window.menuAPI) {
            window.menuAPI.showMainMenu();
        }
        return;
    }
    
    // Click en SIGUIENTE NIVEL
    if (screenX >= nextBtnX && screenX <= nextBtnX + nextBtnWidth &&
        screenY >= nextBtnY && screenY <= nextBtnY + nextBtnHeight) {
        // Cargar siguiente nivel
        const nextLevel = victoryLevel + 1;
        if (window.menuAPI && typeof window.menuAPI.startLevel === 'function') {
            window.menuAPI.startLevel(nextLevel);
        }
        return;
    }
}

// ==========================================
// REINICIAR DESPUÉS DE GAME OVER
// ==========================================
function restartGameAfterGameOver() {
    if (window.menuAPI) {
        window.menuAPI.showMainMenu();
    }
    
    // Resetear variables
    player.money = 100;
    player.lives = 10;
    player.currentLevel = 1;
    towers = [];
    enemies = [];
    bullets = [];
    particles = [];
    
    // Resetear variables del boss
    bossRogelio = null;
    bossActive = false;
    bossHealthBarVisible = false;
    screenShakeIntensity = 0;
    roglioAppearedText = '';
    roglioAppearedAlpha = 0;
    
    // Resetear sistema de fusión
    fusionAvailable = false;
    fusionTowers = [];
    selectedTower = null;
    
    // Reinicializar decoraciones, camino y cámara
    initPath();
    initDecorations();
    initCamera();
}

// ==========================================
// GAME LOOP PRINCIPAL
// ==========================================
function gameLoop(timestamp) {
    let deltaTime = timestamp - lastTime;
    lastTime = timestamp;
    
    update(deltaTime);
    draw();
    
    requestAnimationFrame(gameLoop);
}
