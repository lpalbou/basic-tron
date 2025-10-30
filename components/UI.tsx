
import React from 'react';
import type { GameState } from '../types';
import { MenuScreen } from './MenuScreen';
import { GameOverScreen } from './GameOverScreen';
import { VERSION } from '../constants/version';

interface UIProps {
  gameState: GameState;
  winner: number | null;
  onStart: () => void;
  scores: { player1: number; player2: number };
}

export const UI: React.FC<UIProps> = ({ gameState, winner, onStart, scores }) => {
  if (gameState === 'PLAYING' || gameState === 'CRASHED' || gameState === 'COUNTDOWN') {
    return null;
  }

  if (gameState === 'PAUSED') {
    return (
      <div className="absolute top-4 left-1/2 transform -translate-x-1/2 z-10 pointer-events-none">
        <h2 className="text-4xl font-black text-white bg-black bg-opacity-50 px-4 py-2 rounded-lg" style={{ textShadow: '0 0 20px white, 0 0 40px white' }}>
          PAUSED
        </h2>
      </div>
    );
  }
  
  return (
    <div className="absolute inset-0 z-10 flex flex-col items-center justify-center bg-black bg-opacity-70 sm:p-4 backdrop-blur-md">
      {gameState === 'MENU' && <MenuScreen onStart={onStart} />}
      {gameState === 'GAME_OVER' && <GameOverScreen winner={winner} scores={scores} onStart={onStart} />}

      {/* Version footer - only show on menu */}
      {gameState === 'MENU' && (
        <div className="absolute bottom-4 right-4 text-xs text-gray-400 opacity-60">
          v{VERSION}
        </div>
      )}
    </div>
  );
};
