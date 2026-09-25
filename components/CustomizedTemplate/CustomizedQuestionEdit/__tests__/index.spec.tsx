import React from 'react';
import { render, screen, fireEvent, within } from '@testing-library/react';
import { axe, toHaveNoViolations } from 'jest-axe';
import CustomizedQuestionEdit from '../index';

expect.extend(toHaveNoViolations);

jest.mock('@/i18n/routing', () => ({
  Link: ({ href, children, ...props }: { href: string; children: React.ReactNode }) => (
    <a href={href} {...props}>{children}</a>
  ),
  useRouter: jest.fn(() => ({ push: jest.fn(), replace: jest.fn(), back: jest.fn() })),
  usePathname: jest.fn(() => '/'),
}));

// Mock next-intl
jest.mock('next-intl', () => ({
  useTranslations: () => (key: string) => key,
}));


describe('CustomizedQuestionEdit', () => {
  const mockHandleDisplayOrderChange = jest.fn();

  const baseQuestionProps = {
    id: '1',
    text: 'What is your research question?',
    link: '/template/customizations/123/q/1',
    displayOrder: 1,
    questionType: 'BASE' as const,
    hasCustomGuidance: false,
    hasCustomSampleAnswer: false,
    handleDisplayOrderChange: mockHandleDisplayOrderChange,
  };

  const customQuestionProps = {
    id: '2',
    text: 'Custom organization question?',
    link: '/template/customizations/123/q/2',
    displayOrder: 2,
    questionType: 'CUSTOM' as const,
    hasCustomGuidance: false,
    hasCustomSampleAnswer: false,
    handleDisplayOrderChange: mockHandleDisplayOrderChange,
  };

  beforeEach(() => {
    jest.clearAllMocks();
  });

  describe('Rendering', () => {
    it('should render a base question with correct text', () => {
      render(<CustomizedQuestionEdit {...baseQuestionProps} />);

      expect(screen.getByText('What is your research question?')).toBeInTheDocument();
      expect(screen.getByText('label.funderQuestion')).toBeInTheDocument();
    });

    it('should render a custom question with correct text', () => {
      render(<CustomizedQuestionEdit {...customQuestionProps} />);

      expect(screen.getByText('Custom organization question?')).toBeInTheDocument();
      expect(screen.getByText('label.organizationQuestion')).toBeInTheDocument();
    });

    it('should strip HTML from question text', () => {
      const propsWithHtml = {
        ...baseQuestionProps,
        text: '<p>Question with <strong>HTML</strong> tags</p>',
      };

      render(<CustomizedQuestionEdit {...propsWithHtml} />);

      expect(screen.getByText('Question with HTML tags')).toBeInTheDocument();
    });

    it('should apply organization question styling for CUSTOM questions', () => {
      const { container } = render(<CustomizedQuestionEdit {...customQuestionProps} />);

      const card = container.querySelector('[data-testid="question-edit-card"]');
      expect(card).toHaveClass('organizationQuestion');
    });

    it('should not apply organization question styling for BASE questions', () => {
      const { container } = render(<CustomizedQuestionEdit {...baseQuestionProps} />);

      const card = container.querySelector('[data-testid="question-edit-card"]');
      expect(card).not.toHaveClass('organizationQuestion');
    });
  });

  describe('Base Question Behavior', () => {
    it('should show customize link for base questions', () => {
      render(<CustomizedQuestionEdit {...baseQuestionProps} />);

      const link = screen.getByRole('link', { name: /buttons\.customize/i });
      expect(link).toBeInTheDocument();
      expect(link).toHaveAttribute('href', '/template/customizations/123/q/1');
    });

    it('should display checklist for base questions', () => {
      render(<CustomizedQuestionEdit {...baseQuestionProps} />);

      expect(screen.getByText('checklist.guidance:')).toBeInTheDocument();
      expect(screen.getByText('checklist.sampleText:')).toBeInTheDocument();
    });

    it('should show "not completed" when hasCustomGuidance is false', () => {
      render(<CustomizedQuestionEdit {...baseQuestionProps} hasCustomGuidance={false} />);

      const checklistGroup = screen.getByRole('group', { name: 'Question customization options' });
      expect(within(checklistGroup).getByText('status.notCompleted')).toBeInTheDocument();
    });

    it('should show "completed" when hasCustomGuidance is true', () => {
      render(<CustomizedQuestionEdit {...baseQuestionProps} hasCustomGuidance={true} />);

      const checklistGroup = screen.getByRole('group', { name: 'Question customization options' });
      expect(within(checklistGroup).getByText('status.completed')).toBeInTheDocument();
    });

    it('should show "not added" when hasCustomSampleAnswer is false', () => {
      render(<CustomizedQuestionEdit {...baseQuestionProps} hasCustomSampleAnswer={false} />);

      const checklistGroup = screen.getByRole('group', { name: 'Question customization options' });
      expect(within(checklistGroup).getByText('status.notAdded')).toBeInTheDocument();
    });

    it('should show "added" when hasCustomSampleAnswer is true', () => {
      render(<CustomizedQuestionEdit {...baseQuestionProps} hasCustomSampleAnswer={true} />);

      const checklistGroup = screen.getByRole('group', { name: 'Question customization options' });
      expect(within(checklistGroup).getByText('status.added')).toBeInTheDocument();
    });

    it('should not show move buttons for base questions', () => {
      render(<CustomizedQuestionEdit {...baseQuestionProps} />);

      expect(screen.queryByLabelText(/buttons\.moveUp/i)).not.toBeInTheDocument();
      expect(screen.queryByLabelText(/buttons\.moveDown/i)).not.toBeInTheDocument();
    });
  });

  describe('Custom Question Behavior', () => {
    it('should show edit question link for custom questions', () => {
      render(<CustomizedQuestionEdit {...customQuestionProps} />);

      const link = screen.getByRole('link', { name: /links\.editQuestion/i });
      expect(link).toBeInTheDocument();
      expect(link).toHaveAttribute('href', '/template/customizations/123/q/2');
    });

    it('should not display checklist for custom questions', () => {
      render(<CustomizedQuestionEdit {...customQuestionProps} />);

      expect(screen.queryByText('checklist.guidance:')).not.toBeInTheDocument();
      expect(screen.queryByText('checklist.sampleText:')).not.toBeInTheDocument();
    });

    it('should show move up button for custom questions', () => {
      render(<CustomizedQuestionEdit {...customQuestionProps} />);

      const moveUpButton = screen.getByLabelText(/buttons\.moveUp/i);
      expect(moveUpButton).toBeInTheDocument();
    });

    it('should show move down button for custom questions', () => {
      render(<CustomizedQuestionEdit {...customQuestionProps} />);

      const moveDownButton = screen.getByLabelText(/buttons\.moveDown/i);
      expect(moveDownButton).toBeInTheDocument();
    });

    it('should call handleDisplayOrderChange with correct arguments when move up is clicked', () => {
      render(<CustomizedQuestionEdit {...customQuestionProps} />);

      const moveUpButton = screen.getByLabelText(/buttons\.moveUp/i);
      fireEvent.click(moveUpButton);

      expect(mockHandleDisplayOrderChange).toHaveBeenCalledWith(2, 1);
      expect(mockHandleDisplayOrderChange).toHaveBeenCalledTimes(1);
    });

    it('should call handleDisplayOrderChange with correct arguments when move down is clicked', () => {
      render(<CustomizedQuestionEdit {...customQuestionProps} />);

      const moveDownButton = screen.getByLabelText(/buttons\.moveDown/i);
      fireEvent.click(moveDownButton);

      expect(mockHandleDisplayOrderChange).toHaveBeenCalledWith(2, 3);
      expect(mockHandleDisplayOrderChange).toHaveBeenCalledTimes(1);
    });

    it('should handle multiple clicks on move buttons', () => {
      render(<CustomizedQuestionEdit {...customQuestionProps} />);

      const moveUpButton = screen.getByLabelText(/buttons\.moveUp/i);
      fireEvent.click(moveUpButton);
      fireEvent.click(moveUpButton);

      expect(mockHandleDisplayOrderChange).toHaveBeenCalledTimes(2);
    });
  });

  describe('Accessibility', () => {
    it('should pass axe accessibility test for base question', async () => {
      const { container } = render(<CustomizedQuestionEdit {...baseQuestionProps} />);

      const results = await axe(container);
      expect(results).toHaveNoViolations();
    });

    it('should pass axe accessibility test for custom question', async () => {
      const { container } = render(<CustomizedQuestionEdit {...customQuestionProps} />);

      const results = await axe(container);
      expect(results).toHaveNoViolations();
    });

    it('should have proper ARIA label for question content', () => {
      render(<CustomizedQuestionEdit {...baseQuestionProps} id="123" />);

      const content = document.querySelector('[aria-labelledby="question-123"]');
      expect(content).toBeInTheDocument();

      const label = document.getElementById('question-123');
      expect(label).toBeInTheDocument();
    });

    it('should have proper ARIA label for actions group', () => {
      render(<CustomizedQuestionEdit {...customQuestionProps} />);

      const actionsGroup = screen.getByRole('group', { name: 'Question actions' });
      expect(actionsGroup).toBeInTheDocument();
    });

    it('should have descriptive aria-label for customize link', () => {
      render(<CustomizedQuestionEdit {...baseQuestionProps} />);

      const link = screen.getByRole('link', { name: /buttons\.customize: What is your research question\?/i });
      expect(link).toBeInTheDocument();
    });

    it('should have descriptive aria-label for edit link', () => {
      render(<CustomizedQuestionEdit {...customQuestionProps} />);

      const link = screen.getByRole('link', { name: /links\.editQuestion: Custom organization question\?/i });
      expect(link).toBeInTheDocument();
    });

    it('should have checklist with proper role and label', () => {
      render(<CustomizedQuestionEdit {...baseQuestionProps} />);

      const checklist = screen.getByRole('group', { name: 'Question customization options' });
      expect(checklist).toBeInTheDocument();
    });
  });

  describe('Edge Cases', () => {
    it('should handle empty question text', () => {
      const propsWithEmptyText = {
        ...baseQuestionProps,
        text: '',
      };

      render(<CustomizedQuestionEdit {...propsWithEmptyText} />);

      const card = screen.getByTestId('question-edit-card');
      expect(card).toBeInTheDocument();
    });

    it('should handle question with only HTML tags', () => {
      const propsWithOnlyHtml = {
        ...baseQuestionProps,
        text: '<p></p><div></div>',
      };

      render(<CustomizedQuestionEdit {...propsWithOnlyHtml} />);

      const card = screen.getByTestId('question-edit-card');
      expect(card).toBeInTheDocument();
    });

    it('should handle displayOrder of 0', () => {
      render(<CustomizedQuestionEdit {...customQuestionProps} displayOrder={0} />);

      const moveUpButton = screen.getByLabelText(/buttons\.moveUp/i);
      fireEvent.click(moveUpButton);

      expect(mockHandleDisplayOrderChange).toHaveBeenCalledWith(2, -1);
    });

    it('should handle large displayOrder values', () => {
      render(<CustomizedQuestionEdit {...customQuestionProps} displayOrder={1000} />);

      const moveDownButton = screen.getByLabelText(/buttons\.moveDown/i);
      fireEvent.click(moveDownButton);

      expect(mockHandleDisplayOrderChange).toHaveBeenCalledWith(2, 1001);
    });

    it('should handle both customization options completed', () => {
      render(
        <CustomizedQuestionEdit
          {...baseQuestionProps}
          hasCustomGuidance={true}
          hasCustomSampleAnswer={true}
        />
      );

      const checklistGroup = screen.getByRole('group', { name: 'Question customization options' });
      const completedItems = within(checklistGroup).getAllByText(/status\.(completed|added)/i);
      expect(completedItems).toHaveLength(2);
    });

    it('should handle neither customization option completed', () => {
      render(
        <CustomizedQuestionEdit
          {...baseQuestionProps}
          hasCustomGuidance={false}
          hasCustomSampleAnswer={false}
        />
      );

      const checklistGroup = screen.getByRole('group', { name: 'Question customization options' });
      expect(within(checklistGroup).getByText('status.notCompleted')).toBeInTheDocument();
      expect(within(checklistGroup).getByText('status.notAdded')).toBeInTheDocument();
    });

    it('should handle numeric id as string', () => {
      render(<CustomizedQuestionEdit {...baseQuestionProps} id="999" />);

      const card = screen.getByTestId('question-edit-card');
      expect(card).toBeInTheDocument();
    });

    it('should render with very long question text', () => {
      const longText = 'A'.repeat(500);
      render(<CustomizedQuestionEdit {...baseQuestionProps} text={longText} />);

      expect(screen.getByText(longText)).toBeInTheDocument();
    });

    it('should handle special characters in question text', () => {
      const specialText = 'Question with special chars: @#$%^&*()[]{}|\\/?><,.:;"\'-_+=~`';
      render(<CustomizedQuestionEdit {...baseQuestionProps} text={specialText} />);

      expect(screen.getByText(/Question with special chars:/)).toBeInTheDocument();
    });
  });

  describe('Link Behavior', () => {
    it('should have correct href for base question link', () => {
      render(<CustomizedQuestionEdit {...baseQuestionProps} link="/custom/path/123" />);

      const link = screen.getByRole('link', { name: /buttons\.customize/i });
      expect(link).toHaveAttribute('href', '/custom/path/123');
    });

    it('should have correct href for custom question link', () => {
      render(<CustomizedQuestionEdit {...customQuestionProps} link="/custom/edit/456" />);

      const link = screen.getByRole('link', { name: /links\.editQuestion/i });
      expect(link).toHaveAttribute('href', '/custom/edit/456');
    });
  });
});
