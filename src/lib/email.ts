const USER = /^[a-z0-9._%+-]+$/i;
const DOMAIN = /^(?:[a-z0-9-]+\.)+[a-z]{2,}$/i;

export function buildMailto(user: string, domain: string): string {
  if (!USER.test(user) || !DOMAIN.test(domain)) throw new Error(`invalid e-mail: ${user} / ${domain}`);
  return `mailto:${user}@${domain}`;
}
