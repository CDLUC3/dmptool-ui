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
              apiTarget: `api/target/${count}`,
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

  {
    request: {
      query: AffiliationFundersDocument,
      variables: {
        name: "no-api-funder",
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
          items: [{
            id: 1,
            uri: "https://funder-no-api",
            displayName: "Funder Without Api",
            apiTarget: null,
          }],
          totalCount: 1,
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
            apiTarget: `api/target/${count}`,
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
              apiTarget: `api/target/${count}`,
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
              apiTarget: `api/target/${count}`,
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

  // Mock the add response for funder without api Target
  {
    request: {
      query: AddProjectFundingDocument,
      variables: {
        input: {
          projectId: 123,
          affiliationId: "https://funder-no-api",
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


// Needed for the errormessages component
jest.mock('@/utils/general', () => ({
  scrollToTop: jest.fn(),
}));


jest.mock('@/components/PageHeader', () => ({
  __esModule: true,
  default: () => <div data-testid="mock-page-header" />
}));

describe("CreateProjectSearchFunder", () => {

  beforeEach(() => {
    const mockParams = useParams as jest.Mock;
    mockParams.mockReturnValue({ projectId: '123' });
    window.scrollTo = jest.fn();
  });

  it("Should render the view", async () => {
    render(
      <MockedProvider mocks={mocks}>
        <CreateProjectSearchFunder />
      </MockedProvider>
    );

    // NOTE: Search-field is the testid provided by the fundersearch component
    expect(screen.getByTestId('search-field')).toBeInTheDocument();
  });

  it("Should show a short-list of Popular Funders", async () => {
    render(
      <MockedProvider mocks={mocks}>
        <CreateProjectSearchFunder />
      </MockedProvider>
    );

    await waitFor(() => {
      expect(screen.getByText('popularTitle')).toBeInTheDocument();
      expect(screen.getByText('Popular Funder 1')).toBeInTheDocument();
    });
  });

  it("Should neatly handle empty popular funder results", async () => {
    render(
      <MockedProvider mocks={emptyPopularMock}>
        <CreateProjectSearchFunder />
      </MockedProvider>
    );

    await waitFor(() => {
      expect(screen.queryByText('popularTitle')).not.toBeInTheDocument();
    });
  });

  it("Should render the search results", async () => {
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
      });
    });
  });

  it("Should cleanly handle empty results", async () => {
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
    });
  });

  it("Load More button visible when there are more results", async () => {
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

  it("Should load more when clicking the button", async () => {
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

  it("Should run the addFunder mutation and redirect when selecting a funder", async () => {
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
      expect(screen.queryByText("popularTitle")).not.toBeInTheDocument();
    });

    const firstFunder = screen.getByText("Funder 1").closest('div')!;
    const funderContent = within(firstFunder);
    const selectBtn = funderContent.getByRole('button', {
      name: /select/i,
    });
    expect(selectBtn).toHaveAttribute('data-funder-uri', 'https://funder1');
    fireEvent.click(selectBtn);

    await waitFor(() => {
      expect(mockPush).toHaveBeenCalledWith(expect.stringMatching(/\/projects\/123\/project-funding/));
    });
  });

  it("Should also run add funder mutation when adding popular funder", async () => {
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
      expect(mockPush).toHaveBeenCalledWith(expect.stringMatching(/\/projects\/123/));
    });
  });

  it("Should redirect to project info edit page if selected funder doesn't an apiTarget", async () => {
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
    fireEvent.change(searchInput, { target: { value: "no-api-funder" } });

    const searchBtn = screen.getByTestId('search-btn');
    fireEvent.click(searchBtn);

    await waitFor(() => {
      expect(screen.getByText("Funder Without Api")).toBeInTheDocument();
    });

    const firstFunder = screen.getByText("Funder Without Api").closest('div')!;
    const funderContent = within(firstFunder);
    const selectBtn = funderContent.getByRole('button', {
      name: /select/i,
    });
    expect(selectBtn).toHaveAttribute('data-funder-uri', 'https://funder-no-api');
    fireEvent.click(selectBtn);

    await waitFor(() => {
      expect(mockPush).toHaveBeenCalledWith(expect.stringMatching(/\/projects\/123\/project/));
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
        'createProjectSearchFunder.handleSelectFunder',
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


  it("should allow proceeding without a funder", async () => {
    const mockPush = jest.fn();
    (useRouter as jest.Mock).mockReturnValue({ push: mockPush });

    render(
      <MockedProvider mocks={mocks}>
        <CreateProjectSearchFunder />
      </MockedProvider>
    );

    const noFunderBtn = screen.getByText('noFunderButtonLabel');
    expect(noFunderBtn).toBeInTheDocument();
    fireEvent.click(noFunderBtn);

    await waitFor(() => {
      expect(mockPush).toHaveBeenCalledWith(expect.stringMatching(/\/projects\/123\/project/));
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
