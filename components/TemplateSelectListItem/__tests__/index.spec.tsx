import React, { ReactNode } from 'react';
import { act, fireEvent, render, screen, waitFor } from '@/utils/test-utils';
import { axe, toHaveNoViolations } from 'jest-axe';
import { RichTranslationValues } from 'next-intl';
import TemplateSelectListItem from '../index';

expect.extend(toHaveNoViolations);

jest.mock('@/context/ToastContext', () => ({
  useToast: jest.fn(() => ({
    add: jest.fn(),
  })),
}));

type MockUseTranslations = {
  (key: string, ...args: unknown[]): string;
  rich: (key: string, values?: RichTranslationValues) => ReactNode;
};

jest.mock('next-intl', () => ({
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

jest.mock('@/components/PageHeader', () => ({
  __esModule: true,
  default: () => <div data-testid="mock-page-header" />
}));

const mockOnSelect = jest.fn();

const props = {
  onSelect: mockOnSelect,
  item: {
    id: 10,
    template: {
      id: 20,
    },
    funder: 'NSF',
    title: 'NSF Dolphin Research',
    description: 'Researching dolphins in Fiji',
    lastRevisedBy: "Henry Ford",
    lastUpdated: '10-25-2025',
    hasAdditionalGuidance: true,
    publishStatus: 'notPublished',
    visibility: 'public',
    publishDate: '10-25-2025',
    link: '/templates/10',
  },
}

describe('TemplateSelectListItem', () => {
  beforeEach(() => {
    window.scrollTo = jest.fn();
    HTMLElement.prototype.scrollIntoView = jest.fn();
  });

  it('should render the main content', async () => {
    await act(async () => {
      render(
        <TemplateSelectListItem item={props.item} onSelect={props.onSelect} />
      );
    });

    const role = screen.getByRole('listitem');
    const description = screen.getByText(/Researching dolphins in Fiji/i);
    const selectButton = screen.getByRole('button', { name: /select/i });
    expect(role).toBeInTheDocument();
    expect(description).toBeInTheDocument();
    expect(selectButton).toBeInTheDocument();
    expect(screen.getByText('lastRevisedBy: Henry Ford')).toBeInTheDocument();
    expect(screen.getByText('lastUpdated: 10-25-2025')).toBeInTheDocument();
    expect(screen.getByText(/notPublished/i)).toBeInTheDocument();
    expect(screen.getByText(/visibility\s*:\s*Public/i)).toBeInTheDocument();
    expect(screen.getByText('messages.additionalGuidance')).toBeInTheDocument();
  });

  it('should call onSelect method when user clicks the onSelect button', async () => {
    await act(async () => {
      render(
        <TemplateSelectListItem item={props.item} onSelect={props.onSelect} />
      );
    });

    const selectButton = screen.getByRole('button', { name: /select/i });
    await act(async () => {
      fireEvent.click(selectButton);
    });
    expect(mockOnSelect).toHaveBeenCalled();
  });

  it('should pass accessibility tests', async () => {
    /*Need to wrap the component in a div with role='list' to prevent
    an accessibility error because the component uses role = 'listitem' */
    const { container } = render(
      <div role="list">
        <TemplateSelectListItem item={props.item} onSelect={props.onSelect} />
      </div>
    );
    const results = await axe(container);
    expect(results).toHaveNoViolations();
  });

  it('should render the best practice indicator when bestPractices is true', async () => {
    await act(async () => {
      render(
        <TemplateSelectListItem
          item={{ ...props.item, bestPractices: true }}
          onSelect={props.onSelect}
        />
      );
    });

    expect(screen.getByText('messages.bestPracticeLabel')).toBeInTheDocument();
    // The explanation lives in a popover and is not rendered until opened.
    expect(screen.queryByText('messages.bestPracticeTooltip')).not.toBeInTheDocument();
  });

  it('should open the best practice explanation popover on click', async () => {
    await act(async () => {
      render(
        <TemplateSelectListItem
          item={{ ...props.item, bestPractices: true }}
          onSelect={props.onSelect}
        />
      );
    });

    const trigger = screen.getByRole('button', { name: 'messages.bestPracticeLabel' });
    await act(async () => {
      fireEvent.click(trigger);
    });

    expect(await screen.findByText('messages.bestPracticeTooltip')).toBeInTheDocument();
  });

  it('should expose the best practice explanation as a labelled dialog', async () => {
    await act(async () => {
      render(
        <TemplateSelectListItem
          item={{ ...props.item, bestPractices: true }}
          onSelect={props.onSelect}
        />
      );
    });

    const trigger = screen.getByRole('button', { name: 'messages.bestPracticeLabel' });
    await act(async () => {
      fireEvent.click(trigger);
    });

    // Popover content is a dialog named by the info aria label.
    const dialog = await screen.findByRole('dialog', {
      name: 'messages.bestPracticeInfoAria',
    });
    expect(dialog).toBeInTheDocument();
  });

  it('should close the best practice popover when the trigger is toggled', async () => {
    await act(async () => {
      render(
        <TemplateSelectListItem
          item={{ ...props.item, bestPractices: true }}
          onSelect={props.onSelect}
        />
      );
    });

    const trigger = screen.getByRole('button', { name: 'messages.bestPracticeLabel' });

    // Open
    await act(async () => {
      fireEvent.click(trigger);
    });
    expect(await screen.findByText('messages.bestPracticeTooltip')).toBeInTheDocument();

    // Toggle closed
    await act(async () => {
      fireEvent.click(trigger);
    });
    await waitFor(() => {
      expect(screen.queryByText('messages.bestPracticeTooltip')).not.toBeInTheDocument();
    });
  });

  it('should close the best practice popover when Escape is pressed', async () => {
    await act(async () => {
      render(
        <TemplateSelectListItem
          item={{ ...props.item, bestPractices: true }}
          onSelect={props.onSelect}
        />
      );
    });

    const trigger = screen.getByRole('button', { name: 'messages.bestPracticeLabel' });
    await act(async () => {
      fireEvent.click(trigger);
    });
    const dialog = await screen.findByRole('dialog');

    await act(async () => {
      fireEvent.keyDown(dialog, { key: 'Escape', code: 'Escape' });
    });
    await waitFor(() => {
      expect(screen.queryByText('messages.bestPracticeTooltip')).not.toBeInTheDocument();
    });
  });

  it('should not render the best practice indicator when bestPractices is false', async () => {
    await act(async () => {
      render(
        <TemplateSelectListItem
          item={{ ...props.item, bestPractices: false }}
          onSelect={props.onSelect}
        />
      );
    });

    expect(screen.queryByText('messages.bestPracticeLabel')).not.toBeInTheDocument();
  });

  it('should render both the guidance footer and best practice badge when both apply', async () => {
    await act(async () => {
      render(
        <TemplateSelectListItem
          item={{ ...props.item, hasAdditionalGuidance: true, bestPractices: true }}
          onSelect={props.onSelect}
        />
      );
    });

    expect(screen.getByText('messages.additionalGuidance')).toBeInTheDocument();
    expect(screen.getByText('messages.bestPracticeLabel')).toBeInTheDocument();
  });
});
