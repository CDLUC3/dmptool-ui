import React, { useState, useEffect, useMemo } from 'react';
import { useTranslations } from 'next-intl';

import { useToast } from '@/context/ToastContext';
import SectionHeaderEdit from '@/components/SectionHeaderEdit';
import AddQuestionButton from '@/components/AddQuestionButton';

// GraphQL
import { useMutation } from '@apollo/client/react';

import {
  CustomizableObjectOwnership,
  MoveCustomQuestionDocument,
  SectionCustomizationOverview,
  QuestionCustomizationOverview,
  MoveCustomQuestionDirection
} from '@/generated/graphql';
import CustomizedQuestionEdit from '../CustomizedQuestionEdit';


interface CustomizedSectionEditProps {
  section: SectionCustomizationOverview;
  displayOrder: number;
  templateCustomizationId: string | number;
  setErrorMessages: React.Dispatch<React.SetStateAction<string[]>>;
  refetch: () => Promise<unknown>;
  onMoveUp?: () => void;
  onMoveDown?: () => void;
}

const CustomizedSectionEdit: React.FC<CustomizedSectionEditProps> = ({
  section,
  displayOrder,
  templateCustomizationId,
  setErrorMessages,
  refetch,
  onMoveUp,
  onMoveDown,
}) => {

  const toastState = useToast();
  const t = useTranslations('Sections');

  // Local state for optimistic updates
  const [localQuestions, setLocalQuestions] = useState<QuestionCustomizationOverview[]>([]);
  const [isReordering, setIsReordering] = useState(false);

  // Added for accessibility
  const [announcement, setAnnouncement] = useState('');

  // Check if the section is a base section (which cannot be edited or reordered)
  const isBaseSection = section.sectionType === 'BASE';

  const [moveCustomQuestionMutation] = useMutation(MoveCustomQuestionDocument);

  // Memoize the sorted questions to prevent unnecessary re-renders
  const sortedQuestionsFromData = useMemo(() => {
    if (!section?.questions) return [];
    return [...section.questions].sort((a, b) => a.displayOrder! - b.displayOrder!);
  }, [section?.questions]);

  // Update local questions when data changes
  useEffect(() => {
    if (sortedQuestionsFromData.length > 0) {
      setLocalQuestions(sortedQuestionsFromData);
    }
  }, [sortedQuestionsFromData]);

  // Direction-based validation matching the section pattern
  const validateQuestionMove = (questionId: number, direction: 'up' | 'down'): { isValid: boolean; message?: string } => {
    const sorted = [...localQuestions].sort((a, b) => a.displayOrder! - b.displayOrder!);
    const index = sorted.findIndex(q => q.id === questionId);

    if (index === -1) {
      return { isValid: false, message: t('messages.errors.updateDisplayOrderError') };
    }
    if (direction === 'up' && index === 0) {
      return { isValid: false, message: t('messages.errors.displayOrderAlreadyAtTop') };
    }
    if (direction === 'down' && index === sorted.length - 1) {
      return { isValid: false, message: t('messages.errors.cannotMoveFurtherDown') };
    }
    return { isValid: true };
  };

  // Returns the question this question should be pinned AFTER
  const getQuestionAnchor = (
    questions: QuestionCustomizationOverview[],
    questionId: number,
    direction: 'up' | 'down'
  ): { pinnedQuestionId: number | null; pinnedQuestionType: CustomizableObjectOwnership | null } => {
    const sorted = [...questions].sort((a, b) => a.displayOrder! - b.displayOrder!);
    const currentIndex = sorted.findIndex(q => q.id === questionId);

    if (direction === 'up') {
      // Pin after the question two above, or null to become first
      const anchor = sorted[currentIndex - 2] ?? null;
      return {
        pinnedQuestionId: anchor?.id ?? null,
        pinnedQuestionType: anchor ? anchor.questionType as CustomizableObjectOwnership : null,
      };
    } else {
      // Pin after the question currently below
      const anchor = sorted[currentIndex + 1] ?? null;
      return {
        pinnedQuestionId: anchor?.id ?? null,
        pinnedQuestionType: anchor ? anchor.questionType as CustomizableObjectOwnership : null,
      };
    }
  };

  // Swap-based optimistic update matching the section pattern
  const updateLocalQuestionOrder = (questionId: number, direction: 'up' | 'down') => {
    setLocalQuestions(prevQuestions => {
      const sorted = [...prevQuestions].sort((a, b) => a.displayOrder! - b.displayOrder!);
      const index = sorted.findIndex(q => q.id === questionId);
      const swapIndex = direction === 'up' ? index - 1 : index + 1;

      if (swapIndex < 0 || swapIndex >= sorted.length) return prevQuestions;

      const updated = [...sorted];
      const temp = updated[index].displayOrder;
      updated[index] = { ...updated[index], displayOrder: updated[swapIndex].displayOrder };
      updated[swapIndex] = { ...updated[swapIndex], displayOrder: temp };

      return updated.sort((a, b) => a.displayOrder! - b.displayOrder!);
    });
  };

  // Handler for when a question's display order is changed (moved up or down)
  const handleDisplayOrderChange = async (questionId: number, newDisplayOrder: number) => {
    setErrorMessages([]);
    if (isReordering) return;

    const currentQuestion = localQuestions.find(q => q.id === questionId);
    const direction: 'up' | 'down' =
      newDisplayOrder > (currentQuestion?.displayOrder ?? 0) ? 'down' : 'up';

    const { isValid, message } = validateQuestionMove(questionId, direction);
    if (!isValid && message) {
      toastState.add(message, { type: 'error' });
      return;
    }

    const previousQuestions = [...localQuestions];
    const { pinnedQuestionId, pinnedQuestionType } = getQuestionAnchor(localQuestions, questionId, direction);

    updateLocalQuestionOrder(questionId, direction);
    setIsReordering(true);

    try {
      const response = await moveCustomQuestionMutation({
        variables: {
          input: {
            customQuestionId: questionId,
            sectionId: section.id,
            sectionType: section.sectionType as CustomizableObjectOwnership,
            pinnedQuestionId,
            pinnedQuestionType,
            direction: direction.toUpperCase() as MoveCustomQuestionDirection.Up | MoveCustomQuestionDirection.Down,
          },
        },
      });

      const result = response?.data?.moveCustomQuestion;

      if (!result || result.errors?.general) {
        setLocalQuestions(previousQuestions);
        setErrorMessages(prev => [
          ...prev,
          result?.errors?.general || t('messages.errors.updateQuestionOrder'),
        ]);
      } else {
        setAnnouncement(t('messages.questionMoved', { displayOrder: newDisplayOrder }));
        // Refetch so that "Publish changes" button displays correctly based on whether there are unpublished changes after the move
        await refetch();
      }
    } catch {
      setLocalQuestions(previousQuestions);
      setErrorMessages(prev => [...prev, t('messages.errors.updateQuestionOrder')]);
    } finally {
      setIsReordering(false);
    }
  };

  const sectionAuthorType = section.sectionType === "BASE" ? "funder" : "organization";

  // Construct the edit URL based on section type
  const editUrl = section.sectionType === "CUSTOM"
    ? `/template/customizations/${templateCustomizationId}/customSection/${section.id}`// Custom Section
    : `/template/customizations/${templateCustomizationId}/section/${section.id}`; // Section Customization    

  return (
    <>
      <div role="list" aria-label="Questions list" style={{ marginBottom: '40px' }}>
        <div role="listitem">
          {/** If section.sectionType is "CUSTOM" we want to take user to custom section page */}
          <SectionHeaderEdit
            sectionNumber={displayOrder + 1} // fix 0-based offset for display
            title={section.name}
            editUrl={editUrl}
            sectionAuthorType={sectionAuthorType}
            onMoveUp={isBaseSection ? undefined : onMoveUp}
            onMoveDown={isBaseSection ? undefined : onMoveDown}
            isCustomizationTemplate={true}
          />
        </div>
        {localQuestions.map((question: QuestionCustomizationOverview) => (
          <div key={question.id} role="listitem">
            <CustomizedQuestionEdit
              id={question.id.toString()}
              text={question.questionText ?? ''}
              link={
                question.questionType === 'BASE'
                  ? `/template/customizations/${templateCustomizationId}/q/${question.id}`
                  : `/template/customizations/${templateCustomizationId}/customQuestion/${question.id}`
              }
              displayOrder={Number(question.displayOrder)}
              questionType={question.questionType as 'BASE' | 'CUSTOM'}
              hasCustomGuidance={question.hasCustomGuidance || false}
              hasCustomSampleAnswer={question.hasCustomSampleAnswer || false}
              handleDisplayOrderChange={handleDisplayOrderChange}
            />
          </div>
        ))}
        <div role="listitem">
          <AddQuestionButton href={`/template/customizations/${templateCustomizationId}/q/new?section_id=${section.id}`} />
        </div>
      </div>
      <div aria-live="polite" aria-atomic="true" className="hidden-accessibly">
        {announcement}
      </div>
    </>
  );
};

export default CustomizedSectionEdit;