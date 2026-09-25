import React from "react";
import { act, fireEvent, render, screen, waitFor } from '@/utils/test-utils';
import { useQuery, useMutation } from '@apollo/client/react';
import {
  CustomSectionDocument,
  UpdateCustomSectionDocument,
  RemoveCustomSectionDocument,
} from '@/generated/graphql';

import { axe, toHaveNoViolations } from 'jest-axe';
import { useParams } from 'next/navigation';
import { useRouter } from '@/i18n/routing';
import logECS from '@/utils/clientLogger';
import CustomSectionEdit from '../page';
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
  usePathname: jest.fn(() => '/template/customizations/1/customSection/1'),
}));

// Mock Apollo Client hooks
jest.mock('@apollo/client/react', () => ({
  useQuery: jest.fn(),
  useMutation: jest.fn(),
}));

// Cast with jest.mocked utility
const mockUseQuery = jest.mocked(useQuery);
const mockUseMutation = jest.mocked(useMutation);
const mockUseRouter = useRouter as jest.Mock;

const mockCustomSectionData = {
  customSection: {
    __typename: "CustomSection",
    errors: {
      __typename: "CustomSectionErrors",
      general: null,
      guidance: null,
      introduction: null,
      name: null,
      requirements: null,
    },
    guidance: "<p>Test guidance content</p>",
    id: 12,
    introduction: "<p>Test introduction content</p>",
    migrationStatus: "OK",
    modified: "2026-03-04 00:01:16",
    name: "Test Section Name",
    pinnedSectionId: 5390,
    pinnedSectionType: "CUSTOM",
    requirements: "<p>Test requirements content</p>",
    templateCustomizationId: 16,
  },
};

let mockUpdateCustomSectionFn: jest.Mock;
let mockRemoveCustomSectionFn: jest.Mock;

const setupMocks = () => {
  const stableCustomSectionReturn = {
    data: mockCustomSectionData,
    loading: false,
    error: null,
  };

  mockUseQuery.mockImplementation((document) => {
    if (document === CustomSectionDocument) {
      /*eslint-disable @typescript-eslint/no-explicit-any */
      return stableCustomSectionReturn as any;
    }
    return { data: null, loading: false, error: undefined };
  });

  mockUpdateCustomSectionFn = jest.fn().mockResolvedValue({
    data: { updateCustomSection: { errors: null } },
  });

  mockRemoveCustomSectionFn = jest.fn().mockResolvedValue({
    data: { removeCustomSection: { id: 12 } },
  });

  mockUseMutation.mockImplementation((document) => {
    if (document === UpdateCustomSectionDocument) {
      /*eslint-disable @typescript-eslint/no-explicit-any */
      return [mockUpdateCustomSectionFn, { loading: false, error: undefined }] as any;
    }
    if (document === RemoveCustomSectionDocument) {
      /*eslint-disable @typescript-eslint/no-explicit-any */
      return [mockRemoveCustomSectionFn, { loading: false, error: undefined }] as any;
    }
    /*eslint-disable @typescript-eslint/no-explicit-any */
    return [jest.fn(), { loading: false, error: undefined }] as any;
  });
};

describe("CustomSectionEdit", () => {
  beforeEach(() => {
    setupMocks();
    HTMLElement.prototype.scrollIntoView = mockScrollIntoView;
    mockScrollTo();

    const mockUseParams = useParams as jest.Mock;
    mockUseParams.mockReturnValue({
      templateCustomizationId: '16',
      customSectionId: '12',
    });

    mockUseRouter.mockReturnValue({
      push: jest.fn(),
    });

    window.tinymce = {
      init: jest.fn(),
      remove: jest.fn(),
    };
  });

  afterEach(() => {
    jest.clearAllMocks();
  });


  it("should render all expected fields and tabs", async () => {
    render(<CustomSectionEdit />);

    // Page heading
    const heading = screen.getByRole('heading', { level: 1 });
    expect(heading).toBeInTheDocument();

    // Tabs
    expect(screen.getByRole('tab', { name: /tabs.editSection/i })).toBeInTheDocument();
    expect(screen.getByRole('tab', { name: /tabs.options/i })).toBeInTheDocument();
    expect(screen.getByRole('tab', { name: /tabs.logic/i })).toBeInTheDocument();

    // Form fields
    expect(screen.getByLabelText(/labels.sectionName/i)).toBeInTheDocument();
    expect(screen.getByLabelText(/sectionIntroduction/i)).toBeInTheDocument();
    expect(screen.getByLabelText(/sectionRequirements/i)).toBeInTheDocument();
    expect(screen.getByLabelText(/sectionGuidance/i)).toBeInTheDocument();

    // Help text
    expect(screen.getByText('helpText.sectionIntroduction')).toBeInTheDocument();
    expect(screen.getByText('helpText.sectionRequirements')).toBeInTheDocument();
    expect(screen.getByText('helpText.sectionGuidance')).toBeInTheDocument();

    // Save button
    expect(screen.getByRole('button', { name: /buttons.saveAndUpdate/i })).toBeInTheDocument();
  });

  it("should show loading state while query is in flight", async () => {
    /*eslint-disable @typescript-eslint/no-explicit-any */
    mockUseQuery.mockReturnValue({ data: undefined, loading: true, error: undefined } as any);

    render(<CustomSectionEdit />);

    // Loading component should be rendered and form fields should not
    expect(screen.queryByLabelText(/labels.sectionName/i)).not.toBeInTheDocument();
  });

  it("should populate form fields with data from query", async () => {
    render(<CustomSectionEdit />);

    const sectionNameInput = screen.getByLabelText(/labels.sectionName/i) as HTMLInputElement;
    expect(sectionNameInput.value).toBe('Test Section Name');
  });


  it("should display a validation error when section name is empty on submit", async () => {
    // Return a section with an empty name so the field starts empty
    mockUseQuery.mockReturnValue({
      data: {
        customSection: { ...mockCustomSectionData.customSection, name: '' },
      },
      loading: false,
      error: null,
      /*eslint-disable @typescript-eslint/no-explicit-any */
    } as any);

    render(<CustomSectionEdit />);

    const saveButton = screen.getByRole('button', { name: /buttons.saveAndUpdate/i });
    await act(async () => {
      fireEvent.click(saveButton);
    });

    await waitFor(() => {
      expect(screen.getByText(/messages.fieldLengthValidation/i)).toBeInTheDocument();
    });
  });

  it("should display a validation error when section name is too short (≤ 2 chars)", async () => {
    render(<CustomSectionEdit />);

    const sectionNameInput = screen.getByLabelText(/labels.sectionName/i);
    await act(async () => {
      fireEvent.change(sectionNameInput, { target: { value: 'AB' } });
    });

    const saveButton = screen.getByRole('button', { name: /buttons.saveAndUpdate/i });
    await act(async () => {
      fireEvent.click(saveButton);
    });

    await waitFor(() => {
      expect(screen.getByText(/messages.fieldLengthValidation/i)).toBeInTheDocument();
    });
  });

  it("should call updateCustomSectionMutation with correct variables on save", async () => {
    const mockUpdateCustomSection = jest.fn().mockResolvedValueOnce({
      data: { updateCustomSection: { errors: null } },
    });

    mockUseMutation.mockImplementation((document) => {
      if (document === UpdateCustomSectionDocument) {
        /*eslint-disable @typescript-eslint/no-explicit-any */
        return [mockUpdateCustomSection, { loading: false, error: undefined }] as any;
      }
      /*eslint-disable @typescript-eslint/no-explicit-any */
      return [jest.fn(), { loading: false, error: undefined }] as any;
    });

    render(<CustomSectionEdit />);

    const sectionNameInput = screen.getByLabelText(/labels.sectionName/i);
    await act(async () => {
      fireEvent.change(sectionNameInput, { target: { value: 'Updated Section Name' } });
    });

    const saveButton = screen.getByRole('button', { name: /buttons.saveAndUpdate/i });
    await act(async () => {
      fireEvent.click(saveButton);
    });

    await waitFor(() => {
      expect(mockUpdateCustomSection).toHaveBeenCalledWith(
        expect.objectContaining({
          variables: expect.objectContaining({
            input: expect.objectContaining({
              customSectionId: 12,
              name: 'Updated Section Name',
            }),
          }),
        })
      );
    });
  });

  it("should redirect to template customize page after a successful save", async () => {
    render(<CustomSectionEdit />);

    const sectionNameInput = screen.getByLabelText(/labels.sectionName/i);
    await act(async () => {
      fireEvent.change(sectionNameInput, { target: { value: 'Updated Section Name' } });
    });

    const saveButton = screen.getByRole('button', { name: /buttons.saveAndUpdate/i });
    await act(async () => {
      fireEvent.click(saveButton);
    });

    await waitFor(() => {
      expect(mockUseRouter().push).toHaveBeenCalledWith(
        expect.stringContaining('/template/customizations/16')
      );
    });
  });


  it("should display error message when updateCustomSection throws", async () => {
    const mockUpdateCustomSection = jest.fn().mockRejectedValueOnce(new Error("Network error"));

    mockUseMutation.mockImplementation((document) => {
      if (document === UpdateCustomSectionDocument) {
        /*eslint-disable @typescript-eslint/no-explicit-any */
        return [mockUpdateCustomSection, { loading: false, error: undefined }] as any;
      }
      /*eslint-disable @typescript-eslint/no-explicit-any */
      return [jest.fn(), { loading: false, error: undefined }] as any;
    });

    render(<CustomSectionEdit />);

    const sectionNameInput = screen.getByLabelText(/labels.sectionName/i);
    await act(async () => {
      fireEvent.change(sectionNameInput, { target: { value: 'Valid Section Name' } });
    });

    const saveButton = screen.getByRole('button', { name: /buttons.saveAndUpdate/i });
    await act(async () => {
      fireEvent.click(saveButton);
    });

    await waitFor(() => {
      expect(screen.getByText(/messages.errorUpdatingSection/i)).toBeInTheDocument();
    });
  });

  it("should call logECS when updateCustomSection throws an error", async () => {
    const mockUpdateCustomSection = jest.fn().mockRejectedValueOnce(new Error("Network error"));

    mockUseMutation.mockImplementation((document) => {
      if (document === UpdateCustomSectionDocument) {
        /*eslint-disable @typescript-eslint/no-explicit-any */
        return [mockUpdateCustomSection, { loading: false, error: undefined }] as any;
      }
      /*eslint-disable @typescript-eslint/no-explicit-any */
      return [jest.fn(), { loading: false, error: undefined }] as any;
    });

    render(<CustomSectionEdit />);

    const sectionNameInput = screen.getByLabelText(/labels.sectionName/i);
    await act(async () => {
      fireEvent.change(sectionNameInput, { target: { value: 'Valid Section Name' } });
    });

    const saveButton = screen.getByRole('button', { name: /buttons.saveAndUpdate/i });
    await act(async () => {
      fireEvent.click(saveButton);
    });

    await waitFor(() => {
      expect(logECS).toHaveBeenCalledWith(
        'error',
        'updateSection',
        expect.objectContaining({
          error: expect.anything(),
          url: expect.objectContaining({ path: expect.any(String) }),
        })
      );
    });
  });

  it("should display field-level errors returned from the server", async () => {
    const mockUpdateCustomSection = jest.fn().mockResolvedValueOnce({
      data: {
        updateCustomSection: {
          errors: { general: 'General server error', name: 'Name is invalid' },
        },
      },
    });

    mockUseMutation.mockImplementation((document) => {
      if (document === UpdateCustomSectionDocument) {
        /*eslint-disable @typescript-eslint/no-explicit-any */
        return [mockUpdateCustomSection, { loading: false, error: undefined }] as any;
      }
      /*eslint-disable @typescript-eslint/no-explicit-any */
      return [jest.fn(), { loading: false, error: undefined }] as any;
    });

    render(<CustomSectionEdit />);

    const sectionNameInput = screen.getByLabelText(/labels.sectionName/i);
    await act(async () => {
      fireEvent.change(sectionNameInput, { target: { value: 'Valid Section Name' } });
    });

    const saveButton = screen.getByRole('button', { name: /buttons.saveAndUpdate/i });
    await act(async () => {
      fireEvent.click(saveButton);
    });

    await waitFor(() => {
      expect(screen.getByText(/general server error/i)).toBeInTheDocument();
    });
  });

  it("should warn user of unsaved changes when trying to navigate away", async () => {
    const addEventListenerSpy = jest.spyOn(window, 'addEventListener');
    const removeEventListenerSpy = jest.spyOn(window, 'removeEventListener');

    render(<CustomSectionEdit />);

    const sectionNameInput = screen.getByLabelText(/labels.sectionName/i);
    await act(async () => {
      fireEvent.change(sectionNameInput, { target: { value: 'Changed Name' } });
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

  describe("Delete Custom Section", () => {
    it("should render the danger zone with a delete button", async () => {
      render(<CustomSectionEdit />);

      expect(screen.getByText(/heading.deleteCustomSection/i)).toBeInTheDocument();
      expect(screen.getByRole('button', { name: /buttons.deleteCustomization/i })).toBeInTheDocument();
    });

    it("should open the delete confirmation modal when delete button is clicked", async () => {
      await act(async () => {
        render(<CustomSectionEdit />);
      });

      const deleteButton = screen.getByRole('button', { name: /buttons.deleteCustomization/i });
      fireEvent.click(deleteButton);

      await waitFor(() => {
        expect(screen.getByRole('dialog')).toBeInTheDocument();
        expect(screen.getByRole('button', { name: /buttons.cancel/i })).toBeInTheDocument();
        expect(screen.getByRole('button', { name: /buttons.delete/i })).toBeInTheDocument();
      });
    });

    it("should close the modal when cancel is clicked", async () => {
      render(<CustomSectionEdit />);

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

    it("should call removeCustomSectionMutation and redirect on successful delete", async () => {
      const mockRemoveCustomSection = jest.fn().mockResolvedValueOnce({
        data: { removeCustomSection: { id: 12 } },
      });

      mockUseMutation.mockImplementation((document) => {
        if (document === RemoveCustomSectionDocument) {
          /*eslint-disable @typescript-eslint/no-explicit-any */
          return [mockRemoveCustomSection, { loading: false, error: undefined }] as any;
        }
        /*eslint-disable @typescript-eslint/no-explicit-any */
        return [jest.fn(), { loading: false, error: undefined }] as any;
      });

      render(<CustomSectionEdit />);

      const deleteButton = screen.getByRole('button', { name: /buttons.deleteCustomization/i });
      fireEvent.click(deleteButton);

      await waitFor(() => {
        expect(screen.getByRole('dialog')).toBeInTheDocument();
      });

      const confirmDeleteButton = screen.getByRole('button', { name: /buttons.delete/i });
      await act(async () => {
        fireEvent.click(confirmDeleteButton);
      });

      await waitFor(() => {
        expect(mockRemoveCustomSection).toHaveBeenCalledWith(
          expect.objectContaining({
            variables: { customSectionId: 12 },
          })
        );
        expect(mockUseRouter().push).toHaveBeenCalledWith(
          expect.stringContaining('/template/customizations/16')
        );
      });
    });

    it("should display an error message when deletion fails", async () => {
      const mockRemoveCustomSection = jest.fn().mockRejectedValueOnce(new Error("Delete failed"));

      mockUseMutation.mockImplementation((document) => {
        if (document === RemoveCustomSectionDocument) {
          /*eslint-disable @typescript-eslint/no-explicit-any */
          return [mockRemoveCustomSection, { loading: false, error: undefined }] as any;
        }
        /*eslint-disable @typescript-eslint/no-explicit-any */
        return [jest.fn(), { loading: false, error: undefined }] as any;
      });

      render(<CustomSectionEdit />);

      const deleteButton = screen.getByRole('button', { name: /buttons.deleteCustomization/i });
      fireEvent.click(deleteButton);

      await waitFor(() => {
        expect(screen.getByRole('dialog')).toBeInTheDocument();
      });

      const confirmDeleteButton = screen.getByRole('button', { name: /buttons.delete/i });
      await act(async () => {
        fireEvent.click(confirmDeleteButton);
      });

      await waitFor(() => {
        expect(screen.getByText(/messages.errorDeletingSection/i)).toBeInTheDocument();
      });
    });

    it("should call logECS when deletion throws an error", async () => {
      const mockRemoveCustomSection = jest.fn().mockRejectedValueOnce(new Error("Delete failed"));

      mockUseMutation.mockImplementation((document) => {
        if (document === RemoveCustomSectionDocument) {
          /*eslint-disable @typescript-eslint/no-explicit-any */
          return [mockRemoveCustomSection, { loading: false, error: undefined }] as any;
        }
        /*eslint-disable @typescript-eslint/no-explicit-any */
        return [jest.fn(), { loading: false, error: undefined }] as any;
      });

      render(<CustomSectionEdit />);

      const deleteButton = screen.getByRole('button', { name: /buttons.deleteCustomization/i });
      fireEvent.click(deleteButton);

      await waitFor(() => {
        expect(screen.getByRole('dialog')).toBeInTheDocument();
      });

      const confirmDeleteButton = screen.getByRole('button', { name: /buttons.delete/i });
      await act(async () => {
        fireEvent.click(confirmDeleteButton);
      });

      await waitFor(() => {
        expect(logECS).toHaveBeenCalledWith(
          'error',
          'deleteSection',
          expect.objectContaining({
            error: expect.anything(),
            url: expect.objectContaining({ path: expect.any(String) }),
          })
        );
      });
    });

    it("should disable delete button while deletion is in progress", async () => {
      const mockRemoveCustomSection = jest.fn().mockImplementation(
        () => new Promise((resolve) => setTimeout(() => resolve({ data: { removeCustomSection: { id: 12 } } }), 100))
      );

      mockUseMutation.mockImplementation((document) => {
        if (document === RemoveCustomSectionDocument) {
          /*eslint-disable @typescript-eslint/no-explicit-any */
          return [mockRemoveCustomSection, { loading: false, error: undefined }] as any;
        }
        /*eslint-disable @typescript-eslint/no-explicit-any */
        return [jest.fn(), { loading: false, error: undefined }] as any;
      });

      render(<CustomSectionEdit />);

      const deleteButton = screen.getByRole('button', { name: /buttons.deleteCustomization/i });
      fireEvent.click(deleteButton);

      await waitFor(() => {
        expect(screen.getByRole('dialog')).toBeInTheDocument();
      });

      const confirmDeleteButton = screen.getByRole('button', { name: /buttons.delete/i });
      fireEvent.click(confirmDeleteButton);

      await waitFor(() => {
        expect(deleteButton).toBeDisabled();
      });
    });

    it("should show error when server returns errors on deletion response", async () => {
      const mockRemoveCustomSection = jest.fn().mockResolvedValueOnce({
        data: {
          removeCustomSection: {
            errors: { general: 'Server deletion error' },
          },
        },
      });

      mockUseMutation.mockImplementation((document) => {
        if (document === RemoveCustomSectionDocument) {
          /*eslint-disable @typescript-eslint/no-explicit-any */
          return [mockRemoveCustomSection, { loading: false, error: undefined }] as any;
        }
        /*eslint-disable @typescript-eslint/no-explicit-any */
        return [jest.fn(), { loading: false, error: undefined }] as any;
      });

      render(<CustomSectionEdit />);

      const deleteButton = screen.getByRole('button', { name: /buttons.deleteCustomization/i });
      fireEvent.click(deleteButton);

      await waitFor(() => {
        expect(screen.getByRole('dialog')).toBeInTheDocument();
      });

      const confirmDeleteButton = screen.getByRole('button', { name: /buttons.delete/i });
      await act(async () => {
        fireEvent.click(confirmDeleteButton);
      });

      await waitFor(() => {
        expect(screen.getByText(/server deletion error/i)).toBeInTheDocument();
      });
    });
  });

  it("should pass axe accessibility checks", async () => {
    const { container } = render(<CustomSectionEdit />);

    // Click options tab to render its h2
    const optionsTab = screen.getByRole('tab', { name: /tabs.options/i });
    fireEvent.click(optionsTab);

    await act(async () => {
      const results = await axe(container);
      expect(results).toHaveNoViolations();
    });
  });
});