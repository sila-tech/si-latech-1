import { NextRequest, NextResponse } from 'next/server';
import { generateQuotePdfDetails } from '@/lib/pdf-generator';
import { subdivideAreaToRooms, Room } from '@/lib/calculator';

// Valid API keys: environment variable or default fallback
const VALID_API_KEYS = new Set([
  process.env.SILACALC_API_KEY,
  process.env.WHATSAPP_VERIFY_TOKEN,
  'silatech_secret_2026'
].filter(Boolean) as string[]);

function authenticate(request: NextRequest): boolean {
  // Check x-api-key header
  const apiKeyHeader = request.headers.get('x-api-key');
  if (apiKeyHeader && VALID_API_KEYS.has(apiKeyHeader)) {
    return true;
  }

  // Check Authorization: Bearer <token>
  const authHeader = request.headers.get('authorization');
  if (authHeader && authHeader.startsWith('Bearer ')) {
    const bearerToken = authHeader.substring(7).trim();
    if (VALID_API_KEYS.has(bearerToken)) {
      return true;
    }
  }

  // Check URL query parameter ?api_key=<key>
  const searchParams = request.nextUrl.searchParams;
  const queryKey = searchParams.get('api_key') || searchParams.get('key');
  if (queryKey && VALID_API_KEYS.has(queryKey)) {
    return true;
  }

  return false;
}

export async function OPTIONS() {
  return new NextResponse(null, {
    status: 204,
    headers: {
      'Access-Control-Allow-Origin': '*',
      'Access-Control-Allow-Methods': 'GET, POST, OPTIONS',
      'Access-Control-Allow-Headers': 'Content-Type, Authorization, x-api-key',
    },
  });
}

export async function POST(request: NextRequest) {
  // 1. Authentication
  if (!authenticate(request)) {
    return NextResponse.json(
      {
        success: false,
        error: 'Unauthorized',
        message: 'Invalid or missing API key. Provide via "x-api-key" header or "Authorization: Bearer <token>".',
      },
      {
        status: 401,
        headers: {
          'Access-Control-Allow-Origin': '*',
        },
      }
    );
  }

  try {
    const body = await request.json();

    const clientName = body.clientName?.trim() || 'Valued Customer';
    const clientContact = body.clientContact?.trim() || body.phone?.trim() || body.contact?.trim() || 'N/A';
    const projectLocation = body.projectLocation?.trim() || body.siteLocation?.trim() || body.location?.trim() || '';
    const beamType = body.beamType === 'tbeam' ? 'tbeam' : 'flat';
    const unit = body.unit?.toLowerCase() === 'feet' || body.unit === 'ft' ? 'feet' : 'meters';
    const responseType = body.responseType?.toLowerCase(); // 'json' or 'pdf'
    const acceptHeader = request.headers.get('accept') || '';

    // Unit conversion helpers
    const toMeters = (val: number) => (unit === 'feet' ? Number((val / 3.28084).toFixed(3)) : Number(val));
    const toSqMeters = (val: number) => (unit === 'feet' ? Number((val / 10.7639).toFixed(3)) : Number(val));

    let roomsToQuote: Room[] = [];

    if (Array.isArray(body.rooms) && body.rooms.length > 0) {
      roomsToQuote = body.rooms.map((r: any, idx: number) => {
        const rawLength = Number(r.length) || 0;
        const rawWidth = Number(r.width) || 0;
        return {
          id: String(idx + 1),
          name: r.name ? String(r.name).trim() : `Room ${idx + 1}`,
          length: toMeters(rawLength),
          width: toMeters(rawWidth),
        };
      }).filter((r: Room) => r.length > 0 && r.width > 0);
    } else if (body.totalArea && Number(body.totalArea) > 0) {
      const areaM2 = toSqMeters(Number(body.totalArea));
      roomsToQuote = subdivideAreaToRooms(areaM2, 4.0, 3.8);
    }

    if (roomsToQuote.length === 0) {
      return NextResponse.json(
        {
          success: false,
          error: 'Bad Request',
          message: 'Please provide either a valid "rooms" array with positive length and width, or a positive "totalArea".',
          exampleBody: {
            clientName: "John Kamau",
            clientContact: "+254712345678",
            projectLocation: "Kiambu",
            beamType: "tbeam",
            rooms: [
              { name: "Living Room", length: 5.0, width: 4.0 },
              { name: "Bedroom", length: 4.0, width: 3.5 }
            ]
          }
        },
        {
          status: 400,
          headers: {
            'Access-Control-Allow-Origin': '*',
          },
        }
      );
    }

    const clientInfo = {
      clientName,
      clientContact,
      projectLocation,
      beamType,
      invoiceNumber: body.quoteReference || body.invoiceNumber,
    };

    const quoteDetails = await generateQuotePdfDetails(clientInfo, roomsToQuote);

    // If client specifically requested a raw PDF binary download
    if (responseType === 'pdf' || acceptHeader.includes('application/pdf')) {
      return new NextResponse(quoteDetails.buffer, {
        status: 200,
        headers: {
          'Content-Type': 'application/pdf',
          'Content-Disposition': `attachment; filename="Quote_${quoteDetails.invoiceNumber}.pdf"`,
          'X-Quote-Reference': quoteDetails.invoiceNumber,
          'X-Quote-Total': quoteDetails.totals.grandTotal.toString(),
          'X-Quote-Currency': 'KES',
          'Access-Control-Allow-Origin': '*',
        },
      });
    }

    // Default: JSON response with base64 PDF and calculated structural numbers
    return NextResponse.json(
      {
        success: true,
        quoteReference: quoteDetails.invoiceNumber,
        invoiceDate: quoteDetails.invoiceDate,
        client: {
          name: clientName,
          contact: clientContact,
          location: projectLocation || undefined,
        },
        structural: {
          beamType: beamType,
          beamTypeName: beamType === 'tbeam' ? 'Precast Concrete T-Beams' : 'Precast Concrete Flat Beams',
          blockTypeName: beamType === 'tbeam' ? 'Precast Hollow Concrete Blocks for T-Beams' : 'Precast Hollow Concrete Blocks (Standard 400x220mm)',
        },
        totals: {
          totalAreaSqMeters: quoteDetails.totals.totalArea,
          totalBeamLinearMeters: quoteDetails.totals.totalInvoiceBeamLength,
          totalBlocksCount: quoteDetails.totals.totalBlocks,
          beamPricePerMeter: quoteDetails.totals.beamPricePerMeter,
          blockPrice: quoteDetails.totals.blockPrice,
          beamsTotalCost: quoteDetails.totals.beamsTotal,
          blocksTotalCost: quoteDetails.totals.blocksTotal,
          grandTotalCost: quoteDetails.totals.grandTotal,
          currency: 'KES',
        },
        rooms: roomsToQuote.map((r) => ({
          name: r.name,
          lengthMeters: r.length,
          widthMeters: r.width,
          areaSqMeters: Number((r.length * r.width).toFixed(2)),
        })),
        pdf: {
          fileName: `Quote_${quoteDetails.invoiceNumber}.pdf`,
          mimeType: 'application/pdf',
          base64: quoteDetails.buffer.toString('base64'),
          sizeBytes: quoteDetails.buffer.length,
        },
      },
      {
        status: 200,
        headers: {
          'Access-Control-Allow-Origin': '*',
        },
      }
    );
  } catch (error: any) {
    console.error('API Quote Generation Error:', error);
    return NextResponse.json(
      {
        success: false,
        error: 'Internal Server Error',
        message: error?.message || 'An unexpected error occurred while generating the quotation.',
      },
      {
        status: 500,
        headers: {
          'Access-Control-Allow-Origin': '*',
        },
      }
    );
  }
}
