import { config } from 'dotenv';
config({ path: '.env.local' });
config();

import { processSilaMessage } from '../src/ai/flows/sila-voice-flow';

async function run() {
  console.log("Calling processSilaMessage...");
  try {
    const result = await processSilaMessage({
      userMessage: "Hello, what is the price of flat beams?",
      history: [],
      calculatorState: {
        beamType: "flat",
        rooms: [],
        totalArea: 0,
        totalBeamsCost: 0,
        totalBlocksCost: 0,
        grandTotalCost: 0
      }
    });
    console.log("Result:", JSON.stringify(result, null, 2));
  } catch (error) {
    console.error("Execution error:", error);
  }
}

run();
