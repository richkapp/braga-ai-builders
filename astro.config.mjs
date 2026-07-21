import { defineConfig } from 'astro/config';
import react from '@astrojs/react';
import tailwind from '@astrojs/tailwind';
import vercel from '@astrojs/vercel';

const productionBuild = process.argv.includes('build');

export default defineConfig({
  adapter: vercel(),
  devToolbar: {
    enabled: false
  },
  prefetch: {
    prefetchAll: true,
    defaultStrategy: 'hover'
  },
  integrations: [
    react(),
    tailwind({ applyBaseStyles: false })
  ],
  site: process.env.PUBLIC_SITE_URL || (productionBuild ? 'https://braga-ai-builders.vercel.app' : 'http://localhost:4321')
});
