import { InMemoryCache } from '@apollo/client';
import { QuestionConditionGroupsDocument } from '@/generated/graphql';
import { errorTypePolicies } from '../errorTypePolicies';
import { guidanceTypePolicies } from '../guidanceTypePolicies';
import { displayLogicTypePolicies } from '../displayLogicTypePolicies';

// Matches the typePolicies set up in apollo-wrapper.tsx
const buildCache = () => new InMemoryCache({
  typePolicies: {
    ...errorTypePolicies,
    ...guidanceTypePolicies,
    ...displayLogicTypePolicies,
  },
});

describe('display logic type policies', () => {
  // Apollo only warns "Cache data may be lost when replacing the ... field" (in development builds) when a
  // field has no merge function, so check that each display logic list field has one
  it('should define a merge function for Query.questionConditionGroups', () => {
    expect(buildCache().policies.getMergeFunction('Query', 'questionConditionGroups', undefined)).toBeDefined();
  });

  it('should define a merge function for Question.conditionGroups', () => {
    expect(buildCache().policies.getMergeFunction('Question', 'conditionGroups', undefined)).toBeDefined();
  });

  it('should keep the existing Question errors policy', () => {
    expect(buildCache().policies.getMergeFunction('Question', 'errors', undefined)).toBeDefined();
  });

  it('should replace the cached questionConditionGroups when the list shrinks', () => {
    const cache = buildCache();
    const variables = { questionId: 105 };
    const group = { __typename: 'QuestionConditionGroup' as const, id: 1, triggerQuestionId: 104, conditions: [] };

    cache.writeQuery({ query: QuestionConditionGroupsDocument, variables, data: { questionConditionGroups: [group] } });
    cache.writeQuery({ query: QuestionConditionGroupsDocument, variables, data: { questionConditionGroups: [] } });

    expect(cache.readQuery({ query: QuestionConditionGroupsDocument, variables })).toEqual({ questionConditionGroups: [] });
  });
});
