# v1.1.0 — Quick deployment checklist

## GitHub Pages (the avatar app)

- [ ] Replace **index.html**, **manifest.webmanifest**, **sw.js**, **icon.svg**, **icon-192.png**, **icon-512.png** in the **same v1.0.0 repository root**.
- [ ] Keep `Settings → Pages → main / (root)` enabled.
- [ ] Open your published Pages URL; verify **v1.1.0** in header and footer.
- [ ] On iPhone, open Safari/Home Screen site and reload once if an old cached version appears.

## Cloudflare Worker (optional, for Option C)

- [ ] Get a Gemini **free-tier** API key from Google AI Studio. Do not publish it.
- [ ] `cd cloudflare-worker && npm install && npx wrangler login && npx wrangler deploy`.
- [ ] Set Worker secrets with `npx wrangler secret put`:
  - [ ] `GEMINI_API_KEY` = private Gemini key
  - [ ] `APP_ACCESS_TOKEN` = different random token of 32+ characters
  - [ ] `APP_ALLOWED_ORIGIN` = `https://YOUR-USERNAME.github.io` (no repository path)
- [ ] Verify you deployed with `wrangler.jsonc` and the rate-limit binding.
- [ ] Open Avatar → Hybrid AI Center → Option C; save your Worker URL and **access token**, then tap **Test secure connection**.
- [ ] Ask a general question while **Hybrid Automatic** is selected. Make sure the source says **Gemini cloud**.

## Optional on-device Qwen (Option B)

- [ ] Expand Option B. Tap **Download / load local model** using stable Wi-Fi.
- [ ] Check that the local status says it is ready; test **Local AI only**.
- [ ] If Safari reports WebGPU or memory failure, return to Hybrid Automatic/Cloud-only. Animations remain available.

**No R2, D1, paid backend, or public Gemini key is required.** Free-tier availability and quotas apply; this is not a guarantee of unlimited usage.
