#!/usr/bin/env python3
"""One-shot migration: dates + publishing metadata on all blog MDX.

- Align pubDate to git first-commit when FM was backdated (no fake history)
- Strip same-day updatedDate
- Add status/contentType/pillar/category/attribution/evergreen/primaryKeyword
- Skip _fixtures
"""
from __future__ import annotations

import re
import subprocess
from pathlib import Path

ROOT = Path(__file__).resolve().parents[1]
BLOG = ROOT / "src/content/blog"

CLUSTER_PILLAR = {
    "training": "train",
    "food": "fuel",
    "recovery": "recover",
    "creatine": "fuel",
    "protein": "fuel",
    "pre": "fuel",
    "stack": "fuel",
    "basics": "fuel",
    "blueprint": "culture",
    "culture": "culture",
}

# slug -> cluster from guide-clusters.ts
clusters_src = (ROOT / "src/data/guide-clusters.ts").read_text()
slug_cluster: dict[str, str] = {}
for m in re.finditer(r"id:\s*'(\w+)'.*?slugs:\s*\[(.*?)\]", clusters_src, re.S):
    cid = m.group(1)
    for s in re.findall(r"'([a-z0-9-]+)'", m.group(2)):
        slug_cluster[s] = cid

TECHNICAL_SLUGS = {
    "bloodwork-for-lifters",
    "ped-bloodwork-literacy",
    "oral-aas-liver-risk-literacy",
    "peptide-literacy-harm-reduction",
    "fertility-aas-clinician-questions",
    "ped-coming-off-under-care",
    "how-to-dose-creatine",
    "creatine-loading-phase",
    "creatine-monohydrate-vs-hcl",
    "creapure-vs-generic-creatine",
    "caffeine-dose-training",
    "beta-alanine-tingles",
    "protein-targets-for-lifters",
    "estimate-maintenance-calories",
    "dietary-fat-floors-for-lifters",
    "what-i-run-beside-testosterone",
    "trt-culture-literacy-vs-aas",
}

CULTURE_SLUGS = {
    "ped-harm-reduction-australia",
    "bodybuilding-culture-education",
    "natty-or-not-physique-standards",
    "online-coach-red-flags",
    "when-to-hire-in-person-coach",
    "ego-lifting-vs-training-age",
    "enhanced-influencer-media-literacy",
    "body-dysmorphia-adjacency-gym-culture",
    "photo-lighting-honesty-for-lifters",
    "contest-prep-culture-vs-health",
    "comment-section-ped-debate-detox",
    "gym-etiquette-without-gatekeeping",
    "research-chem-marketing-tells",
    "forum-cycle-lore-vs-clinical-care",
    "bodybuilding-blueprint",
    "bodybuilding-blueprint-phase-1-cut",
    "bodybuilding-blueprint-phase-2-health-pivot",
    "bodybuilding-blueprint-phase-3-lean-bulk",
    "bodybuilding-blueprint-safety",
}

BLOG_SLUGS = {
    "yeh-bro-current-picks",
    "amazon-au-vs-supplement-shops",
}


def git_first(path: Path) -> str | None:
    try:
        out = subprocess.check_output(
            ["git", "log", "--diff-filter=A", "--follow", "--format=%cs", "-1", "--", str(path)],
            cwd=ROOT,
            text=True,
        ).strip()
        return out or None
    except subprocess.CalledProcessError:
        return None


def parse_fm(raw: str) -> tuple[dict[str, str], str, str]:
    if not raw.startswith("---"):
        return {}, "", raw
    end = raw.find("\n---", 3)
    if end == -1:
        return {}, "", raw
    block = raw[3:end].strip("\n")
    body = raw[end + 4 :]
    if body.startswith("\n"):
        body = body[1:]
    fm: dict[str, str] = {}
    order: list[str] = []
    for line in block.splitlines():
        if not line.strip() or line.strip().startswith("#"):
            continue
        if ":" not in line:
            continue
        k, v = line.split(":", 1)
        k = k.strip()
        fm[k] = v.strip()
        order.append(k)
    return fm, block, body


def q(s: str) -> str:
    if s.startswith("'") or s.startswith('"'):
        return s
    if any(c in s for c in ":#{}[]&*?|-<>=!%@`"):
        return "'" + s.replace("'", "''") + "'"
    return f"'{s}'" if " " in s or not s else s


def content_type(slug: str, enhanced: bool) -> str:
    if slug in TECHNICAL_SLUGS:
        return "technical"
    if slug in CULTURE_SLUGS or enhanced:
        return "opinion-culture"
    if slug in BLOG_SLUGS:
        return "blog"
    return "guide"


def primary_keyword(title: str) -> str:
    t = title.strip("'\"")
    # crude but stable keyword from title
    return t.split(":")[0].strip().lower()[:80]


def rebuild(fm: dict[str, str], slug: str) -> str:
    # ordered keys for readability
    keys = [
        "title",
        "description",
        "pubDate",
        "updatedDate",
        "scheduledFor",
        "status",
        "contentType",
        "pillar",
        "category",
        "subcategory",
        "eyebrow",
        "attribution",
        "enhancedEducation",
        "evergreen",
        "primaryKeyword",
        "secondaryKeywords",
        "seoTitle",
        "seoDescription",
        "relatedSlugs",
        "references",
        "heroImage",
    ]
    lines = ["---"]
    seen = set()
    for k in keys:
        if k not in fm:
            continue
        lines.append(f"{k}: {fm[k]}")
        seen.add(k)
    for k, v in fm.items():
        if k not in seen:
            lines.append(f"{k}: {v}")
    lines.append("---")
    return "\n".join(lines) + "\n"


changed = 0
for path in sorted(BLOG.rglob("*.mdx")):
    if "_fixtures" in path.parts:
        continue
    slug = path.stem
    raw = path.read_text(encoding="utf-8")
    fm, _block, body = parse_fm(raw)
    if not fm.get("title"):
        print(f"skip (no title): {path}")
        continue

    cluster = slug_cluster.get(slug, "")
    pillar = CLUSTER_PILLAR.get(cluster, "")
    enhanced = fm.get("enhancedEducation", "").lower() in ("true", "true")

    # dates
    git = git_first(path)
    pub = fm.get("pubDate", "").strip("'\"")
    if git and pub and pub[:10] != git:
        # FM was backdated relative to first commit — use authentic git date
        fm["pubDate"] = git
        pub = git
    # strip same-day updatedDate
    upd = fm.get("updatedDate", "").strip("'\"")
    if upd and pub and upd[:10] == pub[:10]:
        fm.pop("updatedDate", None)

    fm["status"] = fm.get("status") or "published"
    fm["contentType"] = fm.get("contentType") or content_type(slug, enhanced)
    if pillar:
        fm["pillar"] = fm.get("pillar") or pillar
    if cluster:
        fm["category"] = fm.get("category") or cluster
    fm["attribution"] = fm.get("attribution") or "'Yeh Bro Editorial Team'"
    if "evergreen" not in fm:
        # most educational pieces are evergreen
        fm["evergreen"] = "true" if fm["contentType"] != "blog" else "false"
    if "primaryKeyword" not in fm:
        fm["primaryKeyword"] = q(primary_keyword(fm["title"]))

    # normalize eyebrows toward pillar labels when missing
    if not fm.get("eyebrow"):
        type_label = {
            "guide": "Guide",
            "blog": "Article",
            "technical": "Technical",
            "opinion-culture": "Culture",
        }.get(fm["contentType"].strip("'\""), "Guide")
        pillar_label = {"train": "Train", "fuel": "Fuel", "recover": "Recover", "culture": "Culture"}.get(
            pillar, ""
        )
        if pillar_label:
            fm["eyebrow"] = q(f"{type_label} · {pillar_label}")

    new = rebuild(fm, slug) + "\n" + body.lstrip("\n")
    if not new.endswith("\n"):
        new += "\n"
    if new != raw:
        path.write_text(new, encoding="utf-8")
        changed += 1
        print(f"updated {slug}")

print(f"\nDone. changed={changed}")
