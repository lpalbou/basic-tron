
import React, { useState, useEffect } from 'react';

interface SpeedIndicatorProps {
  message: string;
  messageKey: number; // A unique key to force re-triggering the effect
}

export const SpeedIndicator: React.FC<SpeedIndicatorProps> = ({ message, messageKey }) => {
  const [visible, setVisible] = useState(false);

  useEffect(() => {
    // When the messageKey changes, it means a new message should be shown.
    if (message) {
      setVisible(true);

      const timer = setTimeout(() => {
        setVisible(false);
      }, 1000); // Message disappears after 1 second as requested

      // The cleanup function will clear the previous timer if a new message
      // arrives before the old one has faded out, resetting the countdown.
      return () => clearTimeout(timer);
    }
  }, [message, messageKey]); // Re-run effect only when the unique key changes

  return (
    <div 
      className={`absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 z-20 text-4xl font-black text-white transition-opacity duration-500 pointer-events-none ${visible ? 'opacity-100' : 'opacity-0'}`}
      style={{ textShadow: '0 0 15px white, 0 0 25px white' }}
    >
      {message}
    </div>
  );
};
