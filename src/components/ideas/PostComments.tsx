import { useCallback, useEffect, useMemo, useRef, useState } from 'react';
import { LuMessageCircle } from 'react-icons/lu';
import { getCurrentMemberRole } from '@/lib/admin';
import { isAnonymousUser } from '@/lib/anonymous';
import { toUserMessage } from '@/lib/errors';
import {
  buildPostCommentTree,
  createIdeaComment,
  listIdeaComments,
  toggleIdeaCommentUpvote
} from '@/lib/postComments';
import type { PostComment } from '@/lib/types';
import { useAuthUser } from '@/components/auth/useAuthUser';
import { CommentCard, CommentForm, type CommentAccess } from './PostCommentControls';

export default function PostComments({ ideaId }: { ideaId: string }) {
  const { user, loading: authLoading } = useAuthUser();
  const accountUserId = user && !isAnonymousUser(user) ? user.id : null;
  const [comments, setComments] = useState<PostComment[]>([]);
  const [access, setAccess] = useState<CommentAccess>('loading');
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [replyingTo, setReplyingTo] = useState<string | null>(null);
  const [votingId, setVotingId] = useState<string | null>(null);
  const loadSequence = useRef(0);
  const accessSequence = useRef(0);
  const voteSequence = useRef(0);

  const load = useCallback(async (withLoading = true) => {
    const sequence = ++loadSequence.current;
    if (withLoading) setLoading(true);
    setError('');
    try {
      const nextComments = await listIdeaComments(ideaId);
      if (sequence === loadSequence.current) setComments(nextComments);
    } catch (caught) {
      if (sequence === loadSequence.current) setError(toUserMessage('idea-comments', caught));
    } finally {
      if (sequence === loadSequence.current) setLoading(false);
    }
  }, [ideaId, accountUserId]);

  useEffect(() => {
    if (authLoading) return;
    void load();
    return () => { loadSequence.current += 1; };
  }, [authLoading, load]);

  useEffect(() => {
    const sequence = ++accessSequence.current;
    if (authLoading) {
      setAccess('loading');
      return;
    }
    if (!accountUserId) {
      setAccess('signed-out');
      return;
    }
    setAccess('loading');
    getCurrentMemberRole()
      .then((role) => { if (sequence === accessSequence.current) setAccess(role ? 'active' : 'inactive'); })
      .catch(() => { if (sequence === accessSequence.current) setAccess('inactive'); });
    return () => { accessSequence.current += 1; };
  }, [accountUserId, authLoading]);

  useEffect(() => () => {
    voteSequence.current += 1;
  }, [accountUserId, ideaId]);

  const tree = useMemo(() => buildPostCommentTree(comments), [comments]);

  async function create(parentId: string | null, body: string, postAnonymously: boolean) {
    await createIdeaComment({ ideaId, parentId, body, postAnonymously });
    setReplyingTo(null);
    await load(false);
  }

  async function vote(commentId: string) {
    const sequence = ++voteSequence.current;
    setVotingId(commentId);
    setError('');
    try {
      const result = await toggleIdeaCommentUpvote(commentId);
      if (sequence !== voteSequence.current) return;
      setComments((current) => current.map((comment) => comment.id === commentId
        ? { ...comment, upvote_count: result.upvote_count, viewer_has_upvoted: result.viewer_has_upvoted }
        : comment));
    } catch (caught) {
      if (sequence === voteSequence.current) setError(toUserMessage('idea-comment-vote', caught));
    } finally {
      if (sequence === voteSequence.current) setVotingId(null);
    }
  }

  return (
    <section id="comments" className="card p-5 sm:p-6" aria-labelledby="comments-heading">
      <div className="flex items-center gap-3">
        <span className="grid h-11 w-11 place-items-center rounded-full border border-violet-300/30 bg-violet-500/10 text-violet-200" aria-hidden="true"><LuMessageCircle className="h-5 w-5" /></span>
        <div>
          <h2 id="comments-heading" className="text-2xl font-black text-white">Comments</h2>
          <p className="text-sm text-braga-300">{comments.length} {comments.length === 1 ? 'comment' : 'comments'}</p>
        </div>
      </div>

      <div className="mt-5">
        {access === 'active' && <CommentForm label="Add a comment" submitLabel="Post comment" onSubmit={(body, postAnonymously) => create(null, body, postAnonymously)} />}
        {access === 'signed-out' && <div className="rounded-2xl border border-limewash/25 bg-limewash/5 p-4 text-sm leading-6 text-braga-100">Comments can be public or anonymous, but posting requires a member account. <a href="/signin" className="font-bold text-limewash hover:underline">Sign in to comment →</a></div>}
        {access === 'inactive' && <p className="rounded-2xl border border-amber-300/25 bg-amber-300/5 p-4 text-sm leading-6 text-amber-100">This account’s community membership is not active. Contact an organizer to comment or upvote.</p>}
        {access === 'loading' && <p className="text-sm text-braga-300" role="status">Checking comment access…</p>}
      </div>

      {error && <p className="error-message mt-4" role="alert">{error}</p>}
      {loading
        ? <p className="mt-6 text-sm text-braga-300" role="status">Loading comments…</p>
        : tree.length > 0
          ? <ol className="mt-6 space-y-4">{tree.map((comment) => <CommentCard
              key={comment.id}
              comment={comment}
              depth={1}
              access={access}
              replyingTo={replyingTo}
              votingId={votingId}
              onReply={setReplyingTo}
              onCreateReply={(parentId, body, postAnonymously) => create(parentId, body, postAnonymously)}
              onVote={vote}
            />)}</ol>
          : <p className="mt-6 rounded-2xl border border-dashed border-white/15 p-5 text-sm text-braga-300">No comments yet. Start the conversation.</p>}
    </section>
  );
}
