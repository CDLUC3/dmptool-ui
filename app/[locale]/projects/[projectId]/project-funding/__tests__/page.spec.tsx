import React from 'react';
import { act, render, screen, fireEvent, waitFor } from '@testing-library/react';
import { axe, toHaveNoViolations } from 'jest-axe';
import { ProjectFundingsApiDocument } from '@/generated/graphql';
import { MockedProvider } from '@apollo/client/testing/react';

import { useParams, useRouter } from 'next/navigation';
import ProjectsCreateProjectFunding from '../page';


expect.extend(toHaveNoViolations);


const withAPIMocks = [
  {
    request: {
      query: ProjectFundingsApiDocument,
      variables: {
        projectId: 123,
      },
    },

    result: {
      data: {
        project: {
          fundings: [{
            affiliation: {
              apiTarget: '/api/target',
              id: '99',
            },
          }],
        }
      }
    },
  },
];

const withoutAPIMocks = [
  {
    request: {
      query: ProjectFundingsApiDocument,
      variables: {
        projectId: 123,
      },
    },

    result: {
      data: {
        project: {
          fundings: [{
            affiliation: {
              apiTarget: null,
              id: '99',
            }
          }],
        }
      }
    },
  },
];


jest.mock('next/navigation', () => ({
  useRouter: jest.fn(),
  useParams: jest.fn(),
}));


const mockUseRouter = useRouter as jest.Mock;

describe('ProjectsCreateProjectFunding', () => {
  beforeEach(() => {
    window.scrollTo = jest.fn(); // Called by the wrapping PageHeader

    mockUseRouter.mockReturnValue({
      push: jest.fn(),
    })

    const mockUseParams = useParams as jest.Mock;
    mockUseParams.mockReturnValue({ projectId: '123' });
  });

  it('should render the component', async () => {
    await act(async () => {
      render(
        <MockedProvider mocks={withoutAPIMocks}>
          <ProjectsCreateProjectFunding />
        </MockedProvider>
      );
    });

    expect(screen.getByText('title')).toBeInTheDocument();
    expect(screen.getByText('breadcrumbs.home')).toBeInTheDocument();
    expect(screen.getByText('breadcrumbs.projects')).toBeInTheDocument();
    expect(screen.getByText('form.radioFundingLabel')).toBeInTheDocument();
    expect(screen.getByText('form.radioYesLabel')).toBeInTheDocument();
    expect(screen.getByText('form.radioNoLabel')).toBeInTheDocument();
    expect(screen.getByText('buttons.continue')).toBeInTheDocument();
  });

  it('should handle funding "yes" selected (no API)', async () => {
    await act(async () => {
      render(
        <MockedProvider mocks={withoutAPIMocks}>
          <ProjectsCreateProjectFunding />
        </MockedProvider>
      );
    });

    fireEvent.click(screen.getByLabelText('form.radioYesLabel'));
    fireEvent.click(screen.getByText('buttons.continue'));
    await waitFor(() => {
      expect(mockUseRouter().push).toHaveBeenCalledWith('/en-US/projects/123/project');
    })
  });

  it('should handle funding "yes" selected (with API)', async () => {
    await act(async () => {
      render(
        <MockedProvider mocks={withAPIMocks}>
          <ProjectsCreateProjectFunding />
        </MockedProvider>
      );
    });

    fireEvent.click(screen.getByLabelText('form.radioYesLabel'));
    fireEvent.click(screen.getByText('buttons.continue'));
    await waitFor(() => {
      expect(mockUseRouter().push).toHaveBeenCalledWith('/en-US/projects/123/projects-search?affId=99');
    })
  });

  it('should handle form submission with "no" selected', async () => {
    await act(async () => {
      render(
        <MockedProvider mocks={withoutAPIMocks}>
          <ProjectsCreateProjectFunding />
        </MockedProvider>
      );
    });

    fireEvent.click(screen.getByLabelText('form.radioNoLabel'));
    fireEvent.click(screen.getByText('buttons.continue'));
    await waitFor(() => {
      expect(mockUseRouter().push).toHaveBeenCalledWith('/en-US/projects/123/project')
    })
  });

  it('should pass axe accessibility test', async () => {
    const { container } = render(
      <MockedProvider mocks={withoutAPIMocks}>
        <ProjectsCreateProjectFunding />
      </MockedProvider>
    );
    await act(async () => {
      const results = await axe(container);
      expect(results).toHaveNoViolations();
    });
  });
});
