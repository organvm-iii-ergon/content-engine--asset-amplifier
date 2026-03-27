import React, { useEffect, useState } from 'react';

interface ProviderStatus {
  llm: { name: string; status: string };
  embedding: { name: string; status: string };
  transcription: { name: string; status: string };
}

interface KeysState {
  anthropic_api_key: string | null;
  openai_api_key: string | null;
  ollama_host: string;
  ollama_model: string;
}

const API = '/api/v1';

export default function Settings() {
  const [providers, setProviders] = useState<ProviderStatus | null>(null);
  const [keys, setKeys] = useState<KeysState | null>(null);
  const [saving, setSaving] = useState(false);
  const [message, setMessage] = useState('');

  // Form state
  const [anthropicKey, setAnthropicKey] = useState('');
  const [openaiKey, setOpenaiKey] = useState('');
  const [ollamaHost, setOllamaHost] = useState('http://localhost:11434');
  const [ollamaModel, setOllamaModel] = useState('llama3.2:3b');

  useEffect(() => {
    fetch(`${API}/settings/providers`).then(r => r.json()).then(setProviders);
    fetch(`${API}/settings/keys`).then(r => r.json()).then(data => {
      setKeys(data);
      if (data.ollama_host) setOllamaHost(data.ollama_host);
      if (data.ollama_model) setOllamaModel(data.ollama_model);
    });
  }, []);

  const handleSave = async () => {
    setSaving(true);
    setMessage('');
    try {
      const body: Record<string, string> = {};
      if (anthropicKey) body.anthropic_api_key = anthropicKey;
      if (openaiKey) body.openai_api_key = openaiKey;
      body.ollama_host = ollamaHost;
      body.ollama_model = ollamaModel;

      const res = await fetch(`${API}/settings/keys`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(body),
      });
      const result = await res.json();
      setMessage(`Saved. Active providers: LLM=${result.providers.llm}, Embedding=${result.providers.embedding}, Transcription=${result.providers.transcription}`);

      // Refresh status
      const updated = await fetch(`${API}/settings/providers`).then(r => r.json());
      setProviders(updated);
      const updatedKeys = await fetch(`${API}/settings/keys`).then(r => r.json());
      setKeys(updatedKeys);

      setAnthropicKey('');
      setOpenaiKey('');
    } catch (err: any) {
      setMessage(`Error: ${err.message}`);
    } finally {
      setSaving(false);
    }
  };

  return (
    <div className="space-y-8 max-w-2xl">
      <div>
        <h2 className="text-2xl font-bold text-gray-900">Settings</h2>
        <p className="text-gray-500 mt-1">Configure AI providers and API keys. Free local models are used by default.</p>
      </div>

      {/* Provider Status */}
      <div className="bg-white border border-gray-200 rounded-xl p-6 space-y-4">
        <h3 className="text-sm font-semibold text-gray-500 uppercase tracking-wide">Active Providers</h3>
        {providers ? (
          <div className="grid grid-cols-3 gap-4">
            {Object.entries(providers).map(([key, val]) => (
              <div key={key} className="text-center">
                <div className={`inline-block w-3 h-3 rounded-full mb-2 ${val.status === 'active' ? 'bg-green-500' : 'bg-gray-300'}`} />
                <div className="text-sm font-medium text-gray-900 capitalize">{key.replace('_', ' ')}</div>
                <div className="text-xs text-gray-500">{val.name}</div>
              </div>
            ))}
          </div>
        ) : (
          <div className="animate-pulse text-gray-400">Loading...</div>
        )}
      </div>

      {/* Ollama (Free) */}
      <div className="bg-white border border-gray-200 rounded-xl p-6 space-y-4">
        <div className="flex items-center justify-between">
          <h3 className="text-sm font-semibold text-gray-500 uppercase tracking-wide">Ollama (Free, Local)</h3>
          <span className="text-[10px] font-bold bg-green-100 text-green-700 px-2 py-0.5 rounded-full">RECOMMENDED</span>
        </div>
        <p className="text-xs text-gray-500">
          Ollama runs AI models locally on your machine. No API keys needed. Install from <a href="https://ollama.com" className="text-blue-600 underline" target="_blank">ollama.com</a>.
        </p>
        <div className="grid grid-cols-2 gap-4">
          <div>
            <label className="block text-xs font-medium text-gray-700 mb-1">Host</label>
            <input
              type="text"
              value={ollamaHost}
              onChange={e => setOllamaHost(e.target.value)}
              className="w-full px-3 py-2 text-sm border border-gray-200 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
            />
          </div>
          <div>
            <label className="block text-xs font-medium text-gray-700 mb-1">Model</label>
            <input
              type="text"
              value={ollamaModel}
              onChange={e => setOllamaModel(e.target.value)}
              placeholder="llama3.2:3b"
              className="w-full px-3 py-2 text-sm border border-gray-200 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
            />
          </div>
        </div>
      </div>

      {/* Cloud APIs (Paid) */}
      <div className="bg-white border border-gray-200 rounded-xl p-6 space-y-4">
        <h3 className="text-sm font-semibold text-gray-500 uppercase tracking-wide">Cloud APIs (Optional Upgrade)</h3>
        <p className="text-xs text-gray-500">Higher quality but requires API keys and costs money. Only needed for production.</p>

        <div>
          <label className="block text-xs font-medium text-gray-700 mb-1">Anthropic API Key</label>
          <div className="flex items-center gap-2">
            <input
              type="password"
              value={anthropicKey}
              onChange={e => setAnthropicKey(e.target.value)}
              placeholder={keys?.anthropic_api_key ?? 'sk-ant-...'}
              className="flex-1 px-3 py-2 text-sm border border-gray-200 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
            />
            {keys?.anthropic_api_key && (
              <span className="text-[10px] font-bold bg-blue-100 text-blue-700 px-2 py-0.5 rounded-full">SET</span>
            )}
          </div>
        </div>

        <div>
          <label className="block text-xs font-medium text-gray-700 mb-1">OpenAI API Key</label>
          <div className="flex items-center gap-2">
            <input
              type="password"
              value={openaiKey}
              onChange={e => setOpenaiKey(e.target.value)}
              placeholder={keys?.openai_api_key ?? 'sk-...'}
              className="flex-1 px-3 py-2 text-sm border border-gray-200 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
            />
            {keys?.openai_api_key && (
              <span className="text-[10px] font-bold bg-blue-100 text-blue-700 px-2 py-0.5 rounded-full">SET</span>
            )}
          </div>
        </div>
      </div>

      {/* Save */}
      <div className="flex items-center gap-4">
        <button
          onClick={handleSave}
          disabled={saving}
          className="px-6 py-2 bg-black text-white text-sm font-medium rounded-lg hover:bg-gray-800 transition-colors disabled:opacity-50"
        >
          {saving ? 'Saving...' : 'Save Settings'}
        </button>
        {message && (
          <span className={`text-sm ${message.startsWith('Error') ? 'text-red-600' : 'text-green-600'}`}>
            {message}
          </span>
        )}
      </div>
    </div>
  );
}
