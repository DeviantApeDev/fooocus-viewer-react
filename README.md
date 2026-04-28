# Fooocus Log Viewer

A Single Page Application built with Vite, React, and Tailwind CSS that serves as a log viewer for [Fooocus](https://github.com/lllyasviel/Fooocus) AI image generation. It parses `log.html` files from Fooocus outputs, displays generated images in a responsive gallery, and provides tools for searching, comparing, and managing your image generation history. Improvement of the great project by [toutjavascript](https://github.com/toutjavascript/Fooocus-Log-Viewer). Greatly improving app performance and fixes for many bugs.

## Features

- **Image Gallery** - Responsive grid with pagination and column control
- **Zoom & Metadata** - Click any image to view full-size with complete generation settings
- **Search** - Full-text search across prompts, filter by model and styles
- **Calendar View** - Navigate through dates with image counts
- **Batch Comparison** - Compare settings between batches using diff highlighting
- **Auto-reload** - Polls every 5 seconds for new images on the current day
- **Notifications** - Sound and toast alerts for new images
- **Download & Copy** - Download images or copy metadata to clipboard
- **Single-file build** - Everything bundled into one HTML file for easy deployment
- **Delete Images** - Select and permanently delete images from disk with automatic log cleanup (requires server)

## Deleting Images

> **Warning:** Deletion is permanent. Image files are removed from disk and their entries are removed from `log.html`. This cannot be undone.

The delete feature requires the Express server, which means you need [Node.js installed](#nodejs-installation-guide). It will not work with the standalone `viewer.html` file opened directly in a browser.

For cleaning up metadata of images already deleted outside the app, see the [Cleanup Script](#cleanup-script-nodejs-required) section.

## Installation
Put the [dist/viewer.html](https://github.com/DeviantApeDev/fooocus-viewer-react/blob/main/dist/viewer.html) file in your Fooocus's output folder

Open http://localhost:7865/file=outputs/viewer.html while Fooocus is running

## Cleanup Script (Node.js Required)

The `cleanup-missing-images.js` script scans your Fooocus `log.html` files for entries that reference images which no longer exist. This will prevent deleted images metadata from appearing in the Log Viewer.

### Usage

**Dry-run** (default) - Lists missing entries without deleting them:
```bash
node cleanup-missing-images.js
```

**Custom directory** - Specify the outputs path directly (default to current directory):
```bash
node cleanup-missing-images.js /path/to/fooocus/outputs
```

Combine with `--delete` to actually remove the deleted entries:
```bash
node cleanup-missing-images.js /path/to/fooocus/outputs --delete
```

### Node.js Installation Guide 

Node.js is ONLY required to run the development server, build the app, and run the cleanup script.

**Windows:**
```bash
winget install OpenJS.NodeJS
```
Or download the LTS installer from https://nodejs.org

**macOS:**
```bash
brew install node
```
Or download from https://nodejs.org

**Linux:**
```bash
# Debian/Ubuntu
sudo apt install nodejs npm

# Arch
sudo pacman -S nodejs npm
```

**Verify installation:**
```bash
node --version
npm --version
```

## Donate: consider donating if you find this app useful
![giphy](https://github.com/user-attachments/assets/5598d04c-47e3-4260-bbfa-c3729d01f6d5)

[Paypal](https://www.paypal.com/paypalme/DeviantApeArt)

[Kofi](https://ko-fi.com/deviantape)

