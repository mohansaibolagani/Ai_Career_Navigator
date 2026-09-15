/**
 * Demo-grade session store.
 * Users live in a JSON file (data/users.json) so the demo survives restarts
 * without requiring a database. Passwords are hashed with scrypt + salt —
 * swap this module for NextAuth + a real DB in production.
 */
import { randomBytes, scryptSync, timingSafeEqual } from "crypto";
import { readFileSync, writeFileSync, existsSync, mkdirSync } from "fs";
import path from "path";
import type { StudentProfile } from "../lib/types";

const DATA_DIR = path.join(process.cwd(), "data");
const USERS_FILE = path.join(DATA_DIR, "users.json");
const SESSIONS_FILE = path.join(DATA_DIR, "sessions.json");

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

function load<T>(file: string, fallback: T): T {
  try {
    if (!existsSync(file)) return fallback;
    return JSON.parse(readFileSync(file, "utf-8"));
  } catch {
    return fallback;
  }
}

function save(file: string, data: unknown) {
  if (!existsSync(DATA_DIR)) mkdirSync(DATA_DIR, { recursive: true });
  writeFileSync(file, JSON.stringify(data, null, 2));
}

function hashPassword(password: string, salt: string): string {
  return scryptSync(password, salt, 32).toString("hex");
}

export function createUser(
  email: string,
  name: string,
  password: string
): StoredUser {
  const users = load<StoredUser[]>(USERS_FILE, []);
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
  save(USERS_FILE, users);
  return user;
}

/**
 * Create-or-link a Google account (standard email-as-identity behavior):
 *  - new email       → new google user
 *  - existing google → return it (plain login)
 *  - existing password account with same email → link, then log in
 */
export function upsertOAuthUser(
  email: string,
  name: string
): StoredUser {
  const users = load<StoredUser[]>(USERS_FILE, []);
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
      save(USERS_FILE, users);
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
  save(USERS_FILE, users);
  return user;
}

export function verifyUser(
  email: string,
  password: string
): StoredUser | null {
  const users = load<StoredUser[]>(USERS_FILE, []);
  const user = users.find(
    (u) => u.email.toLowerCase() === email.toLowerCase()
  );
  if (!user) return null;
  if (user.provider === "google" || !user.salt || !user.passwordHash) return null;
  const hash = hashPassword(password, user.salt);
  const ok = timingSafeEqual(Buffer.from(hash), Buffer.from(user.passwordHash));
  return ok ? user : null;
}

export function getUserById(id: string): StoredUser | null {
  return load<StoredUser[]>(USERS_FILE, []).find((u) => u.id === id) ?? null;
}

export function getUserByEmail(email: string): StoredUser | null {
  return (
    load<StoredUser[]>(USERS_FILE, []).find(
      (u) => u.email.toLowerCase() === email.toLowerCase()
    ) ?? null
  );
}

export function updateProfile(userId: string, profile: StudentProfile) {
  const users = load<StoredUser[]>(USERS_FILE, []);
  const user = users.find((u) => u.id === userId);
  if (user) {
    user.profile = profile;
    user.name = profile.name || user.name;
    save(USERS_FILE, users);
  }
}

export function createSession(userId: string): string {
  const sessions = load<Session[]>(SESSIONS_FILE, []);
  const token = randomBytes(24).toString("hex");
  sessions.push({ token, userId, createdAt: new Date().toISOString() });
  // keep only last 200 sessions
  save(SESSIONS_FILE, sessions.slice(-200));
  return token;
}

export function resolveSession(token: string | undefined): StoredUser | null {
  if (!token) return null;
  const sessions = load<Session[]>(SESSIONS_FILE, []);
  const session = sessions.find((s) => s.token === token);
  if (!session) return null;
  return getUserById(session.userId);
}
