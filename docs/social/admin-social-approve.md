# Instagram approve desk — `/admin/social`

Private founder UI on **yehbro.com** for reviewing Holyfield-style singles + carousels, approving/rejecting, and posting to Instagram — without reviewing only in chat.

**URL:** `https://yehbro.com/admin/social`  
**Account:** `@theyehbro`  
**Not** linked in public nav · `noindex` · `robots.txt` disallows `/admin/`

**Founder rule:** **Approve = live on IG for that one item only.** There is **no Approve all** / bulk post from the desk.

---

## Founder how-to

1. **Deploy must include the Worker** (`main` = compiled `functions/` → `dist-worker/`). If Settings says *“Variables cannot be added to a Worker that only has static assets”*, the last deploy was assets-only — merge/deploy the Worker Functions fix first, then retry.
2. **Set the password secret** in Cloudflare → your yehbro Worker/Pages project → **Settings → Variables and secrets** (Production + Preview):
   - Name: `ADMIN_SOCIAL_PASSWORD`
   - Type: **Secret**
   - Value: a strong password only you know (never paste into chat, git, or this doc)
3. Create bindings (once):
   - **KV** namespace (e.g. `yehbro-ig-queue`) → binding name **`IG_QUEUE`**
   - **R2** bucket (e.g. `yehbro-ig-media`) → binding name **`IG_MEDIA`**
   - Update `wrangler.toml` placeholder IDs after creation (or bind in the dashboard)
4. Set secret **`ZERNIO_API_KEY`** (same key the agent uses) so **Approve & post** publishes from the desk to `@theyehbro`. If unset, Approve still marks `approved` and tells you to ask the agent to post.
5. Redeploy after secrets/bindings change (`npm run deploy` / Workers Builds).
6. Open `https://yehbro.com/admin/social`, enter the password, pick a day, then **Approve & post** on **one** item at a time.
7. Keep the **refill pool** topped up (see below) so Reject always pulls a replacement onto the bottom of the queue.

If `ADMIN_SOCIAL_PASSWORD` is **unset**, the page shows setup instructions only — it does **not** leave the desk open.

---

## Approve flow

| Step | Action |
|------|--------|
| 1 | IG agent generates a day folder (`30` singles + `5` carousels) under the Project store queue |
| 2 | Agent (or you) runs `scripts/sync-ig-queue-to-cf.py --day-dir …` to push PNGs → R2 and manifest JSON → KV |
| 3 | Open `/admin/social`, log in, select the day |
| 4 | Review singles (grid) + carousels (swipe / filmstrip / narrative `1/N`) |
| 5 | **Approve & post** on **one** item → status `approved`, then Zernio publish → `posted` on success |
| 6 | **Reject** on one item → `rejected`, then **append** next refill-pool item at bottom (`pending`) |
| 7 | On publish failure → `failed` with UI error; use **Retry post** on that same item |

There is **no** “Approve all pending”, “Post approved”, or other one-click multi-post control. Double-submit is disabled while a post is in flight.

Statuses: `pending` · `approved` · `rejected` · `posted` · `failed`

---

## Reject → refill (constant supply)

Reject never posts. After marking an item `rejected`, the Worker:

1. Pops the next item from KV **`pool:refill`**
2. Assigns a new id (`R01…` singles, `RC01…` carousels) and **appends** it at the **bottom** of the current day queue as `pending`
3. Writes the day + remaining pool back to KV

If the pool is empty: reject still works; desk banner shows **“Refill pool empty — generating more”** and KV flag **`refill:needed`** is set to `1`.

### IG agent — top up the pool

```bash
# Preview
python3 scripts/sync-ig-queue-to-cf.py \
  --day-dir /path/to/docs/social/instagram-tweet-queue/pool-batch \
  --pool --dry-run

# Replace pool contents
python3 scripts/sync-ig-queue-to-cf.py \
  --day-dir /path/to/docs/social/instagram-tweet-queue/pool-batch \
  --pool

# Append more items without wiping remaining pool
python3 scripts/sync-ig-queue-to-cf.py \
  --day-dir /path/to/docs/social/instagram-tweet-queue/pool-batch \
  --pool --append
```

Pool media lands in R2 under `pool/…`. A successful non-empty pool sync clears `refill:needed`.

---

## Carousels on the desk

Carousels are **long-form narrative arcs** (slide-to-slide), not disconnected one-liners.

Desk UI for each carousel:

- Swipe / Prev–Next / dots
- **`1/N` counter**
- **Filmstrip** of every slide (click to jump) — slides 2+ load eagerly so they are not blank
- Narrative list of slide copy under the viewer

---

## Cloudflare secrets & bindings

| Name | Kind | Required | Purpose |
|------|------|----------|---------|
| `ADMIN_SOCIAL_PASSWORD` | Worker **secret** | Yes | Login gate (HttpOnly session cookie) |
| `ZERNIO_API_KEY` | Worker **secret** | Yes (for live IG) | Approve & post via Zernio to `@theyehbro` |
| `ADMIN_SOCIAL_FIXTURE` | Env var `"1"` | No | Force fixture sample data (opt-in only) |
| `IG_QUEUE` | KV binding | Yes (prod) | Per-day manifest/status JSON + `pool:refill` / `refill:needed` |
| `IG_MEDIA` | R2 binding | Yes (prod) | PNG bytes (never in `public/`) |

**Bindings must be declared in `wrangler.toml`** (`[[kv_namespaces]]` / `[[r2_buckets]]`). If they are missing from the Worker env, the desk shows a bindings-required error — it does **not** silently fall back to the 7-item fixture sample. Fixture is only via `?fixture=1` or `ADMIN_SOCIAL_FIXTURE=1`.

Media is served only through the authenticated proxy: `/admin/social/media/{date}/{file}` (session cookie; UI fetches with credentials → blob preview). Pool media uses `/admin/social/media/pool/…`.

Never log secrets.

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

Typical bindings (names may vary by account; resolve via dashboard/API if placeholders):
- KV namespace title ≈ `yehbro-ig-queue` → binding **`IG_QUEUE`**
- R2 bucket ≈ `yehbro-ig-media` → binding **`IG_MEDIA`**

Day folders are usually `YYYY-MM-DD`. Intro/packs may use a slug folder (e.g. `intro-yeh-bro`) or `--day-key intro-yeh-bro`.

KV keys: `day:{dayKey}`, `index:days`, `pool:refill`, `refill:needed`  
R2 keys: `{dayKey}/01.png`, `{dayKey}/c01-1.png`, `pool/…`

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

Create `.dev.vars` locally (gitignored) with `ADMIN_SOCIAL_PASSWORD=…` — never commit it. Without KV/R2 bindings the live desk shows **bindings required** (use `?fixture=1` for a local sample).

---

## Related

- Agent post-after-approve playbook: Project store `docs/social/zernio-post-after-approve.md`
- Zernio setup: Project store `docs/social/zernio-setup.md`
- Queue folders: Project store `docs/social/instagram-tweet-queue/YYYY-MM-DD/`

Australia-first brand ops · no “faceless” copy · no AAS sourcing.
