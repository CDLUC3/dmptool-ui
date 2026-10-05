import React from "react";
import { render, screen, fireEvent, waitFor } from "@testing-library/react";
import "@testing-library/jest-dom";
import { axe, toHaveNoViolations } from "jest-axe";
import GuidanceGroupEditPage from "../page";
import logECS from "@/utils/clientLogger";
import { useTranslations } from "next-intl";
import { MockedProvider } from "@apollo/client/testing/react";
import { useParams } from "next/navigation";
import { useRouter } from "@/i18n/routing";
import { GuidanceGroupDocument } from "@/generated/graphql";
import { updateGuidanceGroupAction } from "../actions";
import { useToast } from "@/context/ToastContext";
// Use a minimal mock aligned to GuidanceGroupDocument's shape

// Extend jest-axe
expect.extend(toHaveNoViolations);

// Mocks
jest.mock("next/navigation", () => ({
  useParams: jest.fn(),
}));

jest.mock('@/i18n/routing', () => ({
  Link: ({ href, children, ...props }: { href: string; children: React.ReactNode }) => (
    <a href={href} {...props}>{children}</a>
  ),
  useRouter: jest.fn(() => ({ push: jest.fn(), replace: jest.fn(), back: jest.fn() })),
  usePathname: jest.fn(() => '/admin/guidance/groups/1/edit'),
}));

jest.mock("next-intl", () => ({
  useTranslations: jest.fn(),
}));

// Do NOT mock generated GraphQL when using MockedProvider

jest.mock("../actions", () => ({
  updateGuidanceGroupAction: jest.fn(),
}));

jest.mock("@/context/ToastContext", () => ({
  useToast: jest.fn(),
}));

jest.mock("@/utils/clientLogger", () => jest.fn());

const mockRouter = { push: jest.fn(), replace: jest.fn(), refresh: jest.fn(), back: jest.fn() };
const mockToast = { add: jest.fn() };


const mocks = [
  {
    request: {
      query: GuidanceGroupDocument,
      variables: { guidanceGroupId: 2397 },
    },
    result: {
      data: {
        guidanceGroup: {
          __typename: "GuidanceGroup",
          id: 2397,
          name: "Existing Guidance Group",
          description: "Existing description",
          optionalSubset: false,
          bestPractice: false,
          latestPublishedDate: null,
          latestPublishedVersion: null,
          isDirty: false,
          versionedGuidanceGroup: null,
          guidance: [],
        },
      },
    },
  },
];
describe("GuidanceGroupEditPage", () => {
  beforeEach(() => {
    // General DOM mocks
    window.scrollTo = jest.fn();
    HTMLElement.prototype.scrollIntoView = jest.fn();

    // Params: groupId
    (useParams as jest.Mock).mockReturnValue({ groupId: 2397 });

    // Router
    (useRouter as jest.Mock).mockReturnValue(mockRouter);

    // Translations: return namespace.key
    (useTranslations as jest.Mock).mockImplementation((ns: string) => (key: string) => `${ns}.${key}`);

    // Toast
    (useToast as jest.Mock).mockReturnValue(mockToast);

    jest.clearAllMocks();
  });

  afterEach(() => {
    jest.clearAllMocks();
  });

  const getNameInput = () => screen.getByLabelText("Guidance.fields.groupName.label", { exact: false }) as HTMLInputElement;
  const getDescriptionInput = () => screen.getByLabelText("Guidance.fields.groupDescription.label", { exact: false }) as HTMLInputElement;

  it("should render form with loaded guidance group data", async () => {
    render(
      <MockedProvider mocks={mocks}>
        <GuidanceGroupEditPage />
      </MockedProvider>,
    );

    // Wait for heading to appear indicating data rendered
    await waitFor(() => {
      expect(screen.getByRole("heading", { name: "Guidance.pages.groupEdit.title" })).toBeInTheDocument();
    });

    expect(screen.getByRole("heading", { name: "Guidance.pages.groupEdit.title" })).toBeInTheDocument();
    expect(screen.getByText("Guidance.pages.groupEdit.description")).toBeInTheDocument();
    expect(screen.getByLabelText("Guidance.fields.groupName.label", { exact: false })).toBeInTheDocument();
    expect(screen.getByLabelText("Guidance.fields.groupDescription.label", { exact: false })).toBeInTheDocument();
    const nameInput = getNameInput();
    const descriptionInput = getDescriptionInput();
    expect(nameInput.value).toBe("Existing Guidance Group");
    expect(descriptionInput.value).toBe("Existing description");
    expect(screen.getByRole("button", { name: "Guidance.actions.saveChanges" })).toBeInTheDocument();
  });

  it("should update group name input value", async () => {
    render(
      <MockedProvider mocks={mocks}>
        <GuidanceGroupEditPage />
      </MockedProvider>,
    );

    // Wait for heading to appear indicating data rendered
    await waitFor(() => {
      expect(screen.getByRole("heading", { name: "Guidance.pages.groupEdit.title" })).toBeInTheDocument();
    });

    const nameInput = getNameInput();
    expect(nameInput).toBeInTheDocument();
    fireEvent.change(nameInput, { target: { value: "Updated Name" } });
    expect(nameInput.value).toBe("Updated Name");
  });

  it("should update group description input value", async () => {
    render(
      <MockedProvider mocks={mocks}>
        <GuidanceGroupEditPage />
      </MockedProvider>,
    );

    // Wait for heading to appear indicating data rendered
    await waitFor(() => {
      expect(screen.getByRole("heading", { name: "Guidance.pages.groupEdit.title" })).toBeInTheDocument();
    });

    const descriptionInput = getDescriptionInput();
    expect(descriptionInput).toBeInTheDocument();
    fireEvent.change(descriptionInput, { target: { value: "Updated description" } });
    expect(descriptionInput.value).toBe("Updated description");
  });

  it("should handle successful update with toast and redirect", async () => {
    (updateGuidanceGroupAction as jest.Mock).mockResolvedValue({
      success: true,
      data: { id: 2397, errors: {} },
      redirect: undefined,
    });

    render(
      <MockedProvider mocks={mocks}>
        <GuidanceGroupEditPage />
      </MockedProvider>,
    );
    await waitFor(() => {
      expect(screen.getByRole("heading", { name: "Guidance.pages.groupEdit.title" })).toBeInTheDocument();
    });
    const nameInput = getNameInput();
    fireEvent.change(nameInput, { target: { value: "Changed Name" } });
    const saveButton = screen.getByRole("button", { name: "Guidance.actions.saveChanges" });
    fireEvent.click(saveButton);

    await waitFor(() => {
      expect(updateGuidanceGroupAction).toHaveBeenCalledTimes(1);
      expect(updateGuidanceGroupAction).toHaveBeenCalledWith({
        guidanceGroupId: 2397,
        name: "Changed Name",
        description: "Existing description",
        optionalSubset: false,
        bestPractice: false,
      });
      expect(mockToast.add).toHaveBeenCalledWith("Guidance.messages.success.guidanceGroupUpdated", { type: "success" });
      expect(mockRouter.push).toHaveBeenCalled();
    });
  });

  it("should show errors when update action fails (success false)", async () => {
    (updateGuidanceGroupAction as jest.Mock).mockResolvedValue({
      success: false,
      errors: ["Name already exists."],
    });

    render(
      <MockedProvider mocks={mocks}>
        <GuidanceGroupEditPage />
      </MockedProvider>,
    );
    await waitFor(() => {
      expect(screen.getByRole("heading", { name: "Guidance.pages.groupEdit.title" })).toBeInTheDocument();
    });

    const saveButton = screen.getByRole("button", { name: "Guidance.actions.saveChanges" });
    fireEvent.click(saveButton);

    await waitFor(() => {
      expect(screen.getByText("Name already exists.")).toBeInTheDocument();
      expect(logECS).toHaveBeenCalledWith(
        "error",
        "publishing Guidance Group",
        expect.objectContaining({ errors: expect.anything(), url: expect.objectContaining({ path: expect.any(String) }) })
      );
    });
  });

  it("should show field-level errors when returned in data.errors", async () => {
    (updateGuidanceGroupAction as jest.Mock).mockResolvedValue({
      success: true,
      data: { id: 2397, errors: { general: "There was a general error" } },
      redirect: undefined,
    });

    render(
      <MockedProvider mocks={mocks}>
        <GuidanceGroupEditPage />
      </MockedProvider>,
    );
    await waitFor(() => {
      expect(screen.getByRole("heading", { name: "Guidance.pages.groupEdit.title" })).toBeInTheDocument();
    });

    const saveButton = screen.getByRole("button", { name: "Guidance.actions.saveChanges" });
    fireEvent.click(saveButton);

    await waitFor(() => {
      expect(screen.getByText("There was a general error")).toBeInTheDocument();
      expect(logECS).toHaveBeenCalledWith(
        "error",
        "publishing Guidance Group",
        expect.objectContaining({ errors: expect.anything(), url: expect.objectContaining({ path: expect.any(String) }) })
      );
      expect(mockToast.add).not.toHaveBeenCalled();
    });
  });

  it("should redirect if update action returns redirect", async () => {
    (updateGuidanceGroupAction as jest.Mock).mockResolvedValue({
      success: true,
      data: { id: 2397, errors: {} },
      redirect: "/admin/guidance/groups",
    });

    render(
      <MockedProvider mocks={mocks}>
        <GuidanceGroupEditPage />
      </MockedProvider>,
    );
    await waitFor(() => {
      expect(screen.getByRole("heading", { name: "Guidance.pages.groupEdit.title" })).toBeInTheDocument();
    });

    const saveButton = screen.getByRole("button", { name: "Guidance.actions.saveChanges" });
    fireEvent.click(saveButton);

    await waitFor(() => {
      expect(mockRouter.push).toHaveBeenCalledWith("/admin/guidance/groups");
    });
  });

  it("should pass accessibility check", async () => {
    const { container } = render(
      <MockedProvider mocks={mocks}>
        <GuidanceGroupEditPage />
      </MockedProvider>,
    );

    await waitFor(() => {
      expect(screen.getByRole("heading", { name: "Guidance.pages.groupEdit.title" })).toBeInTheDocument();
    });
    const results = await axe(container);
    expect(results).toHaveNoViolations();
  });
});
