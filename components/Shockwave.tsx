import React, { useRef, useEffect } from 'react';
import { useFrame } from '@react-three/fiber';
import { Group, Mesh } from 'three';
import type { MeshStandardMaterial } from 'three';

interface ShockwaveProps {
  position: [number, number, number];
  onComplete: () => void;
}

const SHOCKWAVE_DURATION = 0.85; // Slightly longer to appreciate the effect
const MAX_RADIUS = 35; // A bit larger for more impact

const ELECTRIC_BLUE = '#00BFFF';
const WHITE = '#FFFFFF';

export const Shockwave: React.FC<ShockwaveProps> = ({ position, onComplete }) => {
  const groupRef = useRef<Group>(null!);
  const innerMaterialRef = useRef<MeshStandardMaterial>(null!);
  const outerMaterialRef = useRef<MeshStandardMaterial>(null!);
  const time = useRef(0);

  useEffect(() => {
    if (groupRef.current) {
        // Position it slightly above the grid
        groupRef.current.position.set(position[0], 0.1, position[2]);
        groupRef.current.rotation.x = -Math.PI / 2;
    }
  }, [position]);

  useFrame((state, delta) => {
    if (!groupRef.current || !innerMaterialRef.current || !outerMaterialRef.current) return;
    
    time.current += delta;
    const progress = time.current / SHOCKWAVE_DURATION;

    if (progress >= 1.0) {
      groupRef.current.visible = false;
      onComplete();
      return;
    }
    
    // More explosive easing function
    const easedProgress = 1 - Math.pow(1 - progress, 5); // easeOutQuint

    const currentRadius = MAX_RADIUS * easedProgress;
    
    // Scale the whole group
    groupRef.current.scale.set(currentRadius, currentRadius, currentRadius);
    
    // Fade out opacity
    const opacity = 1.0 - progress;
    innerMaterialRef.current.opacity = opacity;
    outerMaterialRef.current.opacity = opacity;

    // Flicker and fade out emissive intensity
    const flicker = 1.0 + Math.sin(state.clock.elapsedTime * 80) * 0.25;
    const fade = 1.0 - Math.pow(progress, 2); // Fade intensity faster than opacity

    innerMaterialRef.current.emissiveIntensity = 12 * fade * flicker;
    outerMaterialRef.current.emissiveIntensity = 10 * fade * flicker;
  });

  return (
    <group ref={groupRef}>
      {/* Outer blue ring - Wider */}
      <mesh>
        <ringGeometry args={[0.8, 1, 64]} />
        <meshStandardMaterial 
          ref={outerMaterialRef}
          color={ELECTRIC_BLUE}
          emissive={ELECTRIC_BLUE}
          emissiveIntensity={10}
          transparent 
          opacity={1} 
          toneMapped={false} 
        />
      </mesh>
      {/* Inner white ring - Wider */}
      <mesh>
        <ringGeometry args={[0.6, 0.8, 64]} />
        <meshStandardMaterial
          ref={innerMaterialRef}
          color={WHITE}
          emissive={WHITE}
          emissiveIntensity={12}
          transparent
          opacity={1}
          toneMapped={false}
        />
      </mesh>
    </group>
  );
};
