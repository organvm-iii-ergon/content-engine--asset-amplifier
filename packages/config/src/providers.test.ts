import { describe, it, expect } from 'vitest';

describe('OllamaLLM', () => {
  it('constructs with default host and model', async () => {
    const { OllamaLLM } = await import('./providers.js');
    const provider = new OllamaLLM();
    expect(provider.name).toBe('ollama');
    expect(provider.tier).toBe('free-local');
  });
});

describe('GroqLLM', () => {
  it('constructs with API key', async () => {
    const { GroqLLM } = await import('./providers.js');
    const provider = new GroqLLM('test-key');
    expect(provider.name).toBe('groq');
    expect(provider.tier).toBe('free-cloud');
  });
});

describe('AnthropicLLM', () => {
  it('constructs with API key', async () => {
    const { AnthropicLLM } = await import('./providers.js');
    const provider = new AnthropicLLM('sk-ant-test');
    expect(provider.name).toBe('anthropic');
    expect(provider.tier).toBe('paid');
  });
});

describe('GeminiLLM', () => {
  it('constructs with API key', async () => {
    const { GeminiLLM } = await import('./providers.js');
    const provider = new GeminiLLM('test-gemini-key');
    expect(provider.name).toBe('gemini');
    expect(provider.tier).toBe('free-cloud');
  });
});

describe('CerebrasLLM', () => {
  it('constructs with API key', async () => {
    const { CerebrasLLM } = await import('./providers.js');
    const provider = new CerebrasLLM('test-cerebras-key');
    expect(provider.name).toBe('cerebras');
    expect(provider.tier).toBe('free-cloud');
  });
});

describe('CloudflareLLM', () => {
  it('constructs with account ID and token', async () => {
    const { CloudflareLLM } = await import('./providers.js');
    const provider = new CloudflareLLM('acct-id', 'token');
    expect(provider.name).toBe('cloudflare');
    expect(provider.tier).toBe('free-cloud');
  });
});

describe('OllamaEmbedding', () => {
  it('constructs with default dimensions', async () => {
    const { OllamaEmbedding } = await import('./providers.js');
    const provider = new OllamaEmbedding();
    expect(provider.name).toBe('ollama');
    expect(provider.tier).toBe('free-local');
    expect(provider.dimensions).toBe(768);
  });
});

describe('OpenAIEmbedding', () => {
  it('constructs with correct dimensions', async () => {
    const { OpenAIEmbedding } = await import('./providers.js');
    const provider = new OpenAIEmbedding('sk-test');
    expect(provider.name).toBe('openai');
    expect(provider.tier).toBe('paid');
    expect(provider.dimensions).toBe(1536);
  });
});
