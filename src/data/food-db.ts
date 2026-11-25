/**
 * Honest food database for personalised plan meal lines.
 * Values are typical per-100 g / per-100 ml (or per discrete unit) — not invented SKU precision.
 * Prefer generics over branded labels when brand macros are uncertain.
 */

export type FoodBasis = 'g' | 'ml';

export interface FoodMacros {
	kcal: number;
	proteinG: number;
	carbsG: number;
	fatG: number;
	fibreG?: number;
}

export interface FoodEntry {
	id: string;
	/** Customer-facing name on the PDF / shopping list. */
	name: string;
	basis: FoodBasis;
	/** Macros per 100 g or 100 ml (matching basis). */
	per100: FoodMacros;
	/** Discrete items (bars). When set, "N bar(s)" uses this instead of per100. */
	perUnit?: FoodMacros & { grams: number };
	note?: string;
}

/**
 * Core pantry used by coach meal templates.
 * Sources: typical USDA / AU supermarket nutrition panels (rounded).
 */
export const FOOD_DB: Record<string, FoodEntry> = {
	oats: {
		id: 'oats',
		name: 'Oats',
		basis: 'g',
		per100: { kcal: 389, proteinG: 16.9, carbsG: 66.3, fatG: 6.9, fibreG: 10.6 },
	},
	wpi_vanilla: {
		id: 'wpi_vanilla',
		name: 'Whey protein isolate',
		basis: 'g',
		per100: { kcal: 370, proteinG: 85, carbsG: 4, fatG: 1.5, fibreG: 0 },
		note: 'Typical isolate powder (~25 g protein / 30 g scoop)',
	},
	walnuts: {
		id: 'walnuts',
		name: 'Walnuts',
		basis: 'g',
		// Label-style Atwater (~654) with carbs nearer net of fibre for 4/4/9 sanity.
		per100: { kcal: 654, proteinG: 15.2, carbsG: 7, fatG: 65.2, fibreG: 6.7 },
	},
	sf_maple: {
		id: 'sf_maple',
		name: 'Sugar-free maple syrup',
		basis: 'ml',
		per100: { kcal: 12, proteinG: 0, carbsG: 2.5, fatG: 0, fibreG: 0 },
	},
	strawberries: {
		id: 'strawberries',
		name: 'Strawberries',
		basis: 'g',
		per100: { kcal: 32, proteinG: 0.7, carbsG: 7.7, fatG: 0.3, fibreG: 2.0 },
	},
	chicken_breast_cooked: {
		id: 'chicken_breast_cooked',
		name: 'Chicken breast (cooked)',
		basis: 'g',
		per100: { kcal: 165, proteinG: 31, carbsG: 0, fatG: 3.6, fibreG: 0 },
	},
	mexican_rice: {
		id: 'mexican_rice',
		name: 'Microwave Mexican-style rice',
		basis: 'g',
		per100: { kcal: 148, proteinG: 3.2, carbsG: 26.5, fatG: 2.8, fibreG: 1.5 },
		note: 'Typical pouch; swap any cooked rice if preferred',
	},
	carrots_peas_corn: {
		id: 'carrots_peas_corn',
		name: 'Carrots, peas & corn',
		basis: 'g',
		per100: { kcal: 58, proteinG: 2.6, carbsG: 9.5, fatG: 0.6, fibreG: 3.2 },
	},
	peri_mayo: {
		id: 'peri_mayo',
		name: 'Peri mayo',
		basis: 'ml',
		per100: { kcal: 480, proteinG: 1, carbsG: 6, fatG: 50, fibreG: 0 },
	},
	muesli_bar: {
		id: 'muesli_bar',
		name: 'Muesli bar',
		basis: 'g',
		per100: { kcal: 425, proteinG: 6.3, carbsG: 65, fatG: 15, fibreG: 6 },
		perUnit: { grams: 40, kcal: 170, proteinG: 2.5, carbsG: 26, fatG: 6, fibreG: 2.5 },
	},
	kiwi: {
		id: 'kiwi',
		name: 'Kiwi fruit',
		basis: 'g',
		per100: { kcal: 61, proteinG: 1.1, carbsG: 14.7, fatG: 0.5, fibreG: 3.0 },
	},
	puffed_rice: {
		id: 'puffed_rice',
		name: 'Puffed rice cereal',
		basis: 'g',
		per100: { kcal: 378, proteinG: 6, carbsG: 88, fatG: 0.5, fibreG: 1 },
	},
	wpi_choc: {
		id: 'wpi_choc',
		name: 'Whey protein isolate (chocolate)',
		basis: 'g',
		per100: { kcal: 375, proteinG: 82, carbsG: 6, fatG: 2, fibreG: 0 },
	},
	banana: {
		id: 'banana',
		name: 'Banana',
		basis: 'g',
		per100: { kcal: 89, proteinG: 1.1, carbsG: 22.8, fatG: 0.3, fibreG: 2.6 },
	},
	peanut_butter: {
		id: 'peanut_butter',
		name: 'Smooth peanut butter',
		basis: 'g',
		per100: { kcal: 588, proteinG: 25, carbsG: 12, fatG: 50, fibreG: 6 },
	},
	lean_mince_5: {
		id: 'lean_mince_5',
		name: 'Extra lean beef mince (5% fat)',
		basis: 'g',
		per100: { kcal: 137, proteinG: 21, carbsG: 0, fatG: 5, fibreG: 0 },
		note: 'Raw weight as typically logged',
	},
	pasta_dry: {
		id: 'pasta_dry',
		name: 'Dry pasta spirals',
		basis: 'g',
		per100: { kcal: 359, proteinG: 13, carbsG: 72, fatG: 1.5, fibreG: 3 },
	},
	passata: {
		id: 'passata',
		name: 'Tomato passata',
		basis: 'ml',
		per100: { kcal: 34, proteinG: 1.4, carbsG: 5.5, fatG: 0.2, fibreG: 1.5 },
	},
	zucchini: {
		id: 'zucchini',
		name: 'Zucchini',
		basis: 'g',
		per100: { kcal: 17, proteinG: 1.2, carbsG: 3.1, fatG: 0.3, fibreG: 1 },
	},
	mushrooms: {
		id: 'mushrooms',
		name: 'Mushrooms',
		basis: 'g',
		per100: { kcal: 22, proteinG: 3.1, carbsG: 3.3, fatG: 0.3, fibreG: 1 },
	},
	hp_yoghurt: {
		id: 'hp_yoghurt',
		name: 'High-protein yoghurt',
		basis: 'g',
		per100: { kcal: 59, proteinG: 10.1, carbsG: 3.7, fatG: 0.2, fibreG: 0 },
	},
	mixed_berries: {
		id: 'mixed_berries',
		name: 'Frozen mixed berries',
		basis: 'g',
		per100: { kcal: 45, proteinG: 0.8, carbsG: 9, fatG: 0.3, fibreG: 3.5 },
	},
	coconut_water: {
		id: 'coconut_water',
		name: 'Coconut water',
		basis: 'ml',
		per100: { kcal: 19, proteinG: 0.7, carbsG: 3.7, fatG: 0.2, fibreG: 0 },
	},
};

export function getFood(id: string): FoodEntry {
	const food = FOOD_DB[id];
	if (!food) throw new Error(`Unknown food id: ${id}`);
	return food;
}

export interface ParsedFoodAmount {
	qty: number;
	kind: 'g' | 'ml' | 'bar' | 'L';
}

export function parseFoodAmount(amount: string): ParsedFoodAmount | null {
	const trimmed = amount.trim();
	const bar = trimmed.match(/^(\d+(?:\.\d+)?)\s*bars?$/i);
	if (bar) return { qty: Number(bar[1]), kind: 'bar' };
	const litre = trimmed.match(/^(\d+(?:\.\d+)?)\s*L$/i);
	if (litre) return { qty: Number(litre[1]), kind: 'L' };
	const unit = trimmed.match(/^(\d+(?:\.\d+)?)\s*(g|ml)$/i);
	if (unit) return { qty: Number(unit[1]), kind: unit[2].toLowerCase() as 'g' | 'ml' };
	return null;
}

function round1(n: number): number {
	return Math.round(n * 10) / 10;
}

/** Scale food DB macros for a logged portion string. */
export function macrosForFoodAmount(foodId: string, amount: string): FoodMacros & { fibreG: number } {
	const food = getFood(foodId);
	const parsed = parseFoodAmount(amount);
	if (!parsed) {
		throw new Error(`Unparseable amount “${amount}” for food ${foodId}`);
	}

	if (parsed.kind === 'bar') {
		const unit = food.perUnit;
		if (!unit) throw new Error(`Food ${foodId} has no per-bar macros`);
		const n = parsed.qty;
		return {
			kcal: Math.round(unit.kcal * n),
			proteinG: round1(unit.proteinG * n),
			carbsG: round1(unit.carbsG * n),
			fatG: round1(unit.fatG * n),
			fibreG: round1((unit.fibreG ?? 0) * n),
		};
	}

	let gramsOrMl = parsed.qty;
	if (parsed.kind === 'L') gramsOrMl = parsed.qty * 1000;
	if (parsed.kind === 'g' && food.basis !== 'g') {
		// Allow g logged against ml-basis liquids (density ≈ 1).
	}
	if (parsed.kind === 'ml' && food.basis !== 'ml' && !food.perUnit) {
		// ml against g-basis solids — treat 1:1 for sauces logged in ml.
	}

	const factor = gramsOrMl / 100;
	return {
		kcal: Math.round(food.per100.kcal * factor),
		proteinG: round1(food.per100.proteinG * factor),
		carbsG: round1(food.per100.carbsG * factor),
		fatG: round1(food.per100.fatG * factor),
		fibreG: round1((food.per100.fibreG ?? 0) * factor),
	};
}

/** 4/4/9 sanity: |kcal − (4P+4C+9F)| should be small for DB rows. */
export function foodMacroKcalDelta(m: FoodMacros): number {
	return Math.abs(m.kcal - (m.proteinG * 4 + m.carbsG * 4 + m.fatG * 9));
}
