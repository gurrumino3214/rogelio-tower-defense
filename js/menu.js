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
                <p class="modal-description">Ajusta las opciones del juego para mejorar tu experiencia. Puedes modificar el volumen, la calidad gráfica y otras preferencias.</p>
            </div>
            <div class="settings-grid">
                <div class="setting-item">
                    <label class="setting-label">Volumen General</label>
                    <div class="setting-control">
                        <input type="range" id="settingVolume" min="0" max="100" value="80">
                    </div>
                </div>
                <div class="setting-item">
                    <label class="setting-label">Volumen Música</label>
                    <div class="setting-control">
                        <input type="range" id="settingMusic" min="0" max="100" value="60">
                    </div>
                </div>
                <div class="setting-item">
                    <label class="setting-label">Volumen Efectos</label>
                    <div class="setting-control">
                        <input type="range" id="settingSFX" min="0" max="100" value="80">
                    </div>
                </div>
                <div class="setting-item">
                    <label class="setting-label">Pantalla Completa</label>
                    <div class="setting-control">
                        <input type="checkbox" id="settingFullscreen">
                    </div>
                </div>
                <div class="setting-item">
                    <label class="setting-label">Calidad Gráfica</label>
                    <div class="setting-control">
                        <select id="settingQuality">
                            <option value="low">Baja</option>
                            <option value="medium" selected>Media</option>
                            <option value="high">Alta</option>
                        </select>
                    </div>
                </div>
                <div class="setting-item">
                    <label class="setting-label">Activar Partículas</label>
                    <div class="setting-control">
                        <input type="checkbox" id="settingParticles" checked>
                    </div>
                </div>
                <div class="setting-item">
                    <label class="setting-label">Mostrar FPS</label>
                    <div class="setting-control">
                        <input type="checkbox" id="settingFPS">
                    </div>
                </div>
                <div class="setting-item">
                    <label class="setting-label">Idioma</label>
                    <div class="setting-control">
                        <select id="settingLanguage">
                            <option value="es" selected>Español</option>
                            <option value="en">English</option>
                        </select>
                    </div>
                </div>
            </div>
            <button class="settings-save-btn" id="btnSaveSettings">Guardar Configuración</button>
        </div>
    `;
    container.appendChild(settingsModal);
    
    // Cómo jugar
    const howtoModal = document.createElement('div');
    howtoModal.id = 'howtoModal';
    howtoModal.className = 'modal-overlay';
    howtoModal.innerHTML = `
        <div class="modal-content">
            <button class="modal-close" data-close="howto">×</button>
            <h2 class="modal-title">CÓMO JUGAR</h2>
            <div class="modal-info">
                <p class="modal-description">Aprende a dominar el arte de la defensa de torres con estas guías esenciales. Sigue estos consejos para convertirte en un verdadero estratega.</p>
            </div>
            <div class="howto-section">
                <h3 class="howto-title">🏗️ Cómo colocar torres</h3>
                <p class="howto-text">Haz click en cualquier lugar del mapa para colocar una torre. Cada torre cuesta $50. Asegúrate de no colocarlas sobre el camino.</p>
            </div>
            <div class="howto-section">
                <h3 class="howto-title">💰 Cómo conseguir dinero</h3>
                <p class="howto-text">Derrota enemigos para ganar dinero. Cada enemigo derrotado te da $10. Los enemigos más fuertes dan más recompensa.</p>
            </div>
            <div class="howto-section">
                <h3 class="howto-title">⬆️ Cómo mejorar torres</h3>
                <p class="howto-text">Haz click en una torre existente para ver opciones de mejora. Mejorar aumenta el daño y el rango de la torre.</p>
            </div>
            <div class="howto-section">
                <h3 class="howto-title">⚔️ Cómo derrotar enemigos</h3>
                <p class="howto-text">Las torres disparan automáticamente a los enemigos dentro de su rango. Coloca torres estratégicamente para cubrir todo el camino.</p>
            </div>
            <div class="howto-section">
                <h3 class="howto-title">🛡️ Qué ocurre cuando llegan enemigos al final</h3>
                <p class="howto-text">Si un enemigo llega al final del camino, pierdes una vida. Si llegas a 0 vidas, el juego termina.</p>
            </div>
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
        <div class="modal-content">
            <button class="modal-close" data-close="credits">×</button>
            <h2 class="modal-title">CRÉDITOS</h2>
            <div class="modal-info">
                <p class="modal-description">Un agradecimiento especial a todas las personas que hicieron posible este juego. Cada línea de código y cada detalle fue creado con pasión.</p>
            </div>
            <div class="credits-list">
                <h3 class="credits-name">ROGELIO TOWER DEFENSE</h3>
                
                <p class="credits-role">Desarrollado por</p>
                <p class="credits-name">Gurrumino3214</p>
                
                <p class="credits-role">Programación</p>
                <p class="credits-name">Gurrumino3214</p>
                
                <p class="credits-role">Diseño</p>
                <p class="credits-name">Gurrumino3214</p>
                
                <p class="credits-role">Arte</p>
                <p class="credits-name">Gurrumino3214</p>
                
                <p class="credits-role">Música</p>
                <p class="credits-name">Gurrumino3214</p>
                
                <p class="credits-thanks">¡Gracias por jugar!</p>
            </div>
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
    
    // Botón guardar configuración
    document.getElementById('btnSaveSettings')?.addEventListener('click', saveSettings);
    
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
        modal.classList.add('active');
        playSound('open');
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
        volume: document.getElementById('settingVolume').value,
        music: document.getElementById('settingMusic').value,
        sfx: document.getElementById('settingSFX').value,
        fullscreen: document.getElementById('settingFullscreen').checked,
        quality: document.getElementById('settingQuality').value,
        particles: document.getElementById('settingParticles').checked,
        showFPS: document.getElementById('settingFPS').checked,
        language: document.getElementById('settingLanguage').value
    };
    
    localStorage.setItem('rogelioTD_settings', JSON.stringify(settings));
    
    // Aplicar configuración
    applySettings(settings);
    
    playSound('click');
    closeModal('settings');
    
    console.log('[SETTINGS] Configuración guardada');
}

function loadSettings() {
    const saved = localStorage.getItem('rogelioTD_settings');
    if (saved) {
        const settings = JSON.parse(saved);
        
        document.getElementById('settingVolume').value = settings.volume || 80;
        document.getElementById('settingMusic').value = settings.music || 60;
        document.getElementById('settingSFX').value = settings.sfx || 80;
        document.getElementById('settingFullscreen').checked = settings.fullscreen || false;
        document.getElementById('settingQuality').value = settings.quality || 'medium';
        document.getElementById('settingParticles').checked = settings.particles !== false;
        document.getElementById('settingFPS').checked = settings.showFPS || false;
        document.getElementById('settingLanguage').value = settings.language || 'es';
        
        applySettings(settings);
    }
}

function applySettings(settings) {
    isMuted = settings.volume == 0;
    
    if (settings.fullscreen) {
        document.documentElement.requestFullscreen().catch(() => {});
    }
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
