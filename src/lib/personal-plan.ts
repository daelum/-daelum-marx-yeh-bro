/**
 * Yeh Bro System + Food Bro — personalized 12-week plan content.
 * Client-printable (Save as PDF). Education only — not medical advice.
 */

import {
	TRAINING_TEMPLATES,
	type TrainingTemplate,
} from '../data/start-here-system';
import {
	ACTIVITY_LABELS,
	GOAL_DEFAULTS,
	scaleCoachDayPlans,
	type Activity,
	type CoachDayPlan,
	type FoodOsResult,
	type Goal,
	type Sex,
	type StoredFoodOs,
} from './food-os';

export type TrainingDays = 3 | 4;

export type PersonalPlanInputs = StoredFoodOs;

export interface TwelveWeekBlock {
	weeks: string;
	title: string;
	focus: string[];
}

export interface NextPhaseRec {
	title: string;
	summary: string;
	bullets: string[];
}

export interface PersonalPlanDoc {
	generatedAt: string;
	profile: {
		weightKg: number;
		heightCm: number;
		age: number;
		sex: Sex;
		activityLabel: string;
		goalLabel: string;
		goal: Goal;
		cutPct: number;
		bulkPct: number;
	};
	targets: {
		calories: number;
		tdee: number;
		bmr: number;
		proteinG: number;
		carbsG: number;
		fatG: number;
		adjustmentPct: number;
		why: string[];
	};
	training: TrainingTemplate;
	nutritionDays: CoachDayPlan[];
	nutritionLede: string;
	goalFraming: {
		headline: string;
		timeframe: string;
		schedule: string[];
	};
	twelveWeek: TwelveWeekBlock[];
	nextPhase: NextPhaseRec;
	disclaimer: string;
}

export function pickTrainingTemplate(days: TrainingDays): TrainingTemplate {
	const id = days === 4 ? 'pplu' : 'ppl';
	const tpl = TRAINING_TEMPLATES.find((t) => t.id === id);
	if (!tpl) throw new Error(`Missing training template: ${id}`);
	return tpl;
}

export function buildGoalFraming(
	goal: Goal,
	training: TrainingTemplate,
	calories: number,
): PersonalPlanDoc['goalFraming'] {
	const schedule = [
		`Lift ${training.daysPerWeek}× / week on ${training.name.split(' (')[0]}.`,
		'Weigh in 2–3 mornings/week (same conditions) — trend beats single days.',
		'Protein first; run coach day templates on training / rest / diet-break weeks.',
	];
	if (goal === 'cut') {
		return {
			headline: `12-week cut block @ ~${calories} kcal / day`,
			timeframe:
				'Aim for a steady scale trend (often ~0.5–1% body weight / week). If flat 2–3 weeks with adherence, nudge food — don’t panic-cut.',
			schedule: [
				...schedule,
				'If energy / lifts tank for a stretch, run a 1–2 week diet break at maintenance, then resume.',
			],
		};
	}
	if (goal === 'lean-bulk') {
		return {
			headline: `12-week lean bulk @ ~${calories} kcal / day`,
			timeframe:
				'Slow surplus — grow without a dirty bulk. Expect gradual scale creep; pull back if waist races ahead of strength.',
			schedule: [
				...schedule,
				'Keep progression boring: add load or reps when you own the top of the rep range.',
			],
		};
	}
	return {
		headline: `12-week maintain / rebuild @ ~${calories} kcal / day`,
		timeframe:
			'Hold weight while training quality and habits rise. Best default if you’re unsure about a cut or surplus yet.',
		schedule: [
			...schedule,
			'After habits stick, choose cut or lean bulk from the scale + how clothes fit — not from one stressful week.',
		],
	};
}

export function buildTwelveWeekBlocks(goal: Goal, training: TrainingTemplate): TwelveWeekBlock[] {
	const split = training.daysPerWeek === 4 ? '4-day PPLU' : '3-day PPL';
	return [
		{
			weeks: 'Weeks 1–2',
			title: 'Foundation',
			focus: [
				`Lock ${split} on the calendar — protect sleep window.`,
				'Log sessions completed; weigh in 2–3× / week.',
				'Hit protein most days; calories in the Food Bro ballpark.',
			],
		},
		{
			weeks: 'Weeks 3–6',
			title: 'Consistency',
			focus: [
				`Same ${split} — stop program-hopping.`,
				'Leave 1–3 reps in reserve (RIR) on most working sets.',
				goal === 'cut'
					? 'Stay in the deficit; use diet-break template only if flat / depleted for a stretch.'
					: goal === 'lean-bulk'
						? 'Own the surplus without ego eating — training quality first.'
						: 'Maintain calories; let the logbook improve.',
			],
		},
		{
			weeks: 'Weeks 7–10',
			title: 'Progressive overload',
			focus: [
				'Add weight or reps when you hit the top of the rep range with solid form.',
				'Track 3–5 main lifts; ignore the rest of the noise.',
				'Optional deload (~30% volume) for one week if sleep / joints are wrecked.',
			],
		},
		{
			weeks: 'Weeks 11–12',
			title: 'Finish the block',
			focus: [
				'Keep showing up — polish adherence, don’t invent a new program.',
				'Compare week-1 vs week-12: sessions hit, scale trend, how lifts feel.',
				'Decide next phase from data (below) — education, not a prescription.',
			],
		},
	];
}

export function buildNextPhase(goal: Goal, tdee: number): NextPhaseRec {
	if (goal === 'cut') {
		return {
			title: 'After 12 weeks on a cut',
			summary: `Compare the scale trend and training quality. Est. maintenance ≈ ${tdee} kcal — use that as the diet-break / reverse anchor.`,
			bullets: [
				'Still have fat to lose and lifts feel fine → continue the cut another block, or insert a 1–2 week diet break then resume.',
				'Flat, exhausted, or strength sliding → diet break / reverse toward maintenance for 1–4 weeks, then reassess.',
				'Happy with leanness → maintain 2–4 weeks, then lean bulk if you want size.',
				'This is gym-bro education — not medical advice. Clinical conditions → talk to a clinician.',
			],
		};
	}
	if (goal === 'lean-bulk') {
		return {
			title: 'After 12 weeks on a lean bulk',
			summary: `Check waist vs strength. Maintenance ≈ ${tdee} kcal if you need to settle.`,
			bullets: [
				'Strength up, waist under control → continue lean bulk or keep a small surplus.',
				'Waist raced ahead → short maintain or mini-cut (a few weeks), then decide.',
				'Want a reset → maintain 2–4 weeks, then pick cut or another surplus block.',
				'Education only — not a personal prescription.',
			],
		};
	}
	return {
		title: 'After 12 weeks at maintain',
		summary: `Habits first. Maintenance ≈ ${tdee} kcal. Next phase is a choice, not a panic.`,
		bullets: [
			'Want fat loss → start a cut block with Food Bro deficit + coach day templates.',
			'Want size → lean bulk (~10% over maintenance) and keep PPL / PPLU progression.',
			'Still rebuilding habit → another maintain block is a win, not a stall.',
			'Education only — not medical advice.',
		],
	};
}

export function buildPersonalPlan(inputs: PersonalPlanInputs, result: FoodOsResult): PersonalPlanDoc {
	const training = pickTrainingTemplate(inputs.trainingDays);
	const scaled = scaleCoachDayPlans(result, {
		weightKg: inputs.weightKg,
		heightCm: inputs.heightCm,
		age: inputs.age,
	});
	return {
		generatedAt: new Date().toISOString().slice(0, 10),
		profile: {
			weightKg: inputs.weightKg,
			heightCm: inputs.heightCm,
			age: inputs.age,
			sex: inputs.sex,
			activityLabel: ACTIVITY_LABELS[inputs.activity as Activity],
			goalLabel: GOAL_DEFAULTS[inputs.goal].label,
			goal: inputs.goal,
			cutPct: inputs.cutPct,
			bulkPct: inputs.bulkPct,
		},
		targets: {
			calories: result.calories,
			tdee: result.tdee,
			bmr: result.bmr,
			proteinG: result.proteinG,
			carbsG: result.carbsG,
			fatG: result.fatG,
			adjustmentPct: result.adjustmentPct,
			why: result.why,
		},
		training,
		nutritionDays: scaled.plans,
		nutritionLede: scaled.lede,
		goalFraming: buildGoalFraming(inputs.goal, training, result.calories),
		twelveWeek: buildTwelveWeekBlocks(inputs.goal, training),
		nextPhase: buildNextPhase(inputs.goal, result.tdee),
		disclaimer:
			'Yeh Bro System + Food Bro — education only, not medical advice or a personal prescription. Estimates vary; adjust from your scale trend and how training feels. Under 18 or clinical conditions → talk to a clinician. We don’t source AAS / SARMs / grey-market gear.',
	};
}

export function planFilename(doc: PersonalPlanDoc): string {
	const goal = doc.profile.goal.replace('lean-bulk', 'lean-bulk');
	return `yeh-bro-plan-${doc.profile.weightKg}kg-${goal}-${doc.training.daysPerWeek}day.pdf`;
}
