import type { ApolloClient } from "@apollo/client";
import {
  AddAnswerCommentDocument,
  AddAnswerDocument,
  AddFeedbackCommentDocument,
  AddPlanGuidanceDocument,
  ManagedAffiliationsWithGuidanceDocument,
  MeDocument,
  PlanAuthoringDocument,
  RemoveAnswerCommentDocument,
  RemoveFeedbackCommentDocument,
  RemovePlanGuidanceDocument,
  UpdateAnswerCommentDocument,
  UpdateAnswerDocument,
  UpdateFeedbackCommentDocument,
} from "@/generated/graphql";
import type {
  PlanAuthoringDataSource,
  PlanAuthoringState,
  SaveAnswerResult,
} from "./dataSource";
import {
  computeProgress,
  questionKey,
  type PlanComment,
  type PlanQuestionDefinition,
} from "./model";
import {
  EMPTY_PLAN_AUTHORING_VIEWER,
  collectAnswerIds,
  collectCommentRefs,
  toPlanAuthoringModel,
  toPlanAuthoringViewer,
  toPlanComment,
  toStoredAnswerJson,
  type PlanAuthoringViewer,
  type PlanCommentRef,
} from "./toPlanAuthoringModel";

export interface PlanAuthoringDataSourceParams {
  client: ApolloClient;
  planId: number;
  locale: string;
}

const GUIDANCE_ORG_SEARCH_LIMIT = 20;

function errorMessage(error: unknown): string {
  return error instanceof Error ? error.message : String(error);
}

// Mutation payloads report field errors in `errors` rather than failing.
function fieldErrors(
  errors: Record<string, unknown> | null | undefined
): string[] {
  return Object.entries(errors ?? {})
    .filter(([field]) => field !== "__typename")
    .map(([, value]) => value)
    .filter((value): value is string => typeof value === "string" && value !== "");
}

function throwOnFieldErrors<T extends { errors?: Record<string, unknown> | null }>(
  payload: T | null | undefined
): T {
  if (!payload) {
    throw new Error("The server did not return a result.");
  }
  const messages = fieldErrors(payload.errors);
  if (messages.length > 0) {
    throw new Error(messages.join(" "));
  }
  return payload;
}

function answerTarget(planId: number, question: PlanQuestionDefinition) {
  const section = question.sectionIdentity;
  const identity = question.identity;
  return {
    planId,
    ...(section.kind === "base"
      ? { versionedSectionId: section.versionedSectionId }
      : { versionedCustomSectionId: section.customSectionId }),
    ...(identity.kind === "base"
      ? { versionedQuestionId: identity.versionedQuestionId }
      : { versionedCustomQuestionId: identity.customQuestionId }),
  };
}

export function createPlanAuthoringDataSource({
  client,
  planId,
  locale,
}: PlanAuthoringDataSourceParams): PlanAuthoringDataSource {
  let state: PlanAuthoringState = { status: "loading" };
  let viewer: PlanAuthoringViewer = EMPTY_PLAN_AUTHORING_VIEWER;
  let versionedTemplateId: number | null = null;
  let answerIds = new Map<string, number>();
  let commentRefs = new Map<string, Map<string, PlanCommentRef>>();
  let loadGeneration = 0;
  const listeners = new Set<() => void>();

  const setState = (next: PlanAuthoringState) => {
    state = next;
    listeners.forEach((listener) => listener());
  };

  const findQuestion = (questionKeyValue: string) =>
    state.status === "ready"
      ? state.model.sections
          .flatMap((section) => section.questions)
          .find((question) => questionKey(question.identity) === questionKeyValue)
      : undefined;

  const fetchPlan = async () => {
    const [planResult, meResult] = await Promise.all([
      client.query({
        query: PlanAuthoringDocument,
        variables: { planId },
        fetchPolicy: "network-only",
      }),
      client.query({ query: MeDocument, errorPolicy: "all" }),
    ]);
    const plan = planResult.data?.plan ?? null;
    return {
      plan,
      viewer: toPlanAuthoringViewer({ me: meResult.data?.me, plan, locale }),
    };
  };

  const load = () => {
    const generation = ++loadGeneration;
    fetchPlan()
      .then(({ plan, viewer: loadedViewer }) => {
        if (generation !== loadGeneration) {
          return;
        }
        if (!plan) {
          setState({ status: "error", message: "Plan not found." });
          return;
        }
        viewer = loadedViewer;
        versionedTemplateId = plan.versionedTemplate?.id ?? null;
        answerIds = collectAnswerIds(plan);
        commentRefs = collectCommentRefs(plan);
        setState({ status: "ready", model: toPlanAuthoringModel(plan, viewer) });
      })
      .catch((error: unknown) => {
        if (generation !== loadGeneration) {
          return;
        }
        console.error("Failed to load plan authoring data", error);
        setState({ status: "error", message: errorMessage(error) });
      });
  };

  load();

  const persistAnswer = async (
    questionKeyValue: string,
    question: PlanQuestionDefinition,
    answerJson: unknown
  ): Promise<SaveAnswerResult> => {
    const json = toStoredAnswerJson(question, answerJson);
    const answerId = answerIds.get(questionKeyValue);
    if (answerId != null) {
      const { data } = await client.mutate({
        mutation: UpdateAnswerDocument,
        variables: { answerId, json },
      });
      const messages = fieldErrors(data?.updateAnswer?.errors);
      return messages.length > 0 ? { kind: "invalid", messages } : { kind: "saved" };
    }
    const { data } = await client.mutate({
      mutation: AddAnswerDocument,
      variables: { ...answerTarget(planId, question), json },
    });
    const messages = fieldErrors(data?.addAnswer?.errors);
    if (messages.length > 0) {
      return { kind: "invalid", messages };
    }
    const newAnswerId = data?.addAnswer?.id;
    if (newAnswerId == null) {
      return { kind: "failed" };
    }
    answerIds.set(questionKeyValue, newAnswerId);
    return { kind: "saved" };
  };

  const replaceComments = (
    questionKeyValue: string,
    update: (comments: PlanComment[]) => PlanComment[]
  ) => {
    if (state.status !== "ready") {
      return;
    }
    const sections = state.model.sections.map((section) => ({
      ...section,
      questions: section.questions.map((item) =>
        questionKey(item.identity) === questionKeyValue
          ? { ...item, comments: update(item.comments) }
          : item
      ),
    }));
    setState({ status: "ready", model: { ...state.model, sections } });
  };

  // Replaces only guidance so unsaved answers and comment state survive.
  const refreshGuidance = async () => {
    const { plan, viewer: loadedViewer } = await fetchPlan();
    if (!plan || state.status !== "ready") {
      return;
    }
    viewer = loadedViewer;
    const fresh = toPlanAuthoringModel(plan, viewer);
    const freshSources = new Map(
      fresh.sections
        .flatMap((section) => section.questions)
        .map((question) => [questionKey(question.identity), question.guidanceSources])
    );
    const sections = state.model.sections.map((section) => ({
      ...section,
      questions: section.questions.map((question) => ({
        ...question,
        guidanceSources:
          freshSources.get(questionKey(question.identity)) ??
          question.guidanceSources,
      })),
    }));
    setState({
      status: "ready",
      model: {
        ...state.model,
        sections,
        availableGuidanceOrgs: fresh.availableGuidanceOrgs,
        selectedGuidanceOrgIds: fresh.selectedGuidanceOrgIds,
      },
    });
  };

  const requireCommentRef = (questionKeyValue: string, commentId: string) => {
    const ref = commentRefs.get(questionKeyValue)?.get(commentId);
    if (!ref) {
      throw new Error("Comment not found.");
    }
    return ref;
  };

  const createComment = async (answerId: number, text: string) => {
    const target = viewer.newCommentTarget;
    if (target.kind === "feedback") {
      const { data } = await client.mutate({
        mutation: AddFeedbackCommentDocument,
        variables: {
          planId,
          planFeedbackId: target.planFeedbackId,
          answerId,
          commentText: text,
        },
      });
      return { kind: target.kind, ...throwOnFieldErrors(data?.addFeedbackComment) };
    }
    const { data } = await client.mutate({
      mutation: AddAnswerCommentDocument,
      variables: { answerId, commentText: text },
    });
    return { kind: target.kind, ...throwOnFieldErrors(data?.addAnswerComment) };
  };

  return {
    getState() {
      return state;
    },

    reload() {
      setState({ status: "loading" });
      load();
    },

    async saveAnswer(questionKeyValue, answerJson) {
      const question = findQuestion(questionKeyValue);
      if (!question) {
        return { kind: "failed", message: "Question not found." };
      }

      let result: SaveAnswerResult;
      try {
        result = await persistAnswer(questionKeyValue, question, answerJson);
      } catch (error) {
        console.error("Failed to save plan answer", error);
        return { kind: "failed", message: errorMessage(error) };
      }

      if (result.kind !== "saved" || state.status !== "ready") {
        return result;
      }

      const sections = state.model.sections.map((section) => ({
        ...section,
        questions: section.questions.map((item) =>
          questionKey(item.identity) === questionKeyValue
            ? {
                ...item,
                answerJson,
                hasAnswer: answerJson != null && answerJson !== "",
                lastSavedAt: String(Date.now()),
              }
            : item
        ),
      }));
      setState({
        status: "ready",
        model: { ...state.model, sections, progress: computeProgress(sections) },
      });
      return result;
    },

    async loadGuidance(questionKeyValue) {
      return findQuestion(questionKeyValue)?.guidanceSources ?? [];
    },

    async loadComments(questionKeyValue) {
      return findQuestion(questionKeyValue)?.comments ?? [];
    },

    async addComment(questionKeyValue, text) {
      const answerId = answerIds.get(questionKeyValue);
      if (answerId == null) {
        throw new Error("Save an answer before commenting.");
      }
      const created = await createComment(answerId, text);
      if (created.id == null) {
        throw new Error("The server did not return the new comment.");
      }

      const comment = toPlanComment(
        created.kind,
        {
          id: created.id,
          authorId: viewer.currentUserId,
          authorName: viewer.currentUserName,
          // The comment mutations don't return created, so use the client's time.
          created: String(Date.now()),
          text: created.commentText ?? text,
        },
        viewer
      );
      const questionRefs =
        commentRefs.get(questionKeyValue) ?? new Map<string, PlanCommentRef>();
      questionRefs.set(
        comment.id,
        created.kind === "answer"
          ? { kind: "answer", answerId, answerCommentId: created.id }
          : { kind: "feedback", planFeedbackCommentId: created.id }
      );
      commentRefs.set(questionKeyValue, questionRefs);
      replaceComments(questionKeyValue, (comments) => [...comments, comment]);
      return comment;
    },

    async updateComment(questionKeyValue, commentId, text) {
      const ref = requireCommentRef(questionKeyValue, commentId);
      const updatedText =
        ref.kind === "answer"
          ? throwOnFieldErrors(
              (
                await client.mutate({
                  mutation: UpdateAnswerCommentDocument,
                  variables: {
                    answerId: ref.answerId,
                    answerCommentId: ref.answerCommentId,
                    commentText: text,
                  },
                })
              ).data?.updateAnswerComment
            ).commentText
          : throwOnFieldErrors(
              (
                await client.mutate({
                  mutation: UpdateFeedbackCommentDocument,
                  variables: {
                    planId,
                    planFeedbackCommentId: ref.planFeedbackCommentId,
                    commentText: text,
                  },
                })
              ).data?.updateFeedbackComment
            ).commentText;
      const existing = findQuestion(questionKeyValue)?.comments.find(
        (comment) => comment.id === commentId
      );
      if (!existing) {
        throw new Error("Comment not found.");
      }

      const updated: PlanComment = {
        ...existing,
        text: updatedText ?? text,
        isEdited: true,
      };
      replaceComments(questionKeyValue, (comments) =>
        comments.map((comment) => (comment.id === commentId ? updated : comment))
      );
      return updated;
    },

    async deleteComment(questionKeyValue, commentId) {
      const ref = requireCommentRef(questionKeyValue, commentId);
      if (ref.kind === "answer") {
        const { data } = await client.mutate({
          mutation: RemoveAnswerCommentDocument,
          variables: { answerId: ref.answerId, answerCommentId: ref.answerCommentId },
        });
        throwOnFieldErrors(data?.removeAnswerComment);
      } else {
        const { data } = await client.mutate({
          mutation: RemoveFeedbackCommentDocument,
          variables: { planId, planFeedbackCommentId: ref.planFeedbackCommentId },
        });
        throwOnFieldErrors(data?.removeFeedbackComment);
      }
      commentRefs.get(questionKeyValue)?.delete(commentId);
      replaceComments(questionKeyValue, (comments) =>
        comments.filter((comment) => comment.id !== commentId)
      );
    },

    async searchGuidanceOrgs(term) {
      const name = term.trim().toLowerCase();
      if (!name || versionedTemplateId == null) {
        return [];
      }
      const { data } = await client.query({
        query: ManagedAffiliationsWithGuidanceDocument,
        variables: {
          name,
          versionedTemplateId,
          paginationOptions: { type: "CURSOR", limit: GUIDANCE_ORG_SEARCH_LIMIT },
        },
      });
      return (data?.managedAffiliationsWithGuidance?.items ?? [])
        .filter((item) => item != null)
        .map((item) => ({
          id: item.uri,
          label: item.displayName,
          shortName:
            item.displayAbbreviation || item.acronyms?.[0] || item.displayName,
          orgURI: item.uri,
        }));
    },

    // Org ids are affiliation URIs, which is what add/removePlanGuidance take.
    async setSelectedGuidanceOrgs(orgIds) {
      if (state.status !== "ready") {
        return [];
      }
      const current = new Set(state.model.selectedGuidanceOrgIds);
      const next = new Set(orgIds);
      const results = await Promise.allSettled([
        ...[...next]
          .filter((affiliationId) => !current.has(affiliationId))
          .map((affiliationId) =>
            client.mutate({
              mutation: AddPlanGuidanceDocument,
              variables: { planId, affiliationId },
            })
          ),
        ...[...current]
          .filter((affiliationId) => !next.has(affiliationId))
          .map((affiliationId) =>
            client.mutate({
              mutation: RemovePlanGuidanceDocument,
              variables: { planId, affiliationId },
            })
          ),
      ]);
      // Refresh even after a partial failure so the plan shows what was saved.
      await refreshGuidance();
      const failure = results.find((result) => result.status === "rejected");
      if (failure) {
        console.error("Failed to update plan guidance sources", failure.reason);
        throw failure.reason;
      }
      return state.status === "ready" ? state.model.selectedGuidanceOrgIds : [];
    },

    subscribe(listener) {
      listeners.add(listener);
      return () => {
        listeners.delete(listener);
      };
    },
  };
}
