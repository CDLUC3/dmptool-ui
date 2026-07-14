import React from 'react';
import { render, screen, fireEvent } from '@testing-library/react';
import ButtonWithImage from '..';


describe('ButtonWithImage', () => {
  const mockImageUrl = '/path/to/image.jpg';
  const expectedImageUrl = '/_next/image?url=%2Fpath%2Fto%2Fimage.jpg&w=48&q=75'
  const mockButtonText = 'Click me';

  it('should render button with the correct text and image', () => {
    render(<ButtonWithImage url="http://localhost:3000" imageUrl={mockImageUrl} buttonText={mockButtonText} />);

    // Check if the button text is rendered
    const button = screen.getByRole('button', { name: /click me/i });
    expect(button).toBeInTheDocument();

    // Check if the image is rendered with the correct URL and alt attributes
    const image = screen.getByAltText('');
    expect(image).toHaveAttribute('src', expectedImageUrl);
    expect(image).toHaveAttribute('width', '20');
    expect(image).toHaveAttribute('height', '20');
  });

  it('should call onPress when provided instead of navigating', () => {
    const onPress = jest.fn();
    render(
      <ButtonWithImage imageUrl={mockImageUrl} buttonText={mockButtonText} onPress={onPress} />
    );

    fireEvent.click(screen.getByRole('button', { name: /click me/i }));
    expect(onPress).toHaveBeenCalledTimes(1);
  });

  it('should apply the correct styles', () => {
    const { container } = render(<ButtonWithImage url="http://localhost:3000" imageUrl={mockImageUrl} buttonText={mockButtonText} />);

    const button = container.querySelector('.react-aria-Button');
    expect(button).toHaveClass('react-aria-Button');

    const image = container.querySelector('img');
    expect(image).toHaveClass('icon');
  });
});