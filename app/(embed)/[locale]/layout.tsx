import { NextIntlClientProvider } from 'next-intl';
import { getMessages } from 'next-intl/server';
import { notFound } from 'next/navigation';
import { routing } from '@/i18n/routing';
import { ApolloWrapper } from "@/lib/graphql/apollo-wrapper";
import { CsrfProvider } from "@/context/CsrfContext";
import "@/styles/globals.scss";

export default async function EmbedLayout({
  children,
  params,
}: {
  children: React.ReactNode;
  params: Promise<{ locale: string }>;
}) {
  const { locale } = await params;

  if (!routing.locales.includes(locale as any)) {
    notFound();
  }

  const messages = await getMessages();

  return (
    <html lang={locale}>
      <body>
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