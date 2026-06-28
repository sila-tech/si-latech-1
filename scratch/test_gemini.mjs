import { genkit } from 'genkit';
import { googleAI } from '@genkit-ai/google-genai';
import { config } from 'dotenv';

config({ path: '.env.local' });
config();

console.log("GEMINI_API_KEY:", process.env.GEMINI_API_KEY ? process.env.GEMINI_API_KEY.substring(0, 8) + "..." : "undefined");

const ai = genkit({
  plugins: [googleAI()],
});

async function run() {
  try {
    const response = await ai.generate({
      model: googleAI.model('gemini-2.5-flash'),
      prompt: 'Hello! Respond with "Ok" if you can hear me.',
    });
    console.log("Response:", response.text);
  } catch (error) {
    console.error("Error occurred:", error);
  }
}

run();
