import React, { useState } from 'react';
import {
  Building2, Check, Download, FileText, Globe, HelpCircle, MessageSquare, Plus,
  RotateCcw, Save, Share2, Sparkles, Star, Trash2, Upload, ExternalLink,
} from 'lucide-react';
import {
  DEFAULT_WEBSITE_CONFIG, getWebsiteConfig, resetWebsiteConfig, saveWebsiteConfig,
  WebsiteConfig, FAQItem, TestimonialItem, BlogItem, FooterColumn,
} from '../../data/websiteConfigStore';
import { cardClass, inputClass, primaryButton, secondaryButton } from '../shared/ui';
import { ConfirmDialog } from '../shared/ConfirmDialog';

type SectionId = 'company' | 'social' | 'footer' | 'faqs' | 'testimonials' | 'blogs';

export const WebsiteConfigTab: React.FC = () => {
  const [config, setConfig] = useState<WebsiteConfig>(getWebsiteConfig);
  const [activeSection, setActiveSection] = useState<SectionId>('company');
  const [savedSuccess, setSavedSuccess] = useState(false);
  const [isResetDialogOpen, setIsResetDialogOpen] = useState(false);

  // New item draft states
  const [newFaq, setNewFaq] = useState<Omit<FAQItem, 'id'>>({ question: '', answer: '', category: 'General' });
  const [isAddingFaq, setIsAddingFaq] = useState(false);

  const [newTestimonial, setNewTestimonial] = useState<Omit<TestimonialItem, 'id'>>({
    name: '', role: '', company: '', content: '', rating: 5, avatar: '',
  });
  const [isAddingTestimonial, setIsAddingTestimonial] = useState(false);

  const [newBlog, setNewBlog] = useState<Omit<BlogItem, 'id'>>({
    title: '', excerpt: '', category: 'Product', readTime: '5 min read', date: new Date().toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' }), url: '', image: '',
  });
  const [isAddingBlog, setIsAddingBlog] = useState(false);

  const handleSave = () => {
    saveWebsiteConfig(config);
    setSavedSuccess(true);
    setTimeout(() => setSavedSuccess(false), 3000);
  };

  const handleReset = () => {
    setIsResetDialogOpen(true);
  };

  const confirmReset = () => {
    resetWebsiteConfig();
    setConfig(DEFAULT_WEBSITE_CONFIG);
    setSavedSuccess(true);
    setIsResetDialogOpen(false);
    setTimeout(() => setSavedSuccess(false), 3000);
  };

  const handleExport = () => {
    const dataStr = 'data:text/json;charset=utf-8,' + encodeURIComponent(JSON.stringify(config, null, 2));
    const downloadAnchor = document.createElement('a');
    downloadAnchor.setAttribute('href', dataStr);
    downloadAnchor.setAttribute('download', `website-config-${Date.now()}.json`);
    document.body.appendChild(downloadAnchor);
    downloadAnchor.click();
    downloadAnchor.remove();
  };

  const handleImport = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;
    const reader = new FileReader();
    reader.onload = (event) => {
      try {
        const parsed = JSON.parse(event.target?.result as string);
        if (parsed && parsed.company) {
          setConfig({ ...DEFAULT_WEBSITE_CONFIG, ...parsed });
          saveWebsiteConfig({ ...DEFAULT_WEBSITE_CONFIG, ...parsed });
          alert('Website configuration imported successfully!');
        }
      } catch {
        alert('Invalid JSON configuration file.');
      }
    };
    reader.readAsText(file);
  };

  // Helper updates
  const updateCompany = (key: keyof WebsiteConfig['company'], val: string) => {
    setConfig((prev) => ({ ...prev, company: { ...prev.company, [key]: val } }));
  };

  const updateSocial = (key: keyof WebsiteConfig['social'], val: string) => {
    setConfig((prev) => ({ ...prev, social: { ...prev.social, [key]: val } }));
  };

  const updateFooter = (key: 'copyrightText' | 'statusText', val: string) => {
    setConfig((prev) => ({ ...prev, footer: { ...prev.footer, [key]: val } }));
  };

  return (
    <div className="space-y-6">
      {/* Top Header & Global Actions */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 p-5 rounded-2xl bg-gradient-to-r from-indigo-900/40 via-purple-900/30 to-slate-900 border border-indigo-500/30">
        <div>
          <h2 className="text-lg font-bold text-slate-900 dark:text-white flex items-center gap-2">
            <Globe className="w-5 h-5 text-indigo-400" />
            Global Website & Brand Configuration
          </h2>
          <p className="text-xs text-slate-500 dark:text-slate-400 mt-1">
            Super admin controls for public brand identity, footer columns, social links, FAQs, testimonials, and case studies.
          </p>
        </div>

        <div className="flex items-center gap-2 shrink-0">
          {savedSuccess && (
            <span className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-bold text-emerald-600 bg-emerald-50 dark:bg-emerald-950/60 border border-emerald-300 dark:border-emerald-800 animate-in fade-in">
              <Check className="w-4 h-4" /> Changes Applied Live!
            </span>
          )}

          <label className="cursor-pointer inline-flex items-center gap-1.5 px-3 py-2 rounded-xl text-xs font-semibold bg-slate-100 hover:bg-slate-200 dark:bg-slate-800 dark:hover:bg-slate-700 text-slate-700 dark:text-slate-200 transition-colors">
            <Upload className="w-3.5 h-3.5" /> Import
            <input type="file" accept=".json" onChange={handleImport} className="hidden" />
          </label>

          <button
            type="button"
            onClick={handleExport}
            className="inline-flex items-center gap-1.5 px-3 py-2 rounded-xl text-xs font-semibold bg-slate-100 hover:bg-slate-200 dark:bg-slate-800 dark:hover:bg-slate-700 text-slate-700 dark:text-slate-200 transition-colors"
          >
            <Download className="w-3.5 h-3.5" /> Export
          </button>

          <button
            type="button"
            onClick={handleReset}
            className="inline-flex items-center gap-1.5 px-3 py-2 rounded-xl text-xs font-semibold text-rose-600 hover:bg-rose-50 dark:hover:bg-rose-950/30 border border-rose-200 dark:border-rose-900 transition-colors"
          >
            <RotateCcw className="w-3.5 h-3.5" /> Reset
          </button>

          <button
            type="button"
            onClick={handleSave}
            className="inline-flex items-center gap-1.5 px-4 py-2 rounded-xl text-xs font-bold text-white bg-indigo-600 hover:bg-indigo-700 shadow-md shadow-indigo-600/30 transition-all cursor-pointer"
          >
            <Save className="w-4 h-4" /> Save Live Config
          </button>
        </div>
      </div>

      {/* Nav Sub-Tabs */}
      <div className="flex flex-wrap items-center gap-2 border-b border-slate-200 dark:border-slate-800 pb-3">
        {[
          { id: 'company' as const, label: '🏢 Brand & Company', icon: Building2 },
          { id: 'social' as const, label: '🌐 Social Profiles', icon: Share2 },
          { id: 'footer' as const, label: '🦶 Global Footer', icon: Globe },
          { id: 'faqs' as const, label: `❓ FAQs (${config.faqs.length})`, icon: HelpCircle },
          { id: 'testimonials' as const, label: `⭐ Testimonials (${config.testimonials.length})`, icon: Star },
          { id: 'blogs' as const, label: `📰 Blogs (${config.blogs.length})`, icon: FileText },
        ].map((tab) => {
          const IconComp = tab.icon;
          const active = activeSection === tab.id;
          return (
            <button
              key={tab.id}
              type="button"
              onClick={() => setActiveSection(tab.id)}
              className={`inline-flex items-center gap-2 px-3.5 py-2 rounded-xl text-xs font-semibold transition-all ${
                active
                  ? 'bg-indigo-600 text-white shadow-sm shadow-indigo-600/30'
                  : 'bg-slate-100 dark:bg-slate-800/80 text-slate-600 dark:text-slate-300 hover:bg-slate-200 dark:hover:bg-slate-800'
              }`}
            >
              <IconComp className="w-3.5 h-3.5" />
              {tab.label}
            </button>
          );
        })}
      </div>

      {/* 1. Brand & Company Info */}
      {activeSection === 'company' && (
        <div className={`${cardClass} p-6 space-y-5 animate-in fade-in`}>
          <div className="flex items-center justify-between pb-3 border-b border-slate-200 dark:border-slate-800">
            <div>
              <h3 className="font-bold text-base text-slate-900 dark:text-white">Brand & Company Information</h3>
              <p className="text-xs text-slate-500">Updates the company name, slogans, and contact details across the app, landing page, and default templates.</p>
            </div>
            <Sparkles className="w-5 h-5 text-indigo-500" />
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <div>
              <label className="block text-xs font-semibold text-slate-700 dark:text-slate-300 mb-1">Company Name</label>
              <input
                type="text"
                value={config.company.name}
                onChange={(e) => updateCompany('name', e.target.value)}
                className={inputClass}
                placeholder="e.g. FlowPilot"
              />
            </div>

            <div>
              <label className="block text-xs font-semibold text-slate-700 dark:text-slate-300 mb-1">Top Announcement Badge</label>
              <input
                type="text"
                value={config.company.badgeText ?? ''}
                onChange={(e) => updateCompany('badgeText', e.target.value)}
                className={inputClass}
                placeholder="e.g. 🚀 v2.4 Live · Powered by Google Gemini AI"
              />
            </div>
          </div>

          <div>
            <label className="block text-xs font-semibold text-slate-700 dark:text-slate-300 mb-1">Tagline</label>
            <input
              type="text"
              value={config.company.tagline}
              onChange={(e) => updateCompany('tagline', e.target.value)}
              className={inputClass}
              placeholder="The modern visual builder for high-converting customer experiences."
            />
          </div>

          <div>
            <label className="block text-xs font-semibold text-slate-700 dark:text-slate-300 mb-1">Company Description</label>
            <textarea
              rows={3}
              value={config.company.description}
              onChange={(e) => updateCompany('description', e.target.value)}
              className={inputClass}
              placeholder="Short paragraph describing your business for SEO, footer, and about sections."
            />
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-3 gap-4 pt-2 border-t border-slate-100 dark:border-slate-800">
            <div>
              <label className="block text-xs font-semibold text-slate-700 dark:text-slate-300 mb-1">Support Email</label>
              <input
                type="email"
                value={config.company.email}
                onChange={(e) => updateCompany('email', e.target.value)}
                className={inputClass}
                placeholder="support@flowpilot.dev"
              />
            </div>
            <div>
              <label className="block text-xs font-semibold text-slate-700 dark:text-slate-300 mb-1">Phone Number</label>
              <input
                type="text"
                value={config.company.phone}
                onChange={(e) => updateCompany('phone', e.target.value)}
                className={inputClass}
                placeholder="+1 (555) 234-5678"
              />
            </div>
            <div>
              <label className="block text-xs font-semibold text-slate-700 dark:text-slate-300 mb-1">Office Address</label>
              <input
                type="text"
                value={config.company.address}
                onChange={(e) => updateCompany('address', e.target.value)}
                className={inputClass}
                placeholder="100 Montgomery St, San Francisco, CA"
              />
            </div>
          </div>
        </div>
      )}

      {/* 2. Social Media Links */}
      {activeSection === 'social' && (
        <div className={`${cardClass} p-6 space-y-5 animate-in fade-in`}>
          <div className="pb-3 border-b border-slate-200 dark:border-slate-800">
            <h3 className="font-bold text-base text-slate-900 dark:text-white">Social Media Profiles & Communities</h3>
            <p className="text-xs text-slate-500">Configure your official channels. These display with modern SVG icons in the website footer and navbar.</p>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <div>
              <label className="block text-xs font-semibold text-slate-700 dark:text-slate-300 mb-1">𝕏 / Twitter Profile URL</label>
              <input
                type="url"
                value={config.social.twitter}
                onChange={(e) => updateSocial('twitter', e.target.value)}
                className={inputClass}
                placeholder="https://twitter.com/yourhandle"
              />
            </div>

            <div>
              <label className="block text-xs font-semibold text-slate-700 dark:text-slate-300 mb-1">LinkedIn Company Page</label>
              <input
                type="url"
                value={config.social.linkedin}
                onChange={(e) => updateSocial('linkedin', e.target.value)}
                className={inputClass}
                placeholder="https://linkedin.com/company/yourcompany"
              />
            </div>

            <div>
              <label className="block text-xs font-semibold text-slate-700 dark:text-slate-300 mb-1">GitHub Organization / Repo</label>
              <input
                type="url"
                value={config.social.github}
                onChange={(e) => updateSocial('github', e.target.value)}
                className={inputClass}
                placeholder="https://github.com/yourorg"
              />
            </div>

            <div>
              <label className="block text-xs font-semibold text-slate-700 dark:text-slate-300 mb-1">YouTube Channel URL</label>
              <input
                type="url"
                value={config.social.youtube}
                onChange={(e) => updateSocial('youtube', e.target.value)}
                className={inputClass}
                placeholder="https://youtube.com/@yourchannel"
              />
            </div>

            <div>
              <label className="block text-xs font-semibold text-slate-700 dark:text-slate-300 mb-1">Discord Community Invite</label>
              <input
                type="url"
                value={config.social.discord}
                onChange={(e) => updateSocial('discord', e.target.value)}
                className={inputClass}
                placeholder="https://discord.gg/yourinvite"
              />
            </div>

            <div>
              <label className="block text-xs font-semibold text-slate-700 dark:text-slate-300 mb-1">Instagram Account URL</label>
              <input
                type="url"
                value={config.social.instagram}
                onChange={(e) => updateSocial('instagram', e.target.value)}
                className={inputClass}
                placeholder="https://instagram.com/yourhandle"
              />
            </div>
          </div>
        </div>
      )}

      {/* 3. Global Footer Settings */}
      {activeSection === 'footer' && (
        <div className={`${cardClass} p-6 space-y-6 animate-in fade-in`}>
          <div className="pb-3 border-b border-slate-200 dark:border-slate-800">
            <h3 className="font-bold text-base text-slate-900 dark:text-white">Global Footer & Status Pill</h3>
            <p className="text-xs text-slate-500">Customize the copyright statement, operational status text, and multi-column navigation links.</p>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <div>
              <label className="block text-xs font-semibold text-slate-700 dark:text-slate-300 mb-1">Copyright Statement</label>
              <input
                type="text"
                value={config.footer.copyrightText}
                onChange={(e) => updateFooter('copyrightText', e.target.value)}
                className={inputClass}
                placeholder="© 2026 FlowPilot Inc. All rights reserved."
              />
            </div>

            <div>
              <label className="block text-xs font-semibold text-slate-700 dark:text-slate-300 mb-1">System Status Pill Text</label>
              <input
                type="text"
                value={config.footer.statusText}
                onChange={(e) => updateFooter('statusText', e.target.value)}
                className={inputClass}
                placeholder="All Systems Operational"
              />
            </div>
          </div>

          {/* Columns Editor */}
          <div className="space-y-4 pt-4 border-t border-slate-200 dark:border-slate-800">
            <div className="flex items-center justify-between">
              <h4 className="font-bold text-sm text-slate-900 dark:text-white">Footer Columns ({config.footer.columns.length})</h4>
              <button
                type="button"
                onClick={() => {
                  setConfig((prev) => ({
                    ...prev,
                    footer: {
                      ...prev.footer,
                      columns: [...prev.footer.columns, { title: 'New Column', links: [{ label: 'New Link', url: '#' }] }],
                    },
                  }));
                }}
                className="inline-flex items-center gap-1 text-xs font-semibold text-indigo-600 dark:text-indigo-400 hover:underline cursor-pointer"
              >
                <Plus className="w-3.5 h-3.5" /> Add Column
              </button>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
              {config.footer.columns.map((col, cIdx) => (
                <div key={cIdx} className="p-4 rounded-xl border border-slate-200 dark:border-slate-800 bg-slate-50 dark:bg-slate-900/60 space-y-3">
                  <div className="flex items-center justify-between gap-2">
                    <input
                      type="text"
                      value={col.title}
                      onChange={(e) => {
                        const nextCols = [...config.footer.columns];
                        nextCols[cIdx].title = e.target.value;
                        setConfig((prev) => ({ ...prev, footer: { ...prev.footer, columns: nextCols } }));
                      }}
                      className="font-bold text-xs uppercase tracking-wider bg-transparent border-b border-transparent hover:border-slate-300 focus:border-indigo-500 focus:outline-none w-full"
                    />
                    <button
                      type="button"
                      onClick={() => {
                        setConfig((prev) => ({
                          ...prev,
                          footer: { ...prev.footer, columns: prev.footer.columns.filter((_, i) => i !== cIdx) },
                        }));
                      }}
                      className="text-slate-400 hover:text-rose-500 transition-colors p-1"
                      title="Delete column"
                    >
                      <Trash2 className="w-3.5 h-3.5" />
                    </button>
                  </div>

                  <ul className="space-y-2">
                    {col.links.map((link, lIdx) => (
                      <li key={lIdx} className="flex items-center gap-2">
                        <input
                          type="text"
                          value={link.label}
                          onChange={(e) => {
                            const nextCols = [...config.footer.columns];
                            nextCols[cIdx].links[lIdx].label = e.target.value;
                            setConfig((prev) => ({ ...prev, footer: { ...prev.footer, columns: nextCols } }));
                          }}
                          placeholder="Label"
                          className="w-1/2 px-2 py-1 text-xs rounded bg-white dark:bg-slate-800 border border-slate-200 dark:border-slate-700"
                        />
                        <input
                          type="text"
                          value={link.url}
                          onChange={(e) => {
                            const nextCols = [...config.footer.columns];
                            nextCols[cIdx].links[lIdx].url = e.target.value;
                            setConfig((prev) => ({ ...prev, footer: { ...prev.footer, columns: nextCols } }));
                          }}
                          placeholder="/path or https://"
                          className="w-1/2 px-2 py-1 text-xs rounded bg-white dark:bg-slate-800 border border-slate-200 dark:border-slate-700"
                        />
                        <button
                          type="button"
                          onClick={() => {
                            const nextCols = [...config.footer.columns];
                            nextCols[cIdx].links = nextCols[cIdx].links.filter((_, i) => i !== lIdx);
                            setConfig((prev) => ({ ...prev, footer: { ...prev.footer, columns: nextCols } }));
                          }}
                          className="text-slate-400 hover:text-rose-500"
                        >
                          <Trash2 className="w-3 h-3" />
                        </button>
                      </li>
                    ))}
                  </ul>

                  <button
                    type="button"
                    onClick={() => {
                      const nextCols = [...config.footer.columns];
                      nextCols[cIdx].links.push({ label: 'Link', url: '#' });
                      setConfig((prev) => ({ ...prev, footer: { ...prev.footer, columns: nextCols } }));
                    }}
                    className="text-[11px] font-semibold text-indigo-600 dark:text-indigo-400 hover:underline pt-1"
                  >
                    + Add Link
                  </button>
                </div>
              ))}
            </div>
          </div>
        </div>
      )}

      {/* 4. FAQs Management */}
      {activeSection === 'faqs' && (
        <div className={`${cardClass} p-6 space-y-5 animate-in fade-in`}>
          <div className="flex items-center justify-between pb-3 border-b border-slate-200 dark:border-slate-800">
            <div>
              <h3 className="font-bold text-base text-slate-900 dark:text-white">Frequently Asked Questions ({config.faqs.length})</h3>
              <p className="text-xs text-slate-500">Manage common questions shown on the website landing page, FAQ module, and creation library.</p>
            </div>
            <button
              type="button"
              onClick={() => setIsAddingFaq(!isAddingFaq)}
              className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-xl text-xs font-bold text-white bg-indigo-600 hover:bg-indigo-700 transition-colors cursor-pointer"
            >
              <Plus className="w-4 h-4" /> Add FAQ
            </button>
          </div>

          {/* Add New FAQ Form */}
          {isAddingFaq && (
            <div className="p-4 rounded-xl border border-indigo-200 dark:border-indigo-900 bg-indigo-50/50 dark:bg-indigo-950/30 space-y-3 animate-in fade-in">
              <h4 className="text-xs font-bold text-indigo-700 dark:text-indigo-300 uppercase tracking-wide">New FAQ Item</h4>
              <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
                <div className="sm:col-span-2">
                  <input
                    type="text"
                    value={newFaq.question}
                    onChange={(e) => setNewFaq({ ...newFaq, question: e.target.value })}
                    placeholder="Question (e.g. Can I connect a custom domain?)"
                    className={inputClass}
                  />
                </div>
                <div>
                  <input
                    type="text"
                    value={newFaq.category}
                    onChange={(e) => setNewFaq({ ...newFaq, category: e.target.value })}
                    placeholder="Category (e.g. Domains)"
                    className={inputClass}
                  />
                </div>
              </div>
              <textarea
                rows={2}
                value={newFaq.answer}
                onChange={(e) => setNewFaq({ ...newFaq, answer: e.target.value })}
                placeholder="Detailed answer..."
                className={inputClass}
              />
              <div className="flex justify-end gap-2">
                <button
                  type="button"
                  onClick={() => setIsAddingFaq(false)}
                  className="px-3 py-1.5 rounded-lg text-xs font-semibold text-slate-600 hover:bg-slate-100 dark:text-slate-300 dark:hover:bg-slate-800"
                >
                  Cancel
                </button>
                <button
                  type="button"
                  disabled={!newFaq.question.trim() || !newFaq.answer.trim()}
                  onClick={() => {
                    const item: FAQItem = {
                      id: `faq-${Date.now()}`,
                      question: newFaq.question.trim(),
                      answer: newFaq.answer.trim(),
                      category: newFaq.category?.trim() || 'General',
                    };
                    setConfig((prev) => ({ ...prev, faqs: [...prev.faqs, item] }));
                    setNewFaq({ question: '', answer: '', category: 'General' });
                    setIsAddingFaq(false);
                  }}
                  className="px-3 py-1.5 rounded-lg text-xs font-bold text-white bg-indigo-600 hover:bg-indigo-700 disabled:opacity-50"
                >
                  Confirm Add FAQ
                </button>
              </div>
            </div>
          )}

          {/* FAQs List */}
          <div className="space-y-3">
            {config.faqs.map((faq, index) => (
              <div
                key={faq.id || index}
                className="p-4 rounded-xl border border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-900/60 hover:border-slate-300 dark:hover:border-slate-700 transition-colors space-y-2"
              >
                <div className="flex items-center justify-between gap-3">
                  <div className="flex items-center gap-2 min-w-0 flex-1">
                    <span className="w-5 h-5 rounded-full bg-indigo-100 dark:bg-indigo-950 text-indigo-700 dark:text-indigo-300 text-xs font-bold flex items-center justify-center shrink-0">
                      {index + 1}
                    </span>
                    <input
                      type="text"
                      value={faq.question}
                      onChange={(e) => {
                        const updated = [...config.faqs];
                        updated[index].question = e.target.value;
                        setConfig((prev) => ({ ...prev, faqs: updated }));
                      }}
                      className="font-semibold text-sm bg-transparent border-b border-transparent hover:border-slate-300 focus:border-indigo-500 focus:outline-none w-full"
                    />
                  </div>

                  <div className="flex items-center gap-2 shrink-0">
                    <span className="text-[10px] font-bold px-2 py-0.5 rounded-full bg-slate-100 dark:bg-slate-800 text-slate-600 dark:text-slate-400">
                      {faq.category || 'General'}
                    </span>
                    <button
                      type="button"
                      onClick={() => {
                        setConfig((prev) => ({ ...prev, faqs: prev.faqs.filter((_, i) => i !== index) }));
                      }}
                      className="p-1 rounded text-slate-400 hover:text-rose-500"
                      title="Delete FAQ"
                    >
                      <Trash2 className="w-4 h-4" />
                    </button>
                  </div>
                </div>

                <textarea
                  rows={2}
                  value={faq.answer}
                  onChange={(e) => {
                    const updated = [...config.faqs];
                    updated[index].answer = e.target.value;
                    setConfig((prev) => ({ ...prev, faqs: updated }));
                  }}
                  className="w-full text-xs text-slate-600 dark:text-slate-300 bg-transparent border border-transparent hover:border-slate-200 dark:hover:border-slate-800 focus:border-indigo-500 focus:bg-white dark:focus:bg-slate-800 rounded p-1.5 focus:outline-none"
                />
              </div>
            ))}
          </div>
        </div>
      )}

      {/* 5. Testimonials Management */}
      {activeSection === 'testimonials' && (
        <div className={`${cardClass} p-6 space-y-5 animate-in fade-in`}>
          <div className="flex items-center justify-between pb-3 border-b border-slate-200 dark:border-slate-800">
            <div>
              <h3 className="font-bold text-base text-slate-900 dark:text-white">Client Testimonials & Wall of Love ({config.testimonials.length})</h3>
              <p className="text-xs text-slate-500">Manage client quotes, star ratings, and verified review cards shown on the landing page and social proof sections.</p>
            </div>
            <button
              type="button"
              onClick={() => setIsAddingTestimonial(!isAddingTestimonial)}
              className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-xl text-xs font-bold text-white bg-indigo-600 hover:bg-indigo-700 transition-colors cursor-pointer"
            >
              <Plus className="w-4 h-4" /> Add Testimonial
            </button>
          </div>

          {/* Add Testimonial Form */}
          {isAddingTestimonial && (
            <div className="p-4 rounded-xl border border-indigo-200 dark:border-indigo-900 bg-indigo-50/50 dark:bg-indigo-950/30 space-y-3 animate-in fade-in">
              <h4 className="text-xs font-bold text-indigo-700 dark:text-indigo-300 uppercase tracking-wide">New Client Testimonial</h4>
              <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
                <input
                  type="text"
                  value={newTestimonial.name}
                  onChange={(e) => setNewTestimonial({ ...newTestimonial, name: e.target.value })}
                  placeholder="Client Name (e.g. Alex Morgan)"
                  className={inputClass}
                />
                <input
                  type="text"
                  value={newTestimonial.role}
                  onChange={(e) => setNewTestimonial({ ...newTestimonial, role: e.target.value })}
                  placeholder="Role (e.g. VP Growth)"
                  className={inputClass}
                />
                <input
                  type="text"
                  value={newTestimonial.company}
                  onChange={(e) => setNewTestimonial({ ...newTestimonial, company: e.target.value })}
                  placeholder="Company (e.g. Stripe, Linear)"
                  className={inputClass}
                />
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-4 gap-3">
                <div className="sm:col-span-3">
                  <input
                    type="url"
                    value={newTestimonial.avatar}
                    onChange={(e) => setNewTestimonial({ ...newTestimonial, avatar: e.target.value })}
                    placeholder="Avatar Image URL (https://...)"
                    className={inputClass}
                  />
                </div>
                <div>
                  <select
                    value={newTestimonial.rating}
                    onChange={(e) => setNewTestimonial({ ...newTestimonial, rating: Number(e.target.value) })}
                    className={inputClass}
                  >
                    <option value={5}>⭐⭐⭐⭐⭐ (5 Stars)</option>
                    <option value={4}>⭐⭐⭐⭐ (4 Stars)</option>
                    <option value={3}>⭐⭐⭐ (3 Stars)</option>
                  </select>
                </div>
              </div>

              <textarea
                rows={2}
                value={newTestimonial.content}
                onChange={(e) => setNewTestimonial({ ...newTestimonial, content: e.target.value })}
                placeholder="Client quote / feedback message..."
                className={inputClass}
              />

              <div className="flex justify-end gap-2">
                <button
                  type="button"
                  onClick={() => setIsAddingTestimonial(false)}
                  className="px-3 py-1.5 rounded-lg text-xs font-semibold text-slate-600 hover:bg-slate-100 dark:text-slate-300"
                >
                  Cancel
                </button>
                <button
                  type="button"
                  disabled={!newTestimonial.name.trim() || !newTestimonial.content.trim()}
                  onClick={() => {
                    const item: TestimonialItem = {
                      id: `test-${Date.now()}`,
                      name: newTestimonial.name.trim(),
                      role: newTestimonial.role.trim(),
                      company: newTestimonial.company.trim(),
                      content: newTestimonial.content.trim(),
                      rating: newTestimonial.rating,
                      avatar: newTestimonial.avatar || 'https://images.unsplash.com/photo-1534528741775-53994a69daeb?w=200&h=200&auto=format&fit=crop',
                    };
                    setConfig((prev) => ({ ...prev, testimonials: [...prev.testimonials, item] }));
                    setNewTestimonial({ name: '', role: '', company: '', content: '', rating: 5, avatar: '' });
                    setIsAddingTestimonial(false);
                  }}
                  className="px-3 py-1.5 rounded-lg text-xs font-bold text-white bg-indigo-600 hover:bg-indigo-700 disabled:opacity-50"
                >
                  Save Testimonial
                </button>
              </div>
            </div>
          )}

          {/* Testimonials List */}
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            {config.testimonials.map((test, index) => (
              <div
                key={test.id || index}
                className="p-4 rounded-xl border border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-900/60 hover:border-slate-300 dark:hover:border-slate-700 transition-colors space-y-3"
              >
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-1 text-amber-500">
                    {Array.from({ length: test.rating || 5 }).map((_, i) => (
                      <Star key={i} className="w-3.5 h-3.5 fill-current" />
                    ))}
                  </div>
                  <button
                    type="button"
                    onClick={() => {
                      setConfig((prev) => ({ ...prev, testimonials: prev.testimonials.filter((_, i) => i !== index) }));
                    }}
                    className="p-1 text-slate-400 hover:text-rose-500"
                    title="Remove"
                  >
                    <Trash2 className="w-3.5 h-3.5" />
                  </button>
                </div>

                <p className="text-xs italic text-slate-700 dark:text-slate-300 leading-relaxed">
                  "{test.content}"
                </p>

                <div className="flex items-center gap-2.5 pt-2 border-t border-slate-100 dark:border-slate-800/80">
                  {test.avatar && (
                    <img src={test.avatar} alt={test.name} className="w-8 h-8 rounded-full object-cover" />
                  )}
                  <div className="text-xs">
                    <p className="font-bold text-slate-900 dark:text-white">{test.name}</p>
                    <p className="text-slate-500">{test.role} {test.company ? `@ ${test.company}` : ''}</p>
                  </div>
                </div>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* 6. Blog & Case Studies Management */}
      {activeSection === 'blogs' && (
        <div className={`${cardClass} p-6 space-y-5 animate-in fade-in`}>
          <div className="flex items-center justify-between pb-3 border-b border-slate-200 dark:border-slate-800">
            <div>
              <h3 className="font-bold text-base text-slate-900 dark:text-white">Blog & Case Studies ({config.blogs.length})</h3>
              <p className="text-xs text-slate-500">Manage editorial guides, articles, and customer case studies shown in creation library blog grids.</p>
            </div>
            <button
              type="button"
              onClick={() => setIsAddingBlog(!isAddingBlog)}
              className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-xl text-xs font-bold text-white bg-indigo-600 hover:bg-indigo-700 transition-colors cursor-pointer"
            >
              <Plus className="w-4 h-4" /> Add Article
            </button>
          </div>

          {/* Add Blog Form */}
          {isAddingBlog && (
            <div className="p-4 rounded-xl border border-indigo-200 dark:border-indigo-900 bg-indigo-50/50 dark:bg-indigo-950/30 space-y-3 animate-in fade-in">
              <h4 className="text-xs font-bold text-indigo-700 dark:text-indigo-300 uppercase tracking-wide">New Blog Article</h4>
              <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
                <div className="sm:col-span-2">
                  <input
                    type="text"
                    value={newBlog.title}
                    onChange={(e) => setNewBlog({ ...newBlog, title: e.target.value })}
                    placeholder="Article Headline..."
                    className={inputClass}
                  />
                </div>
                <div>
                  <input
                    type="text"
                    value={newBlog.category}
                    onChange={(e) => setNewBlog({ ...newBlog, category: e.target.value })}
                    placeholder="Category (e.g. Engineering)"
                    className={inputClass}
                  />
                </div>
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
                <input
                  type="text"
                  value={newBlog.readTime}
                  onChange={(e) => setNewBlog({ ...newBlog, readTime: e.target.value })}
                  placeholder="Read Time (e.g. 5 min read)"
                  className={inputClass}
                />
                <input
                  type="text"
                  value={newBlog.url}
                  onChange={(e) => setNewBlog({ ...newBlog, url: e.target.value })}
                  placeholder="Target Link (/docs/...)"
                  className={inputClass}
                />
                <input
                  type="url"
                  value={newBlog.image}
                  onChange={(e) => setNewBlog({ ...newBlog, image: e.target.value })}
                  placeholder="Cover Image URL"
                  className={inputClass}
                />
              </div>

              <textarea
                rows={2}
                value={newBlog.excerpt}
                onChange={(e) => setNewBlog({ ...newBlog, excerpt: e.target.value })}
                placeholder="Brief summary / subtitle..."
                className={inputClass}
              />

              <div className="flex justify-end gap-2">
                <button
                  type="button"
                  onClick={() => setIsAddingBlog(false)}
                  className="px-3 py-1.5 rounded-lg text-xs font-semibold text-slate-600 hover:bg-slate-100 dark:text-slate-300"
                >
                  Cancel
                </button>
                <button
                  type="button"
                  disabled={!newBlog.title.trim() || !newBlog.excerpt.trim()}
                  onClick={() => {
                    const item: BlogItem = {
                      id: `blog-${Date.now()}`,
                      title: newBlog.title.trim(),
                      excerpt: newBlog.excerpt.trim(),
                      category: newBlog.category.trim() || 'General',
                      readTime: newBlog.readTime.trim() || '5 min read',
                      date: newBlog.date || 'Today',
                      url: newBlog.url || '/docs',
                      image: newBlog.image || 'https://images.unsplash.com/photo-1460925895917-afdab827c52f?w=600&h=360&auto=format&fit=crop',
                    };
                    setConfig((prev) => ({ ...prev, blogs: [...prev.blogs, item] }));
                    setNewBlog({ title: '', excerpt: '', category: 'Product', readTime: '5 min read', date: '', url: '', image: '' });
                    setIsAddingBlog(false);
                  }}
                  className="px-3 py-1.5 rounded-lg text-xs font-bold text-white bg-indigo-600 hover:bg-indigo-700 disabled:opacity-50"
                >
                  Publish Article
                </button>
              </div>
            </div>
          )}

          {/* Blogs Grid */}
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            {config.blogs.map((blog, index) => (
              <div
                key={blog.id || index}
                className="rounded-xl border border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-900/60 overflow-hidden hover:border-slate-300 dark:hover:border-slate-700 transition-colors flex flex-col justify-between"
              >
                {blog.image && (
                  <img src={blog.image} alt={blog.title} className="w-full h-32 object-cover" />
                )}
                <div className="p-4 space-y-2 flex-1 flex flex-col justify-between">
                  <div>
                    <div className="flex items-center justify-between text-[11px] text-slate-400 mb-1">
                      <span className="font-semibold text-indigo-600 dark:text-indigo-400">{blog.category}</span>
                      <span>{blog.readTime}</span>
                    </div>
                    <h4 className="font-bold text-xs text-slate-900 dark:text-white line-clamp-2">{blog.title}</h4>
                    <p className="text-[11px] text-slate-500 mt-1 line-clamp-2">{blog.excerpt}</p>
                  </div>

                  <div className="pt-2 border-t border-slate-100 dark:border-slate-800 flex items-center justify-between">
                    <span className="text-[10px] text-slate-400">{blog.date}</span>
                    <button
                      type="button"
                      onClick={() => {
                        setConfig((prev) => ({ ...prev, blogs: prev.blogs.filter((_, i) => i !== index) }));
                      }}
                      className="p-1 text-slate-400 hover:text-rose-500"
                      title="Remove"
                    >
                      <Trash2 className="w-3.5 h-3.5" />
                    </button>
                  </div>
                </div>
              </div>
            ))}
          </div>
        </div>
      )}

      <ConfirmDialog
        isOpen={isResetDialogOpen}
        title="Reset website configuration?"
        description="All website configuration will be restored back to factory defaults. Any custom edits to company info, footer, FAQs, testimonials, and blogs will be reset."
        confirmLabel="Reset to defaults"
        variant="warning"
        onClose={() => setIsResetDialogOpen(false)}
        onConfirm={confirmReset}
      />
    </div>
  );
};
