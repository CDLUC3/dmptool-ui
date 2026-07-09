import { LicensesQuery } from '@/generated/graphql';
import {
  AnyTableColumnQuestionType,
  ResearchOutputTableAnswerType
} from '@dmptool/types';


export type DataFlagsConfig = {
  showSensitiveData: boolean;
  showPersonalData: boolean;
  mode: 'sensitiveOnly' | 'personalOnly' | 'both';
};

export type RepoConfig = {
  hasCustomRepos: boolean;
  customRepos: RepositoryInterface[];
}

export type MetaDataConfig = {
  hasCustomStandards: boolean;
  customStandards: MetaDataStandardInterface[];
}

export type StandardField = {
  id: string;
  commonStandardId: string;
  label: string;
  languageTranslationKey?: string;
  enabled: boolean;
  required?: boolean;
  heading?: string;
  defaultValue?: string;
  placeholder?: string;
  helpText?: string;
  maxLength?: string;
  content?: AnyTableColumnQuestionType;
  value?: string;
  byteSizeConfig?: {
    selectedUnit: 'bytes' | 'kb' | 'mb' | 'gb' | 'tb' | 'pb';
    availableUnits: {
      label: string;
      value: string;
      selected: boolean;
    }[];
  };
  byteSizeFieldConfig?: {
    enabled: boolean;
    maxByteSize: number;
  };
  customLabel?: string; // For additional custom fields
  licensesConfig?: LicensesConfig;
  accessLevelsConfig?: {
    mode: 'defaults' | 'mine';
    selectedDefaults: string[];
    customLevels: AccessLevelInterface[];
  };
  outputTypeConfig?: {
    mode: 'defaults' | 'mine';
    selectedDefaults: string[];
    customTypes: OutputTypeInterface[];
  };
  flagsConfig?: DataFlagsConfig;
  repoConfig?: RepoConfig;
  metaDataConfig?: MetaDataConfig;
};

export interface RepositoryInterface {
  id?: string;
  name: string;
  description?: string;
  uri: string;
  website?: string;
  keywords?: string[];
  repositoryType?: string[];
}

export interface RepositoryFieldInterface {
  id: string;
  label: string;
  enabled: boolean;
  placeholder?: string;
  helpText?: string;
  value?: string;
  repoConfig?: {
    hasCustomRepos: boolean;
    customRepos: RepositoryInterface[];
  }
}

// Type for repository preferences with extended fields
export type RepoPreference = {
  label: string;
  value: string;
  website?: string;
  description?: string;
  keywords?: string[];
  repositoryType?: string[];
};

export interface MetaDataStandardInterface {
  id?: number | string;
  name: string;
  uri: string;
  description?: string;
}

export interface MetaDataStandardFieldInterface {
  id: string;
  label: string;
  enabled: boolean;
  helpText?: string;
  value?: string;
  metaDataConfig: {
    hasCustomStandards: boolean;
    customStandards: MetaDataStandardInterface[];
  }
}

export interface LicensesFieldInterface {
  id: string;
  label: string;
  enabled: boolean;
  defaultValue?: string;
  helpText?: string;
  licensesConfig: LicensesConfig;
}

export type LicensesConfig = {
  mode: 'defaults' | 'addToDefaults';
  selectedDefaults: string[];
  customTypes: { name: string; uri: string }[];
};

// Use the row structure from @dmptool/types
// This is the type of each element in ResearchOutputTableAnswerType['answer']
export type ResearchOutputTable = ResearchOutputTableAnswerType['answer'][number];

export type AccessLevelsConfig = {
  mode: 'defaults' | 'addToDefaults';
  selectedDefaults: string[];
  customTypes: string[];
};

export interface LicenseFieldProps {
  field: StandardField;
  newLicenseType: string;
  licensesData?: LicensesQuery;
  setNewLicenseType: (value: string) => void;
  onModeChange: (mode: 'defaults' | 'addToDefaults') => void;
  onAddCustomType: () => void;
  onRemoveCustomType: (type: string) => void;
}

export interface AccessLevelsFieldProps {
  field: StandardField;
}

export interface OutputTypeInterface {
  type?: string;
  description?: string;
}

export interface AccessLevelInterface {
  label: string;
  value: string;
  description?: string;
  selected: boolean;
}

export interface OutputTypeFieldConfigProps {
  field: StandardField;
  newOutputType: OutputTypeInterface;
  setNewOutputType: (value: OutputTypeInterface) => void;
  onModeChange: (mode: 'defaults' | 'mine') => void;
  onAddCustomType: () => void;
  onRemoveCustomType: (type: string) => void;
}

export type AdditionalFieldsType = {
  id: string;
  label: string;
  enabled: boolean;
  defaultValue: string;
  customLabel: string;
  helpText: string;
  maxLength: string;
}
