// ==========================================
// ROGELIO TOWER DEFENSE - GAME.JS
// ==========================================
// Este archivo contiene la lógica principal del juego.
// NO modificar las funciones básicas del juego.
// ==========================================

// Configuración del juego
const CANVAS_WIDTH = 800;
const CANVAS_HEIGHT = 600;

// Variables globales
let canvas, ctx;
let gameState = 'MENU'; // MENU, PLAYING, PAUSED, GAMEOVER
let lastTime = 0;
let gameSpeed = 1;
let gameStartTime = 0;

// Elementos del juego
let player = {
    money: 100,
    lives: 10,
    wave: 1
};

// Entidades
let towers = [];
let enemies = [];
let bullets = [];
let particles = [];

// Sistema de boss Rogelio
let bossRogelio = null;
let bossActive = false;
let bossHealthBarVisible = false;
let screenShakeIntensity = 0;
let roglioAppearedText = '';
let roglioAppearedAlpha = 0;

// Camino (waypoints)
const path = [
    {x: 0, y: 100},
    {x: 200, y: 100},
    {x: 200, y: 400},
    {x: 500, y: 400},
    {x: 500, y: 200},
    {x: 700, y: 200},
    {x: 700, y: 500},
    {x: 800, y: 500}
];

// ==========================================
// INICIALIZACIÓN
// ==========================================
window.onload = function() {
    canvas = document.getElementById('gameCanvas');
    canvas.width = CANVAS_WIDTH;
    canvas.height = CANVAS_HEIGHT;
    ctx = canvas.getContext('2d');
    
    // Event listeners
    canvas.addEventListener('click', handleClick);
    
    // Iniciar el juego (se queda en MENU hasta que se presione Jugar)
    startGame();
};

function startGame() {
    console.log('[GAME] Juego iniciado!');
    gameState = 'MENU';
    requestAnimationFrame(gameLoop);
}

// ==========================================
// MANEJO DE CLICKS
// ==========================================
function handleClick(e) {
    const rect = canvas.getBoundingClientRect();
    const x = e.clientX - rect.left;
    const y = e.clientY - rect.top;
    
    if (gameState === 'MENU') {
        // El menú ahora maneja esto, no iniciar directamente
        return;
    } else if (gameState === 'PLAYING') {
        // Colocar torre
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
// SPAWN DE ENEMIGOS
// ==========================================
function spawnEnemy() {
    if (gameState !== 'PLAYING') return;
    
    // Verificar si es hora de spawnear al boss Rogelio (cada 10 oleadas)
    if (player.wave % 10 === 0 && !bossActive && !bossRogelio) {
        spawnBossRogelio();
        return;
    }
    
    // Determinar tipo de enemigo según oleada
    let enemyType = getEnemyTypeForWave(player.wave);
    
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
        damage: enemyType.damage || 1
    });
    
    // Spawnear siguiente enemigo después de 2 segundos
    setTimeout(spawnEnemy, 2000 / gameSpeed);
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
    if (wave % 10 === 0) index = types.length - 1; // Skeleton Lord en oleadas pares
    
    return types[index];
}

// ==========================================
// SPAWN DEL BOSS ROGELIO
// ==========================================
function spawnBossRogelio() {
    bossActive = true;
    bossRogelio = {
        x: path[0].x - 100,
        y: path[0].y,
        waypointIndex: 0,
        speed: 0.8,
        health: 5000 + (player.wave * 500),
        maxHealth: 5000 + (player.wave * 500),
        reward: 500,
        color: '#F44336',
        type: 'rogelio',
        damage: 5,
        width: 128,
        height: 128,
        attackCooldown: 0,
        specialAttackCooldown: 0,
        state: 'walking', // walking, attacking, roaring
        animationFrame: 0,
        lastAnimationUpdate: 0
    };
    
    // Efectos de aparición
    screenShakeIntensity = 20;
    bossHealthBarVisible = true;
    roglioAppearedText = '¡¡ROGELIO HA APARECIDO!!';
    roglioAppearedAlpha = 1;
    
    console.log('[BOSS] ¡Rogelio ha aparecido!');
}

// ==========================================
// ACTUALIZACIÓN DEL JUEGO
// ==========================================
function update(deltaTime) {
    if (gameState !== 'PLAYING') return;
    
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
            // Impacto
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
                        
                        enemies.splice(j, 1);
                        
                        // Actualizar HUD
                        if (window.menuAPI) {
                            window.menuAPI.updateHUD();
                        }
                    }
                    break;
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
    // Aplicar screen shake
    ctx.save();
    if (screenShakeIntensity > 0) {
        let shakeX = (Math.random() - 0.5) * screenShakeIntensity;
        let shakeY = (Math.random() - 0.5) * screenShakeIntensity;
        ctx.translate(shakeX, shakeY);
    }
    
    // Limpiar canvas
    ctx.fillStyle = '#2d2d44';
    ctx.fillRect(0, 0, CANVAS_WIDTH, CANVAS_HEIGHT);
    
    // Dibujar camino
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
    
    // Dibujar línea del camino más clara
    ctx.strokeStyle = '#777788';
    ctx.lineWidth = 30;
    ctx.stroke();
    
    // Dibujar torres
    for (let tower of towers) {
        // Rango (solo si está jugando)
        if (gameState === 'PLAYING') {
            ctx.strokeStyle = 'rgba(255, 255, 255, 0.2)';
            ctx.lineWidth = 1;
            ctx.beginPath();
            ctx.arc(tower.x, tower.y, tower.range, 0, Math.PI * 2);
            ctx.stroke();
        }
        
        // Torre
        ctx.fillStyle = tower.color;
        ctx.fillRect(tower.x - 20, tower.y - 20, 40, 40);
        
        // Detalle de la torre
        ctx.fillStyle = '#2E7D32';
        ctx.fillRect(tower.x - 10, tower.y - 10, 20, 20);
    }
    
    // Dibujar enemigos
    for (let enemy of enemies) {
        // Cuerpo del enemigo
        ctx.fillStyle = enemy.color;
        ctx.beginPath();
        ctx.arc(enemy.x, enemy.y, 15, 0, Math.PI * 2);
        ctx.fill();
        
        // Barra de vida
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
    const now = Date.now();
    
    // Determinar frame de animación según estado
    let animFrame = Math.floor((now / 100) % 8);
    let spriteKey = `boss/rogelio_walk_${animFrame}`;
    
    if (boss.state === 'attacking') {
        spriteKey = `boss/rogelio_attack_${Math.floor((now / 80) % 8)}`;
    } else if (boss.state === 'roaring') {
        spriteKey = `boss/rogelio_roar_${Math.floor((now / 150) % 6)}`;
    }
    
    // Obtener sprite o usar fallback
    if (typeof SpriteManager !== 'undefined') {
        const sprite = SpriteManager.getSprite(spriteKey);
        if (sprite) {
            ctx.imageSmoothingEnabled = false;
            // Screen shake effect
            let shakeX = (Math.random() - 0.5) * screenShakeIntensity;
            let shakeY = (Math.random() - 0.5) * screenShakeIntensity;
            ctx.drawImage(sprite, boss.x - 64 + shakeX, boss.y - 64 + shakeY, 128, 128);
            ctx.imageSmoothingEnabled = true;
        } else {
            // Fallback: dibujar rectángulo rojo grande
            drawBossFallback(boss);
        }
    } else {
        drawBossFallback(boss);
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
    const barWidth = 400;
    const barHeight = 30;
    const barX = (CANVAS_WIDTH - barWidth) / 2;
    const barY = 80;
    
    // Fondo oscuro
    ctx.fillStyle = 'rgba(0, 0, 0, 0.8)';
    ctx.fillRect(barX - 5, barY - 25, barWidth + 10, barHeight + 30);
    
    // Borde dorado
    ctx.strokeStyle = '#FFD700';
    ctx.lineWidth = 3;
    ctx.strokeRect(barX - 5, barY - 25, barWidth + 10, barHeight + 30);
    
    // Nombre
    ctx.fillStyle = '#FFD700';
    ctx.font = 'bold 20px "Press Start 2P", cursive';
    ctx.textAlign = 'center';
    ctx.fillText('ROGELIO', CANVAS_WIDTH / 2, barY - 5);
    
    // Barra de vida fondo
    ctx.fillStyle = '#333333';
    ctx.fillRect(barX, barY + 5, barWidth, barHeight);
    
    // Vida actual
    const healthPercent = boss.health / boss.maxHealth;
    let gradient = ctx.createLinearGradient(barX, barY, barX + barWidth, barY);
    gradient.addColorStop(0, '#F44336');
    gradient.addColorStop(0.5, '#FF9800');
    gradient.addColorStop(1, '#F44336');
    ctx.fillStyle = gradient;
    ctx.fillRect(barX, barY + 5, barWidth * healthPercent, barHeight);
    
    // Porcentaje
    ctx.fillStyle = '#FFFFFF';
    ctx.font = '14px "Press Start 2P", cursive';
    ctx.textAlign = 'right';
    ctx.fillText(`${Math.round(healthPercent * 100)}%`, barX + barWidth - 5, barY + 25);
}

    // Dibujar balas
    for (let bullet of bullets) {
        ctx.fillStyle = bullet.color;
        ctx.beginPath();
        ctx.arc(bullet.x, bullet.y, 5, 0, Math.PI * 2);
        ctx.fill();
    }
    
    // Dibujar UI
    drawUI();
    
    // Restaurar contexto después de screen shake
    ctx.restore();
    
    // Dibujar texto de aparición de Rogelio (fuera del shake)
    if (roglioAppearedAlpha > 0) {
        ctx.save();
        ctx.globalAlpha = roglioAppearedAlpha;
        ctx.fillStyle = '#F44336';
        ctx.font = 'bold 36px "Press Start 2P", cursive';
        ctx.textAlign = 'center';
        ctx.shadowColor = '#FF0000';
        ctx.shadowBlur = 20;
        ctx.fillText('¡¡ROGELIO HA APARECIDO!!', CANVAS_WIDTH / 2, CANVAS_HEIGHT / 2);
        ctx.restore();
    }
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
        ctx.fillRect(0, 0, CANVAS_WIDTH, CANVAS_HEIGHT);
        
        ctx.fillStyle = '#F44336';
        ctx.font = 'bold 48px "Press Start 2P", Courier New';
        ctx.textAlign = 'center';
        ctx.fillText('GAME OVER', CANVAS_WIDTH / 2, CANVAS_HEIGHT / 2 - 30);
        
        ctx.fillStyle = '#FFFFFF';
        ctx.font = '24px "Press Start 2P", Courier New';
        ctx.fillText(`Olas sobrevividas: ${player.wave}`, CANVAS_WIDTH / 2, CANVAS_HEIGHT / 2 + 20);
        
        ctx.font = '16px "Press Start 2P", Courier New';
        ctx.fillStyle = '#AAAAAA';
        ctx.fillText('Click para volver al menú', CANVAS_WIDTH / 2, CANVAS_HEIGHT / 2 + 60);
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
