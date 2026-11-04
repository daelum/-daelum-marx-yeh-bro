# Merge PR #1 → production

Production URL: **https://yehbro.com** (AU-first market; `.com` is primary).

## 1. Merge

1. Review [PR #1](https://cursor.com/codebase/daelum-marx/yeh-bro/pull/1) on `feat/site-mvp`.
2. Confirm CI / `npm run build` green.
3. Merge into `main` (squash or merge commit — team preference).

## 2. Cloudflare Workers (+ static assets)

The public site stays Astro SSG. `/admin/social` APIs need a real Worker script so secrets/KV/R2 work.

1. Workers & Pages → open (or create) the **yeh-bro** Worker · connect Origin/git `daelum-marx/yeh-bro`.
2. **Production branch:** `main`
3. **Build command:** `npm run build` · **Deploy command:** `npx wrangler deploy` · **Node:** `22+`  
   (`npm run build` = `astro build` + `wrangler pages functions build` → `dist-worker/`)
4. Confirm Settings no longer says “static assets only” — Variables and secrets / Bindings are editable.
5. Custom domain: **yehbro.com** (and `www` if used) → force HTTPS; pick apex ↔ www once.
6. Optional: redirect any future `.com.au` to `https://yehbro.com` when that domain is owned.
7. Preview deploys on PRs when available.

## 3. Post-merge checks

- [ ] Homepage + `/start-here` load on yehbro.com
- [ ] Canonicals / sitemap host = `yehbro.com`
- [ ] `/go/*` returns hop pages with `noindex`; unknown slug → 404
- [ ] Disclosure + Privacy contact email reachable
- [ ] Affiliate TODO URLs still stub — do not treat as live commerce until Ops pastes real links

## Blockers (not code)

- Live affiliate deep links still TODO in `src/data/affiliates.ts`
- Beehiiv / Plausible not wired
- Human gates: Cloudflare account, DNS for yehbro.com, affiliate approvals
