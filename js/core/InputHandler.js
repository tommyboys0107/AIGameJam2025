// InputHandler - Manages canvas mouse click events and input validation
// Handles coordinate transformation and canvas bounds checking

export class InputHandler {
    /**
     * Creates a new InputHandler
     * @param {HTMLCanvasElement} canvas - The game canvas element
     * @param {DataStreamGenerator} dataStreamGenerator - Reference to data stream generator for object interaction
     */
    constructor(canvas, dataStreamGenerator) {
        this.canvas = canvas;
        this.dataStreamGenerator = dataStreamGenerator;
        
        // Input state tracking
        this.isEnabled = false;
        this.lastClickTime = 0;
        this.clickCooldown = 100; // Minimum time between clicks in milliseconds
        
        // Canvas bounds and scaling
        this.canvasBounds = null;
        this.scaleX = 1;
        this.scaleY = 1;
        
        // Event listeners
        this.boundClickHandler = this.handleCanvasClick.bind(this);
        this.boundMouseMoveHandler = this.handleMouseMove.bind(this);
        this.boundResizeHandler = this.updateCanvasBounds.bind(this);
        
        // Mouse position tracking
        this.mouseX = 0;
        this.mouseY = 0;
        this.isMouseOverCanvas = false;
        
        // Click feedback callbacks
        this.onValidClick = null;    // Callback for successful object clicks
        this.onInvalidClick = null;  // Callback for clicks that miss objects
        this.onClickFeedback = null; // Callback for visual feedback
        
        // Initialize canvas bounds
        this.updateCanvasBounds();
        
        console.log('InputHandler initialized');
    }

    /**
     * Enables input handling and adds event listeners
     */
    enable() {
        if (this.isEnabled) {
            console.warn('InputHandler already enabled');
            return;
        }

        // Add mouse event listeners
        this.canvas.addEventListener('click', this.boundClickHandler);
        this.canvas.addEventListener('mousemove', this.boundMouseMoveHandler);
        this.canvas.addEventListener('mouseenter', this.handleMouseEnter.bind(this));
        this.canvas.addEventListener('mouseleave', this.handleMouseLeave.bind(this));
        
        // Add window resize listener to update canvas bounds
        window.addEventListener('resize', this.boundResizeHandler);
        
        // Set canvas cursor style
        this.canvas.style.cursor = 'crosshair';
        
        this.isEnabled = true;
        console.log('InputHandler enabled');
    }

    /**
     * Disables input handling and removes event listeners
     */
    disable() {
        if (!this.isEnabled) {
            console.warn('InputHandler already disabled');
            return;
        }

        // Remove event listeners
        this.canvas.removeEventListener('click', this.boundClickHandler);
        this.canvas.removeEventListener('mousemove', this.boundMouseMoveHandler);
        this.canvas.removeEventListener('mouseenter', this.handleMouseEnter.bind(this));
        this.canvas.removeEventListener('mouseleave', this.handleMouseLeave.bind(this));
        window.removeEventListener('resize', this.boundResizeHandler);
        
        // Reset canvas cursor
        this.canvas.style.cursor = 'default';
        
        this.isEnabled = false;
        console.log('InputHandler disabled');
    }

    /**
     * Handles canvas click events
     * @param {MouseEvent} event - The mouse click event
     * @private
     */
    handleCanvasClick(event) {
        if (!this.isEnabled) {
            return;
        }

        // Prevent default behavior
        event.preventDefault();
        
        // Check click cooldown to prevent spam clicking
        const currentTime = Date.now();
        if (currentTime - this.lastClickTime < this.clickCooldown) {
            console.log('Click ignored due to cooldown');
            return;
        }
        this.lastClickTime = currentTime;

        // Get canvas coordinates
        const canvasCoords = this.getCanvasCoordinates(event);
        if (!canvasCoords) {
            console.warn('Failed to get canvas coordinates');
            return;
        }

        const { x, y } = canvasCoords;
        
        // Validate coordinates are within canvas bounds
        if (!this.isValidCanvasCoordinate(x, y)) {
            console.log(`Click outside canvas bounds: (${x}, ${y})`);
            if (this.onInvalidClick) {
                this.onInvalidClick(x, y, 'outside_bounds');
            }
            return;
        }

        console.log(`Canvas click at: (${x.toFixed(1)}, ${y.toFixed(1)})`);

        // Try to handle click with data stream generator
        const clickedObject = this.dataStreamGenerator.handleClick(x, y);
        
        if (clickedObject) {
            console.log('Object clicked successfully:', clickedObject.getDebugInfo());
            
            // Trigger valid click callback
            if (this.onValidClick) {
                this.onValidClick(clickedObject, x, y);
            }
            
            // Trigger click feedback
            if (this.onClickFeedback) {
                this.onClickFeedback(x, y, 'object_hit', clickedObject);
            }
        } else {
            console.log('Click missed all objects');
            
            // Trigger invalid click callback
            if (this.onInvalidClick) {
                this.onInvalidClick(x, y, 'missed_objects');
            }
            
            // Trigger click feedback
            if (this.onClickFeedback) {
                this.onClickFeedback(x, y, 'missed', null);
            }
        }
    }

    /**
     * Handles mouse move events for position tracking
     * @param {MouseEvent} event - The mouse move event
     * @private
     */
    handleMouseMove(event) {
        if (!this.isEnabled) {
            return;
        }

        const canvasCoords = this.getCanvasCoordinates(event);
        if (canvasCoords) {
            this.mouseX = canvasCoords.x;
            this.mouseY = canvasCoords.y;
        }
    }

    /**
     * Handles mouse enter events
     * @private
     */
    handleMouseEnter() {
        this.isMouseOverCanvas = true;
    }

    /**
     * Handles mouse leave events
     * @private
     */
    handleMouseLeave() {
        this.isMouseOverCanvas = false;
    }

    /**
     * Converts screen coordinates to canvas coordinates
     * @param {MouseEvent} event - The mouse event
     * @returns {{x: number, y: number}|null} Canvas coordinates or null if invalid
     * @private
     */
    getCanvasCoordinates(event) {
        if (!this.canvasBounds) {
            this.updateCanvasBounds();
        }

        // Get fresh canvas bounds to ensure accuracy
        const rect = this.canvas.getBoundingClientRect();
        
        // Get mouse position relative to canvas
        const clientX = event.clientX - rect.left;
        const clientY = event.clientY - rect.top;

        // For full-screen canvas, the scaling should be 1:1
        // Since canvas width/height should match the viewport
        const canvasX = clientX * (this.canvas.width / rect.width);
        const canvasY = clientY * (this.canvas.height / rect.height);

        // Debug logging for coordinate conversion
        console.log(`Click conversion: client(${event.clientX}, ${event.clientY}) -> relative(${clientX.toFixed(1)}, ${clientY.toFixed(1)}) -> canvas(${canvasX.toFixed(1)}, ${canvasY.toFixed(1)})`);
        console.log(`Canvas: ${this.canvas.width}x${this.canvas.height}, Rect: ${rect.width.toFixed(1)}x${rect.height.toFixed(1)}`);

        return { x: canvasX, y: canvasY };
    }

    /**
     * Updates canvas bounds and scaling factors
     * @private
     */
    updateCanvasBounds() {
        if (!this.canvas) {
            console.warn('Cannot update canvas bounds: canvas is null');
            return;
        }

        this.canvasBounds = this.canvas.getBoundingClientRect();
        
        // Calculate scaling factors for coordinate transformation
        this.scaleX = this.canvas.width / this.canvasBounds.width;
        this.scaleY = this.canvas.height / this.canvasBounds.height;
        
        console.log(`Canvas bounds updated:`);
        console.log(`  Internal: ${this.canvas.width}x${this.canvas.height}`);
        console.log(`  Bounds: ${this.canvasBounds.width.toFixed(1)}x${this.canvasBounds.height.toFixed(1)}`);
        console.log(`  Position: (${this.canvasBounds.left.toFixed(1)}, ${this.canvasBounds.top.toFixed(1)})`);
        console.log(`  Scale: ${this.scaleX.toFixed(3)}x${this.scaleY.toFixed(3)}`);
        
        // Warn if scaling is not 1:1
        if (Math.abs(this.scaleX - 1) > 0.01 || Math.abs(this.scaleY - 1) > 0.01) {
            console.warn('Canvas scaling detected! This may cause click coordinate issues.');
            console.warn('Consider setting canvas CSS size to match internal dimensions.');
        }
    }

    /**
     * Validates if coordinates are within canvas bounds
     * @param {number} x - X coordinate
     * @param {number} y - Y coordinate
     * @returns {boolean} True if coordinates are valid
     * @private
     */
    isValidCanvasCoordinate(x, y) {
        return x >= 0 && x <= this.canvas.width && 
               y >= 0 && y <= this.canvas.height;
    }

    /**
     * Gets the current mouse position relative to canvas
     * @returns {{x: number, y: number}} Current mouse position
     */
    getMousePosition() {
        return {
            x: this.mouseX,
            y: this.mouseY
        };
    }

    /**
     * Checks if mouse is currently over the canvas
     * @returns {boolean} True if mouse is over canvas
     */
    isMouseOver() {
        return this.isMouseOverCanvas;
    }

    /**
     * Sets the click cooldown period
     * @param {number} cooldown - Cooldown period in milliseconds
     */
    setClickCooldown(cooldown) {
        this.clickCooldown = Math.max(0, cooldown);
        console.log(`Click cooldown set to ${this.clickCooldown}ms`);
    }

    /**
     * Sets callback for valid object clicks
     * @param {Function} callback - Callback function (clickedObject, x, y) => void
     */
    setValidClickCallback(callback) {
        this.onValidClick = callback;
    }

    /**
     * Sets callback for invalid clicks (misses or out of bounds)
     * @param {Function} callback - Callback function (x, y, reason) => void
     */
    setInvalidClickCallback(callback) {
        this.onInvalidClick = callback;
    }

    /**
     * Sets callback for click feedback effects
     * @param {Function} callback - Callback function (x, y, type, object) => void
     */
    setClickFeedbackCallback(callback) {
        this.onClickFeedback = callback;
    }

    /**
     * Forces an update of canvas bounds (useful after canvas resize)
     */
    refreshCanvasBounds() {
        this.updateCanvasBounds();
    }

    /**
     * Simulates a click at the specified canvas coordinates (for testing)
     * @param {number} x - Canvas X coordinate
     * @param {number} y - Canvas Y coordinate
     * @returns {boolean} True if click was processed successfully
     */
    simulateClick(x, y) {
        if (!this.isEnabled) {
            console.warn('Cannot simulate click - InputHandler is disabled');
            return false;
        }

        if (!this.isValidCanvasCoordinate(x, y)) {
            console.warn(`Cannot simulate click - invalid coordinates: (${x}, ${y})`);
            return false;
        }

        console.log(`Simulating click at: (${x}, ${y})`);

        // Try to handle click with data stream generator
        const clickedObject = this.dataStreamGenerator.handleClick(x, y);
        
        if (clickedObject) {
            console.log('Simulated click hit object:', clickedObject.getDebugInfo());
            
            if (this.onValidClick) {
                this.onValidClick(clickedObject, x, y);
            }
            
            if (this.onClickFeedback) {
                this.onClickFeedback(x, y, 'object_hit', clickedObject);
            }
            
            return true;
        } else {
            console.log('Simulated click missed all objects');
            
            if (this.onInvalidClick) {
                this.onInvalidClick(x, y, 'missed_objects');
            }
            
            if (this.onClickFeedback) {
                this.onClickFeedback(x, y, 'missed', null);
            }
            
            return false;
        }
    }

    /**
     * Gets input handler statistics
     * @returns {Object} Statistics object
     */
    getStats() {
        return {
            isEnabled: this.isEnabled,
            clickCooldown: this.clickCooldown,
            lastClickTime: this.lastClickTime,
            mousePosition: { x: this.mouseX, y: this.mouseY },
            isMouseOverCanvas: this.isMouseOverCanvas,
            canvasDimensions: this.canvas ? { width: this.canvas.width, height: this.canvas.height } : null,
            canvasBounds: this.canvasBounds ? { 
                width: this.canvasBounds.width, 
                height: this.canvasBounds.height 
            } : null,
            scalingFactors: { x: this.scaleX, y: this.scaleY }
        };
    }

    /**
     * Destroys the input handler and cleans up resources
     */
    destroy() {
        this.disable();
        
        this.canvas = null;
        this.dataStreamGenerator = null;
        this.canvasBounds = null;
        this.onValidClick = null;
        this.onInvalidClick = null;
        this.onClickFeedback = null;
        
        console.log('InputHandler destroyed');
    }
}