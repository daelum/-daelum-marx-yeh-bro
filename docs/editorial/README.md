# Yeh Bro editorial publishing

Permanent ops for guides and articles. Companion briefs live in the Project store:

- `docs/yehbro-editorial-content-audit.md`
- `docs/yehbro-editorial-publishing-standard.md`

## Workflow statuses

`draft` → `editorial-review` → `content-improvements` → `seo-review` → `approved` → `scheduled` | `published`

| Status | Public? |
|---|---|
| draft … approved | **No** |
| scheduled | Only at/after `scheduledFor` |
| published | Yes |

Edits preserve `pubDate`. Set `updatedDate` only when the piece actually changes. Never fabricate historical dates.

## Content types

Templates in `docs/editorial/templates/`:

- `guide.mdx` — comprehensive educational
- `blog.mdx` — standard editorial article
- `technical.mdx` — evidence + limitations + real refs only
- `opinion-culture.mdx` — culture / opinion; mark opinion vs fact

Copy a template into `src/content/blog/<slug>.mdx`, fill frontmatter, keep `status: draft` until ready.

## Attribution

Always **Yeh Bro Editorial Team** unless the founder explicitly sets otherwise. No invented credentials.

## Quality gate

```bash
node scripts/editorial-quality-gate.mjs
```

Flags missing required fields and honesty risks. **Never invent references** to silence warnings.

## Fixtures

`src/content/blog/_fixtures/` holds draft/scheduled samples for visibility tests. They stay non-public by status.
