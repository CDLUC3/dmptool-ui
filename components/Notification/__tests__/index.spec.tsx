import { render, screen, waitFor } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import NotificationHeader from '../index';

const defaultProps = {
  title: 'Feedback mode',
  children: <p>You can view this plan and leave comments.</p>,
};

const modalProps = {
  title: 'Mark feedback as done?',
  content: (
    <>
      <p>The following:</p>
      <ul>
        <li>This is not reversible</li>
        <li>It will happen right away</li>
      </ul>
    </>
  ),
  cancelButtonText: 'Cancel',
  confirmButtonText: 'Mark as done',
};

describe('NotificationHeader', () => {
  describe('rendering', () => {
    it('should render the title', () => {
      render(<NotificationHeader {...defaultProps} />);
      expect(screen.getByRole('heading', { level: 2, name: 'Feedback mode' })).toBeInTheDocument();
    });

    it('should render children', () => {
      render(<NotificationHeader {...defaultProps} />);
      expect(screen.getByText('You can view this plan and leave comments.')).toBeInTheDocument();
    });

    it('should not render action button when onMarkAsDone is not provided', () => {
      render(<NotificationHeader {...defaultProps} modal={modalProps} />);
      expect(screen.queryByRole('button')).not.toBeInTheDocument();
    });

    it('should not render action button when modal is not provided', () => {
      render(<NotificationHeader {...defaultProps} onMarkAsDone={jest.fn()} />);
      expect(screen.queryByRole('button')).not.toBeInTheDocument();
    });

    it('should render action button when both onMarkAsDone and modal are provided', () => {
      render(
        <NotificationHeader
          {...defaultProps}
          actionButtonText="Mark as done"
          modal={modalProps}
          onMarkAsDone={jest.fn()}
        />
      );
      expect(screen.getByRole('button', { name: 'Mark as done' })).toBeInTheDocument();
    });
  });

  describe('modal', () => {
    const user = userEvent.setup();

    const renderWithModal = (onMarkAsDone = jest.fn(), overrides = {}) => {
      return render(
        <NotificationHeader
          {...defaultProps}
          actionButtonText="Mark as done"
          modal={{ ...modalProps, ...overrides }}
          onMarkAsDone={onMarkAsDone}
        />
      );
    };

    it('should not show modal content initially', () => {
      renderWithModal();
      expect(screen.queryByRole('heading', { level: 3 })).not.toBeInTheDocument();
    });

    it('should open modal when action button is clicked', async () => {
      renderWithModal();
      await user.click(screen.getByRole('button', { name: 'Mark as done' }));
      expect(screen.getByRole('heading', { level: 3, name: 'Mark feedback as done?' })).toBeInTheDocument();
    });

    it('should render modal content', async () => {
      renderWithModal();
      await user.click(screen.getByRole('button', { name: 'Mark as done' }));
      expect(screen.getByText('This is not reversible')).toBeInTheDocument();
      expect(screen.getByText('It will happen right away')).toBeInTheDocument();
    });

    it('should close modal when cancel button is clicked', async () => {
      renderWithModal();
      await user.click(screen.getByRole('button', { name: 'Mark as done' }));
      await user.click(screen.getByRole('button', { name: 'Cancel' }));
      await waitFor(() => {
        expect(screen.queryByRole('heading', { level: 3 })).not.toBeInTheDocument();
      });
    });

    it('should call onMarkAsDone and close modal when confirm button is clicked', async () => {
      const onMarkAsDone = jest.fn();
      renderWithModal(onMarkAsDone);
      await user.click(screen.getByRole('button', { name: 'Mark as done' }));
      await user.click(screen.getByRole('button', { name: 'Mark as done' }));
      await waitFor(() => {
        expect(onMarkAsDone).toHaveBeenCalledTimes(1);
        expect(onMarkAsDone).toHaveBeenCalledWith(true); // Default sendEmail value is true
        expect(screen.queryByRole('heading', { level: 3 })).not.toBeInTheDocument();
      });
    });

    it('should not call onMarkAsDone when cancel is clicked', async () => {
      const onMarkAsDone = jest.fn();
      renderWithModal(onMarkAsDone);
      await user.click(screen.getByRole('button', { name: 'Mark as done' }));
      await user.click(screen.getByRole('button', { name: 'Cancel' }));
      expect(onMarkAsDone).not.toHaveBeenCalled();
    });
  });

  describe('isSubmitting state', () => {
    const user = userEvent.setup();

    const renderSubmitting = (isSubmitting: boolean, submittingText?: string) => {
      return render(
        <NotificationHeader
          {...defaultProps}
          actionButtonText="Mark as done"
          modal={{ ...modalProps, isSubmitting, submittingText }}
          onMarkAsDone={jest.fn()}
        />
      );
    };

    it('should disable confirm button when isSubmitting is true', async () => {
      renderSubmitting(true);
      await user.click(screen.getByRole('button', { name: 'Mark as done' }));
      expect(screen.getByRole('button', { name: 'Mark as done' })).toBeDisabled();
    });

    it('should show submittingText on confirm button when provided and isSubmitting is true', async () => {
      renderSubmitting(true, 'Saving...');
      await user.click(screen.getByRole('button', { name: 'Mark as done' }));
      expect(screen.getByRole('button', { name: 'Saving...' })).toBeInTheDocument();
    });

    it('should fall back to confirmButtonText when isSubmitting is true but submittingText is not provided', async () => {
      renderSubmitting(true);
      await user.click(screen.getByRole('button', { name: 'Mark as done' }));
      expect(screen.getByRole('button', { name: 'Mark as done' })).toBeInTheDocument();
    });

    it('should enable confirm button when isSubmitting is false', async () => {
      renderSubmitting(false);
      await user.click(screen.getByRole('button', { name: 'Mark as done' }));
      expect(screen.getByRole('button', { name: 'Mark as done' })).not.toBeDisabled();
    });
  });

  describe('emailPrompt', () => {
    const user = userEvent.setup();

    const emailPromptOverrides = {
      emailPromptLabel: 'Send email to requestor?',
      emailPromptYes: 'Yes',
      emailPromptNo: 'No',
    };

    const renderWithEmailPrompt = (onMarkAsDone = jest.fn()) => {
      return render(
        <NotificationHeader
          {...defaultProps}
          actionButtonText="Mark as done"
          modal={{ ...modalProps, ...emailPromptOverrides }}
          onMarkAsDone={onMarkAsDone}
        />
      );
    };

    it('should not render email prompt when emailPromptLabel is not provided', async () => {
      render(
        <NotificationHeader
          {...defaultProps}
          actionButtonText="Mark as done"
          modal={modalProps}
          onMarkAsDone={jest.fn()}
        />
      );
      await user.click(screen.getByRole('button', { name: 'Mark as done' }));
      expect(screen.queryByRole('radio')).not.toBeInTheDocument();
    });

    it('should render email prompt radio buttons when emailPromptLabel is provided', async () => {
      renderWithEmailPrompt();
      await user.click(screen.getByRole('button', { name: 'Mark as done' }));
      expect(screen.getByRole('radio', { name: 'Yes' })).toBeInTheDocument();
      expect(screen.getByRole('radio', { name: 'No' })).toBeInTheDocument();
    });

    it('should default to Yes being selected', async () => {
      renderWithEmailPrompt();
      await user.click(screen.getByRole('button', { name: 'Mark as done' }));
      expect(screen.getByRole('radio', { name: 'Yes' })).toBeChecked();
      expect(screen.getByRole('radio', { name: 'No' })).not.toBeChecked();
    });

    it('should call onMarkAsDone with true when Yes is selected and confirmed', async () => {
      const onMarkAsDone = jest.fn();
      renderWithEmailPrompt(onMarkAsDone);
      await user.click(screen.getByRole('button', { name: 'Mark as done' }));
      // Yes is already selected by default, just confirm
      await user.click(screen.getByRole('button', { name: 'Mark as done' }));
      await waitFor(() => {
        expect(onMarkAsDone).toHaveBeenCalledWith(true);
      });
    });

    it('should call onMarkAsDone with false when No is selected and confirmed', async () => {
      const onMarkAsDone = jest.fn();
      renderWithEmailPrompt(onMarkAsDone);
      await user.click(screen.getByRole('button', { name: 'Mark as done' }));
      await user.click(screen.getByRole('radio', { name: 'No' }));
      await user.click(screen.getByRole('button', { name: 'Mark as done' }));
      await waitFor(() => {
        expect(onMarkAsDone).toHaveBeenCalledWith(false);
      });
    });

    it('should reset to Yes after modal is closed and reopened', async () => {
      renderWithEmailPrompt();
      // Open, switch to No, close
      await user.click(screen.getByRole('button', { name: 'Mark as done' }));
      await user.click(screen.getByRole('radio', { name: 'No' }));
      await user.click(screen.getByRole('button', { name: 'Cancel' }));
      // Reopen and check Yes is selected again
      await user.click(screen.getByRole('button', { name: 'Mark as done' }));
      await waitFor(() => {
        expect(screen.getByRole('radio', { name: 'Yes' })).toBeChecked();
      });
    });
  });
});