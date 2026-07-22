import { render, screen } from '@testing-library/react';
import '@testing-library/jest-dom';
import GlobalLoading from '../../app/loading';

// Mock the Loading component so this test stays isolated to GlobalLoading's
// own behavior (rendering/delegation), not Loading's internal implementation.
jest.mock('@/components/Loading', () => {
  return function MockLoading() {
    return <div data-testid="loading-mock">Loading...</div>;
  };
});

describe('GlobalLoading', () => {
  it('renders without crashing', () => {
    render(<GlobalLoading />);
  });

  it('renders the Loading component', () => {
    render(<GlobalLoading />);
    expect(screen.getByTestId('loading-mock')).toBeInTheDocument();
  });

  it('renders exactly one Loading component', () => {
    render(<GlobalLoading />);
    expect(screen.getAllByTestId('loading-mock')).toHaveLength(1);
  });

  it('matches snapshot', () => {
    const { container } = render(<GlobalLoading />);
    expect(container).toMatchSnapshot();
  });
});