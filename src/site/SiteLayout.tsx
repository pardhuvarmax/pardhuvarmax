import { lazy, Suspense, useEffect, useState } from 'react';
import { Link, NavLink, Outlet, useLocation } from 'react-router-dom';
import { motion, useScroll, useSpring } from 'motion/react';
import { ArrowUp, Menu, Moon, Sun, X } from 'lucide-react';
import { Analytics } from '@vercel/analytics/react';
import { site } from '../lib/content';
import { useTheme } from './useTheme';
import DotGrid from './DotGrid';
import { useDynamicColors } from './useDynamicColors';
import '../styles/site.css';

// On-site editing is split into its own chunk and only loaded for the owner.
const EditMode = lazy(() => import('../admin/EditMode'));
const isOwnerHint = () => {
  try {
    if (localStorage.getItem('cms') === '1') return true;
  } catch {
    /* storage unavailable */
  }
  return ['localhost', '127.0.0.1', '[::1]'].includes(window.location.hostname);
};

const NAV = [
  { to: '/me', label: 'Me' },
  { to: '/research', label: 'Research' },
  { to: '/publications', label: 'Publications' },
  { to: '/projects', label: 'Projects' },
  { to: '/blog', label: 'Writing' },
  { to: '/#contact', label: 'Contact' },
];

/** Back-to-top cue at the end of long pages: same pixel button as the hero's scroll cue, pointing up. */
function TopCue() {
  const { pathname } = useLocation();
  const [show, setShow] = useState(false);
  const [atEnd, setAtEnd] = useState(false);
  useEffect(() => {
    const check = () => {
      const doc = document.documentElement;
      setShow(doc.scrollHeight > window.innerHeight + 240);
      setAtEnd(window.scrollY + window.innerHeight >= doc.scrollHeight - 24); // only visible at the very end
    };
    const t = window.setTimeout(check, 700); // after the page content has laid out
    window.addEventListener('resize', check);
    window.addEventListener('scroll', check, { passive: true });
    return () => {
      window.clearTimeout(t);
      window.removeEventListener('resize', check);
      window.removeEventListener('scroll', check);
    };
  }, [pathname]);
  if (!show || pathname !== '/') return null; // main page only; standalone pages don't get it
  return (
    <button className={`top-cue ${atEnd ? '' : 'is-hidden'}`} tabIndex={atEnd ? 0 : -1} aria-label="Back to top" onClick={() => window.scrollTo({ top: 0, behavior: 'smooth' })}>
      <span>scroll up</span>
      <i><ArrowUp size={18} strokeWidth={3} /></i>
    </button>
  );
}

export default function SiteLayout() {
  const { theme, toggle } = useTheme();
  useDynamicColors();
  const { pathname, hash } = useLocation();
  const [open, setOpen] = useState(false);
  const [scrolled, setScrolled] = useState(false);
  const [editLoaded, setEditLoaded] = useState(isOwnerHint);
  const [editRequest, setEditRequest] = useState(0);
  const { scrollYProgress } = useScroll();
  const progress = useSpring(scrollYProgress, { stiffness: 120, damping: 24, mass: 0.2 });

  useEffect(() => {
    setOpen(false);
    if (hash) {
      const el = document.getElementById(hash.slice(1));
      if (el) {
        setTimeout(() => el.scrollIntoView({ behavior: 'smooth' }), 60);
        return;
      }
    }
    window.scrollTo({ top: 0 });
  }, [pathname, hash]);

  useEffect(() => {
    const onScroll = () => setScrolled(window.scrollY > 12);
    onScroll();
    window.addEventListener('scroll', onScroll, { passive: true });
    return () => window.removeEventListener('scroll', onScroll);
  }, []);

  return (
    <div className="site">
      <DotGrid />
      <div className="site-bg" aria-hidden="true">
        <i className="blob b1" />
        <i className="blob b2" />
        <i className="blob b3" />
      </div>
      <motion.div className="progress" style={{ scaleX: progress }} aria-hidden="true" />
      <a className="skip" href="#content">Skip to content</a>

      <header className={`nav ${scrolled ? 'nav--solid' : ''}`}>
        <Link to="/" className="brand" aria-label="Home">
          <span className="brand-mark">K</span>
          <span className="brand-text">{site.shortName}</span>
        </Link>
        <nav className={`nav-links ${open ? 'is-open' : ''}`} aria-label="Primary">
          {NAV.map((n) =>
            n.to.startsWith('/#') ? (
              <Link key={n.to} to={n.to}>{n.label}</Link>
            ) : (
              <NavLink key={n.to} to={n.to} className={({ isActive }) => (isActive ? 'active' : '')}>{n.label}</NavLink>
            ),
          )}
        </nav>
        <div className="nav-actions">
          <button className="icon-btn" onClick={toggle} aria-label={`Switch to ${theme === 'dark' ? 'light' : 'dark'} theme`}>
            {theme === 'dark' ? <Sun size={18} /> : <Moon size={18} />}
          </button>
          <button className="icon-btn nav-burger" onClick={() => setOpen((o) => !o)} aria-label="Menu" aria-expanded={open}>
            {open ? <X size={18} /> : <Menu size={18} />}
          </button>
        </div>
      </header>

      <motion.div
        key={pathname}
        id="content"
        initial={{ opacity: 0, y: 14 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.5, ease: [0.22, 1, 0.36, 1] }}
      >
        <Outlet />
      </motion.div>

      <footer className="footer">
        <div className="wrap footer-in">
          <span>
            &copy; {new Date().getFullYear()} {site.name} &middot; {site.location}
            <button className="admin-link" onClick={() => { setEditLoaded(true); setEditRequest((n) => n + 1); }}>Admin</button>
          </span>
          <span className="footer-right">
            <TopCue />
          </span>
        </div>
      </footer>
      {editLoaded && (
        <Suspense fallback={null}>
          <EditMode openRequest={editRequest} />
        </Suspense>
      )}
      <Analytics />
    </div>
  );
}
