import React from "react";
import { useParams, useRouter } from 'next/navigation';
import { act, fireEvent, render, screen, waitFor } from '@/utils/test-utils';
import { useQuery, useMutation } from '@apollo/client/react';

import {
  AddSectionDocument,
  SectionsDisplayOrderDocument,
  TagsDocument,
} from '@/generated/graphql';

import { axe, toHaveNoViolations } from 'jest-axe';
import CreateSectionPage from '../page';
import { mockScrollIntoView, mockScrollTo } from "@/__mocks__/common";
import mockSectionData from '../__mocks__/addSectionMock.json';

expect.extend(toHaveNoViolations);

// Mock Apollo Client hooks
jest.mock('@apollo/client/react', () => ({
  useQuery: jest.fn(),
  useMutation: jest.fn(),
}));


jest.mock('next/navigation', () => ({
  useRouter: jest.fn(),
  useParams: jest.fn(),
}))

const mockUseRouter = useRouter as jest.Mock;

jest.mock('@/context/ToastContext', () => ({
  useToast: jest.fn(() => ({
    add: jest.fn(),
  })),
}));

const mockSectionsData = {
  sections: [
    {
      displayOrder: 1
    },
    {
      displayOrder: 2
    }
  ]
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

let mockAddSectionFn: jest.Mock;

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
    if (document === SectionsDisplayOrderDocument) {
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

  mockAddSectionFn = jest.fn().mockResolvedValue({
    data: { key: 'value' }
  });

  mockUseMutation.mockImplementation((document) => {
    if (document === AddSectionDocument) {
      /* eslint-disable @typescript-eslint/no-explicit-any */
      return [mockAddSectionFn, { loading: false, error: undefined }] as any;
    }
    /* eslint-disable @typescript-eslint/no-explicit-any */
    return [jest.fn(), { loading: false, error: undefined }] as any;
  });
};

describe("CreateSectionPage", () => {
  beforeEach(() => {
    setupMocks();
    jest.clearAllMocks();
    HTMLElement.prototype.scrollIntoView = mockScrollIntoView;
    mockScrollTo();


    // Mock window.tinymce
    window.tinymce = {
      init: jest.fn(),
      remove: jest.fn(),
    };

    const mockTemplateId = 123;
    const mockUseParams = useParams as jest.Mock;

    // Mock the return value of useParams
    mockUseParams.mockReturnValue({ templateId: `${mockTemplateId}` });
    mockUseRouter.mockReturnValue({
      push: jest.fn(),
    });
  });

  it("should render correct fields", async () => {

    await act(async () => {
      render(
        <CreateSectionPage />
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

  it('should display error when no value is entered in section name field', async () => {
    await act(async () => {
      render(
        <CreateSectionPage />
      );
    });

    const searchButton = screen.getByRole('button', { name: /button.createSection/i });
    fireEvent.click(searchButton);

    const errorMessage = screen.getByRole('alert');
    expect(errorMessage).toBeInTheDocument();
    expect(errorMessage).toHaveTextContent('messages.fieldLengthValidation');
  })

  it('should call addSectionMutation when user enters data and clicks Create section button', async () => {
    const mockAddSection = jest.fn().mockResolvedValueOnce({ data: mockSectionData });

    mockUseMutation.mockImplementation((document) => {
      if (document === AddSectionDocument) {
        /* eslint-disable @typescript-eslint/no-explicit-any */
        return [mockAddSection, { loading: false, error: undefined }] as any;
      }
      /* eslint-disable @typescript-eslint/no-explicit-any */
      return [jest.fn(), { loading: false, error: undefined }] as any;
    });

    await act(async () => {
      render(
        <CreateSectionPage />
      );
    });

    const sectionNameInput = screen.getByRole('textbox', { name: /sectionName/i });
    fireEvent.change(sectionNameInput, { target: { value: 'Test Section' } });

    const createButton = screen.getByRole('button', { name: /button.createSection/i });
    fireEvent.click(createButton);
    expect(mockAddSection).toHaveBeenCalledTimes(1);
    await waitFor(() => {
      expect(mockUseRouter().push).toHaveBeenCalledWith('/template/123');
    });
  })

  it('should prevent unload when there are unsaved changes and user tries to navigate away from page', async () => {
    // Mock addEventListener
    const addEventListenerSpy = jest.spyOn(window, 'addEventListener');
    const removeEventListenerSpy = jest.spyOn(window, 'removeEventListener');
    const mockAddSection = jest.fn().mockResolvedValueOnce({ data: mockSectionData });

    mockUseMutation.mockImplementation((document) => {
      if (document === AddSectionDocument) {
        /* eslint-disable @typescript-eslint/no-explicit-any */
        return [mockAddSection, { loading: false, error: undefined }] as any;
      }
      /* eslint-disable @typescript-eslint/no-explicit-any */
      return [jest.fn(), { loading: false, error: undefined }] as any;
    });

    await act(async () => {
      render(
        <CreateSectionPage />
      );
    });

    const sectionNameInput = screen.getByRole('textbox', { name: /sectionName/i });
    fireEvent.change(sectionNameInput, { target: { value: 'Test Section' } });


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
  })

  it('should display error when addSectionMutation throws an error', async () => {
    const mockAddSection = jest.fn().mockRejectedValueOnce(new Error("Error"));

    mockUseMutation.mockImplementation((document) => {
      if (document === AddSectionDocument) {
        /* eslint-disable @typescript-eslint/no-explicit-any */
        return [mockAddSection, { loading: false, error: undefined }] as any;
      }
      /* eslint-disable @typescript-eslint/no-explicit-any */
      return [jest.fn(), { loading: false, error: undefined }] as any;
    });

    await act(async () => {
      render(
        <CreateSectionPage />
      );
    });

    const sectionNameInput = screen.getByRole('textbox', { name: /sectionName/i });
    fireEvent.change(sectionNameInput, { target: { value: 'Test Section' } });

    const createButton = screen.getByRole('button', { name: /button.createSection/i });
    act(() => {
      fireEvent.click(createButton);

    })
    await waitFor(() => {
      expect(screen.getByText('messages.errorCreatingSection')).toBeInTheDocument();
    });
  })

  it('should display error when addSectionMutation returns an instance of apollo error', async () => {

    const mockUpdateSection = jest.fn()
      .mockRejectedValueOnce(new Error('Apollo error occurred')) // First call returns an Apollo error
      .mockResolvedValueOnce({ data: { removeUserEmail: [{ errors: null }] } }); // Second call succeeds

    mockUseMutation.mockImplementation((document) => {
      if (document === AddSectionDocument) {
        /* eslint-disable @typescript-eslint/no-explicit-any */
        return [mockUpdateSection, { loading: false, error: undefined }] as any;
      }
      /* eslint-disable @typescript-eslint/no-explicit-any */
      return [jest.fn(), { loading: false, error: undefined }] as any;
    });

    await act(async () => {
      render(
        <CreateSectionPage />
      );
    });

    const sectionNameInput = screen.getByRole('textbox', { name: /sectionName/i });
    fireEvent.change(sectionNameInput, { target: { value: 'Test Section' } });

    const createButton = screen.getByRole('button', { name: /button.createSection/i });
    act(() => {
      fireEvent.click(createButton);
    });
    await waitFor(() => {
      expect(screen.getByText('messages.errorCreatingSection')).toBeInTheDocument();
    });
  })

  it('should display errors when addSectionMutation returns field-level errors', async () => {
    const mockUpdateSection = jest.fn().mockResolvedValueOnce({
      data: {
        addSection: {
          errors: {
            general: 'Error adding section',
            name: 'Section name not in correct format',
          },
        },
      },
    });

    mockUseMutation.mockImplementation((document) => {
      if (document === AddSectionDocument) {
        /* eslint-disable @typescript-eslint/no-explicit-any */
        return [mockUpdateSection, { loading: false, error: undefined }] as any;
      }
      /* eslint-disable @typescript-eslint/no-explicit-any */
      return [jest.fn(), { loading: false, error: undefined }] as any;
    });

    await act(async () => {
      render(<CreateSectionPage />);
    });

    const sectionNameInput = screen.getByRole('textbox', { name: /sectionName/i });
    await act(async () => {
      fireEvent.change(sectionNameInput, { target: { value: 'Test Section' } });
    });

    const createButton = screen.getByRole('button', { name: /button.createSection/i });
    await act(async () => {
      fireEvent.click(createButton);
    });

    await waitFor(() => {
      // Check for the general error message
      expect(screen.getByText('Error adding section')).toBeInTheDocument();
      // Check for the sectionName field error
      expect(screen.getByText(/section name not in correct format/i)).toBeInTheDocument();
    });
  })


  it('should pass axe accessibility test', async () => {
    const { container } = render(
      <CreateSectionPage />
    );
    await act(async () => {
      const results = await axe(container);
      expect(results).toHaveNoViolations();
    });
  });
});
