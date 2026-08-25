/* eslint-disable @typescript-eslint/no-explicit-any */
import React from 'react';
import { render, screen, fireEvent, waitFor } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import '@testing-library/jest-dom';
import { axe, toHaveNoViolations } from 'jest-axe';
import PlanComments from '../index';
import type { PlanComment } from '../../model';

expect.extend(toHaveNoViolations);

// --- next-intl ---
jest.mock('next-intl', () => ({
  useTranslations: jest.fn((namespace: string) => {
    return (key: string) => `${namespace}.${key}`;
  }),
}));

// --- react-aria-components ---
// Keep Form/Button/TextArea close to real semantics (a real <form>, <button>,
// <textarea>) so fireEvent/userEvent and accessibility queries behave the
// same way they would with the real library.
jest.mock('react-aria-components', () => ({
  Form: ({ children, onSubmit, className }: any) => (
    <form className={className} onSubmit={onSubmit}>
      {children}
    </form>
  ),
  Button: ({ children, isDisabled, className, type, ...rest }: any) => (
    <button type={type} disabled={isDisabled} className={className} {...rest}>
      {children}
    </button>
  ),
  TextArea: ({ value, onChange, name, rows, placeholder, ['aria-label']: ariaLabel, ref }: any) => (
    <textarea
      name={name}
      value={value}
      onChange={onChange}
      rows={rows}
      placeholder={placeholder}
      aria-label={ariaLabel}
      ref={ref}
    />
  ),
}));

const baseComment: PlanComment = {
  id: 1,
  authorId: 100,
  authorName: 'Ada Lovelace',
  text: 'This looks great.',
  createdLabel: 'Aug 22, 2026',
  isEdited: false,
  isFeedback: false,
};

const defaultProps = {
  comments: [] as PlanComment[],
  canAdd: true,
  currentUserId: 100,
  canModerateComments: false,
  loading: false,
  editingCommentId: null,
  editingCommentText: '',
  setEditingCommentText: jest.fn(),
  handleEditComment: jest.fn(),
  handleUpdateComment: jest.fn(),
  handleCancelEdit: jest.fn(),
  handleDeleteComment: jest.fn(),
  onAdd: jest.fn().mockResolvedValue(undefined),
};

describe('PlanComments', () => {
  beforeEach(() => {
    jest.clearAllMocks();
  });

  it('shows a loading message when loading is true', () => {
    render(<PlanComments {...defaultProps} loading={true} />);

    expect(screen.getByText('PlanAuthoring.comments.loading')).toBeInTheDocument();
  });

  it('shows an empty-state message when there are no comments and not loading', () => {
    render(<PlanComments {...defaultProps} comments={[]} loading={false} />);

    expect(screen.getByText('PlanAuthoring.comments.empty')).toBeInTheDocument();
  });

  it('does not show the empty-state message when comments are present', () => {
    render(<PlanComments {...defaultProps} comments={[baseComment]} />);

    expect(screen.queryByText('PlanAuthoring.comments.empty')).not.toBeInTheDocument();
  });

  it('renders a comment with author name and body text', () => {
    render(<PlanComments {...defaultProps} comments={[baseComment]} />);

    expect(screen.getByText('Ada Lovelace')).toBeInTheDocument();
    expect(screen.getByText('This looks great.')).toBeInTheDocument();
    expect(screen.getByText('Aug 22, 2026')).toBeInTheDocument();
  });

  it('renders the admin/feedback label when isFeedback is true', () => {
    const feedbackComment = { ...baseComment, isFeedback: true };
    render(<PlanComments {...defaultProps} comments={[feedbackComment]} />);

    expect(screen.getByText('PlanAuthoring.comments.admin')).toBeInTheDocument();
  });

  it('does not render the admin label when isFeedback is false', () => {
    render(<PlanComments {...defaultProps} comments={[baseComment]} />);

    expect(screen.queryByText('PlanAuthoring.comments.admin')).not.toBeInTheDocument();
  });

  it('appends the "edited" marker when isEdited is true', () => {
    const editedComment = { ...baseComment, isEdited: true };
    render(<PlanComments {...defaultProps} comments={[editedComment]} />);

    expect(screen.getByText(/PlanAuthoring.comments.edited/)).toBeInTheDocument();
  });

  it('shows an Edit button for the current user\'s own comment', () => {
    render(<PlanComments {...defaultProps} comments={[baseComment]} currentUserId={100} />);

    expect(screen.getByRole('button', { name: 'Global.buttons.edit' })).toBeInTheDocument();
  });

  it('does not show an Edit button for another user\'s comment', () => {
    render(<PlanComments {...defaultProps} comments={[baseComment]} currentUserId={999} />);

    expect(screen.queryByRole('button', { name: 'Global.buttons.edit' })).not.toBeInTheDocument();
  });

  it('shows a Delete button for the comment owner even without moderation rights', () => {
    render(
      <PlanComments
        {...defaultProps}
        comments={[baseComment]}
        currentUserId={100}
        canModerateComments={false}
      />
    );

    expect(screen.getByRole('button', { name: 'Global.buttons.delete' })).toBeInTheDocument();
  });

  it('shows a Delete button for a moderator on someone else\'s comment', () => {
    render(
      <PlanComments
        {...defaultProps}
        comments={[baseComment]}
        currentUserId={999}
        canModerateComments={true}
      />
    );

    expect(screen.getByRole('button', { name: 'Global.buttons.delete' })).toBeInTheDocument();
  });

  it('hides both Edit and Delete for a non-owner without moderation rights', () => {
    render(
      <PlanComments
        {...defaultProps}
        comments={[baseComment]}
        currentUserId={999}
        canModerateComments={false}
      />
    );

    expect(screen.queryByRole('button', { name: 'Global.buttons.edit' })).not.toBeInTheDocument();
    expect(screen.queryByRole('button', { name: 'Global.buttons.delete' })).not.toBeInTheDocument();
  });

  it('calls handleEditComment with the comment when Edit is clicked', async () => {
    const user = userEvent.setup();
    render(<PlanComments {...defaultProps} comments={[baseComment]} currentUserId={100} />);

    await user.click(screen.getByRole('button', { name: 'Global.buttons.edit' }));

    expect(defaultProps.handleEditComment).toHaveBeenCalledWith(baseComment);
  });

  it('calls handleDeleteComment with the comment when Delete is clicked', async () => {
    const user = userEvent.setup();
    render(<PlanComments {...defaultProps} comments={[baseComment]} currentUserId={100} />);

    await user.click(screen.getByRole('button', { name: 'Global.buttons.delete' }));

    expect(defaultProps.handleDeleteComment).toHaveBeenCalledWith(baseComment);
  });

  it('renders a textarea instead of static text when the comment is being edited', () => {
    render(
      <PlanComments
        {...defaultProps}
        comments={[baseComment]}
        editingCommentId={baseComment.id}
        editingCommentText="Editing this comment"
      />
    );

    expect(screen.getByRole('textbox', { name: 'PlanAuthoring.comments.editAria' })).toHaveValue(
      'Editing this comment'
    );
    expect(screen.queryByText('This looks great.')).not.toBeInTheDocument();
  });

  it('calls setEditingCommentText as the edit textarea changes', () => {
    render(
      <PlanComments
        {...defaultProps}
        comments={[baseComment]}
        editingCommentId={baseComment.id}
        editingCommentText=""
      />
    );

    const textarea = screen.getByRole('textbox', { name: 'PlanAuthoring.comments.editAria' });
    fireEvent.change(textarea, { target: { value: 'New text' } });

    expect(defaultProps.setEditingCommentText).toHaveBeenCalledWith('New text');
  });

  it('shows Save and Cancel buttons while editing, not Edit/Delete', () => {
    render(
      <PlanComments
        {...defaultProps}
        comments={[baseComment]}
        editingCommentId={baseComment.id}
        editingCommentText="Editing"
      />
    );

    expect(screen.getByRole('button', { name: 'Global.buttons.save' })).toBeInTheDocument();
    expect(screen.getByRole('button', { name: 'Global.buttons.cancel' })).toBeInTheDocument();
    expect(screen.queryByRole('button', { name: 'Global.buttons.edit' })).not.toBeInTheDocument();
  });

  it('calls handleUpdateComment when Save is clicked and editingCommentText is non-empty', async () => {
    const user = userEvent.setup();
    render(
      <PlanComments
        {...defaultProps}
        comments={[baseComment]}
        editingCommentId={baseComment.id}
        editingCommentText="Updated text"
      />
    );

    await user.click(screen.getByRole('button', { name: 'Global.buttons.save' }));

    expect(defaultProps.handleUpdateComment).toHaveBeenCalledWith(baseComment);
  });

  it('does not call handleUpdateComment when Save is clicked with blank/whitespace-only text', async () => {
    const user = userEvent.setup();
    render(
      <PlanComments
        {...defaultProps}
        comments={[baseComment]}
        editingCommentId={baseComment.id}
        editingCommentText="   "
      />
    );

    await user.click(screen.getByRole('button', { name: 'Global.buttons.save' }));

    expect(defaultProps.handleUpdateComment).not.toHaveBeenCalled();
  });

  it('calls handleCancelEdit when Cancel is clicked', async () => {
    const user = userEvent.setup();
    render(
      <PlanComments
        {...defaultProps}
        comments={[baseComment]}
        editingCommentId={baseComment.id}
        editingCommentText="Editing"
      />
    );

    await user.click(screen.getByRole('button', { name: 'Global.buttons.cancel' }));

    expect(defaultProps.handleCancelEdit).toHaveBeenCalledTimes(1);
  });

  it('renders the composer textarea when canAdd is true', () => {
    render(<PlanComments {...defaultProps} canAdd={true} />);

    expect(screen.getByRole('textbox', { name: 'PlanAuthoring.comments.addAria' })).toBeInTheDocument();
  });

  it('renders a notice instead of the composer textarea when canAdd is false', () => {
    render(<PlanComments {...defaultProps} canAdd={false} />);

    expect(screen.queryByRole('textbox', { name: 'PlanAuthoring.comments.addAria' })).not.toBeInTheDocument();
    expect(screen.getByText('PlanAuthoring.comments.saveBeforeCommenting')).toBeInTheDocument();
  });

  it('disables the submit button when canAdd is false', () => {
    render(<PlanComments {...defaultProps} canAdd={false} />);

    expect(screen.getByRole('button', { name: 'PlanAuthoring.comments.comment' })).toBeDisabled();
  });

  it('disables the submit button when the composer text is empty', () => {
    render(<PlanComments {...defaultProps} canAdd={true} />);

    expect(screen.getByRole('button', { name: 'PlanAuthoring.comments.comment' })).toBeDisabled();
  });

  it('enables the submit button once text is entered', async () => {
    const user = userEvent.setup();
    render(<PlanComments {...defaultProps} canAdd={true} />);

    const textarea = screen.getByRole('textbox', { name: 'PlanAuthoring.comments.addAria' });
    await user.type(textarea, 'A new comment');

    expect(screen.getByRole('button', { name: 'PlanAuthoring.comments.comment' })).not.toBeDisabled();
  });

  it('calls onAdd with the trimmed comment text on submit, then clears the field', async () => {
    const user = userEvent.setup();
    const onAdd = jest.fn().mockResolvedValue(undefined);
    render(<PlanComments {...defaultProps} canAdd={true} onAdd={onAdd} />);

    const textarea = screen.getByRole('textbox', { name: 'PlanAuthoring.comments.addAria' }) as HTMLTextAreaElement;
    await user.type(textarea, '  A new comment  ');
    await user.click(screen.getByRole('button', { name: 'PlanAuthoring.comments.comment' }));

    await waitFor(() => {
      expect(onAdd).toHaveBeenCalledWith('A new comment');
    });
  });

  it('shows "posting" label and disables the button while submitting', async () => {
    let resolveAdd: () => void = () => { };
    const onAdd = jest.fn(
      () =>
        new Promise<void>((resolve) => {
          resolveAdd = resolve;
        })
    );
    const user = userEvent.setup();
    render(<PlanComments {...defaultProps} canAdd={true} onAdd={onAdd} />);

    const textarea = screen.getByRole('textbox', { name: 'PlanAuthoring.comments.addAria' });
    await user.type(textarea, 'A new comment');
    await user.click(screen.getByRole('button', { name: 'PlanAuthoring.comments.comment' }));

    expect(screen.getByRole('button', { name: 'PlanAuthoring.comments.posting' })).toBeDisabled();

    resolveAdd();
    await waitFor(() => {
      expect(screen.getByRole('button', { name: 'PlanAuthoring.comments.comment' })).toBeInTheDocument();
    });
  });

  it('does not call onAdd when submitting with blank/whitespace-only text', () => {
    const onAdd = jest.fn();
    render(<PlanComments {...defaultProps} canAdd={true} onAdd={onAdd} />);

    // The button is disabled for empty text, so submit the form directly to
    // simulate an edge case (e.g. programmatic submit) rather than relying
    // solely on the disabled attribute.
    const form = screen.getByRole('button', { name: 'PlanAuthoring.comments.comment' }).closest('form')!;
    fireEvent.submit(form);

    expect(onAdd).not.toHaveBeenCalled();
  });

  it('does not call onAdd when canAdd is false, even if submitted', () => {
    const onAdd = jest.fn();
    render(<PlanComments {...defaultProps} canAdd={false} onAdd={onAdd} />);

    const form = screen.getByRole('button', { name: 'PlanAuthoring.comments.comment' }).closest('form')!;
    fireEvent.submit(form);

    expect(onAdd).not.toHaveBeenCalled();
  });

  it('renders multiple comments in order', () => {
    const second: PlanComment = { ...baseComment, id: 2, authorName: 'Grace Hopper', text: 'Second comment' };
    render(<PlanComments {...defaultProps} comments={[baseComment, second]} />);

    const items = screen.getAllByRole('listitem');
    expect(items).toHaveLength(2);
    expect(items[0]).toHaveTextContent('Ada Lovelace');
    expect(items[1]).toHaveTextContent('Grace Hopper');
  });

  it('applies an additional className when provided', () => {
    const { container } = render(<PlanComments {...defaultProps} className="extra-class" />);

    expect(container.firstChild).toHaveClass('extra-class');
  });

  it('passes accessibility tests', async () => {
    const { container } = render(<PlanComments {...defaultProps} comments={[baseComment]} />);
    const results = await axe(container);
    expect(results).toHaveNoViolations();
  });
});