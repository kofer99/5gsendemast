// GET /api/leaderboard?range=week|all – Cloudflare Pages Function (DESIGN.md §5)
import { d1Store } from '../_lib/store.js';
import { getLeaderboard, json } from '../_lib/handlers.js';

export async function onRequestGet({ request, env }) {
  if (!env.DB) return json({ error: 'offline', reason: 'Datenbank nicht verbunden.' }, 503);
  return getLeaderboard({ request, store: d1Store(env.DB) });
}
