'use client';

import { RouterProvider } from 'react-aria-components';
import { useRouter, getPathname } from '@/i18n/routing';
import { useLocale } from 'next-intl';

/**
 * Connects React Aria's built-in navigation to next-intl.
 *
 * Our own code navigates with `Link` and `useRouter` from `@/i18n/routing`, which
 * add the locale automatically. But React Aria components that accept an `href`
 * (Link, MenuItem, Tab, ListBoxItem, GridListItem, table Row, etc.) navigate on
 * their own and know nothing about Next.js or next-intl. Without this provider they
 * render plain, unlocalized hrefs (e.g. "/projects") and trigger full page reloads.
 *
 * With it, those components:
 *  - render localized hrefs (useHref → "/pt-BR/projects")
 *  - navigate client-side through the next-intl router (navigate → router.push)
 *
 * Only app paths ("/...") are localized; anchors ("#"), external URLs, and
 * mailto: links are passed through unchanged.
 *
 * Can be removed only if no React Aria component in the app receives an app-path href.
 */
export function AriaRouterProvider({ children }: { children: React.ReactNode }) {
  const router = useRouter();
  const locale = useLocale();

  return (
    <RouterProvider
      navigate={(href) => router.push(href)}
      useHref={(href) => getPathname({ href, locale })}
    >
      {children}
    </RouterProvider>
  );
}
