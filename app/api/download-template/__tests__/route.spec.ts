/**
 * @jest-environment node
 */
import { NextRequest } from 'next/server';
import { GET } from '../route';

jest.mock('@/utils/server/logger', () => {
  const mockError: jest.Mock = jest.fn();
  const mockInfo: jest.Mock = jest.fn();

  return {
    __esModule: true,
    createLogger: jest.fn(() => ({ error: mockError, info: mockInfo })),
    mockError,
    mockInfo,
  };
});

import { createLogger } from '@/utils/server/logger';
const logger = createLogger();

global.fetch = jest.fn();

const DOCX_TYPE = 'application/vnd.openxmlformats-officedocument.wordprocessingml.document';

const request = (query: string) => new NextRequest(`http://localhost:3000/api/download-template${query}`);

const okResponse = (contentType: string | null, disposition: string | null) => ({
  ok: true,
  status: 200,
  blob: jest.fn().mockResolvedValue(new Blob(['file content'], { type: contentType ?? '' })),
  headers: {
    get: jest.fn((header: string) => {
      if (header === 'Content-Type') return contentType;
      if (header === 'Content-Disposition') return disposition;
      return null;
    }),
  },
});

describe('GET /api/download-template', () => {
  beforeEach(() => {
    jest.clearAllMocks();
    delete process.env.NARRATIVE_SERVICE_URL;
  });

  describe('Validation', () => {
    it('should return 400 when the versionedTemplateId is missing', async () => {
      const response = await GET(request('?format=pdf'));

      expect(response.status).toBe(400);
      expect(await response.json()).toEqual({ error: 'versionedTemplateId must be a number' });
      expect(global.fetch).not.toHaveBeenCalled();
    });

    it('should return 400 when the versionedTemplateId is not a number, so it cannot change the URL', async () => {
      const response = await GET(request('?versionedTemplateId=12/../../dmps&format=pdf'));

      expect(response.status).toBe(400);
      expect(global.fetch).not.toHaveBeenCalled();
    });

    it('should return 400 for formats other than pdf and docx', async () => {
      const response = await GET(request('?versionedTemplateId=12&format=csv'));

      expect(response.status).toBe(400);
      expect(await response.json()).toEqual({ error: 'format must be pdf or docx' });
      expect(global.fetch).not.toHaveBeenCalled();
    });
  });

  describe('Successful requests', () => {
    it('should fetch the DOCX from the narrative generator without sending any cookies', async () => {
      (global.fetch as jest.Mock).mockResolvedValue(
        okResponse(DOCX_TYPE, 'attachment; filename="NSF_Polar_Programs_v6.docx"')
      );

      const response = await GET(request('?versionedTemplateId=317&format=docx'));

      expect(global.fetch).toHaveBeenCalledWith(
        'http://localhost:4030/templates/317/narrative.docx',
        { headers: { Accept: DOCX_TYPE } }
      );
      expect(response.status).toBe(200);
      expect(response.headers.get('Content-Type')).toBe(DOCX_TYPE);
      expect(response.headers.get('Content-Disposition')).toBe('attachment; filename="NSF_Polar_Programs_v6.docx"');
      expect(await response.text()).toBe('file content');
    });

    it('should default to a PDF and use NARRATIVE_SERVICE_URL', async () => {
      process.env.NARRATIVE_SERVICE_URL = 'https://narrative.example.org';
      (global.fetch as jest.Mock).mockResolvedValue(okResponse('application/pdf', 'inline; filename="Template_v1.pdf"'));

      const response = await GET(request('?versionedTemplateId=5'));

      expect(global.fetch).toHaveBeenCalledWith(
        'https://narrative.example.org/templates/5/narrative.pdf',
        { headers: { Accept: 'application/pdf' } }
      );
      expect(response.status).toBe(200);
      expect(response.headers.get('Content-Type')).toBe('application/pdf');
    });

    it('should fall back to the requested type and an attachment when the narrative generator sends no headers', async () => {
      (global.fetch as jest.Mock).mockResolvedValue(okResponse(null, null));

      const response = await GET(request('?versionedTemplateId=5&format=PDF'));

      expect(response.headers.get('Content-Type')).toBe('application/pdf');
      expect(response.headers.get('Content-Disposition')).toBe('attachment');
    });
  });

  describe('Errors', () => {
    it('should return 404 when the template is not published or not public', async () => {
      (global.fetch as jest.Mock).mockResolvedValue({ ok: false, status: 404, statusText: 'Not Found' });

      const response = await GET(request('?versionedTemplateId=999&format=pdf'));

      expect(response.status).toBe(404);
      expect(await response.json()).toEqual({ error: 'Template not found' });
      expect(logger.error).toHaveBeenCalled();
    });

    it('should pass other narrative generator errors through', async () => {
      (global.fetch as jest.Mock).mockResolvedValue({ ok: false, status: 500, statusText: 'Internal Server Error' });

      const response = await GET(request('?versionedTemplateId=5&format=docx'));

      expect(response.status).toBe(500);
      expect(await response.json()).toEqual({ error: 'Unable to download the Template' });
    });

    it('should return 500 when the narrative generator cannot be reached', async () => {
      (global.fetch as jest.Mock).mockRejectedValue(new Error('ECONNREFUSED'));

      const response = await GET(request('?versionedTemplateId=5&format=pdf'));

      expect(response.status).toBe(500);
      expect(await response.json()).toEqual({ error: 'Failed to fetch the Template' });
      expect(logger.error).toHaveBeenCalled();
    });
  });
});
