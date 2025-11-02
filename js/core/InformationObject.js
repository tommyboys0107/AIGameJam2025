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
        
        // Set base dimensions based on content type
        if (data.contentType === ContentType.IMAGE) {
            this.baseWidth = 200;   // Larger base width for images
            this.baseHeight = 150;  // Larger base height for images
        } else {
            this.baseWidth = 280;   // Base width for text/code
            this.baseHeight = 140;  // Base height for text/code
        }
        this.width = this.baseWidth;
        this.height = this.baseHeight;
        
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
        this.borderColor = '#00BFFF'; // Neutral cyan border for all objects
        this.backgroundColor = 'rgba(0, 0, 0, 0.8)';
        
        // Animation properties for corruption effects
        this.flickerTimer = 0;
        this.flickerSpeed = 0; // Remove flicker effect to avoid visual hints
        
        // Image loading state (for image content)
        this.imageLoaded = false;
        this.imageElement = null;
        this.originalImageWidth = 0;
        this.originalImageHeight = 0;
        
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
        if (!this.contentImage) {
            console.error('No image path provided for image content');
            this.fallbackToText();
            return;
        }

        console.log(`🖼️ Starting image load: ${this.contentImage}`);
        
        this.imageElement = new Image();
        
        // Set CORS attribute to handle cross-origin issues
        this.imageElement.crossOrigin = 'anonymous';
        
        // Set up load success handler
        this.imageElement.onload = () => {
            this.imageLoaded = true;
            this.originalImageWidth = this.imageElement.naturalWidth;
            this.originalImageHeight = this.imageElement.naturalHeight;
            
            console.log(`✅ Image loaded successfully: ${this.contentImage} (${this.originalImageWidth}x${this.originalImageHeight})`);
            
            // Adjust object dimensions based on image aspect ratio
            this.adjustDimensionsForImage();
        };
        
        // Set up error handler with detailed logging
        this.imageElement.onerror = (error) => {
            console.error(`❌ Failed to load image: ${this.contentImage}`);
            console.error('Error details:', {
                type: error.type,
                target: error.target,
                currentSrc: this.imageElement.currentSrc,
                naturalWidth: this.imageElement.naturalWidth,
                naturalHeight: this.imageElement.naturalHeight
            });
            this.fallbackToText();
        };
        
        // Set up abort handler
        this.imageElement.onabort = () => {
            console.warn(`⚠️ Image load aborted: ${this.contentImage}`);
            this.fallbackToText();
        };
        
        // Add timeout for slow loading images (reduced to 5 seconds)
        const loadTimeout = setTimeout(() => {
            if (!this.imageLoaded) {
                console.warn(`⏰ Image load timeout: ${this.contentImage}`);
                this.fallbackToText();
            }
        }, 5000); // 5 second timeout
        
        // Clear timeout when image loads
        const originalOnload = this.imageElement.onload;
        this.imageElement.onload = (e) => {
            clearTimeout(loadTimeout);
            originalOnload.call(this, e);
        };
        
        // Start loading the image with path normalization
        try {
            let imagePath = this.contentImage;
            
            // Normalize the path - ensure it's properly formatted
            if (!imagePath.startsWith('http') && !imagePath.startsWith('./') && !imagePath.startsWith('/')) {
                // If it's a relative path without proper prefix, ensure it starts correctly
                if (!imagePath.startsWith('assets/')) {
                    imagePath = 'assets/images/' + imagePath;
                }
            }
            
            console.log(`📂 Normalized image path: ${imagePath}`);
            this.imageElement.src = imagePath;
            
        } catch (error) {
            console.error(`❌ Error setting image src: ${this.contentImage}`, error);
            this.fallbackToText();
        }
    }

    /**
     * Fallback to text rendering when image fails
     * @private
     */
    fallbackToText() {
        console.log(`🔄 Falling back to text for: ${this.contentImage}`);
        this.contentType = ContentType.TEXT;
        this.contentText = this.isCorrupted ? '[CORRUPTED IMAGE]' : '[IMAGE]';
        this.imageLoaded = false;
        
        // Clean up image element
        if (this.imageElement) {
            this.imageElement.onload = null;
            this.imageElement.onerror = null;
            this.imageElement.onabort = null;
            this.imageElement = null;
        }
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
            default:
                // Fallback to text rendering for unknown types
                this.renderText(ctx);
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
     * Adjusts object dimensions to maintain image aspect ratio
     * @private
     */
    adjustDimensionsForImage() {
        if (!this.imageLoaded || !this.imageElement) return;
        
        const imageAspectRatio = this.originalImageWidth / this.originalImageHeight;
        const containerAspectRatio = this.baseWidth / this.baseHeight;
        
        // Maintain the base area while preserving aspect ratio
        if (imageAspectRatio > containerAspectRatio) {
            // Image is wider - fit to width
            this.width = this.baseWidth;
            this.height = this.baseWidth / imageAspectRatio;
        } else {
            // Image is taller - fit to height
            this.height = this.baseHeight;
            this.width = this.baseHeight * imageAspectRatio;
        }
        
        // Ensure minimum dimensions for clickability
        const minWidth = 120;
        const minHeight = 80;
        
        if (this.width < minWidth) {
            const scale = minWidth / this.width;
            this.width = minWidth;
            this.height *= scale;
        }
        
        if (this.height < minHeight) {
            const scale = minHeight / this.height;
            this.height = minHeight;
            this.width *= scale;
        }
        
        console.log(`📐 Adjusted dimensions for image: ${this.width.toFixed(0)}x${this.height.toFixed(0)} (original: ${this.originalImageWidth}x${this.originalImageHeight})`);
    }

    /**
     * Renders image content
     * @param {CanvasRenderingContext2D} ctx - Canvas rendering context
     * @private
     */
    renderImage(ctx) {
        if (this.imageLoaded && this.imageElement) {
            try {
                const padding = 8;
                const availableWidth = this.width - (padding * 2);
                const availableHeight = this.height - (padding * 2);
                
                // Calculate the best fit for the image while maintaining aspect ratio
                const imageAspectRatio = this.originalImageWidth / this.originalImageHeight;
                const containerAspectRatio = availableWidth / availableHeight;
                
                let drawWidth, drawHeight, drawX, drawY;
                
                if (imageAspectRatio > containerAspectRatio) {
                    // Image is wider - fit to width
                    drawWidth = availableWidth;
                    drawHeight = availableWidth / imageAspectRatio;
                    drawX = this.x + padding;
                    drawY = this.y + padding + (availableHeight - drawHeight) / 2;
                } else {
                    // Image is taller - fit to height
                    drawHeight = availableHeight;
                    drawWidth = availableHeight * imageAspectRatio;
                    drawX = this.x + padding + (availableWidth - drawWidth) / 2;
                    drawY = this.y + padding;
                }
                
                // Draw the image with correct aspect ratio
                ctx.drawImage(
                    this.imageElement,
                    drawX,
                    drawY,
                    drawWidth,
                    drawHeight
                );
                
                // Add debug border for images (optional, can be removed)
                if (window.DEBUG_IMAGES) {
                    ctx.strokeStyle = this.isCorrupted ? '#FF4444' : '#00FF41';
                    ctx.lineWidth = 2;
                    ctx.strokeRect(drawX, drawY, drawWidth, drawHeight);
                }
                
            } catch (error) {
                console.error(`Error rendering image: ${this.contentImage}`, error);
                this.renderImageFallback(ctx);
            }
        } else {
            this.renderImageFallback(ctx);
        }
    }

    /**
     * Renders fallback content when image is not available
     * @param {CanvasRenderingContext2D} ctx - Canvas rendering context
     * @private
     */
    renderImageFallback(ctx) {
        ctx.fillStyle = this.displayColor;
        ctx.font = `${this.fontSize}px ${this.fontFamily}`;
        ctx.textAlign = 'center';
        ctx.textBaseline = 'middle';
        
        let displayText;
        if (this.contentType === ContentType.TEXT) {
            // Already fell back to text
            displayText = this.contentText;
        } else if (this.imageLoaded) {
            displayText = '[IMG]';
        } else {
            // Show loading or error state
            if (this.imageElement && this.imageElement.src) {
                displayText = 'Loading...';
            } else {
                displayText = 'Image Error';
            }
        }
        
        // Add debug info if enabled
        if (window.DEBUG_IMAGES) {
            displayText += `\n${this.contentImage || 'No path'}`;
            if (this.imageElement) {
                displayText += `\nSrc: ${this.imageElement.src}`;
                displayText += `\nComplete: ${this.imageElement.complete}`;
                displayText += `\nNatural: ${this.imageElement.naturalWidth}x${this.imageElement.naturalHeight}`;
            }
        }
        
        const lines = displayText.split('\n');
        const lineHeight = this.fontSize + 4;
        const startY = this.y + this.height / 2 - (lines.length - 1) * lineHeight / 2;
        
        lines.forEach((line, index) => {
            ctx.fillText(
                line,
                this.x + this.width / 2,
                startY + index * lineHeight
            );
        });
        
        // Add visual indicator for image loading state
        if (this.contentType === ContentType.IMAGE) {
            const indicatorSize = 10;
            const indicatorX = this.x + this.width - indicatorSize - 5;
            const indicatorY = this.y + 5;
            
            if (this.imageLoaded) {
                // Green circle for loaded
                ctx.fillStyle = '#00FF41';
            } else if (this.imageElement && this.imageElement.src) {
                // Yellow circle for loading
                ctx.fillStyle = '#FFA500';
            } else {
                // Red circle for error
                ctx.fillStyle = '#FF4444';
            }
            
            ctx.beginPath();
            ctx.arc(indicatorX + indicatorSize/2, indicatorY + indicatorSize/2, indicatorSize/2, 0, Math.PI * 2);
            ctx.fill();
        }
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