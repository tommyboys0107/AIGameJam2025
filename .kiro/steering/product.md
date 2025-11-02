---
inclusion: always
---

# Human Firewall - Product Guidelines

A cyberpunk-themed browser game where players act as human operators in a content classification system. Players must identify and block AI-generated content while allowing legitimate content to pass through, preventing system corruption.

## Core Game Mechanics
- **Objective**: Block AI-generated content, allow legitimate content
- **Input**: Single click/tap to block suspicious items
- **Timing**: 2-minute sessions with escalating difficulty
- **Phases**: Code → Art (images) → Text content types
- **Failure States**: Corruption overload (>100%), time expiration

## Visual Design Principles
- **Color Scheme**: Neon green (#00ff41) on dark backgrounds
- **Typography**: Monospace fonts for terminal aesthetic
- **Effects**: Glitch animations, scanlines, CRT-style distortion
- **Layout**: Canvas-based game area with HTML/CSS UI overlays
- **Responsiveness**: Dynamic canvas sizing, mobile-friendly controls

## Content Classification Rules
- **AI-Generated Indicators**: Repetitive patterns, unnatural syntax, generic phrasing
- **Legitimate Content**: Natural variations, human-like imperfections, contextual relevance
- **Difficulty Scaling**: Increase ambiguity and speed through phases
- **Balance**: ~70% legitimate content, ~30% AI-generated per phase

## User Experience Guidelines
- **Feedback**: Immediate visual/audio response to player actions
- **Progression**: Clear phase transitions with visual cues
- **Accessibility**: High contrast, clear visual hierarchy, keyboard support
- **Performance**: Smooth 60fps gameplay, minimal input lag
- **Error Handling**: Graceful degradation, clear error messages

## Development Constraints
- **No External Dependencies**: Vanilla JavaScript only
- **Browser Compatibility**: Modern browsers with ES6 module support
- **File Size**: Keep assets optimized for web delivery
- **Loading**: Progressive loading of content, no blocking operations