# Deployment Guide

## Quick Deploy to GitHub Pages

### Single Command Deployment
```bash
# First, ensure all assets are copied to public folder
cp -r assets/* public/assets/

# Then deploy
npm run deploy
```

This command will:
1. Copy all assets (sound files, images) to public folder
2. Build the project with latest changes (committed or uncommitted)
3. Deploy built files to `gh-pages` branch
4. Push to remote GitHub repository
5. Make changes live on GitHub Pages

### Manual Step-by-Step Process

If you prefer to run each step manually:

```bash
# 1. Copy all assets to public folder
cp -r assets/* public/assets/

# 2. Build the project
npm run build

# 3. Deploy to gh-pages branch
# This command publishes the *contents* of the 'dist' directory directly into the root (./)
# of the 'gh-pages' branch. The --dotfiles flag ensures all files (including dotfiles) are included,
# and the --dest . flag places them at the repository root in gh-pages.
npx gh-pages -d dist --dest .
```

### What Gets Deployed

The deployment process includes:
- ✅ **All committed changes** from main branch
- ✅ **Uncommitted changes** in working directory
- ✅ **Built assets** (JavaScript, CSS, HTML)
- ✅ **Static assets** (images, audio files)

### Deployment Configuration

The deployment is configured in:
- `package.json` - Contains the deploy script
- `vite.config.ts` - Sets base path for GitHub Pages (`/basic-tron/`)

### Live URL

After deployment, your game will be available at:
**https://lpalbou.github.io/basic-tron/**

### Notes

- No need to commit changes before deploying
- The build process captures current working directory state
- Deployment typically takes 1-3 minutes to go live
- GitHub Pages automatically serves from the `gh-pages` branch

### Troubleshooting

If deployment fails:
1. Ensure you have push access to the repository
2. Check that GitHub Pages is enabled in repository settings
3. Verify the `gh-pages` branch exists and is set as the Pages source

### Verification

To verify successful deployment:
```bash
# Check remote gh-pages branch
git ls-remote origin gh-pages

# Check local gh-pages branch
git log --oneline -n 3 gh-pages
```
