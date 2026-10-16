import React, { ReactNode } from "react";
import { PressEvent } from "react-aria-components";
import styles from "./StyleguideComponents.module.scss";

interface ExampleProps {
  children: ReactNode;
}

export function Example({ children }: ExampleProps) {
  return <div className="sg-example">{children}</div>;
}

interface BrandColorProps {
  varname: string;
  description?: string;
}

export function BrandColor({ varname, description }: BrandColorProps) {
  const styleprops: React.CSSProperties & { [key: string]: string } = {
    "--_color": `var(${varname})`,
  };

  // Get the computed color value
  const [colorValue, setColorValue] = React.useState<string>("");

  React.useEffect(() => {
    if (typeof window !== "undefined") {
      const root = document.documentElement;
      const computedValue = getComputedStyle(root).getPropertyValue(varname);
      setColorValue(computedValue.trim());
    }
  }, [varname]);

  return (
    <div
      className="brand-color"
      style={styleprops}
      title={description}
    >
      <div className="brand-color-swatch" />
      <div className="brand-color-info">
        <code className="brand-color-varname">{varname}</code>
        {colorValue && <span className="brand-color-hex">{colorValue}</span>}
        {description && <p className="brand-color-description">{description}</p>}
      </div>
    </div>
  );
}

// Styleguide-specific components using CSS modules
interface SGComponentExampleProps {
  children: ReactNode;
}

export function SGComponentExample({ children }: SGComponentExampleProps) {
  return <div className={styles.componentExample}>{children}</div>;
}

interface SGComponentExampleHeaderProps {
  title: string;
  description?: string;
}

export function SGComponentExampleHeader({ title, description }: SGComponentExampleHeaderProps) {
  return (
    <div className={styles.componentExampleHeader}>
      <h3 className={styles.componentExampleTitle}>{title}</h3>
      {description && <p className={styles.componentExampleDescription}>{description}</p>}
    </div>
  );
}

interface SGComponentExampleContentProps {
  children: ReactNode;
}

export function SGComponentExampleContent({ children }: SGComponentExampleContentProps) {
  return <div className={styles.componentExampleContent}>{children}</div>;
}

interface SGComponentExampleDemoProps {
  children: ReactNode;
}

export function SGComponentExampleDemo({ children }: SGComponentExampleDemoProps) {
  return <div className={styles.componentExampleDemo}>{children}</div>;
}

interface SGComponentExampleFooterProps {
  children: ReactNode;
}

export function SGComponentExampleFooter({ children }: SGComponentExampleFooterProps) {
  return <div className={styles.componentExampleFooter}>{children}</div>;
}

interface SGCodeBlockProps {
  children: ReactNode;
  language?: string;
}

export function SGCodeBlock({ children, language: _language }: SGCodeBlockProps) {
  return (
    <pre className={styles.codeBlock}>
      <code>{children}</code>
    </pre>
  );
}

interface SGPropsTableProps {
  children: ReactNode;
}

export function SGPropsTable({ children }: SGPropsTableProps) {
  return <table className={styles.propsTable}>{children}</table>;
}

interface SGGuidelinesGridProps {
  children: ReactNode;
}

export function SGGuidelinesGrid({ children }: SGGuidelinesGridProps) {
  return <div className={styles.guidelinesGrid}>{children}</div>;
}

interface SGGuidelineItemProps {
  title: string;
  children: ReactNode;
}

export function SGGuidelineItem({ title, children }: SGGuidelineItemProps) {
  return (
    <div className={styles.guidelineItem}>
      <h3>{title}</h3>
      {children}
    </div>
  );
}

interface SGTocGridProps {
  children: ReactNode;
}

export function SGTocGrid({ children }: SGTocGridProps) {
  return <div className={styles.tocGrid}>{children}</div>;
}

interface SGTocSectionProps {
  title: string;
  children: ReactNode;
}

export function SGTocSection({ title, children }: SGTocSectionProps) {
  return (
    <div className={styles.tocSection}>
      <h3>{title}</h3>
      {children}
    </div>
  );
}

// Additional SG components for common patterns
interface SGSectionHeadingProps {
  children: ReactNode;
  level?: 2 | 3 | 4 | 5;
}

export function SGSectionHeading({ children, level = 2 }: SGSectionHeadingProps) {
  const Tag = `h${level}` as const;
  return React.createElement(Tag as React.ElementType, { className: styles.sectionHeading }, children);
}
interface SGSubHeadingProps {
  children: ReactNode;
}

export function SGSubHeading({ children }: SGSubHeadingProps) {
  return <h4 className={styles.subHeading}>{children}</h4>;
}

interface SGLeadTextProps {
  children: ReactNode;
}

export function SGLeadText({ children }: SGLeadTextProps) {
  return <p className="lead">{children}</p>;
}

export const handleDelete = async (e: PressEvent, close: () => void) => {
  console.log("Deleting item...");
  close();
};
