import {
  parseResearchOutputsFromAnswers,
  outputTypeLabel,
  type PlanAnswer,
} from '../researchOutputParsing'; // adjust to the actual relative path

// --- @dmptool/types ---
// Mock the enum with the exact keys the source file references, and mock
// the zod schema's safeParse so we can control validation success/failure
// per test without depending on the real (possibly complex) schema shape.
const mockSafeParse = jest.fn();

jest.mock('@dmptool/types', () => ({
  ResearchOutputTableColumnsEnum: {
    enum: {
      title: 'title',
      description: 'description',
      type: 'type',
      issued: 'issued',
      byte_size: 'byte_size',
      host: 'host',
      metadata: 'metadata',
      license_ref: 'license_ref',
    },
  },
  ResearchOutputTableAnswerSchema: {
    safeParse: (...args: unknown[]) => mockSafeParse(...args),
  },
}));

describe('outputTypeLabel', () => {
  it('returns an empty string when type is undefined', () => {
    expect(outputTypeLabel(undefined)).toBe('');
  });

  it('returns an empty string when type is null', () => {
    expect(outputTypeLabel(null)).toBe('');
  });

  it('returns an empty string when type is an empty string', () => {
    expect(outputTypeLabel('')).toBe('');
  });

  it('capitalizes the first letter of a single-word type', () => {
    expect(outputTypeLabel('dataset')).toBe('Dataset');
  });

  it('replaces underscores with spaces and capitalizes the first letter', () => {
    expect(outputTypeLabel('data_paper')).toBe('Data paper');
  });

  it('replaces hyphens with spaces and capitalizes the first letter', () => {
    expect(outputTypeLabel('audio-visual')).toBe('Audio visual');
  });

  it('replaces multiple underscores/hyphens with spaces', () => {
    expect(outputTypeLabel('some-multi_word-type')).toBe('Some multi word type');
  });

  it('does not alter capitalization of subsequent words', () => {
    expect(outputTypeLabel('data_PAPER')).toBe('Data PAPER');
  });
});

describe('parseResearchOutputsFromAnswers', () => {
  beforeEach(() => {
    jest.clearAllMocks();
  });

  const buildColumn = (commonStandardId: string, answer: unknown) => ({
    commonStandardId,
    answer,
  });

  const buildRow = (columns: ReturnType<typeof buildColumn>[]) => ({ columns });

  it('returns an empty array when answers is undefined', () => {
    expect(parseResearchOutputsFromAnswers(undefined)).toEqual([]);
    expect(mockSafeParse).not.toHaveBeenCalled();
  });

  it('returns an empty array when answers is null', () => {
    expect(parseResearchOutputsFromAnswers(null)).toEqual([]);
    expect(mockSafeParse).not.toHaveBeenCalled();
  });

  it('returns an empty array when answers is an empty array', () => {
    expect(parseResearchOutputsFromAnswers([])).toEqual([]);
    expect(mockSafeParse).not.toHaveBeenCalled();
  });

  it('skips an answer with a missing json field', () => {
    const answers: PlanAnswer[] = [{ id: 1, json: null }, { id: 2 }];

    expect(parseResearchOutputsFromAnswers(answers)).toEqual([]);
    expect(mockSafeParse).not.toHaveBeenCalled();
  });

  it('skips an answer whose json is not valid JSON', () => {
    const answers: PlanAnswer[] = [{ id: 1, json: '{not valid json' }];

    expect(parseResearchOutputsFromAnswers(answers)).toEqual([]);
    expect(mockSafeParse).not.toHaveBeenCalled();
  });

  it('skips an answer whose parsed JSON fails schema validation', () => {
    mockSafeParse.mockReturnValueOnce({ success: false, error: new Error('invalid shape') });
    const answers: PlanAnswer[] = [{ id: 1, json: JSON.stringify({ not: 'a valid table' }) }];

    expect(parseResearchOutputsFromAnswers(answers)).toEqual([]);
    expect(mockSafeParse).toHaveBeenCalledTimes(1);
  });

  it('parses a single row into a ParsedOutput with all fields populated', () => {
    const row = buildRow([
      buildColumn('title', 'Data Paper from migration studies'),
      buildColumn('description', '<p>A description.</p>'),
      buildColumn('type', 'data-paper'),
      buildColumn('issued', '2027-05-31'),
      buildColumn('byte_size', { value: 2, context: 'mb' }),
      buildColumn('host', [
        { repositoryId: 'https://example.org/repo/1', repositoryName: 'Example Repo' },
      ]),
      buildColumn('metadata', [
        { metadataStandardId: 'https://example.org/std/1', metadataStandardName: 'Example Standard' },
      ]),
      buildColumn('license_ref', [
        { licenseId: 'https://spdx.org/licenses/CC0-1.0.json', licenseName: 'CC0-1.0' },
      ]),
    ]);

    mockSafeParse.mockReturnValueOnce({ success: true, data: { answer: [row] } });
    const answers: PlanAnswer[] = [{ id: 1, json: JSON.stringify({}) }];

    const result = parseResearchOutputsFromAnswers(answers);

    expect(result).toHaveLength(1);
    expect(result[0]).toEqual({
      title: 'Data Paper from migration studies',
      description: '<p>A description.</p>',
      type: 'data-paper',
      issued: '2027-05-31',
      byteSize: 2,
      byteSizeUnit: 'mb',
      hosts: [{ url: 'https://example.org/repo/1', name: 'Example Repo' }],
      metadataStandards: [{ uri: 'https://example.org/std/1', name: 'Example Standard' }],
      licenses: [{ uri: 'https://spdx.org/licenses/CC0-1.0.json', name: 'CC0-1.0' }],
    });
  });

  it('handles a row with all optional columns missing, defaulting arrays to empty', () => {
    const row = buildRow([]);
    mockSafeParse.mockReturnValueOnce({ success: true, data: { answer: [row] } });
    const answers: PlanAnswer[] = [{ id: 1, json: JSON.stringify({}) }];

    const result = parseResearchOutputsFromAnswers(answers);

    expect(result).toHaveLength(1);
    expect(result[0]).toEqual({
      title: undefined,
      description: undefined,
      type: undefined,
      issued: undefined,
      byteSize: undefined,
      byteSizeUnit: undefined,
      hosts: [],
      metadataStandards: [],
      licenses: [],
    });
  });

  it('parses multiple rows within a single answer into multiple outputs', () => {
    const row1 = buildRow([buildColumn('title', 'Output One')]);
    const row2 = buildRow([buildColumn('title', 'Output Two')]);

    mockSafeParse.mockReturnValueOnce({ success: true, data: { answer: [row1, row2] } });
    const answers: PlanAnswer[] = [{ id: 1, json: JSON.stringify({}) }];

    const result = parseResearchOutputsFromAnswers(answers);

    expect(result).toHaveLength(2);
    expect(result[0].title).toBe('Output One');
    expect(result[1].title).toBe('Output Two');
  });

  it('parses rows across multiple answers, aggregating all outputs into one array', () => {
    const row1 = buildRow([buildColumn('title', 'From Answer One')]);
    const row2 = buildRow([buildColumn('title', 'From Answer Two')]);

    mockSafeParse
      .mockReturnValueOnce({ success: true, data: { answer: [row1] } })
      .mockReturnValueOnce({ success: true, data: { answer: [row2] } });
    const answers: PlanAnswer[] = [
      { id: 1, json: JSON.stringify({}) },
      { id: 2, json: JSON.stringify({}) },
    ];

    const result = parseResearchOutputsFromAnswers(answers);

    expect(result).toHaveLength(2);
    expect(result.map((o) => o.title)).toEqual(['From Answer One', 'From Answer Two']);
  });

  it('continues processing subsequent answers after one fails to parse as JSON', () => {
    const row = buildRow([buildColumn('title', 'Valid Output')]);
    mockSafeParse.mockReturnValueOnce({ success: true, data: { answer: [row] } });

    const answers: PlanAnswer[] = [
      { id: 1, json: 'not valid json' },
      { id: 2, json: JSON.stringify({}) },
    ];

    const result = parseResearchOutputsFromAnswers(answers);

    expect(result).toHaveLength(1);
    expect(result[0].title).toBe('Valid Output');
    // Only the second (valid-JSON) answer should have reached safeParse
    expect(mockSafeParse).toHaveBeenCalledTimes(1);
  });

  it('continues processing subsequent answers after one fails schema validation', () => {
    const row = buildRow([buildColumn('title', 'Valid Output')]);
    mockSafeParse
      .mockReturnValueOnce({ success: false, error: new Error('bad shape') })
      .mockReturnValueOnce({ success: true, data: { answer: [row] } });

    const answers: PlanAnswer[] = [
      { id: 1, json: JSON.stringify({ bad: 'shape' }) },
      { id: 2, json: JSON.stringify({}) },
    ];

    const result = parseResearchOutputsFromAnswers(answers);

    expect(result).toHaveLength(1);
    expect(result[0].title).toBe('Valid Output');
    expect(mockSafeParse).toHaveBeenCalledTimes(2);
  });

  it('skips a null entry within the answers array without throwing', () => {
    const row = buildRow([buildColumn('title', 'Valid Output')]);
    mockSafeParse.mockReturnValueOnce({ success: true, data: { answer: [row] } });

    const answers: (PlanAnswer | null)[] = [
      null,
      { id: 2, json: JSON.stringify({}) },
    ];

    const result = parseResearchOutputsFromAnswers(answers as PlanAnswer[]);

    expect(result).toHaveLength(1);
    expect(result[0].title).toBe('Valid Output');
  });
});