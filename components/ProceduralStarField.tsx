import React, { useRef, useMemo, useEffect } from 'react';
import { useFrame } from '@react-three/fiber';
import * as THREE from 'three';

interface StarFieldConfig {
  starCount: number;
  fadeDistance: number;
  brightness: number;
  color: string;
  twinkleSpeed: number;
  enabled: boolean;
  intensity: number;
}

interface ProceduralStarFieldProps {
  config: StarFieldConfig;
  deviceType?: 'phone' | 'tablet' | 'desktop';
}

// Utility function to generate deterministic star positions
const generateStarPositions = (count: number, sphereRadius: number, seed: number = 42): Float32Array => {
  // Use seeded random for consistent star field
  const seededRandom = (s: number) => {
    s = Math.sin(s) * 10000;
    return s - Math.floor(s);
  };
  
  const positions = new Float32Array(count * 3);
  
  for (let i = 0; i < count; i++) {
    // Generate consistent random values using seed
    const r1 = seededRandom(seed + i * 2);
    const r2 = seededRandom(seed + i * 2 + 1);
    
    // Even distribution on sphere surface using Marsaglia method
    const phi = Math.acos(2 * r1 - 1);
    const theta = 2 * Math.PI * r2;
    
    // Add slight radius variation for depth
    const radius = sphereRadius + (seededRandom(seed + i * 3) - 0.5) * 200;
    
    positions[i * 3] = radius * Math.sin(phi) * Math.cos(theta);
    positions[i * 3 + 1] = radius * Math.sin(phi) * Math.sin(theta);
    positions[i * 3 + 2] = radius * Math.cos(phi);
  }
  
  return positions;
};

// Generate star sizes for variety
const generateStarSizes = (count: number, seed: number = 42): Float32Array => {
  const seededRandom = (s: number) => {
    s = Math.sin(s) * 10000;
    return s - Math.floor(s);
  };
  
  const sizes = new Float32Array(count);
  
  for (let i = 0; i < count; i++) {
    // Most stars small, few larger ones for variety
    const r = seededRandom(seed + i + 1000);
    if (r > 0.95) {
      sizes[i] = 2.5 + r * 1.5; // Bright stars
    } else if (r > 0.8) {
      sizes[i] = 1.5 + r * 1.0; // Medium stars
    } else {
      sizes[i] = 0.8 + r * 0.7; // Dim stars (majority)
    }
  }
  
  return sizes;
};

export const ProceduralStarField: React.FC<ProceduralStarFieldProps> = ({ 
  config, 
  deviceType = 'desktop' 
}) => {
  const pointsRef = useRef<THREE.Points>(null!);
  const materialRef = useRef<THREE.PointsMaterial>(null!);
  const baseOpacity = useRef(0.0);
  
  // Device-based star count optimization
  const optimizedStarCount = useMemo(() => {
    if (!config.enabled) return 0;
    
    const baseCount = config.starCount;
    switch (deviceType) {
      case 'phone': return Math.min(baseCount * 0.4, 800);
      case 'tablet': return Math.min(baseCount * 0.7, 1200);
      default: return baseCount;
    }
  }, [config.starCount, config.enabled, deviceType]);

  // Generate star positions and sizes (memoized for performance)
  const { positions, sizes } = useMemo(() => {
    if (optimizedStarCount === 0) {
      return { positions: new Float32Array(0), sizes: new Float32Array(0) };
    }
    
    return {
      positions: generateStarPositions(optimizedStarCount, 1000),
      sizes: generateStarSizes(optimizedStarCount)
    };
  }, [optimizedStarCount]);

  // Create geometry and material
  const geometry = useMemo(() => {
    if (positions.length === 0) return null;
    
    const geom = new THREE.BufferGeometry();
    geom.setAttribute('position', new THREE.BufferAttribute(positions, 3));
    geom.setAttribute('size', new THREE.BufferAttribute(sizes, 1));
    
    return geom;
  }, [positions, sizes]);

  // SOTA Material with modern Three.js features
  const material = useMemo(() => {
    if (!geometry) return null;
    
    // Calculate base opacity based on intensity - Make it more visible for testing
    const calculatedOpacity = 1.0; // Maximum opacity for debugging
    baseOpacity.current = calculatedOpacity;
    
    console.log('Creating star material with opacity:', calculatedOpacity, 'intensity:', config.intensity, 'enabled:', config.enabled);
    
    return new THREE.PointsMaterial({
      color: new THREE.Color('#ffffff'), // Pure white for maximum visibility
      size: 8.0, // Huge size for debugging
      transparent: true,
      opacity: calculatedOpacity,
      blending: THREE.AdditiveBlending,
      sizeAttenuation: true,
      toneMapped: false,
      vertexColors: false,
      alphaTest: 0.001, // Helps with z-fighting
      depthWrite: false, // Important for transparent objects
      fog: false // Stars shouldn't be affected by fog
    });
  }, [config.color, config.intensity, config.brightness, geometry]);

  // Cleanup on unmount
  useEffect(() => {
    return () => {
      if (geometry) {
        geometry.dispose();
      }
      if (material) {
        material.dispose();
      }
    };
  }, [geometry, material]);

  // Subtle animation loop
  useFrame(({ clock }) => {
    if (!config.enabled || !materialRef.current || baseOpacity.current === 0) return;

    const time = clock.getElapsedTime();
    
    // Very subtle twinkle effect
    const twinkle = 0.7 + Math.sin(time * config.twinkleSpeed) * 0.3; // 0.4-1.0 range
    materialRef.current.opacity = baseOpacity.current * twinkle;
    
    // Optional: Very slow rotation for subtle movement
    if (pointsRef.current) {
      pointsRef.current.rotation.y += 0.0001; // Almost imperceptible rotation
    }
  });

  // Debug logging
  console.log('ProceduralStarField render:', {
    enabled: config.enabled,
    intensity: config.intensity,
    starCount: optimizedStarCount,
    hasGeometry: !!geometry,
    hasMaterial: !!material
  });

  // Don't render if disabled or no geometry
  if (!config.enabled || !geometry || !material) {
    console.log('StarField not rendering - enabled:', config.enabled, 'geometry:', !!geometry, 'material:', !!material);
    return null;
  }

  return (
    <points 
      ref={pointsRef} 
      geometry={geometry} 
      material={material}
      userData={{ name: 'ProceduralStarField' }}
      renderOrder={-1} // Render behind everything else
    >
      <primitive object={geometry} attach="geometry" />
      <primitive ref={materialRef} object={material} attach="material" />
    </points>
  );
};
