# Deploying FreshBasket

Two supported routes: **Vercel** (managed, easiest) and **Docker on a VPS** (self-hosted).
Both need a MongoDB database (MongoDB Atlas free tier works) and the environment variables in
[`.env.example`](../.env.example).

## Before you deploy (both routes)

1. **Database.** Create a MongoDB Atlas cluster and a database user with a strong, unique password.
   Under *Network Access*, allow only your host's outbound IPs if you can (Vercel: `0.0.0.0/0` is
   needed unless you use Vercel's Secure Compute / static IPs).
2. **Secrets.** Generate `NEXTAUTH_SECRET`:
   ```bash
   node -e "console.log(require('crypto').randomBytes(48).toString('base64url'))"
   ```
3. **Email.** For Gmail, turn on 2-step verification and create an *App Password* for `EMAIL_PASS`.
4. **Payments (optional).** Use SSLCommerz sandbox credentials with `IS_LIVE=false` until you
   have a live store; then set `IS_LIVE=true` and the live credentials.
5. **URL.** Set `NEXTAUTH_URL` and `NEXT_PUBLIC_BASE_URL` to the public `https://` URL,
   no trailing slash. SSLCommerz sends customers back to `NEXT_PUBLIC_BASE_URL`.

After the first deploy:

```bash
# Register and verify an account in the app, then (with MONGODB_URI in .env.local):
npm run promote-admin -- you@example.com
# Upgrading a database created before emails were lower-cased? Run once:
npm run normalize-emails            # dry run
npm run normalize-emails -- --apply
```

## Route 1: Vercel

1. Import the Git repository in Vercel (framework preset: **Next.js**; no build settings to change).
2. Add every variable from `.env.example` under *Settings → Environment Variables* (Production).
3. Deploy. Vercel provides HTTPS and HSTS; the app adds the rest of the security headers
   (see [SECURITY.md](SECURITY.md)).
4. Set your custom domain, then update `NEXTAUTH_URL` and `NEXT_PUBLIC_BASE_URL` to it and redeploy
   (`NEXT_PUBLIC_*` values are compiled in at build time).

## Route 2: Docker on a VPS

Requirements: a Linux server with Docker and Docker Compose, a domain pointing at it.

```bash
git clone <your-repo> freshbasket && cd freshbasket
cp .env.example .env.production   # fill in real values; keep this file private (chmod 600)
NEXT_PUBLIC_BASE_URL=https://shop.example.com docker compose up -d --build
```

The container listens on `127.0.0.1:3000` only, runs as a non-root user, and has a health check
(`docker compose ps` shows `healthy`). Put a TLS reverse proxy in front of it. With **Caddy**
(automatic HTTPS), `/etc/caddy/Caddyfile`:

```
shop.example.com {
    reverse_proxy 127.0.0.1:3000 {
        header_up X-Real-IP {remote_host}
    }
}
```

With **nginx**, make sure the real client IP is forwarded; the rate limiter relies on it:

```nginx
location / {
    proxy_pass http://127.0.0.1:3000;
    proxy_set_header Host $host;
    proxy_set_header X-Real-IP $remote_addr;
    proxy_set_header X-Forwarded-For $remote_addr;
    proxy_set_header X-Forwarded-Proto $scheme;
}
```

The rate limiter takes the client IP from `X-Real-IP`, then `X-Forwarded-For`, so the proxy
must **overwrite** both headers with the address of the actual connection, never pass on the
values a client sent. Both examples above do this: Caddy sets `X-Forwarded-For` itself but
forwards a client's `X-Real-IP` unchanged, hence the `header_up` line. Do **not** expose
port 3000 directly to the internet: without such a proxy, clients could spoof their IP to
dodge rate limits.

Update: `git pull && docker compose up -d --build`.

### Without Docker (plain Node on a VPS)

```bash
npm ci
npm run build
NODE_ENV=production npm start   # listens on port 3000; run it under systemd or pm2
```

Use the same reverse-proxy setup as above.

## Checklist after deploying

- `https://your-domain/api/seed` returns **404** (seeding is disabled in production).
- `curl -sI https://your-domain/` shows `Content-Security-Policy`, `X-Frame-Options: DENY`,
  `X-Content-Type-Options: nosniff` and `Strict-Transport-Security`.
- Sign-up emails arrive; `/forgot-password` sends a code.
- With SSLCommerz: a sandbox payment ends on `/orders?session=success` and the order shows *paid*.
