import React from 'react';
import type { GameState, CameraView, DeviceType } from '../types';

interface PauseControlsProps {
  gameState: GameState;
  cameraView: CameraView;
  deviceType: DeviceType;
}

export const PauseControls: React.FC<PauseControlsProps> = ({ gameState, cameraView, deviceType }) => {
  if (gameState !== 'PAUSED' || cameraView !== 'THIRD_PERSON') {
    return null;
  }

  const isTouchDevice = deviceType === 'phone' || deviceType === 'tablet';

  return (
    <div className="absolute bottom-4 left-4 z-30 bg-black bg-opacity-50 rounded-lg p-3 text-white text-sm backdrop-blur-sm">
      <div className="font-bold mb-2">Pause Mode Controls:</div>
      <div className="space-y-1">
        {isTouchDevice ? (
          <>
            <div><kbd className="bg-gray-700 px-1 rounded">Touch + Drag</kbd> Rotate camera</div>
            <div><kbd className="bg-gray-700 px-1 rounded">Two-finger drag</kbd> Pan camera</div>
            <div><kbd className="bg-gray-700 px-1 rounded">Pinch</kbd> Zoom in/out</div>
            <div><kbd className="bg-gray-700 px-1 rounded">📷</kbd> Take screenshot</div>
          </>
        ) : (
          <>
            <div><kbd className="bg-gray-700 px-1 rounded">Left Click + Drag</kbd> Rotate camera</div>
            <div><kbd className="bg-gray-700 px-1 rounded">Right Click + Drag</kbd> Pan camera</div>
            <div><kbd className="bg-gray-700 px-1 rounded">Scroll Wheel</kbd> Zoom in/out</div>
            <div><kbd className="bg-gray-700 px-1 rounded">📷</kbd> Take screenshot</div>
          </>
        )}
      </div>
    </div>
  );
};

