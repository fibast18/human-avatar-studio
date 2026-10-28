# Human Avatar Studio — v1.1.0

**A cumulative upgrade from v1.0.0.** Free GitHub Pages app with female **Maya** and male **Alex** avatars, action commands, facial moods, microphone input where supported, speech synthesis, and optional **Hybrid Automatic AI** (local Qwen2.5 and secure Gemini cloud via Cloudflare Worker).

> **IMPORTANT:** Hosting the static files on GitHub does not automatically activate Gemini. Option C requires deploying the included Worker and setting three secrets privately. Option B requires your browser to support WebGPU, plus an explicit model download. Neither is guaranteed to run on every iPhone/Safari build. All pre-existing animation buttons and rule replies work without either AI engine.

## Release files

```text
human-avatar-v1.1.0/
├── index.html                  ← public GitHub Pages app (entire frontend)
├── manifest.webmanifest        ← home-screen app metadata
├── icon.svg
├── icon-192.png
├── icon-512.png
├── sw.js                       ← v1.1.0 app shell caching
├── README.md                   ← these instructions
├── DEPLOY-CHECKLIST.md         ← quick publication guide
├── RELEASE_NOTES.md
├── cloudflare-worker/
│   ├── src/index.js           ← Worker code (safe to publish; NO keys here)
│   ├── wrangler.jsonc         ← Worker build and rate-limit settings
│   ├── package.json
│   └── .gitignore
└── tests/                     ← test scripts (not required for deployment)
```

## 1. Update GitHub Pages (keep your existing repository)

1. **Keep the same GitHub repository and URL** from v1.0.0; do **not** create a new site if you want existing iPhone local settings to survive.
2. On GitHub, open your repository and upload/rewrite these files at the **repository root**: `index.html`, `manifest.webmanifest`, `icon.svg`, `icon-192.png`, `icon-512.png`, `sw.js`. You can also upload README and code folders, but they are not needed for Pages to run.
3. For a new repository: go to **Settings → Pages → Deploy from a branch → main → /(root) → Save**.
4. Visit `https://YOUR-USERNAME.github.io/YOUR-REPO/`. Verify the header and footer say **v1.1.0**. Reload once or twice if a service worker is serving an older shell. On your iPhone open the same address in Safari, then Share → Add to Home Screen.
5. **No model files, API keys, or .env files belong in the public GitHub repository.** The app loads approved public libraries/3D example assets from CDNs.

## 2. Option B: Local generative AI (on-device)

1. Open the updated site in Safari. Go to **Hybrid AI Center → Option B — On-device AI**.
2. Tap **Download / load local model**. The app checks `navigator.gpu`, requests a GPU adapter and then imports `@mlc-ai/web-llm@0.2.86` dynamically.
3. It selects the available compact `Qwen2.5-0.5B-Instruct-q4f16_1-MLC` model (falling back to the Qwen2 counterpart if the specified model is absent). The first download can be large; use reliable Wi-Fi and sufficient device storage. This step is optional and explicit, not performed automatically on first load.
4. Select **Local AI only**, or **Hybrid Automatic** to use it as the cloud fallback. Subsequent page loads may reuse browser-cached model files but can still require reconnecting and/or reloading. Browser storage can be evicted.
5. If the phone reports missing WebGPU, out-of-memory, or model download errors, use Option C instead. The **Unload model** button releases its in-memory inference engine while keeping the 3D avatar active.

**Realistic expectations:** The iPhone 16 Pro Max has an A18 Pro chip and enough physical RAM to make a 0.5B 4-bit model a reasonable trial, but Safari's process memory limit and GPU support are separate concerns. **Successful model loading and animation performance were not validated on a physical iPhone.** A cached model does not guarantee the whole app will run offline: first-load Three.js and textured avatars come from external sites.

## 3. Option C: Secure Gemini cloud AI with Cloudflare Workers

You do **not** need Cloudflare R2 object storage, D1 database, or a paid server. You **do** need a free Cloudflare account and an eligible Gemini API free tier. Free limits, model offerings, and regional availability can change.

### Step A — Create the Gemini API key

1. Visit [Google AI Studio](https://aistudio.google.com/app/apikey) and create a **Gemini API key** in an eligible project.
2. Do **not** enable paid billing unless you deliberately intend to use it. Free-tier access and quotas depend on your project and region.
3. **Never put that key into `index.html`, GitHub, or the browser's Cloud settings.**

### Step B — Deploy the Worker using Wrangler (Mac or other computer)

Install **Node.js** if necessary. Open Terminal in the included `cloudflare-worker` folder:

```bash
cd cloudflare-worker
npm install
npx wrangler login
npx wrangler deploy
```

Cloudflare will show a Worker URL like `https://human-avatar-ai.<your-subdomain>.workers.dev`.

Now set each secret interactively (the input is not written into the repository):

```bash
npx wrangler secret put GEMINI_API_KEY
npx wrangler secret put APP_ACCESS_TOKEN
npx wrangler secret put APP_ALLOWED_ORIGIN
```

- `GEMINI_API_KEY`: paste the Google AI Studio key.
- `APP_ACCESS_TOKEN`: create a **separate**, long random token; on your Mac use `openssl rand -hex 32` and paste the resulting 64-character string into the secret prompt. Save it somewhere private because you'll paste the **same token** into the app on your iPhone.
- `APP_ALLOWED_ORIGIN`: set the **exact origin** of your published GitHub Pages site, e.g. `https://YOUR-USERNAME.github.io` (no trailing slash, no `/human-avatar-studio/` path). You can set comma-separated origins if you intentionally use multiple trusted sites. Avoid the wildcard `*`.

**Important:** `wrangler.jsonc` also provisions a native Cloudflare rate-limiting binding (`REQUEST_LIMITER`: **10 authenticated AI requests per minute per IP address**, approximately, per Cloudflare location). Deploy with that file. The Worker intentionally refuses to call Gemini if the binding is missing. Native rate limits are **not** a guaranteed daily spending cap and may allow short bursts across locations.

To deploy subsequent changes from the Worker folder, run `npx wrangler deploy` again. To rotate a compromised token, run `npx wrangler secret put APP_ACCESS_TOKEN` again and update the iPhone value.

### Step C — Connect your avatar

1. In the published **v1.1.0** app, expand **Hybrid AI Center → Option C**.
2. Enter the HTTPS Worker address ending in `.workers.dev` (or a trusted HTTPS custom Worker hostname). Do not add `/chat`, `/health`, parameters, or a trailing path.
3. Enter the separate `APP_ACCESS_TOKEN` secret (**not** the Gemini key).
4. Tap **Save on this device** then **Test secure connection**. The test authenticates `/health`; it checks the Worker and secrets, but does **not** spend a Gemini completion or prove that Gemini is currently within quota.
5. Choose **Hybrid Automatic** or **Cloud AI only**. Try typing **“Why is the sky blue?”**. An AI response will display the engine source below the settings.

### How authentication and privacy work

- The API key is stored **only** in Cloudflare's `GEMINI_API_KEY` secret; Gemini calls run from the Worker. This protects the *provider's secret* from visitors viewing GitHub Pages source.
- The user-entered `APP_ACCESS_TOKEN` is saved in local browser storage on that device. It is a **personal access credential**, not a publicly shared website token. Anyone who steals it can use your Worker until you rotate it; don't use shared/public devices.
- Worker checks **exact allowed browser origin**, an access token, input size/content, and an authenticated per-IP rate limit before reaching Gemini. The origin check is an additional browser restriction **not** a substitute for the access token; HTTP clients can forge an Origin header.
- Chat content and recent conversational context are transmitted to Google for cloud replies. On Google's **free tier**, prompts and responses may be used to improve Google products. Don't submit sensitive information.
- For local-only mode, prompts are sent to your downloaded local model, not Gemini. However, browser speech recognition may rely on its own network service.

## 4. How Hybrid Automatic decides

| Input / condition | Behavior |
|---|---|
| `dance`, `wave then smile`, `laugh`, `switch to male` | Deterministic command engine, bypasses AI entirely. |
| Open-ended question, Worker configured and working | Ask Gemini cloud first. |
| Gemini not configured or unavailable, local model explicitly enabled | Use Qwen2.5 locally, loading from cache if needed. |
| Neither generative engine available | Show a transparent fallback message; actions still work. |
| Rule-based only mode | Only deterministic motions and preset replies; no AI calls. |

AI text is **read-only with respect to the avatar controls**. The app never interprets generated text as an instruction to execute an animation, visit a website, or change settings.

## 5. Speech, 3D and mobile limitations

- The browser's **speech recognition** feature is optional, may require online processing, and may be unsupported in Safari/Web Apps. Typed input always remains available.
- Browser **speech synthesis** voices depend on installed iOS voices; Maya/Alex aren't guaranteed specific female/male voices.
- Built-in expressive sculpt animates face components. The externally hosted example textured figures do not have complete facial blendshape rigs; moods appear through an expression badge and body movement.
- Three.js uses WebGL. WebLLM separately needs WebGPU. WebGPU may be unavailable even when 3D works.
- GitHub Pages, Three.js and WebLLM hosting are free, but their public assets and the model download require network access at least initially; **full offline functionality is not guaranteed**.
- This app does not have full-duplex real-time AI speech. Speech is one-shot recognition followed by text generation and browser TTS.

## 6. Preserved local settings and version policy

This release preserves the existing v1.0.0 localStorage keys and their structure:

- `human-avatar-studio-v1` — character, voice, appearance, idle motion, TTS choices, etc.
- `human-avatar-history-v1` — recent action and command activity.

New keys:

- `human-avatar-ai-v1` — AI mode, local model download consent, Worker URL and personal access token.
- `human-avatar-chat-v1` — recent user/assistant pairs (last 18 messages, capped at 1,200 characters each), supplied as context for subsequent AI replies.

**Clearing history** clears both activity and AI context; **Reset voice & preferences** only resets original v1 preferences (it does not silently delete the Worker token). The **Remove saved token** button explicitly removes cloud credentials.

## 7. Quality checks included

Using Node.js 22:

```bash
node --check tests/frontend-module-syntax.mjs
node --check cloudflare-worker/src/index.js
node tests/command-router.test.cjs
node tests/worker.test.mjs
```

The `tests/frontend-module-syntax.mjs` is a syntax-only extraction of the module embedded in `index.html`; it is **not** another file your GitHub Pages app imports. Tests mock the Gemini response and do not require a real API key. Live end-to-end Gemini, WebLLM download, Safari/WebGPU execution, and all 3D model mirrors require post-deployment testing.

## Official resources

- [GitHub Pages deployment](https://docs.github.com/en/pages/getting-started-with-github-pages/configuring-a-publishing-source-for-your-github-pages-site)
- [WebLLM (local browser model)](https://github.com/mlc-ai/web-llm)
- [Cloudflare Worker rate-limiting](https://developers.cloudflare.com/workers/runtime-apis/bindings/rate-limit/)
- [Gemini API pricing and free tier](https://ai.google.dev/gemini-api/docs/pricing)

Human Avatar Studio · v1.1.0 · Developed by Engr. Rico J. Pono.
