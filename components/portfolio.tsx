'use client';

import { useEffect, useMemo, useRef, useState, type CSSProperties } from 'react';
import Image from 'next/image';
import { ArrowUpRight, BriefcaseBusiness, Check, Download, GitFork, Mail, Menu, Moon, Pencil, Plus, Save, Sun, Trash2, X } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Sheet, SheetContent, SheetDescription, SheetHeader, SheetTitle, SheetTrigger } from '@/components/ui/sheet';
import { defaultPortfolio, type PortfolioData } from '@/lib/portfolio';
import { ContactForm } from '@/components/contact-form';

const nav = ['About', 'Experience', 'Projects', 'Contact'];
const accents = ['#c7ff4a', '#70a5ff', '#ff8b6a', '#d6a7ff', '#6de2c5'];

function Field({ label, value, onChange, multiline = false }: { label: string; value: string; onChange: (value: string) => void; multiline?: boolean }) {
  return (
    <label className="editor-field">
      <span>{label}</span>
      {multiline ? <textarea value={value} onChange={(e) => onChange(e.target.value)} rows={4} /> : <input value={value} onChange={(e) => onChange(e.target.value)} />}
    </label>
  );
}

/** Preserve the raw text while focused; parsing must not eat a typed comma. */
function ListField({ label, items, onChange }: { label: string; items: string[]; onChange: (items: string[]) => void }) {
  const [draft, setDraft] = useState<string | null>(null);
  return <label className="editor-field">
    <span>{label}</span>
    <input
      value={draft ?? items.join(', ')}
      onFocus={(event) => setDraft(event.currentTarget.value)}
      onChange={(event) => {
        const text = event.currentTarget.value;
        setDraft(text);
        onChange([...new Set(text.split(',').map(item => item.trim()).filter(Boolean))]);
      }}
      onBlur={() => setDraft(null)}
    />
  </label>;
}

function Editor({ data, setData, onSave, saving, saved, error }: { data: PortfolioData; setData: (data: PortfolioData) => void; onSave: () => void; saving: boolean; saved: boolean; error: string }) {
  const hero = (key: keyof PortfolioData['hero'], value: string) => setData({ ...data, hero: { ...data.hero, [key]: value } });
  return (
    <SheetContent className="editor-panel" side="right">
      <SheetHeader className="editor-head"><SheetTitle>Portfolio editor</SheetTitle><SheetDescription>Every visible detail lives here. Changes are published when you save.</SheetDescription></SheetHeader>
      <div className="editor-body">
        <details open><summary>Hero & profile</summary><div className="editor-group">
          <Field label="Name" value={data.hero.name} onChange={(v) => hero('name', v)} />
          <Field label="Role" value={data.hero.role} onChange={(v) => hero('role', v)} />
          <Field label="Tagline" value={data.hero.tagline} onChange={(v) => hero('tagline', v)} multiline />
          <Field label="Bio" value={data.hero.bio} onChange={(v) => hero('bio', v)} multiline />
          <Field label="Location" value={data.hero.location} onChange={(v) => hero('location', v)} />
          <Field label="Availability" value={data.hero.availability} onChange={(v) => hero('availability', v)} />
          <Field label="Photo URL" value={data.hero.photoUrl} onChange={(v) => hero('photoUrl', v)} />
          <Field label="GitHub URL" value={data.hero.github} onChange={(v) => hero('github', v)} />
          <Field label="LinkedIn URL" value={data.hero.linkedin} onChange={(v) => hero('linkedin', v)} />
          <Field label="Email" value={data.hero.email} onChange={(v) => hero('email', v)} />
        </div></details>

        <details><summary>Experience</summary><div className="editor-group">
          {data.experience.map((item, i) => <div className="editor-card" key={i}>
            <button aria-label="Remove role" onClick={() => setData({ ...data, experience: data.experience.filter((_, x) => x !== i) })}><Trash2 /></button>
            <Field label="Company" value={item.company} onChange={(v) => { const a = [...data.experience]; a[i] = { ...item, company: v }; setData({ ...data, experience: a }); }} />
            <Field label="Title" value={item.title} onChange={(v) => { const a = [...data.experience]; a[i] = { ...item, title: v }; setData({ ...data, experience: a }); }} />
            <Field label="Dates" value={item.dates} onChange={(v) => { const a = [...data.experience]; a[i] = { ...item, dates: v }; setData({ ...data, experience: a }); }} />
            <Field label="Impact (one per line)" value={item.bullets.join('\n')} multiline onChange={(v) => { const a = [...data.experience]; a[i] = { ...item, bullets: v.split('\n') }; setData({ ...data, experience: a }); }} />
          </div>)}
          <button className="add-button" onClick={() => setData({ ...data, experience: [...data.experience, { company: 'Company', title: 'Role', dates: 'Year — Year', bullets: ['Describe your impact.'] }] })}><Plus /> Add role</button>
        </div></details>

        <details><summary>Skills</summary><div className="editor-group">
          {data.skills.map((group, i) => <div className="editor-card" key={i}>
            <button aria-label="Remove skill group" onClick={() => setData({ ...data, skills: data.skills.filter((_, x) => x !== i) })}><Trash2 /></button>
            <Field label="Category" value={group.category} onChange={(v) => { const a = [...data.skills]; a[i] = { ...group, category: v }; setData({ ...data, skills: a }); }} />
            <ListField label="Skills (comma separated)" items={group.items} onChange={(items) => { const a = [...data.skills]; a[i] = { ...group, items }; setData({ ...data, skills: a }); }} />
          </div>)}
          <button className="add-button" onClick={() => setData({ ...data, skills: [...data.skills, { category: 'Category', items: ['Skill'] }] })}><Plus /> Add group</button>
        </div></details>

        <details><summary>Projects</summary><div className="editor-group">
          {data.projects.map((project, i) => <div className="editor-card" key={i}>
            <button aria-label="Remove project" onClick={() => setData({ ...data, projects: data.projects.filter((_, x) => x !== i) })}><Trash2 /></button>
            <Field label="Title" value={project.title} onChange={(v) => { const a = [...data.projects]; a[i] = { ...project, title: v }; setData({ ...data, projects: a }); }} />
            <Field label="Description" value={project.description} multiline onChange={(v) => { const a = [...data.projects]; a[i] = { ...project, description: v }; setData({ ...data, projects: a }); }} />
            <ListField label="Tech stack (comma separated)" items={project.stack} onChange={(stack) => { const a = [...data.projects]; a[i] = { ...project, stack }; setData({ ...data, projects: a }); }} />
            <Field label="Live URL" value={project.liveUrl} onChange={(v) => { const a = [...data.projects]; a[i] = { ...project, liveUrl: v }; setData({ ...data, projects: a }); }} />
            <Field label="GitHub URL" value={project.githubUrl} onChange={(v) => { const a = [...data.projects]; a[i] = { ...project, githubUrl: v }; setData({ ...data, projects: a }); }} />
            <label className="color-field"><span>Accent</span><input type="color" value={project.accent} onChange={(e) => { const a = [...data.projects]; a[i] = { ...project, accent: e.target.value }; setData({ ...data, projects: a }); }} /></label>
          </div>)}
          <button className="add-button" onClick={() => setData({ ...data, projects: [...data.projects, { title: 'New project', description: 'What it does and why it matters.', stack: ['React'], liveUrl: 'https://example.com', githubUrl: 'https://github.com/', accent: accents[data.projects.length % accents.length] }] })}><Plus /> Add project</button>
        </div></details>

        <details><summary>Learning, resume & contact</summary><div className="editor-group">
          <ListField label="Currently learning (comma separated)" items={data.learning} onChange={(learning) => setData({ ...data, learning })} />
          <Field label="Resume URL" value={data.resumeUrl} onChange={(v) => setData({ ...data, resumeUrl: v })} />
          <Field label="Receive contact messages at" value={data.contact.email ?? ''} onChange={(email) => setData({ ...data, contact: { ...data.contact, email } })} />
          <Field label="Contact heading" value={data.contact.heading} onChange={(v) => setData({ ...data, contact: { ...data.contact, heading: v } })} />
          <Field label="Contact note" value={data.contact.note} multiline onChange={(v) => setData({ ...data, contact: { ...data.contact, note: v } })} />
        </div></details>
      </div>
      <div className="editor-save">{error && <p role="alert">{error}</p>}<Button onClick={onSave} disabled={saving}>{saved ? <Check /> : <Save />}{saving ? 'Saving…' : saved ? 'Saved' : 'Save & publish'}</Button></div>
    </SheetContent>
  );
}

export function Portfolio() {
  const [data, setData] = useState<PortfolioData>(defaultPortfolio);
  const [loading, setLoading] = useState(true);
  const [dark, setDark] = useState(true);
  const [menu, setMenu] = useState(false);
  const [activeSection, setActiveSection] = useState('about');
  const [saving, setSaving] = useState(false);
  const [saved, setSaved] = useState(false);
  const [canEdit, setCanEdit] = useState(false);
  const [saveError, setSaveError] = useState('');
  const [editorNotice, setEditorNotice] = useState('');
  const csrfToken = useRef('');
  const [loadError, setLoadError] = useState('');
  const [hasContent, setHasContent] = useState(false);
  const lastLoaded = useRef('');
  const dataRef = useRef(data);

  useEffect(() => { dataRef.current = data; }, [data]);

  useEffect(() => {
    if (!canEdit) return;
    const context = document.modelContext;
    if (!context?.registerTool) return;
    const lifecycle = new AbortController();
    const profileFields = ['name', 'role', 'tagline', 'bio', 'location', 'availability', 'photoUrl', 'github', 'linkedin', 'email'] as const;
    void Promise.resolve(context.registerTool({
      name: 'update_portfolio_profile',
      title: 'Update portfolio profile',
      description: 'Update one or more hero/profile fields and publish them to the visible portfolio.',
      inputSchema: {
        type: 'object',
        properties: Object.fromEntries(profileFields.map((key) => [key, { type: 'string' }])),
        additionalProperties: false,
      },
      annotations: { readOnlyHint: false, untrustedContentHint: false },
      async execute(input: unknown) {
        if (!input || typeof input !== 'object' || Array.isArray(input)) throw new Error('Provide at least one valid profile field.');
        const update = Object.fromEntries(Object.entries(input).filter(([key, value]) => profileFields.includes(key as typeof profileFields[number]) && typeof value === 'string'));
        if (!Object.keys(update).length) throw new Error('Provide at least one valid profile field.');
        const next = { ...dataRef.current, hero: { ...dataRef.current.hero, ...update } };
        const response = await fetch('/api/content', { method: 'PUT', headers: { 'Content-Type': 'application/json', ...(csrfToken.current ? { 'x-portfolio-csrf': csrfToken.current } : {}) }, body: JSON.stringify(next) });
        if (!response.ok) throw new Error('The profile could not be saved.');
        lastLoaded.current = JSON.stringify(next);
        dataRef.current = next; setData(next);
        return { updated: Object.keys(update), name: next.hero.name };
      },
    }, { signal: lifecycle.signal })).catch(() => undefined);
    return () => lifecycle.abort();
  }, [canEdit]);

  useEffect(() => {
    const theme = localStorage.getItem('portfolio-theme');
    const isDark = theme ? theme === 'dark' : true;
    queueMicrotask(() => setDark(isDark)); document.documentElement.classList.toggle('dark', isDark);
    let active = true;
    let pending = false;
    const refresh = async () => {
      // Returning from the hosted editor refreshes the view without losing local drafts.
      if (pending || (lastLoaded.current && JSON.stringify(dataRef.current) !== lastLoaded.current)) return;
      pending = true;
      try {
        const [contentResponse, sessionResponse] = await Promise.all([
          fetch('/api/content', { cache: 'no-store' }),
          fetch('/api/session', { cache: 'no-store' }),
        ]);
        if (!contentResponse.ok || !sessionResponse.ok) throw new Error('Connection failed');
        const content = await contentResponse.json() as PortfolioData;
        const session = await sessionResponse.json() as { canEdit: boolean; csrfToken?: string; editorNotice?: string };
        if (!content?.hero?.name || !Array.isArray(content.projects)) throw new Error('Invalid content');
        if (!active) return;
        // A user may have started editing while the request was in flight.
        if (lastLoaded.current && JSON.stringify(dataRef.current) !== lastLoaded.current) return;
        const next = { ...content, contact: { ...defaultPortfolio.contact, ...content.contact } };
        lastLoaded.current = JSON.stringify(next);
        dataRef.current = next;
        setData(next);
        setCanEdit(session.canEdit);
        csrfToken.current = session.csrfToken ?? '';
        setEditorNotice(session.editorNotice ?? '');
        setHasContent(true);
        setLoadError('');
      } catch {
        if (active) setLoadError('Could not load the latest portfolio. Check your connection, then retry.');
      } finally {
        pending = false;
        if (active) setLoading(false);
      }
    };
    void refresh();
    window.addEventListener('focus', refresh);
    return () => { active = false; window.removeEventListener('focus', refresh); };
  }, []);

  // Keep navigation in sync with scrolling, including the sections between links.
  useEffect(() => {
    let frame = 0;
    const update = () => {
      const current = nav.map(label => label.toLowerCase())
        .filter(id => (document.getElementById(id)?.getBoundingClientRect().top ?? Infinity) <= 150)
        .at(-1) ?? 'about';
      setActiveSection(current);
      frame = 0;
    };
    const onScroll = () => { if (!frame) frame = requestAnimationFrame(update); };
    onScroll();
    window.addEventListener('scroll', onScroll, { passive: true });
    return () => { window.removeEventListener('scroll', onScroll); cancelAnimationFrame(frame); };
  }, []);

  useEffect(() => { if (!loading) document.title = `${data.hero.name} — ${data.hero.role}`; }, [data.hero.name, data.hero.role, loading]);

  const initials = useMemo(() => data.hero.name.split(/\s+/).filter(Boolean).slice(0, 2).map(n => n[0]).join('').toUpperCase(), [data.hero.name]);
  const toggleTheme = () => { const next = !dark; setDark(next); document.documentElement.classList.toggle('dark', next); localStorage.setItem('portfolio-theme', next ? 'dark' : 'light'); };
  const save = async () => {
    setSaving(true); setSaved(false); setSaveError('');
    try {
      // Refresh the local CSRF token without replacing the user's unsaved draft.
      const sessionResponse = await fetch('/api/session', { cache: 'no-store' });
      if (!sessionResponse.ok) throw new Error('Cannot verify editor access. Please try again.');
      const session = await sessionResponse.json() as { canEdit: boolean; csrfToken?: string };
      if (!session.canEdit) throw new Error('Editing is locked. Check your owner connection; your draft has been kept.');
      csrfToken.current = session.csrfToken ?? '';
      const response = await fetch('/api/content', { method: 'PUT', headers: { 'Content-Type': 'application/json', ...(csrfToken.current ? { 'x-portfolio-csrf': csrfToken.current } : {}) }, body: JSON.stringify(data) });
      const result = await response.json() as { ok?: boolean; error?: string };
      if (!response.ok || !result.ok) throw new Error(result.error || 'Your changes could not be saved.');
      lastLoaded.current = JSON.stringify(data);
      setSaved(true); setTimeout(() => setSaved(false), 1800);
    } catch (error) {
      setSaveError(error instanceof Error ? error.message : 'Unable to save. Your draft has been kept.');
    } finally { setSaving(false); }
  };

  if (!hasContent) return <main className="section" aria-busy={loading}>
    <output>{loadError || 'Loading portfolio…'}</output>
    {loadError && <Button onClick={() => window.location.reload()}>Retry</Button>}
  </main>;

  return <div className="site-shell">
    <a className="skip-link" href="#main-content">Skip to content</a>
    <header className="topbar">
      <a className="wordmark" href="#about"><span>{initials || 'YN'}</span>{data.hero.name}</a>
      <nav id="main-navigation" className={menu ? 'nav-links open' : 'nav-links'} aria-label="Main navigation">{nav.map(item => <a key={item} href={`#${item.toLowerCase()}`} aria-current={activeSection === item.toLowerCase() ? 'location' : undefined} onKeyDown={(event) => { if (event.key === 'Escape') setMenu(false); }} onClick={() => setMenu(false)}>{item}</a>)}</nav>
      <div className="header-actions">
        <button className="icon-button" onClick={toggleTheme} aria-label="Toggle dark mode">{dark ? <Sun /> : <Moon />}</button>
        {canEdit && <Sheet><SheetTrigger render={<button className="edit-button" aria-label="Edit site content" />}><Pencil /> Edit site</SheetTrigger><Editor data={data} setData={setData} onSave={save} saving={saving} saved={saved} error={saveError} /></Sheet>}
        <button className="icon-button menu-button" onClick={() => setMenu(!menu)} aria-label="Toggle menu" aria-expanded={menu} aria-controls="main-navigation">{menu ? <X /> : <Menu />}</button>
      </div>
    </header>

    <main id="main-content" tabIndex={-1} className={loading ? 'loading-content' : ''}>
      {editorNotice && <p className="section"><output>{editorNotice}</output></p>}
      {loadError && <p role="alert">{loadError} <button onClick={() => window.location.reload()}>Retry</button></p>}
      <section className="hero" id="about">
        <div className="hero-kicker reveal"><span className="status-dot" /> {data.hero.availability}</div>
        <div className="hero-profile reveal">
          <div className="portrait" aria-label={`Profile photo of ${data.hero.name}`}>{data.hero.photoUrl ? <Image src={data.hero.photoUrl} alt={data.hero.name} fill sizes="80px" unoptimized priority /> : <span>{initials || 'YN'}</span>}</div>
          <div><h1>{data.hero.name}</h1><p className="hero-role">{data.hero.role}</p></div>
        </div>
        <p className="hero-tagline reveal">{data.hero.tagline}</p>
        <div className="hero-lower reveal">
          <div className="intro-copy"><p>{data.hero.bio}</p><span>{data.hero.location}</span></div>
          <div className="socials"><a href={data.hero.github} target="_blank" rel="noreferrer" aria-label="GitHub"><GitFork /><span>GitHub</span></a><a href={data.hero.linkedin} target="_blank" rel="noreferrer" aria-label="LinkedIn"><BriefcaseBusiness /><span>LinkedIn</span></a><a href={`mailto:${data.hero.email}`} aria-label="Email"><Mail /><span>Email</span></a></div>
        </div>
        <div className="hero-actions"><a className="primary-link" href="#projects">View projects <ArrowUpRight /></a><a className="secondary-link" href={data.resumeUrl} target="_blank" rel="noreferrer">View résumé <Download /></a></div>
      </section>

      <section className="section" id="experience"><div className="section-heading"><h2>Experience</h2></div><div className="timeline">
        {data.experience.map((item, i) => <article className="role" key={`${item.company}-${i}`}><div><span className="role-dates">{item.dates}</span><h3>{item.title}</h3><h4>{item.company}</h4></div><ul>{item.bullets.filter(Boolean).map((bullet, x) => <li key={x}>{bullet}</li>)}</ul></article>)}
      </div></section>

      <section className="section skills-section" id="skills"><div className="section-heading"><h2>Skills</h2></div><div className="skill-grid">
        {data.skills.map((group, i) => <article key={`${group.category}-${i}`}><h3>{group.category}</h3><div>{group.items.map(item => <em key={item}>{item}</em>)}</div></article>)}
      </div></section>

      <section className="section" id="projects"><div className="section-heading"><h2>Selected projects</h2></div><div className="project-grid">
        {data.projects.map((project, i) => <article className="project-card" key={`${project.title}-${i}`} style={{ '--project-accent': project.accent } as CSSProperties}>
          <div className="project-header"><div className="project-visual" aria-hidden="true"><strong>{project.title.slice(0, 1)}</strong></div><h3>{project.title}</h3></div>
          <p className="project-description">{project.description}</p>
          <div className="stack">{project.stack.map(tech => <span key={tech}>{tech}</span>)}</div>
          <div className="project-links">
            <a href={project.liveUrl} target="_blank" rel="noreferrer" aria-label={`${project.title} live site`}>Live project <ArrowUpRight /></a>
            <a href={project.githubUrl} target="_blank" rel="noreferrer" aria-label={`${project.title} GitHub`}>Code <GitFork /></a>
          </div>
        </article>)}
      </div></section>

      <section className="learning section" id="learning"><h2>Currently learning</h2><div className="learning-list">{data.learning.map(item => <span key={item}>{item}</span>)}</div></section>

      <section className="contact section" id="contact"><div className="contact-intro"><h2>{data.contact.heading}</h2><p>{data.contact.note}</p><div className="contact-actions"><a className="secondary-link" href={`mailto:${data.contact.email || data.hero.email}`}>Email directly <Mail /></a><a className="secondary-link" href={data.resumeUrl} target="_blank" rel="noreferrer">View résumé <Download /></a></div></div><ContactForm recipient={data.contact.email || data.hero.email} /></section>
    </main>
    <footer><span>© {new Date().getFullYear()} {data.hero.name}</span><a href="#about">Back to top ↑</a></footer>
  </div>;
}
