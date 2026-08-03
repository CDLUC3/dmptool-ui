import React from 'react';
import { act, fireEvent, render, screen, waitFor } from '@testing-library/react';
import { useParams, useRouter } from 'next/navigation';
import { MockedProvider } from '@apollo/client/testing/react';
import {
  AddAffiliationDocument,
  AddProjectFundingDocument,
} from '@/generated/graphql';

import logECS from '@/utils/clientLogger';

import { mockScrollIntoView, mockScrollTo } from "@/__mocks__/common";
import { TypeAheadInputProps } from '@/components/Form/TypeAheadWithOther/TypeAheadWithOther';
import mocksAffiliations from '@/__mocks__/common/mockAffiliations.json';
import AddProjectFunderManually from '../page';
import { axe, toHaveNoViolations } from 'jest-axe';


expect.extend(toHaveNoViolations);

// Mock TypeAhead component since it has its own tests
jest.mock('@/components/Form/TypeAheadWithOther', () => ({
  __esModule: true,
  useAffiliationSearch: jest.fn(() => ({
    suggestions: mocksAffiliations,
    handleSearch: jest.fn(),
  })),
  TypeAheadWithOther: ({ label, placeholder, fieldName, updateFormData, value, setOtherField }: TypeAheadInputProps) => {
    const [inputValue, setInputValue] = React.useState(value || '');

    return (
      <div>
        <label htmlFor={fieldName}>{label}</label>
        <input
          id={fieldName}
          aria-label={label}  // ensures accessible name
          placeholder={placeholder}
          name={fieldName}
          role="combobox"
          aria-autocomplete="list"
          aria-controls={`${fieldName}-listbox`}
          aria-expanded="true"
          value={inputValue}
          onChange={(e) => {
            const newValue = e.target.value;
            setInputValue(newValue);
            setOtherField?.(true);
            updateFormData?.('https://ror.org/0168r3w48', newValue);
          }}
        />

        <ul
          id={`${fieldName}-listbox`}
          role="listbox"
          aria-label={`${label} suggestions`}
        >
          <li role="option" aria-selected="false">Search Term</li>
        </ul>
      </div>
    );
  },
}));

const successMocks = [
  // For creating the Affiliate
  {
    request: {
      query: AddAffiliationDocument,
      variables: {
        input: {
          funder: true,
          displayName: "New-funderName-123",
        },
      },
    },

    result: {
      data: {
        addAffiliation: {
          errors: {
            name: null,
            general: null
          },
          uri: "https://dmptool/123",
        }
      }
    },
  },
  {
    request: {
      query: AddAffiliationDocument,
      variables: {
        input: {
          funder: true,
          displayName: "New-funderName-123",
        },
      },
    },

    result: {
      data: {
        addAffiliation: {
          errors: {
            name: null,
            general: null
          },
          uri: "https://dmptool/123",
        }
      }
    },
  },

  // Second part for creating the ProjectFunding connection
  {
    request: {
      query: AddProjectFundingDocument,
      variables: {
        input: {
          projectId: 111,
          affiliationId: "https://dmptool/123",
          funderOpportunityNumber: 'New-opportunity-123',
          funderProjectNumber: 'New-projectNumber-123',
          grantId: 'New-grantNumber-123',
          status: 'GRANTED',
        }
      },
    },

    result: {
      data: {
        addProjectFunding: {
          id: "333",
          errors: {
            projectId: null,
            affiliationId: null,
            funderOpportunityNumber: null,
            funderProjectNumber: null,
            grantId: null,
            general: null,
            status: null,
          },
        },
      },
    },
  },
  {
    request: {
      query: AddProjectFundingDocument,
      variables: {
        input: {
          projectId: 111,
          affiliationId: "https://ror.org/0168r3w48",
          funderOpportunityNumber: 'New-opportunity-123',
          funderProjectNumber: 'New-projectNumber-123',
          grantId: 'New-grantNumber-123',
          status: 'GRANTED',
        }
      },
    },

    result: {
      data: {
        addProjectFunding: {
          id: "333",
          errors: {
            projectId: null,
            affiliationId: null,
            funderOpportunityNumber: null,
            funderProjectNumber: null,
            grantId: null,
            general: null,
            status: null,
          },
        },
      },
    },
  },
];

const errorMocks = [
  // For creating the Affiliate
  {
    request: {
      query: AddAffiliationDocument,
      variables: {
        input: {
          funder: true,
          displayName: "Affiliate Field Error",
        },
      },
    },

    result: {
      data: {
        addAffiliation: {
          errors: {
            name: "Error with affiliate name",
            general: null
          },
          uri: null,
        }
      }
    },
  },

  {
    request: {
      query: AddAffiliationDocument,
      variables: {
        input: {
          funder: true,
          displayName: "Valid Affiliate",
        },
      },
    },

    result: {
      data: {
        addAffiliation: {
          errors: {
            name: null,
            general: null
          },
          uri: "https://dmptool/123",
        }
      }
    },
  },

  // Second part for creating the ProjectFunding connection
  {
    request: {
      query: AddProjectFundingDocument,
      variables: {
        input: {
          projectId: 111,
          affiliationId: "https://dmptool/123",
          funderOpportunityNumber: '',
          funderProjectNumber: '',
          grantId: '',
          status: 'PLANNED',
        }
      },
    },

    result: {
      data: {
        addProjectFunding: {
          id: "333",
          errors: {
            projectId: null,
            affiliationId: null,
            funderOpportunityNumber: "Opportunity number is required",
            funderProjectNumber: "Project number is required",
            grantId: "Grant id is required",
            general: null,
            status: null,
          },
        },
      },
    },
  },
  {
    request: {
      query: AddProjectFundingDocument,
      variables: {
        input: {
          projectId: 111,
          affiliationId: "https://ror.org/0168r3w48",
          funderOpportunityNumber: '',
          funderProjectNumber: '',
          grantId: '',
          status: 'PLANNED',
        }
      },
    },

    result: {
      data: {
        addProjectFunding: {
          id: "333",
          errors: {
            projectId: null,
            affiliationId: null,
            funderOpportunityNumber: null,
            funderProjectNumber: null,
            grantId: null,
            general: null,
            status: null,
          },
        },
      },
    },
  },

  // Apollo Errors
  {
    request: {
      query: AddAffiliationDocument,
      variables: {
        input: {
          funder: true,
          displayName: "Affiliate Exception",
        },
      },
    },
    error: new Error('Server Error')
  }
];


jest.mock('next/navigation', () => ({
  useParams: jest.fn(),
  useRouter: jest.fn()
}));


describe('AddProjectFunderManually', () => {

  beforeEach(() => {
    const mockParams = useParams as jest.Mock;
    mockParams.mockReturnValue({ projectId: '111' });

    HTMLElement.prototype.scrollIntoView = mockScrollIntoView;
    mockScrollTo();
  });

  it('should render the project details form', async () => {
    await act(async () => {
      render(
        <MockedProvider mocks={successMocks}>
          <AddProjectFunderManually />
        </MockedProvider>
      );
    });

    expect(screen.getByLabelText('labels.funderName')).toBeInTheDocument();
    expect(screen.getByText('labels.grantNumber')).toBeInTheDocument();
    expect(screen.getByLabelText('labels.projectNumber')).toBeInTheDocument();
    expect(screen.getByLabelText('labels.opportunity')).toBeInTheDocument();
    expect(screen.getByRole('button', { name: /buttons.saveChanges/i })).toBeInTheDocument();
  });

  it('should run correct mutations and redirect on submitting valid data', async () => {
    const mockPush = jest.fn();
    (useRouter as jest.Mock).mockReturnValue({ push: mockPush });

    await act(async () => {
      render(
        <MockedProvider mocks={successMocks}>
          <AddProjectFunderManually />
        </MockedProvider>
      );
    });

    // Update data
    fireEvent.change(
      screen.getByLabelText('labels.funderName'),
      { target: { value: 'New-funderName-123' } }
    );

    //Enter a value for the "Other Affiliation" field, since we're automatically setting "otherField" to true in the mock
    fireEvent.change(
      screen.getByLabelText('Other Institution'),
      { target: { value: 'New-funderName-123' } }
    );


    // To change the value in FormSelect, we need to "click" to open the options
    const statusSelect = screen.getByRole('button', { name: /fundingStatus/ });
    fireEvent.click(statusSelect);

    // Now we need to click on one of the options
    const optionGranted = screen.getByRole('option', { name: /granted/i });
    fireEvent.click(optionGranted);

    fireEvent.change(
      screen.getByLabelText('labels.grantNumber'),
      { target: { value: 'New-grantNumber-123' } }
    );

    fireEvent.change(
      screen.getByLabelText('labels.projectNumber'),
      { target: { value: 'New-projectNumber-123' } }
    );

    fireEvent.change(
      screen.getByLabelText('labels.opportunity'),
      { target: { value: 'New-opportunity-123' } }
    );

    // Submit the form
    fireEvent.submit(screen.getByRole('button', { name: /buttons.saveChanges/i }));

    await waitFor(() => {
      expect(mockPush).toHaveBeenCalledWith(expect.stringMatching(/\/projects\/111\/fundings/));
    });
  });

  it('should display error when addAffiliation returns an error', async () => {
    const mockPush = jest.fn();
    (useRouter as jest.Mock).mockReturnValue({ push: mockPush });

    await act(async () => {
      render(
        <MockedProvider mocks={errorMocks}>
          <AddProjectFunderManually />
        </MockedProvider>
      );
    });

    fireEvent.change(
      screen.getByLabelText('labels.funderName'),
      { target: { value: 'Affiliate Field Error' } }
    );

    //Enter a value for the "Other Affiliation" field, since we're automatically setting "otherField" to true in the mock
    fireEvent.change(
      screen.getByLabelText('Other Institution'),
      { target: { value: 'Affiliate Field Error' } }
    );

    // Submit the form
    fireEvent.submit(screen.getByRole('button', { name: /buttons.saveChanges/i }));

    await waitFor(() => {
      expect(screen.getByText('messages.errors.projectFundingUpdateFailed')).toBeInTheDocument();
      expect(mockPush).not.toHaveBeenCalled();
    });
  });

  it('should display errors for the projectfunding fields', async () => {
    const mockPush = jest.fn();
    (useRouter as jest.Mock).mockReturnValue({ push: mockPush });

    await act(async () => {
      render(
        <MockedProvider mocks={errorMocks}>
          <AddProjectFunderManually />
        </MockedProvider>
      );
    });

    fireEvent.change(
      screen.getByLabelText('labels.funderName'),
      { target: { value: 'Valid Affiliate' } }
    );

    //Enter a value for the "Other Affiliation" field, since we're automatically setting "otherField" to true in the mock
    fireEvent.change(
      screen.getByLabelText('Other Institution'),
      { target: { value: 'Valid Affiliate' } }
    );

    // Submit the form
    fireEvent.submit(screen.getByRole('button', { name: /buttons.saveChanges/i }));

    await waitFor(() => {
      expect(screen.getByText('messages.errors.projectFundingUpdateFailed')).toBeInTheDocument();
      expect(screen.getByText('Opportunity number is required')).toBeInTheDocument();
      expect(screen.getByText('Project number is required')).toBeInTheDocument();
      expect(screen.getByText('Grant id is required')).toBeInTheDocument();
      expect(mockPush).not.toHaveBeenCalled();
    });
  });

  it('should handle errors thrown by the graphql mutations promise chain', async () => {
    const mockPush = jest.fn();
    (useRouter as jest.Mock).mockReturnValue({ push: mockPush });

    await act(async () => {
      render(
        <MockedProvider mocks={errorMocks}>
          <AddProjectFunderManually />
        </MockedProvider>
      );
    });

    fireEvent.change(
      screen.getByLabelText('labels.funderName'),
      { target: { value: 'Affiliate Exception' } }
    );

    //Enter a value for the "Other Affiliation" field, since we're automatically setting "otherField" to true in the mock
    fireEvent.change(
      screen.getByLabelText('Other Institution'),
      { target: { value: 'Affiliate Exception' } }
    );

    // Submit the form
    fireEvent.submit(screen.getByRole('button', { name: /buttons.saveChanges/i }));

    await waitFor(() => {
      expect(screen.getByText('Server Error')).toBeInTheDocument();
      expect(mockPush).not.toHaveBeenCalled();
    });

    await waitFor(() => {
      expect(logECS).toHaveBeenCalledWith(
        'error',
        'addAffiliation',
        expect.objectContaining({
          err: expect.anything(),
          url: { path: '/projects/[projectId]/fundings/add' },
        })
      );
    });
  });

  it('should pass axe accessibility test', async () => {
    const { container } = render(
      <MockedProvider mocks={successMocks}>
        <AddProjectFunderManually />
      </MockedProvider>
    );

    const results = await axe(container);
    expect(results).toHaveNoViolations();
  });
});
