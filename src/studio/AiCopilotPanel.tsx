import React, { useState } from 'react';
import { Check, Loader2, Plus, Sparkles, Wand2 } from 'lucide-react';
import { rebrandVariablesWithAi } from '../core/aiGenerator';
import { buildContent, button, el, heading, section, text } from '../templates/dsl';
import { fieldClass, labelClass } from './fields';
import { useStudio } from './store';

type AiTab = 'variables' | 'sections';

export const AiCopilotPanel: React.FC = () => {
  const draft = useStudio((s) => s.draft);
  const readOnly = useStudio((s) => s.readOnly);
  const { updateDraft, addNodes } = useStudio.getState();

  const [tab, setTab] = useState<AiTab>('variables');
  const [prompt, setPrompt] = useState('');
  const [sectionType, setSectionType] = useState<'features' | 'testimonials' | 'cta'>('features');
  const [isProcessing, setIsProcessing] = useState(false);
  const [successMsg, setSuccessMsg] = useState<string | null>(null);

  if (!draft) return null;

  const handleFillVariables = async () => {
    if (!prompt.trim() || readOnly) return;
    setIsProcessing(true);
    setSuccessMsg(null);

    await new Promise((r) => setTimeout(r, 600));

    const updated = rebrandVariablesWithAi(draft.variables || {}, prompt);
    updateDraft((d) => {
      d.variables = { ...d.variables, ...updated };
    });

    setIsProcessing(false);
    setSuccessMsg('Successfully updated all page variables with AI!');
    setTimeout(() => setSuccessMsg(null), 4000);
  };

  const handleInsertSection = async () => {
    if (readOnly) return;
    setIsProcessing(true);
    setSuccessMsg(null);

    await new Promise((r) => setTimeout(r, 600));

    const timestamp = Date.now().toString(36).slice(-4);
    let elements = [];

    if (sectionType === 'features') {
      elements.push(
        section([
          el('Box', { styles: { textAlign: 'center', gap: '8px', maxWidth: '640px', margin: '0 auto 36px auto' } }, [
            heading('Engineered for High Performance', 'h2', { fontSize: '2rem', fontWeight: 800 }),
            text('Key capabilities and advantages designed to drive conversion.', { color: 'var(--fp-muted)' }),
          ]),
          el('Grid', { styles: { gridTemplateColumns: 'repeat(2, minmax(0, 1fr))', gap: '20px' }, responsive: { mobile: { gridTemplateColumns: 'minmax(0, 1fr)' } } }, [
            el('Card', { styles: { padding: '24px', background: 'var(--fp-surface)', borderRadius: '16px', gap: '10px', border: '1px solid rgba(255,255,255,0.08)' } }, [
              heading('Instant Setup', 'h3', { fontSize: '1.25rem', fontWeight: 700 }),
              text('Deploy in seconds with seamless zero-config automation.', { color: 'var(--fp-muted)' }),
            ]),
            el('Card', { styles: { padding: '24px', background: 'var(--fp-surface)', borderRadius: '16px', gap: '10px', border: '1px solid rgba(255,255,255,0.08)' } }, [
              heading('Real-Time Insights', 'h3', { fontSize: '1.25rem', fontWeight: 700 }),
              text('Monitor engagement, clicks, and conversion analytics live.', { color: 'var(--fp-muted)' }),
            ]),
          ]),
        ])
      );
    } else if (sectionType === 'testimonials') {
      elements.push(
        section([
          el('Box', { styles: { textAlign: 'center', gap: '8px', maxWidth: '640px', margin: '0 auto 36px auto' } }, [
            heading('Verified Customer Reviews', 'h2', { fontSize: '2rem', fontWeight: 800 }),
            text('See what fast-growing teams say about our platform.', { color: 'var(--fp-muted)' }),
          ]),
          el('Grid', { styles: { gridTemplateColumns: 'repeat(3, minmax(0, 1fr))', gap: '20px' }, responsive: { tablet: { gridTemplateColumns: 'repeat(2, minmax(0, 1fr))' }, mobile: { gridTemplateColumns: 'minmax(0, 1fr)' } } }, [
            el('Card', { styles: { padding: '24px', background: 'var(--fp-surface)', borderRadius: '16px', gap: '12px', border: '1px solid rgba(255,255,255,0.08)' } }, [
              el('Rating', { props: { rating: 5, maxRating: 5, starColor: '#f59e0b' } }),
              text('"Incredible product experience that 3x-ed our conversions."', { fontStyle: 'italic', color: 'var(--fp-text)' }),
              text('— VP of Growth', { fontSize: '0.8125rem', color: 'var(--fp-muted)', fontWeight: 600 }),
            ]),
            el('Card', { styles: { padding: '24px', background: 'var(--fp-surface)', borderRadius: '16px', gap: '12px', border: '1px solid rgba(255,255,255,0.08)' } }, [
              el('Rating', { props: { rating: 5, maxRating: 5, starColor: '#f59e0b' } }),
              text('"The AI synthesis saved our team weeks of custom dev work."', { fontStyle: 'italic', color: 'var(--fp-text)' }),
              text('— Lead Architect', { fontSize: '0.8125rem', color: 'var(--fp-muted)', fontWeight: 600 }),
            ]),
            el('Card', { styles: { padding: '24px', background: 'var(--fp-surface)', borderRadius: '16px', gap: '12px', border: '1px solid rgba(255,255,255,0.08)' } }, [
              el('Rating', { props: { rating: 5, maxRating: 5, starColor: '#f59e0b' } }),
              text('"Reliable, responsive, and completely scalable across our sites."', { fontStyle: 'italic', color: 'var(--fp-text)' }),
              text('— Founder & CEO', { fontSize: '0.8125rem', color: 'var(--fp-muted)', fontWeight: 600 }),
            ]),
          ]),
        ])
      );
    } else {
      elements.push(
        section([
          el('Card', { styles: { textAlign: 'center', padding: '48px 24px', background: 'linear-gradient(180deg, rgba(99,102,241,0.15) 0%, var(--fp-surface) 100%)', border: '1px solid var(--fp-primary)', borderRadius: '20px', gap: '16px', maxWidth: '800px', margin: '0 auto' } }, [
            heading('Ready to Transform Your Customer Journey?', 'h2', { fontSize: '2.25rem', fontWeight: 800 }),
            text('Join thousands of companies scaling their growth with FlowPilot.', { color: 'var(--fp-muted)', maxWidth: '520px', margin: '0 auto' }),
            el('Row', { styles: { justifyContent: 'center', gap: '12px', marginTop: '8px' } }, [
              button('Get Started Today →', '#', 'primary'),
            ]),
          ]),
        ])
      );
    }

    const content = buildContent(`ai_sec_${timestamp}`, elements);
    addNodes(content.rootId, content.nodes);

    setIsProcessing(false);
    setSuccessMsg(`Added ${sectionType} section to canvas!`);
    setTimeout(() => setSuccessMsg(null), 4000);
  };

  return (
    <div className="p-4 space-y-5 text-slate-800 dark:text-slate-200">
      {/* Header */}
      <div className="flex items-center gap-2 p-3 rounded-2xl bg-gradient-to-r from-indigo-500/10 via-purple-500/10 to-amber-500/10 border border-indigo-200/60 dark:border-indigo-800/60">
        <span className="p-2 rounded-xl bg-gradient-to-r from-indigo-600 to-purple-600 text-white shadow-sm">
          <Sparkles className="w-4 h-4 text-amber-300" />
        </span>
        <div>
          <h3 className="font-bold text-sm text-slate-900 dark:text-white">AI Studio Copilot</h3>
          <p className="text-[11px] text-slate-500 dark:text-slate-400">Auto-fill variables and generate sections</p>
        </div>
      </div>

      {/* Tabs */}
      <div className="flex gap-1 p-1 rounded-xl bg-slate-100 dark:bg-slate-800/80 text-xs font-semibold">
        <button
          type="button"
          onClick={() => setTab('variables')}
          className={`flex-1 py-1.5 px-2 rounded-lg transition-colors ${
            tab === 'variables' ? 'bg-white dark:bg-slate-700 text-indigo-600 dark:text-indigo-300 shadow-sm' : 'text-slate-500'
          }`}
        >
          Fill All Variables
        </button>
        <button
          type="button"
          onClick={() => setTab('sections')}
          className={`flex-1 py-1.5 px-2 rounded-lg transition-colors ${
            tab === 'sections' ? 'bg-white dark:bg-slate-700 text-indigo-600 dark:text-indigo-300 shadow-sm' : 'text-slate-500'
          }`}
        >
          Insert Section
        </button>
      </div>

      {/* Tab 1: Fill All Variables with AI */}
      {tab === 'variables' && (
        <div className="space-y-3">
          <div>
            <label className={labelClass}>Describe your product or brand</label>
            <textarea
              rows={3}
              className={`${fieldClass} resize-none leading-relaxed text-xs`}
              placeholder="e.g. Rebrand this page for an AI accounting tool with automated tax filing, 5-star customer ratings, and pricing tiers..."
              value={prompt}
              onChange={(e) => setPrompt(e.target.value)}
            />
            <p className="mt-1 text-[11px] text-slate-400">
              AI will rewrite Company Name, Tagline, Hero Headline, Subtitle, Testimonials, Ratings, and FAQs in one click.
            </p>
          </div>

          <button
            type="button"
            disabled={isProcessing || !prompt.trim() || readOnly}
            onClick={handleFillVariables}
            className="w-full py-2 px-3 rounded-xl bg-indigo-600 hover:bg-indigo-500 text-white font-bold text-xs flex items-center justify-center gap-2 shadow-sm disabled:opacity-50 transition-all"
          >
            {isProcessing ? (
              <>
                <Loader2 className="w-3.5 h-3.5 animate-spin" />
                <span>Auto-filling variables...</span>
              </>
            ) : (
              <>
                <Wand2 className="w-3.5 h-3.5 text-amber-300" />
                <span>Auto-Fill All Variables</span>
              </>
            )}
          </button>
        </div>
      )}

      {/* Tab 2: Insert Section */}
      {tab === 'sections' && (
        <div className="space-y-3">
          <div>
            <label className={labelClass}>Choose Section to Insert</label>
            <select
              className={fieldClass}
              value={sectionType}
              onChange={(e) => setSectionType(e.target.value as any)}
            >
              <option value="features">⚡ Feature Pillars Grid</option>
              <option value="testimonials">💬 Testimonials with Star Ratings</option>
              <option value="cta">🚀 Call to Action Banner</option>
            </select>
          </div>

          <button
            type="button"
            disabled={isProcessing || readOnly}
            onClick={handleInsertSection}
            className="w-full py-2 px-3 rounded-xl bg-indigo-600 hover:bg-indigo-500 text-white font-bold text-xs flex items-center justify-center gap-2 shadow-sm disabled:opacity-50 transition-all"
          >
            {isProcessing ? (
              <>
                <Loader2 className="w-3.5 h-3.5 animate-spin" />
                <span>Generating section...</span>
              </>
            ) : (
              <>
                <Plus className="w-3.5 h-3.5 text-amber-300" />
                <span>Insert Section with AI</span>
              </>
            )}
          </button>
        </div>
      )}

      {/* Success Notification */}
      {successMsg && (
        <div className="p-3 rounded-xl bg-emerald-50 dark:bg-emerald-950/40 border border-emerald-200 dark:border-emerald-800 text-xs font-semibold text-emerald-800 dark:text-emerald-300 flex items-center gap-2 animate-in fade-in">
          <Check className="w-4 h-4 text-emerald-600 shrink-0" />
          <span>{successMsg}</span>
        </div>
      )}
    </div>
  );
};
