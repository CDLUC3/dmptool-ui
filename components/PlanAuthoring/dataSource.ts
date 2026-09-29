import type {
  PlanAuthoringModel,
  PlanComment,
  PlanGuidanceOrgOption,
  PlanGuidanceSource,
} from "./model";

export type PlanAuthoringState =
  | { status: "loading" }
  | { status: "error"; message: string }
  | { status: "ready"; model: PlanAuthoringModel };

export type SaveAnswerResult =
  | { kind: "saved" }
  | { kind: "invalid"; messages: string[] }
  | { kind: "failed"; message?: string };

export interface PlanAuthoringDataSource {
  getState(): PlanAuthoringState;
  reload(): void;
  saveAnswer(
    questionKeyValue: string,
    answerJson: unknown
  ): Promise<SaveAnswerResult>;
  loadGuidance(questionKeyValue: string): Promise<PlanGuidanceSource[]>;
  loadComments(questionKeyValue: string): Promise<PlanComment[]>;
  addComment(questionKeyValue: string, text: string): Promise<PlanComment>;
  updateComment(
    questionKeyValue: string,
    commentId: string,
    text: string
  ): Promise<PlanComment>;
  deleteComment(questionKeyValue: string, commentId: string): Promise<void>;
  searchGuidanceOrgs(term: string): Promise<PlanGuidanceOrgOption[]>;
  setSelectedGuidanceOrgs(orgIds: string[]): Promise<string[]>;
  subscribe(listener: () => void): () => void;
}
