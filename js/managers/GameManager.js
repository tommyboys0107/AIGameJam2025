// Game Manager - Central coordinator for all game systems
import { GameEndType, GAME_CONSTANTS } from '../core/constants.js';
import { InputHandler } from '../core/InputHandler.js';
import { VisualFeedbackSystem } from '../ui/VisualFeedbackSystem.js';

export class GameManager {
    constructor() {
        this.gameState = 'menu'; // 'menu', 'playing', 'paused', 'gameOver'
        this.isInitialized = false;
        
        // Subsystem references
        this.phaseManager = null;
        this.dataStreamGenerator = null;
        this.corruptionSystem = null;
        this.uiManager = null;
        this.inputHandler = null;
        this.visualFeedbackSystem = null;
        
        // Game timing
        this.gameStartTime = 0;
        this.pausedTime = 0;
        this.totalPausedDuration = 0;
        
        // Animation frame reference
        this.animationFrameId = null;
        
        // Bind methods to maintain context
        this.gameLoop = this.gameLoop.bind(this);
    }

    /**
     * Initialize all game subsystems
     * @param {Object} subsystems - Object containing all subsystem instances
     */
    initialize(subsystems) {
        if (this.isInitialized) {
            console.warn('GameManager already initialized');
            return;
        }

        this.phaseManager = subsystems.phaseManager;
        this.dataStreamGenerator = subsystems.dataStreamGenerator;
        this.corruptionSystem = subsystems.corruptionSystem;
        this.uiManager = subsystems.uiManager;

        // Validate all required subsystems are provided
        if (!this.phaseManager || !this.dataStreamGenerator || !this.corruptionSystem || !this.uiManager) {
            throw new Error('GameManager requires all subsystems: phaseManager, dataStreamGenerator, corruptionSystem, uiManager');
        }

        // Initialize input handler with canvas
        const canvas = subsystems.canvas || document.getElementById('game-canvas');
        if (!canvas) {
            throw new Error('GameManager requires canvas element for input handling');
        }
        
        this.inputHandler = new InputHandler(canvas, this.dataStreamGenerator);
        this.visualFeedbackSystem = new VisualFeedbackSystem(canvas);

        // Set up event listeners and connections between systems
        this.setupSystemConnections();
        
        this.isInitialized = true;
        console.log('GameManager initialized successfully');
    }

    /**
     * Set up connections and event listeners between subsystems
     */
    setupSystemConnections() {
        // Connect corruption system to game end events
        this.corruptionSystem.onGameOver = (endType) => {
            this.endGame(endType);
        };

        // Connect phase manager to UI updates
        this.phaseManager.onPhaseChange = (newPhase) => {
            this.uiManager.updatePhaseDisplay(newPhase);
        };

        // Connect data stream generator to corruption system for scoring
        this.dataStreamGenerator.onObjectProcessed = (wasCorrect, wasCorrupted) => {
            this.corruptionSystem.processDecision(wasCorrect, wasCorrupted);
        };

        // Connect input handler callbacks with visual feedback
        this.inputHandler.setValidClickCallback((clickedObject, x, y) => {
            console.log(`Valid click on ${clickedObject.isCorrupted ? 'corrupted' : 'legitimate'} object`);
            const wasCorrect = clickedObject.isCorrupted; // Correct to block corrupted objects
            if (wasCorrect) {
                this.visualFeedbackSystem.showSuccessFeedback(x, y);
                this.uiManager.showSuccessFeedback();
            } else {
                this.visualFeedbackSystem.showFailureFeedback(x, y);
                this.uiManager.showFailureFeedback();
            }
        });

        this.inputHandler.setInvalidClickCallback((x, y, reason) => {
            console.log(`Invalid click at (${x}, ${y}): ${reason}`);
            this.visualFeedbackSystem.showClickFeedback(x, y, reason, null);
            this.uiManager.showFeedbackMessage('INVALID TARGET', 'warning', 1500);
        });

        this.inputHandler.setClickFeedbackCallback((x, y, type, object) => {
            this.visualFeedbackSystem.showClickFeedback(x, y, type, object);
        });
    }

    /**
     * Start a new game
     */
    startGame() {
        if (!this.isInitialized) {
            throw new Error('GameManager must be initialized before starting game');
        }

        if (this.gameState === 'playing') {
            console.warn('Game is already running');
            return;
        }

        console.log('Starting new game...');
        
        // Reset all systems
        this.resetGameState();
        
        // Initialize subsystems for new game
        this.phaseManager.startGame();
        this.corruptionSystem.reset();
        this.dataStreamGenerator.startSpawning();
        
        // Enable input handling
        this.inputHandler.enable();
        
        // Update UI
        this.uiManager.showGameplayUI();
        this.uiManager.updateCorruptionMeter(0);
        
        // Set game state and timing
        this.gameState = 'playing';
        this.gameStartTime = Date.now();
        this.totalPausedDuration = 0;
        
        // Start game loop
        this.startGameLoop();
        
        console.log('Game started successfully');
    }

    /**
     * Pause the current game
     */
    pauseGame() {
        if (this.gameState !== 'playing') {
            console.warn('Cannot pause game - not currently playing');
            return;
        }

        console.log('Pausing game...');
        
        this.gameState = 'paused';
        this.pausedTime = Date.now();
        
        // Pause all subsystems
        this.phaseManager.pause();
        this.dataStreamGenerator.pause();
        this.inputHandler.disable();
        
        // Stop game loop
        this.stopGameLoop();
        
        // Update UI
        this.uiManager.showPauseOverlay();
        
        console.log('Game paused');
    }

    /**
     * Resume the paused game
     */
    resumeGame() {
        if (this.gameState !== 'paused') {
            console.warn('Cannot resume game - not currently paused');
            return;
        }

        console.log('Resuming game...');
        
        // Calculate paused duration
        const pauseDuration = Date.now() - this.pausedTime;
        this.totalPausedDuration += pauseDuration;
        
        this.gameState = 'playing';
        
        // Resume all subsystems
        this.phaseManager.resume();
        this.dataStreamGenerator.resume();
        this.inputHandler.enable();
        
        // Restart game loop
        this.startGameLoop();
        
        // Update UI
        this.uiManager.hidePauseOverlay();
        
        console.log('Game resumed');
    }

    /**
     * End the current game
     * @param {string} endType - Type of game ending (GameEndType enum)
     */
    endGame(endType) {
        if (this.gameState === 'gameOver') {
            console.warn('Game already ended');
            return;
        }

        console.log(`Ending game with type: ${endType}`);
        
        this.gameState = 'gameOver';
        
        // Stop all subsystems
        this.phaseManager.stop();
        this.dataStreamGenerator.stopSpawning();
        this.inputHandler.disable();
        
        // Stop game loop
        this.stopGameLoop();
        
        // Calculate final stats
        const gameStats = this.calculateGameStats();
        
        // Show game over UI
        this.uiManager.showGameOverScreen(endType, gameStats);
        
        console.log('Game ended', { endType, stats: gameStats });
    }

    /**
     * Reset game to menu state
     */
    resetToMenu() {
        console.log('Resetting to menu...');
        
        // Stop all systems
        this.stopGameLoop();
        this.phaseManager?.stop();
        this.dataStreamGenerator?.stopSpawning();
        this.inputHandler?.disable();
        
        // Reset state
        this.resetGameState();
        this.gameState = 'menu';
        
        // Show menu UI
        this.uiManager.showMenuUI();
        
        console.log('Reset to menu complete');
    }

    /**
     * Main game loop
     */
    gameLoop() {
        if (this.gameState !== 'playing') {
            return;
        }

        const currentTime = Date.now();
        const elapsedTime = currentTime - this.gameStartTime - this.totalPausedDuration;
        
        // Check for maximum game duration
        if (elapsedTime >= GAME_CONSTANTS.MAX_GAME_DURATION) {
            this.endGame(GameEndType.SUCCESS);
            return;
        }

        // Update all subsystems
        this.phaseManager.update(elapsedTime);
        this.dataStreamGenerator.update();
        this.corruptionSystem.update();
        this.visualFeedbackSystem.update(currentTime);
        
        // Render game objects and effects
        this.renderGame();
        
        // Update UI with current corruption level
        this.uiManager.updateCorruptionMeter(this.corruptionSystem.getCurrentCorruption());
        this.uiManager.updateTimer(elapsedTime);
        
        // Continue game loop
        this.animationFrameId = requestAnimationFrame(this.gameLoop);
    }

    /**
     * Renders the game canvas with objects and visual effects
     * @private
     */
    renderGame() {
        const canvas = document.getElementById('game-canvas');
        if (!canvas) return;

        const ctx = canvas.getContext('2d');
        if (!ctx) return;

        // Clear canvas
        ctx.clearRect(0, 0, canvas.width, canvas.height);

        // Render data stream objects
        this.dataStreamGenerator.render(ctx);

        // Render visual feedback effects on top
        this.visualFeedbackSystem.render(ctx);
    }

    /**
     * Start the game loop
     */
    startGameLoop() {
        this.stopGameLoop(); // Ensure no duplicate loops
        this.animationFrameId = requestAnimationFrame(this.gameLoop);
    }

    /**
     * Stop the game loop
     */
    stopGameLoop() {
        if (this.animationFrameId) {
            cancelAnimationFrame(this.animationFrameId);
            this.animationFrameId = null;
        }
    }

    /**
     * Reset internal game state
     */
    resetGameState() {
        this.gameStartTime = 0;
        this.pausedTime = 0;
        this.totalPausedDuration = 0;
        this.stopGameLoop();
    }

    /**
     * Calculate final game statistics
     * @returns {Object} Game statistics object
     */
    calculateGameStats() {
        const elapsedTime = Date.now() - this.gameStartTime - this.totalPausedDuration;
        const corruptionMetrics = this.corruptionSystem.getMetrics();
        
        return {
            playTime: elapsedTime,
            finalCorruption: corruptionMetrics.currentCorruption,
            accuracy: corruptionMetrics.accuracy,
            correctBlocks: corruptionMetrics.correctBlocks,
            missedCorrupted: corruptionMetrics.missedCorrupted,
            falsePositives: corruptionMetrics.falsePositives,
            finalPhase: this.phaseManager.getCurrentPhase()
        };
    }

    /**
     * Get current game state
     * @returns {string} Current game state
     */
    getGameState() {
        return this.gameState;
    }

    /**
     * Check if game is currently running
     * @returns {boolean} True if game is in playing state
     */
    isPlaying() {
        return this.gameState === 'playing';
    }

    /**
     * Check if game is paused
     * @returns {boolean} True if game is paused
     */
    isPaused() {
        return this.gameState === 'paused';
    }

    /**
     * Get elapsed game time (excluding paused time)
     * @returns {number} Elapsed time in milliseconds
     */
    getElapsedTime() {
        if (this.gameState === 'menu' || this.gameStartTime === 0) {
            return 0;
        }
        
        const currentTime = Date.now();
        let totalPaused = this.totalPausedDuration;
        
        // Add current pause duration if currently paused
        if (this.gameState === 'paused') {
            totalPaused += currentTime - this.pausedTime;
        }
        
        return currentTime - this.gameStartTime - totalPaused;
    }
}