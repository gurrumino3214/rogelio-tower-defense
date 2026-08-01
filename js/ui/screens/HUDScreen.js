/**
 * ========================================
 * HUDScreen.js - Pantalla HUD en Juego
 * ========================================
 * Interfaz durante el juego con vida, oro, oleadas, FPS
 */

class HUDScreen extends UIScreen {
    constructor(canvasWidth, canvasHeight) {
        super('hud');
        
        this.canvasWidth = canvasWidth;
        this.canvasHeight = canvasHeight;
        
        // Estado del juego
        this.lives = 20;
        this.maxLives = 20;
        this.gold = 100;
        this.wave = 1;
        this.score = 0;
        this.fps = 60;
        
        // Componentes UI
        this.createComponents();
        
        // Notificaciones temporales
        this.notifications = [];
        
        // Panel de construcción (oculto por defecto)
        this.showBuildPanel = false;
        this.selectedTower = null;
    }

    createComponents() {
        // Panel de estadísticas (esquina superior izquierda)
        this.statsPanel = new UIPanel(10, 10, 180, 140, 'ESTADÍSTICAS');
        
        // Etiquetas de estadísticas
        this.labels = {
            lives: new UILabel(20, 45, 'VIDAS:', { fontSize: 12, color: '#d0d0d5' }),
            livesValue: new UILabel(100, 45, '20', { fontSize: 12, color: '#8b2e2e', bold: true }),
            gold: new UILabel(20, 70, 'ORO:', { fontSize: 12, color: '#d0d0d5' }),
            goldValue: new UILabel(100, 70, '100', { fontSize: 12, color: '#8b6b2e', bold: true }),
            wave: new UILabel(20, 95, 'OLEADA:', { fontSize: 12, color: '#d0d0d5' }),
            waveValue: new UILabel(100, 95, '1', { fontSize: 12, color: '#2e4a8b', bold: true }),
            score: new UILabel(20, 120, 'PUNTOS:', { fontSize: 12, color: '#d0d0d5' }),
            scoreValue: new UILabel(100, 120, '0', { fontSize: 12, color: '#d0d0d5', bold: true })
        };
        
        // Barra de vida del jugador (superior centro)
        this.healthBar = new UIBar(300, 15, 200, 20, this.maxLives, 'health');
        this.healthLabel = new UILabel(400, 12, 'VIDA', { 
            fontSize: 10, 
            align: 'center', 
            width: 200,
            color: '#808085' 
        });
        
        // FPS counter (esquina superior derecha)
        this.fpsLabel = new UILabel(720, 15, 'FPS: 60', { 
            fontSize: 12, 
            color: '#2e8b2e' 
        });
        
        // Botón de pausa (esquina superior derecha)
        this.pauseButton = new UIButton(720, 40, 60, 30, '⏸', () => this.onPauseClick());
        
        // Panel de construcción (inferior)
        this.buildPanel = new UIPanel(150, 480, 500, 110, 'CONSTRUIR TORRES');
        this.createBuildButtons();
        
        // Botones de mejora y venta (laterales)
        this.upgradeButton = new UIButton(650, 300, 120, 40, 'MEJORAR', () => this.onUpgradeClick());
        this.sellButton = new UIButton(650, 360, 120, 40, 'VENDER', () => this.onSellClick());
        
        // Información de torre seleccionada
        this.towerInfoPanel = new UIPanel(640, 100, 150, 180, 'TORRE');
        this.towerInfoLabels = {
            name: new UILabel(650, 130, '', { fontSize: 11, color: '#d0d0d5', bold: true }),
            damage: new UILabel(650, 150, 'DAÑO: 0', { fontSize: 10, color: '#8b2e2e' }),
            range: new UILabel(650, 165, 'ALCANCE: 0', { fontSize: 10, color: '#2e8b2e' }),
            speed: new UILabel(650, 180, 'VEL: 0', { fontSize: 10, color: '#2e4a8b' }),
            upgradeCost: new UILabel(650, 210, 'MEJORA: 0', { fontSize: 10, color: '#8b6b2e' })
        };
    }

    createBuildButtons() {
        const towerTypes = [
            { id: 'basic', name: 'BÁSICA', cost: 50, color: '#4a4a5a' },
            { id: 'sniper', name: 'FRANCO', cost: 100, color: '#2e4a8b' },
            { id: 'rapid', name: 'RÁPIDA', cost: 75, color: '#2e8b2e' },
            { id: 'cannon', name: 'CAÑÓN', cost: 150, color: '#8b2e2e' }
        ];
        
        this.buildButtons = [];
        const startX = 170;
        const buttonSize = 80;
        const spacing = 10;
        
        for (let i = 0; i < towerTypes.length; i++) {
            const tower = towerTypes[i];
            const btn = new UIItemImage(
                startX + i * (buttonSize + spacing),
                510,
                buttonSize,
                buttonSize,
                {
                    id: tower.id,
                    name: tower.name,
                    price: tower.cost,
                    color: tower.color
                },
                (item) => this.selectTowerToBuild(item)
            );
            this.buildButtons.push(btn);
        }
    }

    update(deltaTime) {
        super.update(deltaTime);
        
        // Actualizar todos los componentes
        this.statsPanel.update(deltaTime);
        Object.values(this.labels).forEach(label => label.update(deltaTime));
        this.healthBar.update(deltaTime);
        this.healthLabel.update(deltaTime);
        this.fpsLabel.update(deltaTime);
        this.pauseButton.update(deltaTime);
        
        if (this.showBuildPanel) {
            this.buildPanel.update(deltaTime);
            this.buildButtons.forEach(btn => btn.update(deltaTime));
        }
        
        this.upgradeButton.update(deltaTime);
        this.sellButton.update(deltaTime);
        this.towerInfoPanel.update(deltaTime);
        Object.values(this.towerInfoLabels).forEach(label => label.update(deltaTime));
        
        // Actualizar notificaciones
        this.notifications = this.notifications.filter(notif => {
            notif.time -= deltaTime;
            return notif.time > 0;
        });
    }

    render(ctx) {
        if (!this.visible) return;
        
        // Renderizar panel de estadísticas
        this.statsPanel.render(ctx);
        Object.values(this.labels).forEach(label => label.render(ctx));
        
        // Renderizar barra de vida
        this.healthBar.render(ctx);
        this.healthLabel.render(ctx);
        
        // Renderizar FPS
        this.fpsLabel.render(ctx);
        
        // Renderizar botón de pausa
        this.pauseButton.render(ctx);
        
        // Renderizar panel de construcción si está visible
        if (this.showBuildPanel) {
            this.buildPanel.render(ctx);
            this.buildButtons.forEach(btn => btn.render(ctx));
            
            // Indicador de torre seleccionada
            if (this.selectedTower) {
                ctx.fillStyle = '#8b6b2e';
                ctx.font = 'bold 14px "Courier New", monospace';
                ctx.textAlign = 'center';
                ctx.fillText('SELECCIONA UN LUGAR', this.canvasWidth / 2, 470);
            }
        }
        
        // Renderizar botones de mejora/venta
        this.upgradeButton.render(ctx);
        this.sellButton.render(ctx);
        
        // Renderizar info de torre
        this.towerInfoPanel.render(ctx);
        Object.values(this.towerInfoLabels).forEach(label => label.render(ctx));
        
        // Renderizar notificaciones
        this.renderNotifications(ctx);
    }

    renderNotifications(ctx) {
        let yOffset = 200;
        this.notifications.forEach(notif => {
            const alpha = Math.min(1, notif.time / 1000);
            ctx.save();
            ctx.globalAlpha = alpha;
            
            // Fondo de notificación
            ctx.fillStyle = 'rgba(26, 26, 32, 0.9)';
            ctx.fillRect(this.canvasWidth / 2 - 100, yOffset, 200, 40);
            
            // Borde
            ctx.strokeStyle = notif.color || '#8b6b2e';
            ctx.lineWidth = 2;
            ctx.strokeRect(this.canvasWidth / 2 - 100, yOffset, 200, 40);
            
            // Texto
            ctx.fillStyle = '#d0d0d5';
            ctx.font = 'bold 14px "Courier New", monospace';
            ctx.textAlign = 'center';
            ctx.textBaseline = 'middle';
            ctx.fillText(notif.text, this.canvasWidth / 2, yOffset + 20);
            
            ctx.restore();
            yOffset += 50;
        });
    }

    handleMouseMove(mx, my) {
        this.pauseButton.handleHover(mx, my);
        
        if (this.showBuildPanel) {
            this.buildButtons.forEach(btn => btn.handleHover(mx, my));
        }
        
        this.upgradeButton.handleHover(mx, my);
        this.sellButton.handleHover(mx, my);
    }

    handleClick(mx, my) {
        if (this.pauseButton.handleClick(mx, my)) return true;
        
        if (this.showBuildPanel) {
            this.buildButtons.forEach(btn => btn.handleClick(mx, my));
        }
        
        if (this.upgradeButton.handleClick(mx, my)) return true;
        if (this.sellButton.handleClick(mx, my)) return true;
        
        return false;
    }

    // Métodos de actualización de estado
    setLives(lives) {
        this.lives = lives;
        this.labels.livesValue.setText(lives.toString());
        this.healthBar.setValue(lives);
    }

    setGold(gold) {
        this.gold = gold;
        this.labels.goldValue.setText(gold.toString());
    }

    addGold(amount) {
        this.setGold(this.gold + amount);
        this.addNotification(`+${amount} ORO`, '#8b6b2e');
    }

    setWave(wave) {
        this.wave = wave;
        this.labels.waveValue.setText(wave.toString());
    }

    setScore(score) {
        this.score = score;
        this.labels.scoreValue.setText(score.toString());
    }

    addScore(points) {
        this.setScore(this.score + points);
    }

    setFPS(fps) {
        this.fps = fps;
        this.fpsLabel.setText(`FPS: ${fps}`);
        
        // Cambiar color según FPS
        if (fps >= 55) {
            this.fpsLabel.options.color = '#2e8b2e';
        } else if (fps >= 30) {
            this.fpsLabel.options.color = '#8b6b2e';
        } else {
            this.fpsLabel.options.color = '#8b2e2e';
        }
    }

    addNotification(text, color = '#8b6b2e', duration = 2000) {
        this.notifications.push({
            text: text,
            color: color,
            time: duration
        });
    }

    toggleBuildPanel() {
        this.showBuildPanel = !this.showBuildPanel;
    }

    selectTowerToBuild(towerData) {
        this.selectedTower = towerData;
        this.addNotification(`${towerData.name} - ${towerData.price} ORO`, '#8b6b2e');
    }

    onPauseClick() {
        if (typeof Game !== 'undefined' && Game.togglePause) {
            Game.togglePause();
        }
    }

    onUpgradeClick() {
        // Implementar lógica de mejora
        this.addNotification('MEJORAR TORRE', '#2e4a8b');
    }

    onSellClick() {
        // Implementar lógica de venta
        this.addNotification('VENDER TORRE', '#8b2e2e');
    }

    setSelectedTower(tower) {
        if (tower) {
            this.towerInfoPanel.show();
            this.towerInfoLabels.name.setText(tower.name || 'TORRE');
            this.towerInfoLabels.damage.setText(`DAÑO: ${tower.damage || 0}`);
            this.towerInfoLabels.range.setText(`ALCANCE: ${tower.range || 0}`);
            this.towerInfoLabels.speed.setText(`VEL: ${tower.speed || 0}`);
            this.towerInfoLabels.upgradeCost.setText(`MEJORA: ${tower.upgradeCost || 0}`);
        } else {
            this.towerInfoPanel.hide();
        }
    }
}

// Exportar
if (typeof module !== 'undefined' && module.exports) {
    module.exports = HUDScreen;
}
