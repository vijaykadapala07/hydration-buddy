# Hydration Buddy

A cute desktop reminder that walks across your screen every 2 hours to ask if you've had water! 💧

Hydration Buddy is a little animated companion who gently reminds you to stay hydrated throughout your day. With a charming chibi-style character and smooth animations, staying hydrated has never been so delightful.

## Features

- **Animated Buddy Character** - A cute, expressive buddy with multiple poses (walking, standing, happy, sad)
- **Smart Reminders** - Appears every 2 hours (configurable) to remind you to drink water
- **Menu Bar/Dock Control** - Easy access from your system tray/dock to adjust settings
- **Interactive Responses** - Answer "Yes" or "No" to your buddy's hydration prompt
- **Attention-Grabbing** - If you don't respond, your buddy gets increasingly insistent with fun messages
- **SVG Animations** - Smooth CSS animations with multiple character expressions
- **Lightweight** - Minimal resource usage, won't slow down your system
- **Click-Through Overlay** - Doesn't interfere with your work until you interact with it
- **Customizable** - Adjustable reminder intervals and settings

## Installation

### macOS
1. Download the appropriate version for your Mac:
   - **Apple Silicon (M1/M2/M3)**: `HydrationBuddy-1.0.4-mac-apple-silicon.zip`
   - **Intel**: `HydrationBuddy-1.0.4-mac-intel.zip`
2. Extract the ZIP file
3. Drag `Hydration Buddy.app` to your Applications folder
4. Launch the app from Applications or Launchpad
5. Grant permission to run the app (you may need to click "Open" in System Preferences > Security & Privacy)

### Windows
1. Download `HydrationBuddy-1.0.3-windows.zip`
2. Extract the ZIP file
3. Run `Hydration Buddy.exe`
4. The app will install to your system and create a Start Menu shortcut
5. Grant permission for the app to run when prompted

### Running from Source
If you want to build and run from source:

```bash
# Clone the repository
git clone https://github.com/vijaykadapala07/hydration-buddy.git
cd hydration-buddy/desktop-app

# Install dependencies
npm install

# Run the app
npm start

# For testing with shorter intervals
npm run demo

# Build for distribution
npm run dist              # Build for your current platform
npm run dist:mac          # Build for macOS
npm run dist:win          # Build for Windows
npm run dist:linux        # Build for Linux
```

## Usage

### Launching the App
- **macOS**: Look for the Hydration Buddy icon in your menu bar at the top of the screen
- **Windows**: Access from the system tray (bottom-right corner) or start the app from your Start Menu

### Interacting with Buddy
1. When your buddy walks across the screen, you'll see a speech bubble asking "Had a glass of water yet?"
2. Click **Yes** if you've had water - your buddy will do a happy jog and disappear
3. Click **No** if you haven't - your buddy will sadly crawl away (but don't worry, they'll be back later!)
4. If you don't respond within 3 seconds, your buddy gets playfully insistent with messages like:
   - "Hellooo? Earth to you!"
   - "I'm drying up like a raisin!"
   - "Water you waiting for?"

### Menu Options
Right-click on the Hydration Buddy icon in your menu bar/tray to:
- Open settings
- Pause reminders
- Check reminder schedule
- Access about information
- Quit the application

## Demo

Open `hydration-buddy.html` in any web browser to see an interactive demo of the buddy animations without installing the full desktop app!

## Project Structure

```
hydration-buddy/
├── desktop-app/           # Electron desktop application
│   ├── src/              # Source code (main process, tray setup)
│   ├── assets/           # Icons and resources
│   ├── scripts/          # Build and utility scripts
│   ├── test/             # Test files
│   └── package.json      # Dependencies and build config
├── buddy.svg             # Front view character (waiting/idle)
├── buddy-side.svg        # Side view character (walking)
├── buddy-crawl.svg       # Crawling/crying character (sad)
├── hydration-buddy.html  # Web demo
├── NOTES.md              # Design and animation documentation
└── downloads/            # Pre-built installers
```

## Technical Details

### Character Design
- **Style**: Chibi-style with oversized round head, thick dark outlines
- **Colors**: Chestnut hair (#A4552C), blue shirt (#2B95E6), brown shorts (#C68A5A), peach skin (#F8CBAE)
- **Poses**:
  - Front view (buddy.svg) - faces you while waiting
  - Side view (buddy-side.svg) - used for walking and jogging
  - Crawl view (buddy-crawl.svg) - used when sad

### Animation Timeline
- **Enter**: 1.68s - waddles in sideways with cute movements
- **Idle**: Loops with breathing and blinking
- **Attention**: Jumps every 4s after 3s of no response
- **Happy**: 2.24s - jogs off to the right
- **Sad**: 3.4s - crawls back to the left crying

### Accessibility
Respects `prefers-reduced-motion` preference - animations will be minimal for users who prefer reduced motion.

## Development

### Key Dependencies
- **Electron**: Desktop application framework
- **Electron Builder**: Application packaging and distribution

### Scripts
- `npm start` - Run the app in development mode
- `npm run demo` - Run with shorter intervals (20 seconds) for testing
- `npm test` - Run smoke tests
- `npm run sync-buddy` - Synchronize buddy SVG assets
- `npm run dist` - Build installers for your platform

### Building Animations
All animations are defined in CSS with variables that can be easily adjusted:
- `--hb-enter` - Enter animation duration
- `--hb-happy` - Happy animation duration
- `--hb-sad` - Sad animation duration
- `--step` - Step cycle duration
- `--leg-amp` - Leg swing amplitude
- `--arm-amp` - Arm swing amplitude
- `--bob` - Vertical bobbing amplitude

See `NOTES.md` for detailed animation specifications and design notes.

## License

MIT License - Feel free to use, modify, and distribute this project!

## Creator

Created with love by Vijay

---

Stay hydrated! 💧✨
