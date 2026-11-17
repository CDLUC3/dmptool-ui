import React from 'react';
import { act, render, screen, waitFor, within } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import '@testing-library/jest-dom';
import { axe, toHaveNoViolations } from 'jest-axe';
import { useMutation, useQuery } from '@apollo/client/react';

import {
  AddTemplateLinkDocument,
  RemoveTemplateLinkDocument,
  TemplateDocument,
  TemplateLinksDocument,
  TemplateLinkType,
  UpdateTemplateLinkDocument,
} from '@/generated/graphql';
import { useToast } from '@/context/ToastContext';
import TemplateLinks, { isValidLinkUrl } from '@/components/TemplateLinks';

expect.extend(toHaveNoViolations);

jest.mock('@apollo/client/react', () => ({
  useQuery: jest.fn(),
  useMutation: jest.fn(),
}));

const mockUseQuery = jest.mocked(useQuery);
const mockUseMutation = jest.mocked(useMutation);
const mockUseToast = jest.mocked(useToast);

const TEMPLATE_ID = 15;

const funderLink = (id: number, text = `Funder link ${id}`) => ({
  __typename: 'TemplateLink',
  id,
  linkType: TemplateLinkType.Funder,
  url: `https://funder.example.org/${id}`,
  text,
});

const buildTemplate = (overrides = {}) => ({
  __typename: 'Template',
  id: TEMPLATE_ID,
  funderLinks: [funderLink(1, 'NSF requirements'), funderLink(2, 'Policy')],
  samplePlanLinks: [],
  maxFunderLinks: 5,
  maxSamplePlanLinks: 5,
  ...overrides,
});

let mockAdd: jest.Mock;
let mockUpdate: jest.Mock;
let mockRemove: jest.Mock;
let mockToastAdd: jest.Mock;

/* eslint-disable @typescript-eslint/no-explicit-any */
const setup = (template: any = buildTemplate(), error?: Error) => {
  mockUseQuery.mockImplementation((document) => {
    if (document === TemplateLinksDocument) {
      return { data: { template }, loading: false, error } as any;
    }
    return { data: undefined, loading: false, error: undefined } as any;
  });

  mockUseMutation.mockImplementation((document) => {
    if (document === AddTemplateLinkDocument) return [mockAdd, {}] as any;
    if (document === UpdateTemplateLinkDocument) return [mockUpdate, {}] as any;
    if (document === RemoveTemplateLinkDocument) return [mockRemove, {}] as any;
    return [jest.fn(), {}] as any;
  });

  return render(<TemplateLinks templateId={TEMPLATE_ID} />);
};

beforeEach(() => {
  jest.clearAllMocks();
  mockAdd = jest.fn();
  mockUpdate = jest.fn();
  mockRemove = jest.fn();
  mockToastAdd = jest.fn();
  mockUseToast.mockReturnValue({ add: mockToastAdd } as any);
});

describe('isValidLinkUrl', () => {
  it.each([
    ['https://example.org', true],
    ['http://example.org/path?q=1', true],
    ['ftp://example.org', false],
    ['javascript:alert(1)', false],
    ['example.org', false],
    ['', false],
  ])('returns the right result for %p', (url, expected) => {
    expect(isValidLinkUrl(url)).toBe(expected);
  });
});

describe('TemplateLinks', () => {
  it('loads the links for the template, with both link types and their limits', () => {
    setup();

    expect(mockUseQuery).toHaveBeenCalledWith(TemplateLinksDocument, expect.objectContaining({
      variables: { templateId: TEMPLATE_ID },
    }));
    expect(screen.getByText('heading')).toBeInTheDocument();
    expect(screen.getByText('description')).toBeInTheDocument();
    expect(screen.getByText('funder.title')).toBeInTheDocument();
    expect(screen.getByText('samplePlan.title')).toBeInTheDocument();
    // The mocked translator returns the key, so the counts render as "count"
    expect(screen.getByTestId('template-links-funder-count')).toHaveTextContent('count');
  });

  it('refetches the links and the template after a change', () => {
    setup();

    const options = mockUseMutation.mock.calls.find(([doc]) => doc === AddTemplateLinkDocument)?.[1] as any;
    expect(options.refetchQueries).toEqual([
      { query: TemplateLinksDocument, variables: { templateId: TEMPLATE_ID } },
      { query: TemplateDocument, variables: { templateId: TEMPLATE_ID } },
    ]);
  });

  it('shows a card for each funder link, with a link that opens in a new tab', () => {
    setup();

    const funderGroup = screen.getByTestId('template-links-funder');
    const cards = within(funderGroup).getAllByTestId('template-link-card');
    expect(cards).toHaveLength(2);
    expect(within(cards[0]).getByText('NSF requirements')).toBeInTheDocument();

    const openLink = within(cards[0]).getByRole('link', { name: 'labels.openLink' });
    expect(openLink).toHaveAttribute('href', 'https://funder.example.org/1');
    expect(openLink).toHaveAttribute('target', '_blank');
    expect(openLink).toHaveAttribute('rel', 'noopener noreferrer');
  });

  it('styles the add links like the other sidebar links', () => {
    setup();

    ['funder', 'samplePlan'].forEach((key) => {
      const addButton = within(screen.getByTestId(`template-links-${key}`))
        .getByRole('button', { name: new RegExp(`${key}.add`) });
      // `.side-panel .panelRow .buttonLink` in styles/globals.scss
      expect(addButton).toHaveClass('buttonLink');
      expect(addButton.parentElement).toHaveClass('panelRow');
    });
  });

  it('gives the icon link, Edit and Remove their own color classes', () => {
    setup();

    const firstCard = within(screen.getByTestId('template-links-funder')).getAllByTestId('template-link-card')[0];
    // identity-obj-proxy turns CSS module class names into their keys
    expect(within(firstCard).getByRole('button', { name: 'labels.editLink' })).toHaveClass('editButton');
    expect(within(firstCard).getByRole('button', { name: 'labels.removeLink' })).toHaveClass('removeButton');
    // The icon's color comes from --icon-fill on the openLink class
    expect(within(firstCard).getByRole('link', { name: 'labels.openLink' })).toHaveClass('openLink');
  });

  it('shows the empty message when there are no sample plan links', () => {
    setup();

    const sampleGroup = screen.getByTestId('template-links-samplePlan');
    expect(within(sampleGroup).getByText('samplePlan.empty')).toBeInTheDocument();
    expect(within(sampleGroup).queryByTestId('template-link-card')).not.toBeInTheDocument();
  });

  it('hides the add link when the maximum number of links has been reached', () => {
    setup(buildTemplate({ funderLinks: [1, 2, 3, 4, 5].map((id) => funderLink(id)) }));

    const funderGroup = screen.getByTestId('template-links-funder');
    expect(within(funderGroup).queryByRole('button', { name: /funder.add/ })).not.toBeInTheDocument();
    // The sample plan section is still under its limit
    const sampleGroup = screen.getByTestId('template-links-samplePlan');
    expect(within(sampleGroup).getByRole('button', { name: /samplePlan.add/ })).toBeInTheDocument();
  });

  it('shows an error when the links cannot be loaded', () => {
    setup(undefined, new Error('Network error'));
    expect(screen.getByRole('alert')).toHaveTextContent('messages.errors.loadFailed');
  });

  describe('adding a link', () => {
    it('adds a sample plan link and closes the modal', async () => {
      const user = userEvent.setup();
      mockAdd.mockResolvedValue({
        data: { addTemplateLink: { id: 99, linkType: 'SAMPLE_PLAN', url: 'https://x.org/plan.pdf', text: 'Plan', errors: {} } },
      });
      setup();

      await user.click(screen.getByRole('button', { name: /samplePlan.add/ }));
      const dialog = await screen.findByRole('dialog');
      expect(within(dialog).getByRole('heading', { name: 'samplePlan.addTitle' })).toBeInTheDocument();
      expect(within(dialog).getByText('labels.linkTextHelp')).toBeInTheDocument();

      await user.type(within(dialog).getByLabelText(/labels.linkText/), 'Plan');
      await user.type(within(dialog).getByLabelText(/labels.linkUrl/), '  https://x.org/plan.pdf  ');
      await user.click(within(dialog).getByRole('button', { name: 'buttons.addLink' }));

      await waitFor(() => {
        expect(mockAdd).toHaveBeenCalledWith({
          variables: {
            templateId: TEMPLATE_ID,
            linkType: TemplateLinkType.SamplePlan,
            url: 'https://x.org/plan.pdf',
            text: 'Plan',
          },
        });
      });
      expect(mockToastAdd).toHaveBeenCalledWith('messages.added', { type: 'success' });
      await waitFor(() => expect(screen.queryByRole('dialog')).not.toBeInTheDocument());
    });

    it('validates the fields before calling the API', async () => {
      const user = userEvent.setup();
      setup();

      await user.click(screen.getByRole('button', { name: /funder.add/ }));
      const dialog = await screen.findByRole('dialog');
      await user.click(within(dialog).getByRole('button', { name: 'buttons.addLink' }));

      expect(within(dialog).getByText('messages.errors.textRequired')).toBeInTheDocument();
      expect(within(dialog).getByText('messages.errors.urlRequired')).toBeInTheDocument();

      await user.type(within(dialog).getByLabelText(/labels.linkUrl/), 'not a url');
      await user.click(within(dialog).getByRole('button', { name: 'buttons.addLink' }));
      expect(within(dialog).getByText('messages.errors.urlInvalid')).toBeInTheDocument();
      expect(mockAdd).not.toHaveBeenCalled();
    });

    it('keeps the modal open and shows the errors the API returns', async () => {
      const user = userEvent.setup();
      mockAdd.mockResolvedValue({
        data: {
          addTemplateLink: {
            id: null,
            linkType: 'FUNDER',
            url: 'https://funder.example.org/1',
            text: 'Dup',
            errors: { general: 'That link is already associated with this Template', url: null, text: null, linkType: null },
          },
        },
      });
      setup();

      await user.click(screen.getByRole('button', { name: /funder.add/ }));
      const dialog = await screen.findByRole('dialog');
      await user.type(within(dialog).getByLabelText(/labels.linkText/), 'Dup');
      await user.type(within(dialog).getByLabelText(/labels.linkUrl/), 'https://funder.example.org/1');
      await user.click(within(dialog).getByRole('button', { name: 'buttons.addLink' }));

      expect(await within(dialog).findByText('That link is already associated with this Template')).toBeInTheDocument();
      expect(screen.getByRole('dialog')).toBeInTheDocument();
      expect(mockToastAdd).not.toHaveBeenCalled();
    });

    it('shows a generic error when the request fails', async () => {
      const user = userEvent.setup();
      mockAdd.mockRejectedValue(new Error('Network error'));
      setup();

      await user.click(screen.getByRole('button', { name: /funder.add/ }));
      const dialog = await screen.findByRole('dialog');
      await user.type(within(dialog).getByLabelText(/labels.linkText/), 'Text');
      await user.type(within(dialog).getByLabelText(/labels.linkUrl/), 'https://example.org');
      await user.click(within(dialog).getByRole('button', { name: 'buttons.addLink' }));

      expect(await within(dialog).findByText('messages.errors.saveFailed')).toBeInTheDocument();
    });

    it('closes the modal without saving when Cancel is pressed', async () => {
      const user = userEvent.setup();
      setup();

      await user.click(screen.getByRole('button', { name: /funder.add/ }));
      const dialog = await screen.findByRole('dialog');
      await user.click(within(dialog).getByRole('button', { name: 'buttons.cancel' }));

      await waitFor(() => expect(screen.queryByRole('dialog')).not.toBeInTheDocument());
      expect(mockAdd).not.toHaveBeenCalled();
    });
  });

  describe('editing a link', () => {
    it('opens the edit modal with the current values and saves the changes', async () => {
      const user = userEvent.setup();
      mockUpdate.mockResolvedValue({
        data: { updateTemplateLink: { id: 1, linkType: 'FUNDER', url: 'https://funder.example.org/new', text: 'New', errors: {} } },
      });
      setup();

      const firstCard = within(screen.getByTestId('template-links-funder')).getAllByTestId('template-link-card')[0];
      await user.click(within(firstCard).getByRole('button', { name: 'labels.editLink' }));

      const dialog = await screen.findByRole('dialog');
      expect(within(dialog).getByRole('heading', { name: 'funder.editTitle' })).toBeInTheDocument();
      const textInput = within(dialog).getByLabelText(/labels.linkText/);
      const urlInput = within(dialog).getByLabelText(/labels.linkUrl/);
      expect(textInput).toHaveValue('NSF requirements');
      expect(urlInput).toHaveValue('https://funder.example.org/1');

      await user.clear(textInput);
      await user.type(textInput, 'New');
      await user.clear(urlInput);
      await user.type(urlInput, 'https://funder.example.org/new');
      await user.click(within(dialog).getByRole('button', { name: 'buttons.saveLink' }));

      await waitFor(() => {
        expect(mockUpdate).toHaveBeenCalledWith({
          variables: { templateLinkId: 1, url: 'https://funder.example.org/new', text: 'New' },
        });
      });
      expect(mockToastAdd).toHaveBeenCalledWith('messages.updated', { type: 'success' });
      expect(mockAdd).not.toHaveBeenCalled();
    });

    it('shows a field error the API returns for the URL', async () => {
      const user = userEvent.setup();
      mockUpdate.mockResolvedValue({
        data: { updateTemplateLink: { id: 1, linkType: 'FUNDER', url: 'x', text: 'x', errors: { general: null, url: 'Invalid URL', text: null } } },
      });
      setup();

      const firstCard = within(screen.getByTestId('template-links-funder')).getAllByTestId('template-link-card')[0];
      await user.click(within(firstCard).getByRole('button', { name: 'labels.editLink' }));
      const dialog = await screen.findByRole('dialog');
      await user.click(within(dialog).getByRole('button', { name: 'buttons.saveLink' }));

      expect(await within(dialog).findByText('Invalid URL')).toBeInTheDocument();
    });
  });

  describe('removing a link', () => {
    it('removes the link without a confirmation', async () => {
      const user = userEvent.setup();
      mockRemove.mockResolvedValue({ data: { removeTemplateLink: { id: 2, errors: { general: null } } } });
      setup();

      const secondCard = within(screen.getByTestId('template-links-funder')).getAllByTestId('template-link-card')[1];
      await user.click(within(secondCard).getByRole('button', { name: 'labels.removeLink' }));

      expect(mockRemove).toHaveBeenCalledWith({ variables: { templateLinkId: 2 } });
      expect(screen.queryByRole('dialog')).not.toBeInTheDocument();
      await waitFor(() => expect(mockToastAdd).toHaveBeenCalledWith('messages.removed', { type: 'success' }));
    });

    it('shows an error toast when the link cannot be removed', async () => {
      const user = userEvent.setup();
      mockRemove.mockResolvedValue({ data: { removeTemplateLink: { id: 2, errors: { general: 'Unable to remove the link' } } } });
      setup();

      const secondCard = within(screen.getByTestId('template-links-funder')).getAllByTestId('template-link-card')[1];
      await user.click(within(secondCard).getByRole('button', { name: 'labels.removeLink' }));

      await waitFor(() => expect(mockToastAdd).toHaveBeenCalledWith('Unable to remove the link', { type: 'error' }));
    });

    it('shows an error toast when the request fails', async () => {
      const user = userEvent.setup();
      mockRemove.mockRejectedValue(new Error('Network error'));
      setup();

      const firstCard = within(screen.getByTestId('template-links-funder')).getAllByTestId('template-link-card')[0];
      await user.click(within(firstCard).getByRole('button', { name: 'labels.removeLink' }));

      await waitFor(() => expect(mockToastAdd).toHaveBeenCalledWith('messages.errors.removeFailed', { type: 'error' }));
    });
  });

  it('should pass axe accessibility test', async () => {
    const { container } = setup();
    await act(async () => {
      const results = await axe(container);
      expect(results).toHaveNoViolations();
    });
  });
});
