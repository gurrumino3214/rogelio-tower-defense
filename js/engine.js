/**
 * Engine.js - Motor principal del juego
 */
const Engine = {
    config: {
        baseWidth: 800,
        baseHeight: 600,
        maxFPS: 60
    },

    canvas: null,
    ctx: null,
    width: 800,
    height: 600,
    scale: 1,
    lastTime: 0,
    deltaTime: 0,
    fps: 0,
    frameCount: 0,
    fpsUpdateTime: 0,
    camera: { x: 0, y: 0, zoom: 1 },
    entities: [],
    entitiesToAdd: [],
    entitiesToRemove: [],
    isRunning: false,
    isPaused: false,
    layers: {},

    init() {
        this.canvas = document.getElementById('gameCanvas');
        this.ctx = this.canvas.getContext('2d');
        this.ctx.imageSmoothingEnabled = false;
        this.width = this.config.baseWidth;
        this.height = this.config.baseHeight;
        this.canvas.width = this.width;
        this.canvas.height = this.height;

        // Inicializar capas
        this.layers.background = [];
        this.layers.ground = [];
        this.layers.entities = [];
        this.layers.effects = [];
        this.layers.ui = [];

        this.setupAutoScale();
        window.addEventListener('resize', () => this.setupAutoScale());
        console.log('Engine initialized');
    },

    setupAutoScale() {
        const container = document.getElementById('game-container');
        const scaleX = container.clientWidth / this.width;
        const scaleY = container.clientHeight / this.height;
        this.scale = Math.min(scaleX, scaleY);
        this.canvas.style.width = (this.width * this.scale) + 'px';
        this.canvas.style.height = (this.height * this.scale) + 'px';
    },

    addEntity(entity) {
        this.entitiesToAdd.push(entity);
    },

    removeEntity(entity) {
        this.entitiesToRemove.push(entity);
    },

    processEntityRemoval() {
        for (const entity of this.entitiesToRemove) {
            const index = this.entities.indexOf(entity);
            if (index > -1) this.entities.splice(index, 1);
        }
        this.entitiesToRemove = [];
    },

    processEntityAddition() {
        for (const entity of this.entitiesToAdd) {
            this.entities.push(entity);
        }
        this.entitiesToAdd = [];
    },

    calculateDeltaTime(currentTime) {
        if (this.lastTime === 0) {
            this.lastTime = currentTime;
            return 0;
        }
        this.deltaTime = (currentTime - this.lastTime) / 1000;
        this.lastTime = currentTime;
        if (this.deltaTime > 0.1) this.deltaTime = 0.1;

        this.frameCount++;
        if (currentTime - this.fpsUpdateTime >= 1000) {
            this.fps = this.frameCount;
            this.frameCount = 0;
            this.fpsUpdateTime = currentTime;
        }
        return this.deltaTime;
    },

    clear() {
        this.ctx.clearRect(0, 0, this.width, this.height);
    },

    drawRect(x, y, w, h, color) {
        this.ctx.fillStyle = color;
        this.ctx.fillRect(x, y, w, h);
    },

    drawCircle(x, y, r, color) {
        this.ctx.beginPath();
        this.ctx.arc(x, y, r, 0, Math.PI * 2);
        this.ctx.fillStyle = color;
        this.ctx.fill();
    },

    drawText(text, x, y, color, font = "16px Arial", align = "left") {
        this.ctx.fillStyle = color;
        this.ctx.font = font;
        this.ctx.textAlign = align;
        this.ctx.fillText(text, x, y);
    },

    pause() {
        this.isPaused = true;
    },

    resume() {
        this.isPaused = false;
        this.lastTime = performance.now();
    },

    start() {
        this.isRunning = true;
        this.lastTime = 0;
        this.fpsUpdateTime = performance.now();
        requestAnimationFrame((time) => this.gameLoop(time));
    },

    gameLoop(currentTime) {
        if (!this.isRunning) return;
        requestAnimationFrame((time) => this.gameLoop(time));

        if (this.isPaused) {
            this.lastTime = currentTime;
            return;
        }

        const dt = this.calculateDeltaTime(currentTime);
        this.update(dt);
        this.render();
    },

    update(dt) {
        this.processEntityAddition();
        for (const entity of this.entities) {
            if (entity.active && entity.update) entity.update(dt);
        }
        this.processEntityRemoval();
        
        // Actualizar UI si existe
        if (typeof UI !== 'undefined' && UI.manager) {
            UI.manager.update(dt);
        }
    },

    render() {
        this.clear();
        
        // Renderizar fondo
        this.drawRect(0, 0, this.width, this.height, '#1a1a2e');
        
        // Renderizar camino
        this.drawRect(100, 250, 600, 100, '#3a3a4e');
        
        // Renderizar entidades
        for (const entity of this.entities) {
            if (entity.active && entity.draw) entity.draw(this.ctx);
        }
        
        // Renderizar UI
        if (typeof UI !== 'undefined' && UI.manager) {
            UI.manager.render();
        }
    }
};
