/**
 * Projectile System - Sistema de Proyectiles
 * 
 * Sistema completo de proyectiles para tower defense.
 * Incluye: balas, flechas, magia, láser y explosiones.
 * 
 * Características:
 * - 5 categorías de proyectiles
 * - Sistema de trayectoria con física (gravedad, aceleración)
 * - Homing (seguimiento de objetivos)
 * - Perforación (pierce) múltiple
 * - Daño en área con falloff
 * - Sistema de partículas optimizado
 * - Object pooling para rendimiento
 * - Soporte para cientos de proyectiles simultáneos
 * 
 * @module ProjectileSystem
 */

// Importar módulos
const ProjectileTypes = require('./ProjectileTypes');
const Particle = require('./Particle');
const Projectile = require('./Projectile');
const ProjectileManager = require('./ProjectileManager');

// Inicializar tipos predefinidos
ProjectileTypes.init();

// Exportar todos los componentes
module.exports = {
    // Clases principales
    Projectile,
    ProjectileManager,
    
    // Sistema de partículas
    Particle: Particle.Particle,
    ParticlePool: Particle.ParticlePool,
    
    // Registro de tipos
    ProjectileTypes,
    
    // Helper para crear gestor
    createManager(options) {
        return new ProjectileManager(options);
    },
    
    // Helper para obtener tipo
    getProjectileType(id) {
        return ProjectileTypes.get(id);
    },
    
    // Helper para registrar nuevo tipo
    registerProjectileType(id, config) {
        return ProjectileTypes.register(id, config);
    }
};
