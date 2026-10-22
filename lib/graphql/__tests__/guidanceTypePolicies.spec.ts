import { gql, InMemoryCache } from '@apollo/client';
import { guidanceTypePolicies } from '../guidanceTypePolicies';

const QUESTIONS_QUERY = gql`
  query Questions {
    questions {
      id
      guidanceSources {
        id
        items {
          id
          guidanceText
        }
      }
    }
  }
`;

const sourceWith = (guidanceText: string) => ({
  __typename: 'GuidanceSource',
  id: 'affiliation-https://ror.org/example',
  items: [{ __typename: 'GuidanceItem', id: null, guidanceText }],
});

describe('guidanceTypePolicies', () => {
  it('keeps each question’s guidance when sources share an id', () => {
    const cache = new InMemoryCache({ typePolicies: guidanceTypePolicies });

    cache.writeQuery({
      query: QUESTIONS_QUERY,
      data: {
        questions: [
          { __typename: 'Question', id: 1, guidanceSources: [sourceWith('Q1 guidance')] },
          { __typename: 'Question', id: 2, guidanceSources: [sourceWith('Q2 guidance')] },
        ],
      },
    });

    const result = cache.readQuery<{
      questions: { guidanceSources: { items: { guidanceText: string }[] }[] }[];
    }>({ query: QUESTIONS_QUERY });

    expect(
      result?.questions.map((question) => question.guidanceSources[0].items[0].guidanceText)
    ).toEqual(['Q1 guidance', 'Q2 guidance']);
  });
});
