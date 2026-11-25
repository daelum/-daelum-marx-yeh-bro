/**
 * Controlled exercise library for AI / rule-based training personalisation.
 * Selections MUST come from this list only — never invent exercises or video URLs.
 */

import { videoUrlForExercise } from './exercise-videos';

export type LimbDemand =
	| 'none'
	| 'bilateral-arms'
	| 'unilateral-arm'
	| 'bilateral-legs'
	| 'unilateral-leg'
	| 'core';

export type EquipmentTag = 'machine' | 'cable' | 'barbell' | 'dumbbell' | 'bodyweight' | 'band';

export interface LibraryExercise {
	id: string;
	name: string;
	/** Primary movement pattern / region. */
	pattern:
		| 'horizontal-press'
		| 'incline-press'
		| 'shoulder-press'
		| 'lateral-raise'
		| 'chest-fly'
		| 'tricep'
		| 'horizontal-row'
		| 'vertical-pull'
		| 'rear-delt'
		| 'bicep'
		| 'hip-hinge'
		| 'knee-dominant'
		| 'leg-curl'
		| 'leg-extension'
		| 'calf'
		| 'core';
	equipment: EquipmentTag[];
	limbDemand: LimbDemand;
	/** True if deep knee flexion is typical. */
	deepKneeFlexion?: boolean;
	/** True if both hands must share a fixed bar / machine handles simultaneously. */
	requiresTwoHands?: boolean;
	defaultSets: string;
	defaultReps: string;
	defaultRest: string;
	cue: string;
	/** Home / limited-equipment friendly. */
	homeOk?: boolean;
}

function ex(
	partial: Omit<LibraryExercise, 'id'> & { id?: string },
): LibraryExercise {
	const id =
		partial.id ??
		partial.name
			.toLowerCase()
			.replace(/[^a-z0-9]+/g, '-')
			.replace(/^-|-$/g, '');
	return { ...partial, id };
}

/** Full controlled catalogue — AI may only pick from these ids/names. */
export const EXERCISE_LIBRARY: LibraryExercise[] = [
	// Push / chest / shoulders / triceps
	ex({
		name: 'Incline Smith machine press',
		pattern: 'incline-press',
		equipment: ['machine', 'barbell'],
		limbDemand: 'bilateral-arms',
		requiresTwoHands: true,
		defaultSets: '3',
		defaultReps: '6–12',
		defaultRest: '2–3 min',
		cue: 'Wrists stacked; stop just short of locking out hard.',
	}),
	ex({
		name: 'Flat machine chest press',
		pattern: 'horizontal-press',
		equipment: ['machine'],
		limbDemand: 'bilateral-arms',
		requiresTwoHands: true,
		defaultSets: '2',
		defaultReps: '10–15',
		defaultRest: '90–120s',
		cue: 'Full controlled range; leave 1–2 reps in reserve.',
	}),
	ex({
		name: 'Flat dumbbell bench press',
		pattern: 'horizontal-press',
		equipment: ['dumbbell'],
		limbDemand: 'bilateral-arms',
		requiresTwoHands: true,
		defaultSets: '3',
		defaultReps: '6–12',
		defaultRest: '2–3 min',
		cue: 'Shoulder blades set; controlled descent.',
		homeOk: true,
	}),
	ex({
		name: 'One-arm dumbbell floor press',
		pattern: 'horizontal-press',
		equipment: ['dumbbell'],
		limbDemand: 'unilateral-arm',
		requiresTwoHands: false,
		defaultSets: '3',
		defaultReps: '8–12',
		defaultRest: '90–120s',
		cue: 'Brace hard; press one arm while the other stays safe. Match sides only if both are cleared.',
		homeOk: true,
	}),
	ex({
		name: 'One-arm cable chest press',
		pattern: 'horizontal-press',
		equipment: ['cable'],
		limbDemand: 'unilateral-arm',
		requiresTwoHands: false,
		defaultSets: '3',
		defaultReps: '8–12',
		defaultRest: '90–120s',
		cue: 'Stagger stance; press from mid-chest without rotating the ribs hard.',
	}),
	ex({
		name: 'Machine chest fly',
		pattern: 'chest-fly',
		equipment: ['machine'],
		limbDemand: 'bilateral-arms',
		requiresTwoHands: true,
		defaultSets: '3',
		defaultReps: '8–15',
		defaultRest: '60–90s',
		cue: 'Soft elbows; squeeze at the stretch, don’t bounce.',
	}),
	ex({
		name: 'One-arm cable fly',
		pattern: 'chest-fly',
		equipment: ['cable'],
		limbDemand: 'unilateral-arm',
		requiresTwoHands: false,
		defaultSets: '3',
		defaultReps: '10–15',
		defaultRest: '60–90s',
		cue: 'Sweep across the body; control the return.',
	}),
	ex({
		name: 'Dumbbell floor press',
		pattern: 'horizontal-press',
		equipment: ['dumbbell'],
		limbDemand: 'bilateral-arms',
		requiresTwoHands: true,
		defaultSets: '3',
		defaultReps: '6–12',
		defaultRest: '2–3 min',
		cue: 'Upper arms kiss the floor; press up without flaring hard.',
		homeOk: true,
	}),
	ex({
		name: 'Push-up',
		pattern: 'horizontal-press',
		equipment: ['bodyweight'],
		limbDemand: 'bilateral-arms',
		requiresTwoHands: true,
		defaultSets: '3',
		defaultReps: '8–15',
		defaultRest: '90–120s',
		cue: 'Body straight; full range you can own. Knees-down if needed.',
		homeOk: true,
	}),
	ex({
		name: 'One-arm elevated push-up',
		pattern: 'horizontal-press',
		equipment: ['bodyweight'],
		limbDemand: 'unilateral-arm',
		requiresTwoHands: false,
		defaultSets: '3',
		defaultReps: '6–10',
		defaultRest: '90–120s',
		cue: 'Working hand on a stable surface; non-working side supported safely. Only if cleared.',
		homeOk: true,
	}),
	ex({
		name: 'Machine shoulder press',
		pattern: 'shoulder-press',
		equipment: ['machine'],
		limbDemand: 'bilateral-arms',
		requiresTwoHands: true,
		defaultSets: '2',
		defaultReps: '10–15',
		defaultRest: '90–120s',
		cue: 'Don’t flare ribs; stop short of pain at the bottom.',
	}),
	ex({
		name: 'Dumbbell shoulder press',
		pattern: 'shoulder-press',
		equipment: ['dumbbell'],
		limbDemand: 'bilateral-arms',
		requiresTwoHands: true,
		defaultSets: '3',
		defaultReps: '8–12',
		defaultRest: '90–120s',
		cue: 'Ribs down; press to lockout without shrugging.',
		homeOk: true,
	}),
	ex({
		name: 'One-arm dumbbell shoulder press',
		pattern: 'shoulder-press',
		equipment: ['dumbbell'],
		limbDemand: 'unilateral-arm',
		requiresTwoHands: false,
		defaultSets: '3',
		defaultReps: '8–12',
		defaultRest: '90–120s',
		cue: 'Brace the torso; press one arm only. Skip if overhead is not cleared.',
		homeOk: true,
	}),
	ex({
		name: 'Seated dumbbell lateral raise',
		pattern: 'lateral-raise',
		equipment: ['dumbbell'],
		limbDemand: 'bilateral-arms',
		requiresTwoHands: true,
		defaultSets: '3',
		defaultReps: '8–15',
		defaultRest: '60–90s',
		cue: 'Lead with elbows; light enough to control the top.',
		homeOk: true,
	}),
	ex({
		name: 'Cable lateral raise',
		pattern: 'lateral-raise',
		equipment: ['cable'],
		limbDemand: 'unilateral-arm',
		requiresTwoHands: false,
		defaultSets: '3',
		defaultReps: '6–12',
		defaultRest: '60–90s',
		cue: 'Lead with the elbow; light and strict.',
	}),
	ex({
		name: 'Dumbbell lateral raise',
		pattern: 'lateral-raise',
		equipment: ['dumbbell'],
		limbDemand: 'unilateral-arm',
		requiresTwoHands: false,
		defaultSets: '3',
		defaultReps: '10–15',
		defaultRest: '60–90s',
		cue: 'Soft elbows; stop at shoulder height. Can be run one arm at a time.',
		homeOk: true,
	}),
	ex({
		name: 'Cable tricep pushdown',
		pattern: 'tricep',
		equipment: ['cable'],
		limbDemand: 'bilateral-arms',
		requiresTwoHands: true,
		defaultSets: '2',
		defaultReps: '6–12',
		defaultRest: '60–90s',
		cue: 'Pin elbows to ribs; finish with a hard squeeze.',
	}),
	ex({
		name: 'Tricep pushdown',
		pattern: 'tricep',
		equipment: ['cable'],
		limbDemand: 'bilateral-arms',
		requiresTwoHands: true,
		defaultSets: '3',
		defaultReps: '8–12',
		defaultRest: '60–90s',
		cue: 'Elbows still; full extension without shrugging.',
	}),
	ex({
		name: 'One-arm cable pushdown',
		pattern: 'tricep',
		equipment: ['cable'],
		limbDemand: 'unilateral-arm',
		requiresTwoHands: false,
		defaultSets: '3',
		defaultReps: '8–12',
		defaultRest: '60–90s',
		cue: 'Elbow pinned; finish with a squeeze. Working arm only.',
	}),
	ex({
		name: 'Cable overhead tricep extension',
		pattern: 'tricep',
		equipment: ['cable'],
		limbDemand: 'bilateral-arms',
		requiresTwoHands: true,
		defaultSets: '3',
		defaultReps: '8–15',
		defaultRest: '60–90s',
		cue: 'Upper arms stay still; stretch at the bottom.',
	}),
	ex({
		name: 'Overhead dumbbell tricep extension',
		pattern: 'tricep',
		equipment: ['dumbbell'],
		limbDemand: 'unilateral-arm',
		requiresTwoHands: false,
		defaultSets: '3',
		defaultReps: '8–12',
		defaultRest: '60–90s',
		cue: 'Elbows high; stretch at the bottom. One-arm friendly.',
		homeOk: true,
	}),
	// Pull
	ex({
		name: 'Seated cable row',
		pattern: 'horizontal-row',
		equipment: ['cable'],
		limbDemand: 'bilateral-arms',
		requiresTwoHands: true,
		defaultSets: '3',
		defaultReps: '6–12',
		defaultRest: '90–120s',
		cue: 'Pull to lower ribs; pause briefly at contraction.',
	}),
	ex({
		name: 'One-arm cable row',
		pattern: 'horizontal-row',
		equipment: ['cable'],
		limbDemand: 'unilateral-arm',
		requiresTwoHands: false,
		defaultSets: '3',
		defaultReps: '8–12',
		defaultRest: '90–120s',
		cue: 'Brace; pull elbow to hip without twisting hard.',
	}),
	ex({
		name: 'Dumbbell bent-over row',
		pattern: 'horizontal-row',
		equipment: ['dumbbell'],
		limbDemand: 'bilateral-arms',
		requiresTwoHands: true,
		defaultSets: '2',
		defaultReps: '8–12',
		defaultRest: '90–120s',
		cue: 'Flat back; drive elbows toward hips.',
		homeOk: true,
	}),
	ex({
		name: 'Barbell bent-over row',
		pattern: 'horizontal-row',
		equipment: ['barbell'],
		limbDemand: 'bilateral-arms',
		requiresTwoHands: true,
		defaultSets: '3',
		defaultReps: '5–10',
		defaultRest: '2–3 min',
		cue: 'Pronated grip; torso stays braced — no bounce.',
	}),
	ex({
		name: 'One-arm dumbbell row',
		pattern: 'horizontal-row',
		equipment: ['dumbbell'],
		limbDemand: 'unilateral-arm',
		requiresTwoHands: false,
		defaultSets: '3',
		defaultReps: '8–12',
		defaultRest: '90–120s',
		cue: 'Flat back; pull elbow to hip.',
		homeOk: true,
	}),
	ex({
		name: 'Lat pulldown',
		pattern: 'vertical-pull',
		equipment: ['cable', 'machine'],
		limbDemand: 'bilateral-arms',
		requiresTwoHands: true,
		defaultSets: '2',
		defaultReps: '8–15',
		defaultRest: '90–120s',
		cue: 'Pull to upper chest; control the eccentric.',
	}),
	ex({
		name: 'One-arm lat pulldown',
		pattern: 'vertical-pull',
		equipment: ['cable'],
		limbDemand: 'unilateral-arm',
		requiresTwoHands: false,
		defaultSets: '3',
		defaultReps: '8–12',
		defaultRest: '90–120s',
		cue: 'Pull elbow to ribcage; control the return.',
	}),
	ex({
		name: 'Band pulldown',
		pattern: 'vertical-pull',
		equipment: ['band'],
		limbDemand: 'bilateral-arms',
		requiresTwoHands: true,
		defaultSets: '3',
		defaultReps: '8–12',
		defaultRest: '2–3 min',
		cue: 'Pull elbows down to ribs; control the return.',
		homeOk: true,
	}),
	ex({
		name: 'One-arm band pulldown',
		pattern: 'vertical-pull',
		equipment: ['band'],
		limbDemand: 'unilateral-arm',
		requiresTwoHands: false,
		defaultSets: '3',
		defaultReps: '8–12',
		defaultRest: '90–120s',
		cue: 'Anchor the band high; pull one elbow to the ribcage.',
		homeOk: true,
	}),
	ex({
		name: 'Reverse pec deck',
		pattern: 'rear-delt',
		equipment: ['machine'],
		limbDemand: 'bilateral-arms',
		requiresTwoHands: true,
		defaultSets: '2',
		defaultReps: '10–20',
		defaultRest: '60–90s',
		cue: 'Think “elbows out”; light weight, clean reps.',
	}),
	ex({
		name: 'Rear-delt reverse fly',
		pattern: 'rear-delt',
		equipment: ['dumbbell'],
		limbDemand: 'bilateral-arms',
		requiresTwoHands: true,
		defaultSets: '3',
		defaultReps: '12–15',
		defaultRest: '60–90s',
		cue: 'Slight bend in elbows; squeeze shoulder blades.',
		homeOk: true,
	}),
	ex({
		name: 'One-arm rear-delt cable fly',
		pattern: 'rear-delt',
		equipment: ['cable'],
		limbDemand: 'unilateral-arm',
		requiresTwoHands: false,
		defaultSets: '3',
		defaultReps: '12–15',
		defaultRest: '60–90s',
		cue: 'Sweep the working arm out; light and strict.',
	}),
	ex({
		name: 'Dumbbell hammer curl',
		pattern: 'bicep',
		equipment: ['dumbbell'],
		limbDemand: 'unilateral-arm',
		requiresTwoHands: false,
		defaultSets: '3',
		defaultReps: '6–12',
		defaultRest: '60–90s',
		cue: 'Neutral grip; no swinging. One arm at a time is fine.',
		homeOk: true,
	}),
	ex({
		name: 'Barbell curl',
		pattern: 'bicep',
		equipment: ['barbell'],
		limbDemand: 'bilateral-arms',
		requiresTwoHands: true,
		defaultSets: '2',
		defaultReps: '8–12',
		defaultRest: '60–90s',
		cue: 'Elbows pinned; stop short of cheating the last reps.',
	}),
	ex({
		name: 'Preacher curl',
		pattern: 'bicep',
		equipment: ['machine', 'dumbbell'],
		limbDemand: 'bilateral-arms',
		requiresTwoHands: true,
		defaultSets: '3',
		defaultReps: '8–12',
		defaultRest: '60–90s',
		cue: 'Chest on pad; no hip drive.',
	}),
	ex({
		name: 'One-arm preacher curl',
		pattern: 'bicep',
		equipment: ['dumbbell'],
		limbDemand: 'unilateral-arm',
		requiresTwoHands: false,
		defaultSets: '3',
		defaultReps: '8–12',
		defaultRest: '60–90s',
		cue: 'Support the working arm; no swing.',
	}),
	// Legs / hinge / core
	ex({
		name: 'Lying leg curl',
		pattern: 'leg-curl',
		equipment: ['machine'],
		limbDemand: 'bilateral-legs',
		deepKneeFlexion: true,
		defaultSets: '3',
		defaultReps: '8–12',
		defaultRest: '90–120s',
		cue: 'Hips glued down; squeeze at the top.',
	}),
	ex({
		name: 'Seated leg curl',
		pattern: 'leg-curl',
		equipment: ['machine'],
		limbDemand: 'bilateral-legs',
		deepKneeFlexion: true,
		defaultSets: '3',
		defaultReps: '8–12',
		defaultRest: '90–120s',
		cue: 'Control both directions; no bouncing.',
	}),
	ex({
		name: 'Single-leg lying curl',
		pattern: 'leg-curl',
		equipment: ['machine'],
		limbDemand: 'unilateral-leg',
		deepKneeFlexion: true,
		defaultSets: '3',
		defaultReps: '8–12',
		defaultRest: '90–120s',
		cue: 'Work the cleared side; stop if the limited knee complains.',
	}),
	ex({
		name: 'Leg press',
		pattern: 'knee-dominant',
		equipment: ['machine'],
		limbDemand: 'bilateral-legs',
		deepKneeFlexion: true,
		defaultSets: '2',
		defaultReps: '8–12',
		defaultRest: '2–3 min',
		cue: 'Feet mid-platform; don’t bounce out of the hole.',
	}),
	ex({
		name: 'Single-leg press',
		pattern: 'knee-dominant',
		equipment: ['machine'],
		limbDemand: 'unilateral-leg',
		deepKneeFlexion: true,
		defaultSets: '3',
		defaultReps: '8–12',
		defaultRest: '2–3 min',
		cue: 'Shorter range if needed; stop above a painful depth.',
	}),
	ex({
		name: 'Leg extension',
		pattern: 'leg-extension',
		equipment: ['machine'],
		limbDemand: 'bilateral-legs',
		deepKneeFlexion: false,
		defaultSets: '3',
		defaultReps: '10–20',
		defaultRest: '60–90s',
		cue: 'Control the lockout; no kicking.',
	}),
	ex({
		name: 'Single-leg extension',
		pattern: 'leg-extension',
		equipment: ['machine'],
		limbDemand: 'unilateral-leg',
		deepKneeFlexion: false,
		defaultSets: '3',
		defaultReps: '10–15',
		defaultRest: '60–90s',
		cue: 'Light and controlled; stop short of pain.',
	}),
	ex({
		name: 'Goblet squat',
		pattern: 'knee-dominant',
		equipment: ['dumbbell'],
		limbDemand: 'bilateral-legs',
		deepKneeFlexion: true,
		defaultSets: '2',
		defaultReps: '10–15',
		defaultRest: '90–120s',
		cue: 'Elbows inside knees; sit between the hips.',
		homeOk: true,
	}),
	ex({
		name: 'Box squat to parallel',
		pattern: 'knee-dominant',
		equipment: ['dumbbell', 'bodyweight'],
		limbDemand: 'bilateral-legs',
		deepKneeFlexion: false,
		defaultSets: '3',
		defaultReps: '8–12',
		defaultRest: '2–3 min',
		cue: 'Sit to a box at a depth you own; stand without bouncing.',
		homeOk: true,
	}),
	ex({
		name: 'Hack squat',
		pattern: 'knee-dominant',
		equipment: ['machine'],
		limbDemand: 'bilateral-legs',
		deepKneeFlexion: true,
		defaultSets: '3',
		defaultReps: '8–12',
		defaultRest: '2–3 min',
		cue: 'Depth you own; knees track over toes.',
	}),
	ex({
		name: 'Romanian deadlift',
		pattern: 'hip-hinge',
		equipment: ['barbell'],
		limbDemand: 'bilateral-legs',
		deepKneeFlexion: false,
		defaultSets: '3',
		defaultReps: '8–12',
		defaultRest: '2–3 min',
		cue: 'Hinge at hips; soft knees; bar close to legs.',
	}),
	ex({
		name: 'Dumbbell Romanian deadlift',
		pattern: 'hip-hinge',
		equipment: ['dumbbell'],
		limbDemand: 'bilateral-legs',
		deepKneeFlexion: false,
		defaultSets: '3',
		defaultReps: '8–12',
		defaultRest: '2–3 min',
		cue: 'Hinge; feel hamstrings stretch; don’t round hard.',
		homeOk: true,
	}),
	ex({
		name: 'Walking lunges',
		pattern: 'knee-dominant',
		equipment: ['dumbbell', 'bodyweight'],
		limbDemand: 'unilateral-leg',
		deepKneeFlexion: true,
		defaultSets: '2',
		defaultReps: '10–12 / leg',
		defaultRest: '90–120s',
		cue: 'Tall torso; front knee tracks over mid-foot.',
		homeOk: true,
	}),
	ex({
		name: 'Dumbbell reverse lunge',
		pattern: 'knee-dominant',
		equipment: ['dumbbell'],
		limbDemand: 'unilateral-leg',
		deepKneeFlexion: true,
		defaultSets: '2',
		defaultReps: '8–12 / leg',
		defaultRest: '90–120s',
		cue: 'Step back; front knee tracks mid-foot.',
		homeOk: true,
	}),
	ex({
		name: 'Glute bridge',
		pattern: 'hip-hinge',
		equipment: ['bodyweight'],
		limbDemand: 'bilateral-legs',
		deepKneeFlexion: false,
		defaultSets: '3',
		defaultReps: '10–15',
		defaultRest: '60–90s',
		cue: 'Squeeze glutes at the top; don’t over-arch lumbar.',
		homeOk: true,
	}),
	ex({
		name: 'Seated calf raise',
		pattern: 'calf',
		equipment: ['machine'],
		limbDemand: 'bilateral-legs',
		defaultSets: '3',
		defaultReps: '8–15',
		defaultRest: '60–90s',
		cue: 'Full stretch at the bottom; pause at the top.',
	}),
	ex({
		name: 'Standing calf raise',
		pattern: 'calf',
		equipment: ['machine', 'bodyweight'],
		limbDemand: 'bilateral-legs',
		defaultSets: '3',
		defaultReps: '8–15',
		defaultRest: '60–90s',
		cue: 'Full stretch; pause at the top.',
		homeOk: true,
	}),
	ex({
		name: 'Standing single-leg calf raise',
		pattern: 'calf',
		equipment: ['bodyweight'],
		limbDemand: 'unilateral-leg',
		defaultSets: '3',
		defaultReps: '10–15',
		defaultRest: '60s',
		cue: 'Full stretch; pause at the top.',
		homeOk: true,
	}),
	ex({
		name: 'Machine crunch',
		pattern: 'core',
		equipment: ['machine'],
		limbDemand: 'core',
		defaultSets: '3',
		defaultReps: '8–15',
		defaultRest: '60s',
		cue: 'Round through the ribs; don’t yank with arms.',
	}),
	ex({
		name: 'Cable crunch',
		pattern: 'core',
		equipment: ['cable'],
		limbDemand: 'core',
		defaultSets: '3',
		defaultReps: '10–15',
		defaultRest: '60s',
		cue: 'Crunch the ribs toward the hips.',
	}),
	ex({
		name: 'Dead bug',
		pattern: 'core',
		equipment: ['bodyweight'],
		limbDemand: 'core',
		defaultSets: '3',
		defaultReps: '8–10 / side',
		defaultRest: '60s',
		cue: 'Low back pressed down; slow and controlled.',
		homeOk: true,
	}),
];

export function libraryByName(name: string): LibraryExercise | undefined {
	const key = name.trim().toLowerCase();
	return EXERCISE_LIBRARY.find((e) => e.name.toLowerCase() === key);
}

export function libraryById(id: string): LibraryExercise | undefined {
	return EXERCISE_LIBRARY.find((e) => e.id === id);
}

/** Compact catalogue for LLM prompts (ids + constraints only). */
export function exerciseLibraryForPrompt(opts?: {
	equipment?: 'full-gym' | 'limited';
}): Array<{
	id: string;
	name: string;
	pattern: string;
	limbDemand: LimbDemand;
	requiresTwoHands?: boolean;
	deepKneeFlexion?: boolean;
	equipment: EquipmentTag[];
}> {
	const list =
		opts?.equipment === 'limited'
			? EXERCISE_LIBRARY.filter((e) => e.homeOk)
			: EXERCISE_LIBRARY;
	return list.map((e) => ({
		id: e.id,
		name: e.name,
		pattern: e.pattern,
		limbDemand: e.limbDemand,
		requiresTwoHands: e.requiresTwoHands,
		deepKneeFlexion: e.deepKneeFlexion,
		equipment: e.equipment,
	}));
}

export function liftFromLibrary(
	entry: LibraryExercise,
	overrides?: { sets?: string; reps?: string; rest?: string; cue?: string },
) {
	return {
		name: entry.name,
		sets: overrides?.sets ?? entry.defaultSets,
		reps: overrides?.reps ?? entry.defaultReps,
		rest: overrides?.rest ?? entry.defaultRest,
		cue: overrides?.cue ?? entry.cue,
		videoUrl: videoUrlForExercise(entry.name),
	};
}
