# Yeh Bro

Australia-first, faceless, evidence-first natural-lifter affiliate site (Astro).

## Stack

- Astro + MDX content collections (`src/content/blog/`)
- Affiliate redirects: `/go/[slug]` ← `src/data/affiliates.ts` (UTM passthrough on hop)
- Static build → Cloudflare Pages (`dist/`)

## Commands

```sh
npm install
npm run dev
npm run build
```

## Conventions

- Authors link products as `/go/{product}-{brand}` only — never raw network URLs
- Seed slugs live in `src/data/affiliates.ts` (TODO placeholder destinations until approvals)
- Inbound `utm_source|medium|campaign|content|term` on `/go/` are forwarded to the retailer URL
- Disclosures on commercial pages; no AAS / SARMs / cycle funnels
- Brand tokens: Context `docs/yeh-bro-brand-kit.md`
- SEO drafts land in Context `docs/content/` → port to MDX here

## Cloudflare Pages

Mirror of the Context handoff (`docs/yeh-bro-site-handoff.md`):

1. Cloudflare → **Workers & Pages** → Create → connect git repo `daelum-marx/yeh-bro`.
2. **Production branch:** `main` (merge PR first; or preview on `feat/site-mvp`).
3. **Build settings:**
   - Framework: Astro (or None)
   - Build command: `npm run build`
   - Output directory: `dist`
   - Node version: `22` (or `>=22.23.4` per `package.json` `engines`)
4. After first deploy: attach `yehbro.com.au` (and `.com` redirect), force HTTPS, pick apex ↔ `www`.
5. Enable preview deployments on PRs when available.
6. `/go/*` is `noindex` + listed in `public/robots.txt` Disallow; unknown slugs 404 (not prerendered).
7. Later: real affiliate destinations in `affiliates.ts`, Plausible, Beehiiv — see `yeh-bro-website-mvp.md`.
