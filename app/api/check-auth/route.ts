import { NextResponse } from 'next/server';
import { cookies } from 'next/headers';
import { getAuthTokenServer } from '@/utils/getAuthTokenServer';
import { REFRESH_TOKEN_NAME, refreshAuthTokens } from '@/utils/authHelper';
import { verifyJwtToken } from '@/lib/server/auth';
import { createLogger } from '@/utils/server/logger';

const logger = createLogger();
const LOGIN = `${process.env.NEXT_PUBLIC_BASE_URL}/login`;

/**
 * The access token is short-lived and /api routes are not run through the proxy, so the
 * access token can be missing or expired while the user still has a valid refresh token.
 * Try to refresh the tokens with the Auth Service and pass the new cookies on to the browser.
 */
async function tryRefresh(): Promise<NextResponse> {
  const cookieStore = await cookies();
  if (!cookieStore.get(REFRESH_TOKEN_NAME)) {
    return NextResponse.json({ authenticated: false });
  }

  const cookieHeader = cookieStore
    .getAll()
    .map(({ name, value }) => `${name}=${value}`)
    .join('; ');

  try {
    const refreshResult = await refreshAuthTokens(cookieHeader);
    if (refreshResult?.response) {
      const response = NextResponse.json({ authenticated: true });
      refreshResult.response.headers.forEach((value, key) => {
        if (key.toLowerCase() === 'set-cookie') {
          response.headers.append('set-cookie', value);
        }
      });
      return response;
    }
  } catch (err) {
    logger.error({
      error: err,
      route: '/api/check-auth',
    }, 'Error refreshing auth tokens');
  }
  return NextResponse.json({ authenticated: false });
}

export async function GET() {
  try {
    const token = await getAuthTokenServer();

    if (token) {
      try {
        const user = await verifyJwtToken(token);
        if (user) {
          return NextResponse.json({ authenticated: true });
        } else {
          logger.error(
            {
              error: new Error('User verification failed'),
              token,
              route: '/api/check-auth',
            }, 'Token verification failed'
          )
          return await tryRefresh();
        }
      } catch (err) {
        logger.error({
          error: err,
          token,
          route: '/api/check-auth',
        }, 'Token verification error')
        return NextResponse.redirect(LOGIN);
      }

    } else {
      return await tryRefresh();
    }
  } catch (err) {
    logger.error({
      error: err,
      route: '/api/check-auth',
    }, 'Error getting auth token from cookie');
    return NextResponse.json({ authenticated: false, error: 'Internal Server Error' })
  }
}
