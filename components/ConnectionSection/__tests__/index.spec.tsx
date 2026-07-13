import React from 'react';
import { render, screen, fireEvent, waitFor } from '@testing-library/react';
import '@testing-library/jest-dom';
import ConnectionSection from '..';

jest.mock('next-intl', () => ({
  useTranslations: jest.fn(() => (key: string) => key)
}));

jest.mock('../../ButtonWithImage', () => {
  return function DummyButtonWithImage({
    buttonText,
    onPress
  }: {
    buttonText: string;
    onPress?: () => void;
  }) {
    return (
      <button data-testid="button-with-image" onClick={onPress}>
        {buttonText}
      </button>
    );
  };
});

jest.mock('@/components/Icons', () => ({
  DmpIcon: function DummyDmpIcon({ icon }: { icon: string }) {
    return <span data-testid="dmp-icon">{icon}</span>;
  }
}));

describe('ConnectionSection', () => {
  const baseProps = {
    title: 'Test Title',
    content: 'Test Content',
    btnUrl: 'https://example.com',
    btnImageUrl: 'https://example.com/image.png',
    btnText: 'Connect'
  };

  beforeEach(() => {
    jest.clearAllMocks();
  });

  describe('not connected', () => {
    it('should render the connect button', () => {
      render(<ConnectionSection type="orcid" {...baseProps} />);

      expect(screen.getByTestId('button-with-image')).toBeInTheDocument();
      expect(screen.getByText('Connect')).toBeInTheDocument();
      expect(screen.getByText('Test Title')).toBeInTheDocument();
      expect(screen.getByText('Test Content')).toBeInTheDocument();
    });

    it('should call onConnect when the connect button is pressed', () => {
      const onConnect = jest.fn();
      render(<ConnectionSection type="orcid" {...baseProps} onConnect={onConnect} />);

      fireEvent.click(screen.getByTestId('button-with-image'));
      expect(onConnect).toHaveBeenCalledTimes(1);
    });

    it('should not render the connected row or disconnect button', () => {
      render(<ConnectionSection type="orcid" {...baseProps} />);

      expect(screen.queryByRole('link')).not.toBeInTheDocument();
      expect(
        screen.queryByRole('button', { name: 'orcidConnectionConnected.disconnectAria' })
      ).not.toBeInTheDocument();
    });
  });

  describe('connected (orcid)', () => {
    const connectedProps = {
      ...baseProps,
      isConnected: true,
      connectedIdentifier: '0000-0001-2345-6789'
    };

    it('should render the ORCID iD as a link to the ORCID record', () => {
      render(<ConnectionSection type="orcid" {...connectedProps} />);

      const link = screen.getByRole('link', {
        name: '0000-0001-2345-6789, opensInNewTab'
      });
      expect(link).toHaveAttribute('href', 'https://orcid.org/0000-0001-2345-6789');
      expect(link).toHaveAttribute('target', '_blank');
      expect(link).toHaveTextContent('0000-0001-2345-6789');
      expect(link).toHaveTextContent('https://orcid.org/0000-0001-2345-6789');
    });

    it('should group the connected row with an accessible label', () => {
      render(<ConnectionSection type="orcid" {...connectedProps} />);

      expect(screen.getByRole('group', { name: 'Test Title' })).toBeInTheDocument();
    });

    it('should render the connected badge and not the connect button', () => {
      render(<ConnectionSection type="orcid" {...connectedProps} />);

      expect(screen.getByText('orcidConnectionConnected.connectedBadge')).toBeInTheDocument();
      expect(screen.queryByTestId('button-with-image')).not.toBeInTheDocument();
    });

    it('should render a labeled disconnect button', () => {
      render(<ConnectionSection type="orcid" {...connectedProps} />);

      const disconnectButton = screen.getByRole('button', {
        name: 'orcidConnectionConnected.disconnectAria'
      });
      expect(disconnectButton).toBeInTheDocument();
      expect(disconnectButton).toHaveClass('danger');
    });

    it('should open the confirmation dialog when disconnect is pressed', async () => {
      render(<ConnectionSection type="orcid" {...connectedProps} />);

      fireEvent.click(
        screen.getByRole('button', { name: 'orcidConnectionConnected.disconnectAria' })
      );

      await waitFor(() => {
        expect(screen.getByRole('alertdialog')).toBeInTheDocument();
      });
      expect(
        screen.getByText('orcidConnectionConnected.disconnectConfirmMessage')
      ).toBeInTheDocument();
    });

    it('should call onDisconnect when the confirm button is pressed', async () => {
      const onDisconnect = jest.fn();
      render(
        <ConnectionSection type="orcid" {...connectedProps} onDisconnect={onDisconnect} />
      );

      fireEvent.click(
        screen.getByRole('button', { name: 'orcidConnectionConnected.disconnectAria' })
      );
      await waitFor(() => {
        expect(screen.getByRole('alertdialog')).toBeInTheDocument();
      });

      const dialog = screen.getByRole('alertdialog');
      const confirmButton = Array.from(dialog.querySelectorAll('button')).find(
        (btn) => btn.classList.contains('danger')
      );
      expect(confirmButton).toBeDefined();
      fireEvent.click(confirmButton!);

      await waitFor(() => {
        expect(onDisconnect).toHaveBeenCalledTimes(1);
        expect(screen.queryByRole('alertdialog')).not.toBeInTheDocument();
      });
    });

    it('should close the dialog without calling onDisconnect when cancel is pressed', async () => {
      const onDisconnect = jest.fn();
      render(
        <ConnectionSection type="orcid" {...connectedProps} onDisconnect={onDisconnect} />
      );

      fireEvent.click(
        screen.getByRole('button', { name: 'orcidConnectionConnected.disconnectAria' })
      );
      await waitFor(() => {
        expect(screen.getByRole('alertdialog')).toBeInTheDocument();
      });

      fireEvent.click(screen.getByRole('button', { name: 'btnCancel' }));

      await waitFor(() => {
        expect(screen.queryByRole('alertdialog')).not.toBeInTheDocument();
      });
      expect(onDisconnect).not.toHaveBeenCalled();
    });
  });

  describe('connected (sso)', () => {
    it('should render the institution name as plain text (not a link)', () => {
      render(
        <ConnectionSection
          type="sso"
          {...baseProps}
          isConnected={true}
          connectedIdentifier="Example University"
        />
      );

      expect(screen.getByText('Example University')).toBeInTheDocument();
      expect(screen.queryByRole('link')).not.toBeInTheDocument();
      expect(
        screen.getByRole('button', { name: 'ssoConnectionConnected.disconnectAria' })
      ).toBeInTheDocument();
    });
  });
});
