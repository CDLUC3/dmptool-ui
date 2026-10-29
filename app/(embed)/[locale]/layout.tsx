import { NextIntlClientProvider } from 'next-intl';
import { Poppins } from "next/font/google";
import { getMessages } from 'next-intl/server';
import { notFound } from 'next/navigation';
import { routing } from '@/i18n/routing';
import type { Metadata } from 'next';
import { ApolloWrapper } from "@/lib/graphql/apollo-wrapper";
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

export default async function EmbedLayout({
  children,
  params,
}: {
  children: React.ReactNode;
  params: Promise<{ locale: string }>;
}) {
  const { locale } = await params;

  /* eslint-disable-next-line @typescript-eslint/no-explicit-any */
  if (!routing.locales.includes(locale as any)) {
    notFound();
  }

  const messages = await getMessages();

  return (
    <html lang={locale} className={font_sans_serif.variable}>
      <head></head>
      <body className={font_sans_serif.className}>
        <NextIntlClientProvider messages={messages}>
          <CsrfProvider>
            <ApolloWrapper>
              {children}
            </ApolloWrapper>
          </CsrfProvider>
        </NextIntlClientProvider>
      </body>
    </html>
  );
}