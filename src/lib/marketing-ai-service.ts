import {
  CompetitorAuditInput,
  CompetitorAuditOutput,
  ContentGeneratorInput,
  ContentGeneratorOutput,
  AdCreativeInput,
  AdCreativeOutput,
} from './marketing-ai-prompts';

export async function requestCompetitorAudit(payload: CompetitorAuditInput): Promise<CompetitorAuditOutput> {
  const res = await fetch('/api/marketing-ai', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ action: 'competitor_audit', payload }),
  });
  const data = await res.json();
  if (!res.ok || !data.success) {
    throw new Error(data.error || 'Failed to generate competitor audit.');
  }
  return data.data as CompetitorAuditOutput;
}

export async function requestContentGeneration(payload: ContentGeneratorInput): Promise<ContentGeneratorOutput> {
  const res = await fetch('/api/marketing-ai', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ action: 'content_generator', payload }),
  });
  const data = await res.json();
  if (!res.ok || !data.success) {
    throw new Error(data.error || 'Failed to generate marketing content.');
  }
  return data.data as ContentGeneratorOutput;
}

export async function requestAdCreative(payload: AdCreativeInput): Promise<AdCreativeOutput> {
  const res = await fetch('/api/marketing-ai', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ action: 'ad_creative', payload }),
  });
  const data = await res.json();
  if (!res.ok || !data.success) {
    throw new Error(data.error || 'Failed to generate ad creatives and variants.');
  }
  return data.data as AdCreativeOutput;
}
