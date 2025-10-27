
import React, { useMemo, useRef, useEffect } from 'react';
import { useFrame } from '@react-three/fiber';
import { Group, Mesh, Vector3, MathUtils, MeshStandardMaterial, Color } from 'three';

const MAX_PARTICLES = 100;
const EMIT_RATE = 4; // particles per event trigger

interface ParticleData {
  life: number;
  velocity: Vector3;
}

export const TrailSparks: React.FC = () => {
  const particleMeshes = useRef<Mesh[]>([]);
  const particleData = useRef<ParticleData[]>([]);
  const currentPoolIndex = useRef(0);
  const materials = useRef<MeshStandardMaterial[]>([]);

  // Initialize a pool of particle objects
  useMemo(() => {
    particleMeshes.current = [];
    particleData.current = [];
    materials.current = [];
    for (let i = 0; i < MAX_PARTICLES; i++) {
      particleData.current.push({
        life: 0,
        velocity: new Vector3(),
      });
      // Each particle gets its own material instance
      materials.current.push(
        new MeshStandardMaterial({
            color: '#ffff00',
            emissive: '#ffff00',
            emissiveIntensity: 10,
            transparent: true,
            toneMapped: false,
        })
      );
    }
  }, []);

  useEffect(() => {
    const handleTrailProximity = (e: Event) => {
        const { detail } = e as CustomEvent;
        if (detail.proximity > 0) {
            emitParticle(
                new Vector3(...detail.sparkPosition), 
                new Vector3(...detail.sparkNormal),
                detail.trailColor
            );
        }
    };
    
    window.addEventListener('trail-proximity', handleTrailProximity);
    return () => window.removeEventListener('trail-proximity', handleTrailProximity);
  }, []); // Empty dependency array means this runs once on mount

  const emitParticle = (position: Vector3, normal: Vector3, color: string) => {
    for (let i = 0; i < EMIT_RATE; i++) {
        const index = currentPoolIndex.current;
        const pData = particleData.current[index];
        const mesh = particleMeshes.current[index];
        const material = materials.current[index];

        pData.life = MathUtils.randFloat(0.2, 0.4);

        if (mesh) {
            mesh.position.copy(position);
            mesh.scale.set(1, 1, 1);

            material.color.set(color);
            material.emissive.set(color);
        }

        const spread = 3;
        pData.velocity
            .copy(normal)
            .multiplyScalar(MathUtils.randFloat(1, 4))
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
    // Update living particles
    for (let i = 0; i < MAX_PARTICLES; i++) {
      const pData = particleData.current[i];
      const mesh = particleMeshes.current[i];

      if (pData.life > 0) {
        pData.life -= delta;
        
        if (mesh) {
          pData.velocity.y -= 9.8 * delta * 0.5; // gravity
          mesh.position.addScaledVector(pData.velocity, delta);
          
          const lifeRatio = Math.max(0, pData.life / 0.4); // 0.4 is max life
          const scale = 0.1 * lifeRatio;
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
        <mesh 
          key={i} 
          ref={(el: Mesh) => { if (el) particleMeshes.current[i] = el; }} 
          scale={0}
          material={materials.current[i]}
        >
          <boxGeometry args={[1, 1, 1]} />
        </mesh>
      ))}
    </group>
  );
};
