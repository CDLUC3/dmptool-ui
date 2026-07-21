'use client';

import React, { useEffect, useRef, useState } from 'react';
import { useTranslations } from 'next-intl';
import { useParams } from 'next/navigation';

import {
  Breadcrumb,
  Breadcrumbs,
  Button,
  Form,
  Input,
  Label,
  Link,
  SearchField,
  Text
} from "react-aria-components";

//GraphQL
import {
  CollaboratorSearchResult,
} from '@/generated/graphql';

// Components
import PageHeader from "@/components/PageHeader";
import {
  ContentContainer,
  LayoutContainer,
} from "@/components/Container";
import { OrcidIcon } from '@/components/Icons/orcid/';
import { FormInput } from "@/components/Form";
import { TypeAheadWithOther, useAffiliationSearch } from '@/components/Form/TypeAheadWithOther';
import Loading from '@/components/Loading';
import ProjectRoles from '../ProjectRoles';
import ErrorMessages from '@/components/ErrorMessages';

// Hooks
import { useCollaboratorSearch } from './hooks/useCollaboratorSearch';
import { useProjectMemberForm } from './hooks/useProjectMemberForm';

// Utils
import { routePath } from '@/utils/index';
import styles from './ProjectsProjectMembersSearch.module.scss';

const ProjectsProjectMembersSearch = () => {
  const params = useParams();
  const projectId = String(params.projectId);

  // Scroll to top when search is reset
  const topRef = useRef<HTMLDivElement>(null);

  //For scrolling to error in modal window
  const errorRef = useRef<HTMLDivElement | null>(null);

  // Translation keys
  const Global = useTranslations('Global');
  const t = useTranslations('ProjectsProjectMembersSearch');

  // For TypeAhead component
  const { suggestions, handleSearch: handleAffiliationSearch, isSearching: isAffiliationSearching, searchError: affiliationSearchError } = useAffiliationSearch();

  const [otherField, setOtherField] = useState(false);

  // Use the custom hook for form management
  const {
    projectMember,
    setProjectMember,
    roles,
    memberRoles,
    errors,
    fieldErrors,
    handleCheckboxChange,
    handleFormSubmit,
    resetErrors,
    updateAffiliationFormData,
    clearAllFormFields,
  } = useProjectMemberForm(projectId);

  const {
    term,
    results,
    isSearching,
    loading: searchLoading,
    errors: searchErrors,
    setSearchTerm,
    handleMemberSearch: handleCollaboratorSearch,
    clearSearch
  } = useCollaboratorSearch();

  const reset = () => {
    resetErrors();
    clearAllFormFields();
  }

  // Handle any changes to form field values
  function handleOtherAffiliationInputChange(e: React.ChangeEvent<HTMLInputElement>) {
    // Clear previous error messages
    resetErrors();
    const { name, value } = e.target;
    setProjectMember({ ...projectMember, [name]: value });
  }


  //Update searchTerm state whenever entry in the search field changes
  const handleSearchInput = (value: string) => {
    reset(); // clear form and errors when search input changes
    setSearchTerm(value);
  }


  // Handler for search button - now uses the hook's functionality
  const handleMemberSearch = async () => {
    clearAllFormFields();
    resetErrors();
    await handleCollaboratorSearch();
  };


  // Handle selecting a search result to populate form fields
  const handleSelectSearchResult = (result: CollaboratorSearchResult) => {
    setProjectMember({
      givenName: result?.givenName || '',
      surName: result?.surName || '',
      email: result?.email || '',
      orcid: result?.orcid || '',
      affiliationName: result?.affiliationName || '',
      affiliationId: result?.affiliationId || result?.affiliationRORId || '',
      otherAffiliationName: '',
    });

    // Clear any previous errors
    resetErrors();
  }

  // Handle clearing the form to start fresh
  const handleClearForm = () => {
    clearSearch();
  }

  // Auto-populate form with the result when we get search results
  useEffect(() => {
    if (results.length > 0) {
      const firstResult = results[0];
      handleSelectSearchResult(firstResult);
    }
  }, [results]);


  // Reset form when search term is cleared
  useEffect(() => {
    if (term === '') {
      // Clear form when search is cleared
      clearAllFormFields();
      resetErrors();
    }
  }, [term, clearAllFormFields, resetErrors])

  return (
    <>
      <PageHeader
        title={t('title')}
        description={t('description')}
        showBackButton={true}
        breadcrumbs={
          <Breadcrumbs>
            <Breadcrumb><Link href={routePath('app.home')}>{Global('breadcrumbs.home')}</Link></Breadcrumb>
            <Breadcrumb><Link href={routePath('projects.index')}>{Global('breadcrumbs.projects')}</Link></Breadcrumb>
          </Breadcrumbs>
        }
        className="page-project-members-search"
      />

      <ErrorMessages errors={[...errors, ...searchErrors]} ref={errorRef} />

      <LayoutContainer>
        <ContentContainer>
          {/** Search */}
          <section id="search-section" className={styles.searchSection} role="search" ref={topRef}>
            <SearchField>
              <Label>{t('searchLabel')} <span className="is-required">(recommended)</span></Label>
              <Input
                aria-describedby="search-help"
                value={term}
                onChange={e => handleSearchInput(e.target.value)} />
              <Button
                onPress={() => {
                  handleMemberSearch();
                }}
              >
                {Global('buttons.lookup')}
              </Button>
              <Text slot="description" className="help-text" id="search-help">
                {t('searchDescription')}
              </Text>
            </SearchField>
          </section>

          {/** Search Result section */}
          {isSearching && (
            <section aria-labelledby="results-section">
              {results.length > 0 && (
                <>
                  <div id="results-section" className={styles.resultsHeader}><strong>{t('headings.searchResultsHeader')}</strong>
                    <Button
                      className="link"
                      onPress={handleClearForm}
                      aria-label={t('buttons.clearForm')}
                    >
                      {t('buttons.clearForm')}
                    </Button>
                  </div>
                </>
              )}

              <div>
                {searchLoading && (
                  <Loading
                    variant="inline"
                    message={Global('messaging.loading')}
                    isActive={true}
                  />
                )}

                {results.length === 0 && !searchLoading && (
                  <div className={styles.noResults}>
                    <p>{Global('messaging.noItemsFound')}</p>
                  </div>
                )}

                {results.map((result: CollaboratorSearchResult, index: number) => {
                  const name = `${result?.givenName} ${result?.surName} `;
                  return (
                    <div
                      key={result.id}
                      data-testid={`result-${index} `}
                      data-result-index={index}
                      className={`${styles.memberResultsListItem}`}
                      role="button"
                      tabIndex={0}
                      onClick={() => handleSelectSearchResult(result)}
                      onKeyDown={(e) => {
                        if (e.key === 'Enter' || e.key === ' ') {
                          e.preventDefault();
                          handleSelectSearchResult(result);
                        }
                      }}
                      aria-label={t('ariaSelectSearchResult', { name })}
                      style={{ cursor: 'pointer' }}
                    >
                      <div className={styles.memberInfo}>
                        <div className={styles.nameAndOrcid}>
                          <p className={styles.name}>{name}</p>
                        </div>
                        <p className={styles.organization}>
                          {result?.affiliationName}

                          <br />
                          {result?.orcid && (
                            <span className={styles.orcid}>
                              <OrcidIcon icon="orcid" classes={styles.orcidLogo} />
                              {result.orcid}
                            </span>
                          )}
                        </p>
                      </div>
                    </div>
                  )
                })}
              </div>
            </section>
          )}

          {/** Member Details section */}
          <section id="member-details">
            <h2>{t('headings.enterMemberDetails')}</h2>
            <Form onSubmit={handleFormSubmit}>
              <FormInput
                name="firstName"
                id="firstName"
                type="text"
                isRequiredVisualOnly={true}
                label={t('labels.givenName')}
                value={projectMember.givenName}
                onChange={(e) => {
                  resetErrors();
                  setProjectMember({ ...projectMember, givenName: e.target.value })
                }}
                isInvalid={(!!fieldErrors.givenName)}
                errorMessage={fieldErrors.givenName}
              />

              <FormInput
                name="lastName"
                id="lastName"
                type="text"
                isRequiredVisualOnly={true}
                label={t('labels.surName')}
                value={projectMember.surName}
                onChange={(e) => {
                  resetErrors();
                  setProjectMember({ ...projectMember, surName: e.target.value })
                }}
                isInvalid={(!!fieldErrors.surName)}
                errorMessage={fieldErrors.surName}
              />

              <TypeAheadWithOther
                label={t('labels.affiliation')}
                fieldName="affiliation"
                setOtherField={setOtherField}
                isRequiredVisualOnly={true}
                error={fieldErrors.affiliationName ?? affiliationSearchError ?? ''}
                updateFormData={updateAffiliationFormData}
                value={projectMember.affiliationName}
                suggestions={suggestions}
                onSearch={handleAffiliationSearch}
                isLoading={isAffiliationSearching}
              />
              {otherField && (
                <div className={`${styles.formRow} ${styles.oneItemRow}`}>
                  <FormInput
                    name="otherAffiliationName"
                    id="otherAffiliationName"
                    type="text"
                    label={t('labels.otherAffiliationName')}
                    placeholder={projectMember.otherAffiliationName}
                    value={projectMember.otherAffiliationName}
                    onChange={handleOtherAffiliationInputChange}
                  />
                </div>
              )}

              <FormInput
                name="email"
                id="email"
                type="email"
                isRequired={false}
                isRecommended={true}
                label={t('labels.email')}
                value={projectMember.email}
                onChange={(e) => {
                  resetErrors();
                  setProjectMember({ ...projectMember, email: e.target.value })
                }}
                isInvalid={(!!fieldErrors.email)}
                errorMessage={fieldErrors.email}
              />

              <div className={styles.memberRoles}>
                <ProjectRoles
                  roles={roles}
                  handleCheckboxChange={handleCheckboxChange}
                  isInvalid={(!!fieldErrors.projectRoles)}
                  errorMessage={fieldErrors.projectRoles}
                  memberRoles={memberRoles}
                />
              </div>
              <Button type="submit" className="submit-button">{t('buttons.addToProject')}</Button>
            </Form>
          </section>
        </ContentContainer>
      </LayoutContainer >
    </>
  );
};

export default ProjectsProjectMembersSearch;
