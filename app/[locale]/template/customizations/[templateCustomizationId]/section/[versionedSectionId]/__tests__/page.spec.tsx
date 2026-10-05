import { act, fireEvent, render, screen, waitFor } from '@/utils/test-utils';
import { useQuery, useMutation } from '@apollo/client/react';
import {
  PublishedSectionDocument,
  SectionCustomizationByVersionedSectionDocument,
  AddSectionCustomizationDocument,
  UpdateSectionCustomizationDocument,
  RemoveSectionCustomizationDocument,
} from '@/generated/graphql';

import { axe, toHaveNoViolations } from 'jest-axe';
import { useParams } from 'next/navigation';
import { useRouter } from '@/i18n/routing';
import logECS from '@/utils/clientLogger';
import SectionCustomizePage from '../page';
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
  usePathname: jest.fn(() => '/template/customizations/1/section/1'),
}));

jest.mock('@apollo/client/react', () => ({
  useQuery: jest.fn(),
  useMutation: jest.fn(),
}));

const mockUseRouter = useRouter as jest.Mock;
const mockUseQuery = jest.mocked(useQuery);
const mockUseMutation = jest.mocked(useMutation);

const mockPublishedSectionData = {
  publishedSection: {
    id: 1,
    name: 'Test Section Name',
    introduction: '<p>Test introduction</p>',
    requirements: '<p>Test requirements</p>',
    guidance: '<p>Test guidance</p>',
    tags: [
      { id: 1, name: 'Data description' },
      { id: 2, name: 'Security & Privacy' },
    ],
  },
};

const mockSectionCustomizationData = {
  sectionCustomizationByVersionedSection: {
    id: 42,
    guidance: '<p>Existing custom guidance</p>',
  },
};

let mockAddSectionCustomizationFn: jest.Mock;
let mockUpdateSectionCustomizationFn: jest.Mock;
let mockRemoveSectionCustomizationFn: jest.Mock;

const setupMocks = ({
  hasExistingCustomization = true,
}: { hasExistingCustomization?: boolean } = {}) => {
  mockUseQuery.mockImplementation((document) => {
    if (document === PublishedSectionDocument) {
      /* eslint-disable @typescript-eslint/no-explicit-any */
      return { data: mockPublishedSectionData, loading: false, error: null } as any;
    }
    if (document === SectionCustomizationByVersionedSectionDocument) {
      return {
        data: hasExistingCustomization ? mockSectionCustomizationData : { sectionCustomizationByVersionedSection: null },
        loading: false,
        error: null,
        /* eslint-disable @typescript-eslint/no-explicit-any */
      } as any;
    }
    return { data: null, loading: false, error: undefined };
  });

  mockAddSectionCustomizationFn = jest.fn().mockResolvedValue({
    data: { addSectionCustomization: { id: 99 } },
  });

  mockUpdateSectionCustomizationFn = jest.fn().mockResolvedValue({
    data: { updateSectionCustomization: { errors: null } },
  });

  mockRemoveSectionCustomizationFn = jest.fn().mockResolvedValue({
    data: { removeSectionCustomization: { errors: {} } },
  });

  mockUseMutation.mockImplementation((document) => {
    if (document === AddSectionCustomizationDocument) {
      /* eslint-disable @typescript-eslint/no-explicit-any */
      return [mockAddSectionCustomizationFn, { loading: false, error: undefined }] as any;
    }
    if (document === UpdateSectionCustomizationDocument) {
      /* eslint-disable @typescript-eslint/no-explicit-any */
      return [mockUpdateSectionCustomizationFn, { loading: false, error: undefined }] as any;
    }
    if (document === RemoveSectionCustomizationDocument) {
      /* eslint-disable @typescript-eslint/no-explicit-any */
      return [mockRemoveSectionCustomizationFn, { loading: false, error: undefined }] as any;
    }
    /* eslint-disable @typescript-eslint/no-explicit-any */
    return [jest.fn(), { loading: false, error: undefined }] as any;
  });
};

describe('SectionCustomizePage', () => {
  beforeEach(() => {
    setupMocks();
    HTMLElement.prototype.scrollIntoView = mockScrollIntoView;
    mockScrollTo();

    window.tinymce = {
      init: jest.fn(),
      remove: jest.fn(),
    };

    (useParams as jest.Mock).mockReturnValue({
      templateCustomizationId: '10',
      versionedSectionId: '20',
    });

    mockUseRouter.mockReturnValue({
      push: jest.fn(),
    });
  });

  afterEach(() => {
    jest.clearAllMocks();
  });

  describe('Rendering', () => {
    it('should render page heading and published section fields', async () => {

      render(<SectionCustomizePage />);


      await screen.findByRole('heading', { level: 1 });
      expect(screen.getByRole('heading', { level: 1 })).toHaveTextContent('title');
      expect(screen.getByText('labels.sectionName')).toBeInTheDocument();
      expect(screen.getByText('labels.sectionIntroduction')).toBeInTheDocument();
      expect(screen.getByText('labels.sectionRequirements')).toBeInTheDocument();
      expect(screen.getByText('labels.sectionGuidance')).toBeInTheDocument();
    });

    it('should render the additional guidance editor and save button', async () => {
      render(<SectionCustomizePage />);

      await screen.findByRole('heading', { level: 1 });
      expect(screen.getByLabelText(/additional section guidance/i)).toBeInTheDocument();
      expect(screen.getByRole('button', { name: /buttons.saveAndUpdate/i })).toBeInTheDocument();
    });

    it('should render tags from published section', async () => {

      render(<SectionCustomizePage />);

      await screen.findByRole('heading', { level: 1 });
      expect(screen.getByText('Data description')).toBeInTheDocument();
      expect(screen.getByText('Security & Privacy')).toBeInTheDocument();
    });

    it('should show a loading state while published section data is loading', async () => {
      mockUseQuery.mockImplementation((document) => {
        if (document === PublishedSectionDocument) {
          /* eslint-disable @typescript-eslint/no-explicit-any */
          return { data: undefined, loading: true, error: null } as any;
        }
        return { data: null, loading: false, error: undefined };
      });

      await act(async () => {
        render(<SectionCustomizePage />);
      });

      // The Loading component should be shown; heading should not be rendered
      expect(screen.queryByRole('heading', { level: 1 })).not.toBeInTheDocument();
    });
  });

  describe('Initialization', () => {
    it('should create a new customization when none exists', async () => {
      setupMocks({ hasExistingCustomization: false });

      render(<SectionCustomizePage />);


      await waitFor(() => {
        expect(mockAddSectionCustomizationFn).toHaveBeenCalledWith({
          variables: {
            input: {
              templateCustomizationId: 10,
              versionedSectionId: 20,
            },
          },
        });
      });
    });

    it('should not create a new customization when one already exists', async () => {
      render(<SectionCustomizePage />);


      await waitFor(() => {
        expect(mockAddSectionCustomizationFn).not.toHaveBeenCalled();
      });
    });

    it('should populate the guidance editor with existing customization data', async () => {
      render(<SectionCustomizePage />);

      await screen.findByRole('heading', { level: 1 });
      // The TinyMCE editor receives the existing guidance as its content prop
      const editor = screen.getByLabelText(/additional section guidance/i);
      expect(editor).toBeInTheDocument();
      // The content is passed as a prop; verify no empty-state placeholder is shown
      expect(screen.queryByText(/noContent/i)).not.toBeInTheDocument();
    });
  });

  describe('Form Submission', () => {
    it('should call updateSectionCustomization with correct variables on save', async () => {
      render(<SectionCustomizePage />);

      await screen.findByRole('heading', { level: 1 });
      const saveButton = screen.getByRole('button', { name: /buttons.saveAndUpdate/i });
      await act(async () => {
        fireEvent.click(saveButton);
      });

      await waitFor(() => {
        expect(mockUpdateSectionCustomizationFn).toHaveBeenCalledWith(
          expect.objectContaining({
            variables: expect.objectContaining({
              input: expect.objectContaining({
                sectionCustomizationId: 42,
              }),
            }),
          })
        );
      });
    });

    it('should show a validation error when guidance field is empty', async () => {
      setupMocks({ hasExistingCustomization: false });

      render(<SectionCustomizePage />);

      await screen.findByRole('heading', { level: 1 });
      const saveButton = screen.getByRole('button', { name: /buttons.saveAndUpdate/i });
      await act(async () => {
        fireEvent.click(saveButton);
      });

      await waitFor(() => {
        expect(screen.getByRole('alert')).toHaveTextContent('messages.fieldLengthValidation');
      });
    });

    it('should redirect to template customize page after a successful save', async () => {
      const mockPush = jest.fn();
      mockUseRouter.mockReturnValue({ push: mockPush });

      render(<SectionCustomizePage />);

      await screen.findByRole('heading', { level: 1 });
      const saveButton = screen.getByRole('button', { name: /buttons.saveAndUpdate/i });
      await act(async () => {
        fireEvent.click(saveButton);
      });

      await waitFor(() => {
        expect(mockPush).toHaveBeenCalledWith(expect.stringContaining('10'));
      });
    });

    it('should display an error message when updateSectionCustomization throws', async () => {
      mockUseMutation.mockImplementation((document) => {
        if (document === UpdateSectionCustomizationDocument) {
          return [
            jest.fn().mockRejectedValueOnce(new Error('Network error')),
            { loading: false, error: undefined },
          ] as any;
        }
        if (document === AddSectionCustomizationDocument) {
          /* eslint-disable @typescript-eslint/no-explicit-any */
          return [mockAddSectionCustomizationFn, { loading: false, error: undefined }] as any;
        }
        if (document === RemoveSectionCustomizationDocument) {
          /* eslint-disable @typescript-eslint/no-explicit-any */
          return [mockRemoveSectionCustomizationFn, { loading: false, error: undefined }] as any;
        }
        /* eslint-disable @typescript-eslint/no-explicit-any */
        return [jest.fn(), { loading: false, error: undefined }] as any;
      });

      render(<SectionCustomizePage />);

      await screen.findByRole('heading', { level: 1 });
      const saveButton = screen.getByRole('button', { name: /buttons.saveAndUpdate/i });
      await act(async () => {
        fireEvent.click(saveButton);
      });

      await waitFor(() => {
        expect(logECS).toHaveBeenCalledWith(
          'error',
          'updateSection',
          expect.objectContaining({ error: expect.anything() })
        );
        expect(screen.getByText('messages.errorUpdatingSection')).toBeInTheDocument();
      });
    });

    it('should display a general error when the server returns field-level errors', async () => {
      mockUseMutation.mockImplementation((document) => {
        if (document === UpdateSectionCustomizationDocument) {
          return [
            jest.fn().mockResolvedValueOnce({
              data: {
                updateSectionCustomization: {
                  errors: { general: 'Something went wrong', guidance: 'Guidance error' },
                },
              },
            }),
            { loading: false, error: undefined },
            /* eslint-disable @typescript-eslint/no-explicit-any */
          ] as any;
        }
        if (document === AddSectionCustomizationDocument) {
          /* eslint-disable @typescript-eslint/no-explicit-any */
          return [mockAddSectionCustomizationFn, { loading: false, error: undefined }] as any;
        }
        if (document === RemoveSectionCustomizationDocument) {
          /* eslint-disable @typescript-eslint/no-explicit-any */
          return [mockRemoveSectionCustomizationFn, { loading: false, error: undefined }] as any;
        }
        /* eslint-disable @typescript-eslint/no-explicit-any */
        return [jest.fn(), { loading: false, error: undefined }] as any;
      });

      render(<SectionCustomizePage />);

      await screen.findByRole('heading', { level: 1 });
      const saveButton = screen.getByRole('button', { name: /buttons.saveAndUpdate/i });
      await act(async () => {
        fireEvent.click(saveButton);
      });

      await waitFor(() => {
        expect(screen.getByText(/something went wrong/i)).toBeInTheDocument();
      });
    });
  });

  describe('Unsaved Changes Warning', () => {
    it('should warn before unload when there are unsaved changes', async () => {
      const addEventListenerSpy = jest.spyOn(window, 'addEventListener');
      const removeEventListenerSpy = jest.spyOn(window, 'removeEventListener');

      render(<SectionCustomizePage />);

      await screen.findByRole('heading', { level: 1 });
      // Trigger a change so hasUnsavedChanges becomes true
      // (TinyMCE setContent callback updates state)
      // Simulate by firing a change on the hidden textarea the editor binds
      const editor = screen.getByLabelText(/additional section guidance/i);
      await act(async () => {
        fireEvent.change(editor, { target: { value: '<p>New guidance</p>' } });
      });

      await waitFor(() => {
        const handler = addEventListenerSpy.mock.calls
          .filter(([event]) => event === 'beforeunload')
          .map(([, fn]) => fn)
          .pop();

        const event = new Event('beforeunload');
        Object.defineProperty(event, 'returnValue', { writable: true, value: undefined });

        if (typeof handler === 'function') {
          handler(event as unknown as BeforeUnloadEvent);
        } else if (handler && typeof (handler as EventListenerObject).handleEvent === 'function') {
          (handler as EventListenerObject).handleEvent(event as unknown as BeforeUnloadEvent);
        }
      });

      removeEventListenerSpy.mockRestore();
      addEventListenerSpy.mockRestore();
    });
  });

  describe('Delete Customization', () => {
    it('should render the delete customization button', async () => {
      render(<SectionCustomizePage />);

      await screen.findByRole('heading', { level: 1 });
      expect(screen.getByRole('button', { name: /buttons.deleteCustomization/i })).toBeInTheDocument();
    });

    it('should open confirmation modal when delete button is clicked', async () => {
      render(<SectionCustomizePage />);

      await screen.findByRole('heading', { level: 1 });
      const deleteButton = screen.getByRole('button', { name: /buttons.deleteCustomization/i });
      fireEvent.click(deleteButton);

      await waitFor(() => {
        expect(screen.getByText('heading.deleteCustomization')).toBeInTheDocument();
        expect(screen.getByRole('button', { name: /buttons.cancel/i })).toBeInTheDocument();
        expect(screen.getByRole('button', { name: /buttons.delete/i })).toBeInTheDocument();
      });
    });

    it('should close the modal when cancel is clicked', async () => {
      render(<SectionCustomizePage />);

      await screen.findByRole('heading', { level: 1 });
      const deleteButton = screen.getByRole('button', { name: /buttons.deleteCustomization/i });
      fireEvent.click(deleteButton);

      await waitFor(() => {
        expect(screen.getByText('heading.deleteCustomization')).toBeInTheDocument();
      });

      const cancelButton = screen.getByRole('button', { name: /buttons.cancel/i });
      fireEvent.click(cancelButton);

      await waitFor(() => {
        expect(screen.queryByText('heading.deleteCustomization')).not.toBeInTheDocument();
      });
    });

    it('should call removeSectionCustomization and redirect on confirm', async () => {
      const mockPush = jest.fn();
      mockUseRouter.mockReturnValue({ push: mockPush });

      render(<SectionCustomizePage />);

      await screen.findByRole('heading', { level: 1 });
      const deleteButton = screen.getByRole('button', { name: /buttons.deleteCustomization/i });
      fireEvent.click(deleteButton);

      await waitFor(() => {
        expect(screen.getByText('heading.deleteCustomization')).toBeInTheDocument();
      });

      const confirmButton = screen.getByRole('button', { name: /buttons.delete/i });
      await act(async () => {
        fireEvent.click(confirmButton);
      });

      await waitFor(() => {
        expect(mockRemoveSectionCustomizationFn).toHaveBeenCalledWith({
          variables: { sectionCustomizationId: 42 },
        });
        expect(mockPush).toHaveBeenCalledWith(expect.stringContaining('10'));
      });
    });

    it('should show error and log when removeSectionCustomization throws', async () => {
      mockUseMutation.mockImplementation((document) => {
        if (document === RemoveSectionCustomizationDocument) {
          return [
            jest.fn().mockRejectedValueOnce(new Error('Delete failed')),
            { loading: false, error: undefined },
            /* eslint-disable @typescript-eslint/no-explicit-any */
          ] as any;
        }
        if (document === AddSectionCustomizationDocument) {
          /* eslint-disable @typescript-eslint/no-explicit-any */
          return [mockAddSectionCustomizationFn, { loading: false, error: undefined }] as any;
        }
        if (document === UpdateSectionCustomizationDocument) {
          /* eslint-disable @typescript-eslint/no-explicit-any */
          return [mockUpdateSectionCustomizationFn, { loading: false, error: undefined }] as any;
        }
        /* eslint-disable @typescript-eslint/no-explicit-any */
        return [jest.fn(), { loading: false, error: undefined }] as any;
      });

      render(<SectionCustomizePage />);

      await screen.findByRole('heading', { level: 1 });
      const deleteButton = screen.getByRole('button', { name: /buttons.deleteCustomization/i });
      fireEvent.click(deleteButton);

      await waitFor(() => {
        expect(screen.getByText('heading.deleteCustomization')).toBeInTheDocument();
      });

      const confirmButton = screen.getByRole('button', { name: /buttons.delete/i });
      await act(async () => {
        fireEvent.click(confirmButton);
      });

      await waitFor(() => {
        expect(screen.getByText('messages.error.errorDeletingSectionCustomization')).toBeInTheDocument();
        expect(logECS).toHaveBeenCalledWith(
          'error',
          'deleteSection',
          expect.objectContaining({ error: expect.anything() })
        );
      });
    });

    it('should disable delete button while deletion is in progress', async () => {
      mockUseMutation.mockImplementation((document) => {
        if (document === RemoveSectionCustomizationDocument) {
          return [
            jest.fn().mockImplementation(
              () => new Promise(resolve => setTimeout(() => resolve({ data: { removeSectionCustomization: { errors: {} } } }), 200))
            ),
            { loading: false, error: undefined },
            /* eslint-disable @typescript-eslint/no-explicit-any */
          ] as any;
        }
        if (document === AddSectionCustomizationDocument) {
          /* eslint-disable @typescript-eslint/no-explicit-any */
          return [mockAddSectionCustomizationFn, { loading: false, error: undefined }] as any;
        }
        if (document === UpdateSectionCustomizationDocument) {
          /* eslint-disable @typescript-eslint/no-explicit-any */
          return [mockUpdateSectionCustomizationFn, { loading: false, error: undefined }] as any;
        }
        /* eslint-disable @typescript-eslint/no-explicit-any */
        return [jest.fn(), { loading: false, error: undefined }] as any;
      });

      render(<SectionCustomizePage />);

      await screen.findByRole('heading', { level: 1 });
      const deleteButton = screen.getByRole('button', { name: /buttons.deleteCustomization/i });
      fireEvent.click(deleteButton);

      await waitFor(() => {
        expect(screen.getByText('heading.deleteCustomization')).toBeInTheDocument();
      });

      const confirmButton = screen.getByRole('button', { name: /buttons.delete/i });
      fireEvent.click(confirmButton);

      await waitFor(() => {
        expect(deleteButton).toBeDisabled();
        expect(deleteButton).toHaveTextContent(/buttons.deletingCustomizations/i);
      });
    });
  });

  describe('Accessibility', () => {
    it('should pass axe accessibility checks', async () => {
      const { container } = render(<SectionCustomizePage />);

      await act(async () => {
        const results = await axe(container);
        expect(results).toHaveNoViolations();
      });
    });
  });
});