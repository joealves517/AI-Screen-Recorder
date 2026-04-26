# AI Screen Recorder

A powerful screen recorder Chrome extension with AI-powered features. Capture, annotate, and edit videos effortlessly.

## Features

🎥 Record your tab, a specific area, desktop, any application, or camera  
🎙️ Record your microphone or internal audio with push-to-talk support  
✏️ Annotate by drawing anywhere on the screen, adding text, arrows, shapes  
✨ AI-powered camera backgrounds and blur effects  
🔎 Smooth zoom-in to focus on specific areas  
🪄 Blur sensitive content to keep it private  
✂️ Comprehensive editor: trim, cut, crop, add/remove audio  
👀 Highlight clicks and cursor with spotlight mode  
⏱️ Auto-stop alarms for timed recordings  
💾 Export as MP4, GIF, or WebM  
🔒 Privacy-first: your data stays on your device  

## Development

### Prerequisites

- [Node.js](https://nodejs.org/) version >= 14

### Setup

1. Clone this repository
2. Run `npm install` to install dependencies
3. Run `npm start` to start the local development server
4. Open `chrome://extensions/` and [enable developer mode](https://developer.chrome.com/docs/extensions/mv2/faq/#:~:text=You%20can%20start%20by%20turning,a%20packaged%20extension%2C%20and%20more.)
5. Click **Load unpacked** and select the `build` folder
6. The extension should now be available locally

To rebuild after code changes, run `npm run build`.

### Build for Production

```bash
npm run build:prod
```

### Package for Chrome Web Store

```bash
npm run package
```

## Attribution

This project is a modified version of [Screenity](https://github.com/alyssaxuu/screenity) by [Alyssa X](https://alyssax.com), licensed under [GPLv3](./LICENSE).

Modifications include rebranding, AI-powered features integration, and UI/UX improvements.

## License

[GPLv3](./LICENSE) — See the LICENSE file for details.
