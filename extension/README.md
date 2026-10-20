# SnipVault

Offline-first snippet manager for Chrome (Manifest V3, React + TypeScript + Vite + Tailwind).

## Build
```bash
cd extension
npm install
npm run build        # outputs ./dist
```

## Load in Chrome
1. Open `chrome://extensions`, enable **Developer mode**.
2. Click **Load unpacked** and select `extension/dist`.

## Package for the Chrome Web Store
```bash
npm run package      # creates snipvault.zip from dist/
```
Upload the zip in the Chrome Web Store Developer Dashboard. Manual steps: developer account ($5 one-time),
store listing screenshots (1280x800), a privacy policy stating all data stays local, and the single-purpose
/ permission justification for `storage`.

## Privacy
- Only permission: `storage`. Storage access is restricted to trusted extension contexts.
- No network requests, analytics, remote fonts or remote code.
- Data lives in `chrome.storage.local` under one key (`snipvault.snippets.v1`) and is **not encrypted**.

## Notes
- When opened outside Chrome (e.g. `npm run dev`), storage falls back to `localStorage` for previewing.
- Preview storage is separate from installed-extension storage; the existing snippet key is unchanged, so no migration or recurring import is needed.
- Popup shortcuts: Ctrl/Cmd+K searches, Ctrl/Cmd+N adds, arrows select, Enter copies, Ctrl/Cmd+Enter saves, Escape closes. Chrome's configurable open command defaults to Ctrl/Cmd+Shift+Y; change it at chrome://extensions/shortcuts.
- The standalone website embeds the prebuilt popup. Build from the project root with `bunx vite build --config extension/vite.config.ts`, then refresh `public/snipvault-popup` and the extension ZIP.
