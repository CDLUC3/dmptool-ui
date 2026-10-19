import path from 'node:path';

export const ROLES = ['researcher', 'admin'] as const;
export type Role = (typeof ROLES)[number];

export interface Credentials {
  email: string;
  password: string;
}

// Saved login sessions live in e2e/playwright/.auth (git-ignored)
const AUTH_DIR = path.resolve(import.meta.dirname, '../../playwright/.auth');

export const authFile = (role: Role) => path.join(AUTH_DIR, `${role}.json`);

// Use in a spec file to run its tests as an already logged-in user, e.g. test.use(asRole('admin'))
export const asRole = (role: Role) => ({ storageState: authFile(role) });

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
