export const communityConfig = {
  name: 'Braga AI Builders',
  city: 'Braga',
  tagline: 'A local AI community',
  description: 'A Braga community for people using AI to solve real problems, build useful things, and help each other move faster.',
  whatsappUrl: 'https://chat.whatsapp.com/GwhqmjtwcPT4vVmQmqqIRW',
  whatsappCommunity: {
    name: 'Braga Area WhatsApp Community',
    groupName: 'Braga AI Builders WhatsApp Group',
    expectationsTitle: 'Braga Community WhatsApp Expectations',
    introduction: 'Welcome to the Braga Community WhatsApp group. These rules help us maintain a respectful, inclusive, and meaningful space for every member.',
    principles: [
      'We welcome all residents, regardless of race, religion, nationality, income, skin colour, age, education, sexual orientation, or other personal characteristics.',
      'This is not an expat-only group. It is for anyone who lives in the Braga area.',
      'This community connects caring neighbours who share the same geographical area. Treat each other with kindness and respect.'
    ],
    eligibility: 'Only people who currently live in Braga or a nearby town are eligible to join. Members are neighbours who may meet at everyday local events.',
    expectations: [
      {
        title: 'No self-promotion',
        body: 'Removal is possible. Do not create a group to advertise your services or post personal business opportunities or events in unrelated groups or multiple groups. Each group has its own rules for advertising personal businesses, so ask an admin if you are unsure.'
      },
      {
        title: 'Keep invite links private',
        body: 'Never share a group invite link on social media or other public platforms.'
      },
      {
        title: 'No political opinions or debate',
        body: 'Political posts and conversations about political opinions are not allowed. Basic information about voting laws and how or where to vote is allowed.'
      },
      {
        title: 'Invite local residents only',
        body: 'Only invite people who live in Braga or the surrounding area.'
      },
      {
        title: 'Handle disagreements privately',
        body: 'Do not handle personal disagreements in the group. If you need help resolving an issue, contact an admin with specific details. Admins are not here to mediate personal disagreements.'
      }
    ],
    adminAuthority: 'Community and group admins may delete posts, warn members, or remove members when rules are violated.',
    minors: 'Some groups may involve adult themes, including events where alcohol is served. Guidance for minors joining groups will be provided when necessary.'
  },
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
