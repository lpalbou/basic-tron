
import React from 'react';
import { GameCanvas } from './components/GameCanvas';
import { UI } from './components/UI';
import type { GameState, CameraState, CameraView } from './types';
import useSounds from './hooks/useSounds';
import useIsMobile from './hooks/useIsMobile';
import { OnScreenControls } from './components/OnScreenControls';

const App: React.FC = () => {
  const [gameState, setGameState] = React.useState<GameState>('MENU');
  const [winner, setWinner] = React.useState<number | null>(null);
  const [scores, setScores] = React.useState({ player1: 0, player2: 0 });
  const [speedMultiplier, setSpeedMultiplier] = React.useState(1);
  const [gameId, setGameId] = React.useState(1);
  const [thirdPersonCameraState, setThirdPersonCameraState] = React.useState<CameraState>({
    position: [0, 73, 7],
    target: [0, 0, 0],
  });
  const [cameraView, setCameraView] = React.useState<CameraView>('THIRD_PERSON');
  
  const isMobile = useIsMobile();
  const { playBackgroundMusic } = useSounds();
  const [showControls, setShowControls] = React.useState(false);

  // Set initial state for controls based on device type after mount
  React.useEffect(() => {
    setShowControls(isMobile);
  }, [isMobile]);

  const startGame = React.useCallback(async () => {
    await playBackgroundMusic();
    setWinner(null);
    setGameState('COUNTDOWN');
    setGameId(id => id + 1);
  }, [playBackgroundMusic]);
  
  React.useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      const key = e.key.toLowerCase();
      if (key === 'x') {
        setSpeedMultiplier(s => (s % 3) + 1);
        return;
      }
      if (key === 'v') {
        setCameraView(v => {
          if (v === 'THIRD_PERSON') return 'FOLLOW';
          if (v === 'FOLLOW') return 'FIRST_PERSON';
          return 'THIRD_PERSON';
        });
        return;
      }
    };
    
    window.addEventListener('keydown', handleKeyDown);

    return () => {
      window.removeEventListener('keydown', handleKeyDown);
    };
  }, []);

  React.useEffect(() => {
    if (gameState === 'COUNTDOWN') {
      const timer = setTimeout(() => {
        setGameState('PLAYING');
      }, 2000);
      return () => clearTimeout(timer);
    }
    
    if (gameState === 'CRASHED') {
      const timer = setTimeout(() => {
        setGameState('GAME_OVER');
      }, 2000);
      return () => clearTimeout(timer);
    }
  }, [gameState, gameId]);

  const handleGameOver = React.useCallback((winnerId: number | null) => {
    setGameState('CRASHED');
    setWinner(winnerId);
    if (winnerId === 1) {
      setScores(s => ({ ...s, player1: s.player1 + 1 }));
    } else if (winnerId === 2) {
      setScores(s => ({ ...s, player2: s.player2 + 1 }));
    }
  }, []);

  const handleCameraChange = React.useCallback((newState: CameraState) => {
    setThirdPersonCameraState(newState);
  }, []);

  return (
    <div className="w-full h-full bg-black relative">
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
          savedCameraState={thirdPersonCameraState}
          onCameraChange={handleCameraChange}
          cameraView={cameraView}
        />
      )}
      {/* Updated logic: show controls if toggled on, and only during gameplay */}
      {showControls && (gameState === 'PLAYING' || gameState === 'COUNTDOWN') && (
        <OnScreenControls />
      )}
      {/* New toggle button for on-screen controls */}
      <div className="absolute bottom-4 right-4 z-30">
        <button
          onClick={() => setShowControls(s => !s)}
          className="w-12 h-12 bg-gray-700 bg-opacity-40 rounded-full text-2xl flex items-center justify-center border-2 border-gray-500 hover:bg-gray-600 transition-colors backdrop-blur-sm"
          aria-label="Toggle on-screen controls"
          title="Toggle on-screen controls"
        >
          🎮
        </button>
      </div>
    </div>
  );
};

export default App;
