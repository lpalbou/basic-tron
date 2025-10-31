import React, { useMemo, useRef } from 'react';
import { useFrame } from '@react-three/fiber';
import { Grid, Text } from '@react-three/drei';
import { CanvasTexture, MeshStandardMaterial, RepeatWrapping, AdditiveBlending, type Material } from 'three';
import { PLAYER_1_COLOR, PLAYER_2_COLOR } from '../constants';

interface EnhancedGridProps {
  gridSize: number;
  visible: boolean;
}

const EnhancedTronGrid: React.FC<EnhancedGridProps> = ({ gridSize, visible }) => {
    const gridRef = useRef<any>(null);
    
    if (!visible) return null;
    
    return (
        <>
            {/* Pure Digital Grid - Clean Tron Aesthetic */}
            <Grid
                ref={gridRef}
                position={[0, 0, 0]}   // Exactly at ground level
                args={[gridSize * 1.2, gridSize * 1.2]}
                cellSize={2}           // Clean cell spacing
                cellThickness={0.8}    // Crisp, visible lines
                cellColor="#004444"    // Subtle cyan for spatial reference
                sectionSize={8}        // Refined major grid spacing
                sectionThickness={1.4} // Clean, prominent major lines
                sectionColor="#0088aa" // Clear but not harsh teal
                fadeDistance={120}     // Crisp perspective fade
                fadeStrength={0.5}     // Maintains visibility at distance
                infiniteGrid={false}
            />
        </>
    );
};

// Create a scanline texture programmatically
const createScanlineTexture = () => {
    const canvas = document.createElement('canvas');
    canvas.width = 128;
    canvas.height = 128;
    const context = canvas.getContext('2d')!;
    context.fillStyle = 'rgba(0, 0, 0, 0)';
    context.fillRect(0, 0, 128, 128);
    
    // Create more visible, distinct energy bars
    for (let i = 0; i < 128; i += 8) { // Increased spacing for more distinct bars
        // Higher alpha for more pronounced visibility
        const alpha = 0.4 + Math.random() * 0.3; // Range: 0.4 to 0.7
        context.fillStyle = `rgba(100, 255, 255, ${alpha})`;
        context.fillRect(0, i, 128, 4); // Thicker bars
    }
    
    const texture = new CanvasTexture(canvas);
    texture.wrapS = RepeatWrapping;
    texture.wrapT = RepeatWrapping;
    return texture;
};

const Wall: React.FC<{ position: [number, number, number]; rotation: [number, number, number]; size: [number, number] }> = ({ position, rotation, size }) => {
    const materialRef = useRef<MeshStandardMaterial>(null!);
    
    const scanlineTexture = useMemo(() => {
        const texture = createScanlineTexture();
        texture.repeat.set(size[0] / 10, size[1] / 10);
        return texture;
    }, [size]);

    useFrame((_, delta) => {
        if (materialRef.current && materialRef.current.map) {
            // Scroll the texture
            materialRef.current.map.offset.y -= delta * 0.1;
        }
    });
    
    const wallHeight = size[1];
    const edgeThickness = 0.2;

    return (
        <group position={position} rotation={rotation}>
            {/* Main energy field */}
            <mesh>
                <planeGeometry args={size} />
                <meshStandardMaterial
                    ref={materialRef}
                    color="#00ffff"
                    emissive="#00ffff"
                    emissiveIntensity={0.8}
                    transparent
                    opacity={0.3}
                    map={scanlineTexture}
                    toneMapped={false}
                    depthWrite={false}
                    blending={AdditiveBlending}
                />
            </mesh>
            {/* Top and bottom glowing edges */}
            <mesh position={[0, wallHeight / 2, 0]}>
                <boxGeometry args={[size[0], edgeThickness, edgeThickness]} />
                <meshStandardMaterial color="#00ffff" emissive="#00ffff" emissiveIntensity={2} toneMapped={false} />
            </mesh>
            <mesh position={[0, -wallHeight / 2, 0]}>
                <boxGeometry args={[size[0], edgeThickness, edgeThickness]} />
                <meshStandardMaterial color="#00ffff" emissive="#00ffff" emissiveIntensity={2} toneMapped={false} />
            </mesh>
        </group>
    );
};


const HolographicScoreboard: React.FC<{ scores: { player1: number, player2: number }; gridSize: number }> = ({ scores, gridSize }) => {
    const halfGrid = gridSize / 2;
    const wallY = 3.5; // Y position on the wall
    const wallOffset = 0.5; // Distance from the wall
    
    // FIX: Pass initial value to useRef to resolve "Expected 1 arguments, but got 0" error.
    const textRef1 = useRef<any>(null);
    // FIX: Pass initial value to useRef to resolve "Expected 1 arguments, but got 0" error.
    const textRef2 = useRef<any>(null);

    useFrame(({ clock }) => {
        // Subtle floating animation
        const floatY = Math.sin(clock.getElapsedTime()) * 0.1;
        if (textRef1.current) {
            textRef1.current.position.y = wallY + floatY;
        }
        if (textRef2.current) {
            textRef2.current.position.y = wallY - floatY; // Offset phase for variety
        }
    });

    return (
        <group>
            {/* Player 1 Score (Left Wall) */}
            <Text
                ref={textRef1}
                position={[-halfGrid + wallOffset, wallY, 0]}
                rotation={[0, Math.PI / 2, 0]}
                fontSize={5}
                color={PLAYER_1_COLOR}
                anchorX="center"
                anchorY="middle"
            >
                {`USER: ${scores.player1}`}
                <meshStandardMaterial
                    emissive={PLAYER_1_COLOR}
                    emissiveIntensity={2}
                    toneMapped={false}
                />
            </Text>

            {/* Player 2 Score (Right Wall) */}
            <Text
                ref={textRef2}
                position={[halfGrid - wallOffset, wallY, 0]}
                rotation={[0, -Math.PI / 2, 0]}
                fontSize={5}
                color={PLAYER_2_COLOR}
                anchorX="center"
                anchorY="middle"
            >
                {`AI: ${scores.player2}`}
                <meshStandardMaterial
                    emissive={PLAYER_2_COLOR}
                    emissiveIntensity={2}
                    toneMapped={false}
                />
            </Text>
        </group>
    );
};

export const Arena: React.FC<{ gridSize: number; scores: { player1: number; player2: number }; showGrid?: boolean }> = ({ gridSize, scores, showGrid = true }) => {
    const halfGrid = gridSize / 2;
    const wallHeight = 5;

    return (
    <>
      {/* Atmospheric Tron Grid - Single Layer */}
      <EnhancedTronGrid gridSize={gridSize} visible={showGrid} />
      
      {/* No floor needed - pure digital space */}
      {/* Holographic Scoreboard */}
      <HolographicScoreboard scores={scores} gridSize={gridSize} />
      {/* Arena Walls */}
      <Wall position={[-halfGrid, wallHeight / 2, 0]} rotation={[0, Math.PI / 2, 0]} size={[gridSize, wallHeight]} />
      <Wall position={[halfGrid, wallHeight / 2, 0]} rotation={[0, -Math.PI / 2, 0]} size={[gridSize, wallHeight]} />
      <Wall position={[0, wallHeight / 2, -halfGrid]} rotation={[0, 0, 0]} size={[gridSize, wallHeight]} />
      <Wall position={[0, wallHeight / 2, halfGrid]} rotation={[0, -Math.PI, 0]} size={[gridSize, wallHeight]} />
    </>
  );
};
