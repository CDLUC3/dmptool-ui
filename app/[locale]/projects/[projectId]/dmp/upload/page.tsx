'use client';

import React, { useState } from 'react';
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


import PageHeader from "@/components/PageHeader";
import {
  ContentContainer,
  LayoutWithPanel,
  SidebarPanel
} from "@/components/Container";
import { routePath } from '@/utils/routes';


const PlanCreateUpload = () => {
  const router = useRouter();
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


  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();

    if (!fileName) {
      setError('Please upload a valid file before submitting.');
      return;
    }

    // Perform further actions or navigation here
    router.push(routePath('projects.show', { projectId: 'proj_2425' }))
  };

  return (
    <>
      <PageHeader
        title="Upload a DMSP"
        description="You can upload a Data Management Plan (DMP) that was created elsewhere and add it to your project. Uploaded plans can be tracked by your organization administrators but cannot be edited in the same way a plan created in the DMP Tool can."
        showBackButton={true}
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
      <LayoutWithPanel>
        <ContentContainer>
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

            {/* Submit Button */}
            <Button
              type="submit"
            >
              Upload
            </Button>
          </Form>
        </ContentContainer>

        {/* Sidebar Panel */}
        <SidebarPanel>
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
        </SidebarPanel>
      </LayoutWithPanel>


    </>
  );
};

export default PlanCreateUpload;
