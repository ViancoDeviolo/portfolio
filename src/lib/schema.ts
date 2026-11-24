import { z } from 'astro/zod';
import { SECTION_IDS, type SectionId } from './i18n';

const str = z.string().trim().min(1);
export const l10n = z.object({ pt: str, en: str }).strict();

const media = z.discriminatedUnion('kind', [
  z.object({ kind: z.literal('image'), src: str, alt: l10n }),
  z.object({ kind: z.literal('video'), src: str, poster: str, alt: l10n, description: l10n }),
]);

const STATUS = ['concluido', 'em-evolucao', 'em-desenvolvimento'] as const;

const common = {
  order: z.number().int(),
  title: l10n,
  problem: l10n,
  stack: z.array(str).min(1),
  media: z.array(media).min(1),
  team: z.object({ size: z.number().int().min(2), role: l10n }).optional(),
  evidence: z.array(z.object({ value: str, label: l10n, source: str })),
  terminal: z.object({ file: str, title: l10n }).optional(),
  repo: z.union([
    z.object({ url: z.url() }),
    z.object({ links: z.array(z.object({ label: l10n, url: z.url() })).min(2) }), // projeto com mais de um repositório
    z.object({ private: z.literal(true) }),
  ]),
  demo: z.url().optional(),
  status: z.enum(STATUS),
  updated: z.string().regex(/^\d{4}-(0[1-9]|1[0-2])$/),
  nextSteps: z.array(l10n).min(1).max(3).optional(),
  lastChange: l10n.optional(),
};

export const projectSchema = z.discriminatedUnion('side', [
  z.object({ ...common, side: z.literal('fund'), proves: l10n, anchor: z.boolean().optional() }),
  z.object({ ...common, side: z.literal('ia'), aiDid: l10n, iDecided: l10n, iDecidedLabel: l10n.optional() }),
]);

const sections = Object.fromEntries(
  SECTION_IDS.map((id) => [id, z.object({ title: l10n, intro: l10n.optional() })]),
) as Record<SectionId, z.ZodObject<{ title: typeof l10n; intro: z.ZodOptional<typeof l10n> }>>;

export const siteSchema = z.object({
  name: str,
  tagline: l10n,
  heroAlt: z.object({ casual: l10n, terno: l10n }),
  livingNote: l10n,
  sections: z.object(sections),
  studyingNow: z.array(l10n).min(1),
  workflow: z.array(z.object({ title: l10n, body: l10n })).length(3),
  workflowFooter: l10n,
  stackGroups: z.array(z.object({ label: l10n, items: z.array(str) })),
  about: l10n,
  heroLabels: z.object({ mao: z.object({ title: l10n, sub: l10n }), ia: z.object({ title: l10n, sub: l10n }) }),
  method: z.array(l10n).length(3),
  comparison: z.object({
    prompt: l10n,
    answers: z
      .array(z.object({ ai: z.enum(['Claude', 'GPT', 'Gemini', 'Copilot']), excerpt: l10n }))
      .max(4)
      .refine((a) => new Set(a.map((x) => x.ai)).size === a.length, 'IA repetida'),
    conclusion: l10n.optional(),
  }),
  evolution: z.array(z.object({ label: l10n, before: l10n, after: l10n })).min(1),
  contact: z.object({ emailUser: str, emailDomain: str, linkedin: z.url(), github: z.url() }),
  statusLabels: z.object(Object.fromEntries(STATUS.map((s) => [s, l10n])) as Record<(typeof STATUS)[number], typeof l10n>),
});

export type Project = z.infer<typeof projectSchema>;
export type Site = z.infer<typeof siteSchema>;
