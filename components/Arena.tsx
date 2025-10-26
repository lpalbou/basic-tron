import React from 'react';
import { Grid } from '@react-three/drei';

interface ArenaProps {
  gridSize: number;
}

const Wall: React.FC<{ position: [number, number, number]; rotation: [number, number, number]; size: [number, number] }> = ({ position, rotation, size }) => {
  return (
    <mesh position={position} rotation={rotation}>
      <planeGeometry args={size} />
      <meshStandardMaterial color="#00ffff" emissive="#00ffff" emissiveIntensity={0.5} transparent opacity={0.2} />
    </mesh>
  );
};

export const Arena: React.FC<ArenaProps> = ({ gridSize }) => {
    const halfGrid = gridSize / 2;
    return (
    <>
      <Grid
        position={[0, -0.01, 0]}
        args={[gridSize, gridSize]}
        cellSize={1}
        cellThickness={1}
        cellColor="#111"
        sectionSize={5}
        sectionThickness={1.5}
        sectionColor="#00aaaa"
        fadeDistance={100}
        fadeStrength={1}
        infiniteGrid
      />
      {/* Arena Walls */}
      <Wall position={[-halfGrid, 2.5, 0]} rotation={[0, Math.PI / 2, 0]} size={[gridSize, 5]} />
      <Wall position={[halfGrid, 2.5, 0]} rotation={[0, -Math.PI / 2, 0]} size={[gridSize, 5]} />
      <Wall position={[0, 2.5, -halfGrid]} rotation={[0, 0, 0]} size={[gridSize, 5]} />
      <Wall position={[0, 2.5, halfGrid]} rotation={[0, -Math.PI, 0]} size={[gridSize, 5]} />
    </>
  );
};