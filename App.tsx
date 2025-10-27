
import React from 'react';
import { GameCanvas } from './components/GameCanvas';
import { UI } from './components/UI';
import type { GameState, CameraState } from './types';
import useSounds from './hooks/useSounds';

const App: React.FC = () => {
  const [gameState, setGameState] = React.useState<GameState>('MENU');
  const [winner, setWinner] = React.useState<number | null>(null);
  const [scores, setScores] = React.useState({ player1: 0, player2: 0 });
  const [speedMultiplier, setSpeedMultiplier] = React.useState(1);
  // The gameId key is the most reliable way to force a complete reset
  // of the Three.js canvas and all its state.
  const [gameId, setGameId] = React.useState(1); 
  const cameraStateRef = React.useRef<CameraState | null>(null);

  const { playBackgroundMusic } = useSounds();

  const startGame = React.useCallback(async () => {
    await playBackgroundMusic();
    setWinner(null);
    setGameState('COUNTDOWN');
    setGameId(id => id + 1);
  }, [playBackgroundMusic]);
  
  // Speed control listener
  React.useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key.toLowerCase() === 'x') {
        setSpeedMultiplier(s => (s % 3) + 1); // Cycles 1 -> 2 -> 3 -> 1
      }
    };
    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, []);

  React.useEffect(() => {
    if (gameState === 'COUNTDOWN') {
      const timer = setTimeout(() => {
        setGameState('PLAYING');
      }, 2000); // Shortened countdown to 2 seconds
      return () => clearTimeout(timer);
    }
    
    if (gameState === 'CRASHED') {
      const timer = setTimeout(() => {
        setGameState('GAME_OVER');
      }, 2000); // 2-second delay after a crash
      return () => clearTimeout(timer);
    }
  }, [gameState, gameId]);

  const handleGameOver = React.useCallback((winnerId: number | null) => {
    setGameState('CRASHED'); // Enter the crashed state first
    setWinner(winnerId);
    if (winnerId === 1) {
      setScores(s => ({ ...s, player1: s.player1 + 1 }));
    } else if (winnerId === 2) {
      setScores(s => ({ ...s, player2: s.player2 + 1 }));
    }
  }, []);

  const handleCameraChange = React.useCallback((newState: CameraState) => {
    cameraStateRef.current = newState;
  }, []);

  return (
    <div className="w-full h-full bg-black">
      <UI 
        gameState={gameState} 
        winner={winner} 
        onStart={startGame} 
        scores={scores} 
        speedMultiplier={speedMultiplier} 
      />
      {gameState !== 'MENU' && (
        <GameCanvas
          key={gameId}
          onGameOver={handleGameOver}
          gameState={gameState}
          speedMultiplier={speedMultiplier}
          initialCameraState={cameraStateRef.current}
          onCameraChange={handleCameraChange}
        />
      )}
    </div>
  );
};

export default App;