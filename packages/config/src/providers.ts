/**
 * Multi-provider AI abstraction — free-first, all roads available.
 *
 * Provider priority (configurable):
 * 1. Ollama (local, free, unlimited)
 * 2. Groq (cloud, free tier, fastest)
 * 3. Google AI Studio / Gemini (cloud, free tier)
 * 4. Cerebras (cloud, free tier)
 * 5. Cloudflare Workers AI (cloud, free tier)
 * 6. Anthropic Claude (cloud, paid)
 * 7. OpenAI (cloud, paid)
 */

export interface LLMProvider {
  name: string;
  tier: 'free-local' | 'free-cloud' | 'paid';
  generate(prompt: string, options?: { system?: string; maxTokens?: number }): Promise<string>;
}

export interface EmbeddingProvider {
  name: string;
  tier: 'free-local' | 'free-cloud' | 'paid';
  dimensions: number;
  embed(text: string): Promise<number[]>;
}

export interface TranscriptionProvider {
  name: string;
  tier: 'free-local' | 'free-cloud' | 'paid';
  transcribe(audioPath: string): Promise<string>;
}

export interface ProviderConfig {
  llm: LLMProvider | null;
  embedding: EmbeddingProvider | null;
  transcription: TranscriptionProvider | null;
  allLLMs: LLMProvider[];
  allEmbeddings: EmbeddingProvider[];
  allTranscriptions: TranscriptionProvider[];
}

// ── Ollama (free, local) ──────────────────────────────────────

export class OllamaLLM implements LLMProvider {
  name = 'ollama';
  tier = 'free-local' as const;
  constructor(private host: string = 'http://localhost:11434', private model: string = 'llama3.2:3b') {}

  async generate(prompt: string, options?: { system?: string; maxTokens?: number }): Promise<string> {
    const res = await fetch(`${this.host}/api/generate`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ model: this.model, prompt, system: options?.system, stream: false, options: { num_predict: options?.maxTokens ?? 1024 } }),
    });
    if (!res.ok) throw new Error(`Ollama error: ${res.status} ${await res.text()}`);
    return ((await res.json()) as { response: string }).response;
  }
}

export class OllamaEmbedding implements EmbeddingProvider {
  name = 'ollama';
  tier = 'free-local' as const;
  dimensions = 768;
  constructor(private host: string = 'http://localhost:11434', private model: string = 'nomic-embed-text') {}

  async embed(text: string): Promise<number[]> {
    const res = await fetch(`${this.host}/api/embed`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ model: this.model, input: text }),
    });
    if (!res.ok) throw new Error(`Ollama embedding error: ${res.status}`);
    return ((await res.json()) as { embeddings: number[][] }).embeddings[0];
  }
}

// ── Groq (free cloud, fastest inference + free Whisper) ───────

export class GroqLLM implements LLMProvider {
  name = 'groq';
  tier = 'free-cloud' as const;
  constructor(private key: string) {} // allow-secret

  async generate(prompt: string, options?: { system?: string; maxTokens?: number }): Promise<string> {
    const messages: { role: string; content: string }[] = [];
    if (options?.system) messages.push({ role: 'system', content: options.system });
    messages.push({ role: 'user', content: prompt });

    const res = await fetch('https://api.groq.com/openai/v1/chat/completions', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json', 'Authorization': `Bearer ${this.key}` }, // allow-secret
      body: JSON.stringify({ model: 'llama-3.3-70b-versatile', messages, max_tokens: options?.maxTokens ?? 1024 }),
    });
    if (!res.ok) throw new Error(`Groq error: ${res.status} ${await res.text()}`);
    return ((await res.json()) as { choices: { message: { content: string } }[] }).choices[0].message.content;
  }
}

export class GroqTranscription implements TranscriptionProvider {
  name = 'groq-whisper';
  tier = 'free-cloud' as const;
  constructor(private key: string) {} // allow-secret

  async transcribe(audioPath: string): Promise<string> {
    const fs = await import('node:fs');
    const file = fs.readFileSync(audioPath);
    const form = new FormData();
    form.append('file', new Blob([file]), 'audio.mp3');
    form.append('model', 'whisper-large-v3-turbo');

    const res = await fetch('https://api.groq.com/openai/v1/audio/transcriptions', {
      method: 'POST',
      headers: { 'Authorization': `Bearer ${this.key}` }, // allow-secret
      body: form,
    });
    if (!res.ok) throw new Error(`Groq Whisper error: ${res.status} ${await res.text()}`);
    return ((await res.json()) as { text: string }).text;
  }
}

// ── Google AI Studio / Gemini (free cloud) ────────────────────

export class GeminiLLM implements LLMProvider {
  name = 'gemini';
  tier = 'free-cloud' as const;
  constructor(private key: string) {} // allow-secret

  async generate(prompt: string, options?: { system?: string; maxTokens?: number }): Promise<string> {
    const contents = [];
    if (options?.system) contents.push({ role: 'user', parts: [{ text: `System: ${options.system}` }] });
    contents.push({ role: 'user', parts: [{ text: prompt }] });

    const res = await fetch(`https://generativelanguage.googleapis.com/v1beta/models/gemini-2.0-flash:generateContent?key=${this.key}`, { // allow-secret
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ contents, generationConfig: { maxOutputTokens: options?.maxTokens ?? 1024 } }),
    });
    if (!res.ok) throw new Error(`Gemini error: ${res.status} ${await res.text()}`);
    return ((await res.json()) as { candidates: { content: { parts: { text: string }[] } }[] }).candidates[0].content.parts[0].text;
  }
}

// ── Cerebras (free cloud, fast) ───────────────────────────────

export class CerebrasLLM implements LLMProvider {
  name = 'cerebras';
  tier = 'free-cloud' as const;
  constructor(private key: string) {} // allow-secret

  async generate(prompt: string, options?: { system?: string; maxTokens?: number }): Promise<string> {
    const messages: { role: string; content: string }[] = [];
    if (options?.system) messages.push({ role: 'system', content: options.system });
    messages.push({ role: 'user', content: prompt });

    const res = await fetch('https://api.cerebras.ai/v1/chat/completions', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json', 'Authorization': `Bearer ${this.key}` }, // allow-secret
      body: JSON.stringify({ model: 'llama-3.3-70b', messages, max_tokens: options?.maxTokens ?? 1024 }),
    });
    if (!res.ok) throw new Error(`Cerebras error: ${res.status} ${await res.text()}`);
    return ((await res.json()) as { choices: { message: { content: string } }[] }).choices[0].message.content;
  }
}

// ── Cloudflare Workers AI (free cloud, edge) ──────────────────

export class CloudflareLLM implements LLMProvider {
  name = 'cloudflare';
  tier = 'free-cloud' as const;
  constructor(private accountId: string, private token: string) {} // allow-secret

  async generate(prompt: string, options?: { system?: string; maxTokens?: number }): Promise<string> {
    const messages: { role: string; content: string }[] = [];
    if (options?.system) messages.push({ role: 'system', content: options.system });
    messages.push({ role: 'user', content: prompt });

    const res = await fetch(`https://api.cloudflare.com/client/v4/accounts/${this.accountId}/ai/run/@cf/meta/llama-3.1-8b-instruct`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json', 'Authorization': `Bearer ${this.token}` }, // allow-secret
      body: JSON.stringify({ messages, max_tokens: options?.maxTokens ?? 1024 }),
    });
    if (!res.ok) throw new Error(`Cloudflare AI error: ${res.status}`);
    return ((await res.json()) as { result: { response: string } }).result.response;
  }
}

export class CloudflareEmbedding implements EmbeddingProvider {
  name = 'cloudflare';
  tier = 'free-cloud' as const;
  dimensions = 768;
  constructor(private accountId: string, private token: string) {} // allow-secret

  async embed(text: string): Promise<number[]> {
    const res = await fetch(`https://api.cloudflare.com/client/v4/accounts/${this.accountId}/ai/run/@cf/baai/bge-base-en-v1.5`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json', 'Authorization': `Bearer ${this.token}` }, // allow-secret
      body: JSON.stringify({ text: [text] }),
    });
    if (!res.ok) throw new Error(`Cloudflare embedding error: ${res.status}`);
    return ((await res.json()) as { result: { data: number[][] } }).result.data[0];
  }
}

// ── Anthropic Claude (paid, raw fetch — no SDK needed) ────────

export class AnthropicLLM implements LLMProvider {
  name = 'anthropic';
  tier = 'paid' as const;
  constructor(private key: string) {} // allow-secret

  async generate(prompt: string, options?: { system?: string; maxTokens?: number }): Promise<string> {
    const body: Record<string, unknown> = {
      model: 'claude-sonnet-4-5-20250514',
      max_tokens: options?.maxTokens ?? 1024,
      messages: [{ role: 'user', content: prompt }],
    };
    if (options?.system) body.system = options.system;

    const res = await fetch('https://api.anthropic.com/v1/messages', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'x-api-key': this.key, // allow-secret
        'anthropic-version': '2023-06-01',
      },
      body: JSON.stringify(body),
    });
    if (!res.ok) throw new Error(`Anthropic error: ${res.status} ${await res.text()}`);
    const data = await res.json() as { content: { type: string; text: string }[] };
    return data.content[0].text;
  }
}

// ── OpenAI (paid, raw fetch — no SDK needed) ──────────────────

export class OpenAIEmbedding implements EmbeddingProvider {
  name = 'openai';
  tier = 'paid' as const;
  dimensions = 1536;
  constructor(private key: string) {} // allow-secret

  async embed(text: string): Promise<number[]> {
    const res = await fetch('https://api.openai.com/v1/embeddings', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json', 'Authorization': `Bearer ${this.key}` }, // allow-secret
      body: JSON.stringify({ model: 'text-embedding-3-small', input: text }),
    });
    if (!res.ok) throw new Error(`OpenAI embedding error: ${res.status} ${await res.text()}`);
    const data = await res.json() as { data: { embedding: number[] }[] };
    return data.data[0].embedding;
  }
}

export class WhisperTranscription implements TranscriptionProvider {
  name = 'openai-whisper';
  tier = 'paid' as const;
  constructor(private key: string) {} // allow-secret

  async transcribe(audioPath: string): Promise<string> {
    const fs = await import('node:fs');
    const file = fs.readFileSync(audioPath);
    const form = new FormData();
    form.append('file', new Blob([file]), 'audio.mp3');
    form.append('model', 'whisper-1');

    const res = await fetch('https://api.openai.com/v1/audio/transcriptions', {
      method: 'POST',
      headers: { 'Authorization': `Bearer ${this.key}` }, // allow-secret
      body: form,
    });
    if (!res.ok) throw new Error(`OpenAI Whisper error: ${res.status} ${await res.text()}`);
    return ((await res.json()) as { text: string }).text;
  }
}

// ── Provider Resolution ───────────────────────────────────────

async function isOllamaAvailable(host: string = 'http://localhost:11434'): Promise<boolean> {
  try {
    const res = await fetch(`${host}/api/tags`, { signal: AbortSignal.timeout(2000) });
    return res.ok;
  } catch { return false; }
}

function isRealKey(key: string | undefined, prefix?: string): boolean {
  if (!key || key.length < 10) return false;
  if (prefix && !key.startsWith(prefix)) return false;
  return !key.includes('placeholder') && !key.includes('your-') && !key.includes('xxx');
}

export async function resolveProviders(): Promise<ProviderConfig> {
  const env = process.env;
  const ollamaHost = env.OLLAMA_HOST ?? 'http://localhost:11434';
  const ollamaUp = await isOllamaAvailable(ollamaHost);

  const allLLMs: LLMProvider[] = [];
  const allEmbeddings: EmbeddingProvider[] = [];
  const allTranscriptions: TranscriptionProvider[] = [];

  // Free local
  if (ollamaUp) {
    allLLMs.push(new OllamaLLM(ollamaHost, env.OLLAMA_MODEL ?? 'llama3.2:3b'));
    allEmbeddings.push(new OllamaEmbedding(ollamaHost, env.OLLAMA_EMBED_MODEL ?? 'nomic-embed-text'));
  }

  // Free cloud
  if (isRealKey(env.GROQ_API_KEY)) {
    allLLMs.push(new GroqLLM(env.GROQ_API_KEY!));
    allTranscriptions.push(new GroqTranscription(env.GROQ_API_KEY!));
  }
  if (isRealKey(env.GEMINI_API_KEY)) allLLMs.push(new GeminiLLM(env.GEMINI_API_KEY!));
  if (isRealKey(env.CEREBRAS_API_KEY)) allLLMs.push(new CerebrasLLM(env.CEREBRAS_API_KEY!));
  if (isRealKey(env.CLOUDFLARE_ACCOUNT_ID) && isRealKey(env.CLOUDFLARE_API_TOKEN)) {
    allLLMs.push(new CloudflareLLM(env.CLOUDFLARE_ACCOUNT_ID!, env.CLOUDFLARE_API_TOKEN!));
    allEmbeddings.push(new CloudflareEmbedding(env.CLOUDFLARE_ACCOUNT_ID!, env.CLOUDFLARE_API_TOKEN!));
  }

  // Paid cloud
  if (isRealKey(env.ANTHROPIC_API_KEY, 'sk-ant-')) allLLMs.push(new AnthropicLLM(env.ANTHROPIC_API_KEY!));
  if (isRealKey(env.OPENAI_API_KEY, 'sk-')) {
    allEmbeddings.push(new OpenAIEmbedding(env.OPENAI_API_KEY!));
    allTranscriptions.push(new WhisperTranscription(env.OPENAI_API_KEY!));
  }

  return {
    llm: allLLMs[0] ?? null,
    embedding: allEmbeddings[0] ?? null,
    transcription: allTranscriptions[0] ?? null,
    allLLMs,
    allEmbeddings,
    allTranscriptions,
  };
}
