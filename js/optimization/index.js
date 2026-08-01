/**
 * ========================================
 * OPTIMIZATION MODULE INDEX
 * ========================================
 * Exporta todos los sistemas de optimización
 */

// QuadTree para partición espacial
if (typeof QuadTree !== 'undefined') {
    window.QuadTree = QuadTree;
}

// Object Pool genérico
if (typeof ObjectPool !== 'undefined') {
    window.ObjectPool = ObjectPool;
}

// Motor de optimización principal
if (typeof OptimizationEngine !== 'undefined') {
    window.OptimizationEngine = OptimizationEngine;
}

console.log('Optimization modules loaded');
