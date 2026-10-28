# Human Avatar Studio · v1.0.0

A free, responsive, GitHub Pages-ready 3D human-avatar web app.

## Features

- Two human character profiles: **Maya** (female) and **Alex** (male).
- Default **Textured human** option loads examples from the official three.js website: Michelle.glb and Soldier.glb, respectively. They are game-quality 3D sample characters, **not photorealistic digital humans**. Their available embedded clips vary. External models require an internet connection and can change or become unavailable.
- Built-in **Expressive sculpt** option requires no downloaded character assets. The Three.js library must still download from a free CDN on first visit. This option has visible expressive eyes, eyebrows, and an animated mouth.
- More than 20 motion commands and 12 moods, with additional greetings/replies. Depending on the selected character, some gestures are generated procedurally rather than being pre-recorded motion capture clips.
- Typed commands, sequential instructions such as `dance then wave`, browser text-to-speech, optional one-shot speech-recognition input, a saved voice preference, local device settings, and recent local activity.
- Installable web-app manifest, app icons, and simple network-first service worker.
- No paid AI API, database, paid hosting, signup, or subscription.

## Publish to GitHub Pages (copy-and-paste workflow)

1. On **github.com**, create a public repository such as `human-avatar-studio`.
2. Upload the files from this folder into the **repository root**: `index.html`, `manifest.webmanifest`, `icon.svg`, `icon-192.png`, `icon-512.png`, and `sw.js`. Do **not** nest them inside `human-avatar-v1.0.0/` on GitHub unless you also configure Pages to serve that folder.
3. Open **Settings → Pages**, then select **Deploy from a branch**, branch **main**, directory **/(root)** and click **Save**.
4. Once GitHub Pages has published, open `https://YOUR-USERNAME.github.io/human-avatar-studio/` in Safari. Your exact URL depends on your repository and GitHub username.
5. To put it on your iPhone Home Screen: open the Pages URL in Safari, tap **Share → Add to Home Screen → Add**.
6. Allow microphone permission only if you wish to use speech recognition. It depends on iOS/WebKit and may use remote speech-processing services. Use typed commands whenever unavailable.

**Super-easy variant:** `index.html` alone runs as a basic GitHub Pages website, but its icon and manifest would be missing (the UI still functions). Upload all six files for the complete app.

## Testing on a computer

Serve the folder over HTTP, for example `python3 -m http.server 8000`, and open `http://localhost:8000/`. Opening via `file://` is not supported for a reliable 3D-model-loading test.

## Commands

- **Movements:** `idle`, `wave`, `dance`, `walk`, `run`, `jump`, `clap`, `sit`, `bow`, `stretch`, `nod`, `shake head`, `salute`, `spin`, `squat`, `cheer`, `point`, `kick`, `punch`, `yoga`, `march`, `sleep`, `stop`.
- **Expressions:** `happy`, `smile`, `laugh`, `wink`, `sad`, `angry`, `surprise`, `love`, `curious`, `sleepy`, `blink`, `neutral`.
- **Conversation:** `hello`, `good morning`, `how are you`, `tell a joke`, `thank you`, `what can you do`, `introduce yourself`, `goodbye`.
- **Examples:** `dance then wave`, `laugh`, `switch to male`, `change to female`, `run then stop`.

## Important technical limitations

1. The app is an **interactive command-and-response engine**, not free-form generative AI. It cannot understand arbitrary requests or answer general questions.
2. The textured sample models typically **do not have expressive facial blendshapes**. They communicate moods with a floating 3D expression symbol and optional head/body gestures. Choose **Expressive sculpt** for directly animated face parts.
3. Free browser text-to-speech voices, accents and microphone compatibility vary by browser. The app uses the voices that the browser exposes; choosing Maya or Alex does not guarantee a particular recorded male or female voice.
4. Web Speech speech recognition can rely on browser/platform server-side processing: it is **not guaranteed local, private to the device, or offline**. The app itself sends no commands to a separately configured application server or AI service.
5. The textured GLB models and Three.js library are loaded from third-party URLs. Network access is necessary at least on the first successful load. The service worker caches app-shell files, **not a guaranteed offline copy of those model and library dependencies**.
6. When installing an update, replace the existing files, increment the version in `index.html`, `sw.js`, and cache names, and reload your Home Screen app while connected to the internet. The service worker uses a network-first strategy to reduce old-build problems.
7. The two remote 3D files originate from official three.js example resources; assess their separate rights/attribution before commercial redistribution or model modification. Three.js itself is released under the MIT license.

## File layout

```text
human-avatar-studio/
├── index.html              main app (styles, code, commands, 3D)
├── manifest.webmanifest    mobile install metadata
├── icon.svg                vector logo
├── icon-192.png            192x192 icon
├── icon-512.png            512x512 icon
└── sw.js                   app-shell service worker
```

## Version / data policy

Initial release `v1.0.0`. Preferences and recent commands are stored in browser `localStorage` under keys `human-avatar-studio-v1` and `human-avatar-history-v1`. Clearing website data or removing the site can erase them. All future updates should preserve these keys and settings formats when possible and keep release metadata cumulative.

App designed for Engr. Rico J. Pono. No paid backend dependencies.
