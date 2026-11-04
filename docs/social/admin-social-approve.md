# Instagram approve desk — `/admin/social`

Private founder UI on **yehbro.com** for reviewing Holyfield-style singles + carousels, approving/rejecting, and triggering post-to-Instagram — without reviewing only in chat.

**URL:** `https://yehbro.com/admin/social`  
**Account:** `@theyehbro`  
**Not** linked in public nav · `noindex` · `robots.txt` disallows `/admin/`

---

## Founder how-to

1. **Deploy must include the Worker** (`main` = compiled `functions/` → `dist-worker/`). If Settings says *“Variables cannot be added to a Worker that only has static assets”*, the last deploy was assets-only — merge/deploy the Worker Functions fix first, then retry.
2. **Set the password secret** in Cloudflare → your yehbro Worker/Pages project → **Settings → Variables and secrets** (Production + Preview):
   - Name: `ADMIN_SOCIAL_PASSWORD`
   - Type: **Secret**
   - Value: a strong password only you know (never paste into chat, git, or this doc)
3. Create bindings (once):
   - **KV** namespace → binding name **`IG_QUEUE`**
   - **R2** bucket (e.g. `yehbro-ig-queue`) → binding name **`IG_MEDIA`**
   - Update `wrangler.toml` placeholder IDs after creation (or bind in the dashboard)
4. Optional: set secret **`ZERNIO_API_KEY`** (same key the agent uses) so **Post approved** can publish from the desk. If unset, the desk still marks the batch synced and tells you to ask the agent to post.
5. Redeploy after secrets/bindings change (`npm run deploy` / Workers Builds).
6. Open `https://yehbro.com/admin/social`, enter the password, pick a day, approve/reject, then **Post approved**.

If `ADMIN_SOCIAL_PASSWORD` is **unset**, the page shows setup instructions only — it does **not** leave the desk open.

---

## Approve flow

| Step | Action |
|------|--------|
| 1 | IG agent generates a day folder (`30` singles + `5` carousels) under the Project store queue |
| 2 | Agent (or you) runs `scripts/sync-ig-queue-to-cf.py --day-dir …` to push PNGs → R2 and manifest JSON → KV |
| 3 | Open `/admin/social`, log in, select the day |
| 4 | Review singles (grid) + carousels (slide strip); **Approve** / **Reject** |
| 5 | Optional: **Approve all pending** / **Reject selected** |
| 6 | **Post approved** → Zernio publish when `ZERNIO_API_KEY` is on Pages; otherwise “synced — ask agent to post” |

Statuses: `pending` · `approved` · `rejected` · `posted` · `failed`

---

## Cloudflare secrets & bindings

| Name | Kind | Required | Purpose |
|------|------|----------|---------|
| `ADMIN_SOCIAL_PASSWORD` | Worker **secret** | Yes | Login gate (HttpOnly session cookie) |
| `ZERNIO_API_KEY` | Worker **secret** | No | Post-from-admin via Zernio to `@theyehbro` |
| `ADMIN_SOCIAL_FIXTURE` | Env var `"1"` | No | Force fixture sample data |
| `IG_QUEUE` | KV binding | Yes (prod) | Per-day manifest/status JSON |
| `IG_MEDIA` | R2 binding | Yes (prod) | PNG bytes (never in `public/`) |

Media is served only through the authenticated proxy: `/admin/social/media/{date}/{file}`.

---

## Sync script (IG agent)

After generating a batch:

```bash
python3 scripts/sync-ig-queue-to-cf.py \
  --day-dir /path/to/docs/social/instagram-tweet-queue/YYYY-MM-DD \
  --dry-run

python3 scripts/sync-ig-queue-to-cf.py \
  --day-dir /path/to/docs/social/instagram-tweet-queue/YYYY-MM-DD
```

Wrapper: `scripts/sync-ig-queue-to-cf.sh`  
Needs authenticated `wrangler` (or `CF_KV_NAMESPACE_ID` / `CF_R2_BUCKET` env — never commit values).

KV keys: `day:YYYY-MM-DD`, `index:days`  
R2 keys: `YYYY-MM-DD/01.png`, `YYYY-MM-DD/c01-1.png`, …

---

## Local demo (no CF credentials)

```bash
npm run build
# Static UI only:
npm run preview
# Then open /admin/social?fixture=1
```

Or with the Worker + assets (when wrangler + stubs are configured):

```bash
npm run pages:dev
# Set ADMIN_SOCIAL_PASSWORD in .dev.vars (gitignored)
```

Create `.dev.vars` locally (gitignored) with `ADMIN_SOCIAL_PASSWORD=…` — never commit it. Without KV/R2 bindings, Functions auto-enter **fixture mode**.

---

## Related

- Agent post-after-approve playbook: Project store `docs/social/zernio-post-after-approve.md`
- Zernio setup: Project store `docs/social/zernio-setup.md`
- Queue folders: Project store `docs/social/instagram-tweet-queue/YYYY-MM-DD/`

Australia-first brand ops · no “faceless” copy · no AAS sourcing.
