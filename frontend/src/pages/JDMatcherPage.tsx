import React, { useState, useEffect, useCallback, useMemo } from 'react';
import { api, JDMatchResponse, JobMatch } from '../lib/api';
import { DiffStatDisplay } from '../components/ui/DiffStatDisplay';
import { FileUpload } from '../components/ui/FileUpload';
import { 
  FileCheck2, 
  CheckCircle2, 
  AlertCircle, 
  RefreshCw,
  GitCompare,
  Briefcase,
  Search,
  Filter,
  Building2,
  Sparkles,
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
    <div className="p-6 md:p-10 max-w-7xl mx-auto space-y-10 text-[var(--text-main)] animate-fade-in">
      {/* Header */}
      <div className="flex flex-col md:flex-row md:items-end justify-between gap-4">
        <div>
          <h1 className="h-section text-2xl md:text-3xl">
            Job matcher
          </h1>
          <p className="caption mt-1">Compare your resume against a role, or browse matching jobs.</p>
        </div>

        {/* Tab Switcher — quiet segmented control */}
        <div className="segment">
          <button
            onClick={() => setActiveTab('pairwise')}
            className={`segment-btn ${activeTab === 'pairwise' ? 'segment-btn-active' : ''}`}
          >
            <GitCompare className="w-3.5 h-3.5" /> Compare
          </button>
          <button
            onClick={() => setActiveTab('browse')}
            className={`segment-btn ${activeTab === 'browse' ? 'segment-btn-active' : ''}`}
          >
            <Briefcase className="w-3.5 h-3.5" /> Browse jobs ({jobs.length})
          </button>
        </div>
      </div>

      {error && (
        <div className="p-4 rounded-xl bg-[var(--diff-del-bg)] text-[var(--diff-del)] text-sm flex items-center gap-2">
          <AlertCircle className="w-4 h-4 shrink-0" />
          <span>{error}</span>
        </div>
      )}

      {activeTab === 'pairwise' ? (
        <div className="space-y-8">
          {/* Two-Panel Pairwise Layout */}
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
            {/* Left Panel: inputs */}
            <div className="space-y-6">
              <div className="card p-6 md:p-8 space-y-5">
                <div className="flex items-center justify-between gap-3">
                  <div>
                    <h2 className="font-semibold text-[16px] tracking-tight">Your documents</h2>
                    <p className="caption mt-0.5">Paste text or upload files — either works.</p>
                  </div>

                  <div className="segment">
                    <button
                      type="button"
                      onClick={() => setInputMode('paste')}
                      className={`segment-btn ${inputMode === 'paste' ? 'segment-btn-active' : ''}`}
                    >
                      Paste text
                    </button>
                    <button
                      type="button"
                      onClick={() => setInputMode('upload')}
                      className={`segment-btn ${inputMode === 'upload' ? 'segment-btn-active' : ''}`}
                    >
                      Upload
                    </button>
                  </div>
                </div>

                {inputMode === 'paste' ? (
                  <>
                    <div className="field">
                      <label className="field-label">
                        Your resume
                      </label>
                      <textarea
                        rows={4}
                        value={resumeText}
                        onChange={(e) => setResumeText(e.target.value)}
                        placeholder="Paste your resume text…"
                        className="input-glow p-3.5"
                      />
                    </div>

                    <div className="field">
                      <label className="field-label">
                        Job description
                      </label>
                      <textarea
                        rows={6}
                        value={jdText}
                        onChange={(e) => setJdText(e.target.value)}
                        placeholder="Paste the job requirements…"
                        className="input-glow p-3.5"
                      />
                    </div>
                  </>
                ) : (
                  <div className="space-y-5">
                    <FileUpload
                      label="Resume file"
                      subLabel="PDF, DOCX or TXT"
                      file={resumeFile}
                      onFileSelect={setResumeFile}
                      icon={<FileCheck2 className="w-4 h-4 text-[var(--accent-color)]" />}
                    />

                    <FileUpload
                      label="Job description file"
                      subLabel="PDF, DOCX or TXT"
                      file={jdFile}
                      onFileSelect={setJdFile}
                      icon={<Briefcase className="w-4 h-4 text-emerald-500" />}
                    />

                    <p className="caption">
                      You can mix a file with pasted text — pasted text is used wherever no file is attached.
                    </p>
                  </div>
                )}

                <button
                  onClick={handleCalculateMatch}
                  disabled={loading}
                  className="btn-primary w-full py-3.5 px-4 text-sm"
                >
                  {loading ? (
                    <>
                      <RefreshCw className="w-4 h-4 animate-spin" /> Comparing…
                    </>
                  ) : (
                    <>
                      <FileCheck2 className="w-4 h-4" /> Calculate match
                    </>
                  )}
                </button>
              </div>
            </div>

            {/* Right Panel: Results */}
            <div className="space-y-6">
              {result ? (
                <div className="space-y-6">
                  <DiffStatDisplay score={result.match_percent} label="Resume and role similarity" />

                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                    <div className="card p-4 space-y-2">
                      <p className="font-semibold text-[13.5px] text-[var(--success)] flex items-center gap-1.5">
                        <CheckCircle2 className="w-4 h-4" /> Matching skills ({result.skill_overlap.length})
                      </p>
                      <div className="flex flex-wrap gap-1.5">
                        {result.skill_overlap.map((skill, idx) => (
                          <span key={idx} className="chip chip-success">
                            {skill}
                          </span>
                        ))}
                      </div>
                    </div>

                    <div className="card p-4 space-y-2">
                      <p className="font-semibold text-[13.5px] text-[var(--diff-del)] flex items-center gap-1.5">
                        <AlertCircle className="w-4 h-4" /> Skills to learn ({result.skill_gap.length})
                      </p>
                      <div className="flex flex-wrap gap-1.5">
                        {result.skill_gap.map((skill, idx) => (
                          <span key={idx} className="chip chip-danger">
                            {skill}
                          </span>
                        ))}
                      </div>
                    </div>
                  </div>
                </div>
              ) : (
                <div className="card p-8 text-center min-h-[350px] flex flex-col items-center justify-center">
                  <GitCompare className="w-8 h-8 text-[var(--text-subtle)] mx-auto" />
                  <p className="font-semibold text-[15px] mt-3">
                    No comparison yet
                  </p>
                  <p className="caption max-w-xs mt-1">
                    Add your resume and a job description, then calculate the match.
                  </p>
                </div>
              )}
            </div>
          </div>

          {/* Unified Job Recommendations Section below Matcher */}
          {jobs.length > 0 && (
            <div className="pt-8 space-y-4">
              <div className="flex items-center justify-between">
                <h3 className="font-semibold text-[15px] tracking-tight">Suggested roles</h3>
                <button
                  onClick={() => setActiveTab('browse')}
                  className="btn-tertiary"
                >
                  View all ({jobs.length}) →
                </button>
              </div>

              <div className="grid grid-cols-1 md:grid-cols-3 gap-4 stagger-children">
                {jobs.slice(0, 3).map((job) => (
                  <div key={job.job_id} className="card card-lift p-5">
                    <div className="flex items-start justify-between gap-2">
                      <div>
                        <h4 className="font-semibold text-sm tracking-tight">{job.job_role}</h4>
                        <p className="caption mt-0.5">{job.domain} • {job.experience_label}</p>
                      </div>
                      <span className="chip chip-success shrink-0 tabular-nums">
                        {job.match_pct}%
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
        <div className="space-y-6">
          <div className="card p-4 flex flex-col sm:flex-row sm:items-center justify-between gap-3">
            <div>
              <p className="font-semibold text-[14px] tracking-tight">
                Browse 415+ roles
              </p>
              <p className="caption mt-0.5">Filter by track, then search your skills.</p>
            </div>

            {/* Track Switcher Control */}
            <div className="segment">
              <button
                type="button"
                onClick={() => handleTrackChange('all')}
                className={`segment-btn ${trackFilter === 'all' ? 'segment-btn-active' : ''}`}
              >
                <Layers className="w-3.5 h-3.5" /> All
              </button>
              <button
                type="button"
                onClick={() => handleTrackChange('technical')}
                className={`segment-btn ${trackFilter === 'technical' ? 'segment-btn-active' : ''}`}
              >
                <Code2 className="w-3.5 h-3.5" /> Technical
              </button>
              <button
                type="button"
                onClick={() => handleTrackChange('general')}
                className={`segment-btn ${trackFilter === 'general' ? 'segment-btn-active' : ''}`}
              >
                <BriefcaseIcon className="w-3.5 h-3.5" /> Non-technical
              </button>
            </div>
          </div>

          {/* Search Controls Form */}
          <div className="card p-5 space-y-4">
            <form onSubmit={handleSearchSubmit} className="flex flex-col md:flex-row items-center gap-3">
              <div className="relative flex-1 w-full">
                <Search className="w-4 h-4 text-[var(--text-muted)] absolute left-3.5 top-3.5" />
                <input
                  type="text"
                  value={skillsQuery}
                  onChange={(e) => setSkillsQuery(e.target.value)}
                  placeholder="Your skills, e.g. Python, React, Docker…"
                  className="input-glow pl-10 pr-3 py-2.5"
                />
              </div>

              <div className="relative w-full md:w-56">
                <Filter className="w-4 h-4 text-[var(--text-muted)] absolute left-3.5 top-3.5" />
                <select
                  value={selectedDomain}
                  onChange={(e) => setSelectedDomain(e.target.value)}
                  className="input-glow pl-10 pr-8 py-2.5"
                >
                  {domains.map((dom) => (
                    <option key={dom} value={dom}>
                      {dom === 'All' ? 'All domains' : dom}
                    </option>
                  ))}
                </select>
              </div>

              <button
                type="submit"
                disabled={jobsLoading}
                className="btn-primary w-full md:w-auto px-6 py-2.5 text-sm"
              >
                {jobsLoading ? <RefreshCw className="w-4 h-4 animate-spin" /> : 'Search'}
              </button>
            </form>

            {/* Quick Skill Search Chips with Multi-Select Toggling */}
            <div className="flex flex-wrap items-center gap-1.5">
              <span className="caption mr-1">
                {trackFilter === 'general' ? 'Suggestions' : trackFilter === 'technical' ? 'Suggestions' : 'Popular'}
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
                    className={`px-2.5 py-1 rounded-full text-[12px] font-medium border transition-all cursor-pointer ${
                      isSelected
                        ? 'bg-[var(--text-main)] text-[var(--bg-paper)] border-transparent'
                        : 'bg-[var(--bg-surface)] text-[var(--text-muted)] border-[var(--border-hairline)] hover:text-[var(--text-main)] hover:border-[var(--border-strong)]'
                    }`}
                  >
                    {isSelected ? '✓ ' : '+ '}{preset}
                  </button>
                );
              })}
            </div>
          </div>

          <div className="flex items-center justify-between">
            <h3 className="font-semibold text-[15px] tracking-tight flex items-center gap-1.5">
              <Sparkles className="w-4 h-4 text-[var(--accent-color)]" /> Results ({jobs.length})
            </h3>
            <span className="caption capitalize">
              {trackFilter} track · {jobs.length} {jobs.length === 1 ? 'role' : 'roles'}
            </span>
          </div>

          {/* Job Recommendation Cards Grid */}
          {jobs.length > 0 ? (
            <div className="grid grid-cols-1 md:grid-cols-3 gap-4 stagger-children">
              {jobs.map((job) => (
                <div
                  key={job.job_id}
                  className="card card-lift p-5 flex flex-col justify-between"
                >
                  <div className="space-y-3">
                    <div className="flex items-start justify-between gap-2">
                      <div>
                        <h4 className="font-semibold text-sm tracking-tight leading-snug">
                          {job.job_role}
                        </h4>
                        <p className="caption flex items-center gap-1 mt-0.5">
                          <Building2 className="w-3.5 h-3.5 shrink-0" /> {job.domain} • {job.experience_label}
                        </p>
                      </div>

                      <span className="chip chip-success shrink-0 tabular-nums">
                        {job.match_pct}%
                      </span>
                    </div>

                    <div className="space-y-1.5">
                      <p className="caption font-medium flex items-center gap-1">
                        <CheckCircle2 className="w-3.5 h-3.5 text-[var(--success)]" /> You have ({job.skill_overlap.length})
                      </p>
                      {job.skill_overlap.length > 0 ? (
                        <div className="flex flex-wrap gap-1">
                          {job.skill_overlap.map((skill, sIdx) => (
                            <span key={sIdx} className="chip chip-success">
                              {skill}
                            </span>
                          ))}
                        </div>
                      ) : (
                        <span className="caption italic">
                          No direct overlap with your input
                        </span>
                      )}
                    </div>

                    <div className="space-y-1.5">
                      <p className="caption font-medium flex items-center gap-1">
                        <AlertCircle className="w-3.5 h-3.5 text-[var(--diff-del)]" /> To learn ({job.skill_gap.length})
                      </p>
                      {job.skill_gap.length > 0 ? (
                        <div className="flex flex-wrap gap-1">
                          {job.skill_gap.slice(0, 5).map((gap, gIdx) => (
                            <span key={gIdx} className="chip chip-danger">
                              {gap}
                            </span>
                          ))}
                          {job.skill_gap.length > 5 && (
                            <span className="caption self-center">
                              +{job.skill_gap.length - 5} more
                            </span>
                          )}
                        </div>
                      ) : (
                        <span className="caption font-medium text-[var(--success)]">
                          All baseline skills present
                        </span>
                      )}
                    </div>
                  </div>

                  <p className="caption pt-3 mt-3 border-t border-[var(--border-hairline)]">
                    Est. salary <strong className="text-[var(--text-main)]">{job.salary_range}</strong>
                  </p>
                </div>
              ))}
            </div>
          ) : (
            <div className="card p-10 text-center">
              <Search className="w-8 h-8 text-[var(--text-subtle)] mx-auto" />
              <p className="font-semibold text-[15px] mt-3">
                No matches for “{skillsQuery}”
              </p>
              <p className="caption max-w-md mx-auto mt-1">
                Try popular skills like Python, React, or Excel — or switch to the All track.
              </p>
            </div>
          )}
        </div>
      )}
    </div>
  );
};

