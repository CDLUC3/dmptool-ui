import { render, screen } from '@testing-library/react';
import '@testing-library/jest-dom';
import { FullWidthSection } from '../FullWidthSection';

describe('FullWidthSection', () => {
  it('renders its children', () => {
    render(
      <FullWidthSection>
        <p>Hello world</p>
      </FullWidthSection>
    );

    expect(screen.getByText('Hello world')).toBeInTheDocument();
  });

  it('renders a <section> element with the correct test id', () => {
    render(<FullWidthSection>content</FullWidthSection>);

    const section = screen.getByTestId('full-width-section');
    expect(section).toBeInTheDocument();
    expect(section.tagName).toBe('SECTION');
  });

  it('applies the base layout class by default', () => {
    render(<FullWidthSection>content</FullWidthSection>);

    const section = screen.getByTestId('full-width-section');
    expect(section).toHaveClass('layout-full-width-section');
  });

  it('merges a custom className with the base class', () => {
    render(
      <FullWidthSection className="extra-class another-class">
        content
      </FullWidthSection>
    );

    const section = screen.getByTestId('full-width-section');
    expect(section).toHaveClass('layout-full-width-section');
    expect(section).toHaveClass('extra-class');
    expect(section).toHaveClass('another-class');
  });

  it('has no id by default', () => {
    render(<FullWidthSection>content</FullWidthSection>);

    const section = screen.getByTestId('full-width-section');
    // Default id prop is '', so the id attribute is present but empty
    expect(section.getAttribute('id')).toBe('');
  });

  it('applies a custom id when provided', () => {
    render(<FullWidthSection id="my-section">content</FullWidthSection>);

    const section = screen.getByTestId('full-width-section');
    expect(section).toHaveAttribute('id', 'my-section');
  });

  it('renders multiple children correctly', () => {
    render(
      <FullWidthSection>
        <p>First child</p>
        <p>Second child</p>
      </FullWidthSection>
    );

    expect(screen.getByText('First child')).toBeInTheDocument();
    expect(screen.getByText('Second child')).toBeInTheDocument();
  });
});