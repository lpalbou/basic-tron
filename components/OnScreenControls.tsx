import React from 'react';
import type { DeviceType, CameraView } from '../types';

// Helper to dispatch keyboard events programmatically. This allows the UI buttons
// to "pretend" to be a real keyboard, simplifying the integration with existing logic.
const dispatchKeyEvent = (key: string) => {
  window.dispatchEvent(new KeyboardEvent('keydown', { key, bubbles: true }));
};

const ControlButton: React.FC<{
  onClick: () => void;
  className?: string;
  children: React.ReactNode;
  ariaLabel: string;
}> = ({ onClick, className = '', children, ariaLabel }) => (
  <button
    onTouchStart={(e) => {
      e.preventDefault(); // Prevent screen zoom and other default behaviors
      onClick();
    }}
    // Handle click for desktop/mouse users (but not onMouseDown to avoid double-firing on mobile)
    onClick={(e) => {
      // Only handle click if it's not a touch event (to avoid double-firing on mobile)
      if (e.detail === 0) { // detail === 0 indicates keyboard/programmatic click, not mouse
        return;
      }
      e.preventDefault();
      onClick();
    }}
    className={`flex items-center justify-center bg-gray-500 bg-opacity-30 rounded-full text-white font-bold border-2 border-cyan-400 border-opacity-50 active:bg-cyan-400 active:bg-opacity-50 backdrop-blur-sm transition-all duration-100 ${className}`}
    style={{ textShadow: '0 0 5px #00ffff' }}
    aria-label={ariaLabel}
  >
    {children}
  </button>
);

export const OnScreenControls: React.FC<{ deviceType: DeviceType; cameraView: CameraView }> = ({ deviceType, cameraView }) => {
  const isTablet = deviceType === 'tablet';
  
  // In FOLLOW and FIRST_PERSON modes, only left/right turns are available
  const showOnlyLeftRight = cameraView === 'FOLLOW' || cameraView === 'FIRST_PERSON';

  // --- Common button sizes ---
  const dpadButtonClass = isTablet ? "w-20 h-20 text-4xl" : "w-16 h-16 text-3xl";
  const actionButtonClass = "w-16 h-16 text-2xl";

  // --- Action Buttons (Right side) ---
  // For tablets, we remove the static bottom class to apply a dynamic style.
  const actionButtonsContainerClass = isTablet
    ? "absolute right-4 flex flex-col gap-4 pointer-events-auto"
    : "absolute bottom-20 right-4 flex flex-col gap-4 pointer-events-auto";
  
  // The style is only applied for tablets, pushing the controls up by 8vh from their base 5rem position, consistent with phones.
  const tabletStyle = isTablet ? { bottom: 'calc(5rem + 8vh)' } : {};

  const DPad = () => {
    if (showOnlyLeftRight) {
      // For FOLLOW and FIRST_PERSON modes, show only left/right controls in a horizontal layout
      const leftRightContainer = isTablet 
        ? "absolute left-4 flex gap-8 pointer-events-auto"
        : "absolute bottom-20 left-4 flex gap-4 pointer-events-auto";
      return (
        <div className={leftRightContainer} style={tabletStyle}>
          <ControlButton onClick={() => dispatchKeyEvent('ArrowLeft')} ariaLabel="Turn left" className={dpadButtonClass}>←</ControlButton>
          <ControlButton onClick={() => dispatchKeyEvent('ArrowRight')} ariaLabel="Turn right" className={dpadButtonClass}>→</ControlButton>
        </div>
      );
    }

    if (isTablet) {
      // Tablet uses a grid layout for a wider D-pad.
      const tabletDpadContainer = "absolute left-4 grid grid-cols-3 grid-rows-3 gap-px w-60 h-60 pointer-events-auto";
      return (
        <div className={tabletDpadContainer} style={tabletStyle}>
          <div className="col-start-2 row-start-1 flex justify-center items-center">
            <ControlButton onClick={() => dispatchKeyEvent('ArrowUp')} ariaLabel="Move up" className={dpadButtonClass}>↑</ControlButton>
          </div>
          <div className="col-start-1 row-start-2 flex justify-center items-center">
            <ControlButton onClick={() => dispatchKeyEvent('ArrowLeft')} ariaLabel="Move left" className={dpadButtonClass}>←</ControlButton>
          </div>
          <div className="col-start-2 row-start-3 flex justify-center items-center">
            <ControlButton onClick={() => dispatchKeyEvent('ArrowDown')} ariaLabel="Move down" className={dpadButtonClass}>↓</ControlButton>
          </div>
          <div className="col-start-3 row-start-2 flex justify-center items-center">
            <ControlButton onClick={() => dispatchKeyEvent('ArrowRight')} ariaLabel="Move right" className={dpadButtonClass}>→</ControlButton>
          </div>
        </div>
      );
    }

    // Use absolute positioning for phones to bring buttons closer together.
    // A 9.5rem (152px) container provides the perfect spacing for 4rem (64px) buttons
    // to touch with minimal overlap, improving on the previous w-36 (144px).
    const phoneDpadContainer = "absolute bottom-20 left-4 w-[9.5rem] h-[9.5rem] pointer-events-auto";
    return (
      <div className={phoneDpadContainer}>
        <div className="relative w-full h-full">
          <div className="absolute top-0 left-1/2 -translate-x-1/2">
            <ControlButton onClick={() => dispatchKeyEvent('ArrowUp')} ariaLabel="Move up" className={dpadButtonClass}>↑</ControlButton>
          </div>
          <div className="absolute left-0 top-1/2 -translate-y-1/2">
            <ControlButton onClick={() => dispatchKeyEvent('ArrowLeft')} ariaLabel="Move left" className={dpadButtonClass}>←</ControlButton>
          </div>
          <div className="absolute bottom-0 left-1/2 -translate-x-1/2">
            <ControlButton onClick={() => dispatchKeyEvent('ArrowDown')} ariaLabel="Move down" className={dpadButtonClass}>↓</ControlButton>
          </div>
          <div className="absolute right-0 top-1/2 -translate-y-1/2">
            <ControlButton onClick={() => dispatchKeyEvent('ArrowRight')} ariaLabel="Move right" className={dpadButtonClass}>→</ControlButton>
          </div>
        </div>
      </div>
    );
  };

  return (
    <div className="absolute inset-0 z-20 pointer-events-none p-4">
      {/* D-Pad for movement */}
      <DPad />

      {/* Action Buttons for speed and camera */}
      <div className={actionButtonsContainerClass} style={tabletStyle}>
        <ControlButton onClick={() => dispatchKeyEvent('x')} className={actionButtonClass} ariaLabel="Change speed">X</ControlButton>
        <ControlButton onClick={() => dispatchKeyEvent('v')} className={actionButtonClass} ariaLabel="Change camera view">V</ControlButton>
      </div>
    </div>
  );
};
