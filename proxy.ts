import { NextRequest, NextResponse } from 'next/server';
import { JwtPayload } from 'jsonwebtoken'

import createMiddleware from 'next-intl/middleware';

import { routing } from './i18n/routing';
import { verifyJwtToken } from './lib/server/auth';
import logECS from '@/utils/clientLogger';
import { ACCESS_TOKEN_NAME, REFRESH_TOKEN_NAME, refreshAuthTokens, SSO_PENDING_TOKEN_NAME } from "@/utils/authHelper";
import { locales, defaultLocale } from './config/i18nConfig';

interface JWTAccessToken extends JwtPayload {
  id: number,
  email: string,
  givenName: string,
  surName: string,
  role: string,
  languageId: string,
  jti: string,
  expiresIn: number,
}

// TODO: These routes will need to be updated.
const excludedPaths = ['/email', '/favicon.ico', '/_next', '/api', '/login', '/signup', '/styleguide', '/contact', '/dmps'];

// Check if the request is for a server action
function isServerAction(request: NextRequest): boolean {
  // Server actions are POST requests with specific content types
  return (
    request.method === 'POST' &&
    (
      request.headers.get('content-type')?.includes('text/plain') ||
      request.headers.get('next-action') !== null ||
      request.headers.get('next-router-state-tree') !== null
    )
  );
}

const handleI18nRouting = createMiddleware(routing);

// Function to get locale from JWT token
async function getLocaleFromJWT(accessToken: string | undefined): Promise<{ locale: string | null; user: JWTAccessToken | null }> {
  try {
    if (!accessToken) return { locale: null, user: null };

    const user = await verifyJwtToken(accessToken) as JWTAccessToken | null;
    if (!user) return { locale: null, user: null };

    const { languageId } = user;
    return {
      locale: languageId && locales.includes(languageId) ? languageId : null,
      user,
    };
  } catch (error) {
    console.error('Error parsing JWT:', error);
    return { locale: null, user: null };
  }
}

async function getLocale(request: NextRequest, jwtResult: { locale: string | null; user: JWTAccessToken | null }) {
  try {
    if (jwtResult.locale) return jwtResult.locale;

    //Fall back to Accept-Language header
    const acceptLanguage = request.headers.get('Accept-Language');
    if (acceptLanguage) {
      const browserLocale = acceptLanguage
        .split(',')[0]
        .split('-')[0]
        .toLowerCase();

      if (locales.includes(browserLocale)) {
        return browserLocale
      }
    }
    //Otherwise, use Default locale
    return defaultLocale;
  } catch (error) {
    console.log('Error detecting locale:', error);
    return defaultLocale;
  }
}

export async function proxy(request: NextRequest) {
  const { pathname } = request.nextUrl;

  /* TODO: might want to add a 'redirect' query param to url to redirect user after
   login to the original page they were trying to get to.*/

  // Exclude paths from authentication checks
  const isExcludedPath = excludedPaths.some((path) => pathname.includes(path));

  // Also exclude server actions from authentication middleware
  const isServerActionRequest = isServerAction(request);

  // Build cookie header string from NextRequest cookies
  const cookieHeader = request.cookies
    .getAll()
    .map(({ name, value }) => `${name}=${value}`)
    .join("; ");

  const accessToken = request.cookies.get(ACCESS_TOKEN_NAME);
  const refreshToken = request.cookies.get(REFRESH_TOKEN_NAME);
  // TODO: We need to implement SSO soon, so leaving this here for now. The SSO_PENDING_TOKEN_NAME is used to store a
  //       temporary token in the browser when a user successfully signs in via SSO but they do not yet have an account
  //       in the DMPTool. This token is used to help create a new account for the user after they fill out the account
  //       creation form. Once the account is created, the SSO_PENDING_TOKEN_NAME is deleted from the browser.
  // eslint-disable-next-line unused-imports/no-unused-vars, @typescript-eslint/no-unused-vars
  const ssoPendingToken = request.cookies.get(SSO_PENDING_TOKEN_NAME);

  const jwtResult = await getLocaleFromJWT(accessToken?.value);
  const locale = await getLocale(request, jwtResult);

  const requestHeaders = new Headers(request.headers);
  requestHeaders.set("x-is-authenticated", jwtResult.user ? "true" : "false");

  const response = NextResponse.next({ request: { headers: requestHeaders } });

  // Redirect to login if no tokens are found
  if (!isExcludedPath && !isServerActionRequest) {
    if (!accessToken && !refreshToken) {
      return NextResponse.redirect(new URL(`/${locale}/login`, request.url));
    }

    //Refresh tokens if necessary
    if (!accessToken && refreshToken) {
      try {
        const refreshResult = await refreshAuthTokens(cookieHeader);

        if (refreshResult?.response) {
          const backendResponse = refreshResult.response;
          // We need to redirect to the same URL to ensure cookies are set properly in browser
          const newResponse = NextResponse.redirect(request.url);

          // Copy Set-Cookie headers from backend response to NextResponse
          backendResponse.headers.forEach((value, key) => {
            if (key.toLowerCase() === "set-cookie") {
              newResponse.headers.append("set-cookie", value);
            }
          });

          return newResponse;
        }

        // If refresh helper tells us to redirect, do it now
        if (refreshResult?.shouldRedirect) {
          const redirectResponse = NextResponse.redirect(new URL(`/${locale}/login`, request.url));
          // Clear the expired refresh token so subsequent requests don't keep trying to refresh
          redirectResponse.cookies.set(REFRESH_TOKEN_NAME, "", { maxAge: 0 });
          return redirectResponse;
        }
      } catch (error) {
        logECS("error", "refreshing", {
          error,
          url: { path: "middleware" },
        });
        const redirectResponse = NextResponse.redirect(new URL(`/${locale}/login`, request.url));
        // Clear the expired refresh token so subsequent requests don't keep trying to refresh
        redirectResponse.cookies.set(REFRESH_TOKEN_NAME, "", { maxAge: 0 });
        return redirectResponse;
      }
    }
  }

  const pathnameIsMissingLocale = locales.every(
    (locale) => !pathname.startsWith(`/${locale}`) && pathname !== `/${locale}`,
  );

  if (pathnameIsMissingLocale) {
    const newUrl = new URL(`/${locale}${pathname}`, request.url);
    if (request.nextUrl.search) {
      newUrl.search = request.nextUrl.search; // Only assign if it's valid
    }
    return NextResponse.redirect(newUrl);
  }

  const i18nResponse = handleI18nRouting(request);
  if (i18nResponse) {
    i18nResponse.headers.set("x-is-authenticated", jwtResult.user ? "true" : "false");
    return i18nResponse;
  }

  // Add url info to custom header. Need this for just the /dmps landing page
  if (request.nextUrl.pathname.startsWith("/en-US/dmps")) {
    response.headers.set("x-url", request.nextUrl.href);
  }

  return response;
}

export const config = {
  // Don't run middleware for api endpoints, static files, anything in our pubic folder or _next files
  matcher: ['/((?!api|_next|static|.*\\.(?:ico|png|jpg|jpeg|gif|svg|css|js|json|woff2?|ttf|map|txt|xml)$).*)'],
};

