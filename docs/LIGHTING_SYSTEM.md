# Sistema de Iluminación Dinámica - Pixel Art

Sistema de iluminación dinámica 2D inspirado en **Hyper Light Drifter** y **Blasphemous**, implementado exclusivamente con **Canvas 2D** (sin WebGL).

## Características

### ✨ Efectos de Iluminación

- **Luces puntuales** con atenuación radial y gradientes suaves
- **Sombras dinámicas** proyectadas desde obstáculos
- **Antorchas** con efecto flickering orgánico multi-frecuencia
- **Explosiones** con iluminación temporal expansiva
- **Efectos mágicos** con pulsación y partículas flotantes
- **Rayos/Relámpagos** con segmentos zigzag
- **Oscurecimiento ambiental**:
  - Viñeteado periférico
  - Niebla atmosférica oscura
  - Luz ambiental ajustable

### 🎨 Estética Pixel Art

- Renderizado `pixelated` sin suavizado
- Gradientes optimizados para look retro
- Partículas con estilo pixel art
- Paleta de colores oscuros tipo dark fantasy

## Archivos

```
js/utils/LightingSystem.js    # Sistema principal de iluminación
lighting_demo.html            # Demo interactivo completo
docs/LIGHTING_SYSTEM.md       # Esta documentación
```

## Uso Básico

### 1. Inicialización

```javascript
// Inicializar el sistema
LightingSystem.init(width, height);

// Configurar parámetros opcionales
LightingSystem.config.ambientLight = 0.15;     // Luz base (0-1)
LightingSystem.config.vignetteStrength = 0.6;  // Viñeta (0-1)
LightingSystem.config.fogDensity = 0.0003;     // Niebla
LightingSystem.config.maxLights = 32;          // Máximo de luces
```

### 2. Añadir Fuentes de Luz

#### Antorchas (con flickering)
```javascript
LightingSystem.addTorch(x, y, radius, colorType);
// colorType: 'torch', 'magic', 'moonlight'

// Ejemplo
LightingSystem.addTorch(100, 200, 150, 'torch');
```

#### Luz Estática
```javascript
LightingSystem.addStaticLight(x, y, radius, color, intensity);
// color: { r, g, b }
// intensity: 0-1

// Ejemplo
LightingSystem.addStaticLight(400, 300, 200, 
    { r: 100, g: 200, b: 255 }, 0.8);
```

#### Explosiones
```javascript
LightingSystem.addExplosion(x, y, maxRadius, duration);
// duration: segundos

// Ejemplo
LightingSystem.addExplosion(500, 400, 250, 0.5);
```

#### Efectos Mágicos
```javascript
LightingSystem.addMagicEffect(x, y, radius, magicType, duration);
// magicType: 'blue', 'purple', 'green', 'red'

// Ejemplo
LightingSystem.addMagicEffect(300, 300, 80, 'purple', 2);
```

#### Rayos
```javascript
LightingSystem.addLightning(startX, startY, endX, endY, duration);

// Ejemplo
LightingSystem.addLightning(100, 50, 700, 550, 0.3);
```

### 3. Sombras

```javascript
// Añadir obstáculo que proyecta sombra
LightingSystem.addShadowCaster(x, y, width, height);

// Ejemplo
LightingSystem.addShadowCaster(300, 200, 50, 200);

// Limpiar todos los casters
LightingSystem.clearShadowCasters();
```

### 4. Loop Principal

```javascript
function gameLoop(dt) {
    // Actualizar sistema
    LightingSystem.update(dt);
    
    // Renderizar escena base
    renderBackground();
    
    // Aplicar iluminación (multiply blend)
    LightingSystem.render(ctx, width, height);
    
    // Renderizar elementos brillantes (screen blend)
    renderGlowingElements();
}
```

### 5. Efectos Especiales

#### Transición Día/Noche
```javascript
LightingSystem.transitionDayNight(isNight, transitionTime);
// isNight: true/false
// transitionTime: segundos
```

#### Parpadeo Global
```javascript
LightingSystem.triggerFlicker(duration, frequency);
// duration: segundos
// frequency: parpadeos por segundo
```

#### Ajustes Dinámicos
```javascript
LightingSystem.setAmbientLight(0.2);      // 0-1
LightingSystem.setVignetteStrength(0.5);  // 0-1
LightingSystem.setFogDensity(0.0005);     // >0
```

## Paleta de Colores

El sistema incluye una paleta predefinida:

```javascript
LightingSystem.colorPalette = {
    torch:     { r: 255, g: 180, b: 80 },   // Naranja fuego
    magic:     { r: 100, g: 200, b: 255 },  // Azul mágico
    explosion: { r: 255, g: 220, b: 150 },  // Blanco-amarillo
    ambient:   { r: 50,  g: 50,  b: 70 },   // Azul oscuro
    moonlight: { r: 180, g: 200, b: 255 }   // Azul plateado
};
```

## Configuración Avanzada

```javascript
LightingSystem.config = {
    maxLights: 32,              // Límite de fuentes de luz
    lightQuality: 'high',       // 'low', 'medium', 'high'
    shadowResolution: 1,        // 0.5 = media resolución
    ambientLight: 0.15,         // Intensidad luz ambiental
    vignetteStrength: 0.6,      // Fuerza del viñeteado
    fogDensity: 0.0003,         // Densidad de niebla
    pixelateFactor: 4           // Factor de pixelado
};
```

## Técnicas de Implementación

### Canvas Offscreen
El sistema utiliza múltiples canvases offscreen para:
- `lightCanvas`: Acumula todas las fuentes de luz
- `shadowCanvas`: Calcula sombras en baja resolución
- `compositeCanvas`: Composición final

### Blend Modes
- **screen**: Para sumar luz (aditivo)
- **multiply**: Para oscurecer y aplicar sombras

### Gradientes Radiales
Cada luz usa gradientes con múltiples stops para transiciones suaves:
```javascript
gradient.addColorStop(0,   'rgba(r, g, b, 0.9)');  // Centro brillante
gradient.addColorStop(0.3, 'rgba(r, g, b, 0.6)');
gradient.addColorStop(0.6, 'rgba(r, g, b, 0.3)');
gradient.addColorStop(1,   'rgba(r, g, b, 0)');    // Borde difuso
```

### Flickering Orgánico
Las antorchas usan combinación de ondas sinusoidales:
```javascript
flicker = sin(t * f1) * 0.5 + sin(t * f2) * 0.3 + sin(t * f3) * 0.2
```
Esto crea variación no repetitiva similar a llama real.

## Optimizaciones

1. **Límite de luces**: Máximo 32 fuentes activas
2. **Sombras en baja resolución**: Opcionalmente renderizadas a 50%
3. **Culling**: Las luces fuera de pantalla no se renderizan
4. **Pool de partículas**: Reutilización implícita mediante arrays

## Integración con Engine.js

El sistema es completamente independiente y puede integrarse con cualquier engine:

```javascript
// En tu inicialización
LightingSystem.init(Engine.width, Engine.height);

// En tu update
LightingSystem.update(dt);

// En tu render (después de dibujar el fondo)
LightingSystem.render(Engine.ctx, Engine.width, Engine.height);
```

## Demo Interactivo

Abre `lighting_demo.html` en un navegador para ver:
- Panel de control con botones para cada efecto
- Estadísticas en tiempo real (luces, partículas, FPS)
- Click en el canvas para añadir luces interactivas
- Escena preconfigurada con antorchas y obstáculos

## Inspiración Visual

### Hyper Light Drifter
- Uso de luz para guiar al jugador
- Contrastes fuertes entre áreas iluminadas/oscuras
- Efectos mágicos vibrantes

### Blasphemous
- Atmósfera oscura y opresiva
- Iluminación religiosa/gótica
- Viñeteado pronunciado

## Limitaciones

- Sin oclusión de sombras compleja (solo proyección simple)
- Máximo recomendado: 32 luces simultáneas
- Sombras no se proyectan entre múltiples objetos

## Futuras Mejoras

- [ ] Oclusión de sombras más precisa
- [ ] Luces direccionales (spotlights)
- [ ] Reflexiones especulares
- [ ] Mapas de luz precalculados
- [ ] Sistema de materiales (reflectividad)

## Licencia

Libre uso para proyectos personales y comerciales.
