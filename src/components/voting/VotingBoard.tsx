import { useCallback, useEffect, useRef, useState } from 'react';
import type { FormSubmitEvent } from '@/lib/dom';
import { toUserMessage } from '@/lib/errors';
import type { CommunityVote, CommunityVoteOption } from '@/lib/types';
import { calculateVotePercentage, listCommunityVotes, submitCommunityBallot } from '@/lib/voting';

export type VotingBoardOperations = {
  list: typeof listCommunityVotes;
  submit: typeof submitCommunityBallot;
};

const defaultOperations: VotingBoardOperations = {
  list: listCommunityVotes,
  submit: submitCommunityBallot
};

function formatClosingTime(value: string) {
  return new Intl.DateTimeFormat('en-GB', {
    dateStyle: 'medium',
    timeStyle: 'short',
    timeZone: 'Europe/Lisbon'
  }).format(new Date(value));
}

function OptionResults({ option, total }: { option: CommunityVoteOption; total: number }) {
  const percentage = calculateVotePercentage(option.ballot_count, total);
  const voters = option.named_voters ?? [];
  return (
    <div className="rounded-2xl border border-braga-300/20 bg-ink-950/35 p-4">
      <div className="flex items-start justify-between gap-4">
        <p className="font-semibold text-white">{option.label}</p>
        <p className="shrink-0 text-sm font-bold text-limewash">{option.ballot_count} · {percentage}%</p>
      </div>
      <div className="mt-3 h-2 overflow-hidden rounded-full bg-white/10" aria-hidden="true">
        <div className="h-full rounded-full bg-limewash transition-[width] duration-300" style={{ width: `${percentage}%` }} />
      </div>
      {voters.length > 0 && (
        <div className="mt-3 flex flex-wrap gap-2" aria-label={`Named voters for ${option.label}`}>
          {voters.map((voter, index) => (
            <span key={`${voter.display_name}-${index}`} className="rounded-full border border-violet-300/25 bg-violet-500/10 px-2.5 py-1 text-xs text-violet-100">
              {voter.display_name}
            </span>
          ))}
        </div>
      )}
    </div>
  );
}

function VoteCard({ vote, onSaved, submitBallot }: { vote: CommunityVote; onSaved: () => Promise<void>; submitBallot: typeof submitCommunityBallot }) {
  const [selectedOption, setSelectedOption] = useState(vote.viewer_option_id ?? '');
  const [anonymous, setAnonymous] = useState(vote.viewer_is_anonymous ?? false);
  const [busy, setBusy] = useState(false);
  const [message, setMessage] = useState('');
  const [error, setError] = useState('');

  useEffect(() => {
    setSelectedOption(vote.viewer_option_id ?? '');
    setAnonymous(vote.viewer_is_anonymous ?? false);
  }, [vote.viewer_is_anonymous, vote.viewer_option_id]);

  async function submit(event: FormSubmitEvent) {
    event.preventDefault();
    if (!selectedOption) return;
    setBusy(true); setMessage(''); setError('');
    try {
      await submitBallot(vote.id, selectedOption, anonymous);
      setMessage(vote.viewer_option_id ? 'Your vote was updated.' : 'Your vote was counted.');
      await onSaved();
    } catch (caught) {
      setError(toUserMessage('voting-ballot', caught));
      await onSaved().catch(() => undefined);
    } finally {
      setBusy(false);
    }
  }

  const isClosed = vote.status === 'closed';
  return (
    <article className="card space-y-6 p-5 sm:p-7">
      <header>
        <div className="flex flex-wrap items-center gap-2">
          <span className={`rounded-full px-3 py-1 text-xs font-black uppercase tracking-[0.14em] ${isClosed ? 'border border-braga-300/30 text-braga-200' : 'bg-limewash text-ink-950'}`}>
            {isClosed ? 'Closed' : 'Open'}
          </span>
          <span className="text-xs text-braga-300">{isClosed ? 'Closed' : 'Closes'} {formatClosingTime(vote.closes_at)} · Lisbon time</span>
        </div>
        <h2 className="mt-4 text-2xl font-black text-white">{vote.title}</h2>
        <p className="mt-3 whitespace-pre-wrap text-sm leading-6 text-braga-100">{vote.description}</p>
      </header>

      <section aria-label={`${isClosed ? 'Final' : 'Live'} results for ${vote.title}`}>
        <div className="mb-3 flex flex-wrap items-end justify-between gap-2">
          <h3 className="text-sm font-bold uppercase tracking-[0.16em] text-braga-300">{isClosed ? 'Final results' : 'Live results'}</h3>
          <p className="text-sm text-braga-200">{vote.ballot_count} vote{vote.ballot_count === 1 ? '' : 's'} cast</p>
        </div>
        <div className="space-y-3">
          {vote.options.map((option) => <OptionResults key={option.id} option={option} total={vote.ballot_count} />)}
        </div>
      </section>

      {vote.viewer_can_vote ? (
        <form className="space-y-4 border-t border-white/10 pt-5" onSubmit={submit} aria-busy={busy}>
          <fieldset disabled={busy}>
            <legend className="font-bold text-white">Choose one option</legend>
            <div className="mt-3 grid gap-2">
              {vote.options.map((option) => (
                <label key={option.id} className={`flex min-h-12 cursor-pointer items-center gap-3 rounded-xl border px-4 py-3 text-sm transition ${selectedOption === option.id ? 'border-limewash bg-limewash/10 text-white' : 'border-braga-300/25 text-braga-100 hover:border-limewash/60'}`}>
                  <input type="radio" name={`vote-${vote.id}`} value={option.id} checked={selectedOption === option.id} onChange={() => setSelectedOption(option.id)} className="h-4 w-4 accent-limewash" required />
                  <span>{option.label}</span>
                </label>
              ))}
            </div>
          </fieldset>
          <label className="flex min-h-11 cursor-pointer items-start gap-3 rounded-xl border border-braga-300/20 px-4 py-3 text-sm text-braga-100">
            <input type="checkbox" checked={anonymous} onChange={(event) => setAnonymous(event.target.checked)} className="mt-0.5 h-4 w-4 accent-limewash" disabled={busy} />
            <span><strong className="text-white">Vote anonymously</strong><br />When unchecked, your member name appears publicly beneath your choice.</span>
          </label>
          <button type="submit" className="btn-primary w-full" disabled={busy || !selectedOption}>
            {busy ? 'Saving vote…' : vote.viewer_option_id ? 'Update my vote' : 'Submit my vote'}
          </button>
          {message && <p className="status-message" role="status">{message}</p>}
          {error && <p className="error-message" role="alert">{error}</p>}
        </form>
      ) : (
        <div className="border-t border-white/10 pt-5">
          {isClosed
            ? <p className="text-sm text-braga-200">Voting has closed. These are the final results.</p>
            : <p className="text-sm text-braga-100"><a className="font-bold text-limewash hover:underline" href="/signin">Sign in with your member account</a> to cast a vote.</p>}
        </div>
      )}
    </article>
  );
}

export default function VotingBoard({ operations = defaultOperations }: { operations?: VotingBoardOperations }) {
  const [votes, setVotes] = useState<CommunityVote[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const loadSequence = useRef(0);

  const load = useCallback(async (showLoading = true) => {
    const sequence = ++loadSequence.current;
    if (showLoading) setLoading(true);
    setError('');
    try {
      const rows = await operations.list();
      if (sequence === loadSequence.current) setVotes(rows);
    } catch (caught) {
      if (sequence === loadSequence.current) setError(toUserMessage('voting-list', caught));
    } finally {
      if (showLoading && sequence === loadSequence.current) setLoading(false);
    }
  }, [operations]);

  const refresh = useCallback(() => load(false), [load]);

  useEffect(() => {
    void load();
    return () => { loadSequence.current += 1; };
  }, [load]);

  if (loading) return <p className="card p-6 text-braga-100" role="status">Loading community votes…</p>;
  if (error) return <p className="error-message" role="alert">{error}</p>;

  const openVotes = votes.filter((vote) => vote.status === 'published');
  const closedVotes = votes.filter((vote) => vote.status === 'closed');

  return (
    <div className="space-y-10">
      <section aria-labelledby="open-votes-title">
        <div className="mb-5"><h2 id="open-votes-title" className="text-2xl font-black text-white">Open votes</h2><p className="mt-2 text-sm text-braga-200">Results are live. Signed-in members can change their choice until each deadline.</p></div>
        <div className="space-y-5">
          {openVotes.map((vote) => <VoteCard key={vote.id} vote={vote} onSaved={refresh} submitBallot={operations.submit} />)}
          {openVotes.length === 0 && <p className="card p-6 text-braga-100">No votes are open right now.</p>}
        </div>
      </section>

      {closedVotes.length > 0 && (
        <section aria-labelledby="closed-votes-title">
          <div className="mb-5"><h2 id="closed-votes-title" className="text-2xl font-black text-white">Closed votes</h2><p className="mt-2 text-sm text-braga-200">The community's completed decisions and final results.</p></div>
          <div className="space-y-5">{closedVotes.map((vote) => <VoteCard key={vote.id} vote={vote} onSaved={refresh} submitBallot={operations.submit} />)}</div>
        </section>
      )}
    </div>
  );
}
