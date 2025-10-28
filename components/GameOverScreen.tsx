import React from 'react';
import { PowerUpLegend } from './PowerUpLegend';
import { PLAYER_1_COLOR, PLAYER_2_COLOR } from '../constants';

const commonButtonClasses = "px-4 sm:px-6 md:px-8 py-2 md:py-3 text-lg sm:text-xl md:text-2xl font-black uppercase rounded-md transition-all duration-300 transform hover:scale-105 focus:outline-none focus:ring-4 text-black";

interface GameOverScreenProps {
    winner: number | null;
    scores: { player1: number; player2: number };
    onStart: () => void;
}

const PlayerStatus: React.FC<{
    name: string;
    score: number;
    color: string;
    isWinner: boolean;
}> = ({ name, score, color, isWinner }) => (
    <div className="flex flex-col items-center text-center w-36 sm:w-48" style={{ color: color, textShadow: `0 0 15px ${color}` }}>
        <span className="text-2xl sm:text-4xl md:text-5xl font-black">{name}</span>
        <span className="text-5xl sm:text-7xl md:text-8xl font-black my-1 sm:my-2">{score}</span>
        {isWinner && (
            <div className="flex flex-col items-center gap-1">
                <h2 className="text-2xl sm:text-4xl md:text-5xl font-serif font-bold tracking-wider" style={{ textShadow: `0 0 8px ${color}, 0 0 20px ${color}`}}>
                    WINS!
                </h2>
                <div className="h-1 w-20 sm:w-28" style={{ background: color, boxShadow: `0 0 15px ${color}` }}></div>
            </div>
        )}
    </div>
);


export const GameOverScreen: React.FC<GameOverScreenProps> = ({ winner, scores, onStart }) => {
    const isDraw = winner === null;
    const userWon = winner === 1;
    const aiWon = winner === 2;

    const winnerColor = userWon ? PLAYER_1_COLOR : (aiWon ? PLAYER_2_COLOR : PLAYER_1_COLOR);

    return (
        <div className="relative w-full h-full flex flex-col sm:flex-row items-center justify-around p-2 sm:p-4 gap-4">
            {/* Player 1 Status */}
            <PlayerStatus name="USER" score={scores.player1} color={PLAYER_1_COLOR} isWinner={userWon} />

            {/* Central Content */}
            <div className="flex flex-col items-center justify-center gap-4 sm:gap-6 order-first sm:order-none">
                {isDraw && (
                    <h2 className="text-3xl sm:text-4xl md:text-5xl font-serif font-bold tracking-wider text-white" style={{ textShadow: '0 0 10px rgba(255, 255, 255, 0.7)'}}>
                        IT'S A DRAW!
                    </h2>
                )}

                <button
                    onClick={onStart}
                    className={commonButtonClasses}
                    style={{ backgroundColor: winnerColor, boxShadow: `0 0 30px ${winnerColor}`, borderColor: winnerColor }}
                >
                    Play Again
                </button>
                
                <PowerUpLegend />
            </div>

            {/* Player 2 Status */}
            <PlayerStatus name="AI" score={scores.player2} color={PLAYER_2_COLOR} isWinner={aiWon} />
        </div>
    );
};