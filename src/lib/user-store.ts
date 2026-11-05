/**
 * Yeh Bro — central client user profile (single source of truth).
 * Extends Food Bro persistence. No auth / no server — local browser only.
 */

import {
	DEFAULT_INPUTS,
	STORAGE_KEY as LEGACY_FOOD_OS_KEY,
	calcFoodOs,
	type Activity,
	type FoodOsResult,
	type Goal,
	type Sex,
	type StoredFoodOs,
	type TrainingDaysPref,
} from './food-os';

export const USER_STORAGE_KEY = 'yehbro-user-v1';
export { LEGACY_FOOD_OS_KEY };

export type TargetSource = 'calculated' | 'user';

export type DietaryPattern = 'none' | 'vegetarian' | 'pescatarian' | 'vegan' | 'other';

export interface DietaryPrefs {
	pattern: DietaryPattern;
	/** Free-text excludes (allergies / hard nos). */
	excludes: string;
	notes: string;
}

export interface MacroTargets {
	/** calculated = follow Food Bro math; user = locked overrides until cleared. */
	source: TargetSource;
	calories?: number;
	proteinG?: number;
	carbsG?: number;
	fatG?: number;
}

export interface YehBroProfile {
	version: 1;
	updatedAt: string;
	weightKg?: number;
	heightCm?: number;
	age?: number;
	sex?: Sex;
	goalWeightKg?: number;
	activity?: Activity;
	goal?: Goal;
	cutPct: number;
	bulkPct: number;
	/** 3 → PPL, 4 → PPLU. */
	trainingDays: TrainingDaysPref;
	targets: MacroTargets;
	dietary: DietaryPrefs;
}

export const DEFAULT_DIETARY: DietaryPrefs = {
	pattern: 'none',
	excludes: '',
	notes: '',
};

export const DEFAULT_TARGETS: MacroTargets = {
	source: 'calculated',
};

/** Soft example values for empty forms — never treat as a saved profile. */
export const EXAMPLE_PROFILE_HINT = {
	age: 36,
	weightKg: 80,
	heightCm: 178,
	goalWeightKg: 75,
} as const;

const SAFE_RETURN_PREFIXES = [
	'/food-bro',
	'/start-here',
	'/train',
	'/fuel',
	'/food',
	'/profile',
	'/recover',
	'/culture',
	'/shop',
	'/about',
	'/blog',
] as const;

export function restDays(trainingDays: TrainingDaysPref): number {
	return (7 - trainingDays) as 3 | 4;
}

export function trainingDaysToSplit(days: TrainingDaysPref): 'ppl' | 'pplu' {
	return days === 4 ? 'pplu' : 'ppl';
}

export function splitToTrainingDays(split: 'ppl' | 'pplu'): TrainingDaysPref {
	return split === 'pplu' ? 4 : 3;
}

function blankProfile(): YehBroProfile {
	return {
		version: 1,
		updatedAt: new Date().toISOString(),
		cutPct: DEFAULT_INPUTS.cutPct,
		bulkPct: DEFAULT_INPUTS.bulkPct,
		trainingDays: DEFAULT_INPUTS.trainingDays,
		targets: { ...DEFAULT_TARGETS },
		dietary: { ...DEFAULT_DIETARY },
	};
}

export function fromStoredFoodOs(stored: StoredFoodOs): YehBroProfile {
	return {
		version: 1,
		updatedAt: new Date().toISOString(),
		weightKg: stored.weightKg,
		heightCm: stored.heightCm,
		age: stored.age,
		sex: stored.sex,
		activity: stored.activity,
		goal: stored.goal,
		cutPct: stored.cutPct,
		bulkPct: stored.bulkPct,
		trainingDays: stored.trainingDays === 4 ? 4 : 3,
		targets: { ...DEFAULT_TARGETS },
		dietary: { ...DEFAULT_DIETARY },
	};
}

/** Food Bro–compatible slice for calc / personal-plan. */
export function toStoredFoodOs(profile: YehBroProfile): StoredFoodOs | null {
	if (
		profile.weightKg == null ||
		profile.heightCm == null ||
		profile.age == null ||
		!profile.sex ||
		!profile.activity ||
		!profile.goal
	) {
		return null;
	}
	return {
		weightKg: profile.weightKg,
		heightCm: profile.heightCm,
		age: profile.age,
		sex: profile.sex,
		activity: profile.activity,
		goal: profile.goal,
		cutPct: profile.cutPct,
		bulkPct: profile.bulkPct,
		trainingDays: profile.trainingDays === 4 ? 4 : 3,
	};
}

/** Ready for shopping scale, PDF, and personalized meals. */
export function isProfileReady(profile: YehBroProfile | null | undefined): boolean {
	if (!profile) return false;
	const stored = toStoredFoodOs(profile);
	if (!stored) return false;
	return (
		Number.isFinite(stored.weightKg) &&
		Number.isFinite(stored.heightCm) &&
		Number.isFinite(stored.age) &&
		stored.weightKg >= 35 &&
		stored.weightKg <= 250 &&
		stored.heightCm >= 120 &&
		stored.heightCm <= 230 &&
		stored.age >= 16 &&
		stored.age <= 90
	);
}

export function missingProfileFields(profile: YehBroProfile | null | undefined): string[] {
	const missing: string[] = [];
	if (!profile) {
		return ['height', 'weight', 'age', 'sex', 'activity', 'goal'];
	}
	if (profile.heightCm == null || !Number.isFinite(profile.heightCm)) missing.push('height');
	if (profile.weightKg == null || !Number.isFinite(profile.weightKg)) missing.push('weight');
	if (profile.age == null || !Number.isFinite(profile.age)) missing.push('age');
	if (!profile.sex) missing.push('sex');
	if (!profile.activity) missing.push('activity');
	if (!profile.goal) missing.push('goal');
	return missing;
}

function parseDietary(raw: unknown): DietaryPrefs {
	if (!raw || typeof raw !== 'object') return { ...DEFAULT_DIETARY };
	const d = raw as Partial<DietaryPrefs>;
	const pattern: DietaryPattern =
		d.pattern === 'vegetarian' ||
		d.pattern === 'pescatarian' ||
		d.pattern === 'vegan' ||
		d.pattern === 'other'
			? d.pattern
			: 'none';
	return {
		pattern,
		excludes: typeof d.excludes === 'string' ? d.excludes : '',
		notes: typeof d.notes === 'string' ? d.notes : '',
	};
}

function parseTargets(raw: unknown): MacroTargets {
	if (!raw || typeof raw !== 'object') return { ...DEFAULT_TARGETS };
	const t = raw as Partial<MacroTargets>;
	const source: TargetSource = t.source === 'user' ? 'user' : 'calculated';
	const out: MacroTargets = { source };
	if (typeof t.calories === 'number' && Number.isFinite(t.calories)) out.calories = t.calories;
	if (typeof t.proteinG === 'number' && Number.isFinite(t.proteinG)) out.proteinG = t.proteinG;
	if (typeof t.carbsG === 'number' && Number.isFinite(t.carbsG)) out.carbsG = t.carbsG;
	if (typeof t.fatG === 'number' && Number.isFinite(t.fatG)) out.fatG = t.fatG;
	return out;
}

function mergePartial(base: YehBroProfile, partial: Partial<YehBroProfile>): YehBroProfile {
	return {
		...base,
		...partial,
		version: 1,
		updatedAt: new Date().toISOString(),
		cutPct: partial.cutPct ?? base.cutPct,
		bulkPct: partial.bulkPct ?? base.bulkPct,
		trainingDays: (partial.trainingDays === 4 ? 4 : partial.trainingDays === 3 ? 3 : base.trainingDays) as TrainingDaysPref,
		targets: partial.targets ? parseTargets(partial.targets) : base.targets,
		dietary: partial.dietary ? parseDietary(partial.dietary) : base.dietary,
	};
}

function normalizeParsed(raw: Partial<YehBroProfile> & Partial<StoredFoodOs>): YehBroProfile {
	const base = blankProfile();
	const trainingDays: TrainingDaysPref = raw.trainingDays === 4 ? 4 : raw.trainingDays === 3 ? 3 : 3;
	return {
		version: 1,
		updatedAt: typeof raw.updatedAt === 'string' ? raw.updatedAt : new Date().toISOString(),
		weightKg: typeof raw.weightKg === 'number' ? raw.weightKg : undefined,
		heightCm: typeof raw.heightCm === 'number' ? raw.heightCm : undefined,
		age: typeof raw.age === 'number' ? raw.age : undefined,
		sex: raw.sex === 'male' || raw.sex === 'female' ? raw.sex : undefined,
		goalWeightKg: typeof raw.goalWeightKg === 'number' ? raw.goalWeightKg : undefined,
		activity: raw.activity,
		goal: raw.goal,
		cutPct: typeof raw.cutPct === 'number' ? raw.cutPct : base.cutPct,
		bulkPct: typeof raw.bulkPct === 'number' ? raw.bulkPct : base.bulkPct,
		trainingDays,
		targets: parseTargets(raw.targets),
		dietary: parseDietary(raw.dietary),
	};
}

function readLegacyFoodOs(): YehBroProfile | null {
	try {
		const raw = localStorage.getItem(LEGACY_FOOD_OS_KEY);
		if (!raw) return null;
		const parsed = JSON.parse(raw) as Partial<StoredFoodOs>;
		// Legacy always wrote full DEFAULT_INPUTS merges — treat as a saved profile.
		const stored: StoredFoodOs = { ...DEFAULT_INPUTS, ...parsed };
		stored.trainingDays = stored.trainingDays === 4 ? 4 : 3;
		return fromStoredFoodOs(stored);
	} catch {
		return null;
	}
}

/** Read central profile. Migrates legacy Food Bro key once. Null = never saved. */
export function readProfile(): YehBroProfile | null {
	if (typeof localStorage === 'undefined') return null;
	try {
		const raw = localStorage.getItem(USER_STORAGE_KEY);
		if (raw) {
			const parsed = JSON.parse(raw) as Partial<YehBroProfile> & Partial<StoredFoodOs>;
			return normalizeParsed(parsed);
		}
		const legacy = readLegacyFoodOs();
		if (legacy) {
			writeProfile(legacy);
			return readProfile();
		}
	} catch {
		/* ignore */
	}
	return null;
}

/** Persist profile + mirror Food Bro–compatible slice for older readers. */
export function writeProfile( partial: Partial<YehBroProfile> | YehBroProfile): YehBroProfile {
	const current = readProfile() ?? blankProfile();
	const next = mergePartial(current, partial);
	localStorage.setItem(USER_STORAGE_KEY, JSON.stringify(next));
	const foodOs = toStoredFoodOs(next);
	if (foodOs) {
		localStorage.setItem(LEGACY_FOOD_OS_KEY, JSON.stringify(foodOs));
	}
	return next;
}

export function clearProfile(): void {
	localStorage.removeItem(USER_STORAGE_KEY);
	localStorage.removeItem(LEGACY_FOOD_OS_KEY);
}

/** Run Food Bro calc from a ready profile. */
export function calcFromProfile(profile: YehBroProfile): FoodOsResult | null {
	const stored = toStoredFoodOs(profile);
	if (!stored) return null;
	const adjustment =
		stored.goal === 'cut'
			? -(stored.cutPct / 100)
			: stored.goal === 'lean-bulk'
				? stored.bulkPct / 100
				: 0;
	return calcFoodOs({
		weightKg: stored.weightKg,
		heightCm: stored.heightCm,
		age: stored.age,
		sex: stored.sex,
		activity: stored.activity,
		goal: stored.goal,
		adjustment,
	});
}

export interface EffectiveTargets {
	calories: number;
	proteinG: number;
	carbsG: number;
	fatG: number;
	tdee: number;
	bmr: number;
	source: TargetSource;
	/** Present when user overrides differ from fresh calc. */
	calculated?: {
		calories: number;
		proteinG: number;
		carbsG: number;
		fatG: number;
	};
	why: string[];
	adjustmentPct: number;
	goal: Goal;
}

/**
 * Resolved daily targets. User-entered macros win until cleared;
 * never silently overwritten when source === 'user'.
 */
export function getEffectiveTargets(profile: YehBroProfile): EffectiveTargets | null {
	const result = calcFromProfile(profile);
	if (!result) return null;

	const calculated = {
		calories: result.calories,
		proteinG: result.proteinG,
		carbsG: result.carbsG,
		fatG: result.fatG,
	};

	if (profile.targets.source === 'user' && typeof profile.targets.calories === 'number') {
		const calories = Math.round(profile.targets.calories);
		const proteinG =
			typeof profile.targets.proteinG === 'number'
				? Math.round(profile.targets.proteinG)
				: calculated.proteinG;
		const fatG =
			typeof profile.targets.fatG === 'number' ? Math.round(profile.targets.fatG) : calculated.fatG;
		const carbsG =
			typeof profile.targets.carbsG === 'number'
				? Math.round(profile.targets.carbsG)
				: Math.max(0, Math.round((calories - proteinG * 4 - fatG * 9) / 4));
		return {
			calories,
			proteinG,
			carbsG,
			fatG,
			tdee: result.tdee,
			bmr: result.bmr,
			source: 'user',
			calculated,
			why: [
				...result.why,
				'Using your entered targets — calculated values stay available until you switch back.',
			],
			adjustmentPct: result.adjustmentPct,
			goal: result.goal,
		};
	}

	return {
		...calculated,
		tdee: result.tdee,
		bmr: result.bmr,
		source: 'calculated',
		why: result.why,
		adjustmentPct: result.adjustmentPct,
		goal: result.goal,
	};
}

/** Result-shaped object for coach scaling (uses effective calories). */
export function scaleResultFromProfile(profile: YehBroProfile): FoodOsResult | null {
	const effective = getEffectiveTargets(profile);
	const base = calcFromProfile(profile);
	if (!effective || !base) return null;
	return {
		...base,
		calories: effective.calories,
		proteinG: effective.proteinG,
		carbsG: effective.carbsG,
		fatG: effective.fatG,
		why: effective.why,
	};
}

/** Whitelist internal return paths (open redirect safe). */
export function safeReturnTo(raw: string | null | undefined): string | null {
	if (!raw) return null;
	let path = raw.trim();
	try {
		if (path.startsWith('http://') || path.startsWith('https://')) {
			const u = new URL(path);
			path = u.pathname + u.search + u.hash;
		}
	} catch {
		return null;
	}
	if (!path.startsWith('/') || path.startsWith('//')) return null;
	if (path.includes('://')) return null;
	const ok = SAFE_RETURN_PREFIXES.some((p) => path === p || path.startsWith(`${p}/`) || path.startsWith(`${p}?`) || path.startsWith(`${p}#`));
	return ok ? path : null;
}

export function profileUrl(returnTo?: string | null, opts?: { focus?: string }): string {
	const params = new URLSearchParams();
	const safe = safeReturnTo(returnTo ?? null);
	if (safe) params.set('returnTo', safe);
	if (opts?.focus) params.set('focus', opts.focus);
	const q = params.toString();
	return q ? `/profile?${q}` : '/profile';
}

export function profileSummaryLine(profile: YehBroProfile): string {
	const bits: string[] = [];
	if (profile.weightKg != null) bits.push(`${profile.weightKg} kg`);
	if (profile.heightCm != null) bits.push(`${profile.heightCm} cm`);
	if (profile.age != null) bits.push(`${profile.age}y`);
	if (profile.trainingDays) {
		bits.push(`${profile.trainingDays}-day ${trainingDaysToSplit(profile.trainingDays).toUpperCase()}`);
	}
	return bits.join(' · ');
}
