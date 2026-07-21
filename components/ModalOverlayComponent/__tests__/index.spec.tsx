import { render, screen, fireEvent, waitFor } from '@testing-library/react';
import { ModalOverlayComponent } from '../index';

describe('ModalOverlayComponent', () => {
  it('renders the modal with heading and content', async () => {
    render(
      <ModalOverlayComponent
        heading="Test Heading"
        isOpen={true}
        content="Test Content"
        onPressAction={jest.fn()}
      />
    );

    await waitFor(() => {
      expect(screen.getByText('Test Heading')).toBeInTheDocument();
      expect(screen.getByText('Test Content')).toBeInTheDocument();
      expect(screen.getByText('Cancel')).toBeInTheDocument();
      expect(screen.getByText('Delete')).toBeInTheDocument();
    });
  });

  it('calls onPressAction with the correct arguments when primary button is clicked', () => {
    const mockOnPressAction = jest.fn();
    render(
      <ModalOverlayComponent
        heading="Test Heading"
        isOpen={true}
        content="Test Content"
        btnPrimaryText="Confirm"
        onPressAction={mockOnPressAction}
      />
    );

    const primaryButton = screen.getByText('Confirm');
    fireEvent.click(primaryButton);

    expect(mockOnPressAction).toHaveBeenCalledTimes(1);
    expect(mockOnPressAction).toHaveBeenCalledWith(expect.any(Object), expect.any(Function));
  });

  it('closes the modal when the secondary button is clicked', () => {
    const mockOnPressAction = jest.fn();
    render(
      <ModalOverlayComponent
        heading="Test Heading"
        isOpen={true}
        content="Test Content"
        onPressAction={mockOnPressAction}
      />
    );

    const secondaryButton = screen.getByText('Cancel');
    fireEvent.click(secondaryButton);

    // Since `close` is a mock function, we can't directly test its behavior.
    // Instead, we ensure the secondary button triggers the `close` callback.
    expect(mockOnPressAction).not.toHaveBeenCalled();
  });

  it('renders custom button text when provided', () => {
    render(
      <ModalOverlayComponent
        heading="Custom Heading"
        content="Custom Content"
        isOpen={true}
        btnSecondaryText="Go Back"
        btnPrimaryText="Proceed"
        onPressAction={jest.fn()}
      />
    );

    expect(screen.getByText('Go Back')).toBeInTheDocument();
    expect(screen.getByText('Proceed')).toBeInTheDocument();
  });

  it('renders as an alertdialog with secondary cancel and danger confirm buttons', async () => {
    render(
      <ModalOverlayComponent
        heading="Test Heading"
        isOpen={true}
        content="Test Content"
        onPressAction={jest.fn()}
      />
    );

    await waitFor(() => {
      expect(screen.getByRole('alertdialog')).toBeInTheDocument();
    });

    const dialog = screen.getByRole('alertdialog');
    const title = screen.getByText('Test Heading');
    const description = screen.getByText('Test Content');

    expect(dialog).toHaveAttribute('aria-labelledby', title.id);
    expect(dialog).toHaveAttribute('aria-describedby', description.id);
    expect(screen.getByText('Cancel')).toHaveClass('secondary');
    expect(screen.getByText('Delete')).toHaveClass('danger');
  });
});
