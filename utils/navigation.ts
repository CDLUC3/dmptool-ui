import { getPathname } from '@/i18n/routing';
import { locales, defaultLocale } from '@/config/i18nConfig';

function getCurrentLocale(): string {
  const segment = window.location.pathname.split('/')[1];
  return locales.includes(segment) ? segment : defaultLocale;
}

export const navigateTo = (url: string) => {
  window.location.href = getPathname({ href: url, locale: getCurrentLocale() });
};