/**
 * Yeh Bro editorial publishing helpers.
 * Status workflow + public visibility gates for the blog collection.
 */

import type { CollectionEntry } from 'astro:content';

export const PUBLICATION_STATUSES = [
	'draft',
	'editorial-review',
	'content-improvements',
	'seo-review',
	'approved',
	'scheduled',
	'published',
] as const;

export type PublicationStatus = (typeof PUBLICATION_STATUSES)[number];

export const CONTENT_TYPES = ['guide', 'blog', 'technical', 'opinion-culture'] as const;
export type ContentType = (typeof CONTENT_TYPES)[number];

export const CONTENT_PILLARS = ['train', 'fuel', 'recover', 'culture'] as const;
export type ContentPillar = (typeof CONTENT_PILLARS)[number];

export const EDITORIAL_ATTRIBUTION = 'Yeh Bro Editorial Team';

/** Statuses that must never appear on the live site. */
export const NON_PUBLIC_STATUSES: ReadonlySet<PublicationStatus> = new Set([
	'draft',
	'editorial-review',
	'content-improvements',
	'seo-review',
	'approved', // approved = ready queue; not live until scheduled or published
]);

export type BlogEntry = CollectionEntry<'blog'>;

/** Calendar-day equality in UTC (frontmatter dates are date-only). */
export function sameCalendarDay(a: Date, b: Date): boolean {
	return (
		a.getUTCFullYear() === b.getUTCFullYear() &&
		a.getUTCMonth() === b.getUTCMonth() &&
		a.getUTCDate() === b.getUTCDate()
	);
}

/**
 * Live visibility gate.
 * - draft → approved: never public
 * - scheduled: public only at/after scheduledFor (falls back to pubDate)
 * - published: public
 */
export function isPubliclyVisible(post: BlogEntry, now: Date = new Date()): boolean {
	const status = post.data.status ?? 'published';
	if (NON_PUBLIC_STATUSES.has(status)) return false;
	if (status === 'scheduled') {
		const gate = post.data.scheduledFor ?? post.data.pubDate;
		return gate.getTime() <= now.getTime();
	}
	return status === 'published';
}

export function getPublicPosts(posts: BlogEntry[], now: Date = new Date()): BlogEntry[] {
	return posts.filter((p) => isPubliclyVisible(p, now));
}

/** Prefer dedicated SEO fields; fall back to title/description. Never invent. */
export function resolveSeoTitle(data: BlogEntry['data']): string {
	return data.seoTitle?.trim() || data.title;
}

export function resolveSeoDescription(data: BlogEntry['data']): string {
	return data.seoDescription?.trim() || data.description;
}

export function estimateReadingMinutes(wordCount: number): number {
	return Math.max(1, Math.round(wordCount / 220));
}

export function contentTypeLabel(type: ContentType): string {
	switch (type) {
		case 'guide':
			return 'Guide';
		case 'blog':
			return 'Article';
		case 'technical':
			return 'Technical';
		case 'opinion-culture':
			return 'Culture';
	}
}

export function pillarLabel(pillar: ContentPillar): string {
	switch (pillar) {
		case 'train':
			return 'Train';
		case 'fuel':
			return 'Fuel';
		case 'recover':
			return 'Recover';
		case 'culture':
			return 'Culture';
	}
}

export interface QualityGateResult {
	ok: boolean;
	errors: string[];
	warnings: string[];
}

/**
 * Required-field / honesty gates. Flags gaps — never invents refs or credentials.
 * Call from scripts or CI; build still filters non-public statuses.
 */
export function runQualityGates(post: BlogEntry): QualityGateResult {
	const errors: string[] = [];
	const warnings: string[] = [];
	const { data, body, id } = post as BlogEntry & { body?: string };

	if (!data.title?.trim()) errors.push(`${id}: missing title`);
	if (!data.description?.trim()) errors.push(`${id}: missing description`);
	if (data.description && data.description.length > 160) {
		warnings.push(`${id}: description >160 chars (SEO meta may truncate)`);
	}
	if (!data.pubDate) errors.push(`${id}: missing pubDate`);
	if (!data.pillar) warnings.push(`${id}: missing pillar`);
	if (!data.contentType) warnings.push(`${id}: missing contentType`);
	if (!data.category) warnings.push(`${id}: missing category`);

	const status = data.status ?? 'published';
	if (status === 'scheduled' && !data.scheduledFor) {
		errors.push(`${id}: scheduled status requires scheduledFor`);
	}
	if (status === 'published' || status === 'scheduled') {
		if (!data.primaryKeyword?.trim()) {
			warnings.push(`${id}: published/scheduled without primaryKeyword`);
		}
	}

	if (data.contentType === 'technical') {
		const refs = data.references ?? [];
		if (refs.length === 0) {
			warnings.push(
				`${id}: technical piece has no references[] — qualify claims in prose; do not invent citations`,
			);
		}
	}

	if (data.enhancedEducation && data.contentType === 'blog') {
		warnings.push(`${id}: enhancedEducation on blog type — prefer technical or opinion-culture`);
	}

	if (data.updatedDate && sameCalendarDay(data.updatedDate, data.pubDate)) {
		warnings.push(`${id}: updatedDate same calendar day as pubDate — omit updatedDate until a real edit`);
	}

	const text = typeof body === 'string' ? body : '';
	if (text) {
		const words = text.split(/\s+/).filter(Boolean).length;
		if (words < 280 && data.contentType === 'guide') {
			warnings.push(`${id}: guide body under ~280 words`);
		}
	}

	return { ok: errors.length === 0, errors, warnings };
}
