import type { DayManifest, DaySummary, QueueItem } from './types';

const FIXTURE_DATE = '2026-11-05';

function single(
	id: string,
	status: QueueItem['status'],
	angle: string,
	caption: string,
): QueueItem {
	return {
		id,
		kind: 'single',
		status,
		angle,
		caption,
		files: [`${id}.png`],
	};
}

function carousel(
	id: string,
	status: QueueItem['status'],
	caption: string,
	slides: string[],
): QueueItem {
	const files = slides.map((_, i) => `${id.toLowerCase()}-${i + 1}.png`);
	return {
		id,
		kind: 'carousel',
		status,
		caption,
		files,
		slides,
	};
}

export function fixtureDays(): DaySummary[] {
	const day = fixtureDay(FIXTURE_DATE);
	return [summarize(day)];
}

export function fixtureDay(date: string): DayManifest {
	const items: QueueItem[] = [
		single(
			'01',
			'pending',
			'discipline',
			'Motivation is a mood. Standards are a schedule. If the only days you train are the ones that feel inspiring, you do not have a plan — you have a weather report.',
		),
		single(
			'02',
			'pending',
			'food / tracking',
			'Guessing your intake for three months and calling it intuitive eating is just unmanaged chaos with better branding. Track until you can see the pattern.',
		),
		single(
			'03',
			'approved',
			'training',
			'Progressive overload is not adding weight every session like a religion. It is earning the next small improvement without wrecking form.',
		),
		single(
			'04',
			'rejected',
			'environment',
			'The people who keep offering you "just one" are not evil. They are comfortable. Comfort is contagious.',
		),
		single(
			'05',
			'posted',
			'recovery',
			'You cannot out-program a broken sleep schedule. Fancy splits look smart on paper while a tired nervous system quietly deletes the adaptation.',
		),
		carousel(
			'C01',
			'pending',
			'You do not need more random tips. You need an order: train you can repeat, food you can hit, recovery you protect — then advanced talk later. Yeh Bro System on yehbro.com.',
			[
				'You do not need more random tips. You need an order.',
				'Train something you can repeat when life is loud.',
				'Eat calories and protein you can hit on tired days.',
				'Protect sleep and recovery before advanced levers.',
				'Yeh Bro System on yehbro.com — free, coach-grade.',
			],
		),
		carousel(
			'C02',
			'approved',
			'Food Bro is simple: know maintenance, hit protein, make the kitchen honest, adjust weekly averages. Systems beat vibes. More on yehbro.com.',
			[
				'Your diet is not a vibe. It is a weekly average.',
				'Learn maintenance before you slash or surplus.',
				'Protein you can repeat beats elite day-one protein.',
				'Fix what sits in the fridge.',
			],
		),
	];

	return {
		date: date || FIXTURE_DATE,
		account: '@theyehbro',
		updatedAt: new Date().toISOString(),
		items: date && date !== FIXTURE_DATE ? [] : items,
		publishLog: ['Fixture mode — no live Zernio/R2 writes.'],
	};
}

export function summarize(day: DayManifest): DaySummary {
	const counts = { pending: 0, approved: 0, rejected: 0, posted: 0, failed: 0 };
	for (const item of day.items) {
		if (item.status in counts) counts[item.status as keyof typeof counts]++;
	}
	return {
		date: day.date,
		total: day.items.length,
		...counts,
	};
}

/** Dark SVG tweet-card placeholder for fixture media. */
export function fixtureSvg(label: string): Uint8Array {
	const safe = label
		.replace(/&/g, '&amp;')
		.replace(/</g, '&lt;')
		.replace(/>/g, '&gt;')
		.replace(/"/g, '&quot;')
		.slice(0, 48);
	const svg = `<?xml version="1.0" encoding="UTF-8"?>
<svg xmlns="http://www.w3.org/2000/svg" width="1080" height="1350" viewBox="0 0 1080 1350">
  <rect width="1080" height="1350" fill="#0A0A0A"/>
  <rect x="80" y="280" width="920" height="790" rx="28" fill="#121212" stroke="#2a2a28" stroke-width="2"/>
  <circle cx="180" cy="380" r="48" fill="#1a1a18"/>
  <text x="250" y="370" fill="#F2F2F0" font-family="Arial,sans-serif" font-size="36" font-weight="700">YehBro</text>
  <text x="250" y="415" fill="#8A8A86" font-family="Arial,sans-serif" font-size="26">@theyehbro</text>
  <text x="140" y="560" fill="#F2F2F0" font-family="Arial,sans-serif" font-size="42">${safe}</text>
  <text x="540" y="1260" text-anchor="middle" fill="#C8F135" font-family="Arial Black,Arial,sans-serif" font-size="28">FIXTURE</text>
</svg>`;
	return new TextEncoder().encode(svg);
}

export const FIXTURE_DEFAULT_DATE = FIXTURE_DATE;
