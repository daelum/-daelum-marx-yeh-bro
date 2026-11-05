#!/usr/bin/env node
/**
 * Yeh Bro editorial quality gate.
 * Flags missing required fields / honesty risks. Never invents content to fix them.
 *
 * Usage: node scripts/editorial-quality-gate.mjs
 * Exit 1 on hard errors (missing title/description/pubDate, scheduled without scheduledFor).
 */
import fs from 'node:fs';
import path from 'node:path';

const ROOT = path.resolve(path.dirname(new URL(import.meta.url).pathname), '..');
const BLOG = path.join(ROOT, 'src/content/blog');

const REQUIRED_PUBLIC = ['title', 'description', 'pubDate', 'status', 'contentType'];

function parseFrontmatter(raw) {
	if (!raw.startsWith('---')) return { fm: {}, body: raw };
	const end = raw.indexOf('\n---', 3);
	if (end === -1) return { fm: {}, body: raw };
	const block = raw.slice(3, end).trim();
	const body = raw.slice(end + 4);
	/** @type {Record<string, string>} */
	const fm = {};
	for (const line of block.split('\n')) {
		if (!line.trim() || line.trim().startsWith('#')) continue;
		const idx = line.indexOf(':');
		if (idx === -1) continue;
		const key = line.slice(0, idx).trim();
		let val = line.slice(idx + 1).trim();
		if (
			(val.startsWith("'") && val.endsWith("'")) ||
			(val.startsWith('"') && val.endsWith('"'))
		) {
			val = val.slice(1, -1);
		}
		fm[key] = val;
	}
	return { fm, body };
}

function walk(dir) {
	/** @type {string[]} */
	const out = [];
	for (const ent of fs.readdirSync(dir, { withFileTypes: true })) {
		const p = path.join(dir, ent.name);
		if (ent.isDirectory()) out.push(...walk(p));
		else if (/\.(md|mdx)$/.test(ent.name)) out.push(p);
	}
	return out;
}

const files = walk(BLOG);
let errors = 0;
let warnings = 0;

console.log(`Editorial quality gate — ${files.length} files\n`);

for (const file of files) {
	const rel = path.relative(ROOT, file);
	const raw = fs.readFileSync(file, 'utf8');
	const { fm, body } = parseFrontmatter(raw);
	const isFixture = rel.includes(`${path.sep}_fixtures${path.sep}`);
	const status = fm.status || 'published';

	for (const key of REQUIRED_PUBLIC) {
		if (!fm[key] && !(key === 'status' || key === 'contentType')) {
			console.error(`ERROR  ${rel}: missing ${key}`);
			errors++;
		}
	}

	if (status === 'scheduled' && !fm.scheduledFor) {
		console.error(`ERROR  ${rel}: scheduled without scheduledFor`);
		errors++;
	}

	if (fm.updatedDate && fm.pubDate && fm.updatedDate === fm.pubDate && !isFixture) {
		console.warn(`WARN   ${rel}: updatedDate == pubDate (omit until real edit)`);
		warnings++;
	}

	if (['published', 'scheduled'].includes(status) && !isFixture) {
		if (!fm.pillar) {
			console.warn(`WARN   ${rel}: missing pillar`);
			warnings++;
		}
		if (!fm.category) {
			console.warn(`WARN   ${rel}: missing category`);
			warnings++;
		}
		if (!fm.primaryKeyword) {
			console.warn(`WARN   ${rel}: missing primaryKeyword`);
			warnings++;
		}
	}

	if (fm.contentType === 'technical' && !/references:/.test(raw.split('---')[1] || '')) {
		console.warn(
			`WARN   ${rel}: technical without references[] — qualify claims; do not invent citations`,
		);
		warnings++;
	}

	const words = body.split(/\s+/).filter(Boolean).length;
	if (fm.contentType === 'guide' && words < 280 && !isFixture && status === 'published') {
		console.warn(`WARN   ${rel}: guide body ~${words} words (thin)`);
		warnings++;
	}

	// Honesty: refuse obvious fake-author patterns in body
	if (/\bDr\.\s+[A-Z][a-z]+ [A-Z][a-z]+, PhD\b/.test(body) && !/fixture/i.test(rel)) {
		console.warn(`WARN   ${rel}: possible invented credential pattern — verify`);
		warnings++;
	}
}

console.log(`\nDone. errors=${errors} warnings=${warnings}`);
if (errors > 0) process.exit(1);
