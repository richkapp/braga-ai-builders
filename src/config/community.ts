export const communityConfig = {
  name: 'Braga AI Builders',
  city: 'Braga',
  tagline: 'A local AI community',
  description: 'A Braga community for people using AI to solve real problems, build useful things, and help each other move faster.',
  whatsappUrl: 'https://chat.whatsapp.com/GwhqmjtwcPT4vVmQmqqIRW',
  githubUrl: 'https://github.com/richkapp/local-community-platform',
  home: {
    eyebrow: 'A local AI community in Braga',
    heroTitle: 'Curious about AI? Come meet your people.',
    heroBody: 'Meet Braga locals using AI to solve real problems, build useful things, and help each other move faster.',
    experienceRange: [
      'Researching, drafting, and planning with AI',
      'Using AI to work smarter every day',
      'Building products, workflows, and automations',
      'Running a business with teams of AI agents'
    ],
    experienceFooter: 'If you actively use AI and want to understand it better, you belong here.',
    closingStatement: 'Use AI. Share what works. Meet others doing the same.'
  }
} as const;

export const communityPageTitle = (page?: string) => page ? `${page} · ${communityConfig.name}` : communityConfig.name;
