/* eslint-disable @typescript-eslint/no-explicit-any */
import React from 'react';
import { render, screen } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import '@testing-library/jest-dom';
import { axe, toHaveNoViolations } from 'jest-axe';
import PlanSampleAnswers from '../index';
import type { PlanSampleAnswer } from '../../sampleAnswers';

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

// --- react-aria-components ---
jest.mock('react-aria-components', () => ({
  Button: ({ children, onPress, isDisabled, ['aria-expanded']: ariaExpanded, className }: any) => (
    <button
      type="button"
      onClick={onPress}
      disabled={isDisabled}
      aria-expanded={ariaExpanded}
      className={className}
    >
      {children}
    </button>
  ),
}));

// --- @/components/SafeHtml ---
jest.mock('@/components/SafeHtml', () => {
  const MockSafeHtml = ({ html }: { html: string }) => <div data-testid="safe-html">{html}</div>;
  MockSafeHtml.displayName = 'MockSafeHtml';
  return MockSafeHtml;
});

const sample1: PlanSampleAnswer = {
  id: 'sample-1',
  orgLabel: 'University of Example',
  html: '<p>Sample answer text one.</p>',
} as any;

const sample2: PlanSampleAnswer = {
  id: 'sample-2',
  orgLabel: 'Example Institute',
  html: '<p>Sample answer text two.</p>',
} as any;

const defaultProps = {
  samples: [sample1],
  disabled: false,
  onUseSample: jest.fn(),
};

describe('PlanSampleAnswers', () => {
  beforeEach(() => {
    jest.clearAllMocks();
  });

  it('renders nothing when samples is an empty array', () => {
    const { container } = render(<PlanSampleAnswers {...defaultProps} samples={[]} />);

    expect(container).toBeEmptyDOMElement();
  });

  it('shows the singular trigger label when there is exactly one sample', () => {
    render(<PlanSampleAnswers {...defaultProps} samples={[sample1]} />);

    expect(screen.getByRole('button', { name: 'PlanAuthoring.sampleAnswers.viewSampleAnswer' })).toBeInTheDocument();
  });

  it('shows the plural/count trigger label when there is more than one sample', () => {
    render(<PlanSampleAnswers {...defaultProps} samples={[sample1, sample2]} />);

    expect(
      screen.getByRole('button', {
        name: 'PlanAuthoring.sampleAnswers.viewSampleAnswersCount(count=2)',
      })
    ).toBeInTheDocument();
  });

  it('does not show the sample well before the trigger is clicked', () => {
    render(<PlanSampleAnswers {...defaultProps} />);

    expect(screen.queryByTestId('safe-html')).not.toBeInTheDocument();
  });

  it('sets aria-expanded=false on the trigger when collapsed', () => {
    render(<PlanSampleAnswers {...defaultProps} />);

    expect(screen.getByRole('button', { name: /viewSampleAnswer/ })).toHaveAttribute(
      'aria-expanded',
      'false'
    );
  });

  it('expands the sample well when the trigger is clicked', async () => {
    const user = userEvent.setup();
    render(<PlanSampleAnswers {...defaultProps} />);

    await user.click(screen.getByRole('button', { name: /viewSampleAnswer/ }));

    expect(screen.getByTestId('safe-html')).toHaveTextContent('Sample answer text one.');
  });

  it('sets aria-expanded=true on the trigger once expanded', async () => {
    const user = userEvent.setup();
    render(<PlanSampleAnswers {...defaultProps} />);

    await user.click(screen.getByRole('button', { name: /viewSampleAnswer/ }));

    expect(screen.getByRole('button', { name: /viewSampleAnswer/ })).toHaveAttribute(
      'aria-expanded',
      'true'
    );
  });

  it('collapses the sample well when the trigger is clicked again', async () => {
    const user = userEvent.setup();
    render(<PlanSampleAnswers {...defaultProps} />);

    const trigger = screen.getByRole('button', { name: /viewSampleAnswer/ });
    await user.click(trigger);
    expect(screen.getByTestId('safe-html')).toBeInTheDocument();

    await user.click(trigger);
    expect(screen.queryByTestId('safe-html')).not.toBeInTheDocument();
  });

  it('renders each sample with its org heading and HTML body when expanded', async () => {
    const user = userEvent.setup();
    render(<PlanSampleAnswers {...defaultProps} samples={[sample1, sample2]} />);

    await user.click(screen.getByRole('button', { name: /viewSampleAnswersCount/ }));

    expect(
      screen.getByText('PlanAuthoring.sampleAnswers.organizationSampleText(org=University of Example)')
    ).toBeInTheDocument();
    expect(
      screen.getByText('PlanAuthoring.sampleAnswers.organizationSampleText(org=Example Institute)')
    ).toBeInTheDocument();

    const bodies = screen.getAllByTestId('safe-html');
    expect(bodies).toHaveLength(2);
    expect(bodies[0]).toHaveTextContent('Sample answer text one.');
    expect(bodies[1]).toHaveTextContent('Sample answer text two.');
  });

  it('renders a "use answer" button for each sample when expanded', async () => {
    const user = userEvent.setup();
    render(<PlanSampleAnswers {...defaultProps} samples={[sample1, sample2]} />);

    await user.click(screen.getByRole('button', { name: /viewSampleAnswersCount/ }));

    const useButtons = screen.getAllByRole('button', { name: 'PlanAuthoring.sampleAnswers.useAnswer' });
    expect(useButtons).toHaveLength(2);
  });

  it('calls onUseSample with the correct sample html when its "use answer" button is clicked', async () => {
    const user = userEvent.setup();
    const onUseSample = jest.fn();
    render(
      <PlanSampleAnswers {...defaultProps} samples={[sample1, sample2]} onUseSample={onUseSample} />
    );

    await user.click(screen.getByRole('button', { name: /viewSampleAnswersCount/ }));

    const useButtons = screen.getAllByRole('button', { name: 'PlanAuthoring.sampleAnswers.useAnswer' });
    await user.click(useButtons[1]);

    expect(onUseSample).toHaveBeenCalledWith(sample2.html);
  });

  it('collapses the well after a sample is selected via "use answer"', async () => {
    const user = userEvent.setup();
    render(<PlanSampleAnswers {...defaultProps} />);

    await user.click(screen.getByRole('button', { name: /viewSampleAnswer/ }));
    await user.click(screen.getByRole('button', { name: 'PlanAuthoring.sampleAnswers.useAnswer' }));

    expect(screen.queryByTestId('safe-html')).not.toBeInTheDocument();
  });

  it('disables the trigger button when disabled is true', () => {
    render(<PlanSampleAnswers {...defaultProps} disabled={true} />);

    expect(screen.getByRole('button', { name: /viewSampleAnswer/ })).toBeDisabled();
  });

  it('disables each "use answer" button when disabled is true', async () => {
    // Expand first via a non-disabled render, then re-render disabled, since
    // a disabled trigger can't be clicked to expand in the first place —
    // this isolates the "use answer" button's own disabled wiring.
    const { rerender } = render(<PlanSampleAnswers {...defaultProps} disabled={false} />);
    const user = userEvent.setup();
    await user.click(screen.getByRole('button', { name: /viewSampleAnswer/ }));

    rerender(<PlanSampleAnswers {...defaultProps} disabled={true} />);

    expect(screen.getByRole('button', { name: 'PlanAuthoring.sampleAnswers.useAnswer' })).toBeDisabled();
  });

  it('applies an additional className alongside the base styles', () => {
    const { container } = render(<PlanSampleAnswers {...defaultProps} className="extra-class" />);

    expect(container.firstChild).toHaveClass('extra-class');
  });

  it('passes accessibility tests when collapsed', async () => {
    const { container } = render(<PlanSampleAnswers {...defaultProps} />);
    const results = await axe(container);
    expect(results).toHaveNoViolations();
  });

  it('passes accessibility tests when expanded', async () => {
    const user = userEvent.setup();
    const { container } = render(<PlanSampleAnswers {...defaultProps} samples={[sample1, sample2]} />);

    await user.click(screen.getByRole('button', { name: /viewSampleAnswersCount/ }));

    const results = await axe(container);
    expect(results).toHaveNoViolations();
  });
});