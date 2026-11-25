/**
 * Shared helpers for plan email delivery (client + docs).
 * Secrets (Cloudflare Pages / Cursor app secrets):
 *   - RESEND_API_KEY — Resend API key
 *   - PLAN_EMAIL_FROM — verified sender, e.g. "Yeh Bro Plans <plans@yehbro.com>"
 * Optional:
 *   - PLAN_EMAIL_REPLY_TO — reply-to address
 *   - OPENAI_API_KEY — limitation-aware training personalisation
 *
 * Without these, the API returns mode "unbound" / sent:false — never a false “sent”.
 */

import type { PersonalPlanDoc } from './personal-plan';

export const PLAN_EMAIL_REQUIRED_SECRETS = ['RESEND_API_KEY', 'PLAN_EMAIL_FROM'] as const;

export const PLAN_EMAIL_SENT_STORAGE_KEY = 'yehbro-plan-email-sent-v1';

export type PlanEmailPayload = {
	email: string;
	firstName?: string;
	/** Filename suggestion for the attachment. */
	filename?: string;
	/**
	 * Full plan document for the dedicated coaching PDF (preferred).
	 * When present, the email attachment uses the same pdf-lib generator as Download.
	 */
	planDoc?: PersonalPlanDoc;
	/** Legacy plain-text fallback if planDoc is omitted. */
	planText?: string;
	/** Dedupe key (e.g. unlock session / profile hash) — server echoes; client stores. */
	dedupeKey: string;
};

export type PlanEmailResponse = {
	ok: boolean;
	sent: boolean;
	mode: 'live' | 'unbound' | 'error' | 'duplicate';
	message: string;
	requiredSecrets?: string[];
	dedupeKey?: string;
};
