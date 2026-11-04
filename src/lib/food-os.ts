/**
 * Food OS — calorie + macro estimates for lifters.
 * Mifflin–St Jeor BMR × activity, then goal adjustment.
 * Educational starting point — not medical advice.
 */

export type Sex = 'male' | 'female';
export type Goal = 'cut' | 'maintain' | 'lean-bulk';
export type Activity =
	| 'sedentary'
	| 'light'
	| 'moderate'
	| 'active'
	| 'very-active';

export interface FoodOsInputs {
	weightKg: number;
	heightCm: number;
	age: number;
	sex: Sex;
	activity: Activity;
	goal: Goal;
	/** Cut deficit as fraction of TDEE (default 0.18). Lean bulk surplus default 0.1. */
	adjustment?: number;
	/** Protein g per kg (default 1.8). */
	proteinPerKg?: number;
	/** Fat g per kg (default 0.8). */
	fatPerKg?: number;
}

export interface FoodOsResult {
	bmr: number;
	tdee: number;
	calories: number;
	proteinG: number;
	fatG: number;
	carbsG: number;
	goal: Goal;
	adjustmentPct: number;
	why: string[];
}

export const ACTIVITY_LABELS: Record<Activity, string> = {
	sedentary: 'Mostly desk / little formal training',
	light: '1–3 lift days, light steps',
	moderate: '3–5 lift days, decent steps',
	active: '5–6 hard training days',
	'very-active': 'Two-a-days or physical job + lifting',
};

export const ACTIVITY_MULTIPLIERS: Record<Activity, number> = {
	sedentary: 1.2,
	light: 1.375,
	moderate: 1.55,
	active: 1.725,
	'very-active': 1.9,
};

export const GOAL_DEFAULTS: Record<
	Goal,
	{ label: string; defaultAdj: number; blurb: string }
> = {
	cut: {
		label: 'Cut',
		defaultAdj: -0.18,
		blurb: '~15–20% below maintenance — fat loss without torching lifts.',
	},
	maintain: {
		label: 'Maintain',
		defaultAdj: 0,
		blurb: 'Hold weight while training quality and habits rise.',
	},
	'lean-bulk': {
		label: 'Lean bulk',
		defaultAdj: 0.1,
		blurb: '~10% above maintenance — grow without a dirty bulk.',
	},
};

export const STORAGE_KEY = 'yehbro-food-os-v1';

export function clamp(n: number, min: number, max: number): number {
	return Math.min(max, Math.max(min, n));
}

/** Mifflin–St Jeor resting estimate (kcal/day). */
export function calcBmr(weightKg: number, heightCm: number, age: number, sex: Sex): number {
	const base = 10 * weightKg + 6.25 * heightCm - 5 * age;
	return sex === 'male' ? base + 5 : base - 161;
}

export function calcFoodOs(inputs: FoodOsInputs): FoodOsResult | null {
	const { weightKg, heightCm, age, sex, activity, goal } = inputs;
	if (
		!Number.isFinite(weightKg) ||
		!Number.isFinite(heightCm) ||
		!Number.isFinite(age) ||
		weightKg < 35 ||
		weightKg > 250 ||
		heightCm < 120 ||
		heightCm > 230 ||
		age < 16 ||
		age > 90
	) {
		return null;
	}

	const bmr = calcBmr(weightKg, heightCm, age, sex);
	const tdee = bmr * ACTIVITY_MULTIPLIERS[activity];

	const defaults = GOAL_DEFAULTS[goal];
	let adj = inputs.adjustment ?? defaults.defaultAdj;
	if (goal === 'cut') adj = clamp(adj, -0.25, -0.1);
	else if (goal === 'lean-bulk') adj = clamp(adj, 0.05, 0.15);
	else adj = 0;

	const calories = Math.round(tdee * (1 + adj));
	const proteinPerKg = clamp(inputs.proteinPerKg ?? 1.8, 1.4, 2.4);
	const fatPerKg = clamp(inputs.fatPerKg ?? 0.8, 0.6, 1.2);
	const proteinG = Math.round(weightKg * proteinPerKg);
	const fatG = Math.round(weightKg * fatPerKg);
	const proteinKcal = proteinG * 4;
	const fatKcal = fatG * 9;
	const carbKcal = Math.max(0, calories - proteinKcal - fatKcal);
	const carbsG = Math.round(carbKcal / 4);

	const adjPct = Math.round(Math.abs(adj) * 100);
	const why: string[] = [
		`Resting estimate (Mifflin–St Jeor) ≈ ${Math.round(bmr)} kcal, then × activity (${ACTIVITY_LABELS[activity].toLowerCase()}) ≈ ${Math.round(tdee)} kcal maintenance.`,
	];
	if (goal === 'cut') {
		why.push(
			`Cut target is about ${adjPct}% under that so fat comes off while you keep lifting — start here, then nudge from the 2–3 week scale trend.`,
		);
	} else if (goal === 'lean-bulk') {
		why.push(
			`Lean bulk sits about ${adjPct}% over maintenance so you can grow without a dirty surplus that undoes the next cut.`,
		);
	} else {
		why.push(
			`Maintain holds weight so training quality and habits can rise before you force a deficit or surplus.`,
		);
	}
	why.push(
		`Protein ≈ ${proteinPerKg.toFixed(1)} g/kg (${proteinG} g) — the lever that protects muscle. Fat ≈ ${fatPerKg.toFixed(1)} g/kg for hormones and satiety; carbs fill the rest for training fuel.`,
	);

	return {
		bmr: Math.round(bmr),
		tdee: Math.round(tdee),
		calories,
		proteinG,
		fatG,
		carbsG,
		goal,
		adjustmentPct: adjPct,
		why,
	};
}

export interface StoredFoodOs {
	weightKg: number;
	heightCm: number;
	age: number;
	sex: Sex;
	activity: Activity;
	goal: Goal;
	cutPct: number;
	bulkPct: number;
}

export const DEFAULT_INPUTS: StoredFoodOs = {
	weightKg: 80,
	heightCm: 178,
	age: 28,
	sex: 'male',
	activity: 'moderate',
	goal: 'maintain',
	cutPct: 18,
	bulkPct: 10,
};

export interface MealFramework {
	id: string;
	title: string;
	when: string;
	plates: string[];
}

export const MEAL_FRAMEWORKS: MealFramework[] = [
	{
		id: 'high-protein-day',
		title: 'High-protein day (any goal)',
		when: 'Default plate logic when you just need to hit protein without an app spiral.',
		plates: [
			'Breakfast: eggs or Greek-style yoghurt + fruit + toast or oats',
			'Lunch: chicken, tuna, lean beef, or tofu bowl — rice/potato + veg',
			'Dinner: similar protein + carb + veg; sauce is fine, don’t fear oil in cooking',
			'Gap filler: whey/plant scoop, cottage cheese, or jerky if food undershoots',
		],
	},
	{
		id: 'cut-day',
		title: 'Cut-day framework',
		when: 'When Food OS is in cut mode — volume food, keep lifts fed.',
		plates: [
			'Anchor every meal with a palm+ of protein before adding extras',
			'Push veg and lean cuts; keep a carb serving around training',
			'Walk after meals if hunger noise is loud — steps are free deficit help',
			'Save discretionary calories for one thing you actually enjoy (not six “bites”)',
		],
	},
	{
		id: 'lean-bulk-day',
		title: 'Lean-bulk framework',
		when: 'Small surplus — add food you digest, not a dirty free-for-all.',
		plates: [
			'Add 1 extra carb serving on training days (rice, pasta, potato, bread)',
			'Use milk, yoghurt, nut butter, or oil as easy calorie bumpers',
			'Still hit protein first; surplus without protein is just getting softer',
			'Re-check the scale every 2–3 weeks — aim ~0.25–0.5% body weight / week',
		],
	},
	{
		id: 'au-practical',
		title: 'AU-practical staples',
		when: 'Grocery reality, not US cosplay aisle lists.',
		plates: [
			'Protein: chicken thigh/breast, lean mince, eggs, tuna cans, Greek yoghurt, tofu, whey',
			'Carbs: rice, pasta, potatoes, bread, oats, fruit',
			'Fats: olive oil, avocado, nuts, fatty fish when it fits the budget',
			'Convenience: rotisserie chicken, frozen veg, microwave rice — still counts',
		],
	},
];
