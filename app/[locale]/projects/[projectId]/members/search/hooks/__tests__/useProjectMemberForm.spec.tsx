import { renderHook, act, waitFor } from '@testing-library/react';
import { MockedProvider } from '@apollo/client/testing/react';
import { ReactNode } from 'react';
import { useRouter } from 'next/navigation';
import { useProjectMemberForm } from '../useProjectMemberForm';
import { MemberRolesDocument, MemberRole } from '@/generated/graphql';
import { addProjectMemberAction } from '@/app/actions';
import { useToast } from '@/context/ToastContext';

// Mock translations
/* eslint-disable @typescript-eslint/no-explicit-any */
const mockTranslation = jest.fn((key: string, values?: Record<string, any>) => {
  if (values?.name) {
    return `${key} ${values.name}`;
  }
  return key;
});

jest.mock('next-intl', () => ({
  useTranslations: () => mockTranslation,
}));

// Mock next/navigation
const mockRouter = {
  push: jest.fn(),
};

jest.mock('next/navigation', () => ({
  useRouter: jest.fn(),
}));

// Mock toast context
const mockToast = {
  add: jest.fn(),
};

jest.mock('@/context/ToastContext', () => ({
  useToast: jest.fn(),
}));

// Mock addProjectMemberAction
jest.mock('@/app/actions', () => ({
  addProjectMemberAction: jest.fn(),
}));

// Test data
const mockMemberRoles: MemberRole[] = [
  {
    id: 1,
    label: 'Principal Investigator',
    uri: 'https://credit.niso.org/contributor-roles/conceptualization/',
    displayOrder: 1,
    description: 'Principal Investigator role',
  },
  {
    id: 2,
    label: 'Data Curator',
    uri: 'https://credit.niso.org/contributor-roles/data-curation/',
    displayOrder: 2,
    description: 'Data Curator role',
  },
  {
    id: 3,
    label: 'Project Administrator',
    uri: 'https://credit.niso.org/contributor-roles/project-administration/',
    displayOrder: 3,
    description: 'Project Administrator role',
  },
];

// Mock GraphQL responses
const successMemberRolesMocks = [
  {
    request: {
      query: MemberRolesDocument,
    },
    result: {
      data: {
        memberRoles: mockMemberRoles,
      },
    },
  },
];

const emptyMemberRolesMocks = [
  {
    request: {
      query: MemberRolesDocument,
    },
    result: {
      data: {
        memberRoles: [],
      },
    },
  },
];

const errorMemberRolesMocks = [
  {
    request: {
      query: MemberRolesDocument,
    },
    error: new Error('Network error'),
  },
];

const nullMemberRolesMocks = [
  {
    request: {
      query: MemberRolesDocument,
    },
    result: {
      data: {
        memberRoles: [mockMemberRoles[0], null, mockMemberRoles[1], null],
      },
    },
  },
];

// Test wrapper component
interface WrapperProps {
  children: ReactNode;
  mocks?: any[];
}

const createWrapper = (mocks: any[] = []) => {
  const Wrapper = ({ children }: WrapperProps) => (
    <MockedProvider
      mocks={mocks}
    >
      {children}
    </MockedProvider>
  );
  return Wrapper;
};

// Mock implementations
const mockAddProjectMemberAction = addProjectMemberAction as jest.MockedFunction<typeof addProjectMemberAction>;

describe('useProjectMemberForm', () => {
  const testProjectId = '123';

  beforeEach(() => {
    jest.clearAllMocks();
    mockTranslation.mockImplementation((key: string, values?: Record<string, any>) => {
      if (values?.name) {
        return `${key} ${values.name}`;
      }
      return key;
    });
    (useRouter as jest.Mock).mockReturnValue(mockRouter);
    (useToast as jest.Mock).mockReturnValue(mockToast);
  });

  afterEach(() => {
    jest.restoreAllMocks();
  });

  describe('Initial State', () => {
    it('should return initial state correctly', () => {
      const { result } = renderHook(() => useProjectMemberForm(testProjectId), {
        wrapper: createWrapper(successMemberRolesMocks),
      });

      expect(result.current.projectMember).toEqual({
        givenName: '',
        surName: '',
        affiliationId: '',
        affiliationName: '',
        otherAffiliationName: '',
        email: '',
        orcid: '',
      });
      expect(result.current.roles).toEqual([]);
      expect(result.current.errors).toEqual([]);
      expect(result.current.fieldErrors).toEqual({
        givenName: '',
        surName: '',
        affiliationId: '',
        affiliationName: '',
        email: '',
        projectRoles: '',
      });
    });

    it('should provide expected function signatures', () => {
      const { result } = renderHook(() => useProjectMemberForm(testProjectId), {
        wrapper: createWrapper(successMemberRolesMocks),
      });

      expect(typeof result.current.setProjectMember).toBe('function');
      expect(typeof result.current.handleCheckboxChange).toBe('function');
      expect(typeof result.current.handleFormSubmit).toBe('function');
      expect(typeof result.current.resetErrors).toBe('function');
      expect(typeof result.current.updateAffiliationFormData).toBe('function');
      expect(typeof result.current.clearAllFieldErrors).toBe('function');
      expect(typeof result.current.clearAllFormFields).toBe('function');
      expect(typeof result.current.setErrors).toBe('function');
    });

    it('should load member roles from GraphQL query', async () => {
      const { result } = renderHook(() => useProjectMemberForm(testProjectId), {
        wrapper: createWrapper(successMemberRolesMocks),
      });

      await waitFor(() => {
        expect(result.current.memberRoles).toEqual(mockMemberRoles);
      });
    });

    it('should filter out null member roles', async () => {
      const { result } = renderHook(() => useProjectMemberForm(testProjectId), {
        wrapper: createWrapper(nullMemberRolesMocks),
      });

      await waitFor(() => {
        expect(result.current.memberRoles).toEqual([mockMemberRoles[0], mockMemberRoles[1]]);
      });
    });

    it('should handle empty member roles data', async () => {
      const { result } = renderHook(() => useProjectMemberForm(testProjectId), {
        wrapper: createWrapper(emptyMemberRolesMocks),
      });

      await waitFor(() => {
        expect(result.current.memberRoles).toEqual([]);
      });
    });
  });

  describe('setProjectMember', () => {
    it('should update project member data', () => {
      const { result } = renderHook(() => useProjectMemberForm(testProjectId), {
        wrapper: createWrapper(successMemberRolesMocks),
      });

      const newMemberData = {
        givenName: 'John',
        surName: 'Doe',
        affiliationId: '123',
        affiliationName: 'University of Test',
        otherAffiliationName: '',
        email: 'john.doe@example.com',
        orcid: '0000-0000-0000-0000',
      };

      act(() => {
        result.current.setProjectMember(newMemberData);
      });

      expect(result.current.projectMember).toEqual(newMemberData);
    });

    it('should allow partial updates using function form', () => {
      const { result } = renderHook(() => useProjectMemberForm(testProjectId), {
        wrapper: createWrapper(successMemberRolesMocks),
      });

      // Set initial data
      act(() => {
        result.current.setProjectMember({
          givenName: 'John',
          surName: 'Doe',
          affiliationId: '',
          affiliationName: '',
          otherAffiliationName: '',
          email: '',
          orcid: '',
        });
      });

      // Update with function form
      act(() => {
        result.current.setProjectMember((prev) => ({
          ...prev,
          email: 'john.doe@example.com',
          orcid: '0000-0000-0000-0001',
        }));
      });

      expect(result.current.projectMember.givenName).toBe('John');
      expect(result.current.projectMember.surName).toBe('Doe');
      expect(result.current.projectMember.email).toBe('john.doe@example.com');
      expect(result.current.projectMember.orcid).toBe('0000-0000-0000-0001');
    });
  });

  describe('handleCheckboxChange', () => {
    it('should update roles and reset errors', () => {
      const { result } = renderHook(() => useProjectMemberForm(testProjectId), {
        wrapper: createWrapper(successMemberRolesMocks),
      });

      // Set some errors first
      act(() => {
        result.current.setErrors(['Some error']);
      });

      // Update roles
      act(() => {
        result.current.handleCheckboxChange(['1', '2']);
      });

      expect(result.current.roles).toEqual(['1', '2']);
      expect(result.current.errors).toEqual([]);
    });

    it('should handle empty role selection', () => {
      const { result } = renderHook(() => useProjectMemberForm(testProjectId), {
        wrapper: createWrapper(successMemberRolesMocks),
      });

      // Set initial roles
      act(() => {
        result.current.handleCheckboxChange(['1', '2']);
      });

      // Clear roles
      act(() => {
        result.current.handleCheckboxChange([]);
      });

      expect(result.current.roles).toEqual([]);
    });
  });

  describe('updateAffiliationFormData', () => {
    it('should update affiliation data and reset errors', async () => {
      const { result } = renderHook(() => useProjectMemberForm(testProjectId), {
        wrapper: createWrapper(successMemberRolesMocks),
      });

      // Set some errors first
      act(() => {
        result.current.setErrors(['Some error']);
      });

      await act(async () => {
        await result.current.updateAffiliationFormData('123', 'University of Test');
      });

      expect(result.current.projectMember.affiliationId).toBe('123');
      expect(result.current.projectMember.affiliationName).toBe('University of Test');
      expect(result.current.errors).toEqual([]);
    });

    it('should handle empty values', async () => {
      const { result } = renderHook(() => useProjectMemberForm(testProjectId), {
        wrapper: createWrapper(successMemberRolesMocks),
      });

      await act(async () => {
        await result.current.updateAffiliationFormData('', '');
      });

      expect(result.current.projectMember.affiliationId).toBe('');
      expect(result.current.projectMember.affiliationName).toBe('');
    });
  });

  describe('resetErrors', () => {
    it('should clear both errors and field errors', () => {
      const { result } = renderHook(() => useProjectMemberForm(testProjectId), {
        wrapper: createWrapper(successMemberRolesMocks),
      });

      // Set errors and field errors
      act(() => {
        result.current.setErrors(['Some error']);
        // Note: We can't directly set fieldErrors in the hook, but we can test through validation
      });

      act(() => {
        result.current.resetErrors();
      });

      expect(result.current.errors).toEqual([]);
      expect(result.current.fieldErrors).toEqual({
        givenName: '',
        surName: '',
        affiliationId: '',
        affiliationName: '',
        email: '',
        projectRoles: '',
      });
    });
  });

  describe('clearAllFieldErrors', () => {
    it('should reset all field errors to empty strings', () => {
      const { result } = renderHook(() => useProjectMemberForm(testProjectId), {
        wrapper: createWrapper(successMemberRolesMocks),
      });

      act(() => {
        result.current.clearAllFieldErrors();
      });

      expect(result.current.fieldErrors).toEqual({
        givenName: '',
        surName: '',
        affiliationId: '',
        affiliationName: '',
        email: '',
        projectRoles: '',
      });
    });
  });

  describe('clearAllFormFields', () => {
    it('should reset project member data and roles to initial state', () => {
      const { result } = renderHook(() => useProjectMemberForm(testProjectId), {
        wrapper: createWrapper(successMemberRolesMocks),
      });

      // Set some data first
      act(() => {
        result.current.setProjectMember({
          givenName: 'John',
          surName: 'Doe',
          affiliationId: '123',
          affiliationName: 'University',
          otherAffiliationName: 'Other Uni',
          email: 'john@example.com',
          orcid: '0000-0000-0000-0000',
        });
        result.current.handleCheckboxChange(['1', '2']);
      });

      // Clear all fields
      act(() => {
        result.current.clearAllFormFields();
      });

      expect(result.current.projectMember).toEqual({
        givenName: '',
        surName: '',
        affiliationId: '',
        affiliationName: '',
        otherAffiliationName: '',
        email: '',
        orcid: '',
      });
      expect(result.current.roles).toEqual([]);
    });
  });

  describe('Form Validation', () => {
    it('should validate required fields', async () => {
      const { result } = renderHook(() => useProjectMemberForm(testProjectId), {
        wrapper: createWrapper(successMemberRolesMocks),
      });

      const mockFormEvent = {
        preventDefault: jest.fn(),
      } as unknown as React.FormEvent;

      await act(async () => {
        await result.current.handleFormSubmit(mockFormEvent);
      });

      expect(mockFormEvent.preventDefault).toHaveBeenCalled();
      expect(result.current.errors).toContain('messaging.errors.givenNameRequired');
      expect(mockTranslation).toHaveBeenCalledWith('messaging.errors.givenNameRequired');
    });

    it('should validate email format', async () => {
      const { result } = renderHook(() => useProjectMemberForm(testProjectId), {
        wrapper: createWrapper(successMemberRolesMocks),
      });

      // Set valid required fields but invalid email
      act(() => {
        result.current.setProjectMember({
          givenName: 'John',
          surName: 'Doe',
          affiliationId: '',
          affiliationName: 'University',
          otherAffiliationName: '',
          email: 'invalid-email',
          orcid: '',
        });
        result.current.handleCheckboxChange(['1']);
      });

      const mockFormEvent = {
        preventDefault: jest.fn(),
      } as unknown as React.FormEvent;

      await act(async () => {
        await result.current.handleFormSubmit(mockFormEvent);
      });

      expect(mockTranslation).toHaveBeenCalledWith('messaging.errors.invalidEmail');
    });

    it('should not validate email if empty', async () => {
      const { result } = renderHook(() => useProjectMemberForm(testProjectId), {
        wrapper: createWrapper(successMemberRolesMocks),
      });

      // Set valid required fields with empty email
      act(() => {
        result.current.setProjectMember({
          givenName: 'John',
          surName: 'Doe',
          affiliationId: '',
          affiliationName: 'University',
          otherAffiliationName: '',
          email: '',
          orcid: '',
        });
        result.current.handleCheckboxChange(['1']);
      });

      mockAddProjectMemberAction.mockResolvedValue({
        success: true,
        data: { id: 1 },
        redirect: '/projects/123/members',
      });

      const mockFormEvent = {
        preventDefault: jest.fn(),
      } as unknown as React.FormEvent;

      await act(async () => {
        await result.current.handleFormSubmit(mockFormEvent);
      });

      // Should not have email validation error
      expect(mockTranslation).not.toHaveBeenCalledWith('messaging.errors.invalidEmail');
      expect(mockAddProjectMemberAction).toHaveBeenCalled();
    });

    it('should validate that at least one role is selected', async () => {
      const { result } = renderHook(() => useProjectMemberForm(testProjectId), {
        wrapper: createWrapper(successMemberRolesMocks),
      });

      // Set valid required fields but no roles
      act(() => {
        result.current.setProjectMember({
          givenName: 'John',
          surName: 'Doe',
          affiliationId: '',
          affiliationName: 'University',
          otherAffiliationName: '',
          email: '',
          orcid: '',
        });
      });

      const mockFormEvent = {
        preventDefault: jest.fn(),
      } as unknown as React.FormEvent;

      await act(async () => {
        await result.current.handleFormSubmit(mockFormEvent);
      });

      expect(mockTranslation).toHaveBeenCalledWith('messaging.errors.projectRolesRequired');
    });
  });

  describe('Form Submission', () => {
    it('should submit form with valid data and redirect on success', async () => {
      const { result } = renderHook(() => useProjectMemberForm(testProjectId), {
        wrapper: createWrapper(successMemberRolesMocks),
      });

      // Set valid form data
      act(() => {
        result.current.setProjectMember({
          givenName: 'John',
          surName: 'Doe',
          affiliationId: '123',
          affiliationName: 'University of Test',
          otherAffiliationName: '',
          email: 'john.doe@example.com',
          orcid: '0000-0000-0000-0000',
        });
        result.current.handleCheckboxChange(['1', '2']);
      });

      mockAddProjectMemberAction.mockResolvedValue({
        success: true,
        data: { id: 1 },
        redirect: '/projects/123/members',
      });

      const mockFormEvent = {
        preventDefault: jest.fn(),
      } as unknown as React.FormEvent;

      await act(async () => {
        await result.current.handleFormSubmit(mockFormEvent);
      });

      expect(mockFormEvent.preventDefault).toHaveBeenCalled();
      expect(mockAddProjectMemberAction).toHaveBeenCalledWith({
        projectId: 123,
        givenName: 'John',
        surName: 'Doe',
        email: 'john.doe@example.com',
        orcid: '0000-0000-0000-0000',
        affiliationName: 'University of Test',
        affiliationId: '123',
        memberRoleIds: [1, 2],
      });
      expect(mockRouter.push).toHaveBeenCalledWith('/projects/123/members');
    });

    it('should use otherAffiliationName when provided', async () => {
      const { result } = renderHook(() => useProjectMemberForm(testProjectId), {
        wrapper: createWrapper(successMemberRolesMocks),
      });

      // Set valid form data with otherAffiliationName
      act(() => {
        result.current.setProjectMember({
          givenName: 'John',
          surName: 'Doe',
          affiliationId: '123',
          affiliationName: 'University of Test',
          otherAffiliationName: 'Other University',
          email: 'john.doe@example.com',
          orcid: '0000-0000-0000-0000',
        });
        result.current.handleCheckboxChange(['1']);
      });

      mockAddProjectMemberAction.mockResolvedValue({
        success: true,
        data: { id: 1 },
      });

      const mockFormEvent = {
        preventDefault: jest.fn(),
      } as unknown as React.FormEvent;

      await act(async () => {
        await result.current.handleFormSubmit(mockFormEvent);
      });

      expect(mockAddProjectMemberAction).toHaveBeenCalledWith(
        expect.objectContaining({
          affiliationName: 'Other University',
        })
      );
    });

    it('should handle redirect response from action', async () => {
      const { result } = renderHook(() => useProjectMemberForm(testProjectId), {
        wrapper: createWrapper(successMemberRolesMocks),
      });

      // Set valid form data
      act(() => {
        result.current.setProjectMember({
          givenName: 'John',
          surName: 'Doe',
          affiliationId: '',
          affiliationName: 'University',
          otherAffiliationName: '',
          email: '',
          orcid: '',
        });
        result.current.handleCheckboxChange(['1']);
      });

      mockAddProjectMemberAction.mockResolvedValue({
        success: false,
        redirect: '/some-redirect-path',
      });

      const mockFormEvent = {
        preventDefault: jest.fn(),
      } as unknown as React.FormEvent;

      await act(async () => {
        await result.current.handleFormSubmit(mockFormEvent);
      });

      expect(mockRouter.push).toHaveBeenCalledWith('/some-redirect-path');
    });

    it('should handle general errors from action', async () => {
      const { result } = renderHook(() => useProjectMemberForm(testProjectId), {
        wrapper: createWrapper(successMemberRolesMocks),
      });

      // Set valid form data
      act(() => {
        result.current.setProjectMember({
          givenName: 'John',
          surName: 'Doe',
          affiliationId: '',
          affiliationName: 'University',
          otherAffiliationName: '',
          email: '',
          orcid: '',
        });
        result.current.handleCheckboxChange(['1']);
      });

      mockAddProjectMemberAction.mockResolvedValue({
        success: false,
        errors: ['Network error', 'Validation error'],
      });

      const mockFormEvent = {
        preventDefault: jest.fn(),
      } as unknown as React.FormEvent;

      await act(async () => {
        await result.current.handleFormSubmit(mockFormEvent);
      });

      expect(result.current.errors).toEqual(['Network error', 'Validation error']);
    });

    it('should handle field-specific errors from action', async () => {
      const { result } = renderHook(() => useProjectMemberForm(testProjectId), {
        wrapper: createWrapper(successMemberRolesMocks),
      });

      // Set valid form data
      act(() => {
        result.current.setProjectMember({
          givenName: 'John',
          surName: 'Doe',
          affiliationId: '',
          affiliationName: 'University',
          otherAffiliationName: '',
          email: '',
          orcid: '',
        });
        result.current.handleCheckboxChange(['1']);
      });

      mockAddProjectMemberAction.mockResolvedValue({
        success: true,
        data: {
          errors: {
            email: 'Email already exists',
            givenName: 'Invalid name',
            general: null,
          },
        },
      });

      const mockFormEvent = {
        preventDefault: jest.fn(),
      } as unknown as React.FormEvent;

      await act(async () => {
        await result.current.handleFormSubmit(mockFormEvent);
      });

      // Should extract and set field errors
      expect(result.current.errors).toContain('Email already exists');
      expect(result.current.errors).toContain('Invalid name');
    });

    it('should show success toast and redirect on successful submission', async () => {
      const { result } = renderHook(() => useProjectMemberForm(testProjectId), {
        wrapper: createWrapper(successMemberRolesMocks),
      });

      // Set valid form data
      act(() => {
        result.current.setProjectMember({
          givenName: 'John',
          surName: 'Doe',
          affiliationId: '',
          affiliationName: 'University',
          otherAffiliationName: '',
          email: '',
          orcid: '',
        });
        result.current.handleCheckboxChange(['1']);
      });

      mockAddProjectMemberAction.mockResolvedValue({
        success: true,
        data: { id: 1 },
      });

      const mockFormEvent = {
        preventDefault: jest.fn(),
      } as unknown as React.FormEvent;

      await act(async () => {
        await result.current.handleFormSubmit(mockFormEvent);
      });

      expect(mockToast.add).toHaveBeenCalledWith(
        'messaging.success.addedProjectMember John Doe',
        { type: 'success' }
      );
      expect(mockRouter.push).toHaveBeenCalledWith('/en-US/projects/123/members');
    });

    it('should handle default error message when no specific errors provided', async () => {
      const { result } = renderHook(() => useProjectMemberForm(testProjectId), {
        wrapper: createWrapper(successMemberRolesMocks),
      });

      // Set valid form data
      act(() => {
        result.current.setProjectMember({
          givenName: 'John',
          surName: 'Doe',
          affiliationId: '',
          affiliationName: 'University',
          otherAffiliationName: '',
          email: '',
          orcid: '',
        });
        result.current.handleCheckboxChange(['1']);
      });

      mockAddProjectMemberAction.mockResolvedValue({
        success: false,
        errors: [],
      });

      const mockFormEvent = {
        preventDefault: jest.fn(),
      } as unknown as React.FormEvent;

      await act(async () => {
        await result.current.handleFormSubmit(mockFormEvent);
      });

      expect(result.current.errors).toContain('messaging.errors.failedToAddProjectMember');
    });
  });

  describe('setErrors', () => {
    it('should allow setting custom errors', () => {
      const { result } = renderHook(() => useProjectMemberForm(testProjectId), {
        wrapper: createWrapper(successMemberRolesMocks),
      });

      act(() => {
        result.current.setErrors(['Custom error 1', 'Custom error 2']);
      });

      expect(result.current.errors).toEqual(['Custom error 1', 'Custom error 2']);
    });
  });

  describe('Edge Cases and Error Handling', () => {
    it('should handle GraphQL query errors gracefully', () => {
      const { result } = renderHook(() => useProjectMemberForm(testProjectId), {
        wrapper: createWrapper(errorMemberRolesMocks),
      });

      // Should still have empty array for member roles on error
      expect(result.current.memberRoles).toEqual([]);
    });

    it('should handle null memberRoles data', () => {
      const nullDataMemberRolesMocks = [
        {
          request: {
            query: MemberRolesDocument,
          },
          result: {
            data: {
              memberRoles: null,
            },
          },
        },
      ];

      const { result } = renderHook(() => useProjectMemberForm(testProjectId), {
        wrapper: createWrapper(nullDataMemberRolesMocks),
      });

      expect(result.current.memberRoles).toEqual([]);
    });

    it('should handle string role IDs correctly', async () => {
      const { result } = renderHook(() => useProjectMemberForm(testProjectId), {
        wrapper: createWrapper(successMemberRolesMocks),
      });

      // Set valid form data with string role IDs
      act(() => {
        result.current.setProjectMember({
          givenName: 'John',
          surName: 'Doe',
          affiliationId: '',
          affiliationName: 'University',
          otherAffiliationName: '',
          email: '',
          orcid: '',
        });
        result.current.handleCheckboxChange(['1', '2', '3']);
      });

      mockAddProjectMemberAction.mockResolvedValue({
        success: true,
        data: { id: 1 },
      });

      const mockFormEvent = {
        preventDefault: jest.fn(),
      } as unknown as React.FormEvent;

      await act(async () => {
        await result.current.handleFormSubmit(mockFormEvent);
      });

      expect(mockAddProjectMemberAction).toHaveBeenCalledWith(
        expect.objectContaining({
          memberRoleIds: [1, 2, 3], // Should be converted to numbers
        })
      );
    });

    it('should handle whitespace-only field values correctly', async () => {
      const { result } = renderHook(() => useProjectMemberForm(testProjectId), {
        wrapper: createWrapper(successMemberRolesMocks),
      });

      // Set form data with whitespace-only values
      act(() => {
        result.current.setProjectMember({
          givenName: '   ',
          surName: '   ',
          affiliationId: '',
          affiliationName: '   ',
          otherAffiliationName: '',
          email: '   ',
          orcid: '',
        });
        result.current.handleCheckboxChange([]);
      });

      const mockFormEvent = {
        preventDefault: jest.fn(),
      } as unknown as React.FormEvent;

      await act(async () => {
        await result.current.handleFormSubmit(mockFormEvent);
      });

      // Should treat whitespace-only values as empty and trigger validation errors
      expect(mockTranslation).toHaveBeenCalledWith('messaging.errors.givenNameRequired');
      expect(mockTranslation).toHaveBeenCalledWith('messaging.errors.surNameRequired');
      expect(mockTranslation).toHaveBeenCalledWith('messaging.errors.affiliationRequired');
      expect(mockTranslation).toHaveBeenCalledWith('messaging.errors.projectRolesRequired');
    });
  });

  describe('Integration Tests', () => {
    it('should handle complete form workflow', async () => {
      const { result } = renderHook(() => useProjectMemberForm(testProjectId), {
        wrapper: createWrapper(successMemberRolesMocks),
      });

      // Initial state
      expect(result.current.projectMember.givenName).toBe('');
      expect(result.current.roles).toEqual([]);

      // Set form data
      act(() => {
        result.current.setProjectMember({
          givenName: 'John',
          surName: 'Doe',
          affiliationId: '123',
          affiliationName: 'University of Test',
          otherAffiliationName: '',
          email: 'john.doe@example.com',
          orcid: '0000-0000-0000-0000',
        });
      });

      // Set roles
      act(() => {
        result.current.handleCheckboxChange(['1', '2']);
      });

      // Update affiliation
      await act(async () => {
        await result.current.updateAffiliationFormData('456', 'New University');
      });

      expect(result.current.projectMember.affiliationId).toBe('456');
      expect(result.current.projectMember.affiliationName).toBe('New University');

      // Mock successful submission
      mockAddProjectMemberAction.mockResolvedValue({
        success: true,
        data: { id: 1 },
      });

      // Submit form
      const mockFormEvent = {
        preventDefault: jest.fn(),
      } as unknown as React.FormEvent;

      await act(async () => {
        await result.current.handleFormSubmit(mockFormEvent);
      });

      expect(mockAddProjectMemberAction).toHaveBeenCalledWith({
        projectId: 123,
        givenName: 'John',
        surName: 'Doe',
        email: 'john.doe@example.com',
        orcid: '0000-0000-0000-0000',
        affiliationName: 'New University',
        affiliationId: '456',
        memberRoleIds: [1, 2],
      });

      expect(mockToast.add).toHaveBeenCalledWith(
        'messaging.success.addedProjectMember John Doe',
        { type: 'success' }
      );
      expect(mockRouter.push).toHaveBeenCalledWith('/en-US/projects/123/members');
    });

    it('should handle error recovery workflow', async () => {
      const { result } = renderHook(() => useProjectMemberForm(testProjectId), {
        wrapper: createWrapper(successMemberRolesMocks),
      });

      // Set invalid form data
      act(() => {
        result.current.setProjectMember({
          givenName: '',
          surName: '',
          affiliationId: '',
          affiliationName: '',
          otherAffiliationName: '',
          email: 'invalid-email',
          orcid: '',
        });
      });

      // Submit with validation errors
      const mockFormEvent = {
        preventDefault: jest.fn(),
      } as unknown as React.FormEvent;

      await act(async () => {
        await result.current.handleFormSubmit(mockFormEvent);
      });

      expect(result.current.errors.length).toBeGreaterThan(0);

      // Clear errors and set valid data
      act(() => {
        result.current.resetErrors();
        result.current.setProjectMember({
          givenName: 'John',
          surName: 'Doe',
          affiliationId: '',
          affiliationName: 'University',
          otherAffiliationName: '',
          email: 'john.doe@example.com',
          orcid: '',
        });
        result.current.handleCheckboxChange(['1']);
      });

      expect(result.current.errors).toEqual([]);

      // Submit with valid data
      mockAddProjectMemberAction.mockResolvedValue({
        success: true,
        data: { id: 1 },
      });

      await act(async () => {
        await result.current.handleFormSubmit(mockFormEvent);
      });

      expect(mockAddProjectMemberAction).toHaveBeenCalled();
      expect(mockToast.add).toHaveBeenCalled();
    });

    it('should handle form reset workflow', async () => {
      const { result } = renderHook(() => useProjectMemberForm(testProjectId), {
        wrapper: createWrapper(successMemberRolesMocks),
      });

      // Set form data and roles
      act(() => {
        result.current.setProjectMember({
          givenName: 'John',
          surName: 'Doe',
          affiliationId: '123',
          affiliationName: 'University',
          otherAffiliationName: 'Other Uni',
          email: 'john@example.com',
          orcid: '0000-0000-0000-0000',
        });
        result.current.handleCheckboxChange(['1', '2']);
        result.current.setErrors(['Some error']);
      });

      // Verify data is set
      expect(result.current.projectMember.givenName).toBe('John');
      expect(result.current.roles).toEqual(['1', '2']);
      expect(result.current.errors).toEqual(['Some error']);

      // Clear all form fields
      act(() => {
        result.current.clearAllFormFields();
      });

      expect(result.current.projectMember).toEqual({
        givenName: '',
        surName: '',
        affiliationId: '',
        affiliationName: '',
        otherAffiliationName: '',
        email: '',
        orcid: '',
      });
      expect(result.current.roles).toEqual([]);

      // Clear errors
      act(() => {
        result.current.resetErrors();
      });

      expect(result.current.errors).toEqual([]);
      expect(result.current.fieldErrors).toEqual({
        givenName: '',
        surName: '',
        affiliationId: '',
        affiliationName: '',
        email: '',
        projectRoles: '',
      });
    });
  });
});