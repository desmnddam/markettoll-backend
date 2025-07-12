import path from 'path';
import { fileURLToPath } from 'url';
import { readFile } from 'fs/promises';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

export const GCPServiceAccountPath = path.resolve(__dirname, './GCP-service-account.json');
export const GCPServiceAccountObject = JSON.parse(
  await readFile(
    new URL('./GCP-service-account.json', import.meta.url))
);

export const firebaseServiceAccountPath = path.resolve(__dirname, './firebase-service-account.json');
