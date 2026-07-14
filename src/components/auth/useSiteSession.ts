import { useSyncExternalStore } from 'react';
import type { User } from '@supabase/supabase-js';
import { supabase } from '@/lib/supabase';
import { getVotingFeatureAccess, shouldShowVotingLink } from '@/lib/voting';

type SiteSessionState = {
  user: User | null;
  authLoading: boolean;
  votingVisible: boolean;
  votingLoading: boolean;
};

type VisibilityEvent = CustomEvent<{ is_enabled?: boolean }>;

type Listener = () => void;

const serverSnapshot: SiteSessionState = {
  user: null,
  authLoading: true,
  votingVisible: false,
  votingLoading: true
};

let snapshot = serverSnapshot;
let started = false;
const listeners = new Set<Listener>();

function publish(next: Partial<SiteSessionState>) {
  snapshot = { ...snapshot, ...next };
  listeners.forEach((listener) => listener());
}

async function loadUser() {
  try {
    const { data } = await supabase.auth.getUser();
    publish({ user: data.user ?? null, authLoading: false });
  } catch {
    publish({ user: null, authLoading: false });
  }
}

async function loadVotingVisibility() {
  try {
    const access = await getVotingFeatureAccess();
    publish({ votingVisible: shouldShowVotingLink(access), votingLoading: false });
  } catch {
    publish({ votingVisible: false, votingLoading: false });
  }
}

function start() {
  if (started || typeof window === 'undefined') return;
  started = true;

  void loadUser();
  void loadVotingVisibility();

  supabase.auth.onAuthStateChange((_event, session) => {
    publish({ user: session?.user ?? null, authLoading: false });
  });

  window.addEventListener('braga:voting-visibility-changed', (event) => {
    const enabled = (event as VisibilityEvent).detail?.is_enabled;
    if (typeof enabled === 'boolean') {
      publish({ votingVisible: enabled, votingLoading: false });
      return;
    }
    void loadVotingVisibility();
  });
}

function subscribe(listener: Listener) {
  listeners.add(listener);
  start();
  return () => listeners.delete(listener);
}

export function useSiteSession() {
  return useSyncExternalStore(subscribe, () => snapshot, () => serverSnapshot);
}
