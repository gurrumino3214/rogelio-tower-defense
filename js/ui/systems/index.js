/**
 * ========================================
 * systems/index.js - Exportador de Sistemas
 * ========================================
 */

const UISystems = {
    UIManager
};

// Hacer disponibles globalmente
if (typeof window !== 'undefined') {
    Object.assign(window, UISystems);
}

// Exportar para Node.js
if (typeof module !== 'undefined' && module.exports) {
    module.exports = UISystems;
}
