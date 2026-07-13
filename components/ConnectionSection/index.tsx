'use client';

import React from 'react';
import Image from 'next/image';
import { useTranslations } from 'next-intl';
import {
  Button,
  DialogTrigger,
  PressEvent
} from 'react-aria-components';
import ButtonWithImage from '../ButtonWithImage';
import { ModalOverlayComponent } from '../ModalOverlayComponent';
import { DmpIcon } from '@/components/Icons';
import styles from './connectionSection.module.scss';

type ConnectionType = 'orcid' | 'sso';

interface ConnectionSectionProps {
  type: ConnectionType;
  isConnected?: boolean;
  title: string;
  content?: string;
  btnUrl?: string;
  btnImageUrl?: string;
  btnText: string;
  connectedIdentifier?: string;
  onConnect?: () => void;
  onDisconnect?: () => void | Promise<void>;
}

type CloseFunction = () => void;
type HandleDisconnectFunction = (e: PressEvent, close: CloseFunction) => void;

const ORCID_PLACEHOLDER_ID = '0000-0001-2345-6789';
const SSO_PLACEHOLDER_INSTITUTION = 'Example University';

const ConnectionSection = ({
  type,
  isConnected = false,
  title,
  content,
  btnUrl,
  btnImageUrl,
  btnText,
  connectedIdentifier,
  onConnect,
  onDisconnect,
}: ConnectionSectionProps) => {
  const t = useTranslations('UserConnections');
  const tGlobal = useTranslations('Global');
  const connectedTranslationScope = type === 'orcid' ? 'orcidConnectionConnected' : 'ssoConnectionConnected';

  const handleDisconnect: HandleDisconnectFunction = async (_e, close) => {
    if (onDisconnect) {
      await onDisconnect();
    }
    close();
  };

  const resolvedIdentifier = connectedIdentifier ?? (
    type === 'orcid' ? ORCID_PLACEHOLDER_ID : SSO_PLACEHOLDER_INSTITUTION
  );

  const orcidUrl = `https://orcid.org/${resolvedIdentifier}`;

  if (isConnected) {
    return (
      <div className={styles.connectionSection}>
        <h2 className="h3">{title}</h2>
        {content && (
          <p dangerouslySetInnerHTML={{ __html: content }} />
        )}

        <div className={styles.connectedRow} role="group" aria-label={title}>
          <div className={styles.connectedDetails}>
            {type === 'orcid' && btnImageUrl && (
              <Image
                src={btnImageUrl}
                className={styles.connectedLogo}
                width={20}
                height={20}
                alt=""
              />
            )}
            {type === 'orcid' ? (
              <a
                href={orcidUrl}
                className={styles.connectedLink}
                target="_blank"
                rel="noopener noreferrer"
              >
                {orcidUrl}
                <span className="sr-only">{tGlobal('opensInNewTab')}</span>
              </a>
            ) : (
              <span className={styles.connectedIdentifier}>{resolvedIdentifier}</span>
            )}
          </div>

          <div className={styles.connectedActions}>
            <span className={styles.connectedBadge}>
              <DmpIcon
                icon="check_circle"
                classes={styles.connectedBadgeIcon}
                width="16px"
                height="16px"
              />
              {t(`${connectedTranslationScope}.connectedBadge`)}
            </span>

            <DialogTrigger>
              <Button
                className={`danger ${styles.disconnectButton}`}
                aria-label={t(`${connectedTranslationScope}.disconnectAria`)}
              >
                {t(`${connectedTranslationScope}.disconnect`)}
              </Button>
              <ModalOverlayComponent
                heading={t(`${connectedTranslationScope}.disconnectConfirmTitle`)}
                content={t(`${connectedTranslationScope}.disconnectConfirmMessage`)}
                btnSecondaryText={t('btnCancel')}
                btnPrimaryText={t(`${connectedTranslationScope}.disconnect`)}
                onPressAction={handleDisconnect}
              />
            </DialogTrigger>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className={styles.connectionSection}>
      <h2 className="h3">{title}</h2>
      {content && (
        <p dangerouslySetInnerHTML={{ __html: content }} />
      )}
      <ButtonWithImage
        url={btnUrl}
        onPress={onConnect}
        imageUrl={btnImageUrl ? btnImageUrl : undefined}
        buttonText={btnText}
      />
    </div>
  );
};

export default ConnectionSection;
