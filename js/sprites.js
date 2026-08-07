// ==========================================
// ROGELIO TOWER DEFENSE - SPRITES.JS
// ==========================================
// Sistema de gestión de sprites y animaciones
// Carga, almacena y reproduce sprites desde la carpeta assets/
// ==========================================

const SpriteManager = {
    // Almacén de imágenes cargadas
    images: {},
    
    // Configuración de animaciones
    animations: {
        // Torres
        archer: { idle: 'frame', attack: 'attack', frames: 8, speed: 100 },
        mage: { idle: 'frame', attack: 'attack', frames: 8, speed: 120 },
        cannon: { idle: 'frame', attack: 'attack', frames: 8, speed: 150 },
        
        // Enemigos
        goblin: { walk: 'walk', attack: 'attack', frames: 8, speed: 100 },
        bandit: { walk: 'walk', attack: 'attack', frames: 8, speed: 90 },
        skeleton: { walk: 'walk', attack: 'attack', frames: 8, speed: 80 },
        dark_knight: { walk: 'walk', attack: 'attack', frames: 8, speed: 70 },
        skeleton_lord: { walk: 'walk', attack: 'attack', frames: 8, speed: 60 },
        
        // Boss Rogelio
        rogelio: { 
            walk: 'walk', 
            attack: 'attack', 
            roar: 'roar',
            frames: 8, 
            speed: 120,
            roarSpeed: 150
        }
    },
    
    // Estado actual de animaciones por entidad
    activeAnimations: {},
    
    // Contadores de frames
    frameCounters: {},
    
    /**
     * Precarga todos los sprites
     */
    preloadAll: function() {
        return Promise.all([
            this.loadTowerSprites(),
            this.loadEnemySprites(),
            this.loadBossSprites(),
            this.loadTileSprites(),
            this.loadDecorationSprites(),
            this.loadEffectSprites()
        ]);
    },
    
    /**
     * Carga sprites de torres
     */
    loadTowerSprites: function() {
        const towerTypes = ['archer', 'mage', 'cannon'];
        const promises = [];
        
        towerTypes.forEach(type => {
            // Frames idle
            for (let i = 0; i < 8; i++) {
                promises.push(this.loadImage(`towers/${type}_frame_${i}`, `assets/towers/${type}_frame_${i}.png`));
            }
            // Frames attack
            for (let i = 0; i < 8; i++) {
                promises.push(this.loadImage(`towers/${type}_attack_${i}`, `assets/towers/${type}_attack_${i}.png`));
            }
        });
        
        return Promise.all(promises);
    },
    
    /**
     * Carga sprites de enemigos
     */
    loadEnemySprites: function() {
        const enemyTypes = ['goblin', 'bandit', 'skeleton', 'dark_knight', 'skeleton_lord'];
        const promises = [];
        
        enemyTypes.forEach(type => {
            // Walking frames
            for (let i = 0; i < 8; i++) {
                promises.push(this.loadImage(`enemies/${type}_walk_${i}`, `assets/enemies/${type}_walk_${i}.png`));
            }
            // Attack frames
            for (let i = 0; i < 8; i++) {
                promises.push(this.loadImage(`enemies/${type}_attack_${i}`, `assets/enemies/${type}_attack_${i}.png`));
            }
        });
        
        return Promise.all(promises);
    },
    
    /**
     * Carga sprites del boss Rogelio
     */
    loadBossSprites: function() {
        const promises = [];
        
        // Walking frames (8)
        for (let i = 0; i < 8; i++) {
            promises.push(this.loadImage(`boss/rogelio_walk_${i}`, `assets/boss/rogelio_walk_${i}.png`));
        }
        
        // Attack frames (8)
        for (let i = 0; i < 8; i++) {
            promises.push(this.loadImage(`boss/rogelio_attack_${i}`, `assets/boss/rogelio_attack_${i}.png`));
        }
        
        // Roar frames (6)
        for (let i = 0; i < 6; i++) {
            promises.push(this.loadImage(`boss/rogelio_roar_${i}`, `assets/boss/rogelio_roar_${i}.png`));
        }
        
        return Promise.all(promises);
    },
    
    /**
     * Carga tiles de terreno
     */
    loadTileSprites: function() {
        const tileTypes = ['grass', 'path', 'water', 'stone'];
        const promises = [];
        
        tileTypes.forEach(type => {
            promises.push(this.loadImage(`tiles/${type}`, `assets/tiles/${type}.png`));
            promises.push(this.loadImage(`tiles/${type}_alt`, `assets/tiles/${type}_alt.png`));
        });
        
        return Promise.all(promises);
    },
    
    /**
     * Carga decoraciones
     */
    loadDecorationSprites: function() {
        const decoTypes = ['tree', 'bush', 'rock', 'flower'];
        const promises = [];
        
        decoTypes.forEach(type => {
            promises.push(this.loadImage(`decorations/${type}`, `assets/decorations/${type}.png`));
            promises.push(this.loadImage(`decorations/${type}_alt`, `assets/decorations/${type}_alt.png`));
        });
        
        return Promise.all(promises);
    },
    
    /**
     * Carga efectos
     */
    loadEffectSprites: function() {
        const effectTypes = ['arrow', 'magic', 'explosion', 'hit', 'dust'];
        const promises = [];
        
        effectTypes.forEach(type => {
            for (let i = 0; i < 4; i++) {
                promises.push(this.loadImage(`effects/${type}_${i}`, `assets/effects/${type}_${i}.png`));
            }
        });
        
        return Promise.all(promises);
    },
    
    /**
     * Carga una imagen individual
     */
    loadImage: function(key, src) {
        return new Promise((resolve, reject) => {
            const img = new Image();
            img.onload = () => {
                this.images[key] = img;
                console.log(`[SPRITES] Cargado: ${key}`);
                resolve(img);
            };
            img.onerror = () => {
                console.warn(`[SPRITES] No se pudo cargar: ${src}`);
                // Crear imagen placeholder
                const placeholder = this.createPlaceholder(key);
                this.images[key] = placeholder;
                resolve(placeholder);
            };
            img.src = src;
        });
    },
    
    /**
     * Crea un placeholder cuando falla la carga
     */
    createPlaceholder: function(key) {
        const canvas = document.createElement('canvas');
        canvas.width = 64;
        canvas.height = 64;
        const ctx = canvas.getContext('2d');
        
        // Color según tipo
        let color = '#888888';
        if (key.includes('archer')) color = '#4CAF50';
        else if (key.includes('mage')) color = '#2196F3';
        else if (key.includes('cannon')) color = '#795548';
        else if (key.includes('goblin')) color = '#8BC34A';
        else if (key.includes('bandit')) color = '#FF5722';
        else if (key.includes('skeleton')) color = '#EEEEEE';
        else if (key.includes('dark_knight')) color = '#3F51B5';
        else if (key.includes('rogelio')) color = '#F44336';
        
        ctx.fillStyle = color;
        ctx.fillRect(0, 0, 64, 64);
        
        return canvas;
    },
    
    /**
     * Obtiene un sprite por clave
     */
    getSprite: function(key) {
        return this.images[key] || null;
    },
    
    /**
     * Inicia una animación para una entidad
     */
    startAnimation: function(entityId, type, animationName) {
        this.activeAnimations[entityId] = {
            type: type,
            name: animationName,
            frame: 0,
            lastUpdate: Date.now()
        };
        this.frameCounters[entityId] = 0;
    },
    
    /**
     * Actualiza y obtiene el frame actual de animación
     */
    updateAndGetFrame: function(entityId, entityType, animationName) {
        const config = this.animations[entityType];
        if (!config) return this.getSprite(`${entityType}_frame_0`) || this.getSprite(`${entityType}_walk_0`);
        
        const animKey = `${entityType}_${animationName}`;
        const totalFrames = config.frames;
        const speed = config.speed || 100;
        
        if (!this.frameCounters[entityId]) {
            this.frameCounters[entityId] = 0;
        }
        
        this.frameCounters[entityId]++;
        
        if (this.frameCounters[entityId] >= speed / 16) {
            this.frameCounters[entityId] = 0;
            this.activeAnimations[entityId] = (this.activeAnimations[entityId] || 0) + 1;
            if (this.activeAnimations[entityId] >= totalFrames) {
                this.activeAnimations[entityId] = 0;
            }
        }
        
        const frame = this.activeAnimations[entityId] || 0;
        const key = `${entityType}/${entityType}_${animationName}_${frame}`;
        
        return this.getSprite(key);
    },
    
    /**
     * Dibuja un sprite en el canvas
     */
    drawSprite: function(ctx, key, x, y, width, height, flipX = false, flipY = false) {
        const sprite = this.getSprite(key);
        if (!sprite) return;
        
        ctx.save();
        
        if (flipX || flipY) {
            ctx.translate(x + width / 2, y + height / 2);
            ctx.scale(flipX ? -1 : 1, flipY ? -1 : 1);
            ctx.drawImage(sprite, -width / 2, -height / 2, width, height);
        } else {
            ctx.drawImage(sprite, x, y, width, height);
        }
        
        ctx.restore();
    },
    
    /**
     * Dibuja con efecto pixel-perfect (nearest-neighbor)
     */
    drawPixelPerfect: function(ctx, key, x, y, scale = 1) {
        const sprite = this.getSprite(key);
        if (!sprite) return;
        
        ctx.imageSmoothingEnabled = false;
        ctx.drawImage(
            sprite, 
            x, 
            y, 
            sprite.width * scale, 
            sprite.height * scale
        );
        ctx.imageSmoothingEnabled = true;
    }
};

// Exportar para uso global
window.SpriteManager = SpriteManager;
