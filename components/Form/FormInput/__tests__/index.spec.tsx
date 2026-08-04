import React from 'react';
import { render, screen, fireEvent } from '@testing-library/react';
import FormInput from '@/components/Form/FormInput';
import { axe, toHaveNoViolations } from 'jest-axe';
expect.extend(toHaveNoViolations);

describe('FormInput', () => {
  it('should render the component correctly', () => {
    render(
      <FormInput
        name="name"
        type="text"
        label="Name"
        placeholder="Enter your name"
        value="John Doe"
        onChange={jest.fn()}
      />
    );

    expect(screen.getByLabelText('Name')).toBeInTheDocument();
    expect(screen.getByPlaceholderText('Enter your name')).toHaveValue('John Doe');
  });

  it('should handle invalid state correctly', () => {
    render(
      <FormInput
        name="email"
        type="email"
        label="Email"
        isInvalid={true}
        errorMessage="Please enter a valid email address"
      />
    );

    const fieldWrapper = screen.getByTestId('field-wrapper');
    expect(fieldWrapper).toHaveClass('field-error');
    expect(screen.getByText('Please enter a valid email address')).toBeInTheDocument();
  });


  it('should call the onChange handler when the input value changes', () => {
    const onChange = jest.fn();
    render(
      <FormInput
        name="password"
        type="password"
        label="Password"
        onChange={onChange}
      />
    );

    const input = screen.getByLabelText('Password');
    fireEvent.change(input, { target: { value: 'password123' } });
    expect(onChange).toHaveBeenCalledTimes(1);
  });

  it('should render the help message if provided', () => {
    render(
      <FormInput
        name="phone"
        type="tel"
        label="Phone"
        helpMessage="Please enter your phone number in the format xxx-xxx-xxxx"
      />
    );

    expect(screen.getByText('Please enter your phone number in the format xxx-xxx-xxxx')).toBeInTheDocument();
  });

  it('should pass axe accessibility test', async () => {
    const { container } = render(
      <FormInput
        name="phone"
        type="tel"
        label="Phone"
        helpMessage="Please enter your phone number in the format xxx-xxx-xxxx"
      />
    );
    const results = await axe(container);
    expect(results).toHaveNoViolations();
  });

  it('should display "(required)" text when field is required', () => {
    render(
      <FormInput
        name="email"
        type="email"
        label="Email"
        isRequired={true}
      />
    );

    expect(screen.getByText('Email')).toBeInTheDocument();
    expect(screen.getByText(/\(required\)/)).toBeInTheDocument();
    expect(screen.getByText(/\(required\)/)).toHaveClass('is-required');
  });

  it('should not display "(required)" text when field is not required', () => {
    render(
      <FormInput
        name="email"
        type="email"
        label="Email"
        isRequired={false}
      />
    );

    expect(screen.getByText('Email')).toBeInTheDocument();
    expect(screen.queryByText(/\(required\)/)).not.toBeInTheDocument();
  });

  // New tests for isRequiredVisualOnly functionality
  it('should display "(required)" text and set aria-required when isRequiredVisualOnly is true', () => {
    render(
      <FormInput
        name="email"
        type="email"
        label="Email"
        isRequiredVisualOnly={true}
      />
    );

    // Check for "(required)" text in label
    expect(screen.getByText('Email')).toBeInTheDocument();
    expect(screen.getByText(/\(required\)/)).toBeInTheDocument();
    expect(screen.getByText(/\(required\)/)).toHaveClass('is-required');

    // Check that aria-required is set on the input
    const input = screen.getByRole('textbox', { name: 'Email' });
    expect(input).toHaveAttribute('aria-required', 'false');
  });

  it('should not display "(required)" text or set aria-required when isRequiredVisualOnly is false', () => {
    render(
      <FormInput
        name="email"
        type="email"
        label="Email"
        isRequiredVisualOnly={false}
      />
    );

    expect(screen.getByText('Email')).toBeInTheDocument();
    expect(screen.queryByText(/\(required\)/)).not.toBeInTheDocument();

    const input = screen.getByRole('textbox', { name: 'Email' });
    expect(input).toHaveAttribute('aria-required', 'false');
  });

  it('should not show required when neither isRequired, isRequiredVisualOnly, nor aria-required are set', () => {
    render(
      <FormInput
        name="email"
        type="email"
        label="Email"
      />
    );

    expect(screen.getByText('Email')).toBeInTheDocument();
    expect(screen.queryByText(/\(required\)/)).not.toBeInTheDocument();

    const input = screen.getByRole('textbox', { name: 'Email' });
    expect(input).toHaveAttribute('aria-required', 'false');
  });

  describe('password visibility toggle', () => {
    it('should render a Show toggle by default for password fields', () => {
      render(
        <FormInput
          name="password"
          type="password"
          label="Password"
        />
      );

      const input = screen.getByLabelText('Password');
      expect(input).toHaveAttribute('type', 'password');

      const toggle = screen.getByTestId('password-toggle');
      expect(toggle).toBeInTheDocument();
      expect(toggle).toHaveAttribute('aria-label', 'showPassword');
      expect(screen.getByText('show')).toHaveAttribute('aria-hidden', 'false');
      expect(screen.getByText('hide')).toHaveAttribute('aria-hidden', 'true');
      expect(screen.getByTitle('showPassword')).toBeInTheDocument();
    });

    it('should reveal and hide the password when the toggle is clicked', () => {
      render(
        <FormInput
          name="password"
          type="password"
          label="Password"
        />
      );

      const input = screen.getByLabelText('Password');
      const toggle = screen.getByTestId('password-toggle');

      fireEvent.click(toggle);
      expect(input).toHaveAttribute('type', 'text');
      expect(toggle).toHaveAttribute('aria-label', 'hidePassword');
      expect(screen.getByText('hide')).toHaveAttribute('aria-hidden', 'false');
      expect(screen.getByText('show')).toHaveAttribute('aria-hidden', 'true');
      expect(screen.getByTitle('hidePassword')).toBeInTheDocument();
      expect(screen.getByText('passwordIsVisible')).toBeInTheDocument();

      fireEvent.click(toggle);
      expect(input).toHaveAttribute('type', 'password');
      expect(toggle).toHaveAttribute('aria-label', 'showPassword');
      expect(screen.getByText('passwordIsHidden')).toBeInTheDocument();
    });

    it('should include field context in the password toggle label when provided', () => {
      render(
        <FormInput
          name="confirmPassword"
          type="password"
          label="Confirm password"
          passwordToggleLabel="Confirm password"
        />
      );

      const toggle = screen.getByTestId('password-toggle');
      expect(toggle).toHaveAttribute('aria-label', 'showPasswordFor');
      expect(screen.getByTitle('showPasswordFor')).toBeInTheDocument();

      fireEvent.click(toggle);
      expect(toggle).toHaveAttribute('aria-label', 'hidePasswordFor');
      expect(screen.getByTitle('hidePasswordFor')).toBeInTheDocument();
    });

    it('should not render the toggle when showPasswordToggle is false', () => {
      render(
        <FormInput
          name="password"
          type="password"
          label="Password"
          showPasswordToggle={false}
        />
      );

      expect(screen.getByLabelText('Password')).toHaveAttribute('type', 'password');
      expect(screen.queryByTestId('password-toggle')).not.toBeInTheDocument();
    });

    it('should start revealed when defaultPasswordVisible is true', () => {
      render(
        <FormInput
          name="password"
          type="password"
          label="Password"
          defaultPasswordVisible={true}
        />
      );

      expect(screen.getByLabelText('Password')).toHaveAttribute('type', 'text');
      expect(screen.getByTestId('password-toggle')).toHaveAttribute('aria-label', 'hidePassword');
      expect(screen.getByText('hide')).toHaveAttribute('aria-hidden', 'false');
    });

    it('should not render the toggle for non-password fields', () => {
      render(
        <FormInput
          name="email"
          type="email"
          label="Email"
        />
      );

      expect(screen.queryByTestId('password-toggle')).not.toBeInTheDocument();
    });

    it('should keep the value when toggling visibility', () => {
      render(
        <FormInput
          name="password"
          type="password"
          label="Password"
          defaultValue="Secret123"
        />
      );

      const input = screen.getByLabelText('Password');
      fireEvent.change(input, { target: { value: 'Secret123' } });
      fireEvent.click(screen.getByTestId('password-toggle'));
      expect(input).toHaveValue('Secret123');
    });

    it('should pass axe accessibility test with the toggle rendered', async () => {
      const { container } = render(
        <FormInput
          name="password"
          type="password"
          label="Password"
        />
      );
      const results = await axe(container);
      expect(results).toHaveNoViolations();
    });
  });
});
