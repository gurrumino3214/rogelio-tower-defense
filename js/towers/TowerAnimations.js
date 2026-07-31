/**
 * ========================================
 * TOWER_ANIMATIONS.JS - Sistema de Animaciones Pixel Art
 * ========================================
 * Gestiona las animaciones específicas para cada tipo de torre:
 * - Idle (respiración)
 * - Disparo (recoil, muzzle flash)
 * - Mejora (efecto de nivel up)
 * - Venta (efecto de desaparición)
 * 
 * Cada animación usa spritesheets o dibujado procedural pixel art.
 */

const TowerAnimations = {
    /** @type {Object} Spritesheets cargados */
    spritesheets: {},

    /** @type {number} Tamaño de celda del sprite sheet */
    cellSize: 32,

    /**
     * Inicializa el sistema de animaciones
     */
    init: function() {
        this.spritesheets = {};
        console.log('TowerAnimations initialized');
    },

    /**
     * Carga un spritesheet para un tipo de torre
     * @param {string} towerTypeId - ID del tipo de torre
     * @param {string} imagePath - Ruta a la imagen del spritesheet
     * @param {Object} config - Configuración de frames
     */
    loadSpritesheet: function(towerTypeId, imagePath, config) {
        return new Promise((resolve, reject) => {
            const img = new Image();
            img.src = imagePath;
            
            img.onload = () => {
                this.spritesheets[towerTypeId] = {
                    image: img,
                    config: config,
                    loaded: true
                };
                console.log(`Loaded spritesheet for ${towerTypeId}`);
                resolve(this.spritesheets[towerTypeId]);
            };
            
            img.onerror = () => {
                console.error(`Failed to load spritesheet for ${towerTypeId}`);
                reject(new Error('Failed to load image'));
            };
        });
    },

    /**
     * Obtiene el frame actual para una animación
     * @param {string} towerTypeId - ID del tipo de torre
     * @param {string} animationName - Nombre de la animación
     * @param {number} timer - Tiempo acumulado
     * @returns {Object} Información del frame
     */
    getFrame: function(towerTypeId, animationName, timer) {
        const spritesheet = this.spritesheets[towerTypeId];
        
        if (!spritesheet || !spritesheet.config[animationName]) {
            // Si no hay spritesheet, usar animación procedural
            return this.getProceduralFrame(animationName, timer);
        }

        const animConfig = spritesheet.config[animationName];
        const fps = animConfig.fps || 12;
        const frameCount = animConfig.frames || 1;
        const loop = animConfig.loop !== false;

        let frameIndex = Math.floor(timer * fps) % frameCount;
        
        if (frameIndex < 0) {
            frameIndex = loop ? frameCount - 1 : 0;
        }

        return {
            index: frameIndex,
            x: animConfig.startX + frameIndex * this.cellSize,
            y: animConfig.startY || 0,
            width: this.cellSize,
            height: this.cellSize
        };
    },

    /**
     * Obtiene un frame procedural (sin spritesheet)
     * @param {string} animationName - Nombre de la animación
     * @param {number} timer - Tiempo acumulado
     * @returns {Object} Parámetros de animación
     */
    getProceduralFrame: function(animationName, timer) {
        switch (animationName) {
            case 'idle':
                return {
                    scale: 1 + Math.sin(timer * 2) * 0.05,
                    rotation: 0,
                    offset: 0
                };
            
            case 'shoot':
                const shootProgress = (timer % 0.2) / 0.2;
                return {
                    recoil: shootProgress < 0.3 ? -4 * (1 - shootProgress / 0.3) : 0,
                    muzzleFlash: shootProgress < 0.2 ? 1 - shootProgress / 0.2 : 0
                };
            
            case 'upgrade':
                const upgradeTimer = timer % 1;
                return {
                    scale: 1 + Math.sin(upgradeTimer * Math.PI) * 0.3,
                    glow: Math.sin(upgradeTimer * Math.PI),
                    particles: Math.floor(upgradeTimer * 10) % 3
                };
            
            case 'sell':
                const sellTimer = timer % 0.5;
                return {
                    alpha: 1 - sellTimer / 0.5,
                    scale: 1 + sellTimer * 0.5,
                    rotation: sellTimer * Math.PI * 2
                };
            
            default:
                return {};
        }
    },

    /**
     * Dibuja una torre con animación procedural
     * @param {CanvasRenderingContext2D} ctx 
     * @param {Tower} tower - Torre a dibujar
     * @param {number} deltaTime - Tiempo delta
     */
    drawProcedural: function(ctx, tower, deltaTime) {
        const animState = tower.animationState || {
            idleTimer: 0,
            shootTimer: 0,
            upgradeTimer: 0,
            state: 'idle'
        };

        // Actualizar timers
        animState.idleTimer += deltaTime;
        
        if (animState.state === 'shoot') {
            animState.shootTimer += deltaTime;
            if (animState.shootTimer > 0.2) {
                animState.state = 'idle';
                animState.shootTimer = 0;
            }
        } else if (animState.state === 'upgrade') {
            animState.upgradeTimer += deltaTime;
            if (animState.upgradeTimer > 1) {
                animState.state = 'idle';
                animState.upgradeTimer = 0;
            }
        }

        tower.animationState = animState;

        // Obtener frames
        const idleFrame = this.getProceduralFrame('idle', animState.idleTimer);
        const shootFrame = this.getProceduralFrame('shoot', animState.shootTimer);
        const upgradeFrame = this.getProceduralFrame('upgrade', animState.upgradeTimer);

        ctx.save();
        ctx.translate(tower.x, tower.y);

        // Aplicar transformaciones
        let scale = idleFrame.scale || 1;
        if (upgradeFrame.scale) {
            scale *= upgradeFrame.scale;
        }
        ctx.scale(scale, scale);

        // Rotación hacia el objetivo
        ctx.rotate(tower.rotation);

        // Aplicar recoil si está disparando
        if (shootFrame.recoil) {
            ctx.translate(shootFrame.recoil, 0);
        }

        // Dibujar torre base
        this.drawPixelTower(ctx, tower);

        // Dibujar muzzle flash
        if (shootFrame.muzzleFlash > 0) {
            this.drawMuzzleFlash(ctx, shootFrame.muzzleFlash);
        }

        // Dibujar efecto de upgrade
        if (animState.state === 'upgrade' && upgradeFrame.glow > 0) {
            this.drawUpgradeGlow(ctx, upgradeFrame.glow, upgradeFrame.particles);
        }

        ctx.restore();
    },

    /**
     * Dibuja una torre estilo pixel art
     * @param {CanvasRenderingContext2D} ctx 
     * @param {Tower} tower - Torre
     */
    drawPixelTower: function(ctx, tower) {
        const visual = tower.typeConfig.visual;
        const w = tower.width;
        const h = tower.height;

        // Sombra
        ctx.fillStyle = 'rgba(0, 0, 0, 0.3)';
        ctx.fillRect(-w/2 + 4, -h/2 + 4, w, h);

        // Base
        this.drawPixelBase(ctx, w, h, visual.secondaryColor);

        // Cuerpo
        this.drawPixelBody(ctx, w, h, visual.color);

        // Cañón
        ctx.rotate(tower.rotation);
        this.drawPixelBarrel(ctx, w, h, visual.secondaryColor);
    },

    /**
     * Dibuja base pixelada
     * @param {CanvasRenderingContext2D} ctx 
     * @param {number} w - Ancho
     * @param {number} h - Alto
     * @param {string} color - Color
     */
    drawPixelBase: function(ctx, w, h, color) {
        const pixelSize = 4;
        ctx.fillStyle = color;
        
        for (let px = -w/2; px < w/2; px += pixelSize) {
            for (let py = -h/2; py < h/2; py += pixelSize) {
                const isEdge = px < -w/2 + pixelSize || px > w/2 - pixelSize * 2 ||
                              py < -h/2 + pixelSize || py > h/2 - pixelSize * 2;
                
                if (isEdge) {
                    ctx.globalAlpha = 0.8;
                }
                ctx.fillRect(px, py, pixelSize - 1, pixelSize - 1);
                ctx.globalAlpha = 1;
            }
        }
    },

    /**
     * Dibuja cuerpo pixelado
     * @param {CanvasRenderingContext2D} ctx 
     * @param {number} w - Ancho
     * @param {number} h - Alto
     * @param {string} color - Color
     */
    drawPixelBody: function(ctx, w, h, color) {
        const pixelSize = 4;
        ctx.fillStyle = color;
        
        const bodyW = w * 0.6;
        const bodyH = h * 0.6;
        
        for (let px = -bodyW/2; px < bodyW/2; px += pixelSize) {
            for (let py = -bodyH/2; py < bodyH/2; py += pixelSize) {
                const shade = ((px + py) % (pixelSize * 2)) / (pixelSize * 2);
                ctx.globalAlpha = 0.7 + shade * 0.3;
                ctx.fillRect(px, py, pixelSize - 1, pixelSize - 1);
            }
        }
        ctx.globalAlpha = 1;
    },

    /**
     * Dibuja cañón pixelado
     * @param {CanvasRenderingContext2D} ctx 
     * @param {number} w - Ancho
     * @param {number} h - Alto
     * @param {string} color - Color
     */
    drawPixelBarrel: function(ctx, w, h, color) {
        const pixelSize = 3;
        ctx.fillStyle = color;
        
        const barrelLength = w * 0.4;
        const barrelHeight = 8;
        
        for (let px = 0; px < barrelLength; px += pixelSize) {
            for (let py = -barrelHeight/2; py < barrelHeight/2; py += pixelSize) {
                ctx.fillRect(px, py, pixelSize - 1, pixelSize - 1);
            }
        }
    },

    /**
     * Dibuja muzzle flash
     * @param {CanvasRenderingContext2D} ctx 
     * @param {number} intensity - Intensidad (0-1)
     */
    drawMuzzleFlash: function(ctx, intensity) {
        const flashSize = 12 * intensity;
        
        ctx.fillStyle = `rgba(255, 255, 200, ${intensity})`;
        ctx.beginPath();
        
        const points = 8;
        for (let i = 0; i < points * 2; i++) {
            const radius = i % 2 === 0 ? flashSize : flashSize * 0.5;
            const angle = (Math.PI * i) / points;
            const x = Math.cos(angle) * 20;
            const y = Math.sin(angle) * radius;
            
            if (i === 0) {
                ctx.moveTo(x, y);
            } else {
                ctx.lineTo(x, y);
            }
        }
        ctx.closePath();
        ctx.fill();
    },

    /**
     * Dibuja efecto de upgrade
     * @param {CanvasRenderingContext2D} ctx 
     * @param {number} intensity - Intensidad del glow
     * @param {number} particleCount - Número de partículas
     */
    drawUpgradeGlow: function(ctx, intensity, particleCount) {
        const radius = 30;
        
        // Glow circular
        const gradient = ctx.createRadialGradient(0, 0, 10, 0, 0, radius);
        gradient.addColorStop(0, `rgba(255, 215, 0, ${intensity * 0.5})`);
        gradient.addColorStop(1, 'rgba(255, 215, 0, 0)');
        
        ctx.fillStyle = gradient;
        ctx.beginPath();
        ctx.arc(0, 0, radius, 0, Math.PI * 2);
        ctx.fill();

        // Partículas
        ctx.fillStyle = '#ffd700';
        for (let i = 0; i < particleCount; i++) {
            const angle = (i / particleCount) * Math.PI * 2;
            const dist = 20 + Math.random() * 15;
            const px = Math.cos(angle) * dist;
            const py = Math.sin(angle) * dist;
            
            ctx.fillRect(px - 2, py - 2, 4, 4);
        }
    },

    /**
     * Reproduce una animación en una torre
     * @param {Tower} tower - Torre
     * @param {string} animationName - Nombre de la animación
     */
    playAnimation: function(tower, animationName) {
        if (!tower.animationState) {
            tower.animationState = {
                idleTimer: 0,
                shootTimer: 0,
                upgradeTimer: 0,
                state: 'idle'
            };
        }

        tower.animationState.state = animationName;
        tower.animationState[`${animationName}Timer`] = 0;
    }
};

// Exportar para uso en otros módulos
if (typeof module !== 'undefined' && module.exports) {
    module.exports = TowerAnimations;
}
