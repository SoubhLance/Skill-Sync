import React, { useState, useEffect, useMemo, Fragment } from 'react';
import { Link } from 'react-router-dom';
import {
  Search,
  Building2,
  CheckCircle2,
  AlertCircle,
  BookOpen,
  ArrowRight,
  Layers,
  Code2,
  BriefcaseIcon,
  Filter,
  Sparkles,
  UserCheck,
  UserX,
  Target,
  ChevronDown,
  LayoutGrid,
  Minimize2,
} from 'lucide-react';
import { loadJobTaxonomy, JobTaxonomyItem, getDefaultJobs, getDefaultDomains } from '../lib/jobTaxonomy';
import { evaluateSkillMatch, isTechJob } from '../lib/scoring';
import { useUserProfile } from '../lib/userProfile';
import { useAuth } from '../context/AuthContext';

export const JobExplorerPage: React.FC = () => {
  const { user } = useAuth();
  const {
    skills: userSkills,
    profileScore,
    dsaScore,
    hasSkillsOnFile,
    setSkills,
    clearSkills,
    loadSampleProfile,
  } = useUserProfile(user?.uid);

  // Job Taxonomy State
  const [jobs, setJobs] = useState<JobTaxonomyItem[]>(() => getDefaultJobs());
  const [domains, setDomains] = useState<string[]>(() => getDefaultDomains());
  const [loading, setLoading] = useState(false);

  // Filters State
  const [searchQuery, setSearchQuery] = useState('');
  const [trackFilter, setTrackFilter] = useState<'all' | 'technical' | 'general'>('all');
  const [selectedDomain, setSelectedDomain] = useState<string>('All');

  // Expanded Role ID — single accordion: one card enlarged at a time (null = all collapsed)
  const [expandedJobId, setExpandedJobId] = useState<number | null>(null);

  // Pagination for the card grid (400+ roles is too heavy to render at once)
  const PAGE_SIZE = 24;
  const [visibleCount, setVisibleCount] = useState(PAGE_SIZE);

  // Load backend jobs or fallback
  useEffect(() => {
    let mounted = true;
    const initTaxonomy = async () => {
      setLoading(true);
      try {
        const data = await loadJobTaxonomy();
        if (mounted) {
          setJobs(data.jobs);
          setDomains(data.domains);
          // Enlarge the first role by default so users discover the expand interaction
          if (data.jobs.length > 0 && expandedJobId === null) {
            setExpandedJobId(data.jobs[0].job_id);
          }
        }
      } catch (err) {
        console.warn('Job taxonomy loading notice:', err);
      } finally {
        if (mounted) setLoading(false);
      }
    };
    initTaxonomy();
    return () => {
      mounted = false;
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  // Filter jobs by track, domain, and title search
  const filteredJobs = useMemo(() => {
    let list = jobs;

    // 1. Track filter (Technical vs Non-technical)
    if (trackFilter === 'technical') {
      list = list.filter((j) => isTechJob(j));
    } else if (trackFilter === 'general') {
      list = list.filter((j) => !isTechJob(j));
    }

    // 2. Domain dropdown filter
    if (selectedDomain && selectedDomain !== 'All') {
      const domLower = selectedDomain.toLowerCase();
      list = list.filter((j) => j.domain.toLowerCase().includes(domLower));
    }

    // 3. Search query filtering on job_role title
    if (searchQuery.trim()) {
      const q = searchQuery.toLowerCase().trim();
      list = list.filter(
        (j) =>
          j.job_role.toLowerCase().includes(q) ||
          j.domain.toLowerCase().includes(q)
      );
    }

    return list;
  }, [jobs, trackFilter, selectedDomain, searchQuery]);

  // Reset pagination whenever filters change
  useEffect(() => {
    setVisibleCount(PAGE_SIZE);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [searchQuery, trackFilter, selectedDomain]);

  // Collapse the enlarged card if it is filtered out of view
  useEffect(() => {
    if (expandedJobId !== null && !filteredJobs.some((j) => j.job_id === expandedJobId)) {
      setExpandedJobId(null);
    }
  }, [filteredJobs, expandedJobId]);

  // Paginated slice of the filtered catalog for the card grid
  const visibleJobs = useMemo(
    () => filteredJobs.slice(0, visibleCount),
    [filteredJobs, visibleCount]
  );

  // The currently enlarged job item
  const expandedJob = useMemo(() => {
    if (expandedJobId === null) return null;
    return jobs.find((j) => j.job_id === expandedJobId) || null;
  }, [expandedJobId, jobs]);

  // Match % per visible card (memoized — only scored for rendered cards, not all 400+)
  const matchById = useMemo(() => {
    const map = new Map<number, number>();
    if (!hasSkillsOnFile) return map;
    for (const job of visibleJobs) {
      try {
        const m = evaluateSkillMatch(
          job.skills_list,
          userSkills,
          job.job_role,
          profileScore,
          dsaScore
        );
        map.set(job.job_id, m.match_pct);
      } catch {
        /* leave unscored on engine errors */
      }
    }
    return map;
  }, [visibleJobs, hasSkillsOnFile, userSkills, profileScore, dsaScore]);

  // Evaluated Match for the enlarged job using the exact shared scoring engine
  const evaluatedMatch = useMemo(() => {
    if (!expandedJob) return null;
    return evaluateSkillMatch(
      expandedJob.skills_list,
      userSkills,
      expandedJob.job_role,
      profileScore,
      dsaScore
    );
  }, [expandedJob, userSkills, profileScore, dsaScore]);

  // Toggle detail row: clicking the open card collapses it, otherwise opens its full-width panel
  const toggleExpand = (jobId: number) => {
    const willExpand = expandedJobId !== jobId;
    setExpandedJobId(willExpand ? jobId : null);
    if (willExpand) {
      requestAnimationFrame(() => {
        document
          .getElementById(`role-detail-${jobId}`)
          ?.scrollIntoView({ behavior: 'smooth', block: 'nearest' });
      });
    }
  };

  const [isEditorOpen, setIsEditorOpen] = useState(false);
  const [customSkillsInput, setCustomSkillsInput] = useState('');

  const handleSaveCustomSkills = (e: React.FormEvent) => {
    e.preventDefault();
    const parsed = customSkillsInput
      .split(',')
      .map((s) => s.trim())
      .filter(Boolean);
    if (parsed.length > 0) {
      setSkills(parsed);
      setIsEditorOpen(false);
    }
  };

  return (
    <div className="p-6 md:p-10 max-w-7xl mx-auto space-y-8 text-[var(--text-main)] animate-fade-in">
      {/* ── Page Header ────────────────────────────────────────── */}
      <div className="flex flex-col md:flex-row md:items-end justify-between gap-4">
        <div>
          <div className="flex items-center gap-2 mb-1">
            <span className="caption flex items-center gap-1.5 uppercase font-semibold text-[11px] tracking-wider text-[var(--accent-color)]">
              <Target className="w-3.5 h-3.5" /> Role-First Intelligence
            </span>
          </div>
          <h1 className="h-section text-2xl md:text-3xl">
            Job Explorer
          </h1>
          <p className="caption mt-1">
            Browse 400+ roles, inspect core skill requirements, and evaluate ATS alignment.
          </p>
        </div>

        {/* Profile Signal Status Toggle Bar */}
        <div className="flex flex-col items-end gap-2">
          <div className="card p-2 px-3.5 flex items-center gap-3 self-start md:self-auto text-xs">
            <div className="flex items-center gap-2">
              {hasSkillsOnFile ? (
                <span className="flex items-center gap-1.5 text-[var(--success)] font-medium">
                  <UserCheck className="w-3.5 h-3.5" />
                  <span>{userSkills.length} skills on file</span>
                </span>
              ) : (
                <span className="flex items-center gap-1.5 text-[var(--text-muted)] font-medium">
                  <UserX className="w-3.5 h-3.5" />
                  <span>No resume / skills on file</span>
                </span>
              )}
            </div>

            <div className="h-4 w-px bg-[var(--border-hairline)]" />

            <div className="flex items-center gap-2">
              <button
                type="button"
                onClick={() => {
                  setCustomSkillsInput(userSkills.join(', '));
                  setIsEditorOpen(!isEditorOpen);
                }}
                className="text-[var(--text-muted)] hover:text-[var(--text-main)] transition-colors cursor-pointer font-medium"
              >
                {isEditorOpen ? 'Close editor' : hasSkillsOnFile ? 'Edit skills' : '+ Enter skills'}
              </button>

              <span className="text-[var(--border-hairline)]">•</span>

              {hasSkillsOnFile ? (
                <button
                  type="button"
                  id="btn-clear-profile"
                  onClick={clearSkills}
                  className="text-[var(--text-muted)] hover:text-[var(--diff-del)] transition-colors cursor-pointer font-medium"
                  title="Clear active skills to view State A (neutral requirements view)"
                >
                  Clear
                </button>
              ) : (
                <button
                  type="button"
                  id="btn-load-sample-profile"
                  onClick={loadSampleProfile}
                  className="text-[var(--accent-color)] hover:underline font-semibold cursor-pointer"
                  title="Load demo candidate skills (Python, FastAPI, PyTorch, React, Docker, SQL)"
                >
                  Load sample profile
                </button>
              )}
            </div>
          </div>
        </div>
      </div>

      {/* Collapsible Quick Skill Input Drawer */}
      {isEditorOpen && (
        <form
          onSubmit={handleSaveCustomSkills}
          className="card p-4 space-y-3 animate-fade-in border-[var(--accent-color)]/30"
        >
          <div className="flex items-center justify-between">
            <label htmlFor="custom-skills-input" className="text-xs font-semibold text-[var(--text-main)]">
              Your Candidate Skills (comma-separated)
            </label>
            <span className="caption text-[11px]">Synced across JD Matcher & Job Explorer</span>
          </div>
          <div className="flex items-center gap-2">
            <input
              id="custom-skills-input"
              type="text"
              value={customSkillsInput}
              onChange={(e) => setCustomSkillsInput(e.target.value)}
              placeholder="e.g. Python, React, TypeScript, Docker, SQL, AWS…"
              className="input-glow px-3 py-2 text-xs flex-1"
            />
            <button type="submit" className="btn-primary text-xs py-2 px-4">
              Apply skills
            </button>
          </div>
        </form>
      )}

      {/* ── Filter & Search Control Bar ─────────────────────────── */}
      <div className="card p-4 md:p-5 space-y-4">
        <div className="flex flex-col md:flex-row items-stretch md:items-center gap-3">
          {/* Job Title Search Bar */}
          <div className="relative flex-1">
            <Search className="w-4 h-4 text-[var(--text-muted)] absolute left-3.5 top-1/2 -translate-y-1/2 pointer-events-none" />
            <input
              type="text"
              id="job-explorer-search-input"
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              placeholder="Search job titles, e.g. 'Backend Engineer', 'Data Scientist', 'Product Manager'…"
              className="input-glow pl-10 pr-3 py-2.5 w-full text-sm"
            />
            {searchQuery && (
              <button
                onClick={() => setSearchQuery('')}
                className="absolute right-3 top-1/2 -translate-y-1/2 text-xs text-[var(--text-muted)] hover:text-[var(--text-main)]"
              >
                Clear
              </button>
            )}
          </div>

          {/* Domain Dropdown Filter */}
          <div className="relative md:w-56 shrink-0">
            <Filter className="w-4 h-4 text-[var(--text-muted)] absolute left-3.5 top-1/2 -translate-y-1/2 pointer-events-none" />
            <select
              id="job-explorer-domain-select"
              value={selectedDomain}
              onChange={(e) => setSelectedDomain(e.target.value)}
              className="input-glow pl-10 pr-8 py-2.5 w-full text-sm appearance-none cursor-pointer"
            >
              {domains.map((dom) => (
                <option key={dom} value={dom}>
                  {dom === 'All' ? 'All domains' : dom}
                </option>
              ))}
            </select>
          </div>

          {/* Track Filter Segmented Control */}
          <div className="segment shrink-0">
            <button
              type="button"
              onClick={() => setTrackFilter('all')}
              className={`segment-btn ${trackFilter === 'all' ? 'segment-btn-active' : ''}`}
            >
              <Layers className="w-3.5 h-3.5" /> All
            </button>
            <button
              type="button"
              onClick={() => setTrackFilter('technical')}
              className={`segment-btn ${trackFilter === 'technical' ? 'segment-btn-active' : ''}`}
            >
              <Code2 className="w-3.5 h-3.5" /> Technical
            </button>
            <button
              type="button"
              onClick={() => setTrackFilter('general')}
              className={`segment-btn ${trackFilter === 'general' ? 'segment-btn-active' : ''}`}
            >
              <BriefcaseIcon className="w-3.5 h-3.5" /> Non-tech
            </button>
          </div>
        </div>

        {/* Results Metadata Summary */}
        <div className="flex items-center justify-between text-xs pt-1 border-t border-[var(--border-hairline)] text-[var(--text-muted)]">
          <span>
            Showing <strong className="text-[var(--text-main)]">{filteredJobs.length}</strong> {filteredJobs.length === 1 ? 'role' : 'roles'} in catalog
            {searchQuery && ` matching “${searchQuery}”`}
          </span>
          <span className="capitalize">
            {trackFilter} track · {selectedDomain === 'All' ? 'All domains' : selectedDomain}
          </span>
        </div>
      </div>

      {/* ── Role Card Grid (click a card to enlarge) ── */}
      <div className="space-y-4">
        <div className="flex items-center justify-between px-1">
          <h3 className="font-semibold text-sm tracking-tight flex items-center gap-1.5">
            <LayoutGrid className="w-4 h-4 text-[var(--accent-color)]" />
            Roles ({filteredJobs.length})
          </h3>
          <span className="caption">Click a card to view details</span>
        </div>

        {filteredJobs.length > 0 ? (
          <>
            <div className="grid grid-cols-1 sm:grid-cols-2 xl:grid-cols-3 gap-4 items-start grid-flow-dense stagger-children">
              {visibleJobs.map((job) => {
                const isExpanded = expandedJobId === job.job_id;
                const matchPct = matchById.get(job.job_id);
                const previewSkills = job.skills_list.slice(0, 4);
                const remainingSkills = job.skills_list.length - previewSkills.length;
                return (
                  <Fragment key={job.job_id}>
                  <article
                    id={`role-item-${job.job_id}`}
                    role="button"
                    tabIndex={0}
                    aria-expanded={isExpanded}
                    aria-label={`${job.job_role} in ${job.domain}. ${
                      isExpanded ? 'Hide' : 'View'
                    } full requirements below.`}
                    onClick={() => toggleExpand(job.job_id)}
                    onKeyDown={(e) => {
                      if (e.key === 'Enter' || e.key === ' ') {
                        e.preventDefault();
                        toggleExpand(job.job_id);
                      } else if (e.key === 'Escape') {
                        setExpandedJobId(null);
                      }
                    }}
                    className={`card card-lift overflow-hidden text-left transition-all duration-200 ${
                      isExpanded
                        ? '!border-[var(--accent-color)] ring-1 ring-[var(--accent-color)]/30 bg-[var(--badge-bg)]/20'
                        : ''
                    }`}
                  >
                    {/* ── Collapsed preview (always visible) ── */}
                    <div className="p-4 sm:p-5 space-y-3">
                      <div className="flex items-center justify-between gap-2">
                        <span className="chip text-[11px] py-0.5 px-2 truncate max-w-[62%]">
                          {job.domain}
                        </span>
                        {hasSkillsOnFile && matchPct !== undefined ? (
                          <span
                            className={`chip text-[11px] font-bold tabular-nums px-2.5 py-0.5 shrink-0 ${
                              matchPct >= 70
                                ? 'chip-success'
                                : matchPct >= 40
                                ? 'chip-accent'
                                : 'chip-danger'
                            }`}
                          >
                            {matchPct}% match
                          </span>
                        ) : (
                          <span className="text-[11px] font-mono text-[var(--text-subtle)] bg-[var(--bg-surface)] px-2 py-0.5 rounded border border-[var(--border-hairline)] shrink-0">
                            {job.skills_list.length} skills
                          </span>
                        )}
                      </div>

                      <div className="space-y-1">
                        <h3 className="font-bold text-[15px] leading-snug tracking-tight text-[var(--text-main)]">
                          {job.job_role}
                        </h3>
                        <p className="caption text-[11.5px] flex items-center gap-1.5">
                          <Building2 className="w-3.5 h-3.5 text-[var(--accent-color)] shrink-0" />
                          <span className="truncate">{job.experience_label}</span>
                        </p>
                      </div>

                      <div className="flex flex-wrap gap-1.5">
                        {previewSkills.map((skill, idx) => (
                          <span key={idx} className="chip text-[11px] py-0.5 px-2.5">
                            {skill}
                          </span>
                        ))}
                        {remainingSkills > 0 && (
                          <span className="chip chip-accent text-[11px] py-0.5 px-2.5">
                            +{remainingSkills} more
                          </span>
                        )}
                      </div>

                      <div className="flex items-center justify-between pt-2 border-t border-[var(--border-hairline)]">
                        <span className="caption text-[11px] font-medium">
                          {isExpanded ? 'Viewing details below' : 'Click to view details'}
                        </span>
                        <ChevronDown
                          className={`w-4 h-4 text-[var(--accent-color)] transition-transform duration-300 ${
                            isExpanded ? 'rotate-180' : ''
                          }`}
                        />
                      </div>
                    </div>

                    </article>

                    {/* ── Full-width detail row (separate panel below the card's row) ── */}
                    {isExpanded && (
                      <div
                        id={`role-detail-${job.job_id}`}
                        className="col-span-full card p-5 sm:p-6 md:p-7 space-y-5 animate-fade-in !border-[var(--accent-color)] ring-1 ring-[var(--accent-color)]/30 shadow-[var(--shadow-md)]"
                      >
                        <div className="flex items-center justify-between gap-3">
                          <h3 className="text-lg md:text-xl font-bold tracking-tight text-[var(--text-main)]">
                            {job.job_role}
                          </h3>
                          <button
                            type="button"
                            onClick={() => setExpandedJobId(null)}
                            className="btn-secondary text-[11px] py-1.5 px-3 flex items-center gap-1.5 shrink-0"
                          >
                            <Minimize2 className="w-3.5 h-3.5" /> Hide details
                          </button>
                        </div>
                        <div className="space-y-5">
                          {/* Detail header: blueprint + score badge */}
                          <div className="flex items-start justify-between gap-3 pb-4 border-b border-[var(--border-hairline)]">
                            <div className="space-y-1.5 min-w-0">
                              <div className="flex items-center gap-2 flex-wrap">
                                <span className="chip text-[11px] font-medium uppercase tracking-wider py-0.5 px-2">
                                  Role Blueprint
                                </span>
                                <span className="chip text-[11px] py-0.5 px-2">
                                  {job.experience_label}
                                </span>
                              </div>
                              <p className="caption flex items-center gap-1.5 text-xs">
                                <Building2 className="w-3.5 h-3.5 text-[var(--accent-color)] shrink-0" />
                                <span>
                                  Domain: <strong>{job.domain}</strong>
                                </span>
                                <span>•</span>
                                <span>
                                  Level: <strong>{job.experience_level} / 3.0</strong>
                                </span>
                              </p>
                            </div>

                            {isExpanded && hasSkillsOnFile && evaluatedMatch ? (
                              <div className="text-right shrink-0">
                                <span
                                  id="role-match-score-badge"
                                  className={`chip ${
                                    evaluatedMatch.match_pct >= 70
                                      ? 'chip-success'
                                      : evaluatedMatch.match_pct >= 40
                                      ? 'chip-accent'
                                      : 'chip-danger'
                                  } text-sm font-bold tabular-nums px-3 py-1`}
                                >
                                  {evaluatedMatch.match_pct}% match
                                </span>
                                <span className="caption block text-[10px] mt-1">
                                  Blended ATS fit
                                </span>
                              </div>
                            ) : (
                              <div className="text-right shrink-0">
                                <span className="chip text-xs font-semibold py-1 px-2.5">
                                  Requirements View
                                </span>
                                <span className="caption block text-[10px] mt-1">
                                  {job.skills_list.length} target skills
                                </span>
                              </div>
                            )}
                          </div>

                          {/* ── RENDER STATE A: No resume/skills on file ───────────── */}
                          {!hasSkillsOnFile && (
                            <div className="space-y-4">
                              <div className="space-y-1">
                                <p className="text-xs font-bold uppercase tracking-wider text-[var(--text-muted)] flex items-center gap-1.5">
                                  <BookOpen className="w-3.5 h-3.5 text-[var(--accent-color)]" />
                                  Required Core Skills ({job.skills_list.length})
                                </p>
                                <p className="caption text-[11.5px]">
                                  Full baseline competencies demanded by enterprise job
                                  descriptions for this role.
                                </p>
                              </div>

                              <div
                                className="flex flex-wrap gap-2 pt-1"
                                id="role-skills-neutral-list"
                              >
                                {job.skills_list.map((skill, idx) => (
                                  <span
                                    key={idx}
                                    className="chip bg-[var(--bg-elevated)] text-[var(--text-muted)] border border-[var(--border-hairline)] hover:border-[var(--border-strong)] transition-colors py-1 px-3 text-xs"
                                  >
                                    {skill}
                                  </span>
                                ))}
                              </div>

                              <div className="p-4 rounded-xl border border-[var(--border-hairline)] bg-[var(--bg-surface)] flex flex-col sm:flex-row sm:items-center justify-between gap-3 text-xs shadow-xs mt-2">
                                <div className="space-y-0.5">
                                  <p className="font-semibold text-[var(--text-main)] flex items-center gap-1.5">
                                    <Sparkles className="w-3.5 h-3.5 text-[var(--accent-color)]" />
                                    Add your skills for a personalized match →
                                  </p>
                                  <p className="caption text-[11px]">
                                    Compare your actual abilities to see your exact skill
                                    gaps and ATS compatibility score.
                                  </p>
                                </div>

                                <div className="flex items-center gap-2 shrink-0">
                                  <Link
                                    to="/resume-builder"
                                    onClick={(e) => e.stopPropagation()}
                                    className="btn-secondary text-[11px] py-1.5 px-3 flex items-center gap-1"
                                  >
                                    Resume Builder <ArrowRight className="w-3 h-3" />
                                  </Link>
                                  <Link
                                    to="/dsa-code"
                                    onClick={(e) => e.stopPropagation()}
                                    className="btn-primary text-[11px] py-1.5 px-3 flex items-center gap-1"
                                  >
                                    DSA + Code <ArrowRight className="w-3 h-3" />
                                  </Link>
                                </div>
                              </div>
                            </div>
                          )}

                          {/* ── RENDER STATE B: Resume/skills on file ──────────────── */}
                          {isExpanded && hasSkillsOnFile && evaluatedMatch && (
                            <div className="space-y-4">
                              <div className="grid grid-cols-3 gap-2.5 p-3 rounded-xl bg-[var(--bg-surface)] border border-[var(--border-hairline)] text-center text-xs">
                                <div>
                                  <span className="caption block text-[10px] uppercase">
                                    Semantic Cosine
                                  </span>
                                  <strong className="text-[13px] font-mono text-[var(--text-main)]">
                                    {Math.round(evaluatedMatch.semantic_score * 100)}%
                                  </strong>
                                </div>
                                <div className="border-x border-[var(--border-hairline)]">
                                  <span className="caption block text-[10px] uppercase">
                                    Profile Signal
                                  </span>
                                  <strong className="text-[13px] font-mono text-[var(--accent-color)]">
                                    {Math.round(profileScore * 100)}%
                                  </strong>
                                </div>
                                <div>
                                  <span className="caption block text-[10px] uppercase">
                                    DSA Code Signal
                                  </span>
                                  <strong className="text-[13px] font-mono text-[var(--accent-2)]">
                                    {Math.round(dsaScore * 100)}%
                                  </strong>
                                </div>
                              </div>

                              <div className="space-y-2">
                                <p className="caption font-semibold flex items-center gap-1.5 text-[var(--success)] text-xs">
                                  <CheckCircle2 className="w-4 h-4 shrink-0" />
                                  You have ({evaluatedMatch.overlap.length})
                                </p>

                                {evaluatedMatch.overlap.length > 0 ? (
                                  <div className="flex flex-wrap gap-1.5">
                                    {evaluatedMatch.overlap.map((skill, sIdx) => (
                                      <span
                                        key={sIdx}
                                        className="chip chip-success text-xs py-1 px-3 flex items-center gap-1"
                                      >
                                        ✓ {skill}
                                      </span>
                                    ))}
                                  </div>
                                ) : (
                                  <p className="caption italic text-xs py-1">
                                    No overlapping skills detected with this role.
                                  </p>
                                )}
                              </div>

                              <div className="space-y-2 pt-1">
                                <p className="caption font-semibold flex items-center gap-1.5 text-[var(--diff-del)] text-xs">
                                  <AlertCircle className="w-4 h-4 shrink-0" />
                                  To learn ({evaluatedMatch.gap.length})
                                </p>

                                {evaluatedMatch.gap.length > 0 ? (
                                  <div className="flex flex-wrap gap-1.5">
                                    {evaluatedMatch.gap.map((gap, gIdx) => (
                                      <span
                                        key={gIdx}
                                        className="chip chip-danger text-xs py-1 px-3 flex items-center gap-1"
                                      >
                                        + {gap}
                                      </span>
                                    ))}
                                  </div>
                                ) : (
                                  <span className="caption font-medium text-[var(--success)] text-xs">
                                    All baseline requirements satisfied for this role!
                                  </span>
                                )}
                              </div>

                              <div className="pt-2 flex items-center justify-between text-xs text-[var(--text-muted)] border-t border-[var(--border-hairline)]">
                                <span className="caption">
                                  Formula: 0.60×cosine + 0.25×profile + 0.15×dsa
                                </span>
                                <Link
                                  to="/jd-match"
                                  onClick={(e) => e.stopPropagation()}
                                  className="text-[var(--accent-color)] hover:underline font-semibold flex items-center gap-1"
                                >
                                  Compare in JD Matcher →
                                </Link>
                              </div>
                            </div>
                          )}

                          {/* Detail footer: salary & hiring companies */}
                          <div className="pt-4 border-t border-[var(--border-hairline)] flex flex-col sm:flex-row sm:items-center justify-between gap-3 text-xs">
                            <div>
                              <span className="caption block">
                                Estimated Compensation Range
                              </span>
                              <p className="text-sm font-bold text-[var(--text-main)] font-mono mt-0.5">
                                {job.salary_range}
                              </p>
                            </div>

                            <div className="sm:text-right sm:max-w-[45%]">
                              <span className="caption block">Target Hiring Companies</span>
                              <p className="text-xs text-[var(--text-muted)] font-sans mt-0.5">
                                {job.companies || 'Tech Tier 1 / Startups / Enterprise'}
                              </p>
                            </div>
                          </div>
                        </div>
                      </div>
                    )}
                  </Fragment>
                );
              })}
            </div>

            {/* Pagination footer: load more instead of rendering all 400+ at once */}
            {filteredJobs.length > visibleJobs.length ? (
              <div className="flex flex-col items-center gap-2 pt-2">
                <p className="caption">
                  Showing <strong className="text-[var(--text-main)]">{visibleJobs.length}</strong> of{' '}
                  <strong className="text-[var(--text-main)]">{filteredJobs.length}</strong> roles
                </p>
                <button
                  type="button"
                  onClick={() => setVisibleCount((c) => c + PAGE_SIZE)}
                  className="btn-secondary text-xs px-4 py-2 flex items-center gap-1.5"
                >
                  Show more roles <ChevronDown className="w-3.5 h-3.5" />
                </button>
              </div>
            ) : (
              filteredJobs.length > PAGE_SIZE && (
                <div className="flex flex-col items-center gap-2 pt-2">
                  <p className="caption">
                    Showing all <strong className="text-[var(--text-main)]">{filteredJobs.length}</strong> roles
                  </p>
                  <button
                    type="button"
                    onClick={() => setVisibleCount(PAGE_SIZE)}
                    className="btn-tertiary text-xs flex items-center gap-1"
                  >
                    <Minimize2 className="w-3.5 h-3.5" /> Show less
                  </button>
                </div>
              )
            )}
          </>
        ) : (
          <div className="card p-8 text-center space-y-2">
            <Search className="w-8 h-8 text-[var(--text-subtle)] mx-auto" />
            <p className="font-semibold text-sm">No job titles found</p>
            <p className="caption max-w-xs mx-auto">
              No roles match “{searchQuery}”. Try clearing the search or switching tracks.
            </p>
            <button
              onClick={() => {
                setSearchQuery('');
                setSelectedDomain('All');
                setTrackFilter('all');
              }}
              className="btn-secondary text-xs px-3 py-1.5 mt-2"
            >
              Reset filters
            </button>
          </div>
        )}
      </div>
    </div>
  );
};

export default JobExplorerPage;
