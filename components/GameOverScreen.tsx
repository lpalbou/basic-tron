import React from 'react';
import { PowerUpLegend } from './PowerUpLegend';
import { PLAYER_1_COLOR, PLAYER_2_COLOR } from '../constants';

const commonButtonClasses = "px-4 sm:px-6 md:px-8 py-2 md:py-3 text-lg sm:text-xl md:text-2xl font-black uppercase rounded-md transition-all duration-300 transform hover:scale-105 focus:outline-none focus:ring-4 text-black";

interface GameOverScreenProps {
    winner: number | null;
    scores: { player1: number; player2: number };
    onStart: () => void;
}

export const GameOverScreen: React.FC<GameOverScreenProps> = ({ winner, scores, onStart }) => {
    const isDraw = winner === null;
    const winnerText = winner === 1 ? 'USER WINS!' : 'AI WINS!';
    const winnerColor = winner === 1 ? PLAYER_1_COLOR : PLAYER_2_COLOR;
    const buttonColor = isDraw ? PLAYER_1_COLOR : winnerColor;

    return (
        <div className="relative w-full h-full flex items-center justify-center p-4">
            {/* USER Score - Positioned Left, Vertically Centered */}
            <div className="absolute left-4 sm:left-8 top-1/2 -translate-y-1/2 flex flex-col items-center" style={{ color: PLAYER_1_COLOR, textShadow: `0 0 15px ${PLAYER_1_COLOR}` }}>
                <span className="text-2xl sm:text-4xl md:text-5xl font-black">USER</span>
                <span className="text-5xl sm:text-7xl md:text-8xl font-black mt-1 sm:mt-2">{scores.player1}</span>
            </div>

            {/* Central Content Column */}
            <div className="flex flex-col items-center justify-center gap-2 sm:gap-4">
                {/* Winner Announcement */}
                <div className="text-center mb-2 sm:mb-4">
                    {isDraw ? (
                        <h2 className="text-2xl sm:text-4xl md:text-5xl font-serif font-bold tracking-wider text-white" style={{ textShadow: '0 0 10px rgba(255, 255, 255, 0.7)'}}>
                            IT'S A DRAW!
                        </h2>
                    ) : (
                        <div className="flex flex-col items-center gap-1 md:gap-2">
                            <h2 className="text-2xl sm:text-4xl md:text-5xl font-serif font-bold tracking-wider" style={{ color: winnerColor, textShadow: `0 0 8px ${winnerColor}, 0 0 20px ${winnerColor}`}}>
                                {winnerText}
                            </h2>
                            <div className="h-1 w-20 sm:w-28 md:w-40" style={{ background: winnerColor, boxShadow: `0 0 15px ${winnerColor}` }}></div>
                        </div>
                    )}
                </div>

                {/* Play Again Button */}
                <div className="flex items-center justify-center">
                    <button
                        onClick={onStart}
                        className={commonButtonClasses}
                        style={{ backgroundColor: buttonColor, boxShadow: `0 0 30px ${buttonColor}`, borderColor: buttonColor }}
                    >
                        Play Again
                    </button>
                </div>

                {/* Power-Ups Legend */}
                <PowerUpLegend />
            </div>

            {/* AI Score - Positioned Right, Vertically Centered */}
            <div className="absolute right-4 sm:right-8 top-1/2 -translate-y-1/2 flex flex-col items-center" style={{ color: PLAYER_2_COLOR, textShadow: `0 0 15px ${PLAYER_2_COLOR}` }}>
                <span className="text-2xl sm:text-4xl md:text-5xl font-black">AI</span>
                <span className="text-5xl sm:text-7xl md:text-8xl font-black mt-1 sm:mt-2">{scores.player2}</span>
            </div>
        </div>
    );
};