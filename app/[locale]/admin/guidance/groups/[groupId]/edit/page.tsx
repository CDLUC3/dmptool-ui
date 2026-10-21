"use client";

import React, { useCallback, useEffect, useRef, useState } from "react";
import { Breadcrumb, Breadcrumbs, Link, Button } from "react-aria-components";
import { useTranslations } from "next-intl";
import { useParams } from "next/navigation";
import { useRouter } from "@/i18n/routing";
import { useQuery } from "@apollo/client/react";
// GraphQL
import {
  GuidanceGroupDocument,
} from '@/generated/graphql';
import { updateGuidanceGroupAction } from "./actions";

// Components
import PageHeader from "@/components/PageHeader";
import { ContentContainer, LayoutWithPanel } from "@/components/Container";
import { FormInput } from "@/components/Form";
import ErrorMessages from "@/components/ErrorMessages";

// Utils, other
import logECS from "@/utils/clientLogger";
import { routePath } from "@/utils/routes";
import { extractErrors } from "@/utils/errorHandler";
import { useToast } from "@/context/ToastContext";
import Loading from "@/components/Loading";
import styles from "./guidanceGroupEdit.module.scss";

enum GuidanceStatus {
  PUBLISHED = "Published",
  DRAFT = "Draft",
}
interface GuidanceGroup {
  guidanceGroupId: number;
  name: string;
  description: string;
  optionalSubset: boolean;
  bestPractice?: boolean;
  status?: GuidanceStatus;
}

type UpdateGuidanceGroupErrors = {
  general?: string;
  affiliationId?: string;
  bestPractice?: string;
  name?: string;
  description?: string;
};

const GuidanceGroupEditPage: React.FC = () => {
  const params = useParams();
  const router = useRouter();
  const toastState = useToast();

  const groupId = String(params.groupId);

  // For translations
  const t = useTranslations("Guidance");
  const Global = useTranslations("Global");

  //For scrolling to error in page
  const errorRef = useRef<HTMLDivElement | null>(null);

  const [guidanceGroup, setGuidanceGroup] = useState<GuidanceGroup>();
  const [errorMessages, setErrorMessages] = useState<string[]>([]);

  // Fetch guidance group data
  const { data: guidanceGroupData, loading } = useQuery(GuidanceGroupDocument, {
    variables: {
      guidanceGroupId: parseInt(groupId, 10)
    },
  });

  // Handle update of guidance group
  const handleUpdate = useCallback(async () => {
    setErrorMessages([]);

    if (guidanceGroup?.guidanceGroupId === undefined) {
      setErrorMessages(['Guidance Group ID is undefined']);
      return;
    }

    const response = await updateGuidanceGroupAction({
      guidanceGroupId: guidanceGroup.guidanceGroupId,
      name: guidanceGroup.name,
      description: guidanceGroup.description,
      optionalSubset: guidanceGroup.optionalSubset,
      bestPractice: guidanceGroup.bestPractice || false
    });

    if (response.redirect) {
      router.push(response.redirect);
      return;
    }

    if (!response.success) {
      setErrorMessages(
        response.errors?.length ? response.errors : [Global("messaging.somethingWentWrong")]
      )
      logECS("error", "publishing Guidance Group", {
        errors: response.errors,
        url: { path: routePath("admin.guidance.groups.edit", { groupId: guidanceGroup.guidanceGroupId }) },
      });
      return;
    } else {
      if (response?.data?.errors) {
        const errs = extractErrors<UpdateGuidanceGroupErrors>(response?.data?.errors, ["general", "affiliationId", "bestPractice", "name", "description"]);

        if (errs.length > 0) {
          setErrorMessages(errs);
          logECS("error", "publishing Guidance Group", {
            errors: errs,
            url: { path: routePath("admin.guidance.groups.edit", { groupId: guidanceGroup.guidanceGroupId }) },
          });
          return; // Don't proceed to success message if there are errors
        }
      }
      const successMessage = t("messages.success.guidanceGroupUpdated", { groupName: guidanceGroup?.name });
      toastState.add(successMessage, { type: "success" });
      router.push(routePath("admin.guidance.groups.index", { groupId: guidanceGroup.guidanceGroupId }));
    }
  }, [guidanceGroup, Global, router]);

  useEffect(() => {
    // Set Guidance Group data in state when fetched
    if (guidanceGroupData && guidanceGroupData.guidanceGroup) {

      const transformedGuidanceGroup: GuidanceGroup = {
        guidanceGroupId: Number(guidanceGroupData.guidanceGroup?.id),
        name: guidanceGroupData.guidanceGroup.name || 'Untitled Guidance Group',
        description: guidanceGroupData.guidanceGroup.description || '',
        optionalSubset: guidanceGroupData.guidanceGroup.optionalSubset || false,
        bestPractice: guidanceGroupData.guidanceGroup.bestPractice || false,
        status: guidanceGroupData.guidanceGroup.latestPublishedDate ? GuidanceStatus.PUBLISHED : GuidanceStatus.DRAFT
      }

      setGuidanceGroup(transformedGuidanceGroup);
    };
  }, [guidanceGroupData]);

  if (loading) {
    return <Loading message={Global("messaging.loading")} />;
  }
  return (
    <>
      <PageHeader
        title={t("pages.groupEdit.title")}
        description={t("pages.groupEdit.description")}
        showBackButton={true}
        breadcrumbs={
          <Breadcrumbs>
            <Breadcrumb>
              <Link href={routePath("app.home")}>Admin</Link>
            </Breadcrumb>
            <Breadcrumb>
              <Link href={routePath("admin.guidance.index")}>{t("breadcrumbs.guidance")}</Link>
            </Breadcrumb>
            <Breadcrumb>
              <Link href={routePath("admin.guidance.groups.index", { groupId })}>{guidanceGroup?.name}</Link>
            </Breadcrumb>
            <Breadcrumb>{t("breadcrumbs.editGroup")}</Breadcrumb>
          </Breadcrumbs>
        }
        className="page-guidance-group-edit"
      />

      <ErrorMessages errors={errorMessages} ref={errorRef} />

      <LayoutWithPanel>
        <ContentContainer>
          <form className={styles.editForm}>
            {/* Guidance Group Section */}
            <div className="sectionContainer mt-0">
              <div className="sectionContent">
                <div className={styles.formGroup}>
                  <FormInput
                    name="name"
                    label={t("fields.groupName.label")}
                    value={guidanceGroup?.name}
                    isRequired={true}
                    onChange={(e) => {
                      if (guidanceGroup) {
                        setGuidanceGroup({ ...guidanceGroup, name: e.target.value });
                        setErrorMessages([]);
                      }
                    }}
                    placeholder={t("fields.groupName.placeholder")}
                  />

                  <FormInput
                    name="description"
                    id="description"
                    label={t("fields.groupDescription.label")}
                    value={guidanceGroup?.description}
                    onChange={(e) => {
                      if (guidanceGroup) {
                        setGuidanceGroup({ ...guidanceGroup, description: e.target.value });
                        setErrorMessages([]);
                      }
                    }}
                    placeholder={t("fields.groupDescription.placeholder")}
                    helpMessage={t("fields.groupDescription.helpText")}
                  />
                </div>

                <div className={styles.formGroup}>
                  <Button
                    type="button"
                    onPress={handleUpdate}
                    className="button button--primary"
                  >
                    {t("actions.saveChanges")}
                  </Button>

                </div>
              </div>
            </div>
          </form>
        </ContentContainer>
      </LayoutWithPanel >
    </>
  );
};

export default GuidanceGroupEditPage;
