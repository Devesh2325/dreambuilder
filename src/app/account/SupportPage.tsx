import React, { useState } from 'react';
import { Link } from 'react-router-dom';
import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import { ArrowRight, BookOpen, CheckCircle2, Clock, LifeBuoy, MessageCircle, Plus, Wrench } from 'lucide-react';
import { TicketMessage, TicketStatus } from '../../data/services';
import { ROUTES } from '../routes';
import { useServices } from '../session';
import { FlowPilotBanner } from '../shared/FlowPilotBanner';
import { formatDateTime } from '../shared/format';
import { BusyLabel, cardClass, ErrorNote, errorMessage, inputClass, LoadingNote, PageHeader, primaryButton, secondaryButton } from '../shared/ui';
import { useWorkspace } from '../workspace';

const STATUS: Record<TicketStatus, { label: string; icon: React.ReactNode; className: string }> = {
  open: { label: 'Waiting for us', icon: <Clock className="w-3.5 h-3.5" aria-hidden="true" />, className: 'text-amber-700 bg-amber-50 dark:text-amber-300 dark:bg-amber-500/10' },
  answered: { label: 'Answered', icon: <MessageCircle className="w-3.5 h-3.5" aria-hidden="true" />, className: 'text-indigo-700 bg-indigo-50 dark:text-indigo-300 dark:bg-indigo-500/10' },
  closed: { label: 'Closed', icon: <CheckCircle2 className="w-3.5 h-3.5" aria-hidden="true" />, className: 'text-slate-600 bg-slate-100 dark:text-slate-300 dark:bg-slate-800' },
};

export const TicketBadge: React.FC<{ status: TicketStatus }> = ({ status }) => (
  <span className={`shrink-0 inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-[11px] font-semibold ${STATUS[status].className}`}>{STATUS[status].icon}{STATUS[status].label}</span>
);

export const MessageThread: React.FC<{ messages: TicketMessage[]; staffView?: boolean }> = ({ messages, staffView }) => (
  <ol className="space-y-3">
    {messages.map((message) => {
      const isMine = staffView ? message.isStaff : !message.isStaff;
      return (
        <li key={message.id} className={`flex ${isMine ? 'justify-end' : 'justify-start'}`}>
          <div className={`max-w-[85%] rounded-2xl px-4 py-2.5 text-sm ${isMine ? 'bg-indigo-600 text-white' : 'bg-slate-100 text-slate-800 dark:bg-slate-800 dark:text-slate-100'}`}>
            <p className={`text-xs font-semibold ${isMine ? 'text-indigo-100' : 'text-slate-500 dark:text-slate-400'}`}>{message.isStaff ? 'FlowPilot support' : staffView ? 'Customer' : 'You'} · {formatDateTime(message.createdAt)}</p>
            <p className="mt-1 whitespace-pre-wrap break-words">{message.body}</p>
          </div>
        </li>
      );
    })}
  </ol>
);

const HELP_LINKS = [
  { label: 'Getting started', text: 'Your first project, start to finish.', slug: 'getting-started' },
  { label: 'Add it to your site', text: 'The script, step by step.', slug: 'install' },
  { label: 'Something isn\'t working', text: 'Fixes for common problems.', slug: 'troubleshooting' },
];

const NewRequest: React.FC<{ onCreated: (id: string) => void; onCancel?: () => void }> = ({ onCreated, onCancel }) => {
  const { support } = useServices();
  const { workspace } = useWorkspace();
  const queryClient = useQueryClient();
  const [subject, setSubject] = useState('');
  const [body, setBody] = useState('');
  const create = useMutation({
    mutationFn: () => support.createTicket(workspace?.organizationId ?? null, subject.trim(), body.trim()),
    onSuccess: async (id) => {
      setSubject('');
      setBody('');
      await queryClient.invalidateQueries({ queryKey: ['tickets'] });
      onCreated(id);
    },
  });

  return (
    <form aria-labelledby="new-request-title" className={`${cardClass} p-6 space-y-4`} onSubmit={(event) => {
      event.preventDefault();
      create.mutate();
    }}>
      <div>
        <h2 id="new-request-title" className="font-semibold">Ask us anything</h2>
        <p className="text-sm text-slate-500 dark:text-slate-400">Tell us what you were trying to do, and what happened instead.</p>
      </div>
      <ErrorNote message={create.isError ? errorMessage(create.error) : null} />
      <label className="block text-sm font-medium">What's it about?
        <input required maxLength={200} className={`${inputClass} mt-1`} value={subject} onChange={(e) => setSubject(e.target.value)} />
      </label>
      <label className="block text-sm font-medium">Your message
        <textarea required rows={6} maxLength={5000} className={`${inputClass} mt-1`} value={body} onChange={(e) => setBody(e.target.value)} />
      </label>
      <div className="flex gap-2">
        <button type="submit" className={primaryButton} disabled={create.isPending}><BusyLabel busy={create.isPending} busyText="Sending...">Send</BusyLabel></button>
        {onCancel && <button type="button" className={secondaryButton} onClick={onCancel}>Cancel</button>}
      </div>
    </form>
  );
};

const Conversation: React.FC<{ ticketId: string; subject: string; status: TicketStatus }> = ({ ticketId, subject, status }) => {
  const { support } = useServices();
  const queryClient = useQueryClient();
  const messages = useQuery({ queryKey: ['ticket-messages', ticketId], queryFn: () => support.listMessages(ticketId) });
  const [body, setBody] = useState('');
  const reply = useMutation({
    mutationFn: () => support.reply(ticketId, body.trim()),
    onSuccess: () => {
      setBody('');
      queryClient.invalidateQueries({ queryKey: ['ticket-messages', ticketId] });
      queryClient.invalidateQueries({ queryKey: ['tickets'] });
    },
  });

  return (
    <section aria-label={subject} className={`${cardClass} p-6`}>
      <div className="flex flex-wrap items-center justify-between gap-2 mb-4">
        <h2 className="font-semibold min-w-0 break-words">{subject}</h2>
        <TicketBadge status={status} />
      </div>
      {messages.isLoading && <LoadingNote />}
      {messages.isError && <ErrorNote message="We couldn't load this conversation." />}
      {messages.data && <MessageThread messages={messages.data} />}
      {status === 'closed' ? (
        <p className="mt-4 text-sm text-slate-500 dark:text-slate-400">This request is closed. Please start a new one if you need more help.</p>
      ) : (
        <form className="mt-4 space-y-2" onSubmit={(event) => {
          event.preventDefault();
          reply.mutate();
        }}>
          <ErrorNote message={reply.isError ? errorMessage(reply.error) : null} />
          <label className="block text-sm font-medium">Your reply
            <textarea required rows={3} maxLength={5000} className={`${inputClass} mt-1`} value={body} onChange={(e) => setBody(e.target.value)} />
          </label>
          <button type="submit" className={primaryButton} disabled={reply.isPending}><BusyLabel busy={reply.isPending} busyText="Sending...">Send reply</BusyLabel></button>
        </form>
      )}
    </section>
  );
};

/** Help for customers: the guides first, then a conversation with the team. */
export const SupportPage: React.FC = () => {
  const { support } = useServices();
  const tickets = useQuery({ queryKey: ['tickets'], queryFn: () => support.listTickets() });
  const [selectedId, setSelectedId] = useState<string | null>(null);
  const [isNew, setIsNew] = useState(false);
  const selected = tickets.data?.find((ticket) => ticket.id === selectedId) ?? (isNew ? undefined : tickets.data?.[0]);
  const showForm = isNew || (tickets.isSuccess && tickets.data.length === 0);

  return (
    <>
      <PageHeader
        title="Support"
        subtitle="We reply here, on this page. Email replies aren't available yet, so check back for an answer."
        actions={tickets.data?.length ? <button type="button" className={primaryButton} onClick={() => setIsNew(true)}><Plus className="w-4 h-4" aria-hidden="true" />New request</button> : undefined}
      />
      <ul className="grid gap-3 md:grid-cols-3 mb-6">
        {HELP_LINKS.map((link) => (
          <li key={link.slug}>
            <Link to={ROUTES.doc(link.slug)} className={`${cardClass} !rounded-xl flex items-center gap-3 p-4 h-full hover:border-indigo-400 transition-colors`}>
              <span className="shrink-0 w-9 h-9 flex items-center justify-center rounded-lg bg-indigo-50 text-indigo-600 dark:bg-indigo-500/10 dark:text-indigo-300">
                {link.slug === 'troubleshooting' ? <Wrench className="w-4 h-4" aria-hidden="true" /> : <BookOpen className="w-4 h-4" aria-hidden="true" />}
              </span>
              <span className="flex-1 min-w-0">
                <span className="block text-sm font-semibold">{link.label}</span>
                <span className="block text-xs text-slate-500 dark:text-slate-400">{link.text}</span>
              </span>
              <ArrowRight className="w-4 h-4 shrink-0 text-slate-400" aria-hidden="true" />
            </Link>
          </li>
        ))}
      </ul>

      {tickets.isLoading && <LoadingNote />}
      {tickets.isError && <ErrorNote message="We couldn't load your requests. Please refresh the page." />}

      {tickets.isSuccess && tickets.data.length === 0 && !isNew && (
        <div className="mb-6">
          <FlowPilotBanner title="We're here to help" text="Stuck on something, or have an idea? Send us a message below and we'll reply on this page." />
        </div>
      )}

      {tickets.isSuccess && (
        <div className={tickets.data.length ? 'grid gap-5 lg:grid-cols-[320px_minmax(0,1fr)] items-start' : 'max-w-2xl'}>
          {tickets.data.length > 0 && (
            <section aria-labelledby="tickets-title" className={`${cardClass} overflow-hidden`}>
              <h2 id="tickets-title" className="flex items-center gap-2 px-4 pt-4 pb-2 font-semibold"><LifeBuoy className="w-4 h-4 text-slate-400" aria-hidden="true" />Your requests</h2>
              <ul className="divide-y divide-slate-100 dark:divide-slate-800">
                {tickets.data.map((ticket) => (
                  <li key={ticket.id}>
                    <button
                      type="button"
                      aria-current={!isNew && selected?.id === ticket.id ? 'true' : undefined}
                      className={`w-full text-left px-4 py-3 transition-colors ${!isNew && selected?.id === ticket.id ? 'bg-indigo-50 dark:bg-indigo-500/10' : 'hover:bg-slate-50 dark:hover:bg-slate-800/40'}`}
                      onClick={() => {
                        setSelectedId(ticket.id);
                        setIsNew(false);
                      }}
                    >
                      <span className="block text-sm font-medium truncate">{ticket.subject}</span>
                      <span className="mt-1 flex items-center justify-between gap-2">
                        <span className="text-xs text-slate-500 dark:text-slate-400 truncate">{formatDateTime(ticket.updatedAt)}</span>
                        <TicketBadge status={ticket.status} />
                      </span>
                    </button>
                  </li>
                ))}
              </ul>
            </section>
          )}
          {showForm ? (
            <NewRequest
              onCreated={(id) => {
                setSelectedId(id);
                setIsNew(false);
              }}
              onCancel={tickets.data.length ? () => setIsNew(false) : undefined}
            />
          ) : selected && <Conversation key={selected.id} ticketId={selected.id} subject={selected.subject} status={selected.status} />}
        </div>
      )}
    </>
  );
};
