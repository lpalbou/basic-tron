import React from 'react';
import { Canvas } from '@react-three/fiber';
import { PowerUp, POWERUP_CONFIG } from './PowerUp';
import { POWERUP_TYPES } from '../constants';
import type { PowerUpType } from '../types';

const POWERUP_DETAILS: Record<PowerUpType, { name: string; description: string }> = {
  SPEED_BOOST: { name: 'Speed Boost', description: 'Temporarily increases your speed.' },
  INVINCIBILITY: { name: 'Invincibility', description: 'Pass through trails without crashing.' },
  TRAIL_SHRINK: { name: 'Trail Shrink', description: "Instantly removes 50% of your opponent's trail." },
};

const LegendItem: React.FC<{ type: PowerUpType }> = ({ type }) => {
  const details = POWERUP_DETAILS[type];
  const config = POWERUP_CONFIG[type];

  return (
    <div className="flex items-center gap-2 sm:gap-3 p-1 rounded-lg">
      <div className="w-10 h-10 sm:w-12 sm:h-12 flex-shrink-0">
        <Canvas camera={{ fov: 35, position: [0, 0, 4.5] }}>
          <ambientLight intensity={1.5} />
          <pointLight position={[10, 10, 10]} intensity={10} />
          <PowerUp type={type} position={[0, 0, 0]} />
        </Canvas>
      </div>
      <div className="text-left">
        <p className="font-bold text-sm sm:text-base" style={{ color: config.color, textShadow: `0 0 5px ${config.color}` }}>
          {details.name}
        </p>
        <p className="text-xs sm:text-sm text-gray-300">{details.description}</p>
      </div>
    </div>
  );
};

export const PowerUpLegend: React.FC = () => {
  return (
    <div className="p-2 sm:p-3 rounded-lg bg-black bg-opacity-50 max-w-xs w-full animate-fadeIn border border-gray-700">
      <h3 className="text-md sm:text-lg font-bold uppercase tracking-widest mb-1 text-center text-gray-200">
        Power-Ups
      </h3>
      <div className="flex flex-col gap-0">
        {POWERUP_TYPES.map(type => <LegendItem key={type} type={type} />)}
      </div>
    </div>
  );
};