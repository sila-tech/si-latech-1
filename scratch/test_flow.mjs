import { config } from 'dotenv';
config({ path: '.env.local' });
config();

// Register/mock module alias
import Module from 'module';
const originalResolveFilename = Module._resolveFilename;
Module._resolveFilename = function(request, parent, isMain) {
  if (request.startsWith('@/')) {
    request = request.replace('@/', './src/');
  }
  return originalResolveFilename.apply(this, [request, parent, isMain]);
};

import { processSilaMessage } from '../src/ai/flows/sila-voice-flow.js';

async function run() {
  console.log("Calling processSilaMessage...");
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
}

run();
