import React, { useState } from 'react';
import {
  Download,
  Code,
  Check,
  Eye,
  User
} from 'lucide-react';

interface ResumeTemplate {
  id: string;
  name: string;
  category: string;
  description: string;
  color: string;
}

const RESUME_TEMPLATES: ResumeTemplate[] = [
  { id: 'modern-tech', name: 'Modern Tech', category: 'Software / ML', description: 'Clean two-column layout with monospace skill chips and GitHub signal badges.', color: 'bg-emerald-500' },
  { id: 'minimal-eng', name: 'Minimalist Engineer', category: 'Backend / Systems', description: 'Ultra-clean single-column Markdown/LaTeX theme emphasizing impact metrics.', color: 'bg-blue-500' },
  { id: 'exec-pro', name: 'Executive Pro', category: 'Leadership / Staff', description: 'Structured corporate layout with prominent title headers and publication sections.', color: 'bg-indigo-500' },
  { id: 'academic-research', name: 'Academic Research', category: 'AI / PhD', description: 'LaTeX Computer Modern style optimized for research papers, patents, and citations.', color: 'bg-purple-500' },
  { id: 'compact-single', name: 'Compact Single-Page', category: 'Fullstack / General', description: 'High-density layout designed to fit extensive experience onto 1 page cleanly.', color: 'bg-orange-500' },
];

export const ResumeBuilderPage: React.FC = () => {
  const [selectedTemplate, setSelectedTemplate] = useState('modern-tech');
  const [activeTab, setActiveTab] = useState<'form' | 'preview'>('form');

  // Form State
  const [fullName, setFullName] = useState('Alex Developer');
  const [email, setEmail] = useState('alex.developer@example.com');
  const [phone, setPhone] = useState('+1 (555) 019-2834');
  const [githubUrl, setGithubUrl] = useState('https://github.com/tourist');
  const [summary, setSummary] = useState(
    'Software Engineer with 4+ years of experience building high-throughput ML pipelines, FastAPI microservices, and distributed systems.'
  );
  const [skills, setSkills] = useState('Python, FastAPI, PyTorch, React, TypeScript, Docker, SQL, Redis, Vector DBs');
  const [experience, setExperience] = useState(
    'Senior ML Engineer @ TechScale (2023 - Present)\n- Optimized PyTorch model latency by 42% using vLLM and ONNX Runtime.\n- Architected async FastAPI backend serving 10M+ daily requests.'
  );

  return (
    <div className="p-6 md:p-10 max-w-7xl mx-auto space-y-10 text-[var(--text-main)] animate-fade-in">
      {/* Header */}
      <div className="flex flex-col md:flex-row md:items-end justify-between gap-4">
        <div>
          <h1 className="h-section text-2xl md:text-3xl">
            Resume builder
          </h1>
          <p className="caption mt-1">Pick a template, fill in your details, preview the result.</p>
        </div>

        <div className="segment">
          <button
            onClick={() => setActiveTab('form')}
            className={`segment-btn ${activeTab === 'form' ? 'segment-btn-active' : ''}`}
          >
            Details
          </button>
          <button
            onClick={() => setActiveTab('preview')}
            className={`segment-btn ${activeTab === 'preview' ? 'segment-btn-active' : ''}`}
          >
            Preview
          </button>
        </div>
      </div>

      <div className="space-y-3">
        <p className="font-semibold text-[14px] tracking-tight">Choose a template</p>

        <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-5 gap-3 stagger-children">
          {RESUME_TEMPLATES.map((tmpl) => {
            const isSelected = selectedTemplate === tmpl.id;
            return (
              <div
                key={tmpl.id}
                onClick={() => setSelectedTemplate(tmpl.id)}
                className={`card card-lift p-4 cursor-pointer flex flex-col justify-between ${
                  isSelected
                    ? '!border-[var(--accent-color)] ring-2 ring-[var(--accent-color)]/25'
                    : 'hover:border-[var(--border-strong)]'
                }`}
              >
                <div className="space-y-1">
                  <div className="flex items-center justify-between">
                    <span className="text-[10px] font-bold text-[var(--text-muted)] uppercase">
                      {tmpl.category}
                    </span>
                    {isSelected && <Check className="w-3.5 h-3.5 text-[var(--accent-color)]" />}
                  </div>
                  <h4 className="font-extrabold text-xs text-[var(--text-main)] font-sans leading-tight">
                    {tmpl.name}
                  </h4>
                  <p className="text-[10px] font-sans text-[var(--text-muted)] line-clamp-2">
                    {tmpl.description}
                  </p>
                </div>

                <div className="h-1.5 w-full bg-[var(--bg-paper)] rounded-full overflow-hidden mt-2 border border-[var(--border-hairline)]">
                  <div className={`h-full ${tmpl.color} w-3/4 rounded-full`} />
                </div>
              </div>
            );
          })}
        </div>
      </div>

      {/* Main Content Area: Form vs Live Preview */}
      {activeTab === 'form' ? (
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
          {/* Form Fields Section */}
          <div className="card p-6 md:p-8 space-y-5">
            <div className="font-semibold text-[15px] tracking-tight flex items-center gap-2">
              <User className="w-4 h-4 text-[var(--accent-color)]" /> Personal & Contact Info
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
              <div>
                <label className="field-label mb-1">Full Name</label>
                <input
                  type="text"
                  value={fullName}
                  onChange={(e) => setFullName(e.target.value)}
                  className="w-full px-3.5 py-2.5 input-glow"
                />
              </div>

              <div>
                <label className="field-label mb-1">Email</label>
                <input
                  type="email"
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  className="w-full px-3.5 py-2.5 input-glow"
                />
              </div>

              <div>
                <label className="field-label mb-1">Phone</label>
                <input
                  type="text"
                  value={phone}
                  onChange={(e) => setPhone(e.target.value)}
                  className="w-full px-3.5 py-2.5 input-glow"
                />
              </div>

              <div>
                <label className="field-label mb-1">GitHub URL</label>
                <input
                  type="text"
                  value={githubUrl}
                  onChange={(e) => setGithubUrl(e.target.value)}
                  className="w-full px-3.5 py-2.5 input-glow"
                />
              </div>
            </div>

            <div>
              <label className="field-label mb-1">Professional Summary</label>
              <textarea
                rows={3}
                value={summary}
                onChange={(e) => setSummary(e.target.value)}
                className="w-full p-3.5 input-glow"
              />
            </div>

            <div>
              <label className="field-label mb-1">Skills Array (Comma Separated)</label>
              <textarea
                rows={2}
                value={skills}
                onChange={(e) => setSkills(e.target.value)}
                className="w-full p-3.5 input-glow"
              />
            </div>

            <div>
              <label className="field-label mb-1">Work Experience & Projects</label>
              <textarea
                rows={4}
                value={experience}
                onChange={(e) => setExperience(e.target.value)}
                className="w-full p-3.5 input-glow"
              />
            </div>
          </div>

          {/* Quick Rendered Draft Box */}
          <div className="card p-6 md:p-8 space-y-5 flex flex-col justify-between">
            <div className="space-y-4">
              <div className="border-b border-[var(--border-hairline)] pb-3 font-bold text-[var(--text-main)] uppercase flex items-center justify-between">
                <span className="flex items-center gap-2">
                  <Eye className="w-4 h-4 text-[var(--accent-color)]" /> Template Preview: {selectedTemplate}
                </span>
                <span className="caption">Draft</span>
              </div>

              {/* Rendered Document Mock Box */}
              <div className="p-6 bg-[var(--bg-paper)] text-[var(--text-main)] rounded-xl border border-[var(--border-hairline)] space-y-3 font-sans text-xs">
                <div className="border-b border-[var(--border-hairline)] pb-2 text-center space-y-0.5">
                  <h3 className="font-extrabold text-base tracking-tight">{fullName}</h3>
                  <p className="text-[10px] text-[var(--text-muted)]">{email} • {phone} • {githubUrl}</p>
                </div>

                <div className="space-y-1">
                  <h4 className="font-bold text-[11px] uppercase border-b border-[var(--border-hairline)] pb-0.5 text-[var(--text-muted)]">Summary</h4>
                  <p className="text-[11px] text-[var(--text-muted)] leading-tight">{summary}</p>
                </div>

                <div className="space-y-1">
                  <h4 className="font-bold text-[11px] uppercase border-b border-[var(--border-hairline)] pb-0.5 text-[var(--text-muted)]">Skills</h4>
                  <p className="text-[11px] font-mono text-[var(--diff-add)]">{skills}</p>
                </div>

                <div className="space-y-1">
                  <h4 className="font-bold text-[11px] uppercase border-b border-[var(--border-hairline)] pb-0.5 text-[var(--text-muted)]">Experience</h4>
                  <pre className="text-[10px] font-mono text-[var(--text-muted)] whitespace-pre-wrap">{experience}</pre>
                </div>
              </div>
            </div>

            <button
              onClick={() => setActiveTab('preview')}
              className="btn-primary w-full py-3 px-4 text-sm"
            >
              Continue to preview
            </button>
          </div>
        </div>
      ) : (
        /* Rendered Document & Mock Code Screen */
        <div className="card p-6 md:p-8 space-y-6">
          <div className="flex flex-col sm:flex-row sm:items-center justify-between border-b border-[var(--border-hairline)] pb-4 gap-3">
            <div>
              <span className="font-bold text-sm text-[var(--text-main)] block font-sans">
                Rendered LaTeX PDF Preview ({selectedTemplate})
              </span>
              <span className="text-[11px] text-[var(--text-muted)]">Template compiled successfully</span>
            </div>

            <div className="flex gap-2">
              <button className="btn-secondary px-4 py-2 text-[13px]">
                <Code className="w-3.5 h-3.5" /> View Raw LaTeX
              </button>
              <button
                disabled
                title="PDF export coming soon"
                className="btn-primary px-4 py-2 text-[13px] opacity-50 cursor-not-allowed"
              >
                <Download className="w-3.5 h-3.5" /> Download PDF
              </button>
            </div>
          </div>

          {/* Rendered document mock */}
          <div className="p-8 bg-[var(--bg-paper)] text-[var(--text-main)] rounded-2xl border border-[var(--border-hairline)] space-y-4 font-sans max-w-3xl mx-auto shadow-lg">
            <div className="border-b-2 border-[var(--border-hairline)] pb-3 text-center space-y-1">
              <h2 className="font-extrabold text-xl tracking-tight uppercase">{fullName}</h2>
              <p className="text-xs text-[var(--text-muted)]">{email} | {phone} | {githubUrl}</p>
            </div>

            <div className="space-y-1">
              <h3 className="font-extrabold text-xs uppercase border-b border-[var(--border-hairline)] pb-0.5 text-[var(--text-muted)]">
                Professional Overview
              </h3>
              <p className="text-xs text-[var(--text-main)] leading-relaxed">{summary}</p>
            </div>

            <div className="space-y-1">
              <h3 className="font-extrabold text-xs uppercase border-b border-[var(--border-hairline)] pb-0.5 text-[var(--text-muted)]">
                Technical Proficiencies
              </h3>
              <p className="text-xs font-mono text-[var(--text-main)] bg-[var(--bg-surface)] p-3 rounded-xl border border-[var(--border-hairline)]">{skills}</p>
            </div>

            <div className="space-y-1">
              <h3 className="font-extrabold text-xs uppercase border-b border-[var(--border-hairline)] pb-0.5 text-[var(--text-muted)]">
                Work Experience & Engineering Achievements
              </h3>
              <pre className="text-xs font-sans text-[var(--text-main)] whitespace-pre-wrap leading-relaxed">{experience}</pre>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};
