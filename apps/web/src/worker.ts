// Same-origin proxy for the dashboard's API calls. Cloudflare Access
// protects this hostname (vinscout.johnbroberts.workers.dev) — by the time
// this fetch handler runs, Access has already authenticated the browser.
// Everything under /api/* is forwarded server-side to the backend Worker,
// with a shared secret attached that only these two Workers know (see
// apps/worker/src/index.ts's auth middleware). This is what makes the raw
// backend hostname safe to leave reachable: a request without that header
// gets rejected there regardless of who sends it.
//
// Routing this through one hostname also sidesteps a real problem: two
// separate Access-protected hostnames each need their own login session,
// and browsers don't carry one hostname's session cookie to another on a
// background fetch() — that's what caused "failed to fetch" errors before
// this existed.
// Minimal local shape instead of pulling in @cloudflare/workers-types —
// that package's globals conflict with the DOM lib the React app needs.
interface AssetsBinding {
  fetch(request: Request): Promise<Response>;
}

interface Env {
  ASSETS: AssetsBinding;
  BACKEND_URL: string;
  INTERNAL_PROXY_SECRET: string;
}

export default {
  async fetch(request: Request, env: Env): Promise<Response> {
    const url = new URL(request.url);

    if (url.pathname.startsWith("/api/")) {
      const backendUrl = new URL(url.pathname + url.search, env.BACKEND_URL);
      const proxied = new Request(backendUrl.toString(), request);
      proxied.headers.set("X-Internal-Proxy-Key", env.INTERNAL_PROXY_SECRET);
      return fetch(proxied);
    }

    return env.ASSETS.fetch(request);
  },
};
