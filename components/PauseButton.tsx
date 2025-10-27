
import React from 'react';
import type { GameState } from '../types';

interface PauseButtonProps {
  gameState: GameState;
}

const dispatchKeyEvent = (key: string) => {
  window.dispatchEvent(new KeyboardEvent('keydown', { key, bubbles: true }));
};

export const PauseButton: React.FC<PauseButtonProps> = ({ gameState }) => {
  const isPaused = gameState === 'PAUSED';

  return (
    <div className="absolute top-4 right-4 z-30">
      <button
        onClick={() => dispatchKeyEvent('p')}
        className="w-12 h-12 bg-gray-700 bg-opacity-40 rounded-full text-2xl flex items-center justify-center border-2 border-gray-500 hover:bg-gray-600 transition-colors backdrop-blur-sm"
        aria-label={isPaused ? "Resume game" : "Pause game"}
        title={isPaused ? "Resume game" : "Pause game"}
      >
        {isPaused ? '▶' : '❚❚'}
      </button>
    </div>
  );
};