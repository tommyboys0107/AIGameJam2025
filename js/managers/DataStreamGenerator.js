// DataStreamGenerator - Creates and manages flowing information objects
// Handles spawning system with configurable intervals and difficulty scaling

import { GAME_CONSTANTS } from '../core/constants.js';
import { SpawnSettings } from '../core/dataClasses.js';
import { InformationObjectPool } from '../core/InformationObjectPool.js';

export class DataStreamGenerator {
    /**
     * Creates a new DataStreamGenerator
     * @param {ContentProvider} contentProvider - Content provider for object data
     * @param {PhaseManager} phaseManager - Phase manager for current phase info
     * @param {SpawnSettings} spawnSettings - Spawn configuration settings
     */
    constructor(contentProvider, phaseManager, spawnSettings = null) {
        this.contentProvider = contentProvider;
        this.phaseManager = phaseManager;
        this.settings = spawnSettings || new SpawnSettings();
        
        // Object pool for efficient memory management
        this.objectPool = new InformationObjectPool(this.settings.maxConcurrentObjects);
        
        // Spawn timing management
        this.lastSpawnTime = 0;
        this.nextSpawnInterval = this.getRandomSpawnInterval();
        
        // Difficulty scaling
        this.difficultyMultiplier = 1.0;
        this.currentMovementSpeed = this.settings.movementSpeed;
        
        // Screen dimensions for spawn positioning
        this.screenWidth = 1200;  // Updated default for larger canvas
        this.screenHeight = 900; // Updated default for larger canvas
        
        // Spawn position management
        this.spawnPositions = this.calculateSpawnPositions();
        
        // State management
        this.isActive = false;
        this.isPaused = false;
        
        // Content assignment configuration
        this.baseCorruptionProbability = 0.3; // 30% base chance
        this.maxCorruptionProbability = 0.7;  // 70% max chance at high difficulty
        
        // Statistics
        this.totalObjectsSpawned = 0;
        this.objectsSpawnedThisPhase = 0;
        
        // Event callbacks
        this.onObjectProcessed = null; // Callback for when objects are processed: (wasBlocked, wasCorrupted) => void
        
        console.log('DataStreamGenerator initialized with settings:', this.settings);
    }

    /**
     * Sets the screen dimensions for spawn positioning
     * @param {number} width - Screen width
     * @param {number} height - Screen height
     */
    setScreenDimensions(width, height) {
        this.screenWidth = width;
        this.screenHeight = height;
        this.spawnPositions = this.calculateSpawnPositions();
        
        console.log(`DataStreamGenerator screen dimensions set to ${width}x${height}`);
    }

    /**
     * Calculates spawn positions around screen edges
     * @returns {Array} Array of spawn position objects
     * @private
     */
    calculateSpawnPositions() {
        const positions = [];
        const objectWidth = 280; // Much larger object width for full-screen
        const objectHeight = 140; // Much larger object height for full-screen
        const margin = 20; // Margin from screen edge
        
        // Top edge positions
        for (let x = margin; x < this.screenWidth - objectWidth - margin; x += objectWidth + 10) {
            positions.push({
                x: x,
                y: -objectHeight - margin,
                edge: 'top'
            });
        }
        
        // Left edge positions
        for (let y = margin; y < this.screenHeight - objectHeight - margin; y += objectHeight + 10) {
            positions.push({
                x: -objectWidth - margin,
                y: y,
                edge: 'left'
            });
        }
        
        // Right edge positions
        for (let y = margin; y < this.screenHeight - objectHeight - margin; y += objectHeight + 10) {
            positions.push({
                x: this.screenWidth + margin,
                y: y,
                edge: 'right'
            });
        }
        
        return positions;
    }

    /**
     * Starts the data stream generation
     */
    start() {
        console.log('DataStreamGenerator started');
        this.isActive = true;
        this.isPaused = false;
        this.lastSpawnTime = Date.now();
        this.nextSpawnInterval = this.getRandomSpawnInterval();
        this.objectsSpawnedThisPhase = 0;
    }

    /**
     * Alias for start() to match GameManager interface
     */
    startSpawning() {
        this.start();
    }

    /**
     * Stops the data stream generation
     */
    stop() {
        console.log('DataStreamGenerator stopped');
        this.isActive = false;
        this.isPaused = false;
        
        // Clear all active objects
        this.objectPool.clearAllObjects();
    }

    /**
     * Alias for stop() to match GameManager interface
     */
    stopSpawning() {
        this.stop();
    }

    /**
     * Pauses the data stream generation
     */
    pause() {
        console.log('DataStreamGenerator paused');
        this.isPaused = true;
    }

    /**
     * Resumes the data stream generation
     */
    resume() {
        console.log('DataStreamGenerator resumed');
        this.isPaused = false;
        this.lastSpawnTime = Date.now(); // Reset spawn timing
    }

    /**
     * Updates the data stream generation (called from game loop)
     * @param {number} deltaTime - Time elapsed since last update in milliseconds
     */
    update(deltaTime) {
        if (!this.isActive || this.isPaused) {
            return;
        }

        // Check for objects that reached the bottom before updating
        this.checkObjectsReachedBottom();

        // Update object pool
        this.objectPool.updateActiveObjects(deltaTime, this.screenHeight);

        // Check if it's time to spawn a new object
        const currentTime = Date.now();
        if (currentTime - this.lastSpawnTime >= this.nextSpawnInterval) {
            this.spawnObject();
            this.lastSpawnTime = currentTime;
            this.nextSpawnInterval = this.getRandomSpawnInterval();
        }
    }

    /**
     * Checks for objects that have reached the bottom and processes them
     * @private
     */
    checkObjectsReachedBottom() {
        const activeObjects = this.objectPool.getActiveObjects();
        const objectsToProcess = [];
        
        // First, identify objects that reached the bottom
        for (const obj of activeObjects) {
            if (obj.hasReachedBottom(this.screenHeight) && !obj.hasBeenProcessed) {
                objectsToProcess.push(obj);
                obj.hasBeenProcessed = true; // Mark to prevent double processing
            }
        }
        
        // Then process them
        for (const obj of objectsToProcess) {
            if (this.onObjectProcessed) {
                // Object reached bottom - it was allowed through (not blocked)
                const wasBlocked = false;
                this.onObjectProcessed(wasBlocked, obj.isCorrupted);
                console.log(`Object processed (reached bottom): corrupted=${obj.isCorrupted}, blocked=${wasBlocked}`);
            }
        }
    }

    /**
     * Renders all active objects
     * @param {CanvasRenderingContext2D} ctx - Canvas rendering context
     */
    render(ctx) {
        if (!this.isActive) {
            return;
        }

        this.objectPool.renderActiveObjects(ctx);
    }

    /**
     * Spawns a new information object
     * @private
     */
    spawnObject() {
        // Check if we've reached the maximum concurrent objects
        if (this.objectPool.getActiveObjectCount() >= this.settings.maxConcurrentObjects) {
            console.log('Maximum concurrent objects reached, skipping spawn');
            return;
        }

        // Get content from content provider (will be implemented in subtask 5.2)
        const contentData = this.getContentForSpawn();
        if (!contentData) {
            console.warn('Failed to get content for spawn');
            return;
        }

        // Select random spawn position
        const spawnPos = this.getRandomSpawnPosition();
        if (!spawnPos) {
            console.warn('No valid spawn position available');
            return;
        }

        // Create object from pool
        const obj = this.objectPool.getObject(
            contentData,
            spawnPos.x,
            spawnPos.y,
            this.currentMovementSpeed
        );

        if (obj) {
            this.totalObjectsSpawned++;
            this.objectsSpawnedThisPhase++;
            
            console.log(`Spawned object ${this.totalObjectsSpawned} at (${spawnPos.x}, ${spawnPos.y}) from ${spawnPos.edge} edge`);
        } else {
            console.warn('Failed to get object from pool');
        }
    }

    /**
     * Gets content data for spawning based on current phase and difficulty
     * @returns {InformationObjectData|null} Content data or null if unavailable
     * @private
     */
    getContentForSpawn() {
        // Check if content provider is available and loaded
        if (!this.contentProvider || !this.contentProvider.isContentLoaded()) {
            console.warn('ContentProvider not available or not loaded');
            return this.getFallbackContent();
        }

        // Check if phase manager is available
        if (!this.phaseManager) {
            console.warn('PhaseManager not available');
            return this.getFallbackContent();
        }

        // Get current phase
        const currentPhase = this.phaseManager.getCurrentPhase();
        
        // Determine if this object should be corrupted based on difficulty
        const isCorrupted = this.shouldSpawnCorruptedContent();
        
        // Get content from provider based on phase and corruption status
        try {
            const contentData = this.contentProvider.getRandomContent(currentPhase, isCorrupted);
            
            if (!contentData) {
                console.warn('ContentProvider returned null content');
                return this.getFallbackContent();
            }
            
            return contentData;
        } catch (error) {
            console.error('Error getting content from provider:', error);
            return this.getFallbackContent();
        }
    }

    /**
     * Determines if the next spawned object should be corrupted based on difficulty
     * @returns {boolean} True if object should be corrupted
     * @private
     */
    shouldSpawnCorruptedContent() {
        // Calculate corruption probability based on difficulty multiplier
        const difficultyFactor = Math.min(this.difficultyMultiplier - 1, 2.0) / 2.0; // Normalize to 0-1 range
        const corruptionProbability = this.baseCorruptionProbability + 
            (this.maxCorruptionProbability - this.baseCorruptionProbability) * difficultyFactor;
        
        return Math.random() < corruptionProbability;
    }

    /**
     * Gets fallback content when content provider is unavailable
     * @returns {InformationObjectData} Fallback content data
     * @private
     */
    getFallbackContent() {
        const isCorrupted = Math.random() < this.baseCorruptionProbability;
        
        return {
            contentType: 'text',
            contentText: isCorrupted ? 'F@llb@ck c0nt3nt' : 'Fallback content',
            contentImage: null,
            isCorrupted: isCorrupted,
            corruptionSeverity: isCorrupted ? Math.random() * 0.5 + 0.5 : 0,
            displayColor: isCorrupted ? '#FF4444' : '#00FF41'
        };
    }

    /**
     * Gets a random spawn position from available positions
     * @returns {Object|null} Spawn position object or null if none available
     * @private
     */
    getRandomSpawnPosition() {
        if (this.spawnPositions.length === 0) {
            return null;
        }

        return this.spawnPositions[Math.floor(Math.random() * this.spawnPositions.length)];
    }

    /**
     * Calculates random spawn interval based on difficulty
     * @returns {number} Spawn interval in milliseconds
     * @private
     */
    getRandomSpawnInterval() {
        const baseMin = this.settings.baseSpawnIntervalMin;
        const baseMax = this.settings.baseSpawnIntervalMax;
        
        // Apply difficulty scaling (higher difficulty = faster spawning)
        const scaledMin = baseMin / this.difficultyMultiplier;
        const scaledMax = baseMax / this.difficultyMultiplier;
        
        // Ensure minimum interval doesn't go below reasonable limits
        const minInterval = Math.max(scaledMin, 100); // Minimum 100ms (faster spawning)
        const maxInterval = Math.max(scaledMax, minInterval + 50);
        
        return Math.random() * (maxInterval - minInterval) + minInterval;
    }

    /**
     * Updates difficulty scaling
     * @param {number} multiplier - New difficulty multiplier
     */
    updateDifficulty(multiplier) {
        console.log(`DataStreamGenerator difficulty updated: ${this.difficultyMultiplier.toFixed(2)} -> ${multiplier.toFixed(2)}`);
        
        this.difficultyMultiplier = multiplier;
        
        // Update movement speed based on difficulty
        this.currentMovementSpeed = this.settings.movementSpeed * multiplier;
        
        // Reset spawn timing to apply new difficulty immediately
        this.nextSpawnInterval = this.getRandomSpawnInterval();
        
        // Reset phase spawn counter
        this.objectsSpawnedThisPhase = 0;
    }

    /**
     * Called when phase changes to reset phase-specific counters
     * @param {string} newPhase - The new phase
     * @param {number} phaseNumber - The phase number
     * @param {number} difficultyMultiplier - Updated difficulty multiplier
     */
    onPhaseChange(newPhase, phaseNumber, difficultyMultiplier) {
        console.log(`DataStreamGenerator phase changed to: ${newPhase} (${phaseNumber})`);
        
        // Update difficulty
        this.updateDifficulty(difficultyMultiplier);
        
        // Log phase-specific statistics
        console.log(`Objects spawned in previous phase: ${this.objectsSpawnedThisPhase}`);
    }

    /**
     * Sets the corruption probability range
     * @param {number} baseProbability - Base corruption probability (0.0 to 1.0)
     * @param {number} maxProbability - Maximum corruption probability (0.0 to 1.0)
     */
    setCorruptionProbability(baseProbability, maxProbability) {
        this.baseCorruptionProbability = Math.max(0, Math.min(1, baseProbability));
        this.maxCorruptionProbability = Math.max(this.baseCorruptionProbability, Math.min(1, maxProbability));
        
        console.log(`Corruption probability range set: ${this.baseCorruptionProbability.toFixed(2)} - ${this.maxCorruptionProbability.toFixed(2)}`);
    }

    /**
     * Gets the current corruption probability based on difficulty
     * @returns {number} Current corruption probability (0.0 to 1.0)
     */
    getCurrentCorruptionProbability() {
        const difficultyFactor = Math.min(this.difficultyMultiplier - 1, 2.0) / 2.0;
        return this.baseCorruptionProbability + 
            (this.maxCorruptionProbability - this.baseCorruptionProbability) * difficultyFactor;
    }

    /**
     * Handles mouse click events
     * @param {number} mouseX - Mouse X coordinate
     * @param {number} mouseY - Mouse Y coordinate
     * @returns {InformationObject|null} The clicked object or null
     */
    handleClick(mouseX, mouseY) {
        const clickedObject = this.objectPool.handleClick(mouseX, mouseY);
        
        if (clickedObject && this.onObjectProcessed && !clickedObject.hasBeenProcessed) {
            // Object was blocked by player click
            const wasBlocked = true;
            clickedObject.hasBeenProcessed = true; // Mark to prevent double processing
            this.onObjectProcessed(wasBlocked, clickedObject.isCorrupted);
            console.log(`Object processed (clicked): corrupted=${clickedObject.isCorrupted}, blocked=${wasBlocked}`);
        }
        
        return clickedObject;
    }

    /**
     * Gets all currently active objects
     * @returns {InformationObject[]} Array of active objects
     */
    getActiveObjects() {
        return this.objectPool.getActiveObjects();
    }

    /**
     * Gets the number of active objects
     * @returns {number} Count of active objects
     */
    getActiveObjectCount() {
        return this.objectPool.getActiveObjectCount();
    }

    /**
     * Updates spawn settings
     * @param {SpawnSettings} newSettings - New spawn settings
     */
    updateSettings(newSettings) {
        this.settings = newSettings;
        
        // Resize object pool if max concurrent objects changed
        if (this.objectPool.poolSize !== newSettings.maxConcurrentObjects) {
            this.objectPool.resizePool(newSettings.maxConcurrentObjects);
        }
        
        // Update movement speed
        this.currentMovementSpeed = newSettings.movementSpeed * this.difficultyMultiplier;
        
        // Recalculate spawn positions if needed
        this.spawnPositions = this.calculateSpawnPositions();
        
        console.log('DataStreamGenerator settings updated:', this.settings);
    }

    /**
     * Gets current spawn settings
     * @returns {SpawnSettings} Current spawn settings
     */
    getSettings() {
        return this.settings;
    }

    /**
     * Gets generator statistics
     * @returns {Object} Statistics object
     */
    getStats() {
        const poolStats = this.objectPool.getPoolStats();
        const currentPhase = this.phaseManager ? this.phaseManager.getCurrentPhase() : 'unknown';
        
        return {
            isActive: this.isActive,
            isPaused: this.isPaused,
            currentPhase: currentPhase,
            difficultyMultiplier: this.difficultyMultiplier,
            currentMovementSpeed: this.currentMovementSpeed,
            currentCorruptionProbability: this.getCurrentCorruptionProbability(),
            totalObjectsSpawned: this.totalObjectsSpawned,
            objectsSpawnedThisPhase: this.objectsSpawnedThisPhase,
            activeObjects: poolStats.activeObjects,
            poolUtilization: poolStats.poolUtilization,
            nextSpawnInterval: this.nextSpawnInterval,
            spawnPositionsAvailable: this.spawnPositions.length,
            contentProviderLoaded: this.contentProvider ? this.contentProvider.isContentLoaded() : false
        };
    }

    /**
     * Forces immediate spawn of an object (for testing/debugging)
     * @param {string} contentType - Type of content to spawn
     * @param {boolean} isCorrupted - Whether object should be corrupted
     * @returns {InformationObject|null} The spawned object or null
     */
    forceSpawn(contentType = 'text', isCorrupted = false) {
        let contentData;

        // Try to use content provider if available
        if (this.contentProvider && this.contentProvider.isContentLoaded()) {
            try {
                contentData = this.contentProvider.getContentByType(contentType, isCorrupted);
            } catch (error) {
                console.warn('Error getting content from provider for force spawn:', error);
                contentData = null;
            }
        }

        // Fallback to manual content creation
        if (!contentData) {
            contentData = {
                contentType: contentType,
                contentText: isCorrupted ? 'C0rrupt3d t3xt' : 'Normal text',
                contentImage: null,
                isCorrupted: isCorrupted,
                corruptionSeverity: isCorrupted ? 0.8 : 0,
                displayColor: isCorrupted ? '#FF4444' : '#00FF41'
            };
        }

        const spawnPos = this.getRandomSpawnPosition();
        if (!spawnPos) {
            console.warn('No spawn position available for force spawn');
            return null;
        }

        const obj = this.objectPool.getObject(
            contentData,
            spawnPos.x,
            spawnPos.y,
            this.currentMovementSpeed
        );

        if (obj) {
            this.totalObjectsSpawned++;
            console.log(`Force spawned ${contentType} object (corrupted: ${isCorrupted})`);
        }

        return obj;
    }

    /**
     * Clears all active objects
     */
    clearAllObjects() {
        this.objectPool.clearAllObjects();
        console.log('All objects cleared from DataStreamGenerator');
    }

    /**
     * Destroys the generator and cleans up resources
     */
    destroy() {
        this.stop();
        this.objectPool.destroy();
        
        this.contentProvider = null;
        this.spawnPositions = [];
        
        console.log('DataStreamGenerator destroyed');
    }
}