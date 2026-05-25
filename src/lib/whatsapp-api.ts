export async function sendWhatsAppMessage(to: string, text: string) {
  const token = process.env.META_ACCESS_TOKEN;
  const phoneId = process.env.META_PHONE_NUMBER_ID;

  if (!token || !phoneId) {
    console.warn("Missing META_ACCESS_TOKEN or META_PHONE_NUMBER_ID");
    return null;
  }

  const url = `https://graph.facebook.com/v20.0/${phoneId}/messages`;

  const payload = {
    messaging_product: "whatsapp",
    recipient_type: "individual",
    to: to,
    type: "text",
    text: { preview_url: false, body: text }
  };

  const response = await fetch(url, {
    method: "POST",
    headers: {
      "Authorization": `Bearer ${token}`,
      "Content-Type": "application/json"
    },
    body: JSON.stringify(payload)
  });

  const data = await response.json();
  if (!response.ok) {
    console.error("WhatsApp API Error (Text):", data);
  }
  return data;
}

export async function uploadWhatsAppMedia(buffer: Buffer, filename: string, mimeType: string): Promise<string | null> {
  const token = process.env.META_ACCESS_TOKEN;
  const phoneId = process.env.META_PHONE_NUMBER_ID;

  if (!token || !phoneId) return null;

  const url = `https://graph.facebook.com/v20.0/${phoneId}/media`;

  const formData = new FormData();
  formData.append("messaging_product", "whatsapp");
  
  // Create a Blob from the buffer to send via fetch
  const blob = new Blob([buffer], { type: mimeType });
  formData.append("file", blob, filename);

  const response = await fetch(url, {
    method: "POST",
    headers: {
      "Authorization": `Bearer ${token}`
    },
    body: formData
  });

  const data = await response.json();
  if (!response.ok) {
    console.error("WhatsApp API Error (Media Upload):", data);
    return null;
  }
  
  return data.id; // Returns the media ID
}

export async function sendWhatsAppDocument(to: string, mediaId: string, filename: string, caption?: string) {
  const token = process.env.META_ACCESS_TOKEN;
  const phoneId = process.env.META_PHONE_NUMBER_ID;

  if (!token || !phoneId) return null;

  const url = `https://graph.facebook.com/v20.0/${phoneId}/messages`;

  const payload = {
    messaging_product: "whatsapp",
    recipient_type: "individual",
    to: to,
    type: "document",
    document: {
      id: mediaId,
      caption: caption || "",
      filename: filename
    }
  };

  const response = await fetch(url, {
    method: "POST",
    headers: {
      "Authorization": `Bearer ${token}`,
      "Content-Type": "application/json"
    },
    body: JSON.stringify(payload)
  });

  const data = await response.json();
  if (!response.ok) {
    console.error("WhatsApp API Error (Document):", data);
  }
  return data;
}
