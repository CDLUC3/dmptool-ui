import type {
  PlanAuthoringModel,
  PlanComment,
  PlanGuidanceOrgOption,
  PlanGuidanceSource,
} from "./model";

export interface PlanAuthoringDataSource {
  getModel(): PlanAuthoringModel;
  saveAnswer(
    questionKeyValue: string,
    answerJson: unknown
  ): Promise<{ success: boolean; error?: string }>;
  loadGuidance(questionKeyValue: string): Promise<PlanGuidanceSource[]>;
  loadComments(questionKeyValue: string): Promise<PlanComment[]>;
  addComment(questionKeyValue: string, text: string): Promise<PlanComment>;
  updateComment(
    questionKeyValue: string,
    commentId: number,
    text: string
  ): Promise<PlanComment>;
  deleteComment(questionKeyValue: string, commentId: number): Promise<void>;
  searchGuidanceOrgs(term: string): Promise<PlanGuidanceOrgOption[]>;
  setSelectedGuidanceOrgs(orgIds: string[]): Promise<string[]>;
  subscribe(listener: () => void): () => void;
}
