import React from 'react';
import { render, screen, fireEvent, waitFor } from '@testing-library/react';

import { useParams } from 'next/navigation';
import { MockedProvider } from "@apollo/client/testing/react";
import { axe, toHaveNoViolations } from 'jest-axe';
import mockedPlan from '../__mocks__/mockedPlan.json';
import {
  PlanDocument,
} from '@/generated/graphql';
import ProjectsProjectPlanDownloadPage from '../page';
import {
  mockScrollIntoView,
} from "@/__mocks__/common";

expect.extend(toHaveNoViolations);

jest.mock('next/navigation', () => ({
  useParams: jest.fn(),
}));

jest.mock('@/i18n/routing', () => ({
  Link: ({ href, children, ...props }: { href: string; children: React.ReactNode }) => (
    <a href={href} {...props}>{children}</a>
  ),
  useRouter: jest.fn(() => ({ push: jest.fn(), replace: jest.fn(), back: jest.fn() })),
  usePathname: jest.fn(() => '/projects/1/dmp/1/download'),
}));

const mocks = [
  // Initial load mock
  {
    request: {
      query: PlanDocument,
      variables: {
        planId: 1
      },
    },
    result: {
      data: {
        plan: mockedPlan
      },
    },
  },
]
describe('ProjectsProjectPlanDownloadPage', () => {
  beforeEach(() => {
    window.scrollTo = jest.fn(); // Called by the wrapping PageHeader

    const mockUseParams = useParams as jest.Mock;
    // Mock the return value of useParams
    mockUseParams.mockReturnValue({ projectId: 1, dmpid: 1 });
  });

  it('should render the page header with the correct info', async () => {
    const marginLabels = ['Top margin', 'Bottom margin', 'Left margin', 'Right margin'];
    const expectedOptions = ['15mm', '20mm', '25mm', '30mm'];
    render(
      <MockedProvider
        mocks={mocks}
      >
        <ProjectsProjectPlanDownloadPage />
      </MockedProvider>,
    );

    // Wait for the plan data to load by checking for the filename
    await screen.findByText(/Butterfly Migration/i);


    expect(screen.getByText('title')).toBeInTheDocument();
    expect(screen.getByText('description')).toBeInTheDocument();
    expect(screen.getByRole('heading', { level: 2, name: 'headings.chooseFileFormat' })).toBeInTheDocument();

    // Correct radio button options should be present
    const pdfRadio = screen.getByRole('radio', { name: /PDF/i });
    const docRadio = screen.getByRole('radio', { name: /DOC/i });
    const htmlRadio = screen.getByRole('radio', { name: /HTML/i });
    const csvRadio = screen.getByRole('radio', { name: /CSV/i });
    const jsonRadio = screen.getByRole('radio', { name: /JSON/i });
    const textRadio = screen.getByRole('radio', { name: /TEXT/i });

    expect(pdfRadio).toBeInTheDocument();
    expect(docRadio).toBeInTheDocument();
    expect(htmlRadio).toBeInTheDocument();
    expect(csvRadio).toBeInTheDocument();
    expect(jsonRadio).toBeInTheDocument();
    expect(textRadio).toBeInTheDocument();

    // Settings checkboxes should be present
    expect(screen.getByRole('heading', { level: 2, name: 'headings.settings' })).toBeInTheDocument();
    const includeCoverSheet = screen.getByLabelText('labels.includeCoverSheet');
    const includeSectionHeadings = screen.getByLabelText('labels.includeSectionHeadings');
    const includeQuestionText = screen.getByLabelText('labels.includeQuestionText');
    const includeUnansweredQuestions = screen.getByLabelText('labels.includeUnansweredQuestions');

    expect(includeCoverSheet).toBeInTheDocument();
    expect(includeSectionHeadings).toBeInTheDocument();
    expect(includeQuestionText).toBeInTheDocument();
    expect(includeUnansweredQuestions).toBeInTheDocument();

    // Font options
    expect(screen.getByRole('heading', { level: 2, name: 'headings.formattingOptions' })).toBeInTheDocument();
    expect(screen.getByRole('heading', { level: 3, name: 'headings.font' })).toBeInTheDocument();
    const select = screen.getByLabelText('Font');
    const tinosOption = screen.getByRole('option', { name: /Tinos, serif/i });
    const robotoOption = screen.getByRole('option', { name: /Roboto, sans-serif/i });

    expect(select).toBeInTheDocument();
    expect(tinosOption).toBeInTheDocument();
    expect(robotoOption).toBeInTheDocument();

    // Font Size
    expect(screen.getByRole('heading', { level: 3, name: 'headings.fontSize' })).toBeInTheDocument();
    const selectFontSize = screen.getByLabelText('Font size');
    const option8 = screen.getByRole('option', { name: '8pt' });
    const option9 = screen.getByRole('option', { name: '9pt' });
    const option10 = screen.getByRole('option', { name: '10pt' });
    const option11 = screen.getByRole('option', { name: '11pt' });
    const option12 = screen.getByRole('option', { name: '12pt' });
    const option14 = screen.getByRole('option', { name: '14pt' });

    expect(selectFontSize).toBeInTheDocument();
    expect(option8).toBeInTheDocument();
    expect(option9).toBeInTheDocument();
    expect(option10).toBeInTheDocument();
    expect(option11).toBeInTheDocument();
    expect(option12).toBeInTheDocument();
    expect(option14).toBeInTheDocument();

    // Margins
    expect(screen.getByRole('heading', { level: 3, name: 'headings.margins' })).toBeInTheDocument();

    marginLabels.forEach(label => {
      const select = screen.getByLabelText(label) as HTMLSelectElement;
      expectedOptions.forEach(value => {
        const option = Array.from(select.options).find(opt => opt.value === value);
        expect(option).toBeDefined();
        expect(option?.textContent).toBe(value);
      });
    });

    // Download button
    expect(screen.getByText(/Download "Butterfly Migration.pdf"/i)).toBeInTheDocument();
    const downloadButton = screen.getByRole('button', { name: /Download PDF/i });
    expect(downloadButton).toBeInTheDocument();

    // Best Practice
    expect(screen.getByRole('heading', { level: 2, name: 'bestPractice' })).toBeInTheDocument();
    expect(screen.getByText('bestPracticep1')).toBeInTheDocument();
    expect(screen.getByText('bestPracticep2')).toBeInTheDocument();

  });

  it('should select Roboto font when selected', async () => {
    render(
      <MockedProvider
        mocks={mocks}
      >
        <ProjectsProjectPlanDownloadPage />
      </MockedProvider>,
    );

    // Wait for the plan data to load by checking for the filename
    await screen.findByText(/Butterfly Migration/i);


    // Formatting options
    expect(screen.getByRole('heading', { level: 2, name: 'headings.formattingOptions' })).toBeInTheDocument();
    expect(screen.getByRole('heading', { level: 3, name: 'headings.font' })).toBeInTheDocument();
    const select = screen.getByLabelText('Font');
    const tinosOption = screen.getByRole('option', { name: /Tinos, serif/i });
    const robotoOption = screen.getByRole('option', { name: /Roboto, sans-serif/i });

    expect(select).toBeInTheDocument();
    expect(tinosOption).toBeInTheDocument();
    expect(robotoOption).toBeInTheDocument();

    // Simulate user selecting Roboto
    fireEvent.change(select, { target: { value: 'roboto' } });

    expect((robotoOption as HTMLOptionElement).selected).toBe(true);
  });

  it('should select correct font size when selected', async () => {
    render(
      <MockedProvider
        mocks={mocks}
      >
        <ProjectsProjectPlanDownloadPage />
      </MockedProvider>,
    );

    // Wait for the plan data to load by checking for the filename
    await screen.findByText(/Butterfly Migration/i);

    const selectFontSize = screen.getByLabelText('Font size');
    const option8 = screen.getByRole('option', { name: '8pt' });
    const option9 = screen.getByRole('option', { name: '9pt' });
    const option10 = screen.getByRole('option', { name: '10pt' });
    const option11 = screen.getByRole('option', { name: '11pt' });
    const option12 = screen.getByRole('option', { name: '12pt' });
    const option14 = screen.getByRole('option', { name: '14pt' });

    expect(selectFontSize).toBeInTheDocument();
    expect(option8).toBeInTheDocument();
    expect(option9).toBeInTheDocument();
    expect(option10).toBeInTheDocument();
    expect(option11).toBeInTheDocument();
    expect(option12).toBeInTheDocument();
    expect(option14).toBeInTheDocument();

    // Simulate user selecting 12pt
    fireEvent.change(selectFontSize, { target: { value: '12pt' } });

    expect((option12 as HTMLOptionElement).selected).toBe(true);
  });

  it('should select correct margin when selected', async () => {
    render(
      <MockedProvider
        mocks={mocks}
      >
        <ProjectsProjectPlanDownloadPage />
      </MockedProvider>,
    );

    // Wait for the plan data to load by checking for the filename
    await screen.findByText(/Butterfly Migration/i);

    const select = screen.getByLabelText('Top margin');
    // Simulate user selecting 15mm
    fireEvent.change(select, { target: { value: '15mm' } });

    expect((select as HTMLSelectElement).value).toBe('15mm');
  });

  it('should select correct settings when selected', async () => {
    render(
      <MockedProvider
        mocks={mocks}
      >
        <ProjectsProjectPlanDownloadPage />
      </MockedProvider>,
    );

    // Wait for the plan data to load by checking for the filename
    await screen.findByText(/Butterfly Migration/i);

    // Settings checkboxes should be present
    expect(screen.getByRole('heading', { level: 2, name: 'headings.settings' })).toBeInTheDocument();
    const includeCoverSheet = screen.getByLabelText('labels.includeCoverSheet');
    const includeSectionHeadings = screen.getByLabelText('labels.includeSectionHeadings');
    const includeQuestionText = screen.getByLabelText('labels.includeQuestionText');
    const includeUnansweredQuestions = screen.getByLabelText('labels.includeUnansweredQuestions');

    expect(includeCoverSheet).toBeInTheDocument();
    expect(includeSectionHeadings).toBeInTheDocument();
    expect(includeQuestionText).toBeInTheDocument();
    expect(includeUnansweredQuestions).toBeInTheDocument();
    // Simulate user selecting options
    fireEvent.click(includeCoverSheet);
    expect(includeCoverSheet).toBeChecked();

    fireEvent.click(includeSectionHeadings);
    expect(includeSectionHeadings).not.toBeChecked();

    fireEvent.click(includeQuestionText);
    expect(includeQuestionText).not.toBeChecked();

    fireEvent.click(includeUnansweredQuestions);
    expect(includeUnansweredQuestions).toBeChecked();
  });

  it('should select radio button when clicked', async () => {
    render(
      <MockedProvider
        mocks={mocks}
      >
        <ProjectsProjectPlanDownloadPage />
      </MockedProvider>,
    );


    // Wait for the plan data to load by checking for the filename
    await screen.findByText(/Butterfly Migration/i);

    const pdfRadio = screen.getByRole('radio', { name: /PDF/i });
    const docRadio = screen.getByRole('radio', { name: /DOC/i });
    const jsonRadio = screen.getByRole('radio', { name: /JSON/i });

    // Check default checked
    expect(pdfRadio).toBeChecked();

    // Simulate user selecting DOC
    fireEvent.click(docRadio);
    expect(docRadio).toBeChecked();

    // Simulate user selecting DOC
    fireEvent.click(jsonRadio);
    expect(jsonRadio).toBeChecked();
  });

  it('should update the file name and format in the download section when format changes', async () => {
    render(
      <MockedProvider
        mocks={mocks}
      >
        <ProjectsProjectPlanDownloadPage />
      </MockedProvider>,
    );


    // Wait for the plan data to load by checking for the filename
    await screen.findByText(/Butterfly Migration/i);

    const docRadio = screen.getByRole('radio', { name: /DOC/i });

    // Simulate user selecting DOC
    fireEvent.click(docRadio);
    expect(docRadio).toBeChecked();

    expect(screen.getByText(/Download "Butterfly Migration.doc"/i)).toBeInTheDocument();
    expect(screen.getByRole('button', { name: /Download DOC/i })).toBeInTheDocument();
  });

  it('should pass accessibility tests', async () => {
    const { container } = render(
      <MockedProvider
        mocks={mocks}
      >
        <ProjectsProjectPlanDownloadPage />
      </MockedProvider>,
    );
    await waitFor(async () => {
      const results = await axe(container);
      expect(results).toHaveNoViolations();
    });
  });
});

describe('handleDownload', () => {
  let mockFetch: jest.Mock;
  let mockCreateObjectURL: jest.Mock;
  let mockRevokeObjectURL: jest.Mock;
  let mockClick: jest.Mock;

  beforeEach(() => {
    // Mock anchor clicks due to jsdom limitations
    jest.spyOn(HTMLAnchorElement.prototype, 'click').mockImplementation(() => { });

    HTMLElement.prototype.scrollIntoView = mockScrollIntoView;
    window.scrollTo = jest.fn(); // Called by the wrapping PageHeader

    const mockUseParams = useParams as jest.Mock;
    // Mock the return value of useParams
    mockUseParams.mockReturnValue({ projectId: 1, dmpid: 1 });

    // Set up mockFetch to simulate fetch responses
    const mockBlob = new Blob(['fake content'], { type: 'application/pdf' });
    mockFetch = jest.fn().mockResolvedValue({
      ok: true,
      blob: async () => mockBlob,
    });
    global.fetch = mockFetch;

    mockCreateObjectURL = jest.fn(() => 'blob:mock-url');
    mockRevokeObjectURL = jest.fn();
    global.URL.createObjectURL = mockCreateObjectURL;
    global.URL.revokeObjectURL = mockRevokeObjectURL;

    mockClick = jest.fn();
  });

  afterEach(() => {
    jest.restoreAllMocks();
  });

  it('should download PDF with default settings', async () => {
    render(
      <MockedProvider mocks={mocks}>
        <ProjectsProjectPlanDownloadPage />
      </MockedProvider>,
    );

    await screen.findByRole('button', { name: /download pdf/i });

    const downloadButton = screen.getByRole('button', { name: /download pdf/i });
    fireEvent.click(downloadButton);

    await waitFor(() => {
      expect(mockFetch).toHaveBeenCalled();
    });

    const fetchUrl = mockFetch.mock.calls[0][0];
    expect(fetchUrl).toContain('includeCoverPage=false');
    expect(fetchUrl).toContain('includeSectionHeadings=true');
    expect(fetchUrl).toContain('includeQuestionText=true');
  });

  it('should download DOC format when DOC is selected', async () => {
    render(
      <MockedProvider mocks={mocks}>
        <ProjectsProjectPlanDownloadPage />
      </MockedProvider>,
    );

    await screen.findByRole('radio', { name: /DOC/i });

    // Select DOC format
    const docRadio = screen.getByRole('radio', { name: /DOC/i });
    fireEvent.click(docRadio);

    const downloadButton = screen.getByRole('button', { name: /download doc/i });
    fireEvent.click(downloadButton);

    await waitFor(() => {
      expect(mockFetch).toHaveBeenCalled();
    });

    // Verify correct Accept header for DOC
    expect(mockFetch).toHaveBeenCalledWith(
      expect.any(String),
      expect.objectContaining({
        headers: {
          Accept: 'application/vnd.openxmlformats-officedocument.wordprocessingml.document',
        },
      })
    );
  });

  it('should include changed settings in download', async () => {
    render(
      <MockedProvider mocks={mocks}>
        <ProjectsProjectPlanDownloadPage />
      </MockedProvider>,
    );

    await screen.findByLabelText('labels.includeCoverSheet');

    // Change some settings
    const coverPageCheckbox = screen.getByLabelText('labels.includeCoverSheet');
    fireEvent.click(coverPageCheckbox);

    const fontSelect = screen.getByLabelText('Font');
    fireEvent.change(fontSelect, { target: { value: 'roboto' } });

    const downloadButton = screen.getByRole('button', { name: /download pdf/i });
    fireEvent.click(downloadButton);

    await waitFor(() => {
      expect(mockFetch).toHaveBeenCalled();
    });

    const fetchUrl = mockFetch.mock.calls[0][0];
    expect(fetchUrl).toContain('includeCoverPage=true');
    expect(fetchUrl).toContain('fontFamily=roboto');
  });

  it('should handle download errors gracefully', async () => {
    // Mock this so I don't get the console.warn about unhandled error in test output
    jest.spyOn(console, 'warn').mockImplementation(() => { });

    // Mock fetch to fail
    mockFetch.mockResolvedValue({
      ok: false,
      json: async () => ({ error: 'Download failed' }),
    });

    render(
      <MockedProvider mocks={mocks}>
        <ProjectsProjectPlanDownloadPage />
      </MockedProvider>,
    );

    await screen.findByRole('button', { name: /download pdf/i });

    const downloadButton = screen.getByRole('button', { name: /download pdf/i });
    fireEvent.click(downloadButton);

    await waitFor(() => {
      expect(screen.getByText('messages.errors.downloadFailed')).toBeInTheDocument();
    });

    // Verify no download was attempted
    expect(mockCreateObjectURL).not.toHaveBeenCalled();
    expect(mockClick).not.toHaveBeenCalled();
  });

  it('should use correct filename from plan data', async () => {
    render(
      <MockedProvider mocks={mocks}>
        <ProjectsProjectPlanDownloadPage />
      </MockedProvider>,
    );

    await screen.findByText(/Butterfly Migration/i);

    const downloadButton = screen.getByRole('button', { name: /download pdf/i });
    fireEvent.click(downloadButton);

    await waitFor(() => {
      expect(mockFetch).toHaveBeenCalled();
    });

    // Verify the download filename includes the plan title
    expect(screen.getByText(/Butterfly Migration\.pdf/i)).toBeInTheDocument();
  });
});
