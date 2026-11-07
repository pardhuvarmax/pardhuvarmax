import { useEffect, type ReactNode } from 'react';
import { Link } from 'react-router-dom';
import { ArrowLeft } from 'lucide-react';
import { site } from '../lib/content';
import { About, Experience, Projects, Publications, Research } from './Home';
import { SectionHead } from './Reveal';

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
export const PublicationsPage = () => <Page title="Publications"><Publications /></Page>;
export const ProjectsPage = () => <Page title="Projects"><Projects /></Page>;
export const MePage = () => (
  <Page title="Me">
    <section className="wrap sec">
      <SectionHead kicker="Me" title={<>A bit about <em>me</em></>} />
    </section>
    <About />
    <Experience />
  </Page>
);
