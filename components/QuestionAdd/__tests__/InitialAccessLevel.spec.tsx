import React from 'react';
import { act, render, screen } from '@testing-library/react';
import { axe, toHaveNoViolations } from 'jest-axe';
import InitialAccessLevelField from '../InitialAccessLevel';
import { AccessLevelsFieldProps } from '@/app/types';
import { ResearchOutputTableColumnsEnum } from "@dmptool/types";

expect.extend(toHaveNoViolations);

describe('InitialAccessLevelField', () => {
  const mockDefaultAccessLevels = [
    { label: 'Controlled access', value: 'controlled', description: 'Restricts access to certain areas', selected: false },
    { label: 'Unrestricted access', value: 'open', description: 'Allows access to all areas', selected: false },
    { label: 'Other', value: 'other', description: 'Other type of access', selected: false },
  ];

  const defaultProps: AccessLevelsFieldProps & { defaultAccessLevels: typeof mockDefaultAccessLevels } = {
    field: {
      id: 'accessLevels',
      commonStandardId: ResearchOutputTableColumnsEnum.enum.data_access,
      label: 'Access Levels',
      enabled: true,
      accessLevelsConfig: {
        mode: 'defaults',
        customLevels: [{ label: 'Controlled access', value: 'controlled', description: 'Restricts access to certain areas', selected: false }],
        selectedDefaults: [],
      },
    },
    defaultAccessLevels: mockDefaultAccessLevels,
  };

  beforeEach(() => {
    jest.clearAllMocks();
  });

  type RenderComponentProps = Partial<AccessLevelsFieldProps> & {
    defaultAccessLevels?: typeof mockDefaultAccessLevels
  };

  const renderComponent = (props: RenderComponentProps = {}) => {
    return render(<InitialAccessLevelField {...defaultProps} {...props} />);
  };

  describe('Rendering', () => {
    it('should render without crashing', () => {
      renderComponent();
      //expect(screen.getByLabelText('researchOutput.accessLevels.labels.defineAccessLevels')).toBeInTheDocument();
      expect(screen.getByText('researchOutput.accessLevels.legends.default')).toBeInTheDocument();

    });

    it('should render with correct initial structure', () => {
      renderComponent();
      //expect(screen.getByLabelText('researchOutput.accessLevels.labels.defineAccessLevels')).toBeInTheDocument();
      expect(screen.getByText('researchOutput.accessLevels.legends.default')).toBeInTheDocument();
    });

    it('should pass axe accessibility test', async () => {
      const { container } = render(
        <InitialAccessLevelField {...defaultProps} />
      );
      await act(async () => {
        const results = await axe(container);
        expect(results).toHaveNoViolations();
      });
    });

    describe('access levels', () => {

      it('should display expected access level headings', () => {
        renderComponent({
          field: {
            ...defaultProps.field,
          },
        });
        expect(screen.queryByText('researchOutput.accessLevels.legends.myAccessLevels')).not.toBeInTheDocument();
        expect(screen.queryByLabelText('researchOutput.accessLevels.labels.enterAccessLevel')).not.toBeInTheDocument();
      });
    });

    describe('Props Validation', () => {
      it('should render info buttons for each access level', () => {
        renderComponent();

        const infoButtons = screen.getAllByLabelText('labels.clickForMoreInfo');
        expect(infoButtons).toHaveLength(mockDefaultAccessLevels.length);
      });
    });

    describe('Edge Cases', () => {
      it('should display all 3 default access levels', async () => {
        renderComponent({
          field: {
            ...defaultProps.field,
          },
        });

        expect(screen.getByText('Open Access')).toBeInTheDocument();
        expect(screen.getByText('Restricted Access')).toBeInTheDocument();
        expect(screen.getByText('Other')).toBeInTheDocument();


      });
    });
  });
});
