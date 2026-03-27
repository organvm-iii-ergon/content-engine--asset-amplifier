import { OpenAI } from 'openai';
import { getConfig } from '@cronus/config';
import { getDb, schema } from '@cronus/db';
import { eq } from 'drizzle-orm';
import { FragmentType } from '@cronus/domain';
import { randomUUID } from 'node:crypto';
import { createLogger } from '@cronus/logger';
import fs from 'node:fs';
import fsp from 'node:fs/promises';
import path from 'node:path';
import os from 'node:os';
import { createStorage } from '@cronus/storage';

const log = createLogger('fragment-extraction:transcription');

/**
 * Transcribes audio using Whisper and extracts text hooks.
 * 
 * 1. Downloads audio from storage.
 * 2. Sends to OpenAI Whisper API.
 * 3. Updates Asset record with full transcript.
 * 4. Extracts quotable "hooks" as fragments.
 */
export async function transcribeAndExtractHooks(params: {
  assetId: string;
  audioStorageKey: string;
}) {
  const { assetId, audioStorageKey } = params;
  const config = getConfig();
  const db = getDb();
  const storage = createStorage();

  if (!config.OPENAI_API_KEY) {
    log.warn('OPENAI_API_KEY not set, skipping transcription');
    return;
  }

  const openai = new OpenAI({ apiKey: config.OPENAI_API_KEY }); // allow-secret
  const tmpFile = path.join(os.tmpdir(), `audio-${assetId}.mp3`);

  log.info({ assetId }, 'Starting transcription');

  try {
    // 1. Download audio buffer
    const audioBuffer = await storage.download(audioStorageKey);
    await fsp.writeFile(tmpFile, audioBuffer);

    // 2. Call Whisper API
    // We use the stream version because OpenAI SDK expects a ReadStream
    const transcription = await openai.audio.transcriptions.create({
      file: fs.createReadStream(tmpFile),
      model: 'whisper-1',
    });

    log.info({ assetId }, 'Transcription complete');

    // 3. Update Asset with full transcription
    await db.update(schema.assets)
      .set({ transcription: transcription.text })
      .where(eq(schema.assets.id, assetId));

    // 4. Extract text hooks (sentences)
    // Simple sentence-based extraction for MVP
    const sentences = transcription.text
      .split(/(?<=[.!?])\s+/)
      .map(s => s.trim())
      .filter(s => s.length > 30 && s.length < 280); // Sensible lengths for hooks

    for (const sentence of sentences) {
      await db.insert(schema.fragments).values({
        id: randomUUID(),
        asset_id: assetId,
        type: FragmentType.text_hook,
        storage_key: 'text://' + assetId, // Marker for text-only fragments
        description: sentence,
        quality_score: 1.0,
        extraction_metadata: { 
          source: 'whisper',
          char_count: sentence.length
        },
      });
    }

    log.info({ assetId, hook_count: sentences.length }, 'Successfully extracted text hooks');
  } catch (error) {
    log.error({ err: error, assetId }, 'Transcription failed');
    throw error;
  } finally {
    // Cleanup local tmp file
    if (fs.existsSync(tmpFile)) {
      await fsp.unlink(tmpFile).catch(() => {});
    }
  }
}
