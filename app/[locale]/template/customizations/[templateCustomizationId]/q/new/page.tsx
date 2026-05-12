'use client'

import { useCallback, useEffect, useRef, useState } from 'react';
import { useTranslations } from 'next-intl';
import { useParams, useRouter, useSearchParams } from 'next/navigation';
import {
  Breadcrumb,
  Breadcrumbs,
  Button,
  FieldError,
  Input,
  Label,
  Link,
  SearchField,
  Text
} from "react-aria-components";

// GraphQL
import { useMutation, useQuery } from '@apollo/client/react';
import {
  AddCustomQuestionDocument,
  CustomizableObjectOwnership,
  TemplateCustomizationOverviewDocument
} from '@/generated/graphql';


// Components
import PageHeader from "@/components/PageHeader";
import { ContentContainer, LayoutContainer, } from '@/components/Container';
import QuestionAdd from '@/components/QuestionAdd';
import QuestionTypeCard from '@/components/QuestionTypeCard';
import ErrorMessages from '@/components/ErrorMessages';
import Loading from '@/components/Loading';

//Other
import { scrollToTop } from '@/utils/general';
import { routePath } from '@/utils/routes';
import { useQueryStep } from '@/app/[locale]/template/[templateId]/q/new/utils';
import { QuestionFormatInterface } from '@/app/types';
import styles from './newCustomQuestion.module.scss';
import { getQuestionTypes } from "@/utils/questionTypeHandlers";

const CustomQuestionBreadcrumbs = ({ templateCustomizationId, Global }: { templateCustomizationId: string; Global: (key: string, values?: Record<string, string | number>) => string }) => {
  return (
    <Breadcrumbs>
      <Breadcrumb><Link href={routePath('app.home')}>{Global('breadcrumbs.home')}</Link></Breadcrumb>
      <Breadcrumb><Link href={routePath('template.customizations')}>{Global('breadcrumbs.templateCustomizations')}</Link></Breadcrumb>
      <Breadcrumb><Link href={routePath('template.customize', { templateCustomizationId })}>{Global('breadcrumbs.template')}</Link></Breadcrumb>
      <Breadcrumb>{Global('breadcrumbs.selectQuestionType')}</Breadcrumb>
    </Breadcrumbs>
  )
}

const CustomQuestionNew: React.FC = () => {
  // Get templateId param
  const params = useParams();
  const router = useRouter();
  const searchParams = useSearchParams();
  const topRef = useRef<HTMLDivElement>(null);
  //For scrolling to error in page
  const errorRef = useRef<HTMLDivElement | null>(null);
  const templateCustomizationId = String(params.templateCustomizationId); // From route /template/customizations/:templateCustomizationId
  const sectionId = searchParams.get('section_id') ?? '';
  const customQuestionId = searchParams.get('customQuestionId');// if user is switching their question type while editing an existing question

  // Track the last question in the current section to pin the new question after
  const [lastQuestionId, setLastQuestionId] = useState<number | null>(null);
  const [lastQuestionType, setLastQuestionType] = useState<CustomizableObjectOwnership | null>(null);

  // State management
  const [step, setStep] = useState<number | null>(null);
  const [questionTypes, setQuestionTypes] = useState<QuestionFormatInterface[]>([]);
  const [searchTerm, setSearchTerm] = useState<string>('');
  const [filteredQuestionTypes, setFilteredQuestionTypes] = useState<QuestionFormatInterface[] | null>([]);
  const [searchButtonClicked, setSearchButtonClicked] = useState(false);
  const [selectedQuestionType, setSelectedQuestionType] = useState<{ questionType: string, questionName: string, questionJSON: string }>();
  const [errors, setErrors] = useState<string[]>([]);
  const [sectionType, setSectionType] = useState<CustomizableObjectOwnership>(CustomizableObjectOwnership.Custom);

  const stepQueryValue = useQueryStep();

  //Localization keys
  const Global = useTranslations('Global');
  const QuestionTypeSelect = useTranslations('QuestionTypeSelectPage');

  // Initialize add and update question mutations
  const [addCustomQuestionMutation] = useMutation(AddCustomQuestionDocument, {
    refetchQueries: [TemplateCustomizationOverviewDocument],
  });

  // Run template query to get all sections and questions under the given templateCustomizationId
  const {
    data,
    loading,
    error: templateQueryErrors,
  } = useQuery(TemplateCustomizationOverviewDocument, {
    variables: { templateCustomizationId: Number(templateCustomizationId) },
  });

  // Handle the selection of a question type
  const handleSelect = (
    {
      questionJSON,
      questionType,
      questionTypeName
    }: {
      questionJSON: string;
      questionType: string;
      questionTypeName: string;
    }) => {

    if (customQuestionId) {
      //If the user came from editing an existing question, we want to return them to that page with the new questionTypeId
      // We need to use a full page reload to ensure all state is reset so that 'beforeunload' events are properly handled in the next page
      // to display unsaved changes warning if needed
      window.location.href = routePath('template.customQuestion', { templateCustomizationId, customQuestionId }, { section_id: sectionId, step: 1, questionType, questionName: questionTypeName, questionJSON });

    } else {
      // redirect to the Question Edit page if a user is adding a new question
      if (questionType) {
        setSelectedQuestionType({ questionType, questionName: questionTypeName, questionJSON });
        setStep(2);
        // Use router.replace with restore=true so that 'beforeunload' events are properly detected in the next page. This will cause users to go back to the
        // Template Overview page rather than the question type selection page when they click "Back" in their browser
        router.replace(routePath('template.customize.question.create', { templateCustomizationId }, { section_id: sectionId, step: 2, restore: true }));

      }
    }
  }

  // Clear search term and filters
  const resetSearch = useCallback(() => {
    setSearchTerm('');
    setFilteredQuestionTypes(null);
    scrollToTop(topRef);
  }, [scrollToTop]);


  // Filter through questionTypes and find the question type whose info includes the search term
  const filterQuestionTypes = (
    questionTypes: QuestionFormatInterface[],
    term: string
  ): QuestionFormatInterface[] =>
    questionTypes.filter(qt => {
      const lowerTerm = term.toLowerCase();
      const nameMatch = qt.title?.toLowerCase().includes(lowerTerm);
      const usageDescriptionMatch = qt.usageDescription?.toLowerCase().includes(lowerTerm);

      return nameMatch || usageDescriptionMatch;
    });

  // Filter results when a user enters a search term and clicks "Search" button
  const handleFiltering = (term: string) => {
    setSearchButtonClicked(true);
    setErrors([]);

    // Search title, funder and description fields for terms
    const filteredQuestionTypes = filterQuestionTypes(questionTypes, term);

    if (filteredQuestionTypes.length > 0) {
      setFilteredQuestionTypes(filteredQuestionTypes.length > 0 ? filteredQuestionTypes : []);
    }
  }

  useEffect(() => {
    setQuestionTypes(getQuestionTypes());
  }, []);

  useEffect(() => {
    // Need this to set list of templates back to original, full list after filtering
    if (searchTerm === '') {
      resetSearch();
      setSearchButtonClicked(false);
    }
  }, [searchTerm, resetSearch])

  useEffect(() => {
    // If a step was specified in a query param, then set that step
    if (step !== stepQueryValue) {
      setStep(stepQueryValue);
    }
  }, [stepQueryValue])

  // Calculate the last question in the current section to determine where to pin the new question. 
  // This runs whenever the template overview query returns new data or the sectionId changes (i.e. user goes to a different section)
  useEffect(() => {
    if (!data?.templateCustomizationOverview?.sections || !sectionId) return;

    const section = data.templateCustomizationOverview.sections.find(
      s => s?.id === Number(sectionId)
    );

    // Derive sectionType from the actual parent section
    setSectionType(
      section?.sectionType === 'CUSTOM'
        ? CustomizableObjectOwnership.Custom
        : CustomizableObjectOwnership.Base
    );


    if (!section?.questions?.length) {
      setLastQuestionId(null);
      setLastQuestionType(null);
      return;
    }

    // Questions are ordered by displayOrder — find the one with the highest value
    const lastQuestion = [...section.questions]
      .filter(q => q != null)
      .sort((a, b) => (a?.displayOrder ?? 0) - (b?.displayOrder ?? 0))
      .at(-1);

    setLastQuestionId(lastQuestion?.id ?? null);
    // questionType in the data is "BASE" | "CUSTOM" which maps directly to CustomizableObjectOwnership
    setLastQuestionType(lastQuestion?.questionType as CustomizableObjectOwnership ?? null);

  }, [data, sectionId]);

  if (loading) {
    return <Loading message={Global('messaging.loading')} />;
  }

  if (templateQueryErrors) {
    return <ErrorMessages errors={templateQueryErrors.message ? [templateQueryErrors.message] : [Global('messaging.somethingWentWrong')]} />;
  }
  return (
    <>
      {step === 1 && (
        <>
          <PageHeader
            title={QuestionTypeSelect('title')}
            description={QuestionTypeSelect('description')}
            showBackButton={false}
            breadcrumbs={<CustomQuestionBreadcrumbs templateCustomizationId={String(templateCustomizationId)} Global={Global} />}
            actions={null}
            className=""
          />

          <LayoutContainer>
            <ContentContainer>
              <ErrorMessages errors={errors} ref={errorRef} />
              <div className="searchSection" role="search" ref={topRef}>
                <SearchField>
                  <Label>{Global('labels.searchByKeyword')}</Label>
                  <Input
                    aria-describedby="search-help"
                    value={searchTerm}
                    onChange={e => setSearchTerm(e.target.value)} />
                  <Button
                    onPress={() => {
                      handleFiltering(searchTerm);
                    }}
                  >
                    {Global('buttons.search')}
                  </Button>
                  <FieldError />
                  <Text slot="description" className="help">
                    {QuestionTypeSelect('searchHelpText')}
                  </Text>
                </SearchField>
              </div>
              <div>
                {/*Show # of results with clear filter link*/}
                {(searchTerm.length > 0 && searchButtonClicked) && (
                  <div className={styles.searchMatchText}> {Global('messaging.resultsText', { name: filteredQuestionTypes?.length || 0 })} - <Button onPress={resetSearch} className={`${styles.searchMatchText} link`}>{QuestionTypeSelect('links.clearFilter')}</Button></div>
                )}
                <div className="card-grid-list">
                  {filteredQuestionTypes && filteredQuestionTypes.length > 0 ? (
                    <>
                      {filteredQuestionTypes.map((questionType) => (
                        <QuestionTypeCard
                          key={questionType.type}
                          questionType={questionType}
                          handleSelect={handleSelect}
                        />
                      ))}
                    </>
                  ) : (
                    <>
                      {/**If the user is searching, and there were no results from the search
                                 * then display the message 'no results found
                                 */}
                      {(searchTerm.length > 0 && searchButtonClicked) ? (
                        <>
                          {Global('messaging.noItemsFound')}
                        </>
                      ) : (
                        <>
                          {questionTypes.map((questionType) => (
                            <QuestionTypeCard
                              key={questionType.type}
                              questionType={questionType}
                              handleSelect={handleSelect}
                            />
                          ))}
                        </>
                      )
                      }
                    </>
                  )

                  }
                </div>
                {/*Show # of results with clear filter link*/}
                {((filteredQuestionTypes && filteredQuestionTypes.length > 0) && searchButtonClicked) && (
                  <div className={styles.clearFilter}>
                    <div className={styles.searchMatchText}> {Global('messaging.resultsText', { name: filteredQuestionTypes?.length || 0 })} - <Button onPress={resetSearch} className={`${styles.searchMatchText} link`}>{QuestionTypeSelect('links.clearFilter')}</Button></div>
                  </div>
                )}
              </div>
            </ContentContainer>
          </LayoutContainer>
        </>
      )}
      {step === 2 && (
        <>
          {/*Show Edit Question form*/}
          <QuestionAdd
            questionType={selectedQuestionType?.questionType ?? null}
            questionName={selectedQuestionType?.questionName ?? null}
            questionJSON={selectedQuestionType?.questionJSON ?? ''}
            sectionId={sectionId ? sectionId : ''}
            breadcrumbs={<CustomQuestionBreadcrumbs templateCustomizationId={String(templateCustomizationId)} Global={Global} />}
            backUrl={routePath('template.customize.question.create', { templateCustomizationId }, { section_id: sectionId, step: 1 })}
            successUrl={routePath('template.customize', { templateCustomizationId })}
            onSave={async (commonFields) => {
              // Filter out displayOrder from the commonFields since it's not needed for the mutation input and is causing issues with the type.
              // We will set displayOrder in the backend based on the pinnedQuestionId and pinnedQuestionType that we are passing in to pin the 
              // new question right after the last question in the section
              const { displayOrder: _ignored, ...questionFields } = commonFields;
              const input = {
                templateCustomizationId: Number(templateCustomizationId),
                sectionId: Number(sectionId),
                sectionType,
                pinnedQuestionId: lastQuestionId,
                pinnedQuestionType: lastQuestionType ?? null,
                ...questionFields,
              };
              await addCustomQuestionMutation({ variables: { input } });
            }}
          />
        </>
      )}
    </>
  );
}

export default CustomQuestionNew;

