// Create a mock for scrollIntoView and focus
export const mockScrollIntoView = jest.fn();

// Mock window.scrollTo
export const mockScrollTo = () => {
  window.scrollTo = jest.fn();
};
