# Feature Request: Enhanced Tron Grid Lines

## Overview
Enhance the existing arena grid system to provide a more authentic classic Tron aesthetic with optional visibility controls.

## Current State
- **Existing**: Two-layer grid system using `@react-three/drei` Grid component
- **Main grid**: 1-unit cells with 5-unit sections (cyan #00aaaa)
- **Fine grid**: 0.25-unit cells (disabled due to performance issues)
- **Issue**: Fine grid caused GPU stress (160K lines), currently commented out

## Requirements

### Core Enhancement
- **Perspective Grid Effect**: Add subtle perspective distortion to grid lines that recede toward horizon
- **Tron Aesthetic**: Enhance visual style with:
  - Brighter neon glow effect
  - Subtle pulsing animation on major grid lines
  - Optional flowing energy effect along section lines

### User Control
- **Settings Toggle**: Add checkbox in UI to show/hide grid overlay
- **Default**: Grid visible by default
- **Performance**: Ensure toggle provides immediate visual feedback

### Technical Implementation
- **Reuse Existing**: Build upon current Grid component in `Arena.tsx:175-186`
- **Performance Safe**: Maintain current cell/section structure to avoid GPU issues
- **Animation**: Use `useFrame` for subtle effects, avoid expensive operations

## Acceptance Criteria

### Visual
- [ ] Grid maintains current performance (no fine grid resurrection)
- [ ] Enhanced glow effect visible against dark arena floor
- [ ] Optional subtle animation doesn't cause frame drops
- [ ] Grid perspective effect enhances 3D depth perception

### Functional
- [ ] Toggle in settings menu (suggest adding to speed/camera controls area)
- [ ] Setting persists between game sessions (localStorage)
- [ ] Immediate toggle response (no lag)
- [ ] Default state: enabled

### Technical
- [ ] No impact on existing WebGL stability
- [ ] Compatible with current lighting system
- [ ] Maintains arena performance profile
- [ ] Uses existing Grid component architecture

## Implementation Notes

### Suggested Approach
1. **Enhance existing grid** in `Arena.tsx` rather than adding new component
2. **Add CSS/material effects** for glow enhancement
3. **Simple toggle state** managed in App.tsx alongside other settings
4. **Animation via useFrame** with low-cost operations only

### Files to Modify
- `components/Arena.tsx` - Grid visual enhancements
- `App.tsx` - Add grid toggle state
- `components/UI.tsx` - Add toggle control (if settings menu exists)

### Performance Constraints
- **No fine grid**: Keep disabled to prevent GPU crashes
- **Animation budget**: Max 1-2ms per frame for grid effects
- **Memory safe**: No new geometries, reuse existing Grid props

## Priority
**Medium** - Visual enhancement that adds to game atmosphere without affecting core gameplay.
