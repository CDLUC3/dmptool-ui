import React from 'react';

import "@testing-library/jest-dom";
import {
  render,
  screen,
  fireEvent,
} from '@testing-library/react';
import { axe, toHaveNoViolations } from 'jest-axe';

import TemplateList, {
  TemplateListProps,
} from '@/components/TemplateList';
import { TemplateItemProps } from '@/app/types';

expect.extend(toHaveNoViolations);


// --- Mocks -----------------------------------------------------------------

// Mock next-intl's useTranslations so we can assert on the key + params
// that were passed in, without depending on real translation files.
jest.mock('next-intl', () => ({
  useTranslations: () => (key: string, params?: Record<string, unknown>) => {
    return params ? `${key}::${JSON.stringify(params)}` : key;
  },
}));

// Mock the child list item so these tests stay focused on TemplateList's
// own logic (slicing, load more, filters) rather than the child's
// rendering details. The mock still exercises the `item` and `onSelect`
// props so we can assert they're wired correctly.
jest.mock('@/components/TemplateSelectListItem', () => {
  return function MockTemplateSelectListItem({
    item,
    onSelect,
  }: {
    item: { id: number; name: string };
    onSelect: (id: number, fn: () => void) => void;
  }) {
    return (
      <button
        data-testid={`template-item-${item.id}`}
        onClick={() => onSelect(item.id, () => { })}
      >
        {item.name}
      </button>
    );
  };
});

// jsdom doesn't implement scrollIntoView; stub it so the component's
// scroll-after-load-more behavior doesn't throw.
beforeAll(() => {
  Element.prototype.scrollIntoView = jest.fn();
});


// --- Fixtures ----------------------------------------------------------------

function makeTemplates(count: number): TemplateItemProps[] {
  return Array.from({ length: count }, (_, i) => ({
    id: i + 1,
    name: `Template ${i + 1}`,
  })) as unknown as TemplateItemProps[];
}

function renderTemplateList(overrides: Partial<TemplateListProps> = {}) {
  const defaultProps: TemplateListProps = {
    templates: makeTemplates(5),
    onSelect: jest.fn(),
    ...overrides,
  };
  return render(<TemplateList {...defaultProps} />);
}


describe("TemplateList Component", () => {
  afterEach(() => {
    jest.clearAllMocks();
  });

  it("should render with no accessibility violations", async () => {
    const { container } = renderTemplateList();
    const results = await axe(container);
    expect(results).toHaveNoViolations();
  });

  describe("basic rendering (no load-more configured)", () => {
    it("renders every template when visibleCount/visibleCountKey/handleLoadMore are not provided", () => {
      renderTemplateList({ templates: makeTemplates(5) });

      for (let i = 1; i <= 5; i++) {
        expect(screen.getByTestId(`template-item-${i}`)).toBeInTheDocument();
      }
    });

    it("does not render a load more button when handleLoadMore is missing", () => {
      renderTemplateList({
        templates: makeTemplates(10),
        visibleCount: { templates: 3, filteredTemplates: 0, publicTemplatesList: 0, filteredPublicTemplates: 0 },
        visibleCountKey: 'templates',
        // handleLoadMore intentionally omitted
      });

      // shouldUseLoadMore is false, so the full list renders unsliced
      for (let i = 1; i <= 10; i++) {
        expect(screen.getByTestId(`template-item-${i}`)).toBeInTheDocument();
      }
      expect(screen.queryByText(/buttons\.loadMore/)).not.toBeInTheDocument();
      expect(screen.queryByText(/numDisplaying/)).not.toBeInTheDocument();
    });

    it("does not render search match text or clear filter link for a non-filtered key", () => {
      renderTemplateList({
        templates: makeTemplates(3),
        visibleCountKey: 'templates',
        visibleCount: { templates: 3, filteredTemplates: 0, publicTemplatesList: 0, filteredPublicTemplates: 0 },
        handleLoadMore: jest.fn(),
      });

      expect(screen.queryByText(/clearFilter/)).not.toBeInTheDocument();
      expect(screen.queryByText(/resultsText/)).not.toBeInTheDocument();
    });
  });

  describe("slicing via visibleCount", () => {
    it("renders only the sliced subset of templates when load-more is configured", () => {
      renderTemplateList({
        templates: makeTemplates(10),
        visibleCount: { templates: 3, filteredTemplates: 0, publicTemplatesList: 0, filteredPublicTemplates: 0 },
        visibleCountKey: 'templates',
        handleLoadMore: jest.fn(),
      });

      for (let i = 1; i <= 3; i++) {
        expect(screen.getByTestId(`template-item-${i}`)).toBeInTheDocument();
      }
      for (let i = 4; i <= 10; i++) {
        expect(screen.queryByTestId(`template-item-${i}`)).not.toBeInTheDocument();
      }
    });
  });

  describe("load more button", () => {
    it("shows the increment count in the button label when remaining items exceed the increment", () => {
      // 10 total, 3 visible, increment 3 -> remaining = 7, which is > (increment - 1 = 2)
      renderTemplateList({
        templates: makeTemplates(10),
        visibleCount: { templates: 3, filteredTemplates: 0, publicTemplatesList: 0, filteredPublicTemplates: 0 },
        visibleCountKey: 'templates',
        increment: 3,
        handleLoadMore: jest.fn(),
      });

      expect(
        screen.getByText(`buttons.loadMore::${JSON.stringify({ name: 3 })}`)
      ).toBeInTheDocument();
    });

    it("shows the exact remaining count in the button label when it's fewer than the increment", () => {
      // 5 total, 4 visible, increment 3 -> remaining = 1, which is NOT > (increment - 1 = 2)
      renderTemplateList({
        templates: makeTemplates(5),
        visibleCount: { templates: 4, filteredTemplates: 0, publicTemplatesList: 0, filteredPublicTemplates: 0 },
        visibleCountKey: 'templates',
        increment: 3,
        handleLoadMore: jest.fn(),
      });

      expect(
        screen.getByText(`buttons.loadMore::${JSON.stringify({ name: 1 })}`)
      ).toBeInTheDocument();
    });

    it("shows the remaining/total display text", () => {
      renderTemplateList({
        templates: makeTemplates(10),
        visibleCount: { templates: 3, filteredTemplates: 0, publicTemplatesList: 0, filteredPublicTemplates: 0 },
        visibleCountKey: 'templates',
        handleLoadMore: jest.fn(),
      });

      expect(
        screen.getByText(`numDisplaying::${JSON.stringify({ num: 3, total: 10 })}`)
      ).toBeInTheDocument();
    });

    it("does not render the load more button when there are no remaining items", () => {
      renderTemplateList({
        templates: makeTemplates(3),
        visibleCount: { templates: 3, filteredTemplates: 0, publicTemplatesList: 0, filteredPublicTemplates: 0 },
        visibleCountKey: 'templates',
        handleLoadMore: jest.fn(),
      });

      expect(screen.queryByText(/buttons\.loadMore/)).not.toBeInTheDocument();
      expect(screen.queryByText(/numDisplaying/)).not.toBeInTheDocument();
    });

    it("calls handleLoadMore with the visibleCountKey when clicked", () => {
      const handleLoadMore = jest.fn();
      renderTemplateList({
        templates: makeTemplates(10),
        visibleCount: { templates: 3, filteredTemplates: 0, publicTemplatesList: 0, filteredPublicTemplates: 0 },
        visibleCountKey: 'templates',
        handleLoadMore,
      });

      // 10 total, 3 visible, default increment 3 -> remaining = 7 -> button shows "3"
      const loadMoreButton = screen.getByText(`buttons.loadMore::${JSON.stringify({ name: 3 })}`);
      fireEvent.click(loadMoreButton);
      expect(handleLoadMore).toHaveBeenCalledWith('templates');
      expect(handleLoadMore).toHaveBeenCalledTimes(1);
    });

    it("scrolls the next section into view after clicking load more", () => {
      jest.useFakeTimers();

      // increment = 3, visibleCount.templates = 3 -> the item at index 0
      // (currentVisibleCount - increment = 0) gets the scroll ref attached.
      renderTemplateList({
        templates: makeTemplates(10),
        visibleCount: { templates: 3, filteredTemplates: 0, publicTemplatesList: 0, filteredPublicTemplates: 0 },
        visibleCountKey: 'templates',
        increment: 3,
        handleLoadMore: jest.fn(),
      });

      const loadMoreButton = screen.getByText(`buttons.loadMore::${JSON.stringify({ name: 3 })}`);
      fireEvent.click(loadMoreButton);
      jest.runAllTimers();

      expect(Element.prototype.scrollIntoView).toHaveBeenCalledWith({
        behavior: 'smooth',
        block: 'start',
      });

      jest.useRealTimers();
    });

    it("does not throw and does not scroll when no item matches the scroll-anchor index", () => {
      jest.useFakeTimers();

      // visibleCount.templates = 2, increment = 3 -> target index = -1,
      // which never matches any rendered item's index, so the ref is
      // never attached.
      renderTemplateList({
        templates: makeTemplates(10),
        visibleCount: { templates: 2, filteredTemplates: 0, publicTemplatesList: 0, filteredPublicTemplates: 0 },
        visibleCountKey: 'templates',
        increment: 3,
        handleLoadMore: jest.fn(),
      });

      // 10 total, 2 visible, increment 3 -> remaining = 8 -> button shows "3"
      const loadMoreButton = screen.getByText(`buttons.loadMore::${JSON.stringify({ name: 3 })}`);

      expect(() => {
        fireEvent.click(loadMoreButton);
        jest.runAllTimers();
      }).not.toThrow();

      expect(Element.prototype.scrollIntoView).not.toHaveBeenCalled();

      jest.useRealTimers();
    });

    it("defaults the increment to 3 when not provided", () => {
      // 10 total, 3 visible, no increment passed -> default 3, remaining = 7 > 2
      renderTemplateList({
        templates: makeTemplates(10),
        visibleCount: { templates: 3, filteredTemplates: 0, publicTemplatesList: 0, filteredPublicTemplates: 0 },
        visibleCountKey: 'templates',
        handleLoadMore: jest.fn(),
      });

      expect(
        screen.getByText(`buttons.loadMore::${JSON.stringify({ name: 3 })}`)
      ).toBeInTheDocument();
    });
  });

  describe("filtered lists (search match text + clear filter)", () => {
    it.each(['filteredTemplates', 'filteredPublicTemplates'] as const)(
      "renders search match text and a clear filter link for visibleCountKey=%s",
      (key) => {
        const resetSearch = jest.fn();
        renderTemplateList({
          templates: makeTemplates(4),
          visibleCountKey: key,
          resetSearch,
        });

        expect(
          screen.getByText(`resultsText::${JSON.stringify({ name: 4 })}`, { exact: false })
        ).toBeInTheDocument();
        expect(screen.getByText('clear filter')).toBeInTheDocument();
      }
    );

    it("calls resetSearch when the top clear filter link is pressed", () => {
      const resetSearch = jest.fn();
      renderTemplateList({
        templates: makeTemplates(4),
        visibleCountKey: 'filteredTemplates',
        resetSearch,
      });

      fireEvent.click(screen.getByText('clear filter'));
      expect(resetSearch).toHaveBeenCalledTimes(1);
    });

    it("shows a second clear filter link (below the list) when load-more is also active", () => {
      const resetSearch = jest.fn();
      renderTemplateList({
        templates: makeTemplates(10),
        visibleCount: { templates: 0, filteredTemplates: 3, publicTemplatesList: 0, filteredPublicTemplates: 0 },
        visibleCountKey: 'filteredTemplates',
        handleLoadMore: jest.fn(),
        resetSearch,
      });

      // The top link renders the literal string "clear filter"; the
      // load-more section's link renders the translated 'clearFilter' key.
      expect(screen.getByText('clear filter')).toBeInTheDocument();
      const bottomClearFilterLink = screen.getByText('clearFilter');
      expect(bottomClearFilterLink).toBeInTheDocument();

      fireEvent.click(bottomClearFilterLink);
      expect(resetSearch).toHaveBeenCalled();
    });

    it("renders the standalone clear filter section when filtered but load-more is not active", () => {
      const resetSearch = jest.fn();
      renderTemplateList({
        templates: makeTemplates(4),
        visibleCountKey: 'filteredPublicTemplates',
        resetSearch,
        // no visibleCount / handleLoadMore, so shouldUseLoadMore is false
      });

      // Both the top "clear filter" and the bottom "clearFilter" links should render
      expect(screen.getByText('clear filter')).toBeInTheDocument();
      expect(screen.getByText('clearFilter')).toBeInTheDocument();

      // No load-more button should render (only the mocked template item
      // buttons are present, which aren't part of what we're asserting here).
      expect(screen.queryByText(/buttons\.loadMore/)).not.toBeInTheDocument();
      expect(screen.queryByText(/numDisplaying/)).not.toBeInTheDocument();
    });
  });

  describe("onSelect propagation", () => {
    it("invokes the onSelect prop with the clicked template's id", () => {
      const onSelect = jest.fn();
      renderTemplateList({
        templates: makeTemplates(3),
        onSelect,
      });

      fireEvent.click(screen.getByTestId('template-item-2'));
      expect(onSelect).toHaveBeenCalledTimes(1);
      expect(onSelect.mock.calls[0][0]).toBe(2);
      expect(typeof onSelect.mock.calls[0][1]).toBe('function');
    });
  });

  describe("edge cases", () => {
    it("renders nothing in the list when templates is an empty array", () => {
      renderTemplateList({ templates: [] });
      expect(screen.queryByRole('button')).not.toBeInTheDocument();
      expect(screen.queryByTestId(/template-item-/)).not.toBeInTheDocument();
    });

    it("handles an empty templates array combined with load-more props without crashing", () => {
      expect(() =>
        renderTemplateList({
          templates: [],
          visibleCount: { templates: 0, filteredTemplates: 0, publicTemplatesList: 0, filteredPublicTemplates: 0 },
          visibleCountKey: 'templates',
          handleLoadMore: jest.fn(),
        })
      ).not.toThrow();

      expect(screen.queryByRole('button')).not.toBeInTheDocument();
    });
  });
});