# Sistema de Boss Final - Documentación Completa

## 📋 Índice

1. [Descripción General](#descripción-general)
2. [Arquitectura del Sistema](#arquitectura-del-sistema)
3. ["El Lápiz Maldito" - Boss Final](#el-lápiz-maldito---boss-final)
4. [Módulos del Sistema](#módulos-del-sistema)
5. [API Reference](#api-reference)
6. [Ejemplos de Uso](#ejemplos-de-uso)
7. [Guía de Integración](#guía-de-integración)
8. [Creación de Nuevos Bosses](#creación-de-nuevos-bosses)

---

## Descripción General

Sistema modular y extensible para bosses de múltiples fases en juegos Tower Defense. Incluye:

- ✅ Máquina de estados finita (FSM)
- ✅ Sistema de habilidades con cooldowns
- ✅ Transiciones de fase dinámicas
- ✅ Sistema de eventos y cinemáticas
- ✅ Soporte para múltiples bosses simultáneos
- ✅ Animaciones y efectos visuales
- ✅ Integración con sistema de sonido
- ✅ Serialización para guardado/carga

---

## Arquitectura del Sistema

```
┌─────────────────────────────────────────────────────────────┐
│                      BossManager                             │
│  • Gestiona todos los bosses activos                         │
│  • Cola de bosses pendientes                                 │
│  • Eventos globales                                          │
└─────────────────────────────────────────────────────────────┘
                              │
                              ▼
┌─────────────────────────────────────────────────────────────┐
│                         Boss                                 │
│  • Instancia individual de boss                              │
│  • Estadísticas y estado                                     │
│  • Referencia a sistemas internos                            │
└─────────────────────────────────────────────────────────────┘
                    │                    │
        ┌───────────┴──────┐    ┌────────┴─────────┐
        ▼                  ▼    ▼                  ▼
┌──────────────┐   ┌──────────────────┐   ┌─────────────────┐
│StateMachine  │   │ AbilitySystem    │   │ BossTypes/Config│
│• Estados     │   │• Habilidades     │   │• Configuración  │
│• Fases       │   │• Cooldowns       │   │• Stats          │
│• Transiciones│   │• Ejecución       │   │• Animaciones    │
└──────────────┘   └──────────────────┘   └─────────────────┘
```

---

## "El Lápiz Maldito" - Boss Final

### Descripción
Criatura gigante formada por tinta maldita y dibujos oscuros. Es el jefe final del juego.

### Características
- **Dimensiones:** 4x5 tiles (128x160 pixels)
- **Vida Total:** 5,000 HP
- **Velocidad Base:** 30 px/s

### Las 3 Fases

#### Fase 1: "Despertar" (100% - 66% vida)
| Característica | Valor |
|---------------|-------|
| Velocidad | 60% (lento) |
| Daño | 80% |
| Spawn Rate | 8 segundos |
| Habilidades | `summon_basic`, `slam` |
| Agresividad | 30% |

**Comportamiento:**
- Camina lentamente hacia las torres
- Invoca esbirros básicos cada 8 segundos
- Usa golpe aplastante ocasionalmente
- Período idle entre acciones: 2-4 segundos

#### Fase 2: "Furia Creciente" (66% - 33% vida)
| Característica | Valor |
|---------------|-------|
| Velocidad | 100% (normal) |
| Daño | 120% |
| Spawn Rate | 5 segundos |
| Habilidades | `summon_advanced`, `slam`, `area_attack`, `charge` |
| Agresividad | 60% |

**Nuevas Habilidades:**
- **Invocar Guardián:** Enemigos élite más fuertes
- **Explosión de Tinta:** Daño en área grande + slow
- **Carga Brutal:** Se lanza hacia adelante

**Comportamiento:**
- Mayor movilidad
- Invoca enemigos más peligrosos
- Ataques de área frecuentes
- Período idle: 1-2.5 segundos

#### Fase 3: "Modo Furia Total" (33% - 0% vida)
| Característica | Valor |
|---------------|-------|
| Velocidad | 150% (muy rápido) |
| Daño | 180% |
| Spawn Rate | 3 segundos |
| Habilidades | Todas + `devastate`, `ink_storm` |
| Agresividad | 100% |

**Habilidades Exclusivas:**
- **Oleada Oscura:** Invoca 6-10 enemigos de una vez
- **Devastación Total:** Ataque masivo (100 dmg, 350px radio)
- **Tormenta de Tinta:** Crea zonas dañinas persistentes

**Comportamiento:**
- Máxima agresividad
- Oleadas completas de enemigos
- Ataques especiales devastadores
- Screen shake en ataques grandes
- Período idle: 0.5-1.5 segundos

---

## Módulos del Sistema

### 1. BossTypes.js
Registro de configuraciones de bosses.

```javascript
import { BossRegistry, CursedPencilConfig } from './bosses/BossTypes.js';

// Obtener configuración
const config = BossRegistry.get('cursed_pencil');

// Registrar nuevo boss
BossRegistry.register(miBossConfig);
```

### 2. Boss.js
Clase principal del boss.

```javascript
import { Boss } from './bosses/Boss.js';

const boss = new Boss('cursed_pencil', 400, 300);
boss.spawn();
boss.update(deltaTime);
boss.takeDamage(50);
```

### 3. BossStateMachine.js
Máquina de estados finita.

```javascript
import { BossStateMachine, BossState } from './bosses/BossStateMachine.js';

const fsm = new BossStateMachine(boss);
fsm.addState(BossState.IDLE, { /* config */ });
fsm.start(BossState.IDLE);
fsm.transitionTo(BossState.ATTACKING);
```

### 4. BossAbilitySystem.js
Sistema de habilidades y cooldowns.

```javascript
import { BossAbilitySystem } from './bosses/BossAbilitySystem.js';

const abilitySys = new BossAbilitySystem(abilitiesConfig, boss);
abilitySys.tryCast('slam');
abilitySys.update(deltaTime);
```

### 5. BossManager.js
Gestor central de bosses.

```javascript
import { BossManager } from './bosses/BossManager.js';

const manager = new BossManager();
manager.spawnBoss('cursed_pencil', 400, 300);
manager.update(deltaTime);
```

---

## API Reference

### BossRegistry

| Método | Parámetros | Retorna | Descripción |
|--------|-----------|---------|-------------|
| `register(config)` | `config: Object` | `void` | Registra un nuevo boss |
| `get(bossId)` | `bossId: string` | `Object\|null` | Obtiene configuración |
| `exists(bossId)` | `bossId: string` | `boolean` | Verifica existencia |
| `getAllIds()` | - | `string[]` | Lista todos los IDs |
| `getCount()` | - | `number` | Número de bosses |

### Boss

#### Constructor
```javascript
new Boss(bossId: string, x: number, y: number)
```

#### Métodos Principales

| Método | Parámetros | Retorna | Descripción |
|--------|-----------|---------|-------------|
| `spawn()` | - | `void` | Inicia el boss |
| `update(deltaTime)` | `deltaTime: number` | `void` | Actualiza lógica |
| `takeDamage(amount, options)` | `amount: number`, `options: Object` | `boolean` | Aplica daño |
| `applyStun(duration)` | `duration: number` | `void` | Stunea al boss |
| `die()` | - | `void` | Mata al boss |
| `getInfo()` | - | `Object` | Información completa |
| `serialize()` | - | `Object` | Para guardado |
| `deserialize(data)` | `data: Object` | `void` | Cargar estado |
| `reset()` | - | `void` | Resetear para reuso |

#### Eventos

```javascript
boss.on('spawnStart', (data) => { });
boss.on('spawnComplete', (data) => { });
boss.on('damageTaken', ({ amount, remaining, percent }) => { });
boss.on('death', () => { });
boss.on('dying', () => { });
boss.on('stateEnter', ({ state }) => { });
boss.on('stateExit', ({ state }) => { });
boss.on('spawnEnemies', ({ boss, phase }) => { });
boss.on('playSound', ({ soundId, key }) => { });
boss.on('screenShake', ({ intensity }) => { });
boss.on('event', ({ name, type }) => { });
```

### BossStateMachine

#### Estados Disponibles

```javascript
BossState = {
    IDLE: 'idle',           // Inactivo, esperando
    MOVING: 'moving',       // Movimiento
    ATTACKING: 'attacking', // Atacando
    CASTING: 'casting',     // Lanzando habilidad
    STUNNED: 'stunned',     // Aturdido
    TRANSITIONING: 'transitioning', // Cambio de fase
    DYING: 'dying',         // Muriendo
    DEAD: 'dead'            // Muerto
};
```

#### Métodos

| Método | Parámetros | Retorna | Descripción |
|--------|-----------|---------|-------------|
| `addState(name, config)` | `name: string`, `config: Object` | `State` | Añade estado |
| `setupPhases(phases)` | `phases: Array` | `void` | Configura fases |
| `start(initialState, data)` | `initialState: string`, `data: any` | `void` | Inicia FSM |
| `transitionTo(newState, data)` | `newState: string`, `data: any` | `boolean` | Cambia estado |
| `update(deltaTime)` | `deltaTime: number` | `void` | Actualiza |
| `checkPhaseTransition(healthPercent)` | `healthPercent: number` | `void` | Verifica fase |
| `isInState(stateName)` | `stateName: string` | `boolean` | Verifica estado |
| `getCurrentPhaseInfo()` | - | `Object` | Info de fase actual |
| `serialize()` | - | `Object` | Serializar |
| `deserialize(data)` | `data: Object` | `void` | Cargar |

### BossAbilitySystem

#### Métodos

| Método | Parámetros | Retorna | Descripción |
|--------|-----------|---------|-------------|
| `tryCast(abilityId)` | `abilityId: string` | `boolean` | Intenta lanzar |
| `castRandom(allowedIds)` | `allowedIds: string[]` | `string\|null` | Lanza aleatoria |
| `getAvailableAbilities(ids)` | `ids: string[]` | `string[]` | Disponibles |
| `update(deltaTime)` | `deltaTime: number` | `void` | Actualiza |
| `getAbility(abilityId)` | `abilityId: string` | `BossAbility\|null` | Obtiene habilidad |
| `resetAll()` | - | `void` | Reset todo |
| `forceCooldown(id, duration)` | `id: string`, `duration: number` | `void` | Fuerza CD |

#### Eventos

```javascript
abilitySys.on('castStart', ({ ability, boss }) => { });
abilitySys.on('castComplete', ({ ability, boss, effect }) => { });
abilitySys.on('cooldownReady', ({ ability, boss }) => { });
abilitySys.on('executeEffect', ({ ability, effect, boss }) => { });
abilitySys.on('castCancelled', ({ boss }) => { });
```

### BossManager

#### Constructor
```javascript
new BossManager(options?: {
    maxConcurrentBosses?: number,
    enableCinematics?: boolean,
    debugMode?: boolean
})
```

#### Métodos

| Método | Parámetros | Retorna | Descripción |
|--------|-----------|---------|-------------|
| `queueBoss(bossId, spawnData)` | `bossId: string`, `spawnData: Object` | `boolean` | Encola boss |
| `spawnBoss(bossId, x, y, opts)` | `bossId: string`, `x,y: number`, `opts: Object` | `Boss\|null` | Spawnea |
| `update(deltaTime)` | `deltaTime: number` | `void` | Actualiza todos |
| `getBoss(bossId)` | `bossId: string` | `Boss\|null` | Obtiene boss |
| `getActiveBoss()` | - | `Boss\|null` | Boss activo |
| `hasActiveBoss()` | - | `boolean` | ¿Hay boss? |
| `getAllBosses()` | - | `Boss[]` | Todos los bosses |
| `getLivingBosses()` | - | `Boss[]` | Bosses vivos |
| `forcePhaseChange(index)` | `index: number` | `void` | Fuerza cambio fase |
| `damageAllBosses(amount, opts)` | `amount: number`, `opts: Object` | `number` | Daño a todos |
| `stunAllBosses(duration)` | `duration: number` | `void` | Stun masivo |
| `reset()` | - | `void` | Reset completo |
| `getStats()` | - | `Object` | Estadísticas |

#### Eventos

```javascript
manager.on('bossSpawn', ({ boss, bossId, position }) => { });
manager.on('bossDamage', ({ boss, amount, remaining }) => { });
manager.on('healthUpdate', ({ current, max, percent }) => { });
manager.on('phaseChange', ({ boss, phase, phaseIndex }) => { });
manager.on('bossSpawnMinions', ({ boss, phase }) => { });
manager.on('bossDefeated', ({ boss, bossInfo, stats }) => { });
manager.on('bossWaveComplete', () => { });
manager.on('bossEvent', ({ boss, name, type }) => { });
manager.on('playBossSound', ({ soundId, key }) => { });
manager.on('screenShake', ({ intensity }) => { });
```

---

## Ejemplos de Uso

### Ejemplo 1: Spawn Básico del Boss

```javascript
import { BossManager } from './js/bosses/BossManager.js';

// Crear gestor
const bossManager = new BossManager({
    maxConcurrentBosses: 1,
    enableCinematics: true
});

// Escuchar evento de spawn
bossManager.on('bossSpawn', ({ boss }) => {
    console.log(`¡${boss.name} ha aparecido!`);
    // Reproducir música de boss
    playMusic('boss_theme');
});

// Spawnear El Lápiz Maldito
const boss = bossManager.spawnBoss('cursed_pencil', 400, 300);

if (boss) {
    console.log('Boss spawned successfully');
}
```

### Ejemplo 2: Game Loop Principal

```javascript
import { getBossManager } from './js/bosses/BossManager.js';

const bossManager = getBossManager();
let lastTime = 0;

function gameLoop(timestamp) {
    const deltaTime = timestamp - lastTime;
    lastTime = timestamp;
    
    // Actualizar bosses
    if (bossManager.hasActiveBoss()) {
        bossManager.update(deltaTime);
        
        // Obtener boss activo
        const boss = bossManager.getActiveBoss();
        const info = boss.getInfo();
        
        // Actualizar UI de vida
        updateHealthBar(info.health.current, info.health.max);
        updatePhaseIndicator(info.phase.name);
    }
    
    requestAnimationFrame(gameLoop);
}

requestAnimationFrame(gameLoop);
```

### Ejemplo 3: Manejo de Eventos de Boss

```javascript
import { BossManager } from './js/bosses/BossManager.js';

const manager = new BossManager();

// Daño recibido
manager.on('bossDamage', ({ boss, amount, remaining }) => {
    showDamageNumber(amount, boss.x, boss.y);
    createHitParticles(boss.x, boss.y);
});

// Cambio de fase
manager.on('phaseChange', ({ boss, phase, phaseIndex }) => {
    // Cinemática de cambio de fase
    screenFlash('red');
    playSound('boss_phase_transform');
    showAnnouncement(phase.name);
    
    // Aumentar dificultad
    if (phaseIndex === 2) {
        // Fase 3 - máxima dificultad
        increaseGameSpeed(1.5);
    }
});

// Invocación de enemigos
manager.on('bossSpawnMinions', ({ boss, phase }) => {
    // Generar enemigos alrededor del boss
    spawnMinionsAroundBoss(boss, phase.modifiers.spawnRate);
});

// Boss derrotado
manager.on('bossDefeated', ({ boss, bossInfo, stats }) => {
    console.log(`Boss defeated in ${stats.totalTimeInBossFight}ms`);
    
    // Recompensas
    giveRewards({
        gold: 1000,
        experience: 500,
        achievement: 'pencil_slayer'
    });
    
    // Cinemática de victoria
    playVictorySequence();
});

// Screen shake
manager.on('screenShake', ({ intensity }) => {
    camera.shake(intensity);
});
```

### Ejemplo 4: Sistema de Cola de Bosses

```javascript
import { BossManager } from './js/bosses/BossManager.js';

const manager = new BossManager();

// Encolar secuencia de bosses
manager.queueBoss('cursed_pencil', { x: 400, y: 300 });
manager.queueBoss('future_boss_2', { x: 300, y: 400 });
manager.queueBoss('future_boss_3', { x: 500, y: 300 });

// Iniciar primero
const firstBoss = manager.bossQueue.shift();
manager.spawnBoss(firstBoss.bossId, firstBoss.spawnData.x, firstBoss.spawnData.y);

// Los siguientes aparecerán automáticamente tras 3 segundos
```

### Ejemplo 5: Debug y Estadísticas

```javascript
import { BossManager } from './js/bosses/BossManager.js';

const manager = new BossManager({ debugMode: true });
manager.setDebugMode(true);

// Obtener estadísticas en tiempo real
setInterval(() => {
    const stats = manager.getStats();
    console.log('Boss Stats:', stats);
    
    /*
    {
        totalBossesSpawned: 5,
        totalBossesDefeated: 3,
        totalTimeInBossFight: 450000,
        activeBossCount: 1,
        livingBossCount: 1,
        queuedBossCount: 2
    }
    */
}, 5000);

// Forzar cambio de fase para testing
function debugForcePhase(phaseIndex) {
    manager.forcePhaseChange(phaseIndex);
}

// Dañar boss instantáneamente
function debugDamageBoss(amount) {
    manager.damageAllBosses(amount);
}
```

### Ejemplo 6: Guardado y Carga

```javascript
import { BossManager } from './js/bosses/BossManager.js';

const manager = new BossManager();

// Guardar estado
function saveGame() {
    const state = manager.serialize();
    localStorage.setItem('bossState', JSON.stringify(state));
}

// Cargar estado
function loadGame() {
    const saved = localStorage.getItem('bossState');
    if (saved) {
        const state = JSON.parse(saved);
        manager.deserialize(state);
        console.log('Boss state loaded');
    }
}

// Auto-guardado cada 30 segundos
setInterval(saveGame, 30000);
```

---

## Guía de Integración

### Paso 1: Importar Módulos

```javascript
// En tu archivo principal del juego
import { 
    BossManager, 
    Boss, 
    BossRegistry,
    CursedPencilConfig 
} from './js/bosses/index.js';
```

### Paso 2: Inicializar BossManager

```javascript
// En la inicialización del juego
const bossManager = new BossManager({
    maxConcurrentBosses: 1,
    enableCinematics: true,
    debugMode: false
});
```

### Paso 3: Configurar Event Listeners

```javascript
// Conectar con otros sistemas del juego
bossManager.on('bossSpawn', ({ boss }) => {
    // Música
    audioSystem.play('boss_theme');
    
    // UI
    uiSystem.showBossHealthBar();
    
    // Cinemática
    cinematicSystem.playBossEntrance(boss);
});

bossManager.on('healthUpdate', ({ current, max, percent }) => {
    uiSystem.updateBossHealth(current, max, percent);
});

bossManager.on('phaseChange', ({ phase }) => {
    uiSystem.showPhaseAnnouncement(phase.name);
    audioSystem.play('boss_phase_change');
});

bossManager.on('bossSpawnMinions', ({ boss, phase }) => {
    enemyManager.spawnWave({
        types: phase.modifiers.enemyTypes,
        count: phase.modifiers.count,
        aroundPosition: { x: boss.x, y: boss.y }
    });
});

bossManager.on('bossDefeated', () => {
    audioSystem.stop('boss_theme');
    audioSystem.play('victory_fanfare');
    uiSystem.hideBossHealthBar();
    levelSystem.completeLevel();
});
```

### Paso 4: Integrar en Game Loop

```javascript
function update(deltaTime) {
    // ... otros updates
    
    // Actualizar bosses
    bossManager.update(deltaTime);
    
    // Verificar colisiones con proyectiles
    if (bossManager.hasActiveBoss()) {
        const boss = bossManager.getActiveBoss();
        checkProjectileCollisions(boss);
    }
}
```

### Paso 5: Trigger del Boss Final

```javascript
// Cuando el jugador completa ciertas condiciones
function onWaveCompleted(waveNumber) {
    if (waveNumber === 10) { // Última ola antes del boss
        setTimeout(() => {
            triggerBossFight();
        }, 3000);
    }
}

function triggerBossFight() {
    // Oscurecer pantalla
    screenSystem.darken();
    
    // Mostrar mensaje
    uiSystem.showWarning('¡EL LÁPIZ MALDITO SE ACERCA!');
    
    // Spawnear boss
    bossManager.spawnBoss('cursed_pencil', 400, 100);
}
```

---

## Creación de Nuevos Bosses

### Plantilla Base

```javascript
import { BossTemplate } from './js/bosses/BossTypes.js';

const MiBossConfig = {
    ...BossTemplate,
    
    id: 'mi_boss_personalizado',
    name: 'Nombre del Boss',
    title: 'Título Épico',
    
    dimensions: {
        width: 3,
        height: 4
    },
    
    baseStats: {
        maxHealth: 3000,
        movementSpeed: 40,
        damageMultiplier: 1.0
    },
    
    phases: [
        {
            id: 1,
            name: 'Fase 1',
            healthThreshold: 1.0,
            modifiers: {
                speedMultiplier: 0.8,
                damageMultiplier: 1.0,
                spawnRate: 6000,
                abilityCooldown: 4000
            },
            abilities: ['habilidad_1', 'habilidad_2'],
            behavior: {
                patrolRange: 120,
                idleTime: [1500, 3000],
                aggressionLevel: 0.5
            }
        },
        {
            id: 2,
            name: 'Fase 2',
            healthThreshold: 0.5,
            modifiers: {
                speedMultiplier: 1.2,
                damageMultiplier: 1.5,
                spawnRate: 4000,
                abilityCooldown: 2500
            },
            abilities: ['habilidad_1', 'habilidad_2', 'habilidad_3'],
            behavior: {
                patrolRange: 180,
                idleTime: [800, 2000],
                aggressionLevel: 0.8
            }
        }
    ],
    
    abilities: {
        habilidad_1: {
            id: 'habilidad_1',
            name: 'Nombre Habilidad',
            cooldown: 8000,
            castTime: 1000,
            effect: {
                type: 'area_damage',
                damage: 50,
                radius: 100
            }
        },
        // ... más habilidades
    },
    
    animations: {
        idle: { frames: 4, fps: 8, loop: true },
        walk: { frames: 6, fps: 10, loop: true },
        attack: { frames: 8, fps: 15, loop: false },
        hit: { frames: 3, fps: 12, loop: false },
        death: { frames: 12, fps: 8, loop: false }
    },
    
    sounds: {
        appear: 'boss_appear_sound',
        hit: 'boss_hit_sound',
        death: 'boss_death_sound'
    },
    
    events: {
        onSpawn: ['cinematic', 'music_start'],
        onPhaseChange: ['screen_effect', 'announcement'],
        onDeath: ['explosion', 'loot_drop']
    }
};

// Registrar
BossRegistry.register(MiBossConfig);
```

### Tipos de Efectos de Habilidades

```javascript
// Daño en área
effect: {
    type: 'area_damage',
    damage: 50,
    radius: 100,
    knockback: 30,
    stunDuration: 500
}

// Spawn de enemigos
effect: {
    type: 'spawn',
    enemyTypes: ['minion_type_1', 'minion_type_2'],
    count: [2, 4],
    spawnRadius: 150,
    positions: 'around_boss'
}

// Carga
effect: {
    type: 'charge',
    damage: 60,
    distance: 300,
    speed: 400,
    knockback: 100
}

// Efecto en suelo
effect: {
    type: 'ground_effect',
    damage: 20,
    zones: 5,
    zoneRadius: 80,
    zoneDuration: 8000,
    damageTick: 500
}

// Mega ataque
effect: {
    type: 'mega_area',
    damage: 100,
    radius: 350,
    screenShake: 20,
    stunDuration: 1500
}
```

---

## Optimización y Mejores Prácticas

### Performance Tips

1. **Limitar bosses concurrentes:**
```javascript
const manager = new BossManager({ maxConcurrentBosses: 1 });
```

2. **Usar object pooling para partículas:**
```javascript
// Reutilizar partículas en lugar de crear nuevas
const particle = particlePool.get();
boss.addParticle(particle);
```

3. **Reducir frecuencia de eventos:**
```javascript
// Throttling de eventos de daño
let lastDamageEvent = 0;
boss.on('damageTaken', (data) => {
    const now = Date.now();
    if (now - lastDamageEvent < 100) return;
    lastDamageEvent = now;
    // Procesar evento
});
```

### Debugging

```javascript
// Habilitar modo debug
manager.setDebugMode(true);

// Ver historial de estados
const history = boss.stateMachine.getHistory();
console.log('State transitions:', history);

// Ver habilidades en cooldown
const onCD = boss.abilitySystem.getAbilitiesOnCooldown();
console.log('Abilities on CD:', onCD);

// Información completa
console.log('Boss info:', boss.getInfo());
```

---

## Solución de Problemas

### El boss no aparece
- Verificar que está registrado: `BossRegistry.exists('boss_id')`
- Comprobar coordenadas válidas
- Verificar límite de bosses concurrentes

### Las habilidades no se ejecutan
- Verificar cooldowns: `abilitySystem.getAbilitiesOnCooldown()`
- Comprobar que el boss no está stuneado
- Verificar transiciones de estado permitidas

### El boss no cambia de fase
- Confirmar que el daño reduce la vida correctamente
- Verificar thresholds de fase en configuración
- Comprobar que `checkPhaseTransition` se llama

### Performance bajo
- Reducir número de partículas
- Limitar bosses concurrentes
- Usar throttling en eventos frecuentes

---

## Créditos

Sistema desarrollado para Tower Defense con soporte para:
- Múltiples bosses personalizados
- Fases dinámicas con comportamientos únicos
- Sistema de eventos extensible
- Integración completa con audio, UI y cinemáticas

**Versión:** 1.0.0  
**Licencia:** MIT  
**Autor:** Equipo de Desarrollo
