
import React, { useRef, Suspense, useEffect, useState, useCallback } from 'react';
import { Canvas, useFrame } from '@react-three/fiber';
import { EffectComposer, Bloom, Noise } from '@react-three/postprocessing';
import { BlendFunction } from 'postprocessing';
import { Vector3 } from 'three';
import { Arena } from './Arena';
import { LightCycle } from './LightCycle';
import { Trail } from './Trail';
import type { Player, Direction, GameState, CameraState, PowerUp as PowerUpType, CameraView, SfxControls } from '../types';
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
  EMP_FREEZE_DURATION,
} from '../constants';
import { PowerUp } from './PowerUp';
import { ParticleTrail } from './ParticleTrail';
import { DynamicCamera } from './DynamicCamera';
import { DistantData } from './DigitalDust';
import { WallSparks } from './WallSparks';
import { TrailSparks } from './TrailSparks';
import { SfxKey } from '../hooks/useSoundEffects';
import { Shockwave } from './Shockwave';
import { ScreenshotHandler } from './ScreenshotHandler';

interface GameCanvasProps {
  onGameOver: (winner: number | null) => void;
  gameState: GameState;
  speedMultiplier: number;
  savedCameraState: CameraState;
  onCameraChange: (newState: CameraState) => void;
  cameraView: CameraView;
  sfx: SfxControls;
  scores: { player1: number; player2: number };
}

interface ShockwaveState {
    id: string;
    position: [number, number, number];
}

interface GameLoopProps {
  player1Ref: React.MutableRefObject<Player>;
  player2Ref: React.MutableRefObject<Player>;
  onGameOver: (winner: number | null) => void;
  gameState: GameState;
  speedMultiplier: number;
  powerUps: PowerUpType[];
  setPowerUps: React.Dispatch<React.SetStateAction<PowerUpType[]>>;
  setShockwaves: React.Dispatch<React.SetStateAction<ShockwaveState[]>>;
  sfx: SfxControls;
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

const GameLoop: React.FC<GameLoopProps> = ({ player1Ref, player2Ref, onGameOver, gameState, speedMultiplier, powerUps, setPowerUps, setShockwaves, sfx }) => {
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
    
    const p1 = player1Ref.current;
    const p2 = player2Ref.current;

    // --- Wall Proximity Sound ---
    const [x, , z] = p1.position;
    const halfGrid = GRID_SIZE / 2;
    const dists = [x + halfGrid, halfGrid - x, z + halfGrid, halfGrid - z];
    sfx.updateWallProximityVolume(Math.min(...dists));

    // --- Trail Proximity Effects ---
    const px = Math.round(p1.position[0]);
    const pz = Math.round(p1.position[2]);
    const opx = Math.round(p2.position[0]);
    const opz = Math.round(p2.position[2]);
    const prevPos = p1.path.length > 1 ? p1.path[p1.path.length - 2] : null;
    const prev_px = prevPos ? Math.round(prevPos[0]) : -Infinity;
    const prev_pz = prevPos ? Math.round(prevPos[2]) : -Infinity;

    let minTrailDist = Infinity;
    let closestTrailPoint: { x: number; z: number } | null = null;
    const searchRadius = 3; // Scan a 7x7 grid (3 unit radius)

    for (let i = -searchRadius; i <= searchRadius; i++) {
        for (let j = -searchRadius; j <= searchRadius; j++) {
            if (i === 0 && j === 0) continue; // Skip player's own cell
            const nx = px + i;
            const nz = pz + j;

            const key = `${nx},${nz}`;
            // Exclude player's recent trail and opponent's head
            if (key === `${prev_px},${prev_pz}` || key === `${opx},${opz}`) continue;

            if (collisionGrid.current.has(key)) {
                // Calculate distance from actual player position to the center of the grid cell
                const dist = Math.hypot(p1.position[0] - nx, p1.position[2] - nz);
                if (dist < minTrailDist) {
                    minTrailDist = dist;
                    closestTrailPoint = { x: nx, z: nz };
                }
            }
        }
    }

    // Update Volume based on the calculated distance
    sfx.updateTrailProximityVolume(minTrailDist);

    // Trigger visual effects (sparks, shake) only when extremely close
    if (minTrailDist <= 1.1 && closestTrailPoint) {
        const trailPointVec = new Vector3(closestTrailPoint.x, 0.5, closestTrailPoint.z);
        const playerPoint = new Vector3(p1.position[0], 0.5, p1.position[2]);
        
        const trailOwner = p2.path.some(p => Math.round(p[0]) === closestTrailPoint!.x && Math.round(p[2]) === closestTrailPoint!.z) ? p2 : p1;
        
        const sparkPosition = new Vector3().lerpVectors(trailPointVec, playerPoint, 0.5);
        const sparkNormal = new Vector3().subVectors(playerPoint, trailPointVec).normalize();

        window.dispatchEvent(new CustomEvent('trail-proximity', {
            detail: {
                proximity: 1.0, // For shake intensity
                sparkPosition: sparkPosition.toArray(),
                sparkNormal: sparkNormal.toArray(),
                trailColor: trailOwner.color,
            }
        }));
    } else {
        // Dispatch event to stop camera shake when not close
        window.dispatchEvent(new CustomEvent('trail-proximity', { detail: { proximity: 0 } }));
    }

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

    // --- Update Player Status (Power-ups & Freeze) ---
    if (p1.activePowerUp.duration > 0) {
        p1.activePowerUp.duration -= delta;
        if (p1.activePowerUp.duration <= 0) p1.activePowerUp = { type: null, duration: 0 };
    }
     if (p1.frozenFor > 0) p1.frozenFor -= delta;

    if (p2.activePowerUp.duration > 0) {
        p2.activePowerUp.duration -= delta;
        if (p2.activePowerUp.duration <= 0) p2.activePowerUp = { type: null, duration: 0 };
    }
    if (p2.frozenFor > 0) p2.frozenFor -= delta;

    // --- Independent Movement Logic ---
    if (p1.frozenFor <= 0) {
        p1TimeAccumulator.current += delta;
    }
    if (p2.frozenFor <= 0) {
        p2TimeAccumulator.current += delta;
    }

    const p1Speed = p1.activePowerUp.type === 'SPEED_BOOST' ? POWERUP_SPEED_MULTIPLIER : 1;
    const p2Speed = p2.activePowerUp.type === 'SPEED_BOOST' ? POWERUP_SPEED_MULTIPLIER : 1;
    
    const p1TimeStep = (GAME_SPEED_MS / 1000.0) / (speedMultiplier * p1Speed);
    const p2TimeStep = (GAME_SPEED_MS / 1000.0) / (speedMultiplier * p2Speed);

    let p1Moved = false;
    let p2Moved = false;
    
    // Player 2 (AI) direction logic.
    if (p2.isAlive && p2.frozenFor <= 0) {
        let movedForPowerUp = false;
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
                if (Math.abs(dx) > Math.abs(dz)) { desiredDir = dx > 0 ? 'RIGHT' : 'LEFT'; }
                else { desiredDir = dz > 0 ? 'DOWN' : 'UP'; }
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

    if (p1.isAlive && p1.frozenFor <= 0 && p1TimeAccumulator.current >= p1TimeStep) { p1TimeAccumulator.current -= p1TimeStep; p1Moved = true; }
    if (p2.isAlive && p2.frozenFor <= 0 && p2TimeAccumulator.current >= p2TimeStep) { p2TimeAccumulator.current -= p2TimeStep; p2Moved = true; }

    if (!p1Moved && !p2Moved) return;
    
    const p1NextPos = p1Moved ? calculateNextPos(p1.position, p1.direction) : p1.position;
    const p2NextPos = p2Moved ? calculateNextPos(p2.position, p2.direction) : p2.position;

    // --- Power-up Collection ---
    const checkAndCollect = (collector: Player, opponent: Player, nextPos: [number, number, number]) => {
        const collected = powerUps.find(p => Math.hypot(p.position[0] - nextPos[0], p.position[2] - nextPos[2]) <= 1.0);
        if (collected) {
            setPowerUps(prev => prev.filter(p => p.id !== collected.id));
            if (collector.id === 1) { // Only play sounds for the user
                switch (collected.type) {
                    case 'INVINCIBILITY':
                        sfx.playSound('invincible');
                        break;
                    case 'TRAIL_SHRINK':
                        sfx.playSound('trailShrink');
                        break;
                    case 'SPEED_BOOST':
                        sfx.playSound('invincible', { volume: 0.8 });
                        break;
                    case 'EMP_SHOCKWAVE':
                        sfx.playSound('emp_shockwave');
                        break;
                }
            }
            if (collected.type === 'TRAIL_SHRINK') {
                const amount = Math.floor(opponent.path.length * TRAIL_SHRINK_PERCENTAGE);
                if (amount > 0) {
                    const removed = opponent.path.splice(0, amount);
                    removed.forEach(point => collisionGrid.current.delete(`${Math.round(point[0])},${Math.round(point[2])}`));
                    opponent.trailJustShrank = true;
                }
            } else if (collected.type === 'EMP_SHOCKWAVE') {
                opponent.frozenFor = EMP_FREEZE_DURATION;
                setShockwaves(prev => [...prev, { id: `sw-${Date.now()}`, position: collected.position }]);
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
    let p1CrashSound: SfxKey | null = null;
    
    const isWallCollision = (pos: [number, number, number]): boolean => {
        const [x_pos, , z_pos] = pos;
        const hg = GRID_SIZE / 2;
        return x_pos <= -hg || x_pos >= hg || z_pos <= -hg || z_pos >= hg;
    };
    const isTrailCollision = (pos: [number, number, number], grid: Set<string>): boolean => {
        const [x_pos, , z_pos] = pos;
        return grid.has(`${Math.round(x_pos)},${Math.round(z_pos)}`);
    };

    if (p1Moved && p1.isAlive) {
        if (isWallCollision(p1NextPos)) {
            p1Crashed = true;
            p1CrashSound = 'crashWall';
        } else if (p1.activePowerUp.type !== 'INVINCIBILITY' && isTrailCollision(p1NextPos, collisionGrid.current)) {
            p1Crashed = true;
            p1CrashSound = 'crashBike';
        }
    }
    if (p2Moved && p2.isAlive) {
        if (!isSafe(p2NextPos, collisionGrid.current, p2)) p2Crashed = true;
    }
    if (p1.isAlive && p2.isAlive) {
        const p1NextKey = `${Math.round(p1NextPos[0])},${Math.round(p1NextPos[2])}`;
        const p2NextKey = `${Math.round(p2NextPos[0])},${Math.round(p2NextPos[2])}`;
        if (p1Moved && p2Moved) {
            if (p1NextKey === p2NextKey) { p1Crashed = p2Crashed = true; if (!p1CrashSound) p1CrashSound = 'crashBike'; }
            if (p1NextKey === `${Math.round(p2.position[0])},${Math.round(p2.position[2])}` && p2NextKey === `${Math.round(p1.position[0])},${Math.round(p1.position[2])}`) { p1Crashed = p2Crashed = true; if (!p1CrashSound) p1CrashSound = 'crashBike'; }
        } else if (p1Moved) {
            if (p1NextKey === `${Math.round(p2.position[0])},${Math.round(p2.position[2])}`) { p1Crashed = true; if (!p1CrashSound) p1CrashSound = 'crashBike'; }
        }
    }
    
    // --- Game Over Check ---
    if (p1Crashed || p2Crashed) {
      if (gameOverRef.current) return;
      gameOverRef.current = true;
      if (p1Crashed) { // Only dispatch events/sounds for the user's crash
        window.dispatchEvent(new CustomEvent('camera-shake', { detail: { intensity: 0.4, duration: 0.5 } }));
        if (p1CrashSound) sfx.playSound(p1CrashSound);
      }
      if (p1Crashed) p1.isAlive = false;
      if (p2Crashed) p2.isAlive = false;
      if (!p1.isAlive && !p2.isAlive) onGameOver(null);
      else if (!p1.isAlive) onGameOver(2);
      else onGameOver(1);
      return;
    }

    // --- Update Positions & Trails ---
    if (p1Moved && p1.isAlive) {
      collisionGrid.current.add(`${Math.round(p1.position[0])},${Math.round(p1.position[2])}`);
      p1.position = p1NextPos;
      p1.path.push(p1NextPos);
    }
    if (p2Moved && p2.isAlive) {
      collisionGrid.current.add(`${Math.round(p2.position[0])},${Math.round(p2.position[2])}`);
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
    sfx,
    scores,
}) => {
  const [powerUps, setPowerUps] = useState<PowerUpType[]>([]);
  const [shockwaves, setShockwaves] = useState<ShockwaveState[]>([]);
  const [isInvincible, setIsInvincible] = useState(false);

  const player1Ref = useRef<Player>(JSON.parse(JSON.stringify(INITIAL_PLAYER_1_STATE)));
  const player2Ref = useRef<Player>(JSON.parse(JSON.stringify(INITIAL_PLAYER_2_STATE)));

  useFrame(() => {
    const p1 = player1Ref.current;
    if (p1) {
      const shouldBeInvincible = p1.activePowerUp.type === 'INVINCIBILITY' && p1.isAlive;
      if (shouldBeInvincible !== isInvincible) {
        setIsInvincible(shouldBeInvincible);
      }
    }
  });
  
  // Start/stop proximity sound with game state
  useEffect(() => {
    if (gameState === 'PLAYING') {
      sfx.startWallProximitySound();
      sfx.startTrailProximitySound();
    } else {
      sfx.stopWallProximitySound();
      sfx.stopTrailProximitySound();
    }
    return () => { 
        sfx.stopWallProximitySound();
        sfx.stopTrailProximitySound();
    };
  }, [gameState, sfx]);

  // --- Simplified Input Handler (listens for custom events from App.tsx) ---
  useEffect(() => {
    const handlePlayerInput = (e: Event) => {
      const { detail } = e as CustomEvent;
      const p1 = player1Ref.current;
      const oldDirection = p1.direction;

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

      if (p1.direction !== oldDirection) {
        sfx.playSound('turn');
      }
    };
    
    window.addEventListener('player-input', handlePlayerInput);
    return () => {
      window.removeEventListener('player-input', handlePlayerInput);
    };
  }, [cameraView, sfx]);
  
  useEffect(() => {
    if (gameState === 'COUNTDOWN') {
      player1Ref.current = JSON.parse(JSON.stringify(INITIAL_PLAYER_1_STATE));
      player2Ref.current = JSON.parse(JSON.stringify(INITIAL_PLAYER_2_STATE));
      setPowerUps([]);
      setShockwaves([]);
    }
  }, [gameState]);


  return (
    <>
      {/* SOTA PBR Lighting System for Enhanced 3D Rendering */}
      
      {/* Ambient light - very low for dramatic PBR effect */}
      <ambientLight intensity={0.05} color="#ffffff" />
      
      {/* Environment hemisphere light for realistic ambient */}
      <hemisphereLight 
        intensity={0.2} 
        color="#87CEEB" 
        groundColor="#1a1a2e" 
      />
      
      {/* Key Light - Primary directional light with high-quality shadows */}
      <directionalLight
        position={[25, 30, 20]}
        intensity={3.0}
        color="#ffffff"
        castShadow
        shadow-mapSize-width={4096}
        shadow-mapSize-height={4096}
        shadow-camera-near={0.1}
        shadow-camera-far={100}
        shadow-camera-left={-60}
        shadow-camera-right={60}
        shadow-camera-top={60}
        shadow-camera-bottom={-60}
        shadow-bias={-0.0001}
        shadow-normalBias={0.02}
      />
      
      {/* Fill Light - Softer light from opposite side for detail visibility */}
      <directionalLight
        position={[-20, 20, 15]}
        intensity={1.2}
        color="#4169E1"
        castShadow={false}
      />
      
      {/* Rim Light - Strong backlight for edge definition and PBR highlights */}
      <directionalLight
        position={[0, 15, -30]}
        intensity={2.0}
        color="#FF6B35"
        castShadow={false}
      />
      
      {/* Side accent lights for enhanced normal map visibility */}
      <pointLight
        position={[20, 10, 0]}
        intensity={1.5}
        color="#00CED1"
        distance={40}
        decay={2}
        castShadow={false}
      />
      
      <pointLight
        position={[-20, 10, 0]}
        intensity={1.2}
        color="#FF1493"
        distance={40}
        decay={2}
        castShadow={false}
      />
      
      {/* Overhead accent for metallic reflections */}
      <pointLight
        position={[0, 25, 0]}
        intensity={0.8}
        color="#FFD700"
        distance={50}
        decay={2}
        castShadow={false}
      />
      
      <Arena gridSize={GRID_SIZE} scores={scores} />
      
      {/* Enhanced ground plane for shadow reception */}
      <mesh rotation={[-Math.PI / 2, 0, 0]} position={[0, -0.05, 0]} receiveShadow>
        <planeGeometry args={[200, 200]} />
        <meshStandardMaterial 
          color="#0a0a0a" 
          roughness={0.8}
          metalness={0.1}
        />
      </mesh>
      
      <DistantData />
      
      <GameLoop 
        player1Ref={player1Ref}
        player2Ref={player2Ref}
        onGameOver={onGameOver} 
        gameState={gameState} 
        speedMultiplier={speedMultiplier} 
        powerUps={powerUps}
        setPowerUps={setPowerUps}
        setShockwaves={setShockwaves}
        sfx={sfx}
      />
      
      <LightCycle player={player1Ref} gameState={gameState} />
      <Trail playerRef={player1Ref} />
      <ParticleTrail playerRef={player1Ref} gameState={gameState} />
      <WallSparks playerRef={player1Ref} />
      <TrailSparks />
      
      <LightCycle player={player2Ref} gameState={gameState} />
      <Trail playerRef={player2Ref} />
      <ParticleTrail playerRef={player2Ref} gameState={gameState} />

      {powerUps.map(p => (
        <PowerUp key={p.id} type={p.type} position={p.position} />
      ))}

      {shockwaves.map(sw => (
        <Shockwave 
            key={sw.id} 
            position={sw.position} 
            onComplete={() => setShockwaves(s => s.filter(x => x.id !== sw.id))} 
        />
      ))}

      <DynamicCamera
        cameraView={cameraView}
        playerRef={player1Ref}
        savedCameraState={savedCameraState}
        onCameraChange={onCameraChange}
        gameState={gameState}
      />

      <ScreenshotHandler />

      <EffectComposer>
        <Bloom intensity={1.5} luminanceThreshold={0.25} luminanceSmoothing={0.9} height={1080} />
        <Noise
          premultiply
          opacity={isInvincible ? 0.15 : 0}
          blendFunction={BlendFunction.ADD}
        />
      </EffectComposer>
    </>
  );
}

export const GameCanvas: React.FC<GameCanvasProps> = (props) => {
  return (
    <Canvas 
      shadows 
      camera={{ fov: 60 }}
      gl={{ 
        preserveDrawingBuffer: true,
        antialias: true,
        alpha: false,
        powerPreference: "high-performance"
      }}
    >
      <Suspense fallback={null}>
        <Scene {...props} />
      </Suspense>
    </Canvas>
  );
};
