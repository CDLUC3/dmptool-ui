import type { ResearchOutputTable } from "@/app/types";
import { RESEARCH_OUTPUT_QUESTION_TYPE } from "@/lib/constants";
import { buildResearchOutputAnswer } from "../researchOutputAnswer";
import type { PlanAuthoringPlan } from "../toPlanAuthoringModel";
import { makeRawAnswer, makeRawQuestion } from "./builders";
import { mockPlan } from "./mockPlan";

/** Column headings match SingleResearchOutputComponent / getRowDisplayInfo checks. */
const RESEARCH_OUTPUT_COLUMNS = [
  {
    heading: "Title",
    commonStandardId: "title",
    help: "Enter the title of this research output",
    required: true,
    enabled: true,
    content: {
      type: "text",
      meta: { schemaVersion: "1.0" },
      attributes: {
        maxLength: 500,
        labelTranslationKey: "labels.title",
      },
    },
  },
  {
    heading: "Description",
    commonStandardId: "description",
    help: "Enter a brief description of this research output",
    required: true,
    enabled: true,
    content: {
      type: "textArea",
      meta: { schemaVersion: "1.0" },
      attributes: {
        cols: 20,
        rows: 2,
        asRichText: true,
        maxLength: 10000,
        label: "Description",
        labelTranslationKey: "labels.description",
      },
    },
  },
  {
    heading: "Output Type",
    commonStandardId: "type",
    help: "Select the type of this research output",
    required: true,
    enabled: true,
    content: {
      type: "selectBox",
      meta: { schemaVersion: "1.0" },
      options: [
        { label: "Audiovisual", value: "audiovisual", selected: false },
        { label: "Dataset", value: "dataset", selected: false },
        { label: "Software", value: "software", selected: false },
        { label: "Text", value: "text", selected: false },
      ],
      attributes: {
        label: "Output Type",
        multiple: false,
        labelTranslationKey: "labels.outputType",
      },
    },
  },
  {
    heading: "Data Flags",
    commonStandardId: "data_flags",
    help: "Mark all of the statements that are true about the dataset",
    required: false,
    enabled: true,
    content: {
      type: "checkBoxes",
      meta: { schemaVersion: "1.0" },
      options: [
        {
          label: "May contain sensitive data",
          value: "sensitive",
          checked: false,
        },
        {
          label: "May contain personal data",
          value: "personal",
          checked: false,
        },
      ],
      attributes: {
        label: "Data Flags",
        labelTranslationKey: "labels.dataFlags",
      },
    },
  },
  {
    heading: "Repositories",
    commonStandardId: "host",
    help: "Select repository(ies) you would prefer users to deposit in",
    required: false,
    enabled: true,
    content: {
      type: "repositorySearch",
      meta: { schemaVersion: "1.0" },
      attributes: {
        label: "Repositories",
        labelTranslationKey: "labels.repositories",
      },
    },
  },
  {
    heading: "Metadata Standards",
    commonStandardId: "metadata",
    help: "Select metadata standard(s) you would prefer users to use",
    required: false,
    enabled: true,
    content: {
      type: "metadataStandardSearch",
      meta: { schemaVersion: "1.0" },
      attributes: {
        label: "Metadata Standards",
        labelTranslationKey: "labels.metadataStandards",
      },
    },
  },
  {
    heading: "Licenses",
    commonStandardId: "license_ref",
    help: "Select the license you will apply to the research output",
    required: false,
    enabled: true,
    content: {
      type: "licenseSearch",
      meta: { schemaVersion: "1.0" },
      attributes: {
        label: "Licenses",
        labelTranslationKey: "labels.licenses",
      },
    },
  },
  {
    heading: "Initial Access Levels",
    commonStandardId: "data_access",
    help: "Select the access level for this research output",
    required: false,
    enabled: true,
    content: {
      type: "radioButtons",
      meta: { schemaVersion: "1.0" },
      options: [
        { label: "Open", value: "open", selected: false },
        { label: "Restricted", value: "restricted", selected: false },
        { label: "Closed", value: "closed", selected: false },
      ],
      attributes: {
        label: "Initial Access Levels",
        labelTranslationKey: "labels.initialAccessLevels",
      },
    },
  },
  {
    heading: "Anticipated Release Date",
    commonStandardId: "issued",
    help: "When do you expect to release this output?",
    required: false,
    enabled: true,
    content: {
      type: "date",
      meta: { schemaVersion: "1.0" },
      attributes: {
        label: "Anticipated Release Date",
        labelTranslationKey: "labels.anticipatedReleaseDate",
      },
    },
  },
  {
    heading: "Anticipated File Size",
    commonStandardId: "byte_size",
    help: "Approximate size of the research output",
    required: false,
    enabled: true,
    content: {
      type: "numberWithContext",
      meta: { schemaVersion: "1.0" },
      attributes: {
        label: "Anticipated File Size",
        labelTranslationKey: "labels.anticipatedFileSize",
      },
    },
  },
] as const;

export const MOCK_RESEARCH_OUTPUT_PARSED_JSON = {
  type: RESEARCH_OUTPUT_QUESTION_TYPE,
  meta: {
    schemaVersion: "1.0",
    title: "Research outputs",
  },
  columns: RESEARCH_OUTPUT_COLUMNS,
};

export const MOCK_RESEARCH_OUTPUT_ROWS = [
  {
    columns: [
      {
        type: "text",
        commonStandardId: "title",
        meta: { schemaVersion: "1.0" },
        answer: "Coastal UAV imagery mosaic (2025)",
      },
      {
        type: "textArea",
        commonStandardId: "description",
        meta: { schemaVersion: "1.0" },
        answer:
          "<p>Orthomosaic and DEM products from seasonal UAV flights over the Frost study area.</p>",
      },
      {
        type: "selectBox",
        commonStandardId: "type",
        meta: { schemaVersion: "1.0" },
        answer: "dataset",
      },
      {
        type: "checkBoxes",
        commonStandardId: "data_flags",
        meta: { schemaVersion: "1.0" },
        answer: [],
      },
      {
        type: "repositorySearch",
        commonStandardId: "host",
        meta: { schemaVersion: "1.0" },
        answer: [
          {
            repositoryId: "https://www.re3data.org/repository/r3d100010468",
            repositoryName: "Zenodo",
            repositoryWebsite: "https://zenodo.org",
          },
        ],
      },
      {
        type: "metadataStandardSearch",
        commonStandardId: "metadata",
        meta: { schemaVersion: "1.0" },
        answer: [
          {
            metadataStandardId: "https://schema.datacite.org/",
            metadataStandardName: "DataCite Metadata Schema",
          },
        ],
      },
      {
        type: "licenseSearch",
        commonStandardId: "license_ref",
        meta: { schemaVersion: "1.0" },
        answer: [
          {
            licenseId: "https://spdx.org/licenses/CC-BY-4.0.json",
            licenseName: "CC-BY-4.0",
          },
        ],
      },
      {
        type: "radioButtons",
        commonStandardId: "data_access",
        meta: { schemaVersion: "1.0" },
        answer: "open",
      },
      {
        type: "date",
        commonStandardId: "issued",
        meta: { schemaVersion: "1.0" },
        answer: "2026-09-01",
      },
      {
        type: "numberWithContext",
        commonStandardId: "byte_size",
        meta: { schemaVersion: "1.0" },
        answer: { value: 120, context: "gb" },
      },
    ],
  },
  {
    columns: [
      {
        type: "text",
        commonStandardId: "title",
        meta: { schemaVersion: "1.0" },
        answer: "Habitat suitability model code",
      },
      {
        type: "textArea",
        commonStandardId: "description",
        meta: { schemaVersion: "1.0" },
        answer:
          "<p>Python notebooks and container recipe used to regenerate habitat-suitability layers.</p>",
      },
      {
        type: "selectBox",
        commonStandardId: "type",
        meta: { schemaVersion: "1.0" },
        answer: "software",
      },
      {
        type: "checkBoxes",
        commonStandardId: "data_flags",
        meta: { schemaVersion: "1.0" },
        answer: [],
      },
      {
        type: "repositorySearch",
        commonStandardId: "host",
        meta: { schemaVersion: "1.0" },
        answer: [
          {
            repositoryId: "https://github.com/",
            repositoryName: "GitHub",
            repositoryWebsite: "https://github.com",
          },
        ],
      },
      {
        type: "metadataStandardSearch",
        commonStandardId: "metadata",
        meta: { schemaVersion: "1.0" },
        answer: [],
      },
      {
        type: "licenseSearch",
        commonStandardId: "license_ref",
        meta: { schemaVersion: "1.0" },
        answer: [
          {
            licenseId: "https://spdx.org/licenses/MIT.json",
            licenseName: "MIT",
          },
        ],
      },
      {
        type: "radioButtons",
        commonStandardId: "data_access",
        meta: { schemaVersion: "1.0" },
        answer: "open",
      },
      {
        type: "date",
        commonStandardId: "issued",
        meta: { schemaVersion: "1.0" },
        answer: "2026-12-15",
      },
      {
        type: "numberWithContext",
        commonStandardId: "byte_size",
        meta: { schemaVersion: "1.0" },
        answer: { value: 45, context: "mb" },
      },
    ],
  },
] as unknown as ResearchOutputTable[];

export const MOCK_RESEARCH_OUTPUT_QUESTION_KEY = "base-question-105";

const researchOutputQuestion = makeRawQuestion({
  versionedQuestionId: 105,
  questionText: "Research outputs for this award",
  required: true,
  requirementText:
    "<p>List each anticipated research output (datasets, software, samples, or other products). Include repository, license, access level, and release timing where known.</p>",
  json: JSON.stringify(MOCK_RESEARCH_OUTPUT_PARSED_JSON),
  hasAnswer: true,
  answer: makeRawAnswer(RESEARCH_OUTPUT_QUESTION_TYPE, MOCK_RESEARCH_OUTPUT_ROWS, {
    id: 105,
    json: JSON.stringify(
      buildResearchOutputAnswer(MOCK_RESEARCH_OUTPUT_PARSED_JSON, MOCK_RESEARCH_OUTPUT_ROWS)
    ),
  }),
});

/** mockPlan plus a research output table question at the end of its first section. */
export const mockPlanWithResearchOutputs: PlanAuthoringPlan = {
  ...mockPlan,
  sections: mockPlan.sections?.map((section, index) =>
    index === 0
      ? { ...section, questions: [...(section.questions ?? []), researchOutputQuestion] }
      : section
  ),
};
