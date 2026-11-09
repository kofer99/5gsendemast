// POST /api/score (Eintrag melden) und DELETE /api/score (Eintrag löschen) – Cloudflare Pages Function (DESIGN.md §5)
// Umgebung: DB (D1-Binding), IP_SALT (Secret für die IP-Prüfsumme).
import { d1Store } from '../_lib/store.js';
import { postScore, deleteScore, json } from '../_lib/handlers.js';

const MAX_BODY = 2048;

function tooBig(request) {
  return Number(request.headers.get('content-length') || 0) > MAX_BODY;
}

export async function onRequestPost({ request, env }) {
  if (!env.DB) return json({ error: 'offline', reason: 'Datenbank nicht verbunden.' }, 503);
  if (tooBig(request)) return json({ error: 'invalid', reason: 'Anfrage zu groß.' }, 413);
  return postScore({ request, store: d1Store(env.DB), salt: env.IP_SALT });
}

export async function onRequestDelete({ request, env }) {
  if (!env.DB) return json({ error: 'offline', reason: 'Datenbank nicht verbunden.' }, 503);
  if (tooBig(request)) return json({ error: 'invalid', reason: 'Anfrage zu groß.' }, 413);
  return deleteScore({ request, store: d1Store(env.DB) });
}
