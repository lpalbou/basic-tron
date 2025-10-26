
import React, { useMemo, useRef } from 'react';
import { useFrame } from '@react-three/fiber';
import { Mesh, Vector3, MathUtils } from 'three';
import type { Material } from 'three';

interface ParticleProps {
  initialVelocity: Vector3;
  color: string;
}

// A single particle that moves, fades, and shrinks over its lifetime.
const Particle: React.FC<ParticleProps> = ({ initialVelocity, color }) => {
  const meshRef = useRef<Mesh>(null!);
  // Each particle lives for about 1 to 1.5 seconds.
  const life = useRef(MathUtils.randFloat(1, 1.5));

  useFrame((_, delta) => {
    if (!meshRef.current || life.current <= 0) return;
    
    life.current -= delta;
    
    // Move the particle based on its velocity.
    meshRef.current.position.addScaledVector(initialVelocity, delta);
    
    // Apply simple gravity to the particle.
    initialVelocity.y -= 9.8 * delta * 0.2; 
    
    // Fade out and shrink the particle as it dies.
    const material = meshRef.current.material as Material & { opacity: number };
    const scale = Math.max(0, life.current);
    
    if (material.opacity > 0) {
      material.opacity = scale;
    }
    meshRef.current.scale.set(scale, scale, scale);
  });

  // Render the particle only if its life is greater than 0.
  if (life.current <= 0) return null;

  return (
    <mesh ref={meshRef}>
      <boxGeometry args={[0.2, 0.2, 0.2]} />
      <meshStandardMaterial 
        color={color} 
        emissive={color} 
        emissiveIntensity={4} 
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

// This component spawns a burst of particles at a given position.
export const CrashParticles: React.FC<CrashParticlesProps> = ({ position, color, count = 30 }) => {
  
  // Create a memoized array of particle components.
  const particles = useMemo(() => {
    return Array.from({ length: count }).map((_, i) => {
      // Give each particle a random velocity for a burst effect.
      const velocity = new Vector3(
        MathUtils.randFloatSpread(6), // x-axis spread
        MathUtils.randFloat(3, 7),    // y-axis (upward burst)
        MathUtils.randFloatSpread(6)  // z-axis spread
      );
      return <Particle key={i} initialVelocity={velocity} color={color} />;
    });
  }, [count, color]);

  return (
    <group position={position}>
      {particles}
    </group>
  );
};
