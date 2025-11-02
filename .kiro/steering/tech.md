# Technology Stack

## Core Technologies
- **Frontend**: Vanilla JavaScript (ES6 modules)
- **Rendering**: HTML5 Canvas API
- **Styling**: CSS3 with custom properties
- **Architecture**: Modular ES6 class-based system
- **No Build System**: Direct browser execution, no compilation required

## Key Libraries & APIs
- Canvas 2D Context for game rendering
- Fetch API for JSON configuration loading
- Web Audio API integration (AudioManager)
- CSS Grid and Flexbox for responsive layouts

## Project Structure
- **Modular Architecture**: Separate managers for different concerns
- **ES6 Modules**: Import/export system for clean dependencies
- **Configuration-Driven**: JSON files for game balance and content
- **Component Separation**: Core, Managers, UI, and Content modules

## Development Commands
Since this is a vanilla JavaScript project with no build system:

```bash
# Serve locally (required for ES6 modules)
# Use any local server like:
python -m http.server 8000
# or
npx serve .
# or use VS Code Live Server extension

# No compilation, bundling, or build steps required
# Direct browser execution from local server
```

## Browser Requirements
- Modern browser with ES6 module support
- Canvas 2D API support
- Fetch API support
- Must be served from HTTP/HTTPS (not file://) for module loading