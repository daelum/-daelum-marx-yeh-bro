# Yeh Bro editorial standards (quick reference)

## Voice

Knowledgeable, direct, confident, approachable. Masculine without cartoon. Evidence-conscious. Practical. Occasional humour.

**Avoid:** unlock potential, fitness journey, today’s fitness landscape, it’s important to understand, whether beginner or experienced (as default opener), grind-bro clichés (beast mode, no excuses, built different).

## Honesty

- No invented references, authors, credentials, testimonials, or fake publish dates.
- Preserve `pubDate`. Set `updatedDate` only after a real revision.
- Qualify evidence: established / emerging / limited / opinion / anecdote.
- PED content = harm-reduction education only. No sourcing. No dosing advice.
- Flag missing fields via `npm run editorial:gate` — never invent content to silence warnings.

## Types

| Type | Use |
|---|---|
| `guide` | Comprehensive how-to / hub |
| `blog` | Shorter editorial |
| `technical` | Mechanisms, dosing maths, labs — real refs only |
| `opinion-culture` | Culture / PED literacy / standards |

## Status gate

`draft` → `editorial-review` → `content-improvements` → `seo-review` → `approved` → `scheduled` \| `published`

Public only for `published`, or `scheduled` at/after `scheduledFor`.

## Attribution

`Yeh Bro Editorial Team` — no personal credential theatre.

## Discovery

Cluster + related slugs + recently published. No fake “popular” rankings.
