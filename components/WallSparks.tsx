
import React, { useMemo, useRef } from 'react';
import { useFrame } from '@react-three/fiber';
import { Group, Mesh, Vector3, MathUtils, MeshStandardMaterial } from 'three';
import type { Player } from '../types';
import { GRID_SIZE } from '../constants';

const MAX_PARTICLES = 100;
const SPARK_THRESHOLD = 2.0;
const EMIT_RATE = 5; // particles per frame when grinding

interface ParticleData {
  life: number;
  velocity: Vector3;
}

interface WallSparksProps {
  playerRef: React.MutableRefObject<Player>;
}

export const WallSparks: React.FC<WallSparksProps> = ({ playerRef }) => {
  const particleMeshes = useRef<Mesh[]>([]);
  const particleData = useRef<ParticleData[]>([]);
  const currentPoolIndex = useRef(0);
  const smoothPos = useRef(new Vector3(...playerRef.current.position));

  // Initialize a pool of particle objects
  useMemo(() => {
    particleMeshes.current = [];
    particleData.current = [];
    for (let i = 0; i < MAX_PARTICLES; i++) {
      particleData.current.push({
        life: 0,
        velocity: new Vector3(),
      });
    }
  }, []);

  const emitParticle = (position: Vector3, wallNormal: Vector3) => {
    for (let i = 0; i < EMIT_RATE; i++) {
        const index = currentPoolIndex.current;
        const pData = particleData.current[index];

        pData.life = MathUtils.randFloat(0.2, 0.5);

        const mesh = particleMeshes.current[index];
        if (mesh) {
            mesh.position.copy(position);
            mesh.scale.set(1, 1, 1);
        }

        const spread = 4;
        pData.velocity
            .copy(wallNormal)
            .multiplyScalar(MathUtils.randFloat(2, 5))
            .add(
                new Vector3(
                    MathUtils.randFloatSpread(spread),
                    MathUtils.randFloatSpread(spread),
                    MathUtils.randFloatSpread(spread)
                )
            );

        currentPoolIndex.current = (currentPoolIndex.current + 1) % MAX_PARTICLES;
    }
  };

  useFrame((_, delta) => {
    const player = playerRef.current;
    if (!player.isAlive) return;

    smoothPos.current.lerp(new Vector3(...player.position), 0.4);
    const [x, y, z] = smoothPos.current.toArray();
    const halfGrid = GRID_SIZE / 2;

    const dists = {
      left: x + halfGrid,
      right: halfGrid - x,
      up: z + halfGrid,
      down: halfGrid - z,
    };

    if (dists.left < SPARK_THRESHOLD) {
      emitParticle(new Vector3(-halfGrid + 0.1, y, z), new Vector3(1, 0, 0));
    }
    if (dists.right < SPARK_THRESHOLD) {
      emitParticle(new Vector3(halfGrid - 0.1, y, z), new Vector3(-1, 0, 0));
    }
    if (dists.up < SPARK_THRESHOLD) {
      emitParticle(new Vector3(x, y, -halfGrid + 0.1), new Vector3(0, 0, 1));
    }
    if (dists.down < SPARK_THRESHOLD) {
      emitParticle(new Vector3(x, y, halfGrid - 0.1), new Vector3(0, 0, -1));
    }

    // Update living particles
    for (let i = 0; i < MAX_PARTICLES; i++) {
      const pData = particleData.current[i];
      const mesh = particleMeshes.current[i];

      if (pData.life > 0) {
        pData.life -= delta;
        
        if (mesh) {
          pData.velocity.y -= 9.8 * delta; // gravity
          mesh.position.addScaledVector(pData.velocity, delta);
          
          const lifeRatio = Math.max(0, pData.life / 0.5);
          const scale = 0.15 * lifeRatio;
          mesh.scale.set(scale, scale, scale);
          
          (mesh.material as MeshStandardMaterial).opacity = lifeRatio;
        }
      } else if (mesh && mesh.scale.x > 0) {
        mesh.scale.set(0, 0, 0);
      }
    }
  });

  return (
    <group>
      {particleData.current.map((_, i) => (
        <mesh key={i} ref={(el: Mesh) => { if (el) particleMeshes.current[i] = el; }} scale={0}>
          <boxGeometry args={[1, 1, 1]} />
          <meshStandardMaterial
            color="#ffff00"
            emissive="#ffff00"
            emissiveIntensity={10}
            transparent
            toneMapped={false}
          />
        </mesh>
      ))}
    </group>
  );
};
