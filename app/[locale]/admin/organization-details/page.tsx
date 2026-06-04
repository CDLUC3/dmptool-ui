'use client'

import React, { useEffect, useMemo, useRef, useState } from "react";
import PageHeader from '@/components/PageHeader';
import {
  ContentContainer,
  LayoutWithPanel,
  SidebarPanel,
} from '@/components/Container';
import { FormInput } from '@/components/Form';
import { Breadcrumb, Breadcrumbs, Button, DropZone, FileTrigger, Link } from "react-aria-components";

import { useTranslations } from 'next-intl';
import styles from './organizationDetails.module.scss';
import { useScrollToTop } from "@/hooks/scrollToTop";
import { useMutation, useQuery } from "@apollo/client/react";
import {
  AffiliationByIdDocument,
  FinalizeLogoUploadDocument,
  GenerateLogoUploadUrlDocument,
  MeDocument,
  UpdateAffiliationDocument
} from "@/generated/graphql";
import { useParams, useRouter } from "next/navigation";
import { routePath } from "@/utils/routes";
import Loading from "@/components/Loading";

interface OrganizationLink {
  id: number;
  url: string;
  text: string;
}

interface OrganizationEmailDomain {
  id: number;
  domain: string;
}

interface OrganizationSSODetails {
  ssoEntityId: string;
  ssoEmailDomains: OrganizationEmailDomain[];
}

interface OrganizationDetails {
  id?: number | null;
  uri: string;
  provenance: string;
  active: boolean;
  managed: boolean;
  funder: boolean;
  officialName: string;
  displayName: string;
  types?: string[] | null;
  contactName?: string | null;
  contactEmail?: string | null;
  logoName?: string | null;
  logoURI?: string | null;
  fundrefId?: string | null;
  rorId?: string | null;
  apiTarget?: string | null;
}

const OrganizationDetailsPage: React.FC = () => {
  const params = useParams();
  const organizationId = String(params.projectId); // From route /projects/:projectId
  const router = useRouter();

  const errorRef = useRef<HTMLDivElement | null>(null);
  const topRef = useRef<HTMLDivElement>(null);
  const { scrollToTop } = useScrollToTop();

  const [errors, setErrors] = useState<string[]>([]);
  const [organization, setOrganization] = useState<OrganizationDetails>({
    id: 0,
    uri: "",
    provenance: "",
    active: true,
    managed: false,
    funder: false,
    officialName: "",
    displayName: "",
    types: [],
    contactName: "",
    contactEmail: "",
    logoName: "",
    logoURI: "",
    fundrefId: "",
    rorId: "",
    apiTarget: "",
  });

  // Organization links
  const [organizationUrls, setOrganizationUrls] = useState<OrganizationLink[]>([
    {
      id: 0,
      url: "",
      text: "",
    },
  ]);

  // SSO details
  const [organizationSSODetails, setOrganizationSSODetails] = useState<OrganizationSSODetails>({
    ssoEntityId: "",
    ssoEmailDomains: [
      {
        id: 0,
        domain: "",
      },
    ],
  });

  // Logo Upload
  const [fileName, setFileName] = useState<string>("");
  const [showUpload, setShowUpload] = useState(false);

  // Translation keys
  const Global = useTranslations("Global");

  // Run me query to get user's info to determine if they are a SuperAdmin
  const { data: meData } = useQuery(MeDocument);

  const isSuperAdmin: boolean = useMemo((): boolean => {
    return meData?.me?.role === "SUPERADMIN"
  }, [meData?.me?.role]);

  const orgId: number | null | undefined = useMemo(() => {
    return meData?.me?.affiliation?.id;
  }, [meData?.me?.affiliation?.id]);

  // Initialize GraphQL queries and mutations
  const { data, loading, error } = useQuery(AffiliationByIdDocument, {
    variables: { affiliationId: Number() },
    notifyOnNetworkStatusChange: true,
    skip: !orgId,
  });
  const [updateAffiliationMutation, { loading: updateAffiliationLoading }] = useMutation(UpdateAffiliationDocument);
  const [generatePresignedURLMutation, { loading: generatePresignedURLLoading }] = useMutation(GenerateLogoUploadUrlDocument);
  const [finalizeLogoUploadMutation, { loading: finalizeLogoUploadLoading }] = useMutation(FinalizeLogoUploadDocument);

  const handleAddUrl = () => {
    if (organizationUrls.length < 5) {
      const newId: number = organizationUrls.length + 1;
      setOrganizationUrls([...organizationUrls, { id: newId, url: "", text: "" }]);
    }
  };

  const handleRemoveUrl = (id: number) => {
    if (organizationUrls.length > 1) {
      setOrganizationUrls(organizationUrls.filter((url) => url.id !== id));
    }
  };

  const handleUrlChange = (id: number, field: "url" | "text", value: string) => {
    setOrganizationUrls(organizationUrls.map((url) => {
      return (url.id === id ? { ...url, [field]: value } : url);
    }));
  };

  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const handleDrop = (e: any) => {
    // Stubbed out - just set the filename
    // TODO: Properly type this when implementing actual file handling
    if (e.files && e.files.length > 0) {
      setFileName(e.files[0].name);
    }
  };

  const handleFileSelect = (file: File) => {
    // Stubbed out - just set the filename
    setFileName(file.name);
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    console.log("handleSubmit");
  };

  useEffect(() => {
    // When data from backend changes, set organization data in state
    if (data && data.affiliationById) {
      setOrganization({
        id: data.affiliationById.id,
        uri: data.affiliationById.uri,
        provenance: data.affiliationById.provenance,
        active: data.affiliationById.active,
        managed: data.affiliationById.managed,
        funder: data.affiliationById.funder,
        officialName: data.affiliationById.name,
        displayName: data.affiliationById.displayName,
        types: data.affiliationById.types,
        contactName: data.affiliationById.contactName,
        contactEmail: data.affiliationById.contactEmail,
        logoName: data.affiliationById.logoName,
        logoURI: data.affiliationById.logoURI,
        fundrefId: data.affiliationById.fundrefId,
        rorId: data.affiliationById.provenance === "ROR" ? data.affiliationById.uri : undefined,
        apiTarget: data.affiliationById.apiTarget,
      });
    }
  });

  if (loading) {
    return (
      <Loading
        variant="page"
        message={Global("messaging.loading")}
      />
    );
  }

  if (error) {
    if (error.message.toLowerCase() === "forbidden") {
      router.push("/not-found");
    } else {
      return <div>{error.message}</div>;
    }
  }

  return (
    <>
      <PageHeader
        title={Global("OrganizationDetails.title")}
        description={Global("OrganizationDetails.description")}
        showBackButton={true}
        breadcrumbs={
          <Breadcrumbs aria-label={Global("navigation")}>
            <Breadcrumb>
              <Link href={routePath("app.home")}>{Global("breadcrumbs.home")}</Link>
            </Breadcrumb>
            <Breadcrumb>{Global("OrganizationDetails.title")}</Breadcrumb>
          </Breadcrumbs>
        }
        actions={null}
        className="page-organization-details-header"
      />

      <LayoutWithPanel className={"page-organization-details"}>
        <ContentContainer>
          <form onSubmit={handleSubmit}>
            {/* Edit organization details section */}
            <div className={styles.sectionHeader}>
              <h2>{Global("OrganizationDetails.sections.organizationDetails.title")}</h2>
            </div>
            <div className={styles.sectionContainer}>
              <div className={styles.sectionContent}>
                <FormInput
                  name="organizationName"
                  label={Global("OrganizationDetails.fields.organizationName.label")}
                  placeholder={Global("OrganizationDetails.fields.organizationName.placeholder")}
                  isRequired={true}
                />
                <FormInput
                  name="organizationAbbr"
                  label={Global("OrganizationDetails.fields.organizationAbbr.label")}
                  placeholder={Global("OrganizationDetails.fields.organizationAbbr.placeholder")}
                  isRequired={true}
                />
                <div className={styles.organizationTypeRow}>
                  <div
                    className={styles.label}
                    id="organization-type-label"
                  >
                    {Global("OrganizationDetails.fields.organizationType.label")}
                  </div>
                  <div className={styles.content}>
                    <span
                      className={"mr-3"}
                      aria-labelledby="organization-type-label"
                    >
                      Institution
                    </span>
                    <Link
                      href="/contact"
                      className={`react-aria-Link ${styles.requestChangeLink}`}
                    >
                      {Global("OrganizationDetails.actions.requestChange")}
                    </Link>
                  </div>
                </div>
              </div>
            </div>

            {/* Administrator contact section */}
            <div className={styles.sectionHeader}>
              <h2>{Global("OrganizationDetails.sections.administratorContact.title")}</h2>
            </div>
            <div className={styles.sectionContainer}>
              <div className={styles.sectionContent}>
                <FormInput
                  name="contactEmail"
                  label={Global("OrganizationDetails.fields.contactEmail.label")}
                  type="email"
                  placeholder={Global("OrganizationDetails.fields.contactEmail.placeholder")}
                  isRequired={true}
                />

                <FormInput
                  name="linkText"
                  label={Global("OrganizationDetails.fields.linkText.label")}
                  placeholder={Global("OrganizationDetails.fields.linkText.placeholder")}
                  isRequired={true}
                />
              </div>
            </div>

            {/* Branding section */}
            <div className={styles.sectionHeader}>
              <h2>{Global("OrganizationDetails.sections.branding.title")}</h2>
            </div>
            <div className={styles.sectionContainer}>
              <div className={styles.sectionContent}>
                <div className={styles.logoSection}>
                  <div className={styles.logoRow}>
                    <div className={styles.logoUpload}>
                      <div className={styles.uploadArea}>
                        <DropZone
                          onDrop={handleDrop}
                          aria-label={Global("OrganizationDetails.upload.dropZone.ariaLabel")}
                          className={styles.dropZone}
                        >
                          <div className={styles.dropZoneContent}>
                            <div className={styles.uploadIcon}>
                              <svg
                                width="48"
                                height="48"
                                viewBox="0 0 24 24"
                                fill="none"
                                xmlns="http://www.w3.org/2000/svg"
                              >
                                <path
                                  d="M12 16L12 8M12 8L15 11M12 8L9 11"
                                  stroke="currentColor"
                                  strokeWidth="2"
                                  strokeLinecap="round"
                                  strokeLinejoin="round"
                                />
                                <path
                                  d="M3 15V16C3 18.8284 3 20.2426 3.87868 21.1213C4.75736 22 6.17157 22 9 22H15C17.8284 22 19.2426 22 20.1213 21.1213C21 20.2426 21 18.8284 21 16V15"
                                  stroke="currentColor"
                                  strokeWidth="2"
                                  strokeLinecap="round"
                                  strokeLinejoin="round"
                                />
                              </svg>
                            </div>
                            <div className={styles.uploadText}>
                              <h3>{Global("OrganizationDetails.upload.title")}</h3>
                              <p>{Global("OrganizationDetails.upload.description")}</p>
                              <p className={styles.fileTypes}>{Global("OrganizationDetails.upload.fileTypes")}</p>
                            </div>
                            <FileTrigger
                              allowsMultiple={false}
                              onSelect={(files) => {
                                if (files && files[0]) {
                                  const selectedFile = files[0];
                                  handleFileSelect(selectedFile);
                                }
                              }}
                            >
                              <Button className={styles.browseButton}>
                                {Global("OrganizationDetails.upload.browseButton")}
                              </Button>
                            </FileTrigger>
                          </div>
                        </DropZone>
                      </div>
                    </div>
                  </div>
                </div>
              </div>
            </div>

            {/* Organization URLs section */}
            <div className={styles.sectionHeader}>
              <h2>{Global("OrganizationDetails.sections.organizationUrls.title")}</h2>
            </div>
            <div className={styles.sectionContainer}>
              <div className={styles.sectionContent}>
                <p className={styles.urlDescription}>
                  {Global("OrganizationDetails.sections.organizationUrls.description")}
                </p>

                {organizationUrls.map((urlItem, _index) => (
                  <div
                    key={urlItem.id}
                    className={styles.urlItem}
                  >
                    <div className={styles.urlHeader}>
                      {organizationUrls.length > 1 && (
                        <button
                          onClick={() => handleRemoveUrl(urlItem.id)}
                          className={styles.removeUrlLink}
                          type="button"
                          aria-label={`${Global("OrganizationDetails.actions.removeUrl")} ${urlItem.text || Global("OrganizationDetails.fields.url.label")} ${urlItem.id}`}
                        >
                          {Global("OrganizationDetails.actions.removeUrl")}
                        </button>
                      )}
                    </div>
                    <div className={styles.urlFields}>
                      <FormInput
                        name={`url_${urlItem.id}`}
                        label={Global("OrganizationDetails.fields.url.label")}
                        placeholder={Global("OrganizationDetails.fields.url.placeholder")}
                        value={urlItem.url}
                        onChange={(e) => handleUrlChange(urlItem.id, "url", e.target.value)}
                      />
                      <FormInput
                        name={`label_${urlItem.id}`}
                        label={Global("OrganizationDetails.fields.urlLinkText.label")}
                        placeholder={Global("OrganizationDetails.fields.urlLinkText.placeholder")}
                        value={urlItem.text}
                        onChange={(e) => handleUrlChange(urlItem.id, "text", e.target.value)}
                      />
                    </div>
                  </div>
                ))}

                {organizationUrls.length < 5 && (
                  <Button
                    onPress={handleAddUrl}
                    className="react-aria-Button react-aria-Button--secondary"
                  >
                    {Global("OrganizationDetails.actions.addAnotherUrl")}
                  </Button>
                )}
              </div>
            </div>

            {/* Identifiers section */}
            <div className={styles.sectionHeader}>
              <h2>{Global("OrganizationDetails.sections.identifiers.title")}</h2>
            </div>
            <div className={styles.sectionContainer}>
              <div className={styles.sectionContent}>
                <div className={styles.identifierField}>
                  <div className={styles.content}>
                    <FormInput
                      name="fundRef"
                      label={Global("OrganizationDetails.fields.fundRef.label")}
                      value="100014576"
                      disabled={true}
                      inputClasses={styles.readOnlyInput}
                    />
                    <Button
                      className="react-aria-Button react-aria-Button--secondary"
                      aria-label={`${Global("OrganizationDetails.actions.requestChange")} ${Global("OrganizationDetails.fields.fundRef.label")}`}
                    >
                      {Global("OrganizationDetails.actions.requestChange")}
                    </Button>
                  </div>
                </div>

                <div className={styles.identifierField}>
                  <div className={styles.content}>
                    <FormInput
                      name="ror"
                      label={Global("OrganizationDetails.fields.ror.label")}
                      value="00dmfq477"
                      disabled={true}
                      inputClasses={styles.readOnlyInput}
                    />
                    <Button
                      className="react-aria-Button react-aria-Button--secondary"
                      aria-label={`${Global("OrganizationDetails.actions.requestChange")} ${Global("OrganizationDetails.fields.ror.label")}`}
                    >
                      {Global("OrganizationDetails.actions.requestChange")}
                    </Button>
                  </div>
                </div>

                <div className={styles.identifierField}>
                  <div className={styles.content}>
                    <FormInput
                      name="shibboleth"
                      label={Global("OrganizationDetails.fields.shibboleth.label")}
                      value="urn:mace:incommon:ucop.edu"
                      disabled={true}
                      inputClasses={styles.readOnlyInput}
                    />
                    <Button
                      className="react-aria-Button react-aria-Button--secondary"
                      aria-label={`${Global("OrganizationDetails.actions.requestChange")} ${Global("OrganizationDetails.fields.shibboleth.label")}`}
                    >
                      {Global("OrganizationDetails.actions.requestChange")}
                    </Button>
                  </div>
                </div>

                <div className={styles.identifierField}>
                  <div className={styles.content}>
                    <FormInput
                      name="domains"
                      label={Global("OrganizationDetails.fields.domains.label")}
                      value="universityofcalifornia.edu, ucop.edu, ucp.edu"
                      disabled={true}
                      inputClasses={styles.readOnlyInput}
                    />
                    <Button
                      className="react-aria-Button react-aria-Button--secondary"
                      aria-label={`${Global("OrganizationDetails.actions.requestChange")} ${Global("OrganizationDetails.fields.domains.label")}`}
                    >
                      {Global("OrganizationDetails.actions.requestChange")}
                    </Button>
                  </div>
                </div>
              </div>
            </div>

            {/* Save button */}
            <div className={styles.saveButton}>
              <Button type="submit">{Global("OrganizationDetails.buttons.save")}</Button>
            </div>
          </form>
        </ContentContainer>

        <SidebarPanel>
          <div>{/* TODO: Add sidebar content */}</div>
        </SidebarPanel>
      </LayoutWithPanel>
    </>
  );
};;;

export default OrganizationDetailsPage;
