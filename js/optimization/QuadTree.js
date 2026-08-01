/**
 * ========================================
 * QUADTREE.JS - Sistema de Partición Espacial
 * ========================================
 * Implementación de QuadTree para optimización de colisiones
 * y consultas espaciales en el juego Tower Defense.
 * 
 * Características:
 * - QuadTree dinámico con subdivisión recursiva
 * - Soporte para inserción, consulta y eliminación de objetos
 * - Optimizado para cientos de entidades
 * - Integración con sistema de colisiones
 */

class QuadTree {
    /**
     * Crea una instancia de QuadTree
     * @param {Object} bounds - Límites del QuadTree {x, y, width, height}
     * @param {number} [maxObjects=10] - Máximo de objetos por nodo antes de subdividir
     * @param {number} [maxLevels=5] - Máximo nivel de subdivisión
     * @param {number} [level=0] - Nivel actual (interno)
     */
    constructor(bounds, maxObjects = 10, maxLevels = 5, level = 0) {
        this.level = level;
        this.maxObjects = maxObjects;
        this.maxLevels = maxLevels;
        
        // Límites del nodo
        this.bounds = {
            x: bounds.x || 0,
            y: bounds.y || 0,
            width: bounds.width || 800,
            height: bounds.height || 600
        };
        
        // Objetos almacenados en este nodo
        this.objects = [];
        
        // Nodos hijos (null si no está subdividido)
        this.nodes = [null, null, null, null];
        
        // Estadísticas para debugging
        this.stats = {
            insertions: 0,
            queries: 0,
            subdivisions: 0
        };
    }
    
    /**
     * Obtiene los límites de un cuadrante específico
     * @param {number} quadrant - 0: NO, 1: NE, 2: SO, 3: SE
     * @returns {Object} Límites del cuadrante
     */
    getQuadrantBounds(quadrant) {
        const subWidth = this.bounds.width / 2;
        const subHeight = this.bounds.height / 2;
        const x = this.bounds.x;
        const y = this.bounds.y;
        
        switch (quadrant) {
            case 0: // Noroeste
                return { x: x, y: y, width: subWidth, height: subHeight };
            case 1: // Noreste
                return { x: x + subWidth, y: y, width: subWidth, height: subHeight };
            case 2: // Suroeste
                return { x: x, y: y + subHeight, width: subWidth, height: subHeight };
            case 3: // Sureste
                return { x: x + subWidth, y: y + subHeight, width: subWidth, height: subHeight };
            default:
                return this.bounds;
        }
    }
    
    /**
     * Subdivide el nodo actual en 4 cuadrantes
     */
    subdivide() {
        if (this.level >= this.maxLevels) return;
        
        for (let i = 0; i < 4; i++) {
            const bounds = this.getQuadrantBounds(i);
            this.nodes[i] = new QuadTree(
                bounds,
                this.maxObjects,
                this.maxLevels,
                this.level + 1
            );
        }
        
        this.stats.subdivisions++;
        
        // Redistribuir objetos existentes a los nodos hijos
        const existingObjects = this.objects;
        this.objects = [];
        
        for (const obj of existingObjects) {
            this.insert(obj);
        }
    }
    
    /**
     * Determina en qué cuadrante(s) cabe un objeto
     * @param {Object} obj - Objeto con {x, y, width, height}
     * @returns {Array<number>} Índices de cuadrantes o [-1] si cruza múltiples
     */
    getIndex(obj) {
        const indexes = [];
        
        const subWidth = this.bounds.width / 2;
        const subHeight = this.bounds.height / 2;
        const midX = this.bounds.x + subWidth;
        const midY = this.bounds.y + subHeight;
        
        const objLeft = obj.x;
        const objRight = obj.x + (obj.width || 0);
        const objTop = obj.y;
        const objBottom = obj.y + (obj.height || 0);
        
        // Verificar si cabe completamente en el cuadrante superior
        const fitsTop = objTop < midY && objBottom <= midY;
        const fitsBottom = objTop >= midY && objBottom > midY;
        
        if (fitsTop) {
            if (objRight <= midX) {
                indexes.push(0); // NO
            } else if (objLeft >= midX) {
                indexes.push(1); // NE
            }
        } else if (fitsBottom) {
            if (objRight <= midX) {
                indexes.push(2); // SO
            } else if (objLeft >= midX) {
                indexes.push(3); // SE
            }
        }
        
        // Si no cabe en ningún cuadrante, retorna -1
        return indexes.length > 0 ? indexes : [-1];
    }
    
    /**
     * Inserta un objeto en el QuadTree
     * @param {Object} obj - Objeto a insertar con {x, y, width, height, id?}
     */
    insert(obj) {
        this.stats.insertions++;
        
        // Si tiene nodos hijos, intentar insertar en ellos
        if (this.nodes[0] !== null) {
            const indexes = this.getIndex(obj);
            
            // Si cabe completamente en un cuadrante
            if (indexes.length === 1 && indexes[0] !== -1) {
                this.nodes[indexes[0]].insert(obj);
                return;
            }
        }
        
        // Insertar en este nodo
        this.objects.push(obj);
        
        // Verificar si debe subdividir
        if (this.objects.length > this.maxObjects && 
            this.level < this.maxLevels && 
            this.nodes[0] === null) {
            this.subdivide();
        }
    }
    
    /**
     * Consulta objetos que podrían colisionar con el área dada
     * @param {Object} area - Área de consulta {x, y, width, height}
     * @param {Array} [found=[]] - Array acumulador (interno)
     * @returns {Array<Object>} Objetos encontrados
     */
    query(area, found = []) {
        this.stats.queries++;
        
        const indexes = this.getIndex(area);
        
        // Si está en múltiples cuadrantes, buscar en todos los hijos
        if (indexes[0] === -1) {
            // Buscar en este nodo
            for (const obj of this.objects) {
                if (this.intersects(area, obj)) {
                    found.push(obj);
                }
            }
            
            // Buscar en todos los hijos
            for (const node of this.nodes) {
                if (node !== null) {
                    node.query(area, found);
                }
            }
        } else {
            // Buscar solo en el cuadrante específico
            for (const index of indexes) {
                if (this.nodes[index] !== null) {
                    this.nodes[index].query(area, found);
                }
            }
            
            // También buscar en este nodo
            for (const obj of this.objects) {
                if (this.intersects(area, obj)) {
                    found.push(obj);
                }
            }
        }
        
        return found;
    }
    
    /**
     * Verifica si dos rectángulos se intersectan
     * @param {Object} a - Rectángulo A {x, y, width, height}
     * @param {Object} b - Rectángulo B {x, y, width, height}
     * @returns {boolean} True si hay intersección
     */
    intersects(a, b) {
        return a.x < b.x + (b.width || 0) &&
               a.x + (a.width || 0) > b.x &&
               a.y < b.y + (b.height || 0) &&
               a.y + (a.height || 0) > b.y;
    }
    
    /**
     * Elimina un objeto del QuadTree
     * @param {Object} obj - Objeto a eliminar
     * @returns {boolean} True si se eliminó
     */
    remove(obj) {
        let removed = false;
        
        // Intentar eliminar de los nodos hijos
        for (const node of this.nodes) {
            if (node !== null) {
                if (node.remove(obj)) {
                    removed = true;
                }
            }
        }
        
        // Si no se eliminó de los hijos, buscar en este nodo
        if (!removed) {
            const index = this.objects.indexOf(obj);
            if (index > -1) {
                this.objects.splice(index, 1);
                removed = true;
            }
        }
        
        return removed;
    }
    
    /**
     * Limpia todo el QuadTree
     */
    clear() {
        this.objects = [];
        
        for (const node of this.nodes) {
            if (node !== null) {
                node.clear();
            }
        }
        
        this.nodes = [null, null, null, null];
    }
    
    /**
     * Obtiene todos los objetos en el QuadTree
     * @param {Array} [all=[]] - Array acumulador (interno)
     * @returns {Array<Object>} Todos los objetos
     */
    getAll(all = []) {
        for (const obj of this.objects) {
            all.push(obj);
        }
        
        for (const node of this.nodes) {
            if (node !== null) {
                node.getAll(all);
            }
        }
        
        return all;
    }
    
    /**
     * Obtiene estadísticas del QuadTree
     * @returns {Object} Estadísticas
     */
    getStats() {
        let totalNodes = 1;
        let totalObjects = this.objects.length;
        let maxDepth = this.level;
        
        for (const node of this.nodes) {
            if (node !== null) {
                const childStats = node.getStats();
                totalNodes += childStats.totalNodes;
                totalObjects += childStats.totalObjects;
                maxDepth = Math.max(maxDepth, childStats.maxDepth);
            }
        }
        
        return {
            totalNodes,
            totalObjects,
            maxDepth,
            currentLevel: this.level,
            objectCount: this.objects.length,
            insertions: this.stats.insertions,
            queries: this.stats.queries,
            subdivisions: this.stats.subdivisions
        };
    }
    
    /**
     * Renderiza el QuadTree para debugging
     * @param {CanvasRenderingContext2D} ctx - Contexto del canvas
     * @param {string} [color='rgba(0, 255, 0, 0.3)'] - Color de las líneas
     */
    render(ctx, color = 'rgba(0, 255, 0, 0.3)') {
        ctx.strokeStyle = color;
        ctx.lineWidth = 1;
        ctx.strokeRect(
            this.bounds.x,
            this.bounds.y,
            this.bounds.width,
            this.bounds.height
        );
        
        // Dibujar número de objetos en el centro
        if (this.objects.length > 0) {
            ctx.fillStyle = 'rgba(0, 255, 0, 0.8)';
            ctx.font = '10px Arial';
            ctx.textAlign = 'center';
            ctx.fillText(
                this.objects.length.toString(),
                this.bounds.x + this.bounds.width / 2,
                this.bounds.y + this.bounds.height / 2
            );
        }
        
        // Renderizar hijos
        for (const node of this.nodes) {
            if (node !== null) {
                node.render(ctx, color);
            }
        }
    }
}

// Exportar
if (typeof module !== 'undefined' && module.exports) {
    module.exports = QuadTree;
}
