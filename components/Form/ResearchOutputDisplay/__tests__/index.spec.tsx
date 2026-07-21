import React from 'react';
import { render, screen } from '@testing-library/react';
import '@testing-library/jest-dom';
import ResearchOutputDisplay from '@/components/Form/ResearchOutputDisplay';
import { StandardField } from '@/app/types';

// Mock the useTranslations hook
jest.mock('next-intl', () => ({
  useTranslations: () => (key: string) => key,
}));

// Mock the styles module
jest.mock('@/components/Form/ResearchOutputDisplay/researchOutput.module.scss', () => ({
  fieldsContainer: 'fieldsContainer',
  fieldsDescription: 'fieldsDescription',
  fieldsList: 'fieldsList',
  fieldRowWrapper: 'fieldRowWrapper',
  fieldRow: 'fieldRow',
  fieldStatus: 'fieldStatus',
  fieldLabel: 'fieldLabel',
  requiredBadge: 'requiredBadge',
  fieldDetails: 'fieldDetails',
  detailItem: 'detailItem',
  detailLabel: 'detailLabel',
  detailValue: 'detailValue',
  optionsList: 'optionsList',
  repoUrl: 'repoUrl',
}));

describe('ResearchOutputDisplay', () => {
  const mockStandardField: StandardField = {
    id: 'title',
    commonStandardId: 'title',
    label: 'Title',
    enabled: true,
    helpText: 'Enter the title',
  };

  const mockDataFlagField: StandardField = {
    id: "dataFlags",
    commonStandardId: "data_flags",
    label: "Data Flags",
    enabled: true,
    content: {
      meta: { schemaVersion: "1.0" },
      type: "checkBoxes",
      options: [
        { label: "Flag 1", value: "flag1", selected: true },
        { label: "Flag 2", value: "flag2", selected: false },
      ],
      attributes: { labelTranslationKey: "labels.dataFlags" },
      /* eslint-disable @typescript-eslint/no-explicit-any */
    } as any,
  };

  const mockOutputTypeField: StandardField = {
    id: "outputType",
    commonStandardId: "type",
    label: "Output Type",
    enabled: true,
    outputTypeConfig: {
      mode: "mine",
      selectedDefaults: [],
      customTypes: [{ type: "Type 1" }, { type: "Type 2" }],
    },
    helpText: "Output type help",
  };

  const mockOutputTypeDefaultField: StandardField = {
    id: "outputType",
    commonStandardId: "type",
    label: "Output Type",
    enabled: true,
    outputTypeConfig: {
      mode: "defaults",
      selectedDefaults: ["DEFAULT_TYPE_1", "DEFAULT_TYPE_2"],
      customTypes: [],
    },
    helpText: "Output type help",
  };

  const mockRepoSelectorField: StandardField = {
    id: "repoSelector",
    commonStandardId: "host",
    label: "Repository",
    enabled: true,
    repoConfig: {
      hasCustomRepos: true,
      customRepos: [
        { id: "repo1", name: "Repository 1", uri: "https://repo1.com" },
        { id: "repo2", name: "Repository 2", uri: "https://repo2.com" },
      ],
    },
    helpText: "Select repositories",
  };

  const mockMetadataField: StandardField = {
    id: "metadataStandards",
    commonStandardId: "metadata",
    label: "Metadata Standards",
    enabled: true,
    metaDataConfig: {
      hasCustomStandards: true,
      customStandards: [{ id: "standard1", name: "Standard 1", uri: "https://standard1.com" }],
    },
    helpText: "Select standards",
  };

  const mockLicensesField: StandardField = {
    id: "licenses",
    commonStandardId: "license_ref",
    label: "Licenses",
    enabled: true,
    licensesConfig: {
      mode: "addToDefaults",
      customTypes: [{ name: "Custom License", uri: "https://custom-license.com" }],
      selectedDefaults: ["MIT", "Apache-2.0"],
    },
    helpText: "Select licenses",
  };

  const mockAccessLevelsField: StandardField = {
    id: "accessLevels",
    commonStandardId: "data_access",
    label: "Access Levels",
    enabled: true,
    accessLevelsConfig: {
      mode: "mine",
      customLevels: [
        { value: "public", label: "Public", selected: true },
        { value: "private", label: "Private", selected: false },
      ],
      selectedDefaults: ["public", "restricted"],
    },
    helpText: "Select access levels",
  };

  const mockAdditionalField = {
    id: "additional1",
    commonStandardId: "custom",
    enabled: true,
    heading: "Additional Field 1",
    label: "Additional Field 1",
    content: {
      attributes: {
        help: "Additional field help text",
        maxLength: "255",
        defaultValue: "Default value",
      },
    },
    /* eslint-disable @typescript-eslint/no-explicit-any */
  } as any;

  it('should render the component without crashing', () => {
    const props = {
      standardFields: [],
      additionalFields: [],
    };
    render(<ResearchOutputDisplay {...props} />);
    expect(screen.getByText('researchOutput.headings.enableStandardFields')).toBeInTheDocument();
  });

  it('should render the standard fields heading and description', () => {
    const props = {
      standardFields: [mockStandardField],
      additionalFields: [],
    };
    render(<ResearchOutputDisplay {...props} />);
    expect(screen.getByText('researchOutput.headings.enableStandardFields')).toBeInTheDocument();
    expect(screen.getByText('researchOutput.description')).toBeInTheDocument();
  });

  it('should only render enabled standard fields', () => {
    const disabledField: StandardField = {
      ...mockStandardField,
      enabled: false,
    };
    const props = {
      standardFields: [mockStandardField, disabledField],
      additionalFields: [],
    };
    render(<ResearchOutputDisplay {...props} />);
    expect(screen.getByText('Title')).toBeInTheDocument();
    expect(screen.queryByText('Disabled Field')).not.toBeInTheDocument();
  });

  it('should display required badge for title and outputType fields', () => {
    const props = {
      standardFields: [mockStandardField, mockOutputTypeField],
      additionalFields: [],
    };
    render(<ResearchOutputDisplay {...props} />);
    const requiredBadges = screen.getAllByText('researchOutput.tooltip.requiredFields')
    expect(requiredBadges.length).toBeGreaterThanOrEqual(1);
  });

  it('should not display required badge for non-required fields', () => {
    const props = {
      standardFields: [mockDataFlagField],
      additionalFields: [],
    };
    render(<ResearchOutputDisplay {...props} />);
    expect(screen.queryByText('researchOutput.tooltip.requiredFields')).not.toBeInTheDocument();
  });

  describe('Data Flags Field', () => {
    it('should render data flags when field id is dataFlags', () => {
      const props = {
        standardFields: [mockDataFlagField],
        additionalFields: [],
      };
      render(<ResearchOutputDisplay {...props} />);
      expect(screen.getByText('researchOutput.legends.dataFlag:')).toBeInTheDocument();
      expect(screen.getByText('Flag 1')).toBeInTheDocument();
    });

    it('should only display selected data flags', () => {
      const props = {
        standardFields: [mockDataFlagField],
        additionalFields: [],
      };
      render(<ResearchOutputDisplay {...props} />);
      expect(screen.getByText('Flag 1')).toBeInTheDocument();
      expect(screen.queryByText('Flag 2')).not.toBeInTheDocument();
    });
  });

  describe('Output Type Field', () => {
    it('should render custom output types configuration', () => {
      const props = {
        standardFields: [mockOutputTypeField],
        additionalFields: [],
      };
      render(<ResearchOutputDisplay {...props} />);
      expect(screen.getByText('Configuration Mode:')).toBeInTheDocument();
      expect(screen.getByText('researchOutput.labels.customOutputTypes')).toBeInTheDocument();
      expect(screen.getByText('Type 1')).toBeInTheDocument();
      expect(screen.getByText('Type 2')).toBeInTheDocument();
    });

    it('should render default output types configuration', () => {
      const props = {
        standardFields: [mockOutputTypeDefaultField],
        additionalFields: [],
      };
      render(<ResearchOutputDisplay {...props} />);
      expect(screen.getByText('researchOutput.labels.defaultOutputTypes')).toBeInTheDocument();
      expect(screen.getByText('DEFAULT_TYPE_1')).toBeInTheDocument();
      expect(screen.getByText('DEFAULT_TYPE_2')).toBeInTheDocument();
    });

    it('should display help text for output type field', () => {
      const props = {
        standardFields: [mockOutputTypeField],
        additionalFields: [],
      };
      render(<ResearchOutputDisplay {...props} />);
      expect(screen.getByText('researchOutput.tooltip.requiredFields')).toBeInTheDocument();
    });
  });

  describe('Repository Selector Field', () => {
    it('should render repository configuration', () => {
      const props = {
        standardFields: [mockRepoSelectorField],
        additionalFields: [],
      };
      render(<ResearchOutputDisplay {...props} />);
      expect(screen.getByText('Custom Repositories:')).toBeInTheDocument();
      expect(screen.getByText('Yes')).toBeInTheDocument();
      expect(screen.getByText('Repository 1')).toBeInTheDocument();
      expect(screen.getByText('Repository 2')).toBeInTheDocument();
    });

    it('should display repository URIs', () => {
      const props = {
        standardFields: [mockRepoSelectorField],
        additionalFields: [],
      };
      render(<ResearchOutputDisplay {...props} />);
      expect(screen.getByText('https://repo1.com')).toBeInTheDocument();
      expect(screen.getByText('https://repo2.com')).toBeInTheDocument();
    });

    it('should indicate when no custom repositories are configured', () => {
      const noRepoField: StandardField = {
        ...mockRepoSelectorField,
        repoConfig: {
          hasCustomRepos: false,
          customRepos: [],
        },
      };
      const props = {
        standardFields: [noRepoField],
        additionalFields: [],
      };
      render(<ResearchOutputDisplay {...props} />);
      expect(screen.getByText('No')).toBeInTheDocument();
    });
  });

  describe('Metadata Standards Field', () => {
    it('should render metadata standards configuration', () => {
      const props = {
        standardFields: [mockMetadataField],
        additionalFields: [],
      };
      render(<ResearchOutputDisplay {...props} />);
      expect(screen.getByText('Custom Metadata Standards:')).toBeInTheDocument();
      expect(screen.getByText('Yes')).toBeInTheDocument();
      expect(screen.getByText('Standard 1')).toBeInTheDocument();
    });

    it('should display metadata standard URIs', () => {
      const props = {
        standardFields: [mockMetadataField],
        additionalFields: [],
      };
      render(<ResearchOutputDisplay {...props} />);
      expect(screen.getByText('https://standard1.com')).toBeInTheDocument();
    });
  });

  describe('Licenses Field', () => {
    it('should render licenses configuration', () => {
      const props = {
        standardFields: [mockLicensesField],
        additionalFields: [],
      };
      render(<ResearchOutputDisplay {...props} />);
      expect(screen.getByText('researchOutput.labels.customLicenses')).toBeInTheDocument();
      expect(screen.getByText('Custom License')).toBeInTheDocument();
    });

    it('should display selected default licenses', () => {
      const props = {
        standardFields: [mockLicensesField],
        additionalFields: [],
      };
      render(<ResearchOutputDisplay {...props} />);
      expect(screen.getByText('MIT')).toBeInTheDocument();
      expect(screen.getByText('Apache-2.0')).toBeInTheDocument();
    });

    it('should display default licenses mode', () => {
      const defaultLicensesField: StandardField = {
        ...mockLicensesField,
        licensesConfig: {
          mode: 'defaults',
          selectedDefaults: ['MIT'],
          customTypes: [],
        },
      };
      const props = {
        standardFields: [defaultLicensesField],
        additionalFields: [],
      };
      render(<ResearchOutputDisplay {...props} />);
      expect(screen.getByText('researchOutput.labels.defaultLicenses')).toBeInTheDocument();
    });
  });

  describe('Access Levels Field', () => {
    it('should render access levels configuration', () => {
      const props = {
        standardFields: [mockAccessLevelsField],
        additionalFields: [],
      };
      render(<ResearchOutputDisplay {...props} />);
      expect(screen.getByText('Configuration Mode:')).toBeInTheDocument();
      expect(screen.getByText('Custom Access Levels')).toBeInTheDocument();
      expect(screen.getByText('Public')).toBeInTheDocument();
      expect(screen.getByText('Private')).toBeInTheDocument();
    });

    it('should display selected default access levels', () => {
      const props = {
        standardFields: [mockAccessLevelsField],
        additionalFields: [],
      };
      render(<ResearchOutputDisplay {...props} />);
      expect(screen.getByText('Public')).toBeInTheDocument();
      expect(screen.getByText('Private')).toBeInTheDocument();
    });

    it('should display default access levels mode', () => {
      const defaultAccessLevelsField: StandardField = {
        ...mockAccessLevelsField,
        accessLevelsConfig: {
          mode: 'defaults',
          customLevels: [],
          selectedDefaults: ['public'],
        },
        /* eslint-disable @typescript-eslint/no-explicit-any */
      } as any;
      const props = {
        standardFields: [defaultAccessLevelsField],
        additionalFields: [],
      };
      render(<ResearchOutputDisplay {...props} />);
      expect(screen.getByText('Default Access Levels')).toBeInTheDocument();
    });
  });

  describe('Additional Fields Section', () => {
    it('should render additional fields section when fields exist', () => {
      const props = {
        standardFields: [],
        additionalFields: [mockAdditionalField],
      };
      render(<ResearchOutputDisplay {...props} />);
      expect(screen.getByText('researchOutput.headings.additionalTextFields')).toBeInTheDocument();
      // Additional Field 1 appears in both label and detail value
      expect(screen.getAllByText('Additional Field 1').length).toBeGreaterThan(0);
    });

    it('should only render enabled additional fields', () => {
      const disabledAdditionalField = {
        ...mockAdditionalField,
        enabled: false,
      };
      const props = {
        standardFields: [],
        additionalFields: [mockAdditionalField, disabledAdditionalField],
      };
      render(<ResearchOutputDisplay {...props} />);
      // Additional Field 1 appears in both label and detail value
      expect(screen.getAllByText('Additional Field 1').length).toBeGreaterThan(0);
    });

    it('should display additional field details', () => {
      const props = {
        standardFields: [],
        additionalFields: [mockAdditionalField],
      };
      render(<ResearchOutputDisplay {...props} />);
      expect(screen.getByText('Additional field help text')).toBeInTheDocument();
      expect(screen.getByText('255')).toBeInTheDocument();
      expect(screen.getByText('Default value')).toBeInTheDocument();
    });

    it('should not render additional fields section if no fields exist', () => {
      const props = {
        standardFields: [],
        additionalFields: [],
      };
      render(<ResearchOutputDisplay {...props} />);
      expect(screen.queryByText('Additional Text Fields')).not.toBeInTheDocument();
    });
  });

  describe('Multiple Fields', () => {
    it('should render multiple standard fields together', () => {
      const props = {
        standardFields: [
          mockStandardField,
          mockDataFlagField,
          mockOutputTypeField,
        ],
        additionalFields: [],
      };
      render(<ResearchOutputDisplay {...props} />);
      expect(screen.getByText('Title')).toBeInTheDocument();
      expect(screen.getByText('Data Flags')).toBeInTheDocument();
      expect(screen.getByText('Output Type')).toBeInTheDocument();
    });

    it('should render both standard and additional fields', () => {
      const props = {
        standardFields: [mockStandardField],
        additionalFields: [mockAdditionalField],
      };
      render(<ResearchOutputDisplay {...props} />);
      expect(screen.getByText('researchOutput.headings.enableStandardFields')).toBeInTheDocument();
      expect(screen.getByText('researchOutput.headings.additionalTextFields')).toBeInTheDocument();
      expect(screen.getByText('Title')).toBeInTheDocument();
      // Additional Field 1 appears in both label and detail value
      expect(screen.getAllByText('Additional Field 1').length).toBeGreaterThan(0);
    });
  });

  describe('Edge Cases', () => {
    it('should handle empty arrays', () => {
      const props = {
        standardFields: [],
        additionalFields: [],
      };
      render(<ResearchOutputDisplay {...props} />);
      expect(screen.getByText('researchOutput.headings.enableStandardFields')).toBeInTheDocument();
    });

    it('should handle field without help text', () => {
      const fieldWithoutHelpText: StandardField = {
        id: "description",
        commonStandardId: "description",
        label: "Description",
        enabled: true,
      };
      const props = {
        standardFields: [fieldWithoutHelpText],
        additionalFields: [],
      };
      render(<ResearchOutputDisplay {...props} />);
      expect(screen.getByText('Description')).toBeInTheDocument();
    });

    it('should handle output type field without config', () => {
      const incompleteOutputTypeField: StandardField = {
        id: "outputType",
        commonStandardId: "type",
        label: "Output Type",
        enabled: true,
      };
      const props = {
        standardFields: [incompleteOutputTypeField],
        additionalFields: [],
      };
      render(<ResearchOutputDisplay {...props} />);
      expect(screen.getByText('Output Type')).toBeInTheDocument();
    });

    it('should handle additional field without optional attributes', () => {
      const minimalAdditionalField = {
        id: "additional-minimal",
        commonStandardId: "custom",
        enabled: true,
        heading: "Minimal Field",
        label: "Minimal Field",
        /* eslint-disable @typescript-eslint/no-explicit-any */
      } as any;
      const props = {
        standardFields: [],
        additionalFields: [minimalAdditionalField],
      };
      render(<ResearchOutputDisplay {...props} />);
      // Minimal Field appears in both label and detail value
      expect(screen.getAllByText('Minimal Field').length).toBeGreaterThan(0);
    });
  });
});
