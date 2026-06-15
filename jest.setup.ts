import '@testing-library/jest-dom';
import dotenv from 'dotenv';
import DOMException from 'domexception';


//Load environment variables from .env.local
dotenv.config({ path: './.env.local' });//

const originalError = console.error;

/**
 * Apollo v4 uses AbortController more agressively for request cancellation, and
 * these abort operations trigger DOMException errors during test cleanup. This
 * happens commonly in tests when Components unmount before queries component,
 * MockedProvider cleans up, or Tests finish while requests are in-flight.
 * 
 * Since these errors are expected and handled by Apollo Client internally, we
 * suppress them in the global console.error to avoid noise in test output.
 */
beforeAll(() => {
  /* eslint-disable @typescript-eslint/no-explicit-any */
  console.error = (...args: any[]) => {
    if (
      args[0] instanceof DOMException ||
      String(args[0]).includes('AbortError')
    ) {
      return;
    }
    originalError(...args);
  };
});

afterAll(() => {
  console.error = originalError;
});


// DOMException polyfill used by Apollo Client's MockedProvider, but is not available in Node.js environment
global.DOMException = DOMException as any;

// Also set it on window if it exists (for jsdom)
if (typeof window !== 'undefined') {
  window.DOMException = DOMException as any;
}

// Mock toast
jest.mock('@/context/ToastContext', () => ({
  useToast: jest.fn(() => ({
    add: jest.fn(),
  })),
}));

// Create ONE stable mock function that gets reused
const stableMockTranslate = (key: string) => key;
/* eslint-disable @typescript-eslint/no-explicit-any */
stableMockTranslate.rich = (key: string, values?: Record<string, any>) => {
  if (values?.p) {
    return values.p(key);
  }
  return key;
};

jest.mock('next-intl', () => {
  const originalModule = jest.requireActual('next-intl');

  return {
    ...originalModule,
    useTranslations: jest.fn(() => stableMockTranslate), // ← Return SAME function each time
  };
});

// Mock next/link globally to avoid internal use-intersection state updates in jsdom tests.
jest.mock('next/link', () => {
  const React = require('react');

  return {
    __esModule: true,
    default: React.forwardRef(({ href, children, ...props }: any, ref: any) => {
      const normalizedHref = typeof href === 'string' ? href : (href?.pathname ?? '');
      return React.createElement('a', { ref, href: normalizedHref, ...props }, children);
    }),
  };
});

// Mock the clientLogger
jest.mock('@/utils/clientLogger', () => jest.fn());

// Mock the useParams and useRouter hooks
jest.mock('next/navigation', () => ({
  useParams: jest.fn(),
  useRouter: jest.fn()
}))


// Make sure to catch extraneous errors that occur even when unit tests pass
const originalConsoleError = console.error;
const originalConsoleWarn = console.warn;

let caughtConsoleErrors: string[] = [];

beforeEach(() => {
  jest.restoreAllMocks();
  caughtConsoleErrors = [];

  console.error = (...args) => {
    const message = args.join(' ');
    if (message.startsWith('Error:')) {
      caughtConsoleErrors.push(message);
    }
    originalConsoleError(...args); // Still log it for debugging
  };

  console.warn = originalConsoleWarn;

  process.on('unhandledRejection', (reason: unknown) => {
    if (reason instanceof Error && reason.message.startsWith('Error:')) {
      caughtConsoleErrors.push(`Unhandled rejection: ${reason.message}`);
    }
  });

  process.on('uncaughtException', (err: unknown) => {
    if (err instanceof Error && err.message.startsWith('Error:')) {
      caughtConsoleErrors.push(`Uncaught exception: ${err.message}`);
    }
  });
});

afterEach(() => {
  console.error = originalConsoleError;
  console.warn = originalConsoleWarn;

  process.removeAllListeners('unhandledRejection');
  process.removeAllListeners('uncaughtException');

  if (caughtConsoleErrors.length > 0) {
    const combined = caughtConsoleErrors.join('\n');
    throw new Error(
      `Test had unexpected console.error logs starting with "Error:":\n\n${combined}`
    );
  }
});