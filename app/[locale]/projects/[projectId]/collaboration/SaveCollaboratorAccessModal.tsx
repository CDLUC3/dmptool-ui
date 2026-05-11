import React from 'react';
import { useTranslations } from 'next-intl';
import {
  Button,
  Dialog,
  DialogTrigger,
  Modal,
  ModalOverlay
} from "react-aria-components";
import styles from './ProjectsProjectCollaboration.module.scss';
import { AccessLevelKey } from '@/app/types';

interface SaveCollaboratorAccessModalProps {
  collaboratorId: number;
  collaboratorName: string;
  isOpen: boolean;
  isDeleting: boolean;
  pendingAccessLevel: string;
  onOpenChange: (open: boolean) => void;
  onRevoke: (id: number, name: string) => void;
  onCancel: () => void;
}

const SaveCollaboratorAccessModal: React.FC<SaveCollaboratorAccessModalProps> = ({
  collaboratorId,
  collaboratorName,
  isOpen,
  isDeleting,
  pendingAccessLevel,
  onOpenChange,
  onRevoke,
  onCancel,
}) => {
  // Localization
  const Global = useTranslations('Global');
  const t = useTranslations('ProjectsProjectCollaboration');

  const isPrimaryDesignation = pendingAccessLevel === 'primary';
  const accessLevelLabel = t(`accessLevels.${pendingAccessLevel.toLowerCase() as AccessLevelKey}`, { defaultValue: pendingAccessLevel });
  return (
    <div className={styles.memberActions}>
      <DialogTrigger
        isOpen={isOpen}
        onOpenChange={onOpenChange}
      >
        <Button
          className="primary"
          aria-label={t('saveAccessFor', { name: collaboratorName })}
          isDisabled={isDeleting}
        >
          {Global('buttons.save')}
        </Button>

        <ModalOverlay className={`${styles.modalOverride} react-aria-ModalOverlay`}>
          <Modal>
            <Dialog>
              {({ close }) => (
                <>
                  <h3>{t('headings.saveCollaboratorAccessUpdate')}</h3>
                  {isPrimaryDesignation ? (
                    <p>{t('primaryDesignationChangeWarning', { name: collaboratorName })}</p>
                  ) : (
                    <p>{t('saveCollaboratorAccess', { name: collaboratorName, accessLevel: accessLevelLabel })}</p>
                  )}
                  <div className={styles.buttonContainer}>
                    <Button
                      className="secondary"
                      aria-label={t('cancelRemoval', { name: collaboratorName })}
                      autoFocus
                      onPress={() => {
                        onCancel();
                        close();
                      }}>
                      {Global('buttons.cancel')}
                    </Button>
                    <Button
                      className="primary"
                      aria-label={t('saveCollaboratorAccess', { name: collaboratorName, accessLevel: accessLevelLabel })}
                      onPress={() => {
                        onRevoke(collaboratorId, collaboratorName);
                        close();
                      }}
                    >
                      {Global('buttons.save')}
                    </Button>
                  </div>
                </>
              )}
            </Dialog>
          </Modal>
        </ModalOverlay>
      </DialogTrigger>
    </div>
  )

};

export default SaveCollaboratorAccessModal;