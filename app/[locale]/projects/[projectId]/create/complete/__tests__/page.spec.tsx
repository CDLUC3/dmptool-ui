import React from 'react';
import { act, render, screen } from '@testing-library/react';
import { axe, toHaveNoViolations } from 'jest-axe';
import { useParams, useSearchParams } from 'next/navigation';
import { useRouter } from '@/i18n/routing';
import { useQuery } from '@apollo/client/react';
import { useTranslations } from 'next-intl';

import ProjectsCreateProjectSetupComplete from '../page';

expect.extend(toHaveNoViolations);

jest.mock('next/navigation', () => ({
  useParams: jest.fn(),
  useSearchParams: jest.fn(),
}));

jest.mock('@/i18n/routing', () => ({
  Link: ({ href, children, ...props }: { href: string; children: React.ReactNode }) => (
    <a href={href} {...props}>{children}</a>
  ),
  useRouter: jest.fn(() => ({ push: jest.fn(), replace: jest.fn(), back: jest.fn() })),
}));

jest.mock('@apollo/client/react', () => ({
  useQuery: jest.fn(),
}));

jest.mock('next-intl', () => ({
  ...jest.requireActual('next-intl'),
  useTranslations: jest.fn(),
  useFormatter: jest.fn(() => ({
    list: (items: Iterable<string>) => new Intl.ListFormat('en-US', { type: 'conjunction' }).format(items),
  })),
}));

type QueryResult = ReturnType<typeof useQuery>;
type RichValue = string | ((chunks: React.ReactNode) => React.ReactNode);

const mockUseQuery = jest.mocked(useQuery);

// Echoes the key and its values so tests can assert what was interpolated
const translate = Object.assign((key: string) => key, {
  rich: (key: string, values: Record<string, RichValue> = {}) => (
    <>
      {key}
      {Object.entries(values).map(([name, value]) => (
        <React.Fragment key={name}>
          {' '}
          {typeof value === 'function' ? value(`${key}.${name}`) : `[${name}:${value}]`}
        </React.Fragment>
      ))}
    </>
  ),
});

const project = {
  title: 'Coastal Ocean Processes',
  fundings: [
    { affiliation: { displayName: 'National Institutes of Health', name: 'NIH' } },
    { affiliation: { displayName: 'National Science Foundation', name: 'NSF' } },
  ],
  plans: [{ id: 7, title: 'NIH Data Management and Sharing Plan' }],
};

describe('ProjectsCreateProjectSetupComplete', () => {
  beforeEach(() => {
    window.scrollTo = jest.fn();
    HTMLElement.prototype.scrollIntoView = jest.fn();
    (useRouter as jest.Mock).mockReturnValue({ push: jest.fn() });
    (useParams as jest.Mock).mockReturnValue({ projectId: '5' });
    (useTranslations as jest.Mock).mockReturnValue(translate);
    mockUseQuery.mockReturnValue({
      data: { project },
      loading: false,
      error: undefined,
    } as unknown as QueryResult);
  });

  it('shows the project created screen with a link to create the first plan', () => {
    (useSearchParams as jest.Mock).mockReturnValue(new URLSearchParams('intent=project'));
    render(<ProjectsCreateProjectSetupComplete />);

    expect(screen.getByRole('heading', { level: 1, name: 'complete.projectTitle' })).toBeInTheDocument();
    expect(document.getElementById('setup-complete-summary')).toHaveTextContent('[title:Coastal Ocean Processes]');
    expect(screen.getByRole('link', { name: 'complete.createFirstPlan' }))
      .toHaveAttribute('href', '/projects/5/dmp/start?intent=plan');
    expect(screen.getByRole('link', { name: 'complete.overviewHintProject.link' }))
      .toHaveAttribute('href', '/projects/5');
    expect(screen.queryByTestId('create-flow-back')).not.toBeInTheDocument();
  });

  it('explains the setup with the project, funders and plan name, and links into the new plan', () => {
    (useSearchParams as jest.Mock).mockReturnValue(new URLSearchParams('intent=plan&planId=7'));
    render(<ProjectsCreateProjectSetupComplete />);

    expect(screen.getByRole('heading', { level: 1, name: 'complete.setupTitle' })).toBeInTheDocument();

    const description = document.getElementById('setup-complete-summary');
    expect(description).toHaveTextContent('[title:Coastal Ocean Processes]');
    expect(description).toHaveTextContent('[funders:National Institutes of Health and National Science Foundation]');
    expect(description).toHaveTextContent('[hasFunders:yes]');
    expect(description).toHaveTextContent('[planTitle:NIH Data Management and Sharing Plan]');
    expect(description).toHaveTextContent('[hasPlanTitle:yes]');

    expect(screen.getByRole('link', { name: 'complete.startWriting' }))
      .toHaveAttribute('href', '/projects/5/dmp/7');
    expect(screen.getByRole('link', { name: 'complete.overviewHintPlan.link' }))
      .toHaveAttribute('href', '/projects/5');
    expect(screen.getByTestId('create-flow-stage-setupComplete')).toHaveTextContent('rail.states.done');
  });

  it('leaves out the funder and plan name when they are not available', () => {
    (useSearchParams as jest.Mock).mockReturnValue(new URLSearchParams('intent=plan&planId=99'));
    mockUseQuery.mockReturnValue({
      data: { project: { title: 'Solo project', fundings: [], plans: [] } },
      loading: false,
      error: undefined,
    } as unknown as QueryResult);
    render(<ProjectsCreateProjectSetupComplete />);

    const description = document.getElementById('setup-complete-summary');
    expect(description).toHaveTextContent('[hasFunders:no]');
    expect(description).toHaveTextContent('[hasPlanTitle:no]');
  });

  it('keeps funder and details marked as skipped when the plan was added to an existing project', () => {
    (useSearchParams as jest.Mock).mockReturnValue(new URLSearchParams('intent=plan&from=existing&planId=7'));
    render(<ProjectsCreateProjectSetupComplete />);

    expect(screen.getByTestId('create-flow-stage-addFunder')).toHaveTextContent('rail.states.skipped');
    expect(screen.getByTestId('create-flow-stage-projectDetails')).toHaveTextContent('rail.states.skipped');
    expect(screen.getByTestId('create-flow-stage-setupComplete')).toHaveTextContent('rail.states.done');
  });

  it('shows a loading state while the project loads', () => {
    (useSearchParams as jest.Mock).mockReturnValue(new URLSearchParams('intent=project'));
    mockUseQuery.mockReturnValue({ data: undefined, loading: true, error: undefined } as unknown as QueryResult);
    render(<ProjectsCreateProjectSetupComplete />);

    expect(screen.queryByRole('link', { name: 'complete.createFirstPlan' })).not.toBeInTheDocument();
  });

  it('shows an error when the project cannot be loaded', () => {
    (useSearchParams as jest.Mock).mockReturnValue(new URLSearchParams('intent=project'));
    mockUseQuery.mockReturnValue({ data: undefined, loading: false, error: new Error('boom') } as unknown as QueryResult);
    render(<ProjectsCreateProjectSetupComplete />);

    expect(screen.getByText('complete.loadFailed')).toBeInTheDocument();
    expect(document.getElementById('setup-complete-summary')).not.toBeInTheDocument();
    expect(screen.queryByRole('link', { name: 'complete.createFirstPlan' })).not.toBeInTheDocument();
  });

  it('should pass axe accessibility test', async () => {
    (useSearchParams as jest.Mock).mockReturnValue(new URLSearchParams('intent=plan&planId=7'));
    const { container } = render(<ProjectsCreateProjectSetupComplete />);
    await act(async () => {
      expect(await axe(container)).toHaveNoViolations();
    });
  });
});
