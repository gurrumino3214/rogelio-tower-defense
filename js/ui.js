/**
 * ========================================
 * UI.JS - Sistema de Interfaz de Usuario
 * ========================================
 * Punto de entrada principal para el sistema de UI
 * 
 * Estructura modular:
 * - components/: Componentes base (Button, Panel, Bar, Label, Item)
 * - screens/: Pantallas completas (MainMenu, HUD, Pause)
 * - systems/: Sistemas gestores (UIManager)
 */

// Cargar componentes base primero
// (Se asume que los scripts se cargan en orden en index.html)

// Estilos CSS dinámicos para efectos UI globales
const uiStyles = `
<style>
/* Animaciones de transición */
@keyframes fadeIn {
    from { opacity: 0; }
    to { opacity: 1; }
}

@keyframes fadeOut {
    from { opacity: 1; }
    to { opacity: 0; }
}

@keyframes slideIn {
    from { transform: translateY(-20px); opacity: 0; }
    to { transform: translateY(0); opacity: 1; }
}

@keyframes pulse {
    0%, 100% { opacity: 1; }
    50% { opacity: 0.7; }
}

.ui-fade-in {
    animation: fadeIn 0.3s ease;
}

.ui-fade-out {
    animation: fadeOut 0.3s ease;
}

.ui-slide-in {
    animation: slideIn 0.3s ease;
}

.ui-pulse {
    animation: pulse 2s infinite;
}
</style>
`;

// Insertar estilos cuando el DOM esté listo
if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', () => {
        document.head.insertAdjacentHTML('beforeend', uiStyles);
    });
} else {
    document.head.insertAdjacentHTML('beforeend', uiStyles);
}

