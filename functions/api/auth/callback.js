import { createSession } from '../../_shared/db.js';
import {
    clearSessionCookie,
    exchangeCodeForTokens,
    fetchGoogleUser,
    getBaseUrl,
    json,
    parseCookies,
    sessionCookie
} from '../../_shared/oauth.js';

export async function onRequestGet({ request, env }) {
    try {
        const url = new URL(request.url);
        const code = url.searchParams.get('code');
        const state = url.searchParams.get('state');
        const cookies = parseCookies(request);

        if (!code || !state || state !== cookies.cbj_oauth_state) {
            return json({ error: 'Invalid OAuth callback state' }, { status: 400 });
        }

        const tokens = await exchangeCodeForTokens(request, env, code);
        const user = await fetchGoogleUser(tokens.access_token);
        const session = await createSession(env, user);

        const headers = new Headers({
            Location: getBaseUrl(request, env),
            'Cache-Control': 'no-store'
        });
        headers.append('Set-Cookie', sessionCookie(session.sessionId, session.maxAge));
        headers.append('Set-Cookie', 'cbj_oauth_state=; Path=/; HttpOnly; Secure; SameSite=Lax; Max-Age=0');

        return new Response(null, { status: 302, headers });
    } catch (error) {
        console.error(error);
        const headers = new Headers({ 'Set-Cookie': clearSessionCookie() });
        return json({ error: 'Google OAuth callback failed' }, { status: 500, headers });
    }
}
