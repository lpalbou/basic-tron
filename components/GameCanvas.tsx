import React, { useRef, Suspense, useEffect, useState, useCallback } from 'react';
import { Canvas, useFrame } from '@react-three/fiber';
import { OrbitControls } from '@react-three/drei';
import { EffectComposer, Bloom } from '@react-three/postprocessing';
import { Arena } from './Arena';
import { LightCycle } from './LightCycle';
import { Trail } from './Trail';
import { useControls } from '../hooks/useControls';
import type { Player, Direction, GameState, CameraState, PowerUp as PowerUpType } from '../types';
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

interface GameCanvasProps {
  onGameOver: (winner: number | null) => void;
  gameState: GameState;
  speedMultiplier: number;
  initialCameraState: CameraState | null;
  onCameraChange: (newState: CameraState) => void;
}

interface CrashEvent {
  id: number;
  position: [number, number, number];
  color: string;
}

interface GameLoopProps {
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

    // If invincible, only wall collisions matter (checked above). Trail collisions are ignored.
    if (player.activePowerUp.type === 'INVINCIBILITY') return true;
    
    if (collision.has(`${Math.round(x)},${Math.round(z)}`)) return false;
    return true;
};
// --- End AI Helpers ---

const GameLoop: React.FC<GameLoopProps> = ({ onGameOver, onCrash, gameState, speedMultiplier, powerUps, setPowerUps }) => {
  const player1Ref = useRef<Player>(JSON.parse(JSON.stringify(INITIAL_PLAYER_1_STATE)));
  const player2Ref = useRef<Player>(JSON.parse(JSON.stringify(INITIAL_PLAYER_2_STATE)));
  
  const p1Controls = useControls(INITIAL_PLAYER_1_STATE.direction, 'ARROWS');

  const p1TimeAccumulator = useRef(0);
  const p2TimeAccumulator = useRef(0);
  const powerUpSpawnTimer = useRef(POWERUP_SPAWN_INTERVAL / 2); // Spawn first one early
  const collisionGrid = useRef<Set<string>>(new Set());
  const gameOverRef = useRef(false);
  
  // Initialize grid with starting positions.
  useEffect(() => {
      const p1Pos = player1Ref.current.position;
      const p2Pos = player2Ref.current.position;
      collisionGrid.current.add(`${p1Pos[0]},${p1Pos[2]}`);
      collisionGrid.current.add(`${p2Pos[0]},${p2Pos[2]}`);
  }, []);

  const findSafeSpawnPoint = useCallback((collision: Set<string>): [number, number, number] | null => {
    const halfGrid = GRID_SIZE / 2;
    for (let i = 0; i < 20; i++) { // Try 20 times to find a spot
      const x = Math.floor(Math.random() * (GRID_SIZE - 4)) - (halfGrid - 2);
      const z = Math.floor(Math.random() * (GRID_SIZE - 4)) - (halfGrid - 2);
      if (!collision.has(`${x},${z}`)) {
        return [x, 0.5, z];
      }
    }
    return null; // No safe spot found
  }, []);

  useFrame((_, delta) => {
    if (gameOverRef.current || gameState !== 'PLAYING') return;

    // --- Power-up Spawning ---
    powerUpSpawnTimer.current -= delta;
    if (powerUpSpawnTimer.current <= 0) {
        powerUpSpawnTimer.current = POWERUP_SPAWN_INTERVAL;
        if (powerUps.length < 3) { // Max 3 power-ups at a time
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

    if (p1.isAlive && p1TimeAccumulator.current >= p1TimeStep) {
        p1TimeAccumulator.current -= p1TimeStep;
        p1Moved = true;
    }
    if (p2.isAlive && p2TimeAccumulator.current >= p2TimeStep) {
        p2TimeAccumulator.current -= p2TimeStep;
        p2Moved = true;
    }

    if (!p1Moved && !p2Moved) return;

    // --- Update Directions for moving players ---
    const updateDirection = (p: Player, newDir: Direction) => {
        const isOpposite = (p.direction === 'UP' && newDir === 'DOWN') || (p.direction === 'DOWN' && newDir === 'UP') || (p.direction === 'LEFT' && newDir === 'RIGHT') || (p.direction === 'RIGHT' && newDir === 'LEFT');
        if (!isOpposite) p.direction = newDir;
    };

    if (p1Moved) {
        updateDirection(p1, p1Controls.direction);
    }
    if (p2Moved) {
      const futureCollisionGrid = new Set<string>(collisionGrid.current);
      // AI anticipates player 1's next move
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
    
    const p1NextPos = p1Moved ? calculateNextPos(p1.position, p1.direction) : p1.position;
    const p2NextPos = p2Moved ? calculateNextPos(p2.position, p2.direction) : p2.position;

    // --- Power-up Collection ---
    const checkAndCollect = (collector: Player, opponent: Player, nextPos: [number, number, number]) => {
        const collected = powerUps.find(p => p.position[0] === nextPos[0] && p.position[2] === nextPos[2]);
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

    // Check for collisions with walls and trails for players that moved
    if (p1Moved && p1.isAlive) {
        if (!isSafe(p1NextPos, collisionGrid.current, p1)) p1Crashed = true;
    }
    if (p2Moved && p2.isAlive) {
        if (!isSafe(p2NextPos, collisionGrid.current, p2)) p2Crashed = true;
    }

    // Check for player-on-player collisions
    if (p1.isAlive && p2.isAlive) {
        const p1NextKey = `${p1NextPos[0]},${p1NextPos[2]}`;
        const p2NextKey = `${p2NextPos[0]},${p2NextPos[2]}`;

        if (p1Moved && p2Moved) {
            // Case 1: Both move to the same cell
            if (p1NextKey === p2NextKey) {
                p1Crashed = p2Crashed = true;
            }
            // Case 2: They swap cells (move through each other)
            if (p1NextKey === `${p2.position[0]},${p2.position[2]}` && p2NextKey === `${p1.position[0]},${p1.position[2]}`) {
                p1Crashed = p2Crashed = true;
            }
        } else if (p1Moved) {
            // Only p1 moves, check if it hits stationary p2
            if (p1NextKey === `${p2.position[0]},${p2.position[2]}`) {
                p1Crashed = true;
            }
        } else if (p2Moved) {
            // Only p2 moves, check if it hits stationary p1
            if (p2NextKey === `${p1.position[0]},${p1.position[2]}`) {
                p2Crashed = true;
            }
        }
    }
    
    // --- Game Over Check ---
    if (p1Crashed || p2Crashed) {
      if (gameOverRef.current) return;
      gameOverRef.current = true;
      
      if (p1Crashed) {
        p1.isAlive = false;
        onCrash({ position: p1NextPos, color: p1.color });
      }
      if (p2Crashed) {
        p2.isAlive = false;
        onCrash({ position: p2NextPos, color: p2.color });
      }

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

  return (
    <>
      <LightCycle player={player1Ref} />
      <Trail playerRef={player1Ref} />
      <ParticleTrail playerRef={player1Ref} />
      <LightCycle player={player2Ref} />
      <Trail playerRef={player2Ref} />
      <ParticleTrail playerRef={player2Ref} />
    </>
  );
};

const Scene: React.FC<GameCanvasProps> = ({ onGameOver, gameState, speedMultiplier, initialCameraState, onCameraChange }) => {
  const [crashes, setCrashes] = useState<CrashEvent[]>([]);
  const [powerUps, setPowerUps] = useState<PowerUpType[]>([]);
  const controlsRef = useRef<any>(null!);

  const handleCrash = useCallback((crashData: Omit<CrashEvent, 'id'>) => {
    setCrashes(currentCrashes => [
      ...currentCrashes,
      { ...crashData, id: Date.now() + Math.random() } // Add a unique ID
    ]);
  }, []);

  // Set initial camera state ONCE on mount
  useEffect(() => {
    if (controlsRef.current && initialCameraState) {
      controlsRef.current.object.position.fromArray(initialCameraState.position);
      controlsRef.current.target.fromArray(initialCameraState.target);
      controlsRef.current.update(); // Important to apply the changes
    }
  }, []); // Empty dependency array ensures it runs only once

  const handleControlsChange = useCallback(() => {
    if (controlsRef.current) {
      onCameraChange({
        position: controlsRef.current.object.position.toArray(),
        target: controlsRef.current.target.toArray(),
      });
    }
  }, [onCameraChange]);
  
  // Clear powerups on new game
  useEffect(() => {
    if (gameState === 'COUNTDOWN') {
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
        onGameOver={onGameOver} 
        onCrash={handleCrash} 
        gameState={gameState} 
        speedMultiplier={speedMultiplier} 
        powerUps={powerUps}
        setPowerUps={setPowerUps}
      />
      
      {crashes.map(crash => (
        <CrashParticles key={crash.id} position={crash.position} color={crash.color} />
      ))}

      {powerUps.map(p => (
        <PowerUp key={p.id} type={p.type} position={p.position} />
      ))}

      <OrbitControls 
        ref={controlsRef}
        onChange={handleControlsChange}
        minPolarAngle={0.1}
        maxPolarAngle={Math.PI / 2 - 0.1}
        enablePan={false}
        minDistance={30}
        maxDistance={150}
        zoomSpeed={0.5}
      />

      <EffectComposer>
        <Bloom intensity={2.0} luminanceThreshold={0.2} luminanceSmoothing={0.8} height={1080} />
      </EffectComposer>
    </>
  );
}

export const GameCanvas: React.FC<GameCanvasProps> = (props) => {
  return (
    <Canvas shadows camera={{ fov: 60, position: [0, 73, 7] }}>
      <Suspense fallback={null}>
        <Scene {...props} />
      </Suspense>
    </Canvas>
  );
};