import React from 'react';
import { ExternalLink } from 'lucide-react';
import { ROUTES } from '../app/routes';

interface ProviderGuide {
  name: string;
  /** Where the steps start. */
  site: string;
  siteLabel: string;
  steps: string[];
}

const PROVIDERS: Record<string, ProviderGuide> = {
  stripe: {
    name: 'Stripe',
    site: 'https://dashboard.stripe.com/payment-links',
    siteLabel: 'Open Stripe',
    steps: [
      'Log in to Stripe, and open Payment Links.',
      'Choose New, then add your product name and price.',
      'Choose Create link, then copy the link it gives you.',
      'Paste it into Payment link above.',
    ],
  },
  razorpay: {
    name: 'Razorpay',
    site: 'https://dashboard.razorpay.com/app/paymentpages',
    siteLabel: 'Open Razorpay',
    steps: [
      'Log in to Razorpay, and open Payment Pages.',
      'Choose Create Payment Page, then add your product and price.',
      'Publish it, then copy the page link.',
      'Paste it into Payment link above.',
    ],
  },
  paypal: {
    name: 'PayPal',
    site: 'https://www.paypal.com/buttons',
    siteLabel: 'Open PayPal',
    steps: [
      'Log in to PayPal, and open Payment links and buttons.',
      'Create a payment link, then add your product and price.',
      'Copy the link it gives you.',
      'Paste it into Payment link above.',
    ],
  },
  other: {
    name: 'your provider',
    site: '',
    siteLabel: '',
    steps: [
      'In your payment provider, create a hosted payment page or payment link.',
      'Copy its address. It must start with https://.',
      'Paste it into Payment link above.',
    ],
  },
};

/** Step by step, for the provider chosen on the block. */
export const PaymentGuide: React.FC<{ provider: string; url: string }> = ({ provider, url }) => {
  const guide = PROVIDERS[provider] ?? PROVIDERS.other;
  const isBadLink = url.trim() !== '' && !/^https:\/\//i.test(url.trim());
  return (
    <section aria-label="How to connect payments" className="rounded-xl border border-slate-200 dark:border-slate-700 p-3 space-y-2.5">
      <h4 className="text-[13px] font-semibold">How to get your link from {guide.name}</h4>
      <ol className="space-y-1.5">
        {guide.steps.map((step, index) => (
          <li key={step} className="flex gap-2 text-[13px] text-slate-600 dark:text-slate-300">
            <span aria-hidden="true" className="shrink-0 w-5 h-5 flex items-center justify-center rounded-full text-[11px] font-bold text-indigo-700 bg-indigo-50 dark:text-indigo-300 dark:bg-indigo-500/10">{index + 1}</span>
            {step}
          </li>
        ))}
      </ol>
      {guide.site && (
        <a href={guide.site} target="_blank" rel="noopener noreferrer" className="inline-flex items-center gap-1 text-[13px] font-semibold text-indigo-600 dark:text-indigo-400 hover:underline">
          {guide.siteLabel}
          <ExternalLink className="w-3.5 h-3.5" aria-hidden="true" />
        </a>
      )}
      {isBadLink && <p role="alert" className="text-[13px] text-rose-600 dark:text-rose-400">A payment link must start with https://, so visitors' payments stay secure.</p>}
      {!url.trim() && <p className="text-xs text-amber-800 dark:text-amber-300">Visitors won't see this button until it has a link.</p>}
      <p className="text-xs text-slate-500 dark:text-slate-400">
        Visitors pay on {guide.name === 'your provider' ? "your provider's" : `${guide.name}'s`} secure page. FlowPilot never sees card details and doesn't handle the money or receipts.
        Try your own button once in your provider's test mode before sharing it.{' '}
        <a href={ROUTES.doc('payments')} target="_blank" rel="noreferrer" className="font-semibold text-indigo-600 dark:text-indigo-400 hover:underline">Read the full guide</a>
      </p>
    </section>
  );
};
