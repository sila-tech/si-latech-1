import { sendWhatsAppMessage, uploadWhatsAppMedia, sendWhatsAppDocument } from './whatsapp-api';
import { extractWhatsAppMeasurements } from '../ai/flows/extract-whatsapp-measurements';
import { generateQuotePdfBuffer } from './pdf-generator';

type UserState = 'IDLE' | 'AWAITING_NAME' | 'AWAITING_DIMENSIONS';

interface Session {
  state: UserState;
  name?: string;
  phone: string;
}

// In-memory store for prototype. In production, use Redis or a Database.
const sessionStore = new Map<string, Session>();

export async function processWhatsAppMessage(from: string, text: string) {
  let session = sessionStore.get(from);
  
  if (!session) {
    session = { state: 'IDLE', phone: from };
    sessionStore.set(from, session);
  }

  // Process text through LLM
  let extraction;
  try {
    extraction = await extractWhatsAppMeasurements(text);
  } catch (error) {
    console.error("LLM Extraction Error:", error);
    await sendWhatsAppMessage(from, "I'm having trouble understanding right now. Please try again later.");
    return;
  }

  if (extraction.action === 'FAQ') {
    await sendWhatsAppMessage(from, `You asked about: ${extraction.faqTopic}. Currently, our high-quality hollow blocks are 85 KES each, and our precast beams are 545 KES per linear meter. Let me know if you want an instant quote!`);
    return;
  }

  if (session.state === 'IDLE') {
    if (extraction.action === 'QUOTE') {
      session.state = 'AWAITING_NAME';
      sessionStore.set(from, session);
      await sendWhatsAppMessage(from, "I'd love to generate a quote for you! First, what is your name?");
    } else {
      await sendWhatsAppMessage(from, "Welcome to SI-LATECH! We provide an innovative beam and block floor system. Send me your room dimensions (e.g., '4m by 5m') and I will generate an instant material quote for you.");
    }
  } else if (session.state === 'AWAITING_NAME') {
    session.name = text.trim();
    session.state = 'AWAITING_DIMENSIONS';
    sessionStore.set(from, session);
    await sendWhatsAppMessage(from, `Thanks, ${session.name}! Now, please send me your room dimensions (e.g., '3 by 4 meters').`);
  } else if (session.state === 'AWAITING_DIMENSIONS') {
    if (extraction.action === 'QUOTE' && extraction.rooms && extraction.rooms.length > 0) {
      const room = extraction.rooms[0];
      await sendWhatsAppMessage(from, `Calculating official quote for a ${room.length}m x ${room.width}m room... Please wait a moment.`);
      
      const clientInfo = { clientName: session.name, clientContact: from, projectName: 'WhatsApp Instant Quote' };
      const rooms = [{ id: '1', name: 'Room', length: room.length, width: room.width }];
      
      try {
        const pdfBuffer = await generateQuotePdfBuffer(clientInfo, rooms);
        const mediaId = await uploadWhatsAppMedia(pdfBuffer, `Quote_${session.name}.pdf`, 'application/pdf');
        
        if (mediaId) {
          await sendWhatsAppDocument(from, mediaId, `Quote_${session.name}.pdf`, `Here is your official material quote, ${session.name}!`);
        } else {
          await sendWhatsAppMessage(from, "Sorry, I couldn't generate the PDF right now. Please try again later.");
        }
      } catch (err) {
        console.error("PDF Generation Error:", err);
        await sendWhatsAppMessage(from, "Sorry, there was an error generating your quote.");
      }
      
      session.state = 'IDLE';
      sessionStore.set(from, session);
    } else {
      await sendWhatsAppMessage(from, "I didn't quite catch the dimensions. Could you provide them like '4m by 5m'?");
    }
  }
}
