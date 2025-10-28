#!/usr/bin/env node

const fs = require('fs');
const path = require('path');

// After Vite build, move assets to correct structure
const distDir = path.join(__dirname, 'dist');
const assetsDir = path.join(distDir, 'assets');

// Ensure assets directory exists
if (!fs.existsSync(assetsDir)) {
  fs.mkdirSync(assetsDir, { recursive: true });
}

// Move fx folder to assets/fx if it exists at root level
const fxSrc = path.join(distDir, 'fx');
const fxDest = path.join(assetsDir, 'fx');
if (fs.existsSync(fxSrc)) {
  if (fs.existsSync(fxDest)) {
    fs.rmSync(fxDest, { recursive: true });
  }
  fs.renameSync(fxSrc, fxDest);
  console.log('Moved fx/ to assets/fx/');
}

// Move audio files to assets/
const audioFiles = ['neon_reverie.mp3'];
audioFiles.forEach(file => {
  const src = path.join(distDir, file);
  const dest = path.join(assetsDir, file);
  if (fs.existsSync(src)) {
    fs.renameSync(src, dest);
    console.log(`Moved ${file} to assets/`);
  }
});

// Move image files to assets/
const imageFiles = ['Follow.jpg', 'FPV.jpg', 'MobileUI.jpg', 'TopDown.jpg'];
imageFiles.forEach(file => {
  const src = path.join(distDir, file);
  const dest = path.join(assetsDir, file);
  if (fs.existsSync(src)) {
    fs.renameSync(src, dest);
    console.log(`Moved ${file} to assets/`);
  }
});

console.log('Asset organization complete!');
