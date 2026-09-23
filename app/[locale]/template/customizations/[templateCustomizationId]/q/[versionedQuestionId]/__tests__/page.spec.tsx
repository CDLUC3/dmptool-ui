import React from "react";
import { act, fireEvent, render, screen, waitFor } from '@/utils/test-utils';
import { useQuery, useMutation } from '@apollo/client/react';
import {
  AddQuestionCustomizationDocument,
  UpdateQuestionCustomizationDocument,
  RemoveQuestionCustomizationDocument,
  QuestionCustomizationByVersionedQuestionDocument,
  PublishedQuestionDocument,
  MeDocument,
} from '@/generated/graphql';

import { axe, toHaveNoViolations } from 'jest-axe';
import { useParams } from 'next/navigation';
import { useRouter } from '@/i18n/routing';
import { useToast } from '@/context/ToastContext';
import logECS from '@/utils/clientLogger';
import QuestionCustomizePage from '../page';
import { mockScrollIntoView, mockScrollTo } from "@/__mocks__/common";

expect.extend(toHaveNoViolations);

jest.mock('next/navigation', () => ({
  useParams: jest.fn(),
}));

jest.mock('@/i18n/routing', () => ({
  Link: ({ href, children, ...props }: { href: string; children: React.ReactNode }) => (
    <a href={href} {...props}>{children}</a>
  ),
  useRouter: jest.fn(() => ({ push: jest.fn(), replace: jest.fn(), back: jest.fn() })),
  usePathname: jest.fn(() => '/template/customizations/1/q/1'),
}));

jest.mock('@apollo/client/react', () => ({
  useQuery: jest.fn(),
  useMutation: jest.fn(),
}));

jest.mock('@/context/ToastContext', () => ({
  useToast: jest.fn(() => ({ add: jest.fn() })),
}));

const mockUseQuery = jest.mocked(useQuery);
const mockUseMutation = jest.mocked(useMutation);
const mockUseRouter = useRouter as jest.Mock;

// ---------------------------------------------------------------------------
// Mock data
// ---------------------------------------------------------------------------

const mockPublishedQuestion = {
  publishedQuestion: {
    __typename: "PublishedQuestion",
    id: 101,
    displayOrder: 1,
    questionText: "<p>What data will you collect?</p>",
    requirementText: "<p>This is a requirement.</p>",
    guidanceText: "<p>Some base guidance here.</p>",
    sampleText: "<p>Sample answer text here.</p>",
    useSampleTextAsDefault: false,
    required: true,
    json: null,
    versionedTemplateId: 945,
    ownerAffiliation: {
      __typename: "Affiliation",
      acronyms: ["NIH"],
      displayName: "National Institutes of Health",
      uri: "https://ror.org/01cwqze88",
      name: "National Institutes of Health",
    },
  },
};

const mockPublishedQuestionNoOptionalFields = {
  publishedQuestion: {
    ...mockPublishedQuestion.publishedQuestion,
    requirementText: null,
    guidanceText: null,
    sampleText: null,
  },
};

const mockMeData = {
  me: {
    __typename: "User",
    affiliation: {
      __typename: "Affiliation",
      displayName: "Test University",
      name: "Test University",
    },
  },
};

const mockExistingCustomization = {
  questionCustomizationByVersionedQuestion: {
    __typename: "QuestionCustomization",
    id: 55,
    guidanceText: "<p>Existing guidance</p>",
    sampleText: "<p>Existing sample text</p>",
  },
};

const mockNoExistingCustomization = {
  questionCustomizationByVersionedQuestion: null
};

// ---------------------------------------------------------------------------
// Helpers
// ---------------------------------------------------------------------------

let mockAddCustomizationFn: jest.Mock;
let mockUpdateCustomizationFn: jest.Mock;
let mockRemoveCustomizationFn: jest.Mock;

const setupMocks = (
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  customizationData: { questionCustomizationByVersionedQuestion: any } = mockExistingCustomization,
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  publishedQuestionData: { publishedQuestion: any } = mockPublishedQuestion
) => {
  mockUseQuery.mockImplementation((document) => {
    if (document === PublishedQuestionDocument) {
      // eslint-disable-next-line @typescript-eslint/no-explicit-any
      return { data: publishedQuestionData, loading: false, error: undefined } as any;
    }
    if (document === MeDocument) {
      // eslint-disable-next-line @typescript-eslint/no-explicit-any
      return { data: mockMeData, loading: false, error: undefined } as any;
    }
    if (document === QuestionCustomizationByVersionedQuestionDocument) {
      // eslint-disable-next-line @typescript-eslint/no-explicit-any
      return { data: customizationData, loading: false, error: undefined } as any;
    }
    return { data: null, loading: false, error: undefined };
  });

  mockAddCustomizationFn = jest.fn().mockResolvedValue({
    data: { addQuestionCustomization: { id: 99, errors: null } },
  });

  mockUpdateCustomizationFn = jest.fn().mockResolvedValue({
    data: { updateQuestionCustomization: { errors: { general: null, guidanceText: null, sampleText: null } } },
  });

  mockRemoveCustomizationFn = jest.fn().mockResolvedValue({
    data: { removeQuestionCustomization: { errors: {} } },
  });

  mockUseMutation.mockImplementation((document) => {
    if (document === AddQuestionCustomizationDocument) {
      // eslint-disable-next-line @typescript-eslint/no-explicit-any
      return [mockAddCustomizationFn, { loading: false }] as any;
    }
    if (document === UpdateQuestionCustomizationDocument) {
      // eslint-disable-next-line @typescript-eslint/no-explicit-any
      return [mockUpdateCustomizationFn, { loading: false }] as any;
    }
    if (document === RemoveQuestionCustomizationDocument) {
      // eslint-disable-next-line @typescript-eslint/no-explicit-any
      return [mockRemoveCustomizationFn, { loading: false }] as any;
    }
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    return [jest.fn(), { loading: false }] as any;
  });
};

// ---------------------------------------------------------------------------
// Tests
// ---------------------------------------------------------------------------

describe("QuestionCustomizePage", () => {
  let mockRouter: { push: jest.Mock };

  beforeEach(() => {
    setupMocks();
    HTMLElement.prototype.scrollIntoView = mockScrollIntoView;
    mockScrollTo();

    (useParams as jest.Mock).mockReturnValue({
      templateCustomizationId: '8',
      versionedQuestionId: '101',
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

  describe("Rendering", () => {
    it("should render the page heading", () => {
      render(<QuestionCustomizePage />);
      expect(screen.getByRole('heading', { level: 1 })).toBeInTheDocument();
    });

    it("should render the save button", () => {
      render(<QuestionCustomizePage />);
      expect(screen.getByRole('button', { name: /buttons.saveAndUpdate/i })).toBeInTheDocument();
    });

    it("should render the delete customization danger zone", () => {
      render(<QuestionCustomizePage />);
      expect(screen.getByRole('button', { name: /buttons.deleteCustomization/i })).toBeInTheDocument();
    });

    it("should render the sidebar preview section", () => {
      render(<QuestionCustomizePage />);
      expect(screen.getByRole('heading', { name: /headings.preview/i })).toBeInTheDocument();
    });

    it("should show loading spinner while publishedQuestion query is in flight", async () => {
      mockUseQuery.mockImplementation((document) => {
        if (document === PublishedQuestionDocument) {
          // eslint-disable-next-line @typescript-eslint/no-explicit-any
          return { data: undefined, loading: true, error: undefined } as any;
        }
        return { data: null, loading: false, error: undefined };
      });

      render(<QuestionCustomizePage />);

      await waitFor(() => {
        expect(screen.queryByRole('heading', { level: 1 })).not.toBeInTheDocument();
      })
    });

    it("should render base question requirements when present", async () => {
      render(<QuestionCustomizePage />);
      await waitFor(() => {
        expect(screen.getByText(/labels.requirements/i)).toBeInTheDocument();
      });
    });

    it("should render base question guidance when present", async () => {
      render(<QuestionCustomizePage />);
      await waitFor(() => {
        expect(screen.getByText(/labels.guidance/i)).toBeInTheDocument();
      });
    });

    it("should render base question sample text section when present", async () => {
      render(<QuestionCustomizePage />);
      await waitFor(() => {
        expect(screen.getByText(/labels.sampleText/i)).toBeInTheDocument();
      });
    });

    it("should NOT render requirements section when requirementText is null", async () => {
      setupMocks(mockExistingCustomization, mockPublishedQuestionNoOptionalFields);
      render(<QuestionCustomizePage />);
      await waitFor(() => {
        expect(screen.queryByText(/labels.requirements/i)).not.toBeInTheDocument();
      });
    });

    it("should NOT render guidance section when guidanceText is null", async () => {
      setupMocks(mockExistingCustomization, mockPublishedQuestionNoOptionalFields);
      render(<QuestionCustomizePage />);
      await waitFor(() => {
        expect(screen.queryByText(/labels.guidance/i)).not.toBeInTheDocument();
      });
    });

    it("should NOT render sample text section when sampleText is null", async () => {
      setupMocks(mockExistingCustomization, mockPublishedQuestionNoOptionalFields);
      render(<QuestionCustomizePage />);
      await waitFor(() => {
        expect(screen.queryByText(/labels.sampleText/i)).not.toBeInTheDocument();
      });
    });
  });

  // -------------------------------------------------------------------------
  // Initialization — addQuestionCustomization vs loading existing
  // -------------------------------------------------------------------------

  describe("Initialization", () => {
    it("should call addQuestionCustomization when no existing customization is found", async () => {
      setupMocks(mockNoExistingCustomization);
      render(<QuestionCustomizePage />);

      await waitFor(() => {
        expect(mockAddCustomizationFn).toHaveBeenCalledWith(
          expect.objectContaining({
            variables: expect.objectContaining({
              input: expect.objectContaining({
                templateCustomizationId: 8,
                versionedQuestionId: 101,
              }),
            }),
          })
        );
      });
    });

    it("should NOT call addQuestionCustomization when an existing customization is found", async () => {
      render(<QuestionCustomizePage />);

      await waitFor(() => {
        expect(mockAddCustomizationFn).not.toHaveBeenCalled();
      });
    });

    it("should populate guidance text field with existing customization data", async () => {
      render(<QuestionCustomizePage />);

      await waitFor(() => {
        expect(screen.getByText(/labels.additionalGuidanceText/i)).toBeInTheDocument();
      });
    });
  });

  // -------------------------------------------------------------------------
  // Form submission
  // -------------------------------------------------------------------------

  describe("Form submission", () => {
    it("should call updateQuestionCustomization with correct variables on save", async () => {
      render(<QuestionCustomizePage />);

      const saveButton = screen.getByRole('button', { name: /buttons.saveAndUpdate/i });
      await act(async () => {
        fireEvent.click(saveButton);
      });

      await waitFor(() => {
        expect(mockUpdateCustomizationFn).toHaveBeenCalledWith(
          expect.objectContaining({
            variables: expect.objectContaining({
              input: expect.objectContaining({
                questionCustomizationId: 55,
              }),
            }),
          })
        );
      });
    });

    it("should redirect to template customization page after successful save", async () => {
      render(<QuestionCustomizePage />);

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

    it("should show a success toast after saving", async () => {
      const mockAdd = jest.fn();
      (useToast as jest.Mock).mockReturnValue({ add: mockAdd });

      render(<QuestionCustomizePage />);

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

    it("should show saving label while submitting", async () => {
      mockUseMutation.mockImplementation((document) => {
        if (document === UpdateQuestionCustomizationDocument) {
          return [
            jest.fn().mockImplementation(
              () => new Promise(resolve =>
                setTimeout(() => resolve({
                  data: { updateQuestionCustomization: { errors: { general: null } } }
                }), 200)
              )
            ),
            { loading: false },
            // eslint-disable-next-line @typescript-eslint/no-explicit-any
          ] as any;
        }
        // eslint-disable-next-line @typescript-eslint/no-explicit-any
        return [jest.fn(), { loading: false }] as any;
      });

      render(<QuestionCustomizePage />);

      fireEvent.click(screen.getByRole('button', { name: /buttons.saveAndUpdate/i }));

      await waitFor(() => {
        expect(screen.getByRole('button', { name: /buttons.saving/i })).toBeInTheDocument();
      });
    });

    it("should prevent double submission", async () => {
      mockUseMutation.mockImplementation((document) => {
        if (document === UpdateQuestionCustomizationDocument) {
          return [
            jest.fn().mockImplementation(
              () => new Promise(resolve =>
                setTimeout(() => resolve({
                  data: { updateQuestionCustomization: { errors: { general: null } } }
                }), 200)
              )
            ),
            { loading: false },
            // eslint-disable-next-line @typescript-eslint/no-explicit-any
          ] as any;
        }
        // eslint-disable-next-line @typescript-eslint/no-explicit-any
        return [jest.fn(), { loading: false }] as any;
      });

      render(<QuestionCustomizePage />);

      const saveButton = screen.getByRole('button', { name: /buttons.saveAndUpdate/i });
      fireEvent.click(saveButton);

      await waitFor(() => {
        expect(saveButton).toBeDisabled();
      });
    });

    it("should display error when updateQuestionCustomization mutation throws", async () => {
      setupMocks();
      mockUseMutation.mockImplementation((document) => {
        if (document === UpdateQuestionCustomizationDocument) {
          return [
            jest.fn().mockRejectedValueOnce(new Error("Network error")),
            { loading: false }
            // eslint-disable-next-line @typescript-eslint/no-explicit-any
          ] as any;
        }
        // eslint-disable-next-line @typescript-eslint/no-explicit-any
        return [jest.fn(), { loading: false }] as any;
      });

      render(<QuestionCustomizePage />);

      const saveButton = screen.getByRole('button', { name: /buttons.saveAndUpdate/i });
      await act(async () => {
        fireEvent.click(saveButton);
      });

      await waitFor(() => {
        expect(screen.getByText(/messages.error.errorUpdatingCustomization/i)).toBeInTheDocument();
      });
    });

    it("should call logECS when updateQuestionCustomization mutation throws", async () => {
      setupMocks();
      mockUseMutation.mockImplementation((document) => {
        if (document === UpdateQuestionCustomizationDocument) {
          return [
            jest.fn().mockRejectedValueOnce(new Error("Network error")),
            { loading: false }
            // eslint-disable-next-line @typescript-eslint/no-explicit-any
          ] as any;
        }
        // eslint-disable-next-line @typescript-eslint/no-explicit-any
        return [jest.fn(), { loading: false }] as any;
      });

      render(<QuestionCustomizePage />);

      await act(async () => {
        fireEvent.click(screen.getByRole('button', { name: /buttons.saveAndUpdate/i }));
      });

      await waitFor(() => {
        expect(logECS).toHaveBeenCalledWith(
          'error',
          'updateQuestionCustomization',
          expect.objectContaining({
            error: expect.anything(),
            url: expect.objectContaining({ path: expect.any(String) }),
          })
        );
      });
    });

    it("should display general error returned from server on save", async () => {
      setupMocks();
      mockUseMutation.mockImplementation((document) => {
        if (document === UpdateQuestionCustomizationDocument) {
          return [
            jest.fn().mockResolvedValueOnce({
              data: {
                updateQuestionCustomization: {
                  errors: { general: 'Server validation failed', guidanceText: null, sampleText: null },
                },
              },
            }),
            { loading: false },
            // eslint-disable-next-line @typescript-eslint/no-explicit-any
          ] as any;
        }
        // eslint-disable-next-line @typescript-eslint/no-explicit-any
        return [jest.fn(), { loading: false }] as any;
      });

      render(<QuestionCustomizePage />);

      await act(async () => {
        fireEvent.click(screen.getByRole('button', { name: /buttons.saveAndUpdate/i }));
      });

      await waitFor(() => {
        expect(screen.getByText(/server validation failed/i)).toBeInTheDocument();
      });
    });
  });

  // -------------------------------------------------------------------------
  // Delete customization
  // -------------------------------------------------------------------------

  describe("Delete customization", () => {
    it("should open the delete confirmation modal when delete button is clicked", async () => {
      render(<QuestionCustomizePage />);

      fireEvent.click(screen.getByRole('button', { name: /buttons.deleteCustomization/i }));

      await waitFor(() => {
        expect(screen.getByRole('dialog')).toBeInTheDocument();
        expect(screen.getByRole('button', { name: /buttons.cancel/i })).toBeInTheDocument();
        expect(screen.getByRole('button', { name: /buttons.delete/i })).toBeInTheDocument();
      });
    });

    it("should close the modal when cancel is clicked", async () => {
      render(<QuestionCustomizePage />);

      fireEvent.click(screen.getByRole('button', { name: /buttons.deleteCustomization/i }));

      await waitFor(() => {
        expect(screen.getByRole('dialog')).toBeInTheDocument();
      });

      fireEvent.click(screen.getByRole('button', { name: /buttons.cancel/i }));

      await waitFor(() => {
        expect(screen.queryByRole('dialog')).not.toBeInTheDocument();
      });
    });

    it("should call removeQuestionCustomization and redirect on successful delete", async () => {
      render(<QuestionCustomizePage />);

      fireEvent.click(screen.getByRole('button', { name: /buttons.deleteCustomization/i }));

      await waitFor(() => {
        expect(screen.getByRole('dialog')).toBeInTheDocument();
      });

      await act(async () => {
        fireEvent.click(screen.getByRole('button', { name: /buttons.delete/i }));
      });

      await waitFor(() => {
        expect(mockRemoveCustomizationFn).toHaveBeenCalledWith(
          expect.objectContaining({
            variables: { questionCustomizationId: 55 },
          })
        );
        expect(mockRouter.push).toHaveBeenCalledWith(
          expect.stringContaining('/template/customizations/8')
        );
      });
    });

    it("should show success toast after successful delete", async () => {
      const mockAdd = jest.fn();
      (useToast as jest.Mock).mockReturnValue({ add: mockAdd });

      render(<QuestionCustomizePage />);

      fireEvent.click(screen.getByRole('button', { name: /buttons.deleteCustomization/i }));
      await waitFor(() => expect(screen.getByRole('dialog')).toBeInTheDocument());

      await act(async () => {
        fireEvent.click(screen.getByRole('button', { name: /buttons.delete/i }));
      });

      await waitFor(() => {
        expect(mockAdd).toHaveBeenCalledWith(
          expect.any(String),
          expect.objectContaining({ type: 'success' })
        );
      });
    });

    it("should display error message when deletion throws", async () => {
      setupMocks();
      mockUseMutation.mockImplementation((document) => {
        if (document === RemoveQuestionCustomizationDocument) {
          return [
            jest.fn().mockRejectedValueOnce(new Error("Delete failed")),
            { loading: false }
            // eslint-disable-next-line @typescript-eslint/no-explicit-any
          ] as any;
        }
        // eslint-disable-next-line @typescript-eslint/no-explicit-any
        return [mockUpdateCustomizationFn, { loading: false }] as any;
      });

      render(<QuestionCustomizePage />);

      fireEvent.click(screen.getByRole('button', { name: /buttons.deleteCustomization/i }));
      await waitFor(() => expect(screen.getByRole('dialog')).toBeInTheDocument());

      await act(async () => {
        fireEvent.click(screen.getByRole('button', { name: /buttons.delete/i }));
      });

      await waitFor(() => {
        expect(screen.getByText(/messages.error.errorDeletingCustomization/i)).toBeInTheDocument();
      });
    });

    it("should call logECS when deletion throws an error", async () => {
      setupMocks();
      mockUseMutation.mockImplementation((document) => {
        if (document === RemoveQuestionCustomizationDocument) {
          return [
            jest.fn().mockRejectedValueOnce(new Error("Delete failed")),
            { loading: false }
            // eslint-disable-next-line @typescript-eslint/no-explicit-any
          ] as any;
        }
        // eslint-disable-next-line @typescript-eslint/no-explicit-any
        return [mockUpdateCustomizationFn, { loading: false }] as any;
      });

      render(<QuestionCustomizePage />);

      fireEvent.click(screen.getByRole('button', { name: /buttons.deleteCustomization/i }));
      await waitFor(() => expect(screen.getByRole('dialog')).toBeInTheDocument());

      await act(async () => {
        fireEvent.click(screen.getByRole('button', { name: /buttons.delete/i }));
      });

      await waitFor(() => {
        expect(logECS).toHaveBeenCalledWith(
          'error',
          'deleteQuestionCustomization',
          expect.objectContaining({
            error: expect.anything(),
            url: expect.objectContaining({ path: expect.any(String) }),
          })
        );
      });
    });

    it("should display error when server returns errors on deletion response", async () => {
      setupMocks();
      mockUseMutation.mockImplementation((document) => {
        if (document === RemoveQuestionCustomizationDocument) {
          return [
            jest.fn().mockResolvedValueOnce({
              data: {
                removeQuestionCustomization: {
                  errors: { general: 'Server deletion error' },
                },
              },
            }),
            { loading: false },
            // eslint-disable-next-line @typescript-eslint/no-explicit-any
          ] as any;
        }
        // eslint-disable-next-line @typescript-eslint/no-explicit-any
        return [mockUpdateCustomizationFn, { loading: false }] as any;
      });

      render(<QuestionCustomizePage />);

      fireEvent.click(screen.getByRole('button', { name: /buttons.deleteCustomization/i }));
      await waitFor(() => expect(screen.getByRole('dialog')).toBeInTheDocument());

      await act(async () => {
        fireEvent.click(screen.getByRole('button', { name: /buttons.delete/i }));
      });

      await waitFor(() => {
        expect(screen.getByText(/server deletion error/i)).toBeInTheDocument();
      });
    });

    it("should disable the delete trigger button while deletion is in progress", async () => {
      setupMocks();
      mockUseMutation.mockImplementation((document) => {
        if (document === RemoveQuestionCustomizationDocument) {
          return [
            jest.fn().mockImplementation(
              () => new Promise(resolve =>
                setTimeout(() => resolve({
                  data: { removeQuestionCustomization: { errors: {} } }
                }), 200)
              )
            ),
            { loading: false },
            // eslint-disable-next-line @typescript-eslint/no-explicit-any
          ] as any;
        }
        // eslint-disable-next-line @typescript-eslint/no-explicit-any
        return [mockUpdateCustomizationFn, { loading: false }] as any;
      });

      render(<QuestionCustomizePage />);

      const deleteButton = screen.getByRole('button', { name: /buttons.deleteCustomization/i });
      fireEvent.click(deleteButton);

      await waitFor(() => expect(screen.getByRole('dialog')).toBeInTheDocument());

      fireEvent.click(screen.getByRole('button', { name: /buttons.delete/i }));

      await waitFor(() => {
        expect(deleteButton).toBeDisabled();
      });
    });

    it("should not call removeQuestionCustomization again if deletion already in progress", async () => {
      const mockRemove = jest.fn().mockImplementation(
        () => new Promise(resolve =>
          setTimeout(() => resolve({ data: { removeQuestionCustomization: { errors: {} } } }), 200)
        )
      );

      setupMocks();
      mockUseMutation.mockImplementation((document) => {
        if (document === RemoveQuestionCustomizationDocument) {
          // eslint-disable-next-line @typescript-eslint/no-explicit-any
          return [mockRemove, { loading: false }] as any;
        }
        // eslint-disable-next-line @typescript-eslint/no-explicit-any
        return [mockUpdateCustomizationFn, { loading: false }] as any;
      });

      render(<QuestionCustomizePage />);

      const triggerButton = screen.getByRole('button', { name: /buttons.deleteCustomization/i });

      // First deletion attempt
      fireEvent.click(triggerButton);
      await waitFor(() => expect(screen.getByRole('dialog')).toBeInTheDocument());
      fireEvent.click(screen.getByRole('button', { name: /buttons.delete/i }));

      // Trigger button is now disabled — modal cannot be reopened for a second attempt
      await waitFor(() => {
        expect(triggerButton).toBeDisabled();
      });

      // Confirm only one deletion call was made
      expect(mockRemove).toHaveBeenCalledTimes(1);
    });
  });

  // -------------------------------------------------------------------------
  // Unsaved changes warning
  // -------------------------------------------------------------------------

  describe("Unsaved changes warning", () => {
    it("should warn user when trying to navigate away with unsaved changes", async () => {
      const addEventListenerSpy = jest.spyOn(window, 'addEventListener');
      const removeEventListenerSpy = jest.spyOn(window, 'removeEventListener');

      render(<QuestionCustomizePage />);

      // Trigger a change to set hasUnsavedChanges
      await waitFor(() => {
        expect(screen.getByText(/labels.additionalGuidanceText/i)).toBeInTheDocument();
      });

      // Find the guidance textarea and change it - this calls updateCustomQuestionContent
      // which sets hasUnsavedChanges: true
      const guidanceTextarea = screen.getByLabelText(/labels.additionalGuidanceText/i);
      await act(async () => {
        fireEvent.change(guidanceTextarea, { target: { value: 'New guidance text' } });
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

        expect((event as BeforeUnloadEvent).returnValue).toBe(undefined);
      });

      removeEventListenerSpy.mockRestore();
      addEventListenerSpy.mockRestore();
    });
  });

  // -------------------------------------------------------------------------
  // Accessibility
  // -------------------------------------------------------------------------

  describe("Accessibility", () => {
    it("should pass axe accessibility checks", async () => {
      const { container } = render(<QuestionCustomizePage />);

      await act(async () => {
        const results = await axe(container);
        expect(results).toHaveNoViolations();
      });
    });
  });
});