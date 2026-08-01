/**
 * ========================================
 * SAVE SYSTEM - Sistema de Guardado
 * ========================================
 * 
 * Maneja el guardado y carga de datos del juego usando LocalStorage.
 * Soporta múltiples perfiles de jugador.
 * 
 * Características:
 * - Guardado automático y manual
 * - Múltiples slots de guardado (perfiles)
 * - Gestión de progreso, oro, mejoras, ajustes, récords y configuración
 * - Validación de datos y manejo de errores
 * - Copias de seguridad automáticas
 * 
 * @author Tower Defense Team
 * @version 1.0.0
 */

const SaveSystem = {
    // ========================================
    // CONFIGURACIÓN
    // ========================================
    
    /** Prefijo para todas las claves en localStorage */
    STORAGE_PREFIX: 'td_save_',
    
    /** Clave para almacenar la lista de perfiles */
    PROFILES_KEY: 'td_profiles',
    
    /** Número máximo de perfiles permitidos */
    MAX_PROFILES: 5,
    
    /** Versión actual del formato de guardado (para migraciones futuras) */
    SAVE_VERSION: 1,
    
    /** Tiempo entre autoguardados en milisegundos */
    AUTO_SAVE_INTERVAL: 30000,
    
    /** Intervalo de autoguardado (referencia para clearInterval) */
    autoSaveIntervalId: null,
    
    // ========================================
    // ESTRUCTURA DE DATOS
    // ========================================
    
    /**
     * Crea un nuevo objeto de guardado con valores por defecto
     * @returns {Object} Objeto de guardado inicializado
     */
    createDefaultSaveData: function() {
        return {
            version: this.SAVE_VERSION,
            createdAt: Date.now(),
            updatedAt: Date.now(),
            
            // Progreso del juego
            progress: {
                currentWave: 1,
                highestWave: 1,
                totalGamesPlayed: 0,
                totalWins: 0,
                totalLosses: 0,
                playTimeSeconds: 0
            },
            
            // Recursos
            gold: {
                current: 100,
                totalEarned: 0,
                totalSpent: 0
            },
            
            // Mejoras desbloqueadas y nivel
            upgrades: {
                towerDamage: 0,
                towerRange: 0,
                towerAttackSpeed: 0,
                startingGold: 0,
                extraLives: 0,
                unlockedTowers: ['basic'],
                unlockedUpgrades: []
            },
            
            // Ajustes del juego (dificultad, etc.)
            settings: {
                difficulty: 'normal', // easy, normal, hard
                startingLives: 20,
                startingGold: 100,
                enemyHealthMultiplier: 1.0,
                enemySpeedMultiplier: 1.0
            },
            
            // Récords y estadísticas
            records: {
                highestScore: 0,
                highestWave: 1,
                fastestWaveClear: null,
                totalEnemiesDefeated: 0,
                totalTowersBuilt: 0,
                totalDamageDealt: 0,
                bestCombo: 0
            },
            
            // Configuración del usuario
            configuration: {
                soundEnabled: true,
                musicEnabled: true,
                soundVolume: 0.7,
                musicVolume: 0.5,
                showDamageNumbers: true,
                showRangeIndicator: true,
                fullscreen: false,
                language: 'es',
                notifications: true
            }
        };
    },
    
    // ========================================
    // GESTIÓN DE PERFILES
    // ========================================
    
    /**
     * Obtiene la lista de todos los perfiles guardados
     * @returns {Array} Array de información de perfiles
     */
    getProfileList: function() {
        try {
            const profilesJson = localStorage.getItem(this.PROFILES_KEY);
            if (profilesJson) {
                return JSON.parse(profilesJson);
            }
        } catch (error) {
            console.error('Error reading profile list:', error);
        }
        return [];
    },
    
    /**
     * Guarda la lista de perfiles
     * @param {Array} profiles - Lista de perfiles
     */
    saveProfileList: function(profiles) {
        try {
            localStorage.setItem(this.PROFILES_KEY, JSON.stringify(profiles));
        } catch (error) {
            console.error('Error saving profile list:', error);
        }
    },
    
    /**
     * Crea un nuevo perfil
     * @param {string} profileName - Nombre del perfil
     * @returns {Object|null} Datos del perfil creado o null si falla
     */
    createProfile: function(profileName) {
        if (!profileName || profileName.trim() === '') {
            console.error('Profile name cannot be empty');
            return null;
        }
        
        const profiles = this.getProfileList();
        
        // Verificar límite de perfiles
        if (profiles.length >= this.MAX_PROFILES) {
            console.error(`Maximum number of profiles (${this.MAX_PROFILES}) reached`);
            return null;
        }
        
        // Verificar si ya existe
        if (profiles.some(p => p.name === profileName)) {
            console.error(`Profile '${profileName}' already exists`);
            return null;
        }
        
        // Crear ID único para el perfil
        const profileId = 'profile_' + Date.now() + '_' + Math.random().toString(36).substr(2, 9);
        
        // Crear datos de guardado por defecto
        const saveData = this.createDefaultSaveData();
        saveData.profileName = profileName;
        saveData.profileId = profileId;
        
        // Guardar en localStorage
        try {
            localStorage.setItem(this.STORAGE_PREFIX + profileId, JSON.stringify(saveData));
            
            // Añadir a la lista de perfiles
            profiles.push({
                id: profileId,
                name: profileName,
                createdAt: saveData.createdAt,
                updatedAt: saveData.updatedAt,
                highestWave: saveData.progress.highestWave,
                highestScore: saveData.records.highestScore
            });
            
            this.saveProfileList(profiles);
            
            console.log(`Profile '${profileName}' created successfully`);
            return saveData;
        } catch (error) {
            console.error('Error creating profile:', error);
            return null;
        }
    },
    
    /**
     * Elimina un perfil
     * @param {string} profileId - ID del perfil
     * @returns {boolean} True si se eliminó correctamente
     */
    deleteProfile: function(profileId) {
        try {
            // Eliminar de localStorage
            localStorage.removeItem(this.STORAGE_PREFIX + profileId);
            
            // Eliminar de la lista de perfiles
            const profiles = this.getProfileList();
            const filteredProfiles = profiles.filter(p => p.id !== profileId);
            this.saveProfileList(filteredProfiles);
            
            console.log(`Profile '${profileId}' deleted successfully`);
            return true;
        } catch (error) {
            console.error('Error deleting profile:', error);
            return false;
        }
    },
    
    /**
     * Renombra un perfil
     * @param {string} profileId - ID del perfil
     * @param {string} newName - Nuevo nombre
     * @returns {boolean} True si se renombró correctamente
     */
    renameProfile: function(profileId, newName) {
        if (!newName || newName.trim() === '') {
            console.error('New profile name cannot be empty');
            return false;
        }
        
        try {
            const saveData = this.loadProfile(profileId);
            if (!saveData) {
                return false;
            }
            
            saveData.profileName = newName;
            saveData.updatedAt = Date.now();
            
            this.saveProfile(profileId, saveData);
            
            // Actualizar lista de perfiles
            const profiles = this.getProfileList();
            const profileIndex = profiles.findIndex(p => p.id === profileId);
            if (profileIndex !== -1) {
                profiles[profileIndex].name = newName;
                profiles[profileIndex].updatedAt = saveData.updatedAt;
                this.saveProfileList(profiles);
            }
            
            console.log(`Profile renamed to '${newName}'`);
            return true;
        } catch (error) {
            console.error('Error renaming profile:', error);
            return false;
        }
    },
    
    /**
     * Obtiene la información de un perfil específico
     * @param {string} profileId - ID del perfil
     * @returns {Object|null} Información del perfil o null
     */
    getProfileInfo: function(profileId) {
        const profiles = this.getProfileList();
        return profiles.find(p => p.id === profileId) || null;
    },
    
    // ========================================
    // OPERACIONES DE GUARDADO/CARGA
    // ========================================
    
    /**
     * Carga los datos de un perfil
     * @param {string} profileId - ID del perfil
     * @returns {Object|null} Datos del perfil o null si no existe
     */
    loadProfile: function(profileId) {
        try {
            const saveJson = localStorage.getItem(this.STORAGE_PREFIX + profileId);
            if (saveJson) {
                const saveData = JSON.parse(saveJson);
                
                // Validar versión y migrar si es necesario
                if (saveData.version < this.SAVE_VERSION) {
                    console.log('Migrating save data from version', saveData.version, 'to', this.SAVE_VERSION);
                    return this.migrateSaveData(saveData);
                }
                
                return saveData;
            }
        } catch (error) {
            console.error('Error loading profile:', error);
        }
        return null;
    },
    
    /**
     * Guarda los datos de un perfil
     * @param {string} profileId - ID del perfil
     * @param {Object} saveData - Datos a guardar
     * @returns {boolean} True si se guardó correctamente
     */
    saveProfile: function(profileId, saveData) {
        try {
            saveData.updatedAt = Date.now();
            localStorage.setItem(this.STORAGE_PREFIX + profileId, JSON.stringify(saveData));
            
            // Actualizar lista de perfiles
            const profiles = this.getProfileList();
            const profileIndex = profiles.findIndex(p => p.id === profileId);
            if (profileIndex !== -1) {
                profiles[profileIndex].updatedAt = saveData.updatedAt;
                profiles[profileIndex].highestWave = saveData.progress.highestWave;
                profiles[profileIndex].highestScore = saveData.records.highestScore;
                this.saveProfileList(profiles);
            }
            
            return true;
        } catch (error) {
            console.error('Error saving profile:', error);
            return false;
        }
    },
    
    /**
     * Crea una copia de seguridad de un perfil
     * @param {string} profileId - ID del perfil
     * @returns {boolean} True si se creó la copia
     */
    createBackup: function(profileId) {
        try {
            const saveData = this.loadProfile(profileId);
            if (!saveData) {
                return false;
            }
            
            const backupId = 'backup_' + profileId + '_' + Date.now();
            localStorage.setItem(this.STORAGE_PREFIX + backupId, JSON.stringify(saveData));
            
            console.log('Backup created:', backupId);
            return true;
        } catch (error) {
            console.error('Error creating backup:', error);
            return false;
        }
    },
    
    /**
     * Restaura un perfil desde una copia de seguridad
     * @param {string} backupId - ID de la copia de seguridad
     * @param {string} profileId - ID del perfil a restaurar
     * @returns {boolean} True si se restauró correctamente
     */
    restoreFromBackup: function(backupId, profileId) {
        try {
            const backupData = this.loadProfile(backupId);
            if (!backupData) {
                return false;
            }
            
            backupData.profileId = profileId;
            backupData.updatedAt = Date.now();
            
            return this.saveProfile(profileId, backupData);
        } catch (error) {
            console.error('Error restoring from backup:', error);
            return false;
        }
    },
    
    // ========================================
    // MIGRACIÓN DE DATOS
    // ========================================
    
    /**
     * Migra datos de guardado de versiones anteriores
     * @param {Object} oldData - Datos antiguos
     * @returns {Object} Datos migrados
     */
    migrateSaveData: function(oldData) {
        const newData = this.createDefaultSaveData();
        
        // Copiar datos compatibles
        if (oldData.progress) {
            Object.assign(newData.progress, oldData.progress);
        }
        if (oldData.gold) {
            Object.assign(newData.gold, oldData.gold);
        }
        if (oldData.upgrades) {
            Object.assign(newData.upgrades, oldData.upgrades);
        }
        if (oldData.settings) {
            Object.assign(newData.settings, oldData.settings);
        }
        if (oldData.records) {
            Object.assign(newData.records, oldData.records);
        }
        if (oldData.configuration) {
            Object.assign(newData.configuration, oldData.configuration);
        }
        
        newData.version = this.SAVE_VERSION;
        newData.migratedAt = Date.now();
        
        return newData;
    },
    
    // ========================================
    // INTEGRACIÓN CON EL JUEGO
    // ========================================
    
    /** Perfil actualmente cargado */
    currentProfileId: null,
    currentSaveData: null,
    
    /**
     * Inicializa el sistema de guardado
     */
    init: function() {
        console.log('SaveSystem initialized');
        
        // Crear perfil por defecto si no existen
        const profiles = this.getProfileList();
        if (profiles.length === 0) {
            this.createProfile('Player 1');
        }
        
        // Intentar cargar el último perfil usado
        const lastProfileId = localStorage.getItem('td_last_profile');
        if (lastProfileId) {
            const profileInfo = this.getProfileInfo(lastProfileId);
            if (profileInfo) {
                this.loadGame(lastProfileId);
            }
        }
    },
    
    /**
     * Carga un juego existente
     * @param {string} profileId - ID del perfil
     * @returns {Object|null} Datos cargados o null
     */
    loadGame: function(profileId) {
        const saveData = this.loadProfile(profileId);
        if (saveData) {
            this.currentProfileId = profileId;
            this.currentSaveData = saveData;
            localStorage.setItem('td_last_profile', profileId);
            
            console.log('Game loaded for profile:', saveData.profileName);
            return saveData;
        }
        return null;
    },
    
    /**
     * Guarda el estado actual del juego
     * @returns {boolean} True si se guardó correctamente
     */
    saveGame: function() {
        if (!this.currentProfileId || !this.currentSaveData) {
            console.warn('No active profile to save');
            return false;
        }
        
        // Actualizar timestamp
        this.currentSaveData.updatedAt = Date.now();
        
        const success = this.saveProfile(this.currentProfileId, this.currentSaveData);
        if (success) {
            console.log('Game saved successfully');
        }
        return success;
    },
    
    /**
     * Actualiza los datos guardados con el estado actual del juego
     * @param {Object} gameState - Estado actual del juego
     */
    updateSaveData: function(gameState) {
        if (!this.currentSaveData) {
            return;
        }
        
        // Actualizar progreso
        if (gameState.wave !== undefined) {
            this.currentSaveData.progress.currentWave = gameState.wave;
            if (gameState.wave > this.currentSaveData.progress.highestWave) {
                this.currentSaveData.progress.highestWave = gameState.wave;
            }
        }
        
        // Actualizar oro
        if (gameState.gold !== undefined) {
            this.currentSaveData.gold.current = gameState.gold;
        }
        
        // Actualizar récords
        if (gameState.score !== undefined) {
            if (gameState.score > this.currentSaveData.records.highestScore) {
                this.currentSaveData.records.highestScore = gameState.score;
            }
        }
        
        // Actualizar tiempo de juego
        if (gameState.playTime !== undefined) {
            this.currentSaveData.progress.playTimeSeconds = gameState.playTime;
        }
        
        this.currentSaveData.updatedAt = Date.now();
    },
    
    /**
     * Aplica los datos guardados al juego
     * @returns {Object} Datos aplicados
     */
    applySaveData: function() {
        if (!this.currentSaveData) {
            return null;
        }
        
        const data = this.currentSaveData;
        
        // Aplicar configuración
        if (typeof AudioSystem !== 'undefined') {
            AudioSystem.setSoundEnabled(data.configuration.soundEnabled);
            AudioSystem.setMusicEnabled(data.configuration.musicEnabled);
            AudioSystem.setSoundVolume(data.configuration.soundVolume);
            AudioSystem.setMusicVolume(data.configuration.musicVolume);
        }
        
        // Aplicar ajustes de dificultad
        if (typeof Game !== 'undefined') {
            Game.config.startingLives = data.settings.startingLives;
            Game.config.startingGold = data.settings.startingGold;
        }
        
        console.log('Save data applied to game');
        return data;
    },
    
    /**
     * Inicia el autoguardado periódico
     */
    startAutoSave: function() {
        if (this.autoSaveIntervalId) {
            this.stopAutoSave();
        }
        
        this.autoSaveIntervalId = setInterval(() => {
            if (this.currentProfileId && typeof Game !== 'undefined' && Game.state === 'PLAYING') {
                this.saveGame();
            }
        }, this.AUTO_SAVE_INTERVAL);
        
        console.log('Auto-save started (interval:', this.AUTO_SAVE_INTERVAL, 'ms)');
    },
    
    /**
     * Detiene el autoguardado
     */
    stopAutoSave: function() {
        if (this.autoSaveIntervalId) {
            clearInterval(this.autoSaveIntervalId);
            this.autoSaveIntervalId = null;
            console.log('Auto-save stopped');
        }
    },
    
    /**
     * Resetea un perfil a los valores por defecto
     * @param {string} profileId - ID del perfil
     * @returns {boolean} True si se reseteó correctamente
     */
    resetProfile: function(profileId) {
        try {
            const profileInfo = this.getProfileInfo(profileId);
            if (!profileInfo) {
                return false;
            }
            
            const newSaveData = this.createDefaultSaveData();
            newSaveData.profileName = profileInfo.name;
            newSaveData.profileId = profileId;
            
            return this.saveProfile(profileId, newSaveData);
        } catch (error) {
            console.error('Error resetting profile:', error);
            return false;
        }
    },
    
    /**
     * Exporta los datos de un perfil a un string JSON
     * @param {string} profileId - ID del perfil
     * @returns {string|null} JSON exportado o null
     */
    exportProfile: function(profileId) {
        const saveData = this.loadProfile(profileId);
        if (saveData) {
            return JSON.stringify(saveData, null, 2);
        }
        return null;
    },
    
    /**
     * Importa datos de un perfil desde un string JSON
     * @param {string} jsonData - JSON a importar
     * @param {string} profileId - ID del perfil (opcional, crea uno nuevo si no se proporciona)
     * @returns {Object|null} Datos importados o null
     */
    importProfile: function(jsonData, profileId) {
        try {
            const saveData = JSON.parse(jsonData);
            
            // Validar estructura básica
            if (!saveData.progress || !saveData.gold) {
                console.error('Invalid save data structure');
                return null;
            }
            
            // Si no se proporciona profileId, crear uno nuevo
            if (!profileId) {
                const profileName = saveData.profileName || 'Imported Profile';
                const newProfile = this.createProfile(profileName);
                if (newProfile) {
                    profileId = newProfile.profileId;
                } else {
                    return null;
                }
            }
            
            saveData.profileId = profileId;
            saveData.updatedAt = Date.now();
            
            this.saveProfile(profileId, saveData);
            console.log('Profile imported successfully');
            return saveData;
        } catch (error) {
            console.error('Error importing profile:', error);
            return null;
        }
    },
    
    /**
     * Limpia todos los datos guardados (¡PELIGRO!)
     * @returns {boolean} True si se limpió correctamente
     */
    clearAllData: function() {
        try {
            const profiles = this.getProfileList();
            
            // Eliminar todos los perfiles
            profiles.forEach(profile => {
                localStorage.removeItem(this.STORAGE_PREFIX + profile.id);
            });
            
            // Eliminar lista de perfiles
            localStorage.removeItem(this.PROFILES_KEY);
            localStorage.removeItem('td_last_profile');
            
            this.currentProfileId = null;
            this.currentSaveData = null;
            
            console.log('All save data cleared');
            return true;
        } catch (error) {
            console.error('Error clearing all data:', error);
            return false;
        }
    }
};

// Inicializar automáticamente cuando se carga el script
if (typeof window !== 'undefined') {
    SaveSystem.init();
}
