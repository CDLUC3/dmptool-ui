'use client';

import { RouterProvider } from 'react-aria-components';
import { useRouter, getPathname } from '@/i18n/routing';
import { useLocale } from 'next-intl';

// Connects React Aria's routing (used by its Link and Breadcrumbs components)
// to next-intl, so links rendered by react-aria-components get the locale
// prefix and navigate through the Next.js router.
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
