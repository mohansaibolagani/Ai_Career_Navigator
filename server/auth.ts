/**
 * Session store over the storage adapter (server/storage.ts).
 * All functions are async so callers await them uniformly regardless of driver.
 * Passwords are hashed with scrypt + salt. Swap for NextAuth + a real DB in production.
 */
import { randomBytes, scryptSync, timingSafeEqual } from "crypto";
import { readJson, writeJson } from "./storage";
import type { StudentProfile } from "../lib/types";

const USERS_KEY = "users";
const SESSIONS_KEY = "sessions";
const MAX_SESSIONS = 200;

interface StoredUser {
  id: string;
  email: string;
  name: string;
  /** null/absent for Google accounts — they authenticate with Google, not a local password */
  passwordHash: string | null;
  salt: string | null;
  provider: "password" | "google";
  profile: StudentProfile | null;
  createdAt: string;
}

interface Session {
  token: string;
  userId: string;
  createdAt: string;
}

function hashPassword(password: string, salt: string): string {
  return scryptSync(password, salt, 32).toString("hex");
}

export async function createUser(
  email: string,
  name: string,
  password: string
): Promise<StoredUser> {
  const users = await readJson<StoredUser[]>(USERS_KEY, []);
  const existing = users.find(
    (u) => u.email.toLowerCase() === email.toLowerCase()
  );
  if (existing) {
    throw new Error(
      existing.provider === "google"
        ? "This email is registered with Google. Use “Continue with Google” to log in."
        : "An account with this email already exists"
    );
  }
  const salt = randomBytes(16).toString("hex");
  const user: StoredUser = {
    id: randomBytes(8).toString("hex"),
    email: email.toLowerCase(),
    name,
    passwordHash: hashPassword(password, salt),
    salt,
    provider: "password",
    profile: null,
    createdAt: new Date().toISOString(),
  };
  users.push(user);
  await writeJson(USERS_KEY, users);
  return user;
}

/**
 * Create-or-link a Google account (standard email-as-identity behavior):
 *  - new email       → new google user
 *  - existing google → return it (plain login)
 *  - existing password account with same email → link, then log in
 */
export async function upsertOAuthUser(
  email: string,
  name: string
): Promise<StoredUser> {
  const users = await readJson<StoredUser[]>(USERS_KEY, []);
  const idx = users.findIndex(
    (u) => u.email.toLowerCase() === email.toLowerCase()
  );
  if (idx >= 0) {
    const user = users[idx];
    if (user.provider !== "google") {
      // Link the Google identity to the existing local account
      user.provider = "google";
      user.passwordHash = null;
      user.salt = null;
      if (name && !user.profile?.name) user.name = name;
      await writeJson(USERS_KEY, users);
    }
    return user;
  }
  const user: StoredUser = {
    id: randomBytes(8).toString("hex"),
    email: email.toLowerCase(),
    name: name || email.split("@")[0],
    passwordHash: null,
    salt: null,
    provider: "google",
    profile: null,
    createdAt: new Date().toISOString(),
  };
  users.push(user);
  await writeJson(USERS_KEY, users);
  return user;
}

export async function verifyUser(
  email: string,
  password: string
): Promise<StoredUser | null> {
  const users = await readJson<StoredUser[]>(USERS_KEY, []);
  const user = users.find(
    (u) => u.email.toLowerCase() === email.toLowerCase()
  );
  if (!user) return null;
  if (user.provider === "google" || !user.salt || !user.passwordHash) return null;
  const hash = hashPassword(password, user.salt);
  const ok = timingSafeEqual(Buffer.from(hash), Buffer.from(user.passwordHash));
  return ok ? user : null;
}

export async function getUserById(id: string): Promise<StoredUser | null> {
  return (await readJson<StoredUser[]>(USERS_KEY, [])).find((u) => u.id === id) ?? null;
}

export async function getUserByEmail(email: string): Promise<StoredUser | null> {
  return (
    (await readJson<StoredUser[]>(USERS_KEY, [])).find(
      (u) => u.email.toLowerCase() === email.toLowerCase()
    ) ?? null
  );
}

export async function updateProfile(userId: string, profile: StudentProfile) {
  const users = await readJson<StoredUser[]>(USERS_KEY, []);
  const user = users.find((u) => u.id === userId);
  if (user) {
    user.profile = profile;
    if (profile.name || user.profile.name) {
      user.name = profile.name || user.name;
    }
    await writeJson(USERS_KEY, users);
  }
}

export async function createSession(userId: string): Promise<string> {
  const sessions = await readJson<Session[]>(SESSIONS_KEY, []);
  const token = randomBytes(24).toString("hex");
  sessions.push({ token, userId, createdAt: new Date().toISOString() });
  // keep only last MAX_SESSIONS
  await writeJson(SESSIONS_KEY, sessions.slice(-MAX_SESSIONS));
  return token;
}

export async function resolveSession(
  token: string | undefined
): Promise<StoredUser | null> {
  if (!token) return null;
  const sessions = await readJson<Session[]>(SESSIONS_KEY, []);
  const session = sessions.find((s) => s.token === token);
  if (!session) return null;
  return getUserById(session.userId);
}
