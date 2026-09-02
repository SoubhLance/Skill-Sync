import React, { useState, useEffect, useCallback, useMemo } from 'react';
import { api, JDMatchResponse, JobMatch } from '../lib/api';
import { DiffStatDisplay } from '../components/ui/DiffStatDisplay';
import { FileUpload } from '../components/ui/FileUpload';
import { 
  FileCheck2, 
  UploadCloud, 
  CheckCircle2, 
  AlertCircle, 
  RefreshCw,
  Terminal,
  GitCompare,
  Briefcase,
  Search,
  Filter,
  Building2,
  Sparkles,
  ArrowRight,
  Code2,
  BriefcaseIcon,
  Layers
} from 'lucide-react';

/*
  ================================================================================
  UNIFIED JD MATCHER & JOB RECOMMENDATIONS SECTION
  ================================================================================
*/

// Comprehensive Offline Fallback Dataset (Technical + Non-Technical Roles)
const JOB_TAXONOMY_DATASET: Array<{
  job_id: number;
  job_role: string;
  domain: string;
  experience_label: string;
  experience_level: number;
  skills: string;
  skills_list: string[];
  salary_range: string;
  salary_avg: number;
}> = [
  {
    job_id: 101,
    job_role: "Java Backend Engineer",
    domain: "Technical",
    experience_label: "Mid-level (2-5 years)",
    experience_level: 2,
    skills: "Java, Spring Boot, PostgreSQL, Docker, Microservices, REST APIs",
    skills_list: ["Java", "Spring Boot", "PostgreSQL", "Docker", "Microservices", "REST APIs"],
    salary_range: "$110k - $150k",
    salary_avg: 130000
  },
  {
    job_id: 102,
    job_role: "Senior Java Enterprise Developer",
    domain: "Technical",
    experience_label: "Senior-level (5+ years)",
    experience_level: 3,
    skills: "Java, Hibernate, Kafka, AWS, Distributed Systems, Microservices",
    skills_list: ["Java", "Hibernate", "Kafka", "AWS", "Distributed Systems", "Microservices"],
    salary_range: "$140k - $190k",
    salary_avg: 165000
  },
  {
    job_id: 103,
    job_role: "Fullstack Java & React Developer",
    domain: "Technical",
    experience_label: "Mid-level (2-5 years)",
    experience_level: 2,
    skills: "Java, Spring Boot, React, TypeScript, PostgreSQL, TailwindCSS",
    skills_list: ["Java", "Spring Boot", "React", "TypeScript", "PostgreSQL", "TailwindCSS"],
    salary_range: "$115k - $160k",
    salary_avg: 137000
  },
  {
    job_id: 104,
    job_role: "Machine Learning Engineer",
    domain: "Technical",
    experience_label: "Entry-level (0-2 years)",
    experience_level: 1,
    skills: "Python, PyTorch, Docker, vLLM, Vector Databases, CUDA",
    skills_list: ["Python", "PyTorch", "Docker", "vLLM", "Vector Databases", "CUDA"],
    salary_range: "$120k - $170k",
    salary_avg: 145000
  },
  {
    job_id: 105,
    job_role: "Senior Backend Engineer (Python/FastAPI)",
    domain: "Technical",
    experience_label: "Senior-level (5+ years)",
    experience_level: 3,
    skills: "Python, FastAPI, PostgreSQL, Redis, Distributed Systems, Kubernetes",
    skills_list: ["Python", "FastAPI", "PostgreSQL", "Redis", "Distributed Systems", "Kubernetes"],
    salary_range: "$145k - $195k",
    salary_avg: 170000
  },
  {
    job_id: 106,
    job_role: "Distributed Systems Engineer",
    domain: "Technical",
    experience_label: "Senior-level (5+ years)",
    experience_level: 3,
    skills: "C++, CUDA, gRPC, Triton, Kubernetes, Rust, Go",
    skills_list: ["C++", "CUDA", "gRPC", "Triton", "Kubernetes", "Rust", "Go"],
    salary_range: "$160k - $220k",
    salary_avg: 190000
  },
  {
    job_id: 107,
    job_role: "Frontend Engineer (React/TypeScript)",
    domain: "Technical",
    experience_label: "Mid-level (2-5 years)",
    experience_level: 2,
    skills: "React, TypeScript, Next.js, TailwindCSS, Redux, Webpack",
    skills_list: ["React", "TypeScript", "Next.js", "TailwindCSS", "Redux", "Webpack"],
    salary_range: "$105k - $145k",
    salary_avg: 125000
  },
  {
    job_id: 108,
    job_role: "Node.js API Microservices Developer",
    domain: "Technical",
    experience_label: "Mid-level (2-5 years)",
    experience_level: 2,
    skills: "Node.js, Express, TypeScript, MongoDB, Redis, REST APIs",
    skills_list: ["Node.js", "Express", "TypeScript", "MongoDB", "Redis", "REST APIs"],
    salary_range: "$110k - $150k",
    salary_avg: 130000
  },
  {
    job_id: 109,
    job_role: "MLOps & AI Infrastructure Engineer",
    domain: "Technical",
    experience_label: "Mid-level (2-5 years)",
    experience_level: 2,
    skills: "Docker, Kubernetes, Python, MLflow, TensorRT-LLM, Terraform, CI/CD",
    skills_list: ["Docker", "Kubernetes", "Python", "MLflow", "TensorRT-LLM", "Terraform", "CI/CD"],
    salary_range: "$135k - $185k",
    salary_avg: 160000
  },
  {
    job_id: 110,
    job_role: "AI Research Scientist",
    domain: "Technical",
    experience_label: "Senior-level (5+ years)",
    experience_level: 3,
    skills: "PyTorch, Python, CUDA, Mathematics & Linear Algebra, Transformers, Distributed Training",
    skills_list: ["PyTorch", "Python", "CUDA", "Mathematics & Linear Algebra", "Transformers", "Distributed Training"],
    salary_range: "$170k - $240k",
    salary_avg: 205000
  },
  {
    job_id: 111,
    job_role: "Data Engineer (Spark/Kafka)",
    domain: "Technical",
    experience_label: "Mid-level (2-5 years)",
    experience_level: 2,
    skills: "Python, PostgreSQL, Apache Spark, Airflow, Kafka, SQL, Docker",
    skills_list: ["Python", "PostgreSQL", "Apache Spark", "Airflow", "Kafka", "SQL", "Docker"],
    salary_range: "$120k - $165k",
    salary_avg: 142000
  },
  {
    job_id: 112,
    job_role: "DevOps & Cloud Architect",
    domain: "Technical",
    experience_label: "Senior-level (5+ years)",
    experience_level: 3,
    skills: "Docker, Kubernetes, Terraform, CI/CD, AWS, Linux, Python, Go",
    skills_list: ["Docker", "Kubernetes", "Terraform", "CI/CD", "AWS", "Linux", "Python", "Go"],
    salary_range: "$140k - $190k",
    salary_avg: 165000
  },
  {
    job_id: 113,
    job_role: "Android Mobile Software Engineer",
    domain: "Technical",
    experience_label: "Mid-level (2-5 years)",
    experience_level: 2,
    skills: "Kotlin, Java, Android SDK, Jetpack Compose, Coroutines, REST APIs",
    skills_list: ["Kotlin", "Java", "Android SDK", "Jetpack Compose", "Coroutines", "REST APIs"],
    salary_range: "$110k - $155k",
    salary_avg: 132000
  },
  {
    job_id: 114,
    job_role: "iOS Mobile Software Engineer",
    domain: "Technical",
    experience_label: "Mid-level (2-5 years)",
    experience_level: 2,
    skills: "Swift, SwiftUI, iOS SDK, CoreData, Xcode, REST APIs",
    skills_list: ["Swift", "SwiftUI", "iOS SDK", "CoreData", "Xcode", "REST APIs"],
    salary_range: "$115k - $160k",
    salary_avg: 137000
  },
  {
    job_id: 115,
    job_role: "Financial Analyst",
    domain: "General",
    experience_label: "Entry-level (0-2 years)",
    experience_level: 1,
    skills: "Financial Modeling, Excel, Bloomberg Terminal, Risk Analysis, Valuation",
    skills_list: ["Financial Modeling", "Excel", "Bloomberg Terminal", "Risk Analysis", "Valuation"],
    salary_range: "$75k - $95k",
    salary_avg: 85000
  },
  {
    job_id: 116,
    job_role: "Mechanical Engineer",
    domain: "Technical",
    experience_label: "Mid-level (2-5 years)",
    experience_level: 2,
    skills: "AutoCAD, SolidWorks, FEA, GD&T, CAD, Thermodynamics, Fluid Mechanics, MATLAB",
    skills_list: ["AutoCAD", "SolidWorks", "FEA", "GD&T", "CAD", "Thermodynamics", "Fluid Mechanics", "MATLAB"],
    salary_range: "$85k - $120k",
    salary_avg: 102500
  },
  {
    job_id: 117,
    job_role: "Clinical Research Coordinator",
    domain: "General",
    experience_label: "Entry-level (0-2 years)",
    experience_level: 1,
    skills: "Clinical Trial Management, GCP, Medical Documentation, Patient Interaction, Data Entry",
    skills_list: ["Clinical Trial Management", "GCP", "Medical Documentation", "Patient Interaction", "Data Entry"],
    salary_range: "$65k - $90k",
    salary_avg: 78500
  },
  {
    job_id: 118,
    job_role: "Technical Product Manager",
    domain: "General",
    experience_label: "Mid-level (2-5 years)",
    experience_level: 2,
    skills: "Product Roadmap, Agile/Scrum, User Stories, System Architecture, SQL, Market Research",
    skills_list: ["Product Roadmap", "Agile/Scrum", "User Stories", "System Architecture", "SQL", "Market Research"],
    salary_range: "$130k - $180k",
    salary_avg: 155000
  },
  {
    job_id: 119,
    job_role: "Business Systems Analyst",
    domain: "General",
    experience_label: "Mid-level (2-5 years)",
    experience_level: 2,
    skills: "Requirements Gathering, SQL, Excel, Process Mapping, Jira, Data Analysis",
    skills_list: ["Requirements Gathering", "SQL", "Excel", "Process Mapping", "Jira", "Data Analysis"],
    salary_range: "$90k - $130k",
    salary_avg: 110000
  }
];

const TECH_PRESET_SKILLS = [
  "Java", "Python", "PyTorch", "React", "TypeScript", 
  "Docker", "Kubernetes", "FastAPI", "Go", "C++", "SQL", "AWS"
];

const NON_TECH_PRESET_SKILLS = [
  "Financial Modeling", "Excel", "Risk Analysis", "Project Management",
  "Clinical Trials", "CAD Design", "Data Entry", "Market Research", "SolidWorks"
];

export const JDMatcherPage: React.FC = () => {
  const [activeTab, setActiveTab] = useState<'pairwise' | 'browse'>('pairwise');

  // Pairwise JD Matcher state
  const [inputMode, setInputMode] = useState<'paste' | 'upload'>('paste');
  const [resumeFile, setResumeFile] = useState<File | null>(null);
  const [jdFile, setJdFile] = useState<File | null>(null);
  const [resumeText, setResumeText] = useState(
    `Experienced Software Engineer proficient in Python, FastAPI, PyTorch, React, TypeScript, Docker, SQL, and REST APIs. Built machine learning pipelines and microservices.`
  );
  const [jdText, setJdText] = useState(
    `We are looking for a Senior ML & Backend Engineer. Requirements: Strong Python skills, FastAPI expertise, PyTorch or TensorFlow, Docker, Kubernetes, AWS, PostgreSQL, and GraphQL.`
  );
  const [loading, setLoading] = useState(false);
  const [result, setResult] = useState<JDMatchResponse | null>(null);
  const [error, setError] = useState<string | null>(null);

  // Job Matches Search State
  const [skillsQuery, setSkillsQuery] = useState('Python, PyTorch, FastAPI, Docker');
  const [selectedDomain, setSelectedDomain] = useState<string>('All');
  const [trackFilter, setTrackFilter] = useState<'all' | 'technical' | 'general'>('all');
  const [domains, setDomains] = useState<string[]>([]);
  const [allBackendJobs, setAllBackendJobs] = useState<JobMatch[]>([]);
  const [jobs, setJobs] = useState<JobMatch[]>([]);
  const [jobsLoading, setJobsLoading] = useState<boolean>(false);

  // On mount, fetch domains and full 415+ jobs dataset from backend
  useEffect(() => {
    const initData = async () => {
      try {
        const [domainList, fullJobs] = await Promise.all([
          api.getDomains().catch(() => []),
          api.getJobs().catch(() => [])
        ]);
        
        if (domainList.length > 0) {
          setDomains(['All', ...domainList]);
        } else {
          setDomains(['All', 'Technical', 'General']);
        }

        if (fullJobs.length > 0) {
          setAllBackendJobs(fullJobs);
        }
      } catch (err) {
        console.warn("Backend jobs index init warning:", err);
      }
    };
    initData();
  }, []);

  // Is job technical vs general classification helper
  const isTechJob = useCallback((job: { domain?: string; job_role?: string; skills?: string }): boolean => {
    const d = (job.domain || '').toLowerCase();
    const r = (job.job_role || '').toLowerCase();
    const s = (job.skills || '').toLowerCase();

    if (d === 'technical' || d.includes('engineering') || d.includes('ai') || d.includes('web') || d.includes('data') || d.includes('cloud')) {
      return true;
    }
    if (d === 'general' || d.includes('finance') || d.includes('business') || d.includes('healthcare')) {
      return false;
    }

    const techKeywords = ['developer', 'engineer', 'architect', 'scientist', 'programmer', 'full stack', 'backend', 'frontend', 'devops', 'cyber', 'qa', 'firmware', 'code', 'python', 'java', 'react'];
    return techKeywords.some(kw => r.includes(kw) || s.includes(kw));
  }, []);

  // Compute Skill Matches and Skill Gaps dynamically given user skills input across all 415+ jobs
  const processMatchesForQuery = useCallback((queryStr: string, domainFilter?: string, currentTrack?: 'all' | 'technical' | 'general', rawApiMatches?: JobMatch[]): JobMatch[] => {
    const candSkills = queryStr
      .split(',')
      .map(s => s.trim())
      .filter(Boolean);

    const candSkillsLower = candSkills.map(s => s.toLowerCase());
    const hasQuery = candSkillsLower.length > 0;

    // Use API matches if provided and non-empty, otherwise use backend index or local dataset fallback
    const sourcePool = (rawApiMatches && rawApiMatches.length > 0)
      ? rawApiMatches
      : (allBackendJobs && allBackendJobs.length > 0 ? allBackendJobs : JOB_TAXONOMY_DATASET);

    const candidateSource = sourcePool.map((m, idx) => ({
      job_id: m.job_id || (idx + 1),
      job_role: m.job_role || "Engineering Specialist",
      domain: m.domain || "Technical",
      experience_label: m.experience_label || "Mid-level (2-5 years)",
      experience_level: m.experience_level || 2,
      skills: m.skills || "",
      skills_list: (m.skills_list && m.skills_list.length > 0) ? m.skills_list : (m.skills || "").split(',').map(s => s.trim()).filter(Boolean),
      salary_range: m.salary_range || "$110k - $160k",
      salary_avg: m.salary_avg || 135000
    }));

    const evaluated: JobMatch[] = candidateSource.map((job) => {
      const reqSkills = job.skills_list && job.skills_list.length > 0 
        ? job.skills_list 
        : job.skills.split(',').map(s => s.trim()).filter(Boolean);

      // Calculate Overlapping Skills (case-insensitive & sub-token match)
      const overlap = reqSkills.filter(req => 
        candSkillsLower.some(cand => 
          req.toLowerCase() === cand ||
          req.toLowerCase().includes(cand) ||
          cand.includes(req.toLowerCase())
        )
      );

      // Calculate Missing Skill Gaps
      const gap = reqSkills.filter(req => 
        !candSkillsLower.some(cand => 
          req.toLowerCase() === cand ||
          req.toLowerCase().includes(cand) ||
          cand.includes(req.toLowerCase())
        )
      );

      // Alignment Match % calculation just like Career Path prediction
      let match_pct = 0;
      if (hasQuery && reqSkills.length > 0) {
        const rawRatio = overlap.length / reqSkills.length;
        if (overlap.length > 0) {
          match_pct = Math.round(rawRatio * 65 + 30);
        } else {
          const roleMatch = candSkillsLower.some(cand => job.job_role.toLowerCase().includes(cand));
          match_pct = roleMatch ? 45 : 0;
        }
      } else {
        match_pct = 75; // default view score
      }
      match_pct = Math.min(98, match_pct);

      return {
        job_id: job.job_id,
        job_role: job.job_role,
        domain: job.domain,
        experience_label: job.experience_label,
        experience_level: job.experience_level,
        skills: job.skills,
        skills_list: reqSkills,
        projects: "Production Service Blueprint",
        companies: "Tech Tier 1 / High Growth Startups",
        salary_range: job.salary_range,
        salary_min: 90000,
        salary_max: 200000,
        salary_avg: job.salary_avg,
        has_salary_data: true,
        skill_count: reqSkills.length,
        semantic_score: match_pct / 100,
        blended_score: match_pct / 100,
        skill_overlap: overlap,
        skill_gap: gap,
        match_pct: match_pct
      };
    });

    // 1. Track Filter (Tech vs Non-Tech)
    let filtered = evaluated;
    const track = currentTrack || trackFilter;
    if (track === 'technical') {
      filtered = filtered.filter(j => isTechJob(j));
    } else if (track === 'general') {
      filtered = filtered.filter(j => !isTechJob(j));
    }

    // 2. Domain Filter Dropdown
    if (domainFilter && domainFilter !== 'All') {
      filtered = filtered.filter(j => j.domain.toLowerCase().includes(domainFilter.toLowerCase()));
    }

    // 3. Filter out 0% matches if user searched specific skills
    if (hasQuery) {
      const relevantMatches = filtered.filter(j => j.skill_overlap.length > 0 || j.match_pct >= 40);
      if (relevantMatches.length > 0) {
        filtered = relevantMatches;
      }
    }

    // Sort by match percentage descending
    filtered.sort((a, b) => b.match_pct - a.match_pct || a.job_role.localeCompare(b.job_role));

    return filtered;
  }, [allBackendJobs, trackFilter, isTechJob]);

  const handleCalculateMatch = useCallback(async () => {
    if (inputMode === 'upload' && !resumeFile && !resumeText.trim() && !jdFile && !jdText.trim()) {
      setError("Please upload a Resume PDF/DOCX or Target JD PDF/DOCX file.");
      return;
    }
    if (inputMode === 'paste' && !jdText.trim()) {
      setError("Please paste target job description requirements.");
      return;
    }
    if (loading) return;

    setLoading(true);
    setError(null);
    try {
      let payload: any;
      if (resumeFile || jdFile) {
        const formData = new FormData();
        if (resumeFile) {
          formData.append('resume_file', resumeFile);
        } else if (resumeText.trim()) {
          formData.append('resume_text', resumeText.trim());
        }

        if (jdFile) {
          formData.append('file', jdFile);
        } else if (jdText.trim()) {
          formData.append('jd_text', jdText.trim());
        }
        payload = formData;
      } else {
        payload = {
          resume_text: resumeText.trim() || undefined,
          jd_text: jdText.trim(),
        };
      }

      const data = await api.jdMatch(payload);
      setResult(data);

      if (data.skill_overlap.length > 0) {
        const query = data.skill_overlap.join(', ');
        setSkillsQuery(query);
        try {
          const res = await api.recommendSkills(query, 400, 0.75);
          const processed = processMatchesForQuery(query, selectedDomain, trackFilter, res.matches);
          setJobs(processed);
        } catch {
          const processed = processMatchesForQuery(query, selectedDomain, trackFilter);
          setJobs(processed);
        }
      }
    } catch (err: any) {
      console.error("JD match error:", err);
      setError(err?.response?.data?.detail || "Pairwise JD matching failed.");
    } finally {
      setLoading(false);
    }
  }, [jdText, resumeText, resumeFile, jdFile, inputMode, loading, selectedDomain, trackFilter, processMatchesForQuery]);

  const handleFetchRecommendations = useCallback(async (customQuery?: string, customTrack?: 'all' | 'technical' | 'general') => {
    setJobsLoading(true);
    const targetQuery = customQuery !== undefined ? customQuery : skillsQuery;
    const targetTrack = customTrack !== undefined ? customTrack : trackFilter;
    const domainFilter = selectedDomain === 'All' ? undefined : selectedDomain;

    try {
      const res = await api.recommendSkills(targetQuery, 400, 0.75, domainFilter);
      const processed = processMatchesForQuery(targetQuery, selectedDomain, targetTrack, res.matches);
      setJobs(processed);
    } catch (err: any) {
      console.warn("API fallback to backend dataset index for job search:", err);
      const processed = processMatchesForQuery(targetQuery, selectedDomain, targetTrack);
      setJobs(processed);
    } finally {
      setJobsLoading(false);
    }
  }, [skillsQuery, selectedDomain, trackFilter, processMatchesForQuery]);

  useEffect(() => {
    if (activeTab === 'browse') {
      handleFetchRecommendations();
    }
  }, [activeTab, selectedDomain, trackFilter]);

  const handlePresetClick = (presetSkill: string) => {
    const currentSkills = skillsQuery
      .split(',')
      .map(s => s.trim())
      .filter(Boolean);

    const existsIdx = currentSkills.findIndex(
      s => s.toLowerCase() === presetSkill.toLowerCase()
    );

    let updatedSkills: string[];
    if (existsIdx >= 0) {
      updatedSkills = currentSkills.filter((_, idx) => idx !== existsIdx);
    } else {
      updatedSkills = [...currentSkills, presetSkill];
    }

    const updatedQuery = updatedSkills.join(', ');
    setSkillsQuery(updatedQuery);
    handleFetchRecommendations(updatedQuery);
  };

  const handleSearchSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    handleFetchRecommendations();
  };

  const handleTrackChange = (newTrack: 'all' | 'technical' | 'general') => {
    setTrackFilter(newTrack);
    handleFetchRecommendations(undefined, newTrack);
  };

  const activePresets = trackFilter === 'general' 
    ? NON_TECH_PRESET_SKILLS 
    : trackFilter === 'technical' 
    ? TECH_PRESET_SKILLS 
    : [...TECH_PRESET_SKILLS, ...NON_TECH_PRESET_SKILLS.slice(0, 4)];

  return (
    <div className="p-6 md:p-10 max-w-7xl mx-auto space-y-8 font-sans text-[var(--text-main)]">
      {/* Header */}
      <div className="pb-4 flex flex-col md:flex-row md:items-center justify-between gap-4 font-mono border-b border-[var(--border-hairline)]">
        <div>
          <div className="text-xs font-bold text-[var(--text-muted)] uppercase flex items-center gap-1.5 mb-1">
            <FileCheck2 className="w-3.5 h-3.5 text-[var(--accent-color)]" /> $ skillsync jd-match --unified
          </div>
          <h1 className="text-2xl md:text-3xl font-extrabold tracking-tight text-[var(--text-main)] font-sans">
            Unified JD Matcher & Career Recommendations
          </h1>
        </div>

        {/* Tab Switcher */}
        <div className="flex p-0.5 rounded-sm bg-[var(--bg-surface)] border border-[var(--border-hairline)] font-mono text-xs">
          <button
            onClick={() => setActiveTab('pairwise')}
            className={`flex items-center gap-1.5 px-3 py-1.5 font-bold rounded-sm transition-all cursor-pointer ${
              activeTab === 'pairwise' ? 'btn-accent shadow-sm' : 'text-[var(--text-muted)] hover:text-[var(--text-main)]'
            }`}
          >
            <GitCompare className="w-3.5 h-3.5" /> Pairwise JD Analysis
          </button>
          <button
            onClick={() => setActiveTab('browse')}
            className={`flex items-center gap-1.5 px-3 py-1.5 font-bold rounded-sm transition-all cursor-pointer ${
              activeTab === 'browse' ? 'btn-accent shadow-sm' : 'text-[var(--text-muted)] hover:text-[var(--text-main)]'
            }`}
          >
            <Briefcase className="w-3.5 h-3.5" /> Browse Job Matches ({jobs.length})
          </button>
        </div>
      </div>

      {error && (
        <div className="p-4 rounded-sm bg-[#FFEBE9] border border-[#CF222E]/40 text-[#CF222E] font-mono text-xs flex items-center gap-2">
          <AlertCircle className="w-4 h-4 shrink-0" />
          <span>{error}</span>
        </div>
      )}

      {activeTab === 'pairwise' ? (
        <div className="space-y-8">
          {/* Two-Panel Pairwise Layout */}
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
            {/* Left Panel: Input Specs */}
            <div className="space-y-6 font-mono text-xs">
              <div className="p-6 rounded-sm bg-[var(--bg-surface)] border border-[var(--border-hairline)] space-y-5">
                <div className="flex items-center justify-between border-b border-[var(--border-hairline)] pb-3">
                  <h2 className="text-xs font-bold text-[var(--text-main)] uppercase tracking-wider flex items-center gap-2">
                    <Terminal className="w-4 h-4 text-[var(--accent-color)]" /> Input Resume & JD Text
                  </h2>

                  <div className="flex p-0.5 rounded-sm bg-[var(--bg-paper)] border border-[var(--border-hairline)]">
                    <button
                      type="button"
                      onClick={() => setInputMode('paste')}
                      className={`px-2 py-1 text-[10px] font-bold rounded-sm cursor-pointer ${
                        inputMode === 'paste' ? 'btn-accent' : 'text-[var(--text-muted)]'
                      }`}
                    >
                      Paste Text
                    </button>
                    <button
                      type="button"
                      onClick={() => setInputMode('upload')}
                      className={`px-2 py-1 text-[10px] font-bold rounded-sm cursor-pointer ${
                        inputMode === 'upload' ? 'btn-accent' : 'text-[var(--text-muted)]'
                      }`}
                    >
                      PDF Upload
                    </button>
                  </div>
                </div>

                {inputMode === 'paste' ? (
                  <>
                    <div>
                      <label className="block text-[10px] font-bold text-[var(--text-muted)] uppercase mb-1">
                        Candidate Resume Content
                      </label>
                      <textarea
                        rows={4}
                        value={resumeText}
                        onChange={(e) => setResumeText(e.target.value)}
                        placeholder="Paste full candidate resume text..."
                        className="w-full p-3 rounded-sm border border-[var(--border-hairline)] bg-[var(--bg-paper)] text-xs font-mono text-[var(--text-main)] focus:outline-none focus:border-[var(--accent-color)]"
                      />
                    </div>

                    <div>
                      <label className="block text-[10px] font-bold text-[var(--text-muted)] uppercase mb-1">
                        Target Job Description (JD) Requirements
                      </label>
                      <textarea
                        rows={6}
                        value={jdText}
                        onChange={(e) => setJdText(e.target.value)}
                        placeholder="Paste target job description requirements..."
                        className="w-full p-3 rounded-sm border border-[var(--border-hairline)] bg-[var(--bg-paper)] text-xs font-mono text-[var(--text-main)] focus:outline-none focus:border-[var(--accent-color)]"
                      />
                    </div>
                  </>
                ) : (
                  <div className="space-y-5 font-mono">
                    <FileUpload
                      label="Candidate Resume PDF / DOCX"
                      subLabel="Upload candidate's resume document (PDF, DOCX, TXT)"
                      file={resumeFile}
                      onFileSelect={setResumeFile}
                      icon={<FileCheck2 className="w-4 h-4 text-[var(--accent-color)]" />}
                    />

                    <FileUpload
                      label="Target Job Description (JD) PDF / DOCX"
                      subLabel="Upload job specification document (PDF, DOCX, TXT)"
                      file={jdFile}
                      onFileSelect={setJdFile}
                      icon={<Briefcase className="w-4 h-4 text-emerald-500" />}
                    />

                    <div className="pt-2 border-t border-[var(--border-hairline)]">
                      <p className="text-[10px] text-[var(--text-muted)] italic leading-relaxed">
                        💡 Note: You can upload PDF/DOCX files for both Resume & JD, or mix uploading a file with pasted text. If no file is attached, pasted text will be used automatically.
                      </p>
                    </div>
                  </div>
                )}

                <button
                  onClick={handleCalculateMatch}
                  disabled={loading}
                  className="w-full py-3 px-4 rounded-sm btn-accent font-mono font-bold text-xs flex items-center justify-center gap-2 cursor-pointer disabled:opacity-50"
                >
                  {loading ? (
                    <>
                      <RefreshCw className="w-4 h-4 animate-spin" /> $ computing pairwise cosine diff...
                    </>
                  ) : (
                    <>
                      <FileCheck2 className="w-4 h-4" /> $ calculate --pairwise-match
                    </>
                  )}
                </button>
              </div>
            </div>

            {/* Right Panel: Results */}
            <div className="space-y-6 font-mono text-xs">
              {result ? (
                <div className="space-y-6">
                  <DiffStatDisplay score={result.match_percent} label="Pairwise BERT Alignment Score" />

                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                    <div className="p-4 rounded-sm bg-[var(--bg-surface)] border border-[#2DA44E]/40 space-y-2">
                      <p className="font-bold text-[#1A7F37] dark:text-[#2DA44E] flex items-center gap-1.5 border-b border-[#2DA44E]/20 pb-2">
                        <CheckCircle2 className="w-4 h-4" /> Matching Overlap ({result.skill_overlap.length})
                      </p>
                      <div className="space-y-1 font-mono">
                        {result.skill_overlap.map((skill, idx) => (
                          <div key={idx} className="text-[#1A7F37] dark:text-[#2DA44E] bg-[#DAFBE1] dark:bg-[#2DA44E]/20 px-2 py-0.5 border border-[#2DA44E]/30 rounded-sm">
                            + {skill}
                          </div>
                        ))}
                      </div>
                    </div>

                    <div className="p-4 rounded-sm bg-[var(--bg-surface)] border border-[#CF222E]/40 space-y-2">
                      <p className="font-bold text-[#CF222E] flex items-center gap-1.5 border-b border-[#CF222E]/20 pb-2">
                        <AlertCircle className="w-4 h-4" /> Missing Skill Gap ({result.skill_gap.length})
                      </p>
                      <div className="space-y-1 font-mono">
                        {result.skill_gap.map((skill, idx) => (
                          <div key={idx} className="text-[#CF222E] bg-[#FFEBE9] dark:bg-[#CF222E]/20 px-2 py-0.5 border border-[#CF222E]/30 rounded-sm">
                            - {skill}
                          </div>
                        ))}
                      </div>
                    </div>
                  </div>
                </div>
              ) : (
                <div className="p-8 rounded-sm bg-[var(--bg-surface)] border border-[var(--border-hairline)] text-center space-y-3 text-xs text-[var(--text-muted)] min-h-[350px] flex flex-col items-center justify-center font-mono">
                  <GitCompare className="w-8 h-8 text-[var(--text-muted)]/40 mx-auto" />
                  <p className="font-bold text-[var(--text-main)]">
                    No active pairwise calculation.
                  </p>
                  <p className="max-w-xs font-sans text-[11px]">
                    Paste job requirements and click "$ calculate --pairwise-match" to inspect exact percentage match and skill gap diff lists.
                  </p>
                </div>
              )}
            </div>
          </div>

          {/* Unified Job Recommendations Section below Matcher */}
          {jobs.length > 0 && (
            <div className="border-t border-[var(--border-hairline)] pt-8 space-y-4 font-mono text-xs">
              <div className="flex items-center justify-between">
                <span className="text-xs font-bold text-[var(--accent-color)] uppercase tracking-wider block">
                  [SUGGESTED JOB MATCHES FROM OVERLAPPING SKILLS]
                </span>
                <button
                  onClick={() => setActiveTab('browse')}
                  className="text-xs text-[var(--accent-color)] font-bold hover:underline cursor-pointer"
                >
                  View All Matching Roles ({jobs.length}) →
                </button>
              </div>

              <div className="grid grid-cols-1 md:grid-cols-3 gap-6 font-sans">
                {jobs.slice(0, 3).map((job) => (
                  <div key={job.job_id} className="p-5 rounded-sm bg-[var(--bg-surface)] border border-[var(--border-hairline)] space-y-3 font-mono text-xs">
                    <div className="flex items-start justify-between">
                      <div>
                        <h4 className="font-extrabold text-sm text-[var(--text-main)] font-sans">{job.job_role}</h4>
                        <p className="text-[11px] text-[var(--text-muted)] mt-0.5">{job.domain} • {job.experience_label}</p>
                      </div>
                      <span className="px-2 py-0.5 rounded-sm text-[10px] font-bold bg-[#DAFBE1] text-[#1A7F37] border border-[#2DA44E]/30 shrink-0">
                        +{job.match_pct}% match
                      </span>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          )}
        </div>
      ) : (
        /* Full Browse Job Recommendations Tab */
        <div className="space-y-6 font-mono text-xs">
          {/* Tech vs Non-Tech Track Switcher Header */}
          <div className="p-4 rounded-sm bg-[var(--bg-surface)] border border-[var(--border-hairline)] flex flex-col sm:flex-row sm:items-center justify-between gap-3 font-sans">
            <div className="space-y-0.5">
              <span className="text-[10px] font-mono text-[var(--accent-color)] font-bold uppercase tracking-wider block">
                [DATASET ACCESS: 415+ INDEXED ROLES VIA BERT + FAISS]
              </span>
              <p className="text-xs font-extrabold text-[var(--text-main)]">
                Filter by Technical vs Non-Technical Track
              </p>
            </div>

            {/* Track Switcher Control */}
            <div className="flex p-0.5 rounded-sm bg-[var(--bg-paper)] border border-[var(--border-hairline)] font-mono text-xs">
              <button
                type="button"
                onClick={() => handleTrackChange('all')}
                className={`flex items-center gap-1.5 px-3 py-1.5 font-bold rounded-sm transition-all cursor-pointer ${
                  trackFilter === 'all'
                    ? 'btn-accent shadow-sm'
                    : 'text-[var(--text-muted)] hover:text-[var(--text-main)]'
                }`}
              >
                <Layers className="w-3.5 h-3.5" /> All (415+)
              </button>
              <button
                type="button"
                onClick={() => handleTrackChange('technical')}
                className={`flex items-center gap-1.5 px-3 py-1.5 font-bold rounded-sm transition-all cursor-pointer ${
                  trackFilter === 'technical'
                    ? 'btn-accent shadow-sm'
                    : 'text-[var(--text-muted)] hover:text-[var(--text-main)]'
                }`}
              >
                <Code2 className="w-3.5 h-3.5 text-emerald-500" /> Technical Track
              </button>
              <button
                type="button"
                onClick={() => handleTrackChange('general')}
                className={`flex items-center gap-1.5 px-3 py-1.5 font-bold rounded-sm transition-all cursor-pointer ${
                  trackFilter === 'general'
                    ? 'btn-accent shadow-sm'
                    : 'text-[var(--text-muted)] hover:text-[var(--text-main)]'
                }`}
              >
                <BriefcaseIcon className="w-3.5 h-3.5 text-sky-500" /> Non-Technical Track
              </button>
            </div>
          </div>

          {/* Search Controls Form */}
          <div className="p-5 rounded-sm bg-[var(--bg-surface)] border border-[var(--border-hairline)] space-y-4">
            <form onSubmit={handleSearchSubmit} className="flex flex-col md:flex-row items-center gap-3">
              <div className="relative flex-1 w-full">
                <Search className="w-4 h-4 text-[var(--text-muted)] absolute left-3 top-3" />
                <input
                  type="text"
                  value={skillsQuery}
                  onChange={(e) => setSkillsQuery(e.target.value)}
                  placeholder="Enter candidate skill(s) e.g. Java, Python, Excel, PyTorch, React, Docker..."
                  className="w-full pl-9 pr-3 py-2.5 rounded-sm border border-[var(--border-hairline)] bg-[var(--bg-paper)] text-xs font-mono text-[var(--text-main)] focus:outline-none focus:border-[var(--accent-color)]"
                />
              </div>

              <div className="relative w-full md:w-56">
                <Filter className="w-4 h-4 text-[var(--text-muted)] absolute left-3 top-3" />
                <select
                  value={selectedDomain}
                  onChange={(e) => setSelectedDomain(e.target.value)}
                  className="w-full pl-9 pr-8 py-2.5 rounded-sm border border-[var(--border-hairline)] bg-[var(--bg-paper)] text-xs font-mono text-[var(--text-main)] focus:outline-none focus:border-[var(--accent-color)] cursor-pointer"
                >
                  {domains.map((dom) => (
                    <option key={dom} value={dom}>
                      {dom === 'All' ? 'All Domains' : dom}
                    </option>
                  ))}
                </select>
              </div>

              <button
                type="submit"
                disabled={jobsLoading}
                className="w-full md:w-auto px-6 py-2.5 rounded-sm btn-accent font-mono font-bold text-xs flex items-center justify-center gap-2 cursor-pointer border border-transparent disabled:opacity-50"
              >
                {jobsLoading ? <RefreshCw className="w-4 h-4 animate-spin" /> : <span>$ search</span>}
              </button>
            </form>

            {/* Quick Skill Search Chips with Multi-Select Toggling */}
            <div className="flex flex-wrap items-center gap-1.5 pt-1 border-t border-[var(--border-hairline)]">
              <span className="text-[10px] text-[var(--text-muted)] uppercase mr-1">
                {trackFilter === 'general' ? 'Non-Tech Presets:' : trackFilter === 'technical' ? 'Tech Presets:' : 'Popular Presets:'}
              </span>
              {activePresets.map((preset) => {
                const isSelected = skillsQuery
                  .split(',')
                  .map(s => s.trim().toLowerCase())
                  .includes(preset.toLowerCase());

                return (
                  <button
                    key={preset}
                    type="button"
                    onClick={() => handlePresetClick(preset)}
                    className={`px-2 py-0.5 rounded-sm text-[10px] border transition-colors cursor-pointer ${
                      isSelected
                        ? 'btn-accent font-bold border-transparent shadow-2xs'
                        : 'bg-[var(--bg-paper)] text-[var(--text-muted)] border-[var(--border-hairline)] hover:border-[var(--text-main)]'
                    }`}
                  >
                    {isSelected ? '✓ ' : '+ '}{preset}
                  </button>
                );
              })}
            </div>
          </div>

          {/* Results Summary Header */}
          <div className="flex items-center justify-between font-mono pb-1 border-b border-[var(--border-hairline)]">
            <span className="text-xs font-bold text-[var(--accent-color)] uppercase tracking-wider flex items-center gap-1.5">
              <Sparkles className="w-4 h-4" /> [MATCHED JOB RECOMMENDATIONS & SKILL GAPS ({jobs.length} FOUND)]
            </span>
            <span className="text-xs text-[var(--text-muted)]">
              Track: <strong className="text-[var(--text-main)] uppercase">{trackFilter}</strong> • {jobs.length} {jobs.length === 1 ? 'Job' : 'Jobs'} Matched
            </span>
          </div>

          {/* Job Recommendation Cards Grid */}
          {jobs.length > 0 ? (
            <div className="grid grid-cols-1 md:grid-cols-3 gap-6 font-sans">
              {jobs.map((job) => (
                <div
                  key={job.job_id}
                  className="p-5 rounded-sm bg-[var(--bg-surface)] border border-[var(--border-hairline)] hover:border-[var(--accent-color)] space-y-4 font-mono text-xs transition-colors flex flex-col justify-between"
                >
                  <div className="space-y-3">
                    {/* Role Title & Domain */}
                    <div className="flex items-start justify-between border-b border-[var(--border-hairline)] pb-3 gap-2">
                      <div className="space-y-1">
                        <h4 className="font-extrabold text-sm text-[var(--text-main)] font-sans leading-tight">
                          {job.job_role}
                        </h4>
                        <p className="text-[11px] text-[var(--text-muted)] flex items-center gap-1">
                          <Building2 className="w-3.5 h-3.5 shrink-0" /> {job.domain} • {job.experience_label}
                        </p>
                      </div>

                      <span
                        className={`px-2.5 py-1 rounded-sm text-[11px] font-bold border shrink-0 font-mono ${
                          job.match_pct >= 70
                            ? 'bg-[#DAFBE1] text-[#1A7F37] dark:bg-[#2DA44E]/20 dark:text-[#2DA44E] border-[#2DA44E]/30'
                            : job.match_pct >= 50
                            ? 'bg-sky-500/10 text-sky-600 dark:text-sky-400 border-sky-500/30'
                            : 'bg-amber-500/10 text-amber-600 dark:text-amber-400 border-amber-500/30'
                        }`}
                      >
                        +{job.match_pct}% match
                      </span>
                    </div>

                    {/* Overlapping Skills Section */}
                    <div className="space-y-1.5">
                      <div className="text-[10px] font-bold text-[var(--text-muted)] uppercase tracking-wider flex items-center gap-1">
                        <CheckCircle2 className="w-3.5 h-3.5 text-[#1A7F37] dark:text-[#2DA44E]" /> Overlapping Skills ({job.skill_overlap.length}):
                      </div>
                      {job.skill_overlap.length > 0 ? (
                        <div className="flex flex-wrap gap-1">
                          {job.skill_overlap.map((skill, sIdx) => (
                            <span
                              key={sIdx}
                              className="px-2 py-0.5 rounded-sm text-[10px] bg-[#DAFBE1] text-[#1A7F37] dark:bg-[#2DA44E]/20 dark:text-[#2DA44E] border border-[#2DA44E]/30 font-semibold"
                            >
                              + {skill}
                            </span>
                          ))}
                        </div>
                      ) : (
                        <span className="text-[10px] text-[var(--text-muted)] italic">
                          No direct overlap detected with input
                        </span>
                      )}
                    </div>

                    {/* Critical Skill Gaps Section (Same treatment as Career Path) */}
                    <div className="space-y-1.5 pt-1">
                      <div className="text-[10px] font-bold text-[var(--text-muted)] uppercase tracking-wider flex items-center gap-1">
                        <AlertCircle className="w-3.5 h-3.5 text-[#CF222E]" /> Critical Skill Gaps ({job.skill_gap.length}):
                      </div>
                      {job.skill_gap.length > 0 ? (
                        <div className="flex flex-wrap gap-1">
                          {job.skill_gap.slice(0, 5).map((gap, gIdx) => (
                            <span
                              key={gIdx}
                              className="px-2 py-0.5 rounded-sm text-[10px] bg-[#FFEBE9] text-[#CF222E] dark:bg-[#CF222E]/20 dark:text-[#CF222E] border border-[#CF222E]/30 font-semibold"
                            >
                              - {gap}
                            </span>
                          ))}
                          {job.skill_gap.length > 5 && (
                            <span className="text-[10px] text-[var(--text-muted)] self-center">
                              +{job.skill_gap.length - 5} more
                            </span>
                          )}
                        </div>
                      ) : (
                        <span className="text-[10px] text-[#1A7F37] dark:text-[#2DA44E] font-bold">
                          ✓ All baseline skills present
                        </span>
                      )}
                    </div>
                  </div>

                  {/* Card Footer: Salary */}
                  <div className="border-t border-[var(--border-hairline)] pt-2.5 flex items-center justify-between text-[11px] text-[var(--text-muted)] font-mono">
                    <span>Est. Salary: <strong className="text-[var(--text-main)]">{job.salary_range}</strong></span>
                    <span className="text-[var(--accent-color)] font-bold flex items-center gap-1">
                      View Details <ArrowRight className="w-3 h-3" />
                    </span>
                  </div>
                </div>
              ))}
            </div>
          ) : (
            /* Empty Search Results State */
            <div className="p-10 rounded-sm bg-[var(--bg-surface)] border border-[var(--border-hairline)] text-center space-y-3 text-xs text-[var(--text-muted)] font-mono">
              <Search className="w-8 h-8 text-[var(--text-muted)]/40 mx-auto" />
              <p className="font-bold text-[var(--text-main)] text-sm">
                No matching jobs found for "{skillsQuery}".
              </p>
              <p className="max-w-md mx-auto font-sans text-[11px]">
                Try searching with popular skills like Java, Python, PyTorch, React, or Excel, or select "All (415+)" track above.
              </p>
            </div>
          )}
        </div>
      )}
    </div>
  );
};

