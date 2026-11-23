import { NextRequest, NextResponse } from 'next/server';
import { createLogger } from '@/utils/server/logger';

const logger = createLogger();

// The formats dmptool-narrative-generator can produce for a Template, and the type it returns for each
const TEMPLATE_FORMATS: Record<string, string> = {
  pdf: 'application/pdf',
  docx: 'application/vnd.openxmlformats-officedocument.wordprocessingml.document',
};

// Download a blank published Template (its sections and questions) as a PDF or DOCX.
//    - used by the public Funder Requirements page, so no login is required. The narrative
//      generator only returns the current published version of a public Template
export async function GET(request: NextRequest) {
  const searchParams = request.nextUrl.searchParams;
  const versionedTemplateId = searchParams.get('versionedTemplateId') ?? '';
  const format = (searchParams.get('format') || 'pdf').toLowerCase();

  // The id is added to the narrative generator's URL, so only accept a number
  if (!/^\d+$/.test(versionedTemplateId)) {
    return NextResponse.json({ error: 'versionedTemplateId must be a number' }, { status: 400 });
  }
  if (!TEMPLATE_FORMATS[format]) {
    return NextResponse.json({ error: 'format must be pdf or docx' }, { status: 400 });
  }

  const narrativeServiceBase = process.env.NARRATIVE_SERVICE_URL || 'http://localhost:4030';
  const narrativeUrl = `${narrativeServiceBase}/templates/${versionedTemplateId}/narrative.${format}`;

  try {
    // No cookies are sent: the endpoint is public, and the access token is not needed
    const response = await fetch(narrativeUrl, { headers: { Accept: TEMPLATE_FORMATS[format] } });

    if (!response.ok) {
      logger.error({
        status: response.status,
        statusText: response.statusText,
        url: narrativeUrl,
      }, 'Narrative service returned an error for a Template download');
      // A 404 means the Template is not published or not public
      const error = response.status === 404 ? 'Template not found' : 'Unable to download the Template';
      return NextResponse.json({ error }, { status: response.status });
    }

    const blob = await response.blob();
    return new NextResponse(blob, {
      status: 200,
      headers: {
        'Content-Type': response.headers.get('Content-Type') || TEMPLATE_FORMATS[format],
        'Content-Disposition': response.headers.get('Content-Disposition') || 'attachment',
      },
    });
  } catch (error) {
    logger.error({
      error,
      route: '/api/download-template',
    }, 'Error downloading Template');
    return NextResponse.json({ error: 'Failed to fetch the Template' }, { status: 500 });
  }
}
