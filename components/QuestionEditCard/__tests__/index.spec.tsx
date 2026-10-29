import React from "react";
import { render, screen, fireEvent } from "@testing-library/react";
import { useTranslations } from "next-intl";
import QuestionEditCard from "../index";

jest.mock('@/i18n/routing', () => ({
  Link: ({ href, children, ...props }: { href: string; children: React.ReactNode }) => (
    <a href={href} {...props}>{children}</a>
  ),
  useRouter: jest.fn(() => ({ push: jest.fn(), replace: jest.fn(), back: jest.fn() })),
  usePathname: jest.fn(() => '/'),
}));

// Mock dependencies
jest.mock("next-intl", () => ({
  useTranslations: jest.fn(),
}));

jest.mock("@/utils/general", () => ({
  stripHtml: jest.fn((text) => text), // Simple mock that returns the input
}));

jest.mock("@/utils/clientLogger", () => jest.fn());

jest.mock("@/utils/routes", () => ({
  routePath: jest.fn(() => "/mock-path"),
}));

// Mock Link component
jest.mock("next/link", () => {
  /* eslint-disable @typescript-eslint/no-explicit-any */
  return function MockLink({ children, href, ...props }: any) {
    return (
      <a
        href={href}
        {...props}
      >
        {children}
      </a>
    );
  };
});

describe("QuestionEditCard", () => {
  const mockHandleDisplayOrderChange = jest.fn();
  const mockTranslations = jest.fn((key: string, params?: any) => {
    if (key === "buttons.moveUp") return `Move up ${params?.name || ""}`;
    if (key === "buttons.moveDown") return `Move down ${params?.name || ""}`;
    if (key === "messages.questionMoved") return `Question moved to position ${params?.displayOrder}`;
    if (key === "label.question") return "Question";
    if (key === "label.funderQuestion") return "Funder Question";
    if (key === "label.organizationQuestion") return "Organization Question";
    if (key === "links.editQuestion") return "Edit Question";
    if (key === "links.customizeQuestion") return "Customize";
    if (key === "checklist.requirements") return "Requirements";
    if (key === "checklist.guidance") return "Guidance";
    if (key === "checklist.sampleText") return "Sample Text";
    if (key === "checklist.completed") return " completed";
    if (key === "checklist.notCompleted") return " not completed";
    return key;
  });

  const defaultProps = {
    id: "123",
    text: "Sample question text",
    link: "/edit/123",
    name: "Sample Question",
    displayOrder: 5,
    handleDisplayOrderChange: mockHandleDisplayOrderChange,
  };

  beforeEach(() => {
    jest.clearAllMocks();

    (useTranslations as jest.Mock).mockImplementation((namespace) => {
      if (namespace === "Global") {
        return (key: string) => {
          if (key === "messaging.somethingWentWrong") return "Something went wrong";
          return key;
        };
      }
      return mockTranslations;
    });
  });

  describe("QuestionEditCard", () => {
    it("should render correct move up and down aria-labels when no name is passed", async () => {
      const props = {
        ...defaultProps,
        name: undefined,
      };

      render(<QuestionEditCard {...props} />);

      const buttonMoveDown = screen.getByRole("button", { name: /move down/i });
      expect(buttonMoveDown).toHaveAttribute("aria-label", "Move down Sample question text");
      const buttonMoveUp = screen.getByRole("button", { name: /move up/i });
      expect(buttonMoveUp).toHaveAttribute("aria-label", "Move up Sample question text");
    });
  });

  describe("Move Up Button", () => {
    it("should call handleDisplayOrderChange with decreased display order when move up button is clicked", async () => {
      render(<QuestionEditCard {...defaultProps} />);

      const moveUpButton = screen.getByLabelText("Move up Sample question text");

      fireEvent.click(moveUpButton);

      // Verify optimistic update was called
      expect(mockHandleDisplayOrderChange).toHaveBeenCalledWith(123, 4);
    });
  });

  describe("Move Down Button", () => {
    it("should call handleDisplayOrderChange with increased display order when move down button is clicked", async () => {
      render(<QuestionEditCard {...defaultProps} />);

      const moveDownButton = screen.getByLabelText("Move down Sample question text");

      fireEvent.click(moveDownButton);

      // Verify optimistic update was called
      expect(mockHandleDisplayOrderChange).toHaveBeenCalledWith(123, 6);
    });
  });

  describe("Question Author Type Labels", () => {
    it('should render "Question" label when questionAuthorType is null', () => {
      render(
        <QuestionEditCard
          {...defaultProps}
          questionAuthorType={null}
        />,
      );
      expect(screen.getByText("Question")).toBeInTheDocument();
    });

    it('should render "Question" label when questionAuthorType is undefined', () => {
      render(<QuestionEditCard {...defaultProps} />);
      expect(screen.getByText("Question")).toBeInTheDocument();
    });

    it('should render "Funder Question" label when questionAuthorType is "funder"', () => {
      render(
        <QuestionEditCard
          {...defaultProps}
          questionAuthorType="funder"
        />,
      );
      expect(screen.getByText("Funder Question")).toBeInTheDocument();
    });

    it('should render "Organization Question" label when questionAuthorType is "organization"', () => {
      render(
        <QuestionEditCard
          {...defaultProps}
          questionAuthorType="organization"
        />,
      );
      expect(screen.getByText("Organization Question")).toBeInTheDocument();
    });
  });

  describe("Link Text Based on Question Author Type", () => {
    it('should show "Edit Question" link when questionAuthorType is null', () => {
      render(
        <QuestionEditCard
          {...defaultProps}
          questionAuthorType={null}
        />,
      );
      expect(screen.getByText("Edit Question")).toBeInTheDocument();
    });

    it('should show "Edit Question" link when questionAuthorType is undefined', () => {
      render(<QuestionEditCard {...defaultProps} />);
      expect(screen.getByText("Edit Question")).toBeInTheDocument();
    });

    it('should show "Customize" link when questionAuthorType is "funder"', () => {
      render(
        <QuestionEditCard
          {...defaultProps}
          questionAuthorType="funder"
        />,
      );
      expect(screen.getByText("Customize")).toBeInTheDocument();
    });

    it('should show "Edit Question" link when questionAuthorType is "organization"', () => {
      render(
        <QuestionEditCard
          {...defaultProps}
          questionAuthorType="organization"
        />,
      );
      expect(screen.getByText("Edit Question")).toBeInTheDocument();
    });
  });

  describe("Organization Question Styling", () => {
    it('should apply organization question class when questionAuthorType is "organization"', () => {
      const { container } = render(
        <QuestionEditCard
          {...defaultProps}
          questionAuthorType="organization"
        />,
      );
      const questionCard = container.querySelector('[data-testid="question-edit-card"]');
      expect(questionCard).toHaveClass("organizationQuestion");
    });

    it('should not apply organization question class when questionAuthorType is not "organization"', () => {
      const { container } = render(
        <QuestionEditCard
          {...defaultProps}
          questionAuthorType="funder"
        />,
      );
      const questionCard = container.querySelector('[data-testid="question-edit-card"]');
      expect(questionCard).not.toHaveClass("organizationQuestion");
    });
  });

  describe("Checklist Functionality", () => {
    const checklistProps = {
      ...defaultProps,
      checklist: {
        requirements: true,
        guidance: false,
        sampleText: true,
      },
    };

    it("should render checklist when provided", () => {
      render(<QuestionEditCard {...checklistProps} />);

      expect(screen.getByText("Requirements")).toBeInTheDocument();
      expect(screen.getByText("Guidance")).toBeInTheDocument();
      expect(screen.getByText("Sample Text")).toBeInTheDocument();
    });

    it("should not render checklist when not provided", () => {
      render(<QuestionEditCard {...defaultProps} />);

      expect(screen.queryByText("Requirements")).not.toBeInTheDocument();
      expect(screen.queryByText("Guidance")).not.toBeInTheDocument();
      expect(screen.queryByText("Sample Text")).not.toBeInTheDocument();
    });

    it("should show checkmarks for all checklist items", () => {
      render(<QuestionEditCard {...checklistProps} />);

      // Check that checkmarks are present (using aria-hidden checkmarks)
      const checkmarks = screen.getAllByText("✓");
      expect(checkmarks).toHaveLength(3);
    });

    it("should render order buttons in their own container", () => {
      render(<QuestionEditCard {...checklistProps} />);

      // Check that both buttons are rendered
      expect(screen.getByRole("button", { name: /move up/i })).toBeInTheDocument();
      expect(screen.getByRole("button", { name: /move down/i })).toBeInTheDocument();

      // Check that edit link is also present
      expect(screen.getByRole("link", { name: /edit question/i })).toBeInTheDocument();
    });
  });

  describe("Accessibility", () => {
    it("should have proper ARIA labels for checklist items", () => {
      const checklistProps = {
        ...defaultProps,
        checklist: {
          requirements: true,
          guidance: false,
          sampleText: true,
        },
      };

      render(<QuestionEditCard {...checklistProps} />);

      // Check that the checklist has proper role and aria-label
      const checklist = screen.getByRole("group", { name: "Question customization options" });
      expect(checklist).toBeInTheDocument();
    });

    it("should have proper ARIA labels for actions", () => {
      render(<QuestionEditCard {...defaultProps} />);

      const actions = screen.getByRole("group", { name: "Question actions" });
      expect(actions).toBeInTheDocument();
    });
  });
});
