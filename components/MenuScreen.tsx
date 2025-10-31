import React from 'react';
import { PowerUpLegend } from './PowerUpLegend';
import { PLAYER_1_COLOR, PLAYER_2_COLOR } from '../constants';

const commonButtonClasses = "px-4 sm:px-6 md:px-8 py-2 md:py-3 text-lg sm:text-xl md:text-2xl font-black uppercase rounded-md transition-all duration-300 transform hover:scale-105 focus:outline-none focus:ring-4 text-black";

const Controls: React.FC<{ onStart: () => void }> = ({ onStart }) => (
    <div className="text-center text-gray-300 animate-fadeIn max-w-xs w-full">
        <h3 className="text-sm sm:text-lg md:text-xl font-bold uppercase tracking-widest mb-1 sm:mb-2 md:mb-4">Controls</h3>
        <div className="grid grid-cols-2 gap-x-3 sm:gap-x-8 gap-y-1 sm:gap-y-2 md:gap-y-4 mx-auto text-xs sm:text-sm md:text-base">
            <div style={{ color: PLAYER_1_COLOR }}>
                <p className="font-bold text-xs sm:text-base">Player (User)</p>
                <p className="text-xs sm:text-sm">Arrow Keys or Swipe</p>
            </div>
            <div style={{ color: PLAYER_2_COLOR }}>
                <p className="font-bold text-xs sm:text-base">AI Opponent</p>
                <p className="text-xs sm:text-sm">Computer Controlled</p>
            </div>
        </div>
        <p className="text-gray-400 text-xs sm:text-sm md:text-base mt-1 sm:mt-3">Press 'X' to Change Speed</p>
        <p className="text-gray-400 text-xs sm:text-sm md:text-base mt-0.5 sm:mt-1">Press 'G' to Toggle Grid Lines</p>
        <p className="text-gray-400 text-xs sm:text-sm md:text-base mt-0.5 sm:mt-1 animate-pulse">Use Mouse/Touch to Orbit Camera</p>

        {/* Start button integrated below controls */}
        <div className="mt-2 sm:mt-4">
            <button
                onClick={onStart}
                className={commonButtonClasses}
                style={{ backgroundColor: PLAYER_1_COLOR, boxShadow: `0 0 30px ${PLAYER_1_COLOR}`, borderColor: PLAYER_1_COLOR }}
            >
                Start Game
            </button>
        </div>
    </div>
);

interface MenuScreenProps {
    onStart: () => void;
}

export const MenuScreen: React.FC<MenuScreenProps> = ({ onStart }) => (
    <div className="flex flex-col items-center gap-2 sm:gap-4 w-full h-full justify-center sm:px-2">
        <div className="w-full max-w-4xl flex flex-col sm:flex-row items-center sm:items-start justify-center gap-2 sm:gap-8">
            <Controls onStart={onStart} />
            <PowerUpLegend />
        </div>
    </div>
);
