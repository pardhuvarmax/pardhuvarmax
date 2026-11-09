import { useEffect, type ReactNode } from 'react';
import { Link } from 'react-router-dom';
import { ArrowLeft } from 'lucide-react';
import { site } from '../lib/content';
import { About, Experience, Publications, Research } from './Home';
import { SectionHead } from './Reveal';
import Cassette from './Cassette';
import { ProjectsExplorer } from './ProjectsView';
import { PublicationsExplorer } from './PublicationsView';

// Dedicated views for the nav buttons. They reuse the same sections as the home page.
function Page({ title, children }: { title: string; children: ReactNode }) {
  useEffect(() => {
    document.title = `${title} | ${site.name}`;
  }, [title]);
  return (
    <main className="subpage">
      {children}
      <div className="wrap">
        <Link className="link-arrow back-home" to="/">
          <ArrowLeft size={15} /> Back to home
        </Link>
      </div>
    </main>
  );
}

export const ResearchPage = () => <Page title="Research"><Research /></Page>;
export const PublicationsPage = () => (
  <Page title="Publications">
    <section id="publications" className="wrap sec">
      <SectionHead kicker="02 · Publications" title={<>Papers &amp; <em>preprints</em></>}>
        Search, filter, copy a citation, or grab every BibTeX entry at once.
      </SectionHead>
      <PublicationsExplorer />
    </section>
  </Page>
);
export const ProjectsPage = () => (
  <Page title="Projects">
    <section id="projects" className="wrap sec">
      <SectionHead kicker="04 · Projects" title={<>Open-source <em>systems</em></>}>
        Research code and systems software, built in the open. Search, filter and sort to find what you need.
      </SectionHead>
      <ProjectsExplorer />
    </section>
  </Page>
);
export const CassettePage = () => <Page title="Cassette"><Cassette /></Page>;
export const MePage = () => (
  <Page title="Me">
    <section className="wrap sec">
      <SectionHead kicker="Me" title={<>A bit about <em>me</em></>} />
    </section>
    <About />
    <Experience />
  </Page>
);
