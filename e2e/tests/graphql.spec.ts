import { test, expect } from '@playwright/test';
import { ROLES, asRole, loggedOut } from './helpers/roles';

// Sends GraphQL requests straight to dmptool-apollo-server, using the auth cookies that
// dmptool-auth set during login (page.request shares the browser context's cookies).
const GRAPHQL_URL = process.env.GRAPHQL_URL ?? 'http://localhost:4000/graphql';

const ME_QUERY = 'query Me { me { id role } }';

for (const role of ROLES) {
  test.describe(`as ${role}`, () => {
    test.use(asRole(role));

    test(`the me query returns the logged-in ${role}`, async ({ page }) => {
      const response = await page.request.post(GRAPHQL_URL, {
        data: { operationName: 'Me', query: ME_QUERY },
      });

      expect(response.ok()).toBeTruthy();
      const body = await response.json();
      expect(body.errors).toBeUndefined();
      expect(body.data.me.id).toBeTruthy();
      expect(body.data.me.role).toBe(role.toUpperCase());
    });
  });
}

test.describe('when logged out', () => {
  test.use(loggedOut);

  test('the me query is rejected as unauthenticated', async ({ page }) => {
    const response = await page.request.post(GRAPHQL_URL, {
      data: { operationName: 'Me', query: ME_QUERY },
    });

    // Apollo allows unauthenticated requests through (for public queries) and rejects `me` in the resolver
    const body = await response.json();
    expect(body.data?.me ?? null).toBeNull();
    expect(body.errors?.[0]?.extensions?.code).toBe('UNAUTHENTICATED');
  });
});
