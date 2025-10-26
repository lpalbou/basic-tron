
import React, { useRef } from 'react';
import { useFrame } from '@react-three/fiber';
import { Group, Vector3, PointLight, Euler } from 'three';
import type { Player } from '../types';

interface LightCycleProps {
  player: React.MutableRefObject<Player>;
}

const directionToRotation = new Map<Player['direction'], number>([
  ['UP', Math.PI],
  ['DOWN', 0],
  ['LEFT', Math.PI / 2],
  ['RIGHT', -Math.PI / 2],
]);

export const LightCycle: React.FC<LightCycleProps> = ({ player }) => {
  const groupRef = useRef<Group>(null!);
  const lightRef = useRef<PointLight>(null!);
  
  const currentPos = useRef(new Vector3(...player.current.position));
  const currentRot = useRef(new Euler(0, directionToRotation.get(player.current.direction) ?? 0, 0));

  useFrame(() => {
    if (!groupRef.current || !lightRef.current) return;
    
    const p = player.current;
    const powerUpActive = p.activePowerUp.type !== null && p.activePowerUp.type !== 'TRAIL_SHRINK';

    groupRef.current.visible = p.isAlive;
    lightRef.current.visible = p.isAlive;
    
    lightRef.current.intensity = powerUpActive ? 10 : 5;

    if (p.isAlive) {
      const targetPosition = new Vector3(...p.position);
      // Interpolate position for smooth movement between game ticks.
      currentPos.current.lerp(targetPosition, 0.4); 
      
      const targetRotationY = directionToRotation.get(p.direction) ?? 0;
      // Smoothly interpolate rotation, handling wrapping from PI to -PI.
      let rotDiff = targetRotationY - currentRot.current.y;
      while (rotDiff > Math.PI) rotDiff -= 2 * Math.PI;
      while (rotDiff < -Math.PI) rotDiff += 2 * Math.PI;
      currentRot.current.y += rotDiff * 0.3;

      groupRef.current.position.copy(currentPos.current);
      groupRef.current.rotation.copy(currentRot.current);
      lightRef.current.position.copy(currentPos.current);
    }
  });

  const wheelRadius = 0.7;
  const wheelWidth = 0.4;
  
  // The group is lifted by the wheel radius so the wheels sit on the grid.
  return (
    <>
      <group ref={groupRef} castShadow position={[0, wheelRadius, 0]}>
        {/* Body - Made wider, taller, and raised to be visible */}
        <mesh position={[0, 0.1, 0]}>
          <boxGeometry args={[1.2, 0.6, 2.8]} />
          <meshStandardMaterial 
            color="#cccccc"
            metalness={0.9}
            roughness={0.1}
          />
        </mesh>
         {/* Canopy - Made wider and raised to sit on the new body */}
        <mesh position={[0, 0.5, -0.3]}>
          <boxGeometry args={[1.0, 0.2, 1.8]} />
            <meshStandardMaterial 
              color="#111111"
              metalness={0.95}
              roughness={0.05}
              transparent
              opacity={0.8}
            />
        </mesh>
        {/* Front Wheel - Vertically centered with the group */}
        <mesh position={[0, 0, -1.3]} rotation={[Math.PI / 2, 0, 0]}>
            <cylinderGeometry args={[wheelRadius, wheelRadius, wheelWidth, 32]} />
            <meshStandardMaterial 
                color={player.current.color} 
                emissive={player.current.color} 
                emissiveIntensity={player.current.activePowerUp.type ? 8 : 4} 
                toneMapped={false}
            />
        </mesh>
        {/* Back Wheel - Vertically centered with the group */}
        <mesh position={[0, 0, 1.3]} rotation={[Math.PI / 2, 0, 0]}>
            <cylinderGeometry args={[wheelRadius, wheelRadius, wheelWidth, 32]} />
            <meshStandardMaterial 
                color={player.current.color} 
                emissive={player.current.color} 
                emissiveIntensity={player.current.activePowerUp.type ? 8 : 4} 
                toneMapped={false}
            />
        </mesh>
      </group>
      {/* The main pointLight should follow the cycle */}
      <pointLight 
        ref={lightRef} 
        color={player.current.color} 
        intensity={5} 
        distance={15} 
        decay={2}
      />
    </>
  );
};
