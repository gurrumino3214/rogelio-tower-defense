/**
 * ==========================================
 * SISTEMA DE HISTORIA - ROGELIO TOWER DEFENSE
 * ==========================================
 */

// Variables para la pantalla de historia
let storyScreenVisible = false;
let storyScreenLevel = 0;
let pendingLevel = null;

// Mostrar pantalla de introducción de historia
function showStoryScreen(level) {
    pendingLevel = level;
    storyScreenLevel = level;
    storyScreenVisible = true;
    const story = getLevelStory(level);
    console.log('[STORY] Mostrando introducción para Nivel ' + level + ': ' + story.title);
}

// Continuar desde pantalla de historia al juego
function continueFromStory() {
    if (pendingLevel !== null) {
        currentLevel = pendingLevel;
        pendingLevel = null;
        storyScreenVisible = false;
        if (typeof startGameFromMenu === 'function') {
            startGameFromMenu();
        }
    }
}

// Dibujar pantalla de historia
function drawStoryScreen() {
    if (!storyScreenVisible) return;
    if (!window.canvas || !window.ctx) return;
    
    const story = getLevelStory(storyScreenLevel);
    const ctx = window.ctx;
    const canvas = window.canvas;
    
    // Fondo semi-transparente
    ctx.fillStyle = 'rgba(0, 0, 0, 0.95)';
    ctx.fillRect(0, 0, canvas.width, canvas.height);
    
    // Borde decorativo
    ctx.strokeStyle = '#ffd700';
    ctx.lineWidth = 4;
    ctx.strokeRect(40, 40, canvas.width - 80, canvas.height - 80);
    
    // Título del nivel
    ctx.fillStyle = '#ffd700';
    ctx.font = 'bold 48px Arial, sans-serif';
    ctx.textAlign = 'center';
    ctx.fillText('NIVEL ' + storyScreenLevel, canvas.width / 2, canvas.height / 2 - 180);
    
    // Título de la historia
    ctx.fillStyle = '#ffffff';
    ctx.font = 'bold 32px Arial, sans-serif';
    ctx.fillText('"' + story.title + '"', canvas.width / 2, canvas.height / 2 - 120);
    
    // Texto de introducción
    ctx.fillStyle = '#cccccc';
    ctx.font = '24px Arial, sans-serif';
    ctx.textAlign = 'center';
    
    const introLines = story.intro.split('\n');
    const lineHeight = 36;
    const totalHeight = introLines.length * lineHeight;
    let startY = canvas.height / 2 - 60 - (totalHeight / 2);
    
    for (let i = 0; i < introLines.length; i++) {
        ctx.fillText(introLines[i], canvas.width / 2, startY + (i * lineHeight));
    }
    
    // Botón CONTINUAR
    const btnWidth = 250;
    const btnHeight = 50;
    const btnX = canvas.width / 2 - btnWidth / 2;
    const btnY = canvas.height / 2 + 100;
    
    const mouseX = mouseState ? mouseState.x : 0;
    const mouseY = mouseState ? mouseState.y : 0;
    const isHovering = mouseX >= btnX && mouseX <= btnX + btnWidth &&
                       mouseY >= btnY && mouseY <= btnY + btnHeight;
    
    ctx.fillStyle = isHovering ? '#ffd700' : '#8B4513';
    ctx.fillRect(btnX, btnY, btnWidth, btnHeight);
    
    ctx.strokeStyle = '#ffd700';
    ctx.lineWidth = 3;
    ctx.strokeRect(btnX, btnY, btnWidth, btnHeight);
    
    ctx.fillStyle = '#ffffff';
    ctx.font = 'bold 20px Arial, sans-serif';
    ctx.textAlign = 'center';
    ctx.fillText('CONTINUAR', canvas.width / 2, btnY + 32);
}

// Manejar clicks en la pantalla de historia
function handleStoryClick(screenX, screenY) {
    if (!storyScreenVisible) return;
    if (!window.canvas) return;
    
    const btnWidth = 250;
    const btnHeight = 50;
    const btnX = window.canvas.width / 2 - btnWidth / 2;
    const btnY = window.canvas.height / 2 + 100;
    
    if (screenX >= btnX && screenX <= btnX + btnWidth &&
        screenY >= btnY && screenY <= btnY + btnHeight) {
        continueFromStory();
    }
}

// Hacer disponibles globalmente
window.showStoryScreen = showStoryScreen;
window.continueFromStory = continueFromStory;
window.drawStoryScreen = drawStoryScreen;
window.handleStoryClick = handleStoryClick;
