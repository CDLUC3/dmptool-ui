import { jsonToState } from '../researchOutputTransformations';
import { RO_FILE_SIZE, RO_RELEASE_DATE } from '@/lib/constants';
import type { StandardField } from '@/app/types/questionAdd';

// The headings stateToJSON writes for the two columns
const column = (heading: string, commonStandardId: string, type: string) => ({
  heading,
  commonStandardId,
  required: false,
  enabled: true,
  help: '',
  content: { type, attributes: { help: `Example help for ${heading}` }, meta: { schemaVersion: '1.0' } },
});

describe('jsonToState', () => {
  it('finds the release date and file size columns the editor writes', () => {
    const fields = [
      { id: RO_RELEASE_DATE, enabled: false, required: false },
      { id: RO_FILE_SIZE, enabled: false, required: false },
    ] as unknown as StandardField[];
    const question = {
      type: 'researchOutputTable',
      columns: [
        column('Anticipated Release Date', 'issued', 'date'),
        column('Anticipated File Size', 'byte_size', 'numberWithContext'),
      ],
    };

    const state = jsonToState(question as never, fields);

    const byId = Object.fromEntries(state.standardFields.map((f) => [f.id, f]));
    expect(byId[RO_RELEASE_DATE].enabled).toBe(true);
    expect(byId[RO_RELEASE_DATE].helpText).toBe('Example help for Anticipated Release Date');
    expect(byId[RO_FILE_SIZE].enabled).toBe(true);
  });
});
