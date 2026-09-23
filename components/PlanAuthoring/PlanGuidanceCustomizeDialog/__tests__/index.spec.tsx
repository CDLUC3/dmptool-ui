/* eslint-disable @typescript-eslint/no-explicit-any */
import React from 'react';
import { render, screen, fireEvent, waitFor, within } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import '@testing-library/jest-dom';
import { axe, toHaveNoViolations } from 'jest-axe';
import PlanGuidanceCustomizeDialog from '../index';
import type { PlanGuidanceOrgOption } from '../../model';

expect.extend(toHaveNoViolations);

// --- next-intl ---
jest.mock('next-intl', () => ({
  useTranslations: jest.fn((namespace: string) => (key: string, values?: Record<string, unknown>) => {
    if (values) {
      const interpolated = Object.entries(values)
        .map(([name, value]) => `${name}=${String(value)}`)
        .join(',');
      return `${namespace}.${key}(${interpolated})`;
    }
    return `${namespace}.${key}`;
  }),
}));

// --- @/components/Icons ---
jest.mock('@/components/Icons', () => ({
  DmpIcon: ({ icon }: any) => <span data-testid={`icon-${icon}`} />,
}));

// --- react-aria-components ---
// ModalOverlay/Modal/Dialog are portal + focus-trap heavy in the real
// library, which is awkward and unnecessary to exercise in a unit test.
// Render them as plain pass-through elements so the dialog's content is
// always present in the DOM when isOpen is true, and absent otherwise.
jest.mock('react-aria-components', () => ({
  ModalOverlay: ({ children, isOpen, className }: any) =>
    isOpen ? <div className={className}>{children}</div> : null,
  Modal: ({ children, className }: any) => <div className={className}>{children}</div>,
  Dialog: ({ children, className }: any) => (
    <div role="dialog" aria-labelledby="dialog-title" className={className}>
      {children}
    </div>
  ),
  Heading: ({ children, className }: any) => <h2 className={className} id="dialog-title">{children}</h2>,
  Button: ({ children, onPress, isDisabled, className, ['aria-label']: ariaLabel }: any) => (
    <button
      type="button"
      onClick={onPress}
      disabled={isDisabled}
      className={className}
      aria-label={ariaLabel}
    >
      {children}
    </button>
  ),
  Input: ({ value, onChange, onKeyDown, placeholder }: any) => (
    <input value={value} onChange={onChange} onKeyDown={onKeyDown} placeholder={placeholder} />
  ),
  Label: ({ children }: any) => <label>{children}</label>,
  TextField: ({ children, className }: any) => <div className={className}>{children}</div>,
}));

const org1: PlanGuidanceOrgOption = { id: 'org-1', label: 'University of Example' } as any;
const org2: PlanGuidanceOrgOption = { id: 'org-2', label: 'Example Institute' } as any;
const org3: PlanGuidanceOrgOption = { id: 'org-3', label: 'Third Org' } as any;

const defaultProps = {
  isOpen: true,
  onOpenChange: jest.fn(),
  selectedOrgIds: ['org-1'],
  lockedOrgIds: [] as string[],
  availableOrgs: [org1, org2, org3],
  onSearch: jest.fn().mockResolvedValue([]),
  onSave: jest.fn().mockResolvedValue(undefined),
};

describe('PlanGuidanceCustomizeDialog', () => {
  beforeEach(() => {
    jest.clearAllMocks();
  });

  it('renders nothing when isOpen is false', () => {
    render(<PlanGuidanceCustomizeDialog {...defaultProps} isOpen={false} />);

    expect(screen.queryByRole('dialog')).not.toBeInTheDocument();
  });

  it('renders the dialog title and sections when isOpen is true', () => {
    render(<PlanGuidanceCustomizeDialog {...defaultProps} />);

    expect(screen.getByText('PlanAuthoring.customizeDialog.title')).toBeInTheDocument();
    expect(screen.getByText('PlanAuthoring.customizeDialog.currentlyDisplaying')).toBeInTheDocument();
    expect(screen.getByText('PlanAuthoring.customizeDialog.addMore')).toBeInTheDocument();
  });

  it('initializes the selected orgs list from selectedOrgIds', () => {
    render(<PlanGuidanceCustomizeDialog {...defaultProps} selectedOrgIds={['org-1', 'org-2']} />);

    expect(screen.getByText('University of Example')).toBeInTheDocument();
    expect(screen.getByText('Example Institute')).toBeInTheDocument();
  });

  it('initializes the results list to available orgs not already selected', () => {
    render(<PlanGuidanceCustomizeDialog {...defaultProps} selectedOrgIds={['org-1']} />);

    // org-1 is selected, so only org-2 and org-3 should appear as addable results
    expect(screen.getByRole('button', { name: '+ Example Institute' })).toBeInTheDocument();
    expect(screen.getByRole('button', { name: '+ Third Org' })).toBeInTheDocument();
    expect(screen.queryByRole('button', { name: '+ University of Example' })).not.toBeInTheDocument();
  });

  it('resets draft state to match new props each time the dialog reopens', () => {
    const { rerender } = render(
      <PlanGuidanceCustomizeDialog {...defaultProps} isOpen={false} selectedOrgIds={['org-1']} />
    );

    rerender(
      <PlanGuidanceCustomizeDialog {...defaultProps} isOpen={true} selectedOrgIds={['org-2']} />
    );

    expect(screen.getByText('Example Institute')).toBeInTheDocument();
    expect(screen.queryByText('University of Example')).not.toBeInTheDocument();
  });

  it('calls onOpenChange(false) when the close button is clicked', async () => {
    const user = userEvent.setup();
    render(<PlanGuidanceCustomizeDialog {...defaultProps} />);

    await user.click(screen.getByRole('button', { name: /Global.buttons.close/ }));

    expect(defaultProps.onOpenChange).toHaveBeenCalledWith(false);
  });

  it('calls onOpenChange(false) when Cancel is clicked', async () => {
    const user = userEvent.setup();
    render(<PlanGuidanceCustomizeDialog {...defaultProps} />);

    await user.click(screen.getByRole('button', { name: 'Global.buttons.cancel' }));

    expect(defaultProps.onOpenChange).toHaveBeenCalledWith(false);
  });

  describe('locked vs removable orgs', () => {
    it('shows a lock indicator and no remove button for locked orgs', () => {
      render(
        <PlanGuidanceCustomizeDialog
          {...defaultProps}
          selectedOrgIds={['org-1']}
          lockedOrgIds={['org-1']}
        />
      );

      expect(screen.getByTestId('icon-lock')).toBeInTheDocument();
      expect(
        screen.queryByRole('button', { name: /removeOrgAria/ })
      ).not.toBeInTheDocument();
    });

    it('shows a remove button (not locked) for orgs not in lockedOrgIds', () => {
      render(
        <PlanGuidanceCustomizeDialog
          {...defaultProps}
          selectedOrgIds={['org-1']}
          lockedOrgIds={[]}
        />
      );

      expect(
        screen.getByRole('button', {
          name: 'PlanAuthoring.customizeDialog.removeOrgAria(label=University of Example)',
        })
      ).toBeInTheDocument();
      expect(screen.queryByTestId('icon-lock')).not.toBeInTheDocument();
    });

    it('removes an org from the selected list when its remove button is clicked', async () => {
      const user = userEvent.setup();
      render(<PlanGuidanceCustomizeDialog {...defaultProps} selectedOrgIds={['org-1']} />);

      expect(screen.getByText('University of Example')).toBeInTheDocument();

      await user.click(
        screen.getByRole('button', {
          name: 'PlanAuthoring.customizeDialog.removeOrgAria(label=University of Example)',
        })
      );

      expect(screen.queryByText('University of Example')).not.toBeInTheDocument();
    });
  });

  describe('adding orgs from results', () => {
    it('moves an org from results into selected when clicked', async () => {
      const user = userEvent.setup();
      render(<PlanGuidanceCustomizeDialog {...defaultProps} selectedOrgIds={['org-1']} />);

      await user.click(screen.getByRole('button', { name: '+ Third Org' }));

      // Now appears among the selected org chips
      const selectedSection = screen
        .getByText('PlanAuthoring.customizeDialog.currentlyDisplaying')
        .closest('section')!;
      expect(within(selectedSection).getByText('Third Org')).toBeInTheDocument();
    });

    it('does not add a duplicate id if the same org is clicked twice', async () => {
      const user = userEvent.setup();
      render(<PlanGuidanceCustomizeDialog {...defaultProps} selectedOrgIds={['org-1']} />);

      const addButton = screen.getByRole('button', { name: '+ Third Org' });
      await user.click(addButton);
      // Button remains in the results list (still not selected in that list's filter logic
      // since `results` state isn't recomputed after add) — clicking again should not throw
      // or duplicate the entry in selectedOrgs.
      await user.click(addButton);

      const selectedSection = screen
        .getByText('PlanAuthoring.customizeDialog.currentlyDisplaying')
        .closest('section')!;
      const matches = within(selectedSection).getAllByText('Third Org');
      expect(matches).toHaveLength(1);
    });
  });

  describe('search', () => {
    it('shows the "no matching sources" message when results is empty and not searching', () => {
      render(
        <PlanGuidanceCustomizeDialog
          {...defaultProps}
          selectedOrgIds={['org-1', 'org-2', 'org-3']}
        />
      );

      expect(screen.getByText('PlanAuthoring.customizeDialog.noMatchingSources')).toBeInTheDocument();
    });

    it('calls onSearch with the current term when the Search button is clicked', async () => {
      const user = userEvent.setup();
      const onSearch = jest.fn().mockResolvedValue([org3]);
      render(<PlanGuidanceCustomizeDialog {...defaultProps} onSearch={onSearch} selectedOrgIds={['org-1']} />);

      const input = screen.getByPlaceholderText('PlanAuthoring.customizeDialog.enterNamePlaceholder');
      await user.type(input, 'Third');
      await user.click(screen.getByRole('button', { name: 'Global.buttons.search' }));

      await waitFor(() => {
        expect(onSearch).toHaveBeenCalledWith('Third');
      });
    });

    it('calls onSearch when Enter is pressed in the search input', async () => {
      const onSearch = jest.fn().mockResolvedValue([]);
      render(<PlanGuidanceCustomizeDialog {...defaultProps} onSearch={onSearch} selectedOrgIds={['org-1']} />);

      const input = screen.getByPlaceholderText('PlanAuthoring.customizeDialog.enterNamePlaceholder');
      fireEvent.change(input, { target: { value: 'query' } });
      fireEvent.keyDown(input, { key: 'Enter' });

      await waitFor(() => {
        expect(onSearch).toHaveBeenCalledWith('query');
      });
    });

    it('filters search results to exclude orgs already in the draft selection', async () => {
      const user = userEvent.setup();
      const onSearch = jest.fn().mockResolvedValue([org1, org3]);
      render(<PlanGuidanceCustomizeDialog {...defaultProps} onSearch={onSearch} selectedOrgIds={['org-1']} />);

      await user.click(screen.getByRole('button', { name: 'Global.buttons.search' }));

      await waitFor(() => {
        expect(screen.getByRole('button', { name: '+ Third Org' })).toBeInTheDocument();
      });
      expect(screen.queryByRole('button', { name: '+ University of Example' })).not.toBeInTheDocument();
    });

    it('shows "searching" label and disables the search button while a search is in flight', async () => {
      let resolveSearch: (value: PlanGuidanceOrgOption[]) => void = () => { };
      const onSearch = jest.fn(
        () =>
          new Promise<PlanGuidanceOrgOption[]>((resolve) => {
            resolveSearch = resolve;
          })
      );
      const user = userEvent.setup();
      render(<PlanGuidanceCustomizeDialog {...defaultProps} onSearch={onSearch} selectedOrgIds={['org-1']} />);

      await user.click(screen.getByRole('button', { name: 'Global.buttons.search' }));

      expect(screen.getByRole('button', { name: 'Global.buttons.searching' })).toBeDisabled();

      resolveSearch([]);
      await waitFor(() => {
        expect(screen.getByRole('button', { name: 'Global.buttons.search' })).not.toBeDisabled();
      });
    });
  });

  describe('save', () => {
    it('calls onSave with the current draft ids when Save is clicked', async () => {
      const user = userEvent.setup();
      const onSave = jest.fn().mockResolvedValue(undefined);
      render(
        <PlanGuidanceCustomizeDialog {...defaultProps} onSave={onSave} selectedOrgIds={['org-1']} />
      );

      await user.click(
        screen.getByRole('button', { name: 'PlanAuthoring.customizeDialog.saveGuidanceSources' })
      );

      await waitFor(() => {
        expect(onSave).toHaveBeenCalledWith(['org-1']);
      });
    });

    it('calls onOpenChange(false) after a successful save', async () => {
      const user = userEvent.setup();
      const onSave = jest.fn().mockResolvedValue(undefined);
      render(
        <PlanGuidanceCustomizeDialog
          {...defaultProps}
          onSave={onSave}
          selectedOrgIds={['org-1']}
        />
      );

      await user.click(
        screen.getByRole('button', { name: 'PlanAuthoring.customizeDialog.saveGuidanceSources' })
      );

      await waitFor(() => {
        expect(defaultProps.onOpenChange).toHaveBeenCalledWith(false);
      });
    });

    it('shows "saving" label and disables the save button while saving', async () => {
      let resolveSave: () => void = () => { };
      const onSave = jest.fn(
        () =>
          new Promise<void>((resolve) => {
            resolveSave = resolve;
          })
      );
      const user = userEvent.setup();
      render(
        <PlanGuidanceCustomizeDialog {...defaultProps} onSave={onSave} selectedOrgIds={['org-1']} />
      );

      await user.click(
        screen.getByRole('button', { name: 'PlanAuthoring.customizeDialog.saveGuidanceSources' })
      );

      expect(screen.getByRole('button', { name: 'Global.buttons.saving' })).toBeDisabled();

      resolveSave();
      await waitFor(() => {
        expect(
          screen.getByRole('button', { name: 'PlanAuthoring.customizeDialog.saveGuidanceSources' })
        ).not.toBeDisabled();
      });
    });

    it('re-enables the save button and does not close the dialog if onSave rejects', async () => {
      const user = userEvent.setup();
      const onSave = jest.fn().mockRejectedValue(new Error('save failed'));
      render(
        <PlanGuidanceCustomizeDialog {...defaultProps} onSave={onSave} selectedOrgIds={['org-1']} />
      );

      await user.click(
        screen.getByRole('button', { name: 'PlanAuthoring.customizeDialog.saveGuidanceSources' })
      );

      await waitFor(() => {
        expect(
          screen.getByRole('button', { name: 'PlanAuthoring.customizeDialog.saveGuidanceSources' })
        ).not.toBeDisabled();
      });
      expect(defaultProps.onOpenChange).not.toHaveBeenCalledWith(false);
    });
  });

  it('passes accessibility tests', async () => {
    const { container } = render(
      <PlanGuidanceCustomizeDialog {...defaultProps} selectedOrgIds={['org-1']} />
    );
    const results = await axe(container);
    expect(results).toHaveNoViolations();
  });
});