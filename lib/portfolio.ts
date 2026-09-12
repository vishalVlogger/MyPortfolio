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
    name: "Vishal Patil",
    role: "Software Developer",
    tagline: "Building scalable business applications, automation, and modern web solutions.",
    bio: "Software Developer focused on Salesforce and ASP.NET, with hands-on experience building business applications, automation, integrations, and modernising legacy enterprise systems.",
    location: "Pune, Maharashtra, India",
    availability: "Open to Salesforce & Gen AI Opportunity",
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
        "Contributing to the modernisation of enterprise applications by migrating legacy ASP.NET Web Forms systems to ASP.NET Core MVC.",
        "Migrated legacy .aspx pages and code-behind logic into MVC controllers, Razor views, and modern application workflows.",
        "Integrated existing SQL Server databases while preserving legacy business rules and application behaviour.",
        "Implemented and improved authentication, session management, SMTP workflows, Excel exports, filtering, reporting, and responsive interfaces.",
        "Diagnosed migration and compatibility issues while maintaining functional and UI parity with legacy enterprise applications.",
        "Collaborated through Git and GitHub-based development workflows to manage changes, testing, and application modernisation.",
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
  testimonials: [
    {
      name: "Engineering Lead",
      role: "Delivery Manager",
      company: "Relisoft Technologies",
      quote: "Vishal possesses great technical aptitude across both enterprise .NET migrations and modern Salesforce ecosystems. Delivers reliably with great attention to detail.",
      linkedInUrl: "https://www.linkedin.com/in/vishal-patil03/",
    },
  ],
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
      githubUrl: "https://github.com/vishalVlogger",
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
      liveUrl: "https://github.com/vishalVlogger",
      githubUrl: "https://github.com/vishalVlogger",
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
    note: "I'm open to Salesforce, enterprise application development, and Gen AI opportunities. Feel free to connect or drop me a message.",
    email: "vishal.patil362000@gmail.com",
  },
};
