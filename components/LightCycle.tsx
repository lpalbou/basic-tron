import React, { useRef } from 'react';
import { useFrame } from '@react-three/fiber';
import { Group, Vector3, PointLight, Euler, Mesh } from 'three';
import type { MeshStandardMaterial } from 'three';
import type { Player, GameState } from '../types';

const directionToRotation = new Map<Player['direction'], number>([
  ['UP', 0],
  ['DOWN', Math.PI],
  ['LEFT', Math.PI / 2],
  ['RIGHT', -Math.PI / 2],
]);

// A dedicated sub-component for the new "Tron-like" hubless wheels.
const Wheel: React.FC<{ playerRef: React.MutableRefObject<Player>; position: [number, number, number]; gameState: GameState }> = ({ playerRef, position, gameState }) => {
  const innerSpokesRef = useRef<Group>(null!);
  const outerRingMaterialRef = useRef<MeshStandardMaterial>(null!);
  const { color } = playerRef.current;

  useFrame((_, delta) => {
    if (gameState !== 'PLAYING') return;

    // Animate the inner spokes to rotate around their axle.
    if (innerSpokesRef.current) {
      innerSpokesRef.current.rotation.x -= delta * 12; // Rotate on X-axis for forward spin
    }
    // Update the glow intensity based on power-up state
    if (outerRingMaterialRef.current) {
      const p = playerRef.current;
      const powerUpActive = p.activePowerUp.type !== null && p.activePowerUp.type !== 'TRAIL_SHRINK';
      outerRingMaterialRef.current.emissiveIntensity = powerUpActive ? 8 : 4;
    }
  });

  // Re-proportioned wheel for a larger inner hole
  const wheelRadius = 0.8; 
  const ringThickness = 0.2;
  
  return (
    <group position={position}>
      {/* Outer glowing ring - Rotated to be upright */}
      <mesh rotation={[0, Math.PI / 2, 0]}>
        <torusGeometry args={[wheelRadius, ringThickness, 16, 64]} />
        <meshStandardMaterial
          ref={outerRingMaterialRef}
          color={color}
          emissive={color}
          emissiveIntensity={4}
          toneMapped={false}
        />
      </mesh>
      {/* Inner rotating spokes */}
      <group ref={innerSpokesRef} rotation={[0, Math.PI / 2, 0]}>
         <mesh>
            <boxGeometry args={[wheelRadius * 1.85, 0.08, 0.24]} />
            <meshStandardMaterial color="#333333" metalness={0.9} roughness={0.2} />
         </mesh>
         <mesh rotation={[0, 0, Math.PI / 3]}>
            <boxGeometry args={[wheelRadius * 1.85, 0.08, 0.24]} />
            <meshStandardMaterial color="#333333" metalness={0.9} roughness={0.2} />
         </mesh>
         <mesh rotation={[0, 0, -Math.PI / 3]}>
            <boxGeometry args={[wheelRadius * 1.85, 0.08, 0.24]} />
            <meshStandardMaterial color="#333333" metalness={0.9} roughness={0.2} />
         </mesh>
      </group>
    </group>
  );
};


export const LightCycle: React.FC<{ player: React.MutableRefObject<Player>; gameState: GameState }> = ({ player, gameState }) => {
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
    
    if (gameState === 'PAUSED') return;

    if (p.isAlive) {
      const targetPosition = new Vector3(...p.position);
      currentPos.current.lerp(targetPosition, 0.4); 
      
      const targetRotationY = directionToRotation.get(p.direction) ?? 0;
      let rotDiff = targetRotationY - currentRot.current.y;
      while (rotDiff > Math.PI) rotDiff -= 2 * Math.PI;
      while (rotDiff < -Math.PI) rotDiff += 2 * Math.PI;
      currentRot.current.y += rotDiff * 0.3;

      // --- NEW BANKING ANIMATION LOGIC ---
      const bankAngle = Math.PI / 7; // The maximum lean angle for the bike.
      // Determine the target bank angle based on the direction of the turn.
      // A non-zero rotDiff means the bike is currently turning towards its new direction.
      const targetBank = Math.abs(rotDiff) > 0.01 ? bankAngle * Math.sign(rotDiff) : 0;
      // Smoothly interpolate the bike's current bank angle (z-rotation) towards the target.
      currentRot.current.z += (targetBank - currentRot.current.z) * 0.2;
      // --- END BANKING ANIMATION LOGIC ---

      groupRef.current.position.copy(currentPos.current);
      groupRef.current.rotation.copy(currentRot.current);
      lightRef.current.position.copy(currentPos.current);
    }
  });

  return (
    <>
      <group ref={groupRef} castShadow>
        {/* --- New Detailed Bike Model --- */}
        
        {/* Main Body - Made longer */}
        <mesh position={[0, 0.4, 0.1]}>
            <boxGeometry args={[2.1, 0.3, 4.2]} />
            <meshStandardMaterial color="#101010" metalness={0.9} roughness={0.1} />
        </mesh>
        
        {/* Front Fender / Wheel Cover - Moved forward */}
        <mesh position={[0, 0.7, -2.0]} rotation={[0.4, 0, 0]}>
            <boxGeometry args={[2.1, 0.7, 0.7]} />
             <meshStandardMaterial color="#101010" metalness={0.9} roughness={0.1} />
        </mesh>
        
        {/* Rear Fender / Seat Area - Moved backward */}
        <mesh position={[0, 0.7, 2.0]} rotation={[-0.2, 0, 0]}>
            <boxGeometry args={[2.1, 0.5, 0.8]} />
            <meshStandardMaterial color="#101010" metalness={0.9} roughness={0.1} />
        </mesh>

        {/* Driver Torso */}
        <mesh position={[0, 0.9, 0.5]}>
            <boxGeometry args={[1.8, 0.6, 0.5]} />
            <meshStandardMaterial color="#050505" metalness={0.8} roughness={0.3} />
        </mesh>

        {/* Driver Helmet */}
        <mesh position={[0, 1.35, 0.25]}>
            <sphereGeometry args={[0.75, 16, 16]} />
             <meshStandardMaterial color="#151515" metalness={0.95} roughness={0.1} />
        </mesh>

        {/* New Hubless Wheels - Moved further apart */}
        <Wheel playerRef={player} position={[0, 0.7, -2.0]} gameState={gameState} />
        <Wheel playerRef={player} position={[0, 0.7, 2.0]} gameState={gameState} />
      </group>
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