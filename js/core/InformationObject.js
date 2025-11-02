// InformationObject - Individual data packets that flow through the system
// Handles position, collision, rendering, and movement behavior

import { ContentType } from './constants.js';

export class InformationObject {
    /**
     * Creates a new InformationObject
     * @param {InformationObjectData} data - Content data for this object
     * @param {number} x - Initial X position
     * @param {number} y - Initial Y position
     * @param {number} movementSpeed - Speed at which object moves
     */
    constructor(data, x = 0, y = 0, movementSpeed = 2.0) {
        // Position and dimensions
        this.x = x;
        this.y = y;
        this.width = 280;  // Much larger width for full-screen visibility
        this.height = 140; // Much larger height for full-screen visibility
        
        // Movement properties
        this.movementSpeed = movementSpeed;
        this.isActive = true;
        
        // Content properties
        this.contentType = data.contentType;
        this.contentText = data.contentText;
        this.contentImage = data.contentImage;
        this.isCorrupted = data.isCorrupted;
        this.corruptionSeverity = data.corruptionSeverity;
        this.displayColor = data.displayColor;
        
        // Visual properties
        this.fontSize = 24;  // Much larger font size for full-screen readability
        this.fontFamily = 'Courier New, monospace';
        this.borderColor = this.isCorrupted ? '#FF4444' : '#00FF41';
        this.backgroundColor = 'rgba(0, 0, 0, 0.8)';
        
        // Animation properties for corruption effects
        this.flickerTimer = 0;
        this.flickerSpeed = this.isCorrupted ? 0.1 : 0;
        
        // Image loading state (for image content)
        this.imageLoaded = false;
        this.imageElement = null;
        
        // Load image if content type is image
        if (this.contentType === ContentType.IMAGE && this.contentImage) {
            this.loadImage();
        }
    }

    /**
     * Loads image content asynchronously
     * @private
     */
    loadImage() {
        this.imageElement = new Image();
        this.imageElement.onload = () => {
            this.imageLoaded = true;
            // Adjust dimensions based on image aspect ratio
            const aspectRatio = this.imageElement.width / this.imageElement.height;
            if (aspectRatio > 1) {
                this.width = 280;  // Much larger for full-screen images
                this.height = 280 / aspectRatio;
            } else {
                this.height = 140; // Much larger for full-screen images
                this.width = 140 * aspectRatio;
            }
        };
        this.imageElement.onerror = () => {
            console.warn(`Failed to load image: ${this.contentImage}`);
            // Fallback to text rendering
            this.contentType = ContentType.TEXT;
            this.contentText = this.isCorrupted ? '[CORRUPTED IMAGE]' : '[IMAGE]';
        };
        this.imageElement.src = this.contentImage;
    }

    /**
     * Updates the object's position and state
     * @param {number} deltaTime - Time elapsed since last update (in milliseconds)
     */
    update(deltaTime) {
        if (!this.isActive) return;

        // Move toward bottom of screen
        this.y += this.movementSpeed * (deltaTime / 16.67); // Normalize to 60fps

        // Update flicker animation for corrupted objects
        if (this.flickerSpeed > 0) {
            this.flickerTimer += deltaTime * 0.001; // Convert to seconds
        }
    }

    /**
     * Renders the object on the canvas
     * @param {CanvasRenderingContext2D} ctx - Canvas rendering context
     */
    render(ctx) {
        if (!this.isActive) return;

        ctx.save();

        // Apply corruption flicker effect
        if (this.flickerSpeed > 0) {
            const flickerAlpha = 0.7 + 0.3 * Math.sin(this.flickerTimer * this.flickerSpeed * 20);
            ctx.globalAlpha = flickerAlpha;
        }

        // Draw background
        ctx.fillStyle = this.backgroundColor;
        ctx.fillRect(this.x, this.y, this.width, this.height);

        // Draw border
        ctx.strokeStyle = this.borderColor;
        ctx.lineWidth = 3;  // Thicker border for larger objects
        ctx.strokeRect(this.x, this.y, this.width, this.height);

        // Render content based on type
        switch (this.contentType) {
            case ContentType.TEXT:
                this.renderText(ctx);
                break;
            case ContentType.IMAGE:
                this.renderImage(ctx);
                break;
            case ContentType.CODE:
                this.renderCode(ctx);
                break;
        }

        ctx.restore();
    }

    /**
     * Renders text content
     * @param {CanvasRenderingContext2D} ctx - Canvas rendering context
     * @private
     */
    renderText(ctx) {
        ctx.fillStyle = this.displayColor;
        ctx.font = `${this.fontSize}px ${this.fontFamily}`;
        ctx.textAlign = 'center';
        ctx.textBaseline = 'middle';

        // Word wrap for long text
        const words = this.contentText.split(' ');
        const lines = [];
        let currentLine = '';
        const maxWidth = this.width - 10; // Padding

        for (const word of words) {
            const testLine = currentLine + (currentLine ? ' ' : '') + word;
            const metrics = ctx.measureText(testLine);
            
            if (metrics.width > maxWidth && currentLine) {
                lines.push(currentLine);
                currentLine = word;
            } else {
                currentLine = testLine;
            }
        }
        if (currentLine) {
            lines.push(currentLine);
        }

        // Render lines
        const lineHeight = this.fontSize + 4; // Increased line height for better readability
        const startY = this.y + this.height / 2 - (lines.length - 1) * lineHeight / 2;

        lines.forEach((line, index) => {
            ctx.fillText(
                line,
                this.x + this.width / 2,
                startY + index * lineHeight
            );
        });
    }

    /**
     * Renders image content
     * @param {CanvasRenderingContext2D} ctx - Canvas rendering context
     * @private
     */
    renderImage(ctx) {
        if (this.imageLoaded && this.imageElement) {
            // Draw image centered in the object bounds
            const imgX = this.x + (this.width - this.width) / 2;
            const imgY = this.y + (this.height - this.height) / 2;
            
            ctx.drawImage(
                this.imageElement,
                this.x + 5, // Small padding
                this.y + 5,
                this.width - 10,
                this.height - 10
            );
        } else {
            // Show loading text or fallback
            ctx.fillStyle = this.displayColor;
            ctx.font = `${this.fontSize}px ${this.fontFamily}`;
            ctx.textAlign = 'center';
            ctx.textBaseline = 'middle';
            
            const loadingText = this.imageLoaded ? '[IMG]' : 'Loading...';
            ctx.fillText(
                loadingText,
                this.x + this.width / 2,
                this.y + this.height / 2
            );
        }
    }

    /**
     * Renders code content with syntax highlighting
     * @param {CanvasRenderingContext2D} ctx - Canvas rendering context
     * @private
     */
    renderCode(ctx) {
        ctx.fillStyle = this.displayColor;
        ctx.font = `${this.fontSize - 4}px ${this.fontFamily}`; // Slightly smaller for code but still readable
        ctx.textAlign = 'left';
        ctx.textBaseline = 'top';

        // Simple syntax highlighting for code
        const lines = this.contentText.split('\n');
        const lineHeight = this.fontSize + 2; // Increased line height for better readability
        const padding = 10; // Increased padding for larger objects

        lines.forEach((line, index) => {
            const y = this.y + padding + index * lineHeight;
            
            // Basic syntax highlighting
            if (line.includes('function') || line.includes('class') || line.includes('const') || line.includes('let')) {
                ctx.fillStyle = '#569CD6'; // Blue for keywords
            } else if (line.includes('//') || line.includes('/*')) {
                ctx.fillStyle = '#6A9955'; // Green for comments
            } else if (line.includes('"') || line.includes("'")) {
                ctx.fillStyle = '#CE9178'; // Orange for strings
            } else {
                ctx.fillStyle = this.displayColor;
            }

            // Truncate line if too long
            let displayLine = line;
            const maxWidth = this.width - padding * 2;
            while (ctx.measureText(displayLine).width > maxWidth && displayLine.length > 0) {
                displayLine = displayLine.slice(0, -1);
            }
            if (displayLine !== line && displayLine.length > 3) {
                displayLine = displayLine.slice(0, -3) + '...';
            }

            ctx.fillText(displayLine, this.x + padding, y);
        });
    }

    /**
     * Checks if a mouse click hits this object
     * @param {number} mouseX - Mouse X coordinate
     * @param {number} mouseY - Mouse Y coordinate
     * @returns {boolean} True if click hits this object
     */
    isClicked(mouseX, mouseY) {
        return this.isActive &&
               mouseX >= this.x &&
               mouseX <= this.x + this.width &&
               mouseY >= this.y &&
               mouseY <= this.y + this.height;
    }

    /**
     * Blocks/destroys this object (called when clicked)
     * @returns {boolean} True if object was successfully blocked
     */
    block() {
        if (!this.isActive) return false;
        
        this.isActive = false;
        return true;
    }

    /**
     * Destroys the object (called when reaching screen bottom)
     */
    destroy() {
        this.isActive = false;
        
        // Clean up image element if it exists
        if (this.imageElement) {
            this.imageElement.onload = null;
            this.imageElement.onerror = null;
            this.imageElement = null;
        }
    }

    /**
     * Checks if object has reached the bottom of the screen
     * @param {number} screenHeight - Height of the game screen
     * @returns {boolean} True if object is below screen
     */
    hasReachedBottom(screenHeight) {
        return this.y > screenHeight;
    }

    /**
     * Gets the center position of the object
     * @returns {{x: number, y: number}} Center coordinates
     */
    getCenter() {
        return {
            x: this.x + this.width / 2,
            y: this.y + this.height / 2
        };
    }

    /**
     * Gets the bounding box of the object
     * @returns {{x: number, y: number, width: number, height: number}} Bounding box
     */
    getBounds() {
        return {
            x: this.x,
            y: this.y,
            width: this.width,
            height: this.height
        };
    }

    /**
     * Checks if this object is active
     * @returns {boolean} True if object is active
     */
    isObjectActive() {
        return this.isActive;
    }

    /**
     * Sets the movement speed of the object
     * @param {number} speed - New movement speed
     */
    setMovementSpeed(speed) {
        this.movementSpeed = Math.max(0, speed);
    }

    /**
     * Gets information about this object for debugging
     * @returns {Object} Debug information
     */
    getDebugInfo() {
        return {
            position: { x: this.x, y: this.y },
            dimensions: { width: this.width, height: this.height },
            contentType: this.contentType,
            isCorrupted: this.isCorrupted,
            isActive: this.isActive,
            movementSpeed: this.movementSpeed
        };
    }
}