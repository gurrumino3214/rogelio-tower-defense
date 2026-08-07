// ==========================================
// ROGELIO TOWER DEFENSE - PARTICLES.JS
// ==========================================
// Sistema de partículas y efectos visuales profesionales
// Incluye: explosiones, chispas, humo, polvo, magia, fuego
// ==========================================

const ParticleSystem = {
    // Pools de partículas para optimización
    particlePools: {
        spark: [],
        smoke: [],
        dust: [],
        magic: [],
        fire: [],
        explosion: [],
        hit: [],
        blood: []
    },
    
    // Partículas activas
    activeParticles: [],
    
    // Configuración máxima de partículas
    maxParticles: 500,
    
    // Contador de partículas activas
    particleCount: 0,
    
    /**
     * Inicializa el sistema de partículas
     */
    init: function() {
        console.log('[PARTICLES] Sistema de partículas inicializado');
        this.preallocateParticles();
    },
    
    /**
     * Pre-asigna partículas para evitar GC
     */
    preallocateParticles: function() {
        const types = ['spark', 'smoke', 'dust', 'magic', 'fire', 'explosion', 'hit', 'blood'];
        types.forEach(type => {
            for (let i = 0; i < 50; i++) {
                this.particlePools[type].push(this.createParticle(type));
            }
        });
    },
    
    /**
     * Crea una partícula base
     */
    createParticle: function(type) {
        return {
            type: type,
            x: 0,
            y: 0,
            vx: 0,
            vy: 0,
            life: 1,
            maxLife: 1,
            size: 4,
            color: '#FFFFFF',
            alpha: 1,
            rotation: 0,
            rotationSpeed: 0,
            gravity: 0,
            drag: 0.98,
            active: false,
            
            // Resetear partícula
            reset: function() {
                this.active = false;
                this.life = 1;
                this.alpha = 1;
            }
        };
    },
    
    /**
     * Obtiene una partícula del pool
     */
    getParticle: function(type) {
        const pool = this.particlePools[type];
        if (!pool || pool.length === 0) {
            return this.createParticle(type);
        }
        
        // Buscar partícula inactiva
        for (let p of pool) {
            if (!p.active) {
                return p;
            }
        }
        
        // Crear nueva si no hay disponibles
        return this.createParticle(type);
    },
    
    /**
     * Emite partículas de explosión
     */
    emitExplosion: function(x, y, size = 20, color = '#FF6B35') {
        const count = Math.floor(size / 2);
        for (let i = 0; i < count; i++) {
            const p = this.getParticle('explosion');
            const angle = (Math.PI * 2 * i) / count + Math.random() * 0.5;
            const speed = Math.random() * size * 0.3 + 2;
            
            p.x = x;
            p.y = y;
            p.vx = Math.cos(angle) * speed;
            p.vy = Math.sin(angle) * speed;
            p.size = Math.random() * size * 0.3 + 2;
            p.life = 1;
            p.maxLife = 0.5 + Math.random() * 0.5;
            p.color = color;
            p.alpha = 1;
            p.gravity = 0.1;
            p.drag = 0.95;
            p.active = true;
            
            this.activeParticles.push(p);
            this.particleCount++;
        }
        
        // Añadir destello central
        this.emitFlash(x, y, size * 2, color);
    },
    
    /**
     * Emite chispas
     */
    emitSparks: function(x, y, count = 10, color = '#FFD700') {
        for (let i = 0; i < count; i++) {
            const p = this.getParticle('spark');
            const angle = Math.random() * Math.PI * 2;
            const speed = Math.random() * 5 + 2;
            
            p.x = x;
            p.y = y;
            p.vx = Math.cos(angle) * speed;
            p.vy = Math.sin(angle) * speed - 2;
            p.size = Math.random() * 3 + 1;
            p.life = 1;
            p.maxLife = 0.3 + Math.random() * 0.3;
            p.color = color;
            p.alpha = 1;
            p.gravity = 0.2;
            p.drag = 0.96;
            p.active = true;
            
            this.activeParticles.push(p);
            this.particleCount++;
        }
    },
    
    /**
     * Emite humo
     */
    emitSmoke: function(x, y, count = 5, color = '#888888') {
        for (let i = 0; i < count; i++) {
            const p = this.getParticle('smoke');
            const angle = Math.random() * Math.PI * 2;
            const speed = Math.random() * 2 + 0.5;
            
            p.x = x + (Math.random() - 0.5) * 20;
            p.y = y + (Math.random() - 0.5) * 20;
            p.vx = Math.cos(angle) * speed * 0.5;
            p.vy = Math.sin(angle) * speed * 0.5 - 1;
            p.size = Math.random() * 10 + 5;
            p.life = 1;
            p.maxLife = 1 + Math.random() * 1;
            p.color = color;
            p.alpha = 0.5;
            p.gravity = -0.02;
            p.drag = 0.99;
            p.rotationSpeed = (Math.random() - 0.5) * 0.1;
            p.active = true;
            
            this.activeParticles.push(p);
            this.particleCount++;
        }
    },
    
    /**
     * Emite polvo
     */
    emitDust: function(x, y, count = 8) {
        for (let i = 0; i < count; i++) {
            const p = this.getParticle('dust');
            const angle = Math.random() * Math.PI * 2;
            const speed = Math.random() * 3 + 1;
            
            p.x = x;
            p.y = y;
            p.vx = Math.cos(angle) * speed;
            p.vy = Math.sin(angle) * speed - 1;
            p.size = Math.random() * 4 + 2;
            p.life = 1;
            p.maxLife = 0.4 + Math.random() * 0.4;
            p.color = '#C4A574';
            p.alpha = 0.7;
            p.gravity = 0.1;
            p.drag = 0.97;
            p.active = true;
            
            this.activeParticles.push(p);
            this.particleCount++;
        }
    },
    
    /**
     * Emite partículas mágicas
     */
    emitMagic: function(x, y, color = '#9C27B0', count = 15) {
        for (let i = 0; i < count; i++) {
            const p = this.getParticle('magic');
            const angle = Math.random() * Math.PI * 2;
            const speed = Math.random() * 4 + 1;
            
            p.x = x;
            p.y = y;
            p.vx = Math.cos(angle) * speed;
            p.vy = Math.sin(angle) * speed;
            p.size = Math.random() * 5 + 2;
            p.life = 1;
            p.maxLife = 0.6 + Math.random() * 0.4;
            p.color = color;
            p.alpha = 0.8;
            p.gravity = -0.05;
            p.drag = 0.98;
            p.rotationSpeed = (Math.random() - 0.5) * 0.2;
            p.active = true;
            
            this.activeParticles.push(p);
            this.particleCount++;
        }
    },
    
    /**
     * Emite fuego
     */
    emitFire: function(x, y, count = 12) {
        const colors = ['#FF4500', '#FF6347', '#FFD700', '#FF8C00'];
        for (let i = 0; i < count; i++) {
            const p = this.getParticle('fire');
            const angle = (Math.random() - 0.5) * Math.PI;
            const speed = Math.random() * 3 + 1;
            
            p.x = x + (Math.random() - 0.5) * 20;
            p.y = y;
            p.vx = Math.cos(angle) * speed * 0.5;
            p.vy = -Math.abs(Math.sin(angle) * speed) - 2;
            p.size = Math.random() * 8 + 4;
            p.life = 1;
            p.maxLife = 0.4 + Math.random() * 0.4;
            p.color = colors[Math.floor(Math.random() * colors.length)];
            p.alpha = 0.9;
            p.gravity = -0.1;
            p.drag = 0.97;
            p.active = true;
            
            this.activeParticles.push(p);
            this.particleCount++;
        }
    },
    
    /**
     * Emite efecto de impacto
     */
    emitHit: function(x, y, color = '#FFFFFF') {
        for (let i = 0; i < 8; i++) {
            const p = this.getParticle('hit');
            const angle = (Math.PI * 2 * i) / 8;
            const speed = 4;
            
            p.x = x;
            p.y = y;
            p.vx = Math.cos(angle) * speed;
            p.vy = Math.sin(angle) * speed;
            p.size = 3;
            p.life = 1;
            p.maxLife = 0.2;
            p.color = color;
            p.alpha = 1;
            p.drag = 0.9;
            p.active = true;
            
            this.activeParticles.push(p);
            this.particleCount++;
        }
    },
    
    /**
     * Emite destello
     */
    emitFlash: function(x, y, size = 50, color = '#FFFFFF') {
        const p = this.getParticle('spark');
        p.x = x;
        p.y = y;
        p.vx = 0;
        p.vy = 0;
        p.size = size;
        p.life = 1;
        p.maxLife = 0.15;
        p.color = color;
        p.alpha = 0.8;
        p.drag = 1;
        p.active = true;
        
        this.activeParticles.push(p);
        this.particleCount++;
    },
    
    /**
     * Emite aura (para Rogelio)
     */
    emitAura: function(x, y, radius = 80, color = '#F44336') {
        const p = this.getParticle('magic');
        p.x = x;
        p.y = y;
        p.vx = 0;
        p.vy = 0;
        p.size = radius * 2;
        p.life = 1;
        p.maxLife = 0.3;
        p.color = color;
        p.alpha = 0.3;
        p.drag = 1;
        p.active = true;
        
        this.activeParticles.push(p);
        this.particleCount++;
    },
    
    /**
     * Actualiza todas las partículas
     */
    update: function(deltaTime) {
        const dt = deltaTime / 16; // Normalizar a 60 FPS
        
        for (let i = this.activeParticles.length - 1; i >= 0; i--) {
            const p = this.activeParticles[i];
            
            if (!p.active) {
                this.activeParticles.splice(i, 1);
                this.particleCount--;
                continue;
            }
            
            // Actualizar vida
            p.life -= (deltaTime / 1000) / p.maxLife;
            
            if (p.life <= 0) {
                p.reset();
                this.activeParticles.splice(i, 1);
                this.particleCount--;
                continue;
            }
            
            // Aplicar física
            p.vx *= p.drag;
            p.vy *= p.drag;
            p.vy += p.gravity * dt;
            
            p.x += p.vx * dt;
            p.y += p.vy * dt;
            
            // Actualizar rotación
            p.rotation += p.rotationSpeed * dt;
            
            // Desvanecer alpha
            p.alpha = p.life * 0.8;
        }
        
        // Limitar partículas totales
        if (this.particleCount > this.maxParticles) {
            this.activeParticles.splice(0, this.particleCount - this.maxParticles);
            this.particleCount = this.maxParticles;
        }
    },
    
    /**
     * Dibuja todas las partículas
     */
    draw: function(ctx) {
        ctx.save();
        ctx.imageSmoothingEnabled = false;
        
        for (const p of this.activeParticles) {
            if (!p.active) continue;
            
            ctx.globalAlpha = p.alpha;
            
            if (p.type === 'flash' || p.type === 'aura') {
                // Dibujar como círculo difuminado
                const gradient = ctx.createRadialGradient(p.x, p.y, 0, p.x, p.y, p.size);
                gradient.addColorStop(0, p.color);
                gradient.addColorStop(1, 'transparent');
                ctx.fillStyle = gradient;
                ctx.beginPath();
                ctx.arc(p.x, p.y, p.size, 0, Math.PI * 2);
                ctx.fill();
            } else if (p.type === 'smoke') {
                // Dibujar humo como círculo suave
                ctx.fillStyle = p.color;
                ctx.beginPath();
                ctx.arc(p.x, p.y, p.size * (2 - p.life), 0, Math.PI * 2);
                ctx.fill();
            } else if (p.type === 'spark' || p.type === 'hit') {
                // Dibujar chispas como cuadrados brillantes
                ctx.fillStyle = p.color;
                ctx.fillRect(p.x - p.size/2, p.y - p.size/2, p.size, p.size);
            } else {
                // Dibujar partícula estándar
                ctx.fillStyle = p.color;
                ctx.beginPath();
                ctx.arc(p.x, p.y, p.size, 0, Math.PI * 2);
                ctx.fill();
            }
        }
        
        ctx.restore();
        ctx.globalAlpha = 1;
    },
    
    /**
     * Limpia todas las partículas
     */
    clear: function() {
        this.activeParticles.forEach(p => p.reset());
        this.activeParticles = [];
        this.particleCount = 0;
    }
};

// Exportar para uso global
window.ParticleSystem = ParticleSystem;
