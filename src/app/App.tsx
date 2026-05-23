import { useEffect, useState } from 'react';
import { Analytics } from "@vercel/analytics/react"
import { BackgroundVectors } from './components/BackgroundVectors';
import { SystemDiagrams } from './components/SystemDiagrams';
import { AdminBar } from './components/AdminBar';
import { LoginModal } from './components/LoginModal';
import { EditModal } from './components/EditModal';
import initialData from '../data/portfolioData.json';
import FloatingPlayer from "./components/FloatingPlayer";

type ProfileLink = {
  label: string;
  href: string;
  download?: string;
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
const isLocalPdfPath = (href: string) => /^\/(?:[^/]+\/)*[^/]+\.pdf(?:[?#].*)?$/i.test(href);

export default function App() {
  const [activeSection, setActiveSection] = useState('');
  const [data, setData] = useState(() => {
    try {
      const saved = localStorage.getItem('portfolio_cms_data');
      if (saved) {
        const parsed = JSON.parse(saved);
        // If version mismatch, prioritize initialData from file
        if (parsed.version !== initialData.version) {
          console.log("Version mismatch, syncing with source JSON");
          return initialData;
        }
        return parsed;
      }
      return initialData;
    } catch (e) {
      console.error("Failed to load data from localStorage", e);
      return initialData;
    }
  });
  const [isAdmin, setIsAdmin] = useState(false);
  const [editMode, setEditMode] = useState(false);
  const [showLogin, setShowLogin] = useState(false);
  const [editingItem, setEditingItem] = useState<{ title: string; data: any; fields: any[]; path: string; index?: number } | null>(null);

  useEffect(() => {
    localStorage.setItem('portfolio_cms_data', JSON.stringify(data));
  }, [data]);

  useEffect(() => {
    const handleScroll = () => {
      const sections = ['about', 'research', 'publications', 'systems', 'notes', 'contact'];
      const scrollPosition = window.scrollY + 100;

      for (const section of sections) {
        const element = document.getElementById(section);
        if (element) {
          const { offsetTop, offsetHeight } = element;
          if (scrollPosition >= offsetTop && scrollPosition < offsetTop + offsetHeight) {
            setActiveSection(section);
            break;
          }
        }
      }
    };

    window.addEventListener('scroll', handleScroll);
    return () => window.removeEventListener('scroll', handleScroll);
  }, []);

  const scrollToSection = (id: string) => {
    const element = document.getElementById(id);
    if (element) {
      element.scrollIntoView({ behavior: 'smooth' });
    }
  };

  const handleUpdateText = (path: string, value: string) => {
    const keys = path.split('.');
    const newData = { ...data };
    let current: any = newData;
    for (let i = 0; i < keys.length - 1; i++) {
      current = current[keys[i]];
    }
    current[keys[keys.length - 1]] = value;
    setData(newData);
  };

  const handleUpdateItem = (updatedItem: any) => {
    if (!editingItem) return;
    const newData = { ...data };
    const { path, index } = editingItem;
    if (index !== undefined) {
      if (index === -1) {
        // Adding new item
        (newData as any)[path].push(updatedItem);
      } else {
        // Updating existing item
        (newData as any)[path][index] = updatedItem;
      }
    } else {
      (newData as any)[path] = updatedItem;
    }
    setData(newData);
    setEditingItem(null);
  };

  const handleDeleteItem = (path: string, index: number) => {
    if (!window.confirm("Are you sure you want to delete this item?")) return;
    const newData = { ...data };
    (newData as any)[path].splice(index, 1);
    setData(newData);
  };

  const handleResetData = () => {
    if (!window.confirm("Are you sure you want to reset all changes to default? This cannot be undone.")) return;
    localStorage.removeItem('portfolio_cms_data');
    setData(initialData);
  };

  const exportJSON = () => {
    const jsonString = `data:text/json;chatset=utf-8,${encodeURIComponent(JSON.stringify(data, null, 2))}`;
    const link = document.createElement("a");
    link.href = jsonString;
    link.download = "portfolioData.json";
    link.click();
  };

  const profileTitleStyle = {
    display: 'block',
    fontWeight: 400,
    fontStyle: 'italic',
    color: 'var(--text-primary)',
    letterSpacing: '0.01em',
    maxWidth: '40ch'
  };

  return (
    <div style={{
      backgroundColor: 'var(--bg-primary)',
      color: 'var(--text-primary)',
      fontFamily: 'var(--font-body)',
      minHeight: '100vh',
      position: 'relative',
      paddingBottom: isAdmin ? '80px' : '0'
    }}>
      <BackgroundVectors />

      <div style={{ position: 'relative', zIndex: 1 }}>
        {/* Navigation */}
        <nav className="sticky top-0 z-50" style={{
          backgroundColor: 'var(--bg-primary)',
          borderBottom: '1px solid var(--border-color)',
          backdropFilter: 'blur(8px)'
        }}>
          <div className="max-w-[1200px] mx-auto px-6 md:px-12 lg:px-20 py-6 flex justify-between items-center">
            <div style={{
              fontFamily: 'var(--font-heading)',
              letterSpacing: '-0.01em',
              fontWeight: 700
            }}>
              {data.profile.name}
            </div>
            <div className="hidden md:flex gap-8">
              {[
                { id: 'about', label: 'Research' },
                { id: 'publications', label: 'Publications' },
                { id: 'systems', label: 'Systems' },
                { id: 'notes', label: 'Notes' },
                { id: 'contact', label: 'Contact' }
              ].map(({ id, label }) => (
                <button
                  key={id}
                  onClick={() => scrollToSection(id)}
                  className="transition-all"
                  style={{
                    color: activeSection === id ? 'var(--accent-color)' : 'var(--text-primary)',
                    textDecoration: activeSection === id ? 'underline' : 'none',
                    textUnderlineOffset: '4px',
                    background: 'none',
                    border: 'none',
                    cursor: 'pointer',
                    padding: 0
                  }}
                >
                  {label}
                </button>
              ))}
            </div>
          </div>
        </nav>

        {/* Hero Section */}
        <section className="min-h-[75vh] flex items-center">
          <div className="max-w-[1200px] mx-auto px-6 md:px-12 lg:px-20 py-20 w-full">
            <h1 style={{
              fontFamily: 'var(--font-heading)',
              fontSize: 'clamp(2.5rem, 5vw, 4rem)',
              fontWeight: 700,
              letterSpacing: '-0.02em',
              marginBottom: '1.5rem',
              lineHeight: 1.1
            }}>
              {editMode ? (
                <input
                  className="bg-transparent border-b border-dashed border-accent w-full outline-none"
                  value={data.profile.name}
                  onChange={(e) => handleUpdateText('profile.name', e.target.value)}
                />
              ) : data.profile.name}
            </h1>
            <div style={{
              fontSize: 'clamp(1.25rem, 2vw, 1.5rem)',
              color: 'var(--text-secondary)',
              marginBottom: '2rem',
              lineHeight: 1.4
            }}>
              {editMode ? (
                <>
                  <input className="bg-transparent border-b border-dashed border-accent w-full outline-none" value={data.profile.title} onChange={(e) => handleUpdateText('profile.title', e.target.value)} /><br />
                  <input className="bg-transparent border-b border-dashed border-accent w-full outline-none" value={data.profile.subtitle} onChange={(e) => handleUpdateText('profile.subtitle', e.target.value)} />
                </>
              ) : (
                <>
                  <span style={profileTitleStyle}>{data.profile.title}</span>
                  {data.profile.subtitle && <span style={{ display: 'block' }}>{data.profile.subtitle}</span>}
                </>
              )}
            </div>
            <div style={{
              fontSize: '1.125rem',
              color: 'var(--text-secondary)',
              maxWidth: '700px',
              lineHeight: 1.6,
              marginBottom: '3rem'
            }}>
              {editMode ? (
                <textarea
                  className="bg-transparent border border-dashed border-accent w-full outline-none p-2"
                  rows={3}
                  value={data.profile.bio}
                  onChange={(e) => handleUpdateText('profile.bio', e.target.value)}
                />
              ) : data.profile.bio}
            </div>
            <div style={{ height: '1px', backgroundColor: 'var(--border-color)', marginBottom: '2rem', maxWidth: '800px' }} />
            <div style={{
              fontFamily: 'var(--font-mono)',
              fontSize: '0.875rem',
              color: 'var(--text-muted)',
              display: 'flex',
              flexWrap: 'wrap',
              gap: '1.5rem'
            }}>
              <span>{data.profile.location}</span>
              <span>•</span>
              <span style={{ color: 'var(--text-muted)' }}>{data.profile.email}</span>
              {data.profile.links.map((link: ProfileLink, i: number) => (
                (() => {
                  const safeHref = getSafeHref(link.href);
                  const safeDownload = typeof link.download === 'string' && link.download.trim() !== '' && isLocalPdfPath(safeHref);
                  return (
                    <span key={i} style={{ display: 'contents' }}>
                      <span>•</span>
                      <a
                        href={safeHref}
                        target="_blank"
                        rel="noopener noreferrer"
                        download={safeDownload ? link.download : undefined}
                        style={{ color: 'var(--text-muted)', textDecoration: 'none' }}
                      >
                        {link.label}
                      </a>
                    </span>
                  );
                })()
              ))}
            </div>
          </div>
        </section>
        {/* About Section */}
        <section id="about" style={{ paddingTop: '120px', paddingBottom: '120px', borderTop: '1px solid var(--border-color)' }}>
          <div className="max-w-[1200px] mx-auto px-6 md:px-12 lg:px-20">
            <div style={{ fontFamily: 'var(--font-mono)', fontSize: '0.875rem', color: 'var(--accent-color)', marginBottom: '2rem', letterSpacing: '0.05em' }}>01 — ABOUT</div>
            <h2 style={{ fontFamily: 'var(--font-heading)', fontSize: '2rem', fontWeight: 700, marginBottom: '2.5rem' }}>{data.about.title}</h2>
            <div style={{ maxWidth: '700px' }}>
              {data.about.paragraphs.map((p: string, i: number) => (
                <div key={i} style={{ marginBottom: '1.5rem', position: 'relative' }}>
                  {editMode ? (
                    <textarea
                      className="bg-transparent border border-dashed border-accent w-full outline-none p-2 text-secondary"
                      rows={4}
                      value={p}
                      onChange={(e) => {
                        const newParagraphs = [...data.about.paragraphs];
                        newParagraphs[i] = e.target.value;
                        handleUpdateText('about.paragraphs', newParagraphs as any);
                      }}
                    />
                  ) : (
                    <p style={{ fontSize: '1.125rem', lineHeight: 1.6, color: 'var(--text-secondary)' }}>{p}</p>
                  )}
                </div>
              ))}
            </div>
          </div>
        </section>

        {/* Research Areas */}
        <section id="research" style={{ paddingTop: '120px', paddingBottom: '120px', borderTop: '1px solid var(--border-color)' }}>
          <div className="max-w-[1200px] mx-auto px-6 md:px-12 lg:px-20">
            <div className="flex justify-between items-center mb-8">
              <div style={{ fontFamily: 'var(--font-mono)', fontSize: '0.875rem', color: 'var(--accent-color)', letterSpacing: '0.05em' }}>02 — RESEARCH</div>
              {editMode && (
                <button
                  onClick={() => setEditingItem({
                    title: 'Research Area',
                    data: { title: '', subtitle: '', description: '', keywords: '' },
                    fields: [
                      { key: 'title', label: 'Title', type: 'text' },
                      { key: 'subtitle', label: 'Subtitle', type: 'text' },
                      { key: 'description', label: 'Description', type: 'textarea' },
                      { key: 'keywords', label: 'Keywords', type: 'text' }
                    ],
                    path: 'researchAreas',
                    index: -1
                  })}
                  className="bg-accent text-primary px-3 py-1 rounded text-xs font-mono"
                >+ ADD NEW</button>
              )}
            </div>
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
              {data.researchAreas.map((area: any, index: number) => (
                <div key={index}
                  style={{ backgroundColor: 'var(--bg-surface)', border: '1px solid var(--border-color)', padding: '1.5rem', borderRadius: '8px', position: 'relative' }}>
                  {editMode && (
                    <div className="absolute top-2 right-2 flex gap-2">
                      <button
                        onClick={() => setEditingItem({
                          title: 'Research Area',
                          data: area,
                          fields: [
                            { key: 'title', label: 'Title', type: 'text' },
                            { key: 'subtitle', label: 'Subtitle', type: 'text' },
                            { key: 'description', label: 'Description', type: 'textarea' },
                            { key: 'keywords', label: 'Keywords', type: 'text' }
                          ],
                          path: 'researchAreas',
                          index
                        })}
                        className="bg-accent text-primary px-2 py-1 rounded text-[10px] font-mono"
                      >EDIT</button>
                      <button
                        onClick={() => handleDeleteItem('researchAreas', index)}
                        className="bg-red-900/30 text-red-500 border border-red-500/30 px-2 py-1 rounded text-[10px] font-mono"
                      >DEL</button>
                    </div>
                  )}
                  <h3 style={{ fontFamily: 'var(--font-heading)', fontSize: '1.25rem', fontWeight: 700, marginBottom: '0.5rem' }}>{area.title}</h3>
                  <p style={{ fontSize: '0.875rem', color: 'var(--text-secondary)', marginBottom: '1rem' }}>{area.subtitle}</p>
                  <p style={{ fontSize: '0.9375rem', color: 'var(--text-secondary)', marginBottom: '1rem', lineHeight: 1.5 }}>{area.description}</p>
                  <p style={{ fontFamily: 'var(--font-mono)', fontSize: '0.75rem', color: 'var(--text-muted)' }}>{area.keywords}</p>
                </div>
              ))}
            </div>
          </div>
        </section>

        {/* Publications */}
        <section id="publications" style={{ paddingTop: '120px', paddingBottom: '120px', borderTop: '1px solid var(--border-color)' }}>
          <div className="max-w-[1200px] mx-auto px-6 md:px-12 lg:px-20">
            <div className="flex justify-between items-center mb-8">
              <div style={{ fontFamily: 'var(--font-mono)', fontSize: '0.875rem', color: 'var(--accent-color)', letterSpacing: '0.05em' }}>03 — PUBLICATIONS</div>
              {editMode && (
                <button
                  onClick={() => setEditingItem({
                    title: 'Publication',
                    data: { title: '', metadata: '', abstract: '', links: [{ label: 'DOI', href: '#' }] },
                    fields: [
                      { key: 'title', label: 'Title', type: 'text' },
                      { key: 'metadata', label: 'Metadata', type: 'text' },
                      { key: 'abstract', label: 'Abstract', type: 'textarea' }
                    ],
                    path: 'publications',
                    index: -1
                  })}
                  className="bg-accent text-primary px-3 py-1 rounded text-xs font-mono"
                >+ ADD NEW</button>
              )}
            </div>
            <div className="space-y-8">
              {data.publications.map((pub: any, index: number) => (
                <div key={index} style={{ paddingBottom: '2rem', position: 'relative' }}>
                  {editMode && (
                    <div className="absolute top-0 right-0 flex gap-2">
                      <button
                        onClick={() => setEditingItem({
                          title: 'Publication',
                          data: pub,
                          fields: [
                            { key: 'title', label: 'Title', type: 'text' },
                            { key: 'metadata', label: 'Metadata', type: 'text' },
                            { key: 'abstract', label: 'Abstract', type: 'textarea' }
                          ],
                          path: 'publications',
                          index
                        })}
                        className="bg-accent text-primary px-2 py-1 rounded text-[10px] font-mono"
                      >EDIT</button>
                      <button
                        onClick={() => handleDeleteItem('publications', index)}
                        className="bg-red-900/30 text-red-500 border border-red-500/30 px-2 py-1 rounded text-[10px] font-mono"
                      >DEL</button>
                    </div>
                  )}
                  <h3 style={{ fontFamily: 'var(--font-heading)', fontSize: '1.25rem', fontWeight: 700, marginBottom: '0.5rem', lineHeight: 1.3 }}>{pub.title}</h3>
                  <p style={{ fontFamily: 'var(--font-mono)', fontSize: '0.8125rem', color: 'var(--text-muted)', marginBottom: '0.75rem' }}>{pub.metadata}</p>
                  <p style={{ fontSize: '0.9375rem', color: 'var(--text-secondary)', lineHeight: 1.6, marginBottom: '0.75rem' }}>{pub.abstract}</p>
                  <div style={{ display: 'flex', gap: '1rem' }}>
                    {pub.links.map((link: any, i: number) => <a key={i} href={getSafeHref(link.href)} className="text-muted no-underline hover:text-accent hover:underline text-[15px]">{link.label}</a>)}
                  </div>
                </div>
              ))}
            </div>
          </div>
        </section>

        {/* Systems Section */}
        <section id="systems" style={{ paddingTop: '120px', paddingBottom: '120px', borderTop: '1px solid var(--border-color)' }}>
          <div className="max-w-[1200px] mx-auto px-6 md:px-12 lg:px-20">
            <div className="flex justify-between items-center mb-12">
              <div style={{ fontFamily: 'var(--font-mono)', fontSize: '0.875rem', color: 'var(--accent-color)', letterSpacing: '0.05em' }}>04 — SYSTEMS</div>
              {editMode && (
                <button
                  onClick={() => setEditingItem({
                    title: 'System',
                    data: { name: '', description: '', diagram: false, repoUrl: '' },
                    fields: [
                      { key: 'name', label: 'Name', type: 'text' },
                      { key: 'description', label: 'Description', type: 'textarea' },
                      { key: 'repoUrl', label: 'Repository URL', type: 'text' }
                    ],
                    path: 'systems',
                    index: -1
                  })}
                  className="bg-accent text-primary px-3 py-1 rounded text-xs font-mono"
                >+ ADD NEW</button>
              )}
            </div>
            <div className="space-y-16">
              {data.systems.map((system: any, index: number) => (
                <div key={index} className="grid grid-cols-1 lg:grid-cols-2 gap-8 relative">
                  {editMode && (
                    <div className="absolute top-0 right-0 flex gap-2 z-10">
                      <button
                        onClick={() => setEditingItem({
                          title: 'System',
                          data: system,
                          fields: [
                            { key: 'name', label: 'Name', type: 'text' },
                            { key: 'description', label: 'Description', type: 'textarea' },
                            { key: 'repoUrl', label: 'Repository URL', type: 'text' }
                          ],
                          path: 'systems',
                          index
                        })}
                        className="bg-accent text-primary px-2 py-1 rounded text-[10px] font-mono"
                      >EDIT</button>
                      <button
                        onClick={() => handleDeleteItem('systems', index)}
                        className="bg-red-900/30 text-red-500 border border-red-500/30 px-2 py-1 rounded text-[10px] font-mono"
                      >DEL</button>
                    </div>
                  )}
                  <div>
                    <h3 style={{ fontFamily: 'var(--font-heading)', fontSize: '1.5rem', fontWeight: 700, marginBottom: '1rem' }}>{system.name}</h3>
                    <p style={{ fontSize: '1rem', color: 'var(--text-secondary)', lineHeight: 1.6 }}>{system.description}</p>
                    {system.repoUrl && (
                      <a
                        href={getSafeHref(system.repoUrl)}
                        target="_blank"
                        rel="noopener noreferrer"
                        style={{ fontFamily: 'var(--font-mono)', fontSize: '0.875rem', color: 'var(--accent-color)' }}
                        className="no-underline hover:underline flex items-center gap-2"
                      >
                        VIEW REPOSITORY —&gt;
                      </a>
                    )}
                  </div>
                  {system.diagram && (
                    <div style={{ backgroundColor: 'var(--bg-surface)', border: '1px solid var(--border-color)', padding: '3rem', display: 'flex', alignItems: 'center', justifyContent: 'center', minHeight: '240px', borderRadius: '8px', boxShadow: 'var(--neumorph-inset-shadow)' }}>
                      <SystemDiagrams name={system.name} />
                    </div>
                  )}
                </div>
              ))}
            </div>
          </div>
        </section>

        {/* Notes Section */}
        <section id="notes" style={{ paddingTop: '120px', paddingBottom: '120px', borderTop: '1px solid var(--border-color)' }}>
          <div className="max-w-[1200px] mx-auto px-6 md:px-12 lg:px-20">
            <div className="flex justify-between items-center mb-8">
              <div style={{ fontFamily: 'var(--font-mono)', fontSize: '0.875rem', color: 'var(--accent-color)', letterSpacing: '0.05em' }}>05 — NOTES</div>
              {editMode && (
                <button
                  onClick={() => setEditingItem({
                    title: 'Note',
                    data: { title: '', description: '', date: new Date().toISOString().split('T')[0], href: '#' },
                    fields: [
                      { key: 'title', label: 'Title', type: 'text' },
                      { key: 'description', label: 'Description', type: 'textarea' },
                      { key: 'date', label: 'Date', type: 'text' }
                    ],
                    path: 'notes',
                    index: -1
                  })}
                  className="bg-accent text-primary px-3 py-1 rounded text-xs font-mono"
                >+ ADD NEW</button>
              )}
            </div>
            <div className="space-y-6">
              {data.notes.map((note: any, index: number) => (
                <div key={index} style={{ paddingBottom: '1rem', position: 'relative' }}>
                  {editMode && (
                    <div className="absolute top-0 right-0 flex gap-2">
                      <button
                        onClick={() => setEditingItem({
                          title: 'Note',
                          data: note,
                          fields: [
                            { key: 'title', label: 'Title', type: 'text' },
                            { key: 'description', label: 'Description', type: 'textarea' },
                            { key: 'date', label: 'Date', type: 'text' }
                          ],
                          path: 'notes',
                          index
                        })}
                        className="bg-accent text-primary px-2 py-1 rounded text-[10px] font-mono"
                      >EDIT</button>
                      <button
                        onClick={() => handleDeleteItem('notes', index)}
                        className="bg-red-900/30 text-red-500 border border-red-500/30 px-2 py-1 rounded text-[10px] font-mono"
                      >DEL</button>
                    </div>
                  )}
                  <h3 style={{ fontFamily: 'var(--font-heading)', fontSize: '1.125rem', fontWeight: 700, marginBottom: '0.25rem' }}>
                    <a href={getSafeHref(note.href)} style={{ color: 'white' }} className="no-underline hover:text-accent hover:underline">{note.title}</a>
                  </h3>
                  <p style={{ fontSize: '0.9375rem', color: 'var(--text-secondary)', marginBottom: '0.25rem' }}>{note.description}</p>
                  <p style={{ fontFamily: 'var(--font-mono)', fontSize: '0.8125rem', color: 'var(--text-muted)' }}>{note.date}</p>
                </div>
              ))}
            </div>
          </div>
        </section>

        {/* Contact Section */}
        <section id="contact" style={{ paddingTop: '120px', paddingBottom: '120px', borderTop: '1px solid var(--border-color)' }}>
          <div className="max-w-[1200px] mx-auto px-6 md:px-12 lg:px-20">
            <div style={{ fontFamily: 'var(--font-mono)', fontSize: '0.875rem', color: 'var(--accent-color)', marginBottom: '2rem', letterSpacing: '0.05em' }}>06 — CONTACT</div>
            <h2 style={{ fontFamily: 'var(--font-heading)', fontSize: '2rem', fontWeight: 700, marginBottom: '1.5rem' }}>Research Collaboration</h2>
            <div style={{ fontSize: '1.125rem', color: 'var(--text-secondary)', lineHeight: 1.6, marginBottom: '2rem', maxWidth: '700px' }}>
              {editMode ? (
                <textarea
                  className="bg-transparent border border-dashed border-accent w-full outline-none p-2"
                  rows={3}
                  value={data.contact.collaborationText}
                  onChange={(e) => handleUpdateText('contact.collaborationText', e.target.value)}
                />
              ) : data.contact.collaborationText}
            </div>
            <div style={{ display: 'flex', flexWrap: 'wrap', gap: '2rem', marginBottom: '3rem' }}>
              {data.contact.links.map((link: any, i: number) => <a key={i} href={getSafeHref(link.href)} style={{ color: 'var(--text-muted)' }} className="no-underline hover:text-accent hover:underline">{link.label}</a>)}
            </div>
            <div style={{ border: '1px solid var(--border-color)', padding: '2rem', borderRadius: '2px', maxWidth: '700px' }}>
              {editMode ? (
                <input className="bg-transparent border-b border-dashed border-accent w-full outline-none" value={data.contact.footerNote} onChange={(e) => handleUpdateText('contact.footerNote', e.target.value)} />
              ) : <p style={{ fontSize: '1rem', color: 'var(--text-secondary)', lineHeight: 1.6 }}>{data.contact.footerNote}</p>}
            </div>
          </div>
        </section>
        {/* Footer */}
        <footer style={{ borderTop: '1px solid var(--border-color)', paddingTop: '3rem', paddingBottom: '3rem' }}>
          <div className="max-w-[1200px] mx-auto px-6 md:px-12 lg:px-20 flex justify-between items-center">
            <div style={{ display: 'flex', gap: '1.5rem', fontSize: '0.875rem', color: 'var(--text-muted)' }}>
              <span>{data.profile.name}</span>
              <span>•</span>
              <span>2026</span>
              <span>•</span>
              <span>{data.profile.location}</span>
            </div>
            {!isAdmin && (
                <button
                  onClick={() => setShowLogin(true)}
                  style={{ background: 'none', border: 'none', color: 'var(--text-muted)', fontSize: '0.75rem', cursor: 'pointer', fontFamily: 'var(--font-mono)' }}
                >
                RESEARCHER LOGIN
                </button>
              )}
            </div>
        </footer>
      </div>

      {showLogin && <LoginModal onLogin={() => { setIsAdmin(true); setShowLogin(false); }} onCancel={() => setShowLogin(false)} />}
      {isAdmin && <AdminBar editMode={editMode} onToggleEdit={() => setEditMode(!editMode)} onSave={exportJSON} onReset={handleResetData} onLogout={() => { setIsAdmin(false); setEditMode(false); }} />}
      {editingItem && <EditModal title={editingItem.title} data={editingItem.data} fields={editingItem.fields} onSave={handleUpdateItem} onCancel={() => setEditingItem(null)} />}
      <Analytics />
      <FloatingPlayer />
    </div>
  );
}
