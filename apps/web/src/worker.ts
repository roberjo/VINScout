// Same-origin proxy for the dashboard's API calls. Cloudflare Access
// protects this hostname (vinscout.johnbroberts.workers.dev) — by the time
// this fetch handler runs, Access has already authenticated the browser.
// Everything under /api/* is forwarded to the backend Worker via a service
// binding (BACKEND), with a shared secret attached that only these two
// Workers know (see apps/worker/src/index.ts's auth middleware). This is
// what makes the raw backend hostname safe to leave reachable: a request
// without that header gets rejected there regardless of who sends it.
//
// Routing this through one hostname also sidesteps a real problem: two
// separate Access-protected hostnames each need their own login session,
// and browsers don't carry one hostname's session cookie to another on a
// background fetch() — that's what caused "failed to fetch" errors before
// this existed.
//
// A service binding (rather than a plain fetch() to the backend's
// *.workers.dev URL) is required here: Cloudflare's edge returns its own
// stock "There is nothing here yet" 404 page for Worker-to-Worker fetch()
// calls targeting another Worker's *.workers.dev hostname, even though the
// exact same URL+headers work correctly from an external client (verified
// via curl). A service binding calls the backend Worker directly, skipping
// DNS/TLS/workers.dev routing (and Access, which only ever sat in front of
// external traffic anyway) entirely.
//
// wrangler.jsonc sets assets.run_worker_first: true (not a glob like
// ["/api/*"]) — every request runs through this script explicitly, which
// then decides whether to proxy or fall through to ASSETS.fetch() in code.
// A glob-based run_worker_first was tried first and silently didn't route
// /api/* here in production (served a raw Cloudflare asset-404 instead) —
// unclear whether that's a genuine interaction with Access sitting in
// front, or something else, but being fully explicit here removes the
// ambiguity either way.
// Minimal local shape instead of pulling in @cloudflare/workers-types —
// that package's globals conflict with the DOM lib the React app needs.
interface FetcherBinding {
  fetch(request: Request): Promise<Response>;
}

interface Env {
  ASSETS: FetcherBinding;
  BACKEND: FetcherBinding;
  INTERNAL_PROXY_SECRET: string;
}

export default {
  async fetch(request: Request, env: Env): Promise<Response> {
    const url = new URL(request.url);

    if (url.pathname.startsWith("/api/")) {
      const proxied = new Request(url.toString(), request);
      proxied.headers.set("X-Internal-Proxy-Key", env.INTERNAL_PROXY_SECRET);
      return env.BACKEND.fetch(proxied);
    }

    return env.ASSETS.fetch(request);
  },
};
