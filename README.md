# Sumi Music Player

Sumi is a modern, cross-platform music player built with Electron, Vue.js, and TypeScript. It features a sleek, responsive interface with customizable themes that adapt to album artwork.

## Features

- **Cross-platform** - Works on Windows, macOS, and Linux
- **Beautiful UI** - Clean, modern design with adaptive theming based on album art
- **Music Library Management** - Import and organize your local music collection
- **Playlist Support** - Create and manage playlists of your favorite tracks
- **Media Controls** - Intuitive playback controls with progress tracking
- **Audio Format Support** - Plays MP3, FLAC, WAV, OGG, M4A, and AAC files

## Screenshots
![image](https://github.com/user-attachments/assets/da988d0c-fddb-41a6-bdcd-0fa909ce38d3)
![image](https://github.com/user-attachments/assets/21567a5f-d8b8-49bb-827d-5452bc646683)
![image](https://github.com/user-attachments/assets/76e5bfe0-92d3-4fbf-a059-079e024cf693)
![image](https://github.com/user-attachments/assets/704e1e2c-282f-444e-b041-e1906fe28e6d)

## Installation

### Pre-built Binaries

Download the latest release for your platform from the [Releases page](https://github.com/Nine0512/sumi/releases).

### Building from Source

#### Prerequisites

- Node.js (v16 or higher)
- pnpm

#### Setup

```bash
# Clone the repository
git clone https://github.com/Nine0512/Sumi.git
cd sumi

# Install dependencies
pnpm install

# Start the development server
pnpm run electron:dev

# Build for production
pnpm run electron:build
```

## Development

### Project Structure

```
sumi/
├── electron/           # Electron main process files
├── src/
│   ├── assets/         # Static assets
│   ├── components/     # Vue components
│   ├── composables/    # Vue composable functions
│   └── types/          # TypeScript type definitions
├── build-resources/    # Build resources (icons, etc.)
└── public/             # Public static files
```

### Key Technologies

- **[Vue.js](https://vuejs.org/)** - Frontend framework
- **[TypeScript](https://www.typescriptlang.org/)** - Type-safe JavaScript
- **[Electron](https://www.electronjs.org/)** - Cross-platform desktop apps
- **[Tailwind CSS](https://tailwindcss.com/)** - Utility-first CSS framework
- **[Music Metadata Browser](https://github.com/Borewit/music-metadata-browser)** - Audio metadata parsing

---

Made with ♥ by [Nine](https://github.com/Nine0512)
