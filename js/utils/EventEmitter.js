/**
 * EventEmitter.js - Sistema de eventos simple
 * Permite emitir y escuchar eventos personalizados
 * 
 * @module utils/EventEmitter
 */

class EventEmitter {
    constructor() {
        this._events = new Map();
    }

    /**
     * Suscribirse a un evento
     * @param {string} event - Nombre del evento
     * @param {Function} callback - Función a ejecutar
     */
    on(event, callback) {
        if (!this._events.has(event)) {
            this._events.set(event, []);
        }
        this._events.get(event).push(callback);
    }

    /**
     * Suscribirse una sola vez a un evento
     * @param {string} event - Nombre del evento
     * @param {Function} callback - Función a ejecutar
     */
    once(event, callback) {
        const wrapper = (...args) => {
            this.off(event, wrapper);
            callback(...args);
        };
        this.on(event, wrapper);
    }

    /**
     * Cancelar suscripción a un evento
     * @param {string} event - Nombre del evento
     * @param {Function} callback - Función a remover
     */
    off(event, callback) {
        if (!this._events.has(event)) return;

        const callbacks = this._events.get(event);
        const index = callbacks.indexOf(callback);
        if (index > -1) {
            callbacks.splice(index, 1);
        }
    }

    /**
     * Emitir un evento
     * @param {string} event - Nombre del evento
     * @param {*} data - Datos a pasar a los callbacks
     */
    emit(event, data) {
        if (!this._events.has(event)) return;

        const callbacks = this._events.get(event);
        for (const callback of callbacks) {
            try {
                callback(data);
            } catch (error) {
                console.error(`[EventEmitter] Error en evento '${event}':`, error);
            }
        }
    }

    /**
     * Remover todos los listeners de un evento
     * @param {string} event - Nombre del evento (opcional, si no se pasa limpia todos)
     */
    removeAllListeners(event) {
        if (event) {
            this._events.delete(event);
        } else {
            this._events.clear();
        }
    }

    /**
     * Obtener número de listeners para un evento
     * @param {string} event - Nombre del evento
     * @returns {number}
     */
    listenerCount(event) {
        if (!this._events.has(event)) return 0;
        return this._events.get(event).length;
    }
}

export { EventEmitter };
