import {
  GuidanceSourceType,
  ProjectCollaboratorAccessLevel,
} from "@/generated/graphql";
import type { PlanDocument } from "../model";
import type {
  PlanAuthoringGuidanceSource,
  PlanAuthoringMe,
} from "../toPlanAuthoringModel";
import {
  makeRawAnswer,
  makeRawComment,
  makeRawMe,
  makeRawPlan,
  makeRawQuestion,
  makeRawSection,
} from "./builders";

export const MOCK_CURRENT_USER_ID = 101;

const NSF = "https://ror.org/021nxhr62";
const CDL = "https://ror.org/03yrm5c26";
const STANFORD = "https://ror.org/00f54p054";
const UCB = "https://ror.org/01an7q238";

const CURRENT_USER = { id: MOCK_CURRENT_USER_ID, givenName: "Style Guide", surName: "User" };
const AMELIA = { id: 102, givenName: "Amelia", surName: "Snow" };
const JENNIFER = { id: 103, givenName: "Jennifer", surName: "Frost" };

const HOUR = 60 * 60 * 1000;
const hoursAgo = (hours: number) => String(Date.now() - hours * HOUR);

const GUIDANCE: PlanAuthoringGuidanceSource[] = [
  {
    id: "bestPractice",
    type: GuidanceSourceType.BestPractice,
    label: "DMP Tool best practice",
    shortName: "DMP Tool",
    orgURI: "bestPractice",
    items: [
      { id: 1, title: "Data sharing", guidanceText: "<p>Prefer open formats and name a repository that issues DOIs.</p>" },
    ],
  },
  {
    id: `affiliation-${NSF}`,
    type: GuidanceSourceType.TemplateOwner,
    label: "National Science Foundation",
    shortName: "NSF",
    orgURI: NSF,
    items: [
      { id: 2, title: "Expectations", guidanceText: "<p><strong>Expectations</strong></p>" },
      { id: 3, title: "Coverage", guidanceText: "<ul><li>Data types and volume</li><li>Standards</li><li>Timelines</li></ul>" },
    ],
  },
  {
    id: `affiliation-${CDL}`,
    type: GuidanceSourceType.UserAffiliation,
    label: "California Digital Library",
    shortName: "CDL",
    orgURI: CDL,
    items: [
      { id: 4, title: "Storage", guidanceText: "<p>Use campus storage, not personal drives, for the primary copy.</p>" },
    ],
  },
  {
    id: `affiliation-${STANFORD}`,
    type: GuidanceSourceType.UserSelected,
    label: "Stanford Libraries",
    shortName: "Stanford",
    orgURI: STANFORD,
    items: [
      { id: 5, title: "Licensing", guidanceText: "<p>Less restrictive licensing travels further; CC0 is a good default.</p>" },
    ],
  },
];

const CDL_CUSTOMIZATION: PlanAuthoringGuidanceSource = {
  id: `customization-${CDL}`,
  type: GuidanceSourceType.UserAffiliation,
  label: "California Digital Library",
  shortName: "CDL",
  orgURI: CDL,
  items: [
    {
      guidanceText: "<p>CDL recommends naming a backup steward.</p>",
      sampleText: "<p>At CDL, stewardship is shared between the PI and a campus data librarian.</p>",
    },
  ],
};

/** Orgs the fake managedAffiliationsWithGuidance search returns, with the guidance they add. */
export const MOCK_GUIDANCE_ORGS = [
  { uri: NSF, displayName: "National Science Foundation", displayAbbreviation: "NSF", guidanceText: GUIDANCE[1].items[0].guidanceText },
  { uri: CDL, displayName: "California Digital Library", displayAbbreviation: "CDL", guidanceText: GUIDANCE[2].items[0].guidanceText },
  { uri: STANFORD, displayName: "Stanford Libraries", displayAbbreviation: "Stanford", guidanceText: GUIDANCE[3].items[0].guidanceText },
  { uri: UCB, displayName: "UC Berkeley", displayAbbreviation: "UCB", guidanceText: "<p>Berkeley Research Data Management can review your plan.</p>" },
];

const OPTIONS = [
  { label: "CSV", value: "csv" },
  { label: "NetCDF", value: "netcdf" },
  { label: "GeoTIFF", value: "geotiff" },
];

const LONG_REQUIREMENT =
  "<p>Select the descriptor that best reflects how the bulk of project data will be generated. NSF distinguishes observational data, which is typically non-reproducible and needs long-term preservation, from experimental and computational data, which can often be regenerated from documented workflows. If your project produces a mix, choose the option that covers the majority of stored volume and explain the split in the volume question below.</p>";

const MODIFIED = hoursAgo(4);

export const mockPlan = makeRawPlan({
  id: 1,
  title: "V4.3: Coastal Ocean Processes of North Greenland",
  readOnly: false,
  createdById: JENNIFER.id,
  planCreator: { affiliation: { uri: CDL } },
  project: {
    collaborators: [
      { accessLevel: ProjectCollaboratorAccessLevel.Own, user: { id: JENNIFER.id } },
      { accessLevel: ProjectCollaboratorAccessLevel.Primary, user: { id: MOCK_CURRENT_USER_ID } },
    ],
  },
  members: [
    { projectMember: { givenName: "Jennifer", surName: "Frost" }, memberRoles: [{ label: "PI" }] },
    { projectMember: { givenName: "Amelia", surName: "Snow" }, memberRoles: [{ label: "Other" }] },
  ],
  versionedTemplate: {
    id: 1,
    name: "NSF GEO 2026 Template",
    version: "v1",
    owner: { name: "National Science Foundation", uri: NSF },
  },
  fundings: [
    { projectFunding: { affiliation: { displayName: "National Science Foundation (nsf.gov)" } } },
  ],
  sections: [
    makeRawSection({
      versionedSectionId: 1,
      displayOrder: 1,
      title: "Products of research",
      introduction: "<p>Describe what your project will produce: data, samples, software and materials.</p>",
      requirements: "<p>Required by funder. Give quantitative estimates for every output category.</p>",
      questions: [
        makeRawQuestion({
          versionedQuestionId: 101,
          questionText: "Primary character of data produced",
          required: true,
          requirementText: LONG_REQUIREMENT,
          json: JSON.stringify({
            type: "radioButtons",
            options: [
              { label: "Observational", value: "observational" },
              { label: "Computational", value: "computational" },
              { label: "Mixed", value: "mixed" },
            ],
          }),
          guidanceSources: GUIDANCE,
          hasAnswer: true,
          answer: makeRawAnswer("radioButtons", "mixed", {
            id: 101,
            modified: MODIFIED,
            comments: [
              makeRawComment({ id: 1, user: AMELIA, created: hoursAgo(48), commentText: "Please quantify the expected UAV imagery volume." }),
              makeRawComment({ id: 3, user: CURRENT_USER, created: hoursAgo(4), commentText: "Also mention the processing pipeline." }),
            ],
            feedbackComments: [
              makeRawComment({ id: 2, user: JENNIFER, created: hoursAgo(24), commentText: "Added gigabyte ranges for each product type." }),
            ],
          }),
        }),
        makeRawQuestion({
          versionedQuestionId: 102,
          questionText: "Estimated volume of products",
          requirementText: "<p>Approximate counts or storage size per product type.</p>",
          json: JSON.stringify({ type: "text", attributes: {} }),
          guidanceSources: GUIDANCE,
          hasAnswer: true,
          answer: makeRawAnswer("text", "About 2 TB of imagery", { id: 102, modified: MODIFIED }),
        }),
        makeRawQuestion({
          versionedQuestionId: 103,
          questionText: "Will products include personally identifiable information?",
          json: JSON.stringify({ type: "boolean", attributes: { value: false } }),
          guidanceSources: GUIDANCE,
          hasAnswer: true,
          answer: makeRawAnswer("boolean", false, { id: 103, modified: MODIFIED }),
        }),
        makeRawQuestion({
          versionedQuestionId: 104,
          questionText: "Preferred file formats",
          json: JSON.stringify({ type: "checkBoxes", options: OPTIONS }),
          guidanceSources: GUIDANCE,
          hasAnswer: true,
          answer: makeRawAnswer("checkBoxes", ["csv", "netcdf"], { id: 104, modified: MODIFIED }),
        }),
      ],
    }),
    makeRawSection({
      versionedSectionId: 2,
      displayOrder: 2,
      title: "Roles and responsibilities",
      introduction: "<p>Identify who implements this plan during and after the project.</p>",
      requirements: "<p>Required by funder. Name a person, not only a role.</p>",
      questions: [
        makeRawQuestion({
          versionedQuestionId: 201,
          questionText: "Who will manage day-to-day data stewardship?",
          required: true,
          requirementText: "<p>Name the person and their share of effort.</p>",
          json: JSON.stringify({ type: "textArea", attributes: {} }),
          sampleText: "<p><em>Jordan Lee (Research Data Librarian)</em> will spend about 15% FTE on data management.</p>",
          guidanceSources: [...GUIDANCE, CDL_CUSTOMIZATION],
        }),
        makeRawQuestion({
          versionedQuestionId: 202,
          questionText: "Handover plan if the steward leaves",
          json: JSON.stringify({ type: "textArea", attributes: {} }),
          sampleText: "<p>The co-PI assumes stewardship duties; handover notes live in the project drive.</p>",
          useSampleTextAsDefault: true,
          guidanceSources: GUIDANCE,
        }),
        makeRawQuestion({
          versionedQuestionId: 203,
          questionText: "Primary metadata standard",
          json: JSON.stringify({
            type: "selectBox",
            options: [
              { label: "ISO 19115", value: "iso19115" },
              { label: "DataCite", value: "datacite" },
            ],
          }),
        }),
        makeRawQuestion({
          versionedQuestionId: 204,
          questionText: "Repositories you will deposit to",
          json: JSON.stringify({
            type: "multiselectBox",
            options: [
              { label: "Dryad", value: "dryad" },
              { label: "Zenodo", value: "zenodo" },
              { label: "PANGAEA", value: "pangaea" },
            ],
          }),
        }),
        makeRawQuestion({
          versionedQuestionId: 205,
          questionText: "First deposit date",
          json: JSON.stringify({ type: "date", attributes: {} }),
        }),
        makeRawQuestion({
          versionedQuestionId: 206,
          questionText: "Field season",
          json: JSON.stringify({
            type: "dateRange",
            columns: { start: { label: "Start" }, end: { label: "End" } },
          }),
          hasAnswer: true,
          answer: makeRawAnswer(
            "dateRange",
            { start: "2026-05-15", end: "2026-07-05" },
            { id: 206, modified: MODIFIED }
          ),
        }),
      ],
    }),
    makeRawSection({
      sectionType: "CUSTOM",
      customSectionId: 3,
      displayOrder: 3,
      title: "Retention and archive",
      introduction: "<p>Added by your organization for local retention rules.</p>",
      questions: [
        makeRawQuestion({
          questionType: "CUSTOM",
          customQuestionId: 301,
          questionText: "Minimum retention period (years)",
          json: JSON.stringify({ type: "number", attributes: { min: 0 } }),
          hasAnswer: true,
          answer: makeRawAnswer("number", 10, { id: 301, modified: MODIFIED }),
        }),
        makeRawQuestion({
          questionType: "CUSTOM",
          customQuestionId: 302,
          questionText: "Expected sample count",
          json: JSON.stringify({
            type: "numberRange",
            columns: { start: { label: "Minimum" }, end: { label: "Maximum" } },
          }),
        }),
        makeRawQuestion({
          questionType: "CUSTOM",
          customQuestionId: 303,
          questionText: "Annual preservation cost",
          json: JSON.stringify({ type: "currency", attributes: { denomination: "USD" } }),
        }),
        makeRawQuestion({
          questionType: "CUSTOM",
          customQuestionId: 304,
          questionText: "Campus repository URL",
          json: JSON.stringify({ type: "url", attributes: {} }),
        }),
        makeRawQuestion({
          questionType: "CUSTOM",
          customQuestionId: 305,
          questionText: "Data steward contact email",
          json: JSON.stringify({ type: "email", attributes: {} }),
        }),
      ],
    }),
  ],
});

export const mockMe: PlanAuthoringMe = makeRawMe({
  ...CURRENT_USER,
  affiliation: {
    name: "University of California CDL",
    displayName: "University of California CDL",
    searchName: "University of California CDL",
    uri: CDL,
    feedbackEnabled: false,
  },
});

export const MOCK_PLAN_DOCUMENT: PlanDocument = {
  fileName: "Coastal_Ocean_DMP_Frost_2026.pdf",
  fileType: "PDF",
  doi: "https://doi.org/10.48321/D116c4ef8f",
  modified: "04-13-2026",
  created: "04-13-2026",
  downloadHref: "#",
};
