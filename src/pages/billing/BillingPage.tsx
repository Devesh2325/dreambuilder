import React, { useState } from 'react';
import { useAuth } from '../../services/authContext';
import { PLAN_LIMITS, SubscriptionPlan } from '../../types/auth';
import { CreditCard, Check, Sparkles, Zap, ShieldCheck } from 'lucide-react';
import { storage } from '../../services/storage';

export const BillingPage: React.FC = () => {
  const { organization } = useAuth();
  const [currentPlan, setCurrentPlan] = useState<SubscriptionPlan>(organization.plan);

  const limits = PLAN_LIMITS[currentPlan];
  const projects = storage.getProjects();
  const events = storage.getAnalyticsEvents();

  const handlePlanChange = (plan: SubscriptionPlan) => {
    setCurrentPlan(plan);
    const orgs = storage.getOrganizations();
    const orgIndex = orgs.findIndex(o => o.id === organization.id);
    if (orgIndex !== -1) {
      orgs[orgIndex].plan = plan;
      localStorage.setItem('flowpilot_organizations', JSON.stringify(orgs));
    }
  };

  const plans: { id: SubscriptionPlan; name: string; price: string; desc: string; highlighted?: boolean }[] = [
    { id: 'free', name: 'Free', price: '$0', desc: 'For testing and small single-page projects.' },
    { id: 'starter', name: 'Starter', price: '$49/mo', desc: 'For growing startups and core customer adoption.' },
    { id: 'pro', name: 'Pro', price: '$149/mo', desc: 'Unlimited visual experiences, full AI engine, and custom domains.', highlighted: true },
    { id: 'agency', name: 'Agency', price: '$399/mo', desc: 'Multiple client workspaces and custom branding white-label.' },
    { id: 'enterprise', name: 'Enterprise', price: 'Custom', desc: 'Dedicated SLAs, high-volume ingestion, and SSO.' },
  ];

  return (
    <div className="max-w-7xl mx-auto space-y-8 font-sans select-none">
      {/* Header */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 bg-white p-6 rounded-2xl border border-slate-200/80 shadow-subtle">
        <div className="flex items-center gap-4">
          <div className="w-12 h-12 rounded-2xl bg-indigo-600 text-white flex items-center justify-center shadow-md">
            <CreditCard className="w-6 h-6" />
          </div>
          <div>
            <h1 className="text-xl font-bold text-slate-900">Subscription & Plan Entitlements</h1>
            <p className="text-xs text-slate-500 mt-0.5">
              Active workspace is currently subscribed to the <strong className="capitalize text-indigo-600">{currentPlan} Plan</strong>.
            </p>
          </div>
        </div>
      </div>

      {/* Usage Meters */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
        <div className="bg-white p-5 rounded-2xl border border-slate-200/80 shadow-subtle">
          <span className="text-xs font-semibold text-slate-400 block mb-1">Active Experiences</span>
          <div className="text-xl font-black text-slate-800">
            {projects.length} <span className="text-xs font-normal text-slate-400">/ {limits.maxProjects}</span>
          </div>
          <div className="w-full bg-slate-100 h-1.5 rounded-full mt-3 overflow-hidden">
            <div 
              className="bg-indigo-600 h-full rounded-full" 
              style={{ width: `${Math.min(100, (projects.length / limits.maxProjects) * 100)}%` }} 
            />
          </div>
        </div>

        <div className="bg-white p-5 rounded-2xl border border-slate-200/80 shadow-subtle">
          <span className="text-xs font-semibold text-slate-400 block mb-1">Monthly Impressions</span>
          <div className="text-xl font-black text-slate-800">
            {events.length * 50} <span className="text-xs font-normal text-slate-400">/ {limits.maxMonthlyImpressions.toLocaleString()}</span>
          </div>
          <div className="w-full bg-slate-100 h-1.5 rounded-full mt-3 overflow-hidden">
            <div className="bg-emerald-500 h-full rounded-full w-[12%]" />
          </div>
        </div>

        <div className="bg-white p-5 rounded-2xl border border-slate-200/80 shadow-subtle">
          <span className="text-xs font-semibold text-slate-400 block mb-1">AI Engine Generations</span>
          <div className="text-xl font-black text-slate-800">
            42 <span className="text-xs font-normal text-slate-400">/ {limits.aiGenerationsPerMonth}</span>
          </div>
          <div className="w-full bg-slate-100 h-1.5 rounded-full mt-3 overflow-hidden">
            <div className="bg-purple-600 h-full rounded-full w-[4%]" />
          </div>
        </div>

        <div className="bg-white p-5 rounded-2xl border border-slate-200/80 shadow-subtle">
          <span className="text-xs font-semibold text-slate-400 block mb-1">Custom Domain CDN</span>
          <div className="text-xl font-black text-emerald-600">
            {limits.customDomainEnabled ? 'Enabled' : 'Disabled'}
          </div>
          <span className="text-[11px] text-slate-400 font-medium mt-1 inline-block">SSL Verified</span>
        </div>
      </div>

      {/* Plan Comparison Cards */}
      <div className="grid grid-cols-1 md:grid-cols-5 gap-4">
        {plans.map((p) => {
          const isCurrent = currentPlan === p.id;

          return (
            <div
              key={p.id}
              className={`bg-white rounded-2xl border p-5 flex flex-col justify-between transition-all ${
                p.highlighted
                  ? 'border-indigo-600 shadow-md ring-2 ring-indigo-600/10'
                  : 'border-slate-200/80 shadow-subtle'
              }`}
            >
              <div>
                <h3 className="font-bold text-sm text-slate-900">{p.name}</h3>
                <div className="text-xl font-black text-slate-900 mt-2 mb-1">{p.price}</div>
                <p className="text-[11px] text-slate-500 leading-relaxed mb-4">{p.desc}</p>
              </div>

              <div>
                <button
                  type="button"
                  disabled={isCurrent}
                  onClick={() => handlePlanChange(p.id)}
                  className={`w-full py-2 rounded-xl text-xs font-bold transition-all ${
                    isCurrent
                      ? 'bg-slate-100 text-slate-400 cursor-default'
                      : p.highlighted
                      ? 'bg-indigo-600 hover:bg-indigo-700 text-white shadow-sm'
                      : 'bg-slate-900 hover:bg-slate-800 text-white'
                  }`}
                >
                  {isCurrent ? 'Current Plan' : 'Select Plan'}
                </button>
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );
};
