import React, { useState, useCallback, useMemo, useEffect, useRef } from 'react';
import { api } from '../lib/api';
import { useAuth } from '../context/AuthContext';
import { useUserProfile, getStoredSkills } from '../lib/userProfile';
import { 
  Compass, 
  GraduationCap, 
  Briefcase, 
  UploadCloud, 
  CheckCircle2,
  Target, 
  Plus, 
  X, 
  RefreshCw, 
  Sparkles,
  Edit3,
  Code2,
  Trophy,
  ChevronRight
} from 'lucide-react';

interface MilestoneStep {
  stepNumber: number;
  title: string;
  duration: string;
  description: string;
  skillsToLearn: string[];
  deliverables: string[];
}

export interface RankedRole {
  rank: number;
  title: string;
  alignmentPercent: number;
  matchingSkills: string[];
  whyItFits: string;
  skillGaps: string[];
  requiredSkills: string[];
}

const COMMON_ROLE_SUGGESTIONS = [
  "Machine Learning Engineer",
  "Senior Backend Engineer",
  "Distributed Systems Engineer",
  "Fullstack Web Developer",
  "MLOps & Infrastructure Engineer",
  "AI Research Scientist"
];

const PRESET_SKILLS = [
  "Python", "FastAPI", "PyTorch", "React", "TypeScript", 
  "Docker", "Kubernetes", "PostgreSQL", "CUDA", "vLLM", "Redis"
];

const ROLE_TAXONOMY_MAP: Record<string, string[]> = {
  "Machine Learning Engineer": ["PyTorch", "Python", "Distributed PyTorch", "Docker", "vLLM", "Vector Databases", "CUDA"],
  "Senior Backend Engineer": ["FastAPI", "Python", "Go", "PostgreSQL", "Redis", "Distributed Systems", "Kubernetes"],
  "Distributed Systems Engineer": ["C++", "CUDA", "gRPC", "Triton", "Kubernetes", "Rust", "Go"],
  "Fullstack Web Developer": ["React", "TypeScript", "Next.js", "TailwindCSS", "Node.js", "PostgreSQL", "FastAPI"],
  "MLOps & Infrastructure Engineer": ["Docker", "Kubernetes", "Python", "MLflow", "TensorRT-LLM", "Terraform", "CI/CD"],
  "AI Research Scientist": ["PyTorch", "Python", "CUDA", "Mathematics & Linear Algebra", "Transformers", "Distributed Training"],
  "Data Engineer": ["Python", "PostgreSQL", "Apache Spark", "Docker", "Airflow", "Kafka", "Redis"],
  "Cloud & DevOps Engineer": ["Docker", "Kubernetes", "Terraform", "CI/CD", "AWS", "Linux", "Go"]
};

export const CareerPathPage: React.FC = () => {
  const { user } = useAuth();
  const { setSkills: persistSkills, addSkills: persistAddSkills } = useUserProfile(user?.uid);
  // Functional Input State — empty-first, hydrated from per-user shared store.
  const [audience, setAudience] = useState<'student' | 'pro'>('student');
  const [targetRole, setTargetRole] = useState('Machine Learning Engineer');
  const [skills, setSkills] = useState<string[]>([]);
  const [skillInputBuffer, setSkillInputBuffer] = useState('');
  const hydratedUid = useRef<string | null>(null);

  // Hydrate editor from shared store (resume/JD/career union). Re-run on account switch.
  useEffect(() => {
    const uid = user?.uid ?? null;
    if (hydratedUid.current === (uid ?? 'anon')) return;
    hydratedUid.current = uid ?? 'anon';
    setSkills(getStoredSkills(uid));
  }, [user?.uid]);
  
  // Resume upload state
  const [resumeFile, setResumeFile] = useState<File | null>(null);
  const [isExtractingResume, setIsExtractingResume] = useState(false);
  const [extractStatusMessage, setExtractStatusMessage] = useState<string | null>(null);

  // Flow State: Gated Recommendation Output & Active Leaderboard Selection
  const [hasGenerated, setHasGenerated] = useState(false);
  const [isGenerating, setIsGenerating] = useState(false);
  const [selectedRoleIndex, setSelectedRoleIndex] = useState<number>(0);

  // Dynamic calculation of Top 5 Ranked Roles based on user skills + target role input
  const rankedRoles = useMemo<RankedRole[]>(() => {
    const userSkillsLower = new Set(skills.map(s => s.toLowerCase()));
    const trimmedTargetRole = targetRole.trim();

    // Pool of candidate titles (taxonomy + typed target role if not present)
    const candidateTitles = Array.from(
      new Set(
        [...Object.keys(ROLE_TAXONOMY_MAP), trimmedTargetRole].filter(Boolean)
      )
    );

    const evaluated = candidateTitles.map((title) => {
      const requiredSkills = ROLE_TAXONOMY_MAP[title] || [
        "Python",
        "System Architecture",
        "Docker",
        "PostgreSQL",
        "API Design",
        "CI/CD"
      ];

      const matchingSkills = requiredSkills.filter(req =>
        userSkillsLower.has(req.toLowerCase())
      );
      const skillGaps = requiredSkills.filter(req =>
        !userSkillsLower.has(req.toLowerCase())
      );

      // Raw alignment calculation based on skill overlap
      const rawMatchCount = matchingSkills.length;
      const totalReq = requiredSkills.length;
      
      const isExplicitTarget = title.toLowerCase() === trimmedTargetRole.toLowerCase();
      const matchRatio = rawMatchCount / totalReq;
      
      let alignmentPercent = Math.round(matchRatio * 65 + (skills.length > 0 ? 30 : 10) + (isExplicitTarget ? 5 : 0));
      alignmentPercent = Math.min(98, Math.max(35, alignmentPercent));

      const whyItFits = matchingSkills.length > 0
        ? `Matches skills: ${matchingSkills.slice(0, 3).join(', ')}`
        : "Foundational software engineering alignment";

      return {
        title,
        alignmentPercent,
        matchingSkills,
        whyItFits,
        skillGaps,
        requiredSkills,
        rawMatchCount,
        isExplicitTarget
      };
    });

    // Sort candidate roles by alignment percentage descending, breaking ties with matching count & target match
    evaluated.sort((a, b) => {
      if (b.alignmentPercent !== a.alignmentPercent) {
        return b.alignmentPercent - a.alignmentPercent;
      }
      if (b.rawMatchCount !== a.rawMatchCount) {
        return b.rawMatchCount - a.rawMatchCount;
      }
      if (a.isExplicitTarget !== b.isExplicitTarget) {
        return a.isExplicitTarget ? -1 : 1;
      }
      return a.title.localeCompare(b.title);
    });

    // Ensure Top 5 have monotonic descending percentages for visual clarity if any duplicates
    const top5 = evaluated.slice(0, 5);
    for (let i = 1; i < top5.length; i++) {
      if (top5[i].alignmentPercent >= top5[i - 1].alignmentPercent) {
        top5[i].alignmentPercent = Math.max(30, top5[i - 1].alignmentPercent - 4);
      }
    }

    return top5.map((item, idx) => ({
      rank: idx + 1,
      title: item.title,
      alignmentPercent: item.alignmentPercent,
      matchingSkills: item.matchingSkills,
      whyItFits: item.whyItFits,
      skillGaps: item.skillGaps,
      requiredSkills: item.requiredSkills
    }));
  }, [skills, targetRole]);

  // Selected Role for drill-down view
  const activeRole = rankedRoles[selectedRoleIndex] || rankedRoles[0] || {
    rank: 1,
    title: targetRole,
    alignmentPercent: 75,
    matchingSkills: [],
    whyItFits: "Baseline profile alignment",
    skillGaps: ["Distributed Systems", "Docker", "Kubernetes"],
    requiredSkills: []
  };

  // Tag Input Handlers — every change also feeds the shared per-user store (dashboard).
  const handleAddSkill = (skillToAdd?: string) => {
    const value = (skillToAdd || skillInputBuffer).trim();
    if (!value) return;

    // Prevent duplicates (case-insensitive)
    if (!skills.some(s => s.toLowerCase() === value.toLowerCase())) {
      setSkills(prev => [...prev, value]);
      persistAddSkills([value]);
    }
    if (!skillToAdd) {
      setSkillInputBuffer('');
    }
  };

  const handleKeyDownSkill = (e: React.KeyboardEvent) => {
    if (e.key === 'Enter' || e.key === ',') {
      e.preventDefault();
      handleAddSkill();
    }
  };

  const handleRemoveSkill = (skillToRemove: string) => {
    const next = skills.filter(s => s !== skillToRemove);
    setSkills(next);
    persistSkills(next);
  };

  // Resume PDF Auto-Extraction Handler (Uses backend /extract-skills/pdf endpoint)
  const handleFileUpload = useCallback(async (file: File) => {
    setResumeFile(file);
    setIsExtractingResume(true);
    setExtractStatusMessage(null);

    try {
      const result = await api.extractSkillsPdf(file);
      if (result.all_skills && result.all_skills.length > 0) {
        // Merge extracted skills into active skills state without duplicates
        setSkills(prev => {
          const existingLower = new Set(prev.map(s => s.toLowerCase()));
          const newUnique = result.all_skills.filter(s => !existingLower.has(s.toLowerCase()));
          return [...prev, ...newUnique];
        });
        persistAddSkills(result.all_skills);
        setExtractStatusMessage(`✓ Successfully extracted ${result.all_skills.length} skills from ${file.name} — added to dashboard`);
      } else {
        setExtractStatusMessage(`✓ Attached ${file.name}`);
      }
    } catch (err: any) {
      console.warn("Resume extraction warning:", err);
      setExtractStatusMessage(`✓ Attached ${file.name}`);
    } finally {
      setIsExtractingResume(false);
    }
  }, [persistAddSkills]);

  // Submit / Generate Handler — final flush to dashboard store.
  const handleGenerate = (e: React.FormEvent) => {
    e.preventDefault();
    if (!targetRole.trim() || skills.length === 0) return;

    persistSkills(skills);
    setIsGenerating(true);
    setTimeout(() => {
      setIsGenerating(false);
      setHasGenerated(true);
      setSelectedRoleIndex(0); // Auto-expand #1 ranked role
    }, 600);
  };

  // Dynamic Roadmap Steps derived from Audience + Active Selected Role
  const roadmapSteps: MilestoneStep[] = audience === 'student' ? [
    {
      stepNumber: 1,
      title: `Core ${activeRole.title} Signal & Algorithm Foundations`,
      duration: "Weeks 1–4",
      description: `Focus on mastering ${activeRole.matchingSkills[0] || skills[0] || 'core language'} fundamentals and core data structure performance for ${activeRole.title} screening.`,
      skillsToLearn: (activeRole.matchingSkills.length > 0 ? activeRole.matchingSkills.slice(0, 3) : skills.slice(0, 3)).map(s => `${s} Mastery`),
      deliverables: ["Solve 40+ LeetCode Mediums", `Deploy open-source ${activeRole.title.toLowerCase()} API on GitHub`]
    },
    {
      stepNumber: 2,
      title: "Distributed Architecture & Systems Integration",
      duration: "Weeks 5–8",
      description: `Bridge your initial skills with production tools. Focus on bridging critical gaps (${activeRole.skillGaps.slice(0, 2).join(', ') || 'Docker'}).`,
      skillsToLearn: activeRole.skillGaps.slice(0, 3).concat(["Docker Containerization"]),
      deliverables: ["Containerized high-throughput microservice", "CI/CD GitHub Actions pipeline setup"]
    },
    {
      stepNumber: 3,
      title: "Production Portfolio & Technical Interview Signal",
      duration: "Weeks 9–12",
      description: `Package end-to-end portfolio projects tailored specifically for ${activeRole.title} campus referrals & recruiters.`,
      skillsToLearn: ["System Architecture RFCs", "Benchmark Latency Profiling", "Portfolio Packaging"],
      deliverables: ["Live production project deployment", "Optimized GitHub & LinkedIn profile signal"]
    }
  ] : [
    {
      stepNumber: 1,
      title: `Senior Level ${activeRole.title} Transition Strategy`,
      duration: "Month 1",
      description: `Leverage existing experience with ${skills.slice(0, 2).join(', ')} while filling high-priority gaps in ${activeRole.skillGaps[0] || 'Infrastructure'}.`,
      skillsToLearn: activeRole.skillGaps.slice(0, 2).concat(["Architecture RFCs"]),
      deliverables: [`Migrate existing codebase to ${activeRole.title} architecture`, "Establish production telemetry & benchmarks"]
    },
    {
      stepNumber: 2,
      title: "High-Throughput Optimization & Scalability",
      duration: "Month 2",
      description: "Deep dive into low-latency serving, caching strategies, and distributed cluster management.",
      skillsToLearn: activeRole.skillGaps.slice(2, 5).concat(["Kubernetes / Distributed Cluster Design"]),
      deliverables: ["p99 Latency SLA Optimization (<25ms)", "Distributed load testing benchmark suite"]
    },
    {
      stepNumber: 3,
      title: "Staff Level System Design & Career Advancement",
      duration: "Month 3",
      description: `Position yourself for Staff/Senior candidate review for ${activeRole.title} positions with proven system design wins.`,
      skillsToLearn: ["Production Tradeoff Decisioning", "Cost-Performance Ratio Optimization"],
      deliverables: ["End-to-End System Design Blueprint RFC", "Executive Promotion / Referral Package"]
    }
  ];

  return (
    <div className="p-6 md:p-10 max-w-7xl mx-auto space-y-10 text-[var(--text-main)] animate-fade-in">
      <div className="flex flex-col md:flex-row md:items-end justify-between gap-4">
        <div>
          <h1 className="h-section text-2xl md:text-3xl">
            Career path
          </h1>
          <p className="caption mt-1">Tell us your skills — get five ranked roles and a roadmap.</p>
        </div>

        {/* Audience picker — quiet segmented control */}
        <div className="segment">
          <button
            type="button"
            onClick={() => setAudience('student')}
            className={`segment-btn ${audience === 'student' ? 'segment-btn-active' : ''}`}
          >
            <GraduationCap className="w-4 h-4" /> Student
          </button>
          <button
            type="button"
            onClick={() => setAudience('pro')}
            className={`segment-btn ${audience === 'pro' ? 'segment-btn-active' : ''}`}
          >
            <Briefcase className="w-4 h-4" /> Professional
          </button>
        </div>
      </div>

      {/* ========================================================================= */}
      {/* GATED STEP 1: CONFIGURE INPUT FORM (When hasGenerated === false) */}
      {/* ========================================================================= */}
      {!hasGenerated ? (
        <form onSubmit={handleGenerate} className="space-y-8">
          <div className="card p-6 md:p-8 space-y-7">
            <div className="flex items-center justify-between gap-3">
              <div>
                <h2 className="font-semibold text-lg tracking-tight">
                  What are you aiming for?
                </h2>
                <p className="caption mt-0.5">Name a role and list your skills — we rank five fits.</p>
              </div>
              <span className="chip hidden sm:inline-flex">
                {audience === 'student' ? 'Student' : 'Professional'}
              </span>
            </div>

            <div className="field">
              <label className="field-label">
                <Target className="w-4 h-4 text-[var(--accent-color)]" /> Target role
              </label>
              <input
                type="text"
                value={targetRole}
                onChange={(e) => setTargetRole(e.target.value)}
                placeholder="e.g. Machine Learning Engineer"
                className="input-glow px-4 py-2.5"
                required
              />

              <div className="flex flex-wrap gap-1.5 pt-1">
                <span className="caption self-center mr-1">Try:</span>
                {COMMON_ROLE_SUGGESTIONS.map((role) => (
                  <button
                    key={role}
                    type="button"
                    onClick={() => setTargetRole(role)}
                    className={`px-2.5 py-1 rounded-full text-[12px] font-medium border transition-all cursor-pointer ${
                      targetRole === role
                        ? 'bg-[var(--text-main)] text-[var(--bg-paper)] border-transparent'
                        : 'bg-[var(--bg-surface)] text-[var(--text-muted)] border-[var(--border-hairline)] hover:text-[var(--text-main)] hover:border-[var(--border-strong)]'
                    }`}
                  >
                    {role}
                  </button>
                ))}
              </div>
            </div>

            {/* Progressive disclosure: resume import is optional */}
            <details className="disclosure">
              <summary>
                <UploadCloud className="w-4 h-4 text-[var(--accent-color)]" />
                Import skills from a resume
                <span className="caption ml-auto">optional</span>
              </summary>
              <div className="disclosure-body space-y-3">
                <div className="border border-dashed border-[var(--border-strong)] rounded-xl p-6 text-center bg-[var(--bg-paper)] cursor-pointer transition-all hover:border-[var(--accent-color)]">
                  <input
                    type="file"
                    accept=".pdf,.docx"
                    onChange={(e) => e.target.files && e.target.files[0] && handleFileUpload(e.target.files[0])}
                    className="hidden"
                    id="career-resume-pdf-input"
                  />
                  <label htmlFor="career-resume-pdf-input" className="cursor-pointer block space-y-1.5">
                    {isExtractingResume ? (
                      <div className="flex items-center justify-center gap-2 text-[var(--accent-color)]">
                        <RefreshCw className="w-5 h-5 animate-spin" />
                        <span className="font-semibold text-sm">Reading your resume…</span>
                      </div>
                    ) : (
                      <>
                        <UploadCloud className="w-7 h-7 text-[var(--accent-color)] mx-auto" />
                        <p className="font-semibold text-sm">
                          {resumeFile ? `Attached: ${resumeFile.name}` : 'Drop a resume PDF here or browse'}
                        </p>
                        <p className="caption">
                          Skills are extracted automatically into the list below.
                        </p>
                      </>
                    )}
                  </label>
                </div>

                {extractStatusMessage && (
                  <p className="caption font-medium text-[var(--success)]">
                  {extractStatusMessage}
                </p>
              )}
              </div>
            </details>

            <div className="field">
              <div className="flex items-center justify-between">
                <label className="field-label">
                  <Code2 className="w-4 h-4" /> Your skills ({skills.length})
                </label>
                <span className="caption">Type and press Enter</span>
              </div>

              <div className="flex gap-2">
                <input
                  type="text"
                  value={skillInputBuffer}
                  onChange={(e) => setSkillInputBuffer(e.target.value)}
                  onKeyDown={handleKeyDownSkill}
                  placeholder="e.g. PyTorch, Docker, FastAPI"
                  className="input-glow flex-1 px-4 py-2.5"
                />
                <button
                  type="button"
                  onClick={() => handleAddSkill()}
                  className="btn-secondary px-5 py-2.5 text-sm"
                >
                  <Plus className="w-4 h-4" /> Add
                </button>
              </div>

              <div className="p-4 rounded-xl bg-[var(--bg-paper)] border border-[var(--border-hairline)] min-h-[50px]">
                {skills.length > 0 ? (
                  <div className="flex flex-wrap gap-2">
                    {skills.map((skill) => (
                      <span
                        key={skill}
                        className="chip !text-[12.5px] !py-1 !bg-[var(--bg-surface)] !text-[var(--text-main)]"
                      >
                        {skill}
                        <button
                          type="button"
                          onClick={() => handleRemoveSkill(skill)}
                          className="hover:text-[var(--diff-del)] transition-colors cursor-pointer"
                          title={`Remove ${skill}`}
                        >
                          <X className="w-3 h-3" />
                        </button>
                      </span>
                    ))}
                  </div>
                ) : (
                  <p className="caption italic">
                    No skills yet — type one above or pick from below.
                  </p>
                )}
              </div>

              <div className="flex flex-wrap items-center gap-1.5 pt-1">
                <span className="caption mr-1">Popular:</span>
                {PRESET_SKILLS.map((preset) => {
                  const isAdded = skills.some(s => s.toLowerCase() === preset.toLowerCase());
                  return (
                    <button
                      key={preset}
                      type="button"
                      disabled={isAdded}
                      onClick={() => handleAddSkill(preset)}
                      className={`px-2.5 py-1 rounded-full text-[12px] font-medium border transition-colors cursor-pointer ${
                        isAdded
                          ? 'opacity-40 cursor-not-allowed border-transparent'
                          : 'border-[var(--border-hairline)] text-[var(--text-muted)] hover:text-[var(--text-main)] hover:border-[var(--border-strong)]'
                      }`}
                    >
                      + {preset}
                    </button>
                  );
                })}
              </div>
            </div>

            {/* The single primary action on this view */}
            <button
              type="submit"
              disabled={isGenerating || !targetRole.trim() || skills.length === 0}
              className="btn-primary w-full py-4 px-6 text-[15px]"
            >
              {isGenerating ? (
                <>
                  <RefreshCw className="w-4 h-4 animate-spin" /> Finding your roles…
                </>
              ) : (
                <>
                  <Compass className="w-4 h-4" /> Generate career path
                </>
              )}
            </button>
          </div>
        </form>
      ) : (
        /* ========================================================================= */
        /* STEP 2: GENERATED RECOMMENDATION ROADMAP VIEW */
        /* ========================================================================= */
        <div className="space-y-10">
          {/* Header Action Bar: Reconfigure Inputs Button */}
          <div className="card p-4 flex flex-col sm:flex-row sm:items-center justify-between gap-4">
            <div className="space-y-0.5">
              <div className="flex items-center gap-2">
                <span className="font-semibold text-[14px] tracking-tight">
                  Your top roles
                </span>
                <span className="chip">
                  5 ranked options
                </span>
              </div>
              <p className="text-xs font-bold text-[var(--text-main)]">
                Target: <span className="text-[var(--accent-color)]">{targetRole}</span> • Track: <span className="capitalize">{audience === 'student' ? 'College Student' : 'Working Professional'}</span> • Skills: {skills.length} provided
              </p>
            </div>

            <button
              onClick={() => setHasGenerated(false)}
              className="btn-secondary px-4 py-2 text-[13px] shrink-0"
            >
              <Edit3 className="w-3.5 h-3.5 text-[var(--accent-color)]" /> Edit inputs
            </button>
          </div>

          {/* ========================================================================= */}
          {/* LEADERBOARD VIEW: TOP 5 RANKED ROLE RECOMMENDATIONS */}
          {/* ========================================================================= */}
          <div className="space-y-4">
            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2 border-b border-[var(--border-hairline)] pb-3">
              <div className="space-y-1 font-sans">
                <div className="flex items-center gap-2">
                  <Trophy className="w-4 h-4 text-[var(--accent-color)]" />
                  <span className="font-semibold text-[14px] tracking-tight">
                    Top 5 roles
                  </span>
                </div>
                <h2 className="text-lg font-extrabold text-[var(--text-main)]">
                  Ranked by fit
                </h2>
                <p className="text-xs text-[var(--text-muted)]">
                  Select a role to see its roadmap.
                </p>
              </div>

              <span className="px-3 py-1 rounded-lg caption self-start sm:self-auto">
                5 evaluated
              </span>
            </div>

            {/* Ranked List / Cards Set */}
            <div className="grid grid-cols-1 gap-3.5 stagger-children">
              {rankedRoles.map((role, idx) => {
                const isSelected = selectedRoleIndex === idx;
                const isTop1 = idx === 0;

                return (
                  <div
                    key={role.title}
                    onClick={() => setSelectedRoleIndex(idx)}
                    className={`card-lift p-5 rounded-2xl transition-all cursor-pointer border relative ${
                      isSelected
                        ? 'card card-elevated !border-[var(--accent-color)]'
                        : 'card hover:border-[var(--border-strong)]'
                    }`}
                  >
                    <div className="flex flex-col md:flex-row md:items-center justify-between gap-3">
                      {/* Left: Rank Badge + Title + Match reason */}
                      <div className="space-y-2 flex-1">
                        <div className="flex items-center gap-2.5 flex-wrap">
                          {/* Rank Badge */}
                          <span
                            className={`px-2.5 py-0.5 rounded-md text-[11px] font-bold flex items-center gap-1 ${
                              isTop1
                                ? 'text-white border border-transparent'
                                : 'bg-[var(--bg-surface)] text-[var(--text-main)] border border-[var(--border-hairline)]'
                            }`}
                            style={isTop1 ? { background: 'var(--grad-accent)' } : undefined}
                          >
                            {isTop1 ? <Sparkles className="w-3 h-3" /> : null}
                            #{role.rank} {isTop1 ? 'Top match' : 'Option'}
                          </span>

                          <h3 className="text-base font-extrabold text-[var(--text-main)] font-sans flex items-center gap-2">
                            {role.title}
                          </h3>

                          {isSelected && (
                            <span className="chip chip-success">
                              <CheckCircle2 className="w-3 h-3" /> Showing roadmap
                            </span>
                          )}
                        </div>

                        {/* Why this fits line */}
                        <div className="text-[11px] font-sans text-[var(--text-muted)] flex items-center gap-1.5 pt-0.5">
                          <CheckCircle2 className="w-3.5 h-3.5 text-[var(--diff-add)] shrink-0" />
                          <span className="font-semibold">
                            {role.whyItFits}
                          </span>
                        </div>

                        {/* Critical Skill Gaps */}
                        <div className="flex flex-wrap items-center gap-1.5 pt-1 text-[11px]">
                          <span className="caption font-medium">
                            Gaps ({role.skillGaps.length}):
                          </span>
                          {role.skillGaps.length > 0 ? (
                            role.skillGaps.slice(0, 4).map((gap, gIdx) => (
                              <span
                                key={gIdx}
                                className="px-2 py-0.5 rounded-md bg-[var(--diff-del-bg)] text-[var(--diff-del)] border border-[var(--diff-del)]/30 font-semibold text-[10px]"
                              >
                                - {gap}
                              </span>
                            ))
                          ) : (
                            <span className="text-[10px] text-[var(--diff-add)] font-bold">
                              ✓ All baseline skills present
                            </span>
                          )}
                          {role.skillGaps.length > 4 && (
                            <span className="text-[10px] text-[var(--text-muted)] font-mono">
                              +{role.skillGaps.length - 4} more
                            </span>
                          )}
                        </div>
                      </div>

                      <div className="flex md:flex-col items-center md:items-end justify-between gap-2 shrink-0 pt-2 md:pt-0">
                        <span className="chip chip-success tabular-nums">
                          {role.alignmentPercent}% fit
                        </span>

                        <span className="caption flex items-center gap-1">
                          {isSelected ? 'Showing roadmap' : 'Select for roadmap'} <ChevronRight className="w-3.5 h-3.5" />
                        </span>
                      </div>
                    </div>
                  </div>
                );
              })}
            </div>
          </div>

          {/* ========================================================================= */}
          {/* DRILL-DOWN VIEW: SELECTED TARGET ROLE ALIGNMENT & MILESTONE ROADMAP */}
          {/* ========================================================================= */}
          <div className="card p-6 md:p-8 space-y-6">
            <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
              <div className="space-y-1">
                <p className="caption">Selected role · #{activeRole.rank} of 5</p>
                <h2 className="font-bold text-xl tracking-tight flex items-center gap-2">
                  <Target className="w-5 h-5 text-[var(--accent-color)]" /> {activeRole.title}
                </h2>
              </div>

              <div className="flex items-center gap-3">
                <span className="caption">{audience === 'student' ? 'Skill building' : 'Career transition'}</span>
                <span className="chip chip-success tabular-nums">
                  {activeRole.alignmentPercent}% fit
                </span>
              </div>
            </div>

            <div className="space-y-2">
              <p className="caption font-medium">
                Skills to close ({activeRole.skillGaps.length})
              </p>

              {activeRole.skillGaps.length > 0 ? (
                <div className="flex flex-wrap gap-1.5">
                  {activeRole.skillGaps.map((gap, idx) => (
                    <span key={idx} className="chip chip-danger">
                      {gap}
                    </span>
                  ))}
                </div>
              ) : (
                <span className="chip chip-success">
                  All core skills present
                </span>
              )}
            </div>
          </div>

          <div className="space-y-5">
            <div className="flex items-center justify-between">
              <h3 className="font-semibold text-[15px] tracking-tight flex items-center gap-1.5">
                <Compass className="w-4 h-4 text-[var(--accent-color)]" /> Roadmap for {activeRole.title}
              </h3>
              <span className="caption">{audience === 'student' ? '12 weeks' : '3 months'}</span>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-3 gap-4 stagger-children">
              {roadmapSteps.map((step) => (
                <div
                  key={step.stepNumber}
                  className="card card-lift p-6 flex flex-col justify-between"
                >
                  <div className="space-y-3">
                    <div className="flex items-center justify-between">
                      <span className="font-semibold text-[13px] text-[var(--accent-color)]">
                        Phase {step.stepNumber}
                      </span>
                      <span className="chip">
                        {step.duration}
                      </span>
                    </div>

                    <h3 className="font-semibold text-sm tracking-tight leading-snug">
                      {step.title}
                    </h3>

                    <p className="caption">
                      {step.description}
                    </p>

                    <div className="space-y-1.5 pt-1">
                      <p className="caption font-medium">Focus</p>
                      <div className="flex flex-wrap gap-1">
                        {step.skillsToLearn.map((skill, sIdx) => (
                          <span key={sIdx} className="chip chip-success">
                            {skill}
                          </span>
                        ))}
                      </div>
                    </div>

                    <div className="space-y-1 pt-1">
                      <p className="caption font-medium">Deliverables</p>
                      <ul className="caption list-disc list-inside space-y-0.5">
                        {step.deliverables.map((del, dIdx) => (
                          <li key={dIdx}>{del}</li>
                        ))}
                      </ul>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          </div>
        </div>
      )}
    </div>
  );
};
