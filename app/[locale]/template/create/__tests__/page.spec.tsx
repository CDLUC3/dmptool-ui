import React from 'react';
import { act, fireEvent, render, screen, waitFor } from '@/utils/test-utils';
import '@testing-library/jest-dom';
import { axe, toHaveNoViolations } from 'jest-axe';
import { useLazyQuery } from '@apollo/client/react';
import { useRouter } from '@/i18n/routing';
import TemplateCreatePage from '../page';
import { useQueryStep } from '../useQueryStep';
import { mockScrollTo } from '@/__mocks__/common';
import { handleApolloError } from '@/utils/apolloErrorHandler';

expect.extend(toHaveNoViolations);

// Mock the useQueryStep hook
jest.mock('@/app/[locale]/template/create/useQueryStep', () => ({
  useQueryStep: jest.fn(),
}));

// Mock the debounce function
jest.mock('@/hooks/debounce', () => ({
  debounce: (fn: (..._args: unknown[]) => unknown) => fn,
}));

jest.mock('@apollo/client/react', () => ({
  ...jest.requireActual('@apollo/client/react'),
  useLazyQuery: jest.fn(),
}));

jest.mock('@/utils/apolloErrorHandler', () => ({
  handleApolloError: jest.fn(() => ({ wasRealError: true, message: 'error' })),
}));

// Mock the Next.js router

jest.mock('@/i18n/routing', () => ({
  Link: ({ href, children, ...props }: { href: string; children: React.ReactNode }) => (
    <a href={href} {...props}>{children}</a>
  ),
  useRouter: jest.fn(() => ({ push: jest.fn(), replace: jest.fn(), back: jest.fn() })),
  usePathname: jest.fn(() => '/template/create'),
}));

jest.mock('@/components/SelectExistingTemplate', () => ({
  __esModule: true,
  default: () => <div data-testid="select-existing-template">Mocked TemplateSelectTemplatePage Component</div>,
}));

const enterName = (value: string) => {
  fireEvent.change(screen.getByLabelText('nameOfYourTemplate'), {
    target: { value },
  });
};

const clickNext = async () => {
  await act(async () => {
    fireEvent.click(screen.getByText('buttons.next'));
  });
};

describe('TemplateCreatePage', () => {
  let pushMock: jest.Mock;
  let checkTemplateNameMock: jest.Mock;

  beforeEach(() => {
    pushMock = jest.fn();
    checkTemplateNameMock = jest.fn().mockResolvedValue({
      data: { templateNameAvailable: true },
      error: undefined,
    });
    (useRouter as jest.Mock).mockReturnValue({ push: pushMock });
    (useLazyQuery as jest.Mock).mockReturnValue([checkTemplateNameMock, { loading: false }]);
    mockScrollTo();
  });

  it('should render loading state initially', () => {
    (useQueryStep as jest.Mock).mockReturnValue(null); // No step in query initially

    render(<TemplateCreatePage />);
    expect(screen.getByTestId('loading-component')).toBeInTheDocument();
  });

  it('should render step 1 form when step is 1', () => {
    (useQueryStep as jest.Mock).mockReturnValue(1);

    render(<TemplateCreatePage />);
    expect(screen.getByLabelText('nameOfYourTemplate')).toBeInTheDocument();
  });

  it('should render error message when "Next" is clicked with invalid input', async () => {
    (useQueryStep as jest.Mock).mockReturnValue(1);

    render(<TemplateCreatePage />);
    const button = screen.getByText('buttons.next');
    fireEvent.click(button);

    await waitFor(() =>
      expect(
        screen.getByText('messages.templateNameError')
      ).toBeInTheDocument()
    );
    expect(checkTemplateNameMock).not.toHaveBeenCalled();
  });

  it('should check the trimmed name and navigate to step 2 when the name is available', async () => {
    (useQueryStep as jest.Mock).mockReturnValue(1);

    render(<TemplateCreatePage />);
    enterName('  Brand New Template  ');
    await clickNext();

    await waitFor(() => {
      expect(checkTemplateNameMock).toHaveBeenCalledWith({
        variables: { name: 'Brand New Template' },
      });
      expect(pushMock).toHaveBeenCalledWith('/template/create?step=2');
    });
  });

  it('should show an error and not navigate when the template name is already taken', async () => {
    (useQueryStep as jest.Mock).mockReturnValue(1);
    checkTemplateNameMock.mockResolvedValue({
      data: { templateNameAvailable: false },
      error: undefined,
    });

    render(<TemplateCreatePage />);
    enterName('Existing Template');
    await clickNext();

    await waitFor(() =>
      expect(screen.getByText('messages.templateNameTaken')).toBeInTheDocument()
    );
    expect(pushMock).not.toHaveBeenCalled();
  });

  it('should clear the taken name error when the user edits the name', async () => {
    (useQueryStep as jest.Mock).mockReturnValue(1);
    checkTemplateNameMock.mockResolvedValue({
      data: { templateNameAvailable: false },
      error: undefined,
    });

    render(<TemplateCreatePage />);
    enterName('Existing Template');
    await clickNext();
    expect(await screen.findByText('messages.templateNameTaken')).toBeInTheDocument();

    enterName('Existing Template 2');

    await waitFor(() => {
      expect(screen.queryByText('messages.templateNameTaken')).not.toBeInTheDocument();
    });
  });

  it('should show a check error when the name availability query fails', async () => {
    (useQueryStep as jest.Mock).mockReturnValue(1);
    checkTemplateNameMock.mockResolvedValue({
      data: undefined,
      error: new Error('network failed'),
    });

    render(<TemplateCreatePage />);
    enterName('Some Template');
    await clickNext();

    await waitFor(() =>
      expect(screen.getByText('messages.templateNameCheckError')).toBeInTheDocument()
    );
    expect(handleApolloError).toHaveBeenCalled();
    expect(pushMock).not.toHaveBeenCalled();
  });

  it('should show a check error when the query rejects', async () => {
    (useQueryStep as jest.Mock).mockReturnValue(1);
    checkTemplateNameMock.mockRejectedValue(new Error('network failed'));

    render(<TemplateCreatePage />);
    enterName('Some Template');
    await clickNext();

    await waitFor(() =>
      expect(screen.getByText('messages.templateNameCheckError')).toBeInTheDocument()
    );
    expect(pushMock).not.toHaveBeenCalled();
  });

  it('should show a check error when the query returns no data', async () => {
    (useQueryStep as jest.Mock).mockReturnValue(1);
    checkTemplateNameMock.mockResolvedValue({ data: undefined, error: undefined });

    render(<TemplateCreatePage />);
    enterName('Some Template');
    await clickNext();

    await waitFor(() =>
      expect(screen.getByText('messages.templateNameCheckError')).toBeInTheDocument()
    );
    expect(pushMock).not.toHaveBeenCalled();
  });

  it('should pass axe accessibility test with the taken name error showing', async () => {
    (useQueryStep as jest.Mock).mockReturnValue(1);
    checkTemplateNameMock.mockResolvedValue({
      data: { templateNameAvailable: false },
      error: undefined,
    });

    const { container } = render(<TemplateCreatePage />);
    enterName('Existing Template');
    await clickNext();
    await screen.findByText('messages.templateNameTaken');

    await act(async () => {
      expect(await axe(container)).toHaveNoViolations();
    });
  });

  it('should render step 2 when step is 2', () => {
    (useQueryStep as jest.Mock).mockReturnValue(2);

    render(<TemplateCreatePage />);
    expect(screen.getByText(/Mocked TemplateSelectTemplatePage Component/i)).toBeInTheDocument();
  });
});
