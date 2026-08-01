# 🎵 Sistema de Audio - Documentación

## Descripción General

Sistema de audio modular diseñado para juegos pixel art, inspirado en la estética sonora de Hyper Light Drifter y Blasphemous. Soporta cientos de sonidos con gestión eficiente de recursos.

## Características Principales

✅ **Música**
- Fade in/out suave entre tracks
- Loop automático configurable
- Control de volumen independiente
- Pausa y reanudación con fade

✅ **Sonidos 2D**
- Espacialización estéreo (panoramización)
- Atenuación por distancia
- Pitch y volumen ajustables
- Pool de sonidos para rendimiento

✅ **Categorías Independientes**
- Volumen individual por categoría
- Mute por categoría
- Jerarquía de volúmenes (master → categoría → sonido)

✅ **Rendimiento**
- Sound pools para sonidos frecuentes
- Limpieza automática de recursos
- Web Audio API nativo

---

## Categorías Predefinidas

| Categoría | Descripción | Volumen Default |
|-----------|-------------|-----------------|
| `master` | Volumen general | 1.0 |
| `music` | Música de fondo | 0.7 |
| `ambient` | Sonidos ambientales | 1.0 |
| `ui` | Interfaz de usuario | 1.0 |
| `enemies` | Enemigos comunes | 1.0 |
| `boss` | Jefes finales | 1.0 |
| `towers` | Torres y construcciones | 1.0 |
| `explosions` | Explosiones y efectos | 1.0 |

---

## Inicialización

```javascript
// Obtener instancia singleton
const audio = AudioSystem.getInstance();

// Inicializar sistema (requiere interacción del usuario)
await audio.init();

// El contexto de audio se crea automáticamente al primer uso
```

---

## Carga de Sonidos

### Carga Individual

```javascript
// Cargar un sonido
await audio.loadSound(
    'explosion_01',           // ID único
    'assets/audio/explosion.wav',  // URL
    'explosions',             // Categoría
    {                         // Opciones opcionales
        volume: 0.8,
        pitch: 1.0,
        spatial: true,
        maxDistance: 500
    }
);
```

### Carga Múltiple

```javascript
const soundConfigs = [
    {
        id: 'ui_click',
        url: 'assets/audio/ui/click.wav',
        category: 'ui',
        options: { volume: 0.5 }
    },
    {
        id: 'enemy_hit',
        url: 'assets/audio/enemies/hit.wav',
        category: 'enemies',
        options: { volume: 0.7, pitch: 1.2 }
    },
    {
        id: 'tower_build',
        url: 'assets/audio/towers/build.wav',
        category: 'towers',
        options: { volume: 0.6 }
    }
];

await audio.loadSounds(soundConfigs);
```

### Crear Sound Pool

```javascript
// Para sonidos que se reproducen frecuentemente (disparos, pasos, etc.)
audio.createSoundPool(
    'arrow_shoot',      // ID
    'assets/audio/shoot.wav',  // URL
    'towers',           // Categoría
    15,                 // Tamaño del pool
    { volume: 0.5 }     // Opciones
);
```

---

## Carga de Música

```javascript
// Cargar track musical
await audio.loadMusic(
    'main_theme',
    'assets/music/main_theme.ogg',
    {
        volume: 0.7,
        loop: true
    }
);

// Cargar múltiples tracks
const musicConfigs = [
    {
        id: 'battle_music',
        url: 'assets/music/battle.ogg',
        options: { volume: 0.8, loop: true }
    },
    {
        id: 'boss_music',
        url: 'assets/music/boss.ogg',
        options: { volume: 0.9, loop: true }
    }
];

await audio.loadMusicBatch(musicConfigs);
```

---

## Reproducción

### Sonidos Simples

```javascript
// Reproducir sonido
audio.play('explosion_01');

// Con posición para espacialización 2D
audio.play('explosion_01', { x: 400, y: 300 });

// Con overrides
audio.play('explosion_01', null, {
    volume: 1.0,
    pitch: 0.8,
    loop: false
});
```

### Sonidos 2D Espacializados

```javascript
// Reproducir sonido con panoramización automática según posición X
audio.playSound2D('enemy_attack', 200, 150);

// El sonido se escuchará más a la izquierda (x=200 en canvas de 800px)
```

### Música

```javascript
// Reproducir música con fade in
audio.playMusic('main_theme', 2.0);  // 2 segundos de fade in

// Cambiar música con transición
audio.playMusic('battle_music', 1.0);  // Fade out anterior + fade in nuevo

// Detener música con fade out
audio.stopMusic(1.5);  // 1.5 segundos de fade out

// Pausar y reanudar
audio.pauseMusic();
audio.resumeMusic(0.5);  // Fade in de 0.5s

// Ajustar volumen
audio.setMusicVolume(0.5, 1.0);  // Fade de 1 segundo
```

---

## Control de Volúmenes

### Volumen Master

```javascript
// Ajustar volumen general (afecta a todas las categorías)
audio.setMasterVolume(0.8);
```

### Volúmenes por Categoría

```javascript
// Establecer volumen
audio.setCategoryVolume('music', 0.6);
audio.setCategoryVolume('explosions', 0.8);
audio.setCategoryVolume('ui', 0.5);

// Obtener volumen actual
const musicVol = audio.getCategoryVolume('music');

// Silenciar categoría
audio.muteCategory('music');
audio.muteCategory('enemies');

// Reactivar categoría
audio.unmuteCategory('music');
```

### Volumen de Sonidos Individuales

```javascript
const sound = audio.play('explosion_01');

// Ajustar volumen con fade
sound.setVolume(0.5, 0.3);  // Fade de 0.3 segundos

// Ajustar pitch
sound.setPitch(1.2);

// Ajustar panoramización
sound.setPan(-0.5);  // Izquierda
sound.setPan(0.5);   // Derecha
```

---

## Gestión de Estados

### Pausar/Reanudar Todo

```javascript
// Pausar todos los sonidos y música
audio.pauseAll();

// Reanudar todo
audio.resumeAll();
```

### Detener Sonidos

```javascript
// Detener sonido específico
audio.stop('explosion_01', 0.5);  // Con fade de 0.5s

// Detener todos los sonidos
audio.stopAll(0.3);  // Con fade de 0.3s
```

### Habilitar/Deshabilitar Sistema

```javascript
// Deshabilitar audio (silencia todo)
audio.disable();

// Habilitar audio
audio.enable();

// Toggle
const isEnabled = audio.toggle();
```

---

## Sonidos Generados por Oscilador

Para UI o efectos simples sin archivos externos:

```javascript
// Crear sonido de oscilador
audio.createOscillatorSound(
    'square',   // Tipo: sine, square, sawtooth, triangle
    440,        // Frecuencia en Hz
    0.1,        // Duración en segundos
    0.3         // Volumen
);

// Sonidos UI predefinidos
audio.playUISound('click');    // Click de botón
audio.playUISound('hover');    // Hover sobre botón
audio.playUISound('select');   // Selección
audio.playUISound('error');    // Error
audio.playUISound('success');  // Éxito
```

---

## Configuración y Persistencia

### Obtener Configuración Actual

```javascript
const config = audio.getConfig();
/*
{
    master: 0.8,
    music: { volume: 0.6, muted: false },
    ambient: { volume: 1.0, muted: false },
    ui: { volume: 0.5, muted: false },
    enemies: { volume: 1.0, muted: false },
    boss: { volume: 1.0, muted: false },
    towers: { volume: 1.0, muted: false },
    explosions: { volume: 0.8, muted: false },
    enabled: true
}
*/

// Guardar en localStorage
localStorage.setItem('audioConfig', JSON.stringify(config));
```

### Aplicar Configuración Guardada

```javascript
const savedConfig = JSON.parse(localStorage.getItem('audioConfig'));
if (savedConfig) {
    audio.applyConfig(savedConfig);
}
```

---

## Limpieza de Recursos

### Descargar Sonido Específico

```javascript
audio.unloadSound('explosion_01');
```

### Descargar Todos los Sonidos

```javascript
audio.unloadAll();
```

### Destruir Sistema Completo

```javascript
audio.destroy();  // Cierra el AudioContext y libera toda la memoria
```

---

## Ejemplo de Uso Completo

```javascript
class Game {
    async init() {
        // Inicializar audio
        this.audio = AudioSystem.getInstance();
        await this.audio.init();

        // Cargar sonidos
        await this.audio.loadSounds([
            { id: 'ui_click', url: 'audio/ui/click.wav', category: 'ui' },
            { id: 'ui_hover', url: 'audio/ui/hover.wav', category: 'ui' },
            { id: 'tower_place', url: 'audio/towers/place.wav', category: 'towers' },
            { id: 'enemy_death', url: 'audio/enemies/death.wav', category: 'enemies' },
            { id: 'explosion', url: 'audio/fx/explosion.wav', category: 'explosions' }
        ]);

        // Crear pools para sonidos frecuentes
        this.audio.createSoundPool('arrow', 'audio/towers/arrow.wav', 'towers', 20);
        this.audio.createSoundPool('hit', 'audio/fx/hit.wav', 'explosions', 15);

        // Cargar música
        await this.audio.loadMusic('main', 'audio/music/main.ogg', { loop: true });
        await this.audio.loadMusic('boss', 'audio/music/boss.ogg', { loop: true });

        // Cargar configuración guardada
        const savedConfig = localStorage.getItem('audioConfig');
        if (savedConfig) {
            this.audio.applyConfig(JSON.parse(savedConfig));
        }

        // Iniciar música
        this.audio.playMusic('main', 2.0);
    }

    onTowerBuild(x, y) {
        this.audio.playSound2D('tower_place', x, y);
    }

    onEnemyDeath(x, y) {
        this.audio.playSound2D('enemy_death', x, y);
        this.audio.play('explosion', { x, y }, { volume: 0.8 });
    }

    onBossSpawn() {
        this.audio.playMusic('boss', 1.5);
    }

    onPause() {
        this.audio.pauseAll();
    }

    onResume() {
        this.audio.resumeAll();
    }

    onSaveSettings() {
        const config = this.audio.getConfig();
        localStorage.setItem('audioConfig', JSON.stringify(config));
    }
}
```

---

## Mejores Prácticas

### 1. Inicialización Tardía
El AudioContext requiere interacción del usuario. Inicializa después del primer click/touch.

```javascript
document.addEventListener('click', () => {
    audio.init().then(() => {
        console.log('Audio ready!');
    });
}, { once: true });
```

### 2. Usar Pools para Sonidos Frecuentes
Evita crear nuevos objetos para sonidos que se reproducen mucho.

```javascript
// ❌ Mal: Crea nuevo objeto cada vez
audio.play('arrow_shot');

// ✅ Bien: Usa pool pre-creado
audio.createSoundPool('arrow_shot', 'arrow.wav', 'towers', 20);
audio.play('arrow_shot');
```

### 3. Fade en Transiciones Musicales
Siempre usa fade al cambiar música para evitar cortes bruscos.

```javascript
// ✅ Bien
audio.playMusic('new_track', 1.0);  // 1 segundo de fade
```

### 4. Limpiar Recursos No Usados
Libera memoria cuando cambies de nivel o escena.

```javascript
// Al cambiar de nivel
audio.unloadAll();
// Cargar nuevos sonidos del siguiente nivel
await audio.loadSounds(nextLevelSounds);
```

### 5. Espacialización 2D
Usa `playSound2D` para posicionar sonidos en el espacio del juego.

```javascript
// El sonido se escuchará según la posición X en pantalla
audio.playSound2D('explosion', enemy.x, enemy.y);
```

---

## Solución de Problemas

### El audio no suena
- Verifica que `init()` se haya llamado después de interacción del usuario
- Comprueba que el AudioContext no esté suspendido
- Revisa que los archivos de audio existan y sean válidos

### Cortes o glitches en el audio
- Usa sound pools para sonidos frecuentes
- Reduce el número de sonidos reproduciéndose simultáneamente
- Verifica el formato de los archivos (OGG/MP3 recomendados)

### La música no hace fade
- Asegúrate de pasar el tiempo de fade en `playMusic()` o `stopMusic()`
- Verifica que el track tenga `loop: true` si es música de fondo

---

## Formatos Soportados

El sistema usa Web Audio API, que soporta:
- **OGG** (recomendado - mejor compresión)
- **MP3** (compatible universal)
- **WAV** (sin compresión, mayor tamaño)
- **WebM** (alternativa moderna)
- **AAC** (soporte variable)

---

## Referencias de Clases

### AudioSystem
Clase principal singleton. Gestiona todas las operaciones de audio.

### AudioCategory
Gestiona volumen y mute de una categoría específica.

### Sound2D
Representa un sonido individual con opciones de reproducción.

### MusicTrack
Representa un track musical con fade in/out.

### SoundPool
Pool de sonidos reutilizables para optimización.

---

*Documento generado para Pixel Art Game Engine v1.0*
