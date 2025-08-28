# Customizable Tabata Timer

A Progressive Web App (PWA) for creating and running custom Tabata workouts with offline support and local media uploads.

## Features

- **Progressive Web App**: Install on any device, works offline
- **Custom Workouts**: Create personalized exercise routines with timing controls
- **Media Support**: Upload local images/videos for exercise demonstrations
- **Offline Storage**: All data and media stored locally using IndexedDB
- **Audio Cues**: Built-in countdown beeps and exercise start sounds
- **Responsive Design**: Works on desktop, tablet, and mobile devices

## Quick Start

1. **Serve the app locally:**
   ```bash
   python3 -m http.server 8080
   ```

2. **Open in browser:**
   ```
   http://localhost:8080
   ```

3. **Install as PWA:** Use your browser's "Install App" option

## Usage

### Creating Workouts
- Click "New Workout" to start
- Set timing (prepare time, sets, cooldown)
- Add work/rest steps with custom durations
- Upload local media files for visual cues
- Save and start your workout

### Media Uploads
- Click "Upload" next to any media field
- Select images or videos from your device
- Media is stored offline and works without internet

### Offline Use
- Install the PWA for best offline experience
- All workouts and media available without internet
- Service worker caches app for instant loading

## Technical Details

- **Frontend**: Vanilla JavaScript ES6 modules
- **Storage**: localStorage + IndexedDB for media
- **PWA**: Service Worker with app shell caching
- **Audio**: Web Audio API for timer sounds
- **No Dependencies**: Pure web standards implementation

## Browser Support

- Chrome/Edge 80+
- Firefox 78+
- Safari 14+
- Mobile browsers with PWA support
