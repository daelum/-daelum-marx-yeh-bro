import { defineCollection } from 'astro:content';
import { glob } from 'astro/loaders';
import { z } from 'astro/zod';

const blog = defineCollection({
	// Load Markdown and MDX files in the `src/content/blog/` directory.
	loader: glob({ base: './src/content/blog', pattern: '**/*.{md,mdx}' }),
	// Type-check frontmatter using a schema
	schema: ({ image }) =>
		z.object({
			title: z.string(),
			description: z.string(),
			// Transform string to Date object
			pubDate: z.coerce.date(),
			updatedDate: z.coerce.date().optional(),
			heroImage: z.optional(image()),
			/** Optional post eyebrow (e.g. education / harm reduction). */
			eyebrow: z.string().optional(),
			/**
			 * When true, BlogPost renders the strong enhanced/PED education disclaimer
			 * (medical + AU legal + no gear sourcing + culture-pattern dosing fence).
			 */
			enhancedEducation: z.boolean().optional(),
		}),
});

export const collections = { blog };
