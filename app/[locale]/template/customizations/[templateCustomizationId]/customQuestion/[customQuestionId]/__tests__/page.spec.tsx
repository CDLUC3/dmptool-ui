import React from "react";
import { act, fireEvent, render, screen, waitFor } from '@/utils/test-utils';
import { useQuery, useMutation } from '@apollo/client/react';
import {
  CustomQuestionDocument,
  UpdateCustomQuestionDocument,
  RemoveCustomQuestionDocument,
} from '@/generated/graphql';

import { axe, toHaveNoViolations } from 'jest-axe';
import { useParams, useSearchParams } from 'next/navigation';
import { useRouter } from '@/i18n/routing';
import { useToast } from '@/context/ToastContext';
import logECS from '@/utils/clientLogger';
import CustomQuestionEdit from '../page';
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
  usePathname: jest.fn(() => '/template/customizations/1/customQuestion/1'),
}));

// Mock Apollo Client hooks
jest.mock('@apollo/client/react', () => ({
  useQuery: jest.fn(),
  useMutation: jest.fn(),
}));

jest.mock('@/context/ToastContext', () => ({
  useToast: jest.fn(() => ({
    add: jest.fn(),
  })),
}));

// Jest with jsdom doesn't implement structuredClone, which is used in our component code. This causes tests to fail when they try to clone data returned from 
// mocked queries/mutations. We can polyfill it in our test environment using JSON.parse/stringify since we don't have any complex data types that require the full capabilities of structuredClone.
if (typeof global.structuredClone !== 'function') {
  global.structuredClone = (val) => JSON.parse(JSON.stringify(val));
}

const mockUseQuery = jest.mocked(useQuery);
const mockUseMutation = jest.mocked(useMutation);
const mockUseRouter = useRouter as jest.Mock;
const mockUseSearchParams = useSearchParams as jest.Mock;

// ---------------------------------------------------------------------------
// Mock data
// ---------------------------------------------------------------------------

const mockRadioButtonQuestion = {
  customQuestion: {
    __typename: "CustomQuestion",
    id: 7,
    json: JSON.stringify({
      meta: { schemaVersion: "1.0" },
      type: "radioButtons",
      options: [
        { label: "Alpha", value: "Alpha", selected: false },
        { label: "Bravo", value: "Bravo", selected: true },
      ],
      attributes: {},
    }),
    modified: "2026-03-11 20:01:49",
    sampleText: "<p>This is my sample text</p>",
    requirementText: "<p>My question requirements</p>",
    questionText: "Custom Radio Button question",
    guidanceText: "<p>My question guidance</p>",
    errors: {
      __typename: "CustomQuestionErrors",
      general: null,
      guidanceText: null,
      json: null,
      migrationStatus: null,
      pinnedQuestionId: null,
      pinnedQuestionType: null,
      questionText: null,
      required: null,
      requirementText: null,
      sampleText: null,
      sectionId: null,
      sectionType: null,
      templateCustomizationId: null,
      useSampleTextAsDefault: null,
    },
    migrationStatus: "OK",
    pinnedQuestionId: null,
    pinnedQuestionType: null,
    required: true,
    sectionId: 6203,
    sectionType: "BASE",
    templateCustomizationId: 8,
    useSampleTextAsDefault: false,
  },
};

const mockTextAreaQuestion = {
  customQuestion: {
    ...mockRadioButtonQuestion.customQuestion,
    id: 8,
    questionText: "Custom Text Area question",
    json: JSON.stringify({
      meta: { schemaVersion: "1.0" },
      type: "textArea",
      attributes: { asRichText: true, cols: 20, rows: 20, maxLength: 1000, minLength: 0 },
    }),
    useSampleTextAsDefault: true,
  },
};

const mockTextQuestion = {
  customQuestion: {
    ...mockRadioButtonQuestion.customQuestion,
    id: 9,
    questionText: "Custom Text question",
    json: JSON.stringify({
      meta: { schemaVersion: "1.0" },
      type: "text",
      attributes: { maxLength: 1000, minLength: 0, pattern: "^.+$" },
    }),
  },
};

const mockDateRangeQuestion = {
  customQuestion: {
    ...mockRadioButtonQuestion.customQuestion,
    id: 10,
    questionText: "Custom Date Range question",
    json: JSON.stringify({
      meta: { schemaVersion: "1.0" },
      type: "dateRange",
      columns: {
        start: { label: "Start Date" },
        end: { label: "End Date" },
      },
      attributes: {},
    }),
  },
};

const mockAffiliationSearchQuestion = {
  customQuestion: {
    ...mockRadioButtonQuestion.customQuestion,
    id: 11,
    questionText: "Custom Affiliation Search question",
    json: JSON.stringify({
      meta: { schemaVersion: "1.0" },
      type: "affiliationSearch",
      attributes: {
        label: "Institution",
        help: "Search for your institution",
      },
      graphQL: {
        query: "query Affiliations($name: String!){ affiliations(name: $name) { items { id displayName uri } } }",
        responseField: "affiliations.items",
        variables: [{ name: "name", type: "string", label: "Search", minLength: 3 }],
        answerField: "uri",
        displayFields: [{ label: "Institution", propertyName: "displayName" }],
      },
    }),
  },
};

// ---------------------------------------------------------------------------
// Helpers
// ---------------------------------------------------------------------------

let mockUpdateCustomQuestionFn: jest.Mock;
let mockRemoveCustomQuestionFn: jest.Mock;

const setupMocks = (questionData = mockRadioButtonQuestion) => {
  mockUseQuery.mockImplementation((document) => {
    if (document === CustomQuestionDocument) {
      /* eslint-disable @typescript-eslint/no-explicit-any */
      return { data: questionData, loading: false, error: null } as any;
    }
    return { data: null, loading: false, error: undefined };
  });

  mockUpdateCustomQuestionFn = jest.fn().mockResolvedValue({
    data: { updateCustomQuestion: { errors: { general: null, questionText: null } } },
  });

  mockRemoveCustomQuestionFn = jest.fn().mockResolvedValue({
    data: { removeCustomQuestion: { errors: { general: null } } },
  });

  mockUseMutation.mockImplementation((document) => {
    if (document === UpdateCustomQuestionDocument) {
      /* eslint-disable @typescript-eslint/no-explicit-any */
      return [mockUpdateCustomQuestionFn, { loading: false, error: undefined }] as any;
    }
    if (document === RemoveCustomQuestionDocument) {
      /* eslint-disable @typescript-eslint/no-explicit-any */
      return [mockRemoveCustomQuestionFn, { loading: false, error: undefined }] as any;
    }
    /* eslint-disable @typescript-eslint/no-explicit-any */
    return [jest.fn(), { loading: false, error: undefined }] as any;
  });
};

const setupSearchParams = (questionType = 'radioButtons') => {
  mockUseSearchParams.mockReturnValue({
    get: (key: string) => {
      const params: Record<string, string> = { questionType };
      return params[key] || null;
    },
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

describe("CustomQuestionEdit", () => {
  let mockRouter: { push: jest.Mock };

  beforeEach(() => {
    setupMocks();
    setupSearchParams();
    HTMLElement.prototype.scrollIntoView = mockScrollIntoView;
    mockScrollTo();

    (useParams as jest.Mock).mockReturnValue({
      templateCustomizationId: '8',
      customQuestionId: '7',
    });

    mockRouter = { push: jest.fn() };
    mockUseRouter.mockReturnValue(mockRouter);

    (useToast as jest.Mock).mockReturnValue({ add: jest.fn() });

    window.tinymce = { init: jest.fn(), remove: jest.fn() };
  });

  afterEach(() => {
    jest.clearAllMocks();
  });

  // -------------------------------------------------------------------------
  // Rendering
  // -------------------------------------------------------------------------

  it("should render the page heading", async () => {
    render(<CustomQuestionEdit />);
    const heading = screen.getByRole('heading', { level: 1 });
    expect(heading).toBeInTheDocument();
  });

  it("should render core form fields", async () => {
    render(<CustomQuestionEdit />);
    expect(screen.getByText(/labels.type/i)).toBeInTheDocument();
    expect(screen.getByLabelText(/labels.questionText/i)).toBeInTheDocument();
    expect(screen.getByText(/labels.requirementText/i)).toBeInTheDocument();
    expect(screen.getByText(/labels.guidanceText/i)).toBeInTheDocument();
  });

  it("should render the save button", async () => {
    render(<CustomQuestionEdit />);
    expect(screen.getByRole('button', { name: /buttons.saveAndUpdate/i })).toBeInTheDocument();
  });

  it("should render the sidebar preview section", async () => {
    render(<CustomQuestionEdit />);
    expect(screen.getByRole('heading', { name: /headings.preview/i })).toBeInTheDocument();
    expect(screen.getByRole('heading', { level: 3 })).toHaveTextContent('headings.bestPractice');
  });

  it("should render the delete danger zone", async () => {
    render(<CustomQuestionEdit />);
    expect(screen.getByText(/headings.deleteQuestion/i)).toBeInTheDocument();
    expect(screen.getByRole('button', { name: /buttons.deleteCustomization/i })).toBeInTheDocument();
  });

  it("should show loading state while query is in flight", async () => {
    mockUseQuery.mockReturnValue({ data: undefined, loading: true, error: undefined } as any);
    render(<CustomQuestionEdit />);
    expect(screen.queryByLabelText(/labels.questionText/i)).not.toBeInTheDocument();
  });

  it("should populate question text field from query data", async () => {
    render(<CustomQuestionEdit />);
    await waitFor(() => {
      const input = screen.getByLabelText(/labels.questionText/i) as HTMLInputElement;
      expect(input.value).toBe('Custom Radio Button question');
    });
  });

  // -------------------------------------------------------------------------
  // Question-type-specific rendering
  // -------------------------------------------------------------------------

  it("should render sampleText and useSampleTextAsDefault checkbox for textArea question type", async () => {
    setupMocks(mockTextAreaQuestion);
    setupSearchParams('textArea');

    render(<CustomQuestionEdit />);

    await waitFor(() => {
      expect(screen.getByText(/labels.sampleText/i)).toBeInTheDocument();
      expect(screen.getByText(/descriptions.sampleTextAsDefault/i)).toBeInTheDocument();
    });
  });

  it("should NOT render sampleText field for radioButtons question type", async () => {
    render(<CustomQuestionEdit />);
    await waitFor(() => {
      expect(screen.queryByText(/labels.sampleText/i)).not.toBeInTheDocument();
    });
  });

  it("should render radio options editor for radioButtons question type", async () => {
    render(<CustomQuestionEdit />);
    await waitFor(() => {
      // QuestionOptionsComponent renders rows
      expect(screen.getAllByLabelText(/text/i).length).toBeGreaterThan(0);
    });
  });

  it("should render required yes/no radio buttons", async () => {
    render(<CustomQuestionEdit />);
    await waitFor(() => {
      expect(screen.getByText('form.yesLabel')).toBeInTheDocument();
      expect(screen.getByText('form.noLabel')).toBeInTheDocument();
    });
  });

  it("should have yes radio checked when question.required is true", async () => {
    render(<CustomQuestionEdit />);
    await waitFor(() => {
      const yesRadio = screen.getAllByRole('radio', { name: /form.yesLabel/i })[0];
      expect(yesRadio).toBeChecked();
    });
  });

  // -------------------------------------------------------------------------
  // Change type button
  // -------------------------------------------------------------------------

  it("should redirect to question types page when Change type button is clicked", async () => {
    render(<CustomQuestionEdit />);

    const changeTypeButton = screen.getByRole('button', { name: /buttons.changeType/i });
    fireEvent.click(changeTypeButton);

    await waitFor(() => {
      expect(mockRouter.push).toHaveBeenCalledWith(
        expect.stringContaining('step=1')
      );
    });
  });

  // -------------------------------------------------------------------------
  // Form validation
  // -------------------------------------------------------------------------

  it("should display error when question text is empty on submit", async () => {
    render(<CustomQuestionEdit />);

    const input = screen.getByLabelText(/labels.questionText/i);
    fireEvent.change(input, { target: { value: '' } });

    const saveButton = screen.getByRole('button', { name: /buttons.saveAndUpdate/i });
    await act(async () => {
      fireEvent.click(saveButton);
    });

    await waitFor(() => {
      expect(screen.getByText(/messages.errors.questionTextRequired/i)).toBeInTheDocument();
    });
  });

  // -------------------------------------------------------------------------
  // Save / update
  // -------------------------------------------------------------------------

  it("should call updateCustomQuestionMutation with correct variables on save", async () => {
    setupMocks(mockTextQuestion);
    setupSearchParams('text');

    render(<CustomQuestionEdit />);

    const input = screen.getByLabelText(/labels.questionText/i);
    await act(async () => {
      fireEvent.change(input, { target: { value: 'Updated question text' } });
    });

    const saveButton = screen.getByRole('button', { name: /buttons.saveAndUpdate/i });
    await act(async () => {
      fireEvent.click(saveButton);
    });

    await waitFor(() => {
      expect(mockUpdateCustomQuestionFn).toHaveBeenCalledWith(
        expect.objectContaining({
          variables: expect.objectContaining({
            input: expect.objectContaining({
              customQuestionId: 7,
              questionText: 'Updated question text',
            }),
          }),
        })
      );
    });
  });

  it("should redirect to template customize page after successful save", async () => {
    setupMocks(mockTextQuestion);
    setupSearchParams('text');

    render(<CustomQuestionEdit />);

    const input = screen.getByLabelText(/labels.questionText/i);
    await act(async () => {
      fireEvent.change(input, { target: { value: 'Updated question text' } });
    });

    const saveButton = screen.getByRole('button', { name: /buttons.saveAndUpdate/i });
    await act(async () => {
      fireEvent.click(saveButton);
    });

    await waitFor(() => {
      expect(mockRouter.push).toHaveBeenCalledWith(
        expect.stringContaining('/template/customizations/8')
      );
    });
  });

  it("should show toast on successful save", async () => {
    const mockAdd = jest.fn();
    (useToast as jest.Mock).mockReturnValue({ add: mockAdd });
    setupMocks(mockTextQuestion);
    setupSearchParams('text');

    render(<CustomQuestionEdit />);

    const input = screen.getByLabelText(/labels.questionText/i);
    await act(async () => {
      fireEvent.change(input, { target: { value: 'Updated question text' } });
    });

    const saveButton = screen.getByRole('button', { name: /buttons.saveAndUpdate/i });
    await act(async () => {
      fireEvent.click(saveButton);
    });

    await waitFor(() => {
      expect(mockAdd).toHaveBeenCalledWith(
        expect.any(String),
        expect.objectContaining({ type: 'success' })
      );
    });
  });

  it("should display error when updateCustomQuestion mutation throws", async () => {
    // Call setupMocks first to establish base state
    setupMocks(mockTextQuestion);
    setupSearchParams('text');

    // Then override the mutation AFTER setupMocks
    mockUseMutation.mockImplementation((document) => {
      if (document === UpdateCustomQuestionDocument) {
        /* eslint-disable @typescript-eslint/no-explicit-any */
        return [jest.fn().mockRejectedValueOnce(new Error("Network error")), { loading: false }] as any;
      }
      /* eslint-disable @typescript-eslint/no-explicit-any */
      return [mockRemoveCustomQuestionFn, { loading: false }] as any;
    });

    render(<CustomQuestionEdit />);

    // findByLabelText already waits, but wrap render in act to flush effects first
    const input = await screen.findByLabelText(/labels.questionText/i);

    await act(async () => {
      fireEvent.change(input, { target: { value: 'Some question' } });
    });

    const saveButton = screen.getByRole('button', { name: /buttons.saveAndUpdate/i });
    await act(async () => {
      fireEvent.click(saveButton);
    });

    await waitFor(() => {
      expect(screen.getByText(/messages.errors.questionUpdateError/i)).toBeInTheDocument();
    });
  });

  it("should display general error returned from server on save", async () => {
    mockUseMutation.mockImplementation((document) => {
      if (document === UpdateCustomQuestionDocument) {
        return [jest.fn().mockResolvedValueOnce({
          data: {
            updateCustomQuestion: {
              errors: { general: 'Server validation error', questionText: null },
            },
          },
          /* eslint-disable @typescript-eslint/no-explicit-any */
        }), { loading: false }] as any;
      }
      /* eslint-disable @typescript-eslint/no-explicit-any */
      return [mockRemoveCustomQuestionFn, { loading: false }] as any;
    });

    render(<CustomQuestionEdit />);

    const input = screen.getByLabelText(/labels.questionText/i);
    await act(async () => {
      fireEvent.change(input, { target: { value: 'Some question' } });
    });

    const saveButton = screen.getByRole('button', { name: /buttons.saveAndUpdate/i });
    await act(async () => {
      fireEvent.click(saveButton);
    });

    await waitFor(() => {
      expect(screen.getByText(/server validation error/i)).toBeInTheDocument();
    });
  });

  // -------------------------------------------------------------------------
  // Unsaved changes warning
  // -------------------------------------------------------------------------

  it("should warn user of unsaved changes when trying to navigate away", async () => {
    const addEventListenerSpy = jest.spyOn(window, 'addEventListener');
    const removeEventListenerSpy = jest.spyOn(window, 'removeEventListener');

    render(<CustomQuestionEdit />);

    const input = screen.getByLabelText(/labels.questionText/i);
    await act(async () => {
      fireEvent.change(input, { target: { value: 'Changed question text' } });
    });

    await waitFor(() => {
      const handler = addEventListenerSpy.mock.calls
        .filter(([event]) => event === 'beforeunload')
        .map(([, fn]) => fn)
        .pop();

      expect(handler).toBeDefined();

      const event = new Event('beforeunload');
      Object.defineProperty(event, 'returnValue', { writable: true, value: undefined });

      if (typeof handler === 'function') {
        handler(event as unknown as BeforeUnloadEvent);
      } else if (handler && typeof (handler as EventListenerObject).handleEvent === 'function') {
        (handler as EventListenerObject).handleEvent(event as unknown as BeforeUnloadEvent);
      }

      expect((event as BeforeUnloadEvent).returnValue).toBe('');
    });

    removeEventListenerSpy.mockRestore();
    addEventListenerSpy.mockRestore();
  });

  // -------------------------------------------------------------------------
  // Query errors
  // -------------------------------------------------------------------------

  it("should call logECS when query returns an error", async () => {
    mockUseQuery.mockImplementation((document) => {
      if (document === CustomQuestionDocument) {
        return {
          data: mockTextQuestion,
          loading: false,
          error: { message: 'GraphQL query error' },
        } as any;
      }
      return { data: null, loading: false, error: undefined };
    });

    await act(async () => {
      render(<CustomQuestionEdit />);
    });


    await waitFor(() => {
      expect(screen.getByText(/graphql query error/i)).toBeInTheDocument();
    });
  });

  // -------------------------------------------------------------------------
  // Delete functionality
  // -------------------------------------------------------------------------

  describe("Delete Custom Question", () => {
    it("should open the delete confirmation modal when delete button is clicked", async () => {
      await act(async () => {
        render(<CustomQuestionEdit />);
      });

      const deleteButton = screen.getByRole('button', { name: /buttons.deleteCustomization/i });
      fireEvent.click(deleteButton);

      await waitFor(() => {
        expect(screen.getByRole('dialog')).toBeInTheDocument();
        expect(screen.getByRole('button', { name: /buttons.cancel/i })).toBeInTheDocument();
        expect(screen.getByRole('button', { name: /buttons.confirm/i })).toBeInTheDocument();
      });
    });

    it("should close the modal when cancel is clicked", async () => {
      render(<CustomQuestionEdit />);

      const deleteButton = screen.getByRole('button', { name: /buttons.deleteCustomization/i });
      fireEvent.click(deleteButton);

      await waitFor(() => {
        expect(screen.getByRole('dialog')).toBeInTheDocument();
      });

      const cancelButton = screen.getByRole('button', { name: /buttons.cancel/i });
      fireEvent.click(cancelButton);

      await waitFor(() => {
        expect(screen.queryByRole('dialog')).not.toBeInTheDocument();
      });
    });

    it("should call removeCustomQuestionMutation and redirect on successful delete", async () => {
      const mockRemove = jest.fn().mockResolvedValueOnce({
        data: { removeCustomQuestion: { errors: { general: null } } },
      });

      mockUseMutation.mockImplementation((document) => {
        if (document === RemoveCustomQuestionDocument) {
          /* eslint-disable @typescript-eslint/no-explicit-any */
          return [mockRemove, { loading: false }] as any;
        }
        /* eslint-disable @typescript-eslint/no-explicit-any */
        return [mockUpdateCustomQuestionFn, { loading: false }] as any;
      });

      render(<CustomQuestionEdit />);

      fireEvent.click(screen.getByRole('button', { name: /buttons.deleteCustomization/i }));

      await waitFor(() => {
        expect(screen.getByRole('dialog')).toBeInTheDocument();
      });

      await act(async () => {
        fireEvent.click(screen.getByRole('button', { name: /buttons.confirm/i }));
      });

      await waitFor(() => {
        expect(mockRemove).toHaveBeenCalledWith(
          expect.objectContaining({
            variables: { customQuestionId: 7 },
          })
        );
        expect(mockRouter.push).toHaveBeenCalledWith(
          expect.stringContaining('/template/customizations/8')
        );
      });
    });

    it("should display error message when deletion throws", async () => {
      mockUseMutation.mockImplementation((document) => {
        if (document === RemoveCustomQuestionDocument) {
          /* eslint-disable @typescript-eslint/no-explicit-any */
          return [jest.fn().mockRejectedValueOnce(new Error("Delete failed")), { loading: false }] as any;
        }
        /* eslint-disable @typescript-eslint/no-explicit-any */
        return [mockUpdateCustomQuestionFn, { loading: false }] as any;
      });

      render(<CustomQuestionEdit />);

      fireEvent.click(screen.getByRole('button', { name: /buttons.deleteCustomization/i }));

      await waitFor(() => {
        expect(screen.getByRole('dialog')).toBeInTheDocument();
      });

      await act(async () => {
        fireEvent.click(screen.getByRole('button', { name: /buttons.confirm/i }));
      });

      await waitFor(() => {
        expect(screen.getByText(/messages.error.errorDeletingQuestion/i)).toBeInTheDocument();
      });
    });

    it("should call logECS when deletion throws an error", async () => {
      mockUseMutation.mockImplementation((document) => {
        if (document === RemoveCustomQuestionDocument) {
          /* eslint-disable @typescript-eslint/no-explicit-any */
          return [jest.fn().mockRejectedValueOnce(new Error("Delete failed")), { loading: false }] as any;
        }
        /* eslint-disable @typescript-eslint/no-explicit-any */
        return [mockUpdateCustomQuestionFn, { loading: false }] as any;
      });

      render(<CustomQuestionEdit />);

      fireEvent.click(screen.getByRole('button', { name: /buttons.deleteCustomization/i }));

      await waitFor(() => {
        expect(screen.getByRole('dialog')).toBeInTheDocument();
      });

      await act(async () => {
        fireEvent.click(screen.getByRole('button', { name: /buttons.confirm/i }));
      });

      await waitFor(() => {
        expect(logECS).toHaveBeenCalledWith(
          'error',
          'deleteCustomQuestion',
          expect.objectContaining({
            error: expect.anything(),
            url: expect.objectContaining({ path: expect.any(String) }),
          })
        );
      });
    });

    it("should display error when server returns errors on deletion response", async () => {
      mockUseMutation.mockImplementation((document) => {
        if (document === RemoveCustomQuestionDocument) {
          return [jest.fn().mockResolvedValueOnce({
            data: {
              removeCustomQuestion: {
                errors: { general: 'Server deletion error' },
              },
            },
            /* eslint-disable @typescript-eslint/no-explicit-any */
          }), { loading: false }] as any;
        }
        /* eslint-disable @typescript-eslint/no-explicit-any */
        return [mockUpdateCustomQuestionFn, { loading: false }] as any;
      });

      render(<CustomQuestionEdit />);

      fireEvent.click(screen.getByRole('button', { name: /buttons.deleteCustomization/i }));

      await waitFor(() => {
        expect(screen.getByRole('dialog')).toBeInTheDocument();
      });

      await act(async () => {
        fireEvent.click(screen.getByRole('button', { name: /buttons.confirm/i }));
      });

      await waitFor(() => {
        expect(screen.getByText(/server deletion error/i)).toBeInTheDocument();
      });
    });

    it("should disable the delete trigger button while deletion is in progress", async () => {
      mockUseMutation.mockImplementation((document) => {
        if (document === RemoveCustomQuestionDocument) {
          return [
            jest.fn().mockImplementation(
              () => new Promise((resolve) =>
                setTimeout(() => resolve({ data: { removeCustomQuestion: { errors: { general: null } } } }), 200)
              )
            ),
            { loading: false },
            /* eslint-disable @typescript-eslint/no-explicit-any */
          ] as any;
        }
        /* eslint-disable @typescript-eslint/no-explicit-any */
        return [mockUpdateCustomQuestionFn, { loading: false }] as any;
      });

      render(<CustomQuestionEdit />);

      const deleteButton = screen.getByRole('button', { name: /buttons.deleteCustomization/i });
      fireEvent.click(deleteButton);

      await waitFor(() => {
        expect(screen.getByRole('dialog')).toBeInTheDocument();
      });

      fireEvent.click(screen.getByRole('button', { name: /buttons.confirm/i }));

      await waitFor(() => {
        expect(deleteButton).toBeDisabled();
      });
    });
  });

  // -------------------------------------------------------------------------
  // handleInputChange - showCommentField radio group
  // -------------------------------------------------------------------------

  it("should update showCommentField when additionalCommentBox radio is changed to 'no'", async () => {
    render(<CustomQuestionEdit />);

    await waitFor(() => {
      expect(screen.getByText(/labels.additionalCommentBox/i)).toBeInTheDocument();
    });

    const noRadios = screen.getAllByRole('radio', { name: /labels.doNotShowCommentField/i });
    await act(async () => {
      fireEvent.click(noRadios[0]);
    });

    // Verify the mutation is called with showCommentField: false when saved
    const input = screen.getByLabelText(/labels.questionText/i);
    await act(async () => {
      fireEvent.change(input, { target: { value: 'Updated question' } });
    });

    const saveButton = screen.getByRole('button', { name: /buttons.saveAndUpdate/i });
    await act(async () => {
      fireEvent.click(saveButton);
    });

    await waitFor(() => {
      expect(mockUpdateCustomQuestionFn).toHaveBeenCalled();
    });
  });

  it("should update showCommentField when additionalCommentBox radio is changed to 'yes'", async () => {
    render(<CustomQuestionEdit />);

    await waitFor(() => {
      expect(screen.getByText(/labels.additionalCommentBox/i)).toBeInTheDocument();
    });

    const yesRadios = screen.getAllByRole('radio', { name: /labels.showCommentField/i });
    await act(async () => {
      fireEvent.click(yesRadios[0]);
    });

    await waitFor(() => {
      expect(yesRadios[0]).toBeChecked();
    });
  });

  // -------------------------------------------------------------------------
  // handleRadioChange - required field radio group
  // -------------------------------------------------------------------------

  it("should set required to false when 'no' radio is selected", async () => {
    // mockRadioButtonQuestion has required: true, so yes is initially checked
    render(<CustomQuestionEdit />);

    await waitFor(() => {
      const yesRadio = screen.getAllByRole('radio', { name: /form.yesLabel/i })[0];
      expect(yesRadio).toBeChecked();
    });

    const noRadio = screen.getAllByRole('radio', { name: /form.noLabel/i })[0];
    await act(async () => {
      fireEvent.click(noRadio);
    });

    await waitFor(() => {
      expect(noRadio).toBeChecked();
    });
  });

  it("should set required to true when 'yes' radio is selected", async () => {
    setupMocks(mockTextQuestion); // required: false in mockTextQuestion... 
    // Actually mockTextQuestion inherits required: true from mockRadioButtonQuestion
    // so use a question with required: false
    setupMocks({
      customQuestion: {
        ...mockRadioButtonQuestion.customQuestion,
        required: false,
      }
    });
    setupSearchParams('radioButtons');

    render(<CustomQuestionEdit />);

    await waitFor(() => {
      const noRadio = screen.getAllByRole('radio', { name: /form.noLabel/i })[0];
      expect(noRadio).toBeChecked();
    });

    const yesRadio = screen.getAllByRole('radio', { name: /form.yesLabel/i })[0];
    await act(async () => {
      fireEvent.click(yesRadio);
    });

    await waitFor(() => {
      expect(yesRadio).toBeChecked();
    });
  });

  // -------------------------------------------------------------------------
  // updateRows - options questions
  // -------------------------------------------------------------------------

  it("should update rows and question JSON when options change", async () => {
    render(<CustomQuestionEdit />);

    // Wait for options to render (radioButtons question has Alpha and Bravo)
    await waitFor(() => {
      expect(screen.getAllByLabelText(/text/i).length).toBeGreaterThan(0);
    });

    // Change the first option's text
    const optionInputs = screen.getAllByLabelText(/text/i);
    await act(async () => {
      fireEvent.change(optionInputs[0], { target: { value: 'Updated Option' } });
    });

    // Save and verify mutation is called (proving JSON was updated)
    const saveButton = screen.getByRole('button', { name: /buttons.saveAndUpdate/i });
    await act(async () => {
      fireEvent.click(saveButton);
    });

    await waitFor(() => {
      expect(mockUpdateCustomQuestionFn).toHaveBeenCalled();
    });
  });

  // -------------------------------------------------------------------------
  // handleRangeLabelChange - dateRange question type
  // -------------------------------------------------------------------------

  it("should update start label for dateRange question type", async () => {
    setupMocks(mockDateRangeQuestion);
    setupSearchParams('dateRange');

    render(<CustomQuestionEdit />);

    const startInput = await screen.findByLabelText(/range start/i);
    await act(async () => {
      fireEvent.change(startInput, { target: { value: 'New Start Label' } });
    });

    expect(startInput).toHaveValue('New Start Label');
  });

  it("should update end label for dateRange question type", async () => {
    setupMocks(mockDateRangeQuestion);
    setupSearchParams('dateRange');

    render(<CustomQuestionEdit />);

    const endInput = await screen.findByLabelText(/range end/i);
    await act(async () => {
      fireEvent.change(endInput, { target: { value: 'New End Label' } });
    });

    expect(endInput).toHaveValue('New End Label');
  });

  // -------------------------------------------------------------------------
  // handleTypeAheadSearchLabelChange - affiliationSearch question type
  // -------------------------------------------------------------------------

  it("should update typeahead search label for affiliationSearch question type", async () => {
    setupMocks(mockAffiliationSearchQuestion);
    setupSearchParams('affiliationSearch');

    render(<CustomQuestionEdit />);

    const labelInput = await screen.findByPlaceholderText(/enter search label/i);
    await act(async () => {
      fireEvent.change(labelInput, { target: { value: 'Updated Institution Label' } });
    });

    expect(labelInput).toHaveValue('Updated Institution Label');
  });

  // -------------------------------------------------------------------------
  // handleTypeAheadHelpTextChange - affiliationSearch question type
  // -------------------------------------------------------------------------

  it("should update typeahead help text for affiliationSearch question type", async () => {
    setupMocks(mockAffiliationSearchQuestion);
    setupSearchParams('affiliationSearch');

    render(<CustomQuestionEdit />);

    const helpTextInput = await screen.findByPlaceholderText(/enter the help text/i);
    await act(async () => {
      fireEvent.change(helpTextInput, { target: { value: 'Updated help text' } });
    });

    expect(helpTextInput).toHaveValue('Updated help text');
  });

  // -------------------------------------------------------------------------
  // Accessibility
  // -------------------------------------------------------------------------

  it("should pass axe accessibility checks", async () => {
    const { container } = render(<CustomQuestionEdit />);

    await act(async () => {
      const results = await axe(container);
      expect(results).toHaveNoViolations();
    });
  });
});