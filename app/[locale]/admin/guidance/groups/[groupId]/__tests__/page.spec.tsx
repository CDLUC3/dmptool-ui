import React from "react";
import {
  fireEvent,
  render,
  screen,
  waitFor,
  waitForElementToBeRemoved,
  within,
  act
} from "@testing-library/react";
import "@testing-library/jest-dom";
import { MockedProvider } from "@apollo/client/testing/react";
import { useFormatter, useTranslations } from "next-intl";
import { useParams, useRouter } from 'next/navigation';
import logECS from '@/utils/clientLogger';
import {
  MeDocument,
  TagsDocument,
  GuidanceGroupDocument,
  GuidanceByGroupDocument,
} from "@/generated/graphql";

import {
  addGuidanceTextAction,
  publishGuidanceGroupAction,
  unPublishGuidanceGroupAction,
  updateGuidanceAction
} from '../actions';

import { axe, toHaveNoViolations } from "jest-axe";
import { useToast } from '@/context/ToastContext';
import { mockScrollIntoView } from '@/__mocks__/common';
import mockMeData from "../../../__mocks__/mockMeData.json";
import mockTagsData from "../../../__mocks__/mockTagsData.json";
import mockGuidanceByGroupData from "../__mocks__/mockGuidanceByGroupData.json";
import mockGuidanceGroupData from "../__mocks__/mockGuidanceGroupData.json";
import GuidanceGroupIndexPage from "../page";

// Mock TinyMCEEditor to simplify content updates in tests
jest.mock('@/components/TinyMCEEditor', () => {
  const TinyMCEEditorMock = ({ content, setContent, id }: { content: string; setContent: (v: string) => void; id: string }) => (
    <textarea
      data-testid={`editor-${id}`}
      aria-label={`editor-${id}`}
      value={content}
      onChange={(e) => setContent(e.target.value)}
    />
  );
  TinyMCEEditorMock.displayName = 'TinyMCEEditorMock';
  return TinyMCEEditorMock;
});

jest.mock('../actions/index', () => ({
  addGuidanceTextAction: jest.fn(),
  publishGuidanceGroupAction: jest.fn(),
  unPublishGuidanceGroupAction: jest.fn(),
  updateGuidanceAction: jest.fn(),
}));

// Mock next-intl hooks
jest.mock("next-intl", () => ({
  useFormatter: jest.fn(),
  useTranslations: jest.fn(),
}));

jest.mock('next/navigation', () => ({
  useRouter: jest.fn(),
  useParams: jest.fn()
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
  {
    request: {
      query: TagsDocument,
    },
    result: {
      data: mockTagsData,
      loading: false,
    },
  },
  // GuidanceGroup query is executed with fetchPolicy 'cache-and-network', so we need two mocks
  {
    request: {
      query: GuidanceGroupDocument,
      variables: {
        guidanceGroupId: 2397,
      }
    },
    result: {
      data: mockGuidanceGroupData
    },
  },
  {
    request: {
      query: GuidanceGroupDocument,
      variables: {
        guidanceGroupId: 2397,
      }
    },
    result: {
      data: mockGuidanceGroupData
    },
  },
  // GuidanceByGroup also uses 'cache-and-network', supply two mocks
  {
    request: {
      query: GuidanceByGroupDocument,
      variables: {
        guidanceGroupId: 2397,
      }
    },
    result: {
      data: mockGuidanceByGroupData,
      loading: false,
    },
  },
  {
    request: {
      query: GuidanceByGroupDocument,
      variables: {
        guidanceGroupId: 2397,
      }
    },
    result: {
      data: mockGuidanceByGroupData,
      loading: false,
    },
  }
]

// Build a variant with active: false on the latest version
const guidanceGroupInactive = JSON.parse(JSON.stringify(mockGuidanceGroupData));
guidanceGroupInactive.guidanceGroup.versionedGuidanceGroup[0].active = false;

// Build a variant that has a versioned group with active: false so status = DRAFT
const guidanceGroupForPublish = {
  guidanceGroup: {
    ...mockGuidanceGroupData.guidanceGroup,
    id: 2398, // match what the test expects
    latestPublishedDate: "2025-12-01", // has been published before
    isDirty: true, // has changes since last publish
    versionedGuidanceGroup: [
      {
        __typename: "VersionedGuidanceGroup",
        active: false, // inactive = unpublished state, so Publish btn is available
      }
    ]
  }
};

// Provide two mocks for cache-and-network
const inactiveGroupMocks = [
  {
    request: {
      query: GuidanceGroupDocument,
      variables: { guidanceGroupId: 2397 },
    },
    result: { data: guidanceGroupForPublish },
  },
  {
    request: {
      query: GuidanceGroupDocument,
      variables: { guidanceGroupId: 2397 },
    },
    result: { data: guidanceGroupForPublish },
  },
  {
    request: { query: MeDocument },
    result: { data: mockMeData },
  },
  {
    request: { query: TagsDocument },
    result: { data: mockTagsData, loading: false },
  },
  {
    request: {
      query: GuidanceByGroupDocument,
      variables: { guidanceGroupId: 2397 },
    },
    result: { data: mockGuidanceByGroupData, loading: false },
  },
  {
    request: {
      query: GuidanceByGroupDocument,
      variables: { guidanceGroupId: 2397 },
    },
    result: { data: mockGuidanceByGroupData, loading: false },
  }
];


describe("GuidanceGroupIndexPage", () => {
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

  it("should initially render loading spinner", async () => {
    render(
      <MockedProvider mocks={mocks}>
        <GuidanceGroupIndexPage />
      </MockedProvider>,
    );

    await waitFor(() => {
      expect(screen.getByText("Global.messaging.loading")).toBeInTheDocument();
    });
  });


  it("should render guidance text fields", async () => {
    render(
      <MockedProvider mocks={mocks}>
        <GuidanceGroupIndexPage />
      </MockedProvider>,
    );

    // Wait for loading to be gone (tagsLoading and guidanceLoading both false)
    await waitForElementToBeRemoved(() => screen.getByText("Global.messaging.loading"));

    await waitFor(() => {
      // Check for all tags
      expect(screen.getByRole("heading", { name: "Storage & security" })).toBeInTheDocument();
      expect(screen.getByRole("heading", { name: "Preservation" })).toBeInTheDocument();
      expect(screen.getByRole("heading", { name: "Data collection" })).toBeInTheDocument();
      expect(screen.getByRole("heading", { name: "Data format" })).toBeInTheDocument();
      expect(screen.getByRole("heading", { name: "Roles & responsibilities" })).toBeInTheDocument();
      expect(screen.getByRole("heading", { name: "Ethics & privacy" })).toBeInTheDocument();
      expect(screen.getByRole("heading", { name: "Intellectual property rights" })).toBeInTheDocument();
      expect(screen.getByRole("heading", { name: "Related policies" })).toBeInTheDocument();
      expect(screen.getByRole("heading", { name: "Budget" })).toBeInTheDocument();
      expect(screen.getByRole("heading", { name: "Data repository" })).toBeInTheDocument();
      expect(screen.getByRole("heading", { name: "Data sharing" })).toBeInTheDocument();
      expect(screen.getByRole("heading", { name: "Metadata & documentation" })).toBeInTheDocument();
      expect(screen.getByRole("heading", { name: "Data volume" })).toBeInTheDocument();
      expect(screen.getByRole("heading", { name: "Data description" })).toBeInTheDocument();

      //Check for textArea 
      // Check for 14 info icon buttons
      expect(screen.getAllByRole("button", { name: "Click for more info" })).toHaveLength(14);

      // Check for sidebar
      const sidebar = screen.getByTestId("sidebar-panel");
      const inSidebar = within(sidebar);
      const publishBtn = inSidebar.getByRole("button", { name: "Global.buttons.publish" });
      expect(publishBtn).toBeInTheDocument();
      const publicationStatus = inSidebar.getByText("Guidance.status.publicationStatus");
      expect(publicationStatus).toBeInTheDocument();
      const status = inSidebar.getByText("Guidance.status.published");
      expect(status).toBeInTheDocument();
      const lastPublished = inSidebar.getByText("Guidance.status.lastPublished");
      expect(lastPublished).toBeInTheDocument();
      const lastPublishedDate = inSidebar.getByText("12-1-2025");
      expect(lastPublishedDate).toBeInTheDocument();
    });
  });

  it('should update existing guidance text locally when editor changes', async () => {
    render(
      <MockedProvider mocks={mocks}>
        <GuidanceGroupIndexPage />
      </MockedProvider>,
    );

    await waitForElementToBeRemoved(() => screen.getByText('Global.messaging.loading'));

    // Editor id pattern: content-<tagId>; we use tag id 1 which has existing guidance
    const editor = screen.getByTestId('editor-content-1');
    expect(editor).toHaveValue('<p>This is the guidance for storage &amp; security</p>');

    fireEvent.change(editor, { target: { value: 'UPDATED TEXT FOR TAG 1' } });

    // Value should reflect updated local state
    expect(editor).toHaveValue('UPDATED TEXT FOR TAG 1');

    // No server action called yet (updateGuidanceAction invoked only on save)
    expect(updateGuidanceAction).not.toHaveBeenCalled();
    expect(addGuidanceTextAction).not.toHaveBeenCalled();
  });

  it('should create temporary guidance for tag without guidance and calls addGuidanceTextAction on save', async () => {
    (addGuidanceTextAction as jest.Mock).mockResolvedValue({
      success: true,
      data: { id: 999, errors: null },
      redirect: undefined,
    });

    render(
      <MockedProvider mocks={mocks}>
        <GuidanceGroupIndexPage />
      </MockedProvider>,
    );

    await waitForElementToBeRemoved(() => screen.getByText('Global.messaging.loading'));

    // Tag id 14 (Data description) has no guidance in mockGuidanceByGroupData
    const editor = screen.getByTestId('editor-content-14');
    expect(editor).toHaveValue(''); // starts empty

    fireEvent.change(editor, { target: { value: 'New guidance for Data description' } });
    expect(editor).toHaveValue('New guidance for Data description');

    // Find save buttons; click the one corresponding to tag 14.
    // We locate heading first then within its card look for button
    const guidanceCard = editor.closest('div')?.parentElement; // textarea wrapper -> its parent is the card section
    const saveBtn = within(guidanceCard as HTMLElement).getByRole('button', { name: 'Global.buttons.save' });
    fireEvent.click(saveBtn);

    await waitFor(() => {
      expect(addGuidanceTextAction).toHaveBeenCalledTimes(1);
      expect(addGuidanceTextAction).toHaveBeenCalledWith({
        guidanceGroupId: 2397,
        guidanceText: 'New guidance for Data description',
        tagId: 14
      });
    });
  });

  it('should preserve entered content for other tags when a new guidance is saved for a tag', async () => {
    (addGuidanceTextAction as jest.Mock).mockResolvedValue({
      success: true,
      data: { id: 999, errors: null },
      redirect: undefined,
    });

    render(
      <MockedProvider mocks={mocks}>
        <GuidanceGroupIndexPage />
      </MockedProvider>,
    );

    await waitForElementToBeRemoved(() => screen.getByText('Global.messaging.loading'));

    // Tag id 14 (Data description) has no guidance in mockGuidanceByGroupData
    const editor = screen.getByTestId('editor-content-14');
    expect(editor).toHaveValue(''); // starts empty

    fireEvent.change(editor, { target: { value: 'New guidance for Data description' } });
    expect(editor).toHaveValue('New guidance for Data description');

    // Enter content into a different tag to verify it's preserved
    const editorTag1 = screen.getByTestId('editor-content-1');
    fireEvent.change(editorTag1, { target: { value: 'Updated guidance for Tag 1' } });
    expect(editorTag1).toHaveValue('Updated guidance for Tag 1');

    // Find save buttons; click the one corresponding to tag 14.
    // We locate heading first then within its card look for button
    const guidanceCard = editor.closest('div')?.parentElement; // textarea wrapper -> its parent is the card section
    const saveBtn = within(guidanceCard as HTMLElement).getByRole('button', { name: 'Global.buttons.save' });
    fireEvent.click(saveBtn);

    await waitFor(() => {
      expect(addGuidanceTextAction).toHaveBeenCalledTimes(1);
      expect(screen.getByText("New guidance for Data description")).toBeInTheDocument();
      expect(screen.getByText("Updated guidance for Tag 1")).toBeInTheDocument();
    });
  });

  it('should redirect if addGuidanceTextAction response includes a redirect', async () => {
    (addGuidanceTextAction as jest.Mock).mockResolvedValue({
      success: true,
      data: { id: 999, errors: null },
      redirect: "/en-US/admin/guidance/groups/2397/some-redirect-page",
    });

    render(
      <MockedProvider mocks={mocks}>
        <GuidanceGroupIndexPage />
      </MockedProvider>,
    );

    await waitForElementToBeRemoved(() => screen.getByText('Global.messaging.loading'));

    // Tag id 14 (Data description) has no guidance in mockGuidanceByGroupData
    const editor = screen.getByTestId('editor-content-14');
    expect(editor).toHaveValue(''); // starts empty

    fireEvent.change(editor, { target: { value: 'New guidance for Data description' } });
    expect(editor).toHaveValue('New guidance for Data description');

    // Find save buttons; click the one corresponding to tag 14.
    // We locate heading first then within its card look for button
    const guidanceCard = editor.closest('div')?.parentElement; // textarea wrapper -> its parent is the card section
    const saveBtn = within(guidanceCard as HTMLElement).getByRole('button', { name: 'Global.buttons.save' });
    fireEvent.click(saveBtn);

    await waitFor(() => {
      expect(mockRouter.push).toHaveBeenCalledWith('/en-US/admin/guidance/groups/2397/some-redirect-page')
    });
  });

  it('should display error if addGuidanceTextAction returns field-level errors', async () => {
    (addGuidanceTextAction as jest.Mock).mockResolvedValue({
      success: true,
      data: {
        id: 999,
        errors: {
          general: "There was a general error"
        },
      },
    });

    render(
      <MockedProvider mocks={mocks}>
        <GuidanceGroupIndexPage />
      </MockedProvider>,
    );

    await waitForElementToBeRemoved(() => screen.getByText('Global.messaging.loading'));

    // Tag id 14 (Data description) has no guidance in mockGuidanceByGroupData
    const editor = screen.getByTestId('editor-content-14');
    expect(editor).toHaveValue(''); // starts empty

    fireEvent.change(editor, { target: { value: 'New guidance for Data description' } });
    expect(editor).toHaveValue('New guidance for Data description');

    // Find save buttons; click the one corresponding to tag 14.
    // We locate heading first then within its card look for button
    const guidanceCard = editor.closest('div')?.parentElement; // textarea wrapper -> its parent is the card section
    const saveBtn = within(guidanceCard as HTMLElement).getByRole('button', { name: 'Global.buttons.save' });
    fireEvent.click(saveBtn);

    await waitFor(() => {
      expect(screen.getByText('There was a general error')).toBeInTheDocument();
      //Check that error logged
      expect(logECS).toHaveBeenCalledWith(
        'error',
        'adding Guidance text',
        expect.objectContaining({
          errors: expect.anything(),
          url: { path: '/en-US/admin/guidance/groups/2397' },
        })
      )
    });
  });

  it('should update existing guidance via updateGuidanceAction and shows success toast', async () => {
    (updateGuidanceAction as jest.Mock).mockResolvedValue({
      success: true,
      data: { id: 1, errors: null },
      redirect: undefined,
    });

    render(
      <MockedProvider mocks={mocks}>
        <GuidanceGroupIndexPage />
      </MockedProvider>,
    );

    await waitForElementToBeRemoved(() => screen.getByText('Global.messaging.loading'));

    // Tag id 1 has existing guidance in mockGuidanceByGroupData
    const editor = screen.getByTestId('editor-content-1');
    fireEvent.change(editor, { target: { value: 'Updated text for Storage & security' } });

    // Click Save within the corresponding card
    const guidanceCard = editor.closest('div')?.parentElement; // textarea wrapper -> card section
    const saveBtn = within(guidanceCard as HTMLElement).getByRole('button', { name: 'Global.buttons.save' });
    fireEvent.click(saveBtn);

    await waitFor(() => {
      expect(updateGuidanceAction).toHaveBeenCalledTimes(1);
      expect(updateGuidanceAction).toHaveBeenCalledWith({
        guidanceId: 976,
        guidanceText: 'Updated text for Storage & security',
        tagId: 1
      });

      // Success toast
      expect(mockToast.add).toHaveBeenCalledWith('Guidance.messages.success.guidanceTextUpdated', { type: 'success' });
    });
  });

  it('should redirect if response to updateGuidanceAction includes a redirect', async () => {
    (updateGuidanceAction as jest.Mock).mockResolvedValue({
      success: true,
      data: { id: 1, errors: null },
      redirect: "/en-US/admin/guidance/groups/2397/some-redirect-page",
    });

    render(
      <MockedProvider mocks={mocks}>
        <GuidanceGroupIndexPage />
      </MockedProvider>,
    );

    await waitForElementToBeRemoved(() => screen.getByText('Global.messaging.loading'));

    // Tag id 1 has existing guidance in mockGuidanceByGroupData
    const editor = screen.getByTestId('editor-content-1');
    fireEvent.change(editor, { target: { value: 'Updated text for Storage & security' } });

    // Click Save within the corresponding card
    const guidanceCard = editor.closest('div')?.parentElement; // textarea wrapper -> card section
    const saveBtn = within(guidanceCard as HTMLElement).getByRole('button', { name: 'Global.buttons.save' });
    fireEvent.click(saveBtn);


    await waitFor(() => {
      expect(mockRouter.push).toHaveBeenCalledWith('/en-US/admin/guidance/groups/2397/some-redirect-page')
    });
  });

  it('should display error message whenupdateGuidanceAction returns field-level', async () => {
    (updateGuidanceAction as jest.Mock).mockResolvedValue({
      success: true,
      data: {
        id: 1,
        errors: {
          general: "There was a general error"
        }
      },
    });

    render(
      <MockedProvider mocks={mocks}>
        <GuidanceGroupIndexPage />
      </MockedProvider>,
    );

    await waitForElementToBeRemoved(() => screen.getByText('Global.messaging.loading'));

    // Tag id 1 has existing guidance in mockGuidanceByGroupData
    const editor = screen.getByTestId('editor-content-1');
    fireEvent.change(editor, { target: { value: 'Updated text for Storage & security' } });

    // Click Save within the corresponding card
    const guidanceCard = editor.closest('div')?.parentElement; // textarea wrapper -> card section
    const saveBtn = within(guidanceCard as HTMLElement).getByRole('button', { name: 'Global.buttons.save' });
    fireEvent.click(saveBtn);

    await waitFor(() => {
      expect(screen.getByText('There was a general error')).toBeInTheDocument();
      //Check that error logged
      expect(logECS).toHaveBeenCalledWith(
        'error',
        'updating Guidance text',
        expect.objectContaining({
          errors: expect.anything(),
          url: { path: '/en-US/admin/guidance/groups/2397' },
        })
      )
    });
  });

  it('should show inline errors and no toast when updateGuidanceAction returns GraphQL errors', async () => {
    (updateGuidanceAction as jest.Mock).mockResolvedValue({
      success: true,
      data: {
        id: 1,
        errors: {
          general: 'Something went wrong',
          guidanceGroupId: null,
          guidanceText: null,
          tagId: null,
        },
      },
      redirect: undefined,
    });

    render(
      <MockedProvider mocks={mocks}>
        <GuidanceGroupIndexPage />
      </MockedProvider>,
    );

    await waitForElementToBeRemoved(() => screen.getByText('Global.messaging.loading'));

    const editor = screen.getByTestId('editor-content-1');
    fireEvent.change(editor, { target: { value: 'Attempt update with server error' } });

    const guidanceCard = editor.closest('div')?.parentElement;
    const saveBtn = within(guidanceCard as HTMLElement).getByRole('button', { name: 'Global.buttons.save' });
    fireEvent.click(saveBtn);

    await waitFor(() => {
      expect(updateGuidanceAction).toHaveBeenCalledTimes(1);
      expect(mockToast.add).not.toHaveBeenCalled();
      // Inline error rendered
      expect(screen.getByText('Something went wrong')).toBeInTheDocument();
    });
  });

  it('should autosave guidance text after inactivity and show save status', async () => {
    (updateGuidanceAction as jest.Mock).mockResolvedValue({
      success: true,
      data: { id: 976, errors: null },
      redirect: undefined,
    });

    render(
      <MockedProvider mocks={mocks}>
        <GuidanceGroupIndexPage />
      </MockedProvider>,
    );

    await waitForElementToBeRemoved(() => screen.getByText('Global.messaging.loading'));

    jest.useFakeTimers();
    try {
      const editor = screen.getByTestId('editor-content-1');
      fireEvent.change(editor, { target: { value: 'Autosaved text for Storage & security' } });

      expect(screen.getByTestId('last-saved-1')).toHaveTextContent('Guidance.messages.unsavedChanges');
      expect(updateGuidanceAction).not.toHaveBeenCalled();

      await act(async () => {
        jest.advanceTimersByTime(3000);
      });
    } finally {
      jest.useRealTimers();
    }

    await waitFor(() => {
      expect(updateGuidanceAction).toHaveBeenCalledWith({
        guidanceId: 976,
        guidanceText: 'Autosaved text for Storage & security',
        tagId: 1
      });
      expect(screen.getByTestId('last-saved-1')).toHaveTextContent('Guidance.messages.savedJustNow');
    });

    // Autosave doesn't show a toast, only the manual Save button does
    expect(mockToast.add).not.toHaveBeenCalled();
  });

  it('should change "Saved just now" to minutes ago as time passes', async () => {
    (updateGuidanceAction as jest.Mock).mockResolvedValue({
      success: true,
      data: { id: 976, errors: null },
      redirect: undefined,
    });

    render(
      <MockedProvider mocks={mocks}>
        <GuidanceGroupIndexPage />
      </MockedProvider>,
    );

    await waitForElementToBeRemoved(() => screen.getByText('Global.messaging.loading'));

    jest.useFakeTimers();
    try {
      const editor = screen.getByTestId('editor-content-1');
      fireEvent.change(editor, { target: { value: 'Text that will age' } });

      await act(async () => {
        jest.advanceTimersByTime(3000);
      });
      expect(screen.getByTestId('last-saved-1')).toHaveTextContent('Guidance.messages.savedJustNow');

      await act(async () => {
        jest.advanceTimersByTime(59 * 1000);
      });
      expect(screen.getByTestId('last-saved-1')).toHaveTextContent('Guidance.messages.savedJustNow');

      await act(async () => {
        jest.advanceTimersByTime(1000);
      });
      expect(screen.getByTestId('last-saved-1')).toHaveTextContent('Guidance.messages.lastSavedOneMinuteAgo');

      await act(async () => {
        jest.advanceTimersByTime(60 * 1000);
      });
      expect(screen.getByTestId('last-saved-1')).toHaveTextContent('Guidance.messages.lastSavedMinutesAgo');
    } finally {
      jest.useRealTimers();
    }
  });

  it('should update the newly created guidance on the next save instead of adding it again', async () => {
    (addGuidanceTextAction as jest.Mock).mockResolvedValue({
      success: true,
      data: { id: 999, errors: null },
      redirect: undefined,
    });
    (updateGuidanceAction as jest.Mock).mockResolvedValue({
      success: true,
      data: { id: 999, errors: null },
      redirect: undefined,
    });

    render(
      <MockedProvider mocks={mocks}>
        <GuidanceGroupIndexPage />
      </MockedProvider>,
    );

    await waitForElementToBeRemoved(() => screen.getByText('Global.messaging.loading'));

    const editor = screen.getByTestId('editor-content-14');
    const guidanceCard = editor.closest('div')?.parentElement as HTMLElement;
    const saveBtn = within(guidanceCard).getByRole('button', { name: 'Global.buttons.save' });

    fireEvent.change(editor, { target: { value: 'First version' } });
    fireEvent.click(saveBtn);
    await waitFor(() => {
      expect(addGuidanceTextAction).toHaveBeenCalledTimes(1);
      expect(within(guidanceCard).getByRole('button', { name: 'Global.buttons.save' })).not.toBeDisabled();
    });

    fireEvent.change(editor, { target: { value: 'Second version' } });
    fireEvent.click(within(guidanceCard).getByRole('button', { name: 'Global.buttons.save' }));

    await waitFor(() => {
      expect(updateGuidanceAction).toHaveBeenCalledWith({
        guidanceId: 999,
        guidanceText: 'Second version',
        tagId: 14
      });
    });
    expect(addGuidanceTextAction).toHaveBeenCalledTimes(1);
  });

  it('should not autosave when the text is changed back to the saved version', async () => {
    render(
      <MockedProvider mocks={mocks}>
        <GuidanceGroupIndexPage />
      </MockedProvider>,
    );

    await waitForElementToBeRemoved(() => screen.getByText('Global.messaging.loading'));

    jest.useFakeTimers();
    try {
      const editor = screen.getByTestId('editor-content-1');
      const originalText = (editor as HTMLTextAreaElement).value;
      fireEvent.change(editor, { target: { value: 'Temporary edit' } });
      fireEvent.change(editor, { target: { value: originalText } });

      expect(screen.getByTestId('last-saved-1')).toBeEmptyDOMElement();

      await act(async () => {
        jest.advanceTimersByTime(3000);
      });
    } finally {
      jest.useRealTimers();
    }

    expect(updateGuidanceAction).not.toHaveBeenCalled();
  });

  it('should autosave pending changes before publishing', async () => {
    (updateGuidanceAction as jest.Mock).mockResolvedValue({
      success: true,
      data: { id: 976, errors: null },
      redirect: undefined,
    });
    (publishGuidanceGroupAction as jest.Mock).mockResolvedValue({
      success: true,
      data: { id: 2397, name: "CDL Guidance Group", errors: null },
    });
    const confirmSpy = jest.spyOn(window, 'confirm');

    render(
      <MockedProvider mocks={inactiveGroupMocks}>
        <GuidanceGroupIndexPage />
      </MockedProvider>,
    );

    await waitForElementToBeRemoved(() => screen.getByText("Global.messaging.loading"));

    const editor = screen.getByTestId('editor-content-1');
    fireEvent.change(editor, { target: { value: 'Edited right before publishing' } });

    const sidebar = screen.getByTestId("sidebar-panel");
    const publishBtn = within(sidebar).getByRole("button", { name: "Global.buttons.publish" });

    await act(async () => {
      fireEvent.click(publishBtn);
    });

    await waitFor(() => {
      expect(updateGuidanceAction).toHaveBeenCalledWith({
        guidanceId: 976,
        guidanceText: 'Edited right before publishing',
        tagId: 1
      });
      expect(publishGuidanceGroupAction).toHaveBeenCalled();
    });
    expect(confirmSpy).not.toHaveBeenCalled();
    confirmSpy.mockRestore();
  });

  describe('autosave', () => {
    afterEach(() => {
      jest.useRealTimers();
    });

    it('should only autosave once when typing continues within the delay', async () => {
      (updateGuidanceAction as jest.Mock).mockResolvedValue({
        success: true,
        data: { id: 976, errors: null },
        redirect: undefined,
      });

      render(
        <MockedProvider mocks={mocks}>
          <GuidanceGroupIndexPage />
        </MockedProvider>,
      );

      await waitForElementToBeRemoved(() => screen.getByText('Global.messaging.loading'));

      jest.useFakeTimers();

      const editor = screen.getByTestId('editor-content-1');
      fireEvent.change(editor, { target: { value: 'First' } });
      act(() => {
        jest.advanceTimersByTime(2000);
      });
      fireEvent.change(editor, { target: { value: 'First and second' } });

      await act(async () => {
        jest.advanceTimersByTime(3000);
      });

      jest.useRealTimers();

      await waitFor(() => {
        expect(updateGuidanceAction).toHaveBeenCalledTimes(1);
        expect(updateGuidanceAction).toHaveBeenCalledWith(expect.objectContaining({ guidanceText: 'First and second' }));
      });
    });

    it('should save pending changes immediately when the window loses focus', async () => {
      (addGuidanceTextAction as jest.Mock).mockResolvedValue({
        success: true,
        data: { id: 999, errors: null },
        redirect: undefined,
      });

      render(
        <MockedProvider mocks={mocks}>
          <GuidanceGroupIndexPage />
        </MockedProvider>,
      );

      await waitForElementToBeRemoved(() => screen.getByText('Global.messaging.loading'));

      const editor = screen.getByTestId('editor-content-14');
      fireEvent.change(editor, { target: { value: 'Saved on blur' } });

      await act(async () => {
        window.dispatchEvent(new Event('blur'));
      });

      await waitFor(() => {
        expect(addGuidanceTextAction).toHaveBeenCalledTimes(1);
        expect(addGuidanceTextAction).toHaveBeenCalledWith({
          guidanceGroupId: 2397,
          guidanceText: 'Saved on blur',
          tagId: 14,
        });
        expect(screen.getByTestId('last-saved-14')).toHaveTextContent('Guidance.messages.savedJustNow');
      });
    });

    it('should show unsaved changes when autosave fails', async () => {
      (updateGuidanceAction as jest.Mock).mockResolvedValue({
        success: false,
        errors: ['Autosave failed'],
      });

      render(
        <MockedProvider mocks={mocks}>
          <GuidanceGroupIndexPage />
        </MockedProvider>,
      );

      await waitForElementToBeRemoved(() => screen.getByText('Global.messaging.loading'));

      jest.useFakeTimers();

      const editor = screen.getByTestId('editor-content-1');
      fireEvent.change(editor, { target: { value: 'This will fail' } });

      await act(async () => {
        jest.advanceTimersByTime(3000);
      });

      jest.useRealTimers();

      await waitFor(() => {
        expect(screen.getByText('Autosave failed')).toBeInTheDocument();
        expect(screen.getByTestId('last-saved-1')).toHaveTextContent('Guidance.messages.unsavedChanges');
      });
    });
  });

  it('should handle unpublishing of guidance group', async () => {
    (unPublishGuidanceGroupAction as jest.Mock).mockResolvedValue({
      success: true,
      data: {
        id: 2398,
        name: "CDL Guidance Group",
        errors: {
          affiliationId: null,
          bestPractice: null,
          description: null,
          general: null,
          name: null
        },
      },
    });

    render(
      <MockedProvider mocks={mocks}>
        <GuidanceGroupIndexPage />
      </MockedProvider>,
    );

    await waitForElementToBeRemoved(() => screen.getByText("Global.messaging.loading"));

    const sidebar = screen.getByTestId("sidebar-panel");
    const inSidebar = within(sidebar);

    // Wait for the real (non-disabled) unpublish button — this ensures guidanceGroup
    // state has resolved and the status is PUBLISHED, not DRAFT
    const unPublishBtn = await waitFor(() => {
      const btn = inSidebar.getByRole("button", { name: "Global.buttons.unpublish" });
      expect(btn).not.toHaveAttribute('aria-disabled', 'true');
      return btn;
    });

    fireEvent.click(unPublishBtn);

    await waitFor(() => {
      expect(unPublishGuidanceGroupAction).toHaveBeenCalledWith({ guidanceGroupId: 2398 });
      expect(mockToast.add).toHaveBeenCalledWith('Guidance.messages.success.guidanceGroupUnpublished', { type: 'success' });
      expect(mockRouter.push).toHaveBeenCalledWith('/en-US/admin/guidance');
    });
  });

  it('should handle redirect if response contains redirect', async () => {
    (unPublishGuidanceGroupAction as jest.Mock).mockResolvedValue({
      success: true,
      data: {
        id: 2397,
        name: "CDL Guidance Group",
        errors: {
          affiliationId: null,
          bestPractice: null,
          description: null,
          general: null,
          name: null
        },
      },
      redirect: '/en-US/admin/guidance/redirect-page'
    });
    render(
      <MockedProvider mocks={mocks}>
        <GuidanceGroupIndexPage />
      </MockedProvider>,
    );

    // Wait for loading to be gone (tagsLoading and guidanceLoading both false)
    await waitForElementToBeRemoved(() => screen.getByText("Global.messaging.loading"));

    const sidebar = screen.getByTestId("sidebar-panel");
    const inSidebar = within(sidebar);
    const unPublishBtn = inSidebar.getByRole("button", { name: "Global.buttons.unpublish" });

    await act(async () => {
      fireEvent.click(unPublishBtn);
    });

    await waitFor(() => {
      expect(mockRouter.push).toHaveBeenCalledWith('/en-US/admin/guidance/redirect-page')
    });
  });

  it('should handle handleUnpublish when response is not successful', async () => {
    (unPublishGuidanceGroupAction as jest.Mock).mockResolvedValue({
      success: false,
      errors: ['Some error occurred'],
    });

    render(
      <MockedProvider mocks={mocks}>
        <GuidanceGroupIndexPage />
      </MockedProvider>,
    );

    await waitForElementToBeRemoved(() => screen.getByText("Global.messaging.loading"));

    const sidebar = screen.getByTestId("sidebar-panel");
    const inSidebar = within(sidebar);

    // Verify the real (non-disabled) unpublish button is present before clicking
    const unPublishBtn = inSidebar.getByRole("button", { name: "Global.buttons.unpublish" });
    expect(unPublishBtn).not.toHaveAttribute('aria-disabled', 'true');

    await act(async () => {
      fireEvent.click(unPublishBtn);
    });

    await waitFor(() => {
      expect(unPublishGuidanceGroupAction).toHaveBeenCalled(); // confirm action was actually called
      expect(screen.getByText('Some error occurred')).toBeInTheDocument();
    });
  });

  it('should display error if field-level errors returned from handleUnpublish', async () => {
    (unPublishGuidanceGroupAction as jest.Mock).mockResolvedValue({
      success: true,
      data: {
        id: 2397,
        name: "CDL Guidance Group",
        errors: {
          affiliationId: null,
          bestPractice: null,
          description: null,
          general: "There was a general error",
          name: null
        },
      },
    });
    render(
      <MockedProvider mocks={mocks}>
        <GuidanceGroupIndexPage />
      </MockedProvider>,
    );

    // Wait for loading to be gone (tagsLoading and guidanceLoading both false)
    await waitForElementToBeRemoved(() => screen.getByText("Global.messaging.loading"), { timeout: 5000 });

    const sidebar = screen.getByTestId("sidebar-panel");
    const inSidebar = within(sidebar);
    const unPublishBtn = inSidebar.getByRole("button", { name: "Global.buttons.unpublish" });

    await act(async () => {
      fireEvent.click(unPublishBtn);
    });

    await waitFor(() => {
      expect(screen.getByText('There was a general error')).toBeInTheDocument();
      //Check that error logged
      expect(logECS).toHaveBeenCalledWith(
        'error',
        'Unpublishing Guidance Group',
        expect.objectContaining({
          errors: expect.anything(),
          url: { path: '/en-US/admin/guidance/groups/create' },
        })
      )
    }, { timeout: 3000 });
  });

  it('should handle publishing of guidance group', async () => {
    (publishGuidanceGroupAction as jest.Mock).mockResolvedValue({
      success: true,
      data: {
        id: 2397,
        name: "CDL Guidance Group",
        errors: {
          affiliationId: null,
          bestPractice: null,
          description: null,
          general: null,
          name: null
        },
      },
    });
    render(
      <MockedProvider mocks={inactiveGroupMocks}>
        <GuidanceGroupIndexPage />
      </MockedProvider>,
    );


    // Wait for loading to be gone (tagsLoading and guidanceLoading both false)
    await waitForElementToBeRemoved(() => screen.getByText("Global.messaging.loading"));

    const sidebar = screen.getByTestId("sidebar-panel");
    const inSidebar = within(sidebar);
    const publishBtn = await waitFor(() => {
      const btn = inSidebar.getByRole("button", { name: "Global.buttons.publish" });
      expect(btn).not.toHaveAttribute('aria-disabled', 'true');
      return btn;
    });

    await act(async () => {
      fireEvent.click(publishBtn);
    });

    await waitFor(() => {
      expect(mockToast.add).toHaveBeenCalledWith('Guidance.messages.success.guidanceGroupPublished', { type: 'success' });
      expect(mockRouter.push).toHaveBeenCalledWith('/en-US/admin/guidance');
      expect(publishGuidanceGroupAction).toHaveBeenCalledWith({
        guidanceGroupId: 2398
      });
    });
  });

  it('should handle redirect if response from handlePublish contains redirect', async () => {
    (publishGuidanceGroupAction as jest.Mock).mockResolvedValue({
      success: true,
      data: {
        id: 2397,
        name: "CDL Guidance Group",
        errors: {
          affiliationId: null,
          bestPractice: null,
          description: null,
          general: null,
          name: null
        },
      },
      redirect: '/en-US/admin/guidance/redirect-page'
    });
    render(
      <MockedProvider mocks={inactiveGroupMocks}>
        <GuidanceGroupIndexPage />
      </MockedProvider>,
    );

    // Wait for loading to be gone (tagsLoading and guidanceLoading both false)
    await waitForElementToBeRemoved(() => screen.getByText("Global.messaging.loading"));

    const sidebar = screen.getByTestId("sidebar-panel");
    const inSidebar = within(sidebar);
    const publishBtn = inSidebar.getByRole("button", { name: "Global.buttons.publish" });

    await act(async () => {
      fireEvent.click(publishBtn);
    });

    await waitFor(() => {
      expect(mockRouter.push).toHaveBeenCalledWith('/en-US/admin/guidance/redirect-page')
    });
  });

  it('should handle handlepublish when response is not successful', async () => {
    (publishGuidanceGroupAction as jest.Mock).mockResolvedValue({
      success: false,
      errors: ['Some error occurred'],
    });

    render(
      <MockedProvider mocks={inactiveGroupMocks}>
        <GuidanceGroupIndexPage />
      </MockedProvider>,
    );

    // Wait for loading to be gone (tagsLoading and guidanceLoading both false)
    await waitForElementToBeRemoved(() => screen.getByText("Global.messaging.loading"));

    const sidebar = screen.getByTestId("sidebar-panel");
    const inSidebar = within(sidebar);
    const publishBtn = inSidebar.getByRole("button", { name: "Global.buttons.publish" });

    // Click the button
    fireEvent.click(publishBtn);

    // Wait for the publish action to be called
    await waitFor(() => {
      expect(publishGuidanceGroupAction).toHaveBeenCalled();
    });

    // Wait for the async action to complete and error to be displayed
    await waitFor(() => {
      const errorContainer = screen.getByRole('alert');
      expect(errorContainer).toBeInTheDocument();
      expect(within(errorContainer).getByText('Some error occurred')).toBeInTheDocument();
    }, { timeout: 3000 });

    // Check that error logged
    expect(logECS).toHaveBeenCalledWith(
      'error',
      'publishing Guidance Group',
      expect.objectContaining({
        errors: expect.anything(),
        url: { path: '/en-US/admin/guidance/groups/create' },
      })
    );

    // Flush any pending act warnings
    await act(async () => {
      await new Promise(resolve => setTimeout(resolve, 0));
    });
  });

  it('should display error if field-level errors returned from handlepublish', async () => {
    (publishGuidanceGroupAction as jest.Mock).mockResolvedValue({
      success: true,
      data: {
        id: 2397,
        name: "CDL Guidance Group",
        errors: {
          affiliationId: null,
          bestPractice: null,
          description: null,
          general: "There was a general error",
          name: null
        },
      },
    });
    render(
      <MockedProvider mocks={inactiveGroupMocks}>
        <GuidanceGroupIndexPage />
      </MockedProvider>,
    );

    // Wait for loading to be gone (tagsLoading and guidanceLoading both false)
    await waitForElementToBeRemoved(() => screen.getByText("Global.messaging.loading"));

    const sidebar = screen.getByTestId("sidebar-panel");
    const inSidebar = within(sidebar);
    const publishBtn = inSidebar.getByRole("button", { name: "Global.buttons.publish" });
    await act(async () => {
      fireEvent.click(publishBtn);
    });

    // Since guidanceGroupId is undefined, we expect an inline error message and no side effects
    await waitFor(() => {
      expect(screen.getByText('There was a general error')).toBeInTheDocument();
      //Check that error logged
      expect(logECS).toHaveBeenCalledWith(
        'error',
        'publishing Guidance Group',
        expect.objectContaining({
          errors: expect.anything(),
          url: { path: '/en-US/admin/guidance/groups/create' },
        })
      )
    });
  });

  it("should pass accessibility tests", async () => {
    const { container } = render(
      <MockedProvider mocks={mocks}>
        <GuidanceGroupIndexPage />
      </MockedProvider>,
    );

    // Wait for loading to be gone (tagsLoading and guidanceLoading both false)
    await waitForElementToBeRemoved(() => screen.getByText("Global.messaging.loading"));

    const results = await axe(container);
    expect(results).toHaveNoViolations();
  });
});
