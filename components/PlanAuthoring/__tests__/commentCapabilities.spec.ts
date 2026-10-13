import {
  deriveCommentActions,
  deriveCommentCapabilities,
  type CommentPermissionFacts,
} from "../commentCapabilities";
import { makeCommentPermissionPlan } from "../mocks";

const CLOSED_ROUNDS = [{ id: 30, requested: "1751900000000", completed: "1751929006000" }];
const UNREQUESTED_ROUNDS = [{ id: 32, requested: null, completed: null }];

function capabilities(
  me: CommentPermissionFacts["me"],
  plan: Partial<CommentPermissionFacts["plan"]> = {}
) {
  return deriveCommentCapabilities({ me, plan: makeCommentPermissionPlan(plan) });
}

describe("deriveCommentCapabilities canModerateComments", () => {
  it.each([
    ["PRIMARY", true],
    ["OWN", false],
    ["EDIT", false],
    ["COMMENT", false],
    [null, false],
  ])("myAccessLevel %p moderates: %p", (myAccessLevel, expected) => {
    expect(capabilities({ role: "RESEARCHER" }, { myAccessLevel }).canModerateComments).toBe(expected);
  });

  it("does not let an admin moderate unless they are the PRIMARY collaborator", () => {
    expect(capabilities({ role: "ADMIN" }, { myAccessLevel: null }).canModerateComments).toBe(false);
  });
});

describe("deriveCommentCapabilities newCommentTarget", () => {
  it.each<[string, CommentPermissionFacts["me"], Partial<CommentPermissionFacts["plan"]>, unknown]>([
    ["an admin with an open round", { role: "ADMIN" }, {}, { kind: "feedback", planFeedbackId: 31 }],
    ["a superadmin with an open round", { role: "SUPERADMIN" }, {}, { kind: "feedback", planFeedbackId: 31 }],
    ["an admin when every round is closed", { role: "ADMIN" }, { feedbackRounds: CLOSED_ROUNDS }, { kind: "answer" }],
    ["an admin when the open round was never requested", { role: "ADMIN" }, { feedbackRounds: UNREQUESTED_ROUNDS }, { kind: "answer" }],
    ["a researcher with an open round", { role: "RESEARCHER" }, {}, { kind: "answer" }],
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
