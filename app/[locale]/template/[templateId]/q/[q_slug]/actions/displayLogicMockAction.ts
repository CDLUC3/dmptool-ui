'use client';

import { SaveQuestionDisplayLogicInput, FetchedQuestionDisplayLogic } from '../displayLogicMapper';

// In-memory mock "database" — module-scoped, so it persists across
// component remounts within the same browser session but resets on a
// full page reload. Stands in for the real saveQuestionDisplayLogic
// resolver/mutation until the backend field exists (see
// resolvers/saveQuestionDisplayLogic.ts from earlier).
const mockStore = new Map<number, FetchedQuestionDisplayLogic>();
let nextId = 1;

const delay = (ms = 400) => new Promise((resolve) => setTimeout(resolve, ms));

export async function fetchQuestionDisplayLogicAction(
  questionId: number
): Promise<FetchedQuestionDisplayLogic | null> {
  await delay(200);
  return mockStore.get(questionId) ?? null;
}

export async function saveQuestionDisplayLogicAction(
  input: SaveQuestionDisplayLogicInput
): Promise<{ success: boolean; errors?: string[]; data?: FetchedQuestionDisplayLogic }> {
  await delay();

  // Mirrors the real resolver: the top-level row's id is kept if one
  // already exists for this question, but groups/conditions are always
  // freshly minted — a save replaces them wholesale rather than diffing
  // (see saveQuestionDisplayLogic.ts).
  const existing = mockStore.get(input.questionId);

  const saved: FetchedQuestionDisplayLogic = {
    id: existing?.id ?? nextId++,
    questionId: input.questionId,
    action: input.action,
    matchType: input.matchType,
    groups: input.groups.map((g) => ({
      id: nextId++,
      triggerQuestionId: g.triggerQuestionId,
      conditions: g.conditions.map((c) => ({
        id: nextId++,
        conditionType: c.conditionType,
        target: c.target,
      })),
    })),
  };

  mockStore.set(input.questionId, saved);
  return { success: true, data: saved };
}

export async function removeQuestionDisplayLogicAction(
  { questionId }: { questionId: number }
): Promise<{ success: boolean }> {
  await delay(200);
  mockStore.delete(questionId);
  return { success: true };
}