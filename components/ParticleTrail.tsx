
import React, { useMemo, useRef } from 'react';
import { useFrame } from '@react-three/fiber';
import { Group, Mesh, Vector3, MathUtils, Euler } from 'three';
import type { Player, GameState } from '../types';
import type { MeshStandardMaterial } from 'three';
import { POWERUP_INVINCIBILITY_COLOR, POWERUP_SPEED_BOOST_COLOR } from '../constants';

const MAX_PARTICLES = 50;
const EMIT_INTERVAL = 0.04; // Emit particles frequently for a smooth trail

interface ParticleData {
  life: number;
  velocity: Vector3;
  scale: number;
}

interface ParticleTrailProps {
  playerRef: React.MutableRefObject<Player>;
  gameState: GameState;
}

const directionToRotation = new Map<Player['direction'], number>([
  ['UP', 0],
  ['DOWN', Math.PI],
  ['LEFT', Math.PI / 2],
  ['RIGHT', -Math.PI / 2],
]);

export const ParticleTrail: React.FC<ParticleTrailProps> = ({ playerRef, gameState }) => {
  const groupRef = useRef<Group>(null!);
  const particleMeshes = useRef<Mesh[]>([]);
  const particleData = useRef<ParticleData[]>([]);
  const emitTimer = useRef(0);
  const currentPoolIndex = useRef(0);

  // Use interpolated position and rotation to match the smooth movement of the LightCycle
  const smoothPos = useRef(new Vector3(...playerRef.current.position));
  const smoothRot = useRef(new Euler(0, directionToRotation.get(playerRef.current.direction) ?? 0, 0));

  const { color } = playerRef.current;

  // Initialize a pool of particle objects for performance
  useMemo(() => {
    particleMeshes.current = [];
    particleData.current = [];
    for (let i = 0; i < MAX_PARTICLES; i++) {
      particleData.current.push({
        life: 0,
        velocity: new Vector3(),
        scale: 0,
      });
    }
  }, []);

  useFrame((_, delta) => {
    if (!groupRef.current) return;
    
    const player = playerRef.current;
    
    // Smoothly interpolate position and rotation to follow the light cycle seamlessly
    const targetPosition = new Vector3(...player.position);
    smoothPos.current.lerp(targetPosition, 0.4);
    
    const targetRotationY = directionToRotation.get(player.direction) ?? 0;
    let rotDiff = targetRotationY - smoothRot.current.y;
    while (rotDiff > Math.PI) rotDiff -= 2 * Math.PI;
    while (rotDiff < -Math.PI) rotDiff += 2 * Math.PI;
    smoothRot.current.y += rotDiff * 0.3;

    if (gameState === 'PAUSED') return;

    // --- Particle Emission Logic ---
    emitTimer.current += delta;
    if (player.isAlive && gameState === 'PLAYING' && emitTimer.current >= EMIT_INTERVAL) {
      emitTimer.current = 0;
      
      const index = currentPoolIndex.current;
      const pData = particleData.current[index];

      // Activate a particle from the pool
      pData.life = MathUtils.randFloat(0.4, 0.7);
      pData.scale = MathUtils.randFloat(0.1, 0.25);

      // Emitter position is at the back of the cycle
      const backDirection = new Vector3(0, 0, 1).applyEuler(smoothRot.current);
      const emitPosition = smoothPos.current.clone().add(backDirection.clone().multiplyScalar(1.4));
      emitPosition.y = 0.5; // Keep particles slightly above the grid

      const mesh = particleMeshes.current[index];
      if (mesh) {
        mesh.position.copy(emitPosition);
      }

      // Give particle a velocity with some random spread for a "wake" effect
      const spread = 1.5;
      pData.velocity.set(
        MathUtils.randFloatSpread(spread),
        MathUtils.randFloatSpread(spread * 0.5),
        MathUtils.randFloatSpread(spread)
      );
      pData.velocity.add(backDirection.multiplyScalar(MathUtils.randFloat(0.2, 0.5)));

      currentPoolIndex.current = (currentPoolIndex.current + 1) % MAX_PARTICLES;
    }

    // --- Particle Update Logic ---
    let currentColor = player.color;
    if (player.activePowerUp.type === 'INVINCIBILITY') {
        currentColor = POWERUP_INVINCIBILITY_COLOR;
    } else if (player.activePowerUp.type === 'SPEED_BOOST') {
        currentColor = POWERUP_SPEED_BOOST_COLOR;
    }
    const firstParticleMaterial = particleMeshes.current[0]?.material as MeshStandardMaterial;
    const needsColorUpdate = firstParticleMaterial && firstParticleMaterial.color.getHexString() !== currentColor.substring(1);

    for (let i = 0; i < MAX_PARTICLES; i++) {
      const pData = particleData.current[i];
      const mesh = particleMeshes.current[i];

      if (pData.life > 0) {
        pData.life -= delta;
        
        if (mesh) {
          // Update position based on velocity
          mesh.position.addScaledVector(pData.velocity, delta);
          
          // Shrink and fade the particle over its lifetime
          const lifeRatio = Math.max(0, pData.life / 0.7); // 0.7 is max life
          const scale = pData.scale * lifeRatio;
          mesh.scale.set(scale, scale, scale);
          
          const material = mesh.material as MeshStandardMaterial;
          material.opacity = lifeRatio;

          if (needsColorUpdate) {
            material.color.set(currentColor);
            material.emissive.set(currentColor);
          }
        }
      } else if (mesh && mesh.scale.x > 0) {
        // Hide dead particles efficiently by setting scale to 0
        mesh.scale.set(0, 0, 0);
      }
    }
  });

  return (
    <group ref={groupRef}>
      {particleData.current.map((_, i) => (
        <mesh key={i} ref={(el: Mesh) => { if (el) particleMeshes.current[i] = el; }} scale={0}>
          <sphereGeometry args={[1, 8, 8]} />
          <meshStandardMaterial
            color={color}
            emissive={color}
            emissiveIntensity={4}
            transparent
            toneMapped={false}
          />
        </mesh>
      ))}
    </group>
  );
};