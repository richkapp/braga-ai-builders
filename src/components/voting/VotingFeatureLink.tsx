import { useEffect, useState } from 'react';
import { getVotingFeatureAccess, shouldShowVotingLink } from '@/lib/voting';

type VisibilityEvent = CustomEvent<{ is_enabled?: boolean }>;

export default function VotingFeatureLink({ className }: { className: string }) {
  const [visible, setVisible] = useState(false);

  useEffect(() => {
    let active = true;

    async function load() {
      try {
        const access = await getVotingFeatureAccess();
        if (active) setVisible(shouldShowVotingLink(access));
      } catch {
        if (active) setVisible(false);
      }
    }

    function handleVisibilityChange(event: Event) {
      const enabled = (event as VisibilityEvent).detail?.is_enabled;
      if (typeof enabled === 'boolean') setVisible(enabled);
      else void load();
    }

    void load();
    window.addEventListener('braga:voting-visibility-changed', handleVisibilityChange);
    return () => {
      active = false;
      window.removeEventListener('braga:voting-visibility-changed', handleVisibilityChange);
    };
  }, []);

  if (!visible) return null;
  return <a className={className} href="/voting">Voting</a>;
}
