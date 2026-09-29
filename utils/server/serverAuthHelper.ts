'use server'

import { cookies } from "next/headers";
import jwt, { JwtPayload } from 'jsonwebtoken';
import logger from "@/utils/server/logger";
import { ACCESS_TOKEN_NAME } from "@/utils/authHelper";

export interface JWTAccessToken extends JwtPayload {
  id: number,
  email: string,
  givenName: string,
  surName: string,
  role: string,
  affiliationId: string,
  languageId: string,
  jti: string,
}

class ServerAuthError extends Error {
  status: number | null;

  constructor({
    status,
    message,
    source,
  }: {
    status: number | null;
    message: string;
    source: string;
  }) {
    let statusMsg: string;
    if (status) {
      statusMsg = `[${status}] ${message}`;
    } else {
      statusMsg = `${message}`;
    }
    super(statusMsg);

    this.status = status;
    this.message = message;

    logger.error({ statusMsg, source }, "ServerAuthError");
  }
}

// Server-side refresh auth tokens
export const serverRefreshAuthTokens = async () => {
  try {
    // Get CSRF token first
    const csrfResponse = await serverFetchCsrfToken();
    if (!csrfResponse || !csrfResponse.ok) {
      return null;
    }

    const csrfToken = csrfResponse.headers.get("X-CSRF-TOKEN");
    if (!csrfToken) {
      throw new ServerAuthError({
        status: 403,
        message: "Forbidden. No CSRF token",
        source: "serverRefreshAuthTokens",
      });
    }

    // Get browser cookies
    const cookieStore = await cookies();
    const cookieString = cookieStore.toString();

    // Refresh auth tokens
    const response = await fetch(`${process.env.AUTH_ENDPOINT}/refresh-token`, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        "X-CSRF-TOKEN": csrfToken,
        Cookie: cookieString, // Attach all cookies
      },

    });

    if (!response.ok) {
      if (response.status === 401) {
        return { redirectTo: "/login" };
      }
      throw new ServerAuthError({
        status: response.status,
        message: "Error in response from refreshing auth tokens",
        source: "serverRefreshAuthTokens",
      });
    }

    // Extract the Set-Cookie headers from the response
    const setCookieHeaders = response.headers.get('Set-Cookie');


    const message = await response.json();
    return {
      response,
      message,
      cookies: setCookieHeaders
    };
  } catch (err) {
    logger.error(err, "Error refreshing auth token");
    return null;
  }
};

// Server-side fetch CSRF token
export const serverFetchCsrfToken = async () => {
  try {
    const cookieStore = await cookies();
    const cookieString = cookieStore.toString();

    const response = await fetch(`${process.env.AUTH_ENDPOINT}/csrf`, {
      headers: {
        Cookie: cookieString, // Attach all cookies
      },

    });

    return response;
  } catch (err) {
    logger.error(err,"Error getting CSRF token");
    return null;
  }
};

// Fetch and decode the JWT Access Token
export const serverFetchAccessToken = async (): Promise<JWTAccessToken | undefined> => {
  try {
    const cookieStore = await cookies();
    const cookie = cookieStore.get(ACCESS_TOKEN_NAME);
    if (!cookie || !cookie.value) return undefined;

    const secret = process.env.JWT_SECRET ?? "";
    const token = jwt.verify(String(cookie?.value), secret) as JwtPayload;
    return token ? token as JWTAccessToken : undefined;
  } catch (err) {
    logger.error(err, "Error decoding JWT Access Token");
    return undefined;
  }
}
