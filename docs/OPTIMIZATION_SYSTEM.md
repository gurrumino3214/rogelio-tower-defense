# Sistema de Optimización para Tower Defense

## 📋 Resumen Ejecutivo

Este sistema de optimización permite soportar **cientos de enemigos, torres y proyectiles simultáneamente** manteniendo **60 FPS estables**. Implementa técnicas profesionales de optimización usadas en juegos AAA.

### 🎯 Características Principales

| Sistema | Descripción | Beneficio |
|---------|-------------|-----------|
| **Object Pooling** | Reutilización de objetos | Elimina GC spikes |
| **QuadTree** | Partición espacial jerárquica | Colisiones O(log n) |
| **Frustum Culling** | Renderizado selectivo | Reduce draw calls |
| **Batch Processing** | Actualización por lotes | Distribuye carga CPU |
| **Memory Reuse** | Reutilización de memoria | Menor alloc/dealloc |

---

## 🏗️ Arquitectura del Sistema

```
┌─────────────────────────────────────────────────────────┐
│                  OptimizationEngine                      │
│  ┌──────────────┐  ┌──────────────┐  ┌──────────────┐  │
│  │ Object Pool  │  │   QuadTree   │  │   Frustum    │  │
│  │   System     │  │   Spatial    │  │   Culling    │  │
│  └──────────────┘  └──────────────┘  └──────────────┘  │
│                                                          │
│  ┌──────────────────────────────────────────────────┐   │
│  │           Performance Monitor & Stats            │   │
│  └──────────────────────────────────────────────────┘   │
└─────────────────────────────────────────────────────────┘
         │                │                 │
         ▼                ▼                 ▼
┌─────────────┐  ┌─────────────┐  ┌─────────────┐
│   Enemy     │  │ Projectile  │  │  Particle   │
│   Manager   │  │   Manager   │  │   System    │
│   (Pool)    │  │   (Pool)    │  │   (Pool)    │
└─────────────┘  └─────────────┘  └─────────────┘
```

---

## 📁 Estructura de Archivos

```
js/optimization/
├── QuadTree.js           # Partición espacial
├── ObjectPool.js         # Pool genérico reutilizable
├── OptimizationEngine.js # Motor central de optimización
└── index.js              # Punto de entrada
```

---

## 🔧 Sistemas de Optimización

### 1. Object Pooling

#### ¿Qué es?
Técnica que pre-crea objetos y los reutiliza en lugar de crear/destruir constantemente.

#### Beneficios
- ✅ Elimina garbage collection pauses
- ✅ Reduce allocations de memoria
- ✅ Mejora cache locality
- ✅ Predecible performance

#### Implementación

```javascript
// pool básico para enemigos
const enemyPool = {
    available: [],      // Objetos disponibles
    inUse: new Set(),   // Objetos activos
    
    get() {
        if (this.available.length > 0) {
            return this.available.pop(); // Reutilizar
        }
        return this.createNew(); // Crear solo si necesario
    },
    
    release(enemy) {
        enemy.reset(); // Limpiar estado
        this.available.push(enemy); // Devolver al pool
    }
};
```

#### Uso en el Juego

```javascript
// EnemyManager ya implementa pooling
const enemy = enemyManager.getFromPool('basic', waveNumber);
enemy.spawn(x, y, path);

// Cuando muere
enemy.isRemoving = true; // Marca para devolución
```

#### Configuración Recomendada

```javascript
const poolConfig = {
    initialSize: 100,    // Pre-crear 100 enemigos
    maxSize: 500,        // Máximo 500 en pool
    expandStep: 50       // Expandir de 50 en 50
};
```

---

### 2. QuadTree para Colisiones

#### ¿Qué es?
Estructura de datos jerárquica que divide el espacio en cuadrantes para búsquedas eficientes.

#### Complejidad
- **Sin QuadTree**: O(n²) para verificar todas las colisiones
- **Con QuadTree**: O(n log n) - miles de veces más rápido

#### Visualización

```
┌─────────────────────────────┐
│             │               │
│      0      │      1        │
│   (NO)      │   (NE)        │
│             │               │
├─────────────┼───────────────┤
│             │               │
│      2      │      3        │
│   (SO)      │   (SE)        │
│             │               │
└─────────────────────────────┘
```

#### Uso

```javascript
// Crear QuadTree
const qt = new QuadTree(
    { x: 0, y: 0, width: 800, height: 600 },
    10,  // maxObjects por nodo
    5    // maxLevels
);

// Insertar enemigos
for (const enemy of enemies) {
    qt.insert({
        x: enemy.x,
        y: enemy.y,
        width: enemy.width,
        height: enemy.height,
        entity: enemy
    });
}

// Consultar enemigos en radio
const area = { x: 100, y: 100, width: 200, height: 200 };
const nearby = qt.query(area);

// Para torre que busca targets
const targets = optimizationEngine.getEnemiesInRadius(tower.x, tower.y, tower.range);
```

#### Optimizaciones Implementadas

```javascript
// Solo insertar entidades activas
updateSpatialIndex() {
    this.spatialIndex.clear();
    
    for (const enemy of this.enemyManager.enemies) {
        if (enemy.active && !enemy.isDead) {
            this.spatialIndex.insert({...});
        }
    }
}

// Filtrar por tipo en consulta
querySpatial(area, typeFilter = 'enemy') {
    const results = this.spatialIndex.query(area);
    return results.filter(r => r.type === typeFilter);
}
```

---

### 3. Frustum Culling

#### ¿Qué es?
Técnica que solo renderiza entidades dentro del viewport de la cámara.

#### Implementación

```javascript
isInFrustum(entity, bounds) {
    const margin = 100; // Extra para evitar pop-in
    return entity.x + entity.width > bounds.x - margin &&
           entity.x < bounds.x + bounds.width + margin &&
           entity.y + entity.height > bounds.y - margin &&
           entity.y < bounds.y + bounds.height + margin;
}
```

#### Uso en Render

```javascript
render(ctx) {
    for (const entity of this.entities) {
        // Solo renderizar si está en pantalla
        if (this.optimization.isInFrustum(entity)) {
            entity.draw(ctx);
        }
    }
}
```

#### Debug Visual

```javascript
// Ver frustum bounds en debug mode
ctx.strokeStyle = 'rgba(255, 0, 0, 0.5)';
ctx.strokeRect(frustum.x, frustum.y, frustum.width, frustum.height);
```

---

### 4. Batch Processing

#### ¿Qué es?
Divide actualizaciones pesadas en múltiples frames para distribuir la carga.

#### Implementación

```javascript
updateBatched(entities, updateFn, dt) {
    const batchSize = this.performanceMode ? 
        this.config.entityUpdateBatchSize : 
        entities.length;
    
    let updated = 0;
    for (let i = 0; i < entities.length && updated < batchSize; i++) {
        if (entities[i].active) {
            updateFn(entities[i], dt);
            updated++;
        }
    }
    return updated;
}
```

#### Modo Performance Automático

```javascript
// Detectar cuando FPS baja
updatePerformanceStats(deltaTime) {
    const avgFrameTime = this.getAverageFrameTime();
    this.performanceMode = avgFrameTime > (1000 / this.config.fpsTarget);
    
    if (this.performanceMode) {
        console.log('Performance mode ON - reducing load');
    }
}
```

---

### 5. Eliminación Automática

#### Sistema de Marcado

```javascript
// Marcar para eliminación diferida
markForRemoval(entity, type, delay = 0) {
    if (delay > 0) {
        setTimeout(() => {
            this.pendingRemovals[type].add(entity);
        }, delay);
    } else {
        this.pendingRemovals[type].add(entity);
    }
}

// Procesar en frame apropiado
processRemovals() {
    for (const enemy of this.pendingRemovals.enemies) {
        enemyManager.returnToPool(enemy);
    }
    this.pendingRemovals.enemies.clear();
}
```

---

## 📊 Estadísticas y Monitoring

### Performance Stats

```javascript
const stats = optimizationEngine.getStats();
/*
{
    performance: {
        fps: 60.5,
        frameTime: 16.5,
        entityCount: 347,
        pooledObjects: 153,
        avgFrameTime: 16.2
    },
    spatialIndex: {
        totalNodes: 341,
        totalObjects: 289,
        maxDepth: 5
    },
    enemyManager: {
        totalSpawned: 1500,
        activeCount: 87,
        peakActiveCount: 156
    }
}
*/
```

### Debug Overlay

```javascript
// En game loop
optimizationEngine.renderDebug(ctx);

// Muestra:
// - FPS actuales
// - Frame time
// - Cantidad de entidades
// - Objetos en pool
// - Estado de performance mode
// - QuadTree visual (opcional)
```

---

## 🚀 Integración Paso a Paso

### 1. Incluir Scripts en HTML

```html
<!-- Antes de los demás scripts -->
<script src="js/optimization/QuadTree.js"></script>
<script src="js/optimization/ObjectPool.js"></script>
<script src="js/optimization/OptimizationEngine.js"></script>
<script src="js/optimization/index.js"></script>

<!-- Scripts existentes -->
<script src="js/enemies/EnemyManager.js"></script>
<script src="js/projectiles/ProjectileManager.js"></script>
<script src="js/engine.js"></script>
<script src="js/game.js"></script>
```

### 2. Inicializar en Engine

```javascript
// engine.js - después de init()
init() {
    // ... inicialización existente ...
    
    // Inicializar optimización
    this.optimization = new OptimizationEngine({
        maxEnemies: 500,
        maxProjectiles: 1000,
        maxParticles: 2000,
        fpsTarget: 60,
        debugMode: false
    });
    
    this.optimization.initialize({
        enemyManager: window.EnemyManager || this.enemyManager,
        projectileManager: window.ProjectileManager || this.projectileManager,
        particleSystem: window.ParticleSystem || this.particleSystem,
        towerManager: window.TowerManager || this.towerManager,
        engine: this
    });
}
```

### 3. Integrar en Game Loop

```javascript
// engine.js - gameLoop()
gameLoop(currentTime) {
    if (!this.isRunning) return;
    requestAnimationFrame((time) => this.gameLoop(time));
    
    if (this.isPaused) {
        this.lastTime = currentTime;
        return;
    }
    
    const dt = this.calculateDeltaTime(currentTime);
    
    // === OPTIMIZACIÓN AGREGADA ===
    
    // Actualizar índice espacial
    this.optimization.updateSpatialIndex();
    
    // Actualizar estadísticas
    this.optimization.updatePerformanceStats(dt);
    
    // =============================
    
    this.clear();
    this.applyCamera();
    
    // Update con batching si está en performance mode
    this.updateEntities(dt);
    
    this.processEntityAddition();
    this.processEntityRemoval();
    
    // Frustum culling en render
    this.renderLayers();
    
    // Debug overlay
    this.optimization.renderDebug(this.ctx);
    
    this.restoreCamera();
}
```

### 4. Usar QuadTree en Torres

```javascript
// Tower.js - encontrar targets
findTarget() {
    // ANTES: O(n) - buscar en todos los enemigos
    // let target = null;
    // for (const enemy of allEnemies) {...}
    
    // AHORA: O(log n) - usar QuadTree
    const enemies = optimizationEngine.getEnemiesInRadius(
        this.x, 
        this.y, 
        this.range
    );
    
    // Filtrar por prioridad (más cercano, más vida, etc.)
    return this.selectBestTarget(enemies);
}
```

### 5. Usar en Proyectiles

```javascript
// Projectile.js - colisiones
checkCollisions(enemies) {
    // ANTES: verificar contra todos
    // for (const enemy of allEnemies) {...}
    
    // AHORA: usar QuadTree
    const nearby = optimizationEngine.querySpatial({
        x: this.x - this.radius,
        y: this.y - this.radius,
        width: this.radius * 2,
        height: this.radius * 2
    }, 'enemy');
    
    for (const enemy of nearby) {
        if (this.checkCollision(enemy)) {
            this.onHit(enemy);
        }
    }
}
```

---

## ⚙️ Configuración Avanzada

### Ajustar para Diferentes Hardware

```javascript
// Low-end devices
const lowEndConfig = {
    maxEnemies: 200,
    maxProjectiles: 300,
    maxParticles: 500,
    fpsTarget: 30,
    entityUpdateBatchSize: 50,
    quadTreeMaxObjects: 5,
    quadTreeMaxLevels: 4
};

// High-end devices
const highEndConfig = {
    maxEnemies: 1000,
    maxProjectiles: 2000,
    maxParticles: 5000,
    fpsTarget: 144,
    entityUpdateBatchSize: 500,
    quadTreeMaxObjects: 20,
    quadTreeMaxLevels: 6
};

// Auto-detectar
function detectHardware() {
    const deviceMemory = navigator.deviceMemory || 4;
    const hardwareConcurrency = navigator.hardwareConcurrency || 4;
    
    if (deviceMemory >= 8 && hardwareConcurrency >= 8) {
        return highEndConfig;
    } else if (deviceMemory <= 4 || hardwareConcurrency <= 4) {
        return lowEndConfig;
    }
    return defaultConfig;
}
```

### Tuning de Parámetros

```javascript
// Monitorear y ajustar dinámicamente
setInterval(() => {
    const stats = optimizationEngine.getStats();
    
    // Si FPS consistentemente bajo, reducir carga
    if (stats.performance.fps < 30 && stats.performance.fps > 0) {
        optimizationEngine.config.entityUpdateBatchSize *= 0.8;
        console.log('Reducing batch size for performance');
    }
    
    // Si hay margen, aumentar calidad
    if (stats.performance.fps > 100) {
        optimizationEngine.config.entityUpdateBatchSize *= 1.1;
        console.log('Increasing batch size - performance headroom');
    }
}, 5000);
```

---

## 🐛 Troubleshooting

### Problema: Memory Leak

```javascript
// Síntoma: Memoria crece continuamente
// Solución: Verificar que objects vuelven al pool

debugPools() {
    console.log('Enemy Pool:', {
        available: enemyManager.pool.length,
        inUse: enemyManager.enemies.length,
        total: enemyManager.poolSize
    });
    
    console.log('Projectile Pool:', {
        available: projectileManager.projectilePool.length,
        active: projectileManager.activeProjectiles.length
    });
}
```

### Problema: Entidades no se eliminan

```javascript
// Verificar proceso de removals
optimizationEngine.pendingRemovals.enemies.forEach(e => {
    console.log('Pending removal:', e.id, e.isRemoving);
});

// Forzar limpieza
optimizationEngine.processRemovals();
```

### Problema: QuadTree ineficiente

```javascript
// Síntoma: Muchos objetos en nodo raíz
const stats = optimizationEngine.spatialIndex.getStats();
console.log(stats);

// Si objectCount >> maxObjects, ajustar parámetros
optimizationEngine.config.quadTreeMaxObjects = 5; // Reducir
optimizationEngine.initializeSpatialIndex(); // Recrear
```

---

## 📈 Benchmarks Esperados

### Escenario: 500 enemigos, 200 proyectiles

| Métrica | Sin Optimizar | Con Optimización | Mejora |
|---------|--------------|------------------|--------|
| FPS Promedio | 15-25 | 55-60 | +140% |
| GC Pauses/sec | 5-10 | 0-1 | -90% |
| Frame Time | 40-60ms | 16-18ms | -65% |
| Colisiones/frame | 250,000 checks | ~5,000 checks | -98% |
| Memory Alloc | ~50MB/min | ~5MB/min | -90% |

---

## 🎓 Mejores Prácticas

### ✅ DO

```javascript
// Reutilizar objetos siempre
const enemy = enemyManager.getFromPool(type, wave);

// Usar QuadTree para búsquedas espaciales
const nearby = qt.query(area);

// Marcar para eliminación en lugar de splice directo
enemy.isRemoving = true;

// Actualizar índice espacial cada frame
optimization.updateSpatialIndex();

// Monitorear performance regularmente
if (performanceStats.fps < 30) { /* actuar */ }
```

### ❌ DON'T

```javascript
// NO crear nuevos objetos en loop
for (let i = 0; i < 100; i++) {
    enemies.push(new Enemy()); // MAL!
}

// NO iterar todos los enemigos para búsquedas
for (const enemy of allEnemies) { // LENTO!
    if (distance(enemy, tower) < range) {...}
}

// NO eliminar directamente del array durante iteración
for (let i = 0; i < enemies.length; i++) {
    if (enemies[i].dead) {
        enemies.splice(i, 1); // PELIGROSO!
    }
}
```

---

## 🔄 Migración desde Código Existente

### Cambios Mínimos Requeridos

1. **EnemyManager**: Ya tiene pooling integrado ✅
2. **ProjectileManager**: Ya tiene pooling integrado ✅
3. **Engine**: Agregar OptimizationEngine
4. **Torres**: Usar `getEnemiesInRadius()` en lugar de iterar todos

### Cambios Opcionales (Recomendados)

1. Particles: Migrar a ObjectPool
2. Efectos: Usar pooling para partículas
3. UI: Cachear elementos DOM

---

## 📚 Recursos Adicionales

### Lecturas Recomendadas

- [Game Programming Patterns - Object Pool](http://gameprogrammingpatterns.com/object-pool.html)
- [QuadTree Collision Detection](https://gamedevelopment.tutsplus.com/tutorials/quick-tip-use-quadtrees-to-detect-likely-collisions-in-2d-space--gamedev-9380)
- [Unity Optimization Guide](https://unity.com/how-to/optimization-tips)

### Herramientas de Profiling

```javascript
// Chrome DevTools Performance Tab
// - Grabar sesión de juego
// - Identificar bottlenecks
// - Ver timeline de frames

// Custom profiler
class SimpleProfiler {
    constructor() {
        this.timings = {};
    }
    
    start(name) {
        this.timings[name] = performance.now();
    }
    
    end(name) {
        const elapsed = performance.now() - this.timings[name];
        console.log(`${name}: ${elapsed.toFixed(2)}ms`);
        return elapsed;
    }
}

// Uso
const profiler = new SimpleProfiler();
profiler.start('update');
updateEntities(dt);
profiler.end('update');
```

---

## 🎯 Conclusión

Este sistema de optimización proporciona:

- ✅ **60 FPS estables** con cientos de entidades
- ✅ **Memoria eficiente** sin garbage collection spikes
- ✅ **Colisiones rápidas** O(log n) vs O(n²)
- ✅ **Escalabilidad** para diferentes hardware
- ✅ **Monitoring** en tiempo real del rendimiento
- ✅ **Flexibilidad** para ajustar parámetros

El código está diseñado para ser **no intrusivo** - se integra con la arquitectura existente sin romper funcionalidad.

---

*Documentación creada para Dark Pixel Art Tower Defense*
*Versión: 1.0.0*
*Última actualización: 2024*
