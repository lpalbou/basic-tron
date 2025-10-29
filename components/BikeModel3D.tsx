import React, { useRef, useMemo, useEffect, useState, Suspense } from 'react';
import { useFrame, useLoader } from '@react-three/fiber';
import * as THREE from 'three';
import { Group, Vector3, Vector2, TextureLoader, MeshStandardMaterial, Mesh, BufferAttribute } from 'three';
import { OBJLoader } from 'three/examples/jsm/loaders/OBJLoader';
import type { Player, GameState } from '../types';
import { ErrorBoundary } from './ErrorBoundary';

interface BikeModel3DProps {
  player: React.MutableRefObject<Player>;
  gameState: GameState;
}

// Fallback component with basic geometry (same as original)
const FallbackBike: React.FC<BikeModel3DProps> = ({ player }) => {
  return (
    <>
      <mesh position={[0, 0.4, 0.1]}>
        <boxGeometry args={[2.1, 0.3, 4.2]} />
        <meshStandardMaterial 
          color={player.current.color} 
          emissive={player.current.color}
          emissiveIntensity={0.3}
          metalness={0.9} 
          roughness={0.1} 
        />
      </mesh>
      <mesh position={[0, 0.7, -2.0]} rotation={[0.4, 0, 0]}>
        <boxGeometry args={[2.1, 0.7, 0.7]} />
        <meshStandardMaterial 
          color={player.current.color}
          emissive={player.current.color}
          emissiveIntensity={0.3}
          metalness={0.9} 
          roughness={0.1} 
        />
      </mesh>
      <mesh position={[0, 0.7, 2.0]} rotation={[-0.2, 0, 0]}>
        <boxGeometry args={[2.1, 0.5, 0.8]} />
        <meshStandardMaterial 
          color={player.current.color}
          emissive={player.current.color}
          emissiveIntensity={0.3}
          metalness={0.9} 
          roughness={0.1} 
        />
      </mesh>
    </>
  );
};

// 3D Model component with SOTA PBR rendering
const Model3D: React.FC<BikeModel3DProps> = ({ player, gameState }) => {
  const modelRef = useRef<Group>(null!);
  const [modelLoaded, setModelLoaded] = useState(false);

  // Get base URL for asset paths (handles /basic-tron/ prefix)
  const BASE_URL = import.meta.env.BASE_URL;

  // Load OBJ model (materials will be applied manually - MTL loader has path issues)
  const model = useLoader(OBJLoader, `${BASE_URL}assets/models/Neutron_Bike_low.obj`);

  // Load PBR textures for enhanced rendering
  // NOTE: Normal maps excluded - both neutron_Bike_Normal.png and neutron_Bike_Normal_OpenGL.png
  // are nearly uniform/flat and provide no useful surface detail. Better to rely on geometry normals.
  const [baseColorTexture, metallicTexture, roughnessTexture, aoTexture] = useLoader(TextureLoader, [
    `${BASE_URL}assets/models/textures/neutron_Bike_Base_color.png`,
    `${BASE_URL}assets/models/textures/neutron_Bike_Metallic.png`,
    `${BASE_URL}assets/models/textures/neutron_Bike_Roughness.png`,
    `${BASE_URL}assets/models/textures/neutron_Bike_Mixed_AO.png`
  ]);

  // SOTA PBR Material Setup
  const enhancedMaterial = useMemo(() => {
    console.log('=== ENHANCED 3D BIKE MODEL - MATERIAL SETUP (No Normal Maps) ===');
    console.log('Player Color:', player.current.color);
    console.log('PBR textures loaded:', {
      baseColor: baseColorTexture?.image ? `${baseColorTexture.image.width}x${baseColorTexture.image.height}` : 'FAILED',
      metallic: metallicTexture?.image ? `${metallicTexture.image.width}x${metallicTexture.image.height}` : 'FAILED',
      roughness: roughnessTexture?.image ? `${roughnessTexture.image.width}x${roughnessTexture.image.height}` : 'FAILED',
      ao: aoTexture?.image ? `${aoTexture.image.width}x${aoTexture.image.height}` : 'FAILED'
    });
    console.log('BASE_URL:', import.meta.env.BASE_URL);

    // Configure all textures with optimized settings
    const allTextures = [baseColorTexture, metallicTexture, roughnessTexture, aoTexture];
    allTextures.forEach(texture => {
      if (texture && texture.image) {
        // Texture configuration optimized for performance
        // CRITICAL: flipY = true for correct UV mapping (this model uses standard UV orientation)
        texture.flipY = true; // Fixed: was false, causing UV scrambling
        texture.generateMipmaps = true;
        texture.minFilter = THREE.LinearMipmapLinearFilter;
        texture.magFilter = THREE.LinearFilter;
        texture.anisotropy = 8; // Reduced from 16 to save GPU memory
        texture.wrapS = THREE.RepeatWrapping;
        texture.wrapT = THREE.RepeatWrapping;

        // Resize large textures to prevent WebGL context loss (4096x4096 = 112MB VRAM for 7 textures!)
        const originalWidth = texture.image.width;
        const originalHeight = texture.image.height;

        if (originalWidth > 2048 || originalHeight > 2048) {
          // Create canvas for resizing
          const canvas = document.createElement('canvas');
          const maxSize = 2048; // Reduced from 4096
          canvas.width = maxSize;
          canvas.height = maxSize;

          const ctx = canvas.getContext('2d');
          if (ctx) {
            ctx.drawImage(texture.image, 0, 0, maxSize, maxSize);
            texture.image = canvas;
            texture.needsUpdate = true;
            console.log(`Resized texture from ${originalWidth}x${originalHeight} to ${maxSize}x${maxSize} to save VRAM`);
          }
        }
      }
    });

    // OPTIMIZED for LIGHT RESPONSE: More reflective, better lighting interaction
    // Strategy: Lower roughness = more glossy = better light reflections
    const enhancedMat = new MeshStandardMaterial({
        // Base textures for surface properties
        map: baseColorTexture,
        metalnessMap: metallicTexture,
        roughnessMap: roughnessTexture,
        aoMap: aoTexture,
        aoMapIntensity: 1.5, // Boosted from 1.2

        // BRIGHTER base color for better light response
        color: new THREE.Color(0xffffff), // Pure white for maximum brightness

        // Strong emissive for glow on team areas
        emissive: new THREE.Color(player.current.color),
        emissiveIntensity: 0.2, // Boosted from 0.15

        // MORE REFLECTIVE - better light response
        metalness: 0.9, // Increased from 0.8
        roughness: 0.4, // MUCH LOWER from 1.0 - more glossy/reflective!

        // Rendering settings
        flatShading: false,
        transparent: false,
        side: THREE.FrontSide,
        toneMapped: true
      });

    // METALLIC-BASED Team Coloring: Color ONLY the metallic areas (hubless wheels, silver trim)
    // This matches the trail color logic and looks natural
    const teamColorUniform = { value: new THREE.Color(player.current.color) };

    enhancedMat.onBeforeCompile = (shader) => {
      // Inject team color uniform
      shader.uniforms.uTeamColor = teamColorUniform;

      // Add uniform declaration to fragment shader
      shader.fragmentShader = 'uniform vec3 uTeamColor;\n' + shader.fragmentShader;

      // ROUGHNESS MAP CONTROLS TEAM COLORING + NEON GLOW
      // WHITE in roughness map → TEAM COLOR + STRONG EMISSIVE (neon light)
      // BLACK/GRAY in roughness map → PURE BLACK (not team colored)
      // Result: Bikes are BLACK and BLUE or BLACK and RED with glowing neon accents
      // IMPORTANT: Preserve AO map contribution for depth detail
      shader.fragmentShader = shader.fragmentShader.replace(
        '#include <color_fragment>',
        `
        #include <color_fragment>

        // PRESERVE original color with AO for subtle detail only
        vec3 originalColorWithAO = diffuseColor.rgb;

        // Extract just AO factor (brightness) without killing the color
        float aoFactor = (originalColorWithAO.r + originalColorWithAO.g + originalColorWithAO.b) / 3.0;
        aoFactor = clamp(aoFactor * 1.5, 0.7, 1.0); // Boost and clamp to keep bright

        // Read roughness map (WHITE = neon light areas, BLACK = pure black)
        #ifdef USE_ROUGHNESSMAP
          vec4 roughnessSample = texture2D(roughnessMap, vRoughnessMapUv);
          float roughnessValue = roughnessSample.g; // 0.0=black, 1.0=white
        #else
          float roughnessValue = 0.5;
        #endif

        // ADJUSTED: More permissive threshold to catch gray areas too
        float teamMask = smoothstep(0.2, 0.6, roughnessValue);

        // BRIGHTER black - not pure black, mid-gray for lighting to work
        vec3 darkGray = vec3(0.15, 0.15, 0.15) * aoFactor;

        // VERY BRIGHT team color - minimal AO darkening
        vec3 teamColor = uTeamColor * 1.8 * aoFactor;

        // RESULT: Dark gray base with bright team colors
        diffuseColor.rgb = mix(
          darkGray,           // DARK areas = mid-gray (lights can affect)
          teamColor,          // BRIGHT areas = BRIGHT team color
          teamMask            // Roughness-based mask
        );
        `
      );

      // BOOST EMISSIVE on neon light areas (white in roughness map)
      shader.fragmentShader = shader.fragmentShader.replace(
        '#include <emissivemap_fragment>',
        `
        #include <emissivemap_fragment>

        // Read roughness map again for emissive boost
        #ifdef USE_ROUGHNESSMAP
          vec4 roughnessSampleEmissive = texture2D(roughnessMap, vRoughnessMapUv);
          float neonMask = smoothstep(0.2, 0.6, roughnessSampleEmissive.g); // Match color threshold
        #else
          float neonMask = 0.0;
        #endif

        // BOOST emissive on neon light areas - make them GLOW bright!
        totalEmissiveRadiance += uTeamColor * neonMask * 2.5; // 2.5x boost for strong neon glow
        `
      );
    };

    // Store uniform reference for updates
    (enhancedMat as any).teamColorUniform = teamColorUniform;

    console.log('Enhanced material created:', {
      color: enhancedMat.color.getHexString(),
      emissive: enhancedMat.emissive.getHexString(),
      emissiveIntensity: enhancedMat.emissiveIntensity,
      metalness: enhancedMat.metalness,
      roughness: enhancedMat.roughness,
      hasBaseMap: !!enhancedMat.map,
      hasAOMap: !!enhancedMat.aoMap,
      aoMapIntensity: enhancedMat.aoMapIntensity,
      hasMetalnessMap: !!enhancedMat.metalnessMap,
      hasRoughnessMap: !!enhancedMat.roughnessMap,
      textureCount: `${[enhancedMat.map, enhancedMat.aoMap, enhancedMat.metalnessMap, enhancedMat.roughnessMap].filter(t => t).length} textures`
    });

    return enhancedMat;
  }, [baseColorTexture, metallicTexture, roughnessTexture, aoTexture, player.current.color]);

  // Helper to add random attribute for derezz effects
  const addRandomAttribute = (geometry: any) => {
    if (!geometry.attributes.aRandom) {
      const count = geometry.attributes.position.count;
      const randoms = new Float32Array(count);
      for (let i = 0; i < count; i++) {
        randoms[i] = Math.random();
      }
      geometry.setAttribute('aRandom', new BufferAttribute(randoms, 1));
    }
  };

  // SOTA Model Setup with proper material assignment
  useEffect(() => {
    if (!model || !modelRef.current || !enhancedMaterial) return;

    // Clone the model to avoid sharing between players
    const clonedModel = model.clone();

    console.log('=== SOTA MODEL SETUP ===');
    console.log('Processing model with enhanced PBR material...');

    // Process each mesh in the model
    clonedModel.traverse((child) => {
      if (child instanceof Mesh) {
        const geometry = child.geometry;

        // Debug geometry attributes
        console.log('Mesh geometry attributes:', Object.keys(geometry.attributes));
        console.log('UV coordinates:', !!geometry.attributes.uv ? 'PRESENT' : 'MISSING');
        console.log('Normals:', !!geometry.attributes.normal ? 'PRESENT' : 'MISSING');
        console.log('Vertex count:', geometry.attributes.position?.count || 0);

        // Ensure geometry is properly prepared for PBR rendering
        if (!geometry.attributes.normal) {
          console.log('Computing vertex normals...');
          geometry.computeVertexNormals();
        }

        // Note: computeTangents() requires indexed geometry, which OBJ loader doesn't always create
        // Normal mapping will work without tangents (Three.js computes them in shader)
        // Skipping tangent computation to avoid errors and GPU overhead

        // Verify model positioning
        geometry.computeBoundingBox();
        const box = geometry.boundingBox;
        if (box) {
          console.log('Model bounds:', {
            min: [box.min.x.toFixed(2), box.min.y.toFixed(2), box.min.z.toFixed(2)],
            max: [box.max.x.toFixed(2), box.max.y.toFixed(2), box.max.z.toFixed(2)]
          });
        }

        // Apply the enhanced material to ALL meshes
        child.material = enhancedMaterial;
        console.log('Applied enhanced material to mesh');

        // Enable shadows
        child.castShadow = true;
        child.receiveShadow = true;

        // Add random attribute for derezz effects
        addRandomAttribute(geometry);
      }
    });

    // Clear previous model and add new one
    modelRef.current.clear();
    modelRef.current.add(clonedModel);

    setModelLoaded(true);
    console.log('SOTA model setup complete with PBR material!');
  }, [model, enhancedMaterial]);

  // Update material colors based on player state
  useFrame(() => {
    if (!modelLoaded || !enhancedMaterial) return;

    // Update shader uniform for team color (metallic-based approach)
    const teamColorUniform = (enhancedMaterial as any).teamColorUniform;
    if (teamColorUniform) {
      teamColorUniform.value.set(player.current.color);
    }

    // Update emissive for subtle glow on metallic areas
    enhancedMaterial.emissive.set(player.current.color);

    // Update emissive intensity based on power-up status - SUBTLE glow
    const powerUpActive = player.current.activePowerUp.type !== null && player.current.activePowerUp.type !== 'TRAIL_SHRINK';
    enhancedMaterial.emissiveIntensity = powerUpActive ? 0.12 : 0.06; // Reduced for cleaner look
  });

  return <group ref={modelRef} />;
};

// Main export with Suspense and error boundary
export const BikeModel3D: React.FC<BikeModel3DProps> = ({ player, gameState }) => {
  return (
    <ErrorBoundary 
      fallback={FallbackBike} 
      fallbackProps={{ player, gameState }}
    >
      <Suspense fallback={<FallbackBike player={player} gameState={gameState} />}>
        <Model3D player={player} gameState={gameState} />
      </Suspense>
    </ErrorBoundary>
  );
};