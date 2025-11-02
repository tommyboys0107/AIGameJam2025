// Corruption System - Tracks player performance and system integrity
import { GameEndType, GAME_CONSTANTS } from '../core/constants.js';
import { CorruptionMetrics } from '../core/dataClasses.js';

export class CorruptionSystem {
    constructor(corruptionThreshold = GAME_CONSTANTS.MAX_CORRUPTION) {
        // Corruption tracking
        this.corruptionThreshold = corruptionThreshold;
        this.metrics = new CorruptionMetrics();
        
        // Corruption penalties configuration
        this.corruptionPenalties = {
            missedCorrupted: 15,    // Penalty for letting corrupted content through
            falsePositive: 8,       // Penalty for blocking legitimate content
            correctBlock: -2,       // Reward for correctly blocking corrupted content
            correctAllow: -1        // Small reward for correctly allowing legitimate content
        };
        
        // Event callbacks
        this.onCorruptionChange = null;
        this.onGameOver = null;
        this.onAccuracyChange = null;
        
        // Performance tracking
        this.recentDecisions = []; // Track recent decisions for trend analysis
        this.maxRecentDecisions = 10;
        
        console.log('CorruptionSystem initialized with threshold:', this.corruptionThreshold);
    }

    /**
     * Process a player decision about an information object
     * @param {boolean} wasBlocked - Whether the player blocked the object
     * @param {boolean} wasCorrupted - Whether the object was actually corrupted
     */
    processDecision(wasBlocked, wasCorrupted) {
        let corruptionChange = 0;
        let decisionType = '';
        
        if (wasCorrupted && wasBlocked) {
            // Correct: Blocked corrupted content
            this.metrics.correctBlocks++;
            corruptionChange = this.corruptionPenalties.correctBlock;
            decisionType = 'correctBlock';
        } else if (wasCorrupted && !wasBlocked) {
            // Error: Missed corrupted content
            this.metrics.missedCorrupted++;
            corruptionChange = this.corruptionPenalties.missedCorrupted;
            decisionType = 'missedCorrupted';
        } else if (!wasCorrupted && wasBlocked) {
            // Error: Blocked legitimate content (false positive)
            this.metrics.falsePositives++;
            corruptionChange = this.corruptionPenalties.falsePositive;
            decisionType = 'falsePositive';
        } else {
            // Correct: Allowed legitimate content
            corruptionChange = this.corruptionPenalties.correctAllow;
            decisionType = 'correctAllow';
        }
        
        // Apply corruption change
        this.updateCorruption(corruptionChange);
        
        // Track recent decision
        this.trackRecentDecision(decisionType, corruptionChange);
        
        // Log decision for debugging
        console.log(`Decision processed: ${decisionType}, corruption change: ${corruptionChange}, total: ${this.metrics.currentCorruption.toFixed(1)}`);
        
        // Check for game over condition
        if (this.metrics.currentCorruption >= this.corruptionThreshold) {
            this.triggerGameOver();
        }
        
        // Notify listeners
        if (this.onAccuracyChange) {
            this.onAccuracyChange(this.metrics.accuracy);
        }
    }

    /**
     * Update corruption level
     * @param {number} change - Amount to change corruption by (can be negative)
     */
    updateCorruption(change) {
        const previousCorruption = this.metrics.currentCorruption;
        this.metrics.currentCorruption = Math.max(0, Math.min(this.corruptionThreshold, this.metrics.currentCorruption + change));
        
        // Notify if corruption changed
        if (this.metrics.currentCorruption !== previousCorruption && this.onCorruptionChange) {
            this.onCorruptionChange(this.metrics.currentCorruption, this.corruptionThreshold);
        }
    }

    /**
     * Track recent decision for trend analysis
     * @param {string} decisionType - Type of decision made
     * @param {number} corruptionChange - Corruption change from this decision
     */
    trackRecentDecision(decisionType, corruptionChange) {
        this.recentDecisions.push({
            type: decisionType,
            corruptionChange: corruptionChange,
            timestamp: Date.now(),
            accuracy: this.metrics.accuracy
        });
        
        // Keep only recent decisions
        if (this.recentDecisions.length > this.maxRecentDecisions) {
            this.recentDecisions.shift();
        }
    }

    /**
     * Trigger game over due to corruption
     */
    triggerGameOver() {
        console.log('Game over triggered due to corruption threshold reached');
        
        if (this.onGameOver) {
            this.onGameOver(GameEndType.CORRUPTION);
        }
    }

    /**
     * Reset corruption system for new game
     */
    reset() {
        console.log('Resetting CorruptionSystem...');
        
        this.metrics.reset();
        this.recentDecisions = [];
        
        // Notify listeners of reset
        if (this.onCorruptionChange) {
            this.onCorruptionChange(0, this.corruptionThreshold);
        }
        
        if (this.onAccuracyChange) {
            this.onAccuracyChange(0);
        }
        
        console.log('CorruptionSystem reset complete');
    }

    /**
     * Update system (called from game loop)
     */
    update() {
        // Currently no per-frame updates needed
        // This method exists for consistency with other systems
        // and future expansion (e.g., corruption decay over time)
    }

    /**
     * Get current corruption level
     * @returns {number} Current corruption level (0 to threshold)
     */
    getCurrentCorruption() {
        return this.metrics.currentCorruption;
    }

    /**
     * Get corruption as percentage
     * @returns {number} Corruption percentage (0.0 to 1.0)
     */
    getCorruptionPercentage() {
        return this.metrics.currentCorruption / this.corruptionThreshold;
    }

    /**
     * Get current accuracy
     * @returns {number} Accuracy percentage (0.0 to 1.0)
     */
    getAccuracy() {
        return this.metrics.accuracy;
    }

    /**
     * Get corruption metrics
     * @returns {CorruptionMetrics} Current metrics object
     */
    getMetrics() {
        return this.metrics;
    }

    /**
     * Get performance statistics
     * @returns {Object} Performance statistics
     */
    getPerformanceStats() {
        const totalDecisions = this.metrics.correctBlocks + this.metrics.missedCorrupted + this.metrics.falsePositives;
        
        return {
            totalDecisions: totalDecisions,
            correctBlocks: this.metrics.correctBlocks,
            missedCorrupted: this.metrics.missedCorrupted,
            falsePositives: this.metrics.falsePositives,
            accuracy: this.metrics.accuracy,
            currentCorruption: this.metrics.currentCorruption,
            corruptionPercentage: this.getCorruptionPercentage(),
            corruptionThreshold: this.corruptionThreshold,
            recentTrend: this.getRecentTrend()
        };
    }

    /**
     * Get recent performance trend
     * @returns {Object} Recent trend analysis
     */
    getRecentTrend() {
        if (this.recentDecisions.length < 3) {
            return { trend: 'insufficient_data', direction: 0 };
        }
        
        const recentCorruptionChanges = this.recentDecisions.slice(-5).map(d => d.corruptionChange);
        const averageChange = recentCorruptionChanges.reduce((sum, change) => sum + change, 0) / recentCorruptionChanges.length;
        
        let trend = 'stable';
        if (averageChange > 2) {
            trend = 'declining';
        } else if (averageChange < -1) {
            trend = 'improving';
        }
        
        return {
            trend: trend,
            direction: averageChange,
            recentAccuracy: this.recentDecisions.slice(-5).reduce((sum, d) => sum + d.accuracy, 0) / Math.min(5, this.recentDecisions.length)
        };
    }

    /**
     * Check if corruption is at critical level
     * @returns {boolean} True if corruption is above 80% of threshold
     */
    isCriticalCorruption() {
        return this.metrics.currentCorruption >= (this.corruptionThreshold * 0.8);
    }

    /**
     * Check if corruption is at warning level
     * @returns {boolean} True if corruption is above 60% of threshold
     */
    isWarningCorruption() {
        return this.metrics.currentCorruption >= (this.corruptionThreshold * 0.6);
    }

    /**
     * Get corruption level category
     * @returns {string} Corruption level category ('safe', 'warning', 'critical', 'failure')
     */
    getCorruptionLevel() {
        const percentage = this.getCorruptionPercentage();
        
        if (percentage >= 1.0) {
            return 'failure';
        } else if (percentage >= 0.8) {
            return 'critical';
        } else if (percentage >= 0.6) {
            return 'warning';
        } else {
            return 'safe';
        }
    }

    /**
     * Update corruption penalties configuration
     * @param {Object} newPenalties - New penalty configuration
     */
    updatePenalties(newPenalties) {
        this.corruptionPenalties = { ...this.corruptionPenalties, ...newPenalties };
        console.log('Corruption penalties updated:', this.corruptionPenalties);
    }

    /**
     * Update corruption threshold
     * @param {number} newThreshold - New corruption threshold
     */
    updateThreshold(newThreshold) {
        this.corruptionThreshold = newThreshold;
        console.log('Corruption threshold updated:', this.corruptionThreshold);
        
        // Check if current corruption exceeds new threshold
        if (this.metrics.currentCorruption >= this.corruptionThreshold) {
            this.triggerGameOver();
        }
    }

    /**
     * Get detailed decision history
     * @returns {Array} Array of recent decisions
     */
    getDecisionHistory() {
        return [...this.recentDecisions];
    }

    /**
     * Simulate corruption for testing
     * @param {number} amount - Amount of corruption to add
     */
    simulateCorruption(amount) {
        console.log(`Simulating corruption: ${amount}`);
        this.updateCorruption(amount);
    }
}