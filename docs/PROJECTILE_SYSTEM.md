# Sistema de Proyectiles (Projectile System)

## Descripción General

Sistema modular y optimizado de proyectiles para tower defense, soportando cientos de proyectiles simultáneos con diferentes comportamientos, trayectorias y efectos visuales.

## Arquitectura

```
js/projectiles/
├── index.js              # Punto de entrada principal
├── ProjectileTypes.js    # Registro de tipos de proyectiles
├── Projectile.js         # Clase base de proyectil
├── ProjectileManager.js  # Gestor con object pooling
└── Particle.js           # Sistema de partículas
```

## Categorías de Proyectiles

### 1. Balas (`bullet`)
- Proyectiles rápidos de armas de fuego
- Trayectoria recta
- Ejemplos: `bullet_basic`, `bullet_armor_piercing`, `bullet_rapid`, `bullet_explosive`

### 2. Flechas (`arrow`)
- Proyectiles con gravedad simulada
- Rotación siguiendo la trayectoria
- Efectos especiales posibles
- Ejemplos: `arrow_basic`, `arrow_longshot`, `arrow_poison`, `arrow_ice`

### 3. Magia (`magic`)
- Proyectiles con homing (seguimiento)
- Efectos visuales brillantes
- Daños elementales variados
- Ejemplos: `magic_bolt`, `magic_fireball`, `magic_ice_shard`, `magic_void_orb`

### 4. Láser (`laser`)
- Velocidad extremadamente alta
- Perforación ilimitada
- Duración muy corta
- Ejemplos: `laser_beam`, `laser_plasma`, `laser_thermal`

### 5. Explosiones (`explosion`)
- Daño en área grande
- Efecto visual expansivo
- Empuje hacia atrás (knockback)
- Ejemplos: `explosion_basic`, `explosion_nuke`, `explosion_cluster`, `explosion_frost`

## API Reference

### ProjectileTypes

Registro central de todos los tipos de proyectiles disponibles.

#### `register(id, config)`
Registra un nuevo tipo de proyectil.

```javascript
ProjectileTypes.register('my_custom_bullet', {
    category: 'bullet',
    speed: 10,
    damage: 25,
    lifetime: 120,
    radius: 4,
    piercing: true,
    pierceCount: 2,
    areaDamage: false,
    color: { r: 255, g: 100, b: 50, a: 1 },
    trailType: 'glow'
});
```

**Parámetros de configuración:**

| Parámetro | Tipo | Descripción | Default |
|-----------|------|-------------|---------|
| `category` | string | Categoría del proyectil | `'bullet'` |
| `speed` | number | Velocidad (px/frame) | 5 |
| `damage` | number | Daño base | 10 |
| `lifetime` | number | Duración en frames (-1 = infinito) | -1 |
| `radius` | number | Radio de colisión | 3 |
| `piercing` | boolean | Puede perforar enemigos | false |
| `pierceCount` | number | Máximo de enemigos a perforar | 1 |
| `areaDamage` | boolean | Causa daño en área | false |
| `areaRadius` | number | Radio del daño en área | 0 |
| `trailType` | string | Tipo de estela | `'none'` |
| `color` | object | Color {r, g, b, a} | blanco |
| `homing` | boolean | Sigue objetivos | false |
| `homingStrength` | number | Fuerza de guiado (0-1) | 0.1 |
| `gravity` | number | Gravedad aplicada | 0 |
| `acceleration` | number | Aceleración por frame | 0 |
| `rotation` | boolean | Rota según dirección | false |
| `scale` | number | Escala de renderizado | 1 |
| `onHit` | function | Callback al impactar | null |
| `update` | function | Callback por frame | null |

#### `get(id)`
Obtiene la configuración de un tipo.

```javascript
const type = ProjectileTypes.get('bullet_basic');
```

#### `exists(id)`
Verifica si un tipo está registrado.

```javascript
if (ProjectileTypes.exists('magic_fireball')) {
    // Usar tipo
}
```

#### `getAllIds()`
Obtiene todos los IDs registrados.

```javascript
const allTypes = ProjectileTypes.getAllIds();
```

#### `getByCategory(category)`
Filtra por categoría.

```javascript
const magicProjectiles = ProjectileTypes.getByCategory('magic');
```

---

### ProjectileManager

Gestor optimizado con object pooling para máximo rendimiento.

#### Constructor

```javascript
const manager = new ProjectileManager({
    poolSize: 200,        // Pool inicial
    maxProjectiles: 500   // Límite máximo activos
});
```

#### `shoot(config)`
Dispara un nuevo proyectil.

```javascript
const projectile = manager.shoot({
    x: 100,
    y: 100,
    targetX: 400,
    targetY: 200,
    typeId: 'bullet_basic',
    source: towerInstance,
    target: enemyInstance,      // Opcional, para homing
    damageMultiplier: 1.5       // Opcional
});
```

#### `update(enemies)`
Actualiza todos los proyectiles activos.

```javascript
const activeCount = manager.update(gameState.enemies);
```

#### `render(ctx)`
Renderiza todos los proyectiles.

```javascript
manager.render(canvasContext);
```

#### `getByType(typeId)`
Filtra proyectiles por tipo.

```javascript
const fireballs = manager.getByType('magic_fireball');
```

#### `getBySource(source)`
Filtra por entidad que disparó.

```javascript
const towerShots = manager.getBySource(myTower);
```

#### `removeAllFromSource(source)`
Elimina todos los proyectiles de una fuente.

```javascript
// Cuando se vende una torre
manager.removeAllFromSource(soldTower);
```

#### `clearAll()`
Limpia todos los proyectiles activos.

```javascript
// Al cambiar de nivel
manager.clearAll();
```

#### `getStats()`
Obtiene estadísticas de rendimiento.

```javascript
const stats = manager.getStats();
console.log(stats);
// { spawned: 1500, active: 45, pooled: 155, hits: 89, maxActive: 78, poolUtilization: "9.00%" }
```

---

### Projectile (Clase Base)

Cada proyectil individual tiene los siguientes métodos:

#### Propiedades Principales

```javascript
projectile.x, projectile.y       // Posición actual
projectile.vx, projectile.vy     // Velocidad
projectile.damage                // Daño actual
projectile.active                // Estado activo/inactivo
projectile.age                   // Frames transcurridos
projectile.pierceCount           // Perforaciones restantes
projectile.hitEnemies            // Set de enemigos impactados
```

#### Métodos Internos

Estos métodos son llamados automáticamente pero pueden ser útiles para debug:

- `setDirection(targetX, targetY)` - Establece dirección
- `applyHoming()` - Aplica guía homing
- `findNearestTarget(enemies)` - Busca objetivo cercano
- `checkCollisions(enemies)` - Verifica colisiones
- `onHit(enemy)` - Maneja impacto
- `dealAreaDamage(centerEnemy)` - Aplica daño en área
- `deactivate()` - Desactiva proyectil
- `getDebugInfo()` - Información para debug

---

### Particle System

Sistema de partículas para efectos visuales.

#### Particle

```javascript
const particle = new Particle({
    x: 100,
    y: 100,
    vx: 2,
    vy: -3,
    life: 60,
    color: { r: 255, g: 100, b: 0, a: 1 },
    size: 4,
    type: 'spark',
    gravity: 0.1
});
```

**Tipos de partícula:**
- `'spark'` - Chispa brillante
- `'glow'` - Resplandor suave
- `'smoke'` - Humo difuso
- `'trail'` - Estela cuadrada

#### ParticlePool

Pool optimizado para reutilizar partículas:

```javascript
const pool = new ParticlePool(500);

// Obtener partícula
pool.get({
    x: 100,
    y: 100,
    vx: Math.random() * 4 - 2,
    vy: Math.random() * 4 - 2,
    life: 30,
    color: { r: 255, g: 200, b: 50, a: 1 },
    size: 3,
    type: 'spark'
});

// Actualizar todas
pool.update();

// Renderizar todas
pool.render(ctx);
```

---

## Ejemplos de Uso

### Ejemplo 1: Disparo Básico desde Torre

```javascript
// Inicializar gestor
const projectileManager = new ProjectileManager({
    poolSize: 300,
    maxProjectiles: 600
});

// En el update de la torre
function towerShoot(tower, target) {
    projectileManager.shoot({
        x: tower.x,
        y: tower.y,
        targetX: target.x,
        targetY: target.y,
        typeId: 'bullet_basic',
        source: tower
    });
}
```

### Ejemplo 2: Disparo con Homing (Magia)

```javascript
function shootHomingMagic(tower, target) {
    projectileManager.shoot({
        x: tower.x,
        y: tower.y,
        targetX: target.x,
        targetY: target.y,
        typeId: 'magic_bolt',
        source: tower,
        target: target  // Importante para homing
    });
}
```

### Ejemplo 3: Disparo con Daño Mejorado

```javascript
function shootUpgradedBullet(tower, target, upgradeLevel) {
    const multiplier = 1 + (upgradeLevel * 0.2); // +20% por nivel
    
    projectileManager.shoot({
        x: tower.x,
        y: tower.y,
        targetX: target.x,
        targetY: target.y,
        typeId: 'bullet_armor_piercing',
        source: tower,
        damageMultiplier: multiplier
    });
}
```

### Ejemplo 4: Registrar Tipo Personalizado

```javascript
// Registrar nuevo tipo de proyectil
ProjectileTypes.register('lightning_chain', {
    category: 'magic',
    speed: 15,
    damage: 30,
    lifetime: 60,
    radius: 2,
    piercing: true,
    pierceCount: 5,
    color: { r: 100, g: 200, b: 255, a: 1 },
    trailType: 'glow',
    homing: true,
    homingStrength: 0.15,
    
    // Callback personalizado
    onHit: (projectile, enemy) => {
        console.log('Lightning hit!', enemy.id);
        // Lógica adicional de cadena
    }
});

// Usar el nuevo tipo
projectileManager.shoot({
    x: tower.x,
    y: tower.y,
    targetX: enemy.x,
    targetY: enemy.y,
    typeId: 'lightning_chain',
    source: tower
});
```

### Ejemplo 5: Loop Principal del Juego

```javascript
function gameLoop() {
    // Actualizar lógica
    projectileManager.update(gameState.enemies);
    
    // Renderizar
    ctx.clearRect(0, 0, canvas.width, canvas.height);
    
    // Renderizar mapa, torres, enemigos...
    renderMap();
    renderTowers();
    renderEnemies();
    
    // Renderizar proyectiles
    projectileManager.render(ctx);
    
    // Renderizar partículas
    particlePool.render(ctx);
    
    requestAnimationFrame(gameLoop);
}
```

### Ejemplo 6: Debug y Estadísticas

```javascript
function showDebugInfo() {
    const stats = projectileManager.getStats();
    
    ctx.fillStyle = 'white';
    ctx.font = '12px monospace';
    ctx.fillText(`Proyectiles activos: ${stats.active}`, 10, 30);
    ctx.fillText(`Máximo alcanzado: ${stats.maxActive}`, 10, 45);
    ctx.fillText(`Total disparados: ${stats.spawned}`, 10, 60);
    ctx.fillText(`Pool utilization: ${stats.poolUtilization}`, 10, 75);
    
    // Debug de proyectil específico
    if (debugMode && selectedProjectile) {
        const info = selectedProjectile.getDebugInfo();
        console.table(info);
    }
}
```

---

## Optimización y Rendimiento

### Object Pooling

El sistema usa object pooling para evitar garbage collection:

```javascript
// Los proyectiles no se destruyen, se reciclan
// Cuando un proyectil impacta o expira:
// 1. Se marca como inactive
// 2. Se limpia su estado
// 3. Se devuelve al pool
// 4. Se reutiliza en el próximo disparo
```

### Límites Recomendados

| Configuración | Mínimo | Recomendado | Máximo |
|---------------|--------|-------------|--------|
| `poolSize` | 100 | 300 | 1000 |
| `maxProjectiles` | 200 | 500 | 2000 |
| Partículas | 200 | 500 | 2000 |

### Consejos de Rendimiento

1. **Reutilizar gestores**: No crear nuevos ProjectileManager cada nivel
2. **Ajustar pool dinámicamente**: Usar `resizePool()` según necesidades
3. **Limitar proyectiles por torre**: Configurar cooldowns apropiados
4. **Usar tipos simples**: Para hordas masivas, preferir `bullet_basic` sobre tipos complejos

---

## Integración con Torres

Las torres deben usar el ProjectileManager para disparar:

```javascript
class Tower {
    constructor(config) {
        this.projectileManager = config.projectileManager;
        this.projectileType = config.projectileType || 'bullet_basic';
    }
    
    shoot(target) {
        if (!target) return;
        
        this.projectileManager.shoot({
            x: this.x + this.offsetX,
            y: this.y + this.offsetY,
            targetX: target.x,
            targetY: target.y,
            typeId: this.projectileType,
            source: this,
            target: this.hasHoming ? target : null
        });
    }
}
```

---

## Tipos Predefinidos

### Balas (4 tipos)
- `bullet_basic` - Bala estándar, velocidad media
- `bullet_armor_piercing` - Perfora 3 enemigos
- `bullet_rapid` - Muy rápida, bajo daño
- `bullet_explosive` - Explota al impacto

### Flechas (4 tipos)
- `arrow_basic` - Flecha con gravedad
- `arrow_longshot` - Largo alcance, perforante
- `arrow_poison` - Aplica veneno (daño continuo)
- `arrow_ice` - Ralentiza enemigos

### Magia (4 tipos)
- `magic_bolt` - Homing básico
- `magic_fireball` - Daño en área + quemadura
- `magic_ice_shard` - Perfora + ralentiza
- `magic_void_orb` - Homing fuerte, lento

### Láser (3 tipos)
- `laser_beam` - Instantáneo, perfora todo
- `laser_plasma` - Área pequeña + perforación
- `laser_thermal` - Daño acumulativo

### Explosiones (4 tipos)
- `explosion_basic` - Explosión estándar
- `explosion_nuke` - Área masiva + knockback
- `explosion_cluster` - Fragmentación
- `explosion_frost` - Congela enemigos

---

## Extensibilidad

### Añadir Nuevo Tipo

```javascript
ProjectileTypes.register('custom_type', {
    category: 'magic',
    speed: 8,
    damage: 35,
    // ... resto de propiedades
});
```

### Efectos Personalizados

Usar callbacks `onHit` y `update`:

```javascript
ProjectileTypes.register('poison_cloud', {
    category: 'magic',
    speed: 4,
    damage: 10,
    areaDamage: true,
    areaRadius: 80,
    
    onHit: (projectile, enemy) => {
        // Aplicar efecto de estado personalizado
        enemy.addEffect('poison', {
            damage: 5,
            duration: 120
        });
    },
    
    update: (projectile, enemies) => {
        // Lógica personalizada por frame
        if (projectile.age % 30 === 0) {
            // Emitir partícula extra
        }
    }
});
```

---

## Solución de Problemas

### Los proyectiles no aparecen
- Verificar que `ProjectileTypes.init()` fue llamado
- Confirmar que el `typeId` existe: `ProjectileTypes.exists('mi_tipo')`

### Bajo rendimiento
- Reducir `maxProjectiles`
- Disminuir `poolSize`
- Usar tipos más simples (menos partículas)

### Proyectiles no impactan
- Verificar radio de colisión (`radius`)
- Confirmar que los enemigos tienen propiedad `active`
- Chequear coordenadas de origen y destino

### Homing no funciona
- Asegurar que `target` se pasa en `shoot()`
- Verificar que `homing: true` en el tipo
- Confirmar que el objetivo tiene `active: true`
