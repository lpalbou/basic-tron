
import React, { useCallback, useEffect, useRef, useState } from 'react';

// A mapping of sound effect keys to their file paths.
// Some keys map to an array for random selection.
const sfxMap = {
  crashBike: [
    'assets/fx/crash_bike/Crash_of_a_Tron_Ligh_#2-1761592390981.mp3',
    'assets/fx/crash_bike/Crash_of_a_Tron_Ligh-1761592514481.mp3',
  ],
  crashWall: [
    'assets/fx/crash_wall/crash_and_explosion__#1-1761533541840.mp3',
    'assets/fx/crash_wall/crash_and_explosion_-1761533521474.mp3',
  ],
  wallProximity: [
    'assets/fx/energy_wall/Continuous_humming_o_#1-1761592754870.mp3',
    'assets/fx/energy_wall/Continuous_humming_o-1761592789930.mp3',
    'assets/fx/energy_wall/Distinct_Engine_Hum__#2-1761592935265.mp3',
    'assets/fx/energy_wall/Distinct_Engine_Hum_-1761591654694.mp3'
  ],
  engine : [
    'assets/fx/engine/Distinct_Engine_Hum__#3-1761591617645.mp3',
    'assets/fx/engine/Distinct_Engine_Hum_-1761591654694.mp3',
    'assets/fx/engine/Distinct_Engine_Hum_-1761591699631.mp3',
    'assets/fx/engine/Distinct_Engine_Hum_-1761592984264.mp3'
  ],
  invincible: 'assets/fx/invincible/sci_fi_bike_power_up-1761566714683.mp3',
  trailShrink: 'assets/fx/trail_shrink/sci_fi_sound_effect__#2-1761568932908.mp3',
  turn: [
    'assets/fx/turn/Turning_with_a_Tron__#1-1761592106624.mp3',
    'assets/fx/turn/Turning_with_a_Tron__#2-1761591850024.mp3',
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
