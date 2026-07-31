import React, { useState } from "react";
import { act, fireEvent, render, screen, waitFor } from '@/utils/test-utils';
import { useQuery, useMutation } from '@apollo/client/react';
import {
  SectionDocument,
  TagsDocument,
  UpdateSectionDocument,
  RemoveSectionDocument
} from '@/generated/graphql';

import { axe, toHaveNoViolations } from 'jest-axe';
import { useParams, useRouter } from 'next/navigation';
import logECS from '@/utils/clientLogger';
import SectionUpdatePage from '../page';
import { mockScrollIntoView, mockScrollTo } from "@/__mocks__/common";

expect.extend(toHaveNoViolations);

jest.mock('next/navigation', () => ({
  useRouter: jest.fn(),
  useParams: jest.fn()
}));


// Mock Apollo Client hooks
jest.mock('@apollo/client/react', () => ({
  useQuery: jest.fn(),
  useMutation: jest.fn(),
}));


// Need to mock the useSectionData hook with state to get react to re-render
// when the state changes
jest.mock('@/hooks/sectionData', () => ({
  useSectionData: () => {
    const [sectionData, setSectionData] = useState({
      sectionName: '',
      sectionIntroduction: '',
      sectionRequirements: '',
      sectionGuidance: '',
      displayOrder: undefined,
      bestPractice: undefined,
    });

    return {
      sectionData,
      setSectionData,
      selectedTags: [],
      checkboxTags: [],
      loading: false,
      setSelectedTags: jest.fn(),
      data: {
        section: {
          name: '',
          introduction: '',
          requirements: '',
          guidance: '',
          displayOrder: 1,
          bestPractice: false,
          tags: []
        }
      }
    };
  }
}));

const mockUseRouter = useRouter as jest.Mock;

const mockSectionsData = {
  bestPractice: false,
  displayOrder: 15,
  errors: null,
  guidance: "<p><strong>Testing guidance - Blah</strong></p>",
  id: 1108,
  introduction: "<p>Testing Introduction 123</p><ol><li><p>item 1</p></li><li><p>item 2</p></li></ol>",
  name: "<p><strong>Different Name</strong></p>",
  requirements: "<p>Testing requirements: List</p><ol><li><p>F<u>irst requirement;</u></p></li><li><p><em>Second requirement</em></p></li></ol>",
  tags: [
    {
      id: 1,
      name: "Data description",
      description: "The types of data that will be collected along with their formats"
    },
    {
      id: 2,
      name: "Security & Privacy",
      description: "Who will have access to the data"
    },
  ],
  template: {
    id: 15
  }

}

const mockTagsData = {
  tags: [
    {
      id: 1,
      description: "The types of data that will be collected along with their formats and estimated volumes.",
      name: "Data description"
    },
    {
      id: 2,
      description: "Descriptions naming conventions, metadata standards that will be used along with data dictionaries and glossaries",
      name: "Data organization & documentation"
    },
    {
      id: 3,
      description: "Who will have access to the data and how that access will be controlled, how the data will be encrypted and relevant compliance with regulations or standards (e.g. HIPAA, GDPR)",
      name: "Security & privacy"
    },
    {
      id: 4,
      description: "Ethical considerations during data collection, use or sharing and how informed consent will be obtained from participants",
      name: "Ethical considerations"
    },
    {
      id: 5,
      description: "Training that will be provided to team members on data management practices and support for data issues",
      name: "Training & support"
    },
    {
      id: 6,
      description: "Policies and procedures for how the data will be shared with collaborators and/or the public, restrictions to access and the licenses and permissions used",
      name: "Data sharing"
    },
    {
      id: 7,
      description: "Where the data will be stored, the backup strategy and frequency and how long it will be retained",
      name: "Data storage & backup"
    },
    {
      id: 8,
      description: "Methods used to ensure data quality and integrity and any procedures used for validation",
      name: "Data quality & integrity"
    },
    {
      id: 9,
      description: "Desriptions of the project team members and their roles",
      name: "Roles & responsibilities"
    },
    {
      id: 10,
      description: "Description of the budget available for data collection, use and preservation including software licensing, personnel and storage costs",
      name: "Budget"
    },
    {
      id: 11,
      description: "How the data will be collected or generated, primary and secondary sources that will be used and any instruments that will be used",
      name: "Data collection"
    }
  ]
};

// Cast with jest.mocked utility
const mockUseQuery = jest.mocked(useQuery);
const mockUseMutation = jest.mocked(useMutation);

let mockUpdateSectionFn: jest.Mock;
let mockRemoveSectionFn: jest.Mock;

const setupMocks = () => {
  // Create stable references OUTSIDE mockImplementation
  const stableSectionReturn = {
    data: mockSectionsData,
    loading: false,
    error: null,
  };

  const stableTagsReturn = {
    data: mockTagsData,
    loading: false,
    error: null,
  };

  mockUseQuery.mockImplementation((document) => {
    if (document === SectionDocument) {
      /* eslint-disable @typescript-eslint/no-explicit-any */
      return stableSectionReturn as any;
    }

    if (document === TagsDocument) {
      /* eslint-disable @typescript-eslint/no-explicit-any */
      return stableTagsReturn as any;
    }

    return {
      data: null,
      loading: false,
      error: undefined
    };
  });

  mockUpdateSectionFn = jest.fn().mockResolvedValue({
    data: { key: 'value' }
  });

  mockRemoveSectionFn = jest.fn().mockResolvedValue({
    data: { removeSection: { id: 123, name: 'Test Section' } }
  });

  mockUseMutation.mockImplementation((document) => {
    if (document === UpdateSectionDocument) {
      return [mockUpdateSectionFn, { loading: false, error: undefined }] as any;
    }

    if (document === RemoveSectionDocument) {
      return [mockRemoveSectionFn, { loading: false, error: undefined }] as any;
    }

    return [jest.fn(), { loading: false, error: undefined }] as any;
  });
};

describe("SectionUpdatePage", () => {
  beforeEach(() => {
    setupMocks();
    HTMLElement.prototype.scrollIntoView = mockScrollIntoView;
    mockScrollTo();
    const mockTemplateId = 123;
    const mockUseParams = useParams as jest.Mock;


    // Mock window.tinymce
    window.tinymce = {
      init: jest.fn(),
      remove: jest.fn(),
    };

    // Mock the return value of useParams
    mockUseParams.mockReturnValue({ templateId: `${mockTemplateId}`, section_slug: '123' });
    mockUseRouter.mockReturnValue({
      push: jest.fn(),
    });
  });

  it("should render correct fields", async () => {

    await act(async () => {
      render(
        <SectionUpdatePage />
      );
    });

    const heading = screen.getByRole('heading', { level: 1 });
    expect(heading).toHaveTextContent('title');
    const editQuestionTab = screen.getByRole('tab', { name: 'tabs.editSection' });
    expect(editQuestionTab).toBeInTheDocument();
    const editOptionsTab = screen.getByRole('tab', { name: 'tabs.options' });
    expect(editOptionsTab).toBeInTheDocument();
    const editLogicTab = screen.getByRole('tab', { name: 'tabs.logic' });
    expect(editLogicTab).toBeInTheDocument();
    const sectionNameInput = screen.getByLabelText(/labels.sectionName/);
    expect(sectionNameInput).toBeInTheDocument();
    const sectionIntroductionLabel = screen.getByLabelText(/sectionIntroduction/i);
    expect(sectionIntroductionLabel).toBeInTheDocument();
    const sectionRequirementsLabel = screen.getByLabelText(/sectionRequirements/i);
    expect(sectionRequirementsLabel).toBeInTheDocument();
    const sectionGuidanceLabel = screen.getByLabelText(/sectionGuidance/i);
    expect(sectionGuidanceLabel).toBeInTheDocument();

    // Check for the help text
    expect(screen.getByText('helpText.sectionIntroduction')).toBeInTheDocument();
    expect(screen.getByText('helpText.sectionRequirements')).toBeInTheDocument();
    expect(screen.getByText('helpText.sectionGuidance')).toBeInTheDocument();
  });

  it('should call updateSectionMutation with new value when save button is clicked', async () => {
    // Override the mock for this specific test
    const mockUpdateSection = jest.fn().mockResolvedValueOnce({ data: { updateSection: { errors: null } } });

    mockUseMutation.mockImplementation((document) => {
      if (document === UpdateSectionDocument) {
        /* eslint-disable @typescript-eslint/no-explicit-any */
        return [mockUpdateSection, { loading: false, error: undefined }] as any;
      }
      /* eslint-disable @typescript-eslint/no-explicit-any */
      return [jest.fn(), { loading: false, error: undefined }] as any;
    });

    await act(async () => {
      render(<SectionUpdatePage />);
    });

    // Simulate entering a new value
    const sectionNameInput = screen.getByLabelText(/sectionName/i);
    await act(async () => {
      fireEvent.change(sectionNameInput, { target: { value: 'New Section Name' } });
    });

    // Simulate clicking the save button
    const saveButton = screen.getByRole('button', { name: /buttons.saveAndUpdate/i });
    await act(async () => {
      fireEvent.click(saveButton);
    });

    // Assert mutation was called with expected variables
    await waitFor(() => {
      expect(mockUpdateSection).toHaveBeenCalledWith(
        expect.objectContaining({
          variables: expect.objectContaining({
            input: expect.objectContaining({
              name: 'New Section Name',
            }),
          }),
        })
      );
    });
  });

  it('should prevent unload when there are unsaved changes and user tries to navigate away from page', async () => {
    // Mock addEventListener
    const addEventListenerSpy = jest.spyOn(window, 'addEventListener');
    const removeEventListenerSpy = jest.spyOn(window, 'removeEventListener');
    const mockUpdateSection = jest.fn().mockResolvedValueOnce({ data: { updateSection: { errors: null } } });

    mockUseMutation.mockImplementation((document) => {
      if (document === UpdateSectionDocument) {
        /* eslint-disable @typescript-eslint/no-explicit-any */
        return [mockUpdateSection, { loading: false, error: undefined }] as any;
      }
      /* eslint-disable @typescript-eslint/no-explicit-any */
      return [jest.fn(), { loading: false, error: undefined }] as any;
    });

    await act(async () => {
      render(<SectionUpdatePage />);
    });

    // Simulate entering a new value
    const sectionNameInput = screen.getByLabelText(/sectionName/i);
    await act(async () => {
      fireEvent.change(sectionNameInput, { target: { value: 'New Section Name' } });
    });

    // Wait for state update
    await waitFor(() => {
      // Get the last registered 'beforeunload' handler
      const handler = addEventListenerSpy.mock.calls
        .filter(([event]) => event === 'beforeunload')
        .map(([, fn]) => fn)
        .pop();

      // Simulate event of navigating way from page
      const event = new Event('beforeunload');
      Object.defineProperty(event, 'returnValue', {
        writable: true,
        value: undefined,
      });

      if (typeof handler === 'function') {
        handler(event as unknown as BeforeUnloadEvent);
      } else if (handler && typeof handler.handleEvent === 'function') {
        handler.handleEvent(event as unknown as BeforeUnloadEvent);
      } else {
        throw new Error('beforeunload handler is not callable');
      }
    });

    // Cleanup
    removeEventListenerSpy.mockRestore();
    addEventListenerSpy.mockRestore();
  });

  it('should display error when no value is entered in section name field', async () => {
    // Override the mock for this specific test
    const mockUpdateSection = jest.fn().mockResolvedValueOnce({ data: { key: 'value' } });

    mockUseMutation.mockImplementation((document) => {
      if (document === UpdateSectionDocument) {
        /* eslint-disable @typescript-eslint/no-explicit-any */
        return [mockUpdateSection, { loading: false, error: undefined }] as any;
      }
      /* eslint-disable @typescript-eslint/no-explicit-any */
      return [jest.fn(), { loading: false, error: undefined }] as any;
    });

    await act(async () => {
      render(
        <SectionUpdatePage />
      );
    });

    const saveAndAdd = screen.getByRole('button', { name: /buttons.saveAndUpdate/i });
    fireEvent.click(saveAndAdd);

    const errorMessage = screen.getByRole('alert');
    expect(errorMessage).toBeInTheDocument();
    expect(errorMessage).toHaveTextContent('messages.fieldLengthValidation');
  })

  it('should call logECS when updateSection throws an error', async () => {
    // Override the mock for this specific test
    const mockUpdateSection = jest.fn().mockRejectedValueOnce(new Error("Error"));

    mockUseMutation.mockImplementation((document) => {
      if (document === UpdateSectionDocument) {
        /* eslint-disable @typescript-eslint/no-explicit-any */
        return [mockUpdateSection, { loading: false, error: undefined }] as any;
      }
      /* eslint-disable @typescript-eslint/no-explicit-any */
      return [jest.fn(), { loading: false, error: undefined }] as any;
    });

    await act(async () => {
      render(<SectionUpdatePage />);
    });

    const sectionName = screen.getByLabelText(/labels.sectionName/i);

    await act(async () => {
      fireEvent.change(sectionName, { target: { value: 'My section name' } });
    });

    const saveAndAdd = screen.getByRole('button', { name: /buttons.saveAndUpdate/i });

    await act(async () => {
      fireEvent.click(saveAndAdd);
    });

    await waitFor(() => {
      expect(logECS).toHaveBeenCalledWith(
        'error',
        'updateSection',
        expect.objectContaining({
          error: expect.anything(),
          url: { path: '/en-US/template/123/section/123' },
        })
      );
    });
  });

  it('should log error when an apollo error instance is returned', async () => {

    const mockUpdateSection = jest.fn()
      .mockRejectedValueOnce(new Error("Apollo error occurred")) // First call returns an Apollo error
      .mockResolvedValueOnce({ data: { removeUserEmail: [{ errors: null }] } }); // Second call succeeds

    mockUseMutation.mockImplementation((document) => {
      if (document === UpdateSectionDocument) {
        /* eslint-disable @typescript-eslint/no-explicit-any */
        return [mockUpdateSection, { loading: false, error: undefined }] as any;
      }
      /* eslint-disable @typescript-eslint/no-explicit-any */
      return [jest.fn(), { loading: false, error: undefined }] as any;
    });

    await act(async () => {
      render(<SectionUpdatePage />);
    });

    const sectionName = screen.getByLabelText(/labels.sectionName/i);

    await act(async () => {
      fireEvent.change(sectionName, { target: { value: 'My section name' } });
    });

    const saveAndAdd = screen.getByRole('button', { name: /buttons.saveAndUpdate/i });

    await act(async () => {
      fireEvent.click(saveAndAdd);
    });

    await waitFor(() => {
      expect(screen.getByText('messages.errorUpdatingSection')).toBeInTheDocument();
    });
  });

  it('should log error when field-level errors are returned', async () => {
    // Override the mock for this specific test
    const mockUpdateSection = jest.fn().mockResolvedValueOnce({ data: { updateSection: { errors: { general: 'Error updating section' } } } });

    mockUseMutation.mockImplementation((document) => {
      if (document === UpdateSectionDocument) {
        /* eslint-disable @typescript-eslint/no-explicit-any */
        return [mockUpdateSection, { loading: false, error: undefined }] as any;
      }
      /* eslint-disable @typescript-eslint/no-explicit-any */
      return [jest.fn(), { loading: false, error: undefined }] as any;
    });

    await act(async () => {
      render(<SectionUpdatePage />);
    });

    const sectionName = screen.getByLabelText(/labels.sectionName/i);

    await act(async () => {
      fireEvent.change(sectionName, { target: { value: 'My section name' } });
    });

    const saveAndAdd = screen.getByRole('button', { name: /buttons.saveAndUpdate/i });

    await act(async () => {
      fireEvent.click(saveAndAdd);
    });

    await waitFor(() => {
      expect(screen.getByText(/error updating section/i)).toBeInTheDocument();
    });
  });

  it('should redirect to Edit Template page after submitting form', async () => {
    await act(async () => {
      render(<SectionUpdatePage />);
    });

    // Simulate adding content to the sectionName field
    const sectionNameInput = screen.getByLabelText(/sectionName/i);
    await act(async () => {
      fireEvent.change(sectionNameInput, { target: { value: 'Updated Section Name' } });
    });

    const saveAndAdd = screen.getByRole('button', { name: /buttons.saveAndUpdate/i });
    fireEvent.click(saveAndAdd);

    await waitFor(() => {
      expect(mockUseRouter().push).toHaveBeenCalledWith('/en-US/template/123');
    });
  });


  it('should pass axe accessibility test', async () => {
    const { container } = render(
      <SectionUpdatePage />
    );

    // Click on the options tab to ensure h2 headings are rendered
    const optionsTab = screen.getByRole('tab', { name: 'tabs.options' });
    fireEvent.click(optionsTab);

    await act(async () => {
      const results = await axe(container);
      expect(results).toHaveNoViolations();
    });
  });

  describe('Delete Section Functionality', () => {
    it('should render delete section button in danger zone', async () => {

      await act(async () => {
        render(<SectionUpdatePage />);
      });

      const dangerZoneTitle = screen.getByText('deleteSection.heading');
      expect(dangerZoneTitle).toBeInTheDocument();

      const deleteButton = screen.getByRole('button', { name: /buttons.deleteSection/i });
      expect(deleteButton).toBeInTheDocument();
      expect(deleteButton).toHaveTextContent('buttons.deleteSection');
    });

    it('should open delete confirmation dialog when delete button is clicked', async () => {

      await act(async () => {
        render(<SectionUpdatePage />);
      });

      const deleteButton = screen.getByRole('button', { name: /buttons.deleteSection/i });
      fireEvent.click(deleteButton);

      await waitFor(() => {
        expect(screen.getByText('deleteModal.title')).toBeInTheDocument();
        expect(screen.getByText('deleteModal.content')).toBeInTheDocument();
        expect(screen.getByRole('button', { name: /deleteModal.cancelButton/i })).toBeInTheDocument();
        expect(screen.getByRole('button', { name: /deleteModal.deleteButton/i })).toBeInTheDocument();
      });
    });

    it('should close dialog when cancel button is clicked', async () => {
      await act(async () => {
        render(<SectionUpdatePage />);
      });

      const deleteButton = screen.getByRole('button', { name: /buttons.deleteSection/i });
      fireEvent.click(deleteButton);

      await waitFor(() => {
        expect(screen.getByText('deleteModal.title')).toBeInTheDocument();
      });

      const cancelButton = screen.getByRole('button', { name: /deleteModal.cancelButton/i });
      fireEvent.click(cancelButton);

      await waitFor(() => {
        expect(screen.queryByText('deleteModal.title')).not.toBeInTheDocument();
      });
    });

    it('should successfully delete section when confirm button is clicked', async () => {
      const mockRemoveSection = jest.fn().mockResolvedValueOnce({
        data: { removeSection: { id: 123, name: 'Test Section' } }
      });

      mockUseMutation.mockImplementation((document) => {
        if (document === RemoveSectionDocument) {
          /* eslint-disable @typescript-eslint/no-explicit-any */
          return [mockRemoveSection, { loading: false, error: undefined }] as any;
        }
        /* eslint-disable @typescript-eslint/no-explicit-any */
        return [jest.fn(), { loading: false, error: undefined }] as any;
      });

      await act(async () => {
        render(<SectionUpdatePage />);
      });

      const deleteButton = screen.getByRole('button', { name: /buttons.deleteSection/i });
      fireEvent.click(deleteButton);

      await waitFor(() => {
        expect(screen.getByText('deleteModal.title')).toBeInTheDocument();
      });

      const confirmDeleteButton = screen.getByRole('button', { name: /deleteModal.deleteButton/i });
      fireEvent.click(confirmDeleteButton);

      await waitFor(() => {
        expect(mockRemoveSection).toHaveBeenCalledWith({
          variables: { sectionId: 123 }
        });
        expect(mockUseRouter().push).toHaveBeenCalledWith('/en-US/template/123');
      });
    });

    it('should show error message when delete section fails', async () => {
      const mockRemoveSection = jest.fn().mockRejectedValueOnce(new Error('Delete failed'));

      mockUseMutation.mockImplementation((document) => {
        if (document === RemoveSectionDocument) {
          /* eslint-disable @typescript-eslint/no-explicit-any */
          return [mockRemoveSection, { loading: false, error: undefined }] as any;
        }
        /* eslint-disable @typescript-eslint/no-explicit-any */
        return [jest.fn(), { loading: false, error: undefined }] as any;
      });
      await act(async () => {
        render(<SectionUpdatePage />);
      });

      const deleteButton = screen.getByRole('button', { name: /buttons.deleteSection/i });
      fireEvent.click(deleteButton);

      await waitFor(() => {
        expect(screen.getByText('deleteModal.title')).toBeInTheDocument();
      });

      const confirmDeleteButton = screen.getByRole('button', { name: /deleteModal.deleteButton/i });
      fireEvent.click(confirmDeleteButton);

      await waitFor(() => {
        expect(screen.getByText('messages.errorDeletingSection')).toBeInTheDocument();
        expect(logECS).toHaveBeenCalledWith(
          'error',
          'deleteSection',
          expect.objectContaining({
            error: expect.anything(),
            url: { path: '/en-US/template/123/section/123' },
          })
        );
      });
    });

    it('should disable delete button while deletion is in progress', async () => {
      const mockRemoveSection = jest.fn().mockImplementation(() =>
        new Promise(resolve => setTimeout(() => resolve({ data: { removeSection: { id: 123 } } }), 100))
      );

      mockUseMutation.mockImplementation((document) => {
        if (document === RemoveSectionDocument) {
          /* eslint-disable @typescript-eslint/no-explicit-any */
          return [mockRemoveSection, { loading: false, error: undefined }] as any;
        }
        /* eslint-disable @typescript-eslint/no-explicit-any */
        return [jest.fn(), { loading: false, error: undefined }] as any;
      });

      await act(async () => {
        render(<SectionUpdatePage />);
      });

      const deleteButton = screen.getByRole('button', { name: /buttons.deleteSection/i });
      fireEvent.click(deleteButton);

      await waitFor(() => {
        expect(screen.getByText('deleteModal.title')).toBeInTheDocument();
      });

      const confirmDeleteButton = screen.getByRole('button', { name: /deleteModal.deleteButton/i });
      fireEvent.click(confirmDeleteButton);

      // Button should be disabled and show "Deleting..." text
      await waitFor(() => {
        expect(deleteButton).toBeDisabled();
        expect(deleteButton).toHaveTextContent('Deleting...');
      });
    });
  });
});
