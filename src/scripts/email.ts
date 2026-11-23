import { buildMailto } from '../lib/email';

// O endereço só existe depois do JS: o HTML traz usuário e domínio separados.
for (const a of document.querySelectorAll<HTMLAnchorElement>('a[data-user][data-domain]')) {
  const { user = '', domain = '' } = a.dataset;
  a.href = buildMailto(user, domain);
  a.textContent = `${user}@${domain}`;
  a.hidden = false;
}
