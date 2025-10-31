import React, { useRef, useEffect } from 'react';
import { useThree } from '@react-three/fiber';
import * as THREE from 'three';
import { RGBELoader } from 'three/examples/jsm/loaders/RGBELoader.js';

export type SkyboxType = 'off' | 'nebula-01' | 'nebula-02' | 'nebula-00' | 'galaxies' | 'hdri';

interface SkyboxManagerProps {
  skyboxType: SkyboxType;
  deviceType?: 'phone' | 'tablet' | 'desktop';
  intensity?: number;
}

const SKYBOX_CONFIGS = {
  'off': { file: null, intensity: 0 },
  'nebula-01': { file: 'uploads_files_3387634_nebula-01-low.hdr', intensity: 0.1 },
  'nebula-02': { file: 'uploads_files_3387644_nebula-low-02.exr', intensity: 0.1 },
  'nebula-00': { file: 'uploads_files_3387654_nebula-00-low.hdr', intensity: 0.1 },
  'galaxies': { file: 'uploads_files_5527277_Free+Galaxies+8k.hdr', intensity: 0.08 },
  'hdri': { file: 'uploads_files_5527562_Free+HDRI+8k.hdr', intensity: 0.12 }
} as const;

export const SkyboxManager: React.FC<SkyboxManagerProps> = ({
  skyboxType,
  deviceType = 'desktop',
  intensity = 1.0
}) => {
  const { scene } = useThree();
  const currentSkyboxRef = useRef<THREE.Texture | null>(null);
  const loaderRef = useRef<RGBELoader | null>(null);

  useEffect(() => {
    // Clean up previous skybox
    if (currentSkyboxRef.current) {
      currentSkyboxRef.current.dispose();
      currentSkyboxRef.current = null;
    }

    // Reset to no skybox
    scene.background = null;

    // Early return for 'off' state
    if (skyboxType === 'off') {
      return;
    }

    const config = SKYBOX_CONFIGS[skyboxType];
    if (!config.file) return;

    // Initialize loader lazily
    if (!loaderRef.current) {
      loaderRef.current = new RGBELoader();
    }

    // Load skybox asynchronously
    const loadSkybox = async () => {
      try {
        const texture = await new Promise<THREE.Texture>((resolve, reject) => {
          const baseUrl = (import.meta as any).env?.BASE_URL || '/';
          const skyboxPath = `${baseUrl}assets/skybox/${config.file}`;
          loaderRef.current!.load(
            skyboxPath,
            resolve,
            undefined,
            reject
          );
        });

        // Apply device-specific optimizations
        if (deviceType === 'phone') {
          // Lower quality for mobile
          texture.minFilter = THREE.LinearFilter;
          texture.magFilter = THREE.LinearFilter;
        }

        // Apply subtle intensity
        const finalIntensity = config.intensity * intensity;
        
        // Create environment map
        texture.mapping = THREE.EquirectangularReflectionMapping;
        
        // Very subtle application - barely visible to maintain Tron aesthetic
        const clonedTexture = texture.clone();
        clonedTexture.intensity = finalIntensity;
        
        // Apply as very dim background
        scene.background = clonedTexture;
        scene.backgroundIntensity = finalIntensity;
        
        currentSkyboxRef.current = clonedTexture;
        
      } catch (error) {
        console.warn(`Failed to load skybox ${skyboxType}:`, error);
        // Fallback to no skybox
        scene.background = null;
      }
    };

    loadSkybox();

    // Cleanup function
    return () => {
      if (currentSkyboxRef.current) {
        currentSkyboxRef.current.dispose();
        currentSkyboxRef.current = null;
      }
    };
  }, [skyboxType, scene, deviceType, intensity]);

  // Cleanup on unmount
  useEffect(() => {
    return () => {
      if (currentSkyboxRef.current) {
        currentSkyboxRef.current.dispose();
      }
      if (loaderRef.current) {
        // RGBELoader doesn't have explicit cleanup, but we can null the ref
        loaderRef.current = null;
      }
    };
  }, []);

  // This component doesn't render anything visible
  return null;
};

export const getSkyboxDisplayName = (type: SkyboxType): string => {
  switch (type) {
    case 'off': return 'Skybox: Off';
    case 'nebula-01': return 'Skybox: Nebula Blue';
    case 'nebula-02': return 'Skybox: Nebula Purple';
    case 'nebula-00': return 'Skybox: Nebula Green';
    case 'galaxies': return 'Skybox: Galaxies';
    case 'hdri': return 'Skybox: HDRI Space';
    default: return 'Skybox: Unknown';
  }
};

export const SKYBOX_CYCLE_ORDER: SkyboxType[] = [
  'off', 'nebula-01', 'nebula-02', 'nebula-00', 'galaxies', 'hdri'
];
