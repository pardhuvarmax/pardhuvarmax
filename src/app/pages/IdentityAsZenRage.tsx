import { useMemo, useState } from 'react';
import { Link } from 'react-router-dom';

type Mode = 'zen' | 'rage';
type ChallengeCategory = 'all' | 'web' | 'pwn' | 'crypto' | 'reverse' | 'stego' | 'cloud';

type Challenge = {
  title: string;
  category: Exclude<ChallengeCategory, 'all'>;
  stack: string;
  note: string;
  difficulty: 'easy' | 'medium' | 'hard';
};

const challenges: Challenge[] = [
  {
    title: 'kernel-shadow-lab',
    category: 'pwn',
    stack: 'C · x86_64 · Linux namespaces',
    note: 'Runtime memory corruption challenge with exploit+patch dual objective.',
    difficulty: 'hard',
  },
  {
    title: 'echoes-of-entropy',
    category: 'crypto',
    stack: 'Python · SageMath',
    note: 'Bias-driven nonce recovery over weak deterministic signatures.',
    difficulty: 'medium',
  },
  {
    title: 'lotus-chain',
    category: 'cloud',
    stack: 'Docker · K8s · Terraform',
    note: 'Misconfigured cloud graph traversal challenge deployed in isolated pods.',
    difficulty: 'hard',
  },
  {
    title: 'paper-mask',
    category: 'stego',
    stack: 'Python · FFT · image forensics',
    note: 'Frequency-domain extraction from lossy social-media image pipelines.',
    difficulty: 'medium',
  },
  {
    title: 'shinto-gateway',
    category: 'web',
    stack: 'Go · PostgreSQL · JWT',
    note: 'Authorization-boundary bypass centered on identity trust confusion.',
    difficulty: 'medium',
  },
  {
    title: 'ghost-katana',
    category: 'reverse',
    stack: 'Rust · Ghidra · ELF',
    note: 'State-machine guided reverse engineering under anti-debug constraints.',
    difficulty: 'hard',
  },
];

const events = [
  {
    name: 'NCSRC × EC-Council National CTF',
    detail:
      'Technical Challenge Author and Cloud Deployment Operations · Designed and deployed reproducible challenge infrastructure.',
    when: 'Feb–Mar 2026',
  },
  {
    name: 'CY4TF Cyber Fortress CTF',
    detail: 'Team Captain · ZenRage · 15th place (15/50 teams, 1200 points).',
    when: 'Mar 2025',
  },
];

const testimonials = [
  {
    quote: 'ZenRage challenges consistently balanced exploit depth with clean educational feedback loops.',
    by: 'CTF Ops Reviewer',
  },
  {
    quote: 'Deployment artifacts were reproducible, isolated, and ready for scale without manual patching.',
    by: 'Cloud Infra Coordinator',
  },
];

const terminalLines = [
  '$ zenrage deploy --event ncsrc-ec-council-ctf --mode rage',
  ':: syncing challenge containers .......... ok',
  ':: validating player network segregation . ok',
  ':: checking scoring webhooks ............. ok',
  ':: publishing manifests .................. ok',
  'deployment complete: 42 challenge nodes online',
];

const contactLinks = [
  { label: 'GitHub', href: 'https://github.com/pardhuvarmax' },
  { label: 'LinkedIn', href: 'https://www.linkedin.com/in/pardhu-sri-rushi-varma-konduru-696886279/' },
  { label: 'ORCID', href: 'https://orcid.org/0009-0005-3251-9944' },
  { label: 'Instagram', href: 'https://www.instagram.com/pardhu.varma_x/' },
  { label: 'Email', href: 'mailto:pardhuvarma.cs@gmail.com' },
  { label: 'arXiv', href: 'https://arxiv.org/abs/2603.02934' },
  { label: 'TryHackMe', href: 'https://tryhackme.com/' },
];

const challengeCategories: ChallengeCategory[] = ['all', 'web', 'pwn', 'crypto', 'reverse', 'stego', 'cloud'];

export default function IdentityAsZenRage() {
  const [mode, setMode] = useState<Mode>('zen');
  const [selectedCategory, setSelectedCategory] = useState<ChallengeCategory>('all');

  const filteredChallenges = useMemo(() => {
    if (selectedCategory === 'all') return challenges;
    return challenges.filter((challenge) => challenge.category === selectedCategory);
  }, [selectedCategory]);

  return (
    <main className={`zenrage-page zenrage-page--${mode}`}>
      <a className="zenrage-skip-link" href="#zenrage-main-content">
        Skip to content
      </a>

      <header className="zenrage-header" aria-label="Identity as ZenRage page header">
        <Link to="/" className="zenrage-home-link" aria-label="Back to main portfolio">
          ← Portfolio
        </Link>
        <button
          type="button"
          className="zenrage-mode-toggle"
          aria-pressed={mode === 'rage'}
          aria-label={`Switch to ${mode === 'zen' ? 'Rage' : 'Zen'} mode`}
          onClick={() => setMode((current) => (current === 'zen' ? 'rage' : 'zen'))}
        >
          {mode === 'zen' ? 'ZEN MODE' : 'RAGE MODE'}
        </button>
      </header>

      <section className="zenrage-hero" aria-labelledby="zenrage-title">
        <p className="zenrage-kicker">Identity as</p>
        <h1 id="zenrage-title" className="zenrage-wordmark" data-text="ZenRage">
          ZenRage
        </h1>
        <p className="zenrage-subtitle" id="zenrage-main-content">
          Japanese-inspired calm and controlled chaos for challenge design, event operations, and post-exploitation pedagogy.
        </p>
      </section>

      <section className="zenrage-section" aria-labelledby="zenrage-challenges-heading">
        <div className="zenrage-section-head">
          <h2 id="zenrage-challenges-heading">Challenge Forge</h2>
          <p>Filter challenge types from authored and deployed CTF workloads.</p>
        </div>

        <div className="zenrage-filter-group" role="toolbar" aria-label="Filter challenges by category">
          {challengeCategories.map((category) => {
            const isActive = selectedCategory === category;
            return (
              <button
                key={category}
                type="button"
                className="zenrage-filter-chip"
                aria-pressed={isActive}
                onClick={() => setSelectedCategory(category)}
              >
                {category}
              </button>
            );
          })}
        </div>

        <ul className="zenrage-challenge-grid" aria-live="polite">
          {filteredChallenges.map((challenge) => (
            <li key={challenge.title} className="zenrage-card">
              <h3>{challenge.title}</h3>
              <p className="zenrage-card-meta">
                <span>{challenge.category}</span>
                <span aria-label={`Difficulty ${challenge.difficulty}`}>{challenge.difficulty}</span>
              </p>
              <p className="zenrage-stack">{challenge.stack}</p>
              <p>{challenge.note}</p>
            </li>
          ))}
        </ul>
      </section>

      <section className="zenrage-section zenrage-split" aria-label="Deployment and events">
        <article className="zenrage-terminal-wrap" aria-labelledby="zenrage-terminal-heading">
          <h2 id="zenrage-terminal-heading">Deployment Terminal</h2>
          <pre className="zenrage-terminal" role="status" aria-live="polite">
            {terminalLines.join('\n')}
          </pre>
        </article>

        <article aria-labelledby="zenrage-events-heading">
          <h2 id="zenrage-events-heading">Events</h2>
          <ul className="zenrage-list">
            {events.map((event) => (
              <li key={event.name}>
                <h3>{event.name}</h3>
                <p>{event.detail}</p>
                <p className="zenrage-time">{event.when}</p>
              </li>
            ))}
          </ul>
        </article>
      </section>

      <section className="zenrage-section zenrage-split" aria-label="Testimonials and contact">
        <article aria-labelledby="zenrage-testimonials-heading">
          <h2 id="zenrage-testimonials-heading">Testimonials</h2>
          <ul className="zenrage-list">
            {testimonials.map((testimonial) => (
              <li key={testimonial.by}>
                <blockquote>“{testimonial.quote}”</blockquote>
                <p className="zenrage-time">— {testimonial.by}</p>
              </li>
            ))}
          </ul>
        </article>

        <article aria-labelledby="zenrage-contact-heading">
          <h2 id="zenrage-contact-heading">Contact Links</h2>
          <ul className="zenrage-contact-list">
            {contactLinks.map((link) => (
              <li key={link.label}>
                <a href={link.href} target="_blank" rel="noopener noreferrer">
                  {link.label}
                </a>
              </li>
            ))}
          </ul>
        </article>
      </section>
    </main>
  );
}
