
import React, { useCallback, useEffect, useRef, useState } from 'react';

// Get the base path from Vite's import.meta.env.BASE_URL
const getAssetPath = (path: string) => {
  const base = (import.meta as any).env?.BASE_URL || '/';
  return base + path;
};

// A mapping of sound effect keys to their file paths.
// Some keys map to an array for random selection.
const sfxMap = {
  crashBike: [
    getAssetPath('assets/fx/crash_bike1.mp3'),
    getAssetPath('assets/fx/crash_bike2.mp3'),
  ],
  crashWall: [
    getAssetPath('assets/fx/crash_wall1.mp3'),
    getAssetPath('assets/fx/crash_wall2.mp3'),
  ],
  wallProximity: [
    getAssetPath('assets/fx/energy_wall1.mp3'),
    getAssetPath('assets/fx/energy_wall2.mp3'),
    getAssetPath('assets/fx/energy_wall3.mp3'),
    getAssetPath('assets/fx/energy_wall4.mp3')
  ],
  engine : [
    getAssetPath('assets/fx/engine1.mp3'),
    getAssetPath('assets/fx/engine2.mp3'),
    getAssetPath('assets/fx/engine3.mp3'),
    getAssetPath('assets/fx/engine4.mp3')
  ],
  invincible: getAssetPath('assets/fx/invincible.mp3'),
  trailShrink: getAssetPath('assets/fx/trail_shrink.mp3'),
  emp_shockwave: getAssetPath('assets/fx/emp_shockwave.mp3'),
  turn: [
    getAssetPath('assets/fx/turn1.mp3'),
    getAssetPath('assets/fx/turn2.mp3'),
  ],
};

export type SfxKey = keyof typeof sfxMap;

type SfxBuffers = Map<string, AudioBuffer>;

// Singleton audio context
let audioContext: AudioContext | null = null;

const useSoundEffects = () => {
  const [isLoaded, setIsLoaded] = useState(false);
  const sfxBuffersRef = useRef<SfxBuffers>(new Map());
  const wallProximitySourceRef = useRef<AudioBufferSourceNode | null>(null);
  const wallProximityGainRef = useRef<GainNode | null>(null);
  const trailProximitySourceRef = useRef<AudioBufferSourceNode | null>(null);
  const trailProximityGainRef = useRef<GainNode | null>(null);

  // Initialize AudioContext and load all SFX
  useEffect(() => {
    const init = async () => {
      // AudioContext can only be created after a user interaction.
      // We assume this hook is initialized after the user clicks "Start Game".
      if (!audioContext) {
        try {
          audioContext = new (window.AudioContext || (window as any).webkitAudioContext)();
        } catch (e) {
          console.error("Web Audio API is not supported in this browser.");
          return;
        }
      }

      const allFiles = new Set<string>();
      Object.values(sfxMap).forEach(val => {
        if (Array.isArray(val)) {
          val.forEach(file => allFiles.add(file));
        } else {
          allFiles.add(val);
        }
      });

      try {
        await Promise.all(
          Array.from(allFiles).map(async (file) => {
            if (sfxBuffersRef.current.has(file)) return;
            
            const response = await fetch(file);
            if (!response.ok) {
              throw new Error(`Failed to fetch sound file ${file}: ${response.status} ${response.statusText}`);
            }
            const arrayBuffer = await response.arrayBuffer();
            const audioBuffer = await audioContext!.decodeAudioData(arrayBuffer);
            sfxBuffersRef.current.set(file, audioBuffer);
          })
        );
        setIsLoaded(true);
      } catch (error) {
        console.error("Failed to load sound effects:", error);
      }
    };

    init();
  }, []);

  const playSound = useCallback((key: SfxKey, options: { volume?: number } = {}) => {
    if (!isLoaded || !audioContext) return;
    
    if (audioContext.state === 'suspended') {
        audioContext.resume();
    }

    const pathOrPaths = sfxMap[key];
    const path = Array.isArray(pathOrPaths) ? pathOrPaths[Math.floor(Math.random() * pathOrPaths.length)] : pathOrPaths;
    
    const buffer = sfxBuffersRef.current.get(path);
    if (!buffer) return;

    const source = audioContext.createBufferSource();
    source.buffer = buffer;

    const gainNode = audioContext.createGain();
    gainNode.gain.value = options.volume ?? 1.0;
    
    source.connect(gainNode).connect(audioContext.destination);
    source.start();
  }, [isLoaded]);

  const startWallProximitySound = useCallback(() => {
    if (!isLoaded || !audioContext || wallProximitySourceRef.current) return;
    
    if (audioContext.state === 'suspended') {
        audioContext.resume();
    }

    const wallProximityPaths = sfxMap.wallProximity;
    const path = wallProximityPaths[Math.floor(Math.random() * wallProximityPaths.length)];
    const buffer = sfxBuffersRef.current.get(path);
    
    if (!buffer) return;

    const source = audioContext.createBufferSource();
    source.buffer = buffer;
    source.loop = true;

    const gainNode = audioContext.createGain();
    gainNode.gain.value = 0; // Start silent

    source.connect(gainNode).connect(audioContext.destination);
    source.start();

    wallProximitySourceRef.current = source;
    wallProximityGainRef.current = gainNode;
  }, [isLoaded]);

  const stopWallProximitySound = useCallback(() => {
    if (wallProximitySourceRef.current) {
      try { wallProximitySourceRef.current.stop(); } catch(e) {}
      wallProximitySourceRef.current.disconnect();
      wallProximitySourceRef.current = null;
    }
    if (wallProximityGainRef.current) {
      wallProximityGainRef.current.disconnect();
      wallProximityGainRef.current = null;
    }
  }, []);

  const updateWallProximityVolume = useCallback((distance: number) => {
    if (!wallProximityGainRef.current || !audioContext) return;

    const maxDist = 3.0;
    const minDist = 0.0; // At 0, you've hit the wall
    
    if (distance > maxDist) {
      wallProximityGainRef.current.gain.setTargetAtTime(0, audioContext.currentTime, 0.1);
      return;
    }
    
    const normalizedDist = Math.max(0, (distance - minDist)) / (maxDist - minDist);
    const volume = 1.0 - normalizedDist; // Linear falloff
    
    wallProximityGainRef.current.gain.setTargetAtTime(volume * 0.7, audioContext.currentTime, 0.1);
  }, []);

  const startTrailProximitySound = useCallback(() => {
    if (!isLoaded || !audioContext || trailProximitySourceRef.current) return;
    
    if (audioContext.state === 'suspended') {
        audioContext.resume();
    }

    const enginePaths = sfxMap.engine;
    const path = enginePaths[Math.floor(Math.random() * enginePaths.length)];
    const buffer = sfxBuffersRef.current.get(path);
    
    if (!buffer) return;

    const source = audioContext.createBufferSource();
    source.buffer = buffer;
    source.loop = true;

    const gainNode = audioContext.createGain();
    gainNode.gain.value = 0; // Start silent

    source.connect(gainNode).connect(audioContext.destination);
    source.start();

    trailProximitySourceRef.current = source;
    trailProximityGainRef.current = gainNode;
  }, [isLoaded]);

  const stopTrailProximitySound = useCallback(() => {
    if (trailProximitySourceRef.current) {
      try { trailProximitySourceRef.current.stop(); } catch(e) {}
      trailProximitySourceRef.current.disconnect();
      trailProximitySourceRef.current = null;
    }
    if (trailProximityGainRef.current) {
      trailProximityGainRef.current.disconnect();
      trailProximityGainRef.current = null;
    }
  }, []);

  const updateTrailProximityVolume = useCallback((distance: number) => {
    if (!trailProximityGainRef.current || !audioContext) return;

    const maxDist = 3.0; // Audible range for trail scraping
    const minDist = 1.0; // Closest you can be without crashing
    
    if (distance > maxDist) {
      trailProximityGainRef.current.gain.setTargetAtTime(0, audioContext.currentTime, 0.1);
      return;
    }
    
    const normalizedDist = Math.max(0, (distance - minDist)) / (maxDist - minDist);
    const volume = 1.0 - normalizedDist; // Linear falloff
    
    // Engine sound should be present but not overpowering
    trailProximityGainRef.current.gain.setTargetAtTime(volume * 0.6, audioContext.currentTime, 0.1);
  }, []);

  return { isLoaded, playSound, startWallProximitySound, stopWallProximitySound, updateWallProximityVolume, startTrailProximitySound, stopTrailProximitySound, updateTrailProximityVolume };
};

export default useSoundEffects;