import React, { useEffect, useMemo, useState } from 'react';
import { Link } from 'react-router-dom';
import {
  ArrowRight,
  BarChart3,
  Bot,
  Braces,
  Check,
  ChevronDown,
  Code2,
  Copy,
  Cpu,
  Crown,
  Eye,
  Layers,
  LayoutTemplate,
  Monitor,
  MonitorSmartphone,
  MousePointerClick,
  Palette,
  Play,
  Rocket,
  RotateCcw,
  ShieldCheck,
  Smartphone,
  Sparkles,
  Star,
  Tablet,
  Users,
  Video,
  Wand2,
  Zap,
  Puzzle,
  Download,
} from 'lucide-react';
import { MODULE_LIST } from '../../core/modules';
import { getTemplate, TEMPLATES } from '../../templates';
import { SECTION_LIBRARY } from '../../templates/sections';
import { ROUTES } from '../routes';
import { Icon } from '../shared/Icon';
import { LiveThumbnail } from '../templates/LiveThumbnail';
import { GoogleTranslateSelector } from '../shared/GoogleTranslate';
import { WebsiteFooter } from '../shared/WebsiteFooter';
import { useWebsiteConfig } from '../../data/websiteConfigStore';

const SHOWCASE = ['website-restaurant', 'page-fintech-app', 'website-saas', 'page-travel-package', 'website-clinic', 'page-gym-offer'];
const INDUSTRIES = [
  'FinTech & Wealth',
  'SaaS Platforms',
  'Digital Agencies',
  'Health & Clinics',
  'Consulting & Advisory',
  'Mobile Apps',
  'Real Estate',
  'E-Commerce',
  'Education',
  'Creator Portfolios',
];

const SANDBOX_TABS = [
  { id: 'website', label: '🌐 Website & Page', icon: '🌐', title: 'High-Converting Landing Page' },
  { id: 'tour', label: '🧭 Product Tour', icon: '🧭', title: 'Zero-CSS-Bleed Product Tour' },
  { id: 'demo', label: '🎮 Clickable Demo', icon: '🎮', title: 'Interactive Demo with Spotlight' },
  { id: 'form', label: '📋 Lead Form', icon: '📋', title: 'Multi-Step Survey & Intake' },
] as const;

export const LandingPage: React.FC = () => {
  const config = useWebsiteConfig();
  const [activeTab, setActiveTab] = useState<'website' | 'tour' | 'demo' | 'form'>('website');
  const [sandboxDevice, setSandboxDevice] = useState<'desktop' | 'tablet' | 'mobile'>('desktop');
  const [tourStep, setTourStep] = useState(1);
  const [demoSpotlight, setDemoSpotlight] = useState<'menu' | 'profile' | 'action'>('action');
  const [formRating, setFormRating] = useState(5);
  const [formSubmitted, setFormSubmitted] = useState(false);
  const [customHeadline, setCustomHeadline] = useState('Build Anything Without Code.');
  const [sandboxColor, setSandboxColor] = useState('#4f46e5');

  useEffect(() => {
    const previous = document.title;
    document.title = `${config.company.name} · The Modern Visual Experience Platform`;
    return () => {
      document.title = previous;
    };
  }, [config.company.name]);

  const templates = useMemo(() => SHOWCASE.flatMap((id) => getTemplate(id) ?? []), []);

  return (
    <div className="h-screen overflow-y-auto scroll-smooth bg-slate-950 text-slate-100 font-sans selection:bg-indigo-500 selection:text-white">
      {/* 3D and Modern Visual Effect Styles */}
      <style>{`
        @keyframes fp-pulse-glow {
          0%, 100% { transform: scale(1); opacity: 0.8; }
          50% { transform: scale(1.08); opacity: 1; }
        }
        @keyframes fp-float-3d {
          0%, 100% { transform: translateY(0px) rotateX(2deg) rotateY(-2deg); }
          50% { transform: translateY(-8px) rotateX(-2deg) rotateY(2deg); }
        }
        @keyframes fp-ticker {
          0% { transform: translateX(0); }
          100% { transform: translateX(-50%); }
        }
        .fp-3d-perspective {
          perspective: 1200px;
        }
        .fp-3d-card {
          transform-style: preserve-3d;
          transition: transform 0.4s cubic-bezier(0.16, 1, 0.3, 1), box-shadow 0.4s ease;
        }
        .fp-3d-card:hover {
          transform: translateY(-6px) rotateX(2deg) rotateY(-2deg);
          box-shadow: 0 25px 50px -12px rgba(99, 102, 241, 0.25);
        }
        .fp-3d-float {
          animation: fp-float-3d 6s ease-in-out infinite;
        }
        .fp-glow-orb {
          animation: fp-pulse-glow 4s ease-in-out infinite;
        }
        .fp-ticker-strip {
          animation: fp-ticker 30s linear infinite;
        }
        @media (prefers-reduced-motion: reduce) {
          .fp-3d-float, .fp-glow-orb, .fp-ticker-strip { animation: none; }
        }
      `}</style>

      {/* Top Floating Glassmorphism Navbar */}
      <header className="sticky top-0 z-50 bg-slate-950/80 backdrop-blur-xl border-b border-white/10 transition-all">
        <div className="max-w-7xl mx-auto h-16 px-6 flex items-center justify-between gap-6">
          <Link to={ROUTES.landing} className="flex items-center gap-2.5 group">
            <span
              aria-hidden="true"
              className="w-9 h-9 flex items-center justify-center rounded-xl bg-gradient-to-tr from-indigo-600 via-purple-600 to-pink-500 text-white font-extrabold text-base shadow-lg shadow-indigo-600/30 group-hover:scale-105 transition-transform"
            >
              F
            </span>
            <span className="font-extrabold text-xl tracking-tight text-white group-hover:text-indigo-400 transition-colors">
              {config.company.name}
            </span>
          </Link>

          <nav aria-label="Landing page" className="hidden lg:flex items-center gap-7 text-xs font-bold uppercase tracking-wider text-slate-300">
            <a href="#sandbox" className="hover:text-indigo-400 transition-colors flex items-center gap-1.5">
              <Sparkles className="w-3.5 h-3.5 text-amber-400" />
              Try Live Studio
            </a>
            <a href="#pillars" className="hover:text-white transition-colors">Key Features</a>
            <a href="#templates" className="hover:text-white transition-colors">Templates</a>
            <a href="#compare" className="hover:text-white transition-colors">Why FlowPilot</a>
            <a href="/downloads/flowpilot-extension.zip" download="flowpilot-extension.zip" className="hover:text-indigo-400 transition-colors flex items-center gap-1 text-indigo-300">
              <Puzzle className="w-3.5 h-3.5" />
              <span>Extension</span>
            </a>
            <a href="#faqs" className="hover:text-white transition-colors">FAQs</a>
            <Link to={ROUTES.docs} className="hover:text-white transition-colors">Docs</Link>
          </nav>

          <div className="flex items-center gap-3">
            <GoogleTranslateSelector variant="pill" className="hidden sm:inline-block" />
            <Link
              to={ROUTES.login}
              className="px-3.5 py-1.5 text-xs font-semibold text-slate-300 hover:text-white transition-colors"
            >
              Sign In
            </Link>
            <Link
              to={ROUTES.signUp}
              className="px-4 py-2 text-xs font-bold uppercase tracking-wide text-white bg-indigo-600 hover:bg-indigo-500 rounded-xl shadow-md shadow-indigo-600/30 transition-all cursor-pointer flex items-center gap-1.5"
            >
              <span>Get Started Free</span>
              <ArrowRight className="w-3.5 h-3.5" />
            </Link>
          </div>
        </div>
      </header>

      <main>
        {/* ========================================================================= */}
        {/* 1. HERO SECTION WITH 3D DEPTH, LUMINOUS AURA, AND LIVE TRY-IT BUTTONS */}
        {/* ========================================================================= */}
        <section aria-labelledby="hero-title" className="relative overflow-hidden pt-20 pb-24 px-6 fp-3d-perspective">
          {/* Background Ambient Glow Lighting */}
          <div className="absolute top-0 left-1/2 -translate-x-1/2 w-[800px] h-[450px] bg-gradient-to-b from-indigo-600/25 via-purple-600/15 to-transparent rounded-full blur-[120px] pointer-events-none fp-glow-orb" />
          <div className="absolute top-40 right-10 w-96 h-96 bg-pink-500/10 rounded-full blur-[100px] pointer-events-none" />
          <div className="absolute top-40 left-10 w-96 h-96 bg-cyan-500/10 rounded-full blur-[100px] pointer-events-none" />

          <div className="relative max-w-6xl mx-auto text-center z-10">
            {/* Luminous Top Badge */}
            <div className="inline-flex items-center gap-2 px-3.5 py-1.5 rounded-full text-xs font-bold uppercase tracking-wider text-indigo-300 bg-white/5 border border-white/10 shadow-inner backdrop-blur-md mb-6">
              <Sparkles className="w-4 h-4 text-amber-400 fill-amber-400" />
              <span>{config.company.badgeText || '⚡ Next-Gen Experience Studio · 3D Interactive Engine'}</span>
            </div>

            {/* Impact Headline */}
            <h1 id="hero-title" className="text-4xl sm:text-6xl lg:text-7xl font-extrabold tracking-tight text-white leading-[1.08] max-w-5xl mx-auto">
              Build it in minutes.{' '}
              <span className="block mt-1 bg-gradient-to-r from-indigo-300 via-purple-300 to-pink-400 bg-clip-text text-transparent">
                No code needed. Zero CSS leakage.
              </span>
            </h1>

            {/* Subtitle */}
            <p className="mt-6 text-base sm:text-xl text-slate-300 max-w-3xl mx-auto leading-relaxed">
              The modern all-in-one studio for high-converting <strong>Websites</strong>, zero-leakage{' '}
              <strong>Product Tours</strong>, clickable <strong>Demos with Area Spotlights</strong>, and multi-step{' '}
              <strong>Survey Funnels</strong>. Built with Shadow DOM for complete host safety.
            </p>

            {/* Dual Hero Call to Actions */}
            <div className="mt-8 flex flex-wrap items-center justify-center gap-4">
              <Link
                to={ROUTES.signUp}
                className="px-7 py-3.5 text-sm font-bold rounded-2xl text-white bg-gradient-to-r from-indigo-600 to-purple-600 hover:from-indigo-500 hover:to-purple-500 shadow-xl shadow-indigo-600/30 hover:shadow-indigo-600/50 hover:scale-[1.02] active:scale-[0.98] transition-all cursor-pointer flex items-center gap-2"
              >
                <Rocket className="w-4 h-4" />
                <span>Start Free Workspace</span>
              </Link>

              <a
                href="#sandbox"
                className="px-7 py-3.5 text-sm font-bold rounded-2xl text-slate-200 bg-white/10 hover:bg-white/15 border border-white/15 backdrop-blur-md shadow-lg hover:scale-[1.02] active:scale-[0.98] transition-all flex items-center gap-2"
              >
                <Play className="w-4 h-4 text-emerald-400 fill-emerald-400" />
                <span>Try Live Studio (No Sign-In Required)</span>
              </a>
            </div>

            {/* Trust Metrics Pill Strip */}
            <div className="mt-12 flex flex-wrap items-center justify-center gap-6 sm:gap-10 text-xs font-semibold text-slate-400">
              <span className="flex items-center gap-2">
                <ShieldCheck className="w-4 h-4 text-emerald-400" />
                100% Shadow DOM Isolation
              </span>
              <span className="flex items-center gap-2">
                <Puzzle className="w-4 h-4 text-purple-400" />
                Chrome Extension Visual Builder
              </span>
              <span className="flex items-center gap-2">
                <Zap className="w-4 h-4 text-amber-400" />
                0 Layout Shift Guarantee
              </span>
              <span className="flex items-center gap-2">
                <Bot className="w-4 h-4 text-indigo-400" />
                Gemini 2.0 Flash AI Generation
              </span>
              <span className="flex items-center gap-2">
                <Palette className="w-4 h-4 text-pink-400" />
                Dual Dark & Light Mode
              </span>
            </div>
          </div>
        </section>

        {/* ========================================================================= */}
        {/* 2. LIVE INTERACTIVE 3D SANDBOX: TRY WITHOUT SIGNING IN */}
        {/* ========================================================================= */}
        <section id="sandbox" aria-labelledby="sandbox-title" className="py-20 px-6 bg-slate-900/60 border-y border-white/10 relative">
          <div className="max-w-6xl mx-auto">
            <div className="text-center max-w-3xl mx-auto mb-10">
              <div className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-xs font-bold uppercase tracking-wider text-emerald-400 bg-emerald-500/10 border border-emerald-500/20 mb-3">
                <Sparkles className="w-3.5 h-3.5" /> Instant Free Sandbox · No Sign-in Required
              </div>
              <h2 id="sandbox-title" className="text-3xl sm:text-5xl font-extrabold tracking-tight text-white">
                Test the Builder Right Now
              </h2>
              <p className="mt-3 text-sm sm:text-base text-slate-300">
                Switch between experience types, customize content, and see our 3D canvas render live on any screen.
              </p>
            </div>

            {/* Interactive Sandbox Canvas Container */}
            <div className="rounded-3xl border border-white/15 bg-slate-950/90 shadow-2xl shadow-indigo-950 overflow-hidden fp-3d-card">
              {/* Studio Canvas Top Toolbar */}
              <div className="px-5 py-3.5 bg-slate-900/90 border-b border-white/10 flex flex-wrap items-center justify-between gap-4">
                {/* Module Mode Tabs */}
                <div className="flex items-center gap-1.5 p-1 rounded-xl bg-slate-950/80 border border-white/10">
                  {SANDBOX_TABS.map((tab) => (
                    <button
                      key={tab.id}
                      type="button"
                      onClick={() => {
                        setActiveTab(tab.id);
                        setFormSubmitted(false);
                      }}
                      className={`px-3 py-1.5 rounded-lg text-xs font-bold transition-all cursor-pointer flex items-center gap-1.5 ${
                        activeTab === tab.id
                          ? 'bg-indigo-600 text-white shadow-sm'
                          : 'text-slate-400 hover:text-white hover:bg-white/5'
                      }`}
                    >
                      <span>{tab.icon}</span>
                      <span className="hidden sm:inline">{tab.label}</span>
                    </button>
                  ))}
                </div>

                {/* Device Resizer Toggles */}
                <div className="flex items-center gap-1 p-1 rounded-xl bg-slate-950/80 border border-white/10">
                  {[
                    { id: 'desktop', icon: Monitor, label: 'Desktop' },
                    { id: 'tablet', icon: Tablet, label: 'Tablet' },
                    { id: 'mobile', icon: Smartphone, label: 'Mobile' },
                  ].map((dev) => (
                    <button
                      key={dev.id}
                      type="button"
                      onClick={() => setSandboxDevice(dev.id as any)}
                      aria-label={dev.label}
                      className={`p-1.5 rounded-lg text-xs transition-colors cursor-pointer ${
                        sandboxDevice === dev.id ? 'bg-white/20 text-white' : 'text-slate-400 hover:text-slate-200'
                      }`}
                    >
                      <dev.icon className="w-4 h-4" />
                    </button>
                  ))}
                </div>
              </div>

              {/* Live Preview Display Area */}
              <div className="p-6 sm:p-10 flex justify-center items-center min-h-[460px] bg-slate-950/50">
                <div
                  className={`transition-all duration-300 w-full rounded-2xl border border-white/15 bg-slate-900 shadow-2xl p-6 sm:p-8 relative ${
                    sandboxDevice === 'mobile'
                      ? 'max-w-sm'
                      : sandboxDevice === 'tablet'
                      ? 'max-w-2xl'
                      : 'max-w-4xl'
                  }`}
                >
                  {/* TAB 1: WEBSITE & LANDING PAGE */}
                  {activeTab === 'website' && (
                    <div className="space-y-6">
                      <div className="flex items-center justify-between gap-4 border-b border-white/10 pb-4">
                        <div className="flex items-center gap-2">
                          <span
                            className="w-7 h-7 rounded-lg flex items-center justify-center text-white font-bold text-xs"
                            style={{ backgroundColor: sandboxColor }}
                          >
                            A
                          </span>
                          <span className="font-bold text-sm text-white">Acme Platform</span>
                        </div>
                        <div className="flex items-center gap-2">
                          {['#4f46e5', '#059669', '#e11d48', '#0284c7'].map((c) => (
                            <button
                              key={c}
                              type="button"
                              onClick={() => setSandboxColor(c)}
                              className={`w-5 h-5 rounded-full border border-white/20 transition-transform ${
                                sandboxColor === c ? 'scale-125 ring-2 ring-white' : ''
                              }`}
                              style={{ backgroundColor: c }}
                            />
                          ))}
                        </div>
                      </div>

                      <div className="text-center py-6 space-y-3">
                        <input
                          type="text"
                          value={customHeadline}
                          onChange={(e) => setCustomHeadline(e.target.value)}
                          className="w-full text-center text-2xl sm:text-3xl font-extrabold text-white bg-transparent border-b border-white/15 hover:border-indigo-400 focus:outline-none focus:border-indigo-500 transition-colors pb-1"
                          title="Click to live-edit this headline!"
                        />
                        <p className="text-xs text-indigo-300 font-medium">
                          👆 Click to live-edit the headline above without logging in!
                        </p>
                        <p className="text-sm text-slate-300 max-w-lg mx-auto">
                          Launch publication-ready landing pages with dynamic headline tickers, client rating stars, and interactive action buttons.
                        </p>
                        <div className="pt-2 flex justify-center gap-3">
                          <button
                            type="button"
                            className="px-5 py-2.5 rounded-xl font-bold text-white text-xs shadow-md"
                            style={{ backgroundColor: sandboxColor }}
                          >
                            Explore Demo Tour →
                          </button>
                          <button
                            type="button"
                            className="px-5 py-2.5 rounded-xl font-bold text-slate-300 bg-white/10 text-xs hover:bg-white/15"
                          >
                            Read Case Study
                          </button>
                        </div>
                      </div>
                    </div>
                  )}

                  {/* TAB 2: PRODUCT TOUR */}
                  {activeTab === 'tour' && (
                    <div className="space-y-6">
                      <div className="p-4 rounded-xl bg-slate-950/80 border border-white/10 flex items-center justify-between text-xs text-slate-400">
                        <span>Host Application Canvas</span>
                        <span className="text-emerald-400">● Shadow DOM Connected</span>
                      </div>

                      <div className="relative p-6 rounded-2xl bg-indigo-950/40 border border-indigo-500/40 shadow-xl">
                        <div className="flex items-center gap-2 mb-2 text-indigo-300 text-xs font-bold uppercase tracking-wider">
                          <Sparkles className="w-4 h-4 text-amber-400" />
                          <span>Tour Step {tourStep} of 3</span>
                        </div>
                        <h3 className="text-lg font-bold text-white">
                          {tourStep === 1 && 'Welcome to Your Next-Gen Dashboard'}
                          {tourStep === 2 && 'Zero Style Leakage with Shadow DOM'}
                          {tourStep === 3 && 'Instant Multi-Language & Dark Theme'}
                        </h3>
                        <p className="mt-1 text-xs text-slate-300">
                          {tourStep === 1 && 'FlowPilot steps attach to your DOM elements safely without touching your site stylesheets.'}
                          {tourStep === 2 && 'Even aggressive global CSS resets (* { margin: 0 }) cannot alter FlowPilot components.'}
                          {tourStep === 3 && 'Tours natively adapt to user dark/light mode preferences and over 12 global languages.'}
                        </p>
                        <div className="mt-4 flex items-center justify-between pt-2 border-t border-white/10">
                          <button
                            type="button"
                            disabled={tourStep === 1}
                            onClick={() => setTourStep((s) => Math.max(1, s - 1))}
                            className="px-3 py-1.5 rounded-lg text-xs font-medium text-slate-400 hover:text-white disabled:opacity-40"
                          >
                            Previous
                          </button>
                          <button
                            type="button"
                            onClick={() => setTourStep((s) => (s % 3) + 1)}
                            className="px-4 py-1.5 rounded-lg text-xs font-bold text-white bg-indigo-600 hover:bg-indigo-500"
                          >
                            {tourStep === 3 ? 'Restart Tour' : 'Next Step →'}
                          </button>
                        </div>
                      </div>
                    </div>
                  )}

                  {/* TAB 3: CLICKABLE DEMO WITH SPOTLIGHT */}
                  {activeTab === 'demo' && (
                    <div className="space-y-5">
                      <div className="flex items-center justify-between text-xs">
                        <span className="font-bold text-slate-300">Highlight Area Spotlight:</span>
                        <div className="flex gap-2">
                          {[
                            { id: 'menu', label: '📌 Menu Bar' },
                            { id: 'profile', label: '👤 Profile' },
                            { id: 'action', label: '⚡ Action CTA' },
                          ].map((spot) => (
                            <button
                              key={spot.id}
                              type="button"
                              onClick={() => setDemoSpotlight(spot.id as any)}
                              className={`px-3 py-1 rounded-lg text-xs font-bold transition-all ${
                                demoSpotlight === spot.id
                                  ? 'bg-amber-400 text-slate-950 font-extrabold shadow-md'
                                  : 'bg-white/10 text-slate-300 hover:bg-white/20'
                              }`}
                            >
                              {spot.label}
                            </button>
                          ))}
                        </div>
                      </div>

                      {/* Mockup Screen with Spotlight Focus Ring */}
                      <div className="relative rounded-xl border border-white/15 bg-slate-950 p-4 min-h-[220px]">
                        {demoSpotlight === 'menu' && (
                          <div className="p-3 rounded-lg border-2 border-amber-400 bg-amber-400/10 shadow-[0_0_20px_rgba(251,191,36,0.3)] flex items-center justify-between text-xs text-white font-bold animate-pulse">
                            <span>Top Navigation Bar Area Spotlight</span>
                            <span>🎯 Focused</span>
                          </div>
                        )}
                        {demoSpotlight === 'profile' && (
                          <div className="ml-auto w-48 p-3 rounded-lg border-2 border-indigo-400 bg-indigo-500/10 shadow-[0_0_20px_rgba(99,102,241,0.3)] text-right text-xs text-white font-bold animate-pulse">
                            <span>👤 User Profile Area Spotlight</span>
                          </div>
                        )}
                        {demoSpotlight === 'action' && (
                          <div className="mt-8 mx-auto max-w-xs p-4 rounded-xl border-2 border-pink-500 bg-pink-500/10 shadow-[0_0_25px_rgba(236,72,153,0.35)] text-center text-xs text-white font-bold animate-pulse">
                            <span>⚡ Primary Conversion Action Spotlight</span>
                            <span className="block mt-1 text-[11px] text-pink-300">Pulsing Focus Hotspot Active</span>
                          </div>
                        )}
                      </div>
                    </div>
                  )}

                  {/* TAB 4: LEAD FORM & SURVEY */}
                  {activeTab === 'form' && (
                    <div className="space-y-4">
                      {formSubmitted ? (
                        <div className="text-center py-8 space-y-3">
                          <div className="w-12 h-12 rounded-full bg-emerald-500/20 text-emerald-400 border border-emerald-500/30 flex items-center justify-center mx-auto text-xl">
                            ✓
                          </div>
                          <h3 className="font-bold text-lg text-white">Thank You for Submitting!</h3>
                          <p className="text-xs text-slate-300">Your test submission was safely captured in the sandbox environment.</p>
                          <button
                            type="button"
                            onClick={() => setFormSubmitted(false)}
                            className="px-4 py-2 rounded-xl text-xs font-bold text-white bg-indigo-600 hover:bg-indigo-500"
                          >
                            Reset Form
                          </button>
                        </div>
                      ) : (
                        <form
                          onSubmit={(e) => {
                            e.preventDefault();
                            setFormSubmitted(true);
                          }}
                          className="space-y-3"
                        >
                          <div>
                            <label className="block text-xs font-bold uppercase tracking-wider text-slate-400 mb-1">
                              Rate Your Builder Experience:
                            </label>
                            <div className="flex gap-2">
                              {[1, 2, 3, 4, 5].map((star) => (
                                <button
                                  key={star}
                                  type="button"
                                  onClick={() => setFormRating(star)}
                                  className="text-amber-400 hover:scale-125 transition-transform text-lg cursor-pointer"
                                >
                                  {star <= formRating ? '★' : '☆'}
                                </button>
                              ))}
                            </div>
                          </div>
                          <div>
                            <label className="block text-xs font-bold uppercase tracking-wider text-slate-400 mb-1">
                              Your Work Email:
                            </label>
                            <input
                              type="email"
                              required
                              placeholder="alex@yourcompany.com"
                              className="w-full px-3 py-2 text-xs rounded-xl bg-slate-950 border border-white/15 text-white focus:outline-none focus:ring-2 focus:ring-indigo-500"
                            />
                          </div>
                          <button
                            type="submit"
                            className="w-full py-2.5 rounded-xl text-xs font-bold text-white bg-indigo-600 hover:bg-indigo-500 shadow-md transition-all cursor-pointer"
                          >
                            Submit Test Response →
                          </button>
                        </form>
                      )}
                    </div>
                  )}
                </div>
              </div>

              {/* Sandbox Save & Publish Conversion Gate */}
              <div className="px-6 py-4 bg-gradient-to-r from-indigo-950 via-slate-900 to-purple-950 border-t border-white/10 flex flex-wrap items-center justify-between gap-4">
                <div className="flex items-center gap-2">
                  <span className="w-2 h-2 rounded-full bg-emerald-400 animate-pulse" />
                  <span className="text-xs text-slate-300">
                    Ready to save your custom workspace and publish to your live domain?
                  </span>
                </div>
                <Link
                  to={ROUTES.signUp}
                  className="px-5 py-2 rounded-xl text-xs font-bold text-white bg-indigo-600 hover:bg-indigo-500 shadow-md shadow-indigo-600/30 transition-all flex items-center gap-1.5"
                >
                  <span>Sign Up & Publish Live</span>
                  <ArrowRight className="w-3.5 h-3.5" />
                </Link>
              </div>
            </div>
          </div>
        </section>

        {/* ========================================================================= */}
        {/* 3. 4 KEY PRODUCT PILLARS (HIGHLIGHTED WITH 3D DEPTH) */}
        {/* ========================================================================= */}
        <section id="pillars" aria-labelledby="pillars-title" className="py-24 px-6 fp-3d-perspective">
          <div className="max-w-6xl mx-auto">
            <div className="text-center max-w-2xl mx-auto mb-16">
              <span className="text-xs font-extrabold uppercase tracking-wider text-indigo-400 bg-indigo-500/10 border border-indigo-500/20 px-3 py-1 rounded-full">
                All-In-One Engine
              </span>
              <h2 id="pillars-title" className="mt-4 text-3xl sm:text-5xl font-extrabold tracking-tight text-white">
                Everything Your Team Needs
              </h2>
              <p className="mt-3 text-base text-slate-300">
                Replace 4 separate expensive SaaS subscriptions with FlowPilot's unified experience suite.
              </p>
            </div>

            <div className="grid gap-6 md:grid-cols-2">
              {[
                {
                  icon: LayoutTemplate,
                  title: '1. Modern Websites & Landing Pages',
                  desc: 'Craft publication-ready landing pages with hero video banners, customer review carousels, pricing grids, and FAQ accordions. Zero code needed.',
                  badge: 'Full Site & One-Links',
                  gradient: 'from-blue-600/20 to-indigo-600/20',
                  border: 'border-blue-500/30',
                },
                {
                  icon: MousePointerClick,
                  title: '2. Shadow DOM Product Tours',
                  desc: 'Point & click on any element of your live app with our Chrome Extension (Userpilot style) or use our visual canvas. Guaranteed clean Shadow DOM injection with zero CSS bleed.',
                  badge: 'Chrome Extension + Zero CSS Bleed',
                  gradient: 'from-purple-600/20 to-pink-600/20',
                  border: 'border-purple-500/30',
                },
                {
                  icon: Video,
                  title: '3. Clickable Demos & Spotlights',
                  desc: 'Create interactive product demos with custom area spotlights (Menu bar, Profile, Search, or Custom boxes) in dark and light modes.',
                  badge: 'Dual Theme Spotlight',
                  gradient: 'from-amber-600/20 to-orange-600/20',
                  border: 'border-amber-500/30',
                },
                {
                  icon: Braces,
                  title: '4. High-Conversion Forms & Surveys',
                  desc: 'Gather customer feedback, lead signups, and NPS ratings. Includes anti-formula spreadsheet injection protection and 1-click CSV exports.',
                  badge: 'Secure Lead Funnels',
                  gradient: 'from-emerald-600/20 to-teal-600/20',
                  border: 'border-emerald-500/30',
                },
              ].map((p, i) => (
                <div
                  key={i}
                  className={`p-8 rounded-3xl border ${p.border} bg-gradient-to-br ${p.gradient} bg-slate-900/60 backdrop-blur-md fp-3d-card relative overflow-hidden`}
                >
                  <div className="flex items-center justify-between mb-4">
                    <span className="p-3 rounded-2xl bg-white/10 text-white border border-white/15">
                      <p.icon className="w-6 h-6" />
                    </span>
                    <span className="px-3 py-1 rounded-full text-[11px] font-bold uppercase tracking-wider text-white bg-white/15 border border-white/20">
                      {p.badge}
                    </span>
                  </div>
                  <h3 className="text-xl font-bold text-white">{p.title}</h3>
                  <p className="mt-2 text-sm text-slate-300 leading-relaxed">{p.desc}</p>
                </div>
              ))}
            </div>
          </div>
        </section>

        {/* ========================================================================= */}
        {/* 4. TEMPLATE SHOWCASE */}
        {/* ========================================================================= */}
        <section id="templates" aria-labelledby="templates-title" className="py-24 px-6 bg-slate-900/40 border-y border-white/10">
          <div className="max-w-6xl mx-auto">
            <div className="text-center max-w-2xl mx-auto mb-14">
              <span className="text-xs font-bold uppercase tracking-wider text-pink-400 bg-pink-500/10 border border-pink-500/20 px-3 py-1 rounded-full">
                Pre-Built Designs
              </span>
              <h2 id="templates-title" className="mt-4 text-3xl sm:text-5xl font-extrabold tracking-tight text-white">
                Start with a High-Converting Template
              </h2>
              <p className="mt-3 text-slate-300">
                Crafted for real industries with responsive layout overrides and clean typography.
              </p>
            </div>

            <ul className="grid gap-6 sm:grid-cols-2 lg:grid-cols-3">
              {templates.map((template) => (
                <li
                  key={template.id}
                  className="rounded-3xl overflow-hidden bg-slate-900 border border-white/10 hover:border-indigo-400/60 transition-all fp-3d-card shadow-lg"
                >
                  <LiveThumbnail template={template} className="h-56" />
                  <div className="p-5 border-t border-white/10">
                    <p className="text-xs font-bold uppercase tracking-wider text-indigo-400">{template.category}</p>
                    <h3 className="mt-1 font-bold text-base text-white">{template.title}</h3>
                    <p className="mt-1 text-xs text-slate-400 line-clamp-2">{template.description}</p>
                  </div>
                </li>
              ))}
            </ul>
          </div>
        </section>

        {/* ========================================================================= */}
        {/* 5. VERIFIED CLIENT TESTIMONIALS WITH 5-STAR RATINGS */}
        {/* ========================================================================= */}
        <section aria-labelledby="testimonials-title" className="py-24 px-6">
          <div className="max-w-6xl mx-auto">
            <div className="text-center max-w-2xl mx-auto mb-14">
              <span className="text-xs font-bold uppercase tracking-wider text-amber-400 bg-amber-500/10 border border-amber-500/20 px-3 py-1 rounded-full">
                Customer Reviews
              </span>
              <h2 id="testimonials-title" className="mt-4 text-3xl sm:text-5xl font-extrabold tracking-tight text-white">
                Loved by Fast-Growing Teams
              </h2>
              <p className="mt-3 text-slate-300">
                See how founders, product marketers, and agency owners ship customer experiences in minutes.
              </p>
            </div>

            <div className="grid gap-6 md:grid-cols-3">
              {config.testimonials.map((t) => (
                <div
                  key={t.id}
                  className="p-6 rounded-3xl bg-slate-900 border border-white/10 shadow-xl fp-3d-card flex flex-col justify-between"
                >
                  <div>
                    <div className="flex gap-1 text-amber-400 text-sm mb-3">
                      {Array.from({ length: t.rating || 5 }).map((_, i) => (
                        <Star key={i} className="w-4 h-4 fill-amber-400" />
                      ))}
                    </div>
                    <p className="text-sm text-slate-200 leading-relaxed italic">"{t.content}"</p>
                  </div>
                  <div className="mt-6 pt-4 border-t border-white/10 flex items-center gap-3">
                    <div className="w-10 h-10 rounded-full bg-indigo-600/30 border border-indigo-500/40 text-indigo-300 font-bold flex items-center justify-center text-sm">
                      {t.name[0]}
                    </div>
                    <div>
                      <h4 className="font-bold text-sm text-white">{t.name}</h4>
                      <p className="text-xs text-slate-400">{t.role} · {t.company}</p>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          </div>
        </section>

        {/* ========================================================================= */}
        {/* 6. COMPETITOR COMPARISON TABLE */}
        {/* ========================================================================= */}
        <section id="compare" aria-labelledby="compare-title" className="py-24 px-6 bg-slate-900/50 border-y border-white/10">
          <div className="max-w-5xl mx-auto">
            <div className="text-center max-w-2xl mx-auto mb-14">
              <span className="text-xs font-bold uppercase tracking-wider text-indigo-400 bg-indigo-500/10 border border-indigo-500/20 px-3 py-1 rounded-full">
                Transparent Comparison
              </span>
              <h2 id="compare-title" className="mt-4 text-3xl sm:text-5xl font-extrabold tracking-tight text-white">
                How FlowPilot Compares
              </h2>
              <p className="mt-3 text-slate-300">
                Why modern software teams choose FlowPilot over legacy tour tools.
              </p>
            </div>

            <div className="overflow-x-auto rounded-3xl border border-white/15 bg-slate-950 shadow-2xl">
              <table className="w-full text-left text-sm border-collapse">
                <thead>
                  <tr className="border-b border-white/10 bg-slate-900/80 text-white">
                    <th className="py-4 px-6 font-bold">Capabilities</th>
                    <th className="py-4 px-6 font-bold text-indigo-400 bg-indigo-950/40">FlowPilot</th>
                    <th className="py-4 px-6 font-semibold text-slate-400">Appcues / Pendo</th>
                    <th className="py-4 px-6 font-semibold text-slate-400">Userflow / Chameleon</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-white/5">
                  {[
                    ['Interactive Product Tours', '✓ Included (Shadow DOM)', '✓ Included', '✓ Included'],
                    ['Chrome Extension Visual Builder', '✓ Included (Click on your live app)', '✓ Included', '✗ Complex Setup Only'],
                    ['Clickable Demos & Spotlights', '✓ Included (Spotlight Presets)', '✗ 3rd-party required ($$$)', '✗ Missing'],
                    ['Landing Pages & Websites', '✓ Included (All-in-One)', '✗ Not supported', '✗ Not supported'],
                    ['Gemini AI Prompt Generator', '✓ Gemini 2.0 Flash Included', '✗ Not available', '✗ Not available'],
                    ['Global Multi-Language Translation', '✓ 12+ Languages Built-in', '$$$ Enterprise add-on', '$$$ Enterprise add-on'],
                    ['Free Forever Plan with Full Features', '✓ Free to start', '✗ $249+/mo minimum', '✗ $200+/mo minimum'],
                    ['Zero Style Leakage Guarantee', '✓ Native Shadow DOM', '⚠️ Potential CSS bleed', '⚠️ Potential CSS bleed'],
                  ].map(([feature, fp, l1, l2], idx) => (
                    <tr key={idx} className={idx % 2 === 0 ? 'bg-slate-950/40' : 'bg-slate-900/20'}>
                      <td className="py-4 px-6 font-medium text-slate-200">{feature}</td>
                      <td className="py-4 px-6 font-bold text-indigo-400 bg-indigo-950/30">{fp}</td>
                      <td className="py-4 px-6 text-slate-400">{l1}</td>
                      <td className="py-4 px-6 text-slate-400">{l2}</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>
        </section>

        {/* ========================================================================= */}
        {/* 7. FREQUENTLY ASKED QUESTIONS */}
        {/* ========================================================================= */}
        <section id="faqs" aria-labelledby="faqs-title" className="py-24 px-6">
          <div className="max-w-3xl mx-auto">
            <div className="text-center mb-12">
              <span className="text-xs font-bold uppercase tracking-wider text-indigo-400 bg-indigo-500/10 border border-indigo-500/20 px-3 py-1 rounded-full">
                Got Questions?
              </span>
              <h2 id="faqs-title" className="mt-4 text-3xl sm:text-5xl font-extrabold tracking-tight text-white">
                Frequently Asked Questions
              </h2>
            </div>

            <div className="divide-y divide-white/10 border-y border-white/10">
              {config.faqs.map((item) => (
                <details key={item.id || item.question} className="group py-5">
                  <summary className="flex items-center justify-between gap-4 font-bold text-white cursor-pointer list-none [&::-webkit-details-marker]:hidden">
                    <span>{item.question}</span>
                    <ChevronDown className="w-5 h-5 shrink-0 text-slate-400 transition-transform group-open:rotate-180" aria-hidden="true" />
                  </summary>
                  <p className="mt-3 text-sm text-slate-300 leading-relaxed">{item.answer}</p>
                </details>
              ))}
            </div>
          </div>
        </section>

        {/* ========================================================================= */}
        {/* 8. FINAL HIGH-IMPACT CALL TO ACTION */}
        {/* ========================================================================= */}
        <section aria-labelledby="final-cta-title" className="px-6 pb-24">
          <div className="max-w-5xl mx-auto p-12 sm:p-16 text-center rounded-3xl bg-gradient-to-r from-indigo-900 via-purple-900 to-pink-900 border border-white/20 shadow-2xl relative overflow-hidden fp-3d-card">
            <div className="absolute top-0 right-0 w-80 h-80 bg-white/10 rounded-full blur-3xl pointer-events-none" />
            <h2 id="final-cta-title" className="text-3xl sm:text-5xl font-extrabold tracking-tight text-white">
              Ready to Build Your Next Experience?
            </h2>
            <p className="mt-4 text-base sm:text-lg text-indigo-100 max-w-xl mx-auto">
              Join thousands of creators and companies shipping high-converting websites, tours, and demos with FlowPilot.
            </p>
            <div className="mt-8 flex flex-wrap items-center justify-center gap-4">
              <Link
                to={ROUTES.signUp}
                className="px-8 py-4 rounded-2xl text-sm font-bold text-slate-950 bg-white hover:bg-slate-100 shadow-xl transition-all cursor-pointer flex items-center gap-2"
              >
                <span>Create Free Workspace</span>
                <ArrowRight className="w-4 h-4" />
              </Link>
              <a
                href="#sandbox"
                className="px-8 py-4 rounded-2xl text-sm font-bold text-white bg-white/15 hover:bg-white/20 border border-white/20 backdrop-blur-md transition-all"
              >
                Explore Live Sandbox
              </a>
            </div>
          </div>
        </section>
      </main>

      {/* Modern Multi-Column Footer with Verified Socials */}
      <WebsiteFooter />
    </div>
  );
};
