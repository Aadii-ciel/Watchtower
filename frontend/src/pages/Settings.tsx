import React, { useState, useEffect } from 'react';
import { Settings as SettingsIcon, Save } from 'lucide-react';
import { Card, CardHeader, CardTitle, CardContent } from '../components/ui/Card';
import { useConfig } from '../hooks/useApi';

export function Settings() {
  const { data: config, mutate } = useConfig();
  const [formData, setFormData] = useState<any>(null);
  const [isSaving, setIsSaving] = useState(false);
  const [message, setMessage] = useState('');

  useEffect(() => {
    if (config && !formData) {
      setFormData(config);
    }
  }, [config, formData]);

  if (!formData) return <div className="p-8">Loading settings...</div>;

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsSaving(true);
    setMessage('');
    try {
      const res = await fetch('/api/config', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(formData)
      });
      if (!res.ok) throw new Error('Failed to save settings');
      await mutate(formData);
      setMessage('Settings saved successfully!');
    } catch (err: any) {
      setMessage(err.message);
    } finally {
      setIsSaving(false);
    }
  };

  const updateField = (field: string, value: string | number) => {
    setFormData((prev: any) => {
      const parts = field.split('.');
      if (parts.length === 1) return { ...prev, [field]: value };
      return {
        ...prev,
        [parts[0]]: { ...prev[parts[0]], [parts[1]]: value }
      };
    });
  };

  return (
    <div className="max-w-2xl h-full pb-8">
      <Card delay={0.1}>
        <CardHeader>
          <div className="flex items-center gap-2">
            <SettingsIcon className="w-5 h-5 text-zinc-500 dark:text-zinc-400" />
            <CardTitle>System Configuration</CardTitle>
          </div>
        </CardHeader>
        <CardContent>
          <form onSubmit={handleSubmit} className="space-y-8">
            
            {/* AI Setup */}
            <div className="space-y-4">
              <h3 className="text-sm font-medium text-purple-600 dark:text-purple-400 uppercase tracking-widest">AI Intelligence</h3>
              <div className="grid grid-cols-2 gap-5">
                <div className="space-y-2">
                  <label className="text-xs text-zinc-500 dark:text-zinc-400 uppercase">LLM Provider</label>
                  <select 
                    value={formData.LLMProvider} 
                    onChange={e => updateField('LLMProvider', e.target.value)}
                    className="w-full bg-white dark:bg-zinc-900 border border-zinc-300 dark:border-zinc-700 rounded-md p-2.5 text-sm text-zinc-900 dark:text-zinc-200 focus:border-purple-500 focus:ring-1 focus:ring-purple-500 outline-none transition-all"
                  >
                    <option value="none">None</option>
                    <option value="openai">OpenAI</option>
                    <option value="anthropic">Anthropic</option>
                    <option value="gemini">Google Gemini</option>
                    <option value="local">Ollama (Local)</option>
                  </select>
                </div>
                <div className="space-y-2">
                  <label className="text-xs text-zinc-500 dark:text-zinc-400 uppercase">LLM Model</label>
                  <input 
                    type="text" 
                    value={formData.LLMModel} 
                    onChange={e => updateField('LLMModel', e.target.value)}
                    className="w-full bg-white dark:bg-zinc-900 border border-zinc-300 dark:border-zinc-700 rounded-md p-2.5 text-sm text-zinc-900 dark:text-zinc-200 outline-none focus:border-purple-500 transition-all"
                    placeholder="e.g. gpt-4o, claude-3-haiku, gemini-flash"
                  />
                </div>
                <div className="col-span-2 space-y-2">
                  <label className="text-xs text-zinc-500 dark:text-zinc-400 uppercase">API Key</label>
                  <input 
                    type="password" 
                    value={formData.LLMAPIKey} 
                    onChange={e => updateField('LLMAPIKey', e.target.value)}
                    className="w-full bg-white dark:bg-zinc-900 border border-zinc-300 dark:border-zinc-700 rounded-md p-2.5 text-sm text-zinc-900 dark:text-zinc-200 outline-none focus:border-purple-500 font-mono transition-all"
                    placeholder="Enter your API key here..."
                  />
                  <p className="text-[11px] text-zinc-500 mt-1">
                    Your key is saved locally to <span className="text-zinc-600 dark:text-zinc-400">~/.config/watchtower/config.yaml</span> and never leaves your machine.
                  </p>
                </div>
              </div>
            </div>

            {/* Location Setup */}
            <div className="space-y-4 pt-6 border-t border-zinc-200 dark:border-zinc-800/80">
              <h3 className="text-sm font-medium text-blue-600 dark:text-blue-400 uppercase tracking-widest">Location</h3>
              <div className="grid grid-cols-2 gap-5">
                <div className="space-y-2">
                  <label className="text-xs text-zinc-500 dark:text-zinc-400 uppercase">City</label>
                  <input 
                    type="text" 
                    value={formData.Location?.City || ''} 
                    onChange={e => updateField('Location.City', e.target.value)}
                    className="w-full bg-white dark:bg-zinc-900 border border-zinc-300 dark:border-zinc-700 rounded-md p-2.5 text-sm text-zinc-900 dark:text-zinc-200 outline-none focus:border-blue-500 transition-all"
                  />
                </div>
                <div className="space-y-2">
                  <label className="text-xs text-zinc-500 dark:text-zinc-400 uppercase">Country</label>
                  <input 
                    type="text" 
                    value={formData.Location?.Country || ''} 
                    onChange={e => updateField('Location.Country', e.target.value)}
                    className="w-full bg-white dark:bg-zinc-900 border border-zinc-300 dark:border-zinc-700 rounded-md p-2.5 text-sm text-zinc-900 dark:text-zinc-200 outline-none focus:border-blue-500 transition-all"
                  />
                </div>
              </div>
            </div>

            <div className="pt-6 mt-4 flex items-center justify-between border-t border-zinc-200 dark:border-zinc-800/80">
              <span className={`text-sm tracking-wide ${message.includes('success') ? 'text-emerald-600 dark:text-emerald-400' : 'text-rose-600 dark:text-rose-400'}`}>
                {message}
              </span>
              <button 
                type="submit"
                disabled={isSaving}
                className="flex items-center gap-2 px-6 py-2.5 bg-zinc-900 dark:bg-zinc-100 hover:bg-black dark:hover:bg-white text-white dark:text-zinc-900 rounded-md transition-colors text-sm font-medium shadow-sm disabled:opacity-50"
              >
                <Save className="w-4 h-4" />
                {isSaving ? 'Saving Config...' : 'Save Configuration'}
              </button>
            </div>
          </form>
        </CardContent>
      </Card>
    </div>
  );
}
