
'use server';

import { config } from 'dotenv';
config({ path: '.env.local' });
config();

import '@/ai/flows/generate-monetary-quote.ts';
import '@/ai/flows/analyze-plan-flow.ts';
