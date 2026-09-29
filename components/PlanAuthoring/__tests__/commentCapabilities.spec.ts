import {
  deriveCommentActions,
  deriveCommentCapabilities,
  type CommentPermissionFacts,
} from "../commentCapabilities";
import { makeCommentPermissionPlan } from "../mocks";

const UCOP = "https://ror.org/ucop";
const CDL = "https://ror.org/cdl";

const CLOSED_ROUNDS = [{ id: 30, completed: "1751929006000" }];

function capabilities(
  me: CommentPermissionFacts["me"],
  plan: Partial<CommentPermissionFacts["plan"]> = {}
) {
  return deriveCommentCapabilities({ me, plan: makeCommentPermissionPlan(plan) });
}

describe("deriveCommentCapabilities canComment", () => {
  it.each<[string, CommentPermissionFacts["me"], Partial<CommentPermissionFacts["plan"]>, boolean]>([
    ["an EDIT collaborator", { id: 2, role: "RESEARCHER" }, {}, true],
    ["a COMMENT collaborator", { id: 6, role: "RESEARCHER" }, {}, true],
    ["the plan creator who is not a collaborator", { id: 1, role: "RESEARCHER" }, {}, true],
    ["an org admin of the plan org with an open round", { id: 50, role: "ADMIN", affiliationUri: UCOP }, {}, true],
    ["a superadmin of the plan org with an open round", { id: 51, role: "SUPERADMIN", affiliationUri: UCOP }, {}, true],
    ["an org admin of the plan org with no open round", { id: 50, role: "ADMIN", affiliationUri: UCOP }, { feedbackRounds: CLOSED_ROUNDS }, false],
    ["an admin of another org", { id: 50, role: "ADMIN", affiliationUri: CDL }, {}, false],
    ["an outsider", { id: 99, role: "RESEARCHER", affiliationUri: UCOP }, {}, false],
    ["an unknown user", { id: null }, {}, false],
  ])("for %s", (_label, me, plan, expected) => {
    expect(capabilities(me, plan).canComment).toBe(expected);
  });
});

describe("deriveCommentCapabilities canModerateComments", () => {
  it.each([
    [5, true],
    [4, false],
    [2, false],
    [1, false],
    [99, false],
  ])("user %p moderates: %p (only PRIMARY collaborators, like the server's canDeleteComment)", (id, expected) => {
    expect(capabilities({ id, role: "RESEARCHER" }).canModerateComments).toBe(expected);
  });

  it("does not let an admin moderate unless they are the PRIMARY collaborator", () => {
    expect(capabilities({ id: 50, role: "ADMIN", affiliationUri: UCOP }).canModerateComments).toBe(false);
  });
});

describe("deriveCommentCapabilities newCommentTarget", () => {
  it.each<[string, CommentPermissionFacts["me"], Partial<CommentPermissionFacts["plan"]>, unknown]>([
    ["an admin with a plan org and an open round", { id: 50, role: "ADMIN", affiliationUri: UCOP }, {}, { kind: "feedback", planFeedbackId: 31 }],
    ["an admin of another org, like the old useComments", { id: 50, role: "ADMIN", affiliationUri: CDL }, {}, { kind: "feedback", planFeedbackId: 31 }],
    ["an admin when every round is closed", { id: 50, role: "ADMIN", affiliationUri: UCOP }, { feedbackRounds: CLOSED_ROUNDS }, { kind: "answer" }],
    ["an admin when the plan has no org", { id: 50, role: "ADMIN", affiliationUri: UCOP }, { creatorAffiliationUri: null }, { kind: "answer" }],
    ["a collaborator with an open round", { id: 2, role: "RESEARCHER", affiliationUri: UCOP }, {}, { kind: "answer" }],
  ])("targets %s", (_label, me, plan, expected) => {
    expect(capabilities(me, plan).newCommentTarget).toEqual(expected);
  });
});

describe("deriveCommentActions", () => {
  it.each([
    ["the author", 3, { currentUserId: 3, canModerateComments: false }, { canEdit: true, canDelete: true }],
    ["another user", 8, { currentUserId: 3, canModerateComments: false }, { canEdit: false, canDelete: false }],
    ["a moderator on someone else's comment", 8, { currentUserId: 3, canModerateComments: true }, { canEdit: false, canDelete: true }],
    ["an unknown viewer on an unknown author", 0, { currentUserId: 0, canModerateComments: false }, { canEdit: false, canDelete: false }],
  ])("gives %s the right actions", (_label, authorId, viewer, expected) => {
    expect(deriveCommentActions(authorId, viewer)).toEqual(expected);
  });
});
