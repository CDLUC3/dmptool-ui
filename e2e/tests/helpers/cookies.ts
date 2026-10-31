// Auth cookie names set by dmptool-auth. playwright.config.ts reads them from the root .env.local when e2e/.env
// doesn't set them; the defaults match utils/authHelper.ts and dmptool-auth's config
export const ACCESS_TOKEN_NAME = process.env.ACCESS_TOKEN_NAME ?? 'access_token';
export const REFRESH_TOKEN_NAME = process.env.REFRESH_TOKEN_NAME ?? 'refresh_token';
