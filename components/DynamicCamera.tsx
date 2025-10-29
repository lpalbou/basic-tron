
import React, { useRef, useCallback, useLayoutEffect, useEffect } from 'react';
import { useThree, useFrame } from '@react-three/fiber';
import { OrbitControls } from '@react-three/drei';
import { Vector3, Euler, MathUtils, MOUSE } from 'three';
import type { Player, CameraView, CameraState, Direction, GameState } from '../types';

interface DynamicCameraProps {
  cameraView: CameraView;
  playerRef: React.MutableRefObject<Player>;
  savedCameraState: CameraState;
  onCameraChange: (newState: CameraState) => void;
  gameState: GameState;
}

// Helper map for rotation
const directionToRotation = new Map<Direction, number>([
  ['UP', 0],
  ['DOWN', Math.PI],
  ['LEFT', Math.PI / 2],
  ['RIGHT', -Math.PI / 2],
]);

const ThirdPersonCameraControls: React.FC<Omit<DynamicCameraProps, 'cameraView' | 'playerRef'> & { isPaused: boolean }> = ({
    savedCameraState,
    onCameraChange,
    isPaused
}) => {
    const controlsRef = useRef<any>(null!);
    const { camera } = useThree();

    useLayoutEffect(() => {
        if (controlsRef.current) {
            camera.position.fromArray(savedCameraState.position);
            controlsRef.current.target.fromArray(savedCameraState.target);
            controlsRef.current.update();
        }
    }, []); 

    const handleControlsChange = useCallback(() => {
        if (controlsRef.current) {
            onCameraChange({
                position: controlsRef.current.object.position.toArray(),
                target: controlsRef.current.target.toArray(),
            });
        }
    }, [onCameraChange]);

    return (
        <OrbitControls
          ref={controlsRef}
          onChange={handleControlsChange}
          enabled={isPaused} // Only enable controls when paused
          minPolarAngle={isPaused ? 0 : 0.1} // Allow full rotation when paused
          maxPolarAngle={isPaused ? Math.PI : Math.PI / 2 - 0.1}
          enablePan={isPaused} // Enable panning when paused
          minDistance={isPaused ? 1 : 30} // Allow much closer zoom when paused
          maxDistance={isPaused ? 1000 : 150} // Allow much further zoom when paused
          zoomSpeed={0.5}
          panSpeed={1.0}
          rotateSpeed={0.8}
          // Explicitly set mouse button mappings
          mouseButtons={{
            LEFT: MOUSE.ROTATE,   // LEFT mouse button for rotation
            MIDDLE: MOUSE.DOLLY,  // MIDDLE mouse button for zoom
            RIGHT: MOUSE.PAN      // RIGHT mouse button for panning
          }}
        />
    );
};

export const DynamicCamera: React.FC<DynamicCameraProps> = ({
  cameraView,
  playerRef,
  savedCameraState,
  onCameraChange,
  gameState
}) => {
  const { camera } = useThree();
  
  const smoothPos = useRef(new Vector3(...playerRef.current.position));
  const smoothRot = useRef(new Euler(0, directionToRotation.get(playerRef.current.direction) ?? 0, 0));

  // --- Camera Shake State ---
  const shakeIntensity = useRef(0);
  const shakeDuration = useRef(0);
  const initialShakeDuration = useRef(1);
  const time = useRef(0);
  const trailShakeIntensity = useRef(0);

  // --- Event Listeners for Shake ---
  useEffect(() => {
    const handleCameraShake = (e: Event) => {
      const { detail } = e as CustomEvent;
      shakeIntensity.current = detail.intensity ?? 0.5;
      shakeDuration.current = detail.duration ?? 0.5;
      initialShakeDuration.current = detail.duration ?? 0.5;
    };
    
    const handleTrailProximity = (e: Event) => {
        const { detail } = e as CustomEvent;
        trailShakeIntensity.current = detail.proximity > 0 ? 0.03 : 0;
    };

    window.addEventListener('camera-shake', handleCameraShake);
    window.addEventListener('trail-proximity', handleTrailProximity);
    return () => {
      window.removeEventListener('camera-shake', handleCameraShake);
      window.removeEventListener('trail-proximity', handleTrailProximity);
    };
  }, []);

  useFrame((state, delta) => {
    time.current = state.clock.elapsedTime;
    
    // In pause mode with THIRD_PERSON view, let OrbitControls handle the camera completely
    const isPaused = gameState === 'PAUSED';
    if (isPaused && cameraView === 'THIRD_PERSON') {
      return; // OrbitControls will handle camera positioning
    }
    
    if (cameraView !== 'THIRD_PERSON') {
      const p = playerRef.current;
      
      const targetPosition = new Vector3(...p.position);
      smoothPos.current.lerp(targetPosition, 0.4);

      const targetRotationY = directionToRotation.get(p.direction) ?? 0;
      let rotDiff = targetRotationY - smoothRot.current.y;
      while (rotDiff > Math.PI) rotDiff -= 2 * Math.PI;
      while (rotDiff < -Math.PI) rotDiff += 2 * Math.PI;
      smoothRot.current.y += rotDiff * 0.3;
      
      if (gameState === 'PAUSED') return;

      if (cameraView === 'FIRST_PERSON') {
        // Moved camera further forward (from -2.5 to -4.5) to prevent clipping into the longer bike model.
        // Also slightly raised it for a better view over the front wheel arch.
        const cameraOffset = new Vector3(0, 0.8, -4.5);
        cameraOffset.applyEuler(smoothRot.current);
        camera.position.copy(smoothPos.current).add(cameraOffset);

        // Look slightly further ahead for a better sense of speed.
        const lookAtOffset = new Vector3(0, 0.5, -15);
        lookAtOffset.applyEuler(smoothRot.current);
        camera.lookAt(smoothPos.current.clone().add(lookAtOffset));

      } else { // FOLLOW mode - New "Chase Cam" logic
        // Shift camera to the right and position it behind and above
        const cameraOffset = new Vector3(2.5, 6, 12); // x=2.5 is half the previous offset
        cameraOffset.applyEuler(smoothRot.current);
        camera.position.copy(smoothPos.current).add(cameraOffset);

        // Target a point well in front of the bike for a proactive chase-cam feel
        const lookAtOffset = new Vector3(0, 2, -15); // Look slightly up and far ahead
        lookAtOffset.applyEuler(smoothRot.current);
        const lookAtPosition = smoothPos.current.clone().add(lookAtOffset);
        camera.lookAt(lookAtPosition);
      }
    }

    // --- Apply Camera Shake ---
    let currentShake = 0;

    // 1. Crash/Event Shake
    if (shakeDuration.current > 0) {
        // Falloff shake intensity over duration
        const falloff = Math.pow(shakeDuration.current / initialShakeDuration.current, 2);
        currentShake = shakeIntensity.current * falloff;
        shakeDuration.current -= delta;
    }

    // 2. Speed Boost Shake (additive)
    const p = playerRef.current;
    if (p.isAlive && p.activePowerUp.type === 'SPEED_BOOST') {
        // A subtle, high-frequency vibration
        const boostShake = 0.04;
        currentShake += (boostShake * (Math.sin(time.current * 50) + Math.sin(time.current * 70))) / 2;
    }

    // 3. Trail Proximity Shake (additive)
    if (trailShakeIntensity.current > 0) {
        currentShake += (trailShakeIntensity.current * (Math.sin(time.current * 60) + Math.sin(time.current * 80))) / 2;
    }

    // Apply shake (but not when paused)
    if (currentShake > 0 && !isPaused) {
        camera.position.x += MathUtils.randFloatSpread(currentShake);
        camera.position.y += MathUtils.randFloatSpread(currentShake);
        camera.position.z += MathUtils.randFloatSpread(currentShake);
    }
  });

  return cameraView === 'THIRD_PERSON' ? (
    <ThirdPersonCameraControls 
        savedCameraState={savedCameraState}
        onCameraChange={onCameraChange}
        isPaused={gameState === 'PAUSED'}
    />
  ) : null;
};
