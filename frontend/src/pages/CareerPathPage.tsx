import React, { useState, useCallback, useMemo } from 'react';
import { api } from '../lib/api';
import { 
  Compass, 
  GraduationCap, 
  Briefcase, 
  UploadCloud, 
  CheckCircle2, 
  ArrowRight, 
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
  // Functional Input State
  const [audience, setAudience] = useState<'student' | 'pro'>('student');
  const [targetRole, setTargetRole] = useState('Machine Learning Engineer');
  const [skills, setSkills] = useState<string[]>(["Python", "FastAPI", "PyTorch", "React"]);
  const [skillInputBuffer, setSkillInputBuffer] = useState('');
  
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

  // Tag Input Handlers
  const handleAddSkill = (skillToAdd?: string) => {
    const value = (skillToAdd || skillInputBuffer).trim();
    if (!value) return;
    
    // Prevent duplicates (case-insensitive)
    if (!skills.some(s => s.toLowerCase() === value.toLowerCase())) {
      setSkills(prev => [...prev, value]);
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
    setSkills(prev => prev.filter(s => s !== skillToRemove));
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
        setExtractStatusMessage(`✓ Successfully extracted ${result.all_skills.length} skills from ${file.name}`);
      } else {
        setExtractStatusMessage(`✓ Attached ${file.name}`);
      }
    } catch (err: any) {
      console.warn("Resume extraction warning:", err);
      setExtractStatusMessage(`✓ Attached ${file.name}`);
    } finally {
      setIsExtractingResume(false);
    }
  }, []);

  // Submit / Generate Handler
  const handleGenerate = (e: React.FormEvent) => {
    e.preventDefault();
    if (!targetRole.trim() || skills.length === 0) return;

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
    <div className="p-6 md:p-10 max-w-7xl mx-auto space-y-10 font-sans text-[var(--text-main)]">
      {/* Top Header */}
      <div className="pb-4 flex flex-col md:flex-row md:items-center justify-between gap-4 font-mono border-b border-[var(--border-hairline)]">
        <div>
          <div className="text-xs font-bold text-[var(--text-muted)] uppercase flex items-center gap-1.5 mb-1">
            <Compass className="w-3.5 h-3.5 text-[var(--accent-color)]" /> $ skillsync career-path --interactive
          </div>
          <h1 className="text-2xl md:text-3xl font-extrabold tracking-tight text-[var(--text-main)] font-sans">
            Personalized Career Path Engine
          </h1>
        </div>

        {/* Audience Track Toggle Control */}
        <div className="flex p-0.5 rounded-sm bg-[var(--bg-surface)] border border-[var(--border-hairline)] font-mono text-xs">
          <button
            type="button"
            onClick={() => setAudience('student')}
            className={`flex items-center gap-1.5 px-3 py-1.5 font-bold rounded-sm transition-all cursor-pointer ${
              audience === 'student'
                ? 'btn-accent shadow-sm'
                : 'text-[var(--text-muted)] hover:text-[var(--text-main)]'
            }`}
          >
            <GraduationCap className="w-4 h-4" /> College Student
          </button>
          <button
            type="button"
            onClick={() => setAudience('pro')}
            className={`flex items-center gap-1.5 px-3 py-1.5 font-bold rounded-sm transition-all cursor-pointer ${
              audience === 'pro'
                ? 'btn-accent shadow-sm'
                : 'text-[var(--text-muted)] hover:text-[var(--text-main)]'
            }`}
          >
            <Briefcase className="w-4 h-4" /> Working Professional
          </button>
        </div>
      </div>

      {/* ========================================================================= */}
      {/* GATED STEP 1: CONFIGURE INPUT FORM (When hasGenerated === false) */}
      {/* ========================================================================= */}
      {!hasGenerated ? (
        <form onSubmit={handleGenerate} className="space-y-8 font-mono text-xs">
          <div className="p-6 md:p-8 rounded-sm bg-[var(--bg-surface)] border border-[var(--border-hairline)] space-y-6">
            <div className="flex items-center justify-between border-b border-[var(--border-hairline)] pb-4 font-sans">
              <div>
                <span className="text-xs font-mono font-bold text-[var(--accent-color)] uppercase tracking-wider block">
                  [01. CONFIGURE CAREER SIGNAL INPUTS]
                </span>
                <h2 className="text-xl font-extrabold text-[var(--text-main)]">
                  Add your skills or upload a resume to generate top 5 ranked career paths
                </h2>
              </div>
              <span className="hidden sm:inline-block px-2.5 py-1 rounded-sm bg-[var(--badge-bg)] text-[var(--badge-text)] font-mono text-xs font-bold border border-[var(--border-hairline)]">
                Track: {audience === 'student' ? 'College Student' : 'Working Pro'}
              </span>
            </div>

            {/* Input 1: Target Role Selection & Suggestions */}
            <div className="space-y-2">
              <label className="block text-[11px] font-bold text-[var(--text-muted)] uppercase flex items-center gap-1.5">
                <Target className="w-4 h-4 text-[var(--accent-color)]" /> Preferred Target Role / Direction *
              </label>
              <input
                type="text"
                value={targetRole}
                onChange={(e) => setTargetRole(e.target.value)}
                placeholder="e.g. Machine Learning Engineer, Backend Developer"
                className="w-full px-3.5 py-2.5 rounded-sm border border-[var(--border-hairline)] bg-[var(--bg-paper)] text-xs font-mono text-[var(--text-main)] focus:outline-none focus:border-[var(--accent-color)]"
                required
              />

              {/* Quick Role Suggestion Pills */}
              <div className="flex flex-wrap gap-1.5 pt-1">
                <span className="text-[10px] text-[var(--text-muted)] uppercase self-center mr-1">Suggestions:</span>
                {COMMON_ROLE_SUGGESTIONS.map((role) => (
                  <button
                    key={role}
                    type="button"
                    onClick={() => setTargetRole(role)}
                    className={`px-2 py-0.5 rounded-sm text-[10px] border transition-colors cursor-pointer ${
                      targetRole === role
                        ? 'btn-accent font-bold border-transparent'
                        : 'bg-[var(--bg-paper)] text-[var(--text-muted)] border-[var(--border-hairline)] hover:border-[var(--text-main)]'
                    }`}
                  >
                    + {role}
                  </button>
                ))}
              </div>
            </div>

            {/* Input 2: Resume PDF Upload (Auto-extracts skills via API) */}
            <div className="space-y-2">
              <label className="block text-[11px] font-bold text-[var(--text-muted)] uppercase flex items-center gap-1.5">
                <UploadCloud className="w-4 h-4 text-sky-500" /> Option A: Resume PDF Upload (Auto Skill Extractor)
              </label>

              <div className="border border-dashed border-[var(--border-hairline)] hover:border-[var(--accent-color)] rounded-sm p-5 text-center bg-[var(--bg-paper)] cursor-pointer transition-colors">
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
                      <span className="font-bold">$ parsing resume PDF vector skills...</span>
                    </div>
                  ) : (
                    <>
                      <UploadCloud className="w-6 h-6 text-[var(--accent-color)] mx-auto" />
                      <p className="font-bold text-[var(--text-main)] text-xs">
                        {resumeFile ? `Attached: ${resumeFile.name}` : "Drop resume PDF here or click to browse"}
                      </p>
                      <p className="text-[10px] text-[var(--text-muted)] font-sans">
                        Automatically extracts skills into the chip list below using backend /extract-skills/pdf
                      </p>
                    </>
                  )}
                </label>
              </div>

              {extractStatusMessage && (
                <p className="text-[11px] text-[#1A7F37] dark:text-[#2DA44E] font-mono font-semibold">
                  {extractStatusMessage}
                </p>
              )}
            </div>

            {/* Input 3: Structured Tag-style Skill Chips */}
            <div className="space-y-3">
              <div className="flex items-center justify-between">
                <label className="block text-[11px] font-bold text-[var(--text-muted)] uppercase flex items-center gap-1.5">
                  <Code2 className="w-4 h-4 text-[#2DA44E]" /> Option B: Interactive Skill Chips Input ({skills.length} added) *
                </label>
                <span className="text-[10px] text-[var(--text-muted)]">Type skill & press Enter or comma</span>
              </div>

              {/* Skill Input Bar */}
              <div className="flex gap-2">
                <input
                  type="text"
                  value={skillInputBuffer}
                  onChange={(e) => setSkillInputBuffer(e.target.value)}
                  onKeyDown={handleKeyDownSkill}
                  placeholder="e.g. PyTorch, Docker, FastAPI, Kubernetes"
                  className="flex-1 px-3.5 py-2.5 rounded-sm border border-[var(--border-hairline)] bg-[var(--bg-paper)] text-xs font-mono text-[var(--text-main)] focus:outline-none focus:border-[var(--accent-color)]"
                />
                <button
                  type="button"
                  onClick={() => handleAddSkill()}
                  className="px-4 py-2.5 rounded-sm btn-accent font-bold text-xs flex items-center gap-1 cursor-pointer"
                >
                  <Plus className="w-4 h-4" /> Add Skill
                </button>
              </div>

              {/* Active Skill Chips Container */}
              <div className="p-3.5 rounded-sm bg-[var(--bg-paper)] border border-[var(--border-hairline)] space-y-2 min-h-[60px]">
                <div className="text-[10px] font-bold text-[var(--text-muted)] uppercase">Active Skills List:</div>
                
                {skills.length > 0 ? (
                  <div className="flex flex-wrap gap-2">
                    {skills.map((skill) => (
                      <span
                        key={skill}
                        className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-sm bg-[var(--bg-surface)] text-[var(--text-main)] border border-[var(--border-hairline)] font-mono text-xs font-bold shadow-2xs group"
                      >
                        <span className="text-[#1A7F37] dark:text-[#2DA44E]">+</span> {skill}
                        <button
                          type="button"
                          onClick={() => handleRemoveSkill(skill)}
                          className="hover:text-[#CF222E] p-0.5 rounded-sm transition-colors cursor-pointer"
                          title={`Remove ${skill}`}
                        >
                          <X className="w-3 h-3" />
                        </button>
                      </span>
                    ))}
                  </div>
                ) : (
                  <p className="text-[11px] text-[var(--text-muted)] font-sans italic">
                    No skills added yet. Type a skill above or click one of the quick presets below.
                  </p>
                )}
              </div>

              {/* Quick Preset Skill Chips */}
              <div className="flex flex-wrap items-center gap-1.5 pt-1">
                <span className="text-[10px] text-[var(--text-muted)] uppercase mr-1">Quick Add:</span>
                {PRESET_SKILLS.map((preset) => {
                  const isAdded = skills.some(s => s.toLowerCase() === preset.toLowerCase());
                  return (
                    <button
                      key={preset}
                      type="button"
                      disabled={isAdded}
                      onClick={() => handleAddSkill(preset)}
                      className={`px-2 py-0.5 rounded-sm text-[10px] border transition-colors cursor-pointer ${
                        isAdded
                          ? 'opacity-40 bg-[var(--bg-paper)] text-[var(--text-muted)] border-transparent cursor-not-allowed'
                          : 'bg-[var(--bg-surface)] text-[var(--text-main)] border-[var(--border-hairline)] hover:border-[var(--accent-color)]'
                      }`}
                    >
                      + {preset}
                    </button>
                  );
                })}
              </div>
            </div>

            {/* Action Submit Button */}
            <button
              type="submit"
              disabled={isGenerating || !targetRole.trim() || skills.length === 0}
              className="w-full py-4 px-6 rounded-sm btn-accent font-mono font-extrabold text-xs flex items-center justify-center gap-2 cursor-pointer border border-transparent disabled:opacity-50"
            >
              {isGenerating ? (
                <>
                  <RefreshCw className="w-4 h-4 animate-spin" /> $ computing trajectory & top 5 role alignment matrix...
                </>
              ) : (
                <>
                  <Compass className="w-4 h-4" /> $ generate --career-path <ArrowRight className="w-4 h-4" />
                </>
              )}
            </button>
          </div>
        </form>
      ) : (
        /* ========================================================================= */
        /* STEP 2: GENERATED RECOMMENDATION ROADMAP VIEW */
        /* ========================================================================= */
        <div className="space-y-8 font-mono text-xs">
          {/* Header Action Bar: Reconfigure Inputs Button */}
          <div className="p-4 rounded-sm bg-[var(--bg-surface)] border border-[var(--border-hairline)] flex flex-col sm:flex-row sm:items-center justify-between gap-4 font-sans">
            <div className="space-y-0.5">
              <div className="flex items-center gap-2">
                <span className="text-[10px] font-mono text-[var(--accent-color)] font-bold uppercase">
                  [RECOMMENDATION GENERATED FROM YOUR INPUTS]
                </span>
                <span className="text-[9px] font-mono font-bold text-[var(--text-muted)] bg-[var(--bg-paper)] border border-[var(--border-hairline)] px-1.5 py-0.5 rounded-sm uppercase tracking-wider">
                  demo - ranked options
                </span>
              </div>
              <p className="text-xs font-bold text-[var(--text-main)]">
                Input Target Direction: <span className="text-[var(--accent-color)]">{targetRole}</span> • Track: <span className="capitalize">{audience === 'student' ? 'College Student' : 'Working Professional'}</span> • Skills: {skills.length} provided
              </p>
            </div>

            <button
              onClick={() => setHasGenerated(false)}
              className="px-3.5 py-2 rounded-sm bg-[var(--bg-paper)] text-[var(--text-main)] border border-[var(--border-hairline)] hover:border-[var(--text-main)] font-mono font-bold text-xs flex items-center justify-center gap-2 cursor-pointer shrink-0"
            >
              <Edit3 className="w-3.5 h-3.5 text-[var(--accent-color)]" /> Edit / Re-configure Inputs
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
                  <span className="text-xs font-mono font-bold text-[var(--accent-color)] uppercase tracking-wider">
                    [TOP 5 RANKED ROLE RECOMMENDATIONS LEADERBOARD]
                  </span>
                </div>
                <h2 className="text-lg font-extrabold text-[var(--text-main)]">
                  Top 5 Candidate Roles Ranked by Alignment %
                </h2>
                <p className="text-xs text-[var(--text-muted)]">
                  Select any of the 5 candidate roles below to inspect its detailed milestone roadmap. (Rank #1 auto-expanded)
                </p>
              </div>

              <span className="px-2.5 py-1 rounded-sm bg-[var(--bg-surface)] text-[var(--text-muted)] font-mono text-[10px] border border-[var(--border-hairline)] self-start sm:self-auto">
                5 Candidates Evaluated
              </span>
            </div>

            {/* Ranked List / Cards Set */}
            <div className="grid grid-cols-1 gap-3.5 font-mono">
              {rankedRoles.map((role, idx) => {
                const isSelected = selectedRoleIndex === idx;
                const isTop1 = idx === 0;

                return (
                  <div
                    key={role.title}
                    onClick={() => setSelectedRoleIndex(idx)}
                    className={`p-4 md:p-5 rounded-sm transition-all cursor-pointer border relative ${
                      isSelected
                        ? 'bg-[var(--bg-surface)] border-[var(--accent-color)] shadow-sm ring-1 ring-[var(--accent-color)]'
                        : 'bg-[var(--bg-paper)] border-[var(--border-hairline)] hover:border-[var(--text-main)] hover:bg-[var(--bg-surface)]'
                    }`}
                  >
                    <div className="flex flex-col md:flex-row md:items-center justify-between gap-3">
                      {/* Left: Rank Badge + Title + Match reason */}
                      <div className="space-y-2 flex-1">
                        <div className="flex items-center gap-2.5 flex-wrap">
                          {/* Rank Badge */}
                          <span
                            className={`px-2.5 py-0.5 rounded-sm font-extrabold text-[11px] uppercase tracking-wider flex items-center gap-1 ${
                              isTop1
                                ? 'btn-accent shadow-2xs font-bold border border-transparent'
                                : 'bg-[var(--bg-surface)] text-[var(--text-main)] border border-[var(--border-hairline)]'
                            }`}
                          >
                            {isTop1 ? <Sparkles className="w-3 h-3" /> : null}
                            #{role.rank} {isTop1 ? 'TOP MATCH' : 'CANDIDATE'}
                          </span>

                          <h3 className="text-base font-extrabold text-[var(--text-main)] font-sans flex items-center gap-2">
                            {role.title}
                          </h3>

                          {isSelected && (
                            <span className="px-2 py-0.5 rounded-sm bg-[#DAFBE1] text-[#1A7F37] dark:bg-[#2DA44E]/20 dark:text-[#2DA44E] font-bold text-[10px] border border-[#2DA44E]/30 flex items-center gap-1">
                              <CheckCircle2 className="w-3 h-3" /> ACTIVE ROADMAP VIEW
                            </span>
                          )}
                        </div>

                        {/* Why this fits line */}
                        <div className="text-[11px] font-sans text-[var(--text-muted)] flex items-center gap-1.5 pt-0.5">
                          <CheckCircle2 className="w-3.5 h-3.5 text-[#1A7F37] dark:text-[#2DA44E] shrink-0" />
                          <span className="font-mono text-[var(--text-main)] font-semibold">
                            {role.whyItFits}
                          </span>
                        </div>

                        {/* Critical Skill Gaps */}
                        <div className="flex flex-wrap items-center gap-1.5 pt-1 text-[11px]">
                          <span className="text-[10px] font-bold text-[var(--text-muted)] uppercase tracking-wider">
                            Gaps ({role.skillGaps.length}):
                          </span>
                          {role.skillGaps.length > 0 ? (
                            role.skillGaps.slice(0, 4).map((gap, gIdx) => (
                              <span
                                key={gIdx}
                                className="px-2 py-0.5 rounded-sm bg-[#FFEBE9] text-[#CF222E] dark:bg-[#CF222E]/20 dark:text-[#CF222E] border border-[#CF222E]/30 font-semibold text-[10px]"
                              >
                                - {gap}
                              </span>
                            ))
                          ) : (
                            <span className="text-[10px] text-[#1A7F37] dark:text-[#2DA44E] font-bold">
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

                      {/* Right: Alignment % Badge & Action */}
                      <div className="flex md:flex-col items-center md:items-end justify-between gap-2 shrink-0 border-t md:border-t-0 pt-2 md:pt-0 border-[var(--border-hairline)]">
                        <div className="flex items-center gap-2">
                          <span
                            className={`px-3 py-1.5 rounded-sm font-mono font-bold text-xs md:text-sm border ${
                              role.alignmentPercent >= 70
                                ? 'bg-[#DAFBE1] text-[#1A7F37] dark:bg-[#2DA44E]/20 dark:text-[#2DA44E] border-[#2DA44E]/30'
                                : role.alignmentPercent >= 50
                                ? 'bg-sky-500/10 text-sky-600 dark:text-sky-400 border-sky-500/30'
                                : 'bg-amber-500/10 text-amber-600 dark:text-amber-400 border-amber-500/30'
                            }`}
                          >
                            {role.alignmentPercent}% Alignment
                          </span>
                        </div>

                        <span className="text-[11px] text-[var(--accent-color)] font-mono font-bold flex items-center gap-1">
                          {isSelected ? 'Viewing Detailed Roadmap' : 'Select to view roadmap'} <ChevronRight className="w-3.5 h-3.5" />
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
          {/* Target Alignment Summary Box */}
          <div className="p-6 rounded-sm bg-[var(--bg-surface)] border border-[var(--border-hairline)] space-y-6">
            <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 border-b border-[var(--border-hairline)] pb-4">
              <div className="space-y-1">
                <span className="text-[11px] font-mono font-bold text-[var(--text-muted)] uppercase tracking-wider">
                  [DRILL-DOWN: SELECTED TARGET ROLE ALIGNMENT - RANK #{activeRole.rank} OF 5]
                </span>
                <h2 className="text-xl font-extrabold text-[var(--text-main)] flex items-center gap-2 font-sans">
                  <Target className="w-5 h-5 text-[var(--accent-color)]" /> {activeRole.title}
                </h2>
              </div>

              <div className="flex items-center gap-3 font-mono">
                <span className="text-xs text-[var(--text-muted)]">Track: {audience === 'student' ? 'Skill Building' : 'Career Transition'}</span>
                <span className="px-3 py-1 bg-[#DAFBE1] text-[#1A7F37] dark:bg-[#2DA44E]/20 dark:text-[#2DA44E] border border-[#2DA44E]/30 rounded-sm font-bold text-xs">
                  {activeRole.alignmentPercent}% Alignment
                </span>
              </div>
            </div>

            {/* Identified Skill Gaps List */}
            <div className="space-y-2 font-mono text-xs">
              <div className="text-[11px] font-bold text-[var(--text-muted)] uppercase tracking-wider">
                Critical Skill Gaps to Bridge ({activeRole.skillGaps.length}):
              </div>

              {activeRole.skillGaps.length > 0 ? (
                <div className="flex flex-wrap gap-2">
                  {activeRole.skillGaps.map((gap, idx) => (
                    <span
                      key={idx}
                      className="px-2.5 py-1 rounded-sm bg-[#FFEBE9] text-[#CF222E] dark:bg-[#CF222E]/20 dark:text-[#CF222E] border border-[#CF222E]/30 font-semibold"
                    >
                      - {gap}
                    </span>
                  ))}
                </div>
              ) : (
                <span className="px-3 py-1 rounded-sm bg-[#DAFBE1] text-[#1A7F37] dark:bg-[#2DA44E]/20 dark:text-[#2DA44E] font-bold text-xs">
                  ✓ All core baseline skills present in your input profile!
                </span>
              )}
            </div>
          </div>

          {/* Sequential Milestone Roadmap Steps */}
          <div className="space-y-6">
            <div className="flex items-center justify-between font-mono">
              <span className="text-xs font-bold text-[var(--accent-color)] uppercase tracking-wider flex items-center gap-1.5">
                <Compass className="w-4 h-4" /> [RECOMMENDED MILESTONE ROADMAP FOR {activeRole.title.toUpperCase()}]
              </span>
              <span className="text-xs text-[var(--text-muted)]">3 Phases • {audience === 'student' ? '12 Weeks' : '3 Months'}</span>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-3 gap-6 font-mono text-xs">
              {roadmapSteps.map((step) => (
                <div
                  key={step.stepNumber}
                  className="p-5 rounded-sm bg-[var(--bg-surface)] border border-[var(--border-hairline)] space-y-4 flex flex-col justify-between hover:border-[var(--accent-color)] transition-colors"
                >
                  <div className="space-y-3">
                    <div className="flex items-center justify-between border-b border-[var(--border-hairline)] pb-2">
                      <span className="font-bold text-[var(--accent-color)] text-xs">
                        STEP 0{step.stepNumber}
                      </span>
                      <span className="text-[11px] text-[var(--text-muted)] bg-[var(--bg-paper)] px-2 py-0.5 border border-[var(--border-hairline)] rounded-sm">
                        {step.duration}
                      </span>
                    </div>

                    <h3 className="font-extrabold text-sm text-[var(--text-main)] font-sans leading-tight">
                      {step.title}
                    </h3>

                    <p className="text-[11px] font-sans text-[var(--text-muted)] leading-relaxed">
                      {step.description}
                    </p>

                    {/* Skills to Learn */}
                    <div className="space-y-1 pt-1">
                      <div className="text-[10px] font-bold text-[var(--text-muted)] uppercase">Focus Skills:</div>
                      <div className="space-y-1">
                        {step.skillsToLearn.map((skill, sIdx) => (
                          <div key={sIdx} className="text-[#1A7F37] dark:text-[#2DA44E] bg-[#DAFBE1] dark:bg-[#2DA44E]/10 px-2 py-0.5 border border-[#2DA44E]/30 rounded-sm text-[11px]">
                            + {skill}
                          </div>
                        ))}
                      </div>
                    </div>

                    {/* Deliverables */}
                    <div className="space-y-1 pt-1">
                      <div className="text-[10px] font-bold text-[var(--text-muted)] uppercase">Key Deliverables:</div>
                      <ul className="list-disc list-inside text-[11px] text-[var(--text-muted)] font-sans space-y-0.5">
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

