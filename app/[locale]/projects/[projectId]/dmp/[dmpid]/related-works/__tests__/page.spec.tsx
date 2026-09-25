import React from "react";
import { render, screen } from "@testing-library/react";
import "@testing-library/jest-dom";
import { useParams } from "next/navigation";
import { useRouter } from "@/i18n/routing";
import { axe, toHaveNoViolations } from "jest-axe";
import RelatedWorksPlanPage from "../page";
import userEvent from "@testing-library/user-event";
import { NextIntlClientProvider } from "next-intl";
import { useQuery } from '@apollo/client/react';
import { RelatedWorksDocument } from "@/generated/graphql";
import {
  MOCK_ACCEPTED_WORKS,
  MOCK_PENDING_WORKS,
  MOCK_REJECTED_WORKS
} from "@/app/[locale]/projects/[projectId]/dmp/[dmpid]/related-works/mockWorks";

expect.extend(toHaveNoViolations);

jest.mock("next/navigation", () => ({
  useParams: jest.fn(),
}));

jest.mock('@/i18n/routing', () => ({
  Link: ({ href, children, ...props }: { href: string; children: React.ReactNode }) => (
    <a href={href} {...props}>{children}</a>
  ),
  useRouter: jest.fn(() => ({ push: jest.fn(), replace: jest.fn(), back: jest.fn() })),
  usePathname: jest.fn(() => '/projects/1/dmp/1/related-works'),
}));

// Mock Apollo Client hooks
jest.mock('@apollo/client/react', () => ({
  useQuery: jest.fn(),
}));


const mockUseRouter = useRouter as jest.Mock;
const mockUseParams = useParams as jest.Mock;


// Cast with jest.mocked utility
const mockUseQuery = jest.mocked(useQuery);

const setupMocks = () => {
  mockUseQuery.mockImplementation((document) => {
    if (document === RelatedWorksDocument) {
      return {
        data: {
          relatedWorks: {
            items: MOCK_PENDING_WORKS,
          },
        },
        loading: false,
        error: undefined,
        refetch: jest.fn()
        /* eslint-disable @typescript-eslint/no-explicit-any */
      } as any;
    }

    return {
      data: null,
      loading: false,
      error: undefined
    };
  });
};

function RelatedWorksHarness() {
  mockUseParams.mockReturnValue({ dmpid: "1" });

  return (
    <NextIntlClientProvider
      locale={"en"}
      timeZone={"UTC"}
      messages={{}}
    >
      <RelatedWorksPlanPage />
    </NextIntlClientProvider>
  );
}

describe("RelatedWorksPlanPage", () => {
  beforeEach(() => {
    setupMocks();
    window.scrollTo = jest.fn(); // Called by the wrapping PageHeader
    mockUseRouter.mockReturnValue({
      push: jest.fn(),
    });
  });

  afterEach(() => {
    jest.clearAllMocks();
  });

  it("should render the page header with correct title and description", () => {
    render(<RelatedWorksHarness />);
    expect(screen.getByRole("heading", { level: 1, name: 'title' })).toBeInTheDocument();
    expect(screen.getByText("description")).toBeInTheDocument();
  });

  it("should render the breadcrumb links", () => {
    render(<RelatedWorksHarness />);
    expect(screen.getByText("breadcrumbs.home")).toBeInTheDocument();
    expect(screen.getByText("breadcrumbs.projects")).toBeInTheDocument();
    expect(screen.getByText("breadcrumbs.projectOverview")).toBeInTheDocument();
    expect(screen.getByText("breadcrumbs.planOverview")).toBeInTheDocument();
  });

  it("should render tabs", () => {
    render(<RelatedWorksHarness />);

    expect(screen.getByRole("tab", { name: "tabs.pending" })).toBeInTheDocument();
    expect(screen.getByRole("tab", { name: "tabs.accepted" })).toBeInTheDocument();
    expect(screen.getByRole("tab", { name: "tabs.rejected" })).toBeInTheDocument();
  });

  it("should render pending research outputs", () => {
    render(<RelatedWorksHarness />);
    expect(screen.getByText("Synthetic Empathy: Emotional Intelligence in Autonomous Agents")).toBeInTheDocument();
    expect(screen.getByText("NeuroSynthetics: Toward Biologically-Inspired Cognitive Robotics")).toBeInTheDocument();
  });

  it("should render related research outputs", async () => {
    mockUseQuery.mockImplementation((document) => {
      if (document === RelatedWorksDocument) {
        return {
          data: {
            relatedWorks: {
              items: MOCK_ACCEPTED_WORKS,
            },
          },
          loading: false,
          error: undefined,
          refetch: jest.fn()
          /* eslint-disable @typescript-eslint/no-explicit-any */
        } as any;
      }

      return {
        data: null,
        loading: false,
        error: undefined
      };
    });

    render(<RelatedWorksHarness />);

    // Click related tab
    await userEvent.click(screen.getByRole("tab", { name: "tabs.accepted" }));

    expect(screen.getByText("Real-Time Sim2Real Transfer for Bipedal Robot Gait Adaptation")).toBeInTheDocument();
    expect(screen.getByText("Multisensory Feedback Loops for Dexterous Robotic Manipulation")).toBeInTheDocument();
  });

  it("should render discarded research outputs", async () => {
    mockUseQuery.mockImplementation((document) => {
      if (document === RelatedWorksDocument) {
        return {
          data: {
            relatedWorks: {
              items: MOCK_REJECTED_WORKS,
            },
          },
          loading: false,
          error: undefined,
          refetch: jest.fn()
          /* eslint-disable @typescript-eslint/no-explicit-any */
        } as any;
      }

      return {
        data: null,
        loading: false,
        error: undefined
      };
    });

    render(<RelatedWorksHarness />);

    // Click discarded tab
    await userEvent.click(screen.getByRole("tab", { name: "tabs.rejected" }));

    expect(
      screen.getByText("Stellar Cartography and the Dynamic Mapping of Interstellar Gas Clouds"),
    ).toBeInTheDocument();
  });

  it("should render the add related work button", () => {
    mockUseQuery.mockImplementation((document) => {
      if (document === RelatedWorksDocument) {
        return {
          data: {
            relatedWorks: {
              items: MOCK_PENDING_WORKS,
            },
          },
          loading: false,
          error: undefined,
          refetch: jest.fn()
          /* eslint-disable @typescript-eslint/no-explicit-any */
        } as any;
      }

      return {
        data: null,
        loading: false,
        error: undefined
      };
    });

    render(<RelatedWorksHarness />);
    const addButton = screen.getByRole("link", { name: "buttons.addRelatedWorkManually" });
    expect(addButton).toBeInTheDocument();
  });

  it("should pass accessibility tests", async () => {
    mockUseQuery.mockImplementation((document) => {
      if (document === RelatedWorksDocument) {
        return {
          data: {
            relatedWorks: {
              items: MOCK_PENDING_WORKS,
            },
          },
          loading: false,
          error: undefined,
          refetch: jest.fn()
          /* eslint-disable @typescript-eslint/no-explicit-any */
        } as any;
      }

      return {
        data: null,
        loading: false,
        error: undefined
      };
    });
    const { container } = render(<RelatedWorksHarness />);
    const results = await axe(container);
    expect(results).toHaveNoViolations();
  });
});
