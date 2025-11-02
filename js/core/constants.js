// Core constants and enums for Human Firewall game

// Game phases enum
export const GamePhase = {
    CODE: 'code',
    ART: 'art', 
    TEXT: 'text'
};

// Content types enum
export const ContentType = {
    TEXT: 'text',
    IMAGE: 'image',
    CODE: 'code'
};

// Game end types enum
export const GameEndType = {
    SUCCESS: 'success',        // Survived 2 minutes
    CORRUPTION: 'corruption',  // Corruption meter maxed
    TIME_UP: 'timeUp'         // Alternative success condition
};

// Game constants
export const GAME_CONSTANTS = {
    MAX_GAME_DURATION: 120000,    // 2 minutes in milliseconds
    DEFAULT_PHASE_DURATION: 15000, // 15 seconds in milliseconds
    BASE_SPAWN_INTERVAL_MIN: 500,  // 0.5 seconds in milliseconds
    BASE_SPAWN_INTERVAL_MAX: 1000, // 1.0 seconds in milliseconds
    MAX_CONCURRENT_OBJECTS: 12,  // Reduced for larger objects
    BASE_MOVEMENT_SPEED: 1.8,  // Slightly slower for larger objects
    DIFFICULTY_INCREASE_RATE: 1.2,
    MAX_CORRUPTION: 100
};