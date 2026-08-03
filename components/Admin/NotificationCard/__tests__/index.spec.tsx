/* eslint-disable @typescript-eslint/no-explicit-any */
import React from 'react';
import { render, screen, fireEvent, waitFor, act } from '@testing-library/react';
import { axe, toHaveNoViolations } from 'jest-axe';
expect.extend(toHaveNoViolations);
import { MockedProvider } from "@apollo/client/testing/react";
import NotificationCard from '../index';
import {
  AdminNotificationType,
  MarkNotificationAsReadDocument,
  MarkNotificationAsUnReadDocument,
} from '@/generated/graphql';

// Mock next-intl
jest.mock('next-intl', () => ({
  useTranslations: () => (key: string) => key,
}));

// Mock TransitionLink and TransitionButton
jest.mock('@/components/Form', () => ({
  TransitionLink: ({ href, children, onClick, ...props }: any) => (
    <a href={href}
      onClick={(e) => {
        e.preventDefault();
        onClick?.(e);
      }}
      {...props}>
      {children}
    </a>
  ),
  TransitionButton: ({ children, ...props }: any) => (
    <button {...props}>{children}</button>
  ),
}));

// Mock ExpandableContentSection
jest.mock('@/components/ExpandableContentSection', () => ({
  __esModule: true,
  default: ({ children }: any) => <div data-testid="expandable-content">{children}</div>,
}));

const baseFeedbackSection = {
  id: 1,
  cardTitle: 'Funder Name',
  planTitle: 'My DMP Plan',
  viewLink: '/projects/1/dmp/2',
  date: '2 days ago',
  contact: 'Jane Doe',
  message: 'Please provide feedback on this plan.',
  notificationType: AdminNotificationType.FeedbackRequested,
  isRead: false,
};

const baseTemplateSection = {
  id: 2,
  cardTitle: 'Template Funder',
  planTitle: 'New Template',
  viewLink: '/template/5',
  date: 'Today',
  contact: '',
  message: '',
  notificationType: AdminNotificationType.TemplateCreated,
  isRead: false,
};

const baseCustomizationSection = {
  id: 3,
  cardTitle: 'Customization Funder',
  planTitle: 'Customized Template',
  viewLink: '/template/customize/7',
  date: '1 day ago',
  contact: '',
  message: '',
  notificationType: AdminNotificationType.TemplateCustomizationChanged,
  isRead: true,
};

const markAsReadMock = {
  request: {
    query: MarkNotificationAsReadDocument,
    variables: { markNotificationAsReadId: 1 },
  },
  result: { data: { markNotificationAsRead: true } },
};

const markAsUnreadMock = {
  request: {
    query: MarkNotificationAsUnReadDocument,
    variables: { markNotificationAsUnReadId: 3 },
  },
  result: { data: { markNotificationAsUnRead: true } },
};

const renderComponent = (
  sections = [baseFeedbackSection],
  mocks: any[] = [markAsReadMock],
  onToggleRead?: () => void,
  heading = 'Unread Notifications'
) => {
  return render(
    <MockedProvider mocks={mocks}>
      <NotificationCard
        sections={sections}
        heading={heading}
        onToggleRead={onToggleRead}
      />
    </MockedProvider>
  );
};

describe('NotificationCard', () => {
  describe('rendering', () => {
    it('should render the heading', () => {
      renderComponent();
      expect(screen.getByText('Unread Notifications')).toBeInTheDocument();
    });

    it('should render the card title (funder)', () => {
      renderComponent();
      expect(screen.getByText('Funder Name')).toBeInTheDocument();
    });

    it('should render the plan title', () => {
      renderComponent();
      expect(screen.getByText('My DMP Plan')).toBeInTheDocument();
    });

    it('should render the date', () => {
      renderComponent();
      expect(screen.getByText('2 days ago')).toBeInTheDocument();
    });

    it('should render multiple sections', () => {
      renderComponent([baseFeedbackSection, baseTemplateSection]);
      expect(screen.getByText('My DMP Plan')).toBeInTheDocument();
      expect(screen.getByText('New Template')).toBeInTheDocument();
    });

    it('should render empty state with no sections', () => {
      renderComponent([]);
      expect(screen.queryByRole('listitem')).not.toBeInTheDocument();
    });
  });

  describe('notification types', () => {
    it('should show "View Plan" button for FEEDBACK_REQUESTED notifications', () => {
      renderComponent([baseFeedbackSection]);
      expect(screen.getByText('buttons.viewPlan')).toBeInTheDocument();
    });

    it('should show "View Template" button for TEMPLATE_CREATED notifications', () => {
      renderComponent([baseTemplateSection]);
      expect(screen.getByText('buttons.viewTemplate')).toBeInTheDocument();
    });

    it('should show "View Template" button for TEMPLATE_CUSTOMIZATION_CHANGED notifications', () => {
      renderComponent([baseCustomizationSection]);
      expect(screen.getByText('buttons.viewTemplate')).toBeInTheDocument();
    });

    it('should show contact and expandable message for FEEDBACK_REQUESTED', () => {
      renderComponent([baseFeedbackSection]);
      expect(screen.getByText('Jane Doe')).toBeInTheDocument();
      expect(screen.getByTestId('expandable-content')).toBeInTheDocument();
      expect(screen.getByText('Please provide feedback on this plan.')).toBeInTheDocument();
    });

    it('should not show contact section for TEMPLATE_CREATED', () => {
      renderComponent([baseTemplateSection]);
      expect(screen.queryByTestId('expandable-content')).not.toBeInTheDocument();
    });

    it('should not show contact section for TEMPLATE_CUSTOMIZATION_CHANGED', () => {
      renderComponent([baseCustomizationSection]);
      expect(screen.queryByTestId('expandable-content')).not.toBeInTheDocument();
    });
  });

  describe('read/unread state', () => {
    it('should show "Mark as Read" for unread notifications', () => {
      renderComponent([{ ...baseFeedbackSection, isRead: false }]);
      expect(screen.getByText('buttons.markAsRead')).toBeInTheDocument();
    });

    it('should show "Mark as Unread" for read notifications', () => {
      renderComponent([{ ...baseFeedbackSection, isRead: true }]);
      expect(screen.getByText('buttons.markAsUnread')).toBeInTheDocument();
    });
  });

  describe('mark as read/unread', () => {
    it('should call markAsRead mutation when clicking "Mark as Read" on unread notification', async () => {
      const onToggleRead = jest.fn();
      renderComponent([{ ...baseFeedbackSection, isRead: false }], [markAsReadMock], onToggleRead);

      fireEvent.click(screen.getByText('buttons.markAsRead'));

      await waitFor(() => {
        expect(onToggleRead).toHaveBeenCalledTimes(1);
      });
    });

    it('should call markAsUnread mutation when clicking "Mark as Unread" on read notification', async () => {
      const onToggleRead = jest.fn();
      renderComponent(
        [{ ...baseCustomizationSection, isRead: true }],
        [markAsUnreadMock],
        onToggleRead
      );

      fireEvent.click(screen.getByText('buttons.markAsUnread'));

      await waitFor(() => {
        expect(onToggleRead).toHaveBeenCalledTimes(1);
      });
    });

    it('should not call onToggleRead if id is null', async () => {
      const onToggleRead = jest.fn();
      /* eslint-disable @typescript-eslint/no-explicit-any */
      renderComponent([{ ...baseFeedbackSection, id: null } as any], [markAsReadMock], onToggleRead);

      fireEvent.click(screen.getByText('buttons.markAsRead'));

      await waitFor(() => {
        expect(onToggleRead).not.toHaveBeenCalled();
      });
    });

    it('should prevent default link behavior on mark as read click', () => {
      renderComponent();
      const link = screen.getByText('buttons.markAsRead');
      const event = fireEvent.click(link);
      expect(event).toBe(false);
    });
  });

  describe('view link button', () => {
    it('should show loading text when view button is clicked', async () => {
      renderComponent([baseFeedbackSection]);
      const viewButton = screen.getByText('buttons.viewPlan');
      fireEvent.click(viewButton);
      expect(screen.getByText('buttons.loading')).toBeInTheDocument();
    });
  });

  describe('accessibility', () => {
    it('should render section with aria-labelledby', async () => {
      const { container } = renderComponent();

      await act(async () => {
        const results = await axe(container);
        expect(results).toHaveNoViolations();
      });
    });
  });
});