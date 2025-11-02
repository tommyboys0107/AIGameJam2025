// VisualFeedbackSystem - Handles click feedback effects and visual indicators
// Provides canvas-based effects for object interactions and user feedback

export class VisualFeedbackSystem {
    /**
     * Creates a new VisualFeedbackSystem
     * @param {HTMLCanvasElement} canvas - The game canvas element
     */
    constructor(canvas) {
        this.canvas = canvas;
        this.ctx = canvas.getContext('2d');
        
        // Active feedback effects
        this.activeEffects = [];
        
        // Effect configuration
        this.effectConfig = {
            clickRipple: {
                duration: 500,        // milliseconds
                maxRadius: 50,        // pixels
                lineWidth: 3,
                successColor: '#00FF41',  // Neon green for successful blocks
                failColor: '#FF4444',     // Red for missed clicks
                missColor: '#FFAA00'      // Orange for clicks that miss objects
            },
            objectHit: {
                duration: 300,
                pulseIntensity: 0.8,
                successColor: '#00FF41',
                failColor: '#FF4444'
            },
            particleEffect: {
                particleCount: 8,
                duration: 600,
                speed: 100,           // pixels per second
                fadeRate: 2.0         // alpha reduction per second
            },
            screenFlash: {
                duration: 100,  // Shorter duration to prevent sticking
                intensity: 0.15  // Lower intensity to prevent too much darkening
            }
        };
        
        // Animation frame tracking
        this.lastUpdateTime = 0;
        
        console.log('VisualFeedbackSystem initialized');
    }

    /**
     * Updates all active visual effects
     * @param {number} currentTime - Current timestamp in milliseconds
     */
    update(currentTime) {
        if (this.lastUpdateTime === 0) {
            this.lastUpdateTime = currentTime;
            return;
        }

        const deltaTime = currentTime - this.lastUpdateTime;
        this.lastUpdateTime = currentTime;

        // Update all active effects
        for (let i = this.activeEffects.length - 1; i >= 0; i--) {
            const effect = this.activeEffects[i];
            effect.age += deltaTime;

            // Remove expired effects or effects that are too old (safety cleanup)
            if (effect.age >= effect.duration || effect.age > effect.duration * 2) {
                this.activeEffects.splice(i, 1);
                if (effect.age > effect.duration * 2) {
                    console.warn(`Removed stuck visual effect: ${effect.type}`);
                }
            }
        }

        // Safety cleanup: if we have too many effects, clear the oldest ones
        if (this.activeEffects.length > 50) {
            console.warn('Too many active effects, clearing oldest ones');
            this.activeEffects.splice(0, this.activeEffects.length - 25);
        }
    }

    /**
     * Renders all active visual effects
     * @param {CanvasRenderingContext2D} ctx - Canvas rendering context (optional, uses internal if not provided)
     */
    render(ctx = null) {
        const renderCtx = ctx || this.ctx;
        if (!renderCtx) return;

        // Save the initial context state
        renderCtx.save();

        // Render each active effect with individual context management
        for (const effect of this.activeEffects) {
            renderCtx.save(); // Save before each effect
            this.renderEffect(renderCtx, effect);
            renderCtx.restore(); // Restore after each effect
        }

        // Restore the initial context state
        renderCtx.restore();
    }

    /**
     * Renders a single visual effect
     * @param {CanvasRenderingContext2D} ctx - Canvas rendering context
     * @param {Object} effect - Effect object to render
     * @private
     */
    renderEffect(ctx, effect) {
        const progress = effect.age / effect.duration;
        const alpha = 1 - progress;

        ctx.save();
        ctx.globalAlpha = alpha;

        switch (effect.type) {
            case 'clickRipple':
                this.renderClickRipple(ctx, effect, progress);
                break;
            case 'objectHit':
                this.renderObjectHit(ctx, effect, progress);
                break;
            case 'particles':
                this.renderParticles(ctx, effect, progress);
                break;
            case 'screenFlash':
                this.renderScreenFlash(ctx, effect, progress);
                break;
        }

        ctx.restore();
    }

    /**
     * Renders a click ripple effect
     * @param {CanvasRenderingContext2D} ctx - Canvas rendering context
     * @param {Object} effect - Effect object
     * @param {number} progress - Animation progress (0-1)
     * @private
     */
    renderClickRipple(ctx, effect) {
        const progress = effect.age / effect.duration;
        const radius = progress * this.effectConfig.clickRipple.maxRadius;
        const alpha = 1 - progress;

        ctx.strokeStyle = effect.color;
        ctx.lineWidth = this.effectConfig.clickRipple.lineWidth;
        ctx.globalAlpha = alpha;

        ctx.beginPath();
        ctx.arc(effect.x, effect.y, radius, 0, Math.PI * 2);
        ctx.stroke();

        // Add inner ripple for more visual impact
        if (progress > 0.3) {
            const innerRadius = (progress - 0.3) * this.effectConfig.clickRipple.maxRadius * 0.6;
            ctx.globalAlpha = alpha * 0.5;
            ctx.beginPath();
            ctx.arc(effect.x, effect.y, innerRadius, 0, Math.PI * 2);
            ctx.stroke();
        }
    }

    /**
     * Renders an object hit effect
     * @param {CanvasRenderingContext2D} ctx - Canvas rendering context
     * @param {Object} effect - Effect object
     * @param {number} progress - Animation progress (0-1)
     * @private
     */
    renderObjectHit(ctx, effect) {
        const progress = effect.age / effect.duration;
        const pulseScale = 1 + Math.sin(progress * Math.PI * 4) * this.effectConfig.objectHit.pulseIntensity * (1 - progress);
        const alpha = 1 - progress;

        ctx.strokeStyle = effect.color;
        ctx.lineWidth = 4;
        ctx.globalAlpha = alpha;

        // Draw pulsing rectangle around the hit object
        const width = effect.width * pulseScale;
        const height = effect.height * pulseScale;
        const x = effect.x - (width - effect.width) / 2;
        const y = effect.y - (height - effect.height) / 2;

        ctx.strokeRect(x, y, width, height);

        // Add corner highlights
        const cornerSize = 10;
        ctx.lineWidth = 2;
        ctx.globalAlpha = alpha * 0.8;

        // Top-left corner
        ctx.beginPath();
        ctx.moveTo(x, y + cornerSize);
        ctx.lineTo(x, y);
        ctx.lineTo(x + cornerSize, y);
        ctx.stroke();

        // Top-right corner
        ctx.beginPath();
        ctx.moveTo(x + width - cornerSize, y);
        ctx.lineTo(x + width, y);
        ctx.lineTo(x + width, y + cornerSize);
        ctx.stroke();

        // Bottom-left corner
        ctx.beginPath();
        ctx.moveTo(x, y + height - cornerSize);
        ctx.lineTo(x, y + height);
        ctx.lineTo(x + cornerSize, y + height);
        ctx.stroke();

        // Bottom-right corner
        ctx.beginPath();
        ctx.moveTo(x + width - cornerSize, y + height);
        ctx.lineTo(x + width, y + height);
        ctx.lineTo(x + width, y + height - cornerSize);
        ctx.stroke();
    }

    /**
     * Renders particle effects
     * @param {CanvasRenderingContext2D} ctx - Canvas rendering context
     * @param {Object} effect - Effect object
     * @param {number} progress - Animation progress (0-1)
     * @private
     */
    renderParticles(ctx, effect) {
        const progress = effect.age / effect.duration;
        const alpha = 1 - progress;

        ctx.fillStyle = effect.color;
        ctx.globalAlpha = alpha;

        for (const particle of effect.particles) {
            const x = particle.startX + particle.velocityX * (effect.age / 1000);
            const y = particle.startY + particle.velocityY * (effect.age / 1000);
            const size = particle.size * (1 - progress * 0.5);

            ctx.beginPath();
            ctx.arc(x, y, size, 0, Math.PI * 2);
            ctx.fill();
        }
    }

    /**
     * Renders screen flash effect
     * @param {CanvasRenderingContext2D} ctx - Canvas rendering context
     * @param {Object} effect - Effect object
     * @param {number} progress - Animation progress (0-1)
     * @private
     */
    renderScreenFlash(ctx, effect) {
        const alpha = this.effectConfig.screenFlash.intensity * (1 - progress);
        
        // Only render if alpha is significant enough to be visible
        if (alpha > 0.01) {
            ctx.save();
            ctx.fillStyle = effect.color;
            ctx.globalAlpha = alpha;
            ctx.fillRect(0, 0, this.canvas.width, this.canvas.height);
            ctx.restore();
        }
    }

    /**
     * Triggers a click feedback effect
     * @param {number} x - Click X coordinate
     * @param {number} y - Click Y coordinate
     * @param {string} type - Type of click ('object_hit', 'missed', 'outside_bounds')
     * @param {InformationObject|null} clickedObject - The clicked object (if any)
     */
    showClickFeedback(x, y, type, clickedObject = null) {
        let color;
        let effectType = 'clickRipple';

        switch (type) {
            case 'object_hit':
                if (clickedObject) {
                    // Determine if the click was correct
                    const wasCorrect = clickedObject.isCorrupted;
                    color = wasCorrect ? 
                        this.effectConfig.clickRipple.successColor : 
                        this.effectConfig.clickRipple.failColor;
                    
                    // Add object hit effect
                    this.addObjectHitEffect(clickedObject, wasCorrect);
                    
                    // Add particles for successful hits
                    if (wasCorrect) {
                        this.addParticleEffect(x, y, color);
                    }
                } else {
                    color = this.effectConfig.clickRipple.successColor;
                }
                break;
            case 'missed':
                color = this.effectConfig.clickRipple.missColor;
                break;
            case 'outside_bounds':
                color = this.effectConfig.clickRipple.failColor;
                break;
            default:
                color = this.effectConfig.clickRipple.missColor;
        }

        // Add ripple effect
        this.addClickRippleEffect(x, y, color);

        console.log(`Visual feedback: ${type} at (${x.toFixed(1)}, ${y.toFixed(1)})`);
    }

    /**
     * Adds a click ripple effect
     * @param {number} x - X coordinate
     * @param {number} y - Y coordinate
     * @param {string} color - Effect color
     * @private
     */
    addClickRippleEffect(x, y, color) {
        const effect = {
            type: 'clickRipple',
            x: x,
            y: y,
            color: color,
            age: 0,
            duration: this.effectConfig.clickRipple.duration
        };

        this.activeEffects.push(effect);
    }

    /**
     * Adds an object hit effect
     * @param {InformationObject} object - The hit object
     * @param {boolean} wasCorrect - Whether the hit was correct
     * @private
     */
    addObjectHitEffect(object, wasCorrect) {
        const bounds = object.getBounds();
        const color = wasCorrect ? 
            this.effectConfig.objectHit.successColor : 
            this.effectConfig.objectHit.failColor;

        const effect = {
            type: 'objectHit',
            x: bounds.x,
            y: bounds.y,
            width: bounds.width,
            height: bounds.height,
            color: color,
            age: 0,
            duration: this.effectConfig.objectHit.duration
        };

        this.activeEffects.push(effect);
    }

    /**
     * Adds a particle effect
     * @param {number} x - X coordinate
     * @param {number} y - Y coordinate
     * @param {string} color - Particle color
     * @private
     */
    addParticleEffect(x, y, color) {
        const particles = [];
        const particleCount = this.effectConfig.particleEffect.particleCount;

        for (let i = 0; i < particleCount; i++) {
            const angle = (i / particleCount) * Math.PI * 2;
            const speed = this.effectConfig.particleEffect.speed;
            
            particles.push({
                startX: x,
                startY: y,
                velocityX: Math.cos(angle) * speed,
                velocityY: Math.sin(angle) * speed,
                size: Math.random() * 3 + 2
            });
        }

        const effect = {
            type: 'particles',
            x: x,
            y: y,
            color: color,
            particles: particles,
            age: 0,
            duration: this.effectConfig.particleEffect.duration
        };

        this.activeEffects.push(effect);
    }

    /**
     * Shows a screen flash effect
     * @param {string} color - Flash color
     * @param {number} intensity - Flash intensity (0-1, optional)
     */
    showScreenFlash(color = '#FFFFFF', intensity = null) {
        const flashIntensity = intensity !== null ? intensity : this.effectConfig.screenFlash.intensity;
        
        const effect = {
            type: 'screenFlash',
            color: color,
            intensity: flashIntensity,
            age: 0,
            duration: this.effectConfig.screenFlash.duration
        };

        this.activeEffects.push(effect);
        console.log(`Screen flash effect triggered: ${color}`);
    }

    /**
     * Shows visual feedback for successful classification
     * @param {number} x - X coordinate
     * @param {number} y - Y coordinate
     */
    showSuccessFeedback(x, y) {
        this.addClickRippleEffect(x, y, this.effectConfig.clickRipple.successColor);
        this.addParticleEffect(x, y, this.effectConfig.clickRipple.successColor);
    }

    /**
     * Shows visual feedback for failed classification
     * @param {number} x - X coordinate
     * @param {number} y - Y coordinate
     */
    showFailureFeedback(x, y) {
        this.addClickRippleEffect(x, y, this.effectConfig.clickRipple.failColor);
        this.showScreenFlash(this.effectConfig.clickRipple.failColor, 0.2);
    }

    /**
     * Clears all active effects
     */
    clearAllEffects() {
        this.activeEffects = [];
        console.log('All visual effects cleared');
    }

    /**
     * Clears screen flash effects specifically (useful for fixing stuck dark overlays)
     */
    clearScreenFlashEffects() {
        const beforeCount = this.activeEffects.length;
        this.activeEffects = this.activeEffects.filter(effect => effect.type !== 'screenFlash');
        const afterCount = this.activeEffects.length;
        
        if (beforeCount !== afterCount) {
            console.log(`Cleared ${beforeCount - afterCount} screen flash effects`);
        }
    }

    /**
     * Force clears any effects that might be causing visual issues
     */
    forceCleanup() {
        this.clearScreenFlashEffects();
        
        // Remove any effects older than their intended duration
        const currentTime = performance.now();
        this.activeEffects = this.activeEffects.filter(effect => {
            const isExpired = effect.age >= effect.duration;
            if (isExpired) {
                console.log(`Force removed expired effect: ${effect.type}`);
            }
            return !isExpired;
        });
        
        console.log('Force cleanup completed');
    }

    /**
     * Updates effect configuration
     * @param {Object} newConfig - New configuration object
     */
    updateConfig(newConfig) {
        this.effectConfig = { ...this.effectConfig, ...newConfig };
        console.log('Visual feedback configuration updated');
    }

    /**
     * Gets the number of active effects
     * @returns {number} Count of active effects
     */
    getActiveEffectCount() {
        return this.activeEffects.length;
    }

    /**
     * Gets visual feedback system statistics
     * @returns {Object} Statistics object
     */
    getStats() {
        const effectTypes = {};
        for (const effect of this.activeEffects) {
            effectTypes[effect.type] = (effectTypes[effect.type] || 0) + 1;
        }

        return {
            activeEffects: this.activeEffects.length,
            effectTypes: effectTypes,
            canvasDimensions: {
                width: this.canvas.width,
                height: this.canvas.height
            }
        };
    }

    /**
     * Destroys the visual feedback system and cleans up resources
     */
    destroy() {
        this.clearAllEffects();
        this.canvas = null;
        this.ctx = null;
        console.log('VisualFeedbackSystem destroyed');
    }
}