// Cloudflare Pages Function: GET /api/signups  ->  { "count": 128 }
//
// Returns how many people have joined the waitlist, read from the SilentForms
// Submissions API. The API token stays here on Cloudflare's servers; the web page
// only ever receives the number, never names or emails.
//
// Settings (Cloudflare → your Pages project → Settings → Variables and Secrets):
//   SILENTFORMS_TOKEN    required, a secret. Your "sf_..." API token.
//   SILENTFORMS_FORM_ID  optional. Which form to count. If left out, every active
//                        form in your SilentForms account is added up.

const API = 'https://silentforms.com/api/v1/forms';
const CACHE_SECONDS = 300; // fetch from SilentForms at most once every 5 minutes

// Remembered between requests while this server instance stays warm.
let memo = { count: null, at: 0 };

function reply(body, status, maxAge) {
  return new Response(JSON.stringify(body), {
    status,
    headers: {
      'Content-Type': 'application/json',
      'Cache-Control': maxAge ? `public, max-age=${maxAge}` : 'no-store',
    },
  });
}

export async function countSignups(env, fetchFn = fetch) {
  const res = await fetchFn(API, { headers: { Authorization: `Bearer ${env.SILENTFORMS_TOKEN}` } });
  if (!res.ok) {
    const detail = await res.json().catch(() => ({}));
    throw new Error(`SilentForms answered ${res.status}: ${detail?.error?.message || 'no details'}`);
  }
  const { data = [] } = await res.json();
  const wanted = env.SILENTFORMS_FORM_ID ? String(env.SILENTFORMS_FORM_ID) : null;
  const forms = wanted ? data.filter(f => String(f.id) === wanted) : data.filter(f => f.active !== false);
  if (wanted && forms.length === 0) throw new Error(`No form with id ${wanted} in this SilentForms account`);
  // `submissions` counts the inbox, not spam.
  return forms.reduce((sum, f) => sum + (Number(f.submissions) || 0), 0);
}

export async function onRequestGet({ env }) {
  if (!env.SILENTFORMS_TOKEN) return reply({ count: null, error: 'SILENTFORMS_TOKEN is not set' }, 503);

  if (memo.count !== null && Date.now() - memo.at < CACHE_SECONDS * 1000) {
    return reply({ count: memo.count }, 200, CACHE_SECONDS);
  }
  try {
    const count = await countSignups(env);
    memo = { count, at: Date.now() };
    return reply({ count }, 200, CACHE_SECONDS);
  } catch (err) {
    console.error(err);
    // If SilentForms is briefly unavailable, keep showing the last known number.
    if (memo.count !== null) return reply({ count: memo.count, stale: true }, 200, 60);
    return reply({ count: null, error: 'Could not read the count' }, 502);
  }
}
