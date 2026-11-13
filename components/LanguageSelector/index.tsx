'use client'

import { useLocale } from 'next-intl';
import { useMutation, useQuery } from '@apollo/client/react';

// GraphQL
import { MeDocument, UpdateUserProfileDocument } from '@/generated/graphql';

// Components
import { TransitionButton } from '@/components/Form';

// Utils and other
import { useAuthContext } from '@/context/AuthContext';
import { usePathname, useRouter } from '@/i18n/routing';
import { refreshAuthTokens } from '@/utils/authHelper';
import { handleApolloError, logECS } from '@/utils/index';
import styles from './languageSelector.module.scss';

export interface LangInterface {
  id: string;
  name: string;
}

export interface LanguageSelectorProps {
  locales: LangInterface[];
  /** Accessible name for the group of languages */
  label: string;
}

function LanguageSelector({ locales, label }: LanguageSelectorProps) {
  const pathname = usePathname();
  const currentLocale = useLocale();
  const router = useRouter();
  const { isAuthenticated } = useAuthContext();
  const { data } = useQuery(MeDocument, { skip: !isAuthenticated });
  const [updateUserProfileMutation] = useMutation(UpdateUserProfileDocument);

  // Logged-in users' preferred language is saved to their profile and token
  const savePreferredLanguage = async (locale: string) => {
    if (!data?.me) return;

    try {
      const response = await updateUserProfileMutation({
        variables: {
          input: {
            givenName: data.me.givenName || '',
            surName: data.me.surName || '',
            affiliationId: data.me.affiliation?.uri,
            languageId: locale,
          },
        },
      });

      const general = response.data?.updateUserProfile?.errors?.general;
      if (general) {
        logECS('error', 'LanguageSelector.savePreferredLanguage', { errors: general });
        return;
      }
      await refreshAuthTokens();
    } catch (err) {
      handleApolloError(err, 'LanguageSelector.savePreferredLanguage');
    }
  };

  return (
    <div
      role="group"
      aria-label={label}
      className={styles.languageSelector}
    >
      {locales.map((locale) => (
        <span
          key={locale.id}
          className={styles.item}
        >
          {locale.id === currentLocale ? (
            <span
              lang={locale.id}
              aria-current="true"
              className={styles.current}
            >
              {locale.name}
            </span>
          ) : (
            <TransitionButton
              className={`link ${styles.option}`}
              showLoading={false}
              loadingLabel={locale.name}
              onPress={async ({ startTransition }) => {
                await savePreferredLanguage(locale.id);
                startTransition(() => {
                  router.push(pathname, { locale: locale.id });
                });
              }}
            >
              <span lang={locale.id}>{locale.name}</span>
            </TransitionButton>
          )}
        </span>
      ))}
    </div>
  );
}

export default LanguageSelector;
