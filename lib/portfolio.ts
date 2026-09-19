export type Experience = {
  company: string;
  title: string;
  dates: string;
  bullets: string[];
};
export type SkillGroup = { category: string; items: string[] };
export type Project = {
  title: string;
  description: string;
  stack: string[];
  liveUrl: string;
  githubUrl: string;
  accent: string;
  imageUrl?: string;
};
export type Education = {
  institution: string;
  degree: string;
  dates: string;
  details?: string;
};
export type Certification = {
  name: string;
  issuer: string;
  date: string;
  credentialUrl?: string;
  badgeUrl?: string;
};
export type Testimonial = {
  name: string;
  role: string;
  company: string;
  quote: string;
  avatarUrl?: string;
  linkedInUrl?: string;
};

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
    name: "Vishal R. Patil",
    role: "Salesforce & .NET Developer",
    tagline:
      "Modernising enterprise systems with Salesforce, ASP.NET Core, automation, and secure integrations.",
    bio: "Salesforce and .NET developer focused on business applications, workflow automation, API integrations, and maintainable replacements for legacy enterprise systems.",
    location: "Pune, Maharashtra, India",
    availability: "Open to Salesforce and GenAI opportunities",
    photoUrl: "/profile.jpg",
    github: "https://github.com/vishalVlogger",
    linkedin: "https://www.linkedin.com/in/vishal-patil03/",
    email: "vishal.patil362000@gmail.com",
    calendarUrl: "",
  },
  experience: [
    {
      company: "Relisoft Technologies",
      title: "Software Developer",
      dates: "2026 — Present",
      bullets: [
        "Modernise legacy ASP.NET Web Forms applications into maintainable ASP.NET Core MVC workflows while preserving business-critical behaviour.",
        "Translate code-behind logic into testable controllers, Razor views, and clearer separation of concerns.",
        "Protect continuity by integrating existing SQL Server schemas and validating legacy business rules throughout migration.",
        "Strengthen authentication, session handling, SMTP workflows, exports, filtering, reporting, and responsive usability.",
        "Diagnose compatibility and migration defects before release, reducing regression risk for existing users.",
        "Use Git and GitHub review workflows to make modernisation changes traceable and safer to ship.",
      ],
    },
  ],
  education: [
    {
      institution: "North Maharashtra University",
      degree: "Bachelor of Technology in Computer Science",
      dates: "2019 — 2022",
      details: "CGPA: 7.56",
    },
    {
      institution: "Nutan Maratha College",
      degree: "Higher Secondary Certificate (12th)",
      dates: "2017 — 2018",
      details: "Percentage: 60%",
    },
  ],
  certifications: [
    {
      name: "Salesforce Certified Administrator",
      issuer: "Salesforce",
      date: "2024",
      credentialUrl: "https://www.salesforce.com/trailblazer/vpatil248",
    },
  ],
  testimonials: [],
  skills: [
    {
      category: "Salesforce",
      items: [
        "Administration",
        "Apex",
        "Triggers",
        "Lightning Web Component (LWC)",
        "Salesforce Flow",
        "Integration (REST/SOAP)",
        "SOQL/SOSL",
        "Sales Cloud",
        "Service Cloud",
      ],
    },
    {
      category: "Web Technologies",
      items: ["HTML", "CSS", "JavaScript", "ASP.NET Core MVC", "SQL Server"],
    },
    {
      category: "Tools",
      items: ["Git", "GitHub", "Visual Studio", "VS Code", "SSMS"],
    },
    {
      category: "Working style",
      items: [
        "Problem Solving",
        "Product Thinking",
        "Communication",
        "Debugging",
        "Team Collaboration",
      ],
    },
  ],
  projects: [
    {
      title: "Meal Search Application (LWC)",
      description:
        "Built a modular 'Meal Hunt' web app using LWC with 4 decoupled components communicating via @api decorators and custom events. Integrated TheMealDB REST API using asynchronous JavaScript fetch for real-time search on Experience Cloud (LWR).",
      stack: [
        "Salesforce Admin",
        "Lightning Web Components",
        "Integration (REST)",
        "JavaScript",
        "SLDS",
      ],
      liveUrl: "https://abs-d2-dev-ed.develop.my.site.com/mealhunter/",
      githubUrl: "",
      accent: "#c7ff4a",
    },
    {
      title: "Spotify Integration (OAuth 2.0 & LWC)",
      description:
        "Integrated Salesforce with Spotify Web API using OAuth 2.0 Auth Code Flow with Named Credentials & External Credentials. Built Apex REST callout services with custom error handling and an interactive LWC player interface.",
      stack: [
        "Salesforce Admin",
        "Apex",
        "Lightning Web Components",
        "OAuth 2.0",
        "Integration (REST)",
        "SLDS",
      ],
      liveUrl: "",
      githubUrl: "",
      accent: "#70a5ff",
    },
  ],
  learning: [
    "Large Language Models",
    "Prompt Engineering",
    "RAG",
    "LangChain",
    "Vector Databases",
    "AI Agents",
    "LLM API Integration",
  ],
  resumeUrl: "/resume.pdf",
  contact: {
    heading: "Let's Build Something Valuable",
    note: "I'm open to Salesforce, .NET, enterprise application development, and GenAI opportunities. Feel free to connect or send a message.",
    email: "vishal.patil362000@gmail.com",
  },
};
