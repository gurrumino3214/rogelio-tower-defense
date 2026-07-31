/**
 * ========================================
 * TOWER.JS - Clase Base de Torre
 * ========================================
 * Implementa la lógica principal de una torre:
 * - Construcción y colocación
 * - Sistema de mejoras (hasta 5 niveles)
 * - Venta con recuperación parcial del costo
 * - Sistema de targeting con prioridades configurables
 * - Animaciones pixel art
 * - Gestión de cooldowns y disparos
 */

class Tower {
    /**
     * Crea una nueva instancia de torre
     * @param {number} x - Posición X en el mapa
     * @param {number} y - Posición Y en el mapa
     * @param {string} towerTypeId - ID del tipo de torre (registrado en TowerTypes)
     */
    constructor(x, y, towerTypeId) {
        // Configuración del tipo
        const typeConfig = TowerTypes.get(towerTypeId);
        if (!typeConfig) {
            console.error(`Tower type "${towerTypeId}" not found. Using basic.`);
            this.typeConfig = TowerTypes.get('basic');
            this.typeId = 'basic';
        } else {
            this.typeConfig = typeConfig;
            this.typeId = towerTypeId;
        }

        // Identificadores
        this.id = Tower.generateId();
        
        // Posición
        this.x = x;
        this.y = y;
        this.gridX = Math.floor(x / 32);
        this.gridY = Math.floor(y / 32);

        // Stats base (se modificarán con mejoras)
        this.level = 1;
        this.maxLevel = this.typeConfig.maxLevel || 5;
        this.damage = this.typeConfig.damage;
        this.range = this.typeConfig.range;
        this.fireRate = this.typeConfig.fireRate;
        this.cost = this.typeConfig.cost;
        
        // Estado de combate
        this.cooldown = 0;
        this.target = null;
        this.rotation = 0;
        this.priority = this.typeConfig.targetPriority || 'closest';

        // Dimensiones visuales
        this.width = this.typeConfig.visual.width;
        this.height = this.typeConfig.visual.height;

        // Animación
        this.animationFrame = 0;
        this.animationTimer = 0;
        this.isFiring = false;
        this.muzzleFlash = 0;

        // Estado de selección
        this.isSelected = false;

        // Capa de renderizado
        this.layer = Engine.layers.ENTITIES;
        this.active = true;
    }

    /**
     * Genera un ID único para la torre
     * @returns {string} ID único
     */
    static generateId() {
        return 'tower_' + Math.random().toString(36).substr(2, 9);
    }

    /**
     * Actualiza la torre en cada frame
     * @param {number} deltaTime - Tiempo delta en segundos
     */
    update(deltaTime) {
        // Reducir cooldown
        if (this.cooldown > 0) {
            this.cooldown -= deltaTime;
        }

        // Reducir muzzle flash
        if (this.muzzleFlash > 0) {
            this.muzzleFlash -= deltaTime * 10;
        }

        // Actualizar animación
        this.updateAnimation(deltaTime);

        // Buscar y atacar objetivo
        this.target = this.findTarget();
        
        if (this.target) {
            // Calcular rotación hacia el objetivo
            const dx = this.target.x - this.x;
            const dy = this.target.y - this.y;
            this.rotation = Math.atan2(dy, dx);

            // Disparar si está listo
            if (this.cooldown <= 0) {
                this.shoot();
                this.cooldown = 1 / this.fireRate;
            }
        }
    }

    /**
     * Actualiza las animaciones de la torre
     * @param {number} deltaTime - Tiempo delta en segundos
     */
    updateAnimation(deltaTime) {
        this.animationTimer += deltaTime;
        
        // Animación idle (respiración)
        const breathSpeed = 2;
        this.animationFrame = Math.sin(this.animationTimer * breathSpeed) * 0.1;

        // Resetear estado de disparo
        if (this.cooldown > 1 / this.fireRate - 0.1) {
            this.isFiring = false;
        }
    }

    /**
     * Busca un objetivo según la prioridad configurada
     * @returns {Enemy|null} El enemigo objetivo o null
     */
    findTarget() {
        // Obtener todos los enemigos activos
        const enemies = this.getAllEnemies();
        
        if (enemies.length === 0) {
            return null;
        }

        // Filtrar enemigos en rango
        const inRange = enemies.filter(enemy => {
            const dx = enemy.x - this.x;
            const dy = enemy.y - this.y;
            const distance = Math.sqrt(dx * dx + dy * dy);
            return distance <= this.range && enemy.active !== false;
        });

        if (inRange.length === 0) {
            return null;
        }

        // Aplicar prioridad
        switch (this.priority) {
            case 'first':
                return this.findFirst(inRange);
            case 'last':
                return this.findLast(inRange);
            case 'strongest':
                return this.findStrongest(inRange);
            case 'weakest':
                return this.findWeakest(inRange);
            case 'closest':
            default:
                return this.findClosest(inRange);
        }
    }

    /**
     * Obtiene todos los enemigos del juego
     * @returns {Enemy[]} Array de enemigos
     */
    getAllEnemies() {
        // Intentar obtener del sistema de entidades
        if (typeof Engine !== 'undefined' && Engine.entities) {
            return Engine.entities.filter(e => 
                e.constructor.name === 'Enemy' || 
                (e instanceof window.Enemy) ||
                (e.type && e.health !== undefined)
            );
        }
        return [];
    }

    /**
     * Encuentra el enemigo más avanzado en el camino
     * @param {Enemy[]} enemies - Lista de enemigos
     * @returns {Enemy|null}
     */
    findFirst(enemies) {
        if (enemies.length === 0) return null;
        return enemies.reduce((first, current) => {
            const firstProgress = first.progress || 0;
            const currentProgress = current.progress || 0;
            return currentProgress > firstProgress ? current : first;
        });
    }

    /**
     * Encuentra el enemigo menos avanzado en el camino
     * @param {Enemy[]} enemies - Lista de enemigos
     * @returns {Enemy|null}
     */
    findLast(enemies) {
        if (enemies.length === 0) return null;
        return enemies.reduce((last, current) => {
            const lastProgress = last.progress || 0;
            const currentProgress = current.progress || 0;
            return currentProgress < lastProgress ? current : last;
        });
    }

    /**
     * Encuentra el enemigo con más vida
     * @param {Enemy[]} enemies - Lista de enemigos
     * @returns {Enemy|null}
     */
    findStrongest(enemies) {
        if (enemies.length === 0) return null;
        return enemies.reduce((strongest, current) => {
            const strongestHealth = strongest.health || 0;
            const currentHealth = current.health || 0;
            return currentHealth > strongestHealth ? current : strongest;
        });
    }

    /**
     * Encuentra el enemigo con menos vida
     * @param {Enemy[]} enemies - Lista de enemigos
     * @returns {Enemy|null}
     */
    findWeakest(enemies) {
        if (enemies.length === 0) return null;
        return enemies.reduce((weakest, current) => {
            const weakestHealth = weakest.health || Infinity;
            const currentHealth = current.health || Infinity;
            return currentHealth < weakestHealth ? current : weakest;
        });
    }

    /**
     * Encuentra el enemigo más cercano
     * @param {Enemy[]} enemies - Lista de enemigos
     * @returns {Enemy|null}
     */
    findClosest(enemies) {
        if (enemies.length === 0) return null;
        return enemies.reduce((closest, current) => {
            const dxCurrent = current.x - this.x;
            const dyCurrent = current.y - this.y;
            const distCurrent = Math.sqrt(dxCurrent * dxCurrent + dyCurrent * dyCurrent);
            
            const dxClosest = closest.x - this.x;
            const dyClosest = closest.y - this.y;
            const distClosest = Math.sqrt(dxClosest * dxClosest + dyClosest * dyClosest);
            
            return distCurrent < distClosest ? current : closest;
        });
    }

    /**
     * Dispara al objetivo actual
     */
    shoot() {
        if (!this.target) return;

        this.isFiring = true;
        this.muzzleFlash = 1;

        // Crear proyectil usando el sistema de balas
        if (typeof Bullets !== 'undefined') {
            Bullets.createBullet(
                this.typeId,
                this.x,
                this.y,
                this.target,
                this.damage,
                this.typeConfig
            );
        }

        // Efectos especiales según tipo de torre
        this.applySpecialEffects();
    }

    /**
     * Aplica efectos especiales según el tipo de torre
     */
    applySpecialEffects() {
        const special = this.typeConfig.special;
        if (!special) return;

        // Ejemplo: efecto de cadena para torre de rayo
        if (special.chainCount && special.chainCount > 1) {
            this.applyChainLightning(special.chainCount, special.chainRange || 100);
        }
    }

    /**
     * Aplica daño en cadena (torre de rayo)
     * @param {number} chainCount - Número de enemigos a alcanzar
     * @param {number} chainRange - Rango de salto entre enemigos
     */
    applyChainLightning(chainCount, chainRange) {
        const enemies = this.getAllEnemies();
        let currentTarget = this.target;
        let damage = this.damage * 0.7; // Daño reducido en cadena

        for (let i = 0; i < chainCount - 1 && currentTarget; i++) {
            // Encontrar siguiente objetivo cercano
            const nextTarget = enemies.find(e => {
                if (e === currentTarget || !e.active) return false;
                const dx = e.x - currentTarget.x;
                const dy = e.y - currentTarget.y;
                const dist = Math.sqrt(dx * dx + dy * dy);
                return dist <= chainRange;
            });

            if (nextTarget && typeof nextTarget.takeDamage === 'function') {
                nextTarget.takeDamage(damage);
                currentTarget = nextTarget;
                damage *= 0.7; // Reducir daño en cada salto
            } else {
                break;
            }
        }
    }

    /**
     * Renderiza la torre con estilo pixel art
     * @param {CanvasRenderingContext2D} ctx - Contexto del canvas
     */
    render(ctx) {
        ctx.save();
        ctx.translate(this.x, this.y);

        const visual = this.typeConfig.visual;
        const w = this.width;
        const h = this.height;

        // Sombra
        ctx.fillStyle = 'rgba(0, 0, 0, 0.3)';
        ctx.fillRect(-w/2 + 4, -h/2 + 4, w, h);

        // Base de la torre (estilo pixel art)
        this.drawPixelBase(ctx, w, h, visual.secondaryColor);

        // Cuerpo de la torre con animación de respiración
        const scale = 1 + this.animationFrame;
        ctx.scale(scale, scale);
        this.drawPixelBody(ctx, w, h, visual.color);

        // Cañón rotatorio
        ctx.rotate(this.rotation);
        this.drawPixelBarrel(ctx, w, h, visual.secondaryColor);

        // Muzzle flash al disparar
        if (this.muzzleFlash > 0) {
            this.drawMuzzleFlash(ctx, w);
        }

        // Indicador de nivel (estrellas/puntos)
        if (this.level > 1) {
            this.drawLevelIndicator(ctx, this.level);
        }

        ctx.restore();

        // Rango cuando está seleccionada
        if (this.isSelected) {
            this.renderRange(ctx);
        }
    }

    /**
     * Dibuja la base de la torre estilo pixel art
     * @param {CanvasRenderingContext2D} ctx 
     * @param {number} w - Ancho
     * @param {number} h - Alto
     * @param {string} color - Color
     */
    drawPixelBase(ctx, w, h, color) {
        const pixelSize = 4;
        ctx.fillStyle = color;
        
        // Dibujar base cuadrada con bordes pixelados
        for (let px = -w/2; px < w/2; px += pixelSize) {
            for (let py = -h/2; py < h/2; py += pixelSize) {
                // Patrón de borde
                const isEdge = px < -w/2 + pixelSize || px > w/2 - pixelSize * 2 ||
                              py < -h/2 + pixelSize || py > h/2 - pixelSize * 2;
                
                if (isEdge) {
                    ctx.globalAlpha = 0.8;
                }
                ctx.fillRect(px, py, pixelSize - 1, pixelSize - 1);
                ctx.globalAlpha = 1;
            }
        }
    }

    /**
     * Dibuja el cuerpo de la torre estilo pixel art
     * @param {CanvasRenderingContext2D} ctx 
     * @param {number} w - Ancho
     * @param {number} h - Alto
     * @param {string} color - Color
     */
    drawPixelBody(ctx, w, h, color) {
        const pixelSize = 4;
        ctx.fillStyle = color;
        
        const bodyW = w * 0.6;
        const bodyH = h * 0.6;
        
        // Dibujar cuerpo central
        for (let px = -bodyW/2; px < bodyW/2; px += pixelSize) {
            for (let py = -bodyH/2; py < bodyH/2; py += pixelSize) {
                // Añadir variación de color para efecto pixel art
                const shade = ((px + py) % (pixelSize * 2)) / (pixelSize * 2);
                ctx.globalAlpha = 0.7 + shade * 0.3;
                ctx.fillRect(px, py, pixelSize - 1, pixelSize - 1);
            }
        }
        ctx.globalAlpha = 1;
    }

    /**
     * Dibuja el cañón de la torre estilo pixel art
     * @param {CanvasRenderingContext2D} ctx 
     * @param {number} w - Ancho
     * @param {number} h - Alto
     * @param {string} color - Color
     */
    drawPixelBarrel(ctx, w, h, color) {
        const pixelSize = 3;
        ctx.fillStyle = color;
        
        const barrelLength = w * 0.4;
        const barrelHeight = 8;
        
        // Dibujar cañón pixelado
        for (let px = 0; px < barrelLength; px += pixelSize) {
            for (let py = -barrelHeight/2; py < barrelHeight/2; py += pixelSize) {
                ctx.fillRect(px, py, pixelSize - 1, pixelSize - 1);
            }
        }
    }

    /**
     * Dibuja el efecto de muzzle flash
     * @param {CanvasRenderingContext2D} ctx 
     * @param {number} w - Ancho de referencia
     */
    drawMuzzleFlash(ctx, w) {
        const flashSize = w * 0.3 * this.muzzleFlash;
        
        ctx.fillStyle = `rgba(255, 255, 200, ${this.muzzleFlash})`;
        ctx.beginPath();
        
        // Forma de estrella para el flash
        const points = 8;
        for (let i = 0; i < points * 2; i++) {
            const radius = i % 2 === 0 ? flashSize : flashSize * 0.5;
            const angle = (Math.PI * i) / points;
            const x = Math.cos(angle) * (w * 0.5);
            const y = Math.sin(angle) * radius;
            
            if (i === 0) {
                ctx.moveTo(x, y);
            } else {
                ctx.lineTo(x, y);
            }
        }
        ctx.closePath();
        ctx.fill();
    }

    /**
     * Dibuja el indicador de nivel
     * @param {CanvasRenderingContext2D} ctx 
     * @param {number} level - Nivel actual
     */
    drawLevelIndicator(ctx, level) {
        const dotSize = 4;
        const spacing = 6;
        const totalWidth = (level - 1) * spacing;
        
        ctx.fillStyle = '#ffd700';
        for (let i = 0; i < level - 1; i++) {
            ctx.beginPath();
            ctx.arc(-totalWidth/2 + i * spacing, -this.height/2 - 8, dotSize, 0, Math.PI * 2);
            ctx.fill();
        }
    }

    /**
     * Renderiza el círculo de rango
     * @param {CanvasRenderingContext2D} ctx 
     */
    renderRange(ctx) {
        ctx.strokeStyle = 'rgba(255, 255, 255, 0.15)';
        ctx.lineWidth = 2;
        ctx.setLineDash([5, 5]);
        ctx.beginPath();
        ctx.arc(this.x, this.y, this.range, 0, Math.PI * 2);
        ctx.stroke();
        ctx.setLineDash([]);
        
        // Relleno semitransparente
        ctx.fillStyle = 'rgba(255, 255, 255, 0.05)';
        ctx.beginPath();
        ctx.arc(this.x, this.y, this.range, 0, Math.PI * 2);
        ctx.fill();
    }

    /**
     * Mejora la torre al siguiente nivel
     * @returns {boolean} True si se pudo mejorar
     */
    upgrade() {
        if (this.level >= this.maxLevel) {
            console.log('Tower already at max level');
            return false;
        }

        const upgradeCost = TowerTypes.getUpgradeCost(this.typeId, this.level);
        
        // Verificar si el jugador tiene suficiente oro
        if (typeof Game !== 'undefined' && !Game.spendGold(upgradeCost)) {
            console.log('Not enough gold to upgrade');
            return false;
        }

        // Aplicar mejoras
        const stats = TowerTypes.getUpgradedStats(this.typeId, this.level);
        this.damage = stats.damage;
        this.range = stats.range;
        this.fireRate = stats.fireRate;
        this.level++;

        console.log(`Tower upgraded to level ${this.level}`);
        return true;
    }

    /**
     * Obtiene el valor de venta de la torre
     * @returns {number} Oro obtenido al vender
     */
    getSellValue() {
        const baseValue = Math.floor(this.cost * this.typeConfig.sellMultiplier);
        const upgradeRefund = this.calculateUpgradeRefund();
        return baseValue + upgradeRefund;
    }

    /**
     * Calcula el reembolso por mejoras
     * @returns {number} Oro por mejoras
     */
    calculateUpgradeRefund() {
        if (this.level <= 1) return 0;
        
        let totalUpgradeCost = 0;
        for (let i = 1; i < this.level; i++) {
            totalUpgradeCost += TowerTypes.getUpgradeCost(this.typeId, i);
        }
        
        // Devolver 50% del costo de mejoras
        return Math.floor(totalUpgradeCost * 0.5);
    }

    /**
     * Vende la torre
     * @returns {number} Oro obtenido
     */
    sell() {
        const sellValue = this.getSellValue();
        
        if (typeof Game !== 'undefined') {
            Game.addGold(sellValue);
        }
        
        this.active = false;
        console.log(`Tower sold for ${sellValue} gold`);
        return sellValue;
    }

    /**
     * Cambia la prioridad de targeting
     * @param {string} newPriority - Nueva prioridad
     */
    setPriority(newPriority) {
        const validPriorities = ['first', 'last', 'strongest', 'weakest', 'closest'];
        if (validPriorities.includes(newPriority)) {
            this.priority = newPriority;
            console.log(`Tower priority set to: ${newPriority}`);
        }
    }

    /**
     * Cicla a la siguiente prioridad
     */
    cyclePriority() {
        const priorities = ['closest', 'first', 'last', 'strongest', 'weakest'];
        const currentIndex = priorities.indexOf(this.priority);
        const nextIndex = (currentIndex + 1) % priorities.length;
        this.setPriority(priorities[nextIndex]);
    }

    /**
     * Obtiene información detallada de la torre
     * @returns {Object} Info de la torre
     */
    getInfo() {
        return {
            id: this.id,
            typeId: this.typeId,
            name: this.typeConfig.name,
            level: this.level,
            maxLevel: this.maxLevel,
            damage: this.damage,
            range: this.range,
            fireRate: this.fireRate,
            priority: this.priority,
            sellValue: this.getSellValue(),
            nextUpgradeCost: this.level < this.maxLevel ? 
                TowerTypes.getUpgradeCost(this.typeId, this.level) : null,
            description: this.typeConfig.description
        };
    }
}

// Exportar para uso en otros módulos
if (typeof module !== 'undefined' && module.exports) {
    module.exports = Tower;
}
