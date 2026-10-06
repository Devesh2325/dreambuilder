import React, { useState } from 'react';
import { useEditorStore } from '../store/useEditorStore';
import { aiService } from '../../services/aiService';
import { AIMode, AIChangeProposal } from '../../types/ai';
import { 
  Sparkles, 
  X, 
  Send, 
  Check, 
  RotateCcw, 
  Lightbulb, 
  HelpCircle, 
  Sliders, 
  Wand2,
  AlertCircle
} from 'lucide-react';

export const AiAssistantPanel: React.FC = () => {
  const {
    document,
    selectedNodeId,
    setDocument,
    isAiOpen,
    setIsAiOpen,
  } = useEditorStore();

  const [mode, setMode] = useState<AIMode>('generate');
  const [prompt, setPrompt] = useState('');
  const [isProcessing, setIsProcessing] = useState(false);
  const [proposal, setProposal] = useState<AIChangeProposal | null>(null);

  if (!isAiOpen) return null;

  const quickPrompts: Record<AIMode, string[]> = {
    generate: [
      'Create a 3-step SaaS onboarding tour',
      'Generate a launch announcement banner',
      'Build a customer FAQ section with 4 questions',
      'Create a modern B2B hero section with dual CTAs',
    ],
    edit: [
      'Make this element stand out with dark contrast',
      'Increase padding and spacing for readability',
      'Apply smooth rounded corners and brand accent',
    ],
    ask: [
      'How can I improve the conversion rate of this flow?',
      'Is this layout accessible for mobile screens?',
      'What are best practices for tour step counts?',
    ],
  };

  const handleSubmit = async (e?: React.FormEvent) => {
    if (e) e.preventDefault();
    if (!prompt.trim() || !document || isProcessing) return;

    setIsProcessing(true);
    try {
      const result = await aiService.processRequest(
        mode,
        prompt.trim(),
        document,
        selectedNodeId
      );
      setProposal(result);
    } catch (err) {
      console.error('AI Processing error:', err);
    } finally {
      setIsProcessing(false);
    }
  };

  const handleApply = () => {
    if (!proposal || !proposal.modifiedDocumentSnapshot) return;
    setDocument(proposal.modifiedDocumentSnapshot, true);
    setProposal(null);
    setPrompt('');
  };

  const handleReject = () => {
    setProposal(null);
  };

  return (
    <div className="fixed top-14 right-80 bottom-0 w-96 bg-white border-l border-slate-200 shadow-2xl flex flex-col z-30 font-sans select-none animate-in slide-in-from-right duration-200">
      {/* Header */}
      <div className="p-4 border-b border-slate-200 flex items-center justify-between bg-gradient-to-r from-indigo-50/50 to-purple-50/50">
        <div className="flex items-center gap-2">
          <div className="w-7 h-7 rounded-lg bg-indigo-600 text-white flex items-center justify-center shadow-sm">
            <Sparkles className="w-4 h-4" />
          </div>
          <div>
            <h3 className="text-sm font-bold text-slate-800">FlowPilot AI</h3>
            <span className="text-[10px] text-slate-500 font-medium">Assistant & Design Copilot</span>
          </div>
        </div>
        <button
          type="button"
          onClick={() => setIsAiOpen(false)}
          className="p-1 text-slate-400 hover:text-slate-700 rounded-md hover:bg-slate-100"
        >
          <X className="w-4 h-4" />
        </button>
      </div>

      {/* Mode Switcher */}
      <div className="p-3 border-b border-slate-100 bg-slate-50 flex gap-1">
        {(['generate', 'edit', 'ask'] as AIMode[]).map((m) => (
          <button
            key={m}
            type="button"
            onClick={() => {
              setMode(m);
              setProposal(null);
            }}
            className={`flex-1 py-1.5 text-xs font-semibold rounded-lg capitalize transition-all ${
              mode === m
                ? 'bg-white text-indigo-600 shadow-sm'
                : 'text-slate-500 hover:text-slate-800'
            }`}
          >
            {m}
          </button>
        ))}
      </div>

      {/* Body / Chat Stream */}
      <div className="flex-1 overflow-y-auto p-4 space-y-4">
        {/* Helper Note based on mode */}
        <div className="p-3 rounded-lg bg-slate-50 border border-slate-200 text-xs text-slate-600 leading-relaxed">
          {mode === 'generate' && (
            <span>Describe any experience or section and AI will assemble typed visual nodes directly onto your canvas.</span>
          )}
          {mode === 'edit' && (
            <span>
              {selectedNodeId
                ? 'Modify the currently selected element styling, text, or layout.'
                : 'Select an element on canvas to modify its properties, or prompt to update the whole layout.'}
            </span>
          )}
          {mode === 'ask' && (
            <span>Ask questions about your experience flow, conversion design, or target selector configuration.</span>
          )}
        </div>

        {/* Quick Suggestion Pills */}
        <div>
          <span className="text-[10px] font-bold uppercase tracking-wider text-slate-400 mb-2 block">
            Suggested Prompts
          </span>
          <div className="space-y-1.5">
            {quickPrompts[mode].map((q, idx) => (
              <button
                key={idx}
                type="button"
                onClick={() => setPrompt(q)}
                className="w-full text-left text-xs p-2 rounded-lg bg-slate-50 hover:bg-indigo-50 hover:text-indigo-700 border border-slate-200/60 transition-colors text-slate-700 font-medium"
              >
                "{q}"
              </button>
            ))}
          </div>
        </div>

        {/* Proposal / Diff Preview Card */}
        {proposal && (
          <div className="p-3.5 bg-indigo-50/70 border border-indigo-200 rounded-xl space-y-3 animate-in fade-in duration-150">
            <div className="flex items-center gap-1.5 text-indigo-700 font-bold text-xs">
              <Wand2 className="w-3.5 h-3.5" />
              <span>Proposed Changes</span>
            </div>
            <p className="text-xs text-slate-700 leading-relaxed font-medium">
              {proposal.summary}
            </p>

            {proposal.commands.length > 0 && (
              <div className="space-y-1 text-[11px] text-slate-600 bg-white/80 p-2 rounded-lg border border-indigo-100">
                {proposal.commands.map((cmd, i) => (
                  <div key={i} className="flex items-start gap-1.5">
                    <span className="text-indigo-600 font-bold">✓</span>
                    <span>{cmd.explanation}</span>
                  </div>
                ))}
              </div>
            )}

            {/* Apply / Reject Actions */}
            {mode !== 'ask' && (
              <div className="flex items-center gap-2 pt-1">
                <button
                  type="button"
                  onClick={handleApply}
                  className="flex-1 py-1.5 bg-indigo-600 hover:bg-indigo-700 text-white font-bold text-xs rounded-lg shadow-sm flex items-center justify-center gap-1"
                >
                  <Check className="w-3.5 h-3.5" />
                  Apply Changes
                </button>
                <button
                  type="button"
                  onClick={handleReject}
                  className="px-3 py-1.5 bg-white border border-slate-200 hover:bg-slate-50 text-slate-600 text-xs font-semibold rounded-lg"
                >
                  Reject
                </button>
              </div>
            )}
          </div>
        )}
      </div>

      {/* Prompt Input Form */}
      <form onSubmit={handleSubmit} className="p-3 border-t border-slate-200 bg-white">
        <div className="relative">
          <textarea
            rows={2}
            value={prompt}
            onChange={(e) => setPrompt(e.target.value)}
            placeholder={
              mode === 'generate'
                ? 'e.g. Build a 4-step onboarding tour...'
                : mode === 'edit'
                ? 'e.g. Make this button pop with dark contrast...'
                : 'e.g. How can I optimize this for mobile?'
            }
            className="w-full pl-3 pr-10 py-2 text-xs bg-slate-50 border border-slate-200 rounded-xl focus:outline-none focus:ring-1 focus:ring-indigo-500 focus:bg-white resize-none"
          />
          <button
            type="submit"
            disabled={!prompt.trim() || isProcessing}
            className="absolute right-2.5 bottom-3.5 p-1.5 bg-indigo-600 hover:bg-indigo-700 disabled:opacity-40 text-white rounded-lg transition-colors"
          >
            {isProcessing ? (
              <span className="w-3.5 h-3.5 block border-2 border-white border-t-transparent rounded-full animate-spin" />
            ) : (
              <Send className="w-3.5 h-3.5" />
            )}
          </button>
        </div>
      </form>
    </div>
  );
};
