import { renderHook, act, waitFor } from '@testing-library/react';
import { useResearchOutputTable } from '../useResearchOutputTable';
import type { ResearchOutputTableQuestionType } from '@dmptool/types';
import { useQuery } from '@apollo/client/react';
import {
  LicensesDocument,
  DefaultResearchOutputTypesDocument,
} from '@/generated/graphql';

// Mock Apollo Client hooks
jest.mock('@apollo/client/react', () => ({
  useQuery: jest.fn(),
}));

// Mocks for next-intl and GraphQL hooks
jest.mock('next-intl', () => ({
  /* eslint-disable @typescript-eslint/no-explicit-any */
  useTranslations: () => (key: string, params?: any) => {
    if (params && typeof params === 'object') {
      return `${key} ${JSON.stringify(params)}`;
    }
    return key;
  },
}));

// Cast with jest.mocked utility
const mockUseQuery = jest.mocked(useQuery);

const setupMocks = () => {
  const stableLicensesReturn = {
    data: {
      licenses: [
        { name: 'MIT', uri: 'mit-uri', recommended: true },
        { name: 'GPL', uri: 'gpl-uri', recommended: false },
      ],
    },
    loading: false,
    error: null,
  };

  const stableDefaultResearchOutputTypesReturn = {
    data: {
      defaultResearchOutputTypes: [
        { name: 'Dataset', value: 'dataset', description: 'A dataset' },
        { name: 'Software', value: 'software', description: 'A software' },
      ],
    },
    loading: false,
    error: null,
  };

  mockUseQuery.mockImplementation((document) => {

    if (document === LicensesDocument) {
      return stableLicensesReturn as any;
    }

    if (document === DefaultResearchOutputTypesDocument) {
      return stableDefaultResearchOutputTypesReturn as any;
    }
    return {
      data: null,
      loading: false,
      error: undefined
    };
  });

};
describe('useResearchOutputTable', () => {
  let setHasUnsavedChanges: jest.Mock;
  let announce: jest.Mock;

  beforeEach(() => {
    setupMocks();
    setHasUnsavedChanges = jest.fn();
    announce = jest.fn();
  });

  it('should initialize with default standard fields and states', () => {
    const { result } = renderHook(() => useResearchOutputTable({ setHasUnsavedChanges, announce }));
    expect(result.current.standardFields.length).toBeGreaterThan(0);
    expect(result.current.expandedFields).toEqual(['title']);
    expect(result.current.nonCustomizableFieldIds).toContain('accessLevels');
    expect(result.current.additionalFields).toEqual([]);
    expect(typeof result.current.buildResearchOutputFormState).toBe('function');
  });

  it('should add and delete additional fields', () => {
    const { result } = renderHook(() => useResearchOutputTable({ setHasUnsavedChanges, announce }));
    act(() => {
      result.current.addAdditionalField();
    });
    expect(result.current.additionalFields.length).toBe(1);
    const fieldId = result.current.additionalFields[0].id;
    act(() => {
      result.current.handleDeleteAdditionalField(fieldId);
    });
    expect(result.current.additionalFields.length).toBe(0);
  });


  it('should update additional field properties', async () => {
    const { result } = renderHook(() => useResearchOutputTable({ setHasUnsavedChanges, announce }));
    act(() => {
      result.current.addAdditionalField();
    });
    const fieldId = result.current.additionalFields[0].id;
    act(() => {
      result.current.handleUpdateAdditionalField(fieldId, 'customLabel', 'My Custom Label');
    });
    await waitFor(() => {
      expect(result.current.additionalFields[0].content.attributes.label).toBe('My Custom Label');
    });
  });

  it('should handle standard field enable/disable', () => {
    const { result } = renderHook(() => useResearchOutputTable({ setHasUnsavedChanges, announce }));
    const fieldId = result.current.standardFields[1].id; // description
    act(() => {
      result.current.handleStandardFieldChange(fieldId, true);
    });
    expect(result.current.standardFields.find(f => f.id === fieldId)?.enabled).toBe(true);
    expect(result.current.expandedFields).toContain(fieldId);
    expect(announce).toHaveBeenCalled();
  });

  it('should handle customize field expand/collapse', () => {
    const { result } = renderHook(() => useResearchOutputTable({ setHasUnsavedChanges, announce }));
    const fieldId = result.current.standardFields[1].id; // description
    act(() => {
      result.current.handleCustomizeField(fieldId);
    });
    expect(result.current.expandedFields).toContain(fieldId);
    act(() => {
      result.current.handleCustomizeField(fieldId);
    });
    expect(result.current.expandedFields).not.toContain(fieldId);
  });

  it('should handle adding and removing custom output types', () => {
    const { result } = renderHook(() => useResearchOutputTable({ setHasUnsavedChanges, announce }));
    act(() => {
      result.current.handleOutputTypeModeChange('mine');
    });
    act(() => {
      result.current.setNewOutputType({ type: 'CustomType', description: 'desc' });
    });
    act(() => {
      result.current.handleAddCustomOutputType();
    });
    let outputTypeField = result.current.standardFields.find(f => f.id === 'outputType');
    expect(outputTypeField?.outputTypeConfig?.customTypes.some(t => t.type === 'CustomType')).toBe(true);

    act(() => {
      result.current.handleRemoveCustomOutputType('CustomType');
    });
    outputTypeField = result.current.standardFields.find(f => f.id === 'outputType');
    expect(outputTypeField?.outputTypeConfig?.customTypes.some(t => t.type === 'CustomType')).toBe(false);
  });

  it('should handle adding and removing custom license types', () => {
    const { result } = renderHook(() => useResearchOutputTable({ setHasUnsavedChanges, announce }));

    act(() => {
      result.current.handleLicenseModeChange('addToDefaults');
    });

    // Use GPL (which is not recommended) instead of MIT
    act(() => {
      result.current.setNewLicenseType('gpl-uri');
    });

    act(() => {
      result.current.handleAddCustomLicenseType();
    });

    // Check that GPL was added (MIT is already there from mode change)
    let licenseField = result.current.standardFields.find(f => f.id === 'licenses');
    expect(licenseField?.licensesConfig?.customTypes.filter(l => l.name === 'GPL').length).toBe(1);
    expect(licenseField?.licensesConfig?.customTypes.filter(l => l.name === 'MIT').length).toBe(1); // Pre-populated

    // Remove GPL
    act(() => {
      result.current.handleRemoveCustomLicenseType('GPL');
    });

    // Re-query the field to get the UPDATED state
    licenseField = result.current.standardFields.find(f => f.id === 'licenses');
    expect(licenseField?.licensesConfig?.customTypes.filter(l => l.name === 'GPL').length).toBe(0);
    expect(licenseField?.licensesConfig?.customTypes.filter(l => l.name === 'MIT').length).toBe(1); // Still there
  });

  it('should build research output form state with enabled fields', () => {
    const { result } = renderHook(() => useResearchOutputTable({ setHasUnsavedChanges, announce }));
    const formState = result.current.buildResearchOutputFormState() as ResearchOutputTableQuestionType;
    expect(formState.type).toBeDefined();
    expect(Array.isArray(formState.columns)).toBe(true);
    expect(formState.columns.length).toBeGreaterThan(0);
  });

  it('should auto-enable repository field when repositories are added via handleRepositoriesChange', () => {
    const { result } = renderHook(() => useResearchOutputTable({ setHasUnsavedChanges, announce }));

    // repoSelector starts disabled
    const initialField = result.current.standardFields.find(f => f.id === 'repoSelector');
    expect(initialField?.enabled).toBe(false);

    // Add repositories
    act(() => {
      result.current.handleRepositoriesChange([
        { id: '1', name: 'Test Repo', uri: 'https://test.com' }
      ]);
    });

    // Field should now be enabled and hasCustomRepos should be true
    const updatedField = result.current.standardFields.find(f => f.id === 'repoSelector');
    expect(updatedField?.enabled).toBe(true);
    expect(updatedField?.repoConfig?.hasCustomRepos).toBe(true);
    expect(updatedField?.repoConfig?.customRepos).toHaveLength(1);
  });

  it('should auto-enable metadata standards field when standards are added via handleMetaDataStandardsChange', () => {
    const { result } = renderHook(() => useResearchOutputTable({ setHasUnsavedChanges, announce }));

    // metadataStandards starts disabled
    const initialField = result.current.standardFields.find(f => f.id === 'metadataStandards');
    expect(initialField?.enabled).toBe(false);

    // Add metadata standards
    act(() => {
      result.current.handleMetaDataStandardsChange([
        { id: '1', name: 'Test Standard', uri: 'https://test.com' }
      ]);
    });

    // Field should now be enabled and hasCustomStandards should be true
    const updatedField = result.current.standardFields.find(f => f.id === 'metadataStandards');
    expect(updatedField?.enabled).toBe(true);
    expect(updatedField?.metaDataConfig?.hasCustomStandards).toBe(true);
    expect(updatedField?.metaDataConfig?.customStandards).toHaveLength(1);
  });

  describe('updateStandardFieldProperty auto-enable logic', () => {
    it('should auto-enable disabled field when updating meaningful property', () => {
      const { result } = renderHook(() => useResearchOutputTable({ setHasUnsavedChanges, announce }));

      // Find a disabled field (description starts disabled)
      const descriptionField = result.current.standardFields.find(f => f.id === 'description');
      expect(descriptionField?.enabled).toBe(false);

      // Update a meaningful property
      act(() => {
        result.current.updateStandardFieldProperty('description', 'value', 'Some description text');
      });

      // Field should now be enabled
      const updatedField = result.current.standardFields.find(f => f.id === 'description');
      expect(updatedField?.enabled).toBe(true);
      expect(updatedField?.value).toBe('Some description text');
    });

    it('should auto-enable field when updating outputTypeConfig', () => {
      const { result } = renderHook(() => useResearchOutputTable({ setHasUnsavedChanges, announce }));

      // First disable the outputType field
      act(() => {
        result.current.setStandardFields(prev =>
          prev.map(f => f.id === 'outputType' ? { ...f, enabled: false } : f)
        );
      });

      const disabledField = result.current.standardFields.find(f => f.id === 'outputType');
      expect(disabledField?.enabled).toBe(false);

      // Update outputTypeConfig
      act(() => {
        result.current.updateStandardFieldProperty('outputType', 'outputTypeConfig', {
          mode: 'mine',
          selectedDefaults: [],
          customTypes: []
        });
      });

      // Field should now be enabled
      const updatedField = result.current.standardFields.find(f => f.id === 'outputType');
      expect(updatedField?.enabled).toBe(true);
    });

    it('should only auto-enable repoSelector when hasCustomRepos is true', () => {
      const { result } = renderHook(() => useResearchOutputTable({ setHasUnsavedChanges, announce }));

      // repoSelector starts disabled
      const initialField = result.current.standardFields.find(f => f.id === 'repoSelector');
      expect(initialField?.enabled).toBe(false);

      // Update with hasCustomRepos: false
      act(() => {
        result.current.updateStandardFieldProperty('repoSelector', 'repoConfig', {
          hasCustomRepos: false,
          customRepos: []
        });
      });

      // Should still be disabled
      let updatedField = result.current.standardFields.find(f => f.id === 'repoSelector');
      expect(updatedField?.enabled).toBe(false);

      // Update with hasCustomRepos: true
      act(() => {
        result.current.updateStandardFieldProperty('repoSelector', 'repoConfig', {
          hasCustomRepos: true,
          customRepos: []
        });
      });

      // Now should be enabled
      updatedField = result.current.standardFields.find(f => f.id === 'repoSelector');
      expect(updatedField?.enabled).toBe(true);
    });

    it('should only auto-enable metadataStandards when hasCustomStandards is true', () => {
      const { result } = renderHook(() => useResearchOutputTable({ setHasUnsavedChanges, announce }));

      // metadataStandards starts disabled
      const initialField = result.current.standardFields.find(f => f.id === 'metadataStandards');
      expect(initialField?.enabled).toBe(false);

      // Update with hasCustomStandards: false
      act(() => {
        result.current.updateStandardFieldProperty('metadataStandards', 'metaDataConfig', {
          hasCustomStandards: false,
          customStandards: []
        });
      });

      // Should still be disabled
      let updatedField = result.current.standardFields.find(f => f.id === 'metadataStandards');
      expect(updatedField?.enabled).toBe(false);

      // Update with hasCustomStandards: true
      act(() => {
        result.current.updateStandardFieldProperty('metadataStandards', 'metaDataConfig', {
          hasCustomStandards: true,
          customStandards: []
        });
      });

      // Now should be enabled
      updatedField = result.current.standardFields.find(f => f.id === 'metadataStandards');
      expect(updatedField?.enabled).toBe(true);
    });

    it('should NOT auto-enable field when updating non-meaningful property', () => {
      const { result } = renderHook(() => useResearchOutputTable({ setHasUnsavedChanges, announce }));

      // Find a disabled field
      const initialField = result.current.standardFields.find(f => f.id === 'description');
      expect(initialField?.enabled).toBe(false);

      // Update a non-meaningful property (label is not in meaningfulProperties list)
      act(() => {
        result.current.updateStandardFieldProperty('description', 'label', 'New Label');
      });

      // Field should still be disabled
      const updatedField = result.current.standardFields.find(f => f.id === 'description');
      expect(updatedField?.enabled).toBe(false);
      expect(updatedField?.label).toBe('New Label');
    });

    it('should keep already-enabled field enabled when updating property', () => {
      const { result } = renderHook(() => useResearchOutputTable({ setHasUnsavedChanges, announce }));

      // title starts enabled
      const initialField = result.current.standardFields.find(f => f.id === 'title');
      expect(initialField?.enabled).toBe(true);

      // Update any property
      act(() => {
        result.current.updateStandardFieldProperty('title', 'required', false);
      });

      // Should remain enabled
      const updatedField = result.current.standardFields.find(f => f.id === 'title');
      expect(updatedField?.enabled).toBe(true);
      expect(updatedField?.required).toBe(false);
    });

    it('should call setHasUnsavedChanges when updating field property', () => {
      const { result } = renderHook(() => useResearchOutputTable({ setHasUnsavedChanges, announce }));

      setHasUnsavedChanges.mockClear();

      act(() => {
        result.current.updateStandardFieldProperty('description', 'value', 'test');
      });

      expect(setHasUnsavedChanges).toHaveBeenCalledWith(true);
    });
  });
});
