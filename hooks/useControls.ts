
import { useEffect, useRef } from 'react';
import type { Direction, ControlsType } from '../types';

const keyMap: Record<string, Direction> = {
  'ArrowUp': 'UP', 'w': 'UP', 'W': 'UP',
  'ArrowDown': 'DOWN', 's': 'DOWN', 'S': 'DOWN',
  'ArrowLeft': 'LEFT', 'a': 'LEFT', 'A': 'LEFT',
  'ArrowRight': 'RIGHT', 'd': 'RIGHT', 'D': 'RIGHT',
};

const arrowKeys = new Set(['ArrowUp', 'ArrowDown', 'ArrowLeft', 'ArrowRight']);
const wasdKeys = new Set(['w', 'W', 'a', 'A', 's', 'S', 'd', 'D']);

export const useControls = (initialDirection: Direction, type: ControlsType) => {
  const directionRef = useRef<Direction>(initialDirection);
  const touchStartRef = useRef<{ x: number; y: number } | null>(null);

  useEffect(() => {
    directionRef.current = initialDirection;

    const handleKeyDown = (e: KeyboardEvent) => {
      const relevantKeys = type === 'ARROWS' ? arrowKeys : wasdKeys;
      if (!relevantKeys.has(e.key)) return;

      const newDirection = keyMap[e.key];
      if (newDirection) {
        directionRef.current = newDirection;
      }
    };

    const handleTouchStart = (e: TouchEvent) => {
      if (e.touches.length > 0) {
        touchStartRef.current = { x: e.touches[0].clientX, y: e.touches[0].clientY };
      }
    };

    const handleTouchEnd = (e: TouchEvent) => {
      if (!touchStartRef.current || e.changedTouches.length === 0) return;

      const touchEnd = { x: e.changedTouches[0].clientX, y: e.changedTouches[0].clientY };
      const dx = touchEnd.x - touchStartRef.current.x;
      const dy = touchEnd.y - touchStartRef.current.y;
      
      const swipeThreshold = 30;

      if (Math.abs(dx) > swipeThreshold || Math.abs(dy) > swipeThreshold) {
        if (type === 'ARROWS') {
          if (Math.abs(dx) > Math.abs(dy)) {
            directionRef.current = dx > 0 ? 'RIGHT' : 'LEFT';
          } else {
            directionRef.current = dy > 0 ? 'DOWN' : 'UP';
          }
        }
      }
      touchStartRef.current = null;
    };

    window.addEventListener('keydown', handleKeyDown);
    window.addEventListener('touchstart', handleTouchStart, { passive: true });
    window.addEventListener('touchend', handleTouchEnd, { passive: true });

    return () => {
      window.removeEventListener('keydown', handleKeyDown);
      window.removeEventListener('touchstart', handleTouchStart);
      window.removeEventListener('touchend', handleTouchEnd);
    };
  }, [initialDirection, type]);

  return {
    get direction() {
      return directionRef.current;
    }
  };
};
