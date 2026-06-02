const fs = require('fs');
const path = require('path');

// Set the API keys manually for the local Node execution
process.env.GEMINI_API_KEY = "AIzaSyAyhCV16d8C-C30E5fnZ7qHdy0ux74B5Ak";
process.env.GOOGLE_GENAI_API_KEY = "AIzaSyAyhCV16d8C-C30E5fnZ7qHdy0ux74B5Ak";

async function runTest() {
  try {
    // Read the PDF from the Downloads directory
    const pdfPath = "C:\\Users\\Admin\\Downloads\\PROPOSED RENOVATIONS_KALUKU.pdf";
    console.log("Reading PDF from:", pdfPath);
    
    if (!fs.existsSync(pdfPath)) {
      console.error("PDF file does not exist at:", pdfPath);
      return;
    }

    const pdfBuffer = fs.readFileSync(pdfPath);
    const base64Data = `data:application/pdf;base64,${pdfBuffer.toString('base64')}`;
    console.log("Base64 PDF data length:", base64Data.length);

    // Import the ts-node registration to run TS code on the fly
    require('ts-node').register({
      transpileOnly: true,
      compilerOptions: {
        module: "commonjs",
        target: "es2022"
      }
    });

    console.log("Importing analyzePlan flow...");
    const { analyzePlan } = require('../src/ai/flows/analyze-plan-flow.ts');

    console.log("Running analyzePlan...");
    const result = await analyzePlan({ photoDataUri: base64Data });
    console.log("Extraction successful! Result:");
    console.log(JSON.stringify(result, null, 2));

  } catch (error) {
    console.error("An error occurred during test execution:");
    console.error(error);
  }
}

runTest();
