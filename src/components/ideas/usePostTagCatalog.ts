import { useCallback, useEffect, useRef, useState } from 'react';
import { listPostTags } from '@/lib/ideas';
import { toUserMessage } from '@/lib/errors';
import type { PostTagCatalogItem } from '@/lib/types';

export function usePostTagCatalog() {
  const [tags, setTags] = useState<PostTagCatalogItem[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const sequence = useRef(0);

  const refresh = useCallback(async () => {
    const current = ++sequence.current;
    setLoading(true);
    setError('');
    try {
      const rows = await listPostTags();
      if (current === sequence.current) setTags(rows);
    } catch (caught) {
      if (current === sequence.current) setError(toUserMessage('tag-list', caught));
    } finally {
      if (current === sequence.current) setLoading(false);
    }
  }, []);

  useEffect(() => {
    void refresh();
    const handleChange = () => void refresh();
    window.addEventListener('braga:tags-changed', handleChange);
    return () => {
      sequence.current += 1;
      window.removeEventListener('braga:tags-changed', handleChange);
    };
  }, [refresh]);

  return { tags, loading, error, refresh };
}
