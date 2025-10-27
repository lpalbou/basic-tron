
import React from 'react';
import type { GameState } from '../types';
import { MenuScreen } from './MenuScreen';
import { GameOverScreen } from './GameOverScreen';

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
      <div className="absolute inset-0 z-10 flex items-center justify-center bg-black bg-opacity-70 pointer-events-none backdrop-blur-sm">
        <h2 className="text-6xl font-black text-white" style={{ textShadow: '0 0 20px white, 0 0 40px white' }}>
          PAUSED
        </h2>
      </div>
    );
  }
  
  return (
    <div className="absolute inset-0 z-10 flex flex-col items-center justify-center bg-black bg-opacity-70 p-1 sm:p-4 backdrop-blur-md">
      {gameState === 'MENU' && <MenuScreen onStart={onStart} />}
      {gameState === 'GAME_OVER' && <GameOverScreen winner={winner} scores={scores} onStart={onStart} />}
    </div>
  );
};
