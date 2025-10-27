
import { useState, useEffect } from 'react';

const useIsMobile = (): boolean => {
  const [isMobile, setIsMobile] = useState(false);

  useEffect(() => {
    const checkForMobile = () => {
      // A reliable way to check for touch devices, which is a good proxy for mobile/tablet.
      const hasTouch = 'ontouchstart' in window || navigator.maxTouchPoints > 0;
      setIsMobile(hasTouch);
    };

    checkForMobile();
  }, []);

  return isMobile;
};

export default useIsMobile;
