import React from 'react';
import { useThree } from '@react-three/fiber';

export const ScreenshotHandler: React.FC = () => {
  const { gl, scene, camera } = useThree();

  React.useEffect(() => {
    const handleScreenshot = () => {
      try {
        // Wait for next frame to ensure all effects are rendered
        requestAnimationFrame(async () => {
          // Get the canvas directly (this includes all post-processing effects)
          const canvas = gl.domElement;
          
          // Capture as JPG at high quality but optimized file size
          const dataURL = canvas.toDataURL('image/jpeg', 0.85);
          
          // Create download link
          const link = document.createElement('a');
          link.href = dataURL;
          link.download = `tron-screenshot-${new Date().toISOString().slice(0, 19).replace(/:/g, '-')}.jpg`;
          
          // Enhanced mobile compatibility with Web Share API
          const isMobile = /iPhone|iPad|iPod|Android|webOS|BlackBerry|IEMobile|Opera Mini/i.test(navigator.userAgent);
          
          if (isMobile && navigator.share && navigator.canShare) {
            // Modern approach: Use Web Share API (works on iOS Safari)
            try {
              // Convert dataURL to blob for sharing
              const response = await fetch(dataURL);
              const blob = await response.blob();
              const file = new File([blob], link.download, { type: 'image/jpeg' });
              
              if (navigator.canShare({ files: [file] })) {
                await navigator.share({
                  files: [file],
                  title: 'Tron Screenshot',
                  text: 'Check out this awesome Tron game screenshot!'
                });
                return; // Success!
              }
            } catch (shareError) {
              console.log('Web Share API failed, trying fallback methods');
            }
          }
          
          if (isMobile) {
            // Fallback methods for mobile
            try {
              // Method 1: Try direct download first
              document.body.appendChild(link);
              link.click();
              document.body.removeChild(link);
            } catch (error) {
              // Method 2: Open optimized view for manual save
              const newWindow = window.open('', '_blank');
              if (newWindow) {
                newWindow.document.write(`
                  <html>
                    <head>
                      <title>Tron Screenshot</title>
                      <meta name="viewport" content="width=device-width, initial-scale=1">
                    </head>
                    <body style="margin:0;padding:20px;background:#000;text-align:center;font-family:Arial;">
                      <h2 style="color:#00ffff;margin-bottom:10px;">Tron Screenshot</h2>
                      <p style="color:#fff;font-size:14px;margin-bottom:20px;">
                        <strong>iOS:</strong> Long press → "Add to Photos"<br>
                        <strong>Android:</strong> Long press → "Download image"
                      </p>
                      <img src="${dataURL}" style="max-width:100%;height:auto;border:2px solid #00ffff;border-radius:8px;" alt="Tron Screenshot" />
                      <p style="color:#888;font-size:12px;margin-top:20px;">
                        If saving doesn't work, try taking a regular screenshot of this page
                      </p>
                    </body>
                  </html>
                `);
              }
            }
          } else {
            // Desktop: standard download
            document.body.appendChild(link);
            link.click();
            document.body.removeChild(link);
          }
        });
      } catch (error) {
        console.error('Failed to take screenshot:', error);
        // Show user-friendly error
        alert('Screenshot failed. Please try again.');
      }
    };

    window.addEventListener('take-screenshot', handleScreenshot);
    return () => window.removeEventListener('take-screenshot', handleScreenshot);
  }, [gl]);

  // This component doesn't render anything visible
  return null;
};

