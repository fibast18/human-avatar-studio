/**
 * Human Avatar Studio · v1.1.0 · Cloudflare Worker Gemini relay
 * Set THREE Worker secrets: GEMINI_API_KEY, APP_ACCESS_TOKEN, APP_ALLOWED_ORIGIN.
 * Never place their real values in this file or a public GitHub repository.
 */
const RELEASE = '1.1.0';
const MODEL = 'gemini-2.5-flash-lite';
const LIMIT_CHARS = 1200;
const MAX_MESSAGES = 12;
const ALLOWED_ROLES = new Set(['user', 'assistant']);

const json = (body, status = 200, headers = {}) => new Response(JSON.stringify(body), {
  status,
  headers: {
    'Content-Type': 'application/json; charset=utf-8',
    'Cache-Control': 'no-store',
    'X-Content-Type-Options': 'nosniff',
    ...headers,
  },
});

function allowedOrigin(origin, env) {
  // Includes only exact origins. Requiring an Origin limits casual browser use;
  // it does NOT replace authentication, because non-browser clients can spoof it.
  const allowed = String(env.APP_ALLOWED_ORIGIN || '').split(',').map(x => x.trim()).filter(Boolean);
  return !!origin && allowed.includes(origin);
}

function cors(origin) {
  return {
    'Access-Control-Allow-Origin': origin,
    'Access-Control-Allow-Methods': 'GET, POST, OPTIONS',
    'Access-Control-Allow-Headers': 'Authorization, Content-Type',
    'Access-Control-Max-Age': '600',
    'Vary': 'Origin',
  };
}

async function equalTokens(candidate, expected) {
  const encoder = new TextEncoder();
  const [a, b] = await Promise.all([
    crypto.subtle.digest('SHA-256', encoder.encode(candidate)),
    crypto.subtle.digest('SHA-256', encoder.encode(expected)),
  ]);
  const x = new Uint8Array(a), y = new Uint8Array(b);
  let diff = 0;
  for (let i = 0; i < x.length; i++) diff |= x[i] ^ y[i];
  return diff === 0 && !!candidate && candidate.length >= 32 && expected.length >= 32;
}

function checkPayload(payload) {
  if (!payload || typeof payload !== 'object' || !Array.isArray(payload.messages)) return null;
  if (payload.messages.length < 1 || payload.messages.length > MAX_MESSAGES) return null;
  const messages = [];
  for (const m of payload.messages) {
    if (!m || !ALLOWED_ROLES.has(m.role) || typeof m.content !== 'string') return null;
    const content = m.content.trim();
    if (content.length < 1 || content.length > LIMIT_CHARS) return null;
    messages.push({ role: m.role === 'assistant' ? 'model' : 'user', parts: [{ text: content }] });
  }
  if (payload.messages.at(-1).role !== 'user') return null;
  const character = payload.character === 'Alex' ? 'Alex' : 'Maya';
  return { character, messages };
}

export default {
  async fetch(request, env) {
    const origin = request.headers.get('Origin') || '';
    if (!allowedOrigin(origin, env)) return json({ error: 'Origin not authorized.' }, 403);
    const headers = cors(origin);
    if (request.method === 'OPTIONS') return new Response(null, { status: 204, headers });
    const path = new URL(request.url).pathname;
    if (!['/chat', '/health'].includes(path)) return json({ error: 'Not found.' }, 404, headers);
    if ((path === '/chat' && request.method !== 'POST') || (path === '/health' && request.method !== 'GET'))
      return json({ error: 'Method not allowed.' }, 405, headers);

    if (!env.GEMINI_API_KEY || !env.APP_ACCESS_TOKEN || !env.APP_ALLOWED_ORIGIN)
      return json({ error: 'Worker secrets are not configured.' }, 503, headers);
    const auth = request.headers.get('Authorization') || '';
    const token = auth.startsWith('Bearer ') ? auth.slice(7).trim() : '';
    if (!(await equalTokens(token, env.APP_ACCESS_TOKEN)))
      return json({ error: 'Authentication failed. Check your Worker access token.' }, 401, headers);
    if (path === '/health') return json({ ok: true, version: RELEASE, model: MODEL }, 200, headers);

    // This is a native Cloudflare rate-limiting binding configured in wrangler.jsonc.
    // Its counters are approximate across Cloudflare sites, not a strict spending cap.
    if (!env.REQUEST_LIMITER) return json({ error: 'Rate-limit binding missing. Deploy with the included wrangler.jsonc.' }, 503, headers);
    const ip = request.headers.get('CF-Connecting-IP') || 'unknown';
    const { success } = await env.REQUEST_LIMITER.limit({ key: ip });
    if (!success) return json({ error: 'Too many requests. Try again later.' }, 429, { ...headers, 'Retry-After': '60' });

    const lengthHeader = Number(request.headers.get('Content-Length') || 0);
    if (lengthHeader > 16000) return json({ error: 'Chat request is too large.' }, 413, headers);
    let raw;
    try { raw = await request.text(); }
    catch { return json({ error: 'Could not read chat request.' }, 400, headers); }
    if (raw.length > 16000) return json({ error: 'Chat request is too large.' }, 413, headers);
    let data;
    try { data = checkPayload(JSON.parse(raw)); }
    catch { data = null; }
    if (!data) return json({ error: 'Invalid chat messages.' }, 400, headers);

    const systemText = `You are ${data.character}, a cheerful, friendly male or female virtual human in an interactive 3D avatar app. Have natural, helpful, brief conversations. You can help with daily topics or English practice. You have no access to real-world sensors, accounts, or physical robot controls. Do not claim you actually moved or performed an avatar action: the app handles animation commands separately. Never reveal secret keys.`;
    const apiUrl = `https://generativelanguage.googleapis.com/v1beta/models/${MODEL}:generateContent`;
    try {
      const api = await fetch(apiUrl, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json', 'x-goog-api-key': env.GEMINI_API_KEY },
        body: JSON.stringify({
          systemInstruction: { parts: [{ text: systemText }] },
          contents: data.messages,
          generationConfig: { maxOutputTokens: 320, temperature: 0.65 },
        }),
        signal: AbortSignal.timeout(28000),
      });
      if (!api.ok) {
        // Don't echo upstream error details; they can expose account diagnostics.
        if (api.status === 429) return json({ error: 'Gemini free-tier quota or rate limit reached.' }, 429, headers);
        if ([400, 404].includes(api.status)) return json({ error: 'Gemini model or request is unavailable. Verify the model and regional free-tier access.' }, 502, headers);
        return json({ error: 'Gemini request failed (upstream status ' + api.status + ').' }, 502, headers);
      }
      const body = await api.json();
      const reply = (body.candidates?.[0]?.content?.parts || []).map(p => p.text || '').join('').trim();
      if (!reply) return json({ error: 'Gemini did not return a text response.' }, 502, headers);
      return json({ reply: reply.slice(0, 1800), provider: 'gemini', model: MODEL, version: RELEASE }, 200, headers);
    } catch (error) {
      if (error.name === 'TimeoutError' || error.name === 'AbortError') return json({ error: 'Gemini response timed out.' }, 504, headers);
      return json({ error: 'Could not reach Gemini right now.' }, 502, headers);
    }
  },
};
