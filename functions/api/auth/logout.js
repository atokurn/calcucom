import { deleteSession } from '../../_shared/db.js';
import { clearSessionCookie, getSessionId, json } from '../../_shared/oauth.js';

export async function onRequestPost({ request, env }) {
    await deleteSession(env, getSessionId(request));
    return json({ ok: true }, {
        headers: { 'Set-Cookie': clearSessionCookie() }
    });
}

export async function onRequestGet({ request, env }) {
    await deleteSession(env, getSessionId(request));
    return new Response(null, {
        status: 302,
        headers: {
            Location: '/',
            'Set-Cookie': clearSessionCookie(),
            'Cache-Control': 'no-store'
        }
    });
}
