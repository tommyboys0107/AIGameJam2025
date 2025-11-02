---
inclusion: always
---

# Technology Stack & Development Guidelines

## Core Technologies
- **Vanilla JavaScript ES6+**: No frameworks, libraries, or build tools
- **ES6 Modules**: Use relative imports (`./`, `../`) - avoid absolute paths
- **HTML5 Canvas**: Single canvas for game rendering, HTML/CSS for UI overlays
- **CSS3**: Custom properties, Grid, Flexbox - no preprocessors
- **JSON Configuration**: All game data externalized to `/data/` directory

## Critical Technical Constraints
- **No Build System**: Code must run directly in browser without compilation
- **No External Dependencies**: No npm packages, CDNs, or third-party libraries
- **Module Loading**: Must serve via HTTP/HTTPS (not file://) for ES6 modules
- **Single Canvas**: One canvas element shared across all game rendering
- **Async Loading**: Use Fetch API for JSON configs, handle loading states

## Code Architecture Rules
- **Manager Pattern**: Each system has dedicated manager class (GameManager, PhaseManager, etc.)
- **No Circular Dependencies**: Will break ES6 module loading - design carefully
- **Object Pooling**: Use InformationObjectPool for frequently created objects
- **Configuration-Driven**: Modify JSON files for balance changes, not hardcoded values
- **Canvas Context Sharing**: Coordinate all drawing through managers, no direct canvas access

## File Import Patterns
```javascript
// Correct relative imports
import { GameManager } from './GameManager.js';
import { GAME_STATES } from '../core/constants.js';

// Always include .js extension
// Use named exports, avoid default exports
```

## Development Setup
```bash
# Required: Local server for ES6 modules
python -m http.server 8000
# or
npx serve .
# or VS Code Live Server extension

# No build, compile, or bundle steps
# Direct browser execution only
```

## Performance Guidelines
- Target 60fps gameplay with smooth canvas rendering
- Minimize DOM manipulation during gameplay
- Use requestAnimationFrame for game loop
- Preload assets during initialization phase
- Implement efficient collision detection and object pooling