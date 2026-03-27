import Anthropic from '@anthropic-ai/sdk';
import { getConfig } from '@cronus/config';
import { NaturalCenter, IdentityInquiry } from '@cronus/domain';
import { randomUUID } from 'node:crypto';

/**
 * Generates clarification questions for low-confidence identity dimensions.
 */
export async function generateIdentityInquiries(nc: Partial<NaturalCenter>): Promise<IdentityInquiry[]> {
  const config = getConfig();
  const anthropic = new Anthropic({ apiKey: config.ANTHROPIC_API_KEY }); // allow-secret

  const lowConfidenceDimensions = Object.entries(nc.confidenceScores || {})
    .filter(([_, score]) => score < 0.6)
    .map(([dim]) => dim);

  if (lowConfidenceDimensions.length === 0) return [];

  const prompt = `
    The following brand identity profile has low confidence in these dimensions: ${lowConfidenceDimensions.join(', ')}.
    
    PROFILE SUMMARY:
    - Aesthetic: ${nc.aestheticSignature}
    - Tone: ${nc.tonalVector}
    
    Task: Generate 2-3 targeted multiple-choice questions to help refine these dimensions.
    
    RESPONSE FORMAT (JSON ARRAY):
    [
      {
        "question": "Which of these best describes your visual preference?",
        "options": ["High-energy and raw", "Polished and cinematic", "Minimalist and clean"],
        "dimension": "aesthetic"
      }
    ]
  `;

  const response = await anthropic.messages.create({
    model: 'claude-3-5-sonnet-20240620',
    max_tokens: 1024,
    messages: [{ role: 'user', content: prompt }],
  });

  let inquiries;
  try {
    inquiries = JSON.parse((response.content[0] as any).text);
  } catch {
    return [];
  }

  return inquiries.map((iq: any) => ({
    ...iq,
    id: randomUUID(),
    status: 'pending',
    createdAt: new Date(),
  }));
}
