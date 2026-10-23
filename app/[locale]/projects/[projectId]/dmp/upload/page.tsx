'use client';

import React, { useRef, useState, type ReactNode } from 'react';
import { useParams } from 'next/navigation';
import { useTranslations } from 'next-intl';
import { useMutation } from '@apollo/client/react';
import { useRouter } from '@/i18n/routing';
import {
  Breadcrumb,
  Breadcrumbs,
  Button,
  DropZone,
  FileTrigger,
  Form,
  Link,
  Text
} from "react-aria-components";
import type { DropEvent, FileDropItem } from 'react-aria';


import { UploadPlanDocument } from '@/generated/graphql';
import PageHeader from "@/components/PageHeader";
import {
  ContentContainer,
  LayoutWithPanel,
  SidebarPanel
} from "@/components/Container";
import CreateProjectFlowLayout, {
  FlowActions,
  flowPath,
  useCreateProjectFlow,
} from '@/components/CreateProjectFlow';
import ErrorMessages from '@/components/ErrorMessages';
import { routePath } from '@/utils/routes';
import { handleApolloError } from '@/utils/apolloErrorHandler';


const PlanCreateUpload = () => {
  const router = useRouter();
  const params = useParams();
  const projectId = String(params.projectId);
  const { inFlow, flow } = useCreateProjectFlow();
  const Flow = useTranslations('CreateProjectFlow');
  const [uploadPlan, { loading: uploading }] = useMutation(UploadPlanDocument);
  const [serverErrors, setServerErrors] = useState<string[]>([]);
  const errorRef = useRef<HTMLDivElement | null>(null);
  const [fileName, setFileName] = useState<string | null>(null); // Holds uploaded file name
  const [error, setError] = useState<string | null>(null); // Tracks any upload errors
  //const [isDragging, setIsDragging] = useState<boolean>(false); // State for drag-hover effect

  const validExtensions = [
    'application/pdf',
    'application/msword',
    'application/vnd.openxmlformats-officedocument.wordprocessingml.document'
  ];

  // Called when a file is dropped or selected
  const handleFileSelect = (file: File) => {
    setError(null); // Clear previous errors

    // Validate file type
    if (!validExtensions.includes(file.type)) {
      setError('Only PDF, DOC, or DOCX files are allowed.');
      setFileName(null);
      return;
    }

    // Set valid file name
    setFileName(file.name);
  };

  const handleDrop = (e: DropEvent) => {
    const files = e.items.filter((file) =>
      file.kind === 'file'
    ) as FileDropItem[];

    if (files.length > 0) {
      const file = files[0];
      setFileName(file.name);

      file.getFile().then((actualFile) => {
        handleFileSelect(actualFile);
      });
    }
  };


  // The file content is not sent yet; Apollo's uploadPlan resolver is a stub
  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setServerErrors([]);

    if (!fileName) {
      setError('Please upload a valid file before submitting.');
      return;
    }

    try {
      const { data } = await uploadPlan({ variables: { projectId: Number(projectId), fileName } });
      const plan = data?.uploadPlan;

      if (!plan?.id || plan.errors?.general) {
        setServerErrors([plan?.errors?.general, Flow('upload.notAvailable')].filter(Boolean) as string[]);
        return;
      }

      router.push(inFlow
        ? flowPath('complete', flow, projectId, { planId: plan.id })
        : routePath('projects.dmp.show', { projectId, dmpId: plan.id }));
    } catch (err) {
      handleApolloError(err, 'PlanCreateUpload.handleSubmit');
      setServerErrors([Flow('upload.notAvailable')]);
    }
  };

  const wrapLayout = (content: ReactNode, sidebar: ReactNode) => inFlow
    ? <CreateProjectFlowLayout screen="planUpload" flow={flow}>{content}</CreateProjectFlowLayout>
    : (
      <LayoutWithPanel>
        <ContentContainer>{content}</ContentContainer>
        <SidebarPanel>{sidebar}</SidebarPanel>
      </LayoutWithPanel>
    );

  return (
    <>
      <PageHeader
        title="Upload a DMSP"
        description="You can upload a Data Management Plan (DMP) that was created elsewhere and add it to your project. Uploaded plans can be tracked by your organization administrators but cannot be edited in the same way a plan created in the DMP Tool can."
        showBackButton={!inFlow}
        breadcrumbs={
          <Breadcrumbs>
            <Breadcrumb>
              <Link href="/">Home</Link>
            </Breadcrumb>
            <Breadcrumb>
              <Link href="/projects">Projects</Link>
            </Breadcrumb>
          </Breadcrumbs>
        }
        className="page-project-create-project-funding"
      />
      {wrapLayout(<>
          <ErrorMessages errors={serverErrors} ref={errorRef} />
          <Form onSubmit={handleSubmit}
            data-testid="upload-form"
            aria-labelledby="upload-form">
            <h2 id="upload-form" className="heading-3">Upload a Data Management Plan (DMP)</h2>
            <p>PDF, DOC, or DOCX files only</p>


            <DropZone
              onDrop={handleDrop}
              aria-label="Drop a file here to upload"
            >
              <FileTrigger
                allowsMultiple={false}
                onSelect={(files) => {
                  if (files && files[0]) {
                    const selectedFile = files[0];
                    handleFileSelect(selectedFile);
                  }
                }}
              >
                <Button>Select a file</Button>
              </FileTrigger>

              <p>
                {fileName
                  ? `Uploaded file: ${fileName}`
                  : 'Drop a file here or click to select'}
              </p>


              {error && (
                <Text
                  className="error"
                  role="alert"
                >
                  {error}
                </Text>
              )}
            </DropZone>

            <FlowActions>
              <Button
                type="submit"
                isDisabled={uploading}
              >
                Upload
              </Button>
            </FlowActions>
          </Form>
        </>, <>
          <h2>Best Practice by DMP Tool</h2>
          <p>
            <strong>Recommend: online plan creator</strong>
          </p>
          <p>
            To ensure your submission meets all necessary standards and
            guidelines, we strongly advise using our online plan creator instead
            of uploading PDF or DOC files. Here’s why:
          </p>
          <ul>
            <li>
              <strong>Funder and Organization Requirements:</strong> The online
              tool is tailored to meet specific requirements set by the funder
              and our organization, ensuring your plan aligns perfectly with
              their expectations.
            </li>
            <li>
              <strong>Guidance:</strong> The online creator provides
              step-by-step guidance on how to effectively answer questions,
              which is not available in standard document formats.
            </li>
            <li>
              <strong>Portability:</strong> Plans created online are easier to
              share and access across different platforms, making them more
              versatile than documents in PDF or DOC formats.
            </li>
          </ul>
          <p>
            For a smooth and successful submission please adhere to using our
            designated online tool. Thank you for your cooperation!
          </p>
        </>)}
    </>
  );
};

export default PlanCreateUpload;
