# Changelog

All notable changes to this project will be documented in this file.

## [0.3.1] - 2025-10-29

### Changed
- Improved mobile menu screen layout to fit viewport without scrolling
- Balanced button sizing for prominence while maintaining full-screen visibility
- Tightened vertical spacing and gaps for better mobile viewport utilization
- Adjusted typography scale for comfortable mobile reading
- Refined power-up icon sizes for touch-friendliness without overwhelming the layout

## [0.3.0] - 2025-10-29

### Added
- Toggle button (🎮) for showing/hiding on-screen controls
- Device-specific mobile control layouts (phone vs tablet sizing)
- Enhanced trail proximity detection with visual spark effects
- Camera shake effects when near trails
- Professional three-point lighting system (key, fill, rim lights)

### Changed
- Mobile D-pad with improved spacing and touch responsiveness
- Camera view-specific controls (left/right only for FOLLOW/FIRST_PERSON modes)
- Enhanced collision detection accuracy matching visual trail positions
- Improved game loop performance with better time accumulation
- Better AI behavior for power-up collection and obstacle avoidance

### Fixed
- Mobile control double-tap issues with proper touch event handling
- Trail collision detection now uses correct grid positions
- OnScreenControls layout consistency across different device types
- Eliminated "FPS drop" feeling at slow speeds by removing early returns

## [0.2.2] - 2025-10-28

### Added
- High-quality 3D bike model with PBR materials and textures
- Realistic bike geometry replacing basic geometric shapes
- Python script for precise model coordinate transformation
- Enhanced visual fidelity with metallic surfaces and detailed textures
- Error boundary and fallback system for 3D model loading failures
- Automatic favicon generation in build process
- Normal mapping with full intensity for surface detail
- Ambient occlusion mapping for realistic shading

### Changed
- Replaced simple box/sphere bike geometry with detailed 3D model
- Optimized texture loading with compressed PBR material maps
- Improved player color system to work with complex materials

### Fixed
- 3D model assets now properly copied to dist/assets/models/ during build
- Added graceful fallback to basic geometry when 3D model fails to load
- Fixed missing favicon.svg in production builds
- Eliminated random hash filenames - now generates consistent index.js and index.css
- Resolved MIME type errors caused by changing asset filenames
- Corrected 3D bike model center of gravity to match original LightCycle positioning
- Fixed bike model scaling and ground positioning for consistent gameplay
- Fixed bike model floating above ground - now sits properly at y=0
- Fixed bike model backwards orientation - now faces forward with 180° rotation
- Enhanced normal mapping and material lighting response for better visual quality

### Technical
- Integrated Three.js OBJLoader for 3D model support
- Pre-processed 3D model coordinates to match game coordinate system
- Implemented dynamic material color override system
- Added random geometry attributes for derezz shader compatibility
- Simplified build pipeline to copy entire assets/ folder automatically
- Added Suspense and ErrorBoundary for robust 3D model loading
- Enhanced asset management system for future extensibility
- Configured Vite to generate consistent filenames (index.js, index.css) for better deployment reliability
- Created Python tooling for 3D model coordinate transformation and validation

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

