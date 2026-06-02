import { getCloudState, getSession } from '../../_shared/db.js';
import { getSessionId, json } from '../../_shared/oauth.js';

export async function onRequestGet({ request, env }) {
    const session = await getSession(env, getSessionId(request));
    if (!session) return json({ error: 'Unauthorized' }, { status: 401 });

    const data = await getCloudState(env, session.google_sub);

    return json({
        ok: true,
        pulledAt: new Date().toISOString(),
        data
    });
}
