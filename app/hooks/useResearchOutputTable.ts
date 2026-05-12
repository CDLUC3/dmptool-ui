'use client'

import { useState, useCallback, useMemo } from 'react';
import { useTranslations } from 'next-intl';
import {
  AccessLevelInterface,
  AnyParsedQuestion,
  OutputTypeInterface,
  StandardField,
  RepositoryInterface,
  MetaDataStandardInterface,
  AdditionalFieldsType
} from '@/app/types';

// Apollo Client
import { useQuery } from '@apollo/client/react';

// GraphQL queries and mutations
import {
  LicensesDocument,
  DefaultResearchOutputTypesDocument,
} from '@/generated/graphql';

// Constants
import {
  RO_TITLE_ID,
  RO_OUTPUT_TYPE_ID,
  RO_DATA_FLAGS_ID,
  RO_REPO_SELECTOR_ID,
  RO_METADATA_STANDARD_SELECTOR_ID,
  RO_DESCRIPTION_ID,
  RO_LICENSES_ID,
  RO_ACCESS_LEVELS_ID,
} from '@/lib/constants';

import { jsonToState, stateToJSON } from '@/utils/researchOutputTransformations';

const standardKeys = new Set([
  'researchOutput.title',
  'researchOutput.description',
  'researchOutput.outputType',
  'researchOutput.dataFlags',
  'researchOutput.repositories',
  'researchOutput.metadataStandards',
  'researchOutput.licenses',
  'researchOutput.accessLevels',
  'Data Flags',
  'Title',
  'Description',
  'Output Type',
  'Repositories',
  'Metadata Standards',
  'Licenses',
  'Initial Access Levels',
]);

// Custom hook for research output table
export const useResearchOutputTable = ({ setHasUnsavedChanges, announce, initialData }: { setHasUnsavedChanges: React.Dispatch<React.SetStateAction<boolean>>, announce: (message: string) => void, initialData?: AnyParsedQuestion }) => {

  // Query request for all licenses
  const { data: licensesData } = useQuery(LicensesDocument, {
    variables: {}
  });

  // Query request for default research output types
  const { data: defaultResearchOutputTypesData } = useQuery(DefaultResearchOutputTypesDocument);

  // localization keys
  const QuestionAdd = useTranslations('QuestionAdd');

  // Memoize to prevent recreation on every render
  const initialStandardFields = useMemo<StandardField[]>(() => [
    {
      id: RO_TITLE_ID,
      label: QuestionAdd('researchOutput.labels.title'),
      languageTranslationKey: 'labels.title',
      enabled: true,
      required: true
    },
    {
      id: RO_DESCRIPTION_ID,
      label: QuestionAdd('researchOutput.labels.description'),
      languageTranslationKey: 'labels.description',
      enabled: false,
      placeholder: '',
      helpText: '',
      maxLength: '',
      required: false,
      value: ''
    },
    {
      id: RO_OUTPUT_TYPE_ID,
      label: QuestionAdd('researchOutput.labels.outputType'),
      languageTranslationKey: 'labels.outputType',
      enabled: false,
      helpText: '',
      required: false,
      outputTypeConfig: {
        mode: 'defaults' as 'defaults' | 'mine',
        selectedDefaults: [] as string[],
        customTypes: [] as OutputTypeInterface[],
      }
    },
    {
      id: RO_DATA_FLAGS_ID,
      label: QuestionAdd('researchOutput.labels.dataFlags'),
      languageTranslationKey: 'labels.dataFlags',
      enabled: false,
      required: false,
      heading: 'Data Flags',
      helpText: QuestionAdd('helpText.dataFlags'),
      content: {
        type: 'checkBoxes',
        meta: { schemaVersion: '1.0' },
        attributes: {},
        options: [
          {
            label: QuestionAdd('labels.mayContainSensitiveData'),
            value: 'sensitive',
            checked: false
          },
          {
            label: QuestionAdd('labels.mayContainPersonalData'),
            value: 'personal',
            checked: false
          }
        ]
      }
    },
    {
      id: RO_REPO_SELECTOR_ID,
      label: QuestionAdd('researchOutput.labels.repositories'),
      languageTranslationKey: 'labels.repositories',
      enabled: false,
      placeholder: '',
      helpText: '',
      value: '',
      repoConfig: {
        hasCustomRepos: false,
        customRepos: [] as RepositoryInterface[],
      }
    },
    {
      id: RO_METADATA_STANDARD_SELECTOR_ID,
      label: QuestionAdd('researchOutput.labels.metadataStandards'),
      languageTranslationKey: 'labels.metadataStandards',
      enabled: false,
      helpText: '',
      metaDataConfig: {
        hasCustomStandards: false,
        customStandards: [] as MetaDataStandardInterface[],
      }
    },
    {
      id: RO_LICENSES_ID,
      label: QuestionAdd('researchOutput.labels.licenses'),
      languageTranslationKey: 'labels.licenses',
      enabled: false,
      defaultValue: '',
      helpText: '',
      licensesConfig: {
        mode: 'defaults' as 'defaults' | 'addToDefaults',
        selectedDefaults: [] as string[],
        customTypes: [] as { name: string; uri: string }[]
      }
    },
    {
      id: RO_ACCESS_LEVELS_ID,
      label: QuestionAdd('researchOutput.labels.initialAccessLevels'),
      languageTranslationKey: 'labels.initialAccessLevels',
      enabled: false,
      defaultValue: '',
      helpText: '',
      accessLevelsConfig: {
        mode: 'defaults' as 'defaults' | 'mine',
        selectedDefaults: [] as string[],
        customLevels: [] as AccessLevelInterface[],
      }
    },
  ], [QuestionAdd]);

  // States for Research Output table question type
  // Which fields cannot be customized
  const nonCustomizableFieldIds = ['accessLevels'];
  // Hydrate state from initialData if provided
  const hydrated = initialData ? jsonToState(initialData, initialStandardFields) : null;
  const [standardFields, setStandardFields] = useState(hydrated?.standardFields || initialStandardFields);
  const [additionalFields, setAdditionalFields] = useState<AdditionalFieldsType[]>(
    ((hydrated?.additionalFields || []).map((field, idx) => ({
      ...field,
      /* eslint-disable @typescript-eslint/no-explicit-any */
      id: (field as any).id ?? `custom_field_${Date.now()}_${idx}`,// Ensure each field has a unique ID for updates
    })) as AdditionalFieldsType[])
  );
  const [expandedFields, setExpandedFields] = useState<string[]>(hydrated?.expandedFields || ['title']);
  // State for managing custom output types
  const [newOutputType, setNewOutputType] = useState<OutputTypeInterface>({ type: '', description: '' });
  // State for managing custom license types
  const [newLicenseType, setNewLicenseType] = useState<string>('');


  /**
   * Build form state for research output table questions using transformation utility
   */
  // In buildResearchOutputFormState
  const buildResearchOutputFormState = useCallback(() => {
    // Transform the GraphQL query result to match the expected type
    const transformedData = defaultResearchOutputTypesData?.defaultResearchOutputTypes
      ? {
        defaultResearchOutputTypes: defaultResearchOutputTypesData.defaultResearchOutputTypes.map(item =>
          item ? { name: item.name, value: item.value } : null
        )
      }
      : undefined;

    return stateToJSON(standardFields, additionalFields, transformedData);
  }, [standardFields, additionalFields, defaultResearchOutputTypesData]);


  /**
   * Hydrate state from JSON using transformation utility
   */
  const hydrateFromJSON = useCallback((parsed: AnyParsedQuestion) => {
    const hydrated = jsonToState(parsed, initialStandardFields);
    setStandardFields(hydrated.standardFields);
    setAdditionalFields(
      (hydrated.additionalFields || []).map((field, idx) => ({
        ...field,
        id: (field as any).id ?? `custom_field_${Date.now()}_${idx}`,// Ensure each field has a unique ID for updates
      })) as AdditionalFieldsType[]
    );
    setExpandedFields(hydrated.expandedFields);
  }, []);



  // Handle updates to RepositorySelectionSystem component
  const handleRepositoriesChange = (repos: RepositoryInterface[]) => {
    // Store the selected repositories in the field config
    const currentField = standardFields.find(f => f.id === 'repoSelector');
    if (currentField && currentField.repoConfig) {
      const previousCount = currentField.repoConfig.customRepos?.length || 0;
      updateStandardFieldProperty('repoSelector', 'repoConfig', {
        ...currentField.repoConfig,
        hasCustomRepos: repos.length > 0,
        customRepos: repos
      });

      // Announce the change
      if (repos.length > previousCount) {
        announce(QuestionAdd('researchOutput.announcements.repositoryAdded') || 'Repository added');
      } else if (repos.length < previousCount) {
        announce(QuestionAdd('researchOutput.announcements.repositoryRemoved') || 'Repository removed');
      }
    }

    setHasUnsavedChanges(true);
  };

  // Handle updates to MetaDataStandards component
  const handleMetaDataStandardsChange = (standards: MetaDataStandardInterface[]) => {
    // Store the selected metadata standards in the field config
    const currentField = standardFields.find(f => f.id === 'metadataStandards');
    if (currentField && currentField.metaDataConfig) {
      const previousCount = currentField.metaDataConfig.customStandards?.length || 0;
      updateStandardFieldProperty('metadataStandards', 'metaDataConfig', {
        ...currentField.metaDataConfig,
        hasCustomStandards: standards.length > 0,
        customStandards: standards // Store metadata standard data
      });

      // Announce the change
      if (standards.length > previousCount) {
        announce(QuestionAdd('researchOutput.announcements.metadataStandardAdded') || 'Metadata standard added');
      } else if (standards.length < previousCount) {
        announce(QuestionAdd('researchOutput.announcements.metadataStandardRemoved') || 'Metadata standard removed');
      }
    }
    setHasUnsavedChanges(true);
  };

  // Shared function to update any property in standardFields, and handle auto-enabling logic for certain properties
  const updateStandardFieldProperty = (fieldId: string, propertyName: string, value: unknown) => {
    setStandardFields(prev =>
      prev.map(field => {
        if (field.id === fieldId) {
          const wasEnabled = field.enabled;

          // Build the updated field
          const updatedField = { ...field, [propertyName]: value };

          // Auto-enable if the field wasn't enabled and we're updating a meaningful property
          // (not metadata properties like labels or helpText)
          const meaningfulProperties = [
            'value',
            'outputTypeConfig',
            'repoConfig',
            'metaDataConfig',
            'licensesConfig',
            'accessLevelsConfig',
            'content',
            'defaultValue',
            'required',
            'helpText'
          ];

          if (!wasEnabled && meaningfulProperties.includes(propertyName)) {
            // Special case: only enable repoSelector if hasCustomRepos is true
            if (fieldId === RO_REPO_SELECTOR_ID && propertyName === 'repoConfig') {
              const repoConfig = value as { hasCustomRepos: boolean; customRepos: RepositoryInterface[] };
              if (repoConfig.hasCustomRepos) {
                updatedField.enabled = true;
              }
            }
            // Special case: only enable metadataStandards if hasCustomStandards is true
            else if (fieldId === RO_METADATA_STANDARD_SELECTOR_ID && propertyName === 'metaDataConfig') {
              const metaDataConfig = value as { hasCustomStandards: boolean; customStandards: MetaDataStandardInterface[] };
              if (metaDataConfig.hasCustomStandards) {
                updatedField.enabled = true;
              }
            }
            else {
              updatedField.enabled = true;
            }
          }
          return updatedField;
        }
        return field;
      })
    );

    setHasUnsavedChanges(true);
  };

  // Handler for standard field checkbox changes (for enabled property)
  const handleStandardFieldChange = (fieldId: string, enabled: boolean) => {

    updateStandardFieldProperty(fieldId, 'enabled', enabled);
    if (enabled === true) {
      setExpandedFields(prev => [...prev, fieldId]); //expanded
    }

    // Announce the change
    const field = standardFields.find(f => f.id === fieldId);
    if (field) {
      const status = enabled ? 'enabled' : 'disabled';
      announce(`${field.label} ${status}`);
    }
  };

  // Handler for customize button clicks
  const handleCustomizeField = (fieldId: string) => {
    const wasExpanded = expandedFields.includes(fieldId);
    setExpandedFields(prev =>
      prev.includes(fieldId)
        ? prev.filter(id => id !== fieldId) // collapse
        : [...prev, fieldId]                // expand
    );

    // Announce the change
    const field = standardFields.find(f => f.id === fieldId) || additionalFields.find(f => f.id === fieldId);
    if (field) {
      const status = wasExpanded ? 'collapsed' : 'expanded';
      announce(`${'label' in field ? field.label : field.heading} ${status}`);
    }
  };

  // Handler for toggling metadata standards
  const handleToggleMetaDataStandards = (hasCustomStandards: boolean) => {
    const currentField = standardFields.find(f => f.id === 'metadataStandards');
    if (currentField && currentField.metaDataConfig) {
      updateStandardFieldProperty('metadataStandards', 'metaDataConfig', {
        ...currentField.metaDataConfig,
        hasCustomStandards
      });
    }
  };

  // Handler for toggling preferred repositories
  const handleTogglePreferredRepositories = (hasCustomRepos: boolean) => {
    const currentField = standardFields.find(f => f.id === 'repoSelector');
    if (currentField && currentField.repoConfig) {
      updateStandardFieldProperty('repoSelector', 'repoConfig', {
        ...currentField.repoConfig,
        hasCustomRepos
      });
    }
  };

  // Handler for license mode changes (defaults, add to defaults)
  const handleLicenseModeChange = (mode: 'defaults' | 'addToDefaults') => {
    const currentField = standardFields.find(f => f.id === 'licenses');
    if (currentField && currentField.licensesConfig) {
      // When switching to 'addToDefaults' mode, pre-populate with recommended licenses if customTypes is empty
      const allLicenses = licensesData?.licenses?.filter((license): license is NonNullable<typeof license> => license !== null) || [];
      const recommendedLicenses = allLicenses
        .filter(license => license.recommended)
        .map(license => ({ name: license.name, uri: license.uri }));
      const customTypes = mode === 'addToDefaults' && currentField.licensesConfig.customTypes.length === 0
        ? recommendedLicenses
        : currentField.licensesConfig.customTypes;

      updateStandardFieldProperty('licenses', 'licensesConfig', {
        ...currentField.licensesConfig,
        mode,
        customTypes
      });

      // Announce the change
      const modeText = mode === 'defaults' ? 'default licenses' : 'custom licenses';
      announce(QuestionAdd('researchOutput.announcements.licenseModeChanged', { mode: modeText }) || `License mode changed to ${modeText}`);
    }
  };

  // Handler for adding custom license types
  const handleAddCustomLicenseType = () => {
    if (newLicenseType.trim()) {
      const currentField = standardFields.find(f => f.id === 'licenses');
      if (currentField && currentField.licensesConfig) {
        // newLicenseType contains the URI, find the full license object
        const allLicenses = licensesData?.licenses?.filter((license): license is NonNullable<typeof license> => license !== null) || [];
        const selectedLicense = allLicenses.find(license => license.uri === newLicenseType.trim());

        if (selectedLicense) {
          const updatedCustomTypes = [
            ...currentField.licensesConfig.customTypes,
            { name: selectedLicense.name, uri: selectedLicense.uri }
          ];
          updateStandardFieldProperty('licenses', 'licensesConfig', {
            ...currentField.licensesConfig,
            customTypes: updatedCustomTypes
          });
          setNewLicenseType('');
          announce(QuestionAdd('researchOutput.announcements.licenseAdded', { name: selectedLicense.name }) || `License ${selectedLicense.name} added`);
        }
      }
    }
  };

  // Handler for removing custom license types
  const handleRemoveCustomLicenseType = (nameToRemove: string) => {
    const currentField = standardFields.find(f => f.id === 'licenses');
    if (currentField && currentField.licensesConfig) {
      const updatedCustomTypes = currentField.licensesConfig.customTypes.filter(
        (license) => license.name !== nameToRemove
      );
      updateStandardFieldProperty('licenses', 'licensesConfig', {
        ...currentField.licensesConfig,
        customTypes: updatedCustomTypes
      });
      announce(QuestionAdd('researchOutput.announcements.licenseRemoved', { name: nameToRemove }) || `License ${nameToRemove} removed`);
    }
  };

  // Handler for output type mode changes (defaults, mine, add to defaults)
  const handleOutputTypeModeChange = (mode: 'defaults' | 'mine') => {
    const currentField = standardFields.find(f => f.id === 'outputType');
    if (currentField && currentField.outputTypeConfig) {
      // When switching to 'mine' mode, pre-populate with defaults if customTypes is empty
      // Transform backend data to match OutputTypeInterface structure
      const backendOutputTypes = defaultResearchOutputTypesData?.defaultResearchOutputTypes
        ?.filter((item): item is NonNullable<typeof item> => item !== null)
        .map(item => ({
          type: item.name,
          description: item.description || ''
        })) || [];

      const customTypes = mode === 'mine' && currentField.outputTypeConfig.customTypes.length === 0
        ? backendOutputTypes
        : currentField.outputTypeConfig.customTypes;

      updateStandardFieldProperty('outputType', 'outputTypeConfig', {
        ...currentField.outputTypeConfig,
        mode,
        customTypes
      });

      // Announce the change
      const modeText = mode === 'defaults' ? 'default output types' : 'custom output types';
      announce(QuestionAdd('researchOutput.announcements.outputTypeModeChanged', { mode: modeText }) || `Output type mode changed to ${modeText}`);
    }
  };

  // Handler for adding custom output types
  const handleAddCustomOutputType = () => {
    if (newOutputType.type && newOutputType.type.trim()) {
      const currentField = standardFields.find(f => f.id === 'outputType');
      if (currentField && currentField.outputTypeConfig) {
        // Add to customTypes array
        const updatedCustomTypes = [
          ...currentField.outputTypeConfig.customTypes,
          { type: newOutputType.type.trim(), description: newOutputType.description?.trim() || '' }
        ];

        updateStandardFieldProperty('outputType', 'outputTypeConfig', {
          ...currentField.outputTypeConfig,
          customTypes: updatedCustomTypes
        });

        // Clear the input fields
        const typeName = newOutputType.type.trim();
        setNewOutputType({ type: '', description: '' });
        announce(QuestionAdd('researchOutput.announcements.outputTypeAdded', { type: typeName }) || `Output type ${typeName} added`);
      }
    }
  };

  // Handler for removing custom output types
  const handleRemoveCustomOutputType = (typeToRemove: string) => {
    const currentField = standardFields.find(f => f.id === 'outputType');
    if (currentField && currentField.outputTypeConfig) {
      const updatedCustomTypes = currentField.outputTypeConfig.customTypes.filter(
        (customType: OutputTypeInterface) => customType.type !== typeToRemove
      );
      updateStandardFieldProperty('outputType', 'outputTypeConfig', {
        ...currentField.outputTypeConfig,
        customTypes: updatedCustomTypes
      });
      announce(QuestionAdd('researchOutput.announcements.outputTypeRemoved', { type: typeToRemove }) || `Output type ${typeToRemove} removed`);
    }
  };

  const addAdditionalField = () => {
    const newId = `custom_field_${Date.now()}`;
    const newField: AdditionalFieldsType = {
      id: newId,
      heading: 'Custom Field',
      help: '',
      enabled: true,
      required: false,
      content: {
        type: 'text',
        meta: { schemaVersion: '1.0' },
        attributes: {
          label: 'Custom Field',
          help: '',
          maxLength: 120,
          minLength: 0,
          pattern: '^.+$',
          defaultValue: ''
        }
      }
    };


    setAdditionalFields(prev => [...prev, newField]);
    setExpandedFields(prev => [...prev, newId]); // Auto-expand for editing
    setHasUnsavedChanges(true);
    announce(QuestionAdd('researchOutput.announcements.fieldAdded') || 'Field added');
  };

  // Handler for deleting additional fields
  const handleDeleteAdditionalField = (fieldId: string) => {
    setAdditionalFields(prev => prev.filter(field => field.id !== fieldId));
    setExpandedFields(prev => prev.filter(id => id !== fieldId));
    setHasUnsavedChanges(true);
    announce(QuestionAdd('researchOutput.announcements.fieldDeleted') || 'Field deleted');
  };

  // Handler for updating additional field properties
  const handleUpdateAdditionalField = (fieldId: string, propertyName: string, value: unknown) => {
    setAdditionalFields(prev =>
      prev.map(field => {
        if (field.id !== fieldId) return field;

        // Handle each property specifically
        if (propertyName === 'customLabel') {
          return {
            ...field,
            heading: value as string,
            content: {
              ...field.content,
              attributes: {
                ...field.content.attributes,
                label: value as string,
              }
            }
          };
        }
        if (propertyName === 'helpText') {
          return {
            ...field,
            content: {
              ...field.content,
              attributes: {
                ...field.content.attributes,
                help: value as string,
              }
            }
          };
        }
        if (propertyName === 'maxLength') {
          return {
            ...field,
            content: {
              ...field.content,
              attributes: {
                ...field.content.attributes,
                maxLength: value === '' ? undefined : Number(value),
              }
            }
          };
        }
        if (propertyName === 'defaultValue') {
          return {
            ...field,
            content: {
              ...field.content,
              attributes: {
                ...field.content.attributes,
                defaultValue: value as string,
              }
            }
          };
        }
        // fallback for other properties
        return { ...field, [propertyName]: value };
      })
    );
    setHasUnsavedChanges(true);
  };


  return {
    buildResearchOutputFormState,
    hydrateFromJSON,
    licensesData,
    defaultResearchOutputTypesData,
    standardKeys,
    expandedFields,
    nonCustomizableFieldIds,
    standardFields,
    additionalFields,
    newOutputType,
    setNewOutputType,
    newLicenseType,
    setNewLicenseType,
    handleRepositoriesChange,
    handleMetaDataStandardsChange,
    handleStandardFieldChange,
    handleCustomizeField,
    handleToggleMetaDataStandards,
    handleTogglePreferredRepositories,
    handleLicenseModeChange,
    handleAddCustomLicenseType,
    handleRemoveCustomLicenseType,
    handleOutputTypeModeChange,
    handleAddCustomOutputType,
    handleRemoveCustomOutputType,
    addAdditionalField,
    handleDeleteAdditionalField,
    handleUpdateAdditionalField,
    setStandardFields,
    setAdditionalFields,
    setExpandedFields,
    updateStandardFieldProperty
  };
};
