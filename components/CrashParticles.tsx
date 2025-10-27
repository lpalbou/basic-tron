
import React, { useMemo, useRef } from 'react';
import { useFrame } from '@react-three/fiber';
import { Mesh, Vector3, MathUtils, PointLight } from 'three';
import type { Material } from 'three';

interface ParticleProps {
  initialVelocity: Vector3;
  color: string;
}

// A single particle that moves, fades, and shrinks over its lifetime.
const Particle: React.FC<ParticleProps> = ({ initialVelocity, color }) => {
  const meshRef = useRef<Mesh>(null!);
  // Each particle lives for about 1 to 2 seconds for a bigger, longer explosion.
  const life = useRef(MathUtils.randFloat(1, 2));

  useFrame((_, delta) => {
    if (!meshRef.current || life.current <= 0) return;
    
    life.current -= delta;
    
    // Move the particle based on its velocity.
    meshRef.current.position.addScaledVector(initialVelocity, delta);
    
    // Apply simple gravity to the particle.
    initialVelocity.y -= 9.8 * delta * 0.4; // Slightly stronger gravity feel
    
    // Fade out and shrink the particle as it dies.
    const material = meshRef.current.material as Material & { opacity: number };
    const scale = Math.max(0, life.current / 2.0); // Normalize life for scaling
    
    if (material.opacity > 0) {
      material.opacity = scale;
    }
    meshRef.current.scale.set(scale, scale, scale);
  });

  // Render the particle only if its life is greater than 0.
  if (life.current <= 0) return null;

  return (
    <mesh ref={meshRef}>
      <boxGeometry args={[0.25, 0.25, 0.25]} />
      <meshStandardMaterial 
        color={color} 
        emissive={color} 
        emissiveIntensity={5} 
        transparent 
        opacity={1} 
        toneMapped={false} 
      />
    </mesh>
  );
};

interface CrashParticlesProps {
  position: [number, number, number];
  color: string;
  count?: number;
}

// This component spawns a burst of particles and a flash of light at a given position.
export const CrashParticles: React.FC<CrashParticlesProps> = ({ position, color, count = 50 }) => {
  const lightRef = useRef<PointLight>(null!);
  const life = useRef(0.5); // Light flash duration

  useFrame((_, delta) => {
    if (lightRef.current && life.current > 0) {
      life.current -= delta;
      lightRef.current.intensity = (life.current / 0.5) * 20; // Fade out from intensity 20
    } else if (lightRef.current) {
      lightRef.current.intensity = 0;
    }
  });
  
  // Create a memoized array of particle components.
  const particles = useMemo(() => {
    return Array.from({ length: count }).map((_, i) => {
      // Give each particle a random velocity for a more explosive burst effect.
      const velocity = new Vector3(
        MathUtils.randFloatSpread(12), // x-axis spread increased from 6 to 12
        MathUtils.randFloat(5, 10),    // y-axis (upward burst) increased from 3-7 to 5-10
        MathUtils.randFloatSpread(12)  // z-axis spread increased from 6 to 12
      );
      return <Particle key={i} initialVelocity={velocity} color={color} />;
    });
  }, [count, color]);

  return (
    <group position={position}>
      {particles}
      <pointLight ref={lightRef} color={color} distance={40} decay={2} />
    </group>
  );
};