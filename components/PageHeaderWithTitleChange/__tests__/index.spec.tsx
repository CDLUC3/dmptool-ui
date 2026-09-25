import React from 'react';
import { render, screen, fireEvent } from '@testing-library/react';
import { axe, toHaveNoViolations } from 'jest-axe';
import PageHeaderWithTitleChange from '../index';

expect.extend(toHaveNoViolations);

jest.mock('@/i18n/routing', () => ({
  Link: ({ href, children, ...props }: { href: string; children: React.ReactNode }) => (
    <a href={href} {...props}>{children}</a>
  ),
  useRouter: jest.fn(() => ({ push: jest.fn(), replace: jest.fn(), back: jest.fn() })),
  usePathname: jest.fn(() => '/'),
}));

describe('PageHeaderWithTitleChange', () => {

  beforeEach(() => {
    window.scrollTo = jest.fn(); // Called by the wrapping PageHeader
  });

  const mockOnTitleChange = jest.fn();

  const defaultProps = {
    title: 'Test Title',
    description: 'This is a test description.',
    linkText: 'Edit template title',
    labelText: 'Template Title',
    showBackButton: true,
    breadcrumbs: <div>Mock Breadcrumbs</div>,
    actions: <button>Mock Action</button>,
    className: 'test-class',
    onTitleChange: mockOnTitleChange,
  };

  it('should render the component with default props', () => {
    render(<PageHeaderWithTitleChange {...defaultProps} />);

    // Check if the title is rendered
    expect(screen.getByText('Test Title')).toBeInTheDocument();

    // Check if the description is rendered
    expect(screen.getByText('This is a test description.')).toBeInTheDocument();

    // Check if the breadcrumbs are rendered
    expect(screen.getByText('Mock Breadcrumbs')).toBeInTheDocument();

    // Check if the actions are rendered
    expect(screen.getByText('Mock Action')).toBeInTheDocument();
  });

  it('should allow editing of the title', () => {
    render(<PageHeaderWithTitleChange {...defaultProps} />);

    // Click the "Edit template name" button
    fireEvent.click(screen.getByText('Edit template title'));

    // Check if the input field is rendered
    const input = screen.getByPlaceholderText('editTitle');
    expect(input).toBeInTheDocument();
  });

  it('should ignore the callback if the title did not change', () => {
    render(<PageHeaderWithTitleChange {...defaultProps} />);

    // Click the "Edit template name" button
    fireEvent.click(screen.getByText('Edit template title'));

    // NOTE: We deliberately do not change the title text before we submit
    // because we need to test that the callback was NOT called

    // Submit the form
    const saveButton = screen.getByText('buttons.save');
    fireEvent.click(saveButton);

    // Check if handleTitleChange was called
    expect(mockOnTitleChange).not.toHaveBeenCalled();
  });

  it('should call onTitleChange on form submission', () => {
    render(<PageHeaderWithTitleChange {...defaultProps} />);

    // Click the "Edit template name" button
    fireEvent.click(screen.getByText('Edit template title'));

    // Change the title Text
    const input = screen.getByPlaceholderText('editTitle');
    fireEvent.change(input, { target: { value: 'Updated Title' } });

    // Submit the form
    const saveButton = screen.getByText('buttons.save');
    fireEvent.click(saveButton);

    // Check if handleTitleChange was called
    expect(mockOnTitleChange).toHaveBeenCalled();
  });

  it('should cancel editing when the cancel button is clicked', () => {
    render(<PageHeaderWithTitleChange {...defaultProps} />);

    // Click the "Edit template name" button
    fireEvent.click(screen.getByText('Edit template title'));

    // Click the cancel button
    const cancelButton = screen.getByText('buttons.cancel');
    fireEvent.click(cancelButton);

    // Check if the input field is no longer rendered
    expect(screen.queryByPlaceholderText('Enter new template title')).not.toBeInTheDocument();
  });

  it('should render without crashing', () => {
    render(<PageHeaderWithTitleChange {...defaultProps} />);
  });

  it('should render descriptionAppend if provided', () => {
    render(<PageHeaderWithTitleChange {...defaultProps} descriptionAppend=" - Additional Info" />);
    expect(screen.getByText(/- Additional Info/i)).toBeInTheDocument();
  });

  it('should pass axe accessibility test', async () => {
    const { container } = render(
      <PageHeaderWithTitleChange {...defaultProps} />
    );
    const results = await axe(container);
    expect(results).toHaveNoViolations();
  })
});
