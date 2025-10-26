
import React, { useRef } from 'react';
import { useFrame } from '@react-three/fiber';
import { Mesh } from 'three';
import type { PowerUpType } from '../types';

interface PowerUpProps {
  type: PowerUpType;
  position: [number, number, number];
}

export const POWERUP_CONFIG = {
  SPEED_BOOST: { color: '#ffff00', shape: 'tetrahedron' },
  INVINCIBILITY: { color: '#ffffff', shape: 'icosahedron' },
  TRAIL_SHRINK: { color: '#00ff00', shape: 'torus' },
} as const;

export const PowerUp: React.FC<PowerUpProps> = ({ type, position }) => {
  const meshRef = useRef<Mesh>(null!);
  const config = POWERUP_CONFIG[type];

  useFrame(({ clock }) => {
    if (meshRef.current) {
      // Bobbing animation
      meshRef.current.position.y = position[1] + Math.sin(clock.getElapsedTime() * 2) * 0.25;
      // Rotation animation
      meshRef.current.rotation.y += 0.01;
      meshRef.current.rotation.x += 0.005;
    }
  });

  const getGeometry = () => {
    switch (config.shape) {
      case 'tetrahedron':
        return <tetrahedronGeometry args={[0.7]} />;
      case 'icosahedron':
        return <icosahedronGeometry args={[0.7]} />;
      case 'torus':
        return <torusGeometry args={[0.55, 0.2, 16, 32]} />;
      default:
        return <boxGeometry args={[1, 1, 1]} />;
    }
  };

  return (
    <mesh ref={meshRef} position={position}>
      {getGeometry()}
      <meshStandardMaterial
        color={config.color}
        emissive={config.color}
        emissiveIntensity={5}
        toneMapped={false}
        opacity={0.85}
        transparent
      />
    </mesh>
  );
};
