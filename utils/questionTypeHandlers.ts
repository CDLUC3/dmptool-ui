import { z } from "zod";
import { QuestionFormatInterface } from "@/app/types";
import { CURRENCY_DEFAULT_DENOMINATION, CURRENCY_DEFAULT_MAX, CURRENCY_DEFAULT_MIN, CURRENCY_DEFAULT_STEP } from "@/lib/constants";
import {
  AnyQuestionType,
  CURRENT_SCHEMA_VERSION,
  QuestionTypeMap,
  QuestionSchemaMap,
  QuestionFormatsEnum,
  QuestionFormatsUsage,
  QuestionFormatsUsageInterface,
  QuestionDefaultMap
} from "@dmptool/types";

type QuestionType = z.infer<typeof QuestionFormatsEnum>

type ResearchOutputTableColumn = QuestionTypeMap["researchOutputTable"]["columns"][number];

// List of question types to filter out from the available types
const filteredOutQuestionTypes = ['licenseSearch', 'metadataStandardSearch', 'numberWithContext', 'repositorySearch', 'table', 'boolean'];

// Fetch the usage information and then Parse the Zod schema with no input to generate the
// default JSON schemas
export function getQuestionFormatInfo(name: string): QuestionFormatInterface | null {
  if (name in QuestionSchemaMap) {
    const usage: QuestionFormatsUsageInterface = QuestionFormatsUsage[name as QuestionType];
    const schema: z.ZodTypeAny = QuestionSchemaMap[name as QuestionType];
    const base = (name in QuestionDefaultMap)
      ? QuestionDefaultMap[name as keyof typeof QuestionDefaultMap]
      : { type: name };
    const parsedSchema = schema.parse(base) as AnyQuestionType;

    return {
      type: name,
      title: usage?.title,
      usageDescription: usage?.usageDescription,
      defaultJSON: parsedSchema,
    };
  } else {
    return null;
  }
}

function orderQuestionTypes(qTypes: QuestionFormatInterface[]): QuestionFormatInterface[] {
  // Define the desired desired sort order for the Question types
  const sortOrder: string[] = [
    "textArea", "text", "radioButtons", "checkBoxes", "selectBox", "multiselectBox",
    "number", "numberRange", "currency", "email", "url", "boolean", "date", "dateRange",
    "affiliationSearch", "researchOutputTable"
  ];

  // Sort the question format array using the definition.
  // Note: Infinity ensures that types not listed above are placed at the end
  return qTypes.sort((a: QuestionFormatInterface, b: QuestionFormatInterface): number => {
    const aIndex = a.type ? sortOrder.indexOf(a.type) : Infinity;
    const bIndex = b.type ? sortOrder.indexOf(b.type) : Infinity;
    return aIndex - bIndex;
  });
}

// Fetch all available Question Types
export function getQuestionTypes(): QuestionFormatInterface[] {
  const info = QuestionFormatsEnum.options.map(key => getQuestionFormatInfo(key));

  const qTypes = info.filter((item): item is QuestionFormatInterface => {
    const json: AnyQuestionType = item?.defaultJSON as AnyQuestionType;
    const questionTypeId = json?.type;
    return item !== null && !filteredOutQuestionTypes.includes(questionTypeId);
  });
  return orderQuestionTypes(qTypes);
}

// Return the question type schema that matches the one in the questionType query param
export function getMatchingQuestionType(questionTypeIdQueryParam: string): z.ZodTypeAny | null {
  const schema: z.ZodTypeAny = QuestionSchemaMap[questionTypeIdQueryParam as QuestionType];
  return schema ?? null;
}

// Type for handler result with validation
type HandlerResult = {
  success: boolean;
  /* eslint-disable @typescript-eslint/no-explicit-any */
  data?: any;
  error?: string;
};

// Enhanced handler type that returns validation result
/* eslint-disable @typescript-eslint/no-explicit-any */
type QuestionTypeHandler = (baseJSON: any, userInput: any) => HandlerResult;

// Helper function to create and validate question type JSON
const createAndValidateQuestion = (
  type: string,
  jsonData: any,
  schema?: z.ZodSchema
): HandlerResult => {
  try {
    // Validates jsonData and checks if it conforms to the specified schema
    if (schema) {
      // Use passthrough to allow additional properties not defined in the schema
      const passthroughSchema = schema instanceof z.ZodObject ? schema.passthrough() : schema;
      const validatedData = passthroughSchema.parse(jsonData);
      return { success: true, data: validatedData };
    }

    // If no schema available, return the data as-is (backward compatibility)
    return { success: true, data: jsonData };
  } catch (error) {
    if (error instanceof z.ZodError) {
      const errorMessage = `Validation failed for ${type}: ${error.issues
        .map(e => `${e.path.join('.')}: ${e.message}`)
        .join(', ')}`;
      return { success: false, error: errorMessage };
    }

    return {
      success: false,
      error: `Unexpected error validating ${type}: ${error}`
    };
  }
};

interface QuestionOptionInterface {
  label?: string;
  value: string;
  selected?: boolean;
  checked?: boolean;
};

/**
 * The function is a collection of handlers for generating and validating
 * JSON objects for different question types. Each handler ensures the JSON conforms to the
 * corresponding question type schema using Zod for validation. It also uses type definitions
 * like `TextQuestionType` to enforce strong typing and enriches the JSON with default values
 * and metadata, ensuring compatibility with the current schema version.
 */
export const questionTypeHandlers: Record<string, QuestionTypeHandler> = {
  text: (json, input: QuestionTypeMap["text"]) => {
    const questionData: QuestionTypeMap["text"] = {
      ...json,
      type: "text",
      meta: {
        ...json.meta,
        schemaVersion: CURRENT_SCHEMA_VERSION,
      },
      attributes: {
        ...json.attributes,
        label: input?.attributes?.label,
        help: input?.attributes?.help,
        maxLength: input?.attributes?.maxLength ?? 1000,
        minLength: input?.attributes?.minLength ?? 0,
        pattern: input?.attributes?.pattern ?? "^.+$",
      },
    };

    return createAndValidateQuestion("text", questionData, QuestionSchemaMap["text"]);
  },

  textArea: (json, input: QuestionTypeMap["textArea"]) => {
    const questionData: QuestionTypeMap["textArea"] = {
      ...json,
      type: "textArea",
      meta: {
        ...json.meta,
        schemaVersion: CURRENT_SCHEMA_VERSION,
      },
      attributes: {
        ...json.attributes,
        label: input?.attributes?.label,
        help: input?.attributes?.help,
        maxLength: input?.attributes?.maxLength ?? 1000,
        minLength: input?.attributes?.minLength ?? 0,
        rows: input?.attributes?.rows ?? 2,
        cols: input?.attributes?.cols ?? 40,
      },
    };

    return createAndValidateQuestion("textArea", questionData, QuestionSchemaMap["textArea"]);
  },
  radioButtons: (json, input: {
    options: QuestionOptionInterface[],
    attributes?: QuestionTypeMap["radioButtons"]['attributes']
  }) => {
    const questionData: QuestionTypeMap["radioButtons"] = {
      ...json,
      type: "radioButtons",
      meta: {
        ...json.meta,
        schemaVersion: CURRENT_SCHEMA_VERSION,
      },
      attributes: {
        label: input?.attributes?.label,
        help: input?.attributes?.help,
      },
      options: input.options?.map(option => ({
        label: option.label ?? option.value,
        selected: option.checked ?? option.selected ?? false,
        value: option.value,
      })) || [],
    };

    return createAndValidateQuestion("radioButtons", questionData, QuestionSchemaMap["radioButtons"]);
  },

  checkBoxes: (json, input: {
    options: QuestionOptionInterface[],
    attributes?: QuestionTypeMap["checkBoxes"]['attributes']
  }) => {
    const questionData: QuestionTypeMap["checkBoxes"] = {
      ...json,
      type: "checkBoxes",
      meta: {
        ...json.meta,
        schemaVersion: CURRENT_SCHEMA_VERSION,
      },
      attributes: {
        label: input?.attributes?.label,
        help: input?.attributes?.help,
      },
      options: input.options?.map(option => ({
        label: option.label ?? option.value,
        selected: option.checked ?? option.selected ?? false,
        value: option.value,
      })) || [],
    };

    return createAndValidateQuestion("checkBoxes", questionData, QuestionSchemaMap["checkBoxes"]);
  },

  selectBox: (json, input: {
    options: QuestionOptionInterface[],
    attributes?: QuestionTypeMap["selectBox"]['attributes']
  }) => {
    const questionData: QuestionTypeMap["selectBox"] = {
      ...json,
      type: "selectBox",
      meta: {
        ...json.meta,
        schemaVersion: CURRENT_SCHEMA_VERSION,
      },
      attributes: {
        label: input?.attributes?.label,
        help: input?.attributes?.help,
        multiple: false,
      },
      options: input.options?.map(option => ({
        label: option.label ?? option.value,
        selected: option.checked ?? option.selected ?? false,
        value: option.value,
      })) || [],
    };

    return createAndValidateQuestion("selectBox", questionData, QuestionSchemaMap["selectBox"]);
  },

  multiselectBox: (json, input: {
    options: QuestionOptionInterface[],
    attributes?: QuestionTypeMap["multiselectBox"]['attributes']
  }) => {
    const questionData: QuestionTypeMap["multiselectBox"] = {
      ...json,
      type: "multiselectBox",
      meta: {
        ...json.meta,
        schemaVersion: CURRENT_SCHEMA_VERSION,
      },
      attributes: {
        label: input?.attributes?.label,
        help: input?.attributes?.help,
        multiple: true,
      },
      options: input.options?.map(option => ({
        label: option.label ?? option.value,
        selected: option.checked ?? option.selected ?? false,
        value: option.value,
      })) || [],
    };

    return createAndValidateQuestion("selectBox", questionData, QuestionSchemaMap["multiselectBox"]);
  },

  boolean: (json, input: QuestionTypeMap["boolean"]) => {
    const questionData: QuestionTypeMap["boolean"] = {
      ...json,
      type: "boolean",
      attributes: {
        ...json.attributes,
        label: input?.attributes?.label ?? "",
        value: input?.attributes?.value ?? false
      },
      meta: {
        ...json.meta,
        schemaVersion: CURRENT_SCHEMA_VERSION,
      },
    };

    return createAndValidateQuestion("boolean", questionData, QuestionSchemaMap["boolean"]);
  },

  url: (json, input: QuestionTypeMap["url"]) => {
    const questionData: QuestionTypeMap["url"] = {
      ...json,
      type: "url",
      attributes: {
        ...json.attributes,
        label: input?.attributes?.label,
        help: input?.attributes?.help,
        pattern: input?.attributes?.pattern ?? "https?://.+",
        maxLength: input?.attributes?.maxLength,
        minLength: input?.attributes?.minLength !== undefined ? input.attributes?.minLength : 0 // Fall back to 0 instead of null
      },
      meta: {
        ...json.meta,
        schemaVersion: CURRENT_SCHEMA_VERSION
      },
    };

    return createAndValidateQuestion("url", questionData, QuestionSchemaMap['url']);
  },

  currency: (json, input: QuestionTypeMap["currency"]) => {
    const questionData: QuestionTypeMap["currency"] = {
      ...json,
      type: "currency",
      attributes: {
        ...json.attributes,
        label: input?.attributes?.label,
        help: input?.attributes?.help,
        max: input?.attributes?.max ?? CURRENCY_DEFAULT_MAX,
        min: input?.attributes?.min ?? CURRENCY_DEFAULT_MIN,
        step: input?.attributes?.step ?? CURRENCY_DEFAULT_STEP,
        denomination: input?.attributes?.denomination ?? CURRENCY_DEFAULT_DENOMINATION,
      },
      meta: {
        ...json.meta,
        schemaVersion: CURRENT_SCHEMA_VERSION,
      },
    };

    return createAndValidateQuestion("currency", questionData, QuestionSchemaMap["currency"]);
  },
  date: (json, input: QuestionTypeMap["date"]['attributes']) => {
    const questionData: QuestionTypeMap["date"] = {
      ...json,
      type: "date",
      attributes: {
        ...json.attributes,
        label: input?.label,
        help: input?.help,
        max: input?.max,
        min: input?.min ?? "1900-01-01",
        step: input?.step ?? 1,
      },
      meta: {
        ...json.meta,
        schemaVersion: CURRENT_SCHEMA_VERSION,
      },
    };

    return createAndValidateQuestion("datePicker", questionData, QuestionSchemaMap["date"]);
  },
  dateRange: (json, input: QuestionTypeMap["dateRange"]) => {
    const startCol = input?.columns?.start || {};
    const endCol = input?.columns?.end || {};

    const questionData: QuestionTypeMap["dateRange"] = {
      ...json,
      type: "dateRange",
      attributes: {
        label: input?.attributes?.label,
        help: input?.attributes?.help,
      },
      columns: {
        end: {
          max: endCol.max,
          min: endCol.min,
          step: endCol.step ?? 1,
          label: endCol.label ?? "From",
          help: endCol.help,
        },
        start: {
          max: startCol.max,
          min: startCol.min,
          step: startCol.step ?? 1,
          label: startCol.label ?? "To",
          help: startCol.help,
        },
      },
      meta: {
        ...json.meta,
        schemaVersion: CURRENT_SCHEMA_VERSION,
      },
    };

    return createAndValidateQuestion("dateRange", questionData, QuestionSchemaMap["dateRange"]);
  },
  email: (json, input: QuestionTypeMap["email"]['attributes']) => {
    const questionData: QuestionTypeMap["email"] = {
      ...json,
      type: "email",
      attributes: {
        ...json.attributes,
        label: input?.label ?? "Email",
        help: input?.help,
        pattern: input?.pattern ?? "^.+$",
        multiple: input?.multiple ?? false,
        maxLength: input?.maxLength ?? 100,
        minLength: input?.minLength ?? 0,
      },
      meta: {
        ...json.meta,
        schemaVersion: CURRENT_SCHEMA_VERSION,
      },
    };

    return createAndValidateQuestion("email", questionData, QuestionSchemaMap["email"]);
  },
  affiliationSearch: (json: QuestionTypeMap["affiliationSearch"], input: {
    label?: string;
    help?: string;
  }) => {
    // Splice in the labels the user entered otherwise keep everything the same
    const questionData: QuestionTypeMap["affiliationSearch"] = {
      type: "affiliationSearch",
      attributes: {
        label: input?.label,
        help: input?.help
      },
      graphQL: {
        query: json?.graphQL.query,
        queryId: json?.graphQL.queryId,
        variables: json?.graphQL?.variables,
        answerField: json?.graphQL?.answerField ?? "",
        displayFields: json?.graphQL?.displayFields,
        responseField: json.graphQL?.responseField ?? "",
      },
      meta: {
        schemaVersion: CURRENT_SCHEMA_VERSION,
      },
    };

    return createAndValidateQuestion("affiliationSearch", questionData, QuestionSchemaMap["affiliationSearch"]);
  },
  number: (json, input: QuestionTypeMap["number"]) => {
    const questionData: QuestionTypeMap["number"] = {
      ...json,
      type: "number",
      attributes: {
        ...json.attributes,
        label: input?.attributes?.label,
        help: input?.attributes?.help,
        max: input?.attributes?.max,
        min: input?.attributes?.min ?? 0,
        step: input?.attributes?.step ?? 1,
      },
      meta: {
        ...json.meta,
        schemaVersion: CURRENT_SCHEMA_VERSION,
      },
    };

    return createAndValidateQuestion("number", questionData, QuestionSchemaMap['number']);
  },
  numberRange: (json, input: QuestionTypeMap["numberRange"]) => {
    const startCol = input?.columns?.start || {};
    const endCol = input?.columns?.end || {};
    const questionData: QuestionTypeMap["numberRange"] = {
      ...json,
      type: "numberRange",
      attributes: {
        label: input?.attributes?.label,
        help: input?.attributes?.help,
      },
      columns: {
        end: {
          max: endCol.max,
          min: endCol.min,
          step: endCol.step ?? 1,
          label: endCol.label ?? "From",
          help: endCol.help,
        },
        start: {
          max: startCol.max,
          min: startCol.min,
          step: startCol.step ?? 1,
          label: startCol.label ?? "To",
          help: startCol.help,
        },
      },
      meta: {
        ...json.meta,
        schemaVersion: CURRENT_SCHEMA_VERSION,
      },
    };

    return createAndValidateQuestion("numberRange", questionData, QuestionSchemaMap['numberRange']);
  },
  table: (json, input: {
    columns?: QuestionTypeMap["table"]['columns'];
    attributes?: QuestionTypeMap["table"]["attributes"];
  }) => {
    const questionData: QuestionTypeMap["table"] = {
      ...json,
      type: "table",
      attributes: {
        maxRows: input?.attributes?.maxRows ?? 10, // Use number, not null
        minRows: input?.attributes?.minRows ?? 1,  // Use number, not null
        canAddRows: input?.attributes?.canAddRows ?? true,
        initialRows: input?.attributes?.initialRows ?? 1,
        canRemoveRows: input?.attributes?.canRemoveRows ?? true,
      },
      columns: input?.columns?.map(column => ({
        heading: column.heading,
        content: {
          meta: {
            schemaVersion: CURRENT_SCHEMA_VERSION,
          },
          type: "text",
          attributes: {
            maxLength: column.content?.type === "text" && column.content.attributes?.maxLength !== undefined
              ? column.content.attributes.maxLength
              : 100, // Default to 100 if not defined
            minLength: column.content?.type === "text" && column.content.attributes?.minLength !== undefined
              ? column.content.attributes.minLength
              : 1, // Default to 1 if not defined
          },
        },
      })) || [],
      meta: {
        ...json.meta,
        schemaVersion: CURRENT_SCHEMA_VERSION,
      },
    };

    return createAndValidateQuestion("table", questionData, QuestionSchemaMap['table']);
  },
  /**
   * Research Output Table handler - creates a table-based question with columns
   * derived from the standardFields configuration in the QuestionAdd component.
   * 
   * This handler uses the researchOutputTable schema from @dmptool/types which is
   * specifically designed for collecting structured research output data with
   * configurable fields like:
   * - Title (text)
   * - Description (textArea)
   * - Output Type (selectBox)
   * - Data Flags (boolean checkboxes)
   * - Repositories (repositorySearch)
   * - Metadata Standards (metadataStandardSearch)
   * - Licenses (selectBox)
   * - Access Levels (selectBox)
   * - Additional custom fields (text)
   * 
   * The columns array is dynamically built based on which fields are enabled
   * in the standardFields configuration.
   */
  researchOutputTable: (json, input) => {
    // Store original preferences before validation to preserve extra fields
    const originalPreferences = new Map();
    input?.columns?.forEach((column: ResearchOutputTableColumn, index: number) => {
      // Type assertion needed because preferences only exists on search-type columns
      const columnWithPrefs = column as any;
      if (columnWithPrefs.preferences && Array.isArray(columnWithPrefs.preferences)) {
        originalPreferences.set(index, columnWithPrefs.preferences);
      }
    });

    const questionData: QuestionTypeMap["researchOutputTable"] = {
      ...json,
      type: "researchOutputTable",
      attributes: {
        label: input?.attributes?.label ?? "",
        languageTranslationKey: input?.attributes?.languageTranslationKey ?? "",
        help: input?.attributes?.help ?? "",
        labelTranslationKey: input?.attributes?.labelTranslationKey ?? "",
        canAddRows: input?.attributes?.canAddRows ?? true,
        canRemoveRows: input?.attributes?.canRemoveRows ?? true,
        initialRows: input?.attributes?.initialRows ?? 1,
        maxRows: input?.attributes?.maxRows,
        minRows: input?.attributes?.minRows,
      },
      columns: input?.columns?.map((column: ResearchOutputTableColumn) => {
        const baseContent = column.content ?? {};
        const type = baseContent.type;

        // Hydrate required fields for each type
        const hydratedContent: any = { ...baseContent };

        // All types require meta
        hydratedContent.meta = {
          ...(baseContent.meta || {}),
          schemaVersion: CURRENT_SCHEMA_VERSION,
        };

        // Add options array for types that need it
        if (["selectBox", "checkBoxes", "radioButtons"].includes(type)) {
          hydratedContent.options = (baseContent as { options?: any[] }).options ?? [];
        }

        // Add graphQL for search types
        if (["repositorySearch", "metadataStandardSearch", "licenseSearch"].includes(type)) {
          hydratedContent.graphQL = (baseContent as { graphQL?: any }).graphQL ?? {};
        }

        // Always hydrate attributes for all types
        hydratedContent.attributes = {
          ...(baseContent.attributes || {})
        };

        // Add attributes.context for numberWithContext
        if (type === "numberWithContext") {
          hydratedContent.attributes.context = baseContent.attributes?.context ?? [];
        }

        // Build the result object with all column properties
        const result: any = {
          ...column,
          content: hydratedContent
        };

        // Preserve preferences if they exist (for repositorySearch, metadataStandardSearch, licenseSearch)
        const columnWithPrefs = column as any;
        if (columnWithPrefs.preferences && Array.isArray(columnWithPrefs.preferences)) {
          result.preferences = columnWithPrefs.preferences;
        }

        return result;
      }) ?? [],
      meta: {
        ...json.meta,
        schemaVersion: CURRENT_SCHEMA_VERSION,
        title: json.meta?.title ?? "Research Output Table",
        usageDescription: json.meta?.usageDescription ?? "A table for collecting structured research output data"
      },
    };

    const validationResult = createAndValidateQuestion("researchOutputTable", questionData, QuestionSchemaMap['researchOutputTable']);

    // Restore original preferences with all fields after Zod validation strips them
    if (validationResult.success && validationResult.data && validationResult.data.columns) {
      validationResult.data.columns.forEach((column: any, index: number) => {
        if (originalPreferences.has(index)) {
          column.preferences = originalPreferences.get(index);
        }
      });
    }

    return validationResult;
  },
};