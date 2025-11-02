// Content Provider - manages content loading and distribution
// Loads content from JSON configuration files and provides content based on phase and corruption status

import { ContentType, GamePhase } from '../core/constants.js';
import { InformationObjectData } from '../core/dataClasses.js';

export class ContentProvider {
    constructor() {
        this.textContent = null;
        this.imageContent = null;
        this.isLoaded = false;
    }

    /**
     * Async method to load all content configurations from JSON files
     * @returns {Promise<void>}
     */
    async loadContent() {
        return this.loadContentConfigurations();
    }

    /**
     * Async method to load all content configurations from JSON files
     * @returns {Promise<void>}
     */
    async loadContentConfigurations() {
        try {
            console.log('🔄 Loading content configurations...');
            
            // Load all content configuration files in parallel
            const [textResponse, imageResponse] = await Promise.all([
                fetch('data/textContent.json'),
                fetch('data/imageContent.json')
            ]);

            // Check if responses are ok
            if (!textResponse.ok) {
                throw new Error(`Failed to load textContent.json: ${textResponse.status} ${textResponse.statusText}`);
            }
            if (!imageResponse.ok) {
                throw new Error(`Failed to load imageContent.json: ${imageResponse.status} ${imageResponse.statusText}`);
            }

            // Parse JSON responses
            this.textContent = await textResponse.json();
            this.imageContent = await imageResponse.json();

            console.log('📄 Text content loaded:', this.textContent);
            console.log('🖼️ Image content loaded:', this.imageContent);

            // Validate loaded content
            this.validateContent();
            
            this.isLoaded = true;
            console.log('✅ Content configurations loaded successfully');
            
            // Log image counts for debugging
            console.log(`📊 Image counts - Safe: ${this.imageContent.legitimate?.length || 0}, Corrupted: ${this.imageContent.corrupted?.length || 0}`);
            
        } catch (error) {
            console.error('❌ Failed to load content configurations:', error);
            console.log('🔄 Setting up fallback content...');
            this.setupFallbackContent();
        }
    }

    /**
     * Validates that all required content arrays exist and have content
     * @private
     */
    validateContent() {
        const requiredArrays = [
            { content: this.textContent, name: 'textContent' },
            { content: this.imageContent, name: 'imageContent' }
        ];

        for (const { content, name } of requiredArrays) {
            if (!content || !content.legitimate || !content.corrupted) {
                throw new Error(`Invalid ${name}: missing legitimate or corrupted arrays`);
            }
            if (content.legitimate.length === 0 || content.corrupted.length === 0) {
                throw new Error(`Invalid ${name}: empty legitimate or corrupted arrays`);
            }
        }
    }

    /**
     * Sets up fallback content if loading fails
     * @private
     */
    setupFallbackContent() {
        console.warn('Using fallback content due to loading failure');
        
        this.textContent = {
            legitimate: ['System operational', 'Connection established', 'Data validated'],
            corrupted: ['System 0p3r@t!0n@l', 'Connection 3st@bl!sh3d', 'Data v@l!d@t3d']
        };

        // Use actual existing images for fallback
        this.imageContent = {
            legitimate: [
                'assets/images/Safe1.jpg',
                'assets/images/Safe2.jpg',
                'assets/images/Safe3.jpg'
            ],
            corrupted: [
                'assets/images/Corrupted1.jpg',
                'assets/images/Corrupted2.jpg',
                'assets/images/Corrupted3.jpg'
            ]
        };

        this.isLoaded = true;
        console.log('Fallback content setup with existing image paths');
    }

    /**
     * Retrieves random content based on current phase and corruption status
     * @param {string} phase - Current game phase (GamePhase enum value)
     * @param {boolean} isCorrupted - Whether to return corrupted content
     * @returns {InformationObjectData} Content object for the information object
     */
    getRandomContent(phase, isCorrupted = false) {
        if (!this.isLoaded) {
            console.warn('Content not loaded, using fallback');
            this.setupFallbackContent();
        }

        let contentType;
        let contentArray;
        let contentText = '';
        let contentImage = null;

        // Determine content type based on phase
        switch (phase) {
            case GamePhase.TEXT:
                contentType = ContentType.TEXT;
                contentArray = isCorrupted ? this.textContent.corrupted : this.textContent.legitimate;
                contentText = this.getRandomFromArray(contentArray);
                break;
            
            case GamePhase.ART:
                contentType = ContentType.IMAGE;
                contentArray = isCorrupted ? this.imageContent.corrupted : this.imageContent.legitimate;
                contentImage = this.getRandomFromArray(contentArray);
                console.log(`ContentProvider: Selected ${isCorrupted ? 'corrupted' : 'safe'} image: ${contentImage}`);
                break;
            
            default:
                console.warn(`Unknown phase: ${phase}, defaulting to TEXT`);
                contentType = ContentType.TEXT;
                contentArray = isCorrupted ? this.textContent.corrupted : this.textContent.legitimate;
                contentText = this.getRandomFromArray(contentArray);
        }

        // Use neutral color for all content to avoid visual hints
        const displayColor = '#00BFFF'; // Cyan color for all content

        const objectData = new InformationObjectData(
            contentType,
            contentText,
            contentImage,
            isCorrupted,
            isCorrupted ? Math.random() * 0.5 + 0.5 : 0, // Corruption severity 0.5-1.0 for corrupted, 0 for legitimate
            displayColor
        );
        
        console.log(`ContentProvider: Created object data - Type: ${contentType}, Image: ${contentImage}, Corrupted: ${isCorrupted}`);
        return objectData;
    }

    /**
     * Gets a random element from an array
     * @param {Array} array - Array to select from
     * @returns {*} Random element from the array
     * @private
     */
    getRandomFromArray(array) {
        if (!array || array.length === 0) {
            console.warn('Empty array provided to getRandomFromArray');
            return '';
        }
        return array[Math.floor(Math.random() * array.length)];
    }

    /**
     * Gets content for a specific content type and corruption status
     * @param {string} contentType - ContentType enum value
     * @param {boolean} isCorrupted - Whether to return corrupted content
     * @returns {InformationObjectData} Content object
     */
    getContentByType(contentType, isCorrupted = false) {
        if (!this.isLoaded) {
            console.warn('Content not loaded, using fallback');
            this.setupFallbackContent();
        }

        let contentArray;
        let contentText = '';
        let contentImage = null;

        switch (contentType) {
            case ContentType.TEXT:
                contentArray = isCorrupted ? this.textContent.corrupted : this.textContent.legitimate;
                contentText = this.getRandomFromArray(contentArray);
                break;
            
            case ContentType.IMAGE:
                contentArray = isCorrupted ? this.imageContent.corrupted : this.imageContent.legitimate;
                contentImage = this.getRandomFromArray(contentArray);
                break;
            
            default:
                console.warn(`Unknown content type: ${contentType}`);
                return null;
        }

        // Use neutral color for all content to avoid visual hints
        const displayColor = '#00BFFF'; // Cyan color for all content

        return new InformationObjectData(
            contentType,
            contentText,
            contentImage,
            isCorrupted,
            isCorrupted ? Math.random() * 0.5 + 0.5 : 0,
            displayColor
        );
    }

    /**
     * Checks if content is loaded and ready
     * @returns {boolean} True if content is loaded
     */
    isContentLoaded() {
        return this.isLoaded;
    }

    /**
     * Gets the count of available content for a specific type and corruption status
     * @param {string} contentType - ContentType enum value
     * @param {boolean} isCorrupted - Whether to count corrupted content
     * @returns {number} Number of available content items
     */
    getContentCount(contentType, isCorrupted = false) {
        if (!this.isLoaded) {
            return 0;
        }

        let contentArray;
        switch (contentType) {
            case ContentType.TEXT:
                contentArray = isCorrupted ? this.textContent.corrupted : this.textContent.legitimate;
                break;
            case ContentType.IMAGE:
                contentArray = isCorrupted ? this.imageContent.corrupted : this.imageContent.legitimate;
                break;
            default:
                return 0;
        }

        return contentArray ? contentArray.length : 0;
    }
}