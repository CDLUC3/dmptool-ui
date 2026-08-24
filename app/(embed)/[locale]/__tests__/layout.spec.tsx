/**
 * @jest-environment jsdom
 */

import React from 'react';
import { render, screen } from '@testing-library/react';
import EmbedLayout from '@/app/(embed)/[locale]/layout'; // adjust to the actual path
import { routing } from '@/i18n/routing';
import { notFound } from 'next/navigation';

// Mock the routing configuration
jest.mock('@/i18n/routing', () => ({
  routing: {
    locales: ['en-US', 'pt-BR'],
    defaultLocale: 'en-US',
  },
}));

jest.mock('next-intl/server', () => ({
  getMessages: jest.fn().mockResolvedValue({}),
}));

jest.mock('next/navigation', () => ({
  notFound: jest.fn(),
}));

jest.mock('next-intl', () => ({
  NextIntlClientProvider: ({ children }: { children: React.ReactNode }) => <>{children}</>,
}));

jest.mock('@/lib/graphql/apollo-wrapper', () => ({
  ApolloWrapper: ({ children }: { children: React.ReactNode }) => (
    <div data-testid="apollo-wrapper">{children}</div>
  ),
}));

jest.mock('@/context/CsrfContext', () => ({
  CsrfProvider: ({ children }: { children: React.ReactNode }) => (
    <div data-testid="csrf-provider">{children}</div>
  ),
}));

// next/font/google
jest.mock('next/font/google', () => ({
  Poppins: () => ({
    variable: 'mock-font-variable',
    className: 'mock-font-class',
  }),
}));

// Global stylesheets imported by layout.tsx
jest.mock('@fortawesome/fontawesome-svg-core/styles.css', () => ({}));
jest.mock('nprogress/nprogress.css', () => ({}));
jest.mock('@/styles/globals.scss', () => ({}));

/* eslint-disable @typescript-eslint/no-explicit-any */

// Helper: EmbedLayout returns <html><head/><body>...</body></html> as a
// React element tree. RTL cannot render <html>/<head>/<body> directly, so
// walk the returned tree to pull out just the <body>'s children, matching
// the same pattern used for LocaleLayout's tests.
function getBodyContent(layoutElement: any) {
  const htmlChildren = layoutElement?.props?.children;
  const bodyNode = Array.isArray(htmlChildren)
    ? htmlChildren.find((el: any) => el?.type === 'body')
    : null;

  if (!bodyNode) {
    throw new Error('<body> not found in EmbedLayout output');
  }

  return bodyNode.props?.children;
}

describe('EmbedLayout', () => {
  afterEach(() => {
    jest.clearAllMocks();
  });

  it('renders children wrapped in the provider tree for a valid locale', async () => {
    const TestComponent = await EmbedLayout({
      children: <div data-testid="child-content">child content</div>,
      params: Promise.resolve({ locale: routing.locales[0] }),
    });

    const bodyContent = getBodyContent(TestComponent);
    render(<>{bodyContent}</>);

    expect(screen.getByTestId('child-content')).toBeInTheDocument();
    expect(screen.getByTestId('csrf-provider')).toBeInTheDocument();
    expect(screen.getByTestId('apollo-wrapper')).toBeInTheDocument();
    expect(notFound).not.toHaveBeenCalled();
  });

  it('sets the html lang attribute to the resolved locale', async () => {
    const TestComponent = await EmbedLayout({
      children: <div>content</div>,
      params: Promise.resolve({ locale: 'pt-BR' }),
    });

    expect(TestComponent.props.lang).toBe('pt-BR');
  });

  it('calls notFound() when the locale is not in the supported routing.locales list', async () => {
    await EmbedLayout({
      children: <div>content</div>,
      params: Promise.resolve({ locale: 'xx' }),
    });

    expect(notFound).toHaveBeenCalledTimes(1);
  });

  it('nests providers in the expected order: Csrf > Apollo > children', async () => {
    const TestComponent = await EmbedLayout({
      children: <div data-testid="child-content">content</div>,
      params: Promise.resolve({ locale: routing.locales[0] }),
    });

    const bodyContent = getBodyContent(TestComponent);
    render(<>{bodyContent}</>);

    const csrfProvider = screen.getByTestId('csrf-provider');
    const apolloWrapper = screen.getByTestId('apollo-wrapper');
    const child = screen.getByTestId('child-content');

    expect(csrfProvider).toContainElement(apolloWrapper);
    expect(apolloWrapper).toContainElement(child);
  });
});