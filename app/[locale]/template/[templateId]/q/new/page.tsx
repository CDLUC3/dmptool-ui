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
  AddQuestionDocument,
  QuestionsDisplayOrderDocument,
} from '@/generated/graphql';


// Components
import PageHeader from "@/components/PageHeader";
import { ContentContainer, LayoutContainer, } from '@/components/Container';
import QuestionAdd from '@/components/QuestionAdd';
import QuestionTypeCard from '@/components/QuestionTypeCard';
import ErrorMessages from '@/components/ErrorMessages';

//Other
import { scrollToTop } from '@/utils/general';
import { routePath } from '@/utils/routes';
import { useQueryStep } from '@/app/[locale]/template/[templateId]/q/new/utils';
import { QuestionFormatInterface } from '@/app/types';
import styles from './newQuestion.module.scss';
import { getQuestionTypes } from "@/utils/questionTypeHandlers";

const TemplateQuestionBreadcrumbs = ({ templateId, sectionId, Global }: { templateId: string; sectionId: string; Global: (key: string, values?: Record<string, string | number>) => string }) => {
  return (
    <Breadcrumbs>
      <Breadcrumb><Link href={routePath('projects.index')}>{Global('breadcrumbs.home')}</Link></Breadcrumb>
      <Breadcrumb><Link href={routePath('template.index', { templateId })}>{Global('breadcrumbs.templates')}</Link></Breadcrumb>
      <Breadcrumb><Link href={routePath('template.show', { templateId })}>{Global('breadcrumbs.editTemplate')}</Link></Breadcrumb>
      <Breadcrumb><Link href={routePath('template.q.new', { templateId }, { section_id: sectionId, step: 1 })}>{Global('breadcrumbs.selectQuestionType')}</Link></Breadcrumb>
      <Breadcrumb>{Global('breadcrumbs.question')}</Breadcrumb>
    </Breadcrumbs >
  )
}

const QuestionTypeSelectPage: React.FC = () => {
  // Get templateId param
  const params = useParams();
  const router = useRouter();
  const searchParams = useSearchParams();
  const topRef = useRef<HTMLDivElement>(null);
  //For scrolling to error in page
  const errorRef = useRef<HTMLDivElement | null>(null);
  const templateId = String(params.templateId); // From route /template/:templateId
  const sectionId = searchParams.get('section_id') ?? '';
  const questionId = searchParams.get('questionId');// if user is switching their question type while editing an existing question

  // State management
  const [step, setStep] = useState<number | null>(null);
  const [questionTypes, setQuestionTypes] = useState<QuestionFormatInterface[]>([]);
  const [searchTerm, setSearchTerm] = useState<string>('');
  const [filteredQuestionTypes, setFilteredQuestionTypes] = useState<QuestionFormatInterface[] | null>([]);
  const [searchButtonClicked, setSearchButtonClicked] = useState(false);
  const [selectedQuestionType, setSelectedQuestionType] = useState<{ questionType: string, questionName: string, questionJSON: string }>();
  const [errors, setErrors] = useState<string[]>([]);

  const stepQueryValue = useQueryStep();

  //Localization keys
  const Global = useTranslations('Global');
  const QuestionTypeSelect = useTranslations('QuestionTypeSelectPage');

  // Initialize add and update question mutations
  const [addQuestionMutation] = useMutation(AddQuestionDocument);

  // Query request for questions to calculate max displayOrder
  const { data: questionDisplayOrders } = useQuery(QuestionsDisplayOrderDocument, {
    variables: {
      sectionId: Number(sectionId)
    },
    skip: !sectionId
  })

  // Calculate the display order of the new question based on the last displayOrder number
  const getDisplayOrder = useCallback(() => {
    if (!questionDisplayOrders?.questions?.length) {
      return 1;
    }

    // Filter out null/undefined questions and handle missing displayOrder
    const validDisplayOrders = questionDisplayOrders.questions
      .map(q => q?.displayOrder)
      .filter((order): order is number => typeof order === 'number');

    if (validDisplayOrders.length === 0) {
      return 1;
    }

    const maxDisplayOrder = Math.max(...validDisplayOrders);
    return maxDisplayOrder + 1;
  }, [questionDisplayOrders]);


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

    if (questionId) {
      //If the user came from editing an existing question, we want to return them to that page with the new questionTypeId
      // We need to use a full page reload to ensure all state is reset so that 'beforeunload' events are properly handled in the next page
      // to display unsaved changes warning if needed
      window.location.href = routePath('template.q.slug', { templateId, q_slug: questionId }, { questionType });

    } else {
      // redirect to the Question Edit page if a user is adding a new question
      if (questionType) {
        setSelectedQuestionType({ questionType, questionName: questionTypeName, questionJSON });
        setStep(2);
        // Use router.replace with restore=true so that 'beforeunload' events are properly detected in the next page. This will cause users to go back to the
        // Template Overview page rather than the question type selection page when they click "Back" in their browser
        router.replace(routePath('template.q.new', { templateId }, { section_id: sectionId, step: 2, restore: true }));

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
      const jsonMatch = qt.usageDescription?.toLowerCase().includes(lowerTerm);

      return nameMatch || jsonMatch || usageDescriptionMatch;
    });

  // Filter results when a user enters a search term and clicks "Search" button
  const handleFiltering = (term: string) => {
    setSearchButtonClicked(true);
    setErrors([]);

    // Search title, funder and description fields for terms
    const filteredQuestionTypes = filterQuestionTypes(questionTypes, term);

    if (filteredQuestionTypes.length > 0) {
      setFilteredQuestionTypes(filteredQuestionTypes.length > 0 ? filteredQuestionTypes : null);
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

  return (
    <>
      {step === 1 && (
        <>
          <PageHeader
            title={QuestionTypeSelect('title')}
            description={QuestionTypeSelect('description')}
            showBackButton={false}
            breadcrumbs={
              <Breadcrumbs>
                <Breadcrumb><Link href={routePath('app.home')}>{Global('breadcrumbs.home')}</Link></Breadcrumb>
                <Breadcrumb><Link href="/template">{Global('breadcrumbs.templates')}</Link></Breadcrumb>
                <Breadcrumb><Link href={`/template/${templateId}`}>{Global('breadcrumbs.editTemplate')}</Link></Breadcrumb>
                <Breadcrumb>{Global('breadcrumbs.selectQuestionType')}</Breadcrumb>
              </Breadcrumbs>
            }
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
            breadcrumbs={<TemplateQuestionBreadcrumbs templateId={templateId} sectionId={sectionId} Global={Global} />}
            backUrl={routePath('template.q.new', { templateId }, { section_id: sectionId, step: 1 })}
            successUrl={routePath('template.show', { templateId })}
            onSave={async (commonFields) => {
              const input = {
                templateId: Number(templateId),
                sectionId: Number(sectionId),
                displayOrder: getDisplayOrder(),
                isDirty: true,
                ...commonFields,
              };
              await addQuestionMutation({ variables: { input } });
            }}
            showTags={true}
          />
        </>
      )}
    </>
  );
}

export default QuestionTypeSelectPage;
