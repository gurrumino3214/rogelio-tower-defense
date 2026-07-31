/**
 * Engine.js - Motor principal del juego Tower Defense
 * 
 * Responsable de:
 * - Loop de juego con requestAnimationFrame
 * - Cálculo de Delta Time
 * - Sistema de cámara
 * - Renderizado pixel perfect
 * - Escalado automático
 * - Sistema de colisiones
 * - Sistema de capas
 * - Sistema de entidades
 */

const Engine = {
    // Configuración base
    config: {
        baseWidth: 800,      // Resolución base horizontal
        baseHeight: 600,     // Resolución base vertical
        pixelScale: 1,       // Escala de píxeles para efecto retro
        maxFPS: 60           // FPS máximos
    },

    // Canvas y contexto
    canvas: null,
    ctx: null,
    
    // Dimensiones
    width: 800,
    height: 600,
    displayWidth: 0,
    displayHeight: 0,
    scale: 1,

    // Tiempo
    lastTime: 0,
    deltaTime: 0,
    accumulator: 0,
    frameCount: 0,
    fps: 0,
    fpsUpdateTime: 0,

    // Cámara
    camera: {
        x: 0,
        y: 0,
        width: 800,
        height: 600,
        zoom: 1
    },

    // Sistema de capas (layers)
    layers: {},
    layerOrder: [],

    // Sistema de entidades
    entities: [],
    entitiesToAdd: [],
    entitiesToRemove: [],

    // Estado del juego
    isRunning: false,
    isPaused: false,

    /**
     * Inicializa el motor
     * Configura canvas, contexto, escalado y eventos
     */
    init() {
        this.canvas = document.getElementById('gameCanvas');
        this.ctx = this.canvas.getContext('2d');
        
        // Configurar renderizado pixel perfect
        this.ctx.imageSmoothingEnabled = false;
        
        // Establecer resolución base
        this.width = this.config.baseWidth;
        this.height = this.config.baseHeight;
        this.canvas.width = this.width;
        this.canvas.height = this.height;

        // Inicializar capas por defecto
        this.createLayer('background', 0);
        this.createLayer('ground', 1);
        this.createLayer('entities', 2);
        this.createLayer('effects', 3);
        this.createLayer('ui', 4);

        // Configurar escalado automático
        this.setupAutoScale();

        // Listeners de redimensionamiento
        window.addEventListener('resize', () => this.setupAutoScale());

        console.log('Engine initialized');
    },

    /**
     * Configura el escalado automático manteniendo aspect ratio
     * y renderizado pixel perfect
     */
    setupAutoScale() {
        const container = document.getElementById('game-container');
        const containerWidth = container.clientWidth;
        const containerHeight = container.clientHeight;

        // Calcular escala manteniendo aspect ratio
        const scaleX = containerWidth / this.width;
        const scaleY = containerHeight / this.height;
        this.scale = Math.min(scaleX, scaleY);

        // Aplicar escala al canvas vía CSS
        this.displayWidth = this.width * this.scale;
        this.displayHeight = this.height * this.scale;
        
        this.canvas.style.width = `${this.displayWidth}px`;
        this.canvas.style.height = `${this.displayHeight}px`;

        // Ajustar cámara al viewport
        this.camera.width = this.width / this.camera.zoom;
        this.camera.height = this.height / this.camera.zoom;
    },

    /**
     * Crea una nueva capa de renderizado
     * @param {string} name - Nombre de la capa
     * @param {number} order - Orden de renderizado (menor = más atrás)
     */
    createLayer(name, order) {
        if (!this.layers[name]) {
            this.layers[name] = [];
            this.layerOrder.push({ name, order });
            this.layerOrder.sort((a, b) => a.order - b.order);
        }
    },

    /**
     * Obtiene una capa por nombre
     * @param {string} name - Nombre de la capa
     * @returns {Array} Array de objetos en la capa
     */
    getLayer(name) {
        return this.layers[name] || [];
    },

    /**
     * Añade un objeto renderizable a una capa
     * @param {string} layerName - Nombre de la capa
     * @param {Object} object - Objeto con método draw()
     */
    addToLayer(layerName, object) {
        if (this.layers[layerName]) {
            this.layers[layerName].push(object);
        }
    },

    /**
     * Elimina un objeto de una capa
     * @param {string} layerName - Nombre de la capa
     * @param {Object} object - Objeto a eliminar
     */
    removeFromLayer(layerName, object) {
        if (this.layers[layerName]) {
            const index = this.layers[layerName].indexOf(object);
            if (index > -1) {
                this.layers[layerName].splice(index, 1);
            }
        }
    },

    /**
     * Clase base para entidades del juego
     */
    Entity: class {
        constructor(x, y, width, height, layer = 'entities') {
            this.x = x;
            this.y = y;
            this.width = width;
            this.height = height;
            this.layer = layer;
            this.active = true;
            this.id = Engine.generateId();
        }

        /**
         * Actualiza la entidad
         * @param {number} dt - Delta time en segundos
         */
        update(dt) {}

        /**
         * Dibuja la entidad
         * @param {CanvasRenderingContext2D} ctx - Contexto del canvas
         */
        draw(ctx) {}

        /**
         * Obtiene los bounds de colisión
         * @returns {Object} Rectángulo de colisión
         */
        getBounds() {
            return {
                x: this.x,
                y: this.y,
                width: this.width,
                height: this.height
            };
        }
    },

    /**
     * Genera un ID único para entidades
     * @returns {string} ID único
     */
    generateId() {
        return 'entity_' + Math.random().toString(36).substr(2, 9);
    },

    /**
     * Añade una entidad al sistema
     * @param {Engine.Entity} entity - Entidad a añadir
     */
    addEntity(entity) {
        this.entitiesToAdd.push(entity);
    },

    /**
     * Marca una entidad para eliminación
     * @param {Engine.Entity} entity - Entidad a eliminar
     */
    removeEntity(entity) {
        this.entitiesToRemove.push(entity);
    },

    /**
     * Procesa la cola de entidades a eliminar
     */
    processEntityRemoval() {
        for (const entity of this.entitiesToRemove) {
            const index = this.entities.indexOf(entity);
            if (index > -1) {
                this.entities.splice(index, 1);
                Engine.removeFromLayer(entity.layer, entity);
            }
        }
        this.entitiesToRemove = [];
    },

    /**
     * Procesa la cola de entidades a añadir
     */
    processEntityAddition() {
        for (const entity of this.entitiesToAdd) {
            this.entities.push(entity);
            Engine.addToLayer(entity.layer, entity);
        }
        this.entitiesToAdd = [];
    },

    /**
     * Calcula el delta time desde el último frame
     * @param {number} currentTime - Tiempo actual en milisegundos
     * @returns {number} Delta time en segundos
     */
    calculateDeltaTime(currentTime) {
        if (this.lastTime === 0) {
            this.lastTime = currentTime;
            return 0;
        }

        this.deltaTime = (currentTime - this.lastTime) / 1000;
        this.lastTime = currentTime;

        // Limitar delta time máximo (evita saltos grandes)
        if (this.deltaTime > 0.1) {
            this.deltaTime = 0.1;
        }

        // Calcular FPS
        this.frameCount++;
        if (currentTime - this.fpsUpdateTime >= 1000) {
            this.fps = this.frameCount;
            this.frameCount = 0;
            this.fpsUpdateTime = currentTime;
        }

        return this.deltaTime;
    },

    /**
     * Limpia el canvas completo
     */
    clear() {
        this.ctx.clearRect(0, 0, this.width, this.height);
    },

    /**
     * Aplica la transformación de cámara al contexto
     */
    applyCamera() {
        this.ctx.save();
        this.ctx.translate(-this.camera.x, -this.camera.y);
        this.ctx.scale(this.camera.zoom, this.camera.zoom);
    },

    /**
     * Restaura el contexto después de aplicar cámara
     */
    restoreCamera() {
        this.ctx.restore();
    },

    /**
     * Convierte coordenadas de pantalla a coordenadas del mundo
     * @param {number} screenX - X en pantalla
     * @param {number} screenY - Y en pantalla
     * @returns {Object} Coordenadas del mundo
     */
    screenToWorld(screenX, screenY) {
        const rect = this.canvas.getBoundingClientRect();
        const scaleX = this.width / rect.width;
        const scaleY = this.height / rect.height;

        return {
            x: (screenX - rect.left) * scaleX / this.camera.zoom + this.camera.x,
            y: (screenY - rect.top) * scaleY / this.camera.zoom + this.camera.y
        };
    },

    /**
     * Convierte coordenadas del mundo a coordenadas de pantalla
     * @param {number} worldX - X en el mundo
     * @param {number} worldY - Y en el mundo
     * @returns {Object} Coordenadas de pantalla
     */
    worldToScreen(worldX, worldY) {
        const rect = this.canvas.getBoundingClientRect();
        const scaleX = rect.width / this.width;
        const scaleY = rect.height / this.height;

        return {
            x: ((worldX - this.camera.x) * this.camera.zoom) * scaleX + rect.left,
            y: ((worldY - this.camera.y) * this.camera.zoom) * scaleY + rect.top
        };
    },

    /**
     * Verifica si un punto está dentro de un rectángulo
     * @param {number} px - X del punto
     * @param {number} py - Y del punto
     * @param {Object} rect - Rectángulo {x, y, width, height}
     * @returns {boolean}
     */
    pointInRect(px, py, rect) {
        return px >= rect.x && px <= rect.x + rect.width &&
               py >= rect.y && py <= rect.y + rect.height;
    },

    /**
     * Sistema de colisiones AABB (Axis-Aligned Bounding Box)
     * @param {Object} rect1 - Primer rectángulo {x, y, width, height}
     * @param {Object} rect2 - Segundo rectángulo {x, y, width, height}
     * @returns {boolean} True si hay colisión
     */
    checkCollision(rect1, rect2) {
        return rect1.x < rect2.x + rect2.width &&
               rect1.x + rect1.width > rect2.x &&
               rect1.y < rect2.y + rect2.height &&
               rect1.y + rect1.height > rect2.y;
    },

    /**
     * Colisión círculo-círculo
     * @param {Object} circle1 - Primer círculo {x, y, radius}
     * @param {Object} circle2 - Segundo círculo {x, y, radius}
     * @returns {boolean} True si hay colisión
     */
    checkCircleCollision(circle1, circle2) {
        const dx = circle1.x - circle2.x;
        const dy = circle1.y - circle2.y;
        const distance = Math.sqrt(dx * dx + dy * dy);
        return distance < circle1.radius + circle2.radius;
    },

    /**
     * Colisión círculo-rectángulo
     * @param {Object} circle - Círculo {x, y, radius}
     * @param {Object} rect - Rectángulo {x, y, width, height}
     * @returns {boolean} True si hay colisión
     */
    checkCircleRectCollision(circle, rect) {
        // Encontrar el punto más cercano en el rectángulo al centro del círculo
        const closestX = Math.max(rect.x, Math.min(circle.x, rect.x + rect.width));
        const closestY = Math.max(rect.y, Math.min(circle.y, rect.y + rect.height));

        const dx = circle.x - closestX;
        const dy = circle.y - closestY;

        return (dx * dx + dy * dy) < (circle.radius * circle.radius);
    },

    /**
     * Dibuja un rectángulo
     * @param {number} x - Posición X
     * @param {number} y - Posición Y
     * @param {number} width - Ancho
     * @param {number} height - Alto
     * @param {string} color - Color de relleno
     */
    drawRect(x, y, width, height, color) {
        this.ctx.fillStyle = color;
        this.ctx.fillRect(x, y, width, height);
    },

    /**
     * Dibuja un rectángulo con borde
     * @param {number} x - Posición X
     * @param {number} y - Posición Y
     * @param {number} width - Ancho
     * @param {number} height - Alto
     * @param {string} fillColor - Color de relleno
     * @param {string} strokeColor - Color del borde
     * @param {number} strokeWidth - Grosor del borde
     */
    drawRectStroke(x, y, width, height, fillColor, strokeColor, strokeWidth = 1) {
        this.ctx.fillStyle = fillColor;
        this.ctx.fillRect(x, y, width, height);
        this.ctx.strokeStyle = strokeColor;
        this.ctx.lineWidth = strokeWidth;
        this.ctx.strokeRect(x, y, width, height);
    },

    /**
     * Dibuja un círculo
     * @param {number} x - Posición X
     * @param {number} y - Posición Y
     * @param {number} radius - Radio
     * @param {string} color - Color de relleno
     */
    drawCircle(x, y, radius, color) {
        this.ctx.beginPath();
        this.ctx.arc(x, y, radius, 0, Math.PI * 2);
        this.ctx.fillStyle = color;
        this.ctx.fill();
    },

    /**
     * Dibuja un círculo con borde
     * @param {number} x - Posición X
     * @param {number} y - Posición Y
     * @param {number} radius - Radio
     * @param {string} fillColor - Color de relleno
     * @param {string} strokeColor - Color del borde
     * @param {number} strokeWidth - Grosor del borde
     */
    drawCircleStroke(x, y, radius, fillColor, strokeColor, strokeWidth = 1) {
        this.ctx.beginPath();
        this.ctx.arc(x, y, radius, 0, Math.PI * 2);
        this.ctx.fillStyle = fillColor;
        this.ctx.fill();
        this.ctx.strokeStyle = strokeColor;
        this.ctx.lineWidth = strokeWidth;
        this.ctx.stroke();
    },

    /**
     * Dibuja una línea
     * @param {number} x1 - X inicial
     * @param {number} y1 - Y inicial
     * @param {number} x2 - X final
     * @param {number} y2 - Y final
     * @param {string} color - Color de la línea
     * @param {number} width - Grosor de la línea
     */
    drawLine(x1, y1, x2, y2, color, width = 1) {
        this.ctx.beginPath();
        this.ctx.moveTo(x1, y1);
        this.ctx.lineTo(x2, y2);
        this.ctx.strokeStyle = color;
        this.ctx.lineWidth = width;
        this.ctx.stroke();
    },

    /**
     * Dibuja texto
     * @param {string} text - Texto a dibujar
     * @param {number} x - Posición X
     * @param {number} y - Posición Y
     * @param {string} color - Color del texto
     * @param {string} font - Fuente (ej: "16px Arial")
     * @param {string} align - Alineación ("left", "center", "right")
     */
    drawText(text, x, y, color, font = "16px Arial", align = "left") {
        this.ctx.fillStyle = color;
        this.ctx.font = font;
        this.ctx.textAlign = align;
        this.ctx.fillText(text, x, y);
    },

    /**
     * Renderiza todas las capas en orden
     */
    renderLayers() {
        for (const layerInfo of this.layerOrder) {
            const layer = this.layers[layerInfo.name];
            if (layer) {
                for (const object of layer) {
                    if (object.draw && object.active !== false) {
                        object.draw(this.ctx);
                    }
                }
            }
        }
    },

    /**
     * Actualiza todas las entidades
     * @param {number} dt - Delta time
     */
    updateEntities(dt) {
        for (const entity of this.entities) {
            if (entity.active && entity.update) {
                entity.update(dt);
            }
        }
    },

    /**
     * Inicia el loop principal del juego
     */
    start() {
        this.isRunning = true;
        this.lastTime = 0;
        this.fpsUpdateTime = performance.now();
        requestAnimationFrame((time) => this.gameLoop(time));
    },

    /**
     * Detiene el loop del juego
     */
    stop() {
        this.isRunning = false;
    },

    /**
     * Pausa o reanuda el juego
     * @param {boolean} paused - Estado de pausa
     */
    setPaused(paused) {
        this.isPaused = paused;
        if (!paused) {
            this.lastTime = performance.now();
        }
    },

    /**
     * Loop principal del juego
     * @param {number} currentTime - Tiempo actual en milisegundos
     */
    gameLoop(currentTime) {
        if (!this.isRunning) return;

        requestAnimationFrame((time) => this.gameLoop(time));

        // Si está pausado, solo actualizar tiempo
        if (this.isPaused) {
            this.lastTime = currentTime;
            return;
        }

        // Calcular delta time
        const dt = this.calculateDeltaTime(currentTime);

        // Limpiar canvas
        this.clear();

        // Aplicar cámara
        this.applyCamera();

        // Actualizar entidades
        this.updateEntities(dt);

        // Procesar colas de entidades
        this.processEntityAddition();
        this.processEntityRemoval();

        // Renderizar capas
        this.renderLayers();

        // Restaurar contexto (para UI que no usa cámara)
        this.restoreCamera();

        // Renderizar capa UI (sin cámara)
        if (this.layers['ui']) {
            for (const object of this.layers['ui']) {
                if (object.draw && object.active !== false) {
                    object.draw(this.ctx);
                }
            }
        }
    }
};
