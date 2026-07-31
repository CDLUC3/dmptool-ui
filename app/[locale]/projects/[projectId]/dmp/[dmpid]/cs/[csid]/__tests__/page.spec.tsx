import React from 'react';

import "@testing-library/jest-dom";
import { render, screen } from '@testing-library/react';

import { SectionPageConfig, PlanOverviewSectionPageShared } from '@/components/PlanOverviewSectionPageShared';
import PlanOverviewCustomSectionPage from '../page';

// --- Mocks -----------------------------------------------------------------

// Mock the generated GraphQL documents as simple identifiable markers.
// We don't need real DocumentNode objects here — we're only verifying that
// the *correct* document reference is threaded through to the config, not
// exercising actual GraphQL parsing.
jest.mock('@/generated/graphql', () => ({
  PublishedCustomQuestionsDocument: 'PUBLISHED_CUSTOM_QUESTIONS_DOCUMENT',
  PublishedCustomSectionDocument: 'PUBLISHED_CUSTOM_SECTION_DOCUMENT',
}));

// Mock PlanOverviewSectionPageShared so this test file is a true unit test
// of the config wrapper, not an integration test of the shared component's
// rendering/data-fetching behavior (that belongs in its own test file).
// We capture whatever `config` prop gets passed in so we can assert on it
// directly, including invoking its callback functions.
jest.mock('@/components/PlanOverviewSectionPageShared', () => ({
  PlanOverviewSectionPageShared: jest.fn(() => (
    <div data-testid="shared-mock" />
  )),
}));

jest.mock('@/utils/routes', () => ({
  routePath: jest.fn((key: string, params: Record<string, unknown>) => `${key}::${JSON.stringify(params)}`),
}));

import { routePath } from '@/utils/routes';
import { PublishedCustomQuestionsDocument, PublishedCustomSectionDocument } from '@/generated/graphql';

const mockedSharedComponent = PlanOverviewSectionPageShared as jest.Mock;
const mockedRoutePath = routePath as jest.Mock;


describe("PlanOverviewCustomSectionPage", () => {
  afterEach(() => {
    jest.clearAllMocks();
  });

  function renderAndGetConfig(): SectionPageConfig {
    render(<PlanOverviewCustomSectionPage />);
    expect(mockedSharedComponent).toHaveBeenCalledTimes(1);
    return mockedSharedComponent.mock.calls[0][0].config as SectionPageConfig;
  }

  it("renders PlanOverviewSectionPageShared exactly once with a config prop", () => {
    render(<PlanOverviewCustomSectionPage />);

    expect(screen.getByTestId('shared-mock')).toBeInTheDocument();
    expect(mockedSharedComponent).toHaveBeenCalledTimes(1);
    expect(mockedSharedComponent.mock.calls[0][0]).toHaveProperty('config');
  });

  it("passes only the config prop to PlanOverviewSectionPageShared", () => {
    render(<PlanOverviewCustomSectionPage />);

    const propsPassed = mockedSharedComponent.mock.calls[0][0];
    expect(Object.keys(propsPassed)).toEqual(['config']);
  });

  describe("static config values", () => {
    it("sets sectionIdParamKey to 'csid'", () => {
      const config = renderAndGetConfig();
      expect(config.sectionIdParamKey).toBe('csid');
    });

    it("sets sectionType to 'CUSTOM'", () => {
      const config = renderAndGetConfig();
      expect(config.sectionType).toBe('CUSTOM');
    });

    it("uses PublishedCustomQuestionsDocument as questionsDocument", () => {
      const config = renderAndGetConfig();
      expect(config.questionsDocument).toBe(PublishedCustomQuestionsDocument);
    });

    it("sets questionsVariableKey to 'versionedCustomSectionId'", () => {
      const config = renderAndGetConfig();
      expect(config.questionsVariableKey).toBe('versionedCustomSectionId');
    });

    it("uses PublishedCustomSectionDocument as sectionDocument", () => {
      const config = renderAndGetConfig();
      expect(config.sectionDocument).toBe(PublishedCustomSectionDocument);
    });
  });

  describe("config.buildSectionVariables", () => {
    it("returns customSectionId (from sectionId) and planId", () => {
      const config = renderAndGetConfig();

      const result = config.buildSectionVariables({
        sectionId: 123,
        planId: 456,
      } as Parameters<typeof config.buildSectionVariables>[0]);

      expect(result).toEqual({
        customSectionId: 123,
        planId: 456,
      });
    });
  });

  describe("config.extractQuestions", () => {
    it("extracts publishedCustomQuestions from the response data", () => {
      const config = renderAndGetConfig();
      const questions = [{ customQuestionId: 1 }, { customQuestionId: 2 }];

      const result = config.extractQuestions({ publishedCustomQuestions: questions } as any);
      expect(result).toBe(questions);
    });

    it("returns undefined when data is null/undefined without throwing", () => {
      const config = renderAndGetConfig();

      expect(config.extractQuestions(undefined as any)).toBeUndefined();
      expect(config.extractQuestions(null as any)).toBeUndefined();
    });
  });

  describe("config.extractSection", () => {
    it("extracts publishedCustomSection from the response data", () => {
      const config = renderAndGetConfig();
      const section = { id: 'section-1', name: 'My Section' };

      const result = config.extractSection({ publishedCustomSection: section } as any);
      expect(result).toBe(section);
    });

    it("returns undefined when data is null/undefined without throwing", () => {
      const config = renderAndGetConfig();

      expect(config.extractSection(undefined as any)).toBeUndefined();
      expect(config.extractSection(null as any)).toBeUndefined();
    });
  });

  describe("config.extractBreadcrumbName", () => {
    it("extracts the section name from the response data", () => {
      const config = renderAndGetConfig();

      const result = config.extractBreadcrumbName({
        publishedCustomSection: { name: 'My Custom Section' },
      } as any);
      expect(result).toBe('My Custom Section');
    });

    it("returns undefined when the section or data is missing, without throwing", () => {
      const config = renderAndGetConfig();

      expect(config.extractBreadcrumbName({} as any)).toBeUndefined();
      expect(config.extractBreadcrumbName(undefined as any)).toBeUndefined();
    });
  });

  describe("config.buildQuestionLink", () => {
    it("builds a link via routePath using the under-custom-section route with the right params", () => {
      const config = renderAndGetConfig();

      const link = config.buildQuestionLink({
        projectId: 'proj-1',
        dmpId: 'dmp-1',
        sectionId: 1,
        question: { customQuestionId: 42 },
      } as Parameters<typeof config.buildQuestionLink>[0]);

      expect(mockedRoutePath).toHaveBeenCalledWith(
        'projects.dmp.customQuestion.underCustomSection',
        {
          projectId: 'proj-1',
          dmpId: 'dmp-1',
          csid: 1,
          cqid: '42',
        }
      );
      expect(link).toBe(mockedRoutePath.mock.results[0].value);
    });

    it("stringifies a numeric customQuestionId into cqid", () => {
      const config = renderAndGetConfig();

      config.buildQuestionLink({
        projectId: 'proj-1',
        dmpId: 'dmp-1',
        sectionId: 1,
        question: { customQuestionId: 99 },
      } as Parameters<typeof config.buildQuestionLink>[0]);

      const paramsPassed = mockedRoutePath.mock.calls[0][1];
      expect(paramsPassed.cqid).toBe('99');
      expect(typeof paramsPassed.cqid).toBe('string');
    });
  });

  describe("config.buildGuidanceMutationParams", () => {
    it("maps sectionId to both versionedSectionId and customSectionId, alongside planId", () => {
      const config = renderAndGetConfig();

      const result = config.buildGuidanceMutationParams({
        planId: 9,
        sectionId: 9,
      } as Parameters<typeof config.buildGuidanceMutationParams>[0]);

      expect(result).toEqual({
        planId: 9,
        versionedSectionId: 9,
        customSectionId: 9,
      });
    });
  });
});