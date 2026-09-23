import React from "react";
import { render, screen, waitFor } from "@testing-library/react";
import "@testing-library/jest-dom";
import { MockedProvider } from "@apollo/client/testing/react";
import { useFormatter, useTranslations } from "next-intl";
import {
  MeDocument,
  TagsDocument,
  GuidanceGroupsDocument
} from "@/generated/graphql";

import { axe, toHaveNoViolations } from "jest-axe";
import mockMeData from "../__mocks__/mockMeData.json";
import mockTagsData from "../__mocks__/mockTagsData.json";
import mockGuidanceGroupsData from "../__mocks__/mockGuidanceGroupsData.json";
import GuidancePage from "../page";

// Mock next-intl hooks
jest.mock("next-intl", () => ({
  useFormatter: jest.fn(),
  useTranslations: jest.fn(),
}));

// Mock Next.js navigation

jest.mock('@/i18n/routing', () => ({
  Link: ({ href, children, ...props }: { href: string; children: React.ReactNode }) => (
    <a href={href} {...props}>{children}</a>
  ),
  useRouter: jest.fn(() => ({
    back: jest.fn(),
    push: jest.fn(),
    replace: jest.fn(),
    refresh: jest.fn(),
  })),
  usePathname: jest.fn(() => '/admin/guidance'),
}));

expect.extend(toHaveNoViolations);

const mocks = [
  {
    request: {
      query: MeDocument,
    },
    result: {
      data: mockMeData,
    },
  },
  {
    request: {
      query: TagsDocument,
    },
    result: {
      data: mockTagsData,
    },
  },
  {
    request: {
      query: GuidanceGroupsDocument,
      variables: {
        affiliationId: "https://ror.org/03yrm5c12",
      }
    },
    result: {
      data: mockGuidanceGroupsData,
    },
  },
]
describe("GuidancePage", () => {
  beforeEach(() => {
    window.scrollTo = jest.fn();
    (useFormatter as jest.Mock).mockReturnValue({
      dateTime: jest.fn((date) => date.toLocaleDateString()),
    });

    (useTranslations as jest.Mock).mockImplementation((namespace) => {
      return (key: string) => `${namespace}.${key}`;
    });
  });

  it("should render the create group button", async () => {
    render(
      <MockedProvider mocks={mocks}>
        <GuidancePage />
      </MockedProvider>,
    );

    await waitFor(() => {
      expect(screen.getByText("Guidance.pages.index.createGroup")).toBeInTheDocument();
    });
  });

  it("should initially render loading message", () => {
    render(
      <MockedProvider mocks={mocks}>
        <GuidancePage />
      </MockedProvider>,
    );

    expect(screen.getByText("Loading...")).toBeInTheDocument();
  });

  it("should render guidance groups list", async () => {
    render(
      <MockedProvider mocks={mocks}>
        <GuidancePage />
      </MockedProvider>,
    );

    await waitFor(() => {
      const listContainer = screen.getByLabelText("Guidance groups list");
      expect(listContainer).toBeInTheDocument();
      expect(listContainer.tagName).toBe('UL');

    });
  });

  it("should render guidance group items", async () => {
    render(
      <MockedProvider mocks={mocks}>
        <GuidancePage />
      </MockedProvider>,
    );

    await waitFor(() => {
      const listItems = document.querySelectorAll('.guidanceContent');
      expect(listItems.length).toBeGreaterThan(0);
    })
  });

  it("should render guidance group metadata", async () => {
    render(
      <MockedProvider mocks={mocks}>
        <GuidancePage />
      </MockedProvider>,
    );

    await waitFor(() => {
      const lastUpdatedElement = screen.getAllByText(/Global\.lastUpdated\s*:\s*11-25-2025/i);
      const statusElement = screen.getAllByText(/Guidance\.status\.status\s*:\s*Guidance.status.unpublishedChanges/i);
      const guidanceTextCountElement = screen.getByText(/10\s*\/\s*14\s*Tags with Guidance/i);
      expect(lastUpdatedElement.length).toBeGreaterThan(0);
      expect(statusElement.length).toBeGreaterThan(0);
      expect(guidanceTextCountElement).toBeInTheDocument();
    });
  });

  it("should render guidance group descriptions", async () => {
    render(
      <MockedProvider mocks={mocks}>
        <GuidancePage />
      </MockedProvider>,
    );

    await waitFor(() => {
      const descriptions = document.querySelectorAll(".description");
      expect(descriptions.length).toBeGreaterThan(0);
    });
  });

  it("should render guidance group status information", async () => {
    render(
      <MockedProvider mocks={mocks}>
        <GuidancePage />
      </MockedProvider>,
    );

    await waitFor(() => {
      const publishedElements = screen.getAllByText(/Guidance\.status\.status\s*:\s*Guidance.status.published/);
      const draftElements = screen.getAllByText(/Guidance\.status\.status\s*:\s*Guidance.status.draft/);
      expect(publishedElements.length).toBeGreaterThan(0);
      expect(draftElements.length).toBeGreaterThan(0);
    });
  });

  it("should render multiple guidance groups", async () => {
    render(
      <MockedProvider mocks={mocks}>
        <GuidancePage />
      </MockedProvider>,
    );

    await waitFor(() => {
      const guidanceItems = document.querySelectorAll(".guidanceList > *");
      expect(guidanceItems.length).toBeGreaterThan(1);
    })
  });

  it("should have guidance-specific structure", async () => {
    render(
      <MockedProvider mocks={mocks}>
        <GuidancePage />
      </MockedProvider>,
    );

    await waitFor(() => {
      const guidanceList = document.querySelector(".guidanceList");
      expect(guidanceList).toBeInTheDocument();
    });
  });

  it("should render author information in metadata", async () => {
    render(
      <MockedProvider mocks={mocks}>
        <GuidancePage />
      </MockedProvider>,
    );

    await waitFor(() => {
      const metadata = document.querySelectorAll(".metadata");
      expect(metadata.length).toBeGreaterThan(0);
    });
  });

  it("should pass accessibility tests", async () => {
    const { container } = render(
      <MockedProvider mocks={mocks}>
        <GuidancePage />
      </MockedProvider>,
    );

    await waitFor(() => {
      expect(screen.getByLabelText("Guidance groups list")).toBeInTheDocument();
    });

    const results = await axe(container);
    expect(results).toHaveNoViolations();
  });
});
