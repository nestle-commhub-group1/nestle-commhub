# Technical Decision Log — Nestlé CommHub

Documents **why** architectural and implementation decisions were made.
New entries are appended at the top.

---

## Architecture — Progressive Web App (PWA)
**Date:** 11 March 2026

**What it does:** Both `retailer-portal` and `management-dashboard` are built as PWAs using Vite + `vite-plugin-pwa`.

**Why:** Retailers operate in the field on poor mobile connections in Sri Lanka. A PWA allows installation on the phone directly from the browser (no app store), supports offline use via service workers, and delivers push notifications natively — all without maintaining a separate mobile codebase. Directly satisfies NFR-1.1.

**Alternatives considered:**
- **React Native** — Rejected. Requires a separate codebase, separate build pipeline, and app store submission for each platform.
- **Regular web app** — Rejected. No offline support, no mobile home-screen install, no push notifications.

**Dependencies:** `vite-plugin-pwa` added to both `retailer-portal` and `management-dashboard`.

**Known limitations:**
- Requires HTTPS in production (Netlify or Vercel).
- PWA features (especially push notifications and install prompts) are more limited on iOS Safari compared to Android Chrome.

