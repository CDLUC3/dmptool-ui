import { ContentContainerProps } from './ContentContainer';
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
