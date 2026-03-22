// NEXT_PUBLIC_BASE_PATH is baked in at build time.
// Locally (no env var set) it is '' so all paths work as-is.
// In production it is '/life-game'.
const BASE = process.env.NEXT_PUBLIC_BASE_PATH ?? '';

/**
 * Prefix a server-relative path with the app base path.
 * Use this for every fetch() call instead of bare '/api/...' strings.
 *
 * @example  apiUrl('/api/game/start')  → '/life-game/api/game/start'  (prod)
 *                                      → '/api/game/start'            (local)
 */
export function apiUrl(path: string): string {
  return `${BASE}${path}`;
}
