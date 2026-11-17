'use client';

import React, { useRef, useState } from 'react';
import { useTranslations } from 'next-intl';
import { useMutation, useQuery } from '@apollo/client/react';
import {
  Button,
  Dialog,
  Form,
  Heading,
  Modal,
} from 'react-aria-components';

// GraphQL
import {
  AddTemplateLinkDocument,
  RemoveTemplateLinkDocument,
  TemplateDocument,
  TemplateLinksDocument,
  TemplateLinkType,
  UpdateTemplateLinkDocument,
} from '@/generated/graphql';

// Components
import ErrorMessages from '@/components/ErrorMessages';
import { FormInput, TransitionButton } from '@/components/Form';
import { DmpIcon } from '@/components/Icons';

// Utils and other
import { useToast } from '@/context/ToastContext';
import { handleApolloError } from '@/utils/apolloErrorHandler';
import styles from './TemplateLinks.module.scss';

// Used when the API does not report a limit
const DEFAULT_MAX_LINKS = 5;

export interface TemplateLinkItem {
  id?: number | null;
  linkType: TemplateLinkType;
  url: string;
  text?: string | null;
}

export interface TemplateLinksProps {
  templateId: number;
}

interface LinkModalState {
  linkType: TemplateLinkType;
  // The link being edited. Undefined when adding a new link
  link?: TemplateLinkItem;
}

interface FieldErrors {
  text?: string;
  url?: string;
}

// Only http and https URLs can be shown on the Funder Requirements page
export const isValidLinkUrl = (value: string): boolean => {
  try {
    const url = new URL(value);
    return url.protocol === 'http:' || url.protocol === 'https:';
  } catch {
    return false;
  }
};

const TemplateLinks: React.FC<TemplateLinksProps> = ({ templateId }) => {
  const t = useTranslations('TemplateLinks');
  const Global = useTranslations('Global');
  const toastState = useToast();

  const modalErrorRef = useRef<HTMLDivElement | null>(null);

  const [modalState, setModalState] = useState<LinkModalState | null>(null);
  const [linkText, setLinkText] = useState('');
  const [linkUrl, setLinkUrl] = useState('');
  const [fieldErrors, setFieldErrors] = useState<FieldErrors>({});
  const [modalErrors, setModalErrors] = useState<string[]>([]);
  const [isSaving, setIsSaving] = useState(false);
  const [removingId, setRemovingId] = useState<number | null>(null);

  const { data, error: loadError } = useQuery(TemplateLinksDocument, {
    variables: { templateId },
    // Links can be edited by other admins, so show the latest each visit
    fetchPolicy: 'cache-and-network',
  });

  // Link changes mark the template as having unpublished changes, so refresh
  // the template too so the sidebar's publish status stays accurate
  const refetchQueries = [
    { query: TemplateLinksDocument, variables: { templateId } },
    { query: TemplateDocument, variables: { templateId } },
  ];
  const [addTemplateLinkMutation] = useMutation(AddTemplateLinkDocument, { refetchQueries });
  const [updateTemplateLinkMutation] = useMutation(UpdateTemplateLinkDocument, { refetchQueries });
  const [removeTemplateLinkMutation] = useMutation(RemoveTemplateLinkDocument, { refetchQueries });

  const template = data?.template;
  const sections = [
    {
      linkType: TemplateLinkType.Funder,
      key: 'funder',
      links: (template?.funderLinks ?? []) as TemplateLinkItem[],
      max: template?.maxFunderLinks ?? DEFAULT_MAX_LINKS,
    },
    {
      linkType: TemplateLinkType.SamplePlan,
      key: 'samplePlan',
      links: (template?.samplePlanLinks ?? []) as TemplateLinkItem[],
      max: template?.maxSamplePlanLinks ?? DEFAULT_MAX_LINKS,
    },
  ] as const;

  const openModal = (linkType: TemplateLinkType, link?: TemplateLinkItem) => {
    setModalState({ linkType, link });
    setLinkText(link?.text ?? '');
    setLinkUrl(link?.url ?? '');
    setFieldErrors({});
    setModalErrors([]);
  };

  const closeModal = () => {
    setModalState(null);
    setIsSaving(false);
  };

  const validate = (): FieldErrors => {
    const errors: FieldErrors = {};
    if (!linkText.trim()) errors.text = t('messages.errors.textRequired');
    if (!linkUrl.trim()) {
      errors.url = t('messages.errors.urlRequired');
    } else if (!isValidLinkUrl(linkUrl.trim())) {
      errors.url = t('messages.errors.urlInvalid');
    }
    return errors;
  };

  const handleSave = async () => {
    if (!modalState || isSaving) return;

    const errors = validate();
    setFieldErrors(errors);
    setModalErrors([]);
    if (Object.keys(errors).length > 0) return;

    setIsSaving(true);
    const isEdit = !!modalState.link?.id;
    const variables = { url: linkUrl.trim(), text: linkText.trim() };

    try {
      const result = isEdit
        ? (await updateTemplateLinkMutation({
          variables: { templateLinkId: modalState.link!.id!, ...variables },
        })).data?.updateTemplateLink
        : (await addTemplateLinkMutation({
          variables: { templateId, linkType: modalState.linkType, ...variables },
        })).data?.addTemplateLink;

      // Validation errors come back as data (e.g. a duplicate URL or the limit was reached)
      // (only the add mutation returns a linkType error)
      const errs: { general?: string | null; url?: string | null; text?: string | null; linkType?: string | null } =
        result?.errors ?? {};
      if (!result || errs.general || errs.url || errs.text || errs.linkType) {
        setFieldErrors({ url: errs.url ?? undefined, text: errs.text ?? undefined });
        const general = errs.general ?? errs.linkType ?? (!result ? t('messages.errors.saveFailed') : null);
        setModalErrors(general ? [general] : []);
        setIsSaving(false);
        return;
      }

      toastState.add(t(isEdit ? 'messages.updated' : 'messages.added'), { type: 'success' });
      closeModal();
    } catch (err) {
      const { wasRealError } = handleApolloError(err, 'TemplateLinks.handleSave');
      if (wasRealError) setModalErrors([t('messages.errors.saveFailed')]);
      setIsSaving(false);
    }
  };

  const handleRemove = async (link: TemplateLinkItem) => {
    if (!link.id || removingId) return;
    setRemovingId(link.id);

    try {
      const { data: removeData } = await removeTemplateLinkMutation({
        variables: { templateLinkId: link.id },
      });
      const errors = removeData?.removeTemplateLink?.errors;
      if (!removeData?.removeTemplateLink || errors?.general) {
        toastState.add(errors?.general ?? t('messages.errors.removeFailed'), { type: 'error' });
      } else {
        toastState.add(t('messages.removed'), { type: 'success' });
      }
    } catch (err) {
      const { wasRealError } = handleApolloError(err, 'TemplateLinks.handleRemove');
      if (wasRealError) toastState.add(t('messages.errors.removeFailed'), { type: 'error' });
    } finally {
      setRemovingId(null);
    }
  };

  const isEditing = !!modalState?.link?.id;
  const modalSectionKey = modalState?.linkType === TemplateLinkType.SamplePlan ? 'samplePlan' : 'funder';

  return (
    <section className={styles.templateLinks} aria-labelledby="template-links-heading" data-testid="template-links">
      <h3 id="template-links-heading">{t('heading')}</h3>
      <p className={styles.description}>{t('description')}</p>

      {loadError && (
        <p className="error-message" role="alert">{t('messages.errors.loadFailed')}</p>
      )}

      {sections.map(({ linkType, key, links, max }) => {
        const headingId = `template-links-${key}-heading`;
        return (
          <div key={key} className={styles.linkGroup} data-testid={`template-links-${key}`}>
            <div className={styles.groupHeader}>
              <h4 id={headingId}>{t(`${key}.title`)}</h4>
              <span className={styles.count} data-testid={`template-links-${key}-count`}>
                {t('count', { count: links.length, max })}
              </span>
            </div>

            {links.length === 0 ? (
              <p className={styles.empty}>{t(`${key}.empty`)}</p>
            ) : (
              <ul className={styles.cards} aria-labelledby={headingId}>
                {links.map((link) => {
                  const label = link.text || link.url;
                  return (
                    <li key={link.id} className={styles.card} data-testid="template-link-card">
                      <div className={styles.cardText}>
                        <span className={styles.linkText}>{label}</span>
                        <a
                          href={link.url}
                          target="_blank"
                          rel="noopener noreferrer"
                          className={styles.openLink}
                          aria-label={t('labels.openLink', { text: label })}
                        >
                          <DmpIcon icon="external_link" width="18px" height="18px" />
                        </a>
                      </div>
                      <div className={styles.cardActions}>
                        <Button
                          className={`link ${styles.editButton}`}
                          aria-label={t('labels.editLink', { text: label })}
                          onPress={() => openModal(linkType, link)}
                        >
                          {Global('buttons.edit')}
                        </Button>
                        <Button
                          className={`link ${styles.removeButton}`}
                          aria-label={t('labels.removeLink', { text: label })}
                          isDisabled={removingId === link.id}
                          onPress={() => handleRemove(link)}
                        >
                          {Global('buttons.remove')}
                        </Button>
                      </div>
                    </li>
                  );
                })}
              </ul>
            )}

            {links.length < max && (
              <div className="panelRow">
                <Button className="buttonLink link" onPress={() => openModal(linkType)}>
                  <span aria-hidden="true">+ </span>{t(`${key}.add`)}
                </Button>
              </div>
            )}
          </div>
        );
      })}

      <Modal
        isDismissable
        isOpen={!!modalState}
        onOpenChange={(isOpen) => { if (!isOpen) closeModal(); }}
        data-testid="template-link-modal"
      >
        <Dialog>
          <div>
            <Form
              onSubmit={(e) => {
                e.preventDefault();
                void handleSave();
              }}
              validationBehavior="aria"
            >
              <Heading slot="title">
                {t(`${modalSectionKey}.${isEditing ? 'editTitle' : 'addTitle'}`)}
              </Heading>

              {modalErrors.length > 0 && (
                <ErrorMessages errors={modalErrors} ref={modalErrorRef} />
              )}

              <FormInput
                name="linkText"
                label={t('labels.linkText')}
                value={linkText}
                onChange={(e) => setLinkText(e.target.value)}
                helpMessage={t('labels.linkTextHelp')}
                isRequired
                isInvalid={!!fieldErrors.text}
                errorMessage={fieldErrors.text}
                maxLength={255}
              />

              <FormInput
                name="linkUrl"
                type="url"
                label={t('labels.linkUrl')}
                value={linkUrl}
                onChange={(e) => setLinkUrl(e.target.value)}
                isRequired
                isInvalid={!!fieldErrors.url}
                errorMessage={fieldErrors.url}
                maxLength={255}
              />

              <div className="modal-actions">
                <div>
                  <TransitionButton
                    type="submit"
                    isDisabled={isSaving}
                    showLoading={false}
                    loadingVariant="inline"
                    loadingLabel={isEditing ? Global('buttons.saving') : t('buttons.adding')}
                  >
                    {isEditing ? t('buttons.saveLink') : t('buttons.addLink')}
                  </TransitionButton>
                </div>
                <div>
                  <Button data-secondary className="secondary" onPress={closeModal}>
                    {Global('buttons.cancel')}
                  </Button>
                </div>
              </div>
            </Form>
          </div>
        </Dialog>
      </Modal>
    </section>
  );
};

export default TemplateLinks;
