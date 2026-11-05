#!/usr/bin/env node
/**
 * Assert draft + future-scheduled fixtures never resolve as public.
 * Mirrors src/lib/editorial.ts gates without importing Astro.
 */
import fs from 'node:fs';
import path from 'node:path';

const ROOT = path.resolve(path.dirname(new URL(import.meta.url).pathname), '..');
const FIX = path.join(ROOT, 'src/content/blog/_fixtures');

const NON_PUBLIC = new Set([
	'draft',
	'editorial-review',
	'content-improvements',
	'seo-review',
	'approved',
]);

function parseFm(raw) {
	const end = raw.indexOf('\n---', 3);
	const block = raw.slice(3, end);
	/** @type {Record<string, string>} */
	const fm = {};
	for (const line of block.split('\n')) {
		const i = line.indexOf(':');
		if (i === -1) continue;
		fm[line.slice(0, i).trim()] = line.slice(i + 1).trim().replace(/^['"]|['"]$/g, '');
	}
	return fm;
}

function isPublic(fm, now = new Date()) {
	const status = fm.status || 'published';
	if (NON_PUBLIC.has(status)) return false;
	if (status === 'scheduled') {
		const gate = new Date(fm.scheduledFor || fm.pubDate);
		return gate.getTime() <= now.getTime();
	}
	return status === 'published';
}

const draft = parseFm(fs.readFileSync(path.join(FIX, 'editorial-draft-visibility.mdx'), 'utf8'));
const scheduled = parseFm(
	fs.readFileSync(path.join(FIX, 'editorial-scheduled-future.mdx'), 'utf8'),
);

let failed = 0;
if (isPublic(draft)) {
	console.error('FAIL: draft fixture marked public');
	failed++;
} else {
	console.log('OK: draft fixture not public');
}

if (isPublic(scheduled, new Date('2026-11-05T12:00:00Z'))) {
	console.error('FAIL: future scheduled fixture marked public');
	failed++;
} else {
	console.log('OK: future scheduled fixture not public');
}

// date preservation: published piece keeps pubDate when updatedDate added later
const samplePath = path.join(ROOT, 'src/content/blog/best-creatine-australia.mdx');
const sample = parseFm(fs.readFileSync(samplePath, 'utf8'));
if (!sample.pubDate) {
	console.error('FAIL: sample missing pubDate');
	failed++;
} else if (sample.updatedDate && sample.updatedDate === sample.pubDate) {
	console.error('FAIL: sample has same-day updatedDate noise');
	failed++;
} else {
	console.log(`OK: date fields clean on best-creatine-australia (pubDate=${sample.pubDate})`);
}

if (!sample.attribution?.includes('Yeh Bro Editorial Team')) {
	console.error('FAIL: missing Yeh Bro Editorial Team attribution');
	failed++;
} else {
	console.log('OK: attribution present');
}

process.exit(failed ? 1 : 0);
