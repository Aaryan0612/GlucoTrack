# GlucoTrack

> Your gentle daily blood sugar companion

A Progressive Web App (PWA) for tracking blood sugar readings, designed for adults managing Type 2 Diabetes.

## Features

- 📊 **Blood Sugar Tracking** - Log fasting, post-meal, and bedtime readings
- 📈 **Progress Visualization** - View trends and statistics over time
- 💉 **Insulin Reminders** - Track weekly Saturday insulin injections
- 🌙 **Dark Mode** - Beautiful light and dark themes
- 📱 **PWA** - Install to home screen, works offline
- ♿ **Accessible** - Large text, high contrast, screen reader support

## Getting Started

### Install Dependencies

```bash
npm install
```

### Development

```bash
npm run dev
```

### Build for Production

```bash
npm run build
```

### Preview Production Build

```bash
npm run preview
```

## Tech Stack

- **React 18** - UI framework
- **Vite** - Build tool
- **React Router** - Navigation
- **Recharts** - Charts and graphs
- **Lucide React** - Icons
- **vite-plugin-pwa** - PWA support

## PWA Setup

The app is configured as a PWA and will:
- Cache all assets for offline use
- Be installable to home screen
- Work without internet after first load

### Icons

Replace the placeholder icon files in `/public/` with actual icons:
- `pwa-192x192.png` (192×192px)
- `pwa-512x512.png` (512×512px)
- `apple-touch-icon.png` (180×180px)

Recommended: Use [RealFaviconGenerator](https://realfavicongenerator.net/) to generate all sizes.

## Design System

- **Colors**: Warm green primary (#2D6A4F), coral accent (#E76F51)
- **Fonts**: Cormorant Garamond (display), DM Sans (body)
- **Spacing**: 8pt grid system
- **Mobile-first**: Optimized for phone, works on desktop

## Data Storage

All data is stored locally in the browser's `localStorage`:
- `glucotrack_readings` - Blood sugar readings
- `glucotrack_insulin_log` - Insulin injection records
- `glucotrack_settings` - App settings and preferences

No backend required. No account needed.

## License

MIT
