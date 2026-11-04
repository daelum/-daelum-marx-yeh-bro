import { clearSessionCookie, requestIsHttps } from '../_lib/auth';
import { json } from '../_lib/responses';
import type { Env } from '../_lib/types';

export const onRequestPost: PagesFunction<Env> = async (context) => {
	const secure = requestIsHttps(context.request);
	return json(
		{ ok: true },
		{
			headers: {
				'Set-Cookie': clearSessionCookie({ secure }),
			},
		},
	);
};
