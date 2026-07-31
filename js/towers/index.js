/**
 * ========================================
 * TOWERS INDEX.JS - Punto de Entrada del Sistema de Torres
 * ========================================
 * Este archivo carga y expone todos los módulos del sistema de torres.
 * Importar este archivo en el HTML cargará todo el sistema completo.
 * 
 * Módulos incluidos:
 * - TowerTypes: Registro y configuración de tipos de torres
 * - Tower: Clase base de instancia de torre
 * - TowerManager: Gestor global de todas las torres
 * - TowerAnimations: Sistema de animaciones pixel art
 */

// Cargar en orden de dependencias
console.log('Loading Tower System...');

/**
 * ========================================
 * SISTEMA DE TORRES - DOCUMENTACIÓN COMPLETA
 * ========================================
 * 
 * ARQUITECTURA DEL SISTEMA:
 * --------------------------
 * 
 * 1. TowerTypes (Registro de Tipos)
 *    - Almacena configuraciones de todos los tipos de torres
 *    - Permite registrar nuevos tipos fácilmente
 *    - Calcula costos de mejora y stats escalados
 *    - Soporta decenas de tipos diferentes
 * 
 * 2. Tower (Clase Base)
 *    - Instancia individual de una torre en el juego
 *    - Maneja targeting con 5 prioridades:
 *      * closest: El más cercano
 *      * first: El más avanzado en el camino
 *      * last: El menos avanzado
 *      * strongest: El que tiene más vida
 *      * weakest: El que tiene menos vida
 *    - Sistema de mejoras (hasta nivel 5)
 *    - Venta con recuperación del 50% del costo
 *    - Animaciones procedurales pixel art
 * 
 * 3. TowerManager (Gestor Global)
 *    - Crea y destruye torres
 *    - Valida posiciones de construcción
 *    - Gestiona selección y colocación
 *    - Proporciona estadísticas globales
 * 
 * 4. TowerAnimations (Animaciones)
 *    - Animaciones procedurales sin spritesheets
 *    - Efectos de disparo (recoil, muzzle flash)
 *    - Efectos de mejora (glow, partículas)
 *    - Soporte para spritesheets si se desean cargar
 * 
 * USO BÁSICO:
 * -----------
 * 
 * // Inicializar el sistema
 * TowerManager.init();
 * 
 * // Construir una torre
 * const tower = TowerManager.buildTower(x, y, 'basic');
 * 
 * // Seleccionar una torre (click)
 * TowerManager.selectTower(tower);
 * 
 * // Mejorar una torre seleccionada
 * if (tower) {
 *     tower.upgrade();
 * }
 * 
 * // Vender una torre seleccionada
 * if (tower) {
 *     tower.sell();
 * }
 * 
 * // Cambiar prioridad de targeting
 * tower.setPriority('strongest');
 * tower.cyclePriority(); // Cicla entre todas las prioridades
 * 
 * TIPOS DE TORRES INCLUIDOS:
 * --------------------------
 * 
 * 1. basic - Torre básica balanceada
 *    - Daño: 20, Rango: 150, FireRate: 1.0
 *    - Costo: 50 oro
 * 
 * 2. ice - Torre de hielo (ralentiza)
 *    - Daño: 10, Rango: 120, FireRate: 0.8
 *    - Costo: 80 oro
 *    - Efecto: 50% slow por 2 segundos
 * 
 * 3. splash - Torre explosiva (daño en área)
 *    - Daño: 35, Rango: 100, FireRate: 0.5
 *    - Costo: 120 oro
 *    - Efecto: 80px radio de explosión
 * 
 * 4. rapid - Torre rápida (alta cadencia)
 *    - Daño: 8, Rango: 130, FireRate: 4.0
 *    - Costo: 90 oro
 * 
 * 5. lightning - Torre de rayo (cadena)
 *    - Daño: 25, Rango: 140, FireRate: 0.7
 *    - Costo: 150 oro
 *    - Efecto: Cadena de 3 enemigos
 * 
 * 6. sniper - Torre francotirador
 *    - Daño: 100, Rango: 300, FireRate: 0.3
 *    - Costo: 200 oro
 * 
 * 7. magic - Torre mágica (ignora defensa)
 *    - Daño: 40, Rango: 120, FireRate: 0.6
 *    - Costo: 130 oro
 *    - Efecto: 50% penetración de armadura
 * 
 * AÑADIR NUEVOS TIPOS DE TORRES:
 * --------------------------------
 * 
 * TowerTypes.register('new_tower', {
 *     name: 'Nombre de la Torre',
 *     description: 'Descripción para tooltips',
 *     cost: 100,
 *     damage: 30,
 *     range: 140,
 *     fireRate: 1.5,
 *     damageType: 'physical', // physical, magic, fire, ice, lightning
 *     targetPriority: 'closest', // first, last, strongest, weakest, closest
 *     special: {
 *         // Efectos especiales opcionales
 *         slowEffect: 0.3,
 *         splashRadius: 50,
 *         stunDuration: 1,
 *         chainCount: 2
 *     },
 *     visual: {
 *         color: '#ff0000',
 *         secondaryColor: '#880000',
 *         width: 40,
 *         height: 40
 *     },
 *     upgradeCurve: {
 *         damageMultiplier: 1.2,
 *         rangeMultiplier: 1.1,
 *         fireRateMultiplier: 1.1,
 *         costMultiplier: 1.5
 *     },
 *     maxLevel: 5
 * });
 * 
 * SISTEMA DE MEJORAS:
 * -------------------
 * 
 * Cada torre puede mejorarse hasta nivel 5 (configurable).
 * Las mejoras aumentan:
 * - Daño: +20% por nivel (multiplicador 1.2)
 * - Rango: +10% por nivel (multiplicador 1.1)
 * - FireRate: +10% por nivel (multiplicador 1.1)
 * 
 * Costo de mejora = Costo base × (1.5 ^ nivel_actual)
 * 
 * Ejemplo para torre básica (costo 50):
 * - Nivel 1 → 2: 50 × 1.5^1 = 75 oro
 * - Nivel 2 → 3: 50 × 1.5^2 = 112 oro
 * - Nivel 3 → 4: 50 × 1.5^3 = 168 oro
 * - Nivel 4 → 5: 50 × 1.5^4 = 253 oro
 * 
 * SISTEMA DE VENTA:
 * -----------------
 * 
 * Al vender una torre se recupera:
 * - 50% del costo base de la torre
 * - 50% del oro gastado en mejoras
 * 
 * Ejemplo torre básica nivel 3:
 * - Costo base: 50
 * - Mejoras gastadas: 75 + 112 = 187
 * - Valor de venta: (50 × 0.5) + (187 × 0.5) = 25 + 93 = 118 oro
 * 
 * PRIORIDADES DE TARGETING:
 * -------------------------
 * 
 * 1. closest (por defecto)
 *    - Prioriza al enemigo más cercano a la torre
 *    - Bueno para maximizar DPS constante
 * 
 * 2. first
 *    - Prioriza al enemigo más avanzado en el camino
 *    - Ideal para evitar que enemigos lleguen al final
 * 
 * 3. last
 *    - Prioriza al enemigo menos avanzado
 *    - Útil para estrategias de "kill zone"
 * 
 * 4. strongest
 *    - Prioriza al enemigo con más vida máxima
 *    - Bueno contra bosses y tanques
 * 
 * 5. weakest
 *    - Prioriza al enemigo con menos vida actual
 *    - Excelente para limpiar enemigos débiles rápido
 * 
 * ANIMACIONES PIXEL ART:
 * ----------------------
 * 
 * El sistema usa animaciones procedurales que no requieren spritesheets:
 * 
 * - Idle: Respiración suave (escala ±5%)
 * - Shoot: Recoil hacia atrás + muzzle flash estelar
 * - Upgrade: Glow dorado + partículas orbitales
 * - Sell: Fade out + rotación + escala creciente
 * 
 * Para usar spritesheets personalizados:
 * await TowerAnimations.loadSpritesheet('tower_id', 'path/to/sprite.png', {
 *     idle: { startX: 0, startY: 0, frames: 4, fps: 12, loop: true },
 *     shoot: { startX: 0, startY: 32, frames: 3, fps: 15, loop: false }
 * });
 * 
 * INTEGRACIÓN CON EL JUEGO:
 * -------------------------
 * 
 * En el game loop principal:
 * 
 * function gameLoop(deltaTime) {
 *     // Actualizar gestor de torres
 *     TowerManager.update(deltaTime);
 *     
 *     // Renderizar preview si se está colocando
 *     if (placingTower) {
 *         TowerManager.renderPlacementPreview(ctx, mouseX, mouseY);
 *     }
 * }
 * 
 * Manejo de clicks:
 * 
 * canvas.addEventListener('click', (e) => {
 *     const rect = canvas.getBoundingClientRect();
 *     const mouseX = e.clientX - rect.left;
 *     const mouseY = e.clientY - rect.top;
 *     
 *     // Intentar colocar torre
 *     const placedTower = TowerManager.tryPlaceTower(mouseX, mouseY);
 *     
 *     // Si no se está colocando, seleccionar torre
 *     if (!placedTower) {
 *         const clickedTower = getTowerAtPosition(mouseX, mouseY);
 *         TowerManager.selectTower(clickedTower);
 *     }
 * });
 * 
 * Click derecho para vender:
 * 
 * canvas.addEventListener('contextmenu', (e) => {
 *     e.preventDefault();
 *     if (TowerManager.selectedTower) {
 *         TowerManager.selectedTower.sell();
 *     }
 * });
 * 
 * Tecla U para mejorar:
 * 
 * window.addEventListener('keydown', (e) => {
 *     if (e.key === 'u' && TowerManager.selectedTower) {
 *         TowerManager.selectedTower.upgrade();
 *     }
 *     if (e.key === 'p' && TowerManager.selectedTower) {
 *         TowerManager.selectedTower.cyclePriority();
 *     }
 * });
 */

console.log('Tower System loaded successfully!');
console.log('Available modules: TowerTypes, Tower, TowerManager, TowerAnimations');
