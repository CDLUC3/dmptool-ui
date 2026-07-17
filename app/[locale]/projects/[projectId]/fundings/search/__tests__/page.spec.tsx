import React from 'react';

import {
  render,
  screen,
  fireEvent,
  waitFor,
  within,
} from '@testing-library/react';

import { useParams, useRouter } from 'next/navigation';
import { MockedProvider } from '@apollo/client/testing/react';
import {
  AffiliationFundersDocument,
  PopularFundersDocument,
  AddProjectFundingDocument,
} from '@/generated/graphql';

import { scrollToTop } from '@/utils/general';
import logECS from "@/utils/clientLogger";
import { useToast } from '@/context/ToastContext';

import CreateProjectSearchFunder from '../page';
import { axe, toHaveNoViolations } from 'jest-axe';


expect.extend(toHaveNoViolations);


const mocks = [
  {
    request: {
      query: AffiliationFundersDocument,
      variables: {
        name: "nih",
        funderOnly: true,
        paginationOptions: {
          type: "CURSOR",
          limit: 5,
        },
      },
    },

    result: {
      data: {
        affiliations: {
          items: Array.from({ length: 50 }, (_, i) => {
            const count = i + 1;
            return {
              id: count,
              uri: `https://funder${count}`,
              displayName: `Funder ${count}`,
              apiTarget: `api/target/${count}`
            };
          }),
          totalCount: 50,
          limit: 5,
          nextCursor: null,
          currentOffset: null,
          hasNextPage: false,
          hasPreviousPage: null,
          availableSortFields: []
        }
      }
    },
  },

  // Popular Funders
  {
    request: {
      query: PopularFundersDocument,
    },

    result: {
      data: {
        popularFunders: Array.from({ length: 5 }, (_, i) => {
          const count = i + 1;
          return {
            id: count,
            uri: `https://funder${count}`,
            displayName: `Popular Funder ${count}`,
            nbrPlans: 10,
            apiTarget: `api/target/${count}`
          };
        }),
      }
    },
  },

  // Empty results
  {
    request: {
      query: AffiliationFundersDocument,
      variables: {
        name: "empty",
        funderOnly: true,
        paginationOptions: {
          type: "CURSOR",
          limit: 5,
        },
      },
    },

    result: {
      data: {
        affiliations: {
          items: [],
          totalCount: 0,
          limit: 0,
          nextCursor: null,
          currentOffset: null,
          hasNextPage: false,
          hasPreviousPage: null,
          availableSortFields: []
        }
      }
    },
  },

  // Paginated Mocks
  {
    request: {
      query: AffiliationFundersDocument,
      variables: {
        name: "paginated",
        funderOnly: true,
        paginationOptions: {
          type: "CURSOR",
          limit: 5,
        },
      },
    },

    result: {
      data: {
        affiliations: {
          items: Array.from({ length: 50 }, (_, i) => {
            const count = i + 1;
            return {
              id: count,
              uri: `https://funder${count}`,
              displayName: `Funder ${count}`,
              apiTarget: `api/target/${count}`
            };
          }),
          totalCount: 70,
          limit: 5,
          nextCursor: "page2",
          currentOffset: null,
          hasNextPage: true,
          hasPreviousPage: null,
          availableSortFields: []
        }
      }
    },
  },

  // Paginated second page
  {
    request: {
      query: AffiliationFundersDocument,
      variables: {
        name: "paginated",
        funderOnly: true,
        paginationOptions: {
          type: "CURSOR",
          cursor: "page2",
          limit: 5,
        },
      },
    },

    result: {
      data: {
        affiliations: {
          items: Array.from({ length: 20 }, (_, i) => {
            const count = i + 51;
            return {
              id: count,
              uri: `https://funder${count}`,
              displayName: `Funder ${count}`,
              apiTarget: `api/target/${count}`
            };
          }),
          totalCount: 70,
          limit: 5,
          nextCursor: null,
          currentOffset: null,
          hasNextPage: true,
          hasPreviousPage: null,
          availableSortFields: []
        }
      }
    },
  },

  // This is for when we select a funder
  {
    request: {
      query: AddProjectFundingDocument,
      variables: {
        input: {
          projectId: 123,
          affiliationId: "https://funder1",
        },
      },
    },

    result: {
      data: {
        addProjectFunding: {
          id: 18,
          errors: {
            affiliationId: null,
            funderOpportunityNumber: null,
            funderProjectNumber: null,
            general: null,
            grantId: null,
            projectId: null,
            status: null,
          },
        }
      }
    },
  },

  // Mocked error response for addProjectFunding
  {
    request: {
      query: AddProjectFundingDocument,
      variables: {
        input: {
          projectId: 123,
          // We will use funder3 for the error
          affiliationId: "https://funder3",
        },
      },
    },

    result: {
      data: {
        addProjectFunding: {
          id: 18,
          errors: {
            affiliationId: null,
            funderOpportunityNumber: null,
            funderProjectNumber: null,
            general: "This should throw an error",
            grantId: null,
            projectId: null,
            status: null,
          },
        }
      }
    },
  },

  // Mocked Server error for addProjectFunding
  {
    request: {
      query: AddProjectFundingDocument,
      variables: {
        input: {
          projectId: 123,
          // Use funder6 as the server error response
          affiliationId: "https://funder6",
        },
      },
    },
    error: new Error('Server Error')
  },
];

const emptyPopularMock = [
  {
    request: {
      query: PopularFundersDocument,
    },

    result: {
      data: {
        popularFunders: [],
      }
    },
  },
];

const popularErrorMock = [
  {
    request: {
      query: PopularFundersDocument,
    },
    error: new Error('Popular funders request failed'),
  },
];


// Needed for the errormessages component
jest.mock('@/utils/general', () => ({
  scrollToTop: jest.fn(),
}));

jest.mock('@/components/PageHeader', () => ({
  __esModule: true,
  default: () => <div data-testid="mock-page-header" />
}));

// Mock Toast
const mockToast = {
  add: jest.fn(),
};
describe("ProjectsProjectFundingSearch", () => {

  beforeEach(() => {
    const mockParams = useParams as jest.Mock;
    mockParams.mockReturnValue({ projectId: '123' });
    window.scrollTo = jest.fn();

    (useToast as jest.Mock).mockReturnValue(mockToast);
  });

  it("should render the view", async () => {
    render(
      <MockedProvider mocks={mocks}>
        <CreateProjectSearchFunder />
      </MockedProvider>
    );

    // NOTE: Search-field is the testid provided by the fundersearch component
    expect(screen.getByTestId('search-field')).toBeInTheDocument();
  });

  it("should show a short-list of Popular Funders", async () => {
    render(
      <MockedProvider mocks={mocks}>
        <CreateProjectSearchFunder />
      </MockedProvider>
    );

    await waitFor(() => {
      expect(screen.getByText('popularTitle')).toBeInTheDocument();
      expect(screen.getByText('popularDescription')).toBeInTheDocument();
      expect(screen.getByText('Popular Funder 1')).toBeInTheDocument();
    });
  });

  it("should show a loading state while Popular Funders are fetched", async () => {
    render(
      <MockedProvider mocks={mocks}>
        <CreateProjectSearchFunder />
      </MockedProvider>
    );

    expect(screen.getByText('popularTitle')).toBeInTheDocument();
    expect(screen.getByTestId('loading-component')).toBeInTheDocument();

    await waitFor(() => {
      expect(screen.queryByTestId('loading-component')).not.toBeInTheDocument();
    });
  });

  it("should neatly handle empty popular funder results", async () => {
    render(
      <MockedProvider mocks={emptyPopularMock}>
        <CreateProjectSearchFunder />
      </MockedProvider>
    );

    await waitFor(() => {
      expect(screen.getByText('popularTitle')).toBeInTheDocument();
      expect(screen.getByText('popularFallbackTitle')).toBeInTheDocument();
      expect(screen.getByText('popularFallbackDescription')).toBeInTheDocument();
    });
  });

  it("should show search guidance when Popular Funders fail to load", async () => {
    render(
      <MockedProvider mocks={popularErrorMock}>
        <CreateProjectSearchFunder />
      </MockedProvider>
    );

    await waitFor(() => {
      expect(screen.getByText('popularFallbackTitle')).toBeInTheDocument();
      expect(screen.getByText('popularFallbackDescription')).toBeInTheDocument();
    });
  });

  it("should render the search results", async () => {
    render(
      <MockedProvider mocks={mocks}>
        <CreateProjectSearchFunder />
      </MockedProvider>
    );

    // NOTE: search-field and search-input are testID's provided by elements
    // inside the FunderSearch component.
    const searchInput = screen.getByTestId('search-field').querySelector('input')!;
    fireEvent.change(searchInput, { target: { value: "nih" } });

    const searchBtn = screen.getByTestId('search-btn');
    fireEvent.click(searchBtn);

    await waitFor(() => {
      const resultSet = [
        ["Funder 1", "https://funder1"],
        ["Funder 30", "https://funder30"],
      ]
      resultSet.forEach((funder) => {
        const funderTitle = screen.getByText(funder[0]);
        const funderContainer = funderTitle.closest('div')!;
        const funderContent = within(funderContainer);
        const selectBtn = funderContent.getByRole('button', {
          name: /select/i,
        });

        expect(funderTitle).toBeInTheDocument();
        expect(selectBtn).toHaveAttribute('data-funder-uri', funder[1]);
        // Expect Popular Funders to no longer be displayed after user does search
        expect(screen.queryByText('Popular Funder 1')).not.toBeInTheDocument();
      });
    });
  });

  it("should cleanly handle empty results", async () => {
    render(
      <MockedProvider mocks={mocks}>
        <CreateProjectSearchFunder />
      </MockedProvider>
    );

    // NOTE: search-field and search-input are testID's provided by elements
    // inside the FunderSearch component.
    const searchInput = screen.getByTestId('search-field').querySelector('input')!;
    fireEvent.change(searchInput, { target: { value: "empty" } });

    const searchBtn = screen.getByTestId('search-btn');
    fireEvent.click(searchBtn);

    await waitFor(() => {
      expect(screen.getByText("noResults")).toBeInTheDocument();
      expect(screen.getByText("noResultsDescription")).toBeInTheDocument();
    });
  });

  it("should display \'Load More\' button when there are more results", async () => {
    render(
      <MockedProvider mocks={mocks}>
        <CreateProjectSearchFunder />
      </MockedProvider>
    );

    // NOTE: search-field and search-input are testID's provided by elements
    // inside the FunderSearch component.
    const searchInput = screen.getByTestId('search-field').querySelector('input')!;
    fireEvent.change(searchInput, { target: { value: "paginated" } });

    const searchBtn = screen.getByTestId('search-btn');
    fireEvent.click(searchBtn);

    await waitFor(() => {
      const funderTitle = screen.getByText("Funder 50");
      const funderContainer = funderTitle.closest('div')!;
      const funderContent = within(funderContainer);
      const selectBtn = funderContent.getByRole('button', {
        name: /select/i,
      });

      expect(funderTitle).toBeInTheDocument();
      expect(selectBtn).toHaveAttribute('data-funder-uri', "https://funder50");
    });

    expect(screen.getByTestId('load-more-btn')).toBeInTheDocument();
  });

  it("should load more when clicking the button", async () => {
    render(
      <MockedProvider mocks={mocks}>
        <CreateProjectSearchFunder />
      </MockedProvider>
    );

    // NOTE: search-field and search-input are testID's provided by elements
    // inside the FunderSearch component.
    const searchInput = screen.getByTestId('search-field').querySelector('input')!;
    fireEvent.change(searchInput, { target: { value: "paginated" } });

    const searchBtn = screen.getByTestId('search-btn');
    fireEvent.click(searchBtn);

    await waitFor(() => {
      const funderTitle = screen.getByText("Funder 50");
      const funderContainer = funderTitle.closest('div')!;
      const funderContent = within(funderContainer);
      const selectBtn = funderContent.getByRole('button', {
        name: /select/i,
      });

      expect(funderTitle).toBeInTheDocument();
      expect(selectBtn).toHaveAttribute('data-funder-uri', "https://funder50");
    });

    const loadMoreBtn = screen.getByTestId('load-more-btn');
    expect(loadMoreBtn).toBeInTheDocument();
    fireEvent.click(loadMoreBtn);

    await waitFor(() => {
      expect(screen.getByText("Funder 70")).toBeInTheDocument();
    });
  });

  it("should run the addFunder mutation and redirect when selecting a funder", async () => {
    const mockPush = jest.fn();
    (useRouter as jest.Mock).mockReturnValue({ push: mockPush });

    render(
      <MockedProvider mocks={mocks}>
        <CreateProjectSearchFunder />
      </MockedProvider>
    );

    // NOTE: search-field and search-input are testID's provided by elements
    // inside the FunderSearch component.
    const searchInput = screen.getByTestId('search-field').querySelector('input')!;
    fireEvent.change(searchInput, { target: { value: "nih" } });

    const searchBtn = screen.getByTestId('search-btn');
    fireEvent.click(searchBtn);

    await waitFor(() => {
      expect(screen.getByText("Funder 1")).toBeInTheDocument();
    });

    const firstFunder = screen.getByText("Funder 1").closest('div')!;
    const funderContent = within(firstFunder);
    const selectBtn = funderContent.getByRole('button', {
      name: /select/i,
    });
    expect(selectBtn).toHaveAttribute('data-funder-uri', 'https://funder1');
    fireEvent.click(selectBtn);

    await waitFor(() => {
      expect(mockPush).toHaveBeenCalledWith(expect.stringMatching(/\/projects\/123/));
    });
  });

  it("should also run add funder mutation when adding popular funder", async () => {
    const mockPush = jest.fn();
    (useRouter as jest.Mock).mockReturnValue({ push: mockPush });

    render(
      <MockedProvider mocks={mocks}>
        <CreateProjectSearchFunder />
      </MockedProvider>
    );

    await waitFor(() => {
      expect(screen.getByText("Popular Funder 1")).toBeInTheDocument();
    });

    const popFunder = screen.getByText("Popular Funder 1").closest('div')!;
    const funderContent = within(popFunder);
    const selectBtn = funderContent.getByRole('button', {
      name: /select/i,
    });
    expect(selectBtn).toHaveAttribute('data-funder-uri', 'https://funder1');
    fireEvent.click(selectBtn);

    await waitFor(() => {
      expect(mockPush).toHaveBeenCalledWith('/en-US/projects/123/fundings/18/edit');
      expect(mockToast.add).toHaveBeenCalledWith('messages.success.addProjectFunding', { type: 'success', timeout: 3000 });

    });
  });

  it("should call logECS with error if no projectFundingId is returned", async () => {
    const mockPush = jest.fn();
    (useRouter as jest.Mock).mockReturnValue({ push: mockPush });

    const mocksWithNullId = [
      {
        request: {
          query: AddProjectFundingDocument,
          variables: {
            input: {
              projectId: 123,
              affiliationId: "https://funder3", // or whichever funder you want to test
            },
          },
        },
        result: {
          data: {
            addProjectFunding: {
              id: null, // <-- This is the key change
              errors: {
                affiliationId: null,
                funderOpportunityNumber: null,
                funderProjectNumber: null,
                general: null,
                grantId: null,
                projectId: null,
                status: null,
              },
            }
          }
        },
      },
      ...mocks // Spread the rest of your mocks after the override
    ];

    render(
      <MockedProvider mocks={mocksWithNullId}>
        <CreateProjectSearchFunder />
      </MockedProvider>
    );

    // NOTE: search-field and search-input are testID's provided by elements
    // inside the FunderSearch component.
    const searchInput = screen.getByTestId('search-field')
      .querySelector('input')!;
    fireEvent.change(searchInput, { target: { value: "nih" } });

    const searchBtn = screen.getByTestId('search-btn');
    fireEvent.click(searchBtn);

    await waitFor(() => {
      expect(screen.getByText("Funder 3")).toBeInTheDocument();
    });

    const popFunder = screen.getByText("Funder 3").closest('div')!;
    const funderContent = within(popFunder);
    const selectBtn = funderContent.getByRole('button', {
      name: /select/i,
    });
    expect(selectBtn).toHaveAttribute('data-funder-uri', 'https://funder3');
    fireEvent.click(selectBtn);

    await waitFor(() => {
      expect(logECS).toHaveBeenCalledWith(
        'error',
        'ProjectsProjectFundingSearch.addProjectFunding',
        expect.objectContaining({
          error: expect.anything(),
        })
      );
    });
  });

  it("Should handle Errors", async () => {
    const mockPush = jest.fn();
    (useRouter as jest.Mock).mockReturnValue({ push: mockPush });

    render(
      <MockedProvider mocks={mocks}>
        <CreateProjectSearchFunder />
      </MockedProvider>
    );

    // NOTE: search-field and search-input are testID's provided by elements
    // inside the FunderSearch component.
    const searchInput = screen.getByTestId('search-field').querySelector('input')!;
    fireEvent.change(searchInput, { target: { value: "nih" } });

    const searchBtn = screen.getByTestId('search-btn');
    fireEvent.click(searchBtn);

    await waitFor(() => {
      expect(screen.getByText("Funder 3")).toBeInTheDocument();
    });

    const firstFunder = screen.getByText("Funder 3").closest('div')!;
    const funderContent = within(firstFunder);
    const selectBtn = funderContent.getByRole('button', {
      name: /select/i,
    });
    expect(selectBtn).toHaveAttribute('data-funder-uri', 'https://funder3');
    fireEvent.click(selectBtn);

    await waitFor(() => {
      expect(screen.getByText("This should throw an error")).toBeInTheDocument();
      expect(scrollToTop).toHaveBeenCalled();
    });
  });

  it("add project funder mutation should handle server error", async () => {
    render(
      <MockedProvider mocks={mocks}>
        <CreateProjectSearchFunder />
      </MockedProvider>
    );

    // NOTE: search-field and search-input are testID's provided by elements
    // inside the FunderSearch component.
    const searchInput = screen.getByTestId('search-field')
      .querySelector('input')!;
    fireEvent.change(searchInput, { target: { value: "nih" } });

    const searchBtn = screen.getByTestId('search-btn');
    fireEvent.click(searchBtn);

    // NOTE: In the mocks, Funder 6 is the one that will raise a server error
    // when adding it as project funder.
    await waitFor(() => {
      expect(screen.getByText("Funder 6")).toBeInTheDocument();
    });

    const errFunder = screen.getByText("Funder 6").closest('div')!;
    const funderContent = within(errFunder);
    const selectBtn = funderContent.getByRole('button', {
      name: /select/i,
    });
    expect(selectBtn).toHaveAttribute('data-funder-uri', 'https://funder6');
    fireEvent.click(selectBtn);

    await waitFor(() => {
      expect(screen.getByText("Server Error")).toBeInTheDocument();
      expect(scrollToTop).toHaveBeenCalled();
    });

    await waitFor(() => {
      expect(logECS).toHaveBeenCalledWith(
        'error',
        'ProjectsProjectFundingSearch.addProjectFunding',
        expect.objectContaining({
          error: expect.anything(),
        })
      );
    });
  });


  it("Should allow adding a funder manually", async () => {
    const mockPush = jest.fn();
    (useRouter as jest.Mock).mockReturnValue({ push: mockPush });

    render(
      <MockedProvider mocks={mocks}>
        <CreateProjectSearchFunder />
      </MockedProvider>
    );

    // NOTE: search-field and search-input are testID's provided by elements
    // inside the FunderSearch component.
    const searchInput = screen.getByTestId('search-field').querySelector('input')!;
    fireEvent.change(searchInput, { target: { value: "nih" } });

    const searchBtn = screen.getByTestId('search-btn');
    fireEvent.click(searchBtn);

    await waitFor(() => {
      const addBtn = screen.getByText('addManuallyLabel');
      expect(addBtn).toBeInTheDocument();
      fireEvent.click(addBtn);
    });

    await waitFor(() => {
      expect(mockPush).toHaveBeenCalledWith(expect.stringMatching(/\/projects\/123\/fundings\/add/));
    });
  });

  it('should pass accessibility tests', async () => {
    const { container } = render(
      <MockedProvider mocks={mocks}>
        <CreateProjectSearchFunder />
      </MockedProvider>
    );

    await waitFor(() => {
      expect(screen.getByText("popularTitle")).toBeInTheDocument();
    });

    const results = await axe(container);
    expect(results).toHaveNoViolations();
  });
});
