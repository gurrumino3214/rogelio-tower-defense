# Sistema de Torres - Tower Defense

Sistema modular y extensible para gestionar torres en un juego Tower Defense con estilo pixel art.

## 📁 Estructura de Archivos

```
js/towers/
├── TowerTypes.js        # Registro de tipos de torres
├── Tower.js             # Clase base de instancia de torre
├── TowerManager.js      # Gestor global de torres
├── TowerAnimations.js   # Sistema de animaciones
└── index.js             # Punto de entrada y documentación
```

## 🏗️ Arquitectura

### 1. TowerTypes (Registro de Tipos)

Sistema de registro que almacena configuraciones de todos los tipos de torres disponibles.

**Características:**
- Registro centralizado de tipos
- Validación de configuraciones
- Cálculo automático de costos de mejora
- Soporte para decenas de tipos diferentes

**Uso:**
```javascript
// Inicializar tipos por defecto
TowerTypes.initDefaults();

// Registrar nuevo tipo
TowerTypes.register('nueva_torre', {
    name: 'Torre Especial',
    cost: 150,
    damage: 45,
    range: 160,
    fireRate: 1.2,
    // ... más configuración
});

// Obtener configuración
const config = TowerTypes.get('basic');
```

### 2. Tower (Clase Base)

Instancia individual de una torre colocada en el mapa.

**Características:**
- 5 prioridades de targeting
- Sistema de mejoras (hasta nivel 5)
- Venta con reembolso
- Animaciones procedurales pixel art

**Prioridades de Targeting:**
| Prioridad | Descripción | Uso Recomendado |
|-----------|-------------|-----------------|
| `closest` | Enemigo más cercano | DPS constante |
| `first` | Más avanzado en camino | Evitar fugas |
| `last` | Menos avanzado | Kill zones |
| `strongest` | Más vida | Contra bosses |
| `weakest` | Menos vida | Limpieza rápida |

**Métodos Principales:**
```javascript
// Mejorar torre
tower.upgrade();

// Vender torre
tower.sell();

// Cambiar prioridad
tower.setPriority('strongest');
tower.cyclePriority();

// Obtener información
const info = tower.getInfo();
```

### 3. TowerManager (Gestor Global)

Gestiona todas las torres del juego.

**Funciones:**
```javascript
// Inicializar
TowerManager.init();

// Construir torre
const tower = TowerManager.buildTower(x, y, 'basic');

// Seleccionar torre
TowerManager.selectTower(tower);
TowerManager.deselectTower();

// Modo colocación
TowerManager.startPlacing('ice');
TowerManager.cancelPlacing();

// Colocar en posición del mouse
TowerManager.tryPlaceTower(mouseX, mouseY);

// Renderizar preview
TowerManager.renderPlacementPreview(ctx, mouseX, mouseY);
```

### 4. TowerAnimations (Animaciones)

Sistema de animaciones pixel art procedurales.

**Animaciones Incluidas:**
- **Idle**: Respiración suave (±5% escala)
- **Shoot**: Recoil + muzzle flash estelar
- **Upgrade**: Glow dorado + partículas
- **Sell**: Fade out + rotación

```javascript
// Reproducir animación
TowerAnimations.playAnimation(tower, 'shoot');

// Dibujar con animación
TowerAnimations.drawProcedural(ctx, tower, deltaTime);
```

## 🎯 Tipos de Torres Incluidos

### 1. Torre Básica (`basic`)
- **Costo:** 50 oro
- **Daño:** 20 | **Rango:** 150 | **FireRate:** 1.0
- **Tipo:** Físico
- **Descripción:** Balanceada, buena para empezar

### 2. Torre de Hielo (`ice`)
- **Costo:** 80 oro
- **Daño:** 10 | **Rango:** 120 | **FireRate:** 0.8
- **Tipo:** Hielo
- **Efecto:** 50% slow por 2 segundos
- **Prioridad:** first

### 3. Torre Explosiva (`splash`)
- **Costo:** 120 oro
- **Daño:** 35 | **Rango:** 100 | **FireRate:** 0.5
- **Tipo:** Fuego
- **Efecto:** 80px radio de explosión
- **Prioridad:** strongest

### 4. Torre Rápida (`rapid`)
- **Costo:** 90 oro
- **Daño:** 8 | **Rango:** 130 | **FireRate:** 4.0
- **Tipo:** Físico
- **Descripción:** Alta cadencia de tiro

### 5. Torre de Rayo (`lightning`)
- **Costo:** 150 oro
- **Daño:** 25 | **Rango:** 140 | **FireRate:** 0.7
- **Tipo:** Rayo
- **Efecto:** Cadena de 3 enemigos
- **Prioridad:** closest

### 6. Torre Sniper (`sniper`)
- **Costo:** 200 oro
- **Daño:** 100 | **Rango:** 300 | **FireRate:** 0.3
- **Tipo:** Físico
- **Descripción:** Largo alcance, alto daño
- **Prioridad:** strongest

### 7. Torre Mágica (`magic`)
- **Costo:** 130 oro
- **Daño:** 40 | **Rango:** 120 | **FireRate:** 0.6
- **Tipo:** Mágico
- **Efecto:** 50% penetración de armadura
- **Prioridad:** weakest

## 📈 Sistema de Mejoras

Cada torre puede mejorarse hasta nivel 5 (configurable).

### Multiplicadores por Nivel
| Stat | Multiplicador | Incremento |
|------|---------------|------------|
| Daño | 1.2x | +20% |
| Rango | 1.1x | +10% |
| FireRate | 1.1x | +10% |
| Costo Mejora | 1.5x | - |

### Ejemplo de Costos (Torre Básica)
| Nivel | Costo Mejora | Daño Resultante |
|-------|--------------|-----------------|
| 1 → 2 | 75 oro | 24 |
| 2 → 3 | 112 oro | 29 |
| 3 → 4 | 168 oro | 35 |
| 4 → 5 | 253 oro | 42 |

```javascript
// Calcular costo de mejora
const cost = TowerTypes.getUpgradeCost('basic', 1); // 75

// Obtener stats mejorados
const stats = TowerTypes.getUpgradedStats('basic', 3);
console.log(stats.damage); // 29
```

## 💰 Sistema de Venta

Al vender se recupera:
- **50%** del costo base
- **50%** del oro gastado en mejoras

### Ejemplo (Torre Básica Nivel 3)
```
Costo base: 50 oro
Mejoras gastadas: 75 + 112 = 187 oro
Valor venta: (50 × 0.5) + (187 × 0.5) = 118 oro
```

```javascript
// Obtener valor de venta
const value = tower.getSellValue();

// Vender torre
tower.sell(); // Devuelve oro y elimina la torre
```

## 🎮 Integración con el Juego

### Inicialización
```javascript
// En el inicio del juego
TowerManager.init();
```

### Game Loop
```javascript
function gameLoop(deltaTime) {
    // Actualizar torres
    TowerManager.update(deltaTime);
    
    // Renderizar preview si se está colocando
    if (placingTower) {
        TowerManager.renderPlacementPreview(ctx, mouseX, mouseY);
    }
}
```

### Manejo de Clicks
```javascript
canvas.addEventListener('click', (e) => {
    const rect = canvas.getBoundingClientRect();
    const mouseX = e.clientX - rect.left;
    const mouseY = e.clientY - rect.top;
    
    // Intentar colocar torre
    const placed = TowerManager.tryPlaceTower(mouseX, mouseY);
    
    // Si no se colocó, seleccionar torre
    if (!placed) {
        const clicked = getTowerAtPosition(mouseX, mouseY);
        TowerManager.selectTower(clicked);
    }
});

// Click derecho para vender
canvas.addEventListener('contextmenu', (e) => {
    e.preventDefault();
    if (TowerManager.selectedTower) {
        TowerManager.selectedTower.sell();
    }
});
```

### Controles de Teclado
```javascript
window.addEventListener('keydown', (e) => {
    const tower = TowerManager.selectedTower;
    
    if (!tower) return;
    
    switch(e.key.toLowerCase()) {
        case 'u':
            tower.upgrade(); // Mejorar
            break;
        case 'p':
            tower.cyclePriority(); // Cambiar prioridad
            break;
        case 'delete':
        case 'backspace':
            tower.sell(); // Vender
            break;
    }
});
```

## 🔧 Añadir Nuevos Tipos de Torres

```javascript
TowerTypes.register('torre_veneno', {
    // Información básica
    name: 'Torre de Veneno',
    description: 'Envenena a los enemigos causando daño overtime',
    
    // Stats base
    cost: 110,
    damage: 15,
    range: 130,
    fireRate: 0.9,
    
    // Configuración de combate
    damageType: 'poison',
    targetPriority: 'first',
    
    // Efectos especiales
    special: {
        poisonDamage: 5,      // Daño por segundo
        poisonDuration: 3,    // Duración en segundos
        poisonStacks: true    // Puede acumularse
    },
    
    // Apariencia visual
    visual: {
        color: '#4caf50',
        secondaryColor: '#1b5e20',
        width: 38,
        height: 38
    },
    
    // Curva de mejora
    upgradeCurve: {
        damageMultiplier: 1.25,
        rangeMultiplier: 1.1,
        fireRateMultiplier: 1.05,
        costMultiplier: 1.6
    },
    
    maxLevel: 5
});
```

## 📝 API Reference Completa

### TowerTypes
| Método | Parámetros | Retorna | Descripción |
|--------|------------|---------|-------------|
| `register` | id, config | boolean | Registra nuevo tipo |
| `get` | id | Object\|null | Obtiene configuración |
| `has` | id | boolean | Verifica existencia |
| `getAllIds` | - | string[] | Lista todos los IDs |
| `getAll` | - | Object[] | Lista todas las configs |
| `filterByDamageType` | type | Object[] | Filtra por tipo de daño |
| `getUpgradeCost` | id, level | number | Costo de mejora |
| `getUpgradedStats` | id, level | Object | Stats mejorados |

### Tower
| Método | Parámetros | Retorna | Descripción |
|--------|------------|---------|-------------|
| `update` | deltaTime | void | Actualiza lógica |
| `render` | ctx | void | Renderiza torre |
| `findTarget` | - | Enemy\|null | Busca objetivo |
| `shoot` | - | void | Dispara |
| `upgrade` | - | boolean | Mejora torre |
| `sell` | - | number | Vende torre |
| `setPriority` | priority | void | Cambia prioridad |
| `cyclePriority` | - | void | Cicla prioridades |
| `getInfo` | - | Object | Info detallada |

### TowerManager
| Método | Parámetros | Retorna | Descripción |
|--------|------------|---------|-------------|
| `init` | - | void | Inicializa gestor |
| `buildTower` | x, y, typeId | Tower\|null | Construye torre |
| `isValidPosition` | x, y | boolean | Verifica posición |
| `selectTower` | tower | void | Selecciona torre |
| `startPlacing` | typeId | void | Inicia colocación |
| `tryPlaceTower` | mouseX, mouseY | Tower\|null | Coloca torre |
| `getStats` | - | Object | Estadísticas globales |

## 🎨 Estilo Pixel Art

El sistema usa renderizado procedural que simula pixel art sin necesidad de spritesheets externos.

### Características Visuales
- **Tamaño de píxel:** 4px para base, 3px para detalles
- **Sombras:** Proyectadas 4px abajo-derecha
- **Variación de color:** ±30% de luminosidad
- **Muzzle flash:** Forma estelar de 8 puntas

### Personalización de Sprites
```javascript
// Cargar spritesheet personalizado
await TowerAnimations.loadSpritesheet('torre_id', 'assets/sprites/torre.png', {
    idle: {
        startX: 0,
        startY: 0,
        frames: 4,
        fps: 12,
        loop: true
    },
    shoot: {
        startX: 0,
        startY: 32,
        frames: 3,
        fps: 15,
        loop: false
    }
});
```

## 🚀 Mejores Prácticas

1. **Inicialización:** Llamar `TowerManager.init()` al inicio del juego
2. **Validación:** Siempre verificar posiciones antes de construir
3. **Economía:** Usar `Game.spendGold()` para transacciones
4. **Limpieza:** Las torres inactivas se eliminan automáticamente
5. **Rendimiento:** El sistema está optimizado para cientos de torres

## 📄 Licencia

Este sistema es parte del proyecto Tower Defense Dark Pixel Art Edition.
