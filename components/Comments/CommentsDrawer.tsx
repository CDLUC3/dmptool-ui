'use client';

import React, { useState } from 'react';
import {
  Button,
  Form,
  Label,
  TextArea,
  TextField
} from "react-aria-components";

import {
  MeQuery
} from '@/generated/graphql';
import styles from './comments.module.scss';
import { useTranslations } from "next-intl";
import { DrawerPanel } from "@/components/Container";
import CommentList from './CommentList';
import { MergedComment } from '@/app/types';


export interface CommentsDrawerProps {
  isCommentsDrawerOpen: boolean;
  closeCurrentDrawer: () => void;
  openCommentsButtonRef: React.RefObject<HTMLButtonElement | null>;
  mergedComments: MergedComment[];
  editingCommentId: number | null | undefined;
  editingCommentText: string;
  setEditingCommentText: (text: string) => void;
  handleUpdateComment: (comment: MergedComment) => void;
  handleCancelEdit: () => void;
  handleEditComment: (comment: MergedComment) => void;
  handleDeleteComment: (comment: MergedComment) => void;
  me: MeQuery | null | undefined;
  planOwners: number[] | undefined | null;
  locale: string;
  commentsEndRef: React.RefObject<HTMLDivElement | null>;
  canAddComments: boolean;
  handleAddComment: (e: React.FormEvent<HTMLFormElement>, newComment: string) => Promise<void>;
}


const CommentsDrawer: React.FC<CommentsDrawerProps> = ({
  isCommentsDrawerOpen,
  closeCurrentDrawer,
  openCommentsButtonRef,
  mergedComments,
  editingCommentId,
  editingCommentText,
  setEditingCommentText,
  handleUpdateComment,
  handleCancelEdit,
  handleEditComment,
  handleDeleteComment,
  me,
  planOwners,
  locale,
  commentsEndRef,
  canAddComments,
  handleAddComment,
}) => {

  const [newCommentText, setNewCommentText] = useState<string>('');

  // Localization
  const PlanOverview = useTranslations('PlanOverview');
  const t = useTranslations('PlanOverviewQuestionPage');

  const addCommentHandler = async (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    if (!newCommentText.trim()) {
      return; // Prevent adding empty comments
    }
    await handleAddComment(e, newCommentText);
    setNewCommentText(''); // Clear the textarea after adding a comment
    // Scroll to bottom of comments list to focus on the newly added comment
    if (commentsEndRef.current) {
      commentsEndRef.current.scrollIntoView({ behavior: "smooth" });
    }

  };

  return (
    <>
      {/**Comments drawer */}
      <DrawerPanel
        isOpen={isCommentsDrawerOpen}
        onClose={closeCurrentDrawer}
        returnFocusRef={openCommentsButtonRef}
        className={styles.drawerPanelWrapper}
        title={PlanOverview('headings.comments')}
      >

        <div className={styles.commentsWrapper}>
          {/** Comments list */}
          <CommentList
            comments={mergedComments}
            editingCommentId={editingCommentId}
            editingCommentText={editingCommentText}
            me={me}
            planOwners={planOwners}
            handleEditComment={handleEditComment}
            handleUpdateComment={handleUpdateComment}
            handleCancelEdit={handleCancelEdit}
            handleDeleteComment={handleDeleteComment}
            locale={locale}
            setEditingCommentText={setEditingCommentText}
          />
          <div ref={commentsEndRef} />
        </div>


        {/**Can only add comments if the user has the correct permissions */}
        {canAddComments && (
          <div className={styles.leaveComment}>
            <h2>{PlanOverview('headings.leaveAComment')}</h2>
            <Form onSubmit={(e) => addCommentHandler(e)}>
              <TextField className={styles.commentTextField}>
                <Label htmlFor="new-comment-textarea">{me ? (`${me?.me?.givenName} ${me?.me?.surName}`) : ''}{' '}{`(${t('you')})`}</Label>
                <TextArea
                  onChange={e => setNewCommentText(e.target.value)}
                  value={newCommentText}
                  id="new-comment-textarea"
                  data-testid="new-comment-textarea"
                />
              </TextField>
              <div className={styles.addCommentButton}>
                <div>
                  <Button type="submit" className={`${styles.commentButton} small`}>{PlanOverview('buttons.comment')}</Button>
                </div>
                <p className="font-small">{PlanOverview('page.participantsWillBeNotified')}</p>
              </div>
            </Form>
          </div>
        )}

      </DrawerPanel>
    </>
  );
}

export default CommentsDrawer;