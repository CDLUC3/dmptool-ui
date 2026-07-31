import { act, render, screen, within } from '@testing-library/react';
import '@testing-library/jest-dom';
import { jest } from '@jest/globals';
import { axe, toHaveNoViolations } from "jest-axe";

expect.extend(toHaveNoViolations);
import PasswordRequirementsList from '../index';

// ---------------------------------------------------------------------
// Mocks
// ---------------------------------------------------------------------
jest.mock('next-intl', () => ({
  useTranslations: jest.fn(),
}));

jest.mock('./passwordRequirements.module.scss', () => ({
  requirementsList: 'requirementsList',
  met: 'met',
  unmet: 'unmet',
  iconContainer: 'iconContainer',
}));

// ---------------------------------------------------------------------
// Helpers
// ---------------------------------------------------------------------

// Passwords chosen to satisfy (or deliberately omit) specific
// requirements from the real getPasswordRequirements implementation.
const NO_REQUIREMENTS_MET = ''; // fails every check
const ALL_REQUIREMENTS_MET = 'Abcdefg1!'; // len 9, upper, lower, number, valid special char
// All lowercase letters: satisfies minLength AND hasLowercase, nothing else.
const LOWERCASE_ONLY = 'aaaaaaaa';
const BAD_SPECIAL_CHAR_ONLY = 'Abcdefg1.'; // "." is in the disallowed special-char set


beforeEach(() => {
  jest.clearAllMocks();
});

// ---------------------------------------------------------------------
// Tests
// ---------------------------------------------------------------------

describe('PasswordRequirementsList', () => {
  it('should render the description text', () => {
    render(<PasswordRequirementsList password="" />);

    expect(screen.getByText("description")).toBeInTheDocument();
  });

  it('should render one list item for each requirement key', () => {
    render(<PasswordRequirementsList password={NO_REQUIREMENTS_MET} />);

    expect(screen.getByTestId('requirement-minLength')).toBeInTheDocument();
    expect(screen.getByTestId('requirement-hasUppercase')).toBeInTheDocument();
    expect(screen.getByTestId('requirement-hasLowercase')).toBeInTheDocument();
    expect(screen.getByTestId('requirement-hasNumber')).toBeInTheDocument();
    expect(screen.getByTestId('requirement-hasSpecialChar')).toBeInTheDocument();
  });

  it('should render the correct label text for each requirement', () => {
    render(<PasswordRequirementsList password={NO_REQUIREMENTS_MET} />);

    expect(screen.getByTestId('requirement-minLength')).toHaveTextContent(
      "minLength"
    );
    expect(screen.getByTestId('requirement-hasUppercase')).toHaveTextContent(
      "hasUppercase"
    );
    expect(screen.getByTestId('requirement-hasLowercase')).toHaveTextContent(
      "hasLowercase"
    );
    expect(screen.getByTestId('requirement-hasNumber')).toHaveTextContent(
      "hasNumber"
    );
    expect(screen.getByTestId('requirement-hasSpecialChar')).toHaveTextContent(
      "hasSpecialChar"
    );
  });

  it('should mark every requirement as unmet for an empty password', () => {
    render(<PasswordRequirementsList password={NO_REQUIREMENTS_MET} />);

    expect(screen.getByTestId('requirement-minLength')).toHaveClass('unmet');
    expect(screen.getByTestId('requirement-hasUppercase')).toHaveClass('unmet');
    expect(screen.getByTestId('requirement-hasLowercase')).toHaveClass('unmet');
    expect(screen.getByTestId('requirement-hasNumber')).toHaveClass('unmet');
    expect(screen.getByTestId('requirement-hasSpecialChar')).toHaveClass('unmet');

    const item = screen.getByTestId('requirement-minLength');
    const svg = within(item).getByTestId('dmpIconSvg');
    const use = within(item).getByTestId('dmpIconSvgUse');

    expect(svg).toHaveClass('unmet');
    expect(svg).toHaveAttribute('aria-hidden', 'true');
    expect(use).toHaveAttribute('href', '/icons/iconset.svg#icon-error_circle');
  });



  it('should mark every requirement as met for a password satisfying all rules', () => {
    render(<PasswordRequirementsList password={ALL_REQUIREMENTS_MET} />);

    expect(screen.getByTestId('requirement-minLength')).toHaveClass('met');
    expect(screen.getByTestId('requirement-hasUppercase')).toHaveClass('met');
    expect(screen.getByTestId('requirement-hasLowercase')).toHaveClass('met');
    expect(screen.getByTestId('requirement-hasNumber')).toHaveClass('met');
    expect(screen.getByTestId('requirement-hasSpecialChar')).toHaveClass('met');

    const item = screen.getByTestId('requirement-minLength');
    const svg = within(item).getByTestId('dmpIconSvg');
    const use = within(item).getByTestId('dmpIconSvgUse');

    expect(svg).toHaveClass('met');
    expect(svg).toHaveAttribute('aria-hidden', 'true');
    expect(use).toHaveAttribute('href', '/icons/iconset.svg#icon-check_circle');
  });

  it('should mark only the relevant requirements as met for a partially-matching password', () => {
    render(<PasswordRequirementsList password={LOWERCASE_ONLY} />);

    expect(screen.getByTestId('requirement-minLength')).toHaveClass('met');
    expect(screen.getByTestId('requirement-hasLowercase')).toHaveClass('met');
    expect(screen.getByTestId('requirement-hasUppercase')).toHaveClass('unmet');
    expect(screen.getByTestId('requirement-hasNumber')).toHaveClass('unmet');
    expect(screen.getByTestId('requirement-hasSpecialChar')).toHaveClass('unmet');
  });

  it('should treat disallowed special characters (e.g. ".") as not meeting hasSpecialChar', () => {
    render(<PasswordRequirementsList password={BAD_SPECIAL_CHAR_ONLY} />);

    // Every other requirement is met, only the special-char rule fails
    // because "." is explicitly excluded even though it "looks" special.
    expect(screen.getByTestId('requirement-minLength')).toHaveClass('met');
    expect(screen.getByTestId('requirement-hasUppercase')).toHaveClass('met');
    expect(screen.getByTestId('requirement-hasLowercase')).toHaveClass('met');
    expect(screen.getByTestId('requirement-hasNumber')).toHaveClass('met');
    expect(screen.getByTestId('requirement-hasSpecialChar')).toHaveClass('unmet');
  });

  it('should show the met/unmet accessible prefix text alongside each requirement', () => {
    render(<PasswordRequirementsList password={LOWERCASE_ONLY} />);

    expect(screen.getByTestId('requirement-minLength')).toHaveTextContent(
      "metPrefix"
    );
    expect(screen.getByTestId('requirement-hasUppercase')).toHaveTextContent(
      "unmetPrefix"
    );
  });

  it('should mark the requirements list as an aria-live region so updates are announced', () => {
    render(<PasswordRequirementsList password="" />);

    expect(screen.getByRole('list')).toHaveAttribute('aria-live', 'polite');
  });

  it('should update requirement status when the password prop changes', () => {
    const { rerender } = render(
      <PasswordRequirementsList password={NO_REQUIREMENTS_MET} />
    );

    expect(screen.getByTestId('requirement-minLength')).toHaveClass('unmet');

    rerender(<PasswordRequirementsList password={ALL_REQUIREMENTS_MET} />);

    expect(screen.getByTestId('requirement-minLength')).toHaveClass('met');
  });

  it("should pass axe accessibility test", async () => {
    const { container } = render(
      <PasswordRequirementsList password={ALL_REQUIREMENTS_MET} />
    );
    await act(async () => {
      const results = await axe(container);
      expect(results).toHaveNoViolations();
    });
  })
});