
import React from 'react';
import { GameCanvas } from './components/GameCanvas';
import { UI } from './components/UI';
import type { GameState, CameraState, CameraView, Direction, DeviceType } from './types';
import useSounds from './hooks/useSounds';
import useSoundEffects from './hooks/useSoundEffects';
import { OnScreenControls } from './components/OnScreenControls';
import useOrientation from './hooks/useOrientation';
import { OrientationLock } from './components/OrientationLock';
import { SpeedIndicator } from './components/SpeedIndicator';
import { PauseButton } from './components/PauseButton';

const getDeviceType = (): DeviceType => {
    const hasTouch = 'ontouchstart' in window || navigator.maxTouchPoints > 0;
    if (!hasTouch) return 'desktop';
    // Use a media query, which is more robust for detecting device characteristics
    if (window.matchMedia('(min-width: 768px)').matches) {
        return 'tablet';
    }
    return 'phone';
};


const App: React.FC = () => {
  const [gameState, setGameState] = React.useState<GameState>('MENU');
  const [winner, setWinner] = React.useState<number | null>(null);
  const [scores, setScores] = React.useState({ player1: 0, player2: 0 });
  const speedLevels = React.useMemo(() => [0.5, 1, 1.5, 2], []);
  const [speedIndex, setSpeedIndex] = React.useState(1); // Default to 1x speed (index 1)
  const speedMultiplier = speedLevels[speedIndex];
  const [speedMessage, setSpeedMessage] = React.useState<{text: string, key: number} | null>(null);
  const [gameId, setGameId] = React.useState(1);
  const [thirdPersonCameraState, setThirdPersonCameraState] = React.useState<CameraState>({
    position: [0, 65, 28],
    target: [0, 0, 7.6],
  });
  const [cameraView, setCameraView] = React.useState<CameraView>('THIRD_PERSON');
  
  const [deviceType, setDeviceType] = React.useState<DeviceType>('desktop');
  const orientation = useOrientation();
  const { playBackgroundMusic, pauseMusic, resumeMusic } = useSounds();
  const sfx = useSoundEffects();
  const [showControls, setShowControls] = React.useState(false);

  React.useEffect(() => {
    const updateDevice = () => setDeviceType(getDeviceType());
    updateDevice();
    window.addEventListener('resize', updateDevice);
    return () => window.removeEventListener('resize', updateDevice);
  }, []);

  const isTouchDevice = deviceType === 'phone' || deviceType === 'tablet';

  React.useEffect(() => {
    setShowControls(isTouchDevice);
  }, [isTouchDevice]);

  const startGame = React. useCallback(async () => {
    await playBackgroundMusic();
    setWinner(null);
    setGameState('COUNTDOWN');
    setGameId(id => id + 1);
  }, [playBackgroundMusic]);
  
  // --- Centralized Input Handler ---
  // This single hook in the top-level component manages all input to prevent listener conflicts.
  React.useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      const key = e.key.toLowerCase();

      // --- Global Controls (work outside of 'PLAYING' state) ---
      if (key === 'p') {
        setGameState(prev => {
          if (prev === 'PLAYING') {
            pauseMusic();
            return 'PAUSED';
          }
          if (prev === 'PAUSED') {
            resumeMusic();
            return 'PLAYING';
          }
          return prev;
        });
        return;
      }

      if (key === 'x') {
        setSpeedIndex(prevIndex => {
          const newIndex = (prevIndex + 1) % speedLevels.length;
          setSpeedMessage({ text: `Speed: ${speedLevels[newIndex]}x`, key: Date.now() });
          return newIndex;
        });
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

      // --- Player Movement Controls (only dispatched when playing) ---
      if (gameState === 'PLAYING') {
        const event = new CustomEvent('player-input', { detail: { type: 'keyboard', key } });
        window.dispatchEvent(event);
      }
    };

    let touchStart: { x: number; y: number } | null = null;
    const handleTouchStart = (e: TouchEvent) => {
        if (gameState !== 'PLAYING' || e.touches.length === 0) return;
        touchStart = { x: e.touches[0].clientX, y: e.touches[0].clientY };

        if (cameraView === 'FIRST_PERSON' || cameraView === 'FOLLOW') {
            const event = new CustomEvent('player-input', { detail: { type: 'touch-tap', x: touchStart.x } });
            window.dispatchEvent(event);
        }
    };

    const handleTouchEnd = (e: TouchEvent) => {
        if (gameState !== 'PLAYING' || cameraView === 'FIRST_PERSON' || cameraView === 'FOLLOW' || !touchStart || e.changedTouches.length === 0) return;
        
        const touchEnd = { x: e.changedTouches[0].clientX, y: e.changedTouches[0].clientY };
        const event = new CustomEvent('player-input', { detail: { type: 'touch-swipe', start: touchStart, end: touchEnd } });
        window.dispatchEvent(event);
        touchStart = null;
    };

    window.addEventListener('keydown', handleKeyDown);
    window.addEventListener('touchstart', handleTouchStart, { passive: true });
    window.addEventListener('touchend', handleTouchEnd, { passive: true });
    
    return () => {
      window.removeEventListener('keydown', handleKeyDown);
      window.removeEventListener('touchstart', handleTouchStart);
      window.removeEventListener('touchend', handleTouchEnd);
    };
  }, [gameState, cameraView, speedLevels, setGameState, setSpeedIndex, setCameraView, setSpeedMessage, pauseMusic, resumeMusic]);


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

  if (isTouchDevice && orientation === 'portrait') {
    return <OrientationLock />;
  }

  return (
    <div className="w-full h-full bg-black relative">
      <UI 
        gameState={gameState} 
        winner={winner} 
        onStart={startGame} 
        scores={scores} 
      />
      {speedMessage && <SpeedIndicator message={speedMessage.text} messageKey={speedMessage.key} />}
      {gameState !== 'MENU' && (
        <GameCanvas
          key={gameId}
          onGameOver={handleGameOver}
          gameState={gameState}
          speedMultiplier={speedMultiplier}
          savedCameraState={thirdPersonCameraState}
          onCameraChange={handleCameraChange}
          cameraView={cameraView}
          sfx={sfx}
          scores={scores}
        />
      )}
      {showControls && (gameState === 'PLAYING' || gameState === 'COUNTDOWN' || gameState === 'PAUSED') && (
        <OnScreenControls deviceType={deviceType} cameraView={cameraView} />
      )}
      {(gameState === 'PLAYING' || gameState === 'PAUSED') && (
        <PauseButton gameState={gameState} />
      )}
      <div className="absolute top-4 left-4 z-30">
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
