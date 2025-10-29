import React, { useRef, useMemo, useEffect, useState, Suspense } from 'react';
import { useFrame, useLoader } from '@react-three/fiber';
import * as THREE from 'three';
import { Group, Vector3, Vector2, TextureLoader, MeshStandardMaterial, Mesh, BufferAttribute } from 'three';
import { OBJLoader } from 'three/examples/jsm/loaders/OBJLoader';
import { MTLLoader } from 'three/examples/jsm/loaders/MTLLoader';
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

  // Load MTL materials first
  const materials = useLoader(MTLLoader, `${BASE_URL}assets/models/Neutron_Bike_low.mtl`);

  // Load OBJ model (materials will be applied manually)
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
  const enhancedMaterials = useMemo(() => {
    console.log('=== SOTA 3D BIKE MODEL ===');
    console.log('MTL materials:', Object.keys(materials.materials));
    console.log('PBR textures loaded:', {
      baseColor: baseColorTexture?.image?.width || 'missing',
      normal: normalTexture?.image?.width || 'missing',
      normalOpenGL: normalOpenGLTexture?.image?.width || 'missing',
      metallic: metallicTexture?.image?.width || 'missing',
      roughness: roughnessTexture?.image?.width || 'missing',
      ao: aoTexture?.image?.width || 'missing',
      height: heightTexture?.image?.width || 'missing'
    });

    // Configure all textures with SOTA settings
    const allTextures = [baseColorTexture, normalTexture, normalOpenGLTexture, metallicTexture, roughnessTexture, aoTexture, heightTexture];
    allTextures.forEach(texture => {
      if (texture) {
        // SOTA texture configuration
        texture.flipY = false; // OBJ models use OpenGL convention
        texture.generateMipmaps = true;
        texture.minFilter = THREE.LinearMipmapLinearFilter;
        texture.magFilter = THREE.LinearFilter;
        texture.anisotropy = 16; // Maximum anisotropy for crisp textures
        texture.wrapS = THREE.RepeatWrapping;
        texture.wrapT = THREE.RepeatWrapping;
      }
    });

    // Create enhanced materials for each MTL material
    const enhancedMats = {};
    
    Object.keys(materials.materials).forEach(matName => {
      const originalMat = materials.materials[matName];
      
      // Create SOTA PBR material
      const enhancedMat = new MeshStandardMaterial({
        // PBR texture maps
        map: baseColorTexture,
        normalMap: normalOpenGLTexture || normalTexture, // Prefer OpenGL normal map
        normalScale: new Vector2(2.0, 2.0), // Strong normal mapping
        metalnessMap: metallicTexture,
        roughnessMap: roughnessTexture,
        aoMap: aoTexture,
        aoMapIntensity: 1.5, // Enhanced AO
        displacementMap: heightTexture,
        displacementScale: 0.1,
        
        // Player-specific color tinting
        color: new THREE.Color(player.current.color).multiplyScalar(0.7), // Darker for detail visibility
        emissive: new THREE.Color(player.current.color),
        emissiveIntensity: 0.15,
        
        // SOTA PBR properties
        metalness: 0.8,
        roughness: 0.25,
        
        // Advanced rendering settings
        flatShading: false,
        transparent: false,
        opacity: 1.0,
        alphaTest: 0,
        side: THREE.FrontSide,
        shadowSide: THREE.FrontSide,
        toneMapped: true,
        
        // Enable all shadow types
        castShadow: true,
        receiveShadow: true
      });
      
      enhancedMats[matName] = enhancedMat;
      console.log(`Enhanced material '${matName}' with PBR textures`);
    });

    return enhancedMats;
  }, [materials, baseColorTexture, normalTexture, normalOpenGLTexture, metallicTexture, roughnessTexture, aoTexture, heightTexture, player.current.color]);

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
    if (!model || !modelRef.current || !enhancedMaterials) return;

    // Clone the model to avoid sharing between players
    const clonedModel = model.clone();
    
    console.log('=== SOTA MODEL SETUP ===');
    console.log('Processing model with enhanced PBR materials...');
    
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
        
        // CRITICAL: Compute tangents for normal mapping
        if (geometry.attributes.uv && geometry.attributes.normal) {
          console.log('Computing tangent space for normal mapping...');
          geometry.computeTangents();
        } else {
          console.warn('Cannot compute tangents - missing UV or normals!');
        }
        
        // Verify model positioning
        geometry.computeBoundingBox();
        const box = geometry.boundingBox;
        if (box) {
          console.log('Model bounds:', {
            min: [box.min.x.toFixed(2), box.min.y.toFixed(2), box.min.z.toFixed(2)],
            max: [box.max.x.toFixed(2), box.max.y.toFixed(2), box.max.z.toFixed(2)]
          });
        }

        // Apply the correct enhanced material based on original material name
        const originalMaterial = child.material;
        let materialName = 'blinn1SG'; // Default material
        
        if (originalMaterial && originalMaterial.name) {
          materialName = originalMaterial.name;
        }
        
        if (enhancedMaterials[materialName]) {
          child.material = enhancedMaterials[materialName];
          console.log(`Applied enhanced material '${materialName}' to mesh`);
        } else {
          // Fallback to first available enhanced material
          const firstMaterial = Object.values(enhancedMaterials)[0];
          if (firstMaterial) {
            child.material = firstMaterial;
            console.log(`Applied fallback enhanced material to mesh`);
          }
        }
        
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
    console.log('SOTA model setup complete with PBR materials!');
  }, [model, enhancedMaterials]);

  // Update material colors based on player state
  useFrame(() => {
    if (!modelLoaded || !enhancedMaterials) return;
    
    // Update all enhanced materials with player-specific colors
    Object.values(enhancedMaterials).forEach((material: any) => {
      if (material) {
        // Update player-specific colors
        material.color.set(new THREE.Color(player.current.color).multiplyScalar(0.7));
        material.emissive.set(player.current.color);
        
        // Update emissive intensity based on power-up status
        const powerUpActive = player.current.activePowerUp.type !== null && player.current.activePowerUp.type !== 'TRAIL_SHRINK';
        material.emissiveIntensity = powerUpActive ? 0.4 : 0.15;
      }
    });
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