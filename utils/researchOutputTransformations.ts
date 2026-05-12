import {
  CURRENT_SCHEMA_VERSION,
  DefaultResearchOutputTableQuestion,
  ResearchOutputTableQuestionType,
  AnyTableColumnQuestionType,
  RepositorySearchAnswerType,
  DefaultResearchOutputCustomColumn
} from '@dmptool/types';
import {
  RESEARCH_OUTPUT_QUESTION_TYPE,
  RO_TITLE_ID,
  RO_DESCRIPTION_ID,
  RO_OUTPUT_TYPE_ID,
  RO_DATA_FLAGS_ID,
  RO_REPO_SELECTOR_ID,
  RO_METADATA_STANDARD_SELECTOR_ID,
  RO_LICENSES_ID,
  RO_ACCESS_LEVELS_ID,
} from '@/lib/constants';
import { getDefaultAnswerForType } from '@/utils/researchOutputTable';
import {
  AnyParsedQuestion,
  StandardField,
  MetaDataConfig,
  OutputTypeInterface,
  AccessLevelInterface,
  RepoPreference,
  ResearchOutputTable
} from '@/app/types';

type ResearchOutputState = {
  standardFields: StandardField[];
  additionalFields: typeof DefaultResearchOutputCustomColumn[];
  expandedFields: string[];
};

// Create a flexible column type for building columns dynamically
type FlexibleResearchOutputColumn = {
  heading: string;
  required: boolean;
  enabled: boolean;
  help?: string;
  content: AnyTableColumnQuestionType;
  preferences?: { label: string; value: string }[];
};

// Type for the strict columns from defaults
type ResearchOutputColumn = typeof DefaultResearchOutputTableQuestion['columns'][number];
// Type alias for repository item
type RepositoryItem = RepositorySearchAnswerType['answer'][number];

// Standard field identifiers that we recognize
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

// Create a mapping from field IDs to default columns
const DEFAULT_COLUMNS_MAP: Record<string, ResearchOutputColumn | undefined> = {
  title: DefaultResearchOutputTableQuestion.columns.find(col => col.heading === 'Title'),
  description: DefaultResearchOutputTableQuestion.columns.find(col => col.heading === 'Description'),
  outputType: DefaultResearchOutputTableQuestion.columns.find(col => col.heading === 'Type'),
  dataFlags: DefaultResearchOutputTableQuestion.columns.find(col => col.heading === 'Data Flags'),
  accessLevels: DefaultResearchOutputTableQuestion.columns.find(col => col.heading === 'Access Level'),
  repositories: DefaultResearchOutputTableQuestion.columns.find(col => col.heading === 'Repository(ies)'),
  metadataStandards: DefaultResearchOutputTableQuestion.columns.find(col => col.heading === 'Metadata Standard(s)'),
  licenses: DefaultResearchOutputTableQuestion.columns.find(col => col.heading === 'License'),
};

/**
 * Creates an empty research output row with default values
 * Handles preferences for repositories and metadata standards
 */
export const createEmptyResearchOutputRow = (
  columns: ResearchOutputTableQuestionType['columns']
): ResearchOutputTable => {
  return {
    columns: [
      ...columns.map(col => {
        const schemaVersion = col.content?.meta?.schemaVersion || CURRENT_SCHEMA_VERSION;
        const baseAnswer = getDefaultAnswerForType(col.content.type, schemaVersion);

        // Type guard: only access defaultValue if it exists on this type
        if (col.content?.attributes && 'defaultValue' in col.content.attributes) {
          const defaultValue = col.content?.attributes?.defaultValue;
          return { ...baseAnswer, answer: defaultValue ?? baseAnswer.answer };
        }

        /* eslint-disable-next-line @typescript-eslint/no-explicit-any */
        return baseAnswer as any;
      }),
      getDefaultAnswerForType("date", CURRENT_SCHEMA_VERSION),
      getDefaultAnswerForType("numberWithContext", CURRENT_SCHEMA_VERSION)
    ]
  };
};

/**
 * Extracts display information from a research output row
 * Used for showing row summaries in list views
 */
export const getRowDisplayInfo = (
  row: ResearchOutputTable,
  columns: ResearchOutputTableQuestionType['columns']
): { title: string; outputType: string; repositories: string[] } => {
  const titleIndex = columns.findIndex(col =>
    col.heading.toLowerCase() === 'title'
  );

  const outputTypeIndex = columns.findIndex(col =>
    col.heading.toLowerCase() === 'output type'
  );

  const repoIndex = columns.findIndex(col =>
    col.heading.toLowerCase() === 'repositories'
  );

  // Extract title
  let title = 'Untitled Research Output';
  if (titleIndex !== -1 && row.columns[titleIndex]) {
    const titleAnswer = row.columns[titleIndex].answer;
    if (typeof titleAnswer === 'string' && titleAnswer.trim()) {
      const stripped = titleAnswer.replace(/<[^>]*>/g, '');
      title = stripped.length > 50 ? stripped.substring(0, 50) + '...' : stripped;
    }
  }

  // Extract output type
  const outputType = outputTypeIndex !== -1 &&
    row.columns[outputTypeIndex] &&
    typeof row.columns[outputTypeIndex].answer === 'string'
    ? row.columns[outputTypeIndex].answer as string
    : '';

  // Extract repositories
  const repositories = repoIndex !== -1 &&
    Array.isArray(row.columns[repoIndex]?.answer)
    ? (row.columns[repoIndex].answer as RepositoryItem[]).map(repo => repo.repositoryName)
    : [];


  return { title, outputType, repositories };
};

// Type guard for metaDataConfig
const hasMetaDataConfig = (field: StandardField): field is StandardField & { metaDataConfig: MetaDataConfig } => {
  return field.metaDataConfig !== undefined;
};

/**
 * Helper function to build a column from default backend schema with field overrides
 */
const buildColumnFromDefault = (
  fieldId: keyof typeof DEFAULT_COLUMNS_MAP,
  field: StandardField,
  contentOverrides: Partial<AnyTableColumnQuestionType> = {}
): FlexibleResearchOutputColumn => {

  const defaultColumn = DEFAULT_COLUMNS_MAP[fieldId];

  if (!defaultColumn) {
    throw new Error(`No default column found for ${fieldId}`);
  }

  // eslint-disable-next-line @typescript-eslint/consistent-type-assertions
  const content: AnyTableColumnQuestionType = {
    type: defaultColumn.content.type,
    meta: { ...defaultColumn.content.meta },
    attributes: {
      ...defaultColumn.content.attributes,
      ...(field.helpText && { help: field.helpText }),
      ...(field.label && { label: field.label }),
      ...(field.languageTranslationKey && { labelTranslationKey: field.languageTranslationKey }),
      ...contentOverrides.attributes,
    },
    ...(('options' in defaultColumn.content) && { options: defaultColumn.content.options }),
    ...(('graphQL' in defaultColumn.content) && { graphQL: defaultColumn.content.graphQL }),
    ...contentOverrides
  } as AnyTableColumnQuestionType;

  return {
    heading: field.label || defaultColumn.heading,
    required: field.required ?? defaultColumn.required,
    enabled: field.enabled ?? defaultColumn.enabled ?? false,
    help: defaultColumn.help,
    content,
  };
};

/**
 * Transforms internal state (standardFields + additionalFields) into the JSON structure
 * that conforms to ResearchOutputTableQuestion schema
 */
export const stateToJSON = (
  standardFields: StandardField[],
  additionalFields: typeof DefaultResearchOutputCustomColumn[],
  defaultResearchOutputTypesData?: { defaultResearchOutputTypes?: ({ name: string; value?: string } | null)[] }
): AnyParsedQuestion => {
  // Use the flexible type for building
  const columns: FlexibleResearchOutputColumn[] = [];

  standardFields.forEach(field => {
    if (!field.enabled) return;

    switch (field.id) {
      case RO_TITLE_ID:
        columns.push(buildColumnFromDefault('title', field, {
          attributes: {
            maxLength: field.maxLength ? Number(field.maxLength) : 120,
          }
        }));
        break;

      case RO_DESCRIPTION_ID:
        const overrides = field.maxLength
          ? { attributes: { maxLength: Number(field.maxLength) } }
          : {};
        columns.push(buildColumnFromDefault('description', field, overrides));
        break;

      case RO_OUTPUT_TYPE_ID: {
        interface OutputTypeOption {
          label: string;
          value: string;
          selected: boolean;
          description?: string;
        }
        const outputTypeOptions: OutputTypeOption[] = [];
        if (field.outputTypeConfig?.mode === 'defaults' || !field.outputTypeConfig?.mode) {
          field.outputTypeConfig?.selectedDefaults?.forEach(defaultType => {
            const backendType = defaultResearchOutputTypesData?.defaultResearchOutputTypes?.find(
              (item) => item?.name === defaultType
            );
            outputTypeOptions.push({
              label: defaultType,
              value: backendType?.value || defaultType.toLowerCase().replace(/\s+/g, '-'),
              selected: false,
            });
          });
        }
        if (field.outputTypeConfig?.mode === 'mine') {
          field.outputTypeConfig?.customTypes?.forEach((customType: OutputTypeInterface) => {
            outputTypeOptions.push({
              label: customType.type || '',
              value: customType.type?.toLowerCase().replace(/\s+/g, '-') || '',
              selected: false,
              description: customType.description || ''
            });
          });
        }

        columns.push(buildColumnFromDefault('outputType', field, {
          options: outputTypeOptions
        }));
        break;
      }

      case RO_DATA_FLAGS_ID: {
        const defaultColumn = DEFAULT_COLUMNS_MAP.dataFlags;
        if (!defaultColumn || defaultColumn.content.type !== 'checkBoxes') break;

        const baseContent = field.content && field.content.type === 'checkBoxes'
          ? field.content
          : defaultColumn.content;

        columns.push({
          heading: field.label || defaultColumn.heading,
          required: field.required ?? defaultColumn.required ?? false,
          enabled: field.enabled ?? false,
          help: defaultColumn.help,
          content: {
            type: 'checkBoxes',
            meta: baseContent.meta,
            attributes: {
              ...baseContent.attributes,
              ...(field.languageTranslationKey && { labelTranslationKey: field.languageTranslationKey }),
            },
            options: baseContent.options
          }
        });
        break;
      }

      case RO_REPO_SELECTOR_ID: {
        const defaultColumn = DEFAULT_COLUMNS_MAP.repositories;
        if (!defaultColumn || defaultColumn.content.type !== 'repositorySearch') break;

        const repoColumn: FlexibleResearchOutputColumn = {
          heading: field.label || defaultColumn?.heading || '',
          required: field.required ?? defaultColumn?.required ?? false,
          enabled: field.enabled ?? false,
          help: defaultColumn?.help,
          content: {
            type: 'repositorySearch',
            meta: defaultColumn.content.meta,
            graphQL: defaultColumn.content.graphQL,
            attributes: {
              ...defaultColumn.content.attributes,
              ...(field.languageTranslationKey && { labelTranslationKey: field.languageTranslationKey }),
              label: field.label || defaultColumn.heading,
              help: field.helpText || defaultColumn.content.attributes?.help || '',
            }
          }
        };

        if (field.repoConfig?.customRepos && field.repoConfig.customRepos.length > 0) {
          repoColumn.preferences = field.repoConfig.customRepos.map(repo => ({
            label: repo.name,
            value: repo.uri || '',
            ...(repo.website && { website: repo.website }),
            ...(repo.description && { description: repo.description }),
            ...(repo.keywords && { keywords: repo.keywords })
          }));
        }
        columns.push(repoColumn);
        break;
      }

      case RO_METADATA_STANDARD_SELECTOR_ID: {
        const defaultColumn = DEFAULT_COLUMNS_MAP.metadataStandards;
        if (!defaultColumn || defaultColumn.content.type !== 'metadataStandardSearch') break;
        const metadataColumn: FlexibleResearchOutputColumn = {
          heading: field.label || defaultColumn?.heading || '',
          required: field.required ?? defaultColumn?.required ?? false,
          enabled: field.enabled ?? false,
          content: {
            ...defaultColumn?.content,
            attributes: {
              ...defaultColumn?.content?.attributes,
              ...(field.languageTranslationKey && { labelTranslationKey: field.languageTranslationKey }),
              label: field.label || defaultColumn?.heading,
              help: field.helpText || defaultColumn?.content?.attributes?.help || ''
            }
          }
        };

        if (hasMetaDataConfig(field) && field.metaDataConfig?.customStandards && field.metaDataConfig.customStandards.length > 0) {
          metadataColumn.preferences = field.metaDataConfig.customStandards.map(standard => ({
            label: standard.name,
            value: standard.uri
          }));
        }
        columns.push(metadataColumn);
        break;
      }

      case RO_LICENSES_ID: {
        const defaultColumn = DEFAULT_COLUMNS_MAP.licenses;
        if (!defaultColumn || defaultColumn.content.type !== 'licenseSearch') break;

        const licenseColumn: FlexibleResearchOutputColumn = {
          heading: field.label || defaultColumn?.heading,
          required: field.required ?? defaultColumn?.required ?? false,
          enabled: field.enabled ?? false,
          content: {
            type: 'licenseSearch',
            meta: defaultColumn.content.meta,
            graphQL: defaultColumn.content.graphQL,
            attributes: {
              ...defaultColumn.content.attributes,
              ...(field.languageTranslationKey && { labelTranslationKey: field.languageTranslationKey }),
              label: field.label || defaultColumn.heading,
              help: field.helpText || defaultColumn.content.attributes?.help || ''
            }
          }
        };

        if (field.licensesConfig?.mode === 'addToDefaults' && field.licensesConfig?.customTypes && field.licensesConfig.customTypes.length > 0) {
          licenseColumn.preferences = field.licensesConfig.customTypes.map(license => ({
            label: license.name,
            value: license.uri || ''
          }));
        } else {
          licenseColumn.preferences = [];
        }

        columns.push(licenseColumn);
        break;
      }

      case RO_ACCESS_LEVELS_ID: {
        interface AccessLevelOption {
          label: string;
          value: string;
          selected: boolean;
        }

        const accessLevelOptions: AccessLevelOption[] = [];
        if (field.accessLevelsConfig?.mode === 'defaults' || !field.accessLevelsConfig?.mode) {
          field.accessLevelsConfig?.selectedDefaults?.forEach(level => {
            accessLevelOptions.push({
              label: level,
              value: level,
              selected: false
            });
          });
        }
        if (field.accessLevelsConfig?.mode === 'mine') {
          field.accessLevelsConfig?.customLevels?.forEach((customLevel: AccessLevelInterface) => {
            accessLevelOptions.push({
              label: customLevel.label,
              value: customLevel.value,
              selected: false
            });
          });
        }

        columns.push(buildColumnFromDefault('accessLevels', field, {
          options: accessLevelOptions
        }));
        break;
      }
    }
  });

  // Add additional (custom) fields
  additionalFields.forEach(customField => {
    if (customField.enabled) {
      // Access maxLength from content.attributes
      const maxLength = customField.content?.attributes?.maxLength ?? 120;
      const help = customField.content?.attributes?.help ?? '';
      const defaultValue = customField.content?.attributes?.defaultValue;

      // eslint-disable-next-line @typescript-eslint/consistent-type-assertions
      const content: AnyTableColumnQuestionType = {
        type: 'text',
        meta: { schemaVersion: CURRENT_SCHEMA_VERSION },
        attributes: {
          label: customField.content?.attributes?.label || customField.heading,  // Use heading as fallback
          help,
          maxLength,
          minLength: 0,
          pattern: '^.+$',
          ...(defaultValue !== undefined ? { defaultValue } : {}),
        }
      } as AnyTableColumnQuestionType;

      columns.push({
        heading: customField.heading,  // Use heading instead of customLabel/label
        required: false,
        enabled: true,
        content
      });
    }
  });

  // eslint-disable-next-line @typescript-eslint/consistent-type-assertions
  const result: AnyParsedQuestion = {
    type: RESEARCH_OUTPUT_QUESTION_TYPE,
    columns,
    meta: DefaultResearchOutputTableQuestion.meta,
    attributes: {
      canAddRows: DefaultResearchOutputTableQuestion.attributes?.canAddRows ?? true,
      canRemoveRows: DefaultResearchOutputTableQuestion.attributes?.canRemoveRows ?? true,
      initialRows: DefaultResearchOutputTableQuestion.attributes?.initialRows ?? 1,
      label: DefaultResearchOutputTableQuestion.attributes?.label ?? '',
      help: DefaultResearchOutputTableQuestion.attributes?.help ?? '',
    }
  } as AnyParsedQuestion;

  return result;
};

/**
 * Transforms JSON (from saved question) back into internal state structure
 * This is the inverse of stateToJSON
 */
export const jsonToState = (
  parsed: AnyParsedQuestion | null,
  initialStandardFields: StandardField[]
): ResearchOutputState => {
  if (!parsed || parsed.type !== RESEARCH_OUTPUT_QUESTION_TYPE || !Array.isArray(parsed.columns)) {
    return {
      standardFields: initialStandardFields,
      additionalFields: [],
      expandedFields: initialStandardFields
        .filter(f => f.enabled)
        .map(f => f.id),
    };
  }

  // Type for preferences
  type Preference = { label: string; value: string };

  // Helper to safely get help text from attributes
  const getHelpText = (attributes: AnyTableColumnQuestionType['attributes'] | undefined): string => {
    if (!attributes) return '';
    if ('help' in attributes && typeof attributes.help === 'string') {
      return attributes.help;
    }
    return '';
  };

  // Helper to find a column by heading
  const findColumn = (keys: string[]) =>
    parsed.columns.find((col) =>
      col?.heading && keys.includes(col.heading)
    );

  // Hydrate standard fields
  const hydratedStandardFields = initialStandardFields.map((field) => {
    const updated = { ...field };

    switch (field.id) {
      case RO_REPO_SELECTOR_ID: {
        const col = findColumn(['researchOutput.repositories', 'Repositories']);
        if (col && 'preferences' in col && Array.isArray(col.preferences)) {
          updated.enabled = !!col.enabled;
          updated.helpText = getHelpText(col.content.attributes);
          updated.repoConfig = {
            ...updated.repoConfig,
            customRepos: (col.preferences as RepoPreference[]).map(repo => ({
              name: repo.label,
              uri: repo.value,
              ...(repo.website && { website: repo.website }),
              ...(repo.description && { description: repo.description }),
              ...(repo.keywords && { keywords: repo.keywords })
            })),
            hasCustomRepos: col?.preferences.length > 0,
          };
        }
        break;
      }

      case RO_ACCESS_LEVELS_ID: {
        const col = findColumn(['researchOutput.accessLevels', 'Initial Access Levels']);
        if (col && col.enabled === true) {
          updated.enabled = col.enabled;
          updated.helpText = getHelpText(col.content.attributes);
        }
        break;
      }

      case RO_METADATA_STANDARD_SELECTOR_ID: {
        const col = findColumn(['researchOutput.metadataStandards', 'Metadata Standards']);
        if (col && 'preferences' in col && Array.isArray(col.preferences)) {
          updated.enabled = !!col.enabled;
          updated.helpText = getHelpText(col.content.attributes);
          updated.metaDataConfig = {
            ...updated.metaDataConfig,
            customStandards: (col.preferences as Preference[]).map((std) => ({
              name: std.label,
              uri: std.value
            })),
            hasCustomStandards: col?.preferences.length > 0,
          };
        }
        break;
      }

      case RO_LICENSES_ID: {
        const col = findColumn(['researchOutput.licenses', 'Licenses']);
        if (col && 'preferences' in col && Array.isArray(col.preferences)) {
          updated.enabled = !!col.enabled;
          updated.helpText = getHelpText(col.content.attributes);
          updated.licensesConfig = {
            ...updated.licensesConfig,
            mode: col?.preferences.length > 0 ? 'addToDefaults' : 'defaults',
            customTypes: (col.preferences as Preference[]).map((lic) => ({
              name: lic.label,
              uri: lic.value
            })),
            selectedDefaults: updated.licensesConfig?.selectedDefaults || [],
          };
        }
        break;
      }

      case RO_OUTPUT_TYPE_ID: {
        const col = findColumn(['researchOutput.outputType', 'Output Type']);
        if (col) {
          updated.enabled = !!col.enabled;
          updated.helpText = getHelpText(col.content.attributes);

          // Check if there are custom options (mine mode)
          if (col.content && 'options' in col.content && Array.isArray(col.content.options) && col.content.options.length > 0) {
            // Type for select box options
            type SelectOption = { label: string; value: string; selected: boolean; description?: string };

            updated.outputTypeConfig = {
              ...updated.outputTypeConfig,
              mode: 'mine',
              customTypes: (col.content.options as SelectOption[]).map(opt => ({
                type: opt.label,
                description: opt.description || ''
              })),
              selectedDefaults: [],
            };
          }
          // If no custom options, it's using defaults mode - just update helpText
        } else {
          // Column absent from JSON means it was explicitly disabled when saved
          // (stateToJSON omits disabled fields, so absence = disabled)
          updated.enabled = false;
        }
        break;
      }

      case RO_DATA_FLAGS_ID: {
        const dataFlagsCol = findColumn(['researchOutput.dataFlags', 'Data Flags']);
        if (dataFlagsCol) {
          updated.enabled = !!dataFlagsCol.enabled;
          updated.helpText = getHelpText(dataFlagsCol.content?.attributes);
          if (dataFlagsCol.content) {
            updated.content = dataFlagsCol.content as typeof updated.content;
          }
        }
        break;
      }

      case RO_TITLE_ID:
      case RO_DESCRIPTION_ID: {
        const col = findColumn([
          field.id === RO_TITLE_ID ? 'researchOutput.title' : 'researchOutput.description',
          field.id === RO_TITLE_ID ? 'Title' : 'Description',
        ]);
        if (col) {
          updated.enabled = !!col.enabled;
          updated.helpText = getHelpText(col.content?.attributes);
          updated.required = !!col.required;
        }
        break;
      }
    }

    return updated;
  });

  // Hydrate additional fields (custom columns)
  const customCols = parsed.columns.filter((col) => {
    const isStandard = (col?.heading && standardKeys.has(col.heading));
    return !isStandard;
  });

  function hasDefaultValue(attr: AnyTableColumnQuestionType['attributes'] | undefined): attr is (AnyTableColumnQuestionType['attributes'] & { defaultValue: string }) {
    return attr !== undefined && 'defaultValue' in attr && typeof attr.defaultValue === 'string';
  }

  function hasMaxLength(attr: AnyTableColumnQuestionType['attributes'] | undefined): attr is (AnyTableColumnQuestionType['attributes'] & { maxLength: number }) {
    return attr !== undefined && 'maxLength' in attr && typeof attr.maxLength === 'number';
  }

  const hydratedAdditionalFields = customCols.map((col: typeof DefaultResearchOutputTableQuestion['columns'][number], idx: number) => ({
    id: col.heading?.toLowerCase().replace(/\s+/g, '_') || `custom_field_${idx}`,
    heading: col.heading || `Custom Field ${idx + 1}`,
    help: getHelpText(col.content?.attributes) || '',
    enabled: !!col.enabled,
    required: false,
    content: {
      type: 'text' as const,
      meta: col.content?.meta || { schemaVersion: CURRENT_SCHEMA_VERSION },
      attributes: {
        label: col.content?.attributes?.label || col.heading || '',
        help: getHelpText(col.content?.attributes) || '',
        maxLength: hasMaxLength(col.content?.attributes)
          ? col.content.attributes.maxLength
          : 120,
        minLength: 0,
        pattern: '^.+$',
        ...(hasDefaultValue(col.content?.attributes) && {
          defaultValue: col.content.attributes.defaultValue
        }),
      }
    }
  }));

  // Hydrate expanded fields
  const hydratedExpandedFields = [
    ...parsed.columns
      .filter((col) => col.enabled)
      .map((col) => {
        const key = col?.heading;
        switch (key) {
          case 'researchOutput.title': return 'title';
          case 'researchOutput.description': return 'description';
          case 'researchOutput.outputType': return 'outputType';
          case 'researchOutput.dataFlags': return 'dataFlags';
          case 'researchOutput.repositories': return 'repoSelector';
          case 'researchOutput.metadataStandards': return 'metadataStandards';
          case 'researchOutput.licenses': return 'licenses';
          case 'researchOutput.accessLevels': return 'accessLevels';
          default:
            return col.heading?.toLowerCase().replace(/\s+/g, '_');
        }
      })
  ];

  return {
    standardFields: hydratedStandardFields,
    additionalFields: hydratedAdditionalFields,
    expandedFields: hydratedExpandedFields,
  };
};