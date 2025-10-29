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
  const [baseColorTexture, normalTexture, normalOpenGLTexture, metallicTexture, roughnessTexture, aoTexture, heightTexture] = useLoader(TextureLoader, [
    `${BASE_URL}assets/models/textures/neutron_Bike_Base_color.png`,
    `${BASE_URL}assets/models/textures/neutron_Bike_Normal.png`,
    `${BASE_URL}assets/models/textures/neutron_Bike_Normal_OpenGL.png`,
    `${BASE_URL}assets/models/textures/neutron_Bike_Metallic.png`,
    `${BASE_URL}assets/models/textures/neutron_Bike_Roughness.png`,
    `${BASE_URL}assets/models/textures/neutron_Bike_Mixed_AO.png`,
    `${BASE_URL}assets/models/textures/neutron_Bike_Height.png`
  ]);

  // SOTA PBR Material Setup
  const enhancedMaterial = useMemo(() => {
    console.log('=== SOTA 3D BIKE MODEL - MATERIAL SETUP ===');
    console.log('Player Color:', player.current.color);
    console.log('PBR textures loaded:', {
      baseColor: baseColorTexture?.image ? `${baseColorTexture.image.width}x${baseColorTexture.image.height}` : 'FAILED',
      normal: normalTexture?.image ? `${normalTexture.image.width}x${normalTexture.image.height}` : 'FAILED',
      normalOpenGL: normalOpenGLTexture?.image ? `${normalOpenGLTexture.image.width}x${normalOpenGLTexture.image.height}` : 'FAILED',
      metallic: metallicTexture?.image ? `${metallicTexture.image.width}x${metallicTexture.image.height}` : 'FAILED',
      roughness: roughnessTexture?.image ? `${roughnessTexture.image.width}x${roughnessTexture.image.height}` : 'FAILED',
      ao: aoTexture?.image ? `${aoTexture.image.width}x${aoTexture.image.height}` : 'FAILED',
      height: heightTexture?.image ? `${heightTexture.image.width}x${heightTexture.image.height}` : 'FAILED'
    });
    console.log('BASE_URL:', import.meta.env.BASE_URL);

    // Configure all textures with optimized settings
    const allTextures = [baseColorTexture, normalTexture, normalOpenGLTexture, metallicTexture, roughnessTexture, aoTexture, heightTexture];
    allTextures.forEach(texture => {
      if (texture && texture.image) {
        // Texture configuration optimized for performance
        texture.flipY = false; // OBJ models use OpenGL convention
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

    // Create single SOTA PBR material (MTL loader doesn't work with base path)
    const enhancedMat = new MeshStandardMaterial({
        // PBR texture maps - USE base color texture for detail, tinted with player color
        map: baseColorTexture, // Base texture for surface detail
        normalMap: normalOpenGLTexture || normalTexture, // Prefer OpenGL normal map
        normalScale: new Vector2(1.0, 1.0), // Normal mapping for surface detail
        metalnessMap: metallicTexture,
        roughnessMap: roughnessTexture,
        // Removed aoMap - causes WebGL context loss (requires uv2 channel)
        // Removed displacementMap - too expensive, causes context loss

        // Player-specific color - BALANCED with texture detail
        color: new THREE.Color(player.current.color), // Tints the base texture
        emissive: new THREE.Color(player.current.color),
        emissiveIntensity: 0.2, // Reduced for subtle glow that doesn't wash out detail

        // PBR properties optimized to prevent context loss
        metalness: 0.8, // Metallic but not overpowering
        roughness: 0.3, // Some roughness for texture variation

        // Advanced rendering settings
        flatShading: false,
        transparent: false,
        opacity: 1.0,
        alphaTest: 0,
        side: THREE.FrontSide,
        toneMapped: true
      });

    console.log('Enhanced material created:', {
      color: enhancedMat.color.getHexString(),
      emissive: enhancedMat.emissive.getHexString(),
      emissiveIntensity: enhancedMat.emissiveIntensity,
      hasBaseMap: !!enhancedMat.map,
      hasNormalMap: !!enhancedMat.normalMap,
      hasMetalnessMap: !!enhancedMat.metalnessMap,
      hasRoughnessMap: !!enhancedMat.roughnessMap,
      textureCount: `${[enhancedMat.map, enhancedMat.normalMap, enhancedMat.metalnessMap, enhancedMat.roughnessMap].filter(t => t).length} textures`
    });

    return enhancedMat;
  }, [baseColorTexture, normalTexture, normalOpenGLTexture, metallicTexture, roughnessTexture, aoTexture, heightTexture, player.current.color]);

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

    // Update material with player-specific colors - BALANCED for texture visibility
    enhancedMaterial.color.set(new THREE.Color(player.current.color)); // Tints the texture
    enhancedMaterial.emissive.set(player.current.color);

    // Update emissive intensity based on power-up status - SUBTLE glow
    const powerUpActive = player.current.activePowerUp.type !== null && player.current.activePowerUp.type !== 'TRAIL_SHRINK';
    enhancedMaterial.emissiveIntensity = powerUpActive ? 0.4 : 0.2; // Balanced glow
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