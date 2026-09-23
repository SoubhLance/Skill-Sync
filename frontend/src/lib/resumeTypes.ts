export interface ResumeBasics {
  fullName: string;
  email: string;
  phone: string;
  location: string;
  linkedin: string;
  github: string;
  portfolio: string;
  photoDataUrl?: string;
}

export interface ResumeEducation {
  school: string;
  degree: string;
  year: string;
  score: string;
}

export interface ResumeExperience {
  role: string;
  company: string;
  dates: string;
  bullets: string[];
}

export interface ResumeProject {
  name: string;
  link: string;
  tech: string;
  bullets: string[];
}

export interface ResumeSkills {
  languages: string;
  frameworks: string;
  tools: string;
  other: string;
}

export interface ResumeData {
  basics: ResumeBasics;
  summary: string;
  education: ResumeEducation[];
  experience: ResumeExperience[];
  projects: ResumeProject[];
  skills: ResumeSkills;
  achievements: string[];
  certifications: string[];
}

export type ResumeTemplateId = 'classic-jake' | 'two-col-photo' | 'academic-cv' | 'minimal-ats';

export const emptyResume = (): ResumeData => ({
  basics: { fullName: '', email: '', phone: '', location: '', linkedin: '', github: '', portfolio: '' },
  summary: '',
  education: [{ school: '', degree: '', year: '', score: '' }],
  experience: [],
  projects: [{ name: '', link: '', tech: '', bullets: [''] }],
  skills: { languages: '', frameworks: '', tools: '', other: '' },
  achievements: [''],
  certifications: [''],
});

export const sampleResume = (): ResumeData => ({
  basics: {
    fullName: 'Alex Developer',
    email: 'alex.developer@example.com',
    phone: '+1 (555) 019-2834',
    location: 'Bengaluru, IN',
    linkedin: 'https://linkedin.com/in/alexdev',
    github: 'https://github.com/tourist',
    portfolio: 'https://alexdev.dev',
  },
  summary: 'Software Engineer with 4+ years building high-throughput ML pipelines, FastAPI microservices, and distributed systems.',
  education: [{ school: 'IIT Bombay', degree: 'B.Tech, Computer Science', year: '2021', score: 'CGPA 8.7' }],
  experience: [
    {
      role: 'Senior ML Engineer',
      company: 'TechScale',
      dates: '2023 – Present',
      bullets: [
        'Optimized PyTorch model latency by 42% using vLLM and ONNX Runtime.',
        'Architected async FastAPI backend serving 10M+ daily requests.',
      ],
    },
  ],
  projects: [
    {
      name: 'SkillSync Recommender',
      link: 'https://github.com/alex/skillsync',
      tech: 'Python, BERT, FAISS',
      bullets: ['Ranked 415 jobs with blended semantic + profile scoring.'],
    },
  ],
  skills: {
    languages: 'Python, TypeScript, SQL',
    frameworks: 'FastAPI, PyTorch, React',
    tools: 'Docker, Redis, FAISS',
    other: 'System design, Vector DBs',
  },
  achievements: ['Hackathon winner (2023)', 'Published 1 ML paper'],
  certifications: ['AWS Solutions Architect'],
});
