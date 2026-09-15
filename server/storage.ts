/**
 * Deployment-safe key/value storage for users + sessions.
 *
 * Drivers (auto-selected by env):
 *  1. Upstash Redis REST  — when UPSTASH_REDIS_REST_URL + UPSTASH_REDIS_REST_TOKEN
 *     are set. Recommended for Vercel (serverless has no persistent disk).
 *  2. Filesystem          — DATA_DIR env var, defaulting to ./data (dev) or
 *     /tmp/data on Vercel. Persistent on normal servers (Render with disk);
 *     EPHEMERAL on serverless — fine for demos, not for real accounts.
 *
 * Swap this module for a real database (Postgres/Mongo) when you outgrow it.
 */
import { existsSync, mkdirSync, readFileSync, writeFileSync } from "fs";
import path from "path";

const UPSTASH_URL = process.env.UPSTASH_REDIS_REST_URL;
const UPSTASH_TOKEN = process.env.UPSTASH_REDIS_REST_TOKEN;
const USE_UPSTASH = Boolean(UPSTASH_URL && UPSTASH_TOKEN);

/** True when the filesystem driver cannot persist across deploys/restarts. */
export const storageIsEphemeral = !USE_UPSTASH && process.env.VERCEL === "1";

function dataDir(): string {
  if (process.env.DATA_DIR) return process.env.DATA_DIR;
  if (process.env.VERCEL === "1") return path.join("/tmp", "acn-data");
  return path.join(process.cwd(), "data");
}

export async function readJson<T>(key: string, fallback: T): Promise<T> {
  if (USE_UPSTASH) {
    try {
      const res = await fetch(`${UPSTASH_URL}/get/${encodeURIComponent(key)}`, {
        headers: { Authorization: `Bearer ${UPSTASH_TOKEN}` },
        cache: "no-store",
      });
      if (!res.ok) return fallback;
      const body = (await res.json()) as { result: string | null };
      if (!body.result) return fallback;
      return JSON.parse(body.result) as T;
    } catch {
      return fallback;
    }
  }
  try {
    const file = path.join(dataDir(), `${key}.json`);
    if (!existsSync(file)) return fallback;
    return JSON.parse(readFileSync(file, "utf-8")) as T;
  } catch {
    return fallback;
  }
}

export async function writeJson(key: string, value: unknown): Promise<void> {
  if (USE_UPSTASH) {
    const res = await fetch(`${UPSTASH_URL}/set/${encodeURIComponent(key)}`, {
      method: "POST",
      headers: {
        Authorization: `Bearer ${UPSTASH_TOKEN}`,
        "Content-Type": "text/plain",
      },
      body: JSON.stringify(value),
    });
    if (!res.ok) throw new Error(`Upstash write failed (${res.status})`);
    return;
  }
  const dir = dataDir();
  if (!existsSync(dir)) mkdirSync(dir, { recursive: true });
  writeFileSync(path.join(dir, `${key}.json`), JSON.stringify(value, null, 2));
}
