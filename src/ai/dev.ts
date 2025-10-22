'use server';

import { config } from 'dotenv';
config({ path: '.env.local' });
config();

import '@/ai/flows/plan-analysis-upload.ts';
import '@/ai/flows/generate-monetary-quote.ts';
