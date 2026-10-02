"use client";

import {
  useEffect,
  useMemo,
  useRef,
  useState,
  type CSSProperties,
} from "react";
import {
  ArrowUpRight,
  Award,
  BriefcaseBusiness,
  Calendar,
  CalendarDays,
  Check,
  ChevronLeft,
  ChevronRight,
  ChevronUp,
  Code2,
  Copy,
  Download,
  ExternalLink,
  GitFork,
  GraduationCap,
  Layers,
  Mail,
  Menu,
  Moon,
  Pencil,
  Quote,
  Sparkles,
  Sun,
  Wrench,
  X,
  Zap,
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { Sheet, SheetTrigger } from "@/components/ui/sheet";
import { defaultPortfolio, type PortfolioData } from "@/lib/portfolio";
import {
  cleanPortfolio,
  findPortfolioIssue,
  isGitHubRepository,
  isLiveProject,
  parseBullets,
  preparePortfolio,
} from "@/lib/portfolio-content";
import { trackConversion } from "@/lib/analytics";
import { VERSION_HEADER } from "@/lib/portfolio-validation";
import { moveInlineFiles, uploadFile } from "@/lib/uploads";
import { ContactForm } from "@/components/contact-form";
import { Editor } from "@/components/portfolio-editor";
import {
  BookingDialog,
  QuickScanDialog,
  ResumeDialog,
} from "@/components/portfolio-dialogs";

const nav = [
  "About",
  "Experience",
  "Skills",
  "Projects",
  "Education",
  "Certifications",
  "Testimonials",
  "Contact",
];

function getCategoryIcon(cat: string) {
  const lower = cat.toLowerCase();
  if (lower.includes("lang") || lower.includes("code")) return <Code2 />;
  if (
    lower.includes("frame") ||
    lower.includes("librar") ||
    lower.includes("stack")
  )
    return <Layers />;
  if (
    lower.includes("tool") ||
    lower.includes("dev") ||
    lower.includes("cloud") ||
    lower.includes("infra")
  )
    return <Wrench />;
  if (
    lower.includes("style") ||
    lower.includes("work") ||
    lower.includes("soft") ||
    lower.includes("mind")
  )
    return <Sparkles />;
  return <Zap />;
}

export function Portfolio({ initialData }: { initialData?: PortfolioData }) {
  const [data, setData] = useState<PortfolioData>(
    initialData ?? defaultPortfolio,
  );
  // Server-rendered content is already current, so it doesn't need dimming.
  const [loading, setLoading] = useState(!initialData);
  const [dark, setDark] = useState(true);
  const [menu, setMenu] = useState(false);
  const [activeSection, setActiveSection] = useState("about");
  const [saving, setSaving] = useState(false);
  const [saved, setSaved] = useState(false);
  const [canEdit, setCanEdit] = useState(false);
  const [saveError, setSaveError] = useState("");
  const [conflict, setConflict] = useState(false);
  // Version of the published record this page loaded; sent back on save.
  const version = useRef<string | null>(null);
  const [editorNotice, setEditorNotice] = useState("");
  const [copied, setCopied] = useState(false);
  const [scrollProgress, setScrollProgress] = useState(0);
  const [showTopBtn, setShowTopBtn] = useState(false);
  const [selectedTag, setSelectedTag] = useState("All");
  const csrfToken = useRef("");
  const [loadError, setLoadError] = useState("");
  const [hasContent, setHasContent] = useState(true);
  const lastLoaded = useRef("");
  const dataRef = useRef(data);
  const serverRendered = useRef(Boolean(initialData));
  const [savedSnapshot, setSavedSnapshot] = useState("");
  const dirty =
    canEdit && savedSnapshot !== "" && JSON.stringify(data) !== savedSnapshot;

  useEffect(() => {
    dataRef.current = data;
  }, [data]);

  // Warn before closing the tab with unpublished editor changes.
  useEffect(() => {
    if (!dirty) return;
    const warn = (event: BeforeUnloadEvent) => event.preventDefault();
    window.addEventListener("beforeunload", warn);
    return () => window.removeEventListener("beforeunload", warn);
  }, [dirty]);

  useEffect(() => {
    if (!canEdit) return;
    const context = document.modelContext;
    if (!context?.registerTool) return;
    const lifecycle = new AbortController();
    const profileFields = [
      "name",
      "role",
      "tagline",
      "bio",
      "location",
      "availability",
      "photoUrl",
      "github",
      "linkedin",
      "email",
    ] as const;
    void Promise.resolve(
      context.registerTool(
        {
          name: "update_portfolio_profile",
          title: "Update portfolio profile",
          description:
            "Update one or more hero/profile fields and publish them to the visible portfolio.",
          inputSchema: {
            type: "object",
            properties: Object.fromEntries(
              profileFields.map((key) => [key, { type: "string" }]),
            ),
            additionalProperties: false,
          },
          annotations: { readOnlyHint: false, untrustedContentHint: false },
          async execute(input: unknown) {
            if (!input || typeof input !== "object" || Array.isArray(input))
              throw new Error("Provide at least one valid profile field.");
            const update = Object.fromEntries(
              Object.entries(input).filter(
                ([key, value]) =>
                  profileFields.includes(
                    key as (typeof profileFields)[number],
                  ) && typeof value === "string",
              ),
            );
            if (!Object.keys(update).length)
              throw new Error("Provide at least one valid profile field.");
            const next = {
              ...dataRef.current,
              hero: { ...dataRef.current.hero, ...update },
            };
            const response = await fetch("/api/content", {
              method: "PUT",
              headers: {
                "Content-Type": "application/json",
                ...(csrfToken.current
                  ? { "x-portfolio-csrf": csrfToken.current }
                  : {}),
                ...(version.current !== null
                  ? { [VERSION_HEADER]: version.current }
                  : {}),
              },
              body: JSON.stringify(next),
            });
            if (response.status === 409)
              throw new Error(
                "The portfolio changed elsewhere. Reload the page, then try again.",
              );
            if (!response.ok)
              throw new Error("The profile could not be saved.");
            version.current = response.headers.get(VERSION_HEADER);
            lastLoaded.current = JSON.stringify(next);
            setSavedSnapshot(lastLoaded.current);
            dataRef.current = next;
            setData(next);
            return { updated: Object.keys(update), name: next.hero.name };
          },
        },
        { signal: lifecycle.signal },
      ),
    ).catch(() => undefined);
    return () => lifecycle.abort();
  }, [canEdit]);

  useEffect(() => {
    // The pre-paint script in the layout has already applied the theme class.
    const isDark = document.documentElement.classList.contains("dark");
    queueMicrotask(() => setDark(isDark));
    let active = true;
    let pending = false;
    let lastRefresh = 0;
    let countedView = false;
    const refresh = async () => {
      // Returning from the hosted editor refreshes the view without losing local drafts.
      // Throttled so ordinary tab switching doesn't refetch on every focus.
      if (
        pending ||
        Date.now() - lastRefresh < 30_000 ||
        (lastLoaded.current &&
          JSON.stringify(dataRef.current) !== lastLoaded.current)
      )
        return;
      pending = true;
      try {
        const [contentResponse, sessionResponse] = await Promise.all([
          fetch("/api/content", { cache: "no-store" }),
          fetch("/api/session", { cache: "no-store" }),
        ]);
        if (!contentResponse.ok || !sessionResponse.ok)
          throw new Error("Connection failed");
        const content = (await contentResponse.json()) as PortfolioData;
        const loadedVersion = contentResponse.headers.get(VERSION_HEADER);
        const session = (await sessionResponse.json()) as {
          canEdit: boolean;
          csrfToken?: string;
          editorNotice?: string;
        };
        if (!content?.hero?.name || !Array.isArray(content.projects))
          throw new Error("Invalid content");
        if (!active) return;
        // A user may have started editing while the request was in flight.
        if (
          lastLoaded.current &&
          JSON.stringify(dataRef.current) !== lastLoaded.current
        )
          return;
        const next = preparePortfolio(content);
        version.current = loadedVersion;
        lastLoaded.current = JSON.stringify(next);
        setSavedSnapshot(lastLoaded.current);
        dataRef.current = next;
        setData(next);
        setCanEdit(session.canEdit);
        // One page view per load, once we know it isn't the owner editing.
        if (!countedView) {
          countedView = true;
          if (!session.canEdit) trackConversion("page_view");
        }
        csrfToken.current = session.csrfToken ?? "";
        setEditorNotice(session.editorNotice ?? "");
        setHasContent(true);
        setLoadError("");
        lastRefresh = Date.now();
      } catch {
        // A server-rendered page is already showing current content.
        if (active && !serverRendered.current)
          setLoadError(
            "Could not load the latest portfolio. Check your connection, then retry.",
          );
      } finally {
        pending = false;
        if (active) setLoading(false);
      }
    };
    void refresh();
    window.addEventListener("focus", refresh);
    return () => {
      active = false;
      window.removeEventListener("focus", refresh);
    };
  }, []);

  // Track scroll progress and Back-to-Top trigger
  useEffect(() => {
    const handleScroll = () => {
      const total = document.documentElement.scrollHeight - window.innerHeight;
      setScrollProgress(total > 0 ? (window.scrollY / total) * 100 : 0);
      setShowTopBtn(window.scrollY > 320);
    };
    window.addEventListener("scroll", handleScroll, { passive: true });
    handleScroll();
    return () => window.removeEventListener("scroll", handleScroll);
  }, []);

  // IntersectionObserver for staggered scroll reveals
  useEffect(() => {
    if (typeof IntersectionObserver === "undefined") return;
    const observer = new IntersectionObserver(
      (entries) => {
        entries.forEach((entry) => {
          if (entry.isIntersecting) {
            entry.target.classList.add("is-visible");
          }
        });
      },
      { threshold: 0.08, rootMargin: "0px 0px -40px 0px" },
    );
    const elements = document.querySelectorAll(".reveal-fade");
    elements.forEach((el) => observer.observe(el));
    return () => observer.disconnect();
  }, [data, selectedTag, hasContent]);

  // Close the mobile menu on Escape or a click outside the header.
  useEffect(() => {
    if (!menu) return;
    const onKey = (event: KeyboardEvent) => {
      if (event.key === "Escape") setMenu(false);
    };
    const onPointer = (event: PointerEvent) => {
      if (!(event.target as Element | null)?.closest?.(".topbar"))
        setMenu(false);
    };
    document.addEventListener("keydown", onKey);
    document.addEventListener("pointerdown", onPointer);
    return () => {
      document.removeEventListener("keydown", onKey);
      document.removeEventListener("pointerdown", onPointer);
    };
  }, [menu]);

  // Feed pointer position to the .spotlight-card hover glow.
  useEffect(() => {
    const onMove = (event: PointerEvent) => {
      const card = (event.target as Element | null)?.closest?.(
        ".spotlight-card",
      ) as HTMLElement | null;
      if (!card) return;
      const rect = card.getBoundingClientRect();
      card.style.setProperty("--mouse-x", `${event.clientX - rect.left}px`);
      card.style.setProperty("--mouse-y", `${event.clientY - rect.top}px`);
    };
    document.addEventListener("pointermove", onMove, { passive: true });
    return () => document.removeEventListener("pointermove", onMove);
  }, []);

  // Keep navigation in sync with scrolling, including the sections between links.
  useEffect(() => {
    let frame = 0;
    const update = () => {
      const current =
        nav
          .map((label) => label.toLowerCase())
          .filter(
            (id) =>
              (document.getElementById(id)?.getBoundingClientRect().top ??
                Infinity) <= 150,
          )
          .at(-1) ?? "about";
      setActiveSection(current);
      frame = 0;
    };
    const onScroll = () => {
      if (!frame) frame = requestAnimationFrame(update);
    };
    onScroll();
    window.addEventListener("scroll", onScroll, { passive: true });
    return () => {
      window.removeEventListener("scroll", onScroll);
      cancelAnimationFrame(frame);
    };
  }, []);

  useEffect(() => {
    if (!loading) document.title = `${data.hero.name} — ${data.hero.role}`;
  }, [data.hero.name, data.hero.role, loading]);

  const initials = useMemo(
    () =>
      data.hero.name
        .split(/\s+/)
        .filter(Boolean)
        .slice(0, 2)
        .map((n) => n[0])
        .join("")
        .toUpperCase(),
    [data.hero.name],
  );
  const toggleTheme = () => {
    const next = !dark;
    setDark(next);
    document.documentElement.classList.toggle("dark", next);
    localStorage.setItem("portfolio-theme", next ? "dark" : "light");
  };

  const copyEmail = async () => {
    try {
      const email = data.contact.email || data.hero.email;
      if (!email) return;
      await navigator.clipboard.writeText(email);
      setCopied(true);
      setTimeout(() => setCopied(false), 2200);
    } catch {
      // clipboard fallback
    }
  };

  const allTags = useMemo(() => {
    const tags = new Set<string>();
    data.projects.forEach((p) => p.stack.forEach((s) => tags.add(s)));
    return ["All", ...Array.from(tags)];
  }, [data.projects]);

  const filteredProjects = useMemo(() => {
    if (selectedTag === "All") return data.projects;
    return data.projects.filter((p) => p.stack.includes(selectedTag));
  }, [data.projects, selectedTag]);

  const isDataResume = Boolean(data.resumeUrl?.startsWith("data:"));

  const [quickScanOpen, setQuickScanOpen] = useState(false);
  const [resumeModalOpen, setResumeModalOpen] = useState(false);
  const [bookingModalOpen, setBookingModalOpen] = useState(false);
  const [activeTestimonial, setActiveTestimonial] = useState(0);

  const upload = (file: Blob) => uploadFile(file, csrfToken.current);

  /** `overwrite` skips the version check after the owner confirms a conflict. */
  const save = async (overwrite = false) => {
    setSaving(true);
    setSaved(false);
    setSaveError("");
    setConflict(false);
    try {
      // Refresh the local CSRF token without replacing the user's unsaved draft.
      const sessionResponse = await fetch("/api/session", {
        cache: "no-store",
      });
      if (!sessionResponse.ok)
        throw new Error("Cannot verify editor access. Please try again.");
      const session = (await sessionResponse.json()) as {
        canEdit: boolean;
        csrfToken?: string;
      };
      if (!session.canEdit)
        throw new Error(
          "Editing is locked. Check your owner connection; your draft has been kept.",
        );
      csrfToken.current = session.csrfToken ?? "";
      // Blank lines left while editing would otherwise fail server validation,
      // and files from older saves move out of the content record.
      const draft = await moveInlineFiles(cleanPortfolio(data), upload);
      const issue = findPortfolioIssue(draft);
      if (issue) throw new Error(issue);
      const response = await fetch("/api/content", {
        method: "PUT",
        headers: {
          "Content-Type": "application/json",
          ...(csrfToken.current
            ? { "x-portfolio-csrf": csrfToken.current }
            : {}),
          ...(!overwrite && version.current !== null
            ? { [VERSION_HEADER]: version.current }
            : {}),
        },
        body: JSON.stringify(draft),
      });
      let result: { ok?: boolean; error?: string; conflict?: boolean } = {};
      try {
        result = (await response.json()) as typeof result;
      } catch {
        // Handle non-JSON responses
      }
      if (response.status === 409 && result.conflict) {
        setConflict(true);
        throw new Error(
          "Someone saved a newer version after you opened the editor. Reload to see it, or overwrite it with your version.",
        );
      }
      if (!response.ok || !result.ok) {
        throw new Error(
          result.error ||
            (response.status === 413
              ? "File is too large. Please compress your resume PDF before saving."
              : `Save failed (${response.status}). Your draft has been kept.`),
        );
      }
      version.current = response.headers.get(VERSION_HEADER);
      lastLoaded.current = JSON.stringify(draft);
      setSavedSnapshot(lastLoaded.current);
      dataRef.current = draft;
      setData(draft);
      setSaved(true);
      setTimeout(() => setSaved(false), 1800);
    } catch (error) {
      setSaveError(
        error instanceof Error
          ? error.message
          : "Unable to save. Your draft has been kept.",
      );
    } finally {
      setSaving(false);
    }
  };

  if (!data?.hero?.name && loading)
    return (
      <main className="section" aria-busy={loading}>
        <output>{loadError || "Loading portfolio…"}</output>
        {loadError && (
          <Button onClick={() => window.location.reload()}>Retry</Button>
        )}
      </main>
    );

  return (
    <div className="site-shell">
      <div
        className="scroll-progress-bar"
        style={{ width: `${scrollProgress}%` }}
        aria-hidden="true"
      />
      <div className="ambient-container" aria-hidden="true">
        <div className="ambient-orb ambient-orb-1" />
        <div className="ambient-orb ambient-orb-2" />
      </div>

      <a className="skip-link" href="#main-content">
        Skip to content
      </a>

      <header className="topbar">
        <a className="wordmark" href="#about">
          <span>{initials || "YN"}</span>
          {data.hero.name}
        </a>
        <nav
          id="main-navigation"
          className={menu ? "nav-links open" : "nav-links"}
          aria-label="Main navigation"
        >
          {nav
            .filter((item) => {
              if (item === "Testimonials")
                return Boolean(data.testimonials?.length);
              if (item === "Education") return Boolean(data.education?.length);
              if (item === "Certifications")
                return Boolean(data.certifications?.length);
              return true;
            })
            .map((item) => (
              <a
                key={item}
                href={`#${item.toLowerCase()}`}
                aria-current={
                  activeSection === item.toLowerCase() ? "location" : undefined
                }
                onKeyDown={(event) => {
                  if (event.key === "Escape") setMenu(false);
                }}
                onClick={() => setMenu(false)}
              >
                {item}
              </a>
            ))}
          <button
            type="button"
            className="mobile-quickscan"
            onClick={() => {
              setMenu(false);
              setQuickScanOpen(true);
              trackConversion("open_quick_scan");
            }}
          >
            <Zap /> Recruiter quick scan
          </button>
        </nav>
        <div className="header-actions">
          <button
            type="button"
            className="recruiter-btn"
            onClick={() => {
              setQuickScanOpen(true);
              trackConversion("open_quick_scan");
            }}
            aria-label="Open recruiter quick scan"
          >
            <Zap /> Quick Scan
          </button>
          <button
            className="icon-button"
            onClick={toggleTheme}
            aria-label="Toggle dark mode"
          >
            {dark ? <Sun /> : <Moon />}
          </button>
          {canEdit && (
            <Sheet>
              <SheetTrigger
                render={
                  <button
                    className="edit-button"
                    aria-label="Edit site content"
                  />
                }
              >
                <Pencil /> Edit site
              </SheetTrigger>
              <Editor
                data={data}
                setData={setData}
                onSave={() => void save()}
                onOverwrite={() => void save(true)}
                upload={upload}
                conflict={conflict}
                saving={saving}
                saved={saved}
                dirty={dirty}
                error={saveError}
              />
            </Sheet>
          )}
          <button
            className="icon-button menu-button"
            onClick={() => setMenu(!menu)}
            aria-label="Toggle menu"
            aria-expanded={menu}
            aria-controls="main-navigation"
          >
            {menu ? <X /> : <Menu />}
          </button>
        </div>
      </header>

      <main
        id="main-content"
        tabIndex={-1}
        className={loading ? "loading-content" : ""}
      >
        {editorNotice && (
          <p className="editor-notice">
            <output>{editorNotice}</output>
          </p>
        )}
        {loadError && (
          <p role="alert">
            {loadError}{" "}
            <button onClick={() => window.location.reload()}>Retry</button>
          </p>
        )}

        <section className="hero" id="about">
          <button
            type="button"
            className="hero-kicker reveal"
            onClick={() => setBookingModalOpen(true)}
            aria-label="Open scheduling and availability details"
          >
            <span className="status-dot-wrapper">
              <span className="status-ping" />
              <span className="status-dot" />
            </span>
            <span>{data.hero.availability}</span>
            <span className="kicker-action">
              · Book a chat <ArrowUpRight style={{ width: 13, height: 13 }} />
            </span>
          </button>

          <div className="hero-profile reveal">
            <div
              className="portrait"
              aria-label={`Profile photo of ${data.hero.name}`}
            >
              {data.hero.photoUrl ? (
                // eslint-disable-next-line @next/next/no-img-element
                <img
                  src={data.hero.photoUrl}
                  alt={data.hero.name}
                  style={{ width: "100%", height: "100%", objectFit: "cover" }}
                />
              ) : (
                <span>{initials || "YN"}</span>
              )}
            </div>
            <div>
              <h1>{data.hero.name}</h1>
              <p className="hero-role">{data.hero.role}</p>
            </div>
          </div>

          <p className="hero-tagline reveal">{data.hero.tagline}</p>

          <div className="hero-stats reveal">
            <div className="stat-item">
              <span className="stat-value">{data.skills.length}</span>
              <span className="stat-label">Skill areas</span>
            </div>
            <div className="stat-item">
              <span className="stat-value">{data.projects.length}</span>
              <span className="stat-label">
                {data.projects.length === 1 ? "Project" : "Projects"}
              </span>
            </div>
            <div className="stat-item">
              <span className="stat-value">
                {data.certifications?.length ?? 0}
              </span>
              <span className="stat-label">
                {data.certifications?.length === 1
                  ? "Certification"
                  : "Certifications"}
              </span>
            </div>
          </div>

          <div className="hero-lower reveal">
            <div className="intro-copy">
              <p>{data.hero.bio}</p>
              <span>{data.hero.location}</span>
            </div>
            <div className="socials">
              <a
                href={data.hero.github}
                target="_blank"
                rel="noreferrer"
                aria-label="GitHub"
              >
                <GitFork />
                <span>GitHub</span>
              </a>
              <a
                href={data.hero.linkedin}
                target="_blank"
                rel="noreferrer"
                aria-label="LinkedIn"
              >
                <BriefcaseBusiness />
                <span>LinkedIn</span>
              </a>
              <a href={`mailto:${data.hero.email}`} aria-label="Email">
                <Mail />
                <span>Email</span>
              </a>
              <button
                type="button"
                className={`copy-email-btn ${copied ? "copied" : ""}`}
                onClick={copyEmail}
                aria-label="Copy email address"
              >
                {copied ? <Check /> : <Copy />}
                <span>{copied ? "Copied!" : "Copy email"}</span>
              </button>
            </div>
          </div>

          <div className="hero-actions">
            <a
              className="primary-link"
              href="#projects"
              onClick={() => trackConversion("view_projects")}
            >
              View projects <ArrowUpRight />
            </a>
            <a
              className="secondary-link"
              href={data.resumeUrl || "#"}
              target={isDataResume ? undefined : "_blank"}
              rel="noreferrer"
              download={isDataResume ? "resume.pdf" : undefined}
              onClick={() => trackConversion("download_resume")}
            >
              Download Resume <Download />
            </a>
          </div>
        </section>

        <section className="section" id="experience">
          <div className="section-heading">
            <h2>
              <BriefcaseBusiness /> Experience
            </h2>
          </div>
          <p className="section-subtitle">
            Enterprise modernisation work focused on maintainability,
            continuity, and safer delivery.
          </p>
          <div className="timeline">
            {data.experience.map((item, i) => (
              <article
                className="role reveal-fade"
                key={`${item.company}-${i}`}
              >
                <div className="role-header-box">
                  <span className="role-dates">
                    <Calendar /> {item.dates}
                  </span>
                  <h3>{item.title}</h3>
                  <h4>{item.company}</h4>
                </div>
                <ul>
                  {item.bullets.filter(Boolean).map((bullet, x) => (
                    <li key={x}>{bullet}</li>
                  ))}
                </ul>
              </article>
            ))}
          </div>
        </section>

        <section className="section skills-section" id="skills">
          <div className="section-heading">
            <h2>
              <Sparkles /> Skills & Technologies
            </h2>
          </div>
          <p className="section-subtitle">
            Technologies and working practices used across Salesforce, .NET,
            integrations, and enterprise delivery.
          </p>
          <div className="skill-grid">
            {data.skills.map((group, i) => (
              <article
                className="skill-card reveal-fade"
                key={`${group.category}-${i}`}
              >
                <div className="skill-card-head">
                  <div className="skill-card-icon" aria-hidden="true">
                    {getCategoryIcon(group.category)}
                  </div>
                  <h3>{group.category}</h3>
                </div>
                <div className="skill-pills">
                  {group.items.map((item) => (
                    <span className="skill-pill" key={item}>
                      {item}
                    </span>
                  ))}
                </div>
              </article>
            ))}
          </div>
          {data.learning.length > 0 && (
            <aside
              className="skills-learning reveal-fade"
              aria-labelledby="learning-heading"
            >
              <div className="learning-title-box">
                <span className="learning-beacon" aria-hidden="true" />
                <div>
                  <h3 id="learning-heading">Currently exploring</h3>
                  <p>In progress—not listed as established expertise.</p>
                </div>
              </div>
              <div className="learning-list">
                {data.learning.map((item) => (
                  <span key={item}>{item}</span>
                ))}
              </div>
            </aside>
          )}
        </section>

        <section className="section" id="projects">
          <div className="section-heading">
            <h2>
              <Code2 /> Projects
            </h2>
          </div>
          <p className="section-subtitle">
            Selected Salesforce builds with implementation details, integration
            choices, and working demos where verification is available.
          </p>

          {data.projects.length >= 5 && allTags.length > 2 && (
            <div className="project-filter-bar">
              {allTags.map((tag) => (
                <button
                  key={tag}
                  type="button"
                  className={`filter-btn ${selectedTag === tag ? "active" : ""}`}
                  onClick={() => setSelectedTag(tag)}
                >
                  {tag}
                </button>
              ))}
            </div>
          )}

          <div className="project-grid">
            {filteredProjects.map((project, i) => (
              <article
                className="project-card spotlight-card reveal-fade"
                key={`${project.title}-${i}`}
                style={{ "--project-accent": project.accent } as CSSProperties}
              >
                {project.imageUrl && (
                  <div className="project-mockup">
                    <div className="project-mockup-bar">
                      <span className="mockup-dot" />
                      <span className="mockup-dot" />
                      <span className="mockup-dot" />
                    </div>
                    {/* eslint-disable-next-line @next/next/no-img-element */}
                    <img
                      src={project.imageUrl}
                      alt={`${project.title} screenshot`}
                    />
                  </div>
                )}
                <div className="project-header">
                  <div className="project-visual" aria-hidden="true">
                    <strong>{project.title.slice(0, 1)}</strong>
                  </div>
                  <h3>{project.title}</h3>
                </div>

                <div className="project-architecture">
                  <span className="project-architecture-label">
                    Implementation flow
                  </span>
                  <div>
                    {project.stack.slice(0, 3).map((technology, index) => (
                      <span key={technology}>
                        {index > 0 && <b aria-hidden="true">→</b>}
                        {technology}
                      </span>
                    ))}
                  </div>
                </div>

                {(() => {
                  const bullets = parseBullets(project.description);
                  if (
                    bullets.length > 1 ||
                    project.description.trim().startsWith("-") ||
                    project.description.trim().startsWith("•")
                  ) {
                    return (
                      <ul className="project-bullets">
                        {bullets.map((bullet, idx) => (
                          <li key={idx} className="project-bullet">
                            {bullet}
                          </li>
                        ))}
                      </ul>
                    );
                  }
                  return (
                    <p className="project-description">{project.description}</p>
                  );
                })()}

                <div className="stack">
                  {project.stack.map((tech) => (
                    <span key={tech}>{tech}</span>
                  ))}
                </div>

                {(isLiveProject(project.liveUrl) ||
                  isGitHubRepository(project.githubUrl)) && (
                  <div className="project-links">
                    {isLiveProject(project.liveUrl) && (
                      <a
                        href={project.liveUrl}
                        target="_blank"
                        rel="noreferrer"
                        aria-label={`${project.title} live site`}
                        onClick={() => trackConversion("open_project_demo")}
                      >
                        View live demo <ArrowUpRight />
                      </a>
                    )}
                    {isGitHubRepository(project.githubUrl) && (
                      <a
                        href={project.githubUrl}
                        target="_blank"
                        rel="noreferrer"
                        aria-label={`${project.title} GitHub`}
                        onClick={() => trackConversion("open_project_code")}
                      >
                        View source <GitFork />
                      </a>
                    )}
                  </div>
                )}
              </article>
            ))}
          </div>
        </section>

        {data.education && data.education.length > 0 && (
          <section className="section education-section" id="education">
            <div className="section-heading">
              <h2>
                <GraduationCap /> Education
              </h2>
            </div>
            <p className="section-subtitle">
              Academic qualifications, university degrees, and foundation in
              computer science.
            </p>

            <div className="education-grid">
              {data.education.map((edu, i) => (
                <article
                  className="education-card spotlight-card reveal-fade"
                  key={`${edu.institution}-${i}`}
                >
                  <div className="role-header-box">
                    <span className="role-dates">
                      <GraduationCap /> {edu.dates}
                    </span>
                    <h3>{edu.institution}</h3>
                    <p className="education-degree">{edu.degree}</p>
                  </div>
                  {edu.details && (
                    <p className="education-details">{edu.details}</p>
                  )}
                </article>
              ))}
            </div>
          </section>
        )}

        {data.certifications && data.certifications.length > 0 && (
          <section
            className="section certifications-section"
            id="certifications"
          >
            <div className="section-heading">
              <h2>
                <Award /> Certifications & Badges
              </h2>
            </div>
            <p className="section-subtitle">
              Industry-recognized credentials, certified expertise, and
              technical validations.
            </p>

            <div className="credentials-grid">
              {data.certifications.map((cert, i) => (
                <article
                  className="credential-card spotlight-card reveal-fade"
                  key={`${cert.name}-${i}`}
                >
                  <div className="credential-icon" aria-hidden="true">
                    <Award />
                  </div>
                  <div className="credential-content">
                    <h3>{cert.name}</h3>
                    <p className="credential-issuer">{cert.issuer}</p>
                    <span className="credential-date">{cert.date}</span>
                    {cert.credentialUrl && (
                      <div>
                        <a
                          className="credential-link"
                          href={cert.credentialUrl}
                          target="_blank"
                          rel="noreferrer"
                        >
                          Verify credential <ExternalLink />
                        </a>
                      </div>
                    )}
                  </div>
                </article>
              ))}
            </div>
          </section>
        )}

        {data.testimonials && data.testimonials.length > 0 && (
          <section className="section testimonials-section" id="testimonials">
            <div className="section-heading">
              <h2>
                <Quote /> Recommendations & Endorsements
              </h2>
            </div>
            <p className="section-subtitle">
              Perspectives and endorsements from engineering leaders, product
              partners, and colleagues.
            </p>

            <div className="testimonials-carousel">
              <div className="testimonial-slide-wrap">
                {(() => {
                  const currentTestimonial =
                    data.testimonials[
                      activeTestimonial % data.testimonials.length
                    ] || data.testimonials[0];
                  return (
                    <article
                      className="testimonial-card spotlight-card reveal-fade is-visible"
                      key={currentTestimonial.name}
                    >
                      <div
                        className="testimonial-quote-icon"
                        aria-hidden="true"
                      >
                        <Quote />
                      </div>
                      <p className="testimonial-quote">
                        “{currentTestimonial.quote}”
                      </p>

                      <div className="testimonial-footer">
                        <div className="testimonial-author-box">
                          <div className="testimonial-avatar">
                            {currentTestimonial.avatarUrl ? (
                              // eslint-disable-next-line @next/next/no-img-element
                              <img
                                src={currentTestimonial.avatarUrl}
                                alt={currentTestimonial.name}
                              />
                            ) : (
                              currentTestimonial.name
                                .split(/\s+/)
                                .map((n) => n[0])
                                .slice(0, 2)
                                .join("")
                            )}
                          </div>
                          <div className="testimonial-author-info">
                            <h4>{currentTestimonial.name}</h4>
                            <p>
                              {currentTestimonial.role} ·{" "}
                              {currentTestimonial.company}
                            </p>
                          </div>
                        </div>

                        {currentTestimonial.linkedInUrl && (
                          <a
                            href={currentTestimonial.linkedInUrl}
                            target="_blank"
                            rel="noreferrer"
                            className="testimonial-linkedin-btn"
                          >
                            LinkedIn profile <ExternalLink />
                          </a>
                        )}
                      </div>
                    </article>
                  );
                })()}
              </div>

              {data.testimonials.length > 1 && (
                <div className="testimonial-controls">
                  <div className="testimonial-dots">
                    {data.testimonials.map((_, idx) => (
                      <button
                        key={idx}
                        type="button"
                        className={`testimonial-dot ${activeTestimonial === idx ? "active" : ""}`}
                        onClick={() => setActiveTestimonial(idx)}
                        aria-label={`Go to recommendation ${idx + 1}`}
                      />
                    ))}
                  </div>
                  <div className="testimonial-nav-arrows">
                    <button
                      type="button"
                      className="testimonial-arrow-btn"
                      onClick={() =>
                        setActiveTestimonial(
                          (prev) =>
                            (prev - 1 + (data.testimonials?.length || 1)) %
                            (data.testimonials?.length || 1),
                        )
                      }
                      aria-label="Previous recommendation"
                    >
                      <ChevronLeft style={{ width: 18, height: 18 }} />
                    </button>
                    <button
                      type="button"
                      className="testimonial-arrow-btn"
                      onClick={() =>
                        setActiveTestimonial(
                          (prev) =>
                            (prev + 1) % (data.testimonials?.length || 1),
                        )
                      }
                      aria-label="Next recommendation"
                    >
                      <ChevronRight style={{ width: 18, height: 18 }} />
                    </button>
                  </div>
                </div>
              )}
            </div>
          </section>
        )}

        <section className="contact section reveal-fade" id="contact">
          <div className="contact-intro">
            <h2>{data.contact.heading}</h2>
            <p>{data.contact.note}</p>
            <div className="contact-actions">
              <button
                type="button"
                className="secondary-link"
                onClick={() => setBookingModalOpen(true)}
                aria-label="Schedule a 15-minute intro chat"
              >
                Book a call <CalendarDays />
              </button>
              <a
                className="secondary-link"
                href={`mailto:${data.contact.email || data.hero.email}`}
              >
                Email directly <Mail />
              </a>
              <button
                type="button"
                className={`secondary-link ${copied ? "copied" : ""}`}
                onClick={copyEmail}
              >
                {copied ? <Check /> : <Copy />}{" "}
                {copied ? "Email copied!" : "Copy email"}
              </button>
              <a
                className="secondary-link"
                href={data.resumeUrl || "#"}
                target={isDataResume ? undefined : "_blank"}
                rel="noreferrer"
                download={isDataResume ? "resume.pdf" : undefined}
              >
                View Resume <Download />
              </a>
            </div>
          </div>
          <ContactForm recipient={data.contact.email || data.hero.email} />
        </section>
      </main>

      <QuickScanDialog
        data={data}
        open={quickScanOpen}
        onOpenChange={setQuickScanOpen}
        initials={initials}
        onPreviewResume={() => {
          setQuickScanOpen(false);
          setResumeModalOpen(true);
        }}
      />
      <ResumeDialog
        data={data}
        open={resumeModalOpen}
        onOpenChange={setResumeModalOpen}
      />
      <BookingDialog
        data={data}
        open={bookingModalOpen}
        onOpenChange={setBookingModalOpen}
      />

      <button
        type="button"
        className={`floating-top-btn ${showTopBtn ? "visible" : ""}`}
        onClick={() => window.scrollTo({ top: 0, behavior: "smooth" })}
        aria-label="Scroll to top"
      >
        <ChevronUp />
      </button>

      <footer>
        <span>
          © {new Date().getFullYear()} {data.hero.name}. All rights reserved.
        </span>
        <a href="#about">Back to top ↑</a>
      </footer>
    </div>
  );
}
