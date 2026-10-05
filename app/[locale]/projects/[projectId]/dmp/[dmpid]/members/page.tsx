'use client';

import {
  Fragment,
  useEffect,
  useReducer,
  useRef,
  FormEvent
} from 'react';
import { useQuery, useMutation } from '@apollo/client/react';
import {
  Breadcrumb,
  Breadcrumbs,
  Button,
  Form,
  Link,
  ListBoxItem
} from "react-aria-components";
import { useTranslations } from 'next-intl';
import { useParams } from 'next/navigation';
import { useRouter } from '@/i18n/routing';

import classNames from 'classnames';

// Components
import PageHeader from "@/components/PageHeader";
import {
  ContentContainer,
  LayoutContainer,
} from "@/components/Container";
import { OrcidIcon } from '@/components/Icons/orcid/';
import { FormSelect } from '@/components/Form/FormSelect';
import ErrorMessages from '@/components/ErrorMessages';

// Hooks
import { useScrollToTop } from '@/hooks/scrollToTop';

// Other
import {
  ProjectMembersDocument,
  UpdatePlanMemberDocument,
  PlanMembersDocument,
  ProjectMember,
  RemovePlanMemberDocument,
  PlanMemberErrors,
  PlanMember
} from '@/generated/graphql';
import logECS from '@/utils/clientLogger';
import { useToast } from '@/context/ToastContext';
import { addPlanMemberAction } from './actions/addPlanMemberAction';
import { ProjectMembersInterface } from '@/app/types';
import { routePath } from '@/utils/routes';
import styles from './ProjectsProjectPlanAdjustMembers.module.scss';
import { orcidToUrl } from "@/lib/identifierUtils";

interface PlanMemberDropdown {
  id: string;
  name: string;
  isPrimaryContact?: boolean | null | undefined;
  projectMemberId: number | null;
}

const initialState = {
  projectMembers: [] as ProjectMembersInterface[],
  planMemberIds: [] as number[],
  isEditing: false,
  planMembers: [] as PlanMemberDropdown[],
  selectedPlanMember: null as string | null,
  primaryContact: '',
  errorMessages: [] as string[],
};

type Action =
  | { type: 'SET_PROJECT_MEMBERS'; payload: ProjectMembersInterface[] }
  | { type: 'SET_PLAN_MEMBER_IDS'; payload: number[] }
  | { type: 'ADD_PLAN_MEMBER_ID'; payload: number }
  | { type: 'REMOVE_PLAN_MEMBER_ID'; payload: number }
  | { type: 'SET_IS_EDITING'; payload: boolean }
  | { type: 'SET_PLAN_MEMBERS'; payload: PlanMemberDropdown[] }
  | { type: 'SET_SELECTED_PLAN_MEMBER'; payload: string | null }
  | { type: 'SET_PRIMARY_CONTACT'; payload: string }
  | { type: 'SET_ERROR_MESSAGES'; payload: string[] }
  | { type: 'ADD_ERROR_MESSAGE'; payload: string };


const reducer = (state: typeof initialState, action: Action) => {
  switch (action.type) {
    case 'SET_PROJECT_MEMBERS':
      return { ...state, projectMembers: action.payload };
    case 'SET_PLAN_MEMBER_IDS':
      return { ...state, planMemberIds: action.payload };
    case 'ADD_PLAN_MEMBER_ID':
      return { ...state, planMemberIds: [...state.planMemberIds, action.payload] };
    case 'REMOVE_PLAN_MEMBER_ID':
      return { ...state, planMemberIds: state.planMemberIds.filter((id) => id !== action.payload) };
    case 'SET_IS_EDITING':
      return { ...state, isEditing: action.payload };
    case 'SET_PLAN_MEMBERS':
      return { ...state, planMembers: action.payload };
    case 'SET_SELECTED_PLAN_MEMBER':
      return { ...state, selectedPlanMember: action.payload };
    case 'SET_PRIMARY_CONTACT':
      return { ...state, primaryContact: action.payload };
    case 'SET_ERROR_MESSAGES':
      return { ...state, errorMessages: action.payload };
    case 'ADD_ERROR_MESSAGE':
      return { ...state, errorMessages: [...state.errorMessages, action.payload] };
    default:
      return state;
  }
};


const ProjectsProjectPlanAdjustMembers = () => {
  const [state, dispatch] = useReducer(reducer, initialState);

  const {
    projectMembers,
    planMemberIds,
    isEditing,
    planMembers,
    selectedPlanMember,
    primaryContact,
    errorMessages,
  } = state;


  const { scrollToTop } = useScrollToTop();

  // Get projectId and dmpId params from route /projects/:projectId/dmp/:dmpId
  const params = useParams();
  const router = useRouter();
  const projectId = String(params.projectId);
  const dmpId = String(params.dmpid);

  // Set refs for error messages and scrolling
  const errorRef = useRef<HTMLDivElement | null>(null);
  const topRef = useRef<HTMLDivElement>(null);

  const toastState = useToast(); // Access the toast state from context

  //Routes
  const PLAN_MEMBERS_ROUTE = routePath('projects.dmp.members', { projectId, dmpId });
  const PROJECT_MEMBERS_ROUTE = routePath('projects.members.index', { projectId });

  // Localization keys
  const PlanMembers = useTranslations('ProjectsProjectPlanAdjustMembers');
  const Global = useTranslations('Global');

  // Get Project Members using projectid
  const { data, loading, error: queryError } = useQuery(ProjectMembersDocument,
    {
      variables: { projectId: Number(projectId) },
      notifyOnNetworkStatusChange: true
    }
  );

  //Get Plan Members so that we know which members are already part of this plan
  const { data: planMemberData, loading: planMemberLoading, refetch, error: planMemberError } = useQuery(PlanMembersDocument,
    {
      variables: { planId: Number(dmpId) },
      notifyOnNetworkStatusChange: true
    }
  );


  const isLoading = loading || planMemberLoading;
  const isError = queryError || planMemberError;

  // Initialize mutations
  const [RemovePlanMemberMutation] = useMutation(RemovePlanMemberDocument);
  const [UpdatePlanMemberMutation] = useMutation(UpdatePlanMemberDocument);


  // Check if the given member is the primary contact
  const isPrimaryContact = (member: ProjectMember | null) => {
    if (!planMemberData || !planMemberData.planMembers) {
      return false;
    }

    // Find the primary contact ID from planMembers
    const primaryContactId = planMemberData.planMembers
      .find((planMember) => planMember?.isPrimaryContact)?.projectMember?.id;

    // Check if the given member matches the primary contact ID
    return primaryContactId === (member as ProjectMember)?.id;
  };

  // Add a new plan member
  const addPlanMember = async (id: number) => {
    // Don't need a try-catch block here, as the error is handled in the server action
    const response = await addPlanMemberAction({
      planId: Number(dmpId),
      projectMemberId: id
    });

    if (response.redirect) {
      router.push(response.redirect);
    }

    return {
      success: response.success,
      errors: response.errors,
      data: response.data
    }
  };

  // handle adding of plan member
  const handleAddPlanMember = async (memberId: number | null) => {
    if (memberId) {
      const result = await addPlanMember(memberId);

      if (!result.success) {
        const errors = result.errors;

        //Check if errors is an array or an object
        if (Array.isArray(errors)) {
          //Handle errors as an array
          dispatch({
            type: 'SET_ERROR_MESSAGES',
            payload: errors.length > 0 ? errors : [Global('messaging.somethingWentWrong')],
          })
        }
      } else {
        if (
          result.data?.errors &&
          typeof result.data.errors === 'object' &&
          typeof result.data.errors.general === 'string') {
          // Handle errors as an object with general or field-level errors
          dispatch({
            type: 'SET_ERROR_MESSAGES',
            payload: [result.data.errors.general]
          });
        }
        // Then mutation was successful
        dispatch({ type: 'ADD_PLAN_MEMBER_ID', payload: memberId });
        await refetch(); //Need to refresh the primary contact dropdown after adding a new member
        const planMemberAdded = projectMembers?.find((member) => member.id === memberId);
        const successMessage = PlanMembers('messaging.success.addedPlanMember', { fullName: planMemberAdded?.fullName || '' });
        toastState.add(successMessage, { type: 'success' });

        scrollToTop(topRef);
      }
    }
  };

  // Remove a plan member
  const removePlanMember = async (id: number) => {
    try {
      const response = await RemovePlanMemberMutation({
        variables: {
          planMemberId: id
        }
      });

      if (response.data?.removePlanMember?.errors) {
        return response.data.removePlanMember.errors;
      }
    } catch (error) {
      dispatch({ type: 'SET_ERROR_MESSAGES', payload: [Global('messaging.somethingWentWrong')] });
      logECS('error', 'removePlanMember', {
        error,
        url: { path: PLAN_MEMBERS_ROUTE }
      });
    }
    return {};
  };

  // handle removing of plan member
  const handleRemovePlanMember = async (memberId: number | null) => {
    if (memberId) {
      const planMember = planMemberData?.planMembers?.find(
        (member) => member?.projectMember?.id === memberId
      );

      if (!planMember?.id) {
        const errorMessage = PlanMembers('messaging.error.memberNotFound');
        dispatch({ type: 'ADD_ERROR_MESSAGE', payload: errorMessage });
        return;
      }

      const errors = await removePlanMember(planMember.id);

      if (errors && Object.values(errors).filter((err) => err && err !== 'PlanMemberErrors').length > 0) {
        dispatch({ type: 'SET_ERROR_MESSAGES', payload: [errors.general || Global('messaging.somethingWentWrong')] });
      } else {
        dispatch({ type: 'REMOVE_PLAN_MEMBER_ID', payload: memberId });
        await refetch();

        const planMemberRemoved = projectMembers?.find((member) => member.id === memberId);
        const successMessage = PlanMembers('messaging.success.removedPlanMember', { fullName: planMemberRemoved?.fullName || '' });
        toastState.add(successMessage, { type: 'success' });

        scrollToTop(topRef);
      }
    }
  };

  const updatePlanMember = async (
    planMemberId: number,
    memberRoles: { id: number | null, label: string }[]
  ): Promise<PlanMemberErrors | null> => {
    try {
      const response = await UpdatePlanMemberMutation({
        variables: {
          planId: Number(dmpId),
          planMemberId,
          isPrimaryContact: true,
          memberRoleIds: memberRoles
            .map((role) => role.id) // Extract `id`
            .filter((id): id is number => id !== null && id !== undefined), // Filter out invalid values
        }
      });

      if (response.data?.updatePlanMember?.errors) {
        return response.data.updatePlanMember.errors as PlanMemberErrors;
      }
    } catch (error) {
      dispatch({ type: 'SET_ERROR_MESSAGES', payload: [Global('messaging.somethingWentWrong')] });
      logECS('error', 'updatePlanMember', {
        error,
        url: { path: PLAN_MEMBERS_ROUTE }
      });
    }
    return {};
  }

  const handlePrimaryContactForm = async (e: FormEvent<HTMLFormElement>) => {
    e.preventDefault();

    if (selectedPlanMember) {
      const selectedMember = planMembers.find((member) => member.id === selectedPlanMember);

      if (!selectedMember) {
        const errorMessage = PlanMembers('messaging.error.memberNotFound');
        dispatch({ type: 'ADD_ERROR_MESSAGE', payload: errorMessage });
        return;
      }

      const projectMemberId = selectedMember.projectMemberId;
      const memberRoles = projectMembers
        ?.find((member) => member.id === projectMemberId)
        ?.roles ?? [];

      let errors;
      if (projectMemberId !== null) {
        errors = await updatePlanMember(
          Number(selectedPlanMember),
          memberRoles
        );
      } else {
        const errorMessage = PlanMembers('messaging.error.memberNotFound');
        dispatch({ type: 'ADD_ERROR_MESSAGE', payload: errorMessage });
      }

      if (
        errors &&
        Object.values(errors).filter((err) => err && err !== "PlanMemberErrors").length > 0
      ) {
        dispatch({ type: 'SET_ERROR_MESSAGES', payload: [errors.general ?? Global('messaging.somethingWentWrong')] });
      } else {
        await refetch();
        dispatch({ type: 'SET_IS_EDITING', payload: false });

        const planMemberUpdated = projectMembers?.find((member) => member.id === projectMemberId);
        const successMessage = PlanMembers('messaging.success.updatedPlanMember', { fullName: planMemberUpdated?.fullName || '' });
        toastState.add(successMessage, { type: 'success' });

        scrollToTop(topRef);
      }
    }
  };

  const transformPlanMemberData = (planMembers: PlanMember[] | null) => {
    if (planMembers) {
      const transformedData = planMembers
        .map((member): PlanMemberDropdown => ({
          id: (member?.id)?.toString() ?? '',
          name: `${member?.projectMember?.givenName} ${member?.projectMember?.surName}`,
          isPrimaryContact: member?.isPrimaryContact ?? null,
          projectMemberId: member?.projectMember?.id ?? null,
        }))
        .filter((member): member is PlanMemberDropdown => member.id !== null);

      return transformedData;
    }
    return [];
  }

  useEffect(() => {
    // When data from backend changes, set project members data in state
    if (data && data.projectMembers) {
      const projectMemberData = data.projectMembers
        .filter((member) => member !== null && member !== undefined) // Filter out null/undefined
        .map((member) => ({
          id: member?.id ?? null,
          fullName: `${member?.givenName} ${member?.surName}`,
          affiliation: member?.affiliation?.displayName ?? '',
          orcid: member?.orcid ?? '',
          isPrimaryContact: isPrimaryContact(member as ProjectMember),
          roles: (member?.memberRoles && member.memberRoles.length > 0)
            ? member?.memberRoles?.map((role) => ({
              id: role.id ?? null,
              label: role.label,
            }))
            : [],
        })) as ProjectMembersInterface[]; // Explicitly assert type

      if (projectMemberData.length > 0) {
        dispatch({ type: 'SET_PROJECT_MEMBERS', payload: projectMemberData });
      }
    }
  }, [data, planMemberData]);// The planMemberData depedency is required to update the select dropdown after primary contact is changed


  useEffect(() => {
    if (planMemberData && planMemberData.planMembers) {
      // Filter out null values
      const validPlanMembers = planMemberData.planMembers.filter(
        (member): member is PlanMember => member !== null
      );

      // Extract planMemberIds
      const planMemberIds = validPlanMembers
        .map((member) => member.projectMember?.id ?? null)
        .filter((id) => id !== null);
      dispatch({ type: 'SET_PLAN_MEMBER_IDS', payload: planMemberIds });

      // Transform data
      const transformedData = transformPlanMemberData(validPlanMembers);

      if (transformedData.length > 0) {
        dispatch({ type: 'SET_PLAN_MEMBERS', payload: transformedData });
      }

      // Find primary contact
      const primaryContact = validPlanMembers.find((member) => member.isPrimaryContact);
      if (primaryContact) {
        dispatch({
          type: 'SET_PRIMARY_CONTACT',
          payload: `${primaryContact.projectMember?.givenName} ${primaryContact.projectMember?.surName}`,
        });
      }
    }
  }, [planMemberData]);

  useEffect(() => {
    if (planMembers?.length) {
      const primaryContact = planMembers.find(member => member.isPrimaryContact);
      if (primaryContact) {
        dispatch({ type: 'SET_SELECTED_PLAN_MEMBER', payload: primaryContact.id });
      }
    }
  }, [planMembers]); // Runs when `planMembers` changes


  useEffect(() => {
    if (queryError) {
      dispatch({ type: 'SET_ERROR_MESSAGES', payload: queryError.message ? [queryError.message] : [] });
    }
    if (planMemberError) {
      dispatch({ type: 'SET_ERROR_MESSAGES', payload: planMemberError.message ? [planMemberError.message] : [] });
    }
  }, [queryError, planMemberError])

  if (isLoading) {
    return <div>{Global('messaging.loading')}...</div>;
  }

  if (isError) {
    return <div>{Global('messaging.error')}</div>;
  }

  return (
    <>
      <PageHeader
        title={PlanMembers('title')}
        description=""
        showBackButton={false}
        breadcrumbs={
          <Breadcrumbs>
            <Breadcrumb><Link href="/">{Global('breadcrumbs.home')}</Link></Breadcrumb>
            <Breadcrumb><Link href="/projects">{Global('breadcrumbs.projects')}</Link></Breadcrumb>
            <Breadcrumb><Link href={`/projects/${projectId}/dmp/${dmpId}`}>{Global('breadcrumbs.planOverview')}</Link></Breadcrumb>
            <Breadcrumb>{PlanMembers('title')}</Breadcrumb>
          </Breadcrumbs>
        }
        actions={
          <>

          </>
        }
        className="page-project-members"
      />
      <ErrorMessages errors={errorMessages} ref={errorRef} />
      <LayoutContainer>
        <ContentContainer className="layout-content-container-full">
          <p>
            {PlanMembers.rich('description', {
              strong: (chunks) => <strong>{chunks}</strong>
            })}
          </p>
          <p>
            <Link href={`/projects/${projectId}/members`} className={"text-base underline"}>{PlanMembers('links.updateProjectMembers')}</Link> {PlanMembers('newWindow')}
          </p>
          <section
            aria-label="Project members list"
            role="region"
          >
            <h2>{PlanMembers('headings.h2MembersInThePlan')}</h2>
            <div>
              {(planMemberIds.length === 0) ? (
                <p>{PlanMembers('messaging.error.memberNotFound')}</p>
              ) : (
                <>
                  <div role="list">
                    {(projectMembers ?? [])
                      .filter((member) => planMemberIds.includes(Number(member.id))) // Filter out members already in the plan
                      .map((member) => (
                        <div
                          key={member.id}
                          className={styles.membersList}
                          role="listitem"
                          aria-label={`${PlanMembers('labels.planMembers')}: ${member.fullName}`}
                        >
                          <div className={classNames(styles.memberInfo, styles.box)}>
                            <h3>
                              {member.fullName}
                            </h3>
                            <p className={styles.affiliation}>{member.affiliation}</p>
                            <p className={styles.orcid}>
                              <span aria-hidden="true">
                                <OrcidIcon icon="orcid" classes={styles.orcidLogo} />
                              </span>
                              <a
                                href={orcidToUrl(member.orcid)}
                                target="_blank"
                                rel="noopener noreferrer"
                                aria-label={PlanMembers('labels.orcid', { name: member.fullName })}
                              >
                                {member.orcid}
                              </a>
                            </p>
                          </div>
                          <div className={classNames(styles.memberRole, styles.box)}>
                            <p className={styles.role}>
                              {member?.isPrimaryContact && <strong>{PlanMembers('contactPerson')},{' '}</strong>}
                              {member.roles.map((role, index) => (
                                <Fragment key={role.id}>
                                  {role.label}
                                  {index < member.roles.length - 1 && ', '}
                                </Fragment>
                              ))}
                            </p>
                          </div>
                          <div className={`${styles.memberActions} ${styles.box}`}>
                            <Button
                              onPress={() => handleRemovePlanMember(member.id)}
                              className={`${styles.memberBtn} button-link secondary`}
                              aria-label={PlanMembers('labels.removeFromPlan')}
                            >
                              {PlanMembers('labels.removeFromPlan')}
                            </Button>
                          </div>
                        </div>
                      ))}
                  </div>
                  <div className={styles.primaryContactWrapper}>
                    <h3 className={styles.primaryContact}>{PlanMembers('headings.h3PrimaryContact')}</h3>

                    {/**Just show the Plan members in the dropdown */}
                    <Form onSubmit={handlePrimaryContactForm}>
                      {isEditing ? (
                        <FormSelect
                          label=""
                          ariaLabel="primary contact selection"
                          isRequired
                          name="institution"
                          items={planMembers}

                          errorMessage={PlanMembers('form.select.selectionIsRequired')}
                          description={PlanMembers('form.select.description')}
                          onChange={(selected) =>
                            dispatch({ type: 'SET_SELECTED_PLAN_MEMBER', payload: selected as string })
                          } selectedKey={selectedPlanMember ?? undefined}
                        >
                          {(item) => <ListBoxItem key={item.id}>{item.name}</ListBoxItem>}
                        </FormSelect>
                      ) : (
                        <div className={styles.primaryContactChangeWrapper}>
                          {primaryContact && (
                            <div className="field-label">{primaryContact}{' -'}</div>
                          )}
                          <Button
                            className={`${styles.linkButton} link`}
                            onPress={() => dispatch({ type: 'SET_IS_EDITING', payload: true })}
                          >
                            {Global('buttons.change')}
                          </Button>
                        </div>
                      )}
                      {isEditing && (
                        <Button type="submit">{Global('buttons.save')}</Button>
                      )}

                    </Form>
                  </div>
                </>
              )}

            </div>
          </section>

          <section
            aria-label="Members not in list"
            role="region"
          >
            <h2>{PlanMembers('headings.h2MembersNotInPlan')}</h2>
            <div>
              {projectMembers?.filter((member) => !planMemberIds.includes(Number(member.id))).length === 0 ? (
                <p>{PlanMembers('messaging.error.memberNotFound')}</p>
              ) : (
                <>
                  <div role="list">
                    {(projectMembers ?? [])
                      .filter((member) => !planMemberIds.includes(Number(member.id))) // Filter out members already in the plan
                      .map((member) => (
                        <div
                          key={member.id}
                          className={styles.membersList}
                          role="listitem"
                          aria-label={`${PlanMembers('labels.planMembers')}: ${member.fullName}`}
                        >
                          <div className={`${styles.memberInfo} ${styles.box}`}>
                            <h3>
                              {member.fullName}
                            </h3>
                            <p className={styles.affiliation}>{member.affiliation}</p>
                            <p className={styles.orcid}>
                              <span aria-hidden="true">
                                <OrcidIcon icon="orcid" classes={styles.orcidLogo} />
                              </span>
                              <a
                                href={orcidToUrl(member.orcid)}
                                target="_blank"
                                rel="noopener noreferrer"
                                aria-label={PlanMembers('labels.orcid', { name: member.fullName })}
                              >
                                {member.orcid}
                              </a>
                            </p>
                          </div>
                          <div className={`${styles.memberRole} ${styles.box}`}>
                            <p className={styles.role}>
                              {member?.isPrimaryContact && <strong>Contact person,{' '}</strong>}
                              {member.roles.map((role, index) => (
                                <span key={role.id}>
                                  {role.label}
                                  {index < member.roles.length - 1 && ', '}
                                </span>
                              ))}
                            </p>                        </div>
                          <div className={`${styles.memberActions} ${styles.box}`}>
                            <Button
                              onPress={() => handleAddPlanMember(member.id)}

                              className={"button-link primary"}
                              aria-label={PlanMembers('labels.addMemberToPlan')}
                            >
                              {PlanMembers('labels.addMemberToPlan')}
                            </Button>
                          </div>
                        </div>
                      ))}
                  </div>
                </>
              )}

            </div>
          </section>

          <section className={styles.otherOptions}>
            <h2>{PlanMembers('headings.h2AddProjectMember')}</h2>
            <p>{PlanMembers.rich('addProjectMemberInfo', {
              strong: (chunks) => <strong>{chunks}</strong>
            })}</p>
            <Link href={PROJECT_MEMBERS_ROUTE} className={"text-base underline"}>{PlanMembers('links.updateProjectMembers')}</Link> {PlanMembers('newWindow')}

            <h2>{PlanMembers('headings.h2AllowOthers')}</h2>
            <p>
              {PlanMembers('allowOthersToAccess')}
            </p>
            <Link href={PROJECT_MEMBERS_ROUTE}>{PlanMembers('links.inviteAPerson')}</Link>
          </section>

        </ContentContainer>
      </LayoutContainer>
    </>
  );
};

export default ProjectsProjectPlanAdjustMembers;
