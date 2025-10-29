# Basic Tron Documentation

## 📚 **Documentation Index**

Welcome to the Basic Tron technical documentation. This directory contains comprehensive guides for development, deployment, and project planning.

---

## 🚀 **Essential Guides**

### **[Deployment Guide](./deployment.md)**
Complete guide for building and deploying the game
- **Unified build system** with `/basic-tron/` base path
- Local development and production build instructions
- Troubleshooting for MIME type errors and asset loading
- GitHub Pages deployment checklist
- **Status**: ✅ Up to date (v0.2.2)

---

## 📋 **Project Planning**

### **Backlog**
Feature requests and future enhancements:
- **[Mobile Apps](./backlog/mobile-apps.md)** - Native iOS/Android app strategy
- **[3D Bike Model](./backlog/bike-3d-model.md)** - 3D model integration details

### **Reports**
Implementation reports and technical decisions:
- **[3D Bike Model Integration](./reports/3d-bike-model-integration.md)** - Technical report on 3D model implementation

---

## 🔧 **Quick Reference**

### **Development Commands**
```bash
npm run dev      # Start dev server at http://localhost:3000/basic-tron/
npm run build    # Build for production (unified base path)
npm run preview  # Preview build at http://localhost:4173/basic-tron/
```

### **Key Technologies**
- **Vite 6.4.1**: Build tool with HMR
- **React 19.2.0**: UI framework
- **Three.js 0.180.0**: 3D graphics engine
- **Tailwind CSS 4.1.16**: Utility-first CSS (properly bundled)
- **TypeScript 5.8.2**: Type safety

### **Build Output**
- CSS: 6.4KB (1.6KB gzipped) - includes Tailwind
- JS: 1.3MB (380KB gzipped) - all dependencies bundled
- No external CDN dependencies

---

## 🆕 **Recent Changes (v0.2.2)**

### **Fixed Issues**
1. ✅ **MIME Type Errors**: Removed direct `.tsx` loading, use Vite dev server
2. ✅ **Tailwind CDN Warning**: Migrated to `@tailwindcss/postcss` plugin
3. ✅ **External CDN Dependencies**: All npm packages now bundled
4. ✅ **Base Path Confusion**: Unified `/basic-tron/` path for all environments

### **New Configuration Files**
- `tailwind.config.js` - Tailwind CSS configuration
- `postcss.config.js` - PostCSS pipeline configuration

### **Updated Files**
- `vite.config.ts` - Unified base path strategy
- `index.html` - Removed CDN imports and import maps
- `index.css` - Added Tailwind directives
- `package.json` - Simplified build scripts

---

## 🔗 **External Resources**

- **Live Demo**: https://www.lpalbou.info/basic-tron/
- **GitHub**: https://github.com/lpalbou/basic-tron
- **Main README**: [Project Overview](../README.md)
- **Changelog**: [Version History](../CHANGELOG.md)
- **Roadmap**: [Future Plans](../ROADMAP.md)

---

*Last Updated: October 29, 2025*
