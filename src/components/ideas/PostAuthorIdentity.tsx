import { useEffect, useState } from 'react';
import { LuGhost, LuUserRound } from 'react-icons/lu';
import { resolveAvatarUrl } from '@/lib/avatar';
import type { PublicProfile } from '@/lib/types';
import PostAuthorPreview from './PostAuthorPreview';

function formatPostDate(value: string) {
  return new Intl.DateTimeFormat('en-GB', {
    day: 'numeric',
    month: 'short',
    year: 'numeric',
    timeZone: 'Europe/Lisbon'
  }).format(new Date(value));
}

export default function PostAuthorIdentity({ profile, createdAt }: { profile: PublicProfile | null | undefined; createdAt: string }) {
  const source = profile ? resolveAvatarUrl(profile) : null;
  const [failedSource, setFailedSource] = useState<string | null>(null);

  useEffect(() => {
    setFailedSource(null);
  }, [source]);

  const image = source && source !== failedSource
    ? <img src={source} alt="" className="h-12 w-12 rounded-2xl object-cover" loading="lazy" onError={() => setFailedSource(source)} />
    : profile
      ? <span className="grid h-12 w-12 place-items-center rounded-2xl border border-limewash/35 bg-limewash/10 text-limewash" aria-hidden="true"><LuUserRound className="h-6 w-6" /></span>
      : <span className="grid h-12 w-12 place-items-center rounded-2xl border border-dashed border-violet-300/50 bg-violet-500/15 text-violet-200" aria-hidden="true"><LuGhost className="h-6 w-6" /></span>;

  return (
    <div className="flex min-w-0 items-center gap-3">
      <span className="shrink-0">{image}</span>
      <div className="min-w-0">
        <div className="truncate text-sm"><PostAuthorPreview profile={profile} variant="header" /></div>
        <time dateTime={createdAt} className="mt-0.5 block text-xs text-braga-300">{formatPostDate(createdAt)}</time>
      </div>
    </div>
  );
}
