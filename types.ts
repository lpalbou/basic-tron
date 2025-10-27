
export type Direction = 'UP' | 'DOWN' | 'LEFT' | 'RIGHT';

export type PowerUpType = 'SPEED_BOOST' | 'INVINCIBILITY' | 'TRAIL_SHRINK';

export interface PowerUp {
  id: string;
  type: PowerUpType;
  position: [number, number, number];
}

export interface Player {
  id: number;
  position: [number, number, number];
  direction: Direction;
  path: [number, number, number][];
  isAlive: boolean;
  color: string;
  activePowerUp: {
    type: PowerUpType | null;
    duration: number; // in seconds
  };
  trailJustShrank?: boolean;
}

export type GameState = 'MENU' | 'COUNTDOWN' | 'PLAYING' | 'PAUSED' | 'CRASHED' | 'GAME_OVER';

export type ControlsType = 'ARROWS' | 'WASD';

export type CameraState = {
  position: [number, number, number];
  target: [number, number, number];
};

export type CameraView = 'THIRD_PERSON' | 'FOLLOW' | 'FIRST_PERSON';