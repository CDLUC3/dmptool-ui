"use client";

import React, { useCallback, useRef, useState } from "react";
import {
  Breadcrumb,
  Breadcrumbs,
  Button,
  Form,
  Link,
} from "react-aria-components";
import { useTranslations } from "next-intl";
import { useRouter } from "@/i18n/routing";

import { useQuery } from '@apollo/client/react';

// GraphQL
import {
  MeDocument,
} from '@/generated/graphql';
import { addGuidanceGroupAction } from "./actions";

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
import styles from "./guidanceGroupCreate.module.scss";
import Loading from "@/components/Loading";

export interface GuidanceGroupInterface {
  affiliationId: string;
  bestPractice: boolean;
  name: string;
  description: string;
}

type AddGuidanceGroupErrors = {
  general?: string;
  affiliationId?: string;
  bestPractice?: string;
  name?: string;
  description?: string;
};


const GuidanceGroupCreatePage: React.FC = () => {
  const router = useRouter();
  const toastState = useToast();

  // For translations
  const t = useTranslations("Guidance");
  const Global = useTranslations("Global");

  //For scrolling to error in page
  const errorRef = useRef<HTMLDivElement | null>(null);

  // Run me query to get user's affiliationId
  const { data: me, loading } = useQuery(MeDocument);

  const [errorMessages, setErrorMessages] = useState<string[]>([]);
  const [guidanceGroup, setGuidanceGroup] = useState<GuidanceGroupInterface>({
    affiliationId: "",
    bestPractice: false,
    name: "",
    description: "",
  });

  // Call Server Action addGuidanceGroupAction
  const addGuidanceGroup = useCallback(async (guidanceGroup: GuidanceGroupInterface) => {
    const response = await addGuidanceGroupAction(guidanceGroup);

    if (response.redirect) {
      router.push(response.redirect);
    }

    return {
      success: response.success,
      errors: response.errors,
      data: response.data,
    };
  }, []);

  const handleSubmit = useCallback(async (event: React.FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    const affiliationId = me?.me?.affiliation?.uri;

    if (!affiliationId) {
      logECS("error", "creating Guidance Group", {
        error: "no affiliation found for user",
        url: { path: routePath("admin.guidance.groups.create") },
      });
      setErrorMessages([Global("messages.somethingWentWrong")]);
      return;
    }

    const response = await addGuidanceGroup({
      ...guidanceGroup,
      affiliationId,
    });

    if (!response.success) {
      setErrorMessages(
        response.errors?.length ? response.errors : [Global("messaging.somethingWentWrong")]
      )
      logECS("error", "creating Guidance Group", {
        errors: response.errors,
        url: { path: routePath("admin.guidance.groups.create") },
      });
      return;
    } else {
      if (response?.data?.errors) {
        const errs = extractErrors<AddGuidanceGroupErrors>(response?.data?.errors, ["general", "affiliationId", "bestPractice", "name"]);

        if (errs.length > 0) {
          setErrorMessages(errs);
          logECS("error", "creating Guidance Group", {
            errors: errs,
            url: { path: routePath("admin.guidance.groups.create") },
          });
        } else {
          const successMessage = t("messages.success.guidanceGroupCreated", { groupName: guidanceGroup.name });
          toastState.add(successMessage, { type: "success" });
          router.push(routePath("admin.guidance.index"));
        }
      }
    }
  }, [me, guidanceGroup]);

  if (loading) {
    return <Loading message={Global('messaging.loading')} />;
  }

  return (
    <>
      <PageHeader
        title={t("pages.groupCreate.title")}
        description={t("pages.groupCreate.description")}
        showBackButton={true}
        breadcrumbs={
          <Breadcrumbs>
            <Breadcrumb>
              <Link href={routePath("app.home")}>{Global("breadcrumbs.home")}</Link>
            </Breadcrumb>
            <Breadcrumb>
              <Link href={routePath("admin.guidance.index")}>{t("breadcrumbs.guidanceGroups")}</Link>
            </Breadcrumb>
            <Breadcrumb>{t("breadcrumbs.createGroup")}</Breadcrumb>
          </Breadcrumbs>
        }
        className="page-guidance-group-create"
      />

      <ErrorMessages errors={errorMessages} ref={errorRef} />

      <LayoutWithPanel>
        <ContentContainer>
          <Form className={styles.createForm} onSubmit={handleSubmit}>
            {/* Guidance Group Section */}

            <div className="sectionContainer mt-0">
              <div className="sectionContent">
                <div className={styles.formGroup}>
                  <FormInput
                    name="name"
                    id="name"
                    label={t("fields.groupName.label")}
                    value={guidanceGroup.name}
                    onChange={(e) => {
                      setGuidanceGroup({ ...guidanceGroup, name: e.target.value });
                      setErrorMessages([]);
                    }}
                    placeholder={t("fields.groupName.placeholder")}
                    isRequiredVisualOnly={true}
                  />

                  <FormInput
                    name="description"
                    id="description"
                    label={t("fields.groupDescription.label")}
                    value={guidanceGroup.description}
                    onChange={(e) => {
                      setGuidanceGroup({ ...guidanceGroup, description: e.target.value });
                      setErrorMessages([]);
                    }}
                    placeholder={t("fields.groupDescription.placeholder")}
                    helpMessage={t("fields.groupDescription.helpText")}
                  />
                </div>

                <div className={styles.formGroup}>
                  <Button
                    type="submit"
                    className="button button--primary"
                  >
                    {t("actions.createGroup")}
                  </Button>
                </div>
              </div>
            </div>
          </Form>
        </ContentContainer>
      </LayoutWithPanel>
    </>
  );
};

export default GuidanceGroupCreatePage;
