import { getDb, schema } from '@cronus/db';
import { eq, and } from '@cronus/db';
import { MediaType, ProcessingStatus, FragmentType } from '@cronus/domain';
import { createLogger } from '@cronus/logger';
import { extractVideoFragments } from './video.js';
import { extractImageFragments } from './image.js';
import { transcribeAndExtractHooks } from './transcription.js';

const log = createLogger('fragment-extraction');

/**
 * Orchestrates the fragment extraction process for an asset.
 * 
 * 1. Updates status to 'processing'.
 * 2. Dispatches to type-specific extractors (video vs image).
 * 3. Triggers transcription for video assets.
 * 4. Updates final fragment count and status to 'extracted'.
 */
export async function processAssetFragments(assetId: string) {
  const db = getDb();
  
  // 1. Fetch asset details
  const [asset] = await db
    .select()
    .from(schema.assets)
    .where(eq(schema.assets.id, assetId));

  if (!asset) {
    throw new Error(`Asset not found: ${assetId}`);
  }

  log.info({ assetId, mediaType: asset.media_type }, 'Processing asset fragments');

  try {
    // 2. Mark as processing
    await db.update(schema.assets)
      .set({ processing_status: ProcessingStatus.processing })
      .where(eq(schema.assets.id, assetId));

    // 3. Extract based on media type
    if (asset.media_type === MediaType.video) {
      // Primary video extraction (clips, keyframes, audio)
      await extractVideoFragments({
        assetId: asset.id,
        brandId: asset.brand_id,
        storageKey: asset.storage_key,
      });

      // Secondary: Transcription from the audio segment we just extracted
      const [audioFragment] = await db
        .select()
        .from(schema.fragments)
        .where(
          and(
            eq(schema.fragments.asset_id, assetId),
            eq(schema.fragments.type, FragmentType.audio_segment)
          )
        );
      
      if (audioFragment) {
        await transcribeAndExtractHooks({
          assetId: asset.id,
          audioStorageKey: audioFragment.storage_key,
        });
      } else {
        log.warn({ assetId }, 'No audio fragment found for transcription');
      }

    } else if (asset.media_type === MediaType.image) {
      // Image extraction (crops, aspect ratios)
      await extractImageFragments({
        assetId: asset.id,
        brandId: asset.brand_id,
        storageKey: asset.storage_key,
      });
    }

    // 4. Finalize Asset status
    // Count all fragments created for this asset
    const allFragments = await db
      .select()
      .from(schema.fragments)
      .where(eq(schema.fragments.asset_id, assetId));
    
    await db.update(schema.assets)
      .set({ 
        processing_status: ProcessingStatus.extracted,
        fragment_count: allFragments.length
      })
      .where(eq(schema.assets.id, assetId));

    log.info({ assetId, fragment_count: allFragments.length }, 'Asset fragment extraction complete');

  } catch (error) {
    log.error({ err: error, assetId }, 'Fragment extraction orchestration failed');
    
    // Mark asset as failed
    await db.update(schema.assets)
      .set({ processing_status: ProcessingStatus.failed })
      .where(eq(schema.assets.id, assetId));
      
    throw error;
  }
}
