"use client";

import React, { useEffect, useRef, useState } from "react";
import { useTranslations } from "next-intl";
import { useParams, useRouter } from "next/navigation";
import {
  Breadcrumb,
  Breadcrumbs,
  Button,
  Dialog,
  DialogTrigger,
  Link,
  Modal,
  ModalOverlay
} from "react-aria-components";

// GraphQL
import { useQuery, useMutation } from '@apollo/client/react';
import {
  CustomizableObjectOwnership,
  MoveCustomSectionDocument,
  SectionCustomizationOverview,
  PublishTemplateCustomizationDocument,
  UnpublishTemplateCustomizationDocument,
  TemplateCustomizationOverviewDocument,
  RemoveTemplateCustomizationDocument
} from "@/generated/graphql";

// Components
import {
  ContentContainer,
  LayoutWithPanel,
  SidebarPanel
} from "@/components/Container";
import PageHeader from "@/components/PageHeader";
import AddSectionButton from "@/components/AddSectionButton";
import ErrorMessages from "@/components/ErrorMessages";
import CustomizedSectionEdit from "@/components/CustomizedTemplate/CustomizedSectionEdit";
import { DmpIcon } from "@/components/Icons";
import Loading from "@/components/Loading";

// Hooks
import { useFormatDate } from "@/hooks/useFormatDate";
import { useTemplateStatus } from "../../hooks/useTemplateStatus";

// Utils and other
import logECS from "@/utils/clientLogger";
import { useToast } from "@/context/ToastContext";
import styles from "./templateCustomizationOverview.module.scss";
import { routePath } from "@/utils/index";

const TemplateCustomizationOverview: React.FC = () => {
  const formatDate = useFormatDate();

  const toastState = useToast();

  // Page level errors
  const [errorMessages, setErrorMessages] = useState<string[]>([]);

  // localization keys
  const EditTemplate = useTranslations("EditTemplates");
  const CustomizableTemplates = useTranslations("CustomizableTemplates");
  const Messaging = useTranslations("Messaging");
  const Global = useTranslations("Global");


  // Template publish status hook
  const { getPublishStatusText, getCustomizationStatus } = useTemplateStatus();

  //Track local section order - using optimistic rendering
  const [localSections, setLocalSections] = useState<SectionCustomizationOverview[]>([]);
  const [isReordering, setIsReordering] = useState(false);

  // State for remove project member modal
  const [isDeleteModalOpen, setIsDeleteModalOpen] = useState(false);
  const [isDeleting, setIsDeleting] = useState(false);

  // Get templateCustomizationId param
  const params = useParams();
  const router = useRouter();
  const templateCustomizationId = String(params.templateCustomizationId); // From route /template/customizations/:templateCustomizationId

  //For scrolling to error in modal window
  const errorRef = useRef<HTMLDivElement | null>(null);

  // Run template query to get all sections and questions under the given templateCustomizationId
  const {
    data,
    loading,
    error: templateQueryErrors,
    refetch
  } = useQuery(TemplateCustomizationOverviewDocument, {
    variables: { templateCustomizationId: Number(templateCustomizationId) },
    fetchPolicy: 'cache-and-network', // User sees cached data imediately while a fresh fetch runs to get latest updates from editing
  });

  // Mutations
  const [publishTemplateCustomization] = useMutation(PublishTemplateCustomizationDocument);
  const [unpublishTemplateCustomization] = useMutation(UnpublishTemplateCustomizationDocument);
  const [moveCustomSectionMutation] = useMutation(MoveCustomSectionDocument);
  const [removeTemplateCustomization] = useMutation(RemoveTemplateCustomizationDocument);


  const showSuccessToast = () => {
    const successMessage = Messaging("successfullyUpdated");
    toastState.add(successMessage, { type: "success" });
  };

  const showSuccessDeleteCustomization = () => {
    const successMessage = CustomizableTemplates("messages.success.successfullyDeletedCustomizations");
    toastState.add(successMessage, { type: "success" });
  };

  const showSuccessMoveSection = () => {
    const successMessage = CustomizableTemplates("messages.success.sectionMoved");
    toastState.add(successMessage, { type: "success" });
  };

  const showSuccessUnpublishCustomization = () => {
    const successMessage = CustomizableTemplates("messages.success.successfullyUnpublishedCustomization");
    toastState.add(successMessage, { type: "success" });
  };

  // Optimistic update function
  const updateLocalSectionOrder = (sectionId: number, direction: 'up' | 'down') => {
    setLocalSections(prevSections => {
      const sorted = [...prevSections].sort((a, b) => a.displayOrder! - b.displayOrder!);
      const index = sorted.findIndex(s => s.id === sectionId);
      const swapIndex = direction === 'up' ? index - 1 : index + 1;

      if (swapIndex < 0 || swapIndex >= sorted.length) return prevSections;

      // Swap display orders of the two sections
      const updated = [...sorted];
      const temp = updated[index].displayOrder;
      updated[index] = { ...updated[index], displayOrder: updated[swapIndex].displayOrder };
      updated[swapIndex] = { ...updated[swapIndex], displayOrder: temp };

      return updated.sort((a, b) => a.displayOrder! - b.displayOrder!);
    });
  };

  const validateSectionMove = (sectionId: number, direction: 'up' | 'down'): { isValid: boolean; message?: string } => {
    const sorted = [...localSections].sort((a, b) => a.displayOrder! - b.displayOrder!);
    const index = sorted.findIndex(s => s.id === sectionId);

    if (index === -1) {
      return { isValid: false, message: EditTemplate("errors.updateDisplayOrderError") };
    }
    if (direction === 'up' && index === 0) {
      return { isValid: false, message: EditTemplate("errors.displayOrderAlreadyAtTop") };
    }
    if (direction === 'down' && index === sorted.length - 1) {
      return { isValid: false, message: EditTemplate("errors.cannotMoveFurtherDown") };
    }

    return { isValid: true };
  };

  const getSectionAnchor = (
    sections: SectionCustomizationOverview[],
    sectionId: number,
    direction: 'up' | 'down'
  ): { newSectionId: number | null; newSectionType: CustomizableObjectOwnership } => {
    const sorted = [...sections].sort((a, b) => a.displayOrder! - b.displayOrder!);
    const currentIndex = sorted.findIndex(s => s.id === sectionId);

    if (direction === 'up') {
      // Pin after the section that is two above (index - 2), or null to become first
      const anchorSection = sorted[currentIndex - 2] ?? null;
      return {
        newSectionId: anchorSection?.id ?? null,
        newSectionType: anchorSection?.sectionType ?? null,
      };
    } else {
      // Pin after the section currently below (index + 1)
      const anchorSection = sorted[currentIndex + 1] ?? null;
      return {
        newSectionId: anchorSection?.id ?? null,
        newSectionType: anchorSection?.sectionType as CustomizableObjectOwnership ?? null,
      };
    }
  };

  const handleSectionMove = async (sectionId: number, direction: 'up' | 'down') => {
    if (isReordering) return;
    setErrorMessages([]);

    const { isValid, message } = validateSectionMove(sectionId, direction);
    if (!isValid && message) {
      toastState.add(message, { type: 'error' });
      return;
    }

    // Snapshot before optimistic update
    const previousSections = [...localSections];

    const { newSectionId, newSectionType } = getSectionAnchor(localSections, sectionId, direction);

    // Optimistic update
    updateLocalSectionOrder(sectionId, direction);
    setIsReordering(true);

    try {
      const response = await moveCustomSectionMutation({
        variables: {
          input: {
            customSectionId: sectionId,
            newSectionId,
            newSectionType,
          }
        }
      });

      const result = response?.data?.moveCustomSection;

      if (!result || result.errors?.general) {
        setLocalSections(previousSections); // revert
        setErrorMessages(prev => [...prev, result?.errors?.general || CustomizableTemplates("messages.error.updatingSectionMoveError")]);
        logECS("error", "handleSectionMove", {
          error: result?.errors?.general || "Unknown error",
          url: { path: routePath("template.customize", { templateCustomizationId }) },
        });
      } else {
        showSuccessMoveSection();
        // Refetch so that "Publish changes" button displays correctly based on whether there are unpublished changes after the move
        await refetch();
      }
    } catch (err) {
      setLocalSections(previousSections); // revert
      setErrorMessages(prev => [...prev, CustomizableTemplates("messages.error.updatingSectionMoveError")]);
      logECS("error", "handleSectionMove", {
        error: err,
        url: { path: routePath("template.customize", { templateCustomizationId }) },
      });
    } finally {
      setIsReordering(false);
    }
  };

  const handleDeleteCustomization = async () => {
    if (isDeleting) return; // Prevent double-clicks
    setIsDeleting(true);
    setErrorMessages([]); // Clear previous errors

    try {
      const response = await removeTemplateCustomization({
        variables: {
          templateCustomizationId: Number(templateCustomizationId),
        },
      });

      const responseErrors = response.data?.removeTemplateCustomization?.errors;

      if (responseErrors && typeof responseErrors.general === "string") {
        if (responseErrors.general) {
          const message = responseErrors.general;
          setErrorMessages((prev) => [...prev, message]);
          logECS("error", "handleDeleteCustomization", {
            error: message,
            url: { path: routePath("template.customize", { templateCustomizationId }) },
          });
        }
      } else {
        showSuccessDeleteCustomization();
        router.push(routePath("template.customizations"));
      }
    } catch (err) {
      setErrorMessages((prevErrors) => [...prevErrors, CustomizableTemplates("messages.error.deleteCustomizationError")]);
      logECS("error", "handleDeleteCustomization", {
        error: err,
        url: { path: routePath("template.customize", { templateCustomizationId }) },
      });
    } finally {
      setIsDeleting(false);
    }
  };

  const handleUnpublishCustomization = async () => {
    setErrorMessages([]); // Clear previous errors

    try {
      const response = await unpublishTemplateCustomization({
        variables: {
          templateCustomizationId: Number(templateCustomizationId)
        },
      });

      const result = response?.data?.unpublishTemplateCustomization;

      if (!result) {
        setErrorMessages([CustomizableTemplates("messages.error.unpublishCustomizationError")]);
        logECS("error", "unpublishTemplateCustomization", {
          error: "No result returned from mutation",
          url: { path: routePath("template.customize", { templateCustomizationId }) },
        });
        return;
      }

      if (result.errors?.general) {
        setErrorMessages([result.errors.general]);
        return;
      }

      showSuccessUnpublishCustomization();
      await refetch();
    } catch (err) {
      setErrorMessages([CustomizableTemplates("messages.error.unpublishCustomizationError")]);
      logECS("error", "unpublishTemplateCustomization", {
        error: err,
        url: { path: routePath("template.customize", { templateCustomizationId }) },
      });
    }
  };

  const handlePublishCustomization = async () => {
    setErrorMessages([]); // Clear previous errors

    try {
      const response = await publishTemplateCustomization({
        variables: {
          templateCustomizationId: Number(templateCustomizationId)
        },
      });

      const result = response?.data?.publishTemplateCustomization;

      if (!result) {
        setErrorMessages([CustomizableTemplates("messages.error.saveCustomizationError")]);
        logECS("error", "saveCustomizationTemplate", {
          error: "No result returned from mutation",
          url: { path: routePath("template.customize", { templateCustomizationId }) },
        });
        return;
      }

      if (result.errors?.general) {
        setErrorMessages([result.errors.general]);
        return;
      }

      showSuccessToast();
      await refetch();
    } catch (err) {
      setErrorMessages([CustomizableTemplates("messages.error.saveCustomizationError")]);
      logECS("error", "saveCustomizationTemplate", {
        error: err,
        url: { path: routePath("template.customize", { templateCustomizationId }) },
      });
    }
  };

  useEffect(() => {
    if (data?.templateCustomizationOverview?.sections) {
      const sorted = [...data.templateCustomizationOverview.sections]
        .filter((s): s is SectionCustomizationOverview => s !== null)
        .sort((a, b) => a.displayOrder! - b.displayOrder!);
      setLocalSections(sorted);
    }
  }, [data]);

// Only call loading if there is no data yet. Otherwise, the query refetch calls cause the page to scroll to top when user
// changes ordering of section or questions
if (loading && !data) {
  return <Loading message={Global("messaging.loading")} />;
}

  if (templateQueryErrors) {
    return <ErrorMessages errors={[templateQueryErrors.message]} />;
  }

  const template = data?.templateCustomizationOverview;

  if (!template) {
    return <div>{EditTemplate("errors.noTemplateFound")}</div>;
  }

  // Format the latest publish date if it exists
  const formattedPublishDate = template.customizationLastCustomized ? formatDate(template.customizationLastCustomized) : null;

  const description =
    `by ${template.versionedTemplateAffiliationName}` +
    (template.versionedTemplateVersion
      ? ` - ${Global("version")}: ${template.versionedTemplateVersion}`
      : "") +
    (formattedPublishDate
      ? ` - ${Global("lastUpdated")}: ${formattedPublishDate}`
      : "");

  const customizationStatus = getCustomizationStatus(
    template.customizationIsDirty,
    template.customizationLastPublishedDate
  );

  return (
    <div>
      <PageHeader
        title={template.versionedTemplateName}
        description={description}
        showBackButton={false}
        breadcrumbs={
          <Breadcrumbs>
            <Breadcrumb>
              <Link href={routePath("app.home")}>{Global("breadcrumbs.home")}</Link>
            </Breadcrumb>
            <Breadcrumb>
              <Link href={routePath("template.customizations")}>{Global("breadcrumbs.templateCustomizations")}</Link>
            </Breadcrumb>
            <Breadcrumb>{template.versionedTemplateName}</Breadcrumb>
          </Breadcrumbs>
        }
        className="page-template-overview"
      />

      <ErrorMessages
        errors={errorMessages}
        ref={errorRef}
      />

      <LayoutWithPanel>
        <ContentContainer>
          {template.sections && template?.sections?.length > 0 && (
            <div>
              {localSections.map((section) => (
                <CustomizedSectionEdit
                  key={section.id}
                  section={section}
                  displayOrder={section.displayOrder!}
                  templateCustomizationId={templateCustomizationId}
                  setErrorMessages={setErrorMessages}
                  refetch={refetch}
                  onMoveUp={
                    section.sectionType === 'CUSTOM'
                      ? () => handleSectionMove(section.id!, 'up')
                      : undefined
                  }
                  onMoveDown={
                    section.sectionType === 'CUSTOM'
                      ? () => handleSectionMove(section.id!, 'down')
                      : undefined
                  }

                />
              ))}
            </div>
          )}
          <AddSectionButton href={`/template/customizations/${templateCustomizationId}/section/create`} />

        </ContentContainer>
        <SidebarPanel className="sidebar">
          <div className="status-panel-content side-panel">
            {/* NOT_STARTED: no buttons rendered */}
            {customizationStatus !== 'NOT_STARTED' && (
              <div className={`buttonContainer withBorder mb-5 ${customizationStatus === 'DRAFT' || customizationStatus === 'PUBLISHED' ? 'centered' : ''
                }`}>

                {customizationStatus === 'DRAFT' && (
                  <Button onPress={handlePublishCustomization}>
                    {CustomizableTemplates("buttons.publishCustomization")}
                  </Button>
                )}

                {customizationStatus === 'UNPUBLISHED_CHANGES' && (
                  <>
                    <Button onPress={handlePublishCustomization}>
                      {CustomizableTemplates("buttons.publishChanges")}
                    </Button>
                    <Button className="secondary" onPress={handleUnpublishCustomization}>
                      {Global("buttons.unpublish")}
                    </Button>
                  </>
                )}

                {customizationStatus === 'PUBLISHED' && (
                  <Button className="secondary" onPress={handleUnpublishCustomization}>
                    {Global("buttons.unpublish")}
                  </Button>
                )}
              </div>
            )}

            <div className="panelRow mb-5">
              <div>
                <h3>{CustomizableTemplates("buttons.publishStatus")}</h3>
              </div>
              <div>
                {getPublishStatusText(template.customizationIsDirty, template?.customizationLastPublishedDate)}
              </div>
            </div>

            <div className="side-panel-content">
              <div className="panelRow mb-5">
                <div>
                  <h3>{EditTemplate("button.previewTemplate")}</h3>
                </div>
                <Link
                  href="#"
                  onPress={() => console.log("Preview")}
                  className="side-panel-link"
                >
                  {Global('buttons.preview')}
                </Link>
              </div>

              <div className="panelRow mb-5">
                <div>
                  <h3>{EditTemplate("heading.feedbackAndCollaboration")}</h3>
                  <p>{EditTemplate("allowAccess")}</p>
                </div>
                <Link
                  href={`/template/customizations/${templateCustomizationId}/access`}
                  className="side-panel-link"
                >
                  {EditTemplate("links.manageAccess")}
                </Link>
              </div>

              <div className="panelRow mb-5">
                <div>
                  <h3>{EditTemplate("heading.history")}</h3>
                </div>
                <Link
                  href={`/template/customizations/${templateCustomizationId}/history`}
                  className="side-panel-link"
                >
                  {EditTemplate("links.templateHistory")}
                </Link>
              </div>
            </div>
          </div>
        </SidebarPanel>

        {/* Delete Customization Modal */}
        <section className={styles.deleteTemplateCustomizationContainer} aria-labelledby="delete-customization-heading" data-testid="delete-customization-section">
          <h2 id="delete-customization-heading">{CustomizableTemplates("heading.deleteCustomization")}</h2>
          <p className={styles.dangerZoneDescription}><DmpIcon icon="warning" />{CustomizableTemplates.rich("descriptions.deleteCustomization", {
            strong: (chunks) => <strong>{chunks}</strong>
          })}</p>
          <DialogTrigger isOpen={isDeleteModalOpen} onOpenChange={setIsDeleteModalOpen}>
            <Button
              className="danger"
              isDisabled={isDeleting}
            >
              {isDeleting ? `${CustomizableTemplates('buttons.deletingCustomizations')}...` : CustomizableTemplates("buttons.deleteCustomization")}
            </Button>
            <ModalOverlay>
              <Modal>
                <Dialog>
                  {({ close }) => (
                    <>
                      <h3>{CustomizableTemplates("heading.deleteCustomization")}</h3>
                      <p>{CustomizableTemplates.rich("descriptions.deleteCustomization", {
                        strong: (chunks) => <strong>{chunks}</strong>
                      })}</p>
                      <div className={styles.deleteConfirmButtons}>
                        <Button
                          className="secondary"
                          autoFocus
                          onPress={close}>
                          {Global('buttons.cancel')}
                        </Button>
                        <Button
                          className="danger"
                          onPress={() => {
                            handleDeleteCustomization();
                            close();
                          }}
                        >
                          {Global('buttons.delete')}
                        </Button>
                      </div>
                    </>
                  )}
                </Dialog>
              </Modal>
            </ModalOverlay>
          </DialogTrigger>
        </section>
      </LayoutWithPanel>
    </div >
  );
};

export default TemplateCustomizationOverview;