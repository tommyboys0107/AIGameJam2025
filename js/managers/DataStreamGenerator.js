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
        
        // Initialize all properties first
        this.difficultyMultiplier = 1.0;
        this.currentMovementSpeed = this.settings.movementSpeed;
        this.baseCorruptionProbability = 0.3; // 30% base chance
        this.maxCorruptionProbability = 0.7;  // 70% max chance at high difficulty
        
        // Dynamic object count scaling
        this.baseMaxObjects = 8;  // Starting number of objects
        this.maxMaxObjects = 13;  // Maximum number of objects
        this.currentMaxObjects = this.baseMaxObjects;
        this.gameStartTime = null; // Will be set when game starts
        
        // Screen dimensions for spawn positioning
        this.screenWidth = 1200;  // Updated default for larger canvas
        this.screenHeight = 900; // Updated default for larger canvas
        
        // State management
        this.isActive = false;
        this.isPaused = false;
        
        // Object pool for efficient memory management - start with max possible size
        const initialPoolSize = this.maxMaxObjects; // Use maximum possible size
        this.objectPool = new InformationObjectPool(initialPoolSize);
        console.log(`🔧 Pool initialized with size ${initialPoolSize} (will scale from ${this.baseMaxObjects} to ${this.maxMaxObjects})`);
        
        // Spawn timing management (after all properties are initialized)
        this.lastSpawnTime = 0;
        this.nextSpawnInterval = this.getRandomSpawnInterval();
        
        // Spawn position management
        this.spawnPositions = this.calculateSpawnPositions();
        
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
        const targetMargin = 30; // Target margin for both sides
        const maxObjectWidth = 600; // Maximum possible object width
        const numTopPositions = 6;
        
        // Calculate positions to ensure exactly equal margins
        // We want: leftMargin = rightMargin = targetMargin
        // This means: firstObjectX = targetMargin
        // And: lastObjectX + maxObjectWidth + targetMargin = screenWidth
        // So: lastObjectX = screenWidth - targetMargin - maxObjectWidth
        
        const firstObjectX = targetMargin;
        const lastObjectX = this.screenWidth - targetMargin - maxObjectWidth;
        const totalSpread = lastObjectX - firstObjectX;
        
        if (totalSpread < 0) {
            console.warn('Screen too narrow for current object size and margins');
            // Fallback: single position in center
            positions.push({
                x: this.screenWidth / 2 - maxObjectWidth / 2,
                y: -150,
                edge: 'top'
            });
        } else {
            // Distribute positions evenly between first and last
            for (let i = 0; i < numTopPositions; i++) {
                let x;
                if (numTopPositions === 1) {
                    x = firstObjectX;
                } else {
                    // Linear interpolation between first and last position
                    const ratio = i / (numTopPositions - 1);
                    x = firstObjectX + (ratio * totalSpread);
                }
                
                positions.push({
                    x: x,
                    y: -150, // Start well above screen
                    edge: 'top'
                });
            }
        }
        
        console.log(`Generated ${positions.length} spawn positions (screen: ${this.screenWidth}x${this.screenHeight})`);
        console.log(`Target margin: ${targetMargin}px (both sides)`);
        console.log(`Object positions: ${positions.map(p => p.x.toFixed(1)).join(', ')}`);
        
        if (positions.length > 0) {
            // Verify margins are exactly equal by design
            const leftmostX = positions[0].x;
            const rightmostX = positions[positions.length - 1].x;
            const actualLeftMargin = leftmostX;
            const actualRightMargin = this.screenWidth - (rightmostX + maxObjectWidth);
            
            console.log(`📏 Margin verification:`);
            console.log(`  Left margin: ${actualLeftMargin.toFixed(3)}px`);
            console.log(`  Right margin: ${actualRightMargin.toFixed(3)}px`);
            console.log(`  Difference: ${Math.abs(actualLeftMargin - actualRightMargin).toFixed(6)}px`);
            console.log(`  Target was: ${targetMargin}px`);
            
            if (positions.length > 1) {
                // Calculate spacing between positions
                const spacings = [];
                for (let i = 1; i < positions.length; i++) {
                    spacings.push((positions[i].x - positions[i-1].x).toFixed(1));
                }
                console.log(`  Spacings: ${spacings.join(', ')}px`);
                
                // Show total spread
                console.log(`  Total spread: ${totalSpread.toFixed(1)}px`);
                console.log(`  First object at: ${firstObjectX}px`);
                console.log(`  Last object at: ${lastObjectX}px`);
            }
        }
        
        return positions;
    }

    /**
     * Starts the data stream generation
     */
    start() {
        console.log('🚀 DataStreamGenerator started');
        this.isActive = true;
        this.isPaused = false;
        this.gameStartTime = Date.now(); // Record game start time
        this.lastSpawnTime = this.gameStartTime;
        this.nextSpawnInterval = this.getRandomSpawnInterval();
        this.objectsSpawnedThisPhase = 0;
        this.currentMaxObjects = this.baseMaxObjects; // Reset to base
        
        console.log(`📋 Generator settings:`, {
            isActive: this.isActive,
            isPaused: this.isPaused,
            baseMaxObjects: this.baseMaxObjects,
            maxMaxObjects: this.maxMaxObjects,
            currentMaxObjects: this.currentMaxObjects,
            baseSpawnIntervalMin: this.settings.baseSpawnIntervalMin,
            baseSpawnIntervalMax: this.settings.baseSpawnIntervalMax,
            nextSpawnInterval: this.nextSpawnInterval,
            spawnPositions: this.spawnPositions.length
        });
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

        const currentTime = Date.now();

        // Check for objects that reached the bottom before updating
        this.checkObjectsReachedBottom();

        // Update object pool
        this.objectPool.updateActiveObjects(deltaTime, this.screenHeight);
        
        // Force cleanup of inactive objects every few seconds
        if (!this.lastCleanupTime) this.lastCleanupTime = 0;
        if (currentTime - this.lastCleanupTime > 3000) { // Every 3 seconds
            this.forceCleanupInactiveObjects();
            this.lastCleanupTime = currentTime;
        }

        // Check if it's time to spawn a new object
        const timeSinceLastSpawn = currentTime - this.lastSpawnTime;
        if (timeSinceLastSpawn >= this.nextSpawnInterval) {
            console.log(`⏰ Time to spawn: ${timeSinceLastSpawn}ms >= ${this.nextSpawnInterval}ms`);
            this.spawnObject();
            this.lastSpawnTime = currentTime;
            this.nextSpawnInterval = this.getRandomSpawnInterval();
            console.log(`⏰ Next spawn in: ${this.nextSpawnInterval}ms`);
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
            
            // Ensure the object is properly deactivated
            obj.isActive = false;
            console.log(`Object deactivated after reaching bottom`);
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
        console.log('🎯 spawnObject() called');
        
        // Check if we've reached the maximum concurrent objects
        const currentActiveCount = this.objectPool.getActiveObjectCount();
        const maxAllowed = this.calculateCurrentMaxObjects(); // Dynamic max objects
        
        console.log(`📊 Current active objects: ${currentActiveCount}/${maxAllowed}`);
        
        // Debug: Show details about active objects
        const allActiveObjects = this.objectPool.activeObjects;
        const reallyActiveObjects = allActiveObjects.filter(obj => obj.isObjectActive());
        console.log(`🔍 Debug: activeObjects.length=${allActiveObjects.length}, reallyActive=${reallyActiveObjects.length}`);
        
        if (currentActiveCount >= maxAllowed) {
            console.log(`❌ Maximum concurrent objects reached: ${currentActiveCount}/${maxAllowed}, skipping spawn`);
            return;
        }
        
        console.log(`✅ Proceeding with spawn: ${currentActiveCount}/${maxAllowed} active objects`);

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
            // Set movement direction based on spawn edge
            obj.setMovementDirection(spawnPos.edge);
            
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
     * Gets a random spawn position from available positions, avoiding overlaps
     * @returns {Object|null} Spawn position object or null if none available
     * @private
     */
    getRandomSpawnPosition() {
        if (this.spawnPositions.length === 0) {
            return null;
        }

        const activeObjects = this.objectPool.getActiveObjects();
        const maxAttempts = 15; // Increase attempts to find non-overlapping position
        
        for (let attempt = 0; attempt < maxAttempts; attempt++) {
            const candidatePos = this.spawnPositions[Math.floor(Math.random() * this.spawnPositions.length)];
            
            // Check if this position would overlap with existing objects
            let hasOverlap = false;
            const minHorizontalDistance = 200; // Larger horizontal distance
            const minVerticalDistance = 150;   // Minimum vertical distance
            
            for (const obj of activeObjects) {
                const horizontalDistance = Math.abs(candidatePos.x - obj.x);
                const verticalDistance = Math.abs(candidatePos.y - obj.y);
                
                // Check both horizontal and vertical distances
                if (horizontalDistance < minHorizontalDistance && verticalDistance < minVerticalDistance) {
                    hasOverlap = true;
                    break;
                }
                
                // Also check if objects are too close in the spawn area (top of screen)
                if (obj.y < 100 && verticalDistance < 200) { // If object is near top
                    if (horizontalDistance < minHorizontalDistance) {
                        hasOverlap = true;
                        break;
                    }
                }
            }
            
            if (!hasOverlap) {
                console.log(`✅ Found non-overlapping position at (${candidatePos.x.toFixed(0)}, ${candidatePos.y}) after ${attempt + 1} attempts`);
                return candidatePos;
            }
        }
        
        // If we couldn't find a non-overlapping position, try to find the least crowded area
        let bestPosition = null;
        let maxMinDistance = 0;
        
        for (const candidatePos of this.spawnPositions) {
            let minDistanceToAnyObject = Infinity;
            
            for (const obj of activeObjects) {
                const distance = Math.sqrt(
                    Math.pow(candidatePos.x - obj.x, 2) + 
                    Math.pow(candidatePos.y - obj.y, 2)
                );
                minDistanceToAnyObject = Math.min(minDistanceToAnyObject, distance);
            }
            
            if (minDistanceToAnyObject > maxMinDistance) {
                maxMinDistance = minDistanceToAnyObject;
                bestPosition = candidatePos;
            }
        }
        
        if (bestPosition) {
            console.warn(`⚠️ Using least crowded position at (${bestPosition.x.toFixed(0)}, ${bestPosition.y}) with distance ${maxMinDistance.toFixed(0)}`);
            return bestPosition;
        }
        
        // Last resort: use random position
        console.warn('❌ Could not find any good spawn position, using random position');
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
        const minInterval = Math.max(scaledMin, 1000); // Minimum 1 second
        const maxInterval = Math.max(scaledMax, minInterval + 300); // At least 0.3s difference
        
        const interval = Math.random() * (maxInterval - minInterval) + minInterval;
        console.log(`⏱️ Spawn interval calculated: ${interval.toFixed(0)}ms (range: ${minInterval.toFixed(0)}-${maxInterval.toFixed(0)}ms, difficulty: ${this.difficultyMultiplier || 1})`);
        return interval;
    }

    /**
     * Updates difficulty scaling
     * @param {number} multiplier - New difficulty multiplier
     */
    updateDifficulty(multiplier) {
        console.log(`DataStreamGenerator difficulty updated: ${this.difficultyMultiplier || 1} -> ${multiplier || 1}`);
        
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
        
        console.log(`Corruption probability range set: ${this.baseCorruptionProbability || 0} - ${this.maxCorruptionProbability || 0}`);
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
            
            // Ensure the object is properly deactivated
            clickedObject.isActive = false;
            console.log(`Object deactivated after being clicked`);
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
            currentMaxObjects: this.currentMaxObjects,
            baseMaxObjects: this.baseMaxObjects,
            maxMaxObjects: this.maxMaxObjects,
            gameElapsedTime: this.gameStartTime ? (Date.now() - this.gameStartTime) / 1000 : 0,
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
     * Forces cleanup of inactive objects from the active list
     * @private
     */
    forceCleanupInactiveObjects() {
        const beforeCount = this.objectPool.getActiveObjectCount();
        const activeObjects = this.objectPool.activeObjects;
        
        // Remove inactive objects from active list
        for (let i = activeObjects.length - 1; i >= 0; i--) {
            const obj = activeObjects[i];
            if (!obj.isObjectActive()) {
                this.objectPool.returnObject(obj);
            }
        }
        
        const afterCount = this.objectPool.getActiveObjectCount();
        if (beforeCount !== afterCount) {
            console.log(`Forced cleanup: removed ${beforeCount - afterCount} inactive objects`);
        }
    }

    /**
     * Calculates the current maximum objects based on elapsed time
     * @returns {number} Current maximum objects allowed
     * @private
     */
    calculateCurrentMaxObjects() {
        if (!this.gameStartTime) {
            return this.baseMaxObjects;
        }
        
        const elapsedTime = Date.now() - this.gameStartTime;
        const elapsedSeconds = elapsedTime / 1000;
        
        // Increase max objects every 15 seconds
        const increaseInterval = 15; // seconds
        const increaseAmount = 1; // objects per interval
        
        const additionalObjects = Math.floor(elapsedSeconds / increaseInterval) * increaseAmount;
        const newMaxObjects = Math.min(this.baseMaxObjects + additionalObjects, this.maxMaxObjects);
        
        // Update object pool size if needed
        if (newMaxObjects !== this.currentMaxObjects) {
            console.log(`📈 Increasing max objects: ${this.currentMaxObjects} -> ${newMaxObjects} (${elapsedSeconds.toFixed(0)}s elapsed)`);
            this.currentMaxObjects = newMaxObjects;
            
            // Resize object pool to accommodate more objects
            if (newMaxObjects > this.objectPool.poolSize) {
                this.objectPool.resizePool(newMaxObjects);
            }
        }
        
        return this.currentMaxObjects;
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