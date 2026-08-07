// ==========================================
// ROGELIO TOWER DEFENSE - GAME.JS
// Versión Auditada y Reparada
// ==========================================

// Configuración del juego
let canvas, ctx;
let gameState = 'MENU'; // MENU, PLAYING, PAUSED, GAMEOVER, VICTORY
let lastTime = 0;
let gameSpeed = 1;
let gameStartTime = 0;
let timePlayedSession = 0; // Tiempo jugado en sesión actual (segundos)
let lastTimePlayedUpdate = 0;

// ==========================================
// WAVE MANAGER - ÚNICA FUENTE DE VERDAD
// ==========================================
const WaveManager = {
    wave: 1,
    spawned: 0,
    alive: 0,
    defeated: 0,
    escaped: 0,
    total: 0,
    spawnTimer: 0,
    spawnInterval: 2000,
    active: false,
    bossWave: false,
    miniBossWave: false,
    bossSpawned: false,
    bossDefeated: false,
    finalWave: 50, // Oleada final donde aparece Rogelio
    
    startWave: function(waveNum) {
        this.wave = waveNum;
        this.bossWave = (waveNum === this.finalWave); // Solo la última oleada es boss final
        this.miniBossWave = (waveNum % 10 === 0 && !this.bossWave); // Cada 10 oleadas (excepto la final) es mini boss
        this.total = 5 + Math.floor(waveNum * 1.5);
        if (this.bossWave || this.miniBossWave) {
            this.total = 3; // Menos enemigos normales en boss wave
        }
        this.spawned = 0;
        this.alive = 0;
        this.defeated = 0;
        this.escaped = 0;
        this.active = true;
        this.bossSpawned = false;
        this.bossDefeated = false;
        this.spawnTimer = 0;
        console.log('[WAVE] Oleada ' + waveNum + ' iniciada. Total: ' + this.total + 
            (this.bossWave ? ' + BOSS FINAL ROGELIO' : (this.miniBossWave ? ' + MINI BOSS' : '')));
    },
    
    update: function(deltaTime) {
        if (!this.active) return false;
        
        // Spawnear enemigos normales
        if (this.spawned < this.total && !this.bossWave && !this.miniBossWave) {
            this.spawnTimer += deltaTime * gameSpeed;
            if (this.spawnTimer >= this.spawnInterval) {
                this.spawnTimer = 0;
                this.spawnNormalEnemy();
                this.spawned++;
            }
        } else if ((this.bossWave || this.miniBossWave) && !this.bossSpawned && this.spawned >= this.total) {
            // Spawnear boss después de enemigos normales
            this.spawnBoss();
            this.bossSpawned = true;
        }
        
        // Contar enemigos vivos
        this.alive = enemies.length + (bossRogelio && bossActive ? 1 : 0);
        
        // Verificar si la oleada terminó
        if (this.spawned >= this.total && this.alive <= 0 && (!this.bossWave || this.bossDefeated)) {
            this.active = false;
            this.completeWave();
            return true;
        }
        return false;
    },
    
    spawnNormalEnemy: function() {
        let enemyType = getEnemyTypeForWave(this.wave);
        createEnemy(enemyType);
    },
    
    spawnBoss: function() {
        if (this.bossWave) {
            // Oleada final: Boss Rogelio (rojo, el más grande)
            spawnBossRogelio(true); // isFinal = true
        } else if (this.miniBossWave) {
            // Cada 10 oleadas: Mini boss random de color diferente
            spawnMiniBoss(this.wave);
        }
    },
    
    completeWave: function() {
        console.log('[WAVE] Oleada ' + this.wave + ' completada!');
        
        // Guardar max wave
        const stats = JSON.parse(localStorage.getItem('rogelioTD_stats') || '{}');
        if (!stats.maxWave || this.wave > stats.maxWave) {
            stats.maxWave = this.wave;
            localStorage.setItem('rogelioTD_stats', JSON.stringify(stats));
        }
        
        // Iniciar siguiente oleada después de 2 segundos (usando timer controlado)
        setTimeout(() => {
            if (gameState === 'PLAYING') {
                player.wave++;
                this.startWave(player.wave);
            }
        }, 2000);
    },
    
    enemyDefeated: function() {
        this.defeated++;
    },
    
    enemyEscaped: function() {
        this.escaped++;
    },
    
    bossDefeated: function() {
        this.bossDefeated = true;
        this.defeated++;
    }
};

// Variables globales del juego
let player = {
    money: 100,
    lives: 10,
    wave: 1
};

// Entidades
let towers = [];
let enemies = [];
let bullets = [];

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
    zoom: 1,
    width: 0,
    height: 0
};

function initCamera() {
    camera.width = canvas.width;
    camera.height = canvas.height;
    // Centrar cámara inicialmente
    camera.x = (worldWidth - canvas.width) / 2;
    camera.y = (worldHeight - canvas.height) / 2;
}

// Convertir coordenadas del mundo a coordenadas de pantalla
function worldToScreen(worldX, worldY) {
    return {
        x: (worldX - camera.x) * camera.zoom,
        y: (worldY - camera.y) * camera.zoom
    };
}

// Convertir coordenadas de pantalla a coordenadas del mundo
function screenToWorld(screenX, screenY) {
    return {
        x: (screenX / camera.zoom) + camera.x,
        y: (screenY / camera.zoom) + camera.y
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

function initDecorations() {
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

function initPath() {
    // El camino ahora usa coordenadas del mundo, no del canvas
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

// ==========================================
// INICIALIZACIÓN
// ==========================================
window.onload = function() {
    canvas = document.getElementById('gameCanvas');
    ctx = canvas.getContext('2d');
    
    // Ajustar canvas al tamaño de la ventana
    resizeCanvas();
    window.addEventListener('resize', resizeCanvas);
    
    // Event listeners
    canvas.addEventListener('click', handleClick);
    
    // Iniciar el juego (se queda en MENU hasta que se presione Jugar)
    startGame();
};

function resizeCanvas() {
    canvas.width = window.innerWidth;
    canvas.height = window.innerHeight;
    initPath();
    initCamera(); // Actualizar cámara al redimensionar
    console.log('[GAME] Canvas redimensionado:', canvas.width, 'x', canvas.height);
}

// Hacer resizeCanvas disponible globalmente para menu.js
window.resizeCanvas = resizeCanvas;

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
    
    // Convertir coordenadas de pantalla a coordenadas del mundo
    const worldPos = screenToWorld(screenX, screenY);
    const x = worldPos.x;
    const y = worldPos.y;
    
    if (gameState === 'MENU') {
        // El menú ahora maneja esto, no iniciar directamente
        return;
    } else if (gameState === 'PLAYING') {
        // Colocar torre (usando coordenadas del mundo)
        if (player.money >= 50) {
            player.money -= 50;
            towers.push({
                x: x,
                y: y,
                range: 150,
                damage: 25,
                fireRate: 1000,
                lastShot: 0,
                color: '#4CAF50'
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
// TIPOS DE ENEMIGOS SEGÚN OLEADA
// ==========================================
function getEnemyTypeForWave(wave) {
    const types = [
        { name: 'goblin', health: 100, speed: 2, reward: 10, color: '#8BC34A', damage: 1 },
        { name: 'bandit', health: 150, speed: 2.5, reward: 15, color: '#FF5722', damage: 2 },
        { name: 'skeleton', health: 200, speed: 1.8, reward: 20, color: '#EEEEEE', damage: 2 },
        { name: 'dark_knight', health: 300, speed: 1.5, reward: 30, color: '#3F51B5', damage: 3 },
        { name: 'skeleton_lord', health: 500, speed: 1.2, reward: 50, color: '#9C27B0', damage: 4 }
    ];
    
    // Seleccionar tipo basado en la oleada
    let index = Math.min(Math.floor((wave - 1) / 2), types.length - 1);
    // No usar skeleton_lord para oleadas de mini boss o boss final (ya hay boss)
    if (wave % 10 === 0 && wave !== WaveManager.finalWave) index = types.length - 2; // Dark Knight en oleadas de mini boss
    
    return types[index];
}

// ==========================================
// SPAWN DEL BOSS ROGELIO
// ==========================================
function spawnBossRogelio(isFinal = false) {
    bossActive = true;
    
    // Si es la oleada final, Rogelio es más grande y más poderoso
    const bossSize = isFinal ? 192 : 128;
    const bossHealth = isFinal ? 15000 + (player.wave * 1000) : 5000 + (player.wave * 500);
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
    
    // Actualizar wave manager (sistema de olas)
    WaveManager.update(deltaTime);
    
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
                    
                    // Notificar al WaveManager que un enemigo escapó
                    WaveManager.enemyEscaped();
                    
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
                        
                        // Notificar al WaveManager
                        WaveManager.bossDefeated();
                        
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
                            
                            // Notificar al WaveManager que un enemigo fue derrotado
                            WaveManager.enemyDefeated();
                            
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
    // 1. Limpiar canvas completo
    ctx.fillStyle = '#2d2d44';
    ctx.fillRect(0, 0, canvas.width, canvas.height);
    
    // 2. Aplicar transformaciones de cámara y screen shake
    ctx.save();
    
    // Aplicar zoom de la cámara
    ctx.scale(camera.zoom, camera.zoom);
    
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
    ctx.strokeStyle = '#555566';
    ctx.lineWidth = 40;
    ctx.lineCap = 'round';
    ctx.lineJoin = 'round';
    ctx.beginPath();
    ctx.moveTo(path[0].x, path[0].y);
    for (let i = 1; i < path.length; i++) {
        ctx.lineTo(path[i].x, path[i].y);
    }
    ctx.stroke();
    
    // Línea del camino más clara
    ctx.strokeStyle = '#777788';
    ctx.lineWidth = 30;
    ctx.stroke();
    
    // 5. Dibujar decoraciones (árboles, rocas, arbustos, flores)
    drawDecorations();
    
    // 6. Dibujar agua (si existe en el tilemap)
    drawWater();
    
    // 7. Dibujar torres con sprites (coordenadas del mundo)
    for (let tower of towers) {
        // Rango (solo si está jugando)
        if (gameState === 'PLAYING') {
            ctx.strokeStyle = 'rgba(255, 255, 255, 0.2)';
            ctx.lineWidth = 1;
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
    // Diseño simple: fondo de color sólido sin texturas
    const tileSize = 64;
    const cols = Math.ceil(worldWidth / tileSize);
    const rows = Math.ceil(worldHeight / tileSize);
    
    // Optimización: solo dibujar tiles visibles en el viewport de la cámara
    const startCol = Math.max(0, Math.floor(camera.x / tileSize) - 1);
    const endCol = Math.min(cols, Math.ceil((camera.x + camera.width) / tileSize) + 1);
    const startRow = Math.max(0, Math.floor(camera.y / tileSize) - 1);
    const endRow = Math.min(rows, Math.ceil((camera.y + camera.height) / tileSize) + 1);
    
    for (let row = startRow; row < endRow; row++) {
        for (let col = startCol; col < endCol; col++) {
            const x = col * tileSize;
            const y = row * tileSize;
            
            // Un solo tono de verde neutro para todo el fondo
            ctx.fillStyle = '#4A7C4E';
            ctx.fillRect(x, y, tileSize, tileSize);
        }
    }
}

// ==========================================
// DIBUJADO DE TORRES CON SPRITES
// ==========================================
function drawTowerWithSprite(tower) {
    // Torre de color café
    ctx.fillStyle = '#8B4513';
    ctx.fillRect(tower.x - 20, tower.y - 20, 40, 40);
    ctx.fillStyle = '#A0522D';
    ctx.fillRect(tower.x - 10, tower.y - 10, 20, 20);
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
// DIBUJADO DE DECORACIONES
// ==========================================
function drawDecorations() {
    // Diseño simple: dibujar decoraciones como formas básicas de color
    for (let deco of decorations) {
        // Solo dibujar si está en el viewport
        if (!isInViewport(deco.x, deco.y, deco.width, deco.height)) continue;
        
        // Dibujar rectángulo de color según tipo
        let color = '#888888';
        if (deco.type.includes('tree')) color = '#2E7D32';
        else if (deco.type.includes('bush')) color = '#4CAF50';
        else if (deco.type.includes('rock')) color = '#757575';
        else if (deco.type.includes('flower')) color = '#E91E63';
        
        ctx.fillStyle = color;
        ctx.fillRect(deco.x, deco.y, deco.width, deco.height);
    }
}

// ==========================================
// DIBUJADO DE AGUA
// ==========================================
function drawWater() {
    // Función placeholder para agua - diseño simple con color azul
    const tileSize = 64;
    const waterPositions = [
        {x: 100, y: 100}, {x: 164, y: 100}, {x: 100, y: 164}, {x: 164, y: 164}
    ];
    
    for (let pos of waterPositions) {
        if (!isInViewport(pos.x, pos.y, tileSize, tileSize)) continue;
        
        ctx.fillStyle = '#2196F3';
        ctx.fillRect(pos.x, pos.y, tileSize, tileSize);
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
    } else if (gameState === 'PLAYING') {
        // El HUD se maneja por menu.js
        // Solo actualizamos los valores
        if (window.menuAPI) {
            window.menuAPI.updateHUD();
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
        ctx.fillText(`Olas sobrevividas: ${player.wave}`, canvas.width / 2, canvas.height / 2 + 20);
        
        ctx.font = '16px Arial, sans-serif';
        ctx.fillStyle = '#AAAAAA';
        ctx.fillText('Click para volver al menú', canvas.width / 2, canvas.height / 2 + 60);
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
    player.wave = 1;
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
    
    // Reinicializar decoraciones y cámara
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
