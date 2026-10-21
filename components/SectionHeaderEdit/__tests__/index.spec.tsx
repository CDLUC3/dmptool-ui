import { act, render, screen, fireEvent } from "@testing-library/react";
import { axe, toHaveNoViolations } from "jest-axe";
expect.extend(toHaveNoViolations);
import SectionHeaderEdit from "../index";

jest.mock('@/i18n/routing', () => ({
  Link: ({ href, children, ...props }: { href: string; children: React.ReactNode }) => (
    <a href={href} {...props}>{children}</a>
  ),
  useRouter: jest.fn(() => ({ push: jest.fn(), replace: jest.fn(), back: jest.fn() })),
  usePathname: jest.fn(() => '/'),
}));

// Mock next-intl's useTranslations
jest.mock("next-intl", () => ({
  useTranslations: () => (key: string) => {
    const translations: Record<string, string> = {
      "labels.section": "Section",
      "links.editSection": "Edit",
      "buttons.moveUp": "Move Up",
      "buttons.moveDown": "Move Down",
      "checklist.requirements": "Requirements",
      "checklist.guidance": "Guidance",
      "checklist.completed": " completed",
      "checklist.notCompleted": " not completed",
    };
    return translations[key] || key;
  },
}));

describe("SectionHeaderEdit", () => {
  const defaultProps = {
    title: "Test Title",
    sectionNumber: 2,
    editUrl: "/edit/2",
    onMoveUp: undefined,
    onMoveDown: undefined,
  };

  it("should render title, section number, and edit link", () => {
    render(<SectionHeaderEdit {...defaultProps} />);
    expect(screen.getByText("Section 2")).toBeInTheDocument();
    expect(screen.getByText("Test Title")).toBeInTheDocument();
    const editLink = screen.getByRole("link", { name: "Edit" });
    expect(editLink).toHaveAttribute("href", "/edit/2");
  });

  it("should render move up button if onMoveUp is provided", () => {
    render(
      <SectionHeaderEdit
        {...defaultProps}
        onMoveUp={jest.fn()}
      />,
    );
    const moveUpBtn = screen.getByRole("button", { name: "Move Up" });
    expect(moveUpBtn).toBeInTheDocument();
  });

  it("should render move down button if onMoveDown is provided", () => {
    render(
      <SectionHeaderEdit
        {...defaultProps}
        onMoveDown={jest.fn()}
      />,
    );
    const moveDownBtn = screen.getByRole("button", { name: "Move Down" });
    expect(moveDownBtn).toBeInTheDocument();
  });

  it("should call onMoveUp when move up button is clicked", () => {
    const onMoveUp = jest.fn();
    render(
      <SectionHeaderEdit
        {...defaultProps}
        onMoveUp={onMoveUp}
      />,
    );
    const moveUpBtn = screen.getByRole("button", { name: "Move Up" });
    fireEvent.click(moveUpBtn);
    expect(onMoveUp).toHaveBeenCalled();
  });

  it("should call onMoveDown when move down button is clicked", () => {
    const onMoveDown = jest.fn();
    render(
      <SectionHeaderEdit
        {...defaultProps}
        onMoveDown={onMoveDown}
      />,
    );
    const moveDownBtn = screen.getByRole("button", { name: "Move Down" });
    fireEvent.click(moveDownBtn);
    expect(onMoveDown).toHaveBeenCalled();
  });

  it("should not render move up or move down buttons if handlers are not provided", () => {
    render(<SectionHeaderEdit {...defaultProps} />);
    expect(screen.queryByRole("button", { name: "Move Up" })).toBeNull();
    expect(screen.queryByRole("button", { name: "Move Down" })).toBeNull();
  });

  it("should render checklist when provided", () => {
    const checklist = {
      requirements: true,
      guidance: false,
    };

    render(
      <SectionHeaderEdit
        {...defaultProps}
        sectionAuthorType="funder"
        checklist={checklist}
      />,
    );

    expect(screen.getByText("Requirements")).toBeInTheDocument();
    expect(screen.getByText("Guidance")).toBeInTheDocument();
  });

  it("should not render checklist when not provided", () => {
    render(<SectionHeaderEdit {...defaultProps} />);

    expect(screen.queryByText("Requirements")).not.toBeInTheDocument();
    expect(screen.queryByText("Guidance")).not.toBeInTheDocument();
  });

  it("should show checked state for completed checklist items", () => {
    const checklist = {
      requirements: true,
      guidance: false,
    };

    render(
      <SectionHeaderEdit
        {...defaultProps}
        sectionAuthorType="funder"
        checklist={checklist}
      />,
    );

    // Check that checkmarks are present (using aria-hidden checkmarks)
    const checkmarks = screen.getAllByText("✓");
    expect(checkmarks).toHaveLength(2);
  });

  it("should render order buttons in their own container", () => {
    render(
      <SectionHeaderEdit
        {...defaultProps}
        onMoveUp={jest.fn()}
        onMoveDown={jest.fn()}
      />,
    );

    // Check that both buttons are rendered
    expect(screen.getByRole("button", { name: "Move Up" })).toBeInTheDocument();
    expect(screen.getByRole("button", { name: "Move Down" })).toBeInTheDocument();

    // Check that edit link is also present
    expect(screen.getByRole("link", { name: "Edit" })).toBeInTheDocument();
  });

  it("should pass axe accessibility test", async () => {
    const { container } = render(
      <SectionHeaderEdit
        {...defaultProps}
        onMoveUp={jest.fn()}
        onMoveDown={jest.fn()}
      />,
    );

    await act(async () => {
      const results = await axe(container);
      expect(results).toHaveNoViolations();
    });
  });

  it("should pass axe accessibility test with checklist", async () => {
    const checklist = {
      requirements: true,
      guidance: false,
    };

    const { container } = render(
      <SectionHeaderEdit
        {...defaultProps}
        sectionAuthorType="funder"
        checklist={checklist}
        onMoveUp={jest.fn()}
        onMoveDown={jest.fn()}
      />,
    );

    await act(async () => {
      const results = await axe(container);
      expect(results).toHaveNoViolations();
    });
  });
});
