/** Browser fixture payload for local demo when Pages Functions / bindings are absent. */

export type ItemStatus = 'pending' | 'approved' | 'rejected' | 'posted' | 'failed';

export interface FixtureItem {
	id: string;
	kind: 'single' | 'carousel';
	status: ItemStatus;
	caption: string;
	angle?: string;
	files: string[];
	slides?: string[];
	mediaUrls: string[];
}

export interface FixtureDay {
	date: string;
	account: string;
	updatedAt: string;
	items: FixtureItem[];
	publishLog?: string[];
}

const DATE = '2026-11-05';

function media(date: string, files: string[]): string[] {
	return files.map(
		(f) =>
			`data:image/svg+xml,${encodeURIComponent(
				`<svg xmlns="http://www.w3.org/2000/svg" width="540" height="675" viewBox="0 0 540 675"><rect width="540" height="675" fill="#0A0A0A"/><rect x="40" y="140" width="460" height="395" rx="14" fill="#121212" stroke="#2a2a28"/><text x="70" y="200" fill="#F2F2F0" font-family="Arial" font-size="22" font-weight="700">YehBro</text><text x="70" y="230" fill="#8A8A86" font-family="Arial" font-size="14">@theyehbro</text><text x="70" y="290" fill="#F2F2F0" font-family="Arial" font-size="18">${f.replace(/\.png$/i, '')}</text><text x="270" y="640" text-anchor="middle" fill="#C8F135" font-family="Arial Black,Arial" font-size="14">FIXTURE</text></svg>`,
			)}`,
	);
}

export function buildFixtureDay(date = DATE): FixtureDay {
	const singles: FixtureItem[] = [
		{
			id: '01',
			kind: 'single',
			status: 'pending',
			angle: 'discipline',
			caption:
				'Motivation is a mood. Standards are a schedule. If the only days you train are the ones that feel inspiring, you do not have a plan — you have a weather report.',
			files: ['01.png'],
			mediaUrls: media(date, ['01.png']),
		},
		{
			id: '02',
			kind: 'single',
			status: 'pending',
			angle: 'food / tracking',
			caption:
				'Guessing your intake for three months and calling it intuitive eating is just unmanaged chaos with better branding.',
			files: ['02.png'],
			mediaUrls: media(date, ['02.png']),
		},
		{
			id: '03',
			kind: 'single',
			status: 'approved',
			angle: 'training',
			caption:
				'Progressive overload is not adding weight every session like a religion. It is earning the next small improvement without wrecking form.',
			files: ['03.png'],
			mediaUrls: media(date, ['03.png']),
		},
		{
			id: '04',
			kind: 'single',
			status: 'rejected',
			angle: 'environment',
			caption: 'Comfort is contagious. So is the opposite — if you let it into the room.',
			files: ['04.png'],
			mediaUrls: media(date, ['04.png']),
		},
		{
			id: '05',
			kind: 'single',
			status: 'posted',
			angle: 'recovery',
			caption: 'You cannot out-program a broken sleep schedule.',
			files: ['05.png'],
			mediaUrls: media(date, ['05.png']),
		},
	];

	const carousels: FixtureItem[] = [
		{
			id: 'C01',
			kind: 'carousel',
			status: 'pending',
			caption:
				'You do not need more random tips. You need an order: train, food, recovery — Yeh Bro System on yehbro.com.',
			files: ['c01-1.png', 'c01-2.png', 'c01-3.png', 'c01-4.png', 'c01-5.png'],
			slides: [
				'You do not need more random tips. You need an order.',
				'Train something you can repeat when life is loud.',
				'Eat calories and protein you can hit on tired days.',
				'Protect sleep and recovery before advanced levers.',
				'Yeh Bro System on yehbro.com — free, coach-grade.',
			],
			mediaUrls: media(date, ['c01-1.png', 'c01-2.png', 'c01-3.png', 'c01-4.png', 'c01-5.png']),
		},
		{
			id: 'C02',
			kind: 'carousel',
			status: 'approved',
			caption:
				'Food Bro is simple: know maintenance, hit protein, make the kitchen honest. Systems beat vibes.',
			files: ['c02-1.png', 'c02-2.png', 'c02-3.png', 'c02-4.png'],
			slides: [
				'Your diet is not a vibe. It is a weekly average.',
				'Learn maintenance before you slash or surplus.',
				'Protein you can repeat beats elite day-one protein.',
				'Fix what sits in the fridge.',
			],
			mediaUrls: media(date, ['c02-1.png', 'c02-2.png', 'c02-3.png', 'c02-4.png']),
		},
	];

	return {
		date,
		account: '@theyehbro',
		updatedAt: new Date().toISOString(),
		items: [...singles, ...carousels],
		publishLog: ['Fixture mode — local demo only.'],
	};
}

export function summarizeDay(day: FixtureDay) {
	const counts = { pending: 0, approved: 0, rejected: 0, posted: 0, failed: 0 };
	for (const item of day.items) {
		if (item.status in counts) counts[item.status as keyof typeof counts]++;
	}
	return { date: day.date, total: day.items.length, ...counts };
}

export const FIXTURE_DATE = DATE;
