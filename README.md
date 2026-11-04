# Yeh Bro

Australia-first bodybuilding / lifting education site (Astro) — evidence-first guides, legal sports-nutrition affiliates, PED harm-reduction education without selling gear.

**Production URL:** https://yehbro.com (AU-first market; `.com` is the primary domain.)

## Stack

- Astro + MDX content collections (`src/content/blog/`)
- Affiliate redirects: `/go/[slug]` ← `src/data/affiliates.ts` (UTM passthrough; canonical phase-1 slugs only)
- Static Astro SSG (`dist/`) + Cloudflare Worker for `/admin/social` Functions (`dist-worker/`)

## Commands

```sh
npm install
npm run dev
npm run build          # astro build + compile Pages Functions → Worker
npm run pages:dev      # local Worker + assets (needs wrangler)
npm run deploy         # build + wrangler deploy (CI / founder)
```

## Conventions

- Authors link products as `/go/{product}-{brand}` only — never raw network URLs
- Seed: Context `docs/affiliate/affiliates-ts-seed.md` + `go-slug-map.md`; deprecated aliases in `slug-changelog.md` are **not** wired
- Inbound `utm_*` on `/go/` are forwarded to the retailer URL
- Disclosures on commercial pages; never sell/source illegal AAS / SARMs / peptides / grey gear (educate ≠ storefront)
- Brand tokens: Context `docs/yeh-bro-brand-kit.md`

## Cloudflare Workers (+ static assets)

See **[MERGE.md](./MERGE.md)** for merge → deploy. Short form:

1. Connect git `daelum-marx/yeh-bro` · production branch `main` (Workers Builds)
2. **Build:** `npm run build` · **Deploy:** `npx wrangler deploy` · Node `22+`
3. `wrangler.toml` sets `assets.directory = dist` and `main = dist-worker/index.js` (admin Functions)
4. After deploy, Settings → Variables and secrets unlocks (project is no longer assets-only)
5. Attach **yehbro.com** (HTTPS; apex/www choice)
6. Optional later: redirect `.com.au` → `https://yehbro.com` if registered
