import React from 'react';
import { render, screen, fireEvent, waitFor, within } from '@testing-library/react';
import { useParams, useSearchParams } from 'next/navigation';
import { useRouter } from '@/i18n/routing';
import { MockedProvider } from '@apollo/client/testing/react';
import { MockedResponse } from '@apollo/client/testing';
import { axe, toHaveNoViolations } from 'jest-axe';
import '@testing-library/jest-dom';
import { UploadPlanDocument } from '@/generated/graphql';
import PlanCreateUpload from '../page';

expect.extend(toHaveNoViolations);

jest.mock('next/navigation', () => ({
  useParams: jest.fn(),
  useSearchParams: jest.fn(),
}));

jest.mock('@/i18n/routing', () => ({
  Link: ({ href, children, ...props }: { href: string; children: React.ReactNode }) => (
    <a href={href} {...props}>{children}</a>
  ),
  useRouter: jest.fn(() => ({ push: jest.fn(), replace: jest.fn(), back: jest.fn() })),
}));

const mockUseRouter = useRouter as jest.Mock;

const uploadMock = (uploadPlan: object): MockedResponse => ({
  request: {
    query: UploadPlanDocument,
    variables: { projectId: 1, fileName: 'example.pdf' },
  },
  result: { data: { uploadPlan } },
});

const renderPage = (mocks: MockedResponse[] = []) => render(
  <MockedProvider mocks={mocks}>
    <PlanCreateUpload />
  </MockedProvider>
);

describe('PlanCreateUpload Component', () => {
  beforeEach(() => {
    window.scrollTo = jest.fn(); // Called by the wrapping PageHeader
    HTMLElement.prototype.scrollIntoView = jest.fn();
    mockUseRouter.mockReturnValue({
      push: jest.fn(),
    });
    (useParams as jest.Mock).mockReturnValue({ projectId: '1' });
    (useSearchParams as jest.Mock).mockReturnValue(new URLSearchParams());
  });

  it('should render the component with the correct title and description', () => {
    renderPage();

    expect(screen.getByText('Upload a DMSP')).toBeInTheDocument();
    expect(
      screen.getByText(
        'You can upload a Data Management Plan (DMP) that was created elsewhere and add it to your project.', { exact: false }
      )
    ).toBeInTheDocument();
  });

  it('should display an error when an invalid file type is uploaded', async () => {
    renderPage();
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
    renderPage();

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
    renderPage();

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

  const submitValidFile = () => {
    const input = document.querySelector('input[type="file"]') as HTMLInputElement;
    fireEvent.change(input, {
      target: { files: [new File(['dummy content'], 'example.pdf', { type: 'application/pdf' })] },
    });
    const form = screen.getByTestId('upload-form');
    const submitButton = within(form).getAllByRole('button', { name: /upload/i })
      .find((button) => button.getAttribute('type') === 'submit');
    fireEvent.click(submitButton!);
  };

  it('should show the server error and stay on the page while uploads are not implemented', async () => {
    renderPage([uploadMock({ id: null, errors: { general: 'Uploads have not yet been implemented', projectId: null } })]);
    submitValidFile();

    expect(await screen.findByText('Uploads have not yet been implemented')).toBeInTheDocument();
    expect(screen.getByText('upload.notAvailable')).toBeInTheDocument();
    expect(mockUseRouter().push).not.toHaveBeenCalled();
  });

  it('should go to the uploaded plan when the server accepts it', async () => {
    renderPage([uploadMock({ id: 55, errors: { general: null, projectId: null } })]);
    submitValidFile();

    await waitFor(() => {
      expect(mockUseRouter().push).toHaveBeenCalledWith('/projects/1/dmp/55');
    });
  });

  it('should finish on setup complete when inside the create flow', async () => {
    (useSearchParams as jest.Mock).mockReturnValue(new URLSearchParams('intent=plan'));
    renderPage([uploadMock({ id: 55, errors: { general: null, projectId: null } })]);

    expect(screen.queryByText('Best Practice by DMP Tool')).not.toBeInTheDocument();
    submitValidFile();

    await waitFor(() => {
      expect(mockUseRouter().push).toHaveBeenCalledWith('/projects/1/create/complete?intent=plan&planId=55');
    });
  });

  it('should explain uploads are unavailable when the request fails on the network', async () => {
    renderPage([{
      request: { query: UploadPlanDocument, variables: { projectId: 1, fileName: 'example.pdf' } },
      error: new Error('Network down'),
    }]);
    submitValidFile();

    expect(await screen.findByText('upload.notAvailable')).toBeInTheDocument();
    expect(mockUseRouter().push).not.toHaveBeenCalled();
  });

  it('should pass accessibility tests', async () => {
    const { container } = renderPage([]);
    const results = await axe(container);
    expect(results).toHaveNoViolations();
  });
});
