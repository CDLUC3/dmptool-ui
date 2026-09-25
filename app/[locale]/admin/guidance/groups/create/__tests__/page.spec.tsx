import React from "react";
import { render, screen, waitFor, fireEvent, waitForElementToBeRemoved } from "@testing-library/react";
import "@testing-library/jest-dom";
import { axe, toHaveNoViolations } from "jest-axe";
import {
  MeDocument,
} from "@/generated/graphql";
import {
  addGuidanceGroupAction
} from '../actions';
import { MockedProvider } from "@apollo/client/testing/react";
import { useFormatter, useTranslations } from "next-intl";
import { useParams } from 'next/navigation';
import { useRouter } from "@/i18n/routing";
import logECS from '@/utils/clientLogger';
import { useToast } from '@/context/ToastContext';
import { mockScrollIntoView } from '@/__mocks__/common';

import mockMeData from "../../../__mocks__/mockMeData.json";
import GuidanceGroupCreatePage from "../page";


jest.mock('../actions/index', () => ({
  addGuidanceGroupAction: jest.fn(),
}));

// Mock next-intl hooks
jest.mock("next-intl", () => ({
  useFormatter: jest.fn(),
  useTranslations: jest.fn(),
}));

jest.mock('next/navigation', () => ({
  useParams: jest.fn()
}));


jest.mock('@/i18n/routing', () => ({
  useRouter: jest.fn(() => ({ push: jest.fn(), replace: jest.fn(), back: jest.fn() })),
}));

const mockRouter = {
  push: jest.fn(),
};

const mockToast = {
  add: jest.fn(),
};


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
]

describe("GuidanceGroupCreatePage", () => {
  beforeEach(() => {
    window.scrollTo = jest.fn();
    HTMLElement.prototype.scrollIntoView = mockScrollIntoView;

    const mockUseParams = useParams as jest.Mock;
    // Mock the return value of useParams
    mockUseParams.mockReturnValue({ groupId: 2397 });

    // Mock Toast
    (useToast as jest.Mock).mockReturnValue(mockToast);

    (useRouter as jest.Mock).mockReturnValue(mockRouter);

    (useFormatter as jest.Mock).mockReturnValue({
      dateTime: jest.fn((date) => date.toLocaleDateString()),
    });

    (useTranslations as jest.Mock).mockImplementation((namespace) => {
      return (key: string) => `${namespace}.${key}`;
    });
  });

  afterEach(() => {
    jest.clearAllMocks();
  });

  it("should render the correct form data", async () => {
    render(
      <MockedProvider mocks={mocks}>
        <GuidanceGroupCreatePage />
      </MockedProvider>,
    );
    // Wait for loading to be gone (tagsLoading and guidanceLoading both false)
    await waitForElementToBeRemoved(() => screen.getByText("Global.messaging.loading"));
    expect(screen.getByRole("heading", { name: "Guidance.pages.groupCreate.title" })).toBeInTheDocument();
    expect(screen.getByText("Guidance.pages.groupCreate.description")).toBeInTheDocument();
    expect(screen.getByLabelText("Guidance.fields.groupName.label", { exact: false })).toBeInTheDocument();
    const nameInput = document.querySelector('#name');
    expect(nameInput).toBeInTheDocument();
    expect(screen.getByLabelText("Guidance.fields.groupDescription.label")).toBeInTheDocument();
    const descriptionInput = document.querySelector('#description');
    expect(descriptionInput).toBeInTheDocument();
    const createButton = screen.getByRole("button", { name: "Guidance.actions.createGroup" });
    expect(createButton).toBeInTheDocument();
  });

  it("should handle group name input changes", async () => {
    render(
      <MockedProvider mocks={mocks}>
        <GuidanceGroupCreatePage />
      </MockedProvider>,
    );

    // Wait for loading to be gone (tagsLoading and guidanceLoading both false)
    await waitForElementToBeRemoved(() => screen.getByText("Global.messaging.loading"));

    const nameInput = document.querySelector('#name');
    expect(nameInput).toBeInTheDocument();
    fireEvent.change(nameInput!, { target: { value: "New Group Name" } });
    expect((nameInput as HTMLInputElement).value).toBe("New Group Name");
  });

  it("should handle group description input changes", async () => {
    render(
      <MockedProvider mocks={mocks}>
        <GuidanceGroupCreatePage />
      </MockedProvider>,
    );

    // Wait for loading to be gone (tagsLoading and guidanceLoading both false)
    await waitForElementToBeRemoved(() => screen.getByText("Global.messaging.loading"));

    const descriptionInput = document.querySelector('#description');
    expect(descriptionInput).toBeInTheDocument();
    fireEvent.change(descriptionInput!, { target: { value: "New Group Description" } });
    expect((descriptionInput as HTMLInputElement).value).toBe("New Group Description");
  });

  it("should handle submittal of the form", async () => {
    (addGuidanceGroupAction as jest.Mock).mockResolvedValue({
      success: true,
      data: {
        id: 999, errors: {
          general: null
        }
      },
      redirect: undefined,
    });

    render(
      <MockedProvider mocks={mocks}>
        <GuidanceGroupCreatePage />
      </MockedProvider>,
    );

    // Wait for loading to be gone (tagsLoading and guidanceLoading both false)
    await waitForElementToBeRemoved(() => screen.getByText("Global.messaging.loading"));

    const nameInput = document.querySelector('#name');
    expect(nameInput).toBeInTheDocument();
    fireEvent.change(nameInput!, { target: { value: "New Group Name" } });
    expect((nameInput as HTMLInputElement).value).toBe("New Group Name");
    const createButton = screen.getByRole("button", { name: "Guidance.actions.createGroup" });
    fireEvent.click(createButton);
    await waitFor(() => {
      expect(addGuidanceGroupAction).toHaveBeenCalledTimes(1);
      expect(addGuidanceGroupAction).toHaveBeenCalledWith({
        affiliationId: "https://ror.org/03yrm5c12",
        bestPractice: false,
        name: "New Group Name",
        description: "",
      });
    });
    expect(mockToast.add).toHaveBeenCalledWith('Guidance.messages.success.guidanceGroupCreated', { type: 'success' });

  });

  it("should display error if call to addGuidanceGroupAction fails", async () => {
    (addGuidanceGroupAction as jest.Mock).mockResolvedValue({
      success: false,
      errors: ["Name already exists."],
    });

    render(
      <MockedProvider mocks={mocks}>
        <GuidanceGroupCreatePage />
      </MockedProvider>,
    );

    // Wait for loading to be gone (tagsLoading and guidanceLoading both false)
    await waitForElementToBeRemoved(() => screen.getByText("Global.messaging.loading"));

    const nameInput = document.querySelector('#name');
    expect(nameInput).toBeInTheDocument();
    fireEvent.change(nameInput!, { target: { value: "New Group Name" } });
    expect((nameInput as HTMLInputElement).value).toBe("New Group Name");
    const createButton = screen.getByRole("button", { name: "Guidance.actions.createGroup" });
    fireEvent.click(createButton);
    await waitFor(() => {
      expect(screen.getByText('Name already exists.')).toBeInTheDocument();
      //Check that error logged
      expect(logECS).toHaveBeenCalledWith(
        'error',
        'creating Guidance Group',
        expect.objectContaining({
          errors: expect.anything(),
          url: { path: '/admin/guidance/groups/create' },
        })
      )
    });
  });

  it("should display error if addGuidanceGroupAction returns field-level errors", async () => {
    (addGuidanceGroupAction as jest.Mock).mockResolvedValue({
      success: true,
      data: {
        id: 999,
        errors: {
          general: "There was a general error"
        }
      },
      redirect: undefined,
    });

    render(
      <MockedProvider mocks={mocks}>
        <GuidanceGroupCreatePage />
      </MockedProvider>,
    );

    // Wait for loading to be gone (tagsLoading and guidanceLoading both false)
    await waitForElementToBeRemoved(() => screen.getByText("Global.messaging.loading"));

    const nameInput = document.querySelector('#name');
    expect(nameInput).toBeInTheDocument();
    fireEvent.change(nameInput!, { target: { value: "New Group Name" } });
    expect((nameInput as HTMLInputElement).value).toBe("New Group Name");
    const createButton = screen.getByRole("button", { name: "Guidance.actions.createGroup" });
    fireEvent.click(createButton);
    await waitFor(() => {
      expect(screen.getByText('There was a general error')).toBeInTheDocument();
      //Check that error logged
      expect(logECS).toHaveBeenCalledWith(
        'error',
        'creating Guidance Group',
        expect.objectContaining({
          errors: expect.anything(),
          url: { path: '/admin/guidance/groups/create' },
        })
      )
    });
  });

  it("should redirect if addGuidanceGroupAction returns a redirect", async () => {
    (addGuidanceGroupAction as jest.Mock).mockResolvedValue({
      success: true,
      data: {
        id: 999,
        errors: {
          general: null
        }
      },
      redirect: "/admin/guidance/groups",
    });

    render(
      <MockedProvider mocks={mocks}>
        <GuidanceGroupCreatePage />
      </MockedProvider>,
    );

    // Wait for loading to be gone (tagsLoading and guidanceLoading both false)
    await waitForElementToBeRemoved(() => screen.getByText("Global.messaging.loading"));

    const nameInput = document.querySelector('#name');
    expect(nameInput).toBeInTheDocument();
    fireEvent.change(nameInput!, { target: { value: "New Group Name" } });
    expect((nameInput as HTMLInputElement).value).toBe("New Group Name");
    const createButton = screen.getByRole("button", { name: "Guidance.actions.createGroup" });
    fireEvent.click(createButton);
    await waitFor(() => {
      expect(mockRouter.push).toHaveBeenCalledWith("/admin/guidance/groups");
      expect(addGuidanceGroupAction).toHaveBeenCalledWith({
        affiliationId: "https://ror.org/03yrm5c12",
        bestPractice: false,
        name: "New Group Name",
        description: "",
      });
    });
  });

  it("should pass accessibility tests", async () => {
    const { container } = render(
      <MockedProvider mocks={mocks}>
        <GuidanceGroupCreatePage />
      </MockedProvider>,
    );

    await waitForElementToBeRemoved(() => screen.getByText("Global.messaging.loading"));


    const results = await axe(container);
    expect(results).toHaveNoViolations();
  });
});
