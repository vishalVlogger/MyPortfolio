"use client";

import { useEffect, useRef, useState } from "react";
import {
  ArrowUpRight,
  BriefcaseBusiness,
  CalendarDays,
  Clock,
  Download,
  ExternalLink,
  FileText,
  GitFork,
  Mail,
  X,
} from "lucide-react";
import {
  Dialog,
  DialogClose,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import type { PortfolioData } from "@/lib/portfolio";
import {
  defaultMeetingNote,
  defaultResponseNote,
  parseBullets,
} from "@/lib/portfolio-content";
import { trackConversion } from "@/lib/analytics";

type DialogProps = {
  data: PortfolioData;
  open: boolean;
  onOpenChange: (open: boolean) => void;
};

function contactEmail(data: PortfolioData) {
  return data.contact.email || data.hero.email;
}

export function QuickScanDialog({
  data,
  open,
  onOpenChange,
  initials,
  onPreviewResume,
}: DialogProps & { initials: string; onPreviewResume: () => void }) {
  const contentRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    if (!open) return;
    const resetScroll = window.setTimeout(() => {
      contentRef.current?.focus({ preventScroll: true });
      contentRef.current?.scrollTo({ top: 0 });
    }, 0);
    return () => window.clearTimeout(resetScroll);
  }, [open]);

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent
        ref={contentRef}
        initialFocus={contentRef}
        className="quickscan-dialog"
        showCloseButton={false}
      >
        <DialogHeader className="quickscan-header">
          <div className="quickscan-header-copy">
            <DialogTitle>Recruiter & HR Quick Scan</DialogTitle>
            <DialogDescription>
              Role fit, core capabilities, and project evidence at a glance.
            </DialogDescription>
          </div>
          <DialogClose
            render={
              <button
                type="button"
                className="quickscan-close"
                aria-label="Close recruiter quick scan"
              />
            }
          >
            <X aria-hidden="true" />
          </DialogClose>
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
                <span className="status-dot" style={{ width: 6, height: 6 }} />{" "}
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
            {[...new Set(data.skills.flatMap((s) => s.items))]
              .slice(0, 8)
              .map((skill) => (
                <span key={skill} className="quickscan-pill">
                  {skill}
                </span>
              ))}
          </div>
        </div>

        <div className="quickscan-section">
          <h4>Selected project evidence</h4>
          <ul
            style={{
              margin: "0.4rem 0 0",
              paddingLeft: "1.2rem",
              fontSize: "0.86rem",
              color: "var(--muted)",
              lineHeight: 1.6,
            }}
          >
            {data.projects.map((p, i) => (
              <li key={`${p.title}-${i}`} style={{ marginBottom: "0.45rem" }}>
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
              trackConversion("preview_resume");
              onPreviewResume();
            }}
          >
            <FileText /> Preview Full Resume
          </button>
          <a
            className="secondary-link"
            href={`mailto:${contactEmail(data)}`}
            onClick={() => trackConversion("email_from_quick_scan")}
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
  );
}

/**
 * Browsers refuse to show data: URLs in frames, so an uploaded PDF is shown
 * through a temporary blob: URL instead.
 */
function usePreviewUrl(source: string, active: boolean) {
  const [blobUrl, setBlobUrl] = useState("");
  const isData = source.startsWith("data:");

  useEffect(() => {
    if (!active || !isData) return;
    let objectUrl = "";
    let cancelled = false;
    void fetch(source)
      .then((response) => response.blob())
      .then((blob) => {
        if (cancelled) return;
        objectUrl = URL.createObjectURL(blob);
        setBlobUrl(objectUrl);
      })
      .catch(() => undefined);
    return () => {
      cancelled = true;
      if (objectUrl) URL.revokeObjectURL(objectUrl);
      setBlobUrl("");
    };
  }, [source, active, isData]);

  return isData ? blobUrl : source;
}

export function ResumeDialog({ data, open, onOpenChange }: DialogProps) {
  const isDataResume = data.resumeUrl.startsWith("data:");
  const previewUrl = usePreviewUrl(data.resumeUrl, open);

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent
        className="quickscan-dialog"
        style={{ maxWidth: 780, width: "min(780px, calc(100vw - 2rem))" }}
      >
        <DialogHeader>
          <DialogTitle>Résumé Preview</DialogTitle>
          <DialogDescription>
            Read it here, open it in a new tab, or download a copy.
          </DialogDescription>
        </DialogHeader>

        <div className="resume-preview-frame">
          {previewUrl ? (
            <iframe
              src={previewUrl}
              title={`${data.hero.name} résumé`}
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
              {data.resumeUrl ? "Loading résumé…" : "No résumé uploaded yet."}
            </div>
          )}
        </div>

        {data.resumeUrl && (
          <div className="resume-preview-actions">
            <span>
              Preview not showing on your phone? Open it in a new tab.
            </span>
            <div>
              <a
                className="secondary-link"
                href={previewUrl || data.resumeUrl}
                target="_blank"
                rel="noreferrer"
              >
                <ExternalLink /> Open in new tab
              </a>
              <a
                className="primary-link"
                href={data.resumeUrl}
                download={isDataResume ? "resume.pdf" : undefined}
                target={isDataResume ? undefined : "_blank"}
                rel="noreferrer"
                onClick={() => trackConversion("download_resume")}
              >
                <Download /> Download
              </a>
            </div>
          </div>
        )}
      </DialogContent>
    </Dialog>
  );
}

export function BookingDialog({ data, open, onOpenChange }: DialogProps) {
  const email = contactEmail(data);
  const subject = encodeURIComponent("Intro Chat / Opportunity");
  const body = encodeURIComponent(
    `Hi ${data.hero.name},\n\nI came across your portfolio and would love to connect for a brief 15-minute intro chat regarding an opportunity.`,
  );

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
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
                {data.hero.availability}
              </h4>
              <p
                style={{
                  margin: "0.2rem 0 0",
                  fontSize: "0.82rem",
                  color: "var(--muted)",
                }}
              >
                {data.contact.responseNote || defaultResponseNote}
              </p>
            </div>
          </div>

          <div className="booking-pills">
            <span className="booking-pill">
              <Clock /> 15–30 Min Intro
            </span>
            <span className="booking-pill">
              <CalendarDays /> {data.contact.meetingNote || defaultMeetingNote}
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
                onClick={() => trackConversion("open_calendar")}
              >
                <CalendarDays /> Pick a time on my calendar <ArrowUpRight />
              </a>
            ) : (
              <a
                className="booking-primary-btn"
                href={`mailto:${email}?subject=${subject}&body=${body}`}
                onClick={() => trackConversion("schedule_via_email")}
              >
                <Mail /> Schedule via email <ArrowUpRight />
              </a>
            )}

            <a className="booking-secondary-btn" href={`mailto:${email}`}>
              <Mail /> Send direct email: {email}
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
  );
}
