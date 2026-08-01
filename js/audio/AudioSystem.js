/**
 * AudioSystem - Sistema de audio modular para juegos pixel art
 * 
 * Características:
 * - Música con fade in/out
 * - Sonidos 2D espacializados
 * - Volúmenes independientes por categoría
 * - Pool de sonidos para rendimiento
 * - Soporte para cientos de sonidos
 * 
 * @author Pixel Art Game Engine
 * @version 1.0.0
 */

class AudioCategory {
    constructor(name, defaultVolume = 1.0) {
        this.name = name;
        this.volume = defaultVolume;
        this.muted = false;
        this.sounds = new Map();
    }

    setVolume(value) {
        this.volume = Math.max(0, Math.min(1, value));
        this.sounds.forEach(sound => {
            if (sound.gainNode) {
                sound.gainNode.gain.value = this.getEffectiveVolume();
            }
        });
    }

    getEffectiveVolume() {
        return this.muted ? 0 : this.volume;
    }

    mute() {
        this.muted = true;
        this.setVolume(this.volume);
    }

    unmute() {
        this.muted = false;
        this.setVolume(this.volume);
    }

    addSound(id, sound) {
        this.sounds.set(id, sound);
    }

    getSound(id) {
        return this.sounds.get(id);
    }

    removeSound(id) {
        this.sounds.delete(id);
    }

    stopAll() {
        this.sounds.forEach(sound => {
            if (sound.source && sound.source.playbackState !== 0) {
                try {
                    sound.source.stop();
                } catch (e) {}
            }
        });
    }
}

class Sound2D {
    constructor(audioContext, buffer, options = {}) {
        this.audioContext = audioContext;
        this.buffer = buffer;
        this.options = {
            volume: options.volume ?? 1.0,
            pitch: options.pitch ?? 1.0,
            loop: options.loop ?? false,
            spatial: options.spatial ?? false,
            pan: options.pan ?? 0,
            maxDistance: options.maxDistance ?? 1000,
            refDistance: options.refDistance ?? 1,
            rolloffFactor: options.rolloffFactor ?? 1,
            ...options
        };
        this.gainNode = null;
        this.panNode = null;
        this.source = null;
        this.isPlaying = false;
        this.startTime = 0;
        this.pausedAt = 0;
    }

    play(position = null, overrides = {}) {
        if (!this.buffer) return null;

        const source = this.audioContext.createBufferSource();
        source.buffer = this.buffer;
        source.loop = overrides.loop ?? this.options.loop;
        source.playbackRate.value = overrides.pitch ?? this.options.pitch;

        // Nodo de ganancia para volumen
        const gainNode = this.audioContext.createGain();
        const baseVolume = this.options.volume * AudioSystem.getInstance().getCategoryVolume('master');
        gainNode.gain.value = baseVolume;

        // Nodo de panoramización para sonido 2D
        let outputNode = gainNode;
        
        if (this.options.spatial || position) {
            const panNode = this.audioContext.createStereoPanner();
            if (position) {
                panNode.pan.value = this.calculatePan(position.x);
            } else {
                panNode.pan.value = this.options.pan;
            }
            gainNode.connect(panNode);
            outputNode = panNode;
            this.panNode = panNode;
        }

        outputNode.connect(this.audioContext.destination);
        source.connect(gainNode);

        source.start(0);
        
        this.source = source;
        this.gainNode = gainNode;
        this.isPlaying = true;
        this.startTime = this.audioContext.currentTime;

        source.onended = () => {
            this.isPlaying = false;
            this.cleanup();
        };

        return this;
    }

    stop(fadeTime = 0) {
        if (!this.isPlaying || !this.gainNode) return;

        if (fadeTime > 0) {
            const now = this.audioContext.currentTime;
            this.gainNode.gain.cancelScheduledValues(now);
            this.gainNode.gain.setValueAtTime(this.gainNode.gain.value, now);
            this.gainNode.gain.linearRampToValueAtTime(0, now + fadeTime);
            
            setTimeout(() => {
                if (this.source) {
                    try {
                        this.source.stop();
                    } catch (e) {}
                }
            }, fadeTime * 1000);
        } else {
            try {
                this.source.stop();
            } catch (e) {}
        }

        this.isPlaying = false;
    }

    setVolume(value, fadeTime = 0) {
        if (!this.gainNode) return;
        
        const targetVolume = value * AudioSystem.getInstance().getCategoryVolume('master');
        
        if (fadeTime > 0) {
            const now = this.audioContext.currentTime;
            this.gainNode.gain.cancelScheduledValues(now);
            this.gainNode.gain.setValueAtTime(this.gainNode.gain.value, now);
            this.gainNode.gain.linearRampToValueAtTime(targetVolume, now + fadeTime);
        } else {
            this.gainNode.gain.value = targetVolume;
        }
    }

    setPitch(value) {
        if (this.source) {
            this.source.playbackRate.value = value;
        }
    }

    setPan(value) {
        if (this.panNode) {
            this.panNode.pan.value = Math.max(-1, Math.min(1, value));
        }
    }

    updatePosition(position) {
        if (this.panNode && position) {
            this.panNode.pan.value = this.calculatePan(position.x);
        }
    }

    calculatePan(xPosition) {
        const canvasWidth = window.innerWidth || 800;
        const normalizedX = xPosition / canvasWidth;
        return Math.max(-1, Math.min(1, (normalizedX - 0.5) * 2));
    }

    pause() {
        if (!this.isPlaying || !this.source) return;
        
        this.pausedAt = this.audioContext.currentTime - this.startTime;
        try {
            this.source.stop();
        } catch (e) {}
        this.isPlaying = false;
    }

    resume() {
        if (this.isPlaying || !this.buffer) return;
        
        const source = this.audioContext.createBufferSource();
        source.buffer = this.buffer;
        source.loop = this.options.loop;
        source.playbackRate.value = this.options.pitch;

        const gainNode = this.audioContext.createGain();
        gainNode.gain.value = this.options.volume;

        if (this.panNode) {
            gainNode.connect(this.panNode);
        } else {
            gainNode.connect(this.audioContext.destination);
        }

        source.connect(gainNode);
        source.start(0, this.pausedAt);
        
        this.source = source;
        this.gainNode = gainNode;
        this.isPlaying = true;
        this.startTime = this.audioContext.currentTime - this.pausedAt;
    }

    cleanup() {
        if (this.gainNode) {
            try {
                this.gainNode.disconnect();
            } catch (e) {}
            this.gainNode = null;
        }
        if (this.panNode) {
            try {
                this.panNode.disconnect();
            } catch (e) {}
            this.panNode = null;
        }
        this.source = null;
    }
}

class MusicTrack {
    constructor(audioContext, buffer, options = {}) {
        this.audioContext = audioContext;
        this.buffer = buffer;
        this.options = {
            volume: options.volume ?? 0.7,
            loop: options.loop ?? true,
            ...options
        };
        this.source = null;
        this.gainNode = null;
        this.isPlaying = false;
        this.fadeTimeout = null;
        this.currentVolume = 0;
    }

    play(fadeInTime = 1.0) {
        if (!this.buffer) return;

        const source = this.audioContext.createBufferSource();
        source.buffer = this.buffer;
        source.loop = this.options.loop;

        const gainNode = this.audioContext.createGain();
        gainNode.gain.value = 0;

        gainNode.connect(this.audioContext.destination);
        source.connect(gainNode);

        source.start(0);

        this.source = source;
        this.gainNode = gainNode;
        this.isPlaying = true;
        this.currentVolume = 0;

        // Fade in
        if (fadeInTime > 0) {
            const now = this.audioContext.currentTime;
            gainNode.gain.cancelScheduledValues(now);
            gainNode.gain.setValueAtTime(0, now);
            gainNode.gain.linearRampToValueAtTime(
                this.options.volume * AudioSystem.getInstance().getCategoryVolume('music'),
                now + fadeInTime
            );
            this.currentVolume = this.options.volume;
        } else {
            gainNode.gain.value = this.options.volume * AudioSystem.getInstance().getCategoryVolume('music');
            this.currentVolume = this.options.volume;
        }

        source.onended = () => {
            if (!this.options.loop) {
                this.isPlaying = false;
            }
        };
    }

    stop(fadeOutTime = 1.0) {
        if (!this.isPlaying || !this.gainNode) return;

        if (fadeOutTime > 0) {
            const now = this.audioContext.currentTime;
            this.gainNode.gain.cancelScheduledValues(now);
            this.gainNode.gain.setValueAtTime(this.gainNode.gain.value, now);
            this.gainNode.gain.linearRampToValueAtTime(0, now + fadeOutTime);

            if (this.fadeTimeout) {
                clearTimeout(this.fadeTimeout);
            }

            this.fadeTimeout = setTimeout(() => {
                if (this.source) {
                    try {
                        this.source.stop();
                    } catch (e) {}
                }
                this.isPlaying = false;
                this.currentVolume = 0;
            }, fadeOutTime * 1000);
        } else {
            try {
                this.source.stop();
            } catch (e) {}
            this.isPlaying = false;
            this.currentVolume = 0;
        }
    }

    setVolume(value, fadeTime = 0) {
        if (!this.gainNode) return;

        const targetVolume = value * AudioSystem.getInstance().getCategoryVolume('music');
        this.options.volume = value;

        if (fadeTime > 0) {
            const now = this.audioContext.currentTime;
            this.gainNode.gain.cancelScheduledValues(now);
            this.gainNode.gain.setValueAtTime(this.gainNode.gain.value, now);
            this.gainNode.gain.linearRampToValueAtTime(targetVolume, now + fadeTime);
        } else {
            this.gainNode.gain.value = targetVolume;
        }

        this.currentVolume = value;
    }

    pause() {
        if (!this.isPlaying || !this.source) return;
        
        try {
            this.source.stop();
        } catch (e) {}
        this.isPlaying = false;
    }

    resume(fadeInTime = 0.5) {
        if (this.isPlaying || !this.buffer) return;
        this.play(fadeInTime);
    }
}

class SoundPool {
    constructor(audioContext, buffer, poolSize = 10, options = {}) {
        this.audioContext = audioContext;
        this.buffer = buffer;
        this.options = options;
        this.pool = [];
        this.available = [];

        for (let i = 0; i < poolSize; i++) {
            const sound = new Sound2D(audioContext, buffer, options);
            this.pool.push(sound);
            this.available.push(sound);
        }
    }

    play(position = null, overrides = {}) {
        if (this.available.length === 0) {
            // Crear sonido temporal si el pool está lleno
            const tempSound = new Sound2D(this.audioContext, this.buffer, this.options);
            tempSound.play(position, overrides);
            return tempSound;
        }

        const sound = this.available.pop();
        sound.play(position, overrides);
        
        sound.onceDone = () => {
            this.available.push(sound);
        };

        const originalStop = sound.stop.bind(sound);
        sound.stop = (fadeTime = 0) => {
            originalStop(fadeTime);
            setTimeout(() => {
                if (!sound.isPlaying) {
                    this.available.push(sound);
                }
            }, (fadeTime || 0) * 1000 + 100);
        };

        return sound;
    }

    stopAll(fadeTime = 0) {
        this.pool.forEach(sound => {
            if (sound.isPlaying) {
                sound.stop(fadeTime);
            }
        });
    }

    setVolume(value) {
        this.pool.forEach(sound => {
            sound.setVolume(value);
        });
    }
}

class AudioSystem {
    static instance = null;

    constructor() {
        if (AudioSystem.instance) {
            return AudioSystem.instance;
        }

        this.audioContext = null;
        this.categories = new Map();
        this.musicTracks = new Map();
        this.soundPools = new Map();
        this.sounds = new Map();
        this.currentMusic = null;
        this.initialized = false;
        this.masterVolume = 1.0;
        this.enabled = true;

        // Categorías predefinidas
        this.defaultCategories = [
            'master',
            'music',
            'ambient',
            'ui',
            'enemies',
            'boss',
            'towers',
            'explosions'
        ];

        AudioSystem.instance = this;
    }

    static getInstance() {
        if (!AudioSystem.instance) {
            AudioSystem.instance = new AudioSystem();
        }
        return AudioSystem.instance;
    }

    async init() {
        if (this.initialized) return true;

        try {
            this.audioContext = new (window.AudioContext || window.webkitAudioContext)();
            
            // Inicializar categorías
            this.defaultCategories.forEach(catName => {
                const defaultVol = catName === 'master' ? 1.0 : 
                                   catName === 'music' ? 0.7 : 1.0;
                this.categories.set(catName, new AudioCategory(catName, defaultVol));
            });

            this.initialized = true;
            console.log('[AudioSystem] Initialized successfully');
            return true;
        } catch (error) {
            console.error('[AudioSystem] Initialization failed:', error);
            return false;
        }
    }

    ensureContext() {
        if (!this.audioContext) {
            this.init();
        }
        if (this.audioContext && this.audioContext.state === 'suspended') {
            this.audioContext.resume();
        }
    }

    // Gestión de categorías
    createCategory(name, defaultVolume = 1.0) {
        if (!this.categories.has(name)) {
            this.categories.set(name, new AudioCategory(name, defaultVolume));
        }
        return this.categories.get(name);
    }

    getCategory(name) {
        return this.categories.get(name);
    }

    setCategoryVolume(categoryName, volume) {
        const category = this.categories.get(categoryName);
        if (category) {
            category.setVolume(volume);
        }
    }

    getCategoryVolume(categoryName) {
        const category = this.categories.get(categoryName);
        return category ? category.getEffectiveVolume() : 1.0;
    }

    muteCategory(categoryName) {
        const category = this.categories.get(categoryName);
        if (category) {
            category.mute();
        }
    }

    unmuteCategory(categoryName) {
        const category = this.categories.get(categoryName);
        if (category) {
            category.unmute();
        }
    }

    setMasterVolume(volume) {
        this.masterVolume = Math.max(0, Math.min(1, volume));
        this.categories.forEach(cat => {
            cat.setVolume(cat.volume);
        });
    }

    // Carga de sonidos
    async loadSound(id, url, category = 'ambient', options = {}) {
        this.ensureContext();
        
        try {
            const response = await fetch(url);
            const arrayBuffer = await response.arrayBuffer();
            const audioBuffer = await this.audioContext.decodeAudioData(arrayBuffer);
            
            const sound = new Sound2D(this.audioContext, audioBuffer, options);
            this.sounds.set(id, sound);
            
            const cat = this.categories.get(category);
            if (cat) {
                cat.addSound(id, sound);
            }
            
            console.log(`[AudioSystem] Loaded sound: ${id}`);
            return sound;
        } catch (error) {
            console.error(`[AudioSystem] Failed to load sound ${id}:`, error);
            return null;
        }
    }

    async loadSounds(soundConfigs) {
        const promises = soundConfigs.map(config => 
            this.loadSound(config.id, config.url, config.category, config.options)
        );
        return Promise.all(promises);
    }

    // Carga de música
    async loadMusic(id, url, options = {}) {
        this.ensureContext();
        
        try {
            const response = await fetch(url);
            const arrayBuffer = await response.arrayBuffer();
            const audioBuffer = await this.audioContext.decodeAudioData(arrayBuffer);
            
            const track = new MusicTrack(this.audioContext, audioBuffer, options);
            this.musicTracks.set(id, track);
            
            console.log(`[AudioSystem] Loaded music: ${id}`);
            return track;
        } catch (error) {
            console.error(`[AudioSystem] Failed to load music ${id}:`, error);
            return null;
        }
    }

    async loadMusicBatch(musicConfigs) {
        const promises = musicConfigs.map(config => 
            this.loadMusic(config.id, config.url, config.options)
        );
        return Promise.all(promises);
    }

    // Crear pools de sonidos
    createSoundPool(id, url, category = 'ambient', poolSize = 10, options = {}) {
        this.ensureContext();
        
        const pool = new SoundPool(this.audioContext, null, poolSize, options);
        this.soundPools.set(id, pool);
        
        // Cargar buffer asíncronamente
        this.loadSound(id + '_template', url, category, options).then(sound => {
            if (sound && sound.buffer) {
                pool.buffer = sound.buffer;
                pool.pool.forEach(s => s.buffer = sound.buffer);
            }
        });
        
        return pool;
    }

    // Reproducción de sonidos
    play(id, position = null, overrides = {}) {
        if (!this.enabled) return null;
        this.ensureContext();

        const sound = this.sounds.get(id);
        if (sound) {
            return sound.play(position, overrides);
        }

        const pool = this.soundPools.get(id);
        if (pool) {
            return pool.play(position, overrides);
        }

        console.warn(`[AudioSystem] Sound not found: ${id}`);
        return null;
    }

    playSound2D(id, x, y, overrides = {}) {
        return this.play(id, { x, y }, { ...overrides, spatial: true });
    }

    // Reproducción de música
    playMusic(id, fadeInTime = 1.0) {
        if (!this.enabled) return;
        this.ensureContext();

        const track = this.musicTracks.get(id);
        if (!track) {
            console.warn(`[AudioSystem] Music not found: ${id}`);
            return;
        }

        // Detener música actual con fade out
        if (this.currentMusic && this.currentMusic !== track) {
            this.currentMusic.stop(0.5);
        }

        this.currentMusic = track;
        track.play(fadeInTime);
    }

    stopMusic(fadeOutTime = 1.0) {
        if (this.currentMusic) {
            this.currentMusic.stop(fadeOutTime);
            this.currentMusic = null;
        }
    }

    pauseMusic() {
        if (this.currentMusic) {
            this.currentMusic.pause();
        }
    }

    resumeMusic(fadeInTime = 0.5) {
        if (this.currentMusic) {
            this.currentMusic.resume(fadeInTime);
        }
    }

    setMusicVolume(volume, fadeTime = 0) {
        if (this.currentMusic) {
            this.currentMusic.setVolume(volume, fadeTime);
        }
    }

    // Control de reproducción
    stop(id, fadeTime = 0) {
        const sound = this.sounds.get(id);
        if (sound) {
            sound.stop(fadeTime);
            return;
        }

        const pool = this.soundPools.get(id);
        if (pool) {
            pool.stopAll(fadeTime);
            return;
        }
    }

    stopAll(fadeTime = 0) {
        this.sounds.forEach(sound => sound.stop(fadeTime));
        this.soundPools.forEach(pool => pool.stopAll(fadeTime));
        this.stopMusic(fadeTime);
    }

    pauseAll() {
        this.sounds.forEach(sound => sound.pause());
        this.pauseMusic();
    }

    resumeAll() {
        this.sounds.forEach(sound => {
            if (!sound.isPlaying) {
                sound.resume();
            }
        });
        this.resumeMusic();
    }

    // Utilidades
    isPlaying(id) {
        const sound = this.sounds.get(id);
        return sound ? sound.isPlaying : false;
    }

    getDuration(id) {
        const sound = this.sounds.get(id);
        return sound && sound.buffer ? sound.buffer.duration : 0;
    }

    createOscillatorSound(type = 'sine', frequency = 440, duration = 0.1, volume = 0.3) {
        if (!this.enabled) return null;
        this.ensureContext();

        const oscillator = this.audioContext.createOscillator();
        const gainNode = this.audioContext.createGain();

        oscillator.type = type;
        oscillator.frequency.value = frequency;
        gainNode.gain.value = volume * this.masterVolume;

        oscillator.connect(gainNode);
        gainNode.connect(this.audioContext.destination);

        oscillator.start();
        oscillator.stop(this.audioContext.currentTime + duration);

        return { oscillator, gainNode };
    }

    playUISound(type = 'click') {
        const frequencies = {
            click: 800,
            hover: 600,
            select: 1000,
            error: 200,
            success: 1200
        };
        
        const freq = frequencies[type] || 440;
        this.createOscillatorSound('sine', freq, 0.05, 0.2);
    }

    // Estado y configuración
    enable() {
        this.enabled = true;
        this.ensureContext();
    }

    disable() {
        this.enabled = false;
        this.stopAll(0.1);
    }

    toggle() {
        this.enabled = !this.enabled;
        if (this.enabled) {
            this.ensureContext();
        } else {
            this.stopAll(0.1);
        }
        return this.enabled;
    }

    getConfig() {
        const config = {};
        this.categories.forEach((cat, name) => {
            config[name] = {
                volume: cat.volume,
                muted: cat.muted
            };
        });
        config.master = this.masterVolume;
        config.enabled = this.enabled;
        return config;
    }

    applyConfig(config) {
        if (config.master !== undefined) {
            this.setMasterVolume(config.master);
        }
        
        Object.keys(config).forEach(key => {
            if (key !== 'master' && key !== 'enabled') {
                const catConfig = config[key];
                const category = this.categories.get(key);
                if (category) {
                    category.setVolume(catConfig.volume);
                    if (catConfig.muted) {
                        category.mute();
                    }
                }
            }
        });

        if (config.enabled !== undefined) {
            if (config.enabled) {
                this.enable();
            } else {
                this.disable();
            }
        }
    }

    // Limpieza
    unloadSound(id) {
        const sound = this.sounds.get(id);
        if (sound) {
            sound.stop();
            sound.cleanup();
            this.sounds.delete(id);
        }

        // Buscar en categorías y eliminar
        this.categories.forEach(cat => cat.removeSound(id));
    }

    unloadAll() {
        this.stopAll(0);
        this.sounds.forEach((sound, id) => {
            sound.cleanup();
        });
        this.sounds.clear();
        this.musicTracks.clear();
        this.soundPools.clear();
        this.currentMusic = null;
    }

    destroy() {
        this.unloadAll();
        if (this.audioContext) {
            this.audioContext.close();
            this.audioContext = null;
        }
        this.initialized = false;
    }
}

// Exportar para uso modular
if (typeof module !== 'undefined' && module.exports) {
    module.exports = {
        AudioSystem,
        AudioCategory,
        Sound2D,
        MusicTrack,
        SoundPool
    };
}
