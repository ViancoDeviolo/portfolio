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
  repo: z.union([z.object({ url: z.url() }), z.object({ private: z.literal(true) })]),
  demo: z.url().optional(),
  status: z.enum(STATUS),
  updated: z.string().regex(/^\d{4}-(0[1-9]|1[0-2])$/),
  nextSteps: z.array(l10n).min(1).max(3).optional(),
};

export const projectSchema = z.discriminatedUnion('side', [
  z.object({ ...common, side: z.literal('fund'), proves: l10n, anchor: z.boolean().optional() }),
  z.object({ ...common, side: z.literal('ia'), aiDid: l10n, iDecided: l10n }),
]);

const sections = Object.fromEntries(
  SECTION_IDS.map((id) => [id, z.object({ title: l10n, intro: l10n.optional() })]),
) as Record<SectionId, z.ZodObject<{ title: typeof l10n; intro: z.ZodOptional<typeof l10n> }>>;

export const siteSchema = z.object({
  name: str,
  tagline: l10n,
  livingNote: l10n,
  sections: z.object(sections),
  studyingNow: z.array(l10n).min(1),
  workflow: z.array(z.object({ title: l10n, body: l10n })).length(3),
  workflowFooter: l10n,
  stackGroups: z.array(z.object({ label: l10n, items: z.array(str) })),
  about: z.array(l10n),
  contact: z.object({ emailUser: str, emailDomain: str, linkedin: z.url(), github: z.url() }),
  statusLabels: z.object(Object.fromEntries(STATUS.map((s) => [s, l10n])) as Record<(typeof STATUS)[number], typeof l10n>),
});

export type Project = z.infer<typeof projectSchema>;
export type Site = z.infer<typeof siteSchema>;
