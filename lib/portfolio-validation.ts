import type { PortfolioData } from './portfolio.ts';

export const MAX_PORTFOLIO_BYTES = 1_750_000;
export const MAX_DATA_URL_LENGTH = 1_400_000;

const limits = {
  short: 200,
  medium: 1_000,
  long: 5_000,
  items: 50,
} as const;

function isRecord(value: unknown): value is Record<string, unknown> {
  return typeof value === 'object' && value !== null && !Array.isArray(value);
}

function text(value: unknown, max: number = limits.medium, required = true) {
  return (
    typeof value === 'string' &&
    value.length <= max &&
    (!required || value.trim().length > 0)
  );
}

function optionalText(value: unknown, max = limits.medium) {
  return value === undefined || text(value, max, false);
}

function stringList(value: unknown, maxItems = limits.items) {
  return (
    Array.isArray(value) &&
    value.length <= maxItems &&
    value.every((item) => text(item, limits.short))
  );
}

function webUrl(value: unknown, optional = true) {
  if (optional && value === '') return true;
  if (!text(value, 2_048)) return false;
  const candidate = value as string;
  if (
    candidate !== candidate.trim() ||
    candidate.split('').some((character) => {
      const code = character.charCodeAt(0);
      return code <= 32 || code === 127;
    })
  )
    return false;
  try {
    const url = new URL(value as string);
    return url.protocol === 'https:' && !url.username && !url.password;
  } catch {
    return false;
  }
}

function assetUrl(value: unknown, kind: 'image' | 'pdf', optional = true) {
  if (optional && value === '') return true;
  if (!text(value, MAX_DATA_URL_LENGTH)) return false;
  const url = value as string;
  if (url.startsWith('/') && !url.startsWith('//')) return true;
  if (url.startsWith('data:')) {
    const prefix =
      kind === 'image'
        ? /^data:image\/(?:jpeg|png|webp);base64,/
        : /^data:application\/pdf;base64,/;
    if (url.length > MAX_DATA_URL_LENGTH || !prefix.test(url)) return false;
    const payload = url.slice(url.indexOf(',') + 1);
    return payload.length > 0 && /^[A-Za-z0-9+/]+={0,2}$/.test(payload);
  }
  return webUrl(url, false);
}

function email(value: unknown, optional = false) {
  if (optional && (value === undefined || value === '')) return true;
  return (
    text(value, 254) &&
    /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(value as string) &&
    !/[\r\n]/.test(value as string)
  );
}

function exactKeys(value: Record<string, unknown>, allowed: string[]) {
  return Object.keys(value).every((key) => allowed.includes(key));
}

export function isPortfolioData(value: unknown): value is PortfolioData {
  if (!isRecord(value)) return false;
  if (
    !exactKeys(value, [
      'hero',
      'experience',
      'skills',
      'projects',
      'learning',
      'education',
      'certifications',
      'testimonials',
      'resumeUrl',
      'contact',
    ])
  )
    return false;
  const {
    hero,
    experience,
    skills,
    projects,
    learning,
    education,
    certifications,
    testimonials,
    contact,
  } = value;
  if (
    !isRecord(hero) ||
    !exactKeys(hero, [
      'name',
      'role',
      'tagline',
      'bio',
      'location',
      'availability',
      'photoUrl',
      'github',
      'linkedin',
      'email',
      'calendarUrl',
    ])
  )
    return false;
  if (
    !(
      text(hero.name, limits.short) &&
      text(hero.role, limits.short) &&
      text(hero.tagline, limits.medium) &&
      text(hero.bio, limits.long) &&
      text(hero.location, limits.short) &&
      text(hero.availability, limits.short) &&
      assetUrl(hero.photoUrl, 'image') &&
      webUrl(hero.github) &&
      webUrl(hero.linkedin) &&
      email(hero.email) &&
      (hero.calendarUrl === undefined || webUrl(hero.calendarUrl))
    )
  )
    return false;
  if (!assetUrl(value.resumeUrl, 'pdf')) return false;
  if (
    !isRecord(contact) ||
    !exactKeys(contact, ['heading', 'note', 'email']) ||
    !text(contact.heading, limits.short) ||
    !text(contact.note, limits.long) ||
    !email(contact.email, true)
  )
    return false;
  if (
    !Array.isArray(experience) ||
    experience.length > limits.items ||
    !experience.every(
      (item) =>
        isRecord(item) &&
        exactKeys(item, ['company', 'title', 'dates', 'bullets']) &&
        text(item.company, limits.short) &&
        text(item.title, limits.short) &&
        text(item.dates, limits.short) &&
        stringList(item.bullets),
    )
  )
    return false;
  if (
    !Array.isArray(skills) ||
    skills.length > limits.items ||
    !skills.every(
      (item) =>
        isRecord(item) &&
        exactKeys(item, ['category', 'items']) &&
        text(item.category, limits.short) &&
        stringList(item.items),
    )
  )
    return false;
  if (
    !Array.isArray(projects) ||
    projects.length > limits.items ||
    !projects.every(
      (item) =>
        isRecord(item) &&
        exactKeys(item, [
          'title',
          'description',
          'stack',
          'liveUrl',
          'githubUrl',
          'accent',
          'imageUrl',
        ]) &&
        text(item.title, limits.short) &&
        text(item.description, limits.long) &&
        stringList(item.stack) &&
        webUrl(item.liveUrl) &&
        webUrl(item.githubUrl) &&
        /^#[0-9a-fA-F]{6}$/.test(String(item.accent)) &&
        (item.imageUrl === undefined || assetUrl(item.imageUrl, 'image')),
    )
  )
    return false;
  if (!stringList(learning)) return false;
  if (
    education !== undefined &&
    (!Array.isArray(education) ||
      education.length > limits.items ||
      !education.every(
        (item) =>
          isRecord(item) &&
          exactKeys(item, ['institution', 'degree', 'dates', 'details']) &&
          text(item.institution, limits.short) &&
          text(item.degree, limits.short) &&
          text(item.dates, limits.short) &&
          optionalText(item.details),
      ))
  )
    return false;
  if (
    certifications !== undefined &&
    (!Array.isArray(certifications) ||
      certifications.length > limits.items ||
      !certifications.every(
        (item) =>
          isRecord(item) &&
          exactKeys(item, [
            'name',
            'issuer',
            'date',
            'credentialUrl',
            'badgeUrl',
          ]) &&
          text(item.name, limits.short) &&
          text(item.issuer, limits.short) &&
          text(item.date, limits.short) &&
          (item.credentialUrl === undefined || webUrl(item.credentialUrl)) &&
          (item.badgeUrl === undefined || assetUrl(item.badgeUrl, 'image')),
      ))
  )
    return false;
  if (
    testimonials !== undefined &&
    (!Array.isArray(testimonials) ||
      testimonials.length > limits.items ||
      !testimonials.every(
        (item) =>
          isRecord(item) &&
          exactKeys(item, [
            'name',
            'role',
            'company',
            'quote',
            'avatarUrl',
            'linkedInUrl',
          ]) &&
          text(item.name, limits.short) &&
          text(item.role, limits.short) &&
          text(item.company, limits.short) &&
          text(item.quote, limits.long) &&
          (item.avatarUrl === undefined || assetUrl(item.avatarUrl, 'image')) &&
          (item.linkedInUrl === undefined || webUrl(item.linkedInUrl)),
      ))
  )
    return false;
  return true;
}

export async function readLimitedJson(request: Request): Promise<unknown> {
  const declaredSize = Number(request.headers.get('content-length'));
  if (Number.isFinite(declaredSize) && declaredSize > MAX_PORTFOLIO_BYTES) {
    throw new RangeError('Portfolio exceeds the storage limit.');
  }
  if (!request.body) throw new SyntaxError('Missing JSON body.');
  const reader = request.body.getReader();
  const decoder = new TextDecoder('utf-8', { fatal: true });
  let size = 0;
  let body = '';
  while (true) {
    const { done, value } = await reader.read();
    if (done) break;
    size += value.byteLength;
    if (size > MAX_PORTFOLIO_BYTES) {
      await reader.cancel();
      throw new RangeError('Portfolio exceeds the storage limit.');
    }
    body += decoder.decode(value, { stream: true });
  }
  body += decoder.decode();
  return JSON.parse(body);
}
