#!/usr/bin/env node

import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

// Simple function to copy directory recursively
function copyDir(src, dest) {
  if (!fs.existsSync(src)) return;
  
  if (!fs.existsSync(dest)) {
    fs.mkdirSync(dest, { recursive: true });
  }
  
  const entries = fs.readdirSync(src, { withFileTypes: true });
  
  for (const entry of entries) {
    const srcPath = path.join(src, entry.name);
    const destPath = path.join(dest, entry.name);
    
    if (entry.isDirectory()) {
      copyDir(srcPath, destPath);
    } else {
      fs.copyFileSync(srcPath, destPath);
    }
  }
}

// Copy entire assets folder to dist/assets (merge with Vite's generated assets)
const assetsSource = path.join(__dirname, 'assets');
const assetsDestination = path.join(__dirname, 'dist', 'assets');

if (fs.existsSync(assetsSource)) {
  // Ensure destination exists
  if (!fs.existsSync(assetsDestination)) {
    fs.mkdirSync(assetsDestination, { recursive: true });
  }
  
  // Copy our assets folder content into dist/assets (merge, don't replace)
  copyDir(assetsSource, assetsDestination);
  console.log('Copied assets/ folder to dist/assets/');
} else {
  console.log('No assets/ folder found, skipping copy');
}

// Create favicon.svg if it doesn't exist
const faviconPath = path.join(assetsDestination, 'favicon.svg');
if (!fs.existsSync(faviconPath)) {
  fs.mkdirSync(assetsDestination, { recursive: true });
  const faviconSvg = `<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 100 100"><text x="50%" y="50%" style="dominant-baseline:central;text-anchor:middle;font-size:90px;">🎮</text></svg>`;
  fs.writeFileSync(faviconPath, faviconSvg);
  console.log('Created favicon.svg');
}

console.log('Asset organization complete!');