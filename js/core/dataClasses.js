// Data classes and configuration objects for Human Firewall game

import { ContentType } from './constants.js';

/**
 * Information Object Data class
 * Represents the data structure for information objects flowing through the system
 */
export class InformationObjectData {
    constructor(contentType, contentText = '', contentImage = null, isCorrupted = false, corruptionSeverity = 0, displayColor = '#FFFFFF') {
        this.contentType = contentType;
        this.contentText = contentText;
        this.contentImage = contentImage;
        this.isCorrupted = isCorrupted;
        this.corruptionSeverity = corruptionSeverity;
        this.displayColor = displayColor;
    }
}

/**
 * Corruption Metrics class
 * Tracks player performance and system integrity
 */
export class CorruptionMetrics {
    constructor() {
        this.currentCorruption = 0;
        this.correctBlocks = 0;
        this.missedCorrupted = 0;
        this.falsePositives = 0;
    }

    get accuracy() {
        const total = this.correctBlocks + this.missedCorrupted + this.falsePositives;
        return total > 0 ? this.correctBlocks / total : 0;
    }

    reset() {
        this.currentCorruption = 0;
        this.correctBlocks = 0;
        this.missedCorrupted = 0;
        this.falsePositives = 0;
    }
}

/**
 * Phase Settings class
 * Configuration for game phase management
 */
export class PhaseSettings {
    constructor(phaseDuration = 15000, maxGameDuration = 120000, difficultyIncreaseRate = 1.2) {
        this.phaseDuration = phaseDuration;
        this.maxGameDuration = maxGameDuration;
        this.difficultyIncreaseRate = difficultyIncreaseRate;
    }
}

/**
 * Spawn Settings class
 * Configuration for object spawning behavior
 */
export class SpawnSettings {
    constructor(baseSpawnIntervalMin = 1800, baseSpawnIntervalMax = 2800, maxConcurrentObjects = 8, movementSpeed = 2.0) {
        this.baseSpawnIntervalMin = baseSpawnIntervalMin;
        this.baseSpawnIntervalMax = baseSpawnIntervalMax;
        this.maxConcurrentObjects = maxConcurrentObjects;
        this.movementSpeed = movementSpeed;
    }
}