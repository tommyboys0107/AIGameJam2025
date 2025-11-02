// ScreenEffectsManager - Handles canvas and CSS screen effects for game over scenarios
// Creates visual effects like screen flashes, glitch effects, and data floods

export class ScreenEffectsManager {
    constructor() {
        this.activeEffects = [];
        this.isEnabled = true;
        
        // Effect configuration
        this.effectConfig = {
            screenFlash: {
                duration: 300,
                fadeInTime: 50,
                fadeOutTime: 250
            },
            glitchEffect: {
                duration: 2000,
                intensity: 5,
                frequency: 100
            },
            dataFlood: {
                duration: 3000,
                particleCount: 50,
                speed: 200
            },
            corruptionSpread: {
                duration: 1500,
                waveCount: 3,
                intensity: 0.8
            },
            systemFailure: {
                duration: 5000,
                flickerRate: 50,
                colorShift: true
            }
        };
        
        console.log('ScreenEffectsManager initialized');
    }

    /**
     * Show screen flash effect
     * @param {string} type - Type of flash ('success', 'failure', 'phase', 'corruption')
     * @param {number} intensity - Flash intensity (0.0 to 1.0)
     * @param {number} duration - Duration in milliseconds (optional)
     */
    showScreenFlash(type = 'success', intensity = 0.3, duration = null) {
        if (!this.isEnabled) return;

        try {
            const flashDuration = duration || this.effectConfig.screenFlash.duration;
            
            // Create flash overlay element
            const flashElement = document.createElement('div');
            flashElement.className = `screen-flash-${type}`;
            
            // Set custom intensity and duration
            flashElement.style.cssText = `
                position: fixed;
                top: 0;
                left: 0;
                width: 100%;
                height: 100%;
                pointer-events: none;
                z-index: 9999;
                opacity: 0;
                transition: opacity ${this.effectConfig.screenFlash.fadeInTime}ms ease-out;
            `;
            
            // Set color based on type
            switch (type) {
                case 'success':
                    flashElement.style.background = `rgba(0, 255, 65, ${intensity})`;
                    break;
                case 'failure':
                    flashElement.style.background = `rgba(255, 68, 68, ${intensity})`;
                    break;
                case 'phase':
                    flashElement.style.background = `rgba(0, 191, 255, ${intensity})`;
                    break;
                case 'corruption':
                    flashElement.style.background = `rgba(255, 215, 0, ${intensity})`;
                    break;
                default:
                    flashElement.style.background = `rgba(255, 255, 255, ${intensity})`;
            }
            
            document.body.appendChild(flashElement);
            
            // Trigger flash animation
            requestAnimationFrame(() => {
                flashElement.style.opacity = '1';
                
                setTimeout(() => {
                    flashElement.style.transition = `opacity ${this.effectConfig.screenFlash.fadeOutTime}ms ease-out`;
                    flashElement.style.opacity = '0';
                    
                    setTimeout(() => {
                        if (flashElement.parentNode) {
                            flashElement.parentNode.removeChild(flashElement);
                        }
                    }, this.effectConfig.screenFlash.fadeOutTime);
                }, this.effectConfig.screenFlash.fadeInTime);
            });
            
            console.log(`Screen flash effect: ${type} (intensity: ${intensity})`);
            
        } catch (error) {
            console.error('Error showing screen flash:', error);
        }
    }

    /**
     * Show glitch effect on specified element or entire screen
     * @param {HTMLElement|null} targetElement - Element to apply glitch to (null for full screen)
     * @param {number} duration - Duration in milliseconds
     * @param {number} intensity - Glitch intensity (1-10)
     */
    showGlitchEffect(targetElement = null, duration = null, intensity = 5) {
        if (!this.isEnabled) return;

        try {
            const glitchDuration = duration || this.effectConfig.glitchEffect.duration;
            const target = targetElement || document.body;
            
            // Create glitch overlay
            const glitchOverlay = document.createElement('div');
            glitchOverlay.className = 'glitch-overlay-effect';
            glitchOverlay.style.cssText = `
                position: ${targetElement ? 'absolute' : 'fixed'};
                top: 0;
                left: 0;
                width: 100%;
                height: 100%;
                pointer-events: none;
                z-index: ${targetElement ? '10' : '9998'};
                background: repeating-linear-gradient(
                    0deg,
                    transparent,
                    transparent 2px,
                    rgba(255, 0, 0, ${0.1 * intensity / 10}) 2px,
                    rgba(255, 0, 0, ${0.1 * intensity / 10}) 4px
                );
                mix-blend-mode: screen;
                animation: glitchScan ${this.effectConfig.glitchEffect.frequency}ms infinite;
            `;
            
            if (targetElement) {
                targetElement.style.position = 'relative';
                targetElement.appendChild(glitchOverlay);
            } else {
                document.body.appendChild(glitchOverlay);
            }
            
            // Add glitch animation keyframes if not already present
            this.addGlitchKeyframes();
            
            // Apply glitch transform to target
            const originalTransform = target.style.transform;
            const glitchInterval = setInterval(() => {
                const offsetX = (Math.random() - 0.5) * intensity;
                const offsetY = (Math.random() - 0.5) * intensity * 0.5;
                const hueRotate = Math.random() * 360;
                
                target.style.transform = `${originalTransform} translateX(${offsetX}px) translateY(${offsetY}px)`;
                target.style.filter = `hue-rotate(${hueRotate}deg) contrast(${1 + Math.random() * 0.5})`;
            }, this.effectConfig.glitchEffect.frequency);
            
            // Clean up after duration
            setTimeout(() => {
                clearInterval(glitchInterval);
                target.style.transform = originalTransform;
                target.style.filter = '';
                
                if (glitchOverlay.parentNode) {
                    glitchOverlay.parentNode.removeChild(glitchOverlay);
                }
            }, glitchDuration);
            
            console.log(`Glitch effect applied for ${glitchDuration}ms (intensity: ${intensity})`);
            
        } catch (error) {
            console.error('Error showing glitch effect:', error);
        }
    }

    /**
     * Show data flood effect (for corruption game over)
     * @param {HTMLElement} container - Container element for the effect
     * @param {number} duration - Duration in milliseconds
     */
    showDataFloodEffect(container = null, duration = null) {
        if (!this.isEnabled) return;

        try {
            const floodDuration = duration || this.effectConfig.dataFlood.duration;
            const target = container || document.body;
            
            // Create data flood container
            const floodContainer = document.createElement('div');
            floodContainer.className = 'data-flood-effect';
            floodContainer.style.cssText = `
                position: ${container ? 'absolute' : 'fixed'};
                top: 0;
                left: 0;
                width: 100%;
                height: 100%;
                pointer-events: none;
                z-index: ${container ? '20' : '9997'};
                overflow: hidden;
            `;
            
            // Create animated data particles
            for (let i = 0; i < this.effectConfig.dataFlood.particleCount; i++) {
                const particle = document.createElement('div');
                particle.className = 'data-particle';
                
                const size = Math.random() * 4 + 2;
                const startX = Math.random() * 100;
                const startY = -10;
                const endY = 110;
                const animationDuration = (Math.random() * 2 + 1) * 1000; // 1-3 seconds
                const delay = Math.random() * floodDuration;
                
                particle.style.cssText = `
                    position: absolute;
                    width: ${size}px;
                    height: ${size}px;
                    background: ${this.getRandomDataColor()};
                    left: ${startX}%;
                    top: ${startY}%;
                    border-radius: 50%;
                    box-shadow: 0 0 ${size * 2}px ${this.getRandomDataColor()};
                    animation: dataParticleFall ${animationDuration}ms linear ${delay}ms infinite;
                `;
                
                floodContainer.appendChild(particle);
            }
            
            // Add data particle animation keyframes
            this.addDataParticleKeyframes();
            
            if (container) {
                container.style.position = 'relative';
                container.appendChild(floodContainer);
            } else {
                document.body.appendChild(floodContainer);
            }
            
            // Clean up after duration
            setTimeout(() => {
                if (floodContainer.parentNode) {
                    floodContainer.parentNode.removeChild(floodContainer);
                }
            }, floodDuration);
            
            console.log(`Data flood effect applied for ${floodDuration}ms`);
            
        } catch (error) {
            console.error('Error showing data flood effect:', error);
        }
    }

    /**
     * Show corruption spread effect
     * @param {HTMLElement} sourceElement - Element to start corruption from
     * @param {number} duration - Duration in milliseconds
     */
    showCorruptionSpreadEffect(sourceElement, duration = null) {
        if (!this.isEnabled || !sourceElement) return;

        try {
            const spreadDuration = duration || this.effectConfig.corruptionSpread.duration;
            
            // Create corruption waves
            for (let i = 0; i < this.effectConfig.corruptionSpread.waveCount; i++) {
                setTimeout(() => {
                    this.createCorruptionWave(sourceElement, spreadDuration / this.effectConfig.corruptionSpread.waveCount);
                }, i * (spreadDuration / this.effectConfig.corruptionSpread.waveCount / 2));
            }
            
            console.log(`Corruption spread effect applied for ${spreadDuration}ms`);
            
        } catch (error) {
            console.error('Error showing corruption spread effect:', error);
        }
    }

    /**
     * Show system failure effect (for critical game over)
     * @param {number} duration - Duration in milliseconds
     */
    showSystemFailureEffect(duration = null) {
        if (!this.isEnabled) return;

        try {
            const failureDuration = duration || this.effectConfig.systemFailure.duration;
            
            // Create system failure overlay
            const failureOverlay = document.createElement('div');
            failureOverlay.className = 'system-failure-effect';
            failureOverlay.style.cssText = `
                position: fixed;
                top: 0;
                left: 0;
                width: 100%;
                height: 100%;
                pointer-events: none;
                z-index: 9996;
                background: linear-gradient(45deg, 
                    rgba(255, 0, 0, 0.1) 0%, 
                    rgba(0, 0, 0, 0.8) 25%, 
                    rgba(255, 0, 0, 0.1) 50%, 
                    rgba(0, 0, 0, 0.8) 75%, 
                    rgba(255, 0, 0, 0.1) 100%);
                background-size: 20px 20px;
                animation: systemFailureFlicker ${this.effectConfig.systemFailure.flickerRate}ms infinite;
            `;
            
            document.body.appendChild(failureOverlay);
            
            // Add system failure keyframes
            this.addSystemFailureKeyframes();
            
            // Apply color shift to entire page if enabled
            if (this.effectConfig.systemFailure.colorShift) {
                document.body.style.filter = 'hue-rotate(180deg) contrast(1.5) brightness(0.8)';
            }
            
            // Clean up after duration
            setTimeout(() => {
                if (failureOverlay.parentNode) {
                    failureOverlay.parentNode.removeChild(failureOverlay);
                }
                
                if (this.effectConfig.systemFailure.colorShift) {
                    document.body.style.filter = '';
                }
            }, failureDuration);
            
            console.log(`System failure effect applied for ${failureDuration}ms`);
            
        } catch (error) {
            console.error('Error showing system failure effect:', error);
        }
    }

    /**
     * Create a corruption wave effect
     * @param {HTMLElement} sourceElement - Source element for the wave
     * @param {number} duration - Wave duration
     * @private
     */
    createCorruptionWave(sourceElement, duration) {
        const wave = document.createElement('div');
        wave.className = 'corruption-wave';
        
        const rect = sourceElement.getBoundingClientRect();
        const centerX = rect.left + rect.width / 2;
        const centerY = rect.top + rect.height / 2;
        
        wave.style.cssText = `
            position: fixed;
            left: ${centerX}px;
            top: ${centerY}px;
            width: 0;
            height: 0;
            border: 2px solid rgba(255, 68, 68, 0.8);
            border-radius: 50%;
            pointer-events: none;
            z-index: 9995;
            transform: translate(-50%, -50%);
            animation: corruptionWaveExpand ${duration}ms ease-out;
        `;
        
        document.body.appendChild(wave);
        
        // Add wave expansion keyframes
        this.addCorruptionWaveKeyframes();
        
        setTimeout(() => {
            if (wave.parentNode) {
                wave.parentNode.removeChild(wave);
            }
        }, duration);
    }

    /**
     * Get random color for data particles
     * @returns {string} CSS color string
     * @private
     */
    getRandomDataColor() {
        const colors = [
            '#FF4444', '#FFD700', '#FF6600', '#FF0000', '#CC0000'
        ];
        return colors[Math.floor(Math.random() * colors.length)];
    }

    /**
     * Add glitch animation keyframes to document
     * @private
     */
    addGlitchKeyframes() {
        if (document.getElementById('glitch-keyframes')) return;
        
        const style = document.createElement('style');
        style.id = 'glitch-keyframes';
        style.textContent = `
            @keyframes glitchScan {
                0% { transform: translateX(-100%); opacity: 0.8; }
                50% { opacity: 1; }
                100% { transform: translateX(100%); opacity: 0.8; }
            }
        `;
        document.head.appendChild(style);
    }

    /**
     * Add data particle animation keyframes to document
     * @private
     */
    addDataParticleKeyframes() {
        if (document.getElementById('data-particle-keyframes')) return;
        
        const style = document.createElement('style');
        style.id = 'data-particle-keyframes';
        style.textContent = `
            @keyframes dataParticleFall {
                0% { 
                    transform: translateY(0) rotate(0deg);
                    opacity: 0;
                }
                10% {
                    opacity: 1;
                }
                90% {
                    opacity: 1;
                }
                100% { 
                    transform: translateY(120vh) rotate(360deg);
                    opacity: 0;
                }
            }
        `;
        document.head.appendChild(style);
    }

    /**
     * Add system failure animation keyframes to document
     * @private
     */
    addSystemFailureKeyframes() {
        if (document.getElementById('system-failure-keyframes')) return;
        
        const style = document.createElement('style');
        style.id = 'system-failure-keyframes';
        style.textContent = `
            @keyframes systemFailureFlicker {
                0%, 100% { 
                    opacity: 0.8;
                    background-position: 0 0;
                }
                25% { 
                    opacity: 0.3;
                    background-position: 5px 5px;
                }
                50% { 
                    opacity: 1;
                    background-position: -5px -5px;
                }
                75% { 
                    opacity: 0.6;
                    background-position: 3px -3px;
                }
            }
        `;
        document.head.appendChild(style);
    }

    /**
     * Add corruption wave animation keyframes to document
     * @private
     */
    addCorruptionWaveKeyframes() {
        if (document.getElementById('corruption-wave-keyframes')) return;
        
        const style = document.createElement('style');
        style.id = 'corruption-wave-keyframes';
        style.textContent = `
            @keyframes corruptionWaveExpand {
                0% { 
                    width: 0;
                    height: 0;
                    opacity: 1;
                    border-width: 3px;
                }
                50% {
                    opacity: 0.8;
                    border-width: 2px;
                }
                100% { 
                    width: 200px;
                    height: 200px;
                    opacity: 0;
                    border-width: 1px;
                }
            }
        `;
        document.head.appendChild(style);
    }

    /**
     * Clear all active effects
     */
    clearAllEffects() {
        try {
            // Remove all effect overlays
            const effectElements = document.querySelectorAll(
                '.screen-flash-success, .screen-flash-failure, .screen-flash-phase, .screen-flash-corruption, ' +
                '.glitch-overlay-effect, .data-flood-effect, .system-failure-effect, .corruption-wave'
            );
            
            effectElements.forEach(element => {
                if (element.parentNode) {
                    element.parentNode.removeChild(element);
                }
            });
            
            // Reset body filter
            document.body.style.filter = '';
            
            this.activeEffects = [];
            console.log('All screen effects cleared');
            
        } catch (error) {
            console.error('Error clearing screen effects:', error);
        }
    }

    /**
     * Enable or disable screen effects
     * @param {boolean} enabled - Whether effects should be enabled
     */
    setEnabled(enabled) {
        this.isEnabled = enabled;
        
        if (!enabled) {
            this.clearAllEffects();
        }
        
        console.log(`Screen effects ${enabled ? 'enabled' : 'disabled'}`);
    }

    /**
     * Update effect configuration
     * @param {Object} newConfig - New configuration object
     */
    updateConfig(newConfig) {
        this.effectConfig = { ...this.effectConfig, ...newConfig };
        console.log('Screen effects configuration updated');
    }

    /**
     * Get current configuration
     * @returns {Object} Current effect configuration
     */
    getConfig() {
        return { ...this.effectConfig };
    }

    /**
     * Check if effects are enabled
     * @returns {boolean} True if effects are enabled
     */
    isEffectsEnabled() {
        return this.isEnabled;
    }

    /**
     * Destroy the screen effects manager and clean up resources
     */
    destroy() {
        this.clearAllEffects();
        
        // Remove added keyframe styles
        const keyframeStyles = document.querySelectorAll(
            '#glitch-keyframes, #data-particle-keyframes, #system-failure-keyframes, #corruption-wave-keyframes'
        );
        
        keyframeStyles.forEach(style => {
            if (style.parentNode) {
                style.parentNode.removeChild(style);
            }
        });
        
        this.isEnabled = false;
        console.log('ScreenEffectsManager destroyed');
    }
}