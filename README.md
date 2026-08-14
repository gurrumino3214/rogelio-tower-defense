# Rogelio Tower Defense 🎮

Un emocionante juego de **Tower Defense** desarrollado con HTML5 Canvas y JavaScript puro. ¡Defiende tu base de las oleadas enemigas y derrota al temible **Rogelio** en la oleada 50!

## 📖 Descripción

Rogelio Tower Defense es un juego estratégico donde debes colocar torres para defender tu base de las oleadas de enemigos. Cada oleada se vuelve más difícil, y cada 10 oleadas te enfrentarás a un mini-jefe. ¿Podrás sobrevivir hasta la oleada 50 y derrotar a Rogelio?

## ✨ Características

- **50 oleadas** de intensidad creciente
- **Sistema de torres** variado con diferentes capacidades
- **Jefes y mini-jefes** cada 10 oleadas
- **Sistema de iluminación dinámica** para efectos visuales impresionantes
- **Efectos de partículas** para explosiones y impactos
- **Menú interactivo** con selección de nivel y opciones
- **Gráficos sprite-based** optimizados

## 🚀 Instalación y Uso

### 🎮 ¡JUGAR AHORA! 

[![Jugar Rogelio Tower Defense](https://img.shields.io/badge/🎮-JUGAR%20AHORA-brightgreen?style=for-the-badge&logo=html5)](https://rawcdn.githack.com/USER/REPO/main/index.html)

> **Haz clic en el botón de arriba** para jugar directamente en tu navegador (si estás en GitHub, copia la URL de `index.html` y ábrela localmente).

### Opción 1: Servidor Local Recomendado

Para una experiencia óptima (carga correcta de assets):

```bash
# Python 3
python -m http.server 8000

# O con Node.js (si tienes http-server instalado)
npx http-server -p 8000
```

Luego abre tu navegador en: `http://localhost:8000`

### Opción 2: Abrir Directamente

Simplemente abre el archivo `index.html` en tu navegador web moderno.

> ⚠️ **Nota:** Algunos navegadores pueden bloquear la carga de recursos locales por políticas CORS. Se recomienda usar un servidor local.

## 📁 Estructura del Proyecto

```
rogelio-tower-defense/
├── index.html              # Punto de entrada principal
├── css/
│   └── styles.css          # Estilos del juego
├── js/
│   ├── game.js             # Lógica principal del juego
│   ├── menu.js             # Sistema de menús
│   ├── towers.js           # (Si existe) Lógica de torres
│   ├── enemies.js          # (Si existe) Lógica de enemigos
│   ├── effects.js          # Efectos visuales
│   ├── particles.js        # Sistema de partículas
│   └── sprites.js          # Gestión de sprites
├── assets/
│   ├── towers/             # Sprites de torres
│   ├── enemies/            # Sprites de enemigos
│   ├── boss/               # Sprites de jefes
│   ├── tiles/              # Sprites del terreno
│   ├── decorations/        # Elementos decorativos
│   └── effects/            # Efectos especiales
└── README.md               # Este archivo
```

## 🎮 Controles

- **Clic izquierdo:** Colocar torre / Interactuar con el menú
- **Seleccionar torre:** Haz clic en el panel de torres para seleccionar
- **Iniciar oleada:** Botón "Start Wave" cuando estés listo

## 🏆 Cómo Jugar

1. **Coloca torres** estratégicamente en el mapa
2. **Gestiona tu economía** - cada torre tiene un costo
3. **Derrota enemigos** para ganar dinero
4. **Mejora tus defensas** entre oleadas
5. **¡Sobrevive 50 oleadas** y derrota a Rogelio!

## 🛠️ Tecnologías Utilizadas

- **HTML5 Canvas** - Renderizado del juego
- **CSS3** - Estilizado de interfaz
- **JavaScript (ES6+)** - Lógica del juego sin frameworks
- **Sprite Sheets** - Optimización de recursos gráficos

## 📝 Estado del Desarrollo

- ✅ Sistema básico de juego
- ✅ Múltiples tipos de torres
- ✅ Sistema de oleadas
- ✅ Jefes y mini-jefes
- ✅ Efectos de iluminación y partículas
- ✅ Menú principal funcional
- 🔄 Mejoras continuas de rendimiento

## 🤝 Contribuciones

Las contribuciones son bienvenidas. Siéntete libre de:
1. Hacer fork del proyecto
2. Crear una rama (`git checkout -b feature/nueva-caracteristica`)
3. Hacer commit de tus cambios (`git commit -m 'Añadir nueva característica'`)
4. Hacer push a la rama (`git push origin feature/nueva-caracteristica`)
5. Abrir un Pull Request

## 📄 Licencia

Este proyecto es de código abierto y está disponible bajo la licencia MIT.

## 👨‍💻 Autor

Desarrollado como proyecto de demostración de habilidades en desarrollo de juegos web.

---

**¡Diviértete jugando Rogelio Tower Defense!** 🎯🏰