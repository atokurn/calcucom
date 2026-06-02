import { getSession, replaceCloudState } from '../../_shared/db.js';
import { getSessionId, json } from '../../_shared/oauth.js';

async function readJson(request) {
    try {
        return await request.json();
    } catch {
        return {};
    }
}

export async function onRequestPost({ request, env }) {
    const session = await getSession(env, getSessionId(request));
    if (!session) return json({ error: 'Unauthorized' }, { status: 401 });

    const body = await readJson(request);
    await replaceCloudState(env, session.google_sub, body);

    return json({
        ok: true,
        pushedAt: new Date().toISOString()
    });
}
