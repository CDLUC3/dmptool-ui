import {
  ApolloClient,
  ApolloLink,
  InMemoryCache,
  Observable,
} from "@apollo/client";
import {
  Kind,
  type DocumentNode,
  type OperationDefinitionNode,
  type SelectionSetNode,
} from "graphql";
import { GuidanceSourceType } from "@/generated/graphql";
import type {
  PlanAuthoringAnswer,
  PlanAuthoringMe,
  PlanAuthoringPlan,
  PlanAuthoringQuestion,
} from "../toPlanAuthoringModel";
import { MOCK_GUIDANCE_ORGS, mockMe, mockPlan } from "./mockPlan";

export const MOCK_LOAD_ERROR = "Simulated load failure.";
export const MOCK_SAVE_ERROR = "Simulated save failure. Try again.";
export const MOCK_COMMENTS_ERROR = "Simulated comments failure.";
export const MOCK_GUIDANCE_ERROR = "Simulated guidance failure.";

export interface FakeGuidanceOrg {
  uri: string;
  displayName: string;
  displayAbbreviation?: string;
  /** Added to every base question when the org is selected for the plan. */
  guidanceText: string;
}

export interface FakePlanAuthoringOptions {
  plan?: PlanAuthoringPlan | null;
  me?: PlanAuthoringMe;
  guidanceOrgs?: FakeGuidanceOrg[];
  delayMs?: number;
  /** The PlanAuthoring query always returns a GraphQL error. */
  loadFails?: boolean;
  /** The first AddAnswer/UpdateAnswer returns a GraphQL error. */
  failSaveOnce?: boolean;
  commentsFail?: boolean;
  guidanceFail?: boolean;
}

type Variables = Record<string, unknown>;
type Resolver = (variables: Variables) => Record<string, unknown>;

class FakeGraphQLError extends Error {}

// GraphQL responses are plain JSON; jsdom has no structuredClone.
function cloneJson<T>(value: T): T {
  return value == null ? value : JSON.parse(JSON.stringify(value));
}

// A real server returns every selected field (null when absent) and drops
// unselected ones. Doing the same keeps the Apollo cache from warning about
// missing fields.
function completeResult(value: unknown, selectionSet?: SelectionSetNode): unknown {
  if (value == null) {
    return null;
  }
  if (!selectionSet) {
    return value;
  }
  if (Array.isArray(value)) {
    return value.map((item) => completeResult(item, selectionSet));
  }
  const record = value as Record<string, unknown>;
  const result: Record<string, unknown> = {};
  selectionSet.selections.forEach((selection) => {
    if (selection.kind !== Kind.FIELD) {
      return;
    }
    const key = selection.alias?.value ?? selection.name.value;
    if (key === "__typename" && record[key] === undefined) {
      return;
    }
    result[key] = completeResult(record[key], selection.selectionSet);
  });
  return result;
}

function operationSelectionSet(query: DocumentNode): SelectionSetNode | undefined {
  return query.definitions.find(
    (definition): definition is OperationDefinitionNode =>
      definition.kind === Kind.OPERATION_DEFINITION
  )?.selectionSet;
}

/**
 * An ApolloClient whose link answers the plan authoring operations from an
 * in-memory copy of `plan`, so mutations are visible to later queries.
 */
export function createFakePlanAuthoringClient(
  options: FakePlanAuthoringOptions = {}
): ApolloClient {
  const plan: PlanAuthoringPlan | null = cloneJson(
    options.plan === undefined ? mockPlan : options.plan
  );
  const me = options.me === undefined ? mockMe : options.me;
  const guidanceOrgs = options.guidanceOrgs ?? MOCK_GUIDANCE_ORGS;
  const delayMs = options.delayMs ?? 0;
  let failSaveOnce = Boolean(options.failSaveOnce);
  let nextId = 10_000;

  const questions = (): PlanAuthoringQuestion[] =>
    (plan?.sections ?? []).flatMap((section) => section.questions ?? []);
  const answers = (): PlanAuthoringAnswer[] =>
    questions().flatMap((question) => (question.answer ? [question.answer] : []));

  const fail = (message: string): never => {
    throw new FakeGraphQLError(message);
  };
  const requireAnswer = (answerId: unknown) =>
    answers().find((answer) => answer.id === answerId) ?? fail("Answer not found.");
  const assertSave = () => {
    if (failSaveOnce) {
      failSaveOnce = false;
      fail(MOCK_SAVE_ERROR);
    }
  };
  const assertComments = () => {
    if (options.commentsFail) {
      fail(MOCK_COMMENTS_ERROR);
    }
  };
  const assertGuidance = () => {
    if (options.guidanceFail) {
      fail(MOCK_GUIDANCE_ERROR);
    }
  };
  const commentUser = () => ({ id: me?.id, givenName: me?.givenName, surName: me?.surName });
  const newComment = (commentText: unknown) => {
    const now = String(Date.now());
    return {
      id: nextId++,
      commentText: commentText as string,
      created: now,
      modified: now,
      user: commentUser(),
    };
  };
  // modified must differ from created, even when both land in the same millisecond.
  const editComment = (
    comment: { commentText?: string | null; created?: string | null; modified?: string | null },
    commentText: unknown
  ) => {
    comment.commentText = commentText as string;
    comment.modified = String(Math.max(Date.now(), Number(comment.created ?? 0) + 1));
  };

  const findComment = (answerId: unknown, commentId: unknown) =>
    requireAnswer(answerId).comments?.find((comment) => comment.id === commentId) ??
    fail("Comment not found.");
  const findFeedbackComment = (commentId: unknown) =>
    answers()
      .flatMap((answer) => answer.feedbackComments ?? [])
      .find((comment) => comment.id === commentId) ?? fail("Comment not found.");

  const resolvers: Record<string, Resolver> = {
    PlanAuthoring: () => {
      if (options.loadFails) {
        fail(MOCK_LOAD_ERROR);
      }
      return { plan: cloneJson(plan) };
    },

    Me: () => ({ me: cloneJson(me) }),

    AddAnswer: ({ versionedQuestionId, versionedCustomQuestionId, json }) => {
      assertSave();
      const question =
        questions().find((item) =>
          versionedCustomQuestionId != null
            ? item.customQuestionId === versionedCustomQuestionId
            : item.versionedQuestionId === versionedQuestionId
        ) ?? fail("Question not found.");
      const answer: PlanAuthoringAnswer = {
        id: nextId++,
        json: json as string,
        modified: String(Date.now()),
        comments: [],
        feedbackComments: [],
      };
      question.answer = answer;
      question.hasAnswer = true;
      return { addAnswer: { id: answer.id, json: answer.json, modified: answer.modified } };
    },

    UpdateAnswer: ({ answerId, json }) => {
      assertSave();
      const answer = requireAnswer(answerId);
      answer.json = json as string;
      answer.modified = String(Date.now());
      return {
        updateAnswer: {
          errors: null,
          id: answer.id,
          json: answer.json,
          modified: answer.modified,
          versionedQuestion: null,
        },
      };
    },

    AddAnswerComment: ({ answerId, commentText }) => {
      assertComments();
      const comment = newComment(commentText);
      const answer = requireAnswer(answerId);
      answer.comments = [...(answer.comments ?? []), comment];
      return { addAnswerComment: { id: comment.id, answerId, commentText, errors: null } };
    },

    UpdateAnswerComment: ({ answerId, answerCommentId, commentText }) => {
      assertComments();
      editComment(findComment(answerId, answerCommentId), commentText);
      return { updateAnswerComment: { id: answerCommentId, answerId, commentText, errors: null } };
    },

    RemoveAnswerComment: ({ answerId, answerCommentId }) => {
      assertComments();
      const answer = requireAnswer(answerId);
      answer.comments = (answer.comments ?? []).filter(
        (comment) => comment.id !== answerCommentId
      );
      return { removeAnswerComment: { id: answerCommentId, answerId, commentText: null, errors: null } };
    },

    AddFeedbackComment: ({ answerId, commentText }) => {
      assertComments();
      const comment = newComment(commentText);
      const answer = requireAnswer(answerId);
      answer.feedbackComments = [...(answer.feedbackComments ?? []), comment];
      return { addFeedbackComment: { id: comment.id, answerId, commentText, errors: null } };
    },

    UpdateFeedbackComment: ({ planFeedbackCommentId, commentText }) => {
      assertComments();
      editComment(findFeedbackComment(planFeedbackCommentId), commentText);
      return {
        updateFeedbackComment: { id: planFeedbackCommentId, answerId: null, commentText, errors: null },
      };
    },

    RemoveFeedbackComment: ({ planFeedbackCommentId }) => {
      assertComments();
      answers().forEach((answer) => {
        answer.feedbackComments = (answer.feedbackComments ?? []).filter(
          (comment) => comment.id !== planFeedbackCommentId
        );
      });
      return {
        removeFeedbackComment: { id: planFeedbackCommentId, answerId: null, commentText: null, errors: null },
      };
    },

    ManagedAffiliationsWithGuidance: ({ name }) => {
      assertGuidance();
      const term = String(name ?? "").toLowerCase();
      const items = guidanceOrgs
        .filter(
          (org) =>
            org.displayName.toLowerCase().includes(term) ||
            org.displayAbbreviation?.toLowerCase().includes(term)
        )
        .map((org) => ({
          id: null,
          funder: false,
          displayName: org.displayName,
          displayAbbreviation: org.displayAbbreviation ?? null,
          uri: org.uri,
          acronyms: org.displayAbbreviation ? [org.displayAbbreviation] : [],
        }));
      return {
        managedAffiliationsWithGuidance: {
          items,
          limit: items.length,
          totalCount: items.length,
          hasNextPage: false,
          hasPreviousPage: false,
          nextCursor: null,
        },
      };
    },

    AddPlanGuidance: ({ affiliationId }) => {
      assertGuidance();
      const org =
        guidanceOrgs.find((item) => item.uri === affiliationId) ??
        fail("Affiliation not found.");
      questions()
        .filter((question) => question.questionType === "BASE")
        .forEach((question) => {
          const sources = question.guidanceSources ?? [];
          if (sources.some((source) => source.orgURI === org.uri)) {
            return;
          }
          question.guidanceSources = [
            ...sources,
            {
              id: `affiliation-${org.uri}`,
              type: GuidanceSourceType.UserSelected,
              label: org.displayName,
              shortName: org.displayAbbreviation ?? org.displayName,
              orgURI: org.uri,
              items: [{ id: null, title: null, guidanceText: org.guidanceText }],
            },
          ];
        });
      return { addPlanGuidance: { id: nextId++, planId: plan?.id, affiliationId } };
    },

    RemovePlanGuidance: ({ affiliationId }) => {
      assertGuidance();
      questions().forEach((question) => {
        question.guidanceSources = (question.guidanceSources ?? []).filter(
          (source) => source.orgURI !== affiliationId
        );
      });
      return {
        removePlanGuidance: { id: nextId++, planId: plan?.id, userId: me?.id, affiliationId },
      };
    },
  };

  const link = new ApolloLink(
    (operation) =>
      new Observable((observer) => {
        const timer = setTimeout(() => {
          const resolve = resolvers[operation.operationName ?? ""];
          try {
            if (!resolve) {
              fail(`The fake plan authoring API has no ${operation.operationName} operation.`);
            }
            const data = resolve(operation.variables);
            observer.next({
              data: completeResult(data, operationSelectionSet(operation.query)) as typeof data,
            });
          } catch (error) {
            if (!(error instanceof FakeGraphQLError)) {
              observer.error(error);
              return;
            }
            observer.next({ data: null, errors: [{ message: error.message }] });
          }
          observer.complete();
        }, delayMs);
        return () => clearTimeout(timer);
      })
  );

  return new ApolloClient({
    cache: new InMemoryCache(),
    link,
    defaultOptions: {
      query: { fetchPolicy: "no-cache" },
      mutate: { fetchPolicy: "no-cache" },
    },
  });
}
