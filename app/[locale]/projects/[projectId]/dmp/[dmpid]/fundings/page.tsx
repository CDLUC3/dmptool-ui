'use client';

import React, { useState, useRef, useEffect } from 'react';
import { useParams } from 'next/navigation';
import { useRouter, usePathname } from '@/i18n/routing';
import { useTranslations } from 'next-intl';
import {
  Breadcrumb,
  Breadcrumbs,
  Button,
  Checkbox,
  Form,
  Link,
} from "react-aria-components";

// GraphQL
import {
  useQuery,
  useLazyQuery,
  useMutation
} from '@apollo/client/react';
import {
  PlanFunding,
  PlanFundingsDocument,
  ProjectFundingsDocument,
  UpdatePlanFundingDocument,
  PlanFundingErrors,
} from '@/generated/graphql';

// Components
import { CheckboxGroupComponent } from '@/components/Form';
import PageHeader from "@/components/PageHeader";
import ErrorMessages from "@/components/ErrorMessages";
import {
  ContentContainer,
  LayoutContainer,
} from "@/components/Container";

// Utils and other
import { routePath } from '@/utils/routes';
import logECS from '@/utils/clientLogger';
import { handleApolloError } from '@/utils/apolloErrorHandler';
import { CheckboxInterface } from '@/app/types';
import { useToast } from '@/context/ToastContext';


const ProjectsProjectPlanAdjustFunding = () => {
  const Global = useTranslations('Global');
  const t = useTranslations('PlanFunding');
  const Messaging = useTranslations('Messaging');

  const [checkboxData, setCheckboxData] = useState<CheckboxInterface[]>([])
  const [fundingChoices, setFundingChoices] = useState<string[]>([]);
  const [fetchPlanFundings, { }] = useLazyQuery(PlanFundingsDocument, {});

  const [errors, setErrors] = useState<string[]>([]);
  const errorRef = useRef<HTMLDivElement>(null);
  const [updatePlanFunding] = useMutation(UpdatePlanFundingDocument, {});

  const toastState = useToast();
  const path = usePathname();
  const router = useRouter();
  const params = useParams();

  // NOTE:
  // The dmpid here comes with a lowercase I (dmpid instead of dmpId).
  // This is because the folder is named lowercased.
  // We might create a ticket to rename the folder to sentence-cased in future,
  // But a discussion is required as well.
  const { projectId, dmpid: dmpId } = params;

  const { data: funders } = useQuery(ProjectFundingsDocument, {
    variables: {
      projectId: Number(projectId),
    }
  });


  const handleCheckboxChange = (values: string[]) => {
    setFundingChoices(values);
  };

  useEffect(() => {
    if (dmpId) {
      // Now that we have a dmpId from the params, fetch the existing funding
      // selection for the plan. We use this to set the initial value in the
      // options.
      fetchPlanFundings({
        variables: {
          planId: Number(dmpId)
        }
      }).then(({ data }) => {
        if (data?.planFundings && data.planFundings.length > 0) {
          // Collect all projectFunding ids as strings
          const ids = data.planFundings
            .map(f => f?.projectFunding?.id)
            .filter(id => id !== undefined && id !== null)
            .map(id => String(id));
          setFundingChoices(ids);
        } else {
          setFundingChoices([]);
        }
      })
        .catch((err) => {
          handleApolloError(err, 'ProjectsProjectPlanAdjustFunding.fetchPlanFundings');
        });
    }
  }, [dmpId]);

  // Once we have the list of funders, we need to prepare the radio button
  // data for the RadioGroupComponent
  useEffect(() => {
    if (funders?.projectFundings) {
      const dataMap: CheckboxInterface[] = [];
      funders.projectFundings.forEach((funder) => {
        const displayName = funder?.affiliation?.displayName;

        if (funder && displayName) {
          dataMap.push({
            value: String(funder.id),
            label: displayName!,
          });
        }
      });

      setCheckboxData(dataMap);
    }
  }, [funders]);


  /**
   * Handle specific errors that we care about in this component.
   * @param {ProjectFunderErrors} errs - The errors from the graphql response
   */
  function checkErrors(errs: PlanFundingErrors): string[] {
    const typedKeys: (keyof PlanFundingErrors)[] = [
      "ProjectFundingId",
      "general",
      "planId",
    ];
    const newErrors: string[] = [];

    for (const k of typedKeys) {
      const errVal = errs[k];
      if (errVal) {
        newErrors.push(errVal);
      }
    }

    return newErrors
  }

  function handleSubmit(e: React.FormEvent<HTMLFormElement>) {
    e.preventDefault();

    const NEXT_URL = routePath('projects.dmp.show', {
      projectId: projectId as string,
      dmpId: dmpId as string,
    });

    const formData = new FormData(e.currentTarget);
    const projectFundingIds = formData.getAll("funding").map(id => Number(id));

    updatePlanFunding({
      variables: {
        planId: Number(dmpId),
        projectFundingIds
      },
    }).then((result) => {
      const planFundingResults = result?.data?.updatePlanFunding as PlanFunding[] | undefined;

      const allErrors: string[] = [];

      if (planFundingResults) {
        planFundingResults.forEach((pfResult) => {
          const errors = checkErrors(pfResult?.errors as PlanFundingErrors);
          if (errors && errors.length > 0) {
            allErrors.push(...errors);
          }
        });
      }

      if (allErrors.length > 0) {
        setErrors(allErrors);
        // Optionally scroll to error display
        errorRef?.current?.scrollIntoView({ behavior: 'smooth' });
      } else {
        const msg = Messaging('successfullyUpdated');
        toastState.add(msg, { type: 'success' });
        router.push(NEXT_URL);
      }

    }).catch(err => {
      logECS('error', 'addPlanFunding', {
        error: err.message,
        url: { path }
      });
    });
  }

  return (
    <>
      <PageHeader
        title={t('headerTitle')}
        description={t('headerDescription')}
        showBackButton={true}
        breadcrumbs={
          <Breadcrumbs>
            <Breadcrumb><Link href="/">{Global('breadcrumbs.home')}</Link></Breadcrumb>
            <Breadcrumb><Link href={routePath('projects.index')}>{Global('breadcrumbs.projects')}</Link></Breadcrumb>
            {projectId && dmpId && (
              <>
                <Breadcrumb>
                  <Link href={routePath('projects.show', { projectId: String(projectId) })}>
                    {Global('breadcrumbs.projectOverview')}
                  </Link>
                </Breadcrumb>
                <Breadcrumb>
                  <Link href={routePath('projects.dmp.show', {
                    projectId: String(projectId),
                    dmpId: String(dmpId)
                  })}>
                    {Global('breadcrumbs.planOverview')}
                  </Link>
                </Breadcrumb>
              </>
            )}
            <Breadcrumb>
              {Global('breadcrumbs.planFunding')}
            </Breadcrumb>
          </Breadcrumbs>
        }
        actions={
          <>
          </>
        }
        className="page-project-fundings"
      />
      <LayoutContainer>
        <ContentContainer>
          <ErrorMessages errors={errors} ref={errorRef} />
          <Form onSubmit={handleSubmit}>

            <CheckboxGroupComponent
              name="funding"
              value={fundingChoices}
              onChange={handleCheckboxChange}
              checkboxGroupLabel={t('fundingLabel')}
              checkboxGroupDescription={t('fundingDescription')}
            >
              {checkboxData.map((checkbox, index) => (
                <div key={index}>
                  <Checkbox value={checkbox.value}>
                    <div className="checkbox">
                      <svg viewBox="0 0 18 18" aria-hidden="true">
                        <polyline points="1 9 7 14 15 4" />
                      </svg>
                    </div>
                    <div className="">
                      <span>
                        {checkbox.label}
                      </span>
                      <br />
                      <span className="help">
                        {checkbox.description}
                      </span>
                    </div>
                  </Checkbox>
                </div>
              ))}
            </CheckboxGroupComponent>

            <p>
              <strong>{t('changeWarning')}</strong>
            </p>

            <Button type="submit">{Global('buttons.save')}</Button>
          </Form>

          <h2 className="heading-3 mt-8">{t('addSourceTitle')}</h2>
          <p>{t('addSourceNote')}</p>
          <Link href={routePath('projects.fundings.search', { projectId: String(projectId) })}>
            {t('addSourceLink')}
          </Link>
        </ContentContainer>
      </LayoutContainer>
    </>
  );
};

export default ProjectsProjectPlanAdjustFunding;