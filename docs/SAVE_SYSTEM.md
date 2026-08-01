# SAVE SYSTEM - Documentación del Sistema de Guardado

## Descripción General

El `SaveSystem` es un módulo completo para gestionar el guardado y carga de datos del juego utilizando **LocalStorage** del navegador. Soporta múltiples perfiles de jugador y proporciona funcionalidades avanzadas como autoguardado, copias de seguridad y migración de datos.

## Características Principales

- ✅ **Múltiples Perfiles**: Hasta 5 perfiles de jugador independientes
- ✅ **Autoguardado**: Guardado automático cada 30 segundos durante el juego
- ✅ **Gestión Completa**: Progreso, oro, mejoras, ajustes, récords y configuración
- ✅ **Copias de Seguridad**: Creación y restauración de backups
- ✅ **Migración de Datos**: Sistema de versionado para actualizaciones futuras
- ✅ **Exportar/Importar**: Capacidad de compartir perfiles via JSON
- ✅ **Validación de Datos**: Manejo robusto de errores

## Estructura de Datos

Cada perfil guarda la siguiente información:

### 1. Progreso (`progress`)
```javascript
{
    currentWave: 1,           // Ola actual
    highestWave: 1,           // Ola más alta alcanzada
    totalGamesPlayed: 0,      // Total de partidas jugadas
    totalWins: 0,             // Total de victorias
    totalLosses: 0,           // Total de derrotas
    playTimeSeconds: 0        // Tiempo total jugado
}
```

### 2. Oro (`gold`)
```javascript
{
    current: 100,             // Oro actual disponible
    totalEarned: 0,           // Oro total ganado en la partida
    totalSpent: 0             // Oro total gastado
}
```

### 3. Mejoras (`upgrades`)
```javascript
{
    towerDamage: 0,           // Nivel de mejora de daño
    towerRange: 0,            // Nivel de mejora de rango
    towerAttackSpeed: 0,      // Nivel de mejora de velocidad
    startingGold: 0,          // Nivel de mejora de oro inicial
    extraLives: 0,            // Nivel de mejora de vidas
    unlockedTowers: ['basic'], // Torres desbloqueadas
    unlockedUpgrades: []      // Mejoras desbloqueadas
}
```

### 4. Ajustes (`settings`)
```javascript
{
    difficulty: 'normal',     // easy, normal, hard
    startingLives: 20,        // Vidas iniciales
    startingGold: 100,        // Oro inicial
    enemyHealthMultiplier: 1.0,  // Multiplicador de vida enemiga
    enemySpeedMultiplier: 1.0    // Multiplicador de velocidad enemiga
}
```

### 5. Récords (`records`)
```javascript
{
    highestScore: 0,          // Puntuación más alta
    highestWave: 1,           // Ola más alta récord
    fastestWaveClear: null,   // Tiempo más rápido en completar ola
    totalEnemiesDefeated: 0,  // Total de enemigos derrotados
    totalTowersBuilt: 0,      // Total de torres construidas
    totalDamageDealt: 0,      // Daño total infligido
    bestCombo: 0              // Mejor combo conseguido
}
```

### 6. Configuración (`configuration`)
```javascript
{
    soundEnabled: true,       // Sonidos activados
    musicEnabled: true,       // Música activada
    soundVolume: 0.7,         // Volumen de sonidos (0-1)
    musicVolume: 0.5,         // Volumen de música (0-1)
    showDamageNumbers: true,  // Mostrar números de daño
    showRangeIndicator: true, // Mostrar indicador de rango
    fullscreen: false,        // Pantalla completa
    language: 'es',           // Idioma
    notifications: true       // Notificaciones activadas
}
```

## API de Uso

### Inicialización

El sistema se inicializa automáticamente al cargar el script, pero puedes llamar manualmente:

```javascript
SaveSystem.init();
```

### Gestión de Perfiles

#### Crear un nuevo perfil
```javascript
const profile = SaveSystem.createProfile('MiPerfil');
// Retorna: { profileName: 'MiPerfil', profileId: '...', ... } o null
```

#### Cargar un perfil
```javascript
const saveData = SaveSystem.loadGame(profileId);
// Retorna los datos del perfil o null
```

#### Guardar partida manualmente
```javascript
const success = SaveSystem.saveGame();
// Retorna: true si se guardó correctamente
```

#### Listar todos los perfiles
```javascript
const profiles = SaveSystem.getProfileList();
// Retorna: [{ id, name, createdAt, updatedAt, highestWave, highestScore }, ...]
```

#### Eliminar un perfil
```javascript
const deleted = SaveSystem.deleteProfile(profileId);
// Retorna: true si se eliminó correctamente
```

#### Renombrar un perfil
```javascript
const renamed = SaveSystem.renameProfile(profileId, 'NuevoNombre');
// Retorna: true si se renombró correctamente
```

#### Resetear un perfil
```javascript
const reset = SaveSystem.resetProfile(profileId);
// Retorna: true si se reseteó correctamente
```

### Autoguardado

#### Iniciar autoguardado
```javascript
SaveSystem.startAutoSave();
// Guarda automáticamente cada 30 segundos mientras se juega
```

#### Detener autoguardado
```javascript
SaveSystem.stopAutoSave();
```

### Copias de Seguridad

#### Crear backup
```javascript
const created = SaveSystem.createBackup(profileId);
// Retorna: true si se creó correctamente
```

#### Restaurar desde backup
```javascript
const restored = SaveSystem.restoreFromBackup(backupId, profileId);
// Retorna: true si se restauró correctamente
```

### Exportar/Importar

#### Exportar perfil a JSON
```javascript
const jsonString = SaveSystem.exportProfile(profileId);
// Retorna: string JSON formateado o null
```

#### Importar perfil desde JSON
```javascript
const imported = SaveSystem.importProfile(jsonString, profileId);
// Retorna: datos importados o null
// Si profileId es undefined, crea un nuevo perfil
```

### Actualizar Datos del Juego

#### Actualizar datos guardados con el estado actual
```javascript
SaveSystem.updateSaveData({
    wave: 5,
    gold: 500,
    score: 1000,
    playTime: 300
});
```

#### Aplicar datos guardados al juego
```javascript
const applied = SaveSystem.applySaveData();
// Aplica configuración de audio, dificultad, etc.
```

### Utilidades

#### Limpiar todos los datos (¡PELIGRO!)
```javascript
const cleared = SaveSystem.clearAllData();
// Retorna: true si se limpió todo
// ¡Esto elimina todos los perfiles permanentemente!
```

## Ejemplo de Uso Completo

```javascript
// 1. Inicializar sistema (automático al cargar)
SaveSystem.init();

// 2. Crear o seleccionar perfil
let profiles = SaveSystem.getProfileList();
if (profiles.length === 0) {
    SaveSystem.createProfile('Jugador 1');
    profiles = SaveSystem.getProfileList();
}

// 3. Cargar perfil
const firstProfile = profiles[0];
SaveSystem.loadGame(firstProfile.id);

// 4. Aplicar configuración guardada
SaveSystem.applySaveData();

// 5. Iniciar autoguardado
SaveSystem.startAutoSave();

// 6. Durante el juego, actualizar datos periódicamente
function onWaveComplete(wave, gold, score) {
    SaveSystem.updateSaveData({
        wave: wave,
        gold: gold,
        score: score
    });
}

// 7. Guardar manualmente en puntos importantes
function onSaveButtonClick() {
    if (SaveSystem.saveGame()) {
        console.log('¡Partida guardada!');
    }
}

// 8. Al cerrar el juego, guardar y detener autoguardado
window.onbeforeunload = function() {
    SaveSystem.saveGame();
    SaveSystem.stopAutoSave();
};
```

## Integración con Game.js

Para integrar el sistema de guardado con el juego existente:

```javascript
// En game.js - startGame()
startGame: function() {
    // ... código existente ...
    
    // Iniciar autoguardado
    if (typeof SaveSystem !== 'undefined') {
        SaveSystem.startAutoSave();
    }
},

// En game.js - completeWave()
completeWave: function() {
    // ... código existente ...
    
    // Actualizar datos guardados
    if (typeof SaveSystem !== 'undefined') {
        SaveSystem.updateSaveData({
            wave: this.wave,
            gold: this.gold,
            score: this.score
        });
    }
},

// En game.js - onGameOverEnter()
onGameOverEnter: function() {
    // Guardar antes de mostrar game over
    if (typeof SaveSystem !== 'undefined') {
        SaveSystem.updateSaveData({
            wave: this.wave,
            gold: this.gold,
            score: this.score
        });
        SaveSystem.saveGame();
        SaveSystem.stopAutoSave();
    }
    
    // ... código existente ...
}
```

## Consideraciones Técnicas

### Almacenamiento
- Los datos se guardan en **LocalStorage** del navegador
- Límite típico: 5-10 MB por dominio
- Los datos persisten entre sesiones del navegador

### Claves utilizadas en LocalStorage
- `td_profiles`: Lista de todos los perfiles
- `td_save_profile_*`: Datos de cada perfil
- `td_last_profile`: Último perfil utilizado
- `td_save_backup_*`: Copias de seguridad

### Versionado
- El sistema incluye un número de versión (`SAVE_VERSION: 1`)
- Permite migraciones automáticas de datos en futuras actualizaciones
- La función `migrateSaveData()` maneja la conversión entre versiones

### Manejo de Errores
- Todas las operaciones están envueltas en try-catch
- Los errores se registran en consola pero no rompen el juego
- Se retornan valores booleanos o null para indicar fallos

## Mejores Prácticas

1. **Guardar frecuentemente**: Usa el autoguardado y guarda en puntos clave
2. **Validar datos**: Siempre verifica que los datos cargados sean válidos
3. **No abusar de localStorage**: Recuerda el límite de almacenamiento
4. **Permitir exportar**: Da a los usuarios la opción de respaldar sus datos
5. **Manejar migraciones**: Prepara tu código para futuras versiones del formato

## Solución de Problemas

### Los datos no se guardan
- Verifica que el navegador permite LocalStorage
- Comprueba que no estás en modo incógnito/privado
- Revisa la consola del navegador para errores

### Perfil corrupto
- Usa `resetProfile()` para restaurar valores por defecto
- Importa desde una copia de seguridad si existe
- El sistema valida la estructura básica de los datos

### Múltiples pestañas abiertas
- Cada pestaña tiene su propia instancia del juego
- Los cambios se reflejan inmediatamente en localStorage
- Considera implementar sincronización si es necesario

## Licencia

Este sistema es parte del proyecto Tower Defense y puede ser modificado según las necesidades del proyecto.
