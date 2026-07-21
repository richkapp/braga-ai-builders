import { communityConfig } from '@/config/community';
import { ripCategoryLabel } from '@/lib/rips';
import type { Event, Idea, PublicProfile } from '@/lib/types';

export const SOCIAL_CARD_WIDTH = 1200;
export const SOCIAL_CARD_HEIGHT = 630;
export const SOCIAL_CARD_VERSION = '1';

export type SocialCardKind = 'home' | 'invite' | 'posts' | 'post' | 'events' | 'event' | 'members' | 'member' | 'generic';

export type SocialCardData = {
  label: string;
  title: string;
  description: string;
};

export type PostCardRecord = Pick<Idea, 'slug' | 'title' | 'body' | 'category'>;
export type EventCardRecord = Pick<Event, 'slug' | 'title' | 'starts_at' | 'location_name'>;
export type MemberCardRecord = Pick<PublicProfile, 'handle' | 'display_name' | 'bio'>;

const presets: Record<Exclude<SocialCardKind, 'post' | 'event' | 'member'>, SocialCardData> = {
  home: {
    label: 'A local AI community in Braga',
    title: 'Curious about AI? Come meet your people.',
    description: communityConfig.home?.closingStatement ?? 'Use AI. Share what works. Meet others doing the same.',
  },
  invite: {
    label: 'Private member invitation',
    title: `You’re invited to ${communityConfig.name}`,
    description: 'Join the people using AI to build useful things in Braga.',
  },
  posts: {
    label: 'Community posts',
    title: 'Ideas worth keeping',
    description: 'Resources, perspectives, and useful things from Braga’s AI builders.',
  },
  events: {
    label: 'Community events',
    title: 'Meet. Learn. Build.',
    description: 'Meetups, build nights, and workshops for people using AI in Braga.',
  },
  members: {
    label: 'Community directory',
    title: 'Meet Braga’s AI builders',
    description: 'Find the people behind the posts and the experience nearby.',
  },
  generic: {
    label: communityConfig.tagline ?? 'A local AI community',
    title: communityConfig.name ?? 'Braga AI Builders',
    description: communityConfig.description ?? 'A Braga community for people using AI to build useful things.',
  },
};

function normalizeText(value: string | null | undefined, maxLength: number, stripUrls: boolean) {
  let normalized = (value ?? '').replace(/[–—]/g, '-');
  if (stripUrls) normalized = normalized.replace(/https?:\/\/\S+/gi, '');
  normalized = normalized.replace(/\s+/g, ' ').trim();
  if (normalized.length <= maxLength) return normalized;
  const clipped = normalized.slice(0, maxLength + 1);
  const lastSpace = clipped.lastIndexOf(' ');
  return `${clipped.slice(0, lastSpace > maxLength * 0.65 ? lastSpace : maxLength).trim()}…`;
}

export function normalizeSocialText(value: string | null | undefined, maxLength: number) {
  return normalizeText(value, maxLength, true);
}

export function normalizeSocialTitle(value: string | null | undefined, maxLength: number) {
  return normalizeText(value, maxLength, false);
}

export function socialCardPath(kind: SocialCardKind, identifier?: string) {
  const search = new URLSearchParams({ kind, v: SOCIAL_CARD_VERSION });
  if (kind === 'post' || kind === 'event') search.set('slug', identifier ?? '');
  if (kind === 'member') search.set('handle', identifier ?? '');
  return `/api/social-card.png?${search.toString()}`;
}

export function presetSocialCard(kind: SocialCardKind): SocialCardData {
  if (kind === 'post') return { label: 'Community post', title: 'A post from Braga AI Builders', description: communityConfig.description ?? 'A Braga community for people using AI to build useful things.' };
  if (kind === 'event') return { label: 'Community event', title: 'An event from Braga AI Builders', description: 'Meetups, build nights, and workshops in Braga.' };
  if (kind === 'member') return { label: 'Community member', title: 'A member of Braga AI Builders', description: 'Meet the people using AI to build useful things in Braga.' };
  return presets[kind];
}

export function postSocialCard(record: PostCardRecord): SocialCardData {
  return {
    label: `Community ${ripCategoryLabel(record.category).toLowerCase()}`,
    title: normalizeSocialTitle(record.title, 120),
    description: normalizeSocialText(record.body, 116) || 'Shared with the Braga AI Builders community.',
  };
}

export function eventSocialCard(record: EventCardRecord): SocialCardData {
  const startsAt = new Date(record.starts_at);
  const date = Number.isNaN(startsAt.getTime())
    ? ''
    : new Intl.DateTimeFormat('en-GB', {
        day: 'numeric',
        month: 'long',
        year: 'numeric',
        timeZone: 'Europe/Lisbon',
      }).format(startsAt);
  const context = [date, normalizeSocialText(record.location_name, 56)].filter(Boolean).join(' at ');
  return {
    label: 'Community event',
    title: normalizeSocialTitle(record.title, 120),
    description: context || 'Meet with the Braga AI Builders community.',
  };
}

export function memberSocialCard(record: MemberCardRecord): SocialCardData {
  return {
    label: 'Community member',
    title: normalizeSocialTitle(record.display_name, 72),
    description: normalizeSocialText(record.bio, 116) || 'A member of the Braga AI Builders community.',
  };
}

export function socialCardTitleSize(title: string) {
  const longestWord = title.split(/\s+/).reduce((longest, word) => Math.max(longest, word.length), 0);
  if (longestWord > 36) return 42;
  if (title.length <= 38) return 72;
  if (title.length <= 68) return 64;
  if (title.length <= 96) return 56;
  return 50;
}

export function socialCardDescriptionSize(description: string) {
  const longestWord = description.split(/\s+/).reduce((longest, word) => Math.max(longest, word.length), 0);
  return longestWord > 48 ? 22 : 27;
}
