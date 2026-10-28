import { test as teardown } from '@playwright/test';
import fs from 'node:fs';
import { AUTH_DIR } from './helpers/roles';

// Runs after all the browser projects: deletes the sessions saved by auth.setup.ts, because they hold login cookies
teardown('delete saved login sessions', async () => {
  fs.rmSync(AUTH_DIR, { recursive: true, force: true });
});
