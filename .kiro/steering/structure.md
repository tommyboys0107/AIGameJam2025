# Project Structure

## Root Directory Organization
```
AIGJ2025/
├── Assets/                 # All game assets and content
├── Library/               # Unity-generated cache (ignore in VCS)
├── Logs/                  # Unity editor and build logs
├── Packages/              # Package Manager configuration
├── ProjectSettings/       # Unity project configuration
├── Temp/                  # Temporary Unity files (ignore in VCS)
├── UserSettings/          # User-specific Unity settings
└── AIGJ2025.sln          # Visual Studio solution file
```

## Assets Folder Structure
```
Assets/
├── Scenes/                # Unity scene files
│   └── SampleScene.unity  # Default/main scene
├── Settings/              # Rendering and project settings
│   ├── Scenes/           # Scene-specific settings
│   ├── Renderer2D.asset  # 2D renderer configuration
│   └── UniversalRP.asset # URP pipeline settings
├── DefaultVolumeProfile.asset        # Post-processing settings
├── InputSystem_Actions.inputactions  # Input action definitions
└── UniversalRenderPipelineGlobalSettings.asset
```

## Naming Conventions
- **Scenes**: Use descriptive names (e.g., `MainMenu.unity`, `Level01.unity`)
- **Scripts**: PascalCase for classes and public members
- **Assets**: Descriptive names with type suffixes where appropriate
- **Folders**: PascalCase for organization

## Asset Organization Guidelines
- **Scripts**: Place in `Assets/Scripts/` with subfolders by system
- **Art Assets**: Organize by type (`Sprites/`, `Materials/`, `Textures/`)
- **Audio**: Place in `Assets/Audio/` with subfolders (`Music/`, `SFX/`)
- **Prefabs**: Store in `Assets/Prefabs/` organized by category
- **Resources**: Use `Assets/Resources/` sparingly for runtime loading

## Configuration Files
- **Input Actions**: `InputSystem_Actions.inputactions` - centralized input definitions
- **URP Settings**: `Settings/UniversalRP.asset` - rendering pipeline configuration
- **Volume Profile**: `DefaultVolumeProfile.asset` - post-processing effects
- **Package Dependencies**: `Packages/manifest.json` - package management

## Development Workflow
1. **Scene Management**: Keep scenes in `Assets/Scenes/` with descriptive names
2. **Asset Import**: Use appropriate import settings for 2D sprites and textures
3. **Input System**: Modify `InputSystem_Actions.inputactions` for new controls
4. **Rendering**: Configure URP settings in `Settings/` folder for optimal 2D performance
5. **Testing**: Use Unity Test Framework for both edit-mode and play-mode tests

## Version Control Considerations
- **Include**: Assets/, ProjectSettings/, Packages/
- **Exclude**: Library/, Temp/, Logs/, UserSettings/ (except Search.settings)