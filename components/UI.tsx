

import React from 'react';
import type { GameState } from '../types';
import { PLAYER_1_COLOR, PLAYER_2_COLOR } from '../constants';
import { PowerUpLegend } from './PowerUpLegend';

interface UIProps {
  gameState: GameState;
  winner: number | null;
  onStart: () => void;
  scores: { player1: number; player2: number };
  speedMultiplier: number;
}

const commonButtonClasses = "px-8 py-3 text-2xl font-black uppercase rounded-md transition-all duration-300 transform hover:scale-105 focus:outline-none focus:ring-4 text-black";

const Title: React.FC = () => (
    <h1 className="text-5xl md:text-7xl font-black uppercase tracking-wider text-white" style={{ textShadow: `0 0 10px ${PLAYER_1_COLOR}, 0 0 20px ${PLAYER_2_COLOR}` }}>
      Neon Cycle Duel
    </h1>
);

const Controls: React.FC = () => (
    <div className="mt-8 text-center text-gray-300 animate-fadeIn">
        <h3 className="text-xl font-bold uppercase tracking-widest mb-4">Controls</h3>
        <div className="grid grid-cols-1 md:grid-cols-2 gap-x-8 gap-y-4 max-w-lg mx-auto">
            <div style={{ color: PLAYER_1_COLOR }}>
                <p className="font-bold">Player (You)</p>
                <p>Arrow Keys or Swipe</p>
            </div>
            <div style={{ color: PLAYER_2_COLOR }}>
                <p className="font-bold">AI Opponent</p>
                <p>Computer Controlled</p>
            </div>
        </div>
        <p className="text-gray-400 text-sm mt-4">Press 'X' to Change Speed</p>
        <p className="text-gray-400 text-sm mt-2 animate-pulse">Use Mouse/Touch to Orbit Camera</p>
    </div>
);

const ScoreDisplay: React.FC<{ scores: { player1: number; player2: number }; speedMultiplier: number }> = ({ scores, speedMultiplier }) => {
    return (
      <div className="absolute top-0 left-0 right-0 flex justify-between items-center p-4 md:p-8 text-3xl font-black">
        <div className="text-left w-1/3" style={{ color: PLAYER_1_COLOR, textShadow: `0 0 10px ${PLAYER_1_COLOR}` }}>
          <span>YOU: </span>
          <span>{scores.player1}</span>
        </div>
        <div className="text-center w-1/3 text-xl text-white" style={{ textShadow: '0 0 5px white' }}>
          SPEED: {speedMultiplier}x
        </div>
        <div className="text-right w-1/3" style={{ color: PLAYER_2_COLOR, textShadow: `0 0 10px ${PLAYER_2_COLOR}` }}>
          <span>AI: </span>
          <span>{scores.player2}</span>
        </div>
      </div>
    );
};

const GameOverScreen: React.FC<{winner: number | null}> = ({ winner }) => {
    const isDraw = winner === null;
    if (isDraw) {
        return (
             <h2 className="text-6xl font-serif font-bold tracking-wider text-white" style={{ textShadow: '0 0 10px rgba(255, 255, 255, 0.7)'}}>
                IT'S A DRAW!
            </h2>
        )
    }
    
    const winnerColor = winner === 1 ? PLAYER_1_COLOR : PLAYER_2_COLOR;
    const winnerText = winner === 1 ? 'YOU WIN!' : 'AI WINS!';

    return (
        <div className="text-center flex flex-col items-center gap-4">
            <h2 className="text-6xl font-serif font-bold tracking-wider" style={{ color: winnerColor, textShadow: `0 0 8px ${winnerColor}, 0 0 20px ${winnerColor}`}}>
                {winnerText}
            </h2>
            <div className="h-1 w-40" style={{ background: winnerColor, boxShadow: `0 0 15px ${winnerColor}` }}></div>
        </div>
    )
};

const CountdownDisplay: React.FC = () => {
    const [count, setCount] = React.useState(3);

    React.useEffect(() => {
        setCount(3);
        const t1 = setTimeout(() => setCount(2), 666);
        const t2 = setTimeout(() => setCount(1), 1333);
        return () => {
            clearTimeout(t1);
            clearTimeout(t2);
        }
    }, []);

    return (
        <div 
          key={count} 
          className="text-9xl font-black text-white animate-pulse"
          style={{
              textShadow: '0 0 20px white, 0 0 40px white',
              animationDuration: '0.66s'
          }}
        >
            {count}
        </div>
    );
}

export const UI: React.FC<UIProps> = ({ gameState, winner, onStart, scores, speedMultiplier }) => {
  if (gameState === 'PLAYING' || gameState === 'CRASHED') return null;

  if (gameState === 'COUNTDOWN') {
    return (
      <div className="absolute inset-0 z-10 flex items-center justify-center bg-black bg-opacity-50 pointer-events-none">
        <CountdownDisplay />
      </div>
    );
  }

  const winnerColor = winner === 1 ? PLAYER_1_COLOR : PLAYER_2_COLOR;
  const buttonColor = gameState === 'GAME_OVER' ? winnerColor : PLAYER_1_COLOR;

  return (
    <div className="absolute inset-0 z-10 flex flex-col items-center justify-center bg-black bg-opacity-70 p-4 backdrop-blur-md overflow-y-auto">
      {gameState !== 'MENU' && <ScoreDisplay scores={scores} speedMultiplier={speedMultiplier} />}
      <div className="flex flex-col items-center gap-8 text-center">
        {gameState === 'MENU' && <Title />}
        {gameState === 'GAME_OVER' && <GameOverScreen winner={winner} />}

        <div className="flex items-center justify-center gap-4">
            <button 
              onClick={onStart} 
              className={commonButtonClasses}
              style={{
                backgroundColor: buttonColor,
                boxShadow: `0 0 30px ${buttonColor}`,
                borderColor: buttonColor,
              }}
            >
              {gameState === 'MENU' ? 'Start Game' : 'Play Again'}
            </button>
        </div>
        
        {gameState === 'MENU' && <Controls />}
        {(gameState === 'MENU' || gameState === 'GAME_OVER') && <PowerUpLegend />}
      </div>
    </div>
  );
};