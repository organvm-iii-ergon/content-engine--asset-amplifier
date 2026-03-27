/**
 * AI Provider abstraction — free-first, paid-upgrade.
 *
 * Resolution order:
 * 1. Ollama (local, free) — if OLLAMA_HOST is reachable
 * 2. Anthropic Claude (cloud, paid) — if ANTHROPIC_API_KEY is set
 * 3. Graceful skip — returns null, caller handles absence
 *
 * Same pattern for embeddings and transcription.
 */

export interface LLMProvider {
  name: string;
  generate(prompt: string, options?: { system?: string; maxTokens?: number }): Promise<string>;
}

export interface EmbeddingProvider {
  name: string;
  embed(text: string): Promise<number[]>;
}

export interface TranscriptionProvider {
  name: string;
  transcribe(audioPath: string): Promise<string>;
}

export interface ProviderConfig {
  llm: LLMProvider | null;
  embedding: EmbeddingProvider | null;
  transcription: TranscriptionProvider | null;
}

// ── Ollama (free, local) ──────────────────────────────────────

export class OllamaLLM implements LLMProvider {
  name = 'ollama';
  constructor(
    private host: string = 'http://localhost:11434',
    private model: string = 'llama3.2:3b',
  ) {}

  async generate(prompt: string, options?: { system?: string; maxTokens?: number }): Promise<string> {
    const res = await fetch(`${this.host}/api/generate`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        model: this.model,
        prompt,
        system: options?.system,
        stream: false,
        options: { num_predict: options?.maxTokens ?? 1024 },
      }),
    });
    if (!res.ok) throw new Error(`Ollama error: ${res.status} ${await res.text()}`);
    const data = await res.json() as { response: string };
    return data.response;
  }
}

export class OllamaEmbedding implements EmbeddingProvider {
  name = 'ollama';
  constructor(
    private host: string = 'http://localhost:11434',
    private model: string = 'nomic-embed-text',
  ) {}

  async embed(text: string): Promise<number[]> {
    const res = await fetch(`${this.host}/api/embed`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ model: this.model, input: text }),
    });
    if (!res.ok) throw new Error(`Ollama embedding error: ${res.status}`);
    const data = await res.json() as { embeddings: number[][] };
    return data.embeddings[0];
  }
}

// ── Anthropic Claude (paid, cloud) ────────────────────────────

export class AnthropicLLM implements LLMProvider {
  name = 'anthropic';
  private apiKey: string; // allow-secret

  constructor(apiKey: string) { // allow-secret
    this.apiKey = apiKey; // allow-secret
  }

  async generate(prompt: string, options?: { system?: string; maxTokens?: number }): Promise<string> {
    const { default: Anthropic } = await import('@anthropic-ai/sdk');
    const client = new Anthropic({ apiKey: this.apiKey }); // allow-secret
    const message = await client.messages.create({
      model: 'claude-sonnet-4-5-20250514',
      max_tokens: options?.maxTokens ?? 1024,
      system: options?.system,
      messages: [{ role: 'user', content: prompt }],
    });
    return (message.content[0] as { type: string; text: string }).text;
  }
}

// ── OpenAI (paid, cloud) ──────────────────────────────────────

export class OpenAIEmbedding implements EmbeddingProvider {
  name = 'openai';
  private apiKey: string; // allow-secret

  constructor(apiKey: string) { // allow-secret
    this.apiKey = apiKey; // allow-secret
  }

  async embed(text: string): Promise<number[]> {
    const { OpenAI } = await import('openai');
    const client = new OpenAI({ apiKey: this.apiKey }); // allow-secret
    const res = await client.embeddings.create({ model: 'text-embedding-3-small', input: text });
    return res.data[0].embedding;
  }
}

export class WhisperTranscription implements TranscriptionProvider {
  name = 'whisper';
  private apiKey: string; // allow-secret

  constructor(apiKey: string) { // allow-secret
    this.apiKey = apiKey; // allow-secret
  }

  async transcribe(audioPath: string): Promise<string> {
    const { OpenAI } = await import('openai');
    const fs = await import('node:fs');
    const client = new OpenAI({ apiKey: this.apiKey }); // allow-secret
    const result = await client.audio.transcriptions.create({
      file: fs.createReadStream(audioPath),
      model: 'whisper-1',
    });
    return result.text;
  }
}

// ── Provider Resolution ───────────────────────────────────────

async function isOllamaAvailable(host: string = 'http://localhost:11434'): Promise<boolean> {
  try {
    const res = await fetch(`${host}/api/tags`, { signal: AbortSignal.timeout(2000) });
    return res.ok;
  } catch {
    return false;
  }
}

export async function resolveProviders(): Promise<ProviderConfig> {
  const ollamaHost = process.env.OLLAMA_HOST ?? 'http://localhost:11434';
  const anthropicKey = process.env.ANTHROPIC_API_KEY;
  const openaiKey = process.env.OPENAI_API_KEY;
  const ollamaAvailable = await isOllamaAvailable(ollamaHost);

  // LLM: Ollama first, then Anthropic, then null
  let llm: LLMProvider | null = null;
  if (ollamaAvailable) {
    llm = new OllamaLLM(ollamaHost, process.env.OLLAMA_MODEL ?? 'llama3.2:3b');
  } else if (anthropicKey && !anthropicKey.startsWith('sk-ant-placeholder')) {
    llm = new AnthropicLLM(anthropicKey);
  }

  // Embedding: Ollama first, then OpenAI, then null
  let embedding: EmbeddingProvider | null = null;
  if (ollamaAvailable) {
    embedding = new OllamaEmbedding(ollamaHost, process.env.OLLAMA_EMBED_MODEL ?? 'nomic-embed-text');
  } else if (openaiKey && !openaiKey.startsWith('sk-placeholder')) {
    embedding = new OpenAIEmbedding(openaiKey);
  }

  // Transcription: Whisper API if key exists, else null (skip gracefully)
  let transcription: TranscriptionProvider | null = null;
  if (openaiKey && !openaiKey.startsWith('sk-placeholder')) {
    transcription = new WhisperTranscription(openaiKey);
  }

  return { llm, embedding, transcription };
}
