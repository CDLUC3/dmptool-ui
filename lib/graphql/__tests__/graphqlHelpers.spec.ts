import { ApolloClient, ApolloLink, InMemoryCache, Observable, gql } from "@apollo/client";
import { errorLink, authLink, retryLink } from "@/lib/graphql/graphqlHelper";
import { refreshAuthTokens, fetchCsrfToken } from "@/utils/authHelper";
import { navigateTo } from "@/utils/navigation";

jest.mock('@/utils/navigation', () => ({
  navigateTo: jest.fn(),
}));

jest.mock("@/utils/clientLogger", () => ({
  __esModule: true,
  default: jest.fn()
}));

jest.mock("@/utils/authHelper", () => ({
  refreshAuthTokens: jest.fn(),
  fetchCsrfToken: jest.fn(),
}));

describe("GraphQL Helper Exports", () => {
  it("should export errorLink", () => {
    expect(errorLink).toBeDefined();
    expect(errorLink.constructor.name).toBe('ErrorLink');
  });

  it("should export authLink", () => {
    expect(authLink).toBeDefined();
    expect(authLink.constructor.name).toBe('SetContextLink');
  });

  it("should export retryLink", () => {
    expect(retryLink).toBeDefined();
    expect(retryLink.constructor.name).toBe('RetryLink');
  });
});

describe("Auth Helper Functions", () => {
  it("should have refreshAuthTokens function available", () => {
    expect(refreshAuthTokens).toBeDefined();
    expect(typeof refreshAuthTokens).toBe('function');
  });

  it("should have fetchCsrfToken function available", () => {
    expect(fetchCsrfToken).toBeDefined();
    expect(typeof fetchCsrfToken).toBe('function');
  });
});
describe("errorLink with an invalid CSRF token", () => {
  const client = new ApolloClient({ cache: new InMemoryCache(), link: ApolloLink.empty() });
  const query = gql`query Test { test }`;

  // The first request is rejected with an invalid CSRF token; any retry succeeds
  const buildLink = () => {
    let calls = 0;
    const serverLink = new ApolloLink(() => {
      calls += 1;
      const result: ApolloLink.Result = calls === 1
        ? { errors: [{ message: 'Invalid CSRF token', extensions: { code: 'FORBIDDEN' } }] }
        : { data: { test: 'ok' } };
      return new Observable<ApolloLink.Result>((observer) => {
        observer.next(result);
        observer.complete();
      });
    });
    return ApolloLink.from([errorLink, serverLink]);
  };

  // Resolves with how the request finished, or "pending" if it never finishes
  const run = () => new Promise<{ status: string; value?: unknown }>((resolve) => {
    const timeout = setTimeout(() => resolve({ status: 'pending' }), 500);
    ApolloLink.execute(buildLink(), { query }, { client }).subscribe({
      next: (value: unknown) => { clearTimeout(timeout); resolve({ status: 'next', value }); },
      error: (value: unknown) => { clearTimeout(timeout); resolve({ status: 'error', value }); },
    });
  });

  beforeEach(() => {
    jest.clearAllMocks();
  });

  it("should retry the request when a new CSRF token is fetched", async () => {
    (fetchCsrfToken as jest.Mock).mockResolvedValue({ ok: true });

    const result = await run();

    expect(result).toEqual({ status: 'next', value: { data: { test: 'ok' } } });
    expect(navigateTo).not.toHaveBeenCalled();
  });

  it("should error the request instead of leaving it pending when fetchCsrfToken returns null", async () => {
    (fetchCsrfToken as jest.Mock).mockResolvedValue(null);

    const result = await run();

    expect(result.status).toBe('error');
    expect(navigateTo).toHaveBeenCalledWith('/login');
  });

  it("should error the request instead of leaving it pending when fetchCsrfToken throws", async () => {
    (fetchCsrfToken as jest.Mock).mockRejectedValue(new Error('Network down'));

    const result = await run();

    expect(result).toEqual({ status: 'error', value: new Error('Network down') });
    expect(navigateTo).toHaveBeenCalledWith('/login');
  });
});
