// ==========================================
// ROGELIO TOWER DEFENSE - EFFECTS.JS
// ==========================================
// Sistema de efectos visuales avanzados
// Incluye: ondas de choque, brillos, destellos, auras
// ==========================================

const VisualEffects = {
    // Efectos activos
    activeEffects: [],
    
    // Pool de efectos
    effectPools: {
        shockwave: [],
        glow: [],
        beam: [],
        trail: [],
        ripple: []
    },
    
    /**
     * Inicializa el sistema de efectos
     */
    init: function() {
        console.log('[EFFECTS] Sistema de efectos visuales inicializado');
    },
    
    /**
     * Crea una onda de choque
     */
    createShockwave: function(x, y, radius = 50, color = '#FFFFFF', duration = 0.3) {
        const effect = {
            type: 'shockwave',
            x: x,
            y: y,
            radius: 0,
            maxRadius: radius,
            color: color,
            alpha: 1,
            life: 1,
            maxLife: duration,
            thickness: 5,
            
            update: function(dt) {
                this.life -= dt / 1000;
                this.alpha = this.life / this.maxLife;
                this.radius = (1 - this.alpha) * this.maxRadius;
                this.thickness = 5 * this.alpha;
                return this.life > 0;
            },
            
            draw: function(ctx) {
                ctx.save();
                ctx.globalAlpha = this.alpha;
                ctx.strokeStyle = this.color;
                ctx.lineWidth = this.thickness;
                ctx.beginPath();
                ctx.arc(this.x, this.y, this.radius, 0, Math.PI * 2);
                ctx.stroke();
                ctx.restore();
            }
        };
        
        this.activeEffects.push(effect);
        return effect;
    },
    
    /**
     * Crea un efecto de brillo/aura
     */
    createGlow: function(x, y, radius = 40, color = '#FFD700', pulse = true) {
        const effect = {
            type: 'glow',
            x: x,
            y: y,
            baseRadius: radius,
            radius: radius,
            color: color,
            alpha: 0.5,
            pulse: pulse,
            pulsePhase: 0,
            
            update: function(dt) {
                if (this.pulse) {
                    this.pulsePhase += dt / 200;
                    this.radius = this.baseRadius + Math.sin(this.pulsePhase) * 5;
                }
                return true;
            },
            
            draw: function(ctx) {
                ctx.save();
                const gradient = ctx.createRadialGradient(
                    this.x, this.y, 0,
                    this.x, this.y, this.radius
                );
                gradient.addColorStop(0, this.color.replace(')', ', 0.8)').replace('rgb', 'rgba'));
                gradient.addColorStop(0.5, this.color.replace(')', ', 0.3)').replace('rgb', 'rgba'));
                gradient.addColorStop(1, 'transparent');
                ctx.fillStyle = gradient;
                ctx.globalAlpha = this.alpha;
                ctx.beginPath();
                ctx.arc(this.x, this.y, this.radius, 0, Math.PI * 2);
                ctx.fill();
                ctx.restore();
            }
        };
        
        this.activeEffects.push(effect);
        return effect;
    },
    
    /**
     * Crea un rayo/línea de energía
     */
    createBeam: function(x1, y1, x2, y2, color = '#00BFFF', width = 3, duration = 0.15) {
        const effect = {
            type: 'beam',
            x1: x1,
            y1: y1,
            x2: x2,
            y2: y2,
            color: color,
            width: width,
            alpha: 1,
            life: 1,
            maxLife: duration,
            
            update: function(dt) {
                this.life -= dt / 1000;
                this.alpha = this.life / this.maxLife;
                return this.life > 0;
            },
            
            draw: function(ctx) {
                ctx.save();
                ctx.globalAlpha = this.alpha;
                ctx.strokeStyle = this.color;
                ctx.lineWidth = this.width;
                ctx.lineCap = 'round';
                
                // Efecto de brillo
                ctx.shadowBlur = 10;
                ctx.shadowColor = this.color;
                
                ctx.beginPath();
                ctx.moveTo(this.x1, this.y1);
                ctx.lineTo(this.x2, this.y2);
                ctx.stroke();
                
                // Línea interior más brillante
                ctx.strokeStyle = '#FFFFFF';
                ctx.lineWidth = this.width * 0.5;
                ctx.beginPath();
                ctx.moveTo(this.x1, this.y1);
                ctx.lineTo(this.x2, this.y2);
                ctx.stroke();
                
                ctx.restore();
            }
        };
        
        this.activeEffects.push(effect);
        return effect;
    },
    
    /**
     * Crea una estela/trail
     */
    createTrail: function(x, y, color = '#FFFFFF', size = 10, duration = 0.3) {
        const effect = {
            type: 'trail',
            points: [{x: x, y: y, alpha: 1, size: size}],
            color: color,
            life: 1,
            maxLife: duration,
            
            addPoint: function(x, y) {
                this.points.push({x: x, y: y, alpha: 1, size: size});
                if (this.points.length > 10) {
                    this.points.shift();
                }
            },
            
            update: function(dt) {
                this.life -= dt / 1000;
                for (let i = 0; i < this.points.length; i++) {
                    this.points[i].alpha = (i / this.points.length) * this.life;
                }
                return this.life > 0 && this.points.length > 0;
            },
            
            draw: function(ctx) {
                if (this.points.length < 2) return;
                
                ctx.save();
                ctx.lineCap = 'round';
                ctx.lineJoin = 'round';
                
                for (let i = 1; i < this.points.length; i++) {
                    const p1 = this.points[i-1];
                    const p2 = this.points[i];
                    ctx.globalAlpha = p1.alpha;
                    ctx.strokeStyle = this.color;
                    ctx.lineWidth = p1.size * p1.alpha;
                    ctx.beginPath();
                    ctx.moveTo(p1.x, p1.y);
                    ctx.lineTo(p2.x, p2.y);
                    ctx.stroke();
                }
                
                ctx.restore();
            }
        };
        
        this.activeEffects.push(effect);
        return effect;
    },
    
    /**
     * Crea una onda en el agua
     */
    createRipple: function(x, y, radius = 30, color = '#4FC3F7', duration = 0.5) {
        const effect = {
            type: 'ripple',
            x: x,
            y: y,
            radius: 0,
            maxRadius: radius,
            color: color,
            alpha: 0.8,
            life: 1,
            maxLife: duration,
            
            update: function(dt) {
                this.life -= dt / 1000;
                this.alpha = this.life / this.maxLife;
                this.radius = (1 - this.alpha) * this.maxRadius;
                return this.life > 0;
            },
            
            draw: function(ctx) {
                ctx.save();
                ctx.globalAlpha = this.alpha * 0.5;
                ctx.strokeStyle = this.color;
                ctx.lineWidth = 2;
                ctx.beginPath();
                ctx.ellipse(this.x, this.y, this.radius, this.radius * 0.6, 0, 0, Math.PI * 2);
                ctx.stroke();
                ctx.restore();
            }
        };
        
        this.activeEffects.push(effect);
        return effect;
    },
    
    /**
     * Actualiza todos los efectos
     */
    update: function(deltaTime) {
        for (let i = this.activeEffects.length - 1; i >= 0; i--) {
            const effect = this.activeEffects[i];
            const alive = effect.update(deltaTime);
            if (!alive) {
                this.activeEffects.splice(i, 1);
            }
        }
    },
    
    /**
     * Dibuja todos los efectos
     */
    draw: function(ctx) {
        for (const effect of this.activeEffects) {
            effect.draw(ctx);
        }
    },
    
    /**
     * Limpia todos los efectos
     */
    clear: function() {
        this.activeEffects = [];
    }
};

// Exportar para uso global
window.VisualEffects = VisualEffects;
