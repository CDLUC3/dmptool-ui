'use client';

import { useEffect, useRef, useState } from 'react';
import { useParams, useRouter } from 'next/navigation';
import { useTranslations } from 'next-intl';
import {
  Breadcrumb,
  Breadcrumbs,
  Button,
  Link,
} from "react-aria-components";

// GraphQL
import { useQuery } from '@apollo/client/react';
import { ProjectDocument } from '@/generated/graphql';

// Components
import PageHeader from "@/components/PageHeader";
import { ContentContainer, LayoutContainer, } from "@/components/Container";
import { OrcidIcon } from '@/components/Icons/orcid/';
import ErrorMessages from '@/components/ErrorMessages';
import SkeletonListLoading from '@/components/SkeletonListLoading';

import { routePath } from '@/utils/routes';
import styles from './ProjectsProjectMembers.module.scss';
import { orcidToUrl } from "@/lib/identifierUtils";

interface ProjectMemberInterface {
  id: number | null;
  fullName: string;
  affiliation: string;
  orcid: string;
  roles: string[];
}

const ProjectsProjectMembers = () => {
  const router = useRouter();
  // To scroll to error message
  const errorRef = useRef<HTMLDivElement | null>(null);
  // Get projectId param
  const params = useParams();
  const projectId = String(params.projectId);  // From route /projects/:projectId

  // Localization keys
  const ProjectMembers = useTranslations('ProjectsProjectMembers');
  const MemberListItem = useTranslations('ProjectMemberListItem');
  const Global = useTranslations('Global');

  const [projectMembers, setProjectMembers] = useState<ProjectMemberInterface[]>();
  const [errors, setErrors] = useState<string[]>([]);
  // Track whether the project should be in read-only mode based on the "readOnly" field 
  // returned from the backend from ProjectDocument query
  const [isReadOnly, setIsReadOnly] = useState<boolean>(false);

  // Get project members using projectid
  const { data, loading, error: queryError } = useQuery(ProjectDocument,
    {
      variables: { projectId: Number(projectId) },
      fetchPolicy: 'network-only',// So that when members are deleted the page refreshes
      notifyOnNetworkStatusChange: true
    }
  );

  // Routes
  const collaborationRoute = routePath('projects.collaboration', { projectId });

  const handleAddMember = (): void => {
    // Handle adding new member
    router.push(routePath('projects.members.search', { projectId }));
  };

  const handleEdit = (memberId: number | null): void => {

    // Handle editing member
    router.push(routePath('projects.members.edit', { projectId, memberId: String(memberId) }));
  };

  useEffect(() => {
    // When data from backend changes, set project members data in state
    if (data && data.project && data.project.members) {
      const projectMemberData = data.project.members.map((member) => ({
        id: member?.id ?? null,
        fullName: `${member?.givenName} ${member?.surName}`,
        affiliation: member?.affiliation?.displayName ?? '',
        orcid: member?.orcid ?? '',
        roles: member?.memberRoles?.map((role) => role.label) ?? [],
      }))
      setProjectMembers(projectMemberData);
      setIsReadOnly(data.project.readOnly ?? false);
    }
  }, [data]);

  useEffect(() => {
    if (queryError) {
      const errorMsg = ProjectMembers('messages.errors.errorGettingMembers');
      setErrors(prev => [...prev, errorMsg]);
    }
  }, [queryError])

  if (loading) {
    return (
      <LayoutContainer>
        <ContentContainer className="layout-content-container-full">
          <SkeletonListLoading
            count={3}
            ariaLabel={Global('messaging.loadingList')}
          />
        </ContentContainer>
      </LayoutContainer>
    );
  }


  return (
    <>
      <PageHeader
        title={ProjectMembers('title')}
        description={ProjectMembers('description')}
        showBackButton={false}
        breadcrumbs={
          <Breadcrumbs>
            <Breadcrumb><Link href={routePath('app.home')}>{Global('breadcrumbs.home')}</Link></Breadcrumb>
            <Breadcrumb><Link href={routePath('projects.index')}>{Global('breadcrumbs.projects')}</Link></Breadcrumb>
            <Breadcrumb><Link href={routePath('projects.show', { projectId })}>{Global('breadcrumbs.projectOverview')}</Link></Breadcrumb>
            <Breadcrumb>{ProjectMembers('title')}</Breadcrumb>
          </Breadcrumbs>
        }
        actions={
          <>
            {!isReadOnly && (
              <Button
                onPress={handleAddMember}
                className="secondary"
              >
                {ProjectMembers('buttons.addMembers')}
              </Button>
            )}
          </>
        }
        className="page-project-members"
      />
      <ErrorMessages errors={errors} ref={errorRef} />
      <LayoutContainer>
        <ContentContainer className="layout-content-container-full">
          <section
            aria-labelledby="project-members-heading"
          >
            <h2 id="project-members-heading" className="sr-only">
              {ProjectMembers('title')}
            </h2>
            {(!projectMembers || projectMembers?.length === 0) ? (
              <p>{ProjectMembers('messages.noMembers')}</p>
            ) : (
              <ul className={styles.membersList} role="list">
                {projectMembers.map((member) => (
                  <li
                    key={member.id}
                    className={styles.membersListItem}
                  >
                    <div className={styles.memberCardHeader}>
                      <div className={styles.memberInfo}>
                        <div className={styles.memberNameRow}>
                          <h3 className={styles.memberNameHeading}>
                            {!isReadOnly && member.id !== null ? (
                              <Link
                                href={routePath('projects.members.edit', {
                                  projectId,
                                  memberId: String(member.id),
                                })}
                                className={styles.memberNameLink}
                                aria-label={MemberListItem('ariaLabels.editMember', { name: member.fullName })}
                              >
                                {member.fullName}
                              </Link>
                            ) : (
                              member.fullName
                            )}
                          </h3>
                          {member.orcid && member.orcid !== '' && (
                            <a
                              href={orcidToUrl(member.orcid)}
                              className={styles.orcidLink}
                              target="_blank"
                              rel="noopener noreferrer"
                              aria-label={MemberListItem('ariaLabels.orcidProfile', { name: member.fullName })}
                            >
                              <span aria-hidden="true">
                                <OrcidIcon icon="orcid" classes={styles.orcidLogo} />
                              </span>
                            </a>
                          )}
                        </div>
                        <p className={styles.affiliation}>{member.affiliation}</p>
                      </div>
                      {!isReadOnly && (
                        <div className={styles.memberActions}>
                          <Button
                            onPress={() => handleEdit(member.id)}
                            className="secondary"
                            aria-label={MemberListItem('ariaLabels.editMember', { name: member.fullName })}
                          >
                            {Global('buttons.edit')}
                          </Button>
                        </div>
                      )}
                    </div>
                    <div className={styles.memberRoles}>
                      <p className="sr-only">{ProjectMembers('headings.roles')}</p>
                      <ul className={styles.rolesList} role="list">
                        {member.roles.map((role) => (
                          <li key={role}>{role}</li>
                        ))}
                      </ul>
                    </div>
                  </li>
                ))}
              </ul>
            )}
          </section>

          {!isReadOnly && (
            <section
              aria-labelledby="collaborators-heading"
              className={styles.collaboratorAccess}
            >
              <h2 id="collaborators-heading">{ProjectMembers('headings.h2AllowCollaborators')}</h2>
              <p>
                {ProjectMembers.rich('para.para1AllowCollaborators', {
                  shareWithPeople: (chunks) => <Link href={collaborationRoute}>{chunks}</Link>
                })}
              </p>

              <Link
                href={collaborationRoute}
                className="button-link secondary"
                aria-label={ProjectMembers('buttons.shareWithPeople')}
              >
                {ProjectMembers('buttons.shareWithPeople')}
              </Link>
            </section>
          )}
        </ContentContainer>
      </LayoutContainer >
    </>
  );
};

export default ProjectsProjectMembers;
