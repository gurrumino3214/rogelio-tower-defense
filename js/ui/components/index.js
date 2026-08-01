/**
 * ========================================
 * components/index.js - Exportador de Componentes
 * ========================================
 */

// Exportar todos los componentes de UI
const UIComponents = {
    UIComponent,
    UIButton,
    UIPanel,
    UIBar,
    UILabel,
    UIItemImage
};

// Hacer disponibles globalmente para scripts en navegador
if (typeof window !== 'undefined') {
    Object.assign(window, UIComponents);
}

// Exportar para Node.js
if (typeof module !== 'undefined' && module.exports) {
    module.exports = UIComponents;
}
