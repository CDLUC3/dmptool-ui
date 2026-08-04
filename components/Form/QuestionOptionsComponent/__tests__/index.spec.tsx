import React, { ReactNode } from "react";
import { fireEvent, render, screen } from "@/utils/test-utils";
import { RichTranslationValues } from "next-intl";
import { axe, toHaveNoViolations } from "jest-axe";
import QuestionOptionsComponent from "@/components/Form/QuestionOptionsComponent";

expect.extend(toHaveNoViolations);

type MockUseTranslations = {
  (key: string, ...args: unknown[]): string;
  rich: (key: string, values?: RichTranslationValues) => ReactNode;
};

jest.mock("next-intl", () => ({
  useTranslations: jest.fn(() => {
    const mockUseTranslations: MockUseTranslations = ((key: string) => key) as MockUseTranslations;

    mockUseTranslations.rich = (key, values) => {
      const p = values?.p;
      if (typeof p === "function") {
        return p(key); // Can return JSX
      }
      return key; // fallback
    };

    return mockUseTranslations;
  }),
}));

const mockQuestionJSON =
  '{"meta":{"schemaVersion":"1.0"},"type":"radioButtons","options":[{"type":"option","attributes":{"label":"Option 1","value":"1","selected":false}},{"type":"option","attributes":{"label":"Option 2","value":"2","selected":true}}]}';

type Row = {
  id?: number | null;
  text: string;
  isSelected?: boolean | null;
};

describe("QuestionOptionsComponent", () => {
  let rows: Row[], setRows: jest.Mock;

  beforeEach(() => {
    rows = [{ id: 1, text: "Option 1", isSelected: false }];
    setRows = jest.fn();
  });

  it("should render initial rows correctly", () => {
    render(
      <QuestionOptionsComponent
        rows={rows}
        setRows={setRows}
        questionJSON={mockQuestionJSON}
        formSubmitted={true}
        setFormSubmitted={jest.fn()}
      />,
    );

    expect(screen.getByRole("group", { name: "messages.rowInfo" })).toHaveAccessibleDescription(
      "messages.instructions",
    );
    expect(screen.queryByLabelText(/labels.order/)).not.toBeInTheDocument();
    expect(screen.getByLabelText(/labels.choiceNumber/)).toBeInTheDocument();
    expect(screen.getByLabelText("buttons.setDefault")).toBeInTheDocument();
  });

  it("should show clear errors when a required choice is blank", () => {
    render(
      <QuestionOptionsComponent
        rows={[{ id: 1, text: "", isSelected: false }]}
        setRows={setRows}
        questionJSON={mockQuestionJSON}
        formSubmitted={false}
        setFormSubmitted={jest.fn()}
      />,
    );

    const choiceInput = screen.getByLabelText(/labels.choiceNumber/);
    fireEvent.invalid(choiceInput);

    expect(choiceInput).toHaveAttribute("aria-invalid", "true");
    expect(screen.getByText("messages.choiceErrors")).toHaveAttribute("role", "alert");
    expect(screen.getByText("messages.choiceRequired")).toBeInTheDocument();
  });

  it("should add a new row when the add button is clicked", () => {
    render(
      <QuestionOptionsComponent
        rows={rows}
        setRows={setRows}
        questionJSON={mockQuestionJSON}
        formSubmitted={true}
        setFormSubmitted={jest.fn()}
      />,
    );

    const addButton = screen.getByRole("button", { name: /buttons.addRow/i });
    fireEvent.click(addButton);

    expect(setRows).toHaveBeenCalledWith([
      { id: 1, isSelected: false, text: "Option 1" },
      { id: 2, isSelected: false, text: "" },
    ]);
    expect(screen.getByText("announcements.rowAdded")).toBeInTheDocument();
  });

  it("should update text field correctly", () => {
    render(
      <QuestionOptionsComponent
        rows={rows}
        setRows={setRows}
        questionJSON={mockQuestionJSON}
        formSubmitted={true}
        setFormSubmitted={jest.fn()}
      />,
    );

    const textInput = screen.getByLabelText(/labels.choiceNumber/);
    fireEvent.change(textInput, { target: { value: "Updated Option" } });

    expect(setRows).toHaveBeenCalledWith([{ id: 1, isSelected: false, text: "Updated Option" }]);
  });

  it("should handle case where questionJSON is passed as an object", () => {
    const questionJSONObj = JSON.parse(mockQuestionJSON);
    render(
      <QuestionOptionsComponent
        rows={rows}
        setRows={setRows}
        questionJSON={questionJSONObj}
        formSubmitted={true}
        setFormSubmitted={jest.fn()}
      />,
    );

    const textInput = screen.getByLabelText(/labels.choiceNumber/);
    fireEvent.change(textInput, { target: { value: "Updated Option" } });

    expect(setRows).toHaveBeenCalledWith([{ id: 1, isSelected: false, text: "Updated Option" }]);
  });

  it("should set a row as default when checkbox is clicked", () => {
    render(
      <QuestionOptionsComponent
        rows={rows}
        setRows={setRows}
        questionJSON={mockQuestionJSON}
        formSubmitted={true}
        setFormSubmitted={jest.fn()}
      />,
    );

    const defaultCheckbox = screen.getByLabelText("buttons.setDefault");
    fireEvent.click(defaultCheckbox);

    expect(setRows).toHaveBeenCalledWith([{ id: 1, isSelected: true, text: "Option 1" }]);
  });

  it("should allow multiple checkbox choices to be selected by default", () => {
    const mockCheckboxJSON =
      '{"type":"checkBoxes","meta":{"schemaVersion":"1.0","labelTranslationKey":"questions.research_methods"},"options":[{"type":"option","attributes":{"label":"Interviews","value":"interviews","checked":true}},{"type":"option","attributes":{"label":"Surveys","value":"surveys","checked":false}},{"type":"option","attributes":{"label":"Observations","value":"observations","checked":true}},{"type":"option","attributes":{"label":"Focus Groups","value":"focus_groups","checked":true}}]}';
    const checkboxRows = [
      { id: 1, text: "Option 1", isSelected: true },
      { id: 2, text: "Option 2", isSelected: false },
    ];

    render(
      <QuestionOptionsComponent
        rows={checkboxRows}
        setRows={setRows}
        questionJSON={mockCheckboxJSON}
        formSubmitted={true}
        setFormSubmitted={jest.fn()}
      />,
    );

    fireEvent.click(screen.getByLabelText("buttons.setDefault"));

    expect(setRows).toHaveBeenCalledWith([
      { id: 1, text: "Option 1", isSelected: true },
      { id: 2, text: "Option 2", isSelected: true },
    ]);
  });

  it("should allow multiple multi-select choices to be selected by default", () => {
    const multiSelectRows = [
      { id: 1, text: "Option 1", isSelected: true },
      { id: 2, text: "Option 2", isSelected: false },
    ];

    render(
      <QuestionOptionsComponent
        rows={multiSelectRows}
        setRows={setRows}
        questionJSON={{ type: "multiselectBox", attributes: { multiple: true } }}
        formSubmitted={true}
        setFormSubmitted={jest.fn()}
      />,
    );

    fireEvent.click(screen.getByLabelText("buttons.setDefault"));

    expect(setRows).toHaveBeenCalledWith([
      { id: 1, text: "Option 1", isSelected: true },
      { id: 2, text: "Option 2", isSelected: true },
    ]);
  });

  it("should add a row when the add button is clicked", () => {
    render(
      <QuestionOptionsComponent
        rows={rows}
        setRows={setRows}
        questionJSON={mockQuestionJSON}
        formSubmitted={true}
        setFormSubmitted={jest.fn()}
      />,
    );

    const addButton = screen.getByRole("button", { name: /buttons.addRow/i });
    fireEvent.click(addButton);

    expect(setRows).toHaveBeenCalledWith([
      { id: 1, isSelected: false, text: "Option 1" },
      { id: 2, isSelected: false, text: "" },
    ]);
  });

  it("should remove a row when delete button is clicked", () => {
    render(
      <QuestionOptionsComponent
        rows={rows}
        setRows={setRows}
        questionJSON={mockQuestionJSON}
        formSubmitted={true}
        setFormSubmitted={jest.fn()}
      />,
    );

    const deleteButton = screen.getByRole("button", { name: /buttons.deleteRow/i });
    fireEvent.click(deleteButton);
    expect(screen.getByRole("alertdialog")).toBeInTheDocument();
    expect(screen.getByText("messages.confirmRemove")).toBeInTheDocument();
    fireEvent.click(screen.getByRole("button", { name: "buttons.confirmRemove" }));

    expect(setRows).toHaveBeenCalledWith([]);
  });

  it("should remove a choice whose generated id is zero", () => {
    render(
      <QuestionOptionsComponent
        rows={[{ id: 0, text: "Option 1", isSelected: false }]}
        setRows={setRows}
        questionJSON={mockQuestionJSON}
        formSubmitted={true}
        setFormSubmitted={jest.fn()}
      />,
    );

    fireEvent.click(screen.getByRole("button", { name: /buttons.deleteRow/i }));
    fireEvent.click(screen.getByRole("button", { name: "buttons.confirmRemove" }));

    expect(setRows).toHaveBeenCalledWith([]);
  });

  it("should keep the choice when removal is cancelled", () => {
    render(
      <QuestionOptionsComponent
        rows={rows}
        setRows={setRows}
        questionJSON={mockQuestionJSON}
        formSubmitted={true}
        setFormSubmitted={jest.fn()}
      />,
    );

    fireEvent.click(screen.getByRole("button", { name: /buttons.deleteRow/i }));
    fireEvent.click(screen.getByRole("button", { name: "buttons.cancel" }));

    expect(setRows).not.toHaveBeenCalled();
    expect(screen.queryByRole("alertdialog")).not.toBeInTheDocument();
  });

  it("should set the correct row as default and unset others", () => {
    const mockSetRows = jest.fn();
    const rows = [
      { id: 1, orderNumber: 1, text: "Option 1", isSelected: true, questionId: 1 },
      { id: 2, orderNumber: 2, text: "Option 2", isSelected: false, questionId: 1 },
    ];

    const { getByLabelText } = render(
      <QuestionOptionsComponent
        rows={rows}
        setRows={mockSetRows}
        questionJSON={mockQuestionJSON}
        setFormSubmitted={jest.fn()}
      />,
    );

    const defaultCheckbox = getByLabelText("buttons.setDefault");
    fireEvent.click(defaultCheckbox);

    expect(mockSetRows).toHaveBeenCalledTimes(1);

    const updatedRows = mockSetRows.mock.calls[0][0];
    expect(updatedRows).toEqual([
      { id: 1, orderNumber: 1, text: "Option 1", isSelected: false, questionId: 1 },
      { id: 2, orderNumber: 2, text: "Option 2", isSelected: true, questionId: 1 },
    ]);
  });

  it("should uncheck the checked default", () => {
    function Wrapper() {
      const [rows, setRows] = React.useState<Row[]>([
        { id: 1, text: "Option 1", isSelected: false },
        { id: 2, text: "Option 2", isSelected: false },
      ]);

      return (
        <QuestionOptionsComponent
          rows={rows}
          setRows={setRows}
          questionJSON={mockQuestionJSON}
          setFormSubmitted={jest.fn()}
        />
      );
    }

    const { getAllByLabelText } = render(<Wrapper />);

    const defaultCheckbox = getAllByLabelText("buttons.setDefault")[1];

    // First click - should check it
    fireEvent.click(defaultCheckbox);
    expect(defaultCheckbox).toBeChecked();

    // Second click - should uncheck it
    fireEvent.click(defaultCheckbox);
    expect(defaultCheckbox).not.toBeChecked();
  });

  it("should reorder options with the move buttons", () => {
    const optionRows = [
      { id: 1, text: "Option 1", isSelected: true },
      { id: 2, text: "Option 2", isSelected: false },
    ];
    const setFormSubmitted = jest.fn();

    render(
      <QuestionOptionsComponent
        rows={optionRows}
        setRows={setRows}
        questionJSON={mockQuestionJSON}
        setFormSubmitted={setFormSubmitted}
      />,
    );

    const moveUpButtons = screen.getAllByRole("button", { name: "buttons.moveUp" });
    const moveDownButtons = screen.getAllByRole("button", { name: "buttons.moveDown" });

    expect(moveUpButtons).toHaveLength(2);
    expect(moveDownButtons).toHaveLength(2);
    expect(moveUpButtons[0]).toBeDisabled();
    expect(moveDownButtons[1]).toBeDisabled();

    fireEvent.click(moveDownButtons[0]);

    expect(setRows).toHaveBeenCalledWith([
      { id: 2, text: "Option 2", isSelected: false },
      { id: 1, text: "Option 1", isSelected: true },
    ]);
    expect(setFormSubmitted).toHaveBeenCalledWith(false);
    expect(screen.getByText("announcements.rowMoved")).toBeInTheDocument();
  });

  it("should have no automated accessibility violations", async () => {
    const { container } = render(
      <QuestionOptionsComponent
        rows={[
          { id: 1, text: "Option 1", isSelected: false },
          { id: 2, text: "Option 2", isSelected: true },
        ]}
        setRows={setRows}
        questionJSON={mockQuestionJSON}
        formSubmitted={false}
        setFormSubmitted={jest.fn()}
      />,
    );

    expect(await axe(container)).toHaveNoViolations();
  });
});
