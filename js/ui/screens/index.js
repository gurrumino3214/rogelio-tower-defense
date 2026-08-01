/**
 * ========================================
 * screens/index.js - Exportador de Pantallas
 * ========================================
 */

const UIScreens = {
    UIScreen,
    MainMenuScreen,
    HUDScreen,
    PauseScreen
};

// Hacer disponibles globalmente
if (typeof window !== 'undefined') {
    Object.assign(window, UIScreens);
}

// Exportar para Node.js
if (typeof module !== 'undefined' && module.exports) {
    module.exports = UIScreens;
}
