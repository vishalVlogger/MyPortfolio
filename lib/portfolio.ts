export type Experience = { company: string; title: string; dates: string; bullets: string[] };
export type SkillGroup = { category: string; items: string[] };
export type Project = { title: string; description: string; stack: string[]; liveUrl: string; githubUrl: string; accent: string; imageUrl?: string };
export type Education = { institution: string; degree: string; dates: string; details?: string };
export type Certification = { name: string; issuer: string; date: string; credentialUrl?: string; badgeUrl?: string };
export type Testimonial = { name: string; role: string; company: string; quote: string; avatarUrl?: string; linkedInUrl?: string };

export type PortfolioData = {
  hero: {
    name: string;
    role: string;
    tagline: string;
    bio: string;
    location: string;
    availability: string;
    photoUrl: string;
    github: string;
    linkedin: string;
    email: string;
    calendarUrl?: string;
  };
  experience: Experience[];
  skills: SkillGroup[];
  projects: Project[];
  learning: string[];
  education?: Education[];
  certifications?: Certification[];
  testimonials?: Testimonial[];
  resumeUrl: string;
  contact: { heading: string; note: string; email?: string };
};

export const defaultPortfolio: PortfolioData = {
  hero: {
    name: 'Your Name', role: 'Software Developer',
    tagline: 'I turn complex problems into thoughtful digital products.',
    bio: 'I am a product-minded developer focused on useful, beautifully engineered experiences. I enjoy moving between interface details, resilient systems, and the decisions that connect them.',
    location: 'Based in India · Working worldwide', availability: 'Open to new opportunities', photoUrl: '',
    github: 'https://github.com/', linkedin: 'https://linkedin.com/in/', email: 'hello@example.com',
    calendarUrl: '',
  },
  experience: [
    { company: 'Your Company', title: 'Software Developer', dates: '2024 — Present', bullets: ['Built and shipped customer-facing features across the full product stack.', 'Improved critical workflows through thoughtful engineering and close collaboration.', 'Raised quality with pragmatic testing, documentation, and performance work.'] },
    { company: 'Previous Company', title: 'Developer Intern', dates: '2023 — 2024', bullets: ['Delivered production-ready components used across multiple product surfaces.', 'Partnered with design and engineering to turn early ideas into reliable releases.'] },
  ],
  education: [
    { institution: 'University / Institute of Technology', degree: 'Bachelor of Technology in Computer Science', dates: '2020 — 2024', details: 'Focused on Software Engineering, Data Structures, and Cloud Architecture.' }
  ],
  certifications: [
    { name: 'Salesforce Certified Administrator', issuer: 'Salesforce', date: '2024', credentialUrl: 'https://trailhead.salesforce.com/' },
    { name: 'Salesforce Platform Developer I', issuer: 'Salesforce', date: '2024', credentialUrl: 'https://trailhead.salesforce.com/' }
  ],
  testimonials: [
    {
      name: 'Sarah Lin',
      role: 'Engineering Director',
      company: 'TechFlow Labs',
      quote: 'An exceptionally thoughtful engineer who doesn’t just write clean, reliable code, but genuinely cares about the user experience and team velocity. Always dependable on critical deliveries.',
      linkedInUrl: 'https://linkedin.com',
    },
    {
      name: 'Alex Rivera',
      role: 'Senior Product Manager',
      company: 'Nexis Systems',
      quote: 'One of the smoothest developer collaborations I’ve experienced. Quick to translate complex requirements into intuitive features with incredible attention to detail and zero technical debt.',
      linkedInUrl: 'https://linkedin.com',
    },
  ],
  skills: [
    { category: 'Languages', items: ['TypeScript', 'JavaScript', 'Python', 'SQL'] },
    { category: 'Frameworks', items: ['React', 'Next.js', 'Node.js', 'Tailwind CSS'] },
    { category: 'Tools', items: ['Git', 'PostgreSQL', 'Docker', 'Figma'] },
    { category: 'Working style', items: ['Product thinking', 'Communication', 'Mentoring'] },
  ],
  projects: [
    { title: 'Signal', description: 'A focused analytics workspace that turns dense product data into clear, actionable decisions.', stack: ['React', 'TypeScript', 'PostgreSQL'], liveUrl: 'https://example.com', githubUrl: 'https://github.com/', accent: '#c7ff4a', imageUrl: '' },
    { title: 'Orbit', description: 'A collaborative planning tool built around fast capture, calm organization, and team momentum.', stack: ['Next.js', 'Node.js', 'WebSockets'], liveUrl: 'https://example.com', githubUrl: 'https://github.com/', accent: '#70a5ff', imageUrl: '' },
    { title: 'Sonder', description: 'An editorial discovery experience with expressive typography and a lightweight publishing flow.', stack: ['React', 'Headless CMS', 'Cloudflare'], liveUrl: 'https://example.com', githubUrl: 'https://github.com/', accent: '#ff8b6a', imageUrl: '' },
  ],
  learning: ['Rust', 'System Design', 'AWS'],
  resumeUrl: '/resume.pdf',
  contact: { heading: 'Have a problem worth solving?', note: 'I am always happy to talk about a role, a project, or an interesting idea.', email: 'vishal.patil362000@gmail.com' },
};
