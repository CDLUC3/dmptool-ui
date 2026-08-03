import React from "react";
import { fireEvent, render, screen, waitFor } from "@testing-library/react";
import { useMutation, useQuery } from "@apollo/client/react";
import { useRouter } from "next/navigation";
import { useToast } from "@/context/ToastContext";
import {
  AffiliationByIdDocument,
  AffiliationType,
  GenerateLogoUploadUrlDocument,
  MeDocument,
  UpdateAffiliationDocument,
} from "@/generated/graphql";
import OrganizationDetailsPage from "../page";

jest.mock("@apollo/client/react", () => ({
  useQuery: jest.fn(),
  useMutation: jest.fn(),
}));

jest.mock("@/app/[locale]/admin/organization-details/actions/s3Uploader", () => ({
  uploadFileToS3: jest.fn(),
}));

type SetupOptions = {
  isSuperAdmin?: boolean;
  affiliationLoading?: boolean;
  affiliationError?: Error;
  affiliationOverrides?: Record<string, unknown>;
};

const pushMock = jest.fn();
const toastAddMock = jest.fn();
const updateMutationMock = jest.fn();
const generateMutationMock = jest.fn();
const finalizeMutationMock = jest.fn();
const mockUseQuery = useQuery as unknown as jest.Mock;
const mockUseMutation = useMutation as unknown as jest.Mock;

const defaultAffiliation = {
  id: 42,
  uri: "https://ror.org/00dmfq477",
  provenance: "ROR",
  managed: true,
  funder: false,
  name: "University of California",
  acronyms: ["UC"],
  homepage: "https://ucop.edu",
  displayName: "UCOP",
  displayAbbreviation: "UCOP",
  displayDomain: "https://ucop.edu",
  contactName: "Admin Contact",
  contactEmail: "admin@ucop.edu",
  types: [AffiliationType.Archive],
  logoName: null,
  logoURI: null,
  fundrefId: "100014576",
  ssoEntityId: "urn:mace:incommon:ucop.edu",
  ssoEmailDomains: ["ucop.edu", "ucp.edu"],
  apiTarget: "",
  subHeaderLinks: [{ id: 1, url: "https://example.org", text: "Example" }],
};

const setupApollo = (options: SetupOptions = {}) => {
  const role = options.isSuperAdmin ? "SUPERADMIN" : "ADMIN";
  const affiliationData = { ...defaultAffiliation, ...(options.affiliationOverrides || {}) };

  const meResult = {
    data: { me: { role, affiliation: { id: 42 } } },
    loading: false,
    error: undefined,
  };

  const affiliationResult = {
    data: options.affiliationLoading || options.affiliationError ? undefined : { affiliationById: affiliationData },
    loading: Boolean(options.affiliationLoading),
    error: options.affiliationError,
  };

  mockUseQuery.mockImplementation((document: unknown) => {
    if (document === MeDocument) {
      return meResult;
    }

    if (document === AffiliationByIdDocument) {
      return affiliationResult;
    }

    return { data: undefined, loading: false, error: undefined };
  });

  mockUseMutation.mockImplementation((document: unknown) => {
    if (document === UpdateAffiliationDocument) {
      return [updateMutationMock, { loading: false }];
    }
    if (document === GenerateLogoUploadUrlDocument) {
      return [generateMutationMock, { loading: false }];
    }
    return [jest.fn(), { loading: false }];
  });
};

describe("OrganizationDetailsPage", () => {
  beforeEach(() => {
    jest.clearAllMocks();
    window.scrollTo = jest.fn();
    HTMLElement.prototype.scrollIntoView = jest.fn();
    (useRouter as jest.Mock).mockReturnValue({ push: pushMock });
    (useToast as jest.Mock).mockReturnValue({ add: toastAddMock });

    updateMutationMock.mockResolvedValue({ data: { updateAffiliation: {} } });
    generateMutationMock.mockResolvedValue({ data: { generateLogoUploadURL: { url: "", fields: "", errors: null } } });
    finalizeMutationMock.mockResolvedValue({ data: { finalizeLogoUpload: { errors: null } } });
  });

  it("renders loading state while affiliation query is loading", () => {
    setupApollo({ affiliationLoading: true });

    render(<OrganizationDetailsPage />);

    expect(screen.getByText("messaging.loading")).toBeInTheDocument();
  });

  it("renders core sections and seeded data for non-superadmin", async () => {
    setupApollo();

    render(<OrganizationDetailsPage />);

    await waitFor(() => {
      expect(screen.getByRole("heading", { level: 1, name: "title" })).toBeInTheDocument();
    });

    expect(screen.getByText("sections.organizationDetails.title")).toBeInTheDocument();
    expect(screen.getByText("sections.branding.title")).toBeInTheDocument();
    expect(screen.getByText("sections.identifiers.title")).toBeInTheDocument();
    expect(document.querySelector('input[name="organizationName"]')).toHaveValue("UCOP");
    expect(document.querySelector('input[name="linkText"]')).toHaveValue("Admin Contact");
    expect(screen.getByText("fields.organizationType.types.archive")).toBeInTheDocument();
  });

  it("uses a native submit button and disables browser-native validation", () => {
    setupApollo();

    render(<OrganizationDetailsPage />);

    const form = document.querySelector("form");
    const submitButton = screen.getByRole("button", { name: "buttons.save" });

    expect(form).toHaveAttribute("novalidate");
    expect(submitButton).toHaveAttribute("type", "submit");
  });

  it("adds and removes affiliation links and enforces max of 5", async () => {
    setupApollo();

    render(<OrganizationDetailsPage />);

    await waitFor(() => {
      expect(document.querySelectorAll('input[name^="url-"]')).toHaveLength(1);
    });

    const addButton = screen.getByRole("button", { name: "buttons.addLink" });
    for (let i = 0; i < 10; i++) {
      fireEvent.click(addButton);
    }

    expect(document.querySelectorAll('input[name^="url-"]')).toHaveLength(5);

    fireEvent.click(screen.getAllByRole("button", { name: /buttons.deleteLink/i })[0]);
    expect(document.querySelectorAll('input[name^="url-"]')).toHaveLength(4);
  });

  it("updates link URL/text field values", async () => {
    setupApollo();

    render(<OrganizationDetailsPage />);

    await waitFor(() => {
      expect(document.querySelector('input[name="url-1"]')).toBeInTheDocument();
    });

    const urlInput = document.querySelector('input[name="url-1"]') as HTMLInputElement;
    const textInput = document.querySelector('input[name="text-1"]') as HTMLInputElement;

    fireEvent.change(urlInput, { target: { value: "https://updated.example.org" } });
    fireEvent.change(textInput, { target: { value: "Updated link" } });

    expect(urlInput).toHaveValue("https://updated.example.org");
    expect(textInput).toHaveValue("Updated link");
  });

  it("renders superadmin checkbox group with pre-selected type", async () => {
    setupApollo({ isSuperAdmin: true });

    render(<OrganizationDetailsPage />);

    await waitFor(() => {
      expect(screen.getAllByLabelText("checkbox").length).toBeGreaterThan(0);
    });

    expect(screen.getByText("fields.organizationType.types.archive")).toBeInTheDocument();
  });

  it("submits a valid form and shows success toast", async () => {
    setupApollo();

    render(<OrganizationDetailsPage />);

    await waitFor(() => {
      expect(document.querySelector('input[name="organizationName"]')).toBeInTheDocument();
    });

    fireEvent.click(screen.getByRole("button", { name: "buttons.save" }));

    await waitFor(() => {
      expect(updateMutationMock).toHaveBeenCalledTimes(1);
      expect(toastAddMock).toHaveBeenCalledWith("messages.success.organizationDetailsSaved", {
        type: "success",
        timeout: 3000,
      });
    });
  });

  it("shows validation errors and skips mutation when form is invalid", async () => {
    setupApollo();

    render(<OrganizationDetailsPage />);

    const emailInput = await waitFor(() => {
      const input = document.querySelector('input[name="contactEmail"]') as HTMLInputElement | null;
      expect(input).toBeInTheDocument();
      return input as HTMLInputElement;
    });
    fireEvent.change(emailInput, { target: { value: "not-an-email" } });
    fireEvent.click(screen.getByRole("button", { name: "buttons.save" }));

    await waitFor(() => {
      expect(updateMutationMock).not.toHaveBeenCalled();
      expect(screen.getByText("messages.errors.organizationDetailsSave")).toBeInTheDocument();
    });
  });

  it("redirects to not-found on forbidden affiliation error", async () => {
    setupApollo({ affiliationError: new Error("forbidden") });

    render(<OrganizationDetailsPage />);

    await waitFor(() => {
      expect(pushMock).toHaveBeenCalledWith("/not-found");
    });
  });

  it("renders generic query error message", async () => {
    setupApollo({ affiliationError: new Error("Network exploded") });

    render(<OrganizationDetailsPage />);

    await waitFor(() => {
      expect(screen.getByText("Network exploded")).toBeInTheDocument();
    });
  });

  it("shows upload area when there is no active selected file", async () => {
    setupApollo({
      affiliationOverrides: {
        logoName: "logos/ucop.png",
        logoURI: "https://cdn.example.org/ucop.png",
      },
    });

    render(<OrganizationDetailsPage />);

    expect(await screen.findByText("upload.title")).toBeInTheDocument();
    expect(screen.queryByRole("button", { name: "Remove logo" })).not.toBeInTheDocument();
  });
});
