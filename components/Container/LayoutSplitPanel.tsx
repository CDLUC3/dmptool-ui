
import { LayoutContainerProps } from './LayoutContainer';
import { ContentContainerProps } from './ContentContainer';

export type LayoutSplitPanelProps = LayoutContainerProps;

export const LayoutSplitPanel: React.FC<LayoutSplitPanelProps> = ({
  children,
  id,
  className = '',
  onClick,
}) => {
  return (
    <div
      id={id}
      className={`layout-container layout-split-panel ${className}`}
      data-testid="layout-split-panel"
      onClick={onClick}
    >
      {children}
    </div>
  );
};

export type FullWidthSectionProps = ContentContainerProps;

export const FullWidthSection: React.FC<FullWidthSectionProps> = ({
  children,
  id = '',
  className = '',
}) => {
  return (
    <section
      id={id}
      className={`layout-full-width-section ${className}`}
      data-testid="full-width-section"
    >
      {children}
    </section>
  );
};
