import { ReactNode } from 'react';
import { act, fireEvent, render, screen, within, waitFor, cleanup } from '@/utils/test-utils';
import { MockedProvider } from '@apollo/client/testing/react';
import { InMemoryCache } from '@apollo/client';
import { RichTranslationValues } from 'next-intl';
import { useRouter, useParams } from 'next/navigation';
import { useToast } from '@/context/ToastContext';
import TemplateCustomizationOverview from '../page';
import { axe, toHaveNoViolations } from 'jest-axe';
import logECS from '@/utils/clientLogger';
import {
  mocks,
  errorMock,
  draftStatusMock,
  unpublishedChangesMock,
  notStartedMock,
  publishErrorMock,
  publishNoResultMock,
  publishNetworkErrorMock,
  unpublishSuccessMock,
  unpublishErrorMock,
  unpublishNoResultMock,
  unpublishNetworkErrorMock,
  moveSectionSuccessMock,
  moveSectionErrorMock,
  deleteSuccessMock,
  deleteErrorMock,
  draftPublishSuccessMock,
  moveSectionNetworkErrorMock,
  deleteNetworkErrorMock
} from '../__mocks__/templateCustomizationOverview.mocks';

expect.extend(toHaveNoViolations);

// Mock next/navigation
jest.mock('next/navigation', () => ({
  useRouter: jest.fn(),
  useParams: jest.fn(),
}));

jest.mock('@/context/ToastContext', () => ({
  useToast: jest.fn(() => ({
    add: jest.fn(),
  })),
}));

type MockUseTranslations = {
  (key: string, ...args: unknown[]): string;
  rich: (key: string, values?: RichTranslationValues) => ReactNode;
};

jest.mock('@/utils/clientLogger', () => jest.fn());

jest.mock('next-intl', () => ({
  useFormatter: jest.fn(() => ({
    dateTime: jest.fn(() => '01-01-2023'),
  })),
  useTranslations: jest.fn(() => {
    const mockUseTranslations: MockUseTranslations = ((key: string) => key) as MockUseTranslations;

    mockUseTranslations.rich = (key, values) => {
      const p = values?.p;
      if (typeof p === 'function') {
        return p(key); // Can return JSX
      }
      return key; // fallback
    };

    return mockUseTranslations;
  }),
}));

jest.mock('@/components/CustomizedTemplate/CustomizedSectionEdit', () => {
  return {
    __esModule: true,
    /* eslint-disable @typescript-eslint/no-explicit-any */
    default: ({ section, onMoveUp, onMoveDown }: any) => (
      <div data-testid="customized-section-edit">
        <h2>{section.name}</h2>
        {onMoveUp && <button onClick={onMoveUp}>Move Up</button>}
        {onMoveDown && <button onClick={onMoveDown}>Move Down</button>}
      </div>
    ),
  };
});

jest.mock('@/components/AddSectionButton', () => {
  return {
    __esModule: true,
    default: ({ href }: { href: string }) => (
      <a data-testid="add-section-button" href={href}>
        Add Section
      </a>
    ),
  };
});

let apolloCache: InMemoryCache;
const mockRouter = {
  push: jest.fn(),
  back: jest.fn(),
  forward: jest.fn(),
  refresh: jest.fn(),
  replace: jest.fn(),
  prefetch: jest.fn(),
};

const mockToastAdd = jest.fn();

describe('TemplateCustomizationOverview', () => {
  beforeEach(() => {
    window.scrollTo = jest.fn();

    apolloCache = new InMemoryCache();
    HTMLElement.prototype.scrollIntoView = jest.fn();
    HTMLElement.prototype.focus = jest.fn();

    (useRouter as jest.Mock).mockReturnValue(mockRouter);
    (useParams as jest.Mock).mockReturnValue({ templateCustomizationId: '1' });
    (useToast as jest.Mock).mockReturnValue({ add: mockToastAdd });
  });

  afterEach(async () => {
    await act(async () => {
      await new Promise(resolve => setTimeout(resolve, 50));
    });
    jest.clearAllMocks();
    await apolloCache.reset();
    cleanup();
  });

  /* eslint-disable @typescript-eslint/no-explicit-any */
  const renderPage = (apolloMocks: any = mocks) => render(
    <MockedProvider
      mocks={apolloMocks}
      cache={apolloCache}
    >
      <TemplateCustomizationOverview />
    </MockedProvider>
  );

  describe('Page Rendering', () => {
    it('should render the page header with correct title and description', async () => {
      renderPage();

      const heading = await screen.findByRole('heading', { level: 1 });
      expect(heading).toHaveTextContent('NSF-BIO: Biological Sciences');

      expect(screen.getByText(/by National Science Foundation/)).toBeInTheDocument();
      expect(screen.getByText(/version/)).toBeInTheDocument();
    });

    it('should render breadcrumbs with correct links', async () => {
      renderPage();

      await waitFor(() => {
        const homeLink = screen.getByText('breadcrumbs.home');
        const templatesLink = screen.getByText('breadcrumbs.templateCustomizations');
        expect(homeLink).toBeInTheDocument();
        expect(templatesLink).toBeInTheDocument();
        expect(homeLink).toHaveAttribute('href', '/en-US');
        expect(templatesLink).toHaveAttribute('href', '/en-US/template/customizations');
      });
    });

    it('should render sections when template has sections', async () => {
      renderPage();

      const sections = await screen.findAllByTestId('customized-section-edit');
      expect(sections).toHaveLength(2);

      expect(screen.getByText('Project Information')).toBeInTheDocument();
      expect(screen.getByText('Custom Section')).toBeInTheDocument();
    });

    it('should render add section button with correct href', async () => {
      renderPage();

      const addButton = await screen.findByTestId('add-section-button');
      expect(addButton).toBeInTheDocument();
      expect(addButton).toHaveAttribute('href', '/template/customizations/1/section/create');
    });

    it('should render error message when query fails', async () => {
      renderPage(errorMock);

      expect(await screen.findByText('Network error')).toBeInTheDocument();
    });
  });

  describe('Customization Status - Published', () => {
    it('should show unpublish button for published customization', async () => {
      renderPage();

      const unpublishButton = await screen.findByRole('button', { name: /buttons.unpublish/i });
      expect(unpublishButton).toBeInTheDocument();
    });

    it('should show publish status as published', async () => {
      renderPage();

      expect(await screen.findByText('buttons.publishStatus')).toBeInTheDocument();
    });
  });

  describe('Customization Status - Draft', () => {
    it('should show publish button for draft customization', async () => {
      renderPage(draftStatusMock);

      const publishButton = await screen.findByRole('button', { name: /buttons.publishCustomization/i });
      expect(publishButton).toBeInTheDocument();
    });
  });

  describe('Customization Status - Unpublished Changes', () => {
    it('should show both publish changes and unpublish buttons', async () => {
      renderPage(unpublishedChangesMock);

      const publishButton = await screen.findByRole('button', { name: /buttons.publishChanges/i });
      const unpublishButton = await screen.findByRole('button', { name: /buttons.unpublish/i });

      expect(publishButton).toBeInTheDocument();
      expect(unpublishButton).toBeInTheDocument();
    });
  });

  describe('Customization Status - Not Started', () => {
    it('should not show any publish/unpublish buttons for not started customization', async () => {
      renderPage(notStartedMock);

      await waitFor(() => {
        expect(screen.queryByRole('button', { name: /publish/i })).not.toBeInTheDocument();
        expect(screen.queryByRole('button', { name: /unpublish/i })).not.toBeInTheDocument();
      });
    });
  });

  describe('Publish Customization', () => {
    it('should successfully publish customization', async () => {
      renderPage(draftPublishSuccessMock);

      const publishButton = await screen.findByRole('button', { name: /buttons.publishCustomization/i });

      await act(async () => {
        fireEvent.click(publishButton);
      });

      await waitFor(() => {
        expect(mockToastAdd).toHaveBeenCalledWith('successfullyUpdated', { type: 'success' });
      });
    });

    it('should show error message when publish fails', async () => {
      renderPage(publishErrorMock);

      const publishButton = await screen.findByRole('button', { name: /buttons.publishChanges/i });

      await act(async () => {
        fireEvent.click(publishButton);
      });

      await waitFor(() => {
        expect(screen.queryByText('Failed to publish customization')).toBeInTheDocument();
      });
    });

    it('should show error message when publish returns no result', async () => {
      renderPage(publishNoResultMock);

      const publishButton = await screen.findByRole('button', { name: /buttons.publishCustomization/i });

      await act(async () => {
        fireEvent.click(publishButton);
      });

      await waitFor(() => {
        expect(screen.queryByText('messages.error.saveCustomizationError')).toBeInTheDocument();
        expect(logECS).toHaveBeenCalledWith('error', 'saveCustomizationTemplate', {
          error: 'No result returned from mutation',
          url: { path: '/en-US/template/customizations/1' },
        });
      });
    });

    it('should show error message when publish throws a network error', async () => {
      renderPage(publishNetworkErrorMock);

      const publishButton = await screen.findByRole('button', { name: /buttons.publishCustomization/i });

      await act(async () => {
        fireEvent.click(publishButton);
      });

      await waitFor(() => {
        expect(screen.queryByText('messages.error.saveCustomizationError')).toBeInTheDocument();
        expect(logECS).toHaveBeenCalledWith('error', 'saveCustomizationTemplate',
          expect.objectContaining({
            error: expect.any(Error),
            url: expect.objectContaining({
              path: expect.stringContaining('/template/customizations/1')
            }),
          })
        );
      });
    });

  });

  describe('Unpublish Customization', () => {
    it('should successfully unpublish customization', async () => {
      renderPage(unpublishSuccessMock);

      const unpublishButton = await screen.findByRole('button', { name: /buttons.unpublish/i });

      await act(async () => {
        fireEvent.click(unpublishButton);
      });

      await waitFor(() => {
        expect(mockToastAdd).toHaveBeenCalledWith(
          'messages.success.successfullyUnpublishedCustomization',
          { type: 'success' }
        );
      });
    });

    it('should show error message when unpublish fails', async () => {
      renderPage(unpublishErrorMock);

      const unpublishButton = await screen.findByRole('button', { name: /buttons.unpublish/i });

      await act(async () => {
        fireEvent.click(unpublishButton);
      });

      await waitFor(() => {
        expect(screen.queryByText('Failed to unpublish customization')).toBeInTheDocument();
      });
    });

    it('should show error message when unpublish returns no result', async () => {
      renderPage(unpublishNoResultMock);

      const unpublishButton = await screen.findByRole('button', { name: /buttons.unpublish/i });

      await act(async () => {
        fireEvent.click(unpublishButton);
      });

      await waitFor(() => {
        expect(screen.queryByText('messages.error.unpublishCustomizationError')).toBeInTheDocument();
        expect(logECS).toHaveBeenCalledWith('error', 'unpublishTemplateCustomization', {
          error: 'No result returned from mutation',
          url: { path: '/en-US/template/customizations/1' },
        });
      });
    });

    it('should show error message when unpublish throws a network error', async () => {
      renderPage(unpublishNetworkErrorMock);

      const unpublishButton = await screen.findByRole('button', { name: /buttons.unpublish/i });

      await act(async () => {
        fireEvent.click(unpublishButton);
      });

      await waitFor(() => {
        expect(screen.queryByText('messages.error.unpublishCustomizationError')).toBeInTheDocument();
        expect(logECS).toHaveBeenCalledWith('error', 'unpublishTemplateCustomization',
          expect.objectContaining({
            error: expect.any(Error),
            url: expect.objectContaining({
              path: expect.stringContaining('/template/customizations/1')
            }),
          })
        );
      });
    });
  });

  describe('Section Movement', () => {
    it('should move custom section up', async () => {
      renderPage(moveSectionSuccessMock);

      const sections = await screen.findAllByTestId('customized-section-edit');
      const customSection = sections[1]; // Custom Section is second

      const moveUpButton = within(customSection).getByRole('button', { name: /Move Up/i });

      await act(async () => {
        fireEvent.click(moveUpButton);
      });

      await waitFor(() => {
        expect(mockToastAdd).toHaveBeenCalledWith(
          'messages.success.sectionMoved',
          { type: 'success' }
        );
      });
    });

    it('should show error when section movement fails', async () => {
      renderPage(moveSectionErrorMock);

      const sections = await screen.findAllByTestId('customized-section-edit');
      const customSection = sections[1];

      const moveUpButton = within(customSection).getByRole('button', { name: /Move Up/i });

      await act(async () => {
        fireEvent.click(moveUpButton);
      });

      await waitFor(() => {
        expect(screen.queryByText('Failed to move section')).toBeInTheDocument();
      });
    });

    it('should not show move buttons for base sections', async () => {
      renderPage();

      const sections = await screen.findAllByTestId('customized-section-edit');
      const baseSection = sections[0]; // Project Information is base

      expect(within(baseSection).queryByRole('button', { name: /Move Up/i })).not.toBeInTheDocument();
      expect(within(baseSection).queryByRole('button', { name: /Move Down/i })).not.toBeInTheDocument();
    });

    it('should show error message when section movement throws a network error', async () => {
      renderPage(moveSectionNetworkErrorMock);

      const sections = await screen.findAllByTestId('customized-section-edit');
      const customSection = sections[1];

      const moveUpButton = within(customSection).getByRole('button', { name: /Move Up/i });

      await act(async () => {
        fireEvent.click(moveUpButton);
      });

      await waitFor(() => {
        expect(screen.queryByText('messages.error.updatingSectionMoveError')).toBeInTheDocument();
        expect(logECS).toHaveBeenCalledWith('error', 'handleSectionMove', {
          error: expect.any(Error),
          url: { path: '/en-US/template/customizations/1' },
        });
      });
    });
  });

  describe('Delete Customization', () => {
    it('should open delete modal when delete button is clicked', async () => {
      renderPage();

      const deleteButton = await screen.findByRole('button', { name: /buttons.deleteCustomization/i });

      await act(async () => {
        fireEvent.click(deleteButton);
      });

      expect(await screen.findByRole('heading', { name: /heading.deleteCustomization/i })).toBeInTheDocument();
    });

    it('should successfully delete customization', async () => {
      renderPage(deleteSuccessMock);

      const deleteButton = await screen.findByRole('button', { name: /buttons.deleteCustomization/i });

      await act(async () => {
        fireEvent.click(deleteButton);
      });

      const confirmButton = await screen.findByRole('button', { name: /buttons.delete/i });

      await act(async () => {
        fireEvent.click(confirmButton);
      });

      await waitFor(() => {
        expect(mockToastAdd).toHaveBeenCalledWith(
          'messages.success.successfullyDeletedCustomizations',
          { type: 'success' }
        );
      });
    });

    it('should show error when delete fails', async () => {
      renderPage(deleteErrorMock);

      const deleteButton = await screen.findByRole('button', { name: /buttons.deleteCustomization/i });

      await act(async () => {
        fireEvent.click(deleteButton);
      });

      const confirmButton = await screen.findByRole('button', { name: /buttons.delete/i });

      await act(async () => {
        fireEvent.click(confirmButton);
      });

      await waitFor(() => {
        expect(screen.queryByText('Failed to delete customization')).toBeInTheDocument();
      });
    });

    it('should close modal when cancel is clicked', async () => {
      renderPage();

      const deleteButton = await screen.findByRole('button', { name: /buttons.deleteCustomization/i });

      await act(async () => {
        fireEvent.click(deleteButton);
      });

      const cancelButton = await screen.findByRole('button', { name: /buttons.cancel/i });

      await act(async () => {
        fireEvent.click(cancelButton);
      });

      await waitFor(() => {
        expect(screen.queryByRole('heading', { name: /heading.deleteCustomization/i, level: 3 })).not.toBeInTheDocument();
      });
    });

    it('should log error when delete throws a network error', async () => {
      renderPage(deleteNetworkErrorMock);

      const deleteButton = await screen.findByRole('button', { name: /buttons.deleteCustomization/i });

      await act(async () => {
        fireEvent.click(deleteButton);
      });

      const confirmButton = await screen.findByRole('button', { name: /buttons.delete/i });

      await act(async () => {
        fireEvent.click(confirmButton);
      });

      await waitFor(() => {
        expect(screen.queryByText('messages.error.deleteCustomizationError')).toBeInTheDocument();
        expect(logECS).toHaveBeenCalledWith('error', 'handleDeleteCustomization',
          expect.objectContaining({
            error: expect.any(Error),
            url: expect.objectContaining({
              path: expect.stringContaining('/en-US/template/customizations/1')
            }),
          })
        );
      });
    });

  });

  describe('Sidebar Links', () => {
    it('should render preview link', async () => {
      renderPage();

      const previewLink = await screen.findByText('buttons.preview');
      expect(previewLink).toBeInTheDocument();
    });

    it('should render manage access link with correct href', async () => {
      renderPage();

      const manageAccessLink = await screen.findByRole('link', { name: /links.manageAccess/i });
      expect(manageAccessLink).toBeInTheDocument();
      expect(manageAccessLink).toHaveAttribute('href', '/template/customizations/1/access');
    });

    it('should render template history link with correct href', async () => {
      renderPage();

      const historyLink = await screen.findByRole('link', { name: /links.templateHistory/i });
      expect(historyLink).toBeInTheDocument();
      expect(historyLink).toHaveAttribute('href', '/template/customizations/1/history');
    });
  });

  describe('Accessibility', () => {
    it('should have no accessibility violations', async () => {
      const { container } = renderPage();

      await screen.findByRole('heading', { level: 1 });

      const results = await axe(container);
      expect(results).toHaveNoViolations();
    });

    it('should have proper ARIA labels for delete section', async () => {
      renderPage();

      const deleteSection = await screen.findByTestId('delete-customization-section');
      expect(deleteSection).toHaveAttribute('aria-labelledby', 'delete-customization-heading');
    });
  });
});
