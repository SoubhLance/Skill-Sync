import React, { useState } from 'react';
import { api, LinkedInScoreResponse } from '../lib/api';
import { DiffStatDisplay } from '../components/ui/DiffStatDisplay';
import { GithubIcon, LinkedinIcon } from '../components/ui/icons';
import { 
  Sparkles, 
  UploadCloud, 
  CheckCircle2, 
  RefreshCw, 
  AlertCircle, 
  AlertTriangle,
  FileText,
  Star,
  GitBranch,
  CheckSquare,
  Layers,
  HelpCircle
} from 'lucide-react';

export const OptimizerPage: React.FC = () => {
  const [linkedinFile, setLinkedinFile] = useState<File | null>(null);
  const [loading, setLoading] = useState(false);
  const [scoreResult, setScoreResult] = useState<LinkedInScoreResponse | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [isScannedPdfError, setIsScannedPdfError] = useState(false);

  const handleLinkedinUpload = async (file: File) => {
    setLinkedinFile(file);
    setLoading(true);
    setError(null);
    setIsScannedPdfError(false);
    setScoreResult(null);

    try {
      const data = await api.optimizeLinkedinPdf(file);
      setScoreResult(data);
    } catch (err: any) {
      console.error("LinkedIn Optimizer error:", err);
      const detail = err?.response?.data?.detail || "Failed to analyze LinkedIn profile PDF.";
      setError(detail);
      if (err?.response?.status === 422 || (typeof detail === 'string' && detail.toLowerCase().includes('no extractable text'))) {
        setIsScannedPdfError(true);
      }
    } finally {
      setLoading(false);
    }
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
        {/* Section 1: LinkedIn PDF Export Upload & Live Backend Rating */}
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
                Since live LinkedIn scraping is blocked, export your profile as PDF (Profile → More → Save to PDF) and drop it here.
              </p>
            </div>

            {/* Dropzone */}
            <div className="border border-dashed border-[var(--border-hairline)] hover:border-[var(--accent-color)] rounded-sm p-6 text-center bg-[var(--bg-paper)] cursor-pointer transition-colors">
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
                  Analyzes headline impact, experience metrics, skill density, and missing recruiter keywords
                </p>
              </label>
            </div>

            {/* In-flight Loading State */}
            {loading && (
              <div className="p-4 rounded-sm bg-[var(--bg-paper)] border border-[var(--border-hairline)] flex items-center justify-center gap-3 text-[var(--accent-color)] font-mono">
                <RefreshCw className="w-4 h-4 animate-spin" />
                <span>$ parsing PyMuPDF spans & scoring profile signals...</span>
              </div>
            )}

            {/* 422 Scanned PDF / Image Error State */}
            {isScannedPdfError && (
              <div className="p-4 rounded-sm bg-[#FFEBE9] border border-[#CF222E]/40 text-[#CF222E] space-y-2 font-mono text-xs">
                <div className="font-extrabold flex items-center gap-2 text-sm">
                  <AlertTriangle className="w-4 h-4 text-[#CF222E] shrink-0" />
                  <span>PDF Has No Extractable Text</span>
                </div>
                <p className="text-[11px] font-sans text-slate-700 dark:text-slate-300 leading-relaxed">
                  This PDF appears to be a scanned image or screenshot. Please re-export your profile directly using LinkedIn's native feature:
                </p>
                <div className="bg-[#FFFFFF] dark:bg-[#0B0F17] p-2.5 rounded-sm border border-[#CF222E]/30 text-[11px] text-[var(--text-main)] font-mono">
                  Go to LinkedIn Profile → Click <strong>More</strong> button → Select <strong>"Save to PDF"</strong>
                </div>
              </div>
            )}

            {/* Generic non-422 Error State */}
            {error && !isScannedPdfError && (
              <div className="p-4 rounded-sm bg-[#FFEBE9] border border-[#CF222E]/40 text-[#CF222E] flex items-center gap-2 font-mono text-xs">
                <AlertCircle className="w-4 h-4 shrink-0" />
                <span>{error}</span>
              </div>
            )}

            {/* Real API Score Result */}
            {scoreResult && (
              <div className="space-y-6 pt-2 font-mono">
                <DiffStatDisplay score={scoreResult.score / 100} label="LinkedIn Profile Optimization Score" />

                {/* Detected Sections Badges */}
                {scoreResult.sections_detected.length > 0 && (
                  <div className="space-y-2">
                    <div className="text-[10px] font-bold text-[var(--text-muted)] uppercase tracking-wider">
                      Detected Profile Sections ({scoreResult.sections_detected.length}):
                    </div>
                    <div className="flex flex-wrap gap-1.5">
                      {scoreResult.sections_detected.map((sec, idx) => (
                        <span key={idx} className="px-2 py-0.5 rounded-sm bg-[#DAFBE1] text-[#1A7F37] dark:bg-[#2DA44E]/20 dark:text-[#2DA44E] border border-[#2DA44E]/30 text-[10px] font-bold">
                          ✓ {sec}
                        </span>
                      ))}
                    </div>
                  </div>
                )}

                {/* Breakdown Metrics */}
                {Object.keys(scoreResult.breakdown).length > 0 && (
                  <div className="space-y-2">
                    <div className="text-[10px] font-bold text-[var(--text-muted)] uppercase tracking-wider">
                      Category Breakdown Ratings:
                    </div>
                    <div className="grid grid-cols-2 gap-2">
                      {Object.entries(scoreResult.breakdown).map(([key, val]) => (
                        <div key={key} className="p-2.5 rounded-sm bg-[var(--bg-paper)] border border-[var(--border-hairline)] flex justify-between items-center">
                          <span className="text-[11px] font-sans text-[var(--text-muted)] capitalize">{key.replace(/_/g, ' ')}</span>
                          <span className="font-bold text-[var(--accent-color)]">{typeof val === 'number' ? (val <= 1 ? `${(val * 100).toFixed(0)}%` : val) : val}</span>
                        </div>
                      ))}
                    </div>
                  </div>
                )}

                {/* Critical Gaps & Recommendations */}
                {scoreResult.gaps.length > 0 && (
                  <div className="space-y-2">
                    <div className="text-[10px] font-bold text-[#CF222E] uppercase tracking-wider">
                      Optimization Gaps to Fix ({scoreResult.gaps.length}):
                    </div>
                    <div className="space-y-1.5 font-mono text-[11px]">
                      {scoreResult.gaps.map((gap, idx) => (
                        <div key={idx} className="p-2 rounded-sm bg-[#FFEBE9] text-[#CF222E] dark:bg-[#CF222E]/20 border border-[#CF222E]/30 font-semibold flex items-start gap-2">
                          <span className="shrink-0">-</span>
                          <span>{gap}</span>
                        </div>
                      ))}
                    </div>
                  </div>
                )}
              </div>
            )}
          </div>
        </div>

        {/* Section 2: GitHub Optimization Guide & Static Checklist (Frontend-only) */}
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
