/**
 * Build dedicated coaching PDFs (pdf-lib) + rasterise each page for visual QA.
 * Run: npx tsx scripts/export-coaching-pdfs.mjs
 */
import { mkdirSync, writeFileSync, readFileSync } from 'node:fs';
import { spawnSync } from 'node:child_process';
import puppeteer from 'puppeteer-core';

const OUT = '/opt/cursor/artifacts';
mkdirSync(OUT, { recursive: true });

const profiles = [
	{
		file: 'yehbro-coaching-a-beginner-fatloss-3d',
		inputs: {
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
		file: 'yehbro-coaching-h-one-arm-4d',
		inputs: {
			firstName: 'Taylor',
			email: 'taylor@example.com',
			weightKg: 82,
			heightCm: 180,
			age: 33,
			sex: 'male',
			activity: 'moderate',
			goal: 'cut',
			cutPct: 18,
			bulkPct: 10,
			trainingDays: 4,
			experience: 'intermediate',
			equipment: 'full-gym',
			stepsBand: '8-10k',
			sleepHours: '7-9',
			limitations: 'only one arm — cannot use left arm for training',
		},
	},
];

async function pdfPagesToPng(pdfPath, prefix) {
	// Use Chrome to open PDF and screenshot pages via PDF viewer is flaky.
	// Convert with pdftoppm if available; else puppeteer print of data URL pages.
	const pdftoppm = spawnSync('pdftoppm', ['-png', '-r', '120', pdfPath, `${OUT}/${prefix}-page`], {
		encoding: 'utf8',
	});
	if (pdftoppm.status === 0) {
		console.log('rasterised via pdftoppm', prefix);
		return;
	}

	const browser = await puppeteer.launch({
		executablePath: '/usr/bin/google-chrome-stable',
		args: ['--no-sandbox', '--disable-setuid-sandbox'],
		headless: true,
	});
	const page = await browser.newPage();
	await page.setViewport({ width: 900, height: 1200, deviceScaleFactor: 1 });
	const b64 = readFileSync(pdfPath).toString('base64');
	await page.goto(`data:application/pdf;base64,${b64}`, { waitUntil: 'networkidle0' });
	await page.screenshot({ path: `${OUT}/${prefix}-page-chrome.png`, fullPage: true });
	await browser.close();
	console.log('rasterised via chrome fallback', prefix);
}

async function main() {
	const { calcFoodOs } = await import('../src/lib/food-os.ts');
	const { buildPersonalPlan } = await import('../src/lib/personal-plan.ts');
	const { buildPlanPdfBytes } = await import('../src/lib/plan-pdf-doc.ts');
	const { PDFDocument } = await import('pdf-lib');

	for (const sample of profiles) {
		const { inputs, file } = sample;
		const adjustment =
			inputs.goal === 'cut'
				? -(inputs.cutPct / 100)
				: inputs.goal === 'lean-bulk'
					? inputs.bulkPct / 100
					: 0;
		const result = calcFoodOs({
			weightKg: inputs.weightKg,
			heightCm: inputs.heightCm,
			age: inputs.age,
			sex: inputs.sex,
			activity: inputs.activity,
			goal: inputs.goal,
			adjustment,
		});
		if (!result) throw new Error(`calc failed ${file}`);
		const doc = buildPersonalPlan(inputs, result);
		if (doc.nutritionAudit.length) {
			console.error(file, doc.nutritionAudit);
			throw new Error(`audit failed ${file}`);
		}
		const bytes = await buildPlanPdfBytes(doc);
		const pdfPath = `${OUT}/${file}.pdf`;
		writeFileSync(pdfPath, bytes);
		const pdf = await PDFDocument.load(bytes);
		console.log(`${file}: ${pdf.getPageCount()} pages, ${bytes.length} bytes`);
		// Forbidden web chrome strings
		const textProbe = Buffer.from(bytes).toString('latin1');
		for (const banned of [
			'BUILD MY PLAN',
			'Save as PDF / Print',
			'print dialog',
			'Checking access',
			'checkout',
		]) {
			if (textProbe.includes(banned)) {
				throw new Error(`${file} PDF contains web chrome: ${banned}`);
			}
		}
		await pdfPagesToPng(pdfPath, file);
	}
	console.log('done');
}

main().catch((err) => {
	console.error(err);
	process.exit(1);
});
