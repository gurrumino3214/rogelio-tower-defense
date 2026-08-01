/**
 * Sistema de Partículas Profesional para Pixel Art
 * Optimizado para miles de partículas con pooling y batch rendering
 */

class Particle {
    constructor() {
        this.reset();
        this.active = false;
    }

    reset() {
        this.x = 0;
        this.y = 0;
        this.vx = 0;
        this.vy = 0;
        this.ax = 0;
        this.ay = 0;
        this.life = 0;
        this.maxLife = 1;
        this.size = 1;
        this.startSize = 1;
        this.endSize = 0;
        this.color = { r: 255, g: 255, b: 255, a: 1 };
        this.startColor = { r: 255, g: 255, b: 255, a: 1 };
        this.endColor = { r: 255, g: 255, b: 255, a: 0 };
        this.rotation = 0;
        this.rotationSpeed = 0;
        this.gravity = 0;
        this.friction = 1;
        this.type = 'default';
        this.pixelArt = true;
        this.blendMode = 'source-over';
        this.useSprite = false;
        this.sprite = null;
        this.frame = 0;
        this.totalFrames = 1;
        this.frameDuration = 1;
        this.currentFrameTime = 0;
        this.oscillation = { x: 0, y: 0, speed: 0, amplitude: 0 };
        this.collision = false;
        this.bounce = 0;
        this.active = false;
    }

    update(dt) {
        if (!this.active) return;

        this.life -= dt;
        if (this.life <= 0) {
            this.active = false;
            return;
        }

        const lifeRatio = 1 - (this.life / this.maxLife);

        // Oscilación
        if (this.oscillation.amplitude > 0) {
            this.x += Math.sin(this.life * this.oscillation.speed) * this.oscillation.amplitude * dt * 60;
            this.y += Math.cos(this.life * this.oscillation.speed) * this.oscillation.amplitude * dt * 60;
        }

        // Física
        this.vx += this.ax * dt;
        this.vy += this.ay * dt + this.gravity * dt;
        this.vx *= this.friction;
        this.vy *= this.friction;

        this.x += this.vx * dt * 60;
        this.y += this.vy * dt * 60;

        // Rotación
        this.rotation += this.rotationSpeed * dt;

        // Animación de sprite
        if (this.useSprite && this.totalFrames > 1) {
            this.currentFrameTime += dt;
            if (this.currentFrameTime >= this.frameDuration / this.totalFrames) {
                this.currentFrameTime = 0;
                this.frame = (this.frame + 1) % this.totalFrames;
            }
        }

        // Interpolación de tamaño
        this.size = this.startSize + (this.endSize - this.startSize) * lifeRatio;

        // Interpolación de color
        this.color.r = this.startColor.r + (this.endColor.r - this.startColor.r) * lifeRatio;
        this.color.g = this.startColor.g + (this.endColor.g - this.startColor.g) * lifeRatio;
        this.color.b = this.startColor.b + (this.endColor.b - this.startColor.b) * lifeRatio;
        this.color.a = this.startColor.a + (this.endColor.a - this.startColor.a) * lifeRatio;

        // Colisión simple con suelo
        if (this.collision && this.y >= window.innerHeight - 10) {
            this.y = window.innerHeight - 10;
            this.vy *= -this.bounce;
            if (Math.abs(this.vy) < 10) this.vy = 0;
        }
    }

    draw(ctx, cameraX = 0, cameraY = 0) {
        if (!this.active || this.size <= 0) return;

        ctx.save();
        ctx.globalAlpha = this.color.a;
        ctx.globalCompositeOperation = this.blendMode;

        const screenX = this.x - cameraX;
        const screenY = this.y - cameraY;

        if (this.useSprite && this.sprite) {
            // Dibujar sprite
            const frameWidth = this.sprite.width / this.totalFrames;
            ctx.translate(screenX, screenY);
            ctx.rotate(this.rotation);
            ctx.drawImage(
                this.sprite,
                this.frame * frameWidth, 0, frameWidth, this.sprite.height,
                -this.size * this.sprite.width / 2,
                -this.size * this.sprite.height / 2,
                this.size * this.sprite.width,
                this.size * this.sprite.height
            );
        } else if (this.pixelArt) {
            // Renderizado pixel art optimizado
            ctx.imageSmoothingEnabled = false;
            const size = Math.max(1, Math.floor(this.size));
            
            const r = Math.floor(this.color.r);
            const g = Math.floor(this.color.g);
            const b = Math.floor(this.color.b);
            
            ctx.fillStyle = `rgb(${r},${g},${b})`;
            ctx.fillRect(
                Math.floor(screenX - size / 2),
                Math.floor(screenY - size / 2),
                size,
                size
            );
        } else {
            // Renderizado suave
            ctx.translate(screenX, screenY);
            ctx.rotate(this.rotation);
            ctx.fillStyle = `rgba(${this.color.r},${this.color.g},${this.color.b},${this.color.a})`;
            ctx.beginPath();
            ctx.arc(0, 0, this.size, 0, Math.PI * 2);
            ctx.fill();
        }

        ctx.restore();
    }
}

class ParticlePool {
    constructor(initialSize = 1000, maxSize = 10000) {
        this.pool = [];
        this.activeParticles = [];
        this.maxSize = maxSize;
        
        for (let i = 0; i < initialSize; i++) {
            this.pool.push(new Particle());
        }
    }

    get() {
        let particle;
        
        if (this.pool.length > 0) {
            particle = this.pool.pop();
        } else if (this.activeParticles.length < this.maxSize) {
            particle = new Particle();
        } else {
            // Reutilizar la partícula más antigua si estamos en el límite
            particle = this.activeParticles.shift();
        }

        if (particle) {
            particle.reset();
            particle.active = true;
            this.activeParticles.push(particle);
        }

        return particle;
    }

    release(particle) {
        const index = this.activeParticles.indexOf(particle);
        if (index !== -1) {
            this.activeParticles.splice(index, 1);
            particle.active = false;
            
            if (this.pool.length < this.maxSize) {
                this.pool.push(particle);
            }
        }
    }

    update(dt) {
        for (let i = this.activeParticles.length - 1; i >= 0; i--) {
            const particle = this.activeParticles[i];
            particle.update(dt);
            
            if (!particle.active) {
                this.release(particle);
            }
        }
    }

    draw(ctx, cameraX = 0, cameraY = 0) {
        // Agrupar por blend mode para minimizar cambios de estado
        const batches = {};
        
        for (const particle of this.activeParticles) {
            if (!particle.active || particle.size <= 0) continue;
            
            const key = particle.blendMode;
            if (!batches[key]) batches[key] = [];
            batches[key].push(particle);
        }

        for (const [blendMode, particles] of Object.entries(batches)) {
            ctx.globalCompositeOperation = blendMode;
            for (const particle of particles) {
                particle.draw(ctx, cameraX, cameraY);
            }
        }
    }

    clear() {
        while (this.activeParticles.length > 0) {
            const particle = this.activeParticles.pop();
            particle.active = false;
            this.pool.push(particle);
        }
    }

    getActiveCount() {
        return this.activeParticles.length;
    }

    getTotalCount() {
        return this.activeParticles.length + this.pool.length;
    }
}

class ParticleSystem {
    constructor(canvas) {
        this.canvas = canvas;
        this.ctx = canvas.getContext('2d');
        this.pool = new ParticlePool(2000, 20000);
        this.emitters = [];
        this.presets = this.createPresets();
        this.timeScale = 1;
        this.globalGravity = { x: 0, y: 0 };
    }

    createPresets() {
        return {
            sparks: {
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
                blendMode: 'lighter',
                pixelArt: true
            },
            ashes: {
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
                gravity: -30,
                friction: 0.9,
                blendMode: 'source-over',
                pixelArt: true,
                oscillation: { amplitude: 0.5, speed: 2 }
            },
            dust: {
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
                gravity: -10,
                friction: 0.95,
                blendMode: 'screen',
                pixelArt: true,
                oscillation: { amplitude: 1, speed: 1 }
            },
            blood: {
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
                friction: 0.8,
                blendMode: 'source-over',
                pixelArt: true,
                collision: true,
                bounce: 0.3
            },
            smoke: {
                type: 'smoke',
                count: 20,
                spread: 360,
                speed: { min: 20, max: 60 },
                size: { start: 5, end: 20 },
                life: { min: 1, max: 3 },
                color: {
                    start: { r: 100, g: 100, b: 100, a: 0.6 },
                    end: { r: 50, g: 50, b: 50, a: 0 }
                },
                gravity: -50,
                friction: 0.95,
                blendMode: 'screen',
                pixelArt: false,
                oscillation: { amplitude: 2, speed: 1.5 }
            },
            fire: {
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
                gravity: -100,
                friction: 0.9,
                blendMode: 'lighter',
                pixelArt: true
            },
            magic: {
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
                gravity: 50,
                friction: 0.95,
                blendMode: 'lighter',
                pixelArt: false,
                rotation: { min: -5, max: 5 },
                oscillation: { amplitude: 1, speed: 3 }
            },
            shadows: {
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
                gravity: 20,
                friction: 0.9,
                blendMode: 'multiply',
                pixelArt: false,
                oscillation: { amplitude: 0.5, speed: 2 }
            },
            light: {
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
                friction: 0.95,
                blendMode: 'screen',
                pixelArt: false
            },
            explosion: {
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
                blendMode: 'lighter',
                pixelArt: true
            }
        };
    }

    emit(x, y, config = {}) {
        const preset = this.presets[config.type] || this.presets.sparks;
        const mergedConfig = { ...preset, ...config };

        const count = mergedConfig.count || 10;
        const spread = mergedConfig.spread || 360;
        const spreadRad = (spread * Math.PI) / 180;
        const baseAngle = (mergedConfig.angle || 0) * Math.PI / 180;

        for (let i = 0; i < count; i++) {
            const particle = this.pool.get();
            if (!particle) continue;

            particle.x = x;
            particle.y = y;

            // Ángulo con spread
            const angle = baseAngle + (Math.random() - 0.5) * spreadRad;
            const speed = mergedConfig.speed.min + Math.random() * (mergedConfig.speed.max - mergedConfig.speed.min);
            
            particle.vx = Math.cos(angle) * speed + this.globalGravity.x;
            particle.vy = Math.sin(angle) * speed + this.globalGravity.y;

            // Tamaño
            particle.startSize = mergedConfig.size?.start || 1;
            particle.endSize = mergedConfig.size?.end ?? particle.startSize;

            // Vida
            particle.maxLife = mergedConfig.life.min + Math.random() * (mergedConfig.life.max - mergedConfig.life.min);
            particle.life = particle.maxLife;

            // Color
            if (mergedConfig.color.start) {
                particle.startColor = { ...mergedConfig.color.start };
            }
            if (mergedConfig.color.mid && Math.random() > 0.5) {
                particle.startColor = { ...mergedConfig.color.mid };
            }
            if (mergedConfig.color.end) {
                particle.endColor = { ...mergedConfig.color.end };
            }

            // Física
            particle.gravity = (mergedConfig.gravity || 0) / 60;
            particle.friction = mergedConfig.friction ?? 1;
            particle.collision = mergedConfig.collision ?? false;
            particle.bounce = mergedConfig.bounce ?? 0;

            // Renderizado
            particle.pixelArt = mergedConfig.pixelArt ?? true;
            particle.blendMode = mergedConfig.blendMode || 'source-over';

            // Rotación
            if (mergedConfig.rotation) {
                particle.rotationSpeed = (mergedConfig.rotation.min + Math.random() * (mergedConfig.rotation.max - mergedConfig.rotation.min)) * Math.PI / 180;
            }

            // Oscilación
            if (mergedConfig.oscillation) {
                particle.oscillation = {
                    x: 0,
                    y: 0,
                    amplitude: mergedConfig.oscillation.amplitude || 0,
                    speed: mergedConfig.oscillation.speed || 1
                };
            }

            // Sprite
            if (mergedConfig.useSprite) {
                particle.useSprite = true;
                particle.sprite = mergedConfig.sprite;
                particle.totalFrames = mergedConfig.totalFrames || 1;
                particle.frameDuration = mergedConfig.frameDuration || 1;
            }

            particle.type = mergedConfig.type || 'default';
        }

        return count;
    }

    emitContinuous(x, y, config = {}, duration = 1) {
        const emitter = {
            x,
            y,
            config,
            life: duration,
            maxLife: duration,
            interval: config.interval || 0.05,
            timer: 0
        };

        this.emitters.push(emitter);
        return emitter;
    }

    stopEmitter(emitter) {
        const index = this.emitters.indexOf(emitter);
        if (index !== -1) {
            this.emitters.splice(index, 1);
        }
    }

    update(dt) {
        dt *= this.timeScale;

        // Actualizar emisores continuos
        for (let i = this.emitters.length - 1; i >= 0; i--) {
            const emitter = this.emitters[i];
            emitter.life -= dt;
            emitter.timer += dt;

            if (emitter.timer >= emitter.interval) {
                this.emit(emitter.x, emitter.y, emitter.config);
                emitter.timer = 0;
            }

            if (emitter.life <= 0) {
                this.emitters.splice(i, 1);
            }
        }

        // Actualizar partículas
        this.pool.update(dt);
    }

    draw(cameraX = 0, cameraY = 0) {
        this.pool.draw(this.ctx, cameraX, cameraY);
    }

    clear() {
        this.pool.clear();
        this.emitters = [];
    }

    setGlobalGravity(x, y) {
        this.globalGravity = { x, y };
    }

    setTimeScale(scale) {
        this.timeScale = Math.max(0, scale);
    }

    getStats() {
        return {
            active: this.pool.getActiveCount(),
            total: this.pool.getTotalCount(),
            emitters: this.emitters.length
        };
    }

    // Métodos utilitarios para efectos comunes
    burst(x, y, type = 'sparks', count = 20) {
        return this.emit(x, y, { type, count });
    }

    trail(x, y, type = 'smoke', count = 2) {
        return this.emit(x, y, { type, count, spread: 30, speed: { min: 10, max: 30 } });
    }

    impact(x, y, type = 'explosion') {
        return this.emit(x, y, { type, count: 50, spread: 360 });
    }

    aura(x, y, type = 'magic', radius = 50) {
        const count = 5;
        for (let i = 0; i < count; i++) {
            const angle = Math.random() * Math.PI * 2;
            const dist = Math.random() * radius;
            const px = x + Math.cos(angle) * dist;
            const py = y + Math.sin(angle) * dist;
            this.emit(px, py, { type, count: 1, speed: { min: 5, max: 20 } });
        }
    }
}

// Export para diferentes entornos
if (typeof module !== 'undefined' && module.exports) {
    module.exports = { Particle, ParticlePool, ParticleSystem };
}
