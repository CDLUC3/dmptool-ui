import React from 'react';
import { renderHook, waitFor } from '@testing-library/react';
import { MockedProvider } from '@apollo/client/testing/react';
import { PaginationType, PublishedFunderTemplatesDocument } from '@/generated/graphql';
import { templateDownloadHref, useFunderTemplates } from '../useFunderTemplates';

const variables = {
  term: 'nsf',
  paginationOptions: { type: PaginationType.Offset, offset: 0, limit: 10, sortField: 'vt.name', sortDir: 'ASC' },
};

const item = (overrides = {}) => ({
  __typename: 'FunderTemplateSearchResult',
  id: 317,
  templateId: 40,
  name: 'Arctic Data Center: NSF Polar Programs',
  ownerURI: 'https://ror.org/021nxhr62',
  ownerDisplayName: 'National Science Foundation (nsf.gov)',
  modified: '2026-11-19 23:33:21',
  funderLinks: [{ __typename: 'VersionedTemplateLink', id: 1, url: 'https://www.nsf.gov/polar', text: 'Polar guidance' }],
  samplePlanLinks: [],
  ...overrides,
});

const response = (items: unknown[]) => ({
  request: { query: PublishedFunderTemplatesDocument, variables },
  result: {
    data: {
      publishedFunderTemplates: {
        __typename: 'FunderTemplateSearchResults',
        totalCount: items.length,
        limit: 10,
        currentOffset: 0,
        hasNextPage: false,
        hasPreviousPage: false,
        availableSortFields: ['vt.name', 'a.displayName', 'vt.modified'],
        items,
      },
    },
  },
});

const renderWithMocks = (mocks: unknown[]) => renderHook(() => useFunderTemplates({ variables }), {
  wrapper: ({ children }: { children: React.ReactNode }) =>
    React.createElement(MockedProvider, { mocks: mocks as never }, children),
});

describe('useFunderTemplates', () => {
  it('should load the funder templates with the search and pagination variables', async () => {
    const { result } = renderWithMocks([response([item()])]);

    expect(result.current.loading).toBe(true);
    expect(result.current.data).toBeUndefined();

    await waitFor(() => expect(result.current.loading).toBe(false));

    const results = result.current.data?.publishedFunderTemplates;
    expect(result.current.error).toBeUndefined();
    expect(results?.totalCount).toBe(1);
    expect(results?.items[0]).toEqual(expect.objectContaining({
      id: 317,
      name: 'Arctic Data Center: NSF Polar Programs',
      ownerDisplayName: 'National Science Foundation (nsf.gov)',
      funderLinks: [expect.objectContaining({ url: 'https://www.nsf.gov/polar', text: 'Polar guidance' })],
      samplePlanLinks: [],
    }));
  });

  it('should give the page empty lists when a template has no links', async () => {
    const { result } = renderWithMocks([response([item({ funderLinks: null, samplePlanLinks: null })])]);

    await waitFor(() => expect(result.current.loading).toBe(false));

    const template = result.current.data?.publishedFunderTemplates.items[0];
    expect(template?.funderLinks).toEqual([]);
    expect(template?.samplePlanLinks).toEqual([]);
  });

  it('should skip empty items in the results', async () => {
    const { result } = renderWithMocks([response([null, item()])]);

    await waitFor(() => expect(result.current.loading).toBe(false));

    expect(result.current.data?.publishedFunderTemplates.items.map((template) => template.id)).toEqual([317]);
  });

  it('should return the error when the query fails', async () => {
    const { result } = renderWithMocks([{
      request: { query: PublishedFunderTemplatesDocument, variables },
      error: new Error('Network error'),
    }]);

    await waitFor(() => expect(result.current.loading).toBe(false));

    expect(result.current.error).toBeDefined();
    expect(result.current.data).toBeUndefined();
  });
});

describe('templateDownloadHref', () => {
  it('should build a download URL for the versioned template and format', () => {
    expect(templateDownloadHref(7, 'pdf')).toBe('/api/download-template?versionedTemplateId=7&format=pdf');
    expect(templateDownloadHref(7, 'docx')).toBe('/api/download-template?versionedTemplateId=7&format=docx');
  });
});
