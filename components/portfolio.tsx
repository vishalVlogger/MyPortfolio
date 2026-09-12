"use client";

import {
  useEffect,
  useMemo,
  useRef,
  useState,
  type CSSProperties,
} from "react";
import Image from "next/image";
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
  Clock,
  Code2,
  Copy,
  Download,
  ExternalLink,
  Eye,
  FileText,
  GitFork,
  GraduationCap,
  Layers,
  Mail,
  Menu,
  Moon,
  Pencil,
  Plus,
  Quote,
  Save,
  Sparkles,
  Sun,
  Trash2,
  Wrench,
  X,
  Zap,
} from "lucide-react";
import { Button } from "@/components/ui/button";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog";
import {
  Sheet,
  SheetContent,
  SheetDescription,
  SheetHeader,
  SheetTitle,
  SheetTrigger,
} from "@/components/ui/sheet";
import {
  defaultPortfolio,
  type PortfolioData,
  type Testimonial,
} from "@/lib/portfolio";
import { ContactForm } from "@/components/contact-form";

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
const accents = ["#c7ff4a", "#70a5ff", "#ff8b6a", "#d6a7ff", "#6de2c5"];

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

function parseBullets(text: string): string[] {
  if (!text) return [];
  const raw = text.trim();
  let points: string[] = [];
  if (/(?:^|\n)\s*[-•*]\s+/.test(raw)) {
    const parts = raw.split(/(?:^|\n)\s*[-•*]\s+/);
    points = parts.map((p) => p.trim()).filter(Boolean);
  } else if (/\s+[-•*]\s+/.test(raw)) {
    const parts = raw.split(/\s+[-•*]\s+/);
    points = parts.map((p) => p.trim()).filter(Boolean);
  } else {
    points = raw
      .split(/\r?\n+/)
      .map((p) => p.trim())
      .filter(Boolean);
  }
  return points.map((p) => p.replace(/\s*\n\s*/g, " "));
}

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

function compressImage(file: File): Promise<string> {
  return new Promise((resolve, reject) => {
    const reader = new FileReader();
    reader.onerror = reject;
    reader.onload = () => {
      const img = new window.Image();
      img.onerror = () => {
        resolve(reader.result as string);
      };
      img.onload = () => {
        const canvas = document.createElement("canvas");
        const maxDim = 600;
        let { width, height } = img;
        if (width > maxDim || height > maxDim) {
          if (width > height) {
            height = Math.round((height * maxDim) / width);
            width = maxDim;
          } else {
            width = Math.round((width * maxDim) / height);
            height = maxDim;
          }
        }
        canvas.width = width;
        canvas.height = height;
        const ctx = canvas.getContext("2d");
        if (!ctx) {
          resolve(reader.result as string);
          return;
        }
        ctx.drawImage(img, 0, 0, width, height);
        resolve(canvas.toDataURL("image/jpeg", 0.85));
      };
      img.src = reader.result as string;
    };
    reader.readAsDataURL(file);
  });
}

function readFileAsDataUrl(file: File): Promise<string> {
  return new Promise((resolve, reject) => {
    const reader = new FileReader();
    reader.onload = () => resolve(reader.result as string);
    reader.onerror = reject;
    reader.readAsDataURL(file);
  });
}

function FileUploadField({
  label,
  accept,
  value,
  onChange,
  preview = false,
}: {
  label: string;
  accept: string;
  value: string;
  onChange: (dataUrl: string) => void;
  preview?: boolean;
}) {
  const inputRef = useRef<HTMLInputElement>(null);
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState("");
  const [showUrlInput, setShowUrlInput] = useState(false);

  const isDataUrl = value?.startsWith("data:");
  const isImage =
    preview ||
    value?.startsWith("data:image") ||
    /\.(png|jpe?g|gif|webp|svg)$/i.test(value ?? "");

  const displayInfo = (() => {
    if (!value) return null;
    if (isDataUrl) {
      const approxKb = Math.round((value.length * 3) / 4 / 1024);
      return isImage
        ? `Uploaded image (~${approxKb} KB)`
        : `Uploaded document (~${approxKb} KB)`;
    }
    return value.length > 35 ? "…" + value.slice(-32) : value;
  })();

  async function handleFile(file: File) {
    setBusy(true);
    setError("");
    try {
      if (isImage || file.type.startsWith("image/")) {
        const compressed = await compressImage(file);
        onChange(compressed);
      } else {
        if (file.size > 3 * 1024 * 1024) {
          throw new Error(
            "File is larger than 3 MB. Please compress your PDF before uploading.",
          );
        }
        const dataUrl = await readFileAsDataUrl(file);
        onChange(dataUrl);
      }
    } catch (err) {
      setError(err instanceof Error ? err.message : "Failed to read file.");
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
              {busy ? "Processing…" : value ? "Replace file" : "Choose file"}
            </button>
            {displayInfo && (
              <span className="upload-filename" title={displayInfo}>
                {displayInfo}
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

function Editor({
  data,
  setData,
  onSave,
  saving,
  saved,
  error,
}: {
  data: PortfolioData;
  setData: (data: PortfolioData) => void;
  onSave: () => void;
  saving: boolean;
  saved: boolean;
  error: string;
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
              accept="image/*"
              value={data.hero.photoUrl}
              onChange={(v) => hero("photoUrl", v)}
              preview
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
                <button
                  aria-label="Remove role"
                  onClick={() =>
                    setData({
                      ...data,
                      experience: data.experience.filter((_, x) => x !== i),
                    })
                  }
                >
                  <Trash2 />
                </button>
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
                <button
                  aria-label="Remove skill group"
                  onClick={() =>
                    setData({
                      ...data,
                      skills: data.skills.filter((_, x) => x !== i),
                    })
                  }
                >
                  <Trash2 />
                </button>
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
                <button
                  aria-label="Remove project"
                  onClick={() =>
                    setData({
                      ...data,
                      projects: data.projects.filter((_, x) => x !== i),
                    })
                  }
                >
                  <Trash2 />
                </button>
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
                  accept="image/*"
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
                      liveUrl: "https://example.com",
                      githubUrl: "https://github.com/",
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
                <button
                  aria-label="Remove certification"
                  onClick={() => {
                    const list = (data.certifications ?? []).filter(
                      (_, x) => x !== i,
                    );
                    setData({ ...data, certifications: list });
                  }}
                >
                  <Trash2 />
                </button>
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
                <button
                  aria-label="Remove education"
                  onClick={() => {
                    const list = (data.education ?? []).filter(
                      (_, x) => x !== i,
                    );
                    setData({ ...data, education: list });
                  }}
                >
                  <Trash2 />
                </button>
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
                <button
                  aria-label="Remove recommendation"
                  onClick={() => {
                    const list = (data.testimonials ?? []).filter(
                      (_, x) => x !== i,
                    );
                    setData({ ...data, testimonials: list });
                  }}
                >
                  <Trash2 />
                </button>
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
                  accept="image/*"
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
                      linkedInUrl: "https://linkedin.com",
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
              accept=".pdf,.doc,.docx"
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
          </div>
        </details>
      </div>
      <div className="editor-save">
        {error && <p role="alert">{error}</p>}
        <Button onClick={onSave} disabled={saving}>
          {saved ? <Check /> : <Save />}
          {saving ? "Saving…" : saved ? "Saved" : "Save & publish"}
        </Button>
      </div>
    </SheetContent>
  );
}

export function Portfolio() {
  const [data, setData] = useState<PortfolioData>(defaultPortfolio);
  const [loading, setLoading] = useState(true);
  const [dark, setDark] = useState(true);
  const [menu, setMenu] = useState(false);
  const [activeSection, setActiveSection] = useState("about");
  const [saving, setSaving] = useState(false);
  const [saved, setSaved] = useState(false);
  const [canEdit, setCanEdit] = useState(false);
  const [saveError, setSaveError] = useState("");
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

  useEffect(() => {
    dataRef.current = data;
  }, [data]);

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
              },
              body: JSON.stringify(next),
            });
            if (!response.ok)
              throw new Error("The profile could not be saved.");
            lastLoaded.current = JSON.stringify(next);
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
    const theme = localStorage.getItem("portfolio-theme");
    const isDark = theme ? theme === "dark" : true;
    queueMicrotask(() => setDark(isDark));
    document.documentElement.classList.toggle("dark", isDark);
    let active = true;
    let pending = false;
    const refresh = async () => {
      // Returning from the hosted editor refreshes the view without losing local drafts.
      if (
        pending ||
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
        const next = {
          ...content,
          hero: {
            ...defaultPortfolio.hero,
            ...content.hero,
            calendarUrl:
              content.hero?.calendarUrl ??
              defaultPortfolio.hero.calendarUrl ??
              "",
          },
          education: content.education ?? defaultPortfolio.education ?? [],
          certifications:
            content.certifications ?? defaultPortfolio.certifications ?? [],
          testimonials:
            content.testimonials ?? defaultPortfolio.testimonials ?? [],
          contact: { ...defaultPortfolio.contact, ...content.contact },
        };
        lastLoaded.current = JSON.stringify(next);
        dataRef.current = next;
        setData(next);
        setCanEdit(session.canEdit);
        csrfToken.current = session.csrfToken ?? "";
        setEditorNotice(session.editorNotice ?? "");
        setHasContent(true);
        setLoadError("");
      } catch {
        if (active)
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

  const totalSkills = useMemo(
    () => data.skills.reduce((sum, g) => sum + g.items.length, 0),
    [data.skills],
  );

  const isDataResume = Boolean(data.resumeUrl?.startsWith("data:"));

  const [quickScanOpen, setQuickScanOpen] = useState(false);
  const [resumeModalOpen, setResumeModalOpen] = useState(false);
  const [bookingModalOpen, setBookingModalOpen] = useState(false);
  const [activeTestimonial, setActiveTestimonial] = useState(0);

  const handleSpotlightMove = (e: React.MouseEvent<HTMLElement>) => {
    const rect = e.currentTarget.getBoundingClientRect();
    const x = e.clientX - rect.left;
    const y = e.clientY - rect.top;
    e.currentTarget.style.setProperty("--mouse-x", `${x}px`);
    e.currentTarget.style.setProperty("--mouse-y", `${y}px`);
  };

  const save = async () => {
    setSaving(true);
    setSaved(false);
    setSaveError("");
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
      const response = await fetch("/api/content", {
        method: "PUT",
        headers: {
          "Content-Type": "application/json",
          ...(csrfToken.current
            ? { "x-portfolio-csrf": csrfToken.current }
            : {}),
        },
        body: JSON.stringify(data),
      });
      let result: { ok?: boolean; error?: string } = {};
      try {
        result = (await response.json()) as { ok?: boolean; error?: string };
      } catch {
        // Handle non-JSON responses
      }
      if (!response.ok || !result.ok) {
        throw new Error(
          result.error ||
            (response.status === 413
              ? "File is too large. Please compress your resume PDF before saving."
              : `Save failed (${response.status}). Your draft has been kept.`),
        );
      }
      lastLoaded.current = JSON.stringify(data);
      dataRef.current = data;
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
          {nav.map((item) => (
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
        </nav>
        <div className="header-actions">
          <button
            type="button"
            className="recruiter-btn"
            onClick={() => setQuickScanOpen(true)}
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
                onSave={save}
                saving={saving}
                saved={saved}
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
              <span className="stat-value">
                {data.experience.length ? `${data.experience.length}+` : "2+"}
              </span>
              <span className="stat-label">Roles</span>
            </div>
            <div className="stat-item">
              <span className="stat-value">{data.projects.length}</span>
              <span className="stat-label">Projects</span>
            </div>
            <div className="stat-item">
              <span className="stat-value">{totalSkills}+</span>
              <span className="stat-label">Tech Skills</span>
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
            <a className="primary-link" href="#projects">
              View projects <ArrowUpRight />
            </a>
            <button
              type="button"
              className="secondary-link"
              onClick={() => setBookingModalOpen(true)}
              aria-label="Schedule a 15-minute intro chat"
            >
              Book a call <CalendarDays />
            </button>
            <button
              type="button"
              className="secondary-link"
              onClick={() => setResumeModalOpen(true)}
              aria-label="Preview résumé in modal"
            >
              Preview Resume <Eye />
            </button>
            <a
              className="secondary-link"
              href={data.resumeUrl || "#"}
              target={isDataResume ? undefined : "_blank"}
              rel="noreferrer"
              download={isDataResume ? "resume.pdf" : undefined}
            >
              Download <Download />
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
            A track record of shipping impactful software, crafting features,
            and driving team momentum.
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
            Languages, frameworks, tools, and practices I work with to build
            resilient, elegant systems.
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
        </section>

        <section className="section" id="projects">
          <div className="section-heading">
            <h2>
              <Code2 /> Selected Projects
            </h2>
          </div>
          <p className="section-subtitle">
            Crafted digital products and open experiments focusing on usability,
            architecture, and design fidelity.
          </p>

          {allTags.length > 2 && (
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
                onMouseMove={handleSpotlightMove}
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

                {(project.liveUrl || project.githubUrl) && (
                  <div className="project-links">
                    {project.liveUrl && (
                      <a
                        href={project.liveUrl}
                        target="_blank"
                        rel="noreferrer"
                        aria-label={`${project.title} live site`}
                      >
                        Live project <ArrowUpRight />
                      </a>
                    )}
                    {project.githubUrl && (
                      <a
                        href={project.githubUrl}
                        target="_blank"
                        rel="noreferrer"
                        aria-label={`${project.title} GitHub`}
                      >
                        Code <GitFork />
                      </a>
                    )}
                  </div>
                )}
              </article>
            ))}
          </div>
        </section>

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

          {data.education && data.education.length > 0 && (
            <div className="education-grid">
              {data.education.map((edu, i) => (
                <article
                  className="education-card spotlight-card reveal-fade"
                  key={`${edu.institution}-${i}`}
                  onMouseMove={handleSpotlightMove}
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
          )}
        </section>

        <section className="section certifications-section" id="certifications">
          <div className="section-heading">
            <h2>
              <Award /> Certifications & Badges
            </h2>
          </div>
          <p className="section-subtitle">
            Industry-recognized credentials, certified expertise, and technical
            validations.
          </p>

          {data.certifications && data.certifications.length > 0 && (
            <div className="credentials-grid">
              {data.certifications.map((cert, i) => (
                <article
                  className="credential-card spotlight-card reveal-fade"
                  key={`${cert.name}-${i}`}
                  onMouseMove={handleSpotlightMove}
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
          )}
        </section>

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
                      onMouseMove={handleSpotlightMove}
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

        <section className="learning section reveal-fade" id="learning">
          <div className="learning-title-box">
            <span className="learning-beacon" />
            <h2>Currently learning</h2>
          </div>
          <div className="learning-list">
            {data.learning.map((item) => (
              <span key={item}>{item}</span>
            ))}
          </div>
        </section>

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

      {/* Recruiter Quick Scan Modal */}
      <Dialog open={quickScanOpen} onOpenChange={setQuickScanOpen}>
        <DialogContent className="quickscan-dialog">
          <DialogHeader>
            <DialogTitle>Recruiter & HR Quick Scan</DialogTitle>
            <DialogDescription>
              A high-density technical executive summary for rapid candidate
              assessment.
            </DialogDescription>
          </DialogHeader>

          <div className="quickscan-hero">
            <div className="quickscan-portrait">
              {data.hero.photoUrl ? (
                // eslint-disable-next-line @next/next/no-img-element
                <img src={data.hero.photoUrl} alt={data.hero.name} />
              ) : (
                <div
                  style={{
                    display: "grid",
                    placeItems: "center",
                    height: "100%",
                    fontWeight: "bold",
                  }}
                >
                  {initials}
                </div>
              )}
            </div>
            <div className="quickscan-meta">
              <h2>{data.hero.name}</h2>
              <p>{data.hero.role}</p>
              <div className="quickscan-badge-row">
                <span className="quickscan-badge active-status">
                  <span
                    className="status-dot"
                    style={{ width: 6, height: 6 }}
                  />{" "}
                  {data.hero.availability}
                </span>
                <span className="quickscan-badge">📍 {data.hero.location}</span>
              </div>
            </div>
          </div>

          <div className="quickscan-section">
            <h4>Executive Overview</h4>
            <p
              style={{
                margin: 0,
                fontSize: "0.88rem",
                color: "var(--muted)",
                lineHeight: 1.6,
              }}
            >
              {data.hero.bio}
            </p>
          </div>

          <div className="quickscan-section">
            <h4>Primary Tech Stack & Capabilities</h4>
            <div className="quickscan-pills">
              {data.skills
                .flatMap((s) => s.items)
                .slice(0, 16)
                .map((skill) => (
                  <span key={skill} className="quickscan-pill">
                    {skill}
                  </span>
                ))}
            </div>
          </div>

          <div className="quickscan-section">
            <h4>Key Projects & Proven Highlights</h4>
            <ul
              style={{
                margin: "0.4rem 0 0",
                paddingLeft: "1.2rem",
                fontSize: "0.86rem",
                color: "var(--muted)",
                lineHeight: 1.6,
              }}
            >
              {data.projects.map((p) => (
                <li key={p.title} style={{ marginBottom: "0.45rem" }}>
                  <strong style={{ color: "var(--foreground)" }}>
                    {p.title}
                  </strong>{" "}
                  — {parseBullets(p.description)[0] || p.description}
                </li>
              ))}
            </ul>
          </div>

          <div className="quickscan-actions">
            <button
              type="button"
              className="primary-link"
              onClick={() => {
                setQuickScanOpen(false);
                setResumeModalOpen(true);
              }}
            >
              <FileText /> Preview Full Résumé
            </button>
            <a
              className="secondary-link"
              href={`mailto:${data.contact.email || data.hero.email}`}
            >
              <Mail /> Email directly
            </a>
            <a
              className="secondary-link"
              href={data.hero.linkedin}
              target="_blank"
              rel="noreferrer"
            >
              <BriefcaseBusiness /> LinkedIn
            </a>
            <a
              className="secondary-link"
              href={data.hero.github}
              target="_blank"
              rel="noreferrer"
            >
              <GitFork /> GitHub
            </a>
          </div>
        </DialogContent>
      </Dialog>

      {/* Direct In-Browser Resume Preview Modal */}
      <Dialog open={resumeModalOpen} onOpenChange={setResumeModalOpen}>
        <DialogContent
          className="quickscan-dialog"
          style={{ maxWidth: 780, width: "min(780px, calc(100vw - 2rem))" }}
        >
          <DialogHeader>
            <DialogTitle>Interactive Résumé Preview</DialogTitle>
            <DialogDescription>
              Inspect candidate credentials directly in-browser or download for
              your records.
            </DialogDescription>
          </DialogHeader>

          <div className="resume-preview-frame">
            {data.resumeUrl ? (
              <iframe
                src={data.resumeUrl}
                title="Candidate Résumé Preview"
                style={{ width: "100%", height: "100%", border: "none" }}
              />
            ) : (
              <div
                style={{
                  display: "grid",
                  placeItems: "center",
                  height: "100%",
                  color: "var(--muted)",
                }}
              >
                No résumé has been uploaded yet.
              </div>
            )}
          </div>

          <div
            style={{
              display: "flex",
              justifyContent: "space-between",
              alignItems: "center",
              marginTop: "1rem",
            }}
          >
            <span style={{ fontSize: "0.8rem", color: "var(--muted)" }}>
              {isDataResume
                ? "Direct document upload"
                : "Hosted remote document"}
            </span>
            <div style={{ display: "flex", gap: "0.5rem" }}>
              <a
                className="primary-link"
                href={data.resumeUrl || "#"}
                download={isDataResume ? "resume.pdf" : undefined}
                target={isDataResume ? undefined : "_blank"}
                rel="noreferrer"
              >
                <Download /> Download Copy
              </a>
            </div>
          </div>
        </DialogContent>
      </Dialog>

      {/* Quick 15-Minute Intro & Calendar Booking Modal */}
      <Dialog open={bookingModalOpen} onOpenChange={setBookingModalOpen}>
        <DialogContent className="booking-dialog">
          <DialogHeader>
            <DialogTitle>Let’s Connect & Talk</DialogTitle>
            <DialogDescription>
              Schedule an intro call or send a direct inquiry about roles,
              contracts, or engineering projects.
            </DialogDescription>
          </DialogHeader>

          <div className="booking-body">
            <div className="booking-hero-card">
              <span className="booking-status-indicator" />
              <div>
                <h4 style={{ margin: 0, fontSize: "0.95rem", fontWeight: 700 }}>
                  Currently {data.hero.availability}
                </h4>
                <p
                  style={{
                    margin: "0.2rem 0 0",
                    fontSize: "0.82rem",
                    color: "var(--muted)",
                  }}
                >
                  Typically replies within 24 hours · Fast turnaround
                </p>
              </div>
            </div>

            <div className="booking-pills">
              <span className="booking-pill">
                <Clock /> 15–30 Min Intro
              </span>
              <span className="booking-pill">
                <CalendarDays /> Google Meet / Zoom
              </span>
              <span className="booking-pill">📍 {data.hero.location}</span>
            </div>

            <div className="booking-actions">
              {data.hero.calendarUrl ? (
                <a
                  className="booking-primary-btn"
                  href={data.hero.calendarUrl}
                  target="_blank"
                  rel="noreferrer"
                >
                  <CalendarDays /> Book instant slot on calendar{" "}
                  <ArrowUpRight />
                </a>
              ) : (
                <a
                  className="booking-primary-btn"
                  href={`mailto:${data.contact.email || data.hero.email}?subject=Intro%20Chat%20%2F%20Opportunity&body=Hi%20${encodeURIComponent(data.hero.name)}%2C%0A%0AI%20came%20across%20your%20portfolio%20and%20would%20love%20to%20connect%20for%20a%20brief%2015-minute%20intro%20chat%20regarding%20an%20opportunity.`}
                >
                  <Mail /> Schedule via email <ArrowUpRight />
                </a>
              )}

              <a
                className="booking-secondary-btn"
                href={`mailto:${data.contact.email || data.hero.email}`}
              >
                <Mail /> Send direct email:{" "}
                {data.contact.email || data.hero.email}
              </a>

              <a
                className="booking-secondary-btn"
                href={data.hero.linkedin}
                target="_blank"
                rel="noreferrer"
              >
                <BriefcaseBusiness /> Message on LinkedIn <ExternalLink />
              </a>
            </div>
          </div>
        </DialogContent>
      </Dialog>

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
