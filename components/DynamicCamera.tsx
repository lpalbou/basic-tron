import React, { useRef, useCallback, useLayoutEffect } from 'react';
import { useThree, useFrame } from '@react-three/fiber';
import { OrbitControls } from '@react-three/drei';
import { Vector3, Euler } from 'three';
import type { Player, CameraView, CameraState, Direction } from '../types';

interface DynamicCameraProps {
  cameraView: CameraView;
  playerRef: React.MutableRefObject<Player>;
  savedCameraState: CameraState;
  onCameraChange: (newState: CameraState) => void;
}

// Helper map for rotation
const directionToRotation = new Map<Direction, number>([
  ['UP', 0],
  ['DOWN', Math.PI],
  ['LEFT', Math.PI / 2],
  ['RIGHT', -Math.PI / 2],
]);

/**
 * A wrapper for OrbitControls that handles saving and restoring its state.
 * This component is designed to be mounted and unmounted, restoring its
 * state perfectly on each mount.
 */
const ThirdPersonCameraControls: React.FC<Omit<DynamicCameraProps, 'cameraView' | 'playerRef'>> = ({
    savedCameraState,
    onCameraChange
}) => {
    const controlsRef = useRef<any>(null!);
    const { camera } = useThree();

    // useLayoutEffect runs synchronously after all DOM mutations.
    // This is the correct hook to use for imperatively setting the state
    // of a DOM-like object (like OrbitControls) on mount to avoid flicker
    // and ensure it happens before the next paint.
    useLayoutEffect(() => {
        if (controlsRef.current) {
            // Restore camera position and target from the saved state
            camera.position.fromArray(savedCameraState.position);
            controlsRef.current.target.fromArray(savedCameraState.target);
            // Inform the controls that we have made a change
            controlsRef.current.update();
        }
    }, []); // Empty dependency array ensures this runs only ONCE on mount.

    const handleControlsChange = useCallback(() => {
        // When the user moves the camera, save the new state
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
          minPolarAngle={0.1}
          maxPolarAngle={Math.PI / 2 - 0.1}
          enablePan={false}
          minDistance={30}
          maxDistance={150}
          zoomSpeed={0.5}
        />
    );
};

/**
 * This component manages which camera logic is active based on the cameraView prop.
 * It renders the ThirdPersonCameraControls or applies FPS/Follow logic directly.
 */
export const DynamicCamera: React.FC<DynamicCameraProps> = ({
  cameraView,
  playerRef,
  savedCameraState,
  onCameraChange,
}) => {
  const { camera } = useThree();
  
  // Refs for smooth camera interpolation in Follow/FPS modes
  const smoothPos = useRef(new Vector3(...playerRef.current.position));
  const smoothRot = useRef(new Euler(0, directionToRotation.get(playerRef.current.direction) ?? 0, 0));

  useFrame(() => {
    // This frame loop is only for the non-OrbitControls views
    if (cameraView === 'THIRD_PERSON') {
      return; // OrbitControls is handling the camera
    }

    const p = playerRef.current;

    // Smoothly interpolate player's position and rotation for camera movement
    const targetPosition = new Vector3(...p.position);
    smoothPos.current.lerp(targetPosition, 0.4);

    const targetRotationY = directionToRotation.get(p.direction) ?? 0;
    let rotDiff = targetRotationY - smoothRot.current.y;
    while (rotDiff > Math.PI) rotDiff -= 2 * Math.PI;
    while (rotDiff < -Math.PI) rotDiff += 2 * Math.PI;
    smoothRot.current.y += rotDiff * 0.3;

    if (cameraView === 'FIRST_PERSON') {
      // Position the camera just behind and above the center of the bike
      const cameraOffset = new Vector3(0, 0.8, 0.5);
      cameraOffset.applyEuler(smoothRot.current);
      camera.position.copy(smoothPos.current).add(cameraOffset);

      // Point the camera forward
      const lookAtOffset = new Vector3(0, 0.6, -5);
      lookAtOffset.applyEuler(smoothRot.current);
      camera.lookAt(smoothPos.current.clone().add(lookAtOffset));
    } else { // FOLLOW mode
      // Position the camera behind and above the player
      const cameraOffset = new Vector3(0, 8, 15);
      cameraOffset.applyEuler(smoothRot.current);
      camera.position.copy(smoothPos.current).add(cameraOffset);

      // Look at a point slightly in front of the player
      const lookAtPosition = smoothPos.current.clone();
      lookAtPosition.y += 2;
      camera.lookAt(lookAtPosition);
    }
  });

  // Conditionally render the dedicated controls component.
  // This leverages React's mount/unmount lifecycle to reset and restore state correctly.
  return cameraView === 'THIRD_PERSON' ? (
    <ThirdPersonCameraControls 
        savedCameraState={savedCameraState}
        onCameraChange={onCameraChange}
    />
  ) : null;
};
