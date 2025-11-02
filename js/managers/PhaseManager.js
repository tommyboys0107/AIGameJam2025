// Phase Manager - Controls game progression and difficulty scaling
import { GamePhase, GAME_CONSTANTS } from '../core/constants.js';
import { PhaseSettings } from '../core/dataClasses.js';

export class PhaseManager {
    constructor(settings = null) {
        // Phase settings configuration
        this.settings = settings || new PhaseSettings();
        
        // Current phase state
        this.currentPhase = GamePhase.TEXT;
        this.phaseStartTime = 0;
        this.phaseNumber = 0;
        this.difficultyMultiplier = 1.0;
        
        // Timing management
        this.gameStartTime = 0;
        this.isPaused = false;
        this.pausedTime = 0;
        this.totalPausedDuration = 0;
        
        // Phase cycle order
        this.phaseOrder = [GamePhase.TEXT, GamePhase.ART];
        this.currentPhaseIndex = 0;
        
        // Event callbacks
        this.onPhaseChange = null;
        this.onDifficultyIncrease = null;
        
        console.log('PhaseManager initialized with settings:', this.settings);
    }

    /**
     * Start the phase management system
     */
    startGame() {
        console.log('PhaseManager starting game...');
        
        this.gameStartTime = Date.now();
        this.phaseStartTime = this.gameStartTime;
        this.phaseNumber = 1;
        this.currentPhaseIndex = 0;
        this.currentPhase = this.phaseOrder[this.currentPhaseIndex];
        this.difficultyMultiplier = 1.0;
        this.isPaused = false;
        this.totalPausedDuration = 0;
        
        // Notify about initial phase
        if (this.onPhaseChange) {
            this.onPhaseChange(this.currentPhase, this.phaseNumber, this.difficultyMultiplier);
        }
        
        console.log(`Game started with phase: ${this.currentPhase}`);
    }

    /**
     * Update phase management (called from game loop)
     * @param {number} elapsedGameTime - Total elapsed game time in milliseconds
     */
    update(elapsedGameTime) {
        if (this.isPaused) {
            return;
        }

        // Check if it's time to advance to next phase
        const currentTime = Date.now();
        const phaseElapsedTime = currentTime - this.phaseStartTime - this.totalPausedDuration;
        
        if (phaseElapsedTime >= this.settings.phaseDuration) {
            this.advancePhase();
        }
    }

    /**
     * Advance to the next phase
     */
    advancePhase() {
        console.log(`Advancing from phase ${this.currentPhase} (${this.phaseNumber})`);
        
        // Move to next phase in cycle
        this.currentPhaseIndex = (this.currentPhaseIndex + 1) % this.phaseOrder.length;
        this.currentPhase = this.phaseOrder[this.currentPhaseIndex];
        this.phaseNumber++;
        
        // Increase difficulty
        this.difficultyMultiplier *= this.settings.difficultyIncreaseRate;
        
        // Reset phase timer
        this.phaseStartTime = Date.now();
        
        // Notify listeners about phase change
        if (this.onPhaseChange) {
            this.onPhaseChange(this.currentPhase, this.phaseNumber, this.difficultyMultiplier);
        }
        
        if (this.onDifficultyIncrease) {
            this.onDifficultyIncrease(this.difficultyMultiplier);
        }
        
        console.log(`Advanced to phase: ${this.currentPhase} (${this.phaseNumber}), difficulty: ${this.difficultyMultiplier.toFixed(2)}`);
    }

    /**
     * Pause the phase manager
     */
    pause() {
        if (this.isPaused) {
            console.warn('PhaseManager already paused');
            return;
        }
        
        console.log('PhaseManager paused');
        this.isPaused = true;
        this.pausedTime = Date.now();
    }

    /**
     * Resume the phase manager
     */
    resume() {
        if (!this.isPaused) {
            console.warn('PhaseManager not paused');
            return;
        }
        
        console.log('PhaseManager resumed');
        
        // Calculate pause duration and add to total
        const pauseDuration = Date.now() - this.pausedTime;
        this.totalPausedDuration += pauseDuration;
        
        this.isPaused = false;
        this.pausedTime = 0;
    }

    /**
     * Stop the phase manager
     */
    stop() {
        console.log('PhaseManager stopped');
        this.isPaused = false;
        this.pausedTime = 0;
        this.totalPausedDuration = 0;
    }

    /**
     * Get the current phase
     * @returns {string} Current game phase
     */
    getCurrentPhase() {
        return this.currentPhase;
    }

    /**
     * Get the current phase number
     * @returns {number} Current phase number (1-based)
     */
    getPhaseNumber() {
        return this.phaseNumber;
    }

    /**
     * Get the current difficulty multiplier
     * @returns {number} Current difficulty multiplier
     */
    getDifficultyMultiplier() {
        return this.difficultyMultiplier;
    }

    /**
     * Get time remaining in current phase
     * @returns {number} Time remaining in milliseconds
     */
    getPhaseTimeRemaining() {
        if (this.isPaused || this.phaseStartTime === 0) {
            return this.settings.phaseDuration;
        }
        
        const currentTime = Date.now();
        const phaseElapsedTime = currentTime - this.phaseStartTime - this.totalPausedDuration;
        const timeRemaining = this.settings.phaseDuration - phaseElapsedTime;
        
        return Math.max(0, timeRemaining);
    }

    /**
     * Get elapsed time in current phase
     * @returns {number} Elapsed time in milliseconds
     */
    getPhaseElapsedTime() {
        if (this.phaseStartTime === 0) {
            return 0;
        }
        
        const currentTime = Date.now();
        let totalPaused = this.totalPausedDuration;
        
        // Add current pause duration if currently paused
        if (this.isPaused) {
            totalPaused += currentTime - this.pausedTime;
        }
        
        return currentTime - this.phaseStartTime - totalPaused;
    }

    /**
     * Get phase progress as percentage
     * @returns {number} Phase progress (0.0 to 1.0)
     */
    getPhaseProgress() {
        const elapsed = this.getPhaseElapsedTime();
        return Math.min(1.0, elapsed / this.settings.phaseDuration);
    }

    /**
     * Check if maximum game time has been reached
     * @returns {boolean} True if game should end due to time limit
     */
    isGameTimeExpired() {
        if (this.gameStartTime === 0) {
            return false;
        }
        
        const currentTime = Date.now();
        let totalPaused = this.totalPausedDuration;
        
        // Add current pause duration if currently paused
        if (this.isPaused) {
            totalPaused += currentTime - this.pausedTime;
        }
        
        const elapsedGameTime = currentTime - this.gameStartTime - totalPaused;
        return elapsedGameTime >= this.settings.maxGameDuration;
    }

    /**
     * Get total elapsed game time
     * @returns {number} Total elapsed game time in milliseconds
     */
    getTotalElapsedTime() {
        if (this.gameStartTime === 0) {
            return 0;
        }
        
        const currentTime = Date.now();
        let totalPaused = this.totalPausedDuration;
        
        // Add current pause duration if currently paused
        if (this.isPaused) {
            totalPaused += currentTime - this.pausedTime;
        }
        
        return currentTime - this.gameStartTime - totalPaused;
    }

    /**
     * Get time remaining in game
     * @returns {number} Time remaining in milliseconds
     */
    getGameTimeRemaining() {
        const elapsed = this.getTotalElapsedTime();
        return Math.max(0, this.settings.maxGameDuration - elapsed);
    }

    /**
     * Force advance to a specific phase (for testing/debugging)
     * @param {string} phase - Phase to advance to (GamePhase enum value)
     */
    forcePhase(phase) {
        if (!Object.values(GamePhase).includes(phase)) {
            console.error(`Invalid phase: ${phase}`);
            return;
        }
        
        console.log(`Force advancing to phase: ${phase}`);
        
        this.currentPhase = phase;
        this.currentPhaseIndex = this.phaseOrder.indexOf(phase);
        this.phaseNumber++;
        this.phaseStartTime = Date.now();
        
        // Notify listeners
        if (this.onPhaseChange) {
            this.onPhaseChange(this.currentPhase, this.phaseNumber, this.difficultyMultiplier);
        }
    }

    /**
     * Update phase settings
     * @param {PhaseSettings} newSettings - New phase settings
     */
    updateSettings(newSettings) {
        this.settings = newSettings;
        console.log('PhaseManager settings updated:', this.settings);
    }

    /**
     * Get current phase settings
     * @returns {PhaseSettings} Current phase settings
     */
    getSettings() {
        return this.settings;
    }

    /**
     * Get phase statistics
     * @returns {Object} Phase statistics object
     */
    getPhaseStats() {
        return {
            currentPhase: this.currentPhase,
            phaseNumber: this.phaseNumber,
            difficultyMultiplier: this.difficultyMultiplier,
            phaseProgress: this.getPhaseProgress(),
            phaseTimeRemaining: this.getPhaseTimeRemaining(),
            totalElapsedTime: this.getTotalElapsedTime(),
            gameTimeRemaining: this.getGameTimeRemaining(),
            isPaused: this.isPaused
        };
    }
}