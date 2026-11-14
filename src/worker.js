// Cloudflare Worker entry point.
// - GET /api/signups  → live waitlist count (see signups.js)
// - everything else    → the static site in public/ (index.html etc.)
import { handleSignups } from './signups.js';

export default {
  async fetch(request, env) {
    const url = new URL(request.url);
    if (url.pathname === '/api/signups') {
      if (request.method !== 'GET' && request.method !== 'HEAD') {
        return new Response('Method not allowed', { status: 405, headers: { Allow: 'GET, HEAD' } });
      }
      return handleSignups(env);
    }
    return env.ASSETS.fetch(request);
  },
};
