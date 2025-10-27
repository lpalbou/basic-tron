import React, { useRef, useCallback, useLayoutEffect } from 'react';
import { useThree, useFrame } from '@react-three/fiber';
import { OrbitControls } from '@react-three/drei';
import { Vector3, Euler } from 'three';
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

const ThirdPersonCameraControls: React.FC<Omit<DynamicCameraProps, 'cameraView' | 'playerRef' | 'gameState'>> = ({
    savedCameraState,
    onCameraChange
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
          minPolarAngle={0.1}
          maxPolarAngle={Math.PI / 2 - 0.1}
          enablePan={false}
          minDistance={30}
          maxDistance={150}
          zoomSpeed={0.5}
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

  useFrame(() => {
    if (cameraView === 'THIRD_PERSON') {
      return; 
    }

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
  });

  return cameraView === 'THIRD_PERSON' ? (
    <ThirdPersonCameraControls 
        savedCameraState={savedCameraState}
        onCameraChange={onCameraChange}
    />
  ) : null;
};
