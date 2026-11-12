import React from 'react';
import { fireEvent, render, screen, waitFor, within } from '@/utils/test-utils';
import CustomizedTemplateListItem from '../index';
import { CustomizedTemplatesProps } from '@/app/types';

// Mock next-intl
jest.mock('next-intl', () => ({
  useTranslations: jest.fn(() => jest.fn((key) => key)),
}));

// Mock DmpIcon
jest.mock('@/components/Icons', () => ({
  DmpIcon: ({ icon }: { icon: string }) => <span data-testid={`icon-${icon}`}>{icon}</span>,
}));

describe('CustomizedTemplateListItem', () => {
  const mockHandleAddCustomization = jest.fn();

  const baseItem: CustomizedTemplatesProps = {
    id: 1,
    title: 'NSF-DMS: Mathematical Sciences',
    link: '/en-US/template/223/customize',
    funder: 'National Science Foundation',
    lastCustomized: '02-08-2026',
    lastCustomizedByName: 'John Doe',
    customizationStatus: 'templateStatus.published',
    defaultExpanded: false,
    templateModified: '02-08-2026',
  };
  beforeEach(() => {
    mockHandleAddCustomization.mockClear();
  });


  it('should render the template title and funder', () => {
    render(<CustomizedTemplateListItem
      item={baseItem}
      handleAddCustomization={mockHandleAddCustomization}
    />);

    expect(screen.getByText('NSF-DMS: Mathematical Sciences')).toBeInTheDocument();
    expect(screen.getByText('National Science Foundation')).toBeInTheDocument();
  });

  it('should render title as a link when link is provided', () => {
    render(<CustomizedTemplateListItem
      item={baseItem}
      handleAddCustomization={mockHandleAddCustomization}
    />);

    // Query by text content inside the heading instead
    const heading = screen.getByRole('heading', { level: 3 });
    const titleLink = within(heading).getByRole('link');

    expect(titleLink).toHaveTextContent('NSF-DMS: Mathematical Sciences');
    expect(titleLink).toHaveAttribute('href', '/en-US/template/223/customize');
  });

  it('should render all metadata when fully customized', () => {
    render(<CustomizedTemplateListItem
      item={baseItem}
      handleAddCustomization={mockHandleAddCustomization}
    />);

    const metadata = screen.getByTestId('template-metadata');

    expect(within(metadata).getByText(/templateStatus.lastCustomizedBy.*John Doe/)).toBeInTheDocument();
    expect(within(metadata).getByText(/templateStatus.lastCustomized.*02-08-2026/)).toBeInTheDocument();
    expect(within(metadata).getByText(/templateStatus.customizationStatus.*templateStatus.published/)).toBeInTheDocument();
    expect(within(metadata).getByText(/templateStatus.templateLastUpdated.*02-08-2026/)).toBeInTheDocument();
  });

  it('should render minimal metadata for non-customized template', () => {
    const notCustomizedItem: CustomizedTemplatesProps = {
      id: 1,
      title: 'NSF-DMS: Mathematical Sciences',
      link: '/en-US/template/223/customize',
      funder: 'National Science Foundation',
      lastCustomized: null,
      customizationStatus: 'templateStatus.notCustomized',
      defaultExpanded: false,
      templateModified: '02-08-2026',
    };

    render(<CustomizedTemplateListItem
      item={notCustomizedItem}
      handleAddCustomization={mockHandleAddCustomization}
    />);

    const metadata = screen.getByTestId('template-metadata');

    // Should NOT show lastCustomizedBy and lastCustomized
    expect(within(metadata).queryByText(/templateStatus.lastCustomizedBy/)).not.toBeInTheDocument();
    expect(within(metadata).queryByText(/templateStatus.lastCustomized/)).not.toBeInTheDocument();

    // Should show customization status and template modified
    expect(within(metadata).getByText(/templateStatus.customizationStatus.*templateStatus.notCustomized/)).toBeInTheDocument();
    expect(within(metadata).getByText(/templateStatus.templateLastUpdated.*02-08-2026/)).toBeInTheDocument();
  });

  it('should show warning icon when status is hasChanged', () => {
    const hasChangedItem = {
      ...baseItem,
      customizationStatus: 'templateStatus.hasChanged',
    };
    render(<CustomizedTemplateListItem
      item={hasChangedItem}
      handleAddCustomization={mockHandleAddCustomization}
    />);

    expect(screen.getByTestId('icon-warning')).toBeInTheDocument();
  });

  it('should show edit icon when status is unPublished', () => {
    const unpublishedItem = {
      ...baseItem,
      customizationStatus: 'templateStatus.unPublished',
    };
    render(<CustomizedTemplateListItem
      item={unpublishedItem}
      handleAddCustomization={mockHandleAddCustomization}
    />);

    expect(screen.getByTestId('icon-edit-square')).toBeInTheDocument();
  });

  it('should not show icon when status is published', () => {
    const publishedItem = {
      ...baseItem,
      customizationStatus: 'templateStatus.published',
    };
    render(<CustomizedTemplateListItem
      item={publishedItem}
      handleAddCustomization={mockHandleAddCustomization}
    />);

    expect(screen.queryByTestId('icon-warning')).not.toBeInTheDocument();
    expect(screen.queryByTestId('icon-edit-square')).not.toBeInTheDocument();
  });

  it('should not add separator class to first metadata item when no preceding content', () => {
    const minimalItem: CustomizedTemplatesProps = {
      id: 1,
      title: 'Test Template',
      link: '/test',
      funder: 'Test Funder',
      lastCustomized: '02-08-2026',
      customizationStatus: 'templateStatus.published',
      defaultExpanded: false,
      templateModified: null,
    };

    render(<CustomizedTemplateListItem
      item={minimalItem}
      handleAddCustomization={mockHandleAddCustomization}
    />);

    const metadata = screen.getByTestId('template-metadata');

    // Find the lastCustomized span using regex
    const lastCustomizedText = within(metadata).getByText(/templateStatus\.lastCustomized/);
    const lastCustomizedSpan = lastCustomizedText.closest('span');

    // It should NOT have the separator class since there's no preceding content
    expect(lastCustomizedSpan).not.toHaveClass('separator');
  });


  it('should render update button and call handleAddCustomization when clicked', async () => {
    render(<CustomizedTemplateListItem
      item={baseItem}
      handleAddCustomization={mockHandleAddCustomization}
    />);

    // Query by text content directly
    const updateButton = screen.getAllByLabelText('links.update NSF-DMS: Mathematical Sciences');
    expect(updateButton[1]).toBeInTheDocument();

    await waitFor(async () => {
      fireEvent.click(updateButton[1]);
    });
    expect(mockHandleAddCustomization).toHaveBeenCalledWith(baseItem);
  });


  it('should start a customization from the title and the update button when the template is not customized yet', async () => {
    const notCustomizedItem: CustomizedTemplatesProps = {
      ...baseItem,
      id: undefined,
      link: undefined,
      lastCustomized: null,
      lastCustomizedByName: undefined,
      customizationStatus: 'templateStatus.notCustomized',
    };
    render(<CustomizedTemplateListItem
      item={notCustomizedItem}
      handleAddCustomization={mockHandleAddCustomization}
    />);

    const links = screen.getAllByRole('link', { name: 'links.update NSF-DMS: Mathematical Sciences' });
    // Both the title and the update button, and neither goes to a customization page that doesn't exist yet
    expect(links).toHaveLength(2);
    for (const link of links) {
      expect(link).not.toHaveAttribute('href');
    }

    fireEvent.click(links[0]);
    await waitFor(() => {
      expect(mockHandleAddCustomization).toHaveBeenCalledWith(notCustomizedItem);
    });
  });

  it('should have correct ARIA attributes', () => {
    render(<CustomizedTemplateListItem
      item={baseItem}
      handleAddCustomization={mockHandleAddCustomization}
    />);

    // Check listitem role
    const listItem = screen.getByRole('listitem');
    expect(listItem).toBeInTheDocument();

    // Check heading has ID
    const heading = screen.getByRole('heading', { level: 3 });
    expect(heading).toHaveAttribute('id', 'nsf-dms:-mathematical-sciences-heading');
  });

  it('should have correct data-testid attribute', () => {
    render(<CustomizedTemplateListItem
      item={baseItem}
      handleAddCustomization={mockHandleAddCustomization}
    />);

    expect(screen.getByTestId('template-list-item')).toBeInTheDocument();
    expect(screen.getByTestId('template-metadata')).toBeInTheDocument();
  });

  it('should not render empty customization status', () => {
    const itemWithEmptyStatus = {
      ...baseItem,
      customizationStatus: '',
    };
    render(<CustomizedTemplateListItem
      item={itemWithEmptyStatus}
      handleAddCustomization={mockHandleAddCustomization}
    />);

    const metadata = screen.getByTestId('template-metadata');
    expect(within(metadata).queryByText(/templateStatus.customizationStatus/)).not.toBeInTheDocument();
  });

  it('should handle missing templateModified gracefully', () => {
    const itemWithoutModified = {
      ...baseItem,
      templateModified: null,
    };
    render(<CustomizedTemplateListItem
      item={itemWithoutModified}
      handleAddCustomization={mockHandleAddCustomization}
    />);

    const metadata = screen.getByTestId('template-metadata');
    expect(within(metadata).queryByText(/templateStatus.templateLastUpdated/)).not.toBeInTheDocument();
  });
});