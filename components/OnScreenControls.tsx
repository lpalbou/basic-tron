
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
}> = ({ onClick, className = '', children }) => (
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
    className={`w-16 h-16 flex items-center justify-center bg-gray-500 bg-opacity-30 rounded-full text-white text-2xl font-bold border-2 border-cyan-400 border-opacity-50 active:bg-cyan-400 active:bg-opacity-50 backdrop-blur-sm transition-all duration-100 ${className}`}
    style={{ textShadow: '0 0 5px #00ffff' }}
  >
    {children}
  </button>
);

export const OnScreenControls: React.FC = () => {
  return (
    <div className="absolute inset-0 z-20 pointer-events-none p-4 md:p-8 flex justify-between items-end">
      {/* D-Pad for movement (bottom-left) */}
      <div className="grid grid-cols-3 grid-rows-3 gap-2 w-52 h-52 pointer-events-auto">
        <div className="col-start-2">
          <ControlButton onClick={() => dispatchKeyEvent('ArrowUp')}>↑</ControlButton>
        </div>
        <div className="col-start-1">
          <ControlButton onClick={() => dispatchKeyEvent('ArrowLeft')}>←</ControlButton>
        </div>
        <div className="col-start-2">
          <ControlButton onClick={() => dispatchKeyEvent('ArrowDown')}>↓</ControlButton>
        </div>
        <div className="col-start-3">
          <ControlButton onClick={() => dispatchKeyEvent('ArrowRight')}>→</ControlButton>
        </div>
      </div>

      {/* Action Buttons for speed and camera (bottom-right) */}
      <div className="flex flex-col gap-4 pointer-events-auto">
        <ControlButton onClick={() => dispatchKeyEvent('x')} className="w-20 h-20 text-3xl">X</ControlButton>
        <ControlButton onClick={() => dispatchKeyEvent('v')} className="w-20 h-20 text-3xl">V</ControlButton>
      </div>
    </div>
  );
};
