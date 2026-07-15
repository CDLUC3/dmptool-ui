import React from "react";
import { act, render, screen } from "@testing-library/react";
import { axe, toHaveNoViolations } from "jest-axe";
import FileSize from "../FileSize";
import { FileSizeFieldProps } from "@/app/types";
import { ResearchOutputTableColumnsEnum } from "@dmptool/types";

expect.extend(toHaveNoViolations);

describe("FileSize", () => {
  const mockAvailableUnits = [
    {
      label: "Bytes",
      value: "bytes",
      selected: false
    },
    {
      label: "Kilobytes",
      value: "kb",
      selected: false
    },
    {
      label: "Megabytes",
      value: "mb",
      selected: false
    },
  ];

  const defaultProps: FileSizeFieldProps = {
    field: {
      id: "fileSize",
      commonStandardId: ResearchOutputTableColumnsEnum.enum.byte_size,
      label: "File Size",
      enabled: true,
      byteSizeConfig: {
        selectedUnit: "bytes",
        availableUnits: mockAvailableUnits,
      },
      byteSizeFieldConfig: {
        enabled: false,
        maxByteSize: Number.MAX_SAFE_INTEGER,
      }
    },
  };

  beforeEach(() => {
    jest.clearAllMocks();
  });

  type RenderComponentProps = Partial<FileSizeFieldProps>;

  const renderComponent = (props: RenderComponentProps = {}) => {
    return render(
      <FileSize
        {...defaultProps}
        {...props}
      />,
    );
  };

  describe("Rendering", () => {
    it("should render without crashing", () => {
      renderComponent();
      expect(screen.getByText("researchOutput.fileSize.legends.default")).toBeInTheDocument();
    });

    it("should render with correct initial structure", () => {
      renderComponent();
      expect(screen.getByText("researchOutput.fileSize.legends.default")).toBeInTheDocument();
    });

    it("should pass axe accessibility test", async () => {
      const { container } = render(<FileSize {...defaultProps} />);
      await act(async () => {
        const results = await axe(container);
        expect(results).toHaveNoViolations();
      });
    });

    describe("File Size Units", () => {
      it("should display expected file size units", () => {
        renderComponent({
          field: {
            ...defaultProps.field,
          },
        });
        expect(screen.queryByText("researchOutput.fileSize.legends.myFileSizes")).not.toBeInTheDocument();
        expect(screen.queryByLabelText("researchOutput.fileSize.labels.enterFileSize")).not.toBeInTheDocument();
      });
    });

    describe("Edge Cases", () => {
      it("should display all 3 available file size units", async () => {
        renderComponent({
          field: {
            ...defaultProps.field,
          },
        });

        expect(screen.getByText("Bytes")).toBeInTheDocument();
        expect(screen.getByText("Kilobytes")).toBeInTheDocument();
        expect(screen.getByText("Megabytes")).toBeInTheDocument();
      });
    });
  });
});
