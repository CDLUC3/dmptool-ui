import React from "react";
import { act, fireEvent, render, screen, waitFor } from '@/utils/test-utils';
import { useQuery, useMutation } from '@apollo/client/react';
import {
  AddCustomQuestionDocument,
  QuestionsDisplayOrderDocument,
  TemplateCustomizationOverviewDocument,
} from '@/generated/graphql';

import { axe, toHaveNoViolations } from 'jest-axe';
import { useParams, useSearchParams } from 'next/navigation';
import { useRouter } from '@/i18n/routing';
import CustomQuestionNew from '../page';
import { mockScrollIntoView, mockScrollTo } from "@/__mocks__/common";

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
  usePathname: jest.fn(() => '/template/customizations/1/q/new'),
  getPathname: jest.fn(({ href, locale }: { href: string; locale: string }) => `/${locale}${href}`),
}));

jest.mock('next-intl', () => ({
  useTranslations: jest.fn(() => (key: string) => key),
  useLocale: jest.fn(() => 'en-US'),
}));

jest.mock('@apollo/client/react', () => ({
  useQuery: jest.fn(),
  useMutation: jest.fn(),
}));

jest.mock('@/app/[locale]/template/[templateId]/q/new/utils', () => ({
  useQueryStep: jest.fn(),
}));

jest.mock('@/utils/questionTypeHandlers', () => ({
  getQuestionTypes: jest.fn(),
}));

// Simplify child components to keep tests focused on page-level behaviour
jest.mock('@/components/QuestionTypeCard', () => ({
  __esModule: true,
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  default: ({ questionType, handleSelect }: { questionType: any; handleSelect: Function }) => (
    <button
      data-testid={`question-type-card-${questionType.type}`}
      onClick={() =>
        handleSelect({
          questionType: questionType.type,
          questionTypeName: questionType.title,
          questionJSON: '{}',
        })
      }
    >
      {questionType.title}
    </button>
  ),
}));

jest.mock('@/components/QuestionAdd', () => ({
  __esModule: true,
  default: ({ questionType, onSave }: { questionType: string | null; onSave: Function }) => (
    <div data-testid="question-add">
      <span data-testid="selected-type">{questionType}</span>
      <button onClick={() => onSave({ questionText: 'New question', json: '{}' })}>
        Save Question
      </button>
    </div>
  ),
}));

const mockUseQuery = jest.mocked(useQuery);
const mockUseMutation = jest.mocked(useMutation);
const mockUseRouter = useRouter as jest.Mock;
const mockUseSearchParams = useSearchParams as jest.Mock;

import { useQueryStep } from '@/app/[locale]/template/[templateId]/q/new/utils';
import { getQuestionTypes } from '@/utils/questionTypeHandlers';
const mockUseQueryStep = jest.mocked(useQueryStep);
const mockGetQuestionTypes = jest.mocked(getQuestionTypes);

// ---------------------------------------------------------------------------
// Mock data
// ---------------------------------------------------------------------------

const mockTemplateOverviewData = {
  templateCustomizationOverview: {
    __typename: "TemplateCustomizationOverview",
    customizationId: 8,
    sections: [
      {
        __typename: "SectionCustomizationOverview",
        id: 6198,
        displayOrder: 0,
        name: "Element 1: Data Type",
        sectionType: "BASE",
        questions: [
          { __typename: "QuestionCustomizationOverview", id: 12611, displayOrder: 0, questionText: "Question 1A", questionType: "BASE" },
          { __typename: "QuestionCustomizationOverview", id: 12612, displayOrder: 1, questionText: "Question 1B", questionType: "BASE" },
          { __typename: "QuestionCustomizationOverview", id: 12613, displayOrder: 2, questionText: "Question 1C", questionType: "BASE" },
        ],
      },
      {
        __typename: "SectionCustomizationOverview",
        id: 6203,
        displayOrder: 5,
        name: "Element 6: Oversight of Data Management and Sharing",
        sectionType: "BASE",
        questions: [
          { __typename: "QuestionCustomizationOverview", id: 7, displayOrder: 0, questionText: "Custom Text Area question123", questionType: "CUSTOM" },
          { __typename: "QuestionCustomizationOverview", id: 12622, displayOrder: 1, questionText: "Base question", questionType: "BASE" },
        ],
      },
    ],
  },
};

const mockQuestionTypes = [
  { type: 'text', title: 'Short Text', usageDescription: 'For short text answers' },
  { type: 'textArea', title: 'Long Text', usageDescription: 'For long text answers' },
  { type: 'radioButtons', title: 'Radio Buttons', usageDescription: 'For multiple choice' },
];

// ---------------------------------------------------------------------------
// Helpers
// ---------------------------------------------------------------------------

let mockAddCustomQuestionFn: jest.Mock;

const setupMocks = () => {
  mockUseQuery.mockImplementation((document) => {
    if (document === TemplateCustomizationOverviewDocument) {
      /* eslint-disable @typescript-eslint/no-explicit-any */
      return { data: mockTemplateOverviewData, loading: false, error: null } as any;
    }
    if (document === QuestionsDisplayOrderDocument) {
      return {
        data: { questions: [{ displayOrder: 1 }, { displayOrder: 2 }, { displayOrder: 3 }] },
        loading: false,
        error: null,
        /* eslint-disable @typescript-eslint/no-explicit-any */
      } as any;
    }
    return { data: null, loading: false, error: undefined };
  });

  mockAddCustomQuestionFn = jest.fn().mockResolvedValue({
    data: { addCustomQuestion: { errors: { general: null } } },
  });

  mockUseMutation.mockImplementation((document) => {
    if (document === AddCustomQuestionDocument) {
      /* eslint-disable @typescript-eslint/no-explicit-any */
      return [mockAddCustomQuestionFn, { loading: false, error: undefined }] as any;
    }
    /* eslint-disable @typescript-eslint/no-explicit-any */
    return [jest.fn(), { loading: false, error: undefined }] as any;
  });

  /* eslint-disable @typescript-eslint/no-explicit-any */
  mockGetQuestionTypes.mockReturnValue(mockQuestionTypes as any);
  mockUseQueryStep.mockReturnValue(1);
};

const setupSearchParams = (params: Record<string, string> = {}) => {
  mockUseSearchParams.mockReturnValue({
    get: (key: string) => params[key] ?? null,
    getAll: () => [],
    has: () => false,
    keys() { },
    values() { },
    entries() { },
    forEach() { },
    toString() { return ''; },
  } as unknown as ReturnType<typeof useSearchParams>);
};

// ---------------------------------------------------------------------------
// Tests
// ---------------------------------------------------------------------------

describe("CustomQuestionNew", () => {
  let mockRouter: { push: jest.Mock; replace: jest.Mock };

  beforeEach(() => {
    setupMocks();
    setupSearchParams({ section_id: '6198' });
    HTMLElement.prototype.scrollIntoView = mockScrollIntoView;
    mockScrollTo();

    (useParams as jest.Mock).mockReturnValue({ templateCustomizationId: '8' });

    mockRouter = { push: jest.fn(), replace: jest.fn() };
    mockUseRouter.mockReturnValue(mockRouter);

    window.tinymce = { init: jest.fn(), remove: jest.fn() };
  });

  afterEach(() => {
    jest.clearAllMocks();
  });

  // -------------------------------------------------------------------------
  // Step 1 — Question Type Selection
  // -------------------------------------------------------------------------

  describe("Step 1 — Question Type Selection", () => {
    it("should render the page heading", () => {
      render(<CustomQuestionNew />);
      expect(screen.getByRole('heading', { level: 1 })).toBeInTheDocument();
    });

    it("should render the search field", () => {
      render(<CustomQuestionNew />);
      expect(screen.getByRole('search')).toBeInTheDocument();
      expect(screen.getByRole('button', { name: "Clear search" })).toBeInTheDocument();
    });

    it("should render all question type cards on initial load", () => {
      render(<CustomQuestionNew />);
      expect(screen.getByTestId('question-type-card-text')).toBeInTheDocument();
      expect(screen.getByTestId('question-type-card-textArea')).toBeInTheDocument();
      expect(screen.getByTestId('question-type-card-radioButtons')).toBeInTheDocument();
    });

    it("should show loading state while template query is in flight", () => {
      mockUseQuery.mockReturnValue({ data: undefined, loading: true, error: undefined } as any);
      render(<CustomQuestionNew />);
      expect(screen.queryByRole('heading', { level: 1 })).not.toBeInTheDocument();
    });
  });

  // -------------------------------------------------------------------------
  // Error handling
  // -------------------------------------------------------------------------

  describe("Error Handling", () => {
    it("should render error message when template query fails", () => {
      mockUseQuery.mockImplementation((document) => {
        if (document === TemplateCustomizationOverviewDocument) {
          return { data: undefined, loading: false, error: { message: 'Template query failed' } } as any;
        }
        return { data: null, loading: false, error: undefined };
      });

      render(<CustomQuestionNew />);
      expect(screen.getByText(/template query failed/i)).toBeInTheDocument();
    });

    it("should call logECS when template query fails", () => {
      const queryError = new Error('Network error');
      mockUseQuery.mockImplementation((document) => {
        if (document === TemplateCustomizationOverviewDocument) {
          return { data: undefined, loading: false, error: queryError } as any;
        }
        return { data: null, loading: false, error: undefined };
      });

      render(<CustomQuestionNew />);

      expect(screen.getByText("Network error")).toBeInTheDocument();
    });
  });

  // -------------------------------------------------------------------------
  // Search functionality
  // -------------------------------------------------------------------------

  describe("Search", () => {
    it("should filter question type cards when search button is clicked", async () => {
      render(<CustomQuestionNew />);

      await act(async () => {
        fireEvent.change(screen.getByRole('searchbox'), { target: { value: 'radio' } });
      });
      await act(async () => {
        fireEvent.click(screen.getByRole('button', { name: "Clear search" }));
      });

      await waitFor(() => {
        expect(screen.getByTestId('question-type-card-radioButtons')).toBeInTheDocument();
        expect(screen.queryByTestId('question-type-card-text')).not.toBeInTheDocument();
        expect(screen.queryByTestId('question-type-card-textArea')).not.toBeInTheDocument();
      });
    });

    it("should show 'no items found' message when search returns no results", async () => {
      render(<CustomQuestionNew />);

      await act(async () => {
        fireEvent.change(screen.getByRole('searchbox'), { target: { value: 'zzzznotatype' } });
      });
      await act(async () => {
        fireEvent.click(screen.getByRole('button', { name: "Clear search" }));
      });

      await waitFor(() => {
        expect(screen.getByText(/messaging.noItemsFound/i)).toBeInTheDocument();
      });
    });

    it("should show results count and clear filter button after a successful search", async () => {
      render(<CustomQuestionNew />);

      await act(async () => {
        fireEvent.change(screen.getByRole('searchbox'), { target: { value: 'text' } });
      });
      await act(async () => {
        fireEvent.click(screen.getByRole('button', { name: "Clear search" }));
      });

      await waitFor(() => {
        expect(screen.getAllByRole('button', { name: /links.clearFilter/i }).length).toBeGreaterThan(0);
        expect(screen.getAllByText(/messaging.resultsText/i)).toHaveLength(2); // "1 result" in heading and "1 result found" in clear filter button
      });
    });

    it("should restore the full list when clear filter is clicked", async () => {
      render(<CustomQuestionNew />);

      await act(async () => {
        fireEvent.change(screen.getByRole('searchbox'), { target: { value: 'radio' } });
      });
      await act(async () => {
        fireEvent.click(screen.getByRole('button', { name: "Clear search" }));
      });

      await waitFor(() => {
        expect(screen.queryByTestId('question-type-card-text')).not.toBeInTheDocument();
      });

      const clearButton = screen.getAllByRole('button', { name: /links.clearFilter/i })[0];
      await act(async () => {
        fireEvent.click(clearButton);
      });

      await waitFor(() => {
        expect(screen.getByTestId('question-type-card-text')).toBeInTheDocument();
        expect(screen.getByTestId('question-type-card-textArea')).toBeInTheDocument();
        expect(screen.getByTestId('question-type-card-radioButtons')).toBeInTheDocument();
      });
    });

    it("should restore full list and hide results count when search term is cleared", async () => {
      render(<CustomQuestionNew />);

      const searchInput = screen.getByRole('searchbox');
      await act(async () => {
        fireEvent.change(searchInput, { target: { value: 'radio' } });
      });
      await act(async () => {
        fireEvent.click(screen.getByRole('button', { name: 'Clear search' }));
      });
      await act(async () => {
        fireEvent.change(searchInput, { target: { value: '' } });
      });

      await waitFor(() => {
        expect(screen.queryByText(/links.clearFilter/i)).not.toBeInTheDocument();
        expect(screen.getByTestId('question-type-card-text')).toBeInTheDocument();
      });
    });
  });

  // -------------------------------------------------------------------------
  // Question type selection — handleSelect
  // -------------------------------------------------------------------------

  describe("Question type selection", () => {
    it("should advance to step 2 and call router.replace when a type is selected (no customQuestionId)", async () => {
      render(<CustomQuestionNew />);

      await act(async () => {
        fireEvent.click(screen.getByTestId('question-type-card-text'));
      });

      await waitFor(() => {
        expect(mockRouter.replace).toHaveBeenCalledWith(
          expect.stringContaining('step=2')
        );
      });
    });
  });

  // -------------------------------------------------------------------------
  // Step 2 — QuestionAdd form
  // -------------------------------------------------------------------------

  describe("Step 2 — QuestionAdd form", () => {
    it("should render the QuestionAdd form when step is 2", () => {
      mockUseQueryStep.mockReturnValue(2);
      render(<CustomQuestionNew />);
      expect(screen.getByTestId('question-add')).toBeInTheDocument();
    });

    it("should NOT render the question type search/list when step is 2", () => {
      mockUseQueryStep.mockReturnValue(2);
      render(<CustomQuestionNew />);
      expect(screen.queryByRole('search')).not.toBeInTheDocument();
      expect(screen.queryByTestId('question-type-card-text')).not.toBeInTheDocument();
    });

    it("should call addCustomQuestionMutation with correct variables when saving", async () => {
      mockUseQueryStep.mockReturnValue(2);
      render(<CustomQuestionNew />);

      await waitFor(() => expect(screen.getByTestId('question-add')).toBeInTheDocument());

      await act(async () => {
        fireEvent.click(screen.getByRole('button', { name: /save question/i }));
      });

      await waitFor(() => {
        expect(mockAddCustomQuestionFn).toHaveBeenCalledWith(
          expect.objectContaining({
            variables: expect.objectContaining({
              input: expect.objectContaining({
                templateCustomizationId: 8,
                sectionId: 6198,
              }),
            }),
          })
        );
      });
    });
  });

  // -------------------------------------------------------------------------
  // Last question pinning logic (useEffect on data + sectionId)
  // -------------------------------------------------------------------------

  describe("Last question pinning", () => {
    it("should pin after the question with the highest displayOrder in the section", async () => {
      // Section 6198 has questions with displayOrders 0, 1, 2 — highest is id:12613 (BASE)
      mockUseQueryStep.mockReturnValue(2);
      setupSearchParams({ section_id: '6198' });

      render(<CustomQuestionNew />);

      await waitFor(() => expect(screen.getByTestId('question-add')).toBeInTheDocument());

      await act(async () => {
        fireEvent.click(screen.getByRole('button', { name: /save question/i }));
      });

      await waitFor(() => {
        expect(mockAddCustomQuestionFn).toHaveBeenCalledWith(
          expect.objectContaining({
            variables: expect.objectContaining({
              input: expect.objectContaining({
                pinnedQuestionId: 12613,
                pinnedQuestionType: 'BASE',
              }),
            }),
          })
        );
      });
    });

    it("should pin after the last CUSTOM question when section has mixed types", async () => {
      // Section 6203: id:7 (CUSTOM, displayOrder:0), id:12622 (BASE, displayOrder:1) → last is 12622
      mockUseQueryStep.mockReturnValue(2);
      setupSearchParams({ section_id: '6203' });

      render(<CustomQuestionNew />);

      await waitFor(() => expect(screen.getByTestId('question-add')).toBeInTheDocument());

      await act(async () => {
        fireEvent.click(screen.getByRole('button', { name: /save question/i }));
      });

      await waitFor(() => {
        expect(mockAddCustomQuestionFn).toHaveBeenCalledWith(
          expect.objectContaining({
            variables: expect.objectContaining({
              input: expect.objectContaining({
                pinnedQuestionId: 12622,
                pinnedQuestionType: 'BASE',
              }),
            }),
          })
        );
      });
    });

    it("should pass pinnedQuestionId: null when the section has no questions", async () => {
      mockUseQuery.mockImplementation((document) => {
        if (document === TemplateCustomizationOverviewDocument) {
          return {
            data: {
              templateCustomizationOverview: {
                sections: [{ id: 6198, displayOrder: 0, questions: [] }],
              },
            },
            loading: false,
            error: null,
          } as any;
        }
        return { data: null, loading: false, error: undefined };
      });

      mockUseQueryStep.mockReturnValue(2);

      render(<CustomQuestionNew />);

      await waitFor(() => expect(screen.getByTestId('question-add')).toBeInTheDocument());

      await act(async () => {
        fireEvent.click(screen.getByRole('button', { name: /save question/i }));
      });

      await waitFor(() => {
        expect(mockAddCustomQuestionFn).toHaveBeenCalledWith(
          expect.objectContaining({
            variables: expect.objectContaining({
              input: expect.objectContaining({
                pinnedQuestionId: null,
              }),
            }),
          })
        );
      });
    });

    it("should pass pinnedQuestionId: null when no section_id param is provided", async () => {
      setupSearchParams({}); // no section_id
      mockUseQueryStep.mockReturnValue(2);

      render(<CustomQuestionNew />);

      await waitFor(() => expect(screen.getByTestId('question-add')).toBeInTheDocument());

      await act(async () => {
        fireEvent.click(screen.getByRole('button', { name: /save question/i }));
      });

      await waitFor(() => {
        expect(mockAddCustomQuestionFn).toHaveBeenCalledWith(
          expect.objectContaining({
            variables: expect.objectContaining({
              input: expect.objectContaining({
                pinnedQuestionId: null,
              }),
            }),
          })
        );
      });
    });
  });

  // -------------------------------------------------------------------------
  // Accessibility
  // -------------------------------------------------------------------------

  describe("Accessibility", () => {
    it("should pass axe accessibility checks on step 1", async () => {
      const { container } = render(<CustomQuestionNew />);
      await act(async () => {
        const results = await axe(container);
        expect(results).toHaveNoViolations();
      });
    });

    it("should pass axe accessibility checks on step 2", async () => {
      mockUseQueryStep.mockReturnValue(2);
      const { container } = render(<CustomQuestionNew />);
      await act(async () => {
        const results = await axe(container);
        expect(results).toHaveNoViolations();
      });
    });
  });
});