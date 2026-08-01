/**
 * BossStateMachine.js - Máquina de estados para bosses
 * Gestiona transiciones entre fases y comportamientos
 * 
 * @module bosses/BossStateMachine
 */

import { EventEmitter } from '../utils/EventEmitter.js';

/**
 * Estados posibles del boss
 */
const BossState = {
    IDLE: 'idle',
    MOVING: 'moving',
    ATTACKING: 'attacking',
    CASTING: 'casting',
    STUNNED: 'stunned',
    TRANSITIONING: 'transitioning',
    DYING: 'dying',
    DEAD: 'dead'
};

/**
 * Estados de fase del boss
 */
const PhaseState = {
    INACTIVE: 'inactive',
    ACTIVE: 'active',
    TRANSITIONING: 'transitioning'
};

/**
 * Clase que representa un estado individual
 */
class State {
    /**
     * @param {string} name - Nombre del estado
     * @param {Object} config - Configuración del estado
     */
    constructor(name, config = {}) {
        this.name = name;
        this.config = config;
        
        // Callbacks del ciclo de vida
        this.onEnter = config.onEnter || null;
        this.onUpdate = config.onUpdate || null;
        this.onExit = config.onExit || null;
        
        // Transiciones permitidas desde este estado
        this.transitions = config.transitions || [];
        
        // Tiempo máximo en este estado (opcional)
        this.maxDuration = config.maxDuration || null;
        this.enterTime = 0;
    }
    
    /**
     * Ejecutar al entrar al estado
     * @param {any} context - Contexto del boss
     * @param {any} data - Datos adicionales
     */
    enter(context, data = null) {
        this.enterTime = Date.now();
        
        if (this.onEnter) {
            this.onEnter(context, data);
        }
    }
    
    /**
     * Actualizar estado
     * @param {number} deltaTime - Tiempo en ms
     * @param {any} context - Contexto del boss
     */
    update(deltaTime, context) {
        // Verificar duración máxima
        if (this.maxDuration) {
            const elapsed = Date.now() - this.enterTime;
            if (elapsed >= this.maxDuration) {
                return false; // Tiempo terminado
            }
        }
        
        if (this.onUpdate) {
            return this.onUpdate(deltaTime, context);
        }
        
        return true; // Continuar en este estado
    }
    
    /**
     * Ejecutar al salir del estado
     * @param {any} context - Contexto del boss
     */
    exit(context) {
        if (this.onExit) {
            this.onExit(context);
        }
    }
    
    /**
     * Verificar si puede transicionar a otro estado
     * @param {string} targetState - Estado objetivo
     * @returns {boolean}
     */
    canTransitionTo(targetState) {
        if (this.transitions.length === 0) return true; // Sin restricciones
        return this.transitions.includes(targetState);
    }
    
    /**
     * Obtener tiempo transcurrido en el estado
     * @returns {number} ms
     */
    getElapsedTime() {
        return Date.now() - this.enterTime;
    }
    
    /**
     * Obtener progreso de duración (0-1)
     * @returns {number|null} null si no hay maxDuration
     */
    getProgress() {
        if (!this.maxDuration) return null;
        return Math.min(1, this.getElapsedTime() / this.maxDuration);
    }
}

/**
 * Máquina de estados para bosses
 * Maneja estados, transiciones y fases
 */
class BossStateMachine extends EventEmitter {
    /**
     * @param {Boss} boss - Instancia del boss
     */
    constructor(boss) {
        super();
        
        this.boss = boss;
        this.states = new Map();
        this.currentState = null;
        this.previousState = null;
        
        // Sistema de fases
        this.currentPhase = null;
        this.phaseIndex = 0;
        this.phases = [];
        this.isTransitioningPhase = false;
        
        // Configuración
        this.allowBackTransitions = true;
        this.debugMode = false;
        
        // Historial para debugging
        this.stateHistory = [];
        this.maxHistoryLength = 50;
    }
    
    /**
     * Registrar un nuevo estado
     * @param {string} name - Nombre único del estado
     * @param {Object} config - Configuración del estado
     */
    addState(name, config = {}) {
        const state = new State(name, config);
        this.states.set(name, state);
        
        if (this.debugMode) {
            console.log(`[BossFSM] Estado añadido: ${name}`);
        }
        
        return state;
    }
    
    /**
     * Configurar las fases del boss
     * @param {Array} phasesConfig - Array de configuraciones de fase
     */
    setupPhases(phasesConfig) {
        this.phases = phasesConfig;
        this.phaseIndex = 0;
        
        if (phasesConfig.length > 0) {
            this.currentPhase = phasesConfig[0];
        }
        
        this.emit('phasesSetup', {
            totalPhases: phasesConfig.length,
            currentPhase: this.getCurrentPhaseInfo()
        });
    }
    
    /**
     * Iniciar máquina de estados con estado inicial
     * @param {string} initialState - Nombre del estado inicial
     * @param {any} data - Datos para onEnter
     */
    start(initialState, data = null) {
        if (!this.states.has(initialState)) {
            throw new Error(`Estado no encontrado: ${initialState}`);
        }
        
        this.currentState = this.states.get(initialState);
        this.currentState.enter(this.boss, data);
        
        this.emit('start', {
            initialState,
            timestamp: Date.now()
        });
        
        if (this.debugMode) {
            console.log(`[BossFSM] Iniciado en estado: ${initialState}`);
        }
    }
    
    /**
     * Intentar transición a nuevo estado
     * @param {string} newState - Nombre del estado objetivo
     * @param {any} data - Datos para onEnter
     * @returns {boolean} True si la transición fue exitosa
     */
    transitionTo(newState, data = null) {
        if (!this.states.has(newState)) {
            console.warn(`[BossFSM] Estado no existe: ${newState}`);
            return false;
        }
        
        if (this.currentState && !this.currentState.canTransitionTo(newState)) {
            if (this.debugMode) {
                console.warn(`[BossFSM] Transición denegada: ${this.currentState.name} -> ${newState}`);
            }
            return false;
        }
        
        // Guardar historial
        if (this.currentState) {
            this.addToHistory(this.currentState.name, newState);
        }
        
        // Salir del estado actual
        if (this.currentState) {
            this.previousState = this.currentState;
            this.currentState.exit(this.boss);
        }
        
        // Entrar al nuevo estado
        const targetState = this.states.get(newState);
        this.currentState = targetState;
        this.currentState.enter(this.boss, data);
        
        this.emit('stateChange', {
            from: this.previousState?.name || null,
            to: newState,
            data,
            timestamp: Date.now()
        });
        
        if (this.debugMode) {
            console.log(`[BossFSM] Transición: ${this.previousState?.name} -> ${newState}`);
        }
        
        return true;
    }
    
    /**
     * Actualizar máquina de estados
     * @param {number} deltaTime - Tiempo en ms
     */
    update(deltaTime) {
        if (!this.currentState) return;
        
        const shouldContinue = this.currentState.update(deltaTime, this.boss);
        
        if (!shouldContinue) {
            // El estado indicó que debe terminar
            this.emit('stateTimeout', {
                state: this.currentState.name,
                duration: this.currentState.getElapsedTime()
            });
        }
    }
    
    /**
     * Verificar y ejecutar transición de fase
     * @param {number} healthPercent - Porcentaje de vida actual (0-1)
     */
    checkPhaseTransition(healthPercent) {
        if (this.isTransitioningPhase || this.phases.length === 0) {
            return;
        }
        
        // Buscar la fase correspondiente al porcentaje de vida
        let targetPhaseIndex = this.phases.length - 1;
        
        for (let i = 0; i < this.phases.length; i++) {
            const phase = this.phases[i];
            if (healthPercent <= phase.healthThreshold) {
                targetPhaseIndex = i;
                break;
            }
        }
        
        // Solo transicionar si cambió de fase
        if (targetPhaseIndex !== this.phaseIndex) {
            this.beginPhaseTransition(targetPhaseIndex);
        }
    }
    
    /**
     * Iniciar transición de fase
     * @param {number} newPhaseIndex - Índice de la nueva fase
     */
    beginPhaseTransition(newPhaseIndex) {
        this.isTransitioningPhase = true;
        this.phaseIndex = newPhaseIndex;
        const newPhase = this.phases[newPhaseIndex];
        
        this.emit('phaseTransitionStart', {
            fromPhase: this.currentPhase,
            toPhase: newPhase,
            phaseIndex: newPhaseIndex
        });
        
        // Transicionar a estado de transición si existe
        if (this.states.has(BossState.TRANSITIONING)) {
            this.transitionTo(BossState.TRANSITIONING, {
                newPhase,
                onComplete: () => this.completePhaseTransition()
            });
        } else {
            this.completePhaseTransition();
        }
    }
    
    /**
     * Completar transición de fase
     */
    completePhaseTransition() {
        this.currentPhase = this.phases[this.phaseIndex];
        this.isTransitioningPhase = false;
        
        this.emit('phaseTransitionComplete', {
            phase: this.currentPhase,
            phaseIndex: this.phaseIndex,
            isFinalPhase: this.phaseIndex === this.phases.length - 1
        });
        
        if (this.debugMode) {
            console.log(`[BossFSM] Fase completada: ${this.currentPhase.name}`);
        }
    }
    
    /**
     * Forzar transición inmediata (sin validaciones)
     * @param {string} newState - Estado objetivo
     */
    forceTransition(newState) {
        if (!this.states.has(newState)) {
            throw new Error(`Estado no existe: ${newState}`);
        }
        
        if (this.currentState) {
            this.currentState.exit(this.boss);
        }
        
        this.previousState = this.currentState;
        this.currentState = this.states.get(newState);
        this.currentState.enter(this.boss);
        
        this.emit('forceTransition', {
            to: newState
        });
    }
    
    /**
     * Revertir al estado anterior
     * @returns {boolean} True si pudo revertir
     */
    revert() {
        if (!this.previousState) return false;
        return this.transitionTo(this.previousState.name);
    }
    
    /**
     * Obtener información del estado actual
     * @returns {Object|null}
     */
    getCurrentStateInfo() {
        if (!this.currentState) return null;
        
        return {
            name: this.currentState.name,
            duration: this.currentState.getElapsedTime(),
            progress: this.currentState.getProgress(),
            transitions: this.currentState.transitions
        };
    }
    
    /**
     * Obtener información de la fase actual
     * @returns {Object|null}
     */
    getCurrentPhaseInfo() {
        if (!this.currentPhase) return null;
        
        return {
            ...this.currentPhase,
            index: this.phaseIndex,
            total: this.phases.length,
            isFinal: this.phaseIndex === this.phases.length - 1
        };
    }
    
    /**
     * Verificar si está en un estado específico
     * @param {string} stateName - Nombre del estado
     * @returns {boolean}
     */
    isInState(stateName) {
        return this.currentState?.name === stateName;
    }
    
    /**
     * Verificar si está en alguna de varias estados
     * @param {string[]} stateNames - Nombres de estados
     * @returns {boolean}
     */
    isInAnyState(stateNames) {
        if (!this.currentState) return false;
        return stateNames.includes(this.currentState.name);
    }
    
    /**
     * Añadir entrada al historial
     * @param {string} from - Estado origen
     * @param {string} to - Estado destino
     */
    addToHistory(from, to) {
        this.stateHistory.push({
            from,
            to,
            timestamp: Date.now()
        });
        
        // Limitar historial
        if (this.stateHistory.length > this.maxHistoryLength) {
            this.stateHistory.shift();
        }
    }
    
    /**
     * Obtener historial de transiciones
     * @returns {Array}
     */
    getHistory() {
        return [...this.stateHistory];
    }
    
    /**
     * Limpiar historial
     */
    clearHistory() {
        this.stateHistory = [];
    }
    
    /**
     * Resetear máquina de estados
     * @param {string} resetState - Estado al que volver (opcional)
     */
    reset(resetState = null) {
        if (this.currentState) {
            this.currentState.exit(this.boss);
        }
        
        this.currentState = null;
        this.previousState = null;
        this.clearHistory();
        
        // Resetear fases
        this.phaseIndex = 0;
        if (this.phases.length > 0) {
            this.currentPhase = this.phases[0];
        }
        this.isTransitioningPhase = false;
        
        if (resetState && this.states.has(resetState)) {
            this.start(resetState);
        }
        
        this.emit('reset', {
            resetState
        });
    }
    
    /**
     * Obtener todos los estados registrados
     * @returns {Map<string, State>}
     */
    getAllStates() {
        return this.states;
    }
    
    /**
     * Verificar si un estado existe
     * @param {string} stateName - Nombre del estado
     * @returns {boolean}
     */
    hasState(stateName) {
        return this.states.has(stateName);
    }
    
    /**
     * Habilitar modo debug
     * @param {boolean} enabled
     */
    setDebugMode(enabled) {
        this.debugMode = enabled;
    }
    
    /**
     * Serializar estado completo
     * @returns {Object}
     */
    serialize() {
        return {
            currentState: this.currentState?.name || null,
            previousState: this.previousState?.name || null,
            phaseIndex: this.phaseIndex,
            isTransitioningPhase: this.isTransitioningPhase,
            history: this.stateHistory
        };
    }
    
    /**
     * Cargar estado desde serialización
     * @param {Object} data - Datos serializados
     */
    deserialize(data) {
        this.reset();
        
        this.phaseIndex = data.phaseIndex || 0;
        this.isTransitioningPhase = data.isTransitioningPhase || false;
        
        if (this.phases[this.phaseIndex]) {
            this.currentPhase = this.phases[this.phaseIndex];
        }
        
        if (data.currentState && this.states.has(data.currentState)) {
            this.start(data.currentState);
        }
        
        this.stateHistory = data.history || [];
    }
}

export { BossState, PhaseState, State, BossStateMachine };
