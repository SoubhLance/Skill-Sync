import React, { useState, useEffect, useCallback } from 'react';
import { api, JDMatchResponse, JobMatch } from '../lib/api';
import { DiffStatDisplay } from '../components/ui/DiffStatDisplay';
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
  DollarSign,
  Building2
} from 'lucide-react';

/*
  ================================================================================
  UNIFIED JD MATCHER & JOB RECOMMENDATIONS SECTION
  ================================================================================
  - Single unified flow: Paste/upload a JD -> compute match % and gaps -> browse suggested job matches.
  - Tabbed or single-view access to full semantic search across 415+ engineering roles.
  ================================================================================
*/

export const JDMatcherPage: React.FC = () => {
  const [activeTab, setActiveTab] = useState<'pairwise' | 'browse'>('pairwise');

  // Pairwise JD Matcher state
  const [inputMode, setInputMode] = useState<'paste' | 'upload'>('paste');
  const [resumeText, setResumeText] = useState(
    `Experienced Software Engineer proficient in Python, FastAPI, PyTorch, React, TypeScript, Docker, SQL, and REST APIs. Built machine learning pipelines and microservices.`
  );
  const [jdText, setJdText] = useState(
    `We are looking for a Senior ML & Backend Engineer. Requirements: Strong Python skills, FastAPI expertise, PyTorch or TensorFlow, Docker, Kubernetes, AWS, PostgreSQL, and GraphQL.`
  );
  const [file, setFile] = useState<File | null>(null);
  const [loading, setLoading] = useState(false);
  const [result, setResult] = useState<JDMatchResponse | null>(null);
  const [error, setError] = useState<string | null>(null);

  // Job Matches Search State
  const [skillsQuery, setSkillsQuery] = useState('Python, Machine Learning, PyTorch, FastAPI, Docker');
  const [selectedDomain, setSelectedDomain] = useState<string>('All');
  const [domains, setDomains] = useState<string[]>([]);
  const [jobs, setJobs] = useState<JobMatch[]>([]);
  const [jobsLoading, setJobsLoading] = useState<boolean>(false);

  useEffect(() => {
    const fetchDomains = async () => {
      try {
        const domainList = await api.getDomains();
        setDomains(['All', ...domainList]);
      } catch (err) {
        console.warn("Failed to fetch domain filter list", err);
      }
    };
    fetchDomains();
  }, []);

  const handleCalculateMatch = useCallback(async () => {
    if (!jdText.trim() || loading) return;
    setLoading(true);
    setError(null);
    try {
      const data = await api.jdMatch({
        resume_text: resumeText.trim() || undefined,
        jd_text: jdText.trim(),
      });
      setResult(data);

      // Auto-fetch related job recommendations
      if (data.skill_overlap.length > 0) {
        const query = data.skill_overlap.join(', ');
        setSkillsQuery(query);
        const res = await api.recommendSkills(query, 6, 0.75);
        setJobs(res.matches);
      }
    } catch (err: any) {
      console.error("JD match error:", err);
      setError(err?.response?.data?.detail || "Pairwise JD matching failed.");
    } finally {
      setLoading(false);
    }
  }, [jdText, resumeText, loading]);

  const handleFetchRecommendations = useCallback(async () => {
    setJobsLoading(true);
    try {
      const domainFilter = selectedDomain === 'All' ? undefined : selectedDomain;
      const res = await api.recommendSkills(skillsQuery, 12, 0.75, domainFilter);
      setJobs(res.matches);
    } catch (err: any) {
      console.error("Job recommendation error:", err);
    } finally {
      setJobsLoading(false);
    }
  }, [skillsQuery, selectedDomain]);

  useEffect(() => {
    if (activeTab === 'browse') {
      handleFetchRecommendations();
    }
  }, [activeTab, selectedDomain]);

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
            className={`flex items-center gap-1.5 px-3 py-1.5 font-bold rounded-sm transition-all ${
              activeTab === 'pairwise' ? 'btn-accent shadow-sm' : 'text-[var(--text-muted)]'
            }`}
          >
            <GitCompare className="w-3.5 h-3.5" /> Pairwise JD Analysis
          </button>
          <button
            onClick={() => setActiveTab('browse')}
            className={`flex items-center gap-1.5 px-3 py-1.5 font-bold rounded-sm transition-all ${
              activeTab === 'browse' ? 'btn-accent shadow-sm' : 'text-[var(--text-muted)]'
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
                      className={`px-2 py-1 text-[10px] font-bold rounded-sm ${
                        inputMode === 'paste' ? 'btn-accent' : 'text-[var(--text-muted)]'
                      }`}
                    >
                      Paste Text
                    </button>
                    <button
                      type="button"
                      onClick={() => setInputMode('upload')}
                      className={`px-2 py-1 text-[10px] font-bold rounded-sm ${
                        inputMode === 'upload' ? 'btn-accent' : 'text-[var(--text-muted)]'
                      }`}
                    >
                      PDF Upload
                    </button>
                  </div>
                </div>

                <div>
                  <label className="block text-[10px] font-bold text-[var(--text-muted)] uppercase mb-1">
                    Candidate Resume Content
                  </label>
                  <textarea
                    rows={4}
                    value={resumeText}
                    onChange={(e) => setResumeText(e.target.value)}
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
                    className="w-full p-3 rounded-sm border border-[var(--border-hairline)] bg-[var(--bg-paper)] text-xs font-mono text-[var(--text-main)] focus:outline-none focus:border-[var(--accent-color)]"
                  />
                </div>

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
                  className="text-xs text-[var(--accent-color)] font-bold hover:underline"
                >
                  View All 415+ Roles →
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
                      <span className="px-2 py-0.5 rounded-sm text-[10px] font-bold bg-[#DAFBE1] text-[#1A7F37] border border-[#2DA44E]/30">
                        +{(job.blended_score * 100).toFixed(0)}% match
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
          <div className="p-5 rounded-sm bg-[var(--bg-surface)] border border-[var(--border-hairline)] space-y-4">
            <div className="flex flex-col md:flex-row items-center gap-3">
              <div className="relative flex-1 w-full">
                <Search className="w-4 h-4 text-[var(--text-muted)] absolute left-3 top-3" />
                <input
                  type="text"
                  value={skillsQuery}
                  onChange={(e) => setSkillsQuery(e.target.value)}
                  placeholder="Search by comma-separated skills (e.g. Python, PyTorch, React)"
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
                onClick={handleFetchRecommendations}
                disabled={jobsLoading}
                className="w-full md:w-auto px-5 py-2.5 rounded-sm btn-accent font-mono font-bold text-xs flex items-center justify-center gap-2 cursor-pointer border border-transparent"
              >
                {jobsLoading ? <RefreshCw className="w-4 h-4 animate-spin" /> : <span>$ search</span>}
              </button>
            </div>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-3 gap-6 font-sans">
            {jobs.map((job) => (
              <div key={job.job_id} className="p-5 rounded-sm bg-[var(--bg-surface)] border border-[var(--border-hairline)] space-y-3 font-mono text-xs">
                <div className="flex items-start justify-between border-b border-[var(--border-hairline)] pb-3">
                  <div>
                    <h4 className="font-extrabold text-sm text-[var(--text-main)] font-sans">{job.job_role}</h4>
                    <p className="text-[11px] text-[var(--text-muted)] flex items-center gap-1 mt-1">
                      <Building2 className="w-3.5 h-3.5" /> {job.domain} • {job.experience_label}
                    </p>
                  </div>
                  <span className="px-2 py-0.5 rounded-sm text-[10px] font-bold bg-[#DAFBE1] text-[#1A7F37] border border-[#2DA44E]/30 shrink-0">
                    +{(job.blended_score * 100).toFixed(0)}% match
                  </span>
                </div>

                <div className="space-y-1">
                  <div className="text-[10px] font-bold text-[var(--text-muted)] uppercase">Overlapping Skills:</div>
                  <div className="flex flex-wrap gap-1">
                    {job.skill_overlap.map((skill, sIdx) => (
                      <span key={sIdx} className="px-2 py-0.5 rounded-sm text-[10px] bg-[#DAFBE1] text-[#1A7F37] border border-[#2DA44E]/30">
                        + {skill}
                      </span>
                    ))}
                  </div>
                </div>
              </div>
            ))}
          </div>
        </div>
      )}
    </div>
  );
};
