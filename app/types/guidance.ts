import { TagsInterface } from "@/app/types";
import { AffiliationSearch, GuidanceSourceType } from "@/generated/graphql";

export enum GuidanceGroupStatus {
  DRAFT = 'draft',
  PUBLISHED = 'published',
  UNPUBLISHED_CHANGES = 'unpublishedChanges'
}

export interface GuidanceTag {
  id: number;
  name: string;
}

export type UpdateGuidanceTextErrors = {
  general?: string;
  guidanceGroupId?: string;
  guidanceText?: string;
  tagId?: string;
};

export type AddGuidanceTextErrors = {
  general?: string;
  guidanceGroupId?: string;
  guidanceText?: string;
  tagId?: string;
};

export type PublishGuidanceGroupErrors = {
  general?: string;
  affiliationId?: string;
  bestPractice?: string;
  name?: string;
  description?: string;
};

export interface GuidanceText {
  id: string;
  guidanceText: string;
  lastUpdated: string;
  lastUpdatedBy: string;
  url: string;
  tagId: number;
}

export interface TagGuidanceItem {
  tag: TagsInterface;
  guidance: GuidanceText | null;
}

export interface GuidanceGroup {
  guidanceGroupId: number;
  name: string;
  description: string;
  optionalSubset: boolean;
  bestPractice?: boolean;
  status: GuidanceGroupStatus;
  lastPublishedDate: string;
}

export interface AddGuidanceResponse {
  success: boolean;
  data?: {
    id: number;
    errors?: Record<string, string>;
    guidanceText: string;
  }
  errors?: string[];
  redirect?: string;
}

export interface GuidanceItemInterface {
  orgURI: string;
  orgName: string;
  orgShortname?: string;
  items: { id?: number; title?: string; guidanceText: string; }[];
  type: GuidanceSourceType
}
export interface MatchedGuidance {
  id?: number;
  title?: string;
  guidanceText: string;
}

export interface GuidanceSource {
  id: string;
  type: 'bestPractice' | 'funder' | 'organization';
  label: string;
  shortName?: string | null;
  content?: string;
  items?: MatchedGuidance[];
  orgURI?: string;
}

export interface GuidancePanelProps {
  // User's organization affiliation URI
  userAffiliationId?: string;
  // Template owner's affiliation URI
  ownerAffiliationId?: string;
  // Versioned template ID for filtering guidance
  versionedTemplateId: number;
  // Organization guidance
  guidanceItems: GuidanceItemInterface[];
  // Tags assigned to the current section
  sectionTags: Record<number, string>;
  // Guidance errors
  guidanceError?: string | null;
  // Callbacks
  onClearError?: () => void;
  onAddOrganization?: (funder: AffiliationSearch) => void;
  onRemoveOrganization?: (orgId: string) => void;
  // Disable link to customize guidance tabs when user cannot edit sections
  linkDisabled?: boolean;
}

export interface VersionedGuidanceGroup {
  guidanceText: string | null;
  id: number | null;
  tagId: number | null;
  errors?: Record<string, string>;
};

export interface VersionedGuidanceQuery {
  versionedGuidance: VersionedGuidanceGroup[];
};

