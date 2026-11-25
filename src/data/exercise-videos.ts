/**
 * Central registry for exercise demo video URLs.
 * Placeholders are null until real links are added — never invent URLs.
 * Plan UI shows a “WATCH EXERCISE VIDEO” control ready for later wiring.
 */

export type ExerciseVideoEntry = {
	/** Stable id matching the prescribed lift name (exact). */
	name: string;
	/** Absolute https URL when available; null = placeholder only. */
	videoUrl: string | null;
};

/** Canonical lift names used in training templates — single source for video links. */
export const EXERCISE_VIDEO_REGISTRY: ExerciseVideoEntry[] = [
	{ name: 'Seated dumbbell lateral raise', videoUrl: null },
	{ name: 'Machine chest fly', videoUrl: null },
	{ name: 'Incline Smith machine press', videoUrl: null },
	{ name: 'Flat machine chest press', videoUrl: null },
	{ name: 'Cable tricep pushdown', videoUrl: null },
	{ name: 'Cable overhead tricep extension', videoUrl: null },
	{ name: 'Seated cable row', videoUrl: null },
	{ name: 'Dumbbell bent-over row', videoUrl: null },
	{ name: 'Barbell bent-over row', videoUrl: null },
	{ name: 'Lat pulldown', videoUrl: null },
	{ name: 'Reverse pec deck', videoUrl: null },
	{ name: 'Dumbbell hammer curl', videoUrl: null },
	{ name: 'Barbell curl', videoUrl: null },
	{ name: 'Lying leg curl', videoUrl: null },
	{ name: 'Leg press', videoUrl: null },
	{ name: 'Leg extension', videoUrl: null },
	{ name: 'Goblet squat', videoUrl: null },
	{ name: 'Seated calf raise', videoUrl: null },
	{ name: 'Machine crunch', videoUrl: null },
	{ name: 'Machine shoulder press', videoUrl: null },
	{ name: 'Cable lateral raise', videoUrl: null },
	{ name: 'Flat dumbbell bench press', videoUrl: null },
	{ name: 'Incline machine chest press', videoUrl: null },
	{ name: 'Tricep pushdown', videoUrl: null },
	{ name: 'Preacher curl', videoUrl: null },
	{ name: 'Seated leg curl', videoUrl: null },
	{ name: 'Hack squat', videoUrl: null },
	{ name: 'Romanian deadlift', videoUrl: null },
	{ name: 'Walking lunges', videoUrl: null },
	{ name: 'Standing calf raise', videoUrl: null },
	{ name: 'Cable crunch', videoUrl: null },
	// Limited-equipment / home variants
	{ name: 'Push-up', videoUrl: null },
	{ name: 'Dumbbell floor press', videoUrl: null },
	{ name: 'Dumbbell shoulder press', videoUrl: null },
	{ name: 'Dumbbell lateral raise', videoUrl: null },
	{ name: 'Overhead dumbbell tricep extension', videoUrl: null },
	{ name: 'One-arm dumbbell row', videoUrl: null },
	{ name: 'Dumbbell Romanian deadlift', videoUrl: null },
	{ name: 'Band pulldown', videoUrl: null },
	{ name: 'Rear-delt reverse fly', videoUrl: null },
	{ name: 'Bodyweight squat', videoUrl: null },
	{ name: 'Dumbbell reverse lunge', videoUrl: null },
	{ name: 'Glute bridge', videoUrl: null },
	{ name: 'Standing single-leg calf raise', videoUrl: null },
	{ name: 'Dead bug', videoUrl: null },
];

const byName = new Map(EXERCISE_VIDEO_REGISTRY.map((e) => [e.name, e.videoUrl]));

/** Lookup placeholder-aware video URL for a prescribed lift name. */
export function videoUrlForExercise(name: string): string | null {
	if (byName.has(name)) return byName.get(name) ?? null;
	return null;
}

/** True when a real https URL is registered (not a placeholder). */
export function hasExerciseVideo(name: string): boolean {
	const url = videoUrlForExercise(name);
	return typeof url === 'string' && /^https:\/\//i.test(url);
}
