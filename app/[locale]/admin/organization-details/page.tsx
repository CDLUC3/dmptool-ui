"use client";

import React, { useEffect, useRef, useState } from "react";
import PageHeader from "@/components/PageHeader";
import { ContentContainer, LayoutWithPanel, SidebarPanel } from "@/components/Container";
import { CheckboxGroupComponent, FormInput, RadioGroupComponent } from "@/components/Form";
import { Breadcrumb, Breadcrumbs, Button, Checkbox, DropZone, FileTrigger, Link, Radio } from "react-aria-components";

import { useTranslations } from "next-intl";
import styles from "./organizationDetails.module.scss";
import { useMutation, useQuery } from "@apollo/client/react";
import {
  AffiliationByIdDocument,
  AffiliationLink,
  AffiliationLinkInput,
  AffiliationType,
  GenerateLogoUploadUrlDocument,
  MeDocument,
  UpdateAffiliationDocument,
} from "@/generated/graphql";
import { useRouter } from "next/navigation";
import Loading from "@/components/Loading";
import { FUNDREF_BASE_URL } from "@/lib/constants";
import { useToast } from "@/context/ToastContext";
import { isValidEmail, logECS, routePath, scrollToTop } from "@/utils/index";
import ErrorMessages from "@/components/ErrorMessages";
import { S3UploadResponse } from "@/app/types";
import { uploadFileToS3 } from "@/app/[locale]/admin/organization-details/actions/s3Uploader";

interface OrganizationDetailsPageErrors {
  general: string;
  displayName: string;
  displayAbbreviation: string;
  displayDomain: string;
  contactName: string;
  contactEmail: string;
  types: string;
  managed: string;
  funder: string;
  fundrefId: string;
  rorId: string;
  ssoEntityId: string;
  ssoEmailDomains: string;
  apiTarget: string;
  subHeaderLinks: string;
}

interface OrganizationLink {
  order: number;
  id?: number | null;
  url: string;
  text?: string | null;
}

interface OrganizationDetails {
  id?: number | null;
  uri: string;
  provenance: string;
  managed: boolean;
  funder: boolean;
  name: string;
  acronyms: string[];
  homepage?: string | null;
  displayName: string;
  displayAbbreviation: string;
  displayDomain?: string | null;
  types?: string[] | null;
  contactName?: string | null;
  contactEmail?: string | null;
  logoName?: string | null;
  logoURI?: string | null;
  fundrefId?: string | null;
  rorId?: string | null;
  ssoEntityId?: string | null;
  ssoEmailDomains?: string[] | null;
  apiTarget?: string | null;
}

const OrganizationDetailsPage: React.FC = () => {
  const router = useRouter();
  const toastState = useToast();

  //For scrolling to top of page
  const topRef = useRef<HTMLDivElement | null>(null);

  //For scrolling to error in page
  const errorRef = useRef<HTMLDivElement | null>(null);

  const [errors, setErrors] = useState<string[]>([]);
  const [fieldErrors, setFieldErrors] = useState<OrganizationDetailsPageErrors>({
    general: "",
    displayName: "",
    displayAbbreviation: "",
    displayDomain: "",
    contactEmail: "",
    contactName: "",
    types: "",
    managed: "",
    funder: "",
    fundrefId: "",
    rorId: "",
    ssoEntityId: "",
    ssoEmailDomains: "",
    apiTarget: "",
    subHeaderLinks: "",
  });
  const [linkErrors, setLinkErrors] = useState<number[]>([]);

  const [organization, setOrganization] = useState<OrganizationDetails>({
    uri: "",
    provenance: "",
    managed: false,
    funder: false,
    name: "",
    acronyms: [],
    displayName: "",
    displayAbbreviation: "",
  });

  // Organization links
  const [organizationLinks, setOrganizationLinks] = useState<OrganizationLink[]>([]);

  // Organization types
  const [selectedTypes, setSelectedTypes] = useState<string[]>([AffiliationType.Other.toString()]);

  // Logo
  const [uploadFile, setUploadFile] = useState<File | undefined>(undefined);
  const [logoName, setLogoName] = useState<string>("");
  const [logoUrl, setLogoUrl] = useState<string>("");

  // Form state
  const [hasUnsavedChanges, setHasUnsavedChanges] = useState<boolean>(false);
  const [isSubmitting, setIsSubmitting] = useState(false);

  // Aria Announcements
  const [announcement, setAnnouncement] = useState<string>("");

  // Translation keys
  const Global = useTranslations("Global");
  const OrganizationDetails = useTranslations("OrganizationDetails");

  // Run me query to get user's info to determine if they are a SuperAdmin
  const { data: meData } = useQuery(MeDocument);
  const isSuperAdmin: boolean = meData?.me?.role === "SUPERADMIN";
  const affiliationId: number | null | undefined = meData?.me?.affiliation?.id;

  // Convert enum organization types into an array of checkbox options
  const affiliationCheckboxTypes: { label: string; value: string }[] = Object.values(AffiliationType).map((typ) => {
    const val: string = typ.toString();
    return { label: `fields.organizationType.types.${val.toLowerCase()}`, value: val };
  });

  // Initialize GraphQL queries and mutations
  const { data, loading, error } = useQuery(AffiliationByIdDocument, {
    variables: { affiliationId: Number(affiliationId) },
    notifyOnNetworkStatusChange: true,
    skip: affiliationId === undefined || affiliationId === null,
  });
  const [updateAffiliationMutation] = useMutation(UpdateAffiliationDocument);
  const [generatePresignedURLMutation] = useMutation(GenerateLogoUploadUrlDocument);

  // The abbreviation is required but in some scenarios an Affiliation can be created within one being set, so this
  // function will generate a default based on the name
  const generateAcronym = (name: string): string => {
    const nameParts: string[] = name.split(" ").filter((word) => word.length > 0);

    // If the name had at least 2 words, use the first letter of each word. If not use the first 5 letters of the name
    return nameParts.length > 1
      ? nameParts
          .slice(0, 4)
          .map((word) => word[0].toUpperCase())
          .join("")
      : name.replace(" ", "").slice(0, 4).toUpperCase();
  };

  // Update one of the Affiliation's fields
  const updateOrganizationContent = (key: string, value: string | string[] | boolean | number | null) => {
    setOrganization((prevContents) => ({
      ...prevContents,
      [key]: value,
    }));
    setHasUnsavedChanges(true);
  };

  // Handle changes from the AffiliationType checkboxes
  const handleCheckboxChange = (typeIn: string, checked: boolean) => {
    // If the user unchecked a type, remove it from the list
    if (selectedTypes.includes(typeIn) && !checked) {
      setSelectedTypes((prevTypes) => prevTypes.filter((selectedType) => selectedType !== typeIn));
    } else if (!selectedTypes.includes(typeIn) && checked) {
      setSelectedTypes((prevTypes) => [...prevTypes, typeIn]);
    }
    setHasUnsavedChanges(true);
  };

  // Handle changes from a Yes/No RadioGroup
  const handleRadioChange = (key: string, value: string) => {
    if (key && value) {
      setOrganization((prevContents) => ({
        ...prevContents,
        [key]: value === "yes",
      }));
    }
    setHasUnsavedChanges(true);
  };

  // Add another AffiliationLink
  const handleAddLink = () => {
    if (organizationLinks.length < 5) {
      // Either calculate next order number off of last orderNumber, if present, or just use the row.length to increment
      const nextNum = organizationLinks?.length === 0 ? 1 : organizationLinks.length + 1;

      const newLink: OrganizationLink = {
        order: nextNum, // Is the position called out to the screen reader
        url: "",
        text: "",
      };

      setOrganizationLinks([...organizationLinks, newLink]);
      setAnnouncement(OrganizationDetails("messages.linkAdded", { nextNum }));
    }
  };

  // Remove the specified AffiliationLink
  const handleRemoveLink = (order: number) => {
    if (order && order !== 0) {
      const updatedLinks: OrganizationLink[] = organizationLinks?.filter((row) => row.order !== order);
      setOrganizationLinks(updatedLinks || []);
      setAnnouncement(OrganizationDetails("messages.linkRemoved", { number: order }));
      setHasUnsavedChanges(true);
    }
  };

  // Update the specified AffiliationLink
  const handleLinkChange = (order: number | null, field: "url" | "text", value: string) => {
    const updatedLinks: OrganizationLink[] = organizationLinks.map((link: OrganizationLink) => {
      if (link.order === order) {
        return { ...link, [field]: value };
      }
      return link;
    });

    setOrganizationLinks(updatedLinks);
    setHasUnsavedChanges(true);
  };

  // Handle changes to the SSO email domains
  const handleEmailDomainUpdate = (value: string) => {
    const ssoEmailDomains: string[] = value.split(",").map((domain: string) => domain.trim()) || [];
    setOrganization((prev) => ({ ...prev, ssoEmailDomains }));
  };

  // Upload the organization's logo to S3 via the server side uploadFileToS3 hook.
  const uploadLogoToS3 = async (url: string, fields: string, file: File): Promise<string | undefined> => {
    if (!url || !fields || !file) {
      return undefined;
    }
    try {
      const parsed = JSON.parse(fields);
      const s3Key: string = parsed.key;
      if (s3Key) {
        // We need to use the form data returned by the pre-signed URL call as-is and then append the file at the end
        const formData = new FormData();
        Object.entries(parsed).forEach(([key, value]) => {
          formData.append(key, value as string);
        });
        // File must be the last field for S3 presigned POST
        formData.append("file", file);

        // If we are running locally, rewrite the URL for LocalStack
        const response: S3UploadResponse = await uploadFileToS3(url, formData);
        if (response.success) {
          return s3Key;
        }
      }
    } catch (error) {
      logECS("error", "uploadLogoToS3", {
        error,
        url: { path: routePath("admin.organizationDetails") },
      });
    }

    setErrors((prevErrors) => [...prevErrors, OrganizationDetails("messages.errors.logoFileUploadPartTwo")]);
    return undefined;
  };

  // Generate a presigned URL that we can upload the logo to
  const getPresignedURL = async (file: File): Promise<{ url: string | undefined; fields: string }> => {
    const response = await generatePresignedURLMutation({
      variables: {
        affiliationURI: organization.uri,
        fileName: file.name,
        contentType: file.type,
      },
    });

    const responseData = response.data?.generateLogoUploadURL;
    const responseErrors = responseData?.errors;

    if (responseErrors && responseErrors.general !== "") {
      setErrors((prevErrors) => [...prevErrors, responseErrors.general]);
    } else if (responseData) {
      return { url: responseData?.url, fields: responseData?.fields };
    } else {
      setErrors((prevErrors) => [...prevErrors, OrganizationDetails("messages.errors.logoFileUploadPartOne")]);
    }
    return { url: undefined, fields: "" };
  };

  // Process a Logo upload
  const processLogoUpload = async (): Promise<string | undefined> => {
    // If there is no logo file just return true so that the rest of the process can continue
    if (!uploadFile) return undefined;

    // First get the presigned URL for S3
    const { url, fields } = await getPresignedURL(uploadFile);
    if (url) {
      // Then upload the file to S3 via our server side proxy
      const s3Key = await uploadLogoToS3(url, fields, uploadFile);
      if (s3Key) {
        // Then return the S3 key so we can set the logoName
        return s3Key;
      }
    }
    // Something went wrong. Errors will have been set elsewhere so just return a false;
    return undefined;
  };

  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const handleDrop = async (e: any) => {
    if (e.items && e.items.length > 0) {
      if (e.items[0].name && e.items[0].type) {
        setUploadFile(e.items[0]);
        setLogoName(e.items[0].name);
      } else {
        setErrors((prevErrors) => [...prevErrors, OrganizationDetails("messages.errors.logoFileSelect")]);
      }
    }
  };

  // Process a file upload
  const handleFileSelect = async (file: File) => {
    if (file && file.name && file.type) {
      setUploadFile(file);
      setLogoName(file.name);
    } else {
      setErrors((prevErrors) => [...prevErrors, OrganizationDetails("messages.errors.logoFileSelect")]);
    }
  };

  // Clear the logo
  const handleLogoRemoval = () => {
    setLogoUrl("");
    setLogoName("");
  };

  // Clear all errors
  const clearErrors = () => {
    setErrors([]);
    setLinkErrors([]);
    setFieldErrors({
      general: "",
      displayName: "",
      displayAbbreviation: "",
      displayDomain: "",
      contactEmail: "",
      contactName: "",
      types: "",
      managed: "",
      funder: "",
      fundrefId: "",
      rorId: "",
      ssoEntityId: "",
      ssoEmailDomains: "",
      apiTarget: "",
      subHeaderLinks: "",
    });
  };

  // Send the updated Affiliation data to the backend
  const updateAffiliation = async (): Promise<[OrganizationDetailsPageErrors | undefined, boolean]> => {
    try {
      // Convert string Organization types into AffiliationTypes
      const types: AffiliationType[] = selectedTypes?.map((typ) => {
        // Convert to CamelCase first
        const typeKey = `${typ.slice(0, 1)}${typ.slice(1, typ.length).toLowerCase()}`;
        return AffiliationType[typeKey as keyof typeof AffiliationType];
      }) || [AffiliationType.Other];

      // Get the existing logo file name
      let logoName = organization.logoName;

      // Process newly uploaded logo if applicable
      if (uploadFile && logoName) {
        const s3Key: string | undefined = await processLogoUpload();
        if (!s3Key) {
          // The processLogoUpload function will have set error messages if it failed, so just abort
          return [undefined, false];
        }
        logoName = s3Key;
      } else if (logoName && !logoUrl) {
        // If the logo was removed
        logoName = undefined;
      }

      const subHeaderLinks: AffiliationLinkInput[] = organizationLinks.map((link: OrganizationLink) => {
        return { id: link.id, url: link.url, text: link.text };
      });

      const response = await updateAffiliationMutation({
        variables: {
          input: {
            id: Number(organization.id),
            managed: organization.managed,
            funder: organization.funder,
            displayName: organization.displayName,
            displayAbbreviation: organization.displayAbbreviation,
            displayDomain: organization.displayDomain,
            contactName: organization.contactName,
            contactEmail: organization.contactEmail,
            types,
            logoName,
            fundrefId: organization.fundrefId,
            ssoEntityId: organization.ssoEntityId,
            ssoEmailDomains: organization.ssoEmailDomains,
            apiTarget: organization.apiTarget,
            subHeaderLinks,
          },
        },
      });
      const responseErrors = response.data?.updateAffiliation?.errors;
      if (responseErrors) {
        if (
          responseErrors &&
          Object.values(responseErrors).filter((err) => err && err !== "AffiliationErrors").length > 0
        ) {
          return [responseErrors as OrganizationDetailsPageErrors, false];
        }
      }

      return [undefined, true];
    } catch (error) {
      logECS("error", "updateAffiliationMutation", {
        error,
        url: { path: routePath("admin.organizationDetails") },
      });
      setErrors((prevErrors) => [...prevErrors, OrganizationDetails("messages.errors.organizationDetailsSave")]);
      return [undefined, false];
    }
  };

  // Check whether form is valid before submitting
  const isFormValid = (): boolean => {
    const errs = {
      displayName: "",
      displayAbbreviation: "",
      displayDomain: "",
      contactName: "",
      contactEmail: "",
      types: "",
      subHeaderLinks: "",
    };

    // Make sure all the required fields have values and set errors for any that don't
    if (!organization.displayName || organization.displayName.trim().length <= 2) {
      errs.displayName = OrganizationDetails("messages.errors.displayName");
    }
    if (!organization.displayAbbreviation || organization.displayAbbreviation.trim().length <= 2) {
      errs.displayAbbreviation = OrganizationDetails("messages.errors.displayAbbr");
    }
    if (!organization.displayDomain || organization.displayDomain.trim().length <= 2) {
      errs.displayDomain = OrganizationDetails("messages.errors.displayDomain");
    }
    if (!organization.contactName || organization.contactName.trim().length <= 2) {
      errs.contactName = OrganizationDetails("messages.errors.contactName");
    }
    if (!organization.contactEmail || !isValidEmail(organization.contactEmail)) {
      errs.contactEmail = OrganizationDetails("messages.errors.contactEmail");
    }

    if (isSuperAdmin && (!organization.types || organization.types.length === 0)) {
      errs.types = OrganizationDetails("messages.errors.types");
    }

    for (const link of organizationLinks) {
      if (!link.url || link.url.trim().length === 0 || !URL.canParse(link.url)) {
        setLinkErrors((prev) => [...prev, link.order]);
      }
    }

    const errVals: string[] = Object.values(errs).filter(Boolean);
    const linkErrVals: number[] = Object.values(linkErrors).filter(Boolean);
    if (errVals.length > 0 || linkErrVals.length > 0) {
      setFieldErrors((prevErrors: OrganizationDetailsPageErrors) => {
        return { ...prevErrors, ...errs };
      });
      // Update state with the top level error message
      setErrors([OrganizationDetails("messages.errors.organizationDetailsSave")]);
    }

    return errVals.length === 0 && linkErrVals.length === 0;
  };

  // Show Success Message
  const showSuccessToast = () => {
    const successMessage = OrganizationDetails("messages.success.organizationDetailsSaved");
    toastState.add(successMessage, { type: "success", timeout: 3000 });
    // Scroll to top of page
    scrollToTop(topRef);
  };

  // Submit the form
  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    // Prevent double submission
    if (isSubmitting) return;

    clearErrors();
    setIsSubmitting(true);

    if (isFormValid()) {
      // Update profile
      const [errors, success] = await updateAffiliation();
      if (!success) {
        if (errors) {
          setFieldErrors({
            general: errors.general || "",
            displayName: errors.displayName || "",
            displayAbbreviation: errors.displayAbbreviation || "",
            displayDomain: errors.displayDomain || "",
            contactEmail: errors.contactEmail || "",
            contactName: errors.contactName || "",
            types: errors.types || "",
            managed: errors.managed || "",
            funder: errors.funder || "",
            fundrefId: errors.fundrefId || "",
            rorId: errors.rorId || "",
            ssoEntityId: errors.ssoEntityId || "",
            ssoEmailDomains: errors.ssoEmailDomains || "",
            apiTarget: errors.apiTarget || "",
            subHeaderLinks: errors.subHeaderLinks || "",
          });
        }
        setErrors([errors?.general || OrganizationDetails("messages.errors.organizationDetailsSave")]);
      } else {
        // Show success message
        showSuccessToast();
        setHasUnsavedChanges(false);
      }
    }
    setIsSubmitting(false);
  };

  useEffect(() => {
    // When data from backend changes, set organization data in state
    if (data && data.affiliationById) {
      // Abbreviation is a required field, so use what the admin entered, what ROR provided, or generate one
      const abbreviation: string =
        data.affiliationById.displayAbbreviation ||
        data.affiliationById?.acronyms?.[0] ||
        generateAcronym(data.affiliationById.name);

      setOrganization({
        id: data.affiliationById.id,
        uri: data.affiliationById.uri,
        provenance: data.affiliationById.provenance,
        managed: data.affiliationById.managed,
        funder: data.affiliationById.funder,
        name: data.affiliationById.name,
        acronyms: data.affiliationById.acronyms || [],
        homepage: data.affiliationById.homepage,
        displayName: data.affiliationById.displayName,
        displayAbbreviation: abbreviation,
        displayDomain: data.affiliationById.displayDomain,
        contactName: data.affiliationById.contactName,
        contactEmail: data.affiliationById.contactEmail,
        types: data.affiliationById.types,
        logoName: data.affiliationById.logoName,
        logoURI: data.affiliationById.logoURI,
        fundrefId: data.affiliationById.fundrefId,
        rorId: data.affiliationById.provenance === "ROR" ? data.affiliationById.uri : undefined,
        ssoEntityId: data.affiliationById.ssoEntityId,
        ssoEmailDomains: data.affiliationById.ssoEmailDomains,
        apiTarget: data.affiliationById.apiTarget,
      });

      // Set the affiliation types
      setSelectedTypes(data.affiliationById?.types?.map((type) => type.toString().toUpperCase()) || []);

      // Process any Links
      const links: AffiliationLink[] = data.affiliationById.subHeaderLinks?.filter(Boolean) || [];

      setOrganizationLinks(
        links.map((link: AffiliationLink, index: number): OrganizationLink => {
          return { order: index + 1, id: link.id, url: link.url, text: link.text };
        }),
      );

      const logoParts = data.affiliationById.logoName?.split("/");
      if (Array.isArray(logoParts) && logoParts.length > 0) {
        const url = data.affiliationById.logoURI;
        if (url) {
          setLogoName(logoParts[logoParts.length - 1]);
          setLogoUrl(url);
        }
      }
    }
  }, [data]);

  // Converts the Uploaded file into a resolvable URL so we can display the preview before saving
  useEffect(() => {
    if (!uploadFile) {
      setLogoUrl("");
      return;
    }

    const objectUrl = URL.createObjectURL(uploadFile);
    setLogoUrl(objectUrl);

    // Free memory when ever this component unmounts or file changes
    return () => URL.revokeObjectURL(objectUrl);
  }, [uploadFile]);

  // Warn user of unsaved changes if they try to leave the page
  useEffect(() => {
    const handleBeforeUnload = (e: BeforeUnloadEvent) => {
      if (hasUnsavedChanges) {
        e.preventDefault();
        e.returnValue = ""; // Required for Chrome/Firefox to show the confirm dialog
      }
    };

    window.addEventListener("beforeunload", handleBeforeUnload);
    return () => {
      window.removeEventListener("beforeunload", handleBeforeUnload);
    };
  }, [hasUnsavedChanges]);

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
        title={OrganizationDetails("title")}
        description={OrganizationDetails("description")}
        showBackButton={true}
        breadcrumbs={
          <Breadcrumbs aria-label={Global("breadcrumbs.navigation")}>
            <Breadcrumb>
              <Link href={routePath("app.home")}>{Global("breadcrumbs.home")}</Link>
            </Breadcrumb>
            <Breadcrumb>{OrganizationDetails("title")}</Breadcrumb>
          </Breadcrumbs>
        }
        actions={null}
        className="page-organization-details-header"
      />

      <LayoutWithPanel className={"page-organization-details"}>
        <ContentContainer>
          <ErrorMessages
            errors={errors}
            ref={errorRef}
          />
          <form
            onSubmit={handleSubmit}
            noValidate
          >
            {/* Edit organization details section */}
            <div className={styles.sectionHeader}>
              <h2>{OrganizationDetails("sections.organizationDetails.title")}</h2>
            </div>
            <div className={styles.sectionContainer}>
              <div className={styles.sectionContent}>
                <FormInput
                  name="organizationName"
                  type="text"
                  label={OrganizationDetails("fields.organizationName.label")}
                  placeholder={OrganizationDetails("fields.organizationName.placeholder")}
                  helpMessage={
                    organization.rorId
                      ? `${OrganizationDetails("fields.organizationName.helpMessage")} ${organization.name}`
                      : OrganizationDetails("fields.organizationName.helpMessageNonRor")
                  }
                  value={organization.displayName}
                  onChange={(e) => updateOrganizationContent("displayName", e.target.value)}
                  isInvalid={fieldErrors.displayName.length > 0}
                  errorMessage={
                    fieldErrors.displayName.length > 0
                      ? fieldErrors.displayName
                      : OrganizationDetails("messages.errors.displayName")
                  }
                />

                <FormInput
                  name="organizationAbbr"
                  type="text"
                  maxLength={10}
                  label={OrganizationDetails("fields.organizationAbbr.label")}
                  placeholder={OrganizationDetails("fields.organizationAbbr.placeholder")}
                  helpMessage={
                    organization.rorId
                      ? `${OrganizationDetails("fields.organizationAbbr.helpMessage")} ${organization.name}`
                      : OrganizationDetails("fields.organizationAbbr.helpMessageNonRor")
                  }
                  value={organization.displayAbbreviation}
                  onChange={(e) => updateOrganizationContent("displayAbbreviation", e.target.value)}
                  isInvalid={fieldErrors.displayAbbreviation.length > 0}
                  errorMessage={
                    fieldErrors.displayAbbreviation.length > 0
                      ? fieldErrors.displayAbbreviation
                      : OrganizationDetails("messages.errors.displayAbbr")
                  }
                  isRequired={true}
                />

                <FormInput
                  name="organizationDomain"
                  type="url"
                  label={OrganizationDetails("fields.organizationDomain.label")}
                  placeholder={OrganizationDetails("fields.organizationDomain.placeholder")}
                  helpMessage={
                    organization.rorId
                      ? `${OrganizationDetails("fields.organizationDomain.helpMessage")} ${organization.name}`
                      : OrganizationDetails("fields.organizationDomain.helpMessageNonRor")
                  }
                  value={organization.displayDomain || ""}
                  onChange={(e) => updateOrganizationContent("displayDomain", e.target.value)}
                  isInvalid={fieldErrors.displayDomain.length > 0}
                  errorMessage={fieldErrors.displayDomain}
                />

                {/* Administrator contact */}
                <FormInput
                  name="contactEmail"
                  type="email"
                  label={OrganizationDetails("fields.contactEmail.label")}
                  placeholder={OrganizationDetails("fields.contactEmail.placeholder")}
                  value={organization.contactEmail || ""}
                  onChange={(e) => updateOrganizationContent("contactEmail", e.target.value)}
                  isInvalid={fieldErrors.contactEmail.length > 0}
                  errorMessage={
                    fieldErrors.contactEmail.length > 0
                      ? fieldErrors.contactEmail
                      : OrganizationDetails("messages.errors.contactEmail")
                  }
                  isRequired={true}
                />

                <FormInput
                  name="linkText"
                  type="text"
                  label={OrganizationDetails("fields.contactName.label")}
                  placeholder={OrganizationDetails("fields.contactName.placeholder")}
                  value={organization.contactName || ""}
                  onChange={(e) => updateOrganizationContent("contactName", e.target.value)}
                  isInvalid={fieldErrors.contactName.length > 0}
                  errorMessage={
                    fieldErrors.contactName.length > 0
                      ? fieldErrors.contactName
                      : OrganizationDetails("messages.errors.contactName")
                  }
                  isRequired={true}
                />

                {/* Organization Links section */}
                <div className={styles.sectionHeader}>
                  <h3>{OrganizationDetails("fields.affiliationLinks.title")}</h3>
                </div>
                <div className={styles.organizationLinks}>
                  {organizationLinks.map((link: OrganizationLink) => (
                    <div
                      key={`link-${link.order}`}
                      className={styles.linkRow}
                      role="group"
                    >
                      {/* Let screen reader know which row they are on */}
                      <span
                        id={`row-label-${link.order}`}
                        className="hidden-accessibly"
                      >
                        {OrganizationDetails("messages.linkRowInfo", { number: link.order })}
                      </span>

                      <FormInput
                        id={`order-${link.order}`}
                        name="orderNumber"
                        type="text"
                        disabled={true}
                        isRequired={true}
                        label={OrganizationDetails("fields.affiliationLinks.order.label")}
                        value={link.order} // Plus one because its being read to screen readers
                        placeholder={OrganizationDetails("fields.affiliationLinks.order.placeholder")}
                        ariaLabel={!link.order ? undefined : "Order"}
                        className="hidden-accessibly"
                      />

                      <FormInput
                        id={`url-${link.order}`}
                        name={`url-${link.order}`}
                        type="url"
                        isRequired={true}
                        label={OrganizationDetails("fields.affiliationLinks.url.label")}
                        value={link.url || ""}
                        placeholder={OrganizationDetails("fields.affiliationLinks.url.placeholder")}
                        ariaLabel={!link.order ? undefined : "URL"}
                        onChange={(e) => handleLinkChange(link.order, "url", e.target.value)}
                        isInvalid={linkErrors?.includes(link.order)}
                        errorMessage={
                          linkErrors?.includes(link.order) ? OrganizationDetails("messages.errors.linkURL") : ""
                        }
                      />

                      <FormInput
                        id={`text-${link.order}`}
                        name={`text-${link.order}`}
                        type="text"
                        label={OrganizationDetails("fields.affiliationLinks.text.label")}
                        value={link.text || ""}
                        placeholder={OrganizationDetails("fields.affiliationLinks.text.placeholder")}
                        ariaLabel={!link.order ? undefined : "Text"}
                        onChange={(e) => handleLinkChange(link.order, "text", e.target.value)}
                      />

                      <div className={styles.remove}>
                        <button
                          type="button"
                          onClick={() => handleRemoveLink(link.order || 0)}
                          aria-label={OrganizationDetails("buttons.deleteLink", { count: link.order })}
                          className={`${styles.deleteButton} react-aria-Button secondary`}
                        >
                          {Global("buttons.remove")}
                        </button>
                        {/**Screen readers will announce when a new row was added */}
                        <p
                          aria-live="polite"
                          className="hidden-accessibly"
                        >
                          {organizationLinks.length > 0
                            ? OrganizationDetails("messages.success.addingLink", {
                                number: organizationLinks.length,
                              })
                            : ""}
                        </p>
                      </div>
                    </div>
                  ))}
                  <button
                    type="button"
                    onClick={handleAddLink}
                    aria-live="polite"
                  >
                    {OrganizationDetails("buttons.addLink")}
                  </button>
                </div>

                {!isSuperAdmin ? (
                  <div className={styles.organizationTypeRow}>
                    <div
                      className={styles.label}
                      id="organization-type-label"
                    >
                      {OrganizationDetails("fields.organizationType.label")}
                    </div>
                    <div className={styles.content}>
                      <span
                        className={"mr-3"}
                        aria-labelledby="organization-type-label"
                      >
                        {organization?.types
                          ?.map((type) => {
                            return OrganizationDetails(`fields.organizationType.types.${type.toLowerCase()}`);
                          })
                          ?.join(", ") || OrganizationDetails("fields.organizationType.types.other")}
                      </span>
                      <Link
                        href="/contact"
                        className={`react-aria-Link ${styles.requestChangeLink}`}
                      >
                        {OrganizationDetails("actions.requestChange")}
                      </Link>
                    </div>
                  </div>
                ) : (
                  <div className={styles.organizationTypeRow}>
                    <CheckboxGroupComponent
                      name="organizationTypes"
                      checkboxGroupLabel={OrganizationDetails("fields.organizationType.label")}
                      value={selectedTypes}
                      isRequired={true}
                      isInvalid={fieldErrors.types.length > 0}
                      errorMessage={
                        fieldErrors.types.length > 0 ? fieldErrors.types : OrganizationDetails("messages.errors.types")
                      }
                    >
                      <div className={styles.organizationTypeCheckboxGroup}>
                        {affiliationCheckboxTypes &&
                          affiliationCheckboxTypes.map((checkbox, index) => (
                            <Checkbox
                              value={checkbox.value}
                              key={checkbox.value}
                              aria-label="checkbox"
                              id={`organizationType-${index}`}
                              isSelected={organization.types?.includes(checkbox.value) || false}
                              onChange={(e) => handleCheckboxChange(checkbox.value, e)}
                            >
                              <div className="checkbox">
                                <svg
                                  viewBox="0 0 18 18"
                                  aria-hidden="true"
                                >
                                  <polyline points="1 9 7 14 15 4" />
                                </svg>
                              </div>
                              <span
                                className="checkbox-label"
                                data-testid="checkboxLabel"
                              >
                                <div className="checkbox-wrapper">
                                  <div>{OrganizationDetails(checkbox.label)}</div>
                                </div>
                              </span>
                            </Checkbox>
                          ))}
                      </div>
                    </CheckboxGroupComponent>
                  </div>
                )}

                {/* Other SuperAdmin fields */}
                {isSuperAdmin && (
                  <div id="superadmin-details">
                    <RadioGroupComponent
                      name="radioGroup"
                      value={organization?.managed ? "yes" : "no"}
                      radioGroupLabel={OrganizationDetails("fields.managed.label")}
                      description={OrganizationDetails("fields.managed.description")}
                      onChange={(e) => handleRadioChange("managed", e)}
                      isInvalid={fieldErrors.managed.length > 0}
                      errorMessage={fieldErrors.managed}
                    >
                      <div>
                        <Radio value="yes">{Global("form.yesLabel")}</Radio>
                      </div>

                      <div>
                        <Radio value="no">{Global("form.noLabel")}</Radio>
                      </div>
                    </RadioGroupComponent>

                    <RadioGroupComponent
                      name="radioGroup"
                      value={organization?.funder ? "yes" : "no"}
                      radioGroupLabel={OrganizationDetails("fields.funder.label")}
                      description={OrganizationDetails("fields.funder.description")}
                      onChange={(e) => handleRadioChange("funder", e)}
                      isInvalid={fieldErrors.managed.length > 0}
                      errorMessage={fieldErrors.funder}
                    >
                      <div>
                        <Radio value="yes">{Global("form.yesLabel")}</Radio>
                      </div>

                      <div>
                        <Radio value="no">{Global("form.noLabel")}</Radio>
                      </div>
                    </RadioGroupComponent>

                    <FormInput
                      name="apiTarget"
                      type="url"
                      label={OrganizationDetails("fields.apiTarget.label")}
                      description={OrganizationDetails("fields.apiTarget.description")}
                      value={organization.apiTarget || ""}
                      onChange={(e) => updateOrganizationContent("apiTarget", e.target.value)}
                      isInvalid={fieldErrors.apiTarget.length > 0}
                      errorMessage={fieldErrors.apiTarget}
                      disabled={!organization.funder}
                    />
                  </div>
                )}
              </div>
            </div>

            {/* Branding section */}
            <div className={styles.sectionHeader}>
              <h2>{OrganizationDetails("sections.branding.title")}</h2>
            </div>
            <div className={styles.sectionContainer}>
              <div className={styles.sectionContent}>
                <div className={styles.logoSection}>
                  <div className={styles.logoRow}>
                    {/* If a preview exists, show the logo and file name */}
                    {logoUrl && logoName ? (
                      <div className={styles.logoPreviewContainer}>
                        <div className={styles.previewImageWrapper}>
                          <img
                            src={logoUrl}
                            alt="Logo preview"
                            className={styles.logoPreview}
                          />
                        </div>
                        <div className={styles.previewDetails}>
                          <span className={styles.fileName}>{logoName}</span>
                          <button
                            className={styles.removeButton}
                            onClick={() => handleLogoRemoval()}
                          >
                            {OrganizationDetails("buttons.removeLogo")}
                          </button>
                        </div>
                      </div>
                    ) : (
                      <div className={styles.logoUpload}>
                        <div className={styles.uploadArea}>
                          <DropZone
                            onDrop={handleDrop}
                            aria-label={OrganizationDetails("upload.dropZone.ariaLabel")}
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
                                <h3>{OrganizationDetails("upload.title")}</h3>
                                <p>{OrganizationDetails("upload.description")}</p>
                                <p className={styles.fileTypes}>{OrganizationDetails("upload.fileTypes")}</p>
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
                                  {OrganizationDetails("upload.browseButton")}
                                </Button>
                              </FileTrigger>
                            </div>
                          </DropZone>
                        </div>
                      </div>
                    )}
                  </div>
                </div>
              </div>
            </div>

            {/* Identifiers section */}
            <div className={styles.sectionHeader}>
              <h2>{OrganizationDetails("sections.identifiers.title")}</h2>
            </div>
            <div className={styles.sectionContainer}>
              <div className={styles.sectionContent}>
                <div className={styles.identifierField}>
                  <div className={styles.content}>
                    <FormInput
                      name="fundRef"
                      label={OrganizationDetails("fields.fundRef.label")}
                      value={organization.fundrefId || ""}
                      helpMessage={
                        organization.fundrefId ? (
                          <span>
                            {OrganizationDetails("fields.fundRef.helpMessage")}
                            <Link
                              href={`${FUNDREF_BASE_URL}${organization.fundrefId}`}
                              target="_blank"
                              rel="noopener noreferrer"
                            >
                              {organization.fundrefId}
                            </Link>
                          </span>
                        ) : (
                          ""
                        )
                      }
                      disabled={true}
                      isInvalid={fieldErrors.fundrefId.length > 0}
                      errorMessage={fieldErrors.fundrefId}
                      onChange={(e) => updateOrganizationContent("fundrefId", e.target.value)}
                    />
                    {!isSuperAdmin && (
                      <Button
                        className="react-aria-Button react-aria-Button--secondary"
                        aria-label={`${OrganizationDetails("actions.requestChange")} ${OrganizationDetails("fields.fundRef.label")}`}
                      >
                        {OrganizationDetails("actions.requestChange")}
                      </Button>
                    )}
                  </div>
                </div>

                <div className={styles.identifierField}>
                  <div className={styles.content}>
                    <FormInput
                      name="ror"
                      label={OrganizationDetails("fields.ror.label")}
                      value={organization.rorId || ""}
                      helpMessage={
                        organization.rorId && organization.uri ? (
                          <span>
                            {OrganizationDetails("fields.ror.helpMessage")}
                            <Link
                              href={organization.uri}
                              target="_blank"
                              rel="noopener noreferrer"
                            >
                              {organization.rorId.split("/").pop()}
                            </Link>
                          </span>
                        ) : (
                          ""
                        )
                      }
                      disabled={true}
                      isInvalid={fieldErrors.rorId.length > 0}
                      errorMessage={fieldErrors.rorId}
                      onChange={(e) => updateOrganizationContent("rorId", e.target.value)}
                    />
                    {!isSuperAdmin && (
                      <Button
                        className="react-aria-Button react-aria-Button--secondary"
                        aria-label={`${OrganizationDetails("actions.requestChange")} ${OrganizationDetails("fields.ror.label")}`}
                      >
                        {OrganizationDetails("actions.requestChange")}
                      </Button>
                    )}
                  </div>
                </div>

                <div className={styles.identifierField}>
                  <div className={styles.content}>
                    <FormInput
                      name="shibboleth"
                      label={OrganizationDetails("fields.shibboleth.label")}
                      helpMessage={OrganizationDetails("fields.shibboleth.helpMessage")}
                      isInvalid={fieldErrors.ssoEntityId.length > 0}
                      errorMessage={fieldErrors.ssoEntityId}
                      value={organization.ssoEntityId || ""}
                      disabled={!isSuperAdmin}
                      onChange={(e) => updateOrganizationContent("ssoEntityId", e.target.value)}
                    />
                    {!isSuperAdmin && (
                      <Button
                        className="react-aria-Button react-aria-Button--secondary"
                        aria-label={`${OrganizationDetails("actions.requestChange")} ${OrganizationDetails("fields.shibboleth.label")}`}
                      >
                        {OrganizationDetails("actions.requestChange")}
                      </Button>
                    )}
                  </div>
                </div>

                <div className={styles.identifierField}>
                  <div className={styles.content}>
                    <FormInput
                      name="domains"
                      label={OrganizationDetails("fields.domains.label")}
                      value={organization.ssoEmailDomains?.join(",") || ""}
                      disabled={!isSuperAdmin}
                      isInvalid={fieldErrors.ssoEmailDomains.length > 0}
                      errorMessage={fieldErrors.ssoEmailDomains}
                      helpMessage={OrganizationDetails("fields.domains.helpMessage")}
                      onChange={(e) => handleEmailDomainUpdate(e.target.value)}
                    />
                    {!isSuperAdmin && (
                      <Button
                        className="react-aria-Button react-aria-Button--secondary"
                        aria-label={`${OrganizationDetails("actions.requestChange")} ${OrganizationDetails("fields.domains.label")}`}
                      >
                        {OrganizationDetails("actions.requestChange")}
                      </Button>
                    )}
                  </div>
                </div>
              </div>
            </div>

            {/* Save button */}
            <div className={styles.saveButton}>
              <button
                type="submit"
                className="submit-button react-aria-Button"
              >
                {Global("buttons.save")}
              </button>
            </div>
          </form>

          {/** Hidden live region for screen readers */}
          <p
            aria-live="polite"
            className="hidden-accessibly"
          >
            {announcement}
          </p>
        </ContentContainer>

        <SidebarPanel>
          <div>{/* TODO: Add sidebar content */}</div>
        </SidebarPanel>
      </LayoutWithPanel>
    </>
  );
};;

export default OrganizationDetailsPage;
