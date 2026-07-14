import { lazy, Suspense, useState } from 'react';

const BugReportDialog = lazy(() => import('./BugReportDialog'));

export default function BugReportLauncher() {
  const [loaded, setLoaded] = useState(false);

  if (!loaded) {
    return (
      <button type="button" onClick={() => setLoaded(true)} className="hover:text-limewash">
        🐞 Report a Bug
      </button>
    );
  }

  return (
    <Suspense fallback={<span className="text-braga-300">Opening…</span>}>
      <BugReportDialog openOnMount />
    </Suspense>
  );
}
