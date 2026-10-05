import React from "react";
import { act, fireEvent, render, screen, waitFor } from '@/utils/test-utils';
import { useQuery, useMutation } from '@apollo/client/react';
import {
  AddCustomSectionDocument,
  TemplateCustomizationOverviewDocument,
} from '@/generated/graphql';

import { axe, toHaveNoViolations } from 'jest-axe';
import { useParams } from 'next/navigation';
import { useRouter } from '@/i18n/routing';
import logECS from '@/utils/clientLogger';
import CreateCustomSectionPage from '../page';
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
  usePathname: jest.fn(() => '/template/customizations/1/section/create'),
}));

jest.mock('@apollo/client/react', () => ({
  useQuery: jest.fn(),
  useMutation: jest.fn(),
}));

const mockUseQuery = jest.mocked(useQuery);
const mockUseMutation = jest.mocked(useMutation);
const mockUseRouter = useRouter as jest.Mock;

const mockTemplateOverviewData = {
  templateCustomizationOverview: {
    sections: [
      { id: 10, displayOrder: 1 },
      { id: 20, displayOrder: 2 },
      { id: 30, displayOrder: 3 },
    ],
  },
};

let mockAddCustomSectionFn: jest.Mock;

const setupMocks = () => {
  mockUseQuery.mockImplementation((document) => {
    if (document === TemplateCustomizationOverviewDocument) {
      /*eslint-disable @typescript-eslint/no-explicit-any */
      return { data: mockTemplateOverviewData, loading: false, error: null } as any;
    }
    return { data: null, loading: false, error: undefined };
  });

  mockAddCustomSectionFn = jest.fn().mockResolvedValue({
    data: { addCustomSection: { id: 99, errors: null } },
  });

  mockUseMutation.mockImplementation((document) => {
    if (document === AddCustomSectionDocument) {
      /*eslint-disable @typescript-eslint/no-explicit-any */
      return [mockAddCustomSectionFn, { loading: false, error: undefined }] as any;
    }
    /*eslint-disable @typescript-eslint/no-explicit-any */
    return [jest.fn(), { loading: false, error: undefined }] as any;
  });
};

describe("CreateCustomSectionPage", () => {
  beforeEach(() => {
    setupMocks();
    HTMLElement.prototype.scrollIntoView = mockScrollIntoView;
    mockScrollTo();

    (useParams as jest.Mock).mockReturnValue({ templateCustomizationId: '16' });
    mockUseRouter.mockReturnValue({ push: jest.fn() });

    window.tinymce = {
      init: jest.fn(),
      remove: jest.fn(),
    };
  });

  afterEach(() => {
    jest.clearAllMocks();
  });

  describe("Rendering", () => {
    it("should render all expected fields and tabs", async () => {
      render(<CreateCustomSectionPage />);

      expect(screen.getByRole('heading', { level: 1 })).toBeInTheDocument();

      expect(screen.getByRole('tab', { name: /tabs.editSection/i })).toBeInTheDocument();
      expect(screen.getByRole('tab', { name: /tabs.options/i })).toBeInTheDocument();
      expect(screen.getByRole('tab', { name: /tabs.logic/i })).toBeInTheDocument();

      expect(screen.getByLabelText(/labels.sectionName/i)).toBeInTheDocument();
      expect(screen.getByLabelText(/sectionIntroduction/i)).toBeInTheDocument();
      expect(screen.getByLabelText(/sectionRequirements/i)).toBeInTheDocument();
      expect(screen.getByLabelText(/sectionGuidance/i)).toBeInTheDocument();

      expect(screen.getByText('helpText.sectionIntroduction')).toBeInTheDocument();
      expect(screen.getByText('helpText.sectionRequirements')).toBeInTheDocument();
      expect(screen.getByText('helpText.sectionGuidance')).toBeInTheDocument();

      expect(screen.getByRole('button', { name: /button.createSection/i })).toBeInTheDocument();
    });

    it("should render options and logic tab panel headings when tabs are clicked", () => {
      render(<CreateCustomSectionPage />);

      fireEvent.click(screen.getByRole('tab', { name: /tabs.options/i }));
      expect(screen.getByRole('heading', { name: /tabs.options/i })).toBeInTheDocument();

      fireEvent.click(screen.getByRole('tab', { name: /tabs.logic/i }));
      expect(screen.getByRole('heading', { name: /tabs.logic/i })).toBeInTheDocument();
    });

    it("should show a loading state while template data is loading", () => {
      mockUseQuery.mockImplementation((document) => {
        if (document === TemplateCustomizationOverviewDocument) {
          return { data: undefined, loading: true, error: null } as any;
        }
        return { data: null, loading: false, error: undefined };
      });

      render(<CreateCustomSectionPage />);

      expect(screen.queryByRole('heading', { level: 1 })).not.toBeInTheDocument();
    });
  });

  describe("Validation", () => {
    it("should display a validation error when section name is empty on submit", async () => {
      render(<CreateCustomSectionPage />);

      await act(async () => {
        fireEvent.click(screen.getByRole('button', { name: /button.createSection/i }));
      });

      await waitFor(() => {
        expect(screen.getByRole('alert')).toHaveTextContent('messages.fieldLengthValidation');
      });
    });

    it("should display a validation error when section name is too short (≤ 2 chars)", async () => {
      render(<CreateCustomSectionPage />);

      await act(async () => {
        fireEvent.change(screen.getByLabelText(/labels.sectionName/i), { target: { value: 'AB' } });
      });

      await act(async () => {
        fireEvent.click(screen.getByRole('button', { name: /button.createSection/i }));
      });

      await waitFor(() => {
        // One at the top of the page, one at field level
        expect(screen.getAllByText(/messages.fieldLengthValidation/i)).toHaveLength(2);
      });
    });

    it("should not call addCustomSection when validation fails", async () => {
      render(<CreateCustomSectionPage />);

      await act(async () => {
        fireEvent.click(screen.getByRole('button', { name: /button.createSection/i }));
      });

      expect(mockAddCustomSectionFn).not.toHaveBeenCalled();
    });
  });

  describe("Form Submission", () => {
    it("should call addCustomSection with correct variables on save", async () => {
      render(<CreateCustomSectionPage />);

      await act(async () => {
        fireEvent.change(screen.getByLabelText(/labels.sectionName/i), { target: { value: 'New Section Name' } });
      });

      await act(async () => {
        fireEvent.click(screen.getByRole('button', { name: /button.createSection/i }));
      });

      await waitFor(() => {
        expect(mockAddCustomSectionFn).toHaveBeenCalledWith(
          expect.objectContaining({
            variables: expect.objectContaining({
              input: expect.objectContaining({
                name: 'New Section Name',
                templateCustomizationId: 16,
              }),
            }),
          })
        );
      });
    });

    it("should pin the new section after the section with the highest displayOrder", async () => {
      render(<CreateCustomSectionPage />);

      await act(async () => {
        fireEvent.change(screen.getByLabelText(/labels.sectionName/i), { target: { value: 'New Section Name' } });
      });

      await act(async () => {
        fireEvent.click(screen.getByRole('button', { name: /button.createSection/i }));
      });

      await waitFor(() => {
        // Section with id:30 has the highest displayOrder (3)
        expect(mockAddCustomSectionFn).toHaveBeenCalledWith(
          expect.objectContaining({
            variables: expect.objectContaining({
              input: expect.objectContaining({
                pinnedSectionId: 30,
              }),
            }),
          })
        );
      });
    });

    it("should not include pinnedSectionId when there are no existing sections", async () => {
      mockUseQuery.mockImplementation((document) => {
        if (document === TemplateCustomizationOverviewDocument) {
          return {
            data: { templateCustomizationOverview: { sections: [] } },
            loading: false,
            error: null,
            /*eslint-disable @typescript-eslint/no-explicit-any */
          } as any;
        }
        return { data: null, loading: false, error: undefined };
      });

      render(<CreateCustomSectionPage />);

      await act(async () => {
        fireEvent.change(screen.getByLabelText(/labels.sectionName/i), { target: { value: 'New Section Name' } });
      });

      await act(async () => {
        fireEvent.click(screen.getByRole('button', { name: /button.createSection/i }));
      });

      await waitFor(() => {
        expect(mockAddCustomSectionFn).toHaveBeenCalledWith(
          expect.objectContaining({
            variables: expect.objectContaining({
              input: expect.not.objectContaining({ pinnedSectionId: expect.anything() }),
            }),
          })
        );
      });
    });

    it("should redirect to template customization page after successful creation", async () => {
      const mockPush = jest.fn();
      mockUseRouter.mockReturnValue({ push: mockPush });

      render(<CreateCustomSectionPage />);

      await act(async () => {
        fireEvent.change(screen.getByLabelText(/labels.sectionName/i), { target: { value: 'New Section Name' } });
      });

      await act(async () => {
        fireEvent.click(screen.getByRole('button', { name: /button.createSection/i }));
      });

      await waitFor(() => {
        expect(mockPush).toHaveBeenCalledWith('/template/customizations/16');
      });
    });

    it("should show a submitting label while the form is being submitted", async () => {
      mockUseMutation.mockImplementation((document) => {
        if (document === AddCustomSectionDocument) {
          return [
            jest.fn().mockImplementation(
              () => new Promise(resolve => setTimeout(() => resolve({ data: { addCustomSection: { id: 99, errors: null } } }), 200))
            ),
            { loading: false, error: undefined },
            /*eslint-disable @typescript-eslint/no-explicit-any */
          ] as any;
        }
        return [jest.fn(), { loading: false, error: undefined }] as any;
      });

      render(<CreateCustomSectionPage />);

      await act(async () => {
        fireEvent.change(screen.getByLabelText(/labels.sectionName/i), { target: { value: 'New Section Name' } });
      });

      fireEvent.click(screen.getByRole('button', { name: /button.createSection/i }));

      await waitFor(() => {
        expect(screen.getByRole('button', { name: /button.creatingSection/i })).toBeInTheDocument();
      });
    });

    it("should prevent double submission", async () => {
      render(<CreateCustomSectionPage />);

      await act(async () => {
        fireEvent.change(screen.getByLabelText(/labels.sectionName/i), { target: { value: 'New Section Name' } });
      });

      const saveButton = screen.getByRole('button', { name: /button.createSection/i });
      await act(async () => {
        fireEvent.click(saveButton);
        fireEvent.click(saveButton);
      });

      await waitFor(() => {
        expect(mockAddCustomSectionFn).toHaveBeenCalledTimes(1);
      });
    });
  });

  describe("Error Handling", () => {
    it("should display an error and call logECS when addCustomSection throws", async () => {
      mockUseMutation.mockImplementation((document) => {
        if (document === AddCustomSectionDocument) {
          return [
            jest.fn().mockRejectedValueOnce(new Error("Network error")),
            { loading: false, error: undefined },
            /*eslint-disable @typescript-eslint/no-explicit-any */
          ] as any;
        }
        /*eslint-disable @typescript-eslint/no-explicit-any */
        return [jest.fn(), { loading: false, error: undefined }] as any;
      });

      render(<CreateCustomSectionPage />);

      await act(async () => {
        fireEvent.change(screen.getByLabelText(/labels.sectionName/i), { target: { value: 'New Section Name' } });
      });

      await act(async () => {
        fireEvent.click(screen.getByRole('button', { name: /button.createSection/i }));
      });

      await waitFor(() => {
        expect(screen.getByText(/messages.errorCreatingSection/i)).toBeInTheDocument();
        expect(logECS).toHaveBeenCalledWith(
          'error',
          'Creating Custom Section in CreateCustomSectionPage',
          expect.anything()
        );
      });
    });

    it("should display a general error returned from addCustomSection", async () => {
      mockUseMutation.mockImplementation((document) => {
        if (document === AddCustomSectionDocument) {
          return [
            jest.fn().mockResolvedValueOnce({
              data: {
                addCustomSection: {
                  id: null,
                  errors: { general: 'Template not found' },
                },
              },
            }),
            { loading: false, error: undefined },
            /*eslint-disable @typescript-eslint/no-explicit-any */
          ] as any;
        }
        /*eslint-disable @typescript-eslint/no-explicit-any */
        return [jest.fn(), { loading: false, error: undefined }] as any;
      });

      render(<CreateCustomSectionPage />);

      await act(async () => {
        fireEvent.change(screen.getByLabelText(/labels.sectionName/i), { target: { value: 'New Section Name' } });
      });

      await act(async () => {
        fireEvent.click(screen.getByRole('button', { name: /button.createSection/i }));
      });

      await waitFor(() => {
        expect(screen.getByText(/template not found/i)).toBeInTheDocument();
      });
    });

    it("should display field-level errors returned from addCustomSection", async () => {
      mockUseMutation.mockImplementation((document) => {
        if (document === AddCustomSectionDocument) {
          return [
            jest.fn().mockResolvedValueOnce({
              data: {
                addCustomSection: {
                  id: null,
                  errors: { name: 'Name is too long', general: null },
                },
              },
            }),
            { loading: false, error: undefined },
            /*eslint-disable @typescript-eslint/no-explicit-any */
          ] as any;
        }
        /*eslint-disable @typescript-eslint/no-explicit-any */
        return [jest.fn(), { loading: false, error: undefined }] as any;
      });

      render(<CreateCustomSectionPage />);

      await act(async () => {
        fireEvent.change(screen.getByLabelText(/labels.sectionName/i), { target: { value: 'New Section Name' } });
      });

      await act(async () => {
        fireEvent.click(screen.getByRole('button', { name: /button.createSection/i }));
      });

      await waitFor(() => {
        expect(screen.getAllByText(/name is too long/i)).toHaveLength(2); // One at the top of the page, one at field level
      });
    });

    it("should display an error and call logECS when the template query fails", async () => {
      const mockQueryError = new Error("Failed to fetch template");
      mockUseQuery.mockImplementation((document) => {
        if (document === TemplateCustomizationOverviewDocument) {
          /*eslint-disable @typescript-eslint/no-explicit-any */
          return { data: undefined, loading: false, error: mockQueryError } as any;
        }
        return { data: null, loading: false, error: undefined };
      });

      render(<CreateCustomSectionPage />);

      await waitFor(() => {
        expect(screen.getByText(/messaging.error/i)).toBeInTheDocument();
        expect(logECS).toHaveBeenCalledWith(
          'error',
          'TemplateCustomizationOverview query error in CreateCustomSectionPage',
          expect.objectContaining({ error: mockQueryError })
        );
      });
    });
  });

  describe("Unsaved Changes Warning", () => {
    it("should warn user before unload when there are unsaved changes", async () => {
      const addEventListenerSpy = jest.spyOn(window, 'addEventListener');
      const removeEventListenerSpy = jest.spyOn(window, 'removeEventListener');

      render(<CreateCustomSectionPage />);

      await act(async () => {
        fireEvent.change(screen.getByLabelText(/labels.sectionName/i), { target: { value: 'New Section Name' } });
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
  });

  describe("Accessibility", () => {
    it("should pass axe accessibility checks", async () => {
      const { container } = render(<CreateCustomSectionPage />);

      fireEvent.click(screen.getByRole('tab', { name: /tabs.options/i }));

      await act(async () => {
        const results = await axe(container);
        expect(results).toHaveNoViolations();
      });
    });
  });
});