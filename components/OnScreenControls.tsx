import React from 'react';

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
    // Also handle mouse down for easier desktop debugging
    onMouseDown={(e) => {
      e.preventDefault();
      onClick();
    }}
    className={`w-14 h-14 flex items-center justify-center bg-gray-500 bg-opacity-30 rounded-full text-white text-2xl font-bold border-2 border-cyan-400 border-opacity-50 active:bg-cyan-400 active:bg-opacity-50 backdrop-blur-sm transition-all duration-100 ${className}`}
    style={{ textShadow: '0 0 5px #00ffff' }}
    aria-label={ariaLabel}
  >
    {children}
  </button>
);

export const OnScreenControls: React.FC = () => {
  return (
    <div className="absolute inset-0 z-20 pointer-events-none p-4">
      {/* D-Pad for movement (bottom-left) */}
      <div className="absolute bottom-4 left-4 grid grid-cols-3 grid-rows-3 gap-2 w-48 h-48 pointer-events-auto">
        <div className="col-start-2 row-start-1 flex justify-center items-center">
          <ControlButton onClick={() => dispatchKeyEvent('ArrowUp')} ariaLabel="Move up">↑</ControlButton>
        </div>
        <div className="col-start-1 row-start-2 flex justify-center items-center">
          <ControlButton onClick={() => dispatchKeyEvent('ArrowLeft')} ariaLabel="Move left">←</ControlButton>
        </div>
        <div className="col-start-2 row-start-3 flex justify-center items-center">
          <ControlButton onClick={() => dispatchKeyEvent('ArrowDown')} ariaLabel="Move down">↓</ControlButton>
        </div>
        <div className="col-start-3 row-start-2 flex justify-center items-center">
          <ControlButton onClick={() => dispatchKeyEvent('ArrowRight')} ariaLabel="Move right">→</ControlButton>
        </div>
      </div>

      {/* Action Buttons for speed and camera (bottom-right) */}
      <div className="absolute bottom-4 right-4 flex flex-col gap-4 pointer-events-auto">
        <ControlButton onClick={() => dispatchKeyEvent('x')} className="w-16 h-16 text-2xl" ariaLabel="Change speed">X</ControlButton>
        <ControlButton onClick={() => dispatchKeyEvent('v')} className="w-16 h-16 text-2xl" ariaLabel="Change camera view">V</ControlButton>
      </div>
    </div>
  );
};
