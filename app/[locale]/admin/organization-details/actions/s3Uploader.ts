"use server";

import { createLogger } from '@/utils/server/logger';
import { S3UploadResponse } from "@/app/types";

const logger = createLogger();

/**
 * LocalStack uses AWS CLI commands, so it returns S3 style URLs when presigning URLs.
 * That doesn't work though when we want to upload a file to LocalStack, so we need to rewrite the URL.
 *
 * This is only applicable when the LOCALSTACK_ENDPOINT is set (running locally).
 */
function rewriteS3UrlToLocalStackEndpoint(url: string): string {
  // Only proceed with a rewrite if the LOCALSTACK_ENDPOINT ENV variable exists
  const localEndpoint = process.env.LOCALSTACK_ENDPOINT;
  if (!localEndpoint) return url;

  try {
    const parsed = new URL(url);

    // Only rewrite requests destined for real AWS S3
    if (!parsed.hostname.endsWith(".amazonaws.com")) return url;

    // Virtual-hosted-style: <bucket>.s3[.-]<region>.amazonaws.com
    const virtualHostedMatch = parsed.hostname.match(/^([^.]+)\.s3[.-]/);
    const base = new URL(localEndpoint);

    if (virtualHostedMatch) {
      const bucket = virtualHostedMatch[1];
      // Convert to LocalStack path-style: /bucket[/key]
      const keyPath = parsed.pathname === "/" ? "" : parsed.pathname;
      base.pathname = `/${bucket}${keyPath}`;
    } else {
      // Already path-style (s3.<region>.amazonaws.com/<bucket>/...)
      base.pathname = parsed.pathname;
    }

    base.search = parsed.search;
    return base.toString();
  } catch {
    // Malformed URL – just return as is and let the fetch call fail normally
    return url;
  }
}

/**
 * Server-side proxy for uploading files to an S3 presigned URL.
 */
export async function uploadFileToS3(targetURL: string, formData: FormData): Promise<S3UploadResponse> {
  if (!targetURL || !formData) {
    return { success: false, error: "No target URL and/or form data were provided" };
  }

  const bucket: FormDataEntryValue | null = formData.get("bucket");
  const key: FormDataEntryValue | null = formData.get("key");

  if (key === null || bucket === null) {
    return { success: false, error: "Critical S3 information was not provided" };
  }

  try {
    const url = rewriteS3UrlToLocalStackEndpoint(targetURL);
    logger.info({ url, bucket: bucket.toString(), key: key.toString() }, "Proxying logo upload to S3");

    // Forward the multipart/form-data to S3 exactly as-is. S3 is very strict about this matching what was defined
    // when generating the pre-signed URL.
    // Do NOT set Content-Type manually here – fetch will set the correct multipart boundary automatically.
    const s3Response = await fetch(url, { method: "POST", body: formData });

    if (s3Response.ok || s3Response.status === 204) {
      return { success: true, key: key.toString() };
    }

    const text = await s3Response.text();
    logger.error({ status: s3Response.status, body: text, url }, "S3 upload failed");
    return { success: false, error: `S3 returned ${s3Response.status}: ${text}` };

  } catch(error) {
    logger.error({ error, route: "/api/s3-proxy" }, "Error proxying upload to S3");
    return { success: false, error: String(error) };
  }
}
