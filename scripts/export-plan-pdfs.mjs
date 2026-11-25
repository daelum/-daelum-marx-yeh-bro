import puppeteer from 'puppeteer-core';
import { mkdirSync } from 'node:fs';

const BASE = process.env.PLAN_BASE_URL || 'http://127.0.0.1:4321';
const OUT = '/opt/cursor/artifacts';
mkdirSync(OUT, { recursive: true });

const profiles = [
	{
		file: 'yehbro-plan-a-beginner-fatloss-3d',
		foodShots: true,
		profile: {
			firstName: 'Alex',
			email: 'alex@example.com',
			weightKg: 92,
			heightCm: 175,
			age: 29,
			sex: 'male',
			activity: 'light',
			goal: 'cut',
			cutPct: 18,
			bulkPct: 10,
			trainingDays: 3,
			experience: 'beginner',
			equipment: 'full-gym',
			stepsBand: '5-8k',
			sleepHours: '6-7',
		},
	},
	{
		file: 'yehbro-plan-b-recomp-4d',
		profile: {
			firstName: 'Jordan',
			email: 'jordan@example.com',
			weightKg: 78,
			heightCm: 176,
			age: 34,
			sex: 'male',
			activity: 'moderate',
			goal: 'maintain',
			cutPct: 18,
			bulkPct: 10,
			trainingDays: 4,
			experience: 'intermediate',
			equipment: 'full-gym',
			stepsBand: '8-10k',
			sleepHours: '7-9',
		},
	},
	{
		file: 'yehbro-plan-c-muscle-experienced-4d',
		profile: {
			firstName: 'Sam',
			email: 'sam@example.com',
			weightKg: 85,
			heightCm: 182,
			age: 27,
			sex: 'male',
			activity: 'active',
			goal: 'lean-bulk',
			cutPct: 18,
			bulkPct: 10,
			trainingDays: 4,
			experience: 'experienced',
			equipment: 'full-gym',
			stepsBand: '10k-plus',
			sleepHours: '7-9',
		},
	},
	{
		file: 'yehbro-plan-d-limited-beginner-3d',
		profile: {
			firstName: 'Riley',
			email: 'riley@example.com',
			weightKg: 74,
			heightCm: 170,
			age: 41,
			sex: 'female',
			activity: 'light',
			goal: 'cut',
			cutPct: 20,
			bulkPct: 10,
			trainingDays: 3,
			experience: 'beginner',
			equipment: 'limited',
			stepsBand: 'under-5k',
			sleepHours: 'under-6',
			limitations: 'left knee flares on deep flexion',
		},
	},
];

async function unlock(page, p) {
	await page.evaluate((x) => {
		localStorage.setItem(
			'yehbro-pdf-unlock-v1',
			JSON.stringify({
				at: new Date().toISOString(),
				mode: 'stub',
				coaching: 'none',
				verified: true,
			}),
		);
		localStorage.setItem(
			'yehbro-user-v1',
			JSON.stringify({
				version: 1,
				updatedAt: new Date().toISOString(),
				...x,
				targets: { source: 'calculated' },
				dietary: { pattern: 'none', excludes: '', notes: '' },
			}),
		);
		localStorage.setItem(
			'yehbro-food-os-v1',
			JSON.stringify({
				weightKg: x.weightKg,
				heightCm: x.heightCm,
				age: x.age,
				sex: x.sex,
				activity: x.activity,
				goal: x.goal,
				cutPct: x.cutPct,
				bulkPct: x.bulkPct,
				trainingDays: x.trainingDays,
			}),
		);
	}, p);
}

async function main() {
	const browser = await puppeteer.launch({
		executablePath: '/usr/local/bin/google-chrome',
		headless: true,
		args: ['--no-sandbox', '--disable-gpu'],
		defaultViewport: { width: 1100, height: 1600 },
	});
	const page = await browser.newPage();

	for (const item of profiles) {
		await page.goto(`${BASE}/plan`, { waitUntil: 'networkidle0' });
		await unlock(page, item.profile);
		await page.goto(`${BASE}/plan?checkout=stub`, { waitUntil: 'networkidle0' });
		await page.waitForSelector('#plan-doc .pd-hero');

		if (item.foodShots) {
			const meals = await page.$$('#nutrition .pd-meal');
			for (const [i, name] of [
				[0, 'oats'],
				[1, 'chicken'],
				[4, 'spag'],
			]) {
				const el = meals[i];
				if (!el) continue;
				await el.evaluate((e) => e.scrollIntoView({ block: 'center' }));
				await new Promise((r) => setTimeout(r, 350));
				await el.screenshot({ path: `${OUT}/yehbro-plan-food-${name}.png` });
				console.log('shot', name);
			}
		}

		// Visual sections for QA
		for (const sel of ['#non-negotiables', '#training', '#recovery', '#action', '#plan-success']) {
			const el = await page.$(sel);
			if (!el) continue;
			await el.evaluate((e) => e.scrollIntoView({ block: 'center' }));
			await new Promise((r) => setTimeout(r, 200));
			const slug = sel.replace('#', '');
			await el.screenshot({ path: `${OUT}/${item.file}-${slug}.png` });
			console.log('shot', item.file, slug);
		}

		await page.pdf({
			path: `${OUT}/${item.file}.pdf`,
			format: 'A4',
			printBackground: true,
			margin: { top: '12mm', bottom: '12mm', left: '10mm', right: '10mm' },
		});
		console.log('pdf', item.file);

		const check = await page.evaluate(() => {
			const text = document.getElementById('plan-doc')?.innerText || '';
			return {
				has10k: /10,?000/.test(text),
				has4L: /4\s*(L|litre|liter)/i.test(text),
				hasAlt: /\bAlternative:/i.test(text),
				hasVideo: /WATCH EXERCISE VIDEO/.test(text),
				name: document.querySelector('.pd-cover-title')?.textContent || '',
				emailStatus: document.getElementById('email-status')?.textContent || '',
			};
		});
		console.log('check', item.file, check);
	}

	await browser.close();
}

main().catch((err) => {
	console.error(err);
	process.exit(1);
});
