/** Personalised training + nutrition PDF — primary commercial offer. */

export const PDF_OFFER_PRICE_AUD = 4.99;
export const PDF_OFFER_PRICE_LABEL = '$4.99';
export const PDF_OFFER_CURRENCY = 'AUD';

/** Single primary CTA verb — reuse everywhere gold. */
export const PDF_CTA_LABEL = `Get my ${PDF_OFFER_PRICE_LABEL} plan`;

export const PDF_OFFER_NAME = 'Personalised training + nutrition PDF';

export const PDF_UNLOCK_STORAGE_KEY = 'yehbro-pdf-unlock-v1';

/** Post-purchase / print view — new funnel surface (engines reused under the hood). */
export const PDF_PLAN_HREF = '/plan';

/**
 * Optional accountability coaching — checkout upsell only.
 * Never a competing gold CTA in the hero / scroll story.
 */
export const COACHING_UPSELL = {
	name: 'Personalised accountability coaching',
	blurb:
		'Goes far deeper than the PDF — personalised accountability, check-ins, and plan adjustments while you run the block.',
	weeklyAud: 150,
	paidInFullWeeklyAud: 110,
	weeks: 12,
} as const;

export const COACHING_WEEKLY_LABEL = `$${COACHING_UPSELL.weeklyAud}/week`;
export const COACHING_PAID_IN_FULL_WEEKLY_LABEL = `$${COACHING_UPSELL.paidInFullWeeklyAud}/week`;
export const COACHING_PAID_IN_FULL_TOTAL_AUD =
	COACHING_UPSELL.paidInFullWeeklyAud * COACHING_UPSELL.weeks;
export const COACHING_PAID_IN_FULL_TOTAL_LABEL = `$${COACHING_PAID_IN_FULL_TOTAL_AUD}`;

/** Cloudflare / Stripe secrets required for live checkout (never invent values). */
export const PDF_CHECKOUT_REQUIRED_SECRETS = [
	'STRIPE_SECRET_KEY',
	'STRIPE_PRICE_ID_PDF_AUD',
	'STRIPE_PRICE_ID_COACHING_WEEKLY_AUD',
	'STRIPE_PRICE_ID_COACHING_12WK_AUD',
] as const;
