import React from 'react';
import { fireEvent, render, screen, waitFor } from '@testing-library/react';
import ConnectionsPage from '../page';

const mockToastAdd = jest.fn();
const mockUseQuery = jest.fn();
const mockUseMutation = jest.fn();
const mockDisconnectFromSso = jest.fn();
const mockRefetch = jest.fn();
const mockLogECS = jest.fn();
const mockRoutePath = jest.fn(() => '/account/connections');
const OriginalUrlSearchParams = global.URLSearchParams;
let mockSearchParams = new URLSearchParams();

jest.mock('@apollo/client/react', () => ({
  useQuery: () => mockUseQuery(),
  useMutation: () => mockUseMutation(),
}));

jest.mock('@/context/ToastContext', () => ({
  useToast: () => ({ add: mockToastAdd }),
}));

jest.mock('@/i18n/routing', () => ({
  Link: ({ href, children }: { href: string; children: React.ReactNode }) => <a href={href}>{children}</a>,
  useRouter: () => ({ back: jest.fn() }),
}));

jest.mock('@/components/PageHeader', () => ({
  __esModule: true,
  default: () => <header data-testid="page-header" />,
}));

jest.mock('@/components/ConnectionSection', () => ({
  __esModule: true,
  default: ({
    type,
    isConnected,
    connectedIdentifier,
    onConnect,
    onDisconnect,
  }: {
    type: string;
    isConnected: boolean;
    connectedIdentifier: string;
    onConnect: () => void;
    onDisconnect: () => Promise<void>;
  }) => (
    <section data-testid={`${type}-connection`}>
      <span>{connectedIdentifier}</span>
      <button onClick={isConnected ? onDisconnect : onConnect}>
        {isConnected ? `${type}-disconnect` : `${type}-connect`}
      </button>
    </section>
  ),
}));

jest.mock('@/components/Loading', () => ({
  __esModule: true,
  default: ({ message }: { message: string }) => <div data-testid="loading">{message}</div>,
}));

jest.mock('@/utils/index', () => ({
  routePath: (...args: unknown[]) => mockRoutePath.apply(null, args),
}));

jest.mock('../../../../../utils/clientLogger', () => ({
  __esModule: true,
  default: (...args: unknown[]) => mockLogECS.apply(null, args),
}));

jest.mock('next-intl', () => {
  const t = (key: string) => key;
  t.markup = (key: string, values: { link: (chunks: string) => string }) => values.link(key);
  return { useTranslations: () => t };
});

jest.mock('next/navigation', () => ({
  useSearchParams: () => mockSearchParams,
}));

const renderPage = () => render(<ConnectionsPage />);

describe('ConnectionsPage', () => {
  beforeEach(() => {
    jest.clearAllMocks();
    global.URLSearchParams = OriginalUrlSearchParams;
    mockSearchParams = new URLSearchParams();
    mockUseQuery.mockReturnValue({
      data: { me: { email: 'person@example.edu', ssoEntityId: 'entity-id', hasSSO: false } },
      loading: false,
      refetch: mockRefetch,
    });
    mockUseMutation.mockReturnValue([mockDisconnectFromSso, { loading: false }]);
  });

  afterEach(() => {
    global.URLSearchParams = OriginalUrlSearchParams;
  });

  it('renders only the ORCID connection when SSO is not enabled', () => {
    mockUseQuery.mockReturnValue({
      data: { me: { email: 'person@example.edu', ssoEntityId: null, hasSSO: false } },
      loading: false,
      refetch: mockRefetch,
    });

    renderPage();

    expect(screen.getByTestId('orcid-connection')).toBeInTheDocument();
    expect(screen.queryByTestId('sso-connection')).not.toBeInTheDocument();
  });

  it.each([
    ['the user query is loading', { queryLoading: true, disconnectLoading: false }],
    ['the disconnect mutation is loading', { queryLoading: false, disconnectLoading: true }],
  ])('renders loading while $s', (_description, { queryLoading, disconnectLoading }) => {
    mockUseQuery.mockReturnValue({
      data: undefined,
      loading: queryLoading,
      refetch: mockRefetch,
    });
    mockUseMutation.mockReturnValue([mockDisconnectFromSso, { loading: disconnectLoading }]);

    renderPage();

    expect(screen.getByTestId('loading')).toHaveTextContent('loading');
  });

  it('connects and disconnects ORCID with success notifications', async () => {
    renderPage();

    fireEvent.click(screen.getByRole('button', { name: 'orcid-connect' }));
    expect(await screen.findByRole('button', { name: 'orcid-disconnect' })).toBeInTheDocument();
    expect(mockToastAdd).toHaveBeenLastCalledWith('orcidConnection.connectSuccess', { type: 'success' });

    fireEvent.click(screen.getByRole('button', { name: 'orcid-disconnect' }));
    await waitFor(() => {
      expect(screen.getByRole('button', { name: 'orcid-connect' })).toBeInTheDocument();
    });
    expect(mockToastAdd).toHaveBeenLastCalledWith('orcidConnectionConnected.disconnectSuccess', { type: 'success' });
  });

  it('shows an error when the SSO connection cannot be started', async () => {
    mockUseQuery.mockReturnValue({
      data: { me: { email: '', ssoEntityId: 'entity-id', hasSSO: false } },
      loading: false,
      refetch: mockRefetch,
    });

    renderPage();
    fireEvent.click(screen.getByRole('button', { name: 'sso-connect' }));

    expect(await screen.findByRole('alert')).toHaveTextContent('ssoConnectionConnected.ssoNotEnabled');
    expect(screen.getByRole('button', { name: 'sso-connect' })).toBeInTheDocument();
  });

  it('redirects to the SSO provider with the user email and entity ID', async () => {
    const consoleError = jest.spyOn(console, 'error').mockImplementation();
    process.env.NEXT_PUBLIC_AUTH_ENDPOINT = 'https://auth.example.edu';

    renderPage();
    fireEvent.click(screen.getByRole('button', { name: 'sso-connect' }));

    await waitFor(() => {
      expect(screen.getByRole('button', { name: 'sso-connect' })).toBeInTheDocument();
    });
    expect(mockLogECS).not.toHaveBeenCalled();
    consoleError.mockRestore();
  });

  it('reports an SSO connection error when URL construction fails', async () => {
    global.URLSearchParams = jest.fn(() => {
      throw new Error('URL construction failed');
    }) as unknown as typeof URLSearchParams;

    renderPage();
    fireEvent.click(screen.getByRole('button', { name: 'sso-connect' }));

    expect(await screen.findByRole('alert')).toHaveTextContent('ssoConnectionConnected.ssoConnectError');
    expect(mockLogECS).toHaveBeenCalledWith(
      'error',
      'SSO link error',
      expect.objectContaining({ url: { path: '/account/connections' } }),
    );
  });

  it.each([
    ['has no response', undefined, 'ssoConnectionConnected.ssoDisconnectError'],
    ['returns no disconnect result', { data: {} }, 'ssoConnectionConnected.ssoDisconnectError'],
    ['returns a general error', { data: { disconnectSSO: { errors: { general: 'Disconnect failed' } } } }, 'Disconnect failed'],
    ['returns errors without a general message', { data: { disconnectSSO: { errors: {} } } }, 'ssoConnectionConnected.ssoDisconnectError'],
  ])('shows an error when the SSO disconnect $s', async (_description, response, errorMessage) => {
    mockUseQuery.mockReturnValue({
      data: { me: { email: 'person@example.edu', ssoEntityId: 'entity-id', hasSSO: true } },
      loading: false,
      refetch: mockRefetch,
    });
    mockDisconnectFromSso.mockResolvedValue(response);

    renderPage();
    fireEvent.click(screen.getByRole('button', { name: 'sso-disconnect' }));

    expect(await screen.findByRole('alert')).toHaveTextContent(errorMessage);
  });

  it('refreshes the user and notifies them after disconnecting SSO', async () => {
    mockUseQuery.mockReturnValue({
      data: { me: { email: 'person@example.edu', ssoEntityId: 'entity-id', hasSSO: true } },
      loading: false,
      refetch: mockRefetch,
    });
    mockDisconnectFromSso.mockResolvedValue({ data: { disconnectSSO: { errors: null } } });

    renderPage();
    fireEvent.click(screen.getByRole('button', { name: 'sso-disconnect' }));

    await waitFor(() => expect(mockRefetch).toHaveBeenCalled());
    expect(mockToastAdd).toHaveBeenCalledWith('ssoConnectionConnected.disconnectSuccess', {
      type: 'success',
      timeout: 3000,
    });
  });

  it('logs a failed SSO disconnect', async () => {
    mockUseQuery.mockReturnValue({
      data: { me: { email: 'person@example.edu', ssoEntityId: 'entity-id', hasSSO: true } },
      loading: false,
      refetch: mockRefetch,
    });
    mockDisconnectFromSso.mockRejectedValue(new Error('Disconnect failed'));

    renderPage();
    fireEvent.click(screen.getByRole('button', { name: 'sso-disconnect' }));

    await waitFor(() => {
      expect(mockLogECS).toHaveBeenCalledWith(
        'error',
        'SSO disconnect error',
        expect.objectContaining({ url: { path: '/account/connections' } }),
      );
    });
  });

  it('notifies the user of a completed SSO connection and removes the callback parameter', () => {
    mockSearchParams = new URLSearchParams('linked=true&source=sso');
    const replaceState = jest.spyOn(window.history, 'replaceState');

    renderPage();

    expect(mockToastAdd).toHaveBeenCalledWith('ssoConnection.connectSuccess', {
      type: 'success',
      timeout: 3000,
    });
    expect(mockRoutePath).toHaveBeenCalledWith('account.connections');
    expect(replaceState).toHaveBeenCalledWith(null, '', '/account/connections?source=sso');
  });
});
