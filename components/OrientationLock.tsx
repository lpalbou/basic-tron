
import React from 'react';

const styles = {
  overlay: `
    position: fixed;
    top: 0;
    left: 0;
    width: 100%;
    height: 100%;
    background-color: rgba(0, 0, 0, 0.95);
    display: flex;
    flex-direction: column;
    align-items: center;
    justify-content: center;
    z-index: 1000;
    color: #fff;
    text-align: center;
    font-family: system-ui, sans-serif;
  `,
  icon: `
    font-size: 6rem;
    margin-bottom: 2rem;
    animation: rotateDevice 2.5s ease-in-out infinite;
  `,
  text: `
    font-size: 1.5rem;
    font-weight: bold;
    max-width: 80%;
    text-shadow: 0 0 10px #00f2ff;
  `,
  keyframes: `
    @keyframes rotateDevice {
      0% { transform: rotate(0deg); }
      30% { transform: rotate(0deg); }
      50% { transform: rotate(90deg); }
      80% { transform: rotate(90deg); }
      100% { transform: rotate(0deg); }
    }
  `
};

export const OrientationLock: React.FC = () => {
  return (
    <>
      <style>{styles.keyframes}</style>
      <div style={{
        position: 'fixed',
        top: 0,
        left: 0,
        width: '100%',
        height: '100%',
        backgroundColor: 'rgba(0, 0, 0, 0.95)',
        display: 'flex',
        flexDirection: 'column',
        alignItems: 'center',
        justifyContent: 'center',
        zIndex: 1000,
        color: '#fff',
        textAlign: 'center',
        fontFamily: 'system-ui, sans-serif',
      }}>
        <div style={{
          fontSize: '6rem',
          marginBottom: '2rem',
          animation: 'rotateDevice 2.5s ease-in-out infinite',
        }}>📱</div>
        <p style={{
          fontSize: '1.5rem',
          fontWeight: 'bold',
          maxWidth: '80%',
          textShadow: '0 0 10px #00f2ff',
        }}>Please rotate your device to landscape mode to play.</p>
      </div>
    </>
  );
};
