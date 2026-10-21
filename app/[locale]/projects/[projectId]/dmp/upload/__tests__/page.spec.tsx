import React from 'react';
import { render, screen, fireEvent, waitFor, within } from '@testing-library/react';
import { useRouter } from '@/i18n/routing';
import { axe, toHaveNoViolations } from 'jest-axe';
import '@testing-library/jest-dom';
import PlanCreateUpload from '../page';

expect.extend(toHaveNoViolations);

jest.mock('@/i18n/routing', () => ({
  Link: ({ href, children, ...props }: { href: string; children: React.ReactNode }) => (
    <a href={href} {...props}>{children}</a>
  ),
  useRouter: jest.fn(() => ({ push: jest.fn(), replace: jest.fn(), back: jest.fn() })),
}));

const mockUseRouter = useRouter as jest.Mock;

describe('PlanCreateUpload Component', () => {
  beforeEach(() => {
    window.scrollTo = jest.fn(); // Called by the wrapping PageHeader
    mockUseRouter.mockReturnValue({
      push: jest.fn(),
    })
  });

  it('should render the component with the correct title and description', () => {
    render(<PlanCreateUpload />);

    expect(screen.getByText('Upload a DMSP')).toBeInTheDocument();
    expect(
      screen.getByText(
        'You can upload a Data Management Plan (DMP) that was created elsewhere and add it to your project.', { exact: false }
      )
    ).toBeInTheDocument();
  });

  it('should display an error when an invalid file type is uploaded', async () => {
    render(<PlanCreateUpload />);
    // Select the hidden input[type="file"]
    const input = document.querySelector('input[type="file"]') as HTMLInputElement;
    expect(input).toBeInTheDocument();

    const validFile = new File(['dummy content'], 'example.txt', {
      type: 'application/text',
    });

    // Fire change event with the valid file
    fireEvent.change(input, {
      target: { files: [validFile] },
    });


    await waitFor(() =>
      expect(
        screen.getByText('Only PDF, DOC, or DOCX files are allowed.')
      ).toBeInTheDocument()
    );
  });

  it('should accept a valid file and display its name', async () => {
    render(<PlanCreateUpload />);

    // Select the hidden input[type="file"]
    const input = document.querySelector('input[type="file"]') as HTMLInputElement;
    expect(input).toBeInTheDocument();

    const validFile = new File(['dummy content'], 'example.pdf', {
      type: 'application/pdf',
    });

    // Fire change event with the valid file
    fireEvent.change(input, {
      target: { files: [validFile] },
    });

    // Wait for file name to be rendered
    await waitFor(() => {
      expect(screen.getByText(/uploaded file: example\.pdf/i)).toBeInTheDocument();
    });
  });


  it('should display an error when submitting without a file', async () => {
    render(<PlanCreateUpload />);

    // Find the form using its role
    const form = screen.getByTestId('upload-form');

    // Find all buttons within the form
    const buttons = within(form).getAllByRole('button', { name: /upload/i });

    // Filter the button with type="submit"
    const submitButton = buttons.find((button) => button.getAttribute('type') === 'submit');
    expect(submitButton).toBeInTheDocument();

    // Click the button
    fireEvent.click(submitButton!);

    // Wait for the error message to appear
    await waitFor(() =>
      expect(
        screen.getByText('Please upload a valid file before submitting.')
      ).toBeInTheDocument()
    );
  });

  it('should redirect to the correct URL on successful submission', async () => {

    render(<PlanCreateUpload />);

    // Select the hidden input[type="file"]
    const input = document.querySelector('input[type="file"]') as HTMLInputElement;
    expect(input).toBeInTheDocument();

    const validFile = new File(['dummy content'], 'example.pdf', {
      type: 'application/pdf',
    });

    // Fire change event with the valid file
    fireEvent.change(input, {
      target: { files: [validFile] },
    });

    // Find the form using its role
    const form = screen.getByTestId('upload-form');

    // Find all buttons within the form
    const buttons = within(form).getAllByRole('button', { name: /upload/i });

    // Filter the button with type="submit"
    const submitButton = buttons.find((button) => button.getAttribute('type') === 'submit');
    expect(submitButton).toBeInTheDocument();

    // Click the button
    fireEvent.click(submitButton!);

    await waitFor(() => {
      // Should redirect to the Feeback page when modal is closed
      expect(mockUseRouter().push).toHaveBeenCalledWith('/projects/proj_2425');
    });
  });

  it('should pass accessibility tests', async () => {
    const { container } = render(<PlanCreateUpload />);
    const results = await axe(container);
    expect(results).toHaveNoViolations();
  });
});
