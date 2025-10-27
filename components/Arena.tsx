
import React from 'react';
import { Grid } from '@react-three/drei';

interface ArenaProps {
  gridSize: number;
}

const Wall: React.FC<{ position: [number, number, number]; rotation: [number, number, number]; size: [number, number, number] }> = ({ position, rotation, size }) => {
  return (
    <mesh position={position} rotation={rotation}>
      <boxGeometry args={size} />
      {/* Material is less transparent and less emissive for a more solid feel */}
      <meshStandardMaterial color="#00ffff" emissive="#00aaaa" emissiveIntensity={0.2} transparent opacity={0.4} />
    </mesh>
  );
};

export const Arena: React.FC<ArenaProps> = ({ gridSize }) => {
    const halfGrid = gridSize / 2;
    const wallHeight = 5;
    const wallThickness = 2;

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
      <Wall position={[-halfGrid, wallHeight / 2, 0]} rotation={[0, Math.PI / 2, 0]} size={[gridSize, wallHeight, wallThickness]} />
      <Wall position={[halfGrid, wallHeight / 2, 0]} rotation={[0, -Math.PI / 2, 0]} size={[gridSize, wallHeight, wallThickness]} />
      <Wall position={[0, wallHeight / 2, -halfGrid]} rotation={[0, 0, 0]} size={[gridSize, wallHeight, wallThickness]} />
      <Wall position={[0, wallHeight / 2, halfGrid]} rotation={[0, -Math.PI, 0]} size={[gridSize, wallHeight, wallThickness]} />
    </>
  );
};
