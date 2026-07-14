import { useId, useState } from 'react';
import { LuGhost, LuReply, LuThumbsUp, LuUser } from 'react-icons/lu';
import type { FormSubmitEvent } from '@/lib/dom';
import { toUserMessage } from '@/lib/errors';
import type { PostCommentNode } from '@/lib/postComments';


export type CommentAccess = 'loading' | 'signed-out' | 'inactive' | 'active';

function CommentAuthorIdentity({ comment }: { comment: PostCommentNode }) {
  const profile = comment.profiles;
  const identity = profile ? (
    <>
      <span className="grid h-8 w-8 place-items-center rounded-full border border-limewash/35 bg-limewash/10 text-limewash" aria-hidden="true"><LuUser className="h-4 w-4" /></span>
      <span className="font-bold text-white">{profile.display_name}</span>
    </>
  ) : (
    <>
      <span className="grid h-8 w-8 place-items-center rounded-full border border-violet-300/35 bg-violet-500/10 text-violet-200" aria-hidden="true"><LuGhost className="h-4 w-4" /></span>
      <span className="font-bold text-white">Anonymous</span>
    </>
  );

  return (
    <div className="flex flex-wrap items-center gap-2 text-xs text-braga-300">
      {profile?.handle
        ? <a className="inline-flex items-center gap-2 hover:text-limewash" href={`/members/${encodeURIComponent(profile.handle)}`}>{identity}</a>
        : <span className="inline-flex items-center gap-2">{identity}</span>}
      <span aria-hidden="true">•</span>
      <time dateTime={comment.created_at}>{new Date(comment.created_at).toLocaleDateString('en-GB', { day: '2-digit', month: 'short', year: 'numeric' })}</time>
    </div>
  );
}

type CommentFormProps = {
  label: string;
  submitLabel: string;
  onSubmit: (body: string, postAnonymously: boolean) => Promise<void>;
  onCancel?: () => void;
};

export function CommentForm({ label, submitLabel, onSubmit, onCancel }: CommentFormProps) {
  const fieldId = useId();
  const [body, setBody] = useState('');
  const [postAnonymously, setPostAnonymously] = useState(false);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState('');

  async function submit(event: FormSubmitEvent) {
    event.preventDefault();
    setSaving(true);
    setError('');
    try {
      await onSubmit(body, postAnonymously);
      setBody('');
      setPostAnonymously(false);
    } catch (caught) {
      setError(toUserMessage('idea-comment-create', caught));
    } finally {
      setSaving(false);
    }
  }

  return (
    <form className="rounded-2xl border border-white/10 bg-braga-950/45 p-4 sm:p-5" onSubmit={submit}>
      <label className="text-sm font-bold text-white" htmlFor={fieldId}>{label}</label>
      <textarea
        id={fieldId}
        className="input mt-2 min-h-28 resize-y"
        value={body}
        onChange={(event) => setBody(event.target.value)}
        maxLength={1500}
        placeholder="Add to the conversation…"
        required
      />
      <div className="mt-3 flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
        <label className="flex min-h-11 cursor-pointer items-center gap-3 text-sm text-braga-100">
          <input
            type="checkbox"
            className="h-4 w-4 accent-limewash"
            checked={postAnonymously}
            onChange={(event) => setPostAnonymously(event.target.checked)}
          />
          Comment anonymously
        </label>
        <div className="flex items-center justify-end gap-2">
          {onCancel && <button type="button" className="btn-secondary" disabled={saving} onClick={onCancel}>Cancel</button>}
          <button type="submit" className="btn-primary" disabled={saving || body.trim().length === 0}>
            {saving ? 'Posting…' : submitLabel}
          </button>
        </div>
      </div>
      <p className="mt-2 text-xs leading-5 text-braga-300">Your identity stays private when anonymous is selected. Public profile details appear only for public member profiles.</p>
      {error && <p className="error-message mt-3" role="alert">{error}</p>}
    </form>
  );
}

type CommentCardProps = {
  comment: PostCommentNode;
  depth: number;
  access: CommentAccess;
  replyingTo: string | null;
  votingId: string | null;
  onReply: (commentId: string | null) => void;
  onCreateReply: (parentId: string, body: string, postAnonymously: boolean) => Promise<void>;
  onVote: (commentId: string) => Promise<void>;
};

export function CommentCard({ comment, depth, access, replyingTo, votingId, onReply, onCreateReply, onVote }: CommentCardProps) {
  const authorName = comment.profiles?.display_name ?? 'Anonymous member';
  const voteLabel = `${comment.viewer_has_upvoted ? 'Remove upvote from' : 'Upvote'} comment by ${authorName}`;

  return (
    <li>
      <article className="rounded-2xl border border-white/10 bg-ink-950/45 p-4 sm:p-5">
        <CommentAuthorIdentity comment={comment} />
        <p className="mt-3 whitespace-pre-wrap break-words text-sm leading-6 text-braga-100">{comment.body}</p>
        <footer className="mt-4 flex flex-wrap items-center gap-2">
          <button
            type="button"
            className={`inline-flex min-h-11 items-center gap-2 rounded-full border px-3 text-sm font-semibold transition focus:outline-none focus:ring-2 focus:ring-limewash/70 ${comment.viewer_has_upvoted ? 'border-limewash bg-limewash/15 text-limewash' : 'border-braga-300/30 text-braga-100 hover:border-limewash/60 hover:text-limewash'}`}
            disabled={access !== 'active' || votingId !== null}
            aria-pressed={comment.viewer_has_upvoted}
            aria-label={voteLabel}
            title={access === 'active' ? voteLabel : 'Sign in with an active member account to upvote comments'}
            onClick={() => void onVote(comment.id)}
          >
            <LuThumbsUp className="h-4 w-4" aria-hidden="true" />
            {comment.upvote_count}
          </button>
          {access === 'active' && <button
            type="button"
            className="inline-flex min-h-11 items-center gap-2 rounded-full px-3 text-sm font-semibold text-braga-200 transition hover:bg-white/5 hover:text-white focus:outline-none focus:ring-2 focus:ring-limewash/70"
            aria-expanded={replyingTo === comment.id}
            onClick={() => onReply(replyingTo === comment.id ? null : comment.id)}
          >
            <LuReply className="h-4 w-4" aria-hidden="true" />
            Reply
          </button>}
        </footer>
      </article>

      {replyingTo === comment.id && <div className="mt-3">
        <CommentForm
          label={`Reply to ${authorName}`}
          submitLabel="Post reply"
          onCancel={() => onReply(null)}
          onSubmit={(body, postAnonymously) => onCreateReply(comment.id, body, postAnonymously)}
        />
      </div>}

      {comment.replies.length > 0 && <ol
        className={`mt-3 space-y-3 ${depth <= 3 ? 'border-l border-violet-300/25 pl-3 sm:pl-4' : ''}`}
      >
        {comment.replies.map((reply) => <CommentCard
          key={reply.id}
          comment={reply}
          depth={depth + 1}
          access={access}
          replyingTo={replyingTo}
          votingId={votingId}
          onReply={onReply}
          onCreateReply={onCreateReply}
          onVote={onVote}
        />)}
      </ol>}
    </li>
  );
}
