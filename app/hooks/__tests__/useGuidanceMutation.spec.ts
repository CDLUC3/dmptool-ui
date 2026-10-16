import { renderHook, act } from '@testing-library/react';
import { useGuidanceMutations } from '../useGuidanceMutations';
import { useMutation } from '@apollo/client/react';
import {
  AddPlanGuidanceDocument,
  RemovePlanGuidanceDocument,
  AffiliationSearch,
} from '@/generated/graphql';
import logECS from '@/utils/clientLogger';

// Mock Apollo Client hooks
jest.mock('@apollo/client/react', () => ({
  useMutation: jest.fn(),
}));

const mockTranslationFn = jest.fn((key: string) => key);

jest.mock('next-intl', () => ({
  useTranslations: jest.fn(() => mockTranslationFn), // Same function every time!
}));

// Mock logger
jest.mock('@/utils/clientLogger', () => ({
  __esModule: true,
  default: jest.fn(),
}));

const mockUseMutation = jest.mocked(useMutation);
const mockLogECS = jest.mocked(logECS);

describe('useGuidanceMutations', () => {
  const defaultProps = {
    planId: 123,
    versionedSectionId: 456,
  };

  const mockAffiliation: AffiliationSearch = {
    uri: 'https://ror.org/03yrm5c26',
    displayName: 'California Digital Library',
    funder: false,
    id: 1,
    name: 'California Digital Library'
  };

  let mockAddMutation: jest.Mock;
  let mockRemoveMutation: jest.Mock;

  beforeEach(() => {
    jest.clearAllMocks();

    // Create mock mutation functions
    mockAddMutation = jest.fn().mockResolvedValue({ data: { success: true } });
    mockRemoveMutation = jest.fn().mockResolvedValue({ data: { success: true } });

    // Setup useMutation mock
    mockUseMutation.mockImplementation((document) => {
      if (document === AddPlanGuidanceDocument) {
        /* eslint-disable @typescript-eslint/no-explicit-any */
        return [mockAddMutation, { loading: false, error: null }] as any;
      }
      if (document === RemovePlanGuidanceDocument) {
        /* eslint-disable @typescript-eslint/no-explicit-any */
        return [mockRemoveMutation, { loading: false, error: null }] as any;
      }
      /* eslint-disable @typescript-eslint/no-explicit-any */
      return [jest.fn(), { loading: false, error: null }] as any;
    });
  });

  describe('Hook initialization', () => {
    it('should return all expected functions and values', () => {
      const { result } = renderHook(() => useGuidanceMutations(defaultProps));

      expect(result.current.addGuidanceOrganization).toBeInstanceOf(Function);
      expect(result.current.removeGuidanceOrganization).toBeInstanceOf(Function);
      expect(result.current.clearError).toBeInstanceOf(Function);
      expect(result.current.guidanceError).toBeNull();
      expect(result.current.isAdding).toBe(false);
      expect(result.current.isRemoving).toBe(false);
      expect(result.current.isMutating).toBe(false);
    });

    it('should initialize mutations with correct refetchQueries', () => {
      renderHook(() => useGuidanceMutations(defaultProps));

      // Check AddPlanGuidance mutation
      expect(mockUseMutation).toHaveBeenCalledWith(
        AddPlanGuidanceDocument,
        expect.objectContaining({
          refetchQueries: [
            {
              query: expect.anything(),
              variables: {
                planId: 123,
                versionedSectionId: 456,
                versionedQuestionId: undefined,
                customSectionId: undefined,
              },
            },
          ],
          awaitRefetchQueries: true,
        })
      );

      // Check RemovePlanGuidance mutation
      expect(mockUseMutation).toHaveBeenCalledWith(
        RemovePlanGuidanceDocument,
        expect.objectContaining({
          refetchQueries: [
            {
              query: expect.anything(),
              variables: {
                planId: 123,
                versionedSectionId: 456,
                versionedQuestionId: undefined,
                customSectionId: undefined,
              },
            },
          ],
          awaitRefetchQueries: true,
        })
      );
    });

    it('should pass versionedQuestionId when provided', () => {
      const props = {
        planId: 123,
        versionedQuestionId: 789,
      };

      renderHook(() => useGuidanceMutations(props));

      expect(mockUseMutation).toHaveBeenCalledWith(
        AddPlanGuidanceDocument,
        expect.objectContaining({
          refetchQueries: [
            {
              query: expect.anything(),
              variables: {
                planId: 123,
                versionedSectionId: undefined,
                versionedQuestionId: 789,
                customSectionId: undefined,
              },
            },
          ],
        })
      );
    });

    it('should pass customSectionId and clear versionedSectionId when customSectionId is provided', () => {
      const props = {
        planId: 123,
        versionedSectionId: 456,
        customSectionId: 789,
      };

      renderHook(() => useGuidanceMutations(props));

      expect(mockUseMutation).toHaveBeenCalledWith(
        AddPlanGuidanceDocument,
        expect.objectContaining({
          refetchQueries: [
            {
              query: expect.anything(),
              variables: {
                planId: 123,
                versionedSectionId: undefined,
                versionedQuestionId: undefined,
                customSectionId: 789,
              },
            },
          ],
        })
      );

      expect(mockUseMutation).toHaveBeenCalledWith(
        RemovePlanGuidanceDocument,
        expect.objectContaining({
          refetchQueries: [
            {
              query: expect.anything(),
              variables: {
                planId: 123,
                versionedSectionId: undefined,
                versionedQuestionId: undefined,
                customSectionId: 789,
              },
            },
          ],
        })
      );
    });
  });

  describe('addGuidanceOrganization', () => {
    it('should successfully add a guidance organization', async () => {
      const { result } = renderHook(() => useGuidanceMutations(defaultProps));

      await act(async () => {
        await result.current.addGuidanceOrganization(mockAffiliation);
      });

      expect(mockAddMutation).toHaveBeenCalledWith({
        variables: {
          planId: 123,
          affiliationId: 'https://ror.org/03yrm5c26',
        },
      });

      expect(result.current.guidanceError).toBeNull();

      expect(mockLogECS).toHaveBeenCalledWith(
        'info',
        'Successfully added guidance organization: California Digital Library',
        expect.objectContaining({
          source: 'addGuidanceOrganization: useGuidanceMutations hook',
          planId: 123,
          affiliationId: 'https://ror.org/03yrm5c26',
        })
      );
    });

    it('should set error when affiliation has no URI', async () => {
      const { result } = renderHook(() => useGuidanceMutations(defaultProps));

      const affiliationWithoutUri: AffiliationSearch = {
        ...mockAffiliation,
        uri: ''
      };

      await act(async () => {
        await result.current.addGuidanceOrganization(affiliationWithoutUri);
      });

      expect(mockAddMutation).not.toHaveBeenCalled();
      expect(result.current.guidanceError).toBe('messages.errors.unableToAddOrganization');

      expect(mockLogECS).toHaveBeenCalledWith(
        'error',
        'No URI for affiliation when attempting to add guidance organization',
        expect.objectContaining({
          source: 'addGuidanceOrganization: useGuidanceMutations hook',
        })
      );
    });

    it('should handle mutation errors', async () => {
      const mutationError = new Error('Network error');
      mockAddMutation.mockRejectedValueOnce(mutationError);

      const { result } = renderHook(() => useGuidanceMutations(defaultProps));

      await act(async () => {
        await result.current.addGuidanceOrganization(mockAffiliation);
      });

      expect(result.current.guidanceError).toBe('messages.errors.unableToAddOrganization');

      expect(mockLogECS).toHaveBeenCalledWith(
        'error',
        'Error adding guidance organization in useGuidanceMutations hook',
        expect.objectContaining({
          source: 'addGuidanceOrganization: useGuidanceMutations hook',
          errors: mutationError,
          planId: 123,
          affiliationId: 'https://ror.org/03yrm5c26',
        })
      );
    });

    it('should clear previous errors before adding', async () => {
      const { result } = renderHook(() => useGuidanceMutations(defaultProps));

      // First, create an error
      const affiliationWithoutUri: AffiliationSearch = {
        ...mockAffiliation,
        uri: ''
      };

      await act(async () => {
        await result.current.addGuidanceOrganization(affiliationWithoutUri);
      });

      expect(result.current.guidanceError).toBe('messages.errors.unableToAddOrganization');

      // Then, successfully add
      await act(async () => {
        await result.current.addGuidanceOrganization(mockAffiliation);
      });

      expect(result.current.guidanceError).toBeNull();
    });
  });

  describe('removeGuidanceOrganization', () => {
    it('should successfully remove a guidance organization', async () => {
      const { result } = renderHook(() => useGuidanceMutations(defaultProps));

      await act(async () => {
        await result.current.removeGuidanceOrganization('https://ror.org/03yrm5c26');
      });

      expect(mockRemoveMutation).toHaveBeenCalledWith({
        variables: {
          planId: 123,
          affiliationId: 'https://ror.org/03yrm5c26',
        },
      });

      expect(result.current.guidanceError).toBeNull();

      expect(mockLogECS).toHaveBeenCalledWith(
        'info',
        'Successfully removed guidance organization: https://ror.org/03yrm5c26',
        expect.objectContaining({
          source: 'removeGuidanceOrganization: useGuidanceMutations hook',
          planId: 123,
          affiliationId: 'https://ror.org/03yrm5c26',
        })
      );
    });

    it('should handle mutation errors', async () => {
      const mutationError = new Error('GraphQL error');
      mockRemoveMutation.mockRejectedValueOnce(mutationError);

      const { result } = renderHook(() => useGuidanceMutations(defaultProps));

      await act(async () => {
        await result.current.removeGuidanceOrganization('https://ror.org/03yrm5c26');
      });

      expect(result.current.guidanceError).toBe('messages.errors.unableToRemoveOrganization');

      expect(mockLogECS).toHaveBeenCalledWith(
        'error',
        'Error removing guidance organization in useGuidanceMutations hook',
        expect.objectContaining({
          source: 'removeGuidanceOrganization: useGuidanceMutations hook',
          errors: mutationError,
          planId: 123,
          affiliationId: 'https://ror.org/03yrm5c26',
        })
      );
    });

    it('should clear previous errors before removing', async () => {
      const mutationError = new Error('First error');
      mockRemoveMutation.mockRejectedValueOnce(mutationError);

      const { result } = renderHook(() => useGuidanceMutations(defaultProps));

      // First, create an error
      await act(async () => {
        await result.current.removeGuidanceOrganization('https://ror.org/03yrm5c26');
      });

      expect(result.current.guidanceError).toBe('messages.errors.unableToRemoveOrganization');

      // Then, successfully remove (reset mock to succeed)
      mockRemoveMutation.mockResolvedValueOnce({ data: { success: true } });

      await act(async () => {
        await result.current.removeGuidanceOrganization('https://ror.org/04xm1d337');
      });

      expect(result.current.guidanceError).toBeNull();
    });
  });

  describe('clearError', () => {
    it('should clear the error state', async () => {
      const { result } = renderHook(() => useGuidanceMutations(defaultProps));

      // First, create an error
      const affiliationWithoutUri: AffiliationSearch = {
        ...mockAffiliation,
        uri: ''
      };

      await act(async () => {
        await result.current.addGuidanceOrganization(affiliationWithoutUri);
      });

      expect(result.current.guidanceError).toBe('messages.errors.unableToAddOrganization');

      // Clear the error
      act(() => {
        result.current.clearError();
      });

      expect(result.current.guidanceError).toBeNull();
    });

    it('should be safe to call when no error exists', () => {
      const { result } = renderHook(() => useGuidanceMutations(defaultProps));

      expect(result.current.guidanceError).toBeNull();

      act(() => {
        result.current.clearError();
      });

      expect(result.current.guidanceError).toBeNull();
    });
  });

  describe('Loading states', () => {
    it('should track isAdding state', () => {
      mockUseMutation.mockImplementation((document) => {
        if (document === AddPlanGuidanceDocument) {
          /* eslint-disable @typescript-eslint/no-explicit-any */
          return [mockAddMutation, { loading: true, error: undefined }] as any;
        }
        /* eslint-disable @typescript-eslint/no-explicit-any */
        return [mockRemoveMutation, { loading: false, error: undefined }] as any;
      });

      const { result } = renderHook(() => useGuidanceMutations(defaultProps));

      expect(result.current.isAdding).toBe(true);
      expect(result.current.isRemoving).toBe(false);
      expect(result.current.isMutating).toBe(true);
    });

    it('should track isRemoving state', () => {
      mockUseMutation.mockImplementation((document) => {
        if (document === AddPlanGuidanceDocument) {
          /* eslint-disable @typescript-eslint/no-explicit-any */
          return [mockAddMutation, { loading: false, error: undefined }] as any;
        }
        /* eslint-disable @typescript-eslint/no-explicit-any */
        return [mockRemoveMutation, { loading: true, error: undefined }] as any;
      });

      const { result } = renderHook(() => useGuidanceMutations(defaultProps));

      expect(result.current.isAdding).toBe(false);
      expect(result.current.isRemoving).toBe(true);
      expect(result.current.isMutating).toBe(true);
    });

    it('should track isMutating when both are loading', () => {
      mockUseMutation.mockImplementation(() => {
        /* eslint-disable @typescript-eslint/no-explicit-any */
        return [jest.fn(), { loading: true, error: undefined }] as any;
      });

      const { result } = renderHook(() => useGuidanceMutations(defaultProps));

      expect(result.current.isAdding).toBe(true);
      expect(result.current.isRemoving).toBe(true);
      expect(result.current.isMutating).toBe(true);
    });

    it('should set isMutating to false when neither is loading', () => {
      const { result } = renderHook(() => useGuidanceMutations(defaultProps));

      expect(result.current.isAdding).toBe(false);
      expect(result.current.isRemoving).toBe(false);
      expect(result.current.isMutating).toBe(false);
    });
  });

  describe('Function stability (useCallback)', () => {
    it('should maintain stable function references', () => {
      const { result, rerender } = renderHook(() => useGuidanceMutations(defaultProps));

      const firstAddRef = result.current.addGuidanceOrganization;
      const firstRemoveRef = result.current.removeGuidanceOrganization;
      const firstClearRef = result.current.clearError;

      rerender();

      expect(result.current.addGuidanceOrganization).toBe(firstAddRef);
      expect(result.current.removeGuidanceOrganization).toBe(firstRemoveRef);
      expect(result.current.clearError).toBe(firstClearRef);
    });

    it('should update functions when dependencies change', () => {
      const { result, rerender } = renderHook(
        (props) => useGuidanceMutations(props),
        { initialProps: defaultProps }
      );

      const firstAddRef = result.current.addGuidanceOrganization;

      // Change planId (which is a dependency of useCallback)
      rerender({ planId: 456, versionedSectionId: 789 });

      // Function reference should change because dependencies changed
      expect(result.current.addGuidanceOrganization).not.toBe(firstAddRef);
    });
  });

  describe('Concurrent operations', () => {
    it('should handle multiple add operations in sequence', async () => {
      const { result } = renderHook(() => useGuidanceMutations(defaultProps));

      const affiliation1: AffiliationSearch = {
        uri: 'https://ror.org/1',
        displayName: 'Org 1',
        funder: false,
        id: 1,
        name: 'Org 1'
      };

      const affiliation2: AffiliationSearch = {
        uri: 'https://ror.org/2',
        displayName: 'Org 2',
        funder: false,
        id: 2,
        name: 'Org 2'
      };

      await act(async () => {
        await result.current.addGuidanceOrganization(affiliation1);
      });

      expect(mockAddMutation).toHaveBeenCalledWith({
        variables: {
          planId: 123,
          affiliationId: 'https://ror.org/1',
        },
      });

      await act(async () => {
        await result.current.addGuidanceOrganization(affiliation2);
      });

      expect(mockAddMutation).toHaveBeenCalledWith({
        variables: {
          planId: 123,
          affiliationId: 'https://ror.org/2',
        },
      });

      expect(mockAddMutation).toHaveBeenCalledTimes(2);
    });

    it('should handle alternating add and remove operations', async () => {
      const { result } = renderHook(() => useGuidanceMutations(defaultProps));

      await act(async () => {
        await result.current.addGuidanceOrganization(mockAffiliation);
      });

      expect(mockAddMutation).toHaveBeenCalledTimes(1);

      await act(async () => {
        await result.current.removeGuidanceOrganization('https://ror.org/03yrm5c26');
      });

      expect(mockRemoveMutation).toHaveBeenCalledTimes(1);

      await act(async () => {
        await result.current.addGuidanceOrganization(mockAffiliation);
      });

      expect(mockAddMutation).toHaveBeenCalledTimes(2);
    });
  });
});