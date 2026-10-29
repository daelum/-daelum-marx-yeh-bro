# Yeh Bro

Australia-first, faceless, evidence-first natural-lifter affiliate site (Astro).

## Stack

- Astro + MDX content collections
- Affiliate redirects: `/go/[slug]` ← `src/data/affiliates.ts`
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
- Disclosures on commercial pages; no AAS / SARMs / cycle funnels
- Brand tokens: see Context `docs/yeh-bro-brand-kit.md`

## Deploy (Cloudflare Pages)

- Build: `npm run build`
- Output: `dist`
- Node: 22+
- Production branch: `main` (after merge)
