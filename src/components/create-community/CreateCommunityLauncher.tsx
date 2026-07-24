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
  LAUNCHER_FEATURES,
  buildCommunityLaunchPrompt,
  buildCommunityRecoveryPrompt,
  validateCommunityAnswers,
  type CommunityFeatureId,
  type CommunityLauncherAnswers,
} from '@/lib/createCommunityLauncher';

const STORAGE_KEY = 'local-community-launcher-v1';

const steps = [
  { id: 'welcome', label: 'Start' },
  { id: 'identity', label: 'Identity' },
  { id: 'purpose', label: 'Purpose' },
  { id: 'details', label: 'Details' },
  { id: 'features', label: 'Features' },
  { id: 'review', label: 'Review' },
  { id: 'prompt', label: 'Launch brief' },
] as const;

type StepId = typeof steps[number]['id'];
type TextField = Exclude<keyof CommunityLauncherAnswers, 'agentConfirmed' | 'features'>;

function copyAnswers(value: CommunityLauncherAnswers): CommunityLauncherAnswers {
  return { ...value, features: { ...value.features } };
}

function restoreAnswers(value: unknown): CommunityLauncherAnswers | null {
  if (!value || typeof value !== 'object') return null;
  const candidate = value as Partial<CommunityLauncherAnswers>;
  const features = candidate.features;
  if (!features || typeof features !== 'object') return null;

  const restored = copyAnswers(EMPTY_COMMUNITY_LAUNCHER_ANSWERS);
  restored.agentConfirmed = candidate.agentConfirmed === true;

  for (const field of ['communityName', 'location', 'purpose', 'audience', 'organizerName', 'country', 'locale', 'timeZone'] as TextField[]) {
    if (typeof candidate[field] === 'string') restored[field] = candidate[field].slice(0, 600);
  }

  for (const feature of LAUNCHER_FEATURES) {
    const choice = features[feature.id];
    restored.features[feature.id] = typeof choice === 'boolean' ? choice : null;
  }

  return restored;
}

function errorsForStep(step: StepId, answers: CommunityLauncherAnswers) {
  const missing = (value: string) => value.trim().length === 0;
  if (step === 'welcome' && !answers.agentConfirmed) return ['Confirm that your AI can access files and run commands.'];
  if (step === 'identity') {
    return [
      missing(answers.communityName) ? 'Add your community name.' : '',
      missing(answers.location) ? 'Add the city, town, or area your community serves.' : '',
    ].filter(Boolean);
  }
  if (step === 'purpose') {
    return [
      missing(answers.purpose) ? 'Describe why the community exists.' : '',
      missing(answers.audience) ? 'Describe who the community is for.' : '',
    ].filter(Boolean);
  }
  if (step === 'details') {
    return [
      missing(answers.organizerName) ? 'Add the organizer or operator name.' : '',
      missing(answers.country) ? 'Add the country where the community operates.' : '',
      missing(answers.locale) ? 'Add the public locale.' : '',
      missing(answers.timeZone) ? 'Add the community time zone.' : '',
    ].filter(Boolean);
  }
  if (step === 'features' && LAUNCHER_FEATURES.some((feature) => answers.features[feature.id] === null)) {
    return ['Answer Yes or Not now for every launch feature.'];
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
  const launchPrompt = useMemo(() => {
    if (validateCommunityAnswers(answers).length > 0) return '';
    return buildCommunityLaunchPrompt(answers);
  }, [answers]);
  const recoveryPrompt = useMemo(() => {
    if (validateCommunityAnswers(answers).length > 0) return '';
    return buildCommunityRecoveryPrompt(answers);
  }, [answers]);

  useEffect(() => {
    try {
      const saved = window.localStorage.getItem(STORAGE_KEY);
      const restored = saved ? restoreAnswers(JSON.parse(saved)) : null;
      if (restored) setAnswers(restored);
    } catch {
      // A blocked or malformed browser store should never block the launcher.
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

  function updateFeature(feature: CommunityFeatureId, value: boolean) {
    setAnswers((current) => ({
      ...current,
      features: { ...current.features, [feature]: value },
    }));
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
  const choiceClass = (active: boolean) => `min-h-11 rounded-full border px-4 py-2 text-sm font-black transition ${active ? 'border-limewash bg-limewash text-ink-950' : 'border-white/15 bg-white/[0.03] text-braga-100 hover:border-limewash/55 hover:text-white'}`;

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
        <ol className="mt-3 hidden grid-cols-7 gap-2 text-center text-[10px] font-bold uppercase tracking-[0.1em] text-braga-300 lg:grid">
          {steps.map((item, index) => <li key={item.id} className={index <= stepIndex ? 'text-limewash' : ''}>{item.label}</li>)}
        </ol>
      </div>

      <div className="min-h-[34rem] px-5 py-8 sm:px-8 sm:py-10">
        {step === 'welcome' && (
          <div className="mx-auto max-w-2xl">
            <div className="inline-flex h-14 w-14 items-center justify-center rounded-2xl bg-limewash text-ink-950 shadow-lg shadow-limewash/15">
              <LuSparkles className="h-7 w-7" aria-hidden="true" />
            </div>
            <h2 id="launcher-step-title" tabIndex={-1} className="mt-6 text-3xl font-black tracking-[-0.035em] text-white sm:text-4xl">Your community. Your platform. Your accounts.</h2>
            <p className="mt-4 max-w-xl text-lg leading-8 text-braga-100">Answer a few plain-English questions. We’ll prepare one launch brief for your AI to install the platform with you.</p>

            <button
              type="button"
              aria-pressed={answers.agentConfirmed}
              onClick={() => { setAnswers((current) => ({ ...current, agentConfirmed: !current.agentConfirmed })); setErrors([]); }}
              className={`mt-8 flex w-full items-start gap-4 rounded-3xl border p-5 text-left transition ${answers.agentConfirmed ? 'border-limewash bg-limewash/[0.09]' : 'border-white/15 bg-white/[0.025] hover:border-limewash/45'}`}
            >
              <span className={`mt-0.5 flex h-7 w-7 shrink-0 items-center justify-center rounded-full border ${answers.agentConfirmed ? 'border-limewash bg-limewash text-ink-950' : 'border-white/30 text-transparent'}`}><LuCheck aria-hidden="true" /></span>
              <span>
                <strong className="block text-lg text-white">My AI can access files and run commands</strong>
                <span className="mt-1 block text-sm leading-6 text-braga-200">Codex, Claude Code/Desktop with tools, Hermes, Cursor, or another capable agent. A normal browser chat is not enough.</span>
              </span>
            </button>

            <div className="mt-5 flex items-start gap-3 rounded-2xl border border-braga-300/20 bg-braga-400/[0.06] p-4 text-sm leading-6 text-braga-100">
              <LuShieldCheck className="mt-0.5 h-5 w-5 shrink-0 text-braga-300" aria-hidden="true" />
              <p>No account. No payment. No credentials. Your answers stay in this browser and only appear in the prompt you copy.</p>
            </div>
          </div>
        )}

        {step === 'identity' && (
          <div className="mx-auto max-w-2xl">
            <p className="text-sm font-black uppercase tracking-[0.18em] text-limewash">Community identity</p>
            <h2 id="launcher-step-title" tabIndex={-1} className="mt-3 text-3xl font-black tracking-[-0.035em] text-white sm:text-4xl">What should people call it?</h2>
            <p className="mt-3 text-base leading-7 text-braga-100">Start with the facts. Your AI will help shape the public copy later.</p>
            <div className="mt-8 space-y-6">
              <label className="block"><span className="label">Community name</span><input className={inputClass} maxLength={100} value={answers.communityName} onChange={(event) => updateField('communityName', event.target.value)} placeholder="Braga AI Builders" autoComplete="organization" /></label>
              <label className="block"><span className="label">City, town, or area</span><input className={inputClass} maxLength={120} value={answers.location} onChange={(event) => updateField('location', event.target.value)} placeholder="Braga, Portugal" autoComplete="address-level2" /></label>
            </div>
          </div>
        )}

        {step === 'purpose' && (
          <div className="mx-auto max-w-2xl">
            <p className="text-sm font-black uppercase tracking-[0.18em] text-limewash">Purpose</p>
            <h2 id="launcher-step-title" tabIndex={-1} className="mt-3 text-3xl font-black tracking-[-0.035em] text-white sm:text-4xl">Why should this community exist?</h2>
            <p className="mt-3 text-base leading-7 text-braga-100">Write like you’re explaining it to one potential member.</p>
            <div className="mt-8 space-y-6">
              <label className="block"><span className="label">What brings people together?</span><textarea className={`${inputClass} min-h-32 resize-y`} maxLength={600} value={answers.purpose} onChange={(event) => updateField('purpose', event.target.value)} placeholder="We help local people use AI to solve real problems and build useful things together." /></label>
              <label className="block"><span className="label">Who is it for?</span><textarea className={`${inputClass} min-h-28 resize-y`} maxLength={400} value={answers.audience} onChange={(event) => updateField('audience', event.target.value)} placeholder="Curious beginners, builders, business owners, students, and experienced practitioners in the area." /></label>
            </div>
          </div>
        )}

        {step === 'details' && (
          <div className="mx-auto max-w-2xl">
            <p className="text-sm font-black uppercase tracking-[0.18em] text-limewash">Operating details</p>
            <h2 id="launcher-step-title" tabIndex={-1} className="mt-3 text-3xl font-black tracking-[-0.035em] text-white sm:text-4xl">Set the local defaults.</h2>
            <p className="mt-3 text-base leading-7 text-braga-100">These values shape dates, legal placeholders, and the first organizer account.</p>
            <div className="mt-8 grid gap-6 sm:grid-cols-2">
              <label className="block sm:col-span-2"><span className="label">Organizer or operator name</span><input className={inputClass} maxLength={120} value={answers.organizerName} onChange={(event) => updateField('organizerName', event.target.value)} placeholder="Your name or organizing team" autoComplete="name" /></label>
              <label className="block"><span className="label">Country</span><input className={inputClass} maxLength={80} value={answers.country} onChange={(event) => updateField('country', event.target.value)} placeholder="Portugal" autoComplete="country-name" /></label>
              <label className="block"><span className="label">Public locale</span><input className={inputClass} maxLength={30} value={answers.locale} onChange={(event) => updateField('locale', event.target.value)} placeholder="en-GB" /></label>
              <label className="block sm:col-span-2"><span className="label">Time zone</span><input className={inputClass} maxLength={80} value={answers.timeZone} onChange={(event) => updateField('timeZone', event.target.value)} placeholder="Europe/Lisbon" /></label>
            </div>
          </div>
        )}

        {step === 'features' && (
          <div className="mx-auto max-w-3xl">
            <p className="text-sm font-black uppercase tracking-[0.18em] text-limewash">Launch features</p>
            <h2 id="launcher-step-title" tabIndex={-1} className="mt-3 text-3xl font-black tracking-[-0.035em] text-white sm:text-4xl">What should be ready on day one?</h2>
            <p className="mt-3 max-w-2xl text-base leading-7 text-braga-100">Nothing is preselected. Choose <strong className="text-white">Yes</strong> or <strong className="text-white">Not now</strong>. Skipped features stay available for later.</p>
            <div className="mt-8 space-y-4">
              {LAUNCHER_FEATURES.map((feature) => {
                const value = answers.features[feature.id];
                return (
                  <fieldset key={feature.id} className="rounded-3xl border border-white/12 bg-white/[0.025] p-5 sm:p-6">
                    <legend className="sr-only">{feature.question}</legend>
                    <div className="flex flex-col gap-5 sm:flex-row sm:items-start sm:justify-between">
                      <div className="max-w-xl">
                        <h3 className="text-lg font-black text-white">{feature.question}</h3>
                        <p className="mt-2 text-sm leading-6 text-braga-100">{feature.description}</p>
                        <p className="mt-2 text-xs leading-5 text-braga-300">{feature.setupNote}</p>
                      </div>
                      <div className="flex shrink-0 gap-2" aria-label={feature.label}>
                        <button type="button" aria-pressed={value === true} className={choiceClass(value === true)} onClick={() => updateFeature(feature.id, true)}>Yes</button>
                        <button type="button" aria-pressed={value === false} className={choiceClass(value === false)} onClick={() => updateFeature(feature.id, false)}>Not now</button>
                      </div>
                    </div>
                  </fieldset>
                );
              })}
            </div>
          </div>
        )}

        {step === 'review' && (
          <div className="mx-auto max-w-3xl">
            <p className="text-sm font-black uppercase tracking-[0.18em] text-limewash">Review</p>
            <h2 id="launcher-step-title" tabIndex={-1} className="mt-3 text-3xl font-black tracking-[-0.035em] text-white sm:text-4xl">This is the launch brief we’ll hand your AI.</h2>
            <p className="mt-3 text-base leading-7 text-braga-100">Check the facts. You can go back without losing anything.</p>

            <div className="mt-8 grid gap-5 lg:grid-cols-[1.05fr_0.95fr]">
              <div className="rounded-3xl border border-white/12 bg-white/[0.025] p-6">
                <p className="text-xs font-black uppercase tracking-[0.16em] text-braga-300">Community</p>
                <h3 className="mt-3 text-2xl font-black text-white">{answers.communityName}</h3>
                <p className="mt-1 font-bold text-limewash">{answers.location}</p>
                <p className="mt-5 text-sm leading-6 text-braga-100">{answers.purpose}</p>
                <dl className="mt-6 space-y-3 text-sm">
                  <div><dt className="text-braga-300">For</dt><dd className="mt-1 text-white">{answers.audience}</dd></div>
                  <div><dt className="text-braga-300">Organizer</dt><dd className="mt-1 text-white">{answers.organizerName}</dd></div>
                  <div><dt className="text-braga-300">Local defaults</dt><dd className="mt-1 text-white">{answers.country} · {answers.locale} · {answers.timeZone}</dd></div>
                </dl>
              </div>
              <div className="rounded-3xl border border-white/12 bg-white/[0.025] p-6">
                <p className="text-xs font-black uppercase tracking-[0.16em] text-braga-300">Launch shape</p>
                <ul className="mt-4 space-y-3">
                  {LAUNCHER_FEATURES.map((feature) => (
                    <li key={feature.id} className="flex items-center justify-between gap-4 border-b border-white/8 pb-3 text-sm last:border-0 last:pb-0">
                      <span className="text-braga-100">{feature.label}</span>
                      <strong className={answers.features[feature.id] ? 'text-limewash' : 'text-braga-300'}>{answers.features[feature.id] ? 'Yes' : 'Not now'}</strong>
                    </li>
                  ))}
                </ul>
              </div>
            </div>

            <div className="mt-5 flex items-start gap-3 rounded-2xl border border-limewash/20 bg-limewash/[0.06] p-4 text-sm leading-6 text-braga-100">
              <LuTerminal className="mt-0.5 h-5 w-5 shrink-0 text-limewash" aria-hidden="true" />
              <p>The next screen generates one complete prompt pinned to the stable platform release. Your AI will ask for the hero image after it fetches the source.</p>
            </div>
          </div>
        )}

        {step === 'prompt' && (
          <div className="mx-auto max-w-3xl">
            <div className="flex h-14 w-14 items-center justify-center rounded-2xl bg-limewash text-ink-950"><LuCheck className="h-7 w-7" aria-hidden="true" /></div>
            <p className="mt-6 text-sm font-black uppercase tracking-[0.18em] text-limewash">Launch brief ready</p>
            <h2 id="launcher-step-title" tabIndex={-1} className="mt-3 text-3xl font-black tracking-[-0.035em] text-white sm:text-4xl">Copy it. Give it to your AI. Launch.</h2>
            <p className="mt-3 max-w-2xl text-base leading-7 text-braga-100">This brief carries your choices, pins the stable source, protects credentials, guides Supabase and Vercel, and refuses to call the launch finished until login and invitations work.</p>

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
