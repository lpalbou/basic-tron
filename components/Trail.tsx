
import React, { useRef, useMemo } from 'react';
import { useFrame } from '@react-three/fiber';
import {
  Mesh,
  TubeGeometry,
  Vector3,
  CatmullRomCurve3,
  LineCurve3,
  CurvePath,
  MeshStandardMaterial,
  CanvasTexture,
  type BufferGeometry,
} from 'three';
import type { Player } from '../types';
import { POWERUP_INVINCIBILITY_COLOR, POWERUP_SPEED_BOOST_COLOR } from '../constants';

// Creates a vertical gradient texture that fades from black (transparent) to white (opaque).
// This is used to make the trail's tail fade out with a more pronounced effect.
const createFadeTexture = () => {
  const canvas = document.createElement('canvas');
  canvas.width = 1;
  canvas.height = 256;
  const context = canvas.getContext('2d');
  if (context) {
    const gradient = context.createLinearGradient(0, 0, 0, 256);
    gradient.addColorStop(0, 'black');   // Tail is fully transparent
    gradient.addColorStop(0.8, 'white'); // Fade to fully opaque by 80% of the length
    gradient.addColorStop(1, 'white');   // Head of the trail is fully opaque
    context.fillStyle = gradient;
    context.fillRect(0, 0, 1, 256);
  }
  return new CanvasTexture(canvas);
};


export const Trail: React.FC<{ playerRef: React.MutableRefObject<Player> }> = ({ playerRef }) => {
  const meshRef = useRef<Mesh<BufferGeometry, MeshStandardMaterial>>(null!);
  const lastPathLength = useRef(0);

  const { color } = playerRef.current;
  
  // Randomize shimmer period for each trail instance for visual variety.
  const shimmerPeriod = useMemo(() => 1.0 + Math.random() * 2.0, []);

  // The material is created once and includes the fade effect and bloom.
  const material = useMemo(() => {
    const alphaMap = createFadeTexture();
    return new MeshStandardMaterial({
      color: color,
      emissive: color,
      emissiveIntensity: 6, // Increased for a stronger bloom effect
      toneMapped: false,
      transparent: true,
      alphaMap: alphaMap,
    });
  }, [color]);

  useFrame((state) => {
    if (!meshRef.current) return;

    const player = playerRef.current;
    
    // Hide trail for one frame after shrinking to prevent visual artifacts.
    if (player.trailJustShrank) {
      meshRef.current.visible = false;
      player.trailJustShrank = false; // Consume the flag
      lastPathLength.current = -1; // Force geometry update in the next frame
      return;
    }

    const { path, activePowerUp } = player;
    
    const powerUpIsActive = activePowerUp.type === 'SPEED_BOOST' || activePowerUp.type === 'INVINCIBILITY';
    
    // Shimmer effect for intensity and opacity
    const angularFrequency = (2 * Math.PI) / shimmerPeriod;
    const sinValue = Math.sin(state.clock.elapsedTime * angularFrequency);
    const normalizedSine = (sinValue + 1) / 2; // maps sinValue from [-1, 1] to [0, 1]

    // Vary emissive intensity to be between 40% and 80% of the base intensity
    const baseIntensity = powerUpIsActive ? 10 : 6;
    const minIntensityFactor = 0.4;
    const maxIntensityFactor = 0.8;
    const intensityFactor = minIntensityFactor + normalizedSine * (maxIntensityFactor - minIntensityFactor);
    material.emissiveIntensity = baseIntensity * intensityFactor;

    // Vary opacity along with the shimmer
    // Map normalizedSine to an opacity range of [0.4, 0.7]
    const minOpacity = 0.4;
    const maxOpacity = 0.7;
    material.opacity = minOpacity + normalizedSine * (maxOpacity - minOpacity);

    let currentColor = player.color;
    if (activePowerUp.type === 'INVINCIBILITY') {
        currentColor = POWERUP_INVINCIBILITY_COLOR;
    } else if (activePowerUp.type === 'SPEED_BOOST') {
        currentColor = POWERUP_SPEED_BOOST_COLOR;
    }

    if (material.color.getHexString() !== currentColor.substring(1)) {
        material.color.set(currentColor);
        material.emissive.set(currentColor);
    }

    // Only update the geometry if the path has grown and is long enough to form a tube.
    if (path.length > 1 && path.length !== lastPathLength.current) {
      meshRef.current.visible = true; // Ensure it's visible after a potential shrink

      // Convert path array to Vector3 array
      const points = path.map(p => new Vector3(...p));

      // Create a curve path with STRAIGHT LINE segments for Tron-style right angles
      const curvePath = new CurvePath<Vector3>();
      for (let i = 0; i < points.length - 1; i++) {
        const lineCurve = new LineCurve3(points[i], points[i + 1]);
        curvePath.add(lineCurve);
      }

      // Create a new tube geometry from the curve path
      // CRITICAL: For linear segments, we need MANY more tubular segments (subdivisions along path)
      // Each LineCurve3 needs enough subdivisions to create a smooth tube around the corners
      const newGeometry = new TubeGeometry(
        curvePath,
        Math.max(path.length * 8, 64), // Much higher segment count for linear curves
        0.15, // Radius of the tube
        8, // Radial segments
        false // Not closed
      );

      // Dispose of the old geometry to prevent memory leaks
      if (meshRef.current.geometry) {
        meshRef.current.geometry.dispose();
      }

      // Assign the new geometry
      meshRef.current.geometry = newGeometry;
    }
    
    lastPathLength.current = path.length;
  });

  return (
    <mesh ref={meshRef} material={material} frustumCulled={false} />
  );
};
