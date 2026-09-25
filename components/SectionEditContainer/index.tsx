import React, { useState, useEffect, useMemo } from 'react';
import { useTranslations } from 'next-intl';
import { useRouter } from '@/i18n/routing';
import { useQuery } from '@apollo/client/react';

import {
  SectionDocument,
  Question,
} from '@/generated/graphql';
import { useToast } from '@/context/ToastContext';
import SectionHeaderEdit from '@/components/SectionHeaderEdit';
import QuestionEditCard from '@/components/QuestionEditCard';
import AddQuestionButton from '@/components/AddQuestionButton';
import { updateQuestionDisplayOrderAction } from './actions';

interface SectionEditContainerProps {
  sectionId: number;
  templateId: string | number;
  displayOrder: number;
  setErrorMessages: React.Dispatch<React.SetStateAction<string[]>>;
  onMoveUp: (() => void) | undefined;
  onMoveDown: (() => void) | undefined;
}

const SectionEditContainer: React.FC<SectionEditContainerProps> = ({
  sectionId,
  templateId,
  displayOrder,
  setErrorMessages,
  onMoveUp,
  onMoveDown
}) => {
  const router = useRouter();
  const toastState = useToast();
  const t = useTranslations('Sections');
  const Global = useTranslations('Global');

  const { data, loading, error, refetch } = useQuery(SectionDocument, {
    variables: { sectionId: Number(sectionId) },
    fetchPolicy: 'network-only',
    notifyOnNetworkStatusChange: true,
  });

  // Local state for optimistic updates
  const [localQuestions, setLocalQuestions] = useState<Question[]>([]);
  const [isReordering, setIsReordering] = useState(false);

  // Added for accessibility
  const [announcement, setAnnouncement] = useState('');

  // Memoize the sorted questions to prevent unnecessary re-renders
  const sortedQuestionsFromData = useMemo(() => {
    if (!data?.section?.questions) return [];
    return [...data.section.questions].sort((a, b) => a.displayOrder! - b.displayOrder!);
  }, [data?.section?.questions]);

  // Update local questions when data changes
  useEffect(() => {
    if (sortedQuestionsFromData.length > 0) {
      setLocalQuestions(sortedQuestionsFromData);
    }
  }, [sortedQuestionsFromData]);

  const sortQuestions = (questions: Question[]) => {
    return [...questions].sort((a, b) => (a.displayOrder!) - (b.displayOrder!));
  };

  const validateQuestionMove = (questionId: number, newDisplayOrder: number): { isValid: boolean, message?: string } => {
    const currentQuestion = localQuestions.find(q => q.id === questionId);

    // If current question doesn't exist in localQuestions
    if (!currentQuestion || currentQuestion.displayOrder == null) {
      const errorMsg = t('messages.errors.updateDisplayOrderError');
      return { isValid: false, message: errorMsg }
    }

    // If new display order is zero
    const maxDisplayOrder = Math.max(...localQuestions.map(s => s.displayOrder!));
    if (newDisplayOrder < 1) {
      const errorMsg = t('messages.errors.displayOrderAlreadyAtTop');
      return { isValid: false, message: errorMsg }
    }

    // If new display order exceeds max number of questions
    if (newDisplayOrder > maxDisplayOrder) {
      const errorMsg = t('messages.errors.cannotMoveFurtherDown');
      return { isValid: false, message: errorMsg }
    }

    // If new display order is same as current one
    if (currentQuestion.displayOrder === newDisplayOrder) {
      const errorMsg = t('messages.errors.cannotMoveFurtherUpOrDown');
      return { isValid: false, message: errorMsg }
    }

    return { isValid: true };
  };

  // Optimistic update function
  const updateLocalQuestionOrder = (questionId: number, newDisplayOrder: number) => {
    setLocalQuestions(prevQuestions => {
      const updatedQuestions = prevQuestions.map(question => {
        if (question.id === questionId) {
          return { ...question, displayOrder: newDisplayOrder };
        }
        // Adjust other questions' display orders
        if (question.displayOrder != null) {
          const currentOrder = question.displayOrder;
          const oldOrder = prevQuestions.find(q => q.id === questionId)?.displayOrder || 0;

          if (newDisplayOrder > oldOrder) {
            // Moving down: shift questions up
            if (currentOrder > oldOrder && currentOrder <= newDisplayOrder) {
              return { ...question, displayOrder: currentOrder - 1 };
            }
          } else {
            // Moving up: shift questions down  
            if (currentOrder >= newDisplayOrder && currentOrder < oldOrder) {
              return { ...question, displayOrder: currentOrder + 1 };
            }
          }
        }
        return question;
      });

      return sortQuestions(updatedQuestions);
    });
  };


  // Call Server Action updateQuestionDisplayOrder
  const updateDisplayOrder = async (questionId: number, newDisplayOrder: number) => {

    // Don't need a try-catch block here, as the error is handled in the server action
    const response = await updateQuestionDisplayOrderAction({
      questionId,
      newDisplayOrder
    });

    if (response.redirect) {
      router.push(response.redirect);
    }

    return {
      success: response.success,
      errors: response.errors,
      data: response.data,
    };
  }

  const handleDisplayOrderChange = async (questionId: number, newDisplayOrder: number) => {
    // Remove all current errors
    setErrorMessages([]);

    if (isReordering) return; // Prevent concurrent operations

    const { isValid, message } = validateQuestionMove(questionId, newDisplayOrder);
    if (!isValid && message) {
      // Deliver toast error messages
      toastState.add(message, { type: 'error' });
      return;
    }

    // First, optimistically update the UI immediately for smoother reshuffling
    updateLocalQuestionOrder(questionId, newDisplayOrder);
    setIsReordering(true);

    try {
      const result = await updateDisplayOrder(
        questionId,
        newDisplayOrder
      );

      if (!result.success) {
        // Revert optimistic update on failure
        await refetch();
        const errors = result.errors;

        //Check if errors is an array or an object
        if (Array.isArray(errors)) {
          if (setErrorMessages) {
            setErrorMessages(errors.length > 0 ? errors : [Global('messaging.somethingWentWrong')])
          }
        }
      } else if (result.data?.errors?.general) {
        // Revert on server errors
        await refetch();
        setErrorMessages(prev => [...prev, result.data?.errors?.general || t('messages.errors.updateQuestionOrder')]);
      }

      // Scroll user to the reordered section
      const focusedElement = document.activeElement;

      // Check if an element is actually focused
      if (focusedElement) {
        // Scroll the focused element into view
        focusedElement.scrollIntoView({
          behavior: 'smooth',
          block: 'center',
          inline: 'nearest'
        });
      }

      // After successful update
      const message = t('messages.questionMoved', { displayOrder: newDisplayOrder })
      setAnnouncement(message);
    } catch {
      // Revert optimistic update on network error
      await refetch();
      setErrorMessages(prev => [...prev, t('messages.errors.updateQuestionOrder')]);
    } finally {
      setIsReordering(false);
    }
  }

  if (loading) return <div>Loading section...</div>;
  if (error || !data?.section) return <div>{t('messages.errors.failedToLoadSection')}</div>;

  const section = data.section!;

  return (
    <div role="list" aria-label="Questions list" style={{ marginBottom: '40px' }}>
      <div role="listitem">
        <SectionHeaderEdit
          key={section.id}
          sectionNumber={displayOrder}
          title={section.name}
          editUrl={`/template/${templateId}/section/${section.id}`}
          onMoveUp={onMoveUp}
          onMoveDown={onMoveDown}
        />
      </div>
      {localQuestions.map((question: Question) => (
        <div key={question.id} role="listitem">
          <QuestionEditCard
            key={question.id}
            id={question.id ? question.id.toString() : ''}
            text={question.questionText || ''}
            link={`/template/${templateId}/q/${question.id}`}
            displayOrder={Number(question.displayOrder)}
            handleDisplayOrderChange={handleDisplayOrderChange}
          />
        </div>
      ))}
      <div role="listitem">
        <AddQuestionButton href={`/template/${templateId}/q/new?section_id=${section.id}`} />
      </div>
      <div aria-live="polite" aria-atomic="true" className="hidden-accessibly">
        {announcement}
      </div>
    </div>
  );
};

export default SectionEditContainer;