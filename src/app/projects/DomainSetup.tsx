import React, { useState } from 'react';
import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import { CheckCircle2, CircleDashed, ExternalLink, Globe, Loader2, Trash2 } from 'lucide-react';
import { dnsRecords, DnsRecord, isApex, normalizeDomain, rootOf } from '../../core/domains';
import { isLocalBackend } from '../../data';
import { DomainRecord, ProjectRecord } from '../../data/services';
import { useServices } from '../session';
import { BusyIcon, BusyLabel, ErrorNote, errorMessage, inputClass, primaryButton, secondaryButton } from '../shared/ui';
import { useWorkspace } from '../workspace';

const REGISTRARS = [
  { name: 'Cloudflare', url: 'https://www.cloudflare.com/products/registrar/', note: 'Sells at cost, with no markup' },
  { name: 'Namecheap', url: 'https://www.namecheap.com/', note: 'Low prices, simple settings' },
  { name: 'GoDaddy', url: 'https://www.godaddy.com/', note: 'Well known, with phone support' },
  { name: 'Hostinger', url: 'https://www.hostinger.com/domain-name-search', note: 'Popular in India and Asia' },
  { name: 'Squarespace Domains', url: 'https://domains.squarespace.com/', note: 'Took over Google Domains' },
];

/** What the internet sees for a name right now, using Google's public DNS lookup. */
async function lookup(name: string, type: DnsRecord['type']): Promise<string[]> {
  const response = await fetch(`https://dns.google/resolve?name=${encodeURIComponent(name)}&type=${type}`);
  const body = await response.json() as { Answer?: { type: number; data: string }[] };
  const code = { A: 1, CNAME: 5, TXT: 16 }[type];
  return (body.Answer ?? []).filter((answer) => answer.type === code).map((answer) => answer.data.replace(/^"|"$/g, '').replace(/\.$/, '').toLowerCase());
}

const RecordRow: React.FC<{ record: DnsRecord; found?: string[] }> = ({ record, found }) => {
  const isSet = found?.some((value) => value === record.value.toLowerCase());
  return (
    <tr className="align-top">
      <td className="py-2 pr-3 font-semibold">{record.type}</td>
      <td className="py-2 pr-3"><code className="break-all">{record.host}</code></td>
      <td className="py-2 pr-3"><code className="break-all">{record.value}</code></td>
      <td className="py-2 pr-3 text-slate-500 dark:text-slate-400">{record.purpose}</td>
      <td className="py-2 whitespace-nowrap">
        {found === undefined ? <span className="text-slate-400">Not checked</span>
          : isSet ? <span className="inline-flex items-center gap-1 text-emerald-700 dark:text-emerald-400"><CheckCircle2 className="w-4 h-4" aria-hidden="true" />Found</span>
            : <span className="inline-flex items-center gap-1 text-amber-700 dark:text-amber-300"><CircleDashed className="w-4 h-4" aria-hidden="true" />Not yet{found.length ? `: ${found[0]}` : ''}</span>}
      </td>
    </tr>
  );
};

const DomainRow: React.FC<{ domain: DomainRecord; canEdit: boolean }> = ({ domain, canEdit }) => {
  const { domains } = useServices();
  const queryClient = useQueryClient();
  const records = dnsRecords(domain.domain, domain.verificationToken);
  const [found, setFound] = useState<Record<string, string[]>>();
  const refresh = () => queryClient.invalidateQueries({ queryKey: ['domains', domain.projectId] });

  const lookUp = useMutation({
    mutationFn: async () => Object.fromEntries(await Promise.all(records.map(async (record) => [record.fqdn + record.type, await lookup(record.fqdn, record.type)] as const))),
    onSuccess: setFound,
  });
  const verify = useMutation({ mutationFn: () => domains.verify(domain.id), onSettled: refresh });
  const remove = useMutation({ mutationFn: () => domains.remove(domain.id), onSuccess: refresh });
  const allFound = found && records.every((record) => found[record.fqdn + record.type]?.includes(record.value.toLowerCase()));

  return (
    <li className="rounded-xl border border-slate-200 dark:border-slate-700 p-4 space-y-3">
      <div className="flex flex-wrap items-center justify-between gap-2">
        <p className="flex items-center gap-2 font-semibold text-slate-900 dark:text-white"><Globe className="w-4 h-4 text-slate-400" aria-hidden="true" />{domain.domain}</p>
        <span className={`text-xs font-semibold px-2 py-0.5 rounded-full ${domain.status === 'active' ? 'bg-emerald-50 text-emerald-700 dark:bg-emerald-500/10 dark:text-emerald-300' : 'bg-amber-50 text-amber-800 dark:bg-amber-500/10 dark:text-amber-200'}`}>
          {domain.status === 'active' ? 'Connected' : domain.status === 'failed' ? 'Not connected yet' : 'Waiting for your DNS settings'}
        </span>
      </div>
      {domain.status === 'active' ? (
        <p>Visitors can open <a className="font-semibold text-indigo-600 dark:text-indigo-400 hover:underline" href={`https://${domain.domain}`} target="_blank" rel="noreferrer">{domain.domain}</a>. It shows your latest published version.</p>
      ) : (
        <>
          <p>Sign in where you bought <strong>{rootOf(domain.domain)}</strong>, open its DNS settings, and add these {records.length} records. Copy each value exactly.</p>
          <div className="overflow-x-auto">
            <table className="w-full text-left text-[13px]">
              <thead className="text-xs text-slate-500 dark:text-slate-400"><tr><th className="py-1 pr-3 font-medium">Type</th><th className="py-1 pr-3 font-medium">Host or name</th><th className="py-1 pr-3 font-medium">Value</th><th className="py-1 pr-3 font-medium">Why</th><th className="py-1 font-medium">Status</th></tr></thead>
              <tbody className="divide-y divide-slate-100 dark:divide-slate-800">{records.map((record) => <RecordRow key={record.type} record={record} found={found?.[record.fqdn + record.type]} />)}</tbody>
            </table>
          </div>
          {isApex(domain.domain) && <p className="text-[13px] text-slate-500 dark:text-slate-400">Want www too? Add www.{domain.domain} as a second domain below.</p>}
          <p className="text-[13px] text-slate-500 dark:text-slate-400">Changes usually show within an hour, and can take up to a day. Remove any older A or CNAME record for the same host first, or visitors may still reach your old site.</p>
          {domain.lastError && <ErrorNote message={domain.lastError} />}
          <ErrorNote message={verify.isError ? errorMessage(verify.error) : lookUp.isError ? 'We couldn\'t look up your DNS just now. Please try again.' : null} />
          {canEdit && (
            <div className="flex flex-wrap gap-2">
              <button type="button" className={secondaryButton} disabled={lookUp.isPending} onClick={() => lookUp.mutate()}><BusyLabel busy={lookUp.isPending} busyText="Looking...">Check my DNS settings</BusyLabel></button>
              <button type="button" className={primaryButton} disabled={verify.isPending || (found !== undefined && !allFound)} onClick={() => verify.mutate()}><BusyLabel busy={verify.isPending} busyText="Connecting...">Connect domain</BusyLabel></button>
            </div>
          )}
        </>
      )}
      {canEdit && (
        <button type="button" className="inline-flex items-center gap-1 text-[13px] font-semibold text-slate-500 hover:text-rose-600" disabled={remove.isPending} onClick={() => {
          if (window.confirm(`Stop using ${domain.domain} for this site?`)) remove.mutate();
        }}>
          <BusyIcon busy={remove.isPending} className="w-3.5 h-3.5"><Trash2 className="w-3.5 h-3.5" aria-hidden="true" /></BusyIcon>
          Remove
        </button>
      )}
    </li>
  );
};

/** Connecting a domain people already own, or finding where to buy one. */
export const DomainSetup: React.FC<{ project: ProjectRecord }> = ({ project }) => {
  const { domains } = useServices();
  const { can } = useWorkspace();
  const queryClient = useQueryClient();
  const canEdit = can('edit:project');
  const list = useQuery({ queryKey: ['domains', project.id], queryFn: () => domains.list(project.id) });
  const [input, setInput] = useState('');
  const [inputError, setInputError] = useState<string | null>(null);
  const [path, setPath] = useState<'have' | 'buy'>('have');
  const add = useMutation({
    mutationFn: (domain: string) => domains.add(project, domain),
    onSuccess: () => {
      setInput('');
      queryClient.invalidateQueries({ queryKey: ['domains', project.id] });
    },
  });

  return (
    <div className="space-y-4">
      <div role="tablist" aria-label="Your domain" className="inline-flex p-0.5 rounded-lg bg-slate-100 dark:bg-slate-800">
        {([['have', 'I have a domain'], ['buy', 'I need a domain']] as const).map(([id, label]) => (
          <button key={id} role="tab" type="button" aria-selected={path === id} onClick={() => setPath(id)} className={`px-3 py-1.5 text-xs font-semibold rounded-md ${path === id ? 'bg-white dark:bg-slate-700 shadow-sm' : 'text-slate-500 dark:text-slate-400'}`}>{label}</button>
        ))}
      </div>

      {path === 'buy' ? (
        <div className="space-y-3">
          <p>A domain is your own address, such as yourbusiness.com. You buy it from a domain seller, usually for a small yearly fee, and then connect it here. FlowPilot doesn't sell domains.</p>
          <ol className="list-decimal pl-5 space-y-1">
            <li>Pick a short name that's easy to say and spell. A .com, or your country's ending such as .in or .co.uk, is easiest for people to trust.</li>
            <li>Search for it at a domain seller, and buy it. You don't need their website builder, email or hosting extras.</li>
            <li>Come back here, choose <strong>I have a domain</strong>, and connect it.</li>
          </ol>
          <ul className="grid gap-2 sm:grid-cols-2">
            {REGISTRARS.map((registrar) => (
              <li key={registrar.name}>
                <a href={registrar.url} target="_blank" rel="noopener noreferrer" className="flex items-center justify-between gap-2 rounded-lg border border-slate-200 dark:border-slate-700 px-3 py-2 hover:border-indigo-400">
                  <span><span className="block font-semibold text-slate-900 dark:text-white">{registrar.name}</span><span className="block text-xs text-slate-500 dark:text-slate-400">{registrar.note}</span></span>
                  <ExternalLink className="w-4 h-4 shrink-0 text-slate-400" aria-hidden="true" />
                </a>
              </li>
            ))}
          </ul>
          <p className="text-xs text-slate-500 dark:text-slate-400">These are well-known sellers, listed to help you start. FlowPilot isn't paid by any of them.</p>
        </div>
      ) : (
        <div className="space-y-3">
          {project.status !== 'published' && <p role="note" className="rounded-lg px-3 py-2 bg-amber-50 text-amber-900 dark:bg-amber-500/10 dark:text-amber-200">A domain shows your published site, so publish before you connect one.</p>}
          {isLocalBackend && <p role="note" className="rounded-lg px-3 py-2 bg-slate-100 text-slate-700 dark:bg-slate-800 dark:text-slate-300">This FlowPilot is in demo mode, so you can add a domain and see the DNS records, but connecting it needs the live setup.</p>}
          {canEdit && (
            <form className="flex flex-wrap gap-2" onSubmit={(event) => {
              event.preventDefault();
              const domain = normalizeDomain(input);
              if (!domain) {
                setInputError('Enter a domain such as yourbusiness.com or www.yourbusiness.com.');
                return;
              }
              setInputError(null);
              add.mutate(domain);
            }}>
              <input aria-label="Your domain" placeholder="www.yourbusiness.com" className={`${inputClass} !w-auto flex-1 min-w-[220px]`} value={input} onChange={(event) => setInput(event.target.value)} />
              <button type="submit" className={primaryButton} disabled={add.isPending}><BusyLabel busy={add.isPending} busyText="Adding...">Add domain</BusyLabel></button>
            </form>
          )}
          {inputError && <p role="alert" className="text-rose-600 dark:text-rose-400">{inputError}</p>}
          <ErrorNote message={add.isError ? errorMessage(add.error) : null} />
          {list.isLoading && <p className="flex items-center gap-2 text-slate-500"><Loader2 className="w-4 h-4 animate-spin" aria-hidden="true" />Loading...</p>}
          <ul className="space-y-3">{list.data?.map((domain) => <DomainRow key={domain.id} domain={domain} canEdit={canEdit} />)}</ul>
          {list.isSuccess && list.data.length === 0 && <p className="text-slate-500 dark:text-slate-400">Tip: most people connect www.theirbusiness.com. You can add the address without www as well.</p>}
        </div>
      )}
    </div>
  );
};
