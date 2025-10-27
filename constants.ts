import type { Player, PowerUpType } from './types';

// The size of the playable grid area.
export const GRID_SIZE = 76;
export const HALF_GRID_SIZE = GRID_SIZE / 2;

// The time in milliseconds between each game tick. Lower is faster.
export const GAME_SPEED_MS = 46; // Increased base speed by ~30% from 60

// Player visual constants.
export const PLAYER_1_COLOR = '#00f2ff';
export const PLAYER_2_COLOR = '#ff5500';

// Power-up visual constants
export const POWERUP_INVINCIBILITY_COLOR = '#ffffff';
export const POWERUP_SPEED_BOOST_COLOR = '#ffff00';

// Power-up constants
export const POWERUP_TYPES: PowerUpType[] = ['SPEED_BOOST', 'INVINCIBILITY', 'TRAIL_SHRINK'];
export const POWERUP_SPAWN_INTERVAL = 7; // seconds
export const POWERUP_DURATION = 5; // seconds
export const POWERUP_SPEED_MULTIPLIER = 1.8; // A bit less than 2x for better control
export const TRAIL_SHRINK_PERCENTAGE = 0.3;

// Initial state for Player 1 (User).
export const INITIAL_PLAYER_1_STATE: Player = {
  id: 1,
  position: [-Math.floor(HALF_GRID_SIZE / 2), 0.5, 0],
  direction: 'RIGHT',
  path: [[-Math.floor(HALF_GRID_SIZE / 2), 0.5, 0]],
  isAlive: true,
  color: PLAYER_1_COLOR,
  activePowerUp: { type: null, duration: 0 },
  trailJustShrank: false,
};

// Initial state for Player 2 (AI).
export const INITIAL_PLAYER_2_STATE: Player = {
  id: 2,
  position: [Math.floor(HALF_GRID_SIZE / 2), 0.5, 0],
  direction: 'LEFT',
  path: [[Math.floor(HALF_GRID_SIZE / 2), 0.5, 0]],
  isAlive: true,
  color: PLAYER_2_COLOR,
  activePowerUp: { type: null, duration: 0 },
  trailJustShrank: false,
};