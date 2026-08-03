'use client';

import { useEffect, useRef, useState } from 'react';
import { useMutation, useQuery } from '@apollo/client/react';
import { useTranslations } from 'next-intl';
import { useParams, useRouter, useSearchParams } from 'next/navigation';
import { CalendarDate, DateValue, parseDate } from "@internationalized/date";
import {
  Breadcrumb,
  Breadcrumbs,
  Button,
  Dialog,
  DialogTrigger,
  Form,
  Link,
  Popover,
  Radio,
  Text
} from "react-aria-components";

//GraphQL
import {
  ProjectErrors,
  ProjectDocument,
  UpdateProjectDocument,
} from '@/generated/graphql';

//Components
import PageHeader from "@/components/PageHeader";
import { ContentContainer, LayoutContainer } from "@/components/Container";
import {
  FormInput,
  FormTextArea,
  DateComponent,
  RadioGroupComponent
} from "@/components/Form";

import ErrorMessages from '@/components/ErrorMessages';
import ResearchDomainCascadingDropdown
  from '@/components/ResearchDomainCascadingDropdown';

import { getCalendarDateValue } from "@/utils/dateUtils";
import { scrollToTop } from '@/utils/general';
import { logECS, routePath } from '@/utils/index';
import { useToast } from '@/context/ToastContext';
import { ProjectDetailsFormInterface } from "@/app/types";


interface ProjectFormErrorsInterface {
  projectName: string;
  projectAbstract: string;
}

const ProjectsProjectDetail = () => {
  const toastState = useToast(); // Access the toast state from context

  // Get projectId param
  const params = useParams();
  const searchParams = useSearchParams();
  const fromOverview = searchParams.get('fromOverview');
  const projectFundingId = searchParams.get('projectFundingId');
  const router = useRouter();
  const projectId = String(params.projectId); // From route /projects/:projectId

  //For scrolling to top of page
  const topRef = useRef<HTMLDivElement | null>(null);

  //For scrolling to error in page
  const errorRef = useRef<HTMLDivElement | null>(null);

  const PROJECT_SEARCH_URL = routePath('projects.create.projects.search', {
    projectId: projectId as string,
  });

  const [projectData, setProjectData] = useState<ProjectDetailsFormInterface>({
    projectName: '',
    projectAbstract: '',
    startDate: '',
    endDate: '',
    researchDomainId: '',
    isTestProject: 'true',
    parentResearchDomainId: ''
  });
  const [fieldErrors, setFieldErrors] = useState<ProjectFormErrorsInterface>({
    projectName: '',
    projectAbstract: '',
  });
  const [errors, setErrors] = useState<string[]>([]);
  // Track whether the project should be in read-only mode based on the "readOnly" field 
  // returned from the backend from ProjectDocument query
  const [isReadOnly, setIsReadOnly] = useState<boolean>(false);
  // Does project have funder
  const [hasFunder, setHasFunder] = useState<boolean>(false);
  // Does funding in question have API target
  const [hasApiTarget, setHasApiTarget] = useState<boolean>(false);

  // Localization keys
  const ProjectOverview = useTranslations('ProjectOverview');
  const ProjectDetail = useTranslations('ProjectsProjectDetail');
  const Global = useTranslations('Global');

  // Initialize useUpdateProjectMutation
  const [updateProjectMutation] = useMutation(UpdateProjectDocument);

  // Get Project using projectId
  const { data, loading, error: queryError } = useQuery(ProjectDocument, {
    variables: { projectId: Number(projectId) },
    notifyOnNetworkStatusChange: true
  });

  const clearAllFieldErrors = () => {
    //Remove all field errors
    setFieldErrors({
      projectName: '',
      projectAbstract: ''
    });
  }


  // Client-side validation of fields
  /*eslint-disable @typescript-eslint/no-explicit-any */
  const validateField = (name: string, value: any): string => {
    switch (name) {
      case 'projectName':
        if (!value || value.length <= 2) {
          return ProjectDetail('messages.errors.projectName');
        }
        break;
    }
    return '';
  };

  // Check whether form is valid before submitting
  const isFormValid = (): boolean => {
    const errors: ProjectFormErrorsInterface = {
      projectName: '',
      projectAbstract: ''
    };

    let hasError = false;

    // Validate all fields and collect errors
    Object.keys(projectData).forEach((key) => {
      const name = key as keyof ProjectFormErrorsInterface;
      const value = projectData[name];
      const error = validateField(name, value);

      if (error) {
        hasError = true;
        errors[name] = error;
      }
    });

    // Update state with all errors
    setFieldErrors(errors);
    if (errors) {
      setErrors(Object.values(errors).filter((e) => e)); // Store only non-empty error messages
    }

    return !hasError;
  };

  const updateProjectContent = (
    key: string,
    value: string | DateValue | boolean | number | CalendarDate | null
  ) => {
    setProjectData((prevContents) => ({
      ...prevContents,
      [key]: value,
    }));
  };

  // Handle changes from RadioGroup
  const handleRadioChange = (value: string) => {
    updateProjectContent('isTestProject', value);
  };

  // Make GraphQL mutation request to update section
  const updateProject = async (): Promise<[ProjectErrors, boolean]> => {
    // Convert any CalendarDate objects to strings before submission
    const submissionData = {
      startDate: projectData.startDate instanceof CalendarDate ?
        projectData.startDate.toString() : projectData.startDate,
      endDate: projectData.endDate instanceof CalendarDate ?
        projectData.endDate.toString() : projectData.endDate,
      isTestProject: projectData.isTestProject === 'true'
    };

    try {
      const response = await updateProjectMutation({
        variables: {
          input: {
            id: Number(projectId),
            title: projectData.projectName,
            abstractText: projectData.projectAbstract,
            researchDomainId: projectData.researchDomainId ? Number(projectData.researchDomainId) : null,
            ...submissionData
          }
        }
      });

      const responseErrors = response.data?.updateProject?.errors;
      if (responseErrors) {
        if (responseErrors && Object.values(responseErrors).filter((err) => err && err !== 'ProjectErrors').length > 0) {
          return [responseErrors, false];
        }
      }

      return [{}, true];
    } catch (error) {
      logECS('error', 'updateProjectMutation', {
        error,
        url: { path: `/projects/${projectId}/project` }
      });
      setErrors(prevErrors => [...prevErrors, "Error updating project"]);
      return [{}, false];
    }
  };

  // Show Success Message
  const showSuccessToast = () => {
    const successMessage = ProjectDetail('messages.success.projectUpdated');
    toastState.add(successMessage, { type: 'success' });
    // Scroll to top of page
    scrollToTop(topRef);
  }

  // Handle form submit
  const handleFormSubmit = async (event: React.FormEvent<HTMLFormElement>) => {
    event.preventDefault();

    // Clear previous error messages
    clearAllFieldErrors();
    setErrors([]);

    if (isFormValid()) {
      // Create new section
      const [errors, success] = await updateProject();

      if (!success) {

        if (errors) {
          setFieldErrors({
            projectName: errors.title || '',
            projectAbstract: errors.abstractText || '',
          });
        }
        setErrors([errors.general || ProjectDetail('messages.errors.projectUpdateFailed')]);

      } else {
        // Show success message
        showSuccessToast();

        if (fromOverview) {
          // If navigated from Project Overview, return user to the page
          router.push(routePath('projects.show', { projectId }));
        } else {
          // Redirect to the DMP start page
          router.push(routePath('projects.dmp.start', { projectId }))
        }
      }
    }
  };

  useEffect(() => {
    // Update project values from data results
    if (data?.project) {
      const project = data.project;
      // Convert string dates to CalendarDate objects when setting initial state
      const startDate = project.startDate ?
        (typeof project.startDate === 'string' ? parseDate(project.startDate) : project.startDate) :
        null;

      const endDate = project.endDate ?
        (typeof project.endDate === 'string' ? parseDate(project.endDate) : project.endDate) :
        null;

      setProjectData({
        projectName: project.title,
        projectAbstract: project?.abstractText ? project.abstractText : '',
        startDate,
        endDate,
        researchDomainId: project.researchDomain?.id ? project.researchDomain.id : '',
        parentResearchDomainId: project.researchDomain?.parentResearchDomainId ? project.researchDomain.parentResearchDomainId : '',
        isTestProject: project.isTestProject ? project.isTestProject.toString() : 'false'
      })
      setIsReadOnly(project.readOnly ?? false);
      setHasFunder((project?.fundings?.length ?? 0) > 0);
      setHasApiTarget(
        project?.fundings?.some(
          (funding) => String(funding.id) === projectFundingId && funding?.affiliation?.apiTarget
        ) ?? false
      );

    }
  }, [data])

  useEffect(() => {
    if (queryError) {
      setErrors(prev => [...prev, queryError.message]);
    }
  }, [queryError])

  if (loading) {
    return <div>{Global('messaging.loading')}...</div>;
  }

  return (
    <>
      <div ref={topRef} />
      <PageHeader
        title={ProjectDetail('title')}
        description={ProjectDetail('description')}
        showBackButton={false}
        breadcrumbs={
          <Breadcrumbs aria-label={ProjectOverview('navigation')}>
            <Breadcrumb><Link href="/">{Global('breadcrumbs.home')}</Link></Breadcrumb>
            <Breadcrumb><Link
              href="/projects">{Global('breadcrumbs.projects')}</Link></Breadcrumb>
            <Breadcrumb><Link
              href={`/projects/${projectId}`}>{Global('breadcrumbs.projectOverview')}</Link></Breadcrumb>
            <Breadcrumb>{ProjectDetail('title')}</Breadcrumb>
          </Breadcrumbs>
        }
        actions={null}
        className="page-project-list"
      />
      <LayoutContainer>
        <ContentContainer>
          <ErrorMessages errors={errors} ref={errorRef} />
          <Form onSubmit={handleFormSubmit} className="project-detail-form">
            <FormInput
              name="projectName"
              type="text"
              isRequired={true}
              label={ProjectDetail('labels.projectName')}
              value={projectData.projectName}
              onChange={(e) => updateProjectContent('projectName', e.target.value)}
              isInvalid={(!projectData.projectName || !!fieldErrors.projectName)}
              errorMessage={fieldErrors.projectName.length > 0 ? fieldErrors.projectName : ProjectDetail('messages.errors.projectName')}
              disabled={isReadOnly}
            />

            <FormTextArea
              name="projectAbstract"
              isRequired={false}
              richText={false}
              label={ProjectDetail('labels.projectAbstract')}
              value={projectData.projectAbstract}
              onChange={(value) => updateProjectContent('projectAbstract', value)}
              isInvalid={!!fieldErrors.projectAbstract}
              errorMessage={fieldErrors.projectAbstract.length > 0 ? fieldErrors.projectAbstract : ProjectDetail('messages.errors.projectAbstract')}
              disabled={isReadOnly}
            />

            <div className="input-range-group">
              <DateComponent
                name="startDate"
                value={getCalendarDateValue(projectData.startDate)}
                onChange={(newDate) => {
                  // Store the CalendarDate object directly
                  updateProjectContent('startDate', newDate);
                }}
                label={Global('labels.startDate')}
                isDisabled={isReadOnly}
              />
              <DateComponent
                name="endDate"
                value={getCalendarDateValue(projectData.endDate)}
                onChange={(newDate) => {
                  // Store the CalendarDate object directly
                  updateProjectContent('endDate', newDate);
                }}
                label={Global('labels.endDate')}
                isDisabled={isReadOnly}
              />
            </div>

            <ResearchDomainCascadingDropdown
              projectData={projectData}
              setProjectData={setProjectData}
              isDisabled={isReadOnly}
            />

            <div className="project-type-section">

              <RadioGroupComponent
                name="projectType"
                value={projectData.isTestProject.toString()}
                radioGroupLabel={ProjectDetail('labels.projectType')}
                onChange={handleRadioChange}
                isDisabled={isReadOnly}
              >
                <div>
                  <Radio value="true">{ProjectDetail('labels.mockProject')}</Radio>
                  <Text
                    slot="description"
                  >
                    {ProjectDetail('descriptions.mockProject')}
                  </Text>
                </div>

                <div>
                  <Radio value="false">{ProjectDetail('labels.realProject')}</Radio>
                  <Text
                    slot="description"
                  >
                    {ProjectDetail('descriptions.realProject')}
                  </Text>
                </div>
              </RadioGroupComponent>
            </div>

            {!isReadOnly ? (
              <Button
                type="submit"
                className="submit-button"
              >
                {Global('buttons.save')}
              </Button>
            ) : (
              <DialogTrigger>
                <Button
                  className="disabled-button-look"
                  type="button"
                  aria-disabled={true}
                >
                  {Global('buttons.save')}
                </Button>
                <Popover placement="bottom" className="popover--inverse">
                  <Dialog aria-label={ProjectDetail("messages.readOnlyLinkMessage")} className="popoverContent">
                    {ProjectDetail("messages.readOnlyLinkMessage")}
                  </Dialog>
                </Popover>
              </DialogTrigger>
            )}
          </Form>

          {/** Don't show if no funder, no apiTarget on the matching funder, or project is read-only */}
          {!isReadOnly && hasFunder && hasApiTarget && (
            <div className="form-signpost my-8">
              <div className="form-signpost-inner">
                <div className="">
                  <p className="text-sm">
                    {ProjectDetail('paragraphs.para1')}
                  </p>
                </div>
                <div className="form-signpost-button">

                  <Button
                    className="bg-slate-900 text-white px-4 py-2 rounded-md hover:bg-slate-800"
                    data-testid="search-projects-button"
                    onPress={() => router.push(PROJECT_SEARCH_URL)}
                  >
                    {ProjectDetail('buttons.searchProjects')}
                  </Button>

                </div>
              </div>
            </div>
          )}
        </ContentContainer>
      </LayoutContainer >
    </>
  )
    ;
};

export default ProjectsProjectDetail;
