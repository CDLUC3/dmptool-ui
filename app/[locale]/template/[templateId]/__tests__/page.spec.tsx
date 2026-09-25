// Mock useFormatter and useTranslations from next-intl
jest.mock("next-intl", () => ({
  useTranslations: jest.fn(() => jest.fn((key) => key)), // Mock `useTranslations`,
}));
import React from "react";
import { act, fireEvent, render, screen, waitFor, within } from "@/utils/test-utils";
import { useQuery, useMutation } from '@apollo/client/react';
import {
  ArchiveTemplateDocument,
  CreateTemplateVersionDocument,
  TemplateDocument,
  SectionDocument,
} from "@/generated/graphql";
import { useToast } from "@/context/ToastContext";
import { useParams } from "next/navigation";
import { useRouter } from "@/i18n/routing";
import logECS from "@/utils/clientLogger";
import TemplateEditPage from "../page";
import { updateTemplateAction, updateSectionDisplayOrderAction } from "../actions";
import { mockScrollIntoView, mockScrollTo } from "@/__mocks__/common";
import { axe, toHaveNoViolations } from "jest-axe";

expect.extend(toHaveNoViolations);

jest.mock("next/link", () => {
  /* eslint-disable @typescript-eslint/no-explicit-any */
  const MockLink = ({ children, href }: any) => <a href={href}>{children}</a>;
  MockLink.displayName = "MockNextLink";
  return MockLink;
});

// Mock useFormatter and useTranslations from next-intl
jest.mock("next-intl", () => ({
  useFormatter: jest.fn(() => ({
    dateTime: jest.fn(() => "01-01-2023"),
  })),
  useTranslations: jest.fn(() => jest.fn((key) => key)), // Mock `useTranslations`,
}));

// Mock Apollo Client hooks
jest.mock('@apollo/client/react', () => ({
  useQuery: jest.fn(),
  useMutation: jest.fn(),
}));

// Mock the useTemplateQuery hook
jest.mock("@/generated/graphql", () => ({
  ...jest.requireActual("@/generated/graphql"),
  TemplateVersionType: { Draft: "DRAFT", Published: "PUBLISHED" },
  TemplateVisibility: { Organization: "ORGANIZATION", Public: "PUBLIC" },
}));

jest.mock("../actions/index", () => ({
  updateTemplateAction: jest.fn(),
  updateSectionDisplayOrderAction: jest.fn(),
}));

jest.mock("next/navigation", () => ({
  useParams: jest.fn(),
}));

jest.mock('@/i18n/routing', () => ({
  Link: ({ href, children, ...props }: { href: string; children: React.ReactNode }) => (
    <a href={href} {...props}>{children}</a>
  ),
  useRouter: jest.fn(() => ({ push: jest.fn(), replace: jest.fn(), back: jest.fn() })),
}));

const mockToast = {
  add: jest.fn(),
};

const mockUseRouter = useRouter as jest.Mock;

jest.mock("@/components/BackButton", () => {
  return {
    __esModule: true,
    default: () => <div>Mocked Back Button</div>,
  };
});

const mockArchiveTemplateData = {
  data: {
    archiveTemplate: {
      id: 15,
      name: "Test template",
      errors: {
        general: "Template could not be archived",
        name: null,
        owner: null,
      },
    },
  },
};

const mockSectionData = {
  id: 79,
  name: "Data Description",
  displayOrder: 1,
  questions: [
    {
      id: 1,
      displayOrder: 1,
      questionText: "Email field",
    },
    {
      id: 2,
      displayOrder: 2,
      questionText: "Process and Procedures",
    },
  ],
};

const mockTemplateData: {
  name: string;
  id: number | null; // Allow `id` to be `number` or `null`
  latestPublishVisibility: string;
  description: string;
  errors: null;
  latestPublishVersion: string;
  latestPublishDate: string;
  created: string;
  sections: {
    id: number;
    displayOrder: number;
    name: string;
    questions: {
      errors: null;
      displayOrder: number;
      guidanceText: string;
      id: number;
      questionText: string;
    }[];
  }[];
} = {
  name: "DMP Template from Dataverse",
  id: 15,
  latestPublishVisibility: "ORGANIZATION",
  description: "DMP Template from Dataverse",
  errors: null,
  latestPublishVersion: "v1",
  latestPublishDate: "1648835084000",
  created: "1412980160000",
  sections: [
    {
      id: 67,
      displayOrder: 1,
      name: "Data description",
      questions: [
        {
          errors: null,
          displayOrder: 1,
          guidanceText: '<p><br><a href="http://thedata.org/book/data-management-plan">Dataverse page on DMPs</a></p>',
          id: 67,
          questionText:
            "Briefly describe nature &amp; scale of data {simulated, observed, experimental information; samples; publications; physical collections; software; models} generated or collected.",
        },
      ],
    },
    {
      id: 68,
      displayOrder: 1,
      name: "NFS",
      questions: [
        {
          errors: null,
          displayOrder: 1,
          guidanceText: "Guidance text",
          id: 67,
          questionText: "National Science Foundation",
        },
      ],
    },
  ],
};

// Cast with jest.mocked utility
const mockUseQuery = jest.mocked(useQuery);
const mockUseMutation = jest.mocked(useMutation);

const setupMocks = () => {
  // Create stable references OUTSIDE mockImplementation
  const stableTemplateQueryReturn = {
    data: { template: mockTemplateData },
    loading: false,
    error: null,
  };

  mockUseQuery.mockImplementation((document) => {
    if (document === TemplateDocument) {
      return stableTemplateQueryReturn as any;
    }
    if (document === SectionDocument) {
      return {
        data: {
          section: mockSectionData,
        },
        loading: false,
        error: null,
        refetch: jest.fn(),
      };
    }
    return {
      data: null,
      loading: false,
      error: undefined
    };
  });

  const mockMutationFn = jest.fn().mockResolvedValue({
    data: {
      key: 'value'
    },
  });

  mockUseMutation.mockImplementation((document) => {
    if (document === ArchiveTemplateDocument) {
      return [
        mockMutationFn,
        { loading: false, error: undefined }
      ] as any;
    }

    if (document === CreateTemplateVersionDocument) {
      return [
        mockMutationFn,
        { loading: false, error: undefined }
      ] as any;
    }

    return [jest.fn(), { loading: false, error: undefined }] as any;
  });
};
describe("TemplateEditPage", () => {
  beforeEach(() => {
    setupMocks();
    jest.clearAllMocks();
    HTMLElement.prototype.scrollIntoView = mockScrollIntoView;
    mockScrollTo();
    const mockTemplateId = 123;
    const mockUseParams = useParams as jest.Mock;

    // Mock the return value of useParams
    mockUseParams.mockReturnValue({ templateId: `${mockTemplateId}` });

    mockUseRouter.mockReturnValue({
      push: jest.fn(),
    });

    (useToast as jest.Mock).mockReturnValue(mockToast);
  });

  it("should render loading state", async () => {
    mockUseQuery.mockImplementation((document) => {
      if (document === TemplateDocument) {
        return {
          data: null,
          loading: true,
          error: null,
        } as any;
      }
      if (document === SectionDocument) {
        return {
          data: {
            section: mockSectionData,
          },
          loading: false,
          error: null,
          refetch: jest.fn(),
        };
      }
      return {
        data: null,
        loading: false,
        error: undefined
      };
    });

    render(<TemplateEditPage />);

    expect(screen.getByText("messaging.loading")).toBeInTheDocument();
  });

  it("should render data returned from template query correctly", async () => {
    render(<TemplateEditPage />);

    const heading = screen.getByRole("heading", { level: 1 });
    expect(heading).toHaveTextContent("DMP Template from Dataverse");

    const versionText = screen.getByText(/version: v1/i);
    expect(versionText).toBeInTheDocument();

    const lastUpdatedText = screen.getByText(/lastUpdated: 01-01-2023/i);
    expect(lastUpdatedText).toBeInTheDocument();

    const viewHistory = screen.getByRole("link", { name: "links.viewHistory" });
    expect(viewHistory).toHaveAttribute("href", "/template/123/history");

    // Find all section cards
    const sectionCards = screen.getAllByTestId("section-edit-card");

    // Find the card that contains 'Data description'
    const sectionCard1 = sectionCards.find((card) => within(card).queryByText("Data Description"));

    expect(sectionCard1).toBeInTheDocument();

    const questionCards = screen.getAllByTestId("question-edit-card");

    const questionCard1 = questionCards.find((card) => within(card).queryByText("Process and Procedures"));
    expect(questionCard1).toBeInTheDocument();
  });

  it("should close dialog when 'Publish template' form submitted", async () => {

    const mockMutationFn = jest.fn().mockResolvedValueOnce({
      data: {
        createTemplateVersion: {
          errors: {
            general: null,
          },
        },
      },
    });

    mockUseMutation.mockImplementation((document) => {
      if (document === CreateTemplateVersionDocument) {
        return [mockMutationFn, { loading: false, error: undefined }] as any;
      }
      return [jest.fn(), { loading: false, error: undefined }] as any;
    });

    render(<TemplateEditPage />);

    // Open publish modal
    const publishTemplateButton = screen.getByRole("button", { name: "button.publishTemplate" });

    // Click to open publish modal
    await act(async () => {
      fireEvent.click(publishTemplateButton);
    });

    // Should show visibility "Organization" as selected, since the template was previously published with that visibility setting
    const privateOption = screen.getByTestId("visPrivate");
    expect(privateOption).toHaveAttribute("data-selected", "true");

    // Fill in change log
    const textarea = screen.getByTestId("changeLog");
    await act(async () => {
      fireEvent.change(textarea, { target: { value: "Some change log" } });
    });

    // To select the "public" radio button:
    const publicRadio = screen.getByDisplayValue("public");

    await act(async () => {
      fireEvent.click(publicRadio);
    });

    // Submit the publish form
    const saveAndPublishButton = screen.getByRole("button", { name: "button.saveAndPublish" });
    await act(async () => {
      fireEvent.click(saveAndPublishButton);
    });

    // Wait for mutation response
    await waitFor(() => {
      //Should have hidden the dialog window again
      const modalElement = screen.queryByTestId("modal");
      expect(modalElement).toBeNull();
    });
  });

  it("should update the visibility text when publish visibility changes", async () => {
    render(<TemplateEditPage />);

    // Simulate the user triggering the publishTemplate button
    const publishTemplateButton = screen.getByRole("button", { name: /button.publishtemplate/i });
    fireEvent.click(publishTemplateButton);
    await waitFor(() => {
      expect(screen.getByTestId("visPublic")).toBeInTheDocument();
    });

    const publicOption = screen.getByTestId("visPublic");
    const privateOption = screen.getByTestId("visPrivate");

    expect(publicOption).toBeInTheDocument();
    expect(privateOption).toBeInTheDocument();

    // Test the public option
    fireEvent.click(publicOption);
    await waitFor(() => {
      const visBullet = screen.getByTestId("visText");
      expect(visBullet).toBeInTheDocument();
      expect(visBullet).toHaveTextContent("bullet.publishingTemplate3");
    });

    // Test the Private Option
    fireEvent.click(privateOption);
    await waitFor(() => {
      const visBullet = screen.getByTestId("visText");
      expect(visBullet).toBeInTheDocument();
      expect(visBullet).toHaveTextContent("bullet.publishingTemplate3Private");
    });
  });

  it("should display draft status when there is no publish date", async () => {
    const mockTemplateDataWithNoPublishDate = {
      __typename: "Template",
      id: 395,
      name: "Test Template",
      description: null,
      errors: {
        __typename: "TemplateErrors",
        general: null,
        name: null,
        ownerId: null
      },
      latestPublishVersion: "",
      latestPublishDate: null,
      created: "2026-01-06 16:02:26",
      sections: [
        {
          __typename: "Section",
          id: 1815,
          name: "Section One",
          bestPractice: false,
          displayOrder: 1,
          isDirty: false,
          questions: [
            {
              __typename: "Question",
              errors: {
                __typename: "QuestionErrors",
                general: null,
              },
              displayOrder: 1,
              guidanceText: "",
              id: 3688,
              questionText: "Text area question123",
              sectionId: 1815,
              templateId: 395
            }
          ]
        }
      ],
      owner: {
        __typename: "Affiliation",
        displayName: "California Digital Library (cdlib.org)",
        id: 1
      },
      latestPublishVisibility: "PUBLIC",
      bestPractice: false,
      isDirty: true
    };

    const stableTemplateQueryReturn = {
      data: { template: mockTemplateDataWithNoPublishDate },
      loading: false,
      error: null,
    };

    mockUseQuery.mockImplementation((document) => {
      if (document === TemplateDocument) {
        return stableTemplateQueryReturn as any;
      }

      return {
        data: null,
        loading: false,
        error: undefined
      };
    });

    render(<TemplateEditPage />);

    expect(screen.getByText("status.draft")).toBeInTheDocument();
  });

  it("should display published status when there is a publish date and isDirty is false", async () => {
    const mockPublishedTemplateWithNoEdits = {
      __typename: "Template",
      id: 395,
      name: "Test Template",
      description: null,
      errors: {
        __typename: "TemplateErrors",
        general: null,
        name: null,
        ownerId: null
      },
      latestPublishVersion: "",
      latestPublishDate: "1767715403000",
      created: "2026-01-06 16:02:26",
      sections: [
        {
          __typename: "Section",
          id: 1815,
          name: "Section One",
          bestPractice: false,
          displayOrder: 1,
          isDirty: false,
          questions: [
            {
              __typename: "Question",
              errors: {
                __typename: "QuestionErrors",
                general: null,
              },
              displayOrder: 1,
              guidanceText: "",
              id: 3688,
              questionText: "Text area question123",
              sectionId: 1815,
              templateId: 395
            }
          ]
        }
      ],
      owner: {
        __typename: "Affiliation",
        displayName: "California Digital Library (cdlib.org)",
        id: 1
      },
      latestPublishVisibility: "PUBLIC",
      bestPractice: false,
      isDirty: false
    };

    const stableTemplateQueryReturn = {
      data: { template: mockPublishedTemplateWithNoEdits },
      loading: false,
      error: null,
    };

    mockUseQuery.mockImplementation((document) => {
      if (document === TemplateDocument) {
        return stableTemplateQueryReturn as any;
      }

      return {
        data: null,
        loading: false,
        error: undefined
      };
    });

    render(<TemplateEditPage />);


    expect(screen.getByText("status.published")).toBeInTheDocument();
  });

  it("should display \"Unpublished changes\" status when there is a publish date and isDirty is true", async () => {
    const mockPublishedTemplateWithNoEdits = {
      __typename: "Template",
      id: 395,
      name: "Test Template",
      description: null,
      errors: {
        __typename: "TemplateErrors",
        general: null,
        name: null,
        ownerId: null
      },
      latestPublishVersion: "",
      latestPublishDate: "1767715403000",
      created: "2026-01-06 16:02:26",
      sections: [
        {
          __typename: "Section",
          id: 1815,
          name: "Section One",
          bestPractice: false,
          displayOrder: 1,
          isDirty: false,
          questions: [
            {
              __typename: "Question",
              errors: {
                __typename: "QuestionErrors",
                general: null,
              },
              displayOrder: 1,
              guidanceText: "",
              id: 3688,
              questionText: "Text area question123",
              sectionId: 1815,
              templateId: 395
            }
          ]
        }
      ],
      owner: {
        __typename: "Affiliation",
        displayName: "California Digital Library (cdlib.org)",
        id: 1
      },
      latestPublishVisibility: "PUBLIC",
      bestPractice: false,
      isDirty: true
    };

    const stableTemplateQueryReturn = {
      data: { template: mockPublishedTemplateWithNoEdits },
      loading: false,
      error: null,
    };

    mockUseQuery.mockImplementation((document) => {
      if (document === TemplateDocument) {
        return stableTemplateQueryReturn as any;
      }

      return {
        data: null,
        loading: false,
        error: undefined
      };
    });
    render(<TemplateEditPage />);

    expect(screen.getByText("status.unpublishedChanges")).toBeInTheDocument();
  });

  it("should display errors.saveTemplate error message if no result when calling saveTemplate", async () => {
    const mockMutationFn = jest.fn().mockResolvedValueOnce({
      data: null
    });

    mockUseMutation.mockImplementation((document) => {
      if (document === CreateTemplateVersionDocument) {
        return [mockMutationFn, { loading: false, error: undefined }] as any;
      }
      return [jest.fn(), { loading: false, error: undefined }] as any;
    });

    await act(async () => {
      render(<TemplateEditPage />);
    });

    // Open publish modal
    const publishTemplateButton = screen.getByRole("button", { name: "button.publishTemplate" });
    await act(async () => {
      fireEvent.click(publishTemplateButton);
    });

    // Fill in change log
    const textarea = screen.getByTestId("changeLog");
    await act(async () => {
      fireEvent.change(textarea, { target: { value: "Some change log" } });
    });

    // To select the "public" radio button:
    const publicRadio = screen.getByDisplayValue("public");

    await act(async () => {
      fireEvent.click(publicRadio);
    });

    // Submit the publish form
    const saveAndPublishButton = screen.getByRole("button", { name: "button.saveAndPublish" });
    await act(async () => {
      fireEvent.click(saveAndPublishButton);
    });

    // Wait for the error to be added to the page
    await waitFor(() => {
      expect(screen.getByText("errors.saveTemplateError")).toBeInTheDocument();
    });
  });

  it("should set correct error when useCreate returns error", async () => {

    const mockMutationFn = jest.fn(() => Promise.reject(new Error("Mutation failed")));

    mockUseMutation.mockImplementation((document) => {
      if (document === CreateTemplateVersionDocument) {
        return [mockMutationFn, { loading: false, error: undefined }] as any;
      }
      return [jest.fn(), { loading: false, error: undefined }] as any;
    });


    render(<TemplateEditPage />);


    // Simulate the user triggering the publishTemplate button
    const publishTemplateButton = screen.getByRole("button", { name: /button.publishtemplate/i });
    fireEvent.click(publishTemplateButton);

    // Locate the textarea using data-testid
    const textarea = screen.getByTestId("changeLog");

    // Simulate user typing into the textarea
    fireEvent.change(textarea, { target: { value: "This is a test comment." } });

    const saveAndPublishButton = screen.getByRole("button", { name: /button.saveandpublish/i });
    fireEvent.click(saveAndPublishButton);

    // Wait for the error to be added to the page
    await waitFor(() => {
      expect(screen.getByText("errors.saveTemplateError")).toBeInTheDocument();
    });
  });

  it("should call useArchiveTemplateMutation when user clicks on the Archive Template button", async () => {
    const mockArchiveMutation = jest.fn().mockResolvedValueOnce({
      data: { archiveTemplate: { errors: null } }
    });

    mockUseMutation.mockImplementation((document) => {
      if (document === ArchiveTemplateDocument) {
        return [
          mockArchiveMutation,
          { loading: false, error: undefined }
        ] as any;
      }

      return [jest.fn(), { loading: false, error: undefined }] as any;
    });

    render(<TemplateEditPage />);

    // Locate the Archive Template button
    const archiveTemplateBtn = screen.getByTestId("archive-template");
    //Click the button
    fireEvent.click(archiveTemplateBtn);

    // Wait for the mutation to be called
    await waitFor(() => {
      expect(mockArchiveMutation).toHaveBeenCalled();
    });

    await waitFor(() => {
      expect(mockUseRouter().push).toHaveBeenCalledWith("/template");
    });
  });

  it("should set errors when handleTitleChange is called and returns a general error", async () => {

    (updateTemplateAction as jest.Mock).mockResolvedValue({
      success: true,
      data: {
        errors: {
          general: "There was an error changing title",
          email: null,
        },
        id: 15,
        name: "Changed title",
        latestPublishVisibility: "ORGANIZATION",
      },
    });

    render(<TemplateEditPage />);

    const editButton = screen.getByRole("button", { name: "links.editTemplateTitle" });

    await act(async () => {
      fireEvent.click(editButton);
    });

    const input = screen.getByPlaceholderText("editTitle");
    fireEvent.change(input, { target: { value: "New template name" } });

    const saveButton = screen.getByTestId("save-button");
    await act(async () => {
      fireEvent.click(saveButton);
    });

    expect(screen.getByText("There was an error changing title")).toBeInTheDocument();
  });

  it("should display correct error when archving template fails", async () => {
    const mockArchiveMutation = jest.fn(() => Promise.reject(new Error("Mutation failed")));

    mockUseMutation.mockImplementation((document) => {
      if (document === ArchiveTemplateDocument) {
        return [
          mockArchiveMutation,
          { loading: false, error: undefined }
        ] as any;
      }

      return [jest.fn(), { loading: false, error: undefined }] as any;
    });

    render(<TemplateEditPage />);

    // Locate the Archive Template button
    const archiveTemplateBtn = screen.getByTestId("archive-template");
    //Click the button
    fireEvent.click(archiveTemplateBtn);

    // Wait until error is displayed
    await waitFor(() => {
      expect(screen.getByText("errors.archiveTemplateError")).toBeInTheDocument();
    });
  });

  it("should display the general error if it is returned from the archiveTemplateMutation", async () => {

    const mockArchiveTemplate = jest.fn().mockResolvedValue(mockArchiveTemplateData);

    mockUseMutation.mockImplementation((document) => {
      if (document === ArchiveTemplateDocument) {
        return [
          mockArchiveTemplate,
          { loading: false, error: undefined }
        ] as any;
      }

      return [jest.fn(), { loading: false, error: undefined }] as any;
    });

    await act(async () => {
      render(<TemplateEditPage />);
    });

    // Locate the Archive Template button
    const archiveTemplateBtn = screen.getByTestId("archive-template");
    //Click the button
    await act(async () => {
      fireEvent.click(archiveTemplateBtn);
    });

    // Wait until error is displayed
    await waitFor(() => {
      expect(screen.getByText("Template could not be archived")).toBeInTheDocument();
    });
  });

  it("should not display error if there are response errors, but no error.general error from calling archiveTemplateMutation", async () => {

    const mockWithNoGeneralError = {
      data: {
        archiveTemplate: {
          id: 15,
          name: "Test template",
          errors: {
            general: null,
            name: "Name not in correct format",
            owner: null,
          },
        },
      },
    };
    const mockArchiveTemplate = jest.fn().mockResolvedValue(mockWithNoGeneralError);

    mockUseMutation.mockImplementation((document) => {
      if (document === ArchiveTemplateDocument) {
        return [
          mockArchiveTemplate,
          { loading: false, error: undefined }
        ] as any;
      }

      return [jest.fn(), { loading: false, error: undefined }] as any;
    });

    render(<TemplateEditPage />);

    // Locate the Archive Template button
    const archiveTemplateBtn = screen.getByTestId("archive-template");
    //Click the button
    fireEvent.click(archiveTemplateBtn);

    // Wait until error is displayed
    await waitFor(() => {
      expect(screen.queryByRole("alert")).not.toBeInTheDocument();
    });
  });

  it("should display Template Title input field when user clicks on Edit Template", async () => {

    render(<TemplateEditPage />);

    const editTemplateButton = screen.getByRole("button", { name: "links.editTemplateTitle" });
    fireEvent.click(editTemplateButton);

    // Check if the input field is displayed
    const inputField = screen.getByPlaceholderText("editTitle");
    expect(inputField).toBeInTheDocument();
  });

  it("should call updateTemplateAction when user enters a new title and clicks save", async () => {

    (updateTemplateAction as jest.Mock).mockResolvedValue({
      success: true,
      data: {
        errors: {
          general: null,
          email: null,
        },
        id: 15,
        name: "New Template Title",
        latestPublishVisibility: "ORGANIZATION",
      },
    });

    await act(async () => {
      render(<TemplateEditPage />);
    });

    // Simulate clicking the "Edit template name" button
    const editTemplateButton = screen.getByRole("button", { name: "links.editTemplateTitle" });
    await act(async () => {
      fireEvent.click(editTemplateButton);
    });

    // Simulate typing a new title into the input field
    const inputField = screen.getByPlaceholderText("editTitle");
    await act(async () => {
      fireEvent.change(inputField, { target: { value: "New Template Title" } });
    });

    // Simulate clicking the "Save" button
    const saveButton = screen.getByTestId("save-button");
    await act(async () => {
      fireEvent.click(saveButton);
    });

    // Wait for the updateTemplateAction to be called
    await waitFor(() => {
      expect(updateTemplateAction).toHaveBeenCalledWith({
        templateId: 15,
        name: "New Template Title", // Ensure the updated title is passed
      });
    });
  });

  it("should log error if updateTemplate is called with no templateId", async () => {
    mockTemplateData.id = null; // Set templateId to null

    (updateTemplateAction as jest.Mock).mockResolvedValue({
      success: true,
      data: {
        error: {
          general: null,
          email: null,
        },
        id: 15,
        name: "New Template Title",
        latestPublishVisibility: "ORGANIZATION",
      },
    });

    await act(async () => {
      render(<TemplateEditPage />);
    });

    // Simulate clicking the "Edit template name" button
    const editTemplateButton = screen.getByRole("button", { name: "links.editTemplateTitle" });
    await act(async () => {
      fireEvent.click(editTemplateButton);
    });

    // Simulate typing a new title into the input field
    const inputField = screen.getByPlaceholderText("editTitle");
    await act(async () => {
      fireEvent.change(inputField, { target: { value: "New Template Title" } });
    });

    // Simulate clicking the "Save" button
    const saveButton = screen.getByTestId("save-button");
    await act(async () => {
      fireEvent.click(saveButton);
    });

    // Wait for the updateTemplateAction to be called
    await waitFor(() => {
      expect(logECS).toHaveBeenCalledWith(
        "error",
        "updateTemplate",
        expect.objectContaining({
          error: "templateId is null",
          url: { path: "/template/unknown" },
        }),
      );
    });
  });

  it("should call updateSectionDisplayOrderAction when a section is moved", async () => {
    const mockTemplateId = 123;
    const mockUseParams = useParams as jest.Mock;

    // Mock the return value of useParams
    mockUseParams.mockReturnValue({ templateId: `${mockTemplateId}` });

    const mockedSections = [
      {
        id: 25,
        name: "Products of the research",
        bestPractice: false,
        displayOrder: 2,
        isDirty: false,
        questions: [
          {
            errors: {
              general: null,
            },
            displayOrder: 1,
            guidanceText:
              '<ul>  <li><a href="http://www.nsf.gov/bfa/dias/policy/dmpdocs/ast.pdf">NSF-AST Advice to PIs on DMPs</a></li>  <li><a href="https://www.nsf.gov/publications/pub_summ.jsp?ods_key=nsf20001&amp;org=NSF">NSF Proposal &amp; Award Policies &amp; Procedures Guide (PAPPG)</a></li>  <li><a href="https://www.nsf.gov/pubs/policydocs/pappg20_1/pappg_2.jsp#IIC2j">NSF plans for data management and sharing of the products of research (PAPPG)</a></li>  <li><a href="https://www.nsf.gov/publications/pub_summ.jsp?ods_key=nsf18041">NSF Frequently Asked Questions (FAQs) for Public Access</a></li>  </ul>',
            id: 104,
            questionText:
              "<p>Describe the types of data and products that will be generated in the research, such as images of astronomical objects, spectra, data tables, time series, theoretical formalisms, computational strategies, software, and curriculum materials.</p>",
            sectionId: 25,
            templateId: 5,
          },
        ],
      },
      {
        id: 26,
        name: "Data format",
        bestPractice: false,
        displayOrder: 3,
        isDirty: false,
        questions: [
          {
            errors: {
              general: null,
            },
            displayOrder: 1,
            guidanceText:
              '<ul>  <li><a href="http://www.nsf.gov/bfa/dias/policy/dmpdocs/ast.pdf">NSF-AST Advice to PIs on DMPs</a></li>  <li><a href="https://www.nsf.gov/publications/pub_summ.jsp?ods_key=nsf20001&amp;org=NSF">NSF Proposal &amp; Award Policies &amp; Procedures Guide (PAPPG)</a></li>  <li><a href="https://www.nsf.gov/pubs/policydocs/pappg20_1/pappg_2.jsp#IIC2j">NSF plans for data management and sharing of the products of research (PAPPG)</a></li>  <li><a href="https://www.nsf.gov/publications/pub_summ.jsp?ods_key=nsf18041">NSF Frequently Asked Questions (FAQs) for Public Access</a></li>  <li><a title="Ten Simple Rules for the Care and Feeding of Scientific Data&nbsp;" href="https://journals.plos.org/ploscompbiol/article?id=10.1371/journal.pcbi.1003542">Ten Simple Rules for the Care and Feeding of Scientific Data </a>&nbsp;(Suggestions on effective methods for sharing astronomical data)</li>  </ul>',
            id: 105,
            questionText:
              '<p>Describe the format in which the data or products are stored (e.g., ASCII, html, FITS, <span style="font-weight: 400;">HD5, Virtual Observatory-compliant</span> tables, XML files, etc.). Include a description of <span style="font-weight: 400;">any</span> metadata that will make the actual data products useful to the general researcher. Where data are stored in unusual or not generally accessible formats, explain how the data may be converted to a more accessible format or otherwise made available to interested parties. In general, solutions and remedies should be provided.</p>',
            sectionId: 26,
            templateId: 5,
          },
        ],
      },
    ];

    // Arrange: mock template with two sections
    const mockTemplateWithSections = {
      ...mockTemplateData,
      sections: mockedSections,
    };

    const stableTemplateQueryReturn = {
      data: { template: mockTemplateWithSections },
      loading: false,
      error: null,
      refetch: jest.fn(),
    };

    const stableSectionQueryReturn = {
      data: {
        section: mockedSections,
      },
      loading: false,
      error: null,
      refetch: jest.fn(),
    };
    mockUseQuery.mockImplementation((document) => {
      if (document === TemplateDocument) {
        return stableTemplateQueryReturn as any;
      }

      if (document === SectionDocument) {
        return stableSectionQueryReturn as any;
      }
      return {
        data: null,
        loading: false,
        error: undefined
      };
    });

    // Mock updateSectionDisplayOrderAction to resolve successfully
    (updateSectionDisplayOrderAction as jest.Mock).mockResolvedValue({
      success: true,
      errors: [],
      data: {},
    });

    await act(async () => {
      render(<TemplateEditPage />);
    });

    // Find the "Move Down" button for the first section
    // SectionEditContainer should render a button for moving down
    const moveDownButtons = screen.getAllByLabelText("buttons.moveUp");
    expect(moveDownButtons.length).toBeGreaterThan(0);

    // Act: Click the first "Move Down" button
    await act(async () => {
      fireEvent.click(moveDownButtons[0]);
    });

    // Assert: updateSectionDisplayOrderAction called with correct args
    await waitFor(() => {
      expect(updateSectionDisplayOrderAction).toHaveBeenCalledWith({
        sectionId: 25,
        newDisplayOrder: 1,
      });
    });
  });

  it("should display error if calling updateSectionDisplayOrderAction returns errors", async () => {
    const mockTemplateId = 123;
    const mockUseParams = useParams as jest.Mock;

    // Mock the return value of useParams
    mockUseParams.mockReturnValue({ templateId: `${mockTemplateId}` });

    const mockedSections = [
      {
        id: 25,
        name: "Products of the research",
        bestPractice: false,
        displayOrder: 2,
        isDirty: false,
        questions: [
          {
            errors: {
              general: null,
            },
            displayOrder: 1,
            guidanceText:
              '<ul>  <li><a href="http://www.nsf.gov/bfa/dias/policy/dmpdocs/ast.pdf">NSF-AST Advice to PIs on DMPs</a></li>  <li><a href="https://www.nsf.gov/publications/pub_summ.jsp?ods_key=nsf20001&amp;org=NSF">NSF Proposal &amp; Award Policies &amp; Procedures Guide (PAPPG)</a></li>  <li><a href="https://www.nsf.gov/pubs/policydocs/pappg20_1/pappg_2.jsp#IIC2j">NSF plans for data management and sharing of the products of research (PAPPG)</a></li>  <li><a href="https://www.nsf.gov/publications/pub_summ.jsp?ods_key=nsf18041">NSF Frequently Asked Questions (FAQs) for Public Access</a></li>  </ul>',
            id: 104,
            questionText:
              "<p>Describe the types of data and products that will be generated in the research, such as images of astronomical objects, spectra, data tables, time series, theoretical formalisms, computational strategies, software, and curriculum materials.</p>",
            sectionId: 25,
            templateId: 5,
          },
        ],
      },
      {
        id: 26,
        name: "Data format",
        bestPractice: false,
        displayOrder: 3,
        isDirty: false,
        questions: [
          {
            errors: {
              general: null,
            },
            displayOrder: 1,
            guidanceText:
              '<ul>  <li><a href="http://www.nsf.gov/bfa/dias/policy/dmpdocs/ast.pdf">NSF-AST Advice to PIs on DMPs</a></li>  <li><a href="https://www.nsf.gov/publications/pub_summ.jsp?ods_key=nsf20001&amp;org=NSF">NSF Proposal &amp; Award Policies &amp; Procedures Guide (PAPPG)</a></li>  <li><a href="https://www.nsf.gov/pubs/policydocs/pappg20_1/pappg_2.jsp#IIC2j">NSF plans for data management and sharing of the products of research (PAPPG)</a></li>  <li><a href="https://www.nsf.gov/publications/pub_summ.jsp?ods_key=nsf18041">NSF Frequently Asked Questions (FAQs) for Public Access</a></li>  <li><a title="Ten Simple Rules for the Care and Feeding of Scientific Data&nbsp;" href="https://journals.plos.org/ploscompbiol/article?id=10.1371/journal.pcbi.1003542">Ten Simple Rules for the Care and Feeding of Scientific Data </a>&nbsp;(Suggestions on effective methods for sharing astronomical data)</li>  </ul>',
            id: 105,
            questionText:
              '<p>Describe the format in which the data or products are stored (e.g., ASCII, html, FITS, <span style="font-weight: 400;">HD5, Virtual Observatory-compliant</span> tables, XML files, etc.). Include a description of <span style="font-weight: 400;">any</span> metadata that will make the actual data products useful to the general researcher. Where data are stored in unusual or not generally accessible formats, explain how the data may be converted to a more accessible format or otherwise made available to interested parties. In general, solutions and remedies should be provided.</p>',
            sectionId: 26,
            templateId: 5,
          },
        ],
      },
    ];

    // Arrange: mock template with two sections
    const mockTemplateWithSections = {
      ...mockTemplateData,
      sections: mockedSections,
    };

    const stableTemplateQueryReturn = {
      data: { template: mockTemplateWithSections },
      loading: false,
      error: null,
      refetch: jest.fn(),
    };

    const stableSectionQueryReturn = {
      data: {
        section: mockedSections,
      },
      loading: false,
      error: null,
      refetch: jest.fn(),
    };
    mockUseQuery.mockImplementation((document) => {
      if (document === TemplateDocument) {
        return stableTemplateQueryReturn as any;
      }

      if (document === SectionDocument) {
        return stableSectionQueryReturn as any;
      }
      return {
        data: null,
        loading: false,
        error: undefined
      };
    });

    // Mock updateSectionDisplayOrderAction to resolve successfully
    (updateSectionDisplayOrderAction as jest.Mock).mockResolvedValue({
      success: false,
      errors: ["There was an error moving the section"],
      data: {},
    });

    await act(async () => {
      render(<TemplateEditPage />);
    });

    // Find the "Move Down" button for the first section
    // SectionEditContainer should render a button for moving down
    const moveDownButtons = screen.getAllByLabelText("buttons.moveUp");
    expect(moveDownButtons.length).toBeGreaterThan(0);

    // Act: Click the first "Move Down" button
    await act(async () => {
      fireEvent.click(moveDownButtons[0]);
    });

    // Assert: updateSectionDisplayOrderAction called with correct args
    await waitFor(() => {
      expect(screen.getByText("There was an error moving the section")).toBeInTheDocument();
    });
  });

  it("should display error if updateSectionDisplayOrderAction returns general error", async () => {
    const mockTemplateId = 123;
    const mockUseParams = useParams as jest.Mock;

    // Mock the return value of useParams
    mockUseParams.mockReturnValue({ templateId: `${mockTemplateId}` });

    const mockedSections = [
      {
        id: 25,
        name: "Products of the research",
        bestPractice: false,
        displayOrder: 2,
        isDirty: false,
        questions: [
          {
            errors: {
              general: null,
            },
            displayOrder: 1,
            guidanceText:
              '<ul>  <li><a href="http://www.nsf.gov/bfa/dias/policy/dmpdocs/ast.pdf">NSF-AST Advice to PIs on DMPs</a></li>  <li><a href="https://www.nsf.gov/publications/pub_summ.jsp?ods_key=nsf20001&amp;org=NSF">NSF Proposal &amp; Award Policies &amp; Procedures Guide (PAPPG)</a></li>  <li><a href="https://www.nsf.gov/pubs/policydocs/pappg20_1/pappg_2.jsp#IIC2j">NSF plans for data management and sharing of the products of research (PAPPG)</a></li>  <li><a href="https://www.nsf.gov/publications/pub_summ.jsp?ods_key=nsf18041">NSF Frequently Asked Questions (FAQs) for Public Access</a></li>  </ul>',
            id: 104,
            questionText:
              "<p>Describe the types of data and products that will be generated in the research, such as images of astronomical objects, spectra, data tables, time series, theoretical formalisms, computational strategies, software, and curriculum materials.</p>",
            sectionId: 25,
            templateId: 5,
          },
        ],
      },
      {
        id: 26,
        name: "Data format",
        bestPractice: false,
        displayOrder: 3,
        isDirty: false,
        questions: [
          {
            errors: {
              general: null,
            },
            displayOrder: 1,
            guidanceText:
              '<ul>  <li><a href="http://www.nsf.gov/bfa/dias/policy/dmpdocs/ast.pdf">NSF-AST Advice to PIs on DMPs</a></li>  <li><a href="https://www.nsf.gov/publications/pub_summ.jsp?ods_key=nsf20001&amp;org=NSF">NSF Proposal &amp; Award Policies &amp; Procedures Guide (PAPPG)</a></li>  <li><a href="https://www.nsf.gov/pubs/policydocs/pappg20_1/pappg_2.jsp#IIC2j">NSF plans for data management and sharing of the products of research (PAPPG)</a></li>  <li><a href="https://www.nsf.gov/publications/pub_summ.jsp?ods_key=nsf18041">NSF Frequently Asked Questions (FAQs) for Public Access</a></li>  <li><a title="Ten Simple Rules for the Care and Feeding of Scientific Data&nbsp;" href="https://journals.plos.org/ploscompbiol/article?id=10.1371/journal.pcbi.1003542">Ten Simple Rules for the Care and Feeding of Scientific Data </a>&nbsp;(Suggestions on effective methods for sharing astronomical data)</li>  </ul>',
            id: 105,
            questionText:
              '<p>Describe the format in which the data or products are stored (e.g., ASCII, html, FITS, <span style="font-weight: 400;">HD5, Virtual Observatory-compliant</span> tables, XML files, etc.). Include a description of <span style="font-weight: 400;">any</span> metadata that will make the actual data products useful to the general researcher. Where data are stored in unusual or not generally accessible formats, explain how the data may be converted to a more accessible format or otherwise made available to interested parties. In general, solutions and remedies should be provided.</p>',
            sectionId: 26,
            templateId: 5,
          },
        ],
      },
    ];

    // Arrange: mock template with two sections
    const mockTemplateWithSections = {
      ...mockTemplateData,
      sections: mockedSections,
    };

    const stableTemplateQueryReturn = {
      data: { template: mockTemplateWithSections },
      loading: false,
      error: null,
      refetch: jest.fn(),
    };

    const stableSectionQueryReturn = {
      data: {
        section: mockedSections,
      },
      loading: false,
      error: null,
      refetch: jest.fn(),
    };
    mockUseQuery.mockImplementation((document) => {
      if (document === TemplateDocument) {
        return stableTemplateQueryReturn as any;
      }

      if (document === SectionDocument) {
        return stableSectionQueryReturn as any;
      }
      return {
        data: null,
        loading: false,
        error: undefined
      };
    });
    // Mock updateSectionDisplayOrderAction to resolve successfully
    (updateSectionDisplayOrderAction as jest.Mock).mockResolvedValue({
      success: true,
      errors: [],
      data: {
        errors: {
          general: "There was an error moving the section",
        },
      },
    });

    await act(async () => {
      render(<TemplateEditPage />);
    });

    // Find the "Move Down" button for the first section
    // SectionEditContainer should render a button for moving down
    const moveDownButtons = screen.getAllByLabelText("buttons.moveUp");
    expect(moveDownButtons.length).toBeGreaterThan(0);

    // Act: Click the first "Move Down" button
    await act(async () => {
      fireEvent.click(moveDownButtons[0]);
    });

    // Assert: updateSectionDisplayOrderAction called with correct args
    await waitFor(() => {
      expect(screen.getByText("There was an error moving the section")).toBeInTheDocument();
    });
  });

  it("should not call server action when display order would be less than 1", async () => {
    const mockTemplateId = 123;
    const mockUseParams = useParams as jest.Mock;

    // Mock the return value of useParams
    mockUseParams.mockReturnValue({ templateId: `${mockTemplateId}` });

    const mockedSections = [
      {
        id: 67,
        name: "Data Description",
        bestPractice: false,
        displayOrder: 1,
        isDirty: false,
        questions: [
          {
            errors: {
              general: null,
            },
            displayOrder: 1,
            guidanceText:
              '<ul>  <li><a href="http://www.nsf.gov/bfa/dias/policy/dmpdocs/ast.pdf">NSF-AST Advice to PIs on DMPs</a></li>  <li><a href="https://www.nsf.gov/publications/pub_summ.jsp?ods_key=nsf20001&amp;org=NSF">NSF Proposal &amp; Award Policies &amp; Procedures Guide (PAPPG)</a></li>  <li><a href="https://www.nsf.gov/pubs/policydocs/pappg20_1/pappg_2.jsp#IIC2j">NSF plans for data management and sharing of the products of research (PAPPG)</a></li>  <li><a href="https://www.nsf.gov/publications/pub_summ.jsp?ods_key=nsf18041">NSF Frequently Asked Questions (FAQs) for Public Access</a></li>  </ul>',
            id: 104,
            questionText:
              "<p>Describe the types of data and products that will be generated in the research, such as images of astronomical objects, spectra, data tables, time series, theoretical formalisms, computational strategies, software, and curriculum materials.</p>",
            sectionId: 25,
            templateId: 5,
          },
        ],
      },
      {
        id: 68,
        name: "Data format",
        bestPractice: false,
        displayOrder: 1,
        isDirty: false,
        questions: [
          {
            errors: {
              general: null,
            },
            displayOrder: 1,
            guidanceText:
              '<ul>  <li><a href="http://www.nsf.gov/bfa/dias/policy/dmpdocs/ast.pdf">NSF-AST Advice to PIs on DMPs</a></li>  <li><a href="https://www.nsf.gov/publications/pub_summ.jsp?ods_key=nsf20001&amp;org=NSF">NSF Proposal &amp; Award Policies &amp; Procedures Guide (PAPPG)</a></li>  <li><a href="https://www.nsf.gov/pubs/policydocs/pappg20_1/pappg_2.jsp#IIC2j">NSF plans for data management and sharing of the products of research (PAPPG)</a></li>  <li><a href="https://www.nsf.gov/publications/pub_summ.jsp?ods_key=nsf18041">NSF Frequently Asked Questions (FAQs) for Public Access</a></li>  <li><a title="Ten Simple Rules for the Care and Feeding of Scientific Data&nbsp;" href="https://journals.plos.org/ploscompbiol/article?id=10.1371/journal.pcbi.1003542">Ten Simple Rules for the Care and Feeding of Scientific Data </a>&nbsp;(Suggestions on effective methods for sharing astronomical data)</li>  </ul>',
            id: 105,
            questionText:
              '<p>Describe the format in which the data or products are stored (e.g., ASCII, html, FITS, <span style="font-weight: 400;">HD5, Virtual Observatory-compliant</span> tables, XML files, etc.). Include a description of <span style="font-weight: 400;">any</span> metadata that will make the actual data products useful to the general researcher. Where data are stored in unusual or not generally accessible formats, explain how the data may be converted to a more accessible format or otherwise made available to interested parties. In general, solutions and remedies should be provided.</p>',
            sectionId: 26,
            templateId: 5,
          },
        ],
      },
    ];

    // Arrange: mock template with two sections
    const mockTemplateWithSections = {
      ...mockTemplateData,
      sections: mockedSections,
    };

    const stableTemplateQueryReturn = {
      data: { template: mockTemplateWithSections },
      loading: false,
      error: null,
      refetch: jest.fn(),
    };

    const stableSectionQueryReturn = {
      data: {
        section: mockedSections,
      },
      loading: false,
      error: null,
      refetch: jest.fn(),
    };
    mockUseQuery.mockImplementation((document) => {
      if (document === TemplateDocument) {
        return stableTemplateQueryReturn as any;
      }

      if (document === SectionDocument) {
        return stableSectionQueryReturn as any;
      }
      return {
        data: null,
        loading: false,
        error: undefined
      };
    });

    // Mock updateSectionDisplayOrderAction to resolve successfully
    (updateSectionDisplayOrderAction as jest.Mock).mockResolvedValue({
      success: true,
      errors: [],
      data: {},
    });

    render(<TemplateEditPage />);

    // Find all section cards
    const sectionCards = screen.getAllByTestId("section-edit-card");
    // Find the card that contains 'Data Description'
    const sectionCard1 = sectionCards.find((card) => within(card).queryByText(/labels.section 1/));
    expect(sectionCard1).toBeTruthy(); // Ensure it's found

    // Get the move up button inside that card
    const moveUpButton = within(sectionCard1!).getByRole("button", {
      name: "buttons.moveUp",
    });

    // Click the "Move Up" button
    await act(async () => {
      fireEvent.click(moveUpButton);
    });

    expect(updateSectionDisplayOrderAction).not.toHaveBeenCalled();

    expect(mockToast.add).toHaveBeenCalledWith("errors.displayOrderAlreadyAtTop", { type: "error" });
  });

  it("should optimistically update section order when a section is moved (updateLocalSectionOrder)", async () => {
    const mockTemplateId = 123;
    const mockUseParams = useParams as jest.Mock;

    const sectionA = {
      id: 1,
      name: "Section A",
      displayOrder: 1,
      questions: [],
    };
    const sectionB = {
      id: 2,
      name: "Section B",
      displayOrder: 2,
      questions: [],
    };

    const mockTemplateWithSections = {
      ...mockTemplateData,
      sections: [sectionA, sectionB],
    };

    mockUseParams.mockReturnValue({ templateId: `${mockTemplateId}` });

    const stableTemplateQueryReturn = {
      data: { template: mockTemplateWithSections },
      loading: false,
      error: null,
      refetch: jest.fn(),
    };

    const stableSectionQueryReturnA = {
      data: { section: sectionA },
      loading: false,
      error: null,
      refetch: jest.fn(),
    };

    const stableSectionQueryReturnB = {
      data: { section: sectionB },
      loading: false,
      error: null,
      refetch: jest.fn(),
    };

    mockUseQuery.mockImplementation((document, options) => {
      // Type guard to ensure options is an object and not a symbol
      const variables = options && typeof options === 'object' && 'variables' in options
        ? options.variables
        : undefined;

      if (document === TemplateDocument) {
        return stableTemplateQueryReturn as any;
      }
      if (document === SectionDocument) {
        if (variables?.sectionId === 1) {
          return stableSectionQueryReturnA as any;
        }
        if (variables?.sectionId === 2) {
          return stableSectionQueryReturnB as any;
        }
      }
      return {
        data: null,
        loading: false,
        error: undefined
      };
    });

    (updateSectionDisplayOrderAction as jest.Mock).mockResolvedValue({
      success: true,
      errors: [],
      data: {},
    });

    await act(async () => {
      render(<TemplateEditPage />);
    });

    // Find all section headings in order
    const getSectionHeadings = () => screen.getAllByRole("heading", { level: 2 }).map((h) => h.textContent);

    // Check that both "Section A" and "Section B" are present in the headings
    expect(getSectionHeadings()).toEqual(
      expect.arrayContaining(["labels.section 1 Section A", "labels.section 2 Section B", "heading.archiveTemplate"]),
    );
    // Find the "Move Down" button for Section A and click it
    const moveDownButtons = screen.getAllByLabelText("buttons.moveDown");
    await act(async () => {
      fireEvent.click(moveDownButtons[0]);
    });

    // After click, order should be: Section B, Section A (optimistic update)
    expect(getSectionHeadings()).toEqual(
      expect.arrayContaining(["labels.section 1 Section B", "labels.section 2 Section A", "heading.archiveTemplate"]),
    );
  });

  it("should set pageErrors when createTemplateVersionMutation returns a general error", async () => {

    const mockMutationFn = jest.fn().mockResolvedValueOnce({
      data: {
        createTemplateVersion: {
          errors: { general: "General publish error" },
        },
      },
    });
    mockUseMutation.mockImplementation((document) => {
      if (document === CreateTemplateVersionDocument) {
        return [mockMutationFn, { loading: false, error: undefined }] as any;
      }
      return [jest.fn(), { loading: false, error: undefined }] as any;
    });

    render(<TemplateEditPage />);

    // Open publish modal
    const publishTemplateButton = screen.getByRole("button", { name: "button.publishTemplate" });
    await act(async () => {
      fireEvent.click(publishTemplateButton);
    });

    // Fill in change log
    const textarea = screen.getByTestId("changeLog");
    await act(async () => {
      fireEvent.change(textarea, { target: { value: "Some change log" } });
    });

    // To select the "public" radio button:
    const publicRadio = screen.getByDisplayValue("public");

    await act(async () => {
      fireEvent.click(publicRadio);
    });

    // Submit the publish form
    const saveAndPublishButton = screen.getByRole("button", { name: "button.saveAndPublish" });
    await act(async () => {
      fireEvent.click(saveAndPublishButton);
    });

    // Wait for the general error to appear in the page error area
    expect(screen.getByText("General publish error")).toBeInTheDocument();
  });

  it("should set no errors if createTemplateVersionMutation does not return errors.general", async () => {

    const mockMutationFn = jest.fn().mockResolvedValueOnce({
      data: {
        createTemplateVersion: {
          errors: { general: null },
        },
      },
    });
    mockUseMutation.mockImplementation((document) => {
      if (document === CreateTemplateVersionDocument) {
        return [mockMutationFn, { loading: false, error: undefined }] as any;
      }
      return [jest.fn(), { loading: false, error: undefined }] as any;
    });

    await act(async () => {
      render(<TemplateEditPage />);
    });

    // Open publish modal
    const publishTemplateButton = screen.getByRole("button", { name: "button.publishTemplate" });
    await act(async () => {
      fireEvent.click(publishTemplateButton);
    });

    // Fill in change log
    const textarea = screen.getByTestId("changeLog");
    await act(async () => {
      fireEvent.change(textarea, { target: { value: "Some change log" } });
    });

    // To select the "public" radio button:
    const publicRadio = screen.getByDisplayValue("public");

    await act(async () => {
      fireEvent.click(publicRadio);
    });

    // Submit the publish form
    const saveAndPublishButton = screen.getByRole("button", { name: "button.saveAndPublish" });
    await act(async () => {
      fireEvent.click(saveAndPublishButton);
    });

    expect(screen.queryByText("General publish error")).not.toBeInTheDocument();
  });

  it("should pass accessibility tests", async () => {

    let container: HTMLElement;
    await act(async () => {
      const renderResult = render(<TemplateEditPage />);
      container = renderResult.container;
      const results = await axe(container);
      expect(results).toHaveNoViolations();
    });
  });
});
