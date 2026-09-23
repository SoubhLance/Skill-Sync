import type { ResumeData, ResumeTemplateId } from './resumeTypes';

export const RESUME_TEMPLATES: { id: ResumeTemplateId; name: string; category: string; description: string; hasPhoto: boolean }[] = [
  { id: 'classic-jake', name: 'Classic LaTeX', category: 'Jake style / ATS', description: 'Single column, section rules, no photo. The Overleaf classic.', hasPhoto: false },
  { id: 'two-col-photo', name: 'Two-Column + Photo', category: 'Sidebar / Modern', description: 'Sidebar with photo, contact, skills. Main column experience.', hasPhoto: true },
  { id: 'academic-cv', name: 'Academic CV', category: 'AI / Research', description: 'Dense single column, publications & projects emphasized.', hasPhoto: false },
  { id: 'minimal-ats', name: 'Minimal ATS-Safe', category: 'General / Fresher', description: 'No graphics, generous whitespace, parser-friendly.', hasPhoto: false },
];

export function escapeLatex(s: string): string {
  return (s || '')
    .replace(/\\/g, '\\textbackslash{}')
    .replace(/&/g, '\\&')
    .replace(/%/g, '\\%')
    .replace(/\$/g, '\\$')
    .replace(/#/g, '\\#')
    .replace(/_/g, '\\_')
    .replace(/{/g, '\\{')
    .replace(/}/g, '\\}');
}

function bullets(items: string[]): string {
  const clean = items.map((i) => (i || '').trim()).filter(Boolean);
  if (!clean.length) return '';
  return '\\begin{itemize}\n' + clean.map((i) => `\\item ${escapeLatex(i)}\n`).join('') + '\\end{itemize}\n';
}

export function generateLatex(templateId: ResumeTemplateId, d: ResumeData): string {
  const b = d.basics;
  const header = `${escapeLatex(b.fullName)}\n${escapeLatex(b.email)} $|$ ${escapeLatex(b.phone)} $|$ ${escapeLatex(b.location)}\n`;
  const linkParts: string[] = [];
  if (b.linkedin) linkParts.push('\\href{' + b.linkedin + '}{LinkedIn}');
  if (b.github) linkParts.push('\\href{' + b.github + '}{GitHub}');
  if (b.portfolio) linkParts.push('\\href{' + b.portfolio + '}{Portfolio}');
  const links = linkParts.join(' \\\\\n');
  const edu = d.education
    .filter((e) => e.school || e.degree)
    .map((e) => `\\textbf{${escapeLatex(e.school)}} -- ${escapeLatex(e.degree)} \\hfill ${escapeLatex(e.year)}\\\\ ${escapeLatex(e.score)}\n\n`)
    .join('');
  const exp = d.experience
    .filter((x) => x.role || x.company)
    .map((x) => `\\textbf{${escapeLatex(x.role)}} @ ${escapeLatex(x.company)} \\hfill ${escapeLatex(x.dates)}\n${bullets(x.bullets)}\n`)
    .join('');
  const proj = d.projects
    .filter((p) => p.name)
    .map((p) => `\\textbf{${escapeLatex(p.name)}} ${escapeLatex(p.tech)}${p.link ? ' \\\\href{' + p.link + '}{Link}' : ''}\n${bullets(p.bullets)}\n`)
    .join('');
  const skillBits = [
    d.skills.languages ? `\\textbf{Languages:} ${escapeLatex(d.skills.languages)}` : '',
    d.skills.frameworks ? `\\textbf{Frameworks:} ${escapeLatex(d.skills.frameworks)}` : '',
    d.skills.tools ? `\\textbf{Tools:} ${escapeLatex(d.skills.tools)}` : '',
    d.skills.other ? `\\textbf{Other:} ${escapeLatex(d.skills.other)}` : '',
  ].filter(Boolean);
  const skills = skillBits.join(' \\\\\n');
  const ach = bullets(d.achievements);
  const cert = d.certifications.map((c) => (c || '').trim()).filter(Boolean).join(', ');

  const preamble =
    templateId === 'classic-jake'
      ? '\\usepackage[margin=0.6in]{geometry}\n\\usepackage{hyperref}\n\\usepackage{enumitem}\n\\setlist[itemize]{nosep,leftmargin=*}\n'
      : templateId === 'two-col-photo'
        ? '\\usepackage[margin=0.5in]{geometry}\n\\usepackage{hyperref}\n\\usepackage{paracol}\n% NOTE: replace photofile with your photo, e.g. \\includegraphics[width=2.2cm]{photo.jpg}\n'
        : templateId === 'academic-cv'
          ? '\\usepackage[margin=0.7in]{geometry}\n\\usepackage{hyperref}\n\\usepackage{enumitem}\n'
          : '\\usepackage[margin=0.75in]{geometry}\n\\usepackage[hidelinks]{hyperref}\n% ATS-safe: no tables, no graphics, standard fonts\n';

  return (
    `% ${templateId} resume — paste into Overleaf (pdfLaTeX) and compile\n` +
    '\\documentclass[11pt]{article}\n' + preamble + '\\begin{document}\n\n' +
    `\\begin{center}\n{\\LARGE \\bfseries ${header}}\n${links}\n\\end{center}\n\n` +
    (d.summary.trim() ? `\\section*{Summary}\n${escapeLatex(d.summary)}\n\n` : '') +
    (edu ? `\\section*{Education}\n${edu}\n` : '') +
    (exp ? `\\section*{Experience}\n${exp}\n` : '') +
    (proj ? `\\section*{Projects}\n${proj}\n` : '') +
    (skills ? `\\section*{Skills}\n${skills}\n\n` : '') +
    (ach ? `\\section*{Achievements}\n${ach}\n` : '') +
    (cert ? `\\section*{Certifications}\n${escapeLatex(cert)}\n\n` : '') +
    '\\end{document}\n'
  );
}
