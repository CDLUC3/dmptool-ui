export const MOCK_QUESTIONS_DATA = [
  {
    id: 9991,
    displayOrder: 1,
    questionText: '[MOCK] Will your project generate sensitive or confidential data?',
    json: JSON.stringify({
      meta: { schemaVersion: '1.0' },
      type: 'radioButtons',
      options: [
        { label: 'Yes', value: 'yes', selected: false },
        { label: 'No', value: 'no', selected: true },
        { label: 'Unsure', value: 'unsure', selected: false },
      ],
      attributes: {},
      showCommentField: true,
    }),
  },
  {
    id: 9992,
    displayOrder: 2,
    questionText:
      '[MOCK] Which types of data will your project produce? (Select all that apply)',
    json: JSON.stringify({
      meta: { schemaVersion: '1.0' },
      type: 'checkBoxes',
      options: [
        { label: 'Tabular data (CSV, Excel)', value: 'tabular', selected: true },
        { label: 'Images', value: 'images', selected: false },
        { label: 'Audio recordings', value: 'audio', selected: false },
        { label: 'Video recordings', value: 'video', selected: false },
        { label: 'Software or source code', value: 'software', selected: true },
        { label: 'Documentation', value: 'documentation', selected: true },
      ],
      attributes: {},
      showCommentField: true,
    }),
  },
  {
    id: 9993,
    displayOrder: 3,
    questionText: '[MOCK] Where will your project data be stored during the research?',
    json: JSON.stringify({
      meta: { schemaVersion: '1.0' },
      type: 'selectBox',
      options: [
        {
          label: 'Institutional Storage',
          value: 'institutional_storage',
          selected: true,
        },
        {
          label: 'Cloud Storage (AWS, Azure, GCP)',
          value: 'cloud',
          selected: false,
        },
        {
          label: 'Local Computer',
          value: 'local',
          selected: false,
        },
        {
          label: 'External Hard Drive',
          value: 'external',
          selected: false,
        },
      ],
      attributes: { multiple: false },
      showCommentField: true,
    }),
  },
  {
    id: 9994,
    displayOrder: 4,
    questionText: '[MOCK] Who will have access to the project data? (Select all that apply)',
    json: JSON.stringify({
      meta: { schemaVersion: '1.0' },
      type: 'checkBoxes',
      options: [
        {
          label: 'Principal Investigator',
          value: 'pi',
          selected: true,
        },
        {
          label: 'Research Team Members',
          value: 'research_team',
          selected: true,
        },
        {
          label: 'Institutional Collaborators',
          value: 'institutional_collaborators',
          selected: false,
        },
        {
          label: 'External Collaborators',
          value: 'external_collaborators',
          selected: false,
        },
        {
          label: 'Public',
          value: 'public',
          selected: false,
        },
      ],
      attributes: {},
      showCommentField: true,
    }),
  },
  {
    id: 9995,
    displayOrder: 5,
    questionText: '[MOCK] How long will the project data be retained after the project ends?',
    json: JSON.stringify({
      meta: { schemaVersion: '1.0' },
      type: 'radioButtons',
      options: [
        {
          label: 'Less than 5 years',
          value: 'lt_5_years',
          selected: false,
        },
        {
          label: '5–10 years',
          value: '5_10_years',
          selected: true,
        },
        {
          label: 'More than 10 years',
          value: 'gt_10_years',
          selected: false,
        },
        {
          label: 'Retained indefinitely',
          value: 'indefinitely',
          selected: false,
        },
      ],
      attributes: {},
      showCommentField: true,
    }),
  },
  {
    id: 9996,
    displayOrder: 6,
    questionText: '[MOCK] Which repository will you use to preserve and share your data?',
    json: JSON.stringify({
      meta: { schemaVersion: '1.0' },
      type: 'selectBox',
      options: [
        {
          label: 'Institutional Repository',
          value: 'institutional_repository',
          selected: true,
        },
        {
          label: 'Zenodo',
          value: 'zenodo',
          selected: false,
        },
        {
          label: 'Dryad',
          value: 'dryad',
          selected: false,
        },
        {
          label: 'Figshare',
          value: 'figshare',
          selected: false,
        },
        {
          label: 'GenBank',
          value: 'genbank',
          selected: false,
        },
        {
          label: 'Other',
          value: 'other',
          selected: false,
        },
      ],
      attributes: { multiple: false },
      showCommentField: true,
    }),
  },
];