import { getSession } from '../../_shared/db.js';
import { getSessionId, json } from '../../_shared/oauth.js';

export async function onRequestGet({ request, env }) {
    const session = await getSession(env, getSessionId(request));

    if (!session) {
        return json({ authenticated: false });
    }

    return json({
        authenticated: true,
        user: {
            sub: session.google_sub,
            email: session.email,
            name: session.name,
            picture: session.picture
        }
    });
}
