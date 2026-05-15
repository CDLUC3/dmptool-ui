/* eslint-disable */
import { TypedDocumentNode as DocumentNode } from '@graphql-typed-document-node/core';
export type Maybe<T> = T | null;
export type InputMaybe<T> = T | null | undefined;
export type Exact<T extends { [key: string]: unknown }> = { [K in keyof T]: T[K] };
export type MakeOptional<T, K extends keyof T> = Omit<T, K> & { [SubKey in K]?: Maybe<T[SubKey]> };
export type MakeMaybe<T, K extends keyof T> = Omit<T, K> & { [SubKey in K]: Maybe<T[SubKey]> };
export type MakeEmpty<T extends { [key: string]: unknown }, K extends keyof T> = { [_ in K]?: never };
export type Incremental<T> = T | { [P in keyof T]?: P extends ' $fragmentName' | '__typename' ? T[P] : never };
/** All built-in and custom scalars, mapped to their actual values */
export type Scalars = {
  ID: { input: string; output: string; }
  String: { input: string; output: string; }
  Boolean: { input: boolean; output: boolean; }
  Int: { input: number; output: number; }
  Float: { input: number; output: number; }
  DateTimeISO: { input: any; output: any; }
  /** A Data Management and Sharing Plan's (DMSP) ID */
  DmspId: { input: any; output: any; }
  EmailAddress: { input: any; output: any; }
  /** An MD5 hash, represented as a 32-character hexadecimal string. */
  MD5: { input: any; output: any; }
  /** A researcher ORCID */
  Orcid: { input: any; output: any; }
  /**
   * Repository type values follow the re3data standard:
   * - disciplinary: A discipline specific repository (e.g. GeneCards, Arctic Data Centre, etc.)
   * - institutional: An institution specific repository (e.g. ASU Library Research Data Repository, etc.)
   * - other: A repository that doesn't fit into any of the other categories
   * - multidisciplinary: A repository that accepts any type of dataset, from any discipline
   * - project-related: A repository created to support a specific project or initiative (e.g. Human Genome Project)
   * - governmental: A repository owned and managed by a government entity (e.g. NCBI, NASA)
   */
  RepositoryTypeValue: { input: any; output: any; }
  /** An organization ROR ID */
  Ror: { input: any; output: any; }
  URL: { input: any; output: any; }
};

/** Input parameters for adding a custom section to a funder template */
export type AddCustomQuestionInput = {
  /** Guidance to complete the question */
  guidanceText?: InputMaybe<Scalars['String']['input']>;
  /** The JSON representation of the question type */
  json?: InputMaybe<Scalars['String']['input']>;
  /** The identifier of the question this new custom question should appear after (null means it is the first question in the section) */
  pinnedQuestionId?: InputMaybe<Scalars['Int']['input']>;
  /** The type of the question this new custom question should appear after (null means it is the first question in the section) */
  pinnedQuestionType?: InputMaybe<CustomizableObjectOwnership>;
  /** This will be used as a sort of title for the Question */
  questionText?: InputMaybe<Scalars['String']['input']>;
  /** To indicate whether the question is required to be completed */
  required?: InputMaybe<Scalars['Boolean']['input']>;
  /** Requirements associated with the Question */
  requirementText?: InputMaybe<Scalars['String']['input']>;
  /** Sample text to possibly provide a starting point or example to answer question */
  sampleText?: InputMaybe<Scalars['String']['input']>;
  /** The identifier of the section this new custom question should appear within */
  sectionId: Scalars['Int']['input'];
  /** The type of the section this new custom question should appear within */
  sectionType: CustomizableObjectOwnership;
  /** The identifier of the parent template customization */
  templateCustomizationId: Scalars['Int']['input'];
  /** Boolean indicating whether we should use content from sampleText as the default answer */
  useSampleTextAsDefault?: InputMaybe<Scalars['Boolean']['input']>;
};

/** Input parameters for adding a custom section to a funder template */
export type AddCustomSectionInput = {
  /** The custom guidance for the custom section */
  guidance?: InputMaybe<Scalars['String']['input']>;
  /** The introduction to the custom section */
  introduction?: InputMaybe<Scalars['String']['input']>;
  /** The custom section name */
  name: Scalars['String']['input'];
  /** The identifier of the section this new custom section should appear after */
  pinnedSectionId?: InputMaybe<Scalars['Int']['input']>;
  /** The type of the section this new custom section should appear after */
  pinnedSectionType?: InputMaybe<CustomizableObjectOwnership>;
  /** The requirements for the custom section */
  requirements?: InputMaybe<Scalars['String']['input']>;
  /** The identifier of the parent template customization */
  templateCustomizationId: Scalars['Int']['input'];
};

/** Input for adding a new GuidanceGroup */
export type AddGuidanceGroupInput = {
  /** The affiliation (organization ror) that owns this GuidanceGroup. Optional: super-admins may set this; regular admins should omit it (their own affiliation will be used). */
  affiliationId?: InputMaybe<Scalars['String']['input']>;
  /** Whether this is a best practice GuidanceGroup */
  bestPractice?: InputMaybe<Scalars['Boolean']['input']>;
  /** The description of the GuidanceGroup */
  description?: InputMaybe<Scalars['String']['input']>;
  /** The name of the GuidanceGroup */
  name: Scalars['String']['input'];
  /** Whether this is an optional subset for departmental use */
  optionalSubset?: InputMaybe<Scalars['Boolean']['input']>;
};

/** Input for adding a new Guidance item */
export type AddGuidanceInput = {
  /** The GuidanceGroup this Guidance belongs to */
  guidanceGroupId: Scalars['Int']['input'];
  /** The guidance text content */
  guidanceText?: InputMaybe<Scalars['String']['input']>;
  /** The Tags associated with this Guidance */
  tagId?: InputMaybe<Scalars['Int']['input']>;
};

export type AddMetadataStandardInput = {
  /** A description of the metadata standard */
  description?: InputMaybe<Scalars['String']['input']>;
  /** Keywords to assist in finding the metadata standard */
  keywords?: InputMaybe<Array<Scalars['String']['input']>>;
  /** The name of the metadata standard */
  name: Scalars['String']['input'];
  /** Research domains associated with the metadata standard */
  researchDomainIds?: InputMaybe<Array<Scalars['Int']['input']>>;
  /** The taxonomy URL (do not make this up! should resolve to an HTML/JSON representation of the object) */
  uri?: InputMaybe<Scalars['String']['input']>;
};

export type AddProjectFundingInput = {
  /** The funder URI */
  affiliationId: Scalars['String']['input'];
  /** The funder's unique id/url for the call for submissions to apply for a grant */
  funderOpportunityNumber?: InputMaybe<Scalars['String']['input']>;
  /** The funder's unique id/url for the research project (normally assigned after the grant has been awarded) */
  funderProjectNumber?: InputMaybe<Scalars['String']['input']>;
  /** The funder's unique id/url for the award/grant (normally assigned after the grant has been awarded) */
  grantId?: InputMaybe<Scalars['String']['input']>;
  /** The project */
  projectId: Scalars['Int']['input'];
  /** The status of the funding resquest */
  status?: InputMaybe<ProjectFundingStatus>;
};

export type AddProjectMemberInput = {
  /** The Member's affiliation URI */
  affiliationId?: InputMaybe<Scalars['String']['input']>;
  /** The Member's affiliation name */
  affiliationName?: InputMaybe<Scalars['String']['input']>;
  /** The Member's email address */
  email?: InputMaybe<Scalars['String']['input']>;
  /** The Member's first/given name */
  givenName?: InputMaybe<Scalars['String']['input']>;
  /** The roles the Member has on the research project */
  memberRoleIds?: InputMaybe<Array<Scalars['Int']['input']>>;
  /** The Member's ORCID */
  orcid?: InputMaybe<Scalars['String']['input']>;
  /** The research project */
  projectId: Scalars['Int']['input'];
  /** The Member's last/sur name */
  surName?: InputMaybe<Scalars['String']['input']>;
};

/** Input for adding a new QuestionCondition */
export type AddQuestionConditionInput = {
  /** The action to take on a QuestionCondition */
  action: QuestionConditionActionType;
  /** Relative to the condition type, it is the value to match on (e.g., HAS_ANSWER should equate to null here) */
  conditionMatch?: InputMaybe<Scalars['String']['input']>;
  /** The type of condition in which to take the action */
  conditionType: QuestionConditionCondition;
  /** The id of the question that the QuestionCondition belongs to */
  questionId: Scalars['Int']['input'];
  /** The target of the action (e.g., an email address for SEND_EMAIL and a Question id otherwise) */
  target: Scalars['String']['input'];
};

/** Input parameters for adding custom guidance and sample text to a funder question */
export type AddQuestionCustomizationInput = {
  /** The custom guidance for the question */
  guidanceText?: InputMaybe<Scalars['String']['input']>;
  /** The custom sample answer for the question */
  sampleText?: InputMaybe<Scalars['String']['input']>;
  /** The identifier of the parent template customization */
  templateCustomizationId: Scalars['Int']['input'];
  /** The identifier of the published funder question */
  versionedQuestionId: Scalars['Int']['input'];
};

export type AddQuestionInput = {
  /** The display order of the question */
  displayOrder?: InputMaybe<Scalars['Int']['input']>;
  /** Guidance to complete the question */
  guidanceText?: InputMaybe<Scalars['String']['input']>;
  /** Whether or not the Question has had any changes since it was last published */
  isDirty?: InputMaybe<Scalars['Boolean']['input']>;
  /** The JSON representation of the question type */
  json?: InputMaybe<Scalars['String']['input']>;
  /** This will be used as a sort of title for the Question */
  questionText?: InputMaybe<Scalars['String']['input']>;
  /** To indicate whether the question is required to be completed */
  required?: InputMaybe<Scalars['Boolean']['input']>;
  /** Requirements associated with the Question */
  requirementText?: InputMaybe<Scalars['String']['input']>;
  /** Sample text to possibly provide a starting point or example to answer question */
  sampleText?: InputMaybe<Scalars['String']['input']>;
  /** The unique id of the Section that the question belongs to */
  sectionId: Scalars['Int']['input'];
  /** The unique id of the Template that the question belongs to */
  templateId: Scalars['Int']['input'];
  /** Boolean indicating whether we should use content from sampleText as the default answer */
  useSampleTextAsDefault?: InputMaybe<Scalars['Boolean']['input']>;
};

export type AddRelatedWorkManualInput = {
  /** The abstract of the work */
  abstractText?: InputMaybe<Scalars['String']['input']>;
  /** The authors of the work */
  authors: Array<AuthorInput>;
  /** The awards that funded the work */
  awards: Array<AwardInput>;
  /** The Digital Object Identifier (DOI) of the work */
  doi: Scalars['String']['input'];
  /** The funders of the work */
  funders: Array<FunderInput>;
  /** A hash of the content of this version of a work */
  hash: Scalars['MD5']['input'];
  /** The unique institutions of the authors of the work */
  institutions: Array<InstitutionInput>;
  /** The unique identifier of the plan that this related work has been matched to */
  planId?: InputMaybe<Scalars['Int']['input']>;
  /** The date that the work was published YYYY-MM-DD */
  publicationDate?: InputMaybe<Scalars['String']['input']>;
  /** The venue where the work was published, e.g. IEEE Transactions on Software Engineering, Zenodo etc */
  publicationVenue?: InputMaybe<Scalars['String']['input']>;
  /** The name of the source where the work was found */
  sourceName: Scalars['String']['input'];
  /** The URL for the source of the work */
  sourceUrl: Scalars['String']['input'];
  /** The title of the work */
  title?: InputMaybe<Scalars['String']['input']>;
  /** The type of the work */
  workType: WorkType;
};

export type AddRepositoryInput = {
  /** A description of the repository */
  description?: InputMaybe<Scalars['String']['input']>;
  /** Keywords to assist in finding the repository */
  keywords?: InputMaybe<Array<Scalars['String']['input']>>;
  /** The name of the repository */
  name: Scalars['String']['input'];
  /** The re3data identifier if this is a local copy of re3data information (e.g. 'r3d100014782') */
  re3dataId?: InputMaybe<Scalars['String']['input']>;
  /** The Categories/Types of the repository */
  repositoryTypes?: InputMaybe<Array<Scalars['String']['input']>>;
  /** Research domains associated with the repository */
  researchDomainIds?: InputMaybe<Array<Scalars['Int']['input']>>;
  /** The taxonomy URL (do not make this up! should resolve to an HTML/JSON representation of the object) */
  uri?: InputMaybe<Scalars['String']['input']>;
  /** The website URL */
  website?: InputMaybe<Scalars['String']['input']>;
};

/** Input parameters for adding custom guidance to a funder section */
export type AddSectionCustomizationInput = {
  /** The identifier of the parent template customization */
  templateCustomizationId: Scalars['Int']['input'];
  /** The identifier of the published funder section */
  versionedSectionId: Scalars['Int']['input'];
};

/** Input for adding a new section */
export type AddSectionInput = {
  /** The Section you want to copy from */
  copyFromVersionedSectionId?: InputMaybe<Scalars['Int']['input']>;
  /** The order in which the section will be displayed in the template */
  displayOrder?: InputMaybe<Scalars['Int']['input']>;
  /** The guidance to help user with section */
  guidance?: InputMaybe<Scalars['String']['input']>;
  /** The section introduction */
  introduction?: InputMaybe<Scalars['String']['input']>;
  /** The section name */
  name: Scalars['String']['input'];
  /** Requirements that a user must consider in this section */
  requirements?: InputMaybe<Scalars['String']['input']>;
  /** The Tags associated with this section. A section might not have any tags */
  tags?: InputMaybe<Array<TagInput>>;
  /** The id of the template that the section belongs to */
  templateId: Scalars['Int']['input'];
};

/** Input parameters for adding a new Template Customization */
export type AddTemplateCustomizationInput = {
  /** The status of the customization. Defaults to DRAFT if not specified */
  status: TemplateCustomizationStatus;
  /** The id of the published funder template */
  versionedTemplateId: Scalars['Int']['input'];
};

/** A respresentation of an institution, organization or company */
export type Affiliation = {
  __typename?: 'Affiliation';
  /** Acronyms for the affiliation */
  acronyms?: Maybe<Array<Scalars['String']['output']>>;
  /** Whether or not the affiliation is active. Inactive records should not appear in typeaheads! */
  active: Scalars['Boolean']['output'];
  /** Alias names for the affiliation */
  aliases?: Maybe<Array<Scalars['String']['output']>>;
  /** The API URL that can be used to search for project/award information */
  apiTarget?: Maybe<Scalars['String']['output']>;
  /** The primary contact email */
  contactEmail?: Maybe<Scalars['String']['output']>;
  /** The primary contact name */
  contactName?: Maybe<Scalars['String']['output']>;
  /** The timestamp when the Object was created */
  created?: Maybe<Scalars['String']['output']>;
  /** The user who created the Object */
  createdById?: Maybe<Scalars['Int']['output']>;
  /** The display name to help disambiguate similar names (typically with domain or country appended) */
  displayName: Scalars['String']['output'];
  /** Any errors with the Object */
  errors?: Maybe<AffiliationErrors>;
  /** The email address(es) to notify when feedback has been requested (stored as JSON array) */
  feedbackEmails?: Maybe<Array<Scalars['String']['output']>>;
  /** Whether or not the affiliation wants to use the feedback workflow */
  feedbackEnabled: Scalars['Boolean']['output'];
  /** The message to display to users when they request feedback */
  feedbackMessage?: Maybe<Scalars['String']['output']>;
  /** Whether or not this affiliation is a funder */
  funder: Scalars['Boolean']['output'];
  /** The Crossref Funder id */
  fundrefId?: Maybe<Scalars['String']['output']>;
  guidanceGroups?: Maybe<Array<GuidanceGroup>>;
  /** The official homepage for the affiliation */
  homepage?: Maybe<Scalars['String']['output']>;
  /** The unique identifer for the affiliation (assigned by the Database) */
  id?: Maybe<Scalars['Int']['output']>;
  /** The logo file name */
  logoName?: Maybe<Scalars['String']['output']>;
  /** The URI of the logo */
  logoURI?: Maybe<Scalars['String']['output']>;
  /** Whether or not the affiliation is allowed to have administrators */
  managed: Scalars['Boolean']['output'];
  /** The timestamp when the Object was last modifed */
  modified?: Maybe<Scalars['String']['output']>;
  /** The user who last modified the Object */
  modifiedById?: Maybe<Scalars['Int']['output']>;
  /** The official name for the affiliation (defined by the system of provenance) */
  name: Scalars['String']['output'];
  /** The system the affiliation's data came from (e.g. ROR, DMPTool, etc.) */
  provenance: Scalars['String']['output'];
  /** The combined name, homepage, aliases and acronyms to facilitate search */
  searchName: Scalars['String']['output'];
  /** The email domains associated with the affiliation (for SSO) */
  ssoEmailDomains?: Maybe<Array<AffiliationEmailDomain>>;
  /** The SSO entityId */
  ssoEntityId?: Maybe<Scalars['String']['output']>;
  /** The links the affiliation's users can use to get help */
  subHeaderLinks?: Maybe<Array<AffiliationLink>>;
  /** The types of the affiliation (e.g. Company, Education, Government, etc.) */
  types: Array<AffiliationType>;
  /** The properties of this object that are NOT editable. Determined by the record's provenance */
  uneditableProperties: Array<Scalars['String']['output']>;
  /** The unique identifer for the affiliation (assigned by the provenance e.g. https://ror.org/12345) */
  uri: Scalars['String']['output'];
};

/** Email domains linked to the affiliation for purposes of determining if SSO is applicable */
export type AffiliationEmailDomain = {
  __typename?: 'AffiliationEmailDomain';
  /** The email domain (e.g. example.com, law.example.com, etc.) */
  domain: Scalars['String']['output'];
  /** Unique identifier for the email domain */
  id: Scalars['Int']['output'];
};

/** Input for email domains linked to the affiliation for purposes of determining if SSO is applicable */
export type AffiliationEmailDomainInput = {
  /** The email domain (e.g. example.com, law.example.com, etc.) */
  domain: Scalars['String']['input'];
  /** Unique identifier for the email domain */
  id: Scalars['Int']['input'];
};

/** A collection of errors related to the Answer */
export type AffiliationErrors = {
  __typename?: 'AffiliationErrors';
  acronyms?: Maybe<Scalars['String']['output']>;
  aliases?: Maybe<Scalars['String']['output']>;
  contactEmail?: Maybe<Scalars['String']['output']>;
  contactName?: Maybe<Scalars['String']['output']>;
  displayName?: Maybe<Scalars['String']['output']>;
  feedbackEmails?: Maybe<Scalars['String']['output']>;
  feedbackMessage?: Maybe<Scalars['String']['output']>;
  fundrefId?: Maybe<Scalars['String']['output']>;
  /** General error messages such as affiliation already exists */
  general?: Maybe<Scalars['String']['output']>;
  homepage?: Maybe<Scalars['String']['output']>;
  json?: Maybe<Scalars['String']['output']>;
  logoName?: Maybe<Scalars['String']['output']>;
  logoURI?: Maybe<Scalars['String']['output']>;
  name?: Maybe<Scalars['String']['output']>;
  planId?: Maybe<Scalars['String']['output']>;
  provenance?: Maybe<Scalars['String']['output']>;
  searchName?: Maybe<Scalars['String']['output']>;
  ssoEntityId?: Maybe<Scalars['String']['output']>;
  subHeaderLinks?: Maybe<Scalars['String']['output']>;
  types?: Maybe<Scalars['String']['output']>;
  uri?: Maybe<Scalars['String']['output']>;
  versionedQuestionId?: Maybe<Scalars['String']['output']>;
  versionedSectionId?: Maybe<Scalars['String']['output']>;
};

/** Input options for adding an Affiliation */
export type AffiliationInput = {
  /** Acronyms for the affiliation */
  acronyms?: InputMaybe<Array<Scalars['String']['input']>>;
  /** Whether or not the Affiliation is active and available in search results */
  active?: InputMaybe<Scalars['Boolean']['input']>;
  /** Alias names for the affiliation */
  aliases?: InputMaybe<Array<Scalars['String']['input']>>;
  /** The primary contact email */
  contactEmail?: InputMaybe<Scalars['String']['input']>;
  /** The primary contact name */
  contactName?: InputMaybe<Scalars['String']['input']>;
  /** The display name to help disambiguate similar names (typically with domain or country appended) */
  displayName?: InputMaybe<Scalars['String']['input']>;
  /** The email address(es) to notify when feedback has been requested (stored as JSON array) */
  feedbackEmails?: InputMaybe<Array<InputMaybe<Scalars['String']['input']>>>;
  /** Whether or not the affiliation wants to use the feedback workflow */
  feedbackEnabled?: InputMaybe<Scalars['Boolean']['input']>;
  /** The message to display to users when they request feedback */
  feedbackMessage?: InputMaybe<Scalars['String']['input']>;
  /** Whether or not this affiliation is a funder */
  funder?: InputMaybe<Scalars['Boolean']['input']>;
  /** The Crossref Funder id */
  fundrefId?: InputMaybe<Scalars['String']['input']>;
  /** The official homepage for the affiliation */
  homepage?: InputMaybe<Scalars['String']['input']>;
  /** The id of the affiliation */
  id?: InputMaybe<Scalars['Int']['input']>;
  /** The logo file name */
  logoName?: InputMaybe<Scalars['String']['input']>;
  /** The URI of the logo */
  logoURI?: InputMaybe<Scalars['String']['input']>;
  /** Whether or not the affiliation is allowed to have administrators */
  managed?: InputMaybe<Scalars['Boolean']['input']>;
  /** The official name for the affiliation (defined by the system of provenance) */
  name: Scalars['String']['input'];
  /** The email domains associated with the affiliation (for SSO) */
  ssoEmailDomains?: InputMaybe<Array<AffiliationEmailDomainInput>>;
  /** The SSO entityId */
  ssoEntityId?: InputMaybe<Scalars['String']['input']>;
  /** The links the affiliation's users can use to get help */
  subHeaderLinks?: InputMaybe<Array<AffiliationLinkInput>>;
  /** The types of the affiliation (e.g. Company, Education, Government, etc.) */
  types?: InputMaybe<Array<AffiliationType>>;
  /** The unique identifer for the affiliation (Not editable!) */
  uri?: InputMaybe<Scalars['String']['input']>;
};

/** A hyperlink displayed in the sub-header of the UI for the afiliation's users */
export type AffiliationLink = {
  __typename?: 'AffiliationLink';
  /** Unique identifier for the link */
  id: Scalars['Int']['output'];
  /** The text to display (e.g. Helpdesk, Grants Office, etc.) */
  text?: Maybe<Scalars['String']['output']>;
  /** The URL */
  url: Scalars['String']['output'];
};

/** Input for a hyperlink displayed in the sub-header of the UI for the afiliation's users */
export type AffiliationLinkInput = {
  /** Unique identifier for the link */
  id: Scalars['Int']['input'];
  /** The text to display (e.g. Helpdesk, Grants Office, etc.) */
  text?: InputMaybe<Scalars['String']['input']>;
  /** The URL */
  url: Scalars['String']['input'];
};

/** The provenance of an Affiliation record */
export enum AffiliationProvenance {
  /** Created and managed within the DMPTool */
  Dmptool = 'DMPTOOL',
  /** Created and managed by the Research Organization Registry (ROR) https://ror.org */
  Ror = 'ROR'
}

/** Search result - An abbreviated version of an Affiliation */
export type AffiliationSearch = {
  __typename?: 'AffiliationSearch';
  /** The acronyms for the affiliation */
  acronyms?: Maybe<Array<Scalars['String']['output']>>;
  /** Has an API that be used to search for project/award information */
  apiTarget?: Maybe<Scalars['String']['output']>;
  /** The official display name */
  displayName: Scalars['String']['output'];
  /** Whether or not this affiliation is a funder */
  funder: Scalars['Boolean']['output'];
  /** The unique identifer for the affiliation */
  id: Scalars['Int']['output'];
  /** The categories the Affiliation belongs to */
  types?: Maybe<Array<AffiliationType>>;
  /** The URI of the affiliation (typically the ROR id) */
  uri: Scalars['String']['output'];
};

export type AffiliationSearchResults = PaginatedQueryResults & {
  __typename?: 'AffiliationSearchResults';
  /** The sortFields that are available for this query (for standard offset pagination only!) */
  availableSortFields?: Maybe<Array<Maybe<Scalars['String']['output']>>>;
  /** The current offset of the results (for standard offset pagination) */
  currentOffset?: Maybe<Scalars['Int']['output']>;
  /** Whether or not there is a next page */
  hasNextPage?: Maybe<Scalars['Boolean']['output']>;
  /** Whether or not there is a previous page */
  hasPreviousPage?: Maybe<Scalars['Boolean']['output']>;
  /** The TemplateSearchResults that match the search criteria */
  items?: Maybe<Array<Maybe<AffiliationSearch>>>;
  /** The number of items returned */
  limit?: Maybe<Scalars['Int']['output']>;
  /** The cursor to use for the next page of results (for infinite scroll/load more) */
  nextCursor?: Maybe<Scalars['String']['output']>;
  /** The total number of possible items */
  totalCount?: Maybe<Scalars['Int']['output']>;
};

/** Categories for Affiliation */
export enum AffiliationType {
  Archive = 'ARCHIVE',
  Company = 'COMPANY',
  Education = 'EDUCATION',
  Facility = 'FACILITY',
  Government = 'GOVERNMENT',
  Healthcare = 'HEALTHCARE',
  Nonprofit = 'NONPROFIT',
  Other = 'OTHER'
}

export type AlternateIdentifier = {
  __typename?: 'AlternateIdentifier';
  /** The alternate identifier */
  alternateIdentifier?: Maybe<Scalars['String']['output']>;
  /** The timestamp when the Object was created */
  created?: Maybe<Scalars['String']['output']>;
  /** The user who created the Object */
  createdById?: Maybe<Scalars['Int']['output']>;
  /** Errors associated with the Object */
  errors?: Maybe<AlternateIdentifierErrors>;
  /** The unique identifer for the Object */
  id?: Maybe<Scalars['Int']['output']>;
  /** The timestamp when the Object was last modifed */
  modified?: Maybe<Scalars['String']['output']>;
  /** The user who last modified the Object */
  modifiedById?: Maybe<Scalars['Int']['output']>;
  /** The plan associated with the alternate identifier */
  plan?: Maybe<Plan>;
  /** The user who created the plan */
  planCreator?: Maybe<User>;
};

/** Errors associated with the AlternateIdentifier */
export type AlternateIdentifierErrors = {
  __typename?: 'AlternateIdentifierErrors';
  alternateIdentifier?: Maybe<Scalars['String']['output']>;
  general?: Maybe<Scalars['String']['output']>;
  planId?: Maybe<Scalars['String']['output']>;
};

/** An answer to a question on a Data Managament Plan (DMP) */
export type Answer = {
  __typename?: 'Answer';
  /** The comments associated with the answer */
  comments?: Maybe<Array<AnswerComment>>;
  /** The timestamp when the Object was created */
  created?: Maybe<Scalars['String']['output']>;
  /** The user who created the Object */
  createdById?: Maybe<Scalars['Int']['output']>;
  /** Errors associated with the Object */
  errors?: Maybe<AffiliationErrors>;
  /** The feedback comments associated with the answer */
  feedbackComments?: Maybe<Array<PlanFeedbackComment>>;
  /** The unique identifer for the Object */
  id?: Maybe<Scalars['Int']['output']>;
  /** The answer to the question */
  json?: Maybe<Scalars['String']['output']>;
  /** The timestamp when the Object was last modifed */
  modified?: Maybe<Scalars['String']['output']>;
  /** The user who last modified the Object */
  modifiedById?: Maybe<Scalars['Int']['output']>;
  /** The DMP that the answer belongs to */
  plan?: Maybe<Plan>;
  /** The custom question the answer is for */
  versionedCustomQuestion?: Maybe<VersionedCustomQuestion>;
  /** The custom section the answer is for */
  versionedCustomSection?: Maybe<VersionedCustomSection>;
  /** The question in the template the answer is for */
  versionedQuestion?: Maybe<VersionedQuestion>;
  /** The question in the template the answer is for */
  versionedSection?: Maybe<VersionedSection>;
};

export type AnswerComment = {
  __typename?: 'AnswerComment';
  /** The answer the comment is associated with */
  answerId: Scalars['Int']['output'];
  /** The comment */
  commentText: Scalars['String']['output'];
  /** The timestamp when the Object was created */
  created?: Maybe<Scalars['String']['output']>;
  /** The user who created the Object */
  createdById?: Maybe<Scalars['Int']['output']>;
  /** Errors associated with the Object */
  errors?: Maybe<AnswerCommentErrors>;
  /** The unique identifer for the Object */
  id?: Maybe<Scalars['Int']['output']>;
  /** The timestamp when the Object was last modifed */
  modified?: Maybe<Scalars['String']['output']>;
  /** The user who last modified the Object */
  modifiedById?: Maybe<Scalars['Int']['output']>;
  /** User who made the comment */
  user?: Maybe<User>;
};

/** A collection of errors related to the Answer Comment */
export type AnswerCommentErrors = {
  __typename?: 'AnswerCommentErrors';
  answerId?: Maybe<Scalars['String']['output']>;
  commentText?: Maybe<Scalars['String']['output']>;
  /** General error messages such as affiliation already exists */
  general?: Maybe<Scalars['String']['output']>;
};

/** An author of a work */
export type Author = {
  __typename?: 'Author';
  /** The author's first initial */
  firstInitial?: Maybe<Scalars['String']['output']>;
  /** The author's full name */
  full?: Maybe<Scalars['String']['output']>;
  /** The author's given name */
  givenName?: Maybe<Scalars['String']['output']>;
  /** The author's middle initials */
  middleInitials?: Maybe<Scalars['String']['output']>;
  /** The author's middle names */
  middleNames?: Maybe<Scalars['String']['output']>;
  /** The author's ORCID ID */
  orcid?: Maybe<Scalars['String']['output']>;
  /** The author's surname */
  surname?: Maybe<Scalars['String']['output']>;
};

/** An author of a work */
export type AuthorInput = {
  /** The author's first initial */
  firstInitial?: InputMaybe<Scalars['String']['input']>;
  /** The author's full name */
  full?: InputMaybe<Scalars['String']['input']>;
  /** The author's given name */
  givenName?: InputMaybe<Scalars['String']['input']>;
  /** The author's middle initials */
  middleInitials?: InputMaybe<Scalars['String']['input']>;
  /** The author's middle names */
  middleNames?: InputMaybe<Scalars['String']['input']>;
  /** The author's ORCID ID */
  orcid?: InputMaybe<Scalars['String']['input']>;
  /** The author's surname */
  surname?: InputMaybe<Scalars['String']['input']>;
};

/** An award that funded a work */
export type Award = {
  __typename?: 'Award';
  /** The Award ID */
  awardId?: Maybe<Scalars['String']['output']>;
};

/** An award that funded a work */
export type AwardInput = {
  /** The Award ID */
  awardId: Scalars['String']['input'];
};

/** The result of the findCollaborator query */
export type CollaboratorSearchResult = {
  __typename?: 'CollaboratorSearchResult';
  /** The collaborator's affiliation ID (ROR URL) */
  affiliationId?: Maybe<Scalars['String']['output']>;
  /** The collaborator's affiliation name */
  affiliationName?: Maybe<Scalars['String']['output']>;
  /** The affiliation's ROR ID */
  affiliationRORId?: Maybe<Scalars['String']['output']>;
  /** The affiliation's ROR URL */
  affiliationURL?: Maybe<Scalars['String']['output']>;
  /** The collaborator's email */
  email?: Maybe<Scalars['String']['output']>;
  /** The collaborator's first/given name */
  givenName?: Maybe<Scalars['String']['output']>;
  /** The unique identifier for the Object */
  id?: Maybe<Scalars['Int']['output']>;
  /** The collaborator's ORCID */
  orcid?: Maybe<Scalars['String']['output']>;
  /** The collaborator's last/sur name */
  surName?: Maybe<Scalars['String']['output']>;
};

export type CollaboratorSearchResults = PaginatedQueryResults & {
  __typename?: 'CollaboratorSearchResults';
  /** The sortFields that are available for this query (for standard offset pagination only!) */
  availableSortFields?: Maybe<Array<Maybe<Scalars['String']['output']>>>;
  /** The current offset of the results (for standard offset pagination) */
  currentOffset?: Maybe<Scalars['Int']['output']>;
  /** Whether or not there is a next page */
  hasNextPage?: Maybe<Scalars['Boolean']['output']>;
  /** Whether or not there is a previous page */
  hasPreviousPage?: Maybe<Scalars['Boolean']['output']>;
  /** The TemplateSearchResults that match the search criteria */
  items?: Maybe<Array<Maybe<CollaboratorSearchResult>>>;
  /** The number of items returned */
  limit?: Maybe<Scalars['Int']['output']>;
  /** The cursor to use for the next page of results (for infinite scroll/load more) */
  nextCursor?: Maybe<Scalars['String']['output']>;
  /** The total number of possible items */
  totalCount?: Maybe<Scalars['Int']['output']>;
};

export type ContentMatch = {
  __typename?: 'ContentMatch';
  /** Highlighted fragments from the abstract showing relevant matched terms */
  abstractHighlights: Array<Scalars['String']['output']>;
  /** The confidence score indicating how well the work content matches the plan content */
  score: Scalars['Float']['output'];
  /** Highlighted title showing relevant matched terms */
  titleHighlight?: Maybe<Scalars['String']['output']>;
};

/** A question created/owned by the affiliation that owns the customization */
export type CustomQuestion = {
  __typename?: 'CustomQuestion';
  /** The timestamp when the Object was created */
  created?: Maybe<Scalars['String']['output']>;
  /** The user who created the Object */
  createdById?: Maybe<Scalars['Int']['output']>;
  /** Errors associated with the Object */
  errors?: Maybe<CustomQuestionErrors>;
  /** Guidance to help the user answer the question */
  guidanceText?: Maybe<Scalars['String']['output']>;
  /** The unique identifier for the Object */
  id?: Maybe<Scalars['Int']['output']>;
  /** The JSON representation of the question type */
  json?: Maybe<Scalars['String']['output']>;
  /** The current status of the customization with regard to the base funder template */
  migrationStatus: TemplateCustomizationMigrationStatus;
  /** The timestamp when the Object was last modifed */
  modified?: Maybe<Scalars['String']['output']>;
  /** The user who last modified the Object */
  modifiedById?: Maybe<Scalars['Int']['output']>;
  /** The id of the VersionedQuestion or CustomQuestion this CustomQuestion is pinned to (null means it is the first question in the section) */
  pinnedQuestionId?: Maybe<Scalars['Int']['output']>;
  /** The type (BASE: VersionedQuestion, CUSTOM: CustomQuestion) this CustomQuestion is pinned to (null means it is the first question in the section) */
  pinnedQuestionType?: Maybe<CustomizableObjectOwnership>;
  /** The question text */
  questionText?: Maybe<Scalars['String']['output']>;
  /** Whether the user is required to answer the question */
  required?: Maybe<Scalars['Boolean']['output']>;
  /** Requirements a user must consider when answering this question */
  requirementText?: Maybe<Scalars['String']['output']>;
  /** An example answer for the question */
  sampleText?: Maybe<Scalars['String']['output']>;
  /** The id of the section this question belongs to */
  sectionId: Scalars['Int']['output'];
  /** The type of the section (VersionedSection or CustomSection) this question belongs to */
  sectionType: CustomizableObjectOwnership;
  /** The identifier of the parent template customization */
  templateCustomizationId: Scalars['Int']['output'];
  /** Whether the sample answer should be used as the default answer */
  useSampleTextAsDefault?: Maybe<Scalars['Boolean']['output']>;
};

/** Errors related to the CustomSection */
export type CustomQuestionErrors = {
  __typename?: 'CustomQuestionErrors';
  /** General error messages such as the object already exists */
  general?: Maybe<Scalars['String']['output']>;
  guidanceText?: Maybe<Scalars['String']['output']>;
  json?: Maybe<Scalars['String']['output']>;
  migrationStatus?: Maybe<Scalars['String']['output']>;
  pinnedQuestionId?: Maybe<Scalars['String']['output']>;
  pinnedQuestionType?: Maybe<Scalars['String']['output']>;
  questionText?: Maybe<Scalars['String']['output']>;
  required?: Maybe<Scalars['String']['output']>;
  requirementText?: Maybe<Scalars['String']['output']>;
  sampleText?: Maybe<Scalars['String']['output']>;
  sectionId?: Maybe<Scalars['String']['output']>;
  sectionType?: Maybe<Scalars['String']['output']>;
  templateCustomizationId?: Maybe<Scalars['String']['output']>;
  useSampleTextAsDefault?: Maybe<Scalars['String']['output']>;
};

/** A custom repository where research outputs are preserved (database-backed) */
export type CustomRepository = {
  __typename?: 'CustomRepository';
  /** The timestamp when the Object was created */
  created?: Maybe<Scalars['String']['output']>;
  /** The user who created the Object */
  createdById?: Maybe<Scalars['Int']['output']>;
  /** A description of the repository */
  description?: Maybe<Scalars['String']['output']>;
  /** Errors associated with the Object */
  errors?: Maybe<RepositoryErrors>;
  /** The unique identifer for the Object (returns as String for compatibility with Re3DataRepository) */
  id: Scalars['String']['output'];
  /** Keywords to assist in finding the repository */
  keywords?: Maybe<Array<Scalars['String']['output']>>;
  /** The timestamp when the Object was last modifed */
  modified?: Maybe<Scalars['String']['output']>;
  /** The user who last modified the Object */
  modifiedById?: Maybe<Scalars['Int']['output']>;
  /** The name of the repository */
  name: Scalars['String']['output'];
  /** The re3data identifier if this is a local copy of re3data information (e.g. 'r3d100014782') */
  re3dataId?: Maybe<Scalars['String']['output']>;
  /** The Categories/Types of the repository */
  repositoryTypes?: Maybe<Array<Scalars['String']['output']>>;
  /** Research domains associated with the repository */
  researchDomains?: Maybe<Array<ResearchDomain>>;
  /** The source of this repository */
  source: RepositorySource;
  /** The taxonomy URL of the repository */
  uri?: Maybe<Scalars['String']['output']>;
  /** The website URL */
  website?: Maybe<Scalars['String']['output']>;
};

/** A section created/owned by the affiliation that owns the customization */
export type CustomSection = {
  __typename?: 'CustomSection';
  /** The timestamp when the Object was created */
  created?: Maybe<Scalars['String']['output']>;
  /** The user who created the Object */
  createdById?: Maybe<Scalars['Int']['output']>;
  /** Errors associated with the Object */
  errors?: Maybe<CustomSectionErrors>;
  /** The guidance to help user with answering questions in this section */
  guidance?: Maybe<Scalars['String']['output']>;
  /** The unique identifier for the Object */
  id?: Maybe<Scalars['Int']['output']>;
  /** An introduction to the section */
  introduction?: Maybe<Scalars['String']['output']>;
  /** The current status of the customization with regard to the base funder template */
  migrationStatus?: Maybe<TemplateCustomizationMigrationStatus>;
  /** The timestamp when the Object was last modifed */
  modified?: Maybe<Scalars['String']['output']>;
  /** The user who last modified the Object */
  modifiedById?: Maybe<Scalars['Int']['output']>;
  /** The section title */
  name?: Maybe<Scalars['String']['output']>;
  /** The id of the VersionedSection or CustomSection this CustomSection is pinned to (null means it is the first section) */
  pinnedSectionId?: Maybe<Scalars['Int']['output']>;
  /** The type (BASE: VersionedSection, CUSTOM: CustomSection) this CustomSection is pinned to (null means it is the first section) */
  pinnedSectionType?: Maybe<CustomizableObjectOwnership>;
  /** Requirements that a user must consider in this section */
  requirements?: Maybe<Scalars['String']['output']>;
  /** The identifier of the parent template customization */
  templateCustomizationId: Scalars['Int']['output'];
};

/** Errors related to the CustomSection */
export type CustomSectionErrors = {
  __typename?: 'CustomSectionErrors';
  /** General error messages such as the object already exists */
  general?: Maybe<Scalars['String']['output']>;
  guidance?: Maybe<Scalars['String']['output']>;
  introduction?: Maybe<Scalars['String']['output']>;
  migrationStatus?: Maybe<Scalars['String']['output']>;
  name?: Maybe<Scalars['String']['output']>;
  pinnedSectionId?: Maybe<Scalars['String']['output']>;
  pinnedSectionType?: Maybe<Scalars['String']['output']>;
  requirements?: Maybe<Scalars['String']['output']>;
  templateCustomizationId?: Maybe<Scalars['String']['output']>;
};

/** Whether the object is pinned to an object on the base template or a custom object */
export enum CustomizableObjectOwnership {
  /** A Section/Question managed by the funder */
  Base = 'BASE',
  /** A Section/Question managed by the affiliation that owns the customization */
  Custom = 'CUSTOM'
}

export type CustomizableTemplateSearchResult = {
  __typename?: 'CustomizableTemplateSearchResult';
  /** The id of the template customization (undefined means the template has not been customized yet) */
  customizationId?: Maybe<Scalars['Int']['output']>;
  /** Whether the customization has unpublished changes (if applicable) */
  customizationIsDirty?: Maybe<Scalars['Boolean']['output']>;
  /** The timestamp when the customization was last modified (if applicable) */
  customizationLastCustomized?: Maybe<Scalars['String']['output']>;
  /** The id of the user who customized the template (if applicable) */
  customizationLastCustomizedById?: Maybe<Scalars['Int']['output']>;
  /** The name of the user who last modified the customization (if applicable) */
  customizationLastCustomizedByName?: Maybe<Scalars['String']['output']>;
  /** The status of the customization with regard to the published template (if applicable) */
  customizationMigrationStatus?: Maybe<TemplateCustomizationMigrationStatus>;
  /** The status of the customization (if applicable) */
  customizationStatus?: Maybe<TemplateCustomizationStatus>;
  /** The affiliation uri that owns the published template */
  versionedTemplateAffiliationId: Scalars['String']['output'];
  /** The affiliation name that owns the published template */
  versionedTemplateAffiliationName: Scalars['String']['output'];
  /** Whether the published template is a best practice template */
  versionedTemplateBestPractice: Scalars['Boolean']['output'];
  /** The description of the published template */
  versionedTemplateDescription?: Maybe<Scalars['String']['output']>;
  /** The id of the published template */
  versionedTemplateId: Scalars['Int']['output'];
  /** The timestamp when the published template was last modified */
  versionedTemplateLastModified: Scalars['String']['output'];
  /** The name of the published template */
  versionedTemplateName: Scalars['String']['output'];
  /** The version number of the published template */
  versionedTemplateVersion: Scalars['String']['output'];
};

export type CustomizableTemplateSearchResults = PaginatedQueryResults & {
  __typename?: 'CustomizableTemplateSearchResults';
  /** The sortFields that are available for this query (for standard offset pagination only!) */
  availableSortFields?: Maybe<Array<Maybe<Scalars['String']['output']>>>;
  /** The current offset of the results (for standard offset pagination) */
  currentOffset?: Maybe<Scalars['Int']['output']>;
  /** Whether or not there is a next page */
  hasNextPage?: Maybe<Scalars['Boolean']['output']>;
  /** Whether or not there is a previous page */
  hasPreviousPage?: Maybe<Scalars['Boolean']['output']>;
  /** The CustomizableTemplateSearchResult that match the search criteria */
  items?: Maybe<Array<Maybe<CustomizableTemplateSearchResult>>>;
  /** The number of items returned */
  limit?: Maybe<Scalars['Int']['output']>;
  /** The cursor to use for the next page of results (for infinite scroll/load more) */
  nextCursor?: Maybe<Scalars['String']['output']>;
  /** The total number of possible items */
  totalCount?: Maybe<Scalars['Int']['output']>;
};

export type DoiMatch = {
  __typename?: 'DoiMatch';
  /** Indicates whether the work's DOI was found on a funder award page associated with the plan */
  found: Scalars['Boolean']['output'];
  /** A confidence score representing the strength or reliability of the DOI match */
  score: Scalars['Float']['output'];
  /** The funder award entries and specific award pages where the DOI was found */
  sources: Array<DoiMatchSource>;
};

export type DoiMatchSource = {
  __typename?: 'DoiMatchSource';
  /** The award ID */
  awardId: Scalars['String']['output'];
  /** The award URL */
  awardUrl: Scalars['String']['output'];
  /** The parent award ID, if the award has a parent */
  parentAwardId?: Maybe<Scalars['String']['output']>;
};

export type ExternalFunding = {
  __typename?: 'ExternalFunding';
  /** The funder's unique id/url for the call for submissions to apply for a grant */
  funderOpportunityNumber?: Maybe<Scalars['String']['output']>;
  /** The funder's unique id/url for the research project (normally assigned after the grant has been awarded) */
  funderProjectNumber?: Maybe<Scalars['String']['output']>;
  /** The funder's unique id/url for the award/grant (normally assigned after the grant has been awarded) */
  grantId?: Maybe<Scalars['String']['output']>;
};

export type ExternalMember = {
  __typename?: 'ExternalMember';
  /** The ROR ID of the member's institution */
  affiliationId?: Maybe<Scalars['String']['output']>;
  /** The member's email address */
  email?: Maybe<Scalars['String']['output']>;
  /** The member's first/given name */
  givenName?: Maybe<Scalars['String']['output']>;
  /** The member's ORCID */
  orcid?: Maybe<Scalars['String']['output']>;
  /** The member's last/sur name */
  surName?: Maybe<Scalars['String']['output']>;
};

/** External Project type */
export type ExternalProject = {
  __typename?: 'ExternalProject';
  /** The project description */
  abstractText?: Maybe<Scalars['String']['output']>;
  /** The project end date */
  endDate?: Maybe<Scalars['String']['output']>;
  /** Funding information for this project */
  fundings?: Maybe<Array<ExternalFunding>>;
  /** Member information for this project */
  members?: Maybe<Array<ExternalMember>>;
  /** The project start date */
  startDate?: Maybe<Scalars['String']['output']>;
  /** The project title */
  title?: Maybe<Scalars['String']['output']>;
};

export type ExternalSearchInput = {
  /** The URI of the funder we are using to search for projects */
  affiliationId: Scalars['String']['input'];
  /** The funder award/grant id/url (optional) */
  awardId?: InputMaybe<Scalars['String']['input']>;
  /** The funder award/grant name (optional) */
  awardName?: InputMaybe<Scalars['String']['input']>;
  /** The funder award/grant year (optional) as YYYY */
  awardYear?: InputMaybe<Scalars['String']['input']>;
  /** The principal investigator names (optional) can be any combination of first/middle/last names */
  piNames?: InputMaybe<Array<InputMaybe<Scalars['String']['input']>>>;
};

/** A funder of a work */
export type Funder = {
  __typename?: 'Funder';
  /** The name of the funder */
  name?: Maybe<Scalars['String']['output']>;
  /** The ROR ID of the funder */
  ror?: Maybe<Scalars['String']['output']>;
};

/** A funder of a work */
export type FunderInput = {
  /** The name of the funder */
  name?: InputMaybe<Scalars['String']['input']>;
  /** The ROR ID of the funder */
  ror?: InputMaybe<Scalars['String']['input']>;
};

/** A result of the most popular funders */
export type FunderPopularityResult = {
  __typename?: 'FunderPopularityResult';
  /** The apiTarget for the affiliation (if available) */
  apiTarget?: Maybe<Scalars['String']['output']>;
  /** The official display name */
  displayName: Scalars['String']['output'];
  /** The unique identifer for the affiliation */
  id: Scalars['Int']['output'];
  /** The number of plans associated with this funder in the past year */
  nbrPlans: Scalars['Int']['output'];
  /** The URI of the affiliation (typically the ROR id) */
  uri: Scalars['String']['output'];
};

/** A Guidance item contains guidance text and associated tag id */
export type Guidance = {
  __typename?: 'Guidance';
  /** The timestamp when the Object was created */
  created?: Maybe<Scalars['String']['output']>;
  /** The user who created the Object */
  createdById?: Maybe<Scalars['Int']['output']>;
  /** Errors associated with the Object */
  errors?: Maybe<GuidanceErrors>;
  /** The GuidanceGroup this Guidance belongs to */
  guidanceGroup?: Maybe<GuidanceGroup>;
  /** The GuidanceGroup this Guidance belongs to */
  guidanceGroupId: Scalars['Int']['output'];
  /** The guidance text content */
  guidanceText?: Maybe<Scalars['String']['output']>;
  /** The unique identifier for the Object */
  id?: Maybe<Scalars['Int']['output']>;
  /** The timestamp when the Object was last modified */
  modified?: Maybe<Scalars['String']['output']>;
  /** User who modified the guidance last */
  modifiedBy?: Maybe<User>;
  /** The user who last modified the Object */
  modifiedById?: Maybe<Scalars['Int']['output']>;
  /** The Tag associated with the guidance */
  tag?: Maybe<Tag>;
  /** The tag id associated with this Guidance */
  tagId?: Maybe<Scalars['Int']['output']>;
};

/** A collection of errors related to Guidance */
export type GuidanceErrors = {
  __typename?: 'GuidanceErrors';
  /** General error messages such as the object already exists */
  general?: Maybe<Scalars['String']['output']>;
  guidanceGroupId?: Maybe<Scalars['String']['output']>;
  guidanceText?: Maybe<Scalars['String']['output']>;
  tagId?: Maybe<Scalars['String']['output']>;
};

/** A GuidanceGroup contains a collection of Guidance items for an organization */
export type GuidanceGroup = {
  __typename?: 'GuidanceGroup';
  /** The affiliation (organization) that owns this GuidanceGroup */
  affiliationId: Scalars['String']['output'];
  /** Whether this is a best practice GuidanceGroup */
  bestPractice: Scalars['Boolean']['output'];
  /** The timestamp when the Object was created */
  created?: Maybe<Scalars['String']['output']>;
  /** The user who created the Object */
  createdById?: Maybe<Scalars['Int']['output']>;
  /** The description of the GuidanceGroup */
  description?: Maybe<Scalars['String']['output']>;
  /** Errors associated with the Object */
  errors?: Maybe<GuidanceGroupErrors>;
  /** The Guidance items in this group */
  guidance?: Maybe<Array<Guidance>>;
  /** The unique identifier for the Object */
  id?: Maybe<Scalars['Int']['output']>;
  /** Whether this GuidanceGroup has been modified since last publish */
  isDirty: Scalars['Boolean']['output'];
  /** The date when this was last published */
  latestPublishedDate?: Maybe<Scalars['String']['output']>;
  /** The version identifier of the latest published version */
  latestPublishedVersion?: Maybe<Scalars['String']['output']>;
  /** The timestamp when the Object was last modified */
  modified?: Maybe<Scalars['String']['output']>;
  /** User who modified the guidance group last */
  modifiedBy?: Maybe<User>;
  /** The user who last modified the Object */
  modifiedById?: Maybe<Scalars['Int']['output']>;
  /** The name of the GuidanceGroup */
  name: Scalars['String']['output'];
  /** Whether this is an optional subset for departmental use */
  optionalSubset: Scalars['Boolean']['output'];
  /** VersionedGuidanceGroups associated with this GuidanceGroup */
  versionedGuidanceGroup?: Maybe<Array<Maybe<VersionedGuidanceGroup>>>;
};

/** A collection of errors related to the GuidanceGroup */
export type GuidanceGroupErrors = {
  __typename?: 'GuidanceGroupErrors';
  affiliationId?: Maybe<Scalars['String']['output']>;
  bestPractice?: Maybe<Scalars['String']['output']>;
  description?: Maybe<Scalars['String']['output']>;
  /** General error messages such as the object already exists */
  general?: Maybe<Scalars['String']['output']>;
  name?: Maybe<Scalars['String']['output']>;
};

/** A single guidance item with its content */
export type GuidanceItem = {
  __typename?: 'GuidanceItem';
  /** The guidance text content (HTML) */
  guidanceText: Scalars['String']['output'];
  /** Tag ID this guidance is associated with */
  id?: Maybe<Scalars['Int']['output']>;
  /** Title/name of the tag */
  title?: Maybe<Scalars['String']['output']>;
};

/** A source of guidance (organization, best practice, etc.) */
export type GuidanceSource = {
  __typename?: 'GuidanceSource';
  /** Whether this source has any guidance */
  hasGuidance: Scalars['Boolean']['output'];
  /** Unique identifier for this guidance source */
  id: Scalars['String']['output'];
  /** Guidance items from this source */
  items: Array<GuidanceItem>;
  /** Full label/name of the organization */
  label: Scalars['String']['output'];
  /** Organization URI (ROR ID) */
  orgURI: Scalars['String']['output'];
  /** Short name or acronym */
  shortName: Scalars['String']['output'];
  /** The type of guidance source */
  type: GuidanceSourceType;
};

/** Types of guidance sources */
export enum GuidanceSourceType {
  /** Best practice guidance from DMP Tool */
  BestPractice = 'BEST_PRACTICE',
  /** Guidance from the template owner organization */
  TemplateOwner = 'TEMPLATE_OWNER',
  /** Guidance from the user's affiliation */
  UserAffiliation = 'USER_AFFILIATION',
  /** Guidance from user-selected organizations */
  UserSelected = 'USER_SELECTED'
}

/** An institution of an author of a work */
export type Institution = {
  __typename?: 'Institution';
  /** The name of the institution */
  name?: Maybe<Scalars['String']['output']>;
  /** The ROR ID of the institution */
  ror?: Maybe<Scalars['String']['output']>;
};

/** An institution of an author of a work */
export type InstitutionInput = {
  /** The name of the institution */
  name?: InputMaybe<Scalars['String']['input']>;
  /** The ROR ID of the institution */
  ror?: InputMaybe<Scalars['String']['input']>;
};

/** The types of object a User can be invited to Collaborate on */
export enum InvitedToType {
  Plan = 'PLAN',
  Template = 'TEMPLATE'
}

export type ItemMatch = {
  __typename?: 'ItemMatch';
  /** The specific fields that contributed to the match (e.g. name, orcid etc) */
  fields?: Maybe<Array<Scalars['String']['output']>>;
  /** The position of the matched item within the work (zero-based index) */
  index: Scalars['Int']['output'];
  /** A confidence score representing how strongly this item matches the corresponding item in the plan */
  score: Scalars['Float']['output'];
};

/** A Language supported by the system */
export type Language = {
  __typename?: 'Language';
  /** The unique identifer for the Language using the 2 character (ISO 639-1) language code and optionally the 2 character (ISO 3166-1) country code */
  id: Scalars['String']['output'];
  /** Whether or not the language is the default */
  isDefault: Scalars['Boolean']['output'];
  /** A displayable name for the language */
  name: Scalars['String']['output'];
};

/** A license associated with a research output (e.g. CC0, MIT, etc.) */
export type License = {
  __typename?: 'License';
  /** The timestamp when the Object was created */
  created?: Maybe<Scalars['String']['output']>;
  /** The user who created the Object */
  createdById?: Maybe<Scalars['Int']['output']>;
  /** A description of the license */
  description?: Maybe<Scalars['String']['output']>;
  /** Errors associated with the Object */
  errors?: Maybe<LicenseErrors>;
  /** The unique identifer for the Object */
  id?: Maybe<Scalars['Int']['output']>;
  /** The timestamp when the Object was last modifed */
  modified?: Maybe<Scalars['String']['output']>;
  /** The user who last modified the Object */
  modifiedById?: Maybe<Scalars['Int']['output']>;
  /** The name of the license */
  name: Scalars['String']['output'];
  /** Whether or not the license is recommended */
  recommended: Scalars['Boolean']['output'];
  /** The taxonomy URL of the license */
  uri: Scalars['String']['output'];
};

/** A collection of errors related to the License */
export type LicenseErrors = {
  __typename?: 'LicenseErrors';
  description?: Maybe<Scalars['String']['output']>;
  /** General error messages such as the object already exists */
  general?: Maybe<Scalars['String']['output']>;
  name?: Maybe<Scalars['String']['output']>;
  uri?: Maybe<Scalars['String']['output']>;
};

export type MemberRole = {
  __typename?: 'MemberRole';
  /** The timestamp when the Object was created */
  created?: Maybe<Scalars['String']['output']>;
  /** The user who created the Object */
  createdById?: Maybe<Scalars['Int']['output']>;
  /** A longer description of the member role useful for tooltips */
  description?: Maybe<Scalars['String']['output']>;
  /** The order in which to display these items when displayed in the UI */
  displayOrder: Scalars['Int']['output'];
  /** Errors associated with the Object */
  errors?: Maybe<MemberRoleErrors>;
  /** The unique identifer for the Object */
  id?: Maybe<Scalars['Int']['output']>;
  /** The Ui label to display for the member role */
  label: Scalars['String']['output'];
  /** The timestamp when the Object was last modifed */
  modified?: Maybe<Scalars['String']['output']>;
  /** The user who last modified the Object */
  modifiedById?: Maybe<Scalars['Int']['output']>;
  /** The taxonomy URL for the member role */
  uri: Scalars['String']['output'];
};

/** A collection of errors related to the member role */
export type MemberRoleErrors = {
  __typename?: 'MemberRoleErrors';
  description?: Maybe<Scalars['String']['output']>;
  displayOrder?: Maybe<Scalars['String']['output']>;
  /** General error messages such as the object already exists */
  general?: Maybe<Scalars['String']['output']>;
  label?: Maybe<Scalars['String']['output']>;
  uri?: Maybe<Scalars['String']['output']>;
};

/** A metadata standard used when describing a research output */
export type MetadataStandard = {
  __typename?: 'MetadataStandard';
  /** The timestamp when the Object was created */
  created?: Maybe<Scalars['String']['output']>;
  /** The user who created the Object */
  createdById?: Maybe<Scalars['Int']['output']>;
  /** A description of the metadata standard */
  description?: Maybe<Scalars['String']['output']>;
  /** Errors associated with the Object */
  errors?: Maybe<MetadataStandardErrors>;
  /** The unique identifer for the Object */
  id?: Maybe<Scalars['Int']['output']>;
  /** Keywords to assist in finding the metadata standard */
  keywords?: Maybe<Array<Scalars['String']['output']>>;
  /** The timestamp when the Object was last modifed */
  modified?: Maybe<Scalars['String']['output']>;
  /** The user who last modified the Object */
  modifiedById?: Maybe<Scalars['Int']['output']>;
  /** The name of the metadata standard */
  name: Scalars['String']['output'];
  /** Research domains associated with the metadata standard */
  researchDomains?: Maybe<Array<ResearchDomain>>;
  /** The taxonomy URL of the metadata standard */
  uri: Scalars['String']['output'];
};

/** A collection of errors related to the MetadataStandard */
export type MetadataStandardErrors = {
  __typename?: 'MetadataStandardErrors';
  description?: Maybe<Scalars['String']['output']>;
  /** General error messages such as the object already exists */
  general?: Maybe<Scalars['String']['output']>;
  keywords?: Maybe<Scalars['String']['output']>;
  name?: Maybe<Scalars['String']['output']>;
  researchDomainIds?: Maybe<Scalars['String']['output']>;
  uri?: Maybe<Scalars['String']['output']>;
};

export type MetadataStandardSearchResults = PaginatedQueryResults & {
  __typename?: 'MetadataStandardSearchResults';
  /** The sortFields that are available for this query (for standard offset pagination only!) */
  availableSortFields?: Maybe<Array<Maybe<Scalars['String']['output']>>>;
  /** The current offset of the results (for standard offset pagination) */
  currentOffset?: Maybe<Scalars['Int']['output']>;
  /** Whether or not there is a next page */
  hasNextPage?: Maybe<Scalars['Boolean']['output']>;
  /** Whether or not there is a previous page */
  hasPreviousPage?: Maybe<Scalars['Boolean']['output']>;
  /** The TemplateSearchResults that match the search criteria */
  items?: Maybe<Array<Maybe<MetadataStandard>>>;
  /** The number of items returned */
  limit?: Maybe<Scalars['Int']['output']>;
  /** The cursor to use for the next page of results (for infinite scroll/load more) */
  nextCursor?: Maybe<Scalars['String']['output']>;
  /** The total number of possible items */
  totalCount?: Maybe<Scalars['Int']['output']>;
};

/** Direction to move a custom question relative to the pinned question */
export enum MoveCustomQuestionDirection {
  /** Move the question below the pinned question */
  Down = 'DOWN',
  /** Move the question above the pinned question */
  Up = 'UP'
}

/** Move a custom question to a different position within the section (null means move to the top of the section) */
export type MoveCustomQuestionInput = {
  /** the id of the custom question to move */
  customQuestionId: Scalars['Int']['input'];
  /** Direction to move the question relative to the pinnedQuestion (UP or DOWN) */
  direction: MoveCustomQuestionDirection;
  /** The identifier of the question this new custom question should appear after (null means it is the first question in the section) */
  pinnedQuestionId?: InputMaybe<Scalars['Int']['input']>;
  /** The type of the question this new custom question should appear after (null means it is the first question in the section) */
  pinnedQuestionType?: InputMaybe<CustomizableObjectOwnership>;
  /** The identifier of the section this new custom question should appear within */
  sectionId: Scalars['Int']['input'];
  /** The type of the section this new custom question should appear within */
  sectionType: CustomizableObjectOwnership;
};

/** Move a custom section to a different position in the template (null means move to the top of the template) */
export type MoveCustomSectionInput = {
  /** the id of the custom section to move */
  customSectionId: Scalars['Int']['input'];
  /** The id of the section this CustomSection will be pinned to (null means it is the first section in the template) */
  newSectionId?: InputMaybe<Scalars['Int']['input']>;
  /** The type of the section (BASE: VersionedSection, CUSTOM: CustomSection) this CustomSection will be pinned to (null means it is the first section in the template) */
  newSectionType?: InputMaybe<CustomizableObjectOwnership>;
};

export type Mutation = {
  __typename?: 'Mutation';
  _empty?: Maybe<Scalars['String']['output']>;
  /** Reactivate the specified user Account (Admin only) */
  activateUser?: Maybe<User>;
  /** Create a new Affiliation */
  addAffiliation?: Maybe<Affiliation>;
  /** Assign an alternate identifier to the plan */
  addAlternateIdentifierToPlan?: Maybe<AlternateIdentifier>;
  /** Answer a question */
  addAnswer?: Maybe<Answer>;
  /** Add comment for an answer  */
  addAnswerComment?: Maybe<AnswerComment>;
  /** Add a custom question to a funder section */
  addCustomQuestion: CustomQuestion;
  /** Add a custom section to a funder template */
  addCustomSection: CustomSection;
  /** Add feedback comment for an answer within a round of feedback */
  addFeedbackComment?: Maybe<PlanFeedbackComment>;
  /** Create a new Guidance item */
  addGuidance: Guidance;
  /** Create a new GuidanceGroup */
  addGuidanceGroup: GuidanceGroup;
  /** Add a new License (don't make the URI up! should resolve to an taxonomy HTML/JSON representation of the object) */
  addLicense?: Maybe<License>;
  /** Add a new member role (URL and label must be unique!) */
  addMemberRole?: Maybe<MemberRole>;
  /** Add a new MetadataStandard */
  addMetadataStandard?: Maybe<MetadataStandard>;
  /** Create a plan */
  addPlan?: Maybe<Plan>;
  /** Add Funding information to a Plan */
  addPlanFunding?: Maybe<Plan>;
  /** Add Plan Guidance affiliation for current user */
  addPlanGuidance: PlanGuidance;
  /** Add a Member to a Plan */
  addPlanMember?: Maybe<PlanMember>;
  /** Create a project */
  addProject?: Maybe<Project>;
  /** Add a collaborator to a Plan */
  addProjectCollaborator?: Maybe<ProjectCollaborator>;
  /** Add Funding information to a research project */
  addProjectFunding?: Maybe<ProjectFunding>;
  /** Add a Member to a research project */
  addProjectMember?: Maybe<ProjectMember>;
  /** Create a new Question */
  addQuestion: Question;
  /** Create a new QuestionCondition associated with a question */
  addQuestionCondition: QuestionCondition;
  /** Add custom guidance and sample answer to a funder question */
  addQuestionCustomization: QuestionCustomization;
  /** Add a related work manually, by specifying all work details */
  addRelatedWorkManual?: Maybe<RelatedWorkSearchResult>;
  /** Add a new Repository */
  addRepository?: Maybe<CustomRepository>;
  /** Add a new research output type (name must be unique!) */
  addResearchOutputType?: Maybe<ResearchOutputType>;
  /** Create a new Section. Leave the 'copyFromVersionedSectionId' blank to create a new section from scratch */
  addSection: Section;
  /** Add custom guidance to a funder section */
  addSectionCustomization: SectionCustomization;
  /** Add a new tag to available list of tags */
  addTag?: Maybe<Tag>;
  /** Create a new Template. Leave the 'copyFromTemplateId' blank to create a new template from scratch */
  addTemplate?: Maybe<Template>;
  /** Add a collaborator to a Template */
  addTemplateCollaborator?: Maybe<TemplateCollaborator>;
  /** Add a new customization to a funder template (user must be an Admin) */
  addTemplateCustomization: TemplateCustomizationOverview;
  /** Add an email address for the current user */
  addUserEmail?: Maybe<UserEmail>;
  /** Archive a plan */
  archivePlan?: Maybe<Plan>;
  /** Download the plan */
  archiveProject?: Maybe<Project>;
  /** Archive a Template (unpublishes any associated PublishedTemplate */
  archiveTemplate?: Maybe<Template>;
  /** Mark the feedback round as complete */
  completeFeedback?: Maybe<PlanFeedback>;
  /** Publish the template or save as a draft */
  createTemplateVersion?: Maybe<Template>;
  /** Deactivate the specified user Account (Admin only) */
  deactivateUser?: Maybe<User>;
  /** The custom guidance for the custom section */
  guidance?: Maybe<Scalars['String']['output']>;
  /** The introduction to the custom section */
  introduction?: Maybe<Scalars['String']['output']>;
  /** Designates the specified Template as the default (SuperAdmin only) */
  markAsDefaultTemplate?: Maybe<Template>;
  /** Merge two licenses */
  mergeLicenses?: Maybe<License>;
  /** Merge two metadata standards */
  mergeMetadataStandards?: Maybe<MetadataStandard>;
  /** Merge two repositories */
  mergeRepositories?: Maybe<CustomRepository>;
  /** Merge the 2 user accounts (Admin only) */
  mergeUsers?: Maybe<User>;
  /** Move a custom question to a different position within the section (null means move to the top of the section) */
  moveCustomQuestion: CustomQuestion;
  /** Move a custom section to a different position in the template (null means move to the top of the template) */
  moveCustomSection: CustomSection;
  /** The custom section name */
  name: Scalars['String']['output'];
  /** Import a project from an external source */
  projectImport?: Maybe<Project>;
  /** Publish a GuidanceGroup (creates a VersionedGuidanceGroup snapshot) */
  publishGuidanceGroup: GuidanceGroup;
  /** Publish a plan (changes status to PUBLISHED) */
  publishPlan?: Maybe<Plan>;
  /** Publish a customization (user must be an Admin) */
  publishTemplateCustomization: TemplateCustomizationOverview;
  /** Delete an Affiliation (only applicable to AffiliationProvenance == DMPTOOL) */
  removeAffiliation?: Maybe<Affiliation>;
  /** Assign an alternate identifier to the plan */
  removeAlternateIdentifierFromPlan?: Maybe<AlternateIdentifier>;
  /** Remove answer comment */
  removeAnswerComment?: Maybe<AnswerComment>;
  /** Remove a custom question */
  removeCustomQuestion: CustomQuestion;
  /** Remove a custom section */
  removeCustomSection: CustomSection;
  /** Remove feedback comment for an answer within a round of feedback */
  removeFeedbackComment?: Maybe<PlanFeedbackComment>;
  /** Delete a Guidance item */
  removeGuidance: Guidance;
  /** Delete a GuidanceGroup */
  removeGuidanceGroup: GuidanceGroup;
  /** Delete a License */
  removeLicense?: Maybe<License>;
  /** Delete the member role */
  removeMemberRole?: Maybe<MemberRole>;
  /** Delete a MetadataStandard */
  removeMetadataStandard?: Maybe<MetadataStandard>;
  /** Remove a Funding from a Plan */
  removePlanFunding?: Maybe<PlanFunding>;
  /** Remove Plan Guidance affiliation for current user */
  removePlanGuidance?: Maybe<PlanGuidance>;
  /** Remove a PlanMember from a Plan */
  removePlanMember?: Maybe<PlanMember>;
  /** Remove a ProjectCollaborator from a Plan */
  removeProjectCollaborator?: Maybe<ProjectCollaborator>;
  /** Remove Funding from the research project */
  removeProjectFunding?: Maybe<ProjectFunding>;
  /** Remove a research project Member */
  removeProjectMember?: Maybe<ProjectMember>;
  /** Delete a Question */
  removeQuestion?: Maybe<Question>;
  /** Remove a QuestionCondition using a specific QuestionCondition id */
  removeQuestionCondition?: Maybe<QuestionCondition>;
  /** Remove custom guidance and sample answer from a funder question */
  removeQuestionCustomization: QuestionCustomization;
  /** Delete a Repository */
  removeRepository?: Maybe<CustomRepository>;
  /** Delete the research output type */
  removeResearchOutputType?: Maybe<ResearchOutputType>;
  /** Delete a section */
  removeSection: Section;
  /** Remove custom guidance from a funder section */
  removeSectionCustomization: SectionCustomization;
  /** Delete a tag */
  removeTag?: Maybe<Tag>;
  /** Remove a TemplateCollaborator from a Template */
  removeTemplateCollaborator?: Maybe<TemplateCollaborator>;
  /** Remove a customization (user must be an Admin) */
  removeTemplateCustomization: TemplateCustomization;
  /** Anonymize the current user's account (essentially deletes their account without orphaning things) */
  removeUser?: Maybe<User>;
  /** Remove an email address from the current user */
  removeUserEmail?: Maybe<UserEmail>;
  /** Request a round of admin feedback */
  requestFeedback?: Maybe<PlanFeedback>;
  /** The requirements for the custom section */
  requirements?: Maybe<Scalars['String']['output']>;
  /** Resend an invite to a ProjectCollaborator */
  resendInviteToProjectCollaborator?: Maybe<ProjectCollaborator>;
  /** Designate the email as the current user's primary email address */
  setPrimaryUserEmail?: Maybe<Array<Maybe<UserEmail>>>;
  /** Set the user's ORCID */
  setUserOrcid?: Maybe<User>;
  /** Initialize a PLanVersion record in the DynamoDB for all Plans that do not have one */
  superSyncPlanMaDMP: Scalars['Boolean']['output'];
  /** Unpublish a GuidanceGroup (sets active flag to false on current version) */
  unpublishGuidanceGroup: GuidanceGroup;
  /** Unpublish a customization (user must be an Admin) */
  unpublishTemplateCustomization: TemplateCustomizationOverview;
  /** Update an Affiliation */
  updateAffiliation?: Maybe<Affiliation>;
  /** Edit an answer */
  updateAnswer?: Maybe<Answer>;
  /** Update comment for an answer  */
  updateAnswerComment?: Maybe<AnswerComment>;
  /** Update a custom question */
  updateCustomQuestion: CustomQuestion;
  /** Update a custom section */
  updateCustomSection: CustomSection;
  /** Update feedback comment for an answer within a round of feedback */
  updateFeedbackComment?: Maybe<PlanFeedbackComment>;
  /** Update an existing Guidance item */
  updateGuidance: Guidance;
  /** Update an existing GuidanceGroup */
  updateGuidanceGroup: GuidanceGroup;
  /** Update a License record */
  updateLicense?: Maybe<License>;
  /** Update the member role */
  updateMemberRole?: Maybe<MemberRole>;
  /** Update a MetadataStandard record */
  updateMetadataStandard?: Maybe<MetadataStandard>;
  /** Change the current user's password */
  updatePassword?: Maybe<User>;
  /** Update multiple Plan Fundings passing in an array of projectFundingIds */
  updatePlanFunding?: Maybe<Array<Maybe<PlanFunding>>>;
  /** Chnage a Member's accessLevel on a Plan */
  updatePlanMember?: Maybe<PlanMember>;
  /** Change the plan's status */
  updatePlanStatus?: Maybe<Plan>;
  /** Change the plan's title */
  updatePlanTitle?: Maybe<Plan>;
  /** Edit a project */
  updateProject?: Maybe<Project>;
  /** Change a collaborator's accessLevel on a Plan */
  updateProjectCollaborator?: Maybe<ProjectCollaborator>;
  /** Update Funding information on the research project */
  updateProjectFunding?: Maybe<ProjectFunding>;
  /** Update a Member on the research project */
  updateProjectMember?: Maybe<ProjectMember>;
  /** Update a Question */
  updateQuestion: Question;
  /** Update a QuestionCondition for a specific QuestionCondition id */
  updateQuestionCondition?: Maybe<QuestionCondition>;
  /** Update custom guidance and sample answer for a funder question */
  updateQuestionCustomization: QuestionCustomization;
  /** Change the question's display order */
  updateQuestionDisplayOrder: ReorderQuestionsResult;
  /** Update the status of a related work */
  updateRelatedWorkStatus?: Maybe<RelatedWorkSearchResult>;
  /** Update a Repository record */
  updateRepository?: Maybe<CustomRepository>;
  /** Update the research output type */
  updateResearchOutputType?: Maybe<ResearchOutputType>;
  /** Update a Section */
  updateSection: Section;
  /** Update custom guidance on a funder section */
  updateSectionCustomization: SectionCustomization;
  /** Change the section's display order */
  updateSectionDisplayOrder: ReorderSectionsResult;
  /** Update a tag */
  updateTag?: Maybe<Tag>;
  /** Update a Template */
  updateTemplate?: Maybe<Template>;
  /** Update a customization (user must be an Admin) */
  updateTemplateCustomization: TemplateCustomizationOverview;
  /** Update the current user's email notifications */
  updateUserNotifications?: Maybe<User>;
  /** Update the current user's information */
  updateUserProfile?: Maybe<User>;
  /** Upload a plan */
  uploadPlan?: Maybe<Plan>;
  /** Insert or update a related work, the work is looked up in OpenSearch and details added */
  upsertRelatedWork?: Maybe<RelatedWorkSearchResult>;
};


export type MutationActivateUserArgs = {
  userId: Scalars['Int']['input'];
};


export type MutationAddAffiliationArgs = {
  input: AffiliationInput;
};


export type MutationAddAlternateIdentifierToPlanArgs = {
  alternateIdentifier: Scalars['String']['input'];
  planId: Scalars['Int']['input'];
};


export type MutationAddAnswerArgs = {
  json?: InputMaybe<Scalars['String']['input']>;
  planId: Scalars['Int']['input'];
  versionedCustomQuestionId?: InputMaybe<Scalars['Int']['input']>;
  versionedCustomSectionId?: InputMaybe<Scalars['Int']['input']>;
  versionedQuestionId?: InputMaybe<Scalars['Int']['input']>;
  versionedSectionId?: InputMaybe<Scalars['Int']['input']>;
};


export type MutationAddAnswerCommentArgs = {
  answerId: Scalars['Int']['input'];
  commentText: Scalars['String']['input'];
};


export type MutationAddCustomQuestionArgs = {
  input: AddCustomQuestionInput;
};


export type MutationAddCustomSectionArgs = {
  input: AddCustomSectionInput;
};


export type MutationAddFeedbackCommentArgs = {
  answerId: Scalars['Int']['input'];
  commentText: Scalars['String']['input'];
  planFeedbackId: Scalars['Int']['input'];
  planId: Scalars['Int']['input'];
};


export type MutationAddGuidanceArgs = {
  input: AddGuidanceInput;
};


export type MutationAddGuidanceGroupArgs = {
  input: AddGuidanceGroupInput;
};


export type MutationAddLicenseArgs = {
  description?: InputMaybe<Scalars['String']['input']>;
  name: Scalars['String']['input'];
  recommended?: InputMaybe<Scalars['Boolean']['input']>;
  uri?: InputMaybe<Scalars['String']['input']>;
};


export type MutationAddMemberRoleArgs = {
  description?: InputMaybe<Scalars['String']['input']>;
  displayOrder: Scalars['Int']['input'];
  label: Scalars['String']['input'];
  url: Scalars['URL']['input'];
};


export type MutationAddMetadataStandardArgs = {
  input: AddMetadataStandardInput;
};


export type MutationAddPlanArgs = {
  projectId: Scalars['Int']['input'];
  versionedTemplateId: Scalars['Int']['input'];
};


export type MutationAddPlanFundingArgs = {
  planId: Scalars['Int']['input'];
  projectFundingIds: Array<Scalars['Int']['input']>;
};


export type MutationAddPlanGuidanceArgs = {
  affiliationId: Scalars['String']['input'];
  planId: Scalars['Int']['input'];
};


export type MutationAddPlanMemberArgs = {
  planId: Scalars['Int']['input'];
  projectMemberId: Scalars['Int']['input'];
  roleIds?: InputMaybe<Array<Scalars['Int']['input']>>;
};


export type MutationAddProjectArgs = {
  isTestProject?: InputMaybe<Scalars['Boolean']['input']>;
  title: Scalars['String']['input'];
};


export type MutationAddProjectCollaboratorArgs = {
  accessLevel?: InputMaybe<ProjectCollaboratorAccessLevel>;
  email: Scalars['String']['input'];
  projectId: Scalars['Int']['input'];
};


export type MutationAddProjectFundingArgs = {
  input: AddProjectFundingInput;
};


export type MutationAddProjectMemberArgs = {
  input: AddProjectMemberInput;
};


export type MutationAddQuestionArgs = {
  input: AddQuestionInput;
};


export type MutationAddQuestionConditionArgs = {
  input: AddQuestionConditionInput;
};


export type MutationAddQuestionCustomizationArgs = {
  input: AddQuestionCustomizationInput;
};


export type MutationAddRelatedWorkManualArgs = {
  input: AddRelatedWorkManualInput;
};


export type MutationAddRepositoryArgs = {
  input?: InputMaybe<AddRepositoryInput>;
};


export type MutationAddResearchOutputTypeArgs = {
  description?: InputMaybe<Scalars['String']['input']>;
  name: Scalars['String']['input'];
};


export type MutationAddSectionArgs = {
  input: AddSectionInput;
};


export type MutationAddSectionCustomizationArgs = {
  input: AddSectionCustomizationInput;
};


export type MutationAddTagArgs = {
  description?: InputMaybe<Scalars['String']['input']>;
  name: Scalars['String']['input'];
};


export type MutationAddTemplateArgs = {
  copyFromTemplateId?: InputMaybe<Scalars['Int']['input']>;
  copyFromVersionedTemplateId?: InputMaybe<Scalars['Int']['input']>;
  name: Scalars['String']['input'];
};


export type MutationAddTemplateCollaboratorArgs = {
  email: Scalars['String']['input'];
  templateId: Scalars['Int']['input'];
};


export type MutationAddTemplateCustomizationArgs = {
  input: AddTemplateCustomizationInput;
};


export type MutationAddUserEmailArgs = {
  email: Scalars['String']['input'];
  isPrimary: Scalars['Boolean']['input'];
};


export type MutationArchivePlanArgs = {
  planId: Scalars['Int']['input'];
};


export type MutationArchiveProjectArgs = {
  projectId: Scalars['Int']['input'];
};


export type MutationArchiveTemplateArgs = {
  templateId: Scalars['Int']['input'];
};


export type MutationCompleteFeedbackArgs = {
  planFeedbackId: Scalars['Int']['input'];
  planId: Scalars['Int']['input'];
  sendEmail?: InputMaybe<Scalars['Boolean']['input']>;
  summaryText?: InputMaybe<Scalars['String']['input']>;
};


export type MutationCreateTemplateVersionArgs = {
  comment?: InputMaybe<Scalars['String']['input']>;
  latestPublishVisibility: TemplateVisibility;
  templateId: Scalars['Int']['input'];
  versionType?: InputMaybe<TemplateVersionType>;
};


export type MutationDeactivateUserArgs = {
  userId: Scalars['Int']['input'];
};


export type MutationMarkAsDefaultTemplateArgs = {
  templateId: Scalars['Int']['input'];
};


export type MutationMergeLicensesArgs = {
  licenseToKeepId: Scalars['Int']['input'];
  licenseToRemoveId: Scalars['Int']['input'];
};


export type MutationMergeMetadataStandardsArgs = {
  metadataStandardToKeepId: Scalars['Int']['input'];
  metadataStandardToRemoveId: Scalars['Int']['input'];
};


export type MutationMergeRepositoriesArgs = {
  repositoryToKeepId: Scalars['Int']['input'];
  repositoryToRemoveId: Scalars['Int']['input'];
};


export type MutationMergeUsersArgs = {
  userIdToBeMerged: Scalars['Int']['input'];
  userIdToKeep: Scalars['Int']['input'];
};


export type MutationMoveCustomQuestionArgs = {
  input: MoveCustomQuestionInput;
};


export type MutationMoveCustomSectionArgs = {
  input: MoveCustomSectionInput;
};


export type MutationProjectImportArgs = {
  input?: InputMaybe<ProjectImportInput>;
};


export type MutationPublishGuidanceGroupArgs = {
  guidanceGroupId: Scalars['Int']['input'];
};


export type MutationPublishPlanArgs = {
  planId: Scalars['Int']['input'];
  visibility?: InputMaybe<PlanVisibility>;
};


export type MutationPublishTemplateCustomizationArgs = {
  templateCustomizationId: Scalars['Int']['input'];
};


export type MutationRemoveAffiliationArgs = {
  affiliationId: Scalars['Int']['input'];
};


export type MutationRemoveAlternateIdentifierFromPlanArgs = {
  alternateIdentifier: Scalars['String']['input'];
  planId: Scalars['Int']['input'];
};


export type MutationRemoveAnswerCommentArgs = {
  answerCommentId: Scalars['Int']['input'];
  answerId: Scalars['Int']['input'];
};


export type MutationRemoveCustomQuestionArgs = {
  customQuestionId: Scalars['Int']['input'];
};


export type MutationRemoveCustomSectionArgs = {
  customSectionId: Scalars['Int']['input'];
};


export type MutationRemoveFeedbackCommentArgs = {
  planFeedbackCommentId: Scalars['Int']['input'];
  planId: Scalars['Int']['input'];
};


export type MutationRemoveGuidanceArgs = {
  guidanceId: Scalars['Int']['input'];
};


export type MutationRemoveGuidanceGroupArgs = {
  guidanceGroupId: Scalars['Int']['input'];
};


export type MutationRemoveLicenseArgs = {
  uri: Scalars['String']['input'];
};


export type MutationRemoveMemberRoleArgs = {
  id: Scalars['Int']['input'];
};


export type MutationRemoveMetadataStandardArgs = {
  uri: Scalars['String']['input'];
};


export type MutationRemovePlanFundingArgs = {
  planFundingId: Scalars['Int']['input'];
};


export type MutationRemovePlanGuidanceArgs = {
  affiliationId: Scalars['String']['input'];
  planId: Scalars['Int']['input'];
};


export type MutationRemovePlanMemberArgs = {
  planMemberId: Scalars['Int']['input'];
};


export type MutationRemoveProjectCollaboratorArgs = {
  projectCollaboratorId: Scalars['Int']['input'];
};


export type MutationRemoveProjectFundingArgs = {
  projectFundingId: Scalars['Int']['input'];
};


export type MutationRemoveProjectMemberArgs = {
  projectMemberId: Scalars['Int']['input'];
};


export type MutationRemoveQuestionArgs = {
  questionId: Scalars['Int']['input'];
};


export type MutationRemoveQuestionConditionArgs = {
  questionConditionId: Scalars['Int']['input'];
};


export type MutationRemoveQuestionCustomizationArgs = {
  questionCustomizationId: Scalars['Int']['input'];
};


export type MutationRemoveRepositoryArgs = {
  repositoryId: Scalars['Int']['input'];
};


export type MutationRemoveResearchOutputTypeArgs = {
  id: Scalars['Int']['input'];
};


export type MutationRemoveSectionArgs = {
  sectionId: Scalars['Int']['input'];
};


export type MutationRemoveSectionCustomizationArgs = {
  sectionCustomizationId: Scalars['Int']['input'];
};


export type MutationRemoveTagArgs = {
  tagId: Scalars['Int']['input'];
};


export type MutationRemoveTemplateCollaboratorArgs = {
  email: Scalars['String']['input'];
  templateId: Scalars['Int']['input'];
};


export type MutationRemoveTemplateCustomizationArgs = {
  templateCustomizationId: Scalars['Int']['input'];
};


export type MutationRemoveUserEmailArgs = {
  email: Scalars['String']['input'];
};


export type MutationRequestFeedbackArgs = {
  messageToOrg?: InputMaybe<Scalars['String']['input']>;
  planId: Scalars['Int']['input'];
};


export type MutationResendInviteToProjectCollaboratorArgs = {
  projectCollaboratorId: Scalars['Int']['input'];
};


export type MutationSetPrimaryUserEmailArgs = {
  email: Scalars['String']['input'];
};


export type MutationSetUserOrcidArgs = {
  orcid: Scalars['String']['input'];
};


export type MutationSuperSyncPlanMaDmpArgs = {
  planId: Scalars['Int']['input'];
};


export type MutationUnpublishGuidanceGroupArgs = {
  guidanceGroupId: Scalars['Int']['input'];
};


export type MutationUnpublishTemplateCustomizationArgs = {
  templateCustomizationId: Scalars['Int']['input'];
};


export type MutationUpdateAffiliationArgs = {
  input: AffiliationInput;
};


export type MutationUpdateAnswerArgs = {
  answerId: Scalars['Int']['input'];
  json?: InputMaybe<Scalars['String']['input']>;
};


export type MutationUpdateAnswerCommentArgs = {
  answerCommentId: Scalars['Int']['input'];
  answerId: Scalars['Int']['input'];
  commentText: Scalars['String']['input'];
};


export type MutationUpdateCustomQuestionArgs = {
  input: UpdateCustomQuestionInput;
};


export type MutationUpdateCustomSectionArgs = {
  input: UpdateCustomSectionInput;
};


export type MutationUpdateFeedbackCommentArgs = {
  commentText: Scalars['String']['input'];
  planFeedbackCommentId: Scalars['Int']['input'];
  planId: Scalars['Int']['input'];
};


export type MutationUpdateGuidanceArgs = {
  input: UpdateGuidanceInput;
};


export type MutationUpdateGuidanceGroupArgs = {
  input: UpdateGuidanceGroupInput;
};


export type MutationUpdateLicenseArgs = {
  description?: InputMaybe<Scalars['String']['input']>;
  name: Scalars['String']['input'];
  recommended?: InputMaybe<Scalars['Boolean']['input']>;
  uri: Scalars['String']['input'];
};


export type MutationUpdateMemberRoleArgs = {
  description?: InputMaybe<Scalars['String']['input']>;
  displayOrder: Scalars['Int']['input'];
  id: Scalars['Int']['input'];
  label: Scalars['String']['input'];
  url: Scalars['URL']['input'];
};


export type MutationUpdateMetadataStandardArgs = {
  input: UpdateMetadataStandardInput;
};


export type MutationUpdatePasswordArgs = {
  email: Scalars['String']['input'];
  newPassword: Scalars['String']['input'];
  oldPassword: Scalars['String']['input'];
};


export type MutationUpdatePlanFundingArgs = {
  planId: Scalars['Int']['input'];
  projectFundingIds: Array<Scalars['Int']['input']>;
};


export type MutationUpdatePlanMemberArgs = {
  isPrimaryContact?: InputMaybe<Scalars['Boolean']['input']>;
  memberRoleIds?: InputMaybe<Array<Scalars['Int']['input']>>;
  planId: Scalars['Int']['input'];
  planMemberId: Scalars['Int']['input'];
};


export type MutationUpdatePlanStatusArgs = {
  planId: Scalars['Int']['input'];
  status: PlanStatus;
};


export type MutationUpdatePlanTitleArgs = {
  planId: Scalars['Int']['input'];
  title: Scalars['String']['input'];
};


export type MutationUpdateProjectArgs = {
  input?: InputMaybe<UpdateProjectInput>;
};


export type MutationUpdateProjectCollaboratorArgs = {
  accessLevel: ProjectCollaboratorAccessLevel;
  projectCollaboratorId: Scalars['Int']['input'];
};


export type MutationUpdateProjectFundingArgs = {
  input: UpdateProjectFundingInput;
};


export type MutationUpdateProjectMemberArgs = {
  input: UpdateProjectMemberInput;
};


export type MutationUpdateQuestionArgs = {
  input: UpdateQuestionInput;
};


export type MutationUpdateQuestionConditionArgs = {
  input: UpdateQuestionConditionInput;
};


export type MutationUpdateQuestionCustomizationArgs = {
  input: UpdateQuestionCustomizationInput;
};


export type MutationUpdateQuestionDisplayOrderArgs = {
  newDisplayOrder: Scalars['Int']['input'];
  questionId: Scalars['Int']['input'];
};


export type MutationUpdateRelatedWorkStatusArgs = {
  input: UpdateRelatedWorkStatusInput;
};


export type MutationUpdateRepositoryArgs = {
  input?: InputMaybe<UpdateRepositoryInput>;
};


export type MutationUpdateResearchOutputTypeArgs = {
  description?: InputMaybe<Scalars['String']['input']>;
  id: Scalars['Int']['input'];
  name: Scalars['String']['input'];
};


export type MutationUpdateSectionArgs = {
  input: UpdateSectionInput;
};


export type MutationUpdateSectionCustomizationArgs = {
  input: UpdateSectionCustomizationInput;
};


export type MutationUpdateSectionDisplayOrderArgs = {
  newDisplayOrder: Scalars['Int']['input'];
  sectionId: Scalars['Int']['input'];
};


export type MutationUpdateTagArgs = {
  description?: InputMaybe<Scalars['String']['input']>;
  name: Scalars['String']['input'];
  tagId: Scalars['Int']['input'];
};


export type MutationUpdateTemplateArgs = {
  bestPractice?: InputMaybe<Scalars['Boolean']['input']>;
  name: Scalars['String']['input'];
  templateId: Scalars['Int']['input'];
};


export type MutationUpdateTemplateCustomizationArgs = {
  input: UpdateTemplateCustomizationInput;
};


export type MutationUpdateUserNotificationsArgs = {
  input: UpdateUserNotificationsInput;
};


export type MutationUpdateUserProfileArgs = {
  input: UpdateUserProfileInput;
};


export type MutationUploadPlanArgs = {
  fileContent?: InputMaybe<Scalars['String']['input']>;
  fileName?: InputMaybe<Scalars['String']['input']>;
  projectId: Scalars['Int']['input'];
};


export type MutationUpsertRelatedWorkArgs = {
  input: UpsertRelatedWorkInput;
};

/** Work metadata returned by the OpenSearch works-index */
export type OpenSearchWork = {
  __typename?: 'OpenSearchWork';
  /** The abstract of the work */
  abstractText?: Maybe<Scalars['String']['output']>;
  /** The authors of the work */
  authors: Array<Author>;
  /** The awards that funded the work */
  awards: Array<Award>;
  /** The DOI of the work */
  doi: Scalars['String']['output'];
  /** The funders of the work */
  funders: Array<Funder>;
  /** A hash of the content of this version of a work */
  hash: Scalars['MD5']['output'];
  /** The unique institutions of the authors of the work */
  institutions: Array<Institution>;
  /** The date that the work was published YYYY-MM-DD */
  publicationDate?: Maybe<Scalars['String']['output']>;
  /** The venue where the work was published, e.g. IEEE Transactions on Software Engineering, Zenodo etc */
  publicationVenue?: Maybe<Scalars['String']['output']>;
  /** The source of the work */
  source: OpenSearchWorkSource;
  /** The title of the work */
  title?: Maybe<Scalars['String']['output']>;
  /** The date that the work was updated YYYY-MM-DD */
  updatedDate?: Maybe<Scalars['String']['output']>;
  /** The type of the work */
  workType: WorkType;
};

export type OpenSearchWorkSource = {
  __typename?: 'OpenSearchWorkSource';
  /** The name of the source where the work was found */
  name: Scalars['String']['output'];
  /** The URL for the source of the work */
  url?: Maybe<Scalars['String']['output']>;
};

export type PaginatedQueryResults = {
  /** The sortFields that are available for this query (for standard offset pagination only!) */
  availableSortFields?: Maybe<Array<Maybe<Scalars['String']['output']>>>;
  /** The current offset of the results (for standard offset pagination only!) */
  currentOffset?: Maybe<Scalars['Int']['output']>;
  /** Whether or not there is a next page */
  hasNextPage?: Maybe<Scalars['Boolean']['output']>;
  /** Whether or not there is a previous page (standard offset pagination only!) */
  hasPreviousPage?: Maybe<Scalars['Boolean']['output']>;
  /** The number of items returned */
  limit?: Maybe<Scalars['Int']['output']>;
  /** The cursor to use for the next page of results (for infinite scroll/load more only!) */
  nextCursor?: Maybe<Scalars['String']['output']>;
  /** The total number of possible items */
  totalCount?: Maybe<Scalars['Int']['output']>;
};

/** Pagination options, either cursor-based (inifite-scroll) or offset-based pagination (standard first, next, etc.) */
export type PaginationOptions = {
  /** Request just the bestPractice templates */
  bestPractice?: InputMaybe<Scalars['Boolean']['input']>;
  /** The cursor to start the pagination from (used for cursor infinite scroll/load more only!) */
  cursor?: InputMaybe<Scalars['String']['input']>;
  /** The number of items to return */
  limit?: InputMaybe<Scalars['Int']['input']>;
  /** The number of items to skip before starting the pagination (used for standard offset pagination only!) */
  offset?: InputMaybe<Scalars['Int']['input']>;
  /** Request templates whose ownerIds match the provided array of ownerURIs */
  selectOwnerURIs?: InputMaybe<Array<InputMaybe<Scalars['String']['input']>>>;
  /** The sort order (used for standard offset pagination only!) */
  sortDir?: InputMaybe<Scalars['String']['input']>;
  /** The sort field (used for standard offset pagination only!) */
  sortField?: InputMaybe<Scalars['String']['input']>;
  /** The type of pagination to use (cursor or offset) */
  type?: InputMaybe<Scalars['String']['input']>;
};

export enum PaginationType {
  /** Cursor-based pagination (infinite scroll/load more) */
  Cursor = 'CURSOR',
  /** Standard pagination using offsets (first, next, previous, last) */
  Offset = 'OFFSET'
}

/** A Data Managament Plan (DMP) */
export type Plan = {
  __typename?: 'Plan';
  /** Alternate identifiers for the plan */
  alternateIdentifiers?: Maybe<Array<AlternateIdentifier>>;
  /** Answers associated with the plan */
  answers?: Maybe<Array<Answer>>;
  /** The timestamp when the Object was created */
  created?: Maybe<Scalars['String']['output']>;
  /** The user who created the Object */
  createdById?: Maybe<Scalars['Int']['output']>;
  /** The DMP ID/DOI for the plan */
  dmpId?: Maybe<Scalars['String']['output']>;
  /** Errors associated with the Object */
  errors?: Maybe<PlanErrors>;
  /** Whether or not the plan is featured on the public plans page */
  featured?: Maybe<Scalars['Boolean']['output']>;
  /** Feedback associated with the plan */
  feedback?: Maybe<Array<PlanFeedback>>;
  /** Feedback status */
  feedbackStatus?: Maybe<PlanFeedbackStatus>;
  /** The funding for the plan */
  fundings?: Maybe<Array<PlanFunding>>;
  /** The unique identifer for the Object */
  id?: Maybe<Scalars['Int']['output']>;
  /** The language of the plan */
  languageId?: Maybe<Scalars['String']['output']>;
  /** The members for the plan */
  members?: Maybe<Array<PlanMember>>;
  /** The timestamp when the Object was last modifed */
  modified?: Maybe<Scalars['String']['output']>;
  /** The user who last modified the Object */
  modifiedById?: Maybe<Scalars['Int']['output']>;
  /** The user who created the plan */
  planCreator?: Maybe<User>;
  /** The progress the user has made within the plan */
  progress?: Maybe<PlanProgress>;
  /** The project the plan is associated with */
  project?: Maybe<Project>;
  /** Indicates that the plan is not editable by the user (i.e. readOnly = true means the user cannot edit the plan) */
  readOnly: Scalars['Boolean']['output'];
  /** The timestamp for when the Plan was registered */
  registered?: Maybe<Scalars['String']['output']>;
  /** The individual who registered the plan */
  registeredById?: Maybe<Scalars['Int']['output']>;
  /** The status/state of the plan */
  status?: Maybe<PlanStatus>;
  /** The title of the plan */
  title?: Maybe<Scalars['String']['output']>;
  /** The section search results */
  versionedSections?: Maybe<Array<PlanSectionProgress>>;
  /** The template the plan is based on */
  versionedTemplate?: Maybe<VersionedTemplate>;
  /** Prior versions of the plan */
  versions?: Maybe<Array<PlanVersion>>;
  /** The visibility/privacy setting for the plan */
  visibility?: Maybe<PlanVisibility>;
};

export enum PlanDownloadFormat {
  Csv = 'CSV',
  Docx = 'DOCX',
  Html = 'HTML',
  Json = 'JSON',
  Pdf = 'PDF',
  Text = 'TEXT'
}

/** The error messages for the plan */
export type PlanErrors = {
  __typename?: 'PlanErrors';
  dmp_id?: Maybe<Scalars['String']['output']>;
  featured?: Maybe<Scalars['String']['output']>;
  general?: Maybe<Scalars['String']['output']>;
  languageId?: Maybe<Scalars['String']['output']>;
  projectId?: Maybe<Scalars['String']['output']>;
  registered?: Maybe<Scalars['String']['output']>;
  registeredById?: Maybe<Scalars['String']['output']>;
  status?: Maybe<Scalars['String']['output']>;
  title?: Maybe<Scalars['String']['output']>;
  versionedTemplateId?: Maybe<Scalars['String']['output']>;
  visibility?: Maybe<Scalars['String']['output']>;
};

/** A round of administrative feedback for a Data Managament Plan (DMP) */
export type PlanFeedback = {
  __typename?: 'PlanFeedback';
  /** The timestamp that the feedback was marked as complete */
  completed?: Maybe<Scalars['String']['output']>;
  /** The admin who completed the feedback round */
  completedBy?: Maybe<User>;
  /** The timestamp when the Object was created */
  created?: Maybe<Scalars['String']['output']>;
  /** The user who created the Object */
  createdById?: Maybe<Scalars['Int']['output']>;
  /** Errors associated with the Object */
  errors?: Maybe<PlanFeedbackErrors>;
  /** The specific contextual commentary */
  feedbackComments?: Maybe<Array<PlanFeedbackComment>>;
  /** The unique identifer for the Object */
  id?: Maybe<Scalars['Int']['output']>;
  /** Message user sent to org when requesting feedback, which can be NULL */
  messageToOrg?: Maybe<Scalars['String']['output']>;
  /** The timestamp when the Object was last modifed */
  modified?: Maybe<Scalars['String']['output']>;
  /** The user who last modified the Object */
  modifiedById?: Maybe<Scalars['Int']['output']>;
  /** The plan the user wants feedback on */
  plan?: Maybe<Plan>;
  /** The timestamp of when the user requested the feedback */
  requested?: Maybe<Scalars['String']['output']>;
  /** The user who requested the round of feedback */
  requestedBy?: Maybe<User>;
  /** An overall summary that can be sent to the user upon completion */
  summaryText?: Maybe<Scalars['String']['output']>;
};

export type PlanFeedbackComment = {
  __typename?: 'PlanFeedbackComment';
  /** The round of plan feedback the comment belongs to */
  PlanFeedback?: Maybe<PlanFeedback>;
  /** The answerId the comment is related to */
  answerId?: Maybe<Scalars['Int']['output']>;
  /** The comment */
  commentText?: Maybe<Scalars['String']['output']>;
  /** The timestamp when the Object was created */
  created?: Maybe<Scalars['String']['output']>;
  /** The user who created the Object */
  createdById?: Maybe<Scalars['Int']['output']>;
  /** Errors associated with the Object */
  errors?: Maybe<PlanFeedbackCommentErrors>;
  /** The unique identifer for the Object */
  id?: Maybe<Scalars['Int']['output']>;
  /** The timestamp when the Object was last modifed */
  modified?: Maybe<Scalars['String']['output']>;
  /** The user who last modified the Object */
  modifiedById?: Maybe<Scalars['Int']['output']>;
  /** User who made the comment */
  user?: Maybe<User>;
};

/** A collection of errors related to the PlanFeedbackComment */
export type PlanFeedbackCommentErrors = {
  __typename?: 'PlanFeedbackCommentErrors';
  answer?: Maybe<Scalars['String']['output']>;
  comment?: Maybe<Scalars['String']['output']>;
  /** General error messages such as the object already exists */
  general?: Maybe<Scalars['String']['output']>;
  planFeedback?: Maybe<Scalars['String']['output']>;
};

/** A collection of errors related to the PlanFeedback */
export type PlanFeedbackErrors = {
  __typename?: 'PlanFeedbackErrors';
  completedById?: Maybe<Scalars['String']['output']>;
  feedbackComments?: Maybe<Scalars['String']['output']>;
  /** General error messages such as the object already exists */
  general?: Maybe<Scalars['String']['output']>;
  planId?: Maybe<Scalars['String']['output']>;
  requestedById?: Maybe<Scalars['String']['output']>;
  summaryText?: Maybe<Scalars['String']['output']>;
};

/** Info on the Plan Feedback Status */
export type PlanFeedbackStatus = {
  __typename?: 'PlanFeedbackStatus';
  /** The id of the feedback request if it exists */
  id?: Maybe<Scalars['Int']['output']>;
  /** The status of the plan feedback (NONE, REQUESTED, COMPLETED) */
  status?: Maybe<PlanFeedbackStatusEnum>;
};

export enum PlanFeedbackStatusEnum {
  Completed = 'COMPLETED',
  None = 'NONE',
  Requested = 'REQUESTED'
}

/** Funding associated with a plan */
export type PlanFunding = {
  __typename?: 'PlanFunding';
  /** The timestamp when the Object was created */
  created?: Maybe<Scalars['String']['output']>;
  /** The user who created the Object */
  createdById?: Maybe<Scalars['Int']['output']>;
  /** Errors associated with the Object */
  errors?: Maybe<PlanFundingErrors>;
  /** The unique identifer for the Object */
  id?: Maybe<Scalars['Int']['output']>;
  /** The timestamp when the Object was last modifed */
  modified?: Maybe<Scalars['String']['output']>;
  /** The user who last modified the Object */
  modifiedById?: Maybe<Scalars['Int']['output']>;
  /** The plan that is seeking (or has aquired) funding */
  plan?: Maybe<Plan>;
  /** The project funder */
  projectFunding?: Maybe<ProjectFunding>;
};

/** A collection of errors related to the PlanFunding */
export type PlanFundingErrors = {
  __typename?: 'PlanFundingErrors';
  ProjectFundingId?: Maybe<Scalars['String']['output']>;
  /** General error messages such as the object already exists */
  general?: Maybe<Scalars['String']['output']>;
  planId?: Maybe<Scalars['String']['output']>;
};

/** Guidance items for a plan and user */
export type PlanGuidance = {
  __typename?: 'PlanGuidance';
  /** The affiliation the guidance is associated with */
  affiliation?: Maybe<Affiliation>;
  /** The id of the affiliation who has the guidance */
  affiliationId: Scalars['String']['output'];
  /** The timestamp when the Object was created */
  created?: Maybe<Scalars['String']['output']>;
  /** The user who created the Object */
  createdById?: Maybe<Scalars['Int']['output']>;
  /** Errors associated with the Object */
  errors?: Maybe<PlanGuidanceErrors>;
  /** The unique identifier for the Object */
  id?: Maybe<Scalars['Int']['output']>;
  /** The timestamp when the Object was last modified */
  modified?: Maybe<Scalars['String']['output']>;
  /** The user who last modified the Object */
  modifiedById?: Maybe<Scalars['Int']['output']>;
  /** The plan the guidance is associated with */
  plan?: Maybe<Plan>;
  /** The id of the plan */
  planId: Scalars['Int']['output'];
  /** The user who selected the guidance */
  user?: Maybe<User>;
  /** The id of the user in the plan who selected the guidance */
  userId: Scalars['Int']['output'];
};

/** A collection of errors related to PlanGuidance */
export type PlanGuidanceErrors = {
  __typename?: 'PlanGuidanceErrors';
  affiliationId?: Maybe<Scalars['String']['output']>;
  /** General error messages */
  general?: Maybe<Scalars['String']['output']>;
  planId?: Maybe<Scalars['String']['output']>;
  userId?: Maybe<Scalars['String']['output']>;
};

/** A Member associated with a plan */
export type PlanMember = {
  __typename?: 'PlanMember';
  /** The timestamp when the Object was created */
  created?: Maybe<Scalars['String']['output']>;
  /** The user who created the Object */
  createdById?: Maybe<Scalars['Int']['output']>;
  /** Errors associated with the Object */
  errors?: Maybe<PlanMemberErrors>;
  /** The unique identifer for the Object */
  id?: Maybe<Scalars['Int']['output']>;
  /** Whether or not the Member the primary contact for the Plan */
  isPrimaryContact?: Maybe<Scalars['Boolean']['output']>;
  /** The roles associated with the Member */
  memberRoles?: Maybe<Array<MemberRole>>;
  /** The timestamp when the Object was last modifed */
  modified?: Maybe<Scalars['String']['output']>;
  /** The user who last modified the Object */
  modifiedById?: Maybe<Scalars['Int']['output']>;
  /** The plan that the Member is associated with */
  plan?: Maybe<Plan>;
  /** The project Member */
  projectMember?: Maybe<ProjectMember>;
};

/** A collection of errors related to the PlanMember */
export type PlanMemberErrors = {
  __typename?: 'PlanMemberErrors';
  /** General error messages such as affiliation already exists */
  general?: Maybe<Scalars['String']['output']>;
  /** The roles associated with the Member */
  memberRoleIds?: Maybe<Scalars['String']['output']>;
  /** The isPrimaryContact flag */
  primaryContact?: Maybe<Scalars['String']['output']>;
  /** The project that the Member is associated with */
  projectId?: Maybe<Scalars['String']['output']>;
  /** The project Member */
  projectMemberId?: Maybe<Scalars['String']['output']>;
};

export type PlanProgress = {
  __typename?: 'PlanProgress';
  /** The total number of questions the user has answered */
  answeredQuestions: Scalars['Int']['output'];
  /** The percentage of questions the user has answered */
  percentComplete: Scalars['Float']['output'];
  /** The total number of questions in the plan */
  totalQuestions: Scalars['Int']['output'];
};

export type PlanSearchResult = {
  __typename?: 'PlanSearchResult';
  /** The timestamp when the Object was created */
  created?: Maybe<Scalars['String']['output']>;
  /** The user who created the Object */
  createdBy?: Maybe<Scalars['String']['output']>;
  /** The DMP ID/DOI for the plan */
  dmpId?: Maybe<Scalars['String']['output']>;
  /** The funding information for the plan */
  funding?: Maybe<Scalars['String']['output']>;
  /** The unique identifer for the Object */
  id?: Maybe<Scalars['Int']['output']>;
  /** The names of the members */
  members?: Maybe<Scalars['String']['output']>;
  /** The timestamp when the Object was last modifed */
  modified?: Maybe<Scalars['String']['output']>;
  /** The user who last modified the Object */
  modifiedBy?: Maybe<Scalars['String']['output']>;
  /** The timestamp for when the Plan was registered/published */
  registered?: Maybe<Scalars['String']['output']>;
  /** The person who published/registered the plan */
  registeredBy?: Maybe<Scalars['String']['output']>;
  /** The current status of the plan */
  status?: Maybe<PlanStatus>;
  /** The name of the template the plan is based on */
  templateTitle?: Maybe<Scalars['String']['output']>;
  /** The title of the plan */
  title?: Maybe<Scalars['String']['output']>;
  /** The section search results */
  versionedSections?: Maybe<Array<PlanSectionProgress>>;
  /** The versioned template id the plan is based on */
  versionedTemplateId?: Maybe<Scalars['Int']['output']>;
  /** The visibility/permission setting */
  visibility?: Maybe<PlanVisibility>;
};

/** The progress the user has made within a section of the plan */
export type PlanSectionProgress = {
  __typename?: 'PlanSectionProgress';
  /** The number of questions the user has answered */
  answeredQuestions: Scalars['Int']['output'];
  /** The custom section id if the section is a customization, otherwise null */
  customSectionId?: Maybe<Scalars['Int']['output']>;
  /** The display order of the section */
  displayOrder: Scalars['Int']['output'];
  /** Whether or not the section is a customization (i.e. added by the user and not part of the original template) */
  sectionType: CustomizableObjectOwnership;
  /** Tags associated with the section */
  tags?: Maybe<Array<Tag>>;
  /** The title of the section */
  title: Scalars['String']['output'];
  /** The number of questions in the section */
  totalQuestions: Scalars['Int']['output'];
  /** The id of the Section */
  versionedSectionId?: Maybe<Scalars['Int']['output']>;
};

/** The status/state of the plan */
export enum PlanStatus {
  /** The Plan has been archived */
  Archived = 'ARCHIVED',
  /** The Plan is ready for submission or download */
  Complete = 'COMPLETE',
  /** The Plan is still being written and reviewed */
  Draft = 'DRAFT'
}

/** A version of the plan */
export type PlanVersion = {
  __typename?: 'PlanVersion';
  /** The timestamp of the version, equates to the plan's modified date */
  timestamp?: Maybe<Scalars['String']['output']>;
  /** The DMPHub URL for the version */
  url?: Maybe<Scalars['String']['output']>;
};

/** The visibility/privacy setting for the plan */
export enum PlanVisibility {
  /** Visible only to people at the user's (or editor's) affiliation */
  Organizational = 'ORGANIZATIONAL',
  /** Visible only to people who have been invited to collaborate (or provide feedback) */
  Private = 'PRIVATE',
  /** Visible to anyone */
  Public = 'PUBLIC'
}

/** DMP Tool Project type */
export type Project = {
  __typename?: 'Project';
  /** The research project abstract */
  abstractText?: Maybe<Scalars['String']['output']>;
  /** People who have access to modify or comment on the Project */
  collaborators?: Maybe<Array<ProjectCollaborator>>;
  /** The timestamp when the Object was created */
  created?: Maybe<Scalars['String']['output']>;
  /** The user who created the Object */
  createdById?: Maybe<Scalars['Int']['output']>;
  /** The estimated date the research project will end (use YYYY-MM-DD format) */
  endDate?: Maybe<Scalars['String']['output']>;
  /** Errors associated with the Object */
  errors?: Maybe<ProjectErrors>;
  /** The funders who are supporting the research project */
  fundings?: Maybe<Array<ProjectFunding>>;
  /** The unique identifer for the Object */
  id?: Maybe<Scalars['Int']['output']>;
  /** Whether or not this is test/mock research project */
  isTestProject?: Maybe<Scalars['Boolean']['output']>;
  /** People who are contributing to the research project (not just the DMP) */
  members?: Maybe<Array<ProjectMember>>;
  /** The timestamp when the Object was last modifed */
  modified?: Maybe<Scalars['String']['output']>;
  /** The user who last modified the Object */
  modifiedById?: Maybe<Scalars['Int']['output']>;
  /** The plans that are associated with the research project */
  plans?: Maybe<Array<PlanSearchResult>>;
  /** The type of research being done */
  researchDomain?: Maybe<ResearchDomain>;
  /** The estimated date the research project will begin (use YYYY-MM-DD format) */
  startDate?: Maybe<Scalars['String']['output']>;
  /** The name/title of the research project */
  title: Scalars['String']['output'];
};

/** A user that that belongs to a different affiliation that can edit the Plan */
export type ProjectCollaborator = {
  __typename?: 'ProjectCollaborator';
  /** The user's access level */
  accessLevel?: Maybe<ProjectCollaboratorAccessLevel>;
  /** The timestamp when the Object was created */
  created?: Maybe<Scalars['String']['output']>;
  /** The user who created the Object */
  createdById?: Maybe<Scalars['Int']['output']>;
  /** The collaborator's email */
  email: Scalars['String']['output'];
  /** Errors associated with the Object */
  errors?: Maybe<ProjectCollaboratorErrors>;
  /** The unique identifer for the Object */
  id?: Maybe<Scalars['Int']['output']>;
  /** The user who invited the collaborator */
  invitedBy?: Maybe<User>;
  /** The timestamp when the Object was last modifed */
  modified?: Maybe<Scalars['String']['output']>;
  /** The user who last modified the Object */
  modifiedById?: Maybe<Scalars['Int']['output']>;
  /** The project the collaborator may edit */
  project?: Maybe<Project>;
  /** The project member id */
  projectMemberId?: Maybe<Scalars['Int']['output']>;
  /** The collaborator (if they have an account) */
  user?: Maybe<User>;
};

export enum ProjectCollaboratorAccessLevel {
  /** The user is ONLY able to comment on the Plan's answers */
  Comment = 'COMMENT',
  /** The user is able to perform most actions on a Project/Plan except (publish, mark as complete and change access) */
  Edit = 'EDIT',
  /** Has admin rights to project (can invite other users, edit the plans and publish them) */
  Own = 'OWN',
  /** The user is able to perform all actions on a Plan (typically restricted to the owner/creator) */
  Primary = 'PRIMARY'
}

/** A collection of errors related to the ProjectCollaborator */
export type ProjectCollaboratorErrors = {
  __typename?: 'ProjectCollaboratorErrors';
  accessLevel?: Maybe<Scalars['String']['output']>;
  email?: Maybe<Scalars['String']['output']>;
  /** General error messages such as affiliation already exists */
  general?: Maybe<Scalars['String']['output']>;
  invitedById?: Maybe<Scalars['String']['output']>;
  planId?: Maybe<Scalars['String']['output']>;
  userId?: Maybe<Scalars['String']['output']>;
};

/** A collection of errors related to the Project */
export type ProjectErrors = {
  __typename?: 'ProjectErrors';
  abstractText?: Maybe<Scalars['String']['output']>;
  endDate?: Maybe<Scalars['String']['output']>;
  fundingIds?: Maybe<Scalars['String']['output']>;
  /** General error messages such as the object already exists */
  general?: Maybe<Scalars['String']['output']>;
  memberIds?: Maybe<Scalars['String']['output']>;
  researchDomainId?: Maybe<Scalars['String']['output']>;
  startDate?: Maybe<Scalars['String']['output']>;
  title?: Maybe<Scalars['String']['output']>;
};

/** Project search filter options */
export type ProjectFilterOptions = {
  /** Filter results by the plan's status */
  status?: InputMaybe<PlanStatus>;
};

/** Funding that is supporting a research project */
export type ProjectFunding = {
  __typename?: 'ProjectFunding';
  /** The funder */
  affiliation?: Maybe<Affiliation>;
  /** The timestamp when the Object was created */
  created?: Maybe<Scalars['String']['output']>;
  /** The user who created the Object */
  createdById?: Maybe<Scalars['Int']['output']>;
  /** Errors associated with the Object */
  errors?: Maybe<ProjectFundingErrors>;
  /** The funder's unique id/url for the call for submissions to apply for a grant */
  funderOpportunityNumber?: Maybe<Scalars['String']['output']>;
  /** The funder's unique id/url for the research project (normally assigned after the grant has been awarded) */
  funderProjectNumber?: Maybe<Scalars['String']['output']>;
  /** The funder's unique id/url for the award/grant (normally assigned after the grant has been awarded) */
  grantId?: Maybe<Scalars['String']['output']>;
  /** The unique identifer for the Object */
  id?: Maybe<Scalars['Int']['output']>;
  /** The timestamp when the Object was last modifed */
  modified?: Maybe<Scalars['String']['output']>;
  /** The user who last modified the Object */
  modifiedById?: Maybe<Scalars['Int']['output']>;
  /** The project that is seeking (or has aquired) funding */
  project?: Maybe<Project>;
  /** The status of the funding resquest */
  status?: Maybe<ProjectFundingStatus>;
};

/** A collection of errors related to the ProjectFunding */
export type ProjectFundingErrors = {
  __typename?: 'ProjectFundingErrors';
  affiliationId?: Maybe<Scalars['String']['output']>;
  funderOpportunityNumber?: Maybe<Scalars['String']['output']>;
  funderProjectNumber?: Maybe<Scalars['String']['output']>;
  /** General error messages such as the object already exists */
  general?: Maybe<Scalars['String']['output']>;
  grantId?: Maybe<Scalars['String']['output']>;
  projectId?: Maybe<Scalars['String']['output']>;
  status?: Maybe<Scalars['String']['output']>;
};

/** The status of the funding */
export enum ProjectFundingStatus {
  /** The funder did not award the project */
  Denied = 'DENIED',
  /** The funding has been awarded to the project */
  Granted = 'GRANTED',
  /** The project will be submitting a grant, or has not yet heard back from the funder */
  Planned = 'PLANNED'
}

export type ProjectImportInput = {
  /** The external funding data */
  funding?: InputMaybe<Array<AddProjectFundingInput>>;
  /** The external member data */
  members?: InputMaybe<Array<AddProjectMemberInput>>;
  /** The external project data */
  project: UpdateProjectInput;
};

/** A person involved with a research project */
export type ProjectMember = {
  __typename?: 'ProjectMember';
  /** The Member's affiliation */
  affiliation?: Maybe<Affiliation>;
  /** The timestamp when the Object was created */
  created?: Maybe<Scalars['String']['output']>;
  /** The user who created the Object */
  createdById?: Maybe<Scalars['Int']['output']>;
  /** The Member's email address */
  email?: Maybe<Scalars['String']['output']>;
  /** Errors associated with the Object */
  errors?: Maybe<ProjectMemberErrors>;
  /** The Member's first/given name */
  givenName?: Maybe<Scalars['String']['output']>;
  /** The unique identifer for the Object */
  id?: Maybe<Scalars['Int']['output']>;
  /** Whether or not the Member the primary contact for the Plan */
  isPrimaryContact?: Maybe<Scalars['Boolean']['output']>;
  /** The roles the Member has on the research project */
  memberRoles?: Maybe<Array<MemberRole>>;
  /** The timestamp when the Object was last modifed */
  modified?: Maybe<Scalars['String']['output']>;
  /** The user who last modified the Object */
  modifiedById?: Maybe<Scalars['Int']['output']>;
  /** The Member's ORCID */
  orcid?: Maybe<Scalars['String']['output']>;
  /** The research project */
  project?: Maybe<Project>;
  /** The Member's last/sur name */
  surName?: Maybe<Scalars['String']['output']>;
};

/** A collection of errors related to the ProjectMember */
export type ProjectMemberErrors = {
  __typename?: 'ProjectMemberErrors';
  affiliationId?: Maybe<Scalars['String']['output']>;
  email?: Maybe<Scalars['String']['output']>;
  /** General error messages such as the object already exists */
  general?: Maybe<Scalars['String']['output']>;
  givenName?: Maybe<Scalars['String']['output']>;
  memberRoleIds?: Maybe<Scalars['String']['output']>;
  orcid?: Maybe<Scalars['String']['output']>;
  projectId?: Maybe<Scalars['String']['output']>;
  surName?: Maybe<Scalars['String']['output']>;
};

export type ProjectSearchResult = {
  __typename?: 'ProjectSearchResult';
  /** The research project abstract */
  abstractText?: Maybe<Scalars['String']['output']>;
  /** The names and access levels of the collaborators */
  collaborators?: Maybe<Array<ProjectSearchResultCollaborator>>;
  /** The timestamp when the project was created */
  created?: Maybe<Scalars['String']['output']>;
  /** The id of the person who created the project */
  createdById?: Maybe<Scalars['Int']['output']>;
  /** The name of the person who created the project */
  createdByName?: Maybe<Scalars['String']['output']>;
  /** The estimated date the research project will end (use YYYY-MM-DD format) */
  endDate?: Maybe<Scalars['String']['output']>;
  /** Search results errors */
  errors?: Maybe<ProjectErrors>;
  /** The names of the funders */
  fundings?: Maybe<Array<ProjectSearchResultFunding>>;
  /** The unique identifer for the Object */
  id?: Maybe<Scalars['Int']['output']>;
  /** Whether or not this is test/mock research project */
  isTestProject?: Maybe<Scalars['Boolean']['output']>;
  /** The names and roles of the members */
  members?: Maybe<Array<ProjectSearchResultMember>>;
  /** The timestamp when the project was last modified */
  modified?: Maybe<Scalars['String']['output']>;
  /** The id of the person who last modified the project */
  modifiedById?: Maybe<Scalars['Int']['output']>;
  /** The name of the person who last modified the project */
  modifiedByName?: Maybe<Scalars['String']['output']>;
  /** The type of research being done */
  researchDomain?: Maybe<Scalars['String']['output']>;
  /** The estimated date the research project will begin (use YYYY-MM-DD format) */
  startDate?: Maybe<Scalars['String']['output']>;
  /** The name/title of the research project */
  title?: Maybe<Scalars['String']['output']>;
};

export type ProjectSearchResultCollaborator = {
  __typename?: 'ProjectSearchResultCollaborator';
  /** The access level of the collaborator */
  accessLevel?: Maybe<Scalars['String']['output']>;
  /** The name of the collaborator */
  name?: Maybe<Scalars['String']['output']>;
  /** The ORCiD ID */
  orcid?: Maybe<Scalars['String']['output']>;
};

export type ProjectSearchResultFunding = {
  __typename?: 'ProjectSearchResultFunding';
  /** The grant id/url */
  grantId?: Maybe<Scalars['String']['output']>;
  /** The name of the funder */
  name?: Maybe<Scalars['String']['output']>;
};

export type ProjectSearchResultMember = {
  __typename?: 'ProjectSearchResultMember';
  /** The name of the member */
  name?: Maybe<Scalars['String']['output']>;
  /** The ORCiD ID */
  orcid?: Maybe<Scalars['String']['output']>;
  /** The role of the member */
  role?: Maybe<Scalars['String']['output']>;
};

export type ProjectSearchResults = PaginatedQueryResults & {
  __typename?: 'ProjectSearchResults';
  /** The sortFields that are available for this query (for standard offset pagination only!) */
  availableSortFields?: Maybe<Array<Maybe<Scalars['String']['output']>>>;
  /** The current offset of the results (for standard offset pagination) */
  currentOffset?: Maybe<Scalars['Int']['output']>;
  /** Whether or not there is a next page */
  hasNextPage?: Maybe<Scalars['Boolean']['output']>;
  /** Whether or not there is a previous page */
  hasPreviousPage?: Maybe<Scalars['Boolean']['output']>;
  /** The TemplateSearchResults that match the search criteria */
  items?: Maybe<Array<Maybe<ProjectSearchResult>>>;
  /** The number of items returned */
  limit?: Maybe<Scalars['Int']['output']>;
  /** The cursor to use for the next page of results (for infinite scroll/load more) */
  nextCursor?: Maybe<Scalars['String']['output']>;
  /** The total number of possible items */
  totalCount?: Maybe<Scalars['Int']['output']>;
};

/** A normalized question result covering both base and custom questions, with answer status */
export type PublishedQuestion = {
  __typename?: 'PublishedQuestion';
  /** Present when questionType is CUSTOM */
  customQuestionId?: Maybe<Scalars['Int']['output']>;
  /** Guidance to complete the question */
  guidanceText?: Maybe<Scalars['String']['output']>;
  /** Indicates whether the question has an answer */
  hasAnswer?: Maybe<Scalars['Boolean']['output']>;
  /** The unique identifier for the Object */
  id?: Maybe<Scalars['Int']['output']>;
  /** The JSON representation of the question type */
  json?: Maybe<Scalars['String']['output']>;
  /** This will be used as a sort of title for the Question */
  questionText?: Maybe<Scalars['String']['output']>;
  /** Whether this is a BASE or CUSTOM question */
  questionType?: Maybe<Scalars['String']['output']>;
  /** To indicate whether the question is required to be completed */
  required?: Maybe<Scalars['Boolean']['output']>;
  /** Requirements associated with the Question */
  requirementText?: Maybe<Scalars['String']['output']>;
  /** Sample text to possibly provide a starting point or example to answer question */
  sampleText?: Maybe<Scalars['String']['output']>;
  /** Whether or not the sample text should be used as the default answer for this question */
  useSampleTextAsDefault?: Maybe<Scalars['Boolean']['output']>;
  /** Present when questionType is BASE */
  versionedQuestionId?: Maybe<Scalars['Int']['output']>;
};

export type PublishedTemplateMetaDataResults = {
  __typename?: 'PublishedTemplateMetaDataResults';
  /** The available affiliations in the result set */
  availableAffiliations?: Maybe<Array<Maybe<Scalars['String']['output']>>>;
  /** Whether the result set includes bestPractice templates */
  hasBestPracticeTemplates?: Maybe<Scalars['Boolean']['output']>;
};

export type PublishedTemplateSearchResults = PaginatedQueryResults & {
  __typename?: 'PublishedTemplateSearchResults';
  /** The sortFields that are available for this query (for standard offset pagination only!) */
  availableSortFields?: Maybe<Array<Maybe<Scalars['String']['output']>>>;
  /** The current offset of the results (for standard offset pagination) */
  currentOffset?: Maybe<Scalars['Int']['output']>;
  /** Whether or not there is a next page */
  hasNextPage?: Maybe<Scalars['Boolean']['output']>;
  /** Whether or not there is a previous page */
  hasPreviousPage?: Maybe<Scalars['Boolean']['output']>;
  /** The TemplateSearchResults that match the search criteria */
  items?: Maybe<Array<Maybe<VersionedTemplateSearchResult>>>;
  /** The number of items returned */
  limit?: Maybe<Scalars['Int']['output']>;
  /** The cursor to use for the next page of results (for infinite scroll/load more) */
  nextCursor?: Maybe<Scalars['String']['output']>;
  /** The total number of possible items */
  totalCount?: Maybe<Scalars['Int']['output']>;
};

export type Query = {
  __typename?: 'Query';
  _empty?: Maybe<Scalars['String']['output']>;
  /** Retrieve a specific Affiliation by its ID */
  affiliationById?: Maybe<Affiliation>;
  /** Retrieve a specific Affiliation by its URI */
  affiliationByURI?: Maybe<Affiliation>;
  /** Retrieve all of the valid Affiliation types */
  affiliationTypes?: Maybe<Array<Scalars['String']['output']>>;
  /** Perform a search for Affiliations matching the specified name */
  affiliations?: Maybe<AffiliationSearchResults>;
  /** Get all projects for the Admin based on their role */
  allProjects?: Maybe<ProjectSearchResults>;
  /** Get the specific answer */
  answer?: Maybe<Answer>;
  /** Get an answer by versionedQuestionId */
  answerByVersionedQuestionId?: Maybe<Answer>;
  /** Get all answers for the given project and plan and section */
  answers?: Maybe<Array<Maybe<Answer>>>;
  /** Get the best practice VersionedGuidance for given Tag IDs */
  bestPracticeGuidance: Array<VersionedGuidance>;
  /** Get all of the best practice VersionedSection */
  bestPracticeSections?: Maybe<Array<Maybe<VersionedSection>>>;
  /** Get all of the research domains related to the specified top level domain (more nuanced ones) */
  childResearchDomains?: Maybe<Array<Maybe<ResearchDomain>>>;
  /** Get the custom question the affiliation has added to a funder section or custom section (user must be an Admin) */
  customQuestion?: Maybe<CustomQuestion>;
  /** Get the specified custom section an affiliation has added to a funder template (user must be an Admin) */
  customSection?: Maybe<CustomSection>;
  /** Get all of the customizable templates for the current user's affiliation (user must be an Admin) */
  customizableTemplates?: Maybe<CustomizableTemplateSearchResults>;
  /** Get all of the research output types */
  defaultResearchOutputTypes?: Maybe<Array<Maybe<ResearchOutputType>>>;
  /** Get the default best practice template. */
  defaultTemplate?: Maybe<VersionedTemplate>;
  /** Search for a User to add as a collaborator */
  findCollaborator?: Maybe<CollaboratorSearchResults>;
  /** Find a work with an identifier */
  findWorkByIdentifier?: Maybe<RelatedWorkSearchResults>;
  /** Get a specific Guidance item by ID */
  guidance?: Maybe<Guidance>;
  /** Get all Guidance items for a specific GuidanceGroup */
  guidanceByGroup: Array<Guidance>;
  /** Get a specific GuidanceGroup by ID */
  guidanceGroup?: Maybe<GuidanceGroup>;
  /** Get all GuidanceGroups for the user's organization (or for a specified affiliationId if provided and permitted) */
  guidanceGroups: Array<GuidanceGroup>;
  /** Get all guidance sources for a plan, optionally filtered by section */
  guidanceSourcesForPlan: Array<GuidanceSource>;
  /** Get all of the supported Languages */
  languages?: Maybe<Array<Maybe<Language>>>;
  /** Fetch a specific license */
  license?: Maybe<License>;
  /** Return all licenses */
  licenses?: Maybe<Array<Maybe<License>>>;
  /** Perform a search for managed Affiliations with published guidance for a specific template */
  managedAffiliationsWithGuidance?: Maybe<AffiliationSearchResults>;
  /** Returns the currently logged in user's information */
  me?: Maybe<User>;
  /** Get the member role by it's id */
  memberRoleById?: Maybe<MemberRole>;
  /** Get the member role by it's URL */
  memberRoleByURL?: Maybe<MemberRole>;
  /** Get all of the member role types */
  memberRoles?: Maybe<Array<Maybe<MemberRole>>>;
  /** Fetch a specific metadata standard */
  metadataStandard?: Maybe<MetadataStandard>;
  /** Search for a metadata standard */
  metadataStandards?: Maybe<MetadataStandardSearchResults>;
  /** return all metadata standards whose unique uri values are provided */
  metadataStandardsByURIs?: Maybe<Array<MetadataStandard>>;
  /** Get all of the user's projects */
  myProjects?: Maybe<ProjectSearchResults>;
  /** Get the Templates that belong to the current user's affiliation (user must be an Admin) */
  myTemplates?: Maybe<TemplateSearchResults>;
  /** Get the VersionedTemplates that belong to the current user's affiliation (user must be an Admin) */
  myVersionedTemplates?: Maybe<Array<Maybe<VersionedTemplateSearchResult>>>;
  /** Get a specific plan */
  plan?: Maybe<Plan>;
  /** Lookup a plan by an alternate identifier */
  planByAlternateIdentifier?: Maybe<Plan>;
  /** Lookup a plan by its DMP id */
  planByDMPId?: Maybe<Plan>;
  /** Get all rounds of admin feedback for the plan */
  planFeedback?: Maybe<Array<Maybe<PlanFeedback>>>;
  /** Get all of the comments associated with the round of admin feedback */
  planFeedbackComments?: Maybe<Array<Maybe<PlanFeedbackComment>>>;
  /** Get the feedback status for a plan (NONE, REQUESTED, COMPLETED) */
  planFeedbackStatus?: Maybe<PlanFeedbackStatus>;
  /** Get all of the Funding information for the specific Plan */
  planFundings?: Maybe<Array<Maybe<PlanFunding>>>;
  /** Get all of the Users that are Members for the specific Plan */
  planMembers?: Maybe<Array<Maybe<PlanMember>>>;
  /** Get all plans for the research project */
  plans?: Maybe<Array<PlanSearchResult>>;
  /** Returns a list of the top 20 funders ranked by popularity (nbr of plans) for the past year */
  popularFunders?: Maybe<Array<Maybe<FunderPopularityResult>>>;
  /** Get a specific project */
  project?: Maybe<Project>;
  /** Get all of the Users that are collaborators for the Project */
  projectCollaborators?: Maybe<Array<Maybe<ProjectCollaborator>>>;
  /** Get a specific ProjectFunding */
  projectFunding?: Maybe<ProjectFunding>;
  /** Get all of the Funding information for the research project */
  projectFundings?: Maybe<Array<Maybe<ProjectFunding>>>;
  /** Get a specific Member on the research project */
  projectMember?: Maybe<ProjectMember>;
  /** Get all of the Users that a Members to the research project */
  projectMembers?: Maybe<Array<Maybe<ProjectMember>>>;
  /** Search for VersionedQuestions that belong to Section specified by sectionId */
  publishedConditionsForQuestion?: Maybe<Array<Maybe<VersionedQuestionCondition>>>;
  /** Get a specific published custom question based on versionedCustomQuestionId */
  publishedCustomQuestion?: Maybe<VersionedCustomQuestion>;
  /** Fetch all published custom questions for the specified versioned section */
  publishedCustomQuestions?: Maybe<Array<Maybe<PublishedQuestion>>>;
  /** Fetch a specific VersionedCustomSection for a plan - resolved via the caller's affiliation */
  publishedCustomSection?: Maybe<VersionedCustomSection>;
  /** Get a specific VersionedQuestion based on versionedQuestionId */
  publishedQuestion?: Maybe<VersionedQuestion>;
  /** Search for VersionedQuestions that belong to Section specified by sectionId and answer status for a plan */
  publishedQuestions?: Maybe<Array<Maybe<PublishedQuestion>>>;
  /** Fetch a specific VersionedSection */
  publishedSection?: Maybe<VersionedSection>;
  /** Search for VersionedSection whose name contains the search term */
  publishedSections?: Maybe<VersionedSectionSearchResults>;
  /** Search for VersionedTemplate whose name or owning Org's name contains the search term */
  publishedTemplates?: Maybe<PublishedTemplateSearchResults>;
  /** Search for templates for lightweight info on what unique affiliations are in the data set, and whether any of them have best practice */
  publishedTemplatesMetaData?: Maybe<PublishedTemplateMetaDataResults>;
  /** Get the specific Question based on questionId */
  question?: Maybe<Question>;
  /** Get the QuestionConditions that belong to a specific question */
  questionConditions?: Maybe<Array<Maybe<QuestionCondition>>>;
  /** Get the custom guidance and sample text the affiliation has added to a funder question question (user must be an Admin) */
  questionCustomization?: Maybe<QuestionCustomization>;
  /** Get the custom guidance and sample text the affiliation has added to a funder question question (user must be an Admin) */
  questionCustomizationByVersionedQuestion?: Maybe<QuestionCustomization>;
  /** Get the Questions that belong to the associated sectionId */
  questions?: Maybe<Array<Maybe<Question>>>;
  /** return all distinct repository types from re3data with optional counts */
  re3RepositoryTypesList: Re3RepositoryTypesListResults;
  /** return all distinct subject strings from re3data with optional counts */
  re3SubjectList: Re3SubjectListResults;
  /** return all re3data repositories whose unique uri values are provided */
  re3byURIs?: Maybe<Array<Re3DataRepository>>;
  /** Return the recommended Licenses */
  recommendedLicenses?: Maybe<Array<Maybe<License>>>;
  /** Get all of the related works for a project or plan */
  relatedWorks?: Maybe<RelatedWorkSearchResults>;
  /** Get summary statistics for related works by plan */
  relatedWorksByPlanStats?: Maybe<RelatedWorkStatsResults>;
  /** Get summary statistics for related works by project */
  relatedWorksByProjectStats?: Maybe<RelatedWorkStatsResults>;
  /** Search for repositories from custom database and re3data combined */
  repositories?: Maybe<RepositorySearchResults>;
  /** return all repositories whose unique uri values are provided */
  repositoriesByURIs?: Maybe<Array<CustomRepository>>;
  /** Fetch a specific custom repository */
  repository?: Maybe<CustomRepository>;
  /** return all distinct subject area keywords across all repositories */
  repositorySubjectAreas?: Maybe<Array<Scalars['String']['output']>>;
  /** Get the research output type by it's id */
  researchOutputType?: Maybe<ResearchOutputType>;
  /** Get the research output type by it's name */
  researchOutputTypeByName?: Maybe<ResearchOutputType>;
  /** Search for projects within external APIs */
  searchExternalProjects?: Maybe<Array<Maybe<ExternalProject>>>;
  /** Get the specified section */
  section?: Maybe<Section>;
  /** Get the custom guidance an affiliation has applied to a funder section (user must be an Admin) */
  sectionCustomization?: Maybe<SectionCustomization>;
  /** Get the custom guidance using the parent template customization and funder section (user must be an Admin) */
  sectionCustomizationByVersionedSection?: Maybe<SectionCustomization>;
  /** Get all of the VersionedSection for the specified Section ID */
  sectionVersions?: Maybe<Array<Maybe<VersionedSection>>>;
  /** Get the Sections that belong to the associated templateId */
  sections?: Maybe<Array<Maybe<Section>>>;
  /** Get all available tags to display */
  tags: Array<Tag>;
  tagsBySectionId?: Maybe<Array<Maybe<Tag>>>;
  /** Get the specified Template (user must be an Admin) */
  template?: Maybe<Template>;
  /** Get all of the Users that belong to another affiliation that can edit the Template */
  templateCollaborators?: Maybe<Array<Maybe<TemplateCollaborator>>>;
  /** Get the overview of the template customization (user must be an Admin) */
  templateCustomizationOverview?: Maybe<TemplateCustomizationOverview>;
  /** Get all of the VersionedTemplate for the specified Template (a.k. the Template history) */
  templateVersions?: Maybe<Array<Maybe<VersionedTemplate>>>;
  /** Get all of the top level research domains (the most generic ones) */
  topLevelResearchDomains?: Maybe<Array<Maybe<ResearchDomain>>>;
  /** Returns the specified user (Admin only) */
  user?: Maybe<User>;
  /** Returns all of the users associated with the current admin's affiliation (Super admins get everything) */
  users?: Maybe<UserSearchResults>;
  /** Get all VersionedGuidance for a given affiliation and Tag IDs */
  versionedGuidance: Array<VersionedGuidance>;
};


export type QueryAffiliationByIdArgs = {
  affiliationId: Scalars['Int']['input'];
};


export type QueryAffiliationByUriArgs = {
  uri: Scalars['String']['input'];
};


export type QueryAffiliationsArgs = {
  funderOnly?: InputMaybe<Scalars['Boolean']['input']>;
  name: Scalars['String']['input'];
  paginationOptions?: InputMaybe<PaginationOptions>;
};


export type QueryAllProjectsArgs = {
  filterOptions?: InputMaybe<ProjectFilterOptions>;
  paginationOptions?: InputMaybe<PaginationOptions>;
  term?: InputMaybe<Scalars['String']['input']>;
};


export type QueryAnswerArgs = {
  answerId: Scalars['Int']['input'];
  projectId: Scalars['Int']['input'];
};


export type QueryAnswerByVersionedQuestionIdArgs = {
  planId: Scalars['Int']['input'];
  projectId: Scalars['Int']['input'];
  versionedCustomQuestionId?: InputMaybe<Scalars['Int']['input']>;
  versionedQuestionId?: InputMaybe<Scalars['Int']['input']>;
};


export type QueryAnswersArgs = {
  planId: Scalars['Int']['input'];
  projectId: Scalars['Int']['input'];
  versionedSectionId: Scalars['Int']['input'];
};


export type QueryBestPracticeGuidanceArgs = {
  tagIds: Array<Scalars['Int']['input']>;
};


export type QueryChildResearchDomainsArgs = {
  parentResearchDomainId: Scalars['Int']['input'];
};


export type QueryCustomQuestionArgs = {
  customQuestionId: Scalars['Int']['input'];
};


export type QueryCustomSectionArgs = {
  customSectionId: Scalars['Int']['input'];
};


export type QueryCustomizableTemplatesArgs = {
  migrationStatus?: InputMaybe<Scalars['String']['input']>;
  paginationOptions?: InputMaybe<PaginationOptions>;
  status?: InputMaybe<Scalars['String']['input']>;
  term?: InputMaybe<Scalars['String']['input']>;
};


export type QueryFindCollaboratorArgs = {
  options?: InputMaybe<PaginationOptions>;
  term: Scalars['String']['input'];
};


export type QueryFindWorkByIdentifierArgs = {
  doi?: InputMaybe<Scalars['String']['input']>;
  paginationOptions?: InputMaybe<PaginationOptions>;
  planId?: InputMaybe<Scalars['Int']['input']>;
};


export type QueryGuidanceArgs = {
  guidanceId: Scalars['Int']['input'];
};


export type QueryGuidanceByGroupArgs = {
  guidanceGroupId: Scalars['Int']['input'];
};


export type QueryGuidanceGroupArgs = {
  guidanceGroupId: Scalars['Int']['input'];
};


export type QueryGuidanceGroupsArgs = {
  affiliationId?: InputMaybe<Scalars['String']['input']>;
};


export type QueryGuidanceSourcesForPlanArgs = {
  customQuestionId?: InputMaybe<Scalars['Int']['input']>;
  customSectionId?: InputMaybe<Scalars['Int']['input']>;
  planId: Scalars['Int']['input'];
  versionedQuestionId?: InputMaybe<Scalars['Int']['input']>;
  versionedSectionId?: InputMaybe<Scalars['Int']['input']>;
};


export type QueryLicenseArgs = {
  uri: Scalars['String']['input'];
};


export type QueryManagedAffiliationsWithGuidanceArgs = {
  name?: InputMaybe<Scalars['String']['input']>;
  paginationOptions?: InputMaybe<PaginationOptions>;
  versionedTemplateId: Scalars['Int']['input'];
};


export type QueryMemberRoleByIdArgs = {
  memberRoleId: Scalars['Int']['input'];
};


export type QueryMemberRoleByUrlArgs = {
  memberRoleURL: Scalars['URL']['input'];
};


export type QueryMetadataStandardArgs = {
  uri: Scalars['String']['input'];
};


export type QueryMetadataStandardsArgs = {
  paginationOptions?: InputMaybe<PaginationOptions>;
  researchDomainId?: InputMaybe<Scalars['Int']['input']>;
  term?: InputMaybe<Scalars['String']['input']>;
};


export type QueryMetadataStandardsByUrIsArgs = {
  uris: Array<Scalars['String']['input']>;
};


export type QueryMyProjectsArgs = {
  filterOptions?: InputMaybe<ProjectFilterOptions>;
  paginationOptions?: InputMaybe<PaginationOptions>;
  term?: InputMaybe<Scalars['String']['input']>;
};


export type QueryMyTemplatesArgs = {
  paginationOptions?: InputMaybe<PaginationOptions>;
  term?: InputMaybe<Scalars['String']['input']>;
};


export type QueryPlanArgs = {
  planId: Scalars['Int']['input'];
};


export type QueryPlanByAlternateIdentifierArgs = {
  alternateIdentifier: Scalars['String']['input'];
};


export type QueryPlanByDmpIdArgs = {
  dmpId: Scalars['String']['input'];
};


export type QueryPlanFeedbackArgs = {
  planId: Scalars['Int']['input'];
};


export type QueryPlanFeedbackCommentsArgs = {
  planFeedbackId: Scalars['Int']['input'];
  planId: Scalars['Int']['input'];
};


export type QueryPlanFeedbackStatusArgs = {
  planId: Scalars['Int']['input'];
};


export type QueryPlanFundingsArgs = {
  planId: Scalars['Int']['input'];
};


export type QueryPlanMembersArgs = {
  planId: Scalars['Int']['input'];
};


export type QueryPlansArgs = {
  projectId: Scalars['Int']['input'];
};


export type QueryProjectArgs = {
  projectId: Scalars['Int']['input'];
};


export type QueryProjectCollaboratorsArgs = {
  projectId: Scalars['Int']['input'];
};


export type QueryProjectFundingArgs = {
  projectFundingId: Scalars['Int']['input'];
};


export type QueryProjectFundingsArgs = {
  projectId: Scalars['Int']['input'];
};


export type QueryProjectMemberArgs = {
  projectMemberId: Scalars['Int']['input'];
};


export type QueryProjectMembersArgs = {
  projectId: Scalars['Int']['input'];
};


export type QueryPublishedConditionsForQuestionArgs = {
  versionedQuestionId: Scalars['Int']['input'];
};


export type QueryPublishedCustomQuestionArgs = {
  versionedCustomQuestionId: Scalars['Int']['input'];
};


export type QueryPublishedCustomQuestionsArgs = {
  planId: Scalars['Int']['input'];
  versionedCustomSectionId: Scalars['Int']['input'];
};


export type QueryPublishedCustomSectionArgs = {
  customSectionId: Scalars['Int']['input'];
  planId: Scalars['Int']['input'];
};


export type QueryPublishedQuestionArgs = {
  versionedQuestionId: Scalars['Int']['input'];
};


export type QueryPublishedQuestionsArgs = {
  planId: Scalars['Int']['input'];
  versionedSectionId: Scalars['Int']['input'];
};


export type QueryPublishedSectionArgs = {
  versionedSectionId: Scalars['Int']['input'];
};


export type QueryPublishedSectionsArgs = {
  paginationOptions?: InputMaybe<PaginationOptions>;
  term: Scalars['String']['input'];
};


export type QueryPublishedTemplatesArgs = {
  paginationOptions?: InputMaybe<PaginationOptions>;
  term?: InputMaybe<Scalars['String']['input']>;
};


export type QueryPublishedTemplatesMetaDataArgs = {
  paginationOptions?: InputMaybe<PaginationOptions>;
  term?: InputMaybe<Scalars['String']['input']>;
};


export type QueryQuestionArgs = {
  questionId: Scalars['Int']['input'];
};


export type QueryQuestionConditionsArgs = {
  questionId: Scalars['Int']['input'];
};


export type QueryQuestionCustomizationArgs = {
  questionCustomizationId: Scalars['Int']['input'];
};


export type QueryQuestionCustomizationByVersionedQuestionArgs = {
  templateCustomizationId: Scalars['Int']['input'];
  versionedQuestionId: Scalars['Int']['input'];
};


export type QueryQuestionsArgs = {
  sectionId: Scalars['Int']['input'];
};


export type QueryRe3RepositoryTypesListArgs = {
  input?: InputMaybe<Re3RepositoryTypesListInput>;
};


export type QueryRe3SubjectListArgs = {
  input?: InputMaybe<Re3SubjectListInput>;
};


export type QueryRe3byUrIsArgs = {
  uris: Array<Scalars['String']['input']>;
};


export type QueryRecommendedLicensesArgs = {
  recommended: Scalars['Boolean']['input'];
};


export type QueryRelatedWorksArgs = {
  filterOptions?: InputMaybe<RelatedWorksFilterOptions>;
  id: Scalars['Int']['input'];
  idType: RelatedWorksIdentifierType;
  paginationOptions?: InputMaybe<PaginationOptions>;
};


export type QueryRelatedWorksByPlanStatsArgs = {
  planId: Scalars['Int']['input'];
};


export type QueryRelatedWorksByProjectStatsArgs = {
  projectId: Scalars['Int']['input'];
};


export type QueryRepositoriesArgs = {
  input: RepositorySearchInput;
};


export type QueryRepositoriesByUrIsArgs = {
  uris: Array<Scalars['String']['input']>;
};


export type QueryRepositoryArgs = {
  uri: Scalars['String']['input'];
};


export type QueryResearchOutputTypeArgs = {
  id: Scalars['Int']['input'];
};


export type QueryResearchOutputTypeByNameArgs = {
  name: Scalars['String']['input'];
};


export type QuerySearchExternalProjectsArgs = {
  input: ExternalSearchInput;
};


export type QuerySectionArgs = {
  sectionId: Scalars['Int']['input'];
};


export type QuerySectionCustomizationArgs = {
  sectionCustomizationId: Scalars['Int']['input'];
};


export type QuerySectionCustomizationByVersionedSectionArgs = {
  templateCustomizationId: Scalars['Int']['input'];
  versionedSectionId: Scalars['Int']['input'];
};


export type QuerySectionVersionsArgs = {
  sectionId: Scalars['Int']['input'];
};


export type QuerySectionsArgs = {
  templateId: Scalars['Int']['input'];
};


export type QueryTagsBySectionIdArgs = {
  sectionId: Scalars['Int']['input'];
};


export type QueryTemplateArgs = {
  templateId: Scalars['Int']['input'];
};


export type QueryTemplateCollaboratorsArgs = {
  templateId: Scalars['Int']['input'];
};


export type QueryTemplateCustomizationOverviewArgs = {
  templateCustomizationId: Scalars['Int']['input'];
};


export type QueryTemplateVersionsArgs = {
  templateId: Scalars['Int']['input'];
};


export type QueryUserArgs = {
  userId: Scalars['Int']['input'];
};


export type QueryUsersArgs = {
  paginationOptions?: InputMaybe<PaginationOptions>;
  term?: InputMaybe<Scalars['String']['input']>;
};


export type QueryVersionedGuidanceArgs = {
  affiliationId: Scalars['String']['input'];
  tagIds: Array<Scalars['Int']['input']>;
};

/** Question always belongs to a Section, which always belongs to a Template */
export type Question = {
  __typename?: 'Question';
  /** The timestamp when the Object was created */
  created?: Maybe<Scalars['String']['output']>;
  /** The user who created the Object */
  createdById?: Maybe<Scalars['Int']['output']>;
  /** The display order of the question */
  displayOrder?: Maybe<Scalars['Int']['output']>;
  /** Errors associated with the Object */
  errors?: Maybe<QuestionErrors>;
  /** Guidance to complete the question */
  guidanceText?: Maybe<Scalars['String']['output']>;
  /** The unique identifer for the Object */
  id?: Maybe<Scalars['Int']['output']>;
  /** Whether or not the Question has had any changes since the related template was last published */
  isDirty?: Maybe<Scalars['Boolean']['output']>;
  /** The JSON representation of the question type */
  json?: Maybe<Scalars['String']['output']>;
  /** The timestamp when the Object was last modifed */
  modified?: Maybe<Scalars['String']['output']>;
  /** The user who last modified the Object */
  modifiedById?: Maybe<Scalars['Int']['output']>;
  /** The conditional logic triggered by this question */
  questionConditions?: Maybe<Array<QuestionCondition>>;
  /** This will be used as a sort of title for the Question */
  questionText?: Maybe<Scalars['String']['output']>;
  /** To indicate whether the question is required to be completed */
  required?: Maybe<Scalars['Boolean']['output']>;
  /** Requirements associated with the Question */
  requirementText?: Maybe<Scalars['String']['output']>;
  /** Sample text to possibly provide a starting point or example to answer question */
  sampleText?: Maybe<Scalars['String']['output']>;
  /** The unique id of the Section that the question belongs to */
  sectionId: Scalars['Int']['output'];
  /** The original question id if this question is a copy of another */
  sourceQestionId?: Maybe<Scalars['Int']['output']>;
  /** The unique id of the Template that the question belongs to */
  templateId: Scalars['Int']['output'];
  /** Boolean indicating whether we should use content from sampleText as the default answer */
  useSampleTextAsDefault?: Maybe<Scalars['Boolean']['output']>;
};

/**
 * if [Question content] [condition] [conditionMatch] then [action] on [target] so
 * for example if 'Yes' EQUAL 'Yes' then 'SHOW_Question' 123
 */
export type QuestionCondition = {
  __typename?: 'QuestionCondition';
  /** The action to take on a QuestionCondition */
  action: QuestionConditionActionType;
  /** Relative to the condition type, it is the value to match on (e.g., HAS_ANSWER should equate to null here) */
  conditionMatch?: Maybe<Scalars['String']['output']>;
  /** The type of condition in which to take the action */
  conditionType: QuestionConditionCondition;
  /** The timestamp when the Object was created */
  created?: Maybe<Scalars['String']['output']>;
  /** The user who created the Object */
  createdById?: Maybe<Scalars['Int']['output']>;
  /** Errors associated with the Object */
  errors?: Maybe<QuestionConditionErrors>;
  /** The unique identifer for the Object */
  id?: Maybe<Scalars['Int']['output']>;
  /** The timestamp when the Object was last modifed */
  modified?: Maybe<Scalars['String']['output']>;
  /** The user who last modified the Object */
  modifiedById?: Maybe<Scalars['Int']['output']>;
  /** The question id that the QuestionCondition belongs to */
  questionId: Scalars['Int']['output'];
  /** The target of the action (e.g., an email address for SEND_EMAIL and a Question id otherwise) */
  target: Scalars['String']['output'];
};

/** QuestionCondition action */
export enum QuestionConditionActionType {
  /** Hide the question */
  HideQuestion = 'HIDE_QUESTION',
  /** Send email */
  SendEmail = 'SEND_EMAIL',
  /** Show the question */
  ShowQuestion = 'SHOW_QUESTION'
}

/** QuestionCondition types */
export enum QuestionConditionCondition {
  /** When a question does not equal a specific value */
  DoesNotEqual = 'DOES_NOT_EQUAL',
  /** When a question equals a specific value */
  Equal = 'EQUAL',
  /** When a question has an answer */
  HasAnswer = 'HAS_ANSWER',
  /** When a question includes a specific value */
  Includes = 'INCLUDES'
}

/** A collection of errors related to the QuestionCondition */
export type QuestionConditionErrors = {
  __typename?: 'QuestionConditionErrors';
  action?: Maybe<Scalars['String']['output']>;
  conditionMatch?: Maybe<Scalars['String']['output']>;
  conditionType?: Maybe<Scalars['String']['output']>;
  /** General error messages such as the object already exists */
  general?: Maybe<Scalars['String']['output']>;
  questionId?: Maybe<Scalars['String']['output']>;
  target?: Maybe<Scalars['String']['output']>;
};

/** Customization of a funder question */
export type QuestionCustomization = {
  __typename?: 'QuestionCustomization';
  /** The timestamp when the Object was created */
  created?: Maybe<Scalars['String']['output']>;
  /** The user who created the Object */
  createdById?: Maybe<Scalars['Int']['output']>;
  /** Errors associated with the Object */
  errors?: Maybe<QuestionCustomizationErrors>;
  /** Guidance specific to the customizing affiliation's users */
  guidanceText?: Maybe<Scalars['String']['output']>;
  /** The unique identifier for the Object */
  id?: Maybe<Scalars['Int']['output']>;
  /** The current status of the customization with regard to the base funder template */
  migrationStatus?: Maybe<TemplateCustomizationMigrationStatus>;
  /** The timestamp when the Object was last modifed */
  modified?: Maybe<Scalars['String']['output']>;
  /** The user who last modified the Object */
  modifiedById?: Maybe<Scalars['Int']['output']>;
  /** The funder question this customization applies to */
  questionId: Scalars['Int']['output'];
  /** A sample answer specific to the customizing affiliation's users */
  sampleText?: Maybe<Scalars['String']['output']>;
  /** The identifier of the parent template customization */
  templateCustomizationId: Scalars['Int']['output'];
  /** The version of the funder question this customization applies to */
  versionedQuestion?: Maybe<VersionedQuestion>;
};

/** Errors related to the SectionCustomization */
export type QuestionCustomizationErrors = {
  __typename?: 'QuestionCustomizationErrors';
  /** General error messages such as the object already exists */
  general?: Maybe<Scalars['String']['output']>;
  guidanceText?: Maybe<Scalars['String']['output']>;
  migrationStatus?: Maybe<Scalars['String']['output']>;
  questionId?: Maybe<Scalars['String']['output']>;
  sampleText?: Maybe<Scalars['String']['output']>;
  templateCustomizationId?: Maybe<Scalars['String']['output']>;
};

/** An overview of a Question Customization */
export type QuestionCustomizationOverview = {
  __typename?: 'QuestionCustomizationOverview';
  /** The position of the question within the section */
  displayOrder: Scalars['Int']['output'];
  /** Whether the question has custom guidance (only applicable to base funder questions) */
  hasCustomGuidance?: Maybe<Scalars['Boolean']['output']>;
  /** Whether the question has a custom sample answer (only applicable to base funder questions) */
  hasCustomSampleAnswer?: Maybe<Scalars['Boolean']['output']>;
  /** The unique identifier for the Question (either a CustomQuestion or VersionedQuestion for funder) */
  id: Scalars['Int']['output'];
  /** The status of the customization with regard to the base template (if applicable) */
  migrationStatus?: Maybe<TemplateCustomizationMigrationStatus>;
  /** The id of the question customization (customized guidance and sample text for the funder question) */
  questionCustomizationId?: Maybe<Scalars['Int']['output']>;
  /** The question text */
  questionText: Scalars['String']['output'];
  /** Whether the question belongs to a base funder template or to the customizing affiliation */
  questionType: CustomizableObjectOwnership;
};

/** A collection of errors related to the Question */
export type QuestionErrors = {
  __typename?: 'QuestionErrors';
  displayOrder?: Maybe<Scalars['String']['output']>;
  /** General error messages such as the object already exists */
  general?: Maybe<Scalars['String']['output']>;
  guidanceText?: Maybe<Scalars['String']['output']>;
  json?: Maybe<Scalars['String']['output']>;
  questionConditionIds?: Maybe<Scalars['String']['output']>;
  questionText?: Maybe<Scalars['String']['output']>;
  requirementText?: Maybe<Scalars['String']['output']>;
  sampleText?: Maybe<Scalars['String']['output']>;
  sectionId?: Maybe<Scalars['String']['output']>;
  sourceQestionId?: Maybe<Scalars['String']['output']>;
  templateId?: Maybe<Scalars['String']['output']>;
};

/** A preset repository from re3data (external source) */
export type Re3DataRepository = {
  __typename?: 'Re3DataRepository';
  /** Access restrictions */
  access?: Maybe<Scalars['String']['output']>;
  /** Certifications held */
  certificates?: Maybe<Array<Scalars['String']['output']>>;
  /** Contact information */
  contact?: Maybe<Scalars['String']['output']>;
  /** When the repository record was created */
  created?: Maybe<Scalars['String']['output']>;
  /** A description of the repository */
  description?: Maybe<Scalars['String']['output']>;
  /** The unique identifier from re3data */
  id: Scalars['String']['output'];
  /** Keywords to assist in finding the repository */
  keywords?: Maybe<Array<Scalars['String']['output']>>;
  /** When the repository record was last updated */
  modified?: Maybe<Scalars['String']['output']>;
  /** The name of the repository */
  name: Scalars['String']['output'];
  /** Persistent identifier systems supported */
  pidSystem?: Maybe<Array<Scalars['String']['output']>>;
  /** Data policies */
  policies?: Maybe<Array<Scalars['String']['output']>>;
  /** Provider types */
  providerTypes?: Maybe<Array<Scalars['String']['output']>>;
  /** The Categories/Types of the repository */
  repositoryTypes?: Maybe<Array<Scalars['String']['output']>>;
  /** Software used */
  software?: Maybe<Array<Scalars['String']['output']>>;
  /** The source of this repository */
  source: RepositorySource;
  /** Subject areas covered by the repository */
  subjects?: Maybe<Array<Scalars['String']['output']>>;
  /** Upload types supported */
  uploadTypes?: Maybe<Array<Scalars['String']['output']>>;
  /** The taxonomy URL of the repository */
  uri?: Maybe<Scalars['String']['output']>;
  /** The website URL */
  website?: Maybe<Scalars['String']['output']>;
};

/** A repository type from re3data with optional count */
export type Re3RepositoryType = {
  __typename?: 'Re3RepositoryType';
  /** The count of repositories with this type (if requested) */
  count?: Maybe<Scalars['Int']['output']>;
  /** The repository type string */
  type: Scalars['String']['output'];
};

export type Re3RepositoryTypesListInput = {
  /** Whether to include the count of repositories for each type */
  includeCount?: InputMaybe<Scalars['Boolean']['input']>;
  /** Maximum number of distinct types to return (default: 100) */
  maxResults?: InputMaybe<Scalars['Int']['input']>;
};

/** Results from re3data repository types list query */
export type Re3RepositoryTypesListResults = {
  __typename?: 'Re3RepositoryTypesListResults';
  /** The total number of distinct repository types found */
  totalCount: Scalars['Int']['output'];
  /** The list of distinct repository types from re3data */
  types: Array<Re3RepositoryType>;
};

/** A subject area from re3data with optional count */
export type Re3Subject = {
  __typename?: 'Re3Subject';
  /** The count of repositories with this subject (if requested) */
  count?: Maybe<Scalars['Int']['output']>;
  /** The subject string */
  subject: Scalars['String']['output'];
};

export type Re3SubjectListInput = {
  /** Whether to include the count of repositories for each subject */
  includeCount?: InputMaybe<Scalars['Boolean']['input']>;
  /** Maximum number of distinct subjects to return (default: 100) */
  maxResults?: InputMaybe<Scalars['Int']['input']>;
};

/** Results from re3data subject list query */
export type Re3SubjectListResults = {
  __typename?: 'Re3SubjectListResults';
  /** The list of distinct subjects from re3data */
  subjects: Array<Re3Subject>;
  /** The total number of distinct subjects found */
  totalCount: Scalars['Int']['output'];
};

/** The confidence of the related work match */
export enum RelatedWorkConfidence {
  /** High confidence */
  High = 'HIGH',
  /** Low confidence */
  Low = 'LOW',
  /** Medium confidence */
  Medium = 'MEDIUM'
}

export type RelatedWorkSearchResult = {
  __typename?: 'RelatedWorkSearchResult';
  /** Details which authors matched from the work and the fields they matched on */
  authorMatches?: Maybe<Array<ItemMatch>>;
  /** Details which awards matched from the work and the fields they matched on */
  awardMatches?: Maybe<Array<ItemMatch>>;
  /** The confidence of the related work match */
  confidence?: Maybe<RelatedWorkConfidence>;
  /** Details how relevant the title and abstract of the work were to the plan */
  contentMatch?: Maybe<ContentMatch>;
  /** The timestamp when the Object was created */
  created?: Maybe<Scalars['String']['output']>;
  /** The user who created the Object. Null if the related work was automatically found */
  createdById?: Maybe<Scalars['Int']['output']>;
  /** Details whether the work's DOI was found on a funder award page */
  doiMatch?: Maybe<DoiMatch>;
  /** Details which funders matched from the work and the fields they matched on */
  funderMatches?: Maybe<Array<ItemMatch>>;
  /** The unique identifier for the Object */
  id?: Maybe<Scalars['Int']['output']>;
  /** Details which institutions matched from the work and the fields they matched on */
  institutionMatches?: Maybe<Array<ItemMatch>>;
  /** The timestamp when the Object was last modified */
  modified?: Maybe<Scalars['String']['output']>;
  /** The user who last modified the Object */
  modifiedById?: Maybe<Scalars['Int']['output']>;
  /** The unique identifier of the plan that this related work has been matched to */
  planId?: Maybe<Scalars['Int']['output']>;
  /** The title of the plan that this related work has been matched to */
  planTitle?: Maybe<Scalars['String']['output']>;
  /** The unique identifier of the project that this related work has been matched to */
  projectId?: Maybe<Scalars['Int']['output']>;
  /** The confidence score indicating how well the work matches the plan */
  score?: Maybe<Scalars['Float']['output']>;
  /** The maximum confidence score returned when this work was matched to the plan */
  scoreMax?: Maybe<Scalars['Float']['output']>;
  /** The normalised confidence score from 0.0-1.0 */
  scoreNorm?: Maybe<Scalars['Float']['output']>;
  /** Whether the related work was automatically or manually added */
  sourceType?: Maybe<RelatedWorkSourceType>;
  /** The status of the related work */
  status: RelatedWorkStatus;
  /** The version of the work that the plan was matched to */
  workVersion: WorkVersion;
};

export type RelatedWorkSearchResults = PaginatedQueryResults & {
  __typename?: 'RelatedWorkSearchResults';
  /** The sortFields that are available for this query (for standard offset pagination only!) */
  availableSortFields?: Maybe<Array<Maybe<Scalars['String']['output']>>>;
  /** Count of confidence values returned in the query */
  confidenceCounts?: Maybe<Array<TypeCount>>;
  /** The current offset of the results (for standard offset pagination) */
  currentOffset?: Maybe<Scalars['Int']['output']>;
  /** Whether or not there is a next page */
  hasNextPage?: Maybe<Scalars['Boolean']['output']>;
  /** Whether or not there is a previous page */
  hasPreviousPage?: Maybe<Scalars['Boolean']['output']>;
  /** The TemplateSearchResults that match the search criteria */
  items?: Maybe<Array<Maybe<RelatedWorkSearchResult>>>;
  /** The number of items returned */
  limit?: Maybe<Scalars['Int']['output']>;
  /** The cursor to use for the next page of results (for infinite scroll/load more) */
  nextCursor?: Maybe<Scalars['String']['output']>;
  /** The count of the number of related works after the status filter is applied but doesn't include any other filters */
  statusOnlyCount?: Maybe<Scalars['Int']['output']>;
  /** The total number of possible items */
  totalCount?: Maybe<Scalars['Int']['output']>;
  /** Counts of work types returned in the query */
  workTypeCounts?: Maybe<Array<TypeCount>>;
};

/** The origin of the related work entry */
export enum RelatedWorkSourceType {
  SystemMatched = 'SYSTEM_MATCHED',
  UserAdded = 'USER_ADDED'
}

export type RelatedWorkStatsResults = {
  __typename?: 'RelatedWorkStatsResults';
  /** Count of accepted related works */
  acceptedCount?: Maybe<Scalars['Int']['output']>;
  /** Whether the plan is published (if request was for a plan) or whether any plan is published (if request was for a project) */
  hasPublishedPlan?: Maybe<Scalars['Boolean']['output']>;
  /** Count of pending related works */
  pendingCount?: Maybe<Scalars['Int']['output']>;
  /** Count of rejected related works */
  rejectedCount?: Maybe<Scalars['Int']['output']>;
  /** The total number of related works */
  totalCount?: Maybe<Scalars['Int']['output']>;
};

/** The status of the related work */
export enum RelatedWorkStatus {
  /** The related work has been marked as related to a plan by a user */
  Accepted = 'ACCEPTED',
  /** The related work is pending assessment by a user */
  Pending = 'PENDING',
  /** The related work has been marked as not related to a plan by a user */
  Rejected = 'REJECTED'
}

/** Related work search filter options */
export type RelatedWorksFilterOptions = {
  /** The confidence of the match */
  confidence?: InputMaybe<RelatedWorkConfidence>;
  /** Filter by Plan ID */
  planId?: InputMaybe<Scalars['Int']['input']>;
  /** Filter results by the related work status */
  status?: InputMaybe<RelatedWorkStatus>;
  /** The type of work to filter by */
  workType?: InputMaybe<WorkType>;
};

/** Identifier type for calling related works endpoints */
export enum RelatedWorksIdentifierType {
  PlanId = 'PLAN_ID',
  ProjectId = 'PROJECT_ID'
}

/** The results of reordering the questions */
export type ReorderQuestionsResult = {
  __typename?: 'ReorderQuestionsResult';
  /** Error messages */
  errors?: Maybe<QuestionErrors>;
  /** The reordered sections */
  questions?: Maybe<Array<Question>>;
};

/** The results of reordering the sections */
export type ReorderSectionsResult = {
  __typename?: 'ReorderSectionsResult';
  /** Error messages */
  errors?: Maybe<SectionErrors>;
  /** The reordered sections */
  sections?: Maybe<Array<Section>>;
};

/** Union type for repository search results (can be custom or re3data) */
export type Repository = CustomRepository | Re3DataRepository;

/** A collection of errors related to the Repository */
export type RepositoryErrors = {
  __typename?: 'RepositoryErrors';
  description?: Maybe<Scalars['String']['output']>;
  /** General error messages such as the object already exists */
  general?: Maybe<Scalars['String']['output']>;
  keywords?: Maybe<Scalars['String']['output']>;
  name?: Maybe<Scalars['String']['output']>;
  re3dataId?: Maybe<Scalars['String']['output']>;
  repositoryTypes?: Maybe<Scalars['String']['output']>;
  researchDomainIds?: Maybe<Scalars['String']['output']>;
  uri?: Maybe<Scalars['String']['output']>;
  website?: Maybe<Scalars['String']['output']>;
};

export type RepositorySearchInput = {
  /** The keyword to filter custom repositories by */
  keyword?: InputMaybe<Scalars['String']['input']>;
  /** The pagination options */
  paginationOptions?: InputMaybe<PaginationOptions>;
  /** The repository category/type (for custom and re3data repositories). Accepts values: disciplinary, institutional, other, multidisciplinary, project-related, governmental */
  repositoryType?: InputMaybe<Scalars['String']['input']>;
  /** The subject areas from re3data (for re3data repositories). Repositories matching ANY of the provided subjects will be returned. Custom repositories have no subject matching. */
  subjects?: InputMaybe<Array<Scalars['String']['input']>>;
  /** The search term */
  term?: InputMaybe<Scalars['String']['input']>;
};

export type RepositorySearchResults = PaginatedQueryResults & {
  __typename?: 'RepositorySearchResults';
  /** The sortFields that are available for this query (for standard offset pagination only!) */
  availableSortFields?: Maybe<Array<Maybe<Scalars['String']['output']>>>;
  /** The current offset of the results (for standard offset pagination) */
  currentOffset?: Maybe<Scalars['Int']['output']>;
  /** Whether or not there is a next page */
  hasNextPage?: Maybe<Scalars['Boolean']['output']>;
  /** Whether or not there is a previous page */
  hasPreviousPage?: Maybe<Scalars['Boolean']['output']>;
  /** The Repository search results that match the search criteria */
  items?: Maybe<Array<Maybe<Repository>>>;
  /** The number of items returned */
  limit?: Maybe<Scalars['Int']['output']>;
  /** The cursor to use for the next page of results (for infinite scroll/load more) */
  nextCursor?: Maybe<Scalars['String']['output']>;
  /** The total number of possible items */
  totalCount?: Maybe<Scalars['Int']['output']>;
};

export enum RepositorySource {
  /** A custom repository managed in this system */
  Custom = 'CUSTOM',
  /** A preset repository from re3data */
  Re3Data = 'RE3DATA'
}

/** An aread of research (e.g. Electrical Engineering, Cellular biology, etc.) */
export type ResearchDomain = {
  __typename?: 'ResearchDomain';
  /** The child research domains (if applicable) */
  childResearchDomains?: Maybe<Array<ResearchDomain>>;
  /** The timestamp when the Object was created */
  created?: Maybe<Scalars['String']['output']>;
  /** The user who created the Object */
  createdById?: Maybe<Scalars['Int']['output']>;
  /** A description of the type of research covered by the domain */
  description?: Maybe<Scalars['String']['output']>;
  /** Errors associated with the Object */
  errors?: Maybe<ResearchDomainErrors>;
  /** The unique identifer for the Object */
  id?: Maybe<Scalars['Int']['output']>;
  /** The timestamp when the Object was last modifed */
  modified?: Maybe<Scalars['String']['output']>;
  /** The user who last modified the Object */
  modifiedById?: Maybe<Scalars['Int']['output']>;
  /** The name of the domain */
  name: Scalars['String']['output'];
  /** The parent research domain (if applicable). If this is blank then it is a top level domain. */
  parentResearchDomain?: Maybe<ResearchDomain>;
  /** The ID of the parent research domain (if applicable) */
  parentResearchDomainId?: Maybe<Scalars['Int']['output']>;
  /** The taxonomy URL of the research domain */
  uri: Scalars['String']['output'];
};

/** A collection of errors related to the ResearchDomain */
export type ResearchDomainErrors = {
  __typename?: 'ResearchDomainErrors';
  childResearchDomainIds?: Maybe<Scalars['String']['output']>;
  description?: Maybe<Scalars['String']['output']>;
  /** General error messages such as the object already exists */
  general?: Maybe<Scalars['String']['output']>;
  name?: Maybe<Scalars['String']['output']>;
  parentResearchDomainId?: Maybe<Scalars['String']['output']>;
  uri?: Maybe<Scalars['String']['output']>;
};

export type ResearchDomainSearchResults = PaginatedQueryResults & {
  __typename?: 'ResearchDomainSearchResults';
  /** The sortFields that are available for this query (for standard offset pagination only!) */
  availableSortFields?: Maybe<Array<Maybe<Scalars['String']['output']>>>;
  /** The current offset of the results (for standard offset pagination) */
  currentOffset?: Maybe<Scalars['Int']['output']>;
  /** Whether or not there is a next page */
  hasNextPage?: Maybe<Scalars['Boolean']['output']>;
  /** Whether or not there is a previous page */
  hasPreviousPage?: Maybe<Scalars['Boolean']['output']>;
  /** The TemplateSearchResults that match the search criteria */
  items?: Maybe<Array<Maybe<ResearchDomain>>>;
  /** The number of items returned */
  limit?: Maybe<Scalars['Int']['output']>;
  /** The cursor to use for the next page of results (for infinite scroll/load more) */
  nextCursor?: Maybe<Scalars['String']['output']>;
  /** The total number of possible items */
  totalCount?: Maybe<Scalars['Int']['output']>;
};

export type ResearchOutputType = {
  __typename?: 'ResearchOutputType';
  /** The timestamp when the Object was created */
  created?: Maybe<Scalars['String']['output']>;
  /** The user who created the Object */
  createdById?: Maybe<Scalars['Int']['output']>;
  /** A longer description of the research output type useful for tooltips */
  description?: Maybe<Scalars['String']['output']>;
  /** Errors associated with the Object */
  errors?: Maybe<ResearchOutputTypeErrors>;
  /** The unique identifer for the Object */
  id?: Maybe<Scalars['Int']['output']>;
  /** The timestamp when the Object was last modifed */
  modified?: Maybe<Scalars['String']['output']>;
  /** The user who last modified the Object */
  modifiedById?: Maybe<Scalars['Int']['output']>;
  /** The name/label of the research output type */
  name: Scalars['String']['output'];
  /** The value/slug of the research output type */
  value: Scalars['String']['output'];
};

/** A collection of errors related to the research output type */
export type ResearchOutputTypeErrors = {
  __typename?: 'ResearchOutputTypeErrors';
  /** General error messages such as the object already exists */
  general?: Maybe<Scalars['String']['output']>;
  name?: Maybe<Scalars['String']['output']>;
  value?: Maybe<Scalars['String']['output']>;
};

/** A Section that contains a list of questions in a template */
export type Section = {
  __typename?: 'Section';
  /** Whether or not this Section is designated as a 'Best Practice' section */
  bestPractice?: Maybe<Scalars['Boolean']['output']>;
  /** The timestamp when the Object was created */
  created?: Maybe<Scalars['String']['output']>;
  /** The user who created the Object */
  createdById?: Maybe<Scalars['Int']['output']>;
  /** The order in which the section will be displayed in the template */
  displayOrder?: Maybe<Scalars['Int']['output']>;
  /** Errors associated with the Object */
  errors?: Maybe<SectionErrors>;
  /** The guidance to help user with section */
  guidance?: Maybe<Scalars['String']['output']>;
  /** The unique identifer for the Object */
  id?: Maybe<Scalars['Int']['output']>;
  /** The section introduction */
  introduction?: Maybe<Scalars['String']['output']>;
  /** Indicates whether or not the section has changed since the template was last published */
  isDirty: Scalars['Boolean']['output'];
  /** The timestamp when the Object was last modifed */
  modified?: Maybe<Scalars['String']['output']>;
  /** The user who last modified the Object */
  modifiedById?: Maybe<Scalars['Int']['output']>;
  /** The section title */
  name: Scalars['String']['output'];
  /** The questions associated with this section */
  questions?: Maybe<Array<Question>>;
  /** Requirements that a user must consider in this section */
  requirements?: Maybe<Scalars['String']['output']>;
  /** The Tags associated with this section. A section might not have any tags */
  tags?: Maybe<Array<Maybe<Tag>>>;
  /** The template that the section is associated with */
  template?: Maybe<Template>;
};

/** Customization of a funder section */
export type SectionCustomization = {
  __typename?: 'SectionCustomization';
  /** The timestamp when the Object was created */
  created?: Maybe<Scalars['String']['output']>;
  /** The user who created the Object */
  createdById?: Maybe<Scalars['Int']['output']>;
  /** Errors associated with the Object */
  errors?: Maybe<SectionCustomizationErrors>;
  /** Guidance specific to the customizing affiliation's users */
  guidance?: Maybe<Scalars['String']['output']>;
  /** The unique identifier for the Object */
  id?: Maybe<Scalars['Int']['output']>;
  /** The current status of the customization with regard to the base funder template */
  migrationStatus?: Maybe<TemplateCustomizationMigrationStatus>;
  /** The timestamp when the Object was last modifed */
  modified?: Maybe<Scalars['String']['output']>;
  /** The user who last modified the Object */
  modifiedById?: Maybe<Scalars['Int']['output']>;
  /** The identifier of the published funder section */
  sectionId: Scalars['Int']['output'];
  /** The identifier of the parent template customization */
  templateCustomizationId: Scalars['Int']['output'];
  /** The versioned section that this customization applies to */
  versionedSection?: Maybe<VersionedSection>;
};

/** Errors related to the SectionCustomization */
export type SectionCustomizationErrors = {
  __typename?: 'SectionCustomizationErrors';
  /** General error messages such as the object already exists */
  general?: Maybe<Scalars['String']['output']>;
  guidance?: Maybe<Scalars['String']['output']>;
  migrationStatus?: Maybe<Scalars['String']['output']>;
  sectionId?: Maybe<Scalars['String']['output']>;
  templateCustomizationId?: Maybe<Scalars['String']['output']>;
};

/** An overview of a Section Customization */
export type SectionCustomizationOverview = {
  __typename?: 'SectionCustomizationOverview';
  /** The order of the section within the template */
  displayOrder: Scalars['Int']['output'];
  /** Whether the question has custom guidance (only applicable to base funder questions) */
  hasCustomGuidance?: Maybe<Scalars['Boolean']['output']>;
  /** The unique identifier for the Section (either a CustomSection or VersionedSection for funder) */
  id: Scalars['Int']['output'];
  /** The status of the customization with regard to the base template (if applicable) */
  migrationStatus?: Maybe<TemplateCustomizationMigrationStatus>;
  /** The section title */
  name: Scalars['String']['output'];
  /** The questions associated with this section */
  questions?: Maybe<Array<QuestionCustomizationOverview>>;
  /** The id of the section customization (customized guidance for the funder section) */
  sectionCustomizationId?: Maybe<Scalars['Int']['output']>;
  /** Whether the section belongs to a base funder template or to the customizing affiliation */
  sectionType: CustomizableObjectOwnership;
};

/** A collection of errors related to the Section */
export type SectionErrors = {
  __typename?: 'SectionErrors';
  displayOrder?: Maybe<Scalars['String']['output']>;
  /** General error messages such as the object already exists */
  general?: Maybe<Scalars['String']['output']>;
  guidance?: Maybe<Scalars['String']['output']>;
  introduction?: Maybe<Scalars['String']['output']>;
  name?: Maybe<Scalars['String']['output']>;
  questionIds?: Maybe<Scalars['String']['output']>;
  requirements?: Maybe<Scalars['String']['output']>;
  tags?: Maybe<Scalars['String']['output']>;
  templateId?: Maybe<Scalars['String']['output']>;
};

/** Section version type */
export enum SectionVersionType {
  /** Draft - saved state for internal review */
  Draft = 'DRAFT',
  /** Published - saved state for use when creating DMPs */
  Published = 'PUBLISHED'
}

/** A Tag is a way to group similar types of categories together */
export type Tag = {
  __typename?: 'Tag';
  /** The timestamp when the Object was created */
  created?: Maybe<Scalars['String']['output']>;
  /** The user who created the Object */
  createdById?: Maybe<Scalars['Int']['output']>;
  /** The tag description */
  description?: Maybe<Scalars['String']['output']>;
  /** Errors associated with the Object */
  errors?: Maybe<TagErrors>;
  /** The unique identifer for the Object */
  id?: Maybe<Scalars['Int']['output']>;
  /** The timestamp when the Object was last modifed */
  modified?: Maybe<Scalars['String']['output']>;
  /** The user who last modified the Object */
  modifiedById?: Maybe<Scalars['Int']['output']>;
  /** The tag name */
  name: Scalars['String']['output'];
  /** The slug */
  slug: Scalars['String']['output'];
};

/** A collection of errors related to the Tag */
export type TagErrors = {
  __typename?: 'TagErrors';
  description?: Maybe<Scalars['String']['output']>;
  /** General error messages such as the object already exists */
  general?: Maybe<Scalars['String']['output']>;
  name?: Maybe<Scalars['String']['output']>;
};

/** Input for Tag operations */
export type TagInput = {
  /** The description of the Tag */
  description?: InputMaybe<Scalars['String']['input']>;
  /** The unique identifier for the Tag */
  id?: InputMaybe<Scalars['Int']['input']>;
  /** The name of the Tag */
  name?: InputMaybe<Scalars['String']['input']>;
  /** The slug of the Tag */
  slug?: InputMaybe<Scalars['String']['input']>;
};

/** A Template used to create DMPs */
export type Template = {
  __typename?: 'Template';
  /** Admin users associated with the template's owner */
  admins?: Maybe<Array<User>>;
  /** Whether or not this Template is designated as a 'Best Practice' template */
  bestPractice: Scalars['Boolean']['output'];
  /** Users from different affiliations who have been invited to collaborate on this template */
  collaborators?: Maybe<Array<TemplateCollaborator>>;
  /** The timestamp when the Object was created */
  created?: Maybe<Scalars['String']['output']>;
  /** The user who created the Object */
  createdById?: Maybe<Scalars['Int']['output']>;
  /** A description of the purpose of the template */
  description?: Maybe<Scalars['String']['output']>;
  /** Errors associated with the Object */
  errors?: Maybe<TemplateErrors>;
  /** The unique identifer for the Object */
  id?: Maybe<Scalars['Int']['output']>;
  /** Whether or not this is the default template */
  isDefault?: Maybe<Scalars['Boolean']['output']>;
  /** Whether or not the Template has had any changes since it was last published */
  isDirty: Scalars['Boolean']['output'];
  /** The template's language */
  languageId: Scalars['String']['output'];
  /** The last published date */
  latestPublishDate?: Maybe<Scalars['String']['output']>;
  /** The last published version */
  latestPublishVersion?: Maybe<Scalars['String']['output']>;
  /** Visibility set for the last published template */
  latestPublishVisibility?: Maybe<TemplateVisibility>;
  /** The timestamp when the Object was last modifed */
  modified?: Maybe<Scalars['String']['output']>;
  /** The user who last modified the Object */
  modifiedById?: Maybe<Scalars['Int']['output']>;
  /** The name/title of the template */
  name: Scalars['String']['output'];
  /** The affiliation that the template belongs to */
  owner?: Maybe<Affiliation>;
  /** The Sections associated with the template */
  sections?: Maybe<Array<Maybe<Section>>>;
  /** The template that this one was derived from */
  sourceTemplateId?: Maybe<Scalars['Int']['output']>;
  /** The versioned template that this one was derived from */
  sourceVersionedTemplateId?: Maybe<Scalars['Int']['output']>;
};

/** A user that that belongs to a different affiliation that can edit the Template */
export type TemplateCollaborator = {
  __typename?: 'TemplateCollaborator';
  /** The timestamp when the Object was created */
  created?: Maybe<Scalars['String']['output']>;
  /** The user who created the Object */
  createdById?: Maybe<Scalars['Int']['output']>;
  /** The collaborator's email */
  email: Scalars['String']['output'];
  /** Errors associated with the Object */
  errors?: Maybe<TemplateCollaboratorErrors>;
  /** The unique identifer for the Object */
  id?: Maybe<Scalars['Int']['output']>;
  /** The user who invited the collaborator */
  invitedBy?: Maybe<User>;
  /** The timestamp when the Object was last modifed */
  modified?: Maybe<Scalars['String']['output']>;
  /** The user who last modified the Object */
  modifiedById?: Maybe<Scalars['Int']['output']>;
  /** The template the collaborator may edit */
  template?: Maybe<Template>;
  /** The collaborator (if they have an account) */
  user?: Maybe<User>;
};

/** A collection of errors related to the TemplateCollaborator */
export type TemplateCollaboratorErrors = {
  __typename?: 'TemplateCollaboratorErrors';
  email?: Maybe<Scalars['String']['output']>;
  /** General error messages such as the object already exists */
  general?: Maybe<Scalars['String']['output']>;
  invitedById?: Maybe<Scalars['String']['output']>;
  templateId?: Maybe<Scalars['String']['output']>;
  userId?: Maybe<Scalars['String']['output']>;
};

/** A Customization of a funder template */
export type TemplateCustomization = {
  __typename?: 'TemplateCustomization';
  /** The affiliation that the customization belongs to */
  affiliationId: Scalars['String']['output'];
  /** The timestamp when the Object was created */
  created?: Maybe<Scalars['String']['output']>;
  /** The user who created the Object */
  createdById?: Maybe<Scalars['Int']['output']>;
  /** The current published version of the base funder template */
  currentVersionedTemplateId: Scalars['Int']['output'];
  /** Errors associated with the Object */
  errors?: Maybe<TemplateCustomizationErrors>;
  /** The unique identifier for the Object */
  id?: Maybe<Scalars['Int']['output']>;
  /** Whether the customization has been modified since it was last published */
  isDirty: Scalars['Boolean']['output'];
  /** The date this customization was last published */
  latestPublishedDate?: Maybe<Scalars['String']['output']>;
  /** The status of the customizations with regard to the base template */
  migrationStatus: TemplateCustomizationMigrationStatus;
  /** The timestamp when the Object was last modifed */
  modified?: Maybe<Scalars['String']['output']>;
  /** The user who last modified the Object */
  modifiedById?: Maybe<Scalars['Int']['output']>;
  /** The status of the customization */
  status: TemplateCustomizationStatus;
};

/** A collection of errors related to the Template Customization */
export type TemplateCustomizationErrors = {
  __typename?: 'TemplateCustomizationErrors';
  affiliationId?: Maybe<Scalars['String']['output']>;
  currentVersionedTemplateId?: Maybe<Scalars['String']['output']>;
  /** General error messages such as the object already exists */
  general?: Maybe<Scalars['String']['output']>;
  templateId?: Maybe<Scalars['String']['output']>;
};

/** The status of a Template Customization with regard to the funder template */
export enum TemplateCustomizationMigrationStatus {
  /** The customization is tracking the published version of the funder template */
  Ok = 'OK',
  /** The customization is tracking a funder template that is no longer published */
  Orphaned = 'ORPHANED',
  /** The customization is tracking an unpublished version of the funder template */
  Stale = 'STALE'
}

/** An overview of a Template Customization */
export type TemplateCustomizationOverview = {
  __typename?: 'TemplateCustomizationOverview';
  customizationId: Scalars['Int']['output'];
  customizationIsDirty: Scalars['Boolean']['output'];
  customizationLastCustomized?: Maybe<Scalars['String']['output']>;
  customizationLastCustomizedById?: Maybe<Scalars['Int']['output']>;
  customizationLastCustomizedByName?: Maybe<Scalars['String']['output']>;
  customizationLastPublishedDate?: Maybe<Scalars['String']['output']>;
  customizationMigrationStatus: TemplateCustomizationMigrationStatus;
  customizationStatus: TemplateCustomizationStatus;
  errors?: Maybe<TemplateCustomizationErrors>;
  sections?: Maybe<Array<SectionCustomizationOverview>>;
  versionedTemplateAffiliationId: Scalars['String']['output'];
  versionedTemplateAffiliationName: Scalars['String']['output'];
  versionedTemplateDescription?: Maybe<Scalars['String']['output']>;
  versionedTemplateId: Scalars['Int']['output'];
  versionedTemplateLastModified: Scalars['String']['output'];
  versionedTemplateName: Scalars['String']['output'];
  versionedTemplateVersion: Scalars['String']['output'];
};

/** The status of a Template Customization */
export enum TemplateCustomizationStatus {
  /** The customization has been archived */
  Archived = 'ARCHIVED',
  /** The customization is not currently published */
  Draft = 'DRAFT',
  /** The customization is published and can be used by researchers */
  Published = 'PUBLISHED'
}

/** A collection of errors related to the Template */
export type TemplateErrors = {
  __typename?: 'TemplateErrors';
  collaboratorIds?: Maybe<Scalars['String']['output']>;
  description?: Maybe<Scalars['String']['output']>;
  /** General error messages such as the object already exists */
  general?: Maybe<Scalars['String']['output']>;
  languageId?: Maybe<Scalars['String']['output']>;
  latestPublishVersion?: Maybe<Scalars['String']['output']>;
  latestPublishVisibility?: Maybe<Scalars['String']['output']>;
  name?: Maybe<Scalars['String']['output']>;
  ownerId?: Maybe<Scalars['String']['output']>;
  sectionIds?: Maybe<Scalars['String']['output']>;
  sourceTemplateId?: Maybe<Scalars['String']['output']>;
  sourceVersionedTemplateId?: Maybe<Scalars['String']['output']>;
};

/** A search result for templates */
export type TemplateSearchResult = {
  __typename?: 'TemplateSearchResult';
  /** Whether or not this Template is designated as a 'Best Practice' template */
  bestPractice?: Maybe<Scalars['Boolean']['output']>;
  /** The timestamp when the Template was created */
  created?: Maybe<Scalars['String']['output']>;
  /** The id of the person who created the template */
  createdById?: Maybe<Scalars['Int']['output']>;
  /** the name of the person who created the template */
  createdByName?: Maybe<Scalars['String']['output']>;
  /** A description of the purpose of the template */
  description?: Maybe<Scalars['String']['output']>;
  /** The unique identifer for the Object */
  id?: Maybe<Scalars['Int']['output']>;
  /** Whether or not this is the default template */
  isDefault?: Maybe<Scalars['Boolean']['output']>;
  /** Whether or not the Template has had any changes since it was last published */
  isDirty?: Maybe<Scalars['Boolean']['output']>;
  /** The last published date */
  latestPublishDate?: Maybe<Scalars['String']['output']>;
  /** The last published version */
  latestPublishVersion?: Maybe<Scalars['String']['output']>;
  /** Visibility set for the last published template */
  latestPublishVisibility?: Maybe<TemplateVisibility>;
  /** The timestamp when the Template was last modified */
  modified?: Maybe<Scalars['String']['output']>;
  /** The id of the person who last modified the template */
  modifiedById?: Maybe<Scalars['Int']['output']>;
  /** The name of the person who last modified the template */
  modifiedByName?: Maybe<Scalars['String']['output']>;
  /** The name/title of the template */
  name?: Maybe<Scalars['String']['output']>;
  /** The display name of the affiliation that owns the Template */
  ownerDisplayName?: Maybe<Scalars['String']['output']>;
  /** The id of the affiliation that owns the Template */
  ownerId?: Maybe<Scalars['String']['output']>;
};

/** Paginated results of a search for templates */
export type TemplateSearchResults = PaginatedQueryResults & {
  __typename?: 'TemplateSearchResults';
  /** The sortFields that are available for this query (for standard offset pagination only!) */
  availableSortFields?: Maybe<Array<Maybe<Scalars['String']['output']>>>;
  /** The current offset of the results (for standard offset pagination) */
  currentOffset?: Maybe<Scalars['Int']['output']>;
  /** Whether or not there is a next page */
  hasNextPage?: Maybe<Scalars['Boolean']['output']>;
  /** Whether or not there is a previous page */
  hasPreviousPage?: Maybe<Scalars['Boolean']['output']>;
  /** The TemplateSearchResults that match the search criteria */
  items?: Maybe<Array<Maybe<TemplateSearchResult>>>;
  /** The number of items returned */
  limit?: Maybe<Scalars['Int']['output']>;
  /** The cursor to use for the next page of results (for infinite scroll/load more) */
  nextCursor?: Maybe<Scalars['String']['output']>;
  /** The total number of possible items */
  totalCount?: Maybe<Scalars['Int']['output']>;
};

/** Template version type */
export enum TemplateVersionType {
  /** Draft - saved state for internal review */
  Draft = 'DRAFT',
  /** Published - saved state for use when creating DMPs */
  Published = 'PUBLISHED'
}

/** Template visibility */
export enum TemplateVisibility {
  /** Visible only to users of your institution/affiliation */
  Organization = 'ORGANIZATION',
  /** Visible to all users */
  Public = 'PUBLIC'
}

export type TypeCount = {
  __typename?: 'TypeCount';
  count: Scalars['Int']['output'];
  typeId: Scalars['String']['output'];
};

/** Input parameters for updating a custom section */
export type UpdateCustomQuestionInput = {
  /** The id of the custom question */
  customQuestionId: Scalars['Int']['input'];
  /** The custom question guidance */
  guidanceText?: InputMaybe<Scalars['String']['input']>;
  /** The custom question JSON */
  json: Scalars['String']['input'];
  /** The custom question text */
  questionText: Scalars['String']['input'];
  /** Whether the user is required to answer the question */
  required?: InputMaybe<Scalars['Boolean']['input']>;
  /** The custom question requirements */
  requirementText?: InputMaybe<Scalars['String']['input']>;
  /** The custom question sample answer */
  sampleText?: InputMaybe<Scalars['String']['input']>;
  /** Whether the sample answer should be used as the default answer */
  useSampleTextAsDefault?: InputMaybe<Scalars['Boolean']['input']>;
};

/** Input parameters for updating a custom section */
export type UpdateCustomSectionInput = {
  /** The id of the custom section */
  customSectionId: Scalars['Int']['input'];
  /** The custom guidance for the custom section */
  guidance?: InputMaybe<Scalars['String']['input']>;
  /** The introduction to the custom section */
  introduction?: InputMaybe<Scalars['String']['input']>;
  /** The custom section name */
  name: Scalars['String']['input'];
  /** The requirements for the custom section */
  requirements?: InputMaybe<Scalars['String']['input']>;
};

/** Input for updating a GuidanceGroup */
export type UpdateGuidanceGroupInput = {
  /** Whether this is a best practice GuidanceGroup */
  bestPractice?: InputMaybe<Scalars['Boolean']['input']>;
  /** The description of the GuidanceGroup */
  description?: InputMaybe<Scalars['String']['input']>;
  /** The unique identifier for the GuidanceGroup to update */
  guidanceGroupId: Scalars['Int']['input'];
  /** The name of the GuidanceGroup */
  name?: InputMaybe<Scalars['String']['input']>;
  /** Whether this is an optional subset for departmental use */
  optionalSubset?: InputMaybe<Scalars['Boolean']['input']>;
};

/** Input for updating a Guidance item */
export type UpdateGuidanceInput = {
  /** The unique identifier for the Guidance */
  guidanceId: Scalars['Int']['input'];
  /** The guidance text content */
  guidanceText?: InputMaybe<Scalars['String']['input']>;
  /** The Tags associated with this Guidance */
  tagId?: InputMaybe<Scalars['Int']['input']>;
};

export type UpdateMetadataStandardInput = {
  /** A description of the metadata standard */
  description?: InputMaybe<Scalars['String']['input']>;
  /** The id of the MetadataStandard */
  id: Scalars['Int']['input'];
  /** Keywords to assist in finding the metadata standard */
  keywords?: InputMaybe<Array<Scalars['String']['input']>>;
  /** The name of the metadata standard */
  name: Scalars['String']['input'];
  /** Research domains associated with the metadata standard */
  researchDomainIds?: InputMaybe<Array<Scalars['Int']['input']>>;
  /** The taxonomy URL (do not make this up! should resolve to an HTML/JSON representation of the object) */
  uri?: InputMaybe<Scalars['String']['input']>;
};

export type UpdateProjectFundingInput = {
  /** The funder's unique id/url for the call for submissions to apply for a grant */
  funderOpportunityNumber?: InputMaybe<Scalars['String']['input']>;
  /** The funder's unique id/url for the research project (normally assigned after the grant has been awarded) */
  funderProjectNumber?: InputMaybe<Scalars['String']['input']>;
  /** The funder's unique id/url for the award/grant (normally assigned after the grant has been awarded) */
  grantId?: InputMaybe<Scalars['String']['input']>;
  /** The project funder */
  projectFundingId: Scalars['Int']['input'];
  /** The status of the funding resquest */
  status?: InputMaybe<ProjectFundingStatus>;
};

export type UpdateProjectInput = {
  /** The research project description/abstract */
  abstractText?: InputMaybe<Scalars['String']['input']>;
  /** The actual or anticipated end date of the project */
  endDate?: InputMaybe<Scalars['String']['input']>;
  /** The project's id */
  id: Scalars['Int']['input'];
  /** Whether or not the project is a mock/test */
  isTestProject?: InputMaybe<Scalars['Boolean']['input']>;
  /** The id of the research domain */
  researchDomainId?: InputMaybe<Scalars['Int']['input']>;
  /** The actual or anticipated start date for the project */
  startDate?: InputMaybe<Scalars['String']['input']>;
  /** The title of the research project */
  title: Scalars['String']['input'];
};

export type UpdateProjectMemberInput = {
  /** The Member's affiliation URI */
  affiliationId?: InputMaybe<Scalars['String']['input']>;
  /** The Member's email address */
  email?: InputMaybe<Scalars['String']['input']>;
  /** The Member's first/given name */
  givenName?: InputMaybe<Scalars['String']['input']>;
  /** The roles the Member has on the research project */
  memberRoleIds?: InputMaybe<Array<Scalars['Int']['input']>>;
  /** The Member's ORCID */
  orcid?: InputMaybe<Scalars['String']['input']>;
  /** The project Member */
  projectMemberId: Scalars['Int']['input'];
  /** The Member's last/sur name */
  surName?: InputMaybe<Scalars['String']['input']>;
};

/** Input for updating a new QuestionCondition based on a QuestionCondition id */
export type UpdateQuestionConditionInput = {
  /** The action to take on a QuestionCondition */
  action: QuestionConditionActionType;
  /** Relative to the condition type, it is the value to match on (e.g., HAS_ANSWER should equate to null here) */
  conditionMatch?: InputMaybe<Scalars['String']['input']>;
  /** The type of condition in which to take the action */
  conditionType: QuestionConditionCondition;
  /** The id of the QuestionCondition that will be updated */
  questionConditionId: Scalars['Int']['input'];
  /** The target of the action (e.g., an email address for SEND_EMAIL and a Question id otherwise) */
  target: Scalars['String']['input'];
};

/** Input parameters for updating custom guidance and sample text to a funder question */
export type UpdateQuestionCustomizationInput = {
  /** The custom guidance for the question */
  guidanceText?: InputMaybe<Scalars['String']['input']>;
  /** The identifier of the parent template customization */
  questionCustomizationId: Scalars['Int']['input'];
  /** The sample answer for the question */
  sampleText?: InputMaybe<Scalars['String']['input']>;
};

export type UpdateQuestionInput = {
  /** The display order of the Question */
  displayOrder?: InputMaybe<Scalars['Int']['input']>;
  /** Guidance to complete the question */
  guidanceText?: InputMaybe<Scalars['String']['input']>;
  /** The JSON representation of the question type */
  json?: InputMaybe<Scalars['String']['input']>;
  /** The unique identifier for the Question */
  questionId: Scalars['Int']['input'];
  /** This will be used as a sort of title for the Question */
  questionText?: InputMaybe<Scalars['String']['input']>;
  /** To indicate whether the question is required to be completed */
  required?: InputMaybe<Scalars['Boolean']['input']>;
  /** Requirements associated with the Question */
  requirementText?: InputMaybe<Scalars['String']['input']>;
  /** Sample text to possibly provide a starting point or example to answer question */
  sampleText?: InputMaybe<Scalars['String']['input']>;
  /** Boolean indicating whether we should use content from sampleText as the default answer */
  useSampleTextAsDefault?: InputMaybe<Scalars['Boolean']['input']>;
};

export type UpdateRelatedWorkStatusInput = {
  /** The related work ID */
  id: Scalars['Int']['input'];
  /** The status of the related work */
  status?: InputMaybe<RelatedWorkStatus>;
};

export type UpdateRepositoryInput = {
  /** A description of the repository */
  description?: InputMaybe<Scalars['String']['input']>;
  /** The Repository id */
  id: Scalars['Int']['input'];
  /** Keywords to assist in finding the repository */
  keywords?: InputMaybe<Array<Scalars['String']['input']>>;
  /** The name of the repository */
  name: Scalars['String']['input'];
  /** The re3data identifier if this is a local copy of re3data information (e.g. 'r3d100014782') */
  re3dataId?: InputMaybe<Scalars['String']['input']>;
  /** The Categories/Types of the repository */
  repositoryTypes?: InputMaybe<Array<Scalars['String']['input']>>;
  /** Research domains associated with the repository */
  researchDomainIds?: InputMaybe<Array<Scalars['Int']['input']>>;
  /** The website URL */
  website?: InputMaybe<Scalars['String']['input']>;
};

/** Input parameters for updating custom guidance to a funder section */
export type UpdateSectionCustomizationInput = {
  /** The custom guidance for the section */
  guidance?: InputMaybe<Scalars['String']['input']>;
  /** The identifier of the parent template customization */
  sectionCustomizationId: Scalars['Int']['input'];
};

/** Input for updating a section */
export type UpdateSectionInput = {
  /** Whether or not this Section is designated as a 'Best Practice' section */
  bestPractice?: InputMaybe<Scalars['Boolean']['input']>;
  /** The order in which the section will be displayed in the template */
  displayOrder?: InputMaybe<Scalars['Int']['input']>;
  /** The guidance to help user with section */
  guidance?: InputMaybe<Scalars['String']['input']>;
  /** The section introduction */
  introduction?: InputMaybe<Scalars['String']['input']>;
  /** The section name */
  name?: InputMaybe<Scalars['String']['input']>;
  /** Requirements that a user must consider in this section */
  requirements?: InputMaybe<Scalars['String']['input']>;
  /** The unique identifer for the Section */
  sectionId: Scalars['Int']['input'];
  /** The Tags associated with this section. A section might not have any tags */
  tags?: InputMaybe<Array<TagInput>>;
};

/** Input parameters for updating a Template Customization */
export type UpdateTemplateCustomizationInput = {
  /** The status of the customization */
  status?: InputMaybe<TemplateCustomizationStatus>;
  /** The id of the published funder template */
  templateCustomizationId: Scalars['Int']['input'];
};

export type UpdateUserNotificationsInput = {
  /** Whether or not email notifications are on for when a Plan has a new comment */
  notify_on_comment_added: Scalars['Boolean']['input'];
  /** Whether or not email notifications are on for when feedback on a Plan is completed */
  notify_on_feedback_complete: Scalars['Boolean']['input'];
  /** Whether or not email notifications are on for when a Plan is shared with the user */
  notify_on_plan_shared: Scalars['Boolean']['input'];
  /** Whether or not email notifications are on for Plan visibility changes */
  notify_on_plan_visibility_change: Scalars['Boolean']['input'];
  /** Whether or not email notifications are on for when a Template is shared with the User (Admin only) */
  notify_on_template_shared: Scalars['Boolean']['input'];
};

export type UpdateUserProfileInput = {
  /** The id of the affiliation if the user selected one from the typeahead list */
  affiliationId?: InputMaybe<Scalars['String']['input']>;
  /** The user's first/given name */
  givenName: Scalars['String']['input'];
  /** The user's preferred language */
  languageId?: InputMaybe<Scalars['String']['input']>;
  /** The name of the affiliation if the user did not select one from the typeahead list */
  otherAffiliationName?: InputMaybe<Scalars['String']['input']>;
  /** The user's last/family name */
  surName: Scalars['String']['input'];
};

export type UpsertRelatedWorkInput = {
  /** The Digital Object Identifier (DOI) of the work */
  doi: Scalars['String']['input'];
  /** A hash of the content of this version of a work */
  hash: Scalars['MD5']['input'];
  /** The unique identifier of the plan that this related work has been matched to */
  planId?: InputMaybe<Scalars['Int']['input']>;
  /** The status to give the related work */
  status: RelatedWorkStatus;
};

/** A user of the DMPTool */
export type User = {
  __typename?: 'User';
  /** Whether the user has accepted the terms and conditions of having an account */
  acceptedTerms?: Maybe<Scalars['Boolean']['output']>;
  /** Whether or not account is active */
  active?: Maybe<Scalars['Boolean']['output']>;
  /** The user's organizational affiliation */
  affiliation?: Maybe<Affiliation>;
  /** The timestamp when the Object was created */
  created?: Maybe<Scalars['String']['output']>;
  /** The user who created the Object */
  createdById?: Maybe<Scalars['Int']['output']>;
  /** The user's primary email address */
  email?: Maybe<Scalars['String']['output']>;
  /** The user's email addresses */
  emails?: Maybe<Array<Maybe<UserEmail>>>;
  /** Errors associated with the Object */
  errors?: Maybe<UserErrors>;
  /** The number of failed login attempts */
  failed_sign_in_attempts?: Maybe<Scalars['Int']['output']>;
  /** The user's first/given name */
  givenName?: Maybe<Scalars['String']['output']>;
  /** The unique identifier for the Object */
  id?: Maybe<Scalars['Int']['output']>;
  /** The user's preferred language */
  languageId: Scalars['String']['output'];
  /** The timestamp of the last login */
  last_sign_in?: Maybe<Scalars['String']['output']>;
  /** The method user for the last login: PASSWORD or SSO */
  last_sign_in_via?: Maybe<Scalars['String']['output']>;
  /** Whether or not the account is locked from failed login attempts */
  locked?: Maybe<Scalars['Boolean']['output']>;
  /** The timestamp when the Object was last modified */
  modified?: Maybe<Scalars['String']['output']>;
  /** The user who last modified the Object */
  modifiedById?: Maybe<Scalars['Int']['output']>;
  /** Whether or not email notifications are on for when a Plan has a new comment */
  notify_on_comment_added?: Maybe<Scalars['Boolean']['output']>;
  /** Whether or not email notifications are on for when feedback on a Plan is completed */
  notify_on_feedback_complete?: Maybe<Scalars['Boolean']['output']>;
  /** Whether or not email notifications are on for when a Plan is shared with the user */
  notify_on_plan_shared?: Maybe<Scalars['Boolean']['output']>;
  /** Whether or not email notifications are on for Plan visibility changes */
  notify_on_plan_visibility_change?: Maybe<Scalars['Boolean']['output']>;
  /** Whether or not email notifications are on for when a Template is shared with the User (Admin only) */
  notify_on_template_shared?: Maybe<Scalars['Boolean']['output']>;
  /** The user's ORCID */
  orcid?: Maybe<Scalars['Orcid']['output']>;
  /** The user's role within the DMPTool */
  role: UserRole;
  /** The user's SSO ID */
  ssoId?: Maybe<Scalars['String']['output']>;
  /** The user's last/family name */
  surName?: Maybe<Scalars['String']['output']>;
};

export type UserEmail = {
  __typename?: 'UserEmail';
  /** The timestamp when the Object was created */
  created?: Maybe<Scalars['String']['output']>;
  /** The user who created the Object */
  createdById?: Maybe<Scalars['Int']['output']>;
  /** The email address */
  email: Scalars['String']['output'];
  /** Errors associated with the Object */
  errors?: Maybe<UserEmailErrors>;
  /** The unique identifier for the Object */
  id?: Maybe<Scalars['Int']['output']>;
  /** Whether or not the email address has been confirmed */
  isConfirmed: Scalars['Boolean']['output'];
  /** Whether or not this is the primary email address */
  isPrimary: Scalars['Boolean']['output'];
  /** The timestamp when the Object was last modified */
  modified?: Maybe<Scalars['String']['output']>;
  /** The user who last modified the Object */
  modifiedById?: Maybe<Scalars['Int']['output']>;
  /** The user the email belongs to */
  userId: Scalars['Int']['output'];
};

/** A collection of errors related to the UserEmail */
export type UserEmailErrors = {
  __typename?: 'UserEmailErrors';
  email?: Maybe<Scalars['String']['output']>;
  /** General error messages such as the object already exists */
  general?: Maybe<Scalars['String']['output']>;
  userId?: Maybe<Scalars['String']['output']>;
};

/** A collection of errors related to the User */
export type UserErrors = {
  __typename?: 'UserErrors';
  affiliationId?: Maybe<Scalars['String']['output']>;
  confirmPassword?: Maybe<Scalars['String']['output']>;
  email?: Maybe<Scalars['String']['output']>;
  emailIds?: Maybe<Scalars['String']['output']>;
  /** General error messages such as the object already exists */
  general?: Maybe<Scalars['String']['output']>;
  givenName?: Maybe<Scalars['String']['output']>;
  languageId?: Maybe<Scalars['String']['output']>;
  orcid?: Maybe<Scalars['String']['output']>;
  otherAffiliationName?: Maybe<Scalars['String']['output']>;
  password?: Maybe<Scalars['String']['output']>;
  role?: Maybe<Scalars['String']['output']>;
  ssoId?: Maybe<Scalars['String']['output']>;
  surName?: Maybe<Scalars['String']['output']>;
};

/** The types of roles supported by the DMPTool */
export enum UserRole {
  Admin = 'ADMIN',
  Researcher = 'RESEARCHER',
  Superadmin = 'SUPERADMIN'
}

export type UserSearchResults = PaginatedQueryResults & {
  __typename?: 'UserSearchResults';
  /** The sortFields that are available for this query (for standard offset pagination only!) */
  availableSortFields?: Maybe<Array<Maybe<Scalars['String']['output']>>>;
  /** The current offset of the results (for standard offset pagination) */
  currentOffset?: Maybe<Scalars['Int']['output']>;
  /** Whether or not there is a next page */
  hasNextPage?: Maybe<Scalars['Boolean']['output']>;
  /** Whether or not there is a previous page */
  hasPreviousPage?: Maybe<Scalars['Boolean']['output']>;
  /** The TemplateSearchResults that match the search criteria */
  items?: Maybe<Array<Maybe<User>>>;
  /** The number of items returned */
  limit?: Maybe<Scalars['Int']['output']>;
  /** The cursor to use for the next page of results (for infinite scroll/load more) */
  nextCursor?: Maybe<Scalars['String']['output']>;
  /** The total number of possible items */
  totalCount?: Maybe<Scalars['Int']['output']>;
};

/** A snapshot of a CustomQuestion when the template customization was published. */
export type VersionedCustomQuestion = {
  __typename?: 'VersionedCustomQuestion';
  /** The timestamp when the Object was created */
  created?: Maybe<Scalars['String']['output']>;
  /** The user who created the Object */
  createdById?: Maybe<Scalars['Int']['output']>;
  /** The CustomQuestion this is a snapshot of */
  customQuestionId: Scalars['Int']['output'];
  /** Errors associated with the Object */
  errors?: Maybe<VersionedCustomQuestionErrors>;
  /** Guidance to help the user answer this question */
  guidanceText?: Maybe<Scalars['String']['output']>;
  /** The unique identifier for the Object */
  id?: Maybe<Scalars['Int']['output']>;
  /** The question JSON schema definition */
  json: Scalars['String']['output'];
  /** The timestamp when the Object was last modified */
  modified?: Maybe<Scalars['String']['output']>;
  /** The user who last modified the Object */
  modifiedById?: Maybe<Scalars['Int']['output']>;
  /** Owner affiliation for the question */
  ownerAffiliation?: Maybe<Affiliation>;
  /** The id of the question this custom question is pinned after */
  pinnedVersionedQuestionId?: Maybe<Scalars['Int']['output']>;
  /** The type of question this custom question is pinned after (null = first question in section) */
  pinnedVersionedQuestionType?: Maybe<Scalars['String']['output']>;
  /** The question text */
  questionText: Scalars['String']['output'];
  /** Whether this question is required */
  required?: Maybe<Scalars['Boolean']['output']>;
  /** The requirement text for this question */
  requirementText?: Maybe<Scalars['String']['output']>;
  /** A sample answer for this question */
  sampleText?: Maybe<Scalars['String']['output']>;
  /** Whether the sample text should be pre-populated as the default answer */
  useSampleTextAsDefault?: Maybe<Scalars['Boolean']['output']>;
  /** The id of the section this question belongs to */
  versionedSectionId: Scalars['Int']['output'];
  /** Whether this question is pinned inside a BASE or CUSTOM section */
  versionedSectionType: Scalars['String']['output'];
  /** The VersionedTemplateCustomization this snapshot belongs to */
  versionedTemplateCustomizationId: Scalars['Int']['output'];
};

/** A collection of errors related to the VersionedCustomQuestion */
export type VersionedCustomQuestionErrors = {
  __typename?: 'VersionedCustomQuestionErrors';
  customQuestionId?: Maybe<Scalars['String']['output']>;
  /** General error messages */
  general?: Maybe<Scalars['String']['output']>;
  json?: Maybe<Scalars['String']['output']>;
  questionText?: Maybe<Scalars['String']['output']>;
  versionedSectionId?: Maybe<Scalars['String']['output']>;
  versionedTemplateCustomizationId?: Maybe<Scalars['String']['output']>;
};

/** A snapshot of a CustomSection when the template customization was published. */
export type VersionedCustomSection = {
  __typename?: 'VersionedCustomSection';
  /** The timestamp when the Object was created */
  created?: Maybe<Scalars['String']['output']>;
  /** The user who created the Object */
  createdById?: Maybe<Scalars['Int']['output']>;
  /** The CustomSection this is a snapshot of */
  customSectionId: Scalars['Int']['output'];
  /** Errors associated with the Object */
  errors?: Maybe<VersionedCustomSectionErrors>;
  /** Guidance to help the user with this section */
  guidance?: Maybe<Scalars['String']['output']>;
  /** The unique identifier for the Object */
  id?: Maybe<Scalars['Int']['output']>;
  /** The custom section introduction */
  introduction?: Maybe<Scalars['String']['output']>;
  /** The timestamp when the Object was last modified */
  modified?: Maybe<Scalars['String']['output']>;
  /** The user who last modified the Object */
  modifiedById?: Maybe<Scalars['Int']['output']>;
  /** The custom section name/title */
  name: Scalars['String']['output'];
  /** The id of the base section this custom section is pinned after */
  pinnedVersionedSectionId?: Maybe<Scalars['Int']['output']>;
  /** The type of base section this custom section is pinned after (null = prepend to template) */
  pinnedVersionedSectionType?: Maybe<Scalars['String']['output']>;
  /** The custom questions associated with this VersionedCustomSection */
  questions?: Maybe<Array<VersionedCustomQuestion>>;
  /** Requirements that a user must consider in this section */
  requirements?: Maybe<Scalars['String']['output']>;
  /** The VersionedTemplateCustomization this snapshot belongs to */
  versionedTemplateCustomizationId: Scalars['Int']['output'];
};

/** A collection of errors related to the VersionedCustomSection */
export type VersionedCustomSectionErrors = {
  __typename?: 'VersionedCustomSectionErrors';
  customSectionId?: Maybe<Scalars['String']['output']>;
  /** General error messages */
  general?: Maybe<Scalars['String']['output']>;
  name?: Maybe<Scalars['String']['output']>;
  versionedTemplateCustomizationId?: Maybe<Scalars['String']['output']>;
};

/** A snapshot of a Guidance item when its GuidanceGroup was published */
export type VersionedGuidance = {
  __typename?: 'VersionedGuidance';
  /** The timestamp when the Object was created */
  created?: Maybe<Scalars['String']['output']>;
  /** The user who created the Object */
  createdById?: Maybe<Scalars['Int']['output']>;
  /** Errors associated with the Object */
  errors?: Maybe<VersionedGuidanceErrors>;
  /** The Guidance this is a snapshot of */
  guidance?: Maybe<Guidance>;
  /** The Guidance this is a snapshot of */
  guidanceId?: Maybe<Scalars['Int']['output']>;
  /** The guidance text content */
  guidanceText?: Maybe<Scalars['String']['output']>;
  /** The unique identifier for the Object */
  id?: Maybe<Scalars['Int']['output']>;
  /** The timestamp when the Object was last modified */
  modified?: Maybe<Scalars['String']['output']>;
  /** The user who last modified the Object */
  modifiedById?: Maybe<Scalars['Int']['output']>;
  /** The Tag ID (one of the associated tags) */
  tagId: Scalars['Int']['output'];
  /** All Tags associated with this VersionedGuidance */
  tags?: Maybe<Array<Tag>>;
  /** The VersionedGuidanceGroup this belongs to */
  versionedGuidanceGroup?: Maybe<VersionedGuidanceGroup>;
  /** The VersionedGuidanceGroup this belongs to */
  versionedGuidanceGroupId: Scalars['Int']['output'];
};

/** A collection of errors related to VersionedGuidance */
export type VersionedGuidanceErrors = {
  __typename?: 'VersionedGuidanceErrors';
  /** General error messages such as the object already exists */
  general?: Maybe<Scalars['String']['output']>;
  guidanceId?: Maybe<Scalars['String']['output']>;
  guidanceText?: Maybe<Scalars['String']['output']>;
  tagId?: Maybe<Scalars['String']['output']>;
  versionedGuidanceGroupId?: Maybe<Scalars['String']['output']>;
};

/** A snapshot of a GuidanceGroup when it was published */
export type VersionedGuidanceGroup = {
  __typename?: 'VersionedGuidanceGroup';
  /** Whether this is the currently active version */
  active: Scalars['Boolean']['output'];
  /** Whether this is a best practice VersionedGuidanceGroup */
  bestPractice: Scalars['Boolean']['output'];
  /** The timestamp when the Object was created */
  created?: Maybe<Scalars['String']['output']>;
  /** The user who created the Object */
  createdById?: Maybe<Scalars['Int']['output']>;
  /** Errors associated with the Object */
  errors?: Maybe<VersionedGuidanceGroupErrors>;
  /** The GuidanceGroup this is a snapshot of */
  guidanceGroup?: Maybe<GuidanceGroup>;
  /** The GuidanceGroup this is a snapshot of */
  guidanceGroupId: Scalars['Int']['output'];
  /** The unique identifier for the Object */
  id?: Maybe<Scalars['Int']['output']>;
  /** The timestamp when the Object was last modified */
  modified?: Maybe<Scalars['String']['output']>;
  /** The user who last modified the Object */
  modifiedById?: Maybe<Scalars['Int']['output']>;
  /** The name of the VersionedGuidanceGroup */
  name: Scalars['String']['output'];
  /** Whether this is an optional subset for departmental use */
  optionalSubset: Scalars['Boolean']['output'];
  /** The version number of this snapshot */
  version?: Maybe<Scalars['Int']['output']>;
  /** The VersionedGuidance items in this group */
  versionedGuidance?: Maybe<Array<VersionedGuidance>>;
};

/** A collection of errors related to VersionedGuidanceGroup */
export type VersionedGuidanceGroupErrors = {
  __typename?: 'VersionedGuidanceGroupErrors';
  active?: Maybe<Scalars['String']['output']>;
  bestPractice?: Maybe<Scalars['String']['output']>;
  /** General error messages such as the object already exists */
  general?: Maybe<Scalars['String']['output']>;
  guidanceGroupId?: Maybe<Scalars['String']['output']>;
  name?: Maybe<Scalars['String']['output']>;
  version?: Maybe<Scalars['String']['output']>;
};

/** A snapshot of a Question when it became published. */
export type VersionedQuestion = {
  __typename?: 'VersionedQuestion';
  /** The timestamp when the Object was created */
  created?: Maybe<Scalars['String']['output']>;
  /** The user who created the Object */
  createdById?: Maybe<Scalars['Int']['output']>;
  customizationGuidanceText?: Maybe<Scalars['String']['output']>;
  /** For question customization info */
  customizationId?: Maybe<Scalars['Int']['output']>;
  customizationOwnerAffiliation?: Maybe<Affiliation>;
  customizationSampleText?: Maybe<Scalars['String']['output']>;
  /** The display order of the VersionedQuestion */
  displayOrder?: Maybe<Scalars['Int']['output']>;
  /** Errors associated with the Object */
  errors?: Maybe<VersionedQuestionErrors>;
  /** Guidance to complete the question */
  guidanceText?: Maybe<Scalars['String']['output']>;
  /** The unique identifer for the Object */
  id?: Maybe<Scalars['Int']['output']>;
  /** The JSON representation of the question type */
  json?: Maybe<Scalars['String']['output']>;
  /** The timestamp when the Object was last modifed */
  modified?: Maybe<Scalars['String']['output']>;
  /** The user who last modified the Object */
  modifiedById?: Maybe<Scalars['Int']['output']>;
  /** Owner affiliation for the question */
  ownerAffiliation?: Maybe<Affiliation>;
  /** Id of the original question that was versioned */
  questionId: Scalars['Int']['output'];
  /** This will be used as a sort of title for the Question */
  questionText?: Maybe<Scalars['String']['output']>;
  /** To indicate whether the question is required to be completed */
  required?: Maybe<Scalars['Boolean']['output']>;
  /** Requirements associated with the Question */
  requirementText?: Maybe<Scalars['String']['output']>;
  /** Sample text to possibly provide a starting point or example to answer question */
  sampleText?: Maybe<Scalars['String']['output']>;
  /** Whether or not the sample text should be used as the default answer for this question */
  useSampleTextAsDefault?: Maybe<Scalars['Boolean']['output']>;
  /** The conditional logic associated with this VersionedQuestion */
  versionedQuestionConditions?: Maybe<Array<VersionedQuestionCondition>>;
  /** The unique id of the VersionedSection that the VersionedQuestion belongs to */
  versionedSectionId: Scalars['Int']['output'];
  /** The unique id of the VersionedTemplate that the VersionedQuestion belongs to */
  versionedTemplateId: Scalars['Int']['output'];
};

export type VersionedQuestionCondition = {
  __typename?: 'VersionedQuestionCondition';
  /** The action to take on a QuestionCondition */
  action: VersionedQuestionConditionActionType;
  /** Relative to the condition type, it is the value to match on (e.g., HAS_ANSWER should equate to null here) */
  conditionMatch?: Maybe<Scalars['String']['output']>;
  /** The type of condition in which to take the action */
  conditionType: VersionedQuestionConditionCondition;
  /** The timestamp when the Object was created */
  created?: Maybe<Scalars['String']['output']>;
  /** The user who created the Object */
  createdById?: Maybe<Scalars['Int']['output']>;
  /** Errors associated with the Object */
  errors?: Maybe<VersionedQuestionConditionErrors>;
  /** The unique identifer for the Object */
  id?: Maybe<Scalars['Int']['output']>;
  /** The timestamp when the Object was last modifed */
  modified?: Maybe<Scalars['String']['output']>;
  /** The user who last modified the Object */
  modifiedById?: Maybe<Scalars['Int']['output']>;
  /** Id of the original QuestionCondition */
  questionConditionId: Scalars['Int']['output'];
  /** The target of the action (e.g., an email address for SEND_EMAIL and a Question id otherwise) */
  target: Scalars['String']['output'];
  /** The versionedQuestion id that the QuestionCondition belongs to */
  versionedQuestionId: Scalars['Int']['output'];
};

/** VersionedQuestionCondition action */
export enum VersionedQuestionConditionActionType {
  /** Hide the question */
  HideQuestion = 'HIDE_QUESTION',
  /** Send email */
  SendEmail = 'SEND_EMAIL',
  /** Show the question */
  ShowQuestion = 'SHOW_QUESTION'
}

/** VersionedQuestionCondition types */
export enum VersionedQuestionConditionCondition {
  /** When a question does not equal a specific value */
  DoesNotEqual = 'DOES_NOT_EQUAL',
  /** When a question equals a specific value */
  Equal = 'EQUAL',
  /** When a question has an answer */
  HasAnswer = 'HAS_ANSWER',
  /** When a question includes a specific value */
  Includes = 'INCLUDES'
}

/** A collection of errors related to the VersionedQuestionCondition */
export type VersionedQuestionConditionErrors = {
  __typename?: 'VersionedQuestionConditionErrors';
  action?: Maybe<Scalars['String']['output']>;
  conditionMatch?: Maybe<Scalars['String']['output']>;
  conditionType?: Maybe<Scalars['String']['output']>;
  /** General error messages such as the object already exists */
  general?: Maybe<Scalars['String']['output']>;
  questionConditionId?: Maybe<Scalars['String']['output']>;
  target?: Maybe<Scalars['String']['output']>;
  versionedQuestionId?: Maybe<Scalars['String']['output']>;
};

/** A collection of errors related to the VersionedQuestion */
export type VersionedQuestionErrors = {
  __typename?: 'VersionedQuestionErrors';
  displayOrder?: Maybe<Scalars['String']['output']>;
  /** General error messages such as the object already exists */
  general?: Maybe<Scalars['String']['output']>;
  guidanceText?: Maybe<Scalars['String']['output']>;
  json?: Maybe<Scalars['String']['output']>;
  questionId?: Maybe<Scalars['String']['output']>;
  questionText?: Maybe<Scalars['String']['output']>;
  requirementText?: Maybe<Scalars['String']['output']>;
  sampleText?: Maybe<Scalars['String']['output']>;
  versionedQuestionConditionIds?: Maybe<Scalars['String']['output']>;
  versionedSectionId?: Maybe<Scalars['String']['output']>;
  versionedTemplateId?: Maybe<Scalars['String']['output']>;
};

/** A snapshot of a Section when it became published. */
export type VersionedSection = {
  __typename?: 'VersionedSection';
  /** The timestamp when the Object was created */
  created?: Maybe<Scalars['String']['output']>;
  /** The user who created the Object */
  createdById?: Maybe<Scalars['Int']['output']>;
  /** The displayOrder of this VersionedSection */
  displayOrder: Scalars['Int']['output'];
  /** Errors associated with the Object */
  errors?: Maybe<VersionedSectionErrors>;
  /** The guidance to help user with VersionedSection */
  guidance?: Maybe<Scalars['String']['output']>;
  /** The unique identifer for the Object */
  id?: Maybe<Scalars['Int']['output']>;
  /** The VersionedSection introduction */
  introduction?: Maybe<Scalars['String']['output']>;
  /** The timestamp when the Object was last modifed */
  modified?: Maybe<Scalars['String']['output']>;
  /** The user who last modified the Object */
  modifiedById?: Maybe<Scalars['Int']['output']>;
  /** The VersionedSection name/title */
  name: Scalars['String']['output'];
  /** Requirements that a user must consider in this VersionedSection */
  requirements?: Maybe<Scalars['String']['output']>;
  /** The section that this is a snapshot of */
  section?: Maybe<Section>;
  /** The Tags associated with this VersionedSection */
  tags?: Maybe<Array<Maybe<Tag>>>;
  /** The questions associated with this VersionedSection */
  versionedQuestions?: Maybe<Array<VersionedQuestion>>;
  /** The parent VersionedTemplate */
  versionedTemplate: VersionedTemplate;
};

/** A collection of errors related to the VersionedSection */
export type VersionedSectionErrors = {
  __typename?: 'VersionedSectionErrors';
  displayOrder?: Maybe<Scalars['String']['output']>;
  /** General error messages such as the object already exists */
  general?: Maybe<Scalars['String']['output']>;
  guidance?: Maybe<Scalars['String']['output']>;
  introduction?: Maybe<Scalars['String']['output']>;
  name?: Maybe<Scalars['String']['output']>;
  requirements?: Maybe<Scalars['String']['output']>;
  sectionId?: Maybe<Scalars['String']['output']>;
  tagIds?: Maybe<Scalars['String']['output']>;
  versionedQuestionIds?: Maybe<Scalars['String']['output']>;
  versionedTemplateId?: Maybe<Scalars['String']['output']>;
};

export type VersionedSectionSearchResult = {
  __typename?: 'VersionedSectionSearchResult';
  /** Whether or not this VersionedSection is designated as a 'Best Practice' section */
  bestPractice?: Maybe<Scalars['Boolean']['output']>;
  /** The timestamp when the Object was created */
  created?: Maybe<Scalars['String']['output']>;
  /** The displayOrder of this VersionedSection */
  displayOrder: Scalars['Int']['output'];
  /** The unique identifer for the Object */
  id?: Maybe<Scalars['Int']['output']>;
  /** The VersionedSection introduction */
  introduction?: Maybe<Scalars['String']['output']>;
  /** The timestamp when the Object was last modifed */
  modified?: Maybe<Scalars['String']['output']>;
  /** The VersionedSection name/title */
  name: Scalars['String']['output'];
  /** The number of questions associated with this VersionedSection */
  versionedQuestionCount?: Maybe<Scalars['Int']['output']>;
  /** The id of the VersionedTemplate that this VersionedSection belongs to */
  versionedTemplateId?: Maybe<Scalars['Int']['output']>;
  /** The name of the VersionedTemplate that this VersionedSection belongs to */
  versionedTemplateName?: Maybe<Scalars['String']['output']>;
};

export type VersionedSectionSearchResults = PaginatedQueryResults & {
  __typename?: 'VersionedSectionSearchResults';
  /** The sortFields that are available for this query (for standard offset pagination only!) */
  availableSortFields?: Maybe<Array<Maybe<Scalars['String']['output']>>>;
  /** The current offset of the results (for standard offset pagination) */
  currentOffset?: Maybe<Scalars['Int']['output']>;
  /** Whether or not there is a next page */
  hasNextPage?: Maybe<Scalars['Boolean']['output']>;
  /** Whether or not there is a previous page */
  hasPreviousPage?: Maybe<Scalars['Boolean']['output']>;
  /** The SectionSearchResults that match the search criteria */
  items?: Maybe<Array<Maybe<VersionedSectionSearchResult>>>;
  /** The number of items returned */
  limit?: Maybe<Scalars['Int']['output']>;
  /** The cursor to use for the next page of results (for infinite scroll/load more) */
  nextCursor?: Maybe<Scalars['String']['output']>;
  /** The total number of possible items */
  totalCount?: Maybe<Scalars['Int']['output']>;
};

/** A snapshot of a Template when it became published. DMPs are created from published templates */
export type VersionedTemplate = {
  __typename?: 'VersionedTemplate';
  /** Whether or not this is the version provided when users create a new DMP (default: false) */
  active: Scalars['Boolean']['output'];
  /** Whether or not this Template is designated as a 'Best Practice' template */
  bestPractice: Scalars['Boolean']['output'];
  /** A comment/note the user enters when publishing the Template */
  comment?: Maybe<Scalars['String']['output']>;
  /** The timestamp when the Object was created */
  created?: Maybe<Scalars['String']['output']>;
  /** The user who created the Object */
  createdById?: Maybe<Scalars['Int']['output']>;
  /** A description of the purpose of the template */
  description?: Maybe<Scalars['String']['output']>;
  /** Errors associated with the Object */
  errors?: Maybe<VersionedTemplateErrors>;
  /** The unique identifer for the Object */
  id?: Maybe<Scalars['Int']['output']>;
  /** Whether or not this is the default template */
  isDefault?: Maybe<Scalars['Boolean']['output']>;
  /** The timestamp when the Object was last modifed */
  modified?: Maybe<Scalars['String']['output']>;
  /** The user who last modified the Object */
  modifiedById?: Maybe<Scalars['Int']['output']>;
  /** The name/title of the template */
  name: Scalars['String']['output'];
  /** The owner of the Template */
  owner?: Maybe<Affiliation>;
  /** The template that this published version stems from */
  template?: Maybe<Template>;
  /** The major.minor semantic version */
  version: Scalars['String']['output'];
  /** The type of version: Published or Draft (default: Draft) */
  versionType?: Maybe<TemplateVersionType>;
  /** The publisher of the Template */
  versionedBy?: Maybe<User>;
  /** The VersionedSections that go with the VersionedTemplate */
  versionedSections?: Maybe<Array<VersionedSection>>;
  /** The template's availability setting: Public is available to everyone, Private only your affiliation */
  visibility: TemplateVisibility;
};

/** A collection of errors related to the VersionedTemplate */
export type VersionedTemplateErrors = {
  __typename?: 'VersionedTemplateErrors';
  comment?: Maybe<Scalars['String']['output']>;
  description?: Maybe<Scalars['String']['output']>;
  /** General error messages such as the object already exists */
  general?: Maybe<Scalars['String']['output']>;
  name?: Maybe<Scalars['String']['output']>;
  ownerId?: Maybe<Scalars['String']['output']>;
  templateId?: Maybe<Scalars['String']['output']>;
  version?: Maybe<Scalars['String']['output']>;
  versionType?: Maybe<Scalars['String']['output']>;
  versionedById?: Maybe<Scalars['String']['output']>;
  versionedSectionIds?: Maybe<Scalars['String']['output']>;
  visibility?: Maybe<Scalars['String']['output']>;
};

/** An abbreviated view of a Template for pages that allow search/filtering of published Templates */
export type VersionedTemplateSearchResult = {
  __typename?: 'VersionedTemplateSearchResult';
  /** Whether or not this Template is designated as a 'Best Practice' template */
  bestPractice?: Maybe<Scalars['Boolean']['output']>;
  /** A description of the purpose of the template */
  description?: Maybe<Scalars['String']['output']>;
  /** The unique identifer for the Object */
  id?: Maybe<Scalars['Int']['output']>;
  /** Whether or not this is the default template */
  isDefault?: Maybe<Scalars['Boolean']['output']>;
  /** The timestamp when the Template was last modified */
  modified?: Maybe<Scalars['String']['output']>;
  /** The name of the last person who modified the Template */
  modifiedById?: Maybe<Scalars['Int']['output']>;
  /** The name of the last person who modified the Template */
  modifiedByName?: Maybe<Scalars['String']['output']>;
  /** The name/title of the template */
  name?: Maybe<Scalars['String']['output']>;
  /** The display name of the affiliation that owns the Template */
  ownerDisplayName?: Maybe<Scalars['String']['output']>;
  /** The id of the affiliation that owns the Template */
  ownerId?: Maybe<Scalars['Int']['output']>;
  /** The search name of the affiliation that owns the Template */
  ownerSearchName?: Maybe<Scalars['String']['output']>;
  /** The URI of the affiliation that owns the Template */
  ownerURI?: Maybe<Scalars['String']['output']>;
  /** The id of the template that this version is based on */
  templateId?: Maybe<Scalars['Int']['output']>;
  /** The major.minor semantic version */
  version?: Maybe<Scalars['String']['output']>;
  /** The id of the template customization (undefined means the template has not been customized yet) */
  versionedTemplateCustomizationId?: Maybe<Scalars['Int']['output']>;
  /** The template's availability setting: Public is available to everyone, Private only your affiliation */
  visibility?: Maybe<TemplateVisibility>;
};

export type Work = {
  __typename?: 'Work';
  /** The timestamp when the Object was created */
  created: Scalars['String']['output'];
  /** The user who created the Object. Null if the work was automatically found */
  createdById?: Maybe<Scalars['Int']['output']>;
  /** The Digital Object Identifier (DOI) of the work */
  doi: Scalars['String']['output'];
  /** The unique identifier for the Object */
  id: Scalars['Int']['output'];
  /** The timestamp when the Object was last modified */
  modified: Scalars['String']['output'];
  /** The user who last modified the Object */
  modifiedById?: Maybe<Scalars['Int']['output']>;
};

/** The type of work */
export enum WorkType {
  Article = 'ARTICLE',
  AudioVisual = 'AUDIO_VISUAL',
  Book = 'BOOK',
  BookChapter = 'BOOK_CHAPTER',
  Collection = 'COLLECTION',
  Dataset = 'DATASET',
  DataPaper = 'DATA_PAPER',
  Dissertation = 'DISSERTATION',
  Editorial = 'EDITORIAL',
  Erratum = 'ERRATUM',
  Event = 'EVENT',
  Grant = 'GRANT',
  Image = 'IMAGE',
  InteractiveResource = 'INTERACTIVE_RESOURCE',
  Letter = 'LETTER',
  Libguides = 'LIBGUIDES',
  Model = 'MODEL',
  Other = 'OTHER',
  Paratext = 'PARATEXT',
  PeerReview = 'PEER_REVIEW',
  PhysicalObject = 'PHYSICAL_OBJECT',
  Preprint = 'PREPRINT',
  PreRegistration = 'PRE_REGISTRATION',
  Protocol = 'PROTOCOL',
  ReferenceEntry = 'REFERENCE_ENTRY',
  Report = 'REPORT',
  Retraction = 'RETRACTION',
  Review = 'REVIEW',
  Service = 'SERVICE',
  Software = 'SOFTWARE',
  Sound = 'SOUND',
  Standard = 'STANDARD',
  SupplementaryMaterials = 'SUPPLEMENTARY_MATERIALS',
  Text = 'TEXT',
  TraditionalKnowledge = 'TRADITIONAL_KNOWLEDGE',
  Workflow = 'WORKFLOW'
}

export type WorkVersion = {
  __typename?: 'WorkVersion';
  /** The authors of the work */
  authors: Array<Author>;
  /** The awards that funded the work */
  awards: Array<Award>;
  /** The timestamp when the Object was created */
  created: Scalars['String']['output'];
  /** The user who created the Object. Null if the work was automatically found */
  createdById?: Maybe<Scalars['Int']['output']>;
  /** The funders of the work */
  funders: Array<Funder>;
  /** A hash of the content of this version of a work */
  hash: Scalars['MD5']['output'];
  /** The unique identifier for the Object */
  id: Scalars['Int']['output'];
  /** The unique institutions of the authors of the work */
  institutions: Array<Institution>;
  /** The timestamp when the Object was last modified */
  modified: Scalars['String']['output'];
  /** The user who last modified the Object */
  modifiedById?: Maybe<Scalars['Int']['output']>;
  /** The date that the work was published YYYY-MM-DD */
  publicationDate?: Maybe<Scalars['String']['output']>;
  /** The venue where the work was published, e.g. IEEE Transactions on Software Engineering, Zenodo etc */
  publicationVenue?: Maybe<Scalars['String']['output']>;
  /** The name of the source where the work was found */
  sourceName: Scalars['String']['output'];
  /** The URL for the source of the work */
  sourceUrl?: Maybe<Scalars['String']['output']>;
  /** The title of the work */
  title?: Maybe<Scalars['String']['output']>;
  /** The work */
  work: Work;
  /** The type of the work */
  workType: WorkType;
};

export type AddAffiliationMutationVariables = Exact<{
  input: AffiliationInput;
}>;


export type AddAffiliationMutation = { __typename?: 'Mutation', addAffiliation?: { __typename?: 'Affiliation', uri: string, errors?: { __typename?: 'AffiliationErrors', general?: string | null, name?: string | null } | null } | null };

export type UpdateAffiliationMutationVariables = Exact<{
  input: AffiliationInput;
}>;


export type UpdateAffiliationMutation = { __typename?: 'Mutation', updateAffiliation?: { __typename?: 'Affiliation', feedbackEmails?: Array<string> | null, feedbackEnabled: boolean, feedbackMessage?: string | null, id?: number | null, uri: string, name: string, displayName: string, errors?: { __typename?: 'AffiliationErrors', general?: string | null, feedbackEmails?: string | null, feedbackMessage?: string | null } | null } | null };

export type AddAnswerMutationVariables = Exact<{
  planId: Scalars['Int']['input'];
  versionedSectionId?: InputMaybe<Scalars['Int']['input']>;
  versionedQuestionId?: InputMaybe<Scalars['Int']['input']>;
  versionedCustomSectionId?: InputMaybe<Scalars['Int']['input']>;
  versionedCustomQuestionId?: InputMaybe<Scalars['Int']['input']>;
  json: Scalars['String']['input'];
}>;


export type AddAnswerMutation = { __typename?: 'Mutation', addAnswer?: { __typename?: 'Answer', id?: number | null, json?: string | null, modified?: string | null } | null };

export type UpdateAnswerMutationVariables = Exact<{
  answerId: Scalars['Int']['input'];
  json?: InputMaybe<Scalars['String']['input']>;
}>;


export type UpdateAnswerMutation = { __typename?: 'Mutation', updateAnswer?: { __typename?: 'Answer', id?: number | null, json?: string | null, modified?: string | null, errors?: { __typename?: 'AffiliationErrors', acronyms?: string | null, aliases?: string | null, contactEmail?: string | null, contactName?: string | null, displayName?: string | null, feedbackEmails?: string | null, feedbackMessage?: string | null, fundrefId?: string | null, general?: string | null, homepage?: string | null, json?: string | null, logoName?: string | null, logoURI?: string | null, name?: string | null, planId?: string | null, provenance?: string | null, searchName?: string | null, ssoEntityId?: string | null, subHeaderLinks?: string | null, types?: string | null, uri?: string | null, versionedQuestionId?: string | null, versionedSectionId?: string | null } | null, versionedQuestion?: { __typename?: 'VersionedQuestion', versionedSectionId: number } | null } | null };

export type RemoveAnswerCommentMutationVariables = Exact<{
  answerCommentId: Scalars['Int']['input'];
  answerId: Scalars['Int']['input'];
}>;


export type RemoveAnswerCommentMutation = { __typename?: 'Mutation', removeAnswerComment?: { __typename?: 'AnswerComment', id?: number | null, answerId: number, commentText: string, errors?: { __typename?: 'AnswerCommentErrors', general?: string | null } | null } | null };

export type UpdateAnswerCommentMutationVariables = Exact<{
  answerCommentId: Scalars['Int']['input'];
  answerId: Scalars['Int']['input'];
  commentText: Scalars['String']['input'];
}>;


export type UpdateAnswerCommentMutation = { __typename?: 'Mutation', updateAnswerComment?: { __typename?: 'AnswerComment', commentText: string, answerId: number, id?: number | null, errors?: { __typename?: 'AnswerCommentErrors', general?: string | null, commentText?: string | null, answerId?: string | null } | null } | null };

export type AddAnswerCommentMutationVariables = Exact<{
  answerId: Scalars['Int']['input'];
  commentText: Scalars['String']['input'];
}>;


export type AddAnswerCommentMutation = { __typename?: 'Mutation', addAnswerComment?: { __typename?: 'AnswerComment', commentText: string, id?: number | null, answerId: number, errors?: { __typename?: 'AnswerCommentErrors', general?: string | null } | null } | null };

export type UpdateProjectCollaboratorMutationVariables = Exact<{
  projectCollaboratorId: Scalars['Int']['input'];
  accessLevel: ProjectCollaboratorAccessLevel;
}>;


export type UpdateProjectCollaboratorMutation = { __typename?: 'Mutation', updateProjectCollaborator?: { __typename?: 'ProjectCollaborator', id?: number | null, accessLevel?: ProjectCollaboratorAccessLevel | null, errors?: { __typename?: 'ProjectCollaboratorErrors', accessLevel?: string | null, email?: string | null, general?: string | null, invitedById?: string | null, planId?: string | null, userId?: string | null } | null, user?: { __typename?: 'User', givenName?: string | null, id?: number | null, surName?: string | null } | null } | null };

export type RemoveProjectCollaboratorMutationVariables = Exact<{
  projectCollaboratorId: Scalars['Int']['input'];
}>;


export type RemoveProjectCollaboratorMutation = { __typename?: 'Mutation', removeProjectCollaborator?: { __typename?: 'ProjectCollaborator', id?: number | null, errors?: { __typename?: 'ProjectCollaboratorErrors', accessLevel?: string | null, email?: string | null, general?: string | null, invitedById?: string | null, planId?: string | null, userId?: string | null } | null, user?: { __typename?: 'User', givenName?: string | null, id?: number | null, surName?: string | null } | null } | null };

export type ResendInviteToProjectCollaboratorMutationVariables = Exact<{
  projectCollaboratorId: Scalars['Int']['input'];
}>;


export type ResendInviteToProjectCollaboratorMutation = { __typename?: 'Mutation', resendInviteToProjectCollaborator?: { __typename?: 'ProjectCollaborator', id?: number | null, email: string, user?: { __typename?: 'User', id?: number | null, givenName?: string | null, surName?: string | null } | null, errors?: { __typename?: 'ProjectCollaboratorErrors', accessLevel?: string | null, email?: string | null, general?: string | null, invitedById?: string | null, planId?: string | null, userId?: string | null } | null } | null };

export type AddCustomQuestionMutationVariables = Exact<{
  input: AddCustomQuestionInput;
}>;


export type AddCustomQuestionMutation = { __typename?: 'Mutation', addCustomQuestion: { __typename?: 'CustomQuestion', guidanceText?: string | null, id?: number | null, json?: string | null, migrationStatus: TemplateCustomizationMigrationStatus, modified?: string | null, pinnedQuestionId?: number | null, pinnedQuestionType?: CustomizableObjectOwnership | null, questionText?: string | null, required?: boolean | null, requirementText?: string | null, sampleText?: string | null, sectionType: CustomizableObjectOwnership, templateCustomizationId: number, useSampleTextAsDefault?: boolean | null, errors?: { __typename?: 'CustomQuestionErrors', general?: string | null, guidanceText?: string | null, json?: string | null, migrationStatus?: string | null, pinnedQuestionId?: string | null, pinnedQuestionType?: string | null, questionText?: string | null, required?: string | null, requirementText?: string | null, sampleText?: string | null, templateCustomizationId?: string | null, useSampleTextAsDefault?: string | null, sectionType?: string | null } | null } };

export type UpdateCustomQuestionMutationVariables = Exact<{
  input: UpdateCustomQuestionInput;
}>;


export type UpdateCustomQuestionMutation = { __typename?: 'Mutation', updateCustomQuestion: { __typename?: 'CustomQuestion', id?: number | null, guidanceText?: string | null, json?: string | null, migrationStatus: TemplateCustomizationMigrationStatus, modified?: string | null, pinnedQuestionId?: number | null, pinnedQuestionType?: CustomizableObjectOwnership | null, questionText?: string | null, required?: boolean | null, requirementText?: string | null, sampleText?: string | null, sectionId: number, sectionType: CustomizableObjectOwnership, templateCustomizationId: number, useSampleTextAsDefault?: boolean | null, errors?: { __typename?: 'CustomQuestionErrors', general?: string | null, guidanceText?: string | null, questionText?: string | null, sampleText?: string | null, requirementText?: string | null, useSampleTextAsDefault?: string | null } | null } };

export type RemoveCustomQuestionMutationVariables = Exact<{
  customQuestionId: Scalars['Int']['input'];
}>;


export type RemoveCustomQuestionMutation = { __typename?: 'Mutation', removeCustomQuestion: { __typename?: 'CustomQuestion', id?: number | null, guidanceText?: string | null, json?: string | null, migrationStatus: TemplateCustomizationMigrationStatus, modified?: string | null, pinnedQuestionId?: number | null, pinnedQuestionType?: CustomizableObjectOwnership | null, questionText?: string | null, required?: boolean | null, requirementText?: string | null, sampleText?: string | null, useSampleTextAsDefault?: boolean | null, templateCustomizationId: number, sectionId: number, errors?: { __typename?: 'CustomQuestionErrors', guidanceText?: string | null, general?: string | null, json?: string | null, migrationStatus?: string | null, pinnedQuestionId?: string | null, pinnedQuestionType?: string | null, questionText?: string | null, requirementText?: string | null, sampleText?: string | null, useSampleTextAsDefault?: string | null } | null } };

export type AddCustomSectionMutationVariables = Exact<{
  input: AddCustomSectionInput;
}>;


export type AddCustomSectionMutation = { __typename?: 'Mutation', addCustomSection: { __typename?: 'CustomSection', id?: number | null, guidance?: string | null, introduction?: string | null, migrationStatus?: TemplateCustomizationMigrationStatus | null, modified?: string | null, name?: string | null, pinnedSectionId?: number | null, pinnedSectionType?: CustomizableObjectOwnership | null, requirements?: string | null, templateCustomizationId: number, errors?: { __typename?: 'CustomSectionErrors', general?: string | null, guidance?: string | null, introduction?: string | null, name?: string | null, requirements?: string | null, pinnedSectionId?: string | null, pinnedSectionType?: string | null, templateCustomizationId?: string | null } | null } };

export type UpdateCustomSectionMutationVariables = Exact<{
  input: UpdateCustomSectionInput;
}>;


export type UpdateCustomSectionMutation = { __typename?: 'Mutation', updateCustomSection: { __typename?: 'CustomSection', id?: number | null, guidance?: string | null, introduction?: string | null, migrationStatus?: TemplateCustomizationMigrationStatus | null, modified?: string | null, name?: string | null, pinnedSectionId?: number | null, pinnedSectionType?: CustomizableObjectOwnership | null, requirements?: string | null, templateCustomizationId: number, errors?: { __typename?: 'CustomSectionErrors', general?: string | null, guidance?: string | null, introduction?: string | null, name?: string | null, requirements?: string | null } | null } };

export type RemoveCustomSectionMutationVariables = Exact<{
  customSectionId: Scalars['Int']['input'];
}>;


export type RemoveCustomSectionMutation = { __typename?: 'Mutation', removeCustomSection: { __typename?: 'CustomSection', id?: number | null, guidance?: string | null, introduction?: string | null, migrationStatus?: TemplateCustomizationMigrationStatus | null, modified?: string | null, name?: string | null, pinnedSectionId?: number | null, pinnedSectionType?: CustomizableObjectOwnership | null, requirements?: string | null, templateCustomizationId: number, errors?: { __typename?: 'CustomSectionErrors', general?: string | null } | null } };

export type RemoveFeedbackCommentMutationVariables = Exact<{
  planId: Scalars['Int']['input'];
  planFeedbackCommentId: Scalars['Int']['input'];
}>;


export type RemoveFeedbackCommentMutation = { __typename?: 'Mutation', removeFeedbackComment?: { __typename?: 'PlanFeedbackComment', id?: number | null, answerId?: number | null, commentText?: string | null, errors?: { __typename?: 'PlanFeedbackCommentErrors', general?: string | null } | null } | null };

export type UpdateFeedbackCommentMutationVariables = Exact<{
  planId: Scalars['Int']['input'];
  planFeedbackCommentId: Scalars['Int']['input'];
  commentText: Scalars['String']['input'];
}>;


export type UpdateFeedbackCommentMutation = { __typename?: 'Mutation', updateFeedbackComment?: { __typename?: 'PlanFeedbackComment', answerId?: number | null, commentText?: string | null, id?: number | null, errors?: { __typename?: 'PlanFeedbackCommentErrors', general?: string | null } | null } | null };

export type AddFeedbackCommentMutationVariables = Exact<{
  planId: Scalars['Int']['input'];
  planFeedbackId: Scalars['Int']['input'];
  answerId: Scalars['Int']['input'];
  commentText: Scalars['String']['input'];
}>;


export type AddFeedbackCommentMutation = { __typename?: 'Mutation', addFeedbackComment?: { __typename?: 'PlanFeedbackComment', id?: number | null, answerId?: number | null, commentText?: string | null, errors?: { __typename?: 'PlanFeedbackCommentErrors', general?: string | null } | null } | null };

export type RequestFeedbackMutationVariables = Exact<{
  planId: Scalars['Int']['input'];
  messageToOrg?: InputMaybe<Scalars['String']['input']>;
}>;


export type RequestFeedbackMutation = { __typename?: 'Mutation', requestFeedback?: { __typename?: 'PlanFeedback', id?: number | null, completed?: string | null, messageToOrg?: string | null, feedbackComments?: Array<{ __typename?: 'PlanFeedbackComment', commentText?: string | null, answerId?: number | null, id?: number | null }> | null, errors?: { __typename?: 'PlanFeedbackErrors', feedbackComments?: string | null, general?: string | null, planId?: string | null } | null, completedBy?: { __typename?: 'User', id?: number | null, email?: string | null } | null } | null };

export type CompleteFeedbackMutationVariables = Exact<{
  planId: Scalars['Int']['input'];
  planFeedbackId: Scalars['Int']['input'];
}>;


export type CompleteFeedbackMutation = { __typename?: 'Mutation', completeFeedback?: { __typename?: 'PlanFeedback', id?: number | null, errors?: { __typename?: 'PlanFeedbackErrors', general?: string | null } | null } | null };

export type AddGuidanceMutationVariables = Exact<{
  input: AddGuidanceInput;
}>;


export type AddGuidanceMutation = { __typename?: 'Mutation', addGuidance: { __typename?: 'Guidance', id?: number | null, guidanceText?: string | null, tagId?: number | null, errors?: { __typename?: 'GuidanceErrors', general?: string | null, guidanceGroupId?: string | null, guidanceText?: string | null } | null } };

export type UpdateGuidanceMutationVariables = Exact<{
  input: UpdateGuidanceInput;
}>;


export type UpdateGuidanceMutation = { __typename?: 'Mutation', updateGuidance: { __typename?: 'Guidance', id?: number | null, guidanceText?: string | null, tagId?: number | null, errors?: { __typename?: 'GuidanceErrors', general?: string | null, guidanceGroupId?: string | null, guidanceText?: string | null } | null } };

export type AddPlanGuidanceMutationVariables = Exact<{
  planId: Scalars['Int']['input'];
  affiliationId: Scalars['String']['input'];
}>;


export type AddPlanGuidanceMutation = { __typename?: 'Mutation', addPlanGuidance: { __typename?: 'PlanGuidance', id?: number | null, planId: number, affiliationId: string } };

export type RemovePlanGuidanceMutationVariables = Exact<{
  planId: Scalars['Int']['input'];
  affiliationId: Scalars['String']['input'];
}>;


export type RemovePlanGuidanceMutation = { __typename?: 'Mutation', removePlanGuidance?: { __typename?: 'PlanGuidance', id?: number | null, planId: number, userId: number, affiliationId: string } | null };

export type AddGuidanceGroupMutationVariables = Exact<{
  input: AddGuidanceGroupInput;
}>;


export type AddGuidanceGroupMutation = { __typename?: 'Mutation', addGuidanceGroup: { __typename?: 'GuidanceGroup', name: string, id?: number | null, errors?: { __typename?: 'GuidanceGroupErrors', affiliationId?: string | null, bestPractice?: string | null, general?: string | null, name?: string | null } | null } };

export type PublishGuidanceGroupMutationVariables = Exact<{
  guidanceGroupId: Scalars['Int']['input'];
}>;


export type PublishGuidanceGroupMutation = { __typename?: 'Mutation', publishGuidanceGroup: { __typename?: 'GuidanceGroup', id?: number | null, name: string, errors?: { __typename?: 'GuidanceGroupErrors', general?: string | null, affiliationId?: string | null, bestPractice?: string | null, name?: string | null, description?: string | null } | null } };

export type UpdateGuidanceGroupMutationVariables = Exact<{
  input: UpdateGuidanceGroupInput;
}>;


export type UpdateGuidanceGroupMutation = { __typename?: 'Mutation', updateGuidanceGroup: { __typename?: 'GuidanceGroup', id?: number | null, name: string, description?: string | null, bestPractice: boolean, errors?: { __typename?: 'GuidanceGroupErrors', affiliationId?: string | null, bestPractice?: string | null, general?: string | null, name?: string | null, description?: string | null } | null } };

export type UnpublishGuidanceGroupMutationVariables = Exact<{
  guidanceGroupId: Scalars['Int']['input'];
}>;


export type UnpublishGuidanceGroupMutation = { __typename?: 'Mutation', unpublishGuidanceGroup: { __typename?: 'GuidanceGroup', id?: number | null, name: string, errors?: { __typename?: 'GuidanceGroupErrors', affiliationId?: string | null, bestPractice?: string | null, description?: string | null, general?: string | null, name?: string | null } | null } };

export type AddMetadataStandardInputMutationVariables = Exact<{
  input: AddMetadataStandardInput;
}>;


export type AddMetadataStandardInputMutation = { __typename?: 'Mutation', addMetadataStandard?: { __typename?: 'MetadataStandard', id?: number | null, description?: string | null, keywords?: Array<string> | null, name: string, uri: string, errors?: { __typename?: 'MetadataStandardErrors', description?: string | null, general?: string | null, keywords?: string | null, name?: string | null, researchDomainIds?: string | null, uri?: string | null } | null } | null };

export type AddPlanMutationVariables = Exact<{
  projectId: Scalars['Int']['input'];
  versionedTemplateId: Scalars['Int']['input'];
}>;


export type AddPlanMutation = { __typename?: 'Mutation', addPlan?: { __typename?: 'Plan', id?: number | null, errors?: { __typename?: 'PlanErrors', general?: string | null, versionedTemplateId?: string | null, projectId?: string | null } | null } | null };

export type AddPlanFundingMutationVariables = Exact<{
  planId: Scalars['Int']['input'];
  projectFundingIds: Array<Scalars['Int']['input']> | Scalars['Int']['input'];
}>;


export type AddPlanFundingMutation = { __typename?: 'Mutation', addPlanFunding?: { __typename?: 'Plan', errors?: { __typename?: 'PlanErrors', general?: string | null } | null } | null };

export type AddPlanMemberMutationVariables = Exact<{
  planId: Scalars['Int']['input'];
  projectMemberId: Scalars['Int']['input'];
}>;


export type AddPlanMemberMutation = { __typename?: 'Mutation', addPlanMember?: { __typename?: 'PlanMember', id?: number | null, isPrimaryContact?: boolean | null, errors?: { __typename?: 'PlanMemberErrors', general?: string | null, memberRoleIds?: string | null, primaryContact?: string | null, projectMemberId?: string | null, projectId?: string | null } | null } | null };

export type RemovePlanMemberMutationVariables = Exact<{
  planMemberId: Scalars['Int']['input'];
}>;


export type RemovePlanMemberMutation = { __typename?: 'Mutation', removePlanMember?: { __typename?: 'PlanMember', id?: number | null, isPrimaryContact?: boolean | null, errors?: { __typename?: 'PlanMemberErrors', general?: string | null, primaryContact?: string | null, projectMemberId?: string | null, projectId?: string | null, memberRoleIds?: string | null } | null } | null };

export type UpdatePlanMemberMutationVariables = Exact<{
  planId: Scalars['Int']['input'];
  planMemberId: Scalars['Int']['input'];
  isPrimaryContact?: InputMaybe<Scalars['Boolean']['input']>;
  memberRoleIds?: InputMaybe<Array<Scalars['Int']['input']> | Scalars['Int']['input']>;
}>;


export type UpdatePlanMemberMutation = { __typename?: 'Mutation', updatePlanMember?: { __typename?: 'PlanMember', id?: number | null, errors?: { __typename?: 'PlanMemberErrors', general?: string | null } | null } | null };

export type PublishPlanMutationVariables = Exact<{
  planId: Scalars['Int']['input'];
  visibility?: InputMaybe<PlanVisibility>;
}>;


export type PublishPlanMutation = { __typename?: 'Mutation', publishPlan?: { __typename?: 'Plan', visibility?: PlanVisibility | null, status?: PlanStatus | null, errors?: { __typename?: 'PlanErrors', general?: string | null, visibility?: string | null, status?: string | null } | null } | null };

export type UpdatePlanStatusMutationVariables = Exact<{
  planId: Scalars['Int']['input'];
  status: PlanStatus;
}>;


export type UpdatePlanStatusMutation = { __typename?: 'Mutation', updatePlanStatus?: { __typename?: 'Plan', id?: number | null, status?: PlanStatus | null, visibility?: PlanVisibility | null, errors?: { __typename?: 'PlanErrors', general?: string | null, status?: string | null } | null } | null };

export type UpdatePlanTitleMutationVariables = Exact<{
  planId: Scalars['Int']['input'];
  title: Scalars['String']['input'];
}>;


export type UpdatePlanTitleMutation = { __typename?: 'Mutation', updatePlanTitle?: { __typename?: 'Plan', id?: number | null, title?: string | null, errors?: { __typename?: 'PlanErrors', general?: string | null, title?: string | null } | null } | null };

export type UpdatePlanFundingMutationVariables = Exact<{
  planId: Scalars['Int']['input'];
  projectFundingIds: Array<Scalars['Int']['input']> | Scalars['Int']['input'];
}>;


export type UpdatePlanFundingMutation = { __typename?: 'Mutation', updatePlanFunding?: Array<{ __typename?: 'PlanFunding', errors?: { __typename?: 'PlanFundingErrors', ProjectFundingId?: string | null, general?: string | null, planId?: string | null } | null, projectFunding?: { __typename?: 'ProjectFunding', id?: number | null } | null } | null> | null };

export type AddProjectCollaboratorMutationVariables = Exact<{
  projectId: Scalars['Int']['input'];
  email: Scalars['String']['input'];
  accessLevel?: InputMaybe<ProjectCollaboratorAccessLevel>;
}>;


export type AddProjectCollaboratorMutation = { __typename?: 'Mutation', addProjectCollaborator?: { __typename?: 'ProjectCollaborator', id?: number | null, email: string, errors?: { __typename?: 'ProjectCollaboratorErrors', general?: string | null, email?: string | null } | null, user?: { __typename?: 'User', givenName?: string | null, surName?: string | null, orcid?: any | null, affiliation?: { __typename?: 'Affiliation', uri: string } | null } | null } | null };

export type AddProjectFundingMutationVariables = Exact<{
  input: AddProjectFundingInput;
}>;


export type AddProjectFundingMutation = { __typename?: 'Mutation', addProjectFunding?: { __typename?: 'ProjectFunding', id?: number | null, errors?: { __typename?: 'ProjectFundingErrors', affiliationId?: string | null, funderOpportunityNumber?: string | null, funderProjectNumber?: string | null, general?: string | null, grantId?: string | null, projectId?: string | null, status?: string | null } | null } | null };

export type UpdateProjectFundingMutationVariables = Exact<{
  input: UpdateProjectFundingInput;
}>;


export type UpdateProjectFundingMutation = { __typename?: 'Mutation', updateProjectFunding?: { __typename?: 'ProjectFunding', errors?: { __typename?: 'ProjectFundingErrors', affiliationId?: string | null, funderOpportunityNumber?: string | null, funderProjectNumber?: string | null, general?: string | null, grantId?: string | null, projectId?: string | null, status?: string | null } | null } | null };

export type RemoveProjectFundingMutationVariables = Exact<{
  projectFundingId: Scalars['Int']['input'];
}>;


export type RemoveProjectFundingMutation = { __typename?: 'Mutation', removeProjectFunding?: { __typename?: 'ProjectFunding', id?: number | null, errors?: { __typename?: 'ProjectFundingErrors', affiliationId?: string | null, funderOpportunityNumber?: string | null, funderProjectNumber?: string | null, general?: string | null, grantId?: string | null, projectId?: string | null, status?: string | null } | null } | null };

export type UpdateProjectMemberMutationVariables = Exact<{
  input: UpdateProjectMemberInput;
}>;


export type UpdateProjectMemberMutation = { __typename?: 'Mutation', updateProjectMember?: { __typename?: 'ProjectMember', givenName?: string | null, surName?: string | null, orcid?: string | null, id?: number | null, errors?: { __typename?: 'ProjectMemberErrors', email?: string | null, surName?: string | null, general?: string | null, givenName?: string | null, orcid?: string | null, affiliationId?: string | null, memberRoleIds?: string | null } | null } | null };

export type RemoveProjectMemberMutationVariables = Exact<{
  projectMemberId: Scalars['Int']['input'];
}>;


export type RemoveProjectMemberMutation = { __typename?: 'Mutation', removeProjectMember?: { __typename?: 'ProjectMember', errors?: { __typename?: 'ProjectMemberErrors', general?: string | null, email?: string | null, affiliationId?: string | null, givenName?: string | null, orcid?: string | null, surName?: string | null, memberRoleIds?: string | null } | null } | null };

export type AddProjectMemberMutationVariables = Exact<{
  input: AddProjectMemberInput;
}>;


export type AddProjectMemberMutation = { __typename?: 'Mutation', addProjectMember?: { __typename?: 'ProjectMember', id?: number | null, givenName?: string | null, surName?: string | null, email?: string | null, orcid?: string | null, affiliation?: { __typename?: 'Affiliation', id?: number | null, name: string, uri: string } | null, errors?: { __typename?: 'ProjectMemberErrors', email?: string | null, surName?: string | null, general?: string | null, givenName?: string | null, orcid?: string | null, memberRoleIds?: string | null } | null } | null };

export type AddProjectMutationVariables = Exact<{
  title: Scalars['String']['input'];
  isTestProject?: InputMaybe<Scalars['Boolean']['input']>;
}>;


export type AddProjectMutation = { __typename?: 'Mutation', addProject?: { __typename?: 'Project', id?: number | null, errors?: { __typename?: 'ProjectErrors', title?: string | null, general?: string | null } | null } | null };

export type UpdateProjectMutationVariables = Exact<{
  input: UpdateProjectInput;
}>;


export type UpdateProjectMutation = { __typename?: 'Mutation', updateProject?: { __typename?: 'Project', errors?: { __typename?: 'ProjectErrors', general?: string | null, title?: string | null, abstractText?: string | null, endDate?: string | null, startDate?: string | null, researchDomainId?: string | null } | null } | null };

export type MoveCustomQuestionMutationVariables = Exact<{
  input: MoveCustomQuestionInput;
}>;


export type MoveCustomQuestionMutation = { __typename?: 'Mutation', moveCustomQuestion: { __typename?: 'CustomQuestion', id?: number | null, guidanceText?: string | null, json?: string | null, migrationStatus: TemplateCustomizationMigrationStatus, modified?: string | null, pinnedQuestionId?: number | null, pinnedQuestionType?: CustomizableObjectOwnership | null, questionText?: string | null, required?: boolean | null, requirementText?: string | null, sampleText?: string | null, sectionId: number, sectionType: CustomizableObjectOwnership, templateCustomizationId: number, useSampleTextAsDefault?: boolean | null, errors?: { __typename?: 'CustomQuestionErrors', general?: string | null } | null } };

export type AddQuestionCustomizationMutationVariables = Exact<{
  input: AddQuestionCustomizationInput;
}>;


export type AddQuestionCustomizationMutation = { __typename?: 'Mutation', addQuestionCustomization: { __typename?: 'QuestionCustomization', id?: number | null, guidanceText?: string | null, migrationStatus?: TemplateCustomizationMigrationStatus | null, modified?: string | null, questionId: number, sampleText?: string | null, templateCustomizationId: number, errors?: { __typename?: 'QuestionCustomizationErrors', general?: string | null, guidanceText?: string | null, migrationStatus?: string | null, questionId?: string | null, sampleText?: string | null, templateCustomizationId?: string | null } | null, versionedQuestion?: { __typename?: 'VersionedQuestion', id?: number | null, guidanceText?: string | null, displayOrder?: number | null, modified?: string | null, questionId: number, ownerAffiliation?: { __typename?: 'Affiliation', displayName: string, id?: number | null } | null } | null } };

export type UpdateQuestionCustomizationMutationVariables = Exact<{
  input: UpdateQuestionCustomizationInput;
}>;


export type UpdateQuestionCustomizationMutation = { __typename?: 'Mutation', updateQuestionCustomization: { __typename?: 'QuestionCustomization', guidanceText?: string | null, id?: number | null, migrationStatus?: TemplateCustomizationMigrationStatus | null, modified?: string | null, questionId: number, sampleText?: string | null, templateCustomizationId: number, errors?: { __typename?: 'QuestionCustomizationErrors', general?: string | null, guidanceText?: string | null, migrationStatus?: string | null, questionId?: string | null, sampleText?: string | null, templateCustomizationId?: string | null } | null, versionedQuestion?: { __typename?: 'VersionedQuestion', id?: number | null, guidanceText?: string | null, ownerAffiliation?: { __typename?: 'Affiliation', displayName: string, id?: number | null } | null } | null } };

export type RemoveQuestionCustomizationMutationVariables = Exact<{
  questionCustomizationId: Scalars['Int']['input'];
}>;


export type RemoveQuestionCustomizationMutation = { __typename?: 'Mutation', removeQuestionCustomization: { __typename?: 'QuestionCustomization', id?: number | null, guidanceText?: string | null, migrationStatus?: TemplateCustomizationMigrationStatus | null, modified?: string | null, questionId: number, sampleText?: string | null, templateCustomizationId: number, versionedQuestion?: { __typename?: 'VersionedQuestion', id?: number | null, guidanceText?: string | null, json?: string | null, ownerAffiliation?: { __typename?: 'Affiliation', displayName: string, id?: number | null } | null } | null, errors?: { __typename?: 'QuestionCustomizationErrors', general?: string | null, guidanceText?: string | null, migrationStatus?: string | null, questionId?: string | null, sampleText?: string | null, templateCustomizationId?: string | null } | null } };

export type AddQuestionMutationVariables = Exact<{
  input: AddQuestionInput;
}>;


export type AddQuestionMutation = { __typename?: 'Mutation', addQuestion: { __typename?: 'Question', id?: number | null, displayOrder?: number | null, questionText?: string | null, json?: string | null, requirementText?: string | null, guidanceText?: string | null, sampleText?: string | null, useSampleTextAsDefault?: boolean | null, required?: boolean | null, errors?: { __typename?: 'QuestionErrors', general?: string | null, questionText?: string | null } | null } };

export type UpdateQuestionMutationVariables = Exact<{
  input: UpdateQuestionInput;
}>;


export type UpdateQuestionMutation = { __typename?: 'Mutation', updateQuestion: { __typename?: 'Question', id?: number | null, guidanceText?: string | null, isDirty?: boolean | null, required?: boolean | null, json?: string | null, requirementText?: string | null, sampleText?: string | null, useSampleTextAsDefault?: boolean | null, sectionId: number, templateId: number, questionText?: string | null, errors?: { __typename?: 'QuestionErrors', general?: string | null, questionText?: string | null } | null } };

export type RemoveQuestionMutationVariables = Exact<{
  questionId: Scalars['Int']['input'];
}>;


export type RemoveQuestionMutation = { __typename?: 'Mutation', removeQuestion?: { __typename?: 'Question', id?: number | null, errors?: { __typename?: 'QuestionErrors', general?: string | null, guidanceText?: string | null, json?: string | null, questionText?: string | null, requirementText?: string | null, sampleText?: string | null } | null } | null };

export type UpdateQuestionDisplayOrderMutationVariables = Exact<{
  questionId: Scalars['Int']['input'];
  newDisplayOrder: Scalars['Int']['input'];
}>;


export type UpdateQuestionDisplayOrderMutation = { __typename?: 'Mutation', updateQuestionDisplayOrder: { __typename?: 'ReorderQuestionsResult', questions?: Array<{ __typename?: 'Question', id?: number | null, displayOrder?: number | null, questionText?: string | null, sampleText?: string | null, requirementText?: string | null, guidanceText?: string | null, sectionId: number, templateId: number, errors?: { __typename?: 'QuestionErrors', general?: string | null } | null }> | null } };

export type UpdateRelatedWorkStatusMutationVariables = Exact<{
  input: UpdateRelatedWorkStatusInput;
}>;


export type UpdateRelatedWorkStatusMutation = { __typename?: 'Mutation', updateRelatedWorkStatus?: { __typename?: 'RelatedWorkSearchResult', id?: number | null, status: RelatedWorkStatus } | null };

export type UpsertRelatedWorkMutationVariables = Exact<{
  input: UpsertRelatedWorkInput;
}>;


export type UpsertRelatedWorkMutation = { __typename?: 'Mutation', upsertRelatedWork?: { __typename?: 'RelatedWorkSearchResult', id?: number | null, planId?: number | null, status: RelatedWorkStatus } | null };

export type AddRepositoryMutationVariables = Exact<{
  input?: InputMaybe<AddRepositoryInput>;
}>;


export type AddRepositoryMutation = { __typename?: 'Mutation', addRepository?: { __typename?: 'CustomRepository', id: string, name: string, keywords?: Array<string> | null, uri?: string | null, website?: string | null, description?: string | null, errors?: { __typename?: 'RepositoryErrors', general?: string | null, name?: string | null, description?: string | null, repositoryTypes?: string | null, website?: string | null } | null } | null };

export type MoveCustomSectionMutationVariables = Exact<{
  input: MoveCustomSectionInput;
}>;


export type MoveCustomSectionMutation = { __typename?: 'Mutation', moveCustomSection: { __typename?: 'CustomSection', id?: number | null, guidance?: string | null, introduction?: string | null, migrationStatus?: TemplateCustomizationMigrationStatus | null, name?: string | null, pinnedSectionId?: number | null, pinnedSectionType?: CustomizableObjectOwnership | null, requirements?: string | null, templateCustomizationId: number, modified?: string | null, modifiedById?: number | null, errors?: { __typename?: 'CustomSectionErrors', general?: string | null } | null } };

export type AddSectionCustomizationMutationVariables = Exact<{
  input: AddSectionCustomizationInput;
}>;


export type AddSectionCustomizationMutation = { __typename?: 'Mutation', addSectionCustomization: { __typename?: 'SectionCustomization', id?: number | null, guidance?: string | null, migrationStatus?: TemplateCustomizationMigrationStatus | null, modified?: string | null, sectionId: number, templateCustomizationId: number, versionedSection?: { __typename?: 'VersionedSection', id?: number | null, name: string } | null, errors?: { __typename?: 'SectionCustomizationErrors', general?: string | null, guidance?: string | null, migrationStatus?: string | null } | null } };

export type UpdateSectionCustomizationMutationVariables = Exact<{
  input: UpdateSectionCustomizationInput;
}>;


export type UpdateSectionCustomizationMutation = { __typename?: 'Mutation', updateSectionCustomization: { __typename?: 'SectionCustomization', id?: number | null, guidance?: string | null, migrationStatus?: TemplateCustomizationMigrationStatus | null, modified?: string | null, sectionId: number, templateCustomizationId: number, errors?: { __typename?: 'SectionCustomizationErrors', guidance?: string | null, general?: string | null, migrationStatus?: string | null, sectionId?: string | null, templateCustomizationId?: string | null } | null, versionedSection?: { __typename?: 'VersionedSection', id?: number | null, displayOrder: number, name: string } | null } };

export type RemoveSectionCustomizationMutationVariables = Exact<{
  sectionCustomizationId: Scalars['Int']['input'];
}>;


export type RemoveSectionCustomizationMutation = { __typename?: 'Mutation', removeSectionCustomization: { __typename?: 'SectionCustomization', id?: number | null, guidance?: string | null, migrationStatus?: TemplateCustomizationMigrationStatus | null, modified?: string | null, sectionId: number, templateCustomizationId: number, errors?: { __typename?: 'SectionCustomizationErrors', general?: string | null, guidance?: string | null, migrationStatus?: string | null, sectionId?: string | null, templateCustomizationId?: string | null } | null, versionedSection?: { __typename?: 'VersionedSection', id?: number | null, displayOrder: number, guidance?: string | null, introduction?: string | null, modified?: string | null, name: string, requirements?: string | null, errors?: { __typename?: 'VersionedSectionErrors', general?: string | null } | null, section?: { __typename?: 'Section', id?: number | null, displayOrder?: number | null, name: string } | null, versionedQuestions?: Array<{ __typename?: 'VersionedQuestion', id?: number | null, guidanceText?: string | null }> | null, versionedTemplate: { __typename?: 'VersionedTemplate', id?: number | null, description?: string | null, name: string } } | null } };

export type AddSectionMutationVariables = Exact<{
  input: AddSectionInput;
}>;


export type AddSectionMutation = { __typename?: 'Mutation', addSection: { __typename?: 'Section', id?: number | null, guidance?: string | null, displayOrder?: number | null, introduction?: string | null, isDirty: boolean, name: string, requirements?: string | null, tags?: Array<{ __typename?: 'Tag', name: string } | null> | null, errors?: { __typename?: 'SectionErrors', general?: string | null, name?: string | null, displayOrder?: string | null } | null, questions?: Array<{ __typename?: 'Question', id?: number | null, errors?: { __typename?: 'QuestionErrors', general?: string | null, templateId?: string | null, sectionId?: string | null, questionText?: string | null, displayOrder?: string | null } | null }> | null } };

export type UpdateSectionMutationVariables = Exact<{
  input: UpdateSectionInput;
}>;


export type UpdateSectionMutation = { __typename?: 'Mutation', updateSection: { __typename?: 'Section', id?: number | null, name: string, introduction?: string | null, requirements?: string | null, guidance?: string | null, displayOrder?: number | null, bestPractice?: boolean | null, errors?: { __typename?: 'SectionErrors', general?: string | null, name?: string | null, introduction?: string | null, requirements?: string | null, guidance?: string | null } | null, tags?: Array<{ __typename?: 'Tag', id?: number | null, description?: string | null, name: string } | null> | null } };

export type RemoveSectionMutationVariables = Exact<{
  sectionId: Scalars['Int']['input'];
}>;


export type RemoveSectionMutation = { __typename?: 'Mutation', removeSection: { __typename?: 'Section', id?: number | null, name: string } };

export type UpdateSectionDisplayOrderMutationVariables = Exact<{
  sectionId: Scalars['Int']['input'];
  newDisplayOrder: Scalars['Int']['input'];
}>;


export type UpdateSectionDisplayOrderMutation = { __typename?: 'Mutation', updateSectionDisplayOrder: { __typename?: 'ReorderSectionsResult', sections?: Array<{ __typename?: 'Section', id?: number | null, introduction?: string | null, name: string, requirements?: string | null, guidance?: string | null, displayOrder?: number | null, bestPractice?: boolean | null, isDirty: boolean, questions?: Array<{ __typename?: 'Question', displayOrder?: number | null, guidanceText?: string | null, id?: number | null, questionText?: string | null, sectionId: number, templateId: number, errors?: { __typename?: 'QuestionErrors', general?: string | null, templateId?: string | null, sectionId?: string | null, questionText?: string | null, displayOrder?: string | null } | null }> | null, tags?: Array<{ __typename?: 'Tag', id?: number | null, description?: string | null, name: string } | null> | null, errors?: { __typename?: 'SectionErrors', general?: string | null, name?: string | null, displayOrder?: string | null } | null, template?: { __typename?: 'Template', id?: number | null, bestPractice: boolean, isDirty: boolean, languageId: string, name: string, latestPublishVisibility?: TemplateVisibility | null } | null }> | null } };

export type AddTemplateCollaboratorMutationVariables = Exact<{
  templateId: Scalars['Int']['input'];
  email: Scalars['String']['input'];
}>;


export type AddTemplateCollaboratorMutation = { __typename?: 'Mutation', addTemplateCollaborator?: { __typename?: 'TemplateCollaborator', email: string, id?: number | null, errors?: { __typename?: 'TemplateCollaboratorErrors', general?: string | null, email?: string | null } | null } | null };

export type RemoveTemplateCollaboratorMutationVariables = Exact<{
  templateId: Scalars['Int']['input'];
  email: Scalars['String']['input'];
}>;


export type RemoveTemplateCollaboratorMutation = { __typename?: 'Mutation', removeTemplateCollaborator?: { __typename?: 'TemplateCollaborator', errors?: { __typename?: 'TemplateCollaboratorErrors', general?: string | null, email?: string | null } | null } | null };

export type AddTemplateCustomizationMutationVariables = Exact<{
  input: AddTemplateCustomizationInput;
}>;


export type AddTemplateCustomizationMutation = { __typename?: 'Mutation', addTemplateCustomization: { __typename?: 'TemplateCustomizationOverview', customizationId: number, customizationIsDirty: boolean, versionedTemplateId: number, versionedTemplateAffiliationId: string, customizationStatus: TemplateCustomizationStatus, customizationMigrationStatus: TemplateCustomizationMigrationStatus, errors?: { __typename?: 'TemplateCustomizationErrors', general?: string | null } | null } };

export type PublishTemplateCustomizationMutationVariables = Exact<{
  templateCustomizationId: Scalars['Int']['input'];
}>;


export type PublishTemplateCustomizationMutation = { __typename?: 'Mutation', publishTemplateCustomization: { __typename?: 'TemplateCustomizationOverview', customizationId: number, customizationIsDirty: boolean, customizationLastCustomized?: string | null, customizationLastCustomizedById?: number | null, customizationLastCustomizedByName?: string | null, customizationMigrationStatus: TemplateCustomizationMigrationStatus, customizationStatus: TemplateCustomizationStatus, versionedTemplateAffiliationId: string, versionedTemplateAffiliationName: string, versionedTemplateDescription?: string | null, versionedTemplateId: number, versionedTemplateLastModified: string, versionedTemplateName: string, versionedTemplateVersion: string, errors?: { __typename?: 'TemplateCustomizationErrors', affiliationId?: string | null, currentVersionedTemplateId?: string | null, general?: string | null, templateId?: string | null } | null, sections?: Array<{ __typename?: 'SectionCustomizationOverview', name: string, id: number, hasCustomGuidance?: boolean | null, displayOrder: number, sectionType: CustomizableObjectOwnership, migrationStatus?: TemplateCustomizationMigrationStatus | null, questions?: Array<{ __typename?: 'QuestionCustomizationOverview', id: number, hasCustomSampleAnswer?: boolean | null, displayOrder: number, hasCustomGuidance?: boolean | null, questionText: string, migrationStatus?: TemplateCustomizationMigrationStatus | null, questionType: CustomizableObjectOwnership }> | null }> | null } };

export type UnpublishTemplateCustomizationMutationVariables = Exact<{
  templateCustomizationId: Scalars['Int']['input'];
}>;


export type UnpublishTemplateCustomizationMutation = { __typename?: 'Mutation', unpublishTemplateCustomization: { __typename?: 'TemplateCustomizationOverview', customizationId: number, customizationIsDirty: boolean, customizationLastCustomized?: string | null, customizationLastCustomizedById?: number | null, customizationLastCustomizedByName?: string | null, customizationLastPublishedDate?: string | null, customizationMigrationStatus: TemplateCustomizationMigrationStatus, customizationStatus: TemplateCustomizationStatus, versionedTemplateAffiliationId: string, versionedTemplateAffiliationName: string, versionedTemplateDescription?: string | null, versionedTemplateId: number, versionedTemplateLastModified: string, versionedTemplateName: string, versionedTemplateVersion: string, errors?: { __typename?: 'TemplateCustomizationErrors', affiliationId?: string | null, currentVersionedTemplateId?: string | null, general?: string | null, templateId?: string | null } | null, sections?: Array<{ __typename?: 'SectionCustomizationOverview', id: number, hasCustomGuidance?: boolean | null, name: string, migrationStatus?: TemplateCustomizationMigrationStatus | null, sectionCustomizationId?: number | null, sectionType: CustomizableObjectOwnership, questions?: Array<{ __typename?: 'QuestionCustomizationOverview', id: number, hasCustomSampleAnswer?: boolean | null, hasCustomGuidance?: boolean | null, displayOrder: number, questionCustomizationId?: number | null, questionText: string, questionType: CustomizableObjectOwnership }> | null }> | null } };

export type RemoveTemplateCustomizationMutationVariables = Exact<{
  templateCustomizationId: Scalars['Int']['input'];
}>;


export type RemoveTemplateCustomizationMutation = { __typename?: 'Mutation', removeTemplateCustomization: { __typename?: 'TemplateCustomization', id?: number | null, currentVersionedTemplateId: number, affiliationId: string, isDirty: boolean, latestPublishedDate?: string | null, migrationStatus: TemplateCustomizationMigrationStatus, modified?: string | null, status: TemplateCustomizationStatus, errors?: { __typename?: 'TemplateCustomizationErrors', affiliationId?: string | null, currentVersionedTemplateId?: string | null, general?: string | null, templateId?: string | null } | null } };

export type ArchiveTemplateMutationVariables = Exact<{
  templateId: Scalars['Int']['input'];
}>;


export type ArchiveTemplateMutation = { __typename?: 'Mutation', archiveTemplate?: { __typename?: 'Template', id?: number | null, name: string, errors?: { __typename?: 'TemplateErrors', general?: string | null, name?: string | null, ownerId?: string | null } | null } | null };

export type CreateTemplateVersionMutationVariables = Exact<{
  templateId: Scalars['Int']['input'];
  comment?: InputMaybe<Scalars['String']['input']>;
  versionType?: InputMaybe<TemplateVersionType>;
  latestPublishVisibility: TemplateVisibility;
}>;


export type CreateTemplateVersionMutation = { __typename?: 'Mutation', createTemplateVersion?: { __typename?: 'Template', name: string, errors?: { __typename?: 'TemplateErrors', general?: string | null, name?: string | null, ownerId?: string | null } | null } | null };

export type AddTemplateMutationVariables = Exact<{
  name: Scalars['String']['input'];
  copyFromTemplateId?: InputMaybe<Scalars['Int']['input']>;
  copyFromVersionedTemplateId?: InputMaybe<Scalars['Int']['input']>;
}>;


export type AddTemplateMutation = { __typename?: 'Mutation', addTemplate?: { __typename?: 'Template', id?: number | null, description?: string | null, name: string, errors?: { __typename?: 'TemplateErrors', general?: string | null, name?: string | null, ownerId?: string | null } | null } | null };

export type UpdateTemplateMutationVariables = Exact<{
  templateId: Scalars['Int']['input'];
  name: Scalars['String']['input'];
}>;


export type UpdateTemplateMutation = { __typename?: 'Mutation', updateTemplate?: { __typename?: 'Template', id?: number | null, name: string, latestPublishVisibility?: TemplateVisibility | null, errors?: { __typename?: 'TemplateErrors', general?: string | null, name?: string | null, description?: string | null } | null } | null };

export type UpdateUserProfileMutationVariables = Exact<{
  input: UpdateUserProfileInput;
}>;


export type UpdateUserProfileMutation = { __typename?: 'Mutation', updateUserProfile?: { __typename?: 'User', id?: number | null, givenName?: string | null, surName?: string | null, languageId: string, email?: string | null, errors?: { __typename?: 'UserErrors', general?: string | null, email?: string | null, password?: string | null, role?: string | null } | null, affiliation?: { __typename?: 'Affiliation', id?: number | null, name: string, searchName: string, uri: string } | null } | null };

export type AddUserEmailMutationVariables = Exact<{
  email: Scalars['String']['input'];
  isPrimary: Scalars['Boolean']['input'];
}>;


export type AddUserEmailMutation = { __typename?: 'Mutation', addUserEmail?: { __typename?: 'UserEmail', email: string, isPrimary: boolean, isConfirmed: boolean, id?: number | null, userId: number, errors?: { __typename?: 'UserEmailErrors', general?: string | null, userId?: string | null, email?: string | null } | null } | null };

export type RemoveUserEmailMutationVariables = Exact<{
  email: Scalars['String']['input'];
}>;


export type RemoveUserEmailMutation = { __typename?: 'Mutation', removeUserEmail?: { __typename?: 'UserEmail', errors?: { __typename?: 'UserEmailErrors', general?: string | null, userId?: string | null, email?: string | null } | null } | null };

export type SetPrimaryUserEmailMutationVariables = Exact<{
  email: Scalars['String']['input'];
}>;


export type SetPrimaryUserEmailMutation = { __typename?: 'Mutation', setPrimaryUserEmail?: Array<{ __typename?: 'UserEmail', id?: number | null, email: string, isConfirmed: boolean, isPrimary: boolean, userId: number, errors?: { __typename?: 'UserEmailErrors', general?: string | null, userId?: string | null, email?: string | null } | null } | null> | null };

export type AffiliationsQueryVariables = Exact<{
  name: Scalars['String']['input'];
}>;


export type AffiliationsQuery = { __typename?: 'Query', affiliations?: { __typename?: 'AffiliationSearchResults', totalCount?: number | null, nextCursor?: string | null, items?: Array<{ __typename?: 'AffiliationSearch', id: number, displayName: string, uri: string, apiTarget?: string | null } | null> | null } | null };

export type AffiliationFundersQueryVariables = Exact<{
  name: Scalars['String']['input'];
  funderOnly?: InputMaybe<Scalars['Boolean']['input']>;
  paginationOptions?: InputMaybe<PaginationOptions>;
}>;


export type AffiliationFundersQuery = { __typename?: 'Query', affiliations?: { __typename?: 'AffiliationSearchResults', totalCount?: number | null, nextCursor?: string | null, items?: Array<{ __typename?: 'AffiliationSearch', id: number, displayName: string, apiTarget?: string | null, uri: string } | null> | null } | null };

export type ManagedAffiliationsWithGuidanceQueryVariables = Exact<{
  name?: InputMaybe<Scalars['String']['input']>;
  versionedTemplateId: Scalars['Int']['input'];
  paginationOptions?: InputMaybe<PaginationOptions>;
}>;


export type ManagedAffiliationsWithGuidanceQuery = { __typename?: 'Query', managedAffiliationsWithGuidance?: { __typename?: 'AffiliationSearchResults', limit?: number | null, totalCount?: number | null, hasNextPage?: boolean | null, hasPreviousPage?: boolean | null, nextCursor?: string | null, items?: Array<{ __typename?: 'AffiliationSearch', id: number, funder: boolean, displayName: string, uri: string, acronyms?: Array<string> | null } | null> | null } | null };

export type AffiliationByIdQueryVariables = Exact<{
  affiliationId: Scalars['Int']['input'];
}>;


export type AffiliationByIdQuery = { __typename?: 'Query', affiliationById?: { __typename?: 'Affiliation', feedbackEmails?: Array<string> | null, feedbackEnabled: boolean, feedbackMessage?: string | null, displayName: string, name: string, id?: number | null } | null };

export type AnswerByVersionedQuestionIdQueryVariables = Exact<{
  projectId: Scalars['Int']['input'];
  planId: Scalars['Int']['input'];
  versionedQuestionId?: InputMaybe<Scalars['Int']['input']>;
  versionedCustomQuestionId?: InputMaybe<Scalars['Int']['input']>;
}>;


export type AnswerByVersionedQuestionIdQuery = { __typename?: 'Query', answerByVersionedQuestionId?: { __typename?: 'Answer', id?: number | null, json?: string | null, modified?: string | null, created?: string | null, versionedQuestion?: { __typename?: 'VersionedQuestion', id?: number | null } | null, plan?: { __typename?: 'Plan', id?: number | null } | null, comments?: Array<{ __typename?: 'AnswerComment', id?: number | null, commentText: string, answerId: number, created?: string | null, createdById?: number | null, modified?: string | null, user?: { __typename?: 'User', id?: number | null, surName?: string | null, givenName?: string | null } | null }> | null, feedbackComments?: Array<{ __typename?: 'PlanFeedbackComment', id?: number | null, commentText?: string | null, created?: string | null, createdById?: number | null, answerId?: number | null, modified?: string | null, PlanFeedback?: { __typename?: 'PlanFeedback', id?: number | null } | null, user?: { __typename?: 'User', id?: number | null, surName?: string | null, givenName?: string | null } | null }> | null, errors?: { __typename?: 'AffiliationErrors', general?: string | null, planId?: string | null, versionedSectionId?: string | null, versionedQuestionId?: string | null, json?: string | null } | null } | null };

export type ProjectCollaboratorsQueryVariables = Exact<{
  projectId: Scalars['Int']['input'];
}>;


export type ProjectCollaboratorsQuery = { __typename?: 'Query', projectCollaborators?: Array<{ __typename?: 'ProjectCollaborator', id?: number | null, accessLevel?: ProjectCollaboratorAccessLevel | null, created?: string | null, email: string, errors?: { __typename?: 'ProjectCollaboratorErrors', accessLevel?: string | null, email?: string | null, general?: string | null, invitedById?: string | null, planId?: string | null, userId?: string | null } | null, user?: { __typename?: 'User', id?: number | null, givenName?: string | null, surName?: string | null, email?: string | null } | null } | null> | null };

export type FindCollaboratorQueryVariables = Exact<{
  term: Scalars['String']['input'];
  options?: InputMaybe<PaginationOptions>;
}>;


export type FindCollaboratorQuery = { __typename?: 'Query', findCollaborator?: { __typename?: 'CollaboratorSearchResults', limit?: number | null, availableSortFields?: Array<string | null> | null, nextCursor?: string | null, totalCount?: number | null, items?: Array<{ __typename?: 'CollaboratorSearchResult', id?: number | null, givenName?: string | null, email?: string | null, affiliationId?: string | null, affiliationRORId?: string | null, affiliationURL?: string | null, orcid?: string | null, surName?: string | null, affiliationName?: string | null } | null> | null } | null };

export type CustomQuestionQueryVariables = Exact<{
  customQuestionId: Scalars['Int']['input'];
}>;


export type CustomQuestionQuery = { __typename?: 'Query', customQuestion?: { __typename?: 'CustomQuestion', id?: number | null, json?: string | null, modified?: string | null, sampleText?: string | null, requirementText?: string | null, questionText?: string | null, guidanceText?: string | null, migrationStatus: TemplateCustomizationMigrationStatus, pinnedQuestionId?: number | null, pinnedQuestionType?: CustomizableObjectOwnership | null, required?: boolean | null, sectionId: number, sectionType: CustomizableObjectOwnership, templateCustomizationId: number, useSampleTextAsDefault?: boolean | null, errors?: { __typename?: 'CustomQuestionErrors', general?: string | null, guidanceText?: string | null, json?: string | null, migrationStatus?: string | null, pinnedQuestionId?: string | null, pinnedQuestionType?: string | null, questionText?: string | null, required?: string | null, requirementText?: string | null, sampleText?: string | null, sectionId?: string | null, sectionType?: string | null, templateCustomizationId?: string | null, useSampleTextAsDefault?: string | null } | null } | null };

export type CustomSectionQueryVariables = Exact<{
  customSectionId: Scalars['Int']['input'];
}>;


export type CustomSectionQuery = { __typename?: 'Query', customSection?: { __typename?: 'CustomSection', guidance?: string | null, id?: number | null, introduction?: string | null, migrationStatus?: TemplateCustomizationMigrationStatus | null, modified?: string | null, name?: string | null, pinnedSectionId?: number | null, pinnedSectionType?: CustomizableObjectOwnership | null, requirements?: string | null, templateCustomizationId: number, errors?: { __typename?: 'CustomSectionErrors', general?: string | null, guidance?: string | null, introduction?: string | null, name?: string | null, requirements?: string | null } | null } | null };

export type ProjectFundingsQueryVariables = Exact<{
  projectId: Scalars['Int']['input'];
}>;


export type ProjectFundingsQuery = { __typename?: 'Query', projectFundings?: Array<{ __typename?: 'ProjectFunding', id?: number | null, status?: ProjectFundingStatus | null, grantId?: string | null, funderOpportunityNumber?: string | null, funderProjectNumber?: string | null, affiliation?: { __typename?: 'Affiliation', displayName: string, uri: string } | null } | null> | null };

export type PlanFundingsQueryVariables = Exact<{
  planId: Scalars['Int']['input'];
}>;


export type PlanFundingsQuery = { __typename?: 'Query', planFundings?: Array<{ __typename?: 'PlanFunding', id?: number | null, projectFunding?: { __typename?: 'ProjectFunding', id?: number | null } | null } | null> | null };

export type PopularFundersQueryVariables = Exact<{ [key: string]: never; }>;


export type PopularFundersQuery = { __typename?: 'Query', popularFunders?: Array<{ __typename?: 'FunderPopularityResult', displayName: string, id: number, nbrPlans: number, uri: string, apiTarget?: string | null } | null> | null };

export type GuidanceByGroupQueryVariables = Exact<{
  guidanceGroupId: Scalars['Int']['input'];
}>;


export type GuidanceByGroupQuery = { __typename?: 'Query', guidanceByGroup: Array<{ __typename?: 'Guidance', guidanceText?: string | null, id?: number | null, tagId?: number | null, modified?: string | null, modifiedBy?: { __typename?: 'User', givenName?: string | null, surName?: string | null, id?: number | null } | null, errors?: { __typename?: 'GuidanceErrors', general?: string | null, tagId?: string | null, guidanceText?: string | null, guidanceGroupId?: string | null } | null }> };

export type GuidanceQueryVariables = Exact<{
  guidanceId: Scalars['Int']['input'];
}>;


export type GuidanceQuery = { __typename?: 'Query', guidance?: { __typename?: 'Guidance', id?: number | null, guidanceText?: string | null, tagId?: number | null } | null };

export type GuidanceSourcesForPlanQueryVariables = Exact<{
  planId: Scalars['Int']['input'];
  versionedSectionId?: InputMaybe<Scalars['Int']['input']>;
  versionedQuestionId?: InputMaybe<Scalars['Int']['input']>;
  customSectionId?: InputMaybe<Scalars['Int']['input']>;
  customQuestionId?: InputMaybe<Scalars['Int']['input']>;
}>;


export type GuidanceSourcesForPlanQuery = { __typename?: 'Query', guidanceSourcesForPlan: Array<{ __typename?: 'GuidanceSource', id: string, type: GuidanceSourceType, label: string, shortName: string, orgURI: string, hasGuidance: boolean, items: Array<{ __typename?: 'GuidanceItem', id?: number | null, title?: string | null, guidanceText: string }> }> };

export type GuidanceGroupsQueryVariables = Exact<{
  affiliationId?: InputMaybe<Scalars['String']['input']>;
}>;


export type GuidanceGroupsQuery = { __typename?: 'Query', guidanceGroups: Array<{ __typename?: 'GuidanceGroup', id?: number | null, affiliationId: string, name: string, description?: string | null, latestPublishedVersion?: string | null, latestPublishedDate?: string | null, modified?: string | null, isDirty: boolean, guidance?: Array<{ __typename?: 'Guidance', tagId?: number | null, guidanceText?: string | null, id?: number | null }> | null, modifiedBy?: { __typename?: 'User', givenName?: string | null, surName?: string | null, id?: number | null } | null, versionedGuidanceGroup?: Array<{ __typename?: 'VersionedGuidanceGroup', active: boolean, id?: number | null, version?: number | null } | null> | null }> };

export type GuidanceGroupQueryVariables = Exact<{
  guidanceGroupId: Scalars['Int']['input'];
}>;


export type GuidanceGroupQuery = { __typename?: 'Query', guidanceGroup?: { __typename?: 'GuidanceGroup', id?: number | null, name: string, description?: string | null, bestPractice: boolean, latestPublishedVersion?: string | null, latestPublishedDate?: string | null, isDirty: boolean, optionalSubset: boolean, guidance?: Array<{ __typename?: 'Guidance', guidanceText?: string | null, id?: number | null, tagId?: number | null }> | null, versionedGuidanceGroup?: Array<{ __typename?: 'VersionedGuidanceGroup', active: boolean, id?: number | null, version?: number | null } | null> | null } | null };

export type LanguagesQueryVariables = Exact<{ [key: string]: never; }>;


export type LanguagesQuery = { __typename?: 'Query', languages?: Array<{ __typename?: 'Language', id: string, isDefault: boolean, name: string } | null> | null };

export type RecommendedLicensesQueryVariables = Exact<{
  recommended: Scalars['Boolean']['input'];
}>;


export type RecommendedLicensesQuery = { __typename?: 'Query', recommendedLicenses?: Array<{ __typename?: 'License', name: string, id?: number | null, uri: string } | null> | null };

export type LicensesQueryVariables = Exact<{ [key: string]: never; }>;


export type LicensesQuery = { __typename?: 'Query', licenses?: Array<{ __typename?: 'License', id?: number | null, name: string, uri: string, recommended: boolean } | null> | null };

export type MemberRolesQueryVariables = Exact<{ [key: string]: never; }>;


export type MemberRolesQuery = { __typename?: 'Query', memberRoles?: Array<{ __typename?: 'MemberRole', id?: number | null, label: string, uri: string, description?: string | null, displayOrder: number } | null> | null };

export type MetadataStandardsQueryVariables = Exact<{
  term?: InputMaybe<Scalars['String']['input']>;
  researchDomainId?: InputMaybe<Scalars['Int']['input']>;
  paginationOptions?: InputMaybe<PaginationOptions>;
}>;


export type MetadataStandardsQuery = { __typename?: 'Query', metadataStandards?: { __typename?: 'MetadataStandardSearchResults', hasNextPage?: boolean | null, currentOffset?: number | null, hasPreviousPage?: boolean | null, limit?: number | null, nextCursor?: string | null, totalCount?: number | null, availableSortFields?: Array<string | null> | null, items?: Array<{ __typename?: 'MetadataStandard', id?: number | null, name: string, uri: string, description?: string | null, keywords?: Array<string> | null, errors?: { __typename?: 'MetadataStandardErrors', general?: string | null, description?: string | null, name?: string | null, uri?: string | null, keywords?: string | null, researchDomainIds?: string | null } | null } | null> | null } | null };

export type MetadataStandardsByUrIsQueryVariables = Exact<{
  uris: Array<Scalars['String']['input']> | Scalars['String']['input'];
}>;


export type MetadataStandardsByUrIsQuery = { __typename?: 'Query', metadataStandardsByURIs?: Array<{ __typename?: 'MetadataStandard', id?: number | null, name: string, uri: string, description?: string | null, keywords?: Array<string> | null, errors?: { __typename?: 'MetadataStandardErrors', general?: string | null, description?: string | null, name?: string | null, uri?: string | null, keywords?: string | null, researchDomainIds?: string | null } | null }> | null };

export type PlanQueryVariables = Exact<{
  planId: Scalars['Int']['input'];
}>;


export type PlanQuery = { __typename?: 'Query', plan?: { __typename?: 'Plan', id?: number | null, visibility?: PlanVisibility | null, status?: PlanStatus | null, created?: string | null, createdById?: number | null, modified?: string | null, dmpId?: string | null, registered?: string | null, title?: string | null, readOnly: boolean, versionedTemplate?: { __typename?: 'VersionedTemplate', id?: number | null, name: string, version: string, created?: string | null, template?: { __typename?: 'Template', id?: number | null, name: string } | null, owner?: { __typename?: 'Affiliation', uri: string, name: string, acronyms?: Array<string> | null, displayName: string } | null } | null, fundings?: Array<{ __typename?: 'PlanFunding', id?: number | null, projectFunding?: { __typename?: 'ProjectFunding', affiliation?: { __typename?: 'Affiliation', displayName: string } | null } | null }> | null, project?: { __typename?: 'Project', title: string, fundings?: Array<{ __typename?: 'ProjectFunding', funderOpportunityNumber?: string | null, affiliation?: { __typename?: 'Affiliation', displayName: string, name: string } | null }> | null, collaborators?: Array<{ __typename?: 'ProjectCollaborator', accessLevel?: ProjectCollaboratorAccessLevel | null, user?: { __typename?: 'User', id?: number | null } | null }> | null } | null, members?: Array<{ __typename?: 'PlanMember', isPrimaryContact?: boolean | null, projectMember?: { __typename?: 'ProjectMember', givenName?: string | null, surName?: string | null, email?: string | null, orcid?: string | null, memberRoles?: Array<{ __typename?: 'MemberRole', label: string }> | null } | null }> | null, versionedSections?: Array<{ __typename?: 'PlanSectionProgress', answeredQuestions: number, displayOrder: number, versionedSectionId?: number | null, title: string, totalQuestions: number, sectionType: CustomizableObjectOwnership, customSectionId?: number | null, tags?: Array<{ __typename?: 'Tag', name: string, slug: string, id?: number | null, description?: string | null }> | null }> | null, progress?: { __typename?: 'PlanProgress', answeredQuestions: number, percentComplete: number, totalQuestions: number } | null, feedback?: Array<{ __typename?: 'PlanFeedback', id?: number | null, completed?: string | null }> | null, feedbackStatus?: { __typename?: 'PlanFeedbackStatus', id?: number | null, status?: PlanFeedbackStatusEnum | null } | null, planCreator?: { __typename?: 'User', id?: number | null, affiliation?: { __typename?: 'Affiliation', uri: string } | null } | null } | null };

export type PlanFeedbackStatusQueryVariables = Exact<{
  planId: Scalars['Int']['input'];
}>;


export type PlanFeedbackStatusQuery = { __typename?: 'Query', planFeedbackStatus?: { __typename?: 'PlanFeedbackStatus', id?: number | null, status?: PlanFeedbackStatusEnum | null } | null };

export type PlanMembersQueryVariables = Exact<{
  planId: Scalars['Int']['input'];
}>;


export type PlanMembersQuery = { __typename?: 'Query', planMembers?: Array<{ __typename?: 'PlanMember', id?: number | null, isPrimaryContact?: boolean | null, errors?: { __typename?: 'PlanMemberErrors', general?: string | null } | null, projectMember?: { __typename?: 'ProjectMember', id?: number | null, givenName?: string | null, surName?: string | null } | null, memberRoles?: Array<{ __typename?: 'MemberRole', uri: string, id?: number | null, label: string, description?: string | null, displayOrder: number }> | null } | null> | null };

export type ProjectFundingQueryVariables = Exact<{
  projectFundingId: Scalars['Int']['input'];
}>;


export type ProjectFundingQuery = { __typename?: 'Query', projectFunding?: { __typename?: 'ProjectFunding', status?: ProjectFundingStatus | null, grantId?: string | null, funderOpportunityNumber?: string | null, funderProjectNumber?: string | null, affiliation?: { __typename?: 'Affiliation', name: string, displayName: string, uri: string } | null } | null };

export type ProjectMembersQueryVariables = Exact<{
  projectId: Scalars['Int']['input'];
}>;


export type ProjectMembersQuery = { __typename?: 'Query', projectMembers?: Array<{ __typename?: 'ProjectMember', id?: number | null, givenName?: string | null, surName?: string | null, orcid?: string | null, memberRoles?: Array<{ __typename?: 'MemberRole', id?: number | null, label: string, description?: string | null }> | null, affiliation?: { __typename?: 'Affiliation', displayName: string } | null } | null> | null };

export type ProjectMemberQueryVariables = Exact<{
  projectMemberId: Scalars['Int']['input'];
}>;


export type ProjectMemberQuery = { __typename?: 'Query', projectMember?: { __typename?: 'ProjectMember', email?: string | null, givenName?: string | null, surName?: string | null, orcid?: string | null, memberRoles?: Array<{ __typename?: 'MemberRole', id?: number | null, label: string, displayOrder: number, uri: string }> | null, affiliation?: { __typename?: 'Affiliation', id?: number | null, displayName: string, uri: string } | null } | null };

export type MyProjectsQueryVariables = Exact<{
  term?: InputMaybe<Scalars['String']['input']>;
  paginationOptions?: InputMaybe<PaginationOptions>;
}>;


export type MyProjectsQuery = { __typename?: 'Query', myProjects?: { __typename?: 'ProjectSearchResults', totalCount?: number | null, nextCursor?: string | null, items?: Array<{ __typename?: 'ProjectSearchResult', title?: string | null, id?: number | null, startDate?: string | null, endDate?: string | null, fundings?: Array<{ __typename?: 'ProjectSearchResultFunding', name?: string | null, grantId?: string | null }> | null, members?: Array<{ __typename?: 'ProjectSearchResultMember', name?: string | null, role?: string | null, orcid?: string | null }> | null, errors?: { __typename?: 'ProjectErrors', general?: string | null, title?: string | null } | null } | null> | null } | null };

export type ProjectQueryVariables = Exact<{
  projectId: Scalars['Int']['input'];
}>;


export type ProjectQuery = { __typename?: 'Query', project?: { __typename?: 'Project', title: string, abstractText?: string | null, startDate?: string | null, endDate?: string | null, isTestProject?: boolean | null, fundings?: Array<{ __typename?: 'ProjectFunding', id?: number | null, grantId?: string | null, affiliation?: { __typename?: 'Affiliation', name: string, displayName: string, searchName: string } | null }> | null, members?: Array<{ __typename?: 'ProjectMember', givenName?: string | null, surName?: string | null, email?: string | null, memberRoles?: Array<{ __typename?: 'MemberRole', description?: string | null, displayOrder: number, label: string, uri: string }> | null }> | null, researchDomain?: { __typename?: 'ResearchDomain', id?: number | null, parentResearchDomainId?: number | null } | null, plans?: Array<{ __typename?: 'PlanSearchResult', title?: string | null, templateTitle?: string | null, id?: number | null, funding?: string | null, dmpId?: string | null, registered?: string | null, modified?: string | null, created?: string | null, versionedSections?: Array<{ __typename?: 'PlanSectionProgress', sectionType: CustomizableObjectOwnership, customSectionId?: number | null, answeredQuestions: number, displayOrder: number, versionedSectionId?: number | null, title: string, totalQuestions: number }> | null }> | null } | null };

export type ProjectFundingsApiQueryVariables = Exact<{
  projectId: Scalars['Int']['input'];
}>;


export type ProjectFundingsApiQuery = { __typename?: 'Query', project?: { __typename?: 'Project', fundings?: Array<{ __typename?: 'ProjectFunding', affiliation?: { __typename?: 'Affiliation', apiTarget?: string | null } | null }> | null } | null };

export type QuestionCustomizationByVersionedQuestionQueryVariables = Exact<{
  templateCustomizationId: Scalars['Int']['input'];
  versionedQuestionId: Scalars['Int']['input'];
}>;


export type QuestionCustomizationByVersionedQuestionQuery = { __typename?: 'Query', questionCustomizationByVersionedQuestion?: { __typename?: 'QuestionCustomization', id?: number | null, guidanceText?: string | null, migrationStatus?: TemplateCustomizationMigrationStatus | null, modified?: string | null, questionId: number, sampleText?: string | null, templateCustomizationId: number, errors?: { __typename?: 'QuestionCustomizationErrors', general?: string | null, guidanceText?: string | null, migrationStatus?: string | null, questionId?: string | null, sampleText?: string | null, templateCustomizationId?: string | null } | null, versionedQuestion?: { __typename?: 'VersionedQuestion', id?: number | null, guidanceText?: string | null, questionText?: string | null, requirementText?: string | null, required?: boolean | null, sampleText?: string | null, ownerAffiliation?: { __typename?: 'Affiliation', displayName: string, id?: number | null } | null } | null } | null };

export type QuestionsDisplayOrderQueryVariables = Exact<{
  sectionId: Scalars['Int']['input'];
}>;


export type QuestionsDisplayOrderQuery = { __typename?: 'Query', questions?: Array<{ __typename?: 'Question', displayOrder?: number | null } | null> | null };

export type PlanSectionQuestionsQueryVariables = Exact<{
  sectionId: Scalars['Int']['input'];
}>;


export type PlanSectionQuestionsQuery = { __typename?: 'Query', questions?: Array<{ __typename?: 'Question', id?: number | null, questionText?: string | null, displayOrder?: number | null, guidanceText?: string | null, requirementText?: string | null, sampleText?: string | null, sectionId: number, templateId: number, isDirty?: boolean | null } | null> | null };

export type QuestionQueryVariables = Exact<{
  questionId: Scalars['Int']['input'];
}>;


export type QuestionQuery = { __typename?: 'Query', question?: { __typename?: 'Question', id?: number | null, guidanceText?: string | null, displayOrder?: number | null, questionText?: string | null, json?: string | null, requirementText?: string | null, sampleText?: string | null, useSampleTextAsDefault?: boolean | null, sectionId: number, templateId: number, isDirty?: boolean | null, required?: boolean | null, errors?: { __typename?: 'QuestionErrors', general?: string | null, questionText?: string | null, requirementText?: string | null, sampleText?: string | null, displayOrder?: string | null, questionConditionIds?: string | null, sectionId?: string | null, templateId?: string | null } | null } | null };

export type PublishedQuestionsQueryVariables = Exact<{
  planId: Scalars['Int']['input'];
  versionedSectionId: Scalars['Int']['input'];
}>;


export type PublishedQuestionsQuery = { __typename?: 'Query', publishedQuestions?: Array<{ __typename?: 'PublishedQuestion', id?: number | null, questionText?: string | null, guidanceText?: string | null, requirementText?: string | null, sampleText?: string | null, useSampleTextAsDefault?: boolean | null, required?: boolean | null, hasAnswer?: boolean | null, questionType?: string | null, versionedQuestionId?: number | null, customQuestionId?: number | null, json?: string | null } | null> | null };

export type PublishedCustomQuestionsQueryVariables = Exact<{
  planId: Scalars['Int']['input'];
  versionedCustomSectionId: Scalars['Int']['input'];
}>;


export type PublishedCustomQuestionsQuery = { __typename?: 'Query', publishedCustomQuestions?: Array<{ __typename?: 'PublishedQuestion', id?: number | null, questionText?: string | null, guidanceText?: string | null, requirementText?: string | null, sampleText?: string | null, useSampleTextAsDefault?: boolean | null, required?: boolean | null, hasAnswer?: boolean | null, questionType?: string | null, versionedQuestionId?: number | null, customQuestionId?: number | null, json?: string | null } | null> | null };

export type PublishedQuestionQueryVariables = Exact<{
  versionedQuestionId: Scalars['Int']['input'];
}>;


export type PublishedQuestionQuery = { __typename?: 'Query', publishedQuestion?: { __typename?: 'VersionedQuestion', id?: number | null, guidanceText?: string | null, displayOrder?: number | null, questionText?: string | null, json?: string | null, requirementText?: string | null, sampleText?: string | null, useSampleTextAsDefault?: boolean | null, versionedSectionId: number, versionedTemplateId: number, required?: boolean | null, customizationSampleText?: string | null, customizationId?: number | null, customizationGuidanceText?: string | null, errors?: { __typename?: 'VersionedQuestionErrors', general?: string | null, questionText?: string | null, requirementText?: string | null, sampleText?: string | null, displayOrder?: string | null, versionedSectionId?: string | null } | null, ownerAffiliation?: { __typename?: 'Affiliation', acronyms?: Array<string> | null, displayName: string, uri: string, name: string, id?: number | null } | null, customizationOwnerAffiliation?: { __typename?: 'Affiliation', name: string, id?: number | null, uri: string, displayName: string } | null } | null };

export type PublishedCustomQuestionQueryVariables = Exact<{
  versionedCustomQuestionId: Scalars['Int']['input'];
}>;


export type PublishedCustomQuestionQuery = { __typename?: 'Query', publishedCustomQuestion?: { __typename?: 'VersionedCustomQuestion', id?: number | null, guidanceText?: string | null, pinnedVersionedQuestionType?: string | null, pinnedVersionedQuestionId?: number | null, questionText: string, json: string, requirementText?: string | null, sampleText?: string | null, useSampleTextAsDefault?: boolean | null, versionedSectionId: number, versionedSectionType: string, versionedTemplateCustomizationId: number, required?: boolean | null, errors?: { __typename?: 'VersionedCustomQuestionErrors', questionText?: string | null, general?: string | null, json?: string | null } | null, ownerAffiliation?: { __typename?: 'Affiliation', id?: number | null, name: string, displayName: string, acronyms?: Array<string> | null, uri: string } | null } | null };

export type RelatedWorksQueryVariables = Exact<{
  id: Scalars['Int']['input'];
  idType: RelatedWorksIdentifierType;
  paginationOptions?: InputMaybe<PaginationOptions>;
  filterOptions?: InputMaybe<RelatedWorksFilterOptions>;
}>;


export type RelatedWorksQuery = { __typename?: 'Query', relatedWorks?: { __typename?: 'RelatedWorkSearchResults', totalCount?: number | null, limit?: number | null, currentOffset?: number | null, hasNextPage?: boolean | null, hasPreviousPage?: boolean | null, availableSortFields?: Array<string | null> | null, statusOnlyCount?: number | null, items?: Array<{ __typename?: 'RelatedWorkSearchResult', id?: number | null, projectId?: number | null, planId?: number | null, planTitle?: string | null, scoreNorm?: number | null, confidence?: RelatedWorkConfidence | null, status: RelatedWorkStatus, created?: string | null, modified?: string | null, workVersion: { __typename?: 'WorkVersion', id: number, hash: any, workType: WorkType, publicationDate?: string | null, title?: string | null, publicationVenue?: string | null, sourceName: string, sourceUrl?: string | null, work: { __typename?: 'Work', id: number, doi: string }, authors: Array<{ __typename?: 'Author', orcid?: string | null, firstInitial?: string | null, givenName?: string | null, middleInitials?: string | null, middleNames?: string | null, surname?: string | null, full?: string | null }>, institutions: Array<{ __typename?: 'Institution', name?: string | null, ror?: string | null }>, funders: Array<{ __typename?: 'Funder', name?: string | null, ror?: string | null }>, awards: Array<{ __typename?: 'Award', awardId?: string | null }> }, doiMatch?: { __typename?: 'DoiMatch', found: boolean, score: number, sources: Array<{ __typename?: 'DoiMatchSource', parentAwardId?: string | null, awardId: string, awardUrl: string }> } | null, contentMatch?: { __typename?: 'ContentMatch', score: number, titleHighlight?: string | null, abstractHighlights: Array<string> } | null, authorMatches?: Array<{ __typename?: 'ItemMatch', index: number, score: number, fields?: Array<string> | null }> | null, institutionMatches?: Array<{ __typename?: 'ItemMatch', index: number, score: number, fields?: Array<string> | null }> | null, funderMatches?: Array<{ __typename?: 'ItemMatch', index: number, score: number, fields?: Array<string> | null }> | null, awardMatches?: Array<{ __typename?: 'ItemMatch', index: number, score: number, fields?: Array<string> | null }> | null } | null> | null, workTypeCounts?: Array<{ __typename?: 'TypeCount', typeId: string, count: number }> | null, confidenceCounts?: Array<{ __typename?: 'TypeCount', typeId: string, count: number }> | null } | null };

export type FindWorkByIdentifierQueryVariables = Exact<{
  planId?: InputMaybe<Scalars['Int']['input']>;
  doi?: InputMaybe<Scalars['String']['input']>;
}>;


export type FindWorkByIdentifierQuery = { __typename?: 'Query', findWorkByIdentifier?: { __typename?: 'RelatedWorkSearchResults', items?: Array<{ __typename?: 'RelatedWorkSearchResult', id?: number | null, planId?: number | null, planTitle?: string | null, status: RelatedWorkStatus, sourceType?: RelatedWorkSourceType | null, modified?: string | null, workVersion: { __typename?: 'WorkVersion', title?: string | null, hash: any, workType: WorkType, publicationDate?: string | null, publicationVenue?: string | null, sourceName: string, sourceUrl?: string | null, work: { __typename?: 'Work', doi: string }, authors: Array<{ __typename?: 'Author', orcid?: string | null, firstInitial?: string | null, givenName?: string | null, surname?: string | null, full?: string | null }> } } | null> | null } | null };

export type RelatedWorksByPlanStatsQueryVariables = Exact<{
  planId: Scalars['Int']['input'];
}>;


export type RelatedWorksByPlanStatsQuery = { __typename?: 'Query', relatedWorksByPlanStats?: { __typename?: 'RelatedWorkStatsResults', hasPublishedPlan?: boolean | null, acceptedCount?: number | null, pendingCount?: number | null, rejectedCount?: number | null, totalCount?: number | null } | null };

export type RelatedWorksByProjectStatsQueryVariables = Exact<{
  projectId: Scalars['Int']['input'];
}>;


export type RelatedWorksByProjectStatsQuery = { __typename?: 'Query', relatedWorksByProjectStats?: { __typename?: 'RelatedWorkStatsResults', hasPublishedPlan?: boolean | null, acceptedCount?: number | null, pendingCount?: number | null, rejectedCount?: number | null, totalCount?: number | null } | null };

export type RepositoriesQueryVariables = Exact<{
  input: RepositorySearchInput;
}>;


export type RepositoriesQuery = { __typename?: 'Query', repositories?: { __typename?: 'RepositorySearchResults', hasPreviousPage?: boolean | null, hasNextPage?: boolean | null, currentOffset?: number | null, availableSortFields?: Array<string | null> | null, totalCount?: number | null, nextCursor?: string | null, limit?: number | null, items?: Array<
      | { __typename?: 'CustomRepository', name: string, description?: string | null, uri?: string | null, website?: string | null, repositoryTypes?: Array<string> | null, keywords?: Array<string> | null, id: string, errors?: { __typename?: 'RepositoryErrors', general?: string | null, uri?: string | null } | null }
      | { __typename?: 'Re3DataRepository', keywords?: Array<string> | null, id: string, name: string, description?: string | null, uri?: string | null, website?: string | null, repositoryTypes?: Array<string> | null }
     | null> | null } | null };

export type RepositorySubjectAreasQueryVariables = Exact<{ [key: string]: never; }>;


export type RepositorySubjectAreasQuery = { __typename?: 'Query', repositorySubjectAreas?: Array<string> | null };

export type RepositoriesByUrIsQueryVariables = Exact<{
  uris: Array<Scalars['String']['input']> | Scalars['String']['input'];
}>;


export type RepositoriesByUrIsQuery = { __typename?: 'Query', repositoriesByURIs?: Array<{ __typename?: 'CustomRepository', keywords?: Array<string> | null, id: string, name: string, description?: string | null, uri?: string | null, website?: string | null, repositoryTypes?: Array<string> | null, errors?: { __typename?: 'RepositoryErrors', general?: string | null, uri?: string | null } | null }> | null };

export type Re3RepositoryTypesListQueryVariables = Exact<{ [key: string]: never; }>;


export type Re3RepositoryTypesListQuery = { __typename?: 'Query', re3RepositoryTypesList: { __typename?: 'Re3RepositoryTypesListResults', totalCount: number, types: Array<{ __typename?: 'Re3RepositoryType', count?: number | null, type: string }> } };

export type Re3SubjectListQueryVariables = Exact<{ [key: string]: never; }>;


export type Re3SubjectListQuery = { __typename?: 'Query', re3SubjectList: { __typename?: 'Re3SubjectListResults', totalCount: number, subjects: Array<{ __typename?: 'Re3Subject', subject: string, count?: number | null }> } };

export type Re3byUrIsQueryVariables = Exact<{
  uris: Array<Scalars['String']['input']> | Scalars['String']['input'];
}>;


export type Re3byUrIsQuery = { __typename?: 'Query', re3byURIs?: Array<{ __typename?: 'Re3DataRepository', name: string, id: string, description?: string | null, keywords?: Array<string> | null, uri?: string | null, website?: string | null, repositoryTypes?: Array<string> | null }> | null };

export type TopLevelResearchDomainsQueryVariables = Exact<{ [key: string]: never; }>;


export type TopLevelResearchDomainsQuery = { __typename?: 'Query', topLevelResearchDomains?: Array<{ __typename?: 'ResearchDomain', name: string, description?: string | null, id?: number | null } | null> | null };

export type ChildResearchDomainsQueryVariables = Exact<{
  parentResearchDomainId: Scalars['Int']['input'];
}>;


export type ChildResearchDomainsQuery = { __typename?: 'Query', childResearchDomains?: Array<{ __typename?: 'ResearchDomain', id?: number | null, name: string, description?: string | null } | null> | null };

export type DefaultResearchOutputTypesQueryVariables = Exact<{ [key: string]: never; }>;


export type DefaultResearchOutputTypesQuery = { __typename?: 'Query', defaultResearchOutputTypes?: Array<{ __typename?: 'ResearchOutputType', id?: number | null, name: string, value: string, description?: string | null, errors?: { __typename?: 'ResearchOutputTypeErrors', general?: string | null, name?: string | null, value?: string | null } | null } | null> | null };

export type SectionCustomizationQueryVariables = Exact<{
  sectionCustomizationId: Scalars['Int']['input'];
}>;


export type SectionCustomizationQuery = { __typename?: 'Query', sectionCustomization?: { __typename?: 'SectionCustomization', id?: number | null, guidance?: string | null, migrationStatus?: TemplateCustomizationMigrationStatus | null, modified?: string | null, sectionId: number, templateCustomizationId: number, errors?: { __typename?: 'SectionCustomizationErrors', general?: string | null, guidance?: string | null, migrationStatus?: string | null, sectionId?: string | null, templateCustomizationId?: string | null } | null, versionedSection?: { __typename?: 'VersionedSection', id?: number | null, guidance?: string | null, name: string, modified?: string | null, introduction?: string | null, requirements?: string | null, displayOrder: number } | null } | null };

export type SectionCustomizationByVersionedSectionQueryVariables = Exact<{
  templateCustomizationId: Scalars['Int']['input'];
  versionedSectionId: Scalars['Int']['input'];
}>;


export type SectionCustomizationByVersionedSectionQuery = { __typename?: 'Query', sectionCustomizationByVersionedSection?: { __typename?: 'SectionCustomization', id?: number | null, guidance?: string | null, sectionId: number, templateCustomizationId: number, versionedSection?: { __typename?: 'VersionedSection', id?: number | null, name: string } | null, errors?: { __typename?: 'SectionCustomizationErrors', guidance?: string | null, migrationStatus?: string | null, sectionId?: string | null, templateCustomizationId?: string | null, general?: string | null } | null } | null };

export type SectionVersionsQueryVariables = Exact<{
  sectionId: Scalars['Int']['input'];
}>;


export type SectionVersionsQuery = { __typename?: 'Query', sectionVersions?: Array<{ __typename?: 'VersionedSection', id?: number | null, versionedQuestions?: Array<{ __typename?: 'VersionedQuestion', id?: number | null, questionText?: string | null, json?: string | null, questionId: number }> | null, section?: { __typename?: 'Section', id?: number | null } | null } | null> | null };

export type SectionsDisplayOrderQueryVariables = Exact<{
  templateId: Scalars['Int']['input'];
}>;


export type SectionsDisplayOrderQuery = { __typename?: 'Query', sections?: Array<{ __typename?: 'Section', displayOrder?: number | null } | null> | null };

export type PublishedSectionsQueryVariables = Exact<{
  term: Scalars['String']['input'];
  paginationOptions?: InputMaybe<PaginationOptions>;
}>;


export type PublishedSectionsQuery = { __typename?: 'Query', publishedSections?: { __typename?: 'VersionedSectionSearchResults', limit?: number | null, nextCursor?: string | null, totalCount?: number | null, availableSortFields?: Array<string | null> | null, currentOffset?: number | null, hasNextPage?: boolean | null, hasPreviousPage?: boolean | null, items?: Array<{ __typename?: 'VersionedSectionSearchResult', id?: number | null, name: string, displayOrder: number, bestPractice?: boolean | null, modified?: string | null, created?: string | null, versionedTemplateId?: number | null, versionedTemplateName?: string | null, versionedQuestionCount?: number | null } | null> | null } | null };

export type PublishedSectionQueryVariables = Exact<{
  versionedSectionId: Scalars['Int']['input'];
}>;


export type PublishedSectionQuery = { __typename?: 'Query', publishedSection?: { __typename?: 'VersionedSection', id?: number | null, introduction?: string | null, name: string, requirements?: string | null, guidance?: string | null, displayOrder: number, tags?: Array<{ __typename?: 'Tag', id?: number | null, description?: string | null, name: string, slug: string } | null> | null, errors?: { __typename?: 'VersionedSectionErrors', general?: string | null, name?: string | null, displayOrder?: string | null } | null } | null };

export type SectionQueryVariables = Exact<{
  sectionId: Scalars['Int']['input'];
}>;


export type SectionQuery = { __typename?: 'Query', section?: { __typename?: 'Section', id?: number | null, introduction?: string | null, name: string, requirements?: string | null, guidance?: string | null, displayOrder?: number | null, bestPractice?: boolean | null, isDirty: boolean, questions?: Array<{ __typename?: 'Question', displayOrder?: number | null, guidanceText?: string | null, id?: number | null, questionText?: string | null, sectionId: number, templateId: number, errors?: { __typename?: 'QuestionErrors', general?: string | null, templateId?: string | null, sectionId?: string | null, questionText?: string | null, displayOrder?: string | null } | null }> | null, tags?: Array<{ __typename?: 'Tag', id?: number | null, description?: string | null, name: string, slug: string } | null> | null, errors?: { __typename?: 'SectionErrors', general?: string | null, name?: string | null, displayOrder?: string | null } | null, template?: { __typename?: 'Template', id?: number | null, bestPractice: boolean, isDirty: boolean, languageId: string, name: string, latestPublishVisibility?: TemplateVisibility | null } | null } | null };

export type PublishedCustomSectionQueryVariables = Exact<{
  customSectionId: Scalars['Int']['input'];
  planId: Scalars['Int']['input'];
}>;


export type PublishedCustomSectionQuery = { __typename?: 'Query', publishedCustomSection?: { __typename?: 'VersionedCustomSection', id?: number | null, guidance?: string | null, name: string, introduction?: string | null, requirements?: string | null, pinnedVersionedSectionType?: string | null, pinnedVersionedSectionId?: number | null, errors?: { __typename?: 'VersionedCustomSectionErrors', name?: string | null, general?: string | null } | null } | null };

export type TagsQueryVariables = Exact<{ [key: string]: never; }>;


export type TagsQuery = { __typename?: 'Query', tags: Array<{ __typename?: 'Tag', id?: number | null, name: string, description?: string | null, slug: string }> };

export type TemplateCustomizationOverviewQueryVariables = Exact<{
  templateCustomizationId: Scalars['Int']['input'];
}>;


export type TemplateCustomizationOverviewQuery = { __typename?: 'Query', templateCustomizationOverview?: { __typename?: 'TemplateCustomizationOverview', customizationId: number, customizationIsDirty: boolean, customizationLastCustomized?: string | null, customizationLastCustomizedById?: number | null, customizationLastCustomizedByName?: string | null, customizationMigrationStatus: TemplateCustomizationMigrationStatus, customizationStatus: TemplateCustomizationStatus, customizationLastPublishedDate?: string | null, versionedTemplateAffiliationId: string, versionedTemplateAffiliationName: string, versionedTemplateId: number, versionedTemplateLastModified: string, versionedTemplateName: string, versionedTemplateVersion: string, errors?: { __typename?: 'TemplateCustomizationErrors', general?: string | null, affiliationId?: string | null, currentVersionedTemplateId?: string | null, templateId?: string | null } | null, sections?: Array<{ __typename?: 'SectionCustomizationOverview', id: number, hasCustomGuidance?: boolean | null, displayOrder: number, migrationStatus?: TemplateCustomizationMigrationStatus | null, name: string, sectionType: CustomizableObjectOwnership, questions?: Array<{ __typename?: 'QuestionCustomizationOverview', displayOrder: number, questionText: string, migrationStatus?: TemplateCustomizationMigrationStatus | null, id: number, hasCustomSampleAnswer?: boolean | null, hasCustomGuidance?: boolean | null, questionType: CustomizableObjectOwnership }> | null }> | null } | null };

export type TemplateVersionsQueryVariables = Exact<{
  templateId: Scalars['Int']['input'];
}>;


export type TemplateVersionsQuery = { __typename?: 'Query', templateVersions?: Array<{ __typename?: 'VersionedTemplate', name: string, version: string, versionType?: TemplateVersionType | null, created?: string | null, comment?: string | null, id?: number | null, modified?: string | null, versionedBy?: { __typename?: 'User', givenName?: string | null, surName?: string | null, modified?: string | null, affiliation?: { __typename?: 'Affiliation', displayName: string } | null } | null } | null> | null };

export type MyVersionedTemplatesQueryVariables = Exact<{ [key: string]: never; }>;


export type MyVersionedTemplatesQuery = { __typename?: 'Query', myVersionedTemplates?: Array<{ __typename?: 'VersionedTemplateSearchResult', id?: number | null, templateId?: number | null, name?: string | null, description?: string | null, visibility?: TemplateVisibility | null, bestPractice?: boolean | null, version?: string | null, modified?: string | null, modifiedById?: number | null, modifiedByName?: string | null, ownerId?: number | null, ownerURI?: string | null, ownerDisplayName?: string | null, ownerSearchName?: string | null } | null> | null };

export type PublishedTemplatesQueryVariables = Exact<{
  paginationOptions?: InputMaybe<PaginationOptions>;
  term?: InputMaybe<Scalars['String']['input']>;
}>;


export type PublishedTemplatesQuery = { __typename?: 'Query', publishedTemplates?: { __typename?: 'PublishedTemplateSearchResults', limit?: number | null, nextCursor?: string | null, totalCount?: number | null, availableSortFields?: Array<string | null> | null, currentOffset?: number | null, hasNextPage?: boolean | null, hasPreviousPage?: boolean | null, items?: Array<{ __typename?: 'VersionedTemplateSearchResult', id?: number | null, templateId?: number | null, name?: string | null, description?: string | null, visibility?: TemplateVisibility | null, bestPractice?: boolean | null, version?: string | null, modified?: string | null, modifiedById?: number | null, modifiedByName?: string | null, ownerId?: number | null, ownerURI?: string | null, ownerDisplayName?: string | null, ownerSearchName?: string | null, versionedTemplateCustomizationId?: number | null } | null> | null } | null };

export type PublishedTemplatesMetaDataQueryVariables = Exact<{
  paginationOptions?: InputMaybe<PaginationOptions>;
  term?: InputMaybe<Scalars['String']['input']>;
}>;


export type PublishedTemplatesMetaDataQuery = { __typename?: 'Query', publishedTemplatesMetaData?: { __typename?: 'PublishedTemplateMetaDataResults', hasBestPracticeTemplates?: boolean | null, availableAffiliations?: Array<string | null> | null } | null };

export type CustomizableTemplatesQueryVariables = Exact<{
  term?: InputMaybe<Scalars['String']['input']>;
  paginationOptions?: InputMaybe<PaginationOptions>;
}>;


export type CustomizableTemplatesQuery = { __typename?: 'Query', customizableTemplates?: { __typename?: 'CustomizableTemplateSearchResults', nextCursor?: string | null, totalCount?: number | null, limit?: number | null, items?: Array<{ __typename?: 'CustomizableTemplateSearchResult', customizationId?: number | null, customizationIsDirty?: boolean | null, customizationLastCustomized?: string | null, customizationLastCustomizedById?: number | null, customizationMigrationStatus?: TemplateCustomizationMigrationStatus | null, customizationLastCustomizedByName?: string | null, versionedTemplateDescription?: string | null, versionedTemplateAffiliationId: string, versionedTemplateAffiliationName: string, versionedTemplateId: number, versionedTemplateName: string, versionedTemplateVersion: string, versionedTemplateBestPractice: boolean, customizationStatus?: TemplateCustomizationStatus | null, versionedTemplateLastModified: string } | null> | null } | null };

export type TemplatesQueryVariables = Exact<{
  term?: InputMaybe<Scalars['String']['input']>;
  paginationOptions?: InputMaybe<PaginationOptions>;
}>;


export type TemplatesQuery = { __typename?: 'Query', myTemplates?: { __typename?: 'TemplateSearchResults', totalCount?: number | null, nextCursor?: string | null, limit?: number | null, availableSortFields?: Array<string | null> | null, currentOffset?: number | null, hasNextPage?: boolean | null, hasPreviousPage?: boolean | null, items?: Array<{ __typename?: 'TemplateSearchResult', id?: number | null, name?: string | null, description?: string | null, latestPublishVisibility?: TemplateVisibility | null, isDirty?: boolean | null, latestPublishVersion?: string | null, latestPublishDate?: string | null, ownerId?: string | null, ownerDisplayName?: string | null, modified?: string | null, modifiedById?: number | null, modifiedByName?: string | null, bestPractice?: boolean | null } | null> | null } | null };

export type TemplateQueryVariables = Exact<{
  templateId: Scalars['Int']['input'];
}>;


export type TemplateQuery = { __typename?: 'Query', template?: { __typename?: 'Template', id?: number | null, name: string, description?: string | null, latestPublishVersion?: string | null, latestPublishDate?: string | null, created?: string | null, latestPublishVisibility?: TemplateVisibility | null, bestPractice: boolean, isDirty: boolean, errors?: { __typename?: 'TemplateErrors', general?: string | null, name?: string | null, ownerId?: string | null } | null, sections?: Array<{ __typename?: 'Section', id?: number | null, name: string, bestPractice?: boolean | null, displayOrder?: number | null, isDirty: boolean, questions?: Array<{ __typename?: 'Question', displayOrder?: number | null, guidanceText?: string | null, id?: number | null, questionText?: string | null, sectionId: number, templateId: number, errors?: { __typename?: 'QuestionErrors', general?: string | null, templateId?: string | null, sectionId?: string | null, questionText?: string | null, displayOrder?: string | null } | null }> | null } | null> | null, owner?: { __typename?: 'Affiliation', displayName: string, id?: number | null } | null } | null };

export type TemplateCollaboratorsQueryVariables = Exact<{
  templateId: Scalars['Int']['input'];
}>;


export type TemplateCollaboratorsQuery = { __typename?: 'Query', template?: { __typename?: 'Template', id?: number | null, name: string, collaborators?: Array<{ __typename?: 'TemplateCollaborator', email: string, id?: number | null, user?: { __typename?: 'User', id?: number | null, email?: string | null, givenName?: string | null, surName?: string | null } | null }> | null, admins?: Array<{ __typename?: 'User', givenName?: string | null, surName?: string | null, email?: string | null }> | null, owner?: { __typename?: 'Affiliation', name: string } | null } | null };

export type MeQueryVariables = Exact<{ [key: string]: never; }>;


export type MeQuery = { __typename?: 'Query', me?: { __typename?: 'User', id?: number | null, givenName?: string | null, surName?: string | null, languageId: string, role: UserRole, emails?: Array<{ __typename?: 'UserEmail', id?: number | null, email: string, isPrimary: boolean, isConfirmed: boolean } | null> | null, errors?: { __typename?: 'UserErrors', general?: string | null, email?: string | null, password?: string | null, role?: string | null } | null, affiliation?: { __typename?: 'Affiliation', id?: number | null, name: string, displayName: string, searchName: string, uri: string, acronyms?: Array<string> | null, feedbackEmails?: Array<string> | null, feedbackEnabled: boolean, feedbackMessage?: string | null } | null } | null };

export type BestPracticeGuidanceQueryVariables = Exact<{
  tagIds: Array<Scalars['Int']['input']> | Scalars['Int']['input'];
}>;


export type BestPracticeGuidanceQuery = { __typename?: 'Query', bestPracticeGuidance: Array<{ __typename?: 'VersionedGuidance', id?: number | null, guidanceText?: string | null, guidanceId?: number | null, tagId: number, guidance?: { __typename?: 'Guidance', guidanceText?: string | null } | null, errors?: { __typename?: 'VersionedGuidanceErrors', guidanceId?: string | null, general?: string | null, guidanceText?: string | null, versionedGuidanceGroupId?: string | null, tagId?: string | null } | null }> };

export type VersionedGuidanceQueryVariables = Exact<{
  affiliationId: Scalars['String']['input'];
  tagIds: Array<Scalars['Int']['input']> | Scalars['Int']['input'];
}>;


export type VersionedGuidanceQuery = { __typename?: 'Query', versionedGuidance: Array<{ __typename?: 'VersionedGuidance', tagId: number, id?: number | null, guidanceText?: string | null, errors?: { __typename?: 'VersionedGuidanceErrors', general?: string | null, guidanceId?: string | null, guidanceText?: string | null, tagId?: string | null, versionedGuidanceGroupId?: string | null } | null }> };


export const AddAffiliationDocument = {"kind":"Document","definitions":[{"kind":"OperationDefinition","operation":"mutation","name":{"kind":"Name","value":"AddAffiliation"},"variableDefinitions":[{"kind":"VariableDefinition","variable":{"kind":"Variable","name":{"kind":"Name","value":"input"}},"type":{"kind":"NonNullType","type":{"kind":"NamedType","name":{"kind":"Name","value":"AffiliationInput"}}}}],"selectionSet":{"kind":"SelectionSet","selections":[{"kind":"Field","name":{"kind":"Name","value":"addAffiliation"},"arguments":[{"kind":"Argument","name":{"kind":"Name","value":"input"},"value":{"kind":"Variable","name":{"kind":"Name","value":"input"}}}],"selectionSet":{"kind":"SelectionSet","selections":[{"kind":"Field","name":{"kind":"Name","value":"errors"},"selectionSet":{"kind":"SelectionSet","selections":[{"kind":"Field","name":{"kind":"Name","value":"general"}},{"kind":"Field","name":{"kind":"Name","value":"name"}}]}},{"kind":"Field","name":{"kind":"Name","value":"uri"}}]}}]}}]} as unknown as DocumentNode<AddAffiliationMutation, AddAffiliationMutationVariables>;
export const UpdateAffiliationDocument = {"kind":"Document","definitions":[{"kind":"OperationDefinition","operation":"mutation","name":{"kind":"Name","value":"UpdateAffiliation"},"variableDefinitions":[{"kind":"VariableDefinition","variable":{"kind":"Variable","name":{"kind":"Name","value":"input"}},"type":{"kind":"NonNullType","type":{"kind":"NamedType","name":{"kind":"Name","value":"AffiliationInput"}}}}],"selectionSet":{"kind":"SelectionSet","selections":[{"kind":"Field","name":{"kind":"Name","value":"updateAffiliation"},"arguments":[{"kind":"Argument","name":{"kind":"Name","value":"input"},"value":{"kind":"Variable","name":{"kind":"Name","value":"input"}}}],"selectionSet":{"kind":"SelectionSet","selections":[{"kind":"Field","name":{"kind":"Name","value":"feedbackEmails"}},{"kind":"Field","name":{"kind":"Name","value":"feedbackEnabled"}},{"kind":"Field","name":{"kind":"Name","value":"feedbackMessage"}},{"kind":"Field","name":{"kind":"Name","value":"id"}},{"kind":"Field","name":{"kind":"Name","value":"uri"}},{"kind":"Field","name":{"kind":"Name","value":"name"}},{"kind":"Field","name":{"kind":"Name","value":"displayName"}},{"kind":"Field","name":{"kind":"Name","value":"errors"},"selectionSet":{"kind":"SelectionSet","selections":[{"kind":"Field","name":{"kind":"Name","value":"general"}},{"kind":"Field","name":{"kind":"Name","value":"feedbackEmails"}},{"kind":"Field","name":{"kind":"Name","value":"feedbackMessage"}}]}}]}}]}}]} as unknown as DocumentNode<UpdateAffiliationMutation, UpdateAffiliationMutationVariables>;
export const AddAnswerDocument = {"kind":"Document","definitions":[{"kind":"OperationDefinition","operation":"mutation","name":{"kind":"Name","value":"AddAnswer"},"variableDefinitions":[{"kind":"VariableDefinition","variable":{"kind":"Variable","name":{"kind":"Name","value":"planId"}},"type":{"kind":"NonNullType","type":{"kind":"NamedType","name":{"kind":"Name","value":"Int"}}}},{"kind":"VariableDefinition","variable":{"kind":"Variable","name":{"kind":"Name","value":"versionedSectionId"}},"type":{"kind":"NamedType","name":{"kind":"Name","value":"Int"}}},{"kind":"VariableDefinition","variable":{"kind":"Variable","name":{"kind":"Name","value":"versionedQuestionId"}},"type":{"kind":"NamedType","name":{"kind":"Name","value":"Int"}}},{"kind":"VariableDefinition","variable":{"kind":"Variable","name":{"kind":"Name","value":"versionedCustomSectionId"}},"type":{"kind":"NamedType","name":{"kind":"Name","value":"Int"}}},{"kind":"VariableDefinition","variable":{"kind":"Variable","name":{"kind":"Name","value":"versionedCustomQuestionId"}},"type":{"kind":"NamedType","name":{"kind":"Name","value":"Int"}}},{"kind":"VariableDefinition","variable":{"kind":"Variable","name":{"kind":"Name","value":"json"}},"type":{"kind":"NonNullType","type":{"kind":"NamedType","name":{"kind":"Name","value":"String"}}}}],"selectionSet":{"kind":"SelectionSet","selections":[{"kind":"Field","name":{"kind":"Name","value":"addAnswer"},"arguments":[{"kind":"Argument","name":{"kind":"Name","value":"planId"},"value":{"kind":"Variable","name":{"kind":"Name","value":"planId"}}},{"kind":"Argument","name":{"kind":"Name","value":"versionedSectionId"},"value":{"kind":"Variable","name":{"kind":"Name","value":"versionedSectionId"}}},{"kind":"Argument","name":{"kind":"Name","value":"versionedQuestionId"},"value":{"kind":"Variable","name":{"kind":"Name","value":"versionedQuestionId"}}},{"kind":"Argument","name":{"kind":"Name","value":"versionedCustomSectionId"},"value":{"kind":"Variable","name":{"kind":"Name","value":"versionedCustomSectionId"}}},{"kind":"Argument","name":{"kind":"Name","value":"versionedCustomQuestionId"},"value":{"kind":"Variable","name":{"kind":"Name","value":"versionedCustomQuestionId"}}},{"kind":"Argument","name":{"kind":"Name","value":"json"},"value":{"kind":"Variable","name":{"kind":"Name","value":"json"}}}],"selectionSet":{"kind":"SelectionSet","selections":[{"kind":"Field","name":{"kind":"Name","value":"id"}},{"kind":"Field","name":{"kind":"Name","value":"json"}},{"kind":"Field","name":{"kind":"Name","value":"modified"}}]}}]}}]} as unknown as DocumentNode<AddAnswerMutation, AddAnswerMutationVariables>;
export const UpdateAnswerDocument = {"kind":"Document","definitions":[{"kind":"OperationDefinition","operation":"mutation","name":{"kind":"Name","value":"UpdateAnswer"},"variableDefinitions":[{"kind":"VariableDefinition","variable":{"kind":"Variable","name":{"kind":"Name","value":"answerId"}},"type":{"kind":"NonNullType","type":{"kind":"NamedType","name":{"kind":"Name","value":"Int"}}}},{"kind":"VariableDefinition","variable":{"kind":"Variable","name":{"kind":"Name","value":"json"}},"type":{"kind":"NamedType","name":{"kind":"Name","value":"String"}}}],"selectionSet":{"kind":"SelectionSet","selections":[{"kind":"Field","name":{"kind":"Name","value":"updateAnswer"},"arguments":[{"kind":"Argument","name":{"kind":"Name","value":"answerId"},"value":{"kind":"Variable","name":{"kind":"Name","value":"answerId"}}},{"kind":"Argument","name":{"kind":"Name","value":"json"},"value":{"kind":"Variable","name":{"kind":"Name","value":"json"}}}],"selectionSet":{"kind":"SelectionSet","selections":[{"kind":"Field","name":{"kind":"Name","value":"errors"},"selectionSet":{"kind":"SelectionSet","selections":[{"kind":"Field","name":{"kind":"Name","value":"acronyms"}},{"kind":"Field","name":{"kind":"Name","value":"aliases"}},{"kind":"Field","name":{"kind":"Name","value":"contactEmail"}},{"kind":"Field","name":{"kind":"Name","value":"contactName"}},{"kind":"Field","name":{"kind":"Name","value":"displayName"}},{"kind":"Field","name":{"kind":"Name","value":"feedbackEmails"}},{"kind":"Field","name":{"kind":"Name","value":"feedbackMessage"}},{"kind":"Field","name":{"kind":"Name","value":"fundrefId"}},{"kind":"Field","name":{"kind":"Name","value":"general"}},{"kind":"Field","name":{"kind":"Name","value":"homepage"}},{"kind":"Field","name":{"kind":"Name","value":"json"}},{"kind":"Field","name":{"kind":"Name","value":"logoName"}},{"kind":"Field","name":{"kind":"Name","value":"logoURI"}},{"kind":"Field","name":{"kind":"Name","value":"name"}},{"kind":"Field","name":{"kind":"Name","value":"planId"}},{"kind":"Field","name":{"kind":"Name","value":"provenance"}},{"kind":"Field","name":{"kind":"Name","value":"searchName"}},{"kind":"Field","name":{"kind":"Name","value":"ssoEntityId"}},{"kind":"Field","name":{"kind":"Name","value":"subHeaderLinks"}},{"kind":"Field","name":{"kind":"Name","value":"types"}},{"kind":"Field","name":{"kind":"Name","value":"uri"}},{"kind":"Field","name":{"kind":"Name","value":"versionedQuestionId"}},{"kind":"Field","name":{"kind":"Name","value":"versionedSectionId"}}]}},{"kind":"Field","name":{"kind":"Name","value":"id"}},{"kind":"Field","name":{"kind":"Name","value":"json"}},{"kind":"Field","name":{"kind":"Name","value":"modified"}},{"kind":"Field","name":{"kind":"Name","value":"versionedQuestion"},"selectionSet":{"kind":"SelectionSet","selections":[{"kind":"Field","name":{"kind":"Name","value":"versionedSectionId"}}]}}]}}]}}]} as unknown as DocumentNode<UpdateAnswerMutation, UpdateAnswerMutationVariables>;
export const RemoveAnswerCommentDocument = {"kind":"Document","definitions":[{"kind":"OperationDefinition","operation":"mutation","name":{"kind":"Name","value":"RemoveAnswerComment"},"variableDefinitions":[{"kind":"VariableDefinition","variable":{"kind":"Variable","name":{"kind":"Name","value":"answerCommentId"}},"type":{"kind":"NonNullType","type":{"kind":"NamedType","name":{"kind":"Name","value":"Int"}}}},{"kind":"VariableDefinition","variable":{"kind":"Variable","name":{"kind":"Name","value":"answerId"}},"type":{"kind":"NonNullType","type":{"kind":"NamedType","name":{"kind":"Name","value":"Int"}}}}],"selectionSet":{"kind":"SelectionSet","selections":[{"kind":"Field","name":{"kind":"Name","value":"removeAnswerComment"},"arguments":[{"kind":"Argument","name":{"kind":"Name","value":"answerCommentId"},"value":{"kind":"Variable","name":{"kind":"Name","value":"answerCommentId"}}},{"kind":"Argument","name":{"kind":"Name","value":"answerId"},"value":{"kind":"Variable","name":{"kind":"Name","value":"answerId"}}}],"selectionSet":{"kind":"SelectionSet","selections":[{"kind":"Field","name":{"kind":"Name","value":"id"}},{"kind":"Field","name":{"kind":"Name","value":"errors"},"selectionSet":{"kind":"SelectionSet","selections":[{"kind":"Field","name":{"kind":"Name","value":"general"}}]}},{"kind":"Field","name":{"kind":"Name","value":"answerId"}},{"kind":"Field","name":{"kind":"Name","value":"commentText"}}]}}]}}]} as unknown as DocumentNode<RemoveAnswerCommentMutation, RemoveAnswerCommentMutationVariables>;
export const UpdateAnswerCommentDocument = {"kind":"Document","definitions":[{"kind":"OperationDefinition","operation":"mutation","name":{"kind":"Name","value":"UpdateAnswerComment"},"variableDefinitions":[{"kind":"VariableDefinition","variable":{"kind":"Variable","name":{"kind":"Name","value":"answerCommentId"}},"type":{"kind":"NonNullType","type":{"kind":"NamedType","name":{"kind":"Name","value":"Int"}}}},{"kind":"VariableDefinition","variable":{"kind":"Variable","name":{"kind":"Name","value":"answerId"}},"type":{"kind":"NonNullType","type":{"kind":"NamedType","name":{"kind":"Name","value":"Int"}}}},{"kind":"VariableDefinition","variable":{"kind":"Variable","name":{"kind":"Name","value":"commentText"}},"type":{"kind":"NonNullType","type":{"kind":"NamedType","name":{"kind":"Name","value":"String"}}}}],"selectionSet":{"kind":"SelectionSet","selections":[{"kind":"Field","name":{"kind":"Name","value":"updateAnswerComment"},"arguments":[{"kind":"Argument","name":{"kind":"Name","value":"answerCommentId"},"value":{"kind":"Variable","name":{"kind":"Name","value":"answerCommentId"}}},{"kind":"Argument","name":{"kind":"Name","value":"answerId"},"value":{"kind":"Variable","name":{"kind":"Name","value":"answerId"}}},{"kind":"Argument","name":{"kind":"Name","value":"commentText"},"value":{"kind":"Variable","name":{"kind":"Name","value":"commentText"}}}],"selectionSet":{"kind":"SelectionSet","selections":[{"kind":"Field","name":{"kind":"Name","value":"commentText"}},{"kind":"Field","name":{"kind":"Name","value":"answerId"}},{"kind":"Field","name":{"kind":"Name","value":"id"}},{"kind":"Field","name":{"kind":"Name","value":"errors"},"selectionSet":{"kind":"SelectionSet","selections":[{"kind":"Field","name":{"kind":"Name","value":"general"}},{"kind":"Field","name":{"kind":"Name","value":"commentText"}},{"kind":"Field","name":{"kind":"Name","value":"answerId"}}]}}]}}]}}]} as unknown as DocumentNode<UpdateAnswerCommentMutation, UpdateAnswerCommentMutationVariables>;
export const AddAnswerCommentDocument = {"kind":"Document","definitions":[{"kind":"OperationDefinition","operation":"mutation","name":{"kind":"Name","value":"AddAnswerComment"},"variableDefinitions":[{"kind":"VariableDefinition","variable":{"kind":"Variable","name":{"kind":"Name","value":"answerId"}},"type":{"kind":"NonNullType","type":{"kind":"NamedType","name":{"kind":"Name","value":"Int"}}}},{"kind":"VariableDefinition","variable":{"kind":"Variable","name":{"kind":"Name","value":"commentText"}},"type":{"kind":"NonNullType","type":{"kind":"NamedType","name":{"kind":"Name","value":"String"}}}}],"selectionSet":{"kind":"SelectionSet","selections":[{"kind":"Field","name":{"kind":"Name","value":"addAnswerComment"},"arguments":[{"kind":"Argument","name":{"kind":"Name","value":"answerId"},"value":{"kind":"Variable","name":{"kind":"Name","value":"answerId"}}},{"kind":"Argument","name":{"kind":"Name","value":"commentText"},"value":{"kind":"Variable","name":{"kind":"Name","value":"commentText"}}}],"selectionSet":{"kind":"SelectionSet","selections":[{"kind":"Field","name":{"kind":"Name","value":"commentText"}},{"kind":"Field","name":{"kind":"Name","value":"id"}},{"kind":"Field","name":{"kind":"Name","value":"answerId"}},{"kind":"Field","name":{"kind":"Name","value":"errors"},"selectionSet":{"kind":"SelectionSet","selections":[{"kind":"Field","name":{"kind":"Name","value":"general"}}]}}]}}]}}]} as unknown as DocumentNode<AddAnswerCommentMutation, AddAnswerCommentMutationVariables>;
export const UpdateProjectCollaboratorDocument = {"kind":"Document","definitions":[{"kind":"OperationDefinition","operation":"mutation","name":{"kind":"Name","value":"UpdateProjectCollaborator"},"variableDefinitions":[{"kind":"VariableDefinition","variable":{"kind":"Variable","name":{"kind":"Name","value":"projectCollaboratorId"}},"type":{"kind":"NonNullType","type":{"kind":"NamedType","name":{"kind":"Name","value":"Int"}}}},{"kind":"VariableDefinition","variable":{"kind":"Variable","name":{"kind":"Name","value":"accessLevel"}},"type":{"kind":"NonNullType","type":{"kind":"NamedType","name":{"kind":"Name","value":"ProjectCollaboratorAccessLevel"}}}}],"selectionSet":{"kind":"SelectionSet","selections":[{"kind":"Field","name":{"kind":"Name","value":"updateProjectCollaborator"},"arguments":[{"kind":"Argument","name":{"kind":"Name","value":"projectCollaboratorId"},"value":{"kind":"Variable","name":{"kind":"Name","value":"projectCollaboratorId"}}},{"kind":"Argument","name":{"kind":"Name","value":"accessLevel"},"value":{"kind":"Variable","name":{"kind":"Name","value":"accessLevel"}}}],"selectionSet":{"kind":"SelectionSet","selections":[{"kind":"Field","name":{"kind":"Name","value":"id"}},{"kind":"Field","name":{"kind":"Name","value":"errors"},"selectionSet":{"kind":"SelectionSet","selections":[{"kind":"Field","name":{"kind":"Name","value":"accessLevel"}},{"kind":"Field","name":{"kind":"Name","value":"email"}},{"kind":"Field","name":{"kind":"Name","value":"general"}},{"kind":"Field","name":{"kind":"Name","value":"invitedById"}},{"kind":"Field","name":{"kind":"Name","value":"planId"}},{"kind":"Field","name":{"kind":"Name","value":"userId"}}]}},{"kind":"Field","name":{"kind":"Name","value":"accessLevel"}},{"kind":"Field","name":{"kind":"Name","value":"user"},"selectionSet":{"kind":"SelectionSet","selections":[{"kind":"Field","name":{"kind":"Name","value":"givenName"}},{"kind":"Field","name":{"kind":"Name","value":"id"}},{"kind":"Field","name":{"kind":"Name","value":"surName"}}]}}]}}]}}]} as unknown as DocumentNode<UpdateProjectCollaboratorMutation, UpdateProjectCollaboratorMutationVariables>;
export const RemoveProjectCollaboratorDocument = {"kind":"Document","definitions":[{"kind":"OperationDefinition","operation":"mutation","name":{"kind":"Name","value":"RemoveProjectCollaborator"},"variableDefinitions":[{"kind":"VariableDefinition","variable":{"kind":"Variable","name":{"kind":"Name","value":"projectCollaboratorId"}},"type":{"kind":"NonNullType","type":{"kind":"NamedType","name":{"kind":"Name","value":"Int"}}}}],"selectionSet":{"kind":"SelectionSet","selections":[{"kind":"Field","name":{"kind":"Name","value":"removeProjectCollaborator"},"arguments":[{"kind":"Argument","name":{"kind":"Name","value":"projectCollaboratorId"},"value":{"kind":"Variable","name":{"kind":"Name","value":"projectCollaboratorId"}}}],"selectionSet":{"kind":"SelectionSet","selections":[{"kind":"Field","name":{"kind":"Name","value":"id"}},{"kind":"Field","name":{"kind":"Name","value":"errors"},"selectionSet":{"kind":"SelectionSet","selections":[{"kind":"Field","name":{"kind":"Name","value":"accessLevel"}},{"kind":"Field","name":{"kind":"Name","value":"email"}},{"kind":"Field","name":{"kind":"Name","value":"general"}},{"kind":"Field","name":{"kind":"Name","value":"invitedById"}},{"kind":"Field","name":{"kind":"Name","value":"planId"}},{"kind":"Field","name":{"kind":"Name","value":"userId"}}]}},{"kind":"Field","name":{"kind":"Name","value":"user"},"selectionSet":{"kind":"SelectionSet","selections":[{"kind":"Field","name":{"kind":"Name","value":"givenName"}},{"kind":"Field","name":{"kind":"Name","value":"id"}},{"kind":"Field","name":{"kind":"Name","value":"surName"}}]}}]}}]}}]} as unknown as DocumentNode<RemoveProjectCollaboratorMutation, RemoveProjectCollaboratorMutationVariables>;
export const ResendInviteToProjectCollaboratorDocument = {"kind":"Document","definitions":[{"kind":"OperationDefinition","operation":"mutation","name":{"kind":"Name","value":"ResendInviteToProjectCollaborator"},"variableDefinitions":[{"kind":"VariableDefinition","variable":{"kind":"Variable","name":{"kind":"Name","value":"projectCollaboratorId"}},"type":{"kind":"NonNullType","type":{"kind":"NamedType","name":{"kind":"Name","value":"Int"}}}}],"selectionSet":{"kind":"SelectionSet","selections":[{"kind":"Field","name":{"kind":"Name","value":"resendInviteToProjectCollaborator"},"arguments":[{"kind":"Argument","name":{"kind":"Name","value":"projectCollaboratorId"},"value":{"kind":"Variable","name":{"kind":"Name","value":"projectCollaboratorId"}}}],"selectionSet":{"kind":"SelectionSet","selections":[{"kind":"Field","name":{"kind":"Name","value":"id"}},{"kind":"Field","name":{"kind":"Name","value":"email"}},{"kind":"Field","name":{"kind":"Name","value":"user"},"selectionSet":{"kind":"SelectionSet","selections":[{"kind":"Field","name":{"kind":"Name","value":"id"}},{"kind":"Field","name":{"kind":"Name","value":"givenName"}},{"kind":"Field","name":{"kind":"Name","value":"surName"}}]}},{"kind":"Field","name":{"kind":"Name","value":"errors"},"selectionSet":{"kind":"SelectionSet","selections":[{"kind":"Field","name":{"kind":"Name","value":"accessLevel"}},{"kind":"Field","name":{"kind":"Name","value":"email"}},{"kind":"Field","name":{"kind":"Name","value":"general"}},{"kind":"Field","name":{"kind":"Name","value":"invitedById"}},{"kind":"Field","name":{"kind":"Name","value":"planId"}},{"kind":"Field","name":{"kind":"Name","value":"userId"}}]}}]}}]}}]} as unknown as DocumentNode<ResendInviteToProjectCollaboratorMutation, ResendInviteToProjectCollaboratorMutationVariables>;
export const AddCustomQuestionDocument = {"kind":"Document","definitions":[{"kind":"OperationDefinition","operation":"mutation","name":{"kind":"Name","value":"AddCustomQuestion"},"variableDefinitions":[{"kind":"VariableDefinition","variable":{"kind":"Variable","name":{"kind":"Name","value":"input"}},"type":{"kind":"NonNullType","type":{"kind":"NamedType","name":{"kind":"Name","value":"AddCustomQuestionInput"}}}}],"selectionSet":{"kind":"SelectionSet","selections":[{"kind":"Field","name":{"kind":"Name","value":"addCustomQuestion"},"arguments":[{"kind":"Argument","name":{"kind":"Name","value":"input"},"value":{"kind":"Variable","name":{"kind":"Name","value":"input"}}}],"selectionSet":{"kind":"SelectionSet","selections":[{"kind":"Field","name":{"kind":"Name","value":"errors"},"selectionSet":{"kind":"SelectionSet","selections":[{"kind":"Field","name":{"kind":"Name","value":"general"}},{"kind":"Field","name":{"kind":"Name","value":"guidanceText"}},{"kind":"Field","name":{"kind":"Name","value":"json"}},{"kind":"Field","name":{"kind":"Name","value":"migrationStatus"}},{"kind":"Field","name":{"kind":"Name","value":"pinnedQuestionId"}},{"kind":"Field","name":{"kind":"Name","value":"pinnedQuestionType"}},{"kind":"Field","name":{"kind":"Name","value":"questionText"}},{"kind":"Field","name":{"kind":"Name","value":"required"}},{"kind":"Field","name":{"kind":"Name","value":"requirementText"}},{"kind":"Field","name":{"kind":"Name","value":"sampleText"}},{"kind":"Field","name":{"kind":"Name","value":"templateCustomizationId"}},{"kind":"Field","name":{"kind":"Name","value":"useSampleTextAsDefault"}},{"kind":"Field","name":{"kind":"Name","value":"sectionType"}}]}},{"kind":"Field","name":{"kind":"Name","value":"guidanceText"}},{"kind":"Field","name":{"kind":"Name","value":"id"}},{"kind":"Field","name":{"kind":"Name","value":"json"}},{"kind":"Field","name":{"kind":"Name","value":"migrationStatus"}},{"kind":"Field","name":{"kind":"Name","value":"modified"}},{"kind":"Field","name":{"kind":"Name","value":"pinnedQuestionId"}},{"kind":"Field","name":{"kind":"Name","value":"pinnedQuestionType"}},{"kind":"Field","name":{"kind":"Name","value":"questionText"}},{"kind":"Field","name":{"kind":"Name","value":"required"}},{"kind":"Field","name":{"kind":"Name","value":"requirementText"}},{"kind":"Field","name":{"kind":"Name","value":"sampleText"}},{"kind":"Field","name":{"kind":"Name","value":"sectionType"}},{"kind":"Field","name":{"kind":"Name","value":"templateCustomizationId"}},{"kind":"Field","name":{"kind":"Name","value":"useSampleTextAsDefault"}}]}}]}}]} as unknown as DocumentNode<AddCustomQuestionMutation, AddCustomQuestionMutationVariables>;
export const UpdateCustomQuestionDocument = {"kind":"Document","definitions":[{"kind":"OperationDefinition","operation":"mutation","name":{"kind":"Name","value":"UpdateCustomQuestion"},"variableDefinitions":[{"kind":"VariableDefinition","variable":{"kind":"Variable","name":{"kind":"Name","value":"input"}},"type":{"kind":"NonNullType","type":{"kind":"NamedType","name":{"kind":"Name","value":"UpdateCustomQuestionInput"}}}}],"selectionSet":{"kind":"SelectionSet","selections":[{"kind":"Field","name":{"kind":"Name","value":"updateCustomQuestion"},"arguments":[{"kind":"Argument","name":{"kind":"Name","value":"input"},"value":{"kind":"Variable","name":{"kind":"Name","value":"input"}}}],"selectionSet":{"kind":"SelectionSet","selections":[{"kind":"Field","name":{"kind":"Name","value":"id"}},{"kind":"Field","name":{"kind":"Name","value":"guidanceText"}},{"kind":"Field","name":{"kind":"Name","value":"errors"},"selectionSet":{"kind":"SelectionSet","selections":[{"kind":"Field","name":{"kind":"Name","value":"general"}},{"kind":"Field","name":{"kind":"Name","value":"guidanceText"}},{"kind":"Field","name":{"kind":"Name","value":"questionText"}},{"kind":"Field","name":{"kind":"Name","value":"sampleText"}},{"kind":"Field","name":{"kind":"Name","value":"requirementText"}},{"kind":"Field","name":{"kind":"Name","value":"useSampleTextAsDefault"}}]}},{"kind":"Field","name":{"kind":"Name","value":"json"}},{"kind":"Field","name":{"kind":"Name","value":"migrationStatus"}},{"kind":"Field","name":{"kind":"Name","value":"modified"}},{"kind":"Field","name":{"kind":"Name","value":"pinnedQuestionId"}},{"kind":"Field","name":{"kind":"Name","value":"pinnedQuestionType"}},{"kind":"Field","name":{"kind":"Name","value":"questionText"}},{"kind":"Field","name":{"kind":"Name","value":"required"}},{"kind":"Field","name":{"kind":"Name","value":"requirementText"}},{"kind":"Field","name":{"kind":"Name","value":"sampleText"}},{"kind":"Field","name":{"kind":"Name","value":"sectionId"}},{"kind":"Field","name":{"kind":"Name","value":"sectionType"}},{"kind":"Field","name":{"kind":"Name","value":"templateCustomizationId"}},{"kind":"Field","name":{"kind":"Name","value":"useSampleTextAsDefault"}}]}}]}}]} as unknown as DocumentNode<UpdateCustomQuestionMutation, UpdateCustomQuestionMutationVariables>;
export const RemoveCustomQuestionDocument = {"kind":"Document","definitions":[{"kind":"OperationDefinition","operation":"mutation","name":{"kind":"Name","value":"RemoveCustomQuestion"},"variableDefinitions":[{"kind":"VariableDefinition","variable":{"kind":"Variable","name":{"kind":"Name","value":"customQuestionId"}},"type":{"kind":"NonNullType","type":{"kind":"NamedType","name":{"kind":"Name","value":"Int"}}}}],"selectionSet":{"kind":"SelectionSet","selections":[{"kind":"Field","name":{"kind":"Name","value":"removeCustomQuestion"},"arguments":[{"kind":"Argument","name":{"kind":"Name","value":"customQuestionId"},"value":{"kind":"Variable","name":{"kind":"Name","value":"customQuestionId"}}}],"selectionSet":{"kind":"SelectionSet","selections":[{"kind":"Field","name":{"kind":"Name","value":"id"}},{"kind":"Field","name":{"kind":"Name","value":"guidanceText"}},{"kind":"Field","name":{"kind":"Name","value":"errors"},"selectionSet":{"kind":"SelectionSet","selections":[{"kind":"Field","name":{"kind":"Name","value":"guidanceText"}},{"kind":"Field","name":{"kind":"Name","value":"general"}},{"kind":"Field","name":{"kind":"Name","value":"json"}},{"kind":"Field","name":{"kind":"Name","value":"migrationStatus"}},{"kind":"Field","name":{"kind":"Name","value":"pinnedQuestionId"}},{"kind":"Field","name":{"kind":"Name","value":"pinnedQuestionType"}},{"kind":"Field","name":{"kind":"Name","value":"questionText"}},{"kind":"Field","name":{"kind":"Name","value":"requirementText"}},{"kind":"Field","name":{"kind":"Name","value":"sampleText"}},{"kind":"Field","name":{"kind":"Name","value":"useSampleTextAsDefault"}}]}},{"kind":"Field","name":{"kind":"Name","value":"json"}},{"kind":"Field","name":{"kind":"Name","value":"migrationStatus"}},{"kind":"Field","name":{"kind":"Name","value":"modified"}},{"kind":"Field","name":{"kind":"Name","value":"pinnedQuestionId"}},{"kind":"Field","name":{"kind":"Name","value":"pinnedQuestionType"}},{"kind":"Field","name":{"kind":"Name","value":"questionText"}},{"kind":"Field","name":{"kind":"Name","value":"required"}},{"kind":"Field","name":{"kind":"Name","value":"requirementText"}},{"kind":"Field","name":{"kind":"Name","value":"sampleText"}},{"kind":"Field","name":{"kind":"Name","value":"useSampleTextAsDefault"}},{"kind":"Field","name":{"kind":"Name","value":"templateCustomizationId"}},{"kind":"Field","name":{"kind":"Name","value":"sectionId"}}]}}]}}]} as unknown as DocumentNode<RemoveCustomQuestionMutation, RemoveCustomQuestionMutationVariables>;
export const AddCustomSectionDocument = {"kind":"Document","definitions":[{"kind":"OperationDefinition","operation":"mutation","name":{"kind":"Name","value":"AddCustomSection"},"variableDefinitions":[{"kind":"VariableDefinition","variable":{"kind":"Variable","name":{"kind":"Name","value":"input"}},"type":{"kind":"NonNullType","type":{"kind":"NamedType","name":{"kind":"Name","value":"AddCustomSectionInput"}}}}],"selectionSet":{"kind":"SelectionSet","selections":[{"kind":"Field","name":{"kind":"Name","value":"addCustomSection"},"arguments":[{"kind":"Argument","name":{"kind":"Name","value":"input"},"value":{"kind":"Variable","name":{"kind":"Name","value":"input"}}}],"selectionSet":{"kind":"SelectionSet","selections":[{"kind":"Field","name":{"kind":"Name","value":"id"}},{"kind":"Field","name":{"kind":"Name","value":"guidance"}},{"kind":"Field","name":{"kind":"Name","value":"errors"},"selectionSet":{"kind":"SelectionSet","selections":[{"kind":"Field","name":{"kind":"Name","value":"general"}},{"kind":"Field","name":{"kind":"Name","value":"guidance"}},{"kind":"Field","name":{"kind":"Name","value":"introduction"}},{"kind":"Field","name":{"kind":"Name","value":"name"}},{"kind":"Field","name":{"kind":"Name","value":"requirements"}},{"kind":"Field","name":{"kind":"Name","value":"pinnedSectionId"}},{"kind":"Field","name":{"kind":"Name","value":"pinnedSectionType"}},{"kind":"Field","name":{"kind":"Name","value":"templateCustomizationId"}}]}},{"kind":"Field","name":{"kind":"Name","value":"introduction"}},{"kind":"Field","name":{"kind":"Name","value":"migrationStatus"}},{"kind":"Field","name":{"kind":"Name","value":"modified"}},{"kind":"Field","name":{"kind":"Name","value":"name"}},{"kind":"Field","name":{"kind":"Name","value":"pinnedSectionId"}},{"kind":"Field","name":{"kind":"Name","value":"pinnedSectionType"}},{"kind":"Field","name":{"kind":"Name","value":"requirements"}},{"kind":"Field","name":{"kind":"Name","value":"templateCustomizationId"}}]}}]}}]} as unknown as DocumentNode<AddCustomSectionMutation, AddCustomSectionMutationVariables>;
export const UpdateCustomSectionDocument = {"kind":"Document","definitions":[{"kind":"OperationDefinition","operation":"mutation","name":{"kind":"Name","value":"UpdateCustomSection"},"variableDefinitions":[{"kind":"VariableDefinition","variable":{"kind":"Variable","name":{"kind":"Name","value":"input"}},"type":{"kind":"NonNullType","type":{"kind":"NamedType","name":{"kind":"Name","value":"UpdateCustomSectionInput"}}}}],"selectionSet":{"kind":"SelectionSet","selections":[{"kind":"Field","name":{"kind":"Name","value":"updateCustomSection"},"arguments":[{"kind":"Argument","name":{"kind":"Name","value":"input"},"value":{"kind":"Variable","name":{"kind":"Name","value":"input"}}}],"selectionSet":{"kind":"SelectionSet","selections":[{"kind":"Field","name":{"kind":"Name","value":"id"}},{"kind":"Field","name":{"kind":"Name","value":"guidance"}},{"kind":"Field","name":{"kind":"Name","value":"errors"},"selectionSet":{"kind":"SelectionSet","selections":[{"kind":"Field","name":{"kind":"Name","value":"general"}},{"kind":"Field","name":{"kind":"Name","value":"guidance"}},{"kind":"Field","name":{"kind":"Name","value":"introduction"}},{"kind":"Field","name":{"kind":"Name","value":"name"}},{"kind":"Field","name":{"kind":"Name","value":"requirements"}}]}},{"kind":"Field","name":{"kind":"Name","value":"introduction"}},{"kind":"Field","name":{"kind":"Name","value":"migrationStatus"}},{"kind":"Field","name":{"kind":"Name","value":"modified"}},{"kind":"Field","name":{"kind":"Name","value":"name"}},{"kind":"Field","name":{"kind":"Name","value":"pinnedSectionId"}},{"kind":"Field","name":{"kind":"Name","value":"pinnedSectionType"}},{"kind":"Field","name":{"kind":"Name","value":"requirements"}},{"kind":"Field","name":{"kind":"Name","value":"templateCustomizationId"}}]}}]}}]} as unknown as DocumentNode<UpdateCustomSectionMutation, UpdateCustomSectionMutationVariables>;
export const RemoveCustomSectionDocument = {"kind":"Document","definitions":[{"kind":"OperationDefinition","operation":"mutation","name":{"kind":"Name","value":"RemoveCustomSection"},"variableDefinitions":[{"kind":"VariableDefinition","variable":{"kind":"Variable","name":{"kind":"Name","value":"customSectionId"}},"type":{"kind":"NonNullType","type":{"kind":"NamedType","name":{"kind":"Name","value":"Int"}}}}],"selectionSet":{"kind":"SelectionSet","selections":[{"kind":"Field","name":{"kind":"Name","value":"removeCustomSection"},"arguments":[{"kind":"Argument","name":{"kind":"Name","value":"customSectionId"},"value":{"kind":"Variable","name":{"kind":"Name","value":"customSectionId"}}}],"selectionSet":{"kind":"SelectionSet","selections":[{"kind":"Field","name":{"kind":"Name","value":"id"}},{"kind":"Field","name":{"kind":"Name","value":"guidance"}},{"kind":"Field","name":{"kind":"Name","value":"introduction"}},{"kind":"Field","name":{"kind":"Name","value":"migrationStatus"}},{"kind":"Field","name":{"kind":"Name","value":"modified"}},{"kind":"Field","name":{"kind":"Name","value":"name"}},{"kind":"Field","name":{"kind":"Name","value":"pinnedSectionId"}},{"kind":"Field","name":{"kind":"Name","value":"pinnedSectionType"}},{"kind":"Field","name":{"kind":"Name","value":"requirements"}},{"kind":"Field","name":{"kind":"Name","value":"templateCustomizationId"}},{"kind":"Field","name":{"kind":"Name","value":"errors"},"selectionSet":{"kind":"SelectionSet","selections":[{"kind":"Field","name":{"kind":"Name","value":"general"}}]}}]}}]}}]} as unknown as DocumentNode<RemoveCustomSectionMutation, RemoveCustomSectionMutationVariables>;
export const RemoveFeedbackCommentDocument = {"kind":"Document","definitions":[{"kind":"OperationDefinition","operation":"mutation","name":{"kind":"Name","value":"RemoveFeedbackComment"},"variableDefinitions":[{"kind":"VariableDefinition","variable":{"kind":"Variable","name":{"kind":"Name","value":"planId"}},"type":{"kind":"NonNullType","type":{"kind":"NamedType","name":{"kind":"Name","value":"Int"}}}},{"kind":"VariableDefinition","variable":{"kind":"Variable","name":{"kind":"Name","value":"planFeedbackCommentId"}},"type":{"kind":"NonNullType","type":{"kind":"NamedType","name":{"kind":"Name","value":"Int"}}}}],"selectionSet":{"kind":"SelectionSet","selections":[{"kind":"Field","name":{"kind":"Name","value":"removeFeedbackComment"},"arguments":[{"kind":"Argument","name":{"kind":"Name","value":"planId"},"value":{"kind":"Variable","name":{"kind":"Name","value":"planId"}}},{"kind":"Argument","name":{"kind":"Name","value":"planFeedbackCommentId"},"value":{"kind":"Variable","name":{"kind":"Name","value":"planFeedbackCommentId"}}}],"selectionSet":{"kind":"SelectionSet","selections":[{"kind":"Field","name":{"kind":"Name","value":"id"}},{"kind":"Field","name":{"kind":"Name","value":"errors"},"selectionSet":{"kind":"SelectionSet","selections":[{"kind":"Field","name":{"kind":"Name","value":"general"}}]}},{"kind":"Field","name":{"kind":"Name","value":"answerId"}},{"kind":"Field","name":{"kind":"Name","value":"commentText"}}]}}]}}]} as unknown as DocumentNode<RemoveFeedbackCommentMutation, RemoveFeedbackCommentMutationVariables>;
export const UpdateFeedbackCommentDocument = {"kind":"Document","definitions":[{"kind":"OperationDefinition","operation":"mutation","name":{"kind":"Name","value":"UpdateFeedbackComment"},"variableDefinitions":[{"kind":"VariableDefinition","variable":{"kind":"Variable","name":{"kind":"Name","value":"planId"}},"type":{"kind":"NonNullType","type":{"kind":"NamedType","name":{"kind":"Name","value":"Int"}}}},{"kind":"VariableDefinition","variable":{"kind":"Variable","name":{"kind":"Name","value":"planFeedbackCommentId"}},"type":{"kind":"NonNullType","type":{"kind":"NamedType","name":{"kind":"Name","value":"Int"}}}},{"kind":"VariableDefinition","variable":{"kind":"Variable","name":{"kind":"Name","value":"commentText"}},"type":{"kind":"NonNullType","type":{"kind":"NamedType","name":{"kind":"Name","value":"String"}}}}],"selectionSet":{"kind":"SelectionSet","selections":[{"kind":"Field","name":{"kind":"Name","value":"updateFeedbackComment"},"arguments":[{"kind":"Argument","name":{"kind":"Name","value":"planId"},"value":{"kind":"Variable","name":{"kind":"Name","value":"planId"}}},{"kind":"Argument","name":{"kind":"Name","value":"planFeedbackCommentId"},"value":{"kind":"Variable","name":{"kind":"Name","value":"planFeedbackCommentId"}}},{"kind":"Argument","name":{"kind":"Name","value":"commentText"},"value":{"kind":"Variable","name":{"kind":"Name","value":"commentText"}}}],"selectionSet":{"kind":"SelectionSet","selections":[{"kind":"Field","name":{"kind":"Name","value":"answerId"}},{"kind":"Field","name":{"kind":"Name","value":"commentText"}},{"kind":"Field","name":{"kind":"Name","value":"id"}},{"kind":"Field","name":{"kind":"Name","value":"errors"},"selectionSet":{"kind":"SelectionSet","selections":[{"kind":"Field","name":{"kind":"Name","value":"general"}}]}}]}}]}}]} as unknown as DocumentNode<UpdateFeedbackCommentMutation, UpdateFeedbackCommentMutationVariables>;
export const AddFeedbackCommentDocument = {"kind":"Document","definitions":[{"kind":"OperationDefinition","operation":"mutation","name":{"kind":"Name","value":"AddFeedbackComment"},"variableDefinitions":[{"kind":"VariableDefinition","variable":{"kind":"Variable","name":{"kind":"Name","value":"planId"}},"type":{"kind":"NonNullType","type":{"kind":"NamedType","name":{"kind":"Name","value":"Int"}}}},{"kind":"VariableDefinition","variable":{"kind":"Variable","name":{"kind":"Name","value":"planFeedbackId"}},"type":{"kind":"NonNullType","type":{"kind":"NamedType","name":{"kind":"Name","value":"Int"}}}},{"kind":"VariableDefinition","variable":{"kind":"Variable","name":{"kind":"Name","value":"answerId"}},"type":{"kind":"NonNullType","type":{"kind":"NamedType","name":{"kind":"Name","value":"Int"}}}},{"kind":"VariableDefinition","variable":{"kind":"Variable","name":{"kind":"Name","value":"commentText"}},"type":{"kind":"NonNullType","type":{"kind":"NamedType","name":{"kind":"Name","value":"String"}}}}],"selectionSet":{"kind":"SelectionSet","selections":[{"kind":"Field","name":{"kind":"Name","value":"addFeedbackComment"},"arguments":[{"kind":"Argument","name":{"kind":"Name","value":"planId"},"value":{"kind":"Variable","name":{"kind":"Name","value":"planId"}}},{"kind":"Argument","name":{"kind":"Name","value":"planFeedbackId"},"value":{"kind":"Variable","name":{"kind":"Name","value":"planFeedbackId"}}},{"kind":"Argument","name":{"kind":"Name","value":"answerId"},"value":{"kind":"Variable","name":{"kind":"Name","value":"answerId"}}},{"kind":"Argument","name":{"kind":"Name","value":"commentText"},"value":{"kind":"Variable","name":{"kind":"Name","value":"commentText"}}}],"selectionSet":{"kind":"SelectionSet","selections":[{"kind":"Field","name":{"kind":"Name","value":"id"}},{"kind":"Field","name":{"kind":"Name","value":"answerId"}},{"kind":"Field","name":{"kind":"Name","value":"commentText"}},{"kind":"Field","name":{"kind":"Name","value":"errors"},"selectionSet":{"kind":"SelectionSet","selections":[{"kind":"Field","name":{"kind":"Name","value":"general"}}]}}]}}]}}]} as unknown as DocumentNode<AddFeedbackCommentMutation, AddFeedbackCommentMutationVariables>;
export const RequestFeedbackDocument = {"kind":"Document","definitions":[{"kind":"OperationDefinition","operation":"mutation","name":{"kind":"Name","value":"RequestFeedback"},"variableDefinitions":[{"kind":"VariableDefinition","variable":{"kind":"Variable","name":{"kind":"Name","value":"planId"}},"type":{"kind":"NonNullType","type":{"kind":"NamedType","name":{"kind":"Name","value":"Int"}}}},{"kind":"VariableDefinition","variable":{"kind":"Variable","name":{"kind":"Name","value":"messageToOrg"}},"type":{"kind":"NamedType","name":{"kind":"Name","value":"String"}}}],"selectionSet":{"kind":"SelectionSet","selections":[{"kind":"Field","name":{"kind":"Name","value":"requestFeedback"},"arguments":[{"kind":"Argument","name":{"kind":"Name","value":"planId"},"value":{"kind":"Variable","name":{"kind":"Name","value":"planId"}}},{"kind":"Argument","name":{"kind":"Name","value":"messageToOrg"},"value":{"kind":"Variable","name":{"kind":"Name","value":"messageToOrg"}}}],"selectionSet":{"kind":"SelectionSet","selections":[{"kind":"Field","name":{"kind":"Name","value":"feedbackComments"},"selectionSet":{"kind":"SelectionSet","selections":[{"kind":"Field","name":{"kind":"Name","value":"commentText"}},{"kind":"Field","name":{"kind":"Name","value":"answerId"}},{"kind":"Field","name":{"kind":"Name","value":"id"}}]}},{"kind":"Field","name":{"kind":"Name","value":"errors"},"selectionSet":{"kind":"SelectionSet","selections":[{"kind":"Field","name":{"kind":"Name","value":"feedbackComments"}},{"kind":"Field","name":{"kind":"Name","value":"general"}},{"kind":"Field","name":{"kind":"Name","value":"planId"}}]}},{"kind":"Field","name":{"kind":"Name","value":"id"}},{"kind":"Field","name":{"kind":"Name","value":"completed"}},{"kind":"Field","name":{"kind":"Name","value":"completedBy"},"selectionSet":{"kind":"SelectionSet","selections":[{"kind":"Field","name":{"kind":"Name","value":"id"}},{"kind":"Field","name":{"kind":"Name","value":"email"}}]}},{"kind":"Field","name":{"kind":"Name","value":"messageToOrg"}}]}}]}}]} as unknown as DocumentNode<RequestFeedbackMutation, RequestFeedbackMutationVariables>;
export const CompleteFeedbackDocument = {"kind":"Document","definitions":[{"kind":"OperationDefinition","operation":"mutation","name":{"kind":"Name","value":"CompleteFeedback"},"variableDefinitions":[{"kind":"VariableDefinition","variable":{"kind":"Variable","name":{"kind":"Name","value":"planId"}},"type":{"kind":"NonNullType","type":{"kind":"NamedType","name":{"kind":"Name","value":"Int"}}}},{"kind":"VariableDefinition","variable":{"kind":"Variable","name":{"kind":"Name","value":"planFeedbackId"}},"type":{"kind":"NonNullType","type":{"kind":"NamedType","name":{"kind":"Name","value":"Int"}}}}],"selectionSet":{"kind":"SelectionSet","selections":[{"kind":"Field","name":{"kind":"Name","value":"completeFeedback"},"arguments":[{"kind":"Argument","name":{"kind":"Name","value":"planId"},"value":{"kind":"Variable","name":{"kind":"Name","value":"planId"}}},{"kind":"Argument","name":{"kind":"Name","value":"planFeedbackId"},"value":{"kind":"Variable","name":{"kind":"Name","value":"planFeedbackId"}}}],"selectionSet":{"kind":"SelectionSet","selections":[{"kind":"Field","name":{"kind":"Name","value":"id"}},{"kind":"Field","name":{"kind":"Name","value":"errors"},"selectionSet":{"kind":"SelectionSet","selections":[{"kind":"Field","name":{"kind":"Name","value":"general"}}]}}]}}]}}]} as unknown as DocumentNode<CompleteFeedbackMutation, CompleteFeedbackMutationVariables>;
export const AddGuidanceDocument = {"kind":"Document","definitions":[{"kind":"OperationDefinition","operation":"mutation","name":{"kind":"Name","value":"AddGuidance"},"variableDefinitions":[{"kind":"VariableDefinition","variable":{"kind":"Variable","name":{"kind":"Name","value":"input"}},"type":{"kind":"NonNullType","type":{"kind":"NamedType","name":{"kind":"Name","value":"AddGuidanceInput"}}}}],"selectionSet":{"kind":"SelectionSet","selections":[{"kind":"Field","name":{"kind":"Name","value":"addGuidance"},"arguments":[{"kind":"Argument","name":{"kind":"Name","value":"input"},"value":{"kind":"Variable","name":{"kind":"Name","value":"input"}}}],"selectionSet":{"kind":"SelectionSet","selections":[{"kind":"Field","name":{"kind":"Name","value":"id"}},{"kind":"Field","name":{"kind":"Name","value":"guidanceText"}},{"kind":"Field","name":{"kind":"Name","value":"tagId"}},{"kind":"Field","name":{"kind":"Name","value":"errors"},"selectionSet":{"kind":"SelectionSet","selections":[{"kind":"Field","name":{"kind":"Name","value":"general"}},{"kind":"Field","name":{"kind":"Name","value":"guidanceGroupId"}},{"kind":"Field","name":{"kind":"Name","value":"guidanceText"}}]}}]}}]}}]} as unknown as DocumentNode<AddGuidanceMutation, AddGuidanceMutationVariables>;
export const UpdateGuidanceDocument = {"kind":"Document","definitions":[{"kind":"OperationDefinition","operation":"mutation","name":{"kind":"Name","value":"UpdateGuidance"},"variableDefinitions":[{"kind":"VariableDefinition","variable":{"kind":"Variable","name":{"kind":"Name","value":"input"}},"type":{"kind":"NonNullType","type":{"kind":"NamedType","name":{"kind":"Name","value":"UpdateGuidanceInput"}}}}],"selectionSet":{"kind":"SelectionSet","selections":[{"kind":"Field","name":{"kind":"Name","value":"updateGuidance"},"arguments":[{"kind":"Argument","name":{"kind":"Name","value":"input"},"value":{"kind":"Variable","name":{"kind":"Name","value":"input"}}}],"selectionSet":{"kind":"SelectionSet","selections":[{"kind":"Field","name":{"kind":"Name","value":"id"}},{"kind":"Field","name":{"kind":"Name","value":"guidanceText"}},{"kind":"Field","name":{"kind":"Name","value":"tagId"}},{"kind":"Field","name":{"kind":"Name","value":"errors"},"selectionSet":{"kind":"SelectionSet","selections":[{"kind":"Field","name":{"kind":"Name","value":"general"}},{"kind":"Field","name":{"kind":"Name","value":"guidanceGroupId"}},{"kind":"Field","name":{"kind":"Name","value":"guidanceText"}}]}}]}}]}}]} as unknown as DocumentNode<UpdateGuidanceMutation, UpdateGuidanceMutationVariables>;
export const AddPlanGuidanceDocument = {"kind":"Document","definitions":[{"kind":"OperationDefinition","operation":"mutation","name":{"kind":"Name","value":"AddPlanGuidance"},"variableDefinitions":[{"kind":"VariableDefinition","variable":{"kind":"Variable","name":{"kind":"Name","value":"planId"}},"type":{"kind":"NonNullType","type":{"kind":"NamedType","name":{"kind":"Name","value":"Int"}}}},{"kind":"VariableDefinition","variable":{"kind":"Variable","name":{"kind":"Name","value":"affiliationId"}},"type":{"kind":"NonNullType","type":{"kind":"NamedType","name":{"kind":"Name","value":"String"}}}}],"selectionSet":{"kind":"SelectionSet","selections":[{"kind":"Field","name":{"kind":"Name","value":"addPlanGuidance"},"arguments":[{"kind":"Argument","name":{"kind":"Name","value":"planId"},"value":{"kind":"Variable","name":{"kind":"Name","value":"planId"}}},{"kind":"Argument","name":{"kind":"Name","value":"affiliationId"},"value":{"kind":"Variable","name":{"kind":"Name","value":"affiliationId"}}}],"selectionSet":{"kind":"SelectionSet","selections":[{"kind":"Field","name":{"kind":"Name","value":"id"}},{"kind":"Field","name":{"kind":"Name","value":"planId"}},{"kind":"Field","name":{"kind":"Name","value":"affiliationId"}}]}}]}}]} as unknown as DocumentNode<AddPlanGuidanceMutation, AddPlanGuidanceMutationVariables>;
export const RemovePlanGuidanceDocument = {"kind":"Document","definitions":[{"kind":"OperationDefinition","operation":"mutation","name":{"kind":"Name","value":"RemovePlanGuidance"},"variableDefinitions":[{"kind":"VariableDefinition","variable":{"kind":"Variable","name":{"kind":"Name","value":"planId"}},"type":{"kind":"NonNullType","type":{"kind":"NamedType","name":{"kind":"Name","value":"Int"}}}},{"kind":"VariableDefinition","variable":{"kind":"Variable","name":{"kind":"Name","value":"affiliationId"}},"type":{"kind":"NonNullType","type":{"kind":"NamedType","name":{"kind":"Name","value":"String"}}}}],"selectionSet":{"kind":"SelectionSet","selections":[{"kind":"Field","name":{"kind":"Name","value":"removePlanGuidance"},"arguments":[{"kind":"Argument","name":{"kind":"Name","value":"planId"},"value":{"kind":"Variable","name":{"kind":"Name","value":"planId"}}},{"kind":"Argument","name":{"kind":"Name","value":"affiliationId"},"value":{"kind":"Variable","name":{"kind":"Name","value":"affiliationId"}}}],"selectionSet":{"kind":"SelectionSet","selections":[{"kind":"Field","name":{"kind":"Name","value":"id"}},{"kind":"Field","name":{"kind":"Name","value":"planId"}},{"kind":"Field","name":{"kind":"Name","value":"userId"}},{"kind":"Field","name":{"kind":"Name","value":"affiliationId"}}]}}]}}]} as unknown as DocumentNode<RemovePlanGuidanceMutation, RemovePlanGuidanceMutationVariables>;
export const AddGuidanceGroupDocument = {"kind":"Document","definitions":[{"kind":"OperationDefinition","operation":"mutation","name":{"kind":"Name","value":"AddGuidanceGroup"},"variableDefinitions":[{"kind":"VariableDefinition","variable":{"kind":"Variable","name":{"kind":"Name","value":"input"}},"type":{"kind":"NonNullType","type":{"kind":"NamedType","name":{"kind":"Name","value":"AddGuidanceGroupInput"}}}}],"selectionSet":{"kind":"SelectionSet","selections":[{"kind":"Field","name":{"kind":"Name","value":"addGuidanceGroup"},"arguments":[{"kind":"Argument","name":{"kind":"Name","value":"input"},"value":{"kind":"Variable","name":{"kind":"Name","value":"input"}}}],"selectionSet":{"kind":"SelectionSet","selections":[{"kind":"Field","name":{"kind":"Name","value":"name"}},{"kind":"Field","name":{"kind":"Name","value":"id"}},{"kind":"Field","name":{"kind":"Name","value":"errors"},"selectionSet":{"kind":"SelectionSet","selections":[{"kind":"Field","name":{"kind":"Name","value":"affiliationId"}},{"kind":"Field","name":{"kind":"Name","value":"bestPractice"}},{"kind":"Field","name":{"kind":"Name","value":"general"}},{"kind":"Field","name":{"kind":"Name","value":"name"}}]}}]}}]}}]} as unknown as DocumentNode<AddGuidanceGroupMutation, AddGuidanceGroupMutationVariables>;
export const PublishGuidanceGroupDocument = {"kind":"Document","definitions":[{"kind":"OperationDefinition","operation":"mutation","name":{"kind":"Name","value":"PublishGuidanceGroup"},"variableDefinitions":[{"kind":"VariableDefinition","variable":{"kind":"Variable","name":{"kind":"Name","value":"guidanceGroupId"}},"type":{"kind":"NonNullType","type":{"kind":"NamedType","name":{"kind":"Name","value":"Int"}}}}],"selectionSet":{"kind":"SelectionSet","selections":[{"kind":"Field","name":{"kind":"Name","value":"publishGuidanceGroup"},"arguments":[{"kind":"Argument","name":{"kind":"Name","value":"guidanceGroupId"},"value":{"kind":"Variable","name":{"kind":"Name","value":"guidanceGroupId"}}}],"selectionSet":{"kind":"SelectionSet","selections":[{"kind":"Field","name":{"kind":"Name","value":"id"}},{"kind":"Field","name":{"kind":"Name","value":"name"}},{"kind":"Field","name":{"kind":"Name","value":"errors"},"selectionSet":{"kind":"SelectionSet","selections":[{"kind":"Field","name":{"kind":"Name","value":"general"}},{"kind":"Field","name":{"kind":"Name","value":"affiliationId"}},{"kind":"Field","name":{"kind":"Name","value":"bestPractice"}},{"kind":"Field","name":{"kind":"Name","value":"name"}},{"kind":"Field","name":{"kind":"Name","value":"description"}}]}}]}}]}}]} as unknown as DocumentNode<PublishGuidanceGroupMutation, PublishGuidanceGroupMutationVariables>;
export const UpdateGuidanceGroupDocument = {"kind":"Document","definitions":[{"kind":"OperationDefinition","operation":"mutation","name":{"kind":"Name","value":"UpdateGuidanceGroup"},"variableDefinitions":[{"kind":"VariableDefinition","variable":{"kind":"Variable","name":{"kind":"Name","value":"input"}},"type":{"kind":"NonNullType","type":{"kind":"NamedType","name":{"kind":"Name","value":"UpdateGuidanceGroupInput"}}}}],"selectionSet":{"kind":"SelectionSet","selections":[{"kind":"Field","name":{"kind":"Name","value":"updateGuidanceGroup"},"arguments":[{"kind":"Argument","name":{"kind":"Name","value":"input"},"value":{"kind":"Variable","name":{"kind":"Name","value":"input"}}}],"selectionSet":{"kind":"SelectionSet","selections":[{"kind":"Field","name":{"kind":"Name","value":"id"}},{"kind":"Field","name":{"kind":"Name","value":"name"}},{"kind":"Field","name":{"kind":"Name","value":"description"}},{"kind":"Field","name":{"kind":"Name","value":"bestPractice"}},{"kind":"Field","name":{"kind":"Name","value":"errors"},"selectionSet":{"kind":"SelectionSet","selections":[{"kind":"Field","name":{"kind":"Name","value":"affiliationId"}},{"kind":"Field","name":{"kind":"Name","value":"bestPractice"}},{"kind":"Field","name":{"kind":"Name","value":"general"}},{"kind":"Field","name":{"kind":"Name","value":"name"}},{"kind":"Field","name":{"kind":"Name","value":"description"}}]}}]}}]}}]} as unknown as DocumentNode<UpdateGuidanceGroupMutation, UpdateGuidanceGroupMutationVariables>;
export const UnpublishGuidanceGroupDocument = {"kind":"Document","definitions":[{"kind":"OperationDefinition","operation":"mutation","name":{"kind":"Name","value":"UnpublishGuidanceGroup"},"variableDefinitions":[{"kind":"VariableDefinition","variable":{"kind":"Variable","name":{"kind":"Name","value":"guidanceGroupId"}},"type":{"kind":"NonNullType","type":{"kind":"NamedType","name":{"kind":"Name","value":"Int"}}}}],"selectionSet":{"kind":"SelectionSet","selections":[{"kind":"Field","name":{"kind":"Name","value":"unpublishGuidanceGroup"},"arguments":[{"kind":"Argument","name":{"kind":"Name","value":"guidanceGroupId"},"value":{"kind":"Variable","name":{"kind":"Name","value":"guidanceGroupId"}}}],"selectionSet":{"kind":"SelectionSet","selections":[{"kind":"Field","name":{"kind":"Name","value":"id"}},{"kind":"Field","name":{"kind":"Name","value":"name"}},{"kind":"Field","name":{"kind":"Name","value":"errors"},"selectionSet":{"kind":"SelectionSet","selections":[{"kind":"Field","name":{"kind":"Name","value":"affiliationId"}},{"kind":"Field","name":{"kind":"Name","value":"bestPractice"}},{"kind":"Field","name":{"kind":"Name","value":"description"}},{"kind":"Field","name":{"kind":"Name","value":"general"}},{"kind":"Field","name":{"kind":"Name","value":"name"}}]}}]}}]}}]} as unknown as DocumentNode<UnpublishGuidanceGroupMutation, UnpublishGuidanceGroupMutationVariables>;
export const AddMetadataStandardInputDocument = {"kind":"Document","definitions":[{"kind":"OperationDefinition","operation":"mutation","name":{"kind":"Name","value":"AddMetadataStandardInput"},"variableDefinitions":[{"kind":"VariableDefinition","variable":{"kind":"Variable","name":{"kind":"Name","value":"input"}},"type":{"kind":"NonNullType","type":{"kind":"NamedType","name":{"kind":"Name","value":"AddMetadataStandardInput"}}}}],"selectionSet":{"kind":"SelectionSet","selections":[{"kind":"Field","name":{"kind":"Name","value":"addMetadataStandard"},"arguments":[{"kind":"Argument","name":{"kind":"Name","value":"input"},"value":{"kind":"Variable","name":{"kind":"Name","value":"input"}}}],"selectionSet":{"kind":"SelectionSet","selections":[{"kind":"Field","name":{"kind":"Name","value":"id"}},{"kind":"Field","name":{"kind":"Name","value":"errors"},"selectionSet":{"kind":"SelectionSet","selections":[{"kind":"Field","name":{"kind":"Name","value":"description"}},{"kind":"Field","name":{"kind":"Name","value":"general"}},{"kind":"Field","name":{"kind":"Name","value":"keywords"}},{"kind":"Field","name":{"kind":"Name","value":"name"}},{"kind":"Field","name":{"kind":"Name","value":"researchDomainIds"}},{"kind":"Field","name":{"kind":"Name","value":"uri"}}]}},{"kind":"Field","name":{"kind":"Name","value":"description"}},{"kind":"Field","name":{"kind":"Name","value":"keywords"}},{"kind":"Field","name":{"kind":"Name","value":"name"}},{"kind":"Field","name":{"kind":"Name","value":"uri"}}]}}]}}]} as unknown as DocumentNode<AddMetadataStandardInputMutation, AddMetadataStandardInputMutationVariables>;
export const AddPlanDocument = {"kind":"Document","definitions":[{"kind":"OperationDefinition","operation":"mutation","name":{"kind":"Name","value":"AddPlan"},"variableDefinitions":[{"kind":"VariableDefinition","variable":{"kind":"Variable","name":{"kind":"Name","value":"projectId"}},"type":{"kind":"NonNullType","type":{"kind":"NamedType","name":{"kind":"Name","value":"Int"}}}},{"kind":"VariableDefinition","variable":{"kind":"Variable","name":{"kind":"Name","value":"versionedTemplateId"}},"type":{"kind":"NonNullType","type":{"kind":"NamedType","name":{"kind":"Name","value":"Int"}}}}],"selectionSet":{"kind":"SelectionSet","selections":[{"kind":"Field","name":{"kind":"Name","value":"addPlan"},"arguments":[{"kind":"Argument","name":{"kind":"Name","value":"projectId"},"value":{"kind":"Variable","name":{"kind":"Name","value":"projectId"}}},{"kind":"Argument","name":{"kind":"Name","value":"versionedTemplateId"},"value":{"kind":"Variable","name":{"kind":"Name","value":"versionedTemplateId"}}}],"selectionSet":{"kind":"SelectionSet","selections":[{"kind":"Field","name":{"kind":"Name","value":"id"}},{"kind":"Field","name":{"kind":"Name","value":"errors"},"selectionSet":{"kind":"SelectionSet","selections":[{"kind":"Field","name":{"kind":"Name","value":"general"}},{"kind":"Field","name":{"kind":"Name","value":"versionedTemplateId"}},{"kind":"Field","name":{"kind":"Name","value":"projectId"}}]}}]}}]}}]} as unknown as DocumentNode<AddPlanMutation, AddPlanMutationVariables>;
export const AddPlanFundingDocument = {"kind":"Document","definitions":[{"kind":"OperationDefinition","operation":"mutation","name":{"kind":"Name","value":"AddPlanFunding"},"variableDefinitions":[{"kind":"VariableDefinition","variable":{"kind":"Variable","name":{"kind":"Name","value":"planId"}},"type":{"kind":"NonNullType","type":{"kind":"NamedType","name":{"kind":"Name","value":"Int"}}}},{"kind":"VariableDefinition","variable":{"kind":"Variable","name":{"kind":"Name","value":"projectFundingIds"}},"type":{"kind":"NonNullType","type":{"kind":"ListType","type":{"kind":"NonNullType","type":{"kind":"NamedType","name":{"kind":"Name","value":"Int"}}}}}}],"selectionSet":{"kind":"SelectionSet","selections":[{"kind":"Field","name":{"kind":"Name","value":"addPlanFunding"},"arguments":[{"kind":"Argument","name":{"kind":"Name","value":"planId"},"value":{"kind":"Variable","name":{"kind":"Name","value":"planId"}}},{"kind":"Argument","name":{"kind":"Name","value":"projectFundingIds"},"value":{"kind":"Variable","name":{"kind":"Name","value":"projectFundingIds"}}}],"selectionSet":{"kind":"SelectionSet","selections":[{"kind":"Field","name":{"kind":"Name","value":"errors"},"selectionSet":{"kind":"SelectionSet","selections":[{"kind":"Field","name":{"kind":"Name","value":"general"}}]}}]}}]}}]} as unknown as DocumentNode<AddPlanFundingMutation, AddPlanFundingMutationVariables>;
export const AddPlanMemberDocument = {"kind":"Document","definitions":[{"kind":"OperationDefinition","operation":"mutation","name":{"kind":"Name","value":"AddPlanMember"},"variableDefinitions":[{"kind":"VariableDefinition","variable":{"kind":"Variable","name":{"kind":"Name","value":"planId"}},"type":{"kind":"NonNullType","type":{"kind":"NamedType","name":{"kind":"Name","value":"Int"}}}},{"kind":"VariableDefinition","variable":{"kind":"Variable","name":{"kind":"Name","value":"projectMemberId"}},"type":{"kind":"NonNullType","type":{"kind":"NamedType","name":{"kind":"Name","value":"Int"}}}}],"selectionSet":{"kind":"SelectionSet","selections":[{"kind":"Field","name":{"kind":"Name","value":"addPlanMember"},"arguments":[{"kind":"Argument","name":{"kind":"Name","value":"planId"},"value":{"kind":"Variable","name":{"kind":"Name","value":"planId"}}},{"kind":"Argument","name":{"kind":"Name","value":"projectMemberId"},"value":{"kind":"Variable","name":{"kind":"Name","value":"projectMemberId"}}}],"selectionSet":{"kind":"SelectionSet","selections":[{"kind":"Field","name":{"kind":"Name","value":"errors"},"selectionSet":{"kind":"SelectionSet","selections":[{"kind":"Field","name":{"kind":"Name","value":"general"}},{"kind":"Field","name":{"kind":"Name","value":"memberRoleIds"}},{"kind":"Field","name":{"kind":"Name","value":"primaryContact"}},{"kind":"Field","name":{"kind":"Name","value":"projectMemberId"}},{"kind":"Field","name":{"kind":"Name","value":"projectId"}}]}},{"kind":"Field","name":{"kind":"Name","value":"id"}},{"kind":"Field","name":{"kind":"Name","value":"isPrimaryContact"}}]}}]}}]} as unknown as DocumentNode<AddPlanMemberMutation, AddPlanMemberMutationVariables>;
export const RemovePlanMemberDocument = {"kind":"Document","definitions":[{"kind":"OperationDefinition","operation":"mutation","name":{"kind":"Name","value":"RemovePlanMember"},"variableDefinitions":[{"kind":"VariableDefinition","variable":{"kind":"Variable","name":{"kind":"Name","value":"planMemberId"}},"type":{"kind":"NonNullType","type":{"kind":"NamedType","name":{"kind":"Name","value":"Int"}}}}],"selectionSet":{"kind":"SelectionSet","selections":[{"kind":"Field","name":{"kind":"Name","value":"removePlanMember"},"arguments":[{"kind":"Argument","name":{"kind":"Name","value":"planMemberId"},"value":{"kind":"Variable","name":{"kind":"Name","value":"planMemberId"}}}],"selectionSet":{"kind":"SelectionSet","selections":[{"kind":"Field","name":{"kind":"Name","value":"errors"},"selectionSet":{"kind":"SelectionSet","selections":[{"kind":"Field","name":{"kind":"Name","value":"general"}},{"kind":"Field","name":{"kind":"Name","value":"primaryContact"}},{"kind":"Field","name":{"kind":"Name","value":"projectMemberId"}},{"kind":"Field","name":{"kind":"Name","value":"projectId"}},{"kind":"Field","name":{"kind":"Name","value":"memberRoleIds"}}]}},{"kind":"Field","name":{"kind":"Name","value":"id"}},{"kind":"Field","name":{"kind":"Name","value":"isPrimaryContact"}}]}}]}}]} as unknown as DocumentNode<RemovePlanMemberMutation, RemovePlanMemberMutationVariables>;
export const UpdatePlanMemberDocument = {"kind":"Document","definitions":[{"kind":"OperationDefinition","operation":"mutation","name":{"kind":"Name","value":"UpdatePlanMember"},"variableDefinitions":[{"kind":"VariableDefinition","variable":{"kind":"Variable","name":{"kind":"Name","value":"planId"}},"type":{"kind":"NonNullType","type":{"kind":"NamedType","name":{"kind":"Name","value":"Int"}}}},{"kind":"VariableDefinition","variable":{"kind":"Variable","name":{"kind":"Name","value":"planMemberId"}},"type":{"kind":"NonNullType","type":{"kind":"NamedType","name":{"kind":"Name","value":"Int"}}}},{"kind":"VariableDefinition","variable":{"kind":"Variable","name":{"kind":"Name","value":"isPrimaryContact"}},"type":{"kind":"NamedType","name":{"kind":"Name","value":"Boolean"}}},{"kind":"VariableDefinition","variable":{"kind":"Variable","name":{"kind":"Name","value":"memberRoleIds"}},"type":{"kind":"ListType","type":{"kind":"NonNullType","type":{"kind":"NamedType","name":{"kind":"Name","value":"Int"}}}}}],"selectionSet":{"kind":"SelectionSet","selections":[{"kind":"Field","name":{"kind":"Name","value":"updatePlanMember"},"arguments":[{"kind":"Argument","name":{"kind":"Name","value":"planId"},"value":{"kind":"Variable","name":{"kind":"Name","value":"planId"}}},{"kind":"Argument","name":{"kind":"Name","value":"planMemberId"},"value":{"kind":"Variable","name":{"kind":"Name","value":"planMemberId"}}},{"kind":"Argument","name":{"kind":"Name","value":"memberRoleIds"},"value":{"kind":"Variable","name":{"kind":"Name","value":"memberRoleIds"}}},{"kind":"Argument","name":{"kind":"Name","value":"isPrimaryContact"},"value":{"kind":"Variable","name":{"kind":"Name","value":"isPrimaryContact"}}}],"selectionSet":{"kind":"SelectionSet","selections":[{"kind":"Field","name":{"kind":"Name","value":"id"}},{"kind":"Field","name":{"kind":"Name","value":"errors"},"selectionSet":{"kind":"SelectionSet","selections":[{"kind":"Field","name":{"kind":"Name","value":"general"}}]}}]}}]}}]} as unknown as DocumentNode<UpdatePlanMemberMutation, UpdatePlanMemberMutationVariables>;
export const PublishPlanDocument = {"kind":"Document","definitions":[{"kind":"OperationDefinition","operation":"mutation","name":{"kind":"Name","value":"PublishPlan"},"variableDefinitions":[{"kind":"VariableDefinition","variable":{"kind":"Variable","name":{"kind":"Name","value":"planId"}},"type":{"kind":"NonNullType","type":{"kind":"NamedType","name":{"kind":"Name","value":"Int"}}}},{"kind":"VariableDefinition","variable":{"kind":"Variable","name":{"kind":"Name","value":"visibility"}},"type":{"kind":"NamedType","name":{"kind":"Name","value":"PlanVisibility"}}}],"selectionSet":{"kind":"SelectionSet","selections":[{"kind":"Field","name":{"kind":"Name","value":"publishPlan"},"arguments":[{"kind":"Argument","name":{"kind":"Name","value":"planId"},"value":{"kind":"Variable","name":{"kind":"Name","value":"planId"}}},{"kind":"Argument","name":{"kind":"Name","value":"visibility"},"value":{"kind":"Variable","name":{"kind":"Name","value":"visibility"}}}],"selectionSet":{"kind":"SelectionSet","selections":[{"kind":"Field","name":{"kind":"Name","value":"errors"},"selectionSet":{"kind":"SelectionSet","selections":[{"kind":"Field","name":{"kind":"Name","value":"general"}},{"kind":"Field","name":{"kind":"Name","value":"visibility"}},{"kind":"Field","name":{"kind":"Name","value":"status"}}]}},{"kind":"Field","name":{"kind":"Name","value":"visibility"}},{"kind":"Field","name":{"kind":"Name","value":"status"}}]}}]}}]} as unknown as DocumentNode<PublishPlanMutation, PublishPlanMutationVariables>;
export const UpdatePlanStatusDocument = {"kind":"Document","definitions":[{"kind":"OperationDefinition","operation":"mutation","name":{"kind":"Name","value":"UpdatePlanStatus"},"variableDefinitions":[{"kind":"VariableDefinition","variable":{"kind":"Variable","name":{"kind":"Name","value":"planId"}},"type":{"kind":"NonNullType","type":{"kind":"NamedType","name":{"kind":"Name","value":"Int"}}}},{"kind":"VariableDefinition","variable":{"kind":"Variable","name":{"kind":"Name","value":"status"}},"type":{"kind":"NonNullType","type":{"kind":"NamedType","name":{"kind":"Name","value":"PlanStatus"}}}}],"selectionSet":{"kind":"SelectionSet","selections":[{"kind":"Field","name":{"kind":"Name","value":"updatePlanStatus"},"arguments":[{"kind":"Argument","name":{"kind":"Name","value":"planId"},"value":{"kind":"Variable","name":{"kind":"Name","value":"planId"}}},{"kind":"Argument","name":{"kind":"Name","value":"status"},"value":{"kind":"Variable","name":{"kind":"Name","value":"status"}}}],"selectionSet":{"kind":"SelectionSet","selections":[{"kind":"Field","name":{"kind":"Name","value":"errors"},"selectionSet":{"kind":"SelectionSet","selections":[{"kind":"Field","name":{"kind":"Name","value":"general"}},{"kind":"Field","name":{"kind":"Name","value":"status"}}]}},{"kind":"Field","name":{"kind":"Name","value":"id"}},{"kind":"Field","name":{"kind":"Name","value":"status"}},{"kind":"Field","name":{"kind":"Name","value":"visibility"}}]}}]}}]} as unknown as DocumentNode<UpdatePlanStatusMutation, UpdatePlanStatusMutationVariables>;
export const UpdatePlanTitleDocument = {"kind":"Document","definitions":[{"kind":"OperationDefinition","operation":"mutation","name":{"kind":"Name","value":"UpdatePlanTitle"},"variableDefinitions":[{"kind":"VariableDefinition","variable":{"kind":"Variable","name":{"kind":"Name","value":"planId"}},"type":{"kind":"NonNullType","type":{"kind":"NamedType","name":{"kind":"Name","value":"Int"}}}},{"kind":"VariableDefinition","variable":{"kind":"Variable","name":{"kind":"Name","value":"title"}},"type":{"kind":"NonNullType","type":{"kind":"NamedType","name":{"kind":"Name","value":"String"}}}}],"selectionSet":{"kind":"SelectionSet","selections":[{"kind":"Field","name":{"kind":"Name","value":"updatePlanTitle"},"arguments":[{"kind":"Argument","name":{"kind":"Name","value":"planId"},"value":{"kind":"Variable","name":{"kind":"Name","value":"planId"}}},{"kind":"Argument","name":{"kind":"Name","value":"title"},"value":{"kind":"Variable","name":{"kind":"Name","value":"title"}}}],"selectionSet":{"kind":"SelectionSet","selections":[{"kind":"Field","name":{"kind":"Name","value":"errors"},"selectionSet":{"kind":"SelectionSet","selections":[{"kind":"Field","name":{"kind":"Name","value":"general"}},{"kind":"Field","name":{"kind":"Name","value":"title"}}]}},{"kind":"Field","name":{"kind":"Name","value":"id"}},{"kind":"Field","name":{"kind":"Name","value":"title"}}]}}]}}]} as unknown as DocumentNode<UpdatePlanTitleMutation, UpdatePlanTitleMutationVariables>;
export const UpdatePlanFundingDocument = {"kind":"Document","definitions":[{"kind":"OperationDefinition","operation":"mutation","name":{"kind":"Name","value":"UpdatePlanFunding"},"variableDefinitions":[{"kind":"VariableDefinition","variable":{"kind":"Variable","name":{"kind":"Name","value":"planId"}},"type":{"kind":"NonNullType","type":{"kind":"NamedType","name":{"kind":"Name","value":"Int"}}}},{"kind":"VariableDefinition","variable":{"kind":"Variable","name":{"kind":"Name","value":"projectFundingIds"}},"type":{"kind":"NonNullType","type":{"kind":"ListType","type":{"kind":"NonNullType","type":{"kind":"NamedType","name":{"kind":"Name","value":"Int"}}}}}}],"selectionSet":{"kind":"SelectionSet","selections":[{"kind":"Field","name":{"kind":"Name","value":"updatePlanFunding"},"arguments":[{"kind":"Argument","name":{"kind":"Name","value":"planId"},"value":{"kind":"Variable","name":{"kind":"Name","value":"planId"}}},{"kind":"Argument","name":{"kind":"Name","value":"projectFundingIds"},"value":{"kind":"Variable","name":{"kind":"Name","value":"projectFundingIds"}}}],"selectionSet":{"kind":"SelectionSet","selections":[{"kind":"Field","name":{"kind":"Name","value":"errors"},"selectionSet":{"kind":"SelectionSet","selections":[{"kind":"Field","name":{"kind":"Name","value":"ProjectFundingId"}},{"kind":"Field","name":{"kind":"Name","value":"general"}},{"kind":"Field","name":{"kind":"Name","value":"planId"}}]}},{"kind":"Field","name":{"kind":"Name","value":"projectFunding"},"selectionSet":{"kind":"SelectionSet","selections":[{"kind":"Field","name":{"kind":"Name","value":"id"}}]}}]}}]}}]} as unknown as DocumentNode<UpdatePlanFundingMutation, UpdatePlanFundingMutationVariables>;
export const AddProjectCollaboratorDocument = {"kind":"Document","definitions":[{"kind":"OperationDefinition","operation":"mutation","name":{"kind":"Name","value":"addProjectCollaborator"},"variableDefinitions":[{"kind":"VariableDefinition","variable":{"kind":"Variable","name":{"kind":"Name","value":"projectId"}},"type":{"kind":"NonNullType","type":{"kind":"NamedType","name":{"kind":"Name","value":"Int"}}}},{"kind":"VariableDefinition","variable":{"kind":"Variable","name":{"kind":"Name","value":"email"}},"type":{"kind":"NonNullType","type":{"kind":"NamedType","name":{"kind":"Name","value":"String"}}}},{"kind":"VariableDefinition","variable":{"kind":"Variable","name":{"kind":"Name","value":"accessLevel"}},"type":{"kind":"NamedType","name":{"kind":"Name","value":"ProjectCollaboratorAccessLevel"}}}],"selectionSet":{"kind":"SelectionSet","selections":[{"kind":"Field","name":{"kind":"Name","value":"addProjectCollaborator"},"arguments":[{"kind":"Argument","name":{"kind":"Name","value":"projectId"},"value":{"kind":"Variable","name":{"kind":"Name","value":"projectId"}}},{"kind":"Argument","name":{"kind":"Name","value":"email"},"value":{"kind":"Variable","name":{"kind":"Name","value":"email"}}},{"kind":"Argument","name":{"kind":"Name","value":"accessLevel"},"value":{"kind":"Variable","name":{"kind":"Name","value":"accessLevel"}}}],"selectionSet":{"kind":"SelectionSet","selections":[{"kind":"Field","name":{"kind":"Name","value":"id"}},{"kind":"Field","name":{"kind":"Name","value":"errors"},"selectionSet":{"kind":"SelectionSet","selections":[{"kind":"Field","name":{"kind":"Name","value":"general"}},{"kind":"Field","name":{"kind":"Name","value":"email"}}]}},{"kind":"Field","name":{"kind":"Name","value":"email"}},{"kind":"Field","name":{"kind":"Name","value":"user"},"selectionSet":{"kind":"SelectionSet","selections":[{"kind":"Field","name":{"kind":"Name","value":"givenName"}},{"kind":"Field","name":{"kind":"Name","value":"surName"}},{"kind":"Field","name":{"kind":"Name","value":"affiliation"},"selectionSet":{"kind":"SelectionSet","selections":[{"kind":"Field","name":{"kind":"Name","value":"uri"}}]}},{"kind":"Field","name":{"kind":"Name","value":"orcid"}}]}}]}}]}}]} as unknown as DocumentNode<AddProjectCollaboratorMutation, AddProjectCollaboratorMutationVariables>;
export const AddProjectFundingDocument = {"kind":"Document","definitions":[{"kind":"OperationDefinition","operation":"mutation","name":{"kind":"Name","value":"AddProjectFunding"},"variableDefinitions":[{"kind":"VariableDefinition","variable":{"kind":"Variable","name":{"kind":"Name","value":"input"}},"type":{"kind":"NonNullType","type":{"kind":"NamedType","name":{"kind":"Name","value":"AddProjectFundingInput"}}}}],"selectionSet":{"kind":"SelectionSet","selections":[{"kind":"Field","name":{"kind":"Name","value":"addProjectFunding"},"arguments":[{"kind":"Argument","name":{"kind":"Name","value":"input"},"value":{"kind":"Variable","name":{"kind":"Name","value":"input"}}}],"selectionSet":{"kind":"SelectionSet","selections":[{"kind":"Field","name":{"kind":"Name","value":"id"}},{"kind":"Field","name":{"kind":"Name","value":"errors"},"selectionSet":{"kind":"SelectionSet","selections":[{"kind":"Field","name":{"kind":"Name","value":"affiliationId"}},{"kind":"Field","name":{"kind":"Name","value":"funderOpportunityNumber"}},{"kind":"Field","name":{"kind":"Name","value":"funderProjectNumber"}},{"kind":"Field","name":{"kind":"Name","value":"general"}},{"kind":"Field","name":{"kind":"Name","value":"grantId"}},{"kind":"Field","name":{"kind":"Name","value":"projectId"}},{"kind":"Field","name":{"kind":"Name","value":"status"}}]}}]}}]}}]} as unknown as DocumentNode<AddProjectFundingMutation, AddProjectFundingMutationVariables>;
export const UpdateProjectFundingDocument = {"kind":"Document","definitions":[{"kind":"OperationDefinition","operation":"mutation","name":{"kind":"Name","value":"UpdateProjectFunding"},"variableDefinitions":[{"kind":"VariableDefinition","variable":{"kind":"Variable","name":{"kind":"Name","value":"input"}},"type":{"kind":"NonNullType","type":{"kind":"NamedType","name":{"kind":"Name","value":"UpdateProjectFundingInput"}}}}],"selectionSet":{"kind":"SelectionSet","selections":[{"kind":"Field","name":{"kind":"Name","value":"updateProjectFunding"},"arguments":[{"kind":"Argument","name":{"kind":"Name","value":"input"},"value":{"kind":"Variable","name":{"kind":"Name","value":"input"}}}],"selectionSet":{"kind":"SelectionSet","selections":[{"kind":"Field","name":{"kind":"Name","value":"errors"},"selectionSet":{"kind":"SelectionSet","selections":[{"kind":"Field","name":{"kind":"Name","value":"affiliationId"}},{"kind":"Field","name":{"kind":"Name","value":"funderOpportunityNumber"}},{"kind":"Field","name":{"kind":"Name","value":"funderProjectNumber"}},{"kind":"Field","name":{"kind":"Name","value":"general"}},{"kind":"Field","name":{"kind":"Name","value":"grantId"}},{"kind":"Field","name":{"kind":"Name","value":"projectId"}},{"kind":"Field","name":{"kind":"Name","value":"status"}}]}}]}}]}}]} as unknown as DocumentNode<UpdateProjectFundingMutation, UpdateProjectFundingMutationVariables>;
export const RemoveProjectFundingDocument = {"kind":"Document","definitions":[{"kind":"OperationDefinition","operation":"mutation","name":{"kind":"Name","value":"RemoveProjectFunding"},"variableDefinitions":[{"kind":"VariableDefinition","variable":{"kind":"Variable","name":{"kind":"Name","value":"projectFundingId"}},"type":{"kind":"NonNullType","type":{"kind":"NamedType","name":{"kind":"Name","value":"Int"}}}}],"selectionSet":{"kind":"SelectionSet","selections":[{"kind":"Field","name":{"kind":"Name","value":"removeProjectFunding"},"arguments":[{"kind":"Argument","name":{"kind":"Name","value":"projectFundingId"},"value":{"kind":"Variable","name":{"kind":"Name","value":"projectFundingId"}}}],"selectionSet":{"kind":"SelectionSet","selections":[{"kind":"Field","name":{"kind":"Name","value":"errors"},"selectionSet":{"kind":"SelectionSet","selections":[{"kind":"Field","name":{"kind":"Name","value":"affiliationId"}},{"kind":"Field","name":{"kind":"Name","value":"funderOpportunityNumber"}},{"kind":"Field","name":{"kind":"Name","value":"funderProjectNumber"}},{"kind":"Field","name":{"kind":"Name","value":"general"}},{"kind":"Field","name":{"kind":"Name","value":"grantId"}},{"kind":"Field","name":{"kind":"Name","value":"projectId"}},{"kind":"Field","name":{"kind":"Name","value":"status"}}]}},{"kind":"Field","name":{"kind":"Name","value":"id"}}]}}]}}]} as unknown as DocumentNode<RemoveProjectFundingMutation, RemoveProjectFundingMutationVariables>;
export const UpdateProjectMemberDocument = {"kind":"Document","definitions":[{"kind":"OperationDefinition","operation":"mutation","name":{"kind":"Name","value":"UpdateProjectMember"},"variableDefinitions":[{"kind":"VariableDefinition","variable":{"kind":"Variable","name":{"kind":"Name","value":"input"}},"type":{"kind":"NonNullType","type":{"kind":"NamedType","name":{"kind":"Name","value":"UpdateProjectMemberInput"}}}}],"selectionSet":{"kind":"SelectionSet","selections":[{"kind":"Field","name":{"kind":"Name","value":"updateProjectMember"},"arguments":[{"kind":"Argument","name":{"kind":"Name","value":"input"},"value":{"kind":"Variable","name":{"kind":"Name","value":"input"}}}],"selectionSet":{"kind":"SelectionSet","selections":[{"kind":"Field","name":{"kind":"Name","value":"givenName"}},{"kind":"Field","name":{"kind":"Name","value":"surName"}},{"kind":"Field","name":{"kind":"Name","value":"orcid"}},{"kind":"Field","name":{"kind":"Name","value":"id"}},{"kind":"Field","name":{"kind":"Name","value":"errors"},"selectionSet":{"kind":"SelectionSet","selections":[{"kind":"Field","name":{"kind":"Name","value":"email"}},{"kind":"Field","name":{"kind":"Name","value":"surName"}},{"kind":"Field","name":{"kind":"Name","value":"general"}},{"kind":"Field","name":{"kind":"Name","value":"givenName"}},{"kind":"Field","name":{"kind":"Name","value":"orcid"}},{"kind":"Field","name":{"kind":"Name","value":"affiliationId"}},{"kind":"Field","name":{"kind":"Name","value":"memberRoleIds"}}]}}]}}]}}]} as unknown as DocumentNode<UpdateProjectMemberMutation, UpdateProjectMemberMutationVariables>;
export const RemoveProjectMemberDocument = {"kind":"Document","definitions":[{"kind":"OperationDefinition","operation":"mutation","name":{"kind":"Name","value":"RemoveProjectMember"},"variableDefinitions":[{"kind":"VariableDefinition","variable":{"kind":"Variable","name":{"kind":"Name","value":"projectMemberId"}},"type":{"kind":"NonNullType","type":{"kind":"NamedType","name":{"kind":"Name","value":"Int"}}}}],"selectionSet":{"kind":"SelectionSet","selections":[{"kind":"Field","name":{"kind":"Name","value":"removeProjectMember"},"arguments":[{"kind":"Argument","name":{"kind":"Name","value":"projectMemberId"},"value":{"kind":"Variable","name":{"kind":"Name","value":"projectMemberId"}}}],"selectionSet":{"kind":"SelectionSet","selections":[{"kind":"Field","name":{"kind":"Name","value":"errors"},"selectionSet":{"kind":"SelectionSet","selections":[{"kind":"Field","name":{"kind":"Name","value":"general"}},{"kind":"Field","name":{"kind":"Name","value":"email"}},{"kind":"Field","name":{"kind":"Name","value":"affiliationId"}},{"kind":"Field","name":{"kind":"Name","value":"givenName"}},{"kind":"Field","name":{"kind":"Name","value":"orcid"}},{"kind":"Field","name":{"kind":"Name","value":"surName"}},{"kind":"Field","name":{"kind":"Name","value":"memberRoleIds"}}]}}]}}]}}]} as unknown as DocumentNode<RemoveProjectMemberMutation, RemoveProjectMemberMutationVariables>;
export const AddProjectMemberDocument = {"kind":"Document","definitions":[{"kind":"OperationDefinition","operation":"mutation","name":{"kind":"Name","value":"AddProjectMember"},"variableDefinitions":[{"kind":"VariableDefinition","variable":{"kind":"Variable","name":{"kind":"Name","value":"input"}},"type":{"kind":"NonNullType","type":{"kind":"NamedType","name":{"kind":"Name","value":"AddProjectMemberInput"}}}}],"selectionSet":{"kind":"SelectionSet","selections":[{"kind":"Field","name":{"kind":"Name","value":"addProjectMember"},"arguments":[{"kind":"Argument","name":{"kind":"Name","value":"input"},"value":{"kind":"Variable","name":{"kind":"Name","value":"input"}}}],"selectionSet":{"kind":"SelectionSet","selections":[{"kind":"Field","name":{"kind":"Name","value":"id"}},{"kind":"Field","name":{"kind":"Name","value":"givenName"}},{"kind":"Field","name":{"kind":"Name","value":"surName"}},{"kind":"Field","name":{"kind":"Name","value":"email"}},{"kind":"Field","name":{"kind":"Name","value":"affiliation"},"selectionSet":{"kind":"SelectionSet","selections":[{"kind":"Field","name":{"kind":"Name","value":"id"}},{"kind":"Field","name":{"kind":"Name","value":"name"}},{"kind":"Field","name":{"kind":"Name","value":"uri"}}]}},{"kind":"Field","name":{"kind":"Name","value":"orcid"}},{"kind":"Field","name":{"kind":"Name","value":"errors"},"selectionSet":{"kind":"SelectionSet","selections":[{"kind":"Field","name":{"kind":"Name","value":"email"}},{"kind":"Field","name":{"kind":"Name","value":"surName"}},{"kind":"Field","name":{"kind":"Name","value":"general"}},{"kind":"Field","name":{"kind":"Name","value":"givenName"}},{"kind":"Field","name":{"kind":"Name","value":"orcid"}},{"kind":"Field","name":{"kind":"Name","value":"memberRoleIds"}}]}}]}}]}}]} as unknown as DocumentNode<AddProjectMemberMutation, AddProjectMemberMutationVariables>;
export const AddProjectDocument = {"kind":"Document","definitions":[{"kind":"OperationDefinition","operation":"mutation","name":{"kind":"Name","value":"AddProject"},"variableDefinitions":[{"kind":"VariableDefinition","variable":{"kind":"Variable","name":{"kind":"Name","value":"title"}},"type":{"kind":"NonNullType","type":{"kind":"NamedType","name":{"kind":"Name","value":"String"}}}},{"kind":"VariableDefinition","variable":{"kind":"Variable","name":{"kind":"Name","value":"isTestProject"}},"type":{"kind":"NamedType","name":{"kind":"Name","value":"Boolean"}}}],"selectionSet":{"kind":"SelectionSet","selections":[{"kind":"Field","name":{"kind":"Name","value":"addProject"},"arguments":[{"kind":"Argument","name":{"kind":"Name","value":"title"},"value":{"kind":"Variable","name":{"kind":"Name","value":"title"}}},{"kind":"Argument","name":{"kind":"Name","value":"isTestProject"},"value":{"kind":"Variable","name":{"kind":"Name","value":"isTestProject"}}}],"selectionSet":{"kind":"SelectionSet","selections":[{"kind":"Field","name":{"kind":"Name","value":"id"}},{"kind":"Field","name":{"kind":"Name","value":"errors"},"selectionSet":{"kind":"SelectionSet","selections":[{"kind":"Field","name":{"kind":"Name","value":"title"}},{"kind":"Field","name":{"kind":"Name","value":"general"}}]}}]}}]}}]} as unknown as DocumentNode<AddProjectMutation, AddProjectMutationVariables>;
export const UpdateProjectDocument = {"kind":"Document","definitions":[{"kind":"OperationDefinition","operation":"mutation","name":{"kind":"Name","value":"UpdateProject"},"variableDefinitions":[{"kind":"VariableDefinition","variable":{"kind":"Variable","name":{"kind":"Name","value":"input"}},"type":{"kind":"NonNullType","type":{"kind":"NamedType","name":{"kind":"Name","value":"UpdateProjectInput"}}}}],"selectionSet":{"kind":"SelectionSet","selections":[{"kind":"Field","name":{"kind":"Name","value":"updateProject"},"arguments":[{"kind":"Argument","name":{"kind":"Name","value":"input"},"value":{"kind":"Variable","name":{"kind":"Name","value":"input"}}}],"selectionSet":{"kind":"SelectionSet","selections":[{"kind":"Field","name":{"kind":"Name","value":"errors"},"selectionSet":{"kind":"SelectionSet","selections":[{"kind":"Field","name":{"kind":"Name","value":"general"}},{"kind":"Field","name":{"kind":"Name","value":"title"}},{"kind":"Field","name":{"kind":"Name","value":"abstractText"}},{"kind":"Field","name":{"kind":"Name","value":"endDate"}},{"kind":"Field","name":{"kind":"Name","value":"startDate"}},{"kind":"Field","name":{"kind":"Name","value":"researchDomainId"}}]}}]}}]}}]} as unknown as DocumentNode<UpdateProjectMutation, UpdateProjectMutationVariables>;
export const MoveCustomQuestionDocument = {"kind":"Document","definitions":[{"kind":"OperationDefinition","operation":"mutation","name":{"kind":"Name","value":"MoveCustomQuestion"},"variableDefinitions":[{"kind":"VariableDefinition","variable":{"kind":"Variable","name":{"kind":"Name","value":"input"}},"type":{"kind":"NonNullType","type":{"kind":"NamedType","name":{"kind":"Name","value":"MoveCustomQuestionInput"}}}}],"selectionSet":{"kind":"SelectionSet","selections":[{"kind":"Field","name":{"kind":"Name","value":"moveCustomQuestion"},"arguments":[{"kind":"Argument","name":{"kind":"Name","value":"input"},"value":{"kind":"Variable","name":{"kind":"Name","value":"input"}}}],"selectionSet":{"kind":"SelectionSet","selections":[{"kind":"Field","name":{"kind":"Name","value":"id"}},{"kind":"Field","name":{"kind":"Name","value":"guidanceText"}},{"kind":"Field","name":{"kind":"Name","value":"errors"},"selectionSet":{"kind":"SelectionSet","selections":[{"kind":"Field","name":{"kind":"Name","value":"general"}}]}},{"kind":"Field","name":{"kind":"Name","value":"json"}},{"kind":"Field","name":{"kind":"Name","value":"migrationStatus"}},{"kind":"Field","name":{"kind":"Name","value":"modified"}},{"kind":"Field","name":{"kind":"Name","value":"pinnedQuestionId"}},{"kind":"Field","name":{"kind":"Name","value":"pinnedQuestionType"}},{"kind":"Field","name":{"kind":"Name","value":"questionText"}},{"kind":"Field","name":{"kind":"Name","value":"required"}},{"kind":"Field","name":{"kind":"Name","value":"requirementText"}},{"kind":"Field","name":{"kind":"Name","value":"sampleText"}},{"kind":"Field","name":{"kind":"Name","value":"sectionId"}},{"kind":"Field","name":{"kind":"Name","value":"sectionType"}},{"kind":"Field","name":{"kind":"Name","value":"templateCustomizationId"}},{"kind":"Field","name":{"kind":"Name","value":"useSampleTextAsDefault"}}]}}]}}]} as unknown as DocumentNode<MoveCustomQuestionMutation, MoveCustomQuestionMutationVariables>;
export const AddQuestionCustomizationDocument = {"kind":"Document","definitions":[{"kind":"OperationDefinition","operation":"mutation","name":{"kind":"Name","value":"AddQuestionCustomization"},"variableDefinitions":[{"kind":"VariableDefinition","variable":{"kind":"Variable","name":{"kind":"Name","value":"input"}},"type":{"kind":"NonNullType","type":{"kind":"NamedType","name":{"kind":"Name","value":"AddQuestionCustomizationInput"}}}}],"selectionSet":{"kind":"SelectionSet","selections":[{"kind":"Field","name":{"kind":"Name","value":"addQuestionCustomization"},"arguments":[{"kind":"Argument","name":{"kind":"Name","value":"input"},"value":{"kind":"Variable","name":{"kind":"Name","value":"input"}}}],"selectionSet":{"kind":"SelectionSet","selections":[{"kind":"Field","name":{"kind":"Name","value":"id"}},{"kind":"Field","name":{"kind":"Name","value":"guidanceText"}},{"kind":"Field","name":{"kind":"Name","value":"errors"},"selectionSet":{"kind":"SelectionSet","selections":[{"kind":"Field","name":{"kind":"Name","value":"general"}},{"kind":"Field","name":{"kind":"Name","value":"guidanceText"}},{"kind":"Field","name":{"kind":"Name","value":"migrationStatus"}},{"kind":"Field","name":{"kind":"Name","value":"questionId"}},{"kind":"Field","name":{"kind":"Name","value":"sampleText"}},{"kind":"Field","name":{"kind":"Name","value":"templateCustomizationId"}}]}},{"kind":"Field","name":{"kind":"Name","value":"migrationStatus"}},{"kind":"Field","name":{"kind":"Name","value":"modified"}},{"kind":"Field","name":{"kind":"Name","value":"questionId"}},{"kind":"Field","name":{"kind":"Name","value":"sampleText"}},{"kind":"Field","name":{"kind":"Name","value":"templateCustomizationId"}},{"kind":"Field","name":{"kind":"Name","value":"versionedQuestion"},"selectionSet":{"kind":"SelectionSet","selections":[{"kind":"Field","name":{"kind":"Name","value":"id"}},{"kind":"Field","name":{"kind":"Name","value":"guidanceText"}},{"kind":"Field","name":{"kind":"Name","value":"displayOrder"}},{"kind":"Field","name":{"kind":"Name","value":"modified"}},{"kind":"Field","name":{"kind":"Name","value":"questionId"}},{"kind":"Field","name":{"kind":"Name","value":"ownerAffiliation"},"selectionSet":{"kind":"SelectionSet","selections":[{"kind":"Field","name":{"kind":"Name","value":"displayName"}},{"kind":"Field","name":{"kind":"Name","value":"id"}}]}}]}}]}}]}}]} as unknown as DocumentNode<AddQuestionCustomizationMutation, AddQuestionCustomizationMutationVariables>;
export const UpdateQuestionCustomizationDocument = {"kind":"Document","definitions":[{"kind":"OperationDefinition","operation":"mutation","name":{"kind":"Name","value":"UpdateQuestionCustomization"},"variableDefinitions":[{"kind":"VariableDefinition","variable":{"kind":"Variable","name":{"kind":"Name","value":"input"}},"type":{"kind":"NonNullType","type":{"kind":"NamedType","name":{"kind":"Name","value":"UpdateQuestionCustomizationInput"}}}}],"selectionSet":{"kind":"SelectionSet","selections":[{"kind":"Field","name":{"kind":"Name","value":"updateQuestionCustomization"},"arguments":[{"kind":"Argument","name":{"kind":"Name","value":"input"},"value":{"kind":"Variable","name":{"kind":"Name","value":"input"}}}],"selectionSet":{"kind":"SelectionSet","selections":[{"kind":"Field","name":{"kind":"Name","value":"guidanceText"}},{"kind":"Field","name":{"kind":"Name","value":"errors"},"selectionSet":{"kind":"SelectionSet","selections":[{"kind":"Field","name":{"kind":"Name","value":"general"}},{"kind":"Field","name":{"kind":"Name","value":"guidanceText"}},{"kind":"Field","name":{"kind":"Name","value":"migrationStatus"}},{"kind":"Field","name":{"kind":"Name","value":"questionId"}},{"kind":"Field","name":{"kind":"Name","value":"sampleText"}},{"kind":"Field","name":{"kind":"Name","value":"templateCustomizationId"}}]}},{"kind":"Field","name":{"kind":"Name","value":"id"}},{"kind":"Field","name":{"kind":"Name","value":"migrationStatus"}},{"kind":"Field","name":{"kind":"Name","value":"modified"}},{"kind":"Field","name":{"kind":"Name","value":"questionId"}},{"kind":"Field","name":{"kind":"Name","value":"sampleText"}},{"kind":"Field","name":{"kind":"Name","value":"templateCustomizationId"}},{"kind":"Field","name":{"kind":"Name","value":"versionedQuestion"},"selectionSet":{"kind":"SelectionSet","selections":[{"kind":"Field","name":{"kind":"Name","value":"id"}},{"kind":"Field","name":{"kind":"Name","value":"guidanceText"}},{"kind":"Field","name":{"kind":"Name","value":"ownerAffiliation"},"selectionSet":{"kind":"SelectionSet","selections":[{"kind":"Field","name":{"kind":"Name","value":"displayName"}},{"kind":"Field","name":{"kind":"Name","value":"id"}}]}}]}}]}}]}}]} as unknown as DocumentNode<UpdateQuestionCustomizationMutation, UpdateQuestionCustomizationMutationVariables>;
export const RemoveQuestionCustomizationDocument = {"kind":"Document","definitions":[{"kind":"OperationDefinition","operation":"mutation","name":{"kind":"Name","value":"RemoveQuestionCustomization"},"variableDefinitions":[{"kind":"VariableDefinition","variable":{"kind":"Variable","name":{"kind":"Name","value":"questionCustomizationId"}},"type":{"kind":"NonNullType","type":{"kind":"NamedType","name":{"kind":"Name","value":"Int"}}}}],"selectionSet":{"kind":"SelectionSet","selections":[{"kind":"Field","name":{"kind":"Name","value":"removeQuestionCustomization"},"arguments":[{"kind":"Argument","name":{"kind":"Name","value":"questionCustomizationId"},"value":{"kind":"Variable","name":{"kind":"Name","value":"questionCustomizationId"}}}],"selectionSet":{"kind":"SelectionSet","selections":[{"kind":"Field","name":{"kind":"Name","value":"id"}},{"kind":"Field","name":{"kind":"Name","value":"guidanceText"}},{"kind":"Field","name":{"kind":"Name","value":"migrationStatus"}},{"kind":"Field","name":{"kind":"Name","value":"modified"}},{"kind":"Field","name":{"kind":"Name","value":"questionId"}},{"kind":"Field","name":{"kind":"Name","value":"sampleText"}},{"kind":"Field","name":{"kind":"Name","value":"templateCustomizationId"}},{"kind":"Field","name":{"kind":"Name","value":"versionedQuestion"},"selectionSet":{"kind":"SelectionSet","selections":[{"kind":"Field","name":{"kind":"Name","value":"id"}},{"kind":"Field","name":{"kind":"Name","value":"guidanceText"}},{"kind":"Field","name":{"kind":"Name","value":"json"}},{"kind":"Field","name":{"kind":"Name","value":"ownerAffiliation"},"selectionSet":{"kind":"SelectionSet","selections":[{"kind":"Field","name":{"kind":"Name","value":"displayName"}},{"kind":"Field","name":{"kind":"Name","value":"id"}}]}}]}},{"kind":"Field","name":{"kind":"Name","value":"errors"},"selectionSet":{"kind":"SelectionSet","selections":[{"kind":"Field","name":{"kind":"Name","value":"general"}},{"kind":"Field","name":{"kind":"Name","value":"guidanceText"}},{"kind":"Field","name":{"kind":"Name","value":"migrationStatus"}},{"kind":"Field","name":{"kind":"Name","value":"questionId"}},{"kind":"Field","name":{"kind":"Name","value":"sampleText"}},{"kind":"Field","name":{"kind":"Name","value":"templateCustomizationId"}}]}}]}}]}}]} as unknown as DocumentNode<RemoveQuestionCustomizationMutation, RemoveQuestionCustomizationMutationVariables>;
export const AddQuestionDocument = {"kind":"Document","definitions":[{"kind":"OperationDefinition","operation":"mutation","name":{"kind":"Name","value":"AddQuestion"},"variableDefinitions":[{"kind":"VariableDefinition","variable":{"kind":"Variable","name":{"kind":"Name","value":"input"}},"type":{"kind":"NonNullType","type":{"kind":"NamedType","name":{"kind":"Name","value":"AddQuestionInput"}}}}],"selectionSet":{"kind":"SelectionSet","selections":[{"kind":"Field","name":{"kind":"Name","value":"addQuestion"},"arguments":[{"kind":"Argument","name":{"kind":"Name","value":"input"},"value":{"kind":"Variable","name":{"kind":"Name","value":"input"}}}],"selectionSet":{"kind":"SelectionSet","selections":[{"kind":"Field","name":{"kind":"Name","value":"errors"},"selectionSet":{"kind":"SelectionSet","selections":[{"kind":"Field","name":{"kind":"Name","value":"general"}},{"kind":"Field","name":{"kind":"Name","value":"questionText"}}]}},{"kind":"Field","name":{"kind":"Name","value":"id"}},{"kind":"Field","name":{"kind":"Name","value":"displayOrder"}},{"kind":"Field","name":{"kind":"Name","value":"questionText"}},{"kind":"Field","name":{"kind":"Name","value":"json"}},{"kind":"Field","name":{"kind":"Name","value":"requirementText"}},{"kind":"Field","name":{"kind":"Name","value":"guidanceText"}},{"kind":"Field","name":{"kind":"Name","value":"sampleText"}},{"kind":"Field","name":{"kind":"Name","value":"useSampleTextAsDefault"}},{"kind":"Field","name":{"kind":"Name","value":"required"}}]}}]}}]} as unknown as DocumentNode<AddQuestionMutation, AddQuestionMutationVariables>;
export const UpdateQuestionDocument = {"kind":"Document","definitions":[{"kind":"OperationDefinition","operation":"mutation","name":{"kind":"Name","value":"UpdateQuestion"},"variableDefinitions":[{"kind":"VariableDefinition","variable":{"kind":"Variable","name":{"kind":"Name","value":"input"}},"type":{"kind":"NonNullType","type":{"kind":"NamedType","name":{"kind":"Name","value":"UpdateQuestionInput"}}}}],"selectionSet":{"kind":"SelectionSet","selections":[{"kind":"Field","name":{"kind":"Name","value":"updateQuestion"},"arguments":[{"kind":"Argument","name":{"kind":"Name","value":"input"},"value":{"kind":"Variable","name":{"kind":"Name","value":"input"}}}],"selectionSet":{"kind":"SelectionSet","selections":[{"kind":"Field","name":{"kind":"Name","value":"id"}},{"kind":"Field","name":{"kind":"Name","value":"guidanceText"}},{"kind":"Field","name":{"kind":"Name","value":"errors"},"selectionSet":{"kind":"SelectionSet","selections":[{"kind":"Field","name":{"kind":"Name","value":"general"}},{"kind":"Field","name":{"kind":"Name","value":"questionText"}}]}},{"kind":"Field","name":{"kind":"Name","value":"isDirty"}},{"kind":"Field","name":{"kind":"Name","value":"required"}},{"kind":"Field","name":{"kind":"Name","value":"json"}},{"kind":"Field","name":{"kind":"Name","value":"requirementText"}},{"kind":"Field","name":{"kind":"Name","value":"sampleText"}},{"kind":"Field","name":{"kind":"Name","value":"useSampleTextAsDefault"}},{"kind":"Field","name":{"kind":"Name","value":"sectionId"}},{"kind":"Field","name":{"kind":"Name","value":"templateId"}},{"kind":"Field","name":{"kind":"Name","value":"questionText"}}]}}]}}]} as unknown as DocumentNode<UpdateQuestionMutation, UpdateQuestionMutationVariables>;
export const RemoveQuestionDocument = {"kind":"Document","definitions":[{"kind":"OperationDefinition","operation":"mutation","name":{"kind":"Name","value":"RemoveQuestion"},"variableDefinitions":[{"kind":"VariableDefinition","variable":{"kind":"Variable","name":{"kind":"Name","value":"questionId"}},"type":{"kind":"NonNullType","type":{"kind":"NamedType","name":{"kind":"Name","value":"Int"}}}}],"selectionSet":{"kind":"SelectionSet","selections":[{"kind":"Field","name":{"kind":"Name","value":"removeQuestion"},"arguments":[{"kind":"Argument","name":{"kind":"Name","value":"questionId"},"value":{"kind":"Variable","name":{"kind":"Name","value":"questionId"}}}],"selectionSet":{"kind":"SelectionSet","selections":[{"kind":"Field","name":{"kind":"Name","value":"id"}},{"kind":"Field","name":{"kind":"Name","value":"errors"},"selectionSet":{"kind":"SelectionSet","selections":[{"kind":"Field","name":{"kind":"Name","value":"general"}},{"kind":"Field","name":{"kind":"Name","value":"guidanceText"}},{"kind":"Field","name":{"kind":"Name","value":"json"}},{"kind":"Field","name":{"kind":"Name","value":"questionText"}},{"kind":"Field","name":{"kind":"Name","value":"requirementText"}},{"kind":"Field","name":{"kind":"Name","value":"sampleText"}}]}}]}}]}}]} as unknown as DocumentNode<RemoveQuestionMutation, RemoveQuestionMutationVariables>;
export const UpdateQuestionDisplayOrderDocument = {"kind":"Document","definitions":[{"kind":"OperationDefinition","operation":"mutation","name":{"kind":"Name","value":"UpdateQuestionDisplayOrder"},"variableDefinitions":[{"kind":"VariableDefinition","variable":{"kind":"Variable","name":{"kind":"Name","value":"questionId"}},"type":{"kind":"NonNullType","type":{"kind":"NamedType","name":{"kind":"Name","value":"Int"}}}},{"kind":"VariableDefinition","variable":{"kind":"Variable","name":{"kind":"Name","value":"newDisplayOrder"}},"type":{"kind":"NonNullType","type":{"kind":"NamedType","name":{"kind":"Name","value":"Int"}}}}],"selectionSet":{"kind":"SelectionSet","selections":[{"kind":"Field","name":{"kind":"Name","value":"updateQuestionDisplayOrder"},"arguments":[{"kind":"Argument","name":{"kind":"Name","value":"questionId"},"value":{"kind":"Variable","name":{"kind":"Name","value":"questionId"}}},{"kind":"Argument","name":{"kind":"Name","value":"newDisplayOrder"},"value":{"kind":"Variable","name":{"kind":"Name","value":"newDisplayOrder"}}}],"selectionSet":{"kind":"SelectionSet","selections":[{"kind":"Field","name":{"kind":"Name","value":"questions"},"selectionSet":{"kind":"SelectionSet","selections":[{"kind":"Field","name":{"kind":"Name","value":"id"}},{"kind":"Field","name":{"kind":"Name","value":"displayOrder"}},{"kind":"Field","name":{"kind":"Name","value":"questionText"}},{"kind":"Field","name":{"kind":"Name","value":"sampleText"}},{"kind":"Field","name":{"kind":"Name","value":"requirementText"}},{"kind":"Field","name":{"kind":"Name","value":"guidanceText"}},{"kind":"Field","name":{"kind":"Name","value":"sectionId"}},{"kind":"Field","name":{"kind":"Name","value":"templateId"}},{"kind":"Field","name":{"kind":"Name","value":"errors"},"selectionSet":{"kind":"SelectionSet","selections":[{"kind":"Field","name":{"kind":"Name","value":"general"}}]}}]}}]}}]}}]} as unknown as DocumentNode<UpdateQuestionDisplayOrderMutation, UpdateQuestionDisplayOrderMutationVariables>;
export const UpdateRelatedWorkStatusDocument = {"kind":"Document","definitions":[{"kind":"OperationDefinition","operation":"mutation","name":{"kind":"Name","value":"UpdateRelatedWorkStatus"},"variableDefinitions":[{"kind":"VariableDefinition","variable":{"kind":"Variable","name":{"kind":"Name","value":"input"}},"type":{"kind":"NonNullType","type":{"kind":"NamedType","name":{"kind":"Name","value":"UpdateRelatedWorkStatusInput"}}}}],"selectionSet":{"kind":"SelectionSet","selections":[{"kind":"Field","name":{"kind":"Name","value":"updateRelatedWorkStatus"},"arguments":[{"kind":"Argument","name":{"kind":"Name","value":"input"},"value":{"kind":"Variable","name":{"kind":"Name","value":"input"}}}],"selectionSet":{"kind":"SelectionSet","selections":[{"kind":"Field","name":{"kind":"Name","value":"id"}},{"kind":"Field","name":{"kind":"Name","value":"status"}}]}}]}}]} as unknown as DocumentNode<UpdateRelatedWorkStatusMutation, UpdateRelatedWorkStatusMutationVariables>;
export const UpsertRelatedWorkDocument = {"kind":"Document","definitions":[{"kind":"OperationDefinition","operation":"mutation","name":{"kind":"Name","value":"UpsertRelatedWork"},"variableDefinitions":[{"kind":"VariableDefinition","variable":{"kind":"Variable","name":{"kind":"Name","value":"input"}},"type":{"kind":"NonNullType","type":{"kind":"NamedType","name":{"kind":"Name","value":"UpsertRelatedWorkInput"}}}}],"selectionSet":{"kind":"SelectionSet","selections":[{"kind":"Field","name":{"kind":"Name","value":"upsertRelatedWork"},"arguments":[{"kind":"Argument","name":{"kind":"Name","value":"input"},"value":{"kind":"Variable","name":{"kind":"Name","value":"input"}}}],"selectionSet":{"kind":"SelectionSet","selections":[{"kind":"Field","name":{"kind":"Name","value":"id"}},{"kind":"Field","name":{"kind":"Name","value":"planId"}},{"kind":"Field","name":{"kind":"Name","value":"status"}}]}}]}}]} as unknown as DocumentNode<UpsertRelatedWorkMutation, UpsertRelatedWorkMutationVariables>;
export const AddRepositoryDocument = {"kind":"Document","definitions":[{"kind":"OperationDefinition","operation":"mutation","name":{"kind":"Name","value":"AddRepository"},"variableDefinitions":[{"kind":"VariableDefinition","variable":{"kind":"Variable","name":{"kind":"Name","value":"input"}},"type":{"kind":"NamedType","name":{"kind":"Name","value":"AddRepositoryInput"}}}],"selectionSet":{"kind":"SelectionSet","selections":[{"kind":"Field","name":{"kind":"Name","value":"addRepository"},"arguments":[{"kind":"Argument","name":{"kind":"Name","value":"input"},"value":{"kind":"Variable","name":{"kind":"Name","value":"input"}}}],"selectionSet":{"kind":"SelectionSet","selections":[{"kind":"Field","name":{"kind":"Name","value":"id"}},{"kind":"Field","name":{"kind":"Name","value":"errors"},"selectionSet":{"kind":"SelectionSet","selections":[{"kind":"Field","name":{"kind":"Name","value":"general"}},{"kind":"Field","name":{"kind":"Name","value":"name"}},{"kind":"Field","name":{"kind":"Name","value":"description"}},{"kind":"Field","name":{"kind":"Name","value":"repositoryTypes"}},{"kind":"Field","name":{"kind":"Name","value":"website"}}]}},{"kind":"Field","name":{"kind":"Name","value":"name"}},{"kind":"Field","name":{"kind":"Name","value":"keywords"}},{"kind":"Field","name":{"kind":"Name","value":"uri"}},{"kind":"Field","name":{"kind":"Name","value":"website"}},{"kind":"Field","name":{"kind":"Name","value":"description"}}]}}]}}]} as unknown as DocumentNode<AddRepositoryMutation, AddRepositoryMutationVariables>;
export const MoveCustomSectionDocument = {"kind":"Document","definitions":[{"kind":"OperationDefinition","operation":"mutation","name":{"kind":"Name","value":"MoveCustomSection"},"variableDefinitions":[{"kind":"VariableDefinition","variable":{"kind":"Variable","name":{"kind":"Name","value":"input"}},"type":{"kind":"NonNullType","type":{"kind":"NamedType","name":{"kind":"Name","value":"MoveCustomSectionInput"}}}}],"selectionSet":{"kind":"SelectionSet","selections":[{"kind":"Field","name":{"kind":"Name","value":"moveCustomSection"},"arguments":[{"kind":"Argument","name":{"kind":"Name","value":"input"},"value":{"kind":"Variable","name":{"kind":"Name","value":"input"}}}],"selectionSet":{"kind":"SelectionSet","selections":[{"kind":"Field","name":{"kind":"Name","value":"id"}},{"kind":"Field","name":{"kind":"Name","value":"guidance"}},{"kind":"Field","name":{"kind":"Name","value":"errors"},"selectionSet":{"kind":"SelectionSet","selections":[{"kind":"Field","name":{"kind":"Name","value":"general"}}]}},{"kind":"Field","name":{"kind":"Name","value":"introduction"}},{"kind":"Field","name":{"kind":"Name","value":"migrationStatus"}},{"kind":"Field","name":{"kind":"Name","value":"name"}},{"kind":"Field","name":{"kind":"Name","value":"pinnedSectionId"}},{"kind":"Field","name":{"kind":"Name","value":"pinnedSectionType"}},{"kind":"Field","name":{"kind":"Name","value":"requirements"}},{"kind":"Field","name":{"kind":"Name","value":"templateCustomizationId"}},{"kind":"Field","name":{"kind":"Name","value":"modified"}},{"kind":"Field","name":{"kind":"Name","value":"modifiedById"}}]}}]}}]} as unknown as DocumentNode<MoveCustomSectionMutation, MoveCustomSectionMutationVariables>;
export const AddSectionCustomizationDocument = {"kind":"Document","definitions":[{"kind":"OperationDefinition","operation":"mutation","name":{"kind":"Name","value":"AddSectionCustomization"},"variableDefinitions":[{"kind":"VariableDefinition","variable":{"kind":"Variable","name":{"kind":"Name","value":"input"}},"type":{"kind":"NonNullType","type":{"kind":"NamedType","name":{"kind":"Name","value":"AddSectionCustomizationInput"}}}}],"selectionSet":{"kind":"SelectionSet","selections":[{"kind":"Field","name":{"kind":"Name","value":"addSectionCustomization"},"arguments":[{"kind":"Argument","name":{"kind":"Name","value":"input"},"value":{"kind":"Variable","name":{"kind":"Name","value":"input"}}}],"selectionSet":{"kind":"SelectionSet","selections":[{"kind":"Field","name":{"kind":"Name","value":"id"}},{"kind":"Field","name":{"kind":"Name","value":"guidance"}},{"kind":"Field","name":{"kind":"Name","value":"versionedSection"},"selectionSet":{"kind":"SelectionSet","selections":[{"kind":"Field","name":{"kind":"Name","value":"id"}},{"kind":"Field","name":{"kind":"Name","value":"name"}}]}},{"kind":"Field","name":{"kind":"Name","value":"errors"},"selectionSet":{"kind":"SelectionSet","selections":[{"kind":"Field","name":{"kind":"Name","value":"general"}},{"kind":"Field","name":{"kind":"Name","value":"guidance"}},{"kind":"Field","name":{"kind":"Name","value":"migrationStatus"}}]}},{"kind":"Field","name":{"kind":"Name","value":"migrationStatus"}},{"kind":"Field","name":{"kind":"Name","value":"modified"}},{"kind":"Field","name":{"kind":"Name","value":"sectionId"}},{"kind":"Field","name":{"kind":"Name","value":"templateCustomizationId"}}]}}]}}]} as unknown as DocumentNode<AddSectionCustomizationMutation, AddSectionCustomizationMutationVariables>;
export const UpdateSectionCustomizationDocument = {"kind":"Document","definitions":[{"kind":"OperationDefinition","operation":"mutation","name":{"kind":"Name","value":"UpdateSectionCustomization"},"variableDefinitions":[{"kind":"VariableDefinition","variable":{"kind":"Variable","name":{"kind":"Name","value":"input"}},"type":{"kind":"NonNullType","type":{"kind":"NamedType","name":{"kind":"Name","value":"UpdateSectionCustomizationInput"}}}}],"selectionSet":{"kind":"SelectionSet","selections":[{"kind":"Field","name":{"kind":"Name","value":"updateSectionCustomization"},"arguments":[{"kind":"Argument","name":{"kind":"Name","value":"input"},"value":{"kind":"Variable","name":{"kind":"Name","value":"input"}}}],"selectionSet":{"kind":"SelectionSet","selections":[{"kind":"Field","name":{"kind":"Name","value":"id"}},{"kind":"Field","name":{"kind":"Name","value":"guidance"}},{"kind":"Field","name":{"kind":"Name","value":"errors"},"selectionSet":{"kind":"SelectionSet","selections":[{"kind":"Field","name":{"kind":"Name","value":"guidance"}},{"kind":"Field","name":{"kind":"Name","value":"general"}},{"kind":"Field","name":{"kind":"Name","value":"migrationStatus"}},{"kind":"Field","name":{"kind":"Name","value":"sectionId"}},{"kind":"Field","name":{"kind":"Name","value":"templateCustomizationId"}}]}},{"kind":"Field","name":{"kind":"Name","value":"migrationStatus"}},{"kind":"Field","name":{"kind":"Name","value":"modified"}},{"kind":"Field","name":{"kind":"Name","value":"sectionId"}},{"kind":"Field","name":{"kind":"Name","value":"templateCustomizationId"}},{"kind":"Field","name":{"kind":"Name","value":"versionedSection"},"selectionSet":{"kind":"SelectionSet","selections":[{"kind":"Field","name":{"kind":"Name","value":"id"}},{"kind":"Field","name":{"kind":"Name","value":"displayOrder"}},{"kind":"Field","name":{"kind":"Name","value":"name"}}]}}]}}]}}]} as unknown as DocumentNode<UpdateSectionCustomizationMutation, UpdateSectionCustomizationMutationVariables>;
export const RemoveSectionCustomizationDocument = {"kind":"Document","definitions":[{"kind":"OperationDefinition","operation":"mutation","name":{"kind":"Name","value":"RemoveSectionCustomization"},"variableDefinitions":[{"kind":"VariableDefinition","variable":{"kind":"Variable","name":{"kind":"Name","value":"sectionCustomizationId"}},"type":{"kind":"NonNullType","type":{"kind":"NamedType","name":{"kind":"Name","value":"Int"}}}}],"selectionSet":{"kind":"SelectionSet","selections":[{"kind":"Field","name":{"kind":"Name","value":"removeSectionCustomization"},"arguments":[{"kind":"Argument","name":{"kind":"Name","value":"sectionCustomizationId"},"value":{"kind":"Variable","name":{"kind":"Name","value":"sectionCustomizationId"}}}],"selectionSet":{"kind":"SelectionSet","selections":[{"kind":"Field","name":{"kind":"Name","value":"id"}},{"kind":"Field","name":{"kind":"Name","value":"guidance"}},{"kind":"Field","name":{"kind":"Name","value":"errors"},"selectionSet":{"kind":"SelectionSet","selections":[{"kind":"Field","name":{"kind":"Name","value":"general"}},{"kind":"Field","name":{"kind":"Name","value":"guidance"}},{"kind":"Field","name":{"kind":"Name","value":"migrationStatus"}},{"kind":"Field","name":{"kind":"Name","value":"sectionId"}},{"kind":"Field","name":{"kind":"Name","value":"templateCustomizationId"}}]}},{"kind":"Field","name":{"kind":"Name","value":"migrationStatus"}},{"kind":"Field","name":{"kind":"Name","value":"modified"}},{"kind":"Field","name":{"kind":"Name","value":"sectionId"}},{"kind":"Field","name":{"kind":"Name","value":"templateCustomizationId"}},{"kind":"Field","name":{"kind":"Name","value":"versionedSection"},"selectionSet":{"kind":"SelectionSet","selections":[{"kind":"Field","name":{"kind":"Name","value":"id"}},{"kind":"Field","name":{"kind":"Name","value":"displayOrder"}},{"kind":"Field","name":{"kind":"Name","value":"guidance"}},{"kind":"Field","name":{"kind":"Name","value":"errors"},"selectionSet":{"kind":"SelectionSet","selections":[{"kind":"Field","name":{"kind":"Name","value":"general"}}]}},{"kind":"Field","name":{"kind":"Name","value":"introduction"}},{"kind":"Field","name":{"kind":"Name","value":"modified"}},{"kind":"Field","name":{"kind":"Name","value":"name"}},{"kind":"Field","name":{"kind":"Name","value":"requirements"}},{"kind":"Field","name":{"kind":"Name","value":"section"},"selectionSet":{"kind":"SelectionSet","selections":[{"kind":"Field","name":{"kind":"Name","value":"id"}},{"kind":"Field","name":{"kind":"Name","value":"displayOrder"}},{"kind":"Field","name":{"kind":"Name","value":"name"}}]}},{"kind":"Field","name":{"kind":"Name","value":"versionedQuestions"},"selectionSet":{"kind":"SelectionSet","selections":[{"kind":"Field","name":{"kind":"Name","value":"id"}},{"kind":"Field","name":{"kind":"Name","value":"guidanceText"}}]}},{"kind":"Field","name":{"kind":"Name","value":"versionedTemplate"},"selectionSet":{"kind":"SelectionSet","selections":[{"kind":"Field","name":{"kind":"Name","value":"id"}},{"kind":"Field","name":{"kind":"Name","value":"description"}},{"kind":"Field","name":{"kind":"Name","value":"name"}}]}}]}}]}}]}}]} as unknown as DocumentNode<RemoveSectionCustomizationMutation, RemoveSectionCustomizationMutationVariables>;
export const AddSectionDocument = {"kind":"Document","definitions":[{"kind":"OperationDefinition","operation":"mutation","name":{"kind":"Name","value":"AddSection"},"variableDefinitions":[{"kind":"VariableDefinition","variable":{"kind":"Variable","name":{"kind":"Name","value":"input"}},"type":{"kind":"NonNullType","type":{"kind":"NamedType","name":{"kind":"Name","value":"AddSectionInput"}}}}],"selectionSet":{"kind":"SelectionSet","selections":[{"kind":"Field","name":{"kind":"Name","value":"addSection"},"arguments":[{"kind":"Argument","name":{"kind":"Name","value":"input"},"value":{"kind":"Variable","name":{"kind":"Name","value":"input"}}}],"selectionSet":{"kind":"SelectionSet","selections":[{"kind":"Field","name":{"kind":"Name","value":"id"}},{"kind":"Field","name":{"kind":"Name","value":"tags"},"selectionSet":{"kind":"SelectionSet","selections":[{"kind":"Field","name":{"kind":"Name","value":"name"}}]}},{"kind":"Field","name":{"kind":"Name","value":"guidance"}},{"kind":"Field","name":{"kind":"Name","value":"errors"},"selectionSet":{"kind":"SelectionSet","selections":[{"kind":"Field","name":{"kind":"Name","value":"general"}},{"kind":"Field","name":{"kind":"Name","value":"name"}},{"kind":"Field","name":{"kind":"Name","value":"displayOrder"}}]}},{"kind":"Field","name":{"kind":"Name","value":"displayOrder"}},{"kind":"Field","name":{"kind":"Name","value":"introduction"}},{"kind":"Field","name":{"kind":"Name","value":"isDirty"}},{"kind":"Field","name":{"kind":"Name","value":"name"}},{"kind":"Field","name":{"kind":"Name","value":"questions"},"selectionSet":{"kind":"SelectionSet","selections":[{"kind":"Field","name":{"kind":"Name","value":"id"}},{"kind":"Field","name":{"kind":"Name","value":"errors"},"selectionSet":{"kind":"SelectionSet","selections":[{"kind":"Field","name":{"kind":"Name","value":"general"}},{"kind":"Field","name":{"kind":"Name","value":"templateId"}},{"kind":"Field","name":{"kind":"Name","value":"sectionId"}},{"kind":"Field","name":{"kind":"Name","value":"questionText"}},{"kind":"Field","name":{"kind":"Name","value":"displayOrder"}}]}}]}},{"kind":"Field","name":{"kind":"Name","value":"requirements"}}]}}]}}]} as unknown as DocumentNode<AddSectionMutation, AddSectionMutationVariables>;
export const UpdateSectionDocument = {"kind":"Document","definitions":[{"kind":"OperationDefinition","operation":"mutation","name":{"kind":"Name","value":"UpdateSection"},"variableDefinitions":[{"kind":"VariableDefinition","variable":{"kind":"Variable","name":{"kind":"Name","value":"input"}},"type":{"kind":"NonNullType","type":{"kind":"NamedType","name":{"kind":"Name","value":"UpdateSectionInput"}}}}],"selectionSet":{"kind":"SelectionSet","selections":[{"kind":"Field","name":{"kind":"Name","value":"updateSection"},"arguments":[{"kind":"Argument","name":{"kind":"Name","value":"input"},"value":{"kind":"Variable","name":{"kind":"Name","value":"input"}}}],"selectionSet":{"kind":"SelectionSet","selections":[{"kind":"Field","name":{"kind":"Name","value":"id"}},{"kind":"Field","name":{"kind":"Name","value":"name"}},{"kind":"Field","name":{"kind":"Name","value":"introduction"}},{"kind":"Field","name":{"kind":"Name","value":"requirements"}},{"kind":"Field","name":{"kind":"Name","value":"guidance"}},{"kind":"Field","name":{"kind":"Name","value":"displayOrder"}},{"kind":"Field","name":{"kind":"Name","value":"errors"},"selectionSet":{"kind":"SelectionSet","selections":[{"kind":"Field","name":{"kind":"Name","value":"general"}},{"kind":"Field","name":{"kind":"Name","value":"name"}},{"kind":"Field","name":{"kind":"Name","value":"introduction"}},{"kind":"Field","name":{"kind":"Name","value":"requirements"}},{"kind":"Field","name":{"kind":"Name","value":"guidance"}}]}},{"kind":"Field","name":{"kind":"Name","value":"bestPractice"}},{"kind":"Field","name":{"kind":"Name","value":"tags"},"selectionSet":{"kind":"SelectionSet","selections":[{"kind":"Field","name":{"kind":"Name","value":"id"}},{"kind":"Field","name":{"kind":"Name","value":"description"}},{"kind":"Field","name":{"kind":"Name","value":"name"}}]}}]}}]}}]} as unknown as DocumentNode<UpdateSectionMutation, UpdateSectionMutationVariables>;
export const RemoveSectionDocument = {"kind":"Document","definitions":[{"kind":"OperationDefinition","operation":"mutation","name":{"kind":"Name","value":"RemoveSection"},"variableDefinitions":[{"kind":"VariableDefinition","variable":{"kind":"Variable","name":{"kind":"Name","value":"sectionId"}},"type":{"kind":"NonNullType","type":{"kind":"NamedType","name":{"kind":"Name","value":"Int"}}}}],"selectionSet":{"kind":"SelectionSet","selections":[{"kind":"Field","name":{"kind":"Name","value":"removeSection"},"arguments":[{"kind":"Argument","name":{"kind":"Name","value":"sectionId"},"value":{"kind":"Variable","name":{"kind":"Name","value":"sectionId"}}}],"selectionSet":{"kind":"SelectionSet","selections":[{"kind":"Field","name":{"kind":"Name","value":"id"}},{"kind":"Field","name":{"kind":"Name","value":"name"}}]}}]}}]} as unknown as DocumentNode<RemoveSectionMutation, RemoveSectionMutationVariables>;
export const UpdateSectionDisplayOrderDocument = {"kind":"Document","definitions":[{"kind":"OperationDefinition","operation":"mutation","name":{"kind":"Name","value":"UpdateSectionDisplayOrder"},"variableDefinitions":[{"kind":"VariableDefinition","variable":{"kind":"Variable","name":{"kind":"Name","value":"sectionId"}},"type":{"kind":"NonNullType","type":{"kind":"NamedType","name":{"kind":"Name","value":"Int"}}}},{"kind":"VariableDefinition","variable":{"kind":"Variable","name":{"kind":"Name","value":"newDisplayOrder"}},"type":{"kind":"NonNullType","type":{"kind":"NamedType","name":{"kind":"Name","value":"Int"}}}}],"selectionSet":{"kind":"SelectionSet","selections":[{"kind":"Field","name":{"kind":"Name","value":"updateSectionDisplayOrder"},"arguments":[{"kind":"Argument","name":{"kind":"Name","value":"sectionId"},"value":{"kind":"Variable","name":{"kind":"Name","value":"sectionId"}}},{"kind":"Argument","name":{"kind":"Name","value":"newDisplayOrder"},"value":{"kind":"Variable","name":{"kind":"Name","value":"newDisplayOrder"}}}],"selectionSet":{"kind":"SelectionSet","selections":[{"kind":"Field","name":{"kind":"Name","value":"sections"},"selectionSet":{"kind":"SelectionSet","selections":[{"kind":"Field","name":{"kind":"Name","value":"id"}},{"kind":"Field","name":{"kind":"Name","value":"introduction"}},{"kind":"Field","name":{"kind":"Name","value":"name"}},{"kind":"Field","name":{"kind":"Name","value":"requirements"}},{"kind":"Field","name":{"kind":"Name","value":"guidance"}},{"kind":"Field","name":{"kind":"Name","value":"displayOrder"}},{"kind":"Field","name":{"kind":"Name","value":"bestPractice"}},{"kind":"Field","name":{"kind":"Name","value":"isDirty"}},{"kind":"Field","name":{"kind":"Name","value":"questions"},"selectionSet":{"kind":"SelectionSet","selections":[{"kind":"Field","name":{"kind":"Name","value":"errors"},"selectionSet":{"kind":"SelectionSet","selections":[{"kind":"Field","name":{"kind":"Name","value":"general"}},{"kind":"Field","name":{"kind":"Name","value":"templateId"}},{"kind":"Field","name":{"kind":"Name","value":"sectionId"}},{"kind":"Field","name":{"kind":"Name","value":"questionText"}},{"kind":"Field","name":{"kind":"Name","value":"displayOrder"}}]}},{"kind":"Field","name":{"kind":"Name","value":"displayOrder"}},{"kind":"Field","name":{"kind":"Name","value":"guidanceText"}},{"kind":"Field","name":{"kind":"Name","value":"id"}},{"kind":"Field","name":{"kind":"Name","value":"questionText"}},{"kind":"Field","name":{"kind":"Name","value":"sectionId"}},{"kind":"Field","name":{"kind":"Name","value":"templateId"}}]}},{"kind":"Field","name":{"kind":"Name","value":"tags"},"selectionSet":{"kind":"SelectionSet","selections":[{"kind":"Field","name":{"kind":"Name","value":"id"}},{"kind":"Field","name":{"kind":"Name","value":"description"}},{"kind":"Field","name":{"kind":"Name","value":"name"}}]}},{"kind":"Field","name":{"kind":"Name","value":"errors"},"selectionSet":{"kind":"SelectionSet","selections":[{"kind":"Field","name":{"kind":"Name","value":"general"}},{"kind":"Field","name":{"kind":"Name","value":"name"}},{"kind":"Field","name":{"kind":"Name","value":"displayOrder"}}]}},{"kind":"Field","name":{"kind":"Name","value":"template"},"selectionSet":{"kind":"SelectionSet","selections":[{"kind":"Field","name":{"kind":"Name","value":"id"}},{"kind":"Field","name":{"kind":"Name","value":"bestPractice"}},{"kind":"Field","name":{"kind":"Name","value":"isDirty"}},{"kind":"Field","name":{"kind":"Name","value":"languageId"}},{"kind":"Field","name":{"kind":"Name","value":"name"}},{"kind":"Field","name":{"kind":"Name","value":"latestPublishVisibility"}}]}}]}}]}}]}}]} as unknown as DocumentNode<UpdateSectionDisplayOrderMutation, UpdateSectionDisplayOrderMutationVariables>;
export const AddTemplateCollaboratorDocument = {"kind":"Document","definitions":[{"kind":"OperationDefinition","operation":"mutation","name":{"kind":"Name","value":"AddTemplateCollaborator"},"variableDefinitions":[{"kind":"VariableDefinition","variable":{"kind":"Variable","name":{"kind":"Name","value":"templateId"}},"type":{"kind":"NonNullType","type":{"kind":"NamedType","name":{"kind":"Name","value":"Int"}}}},{"kind":"VariableDefinition","variable":{"kind":"Variable","name":{"kind":"Name","value":"email"}},"type":{"kind":"NonNullType","type":{"kind":"NamedType","name":{"kind":"Name","value":"String"}}}}],"selectionSet":{"kind":"SelectionSet","selections":[{"kind":"Field","name":{"kind":"Name","value":"addTemplateCollaborator"},"arguments":[{"kind":"Argument","name":{"kind":"Name","value":"templateId"},"value":{"kind":"Variable","name":{"kind":"Name","value":"templateId"}}},{"kind":"Argument","name":{"kind":"Name","value":"email"},"value":{"kind":"Variable","name":{"kind":"Name","value":"email"}}}],"selectionSet":{"kind":"SelectionSet","selections":[{"kind":"Field","name":{"kind":"Name","value":"errors"},"selectionSet":{"kind":"SelectionSet","selections":[{"kind":"Field","name":{"kind":"Name","value":"general"}},{"kind":"Field","name":{"kind":"Name","value":"email"}}]}},{"kind":"Field","name":{"kind":"Name","value":"email"}},{"kind":"Field","name":{"kind":"Name","value":"id"}}]}}]}}]} as unknown as DocumentNode<AddTemplateCollaboratorMutation, AddTemplateCollaboratorMutationVariables>;
export const RemoveTemplateCollaboratorDocument = {"kind":"Document","definitions":[{"kind":"OperationDefinition","operation":"mutation","name":{"kind":"Name","value":"RemoveTemplateCollaborator"},"variableDefinitions":[{"kind":"VariableDefinition","variable":{"kind":"Variable","name":{"kind":"Name","value":"templateId"}},"type":{"kind":"NonNullType","type":{"kind":"NamedType","name":{"kind":"Name","value":"Int"}}}},{"kind":"VariableDefinition","variable":{"kind":"Variable","name":{"kind":"Name","value":"email"}},"type":{"kind":"NonNullType","type":{"kind":"NamedType","name":{"kind":"Name","value":"String"}}}}],"selectionSet":{"kind":"SelectionSet","selections":[{"kind":"Field","name":{"kind":"Name","value":"removeTemplateCollaborator"},"arguments":[{"kind":"Argument","name":{"kind":"Name","value":"templateId"},"value":{"kind":"Variable","name":{"kind":"Name","value":"templateId"}}},{"kind":"Argument","name":{"kind":"Name","value":"email"},"value":{"kind":"Variable","name":{"kind":"Name","value":"email"}}}],"selectionSet":{"kind":"SelectionSet","selections":[{"kind":"Field","name":{"kind":"Name","value":"errors"},"selectionSet":{"kind":"SelectionSet","selections":[{"kind":"Field","name":{"kind":"Name","value":"general"}},{"kind":"Field","name":{"kind":"Name","value":"email"}}]}}]}}]}}]} as unknown as DocumentNode<RemoveTemplateCollaboratorMutation, RemoveTemplateCollaboratorMutationVariables>;
export const AddTemplateCustomizationDocument = {"kind":"Document","definitions":[{"kind":"OperationDefinition","operation":"mutation","name":{"kind":"Name","value":"AddTemplateCustomization"},"variableDefinitions":[{"kind":"VariableDefinition","variable":{"kind":"Variable","name":{"kind":"Name","value":"input"}},"type":{"kind":"NonNullType","type":{"kind":"NamedType","name":{"kind":"Name","value":"AddTemplateCustomizationInput"}}}}],"selectionSet":{"kind":"SelectionSet","selections":[{"kind":"Field","name":{"kind":"Name","value":"addTemplateCustomization"},"arguments":[{"kind":"Argument","name":{"kind":"Name","value":"input"},"value":{"kind":"Variable","name":{"kind":"Name","value":"input"}}}],"selectionSet":{"kind":"SelectionSet","selections":[{"kind":"Field","name":{"kind":"Name","value":"customizationId"}},{"kind":"Field","name":{"kind":"Name","value":"errors"},"selectionSet":{"kind":"SelectionSet","selections":[{"kind":"Field","name":{"kind":"Name","value":"general"}}]}},{"kind":"Field","name":{"kind":"Name","value":"customizationIsDirty"}},{"kind":"Field","name":{"kind":"Name","value":"versionedTemplateId"}},{"kind":"Field","name":{"kind":"Name","value":"versionedTemplateAffiliationId"}},{"kind":"Field","name":{"kind":"Name","value":"customizationStatus"}},{"kind":"Field","name":{"kind":"Name","value":"customizationMigrationStatus"}}]}}]}}]} as unknown as DocumentNode<AddTemplateCustomizationMutation, AddTemplateCustomizationMutationVariables>;
export const PublishTemplateCustomizationDocument = {"kind":"Document","definitions":[{"kind":"OperationDefinition","operation":"mutation","name":{"kind":"Name","value":"PublishTemplateCustomization"},"variableDefinitions":[{"kind":"VariableDefinition","variable":{"kind":"Variable","name":{"kind":"Name","value":"templateCustomizationId"}},"type":{"kind":"NonNullType","type":{"kind":"NamedType","name":{"kind":"Name","value":"Int"}}}}],"selectionSet":{"kind":"SelectionSet","selections":[{"kind":"Field","name":{"kind":"Name","value":"publishTemplateCustomization"},"arguments":[{"kind":"Argument","name":{"kind":"Name","value":"templateCustomizationId"},"value":{"kind":"Variable","name":{"kind":"Name","value":"templateCustomizationId"}}}],"selectionSet":{"kind":"SelectionSet","selections":[{"kind":"Field","name":{"kind":"Name","value":"customizationId"}},{"kind":"Field","name":{"kind":"Name","value":"customizationIsDirty"}},{"kind":"Field","name":{"kind":"Name","value":"customizationLastCustomized"}},{"kind":"Field","name":{"kind":"Name","value":"customizationLastCustomizedById"}},{"kind":"Field","name":{"kind":"Name","value":"customizationLastCustomizedByName"}},{"kind":"Field","name":{"kind":"Name","value":"customizationMigrationStatus"}},{"kind":"Field","name":{"kind":"Name","value":"customizationStatus"}},{"kind":"Field","name":{"kind":"Name","value":"errors"},"selectionSet":{"kind":"SelectionSet","selections":[{"kind":"Field","name":{"kind":"Name","value":"affiliationId"}},{"kind":"Field","name":{"kind":"Name","value":"currentVersionedTemplateId"}},{"kind":"Field","name":{"kind":"Name","value":"general"}},{"kind":"Field","name":{"kind":"Name","value":"templateId"}}]}},{"kind":"Field","name":{"kind":"Name","value":"sections"},"selectionSet":{"kind":"SelectionSet","selections":[{"kind":"Field","name":{"kind":"Name","value":"name"}},{"kind":"Field","name":{"kind":"Name","value":"id"}},{"kind":"Field","name":{"kind":"Name","value":"hasCustomGuidance"}},{"kind":"Field","name":{"kind":"Name","value":"displayOrder"}},{"kind":"Field","name":{"kind":"Name","value":"questions"},"selectionSet":{"kind":"SelectionSet","selections":[{"kind":"Field","name":{"kind":"Name","value":"id"}},{"kind":"Field","name":{"kind":"Name","value":"hasCustomSampleAnswer"}},{"kind":"Field","name":{"kind":"Name","value":"displayOrder"}},{"kind":"Field","name":{"kind":"Name","value":"hasCustomGuidance"}},{"kind":"Field","name":{"kind":"Name","value":"questionText"}},{"kind":"Field","name":{"kind":"Name","value":"migrationStatus"}},{"kind":"Field","name":{"kind":"Name","value":"questionType"}}]}},{"kind":"Field","name":{"kind":"Name","value":"sectionType"}},{"kind":"Field","name":{"kind":"Name","value":"migrationStatus"}}]}},{"kind":"Field","name":{"kind":"Name","value":"versionedTemplateAffiliationId"}},{"kind":"Field","name":{"kind":"Name","value":"versionedTemplateAffiliationName"}},{"kind":"Field","name":{"kind":"Name","value":"versionedTemplateDescription"}},{"kind":"Field","name":{"kind":"Name","value":"versionedTemplateId"}},{"kind":"Field","name":{"kind":"Name","value":"versionedTemplateLastModified"}},{"kind":"Field","name":{"kind":"Name","value":"versionedTemplateName"}},{"kind":"Field","name":{"kind":"Name","value":"versionedTemplateVersion"}}]}}]}}]} as unknown as DocumentNode<PublishTemplateCustomizationMutation, PublishTemplateCustomizationMutationVariables>;
export const UnpublishTemplateCustomizationDocument = {"kind":"Document","definitions":[{"kind":"OperationDefinition","operation":"mutation","name":{"kind":"Name","value":"UnpublishTemplateCustomization"},"variableDefinitions":[{"kind":"VariableDefinition","variable":{"kind":"Variable","name":{"kind":"Name","value":"templateCustomizationId"}},"type":{"kind":"NonNullType","type":{"kind":"NamedType","name":{"kind":"Name","value":"Int"}}}}],"selectionSet":{"kind":"SelectionSet","selections":[{"kind":"Field","name":{"kind":"Name","value":"unpublishTemplateCustomization"},"arguments":[{"kind":"Argument","name":{"kind":"Name","value":"templateCustomizationId"},"value":{"kind":"Variable","name":{"kind":"Name","value":"templateCustomizationId"}}}],"selectionSet":{"kind":"SelectionSet","selections":[{"kind":"Field","name":{"kind":"Name","value":"customizationId"}},{"kind":"Field","name":{"kind":"Name","value":"customizationIsDirty"}},{"kind":"Field","name":{"kind":"Name","value":"customizationLastCustomized"}},{"kind":"Field","name":{"kind":"Name","value":"customizationLastCustomizedById"}},{"kind":"Field","name":{"kind":"Name","value":"customizationLastCustomizedByName"}},{"kind":"Field","name":{"kind":"Name","value":"customizationLastPublishedDate"}},{"kind":"Field","name":{"kind":"Name","value":"customizationMigrationStatus"}},{"kind":"Field","name":{"kind":"Name","value":"customizationStatus"}},{"kind":"Field","name":{"kind":"Name","value":"errors"},"selectionSet":{"kind":"SelectionSet","selections":[{"kind":"Field","name":{"kind":"Name","value":"affiliationId"}},{"kind":"Field","name":{"kind":"Name","value":"currentVersionedTemplateId"}},{"kind":"Field","name":{"kind":"Name","value":"general"}},{"kind":"Field","name":{"kind":"Name","value":"templateId"}}]}},{"kind":"Field","name":{"kind":"Name","value":"sections"},"selectionSet":{"kind":"SelectionSet","selections":[{"kind":"Field","name":{"kind":"Name","value":"id"}},{"kind":"Field","name":{"kind":"Name","value":"hasCustomGuidance"}},{"kind":"Field","name":{"kind":"Name","value":"name"}},{"kind":"Field","name":{"kind":"Name","value":"migrationStatus"}},{"kind":"Field","name":{"kind":"Name","value":"questions"},"selectionSet":{"kind":"SelectionSet","selections":[{"kind":"Field","name":{"kind":"Name","value":"id"}},{"kind":"Field","name":{"kind":"Name","value":"hasCustomSampleAnswer"}},{"kind":"Field","name":{"kind":"Name","value":"hasCustomGuidance"}},{"kind":"Field","name":{"kind":"Name","value":"displayOrder"}},{"kind":"Field","name":{"kind":"Name","value":"questionCustomizationId"}},{"kind":"Field","name":{"kind":"Name","value":"questionText"}},{"kind":"Field","name":{"kind":"Name","value":"questionType"}}]}},{"kind":"Field","name":{"kind":"Name","value":"sectionCustomizationId"}},{"kind":"Field","name":{"kind":"Name","value":"sectionType"}}]}},{"kind":"Field","name":{"kind":"Name","value":"versionedTemplateAffiliationId"}},{"kind":"Field","name":{"kind":"Name","value":"versionedTemplateAffiliationName"}},{"kind":"Field","name":{"kind":"Name","value":"versionedTemplateDescription"}},{"kind":"Field","name":{"kind":"Name","value":"versionedTemplateId"}},{"kind":"Field","name":{"kind":"Name","value":"versionedTemplateLastModified"}},{"kind":"Field","name":{"kind":"Name","value":"versionedTemplateName"}},{"kind":"Field","name":{"kind":"Name","value":"versionedTemplateVersion"}}]}}]}}]} as unknown as DocumentNode<UnpublishTemplateCustomizationMutation, UnpublishTemplateCustomizationMutationVariables>;
export const RemoveTemplateCustomizationDocument = {"kind":"Document","definitions":[{"kind":"OperationDefinition","operation":"mutation","name":{"kind":"Name","value":"RemoveTemplateCustomization"},"variableDefinitions":[{"kind":"VariableDefinition","variable":{"kind":"Variable","name":{"kind":"Name","value":"templateCustomizationId"}},"type":{"kind":"NonNullType","type":{"kind":"NamedType","name":{"kind":"Name","value":"Int"}}}}],"selectionSet":{"kind":"SelectionSet","selections":[{"kind":"Field","name":{"kind":"Name","value":"removeTemplateCustomization"},"arguments":[{"kind":"Argument","name":{"kind":"Name","value":"templateCustomizationId"},"value":{"kind":"Variable","name":{"kind":"Name","value":"templateCustomizationId"}}}],"selectionSet":{"kind":"SelectionSet","selections":[{"kind":"Field","name":{"kind":"Name","value":"id"}},{"kind":"Field","name":{"kind":"Name","value":"currentVersionedTemplateId"}},{"kind":"Field","name":{"kind":"Name","value":"affiliationId"}},{"kind":"Field","name":{"kind":"Name","value":"errors"},"selectionSet":{"kind":"SelectionSet","selections":[{"kind":"Field","name":{"kind":"Name","value":"affiliationId"}},{"kind":"Field","name":{"kind":"Name","value":"currentVersionedTemplateId"}},{"kind":"Field","name":{"kind":"Name","value":"general"}},{"kind":"Field","name":{"kind":"Name","value":"templateId"}}]}},{"kind":"Field","name":{"kind":"Name","value":"isDirty"}},{"kind":"Field","name":{"kind":"Name","value":"latestPublishedDate"}},{"kind":"Field","name":{"kind":"Name","value":"migrationStatus"}},{"kind":"Field","name":{"kind":"Name","value":"modified"}},{"kind":"Field","name":{"kind":"Name","value":"status"}}]}}]}}]} as unknown as DocumentNode<RemoveTemplateCustomizationMutation, RemoveTemplateCustomizationMutationVariables>;
export const ArchiveTemplateDocument = {"kind":"Document","definitions":[{"kind":"OperationDefinition","operation":"mutation","name":{"kind":"Name","value":"ArchiveTemplate"},"variableDefinitions":[{"kind":"VariableDefinition","variable":{"kind":"Variable","name":{"kind":"Name","value":"templateId"}},"type":{"kind":"NonNullType","type":{"kind":"NamedType","name":{"kind":"Name","value":"Int"}}}}],"selectionSet":{"kind":"SelectionSet","selections":[{"kind":"Field","name":{"kind":"Name","value":"archiveTemplate"},"arguments":[{"kind":"Argument","name":{"kind":"Name","value":"templateId"},"value":{"kind":"Variable","name":{"kind":"Name","value":"templateId"}}}],"selectionSet":{"kind":"SelectionSet","selections":[{"kind":"Field","name":{"kind":"Name","value":"id"}},{"kind":"Field","name":{"kind":"Name","value":"errors"},"selectionSet":{"kind":"SelectionSet","selections":[{"kind":"Field","name":{"kind":"Name","value":"general"}},{"kind":"Field","name":{"kind":"Name","value":"name"}},{"kind":"Field","name":{"kind":"Name","value":"ownerId"}}]}},{"kind":"Field","name":{"kind":"Name","value":"name"}}]}}]}}]} as unknown as DocumentNode<ArchiveTemplateMutation, ArchiveTemplateMutationVariables>;
export const CreateTemplateVersionDocument = {"kind":"Document","definitions":[{"kind":"OperationDefinition","operation":"mutation","name":{"kind":"Name","value":"CreateTemplateVersion"},"variableDefinitions":[{"kind":"VariableDefinition","variable":{"kind":"Variable","name":{"kind":"Name","value":"templateId"}},"type":{"kind":"NonNullType","type":{"kind":"NamedType","name":{"kind":"Name","value":"Int"}}}},{"kind":"VariableDefinition","variable":{"kind":"Variable","name":{"kind":"Name","value":"comment"}},"type":{"kind":"NamedType","name":{"kind":"Name","value":"String"}}},{"kind":"VariableDefinition","variable":{"kind":"Variable","name":{"kind":"Name","value":"versionType"}},"type":{"kind":"NamedType","name":{"kind":"Name","value":"TemplateVersionType"}}},{"kind":"VariableDefinition","variable":{"kind":"Variable","name":{"kind":"Name","value":"latestPublishVisibility"}},"type":{"kind":"NonNullType","type":{"kind":"NamedType","name":{"kind":"Name","value":"TemplateVisibility"}}}}],"selectionSet":{"kind":"SelectionSet","selections":[{"kind":"Field","name":{"kind":"Name","value":"createTemplateVersion"},"arguments":[{"kind":"Argument","name":{"kind":"Name","value":"templateId"},"value":{"kind":"Variable","name":{"kind":"Name","value":"templateId"}}},{"kind":"Argument","name":{"kind":"Name","value":"comment"},"value":{"kind":"Variable","name":{"kind":"Name","value":"comment"}}},{"kind":"Argument","name":{"kind":"Name","value":"versionType"},"value":{"kind":"Variable","name":{"kind":"Name","value":"versionType"}}},{"kind":"Argument","name":{"kind":"Name","value":"latestPublishVisibility"},"value":{"kind":"Variable","name":{"kind":"Name","value":"latestPublishVisibility"}}}],"selectionSet":{"kind":"SelectionSet","selections":[{"kind":"Field","name":{"kind":"Name","value":"errors"},"selectionSet":{"kind":"SelectionSet","selections":[{"kind":"Field","name":{"kind":"Name","value":"general"}},{"kind":"Field","name":{"kind":"Name","value":"name"}},{"kind":"Field","name":{"kind":"Name","value":"ownerId"}}]}},{"kind":"Field","name":{"kind":"Name","value":"name"}}]}}]}}]} as unknown as DocumentNode<CreateTemplateVersionMutation, CreateTemplateVersionMutationVariables>;
export const AddTemplateDocument = {"kind":"Document","definitions":[{"kind":"OperationDefinition","operation":"mutation","name":{"kind":"Name","value":"AddTemplate"},"variableDefinitions":[{"kind":"VariableDefinition","variable":{"kind":"Variable","name":{"kind":"Name","value":"name"}},"type":{"kind":"NonNullType","type":{"kind":"NamedType","name":{"kind":"Name","value":"String"}}}},{"kind":"VariableDefinition","variable":{"kind":"Variable","name":{"kind":"Name","value":"copyFromTemplateId"}},"type":{"kind":"NamedType","name":{"kind":"Name","value":"Int"}}},{"kind":"VariableDefinition","variable":{"kind":"Variable","name":{"kind":"Name","value":"copyFromVersionedTemplateId"}},"type":{"kind":"NamedType","name":{"kind":"Name","value":"Int"}}}],"selectionSet":{"kind":"SelectionSet","selections":[{"kind":"Field","name":{"kind":"Name","value":"addTemplate"},"arguments":[{"kind":"Argument","name":{"kind":"Name","value":"name"},"value":{"kind":"Variable","name":{"kind":"Name","value":"name"}}},{"kind":"Argument","name":{"kind":"Name","value":"copyFromTemplateId"},"value":{"kind":"Variable","name":{"kind":"Name","value":"copyFromTemplateId"}}},{"kind":"Argument","name":{"kind":"Name","value":"copyFromVersionedTemplateId"},"value":{"kind":"Variable","name":{"kind":"Name","value":"copyFromVersionedTemplateId"}}}],"selectionSet":{"kind":"SelectionSet","selections":[{"kind":"Field","name":{"kind":"Name","value":"id"}},{"kind":"Field","name":{"kind":"Name","value":"errors"},"selectionSet":{"kind":"SelectionSet","selections":[{"kind":"Field","name":{"kind":"Name","value":"general"}},{"kind":"Field","name":{"kind":"Name","value":"name"}},{"kind":"Field","name":{"kind":"Name","value":"ownerId"}}]}},{"kind":"Field","name":{"kind":"Name","value":"description"}},{"kind":"Field","name":{"kind":"Name","value":"name"}}]}}]}}]} as unknown as DocumentNode<AddTemplateMutation, AddTemplateMutationVariables>;
export const UpdateTemplateDocument = {"kind":"Document","definitions":[{"kind":"OperationDefinition","operation":"mutation","name":{"kind":"Name","value":"UpdateTemplate"},"variableDefinitions":[{"kind":"VariableDefinition","variable":{"kind":"Variable","name":{"kind":"Name","value":"templateId"}},"type":{"kind":"NonNullType","type":{"kind":"NamedType","name":{"kind":"Name","value":"Int"}}}},{"kind":"VariableDefinition","variable":{"kind":"Variable","name":{"kind":"Name","value":"name"}},"type":{"kind":"NonNullType","type":{"kind":"NamedType","name":{"kind":"Name","value":"String"}}}}],"selectionSet":{"kind":"SelectionSet","selections":[{"kind":"Field","name":{"kind":"Name","value":"updateTemplate"},"arguments":[{"kind":"Argument","name":{"kind":"Name","value":"templateId"},"value":{"kind":"Variable","name":{"kind":"Name","value":"templateId"}}},{"kind":"Argument","name":{"kind":"Name","value":"name"},"value":{"kind":"Variable","name":{"kind":"Name","value":"name"}}}],"selectionSet":{"kind":"SelectionSet","selections":[{"kind":"Field","name":{"kind":"Name","value":"id"}},{"kind":"Field","name":{"kind":"Name","value":"name"}},{"kind":"Field","name":{"kind":"Name","value":"latestPublishVisibility"}},{"kind":"Field","name":{"kind":"Name","value":"errors"},"selectionSet":{"kind":"SelectionSet","selections":[{"kind":"Field","name":{"kind":"Name","value":"general"}},{"kind":"Field","name":{"kind":"Name","value":"name"}},{"kind":"Field","name":{"kind":"Name","value":"description"}}]}}]}}]}}]} as unknown as DocumentNode<UpdateTemplateMutation, UpdateTemplateMutationVariables>;
export const UpdateUserProfileDocument = {"kind":"Document","definitions":[{"kind":"OperationDefinition","operation":"mutation","name":{"kind":"Name","value":"UpdateUserProfile"},"variableDefinitions":[{"kind":"VariableDefinition","variable":{"kind":"Variable","name":{"kind":"Name","value":"input"}},"type":{"kind":"NonNullType","type":{"kind":"NamedType","name":{"kind":"Name","value":"UpdateUserProfileInput"}}}}],"selectionSet":{"kind":"SelectionSet","selections":[{"kind":"Field","name":{"kind":"Name","value":"updateUserProfile"},"arguments":[{"kind":"Argument","name":{"kind":"Name","value":"input"},"value":{"kind":"Variable","name":{"kind":"Name","value":"input"}}}],"selectionSet":{"kind":"SelectionSet","selections":[{"kind":"Field","name":{"kind":"Name","value":"id"}},{"kind":"Field","name":{"kind":"Name","value":"givenName"}},{"kind":"Field","name":{"kind":"Name","value":"surName"}},{"kind":"Field","name":{"kind":"Name","value":"errors"},"selectionSet":{"kind":"SelectionSet","selections":[{"kind":"Field","name":{"kind":"Name","value":"general"}},{"kind":"Field","name":{"kind":"Name","value":"email"}},{"kind":"Field","name":{"kind":"Name","value":"password"}},{"kind":"Field","name":{"kind":"Name","value":"role"}}]}},{"kind":"Field","name":{"kind":"Name","value":"affiliation"},"selectionSet":{"kind":"SelectionSet","selections":[{"kind":"Field","name":{"kind":"Name","value":"id"}},{"kind":"Field","name":{"kind":"Name","value":"name"}},{"kind":"Field","name":{"kind":"Name","value":"searchName"}},{"kind":"Field","name":{"kind":"Name","value":"uri"}}]}},{"kind":"Field","name":{"kind":"Name","value":"languageId"}},{"kind":"Field","name":{"kind":"Name","value":"email"}}]}}]}}]} as unknown as DocumentNode<UpdateUserProfileMutation, UpdateUserProfileMutationVariables>;
export const AddUserEmailDocument = {"kind":"Document","definitions":[{"kind":"OperationDefinition","operation":"mutation","name":{"kind":"Name","value":"AddUserEmail"},"variableDefinitions":[{"kind":"VariableDefinition","variable":{"kind":"Variable","name":{"kind":"Name","value":"email"}},"type":{"kind":"NonNullType","type":{"kind":"NamedType","name":{"kind":"Name","value":"String"}}}},{"kind":"VariableDefinition","variable":{"kind":"Variable","name":{"kind":"Name","value":"isPrimary"}},"type":{"kind":"NonNullType","type":{"kind":"NamedType","name":{"kind":"Name","value":"Boolean"}}}}],"selectionSet":{"kind":"SelectionSet","selections":[{"kind":"Field","name":{"kind":"Name","value":"addUserEmail"},"arguments":[{"kind":"Argument","name":{"kind":"Name","value":"email"},"value":{"kind":"Variable","name":{"kind":"Name","value":"email"}}},{"kind":"Argument","name":{"kind":"Name","value":"isPrimary"},"value":{"kind":"Variable","name":{"kind":"Name","value":"isPrimary"}}}],"selectionSet":{"kind":"SelectionSet","selections":[{"kind":"Field","name":{"kind":"Name","value":"email"}},{"kind":"Field","name":{"kind":"Name","value":"errors"},"selectionSet":{"kind":"SelectionSet","selections":[{"kind":"Field","name":{"kind":"Name","value":"general"}},{"kind":"Field","name":{"kind":"Name","value":"userId"}},{"kind":"Field","name":{"kind":"Name","value":"email"}}]}},{"kind":"Field","name":{"kind":"Name","value":"isPrimary"}},{"kind":"Field","name":{"kind":"Name","value":"isConfirmed"}},{"kind":"Field","name":{"kind":"Name","value":"id"}},{"kind":"Field","name":{"kind":"Name","value":"userId"}}]}}]}}]} as unknown as DocumentNode<AddUserEmailMutation, AddUserEmailMutationVariables>;
export const RemoveUserEmailDocument = {"kind":"Document","definitions":[{"kind":"OperationDefinition","operation":"mutation","name":{"kind":"Name","value":"RemoveUserEmail"},"variableDefinitions":[{"kind":"VariableDefinition","variable":{"kind":"Variable","name":{"kind":"Name","value":"email"}},"type":{"kind":"NonNullType","type":{"kind":"NamedType","name":{"kind":"Name","value":"String"}}}}],"selectionSet":{"kind":"SelectionSet","selections":[{"kind":"Field","name":{"kind":"Name","value":"removeUserEmail"},"arguments":[{"kind":"Argument","name":{"kind":"Name","value":"email"},"value":{"kind":"Variable","name":{"kind":"Name","value":"email"}}}],"selectionSet":{"kind":"SelectionSet","selections":[{"kind":"Field","name":{"kind":"Name","value":"errors"},"selectionSet":{"kind":"SelectionSet","selections":[{"kind":"Field","name":{"kind":"Name","value":"general"}},{"kind":"Field","name":{"kind":"Name","value":"userId"}},{"kind":"Field","name":{"kind":"Name","value":"email"}}]}}]}}]}}]} as unknown as DocumentNode<RemoveUserEmailMutation, RemoveUserEmailMutationVariables>;
export const SetPrimaryUserEmailDocument = {"kind":"Document","definitions":[{"kind":"OperationDefinition","operation":"mutation","name":{"kind":"Name","value":"SetPrimaryUserEmail"},"variableDefinitions":[{"kind":"VariableDefinition","variable":{"kind":"Variable","name":{"kind":"Name","value":"email"}},"type":{"kind":"NonNullType","type":{"kind":"NamedType","name":{"kind":"Name","value":"String"}}}}],"selectionSet":{"kind":"SelectionSet","selections":[{"kind":"Field","name":{"kind":"Name","value":"setPrimaryUserEmail"},"arguments":[{"kind":"Argument","name":{"kind":"Name","value":"email"},"value":{"kind":"Variable","name":{"kind":"Name","value":"email"}}}],"selectionSet":{"kind":"SelectionSet","selections":[{"kind":"Field","name":{"kind":"Name","value":"id"}},{"kind":"Field","name":{"kind":"Name","value":"errors"},"selectionSet":{"kind":"SelectionSet","selections":[{"kind":"Field","name":{"kind":"Name","value":"general"}},{"kind":"Field","name":{"kind":"Name","value":"userId"}},{"kind":"Field","name":{"kind":"Name","value":"email"}}]}},{"kind":"Field","name":{"kind":"Name","value":"email"}},{"kind":"Field","name":{"kind":"Name","value":"isConfirmed"}},{"kind":"Field","name":{"kind":"Name","value":"isPrimary"}},{"kind":"Field","name":{"kind":"Name","value":"userId"}}]}}]}}]} as unknown as DocumentNode<SetPrimaryUserEmailMutation, SetPrimaryUserEmailMutationVariables>;
export const AffiliationsDocument = {"kind":"Document","definitions":[{"kind":"OperationDefinition","operation":"query","name":{"kind":"Name","value":"Affiliations"},"variableDefinitions":[{"kind":"VariableDefinition","variable":{"kind":"Variable","name":{"kind":"Name","value":"name"}},"type":{"kind":"NonNullType","type":{"kind":"NamedType","name":{"kind":"Name","value":"String"}}}}],"selectionSet":{"kind":"SelectionSet","selections":[{"kind":"Field","name":{"kind":"Name","value":"affiliations"},"arguments":[{"kind":"Argument","name":{"kind":"Name","value":"name"},"value":{"kind":"Variable","name":{"kind":"Name","value":"name"}}}],"selectionSet":{"kind":"SelectionSet","selections":[{"kind":"Field","name":{"kind":"Name","value":"totalCount"}},{"kind":"Field","name":{"kind":"Name","value":"nextCursor"}},{"kind":"Field","name":{"kind":"Name","value":"items"},"selectionSet":{"kind":"SelectionSet","selections":[{"kind":"Field","name":{"kind":"Name","value":"id"}},{"kind":"Field","name":{"kind":"Name","value":"displayName"}},{"kind":"Field","name":{"kind":"Name","value":"uri"}},{"kind":"Field","name":{"kind":"Name","value":"apiTarget"}}]}}]}}]}}]} as unknown as DocumentNode<AffiliationsQuery, AffiliationsQueryVariables>;
export const AffiliationFundersDocument = {"kind":"Document","definitions":[{"kind":"OperationDefinition","operation":"query","name":{"kind":"Name","value":"AffiliationFunders"},"variableDefinitions":[{"kind":"VariableDefinition","variable":{"kind":"Variable","name":{"kind":"Name","value":"name"}},"type":{"kind":"NonNullType","type":{"kind":"NamedType","name":{"kind":"Name","value":"String"}}}},{"kind":"VariableDefinition","variable":{"kind":"Variable","name":{"kind":"Name","value":"funderOnly"}},"type":{"kind":"NamedType","name":{"kind":"Name","value":"Boolean"}}},{"kind":"VariableDefinition","variable":{"kind":"Variable","name":{"kind":"Name","value":"paginationOptions"}},"type":{"kind":"NamedType","name":{"kind":"Name","value":"PaginationOptions"}}}],"selectionSet":{"kind":"SelectionSet","selections":[{"kind":"Field","name":{"kind":"Name","value":"affiliations"},"arguments":[{"kind":"Argument","name":{"kind":"Name","value":"name"},"value":{"kind":"Variable","name":{"kind":"Name","value":"name"}}},{"kind":"Argument","name":{"kind":"Name","value":"funderOnly"},"value":{"kind":"Variable","name":{"kind":"Name","value":"funderOnly"}}},{"kind":"Argument","name":{"kind":"Name","value":"paginationOptions"},"value":{"kind":"Variable","name":{"kind":"Name","value":"paginationOptions"}}}],"selectionSet":{"kind":"SelectionSet","selections":[{"kind":"Field","name":{"kind":"Name","value":"totalCount"}},{"kind":"Field","name":{"kind":"Name","value":"nextCursor"}},{"kind":"Field","name":{"kind":"Name","value":"items"},"selectionSet":{"kind":"SelectionSet","selections":[{"kind":"Field","name":{"kind":"Name","value":"id"}},{"kind":"Field","name":{"kind":"Name","value":"displayName"}},{"kind":"Field","name":{"kind":"Name","value":"apiTarget"}},{"kind":"Field","name":{"kind":"Name","value":"uri"}}]}}]}}]}}]} as unknown as DocumentNode<AffiliationFundersQuery, AffiliationFundersQueryVariables>;
export const ManagedAffiliationsWithGuidanceDocument = {"kind":"Document","definitions":[{"kind":"OperationDefinition","operation":"query","name":{"kind":"Name","value":"ManagedAffiliationsWithGuidance"},"variableDefinitions":[{"kind":"VariableDefinition","variable":{"kind":"Variable","name":{"kind":"Name","value":"name"}},"type":{"kind":"NamedType","name":{"kind":"Name","value":"String"}}},{"kind":"VariableDefinition","variable":{"kind":"Variable","name":{"kind":"Name","value":"versionedTemplateId"}},"type":{"kind":"NonNullType","type":{"kind":"NamedType","name":{"kind":"Name","value":"Int"}}}},{"kind":"VariableDefinition","variable":{"kind":"Variable","name":{"kind":"Name","value":"paginationOptions"}},"type":{"kind":"NamedType","name":{"kind":"Name","value":"PaginationOptions"}}}],"selectionSet":{"kind":"SelectionSet","selections":[{"kind":"Field","name":{"kind":"Name","value":"managedAffiliationsWithGuidance"},"arguments":[{"kind":"Argument","name":{"kind":"Name","value":"name"},"value":{"kind":"Variable","name":{"kind":"Name","value":"name"}}},{"kind":"Argument","name":{"kind":"Name","value":"versionedTemplateId"},"value":{"kind":"Variable","name":{"kind":"Name","value":"versionedTemplateId"}}},{"kind":"Argument","name":{"kind":"Name","value":"paginationOptions"},"value":{"kind":"Variable","name":{"kind":"Name","value":"paginationOptions"}}}],"selectionSet":{"kind":"SelectionSet","selections":[{"kind":"Field","name":{"kind":"Name","value":"items"},"selectionSet":{"kind":"SelectionSet","selections":[{"kind":"Field","name":{"kind":"Name","value":"id"}},{"kind":"Field","name":{"kind":"Name","value":"funder"}},{"kind":"Field","name":{"kind":"Name","value":"displayName"}},{"kind":"Field","name":{"kind":"Name","value":"uri"}},{"kind":"Field","name":{"kind":"Name","value":"acronyms"}}]}},{"kind":"Field","name":{"kind":"Name","value":"limit"}},{"kind":"Field","name":{"kind":"Name","value":"totalCount"}},{"kind":"Field","name":{"kind":"Name","value":"hasNextPage"}},{"kind":"Field","name":{"kind":"Name","value":"hasPreviousPage"}},{"kind":"Field","name":{"kind":"Name","value":"nextCursor"}}]}}]}}]} as unknown as DocumentNode<ManagedAffiliationsWithGuidanceQuery, ManagedAffiliationsWithGuidanceQueryVariables>;
export const AffiliationByIdDocument = {"kind":"Document","definitions":[{"kind":"OperationDefinition","operation":"query","name":{"kind":"Name","value":"AffiliationById"},"variableDefinitions":[{"kind":"VariableDefinition","variable":{"kind":"Variable","name":{"kind":"Name","value":"affiliationId"}},"type":{"kind":"NonNullType","type":{"kind":"NamedType","name":{"kind":"Name","value":"Int"}}}}],"selectionSet":{"kind":"SelectionSet","selections":[{"kind":"Field","name":{"kind":"Name","value":"affiliationById"},"arguments":[{"kind":"Argument","name":{"kind":"Name","value":"affiliationId"},"value":{"kind":"Variable","name":{"kind":"Name","value":"affiliationId"}}}],"selectionSet":{"kind":"SelectionSet","selections":[{"kind":"Field","name":{"kind":"Name","value":"feedbackEmails"}},{"kind":"Field","name":{"kind":"Name","value":"feedbackEnabled"}},{"kind":"Field","name":{"kind":"Name","value":"feedbackMessage"}},{"kind":"Field","name":{"kind":"Name","value":"displayName"}},{"kind":"Field","name":{"kind":"Name","value":"name"}},{"kind":"Field","name":{"kind":"Name","value":"id"}}]}}]}}]} as unknown as DocumentNode<AffiliationByIdQuery, AffiliationByIdQueryVariables>;
export const AnswerByVersionedQuestionIdDocument = {"kind":"Document","definitions":[{"kind":"OperationDefinition","operation":"query","name":{"kind":"Name","value":"AnswerByVersionedQuestionId"},"variableDefinitions":[{"kind":"VariableDefinition","variable":{"kind":"Variable","name":{"kind":"Name","value":"projectId"}},"type":{"kind":"NonNullType","type":{"kind":"NamedType","name":{"kind":"Name","value":"Int"}}}},{"kind":"VariableDefinition","variable":{"kind":"Variable","name":{"kind":"Name","value":"planId"}},"type":{"kind":"NonNullType","type":{"kind":"NamedType","name":{"kind":"Name","value":"Int"}}}},{"kind":"VariableDefinition","variable":{"kind":"Variable","name":{"kind":"Name","value":"versionedQuestionId"}},"type":{"kind":"NamedType","name":{"kind":"Name","value":"Int"}}},{"kind":"VariableDefinition","variable":{"kind":"Variable","name":{"kind":"Name","value":"versionedCustomQuestionId"}},"type":{"kind":"NamedType","name":{"kind":"Name","value":"Int"}}}],"selectionSet":{"kind":"SelectionSet","selections":[{"kind":"Field","name":{"kind":"Name","value":"answerByVersionedQuestionId"},"arguments":[{"kind":"Argument","name":{"kind":"Name","value":"projectId"},"value":{"kind":"Variable","name":{"kind":"Name","value":"projectId"}}},{"kind":"Argument","name":{"kind":"Name","value":"planId"},"value":{"kind":"Variable","name":{"kind":"Name","value":"planId"}}},{"kind":"Argument","name":{"kind":"Name","value":"versionedQuestionId"},"value":{"kind":"Variable","name":{"kind":"Name","value":"versionedQuestionId"}}},{"kind":"Argument","name":{"kind":"Name","value":"versionedCustomQuestionId"},"value":{"kind":"Variable","name":{"kind":"Name","value":"versionedCustomQuestionId"}}}],"selectionSet":{"kind":"SelectionSet","selections":[{"kind":"Field","name":{"kind":"Name","value":"id"}},{"kind":"Field","name":{"kind":"Name","value":"json"}},{"kind":"Field","name":{"kind":"Name","value":"versionedQuestion"},"selectionSet":{"kind":"SelectionSet","selections":[{"kind":"Field","name":{"kind":"Name","value":"id"}}]}},{"kind":"Field","name":{"kind":"Name","value":"plan"},"selectionSet":{"kind":"SelectionSet","selections":[{"kind":"Field","name":{"kind":"Name","value":"id"}}]}},{"kind":"Field","name":{"kind":"Name","value":"comments"},"selectionSet":{"kind":"SelectionSet","selections":[{"kind":"Field","name":{"kind":"Name","value":"id"}},{"kind":"Field","name":{"kind":"Name","value":"commentText"}},{"kind":"Field","name":{"kind":"Name","value":"answerId"}},{"kind":"Field","name":{"kind":"Name","value":"created"}},{"kind":"Field","name":{"kind":"Name","value":"createdById"}},{"kind":"Field","name":{"kind":"Name","value":"modified"}},{"kind":"Field","name":{"kind":"Name","value":"user"},"selectionSet":{"kind":"SelectionSet","selections":[{"kind":"Field","name":{"kind":"Name","value":"id"}},{"kind":"Field","name":{"kind":"Name","value":"surName"}},{"kind":"Field","name":{"kind":"Name","value":"givenName"}}]}}]}},{"kind":"Field","name":{"kind":"Name","value":"feedbackComments"},"selectionSet":{"kind":"SelectionSet","selections":[{"kind":"Field","name":{"kind":"Name","value":"id"}},{"kind":"Field","name":{"kind":"Name","value":"commentText"}},{"kind":"Field","name":{"kind":"Name","value":"created"}},{"kind":"Field","name":{"kind":"Name","value":"createdById"}},{"kind":"Field","name":{"kind":"Name","value":"answerId"}},{"kind":"Field","name":{"kind":"Name","value":"modified"}},{"kind":"Field","name":{"kind":"Name","value":"PlanFeedback"},"selectionSet":{"kind":"SelectionSet","selections":[{"kind":"Field","name":{"kind":"Name","value":"id"}}]}},{"kind":"Field","name":{"kind":"Name","value":"user"},"selectionSet":{"kind":"SelectionSet","selections":[{"kind":"Field","name":{"kind":"Name","value":"id"}},{"kind":"Field","name":{"kind":"Name","value":"surName"}},{"kind":"Field","name":{"kind":"Name","value":"givenName"}}]}}]}},{"kind":"Field","name":{"kind":"Name","value":"modified"}},{"kind":"Field","name":{"kind":"Name","value":"created"}},{"kind":"Field","name":{"kind":"Name","value":"errors"},"selectionSet":{"kind":"SelectionSet","selections":[{"kind":"Field","name":{"kind":"Name","value":"general"}},{"kind":"Field","name":{"kind":"Name","value":"planId"}},{"kind":"Field","name":{"kind":"Name","value":"versionedSectionId"}},{"kind":"Field","name":{"kind":"Name","value":"versionedQuestionId"}},{"kind":"Field","name":{"kind":"Name","value":"json"}}]}}]}}]}}]} as unknown as DocumentNode<AnswerByVersionedQuestionIdQuery, AnswerByVersionedQuestionIdQueryVariables>;
export const ProjectCollaboratorsDocument = {"kind":"Document","definitions":[{"kind":"OperationDefinition","operation":"query","name":{"kind":"Name","value":"ProjectCollaborators"},"variableDefinitions":[{"kind":"VariableDefinition","variable":{"kind":"Variable","name":{"kind":"Name","value":"projectId"}},"type":{"kind":"NonNullType","type":{"kind":"NamedType","name":{"kind":"Name","value":"Int"}}}}],"selectionSet":{"kind":"SelectionSet","selections":[{"kind":"Field","name":{"kind":"Name","value":"projectCollaborators"},"arguments":[{"kind":"Argument","name":{"kind":"Name","value":"projectId"},"value":{"kind":"Variable","name":{"kind":"Name","value":"projectId"}}}],"selectionSet":{"kind":"SelectionSet","selections":[{"kind":"Field","name":{"kind":"Name","value":"id"}},{"kind":"Field","name":{"kind":"Name","value":"errors"},"selectionSet":{"kind":"SelectionSet","selections":[{"kind":"Field","name":{"kind":"Name","value":"accessLevel"}},{"kind":"Field","name":{"kind":"Name","value":"email"}},{"kind":"Field","name":{"kind":"Name","value":"general"}},{"kind":"Field","name":{"kind":"Name","value":"invitedById"}},{"kind":"Field","name":{"kind":"Name","value":"planId"}},{"kind":"Field","name":{"kind":"Name","value":"userId"}}]}},{"kind":"Field","name":{"kind":"Name","value":"accessLevel"}},{"kind":"Field","name":{"kind":"Name","value":"created"}},{"kind":"Field","name":{"kind":"Name","value":"email"}},{"kind":"Field","name":{"kind":"Name","value":"user"},"selectionSet":{"kind":"SelectionSet","selections":[{"kind":"Field","name":{"kind":"Name","value":"id"}},{"kind":"Field","name":{"kind":"Name","value":"givenName"}},{"kind":"Field","name":{"kind":"Name","value":"surName"}},{"kind":"Field","name":{"kind":"Name","value":"email"}}]}}]}}]}}]} as unknown as DocumentNode<ProjectCollaboratorsQuery, ProjectCollaboratorsQueryVariables>;
export const FindCollaboratorDocument = {"kind":"Document","definitions":[{"kind":"OperationDefinition","operation":"query","name":{"kind":"Name","value":"FindCollaborator"},"variableDefinitions":[{"kind":"VariableDefinition","variable":{"kind":"Variable","name":{"kind":"Name","value":"term"}},"type":{"kind":"NonNullType","type":{"kind":"NamedType","name":{"kind":"Name","value":"String"}}}},{"kind":"VariableDefinition","variable":{"kind":"Variable","name":{"kind":"Name","value":"options"}},"type":{"kind":"NamedType","name":{"kind":"Name","value":"PaginationOptions"}}}],"selectionSet":{"kind":"SelectionSet","selections":[{"kind":"Field","name":{"kind":"Name","value":"findCollaborator"},"arguments":[{"kind":"Argument","name":{"kind":"Name","value":"term"},"value":{"kind":"Variable","name":{"kind":"Name","value":"term"}}},{"kind":"Argument","name":{"kind":"Name","value":"options"},"value":{"kind":"Variable","name":{"kind":"Name","value":"options"}}}],"selectionSet":{"kind":"SelectionSet","selections":[{"kind":"Field","name":{"kind":"Name","value":"limit"}},{"kind":"Field","name":{"kind":"Name","value":"items"},"selectionSet":{"kind":"SelectionSet","selections":[{"kind":"Field","name":{"kind":"Name","value":"id"}},{"kind":"Field","name":{"kind":"Name","value":"givenName"}},{"kind":"Field","name":{"kind":"Name","value":"email"}},{"kind":"Field","name":{"kind":"Name","value":"affiliationId"}},{"kind":"Field","name":{"kind":"Name","value":"affiliationRORId"}},{"kind":"Field","name":{"kind":"Name","value":"affiliationURL"}},{"kind":"Field","name":{"kind":"Name","value":"orcid"}},{"kind":"Field","name":{"kind":"Name","value":"surName"}},{"kind":"Field","name":{"kind":"Name","value":"affiliationName"}}]}},{"kind":"Field","name":{"kind":"Name","value":"availableSortFields"}},{"kind":"Field","name":{"kind":"Name","value":"nextCursor"}},{"kind":"Field","name":{"kind":"Name","value":"totalCount"}}]}}]}}]} as unknown as DocumentNode<FindCollaboratorQuery, FindCollaboratorQueryVariables>;
export const CustomQuestionDocument = {"kind":"Document","definitions":[{"kind":"OperationDefinition","operation":"query","name":{"kind":"Name","value":"CustomQuestion"},"variableDefinitions":[{"kind":"VariableDefinition","variable":{"kind":"Variable","name":{"kind":"Name","value":"customQuestionId"}},"type":{"kind":"NonNullType","type":{"kind":"NamedType","name":{"kind":"Name","value":"Int"}}}}],"selectionSet":{"kind":"SelectionSet","selections":[{"kind":"Field","name":{"kind":"Name","value":"customQuestion"},"arguments":[{"kind":"Argument","name":{"kind":"Name","value":"customQuestionId"},"value":{"kind":"Variable","name":{"kind":"Name","value":"customQuestionId"}}}],"selectionSet":{"kind":"SelectionSet","selections":[{"kind":"Field","name":{"kind":"Name","value":"id"}},{"kind":"Field","name":{"kind":"Name","value":"json"}},{"kind":"Field","name":{"kind":"Name","value":"modified"}},{"kind":"Field","name":{"kind":"Name","value":"sampleText"}},{"kind":"Field","name":{"kind":"Name","value":"requirementText"}},{"kind":"Field","name":{"kind":"Name","value":"questionText"}},{"kind":"Field","name":{"kind":"Name","value":"guidanceText"}},{"kind":"Field","name":{"kind":"Name","value":"errors"},"selectionSet":{"kind":"SelectionSet","selections":[{"kind":"Field","name":{"kind":"Name","value":"general"}},{"kind":"Field","name":{"kind":"Name","value":"guidanceText"}},{"kind":"Field","name":{"kind":"Name","value":"json"}},{"kind":"Field","name":{"kind":"Name","value":"migrationStatus"}},{"kind":"Field","name":{"kind":"Name","value":"pinnedQuestionId"}},{"kind":"Field","name":{"kind":"Name","value":"pinnedQuestionType"}},{"kind":"Field","name":{"kind":"Name","value":"questionText"}},{"kind":"Field","name":{"kind":"Name","value":"required"}},{"kind":"Field","name":{"kind":"Name","value":"requirementText"}},{"kind":"Field","name":{"kind":"Name","value":"sampleText"}},{"kind":"Field","name":{"kind":"Name","value":"sectionId"}},{"kind":"Field","name":{"kind":"Name","value":"sectionType"}},{"kind":"Field","name":{"kind":"Name","value":"templateCustomizationId"}},{"kind":"Field","name":{"kind":"Name","value":"useSampleTextAsDefault"}}]}},{"kind":"Field","name":{"kind":"Name","value":"migrationStatus"}},{"kind":"Field","name":{"kind":"Name","value":"pinnedQuestionId"}},{"kind":"Field","name":{"kind":"Name","value":"pinnedQuestionType"}},{"kind":"Field","name":{"kind":"Name","value":"required"}},{"kind":"Field","name":{"kind":"Name","value":"sectionId"}},{"kind":"Field","name":{"kind":"Name","value":"sectionType"}},{"kind":"Field","name":{"kind":"Name","value":"templateCustomizationId"}},{"kind":"Field","name":{"kind":"Name","value":"useSampleTextAsDefault"}}]}}]}}]} as unknown as DocumentNode<CustomQuestionQuery, CustomQuestionQueryVariables>;
export const CustomSectionDocument = {"kind":"Document","definitions":[{"kind":"OperationDefinition","operation":"query","name":{"kind":"Name","value":"CustomSection"},"variableDefinitions":[{"kind":"VariableDefinition","variable":{"kind":"Variable","name":{"kind":"Name","value":"customSectionId"}},"type":{"kind":"NonNullType","type":{"kind":"NamedType","name":{"kind":"Name","value":"Int"}}}}],"selectionSet":{"kind":"SelectionSet","selections":[{"kind":"Field","name":{"kind":"Name","value":"customSection"},"arguments":[{"kind":"Argument","name":{"kind":"Name","value":"customSectionId"},"value":{"kind":"Variable","name":{"kind":"Name","value":"customSectionId"}}}],"selectionSet":{"kind":"SelectionSet","selections":[{"kind":"Field","name":{"kind":"Name","value":"errors"},"selectionSet":{"kind":"SelectionSet","selections":[{"kind":"Field","name":{"kind":"Name","value":"general"}},{"kind":"Field","name":{"kind":"Name","value":"guidance"}},{"kind":"Field","name":{"kind":"Name","value":"introduction"}},{"kind":"Field","name":{"kind":"Name","value":"name"}},{"kind":"Field","name":{"kind":"Name","value":"requirements"}}]}},{"kind":"Field","name":{"kind":"Name","value":"guidance"}},{"kind":"Field","name":{"kind":"Name","value":"id"}},{"kind":"Field","name":{"kind":"Name","value":"introduction"}},{"kind":"Field","name":{"kind":"Name","value":"migrationStatus"}},{"kind":"Field","name":{"kind":"Name","value":"modified"}},{"kind":"Field","name":{"kind":"Name","value":"name"}},{"kind":"Field","name":{"kind":"Name","value":"pinnedSectionId"}},{"kind":"Field","name":{"kind":"Name","value":"pinnedSectionType"}},{"kind":"Field","name":{"kind":"Name","value":"requirements"}},{"kind":"Field","name":{"kind":"Name","value":"templateCustomizationId"}}]}}]}}]} as unknown as DocumentNode<CustomSectionQuery, CustomSectionQueryVariables>;
export const ProjectFundingsDocument = {"kind":"Document","definitions":[{"kind":"OperationDefinition","operation":"query","name":{"kind":"Name","value":"ProjectFundings"},"variableDefinitions":[{"kind":"VariableDefinition","variable":{"kind":"Variable","name":{"kind":"Name","value":"projectId"}},"type":{"kind":"NonNullType","type":{"kind":"NamedType","name":{"kind":"Name","value":"Int"}}}}],"selectionSet":{"kind":"SelectionSet","selections":[{"kind":"Field","name":{"kind":"Name","value":"projectFundings"},"arguments":[{"kind":"Argument","name":{"kind":"Name","value":"projectId"},"value":{"kind":"Variable","name":{"kind":"Name","value":"projectId"}}}],"selectionSet":{"kind":"SelectionSet","selections":[{"kind":"Field","name":{"kind":"Name","value":"id"}},{"kind":"Field","name":{"kind":"Name","value":"status"}},{"kind":"Field","name":{"kind":"Name","value":"grantId"}},{"kind":"Field","name":{"kind":"Name","value":"funderOpportunityNumber"}},{"kind":"Field","name":{"kind":"Name","value":"funderProjectNumber"}},{"kind":"Field","name":{"kind":"Name","value":"affiliation"},"selectionSet":{"kind":"SelectionSet","selections":[{"kind":"Field","name":{"kind":"Name","value":"displayName"}},{"kind":"Field","name":{"kind":"Name","value":"uri"}}]}}]}}]}}]} as unknown as DocumentNode<ProjectFundingsQuery, ProjectFundingsQueryVariables>;
export const PlanFundingsDocument = {"kind":"Document","definitions":[{"kind":"OperationDefinition","operation":"query","name":{"kind":"Name","value":"PlanFundings"},"variableDefinitions":[{"kind":"VariableDefinition","variable":{"kind":"Variable","name":{"kind":"Name","value":"planId"}},"type":{"kind":"NonNullType","type":{"kind":"NamedType","name":{"kind":"Name","value":"Int"}}}}],"selectionSet":{"kind":"SelectionSet","selections":[{"kind":"Field","name":{"kind":"Name","value":"planFundings"},"arguments":[{"kind":"Argument","name":{"kind":"Name","value":"planId"},"value":{"kind":"Variable","name":{"kind":"Name","value":"planId"}}}],"selectionSet":{"kind":"SelectionSet","selections":[{"kind":"Field","name":{"kind":"Name","value":"id"}},{"kind":"Field","name":{"kind":"Name","value":"projectFunding"},"selectionSet":{"kind":"SelectionSet","selections":[{"kind":"Field","name":{"kind":"Name","value":"id"}}]}}]}}]}}]} as unknown as DocumentNode<PlanFundingsQuery, PlanFundingsQueryVariables>;
export const PopularFundersDocument = {"kind":"Document","definitions":[{"kind":"OperationDefinition","operation":"query","name":{"kind":"Name","value":"PopularFunders"},"selectionSet":{"kind":"SelectionSet","selections":[{"kind":"Field","name":{"kind":"Name","value":"popularFunders"},"selectionSet":{"kind":"SelectionSet","selections":[{"kind":"Field","name":{"kind":"Name","value":"displayName"}},{"kind":"Field","name":{"kind":"Name","value":"id"}},{"kind":"Field","name":{"kind":"Name","value":"nbrPlans"}},{"kind":"Field","name":{"kind":"Name","value":"uri"}},{"kind":"Field","name":{"kind":"Name","value":"apiTarget"}}]}}]}}]} as unknown as DocumentNode<PopularFundersQuery, PopularFundersQueryVariables>;
export const GuidanceByGroupDocument = {"kind":"Document","definitions":[{"kind":"OperationDefinition","operation":"query","name":{"kind":"Name","value":"GuidanceByGroup"},"variableDefinitions":[{"kind":"VariableDefinition","variable":{"kind":"Variable","name":{"kind":"Name","value":"guidanceGroupId"}},"type":{"kind":"NonNullType","type":{"kind":"NamedType","name":{"kind":"Name","value":"Int"}}}}],"selectionSet":{"kind":"SelectionSet","selections":[{"kind":"Field","name":{"kind":"Name","value":"guidanceByGroup"},"arguments":[{"kind":"Argument","name":{"kind":"Name","value":"guidanceGroupId"},"value":{"kind":"Variable","name":{"kind":"Name","value":"guidanceGroupId"}}}],"selectionSet":{"kind":"SelectionSet","selections":[{"kind":"Field","name":{"kind":"Name","value":"modifiedBy"},"selectionSet":{"kind":"SelectionSet","selections":[{"kind":"Field","name":{"kind":"Name","value":"givenName"}},{"kind":"Field","name":{"kind":"Name","value":"surName"}},{"kind":"Field","name":{"kind":"Name","value":"id"}}]}},{"kind":"Field","name":{"kind":"Name","value":"guidanceText"}},{"kind":"Field","name":{"kind":"Name","value":"id"}},{"kind":"Field","name":{"kind":"Name","value":"tagId"}},{"kind":"Field","name":{"kind":"Name","value":"errors"},"selectionSet":{"kind":"SelectionSet","selections":[{"kind":"Field","name":{"kind":"Name","value":"general"}},{"kind":"Field","name":{"kind":"Name","value":"tagId"}},{"kind":"Field","name":{"kind":"Name","value":"guidanceText"}},{"kind":"Field","name":{"kind":"Name","value":"guidanceGroupId"}}]}},{"kind":"Field","name":{"kind":"Name","value":"modified"}}]}}]}}]} as unknown as DocumentNode<GuidanceByGroupQuery, GuidanceByGroupQueryVariables>;
export const GuidanceDocument = {"kind":"Document","definitions":[{"kind":"OperationDefinition","operation":"query","name":{"kind":"Name","value":"Guidance"},"variableDefinitions":[{"kind":"VariableDefinition","variable":{"kind":"Variable","name":{"kind":"Name","value":"guidanceId"}},"type":{"kind":"NonNullType","type":{"kind":"NamedType","name":{"kind":"Name","value":"Int"}}}}],"selectionSet":{"kind":"SelectionSet","selections":[{"kind":"Field","name":{"kind":"Name","value":"guidance"},"arguments":[{"kind":"Argument","name":{"kind":"Name","value":"guidanceId"},"value":{"kind":"Variable","name":{"kind":"Name","value":"guidanceId"}}}],"selectionSet":{"kind":"SelectionSet","selections":[{"kind":"Field","name":{"kind":"Name","value":"id"}},{"kind":"Field","name":{"kind":"Name","value":"guidanceText"}},{"kind":"Field","name":{"kind":"Name","value":"tagId"}}]}}]}}]} as unknown as DocumentNode<GuidanceQuery, GuidanceQueryVariables>;
export const GuidanceSourcesForPlanDocument = {"kind":"Document","definitions":[{"kind":"OperationDefinition","operation":"query","name":{"kind":"Name","value":"GuidanceSourcesForPlan"},"variableDefinitions":[{"kind":"VariableDefinition","variable":{"kind":"Variable","name":{"kind":"Name","value":"planId"}},"type":{"kind":"NonNullType","type":{"kind":"NamedType","name":{"kind":"Name","value":"Int"}}}},{"kind":"VariableDefinition","variable":{"kind":"Variable","name":{"kind":"Name","value":"versionedSectionId"}},"type":{"kind":"NamedType","name":{"kind":"Name","value":"Int"}}},{"kind":"VariableDefinition","variable":{"kind":"Variable","name":{"kind":"Name","value":"versionedQuestionId"}},"type":{"kind":"NamedType","name":{"kind":"Name","value":"Int"}}},{"kind":"VariableDefinition","variable":{"kind":"Variable","name":{"kind":"Name","value":"customSectionId"}},"type":{"kind":"NamedType","name":{"kind":"Name","value":"Int"}}},{"kind":"VariableDefinition","variable":{"kind":"Variable","name":{"kind":"Name","value":"customQuestionId"}},"type":{"kind":"NamedType","name":{"kind":"Name","value":"Int"}}}],"selectionSet":{"kind":"SelectionSet","selections":[{"kind":"Field","name":{"kind":"Name","value":"guidanceSourcesForPlan"},"arguments":[{"kind":"Argument","name":{"kind":"Name","value":"planId"},"value":{"kind":"Variable","name":{"kind":"Name","value":"planId"}}},{"kind":"Argument","name":{"kind":"Name","value":"versionedSectionId"},"value":{"kind":"Variable","name":{"kind":"Name","value":"versionedSectionId"}}},{"kind":"Argument","name":{"kind":"Name","value":"versionedQuestionId"},"value":{"kind":"Variable","name":{"kind":"Name","value":"versionedQuestionId"}}},{"kind":"Argument","name":{"kind":"Name","value":"customSectionId"},"value":{"kind":"Variable","name":{"kind":"Name","value":"customSectionId"}}},{"kind":"Argument","name":{"kind":"Name","value":"customQuestionId"},"value":{"kind":"Variable","name":{"kind":"Name","value":"customQuestionId"}}}],"selectionSet":{"kind":"SelectionSet","selections":[{"kind":"Field","name":{"kind":"Name","value":"id"}},{"kind":"Field","name":{"kind":"Name","value":"type"}},{"kind":"Field","name":{"kind":"Name","value":"label"}},{"kind":"Field","name":{"kind":"Name","value":"shortName"}},{"kind":"Field","name":{"kind":"Name","value":"orgURI"}},{"kind":"Field","name":{"kind":"Name","value":"hasGuidance"}},{"kind":"Field","name":{"kind":"Name","value":"items"},"selectionSet":{"kind":"SelectionSet","selections":[{"kind":"Field","name":{"kind":"Name","value":"id"}},{"kind":"Field","name":{"kind":"Name","value":"title"}},{"kind":"Field","name":{"kind":"Name","value":"guidanceText"}}]}}]}}]}}]} as unknown as DocumentNode<GuidanceSourcesForPlanQuery, GuidanceSourcesForPlanQueryVariables>;
export const GuidanceGroupsDocument = {"kind":"Document","definitions":[{"kind":"OperationDefinition","operation":"query","name":{"kind":"Name","value":"GuidanceGroups"},"variableDefinitions":[{"kind":"VariableDefinition","variable":{"kind":"Variable","name":{"kind":"Name","value":"affiliationId"}},"type":{"kind":"NamedType","name":{"kind":"Name","value":"String"}}}],"selectionSet":{"kind":"SelectionSet","selections":[{"kind":"Field","name":{"kind":"Name","value":"guidanceGroups"},"arguments":[{"kind":"Argument","name":{"kind":"Name","value":"affiliationId"},"value":{"kind":"Variable","name":{"kind":"Name","value":"affiliationId"}}}],"selectionSet":{"kind":"SelectionSet","selections":[{"kind":"Field","name":{"kind":"Name","value":"id"}},{"kind":"Field","name":{"kind":"Name","value":"affiliationId"}},{"kind":"Field","name":{"kind":"Name","value":"name"}},{"kind":"Field","name":{"kind":"Name","value":"description"}},{"kind":"Field","name":{"kind":"Name","value":"latestPublishedVersion"}},{"kind":"Field","name":{"kind":"Name","value":"latestPublishedDate"}},{"kind":"Field","name":{"kind":"Name","value":"guidance"},"selectionSet":{"kind":"SelectionSet","selections":[{"kind":"Field","name":{"kind":"Name","value":"tagId"}},{"kind":"Field","name":{"kind":"Name","value":"guidanceText"}},{"kind":"Field","name":{"kind":"Name","value":"id"}}]}},{"kind":"Field","name":{"kind":"Name","value":"modifiedBy"},"selectionSet":{"kind":"SelectionSet","selections":[{"kind":"Field","name":{"kind":"Name","value":"givenName"}},{"kind":"Field","name":{"kind":"Name","value":"surName"}},{"kind":"Field","name":{"kind":"Name","value":"id"}}]}},{"kind":"Field","name":{"kind":"Name","value":"modified"}},{"kind":"Field","name":{"kind":"Name","value":"isDirty"}},{"kind":"Field","name":{"kind":"Name","value":"versionedGuidanceGroup"},"selectionSet":{"kind":"SelectionSet","selections":[{"kind":"Field","name":{"kind":"Name","value":"active"}},{"kind":"Field","name":{"kind":"Name","value":"id"}},{"kind":"Field","name":{"kind":"Name","value":"version"}}]}}]}}]}}]} as unknown as DocumentNode<GuidanceGroupsQuery, GuidanceGroupsQueryVariables>;
export const GuidanceGroupDocument = {"kind":"Document","definitions":[{"kind":"OperationDefinition","operation":"query","name":{"kind":"Name","value":"GuidanceGroup"},"variableDefinitions":[{"kind":"VariableDefinition","variable":{"kind":"Variable","name":{"kind":"Name","value":"guidanceGroupId"}},"type":{"kind":"NonNullType","type":{"kind":"NamedType","name":{"kind":"Name","value":"Int"}}}}],"selectionSet":{"kind":"SelectionSet","selections":[{"kind":"Field","name":{"kind":"Name","value":"guidanceGroup"},"arguments":[{"kind":"Argument","name":{"kind":"Name","value":"guidanceGroupId"},"value":{"kind":"Variable","name":{"kind":"Name","value":"guidanceGroupId"}}}],"selectionSet":{"kind":"SelectionSet","selections":[{"kind":"Field","name":{"kind":"Name","value":"id"}},{"kind":"Field","name":{"kind":"Name","value":"name"}},{"kind":"Field","name":{"kind":"Name","value":"description"}},{"kind":"Field","name":{"kind":"Name","value":"bestPractice"}},{"kind":"Field","name":{"kind":"Name","value":"latestPublishedVersion"}},{"kind":"Field","name":{"kind":"Name","value":"latestPublishedDate"}},{"kind":"Field","name":{"kind":"Name","value":"isDirty"}},{"kind":"Field","name":{"kind":"Name","value":"guidance"},"selectionSet":{"kind":"SelectionSet","selections":[{"kind":"Field","name":{"kind":"Name","value":"guidanceText"}},{"kind":"Field","name":{"kind":"Name","value":"id"}},{"kind":"Field","name":{"kind":"Name","value":"tagId"}}]}},{"kind":"Field","name":{"kind":"Name","value":"versionedGuidanceGroup"},"selectionSet":{"kind":"SelectionSet","selections":[{"kind":"Field","name":{"kind":"Name","value":"active"}},{"kind":"Field","name":{"kind":"Name","value":"id"}},{"kind":"Field","name":{"kind":"Name","value":"version"}}]}},{"kind":"Field","name":{"kind":"Name","value":"optionalSubset"}}]}}]}}]} as unknown as DocumentNode<GuidanceGroupQuery, GuidanceGroupQueryVariables>;
export const LanguagesDocument = {"kind":"Document","definitions":[{"kind":"OperationDefinition","operation":"query","name":{"kind":"Name","value":"Languages"},"selectionSet":{"kind":"SelectionSet","selections":[{"kind":"Field","name":{"kind":"Name","value":"languages"},"selectionSet":{"kind":"SelectionSet","selections":[{"kind":"Field","name":{"kind":"Name","value":"id"}},{"kind":"Field","name":{"kind":"Name","value":"isDefault"}},{"kind":"Field","name":{"kind":"Name","value":"name"}}]}}]}}]} as unknown as DocumentNode<LanguagesQuery, LanguagesQueryVariables>;
export const RecommendedLicensesDocument = {"kind":"Document","definitions":[{"kind":"OperationDefinition","operation":"query","name":{"kind":"Name","value":"RecommendedLicenses"},"variableDefinitions":[{"kind":"VariableDefinition","variable":{"kind":"Variable","name":{"kind":"Name","value":"recommended"}},"type":{"kind":"NonNullType","type":{"kind":"NamedType","name":{"kind":"Name","value":"Boolean"}}}}],"selectionSet":{"kind":"SelectionSet","selections":[{"kind":"Field","name":{"kind":"Name","value":"recommendedLicenses"},"arguments":[{"kind":"Argument","name":{"kind":"Name","value":"recommended"},"value":{"kind":"Variable","name":{"kind":"Name","value":"recommended"}}}],"selectionSet":{"kind":"SelectionSet","selections":[{"kind":"Field","name":{"kind":"Name","value":"name"}},{"kind":"Field","name":{"kind":"Name","value":"id"}},{"kind":"Field","name":{"kind":"Name","value":"uri"}}]}}]}}]} as unknown as DocumentNode<RecommendedLicensesQuery, RecommendedLicensesQueryVariables>;
export const LicensesDocument = {"kind":"Document","definitions":[{"kind":"OperationDefinition","operation":"query","name":{"kind":"Name","value":"Licenses"},"selectionSet":{"kind":"SelectionSet","selections":[{"kind":"Field","name":{"kind":"Name","value":"licenses"},"selectionSet":{"kind":"SelectionSet","selections":[{"kind":"Field","name":{"kind":"Name","value":"id"}},{"kind":"Field","name":{"kind":"Name","value":"name"}},{"kind":"Field","name":{"kind":"Name","value":"uri"}},{"kind":"Field","name":{"kind":"Name","value":"recommended"}}]}}]}}]} as unknown as DocumentNode<LicensesQuery, LicensesQueryVariables>;
export const MemberRolesDocument = {"kind":"Document","definitions":[{"kind":"OperationDefinition","operation":"query","name":{"kind":"Name","value":"MemberRoles"},"selectionSet":{"kind":"SelectionSet","selections":[{"kind":"Field","name":{"kind":"Name","value":"memberRoles"},"selectionSet":{"kind":"SelectionSet","selections":[{"kind":"Field","name":{"kind":"Name","value":"id"}},{"kind":"Field","name":{"kind":"Name","value":"label"}},{"kind":"Field","name":{"kind":"Name","value":"uri"}},{"kind":"Field","name":{"kind":"Name","value":"description"}},{"kind":"Field","name":{"kind":"Name","value":"displayOrder"}}]}}]}}]} as unknown as DocumentNode<MemberRolesQuery, MemberRolesQueryVariables>;
export const MetadataStandardsDocument = {"kind":"Document","definitions":[{"kind":"OperationDefinition","operation":"query","name":{"kind":"Name","value":"MetadataStandards"},"variableDefinitions":[{"kind":"VariableDefinition","variable":{"kind":"Variable","name":{"kind":"Name","value":"term"}},"type":{"kind":"NamedType","name":{"kind":"Name","value":"String"}}},{"kind":"VariableDefinition","variable":{"kind":"Variable","name":{"kind":"Name","value":"researchDomainId"}},"type":{"kind":"NamedType","name":{"kind":"Name","value":"Int"}}},{"kind":"VariableDefinition","variable":{"kind":"Variable","name":{"kind":"Name","value":"paginationOptions"}},"type":{"kind":"NamedType","name":{"kind":"Name","value":"PaginationOptions"}}}],"selectionSet":{"kind":"SelectionSet","selections":[{"kind":"Field","name":{"kind":"Name","value":"metadataStandards"},"arguments":[{"kind":"Argument","name":{"kind":"Name","value":"term"},"value":{"kind":"Variable","name":{"kind":"Name","value":"term"}}},{"kind":"Argument","name":{"kind":"Name","value":"researchDomainId"},"value":{"kind":"Variable","name":{"kind":"Name","value":"researchDomainId"}}},{"kind":"Argument","name":{"kind":"Name","value":"paginationOptions"},"value":{"kind":"Variable","name":{"kind":"Name","value":"paginationOptions"}}}],"selectionSet":{"kind":"SelectionSet","selections":[{"kind":"Field","name":{"kind":"Name","value":"hasNextPage"}},{"kind":"Field","name":{"kind":"Name","value":"currentOffset"}},{"kind":"Field","name":{"kind":"Name","value":"hasPreviousPage"}},{"kind":"Field","name":{"kind":"Name","value":"limit"}},{"kind":"Field","name":{"kind":"Name","value":"nextCursor"}},{"kind":"Field","name":{"kind":"Name","value":"totalCount"}},{"kind":"Field","name":{"kind":"Name","value":"availableSortFields"}},{"kind":"Field","name":{"kind":"Name","value":"items"},"selectionSet":{"kind":"SelectionSet","selections":[{"kind":"Field","name":{"kind":"Name","value":"id"}},{"kind":"Field","name":{"kind":"Name","value":"errors"},"selectionSet":{"kind":"SelectionSet","selections":[{"kind":"Field","name":{"kind":"Name","value":"general"}},{"kind":"Field","name":{"kind":"Name","value":"description"}},{"kind":"Field","name":{"kind":"Name","value":"name"}},{"kind":"Field","name":{"kind":"Name","value":"uri"}},{"kind":"Field","name":{"kind":"Name","value":"keywords"}},{"kind":"Field","name":{"kind":"Name","value":"researchDomainIds"}}]}},{"kind":"Field","name":{"kind":"Name","value":"name"}},{"kind":"Field","name":{"kind":"Name","value":"uri"}},{"kind":"Field","name":{"kind":"Name","value":"description"}},{"kind":"Field","name":{"kind":"Name","value":"keywords"}}]}}]}}]}}]} as unknown as DocumentNode<MetadataStandardsQuery, MetadataStandardsQueryVariables>;
export const MetadataStandardsByUrIsDocument = {"kind":"Document","definitions":[{"kind":"OperationDefinition","operation":"query","name":{"kind":"Name","value":"MetadataStandardsByURIs"},"variableDefinitions":[{"kind":"VariableDefinition","variable":{"kind":"Variable","name":{"kind":"Name","value":"uris"}},"type":{"kind":"NonNullType","type":{"kind":"ListType","type":{"kind":"NonNullType","type":{"kind":"NamedType","name":{"kind":"Name","value":"String"}}}}}}],"selectionSet":{"kind":"SelectionSet","selections":[{"kind":"Field","name":{"kind":"Name","value":"metadataStandardsByURIs"},"arguments":[{"kind":"Argument","name":{"kind":"Name","value":"uris"},"value":{"kind":"Variable","name":{"kind":"Name","value":"uris"}}}],"selectionSet":{"kind":"SelectionSet","selections":[{"kind":"Field","name":{"kind":"Name","value":"id"}},{"kind":"Field","name":{"kind":"Name","value":"errors"},"selectionSet":{"kind":"SelectionSet","selections":[{"kind":"Field","name":{"kind":"Name","value":"general"}},{"kind":"Field","name":{"kind":"Name","value":"description"}},{"kind":"Field","name":{"kind":"Name","value":"name"}},{"kind":"Field","name":{"kind":"Name","value":"uri"}},{"kind":"Field","name":{"kind":"Name","value":"keywords"}},{"kind":"Field","name":{"kind":"Name","value":"researchDomainIds"}}]}},{"kind":"Field","name":{"kind":"Name","value":"name"}},{"kind":"Field","name":{"kind":"Name","value":"uri"}},{"kind":"Field","name":{"kind":"Name","value":"description"}},{"kind":"Field","name":{"kind":"Name","value":"keywords"}}]}}]}}]} as unknown as DocumentNode<MetadataStandardsByUrIsQuery, MetadataStandardsByUrIsQueryVariables>;
export const PlanDocument = {"kind":"Document","definitions":[{"kind":"OperationDefinition","operation":"query","name":{"kind":"Name","value":"Plan"},"variableDefinitions":[{"kind":"VariableDefinition","variable":{"kind":"Variable","name":{"kind":"Name","value":"planId"}},"type":{"kind":"NonNullType","type":{"kind":"NamedType","name":{"kind":"Name","value":"Int"}}}}],"selectionSet":{"kind":"SelectionSet","selections":[{"kind":"Field","name":{"kind":"Name","value":"plan"},"arguments":[{"kind":"Argument","name":{"kind":"Name","value":"planId"},"value":{"kind":"Variable","name":{"kind":"Name","value":"planId"}}}],"selectionSet":{"kind":"SelectionSet","selections":[{"kind":"Field","name":{"kind":"Name","value":"id"}},{"kind":"Field","name":{"kind":"Name","value":"versionedTemplate"},"selectionSet":{"kind":"SelectionSet","selections":[{"kind":"Field","name":{"kind":"Name","value":"id"}},{"kind":"Field","name":{"kind":"Name","value":"template"},"selectionSet":{"kind":"SelectionSet","selections":[{"kind":"Field","name":{"kind":"Name","value":"id"}},{"kind":"Field","name":{"kind":"Name","value":"name"}}]}},{"kind":"Field","name":{"kind":"Name","value":"name"}},{"kind":"Field","name":{"kind":"Name","value":"owner"},"selectionSet":{"kind":"SelectionSet","selections":[{"kind":"Field","name":{"kind":"Name","value":"uri"}},{"kind":"Field","name":{"kind":"Name","value":"name"}},{"kind":"Field","name":{"kind":"Name","value":"acronyms"}},{"kind":"Field","name":{"kind":"Name","value":"displayName"}}]}},{"kind":"Field","name":{"kind":"Name","value":"version"}},{"kind":"Field","name":{"kind":"Name","value":"created"}}]}},{"kind":"Field","name":{"kind":"Name","value":"fundings"},"selectionSet":{"kind":"SelectionSet","selections":[{"kind":"Field","name":{"kind":"Name","value":"id"}},{"kind":"Field","name":{"kind":"Name","value":"projectFunding"},"selectionSet":{"kind":"SelectionSet","selections":[{"kind":"Field","name":{"kind":"Name","value":"affiliation"},"selectionSet":{"kind":"SelectionSet","selections":[{"kind":"Field","name":{"kind":"Name","value":"displayName"}}]}}]}}]}},{"kind":"Field","name":{"kind":"Name","value":"visibility"}},{"kind":"Field","name":{"kind":"Name","value":"status"}},{"kind":"Field","name":{"kind":"Name","value":"project"},"selectionSet":{"kind":"SelectionSet","selections":[{"kind":"Field","name":{"kind":"Name","value":"fundings"},"selectionSet":{"kind":"SelectionSet","selections":[{"kind":"Field","name":{"kind":"Name","value":"affiliation"},"selectionSet":{"kind":"SelectionSet","selections":[{"kind":"Field","name":{"kind":"Name","value":"displayName"}},{"kind":"Field","name":{"kind":"Name","value":"name"}}]}},{"kind":"Field","name":{"kind":"Name","value":"funderOpportunityNumber"}}]}},{"kind":"Field","name":{"kind":"Name","value":"title"}},{"kind":"Field","name":{"kind":"Name","value":"collaborators"},"selectionSet":{"kind":"SelectionSet","selections":[{"kind":"Field","name":{"kind":"Name","value":"user"},"selectionSet":{"kind":"SelectionSet","selections":[{"kind":"Field","name":{"kind":"Name","value":"id"}}]}},{"kind":"Field","name":{"kind":"Name","value":"accessLevel"}}]}}]}},{"kind":"Field","name":{"kind":"Name","value":"members"},"selectionSet":{"kind":"SelectionSet","selections":[{"kind":"Field","name":{"kind":"Name","value":"isPrimaryContact"}},{"kind":"Field","name":{"kind":"Name","value":"projectMember"},"selectionSet":{"kind":"SelectionSet","selections":[{"kind":"Field","name":{"kind":"Name","value":"givenName"}},{"kind":"Field","name":{"kind":"Name","value":"surName"}},{"kind":"Field","name":{"kind":"Name","value":"email"}},{"kind":"Field","name":{"kind":"Name","value":"orcid"}},{"kind":"Field","name":{"kind":"Name","value":"memberRoles"},"selectionSet":{"kind":"SelectionSet","selections":[{"kind":"Field","name":{"kind":"Name","value":"label"}}]}}]}}]}},{"kind":"Field","name":{"kind":"Name","value":"versionedSections"},"selectionSet":{"kind":"SelectionSet","selections":[{"kind":"Field","name":{"kind":"Name","value":"answeredQuestions"}},{"kind":"Field","name":{"kind":"Name","value":"displayOrder"}},{"kind":"Field","name":{"kind":"Name","value":"versionedSectionId"}},{"kind":"Field","name":{"kind":"Name","value":"title"}},{"kind":"Field","name":{"kind":"Name","value":"totalQuestions"}},{"kind":"Field","name":{"kind":"Name","value":"tags"},"selectionSet":{"kind":"SelectionSet","selections":[{"kind":"Field","name":{"kind":"Name","value":"name"}},{"kind":"Field","name":{"kind":"Name","value":"slug"}},{"kind":"Field","name":{"kind":"Name","value":"id"}},{"kind":"Field","name":{"kind":"Name","value":"slug"}},{"kind":"Field","name":{"kind":"Name","value":"description"}}]}},{"kind":"Field","name":{"kind":"Name","value":"sectionType"}},{"kind":"Field","name":{"kind":"Name","value":"customSectionId"}}]}},{"kind":"Field","name":{"kind":"Name","value":"progress"},"selectionSet":{"kind":"SelectionSet","selections":[{"kind":"Field","name":{"kind":"Name","value":"answeredQuestions"}},{"kind":"Field","name":{"kind":"Name","value":"percentComplete"}},{"kind":"Field","name":{"kind":"Name","value":"totalQuestions"}}]}},{"kind":"Field","name":{"kind":"Name","value":"created"}},{"kind":"Field","name":{"kind":"Name","value":"createdById"}},{"kind":"Field","name":{"kind":"Name","value":"modified"}},{"kind":"Field","name":{"kind":"Name","value":"dmpId"}},{"kind":"Field","name":{"kind":"Name","value":"registered"}},{"kind":"Field","name":{"kind":"Name","value":"title"}},{"kind":"Field","name":{"kind":"Name","value":"feedback"},"selectionSet":{"kind":"SelectionSet","selections":[{"kind":"Field","name":{"kind":"Name","value":"id"}},{"kind":"Field","name":{"kind":"Name","value":"completed"}}]}},{"kind":"Field","name":{"kind":"Name","value":"feedbackStatus"},"selectionSet":{"kind":"SelectionSet","selections":[{"kind":"Field","name":{"kind":"Name","value":"id"}},{"kind":"Field","name":{"kind":"Name","value":"status"}}]}},{"kind":"Field","name":{"kind":"Name","value":"planCreator"},"selectionSet":{"kind":"SelectionSet","selections":[{"kind":"Field","name":{"kind":"Name","value":"id"}},{"kind":"Field","name":{"kind":"Name","value":"affiliation"},"selectionSet":{"kind":"SelectionSet","selections":[{"kind":"Field","name":{"kind":"Name","value":"uri"}}]}}]}},{"kind":"Field","name":{"kind":"Name","value":"readOnly"}}]}}]}}]} as unknown as DocumentNode<PlanQuery, PlanQueryVariables>;
export const PlanFeedbackStatusDocument = {"kind":"Document","definitions":[{"kind":"OperationDefinition","operation":"query","name":{"kind":"Name","value":"PlanFeedbackStatus"},"variableDefinitions":[{"kind":"VariableDefinition","variable":{"kind":"Variable","name":{"kind":"Name","value":"planId"}},"type":{"kind":"NonNullType","type":{"kind":"NamedType","name":{"kind":"Name","value":"Int"}}}}],"selectionSet":{"kind":"SelectionSet","selections":[{"kind":"Field","name":{"kind":"Name","value":"planFeedbackStatus"},"arguments":[{"kind":"Argument","name":{"kind":"Name","value":"planId"},"value":{"kind":"Variable","name":{"kind":"Name","value":"planId"}}}],"selectionSet":{"kind":"SelectionSet","selections":[{"kind":"Field","name":{"kind":"Name","value":"id"}},{"kind":"Field","name":{"kind":"Name","value":"status"}}]}}]}}]} as unknown as DocumentNode<PlanFeedbackStatusQuery, PlanFeedbackStatusQueryVariables>;
export const PlanMembersDocument = {"kind":"Document","definitions":[{"kind":"OperationDefinition","operation":"query","name":{"kind":"Name","value":"PlanMembers"},"variableDefinitions":[{"kind":"VariableDefinition","variable":{"kind":"Variable","name":{"kind":"Name","value":"planId"}},"type":{"kind":"NonNullType","type":{"kind":"NamedType","name":{"kind":"Name","value":"Int"}}}}],"selectionSet":{"kind":"SelectionSet","selections":[{"kind":"Field","name":{"kind":"Name","value":"planMembers"},"arguments":[{"kind":"Argument","name":{"kind":"Name","value":"planId"},"value":{"kind":"Variable","name":{"kind":"Name","value":"planId"}}}],"selectionSet":{"kind":"SelectionSet","selections":[{"kind":"Field","name":{"kind":"Name","value":"id"}},{"kind":"Field","name":{"kind":"Name","value":"isPrimaryContact"}},{"kind":"Field","name":{"kind":"Name","value":"errors"},"selectionSet":{"kind":"SelectionSet","selections":[{"kind":"Field","name":{"kind":"Name","value":"general"}}]}},{"kind":"Field","name":{"kind":"Name","value":"projectMember"},"selectionSet":{"kind":"SelectionSet","selections":[{"kind":"Field","name":{"kind":"Name","value":"id"}},{"kind":"Field","name":{"kind":"Name","value":"givenName"}},{"kind":"Field","name":{"kind":"Name","value":"surName"}}]}},{"kind":"Field","name":{"kind":"Name","value":"memberRoles"},"selectionSet":{"kind":"SelectionSet","selections":[{"kind":"Field","name":{"kind":"Name","value":"uri"}},{"kind":"Field","name":{"kind":"Name","value":"id"}},{"kind":"Field","name":{"kind":"Name","value":"label"}},{"kind":"Field","name":{"kind":"Name","value":"description"}},{"kind":"Field","name":{"kind":"Name","value":"displayOrder"}}]}}]}}]}}]} as unknown as DocumentNode<PlanMembersQuery, PlanMembersQueryVariables>;
export const ProjectFundingDocument = {"kind":"Document","definitions":[{"kind":"OperationDefinition","operation":"query","name":{"kind":"Name","value":"ProjectFunding"},"variableDefinitions":[{"kind":"VariableDefinition","variable":{"kind":"Variable","name":{"kind":"Name","value":"projectFundingId"}},"type":{"kind":"NonNullType","type":{"kind":"NamedType","name":{"kind":"Name","value":"Int"}}}}],"selectionSet":{"kind":"SelectionSet","selections":[{"kind":"Field","name":{"kind":"Name","value":"projectFunding"},"arguments":[{"kind":"Argument","name":{"kind":"Name","value":"projectFundingId"},"value":{"kind":"Variable","name":{"kind":"Name","value":"projectFundingId"}}}],"selectionSet":{"kind":"SelectionSet","selections":[{"kind":"Field","name":{"kind":"Name","value":"affiliation"},"selectionSet":{"kind":"SelectionSet","selections":[{"kind":"Field","name":{"kind":"Name","value":"name"}},{"kind":"Field","name":{"kind":"Name","value":"displayName"}},{"kind":"Field","name":{"kind":"Name","value":"uri"}}]}},{"kind":"Field","name":{"kind":"Name","value":"status"}},{"kind":"Field","name":{"kind":"Name","value":"grantId"}},{"kind":"Field","name":{"kind":"Name","value":"funderOpportunityNumber"}},{"kind":"Field","name":{"kind":"Name","value":"funderProjectNumber"}}]}}]}}]} as unknown as DocumentNode<ProjectFundingQuery, ProjectFundingQueryVariables>;
export const ProjectMembersDocument = {"kind":"Document","definitions":[{"kind":"OperationDefinition","operation":"query","name":{"kind":"Name","value":"ProjectMembers"},"variableDefinitions":[{"kind":"VariableDefinition","variable":{"kind":"Variable","name":{"kind":"Name","value":"projectId"}},"type":{"kind":"NonNullType","type":{"kind":"NamedType","name":{"kind":"Name","value":"Int"}}}}],"selectionSet":{"kind":"SelectionSet","selections":[{"kind":"Field","name":{"kind":"Name","value":"projectMembers"},"arguments":[{"kind":"Argument","name":{"kind":"Name","value":"projectId"},"value":{"kind":"Variable","name":{"kind":"Name","value":"projectId"}}}],"selectionSet":{"kind":"SelectionSet","selections":[{"kind":"Field","name":{"kind":"Name","value":"id"}},{"kind":"Field","name":{"kind":"Name","value":"givenName"}},{"kind":"Field","name":{"kind":"Name","value":"surName"}},{"kind":"Field","name":{"kind":"Name","value":"orcid"}},{"kind":"Field","name":{"kind":"Name","value":"memberRoles"},"selectionSet":{"kind":"SelectionSet","selections":[{"kind":"Field","name":{"kind":"Name","value":"id"}},{"kind":"Field","name":{"kind":"Name","value":"label"}},{"kind":"Field","name":{"kind":"Name","value":"description"}}]}},{"kind":"Field","name":{"kind":"Name","value":"affiliation"},"selectionSet":{"kind":"SelectionSet","selections":[{"kind":"Field","name":{"kind":"Name","value":"displayName"}}]}}]}}]}}]} as unknown as DocumentNode<ProjectMembersQuery, ProjectMembersQueryVariables>;
export const ProjectMemberDocument = {"kind":"Document","definitions":[{"kind":"OperationDefinition","operation":"query","name":{"kind":"Name","value":"ProjectMember"},"variableDefinitions":[{"kind":"VariableDefinition","variable":{"kind":"Variable","name":{"kind":"Name","value":"projectMemberId"}},"type":{"kind":"NonNullType","type":{"kind":"NamedType","name":{"kind":"Name","value":"Int"}}}}],"selectionSet":{"kind":"SelectionSet","selections":[{"kind":"Field","name":{"kind":"Name","value":"projectMember"},"arguments":[{"kind":"Argument","name":{"kind":"Name","value":"projectMemberId"},"value":{"kind":"Variable","name":{"kind":"Name","value":"projectMemberId"}}}],"selectionSet":{"kind":"SelectionSet","selections":[{"kind":"Field","name":{"kind":"Name","value":"email"}},{"kind":"Field","name":{"kind":"Name","value":"memberRoles"},"selectionSet":{"kind":"SelectionSet","selections":[{"kind":"Field","name":{"kind":"Name","value":"id"}},{"kind":"Field","name":{"kind":"Name","value":"label"}},{"kind":"Field","name":{"kind":"Name","value":"displayOrder"}},{"kind":"Field","name":{"kind":"Name","value":"uri"}}]}},{"kind":"Field","name":{"kind":"Name","value":"givenName"}},{"kind":"Field","name":{"kind":"Name","value":"surName"}},{"kind":"Field","name":{"kind":"Name","value":"affiliation"},"selectionSet":{"kind":"SelectionSet","selections":[{"kind":"Field","name":{"kind":"Name","value":"id"}},{"kind":"Field","name":{"kind":"Name","value":"displayName"}},{"kind":"Field","name":{"kind":"Name","value":"uri"}}]}},{"kind":"Field","name":{"kind":"Name","value":"orcid"}}]}}]}}]} as unknown as DocumentNode<ProjectMemberQuery, ProjectMemberQueryVariables>;
export const MyProjectsDocument = {"kind":"Document","definitions":[{"kind":"OperationDefinition","operation":"query","name":{"kind":"Name","value":"MyProjects"},"variableDefinitions":[{"kind":"VariableDefinition","variable":{"kind":"Variable","name":{"kind":"Name","value":"term"}},"type":{"kind":"NamedType","name":{"kind":"Name","value":"String"}}},{"kind":"VariableDefinition","variable":{"kind":"Variable","name":{"kind":"Name","value":"paginationOptions"}},"type":{"kind":"NamedType","name":{"kind":"Name","value":"PaginationOptions"}}}],"selectionSet":{"kind":"SelectionSet","selections":[{"kind":"Field","name":{"kind":"Name","value":"myProjects"},"arguments":[{"kind":"Argument","name":{"kind":"Name","value":"term"},"value":{"kind":"Variable","name":{"kind":"Name","value":"term"}}},{"kind":"Argument","name":{"kind":"Name","value":"paginationOptions"},"value":{"kind":"Variable","name":{"kind":"Name","value":"paginationOptions"}}}],"selectionSet":{"kind":"SelectionSet","selections":[{"kind":"Field","name":{"kind":"Name","value":"totalCount"}},{"kind":"Field","name":{"kind":"Name","value":"nextCursor"}},{"kind":"Field","name":{"kind":"Name","value":"items"},"selectionSet":{"kind":"SelectionSet","selections":[{"kind":"Field","name":{"kind":"Name","value":"title"}},{"kind":"Field","name":{"kind":"Name","value":"id"}},{"kind":"Field","name":{"kind":"Name","value":"startDate"}},{"kind":"Field","name":{"kind":"Name","value":"endDate"}},{"kind":"Field","name":{"kind":"Name","value":"fundings"},"selectionSet":{"kind":"SelectionSet","selections":[{"kind":"Field","name":{"kind":"Name","value":"name"}},{"kind":"Field","name":{"kind":"Name","value":"grantId"}}]}},{"kind":"Field","name":{"kind":"Name","value":"members"},"selectionSet":{"kind":"SelectionSet","selections":[{"kind":"Field","name":{"kind":"Name","value":"name"}},{"kind":"Field","name":{"kind":"Name","value":"role"}},{"kind":"Field","name":{"kind":"Name","value":"orcid"}}]}},{"kind":"Field","name":{"kind":"Name","value":"errors"},"selectionSet":{"kind":"SelectionSet","selections":[{"kind":"Field","name":{"kind":"Name","value":"general"}},{"kind":"Field","name":{"kind":"Name","value":"title"}}]}}]}}]}}]}}]} as unknown as DocumentNode<MyProjectsQuery, MyProjectsQueryVariables>;
export const ProjectDocument = {"kind":"Document","definitions":[{"kind":"OperationDefinition","operation":"query","name":{"kind":"Name","value":"Project"},"variableDefinitions":[{"kind":"VariableDefinition","variable":{"kind":"Variable","name":{"kind":"Name","value":"projectId"}},"type":{"kind":"NonNullType","type":{"kind":"NamedType","name":{"kind":"Name","value":"Int"}}}}],"selectionSet":{"kind":"SelectionSet","selections":[{"kind":"Field","name":{"kind":"Name","value":"project"},"arguments":[{"kind":"Argument","name":{"kind":"Name","value":"projectId"},"value":{"kind":"Variable","name":{"kind":"Name","value":"projectId"}}}],"selectionSet":{"kind":"SelectionSet","selections":[{"kind":"Field","name":{"kind":"Name","value":"title"}},{"kind":"Field","name":{"kind":"Name","value":"abstractText"}},{"kind":"Field","name":{"kind":"Name","value":"startDate"}},{"kind":"Field","name":{"kind":"Name","value":"endDate"}},{"kind":"Field","name":{"kind":"Name","value":"isTestProject"}},{"kind":"Field","name":{"kind":"Name","value":"fundings"},"selectionSet":{"kind":"SelectionSet","selections":[{"kind":"Field","name":{"kind":"Name","value":"id"}},{"kind":"Field","name":{"kind":"Name","value":"grantId"}},{"kind":"Field","name":{"kind":"Name","value":"affiliation"},"selectionSet":{"kind":"SelectionSet","selections":[{"kind":"Field","name":{"kind":"Name","value":"name"}},{"kind":"Field","name":{"kind":"Name","value":"displayName"}},{"kind":"Field","name":{"kind":"Name","value":"searchName"}}]}}]}},{"kind":"Field","name":{"kind":"Name","value":"members"},"selectionSet":{"kind":"SelectionSet","selections":[{"kind":"Field","name":{"kind":"Name","value":"givenName"}},{"kind":"Field","name":{"kind":"Name","value":"surName"}},{"kind":"Field","name":{"kind":"Name","value":"memberRoles"},"selectionSet":{"kind":"SelectionSet","selections":[{"kind":"Field","name":{"kind":"Name","value":"description"}},{"kind":"Field","name":{"kind":"Name","value":"displayOrder"}},{"kind":"Field","name":{"kind":"Name","value":"label"}},{"kind":"Field","name":{"kind":"Name","value":"uri"}}]}},{"kind":"Field","name":{"kind":"Name","value":"email"}}]}},{"kind":"Field","name":{"kind":"Name","value":"researchDomain"},"selectionSet":{"kind":"SelectionSet","selections":[{"kind":"Field","name":{"kind":"Name","value":"id"}},{"kind":"Field","name":{"kind":"Name","value":"parentResearchDomainId"}}]}},{"kind":"Field","name":{"kind":"Name","value":"plans"},"selectionSet":{"kind":"SelectionSet","selections":[{"kind":"Field","name":{"kind":"Name","value":"versionedSections"},"selectionSet":{"kind":"SelectionSet","selections":[{"kind":"Field","name":{"kind":"Name","value":"sectionType"}},{"kind":"Field","name":{"kind":"Name","value":"customSectionId"}},{"kind":"Field","name":{"kind":"Name","value":"answeredQuestions"}},{"kind":"Field","name":{"kind":"Name","value":"displayOrder"}},{"kind":"Field","name":{"kind":"Name","value":"versionedSectionId"}},{"kind":"Field","name":{"kind":"Name","value":"title"}},{"kind":"Field","name":{"kind":"Name","value":"totalQuestions"}}]}},{"kind":"Field","name":{"kind":"Name","value":"title"}},{"kind":"Field","name":{"kind":"Name","value":"templateTitle"}},{"kind":"Field","name":{"kind":"Name","value":"id"}},{"kind":"Field","name":{"kind":"Name","value":"funding"}},{"kind":"Field","name":{"kind":"Name","value":"dmpId"}},{"kind":"Field","name":{"kind":"Name","value":"registered"}},{"kind":"Field","name":{"kind":"Name","value":"modified"}},{"kind":"Field","name":{"kind":"Name","value":"created"}}]}}]}}]}}]} as unknown as DocumentNode<ProjectQuery, ProjectQueryVariables>;
export const ProjectFundingsApiDocument = {"kind":"Document","definitions":[{"kind":"OperationDefinition","operation":"query","name":{"kind":"Name","value":"ProjectFundingsApi"},"variableDefinitions":[{"kind":"VariableDefinition","variable":{"kind":"Variable","name":{"kind":"Name","value":"projectId"}},"type":{"kind":"NonNullType","type":{"kind":"NamedType","name":{"kind":"Name","value":"Int"}}}}],"selectionSet":{"kind":"SelectionSet","selections":[{"kind":"Field","name":{"kind":"Name","value":"project"},"arguments":[{"kind":"Argument","name":{"kind":"Name","value":"projectId"},"value":{"kind":"Variable","name":{"kind":"Name","value":"projectId"}}}],"selectionSet":{"kind":"SelectionSet","selections":[{"kind":"Field","name":{"kind":"Name","value":"fundings"},"selectionSet":{"kind":"SelectionSet","selections":[{"kind":"Field","name":{"kind":"Name","value":"affiliation"},"selectionSet":{"kind":"SelectionSet","selections":[{"kind":"Field","name":{"kind":"Name","value":"apiTarget"}}]}}]}}]}}]}}]} as unknown as DocumentNode<ProjectFundingsApiQuery, ProjectFundingsApiQueryVariables>;
export const QuestionCustomizationByVersionedQuestionDocument = {"kind":"Document","definitions":[{"kind":"OperationDefinition","operation":"query","name":{"kind":"Name","value":"QuestionCustomizationByVersionedQuestion"},"variableDefinitions":[{"kind":"VariableDefinition","variable":{"kind":"Variable","name":{"kind":"Name","value":"templateCustomizationId"}},"type":{"kind":"NonNullType","type":{"kind":"NamedType","name":{"kind":"Name","value":"Int"}}}},{"kind":"VariableDefinition","variable":{"kind":"Variable","name":{"kind":"Name","value":"versionedQuestionId"}},"type":{"kind":"NonNullType","type":{"kind":"NamedType","name":{"kind":"Name","value":"Int"}}}}],"selectionSet":{"kind":"SelectionSet","selections":[{"kind":"Field","name":{"kind":"Name","value":"questionCustomizationByVersionedQuestion"},"arguments":[{"kind":"Argument","name":{"kind":"Name","value":"templateCustomizationId"},"value":{"kind":"Variable","name":{"kind":"Name","value":"templateCustomizationId"}}},{"kind":"Argument","name":{"kind":"Name","value":"versionedQuestionId"},"value":{"kind":"Variable","name":{"kind":"Name","value":"versionedQuestionId"}}}],"selectionSet":{"kind":"SelectionSet","selections":[{"kind":"Field","name":{"kind":"Name","value":"id"}},{"kind":"Field","name":{"kind":"Name","value":"guidanceText"}},{"kind":"Field","name":{"kind":"Name","value":"migrationStatus"}},{"kind":"Field","name":{"kind":"Name","value":"modified"}},{"kind":"Field","name":{"kind":"Name","value":"questionId"}},{"kind":"Field","name":{"kind":"Name","value":"sampleText"}},{"kind":"Field","name":{"kind":"Name","value":"templateCustomizationId"}},{"kind":"Field","name":{"kind":"Name","value":"errors"},"selectionSet":{"kind":"SelectionSet","selections":[{"kind":"Field","name":{"kind":"Name","value":"general"}},{"kind":"Field","name":{"kind":"Name","value":"guidanceText"}},{"kind":"Field","name":{"kind":"Name","value":"migrationStatus"}},{"kind":"Field","name":{"kind":"Name","value":"questionId"}},{"kind":"Field","name":{"kind":"Name","value":"sampleText"}},{"kind":"Field","name":{"kind":"Name","value":"templateCustomizationId"}}]}},{"kind":"Field","name":{"kind":"Name","value":"versionedQuestion"},"selectionSet":{"kind":"SelectionSet","selections":[{"kind":"Field","name":{"kind":"Name","value":"id"}},{"kind":"Field","name":{"kind":"Name","value":"guidanceText"}},{"kind":"Field","name":{"kind":"Name","value":"questionText"}},{"kind":"Field","name":{"kind":"Name","value":"requirementText"}},{"kind":"Field","name":{"kind":"Name","value":"required"}},{"kind":"Field","name":{"kind":"Name","value":"sampleText"}},{"kind":"Field","name":{"kind":"Name","value":"ownerAffiliation"},"selectionSet":{"kind":"SelectionSet","selections":[{"kind":"Field","name":{"kind":"Name","value":"displayName"}},{"kind":"Field","name":{"kind":"Name","value":"id"}}]}}]}}]}}]}}]} as unknown as DocumentNode<QuestionCustomizationByVersionedQuestionQuery, QuestionCustomizationByVersionedQuestionQueryVariables>;
export const QuestionsDisplayOrderDocument = {"kind":"Document","definitions":[{"kind":"OperationDefinition","operation":"query","name":{"kind":"Name","value":"QuestionsDisplayOrder"},"variableDefinitions":[{"kind":"VariableDefinition","variable":{"kind":"Variable","name":{"kind":"Name","value":"sectionId"}},"type":{"kind":"NonNullType","type":{"kind":"NamedType","name":{"kind":"Name","value":"Int"}}}}],"selectionSet":{"kind":"SelectionSet","selections":[{"kind":"Field","name":{"kind":"Name","value":"questions"},"arguments":[{"kind":"Argument","name":{"kind":"Name","value":"sectionId"},"value":{"kind":"Variable","name":{"kind":"Name","value":"sectionId"}}}],"selectionSet":{"kind":"SelectionSet","selections":[{"kind":"Field","name":{"kind":"Name","value":"displayOrder"}}]}}]}}]} as unknown as DocumentNode<QuestionsDisplayOrderQuery, QuestionsDisplayOrderQueryVariables>;
export const PlanSectionQuestionsDocument = {"kind":"Document","definitions":[{"kind":"OperationDefinition","operation":"query","name":{"kind":"Name","value":"PlanSectionQuestions"},"variableDefinitions":[{"kind":"VariableDefinition","variable":{"kind":"Variable","name":{"kind":"Name","value":"sectionId"}},"type":{"kind":"NonNullType","type":{"kind":"NamedType","name":{"kind":"Name","value":"Int"}}}}],"selectionSet":{"kind":"SelectionSet","selections":[{"kind":"Field","name":{"kind":"Name","value":"questions"},"arguments":[{"kind":"Argument","name":{"kind":"Name","value":"sectionId"},"value":{"kind":"Variable","name":{"kind":"Name","value":"sectionId"}}}],"selectionSet":{"kind":"SelectionSet","selections":[{"kind":"Field","name":{"kind":"Name","value":"id"}},{"kind":"Field","name":{"kind":"Name","value":"questionText"}},{"kind":"Field","name":{"kind":"Name","value":"displayOrder"}},{"kind":"Field","name":{"kind":"Name","value":"guidanceText"}},{"kind":"Field","name":{"kind":"Name","value":"requirementText"}},{"kind":"Field","name":{"kind":"Name","value":"sampleText"}},{"kind":"Field","name":{"kind":"Name","value":"sectionId"}},{"kind":"Field","name":{"kind":"Name","value":"templateId"}},{"kind":"Field","name":{"kind":"Name","value":"isDirty"}}]}}]}}]} as unknown as DocumentNode<PlanSectionQuestionsQuery, PlanSectionQuestionsQueryVariables>;
export const QuestionDocument = {"kind":"Document","definitions":[{"kind":"OperationDefinition","operation":"query","name":{"kind":"Name","value":"Question"},"variableDefinitions":[{"kind":"VariableDefinition","variable":{"kind":"Variable","name":{"kind":"Name","value":"questionId"}},"type":{"kind":"NonNullType","type":{"kind":"NamedType","name":{"kind":"Name","value":"Int"}}}}],"selectionSet":{"kind":"SelectionSet","selections":[{"kind":"Field","name":{"kind":"Name","value":"question"},"arguments":[{"kind":"Argument","name":{"kind":"Name","value":"questionId"},"value":{"kind":"Variable","name":{"kind":"Name","value":"questionId"}}}],"selectionSet":{"kind":"SelectionSet","selections":[{"kind":"Field","name":{"kind":"Name","value":"id"}},{"kind":"Field","name":{"kind":"Name","value":"guidanceText"}},{"kind":"Field","name":{"kind":"Name","value":"errors"},"selectionSet":{"kind":"SelectionSet","selections":[{"kind":"Field","name":{"kind":"Name","value":"general"}},{"kind":"Field","name":{"kind":"Name","value":"questionText"}},{"kind":"Field","name":{"kind":"Name","value":"requirementText"}},{"kind":"Field","name":{"kind":"Name","value":"sampleText"}},{"kind":"Field","name":{"kind":"Name","value":"displayOrder"}},{"kind":"Field","name":{"kind":"Name","value":"questionConditionIds"}},{"kind":"Field","name":{"kind":"Name","value":"sectionId"}},{"kind":"Field","name":{"kind":"Name","value":"templateId"}}]}},{"kind":"Field","name":{"kind":"Name","value":"displayOrder"}},{"kind":"Field","name":{"kind":"Name","value":"questionText"}},{"kind":"Field","name":{"kind":"Name","value":"json"}},{"kind":"Field","name":{"kind":"Name","value":"requirementText"}},{"kind":"Field","name":{"kind":"Name","value":"sampleText"}},{"kind":"Field","name":{"kind":"Name","value":"useSampleTextAsDefault"}},{"kind":"Field","name":{"kind":"Name","value":"sectionId"}},{"kind":"Field","name":{"kind":"Name","value":"templateId"}},{"kind":"Field","name":{"kind":"Name","value":"isDirty"}},{"kind":"Field","name":{"kind":"Name","value":"required"}}]}}]}}]} as unknown as DocumentNode<QuestionQuery, QuestionQueryVariables>;
export const PublishedQuestionsDocument = {"kind":"Document","definitions":[{"kind":"OperationDefinition","operation":"query","name":{"kind":"Name","value":"PublishedQuestions"},"variableDefinitions":[{"kind":"VariableDefinition","variable":{"kind":"Variable","name":{"kind":"Name","value":"planId"}},"type":{"kind":"NonNullType","type":{"kind":"NamedType","name":{"kind":"Name","value":"Int"}}}},{"kind":"VariableDefinition","variable":{"kind":"Variable","name":{"kind":"Name","value":"versionedSectionId"}},"type":{"kind":"NonNullType","type":{"kind":"NamedType","name":{"kind":"Name","value":"Int"}}}}],"selectionSet":{"kind":"SelectionSet","selections":[{"kind":"Field","name":{"kind":"Name","value":"publishedQuestions"},"arguments":[{"kind":"Argument","name":{"kind":"Name","value":"planId"},"value":{"kind":"Variable","name":{"kind":"Name","value":"planId"}}},{"kind":"Argument","name":{"kind":"Name","value":"versionedSectionId"},"value":{"kind":"Variable","name":{"kind":"Name","value":"versionedSectionId"}}}],"selectionSet":{"kind":"SelectionSet","selections":[{"kind":"Field","name":{"kind":"Name","value":"id"}},{"kind":"Field","name":{"kind":"Name","value":"questionText"}},{"kind":"Field","name":{"kind":"Name","value":"guidanceText"}},{"kind":"Field","name":{"kind":"Name","value":"requirementText"}},{"kind":"Field","name":{"kind":"Name","value":"sampleText"}},{"kind":"Field","name":{"kind":"Name","value":"useSampleTextAsDefault"}},{"kind":"Field","name":{"kind":"Name","value":"required"}},{"kind":"Field","name":{"kind":"Name","value":"hasAnswer"}},{"kind":"Field","name":{"kind":"Name","value":"questionType"}},{"kind":"Field","name":{"kind":"Name","value":"versionedQuestionId"}},{"kind":"Field","name":{"kind":"Name","value":"customQuestionId"}},{"kind":"Field","name":{"kind":"Name","value":"json"}}]}}]}}]} as unknown as DocumentNode<PublishedQuestionsQuery, PublishedQuestionsQueryVariables>;
export const PublishedCustomQuestionsDocument = {"kind":"Document","definitions":[{"kind":"OperationDefinition","operation":"query","name":{"kind":"Name","value":"PublishedCustomQuestions"},"variableDefinitions":[{"kind":"VariableDefinition","variable":{"kind":"Variable","name":{"kind":"Name","value":"planId"}},"type":{"kind":"NonNullType","type":{"kind":"NamedType","name":{"kind":"Name","value":"Int"}}}},{"kind":"VariableDefinition","variable":{"kind":"Variable","name":{"kind":"Name","value":"versionedCustomSectionId"}},"type":{"kind":"NonNullType","type":{"kind":"NamedType","name":{"kind":"Name","value":"Int"}}}}],"selectionSet":{"kind":"SelectionSet","selections":[{"kind":"Field","name":{"kind":"Name","value":"publishedCustomQuestions"},"arguments":[{"kind":"Argument","name":{"kind":"Name","value":"planId"},"value":{"kind":"Variable","name":{"kind":"Name","value":"planId"}}},{"kind":"Argument","name":{"kind":"Name","value":"versionedCustomSectionId"},"value":{"kind":"Variable","name":{"kind":"Name","value":"versionedCustomSectionId"}}}],"selectionSet":{"kind":"SelectionSet","selections":[{"kind":"Field","name":{"kind":"Name","value":"id"}},{"kind":"Field","name":{"kind":"Name","value":"questionText"}},{"kind":"Field","name":{"kind":"Name","value":"guidanceText"}},{"kind":"Field","name":{"kind":"Name","value":"requirementText"}},{"kind":"Field","name":{"kind":"Name","value":"sampleText"}},{"kind":"Field","name":{"kind":"Name","value":"useSampleTextAsDefault"}},{"kind":"Field","name":{"kind":"Name","value":"required"}},{"kind":"Field","name":{"kind":"Name","value":"hasAnswer"}},{"kind":"Field","name":{"kind":"Name","value":"questionType"}},{"kind":"Field","name":{"kind":"Name","value":"versionedQuestionId"}},{"kind":"Field","name":{"kind":"Name","value":"customQuestionId"}},{"kind":"Field","name":{"kind":"Name","value":"json"}}]}}]}}]} as unknown as DocumentNode<PublishedCustomQuestionsQuery, PublishedCustomQuestionsQueryVariables>;
export const PublishedQuestionDocument = {"kind":"Document","definitions":[{"kind":"OperationDefinition","operation":"query","name":{"kind":"Name","value":"PublishedQuestion"},"variableDefinitions":[{"kind":"VariableDefinition","variable":{"kind":"Variable","name":{"kind":"Name","value":"versionedQuestionId"}},"type":{"kind":"NonNullType","type":{"kind":"NamedType","name":{"kind":"Name","value":"Int"}}}}],"selectionSet":{"kind":"SelectionSet","selections":[{"kind":"Field","name":{"kind":"Name","value":"publishedQuestion"},"arguments":[{"kind":"Argument","name":{"kind":"Name","value":"versionedQuestionId"},"value":{"kind":"Variable","name":{"kind":"Name","value":"versionedQuestionId"}}}],"selectionSet":{"kind":"SelectionSet","selections":[{"kind":"Field","name":{"kind":"Name","value":"id"}},{"kind":"Field","name":{"kind":"Name","value":"guidanceText"}},{"kind":"Field","name":{"kind":"Name","value":"errors"},"selectionSet":{"kind":"SelectionSet","selections":[{"kind":"Field","name":{"kind":"Name","value":"general"}},{"kind":"Field","name":{"kind":"Name","value":"questionText"}},{"kind":"Field","name":{"kind":"Name","value":"requirementText"}},{"kind":"Field","name":{"kind":"Name","value":"sampleText"}},{"kind":"Field","name":{"kind":"Name","value":"displayOrder"}},{"kind":"Field","name":{"kind":"Name","value":"versionedSectionId"}}]}},{"kind":"Field","name":{"kind":"Name","value":"displayOrder"}},{"kind":"Field","name":{"kind":"Name","value":"questionText"}},{"kind":"Field","name":{"kind":"Name","value":"json"}},{"kind":"Field","name":{"kind":"Name","value":"requirementText"}},{"kind":"Field","name":{"kind":"Name","value":"sampleText"}},{"kind":"Field","name":{"kind":"Name","value":"useSampleTextAsDefault"}},{"kind":"Field","name":{"kind":"Name","value":"versionedSectionId"}},{"kind":"Field","name":{"kind":"Name","value":"versionedTemplateId"}},{"kind":"Field","name":{"kind":"Name","value":"required"}},{"kind":"Field","name":{"kind":"Name","value":"ownerAffiliation"},"selectionSet":{"kind":"SelectionSet","selections":[{"kind":"Field","name":{"kind":"Name","value":"acronyms"}},{"kind":"Field","name":{"kind":"Name","value":"displayName"}},{"kind":"Field","name":{"kind":"Name","value":"uri"}},{"kind":"Field","name":{"kind":"Name","value":"name"}},{"kind":"Field","name":{"kind":"Name","value":"id"}}]}},{"kind":"Field","name":{"kind":"Name","value":"customizationSampleText"}},{"kind":"Field","name":{"kind":"Name","value":"customizationId"}},{"kind":"Field","name":{"kind":"Name","value":"customizationGuidanceText"}},{"kind":"Field","name":{"kind":"Name","value":"customizationOwnerAffiliation"},"selectionSet":{"kind":"SelectionSet","selections":[{"kind":"Field","name":{"kind":"Name","value":"name"}},{"kind":"Field","name":{"kind":"Name","value":"id"}},{"kind":"Field","name":{"kind":"Name","value":"uri"}},{"kind":"Field","name":{"kind":"Name","value":"displayName"}}]}}]}}]}}]} as unknown as DocumentNode<PublishedQuestionQuery, PublishedQuestionQueryVariables>;
export const PublishedCustomQuestionDocument = {"kind":"Document","definitions":[{"kind":"OperationDefinition","operation":"query","name":{"kind":"Name","value":"PublishedCustomQuestion"},"variableDefinitions":[{"kind":"VariableDefinition","variable":{"kind":"Variable","name":{"kind":"Name","value":"versionedCustomQuestionId"}},"type":{"kind":"NonNullType","type":{"kind":"NamedType","name":{"kind":"Name","value":"Int"}}}}],"selectionSet":{"kind":"SelectionSet","selections":[{"kind":"Field","name":{"kind":"Name","value":"publishedCustomQuestion"},"arguments":[{"kind":"Argument","name":{"kind":"Name","value":"versionedCustomQuestionId"},"value":{"kind":"Variable","name":{"kind":"Name","value":"versionedCustomQuestionId"}}}],"selectionSet":{"kind":"SelectionSet","selections":[{"kind":"Field","name":{"kind":"Name","value":"id"}},{"kind":"Field","name":{"kind":"Name","value":"guidanceText"}},{"kind":"Field","name":{"kind":"Name","value":"errors"},"selectionSet":{"kind":"SelectionSet","selections":[{"kind":"Field","name":{"kind":"Name","value":"questionText"}},{"kind":"Field","name":{"kind":"Name","value":"general"}},{"kind":"Field","name":{"kind":"Name","value":"json"}}]}},{"kind":"Field","name":{"kind":"Name","value":"pinnedVersionedQuestionType"}},{"kind":"Field","name":{"kind":"Name","value":"pinnedVersionedQuestionId"}},{"kind":"Field","name":{"kind":"Name","value":"ownerAffiliation"},"selectionSet":{"kind":"SelectionSet","selections":[{"kind":"Field","name":{"kind":"Name","value":"id"}},{"kind":"Field","name":{"kind":"Name","value":"name"}},{"kind":"Field","name":{"kind":"Name","value":"displayName"}},{"kind":"Field","name":{"kind":"Name","value":"acronyms"}},{"kind":"Field","name":{"kind":"Name","value":"uri"}}]}},{"kind":"Field","name":{"kind":"Name","value":"questionText"}},{"kind":"Field","name":{"kind":"Name","value":"json"}},{"kind":"Field","name":{"kind":"Name","value":"requirementText"}},{"kind":"Field","name":{"kind":"Name","value":"sampleText"}},{"kind":"Field","name":{"kind":"Name","value":"useSampleTextAsDefault"}},{"kind":"Field","name":{"kind":"Name","value":"versionedSectionId"}},{"kind":"Field","name":{"kind":"Name","value":"versionedSectionType"}},{"kind":"Field","name":{"kind":"Name","value":"versionedTemplateCustomizationId"}},{"kind":"Field","name":{"kind":"Name","value":"required"}}]}}]}}]} as unknown as DocumentNode<PublishedCustomQuestionQuery, PublishedCustomQuestionQueryVariables>;
export const RelatedWorksDocument = {"kind":"Document","definitions":[{"kind":"OperationDefinition","operation":"query","name":{"kind":"Name","value":"RelatedWorks"},"variableDefinitions":[{"kind":"VariableDefinition","variable":{"kind":"Variable","name":{"kind":"Name","value":"id"}},"type":{"kind":"NonNullType","type":{"kind":"NamedType","name":{"kind":"Name","value":"Int"}}}},{"kind":"VariableDefinition","variable":{"kind":"Variable","name":{"kind":"Name","value":"idType"}},"type":{"kind":"NonNullType","type":{"kind":"NamedType","name":{"kind":"Name","value":"RelatedWorksIdentifierType"}}}},{"kind":"VariableDefinition","variable":{"kind":"Variable","name":{"kind":"Name","value":"paginationOptions"}},"type":{"kind":"NamedType","name":{"kind":"Name","value":"PaginationOptions"}}},{"kind":"VariableDefinition","variable":{"kind":"Variable","name":{"kind":"Name","value":"filterOptions"}},"type":{"kind":"NamedType","name":{"kind":"Name","value":"RelatedWorksFilterOptions"}}}],"selectionSet":{"kind":"SelectionSet","selections":[{"kind":"Field","name":{"kind":"Name","value":"relatedWorks"},"arguments":[{"kind":"Argument","name":{"kind":"Name","value":"id"},"value":{"kind":"Variable","name":{"kind":"Name","value":"id"}}},{"kind":"Argument","name":{"kind":"Name","value":"idType"},"value":{"kind":"Variable","name":{"kind":"Name","value":"idType"}}},{"kind":"Argument","name":{"kind":"Name","value":"paginationOptions"},"value":{"kind":"Variable","name":{"kind":"Name","value":"paginationOptions"}}},{"kind":"Argument","name":{"kind":"Name","value":"filterOptions"},"value":{"kind":"Variable","name":{"kind":"Name","value":"filterOptions"}}}],"selectionSet":{"kind":"SelectionSet","selections":[{"kind":"Field","name":{"kind":"Name","value":"items"},"selectionSet":{"kind":"SelectionSet","selections":[{"kind":"Field","name":{"kind":"Name","value":"id"}},{"kind":"Field","name":{"kind":"Name","value":"projectId"}},{"kind":"Field","name":{"kind":"Name","value":"planId"}},{"kind":"Field","name":{"kind":"Name","value":"planTitle"}},{"kind":"Field","name":{"kind":"Name","value":"workVersion"},"selectionSet":{"kind":"SelectionSet","selections":[{"kind":"Field","name":{"kind":"Name","value":"id"}},{"kind":"Field","name":{"kind":"Name","value":"work"},"selectionSet":{"kind":"SelectionSet","selections":[{"kind":"Field","name":{"kind":"Name","value":"id"}},{"kind":"Field","name":{"kind":"Name","value":"doi"}}]}},{"kind":"Field","name":{"kind":"Name","value":"hash"}},{"kind":"Field","name":{"kind":"Name","value":"workType"}},{"kind":"Field","name":{"kind":"Name","value":"publicationDate"}},{"kind":"Field","name":{"kind":"Name","value":"title"}},{"kind":"Field","name":{"kind":"Name","value":"authors"},"selectionSet":{"kind":"SelectionSet","selections":[{"kind":"Field","name":{"kind":"Name","value":"orcid"}},{"kind":"Field","name":{"kind":"Name","value":"firstInitial"}},{"kind":"Field","name":{"kind":"Name","value":"givenName"}},{"kind":"Field","name":{"kind":"Name","value":"middleInitials"}},{"kind":"Field","name":{"kind":"Name","value":"middleNames"}},{"kind":"Field","name":{"kind":"Name","value":"surname"}},{"kind":"Field","name":{"kind":"Name","value":"full"}}]}},{"kind":"Field","name":{"kind":"Name","value":"institutions"},"selectionSet":{"kind":"SelectionSet","selections":[{"kind":"Field","name":{"kind":"Name","value":"name"}},{"kind":"Field","name":{"kind":"Name","value":"ror"}}]}},{"kind":"Field","name":{"kind":"Name","value":"funders"},"selectionSet":{"kind":"SelectionSet","selections":[{"kind":"Field","name":{"kind":"Name","value":"name"}},{"kind":"Field","name":{"kind":"Name","value":"ror"}}]}},{"kind":"Field","name":{"kind":"Name","value":"awards"},"selectionSet":{"kind":"SelectionSet","selections":[{"kind":"Field","name":{"kind":"Name","value":"awardId"}}]}},{"kind":"Field","name":{"kind":"Name","value":"publicationVenue"}},{"kind":"Field","name":{"kind":"Name","value":"sourceName"}},{"kind":"Field","name":{"kind":"Name","value":"sourceUrl"}}]}},{"kind":"Field","name":{"kind":"Name","value":"scoreNorm"}},{"kind":"Field","name":{"kind":"Name","value":"confidence"}},{"kind":"Field","name":{"kind":"Name","value":"status"}},{"kind":"Field","name":{"kind":"Name","value":"doiMatch"},"selectionSet":{"kind":"SelectionSet","selections":[{"kind":"Field","name":{"kind":"Name","value":"found"}},{"kind":"Field","name":{"kind":"Name","value":"score"}},{"kind":"Field","name":{"kind":"Name","value":"sources"},"selectionSet":{"kind":"SelectionSet","selections":[{"kind":"Field","name":{"kind":"Name","value":"parentAwardId"}},{"kind":"Field","name":{"kind":"Name","value":"awardId"}},{"kind":"Field","name":{"kind":"Name","value":"awardUrl"}}]}}]}},{"kind":"Field","name":{"kind":"Name","value":"contentMatch"},"selectionSet":{"kind":"SelectionSet","selections":[{"kind":"Field","name":{"kind":"Name","value":"score"}},{"kind":"Field","name":{"kind":"Name","value":"titleHighlight"}},{"kind":"Field","name":{"kind":"Name","value":"abstractHighlights"}}]}},{"kind":"Field","name":{"kind":"Name","value":"authorMatches"},"selectionSet":{"kind":"SelectionSet","selections":[{"kind":"Field","name":{"kind":"Name","value":"index"}},{"kind":"Field","name":{"kind":"Name","value":"score"}},{"kind":"Field","name":{"kind":"Name","value":"fields"}}]}},{"kind":"Field","name":{"kind":"Name","value":"institutionMatches"},"selectionSet":{"kind":"SelectionSet","selections":[{"kind":"Field","name":{"kind":"Name","value":"index"}},{"kind":"Field","name":{"kind":"Name","value":"score"}},{"kind":"Field","name":{"kind":"Name","value":"fields"}}]}},{"kind":"Field","name":{"kind":"Name","value":"funderMatches"},"selectionSet":{"kind":"SelectionSet","selections":[{"kind":"Field","name":{"kind":"Name","value":"index"}},{"kind":"Field","name":{"kind":"Name","value":"score"}},{"kind":"Field","name":{"kind":"Name","value":"fields"}}]}},{"kind":"Field","name":{"kind":"Name","value":"awardMatches"},"selectionSet":{"kind":"SelectionSet","selections":[{"kind":"Field","name":{"kind":"Name","value":"index"}},{"kind":"Field","name":{"kind":"Name","value":"score"}},{"kind":"Field","name":{"kind":"Name","value":"fields"}}]}},{"kind":"Field","name":{"kind":"Name","value":"created"}},{"kind":"Field","name":{"kind":"Name","value":"modified"}}]}},{"kind":"Field","name":{"kind":"Name","value":"totalCount"}},{"kind":"Field","name":{"kind":"Name","value":"limit"}},{"kind":"Field","name":{"kind":"Name","value":"currentOffset"}},{"kind":"Field","name":{"kind":"Name","value":"hasNextPage"}},{"kind":"Field","name":{"kind":"Name","value":"hasPreviousPage"}},{"kind":"Field","name":{"kind":"Name","value":"availableSortFields"}},{"kind":"Field","name":{"kind":"Name","value":"statusOnlyCount"}},{"kind":"Field","name":{"kind":"Name","value":"workTypeCounts"},"selectionSet":{"kind":"SelectionSet","selections":[{"kind":"Field","name":{"kind":"Name","value":"typeId"}},{"kind":"Field","name":{"kind":"Name","value":"count"}}]}},{"kind":"Field","name":{"kind":"Name","value":"confidenceCounts"},"selectionSet":{"kind":"SelectionSet","selections":[{"kind":"Field","name":{"kind":"Name","value":"typeId"}},{"kind":"Field","name":{"kind":"Name","value":"count"}}]}}]}}]}}]} as unknown as DocumentNode<RelatedWorksQuery, RelatedWorksQueryVariables>;
export const FindWorkByIdentifierDocument = {"kind":"Document","definitions":[{"kind":"OperationDefinition","operation":"query","name":{"kind":"Name","value":"FindWorkByIdentifier"},"variableDefinitions":[{"kind":"VariableDefinition","variable":{"kind":"Variable","name":{"kind":"Name","value":"planId"}},"type":{"kind":"NamedType","name":{"kind":"Name","value":"Int"}}},{"kind":"VariableDefinition","variable":{"kind":"Variable","name":{"kind":"Name","value":"doi"}},"type":{"kind":"NamedType","name":{"kind":"Name","value":"String"}}}],"selectionSet":{"kind":"SelectionSet","selections":[{"kind":"Field","name":{"kind":"Name","value":"findWorkByIdentifier"},"arguments":[{"kind":"Argument","name":{"kind":"Name","value":"planId"},"value":{"kind":"Variable","name":{"kind":"Name","value":"planId"}}},{"kind":"Argument","name":{"kind":"Name","value":"doi"},"value":{"kind":"Variable","name":{"kind":"Name","value":"doi"}}}],"selectionSet":{"kind":"SelectionSet","selections":[{"kind":"Field","name":{"kind":"Name","value":"items"},"selectionSet":{"kind":"SelectionSet","selections":[{"kind":"Field","name":{"kind":"Name","value":"id"}},{"kind":"Field","name":{"kind":"Name","value":"planId"}},{"kind":"Field","name":{"kind":"Name","value":"planTitle"}},{"kind":"Field","name":{"kind":"Name","value":"workVersion"},"selectionSet":{"kind":"SelectionSet","selections":[{"kind":"Field","name":{"kind":"Name","value":"work"},"selectionSet":{"kind":"SelectionSet","selections":[{"kind":"Field","name":{"kind":"Name","value":"doi"}}]}},{"kind":"Field","name":{"kind":"Name","value":"title"}},{"kind":"Field","name":{"kind":"Name","value":"hash"}},{"kind":"Field","name":{"kind":"Name","value":"workType"}},{"kind":"Field","name":{"kind":"Name","value":"publicationDate"}},{"kind":"Field","name":{"kind":"Name","value":"publicationVenue"}},{"kind":"Field","name":{"kind":"Name","value":"authors"},"selectionSet":{"kind":"SelectionSet","selections":[{"kind":"Field","name":{"kind":"Name","value":"orcid"}},{"kind":"Field","name":{"kind":"Name","value":"firstInitial"}},{"kind":"Field","name":{"kind":"Name","value":"givenName"}},{"kind":"Field","name":{"kind":"Name","value":"surname"}},{"kind":"Field","name":{"kind":"Name","value":"full"}}]}},{"kind":"Field","name":{"kind":"Name","value":"sourceName"}},{"kind":"Field","name":{"kind":"Name","value":"sourceUrl"}}]}},{"kind":"Field","name":{"kind":"Name","value":"status"}},{"kind":"Field","name":{"kind":"Name","value":"sourceType"}},{"kind":"Field","name":{"kind":"Name","value":"modified"}}]}}]}}]}}]} as unknown as DocumentNode<FindWorkByIdentifierQuery, FindWorkByIdentifierQueryVariables>;
export const RelatedWorksByPlanStatsDocument = {"kind":"Document","definitions":[{"kind":"OperationDefinition","operation":"query","name":{"kind":"Name","value":"RelatedWorksByPlanStats"},"variableDefinitions":[{"kind":"VariableDefinition","variable":{"kind":"Variable","name":{"kind":"Name","value":"planId"}},"type":{"kind":"NonNullType","type":{"kind":"NamedType","name":{"kind":"Name","value":"Int"}}}}],"selectionSet":{"kind":"SelectionSet","selections":[{"kind":"Field","name":{"kind":"Name","value":"relatedWorksByPlanStats"},"arguments":[{"kind":"Argument","name":{"kind":"Name","value":"planId"},"value":{"kind":"Variable","name":{"kind":"Name","value":"planId"}}}],"selectionSet":{"kind":"SelectionSet","selections":[{"kind":"Field","name":{"kind":"Name","value":"hasPublishedPlan"}},{"kind":"Field","name":{"kind":"Name","value":"acceptedCount"}},{"kind":"Field","name":{"kind":"Name","value":"pendingCount"}},{"kind":"Field","name":{"kind":"Name","value":"rejectedCount"}},{"kind":"Field","name":{"kind":"Name","value":"totalCount"}}]}}]}}]} as unknown as DocumentNode<RelatedWorksByPlanStatsQuery, RelatedWorksByPlanStatsQueryVariables>;
export const RelatedWorksByProjectStatsDocument = {"kind":"Document","definitions":[{"kind":"OperationDefinition","operation":"query","name":{"kind":"Name","value":"RelatedWorksByProjectStats"},"variableDefinitions":[{"kind":"VariableDefinition","variable":{"kind":"Variable","name":{"kind":"Name","value":"projectId"}},"type":{"kind":"NonNullType","type":{"kind":"NamedType","name":{"kind":"Name","value":"Int"}}}}],"selectionSet":{"kind":"SelectionSet","selections":[{"kind":"Field","name":{"kind":"Name","value":"relatedWorksByProjectStats"},"arguments":[{"kind":"Argument","name":{"kind":"Name","value":"projectId"},"value":{"kind":"Variable","name":{"kind":"Name","value":"projectId"}}}],"selectionSet":{"kind":"SelectionSet","selections":[{"kind":"Field","name":{"kind":"Name","value":"hasPublishedPlan"}},{"kind":"Field","name":{"kind":"Name","value":"acceptedCount"}},{"kind":"Field","name":{"kind":"Name","value":"pendingCount"}},{"kind":"Field","name":{"kind":"Name","value":"rejectedCount"}},{"kind":"Field","name":{"kind":"Name","value":"totalCount"}}]}}]}}]} as unknown as DocumentNode<RelatedWorksByProjectStatsQuery, RelatedWorksByProjectStatsQueryVariables>;
export const RepositoriesDocument = {"kind":"Document","definitions":[{"kind":"OperationDefinition","operation":"query","name":{"kind":"Name","value":"Repositories"},"variableDefinitions":[{"kind":"VariableDefinition","variable":{"kind":"Variable","name":{"kind":"Name","value":"input"}},"type":{"kind":"NonNullType","type":{"kind":"NamedType","name":{"kind":"Name","value":"RepositorySearchInput"}}}}],"selectionSet":{"kind":"SelectionSet","selections":[{"kind":"Field","name":{"kind":"Name","value":"repositories"},"arguments":[{"kind":"Argument","name":{"kind":"Name","value":"input"},"value":{"kind":"Variable","name":{"kind":"Name","value":"input"}}}],"selectionSet":{"kind":"SelectionSet","selections":[{"kind":"Field","name":{"kind":"Name","value":"hasPreviousPage"}},{"kind":"Field","name":{"kind":"Name","value":"hasNextPage"}},{"kind":"Field","name":{"kind":"Name","value":"currentOffset"}},{"kind":"Field","name":{"kind":"Name","value":"availableSortFields"}},{"kind":"Field","name":{"kind":"Name","value":"totalCount"}},{"kind":"Field","name":{"kind":"Name","value":"nextCursor"}},{"kind":"Field","name":{"kind":"Name","value":"limit"}},{"kind":"Field","name":{"kind":"Name","value":"items"},"selectionSet":{"kind":"SelectionSet","selections":[{"kind":"InlineFragment","typeCondition":{"kind":"NamedType","name":{"kind":"Name","value":"CustomRepository"}},"selectionSet":{"kind":"SelectionSet","selections":[{"kind":"Field","name":{"kind":"Name","value":"name"}},{"kind":"Field","name":{"kind":"Name","value":"description"}},{"kind":"Field","name":{"kind":"Name","value":"uri"}},{"kind":"Field","name":{"kind":"Name","value":"website"}},{"kind":"Field","name":{"kind":"Name","value":"repositoryTypes"}},{"kind":"Field","name":{"kind":"Name","value":"errors"},"selectionSet":{"kind":"SelectionSet","selections":[{"kind":"Field","name":{"kind":"Name","value":"general"}},{"kind":"Field","name":{"kind":"Name","value":"uri"}}]}},{"kind":"Field","name":{"kind":"Name","value":"keywords"}},{"kind":"Field","name":{"kind":"Name","value":"id"}}]}},{"kind":"InlineFragment","typeCondition":{"kind":"NamedType","name":{"kind":"Name","value":"Re3DataRepository"}},"selectionSet":{"kind":"SelectionSet","selections":[{"kind":"Field","name":{"kind":"Name","value":"keywords"}},{"kind":"Field","name":{"kind":"Name","value":"id"}},{"kind":"Field","name":{"kind":"Name","value":"name"}},{"kind":"Field","name":{"kind":"Name","value":"description"}},{"kind":"Field","name":{"kind":"Name","value":"uri"}},{"kind":"Field","name":{"kind":"Name","value":"website"}},{"kind":"Field","name":{"kind":"Name","value":"repositoryTypes"}}]}}]}}]}}]}}]} as unknown as DocumentNode<RepositoriesQuery, RepositoriesQueryVariables>;
export const RepositorySubjectAreasDocument = {"kind":"Document","definitions":[{"kind":"OperationDefinition","operation":"query","name":{"kind":"Name","value":"RepositorySubjectAreas"},"selectionSet":{"kind":"SelectionSet","selections":[{"kind":"Field","name":{"kind":"Name","value":"repositorySubjectAreas"}}]}}]} as unknown as DocumentNode<RepositorySubjectAreasQuery, RepositorySubjectAreasQueryVariables>;
export const RepositoriesByUrIsDocument = {"kind":"Document","definitions":[{"kind":"OperationDefinition","operation":"query","name":{"kind":"Name","value":"RepositoriesByURIs"},"variableDefinitions":[{"kind":"VariableDefinition","variable":{"kind":"Variable","name":{"kind":"Name","value":"uris"}},"type":{"kind":"NonNullType","type":{"kind":"ListType","type":{"kind":"NonNullType","type":{"kind":"NamedType","name":{"kind":"Name","value":"String"}}}}}}],"selectionSet":{"kind":"SelectionSet","selections":[{"kind":"Field","name":{"kind":"Name","value":"repositoriesByURIs"},"arguments":[{"kind":"Argument","name":{"kind":"Name","value":"uris"},"value":{"kind":"Variable","name":{"kind":"Name","value":"uris"}}}],"selectionSet":{"kind":"SelectionSet","selections":[{"kind":"Field","name":{"kind":"Name","value":"keywords"}},{"kind":"Field","name":{"kind":"Name","value":"id"}},{"kind":"Field","name":{"kind":"Name","value":"errors"},"selectionSet":{"kind":"SelectionSet","selections":[{"kind":"Field","name":{"kind":"Name","value":"general"}},{"kind":"Field","name":{"kind":"Name","value":"uri"}}]}},{"kind":"Field","name":{"kind":"Name","value":"name"}},{"kind":"Field","name":{"kind":"Name","value":"description"}},{"kind":"Field","name":{"kind":"Name","value":"uri"}},{"kind":"Field","name":{"kind":"Name","value":"website"}},{"kind":"Field","name":{"kind":"Name","value":"repositoryTypes"}}]}}]}}]} as unknown as DocumentNode<RepositoriesByUrIsQuery, RepositoriesByUrIsQueryVariables>;
export const Re3RepositoryTypesListDocument = {"kind":"Document","definitions":[{"kind":"OperationDefinition","operation":"query","name":{"kind":"Name","value":"Re3RepositoryTypesList"},"selectionSet":{"kind":"SelectionSet","selections":[{"kind":"Field","name":{"kind":"Name","value":"re3RepositoryTypesList"},"selectionSet":{"kind":"SelectionSet","selections":[{"kind":"Field","name":{"kind":"Name","value":"totalCount"}},{"kind":"Field","name":{"kind":"Name","value":"types"},"selectionSet":{"kind":"SelectionSet","selections":[{"kind":"Field","name":{"kind":"Name","value":"count"}},{"kind":"Field","name":{"kind":"Name","value":"type"}}]}}]}}]}}]} as unknown as DocumentNode<Re3RepositoryTypesListQuery, Re3RepositoryTypesListQueryVariables>;
export const Re3SubjectListDocument = {"kind":"Document","definitions":[{"kind":"OperationDefinition","operation":"query","name":{"kind":"Name","value":"Re3SubjectList"},"selectionSet":{"kind":"SelectionSet","selections":[{"kind":"Field","name":{"kind":"Name","value":"re3SubjectList"},"selectionSet":{"kind":"SelectionSet","selections":[{"kind":"Field","name":{"kind":"Name","value":"totalCount"}},{"kind":"Field","name":{"kind":"Name","value":"subjects"},"selectionSet":{"kind":"SelectionSet","selections":[{"kind":"Field","name":{"kind":"Name","value":"subject"}},{"kind":"Field","name":{"kind":"Name","value":"count"}}]}}]}}]}}]} as unknown as DocumentNode<Re3SubjectListQuery, Re3SubjectListQueryVariables>;
export const Re3byUrIsDocument = {"kind":"Document","definitions":[{"kind":"OperationDefinition","operation":"query","name":{"kind":"Name","value":"Re3byURIs"},"variableDefinitions":[{"kind":"VariableDefinition","variable":{"kind":"Variable","name":{"kind":"Name","value":"uris"}},"type":{"kind":"NonNullType","type":{"kind":"ListType","type":{"kind":"NonNullType","type":{"kind":"NamedType","name":{"kind":"Name","value":"String"}}}}}}],"selectionSet":{"kind":"SelectionSet","selections":[{"kind":"Field","name":{"kind":"Name","value":"re3byURIs"},"arguments":[{"kind":"Argument","name":{"kind":"Name","value":"uris"},"value":{"kind":"Variable","name":{"kind":"Name","value":"uris"}}}],"selectionSet":{"kind":"SelectionSet","selections":[{"kind":"Field","name":{"kind":"Name","value":"name"}},{"kind":"Field","name":{"kind":"Name","value":"id"}},{"kind":"Field","name":{"kind":"Name","value":"description"}},{"kind":"Field","name":{"kind":"Name","value":"keywords"}},{"kind":"Field","name":{"kind":"Name","value":"uri"}},{"kind":"Field","name":{"kind":"Name","value":"website"}},{"kind":"Field","name":{"kind":"Name","value":"repositoryTypes"}}]}}]}}]} as unknown as DocumentNode<Re3byUrIsQuery, Re3byUrIsQueryVariables>;
export const TopLevelResearchDomainsDocument = {"kind":"Document","definitions":[{"kind":"OperationDefinition","operation":"query","name":{"kind":"Name","value":"TopLevelResearchDomains"},"selectionSet":{"kind":"SelectionSet","selections":[{"kind":"Field","name":{"kind":"Name","value":"topLevelResearchDomains"},"selectionSet":{"kind":"SelectionSet","selections":[{"kind":"Field","name":{"kind":"Name","value":"name"}},{"kind":"Field","name":{"kind":"Name","value":"description"}},{"kind":"Field","name":{"kind":"Name","value":"id"}}]}}]}}]} as unknown as DocumentNode<TopLevelResearchDomainsQuery, TopLevelResearchDomainsQueryVariables>;
export const ChildResearchDomainsDocument = {"kind":"Document","definitions":[{"kind":"OperationDefinition","operation":"query","name":{"kind":"Name","value":"ChildResearchDomains"},"variableDefinitions":[{"kind":"VariableDefinition","variable":{"kind":"Variable","name":{"kind":"Name","value":"parentResearchDomainId"}},"type":{"kind":"NonNullType","type":{"kind":"NamedType","name":{"kind":"Name","value":"Int"}}}}],"selectionSet":{"kind":"SelectionSet","selections":[{"kind":"Field","name":{"kind":"Name","value":"childResearchDomains"},"arguments":[{"kind":"Argument","name":{"kind":"Name","value":"parentResearchDomainId"},"value":{"kind":"Variable","name":{"kind":"Name","value":"parentResearchDomainId"}}}],"selectionSet":{"kind":"SelectionSet","selections":[{"kind":"Field","name":{"kind":"Name","value":"id"}},{"kind":"Field","name":{"kind":"Name","value":"name"}},{"kind":"Field","name":{"kind":"Name","value":"description"}}]}}]}}]} as unknown as DocumentNode<ChildResearchDomainsQuery, ChildResearchDomainsQueryVariables>;
export const DefaultResearchOutputTypesDocument = {"kind":"Document","definitions":[{"kind":"OperationDefinition","operation":"query","name":{"kind":"Name","value":"DefaultResearchOutputTypes"},"selectionSet":{"kind":"SelectionSet","selections":[{"kind":"Field","name":{"kind":"Name","value":"defaultResearchOutputTypes"},"selectionSet":{"kind":"SelectionSet","selections":[{"kind":"Field","name":{"kind":"Name","value":"id"}},{"kind":"Field","name":{"kind":"Name","value":"name"}},{"kind":"Field","name":{"kind":"Name","value":"value"}},{"kind":"Field","name":{"kind":"Name","value":"errors"},"selectionSet":{"kind":"SelectionSet","selections":[{"kind":"Field","name":{"kind":"Name","value":"general"}},{"kind":"Field","name":{"kind":"Name","value":"name"}},{"kind":"Field","name":{"kind":"Name","value":"value"}}]}},{"kind":"Field","name":{"kind":"Name","value":"description"}}]}}]}}]} as unknown as DocumentNode<DefaultResearchOutputTypesQuery, DefaultResearchOutputTypesQueryVariables>;
export const SectionCustomizationDocument = {"kind":"Document","definitions":[{"kind":"OperationDefinition","operation":"query","name":{"kind":"Name","value":"SectionCustomization"},"variableDefinitions":[{"kind":"VariableDefinition","variable":{"kind":"Variable","name":{"kind":"Name","value":"sectionCustomizationId"}},"type":{"kind":"NonNullType","type":{"kind":"NamedType","name":{"kind":"Name","value":"Int"}}}}],"selectionSet":{"kind":"SelectionSet","selections":[{"kind":"Field","name":{"kind":"Name","value":"sectionCustomization"},"arguments":[{"kind":"Argument","name":{"kind":"Name","value":"sectionCustomizationId"},"value":{"kind":"Variable","name":{"kind":"Name","value":"sectionCustomizationId"}}}],"selectionSet":{"kind":"SelectionSet","selections":[{"kind":"Field","name":{"kind":"Name","value":"id"}},{"kind":"Field","name":{"kind":"Name","value":"errors"},"selectionSet":{"kind":"SelectionSet","selections":[{"kind":"Field","name":{"kind":"Name","value":"general"}},{"kind":"Field","name":{"kind":"Name","value":"guidance"}},{"kind":"Field","name":{"kind":"Name","value":"migrationStatus"}},{"kind":"Field","name":{"kind":"Name","value":"sectionId"}},{"kind":"Field","name":{"kind":"Name","value":"templateCustomizationId"}}]}},{"kind":"Field","name":{"kind":"Name","value":"guidance"}},{"kind":"Field","name":{"kind":"Name","value":"migrationStatus"}},{"kind":"Field","name":{"kind":"Name","value":"modified"}},{"kind":"Field","name":{"kind":"Name","value":"sectionId"}},{"kind":"Field","name":{"kind":"Name","value":"templateCustomizationId"}},{"kind":"Field","name":{"kind":"Name","value":"versionedSection"},"selectionSet":{"kind":"SelectionSet","selections":[{"kind":"Field","name":{"kind":"Name","value":"id"}},{"kind":"Field","name":{"kind":"Name","value":"guidance"}},{"kind":"Field","name":{"kind":"Name","value":"name"}},{"kind":"Field","name":{"kind":"Name","value":"modified"}},{"kind":"Field","name":{"kind":"Name","value":"introduction"}},{"kind":"Field","name":{"kind":"Name","value":"requirements"}},{"kind":"Field","name":{"kind":"Name","value":"displayOrder"}}]}}]}}]}}]} as unknown as DocumentNode<SectionCustomizationQuery, SectionCustomizationQueryVariables>;
export const SectionCustomizationByVersionedSectionDocument = {"kind":"Document","definitions":[{"kind":"OperationDefinition","operation":"query","name":{"kind":"Name","value":"SectionCustomizationByVersionedSection"},"variableDefinitions":[{"kind":"VariableDefinition","variable":{"kind":"Variable","name":{"kind":"Name","value":"templateCustomizationId"}},"type":{"kind":"NonNullType","type":{"kind":"NamedType","name":{"kind":"Name","value":"Int"}}}},{"kind":"VariableDefinition","variable":{"kind":"Variable","name":{"kind":"Name","value":"versionedSectionId"}},"type":{"kind":"NonNullType","type":{"kind":"NamedType","name":{"kind":"Name","value":"Int"}}}}],"selectionSet":{"kind":"SelectionSet","selections":[{"kind":"Field","name":{"kind":"Name","value":"sectionCustomizationByVersionedSection"},"arguments":[{"kind":"Argument","name":{"kind":"Name","value":"templateCustomizationId"},"value":{"kind":"Variable","name":{"kind":"Name","value":"templateCustomizationId"}}},{"kind":"Argument","name":{"kind":"Name","value":"versionedSectionId"},"value":{"kind":"Variable","name":{"kind":"Name","value":"versionedSectionId"}}}],"selectionSet":{"kind":"SelectionSet","selections":[{"kind":"Field","name":{"kind":"Name","value":"id"}},{"kind":"Field","name":{"kind":"Name","value":"guidance"}},{"kind":"Field","name":{"kind":"Name","value":"sectionId"}},{"kind":"Field","name":{"kind":"Name","value":"templateCustomizationId"}},{"kind":"Field","name":{"kind":"Name","value":"versionedSection"},"selectionSet":{"kind":"SelectionSet","selections":[{"kind":"Field","name":{"kind":"Name","value":"id"}},{"kind":"Field","name":{"kind":"Name","value":"name"}}]}},{"kind":"Field","name":{"kind":"Name","value":"errors"},"selectionSet":{"kind":"SelectionSet","selections":[{"kind":"Field","name":{"kind":"Name","value":"guidance"}},{"kind":"Field","name":{"kind":"Name","value":"migrationStatus"}},{"kind":"Field","name":{"kind":"Name","value":"sectionId"}},{"kind":"Field","name":{"kind":"Name","value":"templateCustomizationId"}},{"kind":"Field","name":{"kind":"Name","value":"general"}}]}}]}}]}}]} as unknown as DocumentNode<SectionCustomizationByVersionedSectionQuery, SectionCustomizationByVersionedSectionQueryVariables>;
export const SectionVersionsDocument = {"kind":"Document","definitions":[{"kind":"OperationDefinition","operation":"query","name":{"kind":"Name","value":"SectionVersions"},"variableDefinitions":[{"kind":"VariableDefinition","variable":{"kind":"Variable","name":{"kind":"Name","value":"sectionId"}},"type":{"kind":"NonNullType","type":{"kind":"NamedType","name":{"kind":"Name","value":"Int"}}}}],"selectionSet":{"kind":"SelectionSet","selections":[{"kind":"Field","name":{"kind":"Name","value":"sectionVersions"},"arguments":[{"kind":"Argument","name":{"kind":"Name","value":"sectionId"},"value":{"kind":"Variable","name":{"kind":"Name","value":"sectionId"}}}],"selectionSet":{"kind":"SelectionSet","selections":[{"kind":"Field","name":{"kind":"Name","value":"id"}},{"kind":"Field","name":{"kind":"Name","value":"versionedQuestions"},"selectionSet":{"kind":"SelectionSet","selections":[{"kind":"Field","name":{"kind":"Name","value":"id"}},{"kind":"Field","name":{"kind":"Name","value":"questionText"}},{"kind":"Field","name":{"kind":"Name","value":"json"}},{"kind":"Field","name":{"kind":"Name","value":"questionId"}}]}},{"kind":"Field","name":{"kind":"Name","value":"section"},"selectionSet":{"kind":"SelectionSet","selections":[{"kind":"Field","name":{"kind":"Name","value":"id"}}]}}]}}]}}]} as unknown as DocumentNode<SectionVersionsQuery, SectionVersionsQueryVariables>;
export const SectionsDisplayOrderDocument = {"kind":"Document","definitions":[{"kind":"OperationDefinition","operation":"query","name":{"kind":"Name","value":"SectionsDisplayOrder"},"variableDefinitions":[{"kind":"VariableDefinition","variable":{"kind":"Variable","name":{"kind":"Name","value":"templateId"}},"type":{"kind":"NonNullType","type":{"kind":"NamedType","name":{"kind":"Name","value":"Int"}}}}],"selectionSet":{"kind":"SelectionSet","selections":[{"kind":"Field","name":{"kind":"Name","value":"sections"},"arguments":[{"kind":"Argument","name":{"kind":"Name","value":"templateId"},"value":{"kind":"Variable","name":{"kind":"Name","value":"templateId"}}}],"selectionSet":{"kind":"SelectionSet","selections":[{"kind":"Field","name":{"kind":"Name","value":"displayOrder"}}]}}]}}]} as unknown as DocumentNode<SectionsDisplayOrderQuery, SectionsDisplayOrderQueryVariables>;
export const PublishedSectionsDocument = {"kind":"Document","definitions":[{"kind":"OperationDefinition","operation":"query","name":{"kind":"Name","value":"PublishedSections"},"variableDefinitions":[{"kind":"VariableDefinition","variable":{"kind":"Variable","name":{"kind":"Name","value":"term"}},"type":{"kind":"NonNullType","type":{"kind":"NamedType","name":{"kind":"Name","value":"String"}}}},{"kind":"VariableDefinition","variable":{"kind":"Variable","name":{"kind":"Name","value":"paginationOptions"}},"type":{"kind":"NamedType","name":{"kind":"Name","value":"PaginationOptions"}}}],"selectionSet":{"kind":"SelectionSet","selections":[{"kind":"Field","name":{"kind":"Name","value":"publishedSections"},"arguments":[{"kind":"Argument","name":{"kind":"Name","value":"term"},"value":{"kind":"Variable","name":{"kind":"Name","value":"term"}}},{"kind":"Argument","name":{"kind":"Name","value":"paginationOptions"},"value":{"kind":"Variable","name":{"kind":"Name","value":"paginationOptions"}}}],"selectionSet":{"kind":"SelectionSet","selections":[{"kind":"Field","name":{"kind":"Name","value":"limit"}},{"kind":"Field","name":{"kind":"Name","value":"nextCursor"}},{"kind":"Field","name":{"kind":"Name","value":"totalCount"}},{"kind":"Field","name":{"kind":"Name","value":"availableSortFields"}},{"kind":"Field","name":{"kind":"Name","value":"currentOffset"}},{"kind":"Field","name":{"kind":"Name","value":"hasNextPage"}},{"kind":"Field","name":{"kind":"Name","value":"hasPreviousPage"}},{"kind":"Field","name":{"kind":"Name","value":"items"},"selectionSet":{"kind":"SelectionSet","selections":[{"kind":"Field","name":{"kind":"Name","value":"id"}},{"kind":"Field","name":{"kind":"Name","value":"name"}},{"kind":"Field","name":{"kind":"Name","value":"displayOrder"}},{"kind":"Field","name":{"kind":"Name","value":"bestPractice"}},{"kind":"Field","name":{"kind":"Name","value":"modified"}},{"kind":"Field","name":{"kind":"Name","value":"created"}},{"kind":"Field","name":{"kind":"Name","value":"versionedTemplateId"}},{"kind":"Field","name":{"kind":"Name","value":"versionedTemplateName"}},{"kind":"Field","name":{"kind":"Name","value":"versionedQuestionCount"}}]}}]}}]}}]} as unknown as DocumentNode<PublishedSectionsQuery, PublishedSectionsQueryVariables>;
export const PublishedSectionDocument = {"kind":"Document","definitions":[{"kind":"OperationDefinition","operation":"query","name":{"kind":"Name","value":"PublishedSection"},"variableDefinitions":[{"kind":"VariableDefinition","variable":{"kind":"Variable","name":{"kind":"Name","value":"versionedSectionId"}},"type":{"kind":"NonNullType","type":{"kind":"NamedType","name":{"kind":"Name","value":"Int"}}}}],"selectionSet":{"kind":"SelectionSet","selections":[{"kind":"Field","name":{"kind":"Name","value":"publishedSection"},"arguments":[{"kind":"Argument","name":{"kind":"Name","value":"versionedSectionId"},"value":{"kind":"Variable","name":{"kind":"Name","value":"versionedSectionId"}}}],"selectionSet":{"kind":"SelectionSet","selections":[{"kind":"Field","name":{"kind":"Name","value":"id"}},{"kind":"Field","name":{"kind":"Name","value":"introduction"}},{"kind":"Field","name":{"kind":"Name","value":"name"}},{"kind":"Field","name":{"kind":"Name","value":"requirements"}},{"kind":"Field","name":{"kind":"Name","value":"guidance"}},{"kind":"Field","name":{"kind":"Name","value":"displayOrder"}},{"kind":"Field","name":{"kind":"Name","value":"tags"},"selectionSet":{"kind":"SelectionSet","selections":[{"kind":"Field","name":{"kind":"Name","value":"id"}},{"kind":"Field","name":{"kind":"Name","value":"description"}},{"kind":"Field","name":{"kind":"Name","value":"name"}},{"kind":"Field","name":{"kind":"Name","value":"slug"}}]}},{"kind":"Field","name":{"kind":"Name","value":"errors"},"selectionSet":{"kind":"SelectionSet","selections":[{"kind":"Field","name":{"kind":"Name","value":"general"}},{"kind":"Field","name":{"kind":"Name","value":"name"}},{"kind":"Field","name":{"kind":"Name","value":"displayOrder"}}]}}]}}]}}]} as unknown as DocumentNode<PublishedSectionQuery, PublishedSectionQueryVariables>;
export const SectionDocument = {"kind":"Document","definitions":[{"kind":"OperationDefinition","operation":"query","name":{"kind":"Name","value":"Section"},"variableDefinitions":[{"kind":"VariableDefinition","variable":{"kind":"Variable","name":{"kind":"Name","value":"sectionId"}},"type":{"kind":"NonNullType","type":{"kind":"NamedType","name":{"kind":"Name","value":"Int"}}}}],"selectionSet":{"kind":"SelectionSet","selections":[{"kind":"Field","name":{"kind":"Name","value":"section"},"arguments":[{"kind":"Argument","name":{"kind":"Name","value":"sectionId"},"value":{"kind":"Variable","name":{"kind":"Name","value":"sectionId"}}}],"selectionSet":{"kind":"SelectionSet","selections":[{"kind":"Field","name":{"kind":"Name","value":"id"}},{"kind":"Field","name":{"kind":"Name","value":"introduction"}},{"kind":"Field","name":{"kind":"Name","value":"name"}},{"kind":"Field","name":{"kind":"Name","value":"requirements"}},{"kind":"Field","name":{"kind":"Name","value":"guidance"}},{"kind":"Field","name":{"kind":"Name","value":"displayOrder"}},{"kind":"Field","name":{"kind":"Name","value":"bestPractice"}},{"kind":"Field","name":{"kind":"Name","value":"isDirty"}},{"kind":"Field","name":{"kind":"Name","value":"questions"},"selectionSet":{"kind":"SelectionSet","selections":[{"kind":"Field","name":{"kind":"Name","value":"errors"},"selectionSet":{"kind":"SelectionSet","selections":[{"kind":"Field","name":{"kind":"Name","value":"general"}},{"kind":"Field","name":{"kind":"Name","value":"templateId"}},{"kind":"Field","name":{"kind":"Name","value":"sectionId"}},{"kind":"Field","name":{"kind":"Name","value":"questionText"}},{"kind":"Field","name":{"kind":"Name","value":"displayOrder"}}]}},{"kind":"Field","name":{"kind":"Name","value":"displayOrder"}},{"kind":"Field","name":{"kind":"Name","value":"guidanceText"}},{"kind":"Field","name":{"kind":"Name","value":"id"}},{"kind":"Field","name":{"kind":"Name","value":"questionText"}},{"kind":"Field","name":{"kind":"Name","value":"sectionId"}},{"kind":"Field","name":{"kind":"Name","value":"templateId"}}]}},{"kind":"Field","name":{"kind":"Name","value":"tags"},"selectionSet":{"kind":"SelectionSet","selections":[{"kind":"Field","name":{"kind":"Name","value":"id"}},{"kind":"Field","name":{"kind":"Name","value":"description"}},{"kind":"Field","name":{"kind":"Name","value":"name"}},{"kind":"Field","name":{"kind":"Name","value":"slug"}}]}},{"kind":"Field","name":{"kind":"Name","value":"errors"},"selectionSet":{"kind":"SelectionSet","selections":[{"kind":"Field","name":{"kind":"Name","value":"general"}},{"kind":"Field","name":{"kind":"Name","value":"name"}},{"kind":"Field","name":{"kind":"Name","value":"displayOrder"}}]}},{"kind":"Field","name":{"kind":"Name","value":"template"},"selectionSet":{"kind":"SelectionSet","selections":[{"kind":"Field","name":{"kind":"Name","value":"id"}},{"kind":"Field","name":{"kind":"Name","value":"bestPractice"}},{"kind":"Field","name":{"kind":"Name","value":"isDirty"}},{"kind":"Field","name":{"kind":"Name","value":"languageId"}},{"kind":"Field","name":{"kind":"Name","value":"name"}},{"kind":"Field","name":{"kind":"Name","value":"latestPublishVisibility"}}]}}]}}]}}]} as unknown as DocumentNode<SectionQuery, SectionQueryVariables>;
export const PublishedCustomSectionDocument = {"kind":"Document","definitions":[{"kind":"OperationDefinition","operation":"query","name":{"kind":"Name","value":"PublishedCustomSection"},"variableDefinitions":[{"kind":"VariableDefinition","variable":{"kind":"Variable","name":{"kind":"Name","value":"customSectionId"}},"type":{"kind":"NonNullType","type":{"kind":"NamedType","name":{"kind":"Name","value":"Int"}}}},{"kind":"VariableDefinition","variable":{"kind":"Variable","name":{"kind":"Name","value":"planId"}},"type":{"kind":"NonNullType","type":{"kind":"NamedType","name":{"kind":"Name","value":"Int"}}}}],"selectionSet":{"kind":"SelectionSet","selections":[{"kind":"Field","name":{"kind":"Name","value":"publishedCustomSection"},"arguments":[{"kind":"Argument","name":{"kind":"Name","value":"customSectionId"},"value":{"kind":"Variable","name":{"kind":"Name","value":"customSectionId"}}},{"kind":"Argument","name":{"kind":"Name","value":"planId"},"value":{"kind":"Variable","name":{"kind":"Name","value":"planId"}}}],"selectionSet":{"kind":"SelectionSet","selections":[{"kind":"Field","name":{"kind":"Name","value":"id"}},{"kind":"Field","name":{"kind":"Name","value":"guidance"}},{"kind":"Field","name":{"kind":"Name","value":"name"}},{"kind":"Field","name":{"kind":"Name","value":"introduction"}},{"kind":"Field","name":{"kind":"Name","value":"requirements"}},{"kind":"Field","name":{"kind":"Name","value":"pinnedVersionedSectionType"}},{"kind":"Field","name":{"kind":"Name","value":"pinnedVersionedSectionId"}},{"kind":"Field","name":{"kind":"Name","value":"errors"},"selectionSet":{"kind":"SelectionSet","selections":[{"kind":"Field","name":{"kind":"Name","value":"name"}},{"kind":"Field","name":{"kind":"Name","value":"general"}}]}}]}}]}}]} as unknown as DocumentNode<PublishedCustomSectionQuery, PublishedCustomSectionQueryVariables>;
export const TagsDocument = {"kind":"Document","definitions":[{"kind":"OperationDefinition","operation":"query","name":{"kind":"Name","value":"Tags"},"selectionSet":{"kind":"SelectionSet","selections":[{"kind":"Field","name":{"kind":"Name","value":"tags"},"selectionSet":{"kind":"SelectionSet","selections":[{"kind":"Field","name":{"kind":"Name","value":"id"}},{"kind":"Field","name":{"kind":"Name","value":"name"}},{"kind":"Field","name":{"kind":"Name","value":"description"}},{"kind":"Field","name":{"kind":"Name","value":"slug"}}]}}]}}]} as unknown as DocumentNode<TagsQuery, TagsQueryVariables>;
export const TemplateCustomizationOverviewDocument = {"kind":"Document","definitions":[{"kind":"OperationDefinition","operation":"query","name":{"kind":"Name","value":"TemplateCustomizationOverview"},"variableDefinitions":[{"kind":"VariableDefinition","variable":{"kind":"Variable","name":{"kind":"Name","value":"templateCustomizationId"}},"type":{"kind":"NonNullType","type":{"kind":"NamedType","name":{"kind":"Name","value":"Int"}}}}],"selectionSet":{"kind":"SelectionSet","selections":[{"kind":"Field","name":{"kind":"Name","value":"templateCustomizationOverview"},"arguments":[{"kind":"Argument","name":{"kind":"Name","value":"templateCustomizationId"},"value":{"kind":"Variable","name":{"kind":"Name","value":"templateCustomizationId"}}}],"selectionSet":{"kind":"SelectionSet","selections":[{"kind":"Field","name":{"kind":"Name","value":"customizationId"}},{"kind":"Field","name":{"kind":"Name","value":"customizationIsDirty"}},{"kind":"Field","name":{"kind":"Name","value":"customizationLastCustomized"}},{"kind":"Field","name":{"kind":"Name","value":"customizationLastCustomizedById"}},{"kind":"Field","name":{"kind":"Name","value":"customizationLastCustomizedByName"}},{"kind":"Field","name":{"kind":"Name","value":"customizationMigrationStatus"}},{"kind":"Field","name":{"kind":"Name","value":"customizationStatus"}},{"kind":"Field","name":{"kind":"Name","value":"customizationLastPublishedDate"}},{"kind":"Field","name":{"kind":"Name","value":"errors"},"selectionSet":{"kind":"SelectionSet","selections":[{"kind":"Field","name":{"kind":"Name","value":"general"}},{"kind":"Field","name":{"kind":"Name","value":"affiliationId"}},{"kind":"Field","name":{"kind":"Name","value":"currentVersionedTemplateId"}},{"kind":"Field","name":{"kind":"Name","value":"templateId"}}]}},{"kind":"Field","name":{"kind":"Name","value":"sections"},"selectionSet":{"kind":"SelectionSet","selections":[{"kind":"Field","name":{"kind":"Name","value":"id"}},{"kind":"Field","name":{"kind":"Name","value":"hasCustomGuidance"}},{"kind":"Field","name":{"kind":"Name","value":"displayOrder"}},{"kind":"Field","name":{"kind":"Name","value":"migrationStatus"}},{"kind":"Field","name":{"kind":"Name","value":"name"}},{"kind":"Field","name":{"kind":"Name","value":"sectionType"}},{"kind":"Field","name":{"kind":"Name","value":"questions"},"selectionSet":{"kind":"SelectionSet","selections":[{"kind":"Field","name":{"kind":"Name","value":"displayOrder"}},{"kind":"Field","name":{"kind":"Name","value":"questionText"}},{"kind":"Field","name":{"kind":"Name","value":"migrationStatus"}},{"kind":"Field","name":{"kind":"Name","value":"id"}},{"kind":"Field","name":{"kind":"Name","value":"hasCustomSampleAnswer"}},{"kind":"Field","name":{"kind":"Name","value":"hasCustomGuidance"}},{"kind":"Field","name":{"kind":"Name","value":"questionType"}}]}}]}},{"kind":"Field","name":{"kind":"Name","value":"versionedTemplateAffiliationId"}},{"kind":"Field","name":{"kind":"Name","value":"versionedTemplateAffiliationName"}},{"kind":"Field","name":{"kind":"Name","value":"versionedTemplateId"}},{"kind":"Field","name":{"kind":"Name","value":"versionedTemplateLastModified"}},{"kind":"Field","name":{"kind":"Name","value":"versionedTemplateName"}},{"kind":"Field","name":{"kind":"Name","value":"versionedTemplateVersion"}}]}}]}}]} as unknown as DocumentNode<TemplateCustomizationOverviewQuery, TemplateCustomizationOverviewQueryVariables>;
export const TemplateVersionsDocument = {"kind":"Document","definitions":[{"kind":"OperationDefinition","operation":"query","name":{"kind":"Name","value":"TemplateVersions"},"variableDefinitions":[{"kind":"VariableDefinition","variable":{"kind":"Variable","name":{"kind":"Name","value":"templateId"}},"type":{"kind":"NonNullType","type":{"kind":"NamedType","name":{"kind":"Name","value":"Int"}}}}],"selectionSet":{"kind":"SelectionSet","selections":[{"kind":"Field","name":{"kind":"Name","value":"templateVersions"},"arguments":[{"kind":"Argument","name":{"kind":"Name","value":"templateId"},"value":{"kind":"Variable","name":{"kind":"Name","value":"templateId"}}}],"selectionSet":{"kind":"SelectionSet","selections":[{"kind":"Field","name":{"kind":"Name","value":"name"}},{"kind":"Field","name":{"kind":"Name","value":"version"}},{"kind":"Field","name":{"kind":"Name","value":"versionType"}},{"kind":"Field","name":{"kind":"Name","value":"created"}},{"kind":"Field","name":{"kind":"Name","value":"comment"}},{"kind":"Field","name":{"kind":"Name","value":"id"}},{"kind":"Field","name":{"kind":"Name","value":"modified"}},{"kind":"Field","name":{"kind":"Name","value":"versionedBy"},"selectionSet":{"kind":"SelectionSet","selections":[{"kind":"Field","name":{"kind":"Name","value":"givenName"}},{"kind":"Field","name":{"kind":"Name","value":"surName"}},{"kind":"Field","name":{"kind":"Name","value":"affiliation"},"selectionSet":{"kind":"SelectionSet","selections":[{"kind":"Field","name":{"kind":"Name","value":"displayName"}}]}},{"kind":"Field","name":{"kind":"Name","value":"modified"}}]}}]}}]}}]} as unknown as DocumentNode<TemplateVersionsQuery, TemplateVersionsQueryVariables>;
export const MyVersionedTemplatesDocument = {"kind":"Document","definitions":[{"kind":"OperationDefinition","operation":"query","name":{"kind":"Name","value":"MyVersionedTemplates"},"selectionSet":{"kind":"SelectionSet","selections":[{"kind":"Field","name":{"kind":"Name","value":"myVersionedTemplates"},"selectionSet":{"kind":"SelectionSet","selections":[{"kind":"Field","name":{"kind":"Name","value":"id"}},{"kind":"Field","name":{"kind":"Name","value":"templateId"}},{"kind":"Field","name":{"kind":"Name","value":"name"}},{"kind":"Field","name":{"kind":"Name","value":"description"}},{"kind":"Field","name":{"kind":"Name","value":"visibility"}},{"kind":"Field","name":{"kind":"Name","value":"bestPractice"}},{"kind":"Field","name":{"kind":"Name","value":"version"}},{"kind":"Field","name":{"kind":"Name","value":"modified"}},{"kind":"Field","name":{"kind":"Name","value":"modifiedById"}},{"kind":"Field","name":{"kind":"Name","value":"modifiedByName"}},{"kind":"Field","name":{"kind":"Name","value":"ownerId"}},{"kind":"Field","name":{"kind":"Name","value":"ownerURI"}},{"kind":"Field","name":{"kind":"Name","value":"ownerDisplayName"}},{"kind":"Field","name":{"kind":"Name","value":"ownerSearchName"}}]}}]}}]} as unknown as DocumentNode<MyVersionedTemplatesQuery, MyVersionedTemplatesQueryVariables>;
export const PublishedTemplatesDocument = {"kind":"Document","definitions":[{"kind":"OperationDefinition","operation":"query","name":{"kind":"Name","value":"PublishedTemplates"},"variableDefinitions":[{"kind":"VariableDefinition","variable":{"kind":"Variable","name":{"kind":"Name","value":"paginationOptions"}},"type":{"kind":"NamedType","name":{"kind":"Name","value":"PaginationOptions"}}},{"kind":"VariableDefinition","variable":{"kind":"Variable","name":{"kind":"Name","value":"term"}},"type":{"kind":"NamedType","name":{"kind":"Name","value":"String"}}}],"selectionSet":{"kind":"SelectionSet","selections":[{"kind":"Field","name":{"kind":"Name","value":"publishedTemplates"},"arguments":[{"kind":"Argument","name":{"kind":"Name","value":"paginationOptions"},"value":{"kind":"Variable","name":{"kind":"Name","value":"paginationOptions"}}},{"kind":"Argument","name":{"kind":"Name","value":"term"},"value":{"kind":"Variable","name":{"kind":"Name","value":"term"}}}],"selectionSet":{"kind":"SelectionSet","selections":[{"kind":"Field","name":{"kind":"Name","value":"limit"}},{"kind":"Field","name":{"kind":"Name","value":"nextCursor"}},{"kind":"Field","name":{"kind":"Name","value":"totalCount"}},{"kind":"Field","name":{"kind":"Name","value":"availableSortFields"}},{"kind":"Field","name":{"kind":"Name","value":"currentOffset"}},{"kind":"Field","name":{"kind":"Name","value":"hasNextPage"}},{"kind":"Field","name":{"kind":"Name","value":"hasPreviousPage"}},{"kind":"Field","name":{"kind":"Name","value":"items"},"selectionSet":{"kind":"SelectionSet","selections":[{"kind":"Field","name":{"kind":"Name","value":"id"}},{"kind":"Field","name":{"kind":"Name","value":"templateId"}},{"kind":"Field","name":{"kind":"Name","value":"name"}},{"kind":"Field","name":{"kind":"Name","value":"description"}},{"kind":"Field","name":{"kind":"Name","value":"visibility"}},{"kind":"Field","name":{"kind":"Name","value":"bestPractice"}},{"kind":"Field","name":{"kind":"Name","value":"version"}},{"kind":"Field","name":{"kind":"Name","value":"modified"}},{"kind":"Field","name":{"kind":"Name","value":"modifiedById"}},{"kind":"Field","name":{"kind":"Name","value":"modifiedByName"}},{"kind":"Field","name":{"kind":"Name","value":"ownerId"}},{"kind":"Field","name":{"kind":"Name","value":"ownerURI"}},{"kind":"Field","name":{"kind":"Name","value":"ownerDisplayName"}},{"kind":"Field","name":{"kind":"Name","value":"ownerSearchName"}},{"kind":"Field","name":{"kind":"Name","value":"versionedTemplateCustomizationId"}}]}}]}}]}}]} as unknown as DocumentNode<PublishedTemplatesQuery, PublishedTemplatesQueryVariables>;
export const PublishedTemplatesMetaDataDocument = {"kind":"Document","definitions":[{"kind":"OperationDefinition","operation":"query","name":{"kind":"Name","value":"PublishedTemplatesMetaData"},"variableDefinitions":[{"kind":"VariableDefinition","variable":{"kind":"Variable","name":{"kind":"Name","value":"paginationOptions"}},"type":{"kind":"NamedType","name":{"kind":"Name","value":"PaginationOptions"}}},{"kind":"VariableDefinition","variable":{"kind":"Variable","name":{"kind":"Name","value":"term"}},"type":{"kind":"NamedType","name":{"kind":"Name","value":"String"}}}],"selectionSet":{"kind":"SelectionSet","selections":[{"kind":"Field","name":{"kind":"Name","value":"publishedTemplatesMetaData"},"arguments":[{"kind":"Argument","name":{"kind":"Name","value":"paginationOptions"},"value":{"kind":"Variable","name":{"kind":"Name","value":"paginationOptions"}}},{"kind":"Argument","name":{"kind":"Name","value":"term"},"value":{"kind":"Variable","name":{"kind":"Name","value":"term"}}}],"selectionSet":{"kind":"SelectionSet","selections":[{"kind":"Field","name":{"kind":"Name","value":"hasBestPracticeTemplates"}},{"kind":"Field","name":{"kind":"Name","value":"availableAffiliations"}}]}}]}}]} as unknown as DocumentNode<PublishedTemplatesMetaDataQuery, PublishedTemplatesMetaDataQueryVariables>;
export const CustomizableTemplatesDocument = {"kind":"Document","definitions":[{"kind":"OperationDefinition","operation":"query","name":{"kind":"Name","value":"CustomizableTemplates"},"variableDefinitions":[{"kind":"VariableDefinition","variable":{"kind":"Variable","name":{"kind":"Name","value":"term"}},"type":{"kind":"NamedType","name":{"kind":"Name","value":"String"}}},{"kind":"VariableDefinition","variable":{"kind":"Variable","name":{"kind":"Name","value":"paginationOptions"}},"type":{"kind":"NamedType","name":{"kind":"Name","value":"PaginationOptions"}}}],"selectionSet":{"kind":"SelectionSet","selections":[{"kind":"Field","name":{"kind":"Name","value":"customizableTemplates"},"arguments":[{"kind":"Argument","name":{"kind":"Name","value":"term"},"value":{"kind":"Variable","name":{"kind":"Name","value":"term"}}},{"kind":"Argument","name":{"kind":"Name","value":"paginationOptions"},"value":{"kind":"Variable","name":{"kind":"Name","value":"paginationOptions"}}}],"selectionSet":{"kind":"SelectionSet","selections":[{"kind":"Field","name":{"kind":"Name","value":"items"},"selectionSet":{"kind":"SelectionSet","selections":[{"kind":"Field","name":{"kind":"Name","value":"customizationId"}},{"kind":"Field","name":{"kind":"Name","value":"customizationIsDirty"}},{"kind":"Field","name":{"kind":"Name","value":"customizationLastCustomized"}},{"kind":"Field","name":{"kind":"Name","value":"customizationLastCustomizedById"}},{"kind":"Field","name":{"kind":"Name","value":"customizationMigrationStatus"}},{"kind":"Field","name":{"kind":"Name","value":"customizationLastCustomizedByName"}},{"kind":"Field","name":{"kind":"Name","value":"versionedTemplateDescription"}},{"kind":"Field","name":{"kind":"Name","value":"versionedTemplateAffiliationId"}},{"kind":"Field","name":{"kind":"Name","value":"versionedTemplateAffiliationName"}},{"kind":"Field","name":{"kind":"Name","value":"versionedTemplateId"}},{"kind":"Field","name":{"kind":"Name","value":"versionedTemplateName"}},{"kind":"Field","name":{"kind":"Name","value":"versionedTemplateVersion"}},{"kind":"Field","name":{"kind":"Name","value":"versionedTemplateBestPractice"}},{"kind":"Field","name":{"kind":"Name","value":"customizationStatus"}},{"kind":"Field","name":{"kind":"Name","value":"versionedTemplateLastModified"}}]}},{"kind":"Field","name":{"kind":"Name","value":"nextCursor"}},{"kind":"Field","name":{"kind":"Name","value":"totalCount"}},{"kind":"Field","name":{"kind":"Name","value":"limit"}}]}}]}}]} as unknown as DocumentNode<CustomizableTemplatesQuery, CustomizableTemplatesQueryVariables>;
export const TemplatesDocument = {"kind":"Document","definitions":[{"kind":"OperationDefinition","operation":"query","name":{"kind":"Name","value":"Templates"},"variableDefinitions":[{"kind":"VariableDefinition","variable":{"kind":"Variable","name":{"kind":"Name","value":"term"}},"type":{"kind":"NamedType","name":{"kind":"Name","value":"String"}}},{"kind":"VariableDefinition","variable":{"kind":"Variable","name":{"kind":"Name","value":"paginationOptions"}},"type":{"kind":"NamedType","name":{"kind":"Name","value":"PaginationOptions"}}}],"selectionSet":{"kind":"SelectionSet","selections":[{"kind":"Field","name":{"kind":"Name","value":"myTemplates"},"arguments":[{"kind":"Argument","name":{"kind":"Name","value":"term"},"value":{"kind":"Variable","name":{"kind":"Name","value":"term"}}},{"kind":"Argument","name":{"kind":"Name","value":"paginationOptions"},"value":{"kind":"Variable","name":{"kind":"Name","value":"paginationOptions"}}}],"selectionSet":{"kind":"SelectionSet","selections":[{"kind":"Field","name":{"kind":"Name","value":"totalCount"}},{"kind":"Field","name":{"kind":"Name","value":"nextCursor"}},{"kind":"Field","name":{"kind":"Name","value":"limit"}},{"kind":"Field","name":{"kind":"Name","value":"availableSortFields"}},{"kind":"Field","name":{"kind":"Name","value":"currentOffset"}},{"kind":"Field","name":{"kind":"Name","value":"hasNextPage"}},{"kind":"Field","name":{"kind":"Name","value":"hasPreviousPage"}},{"kind":"Field","name":{"kind":"Name","value":"items"},"selectionSet":{"kind":"SelectionSet","selections":[{"kind":"Field","name":{"kind":"Name","value":"id"}},{"kind":"Field","name":{"kind":"Name","value":"name"}},{"kind":"Field","name":{"kind":"Name","value":"description"}},{"kind":"Field","name":{"kind":"Name","value":"latestPublishVisibility"}},{"kind":"Field","name":{"kind":"Name","value":"isDirty"}},{"kind":"Field","name":{"kind":"Name","value":"latestPublishVersion"}},{"kind":"Field","name":{"kind":"Name","value":"latestPublishDate"}},{"kind":"Field","name":{"kind":"Name","value":"ownerId"}},{"kind":"Field","name":{"kind":"Name","value":"ownerDisplayName"}},{"kind":"Field","name":{"kind":"Name","value":"modified"}},{"kind":"Field","name":{"kind":"Name","value":"modifiedById"}},{"kind":"Field","name":{"kind":"Name","value":"modifiedByName"}},{"kind":"Field","name":{"kind":"Name","value":"bestPractice"}}]}}]}}]}}]} as unknown as DocumentNode<TemplatesQuery, TemplatesQueryVariables>;
export const TemplateDocument = {"kind":"Document","definitions":[{"kind":"OperationDefinition","operation":"query","name":{"kind":"Name","value":"Template"},"variableDefinitions":[{"kind":"VariableDefinition","variable":{"kind":"Variable","name":{"kind":"Name","value":"templateId"}},"type":{"kind":"NonNullType","type":{"kind":"NamedType","name":{"kind":"Name","value":"Int"}}}}],"selectionSet":{"kind":"SelectionSet","selections":[{"kind":"Field","name":{"kind":"Name","value":"template"},"arguments":[{"kind":"Argument","name":{"kind":"Name","value":"templateId"},"value":{"kind":"Variable","name":{"kind":"Name","value":"templateId"}}}],"selectionSet":{"kind":"SelectionSet","selections":[{"kind":"Field","name":{"kind":"Name","value":"id"}},{"kind":"Field","name":{"kind":"Name","value":"name"}},{"kind":"Field","name":{"kind":"Name","value":"description"}},{"kind":"Field","name":{"kind":"Name","value":"errors"},"selectionSet":{"kind":"SelectionSet","selections":[{"kind":"Field","name":{"kind":"Name","value":"general"}},{"kind":"Field","name":{"kind":"Name","value":"name"}},{"kind":"Field","name":{"kind":"Name","value":"ownerId"}}]}},{"kind":"Field","name":{"kind":"Name","value":"latestPublishVersion"}},{"kind":"Field","name":{"kind":"Name","value":"latestPublishDate"}},{"kind":"Field","name":{"kind":"Name","value":"created"}},{"kind":"Field","name":{"kind":"Name","value":"sections"},"selectionSet":{"kind":"SelectionSet","selections":[{"kind":"Field","name":{"kind":"Name","value":"id"}},{"kind":"Field","name":{"kind":"Name","value":"name"}},{"kind":"Field","name":{"kind":"Name","value":"bestPractice"}},{"kind":"Field","name":{"kind":"Name","value":"displayOrder"}},{"kind":"Field","name":{"kind":"Name","value":"isDirty"}},{"kind":"Field","name":{"kind":"Name","value":"questions"},"selectionSet":{"kind":"SelectionSet","selections":[{"kind":"Field","name":{"kind":"Name","value":"errors"},"selectionSet":{"kind":"SelectionSet","selections":[{"kind":"Field","name":{"kind":"Name","value":"general"}},{"kind":"Field","name":{"kind":"Name","value":"templateId"}},{"kind":"Field","name":{"kind":"Name","value":"sectionId"}},{"kind":"Field","name":{"kind":"Name","value":"questionText"}},{"kind":"Field","name":{"kind":"Name","value":"displayOrder"}}]}},{"kind":"Field","name":{"kind":"Name","value":"displayOrder"}},{"kind":"Field","name":{"kind":"Name","value":"guidanceText"}},{"kind":"Field","name":{"kind":"Name","value":"id"}},{"kind":"Field","name":{"kind":"Name","value":"questionText"}},{"kind":"Field","name":{"kind":"Name","value":"sectionId"}},{"kind":"Field","name":{"kind":"Name","value":"templateId"}}]}}]}},{"kind":"Field","name":{"kind":"Name","value":"owner"},"selectionSet":{"kind":"SelectionSet","selections":[{"kind":"Field","name":{"kind":"Name","value":"displayName"}},{"kind":"Field","name":{"kind":"Name","value":"id"}}]}},{"kind":"Field","name":{"kind":"Name","value":"latestPublishVisibility"}},{"kind":"Field","name":{"kind":"Name","value":"bestPractice"}},{"kind":"Field","name":{"kind":"Name","value":"isDirty"}}]}}]}}]} as unknown as DocumentNode<TemplateQuery, TemplateQueryVariables>;
export const TemplateCollaboratorsDocument = {"kind":"Document","definitions":[{"kind":"OperationDefinition","operation":"query","name":{"kind":"Name","value":"TemplateCollaborators"},"variableDefinitions":[{"kind":"VariableDefinition","variable":{"kind":"Variable","name":{"kind":"Name","value":"templateId"}},"type":{"kind":"NonNullType","type":{"kind":"NamedType","name":{"kind":"Name","value":"Int"}}}}],"selectionSet":{"kind":"SelectionSet","selections":[{"kind":"Field","name":{"kind":"Name","value":"template"},"arguments":[{"kind":"Argument","name":{"kind":"Name","value":"templateId"},"value":{"kind":"Variable","name":{"kind":"Name","value":"templateId"}}}],"selectionSet":{"kind":"SelectionSet","selections":[{"kind":"Field","name":{"kind":"Name","value":"id"}},{"kind":"Field","name":{"kind":"Name","value":"name"}},{"kind":"Field","name":{"kind":"Name","value":"collaborators"},"selectionSet":{"kind":"SelectionSet","selections":[{"kind":"Field","name":{"kind":"Name","value":"email"}},{"kind":"Field","name":{"kind":"Name","value":"id"}},{"kind":"Field","name":{"kind":"Name","value":"user"},"selectionSet":{"kind":"SelectionSet","selections":[{"kind":"Field","name":{"kind":"Name","value":"id"}},{"kind":"Field","name":{"kind":"Name","value":"email"}},{"kind":"Field","name":{"kind":"Name","value":"givenName"}},{"kind":"Field","name":{"kind":"Name","value":"surName"}}]}}]}},{"kind":"Field","name":{"kind":"Name","value":"admins"},"selectionSet":{"kind":"SelectionSet","selections":[{"kind":"Field","name":{"kind":"Name","value":"givenName"}},{"kind":"Field","name":{"kind":"Name","value":"surName"}},{"kind":"Field","name":{"kind":"Name","value":"email"}}]}},{"kind":"Field","name":{"kind":"Name","value":"owner"},"selectionSet":{"kind":"SelectionSet","selections":[{"kind":"Field","name":{"kind":"Name","value":"name"}}]}}]}}]}}]} as unknown as DocumentNode<TemplateCollaboratorsQuery, TemplateCollaboratorsQueryVariables>;
export const MeDocument = {"kind":"Document","definitions":[{"kind":"OperationDefinition","operation":"query","name":{"kind":"Name","value":"Me"},"selectionSet":{"kind":"SelectionSet","selections":[{"kind":"Field","name":{"kind":"Name","value":"me"},"selectionSet":{"kind":"SelectionSet","selections":[{"kind":"Field","name":{"kind":"Name","value":"id"}},{"kind":"Field","name":{"kind":"Name","value":"givenName"}},{"kind":"Field","name":{"kind":"Name","value":"surName"}},{"kind":"Field","name":{"kind":"Name","value":"languageId"}},{"kind":"Field","name":{"kind":"Name","value":"role"}},{"kind":"Field","name":{"kind":"Name","value":"emails"},"selectionSet":{"kind":"SelectionSet","selections":[{"kind":"Field","name":{"kind":"Name","value":"id"}},{"kind":"Field","name":{"kind":"Name","value":"email"}},{"kind":"Field","name":{"kind":"Name","value":"isPrimary"}},{"kind":"Field","name":{"kind":"Name","value":"isConfirmed"}}]}},{"kind":"Field","name":{"kind":"Name","value":"errors"},"selectionSet":{"kind":"SelectionSet","selections":[{"kind":"Field","name":{"kind":"Name","value":"general"}},{"kind":"Field","name":{"kind":"Name","value":"email"}},{"kind":"Field","name":{"kind":"Name","value":"password"}},{"kind":"Field","name":{"kind":"Name","value":"role"}}]}},{"kind":"Field","name":{"kind":"Name","value":"affiliation"},"selectionSet":{"kind":"SelectionSet","selections":[{"kind":"Field","name":{"kind":"Name","value":"id"}},{"kind":"Field","name":{"kind":"Name","value":"name"}},{"kind":"Field","name":{"kind":"Name","value":"displayName"}},{"kind":"Field","name":{"kind":"Name","value":"searchName"}},{"kind":"Field","name":{"kind":"Name","value":"uri"}},{"kind":"Field","name":{"kind":"Name","value":"acronyms"}},{"kind":"Field","name":{"kind":"Name","value":"feedbackEmails"}},{"kind":"Field","name":{"kind":"Name","value":"feedbackEnabled"}},{"kind":"Field","name":{"kind":"Name","value":"feedbackMessage"}}]}}]}}]}}]} as unknown as DocumentNode<MeQuery, MeQueryVariables>;
export const BestPracticeGuidanceDocument = {"kind":"Document","definitions":[{"kind":"OperationDefinition","operation":"query","name":{"kind":"Name","value":"BestPracticeGuidance"},"variableDefinitions":[{"kind":"VariableDefinition","variable":{"kind":"Variable","name":{"kind":"Name","value":"tagIds"}},"type":{"kind":"NonNullType","type":{"kind":"ListType","type":{"kind":"NonNullType","type":{"kind":"NamedType","name":{"kind":"Name","value":"Int"}}}}}}],"selectionSet":{"kind":"SelectionSet","selections":[{"kind":"Field","name":{"kind":"Name","value":"bestPracticeGuidance"},"arguments":[{"kind":"Argument","name":{"kind":"Name","value":"tagIds"},"value":{"kind":"Variable","name":{"kind":"Name","value":"tagIds"}}}],"selectionSet":{"kind":"SelectionSet","selections":[{"kind":"Field","name":{"kind":"Name","value":"id"}},{"kind":"Field","name":{"kind":"Name","value":"guidanceText"}},{"kind":"Field","name":{"kind":"Name","value":"guidanceId"}},{"kind":"Field","name":{"kind":"Name","value":"guidance"},"selectionSet":{"kind":"SelectionSet","selections":[{"kind":"Field","name":{"kind":"Name","value":"guidanceText"}}]}},{"kind":"Field","name":{"kind":"Name","value":"tagId"}},{"kind":"Field","name":{"kind":"Name","value":"errors"},"selectionSet":{"kind":"SelectionSet","selections":[{"kind":"Field","name":{"kind":"Name","value":"guidanceId"}},{"kind":"Field","name":{"kind":"Name","value":"general"}},{"kind":"Field","name":{"kind":"Name","value":"guidanceText"}},{"kind":"Field","name":{"kind":"Name","value":"versionedGuidanceGroupId"}},{"kind":"Field","name":{"kind":"Name","value":"tagId"}}]}}]}}]}}]} as unknown as DocumentNode<BestPracticeGuidanceQuery, BestPracticeGuidanceQueryVariables>;
export const VersionedGuidanceDocument = {"kind":"Document","definitions":[{"kind":"OperationDefinition","operation":"query","name":{"kind":"Name","value":"VersionedGuidance"},"variableDefinitions":[{"kind":"VariableDefinition","variable":{"kind":"Variable","name":{"kind":"Name","value":"affiliationId"}},"type":{"kind":"NonNullType","type":{"kind":"NamedType","name":{"kind":"Name","value":"String"}}}},{"kind":"VariableDefinition","variable":{"kind":"Variable","name":{"kind":"Name","value":"tagIds"}},"type":{"kind":"NonNullType","type":{"kind":"ListType","type":{"kind":"NonNullType","type":{"kind":"NamedType","name":{"kind":"Name","value":"Int"}}}}}}],"selectionSet":{"kind":"SelectionSet","selections":[{"kind":"Field","name":{"kind":"Name","value":"versionedGuidance"},"arguments":[{"kind":"Argument","name":{"kind":"Name","value":"affiliationId"},"value":{"kind":"Variable","name":{"kind":"Name","value":"affiliationId"}}},{"kind":"Argument","name":{"kind":"Name","value":"tagIds"},"value":{"kind":"Variable","name":{"kind":"Name","value":"tagIds"}}}],"selectionSet":{"kind":"SelectionSet","selections":[{"kind":"Field","name":{"kind":"Name","value":"tagId"}},{"kind":"Field","name":{"kind":"Name","value":"id"}},{"kind":"Field","name":{"kind":"Name","value":"guidanceText"}},{"kind":"Field","name":{"kind":"Name","value":"errors"},"selectionSet":{"kind":"SelectionSet","selections":[{"kind":"Field","name":{"kind":"Name","value":"general"}},{"kind":"Field","name":{"kind":"Name","value":"guidanceId"}},{"kind":"Field","name":{"kind":"Name","value":"guidanceText"}},{"kind":"Field","name":{"kind":"Name","value":"tagId"}},{"kind":"Field","name":{"kind":"Name","value":"versionedGuidanceGroupId"}}]}}]}}]}}]} as unknown as DocumentNode<VersionedGuidanceQuery, VersionedGuidanceQueryVariables>;