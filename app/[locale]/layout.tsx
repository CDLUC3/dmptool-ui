import { headers, cookies } from 'next/headers';
import { verifyJwtToken } from '@/lib/server/auth';
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
import { AriaRouterProvider } from '@/components/AriaRouterProvider'

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
    icon: [
      {
        url: `https://${process.env.CDN_ENDPOINT}/assets/dmptool-logo-light.svg`,
        type: 'image/svg+xml',// Default icon for browsers that don't support media queries
      },
      {
        url: `https://${process.env.CDN_ENDPOINT}/assets/dmptool-logo-light.svg`,
        type: 'image/svg+xml',
        media: '(prefers-color-scheme: light)',
      },
      {
        url: `https://${process.env.CDN_ENDPOINT}/assets/dmptool-logo-dark.svg`,
        type: 'image/svg+xml',
        media: '(prefers-color-scheme: dark)',
      },
    ],
  },
};

async function getInitialIsAuthenticated(): Promise<boolean> {
  const token = (await cookies()).get('dmspt')?.value;
  if (!token) return false;
  try {
    return !!(await verifyJwtToken(token));
  } catch {
    return false;
  }
}

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

  const messages = await getMessages();

  // Determine auth state on the server from the access token cookie, so the navigation bar
  // renders correctly on first paint instead of flashing while the client checks auth.
  const initialIsAuthenticated = await getInitialIsAuthenticated();

  return (
    <html lang={locale} className={font_sans_serif.variable}>
      <head></head>
      <body className={font_sans_serif.className}>
        <a href="#mainContent" className="skip-nav">Skip to main content</a>
        <NextIntlClientProvider messages={messages}>
          <AriaRouterProvider>
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
          </AriaRouterProvider>
        </NextIntlClientProvider>
      </body>
    </html>
  );
}
