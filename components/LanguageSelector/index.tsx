import { useState } from 'react';
import { useSwitchLanguage } from '@/hooks/switchLanguage';
import { useLocale } from 'next-intl';
import { usePathname, useRouter, Link } from '@/i18n/routing';

import styles from './languageSelector.module.scss';

// Define the interface for the locales
interface LangInterface {
  id: string;
  name: string;
}

// Define the interface for the props
interface LanguageSelectorProps {
  locales: LangInterface[];
}

function LanguageSelector({ locales }: LanguageSelectorProps) {
  const [newLocale, setNewLocale] = useState<string | null>(null);
  const pathname = usePathname();
  const currentLocale = useLocale();
  const router = useRouter();

  // This is triggered every time the "newLocale" state changes
  useSwitchLanguage(newLocale, currentLocale, pathname, router);

  const updateLanguages = async (locale: string) => {
    setNewLocale(locale);
  }

  return (
    <>
      {locales.map((locale) => (
        <p className={styles.paragraph} key={locale.id}>
          <Link
            href=""
            onClick={() => updateLanguages(locale.id)}
            aria-label={`Switch to ${locale.name} language`}
          >
            {locale.name}
          </Link>
        </p>
      ))}
    </>
  )

}

export default LanguageSelector;
