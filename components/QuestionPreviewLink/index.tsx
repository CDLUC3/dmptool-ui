'use client'

import React from 'react';
import { useTranslations } from 'next-intl';
import { Button } from 'react-aria-components';
import { Link } from '@/i18n/routing';
import { withPreviewDraft, type QuestionPreviewDraftSync } from './questionPreviewDraft';

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
  const Global = useTranslations('Global');
  const { previewId } = draftSync;

  if (isDisabled || !previewId) {
    return (
      <Button isDisabled data-testid="preview-button">
        {label}
      </Button>
    );
  }

  return (
    <Link
      href={withPreviewDraft(href, previewId)}
      target="_blank"
      rel="noopener"
      className="react-aria-Button"
      data-testid="preview-button"
    >
      {label}
      <span className="hidden-accessibly"> ({Global('opensInNewTab')})</span>
    </Link>
  );
};

export default QuestionPreviewLink;
