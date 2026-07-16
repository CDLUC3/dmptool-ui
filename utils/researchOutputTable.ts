import {
  DefaultResearchOutputAccessLevelColumn,
  DefaultResearchOutputTableColumnAnswerMap,
  AnyResearchOutputTableColumnAnswerType,
} from "@dmptool/types";

export const getDefaultAnswerForColumn = (
  commonStandardId: string,
): AnyResearchOutputTableColumnAnswerType => {
  return DefaultResearchOutputTableColumnAnswerMap[
    commonStandardId as keyof typeof DefaultResearchOutputTableColumnAnswerMap
  ] as AnyResearchOutputTableColumnAnswerType;
};

// These match the schema defaults in ResearchOutputAccessLevelColumnSchema
export const defaultAccessLevels = DefaultResearchOutputAccessLevelColumn.content.options;
