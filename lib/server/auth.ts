import { decodeJwt, jwtVerify, createRemoteJWKSet, JWTPayload } from "jose";

// Define the issuer, audience and JWKS URL pointing to the Auth Service
const ISSUER = process.env.TOKEN_ISSUER || "http://localhost:4646";
const AUDIENCE = process.env.TOKEN_AUDIENCE || "my-ui";
const JWKS_URL = new URL(`${process.env.TOKEN_ISSUER}/jwks`);

// createRemoteJWKSet automatically caches keys and refetches when a key rotates
const JWKS = createRemoteJWKSet(JWKS_URL);

/**
 * Verify a JWT against the public keys fetched from the Auth Service's JWKS endpoint.
 *
 * @param token the JWT string to verify
 * @returns a Promise that resolves to the decoded payload if valid, or null if invalid
 */
export async function verifyJwtToken(token: string): Promise<JWTPayload | null> {
  try {
    const { payload } = await jwtVerify(token, JWKS, {
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
