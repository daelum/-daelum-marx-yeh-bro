# Yeh Bro

Australia-first, faceless, evidence-first natural-lifter affiliate site (Astro).

**Production URL:** https://yehbro.com (AU-first market; `.com` is the primary domain.)

## Stack

- Astro + MDX content collections (`src/content/blog/`)
- Affiliate redirects: `/go/[slug]` ← `src/data/affiliates.ts` (UTM passthrough; canonical phase-1 slugs only)
- Static build → Cloudflare Pages (`dist/`)

## Commands

```sh
npm install
npm run dev
npm run build
```

## Conventions

- Authors link products as `/go/{product}-{brand}` only — never raw network URLs
- Seed: Context `docs/affiliate/affiliates-ts-seed.md` + `go-slug-map.md`; deprecated aliases in `slug-changelog.md` are **not** wired
- Inbound `utm_*` on `/go/` are forwarded to the retailer URL
- Disclosures on commercial pages; no AAS / SARMs / cycle funnels
- Brand tokens: Context `docs/yeh-bro-brand-kit.md`

## Cloudflare Pages

See **[MERGE.md](./MERGE.md)** for merge → deploy. Short form:

1. Connect git `daelum-marx/yeh-bro` · production branch `main`
2. Build `npm run build` · output `dist` · Node `22+`
3. Attach **yehbro.com** (HTTPS; apex/www choice)
4. Optional later: redirect `.com.au` → `https://yehbro.com` if registered
