/*
 * Installs window.storage, the tiny key/value API TeamLineupApp.jsx expects:
 *
 *   window.storage.get(key, shared) -> { value: string } | null
 *   window.storage.set(key, jsonString, shared)
 *
 * The component is left untouched so it still runs unmodified in the original
 * host, and the split follows the app's own privacy rule:
 *
 *   shared === false  ->  this device only (localStorage). Mood logs and
 *                         streaks never leave the phone, which is stronger
 *                         than the promise the UI already makes.
 *   shared === true   ->  the team's shared row in Supabase, when it is
 *                         configured. Without keys it falls back to
 *                         localStorage and the app runs single-device.
 */

const PREFIX = "lineup:";
const SUPABASE_URL = import.meta.env.VITE_SUPABASE_URL;
const SUPABASE_ANON_KEY = import.meta.env.VITE_SUPABASE_ANON_KEY;
const TABLE = "team_state";

export const isTeamSyncEnabled = Boolean(SUPABASE_URL && SUPABASE_ANON_KEY);

function localGet(key) {
  try {
    const raw = localStorage.getItem(PREFIX + key);
    return raw === null ? null : { value: raw };
  } catch {
    return null;
  }
}

function localSet(key, value) {
  try {
    localStorage.setItem(PREFIX + key, value);
  } catch {
    /* private mode or quota — the app already tolerates a failed write */
  }
}

const headers = {
  apikey: SUPABASE_ANON_KEY,
  Authorization: `Bearer ${SUPABASE_ANON_KEY}`,
  "Content-Type": "application/json",
};

async function remoteGet(key) {
  const res = await fetch(
    `${SUPABASE_URL}/rest/v1/${TABLE}?key=eq.${encodeURIComponent(key)}&select=value`,
    { headers }
  );
  if (!res.ok) throw new Error(`supabase get ${res.status}`);
  const rows = await res.json();
  if (!rows.length) return null;
  // value is a jsonb column; the component wants the JSON *string* back.
  return { value: JSON.stringify(rows[0].value) };
}

async function remoteSet(key, value) {
  const res = await fetch(`${SUPABASE_URL}/rest/v1/${TABLE}`, {
    method: "POST",
    headers: { ...headers, Prefer: "resolution=merge-duplicates,return=minimal" },
    body: JSON.stringify([{ key, value: JSON.parse(value) }]),
  });
  if (!res.ok) throw new Error(`supabase set ${res.status}`);
}

export function installStorage() {
  window.storage = {
    async get(key, shared) {
      if (shared && isTeamSyncEnabled) {
        try {
          return await remoteGet(key);
        } catch (e) {
          // Offline or the request failed: fall back to the last copy this
          // device saw, so the app still opens on the bus to an away game.
          console.warn("team sync read failed, using local copy", e);
          return localGet(key);
        }
      }
      return localGet(key);
    },

    async set(key, value, shared) {
      // Always keep a local copy: it doubles as the offline cache.
      localSet(key, value);
      if (shared && isTeamSyncEnabled) {
        try {
          await remoteSet(key, value);
        } catch (e) {
          console.warn("team sync write failed, kept locally", e);
        }
      }
    },
  };

  if (!isTeamSyncEnabled) {
    console.info(
      "[lineup] Team sync is off — set VITE_SUPABASE_URL and VITE_SUPABASE_ANON_KEY to share data across phones."
    );
  }
}
