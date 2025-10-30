import React from 'react';
import { Canvas } from '@react-three/fiber';
import { PowerUp, POWERUP_CONFIG } from './PowerUp';
import { POWERUP_TYPES } from '../constants';
import type { PowerUpType } from '../types';

const POWERUP_DETAILS: Record<PowerUpType, { name: string; description: string }> = {
  SPEED_BOOST: { name: 'Speed Boost', description: 'Temporarily increases your speed.' },
  INVINCIBILITY: { name: 'Invincibility', description: 'Pass through trails without crashing.' },
  TRAIL_SHRINK: { name: 'Trail Shrink', description: "Instantly removes 50% of your opponent's trail." },
  EMP_SHOCKWAVE: { name: 'EMP Shockwave', description: 'Temporarily freezes your opponent in place.' },
};

const LegendItem: React.FC<{ type: PowerUpType }> = ({ type }) => {
  const details = POWERUP_DETAILS[type];
  const config = POWERUP_CONFIG[type];

  return (
    <div className="flex items-center gap-1 sm:gap-2 p-0 sm:p-0.5 rounded-lg">
      <div className="w-6 h-6 sm:w-10 sm:h-10 flex-shrink-0">
        <Canvas camera={{ fov: 35, position: [0, 0, 4.5] }}>
          <ambientLight intensity={1.5} />
          <pointLight position={[10, 10, 10]} intensity={10} />
          <PowerUp type={type} position={[0, 0, 0]} />
        </Canvas>
      </div>
      <div className="text-left flex-1 min-w-0">
        <p className="font-bold text-[10px] sm:text-sm leading-tight truncate" style={{ color: config.color, textShadow: `0 0 5px ${config.color}` }}>
          {details.name}
        </p>
        <p className="text-[9px] sm:text-xs text-gray-300 leading-tight line-clamp-2">{details.description}</p>
      </div>
    </div>
  );
};

export const PowerUpLegend: React.FC = () => {
  return (
    <div className="p-1 sm:p-2 rounded-lg bg-black bg-opacity-50 max-w-[280px] sm:max-w-xs w-full animate-fadeIn border border-gray-700">
      <h3 className="text-[11px] sm:text-base font-bold uppercase tracking-wider mb-0.5 sm:mb-1 text-center text-gray-200">
        Power-Ups
      </h3>
      <div className="flex flex-col gap-0 sm:gap-0.5">
        {POWERUP_TYPES.map(type => <LegendItem key={type} type={type} />)}
      </div>
    </div>
  );
};
