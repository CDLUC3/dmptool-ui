import { renderHook } from '@testing-library/react';
import { PaginationType } from '@/generated/graphql';
import {
  FUNDER_TEMPLATE_SORT_FIELDS,
  templateDownloadHref,
  useFunderTemplates,
} from '../useFunderTemplates';
import { stubFunderTemplates } from '../funderTemplatesStubData';

const names = (items: { name: string }[]) => items.map((item) => item.name);

describe('useFunderTemplates', () => {
  it('should return the first page sorted by template name when no options are given', () => {
    const { result } = renderHook(() => useFunderTemplates({ variables: {} }));
    const results = result.current.data.publishedFunderTemplates;

    expect(result.current.loading).toBe(false);
    expect(result.current.error).toBeUndefined();
    expect(results.totalCount).toBe(stubFunderTemplates.length);
    expect(results.items).toHaveLength(10);
    expect(results.currentOffset).toBe(0);
    expect(results.hasPreviousPage).toBe(false);
    expect(results.hasNextPage).toBe(true);
    expect(results.availableSortFields).toEqual([...FUNDER_TEMPLATE_SORT_FIELDS]);
    expect(names(results.items)[0]).toBe('Agency for Healthcare Research and Quality (AHRQ)');
    expect(names(results.items)[9]).toBe('National Institutes of Health (NIH): Default DMSP');
  });

  it('should match the search term against the template name and the organization name, ignoring case', () => {
    const { result, rerender } = renderHook(
      ({ term }) => useFunderTemplates({ variables: { term } }),
      { initialProps: { term: 'moore' } }
    );
    expect(names(result.current.data.publishedFunderTemplates.items)).toEqual(['Gordon and Betty Moore Foundation']);

    rerender({ term: '  ENERGY.GOV ' });
    expect(result.current.data.publishedFunderTemplates.totalCount).toBe(2);

    rerender({ term: 'no such funder' });
    expect(result.current.data.publishedFunderTemplates.items).toEqual([]);
    expect(result.current.data.publishedFunderTemplates.totalCount).toBe(0);
  });

  it('should sort by organization name and by last updated date in either direction', () => {
    const { result, rerender } = renderHook(
      ({ sortField, sortDir }) => useFunderTemplates({
        variables: { paginationOptions: { type: PaginationType.Offset, limit: 50, sortField, sortDir } },
      }),
      { initialProps: { sortField: 'vt.modified', sortDir: 'DESC' } }
    );
    const newestFirst = result.current.data.publishedFunderTemplates.items;
    expect(newestFirst[0].name).toBe('Atlantic Offshore Research (RWSC & ROSA)');
    expect(newestFirst[newestFirst.length - 1].name).toBe('U.S. Geological Survey (USGS)');

    rerender({ sortField: 'a.displayName', sortDir: 'ASC' });
    expect(result.current.data.publishedFunderTemplates.items[0].ownerDisplayName)
      .toBe('Agency for Healthcare Research and Quality (ahrq.gov)');
  });

  it('should fall back to sorting by name when given an unknown sort field', () => {
    const { result } = renderHook(() => useFunderTemplates({
      variables: { paginationOptions: { sortField: 'vt.bogus', sortDir: 'DESC' } },
    }));

    expect(result.current.data.publishedFunderTemplates.items[0].name).toBe('U.S. Geological Survey (USGS)');
  });

  it('should return the requested page', () => {
    const { result } = renderHook(() => useFunderTemplates({
      variables: { paginationOptions: { type: PaginationType.Offset, offset: 10, limit: 10 } },
    }));
    const results = result.current.data.publishedFunderTemplates;

    expect(results.items).toHaveLength(stubFunderTemplates.length - 10);
    expect(results.currentOffset).toBe(10);
    expect(results.hasPreviousPage).toBe(true);
    expect(results.hasNextPage).toBe(false);
  });
});

describe('templateDownloadHref', () => {
  it('should build a download URL for the versioned template and format', () => {
    expect(templateDownloadHref(7, 'pdf')).toBe('/api/download-template?versionedTemplateId=7&format=pdf');
    expect(templateDownloadHref(7, 'docx')).toBe('/api/download-template?versionedTemplateId=7&format=docx');
  });
});
