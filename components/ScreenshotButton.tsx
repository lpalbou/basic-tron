import React from 'react';

interface ScreenshotButtonProps {
  gameState: string;
}

export const ScreenshotButton: React.FC<ScreenshotButtonProps> = ({ gameState }) => {
  const takeScreenshot = () => {
    // Dispatch a custom event that will be caught inside the Canvas
    const event = new CustomEvent('take-screenshot');
    window.dispatchEvent(event);
  };

  // Only show in pause mode
  if (gameState !== 'PAUSED') {
    return null;
  }

  return (
    <div className="absolute bottom-4 right-4 z-30">
      <button
        onClick={takeScreenshot}
        className="w-12 h-12 bg-gray-700 bg-opacity-40 rounded-full text-2xl flex items-center justify-center border-2 border-cyan-400 border-opacity-50 hover:bg-cyan-400 hover:bg-opacity-50 transition-colors backdrop-blur-sm"
        aria-label="Take screenshot"
        title="Take screenshot (Pause mode only)"
      >
        📷
      </button>
    </div>
  );
};
