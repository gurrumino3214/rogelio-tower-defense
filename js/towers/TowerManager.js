/**
 * ========================================
 * TOWER_MANAGER.JS - Gestor de Torres
 * ========================================
 * Sistema central para gestionar todas las torres del juego:
 * - Construcción de nuevas torres
 * - Seguimiento de todas las instancias
 * - Gestión de colocación en grid
 * - Validación de posiciones válidas
 * - Integración con el sistema de economía
 */

const TowerManager = {
    /** @type {Tower[]} Todas las torres activas */
    towers: [],

    /** @type {Object} Torre actualmente seleccionada */
    selectedTower: null,

    /** @type {string|null} Tipo de torre siendo colocado */
    placingType: null,

    /** @type {Object} Configuración del grid */
    gridSize: 32,

    /**
     * Inicializa el gestor de torres
     */
    init: function() {
        this.towers = [];
        this.selectedTower = null;
        this.placingType = null;
        
        // Inicializar tipos de torre por defecto
        if (typeof TowerTypes !== 'undefined') {
            TowerTypes.initDefaults();
        }
        
        console.log('TowerManager initialized');
    },

    /**
     * Construye una nueva torre en la posición especificada
     * @param {number} x - Posición X en píxeles
     * @param {number} y - Posición Y en píxeles
     * @param {string} towerTypeId - ID del tipo de torre
     * @returns {Tower|null} La torre creada o null si falló
     */
    buildTower: function(x, y, towerTypeId) {
        // Verificar que el tipo existe
        if (!TowerTypes.has(towerTypeId)) {
            console.error(`Unknown tower type: ${towerTypeId}`);
            return null;
        }

        const config = TowerTypes.get(towerTypeId);
        
        // Verificar oro suficiente
        if (typeof Game !== 'undefined' && !Game.spendGold(config.cost)) {
            console.log('Not enough gold to build tower');
            return null;
        }

        // Alinear al grid
        const gridX = Math.floor(x / this.gridSize) * this.gridSize + this.gridSize / 2;
        const gridY = Math.floor(y / this.gridSize) * this.gridSize + this.gridSize / 2;

        // Verificar posición válida
        if (!this.isValidPosition(gridX, gridY)) {
            console.log('Invalid tower position');
            return null;
        }

        // Crear la torre
        const tower = new Tower(gridX, gridY, towerTypeId);
        
        // Añadir al engine y a la lista
        if (typeof Engine !== 'undefined') {
            Engine.addEntity(tower);
        }
        this.towers.push(tower);

        console.log(`Built ${config.name} at (${gridX}, ${gridY})`);
        return tower;
    },

    /**
     * Verifica si una posición es válida para construir
     * @param {number} x - Posición X
     * @param {number} y - Posición Y
     * @returns {boolean} True si es válida
     */
    isValidPosition: function(x, y) {
        const gridX = Math.floor(x / this.gridSize);
        const gridY = Math.floor(y / this.gridSize);

        // Verificar colisión con otras torres
        for (const tower of this.towers) {
            const tGridX = Math.floor(tower.x / this.gridSize);
            const tGridY = Math.floor(tower.y / this.gridSize);
            
            if (tGridX === gridX && tGridY === gridY) {
                return false;
            }
        }

        // Verificar colisión con el camino (si hay un mapa cargado)
        if (typeof MapLoader !== 'undefined' && MapLoader.currentMap) {
            const tile = MapLoader.currentMap.getTile(gridX, gridY);
            if (tile && tile.type === 'path') {
                return false;
            }
        }

        // Verificar límites del mapa
        if (typeof MapLoader !== 'undefined' && MapLoader.currentMap) {
            const mapWidth = MapLoader.currentMap.width * this.gridSize;
            const mapHeight = MapLoader.currentMap.height * this.gridSize;
            
            if (x < 0 || x > mapWidth || y < 0 || y > mapHeight) {
                return false;
            }
        }

        return true;
    },

    /**
     * Obtiene una torre por su ID
     * @param {string} id - ID de la torre
     * @returns {Tower|null}
     */
    getTowerById: function(id) {
        return this.towers.find(t => t.id === id) || null;
    },

    /**
     * Selecciona una torre
     * @param {Tower} tower - Torre a seleccionar
     */
    selectTower: function(tower) {
        // Deseleccionar anterior
        if (this.selectedTower) {
            this.selectedTower.isSelected = false;
        }

        this.selectedTower = tower;
        
        if (tower) {
            tower.isSelected = true;
            console.log(`Selected tower: ${tower.typeConfig.name}`);
            
            // Mostrar info en UI
            if (typeof UI !== 'undefined' && typeof UI.showTowerInfo === 'function') {
                UI.showTowerInfo(tower.getInfo());
            }
        }
    },

    /**
     * Deselecciona la torre actual
     */
    deselectTower: function() {
        if (this.selectedTower) {
            this.selectedTower.isSelected = false;
            this.selectedTower = null;
            
            if (typeof UI !== 'undefined' && typeof UI.hideTowerInfo === 'function') {
                UI.hideTowerInfo();
            }
        }
    },

    /**
     * Inicia el modo colocación de torres
     * @param {string} towerTypeId - Tipo de torre a colocar
     */
    startPlacing: function(towerTypeId) {
        if (!TowerTypes.has(towerTypeId)) {
            console.error(`Unknown tower type: ${towerTypeId}`);
            return;
        }

        this.placingType = towerTypeId;
        this.deselectTower();
        
        console.log(`Placing mode: ${TowerTypes.get(towerTypeId).name}`);
        
        if (typeof UI !== 'undefined' && typeof UI.showPlacementPreview === 'function') {
            UI.showPlacementPreview(towerTypeId);
        }
    },

    /**
     * Cancela el modo colocación
     */
    cancelPlacing: function() {
        this.placingType = null;
        
        if (typeof UI !== 'undefined' && typeof UI.hidePlacementPreview === 'function') {
            UI.hidePlacementPreview();
        }
    },

    /**
     * Intenta colocar una torre en la posición del mouse
     * @param {number} mouseX - X del mouse
     * @param {number} mouseY - Y del mouse
     * @returns {Tower|null}
     */
    tryPlaceTower: function(mouseX, mouseY) {
        if (!this.placingType) return null;

        // Convertir coordenadas de pantalla a mundo
        let worldX = mouseX;
        let worldY = mouseY;
        
        if (typeof Engine !== 'undefined') {
            const worldPos = Engine.screenToWorld(mouseX, mouseY);
            worldX = worldPos.x;
            worldY = worldPos.y;
        }

        const tower = this.buildTower(worldX, worldY, this.placingType);
        
        if (tower) {
            this.cancelPlacing();
            return tower;
        }
        
        return null;
    },

    /**
     * Elimina una torre (sin reembolso)
     * @param {Tower} tower - Torre a eliminar
     */
    removeTower: function(tower) {
        const index = this.towers.indexOf(tower);
        if (index > -1) {
            this.towers.splice(index, 1);
            tower.active = false;
            
            if (this.selectedTower === tower) {
                this.deselectTower();
            }
            
            console.log('Tower removed');
        }
    },

    /**
     * Obtiene todas las torres en un rango
     * @param {number} x - Centro X
     * @param {number} y - Centro Y
     * @param {number} radius - Radio de búsqueda
     * @returns {Tower[]} Torres en rango
     */
    getTowersInRange: function(x, y, radius) {
        return this.towers.filter(tower => {
            const dx = tower.x - x;
            const dy = tower.y - y;
            const distance = Math.sqrt(dx * dx + dy * dy);
            return distance <= radius;
        });
    },

    /**
     * Obtiene estadísticas globales de las torres
     * @returns {Object} Estadísticas
     */
    getStats: function() {
        const stats = {
            total: this.towers.length,
            byType: {},
            averageLevel: 0,
            totalDamage: 0
        };

        let totalLevels = 0;

        for (const tower of this.towers) {
            // Contar por tipo
            if (!stats.byType[tower.typeId]) {
                stats.byType[tower.typeId] = 0;
            }
            stats.byType[tower.typeId]++;

            // Sumar niveles y daño
            totalLevels += tower.level;
            stats.totalDamage += tower.damage;
        }

        if (this.towers.length > 0) {
            stats.averageLevel = (totalLevels / this.towers.length).toFixed(1);
        }

        return stats;
    },

    /**
     * Renderiza el preview de colocación
     * @param {CanvasRenderingContext2D} ctx 
     * @param {number} mouseX - X del mouse
     * @param {number} mouseY - Y del mouse
     */
    renderPlacementPreview: function(ctx, mouseX, mouseY) {
        if (!this.placingType) return;

        const config = TowerTypes.get(this.placingType);
        if (!config) return;

        // Convertir a coordenadas del mundo
        let worldX = mouseX;
        let worldY = mouseY;
        
        if (typeof Engine !== 'undefined') {
            const worldPos = Engine.screenToWorld(mouseX, mouseY);
            worldX = worldPos.x;
            worldY = worldPos.y;
        }

        // Alinear al grid
        const gridX = Math.floor(worldX / this.gridSize) * this.gridSize + this.gridSize / 2;
        const gridY = Math.floor(worldY / this.gridSize) * this.gridSize + this.gridSize / 2;

        // Verificar validez
        const isValid = this.isValidPosition(gridX, gridY);

        // Dibujar rango
        ctx.strokeStyle = isValid ? 'rgba(100, 255, 100, 0.5)' : 'rgba(255, 100, 100, 0.5)';
        ctx.lineWidth = 2;
        ctx.setLineDash([5, 5]);
        ctx.beginPath();
        ctx.arc(gridX, gridY, config.range, 0, Math.PI * 2);
        ctx.stroke();
        ctx.setLineDash([]);

        // Relleno semitransparente
        ctx.fillStyle = isValid ? 'rgba(100, 255, 100, 0.1)' : 'rgba(255, 100, 100, 0.1)';
        ctx.beginPath();
        ctx.arc(gridX, gridY, config.range, 0, Math.PI * 2);
        ctx.fill();

        // Dibujar preview de la torre
        ctx.globalAlpha = 0.7;
        ctx.fillStyle = config.visual.color;
        ctx.fillRect(
            gridX - config.visual.width / 2,
            gridY - config.visual.height / 2,
            config.visual.width,
            config.visual.height
        );
        ctx.globalAlpha = 1;

        // Dibujar costo
        ctx.fillStyle = '#ffffff';
        ctx.font = '14px Arial';
        ctx.textAlign = 'center';
        ctx.fillText(`${config.cost}g`, gridX, gridY - config.visual.height / 2 - 8);
    },

    /**
     * Actualiza todas las torres
     * @param {number} deltaTime - Tiempo delta
     */
    update: function(deltaTime) {
        // Las torres se actualizan individualmente através del engine
        // Aquí podemos añadir lógica global si es necesaria
        
        // Limpiar torres inactivas
        this.towers = this.towers.filter(t => t.active);
    },

    /**
     * Guarda el estado de las torres
     * @returns {Object} Estado serializable
     */
    save: function() {
        return {
            towers: this.towers.map(t => ({
                typeId: t.typeId,
                x: t.x,
                y: t.y,
                level: t.level,
                priority: t.priority
            }))
        };
    },

    /**
     * Carga el estado de las torres
     * @param {Object} data - Datos guardados
     */
    load: function(data) {
        this.towers = [];
        
        if (data && data.towers) {
            for (const towerData of data.towers) {
                const tower = this.buildTower(towerData.x, towerData.y, towerData.typeId);
                if (tower) {
                    tower.level = towerData.level;
                    tower.priority = towerData.priority;
                    
                    // Recalcular stats según nivel
                    if (tower.level > 1) {
                        const stats = TowerTypes.getUpgradedStats(tower.typeId, tower.level - 1);
                        tower.damage = stats.damage;
                        tower.range = stats.range;
                        tower.fireRate = stats.fireRate;
                    }
                }
            }
        }
    }
};

// Exportar para uso en otros módulos
if (typeof module !== 'undefined' && module.exports) {
    module.exports = TowerManager;
}
