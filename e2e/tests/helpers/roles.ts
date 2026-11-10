import { request, type Fixtures, type PlaywrightTestOptions } from '@playwright/test';
import fs from 'node:fs';
import path from 'node:path';
import { ACCESS_TOKEN_NAME } from './cookies';

// funderAdmin is an ADMIN in a separate test funder organization. It owns the public templates that
// the admin customizes, because an organization can't customize its own templates
export const ROLES = ['researcher', 'admin', 'funderAdmin'] as const;
export type Role = (typeof ROLES)[number];

// The role Apollo gives each account (`me.role`). funderAdmin is an ADMIN, like admin
export const API_ROLES: Record<Role, string> = {
  researcher: 'RESEARCHER',
  admin: 'ADMIN',
  funderAdmin: 'ADMIN',
};

export interface Credentials {
  email: string;
  password: string;
}

// Saved login sessions live in e2e/playwright/.auth (git-ignored). They hold login cookies, so
// auth.teardown.ts deletes them after each run; never upload or share them
export const AUTH_DIR = path.resolve(import.meta.dirname, '../../playwright/.auth');

export const authFile = (role: Role) => path.join(AUTH_DIR, `${role}.json`);

// dmptool-auth's access tokens last 15 minutes, and a run of every browser takes longer than that. A saved session
// with less than this left is refreshed before it's used, so it can't expire during a test (2 minutes at most)
const MIN_ACCESS_SECONDS = 5 * 60;

type SavedSession = { cookies: { name: string; expires: number }[]; origins: unknown[] };

// Returns the path of the role's saved session, first refreshing it if its access token is about to expire.
// The UI's /api/check-auth uses the refresh token when the access token is missing, so the access token is left out.
// Refresh tokens are single-use, so the new tokens are saved for the next test. Tests run one at a time, so two
// tests never refresh the same session at once
export async function freshSession(role: Role): Promise<string> {
  const file = authFile(role);
  const saved = JSON.parse(fs.readFileSync(file, 'utf8')) as SavedSession;
  const access = saved.cookies.find((cookie) => cookie.name === ACCESS_TOKEN_NAME);
  if (access && access.expires - Date.now() / 1000 > MIN_ACCESS_SECONDS) {
    return file;
  }

  const context = await request.newContext({
    baseURL: process.env.BASE_URL ?? 'http://localhost:3000',
    extraHTTPHeaders: process.env.E2E_TEST_SECRET_KEY ? { 'X-E2E-Test-Token': process.env.E2E_TEST_SECRET_KEY } : {},
    storageState: { ...saved, cookies: saved.cookies.filter((cookie) => cookie !== access) } as never,
  });
  try {
    const response = await context.get('/api/check-auth');
    const body = response.ok() ? await response.json() : null;
    if (!body?.authenticated) {
      throw new Error(`Couldn't refresh the saved ${role} session (/api/check-auth returned ${response.status()})`);
    }
    await context.storageState({ path: file });
  } finally {
    await context.dispose();
  }
  return file;
}

// Use in a spec file to run its tests as an already logged-in user, e.g. test.use(asRole('admin'))
export const asRole = (role: Role): Fixtures<object, object, PlaywrightTestOptions> => ({
  storageState: async ({}, use) => use(await freshSession(role)),
});

// Use in a spec file to start logged out, ignoring any saved session
export const loggedOut = { storageState: { cookies: [], origins: [] } };

// Reads a role's credentials from E2E_<ROLE>_EMAIL and E2E_<ROLE>_PASSWORD (see .env.example)
export function credentialsFor(role: Role): Credentials {
  const prefix = `E2E_${role.toUpperCase()}`;
  const email = process.env[`${prefix}_EMAIL`];
  const password = process.env[`${prefix}_PASSWORD`];
  if (!email || !password) {
    throw new Error(`Missing ${prefix}_EMAIL or ${prefix}_PASSWORD. Copy e2e/.env.example to e2e/.env and fill them in.`);
  }
  return { email, password };
}
