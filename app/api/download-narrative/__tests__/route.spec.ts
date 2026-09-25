/**
 * @jest-environment node
 */
import { NextRequest } from 'next/server';
import { GET } from '../route';
import { cookies } from 'next/headers';

// Mock the logger
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

const authHeaders = {
  Cookie: 'dmspt=test-token',
  Authorization: 'Bearer test-token',
};
import { createLogger } from '@/utils/server/logger';
const logger = createLogger();

// Mock the cookies function
jest.mock('next/headers', () => ({
  cookies: jest.fn(),
}));

// Mock global fetch
global.fetch = jest.fn();

describe('GET /api/download-narrative', () => {
  /* eslint-disable @typescript-eslint/no-explicit-any */
  let mockCookieStore: any;

  beforeEach(() => {
    jest.clearAllMocks();

    // Setup default cookie store mock
    mockCookieStore = {
      get: jest.fn((name: string) => (name === 'dmspt' ? { value: 'test-token' } : undefined)),
    };

    (cookies as jest.Mock).mockResolvedValue(mockCookieStore);

    // Reset environment variables
    delete process.env.NARRATIVE_SERVICE_URL;
  });

  afterEach(() => {
    jest.resetAllMocks();
  });

  describe('Validation', () => {
    it('should return 400 error when dmpId is missing', async () => {
      const request = new NextRequest('http://localhost:3000/api/download-narrative');

      const response = await GET(request);
      const data = await response.json();

      expect(response.status).toBe(400);
      expect(data).toEqual({ error: 'dmpId is required' });
    });
  });

  describe('Successful requests', () => {
    it('should successfully fetch and return a PDF blob', async () => {
      const mockBlob = new Blob(['PDF content'], { type: 'application/pdf' });
      const mockResponse = {
        ok: true,
        blob: jest.fn().mockResolvedValue(mockBlob),
        headers: {
          get: jest.fn((header: string) => {
            if (header === 'Content-Type') return 'application/pdf';
            if (header === 'Content-Disposition') return 'attachment; filename="narrative.pdf"';
            return null;
          }),
        },
      };

      (global.fetch as jest.Mock).mockResolvedValue(mockResponse);

      const request = new NextRequest(
        'http://localhost:3000/api/download-narrative?dmpId=10.1234/test-doi'
      );

      const response = await GET(request);

      expect(response.status).toBe(200);
      expect(global.fetch).toHaveBeenCalledWith(
        'http://localhost:4030/dmps/10.1234%2Ftest-doi/narrative',
        {
          headers: {
            Accept: 'application/pdf',
            ...authHeaders,
          },
        }
      );

      // Verify response headers
      expect(response.headers.get('Content-Type')).toBe('application/pdf');
      expect(response.headers.get('Content-Disposition')).toBe('attachment; filename="narrative.pdf"');
    });

    it('should use custom NARRATIVE_SERVICE_URL when provided', async () => {
      process.env.NARRATIVE_SERVICE_URL = 'https://narrative.example.com';

      const mockBlob = new Blob(['content']);
      const mockResponse = {
        ok: true,
        blob: jest.fn().mockResolvedValue(mockBlob),
        headers: {
          get: jest.fn(() => null),
        },
      };

      (global.fetch as jest.Mock).mockResolvedValue(mockResponse);

      const request = new NextRequest(
        'http://localhost:3000/api/download-narrative?dmpId=test-id'
      );

      await GET(request);

      expect(global.fetch).toHaveBeenCalledWith(
        'https://narrative.example.com/dmps/test-id/narrative',
        expect.any(Object)
      );
    });

    it('should properly encode dmpId with special characters', async () => {
      const mockBlob = new Blob(['content']);
      const mockResponse = {
        ok: true,
        blob: jest.fn().mockResolvedValue(mockBlob),
        headers: {
          get: jest.fn(() => null),
        },
      };

      (global.fetch as jest.Mock).mockResolvedValue(mockResponse);

      const dmpId = '10.1234/abc/def';
      const request = new NextRequest(
        `http://localhost:3000/api/download-narrative?dmpId=${encodeURIComponent(dmpId)}`
      );

      await GET(request);

      expect(global.fetch).toHaveBeenCalledWith(
        'http://localhost:4030/dmps/10.1234%2Fabc%2Fdef/narrative',
        expect.any(Object)
      );
    });

    it('should forward additional query parameters to narrative service', async () => {
      const mockBlob = new Blob(['content']);
      const mockResponse = {
        ok: true,
        blob: jest.fn().mockResolvedValue(mockBlob),
        headers: {
          get: jest.fn(() => null),
        },
      };

      (global.fetch as jest.Mock).mockResolvedValue(mockResponse);

      const request = new NextRequest(
        'http://localhost:3000/api/download-narrative?dmpId=test-id&format=docx&version=2'
      );

      await GET(request);

      const fetchUrl = (global.fetch as jest.Mock).mock.calls[0][0];
      expect(fetchUrl).toContain('format=docx');
      expect(fetchUrl).toContain('version=2');
      expect(fetchUrl).not.toContain('dmpId=');
    });

    it('should use custom Accept header when provided', async () => {
      const mockBlob = new Blob(['content']);
      const mockResponse = {
        ok: true,
        blob: jest.fn().mockResolvedValue(mockBlob),
        headers: {
          get: jest.fn(() => null),
        },
      };

      (global.fetch as jest.Mock).mockResolvedValue(mockResponse);

      const request = new NextRequest(
        'http://localhost:3000/api/download-narrative?dmpId=test-id',
        {
          headers: {
            accept: 'application/vnd.openxmlformats-officedocument.wordprocessingml.document',
          },
        }
      );

      await GET(request);

      expect(global.fetch).toHaveBeenCalledWith(
        expect.any(String),
        {
          headers: {
            Accept: 'application/vnd.openxmlformats-officedocument.wordprocessingml.document',
            ...authHeaders
          },
        }
      );
    });

    it('should default to application/pdf when Accept header is not provided', async () => {
      const mockBlob = new Blob(['content']);
      const mockResponse = {
        ok: true,
        blob: jest.fn().mockResolvedValue(mockBlob),
        headers: {
          get: jest.fn(() => null),
        },
      };

      (global.fetch as jest.Mock).mockResolvedValue(mockResponse);

      const request = new NextRequest(
        'http://localhost:3000/api/download-narrative?dmpId=test-id'
      );

      await GET(request);

      expect(global.fetch).toHaveBeenCalledWith(
        expect.any(String),
        {
          headers: {
            Accept: 'application/pdf',
            ...authHeaders
          },
        }
      );
    });

    it('should use default Content-Type when not provided by narrative service', async () => {
      const mockBlob = new Blob(['content']);
      const mockResponse = {
        ok: true,
        blob: jest.fn().mockResolvedValue(mockBlob),
        headers: {
          get: jest.fn(() => null),
        },
      };

      (global.fetch as jest.Mock).mockResolvedValue(mockResponse);

      const request = new NextRequest(
        'http://localhost:3000/api/download-narrative?dmpId=test-id'
      );

      const response = await GET(request);

      expect(response.headers.get('Content-Type')).toBe('application/octet-stream');
      expect(response.headers.get('Content-Disposition')).toBe('attachment');
    });
  });

  describe('Error handling', () => {
    it('should return error when narrative service returns non-ok response', async () => {
      const mockResponse = {
        ok: false,
        status: 404,
        statusText: 'Not Found',
      };

      (global.fetch as jest.Mock).mockResolvedValue(mockResponse);

      const request = new NextRequest(
        'http://localhost:3000/api/download-narrative?dmpId=test-id'
      );

      const response = await GET(request);
      const data = await response.json();

      expect(response.status).toBe(404);
      expect(data).toEqual({ error: 'Narrative service error: Not Found' });
    });

    it('should return 500 error when fetch throws an exception', async () => {
      (global.fetch as jest.Mock).mockRejectedValue(new Error('Network error'));

      const request = new NextRequest(
        'http://localhost:3000/api/download-narrative?dmpId=test-id'
      );

      const response = await GET(request);
      const data = await response.json();

      expect(response.status).toBe(500);
      expect(data).toEqual({ error: 'Failed to fetch narrative' });
      expect(logger.error).toHaveBeenCalledWith(
        {
          error: expect.any(Error),
          route: '/api/download-narrative',
        },
        'Error downloading plan narrative'
      );
    });

    it('should handle errors when getting cookies', async () => {
      (cookies as jest.Mock).mockRejectedValue(new Error('Cookie error'));

      const request = new NextRequest(
        'http://localhost:3000/api/download-narrative?dmpId=test-id'
      );

      const response = await GET(request);
      const data = await response.json();

      expect(response.status).toBe(500);
      expect(data).toEqual({ error: 'Failed to fetch narrative' });
    });

    it('should handle errors when converting response to blob', async () => {
      const mockResponse = {
        ok: true,
        blob: jest.fn().mockRejectedValue(new Error('Blob conversion error')),
        headers: {
          get: jest.fn(() => null),
        },
      };

      (global.fetch as jest.Mock).mockResolvedValue(mockResponse);

      const request = new NextRequest(
        'http://localhost:3000/api/download-narrative?dmpId=test-id'
      );

      const response = await GET(request);
      const data = await response.json();

      expect(response.status).toBe(500);
      expect(data).toEqual({ error: 'Failed to fetch narrative' });
      expect(logger.error).toHaveBeenCalled();
    });
  });

  describe('Cookie handling', () => {
    const okResponse = () => ({
      ok: true,
      blob: jest.fn().mockResolvedValue(new Blob(['content'])),
      headers: { get: jest.fn(() => null) },
    });


    it('should forward only the dmspt token as a cookie and bearer token', async () => {
      // Every other cookie returns a value too, to prove only dmspt is sent
      mockCookieStore.get.mockImplementation((name: string) =>
        name === 'dmspt' ? { value: 'token123' } : { value: 'should-not-be-sent' }
      );
      (global.fetch as jest.Mock).mockResolvedValue(okResponse());

      await GET(new NextRequest('http://localhost:3000/api/download-narrative?dmpId=test-id'));

      expect(global.fetch).toHaveBeenCalledWith(
        expect.any(String),
        {
          headers: {
            Accept: 'application/pdf',
            Cookie: 'dmspt=token123',
            Authorization: 'Bearer token123',
          },
        }
      );
    });

    it('should send no auth headers when there is no dmspt cookie', async () => {
      mockCookieStore.get.mockReturnValue(undefined);
      (global.fetch as jest.Mock).mockResolvedValue(okResponse());

      await GET(new NextRequest('http://localhost:3000/api/download-narrative?dmpId=test-id'));

      expect(global.fetch).toHaveBeenCalledWith(
        expect.any(String),
        { headers: { Accept: 'application/pdf' } }
      );
    });
  });
});
