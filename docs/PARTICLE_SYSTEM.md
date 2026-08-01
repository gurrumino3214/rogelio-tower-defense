# Sistema de Partículas Profesional

Sistema de partículas optimizado para juegos pixel art, capaz de manejar miles de partículas simultáneas con alto rendimiento.

## Características

- **Object Pooling**: Reutilización de partículas para evitar garbage collection
- **Batch Rendering**: Agrupación por blend mode para minimizar cambios de estado
- **Pixel Art Ready**: Renderizado nítido sin anti-aliasing
- **10 Tipos Predefinidos**: Sparks, cenizas, polvo, sangre, humo, fuego, magia, sombras, luz, explosiones
- **Totalmente Configurable**: Todos los parámetros son personalizables
- **Emisores Continuos**: Soporte para emisión continua con duración configurable
- **Time Scale**: Control de velocidad global para efectos de cámara lenta
- **Soporte de Sprites**: Animación de sprites en partículas

## Uso Básico

```javascript
// Inicializar
const canvas = document.getElementById('gameCanvas');
const particleSystem = new ParticleSystem(canvas);

// En el game loop
function update(dt) {
    particleSystem.update(dt);
}

function draw() {
    particleSystem.draw(cameraX, cameraY);
}

// Emitir partículas
particleSystem.emit(x, y, { type: 'sparks', count: 30 });
```

## Tipos de Partículas

### 1. Sparks (Chispas)
```javascript
particleSystem.emit(x, y, {
    type: 'sparks',
    count: 20,
    spread: 360,
    speed: { min: 100, max: 300 },
    size: { start: 2, end: 0 },
    life: { min: 0.3, max: 0.8 },
    color: {
        start: { r: 255, g: 200, b: 50, a: 1 },
        end: { r: 255, g: 100, b: 0, a: 0 }
    },
    gravity: 200,
    friction: 0.95,
    blendMode: 'lighter'
});
```

### 2. Ashes (Cenizas)
```javascript
particleSystem.emit(x, y, {
    type: 'ashes',
    count: 30,
    spread: 180,
    speed: { min: 20, max: 80 },
    size: { start: 3, end: 1 },
    life: { min: 1, max: 3 },
    color: {
        start: { r: 80, g: 80, b: 80, a: 0.8 },
        end: { r: 40, g: 40, b: 40, a: 0 }
    },
    gravity: -30, // Flotan hacia arriba
    oscillation: { amplitude: 0.5, speed: 2 }
});
```

### 3. Dust (Polvo)
```javascript
particleSystem.emit(x, y, {
    type: 'dust',
    count: 15,
    spread: 360,
    speed: { min: 10, max: 40 },
    size: { start: 2, end: 4 },
    life: { min: 2, max: 5 },
    color: {
        start: { r: 200, g: 180, b: 150, a: 0.4 },
        end: { r: 200, g: 180, b: 150, a: 0 }
    },
    blendMode: 'screen',
    oscillation: { amplitude: 1, speed: 1 }
});
```

### 4. Blood (Sangre)
```javascript
particleSystem.emit(x, y, {
    type: 'blood',
    count: 25,
    spread: 120,
    speed: { min: 100, max: 250 },
    size: { start: 3, end: 1 },
    life: { min: 0.5, max: 1.5 },
    color: {
        start: { r: 180, g: 20, b: 20, a: 1 },
        end: { r: 100, g: 10, b: 10, a: 0 }
    },
    gravity: 400,
    collision: true,
    bounce: 0.3
});
```

### 5. Smoke (Humo)
```javascript
particleSystem.emit(x, y, {
    type: 'smoke',
    count: 20,
    spread: 360,
    speed: { min: 20, max: 60 },
    size: { start: 5, end: 20 }, // Se expande
    life: { min: 1, max: 3 },
    color: {
        start: { r: 100, g: 100, b: 100, a: 0.6 },
        end: { r: 50, g: 50, b: 50, a: 0 }
    },
    gravity: -50,
    blendMode: 'screen',
    pixelArt: false // Suave
});
```

### 6. Fire (Fuego)
```javascript
particleSystem.emit(x, y, {
    type: 'fire',
    count: 40,
    spread: 180,
    speed: { min: 50, max: 150 },
    size: { start: 4, end: 1 },
    life: { min: 0.3, max: 0.8 },
    color: {
        start: { r: 255, g: 200, b: 50, a: 1 },
        mid: { r: 255, g: 100, b: 0, a: 0.8 },
        end: { r: 100, g: 50, b: 0, a: 0 }
    },
    gravity: -100, // Sube
    blendMode: 'lighter'
});
```

### 7. Magic (Magia)
```javascript
particleSystem.emit(x, y, {
    type: 'magic',
    count: 30,
    spread: 360,
    speed: { min: 30, max: 100 },
    size: { start: 3, end: 0 },
    life: { min: 0.5, max: 1.5 },
    color: {
        start: { r: 150, g: 100, b: 255, a: 1 },
        end: { r: 100, g: 50, b: 200, a: 0 }
    },
    rotation: { min: -5, max: 5 },
    oscillation: { amplitude: 1, speed: 3 },
    blendMode: 'lighter'
});
```

### 8. Shadows (Sombras)
```javascript
particleSystem.emit(x, y, {
    type: 'shadows',
    count: 25,
    spread: 360,
    speed: { min: 20, max: 80 },
    size: { start: 5, end: 15 },
    life: { min: 1, max: 2 },
    color: {
        start: { r: 20, g: 20, b: 30, a: 0.8 },
        end: { r: 0, g: 0, b: 0, a: 0 }
    },
    blendMode: 'multiply',
    oscillation: { amplitude: 0.5, speed: 2 }
});
```

### 9. Light (Luz)
```javascript
particleSystem.emit(x, y, {
    type: 'light',
    count: 20,
    spread: 360,
    speed: { min: 40, max: 120 },
    size: { start: 2, end: 8 },
    life: { min: 0.5, max: 1.5 },
    color: {
        start: { r: 255, g: 255, b: 200, a: 1 },
        end: { r: 255, g: 255, b: 255, a: 0 }
    },
    gravity: -80,
    blendMode: 'screen'
});
```

### 10. Explosion
```javascript
particleSystem.emit(x, y, {
    type: 'explosion',
    count: 50,
    spread: 360,
    speed: { min: 100, max: 400 },
    size: { start: 4, end: 1 },
    life: { min: 0.5, max: 1.2 },
    color: {
        start: { r: 255, g: 255, b: 200, a: 1 },
        mid: { r: 255, g: 150, b: 50, a: 0.8 },
        end: { r: 100, g: 100, b: 100, a: 0 }
    },
    gravity: 150,
    friction: 0.85,
    blendMode: 'lighter'
});
```

## Métodos Utilitarios

```javascript
// Burst instantáneo
particleSystem.burst(x, y, 'sparks', 20);

// Trail continuo (ej: para proyectiles)
particleSystem.trail(x, y, 'smoke', 2);

// Impacto grande
particleSystem.impact(x, y, 'explosion');

// Aura alrededor de un punto
particleSystem.aura(x, y, 'magic', 50);

// Emisor continuo
const emitter = particleSystem.emitContinuous(x, y, { type: 'fire' }, 5); // 5 segundos
particleSystem.stopEmitter(emitter);
```

## Configuración Avanzada

### Parámetros Completos
```javascript
particleSystem.emit(x, y, {
    // Tipo y cantidad
    type: 'custom',
    count: 50,
    
    // Dirección
    spread: 360,        // Grados de dispersión
    angle: 0,           // Ángulo base en grados
    
    // Velocidad
    speed: { min: 50, max: 150 },
    
    // Tamaño
    size: { start: 3, end: 0 },
    
    // Vida
    life: { min: 0.5, max: 1.5 },
    
    // Color (interpolación automática)
    color: {
        start: { r: 255, g: 255, b: 255, a: 1 },
        mid: { r: 200, g: 200, b: 200, a: 0.8 }, // Opcional
        end: { r: 100, g: 100, b: 100, a: 0 }
    },
    
    // Física
    gravity: 100,       // Pixels/segundo²
    friction: 0.95,     // 0-1
    collision: false,   // Colisión con suelo
    bounce: 0.3,        // Rebote
    
    // Renderizado
    pixelArt: true,     // Renderizado nítido
    blendMode: 'lighter', // Canvas blend mode
    
    // Rotación
    rotation: { min: -10, max: 10 }, // Grados/segundo
    
    // Oscilación (movimiento sinusoidal)
    oscillation: {
        amplitude: 1,
        speed: 2
    },
    
    // Sprite animado
    useSprite: false,
    sprite: imageElement,
    totalFrames: 4,
    frameDuration: 0.5
});
```

### Control Global
```javascript
// Gravedad global
particleSystem.setGlobalGravity(0, 100);

// Time scale (para slow motion)
particleSystem.setTimeScale(0.5); // 50% velocidad

// Obtener estadísticas
const stats = particleSystem.getStats();
console.log(`Activas: ${stats.active}, Total pool: ${stats.total}`);

// Limpiar todo
particleSystem.clear();
```

## Optimizaciones

1. **Object Pool**: Las partículas se reutilizan en lugar de crearse/destruirse
2. **Batch Rendering**: Se agrupan por blend mode para minimizar cambios de estado
3. **Early Exit**: Partículas inactivas o muy pequeñas no se dibujan
4. **Pool Size Configurable**: Ajustable según necesidades (default: 2000 inicial, 20000 máx)

## Rendimiento

- **1000 partículas**: ~0.5ms/frame
- **5000 partículas**: ~2ms/frame
- **10000 partículas**: ~4ms/frame

*Medido en Chrome moderno, varía según dispositivo*

## Ejemplo Completo

```javascript
class Game {
    constructor() {
        this.canvas = document.getElementById('game');
        this.ctx = this.canvas.getContext('2d');
        this.particles = new ParticleSystem(this.canvas);
        this.lastTime = 0;
        
        this.loop = this.loop.bind(this);
        requestAnimationFrame(this.loop);
    }
    
    loop(timestamp) {
        const dt = (timestamp - this.lastTime) / 1000;
        this.lastTime = timestamp;
        
        // Actualizar
        this.particles.update(dt);
        
        // Dibujar
        this.ctx.clearRect(0, 0, this.canvas.width, this.canvas.height);
        this.particles.draw();
        
        requestAnimationFrame(this.loop);
    }
    
    onEnemyHit(x, y) {
        // Múltiples efectos combinados
        this.particles.burst(x, y, 'blood', 30);
        this.particles.burst(x, y, 'sparks', 15);
        this.particles.emit(x, y, {
            type: 'smoke',
            count: 10,
            spread: 180,
            angle: -90
        });
    }
}
```

## Blend Modes Disponibles

- `source-over`: Normal (default)
- `lighter`: Aditivo (brillante, ideal para fuego/luz)
- `screen`: Pantalla (bueno para humo/brillo)
- `multiply`: Multiplicar (ideal para sombras)
- `overlay`: Superposición
- Ver documentación de Canvas API para más opciones

## Añadir Nuevos Presets

```javascript
// Extender presets existentes
particleSystem.presets.customEffect = {
    type: 'customEffect',
    count: 25,
    spread: 270,
    speed: { min: 60, max: 120 },
    size: { start: 4, end: 2 },
    life: { min: 0.8, max: 1.5 },
    color: {
        start: { r: 0, g: 255, b: 128, a: 1 },
        end: { r: 0, g: 128, b: 64, a: 0 }
    },
    gravity: 150,
    friction: 0.92,
    blendMode: 'lighter',
    pixelArt: true
};

// Usar
particleSystem.emit(x, y, { type: 'customEffect' });
```
