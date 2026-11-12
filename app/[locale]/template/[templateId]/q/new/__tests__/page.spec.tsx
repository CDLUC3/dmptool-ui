import React from "react";
import { act, fireEvent, render, screen } from '@/utils/test-utils';
import { axe, toHaveNoViolations } from 'jest-axe';
import { useParams, useSearchParams } from 'next/navigation';
import { useRouter } from '@/i18n/routing';
import { useQueryStep } from '@/app/[locale]/template/[templateId]/q/new/utils';
import QuestionTypeSelectPage from "../page";
import { mockScrollIntoView, mockScrollTo } from "@/__mocks__/common";
import { useMutation, useQuery } from '@apollo/client/react';
expect.extend(toHaveNoViolations);

jest.mock('@apollo/client/react', () => ({
  useQuery: jest.fn(),
  useMutation: jest.fn(),
}));

const mockUseQuery = jest.mocked(useQuery);
const mockUseMutation = jest.mocked(useMutation);

jest.mock('next/navigation', () => ({
  useParams: jest.fn(),
  useSearchParams: jest.fn()
}))

jest.mock('@/i18n/routing', () => ({
  Link: ({ href, children, ...props }: { href: string; children: React.ReactNode }) => (
    <a href={href} {...props}>{children}</a>
  ),
  useRouter: jest.fn(() => ({ push: jest.fn(), replace: jest.fn(), back: jest.fn() })),
  usePathname: jest.fn(() => '/template/1/q/new'),
  getPathname: jest.fn(({ href, locale }: { href: string; locale: string }) => `/${locale}${href}`),
}));

jest.mock('next-intl', () => ({
  useTranslations: jest.fn(() => (key: string) => key),
  useLocale: jest.fn(() => 'en-US'),
}));

jest.mock('@/components/QuestionAdd', () => {
  return {
    __esModule: true,
    default: () => <div>Mocked QuestionAdd</div>,
  };
});

jest.mock("@/app/[locale]/template/[templateId]/q/new/utils", () => ({
  useQueryStep: jest.fn()
}))

jest.mock('@/components/BackButton', () => {
  return {
    __esModule: true,
    default: () => <div>Mocked Back Button</div>,
  };
});

// Mock QuestionAdd component since it has it's own separate unit test.
// Props are captured so the page's onSave handler can be tested directly.
const mockQuestionAddProps = jest.fn();
jest.mock('@/components/QuestionAdd', () => {
  return {
    __esModule: true,
    default: (props: Record<string, unknown>) => {
      mockQuestionAddProps(props);
      return <div>Mocked Question Add Component</div>;
    },
  };
});



describe("QuestionTypeSelectPage", () => {
  let pushMock: jest.Mock;
  let replaceMock: jest.Mock;
  beforeEach(() => {
    HTMLElement.prototype.scrollIntoView = mockScrollIntoView;
    mockScrollTo();
    const mockTemplateId = 123;
    const mockUseParams = useParams as jest.Mock;
    const mockUseQueryStep = useQueryStep as jest.Mock;

    // Mock the return value of useParams
    mockUseParams.mockReturnValue({ templateId: `${mockTemplateId}` });
    mockUseQueryStep.mockReturnValue(1);

    pushMock = jest.fn();
    replaceMock = jest.fn();
    (useRouter as jest.Mock).mockReturnValue({ push: pushMock, replace: replaceMock });

    (useSearchParams as jest.MockedFunction<typeof useSearchParams>).mockImplementation(() => {
      return {
        get: (key: string) => {
          const params: Record<string, string> = { section_id: '123' };
          return params[key] || null;
        },
        getAll: () => [],
        has: (key: string) => key in { questionTypeId: '1' },
        keys() { },
        values() { },
        entries() { },
        forEach() { },
        toString() { return ''; },
      } as unknown as ReturnType<typeof useSearchParams>;
    });

    mockUseMutation.mockImplementation(() => [
      jest.fn().mockResolvedValue({ data: {} }),
      { loading: false, error: undefined }
      // eslint-disable-next-line @typescript-eslint/no-explicit-any
    ] as any);

    mockUseQuery.mockImplementation(() => ({
      data: {
        questions: [
          { displayOrder: 1 },
          { displayOrder: 2 },
        ]
      },
      loading: false,
      error: undefined,
      /* eslint-disable @typescript-eslint/no-explicit-any */
    }) as any);

  });

  it("should render data returned from template query correctly", async () => {
    await act(async () => {
      render(
        <QuestionTypeSelectPage />
      );
    });

    const pageTitle = screen.getByRole('heading', { level: 1, name: 'title' });
    expect(pageTitle).toBeInTheDocument();
    const pageDescription = screen.getByText('description');
    expect(pageDescription).toBeInTheDocument();
    const searchInput = screen.getByLabelText('labels.searchByKeyword');
    expect(searchInput).toBeInTheDocument();
    const searchButton = screen.getByText('buttons.search');
    expect(searchButton).toBeInTheDocument();
    const searchHelpText = screen.getByText('searchHelpText');
    expect(searchHelpText).toBeInTheDocument();

    //Question types
    const questionTypeCard1 = screen.getByRole('heading', { level: 2, name: /Text Area/i });
    const questionTypeCard1Description = screen.getByText('For questions that require longer answers, you can select formatting options too.');
    const questionTypeCard2 = screen.getByRole('heading', { level: 2, name: /Text Field/i });
    const questionTypeCard2Description = screen.getByText('For questions that require short, simple answers.');
    const questionTypeCard3 = screen.getByRole('heading', { level: 2, name: /Radio Buttons/i });
    const questionTypeCard3Description = screen.getByText('For multiple choice questions where users select just one option.');
    const selectButtons = screen.getAllByRole('button', { name: /buttons.select/i });
    expect(questionTypeCard1).toBeInTheDocument();
    expect(questionTypeCard1Description).toBeInTheDocument();
    expect(questionTypeCard2).toBeInTheDocument();
    expect(questionTypeCard2Description).toBeInTheDocument();
    expect(questionTypeCard3).toBeInTheDocument();
    expect(questionTypeCard3Description).toBeInTheDocument();
    expect(selectButtons.length).toBe(15); // total of 15 question types
  });

  it('should show filtered list when user clicks Search button', async () => {
    await act(async () => {
      render(
        <QuestionTypeSelectPage />
      );
    });

    // Searching for translation key since cannot run next-intl for unit tests
    const searchInput = screen.getByLabelText(/labels.searchByKeyword/i);

    // enter findable search term
    await act(async () => {
      fireEvent.change(searchInput, { target: { value: 'Text' } });
    });

    const searchButton = screen.getByRole('button', { name: /clear search/i });
    fireEvent.click(searchButton);

    // Check that we can find section name that matches the search item
    expect(screen.getByText('Text Field')).toBeInTheDocument();

    // Question Type 'Text Area' should not display after filtering
    const textArea = screen.queryByRole('textbox', { name: /text area/i });
    expect(textArea).not.toBeInTheDocument();
  })

  it('should show no results when a search matches nothing, even after a search that did', async () => {
    await act(async () => {
      render(
        <QuestionTypeSelectPage />
      );
    });

    const searchInput = screen.getByLabelText(/labels.searchByKeyword/i);
    const searchButton = screen.getByRole('button', { name: /clear search/i });

    await act(async () => {
      fireEvent.change(searchInput, { target: { value: 'Text' } });
    });
    fireEvent.click(searchButton);
    expect(screen.getByText('Text Field')).toBeInTheDocument();

    // A second search with no matches used to keep showing the "Text" results
    await act(async () => {
      fireEvent.change(searchInput, { target: { value: 'no-such-question-type' } });
    });
    fireEvent.click(searchButton);

    expect(screen.getByText('messaging.noItemsFound')).toBeInTheDocument();
    expect(screen.queryByText('Text Field')).not.toBeInTheDocument();
    expect(screen.queryAllByText('buttons.select')).toHaveLength(0);
  })

  it('should load QuestionAdd component when a user selects a question type', async () => {
    await act(async () => {
      render(
        <QuestionTypeSelectPage />
      );
    });

    // Find a question type that has options, like a radio button
    const buttons = screen.getAllByText('buttons.select');
    const selectButton = buttons.find(button => button.getAttribute('data-type') === 'selectBox');
    expect(selectButton).toBeInTheDocument();

    if (selectButton) {
      fireEvent.click(selectButton);
    } else {
      throw new Error('Select button not found');
    }

    // Should load the QuestionAdd component once a user selects a question type with options
    expect(screen.getByText('Mocked Question Add Component')).toBeInTheDocument();
  })

  describe('onSave passed to QuestionAdd', () => {
    const commonFields = {
      questionText: 'New Question',
      json: '{}',
      required: false,
      displayOrder: 3,
    };

    const renderAndGetOnSave = async (mutationResult: unknown) => {
      const mockAddQuestion = jest.fn().mockResolvedValue(mutationResult);
      mockUseMutation.mockImplementation(() => [
        mockAddQuestion,
        { loading: false, error: undefined }
      ] as any);

      await act(async () => {
        render(<QuestionTypeSelectPage />);
      });

      const selectButton = screen.getAllByText('buttons.select')
        .find(button => button.getAttribute('data-type') === 'selectBox');
      fireEvent.click(selectButton!);

      const { onSave } = mockQuestionAddProps.mock.calls.at(-1)![0] as {
        onSave: (fields: typeof commonFields) => Promise<string[] | void>;
      };
      return { onSave, mockAddQuestion };
    };

    it('should return the validation errors from the addQuestion response', async () => {
      const { onSave, mockAddQuestion } = await renderAndGetOnSave({
        data: {
          addQuestion: {
            id: null,
            errors: { general: 'Unable to add question', questionText: 'Question text is required' },
          },
        },
      });

      let result: string[] | void = undefined;
      await act(async () => {
        result = await onSave(commonFields);
      });

      expect(mockAddQuestion).toHaveBeenCalledWith({
        variables: {
          input: expect.objectContaining({ templateId: 123, sectionId: 123, questionText: 'New Question' }),
        },
      });
      expect(result).toEqual(['Unable to add question', 'Question text is required']);
    });

    it('should return no errors when the question is added successfully', async () => {
      const { onSave } = await renderAndGetOnSave({
        data: {
          addQuestion: {
            id: 99,
            errors: { general: null, questionText: null },
          },
        },
      });

      let result: string[] | void = undefined;
      await act(async () => {
        result = await onSave(commonFields);
      });

      expect(result).toEqual([]);
    });
  });

  it('should pass axe accessibility test', async () => {
    const { container } = render(
      <QuestionTypeSelectPage />
    );

    await act(async () => {
      const results = await axe(container);
      expect(results).toHaveNoViolations();
    });

  });
});
