/** Events the site records. Anything else sent to /api/events is ignored. */
export const trackedEvents = {
  page_view: 'Page views',
  open_quick_scan: 'Quick scan opened',
  preview_resume: 'Résumé previewed',
  download_resume: 'Résumé downloaded',
  view_projects: '“View projects” clicked',
  open_project_demo: 'Project demos opened',
  open_project_code: 'Project source opened',
  open_calendar: 'Calendar link opened',
  schedule_via_email: 'Scheduled via email',
  email_from_quick_scan: 'Emailed from quick scan',
  contact_submit: 'Contact form sent',
} as const;

export type TrackedEvent = keyof typeof trackedEvents;

export function isTrackedEvent(value: unknown): value is TrackedEvent {
  return typeof value === 'string' && Object.hasOwn(trackedEvents, value);
}

const botPattern =
  /bot|crawl|spider|slurp|preview|facebookexternalhit|headless|lighthouse/i;

export function isLikelyBot(userAgent: string | null) {
  return !userAgent || botPattern.test(userAgent);
}
