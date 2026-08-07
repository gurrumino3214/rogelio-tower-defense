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
    
    enemies.push({
        x: path[0].x,
        y: path[0].y,
        waypointIndex: 0,
        speed: 2,
        health: 100,
        maxHealth: 100,
        reward: 10,
        color: '#FF5722'
    });
    
    // Spawnear siguiente enemigo después de 2 segundos
    setTimeout(spawnEnemy, 2000 / gameSpeed);
}

// ==========================================
// ACTUALIZACIÓN DEL JUEGO
// ==========================================
function update(deltaTime) {
    if (gameState !== 'PLAYING') return;
    
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
// DIBUJADO
// ==========================================
function draw() {
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
    
    // Dibujar balas
    for (let bullet of bullets) {
        ctx.fillStyle = bullet.color;
        ctx.beginPath();
        ctx.arc(bullet.x, bullet.y, 5, 0, Math.PI * 2);
        ctx.fill();
    }
    
    // Dibujar UI
    drawUI();
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
