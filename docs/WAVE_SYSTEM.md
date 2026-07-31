# Sistema de Oleadas (Wave System)

## Descripción General

El sistema de oleadas gestiona automáticamente la aparición de enemigos en el juego, con configuración centralizada y dificultad escalable.

## Arquitectura

```
config/
├── waveConfig.js          # Configuración principal
└── waveConfig.example.js  # Ejemplo de configuración personalizada

js/waves/
└── WaveManager.js         # Lógica del gestor de oleadas
```

## Uso Básico

### 1. Importar los módulos

```javascript
import { WaveManager, WaveState } from './js/waves/WaveManager.js';
import { waveConfig } from './config/waveConfig.js';
```

### 2. Crear una instancia

```javascript
const waveManager = new WaveManager({
    spawnCallback: (enemyType, waveNumber) => {
        // Lógica para crear un enemigo
        console.log(`Spawn ${enemyType} en oleada ${waveNumber}`);
    },
    onWaveStartCallback: (waveNumber, totalEnemies, config) => {
        // Notificar inicio de oleada
        console.log(`Oleada ${waveNumber} iniciada`);
    },
    onWaveEndCallback: (waveNumber) => {
        // Notificar fin de oleada
        console.log(`Oleada ${waveNumber} completada`);
    },
    onPauseCallback: (isPaused, previousState) => {
        // Manejar pausa/reanudación
    }
});
```

### 3. Iniciar el sistema

```javascript
waveManager.start();
```

### 4. Actualizar en cada frame

```javascript
function gameLoop(deltaTime) {
    waveManager.update(deltaTime);
    // ... resto del juego
}
```

## Configuración

Todos los parámetros se configuran desde `config/waveConfig.js`:

- `pauseBetweenWaves`: Segundos entre oleadas
- `initialDelay`: Delay antes de la primera oleada
- `difficultyScalingFactor`: Factor de escalado por oleada
- `maxWaves`: Máximo de oleadas (0 = infinito)
- `waves`: Array con configuración por oleada
- `defaultWave`: Configuración para oleadas no definidas

## Estados del Sistema

| Estado | Descripción |
|--------|-------------|
| IDLE | Esperando inicio |
| INITIAL_DELAY | Contando delay inicial |
| WAVE_ACTIVE | Oleada en progreso |
| PAUSE_BETWEEN_WAVES | Pausa entre oleadas |
| COMPLETED | Juego terminado |
| PAUSED | Pausado por usuario |

## Métodos Principales

### Control
- `start()` - Inicia el sistema
- `stop()` - Detiene completamente
- `setPaused(bool)` - Pausa/reanuda
- `update(dt)` - Actualiza (llamar cada frame)

### Información
- `getWaveNumber()` - Número de oleada actual
- `getWaveProgress()` - Progreso {spawned, total, percentage}
- `getState()` - Estado actual
- `isCompleted()` - ¿Juego terminado?
- `isWaveActive()` - ¿Hay oleada activa?

## Características

- ✅ Configuración centralizada en un solo archivo
- ✅ Dificultad escalable automáticamente
- ✅ Spawns aleatorios con intervalos variables
- ✅ Tipos de enemigos configurables por oleada
- ✅ Pausas configurables entre oleadas
- ✅ Callbacks flexibles para integración
- ✅ Documentación completa con JSDoc
