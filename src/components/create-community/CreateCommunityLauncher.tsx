import { useEffect, useMemo, useState } from 'react';
import {
  LuArrowLeft,
  LuArrowRight,
  LuCheck,
  LuCopy,
  LuRotateCcw,
  LuShieldCheck,
  LuSparkles,
  LuTerminal,
} from 'react-icons/lu';
import {
  EMPTY_COMMUNITY_LAUNCHER_ANSWERS,
  INCLUDED_PLATFORM_FEATURES,
  buildCommunityLaunchPrompt,
  buildCommunityRecoveryPrompt,
  platformLanguageFromStoredValue,
  validateCommunityAnswers,
  type CommunityLauncherAnswers,
} from '@/lib/createCommunityLauncher';

const STORAGE_KEY = 'local-community-launcher-v1';

const steps = [
  { id: 'welcome', label: 'Start' },
  { id: 'identity', label: 'Community' },
  { id: 'purpose', label: 'Description' },
  { id: 'review', label: 'Review' },
  { id: 'prompt', label: 'Launch brief' },
] as const;

type StepId = typeof steps[number]['id'];
type TextField = Exclude<keyof CommunityLauncherAnswers, 'agentConfirmed'>;

function copyAnswers(value: CommunityLauncherAnswers): CommunityLauncherAnswers {
  return { ...value };
}

function restoreAnswers(value: unknown): CommunityLauncherAnswers | null {
  if (!value || typeof value !== 'object') return null;
  const candidate = value as Partial<CommunityLauncherAnswers>;
  const restored = copyAnswers(EMPTY_COMMUNITY_LAUNCHER_ANSWERS);
  restored.agentConfirmed = candidate.agentConfirmed === true;

  for (const field of ['communityName', 'location', 'purpose', 'audience', 'organizerName', 'locale'] as TextField[]) {
    if (typeof candidate[field] === 'string') restored[field] = candidate[field].slice(0, 600);
  }
  restored.locale = platformLanguageFromStoredValue(restored.locale);
  return restored;
}

function errorsForStep(step: StepId, answers: CommunityLauncherAnswers) {
  const missing = (value: string) => value.trim().length === 0;
  if (step === 'welcome' && !answers.agentConfirmed) return ['Confirm that your AI can access files and run commands.'];
  if (step === 'identity') {
    return [
      missing(answers.communityName) ? 'Add your community name.' : '',
      missing(answers.location) ? 'Add the city, town, or area your community serves.' : '',
      missing(answers.organizerName) ? 'Add the organizer or operator name.' : '',
      missing(answers.locale) ? 'Choose the platform language.' : '',
    ].filter(Boolean);
  }
  if (step === 'purpose') {
    return [
      missing(answers.purpose) ? 'Describe why the community exists.' : '',
      missing(answers.audience) ? 'Describe who the community is for.' : '',
    ].filter(Boolean);
  }
  return [];
}

async function copyToClipboard(value: string) {
  if (navigator.clipboard?.writeText) {
    await navigator.clipboard.writeText(value);
    return;
  }
  const textarea = document.createElement('textarea');
  textarea.value = value;
  textarea.style.position = 'fixed';
  textarea.style.opacity = '0';
  document.body.append(textarea);
  textarea.select();
  document.execCommand('copy');
  textarea.remove();
}

export default function CreateCommunityLauncher() {
  const [answers, setAnswers] = useState<CommunityLauncherAnswers>(() => copyAnswers(EMPTY_COMMUNITY_LAUNCHER_ANSWERS));
  const [step, setStep] = useState<StepId>('welcome');
  const [ready, setReady] = useState(false);
  const [errors, setErrors] = useState<string[]>([]);
  const [copied, setCopied] = useState<'launch' | 'recovery' | null>(null);

  const stepIndex = steps.findIndex((item) => item.id === step);
  const launchPrompt = useMemo(() => validateCommunityAnswers(answers).length === 0 ? buildCommunityLaunchPrompt(answers) : '', [answers]);
  const recoveryPrompt = useMemo(() => validateCommunityAnswers(answers).length === 0 ? buildCommunityRecoveryPrompt(answers) : '', [answers]);

  useEffect(() => {
    try {
      const saved = window.localStorage.getItem(STORAGE_KEY);
      const restored = saved ? restoreAnswers(JSON.parse(saved)) : null;
      if (restored) setAnswers(restored);
    } catch {
      // Browser storage is optional; the launcher still works without it.
    } finally {
      setReady(true);
    }
  }, []);

  useEffect(() => {
    if (!ready) return;
    try {
      window.localStorage.setItem(STORAGE_KEY, JSON.stringify(answers));
    } catch {
      // Continue without browser resume when storage is unavailable.
    }
  }, [answers, ready]);

  function updateField(field: TextField, value: string) {
    setAnswers((current) => ({ ...current, [field]: value }));
    setErrors([]);
  }

  function moveTo(target: StepId) {
    setErrors([]);
    setStep(target);
    window.requestAnimationFrame(() => document.getElementById('launcher-step-title')?.focus());
  }

  function continueForward() {
    const currentErrors = errorsForStep(step, answers);
    if (currentErrors.length > 0) {
      setErrors(currentErrors);
      return;
    }
    const next = steps[stepIndex + 1];
    if (next) moveTo(next.id);
  }

  function moveBack() {
    const previous = steps[stepIndex - 1];
    if (previous) moveTo(previous.id);
  }

  async function copyPrompt(kind: 'launch' | 'recovery') {
    const value = kind === 'launch' ? launchPrompt : recoveryPrompt;
    if (!value) return;
    try {
      await copyToClipboard(value);
      setCopied(kind);
      window.setTimeout(() => setCopied((current) => current === kind ? null : current), 2500);
    } catch {
      setErrors(['Copy failed. Select the prompt text and copy it manually.']);
    }
  }

  function reset() {
    setAnswers(copyAnswers(EMPTY_COMMUNITY_LAUNCHER_ANSWERS));
    setStep('welcome');
    setErrors([]);
    setCopied(null);
    try {
      window.localStorage.removeItem(STORAGE_KEY);
    } catch {
      // Nothing else to reset when browser storage is blocked.
    }
  }

  const inputClass = 'input mt-2 min-h-12 bg-ink-950/55';

  return (
    <section className="overflow-hidden rounded-[2rem] border border-white/12 bg-ink-900/80 shadow-2xl shadow-black/25 backdrop-blur" aria-label="Create your community launcher">
      <div className="border-b border-white/10 px-5 py-5 sm:px-8">
        <div className="flex items-center justify-between gap-4">
          <div>
            <p className="text-xs font-black uppercase tracking-[0.2em] text-limewash">Create your community</p>
            <p className="mt-1 text-sm text-braga-200">Step {stepIndex + 1} of {steps.length}</p>
          </div>
          <button type="button" onClick={reset} className="inline-flex min-h-10 shrink-0 items-center gap-2 whitespace-nowrap rounded-full px-3 text-sm font-bold text-braga-200 transition hover:bg-white/5 hover:text-white">
            <LuRotateCcw aria-hidden="true" /> Start over
          </button>
        </div>
        <div className="mt-4 h-1.5 overflow-hidden rounded-full bg-white/10" aria-hidden="true">
          <div className="h-full rounded-full bg-limewash transition-[width] duration-500" style={{ width: `${((stepIndex + 1) / steps.length) * 100}%` }} />
        </div>
        <ol className="mt-3 hidden grid-cols-5 gap-2 text-center text-[10px] font-bold uppercase tracking-[0.1em] text-braga-300 lg:grid">
          {steps.map((item, index) => <li key={item.id} className={index <= stepIndex ? 'text-limewash' : ''}>{item.label}</li>)}
        </ol>
      </div>

      <div className="min-h-[34rem] px-5 py-8 sm:px-8 sm:py-10">
        {step === 'welcome' && (
          <div className="mx-auto max-w-2xl">
            <div className="inline-flex h-14 w-14 items-center justify-center rounded-2xl bg-limewash text-ink-950 shadow-lg shadow-limewash/15">
              <LuSparkles className="h-7 w-7" aria-hidden="true" />
            </div>
            <h2 id="launcher-step-title" tabIndex={-1} className="mt-6 text-3xl font-black tracking-[-0.035em] text-white sm:text-4xl">Not technical? That’s fine.</h2>
            <p className="mt-4 max-w-xl text-lg leading-8 text-braga-100">Tell us about your community. We’ll give your AI the exact brief to install the complete platform with you, one step at a time, in accounts you own.</p>

            <button
              type="button"
              aria-pressed={answers.agentConfirmed}
              onClick={() => { setAnswers((current) => ({ ...current, agentConfirmed: !current.agentConfirmed })); setErrors([]); }}
              className={`mt-8 flex w-full items-start gap-4 rounded-3xl border p-5 text-left transition ${answers.agentConfirmed ? 'border-limewash bg-limewash/[0.09]' : 'border-white/15 bg-white/[0.025] hover:border-limewash/45'}`}
            >
              <span className={`mt-0.5 flex h-7 w-7 shrink-0 items-center justify-center rounded-full border ${answers.agentConfirmed ? 'border-limewash bg-limewash text-ink-950' : 'border-white/30 text-transparent'}`}><LuCheck aria-hidden="true" /></span>
              <span>
                <strong className="block text-lg text-white">My AI can work with files and run commands</strong>
                <span className="mt-1 block text-sm leading-6 text-braga-200">Codex, Claude Code, Hermes, Cursor, or another capable agent. A normal browser chat is not enough.</span>
              </span>
            </button>

            <div className="mt-5 flex items-start gap-3 rounded-2xl border border-braga-300/20 bg-braga-400/[0.06] p-4 text-sm leading-6 text-braga-100">
              <LuShieldCheck className="mt-0.5 h-5 w-5 shrink-0 text-braga-300" aria-hidden="true" />
              <p>No account here. No payment here. No credentials here. You create and own the GitHub, Supabase, and Vercel accounts while your AI handles the technical setup.</p>
            </div>
          </div>
        )}

        {step === 'identity' && (
          <div className="mx-auto max-w-2xl">
            <p className="text-sm font-black uppercase tracking-[0.18em] text-limewash">Your community</p>
            <h2 id="launcher-step-title" tabIndex={-1} className="mt-3 text-3xl font-black tracking-[-0.035em] text-white sm:text-4xl">Give us the basics.</h2>
            <p className="mt-3 text-base leading-7 text-braga-100">No platform jargon. Your AI can infer regional settings and ask if anything is unclear.</p>
            <div className="mt-8 grid gap-6 sm:grid-cols-2">
              <label className="block sm:col-span-2"><span className="label">Community name</span><input className={inputClass} maxLength={100} value={answers.communityName} onChange={(event) => updateField('communityName', event.target.value)} placeholder="Braga AI Builders" autoComplete="organization" /></label>
              <label className="block"><span className="label">City, town, or area</span><input className={inputClass} maxLength={120} value={answers.location} onChange={(event) => updateField('location', event.target.value)} placeholder="Braga, Portugal" autoComplete="address-level2" /></label>
              <label className="block"><span className="label">Platform Language</span><input className={inputClass} maxLength={30} value={answers.locale} onChange={(event) => updateField('locale', event.target.value)} placeholder="English" /></label>
              <label className="block sm:col-span-2"><span className="label">Organizer or organizing team</span><input className={inputClass} maxLength={120} value={answers.organizerName} onChange={(event) => updateField('organizerName', event.target.value)} placeholder="Your name or organizing team" autoComplete="name" /></label>
            </div>
          </div>
        )}

        {step === 'purpose' && (
          <div className="mx-auto max-w-2xl">
            <p className="text-sm font-black uppercase tracking-[0.18em] text-limewash">Community description</p>
            <h2 id="launcher-step-title" tabIndex={-1} className="mt-3 text-3xl font-black tracking-[-0.035em] text-white sm:text-4xl">Why should people join?</h2>
            <p className="mt-3 text-base leading-7 text-braga-100">Write naturally. Your AI will turn this into public copy and ask you to approve it.</p>
            <div className="mt-8 space-y-6">
              <label className="block"><span className="label">What brings people together?</span><textarea className={`${inputClass} min-h-32 resize-y`} maxLength={600} value={answers.purpose} onChange={(event) => updateField('purpose', event.target.value)} placeholder="We help local people use AI to solve real problems and build useful things together." /></label>
              <label className="block"><span className="label">Who is it for?</span><textarea className={`${inputClass} min-h-28 resize-y`} maxLength={400} value={answers.audience} onChange={(event) => updateField('audience', event.target.value)} placeholder="Curious beginners, builders, business owners, students, and experienced practitioners in the area." /></label>
            </div>
          </div>
        )}

        {step === 'review' && (
          <div className="mx-auto max-w-3xl">
            <p className="text-sm font-black uppercase tracking-[0.18em] text-limewash">Review</p>
            <h2 id="launcher-step-title" tabIndex={-1} className="mt-3 text-3xl font-black tracking-[-0.035em] text-white sm:text-4xl">Every built feature is included.</h2>
            <p className="mt-3 text-base leading-7 text-braga-100">You are choosing the community identity, not assembling software. After launch, the super admin turns participation and feature settings on or off.</p>

            <div className="mt-8 grid gap-5 lg:grid-cols-[1.05fr_0.95fr]">
              <div className="rounded-3xl border border-white/12 bg-white/[0.025] p-6">
                <p className="text-xs font-black uppercase tracking-[0.16em] text-braga-300">Community</p>
                <h3 className="mt-3 text-2xl font-black text-white">{answers.communityName}</h3>
                <p className="mt-1 font-bold text-limewash">{answers.location}</p>
                <p className="mt-5 text-sm leading-6 text-braga-100">{answers.purpose}</p>
                <dl className="mt-6 space-y-3 text-sm">
                  <div><dt className="text-braga-300">For</dt><dd className="mt-1 text-white">{answers.audience}</dd></div>
                  <div><dt className="text-braga-300">Organizer</dt><dd className="mt-1 text-white">{answers.organizerName}</dd></div>
                  <div><dt className="text-braga-300">Platform language</dt><dd className="mt-1 text-white">{answers.locale}</dd></div>
                </dl>
              </div>
              <div className="rounded-3xl border border-white/12 bg-white/[0.025] p-6">
                <p className="text-xs font-black uppercase tracking-[0.16em] text-braga-300">Included platform</p>
                <ul className="mt-4 space-y-3 text-sm text-braga-100">
                  {INCLUDED_PLATFORM_FEATURES.map((feature) => <li key={feature} className="flex gap-3"><LuCheck className="mt-0.5 shrink-0 text-limewash" aria-hidden="true" /><span>{feature}</span></li>)}
                </ul>
              </div>
            </div>

            <div className="mt-5 flex items-start gap-3 rounded-2xl border border-limewash/20 bg-limewash/[0.06] p-4 text-sm leading-6 text-braga-100">
              <LuTerminal className="mt-0.5 h-5 w-5 shrink-0 text-limewash" aria-hidden="true" />
              <p>The next screen creates one complete brief. Your AI guides you through new owner-controlled GitHub, Supabase, and Vercel setup, then proves login and invitations work.</p>
            </div>
          </div>
        )}

        {step === 'prompt' && (
          <div className="mx-auto max-w-3xl">
            <div className="flex h-14 w-14 items-center justify-center rounded-2xl bg-limewash text-ink-950"><LuCheck className="h-7 w-7" aria-hidden="true" /></div>
            <p className="mt-6 text-sm font-black uppercase tracking-[0.18em] text-limewash">Launch brief ready</p>
            <h2 id="launcher-step-title" tabIndex={-1} className="mt-3 text-3xl font-black tracking-[-0.035em] text-white sm:text-4xl">Copy it. Give it to your AI. Follow one step at a time.</h2>
            <p className="mt-3 max-w-2xl text-base leading-7 text-braga-100">Your AI installs the complete platform, guides you through accounts you own, protects credentials, and refuses to call it launched until login and a real member invitation work.</p>

            <div className="mt-8 overflow-hidden rounded-3xl border border-white/12 bg-black/25">
              <div className="flex flex-col gap-3 border-b border-white/10 p-4 sm:flex-row sm:items-center sm:justify-between">
                <div><p className="font-black text-white">Primary launch brief</p><p className="mt-1 text-xs text-braga-300">Paste this into your capable AI agent.</p></div>
                <button type="button" onClick={() => void copyPrompt('launch')} className="btn-primary gap-2"><LuCopy aria-hidden="true" />{copied === 'launch' ? 'Copied' : 'Copy launch brief'}</button>
              </div>
              <textarea readOnly value={launchPrompt} aria-label="Primary launch brief" className="h-72 w-full resize-y bg-transparent p-5 font-mono text-xs leading-6 text-braga-100 outline-none" />
            </div>

            <details className="mt-5 rounded-3xl border border-white/12 bg-white/[0.025] p-5">
              <summary className="cursor-pointer font-black text-white">Lost the AI session? Copy a recovery brief</summary>
              <p className="mt-3 text-sm leading-6 text-braga-100">It carries your approved answers and tells a fresh agent to inspect real progress before continuing. It contains no credentials.</p>
              <button type="button" onClick={() => void copyPrompt('recovery')} className="btn-secondary mt-4 gap-2"><LuCopy aria-hidden="true" />{copied === 'recovery' ? 'Copied' : 'Copy recovery brief'}</button>
              <textarea readOnly value={recoveryPrompt} aria-label="Recovery brief" className="mt-4 h-48 w-full resize-y rounded-2xl border border-white/10 bg-black/25 p-4 font-mono text-xs leading-6 text-braga-100 outline-none" />
            </details>
          </div>
        )}

        {errors.length > 0 && (
          <div className="error-message mx-auto mt-7 max-w-3xl" role="alert">
            <strong className="block text-white">One thing before you continue:</strong>
            <ul className="mt-2 list-disc space-y-1 pl-5">{errors.map((error) => <li key={error}>{error}</li>)}</ul>
          </div>
        )}
      </div>

      <div className="flex flex-col-reverse gap-3 border-t border-white/10 px-5 py-5 sm:flex-row sm:items-center sm:justify-between sm:px-8">
        {stepIndex > 0 ? (
          <button type="button" onClick={moveBack} className="btn-secondary gap-2"><LuArrowLeft aria-hidden="true" />{step === 'prompt' ? 'Back to review' : 'Back'}</button>
        ) : <span />}
        {step !== 'prompt' && (
          <button type="button" onClick={continueForward} className="btn-primary gap-2">
            {step === 'review' ? 'Generate launch brief' : 'Continue'}<LuArrowRight aria-hidden="true" />
          </button>
        )}
      </div>
    </section>
  );
}
