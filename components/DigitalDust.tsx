
import React, { useMemo, useRef } from 'react';
import { useFrame } from '@react-three/fiber';
import { BufferGeometry, Points } from 'three';

const PARTICLE_COUNT = 5000; // More particles for a denser field
const SKY_RADIUS = 250; // A bit further out

export const DistantData: React.FC = () => {
  const pointsRef = useRef<Points<BufferGeometry>>(null!);

  // Distribute particles in a large sphere to create a skybox effect
  const particles = useMemo(() => {
    const p = new Float32Array(PARTICLE_COUNT * 3);
    for (let i = 0; i < PARTICLE_COUNT; i++) {
      const i3 = i * 3;
      // Using spherical coordinates to distribute points evenly on a sphere
      const theta = 2 * Math.PI * Math.random();
      const phi = Math.acos(2 * Math.random() - 1);
      // Add some depth variation to make it feel less like a perfect sphere
      const radius = SKY_RADIUS * (0.8 + Math.random() * 0.2); 
      p[i3] = radius * Math.sin(phi) * Math.cos(theta);
      p[i3 + 1] = radius * Math.sin(phi) * Math.sin(theta);
      p[i3 + 2] = radius * Math.cos(phi);
    }
    return p;
  }, []);

  // Slowly rotate the entire particle system to give a sense of movement
  useFrame((_, delta) => {
    if (pointsRef.current) {
      // Slower rotation for a more subtle, vast feeling
      pointsRef.current.rotation.y += delta * 0.005;
      pointsRef.current.rotation.x += delta * 0.0025;
    }
  });

  return (
    <points ref={pointsRef}>
      <bufferGeometry>
        <bufferAttribute
          attach="attributes-position"
          count={PARTICLE_COUNT}
          array={particles}
          itemSize={3}
        />
      </bufferGeometry>
      <pointsMaterial
        size={0.8} // Larger size for visibility
        color="#00ffff"
        transparent
        opacity={0.4} // A bit more opaque to be noticeable
        sizeAttenuation={false} // CRITICAL: This makes particles appear distant instead of shrinking
      />
    </points>
  );
};
