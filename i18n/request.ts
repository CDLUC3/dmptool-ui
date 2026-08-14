import { getRequestConfig } from 'next-intl/server';
import deepmerge from 'deepmerge';
import { routing } from './routing';

export default getRequestConfig(async ({ requestLocale }) => {
  // This typically corresponds to the `[locale]` segment
  let locale = await requestLocale;

  // Ensure that a valid locale is used
  /* eslint-disable @typescript-eslint/no-explicit-any*/
  if (!locale || !routing.locales.includes(locale as any)) {
    locale = routing.defaultLocale;
  }

  // Define fallback locale
  const fallbackLocale = 'en-US';

  // Define allowed locales
  type AllowedLocale = 'en-US' | 'pt-BR';

  // Load messages for a specific locale
  const loadMessages = async (localeToLoad: AllowedLocale) => {
    const mainMessages = (await import(`@/messages/${localeToLoad}/global.json`)).default;
    const loginPageMessages = (await import(`@/messages/${localeToLoad}/loginPage.json`)).default;
    const signupPageMessages = (await import(`@/messages/${localeToLoad}/signupPage.json`)).default;
    const templateMessages = (await import(`@/messages/${localeToLoad}/templateBuilder.json`)).default;
    const planBuilderProjectOverviewMessages = (await import(`@/messages/${localeToLoad}/planBuilderProjectOverview.json`)).default;
    const planBuilderPlanOverviewMessages = (await import(`@/messages/${localeToLoad}/planBuilderPlanOverview.json`)).default;
    const errorMessages = (await import(`@/messages/${localeToLoad}/errors.json`)).default;
    const messaging = (await import(`@/messages/${localeToLoad}/messaging.json`)).default;
    const questionPreviewMsgs = (await import(`@/messages/${localeToLoad}/questionPreview.json`)).default;
    const questionViewMsgs = (await import(`@/messages/${localeToLoad}/questionView.json`)).default;
    const relatedWorksMsgs = (await import(`@/messages/${localeToLoad}/relatedWorks.json`)).default;
    const planAuthoringMsgs = (await import(`@/messages/${localeToLoad}/planAuthoring.json`)).default;
    const landingPageMsgs = (await import(`@/messages/${localeToLoad}/landingPage.json`)).default;

    // Merge all message objects
    return {
      ...mainMessages,
      ...loginPageMessages,
      ...signupPageMessages,
      ...templateMessages,
      ...messaging,
      ...planBuilderProjectOverviewMessages,
      ...planBuilderPlanOverviewMessages,
      ...questionPreviewMsgs,
      ...questionViewMsgs,
      ...relatedWorksMsgs,
      ...planAuthoringMsgs,
      ...landingPageMsgs,
      errors: errorMessages,
    };
  };

  // First load the fallback (English) messages
  const fallbackMessages = await loadMessages(fallbackLocale);

  // Deep merging the messages with the fallback English messages, allows us to fallback to English translations when there
  // are missing translations in the locale messages
  let messages = fallbackMessages;
  if (locale !== fallbackLocale && ['en-US', 'pt-BR'].includes(locale)) {
    const localeMessages = await loadMessages(locale as AllowedLocale);  // Cast locale as AllowedLocale
    // Merge fallback messages with locale messages, prioritizing the locale messages
    messages = deepmerge(fallbackMessages, localeMessages);
  }

  return {
    locale,
    messages
  };
});
