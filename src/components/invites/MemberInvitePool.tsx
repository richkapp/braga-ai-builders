import { useCallback, useEffect, useMemo, useRef, useState } from 'react';
import { LuCheck, LuClock3, LuCopy, LuRefreshCw, LuShare2, LuTicket } from 'react-icons/lu';
import AuthRequired from '@/components/auth/AuthRequired';
import { useAuthUser } from '@/components/auth/useAuthUser';
import { isAnonymousUser } from '@/lib/anonymous';
import { getMyMemberInvites, type MemberInvite } from '@/lib/invites';
import { toUserMessage } from '@/lib/errors';

function formatStatusTime(value: string | null) {
  if (!value) return '';
  return new Intl.DateTimeFormat('en', { dateStyle: 'medium', timeStyle: 'short' }).format(new Date(value));
}

function sameInviteRows(current: MemberInvite[], next: MemberInvite[]) {
  return current.length === next.length && current.every((invite, index) => {
    const candidate = next[index];
    return candidate
      && invite.invite_id === candidate.invite_id
      && invite.status === candidate.status
      && invite.status_at === candidate.status_at;
  });
}

export default function MemberInvitePool() {
  const { user, loading: authLoading } = useAuthUser();
  const [invites, setInvites] = useState<MemberInvite[]>([]);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [error, setError] = useState('');
  const [message, setMessage] = useState('');
  const [copiedId, setCopiedId] = useState<string | null>(null);
  const requestSequence = useRef(0);

  const load = useCallback(async (quiet = false) => {
    const requestId = ++requestSequence.current;
    if (!quiet) setRefreshing(true);
    try {
      const rows = await getMyMemberInvites();
      if (requestId !== requestSequence.current) return;
      setInvites((current) => sameInviteRows(current, rows) ? current : rows);
      setError('');
    } catch (caught) {
      if (requestId !== requestSequence.current) return;
      setError(toUserMessage('invite-load', caught));
    } finally {
      if (requestId === requestSequence.current) {
        setLoading(false);
        setRefreshing(false);
      }
    }
  }, []);

  useEffect(() => {
    if (authLoading) return;
    if (!user || isAnonymousUser(user)) {
      setLoading(false);
      return;
    }

    void load();
    const timer = window.setInterval(() => {
      if (document.visibilityState === 'visible') void load(true);
    }, 15_000);
    const onVisibility = () => {
      if (document.visibilityState === 'visible') void load(true);
    };
    document.addEventListener('visibilitychange', onVisibility);
    return () => {
      requestSequence.current += 1;
      window.clearInterval(timer);
      document.removeEventListener('visibilitychange', onVisibility);
    };
  }, [authLoading, load, user]);

  const currentInvites = useMemo(() => invites.filter((invite) => invite.status !== 'used'), [invites]);
  const recentUsed = useMemo(() => invites.filter((invite) => invite.status === 'used'), [invites]);
  const availableCount = currentInvites.filter((invite) => invite.status === 'available').length;
  const pendingCount = currentInvites.filter((invite) => invite.status === 'pending').length;

  function inviteUrl(code: string) {
    const path = `/join/${code}`;
    return typeof window === 'undefined' ? path : `${window.location.origin}${path}`;
  }

  async function copyInvite(invite: MemberInvite) {
    try {
      await navigator.clipboard.writeText(inviteUrl(invite.code));
      setCopiedId(invite.invite_id);
      setMessage('Invite link copied. Send it in WhatsApp, Facebook, Signal, or anywhere you talk with friends.');
      window.setTimeout(() => setCopiedId((current) => current === invite.invite_id ? null : current), 2_000);
    } catch {
      setError('The invite link could not be copied. Select the URL and copy it manually.');
    }
  }

  async function shareInvite(invite: MemberInvite) {
    const url = inviteUrl(invite.code);
    if (!navigator.share) {
      await copyInvite(invite);
      return;
    }
    try {
      await navigator.share({
        title: 'Join Braga AI Builders',
        text: 'Here is your personal invitation to Braga AI Builders.',
        url
      });
      setMessage('Invite ready to share.');
    } catch (caught) {
      if (caught instanceof DOMException && caught.name === 'AbortError') return;
      setError('The share menu could not be opened. Copy the link instead.');
    }
  }

  if (authLoading || loading) return <p className="card p-6 text-braga-100" role="status">Preparing your invitations…</p>;
  if (!user || isAnonymousUser(user)) return <AuthRequired title="Member invitations" message="Sign in with your existing member account to invite friends." />;

  return (
    <section className="card space-y-6 p-6" aria-labelledby="member-invites-title" aria-busy={refreshing}>
      <div className="flex flex-col gap-4 sm:flex-row sm:items-start sm:justify-between">
        <div>
          <p className="text-sm font-bold uppercase tracking-[0.18em] text-limewash">Your rolling invite pool</p>
          <h2 id="member-invites-title" className="mt-2 text-2xl font-black text-white">Invite friends</h2>
          <p className="mt-2 max-w-2xl text-sm leading-6 text-braga-100">
            Share these individual links wherever your community already talks. Each link welcomes one new member and is replaced automatically after they join.
          </p>
        </div>
        <button type="button" className="btn-secondary inline-flex min-h-11 items-center justify-center gap-2" onClick={() => void load()} disabled={refreshing}>
          <LuRefreshCw className={refreshing ? 'animate-spin' : ''} aria-hidden="true" />
          Refresh
        </button>
      </div>

      <div className="flex flex-wrap gap-3 text-sm" aria-live="polite">
        <span className="rounded-full bg-limewash/15 px-3 py-1 font-semibold text-limewash">{availableCount} available</span>
        <span className="rounded-full bg-amber-300/10 px-3 py-1 font-semibold text-amber-200">{pendingCount} pending</span>
        <span className="text-braga-200">Five unconsumed links stay in your pool automatically.</span>
      </div>

      {error && <p className="error-message" role="alert">{error}</p>}
      {message && <p className="status-message" role="status" aria-live="polite">{message}</p>}

      <div className="grid gap-3">
        {currentInvites.map((invite, index) => {
          const pending = invite.status === 'pending';
          const url = inviteUrl(invite.code);
          return (
            <article key={invite.invite_id} className="rounded-2xl border border-white/10 bg-white/[0.025] p-4">
              <div className="flex flex-col gap-4 lg:flex-row lg:items-center lg:justify-between">
                <div className="min-w-0">
                  <div className="flex items-center gap-2">
                    <LuTicket className="h-5 w-5 shrink-0 text-limewash" aria-hidden="true" />
                    <h3 className="font-bold text-white">Invite {index + 1}</h3>
                    <span className={`rounded-full px-2.5 py-1 text-xs font-bold ${pending ? 'bg-amber-300/10 text-amber-200' : 'bg-limewash/15 text-limewash'}`}>
                      {pending ? 'Pending' : 'Available'}
                    </span>
                  </div>
                  <p className="mt-2 break-all font-mono text-xs leading-5 text-braga-200">{url}</p>
                  {pending && <p className="mt-2 flex items-center gap-2 text-xs text-amber-100/80"><LuClock3 aria-hidden="true" /> Waiting for your friend to confirm their account.</p>}
                </div>
                <div className="flex shrink-0 flex-wrap gap-2">
                  <button type="button" className="btn-secondary inline-flex min-h-11 items-center gap-2" onClick={() => void copyInvite(invite)} disabled={pending}>
                    {copiedId === invite.invite_id ? <LuCheck aria-hidden="true" /> : <LuCopy aria-hidden="true" />}
                    {copiedId === invite.invite_id ? 'Copied' : 'Copy link'}
                  </button>
                  <button type="button" className="btn-primary inline-flex min-h-11 items-center gap-2" onClick={() => void shareInvite(invite)} disabled={pending}>
                    <LuShare2 aria-hidden="true" /> Share
                  </button>
                </div>
              </div>
            </article>
          );
        })}
      </div>

      {!currentInvites.length && !error && <p className="rounded-2xl border border-white/10 p-5 text-braga-100">No invitation links are available yet. Refresh this section in a moment.</p>}

      {recentUsed.length > 0 && (
        <div className="border-t border-white/10 pt-5">
          <h3 className="text-lg font-bold text-white">Recently joined</h3>
          <ul className="mt-3 grid gap-2 text-sm text-braga-100">
            {recentUsed.map((invite) => (
              <li key={invite.invite_id} className="flex items-center gap-2 rounded-xl bg-white/[0.025] px-4 py-3">
                <LuCheck className="text-limewash" aria-hidden="true" />
                One friend joined{invite.status_at ? ` · ${formatStatusTime(invite.status_at)}` : ''}
              </li>
            ))}
          </ul>
        </div>
      )}
    </section>
  );
}
