/**
 * ConfigLoader - Handles loading and managing all game configuration files
 */
class ConfigLoader {
    constructor() {
        this.configs = {};
        this.loaded = false;
    }

    /**
     * Load all configuration files
     * @returns {Promise<boolean>} Success status
     */
    async loadAllConfigs() {
        try {
            const configFiles = [
                { key: 'settings', path: 'data/settings.json' },
                { key: 'phases', path: 'data/phaseConfig.json' },
                { key: 'balance', path: 'data/balanceConfig.json' },
                { key: 'textContent', path: 'data/textContent.json' },
                { key: 'imageContent', path: 'data/imageContent.json' },
                { key: 'codeContent', path: 'data/codeContent.json' }
            ];

            const loadPromises = configFiles.map(config => 
                this.loadConfig(config.key, config.path)
            );

            await Promise.all(loadPromises);
            this.loaded = true;
            console.log('All configuration files loaded successfully');
            return true;
        } catch (error) {
            console.error('Failed to load configuration files:', error);
            return false;
        }
    }

    /**
     * Load a specific configuration file
     * @param {string} key - Configuration key
     * @param {string} path - File path
     * @returns {Promise<Object>} Configuration object
     */
    async loadConfig(key, path) {
        try {
            const response = await fetch(path);
            if (!response.ok) {
                throw new Error(`Failed to load ${path}: ${response.statusText}`);
            }
            const config = await response.json();
            this.configs[key] = config;
            return config;
        } catch (error) {
            console.error(`Error loading config ${key} from ${path}:`, error);
            // Provide fallback configurations for critical settings
            this.configs[key] = this.getFallbackConfig(key);
            return this.configs[key];
        }
    }

    /**
     * Get configuration by key
     * @param {string} key - Configuration key
     * @returns {Object} Configuration object
     */
    getConfig(key) {
        if (!this.loaded) {
            console.warn('Configurations not loaded yet');
        }
        return this.configs[key] || {};
    }

    /**
     * Get a specific setting value with dot notation
     * @param {string} path - Dot notation path (e.g., 'settings.gameSettings.maxGameDuration')
     * @param {*} defaultValue - Default value if not found
     * @returns {*} Setting value
     */
    getSetting(path, defaultValue = null) {
        const parts = path.split('.');
        let current = this.configs;
        
        for (const part of parts) {
            if (current && typeof current === 'object' && part in current) {
                current = current[part];
            } else {
                return defaultValue;
            }
        }
        
        return current;
    }

    /**
     * Get fallback configuration for critical systems
     * @param {string} key - Configuration key
     * @returns {Object} Fallback configuration
     */
    getFallbackConfig(key) {
        const fallbacks = {
            settings: {
                gameSettings: {
                    maxGameDuration: 120,
                    phaseDuration: 15,
                    difficultyIncreaseRate: 1.2
                },
                spawnSettings: {
                    baseSpawnIntervalMin: 0.5,
                    baseSpawnIntervalMax: 1.0,
                    maxConcurrentObjects: 15,
                    movementSpeed: 2.0
                },
                corruptionSettings: {
                    maxCorruption: 100,
                    corruptionThresholds: { gameOver: 100 },
                    corruptionPenalties: {
                        missedCorrupted: 15,
                        falsePositive: 10
                    }
                }
            },
            textContent: {
                legitimate: ['System operational'],
                corrupted: ['System 0p3r@t!0n@l']
            },
            imageContent: {
                legitimate: ['assets/images/placeholder.png'],
                corrupted: ['assets/images/placeholder_corrupted.png']
            },
            codeContent: {
                legitimate: ['function test() { return true; }'],
                corrupted: ['function test() { return true }']
            }
        };
        
        return fallbacks[key] || {};
    }

    /**
     * Validate configuration integrity
     * @returns {boolean} Validation result
     */
    validateConfigs() {
        const requiredConfigs = ['settings', 'textContent', 'imageContent', 'codeContent'];
        const requiredSettings = [
            'settings.gameSettings.maxGameDuration',
            'settings.spawnSettings.baseSpawnIntervalMin',
            'settings.corruptionSettings.maxCorruption'
        ];

        // Check required configs exist
        for (const config of requiredConfigs) {
            if (!this.configs[config]) {
                console.error(`Missing required configuration: ${config}`);
                return false;
            }
        }

        // Check required settings exist
        for (const setting of requiredSettings) {
            if (this.getSetting(setting) === null) {
                console.error(`Missing required setting: ${setting}`);
                return false;
            }
        }

        console.log('Configuration validation passed');
        return true;
    }

    /**
     * Get current difficulty settings based on phase and progression
     * @param {number} currentPhase - Current phase index
     * @param {number} cycleCount - Number of completed cycles
     * @returns {Object} Difficulty settings
     */
    getCurrentDifficultySettings(currentPhase = 0, cycleCount = 0) {
        const phases = this.getSetting('phases.phases', []);
        const progression = this.getSetting('phases.progressionRules', {});
        
        if (phases.length === 0) {
            return this.getSetting('settings.spawnSettings', {});
        }

        const basePhase = phases[currentPhase % phases.length];
        const difficultyMultiplier = Math.pow(
            progression.difficultyMultiplierPerCycle || 1.2, 
            cycleCount
        );

        return {
            spawnRate: (basePhase.difficulty?.spawnRate || 1.0) * difficultyMultiplier,
            movementSpeed: (basePhase.difficulty?.movementSpeed || 1.0) * difficultyMultiplier,
            corruptionProbability: Math.min(
                (basePhase.difficulty?.corruptionProbability || 0.3) + (cycleCount * 0.05),
                0.7
            )
        };
    }
}

// Export for use in other modules
window.ConfigLoader = ConfigLoader;