/**
 * LightingSystem.js - Sistema de Iluminación Dinámica 2D
 * 
 * Inspirado en: Hyper Light Drifter, Blasphemous
 * Estética: Pixel Art
 * Tecnología: Canvas 2D (sin WebGL)
 * 
 * Características:
 * - Luces puntuales con atenuación
 * - Sombras dinámicas
 * - Antorchas con flickering
 * - Explosiones con iluminación temporal
 * - Efectos mágicos
 * - Oscurecimiento ambiental (vignette, niebla)
 */

const LightingSystem = {
    // Configuración global
    config: {
        maxLights: 32,           // Máximo número de luces
        lightQuality: 'high',    // 'low', 'medium', 'high'
        shadowResolution: 1,     // Resolución de sombras (0.5 = media resolución)
        ambientLight: 0.15,      // Luz ambiental base (0-1)
        vignetteStrength: 0.6,   // Fuerza del viñeteado
        fogDensity: 0.0003,      // Densidad de la niebla oscura
        pixelateFactor: 4        // Factor de pixelado para efecto retro
    },

    // Estado del sistema
    lights: [],
    lightSources: [],
    shadowCasters: [],
    particles: [],
    
    // Canvas offscreen para efectos
    lightCanvas: null,
    lightCtx: null,
    shadowCanvas: null,
    shadowCtx: null,
    compositeCanvas: null,
    compositeCtx: null,
    
    // Temporizadores
    time: 0,
    
    // Paleta de colores de iluminación
    colorPalette: {
        torch: { r: 255, g: 180, b: 80 },      // Naranja antorcha
        magic: { r: 100, g: 200, b: 255 },     // Azul mágico
        explosion: { r: 255, g: 220, b: 150 }, // Blanco-amarillo explosión
        ambient: { r: 50, g: 50, b: 70 },      // Azul oscuro ambiental
        moonlight: { r: 180, g: 200, b: 255 }  // Luz de luna
    },

    /**
     * Inicializa el sistema de iluminación
     * @param {number} width - Ancho del canvas
     * @param {number} height - Alto del canvas
     */
    init(width, height) {
        // Crear canvases offscreen
        this.lightCanvas = document.createElement('canvas');
        this.lightCanvas.width = width;
        this.lightCanvas.height = height;
        this.lightCtx = this.lightCanvas.getContext('2d');
        
        this.shadowCanvas = document.createElement('canvas');
        this.shadowCanvas.width = Math.floor(width * this.config.shadowResolution);
        this.shadowCanvas.height = Math.floor(height * this.config.shadowResolution);
        this.shadowCtx = this.shadowCanvas.getContext('2d');
        
        this.compositeCanvas = document.createElement('canvas');
        this.compositeCanvas.width = width;
        this.compositeCanvas.height = height;
        this.compositeCtx = this.compositeCanvas.getContext('2d');
        
        // Configurar renderizado pixelado
        this.lightCtx.imageSmoothingEnabled = false;
        this.shadowCtx.imageSmoothingEnabled = false;
        this.compositeCtx.imageSmoothingEnabled = false;
        
        console.log('Lighting System initialized');
    },

    /**
     * Actualiza el sistema de iluminación
     * @param {number} dt - Delta time en segundos
     */
    update(dt) {
        this.time += dt;
        
        // Actualizar todas las fuentes de luz
        for (let i = this.lightSources.length - 1; i >= 0; i--) {
            const source = this.lightSources[i];
            if (source.update) {
                source.update(dt, this.time);
            }
            
            // Eliminar fuentes expiradas
            if (source.lifetime !== undefined && source.lifetime <= 0) {
                this.lightSources.splice(i, 1);
            }
        }
        
        // Limitar número de luces
        while (this.lightSources.length > this.config.maxLights) {
            this.lightSources.shift();
        }
        
        // Actualizar partículas de luz
        this.updateLightParticles(dt);
    },

    /**
     * Renderiza la iluminación sobre el canvas principal
     * @param {CanvasRenderingContext2D} ctx - Contexto del canvas principal
     * @param {number} width - Ancho
     * @param {number} height - Alto
     */
    render(ctx, width, height) {
        // 1. Limpiar canvas de luces
        this.lightCtx.fillStyle = `rgb(
            ${Math.floor(this.config.ambientLight * this.colorPalette.ambient.r)},
            ${Math.floor(this.config.ambientLight * this.colorPalette.ambient.g)},
            ${Math.floor(this.config.ambientLight * this.colorPalette.ambient.b)}
        )`;
        this.lightCtx.fillRect(0, 0, width, height);
        
        // 2. Dibujar todas las fuentes de luz
        this.lightCtx.globalCompositeOperation = 'screen';
        for (const source of this.lightSources) {
            this.renderLightSource(source, width, height);
        }
        
        // 3. Aplicar sombras
        this.renderShadows(width, height);
        
        // 4. Aplicar viñeteado y oscurecimiento
        this.renderDarkeningEffects(width, height);
        
        // 5. Composición final
        ctx.save();
        ctx.globalCompositeOperation = 'multiply';
        ctx.drawImage(this.lightCanvas, 0, 0, width, height);
        ctx.restore();
        
        // 6. Renderizar partículas brillantes (additive)
        ctx.globalCompositeOperation = 'screen';
        this.renderLightParticles(ctx, width, height);
        ctx.globalCompositeOperation = 'source-over';
    },

    /**
     * Renderiza una fuente de luz individual
     * @param {Object} source - Fuente de luz
     * @param {number} width - Ancho del canvas
     * @param {number} height - Alto del canvas
     */
    renderLightSource(source, width, height) {
        const { x, y, radius, color, intensity = 1 } = source;
        
        // Verificar si está en pantalla
        if (x + radius < 0 || x - radius > width || y + radius < 0 || y - radius > height) {
            return;
        }
        
        // Crear gradiente radial para la luz
        const gradient = this.lightCtx.createRadialGradient(x, y, 0, x, y, radius);
        
        // Calcular colores con intensidad
        const r = Math.min(255, Math.floor(color.r * intensity));
        const g = Math.min(255, Math.floor(color.g * intensity));
        const b = Math.min(255, Math.floor(color.b * intensity));
        
        // Gradiente suave con múltiples stops para mejor calidad
        gradient.addColorStop(0, `rgba(${r}, ${g}, ${b}, ${0.9 * intensity})`);
        gradient.addColorStop(0.3, `rgba(${r}, ${g}, ${b}, ${0.6 * intensity})`);
        gradient.addColorStop(0.6, `rgba(${r}, ${g}, ${b}, ${0.3 * intensity})`);
        gradient.addColorStop(1, `rgba(${r}, ${g}, ${b}, 0)`);
        
        this.lightCtx.fillStyle = gradient;
        this.lightCtx.beginPath();
        this.lightCtx.arc(x, y, radius, 0, Math.PI * 2);
        this.lightCtx.fill();
        
        // Añadir núcleo brillante para luces intensas
        if (intensity > 0.7) {
            const coreRadius = radius * 0.15;
            const coreGradient = this.lightCtx.createRadialGradient(x, y, 0, x, y, coreRadius);
            coreGradient.addColorStop(0, `rgba(${Math.min(255, r + 50)}, ${Math.min(255, g + 30)}, ${Math.min(255, b + 20)}, ${intensity})`);
            coreGradient.addColorStop(1, `rgba(${r}, ${g}, ${b}, 0)`);
            
            this.lightCtx.fillStyle = coreGradient;
            this.lightCtx.beginPath();
            this.lightCtx.arc(x, y, coreRadius, 0, Math.PI * 2);
            this.lightCtx.fill();
        }
    },

    /**
     * Renderiza las sombras dinámicas
     * @param {number} width - Ancho
     * @param {number} height - Alto
     */
    renderShadows(width, height) {
        if (this.shadowCasters.length === 0) return;
        
        const scale = this.config.shadowResolution;
        const scaledWidth = Math.floor(width * scale);
        const scaledHeight = Math.floor(height * scale);
        
        // Limpiar canvas de sombras
        this.shadowCtx.clearRect(0, 0, scaledWidth, scaledHeight);
        
        // Dibujar sombras desde cada caster
        for (const caster of this.shadowCasters) {
            this.renderShadowCaster(caster, scaledWidth, scaledHeight);
        }
        
        // Aplicar sombra al canvas de luz
        this.lightCtx.save();
        this.lightCtx.scale(scale, scale);
        this.lightCtx.globalCompositeOperation = 'multiply';
        this.lightCtx.fillStyle = 'rgba(0, 0, 0, 0.7)';
        this.lightCtx.drawImage(this.shadowCanvas, 0, 0, scaledWidth, scaledHeight, 0, 0, width, height);
        this.lightCtx.restore();
    },

    /**
     * Renderiza un caster de sombras
     * @param {Object} caster - Objeto que proyecta sombra
     * @param {number} width - Ancho escalado
     * @param {number} height - Alto escalado
     */
    renderShadowCaster(caster, width, height) {
        const { x, y, width: w, height: h } = caster;
        
        // Para cada fuente de luz, proyectar sombra
        for (const source of this.lightSources) {
            const lx = source.x;
            const ly = source.y;
            
            // Calcular dirección de la sombra (opuesta a la luz)
            const dx = x + w / 2 - lx;
            const dy = y + h / 2 - ly;
            const dist = Math.sqrt(dx * dx + dy * dy);
            
            if (dist === 0) continue;
            
            // Longitud de la sombra basada en distancia a la luz
            const shadowLength = Math.min(300, 150 * (1 - dist / (source.radius || 300)));
            
            // Normalizar dirección
            const ndx = dx / dist;
            const ndy = dy / dist;
            
            // Dibujar sombra alargada
            this.shadowCtx.save();
            this.shadowCtx.fillStyle = 'rgba(0, 0, 0, 0.5)';
            this.shadowCtx.beginPath();
            
            // Cuatro puntos para formar la sombra proyectada
            const shadowX = x + ndx * shadowLength;
            const shadowY = y + ndy * shadowLength;
            const shadowW = w * (1 + shadowLength / dist * 0.3);
            const shadowH = h * (1 + shadowLength / dist * 0.3);
            
            this.shadowCtx.moveTo(x, y);
            this.shadowCtx.lineTo(x + w, y);
            this.shadowCtx.lineTo(shadowX + shadowW, shadowY + shadowH);
            this.shadowCtx.lineTo(shadowX, shadowY);
            this.shadowCtx.closePath();
            this.shadowCtx.fill();
            
            this.shadowCtx.restore();
        }
    },

    /**
     * Renderiza efectos de oscurecimiento (viñeta, niebla)
     * @param {number} width - Ancho
     * @param {number} height - Alto
     */
    renderDarkeningEffects(width, height) {
        // Viñeteado
        const vignetteGradient = this.lightCtx.createRadialGradient(
            width / 2, height / 2, Math.min(width, height) * 0.3,
            width / 2, height / 2, Math.max(width, height) * 0.7
        );
        vignetteGradient.addColorStop(0, 'rgba(0, 0, 0, 0)');
        vignetteGradient.addColorStop(0.7, `rgba(0, 0, 0, ${this.config.vignetteStrength * 0.3})`);
        vignetteGradient.addColorStop(1, `rgba(0, 0, 0, ${this.config.vignetteStrength})`);
        
        this.lightCtx.globalCompositeOperation = 'multiply';
        this.lightCtx.fillStyle = vignetteGradient;
        this.lightCtx.fillRect(0, 0, width, height);
        
        // Niebla oscura atmosférica
        if (this.config.fogDensity > 0) {
            this.lightCtx.globalCompositeOperation = 'source-over';
            this.lightCtx.fillStyle = `rgba(20, 20, 30, ${this.config.fogDensity * 500})`;
            this.lightCtx.fillRect(0, 0, width, height);
        }
        
        this.lightCtx.globalCompositeOperation = 'source-over';
    },

    /**
     * Añade una fuente de luz estática
     * @param {number} x - Posición X
     * @param {number} y - Posición Y
     * @param {number} radius - Radio de iluminación
     * @param {Object} color - Color {r, g, b}
     * @param {number} intensity - Intensidad (0-1)
     */
    addStaticLight(x, y, radius, color, intensity = 1) {
        this.lightSources.push({
            type: 'static',
            x, y, radius,
            color: { ...color },
            intensity,
            lifetime: undefined
        });
    },

    /**
     * Añade una antorcha con efecto flickering
     * @param {number} x - Posición X
     * @param {number} y - Posición Y
     * @param {number} radius - Radio base
     * @param {string} colorType - 'torch', 'magic', 'moonlight'
     */
    addTorch(x, y, radius = 120, colorType = 'torch') {
        const baseColor = this.colorPalette[colorType] || this.colorPalette.torch;
        
        this.lightSources.push({
            type: 'torch',
            x, y,
            baseRadius: radius,
            radius,
            color: { ...baseColor },
            intensity: 1,
            flickerSpeed: 0.1 + Math.random() * 0.15,
            flickerAmount: 0.2 + Math.random() * 0.15,
            offset: Math.random() * Math.PI * 2,
            
            update(dt, time) {
                // Efecto flickering orgánico usando múltiples frecuencias
                const flicker = Math.sin(time * this.flickerSpeed * 10 + this.offset) * 0.5 +
                               Math.sin(time * this.flickerSpeed * 23 + this.offset) * 0.3 +
                               Math.sin(time * this.flickerSpeed * 7 + this.offset) * 0.2;
                
                this.intensity = 1 + flicker * this.flickerAmount;
                this.radius = this.baseRadius * (0.95 + flicker * 0.1);
            }
        });
    },

    /**
     * Añade una explosión con iluminación temporal intensa
     * @param {number} x - Posición X
     * @param {number} y - Posición Y
     * @param {number} maxRadius - Radio máximo
     * @param {number} duration - Duración en segundos
     */
    addExplosion(x, y, maxRadius = 200, duration = 0.5) {
        const color = { ...this.colorPalette.explosion };
        
        this.lightSources.push({
            type: 'explosion',
            x, y,
            maxRadius,
            radius: 0,
            color,
            intensity: 1,
            duration,
            lifetime: duration,
            expansionSpeed: maxRadius / duration,
            
            update(dt, time) {
                this.lifetime -= dt;
                
                // Fase de expansión
                if (this.lifetime > this.duration * 0.6) {
                    this.radius += this.expansionSpeed * dt;
                    this.intensity = 1;
                } 
                // Fase de contracción y desvanecimiento
                else {
                    const progress = 1 - (this.lifetime / (this.duration * 0.6));
                    this.radius = this.maxRadius * (1 - progress * 0.3);
                    this.intensity = 1 - progress;
                }
            }
        });
        
        // Añadir partículas de luz de la explosión
        this.addExplosionParticles(x, y, maxRadius, duration);
    },

    /**
     * Añade un efecto mágico (hechizo, aura)
     * @param {number} x - Posición X
     * @param {number} y - Posición Y
     * @param {number} radius - Radio del efecto
     * @param {string} magicType - 'blue', 'purple', 'green', 'red'
     * @param {number} duration - Duración en segundos
     */
    addMagicEffect(x, y, radius = 80, magicType = 'blue', duration = 1) {
        let color;
        switch(magicType) {
            case 'purple': color = { r: 180, g: 80, b: 220 }; break;
            case 'green': color = { r: 80, g: 220, b: 120 }; break;
            case 'red': color = { r: 220, g: 80, b: 100 }; break;
            default: color = { ...this.colorPalette.magic };
        }
        
        this.lightSources.push({
            type: 'magic',
            x, y,
            baseRadius: radius,
            radius,
            color,
            intensity: 1,
            duration,
            lifetime: duration,
            rotation: Math.random() * Math.PI * 2,
            rotationSpeed: (Math.random() - 0.5) * 4,
            
            update(dt, time) {
                this.lifetime -= dt;
                this.rotation += this.rotationSpeed * dt;
                
                // Pulsación mágica
                const pulse = Math.sin(time * 15 + this.rotation) * 0.2 + 0.8;
                this.intensity = pulse * (this.lifetime / this.duration);
                this.radius = this.baseRadius * (0.9 + Math.sin(time * 10) * 0.1);
            }
        });
        
        // Añadir partículas mágicas
        this.addMagicParticles(x, y, radius, magicType, duration);
    },

    /**
     * Añade un efecto de rayo/relámpago
     * @param {number} startX - X inicial
     * @param {number} startY - Y inicial
     * @param {number} endX - X final
     * @param {number} endY - Y final
     * @param {number} duration - Duración
     */
    addLightning(startX, startY, endX, endY, duration = 0.3) {
        const segments = [];
        const points = 15;
        
        // Generar segmentos zigzag
        let cx = startX;
        let cy = startY;
        const dx = (endX - startX) / points;
        const dy = (endY - startY) / points;
        
        for (let i = 0; i < points; i++) {
            const deviation = (Math.random() - 0.5) * 40;
            segments.push({
                x1: cx, y1: cy,
                x2: startX + dx * (i + 1) + deviation,
                y2: startY + dy * (i + 1) + deviation
            });
            cx = segments[segments.length - 1].x2;
            cy = segments[segments.length - 1].y2;
        }
        
        this.lightSources.push({
            type: 'lightning',
            segments,
            color: { r: 200, g: 220, b: 255 },
            intensity: 1,
            duration,
            lifetime: duration,
            
            update(dt, time) {
                this.lifetime -= dt;
                this.intensity = this.lifetime / this.duration;
            }
        });
    },

    /**
     * Añade partículas de luz para explosiones
     */
    addExplosionParticles(x, y, maxRadius, duration) {
        const particleCount = 20;
        for (let i = 0; i < particleCount; i++) {
            const angle = (Math.PI * 2 / particleCount) * i + Math.random() * 0.5;
            const speed = 50 + Math.random() * 100;
            
            this.particles.push({
                type: 'explosion',
                x, y,
                vx: Math.cos(angle) * speed,
                vy: Math.sin(angle) * speed,
                radius: 3 + Math.random() * 5,
                color: { ...this.colorPalette.explosion },
                lifetime: duration * (0.5 + Math.random() * 0.5),
                maxLifetime: duration
            });
        }
    },

    /**
     * Añade partículas mágicas
     */
    addMagicParticles(x, y, radius, magicType, duration) {
        const particleCount = 15;
        let color;
        
        switch(magicType) {
            case 'purple': color = { r: 180, g: 80, b: 220 }; break;
            case 'green': color = { r: 80, g: 220, b: 120 }; break;
            case 'red': color = { r: 220, g: 80, b: 100 }; break;
            default: color = { ...this.colorPalette.magic };
        }
        
        for (let i = 0; i < particleCount; i++) {
            const angle = Math.random() * Math.PI * 2;
            const distance = Math.random() * radius;
            
            this.particles.push({
                type: 'magic',
                x: x + Math.cos(angle) * distance,
                y: y + Math.sin(angle) * distance,
                vx: (Math.random() - 0.5) * 30,
                vy: (Math.random() - 0.5) * 30 - 20,
                radius: 2 + Math.random() * 3,
                color: { ...color },
                lifetime: duration * (0.5 + Math.random() * 0.5),
                maxLifetime: duration,
                floatOffset: Math.random() * Math.PI * 2
            });
        }
    },

    /**
     * Actualiza las partículas de luz
     */
    updateLightParticles(dt) {
        for (let i = this.particles.length - 1; i >= 0; i--) {
            const p = this.particles[i];
            p.lifetime -= dt;
            
            // Movimiento
            p.x += p.vx * dt;
            p.y += p.vy * dt;
            
            // Gravedad para algunas partículas
            if (p.type === 'explosion') {
                p.vy += 50 * dt;
            } else if (p.type === 'magic') {
                // Flotación mágica
                p.y += Math.sin(this.time * 5 + p.floatOffset) * 10 * dt;
            }
            
            // Eliminar partículas expiradas
            if (p.lifetime <= 0) {
                this.particles.splice(i, 1);
            }
        }
    },

    /**
     * Renderiza las partículas de luz
     */
    renderLightParticles(ctx, width, height) {
        for (const p of this.particles) {
            // Verificar si está en pantalla
            if (p.x < -20 || p.x > width + 20 || p.y < -20 || p.y > height + 20) continue;
            
            const alpha = p.lifetime / p.maxLifetime;
            const { r, g, b } = p.color;
            
            // Brillo de la partícula
            const gradient = ctx.createRadialGradient(p.x, p.y, 0, p.x, p.y, p.radius * 2);
            gradient.addColorStop(0, `rgba(${r}, ${g}, ${b}, ${alpha})`);
            gradient.addColorStop(0.5, `rgba(${r}, ${g}, ${b}, ${alpha * 0.5})`);
            gradient.addColorStop(1, `rgba(${r}, ${g}, ${b}, 0)`);
            
            ctx.fillStyle = gradient;
            ctx.beginPath();
            ctx.arc(p.x, p.y, p.radius * 2, 0, Math.PI * 2);
            ctx.fill();
        }
    },

    /**
     * Añade un caster de sombras (obstáculo que bloquea luz)
     * @param {number} x - Posición X
     * @param {number} y - Posición Y
     * @param {number} width - Ancho
     * @param {number} height - Alto
     */
    addShadowCaster(x, y, width, height) {
        this.shadowCasters.push({ x, y, width, height });
    },

    /**
     * Elimina todos los casters de sombras
     */
    clearShadowCasters() {
        this.shadowCasters = [];
    },

    /**
     * Elimina todas las fuentes de luz
     */
    clearLights() {
        this.lightSources = [];
    },

    /**
     * Elimina todas las partículas
     */
    clearParticles() {
        this.particles = [];
    },

    /**
     * Ajusta la luz ambiental
     * @param {number} value - Valor entre 0 y 1
     */
    setAmbientLight(value) {
        this.config.ambientLight = Math.max(0, Math.min(1, value));
    },

    /**
     * Ajusta la densidad de niebla
     * @param {number} value - Valor de densidad
     */
    setFogDensity(value) {
        this.config.fogDensity = Math.max(0, value);
    },

    /**
     * Ajusta la fuerza del viñeteado
     * @param {number} value - Valor entre 0 y 1
     */
    setVignetteStrength(value) {
        this.config.vignetteStrength = Math.max(0, Math.min(1, value));
    },

    /**
     * Crea un efecto de parpadeo global (como un fallo de energía)
     * @param {number} duration - Duración total
     * @param {number} frequency - Frecuencia de parpadeo
     */
    triggerFlicker(duration = 1, frequency = 10) {
        let elapsed = 0;
        let on = true;
        const originalAmbient = this.config.ambientLight;
        
        const flickerInterval = setInterval(() => {
            on = !on;
            this.config.ambientLight = on ? originalAmbient : originalAmbient * 0.3;
            
            elapsed += 1 / frequency;
            if (elapsed >= duration) {
                clearInterval(flickerInterval);
                this.config.ambientLight = originalAmbient;
            }
        }, 1000 / frequency);
    },

    /**
     * Efecto de transición día/noche
     * @param {boolean} isNight - True para noche, false para día
     * @param {number} transitionTime - Tiempo de transición en segundos
     */
    transitionDayNight(isNight, transitionTime = 2) {
        const startAmbient = this.config.ambientLight;
        const targetAmbient = isNight ? 0.1 : 0.5;
        const startTime = this.time;
        
        const transition = () => {
            const progress = Math.min(1, (this.time - startTime) / transitionTime);
            const eased = 1 - Math.pow(1 - progress, 3); // Ease out cubic
            
            this.config.ambientLight = startAmbient + (targetAmbient - startAmbient) * eased;
            this.config.vignetteStrength = isNight ? 
                0.3 + 0.3 * eased : 
                0.6 - 0.3 * eased;
            
            if (progress < 1) {
                requestAnimationFrame(transition);
            }
        };
        
        transition();
    }
};

// Hacer el sistema disponible globalmente
if (typeof window !== 'undefined') {
    window.LightingSystem = LightingSystem;
}
