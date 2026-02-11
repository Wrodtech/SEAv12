# Site Engineering Assistant PWA

A Progressive Web App (PWA) for civil engineers and surveyors that works offline and can be installed on mobile devices.

## Features

- 📱 Installable as standalone app on iOS/Android
- 🔄 Full offline functionality
- 📐 Engineering calculators
- 📍 Total Station TS16 guide
- 🛰️ GPS system guides
- 📁 DXF drawing support
- 🔍 Search across all content
- 🌙 Dark/Light theme

## Deployment to GitHub Pages

1. **Create a new repository** on GitHub
2. **Upload all files** to the repository
3. **Enable GitHub Pages**:
   - Go to repository Settings
   - Navigate to "Pages" section
   - Select "Deploy from a branch"
   - Choose `gh-pages` branch
   - Click Save

4. **Wait for deployment** (takes 1-2 minutes)
5. **Access your PWA** at: `https://[your-username].github.io/[repository-name]/`

## Installing on Mobile

### Android (Chrome)
1. Open the app in Chrome
2. Tap the menu (⋮) → "Add to Home screen"
3. Confirm installation

### iOS (Safari)
1. Open the app in Safari
2. Tap the share button (📤)
3. Scroll down → "Add to Home Screen"
4. Tap "Add"

## Offline Usage

Once loaded, the app works completely offline:
- All content cached locally
- Calculations saved automatically
- Checklists persist between sessions
- No internet required after initial load

## Development

### Local Testing
1. Serve files using a local server:
   ```bash
   npx serve .