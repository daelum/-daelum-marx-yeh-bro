/**
 * Multi-profile plan visual capture (stub unlock + localStorage profile).
 * Run with Astro dev up: npx tsx scripts/screenshot-plan-profiles.mjs
 */
import puppeteer from 'puppeteer-core';
import { mkdirSync } from 'node:fs';

const BASE = process.env.PLAN_BASE_URL || 'http://127.0.0.1:4321';
const OUT = '/opt/cursor/artifacts';
mkdirSync(OUT, { recursive: true });

const profiles = [
	{
		file: 'yehbro-plan-male-beginner-3d',
		profile: {
			version: 1,
			updatedAt: new Date().toISOString(),
			weightKg: 92,
			heightCm: 175,
			age: 29,
			sex: 'male',
			activity: 'light',
			goal: 'cut',
			cutPct: 18,
			bulkPct: 10,
			trainingDays: 3,
			targets: { source: 'calculated' },
			dietary: { pattern: 'none', excludes: '', notes: '' },
		},
	},
	{
		file: 'yehbro-plan-female-beginner-3d',
		profile: {
			version: 1,
			updatedAt: new Date().toISOString(),
			weightKg: 74,
			heightCm: 165,
			age: 28,
			sex: 'female',
			activity: 'sedentary',
			goal: 'cut',
			cutPct: 18,
			bulkPct: 10,
			trainingDays: 3,
			targets: { source: 'calculated' },
			dietary: { pattern: 'none', excludes: '', notes: '' },
		},
	},
	{
		file: 'yehbro-plan-male-muscle-4d',
		profile: {
			version: 1,
			updatedAt: new Date().toISOString(),
			weightKg: 85,
			heightCm: 182,
			age: 27,
			sex: 'male',
			activity: 'active',
			goal: 'lean-bulk',
			cutPct: 18,
			bulkPct: 10,
			trainingDays: 4,
			targets: { source: 'calculated' },
			dietary: { pattern: 'none', excludes: '', notes: '' },
		},
	},
];

async function shot(page, path, clip) {
	await page.screenshot({ path, ...(clip ? { clip } : { fullPage: false }) });
	console.log('wrote', path);
}

async function main() {
	const browser = await puppeteer.launch({
		executablePath: '/usr/local/bin/google-chrome',
		headless: true,
		args: ['--no-sandbox', '--disable-gpu', '--window-size=1280,2200'],
		defaultViewport: { width: 1280, height: 2200 },
	});

	for (const { file, profile } of profiles) {
		const page = await browser.newPage();
		await page.goto(`${BASE}/plan`, { waitUntil: 'networkidle0', timeout: 60000 });
		await page.evaluate((p) => {
			localStorage.setItem(
				'yehbro-pdf-unlock-v1',
				JSON.stringify({
					at: new Date().toISOString(),
					mode: 'stub',
					coaching: 'none',
					verified: true,
				}),
			);
			localStorage.setItem('yehbro-user-v1', JSON.stringify(p));
			localStorage.setItem(
				'yehbro-food-os-v1',
				JSON.stringify({
					weightKg: p.weightKg,
					heightCm: p.heightCm,
					age: p.age,
					sex: p.sex,
					activity: p.activity,
					goal: p.goal,
					cutPct: p.cutPct,
					bulkPct: p.bulkPct,
					trainingDays: p.trainingDays,
				}),
			);
		}, profile);
		await page.goto(`${BASE}/plan?checkout=stub`, { waitUntil: 'networkidle0', timeout: 60000 });
		await page.waitForSelector('#plan-doc .pd-hero, #plan-doc h2', { timeout: 15000 });

		await shot(page, `${OUT}/${file}-hero.png`);

		const nutrition = await page.$('#nutrition');
		if (nutrition) {
			await nutrition.scrollIntoView();
			await new Promise((r) => setTimeout(r, 300));
			await shot(page, `${OUT}/${file}-nutrition.png`);
		}

		// Zoom into first meal table (protein oats / strawberries)
		const firstMeal = await page.$('#nutrition .pd-meal');
		if (firstMeal) {
			await firstMeal.scrollIntoView();
			await new Promise((r) => setTimeout(r, 200));
			const box = await firstMeal.boundingBox();
			if (box) {
				await shot(page, `${OUT}/${file}-oats.png`, {
					x: Math.max(0, box.x - 8),
					y: Math.max(0, box.y - 8),
					width: Math.min(box.width + 16, 1200),
					height: Math.min(box.height + 16, 900),
				});
			}
		}

		const meals = await page.$$('#nutrition .pd-meal');
		if (meals[1]) {
			await meals[1].scrollIntoView();
			const box = await meals[1].boundingBox();
			if (box) {
				await shot(page, `${OUT}/${file}-chicken.png`, {
					x: Math.max(0, box.x - 8),
					y: Math.max(0, box.y - 8),
					width: Math.min(box.width + 16, 1200),
					height: Math.min(box.height + 16, 900),
				});
			}
		}
		if (meals[4]) {
			await meals[4].scrollIntoView();
			const box = await meals[4].boundingBox();
			if (box) {
				await shot(page, `${OUT}/${file}-spag.png`, {
					x: Math.max(0, box.x - 8),
					y: Math.max(0, box.y - 8),
					width: Math.min(box.width + 16, 1200),
					height: Math.min(box.height + 16, 900),
				});
			}
		}

		const habits = await page.$('#habits');
		if (habits) {
			await habits.scrollIntoView();
			await new Promise((r) => setTimeout(r, 200));
			await shot(page, `${OUT}/${file}-habits.png`);
		}

		const training = await page.$('#training');
		if (training) {
			await training.scrollIntoView();
			await new Promise((r) => setTimeout(r, 200));
			await shot(page, `${OUT}/${file}-training.png`);
		}

		// Extract strawberry / chicken text for log
		const check = await page.evaluate(() => {
			const text = document.getElementById('plan-doc')?.innerText || '';
			const lines = text.split('\n').map((l) => l.trim()).filter(Boolean);
			const straw = lines.find((l) => /Strawberr/i.test(l));
			const chicken = lines.find((l) => /Chicken breast/i.test(l));
			const habits = !!document.querySelector('#habits');
			const prog = lines.find((l) => /Double progression/i.test(l));
			return { straw, chicken, habits, prog, gate: document.getElementById('gate-msg')?.textContent };
		});
		console.log(file, check);
		await page.close();
	}

	await browser.close();
}

main().catch((err) => {
	console.error(err);
	process.exit(1);
});
