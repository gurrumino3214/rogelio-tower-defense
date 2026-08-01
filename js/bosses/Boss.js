/**
 * Boss.js - Clase base para bosses
 * Implementa El Lápiz Maldito y soporta futuros bosses
 * 
 * @module bosses/Boss
 */

import { EventEmitter } from '../utils/EventEmitter.js';
import { BossStateMachine, BossState } from './BossStateMachine.js';
import { BossAbilitySystem } from './BossAbilitySystem.js';
import { BossRegistry } from './BossTypes.js';

/**
 * Clase principal del Boss
 * Combina máquina de estados, habilidades y renderizado
 */
class Boss extends EventEmitter {
    /**
     * @param {string} bossId - ID del boss en el registro
     * @param {number} x - Posición X inicial
     * @param {number} y - Posición Y inicial
     */
    constructor(bossId, x = 0, y = 0) {
        super();
        
        // Cargar configuración
        this.config = BossRegistry.get(bossId);
        if (!this.config) {
            throw new Error(`Boss no encontrado: ${bossId}`);
        }
        
        // Identificación
        this.id = bossId;
        this.name = this.config.name;
        this.title = this.config.title;
        
        // Posición y dimensiones
        this.x = x;
        this.y = y;
        this.width = (this.config.width || 3) * 32; // Convertir tiles a pixels
        this.height = (this.config.height || 3) * 32;
        
        // Estadísticas
        this.stats = { ...this.config.baseStats };
        this.currentHealth = this.stats.maxHealth;
        this.healthPercent = 1.0;
        
        // Estado
        this.isAlive = true;
        this.isStunned = false;
        this.stunRemaining = 0;
        this.target = null; // Jugador objetivo
        
        // Sistemas
        this.stateMachine = new BossStateMachine(this);
        this.abilitySystem = new BossAbilitySystem(this.config.abilities, this);
        
        // Setup de fases
        this.stateMachine.setupPhases(this.config.phases);
        
        // Timers
        this.spawnTimer = 0;
        this.lastSpawnTime = 0;
        this.aggroTimer = 0;
        
        // Animación
        this.animationFrame = 0;
        this.animationTimer = 0;
        this.currentAnimation = 'idle';
        this.direction = 1; // 1 derecha, -1 izquierda
        
        // Efectos visuales
        this.effects = [];
        this.particles = [];
        this.screenShakeIntensity = 0;
        
        // Inicializar estados
        this.initializeStates();
        
        console.log(`[Boss] ${this.name} creado en (${x}, ${y})`);
    }
    
    /**
     * Inicializar los estados de la máquina de estados
     */
    initializeStates() {
        const fsm = this.stateMachine;
        
        // Estado IDLE
        fsm.addState(BossState.IDLE, {
            transitions: [BossState.MOVING, BossState.ATTACKING, BossState.CASTING],
            maxDuration: 3000,
            onEnter: () => {
                this.playAnimation('idle');
                this.emit('stateEnter', { state: BossState.IDLE });
            },
            onUpdate: (deltaTime) => {
                // Buscar target si no tiene
                if (!this.target) {
                    this.findTarget();
                }
                
                // Decidir siguiente acción
                if (this.shouldAttack()) {
                    return false; // Salir del estado
                }
                
                return true;
            },
            onExit: () => {
                this.emit('stateExit', { state: BossState.IDLE });
            }
        });
        
        // Estado MOVING
        fsm.addState(BossState.MOVING, {
            transitions: [BossState.IDLE, BossState.ATTACKING, BossState.CASTING],
            onEnter: (context, data) => {
                this.moveTarget = data?.target || this.calculateMoveTarget();
                this.playAnimation('walk');
                this.emit('stateEnter', { state: BossState.MOVING, data });
            },
            onUpdate: (deltaTime, context) => {
                this.moveTo(this.moveTarget, deltaTime);
                
                // Verificar si llegó al destino
                const distance = this.distanceTo(this.moveTarget);
                if (distance < 10) {
                    return false; // Llegó, salir del estado
                }
                
                return true;
            },
            onExit: () => {
                this.moveTarget = null;
                this.emit('stateExit', { state: BossState.MOVING });
            }
        });
        
        // Estado ATTACKING
        fsm.addState(BossState.ATTACKING, {
            transitions: [BossState.IDLE, BossState.MOVING],
            onEnter: (context, data) => {
                this.currentAttack = data?.attack || this.selectAttack();
                this.playAnimation('attack_slam');
                this.emit('stateEnter', { state: BossState.ATTACKING, data });
            },
            onUpdate: (deltaTime) => {
                // El ataque se ejecuta vía sistema de habilidades
                if (!this.currentAttack) {
                    return false;
                }
                
                return true;
            },
            onExit: () => {
                this.currentAttack = null;
                this.emit('stateExit', { state: BossState.ATTACKING });
            }
        });
        
        // Estado CASTING
        fsm.addState(BossState.CASTING, {
            transitions: [BossState.IDLE, BossState.STUNNED],
            onEnter: (context, data) => {
                this.currentCast = data?.ability || null;
                this.playAnimation('summon');
                this.emit('stateEnter', { state: BossState.CASTING, data });
            },
            onUpdate: (deltaTime) => {
                // Actualizar sistema de habilidades
                this.abilitySystem.update(deltaTime);
                
                // Verificar si completó el cast
                if (!this.abilitySystem.activeAbility) {
                    return false;
                }
                
                return true;
            },
            onExit: () => {
                this.currentCast = null;
                this.emit('stateExit', { state: BossState.CASTING });
            }
        });
        
        // Estado STUNNED
        fsm.addState(BossState.STUNNED, {
            transitions: [BossState.IDLE],
            maxDuration: 2000,
            onEnter: (context, data) => {
                this.isStunned = true;
                this.stunRemaining = data?.duration || 1500;
                this.playAnimation('hit');
                this.emit('stateEnter', { state: BossState.STUNNED, data });
            },
            onUpdate: (deltaTime) => {
                this.stunRemaining -= deltaTime;
                
                if (this.stunRemaining <= 0) {
                    this.isStunned = false;
                    return false;
                }
                
                return true;
            },
            onExit: () => {
                this.isStunned = false;
                this.stunRemaining = 0;
                this.emit('stateEndStun', {});
            }
        });
        
        // Estado TRANSITIONING
        fsm.addState(BossState.TRANSITIONING, {
            transitions: [BossState.IDLE],
            maxDuration: 3000,
            onEnter: (context, data) => {
                this.playAnimation('phase_transition');
                this.emit('stateEnter', { state: BossState.TRANSITIONING, data });
            },
            onUpdate: (deltaTime) => {
                // Esperar a que complete la animación
                return true;
            },
            onExit: () => {
                if (this.stateMachine.isTransitioningPhase) {
                    this.stateMachine.completePhaseTransition();
                }
                this.emit('stateExit', { state: BossState.TRANSITIONING });
            }
        });
        
        // Estado DYING
        fsm.addState(BossState.DYING, {
            transitions: [BossState.DEAD],
            maxDuration: 4000,
            onEnter: () => {
                this.isAlive = false;
                this.playAnimation('death');
                this.emit('stateEnter', { state: BossState.DYING });
                this.emit('dying', {});
            },
            onUpdate: () => {
                return true; // Esperar animación
            },
            onExit: () => {
                this.emit('stateExit', { state: BossState.DYING });
            }
        });
        
        // Estado DEAD
        fsm.addState(BossState.DEAD, {
            transitions: [],
            onEnter: () => {
                this.playAnimation('death');
                this.emit('stateEnter', { state: BossState.DEAD });
                this.emit('death', {});
            },
            onUpdate: () => {
                return false; // Estado terminal
            }
        });
    }
    
    /**
     * Iniciar el boss (spawneo)
     */
    spawn() {
        this.emit('spawnStart', { boss: this });
        
        // Ejecutar eventos de aparición
        if (this.config.events?.onSpawn) {
            for (const event of this.config.events.onSpawn) {
                this.emit('event', { name: event, type: 'spawn' });
            }
        }
        
        // Reproducir sonido de aparición
        this.playSound('appear');
        
        // Iniciar máquina de estados
        this.stateMachine.start(BossState.IDLE);
        
        this.emit('spawnComplete', { boss: this });
    }
    
    /**
     * Actualizar lógica del boss
     * @param {number} deltaTime - Tiempo en ms
     */
    update(deltaTime) {
        if (!this.isAlive && !this.stateMachine.isInState(BossState.DYING)) {
            return;
        }
        
        // Actualizar stun
        if (this.isStunned) {
            this.stunRemaining -= deltaTime;
            if (this.stunRemaining <= 0) {
                this.isStunned = false;
                this.stateMachine.transitionTo(BossState.IDLE);
            }
            return;
        }
        
        // Actualizar sistemas
        this.stateMachine.update(deltaTime);
        this.abilitySystem.update(deltaTime);
        
        // Actualizar timers
        this.updateTimers(deltaTime);
        
        // Actualizar animaciones
        this.updateAnimation(deltaTime);
        
        // Actualizar efectos
        this.updateEffects(deltaTime);
        
        // IA básica
        if (!this.stateMachine.isInAnyState([BossState.CASTING, BossState.DYING, BossState.DEAD])) {
            this.updateAI(deltaTime);
        }
    }
    
    /**
     * Actualizar timers del boss
     * @param {number} deltaTime
     */
    updateTimers(deltaTime) {
        const phase = this.stateMachine.currentPhase;
        if (!phase) return;
        
        // Timer de spawns
        this.spawnTimer += deltaTime;
        if (this.spawnTimer >= phase.modifiers.spawnRate) {
            this.trySpawnEnemies();
            this.spawnTimer = 0;
        }
    }
    
    /**
     * Actualizar lógica de IA
     * @param {number} deltaTime
     */
    updateAI(deltaTime) {
        const phase = this.stateMachine.currentPhase;
        if (!phase) return;
        
        this.aggroTimer += deltaTime;
        
        // Decidir acción basada en agresividad
        const aggression = phase.behavior.aggressionLevel || 0.5;
        
        if (this.aggroTimer > 1000) {
            this.aggroTimer = 0;
            
            const roll = Math.random();
            
            if (roll < aggression * 0.6) {
                // Atacar o castea
                if (Math.random() < 0.7) {
                    this.tryUseAbility();
                } else {
                    this.performAttack();
                }
            } else if (roll < aggression) {
                // Moverse
                this.moveToRandomPosition();
            }
            // Else: mantenerse idle
        }
    }
    
    /**
     * Intentar usar una habilidad
     */
    tryUseAbility() {
        const phase = this.stateMachine.currentPhase;
        if (!phase || !phase.abilities) return;
        
        const availableAbilities = this.abilitySystem.getAvailableAbilities(phase.abilities);
        
        if (availableAbilities.length > 0) {
            const abilityId = availableAbilities[Math.floor(Math.random() * availableAbilities.length)];
            
            this.abilitySystem.tryCast(abilityId);
            this.stateMachine.transitionTo(BossState.CASTING, {
                ability: abilityId
            });
        }
    }
    
    /**
     * Realizar ataque básico
     */
    performAttack() {
        this.stateMachine.transitionTo(BossState.ATTACKING);
    }
    
    /**
     * Intentar invocar enemigos
     */
    trySpawnEnemies() {
        const phase = this.stateMachine.currentPhase;
        if (!phase) return;
        
        this.emit('spawnEnemies', {
            boss: this,
            phase: phase,
            timestamp: Date.now()
        });
    }
    
    /**
     * Encontrar target más cercano
     */
    findTarget() {
        // Emitir evento para que el sistema externo provea targets
        this.emit('findTarget', {
            boss: this,
            callback: (target) => {
                this.target = target;
            }
        });
    }
    
    /**
     * Calcular posición de movimiento
     * @returns {{x: number, y: number}}
     */
    calculateMoveTarget() {
        if (this.target) {
            // Moverse hacia el target pero mantener distancia
            const angle = Math.atan2(
                this.target.y - this.y,
                this.target.x - this.x
            );
            
            const desiredDistance = 150;
            return {
                x: this.target.x - Math.cos(angle) * desiredDistance,
                y: this.target.y - Math.sin(angle) * desiredDistance
            };
        }
        
        // Posición aleatoria cercana
        return {
            x: this.x + (Math.random() - 0.5) * 200,
            y: this.y + (Math.random() - 0.5) * 200
        };
    }
    
    /**
     * Moverse hacia un punto
     * @param {{x: number, y: number}} target - Punto destino
     * @param {number} deltaTime - Tiempo en ms
     */
    moveTo(target, deltaTime) {
        const phase = this.stateMachine.currentPhase;
        const speedMod = phase?.modifiers?.speedMultiplier || 1;
        const speed = this.stats.movementSpeed * speedMod;
        
        const dx = target.x - this.x;
        const dy = target.y - this.y;
        const distance = Math.sqrt(dx * dx + dy * dy);
        
        if (distance > 0) {
            const moveX = (dx / distance) * speed * (deltaTime / 1000);
            const moveY = (dy / distance) * speed * (deltaTime / 1000);
            
            this.x += moveX;
            this.y += moveY;
            
            // Actualizar dirección
            this.direction = dx > 0 ? 1 : -1;
        }
    }
    
    /**
     * Moverse a posición aleatoria
     */
    moveToRandomPosition() {
        const target = this.calculateMoveTarget();
        this.stateMachine.transitionTo(BossState.MOVING, { target });
    }
    
    /**
     * Calcular distancia a un punto
     * @param {{x: number, y: number}} point
     * @returns {number}
     */
    distanceTo(point) {
        const dx = point.x - this.x;
        const dy = point.y - this.y;
        return Math.sqrt(dx * dx + dy * dy);
    }
    
    /**
     * Verificar si debe atacar
     * @returns {boolean}
     */
    shouldAttack() {
        if (!this.target) return false;
        
        const distance = this.distanceTo(this.target);
        return distance < 200; // Rango de ataque
    }
    
    /**
     * Seleccionar ataque aleatorio
     * @returns {string}
     */
    selectAttack() {
        return 'slam'; // Por defecto
    }
    
    /**
     * Recibir daño
     * @param {number} amount - Cantidad de daño
     * @param {Object} options - Opciones adicionales
     * @returns {boolean} True si el daño fue aplicado
     */
    takeDamage(amount, options = {}) {
        if (!this.isAlive || this.isStunned) {
            return false;
        }
        
        // Aplicar modificadores de fase
        const phase = this.stateMachine.currentPhase;
        const damageMult = phase?.modifiers?.damageMultiplier || 1;
        const finalDamage = amount * damageMult;
        
        this.currentHealth = Math.max(0, this.currentHealth - finalDamage);
        this.healthPercent = this.currentHealth / this.stats.maxHealth;
        
        // Emitir evento de daño
        this.emit('damageTaken', {
            amount: finalDamage,
            remaining: this.currentHealth,
            percent: this.healthPercent,
            options
        });
        
        // Reproducir sonido de hit
        this.playSound('hit');
        this.playAnimation('hit');
        
        // Verificar muerte
        if (this.currentHealth <= 0) {
            this.die();
        } else {
            // Verificar cambio de fase
            this.stateMachine.checkPhaseTransition(this.healthPercent);
        }
        
        return true;
    }
    
    /**
     * Aplicar stun
     * @param {number} duration - Duración en ms
     */
    applyStun(duration) {
        if (this.isStunned) return;
        
        this.stateMachine.transitionTo(BossState.STUNNED, {
            duration
        });
    }
    
    /**
     * Morir
     */
    die() {
        if (!this.isAlive) return;
        
        this.isAlive = false;
        this.stateMachine.transitionTo(BossState.DYING);
        
        // Ejecutar eventos de muerte
        if (this.config.events?.onDeath) {
            for (const event of this.config.events.onDeath) {
                this.emit('event', { name: event, type: 'death' });
            }
        }
        
        this.playSound('death');
    }
    
    /**
     * Actualizar animación
     * @param {number} deltaTime
     */
    updateAnimation(deltaTime) {
        const animConfig = this.config.animations[this.currentAnimation];
        if (!animConfig) return;
        
        this.animationTimer += deltaTime;
        const frameTime = 1000 / animConfig.fps;
        
        if (this.animationTimer >= frameTime) {
            this.animationTimer = 0;
            this.animationFrame++;
            
            if (this.animationFrame >= animConfig.frames) {
                if (animConfig.loop) {
                    this.animationFrame = 0;
                } else {
                    // Animación completada, volver a idle
                    this.currentAnimation = 'idle';
                    this.animationFrame = 0;
                }
            }
        }
    }
    
    /**
     * Reproducir animación
     * @param {string} animation - Nombre de la animación
     */
    playAnimation(animation) {
        if (this.config.animations[animation]) {
            this.currentAnimation = animation;
            this.animationFrame = 0;
            this.animationTimer = 0;
        }
    }
    
    /**
     * Reproducir sonido
     * @param {string} soundKey - Clave del sonido
     */
    playSound(soundKey) {
        const soundId = this.config.sounds[soundKey];
        if (soundId) {
            this.emit('playSound', { soundId, key: soundKey });
        }
    }
    
    /**
     * Actualizar efectos visuales
     * @param {number} deltaTime
     */
    updateEffects(deltaTime) {
        // Actualizar partículas
        for (let i = this.particles.length - 1; i >= 0; i--) {
            const particle = this.particles[i];
            particle.life -= deltaTime;
            
            if (particle.life <= 0) {
                this.particles.splice(i, 1);
            } else {
                particle.x += particle.vx * (deltaTime / 1000);
                particle.y += particle.vy * (deltaTime / 1000);
                particle.alpha = particle.life / particle.maxLife;
            }
        }
        
        // Reducir screen shake
        if (this.screenShakeIntensity > 0) {
            this.screenShakeIntensity -= deltaTime / 100;
            if (this.screenShakeIntensity < 0) {
                this.screenShakeIntensity = 0;
            }
        }
    }
    
    /**
     * Añadir partícula
     * @param {Object} particle - Datos de partícula
     */
    addParticle(particle) {
        this.particles.push({
            ...particle,
            maxLife: particle.life
        });
    }
    
    /**
     * Activar screen shake
     * @param {number} intensity - Intensidad
     */
    triggerScreenShake(intensity) {
        this.screenShakeIntensity = intensity;
        this.emit('screenShake', { intensity });
    }
    
    /**
     * Obtener rectángulo de colisión
     * @returns {{x: number, y: number, width: number, height: number}}
     */
    getBounds() {
        return {
            x: this.x - this.width / 2,
            y: this.y - this.height / 2,
            width: this.width,
            height: this.height
        };
    }
    
    /**
     * Verificar si un punto está dentro del boss
     * @param {number} px - X del punto
     * @param {number} py - Y del punto
     * @returns {boolean}
     */
    containsPoint(px, py) {
        const bounds = this.getBounds();
        return px >= bounds.x && px <= bounds.x + bounds.width &&
               py >= bounds.y && py <= bounds.y + bounds.height;
    }
    
    /**
     * Obtener información completa del boss
     * @returns {Object}
     */
    getInfo() {
        return {
            id: this.id,
            name: this.name,
            title: this.title,
            health: {
                current: this.currentHealth,
                max: this.stats.maxHealth,
                percent: this.healthPercent
            },
            phase: this.stateMachine.getCurrentPhaseInfo(),
            state: this.stateMachine.getCurrentStateInfo(),
            position: { x: this.x, y: this.y },
            isAlive: this.isAlive,
            isStunned: this.isStunned
        };
    }
    
    /**
     * Serializar estado completo
     * @returns {Object}
     */
    serialize() {
        return {
            id: this.id,
            position: { x: this.x, y: this.y },
            health: {
                current: this.currentHealth,
                percent: this.healthPercent
            },
            isAlive: this.isAlive,
            isStunned: this.isStunned,
            stateMachine: this.stateMachine.serialize(),
            abilitySystem: this.abilitySystem.serialize()
        };
    }
    
    /**
     * Cargar estado desde serialización
     * @param {Object} data - Datos serializados
     */
    deserialize(data) {
        this.x = data.position?.x || this.x;
        this.y = data.position?.y || this.y;
        this.currentHealth = data.health?.current || this.currentHealth;
        this.healthPercent = data.health?.percent || this.currentHealth / this.stats.maxHealth;
        this.isAlive = data.isAlive ?? true;
        this.isStunned = data.isStunned || false;
        
        if (data.stateMachine) {
            this.stateMachine.deserialize(data.stateMachine);
        }
        
        if (data.abilitySystem) {
            this.abilitySystem.deserialize(data.abilitySystem);
        }
    }
    
    /**
     * Resetear boss para reutilizar
     */
    reset() {
        this.currentHealth = this.stats.maxHealth;
        this.healthPercent = 1;
        this.isAlive = true;
        this.isStunned = false;
        this.stunRemaining = 0;
        this.target = null;
        this.effects = [];
        this.particles = [];
        this.screenShakeIntensity = 0;
        
        this.stateMachine.reset(BossState.IDLE);
        this.abilitySystem.resetAll();
    }
}

export { Boss };
