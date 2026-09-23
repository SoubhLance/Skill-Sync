import React from 'react';
import type { ResumeData } from '../../lib/resumeTypes';

const SectionTitle: React.FC<{ children: React.ReactNode }> = ({ children }) => (
  <h3 className="font-extrabold text-[11px] uppercase tracking-wider border-b pb-1 mb-1.5"
    style={{ color: '#1B7A4B', borderColor: '#1B7A4B' }}>{children}</h3>
);

const Contact: React.FC<{ d: ResumeData; center?: boolean }> = ({ d, center }) => (
  <p className={`text-[11px] text-gray-500 ${center ? 'text-center' : ''}`}>
    {[d.basics.email, d.basics.phone, d.basics.location].filter(Boolean).join(' | ')}
    {[d.basics.linkedin, d.basics.github, d.basics.portfolio].filter(Boolean).length > 0 && (
      <><br />{[d.basics.linkedin, d.basics.github, d.basics.portfolio].filter(Boolean).join(' | ')}</>
    )}
  </p>
);

export const ClassicJakePreview: React.FC<{ d: ResumeData }> = ({ d }) => (
  <div className="bg-white text-gray-900 rounded-xl border p-7 space-y-3 font-serif max-w-3xl mx-auto shadow">
    <div className="text-center border-b-2 border-gray-800 pb-2">
      <h2 className="font-extrabold text-xl uppercase tracking-wide">{d.basics.fullName || 'Your Name'}</h2>
      <Contact d={d} center />
    </div>
    {d.summary && <div><SectionTitle>Summary</SectionTitle><p className="text-xs leading-relaxed">{d.summary}</p></div>}
    {d.education.some((e) => e.school || e.degree) && (
      <div><SectionTitle>Education</SectionTitle>
        {d.education.map((e, i) => (
          <p key={i} className="text-xs"><b>{e.school}</b> — {e.degree} <span className="float-right italic">{e.year}</span><br /><span className="text-gray-500">{e.score}</span></p>
        ))}
      </div>
    )}
    {d.experience.some((x) => x.role || x.company) && (
      <div><SectionTitle>Experience</SectionTitle>
        {d.experience.map((x, i) => (
          <div key={i} className="mb-1.5"><p className="text-xs"><b>{x.role}</b> @ {x.company} <span className="float-right italic">{x.dates}</span></p>
            <ul className="list-disc ml-4 text-xs">{x.bullets.filter(Boolean).map((bl, j) => <li key={j}>{bl}</li>)}</ul></div>
        ))}
      </div>
    )}
    {d.projects.some((p) => p.name) && (
      <div><SectionTitle>Projects</SectionTitle>
        {d.projects.map((p, i) => (
          <div key={i} className="mb-1.5"><p className="text-xs"><b>{p.name}</b> <span className="text-gray-500">{p.tech}</span></p>
            <ul className="list-disc ml-4 text-xs">{p.bullets.filter(Boolean).map((bl, j) => <li key={j}>{bl}</li>)}</ul></div>
        ))}
      </div>
    )}
    <div><SectionTitle>Skills</SectionTitle>
      <p className="text-xs">{[d.skills.languages, d.skills.frameworks, d.skills.tools, d.skills.other].filter(Boolean).join(' • ')}</p></div>
    {d.achievements.some(Boolean) && <div><SectionTitle>Achievements</SectionTitle><ul className="list-disc ml-4 text-xs">{d.achievements.filter(Boolean).map((a, i) => <li key={i}>{a}</li>)}</ul></div>}
    {d.certifications.some(Boolean) && <div><SectionTitle>Certifications</SectionTitle><p className="text-xs">{d.certifications.filter(Boolean).join(', ')}</p></div>}
  </div>
);

export const TwoColPhotoPreview: React.FC<{ d: ResumeData }> = ({ d }) => (
  <div className="bg-white text-gray-900 rounded-xl border shadow max-w-3xl mx-auto grid grid-cols-[220px_1fr] overflow-hidden">
    <div className="p-5 space-y-3 text-white" style={{ background: '#14532D' }}>
      {d.basics.photoDataUrl
        ? <img src={d.basics.photoDataUrl} alt="photo" className="w-24 h-24 rounded-full object-cover mx-auto border-2 border-white/40" />
        : <div className="w-24 h-24 rounded-full mx-auto border-2 border-dashed border-white/50 flex items-center justify-center text-[10px] text-white/70">PHOTO</div>}
      <div className="text-center"><p className="font-bold text-sm">{d.basics.fullName || 'Your Name'}</p></div>
      <div><p className="text-[10px] font-bold uppercase tracking-wider text-white/70 border-b border-white/20 pb-1">Contact</p>
        <p className="text-[11px] mt-1 break-words">{[d.basics.email, d.basics.phone, d.basics.location].filter(Boolean).join('\n')}</p></div>
      <div><p className="text-[10px] font-bold uppercase tracking-wider text-white/70 border-b border-white/20 pb-1">Skills</p>
        <p className="text-[11px] mt-1">{[d.skills.languages, d.skills.frameworks, d.skills.tools, d.skills.other].filter(Boolean).join(' • ')}</p></div>
      <div><p className="text-[10px] font-bold uppercase tracking-wider text-white/70 border-b border-white/20 pb-1">Links</p>
        <p className="text-[11px] mt-1 break-all">{[d.basics.linkedin, d.basics.github, d.basics.portfolio].filter(Boolean).join('\n')}</p></div>
    </div>
    <div className="p-6 space-y-3">
      {d.summary && <div><SectionTitle>Profile</SectionTitle><p className="text-xs">{d.summary}</p></div>}
      {d.experience.some((x) => x.role || x.company) && (
        <div><SectionTitle>Experience</SectionTitle>
          {d.experience.map((x, i) => (
            <div key={i} className="mb-1.5"><p className="text-xs"><b>{x.role}</b> — {x.company} <span className="text-gray-500">({x.dates})</span></p>
              <ul className="list-disc ml-4 text-xs">{x.bullets.filter(Boolean).map((bl, j) => <li key={j}>{bl}</li>)}</ul></div>
          ))}
        </div>
      )}
      {d.education.some((e) => e.school || e.degree) && (
        <div><SectionTitle>Education</SectionTitle>
          {d.education.map((e, i) => <p key={i} className="text-xs"><b>{e.school}</b>, {e.degree} ({e.year}) {e.score}</p>)}
        </div>
      )}
      {d.projects.some((p) => p.name) && (
        <div><SectionTitle>Projects</SectionTitle>
          {d.projects.map((p, i) => <p key={i} className="text-xs"><b>{p.name}</b> — {p.tech}</p>)}
        </div>
      )}
      {d.achievements.some(Boolean) && <div><SectionTitle>Achievements</SectionTitle><ul className="list-disc ml-4 text-xs">{d.achievements.filter(Boolean).map((a, i) => <li key={i}>{a}</li>)}</ul></div>}
    </div>
  </div>
);

export const AcademicPreview: React.FC<{ d: ResumeData }> = ({ d }) => (
  <div className="bg-white text-gray-900 rounded-xl border p-7 font-serif max-w-3xl mx-auto shadow space-y-3">
    <div className="border-b pb-2"><h2 className="text-lg font-bold">{d.basics.fullName || 'Your Name'}</h2><Contact d={d} /></div>
    {d.summary && <div><p className="text-[11px] font-bold uppercase text-gray-500">Research Interests</p><p className="text-xs italic">{d.summary}</p></div>}
    {d.education.some((e) => e.school || e.degree) && (
      <div><p className="text-[11px] font-bold uppercase text-gray-500">Education</p>
        {d.education.map((e, i) => <p key={i} className="text-xs">{e.degree}, {e.school} ({e.year}) — {e.score}</p>)}</div>
    )}
    {d.projects.some((p) => p.name) && (
      <div><p className="text-[11px] font-bold uppercase text-gray-500">Publications & Projects</p>
        {d.projects.map((p, i) => (
          <div key={i} className="mb-1"><p className="text-xs"><b>{p.name}</b>. <i>{p.tech}</i> {p.link}</p>
            <ul className="list-disc ml-4 text-xs">{p.bullets.filter(Boolean).map((bl, j) => <li key={j}>{bl}</li>)}</ul></div>
        ))}
      </div>
    )}
    {d.experience.some((x) => x.role || x.company) && (
      <div><p className="text-[11px] font-bold uppercase text-gray-500">Research / Work Experience</p>
        {d.experience.map((x, i) => <p key={i} className="text-xs"><b>{x.role}</b>, {x.company} ({x.dates})</p>)}</div>
    )}
    <div><p className="text-[11px] font-bold uppercase text-gray-500">Skills</p>
      <p className="text-xs">{[d.skills.languages, d.skills.frameworks, d.skills.tools, d.skills.other].filter(Boolean).join('; ')}</p></div>
    {d.achievements.some(Boolean) && <div><p className="text-[11px] font-bold uppercase text-gray-500">Honors</p><ul className="list-disc ml-4 text-xs">{d.achievements.filter(Boolean).map((a, i) => <li key={i}>{a}</li>)}</ul></div>}
    {d.certifications.some(Boolean) && <div><p className="text-[11px] font-bold uppercase text-gray-500">Certifications</p><p className="text-xs">{d.certifications.filter(Boolean).join(', ')}</p></div>}
  </div>
);

export const MinimalAtsPreview: React.FC<{ d: ResumeData }> = ({ d }) => (
  <div className="bg-white text-gray-900 rounded-xl border p-8 max-w-3xl mx-auto shadow space-y-4" style={{ fontFamily: 'Inter, sans-serif' }}>
    <div><h2 className="text-2xl font-light">{d.basics.fullName || 'Your Name'}</h2><p className="text-xs text-gray-500 mt-1">{[d.basics.email, d.basics.phone, d.basics.location].filter(Boolean).join('  •  ')}</p>
      <p className="text-xs text-gray-500">{[d.basics.linkedin, d.basics.github, d.basics.portfolio].filter(Boolean).join('  •  ')}</p></div>
    {d.summary && <p className="text-[13px] leading-relaxed text-gray-700">{d.summary}</p>}
    {d.experience.some((x) => x.role || x.company) && (
      <div className="space-y-2">{d.experience.map((x, i) => (
        <div key={i}><p className="text-sm font-semibold">{x.role} <span className="font-normal text-gray-500">@ {x.company} · {x.dates}</span></p>
          <ul className="text-[13px] text-gray-700 space-y-0.5">{x.bullets.filter(Boolean).map((bl, j) => <li key={j}>— {bl}</li>)}</ul></div>
      ))}</div>
    )}
    {d.projects.some((p) => p.name) && (
      <div className="space-y-1">{d.projects.map((p, i) => <p key={i} className="text-[13px]"><b>{p.name}</b> <span className="text-gray-500">{p.tech}</span></p>)}</div>
    )}
    <p className="text-[13px] text-gray-700">{[d.skills.languages, d.skills.frameworks, d.skills.tools, d.skills.other].filter(Boolean).join('  •  ')}</p>
    {d.education.some((e) => e.school || e.degree) && (
      <div>{d.education.map((e, i) => <p key={i} className="text-[13px] text-gray-700">{e.degree}, {e.school} ({e.year})</p>)}</div>
    )}
    {d.achievements.some(Boolean) && <ul className="text-[13px] text-gray-700">{d.achievements.filter(Boolean).map((a, i) => <li key={i}>— {a}</li>)}</ul>}
  </div>
);
