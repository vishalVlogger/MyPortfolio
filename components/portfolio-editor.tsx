"use client";

import { createContext, useContext, useEffect, useRef, useState } from "react";
import { ArrowDown, ArrowUp, Check, Plus, Save, Trash2, X } from "lucide-react";
import { Button } from "@/components/ui/button";
import {
  SheetContent,
  SheetDescription,
  SheetHeader,
  SheetTitle,
} from "@/components/ui/sheet";
import type { PortfolioData } from "@/lib/portfolio";
import {
  defaultMeetingNote,
  defaultResponseNote,
} from "@/lib/portfolio-content";
import { trackedEvents, type TrackedEvent } from "@/lib/events";
import { MAX_UPLOAD_BYTES, compressImage, type UploadFn } from "@/lib/uploads";

const accents = ["#c7ff4a", "#70a5ff", "#ff8b6a", "#d6a7ff", "#6de2c5"];

function Field({
  label,
  value,
  onChange,
  multiline = false,
}: {
  label: string;
  value: string;
  onChange: (value: string) => void;
  multiline?: boolean;
}) {
  return (
    <label className="editor-field">
      <span>{label}</span>
      {multiline ? (
        <textarea
          value={value}
          onChange={(e) => onChange(e.target.value)}
          rows={4}
        />
      ) : (
        <input value={value} onChange={(e) => onChange(e.target.value)} />
      )}
    </label>
  );
}

/** Preserve the raw text while focused; parsing must not eat a typed comma. */
function ListField({
  label,
  items,
  onChange,
}: {
  label: string;
  items: string[];
  onChange: (items: string[]) => void;
}) {
  const [draft, setDraft] = useState<string | null>(null);
  return (
    <label className="editor-field">
      <span>{label}</span>
      <input
        value={draft ?? items.join(", ")}
        onFocus={(event) => setDraft(event.currentTarget.value)}
        onChange={(event) => {
          const text = event.currentTarget.value;
          setDraft(text);
          onChange([
            ...new Set(
              text
                .split(",")
                .map((item) => item.trim())
                .filter(Boolean),
            ),
          ]);
        }}
        onBlur={() => setDraft(null)}
      />
    </label>
  );
}

const UploadContext = createContext<UploadFn | null>(null);

function describeFile(value: string, isImage: boolean) {
  if (value.startsWith("data:")) {
    const approxKb = Math.round((value.length * 3) / 4 / 1024);
    return `Inline ${isImage ? "image" : "document"} (~${approxKb} KB) · moved to file storage on save`;
  }
  if (value.startsWith("/files/"))
    return isImage ? "Uploaded image" : "Uploaded document";
  return value.length > 35 ? "…" + value.slice(-32) : value;
}

function FileUploadField({
  label,
  accept,
  value,
  onChange,
  preview = false,
  maxDim,
}: {
  label: string;
  accept: string;
  value: string;
  onChange: (url: string) => void;
  preview?: boolean;
  /** Longest image edge in pixels after compression. */
  maxDim?: number;
}) {
  const upload = useContext(UploadContext);
  const inputRef = useRef<HTMLInputElement>(null);
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState("");
  const [showUrlInput, setShowUrlInput] = useState(false);

  const isImage =
    preview ||
    value?.startsWith("data:image") ||
    /\.(png|jpe?g|gif|webp|svg)$/i.test(value ?? "");

  async function handleFile(file: File) {
    setBusy(true);
    setError("");
    try {
      if (!upload) throw new Error("Uploading is unavailable.");
      let blob: Blob = file;
      if (isImage || file.type.startsWith("image/")) {
        blob = await compressImage(file, maxDim);
      } else if (file.type !== "application/pdf") {
        throw new Error("Choose a PDF document.");
      } else if (file.size > MAX_UPLOAD_BYTES) {
        throw new Error(
          "PDF is larger than 1.9 MB. Compress it or link to a hosted copy.",
        );
      }
      onChange(await upload(blob));
    } catch (err) {
      setError(err instanceof Error ? err.message : "Failed to upload file.");
    } finally {
      setBusy(false);
    }
  }

  return (
    <div className="editor-field">
      <div
        style={{
          display: "flex",
          justifyContent: "space-between",
          alignItems: "center",
        }}
      >
        <span>{label}</span>
        <button
          type="button"
          className="upload-toggle"
          onClick={() => setShowUrlInput(!showUrlInput)}
        >
          {showUrlInput ? "Use file upload" : "Paste URL instead"}
        </button>
      </div>

      <input
        ref={inputRef}
        type="file"
        accept={accept}
        style={{ display: "none" }}
        onChange={(e) => {
          const f = e.target.files?.[0];
          if (f) void handleFile(f);
          e.target.value = "";
        }}
      />

      {showUrlInput ? (
        <input
          type="text"
          placeholder="https://... or /file.pdf"
          value={value}
          onChange={(e) => onChange(e.target.value)}
        />
      ) : (
        <>
          {preview && isImage && value && (
            <div className="upload-preview">
              {/* eslint-disable-next-line @next/next/no-img-element */}
              <img src={value} alt="Preview" />
            </div>
          )}
          <div className="upload-row">
            <button
              type="button"
              className="upload-btn"
              onClick={() => inputRef.current?.click()}
              disabled={busy}
            >
              {busy ? "Uploading…" : value ? "Replace file" : "Choose file"}
            </button>
            {value && (
              <span
                className="upload-filename"
                title={describeFile(value, isImage)}
              >
                {describeFile(value, isImage)}
              </span>
            )}
            {value && (
              <button
                type="button"
                className="upload-clear"
                onClick={() => {
                  onChange("");
                  setError("");
                }}
                aria-label="Remove file"
              >
                <X />
              </button>
            )}
          </div>
        </>
      )}

      {error && <p className="upload-error">{error}</p>}
    </div>
  );
}

function moveItem<T>(items: T[], from: number, to: number) {
  if (to < 0 || to >= items.length) return items;
  const next = [...items];
  const [item] = next.splice(from, 1);
  next.splice(to, 0, item);
  return next;
}

/** Move up / move down / remove controls shown on each editor card. */
function CardTools({
  label,
  index,
  count,
  onMove,
  onRemove,
}: {
  label: string;
  index: number;
  count: number;
  onMove: (to: number) => void;
  onRemove: () => void;
}) {
  return (
    <div className="editor-card-tools">
      <button
        type="button"
        aria-label={`Move ${label} up`}
        disabled={index === 0}
        onClick={() => onMove(index - 1)}
      >
        <ArrowUp />
      </button>
      <button
        type="button"
        aria-label={`Move ${label} down`}
        disabled={index === count - 1}
        onClick={() => onMove(index + 1)}
      >
        <ArrowDown />
      </button>
      <button
        type="button"
        aria-label={`Remove ${label}`}
        onClick={() => {
          if (window.confirm(`Remove this ${label}?`)) onRemove();
        }}
      >
        <Trash2 />
      </button>
    </div>
  );
}

type Stats = {
  since: string;
  totals: { name: string; count: number }[];
  daily: { day: string; count: number }[];
};

/** Visitor statistics, loaded only when the section is opened. */
function StatsPanel() {
  const [open, setOpen] = useState(false);
  const [stats, setStats] = useState<Stats | null>(null);
  const [error, setError] = useState("");

  useEffect(() => {
    if (!open) return;
    let active = true;
    fetch("/api/stats", { cache: "no-store" })
      .then(async (response) => {
        const body = (await response.json()) as Stats & { error?: string };
        if (!response.ok) throw new Error(body.error || "Unavailable.");
        if (active) setStats(body);
      })
      .catch((err: unknown) => {
        if (active)
          setError(err instanceof Error ? err.message : "Unavailable.");
      });
    return () => {
      active = false;
    };
  }, [open]);

  const peak = Math.max(1, ...(stats?.daily.map((d) => d.count) ?? []));
  const counts = new Map(stats?.totals.map((t) => [t.name, t.count]));

  return (
    <details onToggle={(e) => setOpen(e.currentTarget.open)}>
      <summary>Visitor statistics (30 days)</summary>
      <div className="editor-group">
        {error && <p className="upload-error">{error}</p>}
        {!stats && !error && <p className="editor-dirty">Loading…</p>}
        {stats && (
          <>
            <p className="editor-dirty">Daily page views</p>
            <div className="stats-spark" aria-hidden="true">
              {stats.daily.map((d) => (
                <span
                  key={d.day}
                  title={`${d.day}: ${d.count} views`}
                  style={{ height: `${(d.count / peak) * 100}%` }}
                />
              ))}
            </div>
            <dl className="stats-list">
              {(Object.keys(trackedEvents) as TrackedEvent[]).map((name) => (
                <div key={name}>
                  <dt>{trackedEvents[name]}</dt>
                  <dd>{counts.get(name) ?? 0}</dd>
                </div>
              ))}
            </dl>
            <p className="editor-dirty">
              Anonymous counts since {stats.since}. Obvious bots are ignored.
            </p>
          </>
        )}
      </div>
    </details>
  );
}

export function Editor({
  data,
  setData,
  onSave,
  onOverwrite,
  upload,
  saving,
  saved,
  error,
  conflict,
  dirty,
}: {
  data: PortfolioData;
  setData: (data: PortfolioData) => void;
  onSave: () => void;
  /** Save even though the published copy changed since it was loaded. */
  onOverwrite: () => void;
  upload: UploadFn;
  saving: boolean;
  saved: boolean;
  dirty: boolean;
  error: string;
  conflict: boolean;
}) {
  const hero = (key: keyof PortfolioData["hero"], value: string) =>
    setData({ ...data, hero: { ...data.hero, [key]: value } });
  return (
    <SheetContent className="editor-panel" side="right">
      <SheetHeader className="editor-head">
        <SheetTitle>Portfolio editor</SheetTitle>
        <SheetDescription>
          Every visible detail lives here. Changes are published when you save.
        </SheetDescription>
      </SheetHeader>
      <UploadContext.Provider value={upload}>
        <div className="editor-body">
          <details open>
            <summary>Hero & profile</summary>
            <div className="editor-group">
              <Field
                label="Name"
                value={data.hero.name}
                onChange={(v) => hero("name", v)}
              />
              <Field
                label="Role"
                value={data.hero.role}
                onChange={(v) => hero("role", v)}
              />
              <Field
                label="Tagline"
                value={data.hero.tagline}
                onChange={(v) => hero("tagline", v)}
                multiline
              />
              <Field
                label="Bio"
                value={data.hero.bio}
                onChange={(v) => hero("bio", v)}
                multiline
              />
              <Field
                label="Location"
                value={data.hero.location}
                onChange={(v) => hero("location", v)}
              />
              <Field
                label="Availability"
                value={data.hero.availability}
                onChange={(v) => hero("availability", v)}
              />
              <FileUploadField
                label="Photo"
                accept="image/jpeg,image/png,image/webp"
                value={data.hero.photoUrl}
                onChange={(v) => hero("photoUrl", v)}
                preview
                maxDim={800}
              />
              <Field
                label="GitHub URL"
                value={data.hero.github}
                onChange={(v) => hero("github", v)}
              />
              <Field
                label="LinkedIn URL"
                value={data.hero.linkedin}
                onChange={(v) => hero("linkedin", v)}
              />
              <Field
                label="Email"
                value={data.hero.email}
                onChange={(v) => hero("email", v)}
              />
              <Field
                label="Calendar / Meeting link (e.g. Cal.com or Calendly)"
                value={data.hero.calendarUrl ?? ""}
                onChange={(v) => hero("calendarUrl", v)}
              />
            </div>
          </details>

          <details>
            <summary>Experience</summary>
            <div className="editor-group">
              {data.experience.map((item, i) => (
                <div className="editor-card" key={i}>
                  <CardTools
                    label="role"
                    index={i}
                    count={data.experience.length}
                    onMove={(to) =>
                      setData({
                        ...data,
                        experience: moveItem(data.experience, i, to),
                      })
                    }
                    onRemove={() =>
                      setData({
                        ...data,
                        experience: data.experience.filter((_, x) => x !== i),
                      })
                    }
                  />
                  <Field
                    label="Company"
                    value={item.company}
                    onChange={(v) => {
                      const a = [...data.experience];
                      a[i] = { ...item, company: v };
                      setData({ ...data, experience: a });
                    }}
                  />
                  <Field
                    label="Title"
                    value={item.title}
                    onChange={(v) => {
                      const a = [...data.experience];
                      a[i] = { ...item, title: v };
                      setData({ ...data, experience: a });
                    }}
                  />
                  <Field
                    label="Dates"
                    value={item.dates}
                    onChange={(v) => {
                      const a = [...data.experience];
                      a[i] = { ...item, dates: v };
                      setData({ ...data, experience: a });
                    }}
                  />
                  <Field
                    label="Impact (one per line)"
                    value={item.bullets.join("\n")}
                    multiline
                    onChange={(v) => {
                      const a = [...data.experience];
                      a[i] = { ...item, bullets: v.split("\n") };
                      setData({ ...data, experience: a });
                    }}
                  />
                </div>
              ))}
              <button
                className="add-button"
                onClick={() =>
                  setData({
                    ...data,
                    experience: [
                      ...data.experience,
                      {
                        company: "Company",
                        title: "Role",
                        dates: "Year — Year",
                        bullets: ["Describe your impact."],
                      },
                    ],
                  })
                }
              >
                <Plus /> Add role
              </button>
            </div>
          </details>

          <details>
            <summary>Skills</summary>
            <div className="editor-group">
              {data.skills.map((group, i) => (
                <div className="editor-card" key={i}>
                  <CardTools
                    label="skill group"
                    index={i}
                    count={data.skills.length}
                    onMove={(to) =>
                      setData({ ...data, skills: moveItem(data.skills, i, to) })
                    }
                    onRemove={() =>
                      setData({
                        ...data,
                        skills: data.skills.filter((_, x) => x !== i),
                      })
                    }
                  />
                  <Field
                    label="Category"
                    value={group.category}
                    onChange={(v) => {
                      const a = [...data.skills];
                      a[i] = { ...group, category: v };
                      setData({ ...data, skills: a });
                    }}
                  />
                  <ListField
                    label="Skills (comma separated)"
                    items={group.items}
                    onChange={(items) => {
                      const a = [...data.skills];
                      a[i] = { ...group, items };
                      setData({ ...data, skills: a });
                    }}
                  />
                </div>
              ))}
              <button
                className="add-button"
                onClick={() =>
                  setData({
                    ...data,
                    skills: [
                      ...data.skills,
                      { category: "Category", items: ["Skill"] },
                    ],
                  })
                }
              >
                <Plus /> Add group
              </button>
            </div>
          </details>

          <details>
            <summary>Projects</summary>
            <div className="editor-group">
              {data.projects.map((project, i) => (
                <div className="editor-card" key={i}>
                  <CardTools
                    label="project"
                    index={i}
                    count={data.projects.length}
                    onMove={(to) =>
                      setData({
                        ...data,
                        projects: moveItem(data.projects, i, to),
                      })
                    }
                    onRemove={() =>
                      setData({
                        ...data,
                        projects: data.projects.filter((_, x) => x !== i),
                      })
                    }
                  />
                  <Field
                    label="Title"
                    value={project.title}
                    onChange={(v) => {
                      const a = [...data.projects];
                      a[i] = { ...project, title: v };
                      setData({ ...data, projects: a });
                    }}
                  />
                  <Field
                    label="Description"
                    value={project.description}
                    multiline
                    onChange={(v) => {
                      const a = [...data.projects];
                      a[i] = { ...project, description: v };
                      setData({ ...data, projects: a });
                    }}
                  />
                  <ListField
                    label="Tech stack (comma separated)"
                    items={project.stack}
                    onChange={(stack) => {
                      const a = [...data.projects];
                      a[i] = { ...project, stack };
                      setData({ ...data, projects: a });
                    }}
                  />
                  <Field
                    label="Live URL"
                    value={project.liveUrl}
                    onChange={(v) => {
                      const a = [...data.projects];
                      a[i] = { ...project, liveUrl: v };
                      setData({ ...data, projects: a });
                    }}
                  />
                  <Field
                    label="GitHub URL"
                    value={project.githubUrl}
                    onChange={(v) => {
                      const a = [...data.projects];
                      a[i] = { ...project, githubUrl: v };
                      setData({ ...data, projects: a });
                    }}
                  />
                  <FileUploadField
                    label="Screenshot / Mockup"
                    accept="image/jpeg,image/png,image/webp"
                    value={project.imageUrl ?? ""}
                    onChange={(v) => {
                      const a = [...data.projects];
                      a[i] = { ...project, imageUrl: v };
                      setData({ ...data, projects: a });
                    }}
                    preview
                  />
                  <label className="color-field">
                    <span>Accent</span>
                    <input
                      type="color"
                      value={project.accent}
                      onChange={(e) => {
                        const a = [...data.projects];
                        a[i] = { ...project, accent: e.target.value };
                        setData({ ...data, projects: a });
                      }}
                    />
                  </label>
                </div>
              ))}
              <button
                className="add-button"
                onClick={() =>
                  setData({
                    ...data,
                    projects: [
                      ...data.projects,
                      {
                        title: "New project",
                        description: "What it does and why it matters.",
                        stack: ["React"],
                        liveUrl: "",
                        githubUrl: "",
                        accent: accents[data.projects.length % accents.length],
                        imageUrl: "",
                      },
                    ],
                  })
                }
              >
                <Plus /> Add project
              </button>
            </div>
          </details>

          <details>
            <summary>Certifications & Badges</summary>
            <div className="editor-group">
              {(data.certifications ?? []).map((cert, i) => (
                <div className="editor-card" key={i}>
                  <CardTools
                    label="certification"
                    index={i}
                    count={(data.certifications ?? []).length}
                    onMove={(to) =>
                      setData({
                        ...data,
                        certifications: moveItem(
                          data.certifications ?? [],
                          i,
                          to,
                        ),
                      })
                    }
                    onRemove={() => {
                      const list = (data.certifications ?? []).filter(
                        (_, x) => x !== i,
                      );
                      setData({ ...data, certifications: list });
                    }}
                  />
                  <Field
                    label="Certification name"
                    value={cert.name}
                    onChange={(v) => {
                      const list = [...(data.certifications ?? [])];
                      list[i] = { ...cert, name: v };
                      setData({ ...data, certifications: list });
                    }}
                  />
                  <Field
                    label="Issuing organization"
                    value={cert.issuer}
                    onChange={(v) => {
                      const list = [...(data.certifications ?? [])];
                      list[i] = { ...cert, issuer: v };
                      setData({ ...data, certifications: list });
                    }}
                  />
                  <Field
                    label="Date / Year"
                    value={cert.date}
                    onChange={(v) => {
                      const list = [...(data.certifications ?? [])];
                      list[i] = { ...cert, date: v };
                      setData({ ...data, certifications: list });
                    }}
                  />
                  <Field
                    label="Verification URL"
                    value={cert.credentialUrl ?? ""}
                    onChange={(v) => {
                      const list = [...(data.certifications ?? [])];
                      list[i] = { ...cert, credentialUrl: v };
                      setData({ ...data, certifications: list });
                    }}
                  />
                </div>
              ))}
              <button
                className="add-button"
                onClick={() =>
                  setData({
                    ...data,
                    certifications: [
                      ...(data.certifications ?? []),
                      {
                        name: "New Certification",
                        issuer: "Issuer (e.g. Salesforce, AWS)",
                        date: "2024",
                        credentialUrl: "",
                      },
                    ],
                  })
                }
              >
                <Plus /> Add certification
              </button>
            </div>
          </details>

          <details>
            <summary>Education</summary>
            <div className="editor-group">
              {(data.education ?? []).map((edu, i) => (
                <div className="editor-card" key={i}>
                  <CardTools
                    label="education entry"
                    index={i}
                    count={(data.education ?? []).length}
                    onMove={(to) =>
                      setData({
                        ...data,
                        education: moveItem(data.education ?? [], i, to),
                      })
                    }
                    onRemove={() => {
                      const list = (data.education ?? []).filter(
                        (_, x) => x !== i,
                      );
                      setData({ ...data, education: list });
                    }}
                  />
                  <Field
                    label="Institution / University"
                    value={edu.institution}
                    onChange={(v) => {
                      const list = [...(data.education ?? [])];
                      list[i] = { ...edu, institution: v };
                      setData({ ...data, education: list });
                    }}
                  />
                  <Field
                    label="Degree / Field of study"
                    value={edu.degree}
                    onChange={(v) => {
                      const list = [...(data.education ?? [])];
                      list[i] = { ...edu, degree: v };
                      setData({ ...data, education: list });
                    }}
                  />
                  <Field
                    label="Dates"
                    value={edu.dates}
                    onChange={(v) => {
                      const list = [...(data.education ?? [])];
                      list[i] = { ...edu, dates: v };
                      setData({ ...data, education: list });
                    }}
                  />
                  <Field
                    label="Details / Highlights"
                    value={edu.details ?? ""}
                    multiline
                    onChange={(v) => {
                      const list = [...(data.education ?? [])];
                      list[i] = { ...edu, details: v };
                      setData({ ...data, education: list });
                    }}
                  />
                </div>
              ))}
              <button
                className="add-button"
                onClick={() =>
                  setData({
                    ...data,
                    education: [
                      ...(data.education ?? []),
                      {
                        institution: "University Name",
                        degree: "Degree / Course",
                        dates: "2020 — 2024",
                        details: "",
                      },
                    ],
                  })
                }
              >
                <Plus /> Add education
              </button>
            </div>
          </details>

          <details>
            <summary>Testimonials & Recommendations</summary>
            <div className="editor-group">
              {(data.testimonials ?? []).map((test, i) => (
                <div className="editor-card" key={i}>
                  <CardTools
                    label="recommendation"
                    index={i}
                    count={(data.testimonials ?? []).length}
                    onMove={(to) =>
                      setData({
                        ...data,
                        testimonials: moveItem(data.testimonials ?? [], i, to),
                      })
                    }
                    onRemove={() => {
                      const list = (data.testimonials ?? []).filter(
                        (_, x) => x !== i,
                      );
                      setData({ ...data, testimonials: list });
                    }}
                  />
                  <Field
                    label="Recommender Name"
                    value={test.name}
                    onChange={(v) => {
                      const list = [...(data.testimonials ?? [])];
                      list[i] = { ...test, name: v };
                      setData({ ...data, testimonials: list });
                    }}
                  />
                  <Field
                    label="Role / Title"
                    value={test.role}
                    onChange={(v) => {
                      const list = [...(data.testimonials ?? [])];
                      list[i] = { ...test, role: v };
                      setData({ ...data, testimonials: list });
                    }}
                  />
                  <Field
                    label="Company / Team"
                    value={test.company}
                    onChange={(v) => {
                      const list = [...(data.testimonials ?? [])];
                      list[i] = { ...test, company: v };
                      setData({ ...data, testimonials: list });
                    }}
                  />
                  <Field
                    label="Quote / Recommendation"
                    value={test.quote}
                    multiline
                    onChange={(v) => {
                      const list = [...(data.testimonials ?? [])];
                      list[i] = { ...test, quote: v };
                      setData({ ...data, testimonials: list });
                    }}
                  />
                  <Field
                    label="LinkedIn Profile URL"
                    value={test.linkedInUrl ?? ""}
                    onChange={(v) => {
                      const list = [...(data.testimonials ?? [])];
                      list[i] = { ...test, linkedInUrl: v };
                      setData({ ...data, testimonials: list });
                    }}
                  />
                  <FileUploadField
                    label="Photo / Avatar (optional)"
                    accept="image/jpeg,image/png,image/webp"
                    value={test.avatarUrl ?? ""}
                    onChange={(v) => {
                      const list = [...(data.testimonials ?? [])];
                      list[i] = { ...test, avatarUrl: v };
                      setData({ ...data, testimonials: list });
                    }}
                    preview
                  />
                </div>
              ))}
              <button
                className="add-button"
                onClick={() =>
                  setData({
                    ...data,
                    testimonials: [
                      ...(data.testimonials ?? []),
                      {
                        name: "Colleague Name",
                        role: "Senior Engineering Manager",
                        company: "Company Name",
                        quote:
                          "Describe how you contributed and delivered results with high ownership.",
                        linkedInUrl: "",
                        avatarUrl: "",
                      },
                    ],
                  })
                }
              >
                <Plus /> Add recommendation
              </button>
            </div>
          </details>

          <details>
            <summary>Learning, resume & contact</summary>
            <div className="editor-group">
              <ListField
                label="Currently learning (comma separated)"
                items={data.learning}
                onChange={(learning) => setData({ ...data, learning })}
              />
              <FileUploadField
                label="Resume (PDF)"
                accept="application/pdf,.pdf"
                value={data.resumeUrl}
                onChange={(v) => setData({ ...data, resumeUrl: v })}
              />
              <Field
                label="Receive contact messages at"
                value={data.contact.email ?? ""}
                onChange={(email) =>
                  setData({ ...data, contact: { ...data.contact, email } })
                }
              />
              <Field
                label="Contact heading"
                value={data.contact.heading}
                onChange={(v) =>
                  setData({ ...data, contact: { ...data.contact, heading: v } })
                }
              />
              <Field
                label="Contact note"
                value={data.contact.note}
                multiline
                onChange={(v) =>
                  setData({ ...data, contact: { ...data.contact, note: v } })
                }
              />
              <Field
                label={`Booking: response time (default "${defaultResponseNote}")`}
                value={data.contact.responseNote ?? ""}
                onChange={(v) =>
                  setData({
                    ...data,
                    contact: { ...data.contact, responseNote: v || undefined },
                  })
                }
              />
              <Field
                label={`Booking: meeting platforms (default "${defaultMeetingNote}")`}
                value={data.contact.meetingNote ?? ""}
                onChange={(v) =>
                  setData({
                    ...data,
                    contact: { ...data.contact, meetingNote: v || undefined },
                  })
                }
              />
            </div>
          </details>
          <StatsPanel />
        </div>
      </UploadContext.Provider>
      <div className="editor-save">
        {error && <p role="alert">{error}</p>}
        {conflict && !saving && (
          <div className="editor-conflict">
            <button type="button" onClick={() => window.location.reload()}>
              Reload latest (discards your edits)
            </button>
            <button type="button" onClick={onOverwrite}>
              Overwrite with my version
            </button>
          </div>
        )}
        {dirty && !saving && !error && (
          <p className="editor-dirty">Unsaved changes</p>
        )}
        <Button onClick={onSave} disabled={saving}>
          {saved ? <Check /> : <Save />}
          {saving ? "Saving…" : saved ? "Saved" : "Save & publish"}
        </Button>
      </div>
    </SheetContent>
  );
}
