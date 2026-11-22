import { defineCollection } from 'astro:content';
import { file, glob } from 'astro/loaders';
import { projectSchema, siteSchema } from './lib/schema';

export const collections = {
  projects: defineCollection({ loader: glob({ pattern: '*.yaml', base: 'src/content/projects' }), schema: projectSchema }),
  site: defineCollection({ loader: file('src/content/site.yaml'), schema: siteSchema }),
};
