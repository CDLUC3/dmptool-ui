import React, { useState } from 'react';

import { render, screen, fireEvent, waitFor } from '@/utils/test-utils';
import { toHaveNoViolations } from 'jest-axe';
import { MockedProvider } from '@apollo/client/testing/react';
import { AffiliationFundersDocument } from '@/generated/graphql';
import {
  FunderSearchResults,
  FunderSearchItem,
} from '@/app/types';

import FunderSearch from '@/components/FunderSearch';


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
          limit: 2,
        },
      },
    },

    result: {
      data: {
        affiliations: {
          items: [
            {
              id: 1,
              uri: "https://fundera",
              displayName: "Funder A",
              apiTarget: null,
            },
            {
              id: 2,
              uri: "https://funderb",
              displayName: "Funder B",
              apiTarget: '/api/target/b',
            },
          ],
          totalCount: 4,
          limit: 2,
          nextCursor: "abc1",
          currentOffset: null,
          hasNextPage: true,
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
        name: "nih",
        funderOnly: true,
        paginationOptions: {
          type: "CURSOR",
          cursor: "abc1",
          limit: 2,
        },
      },
    },

    result: {
      data: {
        affiliations: {
          items: [
            {
              id: 3,
              uri: "https://funderc",
              displayName: "Funder C",
              apiTarget: '/api/target/c',
            },
            {
              id: 4,
              uri: "https://funderd",
              displayName: "Funder D",
              apiTarget: '/api/target/d',
            },
          ],
          totalCount: 4,
          limit: 2,
          nextCursor: null,
          currentOffset: null,
          hasNextPage: false,
          hasPreviousPage: true,
          availableSortFields: []
        }
      }
    },
  },
];

const delayedSearchMock = [
  {
    ...mocks[0],
    delay: 500,
  },
];

describe("FunderSearch", () => {
  beforeEach(() => {
    window.scrollTo = jest.fn();
  });

  /**
    * A wrapper to simulate how the component is used, so that we can simulate
    * some the events and state changes.
    */
  function WrappedSearch() {
    const [moreCounter, setMoreCounter] = useState(0);
    const [funders, setFunders] = useState<FunderSearchItem[]>([]);

    function handleResults(resp: FunderSearchResults) {
      if (resp && resp.items) {
        setFunders(resp.items.filter(Boolean) as FunderSearchItem[]);
      }
    }

    return (
      <>
        <FunderSearch
          limit={2}
          onResults={handleResults}
          moreTrigger={moreCounter}
        />

        {funders.length > 0 && (
          <>
            <ul data-testid="results-list">
              {funders.map((funder, index) => (
                <li key={index}>
                  <span>{funder.displayName}</span>
                  <span>{funder.uri}</span>
                </li>
              ))}
            </ul>

            <button
              data-testid="loadmore"
              onClick={() => setMoreCounter(moreCounter + 1)}
              aria-label="Load more funders"
            >
              Load More
            </button>
          </>
        )}
      </>
    )
  }

  it("should render the component", async () => {
    render(
      <MockedProvider mocks={mocks}>
        <FunderSearch moreTrigger={0} onResults={() => { }} />
      </MockedProvider>
    );

    const searchField = screen.getByTestId('search-field');
    expect(searchField).toBeInTheDocument();
  });

  it("should cleanly handle an empty search term", async () => {
    render(
      <MockedProvider mocks={mocks}>
        <WrappedSearch />
      </MockedProvider>
    );

    // We must set the search term before we can search
    const searchInput = screen.getByTestId('search-field')
      .querySelector('input')!;
    fireEvent.change(searchInput, { target: { value: " " } });

    const searchBtn = screen.getByTestId('search-btn');
    fireEvent.click(searchBtn);

    await waitFor(() => {
      expect(screen.queryByTestId("results-list")).not.toBeInTheDocument();
    });
    // CHeck that the affilation fetch was NOT called
  });

  it("should perform search on submit", async () => {
    render(
      <MockedProvider mocks={mocks}>
        <WrappedSearch />
      </MockedProvider>
    );

    // We must set the search term before we can search
    const searchInput = screen.getByTestId('search-field')
      .querySelector('input')!;
    fireEvent.change(searchInput, { target: { value: "nih" } });

    const searchBtn = screen.getByTestId('search-btn');
    fireEvent.click(searchBtn);

    await waitFor(() => {
      const resultSet = [
        ["Funder A", "https://fundera"],
        ["Funder B", "https://funderb"],
      ]
      for (const [name, uri] of resultSet) {
        expect(screen.getByText(name)).toBeInTheDocument();
        expect(screen.getByText(uri)).toBeInTheDocument();
      }
    });
  });

  it("should disable the search button while searching", async () => {
    render(
      <MockedProvider mocks={delayedSearchMock}>
        <WrappedSearch />
      </MockedProvider>
    );

    const searchInput = screen.getByTestId('search-field')
      .querySelector('input')!;
    fireEvent.change(searchInput, { target: { value: "nih" } });

    const searchBtn = screen.getByTestId('search-btn');
    fireEvent.click(searchBtn);

    expect(searchBtn).toHaveTextContent('buttons.search');
    expect(searchBtn).toHaveAccessibleName('buttons.search');
    expect(searchBtn).toBeDisabled();

    await waitFor(() => {
      expect(searchBtn).not.toBeDisabled();
    });
  });

  it("should load more when the moretrigger is activated", async () => {
    render(
      <MockedProvider mocks={mocks}>
        <WrappedSearch />
      </MockedProvider>
    );

    // We must set the search term before we can search
    const searchInput = screen.getByTestId('search-field')
      .querySelector('input')!;
    fireEvent.change(searchInput, { target: { value: "nih" } });

    const searchBtn = screen.getByTestId('search-btn');
    fireEvent.click(searchBtn);

    await waitFor(() => {
      const resultSet = [
        ["Funder A", "https://fundera"],
        ["Funder B", "https://funderb"],
      ]
      for (const [name, uri] of resultSet) {
        expect(screen.getByText(name)).toBeInTheDocument();
        expect(screen.getByText(uri)).toBeInTheDocument();
      }
    });

    const loadMoreBtn = screen.getByTestId('loadmore');
    fireEvent.click(loadMoreBtn);

    await waitFor(() => {
      const resultSet = [
        ["Funder C", "https://funderc"],
        ["Funder D", "https://funderd"],
      ]
      for (const [name, uri] of resultSet) {
        expect(screen.getByText(name)).toBeInTheDocument();
        expect(screen.getByText(uri)).toBeInTheDocument();
      }
    });
  });
});
