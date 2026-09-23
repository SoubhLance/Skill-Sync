import React, { useMemo, useRef, useState, useCallback } from 'react';
import { Download, Code, Check, FileText, Upload, Copy, ExternalLink, Plus, Trash2, Sparkles, X, ChevronDown, User, GraduationCap, Briefcase, FolderKanban, Wrench, Trophy, Award, AlignLeft, Loader2 } from 'lucide-react';
import type { ResumeData, ResumeTemplateId } from '../lib/resumeTypes';
import { sampleResume, emptyResume } from '../lib/resumeTypes';
import { RESUME_TEMPLATES, generateLatex } from '../lib/resumeTemplates';
import { api } from '../lib/api';
import { useAuth } from '../context/AuthContext';
import { useUserProfile, useDsaProfile } from '../lib/userProfile';
import { ClassicJakePreview, TwoColPhotoPreview, AcademicPreview, MinimalAtsPreview } from '../components/resume/TemplatePreviews';

const inputCls = 'w-full px-3.5 py-2.5 input-glow text-sm';
const labelCls = 'field-label mb-1 text-[13px]';

function stripPhoto(data: ResumeData): any {
  const { basics, ...rest } = data;
  const { photoDataUrl: _omit, ...basicsRest } = basics;
  void _omit;
  return { ...rest, basics: basicsRest };
}

export const ResumeBuilderPage: React.FC = () => {
  const { user } = useAuth();
  const { addSkills } = useUserProfile(user?.uid);
  const { saveDsa } = useDsaProfile(user?.uid);
  const [templateId, setTemplateId] = useState<ResumeTemplateId>('classic-jake');
  const [data, setData] = useState<ResumeData>(() => sampleResume());
  const [showLatex, setShowLatex] = useState(false);
  const [serverLatex, setServerLatex] = useState<string | null>(null);
  const [busy, setBusy] = useState<'pdf' | 'docx' | 'latex' | 'import' | 'profile' | null>(null);
  const [notice, setNotice] = useState<string | null>(null);
  const [copied, setCopied] = useState(false);
  const [profileScore, setProfileScore] = useState<number | null>(null);
  const [ghUser, setGhUser] = useState('');
  const [lcUser, setLcUser] = useState('');
  const fileRef = useRef<HTMLInputElement>(null);
  const photoRef = useRef<HTMLInputElement>(null);
  const [openSections, setOpenSections] = useState<Set<string>>(() => new Set(['personal']));

  const toggleSection = useCallback((id: string) => {
    setOpenSections((prev) => {
      const next = new Set(prev);
      if (next.has(id)) next.delete(id); else next.add(id);
      return next;
    });
  }, []);

  const localLatex = useMemo(() => generateLatex(templateId, data), [templateId, data]);
  const latexText = serverLatex ?? localLatex;

  const set = <K extends keyof ResumeData>(k: K, v: ResumeData[K]) => setData((d) => ({ ...d, [k]: v }));
  const setBasic = (k: keyof ResumeData['basics'], v: string) =>
    setData((d) => ({ ...d, basics: { ...d.basics, [k]: v } }));

  const sanitizeFilename = (name: string) =>
    name.replace(/[^\w\-.]+/g, '_').replace(/_+/g, '_').slice(0, 100) || 'resume';

  const downloadBlob = (blob: Blob, filename: string, mime?: string) => {
    // Re-wrap to enforce correct MIME so the OS recognizes PDF/DOCX.
    const file = mime && blob.type !== mime ? new Blob([blob], { type: mime }) : blob;
    const url = URL.createObjectURL(file);
    const a = document.createElement('a');
    a.style.display = 'none';
    a.href = url;
    a.download = filename;
    a.rel = 'noopener';
    // Must be in the DOM for Chrome/Edge to honor `download`.
    // Otherwise the browser falls back to the blob UUID as filename
    // (e.g. dca62766-6798-... with no extension).
    document.body.appendChild(a);
    a.click();
    a.remove();
    // Revoke late so Edge/Chrome can finish streaming the file.
    setTimeout(() => URL.revokeObjectURL(url), 10000);
  };

  const handlePdf = async () => {
    setBusy('pdf'); setNotice(null);
    try {
      const blob = await api.resumePdfBlob(templateId, stripPhoto(data));
      if (!blob || blob.size === 0) throw new Error('PDF export returned an empty file.');
      const name = sanitizeFilename((data.basics.fullName || 'resume').replace(/\s+/g, '_'));
      downloadBlob(blob, `${name}_${templateId}.pdf`, 'application/pdf');
      setNotice('PDF downloaded.');
    } catch (e: any) {
      setNotice(e?.message || 'PDF export failed. Is the backend running?');
    } finally { setBusy(null); }
  };

  const handleDocx = async () => {
    setBusy('docx'); setNotice(null);
    try {
      const blob = await api.resumeDocxBlob(templateId, stripPhoto(data));
      if (!blob || blob.size === 0) throw new Error('Word export returned an empty file.');
      const name = sanitizeFilename((data.basics.fullName || 'resume').replace(/\s+/g, '_'));
      downloadBlob(blob, `${name}_${templateId}.docx`, 'application/vnd.openxmlformats-officedocument.wordprocessingml.document');
      setNotice('Word file downloaded.');
    } catch (e: any) {
      setNotice(e?.message || 'Word export failed. pip install python-docx on backend?');
    } finally { setBusy(null); }
  };

  const openLatex = async () => {
    setShowLatex(true); setServerLatex(null); setBusy('latex');
    try {
      const res = await api.resumeLatex(templateId, stripPhoto(data));
      setServerLatex(res.latex);
    } catch {
      setServerLatex(null); // fallback to local generator
    } finally { setBusy(null); }
  };

  const copyLatex = async () => {
    try { await navigator.clipboard.writeText(latexText); setCopied(true); setTimeout(() => setCopied(false), 1500); }
    catch { setNotice('Copy failed — select the text manually.'); }
  };

  const openOverleaf = () => {
    window.open(`https://www.overleaf.com/docs?snip=${encodeURIComponent(latexText)}`, '_blank');
  };

  const handleImportPdf = async (f: File) => {
    setBusy('import'); setNotice(null);
    try {
      const res = await api.extractSkillsPdf(f);
      setData((d) => {
        const next = { ...d, basics: { ...d.basics } };
        // Name
        if (res.name) next.basics.fullName = res.name;
        // Contact
        if (res.emails?.[0]) next.basics.email = res.emails[0];
        if (res.phone_numbers?.[0]) next.basics.phone = res.phone_numbers[0];
        if (res.github_url) next.basics.github = res.github_url;
        if (res.linkedin_url) next.basics.linkedin = res.linkedin_url;
        // Skills
        if (res.all_skills?.length) {
          next.skills = { ...next.skills, languages: res.all_skills.join(', ') };
        }
        // Achievements
        if (res.achievements?.length) next.achievements = res.achievements;
        // Education
        if (res.education?.length) {
          next.education = res.education.map((e: any) => ({
            school: e.school || '',
            degree: e.degree || '',
            year: e.year || '',
            score: e.score || '',
          }));
        }
        // Experience
        if (res.experience?.length) {
          next.experience = res.experience.map((x: any) => ({
            role: x.role || '',
            company: x.company || '',
            dates: x.dates || '',
            bullets: Array.isArray(x.bullets) && x.bullets.length ? x.bullets : [''],
          }));
        }
        // Projects
        if (res.projects?.length) {
          next.projects = res.projects.slice(0, 6).map((p: any) => ({
            name: p.name || p.title || 'Project',
            link: p.repo_or_demo_link || p.url || p.link || '',
            tech: Array.isArray(p.tech_stack) ? p.tech_stack.join(', ') : '',
            bullets: p.description ? [p.description] : [''],
          }));
        }
        return next;
      });
      // Expand sections that were imported
      setOpenSections((prev) => {
        const nextSet = new Set(prev);
        nextSet.add('personal');
        if (res.education?.length) nextSet.add('education');
        if (res.experience?.length) nextSet.add('experience');
        if (res.projects?.length) nextSet.add('projects');
        if (res.all_skills?.length) nextSet.add('skills');
        return nextSet;
      });
      if (res.github_url) {
        const m = res.github_url.match(/github\.com\/([a-zA-Z0-9_-]+)/);
        if (m) setGhUser(m[1]);
      }
      // Feed dashboard: resume skills -> shared per-user store.
      if (res.all_skills?.length) addSkills(res.all_skills);
      // Build notice with confidence info
      const parts: string[] = [];
      if (res.name) parts.push(`name`);
      if (res.education?.length) parts.push(`${res.education.length} education`);
      if (res.experience?.length) parts.push(`${res.experience.length} experience`);
      if (res.all_skills?.length) parts.push(`${res.all_skills.length} skills`);
      if (res.projects?.length) parts.push(`${res.projects.length} projects`);
      let msg = `Imported ${parts.join(', ')} from PDF — review & edit.`;
      if (res.is_low_confidence) msg += ' ⚠️ Low OCR confidence — double-check all fields.';
      if (res.warnings?.length) msg += ` (${res.warnings.length} warning${res.warnings.length > 1 ? 's' : ''})`;
      if (res.all_skills?.length) msg += ' Skills added to dashboard.';
      setNotice(msg);
    } catch (e: any) {
      setNotice(e?.response?.data?.detail || e?.message || 'Import failed. Try a text-based PDF.');
    } finally { setBusy(null); }
  };

  const fetchProfile = async () => {
    if (!ghUser && !lcUser) { setNotice('Enter a GitHub or LeetCode username first.'); return; }
    setBusy('profile'); setNotice(null);
    try {
      const res = await api.extractProfile({ github: ghUser || undefined, leetcode: lcUser || undefined });
      setProfileScore(res.profile_score);
      saveDsa(res, {
        github: ghUser.trim() || undefined,
        leetcode: lcUser.trim() || undefined,
      });
      setNotice(`Profile score ${Math.round(res.profile_score * 100)}% — ${res.active_platforms.join(', ') || 'no platforms'}. Saved to dashboard.`);
    } catch (e: any) {
      setNotice(e?.response?.data?.detail || 'Profile fetch failed.');
    } finally { setBusy(null); }
  };

  const handlePhoto = (f: File | undefined) => {
    if (!f) return;
    if (f.size > 2 * 1024 * 1024) { setNotice('Photo must be under 2MB.'); return; }
    const r = new FileReader();
    r.onload = () => setData((d) => ({ ...d, basics: { ...d.basics, photoDataUrl: String(r.result) } }));
    r.readAsDataURL(f);
  };

  return (
    <div className="p-6 md:p-10 max-w-7xl mx-auto space-y-8 text-[var(--text-main)] animate-fade-in">
      <div className="flex flex-col md:flex-row md:items-end justify-between gap-4">
        <div>
          <h1 className="h-section text-2xl md:text-3xl">Resume builder</h1>
          <p className="caption mt-1">Pick a template, fill in your details, preview the compiled result side-by-side.</p>
        </div>
        <div className="flex flex-wrap gap-2">
          <button onClick={() => setData(sampleResume())} className="btn-secondary px-4 py-2 text-[13px]">
            <Sparkles className="w-3.5 h-3.5" /> Sample
          </button>
          <button onClick={() => setData(emptyResume())} className="btn-secondary px-4 py-2 text-[13px]">Clear</button>
          <button onClick={openLatex} className="btn-secondary px-4 py-2 text-[13px]">
            <Code className="w-3.5 h-3.5" /> View Raw LaTeX
          </button>
          <button onClick={handlePdf} disabled={busy === 'pdf'} className="btn-primary px-4 py-2 text-[13px] disabled:opacity-50">
            {busy === 'pdf' ? <Loader2 className="w-3.5 h-3.5 animate-spin" /> : <Download className="w-3.5 h-3.5" />}
            {busy === 'pdf' ? 'Building…' : 'Download PDF'}
          </button>
          <button onClick={handleDocx} disabled={busy === 'docx'} className="btn-secondary px-4 py-2 text-[13px] disabled:opacity-50">
            {busy === 'docx' ? <Loader2 className="w-3.5 h-3.5 animate-spin" /> : <FileText className="w-3.5 h-3.5" />}
            {busy === 'docx' ? 'Building…' : 'Word'}
          </button>
        </div>
      </div>

      {notice && <div className="card p-3.5 text-[13px] flex items-center justify-between gap-3"><span>{notice}</span><button onClick={() => setNotice(null)} className="btn-tertiary"><X className="w-4 h-4" /></button></div>}

      <div className="space-y-3">
        <p className="font-semibold text-[14px] tracking-tight">Choose a template {profileScore !== null && <span className="chip chip-accent ml-2">profile {Math.round(profileScore * 100)}%</span>}</p>
        <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-4 gap-3 stagger-children">
          {RESUME_TEMPLATES.map((t) => {
            const active = templateId === t.id;
            return (
              <div key={t.id} onClick={() => setTemplateId(t.id)}
                className={`card card-lift p-4 cursor-pointer ${active ? '!border-[var(--accent-color)] ring-2 ring-[var(--accent-color)]/25' : ''}`}>
                <div className="flex items-center justify-between">
                  <span className="text-[10px] font-bold text-[var(--text-muted)] uppercase">{t.category}</span>
                  {active && <Check className="w-3.5 h-3.5 text-[var(--accent-color)]" />}
                </div>
                <h4 className="font-extrabold text-xs mt-1">{t.name} {t.hasPhoto && <span className="caption">· photo</span>}</h4>
                <p className="text-[11px] text-[var(--text-muted)] line-clamp-2 mt-0.5">{t.description}</p>
              </div>
            );
          })}
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6 items-start">
        {/* LEFT: form — collapsible accordion sections */}
        <div className="space-y-2">
          {/* Import — always open, not an accordion */}
          <div className="card p-5 space-y-3">
            <div className="font-semibold text-[14px] flex items-center gap-2"><Upload className="w-4 h-4 text-[var(--accent-color)]" /> Import existing</div>
            <p className="caption">Autofill from an uploaded PDF (name, education, experience, skills, projects) + pull your coding profile score.</p>
            <input ref={fileRef} type="file" accept=".pdf,.jpg,.jpeg,.png,.webp" className="hidden"
              onChange={(e) => { const f = e.target.files?.[0]; if (f) handleImportPdf(f); e.target.value = ''; }} />
            <div className="flex flex-wrap gap-2">
              <button onClick={() => fileRef.current?.click()} disabled={busy === 'import'} className="btn-secondary px-4 py-2 text-[13px] disabled:opacity-50">
                {busy === 'import' ? <Loader2 className="w-3.5 h-3.5 animate-spin" /> : <Upload className="w-3.5 h-3.5" />}
                {busy === 'import' ? 'Parsing…' : 'Upload PDF & autofill'}
              </button>
            </div>
            <div className="grid grid-cols-2 gap-2">
              <input value={ghUser} onChange={(e) => setGhUser(e.target.value)} placeholder="GitHub username" className={inputCls} />
              <input value={lcUser} onChange={(e) => setLcUser(e.target.value)} placeholder="LeetCode username" className={inputCls} />
            </div>
            <button onClick={fetchProfile} disabled={busy === 'profile'} className="btn-secondary px-4 py-2 text-[13px] disabled:opacity-50">
              {busy === 'profile' ? <Loader2 className="w-3.5 h-3.5 animate-spin" /> : null}
              {busy === 'profile' ? 'Fetching…' : 'Fetch profile score'}
            </button>
          </div>

          {/* Personal & contact */}
          <div className="card accordion-section">
            <button className="accordion-header" onClick={() => toggleSection('personal')}>
              <User className="w-4 h-4 text-[var(--accent-color)]" />
              Personal & contact
              <ChevronDown className={`w-4 h-4 accordion-chevron ${openSections.has('personal') ? 'open' : ''}`} />
            </button>
            <div className={`accordion-body-wrapper ${openSections.has('personal') ? 'open' : ''}`}>
              <div className="accordion-body"><div className="accordion-inner space-y-3">
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-2.5">
                  <div><label className={labelCls}>Full name</label><input value={data.basics.fullName} onChange={(e) => setBasic('fullName', e.target.value)} className={inputCls} /></div>
                  <div><label className={labelCls}>Email</label><input value={data.basics.email} onChange={(e) => setBasic('email', e.target.value)} className={inputCls} /></div>
                  <div><label className={labelCls}>Phone</label><input value={data.basics.phone} onChange={(e) => setBasic('phone', e.target.value)} className={inputCls} /></div>
                  <div><label className={labelCls}>Location</label><input value={data.basics.location} onChange={(e) => setBasic('location', e.target.value)} placeholder="City, Country" className={inputCls} /></div>
                  <div><label className={labelCls}>LinkedIn</label><input value={data.basics.linkedin} onChange={(e) => setBasic('linkedin', e.target.value)} className={inputCls} /></div>
                  <div><label className={labelCls}>GitHub</label><input value={data.basics.github} onChange={(e) => setBasic('github', e.target.value)} className={inputCls} /></div>
                  <div className="sm:col-span-2"><label className={labelCls}>Portfolio</label><input value={data.basics.portfolio} onChange={(e) => setBasic('portfolio', e.target.value)} className={inputCls} /></div>
                </div>
                {templateId === 'two-col-photo' && (
                  <div>
                    <label className={labelCls}>Photo (this template only, ≤2MB)</label>
                    <input ref={photoRef} type="file" accept="image/*" className="hidden" onChange={(e) => { handlePhoto(e.target.files?.[0]); e.target.value = ''; }} />
                    <div className="flex items-center gap-3">
                      <button onClick={() => photoRef.current?.click()} className="btn-secondary px-4 py-2 text-[13px]">Upload photo</button>
                      {data.basics.photoDataUrl && <button onClick={() => setData((d) => ({ ...d, basics: { ...d.basics, photoDataUrl: undefined } }))} className="btn-tertiary">Remove</button>}
                    </div>
                  </div>
                )}
              </div></div>
            </div>
          </div>

          {/* Summary */}
          <div className="card accordion-section">
            <button className="accordion-header" onClick={() => toggleSection('summary')}>
              <AlignLeft className="w-4 h-4 text-[var(--accent-color)]" />
              Summary
              {data.summary.trim() && <span className="accordion-count">✓</span>}
              <ChevronDown className={`w-4 h-4 accordion-chevron ${openSections.has('summary') ? 'open' : ''}`} />
            </button>
            <div className={`accordion-body-wrapper ${openSections.has('summary') ? 'open' : ''}`}>
              <div className="accordion-body"><div className="accordion-inner">
                <textarea rows={3} value={data.summary} onChange={(e) => set('summary', e.target.value)} className="w-full p-3.5 input-glow text-sm" />
              </div></div>
            </div>
          </div>

          {/* Education */}
          <div className="card accordion-section">
            <button className="accordion-header" onClick={() => toggleSection('education')}>
              <GraduationCap className="w-4 h-4 text-[var(--accent-color)]" />
              Education
              {data.education.length > 0 && <span className="accordion-count">{data.education.length}</span>}
              <ChevronDown className={`w-4 h-4 accordion-chevron ${openSections.has('education') ? 'open' : ''}`} />
            </button>
            <div className={`accordion-body-wrapper ${openSections.has('education') ? 'open' : ''}`}>
              <div className="accordion-body"><div className="accordion-inner space-y-3">
                {data.education.map((e, i) => (
                  <div key={i} className="grid grid-cols-2 gap-2 border border-[var(--border-hairline)] rounded-xl p-3">
                    <input value={e.school} onChange={(ev) => { const a = [...data.education]; a[i] = { ...a[i], school: ev.target.value }; set('education', a); }} placeholder="School" className={inputCls} />
                    <input value={e.degree} onChange={(ev) => { const a = [...data.education]; a[i] = { ...a[i], degree: ev.target.value }; set('education', a); }} placeholder="Degree" className={inputCls} />
                    <input value={e.year} onChange={(ev) => { const a = [...data.education]; a[i] = { ...a[i], year: ev.target.value }; set('education', a); }} placeholder="Year" className={inputCls} />
                    <input value={e.score} onChange={(ev) => { const a = [...data.education]; a[i] = { ...a[i], score: ev.target.value }; set('education', a); }} placeholder="CGPA / %" className={inputCls} />
                    <button onClick={() => set('education', data.education.filter((_, j) => j !== i))} className="btn-tertiary col-span-2 justify-self-end"><Trash2 className="w-3.5 h-3.5" /> Remove</button>
                  </div>
                ))}
                <button onClick={() => { set('education', [...data.education, { school: '', degree: '', year: '', score: '' }]); if (!openSections.has('education')) toggleSection('education'); }} className="btn-tertiary"><Plus className="w-4 h-4" /> Add education</button>
              </div></div>
            </div>
          </div>

          {/* Experience */}
          <div className="card accordion-section">
            <button className="accordion-header" onClick={() => toggleSection('experience')}>
              <Briefcase className="w-4 h-4 text-[var(--accent-color)]" />
              Experience <span className="caption font-normal">(optional)</span>
              {data.experience.length > 0 && <span className="accordion-count">{data.experience.length}</span>}
              <ChevronDown className={`w-4 h-4 accordion-chevron ${openSections.has('experience') ? 'open' : ''}`} />
            </button>
            <div className={`accordion-body-wrapper ${openSections.has('experience') ? 'open' : ''}`}>
              <div className="accordion-body"><div className="accordion-inner space-y-3">
                {data.experience.length === 0 && <p className="caption">No experience added — template hides this section automatically.</p>}
                {data.experience.map((x, i) => (
                  <div key={i} className="border border-[var(--border-hairline)] rounded-xl p-3 space-y-2">
                    <div className="grid grid-cols-2 gap-2">
                      <input value={x.role} onChange={(ev) => { const a = [...data.experience]; a[i] = { ...a[i], role: ev.target.value }; set('experience', a); }} placeholder="Role" className={inputCls} />
                      <input value={x.company} onChange={(ev) => { const a = [...data.experience]; a[i] = { ...a[i], company: ev.target.value }; set('experience', a); }} placeholder="Company" className={inputCls} />
                      <input value={x.dates} onChange={(ev) => { const a = [...data.experience]; a[i] = { ...a[i], dates: ev.target.value }; set('experience', a); }} placeholder="2023 – Present" className={`${inputCls} col-span-2`} />
                    </div>
                    {x.bullets.map((bl, j) => (
                      <div key={j} className="flex gap-2">
                        <input value={bl} onChange={(ev) => { const a = [...data.experience]; const bls = [...a[i].bullets]; bls[j] = ev.target.value; a[i] = { ...a[i], bullets: bls }; set('experience', a); }} placeholder={`Bullet ${j + 1}`} className={inputCls} />
                        <button onClick={() => { const a = [...data.experience]; a[i] = { ...a[i], bullets: a[i].bullets.filter((_, k) => k !== j) }; set('experience', a); }} className="btn-tertiary"><Trash2 className="w-3.5 h-3.5" /></button>
                      </div>
                    ))}
                    <div className="flex justify-between">
                      <button onClick={() => { const a = [...data.experience]; a[i] = { ...a[i], bullets: [...a[i].bullets, ''] }; set('experience', a); }} className="btn-tertiary"><Plus className="w-3.5 h-3.5" /> Bullet</button>
                      <button onClick={() => set('experience', data.experience.filter((_, k) => k !== i))} className="btn-tertiary"><Trash2 className="w-3.5 h-3.5" /> Remove role</button>
                    </div>
                  </div>
                ))}
                <button onClick={() => { set('experience', [...data.experience, { role: '', company: '', dates: '', bullets: [''] }]); if (!openSections.has('experience')) toggleSection('experience'); }} className="btn-tertiary"><Plus className="w-4 h-4" /> Add experience</button>
              </div></div>
            </div>
          </div>

          {/* Projects */}
          <div className="card accordion-section">
            <button className="accordion-header" onClick={() => toggleSection('projects')}>
              <FolderKanban className="w-4 h-4 text-[var(--accent-color)]" />
              Projects
              {data.projects.length > 0 && <span className="accordion-count">{data.projects.length}</span>}
              <ChevronDown className={`w-4 h-4 accordion-chevron ${openSections.has('projects') ? 'open' : ''}`} />
            </button>
            <div className={`accordion-body-wrapper ${openSections.has('projects') ? 'open' : ''}`}>
              <div className="accordion-body"><div className="accordion-inner space-y-3">
                {data.projects.map((p, i) => (
                  <div key={i} className="border border-[var(--border-hairline)] rounded-xl p-3 space-y-2">
                    <div className="grid grid-cols-2 gap-2">
                      <input value={p.name} onChange={(ev) => { const a = [...data.projects]; a[i] = { ...a[i], name: ev.target.value }; set('projects', a); }} placeholder="Project name" className={inputCls} />
                      <input value={p.tech} onChange={(ev) => { const a = [...data.projects]; a[i] = { ...a[i], tech: ev.target.value }; set('projects', a); }} placeholder="Tech stack" className={inputCls} />
                      <input value={p.link} onChange={(ev) => { const a = [...data.projects]; a[i] = { ...a[i], link: ev.target.value }; set('projects', a); }} placeholder="Link" className={`${inputCls} col-span-2`} />
                    </div>
                    {p.bullets.map((bl, j) => (
                      <div key={j} className="flex gap-2">
                        <input value={bl} onChange={(ev) => { const a = [...data.projects]; const bls = [...a[i].bullets]; bls[j] = ev.target.value; a[i] = { ...a[i], bullets: bls }; set('projects', a); }} placeholder={`Bullet ${j + 1}`} className={inputCls} />
                        <button onClick={() => { const a = [...data.projects]; a[i] = { ...a[i], bullets: a[i].bullets.filter((_, k) => k !== j) }; set('projects', a); }} className="btn-tertiary"><Trash2 className="w-3.5 h-3.5" /></button>
                      </div>
                    ))}
                    <div className="flex justify-between">
                      <button onClick={() => { const a = [...data.projects]; a[i] = { ...a[i], bullets: [...a[i].bullets, ''] }; set('projects', a); }} className="btn-tertiary"><Plus className="w-3.5 h-3.5" /> Bullet</button>
                      <button onClick={() => set('projects', data.projects.filter((_, k) => k !== i))} className="btn-tertiary"><Trash2 className="w-3.5 h-3.5" /> Remove</button>
                    </div>
                  </div>
                ))}
                <button onClick={() => { set('projects', [...data.projects, { name: '', link: '', tech: '', bullets: [''] }]); if (!openSections.has('projects')) toggleSection('projects'); }} className="btn-tertiary"><Plus className="w-4 h-4" /> Add project</button>
              </div></div>
            </div>
          </div>

          {/* Skills */}
          <div className="card accordion-section">
            <button className="accordion-header" onClick={() => toggleSection('skills')}>
              <Wrench className="w-4 h-4 text-[var(--accent-color)]" />
              Skills
              {[data.skills.languages, data.skills.frameworks, data.skills.tools, data.skills.other].some(Boolean) && <span className="accordion-count">✓</span>}
              <ChevronDown className={`w-4 h-4 accordion-chevron ${openSections.has('skills') ? 'open' : ''}`} />
            </button>
            <div className={`accordion-body-wrapper ${openSections.has('skills') ? 'open' : ''}`}>
              <div className="accordion-body"><div className="accordion-inner space-y-2">
                {(['languages', 'frameworks', 'tools', 'other'] as const).map((k) => (
                  <div key={k}><label className={labelCls}>{k[0].toUpperCase() + k.slice(1)}</label>
                    <input value={data.skills[k]} onChange={(e) => setData((d) => ({ ...d, skills: { ...d.skills, [k]: e.target.value } }))} placeholder="Comma separated" className={inputCls} /></div>
                ))}
              </div></div>
            </div>
          </div>

          {/* Achievements */}
          <div className="card accordion-section">
            <button className="accordion-header" onClick={() => toggleSection('achievements')}>
              <Trophy className="w-4 h-4 text-[var(--accent-color)]" />
              Achievements
              {data.achievements.filter(Boolean).length > 0 && <span className="accordion-count">{data.achievements.filter(Boolean).length}</span>}
              <ChevronDown className={`w-4 h-4 accordion-chevron ${openSections.has('achievements') ? 'open' : ''}`} />
            </button>
            <div className={`accordion-body-wrapper ${openSections.has('achievements') ? 'open' : ''}`}>
              <div className="accordion-body"><div className="accordion-inner space-y-2">
                {data.achievements.map((a, i) => (
                  <div key={i} className="flex gap-2"><input value={a} onChange={(e) => { const arr = [...data.achievements]; arr[i] = e.target.value; set('achievements', arr); }} className={inputCls} />
                    <button onClick={() => set('achievements', data.achievements.filter((_, j) => j !== i))} className="btn-tertiary"><Trash2 className="w-3.5 h-3.5" /></button></div>
                ))}
                <button onClick={() => { set('achievements', [...data.achievements, '']); if (!openSections.has('achievements')) toggleSection('achievements'); }} className="btn-tertiary"><Plus className="w-4 h-4" /> Add achievement</button>
              </div></div>
            </div>
          </div>

          {/* Certifications */}
          <div className="card accordion-section">
            <button className="accordion-header" onClick={() => toggleSection('certifications')}>
              <Award className="w-4 h-4 text-[var(--accent-color)]" />
              Certifications
              {data.certifications.filter(Boolean).length > 0 && <span className="accordion-count">{data.certifications.filter(Boolean).length}</span>}
              <ChevronDown className={`w-4 h-4 accordion-chevron ${openSections.has('certifications') ? 'open' : ''}`} />
            </button>
            <div className={`accordion-body-wrapper ${openSections.has('certifications') ? 'open' : ''}`}>
              <div className="accordion-body"><div className="accordion-inner space-y-2">
                {data.certifications.map((c, i) => (
                  <div key={i} className="flex gap-2"><input value={c} onChange={(e) => { const arr = [...data.certifications]; arr[i] = e.target.value; set('certifications', arr); }} className={inputCls} />
                    <button onClick={() => set('certifications', data.certifications.filter((_, j) => j !== i))} className="btn-tertiary"><Trash2 className="w-3.5 h-3.5" /></button></div>
                ))}
                <button onClick={() => { set('certifications', [...data.certifications, '']); if (!openSections.has('certifications')) toggleSection('certifications'); }} className="btn-tertiary"><Plus className="w-4 h-4" /> Add certification</button>
              </div></div>
            </div>
          </div>
        </div>

        {/* RIGHT: live compiled view */}
        <div className="lg:sticky lg:top-6 space-y-3">
          <div className="card p-4 flex items-center justify-between">
            <div><p className="font-bold text-sm">Compiled view — {templateId}</p><p className="caption">Updates live as you type</p></div>
            <span className="chip chip-success">Live</span>
          </div>
          {templateId === 'classic-jake' && <ClassicJakePreview d={data} />}
          {templateId === 'two-col-photo' && <TwoColPhotoPreview d={data} />}
          {templateId === 'academic-cv' && <AcademicPreview d={data} />}
          {templateId === 'minimal-ats' && <MinimalAtsPreview d={data} />}
        </div>
      </div>

      {showLatex && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4" style={{ background: 'rgba(0,0,0,0.5)' }} onClick={() => setShowLatex(false)}>
          <div className="card p-5 max-w-3xl w-full max-h-[85vh] flex flex-col gap-3" style={{ background: 'var(--bg-surface)' }} onClick={(e) => e.stopPropagation()}>
            <div className="flex items-center justify-between">
              <p className="font-bold text-sm">LaTeX source — {templateId}</p>
              <button onClick={() => setShowLatex(false)} className="btn-tertiary"><X className="w-4 h-4" /></button>
            </div>
            <p className="caption">{busy === 'latex' ? 'Fetching server copy…' : 'Compiled by us — copy it or open directly in Overleaf.'}</p>
            <pre className="text-[11px] font-mono p-4 rounded-xl border overflow-auto whitespace-pre-wrap max-h-[50vh]" style={{ background: 'var(--bg-paper)' }}>{latexText}</pre>
            <div className="flex flex-wrap gap-2">
              <button onClick={copyLatex} className="btn-primary px-4 py-2 text-[13px]"><Copy className="w-3.5 h-3.5" /> {copied ? 'Copied!' : 'Copy LaTeX'}</button>
              <button onClick={openOverleaf} className="btn-secondary px-4 py-2 text-[13px]"><ExternalLink className="w-3.5 h-3.5" /> Open in Overleaf</button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};
