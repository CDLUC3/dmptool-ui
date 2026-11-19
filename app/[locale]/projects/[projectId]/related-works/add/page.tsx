"use client";

import React, { useEffect, useRef, useState, type TransitionStartFunction } from "react";
import { useQuery } from "@apollo/client/react";
import { useParams } from "next/navigation";
import { useTranslations } from "next-intl";
import { Breadcrumb, Breadcrumbs, Form, Link, Radio, Text } from "react-aria-components";

// GraphQL
import { ProjectDocument } from "@/generated/graphql";

// Components
import PageHeader from "@/components/PageHeader";
import { ContentContainer, LayoutContainer } from "@/components/Container";
import { RadioGroupComponent, TransitionButton, TransitionLink } from "@/components/Form";
import ErrorMessages from "@/components/ErrorMessages";
import Loading from "@/components/Loading";

// Utils and other
import { useRouter } from "@/i18n/routing";
import { handleApolloError, routePath } from "@/utils/index";
import styles from "./AddRelatedWorkProjectPage.module.scss";

const AddRelatedWorkProjectPage = () => {
  const Global = useTranslations("Global");
  const t = useTranslations("AddRelatedWorkProjectPage");
  const router = useRouter();
  const errorRef = useRef<HTMLDivElement | null>(null);

  const params = useParams();
  const projectId = parseInt(String(params.projectId));

  const [selectedPlanId, setSelectedPlanId] = useState("");
  const [submitted, setSubmitted] = useState(false);
  const [errors, setErrors] = useState<string[]>([]);

  const { data, loading, error } = useQuery(ProjectDocument, {
    variables: { projectId },
    skip: Number.isNaN(projectId),
  });
  const plans = (data?.project?.plans ?? []).filter((plan) => plan.id != null);
  const planId = selectedPlanId || (plans.length === 1 ? String(plans[0].id) : "");

  useEffect(() => {
    if (error && handleApolloError(error, "AddRelatedWorkProjectPage.project").wasRealError) {
      setErrors([t("errors.loadPlans")]);
    }
  }, [error, t]);

  const handleContinue = async ({ startTransition }: { startTransition: TransitionStartFunction }) => {
    setSubmitted(true);
    if (!planId) return;
    startTransition(() => {
      router.push(routePath("projects.dmp.related-works.add", { projectId, dmpId: planId }));
    });
  };

  const renderContent = () => {
    if (loading && !data) {
      return <Loading variant="inline" message={Global("messaging.loading")} />;
    }

    if (error) {
      return null;
    }

    if (plans.length === 0) {
      return (
        <div className={styles.noPlans}>
          <p>{t("noPlans")}</p>
          <TransitionLink
            href={routePath("projects.show", { projectId })}
            className="button-link button--primary"
          >
            {t("buttons.projectOverview")}
          </TransitionLink>
        </div>
      );
    }

    return (
      <Form onSubmit={(e) => e.preventDefault()}>
        <RadioGroupComponent
          name="relatedWorkPlan"
          value={planId}
          radioGroupLabel={t("planLabel")}
          description={t("planDescription")}
          onChange={(value) => {
            setSubmitted(false);
            setSelectedPlanId(value);
          }}
          isInvalid={submitted && !planId}
          errorMessage={t("errors.choosePlan")}
        >
          {plans.map((plan) => (
            <div key={plan.id}>
              <Radio value={String(plan.id)}>{plan.title}</Radio>
              <Text slot="description">
                {plan.registered != null ? t("planStatus.published") : t("planStatus.unpublished")}
              </Text>
            </div>
          ))}
        </RadioGroupComponent>

        <div className={styles.actions}>
          <TransitionButton
            type="submit"
            onPress={handleContinue}
            loadingLabel={Global("buttons.loading")}
          >
            {Global("buttons.continue")}
          </TransitionButton>
        </div>
      </Form>
    );
  };

  return (
    <>
      <PageHeader
        title={t("title")}
        description={t("description")}
        showBackButton={true}
        breadcrumbs={
          <Breadcrumbs>
            <Breadcrumb>
              <Link href={routePath("app.home")}>{Global("breadcrumbs.home")}</Link>
            </Breadcrumb>
            <Breadcrumb>
              <Link href={routePath("projects.index")}>{Global("breadcrumbs.projects")}</Link>
            </Breadcrumb>
            <Breadcrumb>
              <Link href={routePath("projects.show", { projectId })}>{Global("breadcrumbs.projectOverview")}</Link>
            </Breadcrumb>
            <Breadcrumb>
              <Link href={routePath("projects.related-works.index", { projectId })}>
                {Global("breadcrumbs.relatedWorks")}
              </Link>
            </Breadcrumb>
            <Breadcrumb>{t("title")}</Breadcrumb>
          </Breadcrumbs>
        }
      />

      <LayoutContainer>
        <ContentContainer>
          <ErrorMessages
            errors={errors}
            ref={errorRef}
          />
          {renderContent()}
        </ContentContainer>
      </LayoutContainer>
    </>
  );
};

export default AddRelatedWorkProjectPage;
