"use client";

import React, { useId } from "react";
import { useTranslations } from "next-intl";
import { Button } from "react-aria-components";
import { Link } from "@/i18n/routing";
import { withPreviewDraft, type QuestionPreviewDraftSync } from "./questionPreviewDraft";

interface QuestionPreviewLinkProps {
  href: string;
  label: string;
  isDisabled?: boolean;
  draftSync: QuestionPreviewDraftSync;
}

const QuestionPreviewLink: React.FC<QuestionPreviewLinkProps> = ({
  href,
  label,
  isDisabled = false,
  draftSync,
}) => {
  const t = useTranslations("TemplatePreview");
  const helpId = useId();
  const { previewId } = draftSync;

  const help = (
    <p id={helpId} className="help-text">
      {t("questionPreview.linkHelp")}
    </p>
  );

  if (isDisabled || !previewId) {
    return (
      <>
        <Button isDisabled aria-describedby={helpId} data-testid="preview-button">
          {label}
        </Button>
        {help}
      </>
    );
  }

  return (
    <>
      <Link
        href={withPreviewDraft(href, previewId)}
        target="_blank"
        rel="noopener"
        className="react-aria-Button"
        aria-describedby={helpId}
        data-testid="preview-button"
      >
        {label}
      </Link>
      {help}
    </>
  );
};

export default QuestionPreviewLink;
