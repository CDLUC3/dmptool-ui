import { act, renderHook } from "@testing-library/react";
import { usePlanComments, type UsePlanCommentsArgs } from "../usePlanComments";
import type { PlanComment } from "../model";

const comment = (id: string, text: string): PlanComment => ({
  id,
  authorId: 1,
  authorName: "Ada",
  createdLabel: "today",
  text,
  canEdit: true,
  canDelete: true,
});

const first = comment("c1", "First");
const second = comment("c2", "Second");

function setup({
  onUpdateComment = jest.fn(async (id: string, text: string) => ({
    ...comment(id, text),
    isEdited: true,
  })),
  onDeleteComment = jest.fn(async () => {}),
}: Partial<Pick<UsePlanCommentsArgs, "onUpdateComment" | "onDeleteComment">> = {}) {
  const hook = renderHook(
    ({ comments }) => usePlanComments({ comments, onUpdateComment, onDeleteComment }),
    { initialProps: { comments: [first, second] } }
  );
  return { ...hook, onUpdateComment, onDeleteComment };
}

const texts = (comments: PlanComment[]) => comments.map((item) => item.text);

beforeEach(() => {
  jest.spyOn(console, "error").mockImplementation(() => {});
});

afterEach(() => {
  jest.restoreAllMocks();
});

describe("usePlanComments", () => {
  it("saves an edit and replaces the comment with the saved one", async () => {
    const { result, onUpdateComment } = setup();

    act(() => result.current.handleEditComment(first));
    expect(result.current.editingCommentId).toBe("c1");
    expect(result.current.editingCommentText).toBe("First");

    act(() => result.current.setEditingCommentText("  Revised  "));
    await act(() => result.current.handleUpdateComment(first));

    expect(onUpdateComment).toHaveBeenCalledWith("c1", "Revised");
    expect(result.current.localComments[0]).toMatchObject({ text: "Revised", isEdited: true });
    expect(result.current.editingCommentId).toBeNull();
    expect(result.current.mutationError).toBeNull();
  });

  it("ignores an edit that is only whitespace", async () => {
    const { result, onUpdateComment } = setup();

    act(() => result.current.handleEditComment(first));
    act(() => result.current.setEditingCommentText("   "));
    await act(() => result.current.handleUpdateComment(first));

    expect(onUpdateComment).not.toHaveBeenCalled();
    expect(result.current.editingCommentId).toBe("c1");
  });

  it("restores the original text and reports an error when the update fails", async () => {
    const { result } = setup({
      onUpdateComment: jest.fn(async () => {
        throw new Error("nope");
      }),
    });

    act(() => result.current.handleEditComment(first));
    act(() => result.current.setEditingCommentText("Revised"));
    await act(() => result.current.handleUpdateComment(first));

    expect(texts(result.current.localComments)).toEqual(["First", "Second"]);
    expect(result.current.mutationError).toBe("updateFailed");
    expect(result.current.editingCommentId).toBe("c1");
    expect(result.current.mutating).toBe(false);
  });

  it("cancels an edit and clears a previous error", async () => {
    const { result } = setup({
      onUpdateComment: jest.fn(async () => {
        throw new Error("nope");
      }),
    });

    act(() => result.current.handleEditComment(first));
    act(() => result.current.setEditingCommentText("Revised"));
    await act(() => result.current.handleUpdateComment(first));
    act(() => result.current.handleCancelEdit());

    expect(result.current.editingCommentId).toBeNull();
    expect(result.current.editingCommentText).toBe("");
    expect(result.current.mutationError).toBeNull();
  });

  it("deletes a comment", async () => {
    const { result, onDeleteComment } = setup();

    await act(() => result.current.handleDeleteComment(second));

    expect(onDeleteComment).toHaveBeenCalledWith("c2");
    expect(texts(result.current.localComments)).toEqual(["First"]);
  });

  it("stops editing a comment that is deleted", async () => {
    const { result } = setup();

    act(() => result.current.handleEditComment(first));
    await act(() => result.current.handleDeleteComment(first));

    expect(result.current.editingCommentId).toBeNull();
    expect(result.current.editingCommentText).toBe("");
  });

  it("puts the comment back and reports an error when the delete fails", async () => {
    const { result } = setup({
      onDeleteComment: jest.fn(async () => {
        throw new Error("nope");
      }),
    });

    await act(() => result.current.handleDeleteComment(first));

    expect(texts(result.current.localComments)).toEqual(["First", "Second"]);
    expect(result.current.mutationError).toBe("deleteFailed");
  });

  it("ignores another edit or delete while one is in flight", async () => {
    let finish: () => void = () => {};
    const onDeleteComment = jest.fn(
      () => new Promise<void>((resolve) => (finish = resolve))
    );
    const { result, onUpdateComment } = setup({ onDeleteComment });

    act(() => {
      void result.current.handleDeleteComment(first);
    });
    expect(result.current.mutating).toBe(true);

    act(() => result.current.handleEditComment(second));
    act(() => result.current.setEditingCommentText("Revised"));
    await act(() => result.current.handleUpdateComment(second));
    await act(() => result.current.handleDeleteComment(second));

    expect(onUpdateComment).not.toHaveBeenCalled();
    expect(onDeleteComment).toHaveBeenCalledTimes(1);

    await act(async () => finish());
    expect(result.current.mutating).toBe(false);
  });

  it("resets to new comments from the server and drops the edit in progress", () => {
    const { result, rerender } = setup();

    act(() => result.current.handleEditComment(first));
    rerender({ comments: [comment("c3", "Fresh")] });

    expect(texts(result.current.localComments)).toEqual(["Fresh"]);
    expect(result.current.editingCommentId).toBeNull();
  });
});
