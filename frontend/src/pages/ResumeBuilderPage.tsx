import React, { useState } from 'react';
import { 
  FileText, 
  Download, 
  Code, 
  Check, 
  Eye,
  User,
  Sparkles
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
    <div className="p-6 md:p-10 max-w-7xl mx-auto space-y-10 font-sans text-[var(--text-main)] animate-fade-in">
      {/* Header */}
      <div className="pb-4 flex flex-col md:flex-row md:items-center justify-between gap-4 font-mono border-b border-[var(--border-hairline)]">
        <div>
          <div className="text-xs font-bold text-[var(--text-muted)] uppercase flex items-center gap-1.5 mb-1">
            <FileText className="w-3.5 h-3.5 text-[var(--accent-color)]" /> $ skillsync resume-builder --generate
          </div>
          <h1 className="text-2xl md:text-3xl font-extrabold tracking-tight text-[var(--text-main)] font-sans">
            LaTeX Resume Builder
          </h1>
        </div>

        {/* Form vs Live Preview Tab Switcher */}
        <div className="flex p-1 rounded-xl bg-[var(--bg-surface)] border border-[var(--border-hairline)] font-mono text-xs">
          <button
            onClick={() => setActiveTab('form')}
            className={`px-4 py-2 font-bold rounded-lg transition-all cursor-pointer ${
              activeTab === 'form' ? 'btn-accent shadow-sm' : 'text-[var(--text-muted)] hover:text-[var(--text-main)]'
            }`}
          >
            Form & Details
          </button>
          <button
            onClick={() => setActiveTab('preview')}
            className={`px-4 py-2 font-bold rounded-lg transition-all cursor-pointer ${
              activeTab === 'preview' ? 'btn-accent shadow-sm' : 'text-[var(--text-muted)] hover:text-[var(--text-main)]'
            }`}
          >
            Live Rendered Preview
          </button>
        </div>
      </div>

      {/* 5 Template Selector Cards Bar */}
      <div className="space-y-3 font-mono">
        <div className="text-xs font-bold text-[var(--accent-color)] uppercase tracking-wider">
          [SELECT FROM 5 PRE-DESIGNED TEMPLATES]
        </div>

        <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-5 gap-3 stagger-children">
          {RESUME_TEMPLATES.map((tmpl) => {
            const isSelected = selectedTemplate === tmpl.id;
            return (
              <div
                key={tmpl.id}
                onClick={() => setSelectedTemplate(tmpl.id)}
                className={`p-4 rounded-xl glass-card cursor-pointer transition-all flex flex-col justify-between space-y-2 card-lift ${
                  isSelected
                    ? 'border-[var(--accent-color)] ring-2 ring-[var(--accent-color)]/30'
                    : 'hover:border-[var(--accent-color)]/40'
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
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-8 font-mono text-xs">
          {/* Form Fields Section */}
          <div className="p-6 md:p-8 rounded-2xl glass-card space-y-4">
            <div className="border-b border-[var(--border-hairline)] pb-3 font-bold text-[var(--text-main)] uppercase flex items-center gap-2">
              <User className="w-4 h-4 text-[var(--accent-color)]" /> Personal & Contact Info
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
              <div>
                <label className="block text-[10px] font-bold text-[var(--text-muted)] uppercase mb-1">Full Name</label>
                <input
                  type="text"
                  value={fullName}
                  onChange={(e) => setFullName(e.target.value)}
                  className="w-full px-3.5 py-2.5 rounded-xl border border-[var(--border-hairline)] bg-[var(--bg-paper)] text-xs font-mono text-[var(--text-main)] input-glow focus:outline-none"
                />
              </div>

              <div>
                <label className="block text-[10px] font-bold text-[var(--text-muted)] uppercase mb-1">Email</label>
                <input
                  type="email"
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  className="w-full px-3.5 py-2.5 rounded-xl border border-[var(--border-hairline)] bg-[var(--bg-paper)] text-xs font-mono text-[var(--text-main)] input-glow focus:outline-none"
                />
              </div>

              <div>
                <label className="block text-[10px] font-bold text-[var(--text-muted)] uppercase mb-1">Phone</label>
                <input
                  type="text"
                  value={phone}
                  onChange={(e) => setPhone(e.target.value)}
                  className="w-full px-3.5 py-2.5 rounded-xl border border-[var(--border-hairline)] bg-[var(--bg-paper)] text-xs font-mono text-[var(--text-main)] input-glow focus:outline-none"
                />
              </div>

              <div>
                <label className="block text-[10px] font-bold text-[var(--text-muted)] uppercase mb-1">GitHub URL</label>
                <input
                  type="text"
                  value={githubUrl}
                  onChange={(e) => setGithubUrl(e.target.value)}
                  className="w-full px-3.5 py-2.5 rounded-xl border border-[var(--border-hairline)] bg-[var(--bg-paper)] text-xs font-mono text-[var(--text-main)] input-glow focus:outline-none"
                />
              </div>
            </div>

            <div>
              <label className="block text-[10px] font-bold text-[var(--text-muted)] uppercase mb-1">Professional Summary</label>
              <textarea
                rows={3}
                value={summary}
                onChange={(e) => setSummary(e.target.value)}
                className="w-full p-3.5 rounded-xl border border-[var(--border-hairline)] bg-[var(--bg-paper)] text-xs font-mono text-[var(--text-main)] input-glow focus:outline-none"
              />
            </div>

            <div>
              <label className="block text-[10px] font-bold text-[var(--text-muted)] uppercase mb-1">Skills Array (Comma Separated)</label>
              <textarea
                rows={2}
                value={skills}
                onChange={(e) => setSkills(e.target.value)}
                className="w-full p-3.5 rounded-xl border border-[var(--border-hairline)] bg-[var(--bg-paper)] text-xs font-mono text-[var(--text-main)] input-glow focus:outline-none"
              />
            </div>

            <div>
              <label className="block text-[10px] font-bold text-[var(--text-muted)] uppercase mb-1">Work Experience & Projects</label>
              <textarea
                rows={4}
                value={experience}
                onChange={(e) => setExperience(e.target.value)}
                className="w-full p-3.5 rounded-xl border border-[var(--border-hairline)] bg-[var(--bg-paper)] text-xs font-mono text-[var(--text-main)] input-glow focus:outline-none"
              />
            </div>
          </div>

          {/* Quick Rendered Draft Box */}
          <div className="p-6 md:p-8 rounded-2xl glass-card space-y-4 flex flex-col justify-between">
            <div className="space-y-4">
              <div className="border-b border-[var(--border-hairline)] pb-3 font-bold text-[var(--text-main)] uppercase flex items-center justify-between">
                <span className="flex items-center gap-2">
                  <Eye className="w-4 h-4 text-[var(--accent-color)]" /> Template Preview: {selectedTemplate}
                </span>
                <span className="text-[10px] text-[var(--accent-color)] font-mono">LaTeX Draft</span>
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
              className="w-full py-3 px-4 rounded-xl btn-accent font-mono font-bold text-xs flex items-center justify-center gap-2 cursor-pointer shadow-md"
            >
              $ render --template={selectedTemplate}
            </button>
          </div>
        </div>
      ) : (
        /* Rendered Document & Mock Code Screen */
        <div className="p-8 rounded-2xl glass-card space-y-6 font-mono text-xs">
          <div className="flex flex-col sm:flex-row sm:items-center justify-between border-b border-[var(--border-hairline)] pb-4 gap-3">
            <div>
              <span className="font-bold text-sm text-[var(--text-main)] block font-sans">
                Rendered LaTeX PDF Preview ({selectedTemplate})
              </span>
              <span className="text-[11px] text-[var(--text-muted)]">Template compiled successfully</span>
            </div>

            <div className="flex gap-2">
              <button className="px-4 py-2 rounded-xl bg-[var(--bg-paper)] text-[var(--text-main)] border border-[var(--border-hairline)] hover:bg-[var(--bg-elevated)] font-bold flex items-center gap-1.5 transition-colors cursor-pointer">
                <Code className="w-3.5 h-3.5" /> View Raw LaTeX
              </button>
              <button
                disabled
                title="PDF export coming soon"
                className="px-4 py-2 rounded-xl btn-accent font-bold flex items-center gap-1.5 opacity-50 cursor-not-allowed"
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
