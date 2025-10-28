# Deployment Guide

## 🚀 **Build Commands**

### **Local Development & Testing**
```bash
# Development server (auto-reload)
npm run dev

# Local preview of production build
npm run build:local && npm run preview
```

### **Production Deployments**

#### **GitHub Pages** (https://lpalbou.github.io/basic-tron/)
```bash
npm run build:github
```
- **Base path**: `/basic-tron/`
- **Target**: GitHub Pages deployment
- **Domain**: `lpalbou.github.io/basic-tron/` → `www.lpalbou.info/basic-tron/`

#### **Custom Domain** (hypothetical root deployment)
```bash
npm run build:local
```
- **Base path**: `/`
- **Target**: Root domain deployment
- **Domain**: `example.com/`

#### **Custom Path** (flexible deployment)
```bash
VITE_BASE_PATH=/my-custom-path/ npm run build
```
- **Base path**: `/my-custom-path/`
- **Target**: Any custom subdirectory
- **Domain**: `example.com/my-custom-path/`

---

## 🔧 **Configuration Details**

### **Environment Variable: `VITE_BASE_PATH`**
- **Purpose**: Controls the base path for all asset URLs
- **Default**: 
  - Development: `/`
  - Production: `/basic-tron/` (GitHub Pages default)
- **Override**: Set `VITE_BASE_PATH` environment variable

### **Build Output Verification**
After building, check `dist/index.html` for correct asset paths:
```html
<!-- GitHub Pages build should show: -->
<script src="/basic-tron/assets/index-[hash].js"></script>
<link href="/basic-tron/assets/index-[hash].css" rel="stylesheet">

<!-- Local build should show: -->
<script src="/assets/index-[hash].js"></script>
<link href="/assets/index-[hash].css" rel="stylesheet">
```

---

## 🐛 **Troubleshooting**

### **MIME Type Error**
```
Loading module from "https://example.com/assets/index-[hash].js" 
was blocked because of a disallowed MIME type ("text/html").
```

**Cause**: Incorrect base path - server returns 404 HTML instead of JS file.

**Solution**: Use correct build command for your deployment target:
- GitHub Pages: `npm run build:github`
- Custom domain root: `npm run build:local`
- Custom path: `VITE_BASE_PATH=/your-path/ npm run build`

### **Asset 404 Errors**
If assets (images, audio) return 404:
1. Verify base path matches deployment location
2. Check `dist/assets/` folder contains all files after build
3. Ensure server serves static files correctly

---

## 📋 **Deployment Checklist**

### **Before Deployment**
- [ ] Choose correct build command for target environment
- [ ] Run build and verify no errors
- [ ] Check `dist/index.html` has correct asset paths
- [ ] Test locally with `npm run preview` (for local builds)

### **GitHub Pages Deployment**
- [ ] Run `npm run build:github`
- [ ] Commit and push `dist/` folder to repository
- [ ] Verify GitHub Pages settings point to correct branch/folder
- [ ] Test deployed site at `https://www.lpalbou.info/basic-tron/`

### **Post-Deployment Verification**
- [ ] Site loads without console errors
- [ ] All assets (CSS, JS, images, audio) load correctly
- [ ] Game functionality works as expected
- [ ] Mobile compatibility maintained

---

*Last Updated: October 28, 2025 | Version: 0.2.0*
