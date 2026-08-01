# Sistema de Habilidades del Boss

## Descripción General

El sistema de habilidades del Boss es un módulo completo y extensible que permite implementar una amplia variedad de habilidades especiales para los jefes del juego. Está diseñado para ser fácil de extender con nuevas habilidades sin modificar el código base.

## Archivos del Sistema

```
js/bosses/
├── BossAbilitySystem.js    - Sistema principal de gestión de habilidades
├── BossAbilityEffects.js   - Ejecutores de efectos visuales y lógicos
├── BossTypes.js            - Configuraciones de bosses y sus habilidades
└── index.js                - Punto de exportación del módulo
```

## Tipos de Habilidades Soportadas

### 1. Invocar Enemigos (`summon`)
Invoca enemigos aliados alrededor del boss.

```javascript
{
    type: 'summon',
    enemyTypes: ['sketch_minion', 'doodle_walker'],
    count: [2, 4],           // Rango mínimo-máximo o valor fijo
    spawnRadius: 150,
    positions: 'around_boss' // 'around_boss', 'spread', o 'center'
}
```

### 2. Rugidos (`roar`)
Aplica buffs al boss/aliados y debuffs a los enemigos en área.

```javascript
{
    type: 'roar',
    buffType: 'damage_boost',
    buffValue: 1.5,          // Multiplicador de daño
    buffDuration: 8000,      // ms
    debuffType: 'fear',
    debuffValue: 0.7,        // Reducción de daño enemigo
    debuffDuration: 4000,
    radius: 300
}
```

### 3. Proyectiles (`projectile`)
Dispara uno o múltiples proyectiles hacia el jugador.

```javascript
{
    type: 'projectile',
    projectileType: 'cursed_ink',
    damage: 25,
    speed: 350,
    count: 8,                // Número de proyectiles
    spreadAngle: 60,         // Ángulo de dispersión en grados
    homing: false            // Si sigue al objetivo
}
```

### 4. Golpes (`slam`)
Ataque de área cuerpo a cuerpo con knockback y stun.

```javascript
{
    type: 'slam',
    damage: 40,
    radius: 120,
    knockback: 50,
    stunDuration: 500,
    animation: 'slam_ground'
}
```

### 5. Explosiones (`explosion`)
Daño masivo en área con efectos adicionales.

```javascript
{
    type: 'explosion',
    damage: 60,
    radius: 200,
    damageOverTime: 15,      // Daño por segundo adicional
    dotDuration: 3000,
    slowPercent: 0.4,        // Reducción de velocidad
    slowDuration: 2000,
    screenShake: 15
}
```

### 6. Maldiciones (`curse`)
Aplica debuffs persistentes a los enemigos.

```javascript
{
    type: 'curse',
    curseType: 'weakness',   // 'weakness', 'vulnerability', 'slowness', 'silence'
    curseValue: 0.5,         // Reducción del 50%
    curseDuration: 10000,
    radius: 300,
    affectAll: true          // Afecta a todos independientemente de aliado/enemigo
}
```

### 7. Invulnerabilidad Temporal (`invulnerability`)
Hace al boss inmune al daño por un tiempo limitado.

```javascript
{
    type: 'invulnerability',
    duration: 4000,          // Duración en ms
    immunityType: 'all',     // Tipo de inmunidad
    visualEffect: 'shield',  // Efecto visual
    soundEffect: 'shield_activate'
}
```

### 8. Daño en Área (`area_damage`)
Variante genérica de ataque en área.

```javascript
{
    type: 'area_damage',
    damage: 50,
    radius: 150,
    knockback: 30,
    stunDuration: 200
}
```

### 9. Carga (`charge`)
El boss se lanza hacia adelante dañando todo a su paso.

```javascript
{
    type: 'charge',
    damage: 50,
    distance: 300,
    speed: 400,
    knockback: 100,
    collisionDamage: true
}
```

### 10. Efecto en Suelo (`ground_effect`)
Crea zonas persistentes que dañan a quienes las pisan.

```javascript
{
    type: 'ground_effect',
    damage: 25,
    zones: 5,                // Número de zonas a crear
    zoneRadius: 80,
    zoneDuration: 8000,      // Duración de cada zona
    damageTick: 500          // Daño cada X ms
}
```

## Cómo Agregar una Nueva Habilidad

### Paso 1: Definir la configuración en BossTypes.js

```javascript
// En CursedPencilConfig.abilities
mi_habilidad_nueva: {
    id: 'mi_habilidad_nueva',
    name: 'Nombre Épico',
    description: 'Descripción de lo que hace',
    cooldown: 15000,         // Tiempo entre usos (ms)
    castTime: 1000,          // Tiempo de preparación (ms)
    manaCost: 0,             // Costo de maná (si aplica)
    
    effect: {
        type: 'summon',      // Tipo de efecto (ver lista arriba)
        // ... parámetros específicos del tipo
    }
}
```

### Paso 2: Agregar la habilidad a las fases deseadas

```javascript
phases: [
    {
        id: 2,
        name: 'Fase Intermedia',
        healthThreshold: 0.66,
        abilities: ['summon_basic', 'slam', 'mi_habilidad_nueva'],
        // ... resto de configuración
    }
]
```

### Paso 3: (Opcional) Crear un nuevo tipo de efecto

Si necesitas un tipo de habilidad completamente nuevo:

1. Abre `BossAbilityEffects.js`
2. Agrega el nuevo tipo a `EffectTypes`:
```javascript
const EffectTypes = {
    // ... tipos existentes
    MI_NUEVO_TIPO: 'mi_nuevo_tipo'
};
```

3. Crea la función ejecutora:
```javascript
function executeMiNuevoTipo(boss, effect, context) {
    // Lógica personalizada
    // Usar context.onSpawn, context.getEntitiesInRadius, etc.
    
    return { resultado: 'datos' };
}
```

4. Registra el executor:
```javascript
const EffectExecutors = {
    // ... executors existentes
    [EffectTypes.MI_NUEVO_TIPO]: executeMiNuevoTipo
};
```

5. Exporta la función:
```javascript
export {
    // ... exports existentes
    executeMiNuevoTipo
};
```

## Sistema de Cooldowns

Cada habilidad tiene su propio cooldown independiente:

- **cooldown**: Tiempo mínimo entre usos de la habilidad
- **castTime**: Tiempo de preparación antes de ejecutar el efecto
- Durante el cast, el boss puede ser interrumpido (stun)
- El cooldown comienza después de completar el cast exitosamente

## Eventos del Sistema

El sistema emite eventos que pueden ser escuchados:

```javascript
bossAbilitySystem.on('castStart', (data) => {
    console.log(`Habilidad ${data.ability.id} comenzando`);
});

bossAbilitySystem.on('castComplete', (data) => {
    console.log(`Efecto ${data.effect.type} ejecutado`);
});

bossAbilitySystem.on('spawnEnemies', (data) => {
    // Spawnea los enemigos en el juego
    for (const enemy of data.enemies) {
        game.spawnEnemy(enemy.type, enemy.x, enemy.y);
    }
});

bossAbilitySystem.on('spawnProjectile', (data) => {
    // Crea el proyectil en el juego
    game.createProjectile(data.projectile);
});
```

## Contexto de Ejecución

Los efectos reciben un contexto con utilidades:

```javascript
const context = {
    onSpawn: (enemies) => {},           // Callback para spawn
    getEntitiesInRadius: (x,y,r) => [], // Obtener entidades cercanas
    getPlayerPosition: () => ({x,y}),   // Posición del jugador
    onSpawnProjectile: (proj) => {},    // Callback para proyectiles
    onCreateGroundZone: (zone) => {},   // Callback para zonas
    onInvulnerabilityEnd: (boss) => {}  // Callback fin invulnerabilidad
};
```

## Ejemplo Completo

```javascript
import { Boss, BossAbilitySystem, EffectTypes } from './bosses/index.js';

// Crear boss
const boss = new Boss('cursed_pencil', 400, 300);

// Escuchar eventos de habilidades
boss.abilitySystem.on('executeEffect', (data) => {
    console.log(`Efecto ejecutado: ${data.effectType}`);
    
    switch(data.effectType) {
        case EffectTypes.SUMMON:
            // Spawnear enemigos
            data.result.forEach(enemy => {
                game.spawnEnemy(enemy.type, enemy.x, enemy.y);
            });
            break;
            
        case EffectTypes.PROJECTILE:
            // Crear proyectiles
            data.result.forEach(proj => {
                game.projectiles.add(proj);
            });
            break;
    }
});

// En el game loop
function update(deltaTime) {
    boss.update(deltaTime);
}
```

## Mejores Prácticas

1. **Balancea los cooldowns**: Habilidades poderosas deben tener cooldowns largos
2. **Combina tipos de habilidades**: Usa diferentes tipos para mantener el combate interesante
3. **Considera las fases**: Habilidades más fuertes en fases posteriores
4. **Feedback visual**: Cada habilidad debe tener efectos visuales claros
5. **Telegrafía**: Da indicio al jugador antes de habilidades peligrosas
6. **Extensibilidad**: Usa la plantilla `BossTemplate` para nuevos bosses

## Integración con el Juego

Para integrar el sistema en tu juego:

1. Importa los módulos necesarios
2. Crea instancias de Boss usando `BossRegistry`
3. Escucha los eventos de `abilitySystem` para ejecutar efectos
4. Actualiza el boss en cada frame del game loop
5. Maneja los spawns de enemigos y proyectiles según los eventos

---

**Nota**: Este sistema está diseñado para ser agnóstico del motor de juego. Los efectos visuales y sonoros específicos deben implementarse según las capacidades de tu engine.
