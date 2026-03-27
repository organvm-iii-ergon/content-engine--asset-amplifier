import { Platform } from '@cronus/domain';

export interface PromptContext {
  brandName: string;
  brandDescription?: string;
  toneDescription?: string;
  fragmentDescription?: string;
  platform: Platform;
  transcriptHook?: string;
  systemPrompt?: string; // Full system prompt from Natural Center
}

/**
 * Platform-specific stylistic guidelines.
 */
const platformGuidelines: Record<Platform, string> = {
  [Platform.instagram_feed]: 'Visually descriptive, lifestyle-oriented, 3-5 hashtags, emoji-friendly but not cluttered.',
  [Platform.instagram_story]: 'Direct, conversational, high urgency, call-to-action focused.',
  [Platform.instagram_reels]: 'Hook-driven, high energy, optimized for discovery, 5-10 hashtags.',
  [Platform.linkedin]: 'Professional, authoritative, value-add, structured with line breaks, 2-3 broad hashtags.',
  [Platform.tiktok]: 'Informal, relatable, trend-aware, strong hook, minimal corporate jargon.',
  [Platform.youtube_shorts]: 'Clear description, SEO-friendly tags, engaging and clickable.',
  [Platform.x]: 'Concise, punchy, "thread-able" logic, conversational and reactive.',
};

/**
 * Constructs the final user prompt for the LLM.
 */
export function constructUserPrompt(ctx: PromptContext): string {
  const { platform, brandName, fragmentDescription, transcriptHook } = ctx;

  return `
    Create a high-performing social media post for ${brandName} on ${platform}.

    SOURCE FRAGMENT:
    - Description: ${fragmentDescription || 'A visual segment from a brand asset.'}
    ${transcriptHook ? `- Key Quote/Hook: "${transcriptHook}"` : ''}

    PLATFORM STYLE:
    ${platformGuidelines[platform]}

    TASK:
    Write a caption that feels native to ${platform} while strictly adhering to our brand identity.
    Use the Key Quote/Hook if provided, but integrate it naturally.

    RESPONSE FORMAT (JSON ONLY):
    {
      "caption": "Your generated caption here",
      "hashtags": ["list", "of", "hashtags"]
    }
  `;
}

/**
 * Returns the base system prompt if no Natural Center is available yet.
 */
export function getBaseSystemPrompt(ctx: PromptContext): string {
  if (ctx.systemPrompt) return ctx.systemPrompt;

  return `
    You are an expert social media manager for ${ctx.brandName}.
    Your goal is to transform visual fragments into high-yield social content.
    ${ctx.toneDescription ? `TONE: ${ctx.toneDescription}` : ''}
    ${ctx.brandDescription ? `BRAND MISSION: ${ctx.brandDescription}` : ''}
    Always output valid JSON. Be creative but stay true to the brand's core identity.
  `.trim();
}
