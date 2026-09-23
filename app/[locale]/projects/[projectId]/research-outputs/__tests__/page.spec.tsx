import React from 'react';
import { useRouter } from '@/i18n/routing';
import { render, screen, fireEvent, waitFor } from '@testing-library/react';
import '@testing-library/jest-dom';
import { axe, toHaveNoViolations } from 'jest-axe';
import ProjectsProjectResearchOutputs from '../page';

expect.extend(toHaveNoViolations);

jest.mock('@/i18n/routing', () => ({
  Link: ({ href, children, ...props }: { href: string; children: React.ReactNode }) => (
    <a href={href} {...props}>{children}</a>
  ),
  useRouter: jest.fn(() => ({ push: jest.fn(), replace: jest.fn(), back: jest.fn() })),
}));

const mockUseRouter = useRouter as jest.Mock;

describe('ProjectsProjectResearchOutputs', () => {
  beforeEach(() => {
    window.scrollTo = jest.fn(); // Called by the wrapping PageHeader
    mockUseRouter.mockReturnValue({
      push: jest.fn(),
    })
  })

  afterEach(() => {
    jest.clearAllMocks();
  });

  it('should render the page header with title and description', () => {
    render(<ProjectsProjectResearchOutputs />);
    expect(screen.getByText('Research Outputs')).toBeInTheDocument();
    expect(screen.getByText('Manage and document the outputs of your research project.')).toBeInTheDocument();
  });

  it('should render the "Add Research Output" button and handles click', async () => {
    render(<ProjectsProjectResearchOutputs />);
    const addButton = screen.getByRole('button', { name: /Add new research output/i });
    expect(addButton).toBeInTheDocument();

    fireEvent.click(addButton);
    await waitFor(() => {
      // Should redirect to the Feeback page when modal is closed
      expect(mockUseRouter().push).toHaveBeenCalledWith('/projects/proj_2425/research-outputs/edit');
    });
  });

  it('should render the list of research outputs', () => {
    render(<ProjectsProjectResearchOutputs />);
    expect(screen.getByText('Climate Change Impact on Polar Ecosystems')).toBeInTheDocument();
    expect(screen.getByText('Data Framework for Ecosystem Studies')).toBeInTheDocument();
    expect(screen.getByText('Biodiversity Changes in the Arctic')).toBeInTheDocument();
  });

  it('should handle "Edit" button click for a research output', async () => {
    render(<ProjectsProjectResearchOutputs />);
    const editButton = screen.getByRole('button', { name: /Edit research output: Climate Change Impact on Polar Ecosystems/i });

    fireEvent.click(editButton);
    await waitFor(() => {
      // Should redirect to the Feeback page when modal is closed
      expect(mockUseRouter().push).toHaveBeenCalledWith('/projects/proj_2425/research-outputs/edit?id=output-001');
    });
  });

  it('should handle "Delete" button click for a research output', () => {
    const consoleSpy = jest.spyOn(console, 'log');
    render(<ProjectsProjectResearchOutputs />);
    const deleteButton = screen.getByRole('button', { name: 'Delete research output: Climate Change Impact on Polar Ecosystems' });

    fireEvent.click(deleteButton);
    expect(consoleSpy).toHaveBeenCalledWith('Deleted research output: output-001');
  });

  it('should pass accessibility tests', async () => {
    const { container } = render(<ProjectsProjectResearchOutputs />);
    const results = await axe(container);
    expect(results).toHaveNoViolations();
  });
});
