# Changelog

All notable changes to this project will be documented in this file.

## [0.2.1] - 2025-10-28

### Fixed
- Production deployment MIME type errors by implementing flexible base path configuration
- Added environment-specific build commands (`build:github`, `build:local`)

### Technical
- Enhanced Vite configuration with `VITE_BASE_PATH` environment variable support
- Added deployment documentation and troubleshooting guide

## [0.2.0] - 2025-10-28

### Added
- Enhanced pause mode with free camera movement
- Screenshot capture functionality during pause (JPG format for mobile compatibility)
- Version display in menu footer (v0.2.0)
- Camera movement controls (rotate, pan, zoom) when paused in third-person view
- Device-adaptive pause control instructions (desktop vs mobile/touch)
- Web Share API integration for mobile screenshot sharing
- Mobile app evolution strategy documentation

### Changed
- Removed blurry overlay from pause screen for cleaner experience
- Restricted camera view switching during active gameplay to prevent conflicts
- Improved mobile gamepad controls to prevent double-tap issues
- Updated FOLLOW and FIRST_PERSON camera modes to show only left/right controls
- Optimized screenshot quality and format (JPG with 85% quality)
- Enhanced mobile screenshot compatibility with multiple fallback methods

### Fixed
- Mobile UI gamepad double left turn issue
- Incorrect up/down arrow display in FOLLOW camera mode
- Build process compatibility with ES modules
- Asset organization and loading for both local and production deployments
- React Three Fiber hook usage outside Canvas component
- Screenshot quality preservation with all post-processing effects

### Technical
- Refactored screenshot functionality to work within React Three Fiber Canvas
- Added OrbitControls integration for pause mode camera freedom
- Improved build pipeline with post-build asset organization script
- Enhanced Canvas configuration with preserveDrawingBuffer for better screenshots
- Centralized version management in constants/version.ts
- Added comprehensive mobile app migration documentation

