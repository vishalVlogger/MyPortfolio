export type Experience = { company: string; title: string; dates: string; bullets: string[] };
export type SkillGroup = { category: string; items: string[] };
export type Project = { title: string; description: string; stack: string[]; liveUrl: string; githubUrl: string; accent: string };
export type PortfolioData = {
  hero: { name: string; role: string; tagline: string; bio: string; location: string; availability: string; photoUrl: string; github: string; linkedin: string; email: string };
  experience: Experience[];
  skills: SkillGroup[];
  projects: Project[];
  learning: string[];
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
  },
  experience: [
    { company: 'Your Company', title: 'Software Developer', dates: '2024 — Present', bullets: ['Built and shipped customer-facing features across the full product stack.', 'Improved critical workflows through thoughtful engineering and close collaboration.', 'Raised quality with pragmatic testing, documentation, and performance work.'] },
    { company: 'Previous Company', title: 'Developer Intern', dates: '2023 — 2024', bullets: ['Delivered production-ready components used across multiple product surfaces.', 'Partnered with design and engineering to turn early ideas into reliable releases.'] },
  ],
  skills: [
    { category: 'Languages', items: ['TypeScript', 'JavaScript', 'Python', 'SQL'] },
    { category: 'Frameworks', items: ['React', 'Next.js', 'Node.js', 'Tailwind CSS'] },
    { category: 'Tools', items: ['Git', 'PostgreSQL', 'Docker', 'Figma'] },
    { category: 'Working style', items: ['Product thinking', 'Communication', 'Mentoring'] },
  ],
  projects: [
    { title: 'Signal', description: 'A focused analytics workspace that turns dense product data into clear, actionable decisions.', stack: ['React', 'TypeScript', 'PostgreSQL'], liveUrl: 'https://example.com', githubUrl: 'https://github.com/', accent: '#c7ff4a' },
    { title: 'Orbit', description: 'A collaborative planning tool built around fast capture, calm organization, and team momentum.', stack: ['Next.js', 'Node.js', 'WebSockets'], liveUrl: 'https://example.com', githubUrl: 'https://github.com/', accent: '#70a5ff' },
    { title: 'Sonder', description: 'An editorial discovery experience with expressive typography and a lightweight publishing flow.', stack: ['React', 'Headless CMS', 'Cloudflare'], liveUrl: 'https://example.com', githubUrl: 'https://github.com/', accent: '#ff8b6a' },
  ],
  learning: ['Rust', 'System Design', 'AWS'],
  resumeUrl: '/resume.pdf',
  contact: { heading: 'Have a problem worth solving?', note: 'I am always happy to talk about a role, a project, or an interesting idea.', email: 'vishal.patil362000@gmail.com' },
};
