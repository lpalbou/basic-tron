

import React from 'react';
import { Canvas } from '@react-three/fiber';
import { PowerUp, POWERUP_CONFIG } from './PowerUp';
// fix: POWERUP_TYPES is exported from constants.ts, not types.ts.
import { POWERUP_TYPES } from '../constants';
import type { PowerUpType } from '../types';

const POWERUP_DETAILS: Record<PowerUpType, { name: string; description: string }> = {
  SPEED_BOOST: { name: 'Speed Boost', description: 'Temporarily increases your speed.' },
  INVINCIBILITY: { name: 'Invincibility', description: 'Pass through trails without crashing.' },
  TRAIL_SHRINK: { name: 'Trail Shrink', description: "Instantly removes 30% of your opponent's trail." },
};

const LegendItem: React.FC<{ type: PowerUpType }> = ({ type }) => {
  const details = POWERUP_DETAILS[type];
  const config = POWERUP_CONFIG[type];

  return (
    <div className="flex items-center gap-4 p-2 rounded-lg transition-colors hover:bg-white/10">
      <div className="w-16 h-16 flex-shrink-0">
        <Canvas camera={{ fov: 35, position: [0, 0, 4.5] }}>
          <ambientLight intensity={1.5} />
          <pointLight position={[10, 10, 10]} intensity={10} />
          <PowerUp type={type} position={[0, 0, 0]} />
        </Canvas>
      </div>
      <div className="text-left">
        <p className="font-bold text-lg" style={{ color: config.color, textShadow: `0 0 5px ${config.color}` }}>
          {details.name}
        </p>
        <p className="text-sm text-gray-300">{details.description}</p>
      </div>
    </div>
  );
};

export const PowerUpLegend: React.FC = () => {
  return (
    <div className="mt-8 p-4 rounded-lg bg-black bg-opacity-50 max-w-sm w-full animate-fadeIn border border-gray-700">
      <h3 className="text-xl font-bold uppercase tracking-widest mb-4 text-center text-gray-200">
        Power-Ups
      </h3>
      <div className="flex flex-col gap-2">
        {POWERUP_TYPES.map(type => <LegendItem key={type} type={type} />)}
      </div>
    </div>
  );
};