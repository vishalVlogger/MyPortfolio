import { defaultPortfolio, type PortfolioData } from "./portfolio.ts";
import { isPortfolioData } from "./portfolio-validation.ts";

const legacyAvailabilityLabels = new Set([
  "Open to Salesforce & Gen AI Opportunity",
  "Open to Salesforce & Gen AI opportunities",
]);

export const defaultResponseNote =
  "Typically replies within 24 hours · Fast turnaround";
export const defaultMeetingNote = "Google Meet / Zoom";

function normalizeUrl(value: string) {
  return value.trim().replace(/\/$/, "").toLowerCase();
}

export function isGitHubRepository(value: string) {
  if (!value) return false;
  try {
    const url = new URL(value);
    return (
      url.hostname === "github.com" &&
      url.pathname.split("/").filter(Boolean).length >= 2
    );
  } catch {
    return false;
  }
}

export function isLiveProject(value: string) {
  if (!value) return false;
  try {
    return new URL(value).hostname !== "github.com";
  } catch {
    return false;
  }
}

export function parseBullets(text: string): string[] {
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

function upgradeLegacyContent(content: PortfolioData): PortfolioData {
  const legacyExperience =
    content.experience[0]?.company === "Relisoft Technologies" &&
    content.experience[0]?.bullets[0]?.startsWith(
      "Contributing to the modernisation",
    );
  const ownerLinkedIn = normalizeUrl(content.hero.linkedin);

  return {
    ...content,
    hero: {
      ...content.hero,
      role:
        content.hero.role === "Software Developer" ||
        content.hero.role === "Salesforce & .NET Develope"
          ? defaultPortfolio.hero.role
          : content.hero.role,
      tagline: content.hero.tagline.startsWith(
        "Building scalable business applications",
      )
        ? defaultPortfolio.hero.tagline
        : content.hero.tagline,
      bio: content.hero.bio.startsWith("Software Developer focused on")
        ? defaultPortfolio.hero.bio
        : content.hero.bio,
      availability: legacyAvailabilityLabels.has(
        content.hero.availability.trim(),
      )
        ? defaultPortfolio.hero.availability
        : content.hero.availability,
    },
    experience: legacyExperience
      ? content.experience.map((item, index) =>
          index === 0
            ? { ...item, bullets: defaultPortfolio.experience[0].bullets }
            : item,
        )
      : content.experience,
    projects: content.projects.map((project) => ({
      ...project,
      liveUrl: isLiveProject(project.liveUrl) ? project.liveUrl : "",
      githubUrl: isGitHubRepository(project.githubUrl) ? project.githubUrl : "",
    })),
    testimonials: (content.testimonials ?? []).filter(
      (testimonial) =>
        !(
          testimonial.name.trim().toLowerCase() === "engineering lead" &&
          normalizeUrl(testimonial.linkedInUrl ?? "") === ownerLinkedIn
        ),
    ),
    contact: {
      ...content.contact,
      note: content.contact.note.startsWith(
        "I'm open to Salesforce, enterprise application development",
      )
        ? defaultPortfolio.contact.note
        : content.contact.note,
    },
  };
}

/** Fill optional sections from the defaults and migrate legacy stored copy. */
export function preparePortfolio(content: PortfolioData): PortfolioData {
  return upgradeLegacyContent({
    ...content,
    hero: {
      ...defaultPortfolio.hero,
      ...content.hero,
      calendarUrl:
        content.hero?.calendarUrl ?? defaultPortfolio.hero.calendarUrl ?? "",
    },
    education: content.education ?? defaultPortfolio.education ?? [],
    certifications:
      content.certifications ?? defaultPortfolio.certifications ?? [],
    testimonials: content.testimonials ?? defaultPortfolio.testimonials ?? [],
    contact: { ...defaultPortfolio.contact, ...content.contact },
  });
}

/** Drop blank list entries left over from editing so the draft validates. */
export function cleanPortfolio(data: PortfolioData): PortfolioData {
  const list = (items: string[]) =>
    items.map((item) => item.trim()).filter(Boolean);
  return {
    ...data,
    experience: data.experience.map((item) => ({
      ...item,
      bullets: list(item.bullets),
    })),
    skills: data.skills.map((group) => ({
      ...group,
      items: list(group.items),
    })),
    projects: data.projects.map((project) => ({
      ...project,
      stack: list(project.stack),
    })),
    learning: list(data.learning),
  };
}

const sectionLabels: Record<string, string> = {
  experience: "Experience",
  skills: "Skills",
  projects: "Projects",
  learning: "Currently learning",
  education: "Education",
  certifications: "Certifications",
  testimonials: "Testimonials",
  resumeUrl: "Resume",
  contact: "Contact",
};

/**
 * Locate the first invalid field by validating one part at a time against
 * otherwise-valid defaults, so the editor can say where the problem is.
 */
export function findPortfolioIssue(data: PortfolioData): string | null {
  // Checked through an unknown alias so the guard doesn't narrow `data` to never.
  const whole: unknown = data;
  if (isPortfolioData(whole)) return null;
  for (const [key, value] of Object.entries(data.hero)) {
    const candidate = {
      ...defaultPortfolio,
      hero: { ...defaultPortfolio.hero, [key]: value },
    };
    if (!isPortfolioData(candidate))
      return `Profile → ${key}: check it is filled in, not too long, and any link starts with https://.`;
  }
  for (const [key, label] of Object.entries(sectionLabels)) {
    const candidate = {
      ...defaultPortfolio,
      [key]: data[key as keyof PortfolioData],
    };
    if (!isPortfolioData(candidate))
      return `${label}: a field is empty, too long, or has a link that doesn't start with https://.`;
  }
  return "Some content is invalid. Your draft has been kept.";
}
