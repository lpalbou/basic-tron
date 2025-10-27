import React, { useRef, Suspense, useEffect, useState, useCallback } from 'react';
import { Canvas, useFrame } from '@react-three/fiber';
import { EffectComposer, Bloom } from '@react-three/postprocessing';
import { Arena } from './Arena';
import { LightCycle } from './LightCycle';
import { Trail } from './Trail';
import type { Player, Direction, GameState, CameraState, PowerUp as PowerUpType, CameraView } from '../types';
import { 
  INITIAL_PLAYER_1_STATE, 
  INITIAL_PLAYER_2_STATE, 
  GAME_SPEED_MS, 
  GRID_SIZE,
  POWERUP_SPAWN_INTERVAL,
  POWERUP_TYPES,
  POWERUP_DURATION,
  POWERUP_SPEED_MULTIPLIER,
  TRAIL_SHRINK_PERCENTAGE,
} from '../constants';
import { CrashParticles } from './CrashParticles';
import { PowerUp } from './PowerUp';
import { ParticleTrail } from './ParticleTrail';
import { DynamicCamera } from './DynamicCamera';

interface GameCanvasProps {
  onGameOver: (winner: number | null) => void;
  gameState: GameState;
  speedMultiplier: number;
  savedCameraState: CameraState;
  onCameraChange: (newState: CameraState) => void;
  cameraView: CameraView;
}

interface CrashEvent {
  id: number;
  position: [number, number, number];
  color: string;
}

interface GameLoopProps {
  player1Ref: React.MutableRefObject<Player>;
  player2Ref: React.MutableRefObject<Player>;
  onGameOver: (winner: number | null) => void;
  onCrash: (crashData: Omit<CrashEvent, 'id'>) => void;
  gameState: GameState;
  speedMultiplier: number;
  powerUps: PowerUpType[];
  setPowerUps: React.Dispatch<React.SetStateAction<PowerUpType[]>>;
}

// --- AI and Collision Helper Functions ---
const getTurnedDirection = (dir: Direction, turn: 'LEFT' | 'RIGHT'): Direction => {
    const leftTurns: Record<Direction, Direction> = { 'UP': 'LEFT', 'LEFT': 'DOWN', 'DOWN': 'RIGHT', 'RIGHT': 'UP' };
    const rightTurns: Record<Direction, Direction> = { 'UP': 'RIGHT', 'RIGHT': 'DOWN', 'DOWN': 'LEFT', 'LEFT': 'UP' };
    return turn === 'LEFT' ? leftTurns[dir] : rightTurns[dir];
};

const calculateNextPos = (position: [number, number, number], direction: Direction): [number, number, number] => {
  const pos: [number, number, number] = [...position];
  switch (direction) {
    case 'UP': pos[2] -= 1; break;
    case 'DOWN': pos[2] += 1; break;
    case 'LEFT': pos[0] -= 1; break;
    case 'RIGHT': pos[0] += 1; break;
  }
  return pos;
};

const isSafe = (pos: [number, number, number], collision: Set<string>, player: Player): boolean => {
    const [x, , z] = pos;
    const halfGrid = GRID_SIZE / 2;
    if (x <= -halfGrid || x >= halfGrid || z <= -halfGrid || z >= halfGrid) return false;

    if (player.activePowerUp.type === 'INVINCIBILITY') return true;
    
    if (collision.has(`${Math.round(x)},${Math.round(z)}`)) return false;
    return true;
};
// --- End AI Helpers ---

const GameLoop: React.FC<GameLoopProps> = ({ player1Ref, player2Ref, onGameOver, onCrash, gameState, speedMultiplier, powerUps, setPowerUps }) => {
  const p1TimeAccumulator = useRef(0);
  const p2TimeAccumulator = useRef(0);
  const powerUpSpawnTimer = useRef(POWERUP_SPAWN_INTERVAL / 2);
  const collisionGrid = useRef<Set<string>>(new Set());
  const gameOverRef = useRef(false);
  
  useEffect(() => {
    if (gameState === 'COUNTDOWN') {
      gameOverRef.current = false;
      p1TimeAccumulator.current = 0;
      p2TimeAccumulator.current = 0;
      powerUpSpawnTimer.current = POWERUP_SPAWN_INTERVAL / 2;
      collisionGrid.current.clear();
      
      const p1Pos = player1Ref.current.position;
      const p2Pos = player2Ref.current.position;
      collisionGrid.current.add(`${p1Pos[0]},${p1Pos[2]}`);
      collisionGrid.current.add(`${p2Pos[0]},${p2Pos[2]}`);
    }
  }, [gameState, player1Ref, player2Ref]);

  const findSafeSpawnPoint = useCallback((collision: Set<string>): [number, number, number] | null => {
    const halfGrid = GRID_SIZE / 2;
    for (let i = 0; i < 20; i++) {
      const x = Math.floor(Math.random() * (GRID_SIZE - 4)) - (halfGrid - 2);
      const z = Math.floor(Math.random() * (GRID_SIZE - 4)) - (halfGrid - 2);
      if (!collision.has(`${x},${z}`)) {
        return [x, 0.5, z];
      }
    }
    return null;
  }, []);

  useFrame((_, delta) => {
    if (gameOverRef.current || gameState !== 'PLAYING') return;

    // --- Power-up Spawning ---
    powerUpSpawnTimer.current -= delta;
    if (powerUpSpawnTimer.current <= 0) {
        powerUpSpawnTimer.current = POWERUP_SPAWN_INTERVAL;
        if (powerUps.length < 3) {
            const pos = findSafeSpawnPoint(collisionGrid.current);
            if (pos) {
                const type = POWERUP_TYPES[Math.floor(Math.random() * POWERUP_TYPES.length)];
                setPowerUps(prev => [...prev, { id: `pw-${Date.now()}`, type, position: pos }]);
            }
        }
    }

    // --- Update Player Power-up Durations ---
    const p1 = player1Ref.current;
    if (p1.activePowerUp.duration > 0) {
        p1.activePowerUp.duration -= delta;
        if (p1.activePowerUp.duration <= 0) p1.activePowerUp = { type: null, duration: 0 };
    }
    const p2 = player2Ref.current;
    if (p2.activePowerUp.duration > 0) {
        p2.activePowerUp.duration -= delta;
        if (p2.activePowerUp.duration <= 0) p2.activePowerUp = { type: null, duration: 0 };
    }

    // --- Independent Movement Logic ---
    p1TimeAccumulator.current += delta;
    p2TimeAccumulator.current += delta;

    const p1Speed = p1.activePowerUp.type === 'SPEED_BOOST' ? POWERUP_SPEED_MULTIPLIER : 1;
    const p2Speed = p2.activePowerUp.type === 'SPEED_BOOST' ? POWERUP_SPEED_MULTIPLIER : 1;
    
    const p1TimeStep = (GAME_SPEED_MS / 1000.0) / (speedMultiplier * p1Speed);
    const p2TimeStep = (GAME_SPEED_MS / 1000.0) / (speedMultiplier * p2Speed);

    let p1Moved = false;
    let p2Moved = false;

    // Player 1 direction is now updated by the input handler in the Scene component.
    
    // Player 2 (AI) direction logic.
    if (p2.isAlive) {
        let movedForPowerUp = false;
        // AI Power-up seeking logic
        if (powerUps.length > 0) {
            let closestPowerUp = null;
            let minDistance = Infinity;
            for (const p of powerUps) {
                const dist = Math.hypot(p.position[0] - p2.position[0], p.position[2] - p2.position[2]);
                if (dist < minDistance) {
                    minDistance = dist;
                    closestPowerUp = p;
                }
            }

            if (closestPowerUp && minDistance < 15) {
                const dx = closestPowerUp.position[0] - p2.position[0];
                const dz = closestPowerUp.position[2] - p2.position[2];
                let desiredDir: Direction | null = null;
                
                if (Math.abs(dx) > Math.abs(dz)) {
                    desiredDir = dx > 0 ? 'RIGHT' : 'LEFT';
                } else {
                    desiredDir = dz > 0 ? 'DOWN' : 'UP';
                }

                const isOpposite = (p2.direction === 'UP' && desiredDir === 'DOWN') || (p2.direction === 'DOWN' && desiredDir === 'UP') || (p2.direction === 'LEFT' && desiredDir === 'RIGHT') || (p2.direction === 'RIGHT' && desiredDir === 'LEFT');
                if (desiredDir && !isOpposite) {
                    const nextPos = calculateNextPos(p2.position, desiredDir);
                    const twoStepsAhead = calculateNextPos(nextPos, desiredDir);
                    if (isSafe(nextPos, collisionGrid.current, p2) && isSafe(twoStepsAhead, collisionGrid.current, p2)) {
                        p2.direction = desiredDir;
                        movedForPowerUp = true;
                    }
                }
            }
        }
        
        // Defensive AI logic (if not seeking a power-up)
        if (!movedForPowerUp) {
            const futureCollisionGrid = new Set<string>(collisionGrid.current);
            if (p1.isAlive) {
                const p1NextPosForAI = calculateNextPos(p1.position, p1.direction);
                futureCollisionGrid.add(`${p1.position[0]},${p1.position[2]}`);
                futureCollisionGrid.add(`${p1NextPosForAI[0]},${p1NextPosForAI[2]}`);
            }
            
            const forwardPos = calculateNextPos(p2.position, p2.direction);
            if (!isSafe(forwardPos, futureCollisionGrid, p2)) {
                const leftDir = getTurnedDirection(p2.direction, 'LEFT');
                const leftPos = calculateNextPos(p2.position, leftDir);
                const rightDir = getTurnedDirection(p2.direction, 'RIGHT');
                const rightPos = calculateNextPos(p2.position, rightDir);

                const canGoLeft = isSafe(leftPos, futureCollisionGrid, p2);
                const canGoRight = isSafe(rightPos, futureCollisionGrid, p2);

                if (canGoLeft && canGoRight) p2.direction = Math.random() > 0.5 ? leftDir : rightDir;
                else if (canGoLeft) p2.direction = leftDir;
                else if (canGoRight) p2.direction = rightDir;
            }
        }
    }

    if (p1.isAlive && p1TimeAccumulator.current >= p1TimeStep) {
        p1TimeAccumulator.current -= p1TimeStep;
        p1Moved = true;
    }
    if (p2.isAlive && p2TimeAccumulator.current >= p2TimeStep) {
        p2TimeAccumulator.current -= p2TimeStep;
        p2Moved = true;
    }

    if (!p1Moved && !p2Moved) return;
    
    const p1NextPos = p1Moved ? calculateNextPos(p1.position, p1.direction) : p1.position;
    const p2NextPos = p2Moved ? calculateNextPos(p2.position, p2.direction) : p2.position;

    // --- Power-up Collection ---
    const checkAndCollect = (collector: Player, opponent: Player, nextPos: [number, number, number]) => {
        const collected = powerUps.find(p => Math.hypot(p.position[0] - nextPos[0], p.position[2] - nextPos[2]) <= 1.0);
        if (collected) {
            setPowerUps(prev => prev.filter(p => p.id !== collected.id));
            if (collected.type === 'TRAIL_SHRINK') {
                const amount = Math.floor(opponent.path.length * TRAIL_SHRINK_PERCENTAGE);
                if (amount > 0) {
                    const removed = opponent.path.splice(0, amount);
                    removed.forEach(point => collisionGrid.current.delete(`${point[0]},${point[2]}`));
                    opponent.trailJustShrank = true;
                }
            } else {
                collector.activePowerUp = { type: collected.type, duration: POWERUP_DURATION };
            }
        }
    };
    if (p1Moved) checkAndCollect(p1, p2, p1NextPos);
    if (p2Moved) checkAndCollect(p2, p1, p2NextPos);

    // --- Collision Detection ---
    let p1Crashed = false;
    let p2Crashed = false;

    if (p1Moved && p1.isAlive) {
        if (!isSafe(p1NextPos, collisionGrid.current, p1)) p1Crashed = true;
    }
    if (p2Moved && p2.isAlive) {
        if (!isSafe(p2NextPos, collisionGrid.current, p2)) p2Crashed = true;
    }

    if (p1.isAlive && p2.isAlive) {
        const p1NextKey = `${p1NextPos[0]},${p1NextPos[2]}`;
        const p2NextKey = `${p2NextPos[0]},${p2NextPos[2]}`;
        if (p1Moved && p2Moved) {
            if (p1NextKey === p2NextKey) p1Crashed = p2Crashed = true;
            if (p1NextKey === `${p2.position[0]},${p2.position[2]}` && p2NextKey === `${p1.position[0]},${p1.position[2]}`) p1Crashed = p2Crashed = true;
        } else if (p1Moved) {
            if (p1NextKey === `${p2.position[0]},${p2.position[2]}`) p1Crashed = true;
        } else if (p2Moved) {
            if (p2NextKey === `${p1.position[0]},${p1.position[2]}`) p2Crashed = true;
        }
    }
    
    // --- Game Over Check ---
    if (p1Crashed || p2Crashed) {
      if (gameOverRef.current) return;
      gameOverRef.current = true;
      if (p1Crashed) { p1.isAlive = false; onCrash({ position: p1NextPos, color: p1.color }); }
      if (p2Crashed) { p2.isAlive = false; onCrash({ position: p2NextPos, color: p2.color }); }
      if (!p1.isAlive && !p2.isAlive) onGameOver(null);
      else if (!p1.isAlive) onGameOver(2);
      else onGameOver(1);
      return;
    }

    // --- Update Positions & Trails ---
    if (p1Moved && p1.isAlive) {
      collisionGrid.current.add(`${p1.position[0]},${p1.position[2]}`);
      p1.position = p1NextPos;
      p1.path.push(p1NextPos);
    }
    if (p2Moved && p2.isAlive) {
      collisionGrid.current.add(`${p2.position[0]},${p2.position[2]}`);
      p2.position = p2NextPos;
      p2.path.push(p2NextPos);
    }
  });

  return null;
};

const Scene: React.FC<GameCanvasProps> = ({ 
    onGameOver, 
    gameState, 
    speedMultiplier, 
    savedCameraState, 
    onCameraChange, 
    cameraView,
}) => {
  const [crashes, setCrashes] = useState<CrashEvent[]>([]);
  const [powerUps, setPowerUps] = useState<PowerUpType[]>([]);

  const player1Ref = useRef<Player>(JSON.parse(JSON.stringify(INITIAL_PLAYER_1_STATE)));
  const player2Ref = useRef<Player>(JSON.parse(JSON.stringify(INITIAL_PLAYER_2_STATE)));
  
  // --- Simplified Input Handler (listens for custom events from App.tsx) ---
  useEffect(() => {
    const handlePlayerInput = (e: Event) => {
      const { detail } = e as CustomEvent;
      const p1 = player1Ref.current;

      const handleKeyEvent = (key: string) => {
        if (cameraView === 'FIRST_PERSON' || cameraView === 'FOLLOW') {
          let turn: 'LEFT' | 'RIGHT' | null = null;
          if (key === 'arrowleft' || key === 'a') turn = 'LEFT';
          if (key === 'arrowright' || key === 'd') turn = 'RIGHT';
          if (turn) p1.direction = getTurnedDirection(p1.direction, turn);
        } else { // THIRD_PERSON
          const keyMap: Record<string, Direction> = {
            'arrowup': 'UP', 'w': 'UP', 'arrowdown': 'DOWN', 's': 'DOWN',
            'arrowleft': 'LEFT', 'a': 'LEFT', 'arrowright': 'RIGHT', 'd': 'RIGHT',
          };
          const newDirection = keyMap[key];
          if (newDirection) {
            const isOpposite = (p1.direction === 'UP' && newDirection === 'DOWN') || (p1.direction === 'DOWN' && newDirection === 'UP') || (p1.direction === 'LEFT' && newDirection === 'RIGHT') || (p1.direction === 'RIGHT' && newDirection === 'LEFT');
            if (!isOpposite) p1.direction = newDirection;
          }
        }
      };

      if (detail.type === 'keyboard') {
        handleKeyEvent(detail.key);
      } else if (detail.type === 'touch-tap') {
        const turn = detail.x < window.innerWidth / 2 ? 'LEFT' : 'RIGHT';
        p1.direction = getTurnedDirection(p1.direction, turn);
      } else if (detail.type === 'touch-swipe') {
        const { start, end } = detail;
        const dx = end.x - start.x;
        const dy = end.y - start.y;
        if (Math.abs(dx) > 30 || Math.abs(dy) > 30) {
          const newDirection = Math.abs(dx) > Math.abs(dy) ? (dx > 0 ? 'RIGHT' : 'LEFT') : (dy > 0 ? 'DOWN' : 'UP');
          const isOpposite = (p1.direction === 'UP' && newDirection === 'DOWN') || (p1.direction === 'DOWN' && newDirection === 'UP') || (p1.direction === 'LEFT' && newDirection === 'RIGHT') || (p1.direction === 'RIGHT' && newDirection === 'LEFT');
          if (!isOpposite) p1.direction = newDirection;
        }
      }
    };
    
    window.addEventListener('player-input', handlePlayerInput);
    return () => {
      window.removeEventListener('player-input', handlePlayerInput);
    };
  }, [cameraView]);


  const handleCrash = useCallback((crashData: Omit<CrashEvent, 'id'>) => {
    setCrashes(currentCrashes => [
      ...currentCrashes,
      { ...crashData, id: Date.now() + Math.random() }
    ]);
  }, []);
  
  useEffect(() => {
    if (gameState === 'COUNTDOWN') {
      player1Ref.current = JSON.parse(JSON.stringify(INITIAL_PLAYER_1_STATE));
      player2Ref.current = JSON.parse(JSON.stringify(INITIAL_PLAYER_2_STATE));
      setCrashes([]);
      setPowerUps([]);
    }
  }, [gameState]);


  return (
    <>
      <fog attach="fog" args={['#000', 40, 100]} />
      <ambientLight intensity={0.1} />
      <hemisphereLight intensity={0.5} color="#00ffff" groundColor="#ff5500" />
      <Arena gridSize={GRID_SIZE} />
      
      <GameLoop 
        player1Ref={player1Ref}
        player2Ref={player2Ref}
        onGameOver={onGameOver} 
        onCrash={handleCrash} 
        gameState={gameState} 
        speedMultiplier={speedMultiplier} 
        powerUps={powerUps}
        setPowerUps={setPowerUps}
      />
      
      <LightCycle player={player1Ref} gameState={gameState} />
      <Trail playerRef={player1Ref} />
      <ParticleTrail playerRef={player1Ref} gameState={gameState} />
      
      <LightCycle player={player2Ref} gameState={gameState} />
      <Trail playerRef={player2Ref} />
      <ParticleTrail playerRef={player2Ref} gameState={gameState} />
      
      {crashes.map(crash => (
        <CrashParticles key={crash.id} position={crash.position} color={crash.color} />
      ))}

      {powerUps.map(p => (
        <PowerUp key={p.id} type={p.type} position={p.position} />
      ))}

      <DynamicCamera
        cameraView={cameraView}
        playerRef={player1Ref}
        savedCameraState={savedCameraState}
        onCameraChange={onCameraChange}
        gameState={gameState}
      />

      <EffectComposer>
        <Bloom intensity={1.5} luminanceThreshold={0.25} luminanceSmoothing={0.9} height={1080} />
      </EffectComposer>
    </>
  );
}

export const GameCanvas: React.FC<GameCanvasProps> = (props) => {
  return (
    <Canvas shadows camera={{ fov: 60 }}>
      <Suspense fallback={null}>
        <Scene {...props} />
      </Suspense>
    </Canvas>
  );
};