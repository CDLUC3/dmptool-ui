import { act, fireEvent, render, screen, within, waitFor, cleanup } from '@testing-library/react';
import { MockedProvider } from '@apollo/client/testing/react';
import { InMemoryCache } from '@apollo/client';
import { axe, toHaveNoViolations } from 'jest-axe';
import { useToast } from '@/context/ToastContext';
import CustomizedSectionEdit from '../index';
import {
  CustomizableObjectOwnership,
  MoveCustomQuestionDirection,
  MoveCustomQuestionDocument,
  SectionCustomizationOverview,
} from '@/generated/graphql';

expect.extend(toHaveNoViolations);

// Mock child components
jest.mock('@/components/SectionHeaderEdit', () => {
  /* eslint-disable @typescript-eslint/no-explicit-any */
  const MockSectionHeaderEdit = (props: any) => (
    <div data-testid="section-header-edit">
      <span>{props.title}</span>
      {props.onMoveUp && <button onClick={props.onMoveUp}>Section Move Up</button>}
      {props.onMoveDown && <button onClick={props.onMoveDown}>Section Move Down</button>}
    </div>
  );
  MockSectionHeaderEdit.displayName = 'MockSectionHeaderEdit';
  return MockSectionHeaderEdit;
});

jest.mock('@/components/AddQuestionButton', () => {
  /* eslint-disable @typescript-eslint/no-explicit-any */
  const MockAddQuestionButton = (props: any) => (
    <button data-testid="add-question-btn" data-href={props.href}>
      Add Question
    </button>
  );
  MockAddQuestionButton.displayName = 'MockAddQuestionButton';
  return MockAddQuestionButton;
});

jest.mock('@/components/CustomizedTemplate/CustomizedQuestionEdit', () => {
  /* eslint-disable @typescript-eslint/no-explicit-any */
  const MockCustomizedQuestionEdit = (props: any) => (
    <div data-testid="question-edit-card">
      <span>{props.text}</span>
      {props.questionType === 'CUSTOM' && (
        <>
          <button onClick={() => props.handleDisplayOrderChange(Number(props.id), props.displayOrder - 1)}>
            buttons.moveUp
          </button>
          <button onClick={() => props.handleDisplayOrderChange(Number(props.id), props.displayOrder + 1)}>
            buttons.moveDown
          </button>
        </>
      )}
    </div>
  );
  MockCustomizedQuestionEdit.displayName = 'MockCustomizedQuestionEdit';
  return MockCustomizedQuestionEdit;
});

const mockToast = {
  add: jest.fn(),
};

const mockSetErrorMessages = jest.fn();

const baseSectionData: SectionCustomizationOverview = {
  __typename: 'SectionCustomizationOverview',
  id: 1,
  name: 'Base Section',
  displayOrder: 1,
  sectionType: CustomizableObjectOwnership.Base,
  hasCustomGuidance: true,
  questions: [
    {
      __typename: 'QuestionCustomizationOverview',
      id: 10,
      questionText: 'Q1',
      displayOrder: 2,
      questionType: CustomizableObjectOwnership.Base,
      hasCustomGuidance: true,
      hasCustomSampleAnswer: false,
    },
    {
      __typename: 'QuestionCustomizationOverview',
      id: 11,
      questionText: 'Q2',
      displayOrder: 1,
      questionType: CustomizableObjectOwnership.Base,
      hasCustomGuidance: false,
      hasCustomSampleAnswer: true,
    },
  ],
};

const customSectionData: SectionCustomizationOverview = {
  __typename: 'SectionCustomizationOverview',
  id: 2,
  name: 'Custom Section',
  displayOrder: 2,
  sectionType: CustomizableObjectOwnership.Custom,
  hasCustomGuidance: true,
  questions: [
    {
      __typename: 'QuestionCustomizationOverview',
      id: 20,
      questionText: 'Custom Q1',
      displayOrder: 1,
      questionType: CustomizableObjectOwnership.Custom,
      hasCustomGuidance: false,
      hasCustomSampleAnswer: false,
    },
    {
      __typename: 'QuestionCustomizationOverview',
      id: 21,
      questionText: 'Custom Q2',
      displayOrder: 2,
      questionType: CustomizableObjectOwnership.Custom,
      hasCustomGuidance: false,
      hasCustomSampleAnswer: false,
    },
  ],
};

const moveQuestionSuccessMock = {
  request: {
    query: MoveCustomQuestionDocument,
    variables: {
      input: {
        customQuestionId: 21,
        sectionId: 2,
        sectionType: CustomizableObjectOwnership.Custom,
        pinnedQuestionId: null,
        pinnedQuestionType: null,
        direction: MoveCustomQuestionDirection.Up,
      },
    },
  },
  result: {
    data: {
      moveCustomQuestion: {
        __typename: 'CustomQuestion',
        id: 21,
        guidanceText: 'Custom guidance',
        json: '{"meta":{"schemaVersion":"1.0"},"type":"text","attributes":{"maxLength":255}}',
        migrationStatus: 'OK' as any,
        modified: '2026-03-01 22:46:24',
        pinnedQuestionId: null,
        pinnedQuestionType: null,
        questionText: 'Custom Q2',
        required: false,
        requirementText: 'Custom requirements',
        sampleText: 'Custom sample text',
        sectionId: 2,
        sectionType: CustomizableObjectOwnership.Custom,
        templateCustomizationId: 123,
        useSampleTextAsDefault: false,
        errors: {
          __typename: 'CustomQuestionErrors',
          general: null,
        },
      },
    },
  },
};

const moveQuestionErrorMock = {
  request: {
    query: MoveCustomQuestionDocument,
    variables: {
      input: {
        customQuestionId: 21,
        sectionId: 2,
        sectionType: CustomizableObjectOwnership.Custom,
        pinnedQuestionId: null,
        pinnedQuestionType: null,
        direction: MoveCustomQuestionDirection.Up,
      },
    },
  },
  result: {
    data: {
      moveCustomQuestion: {
        __typename: 'CustomQuestion',
        id: 21,
        guidanceText: null,
        json: null,
        migrationStatus: 'OK' as any,
        modified: null,
        pinnedQuestionId: null,
        pinnedQuestionType: null,
        questionText: 'Custom Q2',
        required: false,
        requirementText: null,
        sampleText: null,
        sectionId: 2,
        sectionType: CustomizableObjectOwnership.Custom,
        templateCustomizationId: 123,
        useSampleTextAsDefault: false,
        errors: {
          __typename: 'CustomQuestionErrors',
          general: 'Failed to move question',
        },
      },
    },
  },
};

const moveQuestionNetworkErrorMock = {
  request: {
    query: MoveCustomQuestionDocument,
    variables: {
      input: {
        customQuestionId: 21,
        sectionId: 2,
        sectionType: CustomizableObjectOwnership.Custom,
        pinnedQuestionId: null,
        pinnedQuestionType: null,
        direction: MoveCustomQuestionDirection.Up,
      },
    },
  },
  error: new Error('Network error'),
};

let apolloCache: InMemoryCache;

describe('CustomizedSectionEdit', () => {
  const mockRefetch = jest.fn().mockResolvedValue({});

  beforeEach(() => {
    apolloCache = new InMemoryCache();
    (useToast as jest.Mock).mockReturnValue(mockToast);
    jest.clearAllMocks();
    mockRefetch.mockResolvedValue({});
  });

  afterEach(async () => {
    await act(async () => {
      await new Promise(resolve => setTimeout(resolve, 50));
    });
    await apolloCache.reset();
    cleanup();
  });

  const renderComponent = (section = baseSectionData, mocks: any[] = []) => {
    return render(
      <MockedProvider
        mocks={mocks}
        cache={apolloCache}
        defaultOptions={{
          query: { fetchPolicy: 'no-cache', errorPolicy: 'all' },
          watchQuery: { fetchPolicy: 'no-cache', errorPolicy: 'all' },
          mutate: { errorPolicy: 'all' }
        }}
      >
        <CustomizedSectionEdit
          section={section}
          displayOrder={0}
          templateCustomizationId="123"
          setErrorMessages={mockSetErrorMessages}
          onMoveUp={jest.fn()}
          onMoveDown={jest.fn()}
          refetch={mockRefetch}
          />
      </MockedProvider>
    );
  };

  describe('Rendering', () => {
    it('should render section header with correct title', () => {
      renderComponent();

      expect(screen.getByTestId('section-header-edit')).toHaveTextContent('Base Section');
    });

    it('should render questions sorted by displayOrder', () => {
      renderComponent();

      const questionCards = screen.getAllByTestId('question-edit-card');
      expect(questionCards).toHaveLength(2);
      expect(questionCards[0]).toHaveTextContent('Q2'); // displayOrder 1
      expect(questionCards[1]).toHaveTextContent('Q1'); // displayOrder 2
    });

    it('should render add question button with correct href', () => {
      renderComponent();

      const addButton = screen.getByTestId('add-question-btn');
      expect(addButton).toHaveAttribute('data-href', '/template/customizations/123/q/new?section_id=1');
    });

    it('should render empty questions array gracefully', () => {
      const emptySection = { ...baseSectionData, questions: [] };
      renderComponent(emptySection);

      expect(screen.queryByTestId('question-edit-card')).not.toBeInTheDocument();
      expect(screen.getByTestId('add-question-btn')).toBeInTheDocument();
    });
  });

  describe('Base Section Behavior', () => {
    it('should not show section move buttons for base section', () => {
      renderComponent(baseSectionData);

      const sectionHeader = screen.getByTestId('section-header-edit');
      expect(within(sectionHeader).queryByText('Section Move Up')).not.toBeInTheDocument();
      expect(within(sectionHeader).queryByText('Section Move Down')).not.toBeInTheDocument();
    });

    it('should not show question move buttons for base questions', () => {
      renderComponent(baseSectionData);

      const questionCards = screen.getAllByTestId('question-edit-card');
      questionCards.forEach(card => {
        expect(within(card).queryByRole('button', { name: /move/i })).not.toBeInTheDocument();
      });
    });
  });

  describe('Custom Section Behavior', () => {
    it('should show section move buttons for custom section', () => {
      renderComponent(customSectionData);

      const sectionHeader = screen.getByTestId('section-header-edit');
      expect(within(sectionHeader).getByText('Section Move Up')).toBeInTheDocument();
      expect(within(sectionHeader).getByText('Section Move Down')).toBeInTheDocument();
    });

    it('should show question move buttons for custom questions', () => {
      renderComponent(customSectionData);

      const questionCards = screen.getAllByTestId('question-edit-card');
      questionCards.forEach(card => {
        expect(within(card).getByRole('button', { name: 'buttons.moveUp' })).toBeInTheDocument();
        expect(within(card).getByRole('button', { name: 'buttons.moveDown' })).toBeInTheDocument();
      });
    });
  });

  describe('Question Reordering', () => {
    it('should successfully move custom question up', async () => {
      renderComponent(customSectionData, [moveQuestionSuccessMock]);

      const questionCards = screen.getAllByTestId('question-edit-card');
      const secondQuestion = questionCards[1]; // Custom Q2

      const moveUpButton = within(secondQuestion).getByRole('button', { name: 'buttons.moveUp' });

      await act(async () => {
        fireEvent.click(moveUpButton);
      });

      await waitFor(() => {
        const updatedCards = screen.getAllByTestId('question-edit-card');
        expect(updatedCards[0]).toHaveTextContent('Custom Q2');
        expect(updatedCards[1]).toHaveTextContent('Custom Q1');
      });
    });

    it('should handle move question error', async () => {
      renderComponent(customSectionData, [moveQuestionErrorMock]);

      const questionCards = screen.getAllByTestId('question-edit-card');
      const secondQuestion = questionCards[1];

      const moveUpButton = within(secondQuestion).getByRole('button', { name: 'buttons.moveUp' });

      await act(async () => {
        fireEvent.click(moveUpButton);
      });

      await waitFor(() => {
        expect(mockSetErrorMessages).toHaveBeenCalledWith(
          expect.any(Function)
        );
      });
    });

    it('should handle network error when moving question', async () => {
      renderComponent(customSectionData, [moveQuestionNetworkErrorMock]);

      const questionCards = screen.getAllByTestId('question-edit-card');
      const secondQuestion = questionCards[1];

      const moveUpButton = within(secondQuestion).getByRole('button', { name: 'buttons.moveUp' });

      await act(async () => {
        fireEvent.click(moveUpButton);
      });

      await waitFor(() => {
        expect(mockSetErrorMessages).toHaveBeenCalledWith(
          expect.any(Function)
        );
      });
    });

    it('should show error toast when trying to move first question up', async () => {
      renderComponent(customSectionData);

      const questionCards = screen.getAllByTestId('question-edit-card');
      const firstQuestion = questionCards[0]; // Custom Q1

      const moveUpButton = within(firstQuestion).getByRole('button', { name: 'buttons.moveUp' });

      await act(async () => {
        fireEvent.click(moveUpButton);
      });

      expect(mockToast.add).toHaveBeenCalledWith(
        'messages.errors.displayOrderAlreadyAtTop',
        { type: 'error' }
      );
    });

    it('should show error toast when trying to move last question down', async () => {
      renderComponent(customSectionData);

      const questionCards = screen.getAllByTestId('question-edit-card');
      const lastQuestion = questionCards[1]; // Custom Q2

      const moveDownButton = within(lastQuestion).getByRole('button', { name: 'buttons.moveDown' });

      await act(async () => {
        fireEvent.click(moveDownButton);
      });

      expect(mockToast.add).toHaveBeenCalledWith(
        'messages.errors.cannotMoveFurtherDown',
        { type: 'error' }
      );
    });

    it('should prevent concurrent reordering operations', async () => {
      // Provide multiple mocks since the test clicks rapidly
      const mocks = [moveQuestionSuccessMock, moveQuestionSuccessMock, moveQuestionSuccessMock];
      renderComponent(customSectionData, mocks);

      const questionCards = screen.getAllByTestId('question-edit-card');
      const secondQuestion = questionCards[1];

      const moveUpButton = within(secondQuestion).getByRole('button', { name: 'buttons.moveUp' });

      // Click multiple times rapidly
      await act(async () => {
        fireEvent.click(moveUpButton);
        fireEvent.click(moveUpButton);
        fireEvent.click(moveUpButton);
      });

      await waitFor(() => {
        const updatedCards = screen.getAllByTestId('question-edit-card');
        expect(updatedCards[0]).toHaveTextContent('Custom Q2');
      });
    });
  });

  describe('Accessibility', () => {
    it('should pass axe accessibility test', async () => {
      const { container } = renderComponent();

      const results = await axe(container);
      expect(results).toHaveNoViolations();
    });

    it('should have proper ARIA labels for questions list', () => {
      renderComponent();

      const questionsList = screen.getByRole('list', { name: 'Questions list' });
      expect(questionsList).toBeInTheDocument();
    });

    it('should announce question movement to screen readers', async () => {
      renderComponent(customSectionData, [moveQuestionSuccessMock]);

      const questionCards = screen.getAllByTestId('question-edit-card');
      const secondQuestion = questionCards[1];

      const moveUpButton = within(secondQuestion).getByRole('button', { name: 'buttons.moveUp' });

      await act(async () => {
        fireEvent.click(moveUpButton);
      });

      await waitFor(() => {
        const announcementRegion = document.querySelector('[aria-live="polite"]');
        expect(announcementRegion).toBeInTheDocument();
        expect(announcementRegion).toHaveTextContent('messages.questionMoved');
      });
    });
  });

  describe('Edge Cases', () => {
    it('should handle null question text gracefully', () => {
      const sectionWithNullText = {
        ...customSectionData,
        questions: [
          {
            ...customSectionData.questions![0],
            questionText: null,
          },
        ],
      };

      renderComponent(sectionWithNullText as any);

      const questionCard = screen.getByTestId('question-edit-card');
      expect(questionCard).toBeInTheDocument();
    });

    it('should clear error messages when reordering', async () => {
      renderComponent(customSectionData, [moveQuestionSuccessMock]);

      const questionCards = screen.getAllByTestId('question-edit-card');
      const secondQuestion = questionCards[1];

      const moveUpButton = within(secondQuestion).getByRole('button', { name: 'buttons.moveUp' });

      await act(async () => {
        fireEvent.click(moveUpButton);
      });

      expect(mockSetErrorMessages).toHaveBeenCalledWith([]);
    });
  });
});
