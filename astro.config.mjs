// @ts-check

import mdx from '@astrojs/mdx';
import sitemap from '@astrojs/sitemap';
import { defineConfig } from 'astro/config';

// https://astro.build/config
export default defineConfig({
	site: 'https://yehbro.com',
	integrations: [
		mdx(),
		sitemap({
			filter: (page) => !page.includes('/go/') && !page.includes('/guides/'),
		}),
	],
	// SEO drafts / link map use /guides/*; content lives under /blog/*
	redirects: {
		'/guides/best-creatine-australia': '/blog/best-creatine-australia',
		'/guides/how-to-dose-creatine': '/blog/how-to-dose-creatine',
		'/guides/creatine-monohydrate-vs-hcl': '/blog/creatine-monohydrate-vs-hcl',
		'/guides/best-protein-powder-australia': '/blog/best-protein-powder-australia',
		'/guides/whey-concentrate-vs-isolate-australia': '/blog/whey-concentrate-vs-isolate-australia',
		'/guides/best-stim-free-pre-workout-australia': '/blog/best-stim-free-pre-workout-australia',
		'/guides/protein-scoop-economics-australia': '/blog/protein-scoop-economics-australia',
		'/guides/pre-workout-without-hype': '/blog/pre-workout-without-hype',
		'/guides/beginner-supplement-stack-australia': '/blog/beginner-supplement-stack-australia',
		'/guides/does-creatine-cause-bloating': '/blog/does-creatine-cause-bloating',
		'/guides/cheapest-protein-powder-australia': '/blog/cheapest-protein-powder-australia',
		'/guides/proprietary-blend-pre-workout': '/blog/proprietary-blend-pre-workout',
		'/guides/creapure-vs-generic-creatine': '/blog/creapure-vs-generic-creatine',
		'/guides/protein-per-scoop-australia': '/blog/protein-per-scoop-australia',
		'/guides/best-creatine-for-beginners-australia': '/blog/best-creatine-for-beginners-australia',
		'/guides/creatine-for-women': '/blog/creatine-for-women',
		'/guides/caffeine-dose-training': '/blog/caffeine-dose-training',
		'/guides/lactose-whey-isolate': '/blog/lactose-whey-isolate',
		'/guides/creatine-loading-phase': '/blog/creatine-loading-phase',
		'/guides/when-to-take-creatine': '/blog/when-to-take-creatine',
	},
});




