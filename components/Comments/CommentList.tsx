import React from 'react';
import {
  Button,
  TextArea,
} from "react-aria-components";
import { useTranslations } from "next-intl";
import { MergedComment } from '@/app/types';
import { MeQuery } from '@/generated/graphql';
import { formatRelativeFromTimestamp } from '@/utils/dateUtils';
import ExpandableContentSection from '@/components/ExpandableContentSection';

import styles from './comments.module.scss';


interface CommentListProps {
  comments: MergedComment[];
  editingCommentId: number | null | undefined;
  editingCommentText: string;
  me: MeQuery | null | undefined;
  planOwners: number[] | null | undefined;
  handleEditComment: (comment: MergedComment) => void;
  handleUpdateComment: (comment: MergedComment) => void;
  handleCancelEdit: () => void;
  handleDeleteComment: (comment: MergedComment) => void;
  locale: string;
  setEditingCommentText: (text: string) => void;
}

const CommentList = React.memo(function CommentList(props: CommentListProps) {
  const {
    comments,
    editingCommentId,
    editingCommentText,
    me,
    planOwners,
    handleEditComment,
    handleUpdateComment,
    handleCancelEdit,
    handleDeleteComment,
    locale,
    setEditingCommentText,
  } = props;


  // Localization
  const Global = useTranslations('Global');
  const t = useTranslations('PlanOverviewQuestionPage');


  const updateCommentHandler = (comment: MergedComment) => {
    if (!editingCommentText.trim()) {
      return; // Prevent saving empty comments
    }

    handleUpdateComment({
      ...comment,
      commentText: editingCommentText, // override with the edited version
    });
  };
  return (
    <>
      {comments?.map((comment, index) => {
        const formattedCreatedDate = comment.created
          ? formatRelativeFromTimestamp(comment.created, locale)
          : "";

        const isEditing = editingCommentId === comment.id;

        return (
          <div key={`${comment.type}-${comment.id}-${index}`} className={styles.comment}>
            <h4>
              {comment?.user?.givenName}{' '}{comment?.user?.surName}{' '}
              <span className={styles.deEmphasize}>
                {comment?.isFeedbackComment ? `(${t('admin')})` : ''}
              </span>
            </h4>
            <p className={`${styles.deEmphasize} ${styles.createdDate}`}>
              {formattedCreatedDate}{' '}
              {(comment.created !== comment.modified) ? `(${t('edited')})` : ''}
            </p>

            {/* Conditional rendering: textarea when editing, paragraph when not */}
            {isEditing ? (
              <TextArea
                value={editingCommentText}
                onChange={(e) => setEditingCommentText(e.target.value)}
                rows={3}
                ref={(el) => {
                  if (el) {
                    el.focus({ preventScroll: true }); {/**This is important: focus the text without scrolling. If we use autofocus, it will scroll the field behind the sticky Add Comment section */ }
                  }
                }}
              />
            ) : (
              <>
                {/**When comments are lengthy, this is a way we can set a character limit, and show the Expand/Collapse links */}
                <ExpandableContentSection
                  id={`comment-text-${index}`}
                  heading=""
                  expandLabel={Global('links.expand')}
                  summaryCharLimit={250}
                >
                  <p>{comment.commentText}</p>

                </ExpandableContentSection>
              </>
            )}

            <div className={styles.buttonGroup}>
              {isEditing ? (
                <>
                  <Button
                    className={`${styles.deEmphasize} link`}
                    type="button"
                    onPress={() => updateCommentHandler(comment)}
                  >
                    {Global('buttons.save')}
                  </Button>
                  <Button
                    className={`${styles.deEmphasize} link`}
                    type="button"
                    onPress={handleCancelEdit}
                  >
                    {Global('buttons.cancel')}
                  </Button>
                </>
              ) : (
                <>
                  {/**Only display edit button if it's the user's own comment */}
                  {comment?.user?.id === me?.me?.id && (
                    <Button
                      className={`${styles.deEmphasize} link`}
                      type="button"
                      onPress={() => handleEditComment(comment)}
                    >
                      {Global('buttons.edit')}
                    </Button>
                  )}

                  {/**Only display the delete button for the user who created the comment 
                   * or a project collaborator with role 'OWN' */}
                  {((comment?.user?.id === me?.me?.id) || planOwners?.includes(me?.me?.id as number)) && (
                    <Button
                      className={`${styles.deEmphasize} link`}
                      type="button"
                      onPress={() => handleDeleteComment(comment)}
                    >
                      {Global('buttons.delete')}
                    </Button>
                  )}

                </>
              )}
            </div>
          </div>
        );
      })}
    </>
  );
});

export default CommentList;