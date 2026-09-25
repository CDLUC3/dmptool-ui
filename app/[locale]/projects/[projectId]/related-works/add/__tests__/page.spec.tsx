import React from "react";
import { useRouter } from "@/i18n/routing";
import { render, screen } from "@testing-library/react";
import "@testing-library/jest-dom";
import { axe, toHaveNoViolations } from "jest-axe";
import AddRelatedWorkProjectPage from "../page";
import { FindWorkByIdentifierDocument, ProjectDocument, RelatedWorkSearchResult } from "@/generated/graphql";
import { useLazyQuery, useQuery } from "@apollo/client/react";

expect.extend(toHaveNoViolations);

jest.mock("next/navigation", () => ({
  useParams: jest.fn(() => ({
    projectId: "1",
    dmpid: "1",
  })),
}));

jest.mock('@/i18n/routing', () => ({
  Link: ({ href, children, ...props }: { href: string; children: React.ReactNode }) => (
    <a href={href} {...props}>{children}</a>
  ),
  useRouter: jest.fn(() => ({ push: jest.fn(), replace: jest.fn(), back: jest.fn() })),
  usePathname: jest.fn(() => '/projects/1/related-works/add'),
}));

jest.mock("@apollo/client/react", () => ({
  useQuery: jest.fn(),
  useLazyQuery: jest.fn(),
}));

jest.mock("@/app/actions/upsertRelatedWorkAction", () => ({
  upsertRelatedWorkAction: jest.fn(),
}));

const mockUseRouter = useRouter as jest.Mock;

const mockUseLazyQuery = jest.mocked(useLazyQuery);
const mockUseQuery = jest.mocked(useQuery);

/*eslint-disable @typescript-eslint/no-explicit-any */
export const setupMocks = (items: RelatedWorkSearchResult[], project: null | any, refetch = jest.fn()) => {
  mockUseLazyQuery.mockImplementation((document) => {
    if (document === FindWorkByIdentifierDocument) {
      return [
        jest.fn().mockResolvedValue({
          data: {
            findWorkByIdentifier: { items },
          },
        }),
        {
          data: { findWorkByIdentifier: { items } },
          loading: false,
          error: undefined,
          refetch,
        },
      ] as any;
    }

    return {
      data: null,
      loading: false,
      error: undefined,
    };
  });

  mockUseQuery.mockImplementation((document) => {
    if (document === ProjectDocument) {
      return {
        data: {
          project,
        },
        loading: false,
        error: undefined,
        refetch,
        /* eslint-disable @typescript-eslint/no-explicit-any */
      } as any;
    }

    if (document === FindWorkByIdentifierDocument) {
      return {
        data: {
          findWorkByIdentifier: {
            items,
          },
        },
        loading: false,
        error: undefined,
        refetch,
        /* eslint-disable @typescript-eslint/no-explicit-any */
      } as any;
    }

    return {
      data: null,
      loading: false,
      error: undefined,
    };
  });
};

describe("AddRelatedWorkPage", () => {
  beforeEach(() => {
    window.scrollTo = jest.fn(); // Called by the wrapping PageHeader
    mockUseRouter.mockReturnValue({
      push: jest.fn(),
    });
  });

  afterEach(() => {
    jest.clearAllMocks();
  });

  it("should render the page header with title and description", () => {
    setupMocks([], null);
    render(<AddRelatedWorkProjectPage />);
    expect(screen.getByRole("heading", { name: /title/i })).toBeInTheDocument();
    expect(screen.getByText("description")).toBeInTheDocument();
  });

  it("should render the breadcrumb links", () => {
    setupMocks([], null);
    render(<AddRelatedWorkProjectPage />);
    expect(screen.getByText("breadcrumbs.home")).toBeInTheDocument();
    expect(screen.getByText("breadcrumbs.projects")).toBeInTheDocument();
    expect(screen.getByText("breadcrumbs.projectOverview")).toBeInTheDocument();
    expect(screen.getByText("breadcrumbs.relatedWorks")).toBeInTheDocument();
  });

  it("should pass accessibility tests", async () => {
    setupMocks([], { plans: [{ id: 1, title: "Plan 1", registered: 1234 }] });
    const { container } = render(<AddRelatedWorkProjectPage />);
    const results = await axe(container);
    expect(results).toHaveNoViolations();
  });
});
