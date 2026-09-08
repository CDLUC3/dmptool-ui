'use client';

import { useRef, useState } from 'react';
import {
  useParams,
  useSearchParams
} from 'next/navigation';
import { useTranslations } from 'next-intl';
import { useQuery } from '@apollo/client/react';
import {
  PlanVisibility,
  PublicPlanVersionByDmpIdDocument
} from '@/generated/graphql';

// Components
import Loading from '@/components/Loading';
import ErrorMessages from "@/components/ErrorMessages";

// Utils and other
import { logECS, routePath } from "@/utils/index";
import styles from './landing.module.scss';
import ArchivedPlanView from './ArchivedPlanView';

export default function DmpLandingPage() {
  const params = useParams();
  const searchParams = useSearchParams();
  const versionParam = searchParams.get('version');

  // Errors
  const [error, setError] = useState<string | null>(null);
  const errorRef = useRef<HTMLDivElement | null>(null);

  // Localization keys
  const t = useTranslations('LandingPage');

  // Extract the DMP ID from the slug, which may be a DOI or a URL
  const slugParts = Array.isArray(params.slug) ? params.slug : [params.slug ?? ''];
  const rawDoi = slugParts.join('/');
  const dmpId = rawDoi.startsWith('https://doi.org/')
    ? rawDoi
    : `https://doi.org/${rawDoi}`;
  const shortDoi = rawDoi.replace('https://doi.org/', '');

  // Define URLs early so they're available for both archived and live views
  const pdfDownloadParams = new URLSearchParams({
    dmpId: shortDoi,
    format: 'pdf',
    ...(versionParam && { version: versionParam }),
    includeCoverPage: 'true',
    includeSectionHeadings: 'true',
    includeQuestionText: 'true',
  });
  // For PDF download
  const pdfDownloadUrl = `/api/download-narrative?${pdfDownloadParams.toString()}`;
  // To view JSON
  const jsonUrl = `/api/download-narrative?dmpId=${encodeURIComponent(shortDoi)}&format=json`;

  // GraphQL Query - Use a single query with version="latest" for current, or the versionParam if present
  const {
    data: planData,
    loading: planLoading,
    error: planError,
  } = useQuery(PublicPlanVersionByDmpIdDocument, {
    variables: {
      dmpId,
      version: versionParam ?? 'latest'
    },
  });

  if (planLoading) {
    return (
      <div className={styles.landingPage}>
        <div className={styles.loadingState}>
          <Loading />
        </div>
      </div>
    );
  }

  const snapshot = planData?.publicPlanVersionByDMPId;

  if (!snapshot || planError) {
    return (
      <div className={styles.landingPage}>
        <div className={styles.notFound}>
          <h2>{versionParam ? t('messages.versionNotFound') : t('messages.dmpNotFound')}</h2>
          <p>
            {versionParam
              ? t('messages.cannotFindVersion', { version: versionParam })
              : t('messages.planNotFound', { shortDoi })
            }
          </p>
        </div>
      </div>
    );
  }

  // Determine if the PDF can be downloaded based on the plan's visibility
  const canDownloadPdf = snapshot.visibility === PlanVisibility.Public;

  // Handle PDF download of plan
  const handleDownloadPdf = async () => {
    if (!canDownloadPdf) {
      setError(t('errors.pdfNotAvailable'));
      return;
    }
    try {
      const response = await fetch(pdfDownloadUrl, {
        headers: { Accept: 'application/pdf' },
      });

      if (!response.ok) {
        const message = t('errors.failedToDownloadPDF');
        setError(message);
        logECS("error", "handleDownloadPdf", {
          error: t('errors.failedToDownloadWithStatus', { status: response.status }),
          url: { path: routePath("dmp.landing", { slug: shortDoi }) },
        });
        return;
      }

      const blob = await response.blob();
      const url = window.URL.createObjectURL(blob);
      const link = document.createElement('a');
      link.href = url;
      link.download = `${snapshot.title || snapshot.project?.title || t('untitledPlan')}.pdf`;
      document.body.appendChild(link);
      link.click();

      document.body.removeChild(link);
      window.URL.revokeObjectURL(url);
    } catch (err) {
      setError(t('errors.failedToDownloadPDF'));
      logECS("error", "handleDownloadPdf", {
        err,
        url: { path: routePath("dmp.landing", { slug: shortDoi }) },
      });
    }
  };


  return (
    <>
      <ErrorMessages errors={[error ?? '']} ref={errorRef} />
      <ArchivedPlanView
        snapshot={snapshot}
        jsonUrl={jsonUrl}
        canDownloadPdf={canDownloadPdf}
        handleDownloadPdfAction={handleDownloadPdf}
      />
    </>
  );
}