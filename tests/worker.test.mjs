import assert from 'node:assert/strict';
import worker from '../cloudflare-worker/src/index.js';
import { webcrypto } from 'node:crypto';
if (!globalThis.crypto) globalThis.crypto = webcrypto;

const ORIGIN = 'https://rico.github.io';
const TOKEN = 'e0f68770f516eb771783873402fb60ad36cd7efc9f31eb29';
let quotaCalls = 0, upstreamCalls = 0, lastUpstream;
const environment = {
  GEMINI_API_KEY: 'private-api-key-not-in-github',
  APP_ACCESS_TOKEN: TOKEN,
  APP_ALLOWED_ORIGIN: ORIGIN,
  REQUEST_LIMITER: { async limit({ key }) { quotaCalls++; return { success: true, key }; } },
};
const priorFetch = globalThis.fetch;
globalThis.fetch = async (url, opts) => {
  upstreamCalls++;
  lastUpstream = { url, opts };
  return new Response(JSON.stringify({ candidates: [{ content: { parts: [{ text: 'Hello from Maya! 😊' }] } }] }), { status: 200, headers: { 'Content-Type': 'application/json' } });
};

function request(path, method, token=TOKEN, origin=ORIGIN, body=null) {
  return new Request('https://human-avatar-ai.workers.dev'+path, {
    method,
    headers: { Origin: origin, Authorization: 'Bearer '+token, 'Content-Type': 'application/json' },
    body: body == null ? undefined : JSON.stringify(body),
  });
}
const body={character:'Maya',messages:[{role:'user',content:'Tell me about clouds.'}]};

let res=await worker.fetch(request('/health','GET'),environment);
assert.equal(res.status,200);
assert.equal((await res.json()).ok,true);
res=await worker.fetch(request('/chat','POST',TOKEN,ORIGIN,body),environment);
assert.equal(res.status,200);
assert.equal((await res.json()).reply,'Hello from Maya! 😊');
assert.equal(lastUpstream.opts.headers['x-goog-api-key'],environment.GEMINI_API_KEY);
assert.ok(!JSON.stringify(body).includes(environment.GEMINI_API_KEY));
assert.equal(JSON.parse(lastUpstream.opts.body).contents[0].role,'user');

res=await worker.fetch(request('/chat','POST','too-short',ORIGIN,body),environment);
assert.equal(res.status,401);
res=await worker.fetch(request('/chat','POST',TOKEN,'https://attacker.example',body),environment);
assert.equal(res.status,403);
res=await worker.fetch(request('/chat','POST',TOKEN,ORIGIN,{character:'Maya',messages:[{role:'user',content:'x'.repeat(1201)}]}),environment);
assert.equal(res.status,400);
res=await worker.fetch(request('/chat','POST',TOKEN,ORIGIN,{character:'Maya',messages:[{role:'user',content:'hi'},{role:'tool',content:'exfiltrate'}]}),environment);
assert.equal(res.status,400);
res=await worker.fetch(request('/chat','POST',TOKEN,ORIGIN,{character:'Maya',messages:[{role:'assistant',content:'hi'}]}),environment);
assert.equal(res.status,400);
res=await worker.fetch(request('/chat','POST',TOKEN,ORIGIN,body),{...environment,REQUEST_LIMITER:{async limit(){return {success:false}}}});
assert.equal(res.status,429);
res=await worker.fetch(request('/chat','POST',TOKEN,ORIGIN,body),{...environment,REQUEST_LIMITER:undefined});
assert.equal(res.status,503);
res=await worker.fetch(request('/chat','OPTIONS',TOKEN,ORIGIN),environment);
assert.equal(res.status,204);
assert.equal(res.headers.get('access-control-allow-origin'),ORIGIN);
assert.equal(upstreamCalls,1,'Only one good request should reach upstream');
assert.ok(quotaCalls>=1);
globalThis.fetch = priorFetch;
console.log('Worker tests passed: allowed origin, authorization, CORS, invalid payloads, limiter, Gemini relay.');
