import type { FunderTemplate } from "./useFunderTemplates";

const NIH_POLICY_LINKS = [
  { id: 101, text: "Final NIH Policy for Data Management and Sharing", url: "https://grants.nih.gov/grants/guide/notice-files/NOT-OD-21-013.html" },
  { id: 102, text: "Elements of an NIH Data Management and Sharing Plan", url: "https://grants.nih.gov/grants/guide/notice-files/NOT-OD-21-014.html" },
];

export const stubFunderTemplates: FunderTemplate[] = [
  {
    id: 1,
    templateId: 1,
    name: "Agency for Healthcare Research and Quality (AHRQ)",
    ownerDisplayName: "Agency for Healthcare Research and Quality (ahrq.gov)",
    ownerURI: "https://ror.org/00wvqgd19",
    modified: "2024-06-27T00:00:00Z",
    funderLinks: [
      { id: 1, text: "AHRQ DMP Notice Number: NOT-HS-25-011", url: "https://www.ahrq.gov/funding/policies/index.html" },
    ],
    samplePlanLinks: [],
  },
  {
    id: 2,
    templateId: 2,
    name: "Alfred P. Sloan Foundation",
    ownerDisplayName: "Alfred P. Sloan Foundation (sloan.org)",
    ownerURI: "https://ror.org/052csg198",
    modified: "2024-06-27T00:00:00Z",
    funderLinks: [
      { id: 2, text: "Sloan Grant Proposal Guidelines", url: "https://sloan.org/grants/apply" },
    ],
    samplePlanLinks: [],
  },
  {
    id: 3,
    templateId: 3,
    name: "Atlantic Offshore Research (RWSC & ROSA)",
    ownerDisplayName: "Regional Wildlife Science Collaborative",
    ownerURI: "https://ror.org/rwsc-stub",
    modified: "2026-05-28T00:00:00Z",
    funderLinks: [],
    samplePlanLinks: [],
  },
  {
    id: 4,
    templateId: 4,
    name: "DataWorks! Data Management and Sharing Plan Challenge",
    ownerDisplayName: "Federation of American Societies for Experimental Biology (faseb.org)",
    ownerURI: "https://ror.org/02s8hkz05",
    modified: "2024-06-27T00:00:00Z",
    funderLinks: [
      { id: 3, text: "Call for Submissions to the DataWorks! Data Management and Sharing Plan Challenge", url: "https://www.faseb.org/data-management-and-sharing/dataworks" },
      ...NIH_POLICY_LINKS,
    ],
    samplePlanLinks: [],
  },
  {
    id: 5,
    templateId: 5,
    name: "Department of Defense (DOD)",
    ownerDisplayName: "United States Department of Defense (DOD) (defense.gov)",
    ownerURI: "https://ror.org/0447fe631",
    modified: "2024-06-27T00:00:00Z",
    funderLinks: [
      { id: 4, text: "DOD Public Access Plan", url: "https://www.defense.gov" },
      { id: 5, text: "DoD Scientific and Technical Information Program (STIP)", url: "https://discover.dtic.mil" },
    ],
    samplePlanLinks: [],
  },
  {
    id: 6,
    templateId: 6,
    name: "Department of Energy (DOE): Generic (2025 Update)",
    ownerDisplayName: "United States Department of Energy (DOE) (energy.gov)",
    ownerURI: "https://ror.org/01bj3aw27",
    modified: "2026-03-13T00:00:00Z",
    funderLinks: [
      { id: 6, text: "DOE Requirements and Guidance for Digital Research Data Management", url: "https://www.energy.gov/datamanagement" },
      { id: 7, text: "DOE Public Access Plan", url: "https://www.osti.gov" },
    ],
    samplePlanLinks: [],
  },
  {
    id: 7,
    templateId: 7,
    name: "Department of Energy (DOE): Office of Energy Efficiency and Renewable Energy (EERE)",
    ownerDisplayName: "United States Department of Energy (DOE) (energy.gov)",
    ownerURI: "https://ror.org/01bj3aw27",
    modified: "2024-06-27T00:00:00Z",
    funderLinks: [
      { id: 8, text: "EERE Digital Data Management", url: "https://www.energy.gov/eere/funding/eere-digital-data-management" },
    ],
    samplePlanLinks: [],
  },
  {
    id: 8,
    templateId: 8,
    name: "Digital Curation Centre",
    ownerDisplayName: "Digital Curation Centre (dcc.ac.uk)",
    ownerURI: "https://ror.org/05rz7cq31",
    modified: "2024-06-27T00:00:00Z",
    funderLinks: [],
    samplePlanLinks: [],
  },
  {
    id: 9,
    templateId: 9,
    name: "Gordon and Betty Moore Foundation",
    ownerDisplayName: "Gordon and Betty Moore Foundation (GBMF) (moore.org)",
    ownerURI: "https://ror.org/006wxqw41",
    modified: "2024-06-27T00:00:00Z",
    funderLinks: [
      { id: 9, text: "Moore Data Sharing Philosophy", url: "https://www.moore.org" },
    ],
    samplePlanLinks: [
      { id: 10, text: "Moore Sample Plan 1", url: "https://www.moore.org" },
      { id: 11, text: "Moore Sample Plan 2", url: "https://www.moore.org" },
    ],
  },
  {
    id: 10,
    templateId: 10,
    name: "National Institutes of Health (NIH): Default DMSP",
    ownerDisplayName: "National Institutes of Health (nih.gov)",
    ownerURI: "https://ror.org/01cwqze88",
    modified: "2025-11-02T00:00:00Z",
    funderLinks: [
      ...NIH_POLICY_LINKS,
      { id: 103, text: "Allowable Costs for Data Management and Sharing", url: "https://grants.nih.gov/grants/guide/notice-files/NOT-OD-21-015.html" },
    ],
    samplePlanLinks: [
      { id: 12, text: null, url: "https://sharing.nih.gov/data-management-and-sharing-policy/planning-and-budgeting-for-data-management-and-sharing/writing-a-data-management-and-sharing-plan" },
    ],
  },
  {
    id: 11,
    templateId: 11,
    name: "National Science Foundation (NSF): Generic",
    ownerDisplayName: "National Science Foundation (nsf.gov)",
    ownerURI: "https://ror.org/021nxhr62",
    modified: "2025-01-15T00:00:00Z",
    funderLinks: [
      { id: 13, text: "NSF Proposal & Award Policies & Procedures Guide", url: "https://www.nsf.gov/policies/pappg" },
    ],
    samplePlanLinks: [],
  },
  {
    id: 12,
    templateId: 12,
    name: "U.S. Geological Survey (USGS)",
    ownerDisplayName: "U.S. Geological Survey (usgs.gov)",
    ownerURI: "https://ror.org/035a68863",
    modified: "2023-09-08T00:00:00Z",
    funderLinks: [
      { id: 14, text: "USGS Data Management Plans", url: "https://www.usgs.gov/data-management/data-management-plans" },
    ],
    samplePlanLinks: [],
  },
];
