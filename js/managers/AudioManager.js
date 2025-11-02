// AudioManager - Handles Web Audio API for sound effects
// Provides audio feedback for clicks, phase changes, and game endings

export class AudioManager {
    constructor() {
        this.audioContext = null;
        this.isEnabled = true;
        this.masterVolume = 0.5; // Default volume (50%) - increased for better sound effects
        this.bgmVolume = 0.2; // BGM volume (20%) - kept the same
        
        // Audio buffers for different sound types
        this.soundBuffers = new Map();
        
        // Background music
        this.bgmAudio = null;
        this.bgmLoaded = false;
        
        // Sound configuration
        this.soundConfig = {
            clickSuccess: {
                frequency: 800,
                duration: 0.1,
                type: 'sine',
                volume: 0.7
            },
            clickFail: {
                frequency: 200,
                duration: 0.2,
                type: 'sawtooth',
                volume: 0.5
            },
            clickMiss: {
                frequency: 400,
                duration: 0.05,
                type: 'square',
                volume: 0.4
            },
            phaseChange: {
                frequency: 600,
                duration: 0.3,
                type: 'sine',
                volume: 0.8,
                modulation: true
            },
            gameOver: {
                frequency: 150,
                duration: 1.0,
                type: 'sawtooth',
                volume: 0.9,
                fadeOut: true
            },
            gameSuccess: {
                frequency: 1000,
                duration: 0.8,
                type: 'sine',
                volume: 0.8,
                chord: [1.0, 1.25, 1.5] // Major chord ratios
            },
            corruption: {
                frequency: 100,
                duration: 0.15,
                type: 'sawtooth',
                volume: 0.6,
                distortion: true
            },
            systemAlert: {
                frequency: 1200,
                duration: 0.1,
                type: 'square',
                volume: 0.5,
                repeat: 3,
                repeatDelay: 0.1
            }
        };
        
        // Initialize audio context
        this.initializeAudioContext();
        
        // Initialize background music
        this.initializeBGM();
        
        console.log('AudioManager initialized');
    }

    /**
     * Initialize Web Audio API context
     * @private
     */
    initializeAudioContext() {
        try {
            // Create audio context with fallback for older browsers
            const AudioContext = window.AudioContext || window.webkitAudioContext;
            
            if (!AudioContext) {
                console.warn('Web Audio API not supported in this browser');
                this.isEnabled = false;
                return;
            }

            this.audioContext = new AudioContext();
            
            // Handle audio context state changes
            this.audioContext.addEventListener('statechange', () => {
                console.log(`Audio context state: ${this.audioContext.state}`);
            });
            
            console.log('Audio context initialized successfully');
            
        } catch (error) {
            console.error('Failed to initialize audio context:', error);
            this.isEnabled = false;
        }
    }

    /**
     * Initialize background music
     * @private
     */
    initializeBGM() {
        try {
            this.bgmAudio = new Audio('assets/audio/GameBGM.mp3');
            this.bgmAudio.loop = true;
            this.bgmAudio.volume = this.bgmVolume;
            this.bgmAudio.preload = 'auto';
            
            // Handle BGM events
            this.bgmAudio.addEventListener('canplaythrough', () => {
                this.bgmLoaded = true;
                console.log('BGM loaded and ready to play');
            });
            
            this.bgmAudio.addEventListener('error', (error) => {
                console.error('BGM loading error:', error);
                this.bgmLoaded = false;
            });
            
            this.bgmAudio.addEventListener('ended', () => {
                // This shouldn't happen with loop=true, but just in case
                if (this.isEnabled) {
                    this.bgmAudio.currentTime = 0;
                    this.bgmAudio.play().catch(console.error);
                }
            });
            
            console.log('BGM initialized');
            
        } catch (error) {
            console.error('Failed to initialize BGM:', error);
            this.bgmLoaded = false;
        }
    }

    /**
     * Resume audio context (required for user interaction)
     * @returns {Promise<void>}
     */
    async resumeAudioContext() {
        if (!this.audioContext || !this.isEnabled) {
            return;
        }

        try {
            if (this.audioContext.state === 'suspended') {
                await this.audioContext.resume();
                console.log('Audio context resumed');
            }
        } catch (error) {
            console.error('Failed to resume audio context:', error);
        }
    }

    /**
     * Play a sound effect
     * @param {string} soundType - Type of sound to play
     * @param {Object} options - Optional parameters to override defaults
     */
    playSound(soundType, options = {}) {
        if (!this.isEnabled || !this.audioContext) {
            return;
        }

        try {
            // Resume audio context if needed (for user interaction requirement)
            this.resumeAudioContext();

            const config = { ...this.soundConfig[soundType], ...options };
            
            if (!config) {
                console.warn(`Unknown sound type: ${soundType}`);
                return;
            }

            // Create and play the sound based on configuration
            if (config.chord) {
                this.playChord(config);
            } else if (config.repeat && config.repeat > 1) {
                this.playRepeatedSound(config);
            } else {
                this.playSingleSound(config);
            }
            
        } catch (error) {
            console.error(`Error playing sound ${soundType}:`, error);
        }
    }

    /**
     * Play a single sound
     * @param {Object} config - Sound configuration
     * @private
     */
    playSingleSound(config) {
        const oscillator = this.audioContext.createOscillator();
        const gainNode = this.audioContext.createGain();
        
        // Configure oscillator
        oscillator.type = config.type || 'sine';
        oscillator.frequency.setValueAtTime(config.frequency, this.audioContext.currentTime);
        
        // Configure gain (volume)
        const volume = (config.volume || 0.5) * this.masterVolume;
        gainNode.gain.setValueAtTime(volume, this.audioContext.currentTime);
        
        // Apply effects
        if (config.modulation) {
            this.applyModulation(oscillator, config);
        }
        
        if (config.distortion) {
            this.applyDistortion(oscillator, gainNode);
        }
        
        if (config.fadeOut) {
            gainNode.gain.exponentialRampToValueAtTime(
                0.001, 
                this.audioContext.currentTime + config.duration
            );
        } else {
            gainNode.gain.exponentialRampToValueAtTime(
                0.001, 
                this.audioContext.currentTime + config.duration * 0.9
            );
        }
        
        // Connect nodes
        oscillator.connect(gainNode);
        gainNode.connect(this.audioContext.destination);
        
        // Start and stop
        oscillator.start(this.audioContext.currentTime);
        oscillator.stop(this.audioContext.currentTime + config.duration);
    }

    /**
     * Play a chord (multiple frequencies)
     * @param {Object} config - Sound configuration with chord ratios
     * @private
     */
    playChord(config) {
        const baseFrequency = config.frequency;
        const chordRatios = config.chord || [1.0, 1.25, 1.5];
        
        chordRatios.forEach((ratio, index) => {
            setTimeout(() => {
                const chordConfig = {
                    ...config,
                    frequency: baseFrequency * ratio,
                    volume: (config.volume || 0.5) / chordRatios.length // Reduce volume per note
                };
                delete chordConfig.chord; // Prevent infinite recursion
                this.playSingleSound(chordConfig);
            }, index * 50); // Slight delay between notes
        });
    }

    /**
     * Play a repeated sound
     * @param {Object} config - Sound configuration with repeat settings
     * @private
     */
    playRepeatedSound(config) {
        const repeatCount = config.repeat || 1;
        const repeatDelay = config.repeatDelay || 0.1;
        
        for (let i = 0; i < repeatCount; i++) {
            setTimeout(() => {
                const repeatConfig = { ...config };
                delete repeatConfig.repeat;
                delete repeatConfig.repeatDelay;
                this.playSingleSound(repeatConfig);
            }, i * repeatDelay * 1000);
        }
    }

    /**
     * Apply frequency modulation to oscillator
     * @param {OscillatorNode} oscillator - The oscillator to modulate
     * @param {Object} config - Sound configuration
     * @private
     */
    applyModulation(oscillator, config) {
        const modulator = this.audioContext.createOscillator();
        const modulatorGain = this.audioContext.createGain();
        
        modulator.type = 'sine';
        modulator.frequency.setValueAtTime(5, this.audioContext.currentTime); // 5Hz modulation
        modulatorGain.gain.setValueAtTime(config.frequency * 0.1, this.audioContext.currentTime);
        
        modulator.connect(modulatorGain);
        modulatorGain.connect(oscillator.frequency);
        
        modulator.start(this.audioContext.currentTime);
        modulator.stop(this.audioContext.currentTime + config.duration);
    }

    /**
     * Apply distortion effect
     * @param {OscillatorNode} oscillator - The oscillator
     * @param {GainNode} gainNode - The gain node
     * @private
     */
    applyDistortion(oscillator, gainNode) {
        try {
            const waveshaper = this.audioContext.createWaveShaper();
            const curve = new Float32Array(65536);
            
            // Create distortion curve
            for (let i = 0; i < 65536; i++) {
                const x = (i - 32768) / 32768;
                curve[i] = Math.tanh(x * 3) * 0.5; // Soft clipping
            }
            
            waveshaper.curve = curve;
            waveshaper.oversample = '4x';
            
            // Insert waveshaper between oscillator and gain
            oscillator.disconnect();
            oscillator.connect(waveshaper);
            waveshaper.connect(gainNode);
            
        } catch (error) {
            console.warn('Failed to apply distortion effect:', error);
            // Fallback: connect directly
            oscillator.connect(gainNode);
        }
    }

    /**
     * Play click success sound
     */
    playClickSuccess() {
        this.playSound('clickSuccess');
    }

    /**
     * Play click failure sound
     */
    playClickFail() {
        this.playSound('clickFail');
    }

    /**
     * Play click miss sound
     */
    playClickMiss() {
        this.playSound('clickMiss');
    }

    /**
     * Play phase change sound
     */
    playPhaseChange() {
        this.playSound('phaseChange');
    }

    /**
     * Play game over sound
     */
    playGameOver() {
        this.playSound('gameOver');
    }

    /**
     * Play game success sound
     */
    playGameSuccess() {
        this.playSound('gameSuccess');
    }

    /**
     * Play corruption sound
     */
    playCorruption() {
        this.playSound('corruption');
    }

    /**
     * Play system alert sound
     */
    playSystemAlert() {
        this.playSound('systemAlert');
    }

    /**
     * Set master volume
     * @param {number} volume - Volume level (0.0 to 1.0)
     */
    setMasterVolume(volume) {
        this.masterVolume = Math.max(0, Math.min(1, volume));
        console.log(`Master volume set to: ${(this.masterVolume * 100).toFixed(0)}%`);
    }

    /**
     * Enable or disable audio
     * @param {boolean} enabled - Whether audio should be enabled
     */
    setEnabled(enabled) {
        this.isEnabled = enabled;
        console.log(`Audio ${enabled ? 'enabled' : 'disabled'}`);
    }

    /**
     * Check if audio is available and enabled
     * @returns {boolean} True if audio is available
     */
    isAudioAvailable() {
        return this.isEnabled && this.audioContext && this.audioContext.state !== 'closed';
    }

    /**
     * Get audio context state
     * @returns {string} Audio context state
     */
    getAudioState() {
        return this.audioContext ? this.audioContext.state : 'unavailable';
    }

    /**
     * Update sound configuration
     * @param {string} soundType - Type of sound to update
     * @param {Object} newConfig - New configuration
     */
    updateSoundConfig(soundType, newConfig) {
        if (this.soundConfig[soundType]) {
            this.soundConfig[soundType] = { ...this.soundConfig[soundType], ...newConfig };
            console.log(`Sound config updated for ${soundType}`);
        } else {
            console.warn(`Unknown sound type: ${soundType}`);
        }
    }

    /**
     * Get current sound configuration
     * @param {string} soundType - Type of sound (optional)
     * @returns {Object} Sound configuration
     */
    getSoundConfig(soundType = null) {
        return soundType ? this.soundConfig[soundType] : this.soundConfig;
    }

    /**
     * Start playing background music
     * @returns {Promise<void>}
     */
    async startBGM() {
        if (!this.isEnabled || !this.bgmAudio) {
            console.log('BGM not available or audio disabled');
            return;
        }

        try {
            // Set volume and ensure loop is enabled
            this.bgmAudio.volume = this.bgmVolume;
            this.bgmAudio.loop = true;
            this.bgmAudio.currentTime = 0; // Start from beginning
            
            await this.bgmAudio.play();
            console.log('BGM started successfully');
            
        } catch (error) {
            console.error('Failed to start BGM:', error);
            // Try again after user interaction
            document.addEventListener('click', this.tryStartBGM.bind(this), { once: true });
        }
    }

    /**
     * Try to start BGM after user interaction
     * @private
     */
    async tryStartBGM() {
        try {
            if (this.bgmAudio && this.bgmAudio.paused) {
                await this.bgmAudio.play();
                console.log('BGM started after user interaction');
            }
        } catch (error) {
            console.error('Failed to start BGM after user interaction:', error);
        }
    }

    /**
     * Stop background music
     */
    stopBGM() {
        if (this.bgmAudio && !this.bgmAudio.paused) {
            this.bgmAudio.pause();
            this.bgmAudio.currentTime = 0;
            console.log('BGM stopped');
        }
    }

    /**
     * Pause background music
     */
    pauseBGM() {
        if (this.bgmAudio && !this.bgmAudio.paused) {
            this.bgmAudio.pause();
            console.log('BGM paused');
        }
    }

    /**
     * Resume background music
     */
    async resumeBGM() {
        if (this.bgmAudio && this.bgmAudio.paused) {
            try {
                await this.bgmAudio.play();
                console.log('BGM resumed');
            } catch (error) {
                console.error('Failed to resume BGM:', error);
            }
        }
    }

    /**
     * Set BGM volume
     * @param {number} volume - Volume level (0.0 to 1.0)
     */
    setBGMVolume(volume) {
        this.bgmVolume = Math.max(0, Math.min(1, volume));
        if (this.bgmAudio) {
            this.bgmAudio.volume = this.bgmVolume;
        }
        console.log(`BGM volume set to: ${(this.bgmVolume * 100).toFixed(0)}%`);
    }

    /**
     * Check if BGM is currently playing
     * @returns {boolean} True if BGM is playing
     */
    isBGMPlaying() {
        return this.bgmAudio && !this.bgmAudio.paused && !this.bgmAudio.ended;
    }

    /**
     * Destroy audio manager and clean up resources
     */
    destroy() {
        try {
            // Stop and clean up BGM
            if (this.bgmAudio) {
                this.bgmAudio.pause();
                this.bgmAudio.src = '';
                this.bgmAudio = null;
            }
            
            if (this.audioContext && this.audioContext.state !== 'closed') {
                this.audioContext.close();
            }
            
            this.audioContext = null;
            this.soundBuffers.clear();
            this.isEnabled = false;
            this.bgmLoaded = false;
            
            console.log('AudioManager destroyed');
            
        } catch (error) {
            console.error('Error destroying AudioManager:', error);
        }
    }
}