
import React from 'react';

// Singleton pattern to ensure AudioContext and buffer are created only once.
let audioContext: AudioContext | null = null;
let audioBuffer: AudioBuffer | null = null;
let loadingPromise: Promise<AudioBuffer> | null = null;

// Get the base path from Vite's import.meta.env.BASE_URL
const getAssetPath = (path: string) => {
  const base = (import.meta as any).env?.BASE_URL || '/';
  return base + path;
};

const AUDIO_FILE_PATH = getAssetPath('assets/neon_reverie.mp3');

const initAudio = (): Promise<AudioBuffer> => {
  // If buffer is already loaded, return it.
  if (audioBuffer) {
    return Promise.resolve(audioBuffer);
  }
  // If it's already loading, return the existing promise.
  if (loadingPromise) {
    return loadingPromise;
  }

  loadingPromise = new Promise(async (resolve, reject) => {
    try {
      if (!audioContext) {
        audioContext = new (window.AudioContext || (window as any).webkitAudioContext)();
      }
      
      const response = await fetch(AUDIO_FILE_PATH);
      if (!response.ok) {
        throw new Error(`HTTP error! status: ${response.status} - ${response.statusText}`);
      }
      const arrayBuffer = await response.arrayBuffer();
      
      audioContext.decodeAudioData(
        arrayBuffer,
        (decodedBuffer) => {
          audioBuffer = decodedBuffer;
          loadingPromise = null;
          resolve(decodedBuffer);
        },
        (error) => {
          loadingPromise = null;
          const decodeError = new Error(`Failed to decode audio data: ${error?.message || error}`);
          reject(decodeError);
        }
      );
    } catch (error) {
      loadingPromise = null;
      reject(error);
    }
  });
  return loadingPromise;
};

const useSounds = () => {
  const sourceNodeRef = React.useRef<AudioBufferSourceNode | null>(null);
  const gainNodeRef = React.useRef<GainNode | null>(null);
  const isPlayingRef = React.useRef(false);

  // Simple effect for cleanup on unmount
  React.useEffect(() => {
    return () => {
      if (sourceNodeRef.current) {
        try { sourceNodeRef.current.stop(); } catch (e) {}
        sourceNodeRef.current = null;
      }
      if (gainNodeRef.current) {
        try { gainNodeRef.current.disconnect(); } catch (e) {}
        gainNodeRef.current = null;
      }
      isPlayingRef.current = false;
    };
  }, []);

  const playBackgroundMusic = React.useCallback(async () => {
    if (isPlayingRef.current) {
      // If music is paused, just resume it.
      if (audioContext && audioContext.state === 'suspended') {
        await audioContext.resume();
      }
      return;
    }

    try {
      const buffer = await initAudio();
      
      if (!audioContext) {
        throw new Error("Audio context was not created successfully.");
      }

      if (audioContext.state === 'suspended') {
        await audioContext.resume();
      }
      
      if (!gainNodeRef.current) {
        gainNodeRef.current = audioContext.createGain();
        gainNodeRef.current.gain.value = 0.3;
        gainNodeRef.current.connect(audioContext.destination);
      }
      
      const source = audioContext.createBufferSource();
      source.buffer = buffer;
      source.loop = true;
      source.connect(gainNodeRef.current);
      source.start();
      
      sourceNodeRef.current = source;
      isPlayingRef.current = true;

      source.onended = () => {
        isPlayingRef.current = false;
        sourceNodeRef.current = null;
      };

    } catch (error) {
      console.error("Could not play background music:", error);
    }
  }, []);

  const pauseMusic = React.useCallback(() => {
    if (audioContext && audioContext.state === 'running') {
      audioContext.suspend();
    }
  }, []);

  const resumeMusic = React.useCallback(() => {
    if (audioContext && audioContext.state === 'suspended') {
      audioContext.resume();
    }
  }, []);

  return { playBackgroundMusic, pauseMusic, resumeMusic };
};

export default useSounds;