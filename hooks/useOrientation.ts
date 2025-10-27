
import { useState, useEffect } from 'react';

type Orientation = 'portrait' | 'landscape';

const getOrientation = (): Orientation => {
  if (typeof window === 'undefined') return 'landscape';
  // Use `window.innerWidth` and `innerHeight` for a more reliable check across devices
  // than `screen.orientation` which can be inconsistent.
  return window.innerHeight > window.innerWidth ? 'portrait' : 'landscape';
}

const useOrientation = (): Orientation => {
  const [orientation, setOrientation] = useState<Orientation>(getOrientation());

  useEffect(() => {
    const handleResize = () => {
      setOrientation(getOrientation());
    };

    window.addEventListener('resize', handleResize);

    return () => {
      window.removeEventListener('resize', handleResize);
    };
  }, []);

  return orientation;
};

export default useOrientation;
