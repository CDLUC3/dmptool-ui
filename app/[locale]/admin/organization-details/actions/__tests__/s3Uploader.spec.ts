/**
 * @jest-environment node
 */
import { uploadFileToS3 } from '../s3Uploader';

jest.mock('@/utils/server/logger', () => {
  const mockError: jest.Mock = jest.fn();
  const mockInfo: jest.Mock = jest.fn();

  return {
    __esModule: true,
    createLogger: jest.fn(() => ({
      error: mockError,
      info: mockInfo,
    })),
    default: {
      error: mockError,
      info: mockInfo,
    },
    mockError,
    mockInfo,
  };
});

import { createLogger } from '@/utils/server/logger';
const logger = createLogger();

global.fetch = jest.fn();

function buildFormData(fields?: { bucket?: string; key?: string; file?: Blob }): FormData {
  const formData = new FormData();
  if (fields?.bucket !== undefined) formData.append('bucket', fields.bucket);
  if (fields?.key !== undefined) formData.append('key', fields.key);
  if (fields?.file !== undefined) formData.append('file', fields.file);
  return formData;
}

describe('uploadFileToS3', () => {
  const awsUrl = 'https://local-s3-bucket.s3.us-west-2.amazonaws.com/';

  beforeEach(() => {
    jest.clearAllMocks();
    delete process.env.LOCALSTACK_ENDPOINT;
  });

  afterEach(() => {
    jest.resetAllMocks();
    delete process.env.LOCALSTACK_ENDPOINT;
  });

  it('returns an error when targetURL is missing', async () => {
    const formData = buildFormData({ bucket: 'local-s3-bucket', key: 'logos/logo.png' });

    const response = await uploadFileToS3('', formData);

    expect(response).toEqual({
      success: false,
      error: 'No target URL and/or form data were provided',
    });
    expect(global.fetch).not.toHaveBeenCalled();
  });

  it('returns an error when formData is missing', async () => {
    const response = await uploadFileToS3(
      awsUrl,
      undefined as unknown as FormData
    );

    expect(response).toEqual({
      success: false,
      error: 'No target URL and/or form data were provided',
    });
    expect(global.fetch).not.toHaveBeenCalled();
  });

  it('returns an error when key or bucket is missing', async () => {
    const formData = buildFormData({ bucket: 'local-s3-bucket' });

    const response = await uploadFileToS3(awsUrl, formData);

    expect(response).toEqual({
      success: false,
      error: 'Critical S3 information was not provided',
    });
    expect(global.fetch).not.toHaveBeenCalled();
  });

  it('returns success and key when S3 responds with ok=true', async () => {
    (global.fetch as jest.Mock).mockResolvedValue({
      ok: true,
      status: 200,
      text: jest.fn().mockResolvedValue(''),
    });

    const formData = buildFormData({
      bucket: 'local-s3-bucket',
      key: 'logos/logo.png',
      file: new Blob(['image-bytes'], { type: 'image/png' }),
    });

    const response = await uploadFileToS3(awsUrl, formData);

    expect(response).toEqual({ success: true, key: 'logos/logo.png' });
    expect(global.fetch).toHaveBeenCalledWith(awsUrl, {
      method: 'POST',
      body: formData,
    });
    expect(logger.info).toHaveBeenCalledWith(
      { url: awsUrl, bucket: 'local-s3-bucket', key: 'logos/logo.png' },
      'Proxying logo upload to S3'
    );
  });

  it('returns success when S3 responds with status 204', async () => {
    (global.fetch as jest.Mock).mockResolvedValue({
      ok: true,
      status: 204,
      text: jest.fn().mockResolvedValue(''),
    });

    const formData = buildFormData({ bucket: 'local-s3-bucket', key: 'logos/logo.png' });
    const response = await uploadFileToS3(awsUrl, formData);

    expect(response).toEqual({ success: true, key: 'logos/logo.png' });
  });

  it('returns error with S3 response body when S3 returns non-ok status', async () => {
    (global.fetch as jest.Mock).mockResolvedValue({
      ok: false,
      status: 403,
      text: jest.fn().mockResolvedValue('<Error>AccessDenied</Error>'),
    });

    const formData = buildFormData({ bucket: 'local-s3-bucket', key: 'logos/logo.png' });
    const response = await uploadFileToS3(awsUrl, formData);

    expect(response).toEqual({
      success: false,
      error: 'S3 returned 403: <Error>AccessDenied</Error>',
    });
    expect(logger.error).toHaveBeenCalledWith(
      {
        status: 403,
        body: '<Error>AccessDenied</Error>',
        url: awsUrl,
      },
      'S3 upload failed'
    );
  });

  it('returns stringified error when fetch throws', async () => {
    (global.fetch as jest.Mock).mockRejectedValue(new Error('Network failure'));

    const formData = buildFormData({ bucket: 'local-s3-bucket', key: 'logos/logo.png' });
    const response = await uploadFileToS3(awsUrl, formData);

    expect(response).toEqual({
      success: false,
      error: 'Error: Network failure',
    });
    expect(logger.error).toHaveBeenCalledWith(
      {
        error: expect.any(Error),
        route: '/api/s3-proxy',
      },
      'Error proxying upload to S3'
    );
  });

  it('rewrites AWS URL to LocalStack URL when LOCALSTACK_ENDPOINT is set', async () => {
    process.env.LOCALSTACK_ENDPOINT = 'http://localhost:4566';

    (global.fetch as jest.Mock).mockResolvedValue({
      ok: true,
      status: 204,
      text: jest.fn().mockResolvedValue(''),
    });

    const formData = buildFormData({ bucket: 'local-s3-bucket', key: 'logos/logo.png' });
    await uploadFileToS3(awsUrl, formData);

    expect(global.fetch).toHaveBeenCalledWith('http://localhost:4566/local-s3-bucket', {
      method: 'POST',
      body: formData,
    });
    expect(logger.info).toHaveBeenCalledWith(
      {
        url: 'http://localhost:4566/local-s3-bucket',
        bucket: 'local-s3-bucket',
        key: 'logos/logo.png',
      },
      'Proxying logo upload to S3'
    );
  });

  it('keeps original URL when LOCALSTACK_ENDPOINT is set but URL is not amazonaws.com', async () => {
    process.env.LOCALSTACK_ENDPOINT = 'http://localhost:4566';
    const localUrl = 'http://localhost:4566/local-s3-bucket';

    (global.fetch as jest.Mock).mockResolvedValue({
      ok: true,
      status: 200,
      text: jest.fn().mockResolvedValue(''),
    });

    const formData = buildFormData({ bucket: 'local-s3-bucket', key: 'logos/logo.png' });
    await uploadFileToS3(localUrl, formData);

    expect(global.fetch).toHaveBeenCalledWith(localUrl, {
      method: 'POST',
      body: formData,
    });
  });
});

