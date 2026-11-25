/**
 * Dedicated coaching PDF generator (pdf-lib).
 * Independent of the website UI — light editorial pages, black type, gold accents.
 * No nav, buttons, checkout, URLs, print tips, or dark web chrome.
 */

import {
	PDFDocument,
	StandardFonts,
	rgb,
	type PDFFont,
	type PDFPage,
} from 'pdf-lib';
import type { PersonalPlanDoc } from './personal-plan';

const PAGE_W = 595.28; // A4
const PAGE_H = 841.89;
const MARGIN_X = 48;
const MARGIN_TOP = 52;
const MARGIN_BOTTOM = 48;
const CONTENT_W = PAGE_W - MARGIN_X * 2;

const INK = rgb(0.08, 0.08, 0.08);
const MUTED = rgb(0.32, 0.32, 0.32);
const RULE = rgb(0.82, 0.82, 0.8);
const GOLD = rgb(0.72, 0.55, 0.22);
const PAPER = rgb(1, 1, 1);

type Fonts = { regular: PDFFont; bold: PDFFont; italic: PDFFont };

type Cursor = {
	doc: PDFDocument;
	page: PDFPage;
	fonts: Fonts;
	y: number;
	pageIndex: number;
};

/** Helvetica / WinAnsi-safe text (strip characters pdf-lib cannot encode). */
function pdfSafe(text: string): string {
	return text
		.replace(/≈/g, '~')
		.replace(/[—–]/g, '-')
		.replace(/[‘’]/g, "'")
		.replace(/[“”]/g, '"')
		.replace(/×/g, 'x')
		.replace(/·/g, '|')
		.replace(/…/g, '...')
		.replace(/≥/g, '>=')
		.replace(/≤/g, '<=')
		.replace(/→/g, '->')
		.replace(/≠/g, '!=')
		.replace(/[^\x09\x0A\x0D\x20-\x7E]/g, '');
}

function wrapText(text: string, font: PDFFont, size: number, maxWidth: number): string[] {
	const clean = pdfSafe(text).replace(/\s+/g, ' ').trim();
	if (!clean) return [];
	const words = clean.split(' ');
	const lines: string[] = [];
	let current = '';
	for (const word of words) {
		const trial = current ? `${current} ${word}` : word;
		if (font.widthOfTextAtSize(trial, size) <= maxWidth) {
			current = trial;
		} else {
			if (current) lines.push(current);
			// Hard-break very long tokens
			if (font.widthOfTextAtSize(word, size) > maxWidth) {
				let chunk = '';
				for (const ch of word) {
					const t = chunk + ch;
					if (font.widthOfTextAtSize(t, size) > maxWidth) {
						if (chunk) lines.push(chunk);
						chunk = ch;
					} else chunk = t;
				}
				current = chunk;
			} else {
				current = word;
			}
		}
	}
	if (current) lines.push(current);
	return lines;
}

function ensureSpace(ctx: Cursor, need: number) {
	if (ctx.y - need < MARGIN_BOTTOM) {
		newPage(ctx);
	}
}

function newPage(ctx: Cursor) {
	ctx.page = ctx.doc.addPage([PAGE_W, PAGE_H]);
	ctx.pageIndex += 1;
	ctx.y = PAGE_H - MARGIN_TOP;
	// subtle top gold rule
	ctx.page.drawRectangle({
		x: MARGIN_X,
		y: PAGE_H - 18,
		width: 36,
		height: 2.5,
		color: GOLD,
	});
	ctx.page.drawText('Yeh Bro · Personalised plan', {
		x: MARGIN_X + 44,
		y: PAGE_H - 22,
		size: 8,
		font: ctx.fonts.regular,
		color: MUTED,
	});
}

function drawFooter(ctx: Cursor, totalHint?: string) {
	const label = totalHint || `Page ${ctx.pageIndex}`;
	ctx.page.drawText(label, {
		x: MARGIN_X,
		y: 28,
		size: 8,
		font: ctx.fonts.regular,
		color: MUTED,
	});
}

function drawText(
	ctx: Cursor,
	text: string,
	opts: { x?: number; size: number; font: PDFFont; color: ReturnType<typeof rgb> },
) {
	ctx.page.drawText(pdfSafe(text), {
		x: opts.x ?? MARGIN_X,
		y: ctx.y,
		size: opts.size,
		font: opts.font,
		color: opts.color,
	});
}

function h1(ctx: Cursor, text: string) {
	ensureSpace(ctx, 36);
	const lines = wrapText(text, ctx.fonts.bold, 20, CONTENT_W);
	for (const line of lines) {
		ctx.page.drawText(line, {
			x: MARGIN_X,
			y: ctx.y,
			size: 20,
			font: ctx.fonts.bold,
			color: INK,
		});
		ctx.y -= 26;
	}
	ctx.y -= 4;
}

function h2(ctx: Cursor, text: string) {
	ensureSpace(ctx, 28);
	ctx.y -= 6;
	ctx.page.drawRectangle({
		x: MARGIN_X,
		y: ctx.y + 12,
		width: 18,
		height: 2,
		color: GOLD,
	});
	const lines = wrapText(text, ctx.fonts.bold, 13, CONTENT_W - 8);
	for (const line of lines) {
		ctx.page.drawText(line, {
			x: MARGIN_X,
			y: ctx.y,
			size: 13,
			font: ctx.fonts.bold,
			color: INK,
		});
		ctx.y -= 18;
	}
	ctx.y -= 2;
}

function h3(ctx: Cursor, text: string) {
	ensureSpace(ctx, 22);
	ctx.page.drawText(pdfSafe(text), {
		x: MARGIN_X,
		y: ctx.y,
		size: 11,
		font: ctx.fonts.bold,
		color: INK,
	});
	ctx.y -= 16;
}

function para(ctx: Cursor, text: string, opts?: { muted?: boolean; size?: number }) {
	const size = opts?.size ?? 10;
	const font = ctx.fonts.regular;
	const color = opts?.muted ? MUTED : INK;
	const lines = wrapText(text, font, size, CONTENT_W);
	for (const line of lines) {
		ensureSpace(ctx, size + 4);
		ctx.page.drawText(line, { x: MARGIN_X, y: ctx.y, size, font, color });
		ctx.y -= size + 4;
	}
	ctx.y -= 4;
}

function bullet(ctx: Cursor, text: string) {
	const size = 10;
	const lines = wrapText(text, ctx.fonts.regular, size, CONTENT_W - 14);
	for (let i = 0; i < lines.length; i++) {
		ensureSpace(ctx, size + 4);
		if (i === 0) {
			ctx.page.drawText('•', {
				x: MARGIN_X,
				y: ctx.y,
				size,
				font: ctx.fonts.regular,
				color: GOLD,
			});
		}
		ctx.page.drawText(lines[i], {
			x: MARGIN_X + 12,
			y: ctx.y,
			size,
			font: ctx.fonts.regular,
			color: INK,
		});
		ctx.y -= size + 4;
	}
	ctx.y -= 2;
}

function rule(ctx: Cursor) {
	ensureSpace(ctx, 12);
	ctx.page.drawLine({
		start: { x: MARGIN_X, y: ctx.y },
		end: { x: PAGE_W - MARGIN_X, y: ctx.y },
		thickness: 0.6,
		color: RULE,
	});
	ctx.y -= 12;
}

function kvRow(ctx: Cursor, label: string, value: string) {
	ensureSpace(ctx, 14);
	ctx.page.drawText(pdfSafe(label), {
		x: MARGIN_X,
		y: ctx.y,
		size: 9,
		font: ctx.fonts.regular,
		color: MUTED,
	});
	const safeVal = pdfSafe(value);
	ctx.page.drawText(safeVal, {
		x: MARGIN_X + 120,
		y: ctx.y,
		size: 10,
		font: ctx.fonts.bold,
		color: INK,
	});
	ctx.y -= 14;
}

function coverPage(ctx: Cursor, doc: PersonalPlanDoc) {
	ctx.page.drawRectangle({ x: 0, y: 0, width: PAGE_W, height: PAGE_H, color: PAPER });
	ctx.page.drawRectangle({
		x: MARGIN_X,
		y: PAGE_H - 56,
		width: 48,
		height: 4,
		color: GOLD,
	});
	ctx.y = PAGE_H - 90;
	ctx.page.drawText('YEH BRO', {
		x: MARGIN_X,
		y: ctx.y,
		size: 28,
		font: ctx.fonts.bold,
		color: INK,
	});
	ctx.y -= 28;
	ctx.page.drawText('PERSONALISED TRAINING & NUTRITION PLAN', {
		x: MARGIN_X,
		y: ctx.y,
		size: 11,
		font: ctx.fonts.regular,
		color: GOLD,
	});
	ctx.y -= 40;
	const title = doc.intro.title;
	for (const line of wrapText(title, ctx.fonts.bold, 18, CONTENT_W)) {
		ctx.page.drawText(line, {
			x: MARGIN_X,
			y: ctx.y,
			size: 18,
			font: ctx.fonts.bold,
			color: INK,
		});
		ctx.y -= 24;
	}
	ctx.y -= 8;
	para(ctx, doc.intro.lede, { muted: true, size: 11 });
	ctx.y -= 8;
	kvRow(ctx, 'Generated', doc.generatedAt);
	kvRow(
		ctx,
		'Profile',
		`${doc.profile.weightKg} kg · ${doc.profile.heightCm} cm · age ${doc.profile.age}`,
	);
	kvRow(ctx, 'Goal', `${doc.profile.goalLabel} · ~${doc.targets.calories} kcal / day`);
	kvRow(
		ctx,
		'Training',
		`${doc.training.daysPerWeek}-day · ${doc.training.name}`,
	);
	if (doc.profile.limitations) {
		kvRow(ctx, 'Limitations', doc.profile.limitations.slice(0, 80));
	}
	ctx.y -= 20;
	rule(ctx);
	para(
		ctx,
		'This document is a coaching plan — not a website printout. Follow the daily meal plan, prescribed lifts, and non-negotiables. Education only; not medical advice.',
		{ muted: true, size: 9 },
	);
}

function sectionNutrition(ctx: Cursor, doc: PersonalPlanDoc) {
	h2(ctx, '4 · Nutrition — daily meal plan');
	para(ctx, doc.nutritionLede);
	para(ctx, doc.nutritionProfileLine, { muted: true });
	if (doc.nutritionProfileNote) para(ctx, doc.nutritionProfileNote, { muted: true });

	const daily = doc.nutritionDays.find((d) => d.id === 'training') ?? doc.nutritionDays[0];
	if (!daily) return;

	h3(ctx, `${daily.title} — ${daily.calories} kcal`);
	para(ctx, daily.when, { muted: true, size: 9 });
	para(
		ctx,
		`Day totals: P ${daily.proteinG}g · C ${daily.carbsG}g · F ${daily.fatG}g · Fibre ${daily.fibreG}g`,
		{ size: 9 },
	);

	for (const meal of daily.meals) {
		ensureSpace(ctx, 40);
		h3(ctx, `${meal.name}  ·  ${meal.kcal} kcal`);
		para(
			ctx,
			`P ${meal.proteinG}g · C ${meal.carbsG}g · F ${meal.fatG}g`,
			{ muted: true, size: 9 },
		);
		for (const ing of meal.ingredients ?? []) {
			ensureSpace(ctx, 12);
			const left = `${ing.name}${ing.note ? ` (${ing.note})` : ''}`;
			const right = `${ing.amount}  ·  ${ing.kcal ?? '—'} kcal`;
			const leftLines = wrapText(left, ctx.fonts.regular, 9, CONTENT_W - 150);
			ctx.page.drawText(leftLines[0] || left, {
				x: MARGIN_X + 8,
				y: ctx.y,
				size: 9,
				font: ctx.fonts.regular,
				color: INK,
			});
			ctx.page.drawText(right, {
				x: PAGE_W - MARGIN_X - ctx.fonts.regular.widthOfTextAtSize(right, 9),
				y: ctx.y,
				size: 9,
				font: ctx.fonts.regular,
				color: MUTED,
			});
			ctx.y -= 12;
			for (let i = 1; i < leftLines.length; i++) {
				ensureSpace(ctx, 12);
				ctx.page.drawText(leftLines[i], {
					x: MARGIN_X + 8,
					y: ctx.y,
					size: 9,
					font: ctx.fonts.regular,
					color: MUTED,
				});
				ctx.y -= 12;
			}
		}
		ctx.y -= 4;
	}

	const dietBreak = doc.nutritionDays.find((d) => d.id === 'diet-break');
	if (dietBreak) {
		h3(ctx, 'Optional diet-break week');
		para(
			ctx,
			`${dietBreak.when} Target ~${dietBreak.calories} kcal (P ${dietBreak.proteinG}g · C ${dietBreak.carbsG}g · F ${dietBreak.fatG}g). Same meal names; larger carb portions — details available in your plan engine if you run a settle week.`,
			{ muted: true, size: 9 },
		);
	}
}

function sectionTraining(ctx: Cursor, doc: PersonalPlanDoc) {
	h2(ctx, '5 · Training');
	h3(ctx, doc.training.name);
	para(ctx, doc.training.blurb);
	para(
		ctx,
		`${doc.training.daysPerWeek} days · ${doc.training.level} · one exercise per slot`,
		{ muted: true, size: 9 },
	);
	if (doc.trainingPersonalisation?.adaptations?.length) {
		h3(ctx, 'Limitation adaptations');
		for (const a of doc.trainingPersonalisation.adaptations.slice(0, 24)) {
			bullet(ctx, a);
		}
	}

	for (const day of doc.training.days) {
		h3(ctx, day.label);
		for (const lift of day.lifts) {
			ensureSpace(ctx, 28);
			ctx.page.drawText(pdfSafe(lift.name), {
				x: MARGIN_X,
				y: ctx.y,
				size: 10,
				font: ctx.fonts.bold,
				color: INK,
			});
			ctx.y -= 13;
			para(
				ctx,
				`${lift.sets} sets × ${lift.reps}${lift.rest ? ` · rest ${lift.rest}` : ''}`,
				{ muted: true, size: 9 },
			);
			if (lift.cue) para(ctx, lift.cue, { size: 9 });
			ctx.y -= 2;
		}
	}

	h3(ctx, 'Progression');
	for (const r of doc.training.progression) bullet(ctx, r);
}

/** Build a light editorial coaching PDF from a validated PersonalPlanDoc. */
export async function buildPlanPdfBytes(doc: PersonalPlanDoc): Promise<Uint8Array> {
	const pdf = await PDFDocument.create();
	const fonts: Fonts = {
		regular: await pdf.embedFont(StandardFonts.Helvetica),
		bold: await pdf.embedFont(StandardFonts.HelveticaBold),
		italic: await pdf.embedFont(StandardFonts.HelveticaOblique),
	};

	const first = pdf.addPage([PAGE_W, PAGE_H]);
	const ctx: Cursor = { doc: pdf, page: first, fonts, y: PAGE_H - MARGIN_TOP, pageIndex: 1 };
	coverPage(ctx, doc);
	drawFooter(ctx);

	newPage(ctx);
	h1(ctx, 'Your plan');
	for (const p of doc.intro.paragraphs) para(ctx, p);
	h3(ctx, 'Priorities');
	for (const p of doc.priorities) bullet(ctx, p);

	h2(ctx, '1 · Starting point');
	kvRow(ctx, 'Weight', `${doc.profile.weightKg} kg`);
	kvRow(ctx, 'Height', `${doc.profile.heightCm} cm`);
	kvRow(ctx, 'Age', String(doc.profile.age));
	kvRow(ctx, 'Sex (BMR)', doc.profile.sex);
	kvRow(ctx, 'Activity', doc.profile.activityLabel);
	kvRow(ctx, 'Goal', doc.profile.goalLabel);
	if (doc.profile.experience) kvRow(ctx, 'Experience', doc.profile.experience);
	if (doc.profile.equipment) {
		kvRow(ctx, 'Equipment', doc.profile.equipment === 'limited' ? 'Limited / home' : 'Full gym');
	}
	if (doc.profile.limitations) kvRow(ctx, 'Limitations', doc.profile.limitations);
	para(
		ctx,
		`Targets: ~${doc.targets.calories} kcal / day · P ${doc.targets.proteinG}g · C ${doc.targets.carbsG}g · F ${doc.targets.fatG}g · Est. maintenance ≈ ${doc.targets.tdee} kcal · resting ≈ ${doc.targets.bmr} kcal`,
	);
	para(ctx, 'Estimates from standard formulas — not exact metabolism. Adjust from your scale trend.', {
		muted: true,
		size: 9,
	});

	h2(ctx, '2 · Goal + timeframe');
	para(ctx, doc.goalFraming.headline);
	para(ctx, doc.goalFraming.timeframe);
	for (const s of doc.goalFraming.schedule) bullet(ctx, s);

	h2(ctx, '3 · Non-negotiables');
	for (const n of doc.nonNegotiables) {
		h3(ctx, n.title);
		para(ctx, n.detail);
	}

	sectionNutrition(ctx, doc);
	sectionTraining(ctx, doc);

	h2(ctx, '6 · Daily habits');
	for (const h of doc.dailyHabits) {
		h3(ctx, h.title);
		para(ctx, h.detail);
	}

	h2(ctx, '7 · Recovery');
	for (const r of doc.recovery) {
		h3(ctx, r.title);
		para(ctx, r.detail);
	}

	h2(ctx, '8 · Progress tracking');
	for (const t of doc.progressTracking) bullet(ctx, `${t.title} — ${t.detail}`);

	h2(ctx, '9 · Shopping list');
	para(ctx, doc.shopping.title);
	para(ctx, doc.shopping.blurb, { muted: true, size: 9 });
	for (const line of doc.shopping.lines) {
		ensureSpace(ctx, 12);
		const left = line.name + (line.note ? ` — ${line.note}` : '');
		const leftLines = wrapText(left, fonts.regular, 9, CONTENT_W - 90);
		ctx.page.drawText(leftLines[0] || left, {
			x: MARGIN_X,
			y: ctx.y,
			size: 9,
			font: fonts.regular,
			color: INK,
		});
		ctx.page.drawText(line.amount, {
			x: PAGE_W - MARGIN_X - fonts.bold.widthOfTextAtSize(line.amount, 9),
			y: ctx.y,
			size: 9,
			font: fonts.bold,
			color: INK,
		});
		ctx.y -= 12;
		for (let i = 1; i < leftLines.length; i++) {
			ensureSpace(ctx, 12);
			ctx.page.drawText(leftLines[i], {
				x: MARGIN_X,
				y: ctx.y,
				size: 9,
				font: fonts.regular,
				color: MUTED,
			});
			ctx.y -= 12;
		}
	}

	h2(ctx, '10 · 12-week block');
	for (const b of doc.twelveWeek) {
		h3(ctx, `${b.weeks} — ${b.title}`);
		for (const f of b.focus) bullet(ctx, f);
	}

	h2(ctx, '11 · Action plan');
	for (const a of doc.actionPlan) bullet(ctx, `${a.title} — ${a.detail}`);

	h2(ctx, '12 · Next phase');
	para(ctx, doc.nextPhase.title);
	para(ctx, doc.nextPhase.summary);
	for (const b of doc.nextPhase.bullets) bullet(ctx, b);
	para(ctx, doc.close);
	rule(ctx);
	para(ctx, doc.disclaimer, { muted: true, size: 8 });

	// Footers on all pages with total count
	const pages = pdf.getPages();
	const total = pages.length;
	pages.forEach((page, i) => {
		page.drawText(`Page ${i + 1} / ${total}`, {
			x: MARGIN_X,
			y: 28,
			size: 8,
			font: fonts.regular,
			color: MUTED,
		});
	});

	return pdf.save();
}
