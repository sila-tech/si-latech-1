import fs from 'fs';
import path from 'path';
import os from 'os';

// Path to firebase-tools config
const configPath = path.join(os.homedir(), '.config', 'configstore', 'firebase-tools.json');

async function run() {
  try {
    if (!fs.existsSync(configPath)) {
      console.error('Firebase config file not found at:', configPath);
      return;
    }

    const configData = JSON.parse(fs.readFileSync(configPath, 'utf8'));
    const accessToken = configData?.tokens?.access_token;

    if (!accessToken) {
      console.error('No access token found in firebase-tools.json.');
      return;
    }

    const bucketName = 'si-latech.firebasestorage.app';
    console.log(`Setting CORS configuration on bucket gs://${bucketName} using stored access token...`);

    // GCS PATCH request to update bucket metadata
    const gcsResponse = await fetch(`https://storage.googleapis.com/storage/v1/b/${bucketName}?updateMask=cors`, {
      method: 'PATCH',
      headers: {
        'Authorization': `Bearer ${accessToken}`,
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        cors: [
          {
            origin: ['*'],
            method: ['GET', 'POST', 'PUT', 'DELETE', 'HEAD'],
            responseHeader: ['Content-Type', 'Access-Control-Allow-Origin', 'Authorization'],
            maxAgeSeconds: 3600,
          },
        ],
      }),
    });

    if (!gcsResponse.ok) {
      const errText = await gcsResponse.text();
      console.error('Failed to configure CORS in GCS:', errText);
      return;
    }

    const result = await gcsResponse.json();
    console.log('CORS set successfully! Google Cloud response:');
    console.log(JSON.stringify(result.cors, null, 2));

  } catch (error) {
    console.error('Error running script:', error);
  }
}

run();
