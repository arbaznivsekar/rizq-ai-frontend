import { NextRequest, NextResponse } from 'next/server';
import { NextApiRequest, NextApiResponse } from 'next';

/**
 * PDF Proxy Route  
 * 
 * Proxies PDF downloads from external resume service with secure API key handling.
 * Updated to call external service directly instead of backend.
 * 
 * Usage: GET /api/proxy-pdf?fileId=<fileId>
 */
export async function GET(request: NextRequest) {
  try {
    const searchParams = request.nextUrl.searchParams;
    const fileId = searchParams.get('fileId');
    const id = searchParams.get('id');
    const baseUrl = searchParams.get('baseUrl');

    const fullUrl = `${baseUrl}/api/download-pdf?fileId=${fileId}&id=${id}`;

    console.log("fullUrl", fullUrl);
    if (!fullUrl) {
      return NextResponse.json(
        { error: 'Missing fullUrl parameter' },
        { status: 400 }
      );
    }

    // Get external service configuration
    // const externalServiceUrl = process.env.EXTERNAL_PDF_SERVICE_URL;
    // const externalApiKey = process.env.EXTERNAL_SERVICE_API_KEY;

    // if (!externalServiceUrl || !externalApiKey) {
    //   console.error('❌ External service environment variables not set');
    //   console.error('Missing:', {
    //     url: !externalServiceUrl,
    //     apiKey: !externalApiKey
    //   });
    //   return NextResponse.json(
    //     { error: 'External service is not configured' },
    //     { status: 500 }
    //   );
    // }

    // Construct the external service PDF URL
    // ADJUST THIS BASED ON YOUR EXTERNAL SERVICE API
    // Fetch the PDF from external service
    const response = await fetch(fullUrl, {
      method: 'GET',
      headers: {
        'Accept': 'application/pdf',
      },
    });

    if (!response.ok) {
      const errorText = await response.text();
      console.error(`❌ Failed to fetch PDF: ${response.status} ${response.statusText}`);
      console.error(`📄 Error response:`, errorText);
      
      if (response.status === 404) {
        return NextResponse.json(
          { error: 'PDF not found' },
          { status: 404 }
        );
      }
      
      if (response.status === 401 || response.status === 403) {
        return NextResponse.json(
          { error: 'Authentication failed with external service' },
          { status: 401 }
        );
      }
      
      return NextResponse.json(
        { error: `Failed to fetch PDF from external service: ${response.statusText}` },
        { status: response.status }
      );
    }

    // Get the PDF content
    const pdfBuffer = await response.arrayBuffer();

    console.log(`✅ Successfully fetched PDF (${pdfBuffer.byteLength} bytes)`);

    // Return the PDF with appropriate headers
    return new NextResponse(pdfBuffer, {
      status: 200,
      headers: {
        'Content-Type': 'application/pdf',
        'Content-Disposition': `inline; filename="resume.pdf"`,
        'Cache-Control': 'public, max-age=3600',
        'X-Content-Type-Options': 'nosniff',
      },
    });

  } catch (error: any) {
    console.error('❌ Error in PDF proxy route:', error);
    console.error('Stack:', error.stack);
    return NextResponse.json(
      { 
        error: 'Internal server error while fetching PDF',
        details: process.env.NODE_ENV === 'development' ? error.message : undefined
      },
      { status: 500 }
    );
  }
}
