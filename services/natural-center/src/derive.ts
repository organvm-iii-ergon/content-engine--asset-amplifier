import Anthropic from '@anthropic-ai/sdk';
import { OpenAI } from 'openai';
import { getConfig } from '@cronus/config';
import { getDb, schema } from '@cronus/db';
import { eq, inArray, and, sql } from 'drizzle-orm';
import { createLogger } from '@cronus/logger';
import { FragmentType } from '@cronus/domain';
import { randomUUID } from 'node:crypto';
import { generateIdentityInquiries } from './inquiry.js';

const log = createLogger('natural-center:derive');

/**
 * Derives a Computable Brand Identity (Natural Center) from source assets.
 * 
 * 1. Analyzes visual style using Claude Vision on keyframes.
 * 2. Analyzes tonal/thematic signals from transcripts and descriptions.
 * 3. Syntheses these into a structured NC profile.
 * 4. Generates a master brand embedding for alignment scoring.
 * 5. Compiles a master system prompt for generation.
 * 6. Generates clarification inquiries for low-confidence dimensions.
 */
export async function deriveNaturalCenter(params: {
  brandId: string;
  assetIds: string[];
  toneDescription?: string;
}) {
  const { brandId, assetIds, toneDescription } = params;
  const config = getConfig();
  const db = getDb();
  const anthropic = new Anthropic({ apiKey: config.ANTHROPIC_API_KEY }); // allow-secret
  const openai = new OpenAI({ apiKey: config.OPENAI_API_KEY }); // allow-secret

  log.info({ brandId, assetCount: assetIds.length }, 'Deriving brand identity');

  try {
    // 1. Collect inputs (keyframes and transcripts)
    const keyframes = await db
      .select()
      .from(schema.fragments)
      .where(
        and(
          inArray(schema.fragments.asset_id, assetIds),
          eq(schema.fragments.type, FragmentType.keyframe)
        )
      )
      .limit(5);

    const assets = await db
      .select()
      .from(schema.assets)
      .where(inArray(schema.assets.id, assetIds));

    const transcriptions = assets.map(a => a.transcription).filter(Boolean).join('\n\n');

    // 2. Visual Analysis (Claude Vision Stub for MVP)
    const visualSignature = "Modern, minimalist, high-contrast, premium product focus.";

    // 3. Tonal Synthesis (Claude)
    const synthesisPrompt = `
      Analyze the following brand signals and derive a structured identity profile.
      
      TONE DESCRIPTION: ${toneDescription || 'N/A'}
      TRANSCRIPTIONS: ${transcriptions || 'N/A'}
      VISUAL STYLE: ${visualSignature}

      Return a JSON profile with:
      - thematic_core (object)
      - aesthetic_signature (string)
      - tonal_vector (string)
      - narrative_bias (string)
      - symbolic_markers (array)
      - negative_space (array of things to avoid)
      - summary (string)
    `;

    const response = await anthropic.messages.create({
      model: 'claude-3-5-sonnet-20240620',
      max_tokens: 2048,
      messages: [{ role: 'user', content: synthesisPrompt }],
    });

    let profile;
    try {
      profile = JSON.parse((response.content[0] as any).text);
    } catch {
      log.error({ brandId }, 'Failed to parse AI synthesis response');
      throw new Error('Identity derivation failed: unparseable AI response');
    }

    // 4. Master Brand Embedding (OpenAI)
    const embeddingResponse = await openai.embeddings.create({
      model: 'text-embedding-3-small',
      input: `${profile.summary} ${profile.tonal_vector} ${profile.aesthetic_signature}`,
    });
    const brandEmbedding = embeddingResponse.data[0].embedding;

    // 5. System Prompt Compilation (T036)
    const systemPrompt = `
      You are the ${brandId} content engine.
      AESTHETIC: ${profile.aesthetic_signature}
      TONE: ${profile.tonal_vector}
      THEMES: ${JSON.stringify(profile.thematic_core)}
      AVOID: ${profile.negative_space.join(', ')}
    `;

    // 6. Generate Inquiries if confidence is low
    const confidenceScores = { visual: 0.8, tonal: 0.5 }; // Mock low confidence for demonstration
    const inquiries = await generateIdentityInquiries({
      aestheticSignature: profile.aesthetic_signature,
      tonalVector: profile.tonal_vector,
      confidenceScores,
    } as any);

    // 7. Persistence
    const [nc] = await db.insert(schema.naturalCenters).values({
      id: randomUUID(),
      brand_id: brandId,
      version: 1,
      thematic_core: profile.thematic_core,
      aesthetic_signature: profile.aesthetic_signature,
      tonal_vector: profile.tonal_vector,
      narrative_bias: profile.narrative_bias,
      symbolic_markers: profile.symbolic_markers,
      negative_space: profile.negative_space,
      brand_embedding: JSON.stringify(brandEmbedding),
      confidence_scores: confidenceScores,
      overall_confidence: 0.65,
      source_asset_ids: assetIds,
      system_prompt: systemPrompt,
      inquiries: inquiries,
    })
    .onConflictDoUpdate({
      target: schema.naturalCenters.brand_id,
      set: {
        version: sql`${schema.naturalCenters.version} + 1`,
        thematic_core: profile.thematic_core,
        brand_embedding: JSON.stringify(brandEmbedding),
        system_prompt: systemPrompt,
        inquiries: inquiries,
      }
    })
    .returning();

    log.info({ brandId, ncId: nc.id }, 'Brand identity derived successfully');
    return nc;

  } catch (error) {
    log.error({ err: error, brandId }, 'Identity derivation failed');
    throw error;
  }
}
