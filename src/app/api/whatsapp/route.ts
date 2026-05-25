import { NextRequest, NextResponse } from 'next/server';
import { processWhatsAppMessage } from '@/lib/whatsapp-bot';

// GET handler for Webhook Verification from Meta
export async function GET(request: NextRequest) {
  const searchParams = request.nextUrl.searchParams;
  const mode = searchParams.get('hub.mode');
  const token = searchParams.get('hub.verify_token');
  const challenge = searchParams.get('hub.challenge');

  if (mode === 'subscribe' && token === 'silatech_secret_2026') {
    return new NextResponse(challenge, { status: 200 });
  } else {
    return new NextResponse('Forbidden', { status: 403 });
  }
}

// POST handler for Incoming WhatsApp Messages
export async function POST(request: NextRequest) {
  try {
    const body = await request.json();

    // Verify it's a WhatsApp webhook event
    if (body.object === 'whatsapp_business_account') {
      const entry = body.entry?.[0];
      const changes = entry?.changes?.[0];
      const value = changes?.value;
      const messages = value?.messages;

      if (messages && messages.length > 0) {
        const message = messages[0];
        const from = message.from; // Phone number
        
        if (message.type === 'text') {
          const text = message.text.body;
          // Process asynchronously to not block the webhook response
          processWhatsAppMessage(from, text).catch(console.error);
        } else {
          // If they sent an image, audio, etc.
          const { sendWhatsAppMessage } = await import('@/lib/whatsapp-api');
          await sendWhatsAppMessage(from, "I currently only understand text messages. Please type out your room dimensions!");
        }
      }
      
      // Always return 200 OK to Meta
      return NextResponse.json({ status: 'success' }, { status: 200 });
    } else {
      return new NextResponse('Not Found', { status: 404 });
    }
  } catch (error) {
    console.error('Webhook Error:', error);
    return new NextResponse('Internal Server Error', { status: 500 });
  }
}
