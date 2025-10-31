# Skybox Optimization Strategy

## Current Files Analysis
- `nebula-01-low.hdr` - 42MB
- `nebula-low-02.exr` - 48MB  
- `nebula-00-low.hdr` - 45MB
- `Free+Galaxies+8k.hdr` - 109MB ⚠️
- `Free+HDRI+8k.hdr` - 58MB

## Performance Optimization Required

### 1. Format Conversion & Compression
```bash
# Convert HDR/EXR to web-optimized cube maps
# Target: 6 faces × 512×512 = ~2-4MB total per skybox

# Using ImageMagick or similar:
convert input.hdr -resize 512x512 -quality 85 output_%d.jpg

# Or use Three.js HDR loader with compression
```

### 2. Resolution Strategy
- **Desktop**: 1024×1024 per face (6MB total)
- **Mobile**: 512×512 per face (2MB total)  
- **Fallback**: 256×256 per face (500KB total)

### 3. Loading Strategy
```javascript
// Lazy load skybox after main game loads
// Progressive enhancement - game works without it
const loadSkybox = async () => {
  if (deviceMemory > 4GB && !isMobile) {
    // Load high-quality skybox
  } else {
    // Use simple gradient or no skybox
  }
};
```

### 4. GPU Memory Management
- **Dispose previous skybox** before loading new one
- **Use texture compression** (KTX2/ASTC for mobile)
- **Implement LOD system** based on camera distance

## Implementation Approach

### Option A: Minimal Integration
```javascript
// Very subtle, dark skybox that doesn't compete with grid
const subtleSpaceSkybox = new THREE.CubeTextureLoader()
  .load(['px.jpg', 'nx.jpg', 'py.jpg', 'ny.jpg', 'pz.jpg', 'nz.jpg']);
subtleSpaceSkybox.intensity = 0.1; // Very dim
```

### Option B: Dynamic Loading
- Load skybox only in pause/menu states
- Remove during active gameplay
- User setting to enable/disable

### Option C: Procedural Alternative
Instead of large assets, use procedural star field:
```javascript
// Lightweight procedural stars (< 100KB)
const generateStarField = () => {
  // Create particle system with random star positions
  // Much smaller memory footprint
};
```

## Recommendation
1. **Don't use for core Tron aesthetic** - breaks minimalism
2. **If implementing**: Use Option A with heavy optimization
3. **Better alternative**: Subtle procedural star field
4. **Best**: Keep current clean void - it's perfect for Tron
