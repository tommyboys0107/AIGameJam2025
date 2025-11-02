---
inclusion: always
---

# Project Structure & Architecture Guidelines

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
- GameManager acts as central coordinator and should be modified for game flow changes
- Clear separation of concerns - don't mix manager responsibilities
- Always use dependency injection between managers

### Configuration-Driven Design
- Game balance stored in JSON files in `/data/` - modify these for gameplay tweaks
- Content separated from code logic - add new content via JSON, not hardcoded
- Configuration changes don't require code restarts in development

### Module System
- ES6 imports/exports for clean dependencies
- **CRITICAL**: No circular dependencies allowed - will break module loading
- Each file has single responsibility - don't add unrelated functionality
- Import paths must be relative (e.g., `./GameManager.js`, `../core/constants.js`)

### Canvas-Based Rendering
- Single canvas element for game area - don't create multiple canvases
- HTML/CSS for UI overlays and menus - keep game logic separate from UI
- Canvas context is shared - coordinate drawing operations through managers

## Code Style Rules

### File Organization
- **Classes**: One class per file, filename matches class name
- **Utilities**: Group related functions in single files
- **Constants**: All game constants in `js/core/constants.js`
- **Exports**: Use named exports, avoid default exports for consistency

### Naming Conventions
- **Classes**: PascalCase (e.g., `GameManager`, `ContentProvider`)
- **Files**: PascalCase for classes, camelCase for utilities
- **Constants**: UPPER_SNAKE_CASE in constants.js
- **Methods**: camelCase with descriptive names
- **Variables**: camelCase, avoid abbreviations
- **CSS**: kebab-case with BEM-like structure for components

### Development Guidelines
- Always check for existing functionality before adding new features
- Use object pooling for frequently created/destroyed objects (see InformationObjectPool)
- Prefer composition over inheritance
- Keep methods focused and under 50 lines when possible
- Add JSDoc comments for public methods and complex logic