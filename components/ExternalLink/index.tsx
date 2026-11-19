import React from "react";
import { useTranslations } from "next-intl";
import { DmpIcon } from "@/components/Icons";
import styles from "./ExternalLink.module.scss";

export interface ExternalLinkProps
  extends Omit<React.AnchorHTMLAttributes<HTMLAnchorElement>, "target" | "rel" | "aria-label"> {
  href: string;
  children: React.ReactNode;
}

const ExternalLink = ({ href, children, ...rest }: ExternalLinkProps) => {
  const Global = useTranslations("Global");

  return (
    <a
      href={href}
      target="_blank"
      rel="noopener noreferrer"
      {...rest}
    >
      {children}
      <DmpIcon
        icon="external_link"
        fill="currentColor"
        classes={styles.icon}
      />
      <span className="hidden-accessibly"> ({Global("opensInNewTab")})</span>
    </a>
  );
};

export default ExternalLink;
