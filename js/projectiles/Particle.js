/**
 * Particle.js - Sistema de partículas para efectos visuales
 * 
 * Sistema optimizado para manejar cientos de partículas simultáneas.
 * Usado para estelas de proyectiles, explosiones, impactos y efectos especiales.
 * 
 * @module Particle
 */

class Particle {
    /**
     * Crea una nueva partícula
     * @param {Object} config - Configuración de la partícula
     * @param {number} config.x - Posición X inicial
     * @param {number} config.y - Posición Y inicial
     * @param {number} config.vx - Velocidad X
     * @param {number} config.vy - Velocidad Y
     * @param {number} config.life - Duración en frames
     * @param {Object} config.color - Color {r, g, b, a}
     * @param {number} config.size - Tamaño inicial
     * @param {number} config.sizeDecay - Decaimiento de tamaño por frame
     * @param {number} config.gravity - Gravedad aplicada
     * @param {number} config.friction - Fricción (0-1)
     * @param {string} config.type - Tipo: 'spark', 'glow', 'smoke', 'trail'
     */
    constructor(config) {
        this.x = config.x || 0;
        this.y = config.y || 0;
        this.vx = config.vx || 0;
        this.vy = config.vy || 0;
        this.life = config.life || 60;
        this.maxLife = this.life;
        this.color = config.color || { r: 255, g: 255, b: 255, a: 1 };
        this.size = config.size || 3;
        this.initialSize = this.size;
        this.sizeDecay = config.sizeDecay || 0;
        this.gravity = config.gravity || 0;
        this.friction = config.friction || 1;
        this.type = config.type || 'spark';
        this.rotation = config.rotation || 0;
        this.rotationSpeed = config.rotationSpeed || 0;
        this.active = true;
    }

    /**
     * Actualiza el estado de la partícula
     * @returns {boolean} True si la partícula sigue activa
     */
    update() {
        if (!this.active) return false;

        // Aplicar física
        this.x += this.vx;
        this.y += this.vy;
        this.vy += this.gravity;
        this.vx *= this.friction;
        this.vy *= this.friction;

        // Rotación
        this.rotation += this.rotationSpeed;

        // Decaer tamaño
        if (this.sizeDecay > 0) {
            this.size = Math.max(0, this.size - this.sizeDecay);
        } else {
            // Decaimiento natural basado en vida
            this.size = this.initialSize * (this.life / this.maxLife);
        }

        // Reducir vida
        this.life--;

        if (this.life <= 0 || this.size <= 0) {
            this.active = false;
        }

        return this.active;
    }

    /**
     * Renderiza la partícula
     * @param {CanvasRenderingContext2D} ctx - Contexto del canvas
     */
    render(ctx) {
        if (!this.active) return;

        const alpha = (this.life / this.maxLife) * this.color.a;

        ctx.save();
        ctx.translate(this.x, this.y);
        ctx.rotate(this.rotation);

        switch (this.type) {
            case 'spark':
                this.renderSpark(ctx, alpha);
                break;
            case 'glow':
                this.renderGlow(ctx, alpha);
                break;
            case 'smoke':
                this.renderSmoke(ctx, alpha);
                break;
            case 'trail':
                this.renderTrail(ctx, alpha);
                break;
            default:
                this.renderSpark(ctx, alpha);
        }

        ctx.restore();
    }

    /**
     * Renderiza partícula tipo spark (chispa brillante)
     */
    renderSpark(ctx, alpha) {
        ctx.fillStyle = `rgba(${this.color.r}, ${this.color.g}, ${this.color.b}, ${alpha})`;
        ctx.beginPath();
        ctx.arc(0, 0, this.size, 0, Math.PI * 2);
        ctx.fill();

        // Brillo exterior
        ctx.fillStyle = `rgba(${this.color.r}, ${this.color.g}, ${this.color.b}, ${alpha * 0.5})`;
        ctx.beginPath();
        ctx.arc(0, 0, this.size * 1.5, 0, Math.PI * 2);
        ctx.fill();
    }

    /**
     * Renderiza partícula tipo glow (resplandor suave)
     */
    renderGlow(ctx, alpha) {
        const gradient = ctx.createRadialGradient(0, 0, 0, 0, 0, this.size * 2);
        gradient.addColorStop(0, `rgba(${this.color.r}, ${this.color.g}, ${this.color.b}, ${alpha})`);
        gradient.addColorStop(0.5, `rgba(${this.color.r}, ${this.color.g}, ${this.color.b}, ${alpha * 0.5})`);
        gradient.addColorStop(1, `rgba(${this.color.r}, ${this.color.g}, ${this.color.b}, 0)`);

        ctx.fillStyle = gradient;
        ctx.beginPath();
        ctx.arc(0, 0, this.size * 2, 0, Math.PI * 2);
        ctx.fill();
    }

    /**
     * Renderiza partícula tipo smoke (humo)
     */
    renderSmoke(ctx, alpha) {
        ctx.fillStyle = `rgba(${this.color.r}, ${this.color.g}, ${this.color.b}, ${alpha * 0.3})`;
        ctx.beginPath();
        ctx.arc(0, 0, this.size * 2, 0, Math.PI * 2);
        ctx.fill();
    }

    /**
     * Renderiza partícula tipo trail (estela)
     */
    renderTrail(ctx, alpha) {
        ctx.fillStyle = `rgba(${this.color.r}, ${this.color.g}, ${this.color.b}, ${alpha})`;
        ctx.fillRect(-this.size / 2, -this.size / 2, this.size, this.size);
    }

    /**
     * Clona la partícula con modificaciones
     * @param {Object} overrides - Propiedades a sobrescribir
     * @returns {Particle} Nueva partícula clonada
     */
    clone(overrides = {}) {
        return new Particle({
            x: this.x,
            y: this.y,
            vx: this.vx,
            vy: this.vy,
            life: this.life,
            color: { ...this.color },
            size: this.size,
            sizeDecay: this.sizeDecay,
            gravity: this.gravity,
            friction: this.friction,
            type: this.type,
            rotation: this.rotation,
            rotationSpeed: this.rotationSpeed,
            ...overrides
        });
    }
}

/**
 * ParticlePool - Pool de objetos para reutilizar partículas
 * Optimiza rendimiento evitando creación/destrucción constante
 */
class ParticlePool {
    /**
     * Crea un pool de partículas
     * @param {number} initialSize - Número inicial de partículas en el pool
     */
    constructor(initialSize = 500) {
        this.pool = [];
        this.active = [];
        this.initialSize = initialSize;

        // Pre-crear partículas
        for (let i = 0; i < initialSize; i++) {
            this.pool.push(new Particle({}));
        }
    }

    /**
     * Obtiene una partícula del pool o crea una nueva
     * @param {Object} config - Configuración para la partícula
     * @returns {Particle} Partícula lista para usar
     */
    get(config) {
        let particle;

        if (this.pool.length > 0) {
            particle = this.pool.pop();
            // Reiniciar propiedades
            Object.assign(particle, {
                x: config.x || 0,
                y: config.y || 0,
                vx: config.vx || 0,
                vy: config.vy || 0,
                life: config.life || 60,
                maxLife: config.life || 60,
                color: config.color || { r: 255, g: 255, b: 255, a: 1 },
                size: config.size || 3,
                initialSize: config.size || 3,
                sizeDecay: config.sizeDecay || 0,
                gravity: config.gravity || 0,
                friction: config.friction || 1,
                type: config.type || 'spark',
                rotation: config.rotation || 0,
                rotationSpeed: config.rotationSpeed || 0,
                active: true
            });
        } else {
            particle = new Particle(config);
        }

        this.active.push(particle);
        return particle;
    }

    /**
     * Actualiza todas las partículas activas
     * @returns {number} Número de partículas aún activas
     */
    update() {
        for (let i = this.active.length - 1; i >= 0; i--) {
            const particle = this.active[i];

            if (!particle.update()) {
                // Devolver al pool
                this.active.splice(i, 1);
                this.pool.push(particle);
            }
        }

        return this.active.length;
    }

    /**
     * Renderiza todas las partículas activas
     * @param {CanvasRenderingContext2D} ctx - Contexto del canvas
     */
    render(ctx) {
        for (const particle of this.active) {
            particle.render(ctx);
        }
    }

    /**
     * Limpia todas las partículas activas
     */
    clear() {
        while (this.active.length > 0) {
            this.pool.push(this.active.pop());
        }
    }

    /**
     * Obtiene estadísticas del pool
     * @returns {Object} Estadísticas
     */
    getStats() {
        return {
            active: this.active.length,
            pooled: this.pool.length,
            total: this.active.length + this.pool.length
        };
    }
}

// Exportar
if (typeof module !== 'undefined' && module.exports) {
    module.exports = { Particle, ParticlePool };
}
