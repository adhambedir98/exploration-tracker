'use client';

import { useState } from 'react';
import { useArchetypes } from '@/lib/useSupabase';
import { useUser } from '@/lib/UserContext';
import { supabase } from '@/lib/supabase';

interface GeneratedIdea {
  name: string;
  description: string;
  archetype: string;
  why_exciting: string;
  risk: string;
}

export default function GeneratePage() {
  const { data: archetypes } = useArchetypes();
  const { user } = useUser();

  const [prompt, setPrompt] = useState('');
  const [selectedArchetype, setSelectedArchetype] = useState('');
  const [context, setContext] = useState('');
  const [ideas, setIdeas] = useState<GeneratedIdea[]>([]);
  const [rawText, setRawText] = useState('');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const [savedIds, setSavedIds] = useState<Set<number>>(new Set());

  const generate = async () => {
    setLoading(true);
    setError('');
    setIdeas([]);
    setRawText('');
    setSavedIds(new Set());

    try {
      const res = await fetch('/api/generate', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          prompt: prompt || undefined,
          archetype: selectedArchetype || undefined,
          context: context || undefined,
        }),
      });

      const data = await res.json();

      if (!res.ok) {
        setError(data.error || 'Failed to generate ideas');
        return;
      }

      if (data.ideas && data.ideas.length > 0) {
        setIdeas(data.ideas);
      } else if (data.raw) {
        setRawText(data.raw);
      } else {
        setError('No ideas generated. Try a different prompt.');
      }
    } catch (err) {
      setError(`Network error: ${err}`);
    } finally {
      setLoading(false);
    }
  };

  const saveIdea = async (idea: GeneratedIdea, index: number) => {
    if (!user) return;

    const archetype = archetypes.find(a =>
      a.name.toLowerCase().includes(idea.archetype.toLowerCase()) ||
      idea.archetype.toLowerCase().includes(a.name.toLowerCase())
    );

    await supabase.from('ideas').insert({
      name: idea.name,
      description: `${idea.description}\n\nWhy exciting: ${idea.why_exciting}\nKey risk: ${idea.risk}`,
      source: 'ai-generator',
      status: 'brainstorm',
      archetype_id: archetype?.id || null,
      added_by: user,
    });

    setSavedIds(prev => { const next = new Set(prev); next.add(index); return next; });
  };

  const PROMPT_TEMPLATES = [
    'Generate ideas adjacent to surgical OR analytics leveraging computer vision',
    'What healthcare operations problems could benefit from sensor + AI solutions?',
    'Explore startup ideas at the intersection of robotics data and surgical operations',
    'What are opportunities in ASC (ambulatory surgery center) optimization?',
    'Generate ideas that create data moats from physical-world healthcare sensors',
  ];

  return (
    <div className="max-w-4xl">
      <div className="mb-6">
        <h1 className="text-text text-lg font-semibold">AI Idea Generator</h1>
        <p className="text-muted text-sm mt-1">Use AI to brainstorm startup ideas based on Caddy&apos;s position and reference database</p>
      </div>

      {/* Input Section */}
      <div className="bg-card border border-border rounded p-5 mb-6">
        <div className="space-y-4">
          <div>
            <label className="text-xs text-dim block mb-1">Prompt</label>
            <textarea
              value={prompt}
              onChange={e => setPrompt(e.target.value)}
              className="w-full h-24 resize-none"
              placeholder="Describe what kind of ideas you want to explore..."
            />
          </div>

          {/* Quick prompts */}
          <div>
            <span className="text-xs text-dim mb-2 block">Quick prompts:</span>
            <div className="flex flex-wrap gap-2">
              {PROMPT_TEMPLATES.map((t, i) => (
                <button
                  key={i}
                  onClick={() => setPrompt(t)}
                  className="text-xs px-2.5 py-1 rounded bg-surface border border-border text-muted hover:text-text hover:border-dim transition-colors"
                >
                  {t.slice(0, 50)}...
                </button>
              ))}
            </div>
          </div>

          <div className="grid grid-cols-2 gap-3">
            <div>
              <label className="text-xs text-dim block mb-1">Focus Archetype (optional)</label>
              <select
                value={selectedArchetype}
                onChange={e => setSelectedArchetype(e.target.value)}
                className="w-full"
              >
                <option value="">Any</option>
                {archetypes.map(a => (
                  <option key={a.id} value={a.name}>{a.name}</option>
                ))}
              </select>
            </div>
            <div>
              <label className="text-xs text-dim block mb-1">Additional Context (optional)</label>
              <input
                value={context}
                onChange={e => setContext(e.target.value)}
                className="w-full"
                placeholder="e.g. focus on Series A stage, PE buyers..."
              />
            </div>
          </div>

          <button
            onClick={generate}
            disabled={loading}
            className="w-full py-2.5 text-sm bg-accent/15 text-accent rounded hover:bg-accent/25 transition-colors disabled:opacity-50 font-medium"
          >
            {loading ? (
              <span className="flex items-center justify-center gap-2">
                <span className="w-4 h-4 border-2 border-accent/30 border-t-accent rounded-full animate-spin" />
                Generating ideas...
              </span>
            ) : (
              'Generate Ideas'
            )}
          </button>
        </div>
      </div>

      {/* Error */}
      {error && (
        <div className="bg-red-500/10 border border-red-500/20 rounded p-4 mb-6">
          <p className="text-sm text-red-400">{error}</p>
        </div>
      )}

      {/* Results */}
      {ideas.length > 0 && (
        <div className="space-y-4">
          <h2 className="text-text text-sm font-medium">Generated Ideas</h2>
          {ideas.map((idea, i) => (
            <div key={i} className="bg-card border border-border rounded p-5">
              <div className="flex items-start justify-between gap-3 mb-3">
                <h3 className="text-text font-medium">{idea.name}</h3>
                {savedIds.has(i) ? (
                  <span className="text-xs text-emerald-400 flex-shrink-0">Saved to funnel</span>
                ) : (
                  <button
                    onClick={() => saveIdea(idea, i)}
                    className="text-xs px-3 py-1 bg-accent/15 text-accent rounded hover:bg-accent/25 transition-colors flex-shrink-0"
                  >
                    Add to Funnel
                  </button>
                )}
              </div>
              <p className="text-sm text-muted mb-3">{idea.description}</p>
              <div className="grid grid-cols-2 gap-3">
                <div>
                  <span className="text-xs text-dim block mb-0.5">Archetype</span>
                  <span className="text-xs text-accent">{idea.archetype}</span>
                </div>
                <div>
                  <span className="text-xs text-dim block mb-0.5">Key Risk</span>
                  <span className="text-xs text-muted">{idea.risk}</span>
                </div>
              </div>
              {idea.why_exciting && (
                <div className="mt-3">
                  <span className="text-xs text-dim block mb-0.5">Why Exciting</span>
                  <span className="text-xs text-muted">{idea.why_exciting}</span>
                </div>
              )}
            </div>
          ))}
        </div>
      )}

      {/* Raw text fallback */}
      {rawText && (
        <div className="bg-card border border-border rounded p-5">
          <h2 className="text-text text-sm font-medium mb-3">AI Response</h2>
          <pre className="text-sm text-muted whitespace-pre-wrap font-mono">{rawText}</pre>
        </div>
      )}
    </div>
  );
}
