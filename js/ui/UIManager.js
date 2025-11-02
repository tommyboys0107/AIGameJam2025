// UI Manager - handles all user interface management
import { GamePhase } from '../core/constants.js';

export class UIManager {
    constructor() {
        this.hudElements = {
            statusMessage: document.getElementById('status-message'),
            currentPhase: document.getElementById('current-phase'),
            phaseTimer: document.getElementById('phase-timer'),
            corruptionFill: document.getElementById('corruption-fill'),
            corruptionPercentage: document.getElementById('corruption-percentage')
        };
        
        this.currentCorruption = 0;
        this.maxCorruption = 100;
        
        this.initializeHUD();
    }
    
    initializeHUD() {
        // Set initial HUD state
        this.updateSystemStatus('OPERATIONAL');
        this.updatePhase(GamePhase.CODE);
        this.updatePhaseTimer(15);
        this.updateCorruptionMeter(0);
    }
    
    updateSystemStatus(status, isFlickering = false) {
        if (this.hudElements.statusMessage) {
            this.hudElements.statusMessage.textContent = status;
            
            // Add flickering effect for warnings/errors
            if (isFlickering) {
                this.hudElements.statusMessage.classList.add('flicker-text');
            } else {
                this.hudElements.statusMessage.classList.remove('flicker-text');
            }
            
            // Color coding for different statuses
            switch (status) {
                case 'OPERATIONAL':
                    this.hudElements.statusMessage.style.color = '#00FF41';
                    break;
                case 'WARNING':
                case 'AI DETECTED':
                    this.hudElements.statusMessage.style.color = '#FFD700';
                    break;
                case 'CRITICAL':
                case 'SYSTEM BREACH':
                    this.hudElements.statusMessage.style.color = '#FF4500';
                    break;
            }
        }
    }
    
    updatePhase(phase) {
        if (this.hudElements.currentPhase) {
            let phaseText = '';
            switch (phase) {
                case GamePhase.CODE:
                    phaseText = 'CODE';
                    break;
                case GamePhase.ART:
                    phaseText = 'ART';
                    break;
                case GamePhase.TEXT:
                    phaseText = 'TEXT';
                    break;
            }
            this.hudElements.currentPhase.textContent = phaseText;
        }
    }
    
    updatePhaseTimer(seconds) {
        if (this.hudElements.phaseTimer) {
            this.hudElements.phaseTimer.textContent = `${seconds}s`;
            
            // Add warning color when time is low
            if (seconds <= 5) {
                this.hudElements.phaseTimer.style.color = '#FFD700';
                this.hudElements.phaseTimer.classList.add('flicker-text');
            } else {
                this.hudElements.phaseTimer.style.color = '#00BFFF';
                this.hudElements.phaseTimer.classList.remove('flicker-text');
            }
        }
    }
    
    updateCorruptionMeter(corruptionLevel) {
        this.currentCorruption = Math.max(0, Math.min(corruptionLevel, this.maxCorruption));
        const percentage = (this.currentCorruption / this.maxCorruption) * 100;
        
        if (this.hudElements.corruptionFill) {
            this.hudElements.corruptionFill.style.width = `${percentage}%`;
        }
        
        if (this.hudElements.corruptionPercentage) {
            this.hudElements.corruptionPercentage.textContent = `${Math.round(percentage)}%`;
            
            // Change color based on corruption level
            if (percentage >= 80) {
                this.hudElements.corruptionPercentage.style.color = '#FF4500';
                this.hudElements.corruptionPercentage.classList.add('flicker-text');
            } else if (percentage >= 50) {
                this.hudElements.corruptionPercentage.style.color = '#FFD700';
                this.hudElements.corruptionPercentage.classList.remove('flicker-text');
            } else {
                this.hudElements.corruptionPercentage.style.color = '#00FF41';
                this.hudElements.corruptionPercentage.classList.remove('flicker-text');
            }
        }
        
        // Update system status based on corruption level
        if (percentage >= 90) {
            this.updateSystemStatus('CRITICAL', true);
        } else if (percentage >= 70) {
            this.updateSystemStatus('WARNING', true);
        } else if (percentage >= 30) {
            this.updateSystemStatus('AI DETECTED', false);
        } else {
            this.updateSystemStatus('OPERATIONAL', false);
        }
    }
    
    showSystemMessage(message, duration = 3000, isError = false) {
        const originalStatus = this.hudElements.statusMessage.textContent;
        
        this.updateSystemStatus(message, isError);
        
        // Restore original status after duration
        setTimeout(() => {
            this.updateSystemStatus(originalStatus, false);
        }, duration);
    }
    
    triggerGlitchEffect() {
        // Add glitch effect to random HUD elements
        const elements = Object.values(this.hudElements);
        const randomElement = elements[Math.floor(Math.random() * elements.length)];
        
        if (randomElement) {
            randomElement.classList.add('glitch-text');
            setTimeout(() => {
                randomElement.classList.remove('glitch-text');
            }, 500);
        }
    }
    
    // Screen management methods
    showScreen(screenId) {
        // Hide all screens
        document.querySelectorAll('.screen').forEach(screen => {
            screen.classList.add('hidden');
        });
        
        // Show target screen
        const targetScreen = document.getElementById(screenId);
        if (targetScreen) {
            targetScreen.classList.remove('hidden');
        }
    }
    
    hideScreen(screenId) {
        const screen = document.getElementById(screenId);
        if (screen) {
            screen.classList.add('hidden');
        }
    }
    
    // Main Menu functionality
    initializeMainMenu() {
        const startButton = document.getElementById('start-button');
        if (startButton) {
            startButton.addEventListener('click', () => {
                this.startGame();
            });
        }
        
        // Add typewriter effect to activation text
        this.startActivationAnimation();
    }
    
    startActivationAnimation() {
        const activationText = document.getElementById('activation-text');
        if (!activationText) return;
        
        const messages = [
            'ACTIVATING...',
            'SCANNING NEURAL PATTERNS...',
            'ESTABLISHING CONNECTION...',
            'READY FOR HUMAN OPERATOR'
        ];
        
        let currentIndex = 0;
        
        const cycleMessages = () => {
            activationText.textContent = messages[currentIndex];
            currentIndex = (currentIndex + 1) % messages.length;
        };
        
        // Start the animation
        setInterval(cycleMessages, 2000);
    }
    
    startGame() {
        // Add screen transition effect
        const mainMenu = document.getElementById('main-menu');
        if (mainMenu) {
            mainMenu.style.transition = 'opacity 0.5s ease-out';
            mainMenu.style.opacity = '0';
            
            setTimeout(() => {
                this.showScreen('game-screen');
                // Reset menu opacity for future use
                mainMenu.style.opacity = '1';
                
                // Trigger game start event
                if (this.onGameStart) {
                    this.onGameStart();
                }
            }, 500);
        }
    }
    
    // Event handler setter for game start
    setGameStartHandler(handler) {
        this.onGameStart = handler;
    }
    
    // Game Over functionality
    initializeGameOver() {
        const restartButton = document.getElementById('restart-button');
        const menuButton = document.getElementById('menu-button');
        
        if (restartButton) {
            restartButton.addEventListener('click', () => {
                this.restartGame();
            });
        }
        
        if (menuButton) {
            menuButton.addEventListener('click', () => {
                this.returnToMenu();
            });
        }
    }
    
    showGameOver(gameEndType, stats = {}) {
        const gameOverScreen = document.getElementById('game-over');
        const title = document.getElementById('game-over-title');
        const subtitle = document.getElementById('game-over-subtitle');
        const primaryMessage = document.getElementById('primary-message');
        const secondaryMessage = document.getElementById('secondary-message');
        
        // Import GameEndType from constants
        import('../core/constants.js').then(({ GameEndType }) => {
            // Configure game over screen based on end type
            switch (gameEndType) {
                case GameEndType.SUCCESS:
                    gameOverScreen.className = 'screen success';
                    title.textContent = 'MISSION COMPLETE';
                    subtitle.textContent = 'HUMAN FIREWALL OPERATIONAL';
                    primaryMessage.textContent = 'AI has learned your judgment patterns';
                    secondaryMessage.textContent = 'The system no longer requires human verification. Your neural patterns have been successfully integrated into the AI defense matrix.';
                    break;
                    
                case GameEndType.CORRUPTION:
                    gameOverScreen.className = 'screen failure';
                    title.textContent = 'SYSTEM BREACH';
                    subtitle.textContent = 'REALITY CORRUPTED';
                    primaryMessage.textContent = 'Corruption threshold exceeded';
                    secondaryMessage.textContent = 'AI-generated content has overwhelmed the system. The boundary between authentic and artificial data has been compromised.';
                    this.triggerDataFloodEffect();
                    break;
                    
                case GameEndType.TIMEOUT:
                    gameOverScreen.className = 'screen success';
                    title.textContent = 'TIME EXPIRED';
                    subtitle.textContent = 'HUMAN FIREWALL REPLACED BY AI';
                    primaryMessage.textContent = 'Maximum operation time reached';
                    secondaryMessage.textContent = 'Your performance data has been analyzed. The AI system is now capable of autonomous content verification.';
                    break;
            }
            
            // Update stats
            this.updateGameOverStats(stats);
            
            // Show the game over screen
            this.showScreen('game-over');
            
            // Add screen flicker effect
            this.triggerScreenFlicker();
        });
    }
    
    updateGameOverStats(stats) {
        const finalCorruption = document.getElementById('final-corruption');
        const finalAccuracy = document.getElementById('final-accuracy');
        const survivalTime = document.getElementById('survival-time');
        
        if (finalCorruption && stats.corruption !== undefined) {
            finalCorruption.textContent = `${Math.round(stats.corruption)}%`;
        }
        
        if (finalAccuracy && stats.accuracy !== undefined) {
            finalAccuracy.textContent = `${Math.round(stats.accuracy)}%`;
        }
        
        if (survivalTime && stats.survivalTime !== undefined) {
            const minutes = Math.floor(stats.survivalTime / 60);
            const seconds = Math.round(stats.survivalTime % 60);
            survivalTime.textContent = minutes > 0 ? `${minutes}m ${seconds}s` : `${seconds}s`;
        }
    }
    
    triggerScreenFlicker() {
        const gameOverScreen = document.getElementById('game-over');
        if (gameOverScreen) {
            gameOverScreen.style.animation = 'screenFlicker 0.1s infinite';
            
            // Stop flickering after 3 seconds
            setTimeout(() => {
                gameOverScreen.style.animation = 'fadeIn 1s ease-out';
            }, 3000);
        }
    }
    
    triggerDataFloodEffect() {
        const dataFlood = document.getElementById('data-flood');
        if (dataFlood) {
            dataFlood.style.opacity = '0.5';
            dataFlood.style.animation = 'dataFlood 0.5s linear infinite';
        }
    }
    
    restartGame() {
        // Add transition effect
        const gameOverScreen = document.getElementById('game-over');
        if (gameOverScreen) {
            gameOverScreen.style.transition = 'opacity 0.5s ease-out';
            gameOverScreen.style.opacity = '0';
            
            setTimeout(() => {
                this.showScreen('game-screen');
                // Reset game over screen opacity
                gameOverScreen.style.opacity = '1';
                
                // Trigger game restart event
                if (this.onGameRestart) {
                    this.onGameRestart();
                }
            }, 500);
        }
    }
    
    returnToMenu() {
        // Add transition effect
        const gameOverScreen = document.getElementById('game-over');
        if (gameOverScreen) {
            gameOverScreen.style.transition = 'opacity 0.5s ease-out';
            gameOverScreen.style.opacity = '0';
            
            setTimeout(() => {
                this.showScreen('main-menu');
                // Reset game over screen opacity
                gameOverScreen.style.opacity = '1';
                
                // Trigger return to menu event
                if (this.onReturnToMenu) {
                    this.onReturnToMenu();
                }
            }, 500);
        }
    }
    
    // Event handler setters
    setGameRestartHandler(handler) {
        this.onGameRestart = handler;
    }
    
    setReturnToMenuHandler(handler) {
        this.onReturnToMenu = handler;
    }
}