import React from 'react';

import {
  render,
  screen,
  fireEvent,
  waitFor,
} from '@testing-library/react';

import { useParams } from 'next/navigation';
import { useRouter } from '@/i18n/routing';
import { MockedProvider } from '@apollo/client/testing/react';
import {
  AffiliationFundersDocument,
  PopularFundersDocument,
  AddProjectFundingDocument,
  ProjectFundingsApiDocument,
} from '@/generated/graphql';

import { scrollToTop } from '@/utils/general';
import logECS from "@/utils/clientLogger";

import CreateProjectSearchFunder from '../page';
import { axe, toHaveNoViolations } from 'jest-axe';


expect.extend(toHaveNoViolations);

jest.mock('@/i18n/routing', () => ({
  Link: ({ href, children, ...props }: { href: string; children: React.ReactNode }) => (
    <a href={href} {...props}>{children}</a>
  ),
  useRouter: jest.fn(() => ({ push: jest.fn(), replace: jest.fn(), back: jest.fn() })),
}));

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

  // Existing fundings, checked before adding so Back doesn't create duplicates
  {
    request: {
      query: ProjectFundingsApiDocument,
      variables: { projectId: 123 },
    },
    maxUsageCount: Number.POSITIVE_INFINITY,
    result: {
      data: {
        project: {
          fundings: [{
            id: 77,
            status: 'PLANNED',
            affiliation: { apiTarget: null, uri: 'https://funder2', id: 2, displayName: 'Funder 2' },
          }],
        },
      },
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

  // Mocked response without an id for addProjectFunding
  {
    request: {
      query: AddProjectFundingDocument,
      variables: {
        input: {
          projectId: 123,
          affiliationId: "https://funder4",
        },
      },
    },

    result: {
      data: {
        addProjectFunding: {
          id: null,
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

const searchFor = (term: string) => {
  const searchInput = screen.getByTestId('search-field').querySelector('input')!;
  fireEvent.change(searchInput, { target: { value: term } });
  fireEvent.click(screen.getByTestId('search-btn'));
};

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

    await waitFor(() => {
      expect(screen.queryByTestId('loading-component')).not.toBeInTheDocument();
    });
  });

  it("Should show a short-list of Popular Funders", async () => {
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

  it("Should show a loading state while Popular Funders are fetched", async () => {
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

  it("Should neatly handle empty popular funder results", async () => {
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

  it("Should show search guidance when Popular Funders fail to load", async () => {
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

  it("Should render the search results as radio options", async () => {
    render(
      <MockedProvider mocks={mocks}>
        <CreateProjectSearchFunder />
      </MockedProvider>
    );

    searchFor("nih");

    await waitFor(() => {
      expect(screen.getByRole('radio', { name: 'Funder 1' })).toBeInTheDocument();
      expect(screen.getByRole('radio', { name: 'Funder 30' })).toBeInTheDocument();
    });
    expect(screen.getByText('found')).toBeInTheDocument();
    expect(screen.queryByText('popularTitle')).not.toBeInTheDocument();
  });

  it("Should cleanly handle empty results", async () => {
    render(
      <MockedProvider mocks={mocks}>
        <CreateProjectSearchFunder />
      </MockedProvider>
    );

    searchFor("empty");

    await waitFor(() => {
      expect(screen.getByText("noResults")).toBeInTheDocument();
      expect(screen.getByText("noResultsDescription")).toBeInTheDocument();
    });
  });

  it("Load More button visible when there are more results", async () => {
    render(
      <MockedProvider mocks={mocks}>
        <CreateProjectSearchFunder />
      </MockedProvider>
    );

    searchFor("paginated");

    await waitFor(() => {
      expect(screen.getByRole('radio', { name: 'Funder 50' })).toBeInTheDocument();
    });

    expect(screen.getByTestId('load-more-btn')).toBeInTheDocument();
  });

  it("Should load more when clicking the button", async () => {
    render(
      <MockedProvider mocks={mocks}>
        <CreateProjectSearchFunder />
      </MockedProvider>
    );

    searchFor("paginated");

    await waitFor(() => {
      expect(screen.getByRole('radio', { name: 'Funder 50' })).toBeInTheDocument();
    });

    fireEvent.click(screen.getByTestId('load-more-btn'));

    await waitFor(() => {
      expect(screen.getByRole('radio', { name: 'Funder 70' })).toBeInTheDocument();
    });
  });

  it("Should keep Next disabled until a funder or 'no funder' is chosen", async () => {
    render(
      <MockedProvider mocks={mocks}>
        <CreateProjectSearchFunder />
      </MockedProvider>
    );

    await waitFor(() => {
      expect(screen.getByRole('radio', { name: 'Popular Funder 1' })).toBeInTheDocument();
    });

    expect(screen.getByTestId('funder-next')).toBeDisabled();
    expect(screen.getByText('funder.selectToContinue')).toBeInTheDocument();

    fireEvent.click(screen.getByRole('radio', { name: 'Popular Funder 1' }));

    expect(screen.getByTestId('funder-next')).toBeEnabled();
    expect(screen.queryByText('funder.selectToContinue')).not.toBeInTheDocument();
  });

  it("Should clear the funder selection when 'I don't have a funder' is checked, and vice versa", async () => {
    render(
      <MockedProvider mocks={mocks}>
        <CreateProjectSearchFunder />
      </MockedProvider>
    );

    await waitFor(() => {
      expect(screen.getByRole('radio', { name: 'Popular Funder 1' })).toBeInTheDocument();
    });

    const radio = screen.getByRole('radio', { name: 'Popular Funder 1' });
    const noFunder = screen.getByRole('checkbox', { name: 'funder.noFunderLabel' });

    fireEvent.click(radio);
    expect(radio).toBeChecked();

    fireEvent.click(noFunder);
    expect(noFunder).toBeChecked();
    expect(radio).not.toBeChecked();

    fireEvent.click(radio);
    expect(radio).toBeChecked();
    expect(noFunder).not.toBeChecked();
  });

  it("Should run the addFunder mutation and redirect when selecting a funder", async () => {
    const mockPush = jest.fn();
    (useRouter as jest.Mock).mockReturnValue({ push: mockPush });

    render(
      <MockedProvider mocks={mocks}>
        <CreateProjectSearchFunder />
      </MockedProvider>
    );

    searchFor("nih");

    await waitFor(() => {
      expect(screen.getByRole('radio', { name: 'Funder 1' })).toBeInTheDocument();
      expect(screen.queryByText('popularTitle')).not.toBeInTheDocument();
    });

    fireEvent.click(screen.getByRole('radio', { name: 'Funder 1' }));
    fireEvent.click(screen.getByTestId('funder-next'));

    await waitFor(() => {
      expect(mockPush).toHaveBeenCalledWith('/projects/123/create/fundings/18/status?intent=plan&newFunding=true');
    });
  });

  it("Should reuse the existing funding instead of adding the same funder twice", async () => {
    const mockPush = jest.fn();
    (useRouter as jest.Mock).mockReturnValue({ push: mockPush });

    render(
      <MockedProvider mocks={mocks}>
        <CreateProjectSearchFunder />
      </MockedProvider>
    );

    await waitFor(() => {
      expect(screen.getByRole('radio', { name: 'Popular Funder 2' })).toBeInTheDocument();
    });

    fireEvent.click(screen.getByRole('radio', { name: 'Popular Funder 2' }));
    fireEvent.click(screen.getByTestId('funder-next'));

    await waitFor(() => {
      expect(mockPush).toHaveBeenCalledWith('/projects/123/create/fundings/77/status?intent=plan');
    });
    expect(mockPush).toHaveBeenCalledTimes(1);
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
      expect(screen.getByRole('radio', { name: 'Popular Funder 1' })).toBeInTheDocument();
    });

    fireEvent.click(screen.getByRole('radio', { name: 'Popular Funder 1' }));
    fireEvent.click(screen.getByTestId('funder-next'));

    await waitFor(() => {
      expect(mockPush).toHaveBeenCalledWith('/projects/123/create/fundings/18/status?intent=plan&newFunding=true');
    });
  });

  it("Should go to the funding status step even if the selected funder doesn't have an apiTarget", async () => {
    const mockPush = jest.fn();
    (useRouter as jest.Mock).mockReturnValue({ push: mockPush });

    render(
      <MockedProvider mocks={mocks}>
        <CreateProjectSearchFunder />
      </MockedProvider>
    );

    searchFor("no-api-funder");

    await waitFor(() => {
      expect(screen.getByRole('radio', { name: 'Funder Without Api' })).toBeInTheDocument();
    });

    fireEvent.click(screen.getByRole('radio', { name: 'Funder Without Api' }));
    fireEvent.click(screen.getByTestId('funder-next'));

    await waitFor(() => {
      expect(mockPush).toHaveBeenCalledWith('/projects/123/create/fundings/18/status?intent=plan&newFunding=true');
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

    searchFor("nih");

    await waitFor(() => {
      expect(screen.getByRole('radio', { name: 'Funder 3' })).toBeInTheDocument();
    });

    fireEvent.click(screen.getByRole('radio', { name: 'Funder 3' }));
    fireEvent.click(screen.getByTestId('funder-next'));

    await waitFor(() => {
      expect(screen.getByText("This should throw an error")).toBeInTheDocument();
      expect(scrollToTop).toHaveBeenCalled();
    });
    expect(mockPush).not.toHaveBeenCalled();
  });

  it("Should show an error and stay on the page when the new funding has no id", async () => {
    const mockPush = jest.fn();
    (useRouter as jest.Mock).mockReturnValue({ push: mockPush });

    render(
      <MockedProvider mocks={mocks}>
        <CreateProjectSearchFunder />
      </MockedProvider>
    );

    searchFor("nih");

    await waitFor(() => {
      expect(screen.getByRole('radio', { name: 'Funder 4' })).toBeInTheDocument();
    });

    fireEvent.click(screen.getByRole('radio', { name: 'Funder 4' }));
    fireEvent.click(screen.getByTestId('funder-next'));

    expect(await screen.findByText('funder.errors.addFailed')).toBeInTheDocument();
    expect(mockPush).not.toHaveBeenCalled();
  });

  it("add project funder mutation should handle server error", async () => {
    render(
      <MockedProvider mocks={mocks}>
        <CreateProjectSearchFunder />
      </MockedProvider>
    );

    searchFor("nih");

    // NOTE: In the mocks, Funder 6 is the one that will raise a server error
    // when adding it as project funder.
    await waitFor(() => {
      expect(screen.getByRole('radio', { name: 'Funder 6' })).toBeInTheDocument();
    });

    fireEvent.click(screen.getByRole('radio', { name: 'Funder 6' }));
    fireEvent.click(screen.getByTestId('funder-next'));

    await waitFor(() => {
      expect(screen.getByText('funder.errors.addFailed')).toBeInTheDocument();
      expect(scrollToTop).toHaveBeenCalled();
    });
    expect(screen.queryByText("Server Error")).not.toBeInTheDocument();

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

    searchFor("nih");

    const addBtn = await screen.findByText('addManuallyLabel');
    fireEvent.click(addBtn);

    await waitFor(() => {
      expect(mockPush).toHaveBeenCalledWith('/projects/123/fundings/add?intent=plan');
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

    fireEvent.click(screen.getByRole('checkbox', { name: 'funder.noFunderLabel' }));
    fireEvent.click(screen.getByTestId('funder-next'));

    await waitFor(() => {
      expect(mockPush).toHaveBeenCalledWith('/projects/123/project?intent=plan');
    });
  });

  it('should pass accessibility tests', async () => {
    const { container } = render(
      <MockedProvider mocks={mocks}>
        <CreateProjectSearchFunder />
      </MockedProvider>
    );

    await waitFor(() => {
      expect(screen.getByRole('radio', { name: 'Popular Funder 1' })).toBeInTheDocument();
    });

    const results = await axe(container);
    expect(results).toHaveNoViolations();
  });
});
