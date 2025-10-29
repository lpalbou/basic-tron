# Deployment Guide

## 🚀 **Unified Build System**

This project now uses a **unified base path** (`/basic-tron/`) for all environments, eliminating deployment confusion and MIME type issues.

### **Quick Start**

#### **Local Development**
```bash
npm run dev
```
- **URL**: http://localhost:3000/basic-tron/
- **Features**: Hot reload, TypeScript transpilation, instant CSS updates

#### **Production Build**
```bash
npm run build
```
- **Output**: `dist/` folder ready for deployment
- **Base path**: `/basic-tron/` (works for both local and production)

#### **Preview Production Build**
```bash
npm run preview
```
- **URL**: http://localhost:4173/basic-tron/
- **Purpose**: Test production build locally before deployment

---

## 🌐 **Deployment Targets**

### **GitHub Pages** (Primary)
```bash
npm run build
# Deploy dist/ folder to gh-pages branch
```
- **Live URL**: https://www.lpalbou.info/basic-tron/
- **Alternate**: https://lpalbou.github.io/basic-tron/
- **Base path**: `/basic-tron/`

### **Custom Deployment**
If you need a different base path, override with environment variable:
```bash
VITE_BASE_PATH=/ npm run build              # Root deployment
VITE_BASE_PATH=/my-path/ npm run build     # Custom path
```

---

## ✅ **What Was Fixed**

### **1. MIME Type Errors** ❌ → ✅
**Before**: Browser tried to load `.tsx` files directly
**After**: Vite transpiles TypeScript to JavaScript during development

### **2. Tailwind CSS CDN** ❌ → ✅
**Before**: 47KB+ loaded from CDN on every page load
**After**: 6.4KB bundled CSS (1.6KB gzipped) with tree-shaking

### **3. External Dependencies** ❌ → ✅
**Before**: React, Three.js loaded from aistudiocdn.com via import maps
**After**: All dependencies properly bundled (1.3MB minified, 380KB gzipped)

### **4. Base Path Confusion** ❌ → ✅
**Before**: Different builds for local (`/`) vs production (`/basic-tron/`)
**After**: Unified `/basic-tron/` path for all environments

---

## 🔧 **Build Verification**

After running `npm run build`, check `dist/index.html`:
```html
<!-- All assets should reference /basic-tron/ base path -->
<link rel="icon" href="/basic-tron/assets/favicon.svg" />
<script src="/basic-tron/assets/index.js"></script>
<link href="/basic-tron/assets/index.css" rel="stylesheet">
```

### **Build Output**
```
dist/
├── index.html              # Entry point (0.5KB)
└── assets/
    ├── index.js           # Bundled app (1.3MB minified, 380KB gzipped)
    ├── index.css          # Bundled Tailwind (6.4KB, 1.6KB gzipped)
    ├── favicon.svg        # Generated favicon
    └── [audio/models]     # Game assets (copied by build-assets.js)
```

---

## 🐛 **Troubleshooting**

### **MIME Type Error (FIXED)**
```
Loading module from "http://127.0.0.1:8080/index.tsx"
was blocked because of a disallowed MIME type ("application/octet-stream").
```

**Root Cause**: Browser cannot execute TypeScript files directly.

**Solution**: Always use `npm run dev` for development (never serve source files with a simple HTTP server). Vite automatically transpiles TypeScript to JavaScript.

### **Tailwind CDN Warning (FIXED)**
```
cdn.tailwindcss.com should not be used in production.
```

**Solution**: Tailwind CSS is now properly bundled during build. This warning no longer appears because we use `@tailwindcss/postcss` plugin.

### **Asset 404 Errors**
If assets (images, audio) return 404:
1. Verify you're accessing the correct URL with `/basic-tron/` path
2. Check `dist/assets/` folder contains all files after build
3. Run `npm run preview` to test production build locally

---

## 📋 **Deployment Checklist**

### **Before Deployment**
- [ ] Run `npm run build` and verify no errors
- [ ] Check `dist/index.html` has `/basic-tron/` asset paths
- [ ] Test locally with `npm run preview`
- [ ] Verify game loads at http://localhost:4173/basic-tron/

### **GitHub Pages Deployment**
- [ ] Run `npm run build`
- [ ] Deploy `dist/` folder to `gh-pages` branch
- [ ] Verify GitHub Pages settings point to correct branch/folder
- [ ] Test deployed site at https://www.lpalbou.info/basic-tron/

### **Post-Deployment Verification**
- [ ] Site loads without console errors
- [ ] CSS loads properly (no Tailwind CDN warning)
- [ ] All assets (JS, CSS, images, audio) load correctly
- [ ] Game functionality works as expected
- [ ] Mobile compatibility maintained

---

## 🆕 **Technology Stack**

### **Build System**
- **Vite 6.4.1**: Fast ES module-based build tool
- **TypeScript 5.8.2**: Type-safe development
- **PostCSS**: CSS processing pipeline

### **Styling**
- **Tailwind CSS 4.1.16**: Utility-first CSS framework
- **Build output**: 6.4KB (1.6KB gzipped) with tree-shaking
- **No CDN dependencies**: Everything bundled for production

### **Dependencies**
- All npm packages properly bundled (no external CDNs)
- React, Three.js, and related libraries optimized
- Total bundle: 1.3MB minified (380KB gzipped)

---

*Last Updated: October 29, 2025 | Version: 0.2.2*
