/**
 * WaveManager - Sistema de Gestión de Oleadas
 * 
 * Maneja el ciclo completo de oleadas de enemigos:
 * - Temporizador entre oleadas
 * - Spawn automático de enemigos
 * - Dificultad escalable
 * - Pausas configurables
 * 
 * @module js/waves/WaveManager
 */

import { waveConfig, getWaveConfig, hasMoreWaves } from '../../config/waveConfig.js';

/**
 * Estados posibles del WaveManager
 * @readonly
 * @enum {string}
 */
export const WaveState = {
    /** Esperando el inicio del juego */
    IDLE: 'idle',
    /** Contando tiempo antes de la primera oleada */
    INITIAL_DELAY: 'initial_delay',
    /** Oleada en progreso, spawnando enemigos */
    WAVE_ACTIVE: 'wave_active',
    /** Pausa entre oleadas */
    PAUSE_BETWEEN_WAVES: 'pause_between_waves',
    /** Juego completado (solo si maxWaves > 0) */
    COMPLETED: 'completed',
    /** Juego pausado por el usuario */
    PAUSED: 'paused'
};

/**
 * Clase WaveManager
 * Gestiona todo el sistema de oleadas del juego
 */
export class WaveManager {
    /**
     * Crea una instancia de WaveManager
     * 
     * @param {Object} options - Opciones de configuración
     * @param {Function} options.spawnCallback - Función llamada para spawnear un enemigo
     * @param {Function} options.onWaveStartCallback - Función llamada al iniciar una oleada
     * @param {Function} options.onWaveEndCallback - Función llamada al terminar una oleada
     * @param {Function} options.onPauseCallback - Función llamada al pausar/reanudar
     */
    constructor(options = {}) {
        /** @private */
        this._spawnCallback = options.spawnCallback || (() => {});
        
        /** @private */
        this._onWaveStartCallback = options.onWaveStartCallback || (() => {});
        
        /** @private */
        this._onWaveEndCallback = options.onWaveEndCallback || (() => {});
        
        /** @private */
        this._onPauseCallback = options.onPauseCallback || (() => {});

        /** @type {WaveState} Estado actual del manager */
        this.currentState = WaveState.IDLE;

        /** @type {number} Número de la oleada actual (0 = no iniciada) */
        this.currentWaveNumber = 0;

        /** @type {number} Enemigos spawneados en la oleada actual */
        this.enemiesSpawnedInWave = 0;

        /** @type {number} Total de enemigos a spawnear en la oleada actual */
        this.totalEnemiesInWave = 0;

        /** @private @type {number} Tiempo acumulado para el próximo spawn */
        this._spawnTimer = 0;

        /** @private @type {number} Intervalo hasta el próximo spawn */
        this._nextSpawnInterval = 0;

        /** @private @type {number} Tiempo acumulado para la próxima oleada */
        this._waveTimer = 0;

        /** @private @type {boolean} Indica si el manager está activo */
        this._isActive = false;
    }

    /**
     * Inicia el sistema de oleadas
     * Comienza con el delay inicial antes de la primera oleada
     */
    start() {
        if (this._isActive) {
            console.warn('WaveManager ya está activo');
            return;
        }

        this._isActive = true;
        this.currentWaveNumber = 0;
        this.currentState = WaveState.INITIAL_DELAY;
        this._waveTimer = 0;

        console.log(`[WaveManager] Iniciando. Delay inicial: ${waveConfig.initialDelay}s`);
    }

    /**
     * Detiene completamente el sistema de oleadas
     */
    stop() {
        this._isActive = false;
        this.currentState = WaveState.IDLE;
        this.currentWaveNumber = 0;
        this.enemiesSpawnedInWave = 0;
        this.totalEnemiesInWave = 0;
        this._spawnTimer = 0;
        this._waveTimer = 0;

        console.log('[WaveManager] Detenido');
    }

    /**
     * Pausa o reanuda el sistema de oleadas
     * @param {boolean} pause - True para pausar, false para reanudar
     */
    setPaused(pause) {
        if (pause) {
            if (this.currentState !== WaveState.PAUSED) {
                const previousState = this.currentState;
                this.currentState = WaveState.PAUSED;
                this._onPauseCallback(true, previousState);
                console.log('[WaveManager] Pausado');
            }
        } else {
            if (this.currentState === WaveState.PAUSED) {
                // Restaurar estado anterior se maneja externamente
                this._onPauseCallback(false);
                console.log('[WaveManager] Reanudado');
            }
        }
    }

    /**
     * Actualiza el estado del WaveManager
     * Debe ser llamado en cada frame del juego
     * 
     * @param {number} deltaTime - Tiempo transcurrido desde el último frame (en segundos)
     */
    update(deltaTime) {
        if (!this._isActive || this.currentState === WaveState.PAUSED || this.currentState === WaveState.IDLE) {
            return;
        }

        switch (this.currentState) {
            case WaveState.INITIAL_DELAY:
                this._updateInitialDelay(deltaTime);
                break;

            case WaveState.WAVE_ACTIVE:
                this._updateWaveActive(deltaTime);
                break;

            case WaveState.PAUSE_BETWEEN_WAVES:
                this._updatePauseBetweenWaves(deltaTime);
                break;

            case WaveState.COMPLETED:
                // No hacer nada, juego completado
                break;
        }
    }

    /**
     * Actualiza el estado de delay inicial
     * @private
     * @param {number} deltaTime - Tiempo delta
     */
    _updateInitialDelay(deltaTime) {
        this._waveTimer += deltaTime;

        if (this._waveTimer >= waveConfig.initialDelay) {
            this._startNextWave();
        }
    }

    /**
     * Actualiza el estado de oleada activa
     * @private
     * @param {number} deltaTime - Tiempo delta
     */
    _updateWaveActive(deltaTime) {
        // Verificar si la oleada terminó
        if (this.enemiesSpawnedInWave >= this.totalEnemiesInWave) {
            this._endCurrentWave();
            return;
        }

        // Actualizar timer de spawn
        this._spawnTimer += deltaTime;

        if (this._spawnTimer >= this._nextSpawnInterval) {
            this._spawnEnemy();
            this._spawnTimer = 0;
            this._calculateNextSpawnInterval();
        }
    }

    /**
     * Actualiza el estado de pausa entre oleadas
     * @private
     * @param {number} deltaTime - Tiempo delta
     */
    _updatePauseBetweenWaves(deltaTime) {
        this._waveTimer += deltaTime;

        if (this._waveTimer >= waveConfig.pauseBetweenWaves) {
            this._startNextWave();
        }
    }

    /**
     * Inicia la siguiente oleada
     * @private
     */
    _startNextWave() {
        if (!hasMoreWaves(this.currentWaveNumber + 1)) {
            this.currentState = WaveState.COMPLETED;
            console.log('[WaveManager] ¡Juego completado! Todas las oleadas terminadas.');
            return;
        }

        this.currentWaveNumber++;
        const waveConfigData = getWaveConfig(this.currentWaveNumber);

        this.totalEnemiesInWave = waveConfigData.enemyCount;
        this.enemiesSpawnedInWave = 0;
        this.currentState = WaveState.WAVE_ACTIVE;
        this._spawnTimer = 0;

        this._calculateNextSpawnInterval();

        console.log(
            `[WaveManager] Oleada ${this.currentWaveNumber} iniciada. ` +
            `Enemigos: ${this.totalEnemiesInWave}. ` +
            `Tipos: ${waveConfigData.types.join(', ')}`
        );

        this._onWaveStartCallback(this.currentWaveNumber, this.totalEnemiesInWave, waveConfigData);
    }

    /**
     * Termina la oleada actual
     * @private
     */
    _endCurrentWave() {
        this.currentState = WaveState.PAUSE_BETWEEN_WAVES;
        this._waveTimer = 0;

        console.log(
            `[WaveManager] Oleada ${this.currentWaveNumber} completada. ` +
            `Pausa de ${waveConfig.pauseBetweenWaves}s antes de la siguiente.`
        );

        this._onWaveEndCallback(this.currentWaveNumber);
    }

    /**
     * Spawnea un enemigo
     * @private
     */
    _spawnEnemy() {
        const waveConfigData = getWaveConfig(this.currentWaveNumber);
        
        // Seleccionar tipo de enemigo aleatorio de los disponibles
        const enemyTypeIndex = Math.floor(Math.random() * waveConfigData.types.length);
        const enemyType = waveConfigData.types[enemyTypeIndex];

        this.enemiesSpawnedInWave++;

        console.log(
            `[WaveManager] Spawn enemigo ${this.enemiesSpawnedInWave}/${this.totalEnemiesInWave} ` +
            `(tipo: ${enemyType})`
        );

        this._spawnCallback(enemyType, this.currentWaveNumber);
    }

    /**
     * Calcula el intervalo hasta el próximo spawn
     * @private
     */
    _calculateNextSpawnInterval() {
        const waveConfigData = getWaveConfig(this.currentWaveNumber);
        const { min, max } = waveConfigData.spawnInterval;
        
        // Intervalo aleatorio entre min y max
        this._nextSpawnInterval = min + Math.random() * (max - min);
    }

    /**
     * Obtiene el número de la oleada actual
     * @returns {number} Número de oleada
     */
    getWaveNumber() {
        return this.currentWaveNumber;
    }

    /**
     * Obtiene el progreso de la oleada actual
     * @returns {Object} Progreso con enemigos spawneados y totales
     */
    getWaveProgress() {
        return {
            spawned: this.enemiesSpawnedInWave,
            total: this.totalEnemiesInWave,
            percentage: this.totalEnemiesInWave > 0 
                ? (this.enemiesSpawnedInWave / this.totalEnemiesInWave) * 100 
                : 0
        };
    }

    /**
     * Obtiene el estado actual
     * @returns {WaveState} Estado actual
     */
    getState() {
        return this.currentState;
    }

    /**
     * Verifica si el juego está completado
     * @returns {boolean} True si todas las oleadas terminaron
     */
    isCompleted() {
        return this.currentState === WaveState.COMPLETED;
    }

    /**
     * Verifica si hay una oleada activa actualmente
     * @returns {boolean} True si hay oleada en progreso
     */
    isWaveActive() {
        return this.currentState === WaveState.WAVE_ACTIVE;
    }

    /**
     * Obtiene información detallada del estado actual
     * @returns {Object} Información del estado
     */
    getStatusInfo() {
        return {
            state: this.currentState,
            waveNumber: this.currentWaveNumber,
            enemiesSpawned: this.enemiesSpawnedInWave,
            totalEnemies: this.totalEnemiesInWave,
            isActive: this._isActive,
            isCompleted: this.isCompleted(),
            isWaveActive: this.isWaveActive()
        };
    }

    /**
     * Establece el callback para spawnear enemigos
     * @param {Function} callback - Función que recibe (enemyType, waveNumber)
     */
    setSpawnCallback(callback) {
        this._spawnCallback = callback || (() => {});
    }

    /**
     * Establece el callback para cuando inicia una oleada
     * @param {Function} callback - Función que recibe (waveNumber, totalEnemies, waveConfig)
     */
    setOnWaveStartCallback(callback) {
        this._onWaveStartCallback = callback || (() => {});
    }

    /**
     * Establece el callback para cuando termina una oleada
     * @param {Function} callback - Función que recibe (waveNumber)
     */
    setOnWaveEndCallback(callback) {
        this._onWaveEndCallback = callback || (() => {});
    }

    /**
     * Establece el callback para cambios de pausa
     * @param {Function} callback - Función que recibe (isPaused, previousState)
     */
    setOnPauseCallback(callback) {
        this._onPauseCallback = callback || (() => {});
    }
}

export default WaveManager;
