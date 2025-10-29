
import React, { useRef, useMemo, useEffect } from 'react';
import { useFrame } from '@react-three/fiber';
import { Group, Vector3, PointLight, Euler, Mesh, BufferAttribute, Material, MathUtils } from 'three';
import type { MeshStandardMaterial, BufferGeometry } from 'three';
import type { Player, GameState } from '../types';
import { createDerezzMaterial } from './DerezzMaterial';
import { BikeModel3D } from './BikeModel3D';

const directionToRotation = new Map<Player['direction'], number>([
  ['UP', 0],
  ['DOWN', Math.PI],
  ['LEFT', Math.PI / 2],
  ['RIGHT', -Math.PI / 2],
]);

// Helper to add a random attribute to geometry for the shader
const addRandomAttribute = (geometry: BufferGeometry) => {
    if (!geometry.attributes.aRandom) {
        const count = geometry.attributes.position.count;
        const randoms = new Float32Array(count);
        for (let i = 0; i < count; i++) {
            randoms[i] = Math.random();
        }
        geometry.setAttribute('aRandom', new BufferAttribute(randoms, 1));
    }
};


export const LightCycle: React.FC<{ player: React.MutableRefObject<Player>; gameState: GameState }> = ({ player, gameState }) => {
  const groupRef = useRef<Group>(null!);
  const lightRef = useRef<PointLight>(null!);
  const crashLightRef = useRef<PointLight>(null!);
  
  // Rezzing state
  const isRezzing = useRef(false);
  const rezzStartTime = useRef(0);
  const COUNTDOWN_DURATION = 2.0; // From App.tsx logic
  
  // Derezzing state
  const isDerezzing = useRef(false);
  const wasAlive = useRef(player.current.isAlive);
  const derezzStartTime = useRef(0);
  const DEREZZ_DURATION = 1.5; // seconds

  const derezzMaterial = useMemo(() => createDerezzMaterial(), []);
  const rezzMaterial = useMemo(() => createDerezzMaterial(), []);
  const originalMaterials = useRef(new Map<string, Material | Material[]>());

  // Add random attributes to all geometries once on mount, so it's ready for the crash.
  useEffect(() => {
    groupRef.current?.traverse((child) => {
        if (child instanceof Mesh) {
            addRandomAttribute(child.geometry);
        }
    });
  }, []);

  const currentPos = useRef(new Vector3(...player.current.position));
  const currentRot = useRef(new Euler(0, directionToRotation.get(player.current.direction) ?? 0, 0));

  useFrame((state) => {
    if (!groupRef.current || !lightRef.current) return;
    
    const p = player.current;

    // --- Rezzing In Animation Trigger ---
    if (gameState === 'COUNTDOWN' && !isRezzing.current) {
        isRezzing.current = true;
        isDerezzing.current = false;
        rezzStartTime.current = state.clock.elapsedTime;
        
        originalMaterials.current.clear();
        rezzMaterial.uniforms.uColor.value.set(p.color);
        groupRef.current.traverse((child) => {
            if (child instanceof Mesh) {
                originalMaterials.current.set(child.uuid, child.material);
                child.material = rezzMaterial;
            }
        });
        groupRef.current.visible = true;
    }

    // --- Rezzing Animation Update ---
    if (isRezzing.current) {
        const progress = (state.clock.elapsedTime - rezzStartTime.current) / COUNTDOWN_DURATION;
        const easedProgress = Math.min(progress, 1.0);
        
        // Animate progress from 1 (dissolved) to 0 (solid)
        rezzMaterial.uniforms.uProgress.value = 1.0 - easedProgress;

        if (progress >= 1.0) {
            isRezzing.current = false;
            // Restore original materials
            groupRef.current.traverse((child) => {
                if (child instanceof Mesh && originalMaterials.current.has(child.uuid)) {
                    child.material = originalMaterials.current.get(child.uuid)!;
                }
            });
        }
    }

    // --- Derezzing Animation Trigger ---
    if (wasAlive.current && !p.isAlive && !isDerezzing.current && !isRezzing.current) {
        isDerezzing.current = true;
        derezzStartTime.current = state.clock.elapsedTime;
        
        originalMaterials.current.clear();
        derezzMaterial.uniforms.uColor.value.set(p.color);
        groupRef.current.traverse((child) => {
            if (child instanceof Mesh) {
                originalMaterials.current.set(child.uuid, child.material);
                child.material = derezzMaterial;
            }
        });
        groupRef.current.visible = true;
        if (crashLightRef.current) {
            crashLightRef.current.intensity = 30;
            crashLightRef.current.visible = true;
        }
    }
    wasAlive.current = p.isAlive;

    // --- Derezzing Animation Update ---
    if (isDerezzing.current) {
        const progress = (state.clock.elapsedTime - derezzStartTime.current) / DEREZZ_DURATION;
        const easedProgress = Math.min(progress, 1.0);
        derezzMaterial.uniforms.uProgress.value = easedProgress;
        
        if (crashLightRef.current) {
            // Fade out the light faster than the model dissolves
            crashLightRef.current.intensity = Math.max(0, 30 * (1.0 - easedProgress * 2));
        }
        
        if (progress >= 1.0) {
            isDerezzing.current = false;
            groupRef.current.visible = false;
            if (crashLightRef.current) {
                crashLightRef.current.visible = false;
            }
            // Restore materials for next round
            groupRef.current.traverse((child) => {
                if (child instanceof Mesh && originalMaterials.current.has(child.uuid)) {
                    child.material = originalMaterials.current.get(child.uuid)!;
                }
            });
        }
    } else if (!isRezzing.current) {
        // --- Normal Visibility Update ---
        groupRef.current.visible = p.isAlive;
    }
    
    lightRef.current.visible = p.isAlive && !isRezzing.current;
    
    if (gameState === 'PAUSED') return;

     // --- Frozen Visual Effect ---
    if (p.frozenFor > 0) {
        lightRef.current.intensity = Math.random() * 8 + 2;
        const jitter = 0.05;
        // Jitter from the smoothed position to prevent drifting away
        groupRef.current.position.copy(currentPos.current).add(
            new Vector3(
                MathUtils.randFloatSpread(jitter),
                0,
                MathUtils.randFloatSpread(jitter)
            )
        );
        return;
    }
    
    // Exit early if the bike is fully dead and not animating
    if (!p.isAlive && !isDerezzing.current) return;

    // --- Normal Movement Logic ---
    const powerUpActive = p.activePowerUp.type !== null && p.activePowerUp.type !== 'TRAIL_SHRINK';
    lightRef.current.intensity = powerUpActive ? 10 : 5;
    
    const targetPosition = new Vector3(...p.position);
    currentPos.current.lerp(targetPosition, 0.4); 
    
    const targetRotationY = directionToRotation.get(p.direction) ?? 0;
    let rotDiff = targetRotationY - currentRot.current.y;
    while (rotDiff > Math.PI) rotDiff -= 2 * Math.PI;
    while (rotDiff < -Math.PI) rotDiff += 2 * Math.PI;
    currentRot.current.y += rotDiff * 0.3;

    const bankAngle = Math.PI / 7;
    const targetBank = Math.abs(rotDiff) > 0.01 ? bankAngle * Math.sign(rotDiff) : 0;
    currentRot.current.z += (targetBank - currentRot.current.z) * 0.2;

    // Update positions of all relevant objects
    groupRef.current.position.copy(currentPos.current);
    groupRef.current.rotation.copy(currentRot.current);
    lightRef.current.position.copy(currentPos.current);
    if(crashLightRef.current) {
        crashLightRef.current.position.copy(currentPos.current);
    }
  });

  return (
    <>
      <group ref={groupRef} castShadow>
        <BikeModel3D player={player} gameState={gameState} />
      </group>
      <pointLight 
        ref={lightRef} 
        color={player.current.color} 
        intensity={5} 
        distance={15} 
        decay={2}
      />
      <pointLight 
        ref={crashLightRef} 
        color={player.current.color} 
        intensity={0} 
        distance={25} 
        decay={2}
        visible={false}
      />
    </>
  );
};