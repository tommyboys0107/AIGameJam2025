# Technology Stack

## Unity Engine
- **Version**: Unity 6000.2.10f1 (Unity 6)
- **Render Pipeline**: Universal Render Pipeline (URP) 17.2.0
- **Target**: 2D game development with modern rendering features

## Key Packages & Dependencies
- **Input System**: 1.14.2 (New Input System for cross-platform controls)
- **2D Animation**: 12.0.2 (Sprite animation and rigging)
- **2D Sprite Shape**: 12.0.1 (Procedural 2D shapes)
- **2D Tilemap**: 1.0.0 + Extras 5.0.1 (Level design tools)
- **Aseprite Importer**: 2.0.2 (Pixel art workflow)
- **PSD Importer**: 11.0.1 (Photoshop integration)
- **Visual Scripting**: 1.9.8 (Node-based scripting)
- **Timeline**: 1.8.9 (Cutscenes and sequences)
- **Test Framework**: 1.6.0 (Unit and integration testing)
- **Unity MCP**: Custom package for Model Context Protocol integration

## Development Environment
- **IDE Support**: Rider 3.0.38, Visual Studio 2.0.25
- **Version Control**: Unity Collaborate Proxy 2.10.0
- **Build System**: Unity's built-in build system
- **Platform**: Windows (based on solution file format)

## Common Commands
Since this is a Unity project, most operations are performed through the Unity Editor:

### Unity Editor Operations
- **Play Mode**: Use Unity Editor play button or `Ctrl+P`
- **Build**: File → Build Settings → Build
- **Package Manager**: Window → Package Manager
- **Console**: Window → General → Console

### Testing
- **Run Tests**: Window → General → Test Runner
- **Edit Mode Tests**: Test Runner → EditMode tab
- **Play Mode Tests**: Test Runner → PlayMode tab

### Asset Management
- **Import Assets**: Drag files to Assets folder or Assets → Import New Asset
- **Refresh Assets**: Ctrl+R or Assets → Refresh
- **Reimport**: Right-click asset → Reimport

## Input System Configuration
The project uses Unity's new Input System with predefined action maps:
- **Player Actions**: Movement, combat, interaction controls
- **UI Actions**: Menu navigation and interface controls
- **Multi-platform bindings**: Keyboard, gamepad, touch, XR support