import { useEffect, useState } from 'react';
import { Analytics } from "@vercel/analytics/react"
import { BackgroundVectors } from './components/BackgroundVectors';
import { SystemDiagrams } from './components/SystemDiagrams';
import { motion, AnimatePresence } from 'motion/react';
import data from '../data/portfolioData.json';

type ProfileLink = {
  label: string;
  href: string;
};

const isSafeHref = (href: string) => {
  if (href.startsWith('/') || href.startsWith('#')) return true;
  try {
    const parsed = new URL(href);
    return ['http:', 'https:', 'mailto:'].includes(parsed.protocol);
  } catch {
    return false;
  }
};

const getSafeHref = (href: string) => (isSafeHref(href) ? href : '#');

export default function App() {
  const [activeSection, setActiveSection] = useState('hero');

  // Photo/video carousel state
  const [photoIndex, setPhotoIndex] = useState(0);
  const photos = [
    { src: '/assets/photo.png', type: 'image', caption: 'Fig. 1. The author, somewhere in Hyderabad.' },
    { src: '/assets/shooting.jpg', type: 'image', caption: 'Fig. 1a. The author, trying to hit the bug in his code.' },
    { src: '/assets/dualwield.mp4', type: 'video', caption: 'Fig. 1b. The author, dual-wielding phones like swords to capture race conditions.' },
    { src: '/assets/spiderman.mp4', type: 'video', caption: 'Fig. 1c. The author, part-time spiderman.' }
  ];

  // Typewriter effect (dynamic terminal typing & deleting loop)
  const [typedText, setTypedText] = useState('');
  const keywords = [
    "ML Robustness & AI Safety",
    "Kernel-adjacent Development",
    "eBPF Systems & Tooling",
    "CTF Challenge Authoring",
    "Open Source Architectures"
  ];

  // Background animation toggle
  const [bgPaused, setBgPaused] = useState(false);

  // Expanded diagram state
  const [expandedDiagram, setExpandedDiagram] = useState<string | null>(null);



  // Hover diagram states
  const [hoveredSystem, setHoveredSystem] = useState<string | null>(null);
  const [hoverPos, setHoverPos] = useState({ x: 0, y: 0 });

  // Set up typewriter interval (looping)
  useEffect(() => {
    let isDeleting = false;
    let loopNum = 0;
    let txt = '';
    let delta = 80;
    let timer: NodeJS.Timeout;

    const tick = () => {
      const i = loopNum % keywords.length;
      const fullTxt = keywords[i];

      if (isDeleting) {
        txt = fullTxt.substring(0, txt.length - 1);
        delta = 35; // Backspace faster
      } else {
        txt = fullTxt.substring(0, txt.length + 1);
        delta = 70; // Type slower
      }

      setTypedText(txt);

      if (!isDeleting && txt === fullTxt) {
        delta = 1800; // Pause at the end of word
        isDeleting = true;
      } else if (isDeleting && txt === '') {
        isDeleting = false;
        loopNum++;
        delta = 400; // Pause before typing next word
      }

      timer = setTimeout(tick, delta);
    };

    timer = setTimeout(tick, 100);
    return () => clearTimeout(timer);
  }, []);

  // Intersection Observer for scroll spies & revealing highlights
  useEffect(() => {
    const revealObserver = new IntersectionObserver((entries) => {
      entries.forEach((e) => {
        if (e.isIntersecting) {
          e.target.classList.add('in');
        }
      });
    }, { threshold: 0.12 });

    const spyObserver = new IntersectionObserver((entries) => {
      entries.forEach((e) => {
        if (e.isIntersecting) {
          setActiveSection(e.target.id);
        }
      });
    }, { threshold: 0.05 });

    const timer = setTimeout(() => {
      document.querySelectorAll('.reveal').forEach((el) => revealObserver.observe(el));
      document.querySelectorAll('[data-spy]').forEach((el) => spyObserver.observe(el));
    }, 150);

    return () => {
      revealObserver.disconnect();
      spyObserver.disconnect();
      clearTimeout(timer);
    };
  }, []);


  const scrollToSection = (id: string) => {
    const element = document.getElementById(id);
    if (element) {
      element.scrollIntoView({ behavior: 'smooth' });
    }
  };

  // Helper to render text with ==highlights== translated to <motion.span class="hl">
  const renderTextWithHighlights = (text: string) => {
    if (!text) return '';
    const parts = text.split(/(==.*?==)/g);
    return parts.map((part, idx) => {
      if (part.startsWith('==') && part.endsWith('==')) {
        return (
          <motion.span
            key={idx}
            className="hl"
            initial={{ backgroundSize: '0% 82%' }}
            whileInView={{ backgroundSize: '100% 82%' }}
            viewport={{ once: true, margin: '-20px' }}
            transition={{ duration: 0.8, ease: [0.2, 0.7, 0.3, 1], delay: 0.1 }}
          >
            {part.slice(2, -2)}
          </motion.span>
        );
      }
      return part;
    });
  };

  const navMeta = [
    { id: 'hero', num: '0', label: 'Abstract' },
    { id: 'about', num: '1', label: 'Introduction' },
    { id: 'research', num: '2', label: 'Research' },
    { id: 'projects', num: '3', label: 'Systems' },
    { id: 'stats', num: '4', label: 'Results' },
    { id: 'ctf', num: '5', label: 'Field Work' },
    { id: 'certs', num: 'A', label: 'Appendix' },
    { id: 'contact', num: 'R', label: 'References' },
  ];

  return (
    <div style={{
      backgroundColor: 'var(--bg-primary)',
      color: 'var(--text-primary)',
      fontFamily: 'var(--font-body)',
      minHeight: '100vh',
      position: 'relative',
      fontSize: '17px'
    }}>
      <BackgroundVectors paused={bgPaused} />

      {/* Background animation toggle button */}
      <motion.button
        onClick={() => setBgPaused(p => !p)}
        title={bgPaused ? 'Resume background animation' : 'Pause background animation'}
        initial={false}
        animate={{ scale: 1 }}
        whileHover={{ scale: 1.1 }}
        whileTap={{ scale: 0.92 }}
        style={{
          position: 'fixed',
          bottom: '24px',
          right: '24px',
          zIndex: 999,
          width: '42px',
          height: '42px',
          borderRadius: '50%',
          border: '1px solid oklch(1 0 0 / 0.15)',
          background: 'oklch(0.1 0.008 250 / 0.85)',
          backdropFilter: 'blur(12px)',
          cursor: 'pointer',
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
          color: bgPaused ? 'oklch(0.65 0.02 250)' : 'oklch(0.55 0.08 200)',
          fontSize: '15px',
          boxShadow: bgPaused
            ? '0 0 0 0 transparent'
            : '0 0 0 3px oklch(0.55 0.08 200 / 0.25), 0 4px 14px rgba(0,0,0,0.4)',
          transition: 'color 0.3s, box-shadow 0.3s',
        }}
      >
        {bgPaused ? '◼' : '◉'}
      </motion.button>

      {/* PREPRINT HEADER STRIP */}
      <div style={{
        position: 'fixed',
        top: 0,
        left: 0,
        right: 0,
        zIndex: 50,
        height: '38px',
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'space-between',
        padding: '0 22px',
        fontFamily: 'var(--font-mono)',
        fontSize: '11px',
        letterSpacing: '0.04em',
        color: 'oklch(0.5 0.015 250)',
        background: 'oklch(0.06 0.002 255 / 0.82)',
        backdropFilter: 'blur(8px)',
        borderBottom: '1px solid oklch(1 0 0 / 0.08)'
      }}>
        <span>preprint PVK&ndash;2026&ndash;0119 &middot; [cs.aNyTHiNg-THats-CuRiOus-EnOugh] &middot; Hyderabad, IN</span>
        <a href="https://pardhuvarma.tech/" target="_blank" style={{ color: 'oklch(0.5 0.015 250)', borderBottom: 'none' }}>
          pardhuvarma.tech
        </a>
      </div>


      <div className="toc" style={{
        position: 'fixed',
        left: '30px',
        top: '50%',
        transform: 'translateY(-50%)',
        zIndex: 40,
        display: 'flex',
        flexDirection: 'column',
        gap: '12px',
        fontFamily: 'var(--font-mono)',
        fontSize: '11px'
      }}>
        {/* Sliding bracket indicator */}
        <motion.div
          style={{
            position: 'absolute',
            left: '-16px', // Align just to the left of the item
            width: '10px',
            height: '24px', // Same height as TOC items
            pointerEvents: 'none',
            zIndex: 5,
          }}
          animate={{ y: Math.max(0, navMeta.findIndex(item => item.id === activeSection)) * 36 }} // 24px height + 12px gap
          transition={{ type: 'spring', stiffness: 100, damping: 15 }}
        >
          <svg viewBox="0 0 10 24" className="w-full h-full">
            <path
              d="M 8 3 L 3 3 L 3 21 L 8 21"
              fill="none"
              stroke="var(--accent-color)"
              strokeWidth="1.8"
              strokeLinecap="round"
              strokeLinejoin="round"
            />
          </svg>
        </motion.div>
        {navMeta.map((item) => (
          <a
            key={item.id}
            href={`#${item.id}`}
            onClick={(e) => {
              e.preventDefault();
              scrollToSection(item.id);
            }}
            style={{
              color: activeSection === item.id ? 'var(--accent-color)' : 'oklch(0.42 0.012 250)',
              borderBottom: 'none',
              display: 'flex',
              gap: '10px',
              alignItems: 'center',
              height: '24px',
              transition: 'color 0.2s ease'
            }}
          >
            <span style={{ width: '14px', textAlign: 'right' }}>{item.num}</span>
            <span>{item.label}</span>
          </a>
        ))}
      </div>

      <div style={{ maxWidth: '800px', margin: '0 auto', padding: '120px 30px 100px', position: 'relative', zIndex: 1 }}>

        {/* §0 TITLE + ABSTRACT */}
        <section id="hero" data-spy style={{ position: 'relative', textAlign: 'center', paddingBottom: '90px' }}>
          <motion.div className="mnote" whileHover={{ scale: 1.04, rotate: [-1, 1, -1, 0], y: -2 }} transition={{ duration: 0.3 }} style={{
            position: 'absolute',
            right: '-290px',
            top: '30px',
            width: '230px',
            fontFamily: "'Caveat', cursive",
            fontSize: '22px',
            color: 'oklch(0.78 0.12 85)',
            transform: 'rotate(-2.5deg)',
            textAlign: 'left'
          }}>
            v3 &mdash; still curious ~
          </motion.div>

          <motion.div className="mnote" whileHover={{ scale: 1.04, rotate: [-1, 1, -1, 0], y: -2 }} transition={{ duration: 0.3 }} style={{
            position: 'absolute',
            left: '-290px',
            top: '220px',
            width: '240px',
            fontFamily: "'Caveat', cursive",
            fontSize: '18px',
            lineHeight: '1.4',
            color: 'oklch(0.78 0.12 85)',
            transform: 'rotate(-2deg)',
            textAlign: 'right'
          }}>
            "The world is open source: everything can be read, understood, and improved!"
          </motion.div>

          <div style={{ fontFamily: 'var(--font-mono)', fontSize: '11px', letterSpacing: '0.18em', color: 'oklch(0.5 0.015 250)', marginBottom: '36px' }}>
            PREPRINT &middot; PERSONAL RESEARCH PROFILE
          </div>

          <h1 style={{
            fontSize: 'clamp(30px, 4.4vw, 44px)',
            fontWeight: 700,
            lineHeight: 1.25,
            margin: '0 auto',
            maxWidth: '680px',
            textWrap: 'balance',
            fontFamily: 'var(--font-heading)'
          }}>
            {data.profile.title}
          </h1>

          <div style={{ marginTop: '32px', fontSize: '19px' }}>
            {data.profile.name}
            <sup style={{ fontSize: '12px', color: 'var(--accent-color)' }}>1</sup>
          </div>

          <div style={{ marginTop: '10px', fontSize: '14px', fontStyle: 'italic', color: 'oklch(0.6 0.012 250)' }}>
            <sup style={{ fontSize: '10px' }}>1</sup>Malla Reddy University, Hyderabad, India &middot; {data.profile.email}
          </div>

          <div style={{ display: 'flex', justifyContent: 'center', gap: '26px', marginTop: '28px', fontFamily: 'var(--font-mono)', fontSize: '13px' }}>
            {data.profile.links.map((link: ProfileLink, i: number) => {
              const safeHref = getSafeHref(link.href);
              const isAnchor = safeHref.startsWith('#');
              return (
                <a
                  key={i}
                  href={safeHref}
                  target={isAnchor ? undefined : "_blank"}
                  rel="noopener noreferrer"
                  onClick={isAnchor ? (e) => { e.preventDefault(); scrollToSection(safeHref.slice(1)); } : undefined}
                  style={{ borderBottom: 'none' }}
                >
                  [ {link.label} ]
                </a>
              );
            })}
          </div>

          <div style={{ maxWidth: '640px', margin: '64px auto 0', textAlign: 'left' }}>
            <div style={{ textAlign: 'center', fontWeight: 700, fontSize: '16px', letterSpacing: '0.06em', marginBottom: '18px' }}>Abstract</div>
            <p style={{ fontSize: '16px', lineHeight: '1.85', color: 'oklch(0.75 0.01 250)', margin: 0, textAlign: 'justify', textWrap: 'pretty' }}>
              {data.profile.bio}
            </p>

            <div style={{ fontFamily: 'var(--font-mono)', fontSize: '12px', color: 'oklch(0.55 0.015 250)', marginTop: '24px', minHeight: '18px' }}>
              <span style={{ color: 'var(--accent-color)' }}>Keywords:</span> {typedText}
              <span style={{ display: 'inline-block', width: '7px', height: '12px', background: 'var(--accent-color)', marginLeft: '2px', animation: 'blink 1s step-start infinite', verticalAlign: 'baseline' }}></span>
            </div>
          </div>
        </section>

        {/* §1 INTRODUCTION */}
        <section id="about" data-spy data-reveal className="reveal" style={{ position: 'relative', padding: '50px 0', borderTop: '1px solid var(--border-color)' }}>
          <motion.div className="mnote" whileHover={{ scale: 1.04, rotate: [-1, 1, -1, 0], y: -2 }} transition={{ duration: 0.3 }} style={{
            position: 'absolute',
            right: '-290px',
            top: '210px',
            width: '240px',
            fontFamily: "'Caveat', cursive",
            fontSize: '16.5px',
            lineHeight: '1.4',
            color: 'oklch(0.78 0.12 85)',
            transform: 'rotate(-1.5deg)',
            textAlign: 'left'
          }}>
            "People say curiosity killed the cat. I like to think it just forgot to make a backup."
          </motion.div>

          <h2 style={{ fontSize: '25px', fontWeight: 700, margin: '0 0 28px', fontFamily: 'var(--font-heading)' }}>1&ensp;Introduction</h2>
          
          {data.about.paragraphs.map((p: string, i: number) => (
            <div key={i} style={{ marginBottom: '20px' }}>
              <p style={{ lineHeight: '1.85', color: 'oklch(0.75 0.01 250)', margin: 0, textAlign: 'justify', textWrap: 'pretty' }}>
                {renderTextWithHighlights(p)}
              </p>
            </div>
          ))}

          <figure style={{ margin: '36px auto 0', maxWidth: '300px', textAlign: 'center', position: 'relative' }}>
            <motion.div className="mnote" whileHover={{ scale: 1.04, rotate: [-1, 1, -1, 0], y: -2 }} transition={{ duration: 0.3 }} style={{
              position: 'absolute',
              left: '-120px',
              top: '10px',
              width: '100px',
              fontFamily: "'Caveat', cursive",
              fontSize: '20px',
              color: 'oklch(0.78 0.12 85)',
              transform: 'rotate(-8deg)',
              textAlign: 'right'
            }}>
              I use Arch, btw.
            </motion.div>
            <div 
              onClick={() => setPhotoIndex((prev) => (prev + 1) % photos.length)}
              style={{
                position: 'relative',
                width: '100%',
                aspectRatio: '4/5',
                cursor: 'pointer',
                userSelect: 'none'
              }}
            >
              {/* Layered background card for polaroid depth feel */}
              <div style={{
                position: 'absolute',
                inset: 0,
                background: 'oklch(0.12 0.005 250)',
                border: '1px solid oklch(1 0 0 / 0.08)',
                borderRadius: '2px',
                transform: 'rotate(2.5deg) translate(5px, 5px)',
                zIndex: 1,
                pointerEvents: 'none',
                boxShadow: '0 4px 12px rgba(0,0,0,0.22)'
              }} />

              {/* Main active image container */}
              <div style={{
                position: 'relative',
                width: '100%',
                height: '100%',
                zIndex: 2,
                overflow: 'hidden',
                borderRadius: '2px',
                border: '1px solid oklch(1 0 0 / 0.15)',
                background: 'oklch(0.1 0.004 250)',
                padding: '4px',
                boxShadow: '0 8px 24px rgba(0,0,0,0.3)'
              }}>
                <AnimatePresence mode="wait">
                  {photos[photoIndex].type === 'video' ? (
                    <motion.video
                      key={photoIndex}
                      src={photos[photoIndex].src}
                      autoPlay
                      loop
                      muted
                      playsInline
                      initial={{ opacity: 0, scale: 0.95 }}
                      animate={{ opacity: 1, scale: 1 }}
                      exit={{ opacity: 0, scale: 0.95 }}
                      transition={{ duration: 0.2, ease: 'easeInOut' }}
                      style={{ width: '100%', height: '100%', objectFit: 'cover', display: 'block' }}
                    />
                  ) : (
                    <motion.img
                      key={photoIndex}
                      src={photos[photoIndex].src}
                      alt="Pardhu Varma"
                      initial={{ opacity: 0, scale: 0.95 }}
                      animate={{ opacity: 1, scale: 1 }}
                      exit={{ opacity: 0, scale: 0.95 }}
                      transition={{ duration: 0.2, ease: 'easeInOut' }}
                      style={{ width: '100%', height: '100%', objectFit: 'cover', display: 'block' }}
                    />
                  )}
                </AnimatePresence>
                
                {/* Visual Swap Indicator Pill */}
                <div style={{
                  position: 'absolute',
                  bottom: '12px',
                  right: '12px',
                  background: 'oklch(0.06 0.002 255 / 0.72)',
                  color: 'oklch(0.9 0.01 250)',
                  fontSize: '9px',
                  fontFamily: 'var(--font-mono)',
                  padding: '3px 7px',
                  borderRadius: '12px',
                  backdropFilter: 'blur(4px)',
                  border: '1px solid oklch(1 0 0 / 0.1)',
                  zIndex: 10,
                  display: 'flex',
                  alignItems: 'center',
                  gap: '4px'
                }}>
                  <span>{photos[photoIndex].type === 'video' ? '🎬' : '📷'}</span>
                  <span>{photoIndex + 1} / {photos.length}</span>
                </div>
              </div>
            </div>
            <figcaption style={{ fontSize: '13.5px', fontStyle: 'italic', color: 'oklch(0.58 0.012 250)', marginTop: '16px' }}>
              {photos[photoIndex].caption}
            </figcaption>
          </figure>
        </section>

        {/* §2 RESEARCH */}
        <section id="research" data-spy data-reveal className="reveal" style={{ position: 'relative', padding: '50px 0', borderTop: '1px solid var(--border-color)' }}>

          <motion.div className="mnote" whileHover={{ scale: 1.04, rotate: [-1, 1, -1, 0], y: -2 }} transition={{ duration: 0.3 }} style={{
            position: 'absolute',
            left: '-290px',
            top: '220px',
            width: '230px',
            fontFamily: "'Caveat', cursive",
            fontSize: '20px',
            color: 'oklch(0.78 0.12 85)',
            transform: 'rotate(1deg)',
            textAlign: 'right'
          }}>
            loss is going down, but so is my sanity...
          </motion.div>

          <h2 style={{ fontSize: '25px', fontWeight: 700, margin: '0 0 28px', fontFamily: 'var(--font-heading)' }}>2&ensp;Related &amp; Ongoing Work</h2>

          {data.research.paragraphs.map((p: string, i: number) => (
            <div key={i} style={{ marginBottom: '20px' }}>
              <p style={{ lineHeight: '1.85', color: 'oklch(0.75 0.01 250)', margin: 0, textAlign: 'justify', textWrap: 'pretty' }}>
                {renderTextWithHighlights(p)}
              </p>
            </div>
          ))}
        </section>

        {/* §3 SYSTEMS (Table 1) */}
        <section id="projects" data-spy data-reveal className="reveal" style={{ position: 'relative', padding: '50px 0', borderTop: '1px solid var(--border-color)' }}>
          <motion.div className="mnote" whileHover={{ scale: 1.04, rotate: [-1, 1, -1, 0], y: -2 }} transition={{ duration: 0.3 }} style={{
            position: 'absolute',
            right: '-290px',
            top: '170px',
            width: '230px',
            fontFamily: "'Caveat', cursive",
            fontSize: '22px',
            color: 'oklch(0.78 0.12 85)',
            transform: 'rotate(2deg)'
          }}>
            built at 2am, works at 9am
          </motion.div>

          <motion.div className="mnote" whileHover={{ scale: 1.04, rotate: [-1, 1, -1, 0], y: -2 }} transition={{ duration: 0.3 }} style={{
            position: 'absolute',
            left: '-290px',
            top: '320px',
            width: '230px',
            fontFamily: "'Caveat', cursive",
            fontSize: '20px',
            color: 'oklch(0.78 0.12 85)',
            transform: 'rotate(-2deg)',
            textAlign: 'right'
          }}>
            it compiles, therefore it is.
          </motion.div>

          <div className="flex justify-between items-baseline mb-4">
            <h2 style={{ fontSize: '25px', fontWeight: 700, margin: 0, fontFamily: 'var(--font-heading)' }}>3&ensp;Systems &amp; Implementations</h2>
          </div>

          <div style={{ textAlign: 'center', fontSize: '13.5px', fontStyle: 'italic', color: 'oklch(0.58 0.012 250)', marginBottom: '14px' }}>
            Table 1. Selected systems and tools, 2024&ndash;2026. All entries open source [2].
          </div>

          <div style={{ borderTop: '2px solid oklch(0.88 0.008 250 / 0.6)', borderBottom: '2px solid oklch(0.88 0.008 250 / 0.6)' }}>
            <div style={{
              display: 'grid',
              gridTemplateColumns: '190px 80px 1fr 60px',
              gap: '20px',
              padding: '12px 6px',
              borderBottom: '1px solid oklch(1 0 0 / 0.2)',
              fontFamily: 'var(--font-mono)',
              fontSize: '11px',
              letterSpacing: '0.08em',
              color: 'oklch(0.55 0.015 250)'
            }}>
              <span>SYSTEM</span>
              <span>LANG</span>
              <span>PURPOSE</span>
              <span style={{ textAlign: 'right' }}>ACTION</span>
            </div>

            {data.systems.map((system: any, index: number) => (
              <div key={index} style={{ borderBottom: index < data.systems.length - 1 ? '1px solid oklch(1 0 0 / 0.1)' : 'none' }}>
                <div style={{
                  display: 'grid',
                  gridTemplateColumns: '190px 80px 1fr 60px',
                  gap: '20px',
                  padding: '15px 6px',
                  alignItems: 'baseline',
                  position: 'relative'
                }}>
                  <a
                    href={getSafeHref(system.repoUrl)}
                    target="_blank"
                    rel="noopener noreferrer"
                    onMouseEnter={() => {
                      if (system.diagram) {
                        setHoveredSystem(system.name);
                      }
                    }}
                    onMouseMove={(e) => {
                      const cardWidth = 280;
                      const cardHeight = 190;
                      let x = e.clientX + 20;
                      let y = e.clientY + 20;
                      if (x + cardWidth > window.innerWidth) {
                        x = e.clientX - cardWidth - 20;
                      }
                      if (y + cardHeight > window.innerHeight) {
                        y = e.clientY - cardHeight - 20;
                      }
                      setHoverPos({ x, y });
                    }}
                    onMouseLeave={() => {
                      setHoveredSystem(null);
                    }}
                    style={{
                      fontFamily: 'var(--font-mono)',
                      fontSize: '13.5px',
                      fontWeight: 600,
                      color: 'var(--accent-color)',
                      borderBottom: 'none'
                    }}
                  >
                    {system.name}
                  </a>
                  <span style={{ fontFamily: 'var(--font-mono)', fontSize: '12px', color: 'oklch(0.55 0.015 250)' }}>
                    {system.lang}
                  </span>
                  <span style={{ fontSize: '15px', lineHeight: '1.6', color: 'oklch(0.72 0.01 250)', textWrap: 'pretty' }}>
                    {system.description}
                  </span>
                  <div style={{ textAlign: 'right', display: 'flex', gap: '8px', justifyContent: 'flex-end', alignItems: 'center' }}>
                    {system.diagram && (
                      <button
                        onClick={() => setExpandedDiagram(expandedDiagram === system.name ? null : system.name)}
                        style={{
                          background: 'none',
                          border: 'none',
                          color: 'var(--accent-color)',
                          cursor: 'pointer',
                          fontSize: '12px',
                          padding: 0
                        }}
                      >
                        [{expandedDiagram === system.name ? 'Hide' : 'Diag'}]
                      </button>
                    )}
                  </div>
                </div>

                {expandedDiagram === system.name && system.diagram && (
                  <div style={{
                    backgroundColor: 'oklch(0.08 0.003 255)',
                    borderTop: '1px solid oklch(1 0 0 / 0.1)',
                    borderBottom: '1px solid oklch(1 0 0 / 0.1)',
                    padding: '2rem 1.5rem',
                    display: 'flex',
                    flexDirection: 'column',
                    alignItems: 'center',
                    justifyContent: 'center',
                    minHeight: '260px',
                    boxShadow: 'var(--neumorph-inset-shadow)',
                    transition: 'all 0.3s ease'
                  }}>
                    <div style={{ width: '100%', maxWidth: '680px' }}>
                      <SystemDiagrams name={system.name} />
                    </div>
                  </div>
                )}
              </div>
            ))}
          </div>
        </section>

        {/* §4 RESULTS */}
        <section id="stats" data-spy data-reveal className="reveal" style={{ position: 'relative', padding: '50px 0', borderTop: '1px solid var(--border-color)' }}>
          <motion.div className="mnote" whileHover={{ scale: 1.04, rotate: [-1, 1, -1, 0], y: -2 }} transition={{ duration: 0.3 }} style={{
            position: 'absolute',
            right: '-290px',
            top: '60px',
            width: '230px',
            fontFamily: "'Caveat', cursive",
            fontSize: '21px',
            color: 'oklch(0.78 0.12 85)',
            transform: 'rotate(2.5deg)'
          }}>
            git commit -m "one more tweak"
          </motion.div>

          <div className="flex justify-between items-baseline mb-4">
            <h2 style={{ fontSize: '25px', fontWeight: 700, margin: 0, fontFamily: 'var(--font-heading)' }}>4&ensp;Empirical Results</h2>
          </div>
          
          <p style={{ lineHeight: '1.85', color: 'oklch(0.75 0.01 250)', margin: '0 0 36px', textAlign: 'justify', textWrap: 'pretty' }}>
            As of July 2026, public artifacts on GitHub [2] measure as follows:
          </p>

          <div style={{ display: 'flex', flexWrap: 'wrap', gap: '0', justifyContent: 'space-between', maxWidth: '640px', margin: '0 auto' }}>
            {[{ value: 25, label: 'repositories' }, { value: 20, label: 'followers' }, { value: 27, label: 'following' }].map((s, idx) => (
              <div key={idx} style={{ textAlign: 'center', padding: '0 18px', flex: '1 1 120px' }}>
                <div style={{ fontFamily: 'var(--font-mono)', fontSize: '38px', fontWeight: 600, color: 'var(--accent-color)' }}>
                  {s.value}
                </div>
                <div style={{ fontSize: '13.5px', fontStyle: 'italic', color: 'oklch(0.58 0.012 250)', marginTop: '6px' }}>
                  {s.label}
                </div>
              </div>
            ))}
          </div>

          {/* GitHub Contribution Graph */}
          <div style={{ marginTop: '48px' }}>
            <div style={{ fontSize: '11px', fontFamily: 'var(--font-mono)', color: 'oklch(0.5 0.01 250)', letterSpacing: '0.08em', textTransform: 'uppercase', marginBottom: '16px' }}>
              Contribution Activity
            </div>
            <div style={{
              background: 'oklch(0.10 0.004 250)',
              border: '1px solid oklch(1 0 0 / 0.08)',
              borderRadius: '6px',
              padding: '20px 16px 16px',
              overflowX: 'auto'
            }}>
              <div className="bg-black p-4 rounded-xl">
  <img
    src="https://ghchart.rshah.org/ffffff/pardhuvarmax"
    alt="GitHub Contribution Graph"
    className="w-full"
  />
</div>
            </div>
            <div style={{ fontSize: '11.5px', fontStyle: 'italic', color: 'oklch(0.5 0.01 250)', marginTop: '10px', textAlign: 'center' }}>
              Fig. 4. GitHub contribution calendar — live, as rendered at page load.
            </div>
          </div>
        </section>

        {/* §5 FIELD WORK */}
        <section id="ctf" data-spy data-reveal className="reveal" style={{ position: 'relative', padding: '50px 0', borderTop: '1px solid var(--border-color)' }}>
          <motion.div className="mnote" whileHover={{ scale: 1.04, rotate: [-1, 1, -1, 0], y: -2 }} transition={{ duration: 0.3 }} style={{
            position: 'absolute',
            left: '-290px',
            top: '80px',
            width: '240px',
            fontFamily: "'Caveat', cursive",
            fontSize: '18px',
            color: 'oklch(0.78 0.12 85)',
            transform: 'rotate(-1.5deg)',
            textAlign: 'right'
          }}>
            *ragebaiting & running away from participants...
          </motion.div>


          <h2 style={{ fontSize: '25px', fontWeight: 700, margin: '0 0 28px', fontFamily: 'var(--font-heading)' }}>5&ensp;Field Deployments</h2>
          
          {data.ctfParagraphs.map((p: string, i: number) => (
            <div key={i} style={{ marginBottom: '20px' }}>
              <p style={{ lineHeight: '1.85', color: 'oklch(0.75 0.01 250)', margin: 0, textAlign: 'justify', textWrap: 'pretty' }}>
                {renderTextWithHighlights(p)}
              </p>
            </div>
          ))}
        </section>

        {/* APPENDIX */}
        <section id="certs" data-spy data-reveal className="reveal" style={{ position: 'relative', padding: '50px 0', borderTop: '1px solid var(--border-color)' }}>
          <motion.div className="mnote" whileHover={{ scale: 1.04, rotate: [-1, 1, -1, 0], y: -2 }} transition={{ duration: 0.3 }} style={{
            position: 'absolute',
            right: '-290px',
            top: '110px',
            width: '230px',
            fontFamily: "'Caveat', cursive",
            fontSize: '22px',
            color: 'oklch(0.78 0.12 85)',
            transform: 'rotate(2deg)'
          }}>
            sudo compile-my-life --fast
          </motion.div>

          <div className="flex justify-between items-baseline mb-4">
            <h2 style={{ fontSize: '25px', fontWeight: 700, margin: 0, fontFamily: 'var(--font-heading)' }}>Appendix A&ensp;Certifications</h2>
          </div>

          <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '6px 40px' }}>
            {data.certs.map((c: any, index: number) => (
              <div key={index} className="cert-item" style={{ display: 'flex', gap: '12px', alignItems: 'baseline', padding: '7px 0', position: 'relative' }}>
                <span style={{ fontFamily: 'var(--font-mono)', fontSize: '11px', color: 'oklch(0.55 0.015 250)', whiteSpace: 'nowrap' }}>
                  A.{c.n}
                </span>
                <span style={{ fontSize: '15px', lineHeight: '1.5', flex: 1 }}>
                  {c.name} <span style={{ fontStyle: 'italic', color: 'oklch(0.58 0.012 250)' }}>&mdash; {c.issuer}</span>
                </span>
              </div>
            ))}
          </div>

          <h2 style={{ fontSize: '25px', fontWeight: 700, margin: '48px 0 20px', fontFamily: 'var(--font-heading)' }}>Appendix B&ensp;Toolchain</h2>
          <p style={{ fontFamily: 'var(--font-mono)', fontSize: '13.5px', lineHeight: '2.1', color: 'oklch(0.65 0.012 250)', margin: 0 }}>
            {data.skillsLine.join(' \u00b7 ')}
          </p>
        </section>

        <section id="contact" data-spy data-reveal className="reveal" style={{ position: 'relative', padding: '50px 0 30px', borderTop: '1px solid var(--border-color)' }}>
          <motion.div className="mnote" whileHover={{ scale: 1.04, rotate: [-1, 1, -1, 0], y: -2 }} transition={{ duration: 0.3 }} style={{
            position: 'absolute',
            left: '-290px',
            top: '110px',
            width: '230px',
            fontFamily: "'Caveat', cursive",
            fontSize: '23px',
            color: 'oklch(0.78 0.12 85)',
            transform: 'rotate(-2deg)',
            textAlign: 'right'
          }}>
            say hi :)
          </motion.div>

          <motion.div className="mnote" whileHover={{ scale: 1.04, rotate: [-1, 1, -1, 0], y: -2 }} transition={{ duration: 0.3 }} style={{
            position: 'absolute',
            right: '-290px',
            top: '180px',
            width: '230px',
            fontFamily: "'Caveat', cursive",
            fontSize: '21px',
            color: 'oklch(0.78 0.12 85)',
            transform: 'rotate(1.5deg)',
            textAlign: 'left'
          }}>
            ...all for the love of the game.
          </motion.div>

          <div className="flex justify-between items-baseline mb-4">
            <h2 style={{ fontSize: '25px', fontWeight: 700, margin: 0, fontFamily: 'var(--font-heading)' }}>References</h2>
          </div>

          <div style={{ display: 'flex', flexDirection: 'column', gap: '14px', fontSize: '15.5px', lineHeight: '1.7' }}>
            {data.references.map((ref: any, index: number) => (
              <div key={index} style={{ display: 'grid', gridTemplateColumns: '34px 1fr', gap: '8px' }}>
                <span style={{ color: 'oklch(0.55 0.015 250)' }}>[{ref.id}]</span>
                <span>
                  {ref.text}
                  {ref.linkText && ref.href && (
                    <a href={getSafeHref(ref.href)} target="_blank" rel="noopener noreferrer">
                      {ref.linkText}
                    </a>
                  )}
                  {ref.suffix}
                </span>
              </div>
            ))}
          </div>


          <div style={{
            marginTop: '70px',
            paddingTop: '22px',
            borderTop: '1px solid oklch(1 0 0 / 0.08)',
            display: 'flex',
            justifyContent: 'space-between',
            fontFamily: 'var(--font-mono)',
            fontSize: '11.5px',
            color: 'oklch(0.45 0.012 250)',
            flexWrap: 'wrap',
            gap: '10px'
          }}>
            <span>&copy; 2026 Pardhu Sri Rushi Varma Konduru</span>
            <span>Received July 2026 &middot; curiosity ongoing</span>
          </div>
        </section>

      </div>

      {hoveredSystem && (
        <div
          style={{
            position: 'fixed',
            left: `${hoverPos.x}px`,
            top: `${hoverPos.y}px`,
            zIndex: 1000,
            width: '280px',
            height: '190px',
            backgroundColor: 'oklch(0.08 0.003 255 / 0.95)',
            border: '1px solid oklch(1 0 0 / 0.15)',
            borderRadius: '6px',
            boxShadow: '0 8px 30px rgba(0,0,0,0.5)',
            backdropFilter: 'blur(10px)',
            pointerEvents: 'none',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            transform: 'translate3d(0, 0, 0)',
            transition: 'opacity 0.15s ease'
          }}
        >
          <div style={{ width: '100%', height: '100%', padding: '10px' }}>
            <SystemDiagrams name={hoveredSystem} />
          </div>
        </div>
      )}
      <Analytics />
    </div>
  );
}
