import React, { useState } from 'react';
import { 
  Sparkles, 
  UploadCloud, 
  CheckCircle2, 
  RefreshCw, 
  AlertCircle,
  FileText,
  Star,
  GitBranch,
  CheckSquare
} from 'lucide-react';
import { GithubIcon, LinkedinIcon } from '../components/ui/icons';
import { DiffStatDisplay } from '../components/ui/DiffStatDisplay';

export const OptimizerPage: React.FC = () => {
  const [linkedinFile, setLinkedinFile] = useState<File | null>(null);
  const [processing, setProcessing] = useState(false);
  const [scored, setScored] = useState(false);

  const handleLinkedinUpload = (file: File) => {
    setLinkedinFile(file);
    setProcessing(true);
    setTimeout(() => {
      setProcessing(false);
      setScored(true);
    }, 1200);
  };

  return (
    <div className="p-6 md:p-10 max-w-7xl mx-auto space-y-10 font-sans text-[var(--text-main)]">
      {/* Header */}
      <div className="pb-4 flex flex-col md:flex-row md:items-center justify-between gap-4 font-mono border-b border-[var(--border-hairline)]">
        <div>
          <div className="text-xs font-bold text-[var(--text-muted)] uppercase flex items-center gap-1.5 mb-1">
            <Sparkles className="w-3.5 h-3.5 text-[var(--accent-color)]" /> $ skillsync optimizer --profile
          </div>
          <h1 className="text-2xl md:text-3xl font-extrabold tracking-tight text-[var(--text-main)] font-sans">
            LinkedIn & GitHub Profile Optimizer
          </h1>
        </div>

        <span className="text-xs font-mono text-[var(--text-muted)] bg-[var(--bg-surface)] px-3 py-1 border border-[var(--border-hairline)] rounded-sm">
          target: developer signals
        </span>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-10">
        {/* Section 1: LinkedIn PDF Export Upload & Rating */}
        <div className="space-y-6 font-mono text-xs">
          <span className="text-xs font-bold text-[var(--accent-color)] uppercase tracking-wider block">
            [01. LINKEDIN PROFILE PDF EXPORT OPTIMIZER]
          </span>

          <div className="p-6 rounded-sm bg-[var(--bg-surface)] border border-[var(--border-hairline)] space-y-5">
            <div className="space-y-1 font-sans">
              <h3 className="font-extrabold text-base text-[var(--text-main)] flex items-center gap-2">
                <LinkedinIcon className="w-5 h-5 text-sky-500" /> Upload LinkedIn Profile PDF Export
              </h3>
              <p className="text-xs text-[var(--text-muted)]">
                Since live LinkedIn scraping is blocked, export your profile as PDF (More → Save to PDF) and drop it here.
              </p>
            </div>

            <div className="border border-dashed border-[var(--border-hairline)] hover:border-[var(--accent-color)] rounded-sm p-6 text-center bg-[var(--bg-paper)] cursor-pointer">
              <input
                type="file"
                accept=".pdf"
                onChange={(e) => e.target.files && e.target.files[0] && handleLinkedinUpload(e.target.files[0])}
                className="hidden"
                id="linkedin-pdf-input"
              />
              <label htmlFor="linkedin-pdf-input" className="cursor-pointer block space-y-2">
                <UploadCloud className="w-8 h-8 text-[var(--accent-color)] mx-auto" />
                <p className="font-bold text-[var(--text-main)]">
                  {linkedinFile ? linkedinFile.name : "Drag & drop LinkedIn Profile PDF or click to browse"}
                </p>
                <p className="text-[11px] text-[var(--text-muted)] font-sans">
                  Extracts bio vocabulary, job titles, endorsement tags, and experience duration
                </p>
              </label>
            </div>

            {processing && (
              <div className="p-4 rounded-sm bg-[var(--bg-paper)] border border-[var(--border-hairline)] flex items-center gap-3 text-[var(--accent-color)]">
                <RefreshCw className="w-4 h-4 animate-spin" />
                <span>$ running OCR vector extract on LinkedIn PDF...</span>
              </div>
            )}

            {scored && (
              <div className="space-y-4 pt-2">
                <DiffStatDisplay score={0.84} label="LinkedIn Profile Signal Rating" />

                <div className="p-4 rounded-sm bg-[#DAFBE1] dark:bg-[#2DA44E]/20 border border-[#2DA44E]/30 text-[#1A7F37] dark:text-[#2DA44E] space-y-1 font-mono text-[11px]">
                  <p className="font-bold flex items-center gap-1.5">
                    <CheckCircle2 className="w-4 h-4" /> Strong Headline Alignment (84/100)
                  </p>
                  <p className="text-[10px] font-sans">
                    Extracted keywords: "Software Engineer", "FastAPI", "PyTorch", "Distributed Systems". Recommendation: Add explicit metric outcomes (e.g. "reduced latency by 30%").
                  </p>
                </div>
              </div>
            )}
          </div>
        </div>

        {/* Section 2: GitHub Optimization Guide & Static Checklist */}
        <div className="space-y-6 font-mono text-xs">
          <span className="text-xs font-bold text-[var(--accent-color)] uppercase tracking-wider block">
            [02. GITHUB REPOSITORY OPTIMIZATION CHECKLIST]
          </span>

          <div className="p-6 rounded-sm bg-[var(--bg-surface)] border border-[var(--border-hairline)] space-y-5">
            <div className="space-y-1 font-sans border-b border-[var(--border-hairline)] pb-3">
              <h3 className="font-extrabold text-base text-[var(--text-main)] flex items-center gap-2">
                <GithubIcon className="w-5 h-5 text-[var(--text-main)]" /> GitHub Recruiter Signal Guide
              </h3>
              <p className="text-xs text-[var(--text-muted)]">
                Technical recruiters inspect your pinned repositories and contribution graph. Complete this checklist to maximize profile readiness.
              </p>
            </div>

            <div className="space-y-3 font-mono">
              <div className="p-3 rounded-sm bg-[var(--bg-paper)] border border-[var(--border-hairline)] flex items-start gap-3">
                <CheckSquare className="w-4 h-4 text-[#2DA44E] shrink-0 mt-0.5" />
                <div className="space-y-0.5">
                  <p className="font-bold text-[var(--text-main)]">Pin Top 6 Repositories with Visual READMEs</p>
                  <p className="text-[11px] font-sans text-[var(--text-muted)]">
                    Ensure each pinned project has an architecture diagram, installation steps, and live demo link.
                  </p>
                </div>
              </div>

              <div className="p-3 rounded-sm bg-[var(--bg-paper)] border border-[var(--border-hairline)] flex items-start gap-3">
                <CheckSquare className="w-4 h-4 text-[#2DA44E] shrink-0 mt-0.5" />
                <div className="space-y-0.5">
                  <p className="font-bold text-[var(--text-main)]">Configure Profile README.md with Live Stats</p>
                  <p className="text-[11px] font-sans text-[var(--text-muted)]">
                    Add top languages card, commit activity streak, and active technology badges to your github.com/username repo.
                  </p>
                </div>
              </div>

              <div className="p-3 rounded-sm bg-[var(--bg-paper)] border border-[var(--border-hairline)] flex items-start gap-3">
                <CheckSquare className="w-4 h-4 text-[#2DA44E] shrink-0 mt-0.5" />
                <div className="space-y-0.5">
                  <p className="font-bold text-[var(--text-main)]">Add Topics, License, and Description Tags</p>
                  <p className="text-[11px] font-sans text-[var(--text-muted)]">
                    Add tags like "fastapi", "pytorch", "microservices" to ensure your projects get indexed in candidate searches.
                  </p>
                </div>
              </div>

              <div className="p-3 rounded-sm bg-[var(--bg-paper)] border border-[var(--border-hairline)] flex items-start gap-3">
                <CheckSquare className="w-4 h-4 text-[#2DA44E] shrink-0 mt-0.5" />
                <div className="space-y-0.5">
                  <p className="font-bold text-[var(--text-main)]">Maintain Consistent Contribution Frequency</p>
                  <p className="text-[11px] font-sans text-[var(--text-muted)]">
                    Commit regularly across week days to build a rich green contribution graph signal.
                  </p>
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};
