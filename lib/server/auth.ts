import { decodeJwt, jwtVerify, createRemoteJWKSet, JWTPayload } from "jose";

// Define the issuer, audience and JWKS URL pointing to the Auth Service
const ISSUER = process.env.TOKEN_ISSUER || "http://localhost:4646";
const AUDIENCE = process.env.TOKEN_AUDIENCE || "my-ui";
// This runs server-side, so prefer AUTH_ENDPOINT (e.g. http://auth:4646 inside Docker) over the browser-facing URL
const JWKS_URL = `${process.env.AUTH_ENDPOINT ?? process.env.NEXT_PUBLIC_AUTH_ENDPOINT}/jwks`;

// createRemoteJWKSet automatically caches keys and refetches when a key rotates
let cachedJWKSClient: any = null;

/**
 * Get the cached JWK client or create a new one if it doesn't exist.
 *
 * @returns the JWK client for verifying JWTs
 */
function getJWKClient() {
  if (!cachedJWKSClient) {
    cachedJWKSClient = createRemoteJWKSet(new URL(JWKS_URL));
  }
  return cachedJWKSClient;
}

/**
 * Verify a JWT against the public keys fetched from the Auth Service's JWKS endpoint.
 *
 * @param token the JWT string to verify
 * @returns a Promise that resolves to the decoded payload if valid, or null if invalid
 */
export async function verifyJwtToken(token: string): Promise<JWTPayload | null> {
  try {
    const client = getJWKClient();
    const { payload } = await jwtVerify(token, client, {
      issuer: ISSUER,
      audience: AUDIENCE,
      algorithms: ['RS256'],
    });

    return payload as JWTPayload;
  } catch (error) {
    const decoded = decodeJwt(token);
    console.error("JWT verification failed:", error, decoded, ISSUER, AUDIENCE);
    return null;
  }
}
