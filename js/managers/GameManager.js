// Game Manager - Central coordinator for all game systems
import { GameEndType, GAME_CONSTANTS } from '../core/constants.js';
import { InputHandler } from '../core/InputHandler.js';
import { VisualFeedbackSystem } from '../ui/VisualFeedbackSystem.js';
import { AudioManager } from './AudioManager.js';
import { ScreenEffectsManager } from '../ui/ScreenEffectsManager.js';

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
        this.audioManager = null;
        this.screenEffectsManager = null;
        
        // Game timing
        this.gameStartTime = 0;
        this.pausedTime = 0;
        this.totalPausedDuration = 0;
        
        // Animation frame reference
        this.animationFrameId = null;
        this.lastFrameTime = 0;
        
        // Background image
        this.backgroundImage = null;
        this.loadBackgroundImage();
        
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

        try {
            // Validate subsystems object
            if (!subsystems || typeof subsystems !== 'object') {
                throw new Error('Invalid subsystems object provided');
            }

            // Extract and validate required subsystems
            const { phaseManager, dataStreamGenerator, corruptionSystem, uiManager, canvas } = subsystems;
            
            if (!phaseManager) throw new Error('PhaseManager is required');
            if (!dataStreamGenerator) throw new Error('DataStreamGenerator is required');
            if (!corruptionSystem) throw new Error('CorruptionSystem is required');
            if (!uiManager) throw new Error('UIManager is required');
            if (!canvas) throw new Error('Canvas element is required');

            // Assign subsystems
            this.phaseManager = phaseManager;
            this.dataStreamGenerator = dataStreamGenerator;
            this.corruptionSystem = corruptionSystem;
            this.uiManager = uiManager;

            // Validate canvas element
            if (!canvas.getContext) {
                throw new Error('Invalid canvas element - missing getContext method');
            }

            const ctx = canvas.getContext('2d');
            if (!ctx) {
                throw new Error('Failed to get 2D rendering context from canvas');
            }

            // Initialize input handler with error handling
            try {
                this.inputHandler = new InputHandler(canvas, this.dataStreamGenerator);
            } catch (inputError) {
                console.error('Failed to initialize InputHandler:', inputError);
                throw new Error('InputHandler initialization failed: ' + inputError.message);
            }

            // Initialize visual feedback system with error handling
            try {
                this.visualFeedbackSystem = new VisualFeedbackSystem(canvas);
            } catch (visualError) {
                console.error('Failed to initialize VisualFeedbackSystem:', visualError);
                throw new Error('VisualFeedbackSystem initialization failed: ' + visualError.message);
            }

            // Initialize audio manager with error handling
            try {
                this.audioManager = new AudioManager();
            } catch (audioError) {
                console.error('Failed to initialize AudioManager:', audioError);
                console.warn('Continuing without audio support');
                this.audioManager = null;
            }

            // Initialize screen effects manager with error handling
            try {
                this.screenEffectsManager = new ScreenEffectsManager();
            } catch (screenError) {
                console.error('Failed to initialize ScreenEffectsManager:', screenError);
                console.warn('Continuing without screen effects support');
                this.screenEffectsManager = null;
            }

            // Set up event listeners and connections between systems
            this.setupSystemConnections();
            
            // Perform post-initialization validation
            this.validateInitialization();
            
            this.isInitialized = true;
            console.log('GameManager initialized successfully');
            
        } catch (error) {
            console.error('GameManager initialization failed:', error);
            this.cleanup(); // Clean up any partially initialized systems
            throw error;
        }
    }

    /**
     * Validates that all systems are properly initialized
     * @private
     */
    validateInitialization() {
        const requiredSystems = [
            { name: 'phaseManager', system: this.phaseManager },
            { name: 'dataStreamGenerator', system: this.dataStreamGenerator },
            { name: 'corruptionSystem', system: this.corruptionSystem },
            { name: 'uiManager', system: this.uiManager },
            { name: 'inputHandler', system: this.inputHandler },
            { name: 'visualFeedbackSystem', system: this.visualFeedbackSystem }
        ];

        // Optional systems (audio and screen effects)
        const optionalSystems = [
            { name: 'audioManager', system: this.audioManager },
            { name: 'screenEffectsManager', system: this.screenEffectsManager }
        ];

        for (const { name, system } of requiredSystems) {
            if (!system) {
                throw new Error(`System validation failed: ${name} is not initialized`);
            }
        }

        // Validate optional systems (warn but don't fail)
        for (const { name, system } of optionalSystems) {
            if (!system) {
                console.warn(`Optional system not available: ${name}`);
            }
        }

        // Test basic functionality
        try {
            // Test phase manager
            if (typeof this.phaseManager.getCurrentPhase !== 'function') {
                throw new Error('PhaseManager missing required methods');
            }

            // Test data stream generator
            if (typeof this.dataStreamGenerator.getActiveObjectCount !== 'function') {
                throw new Error('DataStreamGenerator missing required methods');
            }

            // Test corruption system
            if (typeof this.corruptionSystem.getCurrentCorruption !== 'function') {
                throw new Error('CorruptionSystem missing required methods');
            }

            // Test UI manager
            if (typeof this.uiManager.updateCorruptionMeter !== 'function') {
                throw new Error('UIManager missing required methods');
            }

        } catch (validationError) {
            throw new Error('System validation failed: ' + validationError.message);
        }

        console.log('All systems validated successfully');
    }

    /**
     * Clean up partially initialized systems
     * @private
     */
    cleanup() {
        try {
            if (this.inputHandler && typeof this.inputHandler.destroy === 'function') {
                this.inputHandler.destroy();
            }
            if (this.visualFeedbackSystem && typeof this.visualFeedbackSystem.destroy === 'function') {
                this.visualFeedbackSystem.destroy();
            }
            if (this.audioManager && typeof this.audioManager.destroy === 'function') {
                this.audioManager.destroy();
            }
            if (this.screenEffectsManager && typeof this.screenEffectsManager.destroy === 'function') {
                this.screenEffectsManager.destroy();
            }
            
            this.phaseManager = null;
            this.dataStreamGenerator = null;
            this.corruptionSystem = null;
            this.uiManager = null;
            this.inputHandler = null;
            this.visualFeedbackSystem = null;
            this.audioManager = null;
            this.screenEffectsManager = null;
            
        } catch (cleanupError) {
            console.error('Error during cleanup:', cleanupError);
        }
    }

    /**
     * Set up connections and event listeners between subsystems
     */
    setupSystemConnections() {
        try {
            console.log('Setting up system connections...');

            // Connect corruption system to game end events with error handling
            if (this.corruptionSystem && typeof this.corruptionSystem === 'object') {
                this.corruptionSystem.onGameOver = (endType) => {
                    try {
                        console.log(`Game over triggered by corruption system: ${endType}`);
                        
                        // Play game over audio
                        if (this.audioManager) {
                            this.audioManager.playGameOver();
                        }
                        
                        // Show screen effects based on end type
                        if (this.screenEffectsManager) {
                            if (endType === GameEndType.CORRUPTION) {
                                this.screenEffectsManager.showSystemFailureEffect();
                                this.screenEffectsManager.showDataFloodEffect();
                            }
                        }
                        
                        this.endGame(endType);
                    } catch (error) {
                        console.error('Error in corruption system game over handler:', error);
                        // Fallback: force end game
                        this.gameState = 'gameOver';
                        this.stopGameLoop();
                    }
                };
                
                // Connect corruption level changes to audio/visual feedback and UI updates
                this.corruptionSystem.onCorruptionChange = (currentCorruption, maxCorruption) => {
                    try {
                        const corruptionPercentage = (currentCorruption / maxCorruption) * 100;
                        
                        // Update UI immediately when corruption changes
                        if (this.uiManager && typeof this.uiManager.updateCorruptionMeter === 'function') {
                            this.uiManager.updateCorruptionMeter(currentCorruption);
                        }
                        
                        // Play corruption sound for significant increases
                        if (this.audioManager && corruptionPercentage > 70) {
                            this.audioManager.playCorruption();
                        }
                        
                        // Show screen flash for high corruption
                        if (this.screenEffectsManager && corruptionPercentage > 80) {
                            this.screenEffectsManager.showScreenFlash('corruption', 0.2);
                        }
                        
                        console.log(`Corruption updated: ${currentCorruption}/${maxCorruption} (${corruptionPercentage.toFixed(1)}%)`);
                        
                    } catch (error) {
                        console.error('Error in corruption change handler:', error);
                    }
                };
                
                console.log('Corruption system connection established');
            }

            // Connect phase manager to UI updates with error handling
            if (this.phaseManager && typeof this.phaseManager === 'object') {
                this.phaseManager.onPhaseChange = (newPhase, phaseNumber, difficultyMultiplier) => {
                    try {
                        console.log(`Phase change event: ${newPhase} (${phaseNumber}), difficulty: ${difficultyMultiplier?.toFixed(2) || 'N/A'}`);
                        
                        // Play phase change audio
                        if (this.audioManager) {
                            this.audioManager.playPhaseChange();
                        }
                        
                        // Show phase change screen flash
                        if (this.screenEffectsManager) {
                            this.screenEffectsManager.showScreenFlash('phase', 0.3, 800);
                        }
                        
                        // Update UI if available
                        if (this.uiManager && typeof this.uiManager.updatePhase === 'function') {
                            this.uiManager.updatePhase(newPhase);
                        }
                        
                        // Update phase timer
                        if (this.uiManager && typeof this.uiManager.updatePhaseTimer === 'function') {
                            const timeRemaining = Math.ceil(this.phaseManager.getPhaseTimeRemaining() / 1000);
                            this.uiManager.updatePhaseTimer(timeRemaining);
                        }
                        
                        // Update data stream generator if available
                        if (this.dataStreamGenerator && typeof this.dataStreamGenerator.onPhaseChange === 'function') {
                            this.dataStreamGenerator.onPhaseChange(newPhase, phaseNumber, difficultyMultiplier);
                        }
                        
                    } catch (error) {
                        console.error('Error in phase change handler:', error);
                        // Continue game despite UI update failure
                    }
                };
                console.log('Phase manager connection established');
            }

            // Connect data stream generator to corruption system for scoring
            if (this.dataStreamGenerator && typeof this.dataStreamGenerator === 'object') {
                this.dataStreamGenerator.onObjectProcessed = (wasBlocked, wasCorrupted) => {
                    try {
                        if (this.corruptionSystem && typeof this.corruptionSystem.processDecision === 'function') {
                            this.corruptionSystem.processDecision(wasBlocked, wasCorrupted);
                        }
                    } catch (error) {
                        console.error('Error processing object decision:', error);
                        // Continue game despite scoring error
                    }
                };
                console.log('Data stream generator connection established');
            }

            // Connect input handler callbacks with visual feedback
            if (this.inputHandler && typeof this.inputHandler === 'object') {
                this.inputHandler.setValidClickCallback((clickedObject, x, y) => {
                    try {
                        const wasCorrect = clickedObject.isCorrupted; // Correct to block corrupted objects
                        console.log(`Valid click on ${clickedObject.isCorrupted ? 'corrupted' : 'legitimate'} object at (${x.toFixed(1)}, ${y.toFixed(1)})`);
                        
                        // Play audio feedback
                        if (this.audioManager) {
                            if (wasCorrect) {
                                this.audioManager.playClickSuccess();
                            } else {
                                this.audioManager.playClickFail();
                            }
                        }
                        
                        // Show visual feedback
                        if (this.visualFeedbackSystem) {
                            if (wasCorrect) {
                                this.visualFeedbackSystem.showSuccessFeedback(x, y);
                            } else {
                                this.visualFeedbackSystem.showFailureFeedback(x, y);
                            }
                        }
                        
                        // Show screen flash for feedback
                        if (this.screenEffectsManager) {
                            if (wasCorrect) {
                                this.screenEffectsManager.showScreenFlash('success', 0.2, 200);
                            } else {
                                this.screenEffectsManager.showScreenFlash('failure', 0.3, 300);
                            }
                        }
                        
                        // Show UI feedback
                        if (this.uiManager) {
                            if (wasCorrect) {
                                this.uiManager.showSuccessFeedback();
                            } else {
                                this.uiManager.showFailureFeedback();
                            }
                        }
                        
                    } catch (error) {
                        console.error('Error in valid click handler:', error);
                    }
                });

                this.inputHandler.setInvalidClickCallback((x, y, reason) => {
                    try {
                        console.log(`Invalid click at (${x.toFixed(1)}, ${y.toFixed(1)}): ${reason}`);
                        
                        // Play miss audio
                        if (this.audioManager) {
                            this.audioManager.playClickMiss();
                        }
                        
                        if (this.visualFeedbackSystem && typeof this.visualFeedbackSystem.showClickFeedback === 'function') {
                            this.visualFeedbackSystem.showClickFeedback(x, y, reason, null);
                        }
                        
                        if (this.uiManager && typeof this.uiManager.showFeedbackMessage === 'function') {
                            this.uiManager.showFeedbackMessage('INVALID TARGET', 'warning', 1500);
                        }
                        
                    } catch (error) {
                        console.error('Error in invalid click handler:', error);
                    }
                });

                this.inputHandler.setClickFeedbackCallback((x, y, type, object) => {
                    try {
                        if (this.visualFeedbackSystem && typeof this.visualFeedbackSystem.showClickFeedback === 'function') {
                            this.visualFeedbackSystem.showClickFeedback(x, y, type, object);
                        }
                    } catch (error) {
                        console.error('Error in click feedback handler:', error);
                    }
                });
                
                console.log('Input handler connections established');
            }

            console.log('All system connections established successfully');
            
        } catch (error) {
            console.error('Failed to set up system connections:', error);
            throw new Error('System connection setup failed: ' + error.message);
        }
    }

    /**
     * Start a new game
     */
    async startGame() {
        try {
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
            
            // Initialize subsystems for new game with error handling
            try {
                if (this.phaseManager && typeof this.phaseManager.startGame === 'function') {
                    this.phaseManager.startGame();
                } else {
                    throw new Error('PhaseManager not available or missing startGame method');
                }
            } catch (phaseError) {
                console.error('Failed to start phase manager:', phaseError);
                throw new Error('Phase manager initialization failed: ' + phaseError.message);
            }

            try {
                if (this.corruptionSystem && typeof this.corruptionSystem.reset === 'function') {
                    this.corruptionSystem.reset();
                } else {
                    throw new Error('CorruptionSystem not available or missing reset method');
                }
            } catch (corruptionError) {
                console.error('Failed to reset corruption system:', corruptionError);
                throw new Error('Corruption system reset failed: ' + corruptionError.message);
            }

            try {
                if (this.dataStreamGenerator && typeof this.dataStreamGenerator.startSpawning === 'function') {
                    this.dataStreamGenerator.startSpawning();
                } else {
                    throw new Error('DataStreamGenerator not available or missing startSpawning method');
                }
            } catch (streamError) {
                console.error('Failed to start data stream generator:', streamError);
                throw new Error('Data stream generator start failed: ' + streamError.message);
            }
            
            // Enable input handling
            try {
                if (this.inputHandler && typeof this.inputHandler.enable === 'function') {
                    this.inputHandler.enable();
                } else {
                    console.warn('InputHandler not available or missing enable method');
                }
            } catch (inputError) {
                console.error('Failed to enable input handler:', inputError);
                // Not critical, continue without input
            }
            
            // Update UI
            try {
                if (this.uiManager) {
                    if (typeof this.uiManager.showGameplayUI === 'function') {
                        this.uiManager.showGameplayUI();
                    }
                    if (typeof this.uiManager.updateCorruptionMeter === 'function') {
                        this.uiManager.updateCorruptionMeter(0);
                    }
                } else {
                    console.warn('UIManager not available');
                }
            } catch (uiError) {
                console.error('Failed to update UI:', uiError);
                // Not critical, continue
            }
            
            // Initialize audio context and start BGM (requires user interaction)
            try {
                if (this.audioManager && typeof this.audioManager.resumeAudioContext === 'function') {
                    await this.audioManager.resumeAudioContext();
                    // Start background music
                    await this.audioManager.startBGM();
                }
            } catch (audioError) {
                console.warn('Failed to initialize audio context or start BGM:', audioError);
            }
            
            // Set game state and timing
            this.gameState = 'playing';
            this.gameStartTime = Date.now();
            this.totalPausedDuration = 0;
            this.lastFrameTime = 0; // Reset frame timing
            
            // Start game loop
            try {
                this.startGameLoop();
            } catch (loopError) {
                console.error('Failed to start game loop:', loopError);
                throw new Error('Game loop start failed: ' + loopError.message);
            }
            
            console.log('Game started successfully');
            
        } catch (error) {
            console.error('Failed to start game:', error);
            
            // Clean up any partially started systems
            try {
                this.stopGameLoop();
                if (this.inputHandler && typeof this.inputHandler.disable === 'function') {
                    this.inputHandler.disable();
                }
                this.gameState = 'error';
            } catch (cleanupError) {
                console.error('Error during start game cleanup:', cleanupError);
            }
            
            throw error;
        }
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
        try {
            if (this.phaseManager && typeof this.phaseManager.stop === 'function') {
                this.phaseManager.stop();
            }
            if (this.dataStreamGenerator && typeof this.dataStreamGenerator.stopSpawning === 'function') {
                this.dataStreamGenerator.stopSpawning();
            }
            if (this.inputHandler && typeof this.inputHandler.disable === 'function') {
                this.inputHandler.disable();
            }
            // Stop BGM when game ends
            if (this.audioManager && typeof this.audioManager.stopBGM === 'function') {
                this.audioManager.stopBGM();
            }
        } catch (error) {
            console.error('Error stopping subsystems:', error);
        }
        
        // Stop game loop
        this.stopGameLoop();
        
        // Play appropriate audio and show effects based on end type
        try {
            if (endType === GameEndType.SUCCESS) {
                // Success ending
                if (this.audioManager) {
                    this.audioManager.playGameSuccess();
                }
                if (this.screenEffectsManager) {
                    this.screenEffectsManager.showScreenFlash('success', 0.4, 1000);
                    // Add subtle glitch effect to show AI takeover
                    setTimeout(() => {
                        this.screenEffectsManager.showGlitchEffect(null, 2000, 3);
                    }, 1500);
                }
            } else if (endType === GameEndType.CORRUPTION) {
                // Corruption ending - already handled in corruption system callback
                // Additional effects here if needed
                if (this.screenEffectsManager) {
                    setTimeout(() => {
                        this.screenEffectsManager.showCorruptionSpreadEffect(
                            document.getElementById('corruption-meter'), 2000
                        );
                    }, 500);
                }
            } else {
                // Default game over
                if (this.audioManager) {
                    this.audioManager.playGameOver();
                }
                if (this.screenEffectsManager) {
                    this.screenEffectsManager.showScreenFlash('failure', 0.3, 800);
                }
            }
        } catch (effectError) {
            console.error('Error playing end game effects:', effectError);
        }
        
        // Calculate final stats
        const gameStats = this.calculateGameStats();
        
        // Show game over UI
        try {
            if (this.uiManager && typeof this.uiManager.showGameOverScreen === 'function') {
                this.uiManager.showGameOverScreen(endType, gameStats);
            }
        } catch (uiError) {
            console.error('Error showing game over screen:', uiError);
        }
        
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
        
        // Restart BGM for menu if it was stopped
        if (this.audioManager && typeof this.audioManager.startBGM === 'function') {
            this.audioManager.startBGM().catch(error => {
                console.warn('Failed to restart BGM in menu:', error);
            });
        }
        
        console.log('Reset to menu complete');
    }

    /**
     * Main game loop
     */
    gameLoop() {
        try {
            if (this.gameState !== 'playing') {
                return;
            }

            const currentTime = Date.now();
            const elapsedTime = currentTime - this.gameStartTime - this.totalPausedDuration;
            
            // Calculate delta time for frame-based updates
            const deltaTime = this.lastFrameTime ? currentTime - this.lastFrameTime : 16; // Default to ~60fps
            this.lastFrameTime = currentTime;
            
            // Check for maximum game duration
            if (elapsedTime >= GAME_CONSTANTS.MAX_GAME_DURATION) {
                this.endGame(GameEndType.SUCCESS);
                return;
            }

            // Update all subsystems with error handling
            try {
                if (this.phaseManager && typeof this.phaseManager.update === 'function') {
                    this.phaseManager.update(elapsedTime);
                }
            } catch (phaseError) {
                console.error('Error updating phase manager:', phaseError);
            }

            try {
                if (this.dataStreamGenerator && typeof this.dataStreamGenerator.update === 'function') {
                    this.dataStreamGenerator.update(deltaTime);
                }
            } catch (streamError) {
                console.error('Error updating data stream generator:', streamError);
            }

            try {
                if (this.corruptionSystem && typeof this.corruptionSystem.update === 'function') {
                    this.corruptionSystem.update();
                }
            } catch (corruptionError) {
                console.error('Error updating corruption system:', corruptionError);
            }

            try {
                if (this.visualFeedbackSystem && typeof this.visualFeedbackSystem.update === 'function') {
                    this.visualFeedbackSystem.update(currentTime);
                }
            } catch (visualError) {
                console.error('Error updating visual feedback system:', visualError);
            }
            
            // Render game objects and effects
            try {
                this.renderGame();
            } catch (renderError) {
                console.error('Error rendering game:', renderError);
            }
            
            // Update UI with current corruption level and timers
            try {
                if (this.uiManager) {
                    if (this.corruptionSystem && typeof this.corruptionSystem.getCurrentCorruption === 'function') {
                        this.uiManager.updateCorruptionMeter(this.corruptionSystem.getCurrentCorruption());
                    }
                    if (typeof this.uiManager.updateTimer === 'function') {
                        this.uiManager.updateTimer(elapsedTime);
                    }
                    // Update phase timer
                    if (this.phaseManager && typeof this.uiManager.updatePhaseTimer === 'function') {
                        const timeRemaining = Math.ceil(this.phaseManager.getPhaseTimeRemaining() / 1000);
                        this.uiManager.updatePhaseTimer(timeRemaining);
                    }
                }
            } catch (uiError) {
                console.error('Error updating UI:', uiError);
            }
            
            // Continue game loop
            this.animationFrameId = requestAnimationFrame(this.gameLoop);
            
        } catch (error) {
            console.error('Critical error in game loop:', error);
            
            // Try to gracefully handle the error
            try {
                this.pauseGame();
                if (this.uiManager && typeof this.uiManager.showFeedbackMessage === 'function') {
                    this.uiManager.showFeedbackMessage('SYSTEM ERROR - GAME PAUSED', 'error', 5000);
                }
            } catch (recoveryError) {
                console.error('Failed to recover from game loop error:', recoveryError);
                // Force stop the game loop to prevent infinite errors
                this.stopGameLoop();
                this.gameState = 'error';
            }
        }
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

        // Save the initial context state
        ctx.save();

        // Clear canvas completely
        ctx.clearRect(0, 0, canvas.width, canvas.height);

        // Reset any lingering canvas state that might cause darkening
        ctx.globalAlpha = 1.0;
        ctx.globalCompositeOperation = 'source-over';

        // Render background image
        this.renderBackground(ctx, canvas);

        // Render data stream objects
        this.dataStreamGenerator.render(ctx);

        // Render visual feedback effects on top
        this.visualFeedbackSystem.render(ctx);

        // Restore the initial context state to prevent any lingering effects
        ctx.restore();
    }

    /**
     * Load the background image for the game canvas
     * @private
     */
    loadBackgroundImage() {
        this.backgroundImage = new Image();
        this.backgroundImage.onload = () => {
            console.log('Game background image loaded successfully');
        };
        this.backgroundImage.onerror = (error) => {
            console.warn('Failed to load game background image:', error);
            this.backgroundImage = null;
        };
        this.backgroundImage.src = 'assets/GameBackground.jpg';
    }

    /**
     * Render the background image on the canvas
     * @param {CanvasRenderingContext2D} ctx - Canvas rendering context
     * @param {HTMLCanvasElement} canvas - Canvas element
     * @private
     */
    renderBackground(ctx, canvas) {
        if (this.backgroundImage && this.backgroundImage.complete) {
            // Save current context state
            ctx.save();
            
            // Draw background image to fill the entire canvas
            ctx.drawImage(this.backgroundImage, 0, 0, canvas.width, canvas.height);
            
            // Add a subtle overlay to maintain the cyberpunk aesthetic
            ctx.fillStyle = 'rgba(0, 0, 0, 0.3)';
            ctx.fillRect(0, 0, canvas.width, canvas.height);
            
            // Restore context state
            ctx.restore();
        } else {
            // Fallback: render the original black background
            ctx.fillStyle = '#000000';
            ctx.fillRect(0, 0, canvas.width, canvas.height);
        }
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
        this.lastFrameTime = 0;
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