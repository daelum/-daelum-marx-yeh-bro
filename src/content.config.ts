import { defineCollection } from 'astro:content';
import { glob } from 'astro/loaders';
import { z } from 'astro/zod';

/**
 * Publication workflow (founder standard):
 * draft → editorial-review → content-improvements → seo-review → approved → scheduled | published
 *
 * Public only when status is `published`, or `scheduled` and now >= scheduledFor.
 * `approved` is the ready queue — not live yet (hard to accidentally publish).
 */
const publicationStatus = z.enum([
	'draft',
	'editorial-review',
	'content-improvements',
	'seo-review',
	'approved',
	'scheduled',
	'published',
]);

const contentType = z.enum(['guide', 'blog', 'technical', 'opinion-culture']);

const contentPillar = z.enum(['train', 'fuel', 'recover', 'culture']);

const referenceSchema = z.object({
	label: z.string(),
	/** Optional URL — omit rather than invent. */
	url: z.string().url().optional(),
	note: z.string().optional(),
});

const blog = defineCollection({
	loader: glob({ base: './src/content/blog', pattern: '**/*.{md,mdx}' }),
	schema: ({ image }) =>
		z.object({
			title: z.string(),
			description: z.string(),
			/** Original publication date — preserve on edits; never fabricate history. */
			pubDate: z.coerce.date(),
			/** Set only when the piece was meaningfully revised after pubDate. */
			updatedDate: z.coerce.date().optional(),
			/** For status=scheduled: go-live instant. Not public before this. */
			scheduledFor: z.coerce.date().optional(),
			heroImage: z.optional(image()),
			/** Optional post eyebrow override (else derived from type + pillar). */
			eyebrow: z.string().optional(),
			/**
			 * When true, BlogPost renders the strong enhanced/PED education disclaimer
			 * (medical + legal + no gear sourcing + culture-pattern dosing fence).
			 */
			enhancedEducation: z.boolean().optional(),

			/** Workflow status. Existing live posts default to published. */
			status: publicationStatus.default('published'),
			/** Template family. */
			contentType: contentType.default('guide'),
			/** Site IA pillar. */
			pillar: contentPillar.optional(),
			/** Cluster / subcategory id (e.g. creatine, food, culture). */
			category: z.string().optional(),
			subcategory: z.string().optional(),
			/** Brand attribution — never invent personal credentials. */
			attribution: z.string().default('Yeh Bro Editorial Team'),
			/** SEO overrides — omit to use title / description. */
			seoTitle: z.string().optional(),
			seoDescription: z.string().optional(),
			primaryKeyword: z.string().optional(),
			secondaryKeywords: z.array(z.string()).optional(),
			/** Explicit related slugs; RelatedGuides falls back to cluster. */
			relatedSlugs: z.array(z.string()).optional(),
			/**
			 * Real references only. Empty/omitted is fine — do not invent studies.
			 * Prefer qualifying evidence in prose when no citation exists.
			 */
			references: z.array(referenceSchema).optional(),
			/**
			 * Evergreen guides: de-emphasize calendar dates in chrome when true.
			 * Still preserve pubDate/updatedDate in metadata + JSON-LD.
			 */
			evergreen: z.boolean().optional(),
		}),
});

export const collections = { blog };
