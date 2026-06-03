import React from 'react';

import {
  render,
  screen,
  fireEvent,
  waitFor,
} from '@testing-library/react';

import '@testing-library/jest-dom';
import { useParams, useRouter } from 'next/navigation';
import { MockedProvider } from '@apollo/client/testing/react';
import {
  ProjectFundingsDocument,
  PlanFundingsDocument,
  UpdatePlanFundingDocument,
} from '@/generated/graphql';

import { axe, toHaveNoViolations } from 'jest-axe';

import { scrollToTop } from '@/utils/general';
import logECS from '@/utils/clientLogger';

import ProjectsProjectPlanAdjustFunding from '../page';
import { useToast } from '@/context/ToastContext';


expect.extend(toHaveNoViolations);


// GraphQL Mocks
const MOCKS = [
  // Fetch the existing project funding selection
  {
    request: {
      query: PlanFundingsDocument,
      variables: {
        planId: 456,
      },
    },

    result: {
      data: {
        planFundings: [
          {
            id: 101,
            projectFunding: {
              id: 222
            }
          },
        ],
      },
    },
  },

  // Fetch Project Funders: Success
  {
    request: {
      query: ProjectFundingsDocument,
      variables: {
        projectId: 123,
      },
    },

    result: {
      data: {
        projectFundings: [
          {
            id: 111,
            affiliation: {
              displayName: "Project Funder A",
              name: "National Science Foundation",
              uri: "https://funderA",
            },
            funderOpportunityNumber: "NSF-12345-ABC",
            funderProjectNumber: null,
            grantId: null,
            status: "PLANNED"
          },

          // This one is to test response errors when choosing this
          {
            id: 222,
            affiliation: {
              displayName: "Project Funder B",
              name: "National Institutes of Health",
              uri: "https://funderB",
            },
            funderOpportunityNumber: "NSF-12345-ABC",
            funderProjectNumber: null,
            grantId: null,
            status: "PLANNED"
          },

          // This one is to test network errors when choosing this
          {
            id: 333,
            affiliation: {
              displayName: "Project Funder C",
              name: "Department of Energy",
              uri: "https://funderC",
            },
            funderOpportunityNumber: "NSF-12345-ABC",
            funderProjectNumber: null,
            grantId: null,
            status: "PLANNED"
          },
        ],
      },
    },
  },

  // Adding Funder: Success
  {
    request: {
      query: UpdatePlanFundingDocument,
      variables: {
        planId: 456,
        projectFundingIds: [111, 222],
      },
    },

    result: {
      data: {
        updatePlanFunding: [
          {
            __typename: "PlanFunding",
            errors: {
              __typename: "PlanFundingErrors",
              ProjectFundingId: null,
              general: null,
              planId: null,
            },
            projectFunding: {
              __typename: "ProjectFunding",
              id: 111,
            }
          },
          {
            errors: {
              __typename: "PlanFundingErrors",
              ProjectFundingId: null,
              general: null,
              planId: null
            },
            projectFunding: {
              __typename: "ProjectFunding",
              id: 222,
            }
          },
        ]
      }
    },
  },

  // Add Funder: Response Error
  {
    request: {
      query: UpdatePlanFundingDocument,
      variables: {
        planId: 456,
        projectFundingIds: [222],
      },
    },

    result: {
      data: {
        updatePlanFunding: [
          {
            __typename: "PlanFunding",
            errors: {
              __typename: "PlanFundingErrors",
              ProjectFundingId: null,
              general: "This should throw an error",
              planId: null,
            },
            projectFunding: {
              __typename: "ProjectFunding",
              id: 222,
            }

          }
        ]
      }
    },
  },

  // Add Funder: Network Error
  {
    request: {
      query: UpdatePlanFundingDocument,
      variables: {
        planId: 456,
        projectFundingIds: [222, 333],
      },
    },
    error: new Error('Network error'),
  },

  {
    request: {
      query: UpdatePlanFundingDocument,
      variables: {
        planId: 456,
        projectFundingIds: [], // No funders selected (empty array)
      },
    },
    result: {
      data: {
        updatePlanFunding: [
          {
            __typename: "PlanFunding",
            errors: {
              __typename: "PlanFundingErrors",
              ProjectFundingId: null,
              general: "This should throw an error",
              planId: null,
            },
            projectFunding: {
              __typename: "ProjectFunding",
              id: null,
            }

          }
        ]
      }
    },
  },
];


// Other Mocks
jest.mock('next/navigation', () => ({
  useRouter: jest.fn(),
  useParams: jest.fn(),
  usePathname: jest.fn(() => {
    return '/en-US/projects/123/dmp/345/fundings';
  })
}));

// Needed for the errormessages component
jest.mock('@/utils/general', () => ({
  scrollToTop: jest.fn(),
  stripHtml: jest.fn(),
}));

jest.mock('@/components/PageHeader', () => ({
  __esModule: true,
  default: () => <div data-testid="mock-page-header" />
}));

const mockToast = {
  add: jest.fn(),
};


// Keep these separate and lean, so that we can customize based on
// test requirements
const mockUseRouter = useRouter as jest.Mock;
const mockParams = useParams as jest.Mock;


// Tests
describe('ProjectsProjectPlanAdjustFunding', () => {
  beforeEach(() => {
    window.scrollTo = jest.fn(); // Mock scrollTo to prevent errors in tests

    // No individual test overrides needed. Just define the same everywhere.
    mockUseRouter.mockReturnValue({
      push: jest.fn(),
    });

    // This might change based on the tests
    mockParams.mockReturnValue({
      projectId: '123',
      dmpid: '456',
    });

    // Mock Toast
    (useToast as jest.Mock).mockReturnValue(mockToast);
  });

  afterEach(() => {
    jest.clearAllMocks();
  });

  it('should render the radio group with funding options', async () => {
    render(
      <MockedProvider mocks={MOCKS}>
        <ProjectsProjectPlanAdjustFunding />
      </MockedProvider>
    );

    expect(screen.getByText('fundingLabel')).toBeInTheDocument();

    // Wait for the graphQL query to finish and check if the results are in
    await waitFor(() => {
      expect(screen.getByText('Project Funder A')).toBeInTheDocument();
      expect(screen.getByText('Project Funder B')).toBeInTheDocument();
    });
  });

  it('should render the note about changing the funding sources', () => {
    render(
      <MockedProvider mocks={MOCKS}>
        <ProjectsProjectPlanAdjustFunding />
      </MockedProvider>
    );

    expect(screen.getByText('changeWarning')).toBeInTheDocument();
  });

  it('should render the save button', () => {
    render(
      <MockedProvider mocks={MOCKS}>
        <ProjectsProjectPlanAdjustFunding />
      </MockedProvider>
    );

    expect(screen.getByRole('button', { name: 'buttons.save' })).toBeInTheDocument();
  });

  it('should have the current funding choice selected', async () => {
    render(
      <MockedProvider mocks={MOCKS}>
        <ProjectsProjectPlanAdjustFunding />
      </MockedProvider>
    );

    await waitFor(() => {
      const optionA = screen.getByRole('checkbox', { name: 'Project Funder A' });
      expect(optionA).toBeInTheDocument();
      expect(optionA).not.toBeChecked();

      const optionB = screen.getByRole('checkbox', { name: 'Project Funder B' });
      expect(optionB).toBeInTheDocument();
      expect(optionB).toBeChecked();
    });
  });

  it('should handle form submission', async () => {
    render(
      <MockedProvider mocks={MOCKS}>
        <ProjectsProjectPlanAdjustFunding />
      </MockedProvider>
    );

    // Wait for BOTH queries to complete - checkboxes AND initial selection
    await waitFor(() => {
      const funderA = screen.getByRole('checkbox', { name: 'Project Funder A' });
      const funderB = screen.getByRole('checkbox', { name: 'Project Funder B' });
      expect(funderA).toBeInTheDocument();
      expect(funderA).not.toBeChecked(); // Verify initial state
      expect(funderB).toBeChecked(); // Verify B is pre-selected
    });

    // Click Funder A and wait for state to update
    const funderA = screen.getByRole('checkbox', { name: 'Project Funder A' });
    fireEvent.click(funderA);

    // Verify the checkbox state changed before submitting
    await waitFor(() => {
      expect(funderA).toBeChecked();
    });

    // Now submit the form
    const saveButton = screen.getByRole('button', { name: 'buttons.save' });
    fireEvent.click(saveButton);

    // Wait for the mutation to complete with a longer timeout
    await waitFor(
      () => {
        expect(mockToast.add).toHaveBeenCalledWith('successfullyUpdated', { type: 'success' });
        expect(mockUseRouter().push).toHaveBeenCalledWith('/en-US/projects/123/dmp/456');
      },
      { timeout: 3000 } // Increase timeout for slower CI environments
    );
  });

  it('should handle errors on form submission', async () => {
    render(
      <MockedProvider mocks={MOCKS}>
        <ProjectsProjectPlanAdjustFunding />
      </MockedProvider>
    );

    await waitFor(() => {
      const option = screen.getByRole('checkbox', { name: 'Project Funder B' });
      expect(option).toBeInTheDocument();
      fireEvent.click(option);
    });

    const saveButton = screen.getByRole('button', { name: 'buttons.save' });
    fireEvent.click(saveButton);

    await waitFor(() => {
      expect(screen.getByText("This should throw an error")).toBeInTheDocument();
      expect(scrollToTop).toHaveBeenCalled();
    });
  });

  it('should handle network errors on form submission', async () => {
    render(
      <MockedProvider mocks={MOCKS}>
        <ProjectsProjectPlanAdjustFunding />
      </MockedProvider>
    );

    // Wait for BOTH queries to resolve, including the pre-selection of Funder B
    await waitFor(() => {
      expect(screen.getByRole('checkbox', { name: 'Project Funder C' })).toBeInTheDocument();
      expect(screen.getByRole('checkbox', { name: 'Project Funder B' })).toBeChecked();
    });

    fireEvent.click(screen.getByRole('checkbox', { name: 'Project Funder C' }));

    const saveButton = screen.getByRole('button', { name: 'buttons.save' });
    fireEvent.click(saveButton);

    await waitFor(() => {
      expect(logECS).toHaveBeenCalledWith(
        'error',
        'addPlanFunding',
        expect.objectContaining({
          error: expect.anything(),
          url: { path: '/en-US/projects/123/dmp/345/fundings' },
        })
      );
    });
  });

  it('should render the link to add new funding', () => {
    render(
      <MockedProvider mocks={MOCKS}>
        <ProjectsProjectPlanAdjustFunding />
      </MockedProvider>
    );

    const addFundingLink = screen.getByText("addSourceLink");
    expect(addFundingLink).toBeInTheDocument();
    expect(addFundingLink).toHaveAttribute('href', '/en-US/projects/123/fundings/search');
  });

  it('should pass accessibility tests', async () => {
    const { container } = render(
      <MockedProvider mocks={MOCKS}>
        <ProjectsProjectPlanAdjustFunding />
      </MockedProvider>
    );

    await waitFor(async () => {
      const results = await axe(container);
      expect(results).toHaveNoViolations();
    });
  });
});