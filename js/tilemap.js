/**
 * ========================================
 * TILEMAP.JS - Sistema de Tilemap y Grid
 * ========================================
 * 
 * Implementa:
 * - Grid configurable
 * - Coordenadas del mundo
 * - Conversión Mundo ↔ Grid
 * - Renderizado optimizado para pixel art
 * - Sistema de capas múltiples
 * 
 * @module Tilemap
 */

const Tilemap = (function() {
    'use strict';

    /**
     * Clase que representa un Tilemap
     * Maneja el grid, las capas y el renderizado del mapa
     */
    class TilemapClass {
        /**
         * Crea una instancia de Tilemap
         * @param {Object} config - Configuración del tilemap
         * @param {number} config.tileWidth - Ancho de cada tile en píxeles (default: 32)
         * @param {number} config.tileHeight - Alto de cada tile en píxeles (default: 32)
         * @param {number} config.columns - Número de columnas del grid
         * @param {number} config.rows - Número de filas del grid
         * @param {string} config.tilesetPath - Ruta al spritesheet de tiles
         */
        constructor(config = {}) {
            // Configuración de tamaño de tiles
            this.tileWidth = config.tileWidth || 32;
            this.tileHeight = config.tileHeight || 32;
            
            // Dimensiones del grid
            this.columns = config.columns || 20;
            this.rows = config.rows || 15;
            
            // Ruta al tileset (spritesheet)
            this.tilesetPath = config.tilesetPath || '';
            this.tilesetImage = null;
            
            // Dimensiones del mundo en píxeles
            this.worldWidth = this.columns * this.tileWidth;
            this.worldHeight = this.rows * this.tileHeight;
            
            // Capas del mapa
            // Orden: suelo, decoración, obstáculos, camino, efectos
            this.layers = {
                ground: [],      // Capa base (suelo)
                decoration: [],  // Elementos decorativos
                obstacles: [],   // Obstáculos colisionables
                path: [],        // Camino para enemigos
                effects: []      // Efectos visuales
            };
            
            // Datos del grid (almacena IDs de tiles por capa)
            this.gridData = {
                ground: new Array(this.rows).fill(null).map(() => new Array(this.columns).fill(0)),
                decoration: new Array(this.rows).fill(null).map(() => new Array(this.columns).fill(0)),
                obstacles: new Array(this.rows).fill(null).map(() => new Array(this.columns).fill(0)),
                path: new Array(this.rows).fill(null).map(() => new Array(this.columns).fill(0)),
                effects: new Array(this.rows).fill(null).map(() => new Array(this.columns).fill(0))
            };
            
            // Imágenes cargadas para tiles individuales (opcional)
            this.tileImages = {};
            
            // Visibilidad de cada capa
            this.layerVisibility = {
                ground: true,
                decoration: true,
                obstacles: true,
                path: false,      // Oculto por defecto (debug)
                effects: true
            };
            
            // Offset de renderizado (para cámara)
            this.renderOffsetX = 0;
            this.renderOffsetY = 0;
            
            // Tiles visibles (culling)
            this.visibleStartCol = 0;
            this.visibleEndCol = this.columns;
            this.visibleStartRow = 0;
            this.visibleEndRow = this.rows;
        }

        /**
         * Carga el tileset (spritesheet) desde una imagen
         * @param {string} path - Ruta a la imagen del tileset
         * @returns {Promise} Promesa que se resuelve cuando la imagen carga
         */
        loadTileset(path) {
            return new Promise((resolve, reject) => {
                this.tilesetPath = path;
                const img = new Image();
                img.onload = () => {
                    this.tilesetImage = img;
                    console.log(`Tileset loaded: ${path}`);
                    resolve(img);
                };
                img.onerror = () => {
                    console.error(`Failed to load tileset: ${path}`);
                    reject(new Error('Failed to load tileset'));
                };
                img.src = path;
            });
        }

        /**
         * Carga una imagen de tile individual
         * @param {string} id - Identificador del tile
         * @param {string} path - Ruta a la imagen
         * @returns {Promise} Promesa que se resuelve cuando la imagen carga
         */
        loadTileImage(id, path) {
            return new Promise((resolve, reject) => {
                const img = new Image();
                img.onload = () => {
                    this.tileImages[id] = img;
                    resolve(img);
                };
                img.onerror = () => reject(new Error(`Failed to load tile: ${path}`));
                img.src = path;
            });
        }

        /**
         * Convierte coordenadas del mundo a coordenadas del grid
         * @param {number} worldX - Posición X en el mundo (píxeles)
         * @param {number} worldY - Posición Y en el mundo (píxeles)
         * @returns {Object} {col, row} - Coordenadas del grid
         */
        worldToGrid(worldX, worldY) {
            return {
                col: Math.floor(worldX / this.tileWidth),
                row: Math.floor(worldY / this.tileHeight)
            };
        }

        /**
         * Convierte coordenadas del grid a coordenadas del mundo
         * @param {number} col - Columna del grid
         * @param {number} row - Fila del grid
         * @returns {Object} {x, y} - Posición en el mundo (píxeles, esquina superior izquierda)
         */
        gridToWorld(col, row) {
            return {
                x: col * this.tileWidth,
                y: row * this.tileHeight
            };
        }

        /**
         * Obtiene la posición central de un tile en coordenadas del mundo
         * @param {number} col - Columna del grid
         * @param {number} row - Fila del grid
         * @returns {Object} {x, y} - Centro del tile en el mundo
         */
        getTileCenter(col, row) {
            const pos = this.gridToWorld(col, row);
            return {
                x: pos.x + this.tileWidth / 2,
                y: pos.y + this.tileHeight / 2
            };
        }

        /**
         * Establece un tile en una posición específica
         * @param {number} col - Columna del grid
         * @param {number} row - Fila del grid
         * @param {number} tileId - ID del tile (0 = vacío)
         * @param {string} layer - Nombre de la capa ('ground', 'decoration', 'obstacles', 'path', 'effects')
         */
        setTile(col, row, tileId, layer = 'ground') {
            if (this.isValidPosition(col, row) && this.gridData[layer]) {
                this.gridData[layer][row][col] = tileId;
                
                // Actualizar lista de tiles activos para esta capa
                this._updateLayerTiles(layer);
            }
        }

        /**
         * Obtiene el tile en una posición específica
         * @param {number} col - Columna del grid
         * @param {number} row - Fila del grid
         * @param {string} layer - Nombre de la capa
         * @returns {number} ID del tile
         */
        getTile(col, row, layer = 'ground') {
            if (this.isValidPosition(col, row) && this.gridData[layer]) {
                return this.gridData[layer][row][col];
            }
            return 0;
        }

        /**
         * Verifica si una posición del grid es válida
         * @param {number} col - Columna
         * @param {number} row - Fila
         * @returns {boolean} True si la posición es válida
         */
        isValidPosition(col, row) {
            return col >= 0 && col < this.columns && row >= 0 && row < this.rows;
        }

        /**
         * Verifica si un tile en una capa es colisionable
         * @param {number} col - Columna
         * @param {number} row - Fila
         * @returns {boolean} True si hay obstáculo
         */
        isObstacle(col, row) {
            // Verificar capa de obstáculos
            const obstacleTile = this.getTile(col, row, 'obstacles');
            return obstacleTile !== 0;
        }

        /**
         * Actualiza la lista de tiles activos para una capa
         * @private
         * @param {string} layer - Nombre de la capa
         */
        _updateLayerTiles(layer) {
            this.layers[layer] = [];
            
            for (let row = 0; row < this.rows; row++) {
                for (let col = 0; col < this.columns; col++) {
                    const tileId = this.gridData[layer][row][col];
                    if (tileId !== 0) {
                        this.layers[layer].push({
                            col,
                            row,
                            id: tileId,
                            x: col * this.tileWidth,
                            y: row * this.tileHeight
                        });
                    }
                }
            }
        }

        /**
         * Actualiza todas las listas de tiles activos
         */
        updateAllLayers() {
            Object.keys(this.layers).forEach(layer => {
                this._updateLayerTiles(layer);
            });
        }

        /**
         * Establece la visibilidad de una capa
         * @param {string} layer - Nombre de la capa
         * @param {boolean} visible - True para mostrar, false para ocultar
         */
        setLayerVisibility(layer, visible) {
            if (this.layerVisibility.hasOwnProperty(layer)) {
                this.layerVisibility[layer] = visible;
            }
        }

        /**
         * Alterna la visibilidad de una capa
         * @param {string} layer - Nombre de la capa
         */
        toggleLayerVisibility(layer) {
            if (this.layerVisibility.hasOwnProperty(layer)) {
                this.layerVisibility[layer] = !this.layerVisibility[layer];
            }
        }

        /**
         * Calcula los tiles visibles según la cámara (culling)
         * @param {number} cameraX - Posición X de la cámara
         * @param {number} cameraY - Posición Y de la cámara
         * @param {number} cameraWidth - Ancho del viewport de la cámara
         * @param {number} cameraHeight - Alto del viewport de la cámara
         */
        calculateVisibleTiles(cameraX, cameraY, cameraWidth, cameraHeight) {
            // Calcular columnas y filas visibles
            this.visibleStartCol = Math.max(0, Math.floor(cameraX / this.tileWidth) - 1);
            this.visibleEndCol = Math.min(
                this.columns,
                Math.ceil((cameraX + cameraWidth) / this.tileWidth) + 1
            );
            this.visibleStartRow = Math.max(0, Math.floor(cameraY / this.tileHeight) - 1);
            this.visibleEndRow = Math.min(
                this.rows,
                Math.ceil((cameraY + cameraHeight) / this.tileHeight) + 1
            );
        }

        /**
         * Renderiza el tilemap completo o solo los tiles visibles
         * @param {CanvasRenderingContext2D} ctx - Contexto del canvas
         * @param {Object} camera - Cámara {x, y, width, height}
         * @param {boolean} useCulling - Usar culling para optimizar renderizado
         */
        render(ctx, camera = null, useCulling = true) {
            // Guardar estado del contexto
            ctx.save();
            
            // Aplicar offset de cámara si existe
            if (camera) {
                this.calculateVisibleTiles(camera.x, camera.y, camera.width, camera.height);
                ctx.translate(-camera.x, -camera.y);
            } else {
                // Sin cámara, renderizar todo
                this.visibleStartCol = 0;
                this.visibleEndCol = this.columns;
                this.visibleStartRow = 0;
                this.visibleEndRow = this.rows;
            }

            // Definir orden de renderizado de capas
            const layerOrder = ['ground', 'decoration', 'obstacles', 'path', 'effects'];

            // Renderizar cada capa en orden
            for (const layerName of layerOrder) {
                if (!this.layerVisibility[layerName]) continue;

                const layerTiles = this.layers[layerName];
                
                for (const tile of layerTiles) {
                    // Culling: solo renderizar tiles visibles
                    if (useCulling) {
                        if (tile.col < this.visibleStartCol || tile.col >= this.visibleEndCol ||
                            tile.row < this.visibleStartRow || tile.row >= this.visibleEndRow) {
                            continue;
                        }
                    }

                    this._drawTile(ctx, tile);
                }
            }

            // Restaurar estado del contexto
            ctx.restore();
        }

        /**
         * Dibuja un tile individual
         * @private
         * @param {CanvasRenderingContext2D} ctx - Contexto del canvas
         * @param {Object} tile - Objeto tile {col, row, id, x, y}
         */
        _drawTile(ctx, tile) {
            const tileId = tile.id;
            
            // Si hay un tileset cargado
            if (this.tilesetImage) {
                // Calcular posición en el tileset (asumiendo grid regular)
                // Esto puede personalizarse según el layout del tileset
                const tilesPerRow = Math.floor(this.tilesetImage.width / this.tileWidth);
                const sourceX = (tileId % tilesPerRow) * this.tileWidth;
                const sourceY = Math.floor(tileId / tilesPerRow) * this.tileHeight;
                
                ctx.drawImage(
                    this.tilesetImage,
                    sourceX, sourceY,           // Posición en el tileset
                    this.tileWidth, this.tileHeight,  // Tamaño del tile
                    tile.x, tile.y,             // Posición en el mundo
                    this.tileWidth, this.tileHeight   // Tamaño de destino
                );
            } 
            // Si hay una imagen individual para este tile
            else if (this.tileImages[tileId]) {
                ctx.drawImage(
                    this.tileImages[tileId],
                    tile.x, tile.y,
                    this.tileWidth, this.tileHeight
                );
            }
            // Fallback: dibujar rectángulo de color (para debug)
            else {
                this._drawDebugTile(ctx, tile);
            }
        }

        /**
         * Dibuja un tile en modo debug (rectángulo de color)
         * @private
         * @param {CanvasRenderingContext2D} ctx - Contexto del canvas
         * @param {Object} tile - Objeto tile
         */
        _drawDebugTile(ctx, tile) {
            const colors = {
                ground: '#3a3a3a',
                decoration: '#5a4a3a',
                obstacles: '#2a2a2a',
                path: '#4a4a3a',
                effects: '#3a4a5a'
            };

            // Determinar capa basándose en qué lista contiene este tile
            let layerColor = '#666666';
            for (const [layerName, tiles] of Object.entries(this.layers)) {
                if (tiles.some(t => t.col === tile.col && t.row === tile.row)) {
                    layerColor = colors[layerName] || '#666666';
                    break;
                }
            }

            ctx.fillStyle = layerColor;
            ctx.fillRect(tile.x, tile.y, this.tileWidth, this.tileHeight);
            
            // Borde para distinguir tiles
            ctx.strokeStyle = '#888888';
            ctx.lineWidth = 1;
            ctx.strokeRect(tile.x, tile.y, this.tileWidth, this.tileHeight);
        }

        /**
         * Renderiza solo una capa específica
         * @param {CanvasRenderingContext2D} ctx - Contexto del canvas
         * @param {string} layerName - Nombre de la capa a renderizar
         * @param {Object} camera - Cámara opcional
         */
        renderLayer(ctx, layerName, camera = null) {
            if (!this.layers[layerName] || !this.layerVisibility[layerName]) return;

            ctx.save();
            
            if (camera) {
                ctx.translate(-camera.x, -camera.y);
            }

            for (const tile of this.layers[layerName]) {
                this._drawTile(ctx, tile);
            }

            ctx.restore();
        }

        /**
         * Dibuja la grid completa (líneas de guía)
         * Útil para debug
         * @param {CanvasRenderingContext2D} ctx - Contexto del canvas
         * @param {Object} camera - Cámara opcional
         * @param {string} color - Color de las líneas
         */
        drawGrid(ctx, camera = null, color = 'rgba(255, 255, 255, 0.1)') {
            ctx.save();
            
            if (camera) {
                ctx.translate(-camera.x, -camera.y);
            }

            ctx.strokeStyle = color;
            ctx.lineWidth = 1;

            // Líneas verticales
            for (let col = 0; col <= this.columns; col++) {
                const x = col * this.tileWidth;
                ctx.beginPath();
                ctx.moveTo(x, 0);
                ctx.lineTo(x, this.worldHeight);
                ctx.stroke();
            }

            // Líneas horizontales
            for (let row = 0; row <= this.rows; row++) {
                const y = row * this.tileHeight;
                ctx.beginPath();
                ctx.moveTo(0, y);
                ctx.lineTo(this.worldWidth, y);
                ctx.stroke();
            }

            ctx.restore();
        }

        /**
         * Obtiene información de un tile en una posición del mundo
         * @param {number} worldX - X en el mundo
         * @param {number} worldY - Y en el mundo
         * @returns {Object} Información del tile
         */
        getTileAtWorldPosition(worldX, worldY) {
            const gridPos = this.worldToGrid(worldX, worldY);
            
            return {
                col: gridPos.col,
                row: gridPos.row,
                valid: this.isValidPosition(gridPos.col, gridPos.row),
                layers: {
                    ground: this.getTile(gridPos.col, gridPos.row, 'ground'),
                    decoration: this.getTile(gridPos.col, gridPos.row, 'decoration'),
                    obstacles: this.getTile(gridPos.col, gridPos.row, 'obstacles'),
                    path: this.getTile(gridPos.col, gridPos.row, 'path'),
                    effects: this.getTile(gridPos.col, gridPos.row, 'effects')
                },
                isObstacle: this.isObstacle(gridPos.col, gridPos.row)
            };
        }

        /**
         * Limpia todos los datos del tilemap
         */
        clear() {
            Object.keys(this.gridData).forEach(layer => {
                this.gridData[layer] = new Array(this.rows).fill(null)
                    .map(() => new Array(this.columns).fill(0));
            });
            this.updateAllLayers();
        }

        /**
         * Exporta el tilemap a un objeto JSON
         * @returns {Object} Datos del tilemap en formato JSON
         */
        toJSON() {
            return {
                tileWidth: this.tileWidth,
                tileHeight: this.tileHeight,
                columns: this.columns,
                rows: this.rows,
                tilesetPath: this.tilesetPath,
                layers: this.gridData
            };
        }

        /**
         * Importa datos desde un objeto JSON
         * @param {Object} data - Datos del tilemap
         */
        fromJSON(data) {
            if (data.tileWidth) this.tileWidth = data.tileWidth;
            if (data.tileHeight) this.tileHeight = data.tileHeight;
            if (data.columns) this.columns = data.columns;
            if (data.rows) this.rows = data.rows;
            if (data.tilesetPath) this.tilesetPath = data.tilesetPath;
            
            if (data.layers) {
                Object.assign(this.gridData, data.layers);
                this.updateAllLayers();
            }
            
            this.worldWidth = this.columns * this.tileWidth;
            this.worldHeight = this.rows * this.tileHeight;
        }
    }

    // Exportar la clase
    return {
        Tilemap: TilemapClass
    };
})();

// Hacer la clase disponible globalmente
if (typeof window !== 'undefined') {
    window.Tilemap = Tilemap;
}
