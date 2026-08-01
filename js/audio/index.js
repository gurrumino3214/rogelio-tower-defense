/**
 * AudioIndex - Exportador de módulos de audio
 * 
 * Facilita la importación de todas las clases del sistema de audio
 */

// Las clases están definidas en AudioSystem.js
// Este archivo asegura la carga correcta en el navegador

if (typeof window !== 'undefined') {
    // El sistema ya está disponible globalmente a través de AudioSystem.js
    console.log('[Audio] Module loader ready');
}
