/**
 * ========================================
 * MainMenuScreen.js - Pantalla de Menú Principal
 * ========================================
 * Menú principal con selección de mapas, dificultad
 * y opciones del juego
 */

class MainMenuScreen extends UIScreen {
    constructor(canvasWidth, canvasHeight) {
        super('mainMenu');
        
        this.canvasWidth = canvasWidth;
        this.canvasHeight = canvasHeight;
        
        // Elementos del menú
        this.titleY = 80;
        this.menuStartY = 200;
        this.buttonWidth = 250;
        this.buttonHeight = 45;
        this.buttonSpacing = 15;
        
        this.selectedMapIndex = 0;
        this.selectedDifficulty = 'normal';
        this.showMapSelector = false;
        this.showDifficultySelector = false;
        this.showOptions = false;
        
        this.maps = [
            { id: 'dark_forest', name: 'BOSQUE OSCURO', desc: 'Terreno boscoso con caminos sinuosos' },
            { id: 'cursed_castle', name: 'CASTILLO MALDITO', desc: 'Murallas antiguas llenas de peligro' },
            { id: 'abyssal_depths', name: 'PROFUNDIDADES ABISALES', desc: 'Cuevas subterráneas oscuras' },
            { id: 'crimson_peaks', name: 'PICOS CARMESÍES', desc: 'Montañas teñidas de sangre' }
        ];
        
        this.difficulties = [
            { id: 'easy', name: 'FÁCIL', multiplier: 0.75 },
            { id: 'normal', name: 'NORMAL', multiplier: 1.0 },
            { id: 'hard', name: 'DIFÍCIL', multiplier: 1.5 },
            { id: 'nightmare', name: 'PESADILLA', multiplier: 2.0 }
        ];
        
        this.createButtons();
        this.createLabels();
    }

    createButtons() {
        const centerX = (this.canvasWidth - this.buttonWidth) / 2;
        
        // Botones principales
        this.buttons = {
            play: new UIButton(
                centerX, this.menuStartY, this.buttonWidth, this.buttonHeight,
                'INICIAR JUEGO',
                () => this.onPlayClick()
            ),
            maps: new UIButton(
                centerX, this.menuStartY + this.buttonHeight + this.buttonSpacing, this.buttonWidth, this.buttonHeight,
                'SELECCIONAR MAPA',
                () => this.onMapsClick()
            ),
            difficulty: new UIButton(
                centerX, this.menuStartY + (this.buttonHeight + this.buttonSpacing) * 2, this.buttonWidth, this.buttonHeight,
                'DIFICULTAD: NORMAL',
                () => this.onDifficultyClick()
            ),
            options: new UIButton(
                centerX, this.menuStartY + (this.buttonHeight + this.buttonSpacing) * 3, this.buttonWidth, this.buttonHeight,
                'OPCIONES',
                () => this.onOptionsClick()
            ),
            credits: new UIButton(
                centerX, this.menuStartY + (this.buttonHeight + this.buttonSpacing) * 4, this.buttonWidth, this.buttonHeight,
                'CRÉDITOS',
                () => this.onCreditsClick()
            )
        };
        
        // Botones de selección de mapa
        this.mapButtons = [];
        for (let i = 0; i < this.maps.length; i++) {
            this.mapButtons.push(new UIButton(
                centerX, 150 + i * 60, this.buttonWidth, 45,
                this.maps[i].name,
                () => this.selectMap(i)
            ));
        }
        
        // Botones de dificultad
        this.difficultyButtons = [];
        for (let i = 0; i < this.difficulties.length; i++) {
            this.difficultyButtons.push(new UIButton(
                centerX, 150 + i * 55, this.buttonWidth, 45,
                this.difficulties[i].name,
                () => this.selectDifficulty(i)
            ));
        }
        
        // Botones de opciones
        this.optionButtons = {
            fullscreen: new UIButton(centerX, 180, this.buttonWidth, 40, 'PANTALLA COMPLETA', () => this.toggleFullscreen()),
            music: new UIButton(centerX, 240, this.buttonWidth, 40, 'MÚSICA: ON', () => this.toggleMusic()),
            sfx: new UIButton(centerX, 300, this.buttonWidth, 40, 'SONIDOS: ON', () => this.toggleSFX()),
            back: new UIButton(centerX, 450, this.buttonWidth, 40, 'VOLVER', () => this.closeOptions())
        };
        
        // Botón volver para selectores
        this.backButton = new UIButton(
            centerX, 500, this.buttonWidth, 40,
            'VOLVER',
            () => this.closeSelectors()
        );
    }

    createLabels() {
        // Título principal
        this.titleLabel = new UILabel(
            0, this.titleY, 'TOWER DEFENSE',
            {
                width: this.canvasWidth,
                fontSize: 48,
                align: 'center',
                color: '#d0d0d5',
                uppercase: true,
                letterSpacing: 8,
                bold: true
            }
        );
        
        // Subtítulo
        this.subtitleLabel = new UILabel(
            0, this.titleY + 55, 'Dark Pixel Art Edition',
            {
                width: this.canvasWidth,
                fontSize: 16,
                align: 'center',
                color: '#808085',
                letterSpacing: 4
            }
        );
        
        // Descripción del mapa
        this.mapDescLabel = new UILabel(
            0, 450, '',
            {
                width: this.canvasWidth,
                fontSize: 12,
                align: 'center',
                color: '#8b6b2e'
            }
        );
    }

    update(deltaTime) {
        super.update(deltaTime);
        
        // Actualizar todos los botones
        Object.values(this.buttons).forEach(btn => btn.update(deltaTime));
        this.mapButtons.forEach(btn => btn.update(deltaTime));
        this.difficultyButtons.forEach(btn => btn.update(deltaTime));
        Object.values(this.optionButtons).forEach(btn => btn.update(deltaTime));
        this.backButton.update(deltaTime);
        
        // Actualizar labels
        this.titleLabel.update(deltaTime);
        this.subtitleLabel.update(deltaTime);
        this.mapDescLabel.update(deltaTime);
    }

    render(ctx) {
        if (!this.visible) return;
        
        // Fondo semi-transparente
        ctx.fillStyle = 'rgba(10, 10, 12, 0.95)';
        ctx.fillRect(0, 0, this.canvasWidth, this.canvasHeight);
        
        // Renderizar título
        this.titleLabel.render(ctx);
        this.subtitleLabel.render(ctx);
        
        // Renderizar según estado
        if (this.showOptions) {
            this.renderOptions(ctx);
        } else if (this.showMapSelector) {
            this.renderMapSelector(ctx);
        } else if (this.showDifficultySelector) {
            this.renderDifficultySelector(ctx);
        } else {
            // Botones principales
            Object.values(this.buttons).forEach(btn => btn.render(ctx));
        }
    }

    renderMapSelector(ctx) {
        ctx.fillStyle = '#d0d0d5';
        ctx.font = 'bold 18px "Courier New", monospace';
        ctx.textAlign = 'center';
        ctx.fillText('SELECCIONAR MAPA', this.canvasWidth / 2, 120);
        
        this.mapButtons.forEach(btn => btn.render(ctx));
        this.backButton.render(ctx);
        
        // Mostrar descripción
        const map = this.maps[this.selectedMapIndex];
        this.mapDescLabel.setText(`${map.name} - ${map.desc}`);
        this.mapDescLabel.render(ctx);
    }

    renderDifficultySelector(ctx) {
        ctx.fillStyle = '#d0d0d5';
        ctx.font = 'bold 18px "Courier New", monospace';
        ctx.textAlign = 'center';
        ctx.fillText('SELECCIONAR DIFICULTAD', this.canvasWidth / 2, 120);
        
        this.difficultyButtons.forEach(btn => btn.render(ctx));
        this.backButton.render(ctx);
    }

    renderOptions(ctx) {
        ctx.fillStyle = '#d0d0d5';
        ctx.font = 'bold 18px "Courier New", monospace';
        ctx.textAlign = 'center';
        ctx.fillText('OPCIONES', this.canvasWidth / 2, 120);
        
        Object.values(this.optionButtons).forEach(btn => btn.render(ctx));
    }

    handleMouseMove(mx, my) {
        if (!this.visible) return;
        
        if (this.showOptions) {
            Object.values(this.optionButtons).forEach(btn => btn.handleHover(mx, my));
        } else if (this.showMapSelector) {
            this.mapButtons.forEach(btn => btn.handleHover(mx, my));
            this.backButton.handleHover(mx, my);
        } else if (this.showDifficultySelector) {
            this.difficultyButtons.forEach(btn => btn.handleHover(mx, my));
            this.backButton.handleHover(mx, my);
        } else {
            Object.values(this.buttons).forEach(btn => btn.handleHover(mx, my));
        }
    }

    handleClick(mx, my) {
        if (!this.visible) return false;
        
        if (this.showOptions) {
            Object.values(this.optionButtons).forEach(btn => btn.handleClick(mx, my));
            return true;
        }
        
        if (this.showMapSelector) {
            this.mapButtons.forEach(btn => btn.handleClick(mx, my));
            this.backButton.handleClick(mx, my);
            return true;
        }
        
        if (this.showDifficultySelector) {
            this.difficultyButtons.forEach(btn => btn.handleClick(mx, my));
            this.backButton.handleClick(mx, my);
            return true;
        }
        
        Object.values(this.buttons).forEach(btn => btn.handleClick(mx, my));
        return true;
    }

    onPlayClick() {
        if (typeof Game !== 'undefined' && Game.startGame) {
            Game.startGame({
                map: this.maps[this.selectedMapIndex].id,
                difficulty: this.selectedDifficulty
            });
        }
    }

    onMapsClick() {
        this.showMapSelector = true;
    }

    onDifficultyClick() {
        this.showDifficultySelector = true;
    }

    onOptionsClick() {
        this.showOptions = true;
    }

    onCreditsClick() {
        // Implementar pantalla de créditos
        console.log('Créditos');
    }

    selectMap(index) {
        this.selectedMapIndex = index;
        this.buttons.maps.setText(this.maps[index].name);
    }

    selectDifficulty(index) {
        this.selectedDifficulty = this.difficulties[index].id;
        this.buttons.difficulty.setText(`DIFICULTAD: ${this.difficulties[index].name}`);
    }

    closeSelectors() {
        this.showMapSelector = false;
        this.showDifficultySelector = false;
    }

    closeOptions() {
        this.showOptions = false;
    }

    toggleFullscreen() {
        if (!document.fullscreenElement) {
            document.documentElement.requestFullscreen();
        } else {
            document.exitFullscreen();
        }
    }

    toggleMusic() {
        // Implementar toggle de música
        const btn = this.optionButtons.music;
        btn.setText(btn.text.includes('ON') ? 'MÚSICA: OFF' : 'MÚSICA: ON');
    }

    toggleSFX() {
        // Implementar toggle de SFX
        const btn = this.optionButtons.sfx;
        btn.setText(btn.text.includes('ON') ? 'SONIDOS: OFF' : 'SONIDOS: ON');
    }
}

// Exportar
if (typeof module !== 'undefined' && module.exports) {
    module.exports = MainMenuScreen;
}
