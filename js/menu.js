/**
 * ==========================================
 * ROGELIO TOWER DEFENSE - MENÚ PRINCIPAL
 * ==========================================
 * Sistema de menú profesional con animaciones,
 * sonido y gestión de estados.
 */

// ==========================================
// VARIABLES GLOBALES DEL MENÚ
// ==========================================
let menuElements = {};
let audioContext = null;
let isMuted = false;
let gameState = 'MENU'; // MENU, PLAYING, PAUSED, GAMEOVER, VICTORY

// ==========================================
// INICIALIZACIÓN DEL MENÚ
// ==========================================
function initMenu() {
    console.log('[MENU] Inicializando menú principal...');
    
    // Crear elementos del menú en el DOM
    createMenuElements();
    
    // Configurar eventos
    setupMenuEvents();
    
    // Crear fondo animado
    createMenuBackground();
    
    // Cargar configuración guardada
    loadSettings();
    
    // Actualizar estadísticas
    updateStatsDisplay();
    
    console.log('[MENU] Menú inicializado correctamente');
}

// ==========================================
// CREAR ELEMENTOS DEL DOM
// ==========================================
function createMenuElements() {
    const container = document.getElementById('gameContainer');
    
    // Overlay de transición
    const transitionOverlay = document.createElement('div');
    transitionOverlay.id = 'transitionOverlay';
    transitionOverlay.className = 'transition-overlay';
    container.appendChild(transitionOverlay);
    
    // Fondo del menú
    const menuBackground = document.createElement('div');
    menuBackground.id = 'menuBackground';
    container.appendChild(menuBackground);
    
    // Menú principal
    const mainMenu = document.createElement('div');
    mainMenu.id = 'mainMenu';
    mainMenu.innerHTML = `
        <h1 class="menu-title">ROGELIO TOWER DEFENSE</h1>
        <p class="menu-subtitle">Defiende tu reino de las hordas enemigas<br>con torres estratégicas y poderosas</p>
        <div class="menu-buttons">
            <button class="menu-btn play-btn" data-action="play">▶ Jugar</button>
            <button class="menu-btn settings-btn" data-action="settings">⚙ Configuración</button>
            <button class="menu-btn howto-btn" data-action="howto">📖 Cómo jugar</button>
            <button class="menu-btn stats-btn" data-action="stats">🏆 Estadísticas</button>
            <button class="menu-btn credits-btn" data-action="credits">🎨 Créditos</button>
        </div>
    `;
    container.appendChild(mainMenu);
    
    // UI del juego (HUD)
    const gameUI = document.createElement('div');
    gameUI.id = 'gameUI';
    gameUI.className = 'hud';
    gameUI.innerHTML = `
        <div class="hud-top">
            <div class="hud-stats">
                <div class="hud-stat">
                    <div class="hud-stat-icon">❤️</div>
                    <span id="hudLives">10</span>
                </div>
                <div class="hud-stat">
                    <div class="hud-stat-icon">👹</div>
                    <span id="hudEnemies">0</span>
                </div>
                <div class="hud-stat">
                    <div class="hud-stat-icon">🌊</div>
                    <span id="hudWave">1</span>
                </div>
                <div class="hud-stat">
                    <div class="hud-stat-icon">⏱️</div>
                    <span id="hudTime">0:00</span>
                </div>
                <div class="hud-stat">
                    <div class="hud-stat-icon">💰</div>
                    <span id="hudMoney">100</span>
                </div>
            </div>
            <div class="hud-controls">
                <button class="hud-btn" id="btnPause">⏸ Pausa</button>
                <button class="hud-btn" id="btnSpeed">⏩ x1</button>
                <button class="hud-btn" id="btnRestart">🔄 Reiniciar</button>
                <button class="hud-btn" id="btnMenu">🏠 Salir</button>
            </div>
        </div>
        <div id="towerUpgradePanel" class="tower-upgrade-panel" style="display: none;">
            <div class="upgrade-info">
                <h3 id="upgradeTitle">Torre Nivel 1</h3>
                <p id="upgradeStats">Daño: 25 | Velocidad: 1.0</p>
                <p id="upgradeCost">Costo: 50 💰</p>
            </div>
            <div class="upgrade-buttons">
                <button class="upgrade-btn" id="btnUpgrade">⬆ Mejorar</button>
                <button class="upgrade-btn" id="btnCloseUpgrade">❌ Cerrar</button>
            </div>
        </div>
    `;
    container.appendChild(gameUI);
    
    // Menú de pausa
    const pauseMenu = document.createElement('div');
    pauseMenu.id = 'pauseMenu';
    pauseMenu.innerHTML = `
        <h2 class="pause-title">PAUSA</h2>
        <div class="pause-buttons">
            <button class="pause-btn" data-action="resume">Continuar</button>
            <button class="pause-btn" data-action="pauseSettings">Configuración</button>
            <button class="pause-btn" data-action="pauseRestart">Reiniciar</button>
            <button class="pause-btn" data-action="pauseMenu">Volver al Menú</button>
        </div>
    `;
    container.appendChild(pauseMenu);
    
    // Modales
    createModals(container);
    
    // Guardar referencias
    menuElements = {
        transition: transitionOverlay,
        background: menuBackground,
        mainMenu: mainMenu,
        gameUI: gameUI,
        pauseMenu: pauseMenu,
        modals: {}
    };
}

// ==========================================
// CREAR MODALES
// ==========================================
function createModals(container) {
    // Configuración
    const settingsModal = document.createElement('div');
    settingsModal.id = 'settingsModal';
    settingsModal.className = 'modal-overlay';
    settingsModal.innerHTML = `
        <div class="modal-content">
            <button class="modal-close" data-close="settings">×</button>
            <h2 class="modal-title">CONFIGURACIÓN</h2>
            <div class="modal-info">
                <p class="modal-description">Ajusta las opciones del juego para mejorar tu experiencia.</p>
            </div>
            <div class="settings-grid">
                <div class="setting-item">
                    <label class="setting-label">Pantalla Completa</label>
                    <div class="setting-control">
                        <input type="checkbox" id="settingFullscreen">
                    </div>
                </div>
                <div class="setting-item">
                    <label class="setting-label">Mostrar FPS</label>
                    <div class="setting-control">
                        <input type="checkbox" id="settingFPS">
                    </div>
                </div>
                <div class="setting-item">
                    <label class="setting-label">Efectos Visuales</label>
                    <div class="setting-control">
                        <input type="checkbox" id="settingEffects" checked>
                    </div>
                </div>
            </div>
            <button class="settings-save-btn" id="btnRestoreDefaults">🔄 Restaurar Valores Predeterminados</button>
            <button class="settings-save-btn" id="btnSaveSettings" style="margin-top: 10px;">✓ Volver</button>
        </div>
    `;
    container.appendChild(settingsModal);
    
    // Cómo jugar - Tutorial
    const howtoModal = document.createElement('div');
    howtoModal.id = 'howtoModal';
    howtoModal.className = 'modal-overlay';
    howtoModal.innerHTML = `
        <div class="modal-content" style="max-width: 900px;">
            <button class="modal-close" data-close="howto">×</button>
            <h2 class="modal-title">TUTORIAL</h2>
            <div id="tutorialPages" style="min-height: 400px;">
                <!-- Las páginas se generan dinámicamente -->
            </div>
            <div style="display: flex; justify-content: space-between; align-items: center; margin-top: 20px;">
                <button class="menu-btn" id="btnTutorialPrev" style="min-width: 120px; padding: 10px 20px;">◀ Anterior</button>
                <span id="tutorialPageIndicator" style="color: #ffd700; font-size: 16px;">1 / 7</span>
                <button class="menu-btn" id="btnTutorialNext" style="min-width: 120px; padding: 10px 20px;">Siguiente ▶</button>
            </div>
            <button class="menu-btn" id="btnTutorialExit" style="margin-top: 15px; width: 100%;">Volver al Menú</button>
        </div>
    `;
    container.appendChild(howtoModal);
    
    // Estadísticas
    const statsModal = document.createElement('div');
    statsModal.id = 'statsModal';
    statsModal.className = 'modal-overlay';
    statsModal.innerHTML = `
        <div class="modal-content">
            <button class="modal-close" data-close="stats">×</button>
            <h2 class="modal-title">ESTADÍSTICAS</h2>
            <div class="modal-info">
                <p class="modal-description">Revisa tu progreso y logros en el juego. Estas estadísticas muestran tu desempeño como estratega en la defensa del reino.</p>
            </div>
            <div class="stats-grid">
                <div class="stat-item">
                    <div class="stat-value" id="statGamesPlayed">0</div>
                    <div class="stat-label">Partidas Jugadas</div>
                </div>
                <div class="stat-item">
                    <div class="stat-value" id="statVictories">0</div>
                    <div class="stat-label">Victorias</div>
                </div>
                <div class="stat-item">
                    <div class="stat-value" id="statDefeats">0</div>
                    <div class="stat-label">Derrotas</div>
                </div>
                <div class="stat-item">
                    <div class="stat-value" id="statMaxWave">0</div>
                    <div class="stat-label">Mayor Oleada</div>
                </div>
                <div class="stat-item">
                    <div class="stat-value" id="statTowersPlaced">0</div>
                    <div class="stat-label">Torres Colocadas</div>
                </div>
                <div class="stat-item">
                    <div class="stat-value" id="statEnemiesDefeated">0</div>
                    <div class="stat-label">Enemigos Derrotados</div>
                </div>
                <div class="stat-item">
                    <div class="stat-value" id="statTimePlayed">0h</div>
                    <div class="stat-label">Tiempo Jugado</div>
                </div>
            </div>
        </div>
    `;
    container.appendChild(statsModal);
    
    // Créditos
    const creditsModal = document.createElement('div');
    creditsModal.id = 'creditsModal';
    creditsModal.className = 'modal-overlay';
    creditsModal.innerHTML = `
        <div class="modal-content" style="max-width: 500px;">
            <button class="modal-close" data-close="credits">×</button>
            <h2 class="modal-title" style="font-size: 32px; margin-bottom: 10px;">ROGELIO TOWER DEFENSE</h2>
            <div class="modal-info" style="margin-bottom: 30px;">
                <p class="modal-description">Un agradecimiento especial a todas las personas que hicieron posible este juego.</p>
            </div>
            <div class="credits-list" id="creditsContent">
                <div class="credits-section" style="margin-bottom: 25px;">
                    <h3 class="credits-role" style="color: #ffd700; font-size: 20px; margin-bottom: 10px;">DESARROLLO</h3>
                    <p class="credits-name" style="color: #ffffff; font-size: 16px;">Gurrumino3214</p>
                </div>
                
                <div class="credits-section" style="margin-bottom: 25px;">
                    <h3 class="credits-role" style="color: #ffd700; font-size: 20px; margin-bottom: 10px;">PROGRAMACIÓN</h3>
                    <p class="credits-name" style="color: #ffffff; font-size: 16px;">HTML • CSS • JavaScript</p>
                </div>
                
                <div class="credits-section" style="margin-bottom: 25px;">
                    <h3 class="credits-role" style="color: #ffd700; font-size: 20px; margin-bottom: 10px;">ARTE</h3>
                    <p class="credits-name" style="color: #ffffff; font-size: 16px;">Pixel Art / Assets del proyecto</p>
                </div>
                
                <div class="credits-section" style="margin-bottom: 25px;">
                    <h3 class="credits-role" style="color: #ffd700; font-size: 20px; margin-bottom: 10px;">TECNOLOGÍAS</h3>
                    <p class="credits-name" style="color: #ffffff; font-size: 16px;">HTML5 • CSS3 • JavaScript • Canvas API</p>
                </div>
                
                <p class="credits-thanks" style="color: #ffd700; font-size: 18px; margin-top: 30px;">¡Gracias por jugar!</p>
            </div>
            <button class="menu-btn" id="btnCreditsExit" style="margin-top: 20px; width: 100%;">VOLVER AL MENÚ</button>
        </div>
    `;
    container.appendChild(creditsModal);
    
    // Guardar referencias de modales
    menuElements.modals = {
        settings: settingsModal,
        howto: howtoModal,
        stats: statsModal,
        credits: creditsModal
    };
}

// ==========================================
// FONDO ANIMADO
// ==========================================
function createMenuBackground() {
    const bg = document.getElementById('menuBackground');
    
    // Niebla
    for (let i = 0; i < 3; i++) {
        const fog = document.createElement('div');
        fog.className = 'menu-fog';
        bg.appendChild(fog);
    }
    
    // Partículas
    for (let i = 0; i < 30; i++) {
        const particle = document.createElement('div');
        particle.className = 'menu-particle';
        particle.style.left = Math.random() * 100 + '%';
        particle.style.animationDelay = Math.random() * 15 + 's';
        particle.style.animationDuration = (15 + Math.random() * 10) + 's';
        bg.appendChild(particle);
    }
    
    // Luces
    for (let i = 0; i < 3; i++) {
        const light = document.createElement('div');
        light.className = 'menu-light';
        light.style.left = (20 + i * 30) + '%';
        light.style.top = (30 + Math.random() * 40) + '%';
        light.style.animationDelay = (i * 2) + 's';
        bg.appendChild(light);
    }
}

// ==========================================
// CONFIGURAR EVENTOS
// ==========================================
function setupMenuEvents() {
    // Botones del menú principal
    document.querySelectorAll('.menu-btn').forEach(btn => {
        btn.addEventListener('click', handleMenuButtonClick);
        btn.addEventListener('mouseenter', () => playSound('hover'));
    });
    
    // Botones de pausa
    document.querySelectorAll('.pause-btn').forEach(btn => {
        btn.addEventListener('click', handlePauseButtonClick);
        btn.addEventListener('mouseenter', () => playSound('hover'));
    });
    
    // Botones del HUD
    document.getElementById('btnPause')?.addEventListener('click', togglePause);
    document.getElementById('btnSpeed')?.addEventListener('click', toggleSpeed);
    document.getElementById('btnRestart')?.addEventListener('click', restartGame);
    document.getElementById('btnMenu')?.addEventListener('click', showMainMenu);
    
    // Botones del panel de mejora de torre
    document.getElementById('btnUpgrade')?.addEventListener('click', upgradeSelectedTower);
    document.getElementById('btnCloseUpgrade')?.addEventListener('click', closeTowerUpgradePanel);
    
    // Botón guardar configuración (Volver)
    document.getElementById('btnSaveSettings')?.addEventListener('click', saveSettings);
    
    // Botón restaurar valores predeterminados
    document.getElementById('btnRestoreDefaults')?.addEventListener('click', restoreDefaultSettings);
    
    // Botones del tutorial
    document.getElementById('btnTutorialPrev')?.addEventListener('click', () => showTutorialPage(currentTutorialPage - 1));
    document.getElementById('btnTutorialNext')?.addEventListener('click', () => showTutorialPage(currentTutorialPage + 1));
    document.getElementById('btnTutorialExit')?.addEventListener('click', () => closeModal('howto'));
    
    // Botón de créditos
    document.getElementById('btnCreditsExit')?.addEventListener('click', () => closeModal('credits'));
    
    // Cerrar modales
    document.querySelectorAll('.modal-close').forEach(btn => {
        btn.addEventListener('click', () => {
            const modalId = btn.getAttribute('data-close');
            closeModal(modalId);
        });
    });
    
    // Teclado
    document.addEventListener('keydown', handleKeyDown);
}

// ==========================================
// MANEJADOR DE TECLAS
// ==========================================
let currentTutorialPage = 1;
const totalTutorialPages = 7;

function handleKeyDown(e) {
    // Escape - Pausa o cerrar modal
    if (e.key === 'Escape') {
        const activeModal = document.querySelector('.modal-overlay.active');
        if (activeModal) {
            activeModal.classList.remove('active');
        } else if (gameState === 'PLAYING') {
            togglePause();
        }
    }
    
    // Flechas para tutorial
    if (e.key === 'ArrowLeft' && document.getElementById('howtoModal')?.classList.contains('active')) {
        showTutorialPage(currentTutorialPage - 1);
    }
    if (e.key === 'ArrowRight' && document.getElementById('howtoModal')?.classList.contains('active')) {
        showTutorialPage(currentTutorialPage + 1);
    }
    
    // Enter - Confirmar
    if (e.key === 'Enter') {
        const focusedBtn = document.activeElement;
        if (focusedBtn && focusedBtn.tagName === 'BUTTON') {
            focusedBtn.click();
        }
    }
    
    // Espacio - Confirmar en menús
    if (e.key === ' ' && gameState !== 'PLAYING') {
        e.preventDefault();
        const focusedBtn = document.activeElement;
        if (focusedBtn && focusedBtn.tagName === 'BUTTON') {
            focusedBtn.click();
        }
    }
}

// ==========================================
// MANEJADOR DE BOTONES DEL MENÚ
// ==========================================
function handleMenuButtonClick(e) {
    const action = e.target.getAttribute('data-action');
    playSound('click');
    
    switch(action) {
        case 'play':
            startGameFromMenu();
            break;
        case 'settings':
            openModal('settings');
            break;
        case 'howto':
            openModal('howto');
            break;
        case 'stats':
            openModal('stats');
            updateStatsDisplay();
            break;
        case 'credits':
            openModal('credits');
            break;
    }
}

// ==========================================
// MANEJADOR DE BOTONES DE PAUSA
// ==========================================
function handlePauseButtonClick(e) {
    const action = e.target.getAttribute('data-action');
    playSound('click');
    
    switch(action) {
        case 'resume':
            togglePause();
            break;
        case 'pauseSettings':
            openModal('settings');
            break;
        case 'pauseRestart':
            restartGame();
            break;
        case 'pauseMenu':
            showMainMenu();
            break;
    }
}

// ==========================================
// ABRIR/CERRAR MODALES
// ==========================================
function openModal(modalName) {
    const modal = menuElements.modals[modalName];
    if (modal) {
        // Inicializar audio si es necesario antes de reproducir sonido
        if (!audioContext) {
            initAudio();
        }
        modal.classList.add('active');
        playSound('open');
        
        // Resetear tutorial a página 1 cuando se abre
        if (modalName === 'howto') {
            showTutorialPage(1);
        }
    }
}

function closeModal(modalName) {
    const modal = menuElements.modals[modalName];
    if (modal) {
        modal.classList.remove('active');
        playSound('close');
    }
}

// ==========================================
// SISTEMA DE AUDIO
// ==========================================
function initAudio() {
    if (!audioContext) {
        audioContext = new (window.AudioContext || window.webkitAudioContext)();
    }
}

function playSound(type) {
    if (isMuted || !audioContext) return;
    
    const oscillator = audioContext.createOscillator();
    const gainNode = audioContext.createGain();
    
    oscillator.connect(gainNode);
    gainNode.connect(audioContext.destination);
    
    switch(type) {
        case 'hover':
            oscillator.frequency.value = 800;
            oscillator.type = 'sine';
            gainNode.gain.setValueAtTime(0.05, audioContext.currentTime);
            gainNode.gain.exponentialRampToValueAtTime(0.01, audioContext.currentTime + 0.1);
            oscillator.start(audioContext.currentTime);
            oscillator.stop(audioContext.currentTime + 0.1);
            break;
        case 'click':
            oscillator.frequency.value = 600;
            oscillator.type = 'square';
            gainNode.gain.setValueAtTime(0.1, audioContext.currentTime);
            gainNode.gain.exponentialRampToValueAtTime(0.01, audioContext.currentTime + 0.15);
            oscillator.start(audioContext.currentTime);
            oscillator.stop(audioContext.currentTime + 0.15);
            break;
        case 'open':
            oscillator.frequency.value = 400;
            oscillator.type = 'sine';
            gainNode.gain.setValueAtTime(0.1, audioContext.currentTime);
            gainNode.gain.linearRampToValueAtTime(0.1, audioContext.currentTime + 0.1);
            gainNode.gain.exponentialRampToValueAtTime(0.01, audioContext.currentTime + 0.3);
            oscillator.start(audioContext.currentTime);
            oscillator.stop(audioContext.currentTime + 0.3);
            break;
        case 'close':
            oscillator.frequency.value = 300;
            oscillator.type = 'sine';
            gainNode.gain.setValueAtTime(0.1, audioContext.currentTime);
            gainNode.gain.exponentialRampToValueAtTime(0.01, audioContext.currentTime + 0.2);
            oscillator.start(audioContext.currentTime);
            oscillator.stop(audioContext.currentTime + 0.2);
            break;
    }
}

// ==========================================
// CONFIGURACIÓN - GUARDAR/CARGAR
// ==========================================
function saveSettings() {
    const settings = {
        fullscreen: document.getElementById('settingFullscreen').checked,
        showFPS: document.getElementById('settingFPS').checked,
        effects: document.getElementById('settingEffects').checked
    };
    
    localStorage.setItem('rogelioTD_settings', JSON.stringify(settings));
    
    // Aplicar configuración
    applySettings(settings);
    
    playSound('click');
    closeModal('settings');
    
    console.log('[SETTINGS] Configuración guardada');
}

function restoreDefaultSettings() {
    document.getElementById('settingFullscreen').checked = false;
    document.getElementById('settingFPS').checked = false;
    document.getElementById('settingEffects').checked = true;
    
    playSound('click');
    console.log('[SETTINGS] Valores restaurados');
}

function loadSettings() {
    const saved = localStorage.getItem('rogelioTD_settings');
    if (saved) {
        const settings = JSON.parse(saved);
        
        document.getElementById('settingFullscreen').checked = settings.fullscreen || false;
        document.getElementById('settingFPS').checked = settings.showFPS || false;
        document.getElementById('settingEffects').checked = settings.effects !== false;
        
        applySettings(settings);
    }
}

function applySettings(settings) {
    if (settings.fullscreen) {
        document.documentElement.requestFullscreen().catch(() => {});
    }
    
    // Guardar estado de efectos visuales para el juego
    window.visualEffectsEnabled = settings.effects !== false;
    window.showFPSEnabled = settings.showFPS || false;
}

// ==========================================
// ESTADÍSTICAS
// ==========================================
function updateStatsDisplay() {
    const stats = getStats();
    
    document.getElementById('statGamesPlayed').textContent = stats.gamesPlayed;
    document.getElementById('statVictories').textContent = stats.victories;
    document.getElementById('statDefeats').textContent = stats.defeats;
    document.getElementById('statMaxWave').textContent = stats.maxWave;
    document.getElementById('statTowersPlaced').textContent = stats.towersPlaced;
    document.getElementById('statEnemiesDefeated').textContent = stats.enemiesDefeated;
    
    // Formatear tiempo
    const hours = Math.floor(stats.timePlayed / 3600);
    const minutes = Math.floor((stats.timePlayed % 3600) / 60);
    document.getElementById('statTimePlayed').textContent = `${hours}h ${minutes}m`;
}

function getStats() {
    const saved = localStorage.getItem('rogelioTD_stats');
    if (saved) {
        return JSON.parse(saved);
    }
    return {
        gamesPlayed: 0,
        victories: 0,
        defeats: 0,
        maxWave: 0,
        towersPlaced: 0,
        enemiesDefeated: 0,
        timePlayed: 0
    };
}

function saveStats(stats) {
    localStorage.setItem('rogelioTD_stats', JSON.stringify(stats));
}

function incrementStat(statName, value = 1) {
    const stats = getStats();
    stats[statName] = (stats[statName] || 0) + value;
    saveStats(stats);
}

// ==========================================
// TUTORIAL - PÁGINAS Y NAVEGACIÓN
// ==========================================
const tutorialPagesData = [
    {
        title: "📜 OBJETIVO DEL JUEGO",
        content: `
            <div style="display: grid; grid-template-columns: 1fr 1fr; gap: 20px; align-items: center;">
                <div>
                    <h3 style="color: #ffd700; margin-bottom: 15px;">¿Qué es Rogelio Tower Defense?</h3>
                    <p style="color: #cccccc; line-height: 1.6; margin-bottom: 15px;">
                        Rogelio Tower Defense es un juego de estrategia donde debes defender tu reino de las hordas enemigas utilizando torres estratégicamente colocadas.
                    </p>
                    <h3 style="color: #44ff44; margin-bottom: 10px;">✅ Cómo Ganar</h3>
                    <p style="color: #cccccc; line-height: 1.6;">
                        Sobrevive a todas las oleadas de enemigos. Si logras llegar a la última oleada y derrotar al jefe final Rogelio, ¡habrás ganado!
                    </p>
                    <h3 style="color: #ff4444; margin-bottom: 10px; margin-top: 15px;">❌ Condición de Derrota</h3>
                    <p style="color: #cccccc; line-height: 1.6;">
                        Si los enemigos llegan al final del camino, pierdes vidas. Cuando llegues a 0 vidas, el juego termina.
                    </p>
                </div>
                <div style="text-align: center;">
                    <div style="font-size: 80px;">🏰</div>
                    <p style="color: #ffd700; margin-top: 10px;">¡Defiende tu Reino!</p>
                </div>
            </div>
        `
    },
    {
        title: "🗼 TORRES DISPONIBLES",
        content: `
            <div style="display: grid; grid-template-columns: repeat(3, 1fr); gap: 15px;">
                <div style="background: rgba(255,255,255,0.05); padding: 15px; border-radius: 8px; text-align: center; border: 1px solid #ffd700;">
                    <div style="font-size: 40px;">🎯</div>
                    <h4 style="color: #ffd700; margin: 10px 0;">Torre Básica</h4>
                    <p style="color: #aaaaaa; font-size: 13px;">Daño: 25 | Rango: Medio</p>
                    <p style="color: #cccccc; font-size: 12px;">Torre equilibrada para empezar</p>
                </div>
                <div style="background: rgba(255,255,255,0.05); padding: 15px; border-radius: 8px; text-align: center; border: 1px solid #ff6b6b;">
                    <div style="font-size: 40px;">💥</div>
                    <h4 style="color: #ff6b6b; margin: 10px 0;">Torre Explosiva</h4>
                    <p style="color: #aaaaaa; font-size: 13px;">Daño: 50 | Rango: Corto</p>
                    <p style="color: #cccccc; font-size: 12px;">Alto daño en área</p>
                </div>
                <div style="background: rgba(255,255,255,0.05); padding: 15px; border-radius: 8px; text-align: center; border: 1px solid #4ecdc4;">
                    <div style="font-size: 40px;">❄️</div>
                    <h4 style="color: #4ecdc4; margin: 10px 0;">Torre de Hielo</h4>
                    <p style="color: #aaaaaa; font-size: 13px;">Daño: 15 | Rango: Largo</p>
                    <p style="color: #cccccc; font-size: 12px;">Ralentiza enemigos</p>
                </div>
            </div>
            <p style="color: #cccccc; text-align: center; margin-top: 20px; line-height: 1.6;">
                Cada torre cuesta 💰50 monedas iniciales. Puedes mejorarlas para aumentar su efectividad.
            </p>
        `
    },
    {
        title: "🏗️ CÓMO COLOCAR TORRES",
        content: `
            <div style="display: grid; grid-template-columns: repeat(4, 1fr); gap: 10px; margin-bottom: 20px;">
                <div style="text-align: center;">
                    <div style="font-size: 30px; background: #ffd700; color: #0a0a0f; width: 50px; height: 50px; border-radius: 50%; display: flex; align-items: center; justify-content: center; margin: 0 auto 10px;">1</div>
                    <p style="color: #ffffff; font-size: 13px;">Selecciona una torre</p>
                </div>
                <div style="text-align: center;">
                    <div style="font-size: 30px; background: #ffd700; color: #0a0a0f; width: 50px; height: 50px; border-radius: 50%; display: flex; align-items: center; justify-content: center; margin: 0 auto 10px;">2</div>
                    <p style="color: #ffffff; font-size: 13px;">Busca posición válida</p>
                </div>
                <div style="text-align: center;">
                    <div style="font-size: 30px; background: #ffd700; color: #0a0a0f; width: 50px; height: 50px; border-radius: 50%; display: flex; align-items: center; justify-content: center; margin: 0 auto 10px;">3</div>
                    <p style="color: #ffffff; font-size: 13px;">Haz click para colocar</p>
                </div>
                <div style="text-align: center;">
                    <div style="font-size: 30px; background: #ffd700; color: #0a0a0f; width: 50px; height: 50px; border-radius: 50%; display: flex; align-items: center; justify-content: center; margin: 0 auto 10px;">4</div>
                    <p style="color: #ffffff; font-size: 13px;">La torre atacará automáticamente</p>
                </div>
            </div>
            <div style="background: rgba(255,215,0,0.1); padding: 15px; border-radius: 8px; border-left: 4px solid #ffd700;">
                <p style="color: #cccccc; line-height: 1.6;">
                    <strong style="color: #ffd700;">💡 Consejo:</strong> No puedes colocar torres sobre el camino. Busca zonas verdes o áreas destacadas en el mapa. 
                    Las torres tienen un rango de ataque circular que se muestra al seleccionarlas.
                </p>
            </div>
        `
    },
    {
        title: "⬆️ MEJORAR TORRES",
        content: `
            <div style="display: grid; grid-template-columns: 1fr 1fr; gap: 20px;">
                <div>
                    <h3 style="color: #ffd700; margin-bottom: 15px;">¿Cómo Mejorar?</h3>
                    <ol style="color: #cccccc; line-height: 2; padding-left: 20px;">
                        <li>Haz click en una torre existente</li>
                        <li>Se abrirá el panel de mejora</li>
                        <li>Haz click en "Mejorar" si tienes suficiente dinero</li>
                        <li>¡Tu torre será más poderosa!</li>
                    </ol>
                </div>
                <div>
                    <h3 style="color: #44ff44; margin-bottom: 15px;">Beneficios por Nivel</h3>
                    <div style="background: rgba(68,255,68,0.1); padding: 15px; border-radius: 8px;">
                        <p style="color: #ffffff; margin: 5px 0;">➕ Daño: +50% por nivel</p>
                        <p style="color: #ffffff; margin: 5px 0;">⚡ Velocidad: +15% por nivel</p>
                        <p style="color: #ffd700; margin: 10px 0 5px 0;">💰 Costo: Nivel × 50</p>
                    </div>
                </div>
            </div>
            <p style="color: #cccccc; text-align: center; margin-top: 20px; line-height: 1.6;">
                Puedes mejorar hasta <strong style="color: #ffd700;">Nivel 5 (MÁX)</strong>. ¡Planifica bien tus mejoras!
            </p>
        `
    },
    {
        title: "👹 ENEMIGOS",
        content: `
            <div style="display: grid; grid-template-columns: repeat(3, 1fr); gap: 15px;">
                <div style="background: rgba(255,255,255,0.05); padding: 15px; border-radius: 8px; text-align: center;">
                    <div style="font-size: 40px;">👾</div>
                    <h4 style="color: #ffffff; margin: 10px 0;">Enemigo Básico</h4>
                    <p style="color: #aaaaaa; font-size: 12px;">Vida: Baja | Velocidad: Media</p>
                    <p style="color: #cccccc; font-size: 11px;">El enemigo más común</p>
                </div>
                <div style="background: rgba(255,255,255,0.05); padding: 15px; border-radius: 8px; text-align: center;">
                    <div style="font-size: 40px;">🛡️</div>
                    <h4 style="color: #ff6b6b; margin: 10px 0;">Enemigo Blindado</h4>
                    <p style="color: #aaaaaa; font-size: 12px;">Vida: Alta | Velocidad: Lenta</p>
                    <p style="color: #cccccc; font-size: 11px;">Resistente pero lento</p>
                </div>
                <div style="background: rgba(255,255,255,0.05); padding: 15px; border-radius: 8px; text-align: center;">
                    <div style="font-size: 40px;">⚡</div>
                    <h4 style="color: #4ecdc4; margin: 10px 0;">Enemigo Rápido</h4>
                    <p style="color: #aaaaaa; font-size: 12px;">Vida: Media | Velocidad: Alta</p>
                    <p style="color: #cccccc; font-size: 11px;">Difícil de alcanzar</p>
                </div>
            </div>
            <p style="color: #cccccc; text-align: center; margin-top: 20px; line-height: 1.6;">
                Cada tipo de enemigo requiere una estrategia diferente. ¡Adapta tus torres según la oleada!
            </p>
        `
    },
    {
        title: "🌊 OLEADAS",
        content: `
            <div style="display: grid; grid-template-columns: 1fr 1fr; gap: 20px; align-items: center;">
                <div>
                    <h3 style="color: #ffd700; margin-bottom: 15px;">¿Qué son las Oleadas?</h3>
                    <p style="color: #cccccc; line-height: 1.6; margin-bottom: 15px;">
                        Las oleadas son grupos de enemigos que atacan secuencialmente. Cada oleada es más difícil que la anterior.
                    </p>
                    <h3 style="color: #44ff44; margin-bottom: 10px;">Entre Oleadas</h3>
                    <ul style="color: #cccccc; line-height: 1.8; padding-left: 20px;">
                        <li>Tienes tiempo para prepararte</li>
                        <li>Coloca más torres</li>
                        <li>Mejora las existentes</li>
                        <li>Planifica tu estrategia</li>
                    </ul>
                </div>
                <div style="text-align: center;">
                    <div style="font-size: 80px;">🌊</div>
                    <p style="color: #ffd700; margin-top: 10px; font-size: 24px;">Oleada <span style="color: #ffffff;">1</span> de <span style="color: #ffffff;">∞</span></p>
                    <p style="color: #aaaaaa; margin-top: 5px;">¡Prepárate!</p>
                </div>
            </div>
            <div style="background: rgba(255,215,0,0.1); padding: 15px; border-radius: 8px; border-left: 4px solid #ffd700; margin-top: 20px;">
                <p style="color: #cccccc; line-height: 1.6;">
                    <strong style="color: #ffd700;">💡 Consejo:</strong> Usa el tiempo entre oleadas sabiamente. Una buena preparación puede marcar la diferencia entre la victoria y la derrota.
                </p>
            </div>
        `
    },
    {
        title: "👑 ROGELIO - JEFE FINAL",
        content: `
            <div style="display: grid; grid-template-columns: 1fr 1fr; gap: 20px; align-items: center;">
                <div style="text-align: center;">
                    <div style="font-size: 100px;">👹</div>
                    <p style="color: #ff4444; margin-top: 10px; font-size: 24px; font-weight: bold;">ROGELIO</p>
                    <p style="color: #aaaaaa;">El Jefe Final</p>
                </div>
                <div>
                    <h3 style="color: #ff4444; margin-bottom: 15px;">El Desafío Definitivo</h3>
                    <p style="color: #cccccc; line-height: 1.6; margin-bottom: 15px;">
                        Rogelio es el jefe final más poderoso. Aparece en la última oleada con estadísticas masivas.
                    </p>
                    <div style="background: rgba(255,68,68,0.1); padding: 15px; border-radius: 8px; border: 1px solid #ff4444;">
                        <p style="color: #ff4444; margin: 5px 0;"><strong>❤️ Vida Enorme</strong></p>
                        <p style="color: #ff4444; margin: 5px 0;"><strong>⚔️ Daño Devastador</strong></p>
                        <p style="color: #ff4444; margin: 5px 0;"><strong>🛡️ Resistencia Extrema</strong></p>
                    </div>
                </div>
            </div>
            <div style="background: rgba(255,215,0,0.1); padding: 15px; border-radius: 8px; border-left: 4px solid #ffd700; margin-top: 20px;">
                <p style="color: #cccccc; line-height: 1.6;">
                    <strong style="color: #ffd700;">💡 Estrategia:</strong> Para derrotar a Rogelio necesitas torres de alto nivel, buena distribución y muchas mejoras. ¡No escatimes en recursos!
                </p>
            </div>
        `
    }
];

function showTutorialPage(pageNum) {
    // Limitar página entre 1 y totalTutorialPages
    if (pageNum < 1) pageNum = 1;
    if (pageNum > totalTutorialPages) pageNum = totalTutorialPages;
    
    currentTutorialPage = pageNum;
    
    const container = document.getElementById('tutorialPages');
    const indicator = document.getElementById('tutorialPageIndicator');
    const prevBtn = document.getElementById('btnTutorialPrev');
    const nextBtn = document.getElementById('btnTutorialNext');
    
    if (container && indicator) {
        // Actualizar contenido
        const pageData = tutorialPagesData[pageNum - 1];
        container.innerHTML = `
            <div style="animation: fadeIn 0.3s ease;">
                <h3 style="color: #ffd700; font-size: 24px; margin-bottom: 20px; text-align: center;">${pageData.title}</h3>
                ${pageData.content}
            </div>
        `;
        
        // Actualizar indicador
        indicator.textContent = `${pageNum} / ${totalTutorialPages}`;
        
        // Actualizar estado de botones
        if (prevBtn) prevBtn.disabled = pageNum === 1;
        if (nextBtn) nextBtn.disabled = pageNum === totalTutorialPages;
    }
}

// Añadir animación CSS para fade in del tutorial y créditos
const menuAnimationsStyle = document.createElement('style');
menuAnimationsStyle.textContent = `
    @keyframes fadeIn {
        from { opacity: 0; transform: translateX(20px); }
        to { opacity: 1; transform: translateX(0); }
    }
    
    @keyframes creditsSlideIn {
        from { opacity: 0; transform: translateY(30px); }
        to { opacity: 1; transform: translateY(0); }
    }
    
    .credits-section {
        animation: creditsSlideIn 0.5s ease forwards;
        opacity: 0;
    }
    
    .credits-section:nth-child(1) { animation-delay: 0.1s; }
    .credits-section:nth-child(2) { animation-delay: 0.2s; }
    .credits-section:nth-child(3) { animation-delay: 0.3s; }
    .credits-section:nth-child(4) { animation-delay: 0.4s; }
    .credits-thanks { animation-delay: 0.5s; }
`;
document.head.appendChild(menuAnimationsStyle);

// ==========================================
// TRANSICIONES
// ==========================================
function fadeTransition(callback) {
    const overlay = menuElements.transition;
    
    overlay.classList.add('fade-in');
    
    setTimeout(() => {
        callback();
        setTimeout(() => {
            overlay.classList.remove('fade-in');
        }, 300); // Transición más rápida
    }, 300); // Transición más rápida
}

// ==========================================
// ACCIONES DEL MENÚ
// ==========================================
function startGameFromMenu() {
    fadeTransition(() => {
        initAudio();
        
        // Ocultar menú y fondo usando clases CSS para asegurar que se oculten completamente
        menuElements.mainMenu.classList.add('hidden');
        menuElements.background.classList.add('hidden');
        menuElements.mainMenu.style.display = 'none';
        menuElements.background.style.display = 'none';
        
        menuElements.gameUI.classList.add('active');
        gameState = 'PLAYING';

        // Asegurar que el canvas ocupe toda la pantalla y sea visible
        if (typeof resizeCanvas === 'function') {
            resizeCanvas();
        }
        
        // Asegurar que el canvas esté visible
        const gameCanvas = document.getElementById('gameCanvas');
        if (gameCanvas) {
            gameCanvas.style.display = 'block';
            gameCanvas.style.visibility = 'visible';
            gameCanvas.style.opacity = '1';
        }

        // Resetear variables del juego
        player.money = 100;
        player.lives = 10;
        player.wave = 1;
        towers = [];
        enemies = [];
        bullets = [];
        particles = [];
        
        // Resetear variables del boss Rogelio
        if (typeof bossRogelio !== 'undefined') {
            bossRogelio = null;
        }
        if (typeof bossActive !== 'undefined') {
            bossActive = false;
        }

        // Reinicializar camino y decoraciones
        if (typeof initPath === 'function') initPath();
        if (typeof initDecorations === 'function') initDecorations();
        if (typeof initCamera === 'function') initCamera();

        // Incrementar partidas jugadas
        incrementStat('gamesPlayed');

        // Iniciar temporizador de juego
        gameStartTime = Date.now();

        // Actualizar HUD
        updateHUD();

        // Iniciar primera oleada usando WaveManager
        WaveManager.startWave(player.wave);
        
        console.log('[MENU] Juego iniciado - Canvas:', gameCanvas ? 'visible' : 'no encontrado');
    });
}

function togglePause() {
    if (gameState === 'PLAYING') {
        gameState = 'PAUSED';
        menuElements.pauseMenu.classList.add('active');
    } else if (gameState === 'PAUSED') {
        gameState = 'PLAYING';
        menuElements.pauseMenu.classList.remove('active');
    }
}

function toggleSpeed() {
    const btn = document.getElementById('btnSpeed');
    if (gameSpeed === 1) {
        gameSpeed = 2;
        btn.textContent = '⏩ x2';
        btn.classList.add('active');
    } else {
        gameSpeed = 1;
        btn.textContent = '⏩ x1';
        btn.classList.remove('active');
    }
}

function restartGame() {
    fadeTransition(() => {
        // Resetear variables del juego
        player.money = 100;
        player.lives = 10;
        player.wave = 1;
        towers = [];
        enemies = [];
        bullets = [];
        particles = [];
        
        // Resetear variables del boss Rogelio
        if (typeof bossRogelio !== 'undefined') {
            bossRogelio = null;
        }
        if (typeof bossActive !== 'undefined') {
            bossActive = false;
        }
        
        gameState = 'PLAYING';
        menuElements.pauseMenu.classList.remove('active');
        menuElements.gameUI.classList.add('active');
        
        // Spawnear primer enemigo
        spawnEnemy();
        
        updateHUD();
    });
}

function showMainMenu() {
    fadeTransition(() => {
        gameState = 'MENU';
        menuElements.pauseMenu.classList.remove('active');
        menuElements.gameUI.classList.remove('active');
        
        // Mostrar menú principal correctamente
        menuElements.mainMenu.classList.remove('hidden');
        menuElements.background.classList.remove('hidden');
        menuElements.mainMenu.style.display = 'flex';
        menuElements.background.style.display = 'block';
        
        // Resetear juego
        player.money = 100;
        player.lives = 10;
        player.wave = 1;
        towers = [];
        enemies = [];
        bullets = [];
        particles = [];
        
        // Resetear variables del boss
        if (typeof bossRogelio !== 'undefined') bossRogelio = null;
        if (typeof bossActive !== 'undefined') bossActive = false;
        if (typeof bossHealthBarVisible !== 'undefined') bossHealthBarVisible = false;
        if (typeof screenShakeIntensity !== 'undefined') screenShakeIntensity = 0;
        if (typeof roglioAppearedText !== 'undefined') roglioAppearedText = '';
        if (typeof roglioAppearedAlpha !== 'undefined') roglioAppearedAlpha = 0;
        
        // Reinicializar decoraciones y cámara
        if (typeof initDecorations === 'function') initDecorations();
        if (typeof initCamera === 'function') initCamera();
    });
}

// ==========================================
// ACTUALIZAR HUD
// ==========================================
function updateHUD() {
    if (!menuElements.gameUI) return;
    
    document.getElementById('hudLives').textContent = player.lives;
    document.getElementById('hudWave').textContent = player.wave;
    document.getElementById('hudMoney').textContent = player.money;
    
    // Actualizar número de enemigos vivos
    const enemyCount = typeof enemies !== 'undefined' ? enemies.length : 0;
    const bossCount = (typeof bossRogelio !== 'undefined' && bossRogelio && typeof bossActive !== 'undefined' && bossActive) ? 1 : 0;
    document.getElementById('hudEnemies').textContent = enemyCount + bossCount;
    
    // Actualizar tiempo jugado
    const stats = JSON.parse(localStorage.getItem('rogelioTD_stats') || '{}');
    const timePlayed = stats.timePlayed || 0;
    const minutes = Math.floor(timePlayed / 60);
    const seconds = Math.floor(timePlayed % 60);
    document.getElementById('hudTime').textContent = `${minutes}:${seconds.toString().padStart(2, '0')}`;
}

// ==========================================
// MEJORA DE TORRES
// ==========================================
let selectedTowerForUpgrade = null;

function showTowerUpgradePanel(tower) {
    selectedTowerForUpgrade = tower;
    const panel = document.getElementById('towerUpgradePanel');
    const title = document.getElementById('upgradeTitle');
    const stats = document.getElementById('upgradeStats');
    const cost = document.getElementById('upgradeCost');
    const upgradeBtn = document.getElementById('btnUpgrade');
    
    if (tower.level >= 5) {
        title.textContent = 'Torre Nivel MAX';
        stats.textContent = `Daño: ${Math.floor(tower.damage)} | Velocidad: ${(1000/tower.fireRate).toFixed(1)}`;
        cost.textContent = 'Nivel Máximo Alcanzado';
        upgradeBtn.disabled = true;
        upgradeBtn.textContent = '✅ MAX';
    } else {
        const upgradeCost = tower.level * 50;
        title.textContent = `Torre Nivel ${tower.level}`;
        stats.textContent = `Daño: ${Math.floor(tower.damage)} | Velocidad: ${(1000/tower.fireRate).toFixed(1)}/s`;
        cost.textContent = `Costo: ${upgradeCost} 💰`;
        upgradeBtn.disabled = false;
        upgradeBtn.textContent = player.money >= upgradeCost ? '⬆ Mejorar' : '💰 Insuficiente';
    }
    
    panel.style.display = 'block';
}

function closeTowerUpgradePanel() {
    const panel = document.getElementById('towerUpgradePanel');
    panel.style.display = 'none';
    selectedTowerForUpgrade = null;
}

function upgradeSelectedTower() {
    if (!selectedTowerForUpgrade || selectedTowerForUpgrade.level >= 5) return;
    
    const upgradeCost = selectedTowerForUpgrade.level * 50;
    if (player.money >= upgradeCost) {
        player.money -= upgradeCost;
        selectedTowerForUpgrade.level++;
        // Aumentar daño en 50% por nivel
        selectedTowerForUpgrade.damage = Math.floor(selectedTowerForUpgrade.damage * 1.5);
        // Reducir fireRate (más rápido) en 15% por nivel
        selectedTowerForUpgrade.fireRate = Math.max(200, Math.floor(selectedTowerForUpgrade.fireRate * 0.85));
        
        // Actualizar HUD y panel
        updateHUD();
        showTowerUpgradePanel(selectedTowerForUpgrade);
        
        // Incrementar estadística
        if (window.menuAPI) {
            window.menuAPI.incrementStat('upgradesPerformed');
        }
    }
}

// ==========================================
// EXPORTAR FUNCIONES PARA GAME.JS
// ==========================================
window.menuAPI = {
    init: initMenu,
    updateHUD: updateHUD,
    incrementStat: incrementStat,
    showMainMenu: showMainMenu,
    gameState: () => gameState,
    showTowerUpgradePanel: showTowerUpgradePanel
};

// Inicializar la primera página del tutorial cuando se abre el modal
const howtoModalElement = document.getElementById('howtoModal');
if (howtoModalElement) {
    const observer = new MutationObserver((mutations) => {
        mutations.forEach((mutation) => {
            if (mutation.attributeName === 'class') {
                if (howtoModalElement.classList.contains('active')) {
                    // Mostrar primera página cuando se abre el modal
                    showTutorialPage(1);
                }
            }
        });
    });
    
    observer.observe(howtoModalElement, { attributes: true });
}
