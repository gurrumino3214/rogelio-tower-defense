const Game = {
    running: false,

    init() {
        Engine.init();
        this.running = true;
        requestAnimationFrame((time) => this.loop(time));
    },

    update(deltaTime) {
        // Lógica del juego aquí
    },

    draw() {
        Engine.clear();
        // Dibujar elementos del juego aquí
    },

    loop(currentTime) {
        if (!this.running) return;

        const deltaTime = Engine.getDeltaTime(currentTime);
        this.update(deltaTime);
        this.draw();

        requestAnimationFrame((time) => this.loop(time));
    }
};

window.onload = () => Game.init();
