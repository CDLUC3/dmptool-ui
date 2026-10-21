import React from 'react';
import { render, screen, fireEvent } from '@testing-library/react';

import '@testing-library/jest-dom';
import { axe, toHaveNoViolations } from 'jest-axe';
import ResearchOutputEdit from '../page';

expect.extend(toHaveNoViolations);

jest.mock('@/i18n/routing', () => ({
  Link: ({ href, children, ...props }: { href: string; children: React.ReactNode }) => (
    <a href={href} {...props}>{children}</a>
  ),
  useRouter: jest.fn(() => ({ push: jest.fn(), replace: jest.fn(), back: jest.fn() })),
  usePathname: jest.fn(() => '/projects/1/research-outputs/edit'),
}));

describe('ResearchOutputEdit', () => {
  beforeEach(() => {
    window.scrollTo = jest.fn(); // Called by the wrapping PageHeader
  })

  afterEach(() => {
    jest.clearAllMocks();
  });

  it('should render the page header with title and description', () => {
    render(<ResearchOutputEdit />);
    expect(screen.getByText('Edit Research Output')).toBeInTheDocument();
    expect(screen.getByText('Edit the details for your research output below.')).toBeInTheDocument();
  });

  it('should render the form fields', () => {
    render(<ResearchOutputEdit />);
    expect(screen.getByLabelText('Type')).toBeInTheDocument();
    expect(screen.getByLabelText('Title')).toBeInTheDocument();
    expect(screen.getByLabelText('Abbreviation')).toBeInTheDocument();
    expect(screen.getByLabelText('Description')).toBeInTheDocument();
    expect(screen.getByLabelText('Repository')).toBeInTheDocument();
    expect(screen.getByLabelText('Initial Access Level')).toBeInTheDocument();
    expect(screen.getByLabelText('Anticipated Release Date')).toBeInTheDocument();
    expect(screen.getByLabelText('Initial License')).toBeInTheDocument();
  });

  it('should handle checkbox interactions', () => {
    render(<ResearchOutputEdit />);
    const sensitiveDataCheckbox = screen.getByLabelText('May contain sensitive data');
    const personalDataCheckbox = screen.getByLabelText('May contain personally identifiable information');

    fireEvent.click(sensitiveDataCheckbox);
    expect(sensitiveDataCheckbox).toBeChecked();

    fireEvent.click(personalDataCheckbox);
    expect(personalDataCheckbox).toBeChecked();
  });

  it('should handle "Save Changes" button click', () => {
    const consoleSpy = jest.spyOn(console, 'log');
    render(<ResearchOutputEdit />);
    const saveButton = screen.getByRole('button', { name: 'Save Changes' });

    fireEvent.click(saveButton);
    expect(consoleSpy).toHaveBeenCalledWith('Submitting form data:', expect.any(Object));
  });

  it('should handle "Cancel" button click', () => {
    render(<ResearchOutputEdit />);
    const cancelButton = screen.getByRole('button', { name: 'Cancel' });

    // Mock window.history.back
    const historyBackSpy = jest.spyOn(window.history, 'back').mockImplementation(() => { });

    fireEvent.click(cancelButton);
    expect(historyBackSpy).toHaveBeenCalled();
  });

  it('should pass accessibility tests', async () => {
    const { container } = render(<ResearchOutputEdit />);
    const results = await axe(container);
    expect(results).toHaveNoViolations();
  });
});
