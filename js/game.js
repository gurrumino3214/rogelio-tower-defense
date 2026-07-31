/**
 * Game.js - Punto de entrada principal del juego
 * Inicializa el motor y comienza el loop del juego
 */

// Inicializar el motor cuando el DOM esté listo
document.addEventListener('DOMContentLoaded', () => {
    // Inicializar engine
    Engine.init();
    
    // Crear objeto de prueba para verificar que funciona
    const testObject = {
        x: 400,
        y: 300,
        width: 50,
        height: 50,
        angle: 0,
        
        update(dt) {
            this.angle += dt * Math.PI; // Rotar demostración
        },
        
        draw(ctx) {
            ctx.save();
            ctx.translate(this.x, this.y);
            ctx.rotate(this.angle);
            Engine.drawRect(-this.width/2, -this.height/2, this.width, this.height, '#00ff00');
            ctx.restore();
        }
    };
    
    // Añadir a la capa de entidades
    Engine.addToLayer('entities', testObject);
    
    // Iniciar el juego
    Engine.start();
    
    console.log('Game started');
});
