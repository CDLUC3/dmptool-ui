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

  const slugParts = Array.isArray(params.slug) ? params.slug : [params.slug ?? ''];
  const rawDoi = slugParts.join('/');
  const dmpId = rawDoi.startsWith('https://doi.org/')
    ? rawDoi
    : `https://doi.org/${rawDoi}`;
  const shortDoi = rawDoi.replace('https://doi.org/', '');

  // Define URLs early so they're available for both archived and live views
  const pdfDownloadParams = new URLSearchParams({
    dmpId: shortDoi,
    ...(versionParam && { version: versionParam }),
    includeCoverPage: 'true',
    includeSectionHeadings: 'true',
    includeQuestionText: 'true',
  });
  const pdfDownloadUrl = `/api/download-narrative?${pdfDownloadParams.toString()}`;
  const jsonUrl = `${process.env.NEXT_PUBLIC_NARRATIVE_SERVICE_URL}/dmps/${shortDoi}/narrative.json`;

  // Use a single query with version="latest" for current, or the versionParam if present
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
          <h2>{versionParam ? 'Version Not Found' : 'DMP Not Found'}</h2>
          <p>
            {versionParam
              ? `We could not find version ${versionParam} of this data management plan.`
              : `We could not find a published data management plan for ${shortDoi}. This plan may be private, or the identifier may be incorrect.`
            }
          </p>
        </div>
      </div>
    );
  }

  const canDownloadPdf = snapshot.visibility === PlanVisibility.Public;

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
        setError(t('errors.failedToDownloadPDF'));
        logECS("error", "handleDownloadPdf", {
          error,
          url: { path: routePath("dmp.landing", { slug: shortDoi }) },
        });
        return;
      }

      const blob = await response.blob();
      const url = window.URL.createObjectURL(blob);
      const link = document.createElement('a');
      link.href = url;
      link.download = `${snapshot.title || 'Untitled DMP'}.pdf`;
      document.body.appendChild(link);
      link.click();

      document.body.removeChild(link);
      window.URL.revokeObjectURL(url);
    } catch (error) {
      setError(t('errors.failedToDownloadPDF'));
      logECS("error", "handleDownloadPdf", {
        error,
        url: { path: routePath("dmp.landing", { slug: shortDoi }) },
      });
    }
  };

  console.log("***Snapshot", snapshot);

  return (
    <>
      <ErrorMessages errors={[error ?? '']} ref={errorRef} />
      <ArchivedPlanView
        snapshot={snapshot}
        jsonUrl={jsonUrl}
        pdfDownloadUrl={pdfDownloadUrl}
        canDownloadPdf={canDownloadPdf}
        handleDownloadPdfAction={handleDownloadPdf}
        writtenForOrg={snapshot?.owner
          ? {
            name: snapshot.owner.name ?? 'Unknown',
            displayName: snapshot.owner.displayName,
            homepage: snapshot.owner.homepage,
          }
          : undefined}
        dmpId={dmpId}
      />
    </>
  );
}