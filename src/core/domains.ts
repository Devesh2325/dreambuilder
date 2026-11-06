// Customer domains: checking what people type, and which DNS records they need.

/** Where custom domains point. Vercel's addresses unless the hosting says otherwise. */
export const DOMAIN_TARGETS = {
  cname: (import.meta.env?.VITE_DOMAIN_CNAME as string | undefined) || 'cname.vercel-dns.com',
  a: (import.meta.env?.VITE_DOMAIN_A as string | undefined) || '76.76.21.21',
};

/** Two-part endings, so shop.example.co.uk isn't mistaken for a top-level domain. */
const TWO_PART_ENDINGS = new Set([
  'co.uk', 'org.uk', 'ac.uk', 'gov.uk', 'co.in', 'net.in', 'org.in', 'firm.in', 'gen.in', 'ind.in', 'com.au', 'net.au', 'org.au', 'co.nz', 'org.nz',
  'com.br', 'co.za', 'com.mx', 'com.sg', 'com.my', 'co.jp', 'co.kr', 'com.tr', 'com.ar', 'com.co', 'com.pk', 'com.ng', 'co.id', 'com.ph', 'com.vn',
]);

/** Accepts what people paste, such as https://www.Example.com/, and returns example.com style. */
export function normalizeDomain(input: string): string | null {
  const domain = input.trim().toLowerCase().replace(/^https?:\/\//, '').replace(/[/?#].*$/, '').replace(/\.$/, '');
  if (domain.length > 253) return null;
  if (!/^([a-z0-9]([a-z0-9-]{0,61}[a-z0-9])?\.)+[a-z]{2,63}$/.test(domain)) return null;
  return domain;
}

/** The registered name, such as example.co.uk, without any subdomain. */
export function rootOf(domain: string): string {
  const parts = domain.split('.');
  const ending = parts.slice(-2).join('.');
  return parts.slice(TWO_PART_ENDINGS.has(ending) ? -3 : -2).join('.');
}

export const isApex = (domain: string) => rootOf(domain) === domain;

export interface DnsRecord {
  type: 'A' | 'CNAME' | 'TXT';
  /** As DNS settings pages ask for it: relative to the domain, with @ for the domain itself. */
  host: string;
  /** The full name, for looking it up. */
  fqdn: string;
  value: string;
  purpose: string;
}

/** What to add at the registrar: where the site lives, and proof the domain is theirs. */
export function dnsRecords(domain: string, token: string): DnsRecord[] {
  const root = rootOf(domain);
  const relative = domain === root ? '@' : domain.slice(0, -root.length - 1);
  const proofHost = relative === '@' ? '_flowpilot' : `_flowpilot.${relative}`;
  return [
    domain === root
      ? { type: 'A', host: '@', fqdn: domain, value: DOMAIN_TARGETS.a, purpose: 'Sends visitors to your site' }
      : { type: 'CNAME', host: relative, fqdn: domain, value: DOMAIN_TARGETS.cname, purpose: 'Sends visitors to your site' },
    { type: 'TXT', host: proofHost, fqdn: `${proofHost}.${root}`, value: `flowpilot-verify=${token}`, purpose: 'Proves the domain is yours' },
  ];
}

/**
 * Which hosts are the builder itself. Unless the hosting lists them, every host is, so a new
 * deployment never mistakes its own address for a customer's domain.
 */
export function isAppHost(hostname: string, configured: string | undefined = import.meta.env?.VITE_APP_HOSTS as string | undefined): boolean {
  const hosts = (configured ?? '').split(',').map((host) => host.trim().toLowerCase()).filter(Boolean);
  if (hosts.length === 0) return true;
  const host = hostname.toLowerCase();
  return ['localhost', '127.0.0.1', '[::1]', ...hosts].includes(host);
}
