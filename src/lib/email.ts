// Sem '%': no mailto ele viraria escape (%0A = quebra de linha, injeção de cabeçalho).
const USER = /^[a-z0-9._+-]+$/i;
// Rótulo de domínio não começa nem termina com hífen.
const DOMAIN = /^(?:[a-z0-9](?:[a-z0-9-]*[a-z0-9])?\.)+[a-z]{2,}$/i;

export function buildMailto(user: string, domain: string): string {
  if (!USER.test(user) || !DOMAIN.test(domain)) throw new Error(`invalid e-mail: ${user} / ${domain}`);
  return `mailto:${user}@${domain}`;
}
