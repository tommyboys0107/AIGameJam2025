# Project Structure

## Directory Organization

```
/
├── index.html              # Main entry point with game initialization
├── css/
│   └── main.css           # All game styles (cyberpunk theme)
├── js/
│   ├── core/              # Core game classes and utilities
│   │   ├── constants.js   # Game constants and enums
│   │   ├── dataClasses.js # Data structures and configuration classes
│   │   ├── ConfigLoader.js # Configuration file loader
│   │   ├── InformationObject.js # Game object representation
│   │   ├── InformationObjectPool.js # Object pooling system
│   │   └── InputHandler.js # Input event management
│   ├── managers/          # Game system managers
│   │   ├── GameManager.js # Central game coordinator
│   │   ├── PhaseManager.js # Game phase transitions
│   │   ├── DataStreamGenerator.js # Content spawning system
│   │   ├── CorruptionSystem.js # Corruption tracking
│   │   └── AudioManager.js # Sound effects
│   ├── ui/               # User interface components
│   │   ├── UIManager.js  # UI state management
│   │   ├── ScreenEffectsManager.js # Visual effects
│   │   └── VisualFeedbackSystem.js # Player feedback
│   └── content/          # Content management
│       └── ContentProvider.js # Content loading and distribution
├── data/                 # JSON configuration files
│   ├── settings.json     # Game balance and settings
│   ├── phaseConfig.json  # Phase definitions and progression
│   ├── balanceConfig.json # Difficulty scaling
│   ├── textContent.json  # Text content for classification
│   ├── imageContent.json # Image content metadata
│   └── codeContent.json  # Code snippets for classification
└── assets/              # Game assets
    ├── images/          # Game images
    ├── audio/           # Sound effects
    ├── GameBackground.jpg
    └── TitleArt.jpg
```

## Architecture Patterns

### Manager Pattern
- Each major system has a dedicated manager class
- GameManager acts as central coordinator
- Clear separation of concerns between systems

### Configuration-Driven Design
- Game balance stored in JSON files in `/data/`
- Content separated from code logic
- Easy tweaking without code changes

### Module System
- ES6 imports/exports for clean dependencies
- No circular dependencies
- Each file has single responsibility

### Canvas-Based Rendering
- Single canvas element for game area
- HTML/CSS for UI overlays and menus
- Responsive design with dynamic canvas sizing

## Naming Conventions
- **Classes**: PascalCase (e.g., `GameManager`, `ContentProvider`)
- **Files**: PascalCase for classes, camelCase for utilities
- **Constants**: UPPER_SNAKE_CASE in constants.js
- **Methods**: camelCase with descriptive names
- **CSS**: kebab-case with BEM-like structure for components