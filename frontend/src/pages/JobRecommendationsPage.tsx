import React, { useEffect, useState, useCallback } from 'react';
import { api, JobMatch } from '../lib/api';
import { 
  Search, 
  Filter, 
  CheckCircle2, 
  AlertCircle, 
  DollarSign, 
  RefreshCw,
  Building2,
  GitBranch
} from 'lucide-react';

/*
  ================================================================================
  PERFORMANCE OPTIMIZATION: Memoized Job Match Card Component (Theme-Harmonized)
  ================================================================================
*/
interface JobMatchCardProps {
  job: JobMatch;
}

const JobMatchCard: React.FC<JobMatchCardProps> = React.memo(({ job }) => {
  const matchPct = Math.round(job.blended_score * 100);

  return (
    <div className="card-lift glass-card rounded-2xl p-5 space-y-4 flex flex-col justify-between font-mono text-xs">
      <div className="space-y-3">
        {/* Role Title & Match Tag */}
        <div className="flex items-start justify-between gap-2 border-b border-[var(--border-hairline)] pb-3">
          <div>
            <h3 className="font-extrabold text-sm text-[var(--text-main)] font-sans leading-tight">
              {job.job_role}
            </h3>
            <p className="text-[11px] font-mono text-[var(--text-muted)] flex items-center gap-1 mt-1">
              <Building2 className="w-3 h-3 text-[var(--accent-color)]" /> {job.domain} • {job.experience_label}
            </p>
          </div>

          <span className="px-2.5 py-1 rounded-lg text-[11px] font-bold bg-[var(--diff-add-bg)] text-[var(--diff-add)] border border-[var(--diff-add)]/30 shrink-0">
            +{matchPct}% match
          </span>
        </div>

        {/* Score Bar */}
        <div className="space-y-1">
          <div className="flex justify-between text-[10px] text-[var(--text-muted)] uppercase font-bold">
            <span>Blended Cosine Score</span>
            <span className="text-[var(--diff-add)]">{(job.blended_score * 100).toFixed(1)}%</span>
          </div>
          <div className="h-1.5 w-full bg-[var(--bg-paper)] rounded-full border border-[var(--border-hairline)] overflow-hidden">
            <div
              style={{ width: `${matchPct}%` }}
              className="h-full bg-[var(--diff-add)] rounded-full"
            />
          </div>
        </div>

        {/* Salary Range */}
        {job.has_salary_data && (
          <div className="text-[11px] font-bold text-[var(--diff-add)] flex items-center gap-1">
            <DollarSign className="w-3.5 h-3.5" /> {job.salary_range}
          </div>
        )}

        {/* Skill Overlap Chips (+ Green) */}
        <div className="space-y-1 pt-1">
          <p className="text-[10px] font-bold text-[var(--text-muted)] uppercase tracking-wider">
            Matching Overlap (+{job.skill_overlap.length})
          </p>
          <div className="flex flex-wrap gap-1">
            {job.skill_overlap.map((skill, sIdx) => (
              <span
                key={`job-${job.job_id}-skill-${skill}-${sIdx}`}
                className="px-2 py-0.5 rounded-md text-[11px] bg-[var(--diff-add-bg)] text-[var(--diff-add)] border border-[var(--diff-add)]/30 flex items-center gap-1 font-mono"
              >
                <CheckCircle2 className="w-3 h-3" /> {skill}
              </span>
            ))}
          </div>
        </div>

        {/* Skill Gap Chips (- Red) */}
        {job.skill_gap && job.skill_gap.length > 0 && (
          <div className="space-y-1">
            <p className="text-[10px] font-bold text-[var(--text-muted)] uppercase tracking-wider">
              Missing Gaps (-{job.skill_gap.length})
            </p>
            <div className="flex flex-wrap gap-1">
              {job.skill_gap.slice(0, 5).map((skill, gIdx) => (
                <span
                  key={`job-${job.job_id}-gap-${skill}-${gIdx}`}
                  className="px-2 py-0.5 rounded-md text-[11px] bg-[var(--diff-del-bg)] text-[var(--diff-del)] border border-[var(--diff-del)]/30 flex items-center gap-1 font-mono"
                >
                  <AlertCircle className="w-3 h-3" /> {skill}
                </span>
              ))}
            </div>
          </div>
        )}
      </div>
    </div>
  );
});

JobMatchCard.displayName = 'JobMatchCard';

export const JobRecommendationsPage: React.FC = () => {
  const [skillsQuery, setSkillsQuery] = useState('Python, Machine Learning, PyTorch, FastAPI, Docker');
  const [selectedDomain, setSelectedDomain] = useState<string>('All');
  const [domains, setDomains] = useState<string[]>([]);
  const [jobs, setJobs] = useState<JobMatch[]>([]);
  const [loading, setLoading] = useState<boolean>(true);
  const [error, setError] = useState<string | null>(null);

  // Load available domains on mount
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

  // Fetch job recommendations (Callback memoized)
  const handleFetchRecommendations = useCallback(async () => {
    setLoading(true);
    setError(null);
    try {
      const domainFilter = selectedDomain === 'All' ? undefined : selectedDomain;
      const res = await api.recommendSkills(skillsQuery, 12, 0.75, domainFilter);
      setJobs(res.matches);
    } catch (err: any) {
      console.error("Job recommendation error:", err);
      setError("Failed to fetch job matches from API. Ensure FastAPI server is online.");
    } finally {
      setLoading(false);
    }
  }, [skillsQuery, selectedDomain]);

  useEffect(() => {
    handleFetchRecommendations();
  }, [selectedDomain]);

  return (
    <div className="p-6 md:p-10 max-w-7xl mx-auto space-y-8 font-sans text-[var(--text-main)] animate-fade-in">
      {/* Header */}
      <div className="border-b border-[var(--border-hairline)] pb-4 flex flex-col md:flex-row md:items-center justify-between gap-4 font-mono">
        <div>
          <div className="text-xs font-bold text-[var(--text-muted)] uppercase flex items-center gap-1.5 mb-1">
            <GitBranch className="w-3.5 h-3.5 text-[var(--accent-color)]" /> $ skillsync recommend --skills
          </div>
          <h1 className="text-2xl md:text-3xl font-extrabold tracking-tight text-[var(--text-main)] font-sans">
            Semantic Job Recommendations
          </h1>
        </div>

        <span className="text-xs font-mono text-[var(--text-muted)] bg-[var(--bg-surface)] px-3 py-1 border border-[var(--border-hairline)] rounded-lg">
          indexed: 415+ engineering roles
        </span>
      </div>

      {/* Search & Domain Filter Bar */}
      <div className="p-5 rounded-2xl glass-card space-y-4 font-mono text-xs">
        <div className="flex flex-col md:flex-row items-center gap-3">
          {/* Skill Query Input */}
          <div className="relative flex-1 w-full">
            <Search className="w-4 h-4 text-[var(--text-muted)] absolute left-3.5 top-3.5" />
            <input
              type="text"
              value={skillsQuery}
              onChange={(e) => setSkillsQuery(e.target.value)}
              placeholder="Search by comma-separated skills (e.g. Python, React, Kubernetes)"
              className="w-full pl-10 pr-3 py-2.5 rounded-xl border border-[var(--border-hairline)] bg-[var(--bg-paper)] text-xs font-mono text-[var(--text-main)] input-glow focus:outline-none"
            />
          </div>

          {/* Domain Dropdown */}
          <div className="relative w-full md:w-56">
            <Filter className="w-4 h-4 text-[var(--text-muted)] absolute left-3.5 top-3.5" />
            <select
              value={selectedDomain}
              onChange={(e) => setSelectedDomain(e.target.value)}
              className="w-full pl-10 pr-8 py-2.5 rounded-xl border border-[var(--border-hairline)] bg-[var(--bg-paper)] text-xs font-mono text-[var(--text-main)] input-glow focus:outline-none cursor-pointer"
            >
              {domains.map((dom) => (
                <option key={dom} value={dom}>
                  {dom === 'All' ? 'All Domains' : dom}
                </option>
              ))}
            </select>
          </div>

          {/* Match Button */}
          <button
            onClick={handleFetchRecommendations}
            disabled={loading}
            className="w-full md:w-auto px-6 py-2.5 rounded-xl btn-accent font-mono font-bold text-xs flex items-center justify-center gap-2 shrink-0 cursor-pointer shadow-md"
          >
            {loading ? (
              <RefreshCw className="w-4 h-4 animate-spin" />
            ) : (
              <span>$ execute --match</span>
            )}
          </button>
        </div>
      </div>

      {error && (
        <div className="p-4 rounded-xl bg-[var(--diff-del-bg)] border border-[var(--diff-del)]/40 text-[var(--diff-del)] font-mono text-xs flex items-center gap-2">
          <AlertCircle className="w-4 h-4 shrink-0" />
          <span>{error}</span>
        </div>
      )}

      {/* Loading State Skeleton */}
      {loading ? (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6 stagger-children">
          {[1, 2, 3, 4, 5, 6].map((n) => (
            <div key={`skeleton-${n}`} className="p-5 rounded-2xl glass-card space-y-4 animate-pulse font-mono">
              <div className="h-4 bg-[var(--bg-paper)] rounded-lg w-3/4" />
              <div className="h-3 bg-[var(--bg-paper)] rounded-lg w-1/2" />
              <div className="h-2 bg-[var(--bg-paper)] rounded-lg w-full" />
            </div>
          ))}
        </div>
      ) : (
        /* Memoized Job Recommendation Cards Grid */
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6 stagger-children">
          {jobs.map((job) => (
            <JobMatchCard key={job.job_id} job={job} />
          ))}
        </div>
      )}
    </div>
  );
};
