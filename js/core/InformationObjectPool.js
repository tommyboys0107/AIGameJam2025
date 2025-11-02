// InformationObjectPool - Efficient object management system
// Implements object pooling to minimize garbage collection and improve performance

import { InformationObject } from './InformationObject.js';
import { GAME_CONSTANTS } from './constants.js';

export class InformationObjectPool {
    /**
     * Creates a new InformationObjectPool
     * @param {number} poolSize - Maximum number of objects in the pool (default from constants)
     */
    constructor(poolSize = GAME_CONSTANTS.MAX_CONCURRENT_OBJECTS) {
        this.poolSize = poolSize;
        this.availableObjects = [];
        this.activeObjects = [];
        
        // Pre-initialize the pool with inactive objects
        this.initializePool();
        
        console.log(`InformationObjectPool initialized with ${this.poolSize} objects`);
    }

    /**
     * Initializes the pool with inactive objects
     * @private
     */
    initializePool() {
        for (let i = 0; i < this.poolSize; i++) {
            // Create objects with default data - they'll be configured when retrieved
            const defaultData = {
                contentType: 'text',
                contentText: '',
                contentImage: null,
                isCorrupted: false,
                corruptionSeverity: 0,
                displayColor: '#FFFFFF'
            };
            
            const obj = new InformationObject(defaultData, 0, 0, 0);
            obj.isActive = false; // Mark as inactive initially
            this.availableObjects.push(obj);
        }
    }

    /**
     * Retrieves an object from the pool and configures it
     * @param {InformationObjectData} data - Content data for the object
     * @param {number} x - Initial X position
     * @param {number} y - Initial Y position
     * @param {number} movementSpeed - Movement speed
     * @returns {InformationObject|null} Configured object or null if pool is exhausted
     */
    getObject(data, x = 0, y = 0, movementSpeed = 2.0) {
        let obj = null;

        // Try to get an available object from the pool
        if (this.availableObjects.length > 0) {
            obj = this.availableObjects.pop();
        } else {
            // Pool is exhausted, check if we can reclaim any inactive objects from active list
            const inactiveIndex = this.activeObjects.findIndex(activeObj => !activeObj.isObjectActive());
            if (inactiveIndex !== -1) {
                obj = this.activeObjects.splice(inactiveIndex, 1)[0];
                console.warn('Pool exhausted, reclaiming inactive object');
            } else {
                console.warn('Object pool completely exhausted, cannot create new object');
                return null;
            }
        }

        // Configure the object with new data
        this.configureObject(obj, data, x, y, movementSpeed);
        
        // Add to active objects list
        this.activeObjects.push(obj);
        
        return obj;
    }

    /**
     * Configures an object with new data and properties
     * @param {InformationObject} obj - Object to configure
     * @param {InformationObjectData} data - Content data
     * @param {number} x - X position
     * @param {number} y - Y position
     * @param {number} movementSpeed - Movement speed
     * @private
     */
    configureObject(obj, data, x, y, movementSpeed) {
        // Reset position and movement
        obj.x = x;
        obj.y = y;
        obj.movementSpeed = movementSpeed;
        obj.isActive = true;

        // Update content properties
        obj.contentType = data.contentType;
        obj.contentText = data.contentText;
        obj.contentImage = data.contentImage;
        obj.isCorrupted = data.isCorrupted;
        obj.corruptionSeverity = data.corruptionSeverity;
        obj.displayColor = data.displayColor;

        // Update visual properties based on corruption
        obj.borderColor = data.isCorrupted ? '#FF4444' : '#00FF41';
        obj.flickerSpeed = data.isCorrupted ? 0.1 : 0;
        obj.flickerTimer = 0;

        // Reset image loading state
        obj.imageLoaded = false;
        if (obj.imageElement) {
            obj.imageElement.onload = null;
            obj.imageElement.onerror = null;
            obj.imageElement = null;
        }

        // Load new image if needed
        if (data.contentType === 'image' && data.contentImage) {
            obj.loadImage();
        }

        // Reset dimensions to default (may be adjusted by image loading)
        obj.width = 280;  // Much larger default size for full-screen
        obj.height = 140; // Much larger default size for full-screen
    }

    /**
     * Returns an object to the pool for reuse
     * @param {InformationObject} obj - Object to return to pool
     * @returns {boolean} True if object was successfully returned
     */
    returnObject(obj) {
        if (!obj) return false;

        // Find and remove from active objects
        const activeIndex = this.activeObjects.indexOf(obj);
        if (activeIndex === -1) {
            console.warn('Attempted to return object not in active list');
            return false;
        }

        this.activeObjects.splice(activeIndex, 1);

        // Clean up the object
        obj.destroy();
        obj.isActive = false;

        // Return to available pool if there's space
        if (this.availableObjects.length < this.poolSize) {
            this.availableObjects.push(obj);
        } else {
            console.warn('Available pool is full, discarding object');
        }

        return true;
    }

    /**
     * Updates all active objects and handles cleanup
     * @param {number} deltaTime - Time elapsed since last update
     * @param {number} screenHeight - Height of the game screen for boundary checking
     */
    updateActiveObjects(deltaTime, screenHeight) {
        // Update all active objects
        for (let i = this.activeObjects.length - 1; i >= 0; i--) {
            const obj = this.activeObjects[i];
            
            if (obj.isObjectActive()) {
                obj.update(deltaTime);
                
                // Check if object has reached bottom of screen
                if (obj.hasReachedBottom(screenHeight)) {
                    this.returnObject(obj);
                }
            } else {
                // Object is inactive, return it to pool
                this.returnObject(obj);
            }
        }
    }

    /**
     * Renders all active objects
     * @param {CanvasRenderingContext2D} ctx - Canvas rendering context
     */
    renderActiveObjects(ctx) {
        for (const obj of this.activeObjects) {
            if (obj.isObjectActive()) {
                obj.render(ctx);
            }
        }
    }

    /**
     * Handles mouse click events for all active objects
     * @param {number} mouseX - Mouse X coordinate
     * @param {number} mouseY - Mouse Y coordinate
     * @returns {InformationObject|null} The clicked object or null if no object was clicked
     */
    handleClick(mouseX, mouseY) {
        // Check objects in reverse order (top to bottom rendering)
        for (let i = this.activeObjects.length - 1; i >= 0; i--) {
            const obj = this.activeObjects[i];
            
            if (obj.isObjectActive() && obj.isClicked(mouseX, mouseY)) {
                obj.block();
                return obj;
            }
        }
        
        return null;
    }

    /**
     * Gets all currently active objects
     * @returns {InformationObject[]} Array of active objects
     */
    getActiveObjects() {
        return this.activeObjects.filter(obj => obj.isObjectActive());
    }

    /**
     * Gets the number of active objects
     * @returns {number} Count of active objects
     */
    getActiveObjectCount() {
        return this.activeObjects.filter(obj => obj.isObjectActive()).length;
    }

    /**
     * Gets the number of available objects in the pool
     * @returns {number} Count of available objects
     */
    getAvailableObjectCount() {
        return this.availableObjects.length;
    }

    /**
     * Clears all active objects and returns them to the pool
     */
    clearAllObjects() {
        // Return all active objects to the pool
        while (this.activeObjects.length > 0) {
            const obj = this.activeObjects.pop();
            obj.destroy();
            obj.isActive = false;
            
            if (this.availableObjects.length < this.poolSize) {
                this.availableObjects.push(obj);
            }
        }
        
        console.log('All objects cleared and returned to pool');
    }

    /**
     * Resizes the pool (useful for difficulty scaling)
     * @param {number} newSize - New pool size
     */
    resizePool(newSize) {
        if (newSize < 1) {
            console.warn('Pool size must be at least 1');
            return;
        }

        const oldSize = this.poolSize;
        this.poolSize = newSize;

        if (newSize > oldSize) {
            // Expand pool - add new objects
            const objectsToAdd = newSize - oldSize;
            for (let i = 0; i < objectsToAdd; i++) {
                const defaultData = {
                    contentType: 'text',
                    contentText: '',
                    contentImage: null,
                    isCorrupted: false,
                    corruptionSeverity: 0,
                    displayColor: '#FFFFFF'
                };
                
                const obj = new InformationObject(defaultData, 0, 0, 0);
                obj.isActive = false;
                this.availableObjects.push(obj);
            }
        } else if (newSize < oldSize) {
            // Shrink pool - remove excess available objects
            const objectsToRemove = oldSize - newSize;
            for (let i = 0; i < objectsToRemove && this.availableObjects.length > 0; i++) {
                this.availableObjects.pop();
            }
        }

        console.log(`Pool resized from ${oldSize} to ${newSize} objects`);
    }

    /**
     * Gets pool statistics for debugging and monitoring
     * @returns {Object} Pool statistics
     */
    getPoolStats() {
        const activeCount = this.getActiveObjectCount();
        const availableCount = this.getAvailableObjectCount();
        const totalInactiveInActive = this.activeObjects.filter(obj => !obj.isObjectActive()).length;

        return {
            poolSize: this.poolSize,
            activeObjects: activeCount,
            availableObjects: availableCount,
            inactiveInActiveList: totalInactiveInActive,
            poolUtilization: (activeCount / this.poolSize) * 100,
            totalObjectsManaged: this.activeObjects.length + this.availableObjects.length
        };
    }

    /**
     * Validates pool integrity (for debugging)
     * @returns {boolean} True if pool is in valid state
     */
    validatePool() {
        const stats = this.getPoolStats();
        const totalObjects = stats.totalObjectsManaged;
        
        if (totalObjects > this.poolSize) {
            console.error(`Pool integrity error: managing ${totalObjects} objects but pool size is ${this.poolSize}`);
            return false;
        }

        // Check for duplicate objects
        const allObjects = [...this.activeObjects, ...this.availableObjects];
        const uniqueObjects = new Set(allObjects);
        
        if (uniqueObjects.size !== allObjects.length) {
            console.error('Pool integrity error: duplicate objects detected');
            return false;
        }

        return true;
    }

    /**
     * Destroys the pool and cleans up all objects
     */
    destroy() {
        this.clearAllObjects();
        
        // Clean up available objects
        for (const obj of this.availableObjects) {
            obj.destroy();
        }
        
        this.availableObjects = [];
        this.activeObjects = [];
        
        console.log('InformationObjectPool destroyed');
    }
}