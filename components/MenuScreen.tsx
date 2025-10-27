import React from 'react';
import { PowerUpLegend } from './PowerUpLegend';
import { PLAYER_1_COLOR, PLAYER_2_COLOR } from '../constants';

const commonButtonClasses = "px-4 sm:px-6 md:px-8 py-2 md:py-3 text-lg sm:text-xl md:text-2xl font-black uppercase rounded-md transition-all duration-300 transform hover:scale-105 focus:outline-none focus:ring-4 text-black";

const Controls: React.FC = () => (
    <div className="text-center text-gray-300 animate-fadeIn max-w-xs w-full">
        <h3 className="text-md sm:text-lg md:text-xl font-bold uppercase tracking-widest mb-2 md:mb-4">Controls</h3>
        <div className="grid grid-cols-2 gap-x-4 sm:gap-x-8 gap-y-2 md:gap-y-4 mx-auto text-xs sm:text-sm md:text-base">
            <div style={{ color: PLAYER_1_COLOR }}>
                <p className="font-bold">Player (User)</p>
                <p>Arrow Keys or Swipe</p>
            </div>
            <div style={{ color: PLAYER_2_COLOR }}>
                <p className="font-bold">AI Opponent</p>
                <p>Computer Controlled</p>
            </div>
        </div>
        <p className="text-gray-400 text-xs md:text-sm mt-3">Press 'X' to Change Speed</p>
        <p className="text-gray-400 text-xs md:text-sm mt-1 animate-pulse">Use Mouse/Touch to Orbit Camera</p>
    </div>
);

interface MenuScreenProps {
    onStart: () => void;
}

export const MenuScreen: React.FC<MenuScreenProps> = ({ onStart }) => (
    <div className="flex flex-col items-center gap-2 sm:gap-4 w-full h-full justify-center">
        <div className="flex items-center justify-center mb-4 sm:mb-8">
            <button
                onClick={onStart}
                className={commonButtonClasses}
                style={{ backgroundColor: PLAYER_1_COLOR, boxShadow: `0 0 30px ${PLAYER_1_COLOR}`, borderColor: PLAYER_1_COLOR }}
            >
                Start Game
            </button>
        </div>
        <div className="w-full max-w-4xl flex flex-col sm:flex-row items-center sm:items-start justify-center gap-4 sm:gap-8">
            <Controls />
            <PowerUpLegend />
        </div>
    </div>
);