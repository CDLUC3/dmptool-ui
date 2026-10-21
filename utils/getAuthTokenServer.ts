'use server'

import { cookies } from 'next/headers';
import { ACCESS_TOKEN_NAME } from "@/utils/authHelper";

/**
 * Gets access token from cookie on the server side
 * @returns
 */
export const getAuthTokenServer = async (): Promise<string | null> => {
  const cookieStore = await cookies();
  const authToken = cookieStore.get(ACCESS_TOKEN_NAME);
  return authToken ? authToken?.value : null;
}
