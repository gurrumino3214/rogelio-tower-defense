/**
 * ========================================
 * MAPLOADER.JS - Carga de Mapas desde JSON
 * ========================================
 * 
 * Implementa:
 * - Carga asíncrona de mapas desde archivos JSON
 * - Validación de datos del mapa
 * - Parseo y aplicación de datos al Tilemap
 * - Sistema de prefabs para objetos predefinidos
 * 
 * @module MapLoader
 */

const MapLoader = (function() {
    'use strict';

    /**
     * Clase que maneja la carga de mapas desde archivos JSON
     */
    class MapLoaderClass {
        /**
         * Crea una instancia de MapLoader
         * @param {Tilemap.Tilemap} tilemap - Instancia del Tilemap donde se cargará el mapa
         */
        constructor(tilemap) {
            this.tilemap = tilemap;
            this.loadedMaps = {};
            this.currentMap = null;
        }

        /**
         * Carga un mapa desde un archivo JSON
         * @param {string} url - URL del archivo JSON del mapa
         * @returns {Promise<Object>} Datos del mapa cargado
         */
        async loadMap(url) {
            try {
                console.log(`Loading map from: ${url}`);
                
                const response = await fetch(url);
                
                if (!response.ok) {
                    throw new Error(`HTTP error! status: ${response.status}`);
                }
                
                const mapData = await response.json();
                
                // Validar los datos del mapa
                if (!this.validateMapData(mapData)) {
                    throw new Error('Invalid map data format');
                }
                
                // Aplicar el mapa al tilemap
                this.applyMapData(mapData);
                
                // Guardar referencia al mapa cargado
                this.loadedMaps[url] = mapData;
                this.currentMap = mapData;
                
                console.log(`Map loaded successfully: ${mapData.name || 'Unnamed'}`);
                
                return mapData;
            } catch (error) {
                console.error(`Failed to load map: ${error.message}`);
                throw error;
            }
        }

        /**
         * Valida que los datos del mapa tengan el formato correcto
         * @param {Object} mapData - Datos del mapa a validar
         * @returns {boolean} True si los datos son válidos
         */
        validateMapData(mapData) {
            // Verificar propiedades requeridas
            if (!mapData.layers) {
                console.error('Map data missing "layers" property');
                return false;
            }

            // Verificar que layers sea un objeto
            if (typeof mapData.layers !== 'object') {
                console.error('Map data "layers" must be an object');
                return false;
            }

            // Verificar capas válidas
            const validLayers = ['ground', 'decoration', 'obstacles', 'path', 'effects'];
            
            for (const layerName of Object.keys(mapData.layers)) {
                if (!validLayers.includes(layerName)) {
                    console.warn(`Unknown layer: ${layerName}`);
                }
                
                const layer = mapData.layers[layerName];
                
                // Verificar que cada capa sea un array 2D
                if (!Array.isArray(layer)) {
                    console.error(`Layer "${layerName}" must be an array`);
                    return false;
                }
            }

            return true;
        }

        /**
         * Aplica los datos del mapa al tilemap
         * @param {Object} mapData - Datos del mapa a aplicar
         */
        applyMapData(mapData) {
            // Actualizar configuración del tilemap si existe en los datos
            if (mapData.tileWidth) {
                this.tilemap.tileWidth = mapData.tileWidth;
            }
            if (mapData.tileHeight) {
                this.tilemap.tileHeight = mapData.tileHeight;
            }
            if (mapData.columns) {
                this.tilemap.columns = mapData.columns;
            }
            if (mapData.rows) {
                this.tilemap.rows = mapData.rows;
            }

            // Recalcular dimensiones del mundo
            this.tilemap.worldWidth = this.tilemap.columns * this.tilemap.tileWidth;
            this.tilemap.worldHeight = this.tilemap.rows * this.tilemap.tileHeight;

            // Limpiar datos anteriores
            this.tilemap.clear();

            // Aplicar datos de cada capa
            const layerNames = ['ground', 'decoration', 'obstacles', 'path', 'effects'];
            
            for (const layerName of layerNames) {
                if (mapData.layers[layerName]) {
                    this.applyLayerData(layerName, mapData.layers[layerName]);
                }
            }

            // Aplicar configuración de visibilidad si existe
            if (mapData.layerVisibility) {
                for (const [layer, visible] of Object.entries(mapData.layerVisibility)) {
                    this.tilemap.setLayerVisibility(layer, visible);
                }
            }

            // Cargar tileset si está especificado
            if (mapData.tilesetPath) {
                this.tilemap.loadTileset(mapData.tilesetPath).catch(err => {
                    console.warn(`Could not load tileset: ${err.message}`);
                });
            }
        }

        /**
         * Aplica los datos de una capa específica
         * @param {string} layerName - Nombre de la capa
         * @param {Array<Array<number>>} layerData - Datos de la capa (array 2D)
         */
        applyLayerData(layerName, layerData) {
            for (let row = 0; row < layerData.length; row++) {
                for (let col = 0; col < layerData[row].length; col++) {
                    const tileId = layerData[row][col];
                    if (tileId !== 0) {
                        this.tilemap.setTile(col, row, tileId, layerName);
                    }
                }
            }
        }

        /**
         * Crea un mapa desde un objeto de datos (sin cargar desde archivo)
         * @param {Object} mapData - Datos del mapa
         * @returns {Object} Datos del mapa aplicado
         */
        createFromData(mapData) {
            if (!this.validateMapData(mapData)) {
                throw new Error('Invalid map data format');
            }
            
            this.applyMapData(mapData);
            this.currentMap = mapData;
            
            return mapData;
        }

        /**
         * Genera un mapa de ejemplo básico
         * @returns {Object} Datos del mapa generado
         */
        generateExampleMap() {
            const columns = 20;
            const rows = 15;
            
            const mapData = {
                name: 'Example Map',
                tileWidth: 32,
                tileHeight: 32,
                columns,
                rows,
                tilesetPath: '',
                layers: {
                    ground: [],
                    decoration: [],
                    obstacles: [],
                    path: [],
                    effects: []
                },
                layerVisibility: {
                    ground: true,
                    decoration: true,
                    obstacles: true,
                    path: false,
                    effects: true
                }
            };

            // Generar suelo base
            for (let row = 0; row < rows; row++) {
                const rowData = [];
                for (let col = 0; col < columns; col++) {
                    // Borde exterior
                    if (row === 0 || row === rows - 1 || col === 0 || col === columns - 1) {
                        rowData.push(2); // Tile de borde
                    } else {
                        rowData.push(1); // Tile de suelo normal
                    }
                }
                mapData.layers.ground.push(rowData);
            }

            // Generar camino simple en forma de L
            const pathRows = [];
            for (let row = 0; row < rows; row++) {
                const rowData = new Array(columns).fill(0);
                
                // Camino horizontal
                if (row === Math.floor(rows / 2)) {
                    for (let col = 1; col < columns - 1; col++) {
                        rowData[col] = 1;
                    }
                }
                // Camino vertical
                if (row >= Math.floor(rows / 2) && row < rows - 1) {
                    rowData[Math.floor(columns / 2)] = 1;
                }
                
                pathRows.push(rowData);
            }
            mapData.layers.path = pathRows;

            // Añadir algunos obstáculos
            const obstacleRows = new Array(rows).fill(null).map(() => new Array(columns).fill(0));
            obstacleRows[3][5] = 1;
            obstacleRows[3][6] = 1;
            obstacleRows[4][5] = 1;
            obstacleRows[8][12] = 1;
            obstacleRows[9][12] = 1;
            obstacleRows[10][12] = 1;
            mapData.layers.obstacles = obstacleRows;

            // Añadir decoración aleatoria
            const decorationRows = new Array(rows).fill(null).map(() => new Array(columns).fill(0));
            for (let i = 0; i < 10; i++) {
                const randRow = Math.floor(Math.random() * (rows - 2)) + 1;
                const randCol = Math.floor(Math.random() * (columns - 2)) + 1;
                if (obstacleRows[randRow][randCol] === 0) {
                    decorationRows[randRow][randCol] = Math.floor(Math.random() * 3) + 1;
                }
            }
            mapData.layers.decoration = decorationRows;

            return mapData;
        }

        /**
         * Guarda el mapa actual como JSON
         * @param {string} filename - Nombre del archivo para descargar
         */
        saveMap(filename = 'map.json') {
            if (!this.currentMap) {
                console.warn('No map loaded to save');
                return;
            }

            const dataStr = JSON.stringify(this.currentMap, null, 2);
            const blob = new Blob([dataStr], { type: 'application/json' });
            const url = URL.createObjectURL(blob);
            
            const link = document.createElement('a');
            link.href = url;
            link.download = filename;
            link.click();
            
            URL.revokeObjectURL(url);
            console.log(`Map saved as: ${filename}`);
        }

        /**
         * Obtiene el mapa actualmente cargado
         * @returns {Object|null} Datos del mapa actual
         */
        getCurrentMap() {
            return this.currentMap;
        }

        /**
         * Obtiene un mapa previamente cargado por URL
         * @param {string} url - URL del mapa
         * @returns {Object|null} Datos del mapa o null si no existe
         */
        getLoadedMap(url) {
            return this.loadedMaps[url] || null;
        }

        /**
         * Limpia todos los mapas cargados
         */
        clearCache() {
            this.loadedMaps = {};
            this.currentMap = null;
        }
    }

    // Exportar la clase
    return {
        MapLoader: MapLoaderClass
    };
})();

// Hacer la clase disponible globalmente
if (typeof window !== 'undefined') {
    window.MapLoader = MapLoader;
}
