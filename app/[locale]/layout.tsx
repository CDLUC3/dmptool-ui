import { headers } from 'next/headers';
import { Poppins } from "next/font/google";
import { NextIntlClientProvider } from 'next-intl';
import { getMessages } from 'next-intl/server';
import { notFound } from 'next/navigation';
import { routing } from '@/i18n/routing';
import { ToastProviderWrapper } from '@/context/ToastContext';
import type { Metadata } from 'next';

// Components
import Header from "@/components/Header";
import Footer from "@/components/Footer";
import SubHeader from "@/components/SubHeader";
import NavigationEvents from '@/components/NavigationEvents'

import { ApolloWrapper } from "@/lib/graphql/apollo-wrapper";
import { AuthProvider } from "@/context/AuthContext";
import { CsrfProvider } from "@/context/CsrfContext";

//Styles
import '@fortawesome/fontawesome-svg-core/styles.css'
import 'nprogress/nprogress.css';
import "@/styles/globals.scss";

const font_sans_serif = Poppins({
  subsets: ["latin"],
  weight: ['400', '600'],
  variable: '--font-sans-serif',
  preload: false, // ← stops Next.js injecting preload hints, since preloading is adding warnings in browser, and font should be cached anyways after first page
});

export const metadata: Metadata = {
  icons: {
    icon: {
      url: `https://${process.env.CDN_ENDPOINT}/logos/ror.org/03yrm5c26/cdl.jpeg`,
      type: 'image/jpeg',
    },
  },
};

export default async function LocaleLayout({
  children,
  params,
}: {
  children: React.ReactNode;
  params: Promise<{ locale: string }>; // Wrap params in a Promise to match the expected type
}) {
  const resolvedParams = await params; // Resolve the promise to access the locale
  const { locale } = resolvedParams;

  // Ensure that the incoming `locale` is valid
  /*eslint-disable @typescript-eslint/no-explicit-any */
  if (!routing.locales.includes(locale as any)) {
    notFound();
  }

  // Providing all messages to the client
  // side is the easiest way to get started
  const messages = await getMessages();
  const headersList = await headers();

  // The `x-is-authenticated` is set in the header by proxy.ts middleware. This is to avoid any flashing of the navigation bar
  // when the user is authenticated, since the authentication state is determined on the client side after the page has loaded.
  const initialIsAuthenticated = headersList.get('x-is-authenticated') === 'true';

  return (
    <html lang={locale} className={font_sans_serif.variable}>
      <head></head>
      <body className={font_sans_serif.className}>
        <a href="#mainContent" className="skip-nav">Skip to main content</a>
        <NextIntlClientProvider messages={messages}>
          <CsrfProvider>
            <ApolloWrapper>
              <AuthProvider initialIsAuthenticated={initialIsAuthenticated}>
                <Header />
                <SubHeader />
                <ToastProviderWrapper>
                  <div id="App">
                    <NavigationEvents />
                    {children}
                  </div>
                </ToastProviderWrapper>
                <Footer />
              </AuthProvider>
            </ApolloWrapper>
          </CsrfProvider>
        </NextIntlClientProvider>
      </body>
    </html>
  );
}
