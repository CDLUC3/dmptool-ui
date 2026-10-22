import React from 'react';
import type { AffiliationSearchQuestionType } from '@dmptool/types';
import { fireEvent, render, screen } from '@/utils/test-utils';

import { AffiliationSearchQuestionComponent } from '@/components/Form/QuestionComponents';
import { TypeAheadInputProps } from '@/components/Form/TypeAheadWithOther/TypeAheadWithOther';
import mocksAffiliations from '@/__mocks__/common/mockAffiliations.json';

// Mock the TypeAheadWithOther component since it's already tested as part of the component itself
jest.mock('@/components/Form/TypeAheadWithOther', () => ({
  __esModule: true,
  useAffiliationSearch: jest.fn(() => ({
    suggestions: mocksAffiliations,
    handleSearch: jest.fn(),
  })),
  TypeAheadWithOther: ({ label, placeholder, fieldName, updateFormData }: TypeAheadInputProps) => (
    <div>
      <label>
        {label}
        <input
          aria-label={label}
          placeholder={placeholder}
          name={fieldName}
          role="textbox"
          value="Test Institution"
          onChange={() => updateFormData('1', 'Test University')}
        />
      </label>
      <ul role="listbox">
        <li>Search Term</li>
      </ul>
    </div>
  ),
}));

describe('TypeaheadSearchQuestionComponent', () => {
  const mockHandleAffiiationChange = jest.fn();
  const mockHandleOtherAffiliationChange = jest.fn();
  const mockSetOtherField = jest.fn();
  const mockAffiliationData = {
    affiliationName: 'Test Institution',
    affiliationId: '12345'
  };
  const mockParsedQuestion: AffiliationSearchQuestionType = {
    type: "affiliationSearch",
    meta: {
      schemaVersion: "1.0",
    },
    attributes: {
      label: "Organization",
      labelTranslationKey: "questions.organizations",
      help: "Pick an organization"
    },
    graphQL: {
      responseField: "affiliations.items",
      answerField: "uri",
      localQueryId: "getOrganizations",
      displayFields: [
        {
          label: "Organization",
          propertyName: "displayName",
          labelTranslationKey: "organization.name"
        }
      ],
      query: "\nquery Affiliations($name: String!){\n  affiliations(name: $name) {\n    totalCount\n    nextCursor\n    items {\n      id\n      displayName\n      uri\n    }\n  }\n}",
      variables: [
        {
          name: "name",
          type: "String",
          label: "Search Term",
          labelTranslationKey: "search.label",
          minLength: 3
        }
      ]
    }
  };

  beforeEach(() => {
    global.fetch = jest.fn().mockResolvedValue({
      ok: true,
      json: async () => ({
        data: {
          publishPlan: {
            success: true,
          },
        },
      }),
    }) as jest.Mock;
  })
  afterEach(() => {
    jest.clearAllMocks();
  });


  it('should render correct label and text', () => {
    render(
      <AffiliationSearchQuestionComponent
        parsedQuestion={mockParsedQuestion}
        affiliationData={mockAffiliationData}
        otherAffiliationName=''
        otherField={false}
        setOtherField={mockSetOtherField}
        handleAffiliationChange={mockHandleAffiiationChange}
        handleOtherAffiliationChange={mockHandleOtherAffiliationChange}
      />
    );
    expect(screen.getByLabelText('Organization')).toBeInTheDocument();
    expect(screen.getByRole('textbox')).toHaveValue('Test Institution');
    expect(screen.getByText('Search Term')).toBeInTheDocument();
    expect(screen.getByRole('listbox')).toBeInTheDocument();
  });

  it('should set otherField to false if it is not passed in', () => {
    render(
      <AffiliationSearchQuestionComponent
        parsedQuestion={mockParsedQuestion}
        affiliationData={mockAffiliationData}
        otherAffiliationName=""
        setOtherField={mockSetOtherField}
        handleAffiliationChange={mockHandleAffiiationChange}
        handleOtherAffiliationChange={mockHandleOtherAffiliationChange}
      />
    );
    expect(screen.queryByLabelText('otherLabel')).not.toBeInTheDocument();
  });

  it('should set otherAffiliationName to an empty string if none is passed', () => {
    render(
      <AffiliationSearchQuestionComponent
        parsedQuestion={mockParsedQuestion}
        affiliationData={mockAffiliationData}
        otherField={true}
        setOtherField={mockSetOtherField}
        handleAffiliationChange={mockHandleAffiiationChange}
        handleOtherAffiliationChange={mockHandleOtherAffiliationChange}
      />
    );
    expect(screen.queryByLabelText('otherLabel')).toBeInTheDocument();
    expect(screen.getByPlaceholderText('otherPlaceholder')).toHaveValue('');
  });

  it('should render the "Other institution" input when otherField is true', () => {
    render(
      <AffiliationSearchQuestionComponent
        parsedQuestion={mockParsedQuestion}
        affiliationData={mockAffiliationData}
        otherAffiliationName="Other Inst"
        otherField={true}
        setOtherField={mockSetOtherField}
        handleAffiliationChange={mockHandleAffiiationChange}
        handleOtherAffiliationChange={mockHandleOtherAffiliationChange}
      />
    );

    expect(screen.getByLabelText('otherLabel')).toBeInTheDocument();
    expect(screen.getByPlaceholderText('otherPlaceholder')).toHaveValue('Other Inst');
  });

  it('should call handleAffiliationChange when typing in the typeahead', () => {
    render(
      <AffiliationSearchQuestionComponent
        parsedQuestion={mockParsedQuestion}
        affiliationData={mockAffiliationData}
        otherAffiliationName=""
        otherField={false}
        setOtherField={mockSetOtherField}
        handleAffiliationChange={mockHandleAffiiationChange}
        handleOtherAffiliationChange={mockHandleOtherAffiliationChange}
      />
    );
    fireEvent.change(screen.getByRole('textbox', { name: /organization/i }), {
      target: { value: 'New Institution' }
    });
    expect(mockHandleAffiiationChange).toHaveBeenCalled();
  });

  it('should call handleOtherAffiliationChange when typing in "Other institution"', () => {
    render(
      <AffiliationSearchQuestionComponent
        parsedQuestion={mockParsedQuestion}
        affiliationData={mockAffiliationData}
        otherAffiliationName="Other Inst"
        otherField={true}
        setOtherField={mockSetOtherField}
        handleAffiliationChange={mockHandleAffiiationChange}
        handleOtherAffiliationChange={mockHandleOtherAffiliationChange}
      />
    );
    const input = screen.getByPlaceholderText('otherPlaceholder');
    fireEvent.change(input, { target: { value: 'Another Inst' } });
    expect(mockHandleOtherAffiliationChange).toHaveBeenCalled();
  });
});