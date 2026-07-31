# Sistema de Enemigos

## 📁 Estructura de Archivos

```
js/enemies/
├── Enemy.js           # Clase base del enemigo
├── EnemyManager.js    # Gestor optimizado con Object Pool
└── index.js           # Exportaciones consolidadas (opcional)

config/
└── enemyConfig.js     # Configuración centralizada de enemigos
```

## 🎯 Características Principales

### Clase Enemy (`js/enemies/Enemy.js`)

#### Propiedades Base
| Propiedad | Tipo | Descripción |
|-----------|------|-------------|
| `id` | string | Identificador único generado automáticamente |
| `type` | string | Tipo de enemigo (basic, fast, tank, ranged, healer) |
| `currentHealth` | number | Vida actual |
| `maxHealth` | number | Vida máxima (escalada por oleada) |
| `speed` | number | Velocidad de movimiento (px/seg) |
| `defense` | number | Defensa (reduce daño recibido) |
| `damage` | number | Daño que inflige |
| `reward` | number | Recompensa al morir |
| `x`, `y` | number | Posición en el mundo |
| `width`, `height` | number | Dimensiones para colisiones |
| `state` | EnemyState | Estado actual del enemigo |
| `path` | Array | Camino de waypoints a seguir |
| `effects` | Map | Efectos activos aplicados |

#### Estados del Enemigo (`EnemyState`)
```javascript
IDLE: 0       // Inactivo
MOVING: 1     // Moviendo por el camino
ATTACKING: 2  // Atacando objetivo
STUNNED: 3    // Aturdido (no se mueve)
SLOWED: 4     // Lentificado
BURNING: 5    // Siendo quemado (DoT)
FROZEN: 6     // Congelado
DYING: 7      // En proceso de muerte
DEAD: 8       // Muerto
```

#### Métodos Principales

**Ciclo de Vida:**
- `spawn(startX, startY, path)` - Inicializa enemigo en posición con camino
- `update(deltaTime)` - Actualiza estado, movimiento y efectos
- `die(killer)` - Marca como muerto y dispara callback
- `resetForPool()` - Prepara para reutilización en Object Pool

**Combate:**
- `takeDamage(damage, options)` - Inflige daño con opciones (crítico, ignora defensa)
- `applyEffect(type, params)` - Aplica efecto de estado (stun, slow, burn, freeze)
- `getReward()` - Obtiene recompensa en oro/puntos
- `getHealthPercent()` - Obtiene porcentaje de vida (0-1)

**Movimiento:**
- `move(deltaTime)` - Mueve hacia siguiente waypoint
- `onPathComplete()` - Callback al llegar al final del camino
- `isVisible(cameraX, cameraY, w, h)` - Verifica si está en pantalla

**Animación:**
- `setAnimation(name)` - Cambia animación actual
- `getCurrentFrame()` - Obtiene frame actual del sprite
- `updateAnimation(deltaTime)` - Actualiza frame de animación

---

### Clase EnemyManager (`js/enemies/EnemyManager.js`)

Gestor optimizado para manejar cientos de enemigos simultáneos.

#### Object Pool
El sistema implementa **Object Pool Pattern** para:
- ✅ Reducir garbage collection
- ✅ Evitar creación/destrucción constante de objetos
- ✅ Mejorar rendimiento con muchos enemigos

```javascript
// Configuración del pool (en enemyConfig.js)
poolConfig: {
    initialSize: 50,    // Enemigos pre-creados
    maxSize: 500,       // Máximo en memoria
    growthStep: 25      // Crecimiento cuando se agota
}
```

#### Métodos Principales

**Spawn:**
- `spawnEnemy(type, x, y, path, waveNumber)` - Crea un enemigo
- `spawnMultiple(enemies, waveNumber)` - Crea múltiples enemigos
- `clearAll(returnToPool)` - Elimina todos los enemigos

**Consultas:**
- `getAllEnemies()` - Lista completa de enemigos activos
- `getEnemiesInRadius(x, y, radius)` - Enemigos en área circular
- `getEnemiesInRect(x, y, width, height)` - Enemigos en rectángulo
- `getClosestEnemy(x, y)` - Enemigo más cercano a punto
- `getEnemyWithMostHealthInRadius(x, y, radius)` - Mayor vida en radio

**Acciones en Área:**
- `applyAreaDamage(x, y, radius, damage, options)` - Daño en área
- `applyAreaEffect(x, y, radius, effectType, params)` - Efecto en área

**Callbacks:**
- `setOnEnemyDeathCallback(callback)` - Cuando muere enemigo
- `setOnEnemyReachEndCallback(callback)` - Cuando llega al final
- `setOnEnemySpawnCallback(callback)` - Cuando spawnea

**Rendimiento:**
- `setPerformanceMode(enabled)` - Activa actualización por batches
- `getStats()` - Estadísticas del gestor

---

### Configuración (`config/enemyConfig.js`)

#### Tipos de Enemigos Predefinidos

| Tipo | Vida | Velocidad | Defensa | Daño | Recompensa |
|------|------|-----------|---------|------|------------|
| `basic` | 100 | 60 | 0 | 10 | 10 |
| `fast` | 60 | 100 | 0 | 8 | 15 |
| `tank` | 250 | 35 | 5 | 20 | 25 |
| `ranged` | 80 | 50 | 0 | 15 | 20 |
| `healer` | 90 | 45 | 0 | 5 | 30 |

#### Escalado por Oleada
```javascript
waveScaling: {
    factor: 1.2,           // +20% stats por oleada
    speedBonus: 0.02,      // +2% velocidad por oleada
    rewardBonus: 0.05,     // +5% recompensa por oleada
    maxSpeedMultiplier: 2, // Tope: 2x velocidad base
    maxHealthCap: 10000    // Tope: 10000 HP
}
```

#### Fórmula de Defensa
```javascript
// defenseFormula(defense) => reducción (0-1)
reducción = defense / (defense + 100)

// Ejemplos:
// 0 defensa  => 0% reducción
// 50 defensa => 33% reducción
// 100 defensa => 50% reducción
// 200 defensa => 67% reducción
```

#### Efectos de Estado

| Efecto | Descripción | Parámetros |
|--------|-------------|------------|
| `stun` | Inmoviliza completamente | duration |
| `slow` | Reduce velocidad | duration, value (0.2-0.5) |
| `burn` | Daño continuo | duration, damagePerSecond |
| `freeze` | Congela y reduce velocidad | duration |
| `poison` | Daño que escala | duration, baseDamage |

---

## 💡 Ejemplos de Uso

### 1. Configuración Básica

```javascript
import { EnemyManager } from './js/enemies/EnemyManager.js';

// Crear gestor
const enemyManager = new EnemyManager();

// Configurar callbacks
enemyManager.setOnEnemyDeathCallback((enemy, killer) => {
    const reward = enemy.getReward();
    player.addGold(reward);
    ui.showFloatingText(`+${reward}`, enemy.x, enemy.y);
});

enemyManager.setOnEnemyReachEndCallback((enemy) => {
    player.lives--;
    ui.updateLives(player.lives);
    
    if (player.lives <= 0) {
        gameOver();
    }
});
```

### 2. Spawn desde WaveManager

```javascript
// Integración con WaveManager
waveManager.setSpawnCallback((type, wave) => {
    const path = map.getPathLayer();
    const spawnPoint = path[0];
    
    return enemyManager.spawnEnemy(
        type,
        spawnPoint.x,
        spawnPoint.y,
        path,
        wave
    );
});
```

### 3. Torre con Daño en Área

```javascript
class Tower {
    attack() {
        const enemies = enemyManager.getEnemiesInRadius(
            this.x, this.y, this.range
        );
        
        if (enemies.length > 0) {
            // Daño simple
            enemyManager.applyAreaDamage(
                this.x, this.y, 
                this.damageRadius, 
                this.damage,
                { damageType: 'physical' }
            );
            
            // O aplicar efecto
            enemyManager.applyAreaEffect(
                this.x, this.y,
                this.effectRadius,
                'slow',
                { duration: 2, value: 0.5 }
            );
        }
    }
}
```

### 4. Renderizado en Canvas

```javascript
function render(ctx, camera) {
    const enemies = enemyManager.getAllEnemies();
    
    for (const enemy of enemies) {
        if (!enemy.visible || enemy.isDead) continue;
        
        // Culling
        if (!enemy.isVisible(
            camera.x, camera.y,
            canvas.width, canvas.height
        )) continue;
        
        // Dibujar sprite
        const frame = enemy.getCurrentFrame();
        if (frame) {
            ctx.drawImage(
                frame,
                Math.floor(enemy.x - camera.x),
                Math.floor(enemy.y - camera.y),
                enemy.width,
                enemy.height
            );
        }
        
        // Efectos visuales
        if (enemy.flashTimer > 0 && enemy.flashColor) {
            ctx.fillStyle = enemy.flashColor;
            ctx.globalAlpha = 0.5;
            ctx.fillRect(
                enemy.x - camera.x,
                enemy.y - camera.y,
                enemy.width,
                enemy.height
            );
            ctx.globalAlpha = 1;
        }
        
        // Barra de vida
        enemyManager.renderHealthBar(ctx, enemy);
    }
}
```

### 5. Game Loop Completo

```javascript
function gameLoop(timestamp) {
    const deltaTime = (timestamp - lastTime) / 1000;
    lastTime = timestamp;
    
    // Actualizar
    waveManager.update(deltaTime);
    enemyManager.update(deltaTime);
    
    // Renderizar
    ctx.clearRect(0, 0, canvas.width, canvas.height);
    
    map.render(ctx, camera);
    towers.forEach(tower => tower.render(ctx, camera));
    render(ctx, camera);
    
    requestAnimationFrame(gameLoop);
}
```

---

## ⚡ Optimizaciones Implementadas

### 1. Object Pool
- Reutiliza instancias en lugar de crear/destruir
- Reduce presión en garbage collector
- Límite configurable de máximos enemigos

### 2. Spatial Queries Optimizadas
- Usa distancia al cuadrado (evita `Math.sqrt`)
- Filtra enemigos muertos antes de calcular
- Batch processing en modo performance

### 3. Culling de Renderizado
- `isVisible()` verifica antes de dibujar
- Margen configurable fuera de pantalla
- LOD (Level of Detail) por distancia

### 4. Actualización Diferida
- Enemigos marcados como `isRemoving` no se actualizan
- Limpieza batch al final del frame
- Estadísticas en tiempo real

### 5. Límites de Rendimiento
```javascript
performanceLimits: {
    maxActiveEnemies: 200,   // Máximo simultáneos
    updateBatchSize: 50,     // Updates por frame (lag)
    cullingMargin: 100,      // Píxeles extra
    lodDistance: 800         // Distancia LOD
}
```

---

## 🔧 Configuración Personalizada

### Crear Nuevo Tipo de Enemigo

```javascript
import { EnemyConfig } from './config/enemyConfig.js';

// Añadir tipo custom
EnemyConfig.enemyTypes.boss_minion = {
    type: 'boss_minion',
    maxHealth: 500,
    speed: 40,
    defense: 10,
    damage: 25,
    reward: 50,
    width: 48,
    height: 48,
    attackCooldown: 1.5,
    attackRange: 40,
    specialAbility: 'explode_on_death',
    animations: {
        idle: { frames: bossMinionIdleFrames },
        walk: { frames: bossMinionWalkFrames },
        attack: { frames: bossMinionAttackFrames },
        death: { frames: bossMinionDeathFrames }
    }
};
```

### Ajustar Balance

```javascript
// Modificar escalado global
EnemyConfig.waveScaling.factor = 1.15;  // Menos difícil
EnemyConfig.waveScaling.rewardBonus = 0.08;  // Más recompensa

// Modificar fórmula de defensa
EnemyConfig.defenseFormula = (defense) => {
    return defense / (defense + 150);  // Defensa menos efectiva
};
```

---

## 📊 Estadísticas y Debug

```javascript
// Obtener estadísticas
const stats = enemyManager.getStats();
console.log(`
    Total Spawned: ${stats.totalSpawned}
    Total Killed: ${stats.totalKilled}
    Reached End: ${stats.totalReachedEnd}
    Active: ${stats.activeCount}
    Peak Active: ${stats.peakActiveCount}
`);

// Debug de un enemigo específico
const enemy = enemyManager.getClosestEnemy(player.x, player.y);
if (enemy) {
    console.log(enemy.toJSON());
    // { id, type, x, y, state, currentHealth, maxHealth, ... }
}
```

---

## ⚠️ Consideraciones Importantes

1. **No Boss Final**: Este sistema no incluye el Boss Final (se desarrollará aparte)
2. **Callbacks Obligatorios**: Configurar al menos `onEnemyDeath` y `onEnemyReachEnd`
3. **Path Requerido**: Los enemigos necesitan un camino válido para moverse
4. **Pool Size**: Ajustar según necesidades de rendimiento
5. **Memoria**: El pool mantiene referencias, usar `clearAll()` entre niveles

---

## 📝 Próximos Pasos

- [ ] Implementar Boss Final
- [ ] Añadir comportamientos especiales por tipo
- [ ] Sistema de loot/drops
- [ ] Animaciones de muerte específicas
- [ ] Sonidos por evento (spawn, hit, death)
